import { cn } from '@/lib/cn'
import type { Tone } from './badge'

const barTones: Record<Tone, string> = {
  neutral: 'bg-subtle',
  primary: 'bg-primary shadow-xs shadow-primary/50',
  success: 'bg-emerald-500 shadow-xs shadow-emerald-500/50',
  warning: 'bg-amber-500 shadow-xs shadow-amber-500/50',
  danger: 'bg-rose-500 shadow-xs shadow-rose-500/50',
}

export function ProgressBar({
  value,
  tone = 'primary',
  label,
  className,
}: {
  value: number
  tone?: Tone
  label: string
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-white/10', className)}
    >
      <div className={cn('h-full rounded-full transition-all duration-500', barTones[tone])} style={{ width: `${clamped}%` }} />
    </div>
  )
}

export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  label,
  sublabel,
}: {
  value: number
  size?: number
  stroke?: number
  label: string
  sublabel?: string
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${label}: ${value}%`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-white/10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-primary transition-all duration-700"
          style={{ filter: 'drop-shadow(0 0 6px rgba(225, 29, 72, 0.4))' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center" aria-hidden>
        <span className="text-2xl font-bold tracking-tight text-ink tabular-nums">{value}%</span>
        {sublabel ? <span className="text-xs text-muted font-medium">{sublabel}</span> : null}
      </div>
    </div>
  )
}
