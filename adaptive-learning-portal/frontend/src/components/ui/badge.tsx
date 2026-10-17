import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { Difficulty } from '@/services/types'

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger'

const tones: Record<Tone, string> = {
  neutral: 'bg-surface/70 text-muted border-border',
  primary: 'bg-primary-soft text-primary border-primary/35',
  success: 'bg-success-soft text-success border-success/35',
  warning: 'bg-warning-soft text-warning border-warning/35',
  danger: 'bg-danger-soft text-danger border-danger/35',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap shadow-xs backdrop-blur-xs',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

const difficultyTone: Record<Difficulty, Tone> = { easy: 'success', medium: 'warning', hard: 'danger' }

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <Badge tone={difficultyTone[difficulty]}>
      <span className="capitalize">{difficulty}</span>
    </Badge>
  )
}
