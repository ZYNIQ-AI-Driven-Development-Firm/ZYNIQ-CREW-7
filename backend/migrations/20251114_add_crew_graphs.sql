-- Migration: Add crew_graphs table for XYFlow layout persistence
-- Date: 2025-11-14

CREATE TABLE IF NOT EXISTS crew_graphs (
    crew_id UUID PRIMARY KEY REFERENCES crews(id) ON DELETE CASCADE,
    org_id VARCHAR NOT NULL,
    layout_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_crew_graphs_org_id ON crew_graphs(org_id);
