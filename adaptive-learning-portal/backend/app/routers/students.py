from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
from ..database import get_db
from ..models import Student, Concept, ConceptMastery, QuizAttempt
from ..schemas import StudentBase, StudentDetail, ConceptMasteryOut
from ..adaptive_engine import get_student_weak_concepts, apply_mastery_decay

router = APIRouter(prefix="/api/students", tags=["students"])

@router.get("", response_model=List[StudentBase])
def get_students(db: Session = Depends(get_db)):
    students = db.query(Student).all()
    return students

@router.get("/{student_id}", response_model=StudentDetail)
def get_student_detail(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Apply mastery decay on every load (forgetting curve)
    apply_mastery_decay(db, student_id)

    # Fetch all concepts and masteries
    concepts = db.query(Concept).all()
    concept_map = {c.id: c for c in concepts}
    
    masteries = db.query(ConceptMastery).filter(ConceptMastery.student_id == student_id).all()
    mastery_dict = {m.concept_id: m for m in masteries}

    mastery_breakdown = []
    total_score = 0.0
    assessed_count = 0
    total_attempts = 0
    total_correct = 0

    for c in concepts:
        m = mastery_dict.get(c.id)
        if m:
            total_attempts += m.attempts_count
            total_correct += m.correct_count
            if m.attempts_count > 0:
                total_score += m.score
                assessed_count += 1
            mastery_breakdown.append(ConceptMasteryOut(
                concept_id=c.id,
                concept_name=c.name,
                category=c.category,
                score=m.score,
                state=m.state,
                attempts_count=m.attempts_count,
                correct_count=m.correct_count,
                last_assessed_at=m.last_assessed_at
            ))
        else:
            mastery_breakdown.append(ConceptMasteryOut(
                concept_id=c.id,
                concept_name=c.name,
                category=c.category,
                score=0.0,
                state="Not Assessed",
                attempts_count=0,
                correct_count=0,
                last_assessed_at=None
            ))

    overall_mastery = round((total_score / max(1, assessed_count)) * 100, 1) if assessed_count > 0 else 0.0
    accuracy = round((total_correct / max(1, total_attempts)) * 100, 1) if total_attempts > 0 else 0.0

    weak = [mb.concept_name for mb in mastery_breakdown if mb.state in ["Not Understood", "Needs Practice"]]

    return StudentDetail(
        id=student.id,
        name=student.name,
        email=student.email,
        avatar=student.avatar or "",
        overall_mastery=overall_mastery,
        accuracy_percentage=accuracy,
        total_attempts=total_attempts,
        weak_concepts=weak,
        mastery_breakdown=mastery_breakdown
    )

@router.get("/{student_id}/weak-concepts")
def get_weak_concepts_endpoint(student_id: str, db: Session = Depends(get_db)):
    weak = get_student_weak_concepts(db, student_id)
    concepts = {c.id: c.name for c in db.query(Concept).all()}
    return [
        {
            "concept_id": w.concept_id,
            "concept_name": concepts.get(w.concept_id, w.concept_id),
            "state": w.state,
            "score": w.score,
            "attempts": w.attempts_count
        } for w in weak
    ]
