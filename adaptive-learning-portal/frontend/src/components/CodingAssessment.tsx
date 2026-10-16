import React, { useEffect, useState, useRef } from 'react';
import {
  Student, CodingProblemSummary, CodingProblemDetail,
  CodeSubmitResponse, SubmissionHistoryItem
} from '../types';
import { api } from '../api';
import confetti from 'canvas-confetti';
import { CodeVivaModal } from './CodeVivaModal';
import {
  Play, RotateCcw, CheckCircle2, XCircle, ShieldAlert,
  Clock, Terminal, Mic, AlertTriangle, Eye, EyeOff, Sparkles
} from 'lucide-react';

interface Props {
  student: Student;
  onNavigate: (tab: string) => void;
}

export const CodingAssessment: React.FC<Props> = ({ student, onNavigate }) => {
  const [problems, setProblems] = useState<CodingProblemSummary[]>([]);
  const [selectedProblemId, setSelectedProblemId] = useState<string>('');
  const [problemDetail, setProblemDetail] = useState<CodingProblemDetail | null>(null);
  const [code, setCode] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<CodeSubmitResponse | null>(null);
  const [showVivaModal, setShowVivaModal] = useState(false);
  const [history, setHistory] = useState<SubmissionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Telemetry trackers
  const [pasteCount, setPasteCount] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

  // Track window blur / focus for integrity telemetry
  useEffect(() => {
    const handleBlur = () => {
      setTabSwitches(prev => prev + 1);
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  // Fetch problems list
  useEffect(() => {
    const loadProblems = async () => {
      try {
        setLoading(true);
        const data = await api.getCodingProblems();
        setProblems(data);
        if (data.length > 0) {
          setSelectedProblemId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load problems:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProblems();
  }, []);

  // Fetch problem detail when selected problem changes
  useEffect(() => {
    if (!selectedProblemId) return;
    const loadDetail = async () => {
      try {
        const detail = await api.getCodingProblemDetail(selectedProblemId);
        setProblemDetail(detail);
        setCode(detail.initial_code);
        setSubmitResult(null);
        setPasteCount(0);
        setTabSwitches(0);
        startTimeRef.current = Date.now();

        // Load submission history for student
        const subs = await api.getStudentSubmissions(student.id);
        setHistory(subs.filter(s => s.problem_id === selectedProblemId));
      } catch (err) {
        console.error('Failed to load problem detail:', err);
      }
    };
    loadDetail();
  }, [selectedProblemId, student.id]);

  const handlePaste = () => {
    setPasteCount(prev => prev + 1);
  };

  const handleResetCode = () => {
    if (problemDetail) {
      setCode(problemDetail.initial_code);
      setSubmitResult(null);
    }
  };

  const handleSubmitCode = async () => {
    if (!problemDetail) return;

    try {
      setSubmitting(true);
      const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;

      const res = await api.submitCode(
        student.id,
        problemDetail.id,
        code,
        'python',
        {
          paste_count: pasteCount,
          time_spent_seconds: elapsedSeconds,
          tab_switches: tabSwitches
        }
      );

      setSubmitResult(res);

      // Refresh history
      const subs = await api.getStudentSubmissions(student.id);
      setHistory(subs.filter(s => s.problem_id === selectedProblemId));

      if (res.status === 'Accepted') {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Code execution error. Please check your syntax and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <p>Loading algorithmic coding problems...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Problem Tabs Navigation */}
      <div className="glass-panel" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.84rem', color: 'var(--text-dim)', fontWeight: 600, marginRight: 6 }}>
            Select Challenge:
          </span>
          {problems.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProblemId(p.id)}
              className={selectedProblemId === p.id ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.84rem', padding: '7px 14px' }}
            >
              <span>{p.title}</span>
              <span style={{
                fontSize: '0.7rem',
                opacity: 0.8,
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '1px 6px',
                borderRadius: 4
              }}>
                {p.difficulty}
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          <Clock size={14} /> Telemetry Tracking Active
        </div>
      </div>

      {problemDetail && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) minmax(460px, 1.25fr)', gap: 20 }}>
          {/* Left Column: Problem Details & Test Cases */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: '0.74rem', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                      {problemDetail.concept_name}
                    </span>
                    <span style={{
                      fontSize: '0.74rem',
                      background: problemDetail.difficulty === 'Easy' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: problemDetail.difficulty === 'Easy' ? '#34d399' : '#fbbf24',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontWeight: 700
                    }}>
                      {problemDetail.difficulty}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.35rem' }}>{problemDetail.title}</h2>
                </div>
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.55, marginTop: 14 }}>
                {problemDetail.description}
              </p>

              {/* Tags */}
              <div style={{ display: 'flex', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
                {problemDetail.tags.map(t => (
                  <span key={t} style={{ fontSize: '0.74rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-dim)', padding: '2px 8px', borderRadius: 4 }}>
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Public Test Cases */}
            <div className="glass-panel" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={16} color="#818cf8" /> Public Sample Cases
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  Hidden cases evaluated on server
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {problemDetail.visible_test_cases.map(tc => (
                  <div key={tc.id} style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.82rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginBottom: 4 }}>
                      <span>Test #{tc.id}</span>
                      <span>Input: <code style={{ color: '#cbd5e1' }}>{tc.input}</code></span>
                    </div>
                    <div style={{ color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                      Expected Output: {tc.expected}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Past Attempts on this problem */}
            {history.length > 0 && (
              <div className="glass-panel" style={{ padding: '20px 24px' }}>
                <h3 style={{ fontSize: '0.98rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={15} color="#94a3b8" /> Saved Attempts ({history.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {history.slice(0, 3).map(h => (
                    <div key={h.id} style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: 'rgba(255, 255, 255, 0.02)',
                      fontSize: '0.78rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        color: h.status === 'Accepted' ? '#34d399' : '#f87171',
                        fontWeight: 700
                      }}>
                        {h.status} ({h.tests_passed}/{h.total_tests})
                      </span>
                      <span style={{ color: 'var(--text-dim)' }}>
                        {new Date(h.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Code Editor & Sandboxed Runner */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Editor Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.78rem', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
                    Python 3.13
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Function: <code>{problemDetail.function_name}</code>
                  </span>
                </div>

                <button onClick={handleResetCode} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.76rem' }}>
                  <RotateCcw size={12} /> Reset Code
                </button>
              </div>

              {/* Code Textarea */}
              <div className="code-container">
                <textarea
                  className="code-textarea"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onPaste={handlePaste}
                  spellCheck={false}
                  placeholder="Write your Python implementation..."
                />
              </div>

              {/* Security & Isolated Runner Badge Notice */}
              <div style={{
                fontSize: '0.74rem',
                color: 'var(--text-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 4px'
              }}>
                <span>🛡️ Limited Sandboxed Subprocess Runner (Demo Execution Mode)</span>
                <span>Pastes: {pasteCount}</span>
              </div>

              {/* Execute / Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button
                  onClick={handleSubmitCode}
                  disabled={submitting || !code.trim()}
                  className="btn-primary"
                  style={{ padding: '10px 24px', fontSize: '0.92rem' }}
                >
                  <Play size={16} />
                  <span>{submitting ? 'Running in Sandbox...' : 'Run & Submit Code'}</span>
                </button>
              </div>
            </div>

            {/* Test Results Display */}
            {submitResult && (
              <div className="glass-panel" style={{
                padding: '20px 24px',
                border: `1px solid ${submitResult.status === 'Accepted' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {submitResult.status === 'Accepted' ? (
                        <CheckCircle2 size={20} color="#34d399" />
                      ) : (
                        <XCircle size={20} color="#f87171" />
                      )}
                      <h3 style={{ fontSize: '1.15rem' }}>
                        Verdict: {submitResult.status} ({submitResult.tests_passed}/{submitResult.total_tests} Tests Passed)
                      </h3>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4 }}>
                      Execution completed in {submitResult.runtime_ms} ms via isolated subprocess.
                    </p>
                  </div>

                  {/* Viva Action Button */}
                  {submitResult.eligible_for_viva && (
                    <button
                      onClick={() => setShowVivaModal(true)}
                      className="btn-primary"
                      style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' }}
                    >
                      <Mic size={16} />
                      <span>Start Code Viva Defense</span>
                      <Sparkles size={14} />
                    </button>
                  )}
                </div>

                {/* Evidence Flag Notice if telemetry flagged */}
                {submitResult.has_evidence_flag && (
                  <div style={{
                    marginTop: 14,
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10
                  }}>
                    <AlertTriangle size={18} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: '0.8rem', color: '#fef3c7', lineHeight: 1.45 }}>
                      <strong>Evidence Flag Logged for Human Review:</strong> {submitResult.flag_reason}.
                      <div style={{ marginTop: 2, opacity: 0.85 }}>
                        Note: The system never automatically penalizes or declares dishonesty. A human educator will verify your thought process during oral viva defense.
                      </div>
                    </div>
                  </div>
                )}

                {/* Detailed Test Run Case Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                  {submitResult.test_results.map(tr => (
                    <div key={tr.test_id} style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${tr.passed ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                      fontSize: '0.82rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {tr.passed ? <CheckCircle2 size={15} color="#34d399" /> : <XCircle size={15} color="#f87171" />}
                        <span>Case #{tr.test_id} {tr.is_hidden && '(Hidden Test Case)'}</span>
                      </div>

                      <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                        {tr.is_hidden ? (
                          <span style={{ color: tr.passed ? '#34d399' : '#f87171' }}>
                            {tr.passed ? 'Passed (Secret Masked)' : 'Output Mismatch'}
                          </span>
                        ) : (
                          tr.passed ? (
                            <span style={{ color: '#34d399' }}>Expected {tr.expected_repr} == Actual {tr.actual_repr}</span>
                          ) : (
                            <span style={{ color: '#f87171' }}>{tr.error || `Expected ${tr.expected_repr}, got ${tr.actual_repr}`}</span>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Code Viva Modal */}
      {showVivaModal && submitResult && problemDetail && (
        <CodeVivaModal
          submissionId={submitResult.submission_id}
          studentId={student.id}
          problemId={problemDetail.id}
          onClose={() => setShowVivaModal(false)}
          onVivaCompleted={() => {
            // refresh data
          }}
        />
      )}
    </div>
  );
};
