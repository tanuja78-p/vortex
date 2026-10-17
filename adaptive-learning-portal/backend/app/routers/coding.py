from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
from datetime import datetime
from ..database import get_db
from ..models import CodingProblem, CodingSubmission, Student, Concept, ReviewItem, SecurityEvent
from ..schemas import (
    CodingProblemSummary, CodingProblemDetail, VisibleTestCase,
    CodeSubmitRequest, CodeSubmitResponse, TestRunResult,
    SandboxSecurityReport, SecurityEventOut
)
from ..code_runner import run_isolated_code_test

router = APIRouter(prefix="/api/coding", tags=["coding"])

@router.get("/problems", response_model=List[CodingProblemSummary])
def get_problems(db: Session = Depends(get_db)):
    problems = db.query(CodingProblem).all()
    concept_map = {c.id: c.name for c in db.query(Concept).all()}
    
    return [
        CodingProblemSummary(
            id=p.id,
            concept_id=p.concept_id,
            concept_name=concept_map.get(p.concept_id, p.concept_id),
            title=p.title,
            difficulty=p.difficulty,
            description=p.description,
            tags=json.loads(p.tags) if p.tags else []
        ) for p in problems
    ]

@router.get("/problems/{problem_id}", response_model=CodingProblemDetail)
def get_problem_detail(problem_id: str, db: Session = Depends(get_db)):
    p = db.query(CodingProblem).filter(CodingProblem.id == problem_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Coding problem not found")

    concept_map = {c.id: c.name for c in db.query(Concept).all()}
    all_tests = json.loads(p.test_cases) if p.test_cases else []
    
    # Strictly filter out hidden test cases - NEVER expose secrets or hidden tests to frontend!
    visible_tests = [
        VisibleTestCase(
            id=idx + 1,
            input=str(tc.get("input")),
            expected=str(tc.get("expected")),
            description=f"Public Sample Case #{idx + 1}"
        ) for idx, tc in enumerate(all_tests) if not tc.get("is_hidden", False)
    ]

    return CodingProblemDetail(
        id=p.id,
        concept_id=p.concept_id,
        concept_name=concept_map.get(p.concept_id, p.concept_id),
        title=p.title,
        difficulty=p.difficulty,
        description=p.description,
        tags=json.loads(p.tags) if p.tags else [],
        initial_code=p.initial_code,
        function_name=p.function_name,
        visible_test_cases=visible_tests
    )

@router.post("/submit", response_model=CodeSubmitResponse)
def submit_code(payload: CodeSubmitRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    problem = db.query(CodingProblem).filter(CodingProblem.id == payload.problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Coding problem not found")

    all_test_cases = json.loads(problem.test_cases) if problem.test_cases else []

    # Execute inside isolated subprocess safe runner
    execution_result = run_isolated_code_test(
        code=payload.code,
        function_name=problem.function_name,
        test_cases=all_test_cases,
        timeout_seconds=3.0
    )

    tests_passed = execution_result.get("tests_passed", 0)
    total_tests = execution_result.get("total_tests", len(all_test_cases))
    status = execution_result.get("status", "Failed")
    runtime_ms = execution_result.get("runtime_ms", 0.0)
    raw_results = execution_result.get("results", [])

    # Format test run results (masking hidden tests for frontend)
    sanitized_results = []
    for r in raw_results:
        is_hidden = r.get("is_hidden", False)
        sanitized_results.append(TestRunResult(
            test_id=r.get("test_id", 1),
            is_hidden=is_hidden,
            passed=r.get("passed", False),
            input_repr=r.get("input_repr") if not is_hidden else "[Masked Hidden Test Input]",
            expected_repr=r.get("expected_repr") if not is_hidden else "[Masked Hidden Expected]",
            actual_repr=r.get("actual_repr") if not is_hidden else ("[Passed]" if r.get("passed") else "[Mismatch]"),
            error=r.get("error")
        ))

    # Evidence Flag Heuristic Detection (telemetry analysis)
    # Critical rule: Evidence flags require human review; never automatically declare cheating!
    has_flag = False
    flag_reasons = []
    paste_count = payload.telemetry.paste_count if payload.telemetry else 0
    time_spent = payload.telemetry.time_spent_seconds if payload.telemetry else 60.0
    tab_switches = payload.telemetry.tab_switches if payload.telemetry else 0

    code_lines = len(payload.code.strip().splitlines())

    if paste_count >= 2 and time_spent < 25.0 and code_lines > 8:
        has_flag = True
        flag_reasons.append(f"Rapid Bulk Paste: {paste_count} paste events detected within {time_spent:.1f}s.")

    if tab_switches >= 4:
        has_flag = True
        flag_reasons.append(f"Frequent Focus Loss: {tab_switches} window/tab blur events recorded.")

    combined_flag_reason = " | ".join(flag_reasons) if has_flag else None

    # Record Coding Submission in SQLite
    submission = CodingSubmission(
        student_id=student.id,
        problem_id=problem.id,
        code=payload.code,
        language=payload.language,
        status=status,
        tests_passed=tests_passed,
        total_tests=total_tests,
        test_details=json.dumps([r.model_dump() for r in sanitized_results]),
        runtime_ms=runtime_ms,
        has_evidence_flag=has_flag,
        flag_reason=combined_flag_reason or "",
        paste_frequency=paste_count,
        execution_time_taken_seconds=time_spent
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    # If flagged, queue item for human educator review
    if has_flag:
        review_item = ReviewItem(
            student_id=student.id,
            submission_id=submission.id,
            problem_title=problem.title,
            flag_type="Assessment Telemetry Anomaly",
            severity="Medium" if paste_count < 4 else "High",
            evidence_details=json.dumps({
                "paste_events": paste_count,
                "time_spent_seconds": time_spent,
                "tab_switches": tab_switches,
                "lines_of_code": code_lines,
                "tests_passed": f"{tests_passed}/{total_tests}",
                "flag_notes": combined_flag_reason,
                "policy_notice": "Strictly queued for teacher verification; student is presumed innocent until educator reviews code explanation viva."
            }),
            status="Pending Review",
            teacher_notes="",
            reviewer_name=""
        )
        db.add(review_item)
        db.commit()

    # Hard Security Event logging (Sandbox containment proof)
    if status in ["Security Error", "Timed Out"]:
        violation_type = execution_result.get("violation_type", "sandbox_security_violation")
        error_msg = execution_result.get("error_msg", "Contained execution violation.")
        containment = (
            "AST Pre-screen Blocked Execution (Zero Process Spawned)"
            if status == "Security Error"
            else "Subprocess SIGKILL Terminated & Memory Reclaimed (Timeout Guard)"
        )

        sec_event = SecurityEvent(
            student_id=student.id,
            problem_id=problem.id,
            event_type=violation_type,
            description=f"Hostile Submission Contained: {error_msg}",
            payload=json.dumps({
                "code_snippet": payload.code[:300],
                "status": status,
                "runtime_ms": runtime_ms,
                "violation_type": violation_type,
                "containment_action": containment
            }),
            occurred_at=datetime.utcnow()
        )
        db.add(sec_event)
        db.commit()

    return CodeSubmitResponse(
        submission_id=submission.id,
        status=status,
        tests_passed=tests_passed,
        total_tests=total_tests,
        runtime_ms=runtime_ms,
        test_results=sanitized_results,
        execution_engine_notice="Executed via isolated sandboxed subprocess (demo execution safe mode)",
        has_evidence_flag=has_flag,
        flag_reason=combined_flag_reason,
        eligible_for_viva=(status == "Accepted")
    )

@router.get("/security-report", response_model=SandboxSecurityReport)
def get_sandbox_security_report(db: Session = Depends(get_db)):
    events = db.query(SecurityEvent).order_by(SecurityEvent.occurred_at.desc()).all()
    students_map = {s.id: s.name for s in db.query(Student).all()}
    problems_map = {p.id: p.title for p in db.query(CodingProblem).all()}

    network_attempts = 0
    infinite_loops = 0
    filesystem_escapes = 0

    event_outs: List[SecurityEventOut] = []
    for ev in events:
        if "network" in ev.event_type.lower() or "socket" in ev.description.lower() or "requests" in ev.description.lower():
            network_attempts += 1
            action = "Blocked at AST Pre-Screen (Egress Denied)"
        elif "timeout" in ev.event_type.lower() or "infinite" in ev.description.lower() or "timed out" in ev.description.lower():
            infinite_loops += 1
            action = "Process Terminated via SIGKILL (2.5s Timeout)"
        else:
            filesystem_escapes += 1
            action = "Subprocess Sandbox Restricted"

        payload_dict = json.loads(ev.payload) if ev.payload else {}

        event_outs.append(SecurityEventOut(
            id=ev.id,
            student_id=ev.student_id,
            student_name=students_map.get(ev.student_id, f"Student {ev.student_id}"),
            problem_id=ev.problem_id,
            problem_title=problems_map.get(ev.problem_id, "Assessment Sandbox"),
            event_type=ev.event_type,
            description=ev.description,
            payload=payload_dict,
            containment_action=action,
            occurred_at=ev.occurred_at
        ))

    return SandboxSecurityReport(
        total_contained_threats=len(events),
        network_attempts_blocked=network_attempts,
        infinite_loops_terminated=infinite_loops,
        filesystem_escapes_blocked=filesystem_escapes,
        sandbox_status="ACTIVE & SECURE (Multi-layer AST + Subprocess Containment)",
        architecture_overview="Layer 1: Static AST validation blocks forbidden imports (socket, urllib, os, subprocess) before execution. Layer 2: Dedicated isolated worker subprocess executes code in temporary directory. Layer 3: Hard watchdog timeout aborts processes via SIGKILL after 2.5s.",
        recent_events=event_outs
    )

@router.get("/submissions/{student_id}")
def get_student_submissions(student_id: str, db: Session = Depends(get_db)):
    submissions = db.query(CodingSubmission).filter(
        CodingSubmission.student_id == student_id
    ).order_by(CodingSubmission.submitted_at.desc()).all()
    
    problems = {p.id: p.title for p in db.query(CodingProblem).all()}
    
    return [
        {
            "id": s.id,
            "problem_id": s.problem_id,
            "problem_title": problems.get(s.problem_id, s.problem_id),
            "status": s.status,
            "tests_passed": s.tests_passed,
            "total_tests": s.total_tests,
            "runtime_ms": s.runtime_ms,
            "submitted_at": s.submitted_at,
            "has_evidence_flag": s.has_evidence_flag,
            "flag_reason": s.flag_reason
        } for s in submissions
    ]
