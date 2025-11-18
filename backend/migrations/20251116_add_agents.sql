-- Add agents table for individual crew members
-- Migration: 20251116_add_agents
-- Description: Creates agents table to store individual agents within crews

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    specialist_type VARCHAR(100),
    backstory TEXT,
    goal TEXT,
    llm_config JSONB,
    tools_list TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on crew_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_agents_crew_id ON agents(crew_id);

-- Create index on role for filtering
CREATE INDEX IF NOT EXISTS idx_agents_role ON agents(role);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agents_updated_at_trigger
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_agents_updated_at();

-- Add comment to table
COMMENT ON TABLE agents IS 'Individual agents within crews - each crew has 7 agents (1 orchestrator + 6 specialists)';
COMMENT ON COLUMN agents.id IS 'Unique agent identifier';
COMMENT ON COLUMN agents.crew_id IS 'Foreign key to parent crew';
COMMENT ON COLUMN agents.role IS 'Agent role (orchestrator, engineer, analyst, etc.)';
COMMENT ON COLUMN agents.name IS 'Display name for the agent';
COMMENT ON COLUMN agents.description IS 'Short description of agent capabilities';
COMMENT ON COLUMN agents.specialist_type IS 'Specific specialization (e.g., backend_architect, ml_engineer)';
COMMENT ON COLUMN agents.backstory IS 'Agent backstory for CrewAI personality';
COMMENT ON COLUMN agents.goal IS 'Agent goal/objective';
COMMENT ON COLUMN agents.llm_config IS 'LLM configuration (model, temperature, etc.)';
COMMENT ON COLUMN agents.tools_list IS 'Comma-separated list of tool names available to agent';
