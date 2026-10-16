import React from 'react';
import { Student } from '../types';
import {
  GraduationCap, BookOpen, BrainCircuit, Terminal,
  ShieldAlert, Activity, User, ChevronDown
} from 'lucide-react';

interface Props {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  students: Student[];
  currentStudent: Student | null;
  setCurrentStudent: (student: Student) => void;
  isTeacherMode: boolean;
  setIsTeacherMode: (mode: boolean) => void;
  backendHealthy: boolean;
  pendingReviewsCount: number;
}

export const Navbar: React.FC<Props> = ({
  currentTab,
  setCurrentTab,
  students,
  currentStudent,
  setCurrentStudent,
  isTeacherMode,
  setIsTeacherMode,
  backendHealthy,
  pendingReviewsCount
}) => {
  return (
    <nav style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: 1300,
        margin: '0 auto',
        padding: '0 20px',
        height: 68,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16
      }}>
        {/* Brand */}
        <div 
          onClick={() => setCurrentTab('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        >
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(99, 102, 241, 0.45)'
          }}>
            <BrainCircuit size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Adaptive Portal</span>
              <span style={{
                fontSize: '0.68rem',
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                padding: '2px 6px',
                borderRadius: 4,
                fontWeight: 700
              }}>OP-02</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              Adaptive Assessment & Viva Defense
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!isTeacherMode ? (
            <>
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={currentTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}
                style={{ fontSize: '0.86rem', padding: '8px 14px' }}
              >
                <BookOpen size={16} />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setCurrentTab('diagnostic')}
                className={currentTab === 'diagnostic' ? 'btn-primary' : 'btn-secondary'}
                style={{ fontSize: '0.86rem', padding: '8px 14px' }}
              >
                <Activity size={16} />
                <span>Diagnostic Quiz</span>
              </button>
              <button
                onClick={() => setCurrentTab('adaptive')}
                className={currentTab === 'adaptive' ? 'btn-primary' : 'btn-secondary'}
                style={{ fontSize: '0.86rem', padding: '8px 14px' }}
              >
                <BrainCircuit size={16} />
                <span>Adaptive Practice</span>
              </button>
              <button
                onClick={() => setCurrentTab('coding')}
                className={currentTab === 'coding' ? 'btn-primary' : 'btn-secondary'}
                style={{ fontSize: '0.86rem', padding: '8px 14px' }}
              >
                <Terminal size={16} />
                <span>Coding Lab</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setCurrentTab('teacher')}
              className="btn-primary"
              style={{ fontSize: '0.86rem', padding: '8px 16px' }}
            >
              <ShieldAlert size={16} />
              <span>Teacher Review Queue</span>
              {pendingReviewsCount > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 9999,
                  marginLeft: 4
                }}>
                  {pendingReviewsCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Right Section: Mode Toggle, Student Switcher, Health */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Health indicator */}
          <div 
            title={backendHealthy ? "FastAPI Backend Connected" : "Backend Disconnected"}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: varTextColor(backendHealthy) }}
          >
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: backendHealthy ? '#10b981' : '#ef4444',
              boxShadow: backendHealthy ? '0 0 8px #10b981' : 'none'
            }} />
            <span>API</span>
          </div>

          {/* Student Switcher (active when in student mode) */}
          {!isTeacherMode && currentStudent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                value={currentStudent.id}
                onChange={(e) => {
                  const selected = students.find(s => s.id === e.target.value);
                  if (selected) setCurrentStudent(selected);
                }}
                style={{
                  fontSize: '0.84rem',
                  padding: '6px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                {students.map(s => (
                  <option key={s.id} value={s.id} style={{ background: '#0f1626' }}>
                    Student: {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Role Mode Switcher */}
          <button
            onClick={() => {
              const nextMode = !isTeacherMode;
              setIsTeacherMode(nextMode);
              setCurrentTab(nextMode ? 'teacher' : 'dashboard');
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: isTeacherMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.12)',
              border: `1px solid ${isTeacherMode ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.3)'}`,
              color: isTeacherMode ? '#fca5a5' : '#a5b4fc',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {isTeacherMode ? (
              <>
                <GraduationCap size={15} />
                <span>Switch to Student View</span>
              </>
            ) : (
              <>
                <ShieldAlert size={15} />
                <span>Teacher Portal</span>
                {pendingReviewsCount > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: 9999,
                    padding: '1px 5px',
                    fontSize: '0.68rem',
                    fontWeight: 700
                  }}>
                    {pendingReviewsCount}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

function varTextColor(healthy: boolean) {
  return healthy ? '#10b981' : '#ef4444';
}
