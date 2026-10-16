import re
import ast
from typing import List, Dict, Any, Tuple

DEFAULT_VIVA_PROMPTS = [
    {
        "id": "viva_q1",
        "category": "logic",
        "prompt": "Explain the step-by-step logic of your solution. Why did you choose this algorithm and these data structures?"
    },
    {
        "id": "viva_q2",
        "category": "complexity",
        "prompt": "State the exact Time Complexity and Space Complexity of your implementation using Big-O notation. Justify your derivation."
    },
    {
        "id": "viva_q3",
        "category": "edge_cases",
        "prompt": "What edge cases does your code handle (e.g. empty input, single element, large values, duplicates)? What scenario would cause it to fail?"
    }
]

def generate_viva_questions(problem_title: str, problem_concept: str) -> List[Dict[str, str]]:
    return [
        {
            "id": "viva_q1",
            "category": "logic",
            "prompt": f"Explain the core logic and algorithmic steps used in your '{problem_title}' solution. How does it leverage {problem_concept}?"
        },
        {
            "id": "viva_q2",
            "category": "complexity",
            "prompt": f"What is the asymptotic Time and Space Complexity (Big-O) of your '{problem_title}' implementation? Break down each loop or recursive call."
        },
        {
            "id": "viva_q3",
            "category": "edge_cases",
            "prompt": f"Detail the edge cases and boundary conditions you tested in '{problem_title}' (e.g., empty arrays, extreme bounds, negatives, duplicates)."
        }
    ]

def evaluate_viva_deterministic(
    student_code: str,
    responses: List[Dict[str, str]],
    expected_complexity: str = "O(n)"
) -> Dict[str, Any]:
    """
    Deterministic rubric-based viva evaluation fallback:
    Evaluates depth of response, presence of Big-O notations, algorithmic terminology,
    and detects possible divergence between code structure and explanation.
    """
    answers_by_cat = {}
    for r in responses:
        answers_by_cat[r.get("question_id", "")] = r.get("response_text", "").strip()

    logic_text = answers_by_cat.get("viva_q1", "")
    comp_text = answers_by_cat.get("viva_q2", "")
    edge_text = answers_by_cat.get("viva_q3", "")

    # 1. Logic Evaluation (Max 30)
    logic_words = len(logic_text.split())
    logic_score = 0
    logic_feedback = []
    
    if logic_words < 10:
        logic_score = 10
        logic_feedback.append("Brief explanation provided. Try explaining step-by-step logic in more depth.")
    elif logic_words < 30:
        logic_score = 22
        logic_feedback.append("Adequate logic explanation covering basic approach.")
    else:
        logic_score = 28
        logic_feedback.append("Detailed logic walkthrough clearly articulating the algorithmic decision process.")

    # Check for technical algorithmic keywords
    keywords_found = [
        kw for kw in ["loop", "pointer", "array", "recursion", "hash", "dictionary", "condition", "stack", "memo", "tree", "index", "return"]
        if kw in logic_text.lower()
    ]
    if len(keywords_found) >= 3 and logic_score < 30:
        logic_score = min(30, logic_score + 2)

    # 2. Complexity Evaluation (Max 35)
    comp_score = 0
    comp_feedback = []
    has_big_o = bool(re.search(r'o\s*\(\s*[^)]+\s*\)', comp_text, re.IGNORECASE))
    comp_words = len(comp_text.split())

    if has_big_o:
        comp_score += 20
        comp_feedback.append("Correctly articulated algorithmic Big-O notation.")
    else:
        comp_score += 8
        comp_feedback.append("Missing explicit Big-O notation for time/space complexity.")

    if any(term in comp_text.lower() for term in ["space", "memory", "auxiliary", "stack"]):
        comp_score += 8
        comp_feedback.append("Addressed space complexity considerations.")
    else:
        comp_feedback.append("Consider explicitly stating auxiliary space complexity.")

    if comp_words >= 20:
        comp_score += 7
    else:
        comp_score += 3

    comp_score = min(35, comp_score)

    # 3. Edge Cases Evaluation (Max 35)
    edge_score = 0
    edge_feedback = []
    edge_cases_mentioned = [
        term for term in ["empty", "null", "zero", "none", "negative", "single", "boundary", "duplicate", "large", "overflow"]
        if term in edge_text.lower()
    ]
    edge_words = len(edge_text.split())

    if len(edge_cases_mentioned) >= 3:
        edge_score = 32
        edge_feedback.append(f"Strong edge case coverage: identified {', '.join(edge_cases_mentioned[:4])}.")
    elif len(edge_cases_mentioned) >= 1:
        edge_score = 24
        edge_feedback.append(f"Considered key boundary condition: {', '.join(edge_cases_mentioned)}.")
    elif edge_words >= 15:
        edge_score = 18
        edge_feedback.append("General edge case reasoning provided; recommend citing specific input scenarios.")
    else:
        edge_score = 10
        edge_feedback.append("Minimal edge case discussion. Consider testing empty collections and boundaries.")

    edge_score = min(35, edge_score)

    total_viva_score = logic_score + comp_score + edge_score

    # Determine qualitative rating
    if total_viva_score >= 85:
        rating = "Exemplary"
    elif total_viva_score >= 70:
        rating = "Competent"
    elif total_viva_score >= 50:
        rating = "Developing"
    else:
        rating = "Needs Review"

    # Discrepancy & Evidence Flag Detection (Never automatic cheating - strictly queued for human review)
    discrepancy_flagged = False
    discrepancy_reasons = []

    # Check if student claims O(1) or O(log n) when AST reveals nested loops
    try:
        tree = ast.parse(student_code)
        loop_count = sum(1 for n in ast.walk(tree) if isinstance(n, (ast.For, ast.While)))
        if loop_count >= 2 and ("o(1)" in comp_text.lower() or "constant time" in comp_text.lower()):
            discrepancy_flagged = True
            discrepancy_reasons.append("Code contains nested loops, but viva stated constant time O(1).")
    except Exception:
        pass

    if total_viva_score < 40 and len(student_code.splitlines()) > 15:
        discrepancy_flagged = True
        discrepancy_reasons.append("Complex multi-line submission with minimal/unexplained viva rationale.")

    feedback_summary = (
        f"{' '.join(logic_feedback)} {' '.join(comp_feedback)} {' '.join(edge_feedback)}"
    )

    return {
        "viva_score": float(total_viva_score),
        "rating": rating,
        "summary_feedback": feedback_summary,
        "rubric_scores": {
            "logic": {"score": logic_score, "max": 30, "feedback": " ".join(logic_feedback)},
            "complexity": {"score": comp_score, "max": 35, "feedback": " ".join(comp_feedback)},
            "edge_cases": {"score": edge_score, "max": 35, "feedback": " ".join(edge_feedback)}
        },
        "follow_up_recommended": discrepancy_flagged or total_viva_score < 60,
        "discrepancy_flagged": discrepancy_flagged,
        "discrepancy_reason": "; ".join(discrepancy_reasons) if discrepancy_reasons else None
    }
