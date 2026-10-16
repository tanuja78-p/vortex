import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.seed_data import seed_database
from app.code_runner import run_isolated_code_test, analyze_ast_safety

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()
    yield

@pytest.fixture
def client():
    return TestClient(app)

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data
    assert data["database"] == "healthy"

def test_get_students(client):
    response = client.get("/api/students")
    assert response.status_code == 200
    students = response.json()
    assert len(students) >= 4
    alex = next((s for s in students if s["id"] == "s1"), None)
    assert alex is not None
    assert alex["name"] == "Alex Johnson"

def test_student_detail_and_mastery(client):
    response = client.get("/api/students/s1")
    assert response.status_code == 200
    data = response.json()
    assert "overall_mastery" in data
    assert "weak_concepts" in data
    assert len(data["mastery_breakdown"]) > 0
    # Check mastery states: Solid, Needs Practice, Not Understood, Not Assessed
    valid_states = {"Solid", "Needs Practice", "Not Understood", "Not Assessed"}
    for mb in data["mastery_breakdown"]:
        assert mb["state"] in valid_states

def test_diagnostic_quiz(client):
    response = client.get("/api/quiz/diagnostic")
    assert response.status_code == 200
    questions = response.json()
    assert len(questions) > 0
    q = questions[0]
    assert "title" in q
    assert "options" in q
    assert len(q["options"]) >= 2
    # Verify correct index is not leaked in question response
    assert "correct_index" not in q

def test_adaptive_quiz_generation(client):
    response = client.get("/api/quiz/adaptive/s1")
    assert response.status_code == 200
    questions = response.json()
    assert len(questions) > 0
    # Check that returned questions have concept ids
    concept_ids = [q["concept_id"] for q in questions]
    assert len(concept_ids) > 0

def test_quiz_submit_and_mastery_persistence(client):
    # Fetch questions
    diag = client.get("/api/quiz/diagnostic").json()
    assert len(diag) >= 2
    q1 = diag[0]
    q2 = diag[1]

    payload = {
        "student_id": "s1",
        "quiz_type": "diagnostic",
        "answers": [
            {"question_id": q1["id"], "selected_index": 1},
            {"question_id": q2["id"], "selected_index": 0}
        ]
    }
    response = client.post("/api/quiz/submit", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert "score_percentage" in result
    assert "updated_mastery" in result
    assert len(result["results"]) == 2

def test_ast_sandbox_safety():
    safe_code = "def two_sum(nums, target):\n    return [0, 1]"
    is_safe, err = analyze_ast_safety(safe_code)
    assert is_safe is True

    unsafe_code = "import os\ndef two_sum(nums, target):\n    os.system('dir')"
    is_safe2, err2 = analyze_ast_safety(unsafe_code)
    assert is_safe2 is False
    assert "forbidden" in err2.lower()

def test_isolated_code_runner():
    code = """
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []
"""
    test_cases = [
        {"input": [[2, 7, 11, 15], 9], "expected": [0, 1], "is_hidden": False, "unpack_args": True},
        {"input": [[3, 2, 4], 6], "expected": [1, 2], "is_hidden": True, "unpack_args": True}
    ]
    res = run_isolated_code_test(code, "two_sum", test_cases)
    assert res["status"] == "Accepted"
    assert res["tests_passed"] == 2
    # Hidden test should be masked
    hidden_test = next(t for t in res["results"] if t["is_hidden"])
    assert "[Masked" in hidden_test["actual_repr"]

def test_coding_submission_endpoint(client):
    valid_code = "def is_palindrome(s: str) -> bool:\n    c = [ch.lower() for ch in s if ch.isalnum()]\n    return c == c[::-1]\n"
    payload = {
        "student_id": "s1",
        "problem_id": "prob_valid_palindrome",
        "code": valid_code,
        "language": "python",
        "telemetry": {
            "paste_count": 0,
            "time_spent_seconds": 45.0,
            "tab_switches": 0
        }
    }
    response = client.post("/api/coding/submit", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Accepted"
    assert data["tests_passed"] == data["total_tests"]
    assert data["eligible_for_viva"] is True
    assert "submission_id" in data

def test_viva_start_and_deterministic_eval(client):
    # Submit code first
    code = "def is_palindrome(s: str) -> bool:\n    c = [ch.lower() for ch in s if ch.isalnum()]\n    return c == c[::-1]\n"
    sub_res = client.post("/api/coding/submit", json={
        "student_id": "s1",
        "problem_id": "prob_valid_palindrome",
        "code": code,
        "language": "python"
    }).json()
    sub_id = sub_res["submission_id"]

    # Start viva
    start_res = client.post("/api/viva/start", json={
        "submission_id": sub_id,
        "student_id": "s1",
        "problem_id": "prob_valid_palindrome"
    })
    assert start_res.status_code == 200
    viva_data = start_res.json()
    assert "session_id" in viva_data
    assert len(viva_data["questions"]) == 3

    # Submit viva responses
    submit_res = client.post("/api/viva/submit", json={
        "session_id": viva_data["session_id"],
        "answers": [
            {"question_id": "viva_q1", "response_text": "I used two pointers / string normalization to filter non-alphanumeric chars and compare symmetry."},
            {"question_id": "viva_q2", "response_text": "Time complexity is O(n) because we do a single pass over characters. Space complexity is O(n) for cleaned array."},
            {"question_id": "viva_q3", "response_text": "Tested empty string, single char, case sensitivity, spaces, and punctuation."}
        ]
    })
    assert submit_res.status_code == 200
    eval_data = submit_res.json()
    assert "viva_score" in eval_data
    assert eval_data["viva_score"] >= 70
    assert "rubric_scores" in eval_data

def test_teacher_overview_and_review_queue(client):
    overview_res = client.get("/api/teacher/overview")
    assert overview_res.status_code == 200
    overview = overview_res.json()
    assert overview["total_students"] >= 4
    assert "mastery_state_distribution" in overview

    queue_res = client.get("/api/teacher/review-queue")
    assert queue_res.status_code == 200
    queue = queue_res.json()
    assert len(queue) >= 1
    
    first_item = queue[0]
    item_id = first_item["id"]

    # Update item review
    update_res = client.post(f"/api/teacher/review-queue/{item_id}", json={
        "status": "Verified Legitimate",
        "teacher_notes": "Reviewed oral responses; student demonstrated clear understanding of hash sets.",
        "reviewer_name": "Instructor Miller"
    })
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["status"] == "Verified Legitimate"
    assert updated["reviewer_name"] == "Instructor Miller"
