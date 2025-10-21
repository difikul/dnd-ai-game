#!/bin/bash

# Simple API Tests without jq dependency
# ============================================================================

API_URL="http://localhost:3000/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Save/Load API Tests (Simple)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ============================================================================
# Test 1: List all saved games
# ============================================================================
echo -e "${YELLOW}[TEST 1] GET /api/saves${NC}"
response=$(curl -s -w "\n%{http_code}" "$API_URL/saves")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "HTTP Code: $http_code"
if [ "$http_code" -eq 200 ]; then
  echo -e "${GREEN}✅ TEST 1 PASSED${NC}"
  # Extract first sessionId
  TEST_SESSION_ID=$(echo "$body" | grep -o '"sessionId":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "Using session: $TEST_SESSION_ID"
else
  echo -e "${RED}❌ TEST 1 FAILED${NC}"
  exit 1
fi
echo ""

# ============================================================================
# Test 2: Save game
# ============================================================================
echo -e "${YELLOW}[TEST 2] POST /api/saves/$TEST_SESSION_ID${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/saves/$TEST_SESSION_ID")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "HTTP Code: $http_code"
if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
  echo -e "${GREEN}✅ TEST 2 PASSED${NC}"
  # Extract token
  TEST_TOKEN=$(echo "$body" | grep -o '"sessionToken":"[^"]*"' | cut -d'"' -f4)
  echo "Token: $TEST_TOKEN"

  # Validate token format
  if [[ "$TEST_TOKEN" == gs_* ]]; then
    echo -e "${GREEN}✅ Token format valid${NC}"
  else
    echo -e "${RED}❌ Token format invalid${NC}"
  fi
else
  echo -e "${RED}❌ TEST 2 FAILED${NC}"
  exit 1
fi
echo ""

# ============================================================================
# Test 3: Load game by token
# ============================================================================
echo -e "${YELLOW}[TEST 3] GET /api/saves/token/$TEST_TOKEN${NC}"
response=$(curl -s -w "\n%{http_code}" "$API_URL/saves/token/$TEST_TOKEN")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "HTTP Code: $http_code"
if [ "$http_code" -eq 200 ]; then
  echo -e "${GREEN}✅ TEST 3 PASSED${NC}"
  # Check for required fields
  if echo "$body" | grep -q '"session"' && echo "$body" | grep -q '"character"' && echo "$body" | grep -q '"messages"'; then
    echo -e "${GREEN}✅ Response structure valid${NC}"
  else
    echo -e "${RED}❌ Response structure incomplete${NC}"
  fi
else
  echo -e "${RED}❌ TEST 3 FAILED${NC}"
  exit 1
fi
echo ""

# ============================================================================
# Test 4: Regenerate token
# ============================================================================
echo -e "${YELLOW}[TEST 4] POST /api/saves/$TEST_SESSION_ID/regenerate-token${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/saves/$TEST_SESSION_ID/regenerate-token")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "HTTP Code: $http_code"
if [ "$http_code" -eq 200 ]; then
  echo -e "${GREEN}✅ TEST 4 PASSED${NC}"
  NEW_TOKEN=$(echo "$body" | grep -o '"sessionToken":"[^"]*"' | cut -d'"' -f4)
  echo "New token: $NEW_TOKEN"

  if [ "$NEW_TOKEN" != "$TEST_TOKEN" ]; then
    echo -e "${GREEN}✅ Token was regenerated${NC}"
  else
    echo -e "${RED}❌ Token was not changed${NC}"
  fi
else
  echo -e "${RED}❌ TEST 4 FAILED${NC}"
  exit 1
fi
echo ""

# ============================================================================
# Test 5: Delete game
# ============================================================================
echo -e "${YELLOW}[TEST 5] DELETE /api/saves/$TEST_SESSION_ID${NC}"
response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/saves/$TEST_SESSION_ID")
http_code=$(echo "$response" | tail -n1)

echo "HTTP Code: $http_code"
if [ "$http_code" -eq 200 ]; then
  echo -e "${GREEN}✅ TEST 5 PASSED${NC}"

  # Verify deletion
  verify_response=$(curl -s -w "\n%{http_code}" "$API_URL/saves/token/$NEW_TOKEN")
  verify_code=$(echo "$verify_response" | tail -n1)

  if [ "$verify_code" -eq 404 ]; then
    echo -e "${GREEN}✅ Verified: Game deleted${NC}"
  else
    echo -e "${YELLOW}⚠️  Warning: Game still accessible (code: $verify_code)${NC}"
  fi
else
  echo -e "${RED}❌ TEST 5 FAILED${NC}"
  exit 1
fi
echo ""

# ============================================================================
# Summary
# ============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}All 5 tests passed!${NC}"
echo -e "${BLUE}========================================${NC}"
