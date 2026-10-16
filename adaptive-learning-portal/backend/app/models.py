import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    avatar = Column(String, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    masteries = relationship("ConceptMastery", back_populates="student", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="student", cascade="all, delete-orphan")
    submissions = relationship("CodingSubmission", back_populates="student", cascade="all, delete-orphan")
    viva_sessions = relationship("VivaSession", back_populates="student", cascade="all, delete-orphan")
    review_items = relationship("ReviewItem", back_populates="student", cascade="all, delete-orphan")

class Concept(Base):
    __tablename__ = "concepts"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, default="Core")
    difficulty = Column(String, default="Medium")
    prerequisites = Column(Text, default="[]")  # JSON encoded list of concept IDs
    description = Column(Text, default="")

    masteries = relationship("ConceptMastery", back_populates="concept", cascade="all, delete-orphan")
    questions = relationship("QuizQuestion", back_populates="concept", cascade="all, delete-orphan")
    problems = relationship("CodingProblem", back_populates="concept", cascade="all, delete-orphan")

class ConceptMastery(Base):
    __tablename__ = "concept_mastery"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String, ForeignKey("students.id"), nullable=False, index=True)
    concept_id = Column(String, ForeignKey("concepts.id"), nullable=False, index=True)
    score = Column(Float, default=0.0)  # 0.0 to 1.0
    attempts_count = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    state = Column(String, default="Not Assessed")  # Solid, Needs Practice, Not Understood, Not Assessed
    last_assessed_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="masteries")
    concept = relationship("Concept", back_populates="masteries")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(String, primary_key=True, index=True)
    concept_id = Column(String, ForeignKey("concepts.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    prompt = Column(Text, nullable=False)
    code_snippet = Column(Text, default="")
    options = Column(Text, nullable=False)  # JSON encoded list of strings
    correct_index = Column(Integer, nullable=False)
    explanation = Column(Text, default="")
    difficulty = Column(String, default="Medium")  # Easy, Medium, Hard
    question_type = Column(String, default="diagnostic")  # diagnostic, adaptive_practice

    concept = relationship("Concept", back_populates="questions")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String, ForeignKey("students.id"), nullable=False, index=True)
    quiz_type = Column(String, default="diagnostic")  # diagnostic, adaptive
    score = Column(Float, default=0.0)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    answers_payload = Column(Text, default="[]")  # JSON of answers and correctness
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="quiz_attempts")

class CodingProblem(Base):
    __tablename__ = "coding_problems"

    id = Column(String, primary_key=True, index=True)
    concept_id = Column(String, ForeignKey("concepts.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    difficulty = Column(String, default="Medium")
    description = Column(Text, nullable=False)
    initial_code = Column(Text, default="")
    function_name = Column(String, default="solution")
    test_cases = Column(Text, nullable=False)  # JSON list of test cases (visible + hidden)
    viva_questions = Column(Text, default="[]")  # JSON default viva questions
    tags = Column(Text, default="[]")

    concept = relationship("Concept", back_populates="problems")
    submissions = relationship("CodingSubmission", back_populates="problem", cascade="all, delete-orphan")

class CodingSubmission(Base):
    __tablename__ = "coding_submissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String, ForeignKey("students.id"), nullable=False, index=True)
    problem_id = Column(String, ForeignKey("coding_problems.id"), nullable=False, index=True)
    code = Column(Text, nullable=False)
    language = Column(String, default="python")
    status = Column(String, default="Accepted")  # Accepted, Failed, Error, Timed Out
    tests_passed = Column(Integer, default=0)
    total_tests = Column(Integer, default=0)
    test_details = Column(Text, default="[]")  # JSON sanitized details (no secret leaks)
    runtime_ms = Column(Float, default=0.0)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Evidence flags for human review
    has_evidence_flag = Column(Boolean, default=False)
    flag_reason = Column(String, default="")
    paste_frequency = Column(Integer, default=0)
    execution_time_taken_seconds = Column(Float, default=0.0)

    student = relationship("Student", back_populates="submissions")
    problem = relationship("CodingProblem", back_populates="submissions")
    viva_sessions = relationship("VivaSession", back_populates="submission", cascade="all, delete-orphan")
    review_items = relationship("ReviewItem", back_populates="submission", cascade="all, delete-orphan")

class VivaSession(Base):
    __tablename__ = "viva_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    submission_id = Column(Integer, ForeignKey("coding_submissions.id"), nullable=False, index=True)
    student_id = Column(String, ForeignKey("students.id"), nullable=False, index=True)
    problem_id = Column(String, ForeignKey("coding_problems.id"), nullable=False, index=True)
    questions = Column(Text, nullable=False)  # JSON list of questions
    responses = Column(Text, default="[]")  # JSON list of user responses
    evaluation = Column(Text, default="{}")  # JSON score, feedback, rubric
    is_evaluated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="viva_sessions")
    submission = relationship("CodingSubmission", back_populates="viva_sessions")
    review_items = relationship("ReviewItem", back_populates="viva_session")

class ReviewItem(Base):
    __tablename__ = "review_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String, ForeignKey("students.id"), nullable=False, index=True)
    submission_id = Column(Integer, ForeignKey("coding_submissions.id"), nullable=True, index=True)
    viva_session_id = Column(Integer, ForeignKey("viva_sessions.id"), nullable=True, index=True)
    problem_title = Column(String, default="")
    flag_type = Column(String, nullable=False)  # e.g. "Abrupt Paste Influx", "Complexity Discrepancy", "Viva Divergence"
    severity = Column(String, default="Medium")  # Low, Medium, High
    evidence_details = Column(Text, default="{}")  # JSON formatted telemetry and metrics
    status = Column(String, default="Pending Review")  # Pending Review, Verified Legitimate, Requires Follow-up, Suspected Plagiarism, Dismissed
    teacher_notes = Column(Text, default="")
    reviewer_name = Column(String, default="")
    flagged_at = Column(DateTime, default=datetime.datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    student = relationship("Student", back_populates="review_items")
    submission = relationship("CodingSubmission", back_populates="review_items")
    viva_session = relationship("VivaSession", back_populates="review_items")
