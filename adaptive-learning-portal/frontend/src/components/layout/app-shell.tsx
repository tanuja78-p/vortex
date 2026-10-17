import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  BookOpenCheck,
  Code2,
  GitFork,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  ShieldAlert,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { MouseGlow } from '@/components/ui/mouse-glow'

const studentNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/adaptive-paths', label: 'Adaptive paths (Demo)', icon: GitFork },
  { to: '/sandbox-security', label: 'Sandbox security (Demo)', icon: ShieldAlert },
  { to: '/diagnostic', label: 'Diagnostic quiz', icon: BookOpenCheck },
  { to: '/practice', label: 'Adaptive practice', icon: Sparkles },
  { to: '/coding', label: 'Coding assessment', icon: Code2 },
  { to: '/viva', label: 'Viva assessment', icon: MessageSquareText },
]

const teacherNav = [{ to: '/teacher', label: 'Class overview', icon: Users }]

function NavSection({ title, items, onNavigate }: { title: string; items: typeof studentNav; onNavigate?: () => void }) {
  return (
    <div>
      <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted/70">{title}</p>
      <ul className="flex flex-col gap-1">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary-soft text-primary border border-primary/25 shadow-xs font-semibold'
                    : 'text-muted hover:bg-surface-hover hover:text-ink',
                )
              }
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-rose-600 text-primary-foreground shadow-md shadow-primary/30">
        <GraduationCap className="size-5" aria-hidden />
      </div>
      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold tracking-tight text-ink">Vortex</p>
          <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-bold text-primary">OP-02</span>
        </div>
        <p className="text-xs text-muted">Adaptive Learning Portal</p>
      </div>
    </div>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const isTeacher = useLocation().pathname.startsWith('/teacher')
  return (
    <div className="flex h-full flex-col gap-8 p-4">
      <Brand />
      <nav aria-label="Main" className="flex flex-col gap-6">
        <NavSection title="Student Portal" items={studentNav} onNavigate={onNavigate} />
        <NavSection title="Instructor Portal" items={teacherNav} onNavigate={onNavigate} />
      </nav>
      <div className="mt-auto flex items-center gap-3 rounded-xl border border-border bg-surface/50 p-3 backdrop-blur-sm">
        <div
          className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary border border-primary/20 shadow-inner"
          aria-hidden
        >
          {isTeacher ? 'DR' : 'AM'}
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-ink">{isTeacher ? 'Dr. Ritu Sharma' : 'Aarav Mehta'}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <p className="truncate text-xs text-muted">{isTeacher ? 'Educator · CS201' : 'Student · CS201'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-dvh lg:flex relative">
      {/* Ambient background mouse glow from template */}
      <MouseGlow />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-border bg-surface/85 backdrop-blur-md lg:block z-20">
        <SidebarContent />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur-md lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-muted hover:bg-surface-hover hover:text-ink cursor-pointer"
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
        >
          <Menu className="size-5" aria-hidden />
        </button>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-72 max-w-[85%] bg-surface/95 border-r border-border backdrop-blur-xl shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-2 text-muted hover:bg-surface-hover hover:text-ink cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="size-5" aria-hidden />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <main id="main" className="min-w-0 flex-1 relative z-10">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
