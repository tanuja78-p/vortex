import type { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-md shadow-primary/25 active:scale-[0.98] transition-all duration-150',
  secondary: 'bg-surface/80 text-ink border border-border hover:bg-surface-hover hover:border-border-strong active:scale-[0.98] transition-all duration-150 backdrop-blur-sm',
  ghost: 'text-muted hover:bg-surface/60 hover:text-ink transition-colors duration-150',
  danger: 'bg-danger text-white hover:opacity-90 active:scale-[0.98] shadow-sm transition-all duration-150',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 font-medium',
  md: 'h-10 px-4 text-sm gap-2 font-medium',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 select-none cursor-pointer',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  )
}
