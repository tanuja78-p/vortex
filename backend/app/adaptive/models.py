from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class Concept:
    id: str
    name: str
    prerequisites: List[str] = field(default_factory=list)


@dataclass
class Question:
    id: str
    concept_ids: List[str]
    difficulty: int
    title: str = ""


@dataclass
class MasteryState:
    concept_id: str
    probability: float = 0.30
    observations: int = 0
    correctness_probability: float = 0.30
    fused_probability: float = 0.30
    confidence: float = 0.10
    last_result: Optional[bool] = None

    def clamp(self) -> None:
        self.probability = max(0.0, min(1.0, self.probability))
        self.correctness_probability = max(
            0.0, min(1.0, self.correctness_probability)
        )
        self.fused_probability = max(
            0.0, min(1.0, self.fused_probability)
        )
        self.confidence = max(0.0, min(1.0, self.confidence))


@dataclass
class ExplanationAssessment:
    score: float
    code_match: float
    reasoning: float
    correctness: float
    specificity: float
    confidence: float
    feedback: str
    questions: List[str] = field(default_factory=list)


@dataclass
class IntegritySignal:
    signal_type: str
    severity: str
    timestamp_ms: Optional[int]
    explanation: str
    evidence_strength: str
    review_recommended: bool
    event_ids: List[str] = field(default_factory=list)


@dataclass
class Recommendation:
    question_id: str
    concept_id: str
    reason: str
    reason_code: str
    target_mastery: float
    current_mastery: float
    difficulty: int


@dataclass
class AssessmentResult:
    attempt_id: str
    passed: bool
    correctness_score: float
    explanation_score: float
    correctness_mastery: Dict[str, float]
    fused_mastery: Dict[str, float]
    explanation: ExplanationAssessment
    integrity_signals: List[IntegritySignal]
    recommendation: Optional[Recommendation]
    metadata: Dict[str, Any] = field(default_factory=dict)