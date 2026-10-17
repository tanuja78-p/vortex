"""
Remediation router.
POST /api/remediation/          — teacher assigns a remediation set
GET  /api/remediation/batch/{batch_id}   — all sets for a batch
GET  /api/remediation/student/{student_id} — sets assigned to a student
POST /api/remediation/{set_id}/complete  — student marks set as completed
GET  /api/teacher/weak-priority/{batch_id} — ranked weak-concept priority list
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
from datetime import datetime

from ..database import get_db
from ..models import (
    Student, Concept, ConceptMastery, RemediationSet
)
from ..schemas import (
    RemediationSetCreate, RemediationSetOut, WeakConceptPriority
)

router = APIRouter(tags=["remediation"])


def _mastery_out(rs: RemediationSet) -> RemediationSetOut:
    return RemediationSetOut(
        id          = rs.id,
        teacher_id  = rs.teacher_id,
        batch_id    = rs.batch_id,
        concept_ids = json.loads(rs.concept_ids),
        student_ids = json.loads(rs.student_ids),
        title       = rs.title,
        description = rs.description or "",
        created_at  = rs.created_at,
        due_at      = rs.due_at,
        completed_by= json.loads(rs.completed_by) if rs.completed_by else [],
    )


@router.post("/api/remediation", response_model=RemediationSetOut)
def create_remediation_set(payload: RemediationSetCreate, db: Session = Depends(get_db)):
    rs = RemediationSet(
        teacher_id   = payload.teacher_id,
        batch_id     = payload.batch_id,
        concept_ids  = json.dumps(payload.concept_ids),
        student_ids  = json.dumps(payload.student_ids),
        title        = payload.title,
        description  = payload.description or "",
        due_at       = payload.due_at,
        created_at   = datetime.utcnow(),
        completed_by = "[]",
    )
    db.add(rs)
    db.commit()
    db.refresh(rs)
    return _mastery_out(rs)


@router.get("/api/remediation/batch/{batch_id}", response_model=List[RemediationSetOut])
def get_remediation_for_batch(batch_id: str, db: Session = Depends(get_db)):
    sets = db.query(RemediationSet).filter(RemediationSet.batch_id == batch_id).all()
    return [_mastery_out(rs) for rs in sets]


@router.get("/api/remediation/student/{student_id}", response_model=List[RemediationSetOut])
def get_remediation_for_student(student_id: str, db: Session = Depends(get_db)):
    sets = db.query(RemediationSet).all()
    result = []
    for rs in sets:
        ids = json.loads(rs.student_ids) if rs.student_ids else []
        if student_id in ids:
            result.append(_mastery_out(rs))
    return result


@router.post("/api/remediation/{set_id}/complete")
def complete_remediation(set_id: int, student_id: str, db: Session = Depends(get_db)):
    rs = db.query(RemediationSet).filter(RemediationSet.id == set_id).first()
    if not rs:
        raise HTTPException(status_code=404, detail="Remediation set not found")
    completed = json.loads(rs.completed_by) if rs.completed_by else []
    if student_id not in completed:
        completed.append(student_id)
    rs.completed_by = json.dumps(completed)
    db.commit()
    return {"status": "ok"}


@router.get("/api/teacher/weak-priority/{batch_id}", response_model=List[WeakConceptPriority])
def get_weak_priority(batch_id: str, db: Session = Depends(get_db)):
    """Returns a ranked list of concepts that are weak for most students in a batch."""
    students  = db.query(Student).filter(Student.batch_id == batch_id).all()
    concepts  = db.query(Concept).all()
    masteries = db.query(ConceptMastery).all()

    student_ids  = {s.id for s in students}
    total_students = len(student_ids)
    if total_students == 0:
        return []

    priority = []
    for c in concepts:
        c_masteries = [
            m for m in masteries
            if m.concept_id == c.id and m.student_id in student_ids
        ]
        weak = [m for m in c_masteries if m.state in ("Not Understood", "Needs Practice")]
        if not weak:
            continue
        avg_score = sum(m.score for m in c_masteries) / max(1, len(c_masteries))
        priority.append(WeakConceptPriority(
            concept_id         = c.id,
            concept_name       = c.name,
            category           = c.category,
            weak_student_count = len(weak),
            total_students     = total_students,
            weak_pct           = round(len(weak) / total_students, 3),
            avg_score          = round(avg_score, 3),
        ))

    priority.sort(key=lambda x: (-x.weak_student_count, x.avg_score))
    return priority
