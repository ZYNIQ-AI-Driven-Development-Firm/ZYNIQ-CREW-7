-- Add crypto/Web3 infrastructure tables
-- Run: psql -U postgres -d crew7 -f migrations/20251115_add_crypto_tables.sql

-- User wallet addresses
CREATE TABLE IF NOT EXISTS user_wallets (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address VARCHAR(42) NOT NULL,
    chain VARCHAR(20) NOT NULL DEFAULT 'test',
    verified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id),
    CONSTRAINT valid_address CHECK (address ~* '^0x[a-fA-F0-9]{40}$')
);

CREATE INDEX idx_user_wallet_address ON user_wallets(address);

-- Off-chain token balances
CREATE TABLE IF NOT EXISTS token_balances (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_symbol VARCHAR(10) NOT NULL DEFAULT 'C7T',
    balance NUMERIC(20, 8) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, token_symbol),
    CONSTRAINT positive_balance CHECK (balance >= 0)
);

CREATE INDEX idx_token_balance_user_symbol ON token_balances(user_id, token_symbol);

-- Token transaction history
CREATE TABLE IF NOT EXISTS token_transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_symbol VARCHAR(10) NOT NULL DEFAULT 'C7T',
    amount NUMERIC(20, 8) NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('credit', 'debit')),
    reason VARCHAR(255) NOT NULL,
    balance_after NUMERIC(20, 8) NOT NULL,
    reference_id VARCHAR(100),
    reference_type VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_token_tx_user_created ON token_transactions(user_id, created_at DESC);
CREATE INDEX idx_token_tx_reference ON token_transactions(reference_type, reference_id);

-- Crew rental agreements
CREATE TABLE IF NOT EXISTS crew_rentals (
    id SERIAL PRIMARY KEY,
    crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
    renter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    price_c7t NUMERIC(20, 8) NOT NULL,
    start_time TIMESTAMP NOT NULL DEFAULT NOW(),
    end_time TIMESTAMP,
    duration_hours INTEGER,
    tx_reference VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'canceled')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rental_crew_status ON crew_rentals(crew_id, status);
CREATE INDEX idx_rental_renter ON crew_rentals(renter_user_id);

-- Crew portfolio and reputation
CREATE TABLE IF NOT EXISTS crew_portfolios (
    id SERIAL PRIMARY KEY,
    crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE UNIQUE,
    missions_completed INTEGER NOT NULL DEFAULT 0,
    hours_worked NUMERIC(10, 2) NOT NULL DEFAULT 0,
    rating_avg NUMERIC(3, 2),
    rating_count INTEGER NOT NULL DEFAULT 0,
    industries TEXT,
    total_earned_c7t NUMERIC(20, 8) NOT NULL DEFAULT 0,
    total_rented_count INTEGER NOT NULL DEFAULT 0,
    last_mission_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_rating CHECK (rating_avg IS NULL OR (rating_avg >= 1 AND rating_avg <= 5))
);

CREATE INDEX idx_portfolio_rating ON crew_portfolios(rating_avg DESC NULLS LAST);

-- Crew XP and leveling
CREATE TABLE IF NOT EXISTS crew_xp (
    id SERIAL PRIMARY KEY,
    crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE UNIQUE,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT positive_xp CHECK (xp >= 0),
    CONSTRAINT positive_level CHECK (level >= 1)
);

CREATE INDEX idx_crew_xp_level ON crew_xp(level DESC);

-- Individual crew ratings
CREATE TABLE IF NOT EXISTS crew_ratings (
    id SERIAL PRIMARY KEY,
    crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    run_id UUID REFERENCES runs(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rating_crew_user ON crew_ratings(crew_id, user_id);

-- Add pricing fields to crews table
ALTER TABLE crews 
ADD COLUMN IF NOT EXISTS base_price_c7t NUMERIC(20, 8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rental_price_c7t NUMERIC(20, 8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS for_sale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS for_rent BOOLEAN DEFAULT false;

-- Create function to automatically create portfolio and XP records
CREATE OR REPLACE FUNCTION create_crew_portfolio_and_xp()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO crew_portfolios (crew_id)
    VALUES (NEW.id)
    ON CONFLICT (crew_id) DO NOTHING;
    
    INSERT INTO crew_xp (crew_id)
    VALUES (NEW.id)
    ON CONFLICT (crew_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create portfolio and XP on crew creation
DROP TRIGGER IF EXISTS create_crew_portfolio_trigger ON crews;
CREATE TRIGGER create_crew_portfolio_trigger
AFTER INSERT ON crews
FOR EACH ROW
EXECUTE FUNCTION create_crew_portfolio_and_xp();

-- Seed some test data in mock mode
-- Give all existing users 1000 test C7T tokens
INSERT INTO token_balances (user_id, token_symbol, balance)
SELECT id, 'C7T', 1000.0
FROM users
ON CONFLICT (user_id, token_symbol) DO NOTHING;

-- Create portfolio and XP for existing crews
INSERT INTO crew_portfolios (crew_id)
SELECT id FROM crews
ON CONFLICT (crew_id) DO NOTHING;

INSERT INTO crew_xp (crew_id)
SELECT id FROM crews
ON CONFLICT (crew_id) DO NOTHING;

COMMENT ON TABLE user_wallets IS 'User blockchain wallet addresses';
COMMENT ON TABLE token_balances IS 'Off-chain token balance ledger (mock mode)';
COMMENT ON TABLE token_transactions IS 'Token transaction history';
COMMENT ON TABLE crew_rentals IS 'Crew rental agreements and history';
COMMENT ON TABLE crew_portfolios IS 'Crew portfolio, reputation, and earnings';
COMMENT ON TABLE crew_xp IS 'Crew experience points and level system';
COMMENT ON TABLE crew_ratings IS 'Individual user ratings for crews';
