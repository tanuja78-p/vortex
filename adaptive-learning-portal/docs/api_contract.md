# OP-02 Adaptive Learning Portal - Frontend/Backend API Contract

This document specifies the exact API contract implemented in the FastAPI backend (`backend/app/routers/`) and consumed by the React frontend (`frontend/src/api.ts`).

---

## 1. System & Health

### `GET /api/health`
Checks backend service availability and database connectivity.
- **Request**: None
- **Response** (`200 OK`):
  ```json
  {
    "status": "ok",
    "service": "adaptive-learning-portal",
    "timestamp": "2026-10-16T17:47:16.639387",
    "database": "healthy",
    "execution_runner": "sandboxed-isolated-subprocess",
    "viva_engine": "hybrid-deterministic-rubric"
  }
  ```

---

## 2. Students & Mastery

### `GET /api/students`
Lists all enrolled students.
- **Response** (`200 OK`):
  ```json
  [
    {
      "id": "s1",
      "name": "Alex Johnson",
      "email": "alex.johnson@university.edu",
      "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=Alex"
    }
  ]
  ```

### `GET /api/students/{student_id}`
Fetches full student profile, overall mastery percentage, accuracy, weak concepts, and granular concept mastery breakdown across the 4 states: `Solid`, `Needs Practice`, `Not Understood`, and `Not Assessed`.
- **Response** (`200 OK`):
  ```json
  {
    "id": "s1",
    "name": "Alex Johnson",
    "email": "alex.johnson@university.edu",
    "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=Alex",
    "overall_mastery": 69.6,
    "accuracy_percentage": 76.5,
    "total_attempts": 17,
    "weak_concepts": ["Recursion & Call Stacks", "Dynamic Programming & Memoization"],
    "mastery_breakdown": [
      {
        "concept_id": "c_oop",
        "concept_name": "Classes & Objects",
        "category": "Object-Oriented Programming",
        "score": 0.92,
        "state": "Solid",
        "attempts_count": 5,
        "correct_count": 5,
        "last_assessed_at": "2026-10-16T22:58:00"
      }
    ]
  }
  ```

### `GET /api/students/{student_id}/weak-concepts`
Returns sorted list of weak concepts (`Not Understood` and `Needs Practice`).

---

## 3. Concept Taxonomy

### `GET /api/concepts?student_id={student_id}`
Returns all concepts with prerequisite relationships and student-specific mastery state.
- **Response** (`200 OK`):
  ```json
  [
    {
      "id": "c_inheritance",
      "name": "Inheritance & Polymorphism",
      "category": "Object-Oriented Programming",
      "difficulty": "Medium",
      "prerequisites": ["c_oop"],
      "description": "Class hierarchies, method overriding, super() invocation...",
      "state": "Solid",
      "score": 0.85
    }
  ]
  ```

---

## 4. Diagnostic & Adaptive Quizzes

### `GET /api/quiz/diagnostic`
Retrieves baseline diagnostic programming questions.
- **Response** (`200 OK`):
  ```json
  [
    {
      "id": "q_oop_1",
      "concept_id": "c_oop",
      "concept_name": "Classes & Objects",
      "title": "Instance Attributes vs Class Attributes",
      "prompt": "What will be printed when this Python code executes?",
      "code_snippet": "class Server:\n    active = 0...",
      "options": ["1 1", "2 2", "0 0", "AttributeError"],
      "difficulty": "Easy",
      "question_type": "diagnostic"
    }
  ]
  ```
  *(Note: `correct_index` and `explanation` are deliberately withheld from this payload to prevent client-side inspection).*

### `GET /api/quiz/adaptive/{student_id}?limit=5`
Dynamically queries questions prioritizing the student's weakest concepts (`Not Understood` first, then `Needs Practice`).

### `POST /api/quiz/submit`
Submits quiz answers, updates concept mastery in SQLite, and returns feedback.
- **Request Body**:
  ```json
  {
    "student_id": "s3",
    "quiz_type": "diagnostic",
    "answers": [
      { "question_id": "q_rec_1", "selected_index": 1 }
    ]
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "attempt_id": 4,
    "score_percentage": 100.0,
    "total_questions": 1,
    "correct_answers": 1,
    "results": [
      {
        "question_id": "q_rec_1",
        "concept_id": "c_recursion",
        "concept_name": "Recursion & Call Stacks",
        "selected_index": 1,
        "correct_index": 1,
        "is_correct": true,
        "explanation": "Python enforces a recursion limit (default 1000) and raises RecursionError..."
      }
    ],
    "updated_mastery": [
      {
        "concept_id": "c_recursion",
        "concept_name": "Recursion & Call Stacks",
        "category": "Algorithms",
        "score": 0.64,
        "state": "Needs Practice",
        "attempts_count": 5,
        "correct_count": 2,
        "last_assessed_at": "2026-10-16T23:17:16"
      }
    ],
    "weak_concepts": ["Dynamic Programming & Memoization"],
    "recommended_focus": "Dynamic Programming & Memoization"
  }
  ```

---

## 5. Coding Assessment & Sandboxed Runner

### `GET /api/coding/problems`
Lists available coding challenges.

### `GET /api/coding/problems/{problem_id}`
Returns problem statement and **public sample test cases only**. Hidden test cases are kept securely on the server.
- **Response** (`200 OK`):
  ```json
  {
    "id": "prob_two_sum",
    "concept_id": "c_oop",
    "concept_name": "Classes & Objects",
    "title": "Two Sum Target Lookup",
    "difficulty": "Easy",
    "description": "Given a list of integers nums...",
    "tags": ["Arrays", "Hash Tables", "O(n)"],
    "initial_code": "def two_sum(nums, target):\n...",
    "function_name": "two_sum",
    "visible_test_cases": [
      {
        "id": 1,
        "input": "[[2, 7, 11, 15], 9]",
        "expected": "[0, 1]",
        "description": "Public Sample Case #1"
      }
    ]
  }
  ```

### `POST /api/coding/submit`
Executes code in an isolated Python subprocess with a strict 3.0s timeout and telemetry tracking.
- **Request Body**:
  ```json
  {
    "student_id": "s1",
    "problem_id": "prob_two_sum",
    "code": "def two_sum(nums, target):\n...",
    "language": "python",
    "telemetry": {
      "paste_count": 0,
      "time_spent_seconds": 42.0,
      "tab_switches": 0
    }
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "submission_id": 5,
    "status": "Accepted",
    "tests_passed": 5,
    "total_tests": 5,
    "runtime_ms": 78.4,
    "test_results": [
      {
        "test_id": 1,
        "is_hidden": false,
        "passed": true,
        "input_repr": "[[2, 7, 11, 15], 9]",
        "expected_repr": "[0, 1]",
        "actual_repr": "[0, 1]",
        "error": null
      },
      {
        "test_id": 4,
        "is_hidden": true,
        "passed": true,
        "input_repr": "[Masked Hidden Input]",
        "expected_repr": "[Masked Expected Output]",
        "actual_repr": "[Passed]",
        "error": null
      }
    ],
    "execution_engine_notice": "Executed via isolated sandboxed subprocess (demo execution safe mode)",
    "has_evidence_flag": false,
    "flag_reason": null,
    "eligible_for_viva": true
  }
  ```

### `GET /api/coding/submissions/{student_id}`
Returns past submissions and execution outcomes for a given student.

---

## 6. Code Explanation Viva Defense

### `POST /api/viva/start`
Starts oral/written defense session with 3 targeted questions covering logic, complexity, and edge cases.
- **Request Body**:
  ```json
  {
    "submission_id": 5,
    "student_id": "s1",
    "problem_id": "prob_two_sum"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "session_id": 4,
    "submission_id": 5,
    "problem_id": "prob_two_sum",
    "problem_title": "Two Sum Target Lookup",
    "student_code": "def two_sum(nums, target):\n...",
    "questions": [
      { "id": "viva_q1", "prompt": "Explain the core logic...", "category": "logic" },
      { "id": "viva_q2", "prompt": "What is the asymptotic Time and Space Complexity...", "category": "complexity" },
      { "id": "viva_q3", "prompt": "Detail the edge cases and boundary conditions...", "category": "edge_cases" }
    ],
    "is_evaluated": false
  }
  ```

### `POST /api/viva/submit`
Evaluates viva defense via deterministic rubric evaluation fallback (or LLM if configured).
- **Request Body**:
  ```json
  {
    "session_id": 4,
    "answers": [
      { "question_id": "viva_q1", "response_text": "I used a single-pass hash map..." },
      { "question_id": "viva_q2", "response_text": "Time complexity is O(n)..." },
      { "question_id": "viva_q3", "response_text": "Tested negative integers and duplicates..." }
    ]
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "session_id": 4,
    "viva_score": 85.0,
    "rating": "Exemplary",
    "summary_feedback": "Detailed logic walkthrough... Correctly articulated algorithmic Big-O notation...",
    "rubric_scores": {
      "logic": { "score": 28, "max": 30, "feedback": "Detailed logic walkthrough..." },
      "complexity": { "score": 32, "max": 35, "feedback": "Correctly articulated Big-O notation..." },
      "edge_cases": { "score": 25, "max": 35, "feedback": "Considered key boundary condition..." }
    },
    "follow_up_recommended": false,
    "discrepancy_flagged": false
  }
  ```

---

## 7. Teacher Dashboard & Human-Review Queue

### `GET /api/teacher/overview`
Provides class aggregate analytics and mastery distribution counts.

### `GET /api/teacher/review-queue?status_filter={status}`
Returns flagged evidence items awaiting human verification (e.g. rapid paste bursts, viva-code divergence, tab blur events).

### `POST /api/teacher/review-queue/{item_id}`
Updates review status and educator resolution notes.
- **Request Body**:
  ```json
  {
    "status": "Verified Legitimate",
    "teacher_notes": "Reviewed oral responses; student demonstrated clear understanding of hash sets.",
    "reviewer_name": "Prof. Anderson"
  }
  ```
- **Allowed Statuses**:
  - `Pending Review`
  - `Verified Legitimate`
  - `Requires Follow-up`
  - `Suspected Plagiarism`
  - `Dismissed`
