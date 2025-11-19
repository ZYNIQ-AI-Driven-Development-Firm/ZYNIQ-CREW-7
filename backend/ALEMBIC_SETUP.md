# Alembic Database Migrations

This project uses Alembic for database migrations instead of raw SQL files.

## Quick Start

### Apply Migrations

```bash
# Using the helper script
cd backend
./db-migrate.sh upgrade

# Or directly with uv
uv run alembic upgrade head
```

### Check Current Migration Status

```bash
./db-migrate.sh current
```

### Create New Migration

```bash
# Auto-generate from model changes
./db-migrate.sh create "description of changes"

# Or manually
uv run alembic revision --autogenerate -m "your message"
```

### Rollback Last Migration

```bash
./db-migrate.sh downgrade
```

## Integration with Docker

The `start.sh` script automatically runs migrations using:

```bash
docker-compose exec -T api alembic upgrade head
```

This ensures the database schema is up-to-date when starting the stack.

## Migration Files

Migrations are stored in: `backend/alembic/versions/`

Initial migration includes all tables:
- users
- wallets  
- crews
- agents
- runs
- audits
- evalcases
- user_wallets (crypto)
- token_balances
- token_transactions
- crew_rentals
- crew_portfolios
- crew_xp
- crew_ratings

## Configuration

Alembic configuration is in:
- `alembic.ini` - Main configuration
- `alembic/env.py` - Migration environment setup

The database URL is automatically read from `app.config.settings.DB_URL`.

## Common Commands

```bash
# View migration history
uv run alembic history

# Show current version
uv run alembic current

# Upgrade to specific revision
uv run alembic upgrade <revision>

# Downgrade to specific revision  
uv run alembic downgrade <revision>

# Stamp database without running migrations
uv run alembic stamp head
```

## Development Workflow

1. **Modify models** in `app/models/`
2. **Create migration**: `./db-migrate.sh create "describe changes"`
3. **Review** the generated migration in `alembic/versions/`
4. **Test** the migration: `./db-migrate.sh upgrade`
5. **Verify** database schema matches expectations
6. **Commit** both model changes and migration file

## Troubleshooting

### Migration fails to apply

```bash
# Check current version
./db-migrate.sh current

# View history
./db-migrate.sh history

# Manually stamp if needed
./db-migrate.sh stamp head
```

### Start fresh (development only)

```bash
# Stop containers and remove volumes
cd backend/docker
docker-compose down -v

# Start fresh with migrations
cd ../..
./start.sh
```

## Notes

- All models are imported in `alembic/env.py` for autogenerate support
- Foreign key relationships are properly maintained
- Indexes are created for performance
- Enum types are managed correctly
- Timestamps use timezone-aware types
