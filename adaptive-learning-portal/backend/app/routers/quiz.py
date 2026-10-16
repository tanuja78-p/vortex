from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
from ..database import get_db
from ..models import QuizQuestion, QuizAttempt, Concept, ConceptMastery, Student
from ..schemas import (
    QuizQuestionOut, QuizSubmitRequest, QuizSubmitResponse,
    QuestionResult, ConceptMasteryOut
)
from ..adaptive_engine import (
    update_student_mastery_for_question,
    select_adaptive_questions,
    get_student_weak_concepts
)

router = APIRouter(prefix="/api/quiz", tags=["quiz"])

@router.get("/diagnostic", response_model=List[QuizQuestionOut])
def get_diagnostic_quiz(db: Session = Depends(get_db)):
    questions = db.query(QuizQuestion).filter(QuizQuestion.question_type == "diagnostic").all()
    concept_map = {c.id: c.name for c in db.query(Concept).all()}
    
    return [
        QuizQuestionOut(
            id=q.id,
            concept_id=q.concept_id,
            concept_name=concept_map.get(q.concept_id, ""),
            title=q.title,
            prompt=q.prompt,
            code_snippet=q.code_snippet,
            options=json.loads(q.options),
            difficulty=q.difficulty,
            question_type=q.question_type
        ) for q in questions
    ]

@router.get("/adaptive/{student_id}", response_model=List[QuizQuestionOut])
def get_adaptive_quiz(student_id: str, limit: int = 5, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    questions = select_adaptive_questions(db, student_id, limit=limit)
    concept_map = {c.id: c.name for c in db.query(Concept).all()}

    return [
        QuizQuestionOut(
            id=q.id,
            concept_id=q.concept_id,
            concept_name=concept_map.get(q.concept_id, ""),
            title=q.title,
            prompt=q.prompt,
            code_snippet=q.code_snippet,
            options=json.loads(q.options),
            difficulty=q.difficulty,
            question_type=q.question_type
        ) for q in questions
    ]

@router.post("/submit", response_model=QuizSubmitResponse)
def submit_quiz(payload: QuizSubmitRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    total = len(payload.answers)
    if total == 0:
        raise HTTPException(status_code=400, detail="No answers submitted")

    correct_count = 0
    results: List[QuestionResult] = []
    concept_map = {c.id: c.name for c in db.query(Concept).all()}

    # Evaluate each submitted answer
    for ans in payload.answers:
        q = db.query(QuizQuestion).filter(QuizQuestion.id == ans.question_id).first()
        if not q:
            continue

        is_correct = (ans.selected_index == q.correct_index)
        if is_correct:
            correct_count += 1

        # Update mastery in SQLite via adaptive engine
        update_student_mastery_for_question(db, student.id, q.concept_id, is_correct)

        results.append(QuestionResult(
            question_id=q.id,
            concept_id=q.concept_id,
            concept_name=concept_map.get(q.concept_id, q.concept_id),
            selected_index=ans.selected_index,
            correct_index=q.correct_index,
            is_correct=is_correct,
            explanation=q.explanation
        ))

    score_pct = round((correct_count / total) * 100, 1)

    # Record attempt
    attempt = QuizAttempt(
        student_id=student.id,
        quiz_type=payload.quiz_type,
        score=score_pct,
        total_questions=total,
        correct_answers=correct_count,
        answers_payload=json.dumps([r.model_dump() for r in results])
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    # Fetch updated concept masteries
    masteries = db.query(ConceptMastery).filter(ConceptMastery.student_id == student.id).all()
    concepts = db.query(Concept).all()
    c_by_id = {c.id: c for c in concepts}

    updated_mastery = [
        ConceptMasteryOut(
            concept_id=m.concept_id,
            concept_name=c_by_id[m.concept_id].name if m.concept_id in c_by_id else m.concept_id,
            category=c_by_id[m.concept_id].category if m.concept_id in c_by_id else "",
            score=m.score,
            state=m.state,
            attempts_count=m.attempts_count,
            correct_count=m.correct_count,
            last_assessed_at=m.last_assessed_at
        ) for m in masteries
    ]

    weak = [m.concept_name for m in updated_mastery if m.state in ["Not Understood", "Needs Practice"]]
    recommended = weak[0] if weak else "Advanced Programming Concepts"

    return QuizSubmitResponse(
        attempt_id=attempt.id,
        score_percentage=score_pct,
        total_questions=total,
        correct_answers=correct_count,
        results=results,
        updated_mastery=updated_mastery,
        weak_concepts=weak,
        recommended_focus=recommended
    )
