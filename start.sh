#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Parse command line arguments
RESET_DB=false
if [ "$1" = "--reset" ] || [ "$1" = "-r" ]; then
    RESET_DB=true
fi

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
DOCKER_DIR="$BACKEND_DIR/docker"
MIGRATIONS_DIR="$BACKEND_DIR/migrations"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         ZYNIQ-CREW7 - Complete Startup Script          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
if [ "$RESET_DB" = true ]; then
    echo -e "${YELLOW}║              🗑️  DATABASE RESET MODE 🗑️               ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
fi
echo ""

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${BLUE}[1/9]${NC} Loading environment variables from .env..."
    source "$PROJECT_ROOT/.env"
    echo -e "${GREEN}✓${NC} Environment loaded"
else
    echo -e "${RED}✗ Error: .env file not found${NC}"
    exit 1
fi

# Verify required env vars
echo -e "${BLUE}[2/9]${NC} Verifying required environment variables..."
REQUIRED_VARS=("DEFAULT_USER_EMAIL" "DEFAULT_USER_PASSWORD" "DEFAULT_USER_CREDITS" "POSTGRES_USER" "POSTGRES_PASSWORD" "POSTGRES_DB")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}✗ Missing required environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "${RED}  - $var${NC}"
    done
    exit 1
fi
echo -e "${GREEN}✓${NC} All required variables present"
echo ""

# Stop existing containers (with or without volumes)
echo -e "${BLUE}[3/9]${NC} Stopping existing containers..."
cd "$DOCKER_DIR"
if [ "$RESET_DB" = true ]; then
    echo -e "${YELLOW}🗑️  Clearing database volumes...${NC}"
    docker-compose down -v 2>/dev/null || true
    docker volume prune -f 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Containers stopped and volumes cleared"
else
    docker-compose down 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Containers stopped"
fi
echo ""

# Build Docker containers
echo -e "${BLUE}[4/9]${NC} Building Docker containers..."
echo -e "${YELLOW}⏳ This may take a few minutes...${NC}"
docker-compose build
echo -e "${GREEN}✓${NC} Containers built successfully"
echo ""

# Start database and redis first
echo -e "${BLUE}[5/9]${NC} Starting database and Redis..."
docker-compose up -d db redis
echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
sleep 5

# Wait for database to be ready
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose exec -T db pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB} > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Database is ready"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -e "${YELLOW}⏳ Waiting for database... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}✗ Database failed to start${NC}"
    exit 1
fi
echo ""

# Start API container first (needed for migrations)
echo -e "${BLUE}[6/9]${NC} Starting API container..."
docker-compose up -d api
echo -e "${YELLOW}⏳ Waiting for API container to be ready...${NC}"
sleep 5

# Run Alembic migrations
echo -e "${BLUE}[6.5/9]${NC} Running database migrations with Alembic..."
echo -e "${YELLOW}  → Applying Alembic migrations${NC}"
docker-compose exec -T api alembic upgrade head
if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✓ All migrations applied successfully${NC}"
else
    echo -e "${RED}  ✗ Migration failed${NC}"
    echo -e "${YELLOW}  Checking migration status...${NC}"
    docker-compose exec -T api alembic current
    exit 1
fi
echo ""

# Create test user via Python script (ensures password is hashed correctly)
echo -e "${BLUE}[7/9]${NC} Creating test user..."
docker-compose exec -T api python -c "
import sys
sys.path.insert(0, '/app')
from app.infra.db import SessionLocal
from app.models.user import User
from app.services.auth_service import hash_pw
import uuid

db = SessionLocal()
try:
    # Delete existing user if present
    existing = db.query(User).filter(User.email == '${DEFAULT_USER_EMAIL}').first()
    if existing:
        db.delete(existing)
        db.commit()
    
    # Create new user with properly hashed password
    user = User(
        id=uuid.uuid4(),
        email='${DEFAULT_USER_EMAIL}',
        password_hash=hash_pw('${DEFAULT_USER_PASSWORD}'),
        org_id='default',
        role='admin'
    )
    db.add(user)
    db.commit()
    print('User created: ${DEFAULT_USER_EMAIL}')
except Exception as e:
    print(f'Error: {e}')
    sys.exit(1)
finally:
    db.close()
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Test user created"
    echo -e "${CYAN}  Email: ${DEFAULT_USER_EMAIL}${NC}"
    echo -e "${CYAN}  Password: ${DEFAULT_USER_PASSWORD}${NC}"
else
    echo -e "${YELLOW}⚠ Warning: User creation had issues${NC}"
fi
echo ""

# Create/update wallet with credits
echo -e "${BLUE}[7.5/9]${NC} Setting up wallet credits..."
docker-compose exec -T db psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} <<EOF
DO \$\$
DECLARE
    wallet_exists BOOLEAN;
BEGIN
    -- Check if wallet exists for 'default' org
    SELECT EXISTS(SELECT 1 FROM wallets WHERE org_id = 'default') INTO wallet_exists;
    
    IF wallet_exists THEN
        -- Update existing wallet
        UPDATE wallets 
        SET credits = ${DEFAULT_USER_CREDITS}
        WHERE org_id = 'default';
        RAISE NOTICE 'Wallet updated with % credits', ${DEFAULT_USER_CREDITS};
    ELSE
        -- Create new wallet
        INSERT INTO wallets (id, org_id, credits)
        VALUES (gen_random_uuid(), 'default', ${DEFAULT_USER_CREDITS});
        RAISE NOTICE 'Wallet created with % credits', ${DEFAULT_USER_CREDITS};
    END IF;
END \$\$;
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Wallet configured"
    echo -e "${CYAN}  Credits: ${DEFAULT_USER_CREDITS}${NC}"
else
    echo -e "${YELLOW}⚠ Warning: Wallet setup had issues${NC}"
fi
echo ""

# Start all other services (including nginx and frontend)
echo -e "${BLUE}[8/9]${NC} Starting all services (nginx, worker, frontend, etc.)..."
docker-compose up -d
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Wait for nginx/API to be ready on port 8080
MAX_RETRIES=30
RETRY_COUNT=0
echo -e "${YELLOW}⏳ Checking API availability through nginx (port 8080)...${NC}"
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8080/live > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} API is ready (via nginx on port 8080)"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -e "${YELLOW}⏳ Waiting for API... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${YELLOW}⚠ Nginx not responding, checking API directly on port 8000...${NC}"
    # Try direct API connection as fallback
    if curl -s http://localhost:8000/live > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} API is ready (direct on port 8000)"
    else
        echo -e "${RED}✗ API failed to start. Checking logs...${NC}"
        echo ""
        echo -e "${YELLOW}Last 20 lines of API logs:${NC}"
        docker-compose logs --tail=20 api
        echo ""
        echo -e "${YELLOW}Last 20 lines of nginx logs:${NC}"
        docker-compose logs --tail=20 nginx
        exit 1
    fi
fi

# Wait for Frontend to be ready
echo -e "${YELLOW}⏳ Waiting for frontend to be ready...${NC}"
FRONTEND_RETRIES=30
FRONTEND_COUNT=0
while [ $FRONTEND_COUNT -lt $FRONTEND_RETRIES ]; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Frontend is ready"
        break
    fi
    FRONTEND_COUNT=$((FRONTEND_COUNT + 1))
    echo -e "${YELLOW}⏳ Waiting for frontend... ($FRONTEND_COUNT/$FRONTEND_RETRIES)${NC}"
    sleep 2
done

if [ $FRONTEND_COUNT -eq $FRONTEND_RETRIES ]; then
    echo -e "${YELLOW}⚠ Frontend may still be starting... Check logs with: docker-compose logs -f frontend${NC}"
fi

# Create test user via API
echo -e "${BLUE}[9/9]${NC} Registering test user via API..."
sleep 2
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8080/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${DEFAULT_USER_EMAIL}\",\"password\":\"${DEFAULT_USER_PASSWORD}\"}")

if echo "$REGISTER_RESPONSE" | grep -q "id"; then
    echo -e "${GREEN}✓${NC} Test user registered successfully"
    echo -e "${CYAN}  Email: ${DEFAULT_USER_EMAIL}${NC}"
    echo -e "${CYAN}  Password: ${DEFAULT_USER_PASSWORD}${NC}"
else
    echo -e "${YELLOW}⚠ User may already exist or registration had issues${NC}"
    echo -e "${YELLOW}  Response: $REGISTER_RESPONSE${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                 🎉 STARTUP COMPLETE! 🎉                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}📊 Service Status:${NC}"
echo -e "${GREEN}✓${NC} Database:   http://localhost:5432"
echo -e "${GREEN}✓${NC} Redis:      http://localhost:6379"
echo -e "${GREEN}✓${NC} API:        http://localhost:8000"
echo -e "${GREEN}✓${NC} Frontend:   http://localhost:3000"
echo -e "${GREEN}✓${NC} pgAdmin:    http://localhost:5050"
echo ""
echo -e "${CYAN}🔑 Test User Credentials:${NC}"
echo -e "   Email:    ${MAGENTA}${DEFAULT_USER_EMAIL}${NC}"
echo -e "   Password: ${MAGENTA}${DEFAULT_USER_PASSWORD}${NC}"
echo -e "   Credits:  ${MAGENTA}${DEFAULT_USER_CREDITS}${NC}"
echo ""
echo -e "${CYAN}📝 Useful Commands:${NC}"
echo -e "   Reset & start:      ${YELLOW}./start.sh --reset${NC} ${MAGENTA}(clears DB volumes)${NC}"
echo -e "   View API logs:      ${YELLOW}docker-compose -f backend/docker/compose.yml logs -f api${NC}"
echo -e "   View frontend logs: ${YELLOW}docker-compose -f backend/docker/compose.yml logs -f frontend${NC}"
echo -e "   Stop all services:  ${YELLOW}docker-compose -f backend/docker/compose.yml down${NC}"
echo -e "   Restart API:        ${YELLOW}docker-compose -f backend/docker/compose.yml restart api${NC}"
echo -e "   Restart frontend:   ${YELLOW}docker-compose -f backend/docker/compose.yml restart frontend${NC}"
echo -e "   Rebuild frontend:   ${YELLOW}docker-compose -f backend/docker/compose.yml up -d --build frontend${NC}"
echo ""
echo -e "${CYAN}🧪 Testing:${NC}"
echo -e "   1. Open browser: ${BLUE}http://localhost:3000${NC}"
echo -e "   2. Login with credentials above"
echo -e "   3. Test agent, rating, and pricing features"
echo ""
echo -e "${GREEN}Ready to test! 🚀${NC}"
echo ""
