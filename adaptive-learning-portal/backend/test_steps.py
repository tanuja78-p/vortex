import urllib.request
import json

def get(url):
    res = urllib.request.urlopen(url)
    return res.status, json.loads(res.read().decode('utf-8'))

def post(url, payload):
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    res = urllib.request.urlopen(req)
    return res.status, json.loads(res.read().decode('utf-8'))

print("=== STEP 4: Testing Backend Health Endpoint ===")
status, health_data = get("http://127.0.0.1:8000/api/health")
print(f"Health Status Code: {status}")
print(f"Health Response: {health_data}")
assert status == 200
assert health_data["status"] == "ok"
assert health_data["database"] == "healthy"

print("\n=== STEP 5: Verifying Student Dashboard & Diagnostic Questions ===")
# Fetch student detail
status, student = get("http://127.0.0.1:8000/api/students/s1")
print(f"Student: {student['name']}, Overall Mastery: {student['overall_mastery']}%, Weak Concepts: {student['weak_concepts']}")

# Fetch diagnostic questions directly from backend
status, questions = get("http://127.0.0.1:8000/api/quiz/diagnostic")
print(f"Diagnostic Questions (Backend): {len(questions)} loaded")
for idx, q in enumerate(questions):
    c_name = q.get('concept_name', 'General')
    title = q.get('title')
    opt_count = len(q.get('options', []))
    print(f"  {idx+1}. [{c_name}] {title} ({opt_count} options)")

# Fetch diagnostic questions via Vite proxy
proxy_status, proxy_questions = get("http://localhost:5173/api/quiz/diagnostic")
print(f"Diagnostic Questions (Vite Proxy http://localhost:5173/api/...): {len(proxy_questions)} loaded")
assert len(questions) == len(proxy_questions)

print("\n=== STEP 6: Submit an Answer & Verify Feedback and Saved Progress ===")
# We will use student 's3' (Dev Patel) so we can clearly trace progress changes before and after
status, s3_before = get("http://127.0.0.1:8000/api/students/s3")
recursion_mastery_before = next((m for m in s3_before['mastery_breakdown'] if m['concept_id'] == 'c_recursion'), None)
print(f"Dev Patel (s3) - Recursion before submission:")
print(f"  Score: {recursion_mastery_before['score']}, State: {recursion_mastery_before['state']}, Attempts: {recursion_mastery_before['attempts_count']}, Correct: {recursion_mastery_before['correct_count']}")

# Submit an answer to question q_rec_1: "Recursive Base Case Missing"
# Correct option index is 1 ("Python raises a RecursionError")
sub_status, sub_result = post("http://127.0.0.1:8000/api/quiz/submit", {
    "student_id": "s3",
    "quiz_type": "diagnostic",
    "answers": [
        {"question_id": "q_rec_1", "selected_index": 1}
    ]
})
print(f"\nQuiz Submission Response (Status {sub_status}):")
print(f"  Score: {sub_result['score_percentage']}% ({sub_result['correct_answers']}/{sub_result['total_questions']})")
print(f"  Feedback Result:")
for r in sub_result['results']:
    print(f"    - Question: {r['question_id']} | Concept: {r['concept_name']}")
    print(f"      Selected: {r['selected_index']} | Correct: {r['correct_index']} | is_correct: {r['is_correct']}")
    print(f"      Explanation: {r['explanation']}")

# Check updated mastery returned in submission response
recursion_mastery_updated = next((m for m in sub_result['updated_mastery'] if m['concept_id'] == 'c_recursion'), None)
print(f"\nImmediate Updated Mastery from submission response:")
print(f"  Score: {recursion_mastery_updated['score']}, State: {recursion_mastery_updated['state']}, Attempts: {recursion_mastery_updated['attempts_count']}, Correct: {recursion_mastery_updated['correct_count']}")

print("\n=== STEP 7: Refresh & Confirm Saved Progress Persists in SQLite ===")
# Make a fresh GET request to the student profile to verify persistence in SQLite database
status, s3_after = get("http://127.0.0.1:8000/api/students/s3")
recursion_mastery_persisted = next((m for m in s3_after['mastery_breakdown'] if m['concept_id'] == 'c_recursion'), None)
print(f"Dev Patel (s3) - Fresh GET request to /api/students/s3:")
print(f"  Score: {recursion_mastery_persisted['score']}, State: {recursion_mastery_persisted['state']}, Attempts: {recursion_mastery_persisted['attempts_count']}, Correct: {recursion_mastery_persisted['correct_count']}")

# Verify that attempts increased by 1 and correct increased by 1
assert recursion_mastery_persisted['attempts_count'] == recursion_mastery_before['attempts_count'] + 1
assert recursion_mastery_persisted['correct_count'] == recursion_mastery_before['correct_count'] + 1
print("\nSUCCESS: Progress persistence in SQLite verified!")
