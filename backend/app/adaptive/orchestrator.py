from typing import Dict, List, Set

from .evidence import EvidenceFusion
from .integrity import IntegrityAnalyzer
from .mastery import BKTTracker
from .models import (
    AssessmentResult,
    Concept,
    MasteryState,
    Question,
)
from .selector import AdaptiveSelector
from .viva import VivaAssessor, VivaQuestionGenerator


class AdaptiveAssessmentEngine:
    def __init__(self):
        self.bkt = BKTTracker()
        self.selector = AdaptiveSelector(
            mastery_threshold=0.65
        )
        self.evidence = EvidenceFusion(
            correctness_weight=0.60,
            explanation_weight=0.40,
        )
        self.integrity = IntegrityAnalyzer()
        self.viva_generator = VivaQuestionGenerator()
        self.viva_assessor = VivaAssessor()

    def assess_submission(
        self,
        attempt_id: str,
        problem_statement: str,
        submitted_code: str,
        passed: bool,
        test_results: str,
        submitted_question: Question,
        concepts: List[Concept],
        questions: List[Question],
        mastery: Dict[str, MasteryState],
        answers: List[str],
        events: List[dict],
        seen_question_ids: Set[str] | None = None,
    ) -> AssessmentResult:

        # -------------------------------------------------
        # 1. Generate explanation questions
        # -------------------------------------------------
        viva_questions = self.viva_generator.generate(
            problem_statement=problem_statement,
            code=submitted_code,
            test_results=test_results,
        )

        # -------------------------------------------------
        # 2. Assess student's explanation
        # -------------------------------------------------
        explanation = self.viva_assessor.assess(
            code=submitted_code,
            questions=viva_questions,
            answers=answers,
        )

        # -------------------------------------------------
        # 3. Calculate correctness
        # -------------------------------------------------
        correctness_score = 1.0 if passed else 0.0

        # -------------------------------------------------
        # 4. Update mastery for concepts in this question
        # -------------------------------------------------
        for concept_id in submitted_question.concept_ids:
            state = mastery.get(concept_id)

            if state is None:
                continue

            self.evidence.update(
                state=state,
                correct=passed,
                explanation_score=explanation.score,
                tracker=self.bkt,
            )

        # -------------------------------------------------
        # 5. Analyze process/integrity evidence
        # -------------------------------------------------
        integrity_signals = self.integrity.analyze(
            events
        )

        # IMPORTANT:
        # Integrity signals do NOT automatically reduce mastery.
        # They are evidence for human review.
        # -------------------------------------------------

        # -------------------------------------------------
        # 6. Select the next question
        # -------------------------------------------------
        recommendation = self.selector.recommend(
            concepts=concepts,
            questions=questions,
            mastery=mastery,
            seen_question_ids=seen_question_ids,
        )

        correctness_mastery = {
            concept_id: round(
                state.correctness_probability,
                4,
            )
            for concept_id, state in mastery.items()
        }

        fused_mastery = {
            concept_id: round(
                state.fused_probability,
                4,
            )
            for concept_id, state in mastery.items()
        }

        return AssessmentResult(
            attempt_id=attempt_id,
            passed=passed,
            correctness_score=correctness_score,
            explanation_score=explanation.score,
            correctness_mastery=correctness_mastery,
            fused_mastery=fused_mastery,
            explanation=explanation,
            integrity_signals=integrity_signals,
            recommendation=recommendation,
            metadata={
                "integrity_requires_human_review": any(
                    signal.review_recommended
                    for signal in integrity_signals
                ),
                "mastery_source": "correctness_plus_explanation",
            },
        )

    def get_next_question(
        self,
        concepts: List[Concept],
        questions: List[Question],
        mastery: Dict[str, MasteryState],
        seen_question_ids: Set[str] | None = None,
    ):
        return self.selector.recommend(
            concepts=concepts,
            questions=questions,
            mastery=mastery,
            seen_question_ids=seen_question_ids,
        )