-- ==============================================================================
-- Hackathon Bypass: Disable Row Level Security (RLS) for MVP Demo
-- Run this in the Supabase SQL Editor to allow our Next.js App and Scripts
-- to freely read/write data without complex authentication policies.
-- ==============================================================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE programmes DISABLE ROW LEVEL SECURITY;
ALTER TABLE linkages DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- If your project requires RLS to be enabled, use these policies instead:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read/write" ON profiles FOR ALL USING (true) WITH CHECK (true);
-- (Repeat for other tables)
