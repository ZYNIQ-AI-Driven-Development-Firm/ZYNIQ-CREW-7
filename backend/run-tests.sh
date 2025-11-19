#!/bin/bash
# Run API endpoint tests for ZYNIQ-CREW-7 backend

set -e

cd "$(dirname "$0")"

echo "🧪 Running Backend API Tests"
echo "================================"

# Check if pytest is installed
if ! command -v pytest &> /dev/null; then
    echo "❌ pytest not found. Installing test dependencies..."
    pip install -r requirements.txt
fi

# Run tests
echo ""
echo "📋 Running API endpoint tests by router..."
pytest tests/api/ -v

echo ""
echo "✅ API tests completed successfully!"
