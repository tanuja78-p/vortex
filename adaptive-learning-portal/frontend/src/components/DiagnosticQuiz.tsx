import React, { useEffect, useState } from 'react';
import { Student, QuizQuestion, QuizSubmitResponse } from '../types';
import { api } from '../api';
import confetti from 'canvas-confetti';
import { ConceptMasteryBadge } from './ConceptMasteryBadge';
import {
  CheckCircle2, XCircle, HelpCircle, ArrowRight,
  RotateCcw, Sparkles, BookOpen, AlertCircle
} from 'lucide-react';

interface Props {
  student: Student;
  onNavigate: (tab: string) => void;
  onQuizCompleted: () => void;
}

export const DiagnosticQuiz: React.FC<Props> = ({ student, onNavigate, onQuizCompleted }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizSubmitResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      setResult(null);
      setSelectedAnswers({});
      const data = await api.getDiagnosticQuiz();
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load diagnostic quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [student.id]);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (result) return; // Locked once submitted
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      alert('Please answer all diagnostic questions before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      const answersList = Object.entries(selectedAnswers).map(([qid, idx]) => ({
        question_id: qid,
        selected_index: idx
      }));

      const res = await api.submitQuiz(student.id, 'diagnostic', answersList);
      setResult(res);
      onQuizCompleted();

      if (res.score_percentage >= 70) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error('Quiz submission failed:', err);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <p>Loading diagnostic programming questions...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Quiz Header */}
      <div className="glass-panel" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.74rem', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                Diagnostic Baseline
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                {questions.length} Core Questions
              </span>
            </div>
            <h1 style={{ fontSize: '1.6rem', marginTop: 6 }}>Diagnostic Programming Assessment</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
              Establishes initial concept mastery states (Solid, Needs Practice, Not Understood) across OOP, recursion, complexity, and dynamic programming.
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Assessing Learner</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{student.name}</div>
          </div>
        </div>
      </div>

      {/* Results Banner if Submitted */}
      {result && (
        <div className="glass-panel" style={{
          padding: '24px 28px',
          border: `1px solid ${result.score_percentage >= 70 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
          background: result.score_percentage >= 70 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={20} color={result.score_percentage >= 70 ? '#34d399' : '#fbbf24'} />
                <h2 style={{ fontSize: '1.3rem' }}>Diagnostic Complete: {result.score_percentage}% Score</h2>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
                Answered {result.correct_answers} of {result.total_questions} questions correctly. Mastery states have been updated in SQLite!
              </p>
              {result.weak_concepts.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.82rem', color: '#fca5a5', fontWeight: 600 }}>Identified Weak Concepts:</span>
                  {result.weak_concepts.map(wc => (
                    <span key={wc} className="badge-mastery badge-needs-practice" style={{ fontSize: '0.72rem' }}>
                      {wc}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={fetchQuiz} className="btn-secondary">
                <RotateCcw size={15} /> Retake
              </button>
              <button onClick={() => onNavigate('adaptive')} className="btn-primary">
                <span>Adaptive Practice</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {questions.map((q, qIndex) => {
          const selectedIdx = selectedAnswers[q.id];
          const questionResult = result?.results.find(r => r.question_id === q.id);

          return (
            <div key={q.id} className="glass-panel" style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.82rem',
                    fontWeight: 700
                  }}>
                    {qIndex + 1}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {q.concept_name || 'Programming Core'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.74rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-muted)' }}>
                    {q.difficulty}
                  </span>
                  {questionResult && (
                    questionResult.is_correct ? (
                      <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 700 }}>
                        <CheckCircle2 size={16} /> Correct
                      </span>
                    ) : (
                      <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 700 }}>
                        <XCircle size={16} /> Incorrect
                      </span>
                    )
                  )}
                </div>
              </div>

              <h3 style={{ fontSize: '1.08rem', lineHeight: 1.4, marginBottom: 12 }}>{q.prompt}</h3>

              {q.code_snippet && (
                <div className="code-container" style={{ marginBottom: 16 }}>
                  <pre style={{ padding: 14, fontSize: '0.86rem', color: '#cbd5e1', overflowX: 'auto' }}>
                    <code>{q.code_snippet}</code>
                  </pre>
                </div>
              )}

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.options.map((opt, oIdx) => {
                  const isSelected = selectedIdx === oIdx;
                  const isCorrect = questionResult && questionResult.correct_index === oIdx;
                  const isWrongSelected = questionResult && !questionResult.is_correct && isSelected;

                  let borderColor = 'var(--border-subtle)';
                  let bgColor = 'rgba(255, 255, 255, 0.02)';

                  if (result) {
                    if (isCorrect) {
                      borderColor = 'rgba(16, 185, 129, 0.6)';
                      bgColor = 'rgba(16, 185, 129, 0.12)';
                    } else if (isWrongSelected) {
                      borderColor = 'rgba(239, 68, 68, 0.6)';
                      bgColor = 'rgba(239, 68, 68, 0.12)';
                    }
                  } else if (isSelected) {
                    borderColor = 'var(--primary)';
                    bgColor = 'rgba(99, 102, 241, 0.12)';
                  }

                  return (
                    <div
                      key={oIdx}
                      onClick={() => handleSelectOption(q.id, oIdx)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${borderColor}`,
                        background: bgColor,
                        cursor: result ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          border: `2px solid ${isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.2)'}`,
                          background: isSelected ? 'var(--primary)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          color: '#fff'
                        }}>
                          {isSelected && '✓'}
                        </div>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{opt}</span>
                      </div>

                      {result && isCorrect && (
                        <span style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 700 }}>
                          Correct Answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation after submission */}
              {questionResult && (
                <div style={{
                  marginTop: 14,
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  fontSize: '0.84rem',
                  lineHeight: 1.5,
                  color: 'var(--text-muted)'
                }}>
                  <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: 2 }}>
                    Conceptual Explanation:
                  </strong>
                  {questionResult.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit button bar */}
      {!result && (
        <div className="glass-panel" style={{ padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Answered {Object.keys(selectedAnswers).length} of {questions.length} questions
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || Object.keys(selectedAnswers).length < questions.length}
            className="btn-primary"
            style={{ padding: '12px 28px', fontSize: '0.95rem' }}
          >
            {submitting ? 'Evaluating Diagnostics...' : 'Submit Diagnostic Quiz'}
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
