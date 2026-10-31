-- Migration: Create votes table for Kahim/Wakahim Voting System 2026

CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voter_id UUID NOT NULL,
    voter_nim VARCHAR(20) NOT NULL,
    votes JSONB NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on voter_id and voter_nim for quick lookup
CREATE INDEX IF NOT EXISTS idx_votes_voter_id ON votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_nim ON votes(voter_nim);

-- Enable Row Level Security (RLS)
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Allow public / anon to read all votes (needed by voting dashboard & calculation)
DROP POLICY IF EXISTS "Allow public select votes" ON votes;
CREATE POLICY "Allow public select votes" ON votes
    FOR SELECT USING (true);

-- Allow authenticated / anon to submit votes
DROP POLICY IF EXISTS "Allow public insert votes" ON votes;
CREATE POLICY "Allow public insert votes" ON votes
    FOR INSERT WITH CHECK (true);

-- Allow reset / delete
DROP POLICY IF EXISTS "Allow delete votes" ON votes;
CREATE POLICY "Allow delete votes" ON votes
    FOR DELETE USING (true);
