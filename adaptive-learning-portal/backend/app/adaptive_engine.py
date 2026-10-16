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

def select_adaptive_questions(
    db: Session, student_id: str, limit: int = 5
) -> List[QuizQuestion]:
    """
    Adaptive Question Selector:
    1. Prioritizes concepts where student mastery is 'Not Understood' (highest priority).
    2. Then concepts where student is 'Needs Practice'.
    3. Then 'Not Assessed' concepts to expand diagnostic coverage.
    4. Dynamically chooses question difficulty (Easy for Not Understood, Medium for Needs Practice).
    """
    all_concepts = db.query(Concept).all()
    concept_map = {c.id: c for c in all_concepts}

    masteries = db.query(ConceptMastery).filter(
        ConceptMastery.student_id == student_id
    ).all()
    mastery_by_concept = {m.concept_id: m for m in masteries}

    # Group concept IDs by state
    not_understood_ids = [
        cid for cid, m in mastery_by_concept.items() if m.state == "Not Understood"
    ]
    needs_practice_ids = [
        cid for cid, m in mastery_by_concept.items() if m.state == "Needs Practice"
    ]
    assessed_ids = set(mastery_by_concept.keys())
    not_assessed_ids = [c.id for c in all_concepts if c.id not in assessed_ids]

    selected_questions: List[QuizQuestion] = []
    selected_qids = set()

    def add_from_concepts(concept_ids: List[str], preferred_difficulty: str = None, count: int = 2):
        nonlocal selected_questions, selected_qids
        for cid in concept_ids:
            if len(selected_questions) >= limit:
                break
            query = db.query(QuizQuestion).filter(
                QuizQuestion.concept_id == cid,
                ~QuizQuestion.id.in_(selected_qids) if selected_qids else True
            )
            if preferred_difficulty:
                query = query.filter(QuizQuestion.difficulty == preferred_difficulty)
            
            items = query.limit(count).all()
            for q in items:
                if len(selected_questions) < limit and q.id not in selected_qids:
                    selected_questions.append(q)
                    selected_qids.add(q.id)

    # Step 1: Weakest concepts first (Not Understood, Easy/Medium)
    if not_understood_ids:
        add_from_concepts(not_understood_ids, preferred_difficulty="Easy", count=2)
        add_from_concepts(not_understood_ids, preferred_difficulty="Medium", count=1)

    # Step 2: Needs Practice concepts (Medium/Hard)
    if len(selected_questions) < limit and needs_practice_ids:
        add_from_concepts(needs_practice_ids, preferred_difficulty="Medium", count=2)

    # Step 3: Unassessed concepts for exploration
    if len(selected_questions) < limit and not_assessed_ids:
        add_from_concepts(not_assessed_ids, preferred_difficulty="Easy", count=1)
        add_from_concepts(not_assessed_ids, preferred_difficulty="Medium", count=1)

    # Step 4: Fallback to any questions to fill limit
    if len(selected_questions) < limit:
        remaining = db.query(QuizQuestion).filter(
            ~QuizQuestion.id.in_(selected_qids) if selected_qids else True
        ).limit(limit - len(selected_questions)).all()
        selected_questions.extend(remaining)

    return selected_questions[:limit]
