# Start Script Summary

## Overview
The `start.sh` script provides a complete automated setup for the ZYNIQ-CREW-7 project with Alembic migrations.

## Complete Workflow

### Step 1: Environment Setup [1/9]
- Loads environment variables from `.env` file
- Required variables:
  - `DEFAULT_USER_EMAIL`
  - `DEFAULT_USER_PASSWORD` 
  - `DEFAULT_USER_CREDITS`
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_DB`

### Step 2: Validation [2/9]
- Verifies all required environment variables are set
- Exits if any are missing

### Step 3: Cleanup [3/9]
- Stops any existing containers
- Does NOT remove volumes (use `docker-compose down -v` separately for clean start)

### Step 4: Build [4/9]
- Builds all Docker containers:
  - API (with Alembic files included)
  - Worker
  - Frontend
- Uses cached layers when possible

### Step 5: Database Startup [5/9]
- Starts PostgreSQL and Redis containers
- Waits for PostgreSQL to be ready (max 30 retries, 2s intervals)
- Uses `pg_isready` to verify database connectivity

### Step 6: API Startup [6/9]
- Starts API container (required for running migrations)
- Waits 5 seconds for container initialization

### Step 6.5: Database Migrations [6.5/9]
- **Runs Alembic migrations**: `docker-compose exec -T api alembic upgrade head`
- Creates all tables:
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
- Creates enum types (runstatus, chaintype, transactiondirection)
- Exits on migration failure with status check

### Step 7: User Creation [7/9]
- Creates default admin user directly in database
- Schema matches Alembic migration:
  ```sql
  INSERT INTO users (id, email, password_hash, org_id, role)
  ```
- Password is pre-hashed: `$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW3Pe8vYvH7G`
  - Plain text password: `Admin@123`
- Deletes existing user if email already exists

### Step 7.5: Wallet Setup [7.5/9]
- Creates or updates wallet for 'default' organization
- Sets credits from `DEFAULT_USER_CREDITS` env variable
- Uses proper container reference: `docker-compose exec -T db`

### Step 8: Start All Services [8/9]
- Starts all remaining containers:
  - nginx (reverse proxy on port 8080)
  - worker
  - frontend
  - qdrant
  - minio
  - ollama
  - pgadmin
- Waits 10 seconds for initialization
- Tests API availability through nginx on port 8080
- Falls back to direct API check on port 8000 if nginx not ready
- Shows logs if API fails to start

### Step 9: API User Registration [9/9]
- Attempts to register user via API endpoint
- POST to `/auth/register` with email and password
- Non-critical step (user may already exist from Step 7)

## Success Output

Upon successful completion:
- ✓ Database: localhost:5432
- ✓ Redis: localhost:6379
- ✓ API: localhost:8000 (direct) or localhost:8080 (via nginx)
- ✓ Frontend: localhost:3000
- ✓ pgAdmin: localhost:5050

## Key Improvements Made

1. **Alembic Integration**:
   - Migrations run automatically before user creation
   - Proper error handling and status checking

2. **Fixed Schema Matching**:
   - User creation SQL matches actual Alembic migration schema
   - Removed non-existent `name`, `created_at`, `updated_at` columns

3. **Fixed Container References**:
   - Changed `docker-db-1` to `docker-compose exec -T db`
   - Consistent use of docker-compose commands

4. **Better Error Handling**:
   - Checks both nginx (8080) and direct API (8000)
   - Shows both API and nginx logs on failure
   - Clear status messages at each step

5. **Proper Sequencing**:
   - API container must be running before migrations
   - Migrations must complete before user creation
   - All services started together at the end

## Clean Start Procedure

For a completely fresh database:

```bash
# 1. Stop and remove all volumes
cd backend/docker
docker-compose down -v

# 2. Optional: Remove orphaned volumes
docker volume prune -f

# 3. Run start script
cd ../..
./start.sh
```

Or use the convenience script:
```bash
./reset-db.sh
```

## Troubleshooting

### Migrations Fail
```bash
# Check current migration status
docker exec crew7-api alembic current

# View migration history
docker exec crew7-api alembic history

# Manually upgrade
docker exec crew7-api alembic upgrade head
```

### User Creation Fails
- Check if migrations completed successfully
- Verify `users` table exists: `docker-compose exec -T db psql -U crew7 -d crew7 -c "\dt"`
- Check user exists: `docker-compose exec -T db psql -U crew7 -d crew7 -c "SELECT email, role FROM users;"`

### API Not Responding
```bash
# Check API logs
docker-compose -f backend/docker/compose.yml logs api

# Check nginx logs
docker-compose -f backend/docker/compose.yml logs nginx

# Test API directly
curl http://localhost:8000/live

# Test through nginx
curl http://localhost:8080/live
```

## Dependencies

The script requires:
- Docker and Docker Compose
- bash shell
- curl (for health checks)
- Populated `.env` file in project root

## Exit Codes

- `0`: Success
- `1`: Missing .env file, missing env vars, database startup failure, migration failure, or API startup failure
