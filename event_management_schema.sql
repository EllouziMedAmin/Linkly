-- ==============================================================================
-- El-Rojla-Bwai V5: Full Event Management System
-- Run this AFTER applications_schema.sql in the Supabase SQL Editor
-- ==============================================================================

-- 1. Extend programmes table with event metadata
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS event_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS location VARCHAR(500) DEFAULT '';
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS cover_image_url TEXT DEFAULT '';

-- 2. Email Templates (per event, per trigger)
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    programme_id UUID REFERENCES programmes(id) ON DELETE CASCADE,
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('received','accepted','rejected','waitlisted','reminder','custom')),
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(programme_id, trigger_type)
);

-- 3. Email Send Log (audit trail for all outgoing emails)
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    programme_id UUID REFERENCES programmes(id) ON DELETE SET NULL,
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'sent',
    preview_url TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for hackathon speed
ALTER TABLE email_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;

-- Enable realtime for templates
ALTER PUBLICATION supabase_realtime ADD TABLE email_templates;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
