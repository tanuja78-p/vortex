import urllib.request
import json

def post(url, payload):
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    return json.loads(urllib.request.urlopen(req).read().decode('utf-8'))

def get(url):
    return json.loads(urllib.request.urlopen(url).read().decode('utf-8'))

print("1. Fetching diagnostic questions...")
diag = get('http://127.0.0.1:8000/api/quiz/diagnostic')
print(f"   Received {len(diag)} diagnostic questions.")

print("2. Submitting quiz answers...")
quiz_res = post('http://127.0.0.1:8000/api/quiz/submit', {
    'student_id': 's1',
    'quiz_type': 'diagnostic',
    'answers': [{'question_id': 'q_oop_1', 'selected_index': 1}]
})
print(f"   Quiz Score: {quiz_res['score_percentage']}%, Mastery States Count: {len(quiz_res['updated_mastery'])}")

print("3. Submitting python solution to isolated code runner...")
code_res = post('http://127.0.0.1:8000/api/coding/submit', {
    'student_id': 's1',
    'problem_id': 'prob_two_sum',
    'code': "def two_sum(nums, target):\n    s = {}\n    for i, n in enumerate(nums):\n        if target - n in s:\n            return [s[target-n], i]\n        s[n] = i\n    return []",
    'telemetry': {'paste_count': 0, 'time_spent_seconds': 42.0, 'tab_switches': 0}
})
print(f"   Code Execution: {code_res['status']} ({code_res['tests_passed']}/{code_res['total_tests']} tests passed)")

print("4. Starting viva defense session...")
viva_res = post('http://127.0.0.1:8000/api/viva/start', {
    'submission_id': code_res['submission_id'],
    'student_id': 's1',
    'problem_id': 'prob_two_sum'
})
print(f"   Viva Session ID: {viva_res['session_id']}, Questions Generated: {len(viva_res['questions'])}")

print("5. Submitting oral defense responses...")
viva_eval = post('http://127.0.0.1:8000/api/viva/submit', {
    'session_id': viva_res['session_id'],
    'answers': [
        {'question_id': 'viva_q1', 'response_text': 'I used a single-pass hash map to store each number and its index so complements are found in O(1) time.'},
        {'question_id': 'viva_q2', 'response_text': 'Time complexity is O(n) because each lookup is constant time on average. Auxiliary space is O(n) for the dictionary.'},
        {'question_id': 'viva_q3', 'response_text': 'I tested negative integers, zero target, and edge cases where duplicate numbers add up to the target.'}
    ]
})
print(f"   Viva Score: {viva_eval['viva_score']}/100, Rating: {viva_eval['rating']}")
print(f"   Summary Feedback: {viva_eval['summary_feedback'][:80]}...")

print("6. Verifying Teacher Human-Review Queue...")
queue = get('http://127.0.0.1:8000/api/teacher/review-queue')
print(f"   Human-Review Queue items count: {len(queue)}")
print("SUCCESS: Complete end-to-end user journey verified!")
