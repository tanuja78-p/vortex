/**
 * Map each feature to the matching route in your FastAPI backend.
 *
 * Every entry is intentionally `null`: no backend routes are assumed. While an entry is
 * `null` (or VITE_API_BASE_URL is empty) the UI uses clearly labeled demo data.
 * Set a path such as '/your/route' once the corresponding FastAPI route exists, and
 * make sure its response matches the type noted beside it in ./types.ts.
 */
export const endpoints = {
  /** GET → StudentDashboard */
  studentDashboard: null as string | null,
  /** GET → McqQuestion[] */
  diagnosticQuestions: null as string | null,
  /** POST { answers: Record<questionId, optionIndex> } → DiagnosticResult */
  diagnosticSubmit: null as string | null,
  /** GET ?conceptId=&difficulty= → McqQuestion[] */
  practiceQuestions: null as string | null,
  /** GET → CodingProblem */
  codingProblem: null as string | null,
  /** POST { problemId, language, code } → CodingSubmissionResult */
  codingSubmit: null as string | null,
  /** GET → VivaQuestion[] */
  vivaQuestions: null as string | null,
  /** POST { questionId, answer } → VivaFeedback (AI-evaluated on the server) */
  vivaEvaluate: null as string | null,
  /** GET → TeacherDashboard */
  teacherDashboard: null as string | null,
}

export type EndpointKey = keyof typeof endpoints
