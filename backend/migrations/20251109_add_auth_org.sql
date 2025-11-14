-- Add organization and API key support to crews
ALTER TABLE crews
    ADD COLUMN IF NOT EXISTS org_id VARCHAR NOT NULL DEFAULT 'default',
    ADD COLUMN IF NOT EXISTS api_key VARCHAR;

UPDATE crews SET org_id = COALESCE(org_id, 'default');

-- Recreate users table to align with new auth model
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    org_id VARCHAR NOT NULL DEFAULT 'default'
);
