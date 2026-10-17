from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
from ..database import get_db
from ..models import QuizQuestion, QuizAttempt, Concept, ConceptMastery, Student
from ..schemas import (
    QuizQuestionOut, QuizSubmitRequest, QuizSubmitResponse,
    QuestionResult, ConceptMasteryOut, AdaptiveComparisonResponse,
    StudentAdaptivePath, AdaptiveQuestionItem
)
from ..adaptive_engine import (
    update_student_mastery_for_question,
    select_adaptive_questions,
    select_adaptive_questions_with_reasons,
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

    items = select_adaptive_questions_with_reasons(db, student_id, limit=limit)
    concept_map = {c.id: c.name for c in db.query(Concept).all()}

    return [
        QuizQuestionOut(
            id=it["question"].id,
            concept_id=it["question"].concept_id,
            concept_name=concept_map.get(it["question"].concept_id, ""),
            title=it["question"].title,
            prompt=it["question"].prompt,
            code_snippet=it["question"].code_snippet,
            options=json.loads(it["question"].options),
            difficulty=it["question"].difficulty,
            question_type=it["question"].question_type,
            selection_reason=it.get("selection_reason"),
            target_concept_state=it.get("target_concept_state"),
            target_concept_score=it.get("target_concept_score"),
            strategy=it.get("strategy")
        ) for it in items
    ]

@router.get("/adaptive-compare", response_model=AdaptiveComparisonResponse)
def get_adaptive_comparison(
    student_a_id: str = "s1",
    student_b_id: str = "s2",
    concept_filter: str = None,
    limit: int = 4,
    db: Session = Depends(get_db)
):
    student_a = db.query(Student).filter(Student.id == student_a_id).first()
    student_b = db.query(Student).filter(Student.id == student_b_id).first()
    if not student_a or not student_b:
        raise HTTPException(status_code=404, detail="One or both students not found")

    concept_map = {c.id: c.name for c in db.query(Concept).all()}

    # Calculate overall mastery for students
    def compute_student_summary(st: Student):
        masteries = db.query(ConceptMastery).filter(ConceptMastery.student_id == st.id).all()
        if not masteries:
            return 0.0, "New Student (Diagnostic Incomplete)"
        avg = round(sum(m.score for m in masteries) / len(masteries), 2)
        weak_cnt = sum(1 for m in masteries if m.state in ["Not Understood", "Needs Practice"])
        solid_cnt = sum(1 for m in masteries if m.state == "Solid")
        status = f"{solid_cnt} Solid, {weak_cnt} Needing Remediation"
        return avg, status

    avg_a, status_a = compute_student_summary(student_a)
    avg_b, status_b = compute_student_summary(student_b)

    items_a = select_adaptive_questions_with_reasons(db, student_a_id, limit=limit, concept_filter=concept_filter)
    items_b = select_adaptive_questions_with_reasons(db, student_b_id, limit=limit, concept_filter=concept_filter)

    def to_adaptive_item(it) -> AdaptiveQuestionItem:
        q = it["question"]
        return AdaptiveQuestionItem(
            question=QuizQuestionOut(
                id=q.id,
                concept_id=q.concept_id,
                concept_name=concept_map.get(q.concept_id, ""),
                title=q.title,
                prompt=q.prompt,
                code_snippet=q.code_snippet,
                options=json.loads(q.options),
                difficulty=q.difficulty,
                question_type=q.question_type,
                selection_reason=it.get("selection_reason"),
                target_concept_state=it.get("target_concept_state"),
                target_concept_score=it.get("target_concept_score"),
                strategy=it.get("strategy")
            ),
            selection_reason=it.get("selection_reason", ""),
            target_concept_id=it.get("target_concept_id", q.concept_id),
            target_concept_name=it.get("target_concept_name", concept_map.get(q.concept_id, "")),
            target_concept_state=it.get("target_concept_state", "Not Assessed"),
            target_concept_score=it.get("target_concept_score", 0.0),
            strategy=it.get("strategy", "General")
        )

    path_a = [to_adaptive_item(it) for it in items_a]
    path_b = [to_adaptive_item(it) for it in items_b]

    # Calculate divergence percentage
    qids_a = set(it.question.id for it in path_a)
    qids_b = set(it.question.id for it in path_b)
    overlap = len(qids_a.intersection(qids_b))
    total_unique = len(qids_a.union(qids_b))
    divergence = int((1.0 - (overlap / max(1, total_unique))) * 100) if total_unique > 0 else 0

    module_display = concept_map.get(concept_filter, "Core CS201 Algorithms & Data Structures") if concept_filter else "Core CS201 Algorithms & Data Structures"
    exec_summary = (
        f"{divergence}% Path Divergence detected between {student_a.name} ({status_a}) "
        f"and {student_b.name} ({status_b}). The adaptive engine completely individualized the sequence "
        f"based on current concept mastery, serving foundational remediation to {student_a.name} "
        f"and advanced acceleration to {student_b.name}."
    )

    return AdaptiveComparisonResponse(
        module_name=module_display,
        student_a=StudentAdaptivePath(
            student_id=student_a.id,
            student_name=student_a.name,
            avatar=student_a.avatar or "",
            overall_mastery=avg_a,
            status_summary=status_a,
            path=path_a
        ),
        student_b=StudentAdaptivePath(
            student_id=student_b.id,
            student_name=student_b.name,
            avatar=student_b.avatar or "",
            overall_mastery=avg_b,
            status_summary=status_b,
            path=path_b
        ),
        divergence_percentage=divergence,
        executive_summary=exec_summary
    )

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
