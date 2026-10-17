import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DifficultyBadge, Badge } from '@/components/ui/badge'
import { ProgressBar, ProgressRing } from '@/components/ui/progress'
import { PageHeader } from '@/components/ui/page-header'
import { DataSourceBadge, EmptyState, ErrorState, FallbackNotice, PageSkeleton } from '@/components/ui/states'
import { OptionList } from '@/components/quiz/option-list'
import { useDiagnosticQuestions } from '@/hooks/use-api'
import { submitDiagnostic } from '@/services/api'
import { masteryTone } from '@/lib/cn'
import type { DiagnosticResult, McqQuestion, Sourced } from '@/services/types'

export function DiagnosticQuizPage() {
  const { data, error, isLoading, mutate } = useDiagnosticQuestions()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<Sourced<DiagnosticResult> | null>(null)

  if (isLoading) return <PageSkeleton />
  if (error || !data) return <ErrorState message={error?.message} onRetry={() => mutate()} />

  const questions = data.data
  if (questions.length === 0) {
    return (
      <Card>
        <EmptyState title="No diagnostic available" description="Your instructor has not published a diagnostic quiz yet." />
      </Card>
    )
  }

  const reset = () => {
    setIndex(0)
    setAnswers({})
    setResult(null)
    setSubmitError(null)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      setResult(await submitDiagnostic(questions, answers))
    } catch {
      setSubmitError('We could not submit your answers. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const header = (
    <PageHeader
      eyebrow="Assessment"
      title="Diagnostic quiz"
      description="Find out where you stand. Your results personalize the practice you see next."
      actions={<DataSourceBadge source={result?.source ?? data.source} fallbackReason={result?.fallbackReason ?? data.fallbackReason} />}
    />
  )

  if (result) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <FallbackNotice reason={result.fallbackReason} />
        <DiagnosticResults result={result.data} questions={questions} answers={answers} onRetake={reset} />
      </div>
    )
  }

  const q = questions[index]
  const answeredCount = Object.keys(answers).length
  const isLast = index === questions.length - 1

  return (
    <div className="flex flex-col gap-6">
      {header}
      <FallbackNotice reason={data.fallbackReason} />

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <Card>
          <div className="border-b border-white/10 px-6 py-4 bg-white/[0.01]">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-foreground">
                Question {index + 1} <span className="text-muted-foreground font-normal">of {questions.length}</span>
              </span>
              <span className="text-muted-foreground text-xs">{answeredCount} answered</span>
            </div>
            <ProgressBar className="mt-3" value={((index + 1) / questions.length) * 100} label="Quiz progress" />
          </div>
          <CardBody className="flex flex-col gap-5 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="primary">{q.conceptName}</Badge>
              <DifficultyBadge difficulty={q.difficulty} />
            </div>
            <h2 className="text-lg font-medium text-foreground text-pretty">{q.prompt}</h2>
            <OptionList
              name={q.id}
              options={q.options}
              selected={answers[q.id]}
              onSelect={(i) => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
            />
            {submitError ? (
              <p role="alert" className="text-sm text-danger">
                {submitError}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <Button variant="secondary" onClick={() => setIndex((i) => i - 1)} disabled={index === 0}>
                <ArrowLeft className="size-4" aria-hidden /> Previous
              </Button>
              {isLast ? (
                <Button onClick={handleSubmit} loading={submitting} disabled={answeredCount < questions.length}>
                  Submit quiz
                </Button>
              ) : (
                <Button onClick={() => setIndex((i) => i + 1)} disabled={answers[q.id] === undefined}>
                  Next <ArrowRight className="size-4" aria-hidden />
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        <Card className="h-fit">
          <CardHeader title="Question map" />
          <CardBody>
            <ol className="grid grid-cols-5 gap-2">
              {questions.map((item, i) => {
                const answered = answers[item.id] !== undefined
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`Go to question ${i + 1}${answered ? ', answered' : ''}`}
                      aria-current={i === index ? 'step' : undefined}
                      className={
                        i === index
                          ? 'flex size-9 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white shadow-[0_0_12px_rgba(225,29,72,0.4)]'
                          : answered
                            ? 'flex size-9 w-full items-center justify-center rounded-lg bg-primary/15 text-sm font-medium text-primary border border-primary/30'
                            : 'flex size-9 w-full items-center justify-center rounded-lg border border-white/10 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors'
                      }
                    >
                      {i + 1}
                    </button>
                  </li>
                )
              })}
            </ol>
            <p className="mt-4 text-xs text-muted-foreground">Answer every question to enable submission.</p>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function DiagnosticResults({
  result,
  questions,
  answers,
  onRetake,
}: {
  result: DiagnosticResult
  questions: McqQuestion[]
  answers: Record<string, number>
  onRetake: () => void
}) {
  const percent = Math.round((result.score / Math.max(result.total, 1)) * 100)
  const weakest = [...result.perConcept].sort((a, b) => a.correct / a.total - b.correct / b.total)[0]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center gap-4 p-6 text-center">
          <ProgressRing value={percent} size={140} label="Diagnostic score" sublabel={`${result.score}/${result.total}`} />
          <div>
            <p className="text-lg font-semibold text-foreground">
              {percent >= 75 ? 'Excellent work!' : percent >= 50 ? 'Solid foundation' : 'Room to grow'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Score: {result.score} out of {result.total} questions ({percent}%)
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={onRetake}>
              <RotateCcw className="size-4" aria-hidden /> Retake
            </Button>
            <Link
              to="/practice"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-white shadow-md shadow-primary/20 hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Start practice <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Concept breakdown"
            description={weakest ? `Focus area: ${weakest.conceptName}` : undefined}
          />
          <CardBody>
            <ul className="flex flex-col gap-4">
              {result.perConcept.map((c) => {
                const pct = Math.round((c.correct / c.total) * 100)
                return (
                  <li key={c.conceptName}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="font-medium text-foreground">{c.conceptName}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {c.correct}/{c.total} correct
                      </span>
                    </div>
                    <ProgressBar value={pct} tone={masteryTone(pct)} label={`${c.conceptName} score`} />
                  </li>
                )
              })}
            </ul>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Answer review" />
        <ul className="divide-y divide-border">
          {questions.map((q, i) => {
            const correct = answers[q.id] === q.correctIndex
            return (
              <li key={q.id} className="flex gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                {correct ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" aria-label="Correct" />
                ) : (
                  <XCircle className="mt-0.5 size-5 shrink-0 text-rose-400" aria-label="Incorrect" />
                )}
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-foreground">
                    {i + 1}. {q.prompt}
                  </p>
                  {!correct ? (
                    <p className="mt-1 text-muted-foreground">
                      Your answer: <span className="text-rose-400 font-medium">{q.options[answers[q.id]] ?? '—'}</span> · Correct:{' '}
                      <span className="text-emerald-400 font-medium">{q.options[q.correctIndex]}</span>
                    </p>
                  ) : null}
                  <p className="mt-1 text-muted-foreground leading-relaxed">{q.explanation}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}
