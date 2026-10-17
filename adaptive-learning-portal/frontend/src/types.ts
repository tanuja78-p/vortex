export type MasteryState = 'Solid' | 'Needs Practice' | 'Not Understood' | 'Not Assessed';

export interface ConceptMastery {
  concept_id: string;
  concept_name: string;
  category: string;
  score: number;
  state: MasteryState;
  attempts_count: number;
  correct_count: number;
  last_assessed_at: string | null;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface StudentDetail extends Student {
  overall_mastery: number;
  accuracy_percentage: number;
  total_attempts: number;
  weak_concepts: string[];
  mastery_breakdown: ConceptMastery[];
}

export interface Concept {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  prerequisites: string[];
  description: string;
  state: MasteryState;
  score: number;
}

export interface QuizQuestion {
  id: string;
  concept_id: string;
  concept_name: string;
  title: string;
  prompt: string;
  code_snippet: string;
  options: string[];
  difficulty: string;
  question_type: string;
  selection_reason?: string;
  target_concept_state?: MasteryState;
  target_concept_score?: number;
  strategy?: string;
}

export interface AdaptiveQuestionItem {
  question: QuizQuestion;
  selection_reason: string;
  target_concept_id: string;
  target_concept_name: string;
  target_concept_state: MasteryState;
  target_concept_score: number;
  strategy: string;
}

export interface StudentAdaptivePath {
  student_id: string;
  student_name: string;
  avatar: string;
  overall_mastery: number;
  status_summary: string;
  path: AdaptiveQuestionItem[];
}

export interface AdaptiveComparisonResponse {
  module_name: string;
  student_a: StudentAdaptivePath;
  student_b: StudentAdaptivePath;
  divergence_percentage: number;
  executive_summary: string;
}


export interface QuestionResult {
  question_id: string;
  concept_id: string;
  concept_name: string;
  selected_index: number;
  correct_index: number;
  is_correct: bool_or_boolean;
  explanation: string;
}

type bool_or_boolean = boolean;

export interface QuizSubmitResponse {
  attempt_id: number;
  score_percentage: number;
  total_questions: number;
  correct_answers: number;
  results: QuestionResult[];
  updated_mastery: ConceptMastery[];
  weak_concepts: string[];
  recommended_focus: string;
}

export interface VisibleTestCase {
  id: number;
  input: string;
  expected: string;
  description: string;
}

export interface CodingProblemSummary {
  id: string;
  concept_id: string;
  concept_name: string;
  title: string;
  difficulty: string;
  description: string;
  tags: string[];
}

export interface CodingProblemDetail extends CodingProblemSummary {
  initial_code: string;
  function_name: string;
  visible_test_cases: VisibleTestCase[];
}

export interface TestRunResult {
  test_id: number;
  is_hidden: boolean;
  passed: boolean;
  input_repr: string | null;
  expected_repr: string | null;
  actual_repr: string | null;
  error: string | null;
}

export interface CodeSubmitResponse {
  submission_id: number;
  status: 'Accepted' | 'Failed' | 'Error' | 'Timed Out' | 'Security Error';
  tests_passed: number;
  total_tests: number;
  runtime_ms: number;
  test_results: TestRunResult[];
  execution_engine_notice: string;
  has_evidence_flag: boolean;
  flag_reason: string | null;
  eligible_for_viva: boolean;
}

export interface SubmissionHistoryItem {
  id: number;
  problem_id: string;
  problem_title: string;
  status: string;
  tests_passed: number;
  total_tests: number;
  runtime_ms: number;
  submitted_at: string;
  has_evidence_flag: boolean;
  flag_reason: string;
}

export interface VivaQuestion {
  id: string;
  prompt: string;
  category: 'logic' | 'complexity' | 'edge_cases';
}

export interface VivaSessionResponse {
  session_id: number;
  submission_id: number;
  problem_id: string;
  problem_title: string;
  student_code: string;
  questions: VivaQuestion[];
  is_evaluated: boolean;
}

export interface RubricCategoryScore {
  score: number;
  max: number;
  feedback: string;
}

export interface VivaEvaluationResponse {
  session_id: number;
  viva_score: number;
  rating: 'Exemplary' | 'Competent' | 'Developing' | 'Needs Review';
  summary_feedback: string;
  rubric_scores: {
    logic: RubricCategoryScore;
    complexity: RubricCategoryScore;
    edge_cases: RubricCategoryScore;
  };
  follow_up_recommended: boolean;
  discrepancy_flagged: boolean;
}

export interface ReviewItem {
  id: number;
  student_id: string;
  student_name: string;
  problem_title: string;
  submission_id: number | null;
  viva_session_id: number | null;
  flag_type: string;
  severity: 'Low' | 'Medium' | 'High';
  evidence_details: Record<string, any>;
  status: 'Pending Review' | 'Verified Legitimate' | 'Requires Follow-up' | 'Suspected Plagiarism' | 'Dismissed';
  teacher_notes: string;
  reviewer_name: string;
  flagged_at: string;
  reviewed_at: string | null;
  student_code: string | null;
  viva_responses: Array<{ question_id: string; response_text: string }> | null;
}

export interface TeacherOverview {
  total_students: number;
  total_concepts: number;
  total_submissions: number;
  pending_human_reviews: number;
  mastery_state_distribution: Record<MasteryState, number>;
  concept_analytics: Array<{
    id: string;
    name: string;
    category: string;
    difficulty: string;
    avg_score_pct: number;
    assessed_students_count: number;
  }>;
}

export interface SecurityEventItem {
  id: number;
  student_id: string;
  student_name: string;
  problem_id: string | null;
  problem_title: string | null;
  event_type: string;
  description: string;
  payload: Record<string, any>;
  containment_action: string;
  occurred_at: string;
}

export interface SandboxSecurityReport {
  total_contained_threats: number;
  network_attempts_blocked: number;
  infinite_loops_terminated: number;
  filesystem_escapes_blocked: number;
  sandbox_status: string;
  architecture_overview: string;
  recent_events: SecurityEventItem[];
}

