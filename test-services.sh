#!/bin/bash
# Quick test script to verify all services are running

echo "🧪 Testing ZYNIQ-CREW7 Services..."
echo ""

# Test API Health
echo -n "Testing API Health... "
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✓ API is running"
else
    echo "✗ API is not responding"
    echo "  Run: docker compose -f backend/docker/compose.yml logs api"
    exit 1
fi

# Test Frontend
echo -n "Testing Frontend... "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✓ Frontend is running"
else
    echo "✗ Frontend is not responding"
    exit 1
fi

# Test Database
echo -n "Testing Database... "
if docker compose -f backend/docker/compose.yml exec -T db pg_isready -U crew7 -d crew7 > /dev/null 2>&1; then
    echo "✓ Database is ready"
else
    echo "✗ Database is not ready"
    exit 1
fi

# Test Redis
echo -n "Testing Redis... "
if docker compose -f backend/docker/compose.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✓ Redis is running"
else
    echo "✗ Redis is not responding"
    exit 1
fi

# Count agents in database
echo ""
echo "Checking database content..."
AGENT_COUNT=$(docker compose -f backend/docker/compose.yml exec -T db psql -U crew7 -d crew7 -t -c "SELECT COUNT(*) FROM agents;" 2>/dev/null | tr -d ' ')
echo "  Agents in database: $AGENT_COUNT"

USER_COUNT=$(docker compose -f backend/docker/compose.yml exec -T db psql -U crew7 -d crew7 -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
echo "  Users in database: $USER_COUNT"

CREW_COUNT=$(docker compose -f backend/docker/compose.yml exec -T db psql -U crew7 -d crew7 -t -c "SELECT COUNT(*) FROM crews;" 2>/dev/null | tr -d ' ')
echo "  Crews in database: $CREW_COUNT"

echo ""
echo "✅ All services are running!"
echo ""
echo "🌐 Access URLs:"
echo "  Frontend: http://localhost:3000"
echo "  API Docs: http://localhost:8000/docs"
echo "  pgAdmin:  http://localhost:5050"
echo ""
echo "🔑 Login Credentials:"
echo "  Email:    admin@crew7.ai"
echo "  Password: Admin@123"
echo ""
