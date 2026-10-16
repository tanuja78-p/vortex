# OP-02: Adaptive Learning & Assessment Portal

An end-to-end adaptive assessment system featuring real-time concept mastery tracking, programming diagnostic assessments, dynamic remediation, isolated sandboxed code execution, code explanation viva defense, and an educator human-review queue.

---

## 🚀 Quick Start Instructions

### 1. Start Backend (FastAPI + SQLite)

Open a terminal and navigate to the backend directory:
```bash
cd adaptive-learning-portal/backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- **Backend API URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Health Check Endpoint**: `http://127.0.0.1:8000/api/health`

### 2. Start Frontend (React + Vite + TypeScript)

Open a second terminal and navigate to the frontend directory:
```bash
cd adaptive-learning-portal/frontend
npm run dev
```

- **Frontend Application URL**: `http://localhost:5173`

---

## 🧪 Running Automated Tests

Run the complete backend test suite covering all 11 core user journeys and security policies:
```bash
cd adaptive-learning-portal/backend
python -m pytest tests/ -v
```

All 11 tests pass synchronously verifying:
- `/api/health` service liveness and database connection
- Student retrieval and concept mastery states
- Diagnostic quiz baseline and non-leaking options
- Adaptive question recommendation targeting weak concepts
- Quiz submission and mastery state persistence in SQLite
- AST sandbox safety (blocks forbidden modules like `os`, `sys`, `socket`)
- Isolated subprocess code runner with 3.0s timeouts
- Hidden test masking (server secrets/hidden tests never exposed to frontend)
- Viva session generation and deterministic rubric evaluation
- Teacher overview analytics and human-review queue status resolution

---

## 🌟 Key Features & Capabilities

### 1. Student Dashboard & Concept Mastery Matrix
- Displays real-time **Overall Mastery (%)**, **Diagnostic Accuracy (%)**, **Total Attempts**, and **Weak Concepts**.
- Continuous evaluation across **4 Concept Mastery States**:
  - `Solid`: Score ≥ 80% with ≥ 2 confirmed attempts (Emerald).
  - `Needs Practice`: Score 40%–79% (Amber).
  - `Not Understood`: Score < 40% with ≥ 1 attempt (Rose).
  - `Not Assessed`: 0 attempts (Slate).
- Direct callout banner to launch focused adaptive remediation sessions.

### 2. Diagnostic Programming Assessment
- Programming questions with syntax code blocks covering Object-Oriented Programming, Recursion, Time & Space Complexity, and Dynamic Programming.
- Instant submission, question-by-question explanations, and automatic SQLite mastery updates.

### 3. Adaptive Remediation Engine
- Prioritizes questions dynamically based on the learner's specific weak concepts (`Not Understood` and `Needs Practice`).
- Explains why each question was selected and recalculates mastery state transitions live.

### 4. Coding Assessment Lab & Isolated Runner
- Algorithmic problems (Two Sum Target Lookup, Valid Alphanumeric Palindrome, Climbing Stairs DP).
- **Security & Integrity**:
  - Untrusted code is **never** executed inside the main API process.
  - Runs in a clean, isolated Python subprocess with a strict 3.0-second timeout.
  - AST pre-screening filters out dangerous modules (`os`, `sys`, `subprocess`, `eval`, `socket`).
  - **Hidden tests are evaluated securely on the backend**; inputs and expected values are masked and never exposed to the frontend payload.

### 5. Code Explanation Viva Defense
- Upon passing all tests, students defend their solution across three core dimensions:
  1. **Logic & Strategy**: Explaining algorithmic reasoning and data structure choices.
  2. **Asymptotic Complexity**: Big-O derivation for Time and Auxiliary Space.
  3. **Edge Cases**: Handling empty collections, single elements, and extreme boundaries.
- **Deterministic Rubric Evaluator**: Runs even when no external LLM API key is configured. Assigns rubric breakdown scores (Logic /30, Complexity /35, Edge Cases /35) and qualitative ratings (*Exemplary*, *Competent*, *Developing*, *Needs Review*).

### 6. Teacher Dashboard & Human-Review Queue
- Class aggregate analytics: Total students, concepts, submissions, and mastery state distribution bar.
- **Academic Integrity Evidence Queue**:
  - Telemetry tracking logs paste frequency, keystroke bursts, time spent, and window blur events.
  - Detects viva-code discrepancies (e.g. code is $O(n)$ hash table, but viva description claimed brute-force nested loops).
  - **Critical Principle**: *Evidence flags require human educator review; the automated system never automatically declares cheating or penalizes students without instructor verification.*
  - Teachers inspect the code, telemetry, and viva transcript, then set human status (`Verified Legitimate`, `Requires Follow-up Interview`, `Suspected Plagiarism`, `Dismissed`) with pedagogical justification notes.

---

## 👥 Pre-Seeded Demonstration Personas

Switch between these personas in the top navigation bar to test all flows:

| Student Name | ID | Baseline Profile | Demo Purpose |
| :--- | :--- | :--- | :--- |
| **Alex Johnson** | `s1` | Solid in OOP, Needs Practice in Recursion, Not Understood in DP | Test Adaptive Practice recommendations |
| **Sarah Smith** | `s2` | High performer across all core concepts | Test mastery acceleration and challenge questions |
| **Dev Patel** | `s3` | Diagnostic incomplete, tab blur telemetry flag | Test diagnostic assessment & telemetry logging |
| **Priya Sharma** | `s4` | High code velocity + viva logic divergence | Immediate demonstration of the Teacher Human-Review Queue |

---

## 📂 Project Architecture

```
adaptive-learning-portal/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, lifespan seeding
│   │   ├── database.py          # SQLite engine and session handling
│   │   ├── models.py            # SQLAlchemy database schemas
│   │   ├── schemas.py           # Pydantic validation schemas
│   │   ├── seed_data.py         # Rich demonstration seed data
│   │   ├── adaptive_engine.py   # Adaptive selection & 4-state mastery engine
│   │   ├── code_runner.py       # Isolated subprocess safe runner with timeout
│   │   ├── viva_engine.py       # Deterministic viva rubric evaluator & flag trigger
│   │   └── routers/             # Modular API endpoints
│   ├── tests/
│   │   └── test_api.py          # Pytest suite (11 passed tests)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/          # StudentDashboard, DiagnosticQuiz, AdaptivePractice,
│   │   │                        # CodingAssessment, CodeVivaModal, TeacherDashboard, Navbar
│   │   ├── api.ts              # Typed API client
│   │   ├── types.ts            # TypeScript definitions
│   │   ├── index.css           # Glassmorphism dark modern design system
│   │   └── App.tsx              # Root orchestration & mode switching
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── README.md
```
