import { Check, X } from 'lucide-react'
import { cn } from '@/lib/cn'

const letters = ['A', 'B', 'C', 'D', 'E', 'F']

export function OptionList({
  name,
  options,
  selected,
  onSelect,
  correctIndex,
  revealed,
}: {
  name: string
  options: string[]
  selected: number | undefined
  onSelect: (index: number) => void
  correctIndex?: number
  revealed?: boolean
}) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="sr-only">Answer options</legend>
      {options.map((option, i) => {
        const isSelected = selected === i
        const isCorrect = revealed && i === correctIndex
        const isWrong = revealed && isSelected && i !== correctIndex
        return (
          <label
            key={i}
            className={cn(
              'group relative flex cursor-pointer items-center gap-3.5 rounded-xl border p-4 text-sm font-medium transition-all duration-200 select-none',
              'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background',
              revealed && 'cursor-default',
              isCorrect
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                : isWrong
                  ? 'border-rose-500/50 bg-rose-500/10 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                  : isSelected
                    ? 'border-primary bg-primary/10 text-foreground shadow-[0_0_20px_rgba(225,29,72,0.15)] ring-1 ring-primary/40'
                    : 'border-white/10 bg-surface/50 text-foreground/90 hover:border-white/20 hover:bg-white/[0.04]',
            )}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={isSelected}
              disabled={revealed}
              onChange={() => onSelect(i)}
            />
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold transition-all duration-200',
                isCorrect
                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                  : isWrong
                    ? 'border-rose-500 bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                    : isSelected
                      ? 'border-primary bg-primary text-white shadow-[0_0_12px_rgba(225,29,72,0.5)]'
                      : 'border-white/10 bg-white/5 text-muted-foreground group-hover:border-white/20 group-hover:text-foreground',
              )}
              aria-hidden
            >
              {isCorrect ? <Check className="size-4 stroke-[2.5]" /> : isWrong ? <X className="size-4 stroke-[2.5]" /> : letters[i]}
            </span>
            <span className="flex-1 leading-snug">{option}</span>
          </label>
        )
      })}
    </fieldset>
  )
}

