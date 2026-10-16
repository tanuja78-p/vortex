from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class StudentBase(BaseModel):
    id: str
    name: str
    email: str
    avatar: Optional[str] = ""

class ConceptMasteryOut(BaseModel):
    concept_id: str
    concept_name: str
    category: str
    score: float
    state: str  # Solid, Needs Practice, Not Understood, Not Assessed
    attempts_count: int
    correct_count: int
    last_assessed_at: Optional[datetime] = None

class StudentDetail(StudentBase):
    overall_mastery: float
    accuracy_percentage: float
    total_attempts: int
    weak_concepts: List[str]
    mastery_breakdown: List[ConceptMasteryOut]

class ConceptOut(BaseModel):
    id: str
    name: str
    category: str
    difficulty: str
    prerequisites: List[str]
    description: str
    state: Optional[str] = "Not Assessed"
    score: Optional[float] = 0.0

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

class AnswerSubmission(BaseModel):
    question_id: str
    selected_index: int

class QuizSubmitRequest(BaseModel):
    student_id: str
    quiz_type: str = "diagnostic"  # diagnostic or adaptive
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

class TelemetryData(BaseModel):
    paste_count: int = 0
    time_spent_seconds: float = 0.0
    tab_switches: int = 0
    rapid_keystroke_bursts: int = 0

class CodeSubmitRequest(BaseModel):
    student_id: str
    problem_id: str
    code: str
    language: str = "python"
    telemetry: Optional[TelemetryData] = None

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
    status: str  # Accepted, Failed, Error, Timed Out
    tests_passed: int
    total_tests: int
    runtime_ms: float
    test_results: List[TestRunResult]
    execution_engine_notice: str = "Executed via isolated sandboxed runner with security timeout"
    has_evidence_flag: bool
    flag_reason: Optional[str] = None
    eligible_for_viva: bool

class VivaQuestionItem(BaseModel):
    id: str
    prompt: str
    category: str  # logic, complexity, edge_cases

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
    viva_score: float  # 0 to 100
    rating: str  # Exemplary, Competent, Developing, Needs Review
    summary_feedback: str
    rubric_scores: Dict[str, Any]
    follow_up_recommended: bool
    discrepancy_flagged: bool

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

class ReviewItemUpdate(BaseModel):
    status: str  # Pending Review, Verified Legitimate, Requires Follow-up, Suspected Plagiarism, Dismissed
    teacher_notes: str
    reviewer_name: str
