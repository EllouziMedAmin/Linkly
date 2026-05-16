-- ==============================================================================
-- EcoLink AI V2 Schema
-- Run this in the Supabase SQL Editor
-- WARNING: This will drop the old tables from the previous hackathon version
-- to ensure a completely clean slate for the V2 build.
-- ==============================================================================

-- 1. Clean Slate (Drop old tables if they exist)
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS mentors CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS form_fields CASCADE;
DROP TABLE IF EXISTS programmes CASCADE;

-- Also drop old V1/V3 tables just in case they are cluttering your DB
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS linkages CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. Create New Tables

-- Programmes
create table programmes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  category text, -- hackathon | accelerator | competition | grant | custom
  organizer_id uuid references auth.users(id),
  selection_type text default 'ai_selected', -- fcfs | ai_selected
  max_participants int,
  deadline timestamptz,
  start_date timestamptz,
  end_date timestamptz,
  cover_image_url text,
  needs_matching boolean default true,
  match_criteria jsonb,
  status text default 'draft', -- draft | open | closed | active
  created_at timestamptz default now()
);

-- Form fields (per programme)
create table form_fields (
  id uuid default gen_random_uuid() primary key,
  programme_id uuid references programmes(id) on delete cascade,
  field_type text, -- text | textarea | select | file | url | checkbox | number
  label text,
  required boolean default false,
  options jsonb, -- for select/dropdown fields
  eligibility_rule text,
  field_order int
);

-- Participants
create table participants (
  id uuid default gen_random_uuid() primary key,
  programme_id uuid references programmes(id) on delete cascade,
  user_id uuid references auth.users(id),
  name text,
  email text,
  profile_type text, -- startup | individual | team
  form_answers jsonb,
  ai_summary text,
  ai_tags jsonb,
  ai_score int,
  status text default 'pending', -- pending | accepted | rejected
  applied_at timestamptz default now()
);

-- Mentors
create table mentors (
  id uuid default gen_random_uuid() primary key,
  programme_id uuid references programmes(id) on delete cascade,
  user_id uuid references auth.users(id),
  name text,
  email text,
  bio text,
  expertise_tags jsonb,
  availability text,
  invited_at timestamptz default now()
);

-- Matches
create table matches (
  id uuid default gen_random_uuid() primary key,
  programme_id uuid references programmes(id) on delete cascade,
  participant_id uuid references participants(id),
  mentor_id uuid references mentors(id),
  match_score int,
  match_reason text,
  status text default 'suggested', -- suggested | confirmed | swapped
  created_at timestamptz default now()
);

-- Sessions
create table sessions (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references matches(id) on delete cascade,
  logged_by uuid references auth.users(id),
  session_date timestamptz,
  duration_minutes int,
  notes text,
  rating int check (rating between 1 and 5),
  created_at timestamptz default now()
);

-- Disable Row Level Security (RLS) for the hackathon to avoid 403 Forbidden errors when querying
-- (If you want to secure it later, you would enable it and write policies, but for demo day, disabled is safer)
ALTER TABLE programmes DISABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields DISABLE ROW LEVEL SECURITY;
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE mentors DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;

-- Reload schema cache for the API
NOTIFY pgrst, 'reload schema';
