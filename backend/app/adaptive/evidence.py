from .mastery import BKTTracker
from .models import MasteryState


class EvidenceFusion:
    """
    Combines correctness evidence with explanation evidence.

    MVP weights:
    - 60% correctness
    - 40% explanation
    """

    def __init__(
        self,
        correctness_weight: float = 0.60,
        explanation_weight: float = 0.40,
    ):
        if abs(
            correctness_weight + explanation_weight - 1.0
        ) > 0.0001:
            raise ValueError(
                "Evidence weights must add up to 1.0"
            )

        self.correctness_weight = correctness_weight
        self.explanation_weight = explanation_weight

    def fuse(
        self,
        correctness_score: float,
        explanation_score: float,
    ) -> float:
        return (
            self.correctness_weight * correctness_score
            + self.explanation_weight * explanation_score
        )

    def update(
        self,
        state: MasteryState,
        correct: bool,
        explanation_score: float,
        tracker: BKTTracker,
    ) -> MasteryState:
        # First update the correctness-only tracker.
        correctness_probability = tracker.posterior_after_observation(
            state.correctness_probability,
            correct,
        )

        # Combine correctness and explanation evidence.
        evidence_score = self.fuse(
            1.0 if correct else 0.0,
            explanation_score,
        )

        # Convert fused evidence into a BKT observation.
        fused_observation = evidence_score >= 0.50

        fused_probability = tracker.posterior_after_observation(
            state.fused_probability,
            fused_observation,
        )

        # Blend BKT result with the actual evidence score.
        fused_probability = (
            0.70 * fused_probability
            + 0.30 * evidence_score
        )

        state.correctness_probability = correctness_probability
        state.fused_probability = fused_probability
        state.probability = fused_probability

        state.observations += 1
        state.last_result = correct
        state.confidence = min(
            0.95,
            0.10 + state.observations * 0.10,
        )

        state.clamp()
        return state

    def compare(self, state: MasteryState) -> dict:
        return {
            "correctness_only": state.correctness_probability,
            "fused": state.fused_probability,
            "difference": (
                state.fused_probability
                - state.correctness_probability
            ),
        }