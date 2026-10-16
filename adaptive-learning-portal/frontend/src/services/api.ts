import {
  demoCodingProblem,
  demoQuestionBank,
  demoStudentDashboard,
  demoTeacherDashboard,
  demoVivaQuestions,
} from './demo-data'
import { endpoints, type EndpointKey } from './endpoints'
import type {
  CodingLanguage,
  CodingProblem,
  CodingSubmissionResult,
  DiagnosticResult,
  McqQuestion,
  Sourced,
  StudentDashboard,
  TeacherDashboard,
  VivaFeedback,
  VivaQuestion,
} from './types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const REQUEST_TIMEOUT_MS = 15_000

class EndpointNotConfiguredError extends Error {}

export function isApiConfigured(key: EndpointKey) {
  return Boolean(API_BASE_URL && endpoints[key])
}

async function request<T>(
  key: EndpointKey,
  options: { method?: 'GET' | 'POST'; body?: unknown; query?: Record<string, string> } = {},
): Promise<T> {
  const path = endpoints[key]
  if (!API_BASE_URL || !path) throw new EndpointNotConfiguredError(key)

  const url = new URL(`${API_BASE_URL}${path}`)
  Object.entries(options.query ?? {}).forEach(([k, v]) => url.searchParams.set(k, v))

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: options.method ?? 'GET',
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
      // Auth is expected to use HttpOnly cookies set by the backend — no tokens in browser code.
      credentials: 'include',
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(timeout)
  }
}

async function withDemoFallback<T>(fetcher: () => Promise<T>, demo: () => T | Promise<T>): Promise<Sourced<T>> {
  try {
    return { data: await fetcher(), source: 'api' }
  } catch (error) {
    const fallbackReason =
      error instanceof EndpointNotConfiguredError
        ? undefined
        : error instanceof Error && error.name === 'AbortError'
          ? 'The server took too long to respond.'
          : 'The server could not be reached.'
    return { data: await demo(), source: 'demo', fallbackReason }
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function getStudentDashboard() {
  return withDemoFallback(
    () => request<StudentDashboard>('studentDashboard'),
    () => demoStudentDashboard,
  )
}

export function getDiagnosticQuestions() {
  return withDemoFallback(
    () => request<McqQuestion[]>('diagnosticQuestions'),
    () => demoQuestionBank.slice(0, 8),
  )
}

function scoreLocally(questions: McqQuestion[], answers: Record<string, number>): DiagnosticResult {
  const byConcept = new Map<string, { correct: number; total: number }>()
  let score = 0
  for (const q of questions) {
    const entry = byConcept.get(q.conceptName) ?? { correct: 0, total: 0 }
    entry.total += 1
    if (answers[q.id] === q.correctIndex) {
      entry.correct += 1
      score += 1
    }
    byConcept.set(q.conceptName, entry)
  }
  return {
    score,
    total: questions.length,
    perConcept: [...byConcept].map(([conceptName, v]) => ({ conceptName, ...v })),
  }
}

export function submitDiagnostic(questions: McqQuestion[], answers: Record<string, number>) {
  return withDemoFallback(
    () => request<DiagnosticResult>('diagnosticSubmit', { method: 'POST', body: { answers } }),
    async () => {
      await delay(700)
      return scoreLocally(questions, answers)
    },
  )
}

export function getPracticeQuestions(conceptId: string) {
  return withDemoFallback(
    () => request<McqQuestion[]>('practiceQuestions', { query: { conceptId } }),
    () => demoQuestionBank.filter((q) => q.conceptId === conceptId),
  )
}

export function getCodingProblem() {
  return withDemoFallback(
    () => request<CodingProblem>('codingProblem'),
    () => demoCodingProblem,
  )
}

export function submitCode(problem: CodingProblem, language: CodingLanguage, code: string) {
  return withDemoFallback(
    () =>
      request<CodingSubmissionResult>('codingSubmit', {
        method: 'POST',
        body: { problemId: problem.id, language, code },
      }),
    async () => {
      await delay(1400)
      // Demo only: code is NOT executed. A simple heuristic decides the simulated outcome.
      const edited = code.trim() !== problem.starterCode[language].trim()
      const usesStack = /stack|push|append|pop|deque/i.test(code)
      const passing = edited && usesStack ? problem.sampleTests.length : edited ? 1 : 0
      const cases = problem.sampleTests.map((t, i) => ({
        input: t.input,
        expected: t.expectedOutput,
        actual: i < passing ? t.expectedOutput : t.expectedOutput === 'true' ? 'false' : 'true',
        passed: i < passing,
      }))
      return {
        status: passing === cases.length ? 'accepted' : passing > 0 ? 'partial' : 'failed',
        passed: passing,
        total: cases.length,
        runtimeMs: 38 + Math.round(Math.random() * 40),
        cases,
      } satisfies CodingSubmissionResult
    },
  )
}

export function getVivaQuestions() {
  return withDemoFallback(
    () => request<VivaQuestion[]>('vivaQuestions'),
    () => demoVivaQuestions,
  )
}

/** Keyword-coverage rubric used whenever the AI evaluator is unavailable. */
export function rubricEvaluate(question: VivaQuestion, answer: string): VivaFeedback {
  const text = answer.toLowerCase()
  const covered = question.keyPoints.filter((k) => text.includes(k.toLowerCase()))
  const missing = question.keyPoints.filter((k) => !covered.includes(k))
  const words = answer.trim().split(/\s+/).filter(Boolean).length
  const coverage = covered.length / question.keyPoints.length
  const lengthBonus = Math.min(words / 80, 1) * 20
  const score = Math.round(Math.min(100, coverage * 80 + lengthBonus))

  return {
    score,
    evaluator: 'rubric',
    summary:
      score >= 75
        ? 'Strong answer that covers most of the expected key ideas.'
        : score >= 45
          ? 'A reasonable start — a few important ideas are missing.'
          : 'The answer needs more depth on the core concepts.',
    strengths: covered.length
      ? covered.map((k) => `Mentioned “${k}”`)
      : words > 20
        ? ['Answer is detailed in length']
        : [],
    improvements: [
      ...missing.slice(0, 4).map((k) => `Consider explaining “${k}”`),
      ...(words < 40 ? ['Expand with an example to show understanding'] : []),
    ],
  }
}

export async function evaluateViva(question: VivaQuestion, answer: string): Promise<Sourced<VivaFeedback>> {
  const result = await withDemoFallback(
    () => request<VivaFeedback>('vivaEvaluate', { method: 'POST', body: { questionId: question.id, answer } }),
    async () => {
      await delay(900)
      return rubricEvaluate(question, answer)
    },
  )
  if (result.source === 'demo' && result.fallbackReason) {
    result.fallbackReason = `AI evaluator unavailable — ${result.fallbackReason.toLowerCase()}`
  }
  return result
}

export function getTeacherDashboard() {
  return withDemoFallback(
    () => request<TeacherDashboard>('teacherDashboard'),
    () => demoTeacherDashboard,
  )
}
