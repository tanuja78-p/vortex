"""
Onboarding router.
POST /api/onboarding/submit   — saves concepts_known, concepts_to_learn, marks onboarding_done.
GET  /api/onboarding/concepts — lists all available concepts for the onboarding picker.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Student, Concept, ConceptMastery
from ..schemas import OnboardingSubmit, ConceptOut
from typing import List
import json

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])

@router.get("/concepts", response_model=List[ConceptOut])
def list_concepts_for_onboarding(db: Session = Depends(get_db)):
    concepts = db.query(Concept).all()
    result = []
    for c in concepts:
        prereqs = json.loads(c.prerequisites) if c.prerequisites else []
        result.append(ConceptOut(
            id=c.id, name=c.name, category=c.category,
            difficulty=c.difficulty, prerequisites=prereqs,
            description=c.description, state="Not Assessed", score=0.0
        ))
    return result

@router.post("/submit")
def submit_onboarding(payload: OnboardingSubmit, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student.concepts_known    = json.dumps(payload.concepts_known)
    student.concepts_to_learn = json.dumps(payload.concepts_to_learn)
    student.onboarding_done   = True
    student.is_first_login    = False

    # Pre-mark known concepts as "Solid" with score=0.8
    for cid in payload.concepts_known:
        existing = db.query(ConceptMastery).filter(
            ConceptMastery.student_id == payload.student_id,
            ConceptMastery.concept_id == cid
        ).first()
        if not existing:
            db.add(ConceptMastery(
                student_id=payload.student_id,
                concept_id=cid,
                score=0.8,
                state="Solid",
                attempts_count=0,
                correct_count=0,
            ))
        else:
            existing.score = max(existing.score, 0.8)
            existing.state = "Solid"

    db.commit()
    return {"status": "ok", "message": "Onboarding complete"}
