# Backend Tests - Save/Load API

## API Tests

### Quick Run
```bash
cd /home/scoreone/dnd/backend/tests
./api-save-load-simple.sh
```

### What it tests
1. **GET /api/saves** - List all saved games
2. **POST /api/saves/:sessionId** - Save game and get token
3. **GET /api/saves/token/:token** - Load game by token
4. **POST /api/saves/:sessionId/regenerate-token** - Regenerate token
5. **DELETE /api/saves/:sessionId** - Delete saved game

### Expected Output
```
========================================
Save/Load API Tests (Simple)
========================================

[TEST 1] GET /api/saves
HTTP Code: 200
✅ TEST 1 PASSED

[TEST 2] POST /api/saves/:sessionId
HTTP Code: 200
Token: gs_xxxxxxxxxxxxx
✅ Token format valid
✅ TEST 2 PASSED

[TEST 3] GET /api/saves/token/:token
HTTP Code: 200
✅ Response structure valid
✅ TEST 3 PASSED

[TEST 4] POST /api/saves/:sessionId/regenerate-token
HTTP Code: 200
New token: gs_yyyyyyyyyyyyy
✅ Token was regenerated
✅ TEST 4 PASSED

[TEST 5] DELETE /api/saves/:sessionId
HTTP Code: 200
✅ Verified: Game deleted
✅ TEST 5 PASSED

========================================
All 5 tests passed!
========================================
```

## Prerequisites
- Docker containers running (`docker-compose up`)
- Backend listening on `http://localhost:3000`
- At least one game session in database (or test will create one)

## Troubleshooting

### If tests fail with "Connection refused"
```bash
cd /home/scoreone/dnd
docker-compose ps  # Check if containers are running
docker-compose up -d  # Start containers if needed
```

### If tests fail with "No session ID available"
The test will automatically create a test character and session.
If this fails, check backend logs:
```bash
docker-compose logs backend
```

## Manual Testing

You can also test endpoints manually with curl:

```bash
# List saved games
curl http://localhost:3000/api/saves

# Save a game (replace SESSION_ID)
curl -X POST http://localhost:3000/api/saves/YOUR_SESSION_ID

# Load by token (replace TOKEN)
curl http://localhost:3000/api/saves/token/gs_xxxxxxxxxxxxx

# Delete a game (replace SESSION_ID)
curl -X DELETE http://localhost:3000/api/saves/YOUR_SESSION_ID
```
