import useSWR from 'swr'
import {
  getCodingProblem,
  getDiagnosticQuestions,
  getPracticeQuestions,
  getStudentDashboard,
  getTeacherDashboard,
  getVivaQuestions,
} from '@/services/api'

const options = { revalidateOnFocus: false }

export const useStudentDashboard = () => useSWR('student-dashboard', getStudentDashboard, options)
export const useDiagnosticQuestions = () => useSWR('diagnostic-questions', getDiagnosticQuestions, options)
export const usePracticeQuestions = (conceptId: string) =>
  useSWR(['practice-questions', conceptId], () => getPracticeQuestions(conceptId), options)
export const useCodingProblem = () => useSWR('coding-problem', getCodingProblem, options)
export const useVivaQuestions = () => useSWR('viva-questions', getVivaQuestions, options)
export const useTeacherDashboard = () => useSWR('teacher-dashboard', getTeacherDashboard, options)
