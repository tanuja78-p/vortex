import json
import datetime
from sqlalchemy.orm import Session
from .models import (
    Student, Concept, ConceptMastery, QuizQuestion,
    CodingProblem, CodingSubmission, VivaSession, ReviewItem
)

def seed_database(db: Session):
    # Check if already seeded
    if db.query(Student).first():
        return

    # 1. Seed Concepts
    concepts_data = [
        {
            "id": "c_oop",
            "name": "Classes & Objects",
            "category": "Object-Oriented Programming",
            "difficulty": "Easy",
            "prerequisites": "[]",
            "description": "Encapsulation, instances, constructors, and object-oriented modeling."
        },
        {
            "id": "c_inheritance",
            "name": "Inheritance & Polymorphism",
            "category": "Object-Oriented Programming",
            "difficulty": "Medium",
            "prerequisites": '["c_oop"]',
            "description": "Class hierarchies, method overriding, super() invocation, and polymorphic dispatch."
        },
        {
            "id": "c_recursion",
            "name": "Recursion & Call Stacks",
            "category": "Algorithms",
            "difficulty": "Medium",
            "prerequisites": "[]",
            "description": "Base cases, recursive step, call stack frames, and recursion depth limits."
        },
        {
            "id": "c_dp",
            "name": "Dynamic Programming & Memoization",
            "category": "Algorithms",
            "difficulty": "Hard",
            "prerequisites": '["c_recursion"]',
            "description": "Overlapping subproblems, optimal substructure, top-down memoization vs bottom-up tabulation."
        },
        {
            "id": "c_trees",
            "name": "Binary Trees & Traversal",
            "category": "Data Structures",
            "difficulty": "Medium",
            "prerequisites": '["c_recursion"]',
            "description": "Tree nodes, preorder/inorder/postorder traversals, and depth calculations."
        },
        {
            "id": "c_complexity",
            "name": "Asymptotic Complexity (Big-O)",
            "category": "Foundations",
            "difficulty": "Easy",
            "prerequisites": "[]",
            "description": "Deriving upper bounds O(1), O(log n), O(n), O(n log n), and O(n^2) for time and auxiliary space."
        }
    ]

    for c in concepts_data:
        db.add(Concept(**c))
    db.commit()

    # 2. Seed Students
    students_data = [
        {
            "id": "s1",
            "name": "Alex Johnson",
            "email": "alex.johnson@university.edu",
            "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=Alex"
        },
        {
            "id": "s2",
            "name": "Sarah Smith",
            "email": "sarah.smith@university.edu",
            "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=Sarah"
        },
        {
            "id": "s3",
            "name": "Dev Patel",
            "email": "dev.patel@university.edu",
            "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=Dev"
        },
        {
            "id": "s4",
            "name": "Priya Sharma",
            "email": "priya.sharma@university.edu",
            "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=Priya"
        }
    ]

    for s in students_data:
        db.add(Student(**s))
    db.commit()

    # 3. Seed Concept Mastery
    # Alex: Solid in OOP, Needs Practice in Recursion, Not Understood in DP, Not Assessed in Trees
    masteries_data = [
        # Alex (s1)
        {"student_id": "s1", "concept_id": "c_oop", "score": 0.92, "attempts_count": 5, "correct_count": 5, "state": "Solid"},
        {"student_id": "s1", "concept_id": "c_inheritance", "score": 0.85, "attempts_count": 3, "correct_count": 3, "state": "Solid"},
        {"student_id": "s1", "concept_id": "c_recursion", "score": 0.58, "attempts_count": 4, "correct_count": 2, "state": "Needs Practice"},
        {"student_id": "s1", "concept_id": "c_dp", "score": 0.20, "attempts_count": 3, "correct_count": 0, "state": "Not Understood"},
        {"student_id": "s1", "concept_id": "c_complexity", "score": 0.70, "attempts_count": 2, "correct_count": 1, "state": "Needs Practice"},
        {"student_id": "s1", "concept_id": "c_trees", "score": 0.0, "attempts_count": 0, "correct_count": 0, "state": "Not Assessed"},

        # Sarah (s2)
        {"student_id": "s2", "concept_id": "c_oop", "score": 0.96, "attempts_count": 6, "correct_count": 6, "state": "Solid"},
        {"student_id": "s2", "concept_id": "c_inheritance", "score": 0.90, "attempts_count": 4, "correct_count": 4, "state": "Solid"},
        {"student_id": "s2", "concept_id": "c_recursion", "score": 0.88, "attempts_count": 5, "correct_count": 4, "state": "Solid"},
        {"student_id": "s2", "concept_id": "c_dp", "score": 0.65, "attempts_count": 3, "correct_count": 2, "state": "Needs Practice"},
        {"student_id": "s2", "concept_id": "c_complexity", "score": 0.90, "attempts_count": 3, "correct_count": 3, "state": "Solid"},
        {"student_id": "s2", "concept_id": "c_trees", "score": 0.82, "attempts_count": 3, "correct_count": 3, "state": "Solid"},

        # Dev (s3)
        {"student_id": "s3", "concept_id": "c_oop", "score": 0.50, "attempts_count": 2, "correct_count": 1, "state": "Needs Practice"},
        {"student_id": "s3", "concept_id": "c_inheritance", "score": 0.30, "attempts_count": 3, "correct_count": 1, "state": "Not Understood"},
        {"student_id": "s3", "concept_id": "c_recursion", "score": 0.25, "attempts_count": 4, "correct_count": 1, "state": "Not Understood"},
        {"student_id": "s3", "concept_id": "c_dp", "score": 0.0, "attempts_count": 0, "correct_count": 0, "state": "Not Assessed"},
        {"student_id": "s3", "concept_id": "c_complexity", "score": 0.45, "attempts_count": 2, "correct_count": 1, "state": "Needs Practice"},
        {"student_id": "s3", "concept_id": "c_trees", "score": 0.0, "attempts_count": 0, "correct_count": 0, "state": "Not Assessed"},

        # Priya (s4)
        {"student_id": "s4", "concept_id": "c_oop", "score": 0.85, "attempts_count": 3, "correct_count": 3, "state": "Solid"},
        {"student_id": "s4", "concept_id": "c_inheritance", "score": 0.75, "attempts_count": 3, "correct_count": 2, "state": "Needs Practice"},
        {"student_id": "s4", "concept_id": "c_recursion", "score": 0.70, "attempts_count": 3, "correct_count": 2, "state": "Needs Practice"},
        {"student_id": "s4", "concept_id": "c_dp", "score": 0.40, "attempts_count": 2, "correct_count": 1, "state": "Needs Practice"},
        {"student_id": "s4", "concept_id": "c_complexity", "score": 0.60, "attempts_count": 2, "correct_count": 1, "state": "Needs Practice"},
        {"student_id": "s4", "concept_id": "c_trees", "score": 0.45, "attempts_count": 2, "correct_count": 1, "state": "Needs Practice"}
    ]

    for m in masteries_data:
        db.add(ConceptMastery(**m))
    db.commit()

    # 4. Seed Quiz Questions (Diagnostic & Adaptive Practice)
    questions_data = [
        # OOP
        {
            "id": "q_oop_1",
            "concept_id": "c_oop",
            "title": "Instance Attributes vs Class Attributes",
            "prompt": "What will be printed when this Python code executes?",
            "code_snippet": "class Server:\n    active = 0\n    def __init__(self, name):\n        self.name = name\n        Server.active += 1\n\ns1 = Server('node-1')\ns2 = Server('node-2')\nprint(s1.active, s2.active)",
            "options": json.dumps(["1 1", "2 2", "0 0", "AttributeError"]),
            "correct_index": 1,
            "explanation": "Server.active is a class-level variable shared by all instances. Each instantiated Server increments Server.active, so it equals 2.",
            "difficulty": "Easy",
            "question_type": "diagnostic"
        },
        {
            "id": "q_oop_2",
            "concept_id": "c_oop",
            "title": "Encapsulation with Private Attributes",
            "prompt": "How does Python enforce private instance variables prefixed with double underscores (e.g., `__balance`)?",
            "code_snippet": "class Account:\n    def __init__(self, val):\n        self.__balance = val\n\nacc = Account(100)",
            "options": json.dumps([
                "Throws a compile-time restriction if accessed outside",
                "Name mangles the variable into _Account__balance",
                "Encrypts the variable in process memory",
                "Converts the variable into an immutable read-only tuple"
            ]),
            "correct_index": 1,
            "explanation": "Python performs name mangling, rewriting __balance to _ClassName__balance.",
            "difficulty": "Medium",
            "question_type": "adaptive_practice"
        },

        # Inheritance & Polymorphism
        {
            "id": "q_inh_1",
            "concept_id": "c_inheritance",
            "title": "Super and Method Resolution Order (MRO)",
            "prompt": "In the following class hierarchy, which greeting() method will be called?",
            "code_snippet": "class Base:\n    def greet(self):\n        return 'Base'\nclass Sub(Base):\n    def greet(self):\n        return 'Sub: ' + super().greet()\n\nprint(Sub().greet())",
            "options": json.dumps(["Sub: Base", "Base", "Sub: Sub", "RecursionError"]),
            "correct_index": 0,
            "explanation": "super().greet() delegates up the MRO to Base.greet(), returning 'Base', prepended with 'Sub: '.",
            "difficulty": "Easy",
            "question_type": "diagnostic"
        },

        # Recursion
        {
            "id": "q_rec_1",
            "concept_id": "c_recursion",
            "title": "Recursive Base Case Missing",
            "prompt": "What happens if a recursive function does not define a terminating base case?",
            "code_snippet": "def countdown(n):\n    print(n)\n    return countdown(n - 1)",
            "options": json.dumps([
                "The program runs infinitely until OS memory crash",
                "Python raises a RecursionError (maximum recursion depth exceeded)",
                "Returns None automatically when n reaches 0",
                "Compiles into an iterative loop automatically"
            ]),
            "correct_index": 1,
            "explanation": "Python enforces a recursion limit (default 1000) and raises RecursionError when exceeded.",
            "difficulty": "Easy",
            "question_type": "diagnostic"
        },
        {
            "id": "q_rec_2",
            "concept_id": "c_recursion",
            "title": "Recursion Call Stack Frame Memory",
            "prompt": "What is the auxiliary space complexity of a linear recursive depth n without tail call optimization?",
            "code_snippet": "def sum_to_n(n):\n    if n <= 0:\n        return 0\n    return n + sum_to_n(n - 1)",
            "options": json.dumps(["O(1)", "O(log n)", "O(n)", "O(n^2)"]),
            "correct_index": 2,
            "explanation": "Each recursive invocation pushes a stack frame onto the call stack, requiring O(n) auxiliary memory.",
            "difficulty": "Medium",
            "question_type": "adaptive_practice"
        },

        # Dynamic Programming
        {
            "id": "q_dp_1",
            "concept_id": "c_dp",
            "title": "Memoization vs Plain Recursion",
            "prompt": "Why does naive recursive Fibonacci have O(2^n) time complexity while memoized top-down Fibonacci has O(n)?",
            "code_snippet": "def fib(n, memo={}):\n    if n <= 1:\n        return n\n    if n not in memo:\n        memo[n] = fib(n-1, memo) + fib(n-2, memo)\n    return memo[n]",
            "options": json.dumps([
                "Memoization converts recursion into C-level multi-threading",
                "Memoization avoids redundant recomputations of overlapping subproblems",
                "Memoization uses binary search on cache keys",
                "Memoization reduces the number of arguments passed"
            ]),
            "correct_index": 1,
            "explanation": "Top-down memoization stores the computed result for each subproblem, ensuring each state is solved exactly once.",
            "difficulty": "Medium",
            "question_type": "diagnostic"
        },
        {
            "id": "q_dp_2",
            "concept_id": "c_dp",
            "title": "Optimal Substructure in DP",
            "prompt": "Which of the following is an essential precondition for applying Dynamic Programming?",
            "code_snippet": "",
            "options": json.dumps([
                "The problem must have overlapping subproblems and optimal substructure",
                "The problem must be strictly solvable in O(1) space",
                "The graph must contain negative weight cycles",
                "The algorithm must run in parallel across CPU cores"
            ]),
            "correct_index": 0,
            "explanation": "Dynamic Programming requires optimal substructure (optimal solution composed of optimal solutions to subproblems) and overlapping subproblems.",
            "difficulty": "Hard",
            "question_type": "adaptive_practice"
        },

        # Complexity
        {
            "id": "q_cmp_1",
            "concept_id": "c_complexity",
            "title": "Nested Loop Asymptotic Complexity",
            "prompt": "What is the worst-case time complexity of the following code snippet?",
            "code_snippet": "def analyze(arr):\n    n = len(arr)\n    count = 0\n    for i in range(n):\n        for j in range(i, n):\n            count += arr[i] * arr[j]\n    return count",
            "options": json.dumps(["O(n)", "O(n log n)", "O(n^2)", "O(2^n)"]),
            "correct_index": 2,
            "explanation": "The inner loop runs n + (n-1) + ... + 1 = n(n+1)/2 times, which simplifies to O(n^2).",
            "difficulty": "Easy",
            "question_type": "diagnostic"
        },

        # Binary Trees
        {
            "id": "q_tree_1",
            "concept_id": "c_trees",
            "title": "Inorder Traversal of Binary Search Tree",
            "prompt": "What characteristic sequence does an in-order traversal (Left, Root, Right) of a Binary Search Tree always yield?",
            "code_snippet": "def inorder(node):\n    if not node: return []\n    return inorder(node.left) + [node.val] + inorder(node.right)",
            "options": json.dumps([
                "Reverse sorted order",
                "Strictly ascending sorted order",
                "Random level-order sequence",
                "Topological order of dependencies"
            ]),
            "correct_index": 1,
            "explanation": "In a BST, all left descendants are smaller and all right descendants are greater, so in-order traversal visits nodes in ascending sorted order.",
            "difficulty": "Medium",
            "question_type": "adaptive_practice"
        }
    ]

    for q in questions_data:
        db.add(QuizQuestion(**q))
    db.commit()

    # 5. Seed Coding Problems
    problems_data = [
        {
            "id": "prob_two_sum",
            "concept_id": "c_oop",
            "title": "Two Sum Target Lookup",
            "difficulty": "Easy",
            "description": "Given a list of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume each input has exactly one solution and you may not use the same element twice. Return the indices sorted in ascending order `[i, j]`.",
            "initial_code": "def two_sum(nums, target):\n    # TODO: Implement optimal O(n) solution using hash map lookup\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []\n",
            "function_name": "two_sum",
            "test_cases": json.dumps([
                {"input": [[2, 7, 11, 15], 9], "expected": [0, 1], "is_hidden": False, "unpack_args": True},
                {"input": [[3, 2, 4], 6], "expected": [1, 2], "is_hidden": False, "unpack_args": True},
                {"input": [[3, 3], 6], "expected": [0, 1], "is_hidden": False, "unpack_args": True},
                {"input": [[-1, -2, -3, -4, -5], -8], "expected": [2, 4], "is_hidden": True, "unpack_args": True},
                {"input": [[1000, 2000, 3000, 4000], 7000], "expected": [2, 3], "is_hidden": True, "unpack_args": True}
            ]),
            "tags": json.dumps(["Arrays", "Hash Tables", "O(n)"])
        },
        {
            "id": "prob_valid_palindrome",
            "concept_id": "c_complexity",
            "title": "Valid Alphanumeric Palindrome",
            "difficulty": "Easy",
            "description": "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Return `True` if `s` is a palindrome, or `False` otherwise.",
            "initial_code": "def is_palindrome(s: str) -> bool:\n    # TODO: Clean non-alphanumeric characters and check symmetry\n    cleaned = [c.lower() for c in s if c.isalnum()]\n    return cleaned == cleaned[::-1]\n",
            "function_name": "is_palindrome",
            "test_cases": json.dumps([
                {"input": "A man, a plan, a canal: Panama", "expected": True, "is_hidden": False},
                {"input": "race a car", "expected": False, "is_hidden": False},
                {"input": " ", "expected": True, "is_hidden": False},
                {"input": "0P", "expected": False, "is_hidden": True},
                {"input": "No 'x' in Nixon", "expected": True, "is_hidden": True}
            ]),
            "tags": json.dumps(["Strings", "Two Pointers", "O(n)"])
        },
        {
            "id": "prob_fib_memo",
            "concept_id": "c_dp",
            "title": "Climbing Stairs (Dynamic Programming)",
            "difficulty": "Medium",
            "description": "You are climbing a staircase. It takes `n` steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top? Implement with O(n) time and O(1) auxiliary space.",
            "initial_code": "def climb_stairs(n: int) -> int:\n    if n <= 2:\n        return n\n    a, b = 1, 2\n    for _ in range(3, n + 1):\n        a, b = b, a + b\n    return b\n",
            "function_name": "climb_stairs",
            "test_cases": json.dumps([
                {"input": 2, "expected": 2, "is_hidden": False},
                {"input": 3, "expected": 3, "is_hidden": False},
                {"input": 5, "expected": 8, "is_hidden": False},
                {"input": 10, "expected": 89, "is_hidden": True},
                {"input": 20, "expected": 10946, "is_hidden": True}
            ]),
            "tags": json.dumps(["Dynamic Programming", "Memoization", "O(n)"])
        }
    ]

    for p in problems_data:
        db.add(CodingProblem(**p))
    db.commit()

    # 6. Seed Submissions, Viva Sessions, and Review Items
    # Pre-seed realistic human review items for the Teacher Dashboard
    sub_1 = CodingSubmission(
        student_id="s4",
        problem_id="prob_two_sum",
        code="def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []\n",
        language="python",
        status="Accepted",
        tests_passed=5,
        total_tests=5,
        test_details=json.dumps([{"test_id": i+1, "passed": True} for i in range(5)]),
        runtime_ms=1.2,
        has_evidence_flag=True,
        flag_reason="Rapid Code Influx: 14 lines pasted within 0.7s without incremental edits.",
        paste_frequency=3,
        execution_time_taken_seconds=12.4
    )
    db.add(sub_1)
    db.commit()
    db.refresh(sub_1)

    viva_1 = VivaSession(
        submission_id=sub_1.id,
        student_id="s4",
        problem_id="prob_two_sum",
        questions=json.dumps([
            {"id": "viva_q1", "prompt": "Explain the step-by-step logic of your two-sum solution.", "category": "logic"},
            {"id": "viva_q2", "prompt": "State the Time and Space Complexity in Big-O.", "category": "complexity"},
            {"id": "viva_q3", "prompt": "What edge cases did you test?", "category": "edge_cases"}
        ]),
        responses=json.dumps([
            {"question_id": "viva_q1", "response_text": "I used two nested loops to check every possible pair of numbers in the list."},
            {"question_id": "viva_q2", "response_text": "The time complexity is O(1) constant time because hash lookups are immediate."},
            {"question_id": "viva_q3", "response_text": "Tested empty arrays."}
        ]),
        evaluation=json.dumps({
            "viva_score": 42.0,
            "rating": "Needs Review",
            "summary_feedback": "Severe discrepancy between code and viva explanation. Student code implements single-pass hash map, but student viva claims nested loops and O(1) total time.",
            "rubric_scores": {
                "logic": {"score": 12, "max": 30, "feedback": "Contradicts submitted code implementation."},
                "complexity": {"score": 15, "max": 35, "feedback": "Incorrect complexity claim of O(1) for overall algorithm."},
                "edge_cases": {"score": 15, "max": 35, "feedback": "Minimal edge case discussion."}
            },
            "discrepancy_flagged": True
        }),
        is_evaluated=True
    )
    db.add(viva_1)
    db.commit()
    db.refresh(viva_1)

    # Seed Review Items
    review_item_1 = ReviewItem(
        student_id="s4",
        submission_id=sub_1.id,
        viva_session_id=viva_1.id,
        problem_title="Two Sum Target Lookup",
        flag_type="Viva-Code Logic Mismatch",
        severity="High",
        evidence_details=json.dumps({
            "paste_events": 3,
            "time_to_submit_seconds": 12.4,
            "keystroke_velocity_chars_per_sec": 38.5,
            "flag_trigger": "Student code is single-pass O(n) hash table, but viva description stated nested loops and O(1) total runtime.",
            "viva_score": 42.0,
            "automated_decision": "Never auto-flagged as cheating. Strictly marked for teacher interview verification."
        }),
        status="Pending Review",
        teacher_notes="",
        reviewer_name="",
        flagged_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=35)
    )

    review_item_2 = ReviewItem(
        student_id="s3",
        submission_id=None,
        viva_session_id=None,
        problem_title="Recursion Diagnostic Assessment",
        flag_type="High Focus Loss / Tab Switches",
        severity="Medium",
        evidence_details=json.dumps({
            "tab_blur_events": 6,
            "unfocused_duration_seconds": 145,
            "flag_trigger": "Multiple background window switches during timed recursion diagnostic.",
            "automated_decision": "Teacher follow-up queue item. Presumed innocent pending educator review."
        }),
        status="Pending Review",
        teacher_notes="",
        reviewer_name="",
        flagged_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2)
    )

    review_item_3 = ReviewItem(
        student_id="s1",
        submission_id=None,
        viva_session_id=None,
        problem_title="Valid Alphanumeric Palindrome",
        flag_type="Rapid Submission Telemetry",
        severity="Low",
        evidence_details=json.dumps({
            "paste_events": 1,
            "time_to_submit_seconds": 38.0,
            "flag_trigger": "Single paste chunk of starter template.",
            "automated_decision": "Cleared upon teacher verification."
        }),
        status="Verified Legitimate",
        teacher_notes="Student pasted the standard boilerplate string comprehension from their own scratchpad notes. Legitimate understanding verified in oral recap.",
        reviewer_name="Prof. Anderson",
        flagged_at=datetime.datetime.utcnow() - datetime.timedelta(hours=5),
        reviewed_at=datetime.datetime.utcnow() - datetime.timedelta(hours=4)
    )

    db.add(review_item_1)
    db.add(review_item_2)
    db.add(review_item_3)
    db.commit()
