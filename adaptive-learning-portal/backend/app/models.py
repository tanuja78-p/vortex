import datetime
import json
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .database import Base

# ──────────────────────────────────────────────────────────────────────────────
# Batch (a cohort of ~25–30 students assigned to a teacher)
# ──────────────────────────────────────────────────────────────────────────────
class Batch(Base):
    __tablename__ = "batches"

    id         = Column(String, primary_key=True, index=True)
    name       = Column(String, nullable=False)
    course     = Column(String, default="CS201")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    students = relationship("Student", back_populates="batch")
    teachers = relationship("Teacher", back_populates="batch")


# ──────────────────────────────────────────────────────────────────────────────
# Teacher (role: teacher)
# ──────────────────────────────────────────────────────────────────────────────
class Teacher(Base):
    __tablename__ = "teachers"

    id         = Column(String, primary_key=True, index=True)
    name       = Column(String, nullable=False)
    email      = Column(String, unique=True, index=True)
    avatar     = Column(String, default="")
    batch_id   = Column(String, ForeignKey("batches.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    batch              = relationship("Batch", back_populates="teachers")
    remediation_sets   = relationship("RemediationSet", back_populates="teacher", cascade="all, delete-orphan")


# ──────────────────────────────────────────────────────────────────────────────
# Student (role: student)
# ──────────────────────────────────────────────────────────────────────────────
class Student(Base):
    __tablename__ = "students"

    id                     = Column(String, primary_key=True, index=True)
    name                   = Column(String, nullable=False)
    email                  = Column(String, unique=True, index=True)
    avatar                 = Column(String, default="")
    batch_id               = Column(String, ForeignKey("batches.id"), nullable=True)
    is_first_login         = Column(Boolean, default=True)
    # onboarding fields
    concepts_known         = Column(Text, default="[]")   # JSON list of concept IDs
    concepts_to_learn      = Column(Text, default="[]")   # JSON list of concept IDs
    onboarding_done        = Column(Boolean, default=False)
    diagnostic_done        = Column(Boolean, default=False)
    created_at             = Column(DateTime, default=datetime.datetime.utcnow)

    batch          = relationship("Batch", back_populates="students")
    masteries      = relationship("ConceptMastery",  back_populates="student", cascade="all, delete-orphan")
    quiz_attempts  = relationship("QuizAttempt",     back_populates="student", cascade="all, delete-orphan")
    submissions    = relationship("CodingSubmission", back_populates="student", cascade="all, delete-orphan")
    viva_sessions  = relationship("VivaSession",     back_populates="student", cascade="all, delete-orphan")
    review_items   = relationship("ReviewItem",      back_populates="student", cascade="all, delete-orphan")
    session_events = relationship("SessionEvent",    back_populates="student", cascade="all, delete-orphan")


# ──────────────────────────────────────────────────────────────────────────────
# Concept taxonomy
# ──────────────────────────────────────────────────────────────────────────────
class Concept(Base):
    __tablename__ = "concepts"

    id            = Column(String, primary_key=True, index=True)
    name          = Column(String, nullable=False)
    category      = Column(String, default="Core")
    difficulty    = Column(String, default="Medium")
    prerequisites = Column(Text, default="[]")   # JSON list of concept IDs
    description   = Column(Text, default="")

    masteries  = relationship("ConceptMastery",  back_populates="concept", cascade="all, delete-orphan")
    questions  = relationship("QuizQuestion",    back_populates="concept", cascade="all, delete-orphan")
    problems   = relationship("CodingProblem",   back_populates="concept", cascade="all, delete-orphan")


# ──────────────────────────────────────────────────────────────────────────────
# Concept mastery per student — includes decay tracking
# ──────────────────────────────────────────────────────────────────────────────
class ConceptMastery(Base):
    __tablename__ = "concept_mastery"

    id               = Column(Integer, primary_key=True, autoincrement=True)
    student_id       = Column(String, ForeignKey("students.id"),  nullable=False, index=True)
    concept_id       = Column(String, ForeignKey("concepts.id"),  nullable=False, index=True)
    score            = Column(Float,  default=0.0)     # 0.0 – 1.0
    attempts_count   = Column(Integer, default=0)
    correct_count    = Column(Integer, default=0)
    # Profile states: Solid | Needs Practice | Not Understood | Not Assessed
    state            = Column(String, default="Not Assessed")
    last_assessed_at = Column(DateTime, default=datetime.datetime.utcnow)
    # Mastery decay – confidence decays slowly over time
    decay_applied    = Column(Boolean, default=False)

    student = relationship("Student",  back_populates="masteries")
    concept = relationship("Concept",  back_populates="masteries")


# ──────────────────────────────────────────────────────────────────────────────
# Quiz question
# ──────────────────────────────────────────────────────────────────────────────
class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id            = Column(String, primary_key=True, index=True)
    concept_id    = Column(String, ForeignKey("concepts.id"), nullable=False, index=True)
    title         = Column(String, nullable=False)
    prompt        = Column(Text,   nullable=False)
    code_snippet  = Column(Text,   default="")
    options       = Column(Text,   nullable=False)   # JSON list of strings
    correct_index = Column(Integer, nullable=False)
    explanation   = Column(Text,   default="")
    difficulty    = Column(String, default="Medium")   # Easy | Medium | Hard
    question_type = Column(String, default="diagnostic")  # diagnostic | adaptive_practice

    concept = relationship("Concept", back_populates="questions")


# ──────────────────────────────────────────────────────────────────────────────
# Quiz attempt record
# ──────────────────────────────────────────────────────────────────────────────
class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id               = Column(Integer, primary_key=True, autoincrement=True)
    student_id       = Column(String, ForeignKey("students.id"), nullable=False, index=True)
    quiz_type        = Column(String, default="diagnostic")   # diagnostic | adaptive
    score            = Column(Float,  default=0.0)
    total_questions  = Column(Integer, default=0)
    correct_answers  = Column(Integer, default=0)
    answers_payload  = Column(Text,   default="[]")   # JSON answers + correctness
    completed_at     = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="quiz_attempts")


# ──────────────────────────────────────────────────────────────────────────────
# Coding problem
# ──────────────────────────────────────────────────────────────────────────────
class CodingProblem(Base):
    __tablename__ = "coding_problems"

    id             = Column(String, primary_key=True, index=True)
    concept_id     = Column(String, ForeignKey("concepts.id"), nullable=False, index=True)
    title          = Column(String, nullable=False)
    difficulty     = Column(String, default="Medium")
    description    = Column(Text,  nullable=False)
    initial_code   = Column(Text,  default="")
    function_name  = Column(String, default="solution")
    test_cases     = Column(Text,  nullable=False)   # JSON list (visible + hidden)
    viva_questions = Column(Text,  default="[]")     # JSON default viva questions
    tags           = Column(Text,  default="[]")

    concept    = relationship("Concept",          back_populates="problems")
    submissions = relationship("CodingSubmission", back_populates="problem", cascade="all, delete-orphan")


# ──────────────────────────────────────────────────────────────────────────────
# Coding submission — now includes paste-diff recording for proctoring
# ──────────────────────────────────────────────────────────────────────────────
class CodingSubmission(Base):
    __tablename__ = "coding_submissions"

    id                           = Column(Integer, primary_key=True, autoincrement=True)
    student_id                   = Column(String, ForeignKey("students.id"),       nullable=False, index=True)
    problem_id                   = Column(String, ForeignKey("coding_problems.id"), nullable=False, index=True)
    code                         = Column(Text, nullable=False)
    language                     = Column(String, default="python")
    status                       = Column(String, default="Accepted")   # Accepted | Failed | Error | Timed Out | Security Error
    tests_passed                 = Column(Integer, default=0)
    total_tests                  = Column(Integer, default=0)
    test_details                 = Column(Text, default="[]")   # JSON sanitised details
    runtime_ms                   = Column(Float, default=0.0)
    submitted_at                 = Column(DateTime, default=datetime.datetime.utcnow)
    # Integrity
    has_evidence_flag            = Column(Boolean, default=False)
    flag_reason                  = Column(String, default="")
    paste_frequency              = Column(Integer, default=0)
    execution_time_taken_seconds = Column(Float, default=0.0)
    # Paste diff snapshot (before / after long paste)
    paste_diff_snapshot          = Column(Text, default="[]")   # JSON list of {before,after,timestamp}
    # Full session recording (all events)
    session_recording            = Column(Text, default="[]")   # JSON list of SessionEvent-like payloads

    student       = relationship("Student",          back_populates="submissions")
    problem       = relationship("CodingProblem",    back_populates="submissions")
    viva_sessions = relationship("VivaSession",      back_populates="submission", cascade="all, delete-orphan")
    review_items  = relationship("ReviewItem",       back_populates="submission", cascade="all, delete-orphan")


# ──────────────────────────────────────────────────────────────────────────────
# Session event — every keystroke/paste/tab event recorded during a coding session
# ──────────────────────────────────────────────────────────────────────────────
class SessionEvent(Base):
    __tablename__ = "session_events"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    student_id   = Column(String, ForeignKey("students.id"), nullable=False, index=True)
    problem_id   = Column(String, nullable=False, index=True)
    event_type   = Column(String, nullable=False)   # edit | paste | run | tab_away | tab_back | idle_start | idle_end
    timestamp    = Column(DateTime, default=datetime.datetime.utcnow)
    payload      = Column(Text, default="{}")       # JSON extra data (code_snapshot, char_count, etc.)

    student = relationship("Student", back_populates="session_events")


# ──────────────────────────────────────────────────────────────────────────────
# Viva session
# ──────────────────────────────────────────────────────────────────────────────
class VivaSession(Base):
    __tablename__ = "viva_sessions"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    submission_id = Column(Integer, ForeignKey("coding_submissions.id"), nullable=False, index=True)
    student_id    = Column(String,  ForeignKey("students.id"),           nullable=False, index=True)
    problem_id    = Column(String,  ForeignKey("coding_problems.id"),    nullable=False, index=True)
    questions     = Column(Text, nullable=False)   # JSON list of questions
    responses     = Column(Text, default="[]")     # JSON list of user responses
    evaluation    = Column(Text, default="{}")     # JSON score, feedback, rubric
    is_evaluated  = Column(Boolean, default=False)
    created_at    = Column(DateTime, default=datetime.datetime.utcnow)

    student      = relationship("Student",          back_populates="viva_sessions")
    submission   = relationship("CodingSubmission", back_populates="viva_sessions")
    review_items = relationship("ReviewItem",       back_populates="viva_session")


# ──────────────────────────────────────────────────────────────────────────────
# Review / evidence flag item
# ──────────────────────────────────────────────────────────────────────────────
class ReviewItem(Base):
    __tablename__ = "review_items"

    id               = Column(Integer, primary_key=True, autoincrement=True)
    student_id       = Column(String,  ForeignKey("students.id"),           nullable=False, index=True)
    submission_id    = Column(Integer, ForeignKey("coding_submissions.id"), nullable=True,  index=True)
    viva_session_id  = Column(Integer, ForeignKey("viva_sessions.id"),      nullable=True,  index=True)
    problem_title    = Column(String, default="")
    flag_type        = Column(String, nullable=False)
    severity         = Column(String, default="Medium")   # Low | Medium | High
    evidence_details = Column(Text, default="{}")         # JSON telemetry
    status           = Column(String, default="Pending Review")
    teacher_notes    = Column(Text, default="")
    reviewer_name    = Column(String, default="")
    flagged_at       = Column(DateTime, default=datetime.datetime.utcnow)
    reviewed_at      = Column(DateTime, nullable=True)
    # Cluster alert fields
    is_cluster_flag  = Column(Boolean, default=False)  # True when ≥20 % of batch flagged
    batch_id         = Column(String, nullable=True)   # batch where cluster occurred

    student      = relationship("Student",          back_populates="review_items")
    submission   = relationship("CodingSubmission", back_populates="review_items")
    viva_session = relationship("VivaSession",      back_populates="review_items")


# ──────────────────────────────────────────────────────────────────────────────
# Remediation set — teacher assigns targeted practice to a group of students
# ──────────────────────────────────────────────────────────────────────────────
class RemediationSet(Base):
    __tablename__ = "remediation_sets"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    teacher_id      = Column(String, ForeignKey("teachers.id"), nullable=False, index=True)
    batch_id        = Column(String, ForeignKey("batches.id"),  nullable=False, index=True)
    concept_ids     = Column(Text, nullable=False)     # JSON list of concept IDs
    student_ids     = Column(Text, nullable=False)     # JSON list of student IDs
    title           = Column(String, nullable=False)
    description     = Column(Text, default="")
    created_at      = Column(DateTime, default=datetime.datetime.utcnow)
    due_at          = Column(DateTime, nullable=True)
    completed_by    = Column(Text, default="[]")       # JSON list of student IDs who completed

    teacher = relationship("Teacher", back_populates="remediation_sets")


# ──────────────────────────────────────────────────────────────────────────────
# Security / hard event log (sandbox escapes, etc.) — separate from review queue
# ──────────────────────────────────────────────────────────────────────────────
class SecurityEvent(Base):
    __tablename__ = "security_events"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    student_id   = Column(String, nullable=False, index=True)
    problem_id   = Column(String, nullable=True)
    event_type   = Column(String, nullable=False)   # sandbox_escape | repeated_violation | etc.
    description  = Column(Text, default="")
    payload      = Column(Text, default="{}")
    occurred_at  = Column(DateTime, default=datetime.datetime.utcnow)
