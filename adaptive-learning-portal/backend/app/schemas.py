from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# ──────────────────────────────────────────────────────────────────────────────
# Auth / login helpers  (demo: no real JWT, just role-switching)
# ──────────────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    role: str  # "student" | "teacher"

class LoginResponse(BaseModel):
    user_id: str
    name: str
    role: str
    batch_id: Optional[str] = None
    is_first_login: bool = False
    onboarding_done: bool = False
    diagnostic_done: bool = False

# ──────────────────────────────────────────────────────────────────────────────
# Batch
# ──────────────────────────────────────────────────────────────────────────────
class BatchOut(BaseModel):
    id: str
    name: str
    course: str
    student_count: Optional[int] = 0

# ──────────────────────────────────────────────────────────────────────────────
# Teacher
# ──────────────────────────────────────────────────────────────────────────────
class TeacherBase(BaseModel):
    id: str
    name: str
    email: str
    avatar: Optional[str] = ""
    batch_id: Optional[str] = None

# ──────────────────────────────────────────────────────────────────────────────
# Student
# ──────────────────────────────────────────────────────────────────────────────
class StudentBase(BaseModel):
    id: str
    name: str
    email: str
    avatar: Optional[str] = ""
    batch_id: Optional[str] = None
    is_first_login: bool = True
    onboarding_done: bool = False
    diagnostic_done: bool = False

class ConceptMasteryOut(BaseModel):
    concept_id: str
    concept_name: str
    category: str
    score: float
    state: str  # Solid | Needs Practice | Not Understood | Not Assessed
    attempts_count: int
    correct_count: int
    last_assessed_at: Optional[datetime] = None
    decay_applied: Optional[bool] = False

class StudentDetail(StudentBase):
    overall_mastery: float
    accuracy_percentage: float
    total_attempts: int
    weak_concepts: List[str]
    mastery_breakdown: List[ConceptMasteryOut]

# ──────────────────────────────────────────────────────────────────────────────
# Onboarding
# ──────────────────────────────────────────────────────────────────────────────
class OnboardingSubmit(BaseModel):
    student_id: str
    concepts_known: List[str]
    concepts_to_learn: List[str]

# ──────────────────────────────────────────────────────────────────────────────
# Concept
# ──────────────────────────────────────────────────────────────────────────────
class ConceptOut(BaseModel):
    id: str
    name: str
    category: str
    difficulty: str
    prerequisites: List[str]
    description: str
    state: Optional[str] = "Not Assessed"
    score: Optional[float] = 0.0

# ──────────────────────────────────────────────────────────────────────────────
# Quiz
# ──────────────────────────────────────────────────────────────────────────────
class QuizQuestionOut(BaseModel):
    id: str
    concept_id: str
    concept_name: Optional[str] = ""
    title: str
    prompt: str
    code_snippet: Optional[str] = ""
    options: List[str]
    difficulty: str
    question_type: str
    selection_reason: Optional[str] = None
    target_concept_state: Optional[str] = None
    target_concept_score: Optional[float] = None
    strategy: Optional[str] = None

class AdaptiveQuestionItem(BaseModel):
    question: QuizQuestionOut
    selection_reason: str
    target_concept_id: str
    target_concept_name: str
    target_concept_state: str
    target_concept_score: float
    strategy: str

class StudentAdaptivePath(BaseModel):
    student_id: str
    student_name: str
    avatar: str
    overall_mastery: float
    status_summary: str
    path: List[AdaptiveQuestionItem]

class AdaptiveComparisonResponse(BaseModel):
    module_name: str
    student_a: StudentAdaptivePath
    student_b: StudentAdaptivePath
    divergence_percentage: int
    executive_summary: str


class AnswerSubmission(BaseModel):
    question_id: str
    selected_index: int

class QuizSubmitRequest(BaseModel):
    student_id: str
    quiz_type: str = "diagnostic"  # diagnostic | adaptive
    answers: List[AnswerSubmission]

class QuestionResult(BaseModel):
    question_id: str
    concept_id: str
    concept_name: str
    selected_index: int
    correct_index: int
    is_correct: bool
    explanation: str

class QuizSubmitResponse(BaseModel):
    attempt_id: int
    score_percentage: float
    total_questions: int
    correct_answers: int
    results: List[QuestionResult]
    updated_mastery: List[ConceptMasteryOut]
    weak_concepts: List[str]
    recommended_focus: Optional[str] = None

# ──────────────────────────────────────────────────────────────────────────────
# Coding problems
# ──────────────────────────────────────────────────────────────────────────────
class VisibleTestCase(BaseModel):
    id: int
    input: str
    expected: str
    description: Optional[str] = ""

class CodingProblemSummary(BaseModel):
    id: str
    concept_id: str
    concept_name: str
    title: str
    difficulty: str
    description: str
    tags: List[str]

class CodingProblemDetail(CodingProblemSummary):
    initial_code: str
    function_name: str
    visible_test_cases: List[VisibleTestCase]

# ──────────────────────────────────────────────────────────────────────────────
# Session event recording (frontend sends these)
# ──────────────────────────────────────────────────────────────────────────────
class SessionEventIn(BaseModel):
    student_id: str
    problem_id: str
    event_type: str   # edit | paste | run | tab_away | tab_back | idle_start | idle_end
    timestamp: Optional[datetime] = None
    payload: Optional[Dict[str, Any]] = {}

class PasteDiffSnapshot(BaseModel):
    before_code: str
    after_code: str
    timestamp: str
    char_count: int

# ──────────────────────────────────────────────────────────────────────────────
# Telemetry data submitted with code
# ──────────────────────────────────────────────────────────────────────────────
class TelemetryData(BaseModel):
    paste_count: int = 0
    time_spent_seconds: float = 0.0
    tab_switches: int = 0
    rapid_keystroke_bursts: int = 0
    paste_diffs: Optional[List[PasteDiffSnapshot]] = []
    session_events: Optional[List[Dict[str, Any]]] = []

class CodeSubmitRequest(BaseModel):
    student_id: str
    problem_id: str
    code: str
    language: str = "python"
    telemetry: Optional[TelemetryData] = None

# ──────────────────────────────────────────────────────────────────────────────
# Code execution results
# ──────────────────────────────────────────────────────────────────────────────
class TestRunResult(BaseModel):
    test_id: int
    is_hidden: bool
    passed: bool
    input_repr: Optional[str] = None
    expected_repr: Optional[str] = None
    actual_repr: Optional[str] = None
    error: Optional[str] = None

class CodeSubmitResponse(BaseModel):
    submission_id: int
    status: str  # Accepted | Failed | Error | Timed Out | Security Error
    tests_passed: int
    total_tests: int
    runtime_ms: float
    test_results: List[TestRunResult]
    execution_engine_notice: str = "Executed via isolated sandboxed runner with security timeout"
    has_evidence_flag: bool
    flag_reason: Optional[str] = None
    eligible_for_viva: bool

# ──────────────────────────────────────────────────────────────────────────────
# Viva
# ──────────────────────────────────────────────────────────────────────────────
class VivaQuestionItem(BaseModel):
    id: str
    prompt: str
    category: str  # logic | complexity | edge_cases

class VivaSessionCreateRequest(BaseModel):
    submission_id: int
    student_id: str
    problem_id: str

class VivaSessionResponse(BaseModel):
    session_id: int
    submission_id: int
    problem_id: str
    problem_title: str
    student_code: str
    questions: List[VivaQuestionItem]
    is_evaluated: bool

class VivaAnswerItem(BaseModel):
    question_id: str
    response_text: str

class VivaSubmitRequest(BaseModel):
    session_id: int
    answers: List[VivaAnswerItem]

class VivaEvaluationResponse(BaseModel):
    session_id: int
    viva_score: float  # 0 – 100
    rating: str        # Exemplary | Competent | Developing | Needs Review
    summary_feedback: str
    rubric_scores: Dict[str, Any]
    follow_up_recommended: bool
    discrepancy_flagged: bool

# ──────────────────────────────────────────────────────────────────────────────
# Review queue / evidence flags
# ──────────────────────────────────────────────────────────────────────────────
class ReviewItemOut(BaseModel):
    id: int
    student_id: str
    student_name: str
    problem_title: str
    submission_id: Optional[int]
    viva_session_id: Optional[int]
    flag_type: str
    severity: str
    evidence_details: Dict[str, Any]
    status: str
    teacher_notes: str
    reviewer_name: str
    flagged_at: datetime
    reviewed_at: Optional[datetime]
    student_code: Optional[str] = None
    viva_responses: Optional[List[Dict[str, Any]]] = None
    is_cluster_flag: bool = False
    batch_id: Optional[str] = None

class ReviewItemUpdate(BaseModel):
    status: str
    teacher_notes: str
    reviewer_name: str
    action: Optional[str] = None  # "pause_test" | "individual_review" | None

# ──────────────────────────────────────────────────────────────────────────────
# Cluster alert (batch-level)
# ──────────────────────────────────────────────────────────────────────────────
class ClusterAlertOut(BaseModel):
    batch_id: str
    cluster_rate: float              # e.g. 0.25 = 25 % of active students flagged
    threshold: float                 # configurable, e.g. 0.20
    active_students: int
    flagged_students: int
    likely_causes: List[str]
    fired_at: datetime
    is_active: bool

# ──────────────────────────────────────────────────────────────────────────────
# Live proctor console — per-student tile status
# ──────────────────────────────────────────────────────────────────────────────
class ProctorTileStatus(BaseModel):
    student_id: str
    student_name: str
    status: str   # typing | idle | running_code | tab_away
    flag_count: int
    last_event_at: Optional[datetime] = None

class ProctorConsoleOut(BaseModel):
    batch_id: str
    tiles: List[ProctorTileStatus]
    cluster_alert: Optional[ClusterAlertOut] = None
    health_indicator: str   # normal | elevated | critical

# ──────────────────────────────────────────────────────────────────────────────
# Remediation set
# ──────────────────────────────────────────────────────────────────────────────
class RemediationSetCreate(BaseModel):
    teacher_id: str
    batch_id: str
    concept_ids: List[str]
    student_ids: List[str]
    title: str
    description: Optional[str] = ""
    due_at: Optional[datetime] = None

class RemediationSetOut(BaseModel):
    id: int
    teacher_id: str
    batch_id: str
    concept_ids: List[str]
    student_ids: List[str]
    title: str
    description: str
    created_at: datetime
    due_at: Optional[datetime]
    completed_by: List[str]

# ──────────────────────────────────────────────────────────────────────────────
# Weak-concept priority list (teacher view, ranked by % of batch weak)
# ──────────────────────────────────────────────────────────────────────────────
class WeakConceptPriority(BaseModel):
    concept_id: str
    concept_name: str
    category: str
    weak_student_count: int
    total_students: int
    weak_pct: float   # 0.0 – 1.0
    avg_score: float

class SecurityEventOut(BaseModel):
    id: int
    student_id: str
    student_name: Optional[str] = "Student"
    problem_id: Optional[str] = None
    problem_title: Optional[str] = None
    event_type: str
    description: str
    payload: Optional[Dict[str, Any]] = None
    containment_action: str = "Terminated & Sandboxed"
    occurred_at: datetime

class SandboxSecurityReport(BaseModel):
    total_contained_threats: int
    network_attempts_blocked: int
    infinite_loops_terminated: int
    filesystem_escapes_blocked: int
    sandbox_status: str
    architecture_overview: str
    recent_events: List[SecurityEventOut]

# ──────────────────────────────────────────────────────────────────────────────
# Session replay & Integrity flag linked moments
# ──────────────────────────────────────────────────────────────────────────────
class SessionTimelineStep(BaseModel):
    step_id: int
    time_offset: str
    seconds: int
    event_type: str
    label: str
    is_flagged_moment: bool = False
    code_snapshot: str
    chars_added: int = 0
    details: Optional[str] = ""

class PasteDiffMoment(BaseModel):
    flag_id: int
    flag_type: str
    severity: str
    flagged_timestamp: str
    flag_time_offset: str
    step_index: int
    before_code: str
    after_code: str
    pasted_chunk: str
    diff_lines: List[Dict[str, Any]]
    telemetry_notice: str

class SessionReplayResponse(BaseModel):
    review_item_id: int
    student_id: str
    student_name: str
    avatar: str
    problem_title: str
    submission_id: int
    total_duration_seconds: int
    flag_summary: str
    paste_moment: PasteDiffMoment
    timeline: List[SessionTimelineStep]


