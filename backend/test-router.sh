#!/bin/bash
# Run tests for a specific router

if [ -z "$1" ]; then
    echo "Usage: ./test-router.sh <router_name>"
    echo ""
    echo "Available routers:"
    echo "  health, auth, crews, agents, marketplace, runs"
    echo "  metadata, memory, ratings, pricing, dashboard_stats"
    echo "  settings, billing, crew_portfolio, env_setup"
    echo "  graph, tools, evals, stream, ws"
    echo ""
    echo "Example: ./test-router.sh crews"
    exit 1
fi

ROUTER=$1
TEST_FILE="tests/api/test_${ROUTER}.py"

if [ ! -f "$TEST_FILE" ]; then
    echo "❌ Test file not found: $TEST_FILE"
    exit 1
fi

echo "🧪 Testing router: $ROUTER"
echo "================================"
pytest "$TEST_FILE" -v

echo ""
echo "✅ Tests completed for $ROUTER!"
