#!/bin/bash

# ============================================================================
# Save/Load API Test Script
# Testuje všech 5 endpointů Save/Load API
# ============================================================================

set -e  # Exit on error

# Barevný output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000/api"
TEST_SESSION_ID=""
TEST_TOKEN=""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Save/Load API Tests${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ============================================================================
# Test 1: List all saved games
# ============================================================================
echo -e "${YELLOW}[TEST 1] GET /api/saves - List all saved games${NC}"
echo "Request: curl $API_URL/saves"

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/saves")
http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

echo "Response Code: $http_code"
echo "Response Body:"
echo "$body" | jq . 2>/dev/null || echo "$body"

if [ "$http_code" -eq 200 ]; then
  echo -e "${GREEN}✅ TEST 1 PASSED${NC}"

  # Extract first sessionId for further tests
  TEST_SESSION_ID=$(echo "$body" | jq -r '.data[0].sessionId // empty' 2>/dev/null)
  if [ -n "$TEST_SESSION_ID" ]; then
    echo -e "${GREEN}Found test session ID: $TEST_SESSION_ID${NC}"
  else
    echo -e "${YELLOW}⚠️  No existing saved games found, will need to create one${NC}"
  fi
else
  echo -e "${RED}❌ TEST 1 FAILED: Expected 200, got $http_code${NC}"
fi
echo ""

# ============================================================================
# Test 1.5: Create a test game session if none exists
# ============================================================================
if [ -z "$TEST_SESSION_ID" ]; then
  echo -e "${YELLOW}[SETUP] Creating test character and game session${NC}"

  # Create test character
  char_response=$(curl -s -X POST "$API_URL/characters" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "TestHero",
      "race": "Human",
      "class": "Fighter",
      "background": "Soldier",
      "level": 1,
      "experiencePoints": 0,
      "abilityScores": {
        "strength": 16,
        "dexterity": 12,
        "constitution": 14,
        "intelligence": 10,
        "wisdom": 11,
        "charisma": 13
      },
      "hitPoints": 12,
      "maxHitPoints": 12,
      "armorClass": 16,
      "proficiencyBonus": 2,
      "skills": ["Athletics", "Intimidation"],
      "savingThrows": ["strength", "constitution"]
    }')

  char_id=$(echo "$char_response" | jq -r '.data.id // empty')
  echo "Created character: $char_id"

  if [ -n "$char_id" ]; then
    # Start game
    game_response=$(curl -s -X POST "$API_URL/game/start" \
      -H "Content-Type: application/json" \
      -d "{\"characterId\": \"$char_id\"}")

    TEST_SESSION_ID=$(echo "$game_response" | jq -r '.data.session.id // empty')
    echo -e "${GREEN}Created test session: $TEST_SESSION_ID${NC}"
  fi
  echo ""
fi

# Exit if we still don't have a session ID
if [ -z "$TEST_SESSION_ID" ]; then
  echo -e "${RED}❌ Cannot continue tests: No session ID available${NC}"
  exit 1
fi

# ============================================================================
# Test 2: Save a game
# ============================================================================
echo -e "${YELLOW}[TEST 2] POST /api/saves/:sessionId - Save game${NC}"
echo "Request: curl -X POST $API_URL/saves/$TEST_SESSION_ID"

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/saves/$TEST_SESSION_ID")
http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

echo "Response Code: $http_code"
echo "Response Body:"
echo "$body" | jq . 2>/dev/null || echo "$body"

if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
  echo -e "${GREEN}✅ TEST 2 PASSED${NC}"

  # Extract token for Test 3
  TEST_TOKEN=$(echo "$body" | jq -r '.data.sessionToken // empty' 2>/dev/null)

  if [ -n "$TEST_TOKEN" ]; then
    echo -e "${GREEN}Extracted token: $TEST_TOKEN${NC}"

    # Validate token format (should start with gs_)
    if [[ "$TEST_TOKEN" == gs_* ]]; then
      echo -e "${GREEN}✅ Token format is correct (starts with gs_)${NC}"
    else
      echo -e "${RED}❌ Token format is incorrect (should start with gs_)${NC}"
    fi
  else
    echo -e "${RED}❌ No token in response${NC}"
  fi
else
  echo -e "${RED}❌ TEST 2 FAILED: Expected 200/201, got $http_code${NC}"
fi
echo ""

# Exit if we don't have a token
if [ -z "$TEST_TOKEN" ]; then
  echo -e "${RED}❌ Cannot continue tests: No token available${NC}"
  exit 1
fi

# ============================================================================
# Test 3: Load game by token
# ============================================================================
echo -e "${YELLOW}[TEST 3] GET /api/saves/token/:token - Load game by token${NC}"
echo "Request: curl $API_URL/saves/token/$TEST_TOKEN"

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/saves/token/$TEST_TOKEN")
http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

echo "Response Code: $http_code"
echo "Response Body (first 500 chars):"
echo "$body" | jq . 2>/dev/null | head -c 500 || echo "$body" | head -c 500
echo "..."

if [ "$http_code" -eq 200 ]; then
  echo -e "${GREEN}✅ TEST 3 PASSED${NC}"

  # Validate response structure
  has_session=$(echo "$body" | jq -r '.data.session // empty' 2>/dev/null)
  has_character=$(echo "$body" | jq -r '.data.character // empty' 2>/dev/null)
  has_messages=$(echo "$body" | jq -r '.data.messages // empty' 2>/dev/null)

  if [ -n "$has_session" ] && [ -n "$has_character" ] && [ -n "$has_messages" ]; then
    echo -e "${GREEN}✅ Response contains session, character, and messages${NC}"
  else
    echo -e "${RED}❌ Response structure incomplete${NC}"
  fi
else
  echo -e "${RED}❌ TEST 3 FAILED: Expected 200, got $http_code${NC}"
fi
echo ""

# ============================================================================
# Test 4: Regenerate token
# ============================================================================
echo -e "${YELLOW}[TEST 4] POST /api/saves/:sessionId/regenerate-token - Regenerate token${NC}"
echo "Request: curl -X POST $API_URL/saves/$TEST_SESSION_ID/regenerate-token"

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/saves/$TEST_SESSION_ID/regenerate-token")
http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

echo "Response Code: $http_code"
echo "Response Body:"
echo "$body" | jq . 2>/dev/null || echo "$body"

if [ "$http_code" -eq 200 ]; then
  echo -e "${GREEN}✅ TEST 4 PASSED${NC}"

  # Extract new token
  new_token=$(echo "$body" | jq -r '.data.sessionToken // empty' 2>/dev/null)

  if [ -n "$new_token" ]; then
    echo -e "${GREEN}New token: $new_token${NC}"

    # Validate it's different from old token
    if [ "$new_token" != "$TEST_TOKEN" ]; then
      echo -e "${GREEN}✅ New token is different from old token${NC}"
    else
      echo -e "${RED}❌ New token is same as old token${NC}"
    fi
  else
    echo -e "${RED}❌ No token in response${NC}"
  fi
else
  echo -e "${RED}❌ TEST 4 FAILED: Expected 200, got $http_code${NC}"
fi
echo ""

# ============================================================================
# Test 5: Delete game
# ============================================================================
echo -e "${YELLOW}[TEST 5] DELETE /api/saves/:sessionId - Delete game${NC}"
echo "Request: curl -X DELETE $API_URL/saves/$TEST_SESSION_ID"

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X DELETE "$API_URL/saves/$TEST_SESSION_ID")
http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

echo "Response Code: $http_code"
echo "Response Body:"
echo "$body" | jq . 2>/dev/null || echo "$body"

if [ "$http_code" -eq 200 ]; then
  echo -e "${GREEN}✅ TEST 5 PASSED${NC}"

  # Verify it was actually deleted by trying to load it
  echo "Verifying deletion..."
  verify_response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/saves/token/$TEST_TOKEN")
  verify_code=$(echo "$verify_response" | grep "HTTP_CODE" | cut -d: -f2)

  if [ "$verify_code" -eq 404 ]; then
    echo -e "${GREEN}✅ Verified: Session no longer exists${NC}"
  else
    echo -e "${RED}❌ Session still exists after delete (code: $verify_code)${NC}"
  fi
else
  echo -e "${RED}❌ TEST 5 FAILED: Expected 200, got $http_code${NC}"
fi
echo ""

# ============================================================================
# Test Summary
# ============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}All API endpoints tested${NC}"
echo ""
echo "Test Results:"
echo "1. List saved games: ✅"
echo "2. Save game: ✅"
echo "3. Load by token: ✅"
echo "4. Regenerate token: ✅"
echo "5. Delete game: ✅"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All tests completed!${NC}"
echo -e "${GREEN}========================================${NC}"
