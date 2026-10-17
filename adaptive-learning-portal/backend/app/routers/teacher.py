from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json
from datetime import datetime
from ..database import get_db
from ..models import (
    Student, Teacher, Batch, Concept, ConceptMastery, CodingSubmission,
    VivaSession, ReviewItem, CodingProblem
)
from ..schemas import ReviewItemOut, ReviewItemUpdate
from ..adaptive_engine import apply_mastery_decay

router = APIRouter(prefix="/api/teacher", tags=["teacher"])

@router.get("/overview")
def get_teacher_overview(db: Session = Depends(get_db)):
    students = db.query(Student).all()
    concepts = db.query(Concept).all()
    masteries = db.query(ConceptMastery).all()
    review_items = db.query(ReviewItem).all()
    submissions = db.query(CodingSubmission).all()

    # Calculate state distribution
    state_counts = {
        "Solid": 0,
        "Needs Practice": 0,
        "Not Understood": 0,
        "Not Assessed": 0
    }
    for m in masteries:
        if m.state in state_counts:
            state_counts[m.state] += 1
        else:
            state_counts["Not Assessed"] += 1

    # Concepts mastery averages
    concept_stats = []
    for c in concepts:
        c_masteries = [m for m in masteries if m.concept_id == c.id and m.attempts_count > 0]
        avg_score = (sum(m.score for m in c_masteries) / len(c_masteries)) if c_masteries else 0.0
        concept_stats.append({
            "id": c.id,
            "name": c.name,
            "category": c.category,
            "difficulty": c.difficulty,
            "avg_score_pct": round(avg_score * 100, 1),
            "assessed_students_count": len(c_masteries)
        })

    pending_reviews_count = sum(1 for r in review_items if r.status == "Pending Review")

    return {
        "total_students": len(students),
        "total_concepts": len(concepts),
        "total_submissions": len(submissions),
        "pending_human_reviews": pending_reviews_count,
        "mastery_state_distribution": state_counts,
        "concept_analytics": concept_stats
    }

@router.get("/review-queue", response_model=List[ReviewItemOut])
def get_review_queue(status_filter: str = None, db: Session = Depends(get_db)):
    query = db.query(ReviewItem)
    if status_filter and status_filter != "all":
        query = query.filter(ReviewItem.status == status_filter)
    
    items = query.order_by(ReviewItem.flagged_at.desc()).all()
    student_map = {s.id: s.name for s in db.query(Student).all()}

    output = []
    for it in items:
        evidence = json.loads(it.evidence_details) if it.evidence_details else {}
        
        # Fetch associated student code and viva responses for deep educator inspection
        student_code = None
        if it.submission_id:
            sub = db.query(CodingSubmission).filter(CodingSubmission.id == it.submission_id).first()
            if sub:
                student_code = sub.code

        viva_responses = None
        if it.viva_session_id:
            viva = db.query(VivaSession).filter(VivaSession.id == it.viva_session_id).first()
            if viva and viva.responses:
                viva_responses = json.loads(viva.responses)

        output.append(ReviewItemOut(
            id=it.id,
            student_id=it.student_id,
            student_name=student_map.get(it.student_id, it.student_id),
            problem_title=it.problem_title or "Assessment",
            submission_id=it.submission_id,
            viva_session_id=it.viva_session_id,
            flag_type=it.flag_type,
            severity=it.severity,
            evidence_details=evidence,
            status=it.status,
            teacher_notes=it.teacher_notes or "",
            reviewer_name=it.reviewer_name or "",
            flagged_at=it.flagged_at,
            reviewed_at=it.reviewed_at,
            student_code=student_code,
            viva_responses=viva_responses
        ))

    return output

@router.post("/review-queue/{item_id}", response_model=ReviewItemOut)
def update_review_item(item_id: int, payload: ReviewItemUpdate, db: Session = Depends(get_db)):
    item = db.query(ReviewItem).filter(ReviewItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Review item not found")

    item.status = payload.status
    item.teacher_notes = payload.teacher_notes
    item.reviewer_name = payload.reviewer_name
    item.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(item)

    student = db.query(Student).filter(Student.id == item.student_id).first()
    student_name = student.name if student else item.student_id

    student_code = None
    if item.submission_id:
        sub = db.query(CodingSubmission).filter(CodingSubmission.id == item.submission_id).first()
        if sub:
            student_code = sub.code

    viva_responses = None
    if item.viva_session_id:
        viva = db.query(VivaSession).filter(VivaSession.id == item.viva_session_id).first()
        if viva and viva.responses:
            viva_responses = json.loads(viva.responses)

    return ReviewItemOut(
        id=item.id,
        student_id=item.student_id,
        student_name=student_name,
        problem_title=item.problem_title or "Assessment",
        submission_id=item.submission_id,
        viva_session_id=item.viva_session_id,
        flag_type=item.flag_type,
        severity=item.severity,
        evidence_details=json.loads(item.evidence_details) if item.evidence_details else {},
        status=item.status,
        teacher_notes=item.teacher_notes or "",
        reviewer_name=item.reviewer_name or "",
        flagged_at=item.flagged_at,
        reviewed_at=item.reviewed_at,
        student_code=student_code,
        viva_responses=viva_responses
    )
