#!/bin/bash
# Stop and cleanup all ZYNIQ-CREW7 Docker services

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DOCKER_DIR="$SCRIPT_DIR/backend/docker"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          ZYNIQ-CREW7 - Docker Cleanup Script           ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$DOCKER_DIR"

echo -e "${YELLOW}Stopping all containers...${NC}"
docker-compose down

if [ "$1" == "--volumes" ]; then
    echo -e "${YELLOW}Removing all volumes (this will delete all data)...${NC}"
    docker-compose down -v
    echo -e "${GREEN}✓${NC} All containers and volumes removed"
elif [ "$1" == "--all" ]; then
    echo -e "${YELLOW}Removing all containers, volumes, and images...${NC}"
    docker-compose down -v --rmi all
    echo -e "${GREEN}✓${NC} All containers, volumes, and images removed"
else
    echo -e "${GREEN}✓${NC} All containers stopped"
fi

echo ""
echo -e "${CYAN}Cleanup Options:${NC}"
echo -e "  ${YELLOW}./cleanup.sh${NC}           - Stop containers only"
echo -e "  ${YELLOW}./cleanup.sh --volumes${NC} - Stop containers and remove volumes"
echo -e "  ${YELLOW}./cleanup.sh --all${NC}     - Remove everything (containers, volumes, images)"
echo ""
