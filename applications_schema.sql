-- ==============================================================================
-- El-Rojla-Bwai V4: Applications System
-- Run this AFTER supabase_schema.sql in the Supabase SQL Editor
-- ==============================================================================

-- 1. Add capacity and requirements to programmes
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 100;
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS requirements TEXT DEFAULT '';
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS approval_mode VARCHAR(50) DEFAULT 'auto';
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]'::jsonb;

-- 2. Applications Table (Public-facing applications)
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    programme_id UUID REFERENCES programmes(id) ON DELETE CASCADE,

    -- Applicant Info
    team_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    team_size INT DEFAULT 1,
    linkedin_url VARCHAR(500) DEFAULT '',
    founder_experience TEXT DEFAULT '',
    pitch_text TEXT NOT NULL,

    -- AI Evaluation (filled by Gemini)
    ai_score FLOAT DEFAULT 0,              -- 0-100 overall quality score
    ai_reasoning TEXT DEFAULT '',            -- Why this score
    friction_score INT DEFAULT 5,            -- 1-10 chaos level
    ai_tags JSONB DEFAULT '[]'::jsonb,       -- e.g. ["FinTech", "AI", "Hardware"]

    -- Dynamic Form Responses
    custom_responses JSONB DEFAULT '{}'::jsonb,

    -- Decision
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'waitlisted')),
    reviewed_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent duplicate applications per email per programme
    UNIQUE(contact_email, programme_id)
);

-- Enable Realtime for applications
ALTER PUBLICATION supabase_realtime ADD TABLE applications;

-- Disable RLS for hackathon speed
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;

-- VERY IMPORTANT: Force the API cache to reload so it sees the new columns instantly!
NOTIFY pgrst, 'reload schema';
