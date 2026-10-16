from dataclasses import dataclass
from typing import Dict, Iterable

from .models import MasteryState


@dataclass
class BKTConfig:
    initial_mastery: float = 0.30
    learn_probability: float = 0.15
    guess_probability: float = 0.20
    slip_probability: float = 0.10


class BKTTracker:
    def __init__(self, config: BKTConfig | None = None):
        self.config = config or BKTConfig()

    def posterior_after_observation(
        self,
        prior: float,
        correct: bool,
    ) -> float:
        p_l = prior
        p_g = self.config.guess_probability
        p_s = self.config.slip_probability
        p_t = self.config.learn_probability

        if correct:
            numerator = p_l * (1 - p_s)
            denominator = numerator + (1 - p_l) * p_g
        else:
            numerator = p_l * p_s
            denominator = numerator + (1 - p_l) * (1 - p_g)

        if denominator == 0:
            posterior = p_l
        else:
            posterior = numerator / denominator

        # Learning transition.
        posterior = posterior + (1 - posterior) * p_t

        return max(0.0, min(1.0, posterior))

    def update(
        self,
        state: MasteryState,
        correct: bool,
    ) -> MasteryState:
        new_probability = self.posterior_after_observation(
            state.probability,
            correct,
        )

        state.probability = new_probability
        state.correctness_probability = new_probability
        state.fused_probability = new_probability
        state.observations += 1
        state.last_result = correct

        # Confidence grows with observations.
        state.confidence = min(
            0.95,
            0.10 + state.observations * 0.10,
        )

        state.clamp()
        return state

    def update_multiple(
        self,
        states: Dict[str, MasteryState],
        concept_ids: Iterable[str],
        correct: bool,
    ) -> Dict[str, MasteryState]:
        for concept_id in concept_ids:
            if concept_id in states:
                self.update(states[concept_id], correct)

        return states


def create_mastery_states(
    concept_ids: Iterable[str],
    config: BKTConfig | None = None,
) -> Dict[str, MasteryState]:
    cfg = config or BKTConfig()

    return {
        concept_id: MasteryState(
            concept_id=concept_id,
            probability=cfg.initial_mastery,
            correctness_probability=cfg.initial_mastery,
            fused_probability=cfg.initial_mastery,
            confidence=0.10,
        )
        for concept_id in concept_ids
    }