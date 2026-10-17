import type { ReactNode } from 'react'
import { SpotlightCard } from './spotlight-card'

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon: ReactNode
}) {
  return (
    <SpotlightCard className="flex items-start gap-4 p-5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary shadow-inner">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-ink tabular-nums">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted/90">{hint}</p> : null}
      </div>
    </SpotlightCard>
  )
}
