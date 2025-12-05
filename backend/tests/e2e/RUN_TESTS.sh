#!/bin/bash
# E2E Test Runner Script
# Tento skript spustí všechny kroky potřebné pro E2E testy

set -e  # Exit on error

echo "🚀 AI Dungeon Master E2E Test Runner"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "📡 Checking if backend is running..."
if ! curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend is not running on port 5000${NC}"
    echo "   Start backend: cd backend && npm run dev"
    exit 1
fi
echo -e "${GREEN}✅ Backend is running${NC}"

# Check if frontend is running
echo "📡 Checking if frontend is running..."
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${RED}❌ Frontend is not running on port 5173${NC}"
    echo "   Start frontend: cd frontend && npm run dev"
    exit 1
fi
echo -e "${GREEN}✅ Frontend is running${NC}"

# Check if GEMINI_API_KEY is set
echo "🔑 Checking Gemini API Key..."
if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  GEMINI_API_KEY not set in environment${NC}"
    echo "   Make sure it's set in .env file or export it"
fi

# Check if PostgreSQL is running
echo "🗄️  Checking PostgreSQL..."
if ! pg_isready -h localhost -p 5433 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  PostgreSQL test database might not be running${NC}"
    echo "   Check: docker-compose ps | grep postgres-test"
fi

echo ""
echo "✅ Pre-flight checks complete!"
echo ""

# Parse arguments
MODE="headless"
GREP=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --ui)
            MODE="ui"
            shift
            ;;
        --headed)
            MODE="headed"
            shift
            ;;
        --debug)
            MODE="debug"
            shift
            ;;
        --grep)
            GREP="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--ui|--headed|--debug] [--grep 'pattern']"
            exit 1
            ;;
    esac
done

# Run tests based on mode
cd "$(dirname "$0")/../.."

echo "🧪 Running E2E tests in $MODE mode..."
echo ""

case $MODE in
    ui)
        npm run test:e2e:ui
        ;;
    headed)
        npm run test:e2e:headed
        ;;
    debug)
        npm run test:e2e:debug
        ;;
    *)
        if [ -n "$GREP" ]; then
            npx playwright test --grep "$GREP"
        else
            npm run test:e2e
        fi
        ;;
esac

echo ""
echo -e "${GREEN}✅ E2E tests complete!${NC}"
echo ""
echo "📊 View report: npm run test:e2e:report"
