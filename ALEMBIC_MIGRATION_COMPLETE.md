# Alembic Migration Setup - Complete ✅

## What Was Done

### 1. Alembic Configuration ✅
- **Updated `alembic/env.py`** to:
  - Import all SQLAlchemy models from `app.models`
  - Load database URL from `app.config.settings`
  - Enable type comparison for autogenerate
  - Support both online and offline migration modes

- **Updated `alembic.ini`**:
  - Commented out placeholder database URL
  - URL now read from application settings

### 2. Initial Migration Created ✅
- **File**: `alembic/versions/c97d607f592c_initial_migration_with_all_models.py`
- **Includes all tables**:
  - `users` - User authentication and profiles
  - `wallets` - Credit wallet system
  - `crews` - AI crew definitions
  - `agents` - Individual agents within crews
  - `runs` - Crew execution runs
  - `audits` - Audit trail
  - `evalcases` - Evaluation test cases
  - `user_wallets` - Crypto wallet addresses
  - `token_balances` - Token balance ledger
  - `token_transactions` - Transaction history
  - `crew_rentals` - Crew rental agreements
  - `crew_portfolios` - Crew reputation/metrics
  - `crew_xp` - Experience and leveling
  - `crew_ratings` - User ratings

- **Includes all enums**:
  - `RunStatus` (queued, running, succeeded, failed, cancelled)
  - `ChainType` (ethereum, polygon, arbitrum, optimism, local, test)
  - `TransactionDirection` (credit, debit)

- **Includes all indexes and foreign keys**

### 3. Start Script Updated ✅
- **Modified `start.sh`** to run Alembic migrations instead of SQL files:
  ```bash
  docker-compose exec -T api alembic upgrade head
  ```
- Removed old SQL migration file execution
- Added error handling and migration status checking

### 4. Helper Tools Created ✅
- **`backend/db-migrate.sh`** - Migration management script with commands:
  - `upgrade` - Apply all pending migrations
  - `downgrade` - Revert last migration
  - `current` - Show current version
  - `history` - Show migration history
  - `create` - Create new migration
  - `stamp` - Stamp database version

- **`backend/ALEMBIC_SETUP.md`** - Complete documentation for:
  - Quick start guide
  - Docker integration
  - Common commands
  - Development workflow
  - Troubleshooting

## Next Steps

### 1. Clear Database Volumes
```bash
cd backend/docker
docker-compose down -v
```

### 2. Run Start Script
```bash
cd ../..
./start.sh
```

The script will now:
1. Start database and Redis
2. Wait for database to be ready
3. **Run Alembic migrations automatically**
4. Create test user
5. Set up wallet credits
6. Start all services

### 3. Verify Migrations
```bash
# Inside container
docker-compose exec api alembic current

# Or locally
cd backend
uv run alembic current
```

## Benefits of Alembic

✅ **Version control** - Track schema changes in code
✅ **Rollback support** - Can revert migrations if needed
✅ **Auto-generate** - Create migrations from model changes
✅ **Type safety** - Catches schema mismatches
✅ **Team collaboration** - Merge-friendly migration files
✅ **Production ready** - Industry standard tool

## Migration File Structure

```
backend/
├── alembic/
│   ├── env.py                    # Environment configuration
│   └── versions/
│       └── c97d607f592c_*.py    # Initial migration
├── alembic.ini                   # Alembic config
├── db-migrate.sh                 # Helper script
└── ALEMBIC_SETUP.md             # Documentation
```

## All Models Imported

The migration includes these models from `app/models/`:
- ✅ Agent (from `agent.py`)
- ✅ Audit (from `audit.py`)
- ✅ Wallet (from `billing.py`)
- ✅ Crew (from `crew.py`)
- ✅ UserWallet, TokenBalance, TokenTransaction, CrewRental, CrewPortfolio, CrewXP, CrewRating (from `crypto.py`)
- ✅ EvalCase (from `evalcase.py`)
- ✅ Run, RunStatus (from `run.py`)
- ✅ User (from `user.py`)

## Ready to Use! 🚀

The system is now configured to use Alembic for all database migrations. Simply run:

```bash
./start.sh
```

And the database will be automatically migrated to the latest schema!
