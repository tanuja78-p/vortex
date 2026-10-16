/**
 * DEMO DATA — used only when the backend is not configured or unreachable.
 * Every screen that renders this data shows a visible "Demo data" badge.
 */
import type {
  CodingProblem,
  McqQuestion,
  StudentDashboard,
  TeacherDashboard,
  VivaQuestion,
} from './types'

const concepts = [
  { id: 'arrays', name: 'Arrays & Strings', mastery: 86, attempts: 42 },
  { id: 'recursion', name: 'Recursion', mastery: 48, attempts: 18 },
  { id: 'linked-lists', name: 'Linked Lists', mastery: 72, attempts: 25 },
  { id: 'trees', name: 'Binary Trees', mastery: 41, attempts: 14 },
  { id: 'sorting', name: 'Sorting', mastery: 79, attempts: 31 },
  { id: 'complexity', name: 'Time Complexity', mastery: 63, attempts: 22 },
]

export const demoStudentDashboard: StudentDashboard = {
  studentName: 'Aarav Mehta',
  course: 'CS201 · Data Structures & Algorithms',
  overallProgress: 64,
  streakDays: 9,
  weeklyActivity: [
    { day: 'Mon', minutes: 35 },
    { day: 'Tue', minutes: 52 },
    { day: 'Wed', minutes: 18 },
    { day: 'Thu', minutes: 64 },
    { day: 'Fri', minutes: 41 },
    { day: 'Sat', minutes: 75 },
    { day: 'Sun', minutes: 28 },
  ],
  concepts,
  weakTopics: concepts.filter((c) => c.mastery < 60).sort((a, b) => a.mastery - b.mastery),
  recommendation: {
    title: 'Practice: Binary Trees',
    description: 'Your mastery dropped after the last quiz. 8 adaptive questions starting at easy difficulty.',
    kind: 'practice',
    conceptId: 'trees',
    estimatedMinutes: 15,
  },
  recentActivity: [
    { id: 'a1', label: 'Diagnostic · Week 6', score: 72, when: '2 hours ago' },
    { id: 'a2', label: 'Coding · Two Sum Variants', score: 100, when: 'Yesterday' },
    { id: 'a3', label: 'Viva · Recursion basics', score: 58, when: '2 days ago' },
    { id: 'a4', label: 'Practice · Sorting', score: 85, when: '3 days ago' },
  ],
}

export const demoQuestionBank: McqQuestion[] = [
  {
    id: 'q1',
    conceptId: 'complexity',
    conceptName: 'Time Complexity',
    difficulty: 'easy',
    prompt: 'What is the time complexity of accessing an element by index in an array?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctIndex: 0,
    explanation: 'Arrays store elements contiguously, so the address of any index is computed directly.',
  },
  {
    id: 'q2',
    conceptId: 'recursion',
    conceptName: 'Recursion',
    difficulty: 'easy',
    prompt: 'Which component is required to stop a recursive function from running forever?',
    options: ['A loop counter', 'A base case', 'A global variable', 'Tail call optimization'],
    correctIndex: 1,
    explanation: 'A base case returns without recursing further, guaranteeing termination.',
  },
  {
    id: 'q3',
    conceptId: 'trees',
    conceptName: 'Binary Trees',
    difficulty: 'medium',
    prompt: 'Which traversal of a binary search tree visits nodes in ascending order?',
    options: ['Pre-order', 'Post-order', 'In-order', 'Level-order'],
    correctIndex: 2,
    explanation: 'In-order visits left subtree, node, then right subtree — producing sorted order in a BST.',
  },
  {
    id: 'q4',
    conceptId: 'sorting',
    conceptName: 'Sorting',
    difficulty: 'medium',
    prompt: 'Which sorting algorithm has a worst-case complexity of O(n log n)?',
    options: ['Quick sort', 'Merge sort', 'Bubble sort', 'Insertion sort'],
    correctIndex: 1,
    explanation: 'Merge sort always splits in halves and merges in linear time, giving O(n log n) in all cases.',
  },
  {
    id: 'q5',
    conceptId: 'linked-lists',
    conceptName: 'Linked Lists',
    difficulty: 'medium',
    prompt: 'What is the cost of inserting a node at the head of a singly linked list?',
    options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
    correctIndex: 2,
    explanation: 'Only the new node and the head pointer change, regardless of list length.',
  },
  {
    id: 'q6',
    conceptId: 'trees',
    conceptName: 'Binary Trees',
    difficulty: 'hard',
    prompt: 'The maximum number of nodes in a binary tree of height h (root at height 0) is:',
    options: ['2^h', '2^(h+1) − 1', 'h²', '2h + 1'],
    correctIndex: 1,
    explanation: 'Each level k holds up to 2^k nodes; summing levels 0..h gives 2^(h+1) − 1.',
  },
  {
    id: 'q7',
    conceptId: 'recursion',
    conceptName: 'Recursion',
    difficulty: 'medium',
    prompt: 'What does fib(5) return if fib(0)=0, fib(1)=1 and fib(n)=fib(n−1)+fib(n−2)?',
    options: ['3', '5', '8', '13'],
    correctIndex: 1,
    explanation: 'The sequence is 0, 1, 1, 2, 3, 5 — so fib(5) = 5.',
  },
  {
    id: 'q8',
    conceptId: 'recursion',
    conceptName: 'Recursion',
    difficulty: 'hard',
    prompt: 'Naive recursive Fibonacci runs in which time complexity?',
    options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'],
    correctIndex: 3,
    explanation: 'Each call branches into two more calls, so the call tree grows exponentially.',
  },
  {
    id: 'q9',
    conceptId: 'trees',
    conceptName: 'Binary Trees',
    difficulty: 'easy',
    prompt: 'In a binary tree, each node has at most how many children?',
    options: ['1', '2', '3', 'Unlimited'],
    correctIndex: 1,
    explanation: 'By definition, a binary tree node has a left and a right child at most.',
  },
  {
    id: 'q10',
    conceptId: 'complexity',
    conceptName: 'Time Complexity',
    difficulty: 'hard',
    prompt: 'Binary search on a sorted array of 1,024 elements needs at most how many comparisons?',
    options: ['10', '11', '32', '512'],
    correctIndex: 1,
    explanation: 'log₂(1024) = 10 halvings plus a final comparison gives at most 11.',
  },
]

export const demoCodingProblem: CodingProblem = {
  id: 'p-balanced',
  title: 'Balanced Brackets',
  difficulty: 'medium',
  statement:
    'Given a string containing only the characters ( ) { } [ ], determine whether the brackets are balanced. A string is balanced when every opening bracket is closed by the same type of bracket in the correct order. Print "true" or "false".',
  constraints: ['1 ≤ length ≤ 10⁴', 'Input contains only bracket characters', 'Aim for O(n) time'],
  sampleTests: [
    { input: '()[]{}', expectedOutput: 'true' },
    { input: '([)]', expectedOutput: 'false' },
    { input: '{[()()]}', expectedOutput: 'true' },
  ],
  starterCode: {
    python: `def is_balanced(s: str) -> bool:\n    # Write your solution here\n    pass\n\n\nif __name__ == "__main__":\n    print(str(is_balanced(input().strip())).lower())\n`,
    javascript: `function isBalanced(s) {\n  // Write your solution here\n}\n\nconst input = require("fs").readFileSync(0, "utf8").trim();\nconsole.log(String(isBalanced(input)));\n`,
    java: `import java.util.*;\n\npublic class Main {\n    static boolean isBalanced(String s) {\n        // Write your solution here\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println(isBalanced(sc.nextLine().trim()));\n    }\n}\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nbool isBalanced(const string& s) {\n    // Write your solution here\n    return false;\n}\n\nint main() {\n    string s; getline(cin, s);\n    cout << (isBalanced(s) ? "true" : "false") << endl;\n}\n`,
  },
}

export const demoVivaQuestions: VivaQuestion[] = [
  {
    id: 'v1',
    conceptName: 'Recursion',
    prompt: 'Explain how recursion works and what role the call stack plays.',
    keyPoints: ['base case', 'call stack', 'stack frame', 'return', 'stack overflow', 'subproblem'],
  },
  {
    id: 'v2',
    conceptName: 'Binary Trees',
    prompt: 'What makes a binary search tree efficient, and when can it degrade?',
    keyPoints: ['left', 'right', 'ordered', 'log n', 'balanced', 'skewed', 'linear'],
  },
  {
    id: 'v3',
    conceptName: 'Time Complexity',
    prompt: 'Why do we use Big-O notation instead of measuring actual runtime in seconds?',
    keyPoints: ['growth', 'input size', 'hardware', 'worst case', 'asymptotic', 'constant'],
  },
]

export const demoTeacherDashboard: TeacherDashboard = {
  className: 'CS201 · Section B',
  studentCount: 48,
  avgScore: 71,
  completionRate: 83,
  pendingReviews: 6,
  students: [
    { id: 's1', name: 'Aarav Mehta', avgScore: 74, progress: 64, lastActive: '2h ago', atRisk: false },
    { id: 's2', name: 'Priya Nair', avgScore: 91, progress: 88, lastActive: '30m ago', atRisk: false },
    { id: 's3', name: 'Rohan Das', avgScore: 52, progress: 37, lastActive: '4d ago', atRisk: true },
    { id: 's4', name: 'Sara Khan', avgScore: 68, progress: 59, lastActive: '1d ago', atRisk: false },
    { id: 's5', name: 'Vikram Rao', avgScore: 47, progress: 29, lastActive: '6d ago', atRisk: true },
    { id: 's6', name: 'Meera Iyer', avgScore: 83, progress: 76, lastActive: '5h ago', atRisk: false },
  ],
  submissions: [
    { id: 'sub1', studentName: 'Rohan Das', assessment: 'Viva · Recursion basics', type: 'viva', score: null, submittedAt: '10 min ago', status: 'needs-review' },
    { id: 'sub2', studentName: 'Priya Nair', assessment: 'Coding · Balanced Brackets', type: 'coding', score: 100, submittedAt: '35 min ago', status: 'graded' },
    { id: 'sub3', studentName: 'Sara Khan', assessment: 'Coding · Balanced Brackets', type: 'coding', score: 66, submittedAt: '1h ago', status: 'needs-review' },
    { id: 'sub4', studentName: 'Vikram Rao', assessment: 'Diagnostic · Week 6', type: 'diagnostic', score: 40, submittedAt: '3h ago', status: 'graded' },
    { id: 'sub5', studentName: 'Meera Iyer', assessment: 'Viva · BST efficiency', type: 'viva', score: null, submittedAt: '5h ago', status: 'needs-review' },
    { id: 'sub6', studentName: 'Aarav Mehta', assessment: 'Practice · Sorting', type: 'practice', score: 85, submittedAt: '1d ago', status: 'graded' },
  ],
  conceptProgress: [
    { name: 'Arrays', mastery: 82 },
    { name: 'Recursion', mastery: 54 },
    { name: 'Linked Lists', mastery: 69 },
    { name: 'Trees', mastery: 47 },
    { name: 'Sorting', mastery: 76 },
    { name: 'Complexity', mastery: 61 },
  ],
}
