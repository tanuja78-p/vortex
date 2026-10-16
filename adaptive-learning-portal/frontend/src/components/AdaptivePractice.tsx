import React, { useEffect, useState } from 'react';
import { Student, QuizQuestion, QuizSubmitResponse } from '../types';
import { api } from '../api';
import confetti from 'canvas-confetti';
import { ConceptMasteryBadge } from './ConceptMasteryBadge';
import {
  BrainCircuit, Sparkles, CheckCircle2, XCircle,
  ArrowRight, RotateCcw, AlertTriangle, Zap, Check
} from 'lucide-react';

interface Props {
  student: Student;
  onNavigate: (tab: string) => void;
  onQuizCompleted: () => void;
}

export const AdaptivePractice: React.FC<Props> = ({ student, onNavigate, onQuizCompleted }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizSubmitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchAdaptiveBatch = async () => {
    try {
      setLoading(true);
      setResult(null);
      setSelectedAnswers({});
      setCurrentIndex(0);
      const data = await api.getAdaptiveQuiz(student.id);
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load adaptive practice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdaptiveBatch();
  }, [student.id]);

  const handleSelect = (idx: number) => {
    if (result) return;
    const q = questions[currentIndex];
    setSelectedAnswers(prev => ({
      ...prev,
      [q.id]: idx
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const answersList = Object.entries(selectedAnswers).map(([qid, idx]) => ({
        question_id: qid,
        selected_index: idx
      }));

      const res = await api.submitQuiz(student.id, 'adaptive', answersList);
      setResult(res);
      onQuizCompleted();

      if (res.score_percentage >= 70) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error('Adaptive submit failed:', err);
      alert('Failed to submit adaptive practice.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <p>Synthesizing personalized adaptive questions based on weak concept telemetry...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="glass-panel" style={{ maxWidth: 700, margin: '40px auto', padding: 40, textAlign: 'center' }}>
        <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
        <h2>All Concepts Assessed as Solid!</h2>
        <p style={{ color: 'var(--text-muted)', margin: '12px 0 24px' }}>
          Great work! Your current concept portfolio shows high mastery. Try solving a challenging coding assessment to test edge cases.
        </p>
        <button onClick={() => onNavigate('coding')} className="btn-primary">
          Enter Coding Lab
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const selectedIdx = selectedAnswers[currentQ?.id];
  const allAnswered = Object.keys(selectedAnswers).length >= questions.length;

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.74rem', background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', padding: '3px 8px', borderRadius: 6, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Zap size={12} /> Adaptive Engine Active
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>
            <h1 style={{ fontSize: '1.6rem', marginTop: 6 }}>Adaptive Remediation Practice</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
              Questions dynamically prioritized from your identified weak concepts ({student.name}).
            </p>
          </div>

          <button onClick={fetchAdaptiveBatch} className="btn-secondary" style={{ fontSize: '0.84rem' }}>
            <RotateCcw size={14} /> Refresh Batch
          </button>
        </div>

        {/* Progress pill stepper */}
        <div style={{ display: 'flex', gap: 6, marginTop: 18 }}>
          {questions.map((q, idx) => {
            const isFilled = selectedAnswers[q.id] !== undefined;
            const isCurrent = idx === currentIndex;
            return (
              <div
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  cursor: 'pointer',
                  background: isCurrent ? 'var(--primary)' : (isFilled ? 'rgba(99, 102, 241, 0.45)' : 'rgba(255, 255, 255, 0.08)'),
                  transition: 'background 0.2s ease'
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Results View */}
      {result ? (
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: result.score_percentage >= 70 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: result.score_percentage >= 70 ? '#34d399' : '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <Sparkles size={28} />
            </div>
            <h2 style={{ fontSize: '1.5rem' }}>Adaptive Session Complete: {result.score_percentage}%</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
              Successfully evaluated {result.correct_answers} of {result.total_questions} targeted questions.
            </p>
          </div>

          {/* Updated Mastery States */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: 12 }}>Updated Concept Mastery States in SQLite:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              {result.updated_mastery.map(m => (
                <div key={m.concept_id} style={{
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{m.concept_name}</span>
                  <ConceptMasteryBadge state={m.state} score={m.score} />
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button onClick={fetchAdaptiveBatch} className="btn-secondary">
              <RotateCcw size={15} /> Practice Another Batch
            </button>
            <button onClick={() => onNavigate('dashboard')} className="btn-primary">
              Return to Dashboard
            </button>
          </div>
        </div>
      ) : (
        /* Single Question Card */
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge-mastery badge-needs-practice" style={{ fontSize: '0.74rem' }}>
                Targeting: {currentQ.concept_name || 'Weak Concept'}
              </span>
              <span style={{ fontSize: '0.74rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-muted)' }}>
                {currentQ.difficulty}
              </span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Step {currentIndex + 1} / {questions.length}
            </span>
          </div>

          <h3 style={{ fontSize: '1.18rem', lineHeight: 1.45, marginBottom: 14 }}>
            {currentQ.prompt}
          </h3>

          {currentQ.code_snippet && (
            <div className="code-container" style={{ marginBottom: 18 }}>
              <pre style={{ padding: 14, fontSize: '0.86rem', color: '#cbd5e1', overflowX: 'auto' }}>
                <code>{currentQ.code_snippet}</code>
              </pre>
            </div>
          )}

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {currentQ.options.map((opt, oIdx) => {
              const isSelected = selectedIdx === oIdx;
              return (
                <div
                  key={oIdx}
                  onClick={() => handleSelect(oIdx)}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: `2px solid ${isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.2)'}`,
                    background: isSelected ? 'var(--primary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '0.7rem'
                  }}>
                    {isSelected && '✓'}
                  </div>
                  <span style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>{opt}</span>
                </div>
              );
            })}
          </div>

          {/* Stepper Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 18 }}>
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="btn-secondary"
              style={{ visibility: currentIndex === 0 ? 'hidden' : 'visible' }}
            >
              Previous
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="btn-primary"
                >
                  <span>Next Question</span>
                  <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!allAnswered || submitting}
                  className="btn-primary"
                  style={{ background: 'var(--gradient-warm)' }}
                >
                  {submitting ? 'Updating Mastery...' : 'Submit Adaptive Answers'}
                  <Sparkles size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
