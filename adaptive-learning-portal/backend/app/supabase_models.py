"""
Supabase PostgreSQL models matching schema 0001_current_prototype_schema.sql.
These models represent the production Supabase PostgreSQL contract.
They are kept distinct from SQLite prototype models to prevent schema corruption.
"""

from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    Text,
    DateTime,
    Numeric,
    ForeignKey,
    JSON,
    func
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base, relationship

SupabaseBase = declarative_base()

# Expected tables according to 0001_current_prototype_schema.sql
EXPECTED_SUPABASE_TABLES = [
    "courses",
    "concepts",
    "concept_prerequisites",
    "profiles",
    "questions",
    "question_concepts",
    "question_solutions",
    "test_cases",
    "attempts",
    "code_submissions",
    "explanations",
    "explanation_scores",
    "student_mastery",
    "mastery_updates",
    "recommendations",
    "session_events",
    "integrity_flags",
]

# Helper for UUID / String fallback if tested outside PostgreSQL
UUID_TYPE = UUID(as_uuid=True)


class Course(SupabaseBase):
    __tablename__ = "courses"

    id = Column(UUID_TYPE, primary_key=True)
    name = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Concept(SupabaseBase):
    __tablename__ = "concepts"

    id = Column(UUID_TYPE, primary_key=True)
    course_id = Column(UUID_TYPE, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    slug = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ConceptPrerequisite(SupabaseBase):
    __tablename__ = "concept_prerequisites"

    concept_id = Column(UUID_TYPE, ForeignKey("concepts.id", ondelete="CASCADE"), primary_key=True)
    prerequisite_id = Column(UUID_TYPE, ForeignKey("concepts.id", ondelete="CASCADE"), primary_key=True)


class Profile(SupabaseBase):
    __tablename__ = "profiles"

    id = Column(UUID_TYPE, primary_key=True)
    full_name = Column(Text, nullable=True)
    role = Column(String, default="student", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Question(SupabaseBase):
    __tablename__ = "questions"

    id = Column(UUID_TYPE, primary_key=True)
    course_id = Column(UUID_TYPE, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    title = Column(Text, nullable=False)
    prompt = Column(Text, nullable=False)
    question_type = Column(String, default="coding", nullable=False)
    difficulty = Column(Integer, default=1, nullable=False)
    language = Column(Text, default="python", nullable=False)
    starter_code = Column(Text, nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class QuestionConcept(SupabaseBase):
    __tablename__ = "question_concepts"

    question_id = Column(UUID_TYPE, ForeignKey("questions.id", ondelete="CASCADE"), primary_key=True)
    concept_id = Column(UUID_TYPE, ForeignKey("concepts.id", ondelete="CASCADE"), primary_key=True)


class QuestionSolution(SupabaseBase):
    __tablename__ = "question_solutions"

    question_id = Column(UUID_TYPE, ForeignKey("questions.id", ondelete="CASCADE"), primary_key=True)
    solution_code = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class TestCase(SupabaseBase):
    __tablename__ = "test_cases"

    id = Column(UUID_TYPE, primary_key=True)
    question_id = Column(UUID_TYPE, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    input_data = Column(JSON, nullable=True)
    expected_output = Column(JSON, nullable=True)
    is_hidden = Column(Boolean, default=True, nullable=False)
    time_limit_ms = Column(Integer, default=3000, nullable=False)
    memory_limit_mb = Column(Integer, default=128, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Attempt(SupabaseBase):
    __tablename__ = "attempts"

    id = Column(UUID_TYPE, primary_key=True)
    student_id = Column(UUID_TYPE, nullable=False)
    question_id = Column(UUID_TYPE, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="in_progress", nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    is_correct = Column(Boolean, nullable=True)
    test_score = Column(Numeric(5, 2), nullable=True)
    diagnosis = Column(Text, nullable=True)
    diagnosis_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class CodeSubmission(SupabaseBase):
    __tablename__ = "code_submissions"

    id = Column(UUID_TYPE, primary_key=True)
    attempt_id = Column(UUID_TYPE, ForeignKey("attempts.id", ondelete="CASCADE"), nullable=False)
    language = Column(Text, default="python", nullable=False)
    code = Column(Text, nullable=False)
    execution_status = Column(String, default="queued", nullable=False)
    tests_passed = Column(Integer, default=0, nullable=False)
    tests_total = Column(Integer, default=0, nullable=False)
    execution_time_ms = Column(Integer, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Explanation(SupabaseBase):
    __tablename__ = "explanations"

    id = Column(UUID_TYPE, primary_key=True)
    attempt_id = Column(UUID_TYPE, ForeignKey("attempts.id", ondelete="CASCADE"), nullable=False)
    question_number = Column(Integer, nullable=False)
    question = Column(Text, nullable=False)
    student_answer = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ExplanationScore(SupabaseBase):
    __tablename__ = "explanation_scores"

    id = Column(UUID_TYPE, primary_key=True)
    explanation_id = Column(UUID_TYPE, ForeignKey("explanations.id", ondelete="CASCADE"), nullable=False)
    score = Column(Numeric(5, 2), nullable=False)
    max_score = Column(Numeric(5, 2), default=100, nullable=False)
    reason = Column(Text, nullable=True)
    model_name = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class StudentMastery(SupabaseBase):
    __tablename__ = "student_mastery"

    student_id = Column(UUID_TYPE, primary_key=True)
    concept_id = Column(UUID_TYPE, ForeignKey("concepts.id", ondelete="CASCADE"), primary_key=True)
    mastery_probability = Column(Numeric(5, 4), default=0.2000, nullable=False)
    confidence = Column(Numeric(5, 4), default=0.1000, nullable=False)
    attempt_count = Column(Integer, default=0, nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class MasteryUpdate(SupabaseBase):
    __tablename__ = "mastery_updates"

    id = Column(UUID_TYPE, primary_key=True)
    student_id = Column(UUID_TYPE, nullable=False)
    concept_id = Column(UUID_TYPE, ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False)
    attempt_id = Column(UUID_TYPE, ForeignKey("attempts.id", ondelete="SET NULL"), nullable=True)
    old_mastery = Column(Numeric(5, 4), nullable=True)
    correctness_evidence = Column(Numeric(5, 4), nullable=True)
    explanation_evidence = Column(Numeric(5, 4), nullable=True)
    new_mastery = Column(Numeric(5, 4), nullable=True)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Recommendation(SupabaseBase):
    __tablename__ = "recommendations"

    id = Column(UUID_TYPE, primary_key=True)
    student_id = Column(UUID_TYPE, nullable=False)
    question_id = Column(UUID_TYPE, ForeignKey("questions.id", ondelete="SET NULL"), nullable=True)
    concept_id = Column(UUID_TYPE, ForeignKey("concepts.id", ondelete="SET NULL"), nullable=True)
    reason_code = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    priority = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)


class SessionEvent(SupabaseBase):
    __tablename__ = "session_events"

    id = Column(UUID_TYPE, primary_key=True)
    attempt_id = Column(UUID_TYPE, ForeignKey("attempts.id", ondelete="CASCADE"), nullable=False)
    sequence_number = Column(Integer, nullable=False)
    event_type = Column(Text, nullable=False)
    client_timestamp = Column(DateTime(timezone=True), nullable=True)
    server_timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    payload = Column(JSON, default=dict, nullable=False)


class IntegrityFlag(SupabaseBase):
    __tablename__ = "integrity_flags"

    id = Column(UUID_TYPE, primary_key=True)
    attempt_id = Column(UUID_TYPE, ForeignKey("attempts.id", ondelete="CASCADE"), nullable=False)
    event_id = Column(UUID_TYPE, ForeignKey("session_events.id", ondelete="SET NULL"), nullable=True)
    flag_type = Column(Text, nullable=False)
    severity = Column(String, default="low", nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="needs_review", nullable=False)
    trainer_note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
