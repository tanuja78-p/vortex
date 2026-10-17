import json
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from .models import Concept, ConceptMastery, QuizQuestion, Student

def determine_mastery_state(score: float, attempts: int) -> str:
    """
    Categorizes mastery into 4 strict states:
    - Not Assessed: 0 attempts
    - Solid: score >= 0.80 and attempts >= 2
    - Needs Practice: score >= 0.40 and score < 0.80 (or score >= 0.80 with only 1 attempt)
    - Not Understood: score < 0.40 and attempts >= 1
    """
    if attempts == 0:
        return "Not Assessed"
    if score >= 0.80 and attempts >= 2:
        return "Solid"
    elif score >= 0.40:
        return "Needs Practice"
    else:
        return "Not Understood"

def update_student_mastery_for_question(
    db: Session, student_id: str, concept_id: str, is_correct: bool
) -> ConceptMastery:
    mastery = db.query(ConceptMastery).filter(
        ConceptMastery.student_id == student_id,
        ConceptMastery.concept_id == concept_id
    ).first()

    if not mastery:
        mastery = ConceptMastery(
            student_id=student_id,
            concept_id=concept_id,
            score=1.0 if is_correct else 0.0,
            attempts_count=1,
            correct_count=1 if is_correct else 0,
            state="Needs Practice" if is_correct else "Not Understood"
        )
        db.add(mastery)
    else:
        mastery.attempts_count += 1
        if is_correct:
            mastery.correct_count += 1
        
        # Exponential smoothing / moving average giving more weight to recent performance
        new_accuracy = mastery.correct_count / max(1, mastery.attempts_count)
        # 60% historical average + 40% immediate outcome
        instant_impact = 1.0 if is_correct else 0.0
        mastery.score = round(0.6 * new_accuracy + 0.4 * instant_impact, 2)
        mastery.state = determine_mastery_state(mastery.score, mastery.attempts_count)

    db.commit()
    db.refresh(mastery)
    return mastery

def get_student_weak_concepts(db: Session, student_id: str) -> List[ConceptMastery]:
    """Returns concepts that are either 'Not Understood' or 'Needs Practice', sorted by lowest score."""
    masteries = db.query(ConceptMastery).filter(
        ConceptMastery.student_id == student_id
    ).all()

    weak = [m for m in masteries if m.state in ["Not Understood", "Needs Practice"]]
    weak.sort(key=lambda m: (m.score, -m.attempts_count))
    return weak

def select_adaptive_questions_with_reasons(
    db: Session, student_id: str, limit: int = 5, concept_filter: str = None
) -> List[Dict[str, Any]]:
    """
    Adaptive Question Selector with Stored Reasons:
    Analyzes student's current concept mastery profile and constructs an individualized path.
    - If student is struggling ('Not Understood', score < 0.40):
        Selects foundational Easy questions to remediate core misconceptions.
        Strategy: 'Foundational Remediation'
    - If student is in progress ('Needs Practice', 0.40 <= score < 0.80):
        Selects Medium questions to reinforce intermediate application.
        Strategy: 'Targeted Reinforcement'
    - If student is proficient ('Solid', score >= 0.80):
        Selects Hard questions to challenge advanced problem solving and prevent stagnation.
        Strategy: 'Challenge & Acceleration'
    - If concept is 'Not Assessed':
        Selects diagnostic baseline questions to map knowledge frontier.
        Strategy: 'Diagnostic Exploration'
    """
    all_concepts = db.query(Concept).all()
    concept_map = {c.id: c for c in all_concepts}

    masteries = db.query(ConceptMastery).filter(
        ConceptMastery.student_id == student_id
    ).all()
    mastery_by_concept = {m.concept_id: m for m in masteries}

    # If concept_filter is specified, prioritize that concept
    candidate_cids = [concept_filter] if concept_filter and concept_filter in concept_map else list(concept_map.keys())

    # Categorize concepts
    not_understood_ids = [
        cid for cid in candidate_cids
        if cid in mastery_by_concept and mastery_by_concept[cid].state == "Not Understood"
    ]
    needs_practice_ids = [
        cid for cid in candidate_cids
        if cid in mastery_by_concept and mastery_by_concept[cid].state == "Needs Practice"
    ]
    solid_ids = [
        cid for cid in candidate_cids
        if cid in mastery_by_concept and mastery_by_concept[cid].state == "Solid"
    ]
    not_assessed_ids = [
        cid for cid in candidate_cids
        if cid not in mastery_by_concept or mastery_by_concept[cid].state == "Not Assessed"
    ]

    # Sort within groups by score
    not_understood_ids.sort(key=lambda cid: mastery_by_concept[cid].score)
    needs_practice_ids.sort(key=lambda cid: mastery_by_concept[cid].score)
    solid_ids.sort(key=lambda cid: -mastery_by_concept[cid].score)

    selected: List[Dict[str, Any]] = []
    selected_qids = set()

    def try_add(cid: str, preferred_diff: str, strategy: str, reason_template: str, count: int = 1):
        nonlocal selected, selected_qids
        if len(selected) >= limit:
            return
        
        c = concept_map.get(cid)
        cname = c.name if c else cid
        m = mastery_by_concept.get(cid)
        score_pct = int((m.score if m else 0.0) * 100)
        state = m.state if m else "Not Assessed"

        # Query questions for this concept with preferred difficulty
        q_query = db.query(QuizQuestion).filter(
            QuizQuestion.concept_id == cid,
            ~QuizQuestion.id.in_(selected_qids) if selected_qids else True
        )
        if preferred_diff:
            diff_items = q_query.filter(QuizQuestion.difficulty == preferred_diff).limit(count).all()
        else:
            diff_items = []

        # If not enough with preferred diff, take any difficulty for this concept
        if len(diff_items) < count:
            remaining_count = count - len(diff_items)
            already_ids = selected_qids.union({q.id for q in diff_items})
            fallback_items = db.query(QuizQuestion).filter(
                QuizQuestion.concept_id == cid,
                ~QuizQuestion.id.in_(already_ids)
            ).limit(remaining_count).all()
            items = diff_items + fallback_items
        else:
            items = diff_items

        for q in items:
            if len(selected) >= limit or q.id in selected_qids:
                break
            reason = reason_template.format(
                concept=cname,
                score=score_pct,
                state=state,
                diff=q.difficulty
            )
            item_dict = {
                "question": q,
                "selection_reason": reason,
                "target_concept_id": cid,
                "target_concept_name": cname,
                "target_concept_state": state,
                "target_concept_score": (m.score if m else 0.0),
                "strategy": strategy
            }
            # Also attach directly to QuizQuestion object for convenience
            setattr(q, "selection_reason", reason)
            setattr(q, "target_concept_state", state)
            setattr(q, "target_concept_score", (m.score if m else 0.0))
            setattr(q, "strategy", strategy)

            selected.append(item_dict)
            selected_qids.add(q.id)

    # Strategy 1: Remediate Not Understood concepts (Easy/Medium)
    for cid in not_understood_ids:
        try_add(
            cid, "Easy", "Foundational Remediation",
            "Targeting critical gap in {concept} ({score}% mastery, {state}). Serving foundational {diff} question to rebuild base comprehension.",
            count=2
        )

    # Strategy 2: Reinforce Needs Practice concepts (Medium)
    for cid in needs_practice_ids:
        if len(selected) >= limit:
            break
        try_add(
            cid, "Medium", "Targeted Reinforcement",
            "Reinforcing {concept} ({score}% mastery, {state}). Serving {diff} question to advance concept synthesis towards mastery.",
            count=1
        )

    # Strategy 3: Accelerate Solid concepts with Challenge questions (Hard/Medium)
    for cid in solid_ids:
        if len(selected) >= limit:
            break
        try_add(
            cid, "Hard", "Challenge & Acceleration",
            "Accelerating advanced student in {concept} ({score}% mastery, {state}). Bypassing basic drill to challenge higher-order problem solving.",
            count=1
        )

    # Strategy 4: Diagnostic exploration for unassessed concepts
    for cid in not_assessed_ids:
        if len(selected) >= limit:
            break
        try_add(
            cid, "Easy", "Diagnostic Exploration",
            "Exploring unassessed concept {concept}. Serving baseline diagnostic {diff} item to evaluate starting competency.",
            count=1
        )

    # Fallback to any remaining questions if limit not reached
    if len(selected) < limit:
        leftover = db.query(QuizQuestion).filter(
            ~QuizQuestion.id.in_(selected_qids) if selected_qids else True
        ).limit(limit - len(selected)).all()
        for q in leftover:
            c = concept_map.get(q.concept_id)
            cname = c.name if c else q.concept_id
            m = mastery_by_concept.get(q.concept_id)
            state = m.state if m else "Not Assessed"
            score_pct = int((m.score if m else 0.0) * 100)
            reason = f"General reinforcement item on {cname} ({q.difficulty} tier)."
            setattr(q, "selection_reason", reason)
            setattr(q, "target_concept_state", state)
            setattr(q, "target_concept_score", (m.score if m else 0.0))
            setattr(q, "strategy", "General Reinforcement")
            selected.append({
                "question": q,
                "selection_reason": reason,
                "target_concept_id": q.concept_id,
                "target_concept_name": cname,
                "target_concept_state": state,
                "target_concept_score": (m.score if m else 0.0),
                "strategy": "General Reinforcement"
            })
            selected_qids.add(q.id)

    return selected[:limit]


def select_adaptive_questions(
    db: Session, student_id: str, limit: int = 5
) -> List[QuizQuestion]:
    """
    Adaptive Question Selector (returns List[QuizQuestion] with selection metadata attached).
    """
    items = select_adaptive_questions_with_reasons(db, student_id, limit=limit)
    return [it["question"] for it in items]



# ──────────────────────────────────────────────────────────────────────────────
# Mastery Decay — forgetting curve
# ──────────────────────────────────────────────────────────────────────────────
def apply_mastery_decay(db: Session, student_id: str) -> List[ConceptMastery]:
    """
    Applies a simple forgetting factor to concept mastery.
    - Solid concepts not practiced for >= 14 days → Needs Practice (score -= 0.15)
    - Needs Practice not practiced for >= 21 days  → Not Understood (score -= 0.15)
    Returns list of mastery records that had decay applied.
    """
    import datetime
    now    = datetime.datetime.utcnow()
    decayed = []

    masteries = db.query(ConceptMastery).filter(
        ConceptMastery.student_id == student_id
    ).all()

    for m in masteries:
        if m.state == "Not Assessed" or m.last_assessed_at is None:
            continue

        days_since = (now - m.last_assessed_at).days

        if m.state == "Solid" and days_since >= 14:
            m.score     = max(0.0, round(m.score - 0.15, 2))
            m.state     = "Needs Practice"
            m.decay_applied = True
            decayed.append(m)
        elif m.state == "Needs Practice" and days_since >= 21:
            m.score     = max(0.0, round(m.score - 0.15, 2))
            m.state     = "Not Understood"
            m.decay_applied = True
            decayed.append(m)

    if decayed:
        db.commit()

    return decayed
