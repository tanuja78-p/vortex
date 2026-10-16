\# Supabase Prototype Verification



\## Project



Adaptive Learning \& Assessment Portal



\## Repository



`tanuja78-p/vortex`



\## Database



Supabase PostgreSQL



\## Verification performed



The current prototype database has been inspected through the Supabase SQL Editor.



Verified areas include:



\- public tables

\- table columns and data types

\- primary/foreign-key constraints

\- Row Level Security status

\- existing RLS policies

\- concepts and prerequisites

\- questions and concept mappings

\- hidden test cases

\- student mastery

\- attempts

\- code submissions

\- explanations

\- explanation scores

\- mastery updates

\- session/replay events

\- integrity flags

\- adaptive recommendations



\## Security



RLS is enabled on the existing application tables.



Integrity signals are evidence for human review and are not automatic cheating verdicts.



Hidden coding tests must remain server-side.



Supabase service-role credentials must never be exposed to the frontend or committed to Git.



\## Migration note



The live prototype database was initially created through the Supabase SQL Editor.



The database schema is being versioned in this repository so that teammates working on the same repository can reproduce and understand the database structure.



\## Important



Inspection queries are not themselves database migrations.



Only schema-changing SQL belongs in `supabase/migrations/`.

