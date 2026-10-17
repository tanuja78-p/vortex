import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { PageSkeleton } from '@/components/ui/states'

const StudentDashboardPage = lazy(() => import('@/pages/student-dashboard').then((m) => ({ default: m.StudentDashboardPage })))
const DiagnosticQuizPage = lazy(() => import('@/pages/diagnostic-quiz').then((m) => ({ default: m.DiagnosticQuizPage })))
const AdaptivePracticePage = lazy(() => import('@/pages/adaptive-practice').then((m) => ({ default: m.AdaptivePracticePage })))
const CodingAssessmentPage = lazy(() => import('@/pages/coding-assessment').then((m) => ({ default: m.CodingAssessmentPage })))
const VivaAssessmentPage = lazy(() => import('@/pages/viva-assessment').then((m) => ({ default: m.VivaAssessmentPage })))
const TeacherDashboardPage = lazy(() => import('@/pages/teacher-dashboard').then((m) => ({ default: m.TeacherDashboardPage })))
const AdaptivePathsDemoPage = lazy(() => import('@/pages/adaptive-paths-demo').then((m) => ({ default: m.AdaptivePathsDemoPage })))
const SandboxSecurityReportPage = lazy(() => import('@/pages/sandbox-security-report').then((m) => ({ default: m.SandboxSecurityReportPage })))
const NotFoundPage = lazy(() => import('@/pages/not-found').then((m) => ({ default: m.NotFoundPage })))

const page = (node: React.ReactNode) => <Suspense fallback={<PageSkeleton />}>{node}</Suspense>

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={page(<StudentDashboardPage />)} />
          <Route path="diagnostic" element={page(<DiagnosticQuizPage />)} />
          <Route path="practice" element={page(<AdaptivePracticePage />)} />
          <Route path="adaptive-paths" element={page(<AdaptivePathsDemoPage />)} />
          <Route path="coding" element={page(<CodingAssessmentPage />)} />
          <Route path="sandbox-security" element={page(<SandboxSecurityReportPage />)} />
          <Route path="viva" element={page(<VivaAssessmentPage />)} />
          <Route path="teacher" element={page(<TeacherDashboardPage />)} />
          <Route path="*" element={page(<NotFoundPage />)} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
