import React, { useState, useEffect } from 'react';
import { VivaSessionResponse, VivaEvaluationResponse } from '../types';
import { api } from '../api';
import confetti from 'canvas-confetti';
import {
  Mic, BrainCircuit, ShieldAlert, CheckCircle2,
  AlertTriangle, Sparkles, X, ArrowRight, MessageSquare
} from 'lucide-react';

interface Props {
  submissionId: number;
  studentId: string;
  problemId: string;
  onClose: () => void;
  onVivaCompleted: () => void;
}

export const CodeVivaModal: React.FC<Props> = ({
  submissionId,
  studentId,
  problemId,
  onClose,
  onVivaCompleted
}) => {
  const [session, setSession] = useState<VivaSessionResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<VivaEvaluationResponse | null>(null);

  useEffect(() => {
    const initSession = async () => {
      try {
        setLoading(true);
        const data = await api.startViva(submissionId, studentId, problemId);
        setSession(data);
        // Pre-fill default answers if available
        const initialAnswers: Record<string, string> = {};
        data.questions.forEach(q => {
          initialAnswers[q.id] = '';
        });
        setAnswers(initialAnswers);
      } catch (err) {
        console.error('Failed to start viva session:', err);
        alert('Could not start viva session.');
      } finally {
        setLoading(false);
      }
    };
    initSession();
  }, [submissionId]);

  const handleAnswerChange = (qId: string, text: string) => {
    setAnswers(prev => ({ ...prev, [qId]: text }));
  };

  const handleSubmitDefense = async () => {
    if (!session) return;
    
    // Check if answers are filled
    const answeredCount = Object.values(answers).filter(a => a.trim().length > 0).length;
    if (answeredCount < session.questions.length) {
      alert('Please provide explanations for all 3 viva defense questions.');
      return;
    }

    try {
      setSubmitting(true);
      const answersPayload = Object.entries(answers).map(([qid, txt]) => ({
        question_id: qid,
        response_text: txt
      }));

      const res = await api.submitViva(session.session_id, answersPayload);
      setEvaluation(res);
      onVivaCompleted();

      if (res.viva_score >= 75) {
        confetti({
          particleCount: 90,
          spread: 60,
          origin: { y: 0.5 }
        });
      }
    } catch (err) {
      console.error('Failed to submit viva:', err);
      alert('Error evaluating viva defense.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Mic size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '1.3rem' }}>Code Explanation Viva Defense</h2>
                <span style={{ fontSize: '0.72rem', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                  Oral Defense Standard
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: 3 }}>
                Demonstrate genuine comprehension of logic, asymptotic complexity, and edge cases.
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <p>Initializing viva questions and rubric...</p>
          </div>
        ) : evaluation ? (
          /* Evaluation Results View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
              padding: '20px 24px',
              borderRadius: 'var(--radius-lg)',
              background: evaluation.viva_score >= 70 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              border: `1px solid ${evaluation.viva_score >= 70 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Viva Defense Rating
                </div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, marginTop: 2, color: evaluation.viva_score >= 70 ? '#34d399' : '#fbbf24' }}>
                  {evaluation.rating} ({evaluation.viva_score}/100)
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: 4, maxWidth: 500 }}>
                  {evaluation.summary_feedback}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className={`badge-mastery ${evaluation.viva_score >= 70 ? 'badge-solid' : 'badge-needs-practice'}`} style={{ fontSize: '0.82rem' }}>
                  {evaluation.rating}
                </span>
              </div>
            </div>

            {/* Rubric Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              {/* Logic */}
              <div style={{ padding: '14px 16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#818cf8' }}>Logic & Algorithm</span>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{evaluation.rubric_scores.logic.score} / 30</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                  {evaluation.rubric_scores.logic.feedback}
                </p>
              </div>

              {/* Complexity */}
              <div style={{ padding: '14px 16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#34d399' }}>Big-O Derivation</span>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{evaluation.rubric_scores.complexity.score} / 35</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                  {evaluation.rubric_scores.complexity.feedback}
                </p>
              </div>

              {/* Edge Cases */}
              <div style={{ padding: '14px 16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fbbf24' }}>Edge Cases & Tests</span>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{evaluation.rubric_scores.edge_cases.score} / 35</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                  {evaluation.rubric_scores.edge_cases.feedback}
                </p>
              </div>
            </div>

            {/* Discrepancy Evidence Flag Notice */}
            {evaluation.discrepancy_flagged && (
              <div style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12
              }}>
                <ShieldAlert size={20} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '0.84rem', color: '#fef3c7', lineHeight: 1.5 }}>
                  <strong>Evidence Flag Queued for Human Review:</strong> An algorithmic discrepancy was detected between the submitted Python code and the viva explanation. In adherence to academic integrity principles, <em>the system never automatically declares cheating</em>. This item has been submitted to the Teacher Human-Review Queue for instructor verification.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button onClick={onClose} className="btn-primary">
                Done & Return to Lab
              </button>
            </div>
          </div>
        ) : (
          /* Question Defense Form */
          session && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Reference Code snippet toggle */}
              <details style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
                <summary style={{ cursor: 'pointer', fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Inspect Your Submitted Python Solution
                </summary>
                <div className="code-container" style={{ marginTop: 10 }}>
                  <pre style={{ padding: 12, fontSize: '0.82rem', color: '#94a3b8', maxHeight: 150, overflowY: 'auto' }}>
                    <code>{session.student_code}</code>
                  </pre>
                </div>
              </details>

              {/* Defense Questions */}
              {session.questions.map((q, idx) => (
                <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: '#818cf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.76rem',
                        fontWeight: 700
                      }}>
                        {idx + 1}
                      </span>
                      <span>{q.prompt}</span>
                    </label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'capitalize' }}>
                      Category: {q.category.replace('_', ' ')}
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    placeholder={
                      q.category === 'logic'
                        ? "e.g., I used a hash table lookup to achieve linear time by storing visited elements and their indices..."
                        : q.category === 'complexity'
                        ? "e.g., Time complexity is O(n) because we iterate through the list once. Space complexity is O(n) for the dictionary..."
                        : "e.g., Tested empty arrays, single elements, negative targets, and duplicates..."
                    }
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    style={{ fontSize: '0.88rem', lineHeight: 1.45 }}
                  />
                </div>
              ))}

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  Evaluated via deterministic rubric engine (or LLM if configured)
                </span>
                <button
                  onClick={handleSubmitDefense}
                  disabled={submitting}
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' }}
                >
                  {submitting ? 'Evaluating Defense Rubric...' : 'Submit Viva Defense'}
                  <Sparkles size={16} />
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
