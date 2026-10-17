import {
  Student, StudentDetail, Concept, QuizQuestion, QuizSubmitResponse,
  CodingProblemSummary, CodingProblemDetail, CodeSubmitResponse,
  SubmissionHistoryItem, VivaSessionResponse, VivaEvaluationResponse,
  ReviewItem, TeacherOverview, AdaptiveComparisonResponse,
  SandboxSecurityReport
} from './types';

const API_BASE = '/api';

export const api = {
  // Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  // Students
  async getStudents(): Promise<Student[]> {
    const res = await fetch(`${API_BASE}/students`);
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  },

  async getStudentDetail(studentId: string): Promise<StudentDetail> {
    const res = await fetch(`${API_BASE}/students/${studentId}`);
    if (!res.ok) throw new Error('Failed to fetch student details');
    return res.json();
  },

  // Concepts
  async getConcepts(studentId?: string): Promise<Concept[]> {
    const url = studentId ? `${API_BASE}/concepts?student_id=${studentId}` : `${API_BASE}/concepts`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch concepts');
    return res.json();
  },

  // Quiz
  async getDiagnosticQuiz(): Promise<QuizQuestion[]> {
    const res = await fetch(`${API_BASE}/quiz/diagnostic`);
    if (!res.ok) throw new Error('Failed to fetch diagnostic quiz');
    return res.json();
  },

  async getAdaptiveQuiz(studentId: string): Promise<QuizQuestion[]> {
    const res = await fetch(`${API_BASE}/quiz/adaptive/${studentId}`);
    if (!res.ok) throw new Error('Failed to fetch adaptive quiz');
    return res.json();
  },

  async getAdaptiveComparison(
    studentAId = 's1',
    studentBId = 's2',
    conceptFilter?: string
  ): Promise<AdaptiveComparisonResponse> {
    const url = new URL(`${API_BASE}/quiz/adaptive-compare`, window.location.origin);
    url.searchParams.set('student_a_id', studentAId);
    url.searchParams.set('student_b_id', studentBId);
    if (conceptFilter) url.searchParams.set('concept_filter', conceptFilter);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch adaptive comparison');
    return res.json();
  },

  async submitQuiz(
    studentId: string,
    quizType: string,
    answers: Array<{ question_id: string; selected_index: number }>
  ): Promise<QuizSubmitResponse> {
    const res = await fetch(`${API_BASE}/quiz/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, quiz_type: quizType, answers })
    });
    if (!res.ok) throw new Error('Failed to submit quiz');
    return res.json();
  },

  // Coding
  async getCodingProblems(): Promise<CodingProblemSummary[]> {
    const res = await fetch(`${API_BASE}/coding/problems`);
    if (!res.ok) throw new Error('Failed to fetch coding problems');
    return res.json();
  },

  async getCodingProblemDetail(problemId: string): Promise<CodingProblemDetail> {
    const res = await fetch(`${API_BASE}/coding/problems/${problemId}`);
    if (!res.ok) throw new Error('Failed to fetch coding problem detail');
    return res.json();
  },

  async submitCode(
    studentId: string,
    problemId: string,
    code: string,
    language = 'python',
    telemetry = { paste_count: 0, time_spent_seconds: 40, tab_switches: 0 }
  ): Promise<CodeSubmitResponse> {
    const res = await fetch(`${API_BASE}/coding/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        problem_id: problemId,
        code,
        language,
        telemetry
      })
    });
    if (!res.ok) throw new Error('Failed to submit code');
    return res.json();
  },

  async getStudentSubmissions(studentId: string): Promise<SubmissionHistoryItem[]> {
    const res = await fetch(`${API_BASE}/coding/submissions/${studentId}`);
    if (!res.ok) throw new Error('Failed to fetch submissions');
    return res.json();
  },

  async getSecurityReport(): Promise<SandboxSecurityReport> {
    const res = await fetch(`${API_BASE}/coding/security-report`);
    if (!res.ok) throw new Error('Failed to fetch sandbox security report');
    return res.json();
  },

  // Viva
  async startViva(
    submissionId: number,
    studentId: string,
    problemId: string
  ): Promise<VivaSessionResponse> {
    const res = await fetch(`${API_BASE}/viva/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission_id: submissionId, student_id: studentId, problem_id: problemId })
    });
    if (!res.ok) throw new Error('Failed to start viva session');
    return res.json();
  },

  async submitViva(
    sessionId: number,
    answers: Array<{ question_id: string; response_text: string }>
  ): Promise<VivaEvaluationResponse> {
    const res = await fetch(`${API_BASE}/viva/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, answers })
    });
    if (!res.ok) throw new Error('Failed to submit viva');
    return res.json();
  },

  // Teacher Dashboard
  async getTeacherOverview(): Promise<TeacherOverview> {
    const res = await fetch(`${API_BASE}/teacher/overview`);
    if (!res.ok) throw new Error('Failed to fetch teacher overview');
    return res.json();
  },

  async getReviewQueue(statusFilter?: string): Promise<ReviewItem[]> {
    const url = statusFilter ? `${API_BASE}/teacher/review-queue?status_filter=${statusFilter}` : `${API_BASE}/teacher/review-queue`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch review queue');
    return res.json();
  },

  async updateReviewItem(
    itemId: number,
    status: string,
    teacherNotes: string,
    reviewerName: string
  ): Promise<ReviewItem> {
    const res = await fetch(`${API_BASE}/teacher/review-queue/${itemId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, teacher_notes: teacherNotes, reviewer_name: reviewerName })
    });
    if (!res.ok) throw new Error('Failed to update review item');
    return res.json();
  }
};
