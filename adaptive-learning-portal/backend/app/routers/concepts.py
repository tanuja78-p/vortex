from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
import json
from ..database import get_db
from ..models import Concept, ConceptMastery
from ..schemas import ConceptOut

router = APIRouter(prefix="/api/concepts", tags=["concepts"])

@router.get("", response_model=List[ConceptOut])
def get_concepts(student_id: str = None, db: Session = Depends(get_db)):
    concepts = db.query(Concept).all()
    mastery_map = {}
    if student_id:
        masteries = db.query(ConceptMastery).filter(ConceptMastery.student_id == student_id).all()
        mastery_map = {m.concept_id: m for m in masteries}

    result = []
    for c in concepts:
        m = mastery_map.get(c.id)
        prereqs = json.loads(c.prerequisites) if c.prerequisites else []
        result.append(ConceptOut(
            id=c.id,
            name=c.name,
            category=c.category,
            difficulty=c.difficulty,
            prerequisites=prereqs,
            description=c.description,
            state=m.state if m else "Not Assessed",
            score=m.score if m else 0.0
        ))
    return result
