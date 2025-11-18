-- Initial crews table creation
-- This migration must run BEFORE 20251109_add_auth_org.sql

CREATE TABLE IF NOT EXISTS crews (
    id UUID PRIMARY KEY,
    owner_id VARCHAR NOT NULL DEFAULT 'demo',
    name VARCHAR NOT NULL,
    role VARCHAR NOT NULL DEFAULT 'orchestrated_team',
    recipe_json JSONB DEFAULT '{}'::jsonb,
    base_crew_id UUID REFERENCES crews(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    kv_namespace VARCHAR NOT NULL,
    vector_collection VARCHAR NOT NULL,
    models_json JSONB DEFAULT '{}'::jsonb,
    tools_json JSONB DEFAULT '{}'::jsonb,
    env_json JSONB DEFAULT '{}'::jsonb
);

-- Create index for public crews lookup
CREATE INDEX IF NOT EXISTS idx_crews_public ON crews(name, is_public) WHERE is_public = true;

-- Create index for owner lookup
CREATE INDEX IF NOT EXISTS idx_crews_owner ON crews(owner_id);
