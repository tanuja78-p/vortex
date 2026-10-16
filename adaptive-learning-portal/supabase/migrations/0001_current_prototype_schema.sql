-- ============================================================
-- Adaptive Learning Portal
-- Migration: 0001_current_prototype_schema
-- Purpose: Reproduce the current Supabase prototype schema.
--
-- IMPORTANT:
-- - No passwords or service-role keys belong in this file.
-- - No real student PII belongs in this file.
-- - This migration contains schema definitions only.
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================

-- Generated from the current Supabase prototype database.

-- ============================================================
-- ENUM TYPES
-- ============================================================

create type public.attempt_status as enum ('in_progress', 'submitted', 'graded');

create type public.execution_status as enum (
  'queued',
  'running',
  'passed',
  'failed',
  'timeout',
  'memory_limit',
  'runtime_error',
  'sandbox_error'
);

create type public.integrity_severity as enum (
  'low',
  'medium',
  'high'
);

create type public.question_type as enum (
  'coding'
);

create type public.user_role as enum (
  'student',
  'trainer'
);


-- ============================================================
-- TABLES
-- ============================================================

create table public.attempts (id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  question_id uuid not null,
  status attempt_status not null default 'in_progress'::attempt_status,
  started_at timestamp with time zone not null default now(),
  submitted_at timestamp with time zone,
  is_correct boolean,
  test_score numeric(5,2),
  diagnosis text,
  diagnosis_reason text,
  created_at timestamp with time zone not null default now());

create table public.code_submissions (id uuid not null default gen_random_uuid(),
  attempt_id uuid not null,
  language text not null default 'python'::text,
  code text not null,
  execution_status execution_status not null default 'queued'::execution_status,
  tests_passed integer not null default 0,
  tests_total integer not null default 0,
  execution_time_ms integer,
  submitted_at timestamp with time zone not null default now());

create table public.concept_prerequisites (concept_id uuid not null,
  prerequisite_id uuid not null);

create table public.concepts (id uuid not null default gen_random_uuid(),
  course_id uuid not null,
  name text not null,
  slug text not null,
  description text,
  difficulty integer not null default 1,
  created_at timestamp with time zone not null default now());

create table public.courses (id uuid not null default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamp with time zone not null default now());

create table public.explanation_scores (id uuid not null default gen_random_uuid(),
  explanation_id uuid not null,
  score numeric(5,2) not null,
  max_score numeric(5,2) not null default 100,
  reason text,
  model_name text,
  created_at timestamp with time zone not null default now());

create table public.explanations (id uuid not null default gen_random_uuid(),
  attempt_id uuid not null,
  question_number integer not null,
  question text not null,
  student_answer text,
  created_at timestamp with time zone not null default now());

create table public.integrity_flags (id uuid not null default gen_random_uuid(),
  attempt_id uuid not null,
  event_id uuid,
  flag_type text not null,
  severity integrity_severity not null default 'low'::integrity_severity,
  description text,
  status text not null default 'needs_review'::text,
  trainer_note text,
  created_at timestamp with time zone not null default now());

create table public.mastery_updates (id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  concept_id uuid not null,
  attempt_id uuid,
  old_mastery numeric(5,4),
  correctness_evidence numeric(5,4),
  explanation_evidence numeric(5,4),
  new_mastery numeric(5,4),
  reason text,
  created_at timestamp with time zone not null default now());

create table public.profiles (id uuid not null,
  full_name text,
  role user_role not null default 'student'::user_role,
  created_at timestamp with time zone not null default now());

create table public.question_concepts (question_id uuid not null,
  concept_id uuid not null);

create table public.question_solutions (question_id uuid not null,
  solution_code text not null,
  created_at timestamp with time zone not null default now());

create table public.questions (id uuid not null default gen_random_uuid(),
  course_id uuid not null,
  title text not null,
  prompt text not null,
  question_type question_type not null default 'coding'::question_type,
  difficulty integer not null default 1,
  language text not null default 'python'::text,
  starter_code text,
  active boolean not null default true,
  created_at timestamp with time zone not null default now());

create table public.recommendations (id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  question_id uuid,
  concept_id uuid,
  reason_code text,
  reason text,
  priority integer not null default 1,
  created_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone);

create table public.session_events (id uuid not null default gen_random_uuid(),
  attempt_id uuid not null,
  sequence_number integer not null,
  event_type text not null,
  client_timestamp timestamp with time zone,
  server_timestamp timestamp with time zone not null default now(),
  payload jsonb not null default '{}'::jsonb);

create table public.student_mastery (student_id uuid not null,
  concept_id uuid not null,
  mastery_probability numeric(5,4) not null default 0.2000,
  confidence numeric(5,4) not null default 0.1000,
  attempt_count integer not null default 0,
  last_updated timestamp with time zone not null default now());

create table public.test_cases (id uuid not null default gen_random_uuid(),
  question_id uuid not null,
  input_data jsonb,
  expected_output jsonb,
  is_hidden boolean not null default true,
  time_limit_ms integer not null default 3000,
  memory_limit_mb integer not null default 128,
  created_at timestamp with time zone not null default now());

alter table public.attempts add constraint attempts_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;

alter table public.attempts add constraint attempts_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.attempts add constraint attempts_pkey PRIMARY KEY (id);

alter table public.code_submissions add constraint code_submissions_tests_passed_check CHECK ((tests_passed >= 0));

alter table public.code_submissions add constraint code_submissions_tests_total_check CHECK ((tests_total >= 0));

alter table public.code_submissions add constraint code_submissions_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE;

alter table public.code_submissions add constraint code_submissions_pkey PRIMARY KEY (id);

alter table public.concept_prerequisites add constraint concept_prerequisites_check CHECK ((concept_id <> prerequisite_id));

alter table public.concept_prerequisites add constraint concept_prerequisites_concept_id_fkey FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE;

alter table public.concept_prerequisites add constraint concept_prerequisites_prerequisite_id_fkey FOREIGN KEY (prerequisite_id) REFERENCES concepts(id) ON DELETE CASCADE;

alter table public.concept_prerequisites add constraint concept_prerequisites_pkey PRIMARY KEY (concept_id, prerequisite_id);

alter table public.concepts add constraint concepts_difficulty_check CHECK (((difficulty >= 1) AND (difficulty <= 5)));

alter table public.concepts add constraint concepts_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

alter table public.concepts add constraint concepts_pkey PRIMARY KEY (id);

alter table public.concepts add constraint concepts_course_id_slug_key UNIQUE (course_id, slug);

alter table public.courses add constraint courses_pkey PRIMARY KEY (id);

alter table public.explanation_scores add constraint explanation_scores_max_score_check CHECK ((max_score > (0)::numeric));

alter table public.explanation_scores add constraint explanation_scores_score_check CHECK ((score >= (0)::numeric));

alter table public.explanation_scores add constraint explanation_scores_explanation_id_fkey FOREIGN KEY (explanation_id) REFERENCES explanations(id) ON DELETE CASCADE;

alter table public.explanation_scores add constraint explanation_scores_pkey PRIMARY KEY (id);

alter table public.explanations add constraint explanations_question_number_check CHECK (((question_number >= 1) AND (question_number <= 5)));

alter table public.explanations add constraint explanations_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE;

alter table public.explanations add constraint explanations_pkey PRIMARY KEY (id);

alter table public.integrity_flags add constraint integrity_flags_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE;

alter table public.integrity_flags add constraint integrity_flags_event_id_fkey FOREIGN KEY (event_id) REFERENCES session_events(id) ON DELETE SET NULL;

alter table public.integrity_flags add constraint integrity_flags_pkey PRIMARY KEY (id);

alter table public.mastery_updates add constraint mastery_updates_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE SET NULL;

alter table public.mastery_updates add constraint mastery_updates_concept_id_fkey FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE;

alter table public.mastery_updates add constraint mastery_updates_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.mastery_updates add constraint mastery_updates_pkey PRIMARY KEY (id);

alter table public.profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.profiles add constraint profiles_pkey PRIMARY KEY (id);

alter table public.question_concepts add constraint question_concepts_concept_id_fkey FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE;

alter table public.question_concepts add constraint question_concepts_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;

alter table public.question_concepts add constraint question_concepts_pkey PRIMARY KEY (question_id, concept_id);

alter table public.question_solutions add constraint question_solutions_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;

alter table public.question_solutions add constraint question_solutions_pkey PRIMARY KEY (question_id);

alter table public.questions add constraint questions_difficulty_check CHECK (((difficulty >= 1) AND (difficulty <= 5)));

alter table public.questions add constraint questions_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

alter table public.questions add constraint questions_pkey PRIMARY KEY (id);

alter table public.recommendations add constraint recommendations_concept_id_fkey FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE SET NULL;

alter table public.recommendations add constraint recommendations_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE SET NULL;

alter table public.recommendations add constraint recommendations_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.recommendations add constraint recommendations_pkey PRIMARY KEY (id);

alter table public.session_events add constraint session_events_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE;

alter table public.session_events add constraint session_events_pkey PRIMARY KEY (id);

alter table public.session_events add constraint session_events_attempt_id_sequence_number_key UNIQUE (attempt_id, sequence_number);

alter table public.student_mastery add constraint student_mastery_attempt_count_check CHECK ((attempt_count >= 0));

alter table public.student_mastery add constraint student_mastery_confidence_check CHECK (((confidence >= (0)::numeric) AND (confidence <= (1)::numeric)));

alter table public.student_mastery add constraint student_mastery_mastery_probability_check CHECK (((mastery_probability >= (0)::numeric) AND (mastery_probability <= (1)::numeric)));

alter table public.student_mastery add constraint student_mastery_concept_id_fkey FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE;

alter table public.student_mastery add constraint student_mastery_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.student_mastery add constraint student_mastery_pkey PRIMARY KEY (student_id, concept_id);

alter table public.test_cases add constraint test_cases_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;

alter table public.test_cases add constraint test_cases_pkey PRIMARY KEY (id);

CREATE INDEX idx_attempts_question ON public.attempts USING btree (question_id);

CREATE INDEX idx_attempts_student ON public.attempts USING btree (student_id);

CREATE INDEX idx_submissions_attempt ON public.code_submissions USING btree (attempt_id);

CREATE INDEX idx_concepts_course ON public.concepts USING btree (course_id);

CREATE INDEX idx_explanations_attempt ON public.explanations USING btree (attempt_id);

CREATE INDEX idx_integrity_flags_attempt ON public.integrity_flags USING btree (attempt_id);

CREATE INDEX idx_mastery_updates_student ON public.mastery_updates USING btree (student_id);

CREATE INDEX idx_question_concepts_concept ON public.question_concepts USING btree (concept_id);

CREATE INDEX idx_questions_course ON public.questions USING btree (course_id);

CREATE INDEX idx_recommendations_student ON public.recommendations USING btree (student_id);

CREATE INDEX idx_session_events_attempt ON public.session_events USING btree (attempt_id);

CREATE INDEX idx_mastery_concept ON public.student_mastery USING btree (concept_id);

CREATE INDEX idx_mastery_student ON public.student_mastery USING btree (student_id);

CREATE INDEX idx_test_cases_question ON public.test_cases USING btree (question_id);

alter table public.attempts enable row level security;

alter table public.code_submissions enable row level security;

alter table public.concept_prerequisites enable row level security;

alter table public.concepts enable row level security;

alter table public.courses enable row level security;

alter table public.explanation_scores enable row level security;

alter table public.explanations enable row level security;

alter table public.integrity_flags enable row level security;

alter table public.mastery_updates enable row level security;

alter table public.profiles enable row level security;

alter table public.question_concepts enable row level security;

alter table public.question_solutions enable row level security;

alter table public.questions enable row level security;

alter table public.recommendations enable row level security;

alter table public.session_events enable row level security;

alter table public.student_mastery enable row level security;

alter table public.test_cases enable row level security;

create policy "Students can create own attempts" on public.attempts as permissive for insert to authenticated with check ((student_id = ( SELECT auth.uid() AS uid)));

create policy "Students can read own attempts" on public.attempts as permissive for select to authenticated using ((student_id = ( SELECT auth.uid() AS uid)));

create policy "Students can update own attempts" on public.attempts as permissive for update to authenticated using ((student_id = ( SELECT auth.uid() AS uid))) with check ((student_id = ( SELECT auth.uid() AS uid)));

create policy "Students can create submissions for own attempts" on public.code_submissions as permissive for insert to authenticated with check ((EXISTS ( SELECT 1
   FROM attempts a
  WHERE ((a.id = code_submissions.attempt_id) AND (a.student_id = ( SELECT auth.uid() AS uid))))));

create policy "Students can read own submissions" on public.code_submissions as permissive for select to authenticated using ((EXISTS ( SELECT 1
   FROM attempts a
  WHERE ((a.id = code_submissions.attempt_id) AND (a.student_id = ( SELECT auth.uid() AS uid))))));

create policy "Authenticated users can read prerequisites" on public.concept_prerequisites as permissive for select to authenticated using (true);

create policy "Authenticated users can read concepts" on public.concepts as permissive for select to authenticated using (true);

create policy "Authenticated users can read courses" on public.courses as permissive for select to authenticated using (true);

create policy "Students can read own explanation scores" on public.explanation_scores as permissive for select to authenticated using ((EXISTS ( SELECT 1
   FROM (explanations e
     JOIN attempts a ON ((a.id = e.attempt_id)))
  WHERE ((e.id = explanation_scores.explanation_id) AND (a.student_id = ( SELECT auth.uid() AS uid))))));

create policy "Students can create own explanations" on public.explanations as permissive for insert to authenticated with check ((EXISTS ( SELECT 1
   FROM attempts a
  WHERE ((a.id = explanations.attempt_id) AND (a.student_id = ( SELECT auth.uid() AS uid))))));

create policy "Students can read own explanations" on public.explanations as permissive for select to authenticated using ((EXISTS ( SELECT 1
   FROM attempts a
  WHERE ((a.id = explanations.attempt_id) AND (a.student_id = ( SELECT auth.uid() AS uid))))));

create policy "Students can read own integrity flags" on public.integrity_flags as permissive for select to authenticated using ((EXISTS ( SELECT 1
   FROM attempts a
  WHERE ((a.id = integrity_flags.attempt_id) AND (a.student_id = ( SELECT auth.uid() AS uid))))));

create policy "Students can read own mastery history" on public.mastery_updates as permissive for select to authenticated using ((student_id = ( SELECT auth.uid() AS uid)));

create policy "Users can read own profile" on public.profiles as permissive for select to authenticated using ((id = ( SELECT auth.uid() AS uid)));

create policy "Authenticated users can read question concepts" on public.question_concepts as permissive for select to authenticated using (true);

create policy "Authenticated users can read active questions" on public.questions as permissive for select to authenticated using ((active = true));

create policy "Students can read own recommendations" on public.recommendations as permissive for select to authenticated using ((student_id = ( SELECT auth.uid() AS uid)));

create policy "Students can create own session events" on public.session_events as permissive for insert to authenticated with check ((EXISTS ( SELECT 1
   FROM attempts a
  WHERE ((a.id = session_events.attempt_id) AND (a.student_id = ( SELECT auth.uid() AS uid))))));

create policy "Students can read own session events" on public.session_events as permissive for select to authenticated using ((EXISTS ( SELECT 1
   FROM attempts a
  WHERE ((a.id = session_events.attempt_id) AND (a.student_id = ( SELECT auth.uid() AS uid))))));

create policy "Students can read own mastery" on public.student_mastery as permissive for select to authenticated using ((student_id = ( SELECT auth.uid() AS uid)));