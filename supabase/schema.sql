-- TeamPulse schema
-- Run this in the Supabase SQL editor to set up your database

create extension if not exists "pgcrypto";

-- Sessions table
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  max_participants int not null default 25,
  status text not null default 'open' check (status in ('open', 'closed'))
);

-- Submissions table (one row per participant per session)
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  submitted_at timestamptz not null default now()
);

-- Answers table (10 rows per submission)
create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  question_index int not null check (question_index >= 0 and question_index <= 9),
  score int not null check (score >= 1 and score <= 10),
  comment text,
  unique (submission_id, question_index)
);

-- Indexes
create index if not exists submissions_session_id_idx on submissions(session_id);
create index if not exists answers_submission_id_idx on answers(submission_id);

-- Enable realtime for submissions (so the dashboard updates live)
alter publication supabase_realtime add table submissions;
alter publication supabase_realtime add table sessions;

-- Row Level Security
alter table sessions enable row level security;
alter table submissions enable row level security;
alter table answers enable row level security;

-- Allow anonymous reads on sessions (participants need to look up by code)
create policy "public can read sessions"
  on sessions for select
  using (true);

-- Allow anonymous inserts on submissions (participants submit)
create policy "public can insert submissions"
  on submissions for insert
  with check (true);

-- Allow anonymous reads on submissions count (dashboard polling fallback)
create policy "public can read submissions"
  on submissions for select
  using (true);

-- Allow anonymous inserts on answers
create policy "public can insert answers"
  on answers for insert
  with check (true);

-- Allow anonymous reads on answers
create policy "public can read answers"
  on answers for select
  using (true);

-- Sessions can be inserted and updated via service role (API routes use anon key, so we allow all for simplicity)
create policy "public can insert sessions"
  on sessions for insert
  with check (true);

create policy "public can update sessions"
  on sessions for update
  using (true);
