"""
Proctor console router.
GET /api/proctor/{batch_id}           — live tile status + cluster alert status
GET /api/proctor/{batch_id}/security  — hard security events (separate log)
POST /api/proctor/{batch_id}/pause    — pause a test (marks batch-level flag)
POST /api/proctor/event               — student session event ingest
GET  /api/proctor/session/{student_id}/{problem_id} — full recorded session timeline
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import json

from ..database import get_db
from ..models import Student, SessionEvent, ReviewItem, SecurityEvent, CodingSubmission
from ..schemas import (
    ProctorConsoleOut, ProctorTileStatus, ClusterAlertOut,
    SessionEventIn, SecurityEventOut
)

router = APIRouter(prefix="/api/proctor", tags=["proctor"])

CLUSTER_THRESHOLD = 0.20   # 20 % of active students → cluster alert
ROLLING_WINDOW_MINUTES = 10


@router.post("/event")
def ingest_event(payload: SessionEventIn, db: Session = Depends(get_db)):
    """Receives a single student session event and persists it."""
    ev = SessionEvent(
        student_id = payload.student_id,
        problem_id = payload.problem_id,
        event_type = payload.event_type,
        timestamp  = payload.timestamp or datetime.utcnow(),
        payload    = json.dumps(payload.payload or {}),
    )
    db.add(ev)
    db.commit()
    return {"status": "ok"}


@router.get("/{batch_id}", response_model=ProctorConsoleOut)
def get_proctor_console(batch_id: str, db: Session = Depends(get_db)):
    """Returns the live tile grid and cluster-alert status for a batch."""
    students = db.query(Student).filter(Student.batch_id == batch_id).all()
    if not students:
        raise HTTPException(status_code=404, detail="Batch not found or has no students")

    cutoff  = datetime.utcnow() - timedelta(minutes=ROLLING_WINDOW_MINUTES)
    tiles   = []
    flagged = 0

    for s in students:
        # Latest session event for this student
        latest_ev = (
            db.query(SessionEvent)
            .filter(SessionEvent.student_id == s.id)
            .order_by(SessionEvent.timestamp.desc())
            .first()
        )
        # Pending individual flags (not cluster)
        flag_count = (
            db.query(ReviewItem)
            .filter(
                ReviewItem.student_id == s.id,
                ReviewItem.status == "Pending Review",
                ReviewItem.is_cluster_flag == False,
            )
            .count()
        )
        # Status inference from latest event
        if latest_ev is None:
            status = "idle"
        elif latest_ev.event_type == "tab_away":
            status = "tab_away"
        elif latest_ev.event_type == "run":
            status = "running_code"
        elif latest_ev.event_type in ("edit", "paste"):
            status = "typing"
        else:
            status = "idle"

        # Was this student flagged in the rolling window?
        recent_flag = (
            db.query(ReviewItem)
            .filter(
                ReviewItem.student_id == s.id,
                ReviewItem.flagged_at >= cutoff,
                ReviewItem.status == "Pending Review",
            )
            .first()
        )
        if recent_flag:
            flagged += 1

        tiles.append(ProctorTileStatus(
            student_id    = s.id,
            student_name  = s.name,
            status        = status,
            flag_count    = flag_count,
            last_event_at = latest_ev.timestamp if latest_ev else None,
        ))

    active_students = len(students)
    cluster_rate    = flagged / max(1, active_students)
    cluster_alert   = None
    health          = "normal"

    if cluster_rate >= CLUSTER_THRESHOLD:
        health = "critical" if cluster_rate >= 0.35 else "elevated"
        cluster_alert = ClusterAlertOut(
            batch_id         = batch_id,
            cluster_rate     = round(cluster_rate, 3),
            threshold        = CLUSTER_THRESHOLD,
            active_students  = active_students,
            flagged_students = flagged,
            likely_causes    = [
                "Possible collusion or shared answer",
                "Systemic false positive (network outage, starter-code paste pattern)",
                "Confusing or broken question",
            ],
            fired_at  = datetime.utcnow(),
            is_active = True,
        )

    return ProctorConsoleOut(
        batch_id         = batch_id,
        tiles            = tiles,
        cluster_alert    = cluster_alert,
        health_indicator = health,
    )


@router.get("/session/{student_id}/{problem_id}")
def get_session_recording(student_id: str, problem_id: str, db: Session = Depends(get_db)):
    """Returns the full timestamped session recording for replay."""
    events = (
        db.query(SessionEvent)
        .filter(
            SessionEvent.student_id == student_id,
            SessionEvent.problem_id == problem_id,
        )
        .order_by(SessionEvent.timestamp.asc())
        .all()
    )
    return [
        {
            "event_type": ev.event_type,
            "timestamp":  ev.timestamp.isoformat(),
            "payload":    json.loads(ev.payload) if ev.payload else {},
        }
        for ev in events
    ]


@router.get("/{batch_id}/security", response_model=List[SecurityEventOut])
def get_security_events(batch_id: str, db: Session = Depends(get_db)):
    """Returns hard security events (sandbox escapes, etc.) — separate from review queue."""
    student_ids = [
        s.id for s in db.query(Student).filter(Student.batch_id == batch_id).all()
    ]
    events = (
        db.query(SecurityEvent)
        .filter(SecurityEvent.student_id.in_(student_ids))
        .order_by(SecurityEvent.occurred_at.desc())
        .all()
    )
    return [
        SecurityEventOut(
            id          = ev.id,
            student_id  = ev.student_id,
            problem_id  = ev.problem_id,
            event_type  = ev.event_type,
            description = ev.description,
            occurred_at = ev.occurred_at,
        )
        for ev in events
    ]


@router.post("/{batch_id}/pause")
def pause_test(batch_id: str, db: Session = Depends(get_db)):
    """Teacher pauses the test for the whole batch (creates a cluster-level ReviewItem)."""
    students = db.query(Student).filter(Student.batch_id == batch_id).all()
    if not students:
        raise HTTPException(status_code=404, detail="Batch not found")

    item = ReviewItem(
        student_id       = students[0].id,   # representative record
        flag_type        = "Batch Test Paused by Teacher",
        severity         = "High",
        evidence_details = json.dumps({"batch_id": batch_id, "action": "pause"}),
        status           = "Pending Review",
        is_cluster_flag  = True,
        batch_id         = batch_id,
    )
    db.add(item)
    db.commit()
    return {"status": "paused", "batch_id": batch_id}
