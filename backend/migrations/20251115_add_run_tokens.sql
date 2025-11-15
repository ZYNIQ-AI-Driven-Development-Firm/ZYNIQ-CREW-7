-- Add total_tokens column to runs table
ALTER TABLE runs
    ADD COLUMN IF NOT EXISTS total_tokens INTEGER NOT NULL DEFAULT 0;
