import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowRight, Clock, Flame, Target, TrendingDown, Trophy } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProgressBar, ProgressRing } from '@/components/ui/progress'
import { StatCard } from '@/components/ui/stat-card'
import { PageHeader } from '@/components/ui/page-header'
import { DataSourceBadge, EmptyState, ErrorState, FallbackNotice, PageSkeleton } from '@/components/ui/states'
import { useStudentDashboard } from '@/hooks/use-api'
import { masteryTone } from '@/lib/cn'
import type { Recommendation } from '@/services/types'

const recommendationRoute: Record<Recommendation['kind'], string> = {
  practice: '/practice',
  diagnostic: '/diagnostic',
  coding: '/coding',
  viva: '/viva',
}

export function StudentDashboardPage() {
  const { data, error, isLoading, mutate } = useStudentDashboard()

  if (isLoading) return <PageSkeleton />
  if (error || !data) return <ErrorState message={error?.message} onRetry={() => mutate()} />

  const d = data.data
  const mastered = d.concepts.filter((c) => c.mastery >= 75).length
  const weeklyMinutes = d.weeklyActivity.reduce((sum, w) => sum + w.minutes, 0)
  const rec = d.recommendation
  const recHref = rec.conceptId ? `${recommendationRoute[rec.kind]}?concept=${rec.conceptId}` : recommendationRoute[rec.kind]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={d.course}
        title={`Welcome back, ${d.studentName.split(' ')[0]}`}
        description="Here is where your learning stands this week."
        actions={<DataSourceBadge source={data.source} fallbackReason={data.fallbackReason} />}
      />
      <FallbackNotice reason={data.fallbackReason} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Course progress" value={`${d.overallProgress}%`} hint="Across all modules" icon={<Target className="size-5" aria-hidden />} />
        <StatCard label="Learning streak" value={`${d.streakDays} days`} hint="Keep it going today" icon={<Flame className="size-5" aria-hidden />} />
        <StatCard label="Concepts mastered" value={`${mastered}/${d.concepts.length}`} hint="Mastery of 75% or more" icon={<Trophy className="size-5" aria-hidden />} />
        <StatCard label="Study time" value={`${Math.floor(weeklyMinutes / 60)}h ${weeklyMinutes % 60}m`} hint="Last 7 days" icon={<Clock className="size-5" aria-hidden />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="relative overflow-hidden lg:col-span-2 group">
          <div className="relative overflow-hidden bg-gradient-to-r from-primary/95 via-rose-700/90 to-purple-950/80 p-6 text-white border-b border-white/10 shadow-[0_4px_30px_rgba(225,29,72,0.2)]">
            <div className="absolute -right-10 -top-10 size-48 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-rose-100 backdrop-blur-md border border-white/20">
                  Recommended next
                </span>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-white text-balance">{rec.title}</h2>
                <p className="mt-1 max-w-lg text-sm text-rose-100/90 text-pretty">{rec.description}</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-rose-200/80 font-medium">
                  <Clock className="size-3.5" aria-hidden /> About {rec.estimatedMinutes} minutes
                </p>
              </div>
              <Link
                to={recHref}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-rose-950 shadow-lg shadow-black/20 hover:bg-rose-50 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Start now <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
          <CardBody>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Weekly activity</h3>
              <span className="text-xs text-muted-foreground">Minutes per day</span>
            </div>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.weeklyActivity} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
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
                    formatter={(v) => [`${v} min`, 'Study time']}
                  />
                  <Bar dataKey="minutes" fill="#e11d48" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card className="flex flex-col">
          <CardHeader title="Overall mastery" description="Weighted across concepts" />
          <CardBody className="flex flex-1 flex-col items-center justify-center gap-4">
            <ProgressRing
              value={Math.round(d.concepts.reduce((s, c) => s + c.mastery, 0) / Math.max(d.concepts.length, 1))}
              size={148}
              label="Overall mastery"
              sublabel="mastery"
            />
            <p className="text-center text-sm text-muted-foreground text-pretty">
              Focus on your weak topics to push past 70%.
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Concept mastery" description="Based on all quiz, practice and coding attempts" />
          <CardBody>
            {d.concepts.length === 0 ? (
              <EmptyState title="No concepts yet" description="Complete the diagnostic quiz to map your mastery." />
            ) : (
              <ul className="flex flex-col gap-4">
                {d.concepts.map((c) => (
                  <li key={c.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-foreground">{c.name}</span>
                      <span className="flex items-center gap-3 text-muted-foreground">
                        <span className="hidden text-xs sm:inline">{c.attempts} attempts</span>
                        <span className="w-10 text-right font-medium text-foreground tabular-nums">{c.mastery}%</span>
                      </span>
                    </div>
                    <ProgressBar value={c.mastery} tone={masteryTone(c.mastery)} label={`${c.name} mastery`} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Weak topics" description="Lowest mastery first" />
            <CardBody className="p-0">
              {d.weakTopics.length === 0 ? (
                <EmptyState title="No weak topics" description="Great work — every concept is above 60%." />
              ) : (
                <ul className="divide-y divide-border">
                  {d.weakTopics.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                          <TrendingDown className="size-4" aria-hidden />
                        </div>
                        <span className="truncate text-sm font-medium text-foreground">{t.name}</span>
                      </div>
                      <Link
                        to={`/practice?concept=${t.id}`}
                        className="shrink-0 text-sm font-semibold text-primary hover:text-rose-400 transition-colors"
                        aria-label={`Practice ${t.name}`}
                      >
                        Practice
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Recent activity" />
            <CardBody className="p-0">
              <ul className="divide-y divide-border">
                {d.recentActivity.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{a.label}</p>
                      <p className="text-xs text-muted-foreground">{a.when}</p>
                    </div>
                    <Badge tone={masteryTone(a.score)}>{a.score}%</Badge>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
