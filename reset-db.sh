#!/bin/bash
# Quick setup script to clear database and restart with Alembic migrations

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🗑️  Clearing database volumes..."
cd backend/docker
docker-compose down -v

echo ""
echo "✨ Starting fresh with Alembic migrations..."
cd ../..
./start.sh

echo ""
echo "✅ Setup complete! Database migrated with Alembic."
echo ""
echo "To check migration status:"
echo "  docker-compose -f backend/docker/compose.yml exec api alembic current"
