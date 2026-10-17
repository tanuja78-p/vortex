/**
 * Login page — lets a user pick Student or Teacher role and enter email.
 * Calls POST /api/auth/login  and stores result in auth context.
 */
import React, { useState } from 'react'
import { useAuth, UserRole } from '../lib/auth-context'
import { GraduationCap, BookOpen, Loader2, ChevronRight, Sparkles } from 'lucide-react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const DEMO_ACCOUNTS = [
  { label: 'Student (onboarded)', email: 'alex.johnson@university.edu', role: 'student' as UserRole },
  { label: 'Student (first login)', email: 'rohan.das@university.edu', role: 'student' as UserRole },
  { label: 'Teacher – Prof. Anderson', email: 'anderson@university.edu', role: 'teacher' as UserRole },
  { label: 'Teacher – Dr. Mehta', email: 'mehta@university.edu', role: 'teacher' as UserRole },
]

export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), role }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.detail || 'Login failed')
      }
      const data = await res.json()
      login({
        userId:         data.user_id,
        name:           data.name,
        role:           data.role as UserRole,
        batchId:        data.batch_id,
        isFirstLogin:   data.is_first_login,
        onboardingDone: data.onboarding_done,
        diagnosticDone: data.diagnostic_done,
      })
    } catch (err: any) {
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = (acct: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acct.email)
    setRole(acct.role)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(ellipse at 20% 20%, rgba(225,29,72,0.12) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(99,102,241,0.12) 0%, transparent 55%)',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(225,29,72,0.25), rgba(99,102,241,0.25))',
            border: '1px solid rgba(255,255,255,0.12)', marginBottom: 16
          }}>
            <Sparkles size={28} color="#f43f5e" />
          </div>
          <h1 style={{
            fontSize: '1.9rem', fontWeight: 800,
            background: 'linear-gradient(135deg, #f43f5e 0%, #818cf8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Vortex Portal</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.88rem', marginTop: 4 }}>
            Adaptive Learning & Assessment System
          </p>
        </div>

        {/* Role selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {(['student', 'teacher'] as UserRole[]).map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              style={{
                padding: '16px', borderRadius: 12,
                border: role === r ? '1px solid rgba(225,29,72,0.5)' : '1px solid rgba(255,255,255,0.08)',
                background: role === r
                  ? 'linear-gradient(135deg, rgba(225,29,72,0.15), rgba(99,102,241,0.15))'
                  : 'rgba(18,24,38,0.75)',
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 8, transition: 'all 200ms ease',
              }}
            >
              {r === 'student'
                ? <GraduationCap size={24} color={role === r ? '#f43f5e' : '#64748b'} />
                : <BookOpen size={24} color={role === r ? '#f43f5e' : '#64748b'} />
              }
              <span style={{
                fontWeight: 700, fontSize: '0.9rem', textTransform: 'capitalize',
                color: role === r ? '#f8fafc' : '#64748b'
              }}>{r}</span>
            </button>
          ))}
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="glassmorphic-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: 6, fontWeight: 600 }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={role === 'student' ? 'student@university.edu' : 'professor@university.edu'}
                required
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f8fafc', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                color: '#fca5a5', fontSize: '0.84rem'
              }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: loading ? 'rgba(225,29,72,0.4)' : 'linear-gradient(135deg, #e11d48, #6366f1)',
                color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 200ms ease',
              }}
            >
              {loading ? <Loader2 size={18} className="spin-animation" /> : <ChevronRight size={18} />}
              {loading ? 'Signing in…' : `Sign in as ${role}`}
            </button>
          </div>

          {/* Demo accounts */}
          <div className="glassmorphic-inner-card" style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-subtle)', marginBottom: 10, fontWeight: 600 }}>
              DEMO ACCOUNTS
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {DEMO_ACCOUNTS.map(acct => (
                <button
                  key={acct.email}
                  type="button"
                  onClick={() => handleDemoLogin(acct)}
                  style={{
                    textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: 'none',
                    background: email === acct.email ? 'rgba(225,29,72,0.12)' : 'transparent',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', transition: 'background 150ms ease',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>{acct.label}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--color-muted)' }}>{acct.email}</div>
                  </div>
                  <ChevronRight size={14} color="#64748b" />
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
