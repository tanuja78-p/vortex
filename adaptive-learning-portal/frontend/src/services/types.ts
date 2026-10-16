export type Difficulty = 'easy' | 'medium' | 'hard'

export type DataSource = 'api' | 'demo'

export interface Sourced<T> {
  data: T
  source: DataSource
  /** Present when the API was configured but the request failed and demo data was used instead. */
  fallbackReason?: string
}

export interface ConceptMastery {
  id: string
  name: string
  mastery: number
  attempts: number
}

export interface Recommendation {
  title: string
  description: string
  kind: 'practice' | 'diagnostic' | 'coding' | 'viva'
  conceptId?: string
  estimatedMinutes: number
}

export interface StudentDashboard {
  studentName: string
  course: string
  overallProgress: number
  streakDays: number
  weeklyActivity: { day: string; minutes: number }[]
  concepts: ConceptMastery[]
  weakTopics: ConceptMastery[]
  recommendation: Recommendation
  recentActivity: { id: string; label: string; score: number; when: string }[]
}

export interface McqQuestion {
  id: string
  conceptId: string
  conceptName: string
  prompt: string
  options: string[]
  correctIndex: number
  difficulty: Difficulty
  explanation: string
}

export interface DiagnosticResult {
  score: number
  total: number
  perConcept: { conceptName: string; correct: number; total: number }[]
}

export interface TestCase {
  input: string
  expectedOutput: string
}

export interface CodingProblem {
  id: string
  title: string
  difficulty: Difficulty
  statement: string
  constraints: string[]
  sampleTests: TestCase[]
  starterCode: Record<CodingLanguage, string>
}

export type CodingLanguage = 'python' | 'javascript' | 'java' | 'cpp'

export interface CodingSubmissionResult {
  status: 'accepted' | 'partial' | 'failed'
  passed: number
  total: number
  runtimeMs: number
  cases: { input: string; expected: string; actual: string; passed: boolean }[]
}

export interface VivaQuestion {
  id: string
  conceptName: string
  prompt: string
  keyPoints: string[]
}

export interface VivaFeedback {
  score: number
  summary: string
  strengths: string[]
  improvements: string[]
  /** 'ai' when produced by the backend AI service, 'rubric' when produced by the local keyword fallback. */
  evaluator: 'ai' | 'rubric'
}

export interface StudentRow {
  id: string
  name: string
  avgScore: number
  progress: number
  lastActive: string
  atRisk: boolean
}

export interface Submission {
  id: string
  studentName: string
  assessment: string
  type: 'diagnostic' | 'coding' | 'viva' | 'practice'
  score: number | null
  submittedAt: string
  status: 'graded' | 'needs-review'
}

export interface TeacherDashboard {
  className: string
  studentCount: number
  avgScore: number
  completionRate: number
  pendingReviews: number
  students: StudentRow[]
  submissions: Submission[]
  conceptProgress: { name: string; mastery: number }[]
}
