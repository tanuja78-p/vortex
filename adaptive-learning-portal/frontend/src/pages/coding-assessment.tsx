import { useState } from 'react'
import { CheckCircle2, Info, Play, RotateCcw, XCircle } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, DifficultyBadge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { DataSourceBadge, ErrorState, FallbackNotice, PageSkeleton } from '@/components/ui/states'
import { CodeEditor } from '@/components/coding/code-editor'
import { useCodingProblem } from '@/hooks/use-api'
import { submitCode } from '@/services/api'
import type { CodingLanguage, CodingProblem, CodingSubmissionResult, Sourced } from '@/services/types'

const languages: { id: CodingLanguage; label: string }[] = [
  { id: 'python', label: 'Python 3' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
]

export function CodingAssessmentPage() {
  const { data, error, isLoading, mutate } = useCodingProblem()

  if (isLoading) return <PageSkeleton />
  if (error || !data) return <ErrorState message={error?.message} onRetry={() => mutate()} />

  return <CodingWorkspace key={data.data.id} problem={data.data} source={data} />
}

function CodingWorkspace({ problem, source }: { problem: CodingProblem; source: Sourced<CodingProblem> }) {
  const [language, setLanguage] = useState<CodingLanguage>('python')
  const [drafts, setDrafts] = useState<Record<CodingLanguage, string>>(problem.starterCode)
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [result, setResult] = useState<Sourced<CodingSubmissionResult> | null>(null)

  const code = drafts[language]

  const run = async () => {
    setRunning(true)
    setRunError(null)
    try {
      setResult(await submitCode(problem, language, code))
    } catch {
      setRunError('Submission failed. Please try again.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Assessment"
        title="Coding assessment"
        description="Solve the problem and submit to run it against the test cases."
        actions={<DataSourceBadge source={result?.source ?? source.source} fallbackReason={result?.fallbackReason ?? source.fallbackReason} />}
      />
      <FallbackNotice reason={result?.fallbackReason ?? source.fallbackReason} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card className="h-fit">
          <CardHeader title={problem.title} action={<DifficultyBadge difficulty={problem.difficulty} />} />
          <CardBody className="flex flex-col gap-5 text-sm p-6">
            <p className="leading-relaxed text-foreground text-pretty">{problem.statement}</p>
            <div>
              <h3 className="font-semibold text-foreground">Constraints</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                {problem.constraints.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Examples</h3>
              <div className="mt-2 flex flex-col gap-2">
                {problem.sampleTests.map((t, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-[#070a12] p-3.5 font-mono text-xs">
                    <p>
                      <span className="text-muted-foreground">Input: </span>
                      <span className="text-rose-300">{t.input}</span>
                    </p>
                    <p className="mt-1">
                      <span className="text-muted-foreground">Output: </span>
                      <span className="text-emerald-300">{t.expectedOutput}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-3">
              <label className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Language</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as CodingLanguage)}
                  className="h-8 rounded-lg border border-white/10 bg-[#0f172a] px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {languages.map((l) => (
                    <option key={l.id} value={l.id} className="bg-[#0f172a] text-foreground">
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDrafts((d) => ({ ...d, [language]: problem.starterCode[language] }))}
                >
                  <RotateCcw className="size-4" aria-hidden /> Reset
                </Button>
                <Button size="sm" onClick={run} loading={running}>
                  {running ? 'Running…' : (
                    <>
                      <Play className="size-4 fill-current" aria-hidden /> Submit code
                    </>
                  )}
                </Button>
              </div>
            </div>
            <CodeEditor
              label={`Code editor, ${languages.find((l) => l.id === language)?.label}`}
              value={code}
              onChange={(v) => setDrafts((d) => ({ ...d, [language]: v }))}
            />
          </Card>

          {runError ? (
            <p role="alert" className="text-sm text-danger">
              {runError}
            </p>
          ) : null}

          <Card aria-live="polite">
            <CardHeader
              title="Test results"
              action={
                result ? (
                  <Badge tone={result.data.status === 'accepted' ? 'success' : result.data.status === 'partial' ? 'warning' : 'danger'}>
                    {result.data.passed}/{result.data.total} passed
                  </Badge>
                ) : null
              }
            />
            <CardBody>
              {!result ? (
                <p className="text-sm text-muted-foreground">Submit your code to see test case results here.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {result.source === 'demo' ? (
                    <p className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 text-xs text-amber-300">
                      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      Demo evaluation — your code was not executed. Connect the backend judge to run real tests.
                    </p>
                  ) : null}
                  <p className="text-sm text-muted-foreground">
                    Status: <span className="font-semibold capitalize text-foreground">{result.data.status}</span> · Runtime{' '}
                    <span className="font-semibold text-foreground tabular-nums">{result.data.runtimeMs} ms</span>
                  </p>
                  <ul className="flex flex-col gap-2">
                    {result.data.cases.map((c, i) => (
                      <li key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3.5 text-xs">
                        {c.passed ? (
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" aria-label="Passed" />
                        ) : (
                          <XCircle className="size-4 shrink-0 text-rose-400 mt-0.5" aria-label="Failed" />
                        )}
                        <div className="grid min-w-0 flex-1 gap-1 font-mono sm:grid-cols-3">
                          <span className="truncate">
                            <span className="text-muted-foreground">in </span>
                            <span className="text-foreground">{c.input}</span>
                          </span>
                          <span>
                            <span className="text-muted-foreground">expected </span>
                            <span className="text-emerald-400">{c.expected}</span>
                          </span>
                          <span className={c.passed ? 'text-foreground' : 'text-rose-400 font-semibold'}>
                            <span className="text-muted-foreground">got </span>
                            {c.actual}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
