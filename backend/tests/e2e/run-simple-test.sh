#!/bin/bash

# =============================================================================
# Quick Test Runner: Game Flow Simple
# =============================================================================
#
# Spustí zjednodušený E2E test kompletního herního flow.
#
# Požadavky:
# - Backend běží na http://localhost:3000
# - Frontend běží na http://localhost:5173
# - PostgreSQL databáze je připojena
#
# =============================================================================

set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎮 Game Flow Simple Test Runner"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if backend is running
echo "🔍 Checking if backend is running..."
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
  echo "❌ ERROR: Backend is not running on http://localhost:3000"
  echo ""
  echo "Start backend with:"
  echo "  cd backend && npm run dev"
  echo ""
  exit 1
fi
echo "✅ Backend is running"

# Check if frontend is running
echo "🔍 Checking if frontend is running..."
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
  echo "❌ ERROR: Frontend is not running on http://localhost:5173"
  echo ""
  echo "Start frontend with:"
  echo "  cd frontend && npm run dev"
  echo ""
  exit 1
fi
echo "✅ Frontend is running"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Starting E2E Test..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Change to backend directory
cd "$(dirname "$0")/../.."

# Run test
if [ "$1" = "--headed" ]; then
  echo "Running in HEADED mode (visible browser)..."
  npx playwright test game-flow-simple --headed
elif [ "$1" = "--ui" ]; then
  echo "Running in UI mode (interactive)..."
  npx playwright test game-flow-simple --ui
elif [ "$1" = "--debug" ]; then
  echo "Running in DEBUG mode..."
  npx playwright test game-flow-simple --debug
else
  echo "Running in HEADLESS mode..."
  npx playwright test game-flow-simple
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Test Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "View HTML report:"
echo "  npx playwright show-report"
echo ""
echo "Screenshots:"
echo "  backend/tests/e2e/screenshots/"
echo ""
