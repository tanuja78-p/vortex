import React, { useState, useEffect } from 'react';
import { Student } from './types';
import { api } from './api';
import { Navbar } from './components/Navbar';
import { StudentDashboard } from './components/StudentDashboard';
import { DiagnosticQuiz } from './components/DiagnosticQuiz';
import { AdaptivePractice } from './components/AdaptivePractice';
import { CodingAssessment } from './components/CodingAssessment';
import { TeacherDashboard } from './components/TeacherDashboard';
import { RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [isTeacherMode, setIsTeacherMode] = useState<boolean>(false);
  const [backendHealthy, setBackendHealthy] = useState<boolean>(false);
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize app
  const initApp = async () => {
    try {
      setLoading(true);
      // Health check
      try {
        const health = await api.getHealth();
        setBackendHealthy(health.status === 'ok');
      } catch {
        setBackendHealthy(false);
      }

      // Fetch students
      const studentList = await api.getStudents();
      setStudents(studentList);
      if (studentList.length > 0) {
        setCurrentStudent(studentList[0]);
      }

      // Fetch pending reviews count
      try {
        const queue = await api.getReviewQueue('Pending Review');
        setPendingReviewsCount(queue.length);
      } catch {
        setPendingReviewsCount(0);
      }
    } catch (err) {
      console.error('Failed to initialize app:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  const refreshPendingCount = async () => {
    try {
      const queue = await api.getReviewQueue('Pending Review');
      setPendingReviewsCount(queue.length);
    } catch {
      // ignore
    }
  };

  if (loading || !currentStudent) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        color: 'var(--text-muted)'
      }}>
        <RefreshCw size={36} className="spin-animation" style={{ color: 'var(--primary)' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Connecting to Adaptive Learning Engine...</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
          Validating SQLite database schemas and API services
        </p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'teacher') {
            setIsTeacherMode(true);
          } else {
            setIsTeacherMode(false);
          }
        }}
        students={students}
        currentStudent={currentStudent}
        setCurrentStudent={setCurrentStudent}
        isTeacherMode={isTeacherMode}
        setIsTeacherMode={setIsTeacherMode}
        backendHealthy={backendHealthy}
        pendingReviewsCount={pendingReviewsCount}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingBottom: 60 }}>
        {currentTab === 'dashboard' && (
          <StudentDashboard
            student={currentStudent}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'diagnostic' && (
          <DiagnosticQuiz
            student={currentStudent}
            onNavigate={(tab) => setCurrentTab(tab)}
            onQuizCompleted={refreshPendingCount}
          />
        )}

        {currentTab === 'adaptive' && (
          <AdaptivePractice
            student={currentStudent}
            onNavigate={(tab) => setCurrentTab(tab)}
            onQuizCompleted={refreshPendingCount}
          />
        )}

        {currentTab === 'coding' && (
          <CodingAssessment
            student={currentStudent}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'teacher' && (
          <TeacherDashboard />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(9, 13, 22, 0.95)',
        padding: '20px 24px',
        textAlign: 'center',
        fontSize: '0.82rem',
        color: 'var(--text-dim)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <strong>OP-02 Adaptive Learning & Assessment Portal</strong> • Fast, Fair & Evidence-Driven Verification
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <span>Backend: FastAPI + SQLite</span>
            <span>Frontend: React + Vite + TypeScript</span>
            <span>Runner: Isolated Sandboxed Subprocess</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
