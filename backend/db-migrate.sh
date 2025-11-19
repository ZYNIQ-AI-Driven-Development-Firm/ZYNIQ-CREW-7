#!/bin/bash
# Database migration helper script for Alembic

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

show_help() {
    echo "Database Migration Helper"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  upgrade    - Apply all pending migrations"
    echo "  downgrade  - Revert last migration"
    echo "  current    - Show current migration version"
    echo "  history    - Show migration history"
    echo "  create     - Create a new migration (with message)"
    echo "  stamp      - Stamp database with specific revision"
    echo ""
    echo "Examples:"
    echo "  $0 upgrade"
    echo "  $0 create 'add new column'"
    echo "  $0 downgrade"
}

case "$1" in
    upgrade)
        echo -e "${BLUE}Applying migrations...${NC}"
        uv run alembic upgrade head
        echo -e "${GREEN}✓ Migrations applied${NC}"
        ;;
    downgrade)
        echo -e "${YELLOW}Reverting last migration...${NC}"
        uv run alembic downgrade -1
        echo -e "${GREEN}✓ Migration reverted${NC}"
        ;;
    current)
        echo -e "${BLUE}Current migration:${NC}"
        uv run alembic current
        ;;
    history)
        echo -e "${BLUE}Migration history:${NC}"
        uv run alembic history
        ;;
    create)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Migration message required${NC}"
            echo "Usage: $0 create 'your migration message'"
            exit 1
        fi
        echo -e "${BLUE}Creating new migration: $2${NC}"
        uv run alembic revision --autogenerate -m "$2"
        echo -e "${GREEN}✓ Migration created${NC}"
        ;;
    stamp)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Revision required${NC}"
            echo "Usage: $0 stamp <revision>"
            exit 1
        fi
        echo -e "${BLUE}Stamping database with revision: $2${NC}"
        uv run alembic stamp "$2"
        echo -e "${GREEN}✓ Database stamped${NC}"
        ;;
    *)
        show_help
        exit 1
        ;;
esac
