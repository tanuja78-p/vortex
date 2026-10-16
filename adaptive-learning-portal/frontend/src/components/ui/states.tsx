import type { ReactNode } from 'react'
import { AlertTriangle, Database, Inbox } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { DataSource } from '@/services/types'
import { Button } from './button'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-white/10', className)} aria-hidden />
}

export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
      <span className="sr-only">Loading content…</span>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary shadow-inner">
        {icon ?? <Inbox className="size-5" aria-hidden />}
      </div>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        {description ? <p className="mt-1 max-w-sm text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-rose-500/30 bg-danger-soft px-6 py-10 text-center">
      <AlertTriangle className="size-6 text-rose-400" aria-hidden />
      <div>
        <p className="font-semibold text-ink">Something went wrong</p>
        <p className="mt-1 text-sm text-muted">{message ?? 'We could not load this content.'}</p>
      </div>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}

/** Visible label shown whenever a screen renders demo data instead of live API data. */
export function DataSourceBadge({ source, fallbackReason }: { source: DataSource; fallbackReason?: string }) {
  if (source === 'api') return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400"
      title="Connected to live FastAPI backend."
    >
      <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
      Live API
    </span>
  )
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400"
      title={fallbackReason ?? 'Backend endpoint not configured. Showing sample data.'}
    >
      <Database className="size-3.5" aria-hidden />
      Demo data
      {fallbackReason ? <span className="sr-only">: {fallbackReason}</span> : null}
    </span>
  )
}

export function FallbackNotice({ reason }: { reason?: string }) {
  if (!reason) return null
  return (
    <div role="status" className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{reason} Showing demo data instead.</span>
    </div>
  )
}
