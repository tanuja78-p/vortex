from typing import List

from .models import ExplanationAssessment


class VivaQuestionGenerator:
    """
    MVP explanation-question generator.

    Later this can be connected to an LLM.
    For now, questions are grounded in the submitted code
    and test results without requiring an external API.
    """

    def generate(
        self,
        problem_statement: str,
        code: str,
        test_results: str,
    ) -> List[str]:
        if not code.strip():
            return []

        return [
            (
                "Explain the main approach you used to solve "
                "the problem and why you chose it."
            ),
            (
                "Identify one important part of your code. "
                "Explain what it does and describe an edge case "
                "that could affect it."
            ),
            (
                "If the input became much larger, what part of "
                "your solution might become a limitation and why?"
            ),
        ]


class VivaAssessor:
    """
    MVP explanation assessor.

    This provides a deterministic fallback score.
    A real LLM-based assessor can replace this later.
    """

    def assess(
        self,
        code: str,
        questions: List[str],
        answers: List[str],
    ) -> ExplanationAssessment:
        if not questions:
            return ExplanationAssessment(
                score=0.0,
                code_match=0.0,
                reasoning=0.0,
                correctness=0.0,
                specificity=0.0,
                confidence=0.2,
                feedback="No explanation questions were generated.",
                questions=[],
            )

        meaningful_answers = [
            answer.strip()
            for answer in answers
            if answer and answer.strip()
        ]

        if not meaningful_answers:
            return ExplanationAssessment(
                score=0.0,
                code_match=0.0,
                reasoning=0.0,
                correctness=0.0,
                specificity=0.0,
                confidence=0.8,
                feedback=(
                    "No meaningful explanation was provided. "
                    "The code result alone is not treated as "
                    "evidence of understanding."
                ),
                questions=questions,
            )

        average_length = sum(
            len(answer)
            for answer in meaningful_answers
        ) / len(meaningful_answers)

        length_score = min(
            1.0,
            average_length / 250.0,
        )

        coverage_score = min(
            1.0,
            len(meaningful_answers) / len(questions),
        )

        score = (
            0.60 * length_score
            + 0.40 * coverage_score
        )

        if score >= 0.75:
            feedback = (
                "The explanation provides reasonably detailed "
                "evidence of understanding."
            )
        elif score >= 0.50:
            feedback = (
                "The explanation provides some evidence of "
                "understanding but could be more specific."
            )
        else:
            feedback = (
                "The explanation is limited. Review the replay "
                "and code together before deciding mastery."
            )

        return ExplanationAssessment(
            score=score,
            code_match=score,
            reasoning=score,
            correctness=score,
            specificity=score,
            confidence=0.6,
            feedback=feedback,
            questions=questions,
        )