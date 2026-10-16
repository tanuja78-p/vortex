from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
from datetime import datetime
from ..database import get_db
from ..models import VivaSession, CodingSubmission, CodingProblem, Student, ReviewItem, Concept
from ..schemas import (
    VivaSessionCreateRequest, VivaSessionResponse, VivaQuestionItem,
    VivaSubmitRequest, VivaEvaluationResponse
)
from ..viva_engine import generate_viva_questions, evaluate_viva_deterministic

router = APIRouter(prefix="/api/viva", tags=["viva"])

@router.post("/start", response_model=VivaSessionResponse)
def start_viva_session(payload: VivaSessionCreateRequest, db: Session = Depends(get_db)):
    sub = db.query(CodingSubmission).filter(CodingSubmission.id == payload.submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    problem = db.query(CodingProblem).filter(CodingProblem.id == payload.problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Coding problem not found")

    concept = db.query(Concept).filter(Concept.id == problem.concept_id).first()
    concept_name = concept.name if concept else "core algorithms"

    questions_list = generate_viva_questions(problem.title, concept_name)

    viva = VivaSession(
        submission_id=sub.id,
        student_id=payload.student_id,
        problem_id=problem.id,
        questions=json.dumps(questions_list),
        responses="[]",
        evaluation="{}",
        is_evaluated=False
    )
    db.add(viva)
    db.commit()
    db.refresh(viva)

    return VivaSessionResponse(
        session_id=viva.id,
        submission_id=sub.id,
        problem_id=problem.id,
        problem_title=problem.title,
        student_code=sub.code,
        questions=[
            VivaQuestionItem(
                id=q["id"],
                prompt=q["prompt"],
                category=q["category"]
            ) for q in questions_list
        ],
        is_evaluated=False
    )

@router.post("/submit", response_model=VivaEvaluationResponse)
def submit_viva_session(payload: VivaSubmitRequest, db: Session = Depends(get_db)):
    viva = db.query(VivaSession).filter(VivaSession.id == payload.session_id).first()
    if not viva:
        raise HTTPException(status_code=404, detail="Viva session not found")

    sub = db.query(CodingSubmission).filter(CodingSubmission.id == viva.submission_id).first()
    student_code = sub.code if sub else ""

    ans_list = [{"question_id": a.question_id, "response_text": a.response_text} for a in payload.answers]
    
    # Evaluate via deterministic rubric evaluator
    eval_result = evaluate_viva_deterministic(
        student_code=student_code,
        responses=ans_list
    )

    viva.responses = json.dumps(ans_list)
    viva.evaluation = json.dumps(eval_result)
    viva.is_evaluated = True
    db.commit()

    # Check if discrepancy warrants queuing for human teacher review
    if eval_result.get("discrepancy_flagged"):
        problem = db.query(CodingProblem).filter(CodingProblem.id == viva.problem_id).first()
        problem_title = problem.title if problem else "Coding Assessment"

        existing_review = db.query(ReviewItem).filter(
            ReviewItem.viva_session_id == viva.id
        ).first()

        if not existing_review:
            review_item = ReviewItem(
                student_id=viva.student_id,
                submission_id=viva.submission_id,
                viva_session_id=viva.id,
                problem_title=problem_title,
                flag_type="Viva-Code Logic Mismatch",
                severity="High",
                evidence_details=json.dumps({
                    "viva_score": eval_result.get("viva_score"),
                    "viva_rating": eval_result.get("rating"),
                    "discrepancy_reason": eval_result.get("discrepancy_reason"),
                    "feedback": eval_result.get("summary_feedback"),
                    "policy_notice": "Automated system cannot declare dishonesty. Educator review required to conduct follow-up oral interview."
                }),
                status="Pending Review",
                teacher_notes="",
                reviewer_name=""
            )
            db.add(review_item)
            db.commit()

    return VivaEvaluationResponse(
        session_id=viva.id,
        viva_score=eval_result["viva_score"],
        rating=eval_result["rating"],
        summary_feedback=eval_result["summary_feedback"],
        rubric_scores=eval_result["rubric_scores"],
        follow_up_recommended=eval_result["follow_up_recommended"],
        discrepancy_flagged=eval_result["discrepancy_flagged"]
    )
