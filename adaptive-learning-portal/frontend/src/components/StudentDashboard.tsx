import React, { useEffect, useState } from 'react';
import { Student, StudentDetail, Concept, SubmissionHistoryItem } from '../types';
import { api } from '../api';
import { ConceptMasteryBadge } from './ConceptMasteryBadge';
import {
  Trophy, Target, Zap, AlertCircle, ArrowRight,
  CheckCircle2, Clock, Terminal, RefreshCw, Sparkles
} from 'lucide-react';

interface Props {
  student: Student;
  onNavigate: (tab: string) => void;
}

export const StudentDashboard: React.FC<Props> = ({ student, onNavigate }) => {
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentData, conceptsData, subsData] = await Promise.all([
        api.getStudentDetail(student.id),
        api.getConcepts(student.id),
        api.getStudentSubmissions(student.id)
      ]);
      setDetail(studentData);
      setConcepts(conceptsData);
      setSubmissions(subsData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [student.id]);

  if (loading || !detail) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 12px' }} />
        <p>Loading your learning profile and mastery states...</p>
      </div>
    );
  }

  // Count mastery states
  const solidCount = detail.mastery_breakdown.filter(m => m.state === 'Solid').length;
  const practiceCount = detail.mastery_breakdown.filter(m => m.state === 'Needs Practice').length;
  const notUnderstoodCount = detail.mastery_breakdown.filter(m => m.state === 'Not Understood').length;
  const notAssessedCount = detail.mastery_breakdown.filter(m => m.state === 'Not Assessed').length;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header Profile Greeting */}
      <div className="glass-panel" style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <img
            src={student.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${student.name}`}
            alt={student.name}
            style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', border: '2px solid rgba(99, 102, 241, 0.4)' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: '1.65rem' }}>Welcome back, {student.name}</h1>
              <span className="badge-mastery badge-solid" style={{ fontSize: '0.72rem' }}>
                <Sparkles size={12} /> Active Learner
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
              Tracking real-time algorithmic concept mastery, coding tests, and oral viva readiness.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => onNavigate('diagnostic')} className="btn-secondary">
            <Target size={16} /> Diagnostic Assessment
          </button>
          <button onClick={() => onNavigate('adaptive')} className="btn-primary">
            <Zap size={16} /> Practice Weak Concepts
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
        {/* Overall Mastery */}
        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Overall Mastery</span>
            <Trophy size={18} color="#818cf8" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: 8 }} className="gradient-text">
            {detail.overall_mastery}%
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>{solidCount} Solid</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>•</span>
            <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 600 }}>{practiceCount} Practice</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>•</span>
            <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600 }}>{notUnderstoodCount} Weak</span>
          </div>
        </div>

        {/* Accuracy */}
        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Diagnostic Accuracy</span>
            <Target size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: 8, color: '#34d399' }}>
            {detail.accuracy_percentage}%
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: 10 }}>
            Calculated across all question attempts
          </p>
        </div>

        {/* Total Attempts */}
        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Assessment Attempts</span>
            <CheckCircle2 size={18} color="#60a5fa" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: 8, color: '#60a5fa' }}>
            {detail.total_attempts}
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: 10 }}>
            Quizzes and coding executions recorded
          </p>
        </div>

        {/* Weak Concepts Count */}
        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Needs Remediation</span>
            <AlertCircle size={18} color="#f87171" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: 8, color: '#f87171' }}>
            {detail.weak_concepts.length}
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: 10 }}>
            Concepts prioritized for adaptive practice
          </p>
        </div>
      </div>

      {/* Weak Concepts Targeted Remediation Banner */}
      {detail.weak_concepts.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(245, 158, 11, 0.12) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f87171'
            }}>
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#fca5a5' }}>
                Adaptive Recommendation: Prioritize Weak Concepts
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 2 }}>
                Current struggling topics: <strong>{detail.weak_concepts.join(', ')}</strong>. Adaptive questions will reinforce foundational logic.
              </p>
            </div>
          </div>
          <button onClick={() => onNavigate('adaptive')} className="btn-primary" style={{ background: 'var(--gradient-warm)' }}>
            <span>Start Focused Session</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Concept Mastery Breakdown Section */}
      <div className="glass-panel" style={{ padding: '26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Concept Mastery Breakdown</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: 3 }}>
              Continuous evaluation across 4 states: Solid, Needs Practice, Not Understood, and Not Assessed
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <ConceptMasteryBadge state="Solid" />
            <ConceptMasteryBadge state="Needs Practice" />
            <ConceptMasteryBadge state="Not Understood" />
            <ConceptMasteryBadge state="Not Assessed" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {detail.mastery_breakdown.map((m) => {
            const cMeta = concepts.find(c => c.id === m.concept_id);
            const scorePct = Math.round(m.score * 100);

            return (
              <div
                key={m.concept_id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {m.category}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.02rem', marginTop: 2 }}>
                      {m.concept_name}
                    </div>
                  </div>
                  <ConceptMasteryBadge state={m.state} score={m.score} />
                </div>

                {cMeta?.description && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                    {cMeta.description}
                  </p>
                )}

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 5 }}>
                    <span style={{ color: 'var(--text-dim)' }}>Confidence Index</span>
                    <span style={{ fontWeight: 600 }}>{m.state === 'Not Assessed' ? 'Unassessed' : `${scorePct}%`}</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${m.state === 'Not Assessed' ? 0 : scorePct}%`,
                        height: '100%',
                        background: getBarColor(m.state),
                        borderRadius: 3,
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-dim)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: 10 }}>
                  <span>Attempts: {m.attempts_count}</span>
                  <span>Accuracy: {m.attempts_count > 0 ? Math.round((m.correct_count / m.attempts_count) * 100) : 0}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Coding Submissions */}
      <div className="glass-panel" style={{ padding: '26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Recent Coding & Viva Submissions</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: 3 }}>
              Submissions tested inside isolated sandboxed runner with automated telemetry checks
            </p>
          </div>
          <button onClick={() => onNavigate('coding')} className="btn-secondary" style={{ fontSize: '0.84rem' }}>
            <Terminal size={15} /> Open Coding Lab
          </button>
        </div>

        {submissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
            No coding submissions recorded yet. Try solving an algorithmic challenge!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 14px' }}>Problem</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                  <th style={{ padding: '12px 14px' }}>Tests Passed</th>
                  <th style={{ padding: '12px 14px' }}>Runtime</th>
                  <th style={{ padding: '12px 14px' }}>Evidence Flag</th>
                  <th style={{ padding: '12px 14px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '14px', fontWeight: 600 }}>{sub.problem_title}</td>
                    <td style={{ padding: '14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        background: sub.status === 'Accepted' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: sub.status === 'Accepted' ? '#34d399' : '#f87171'
                      }}>
                        {sub.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-muted)' }}>
                      {sub.tests_passed} / {sub.total_tests}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {sub.runtime_ms} ms
                    </td>
                    <td style={{ padding: '14px' }}>
                      {sub.has_evidence_flag ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: '0.74rem',
                          color: '#fbbf24',
                          background: 'rgba(245, 158, 11, 0.12)',
                          padding: '3px 8px',
                          borderRadius: 6
                        }}>
                          <Clock size={12} /> Under Educator Review
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.74rem', color: '#34d399' }}>Verified Clean</span>
                      )}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      {new Date(sub.submitted_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

function getBarColor(state: string) {
  switch (state) {
    case 'Solid': return '#10b981';
    case 'Needs Practice': return '#f59e0b';
    case 'Not Understood': return '#ef4444';
    default: return '#64748b';
  }
}
