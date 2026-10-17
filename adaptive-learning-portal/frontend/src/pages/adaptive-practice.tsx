import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Lightbulb, RotateCcw, TrendingDown, TrendingUp, XCircle } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, DifficultyBadge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { DataSourceBadge, EmptyState, ErrorState, FallbackNotice, Skeleton } from '@/components/ui/states'
import { OptionList } from '@/components/quiz/option-list'
import { usePracticeQuestions, useStudentDashboard } from '@/hooks/use-api'
import { cn } from '@/lib/cn'
import type { Difficulty, McqQuestion } from '@/services/types'

const levels: Difficulty[] = ['easy', 'medium', 'hard']

function pickNext(pool: McqQuestion[], answeredIds: Set<string>, target: Difficulty) {
  const remaining = pool.filter((q) => !answeredIds.has(q.id))
  if (remaining.length === 0) return undefined
  const targetIdx = levels.indexOf(target)
  return [...remaining].sort(
    (a, b) => Math.abs(levels.indexOf(a.difficulty) - targetIdx) - Math.abs(levels.indexOf(b.difficulty) - targetIdx),
  )[0]
}

export function AdaptivePracticePage() {
  const [params, setParams] = useSearchParams()
  const dashboard = useStudentDashboard()
  const concepts = dashboard.data?.data.concepts ?? []
  const conceptId = params.get('concept') ?? dashboard.data?.data.weakTopics[0]?.id ?? concepts[0]?.id ?? ''

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Learn"
        title="Adaptive practice"
        description="Difficulty adjusts after every answer — get it right to level up, miss one and we step back."
        actions={dashboard.data ? <DataSourceBadge source={dashboard.data.source} /> : null}
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Choose a concept">
        {dashboard.isLoading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-28 rounded-full" />)
          : concepts.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={c.id === conceptId}
                onClick={() => setParams({ concept: c.id })}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 select-none',
                  c.id === conceptId
                    ? 'border-primary bg-primary text-white shadow-[0_0_15px_rgba(225,29,72,0.35)]'
                    : 'border-white/10 bg-surface/50 text-muted-foreground hover:border-white/20 hover:text-foreground hover:bg-white/5',
                )}
              >
                {c.name}
              </button>
            ))}
      </div>

      {conceptId ? <PracticeSession key={conceptId} conceptId={conceptId} /> : null}
    </div>
  )
}

interface Attempt {
  questionId: string
  difficulty: Difficulty
  correct: boolean
}

function PracticeSession({ conceptId }: { conceptId: string }) {
  const { data, error, isLoading, mutate } = usePracticeQuestions(conceptId)
  const [level, setLevel] = useState<Difficulty>('easy')
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [selected, setSelected] = useState<number | undefined>()
  const [revealed, setRevealed] = useState(false)

  const pool = useMemo(() => data?.data ?? [], [data])
  const answeredIds = useMemo(() => new Set(attempts.map((a) => a.questionId)), [attempts])
  const current = pool.find((q) => q.id === currentId) ?? (revealed ? undefined : pickNext(pool, answeredIds, level))

  if (isLoading) return <Skeleton className="h-96" />
  if (error || !data) return <ErrorState message={error?.message} onRetry={() => mutate()} />
  if (pool.length === 0) {
    return (
      <Card>
        <EmptyState title="No practice questions yet" description="There are no questions for this concept. Try another one." />
      </Card>
    )
  }

  const correctCount = attempts.filter((a) => a.correct).length
  const last = attempts.at(-1)

  const check = () => {
    if (!current || selected === undefined) return
    const correct = selected === current.correctIndex
    setCurrentId(current.id)
    setAttempts((prev) => [...prev, { questionId: current.id, difficulty: current.difficulty, correct }])
    const idx = levels.indexOf(level)
    setLevel(levels[Math.max(0, Math.min(levels.length - 1, idx + (correct ? 1 : -1)))])
    setRevealed(true)
  }

  const next = () => {
    setCurrentId(null)
    setSelected(undefined)
    setRevealed(false)
  }

  const restart = () => {
    setAttempts([])
    setLevel('easy')
    next()
  }

  const finished = !current

  return (
    <div className="flex flex-col gap-4">
      <FallbackNotice reason={data.fallbackReason} />
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card>
          {finished ? (
            <EmptyState
              icon={<CheckCircle2 className="size-5" aria-hidden />}
              title="Session complete"
              description={`You answered ${correctCount} of ${attempts.length} correctly. Pick another concept or practice again.`}
              action={
                <Button variant="secondary" size="sm" onClick={restart}>
                  <RotateCcw className="size-4" aria-hidden /> Practice again
                </Button>
              }
            />
          ) : (
            <CardBody className="flex flex-col gap-5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="primary">{current.conceptName}</Badge>
                  <DifficultyBadge difficulty={current.difficulty} />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Question {attempts.length + (revealed ? 0 : 1)}</span>
              </div>
              <h2 className="text-lg font-medium text-foreground text-pretty">{current.prompt}</h2>
              <OptionList
                name={current.id}
                options={current.options}
                selected={selected}
                onSelect={setSelected}
                correctIndex={current.correctIndex}
                revealed={revealed}
              />

              {revealed && last ? (
                <div
                  role="status"
                  className={cn(
                    'flex gap-3 rounded-xl border p-4 text-sm backdrop-blur-sm transition-all',
                    last.correct
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.1)]',
                  )}
                >
                  {last.correct ? (
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-400" aria-hidden />
                  ) : (
                    <XCircle className="size-5 shrink-0 text-rose-400" aria-hidden />
                  )}
                  <div>
                    <p className="font-semibold text-foreground">{last.correct ? 'Correct!' : 'Not quite.'}</p>
                    <p className="mt-1 flex gap-1.5 text-muted-foreground leading-relaxed">
                      <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden />
                      {current.explanation}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end border-t border-white/10 pt-4">
                {revealed ? (
                  <Button onClick={next}>
                    Next question <ArrowRight className="size-4" aria-hidden />
                  </Button>
                ) : (
                  <Button onClick={check} disabled={selected === undefined}>
                    Check answer
                  </Button>
                )}
              </div>
            </CardBody>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Current level" description="Adapts to your answers" />
            <CardBody>
              <div className="flex gap-1.5" aria-label={`Current difficulty: ${level}`}>
                {levels.map((l, i) => (
                  <div
                    key={l}
                    className={cn(
                      'h-2 flex-1 rounded-full transition-all duration-300',
                      i <= levels.indexOf(level) ? 'bg-primary shadow-[0_0_8px_rgba(225,29,72,0.5)]' : 'bg-white/10',
                    )}
                  />
                ))}
              </div>
              <p className="mt-3 text-sm font-semibold capitalize text-foreground">{level}</p>
              {last ? (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  {last.correct ? (
                    <TrendingUp className="size-3.5 text-emerald-400" aria-hidden />
                  ) : (
                    <TrendingDown className="size-3.5 text-rose-400" aria-hidden />
                  )}
                  {last.correct ? 'Stepped up after a correct answer' : 'Stepped back to reinforce basics'}
                </p>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="This session" />
            <CardBody className="flex flex-col gap-4">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wider">Answered</dt>
                  <dd className="mt-1 text-2xl font-bold text-foreground tabular-nums">{attempts.length}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wider">Accuracy</dt>
                  <dd className="mt-1 text-2xl font-bold text-foreground tabular-nums">
                    {attempts.length ? Math.round((correctCount / attempts.length) * 100) : 0}%
                  </dd>
                </div>
              </dl>
              {attempts.length ? (
                <ol className="flex flex-wrap gap-1.5 pt-2 border-t border-white/10" aria-label="Answer history">
                  {attempts.map((a, i) => (
                    <li
                      key={a.questionId}
                      className={cn(
                        'flex size-7 items-center justify-center rounded-lg text-xs font-semibold border',
                        a.correct
                          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                          : 'border-rose-500/40 bg-rose-500/15 text-rose-300',
                      )}
                      aria-label={`Question ${i + 1}: ${a.correct ? 'correct' : 'incorrect'}, ${a.difficulty}`}
                    >
                      {i + 1}
                    </li>
                  ))}
                </ol>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
