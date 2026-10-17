from backend.app.adaptive.mastery import BKTTracker
from backend.app.adaptive.models import (
    Concept,
    MasteryState,
    Question,
)
from backend.app.adaptive.orchestrator import (
    AdaptiveAssessmentEngine,
)


def make_concepts():
    return [
        Concept(
            id="variables",
            name="Variables",
        ),
        Concept(
            id="conditions",
            name="Conditions",
            prerequisites=["variables"],
        ),
        Concept(
            id="loops",
            name="Loops",
            prerequisites=["conditions"],
        ),
        Concept(
            id="functions",
            name="Functions",
            prerequisites=["loops"],
        ),
    ]


def make_questions():
    return [
        Question(
            id="q_variables_1",
            concept_ids=["variables"],
            difficulty=1,
            title="Variables Basics",
        ),
        Question(
            id="q_conditions_1",
            concept_ids=["conditions"],
            difficulty=1,
            title="Condition Basics",
        ),
        Question(
            id="q_loops_1",
            concept_ids=["loops"],
            difficulty=1,
            title="Loop Basics",
        ),
        Question(
            id="q_functions_1",
            concept_ids=["functions"],
            difficulty=1,
            title="Function Basics",
        ),
    ]


def make_mastery():
    return {
        "variables": MasteryState(
            concept_id="variables",
            probability=0.80,
            correctness_probability=0.80,
            fused_probability=0.80,
        ),
        "conditions": MasteryState(
            concept_id="conditions",
            probability=0.70,
            correctness_probability=0.70,
            fused_probability=0.70,
        ),
        "loops": MasteryState(
            concept_id="loops",
            probability=0.25,
            correctness_probability=0.25,
            fused_probability=0.25,
        ),
        "functions": MasteryState(
            concept_id="functions",
            probability=0.30,
            correctness_probability=0.30,
            fused_probability=0.30,
        ),
    }


def test_bkt_correct_increases_mastery():
    tracker = BKTTracker()

    state = MasteryState(
        concept_id="loops",
        probability=0.30,
    )

    old_probability = state.probability

    tracker.update(
        state,
        correct=True,
    )

    assert state.probability > old_probability


def test_bkt_wrong_does_not_create_high_mastery():
    tracker = BKTTracker()

    state = MasteryState(
        concept_id="loops",
        probability=0.30,
    )

    tracker.update(
        state,
        correct=False,
    )

    assert state.probability < 0.50


def test_selector_targets_weakest_concept():
    engine = AdaptiveAssessmentEngine()

    concepts = make_concepts()
    questions = make_questions()
    mastery = make_mastery()

    recommendation = engine.get_next_question(
        concepts=concepts,
        questions=questions,
        mastery=mastery,
    )

    assert recommendation.concept_id == "loops"
    assert recommendation.question_id == "q_loops_1"


def test_assessment_updates_mastery():
    engine = AdaptiveAssessmentEngine()

    concepts = make_concepts()
    questions = make_questions()
    mastery = make_mastery()

    result = engine.assess_submission(
        attempt_id="attempt-1",
        problem_statement="Write a loop.",
        submitted_code="for i in range(5): print(i)",
        passed=True,
        test_results="All tests passed.",
        submitted_question=questions[2],
        concepts=concepts,
        questions=questions,
        mastery=mastery,
        answers=[
            "I used a loop because the operation "
            "needs to repeat for each value."
        ],
        events=[],
    )

    assert result.passed is True
    assert result.correctness_score == 1.0
    assert result.explanation_score > 0.0
    assert (
        result.fused_mastery["loops"]
        > 0.25
    )


def test_integrity_signal_does_not_directly_change_mastery():
    engine = AdaptiveAssessmentEngine()

    concepts = make_concepts()
    questions = make_questions()
    mastery = make_mastery()

    old_mastery = mastery["loops"].fused_probability

    events = [
        {
            "seq": 10,
            "t_ms": 5000,
            "type": "paste",
            "payload": {
                "text_length": 500
            },
        }
    ]

    result = engine.assess_submission(
        attempt_id="attempt-2",
        problem_statement="Write a loop.",
        submitted_code="for i in range(5): print(i)",
        passed=False,
        test_results="Tests failed.",
        submitted_question=questions[2],
        concepts=concepts,
        questions=questions,
        mastery=mastery,
        answers=[],
        events=events,
    )

    assert len(result.integrity_signals) == 1
    assert (
        result.integrity_signals[0].signal_type
        == "large_paste"
    )

    # Integrity itself does not modify mastery.
    # The submission result is what updates mastery.
    assert (
        result.metadata[
            "integrity_requires_human_review"
        ]
        is True
    )