/**
 * First-login onboarding flow for students.
 * Step 1: Basic info confirmation
 * Step 2: Concepts they already know (multi-select)
 * Step 3: Concepts they want to learn (multi-select)
 * On submit → POST /api/onboarding/submit then go to diagnostic.
 */
import React, { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth-context'
import { CheckCircle2, Circle, ChevronRight, ChevronLeft, BookOpen, Target, User, Loader2 } from 'lucide-react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Concept { id: string; name: string; category: string; difficulty: string }

const STEPS = ['Welcome', 'What you know', 'What to learn']

export function OnboardingPage({ onComplete }: { onComplete: () => void }) {
  const { user, updateUser } = useAuth()
  const [step, setStep] = useState(0)
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [known, setKnown] = useState<Set<string>>(new Set())
  const [toLearn, setToLearn] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch(`${BASE_URL}/api/onboarding/concepts`)
      .then(r => r.json())
      .then(setConcepts)
      .catch(console.error)
      .finally(() => setFetching(false))
  }, [])

  const toggleKnown = (id: string) => {
    setKnown(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleLearn = (id: string) => {
    setToLearn(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)
    try {
      await fetch(`${BASE_URL}/api/onboarding/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.userId,
          concepts_known: Array.from(known),
          concepts_to_learn: Array.from(toLearn),
        }),
      })
      updateUser({ onboardingDone: true, isFirstLogin: false })
      onComplete()
    } catch (err) {
      console.error('Onboarding failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const categories = [...new Set(concepts.map(c => c.category))]

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 640 }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'default',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i <= step ? 'linear-gradient(135deg, #e11d48, #6366f1)' : 'rgba(255,255,255,0.08)',
                  fontSize: '0.78rem', fontWeight: 700, color: i <= step ? '#fff' : '#64748b',
                  transition: 'all 300ms ease',
                }}>{i + 1}</div>
                <span style={{ fontSize: '0.78rem', color: i === step ? '#f8fafc' : '#64748b', fontWeight: i === step ? 700 : 400 }}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: i < step ? 'rgba(225,29,72,0.5)' : 'rgba(255,255,255,0.08)' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="glassmorphic-card" style={{ padding: 32 }}>
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(225,29,72,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={24} color="#f43f5e" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Welcome, {user?.name}! 👋</h2>
                  <p style={{ color: 'var(--color-muted)', fontSize: '0.88rem', marginTop: 2 }}>
                    Let's set up your learning profile in 2 quick steps.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: <BookOpen size={18} color="#818cf8" />, title: 'Tell us what you already know', desc: 'We\'ll skip what you\'ve mastered and focus on gaps' },
                  { icon: <Target size={18} color="#34d399" />, title: 'Pick your learning goals', desc: 'We\'ll tailor your diagnostic test and practice sessions' },
                  { icon: <CheckCircle2 size={18} color="#f43f5e" />, title: 'Take your diagnostic test', desc: 'Confirms your starting profile with actual questions' },
                ].map(item => (
                  <div key={item.title} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ marginTop: 2 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.title}</div>
                      <div style={{ color: 'var(--color-muted)', fontSize: '0.82rem', marginTop: 2 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: What you know */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>What concepts do you already know?</h2>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.86rem', marginTop: 4 }}>
                  Select all that apply — these will be pre-marked as <strong>Solid</strong> in your profile.
                </p>
              </div>
              {fetching ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-muted)' }}>
                  <Loader2 size={24} className="spin-animation" />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 380, overflowY: 'auto' }}>
                  {categories.map(cat => (
                    <div key={cat}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{cat}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {concepts.filter(c => c.category === cat).map(c => (
                          <button key={c.id} onClick={() => toggleKnown(c.id)} style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                            borderRadius: 10, border: known.has(c.id) ? '1px solid rgba(225,29,72,0.4)' : '1px solid rgba(255,255,255,0.08)',
                            background: known.has(c.id) ? 'rgba(225,29,72,0.1)' : 'rgba(255,255,255,0.02)',
                            cursor: 'pointer', textAlign: 'left', transition: 'all 150ms ease',
                          }}>
                            {known.has(c.id) ? <CheckCircle2 size={18} color="#f43f5e" /> : <Circle size={18} color="#64748b" />}
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{c.name}</div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--color-muted)' }}>{c.difficulty}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: What to learn */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>What do you want to learn?</h2>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.86rem', marginTop: 4 }}>
                  Select all topics you want to master — your adaptive path will prioritize these.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 380, overflowY: 'auto' }}>
                {categories.map(cat => (
                  <div key={cat}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{cat}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {concepts.filter(c => c.category === cat).map(c => (
                        <button key={c.id} onClick={() => toggleLearn(c.id)} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                          borderRadius: 10, border: toLearn.has(c.id) ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
                          background: toLearn.has(c.id) ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer', textAlign: 'left', transition: 'all 150ms ease',
                        }}>
                          {toLearn.has(c.id) ? <CheckCircle2 size={18} color="#818cf8" /> : <Circle size={18} color="#64748b" />}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{c.name}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--color-muted)' }}>{c.difficulty}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
                borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
                background: 'transparent', color: step === 0 ? '#475569' : '#f8fafc',
                cursor: step === 0 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.88rem',
              }}
            >
              <ChevronLeft size={16} /> Back
            </button>

            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 22px',
                borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #e11d48, #6366f1)',
                color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
              }}>
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 22px',
                borderRadius: 10, border: 'none',
                background: loading ? 'rgba(225,29,72,0.4)' : 'linear-gradient(135deg, #e11d48, #6366f1)',
                color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.88rem',
              }}>
                {loading ? <Loader2 size={16} className="spin-animation" /> : <CheckCircle2 size={16} />}
                {loading ? 'Saving…' : 'Save & Start Diagnostic'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
