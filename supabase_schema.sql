-- ==============================================================================
-- El-Rojla-Bwai Supabase Schema (V3 Dense Architecture)
-- Run this in the Supabase SQL Editor
-- ==============================================================================

-- 1. Profiles Table (Startups, Mentors, Partners)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(50) NOT NULL CHECK (role IN ('company', 'mentor', 'partner', 'admin')),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    -- Friction Capacity: Mentors = max friction they can handle; Companies = their friction score
    friction_capacity INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Programmes Table (e.g., "KL Cleantech Accelerator")
CREATE TABLE IF NOT EXISTS programmes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Linkages Table (The First-Class Programmable Entity)
CREATE TABLE IF NOT EXISTS linkages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    programme_id UUID REFERENCES programmes(id) ON DELETE CASCADE,
    
    -- The two connected entities
    entity_a_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Usually the Company
    entity_b_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Usually the Mentor
    
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'flagged', 'completed', 'failed')),
    
    -- The mathematical cost this linkage imposes on a mentor's overall capacity
    friction_allocation INT DEFAULT 0,
    
    -- Multi-dimensional representation of 8 behavioral signals (JSON vector)
    dna_fingerprint JSONB DEFAULT '{}'::jsonb,
    
    -- Real-time assessment of relationship stability (0-100)
    health_score FLOAT DEFAULT 100.0,
    
    -- Final outcome rating at completion (0-100)
    success_score FLOAT,
    
    -- Autonomous flag to pause Cradle fund disbursements if health plummets
    grant_lock_status BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Messages Table (For real-time Supabase Chat)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    linkage_id UUID REFERENCES linkages(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Turn on Realtime for Messages and Linkages so the Dashboard updates live
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE linkages;
