from typing import Dict, List

from .models import Concept, MasteryState, Question, Recommendation


class AdaptiveSelector:
    def __init__(self, mastery_threshold: float = 0.65):
        self.mastery_threshold = mastery_threshold

    def weakest_concept(
        self,
        concepts: List[Concept],
        mastery: Dict[str, MasteryState],
    ) -> Concept:
        available = [
            concept
            for concept in concepts
            if concept.id in mastery
        ]

        if not available:
            raise ValueError("No concepts available for selection.")

        return min(
            available,
            key=lambda concept: mastery[concept.id].fused_probability,
        )

    def prerequisites_ready(
        self,
        concept: Concept,
        mastery: Dict[str, MasteryState],
    ) -> bool:
        for prerequisite_id in concept.prerequisites:
            state = mastery.get(prerequisite_id)

            if state is None:
                return False

            if state.fused_probability < self.mastery_threshold:
                return False

        return True

    def find_blocking_prerequisite(
        self,
        concept: Concept,
        mastery: Dict[str, MasteryState],
    ) -> str | None:
        blocking = []

        for prerequisite_id in concept.prerequisites:
            state = mastery.get(prerequisite_id)

            if state is None:
                blocking.append((prerequisite_id, 0.0))
            elif state.fused_probability < self.mastery_threshold:
                blocking.append(
                    (prerequisite_id, state.fused_probability)
                )

        if not blocking:
            return None

        return min(
            blocking,
            key=lambda item: item[1],
        )[0]

    def target_concept(
        self,
        concept: Concept,
        mastery: Dict[str, MasteryState],
    ) -> str:
        blocking = self.find_blocking_prerequisite(
            concept,
            mastery,
        )

        if blocking:
            return blocking

        return concept.id

    def target_difficulty(self, mastery_probability: float) -> int:
        if mastery_probability < 0.35:
            return 1

        if mastery_probability < 0.65:
            return 2

        return 3

    def choose_question(
        self,
        target_concept_id: str,
        questions: List[Question],
        mastery: Dict[str, MasteryState],
        seen_question_ids: set[str] | None = None,
    ) -> Question:
        seen_question_ids = seen_question_ids or set()

        candidates = [
            question
            for question in questions
            if target_concept_id in question.concept_ids
        ]

        if not candidates:
            raise ValueError(
                f"No questions found for concept "
                f"{target_concept_id}"
            )

        current_mastery = mastery[
            target_concept_id
        ].fused_probability

        target_difficulty = self.target_difficulty(
            current_mastery
        )

        def score(question: Question) -> float:
            value = 0.0

            # Prefer unseen questions.
            if question.id not in seen_question_ids:
                value += 5.0
            else:
                value -= 5.0

            # Prefer questions close to target difficulty.
            value -= abs(
                question.difficulty - target_difficulty
            ) * 2.0

            return value

        return max(candidates, key=score)

    def recommend(
        self,
        concepts: List[Concept],
        questions: List[Question],
        mastery: Dict[str, MasteryState],
        seen_question_ids: set[str] | None = None,
    ) -> Recommendation:
        weakest = self.weakest_concept(
            concepts,
            mastery,
        )

        target_concept_id = self.target_concept(
            weakest,
            mastery,
        )

        target_mastery = mastery[
            target_concept_id
        ].fused_probability

        question = self.choose_question(
            target_concept_id,
            questions,
            mastery,
            seen_question_ids,
        )

        if target_concept_id != weakest.id:
            reason_code = "PREREQUISITE_SUPPORT"
            reason = (
                f"Your weakest area is {weakest.name}, "
                f"but its prerequisite "
                f"{target_concept_id} needs more practice first."
            )
        else:
            reason_code = "WEAKEST_CONCEPT"
            reason = (
                f"{weakest.name} is currently your weakest "
                f"concept, so the next question targets it."
            )

        return Recommendation(
            question_id=question.id,
            concept_id=target_concept_id,
            reason=reason,
            reason_code=reason_code,
            target_mastery=target_mastery,
            current_mastery=target_mastery,
            difficulty=question.difficulty,
        )