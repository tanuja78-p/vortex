import { useState, type FormEvent } from 'react'
import { ArrowRight, Bot, CheckCircle2, ListChecks, MessageSquareText, Sparkles } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProgressRing } from '@/components/ui/progress'
import { PageHeader } from '@/components/ui/page-header'
import { DataSourceBadge, EmptyState, ErrorState, FallbackNotice, PageSkeleton } from '@/components/ui/states'
import { useVivaQuestions } from '@/hooks/use-api'
import { evaluateViva } from '@/services/api'
import { cn } from '@/lib/cn'
import type { Sourced, VivaFeedback } from '@/services/types'

const MIN_WORDS = 15

export function VivaAssessmentPage() {
  const { data, error, isLoading, mutate } = useVivaQuestions()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<Record<string, Sourced<VivaFeedback>>>({})
  const [evaluating, setEvaluating] = useState(false)
  const [evalError, setEvalError] = useState<string | null>(null)

  if (isLoading) return <PageSkeleton />
  if (error || !data) return <ErrorState message={error?.message} onRetry={() => mutate()} />

  const questions = data.data
  if (questions.length === 0) {
    return (
      <Card>
        <EmptyState icon={<MessageSquareText className="size-5" aria-hidden />} title="No viva questions" description="Check back once your instructor publishes a viva." />
      </Card>
    )
  }

  const q = questions[index]
  const answer = answers[q.id] ?? ''
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length
  const current = feedback[q.id]

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (wordCount < MIN_WORDS) return
    setEvaluating(true)
    setEvalError(null)
    try {
      const res = await evaluateViva(q, answer)
      setFeedback((prev) => ({ ...prev, [q.id]: res }))
    } catch {
      setEvalError('Evaluation failed. Please try again.')
    } finally {
      setEvaluating(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Assessment"
        title="Viva assessment"
        description="Explain concepts in your own words. Answers are evaluated for depth and key ideas."
        actions={<DataSourceBadge source={current?.source ?? data.source} fallbackReason={current?.fallbackReason ?? data.fallbackReason} />}
      />
      <FallbackNotice reason={data.fallbackReason} />

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <Card className="h-fit">
          <CardHeader title="Questions" />
          <ol className="flex flex-col p-2 gap-1">
            {questions.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-current={i === index ? 'step' : undefined}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200',
                    i === index
                      ? 'bg-primary/15 text-primary font-semibold border border-primary/30 shadow-[0_0_12px_rgba(225,29,72,0.2)]'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                  )}
                >
                  {feedback[item.id] ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-400" aria-label="Evaluated" />
                  ) : (
                    <span className="flex size-4 shrink-0 items-center justify-center text-xs font-semibold" aria-hidden>
                      {i + 1}
                    </span>
                  )}
                  <span className="truncate">{item.conceptName}</span>
                </button>
              </li>
            ))}
          </ol>
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardBody className="p-6">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20 shadow-[0_0_12px_rgba(225,29,72,0.2)]">
                    <Bot className="size-4.5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <Badge tone="primary">{q.conceptName}</Badge>
                    <h2 className="mt-2 text-lg font-medium text-foreground text-pretty">{q.prompt}</h2>
                  </div>
                </div>
                <label htmlFor="viva-answer" className="sr-only">
                  Your answer
                </label>
                <textarea
                  id="viva-answer"
                  value={answer}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  rows={8}
                  placeholder="Type your explanation here. Use examples where you can…"
                  className="w-full resize-y rounded-xl border border-white/10 bg-[#070a12] px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 selection:bg-primary/30"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className={cn('text-xs', wordCount < MIN_WORDS ? 'text-muted-foreground' : 'text-emerald-400 font-medium')}>
                    {wordCount} words {wordCount < MIN_WORDS ? `· at least ${MIN_WORDS} required` : ''}
                  </span>
                  <div className="flex gap-2">
                    {index < questions.length - 1 ? (
                      <Button variant="secondary" onClick={() => setIndex((i) => i + 1)}>
                        Skip <ArrowRight className="size-4" aria-hidden />
                      </Button>
                    ) : null}
                    <Button type="submit" loading={evaluating} disabled={wordCount < MIN_WORDS}>
                      {evaluating ? 'Evaluating…' : (
                        <>
                          <Sparkles className="size-4" aria-hidden /> {current ? 'Re-evaluate' : 'Evaluate answer'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                {evalError ? (
                  <p role="alert" className="text-sm text-danger">
                    {evalError}
                  </p>
                ) : null}
              </form>
            </CardBody>
          </Card>

          {current ? <FeedbackCard result={current} onNext={index < questions.length - 1 ? () => setIndex((i) => i + 1) : undefined} /> : null}
        </div>
      </div>
    </div>
  )
}

function FeedbackCard({ result, onNext }: { result: Sourced<VivaFeedback>; onNext?: () => void }) {
  const f = result.data
  return (
    <Card aria-live="polite">
      <CardHeader
        title="Feedback"
        action={
          <Badge tone={f.evaluator === 'ai' ? 'primary' : 'warning'}>
            {f.evaluator === 'ai' ? 'AI evaluated' : 'Rubric fallback'}
          </Badge>
        }
      />
      <CardBody className="flex flex-col gap-5 p-6">
        {result.fallbackReason ? <FallbackNotice reason={result.fallbackReason} /> : null}
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <ProgressRing value={f.score} size={104} stroke={9} label="Viva score" sublabel="score" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground text-pretty">{f.summary}</p>
            {f.evaluator === 'rubric' ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Scored by key-concept coverage and depth. Connect the AI evaluator for nuanced feedback.
              </p>
            ) : null}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
              <CheckCircle2 className="size-4" aria-hidden /> Strengths
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-foreground/90">
              {f.strengths.length ? f.strengths.map((s) => <li key={s}>{s}</li>) : <li className="text-muted-foreground">None identified yet</li>}
            </ul>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-400">
              <ListChecks className="size-4" aria-hidden /> To improve
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-foreground/90">
              {f.improvements.length ? f.improvements.map((s) => <li key={s}>{s}</li>) : <li className="text-muted-foreground">Nothing major — well done</li>}
            </ul>
          </div>
        </div>
        {onNext ? (
          <div className="flex justify-end pt-2 border-t border-white/10">
            <Button variant="secondary" onClick={onNext}>
              Next question <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        ) : null}
      </CardBody>
    </Card>
  )
}
