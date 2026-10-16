import React, { useEffect, useState } from 'react';
import { TeacherOverview, ReviewItem } from '../types';
import { api } from '../api';
import {
  ShieldAlert, Users, BookOpen, Terminal, CheckCircle2,
  Clock, AlertTriangle, FileText, Check, MessageSquare,
  Search, Filter, ChevronRight, RefreshCw, X
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const [overview, setOverview] = useState<TeacherOverview | null>(null);
  const [queue, setQueue] = useState<ReviewItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Review form state
  const [newStatus, setNewStatus] = useState<string>('Verified Legitimate');
  const [teacherNotes, setTeacherNotes] = useState<string>('');
  const [reviewerName, setReviewerName] = useState<string>('Prof. Anderson');
  const [updating, setUpdating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [overviewData, queueData] = await Promise.all([
        api.getTeacherOverview(),
        api.getReviewQueue(statusFilter === 'all' ? undefined : statusFilter)
      ]);
      setOverview(overviewData);
      setQueue(queueData);
    } catch (err) {
      console.error('Failed to load teacher dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleOpenReviewModal = (item: ReviewItem) => {
    setSelectedItem(item);
    setNewStatus(item.status === 'Pending Review' ? 'Verified Legitimate' : item.status);
    setTeacherNotes(item.teacher_notes || '');
    setReviewerName(item.reviewer_name || 'Prof. Anderson');
  };

  const handleSaveReview = async () => {
    if (!selectedItem) return;

    try {
      setUpdating(true);
      const updated = await api.updateReviewItem(
        selectedItem.id,
        newStatus,
        teacherNotes,
        reviewerName
      );

      // Update in local state
      setQueue(prev => prev.map(q => q.id === updated.id ? updated : q));
      setSelectedItem(null);
      // Reload overview to update pending count
      const o = await api.getTeacherOverview();
      setOverview(o);
    } catch (err) {
      console.error('Failed to save review:', err);
      alert('Failed to update review decision.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !overview) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 12px' }} />
        <p>Loading teacher overview and human-review queue...</p>
      </div>
    );
  }

  const dist = overview?.mastery_state_distribution || {
    Solid: 0, 'Needs Practice': 0, 'Not Understood': 0, 'Not Assessed': 0
  };
  const totalMasteryEntries = Object.values(dist).reduce((a, b) => a + b, 0) || 1;

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.74rem', background: 'rgba(239, 68, 68, 0.18)', color: '#fca5a5', padding: '3px 8px', borderRadius: 6, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <ShieldAlert size={13} /> Educator & Human Review Console
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Academic Integrity Telemetry</span>
            </div>
            <h1 style={{ fontSize: '1.65rem', marginTop: 6 }}>Teacher Dashboard & Human-Review Queue</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
              Review student concept mastery, telemetry evidence flags, and evaluate viva defenses with human pedagogical judgment.
            </p>
          </div>

          <button onClick={loadData} className="btn-secondary" style={{ fontSize: '0.84rem' }}>
            <RefreshCw size={14} /> Refresh Queue
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Enrolled Students</span>
            <Users size={18} color="#818cf8" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: 8 }}>
            {overview?.total_students}
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: 8 }}>
            All profiles synchronized in SQLite
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Concept Taxonomies</span>
            <BookOpen size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: 8, color: '#34d399' }}>
            {overview?.total_concepts}
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: 8 }}>
            With prerequisite graph relationships
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Submissions Tested</span>
            <Terminal size={18} color="#60a5fa" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: 8, color: '#60a5fa' }}>
            {overview?.total_submissions}
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: 8 }}>
            Executed in isolated sandboxes
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Human Review Pending</span>
            <ShieldAlert size={18} color="#f87171" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: 8, color: '#f87171' }}>
            {overview?.pending_human_reviews}
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: 8 }}>
            Telemetry evidence awaiting review
          </p>
        </div>
      </div>

      {/* Class Mastery Distribution Bar */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Class Mastery State Distribution</h3>
          <div style={{ display: 'flex', gap: 14, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} />
              Solid ({dist.Solid})
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b' }} />
              Needs Practice ({dist['Needs Practice']})
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444' }} />
              Not Understood ({dist['Not Understood']})
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#64748b' }} />
              Not Assessed ({dist['Not Assessed']})
            </span>
          </div>
        </div>

        {/* Proportional Segmented Bar */}
        <div style={{ width: '100%', height: 14, borderRadius: 7, overflow: 'hidden', display: 'flex', background: 'rgba(255, 255, 255, 0.05)' }}>
          <div style={{ width: `${(dist.Solid / totalMasteryEntries) * 100}%`, background: '#10b981' }} title={`Solid: ${dist.Solid}`} />
          <div style={{ width: `${(dist['Needs Practice'] / totalMasteryEntries) * 100}%`, background: '#f59e0b' }} title={`Needs Practice: ${dist['Needs Practice']}`} />
          <div style={{ width: `${(dist['Not Understood'] / totalMasteryEntries) * 100}%`, background: '#ef4444' }} title={`Not Understood: ${dist['Not Understood']}`} />
          <div style={{ width: `${(dist['Not Assessed'] / totalMasteryEntries) * 100}%`, background: '#64748b' }} title={`Not Assessed: ${dist['Not Assessed']}`} />
        </div>
      </div>

      {/* Human-Review Queue Section */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: '1.25rem' }}>Human-Review Evidence Queue</h2>
              <span style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#fca5a5',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: '0.74rem',
                fontWeight: 700
              }}>
                Strictly Pedagogical Verification
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: 3 }}>
              Evidence flags require human educator review; <em>never automatically declare cheating</em>.
            </p>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'Pending Review', 'Verified Legitimate', 'Requires Follow-up'].map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={statusFilter === f ? 'btn-primary' : 'btn-secondary'}
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              >
                {f === 'all' ? 'All Items' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Queue Items Table */}
        {queue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            No flagged evidence items match the selected filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 14px' }}>Student</th>
                  <th style={{ padding: '12px 14px' }}>Problem / Context</th>
                  <th style={{ padding: '12px 14px' }}>Evidence Flag Type</th>
                  <th style={{ padding: '12px 14px' }}>Severity</th>
                  <th style={{ padding: '12px 14px' }}>Review Status</th>
                  <th style={{ padding: '12px 14px' }}>Flagged Date</th>
                  <th style={{ padding: '12px 14px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {queue.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '14px', fontWeight: 600 }}>{item.student_name}</td>
                    <td style={{ padding: '14px', color: 'var(--text-muted)' }}>{item.problem_title}</td>
                    <td style={{ padding: '14px' }}>
                      <span style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: 600 }}>
                        {item.flag_type}
                      </span>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: item.severity === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: item.severity === 'High' ? '#f87171' : '#fbbf24'
                      }}>
                        {item.severity}
                      </span>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span style={{
                        padding: '3px 9px',
                        borderRadius: 6,
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        background: getStatusBg(item.status),
                        color: getStatusColor(item.status)
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                      {new Date(item.flagged_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <button
                        onClick={() => handleOpenReviewModal(item)}
                        className="btn-secondary"
                        style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                      >
                        Inspect & Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review & Inspection Modal */}
      {selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px', maxWidth: 820 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldAlert size={20} color="#f87171" />
                  <h2 style={{ fontSize: '1.25rem' }}>Human Verification: {selectedItem.student_name}</h2>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: 4 }}>
                  Problem: <strong>{selectedItem.problem_title}</strong> | Flag: <span style={{ color: '#fbbf24' }}>{selectedItem.flag_type}</span>
                </p>
              </div>

              <button onClick={() => setSelectedItem(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Evidence Telemetry Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#818cf8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={15} /> Telemetry & Evidence Details
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, fontSize: '0.82rem' }}>
                  {Object.entries(selectedItem.evidence_details).map(([k, v]) => (
                    <div key={k} style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '8px 10px', borderRadius: 6 }}>
                      <span style={{ color: 'var(--text-dim)', display: 'block', textTransform: 'capitalize' }}>
                        {k.replace(/_/g, ' ')}:
                      </span>
                      <strong style={{ color: 'var(--text-main)' }}>{String(v)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submitted Code Inspection */}
              {selectedItem.student_code && (
                <div>
                  <h4 style={{ fontSize: '0.88rem', marginBottom: 6, color: 'var(--text-muted)' }}>
                    Student's Submitted Python Code:
                  </h4>
                  <div className="code-container">
                    <pre style={{ padding: 12, fontSize: '0.82rem', color: '#cbd5e1', maxHeight: 160, overflowY: 'auto' }}>
                      <code>{selectedItem.student_code}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Viva Responses Inspection */}
              {selectedItem.viva_responses && selectedItem.viva_responses.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.88rem', marginBottom: 6, color: 'var(--text-muted)' }}>
                    Student's Recorded Viva Defense Responses:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedItem.viva_responses.map((vr, idx) => (
                      <div key={idx} style={{ padding: '10px 12px', borderRadius: 6, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
                        <span style={{ color: '#818cf8', fontWeight: 600 }}>Question #{idx + 1}: </span>
                        <p style={{ marginTop: 2, color: 'var(--text-main)', lineHeight: 1.45 }}>{vr.response_text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Decision Form */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h4 style={{ fontSize: '0.92rem' }}>Educator Resolution & Decision</h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                      Review Decision Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      <option value="Verified Legitimate">Verified Legitimate</option>
                      <option value="Requires Follow-up">Requires Follow-up Interview</option>
                      <option value="Suspected Plagiarism">Suspected Plagiarism</option>
                      <option value="Dismissed">Dismissed</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                      Reviewing Educator Name
                    </label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="e.g. Prof. Anderson"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                    Teacher Notes & Pedagogical Justification
                  </label>
                  <textarea
                    rows={3}
                    value={teacherNotes}
                    onChange={(e) => setTeacherNotes(e.target.value)}
                    placeholder="Document oral interview observations, follow-up questions asked, or rationale for resolution..."
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <button onClick={() => setSelectedItem(null)} className="btn-secondary">
                    Cancel
                  </button>
                  <button onClick={handleSaveReview} disabled={updating} className="btn-primary">
                    <Check size={16} />
                    <span>{updating ? 'Saving Decision...' : 'Save Review Decision'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getStatusBg(status: string) {
  switch (status) {
    case 'Verified Legitimate': return 'rgba(16, 185, 129, 0.15)';
    case 'Pending Review': return 'rgba(239, 68, 68, 0.15)';
    case 'Requires Follow-up': return 'rgba(245, 158, 11, 0.15)';
    case 'Suspected Plagiarism': return 'rgba(220, 38, 38, 0.25)';
    default: return 'rgba(100, 116, 139, 0.15)';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Verified Legitimate': return '#34d399';
    case 'Pending Review': return '#f87171';
    case 'Requires Follow-up': return '#fbbf24';
    case 'Suspected Plagiarism': return '#fca5a5';
    default: return '#94a3b8';
  }
}
