import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, ClipboardCheck, Gauge, Search, Users } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge, type Tone } from '@/components/ui/badge'
import { ProgressBar } from '@/components/ui/progress'
import { StatCard } from '@/components/ui/stat-card'
import { PageHeader } from '@/components/ui/page-header'
import { DataSourceBadge, EmptyState, ErrorState, FallbackNotice, PageSkeleton } from '@/components/ui/states'
import { useTeacherDashboard } from '@/hooks/use-api'
import { cn, masteryTone } from '@/lib/cn'
import type { Submission } from '@/services/types'

const typeTone: Record<Submission['type'], Tone> = {
  diagnostic: 'primary',
  coding: 'neutral',
  viva: 'warning',
  practice: 'success',
}

type Filter = 'all' | 'needs-review'

export function TeacherDashboardPage() {
  const { data, error, isLoading, mutate } = useTeacherDashboard()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const students = useMemo(() => {
    const list = data?.data.students ?? []
    const q = query.trim().toLowerCase()
    return q ? list.filter((s) => s.name.toLowerCase().includes(q)) : list
  }, [data, query])

  if (isLoading) return <PageSkeleton />
  if (error || !data) return <ErrorState message={error?.message} onRetry={() => mutate()} />

  const d = data.data
  const atRisk = d.students.filter((s) => s.atRisk)
  const submissions = filter === 'all' ? d.submissions : d.submissions.filter((s) => s.status === 'needs-review')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Teacher"
        title={d.className}
        description="Monitor class performance, spot students who need help and review submissions."
        actions={<DataSourceBadge source={data.source} fallbackReason={data.fallbackReason} />}
      />
      <FallbackNotice reason={data.fallbackReason} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={d.studentCount} hint={`${atRisk.length} flagged at risk`} icon={<Users className="size-5" aria-hidden />} />
        <StatCard label="Class average" value={`${d.avgScore}%`} hint="All graded assessments" icon={<Gauge className="size-5" aria-hidden />} />
        <StatCard label="Completion rate" value={`${d.completionRate}%`} hint="Assigned work completed" icon={<ClipboardCheck className="size-5" aria-hidden />} />
        <StatCard label="Pending reviews" value={d.pendingReviews} hint="Viva & coding submissions" icon={<AlertTriangle className="size-5" aria-hidden />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Class mastery by concept" description="Average mastery across all students" />
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.conceptProgress} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} interval={0} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    contentStyle={{
                      backgroundColor: '#0d1322',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.12)',
                      boxShadow: '0 10px 30px -5px rgba(0,0,0,0.5)',
                      fontSize: 12,
                      color: '#f8fafc',
                    }}
                    formatter={(v) => [`${v}%`, 'Mastery']}
                  />
                  <Bar dataKey="mastery" fill="#e11d48" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Needs attention" description="Low scores or inactive for 4+ days" />
          <CardBody className="p-0">
            {atRisk.length === 0 ? (
              <EmptyState title="Everyone is on track" />
            ) : (
              <ul className="divide-y divide-border">
                {atRisk.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">Last active {s.lastActive}</p>
                    </div>
                    <Badge tone="danger">{s.avgScore}%</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Students"
            action={
              <label className="relative block">
                <span className="sr-only">Search students</span>
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search students"
                  className="h-8 w-36 rounded-lg border border-white/10 bg-[#0f172a] pl-8 pr-2 text-sm text-foreground placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-48"
                />
              </label>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-white/[0.02]">
                <tr className="border-b border-white/10">
                  <th scope="col" className="px-5 py-3 font-semibold">Name</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Avg</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Progress</th>
                  <th scope="col" className="hidden px-5 py-3 font-semibold sm:table-cell">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">
                      <span className="flex items-center gap-2">
                        {s.name}
                        {s.atRisk ? <span className="size-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]" aria-label="At risk" /> : null}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={masteryTone(s.avgScore)}>{s.avgScore}%</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex min-w-28 items-center gap-2">
                        <ProgressBar value={s.progress} label={`${s.name} progress`} />
                        <span className="w-9 text-right text-xs text-muted-foreground tabular-nums font-medium">{s.progress}%</span>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3 text-muted-foreground sm:table-cell">{s.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length === 0 ? <EmptyState title="No students match" description="Try a different name." /> : null}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recent submissions"
            action={
              <div className="flex rounded-lg border border-white/10 bg-white/[0.02] p-0.5" role="group" aria-label="Filter submissions">
                {(['all', 'needs-review'] as Filter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={filter === f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-semibold transition-all',
                      filter === f ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {f === 'all' ? 'All' : 'Needs review'}
                  </button>
                ))}
              </div>
            }
          />
          {submissions.length === 0 ? (
            <EmptyState title="Nothing to review" description="All submissions have been graded." />
          ) : (
            <ul className="divide-y divide-border">
              {submissions.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{s.studentName}</p>
                    <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground mt-0.5">
                      <span className="truncate">{s.assessment}</span>
                      <span aria-hidden>·</span>
                      <span>{s.submittedAt}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={typeTone[s.type]} className="hidden capitalize sm:inline-flex">
                      {s.type}
                    </Badge>
                    {s.status === 'needs-review' ? (
                      <Badge tone="warning">Review</Badge>
                    ) : (
                      <Badge tone={masteryTone(s.score ?? 0)}>{s.score}%</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
