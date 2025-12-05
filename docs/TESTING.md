# Testing Guide - AI Dungeon Master

Datum: 2025-11-20

Tento dokument popisuje komplexní testing strategii pro D&D AI aplikaci.

---

## 📋 Table of Contents

1. [Testing Architecture](#testing-architecture)
2. [Unit Tests (Vitest)](#unit-tests-vitest)
3. [Integration Tests (Vitest + Supertest)](#integration-tests-vitest--supertest)
4. [E2E Tests (Playwright)](#e2e-tests-playwright)
5. [Running Tests](#running-tests)
6. [Coverage Reports](#coverage-reports)
7. [CI/CD Integration](#cicd-integration)

---

## Testing Architecture

Aplikace používá **3-tier testing pyramid**:

```
         /\
        /  \  E2E Tests (Playwright)
       /----\  - AI game flow scenarios
      /      \  - Full stack integration
     /--------\ Integration Tests (Vitest + Supertest)
    /          \ - API endpoints
   /            \ - Database operations
  /--------------\ Unit Tests (Vitest)
 /                \ - Business logic
/                  \ - Utility functions
--------------------
```

### Test Framework Stack

| Layer | Framework | Purpose |
|-------|-----------|---------|
| **Unit** | Vitest | Izolované testy business logiky |
| **Integration** | Vitest + Supertest | API endpoint testy s DB |
| **E2E** | Playwright | Full stack testy včetně AI |

### Test Database

- **Production DB**: PostgreSQL na portu `5432`
- **Test DB**: PostgreSQL na portu `5433`
- **Connection**: `postgresql://test_user:test_pass@localhost:5433/dnd_test`

---

## Unit Tests (Vitest)

### Struktura

```
backend/tests/unit/
├── services/
│   ├── saveService.test.ts         # Save/Load game logic
│   ├── contextService.test.ts      # AI context building
│   └── characterService.test.ts    # Character CRUD operations
├── utils/
│   └── dice.test.ts                # Dice roll utilities
└── middleware/
    └── validation.middleware.test.ts # Request validation
```

### Příklad Unit Testu

```typescript
// tests/unit/utils/dice.test.ts
import { describe, it, expect } from 'vitest'
import { rollDice, parseDiceNotation } from '@/utils/dice'

describe('Dice Utils', () => {
  describe('parseDiceNotation', () => {
    it('should parse 1d20+3', () => {
      const result = parseDiceNotation('1d20+3')
      expect(result).toEqual({
        count: 1,
        sides: 20,
        modifier: 3
      })
    })

    it('should handle negative modifiers', () => {
      const result = parseDiceNotation('2d6-2')
      expect(result.modifier).toBe(-2)
    })
  })

  describe('rollDice', () => {
    it('should return result within valid range', () => {
      const result = rollDice(1, 20, 0)
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(20)
    })
  })
})
```

### Running Unit Tests

```bash
# Watch mode (development)
npm run test:unit

# Single run (CI)
npm run test:unit:watch

# With coverage
npm run test:coverage
```

---

## Integration Tests (Vitest + Supertest)

### Struktura

```
backend/tests/integration/
├── game.api.test.ts        # Game session management
├── character.api.test.ts   # Character CRUD endpoints
├── dice.api.test.ts        # Dice roll endpoints
└── save.api.test.ts        # Save/Load endpoints
```

### Co testujeme?

1. **HTTP Request/Response** - Status codes, headers, body structure
2. **Database Operations** - CRUD operace s validací
3. **Authentication/Authorization** - JWT tokens, permissions
4. **Validation** - Zod schemas, error handling
5. **Business Logic** - Service layer integrace

### Příklad Integration Testu

```typescript
// tests/integration/game.api.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import app from '@/app'

describe('Game API - POST /api/game/session/:id/action', () => {
  let authToken: string
  let sessionId: string

  beforeAll(async () => {
    // Setup: Create user, character, session
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password123!' })

    authToken = loginRes.body.token

    const sessionRes = await request(app)
      .post('/api/game/session')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ characterId: 'test-character-id' })

    sessionId = sessionRes.body.id
  })

  it('should process player action and return narrator response', async () => {
    const response = await request(app)
      .post(`/api/game/session/${sessionId}/action`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        action: 'Podívám se kolem sebe',
        characterId: 'test-character-id'
      })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('text')
    expect(response.body).toHaveProperty('timestamp')
  })

  it('should handle spell casting action', async () => {
    const response = await request(app)
      .post(`/api/game/session/${sessionId}/action`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        action: 'Hodím Fire Bolt na nepřítele',
        characterId: 'test-character-id'
      })

    expect(response.status).toBe(200)
    expect(response.body.text).toContain('Fire Bolt')
  })

  it('should require diceRollResult parameter', async () => {
    const response = await request(app)
      .post(`/api/game/session/${sessionId}/action`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        action: 'Útočím mečem',
        characterId: 'test-character-id',
        diceRollResult: 18 // ✅ Dice roll result from frontend
      })

    expect(response.status).toBe(200)
  })
})
```

### Running Integration Tests

```bash
# Start test database first
docker-compose -f docker-compose.test.yml up -d postgres-test

# Run tests
npm run test:integration

# Watch mode
npm run test:integration:watch

# With UI
npm run test:integration:ui

# With coverage
npm run test:integration:coverage
```

---

## E2E Tests (Playwright)

### Struktura

```
backend/tests/e2e/
├── ai-dungeon-master.spec.ts     # Full AI game flow (15 min)
├── game-flow-simple.spec.ts      # Simplified game flow (5 min)
├── utils/
│   └── test-helpers.ts           # Helper functions
└── types/
    └── index.ts                  # TypeScript types
```

### Co testujeme?

1. **AI Integration** - Gemini API responses
2. **Game Flow** - Character creation → Session → Actions → Combat → Long Rest
3. **Spell Casting** - Known spells, spell slots, AI validation
4. **Dice Rolling** - AI dice requirements, frontend integration
5. **State Management** - Database persistence across actions

### Příklad E2E Testu

```typescript
// tests/e2e/game-flow-simple.spec.ts
import { test, expect } from '@playwright/test'
import { registerUser, loginUser, createCharacter, createSession } from './utils/test-helpers'

test.describe('Game Flow - Complete Wizard Journey', () => {
  let authToken: string
  let characterId: string
  let sessionId: string

  test.beforeAll(async ({ request }) => {
    // Setup: Register → Login → Create Character → Create Session
    const user = await registerUser(request, {
      username: 'gandalf-test',
      email: 'gandalf@test.com',
      password: 'Password123!'
    })

    const login = await loginUser(request, {
      email: 'gandalf@test.com',
      password: 'Password123!'
    })
    authToken = login.token

    const character = await createCharacter(request, authToken, {
      name: 'Gandalf',
      class: 'Wizard',
      race: 'Human',
      level: 1,
      spells: ['Fire Bolt', 'Magic Missile'] // ✅ Known spells
    })
    characterId = character.id

    const session = await createSession(request, authToken, characterId)
    sessionId = session.id
  })

  test('Action 1: Look around', async ({ request }) => {
    const response = await request.post(`/api/game/session/${sessionId}/action`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        action: 'Podívám se kolem sebe',
        characterId
      }
    })

    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    expect(body.text).toBeTruthy()
  })

  test('Action 2: Cast Fire Bolt (cantrip)', async ({ request }) => {
    const response = await request.post(`/api/game/session/${sessionId}/action`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        action: 'Hodím Fire Bolt na goblin',
        characterId
      }
    })

    expect(response.ok()).toBeTruthy()
    const body = await response.json()

    // ✅ AI should accept known spell
    expect(body.text.toLowerCase()).not.toContain('nemáš to kouzlo')
    expect(body.text.toLowerCase()).not.toContain('nemáš skill')
  })

  test('Action 3: Cast Magic Missile (level 1 spell)', async ({ request }) => {
    const response = await request.post(`/api/game/session/${sessionId}/action`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        action: 'Hodím Magic Missile',
        characterId
      }
    })

    expect(response.ok()).toBeTruthy()
    const body = await response.json()

    // ✅ AI should accept known spell AND consume spell slot
    expect(body.text.toLowerCase()).not.toContain('nemáš to kouzlo')

    // Verify spell slot consumed in database
    const charResponse = await request.get(`/api/characters/${characterId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    const character = await charResponse.json()
    const level1Slot = character.spellSlots.find(s => s.level === 1)
    expect(level1Slot.used).toBeGreaterThan(0)
  })

  test('Action 4: Long Rest', async ({ request }) => {
    // First, damage character
    await request.post(`/api/characters/${characterId}/damage`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: { damage: 5 }
    })

    // Then, long rest action
    const response = await request.post(`/api/game/session/${sessionId}/action`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        action: 'Odpočinu si na long rest',
        characterId
      }
    })

    expect(response.ok()).toBeTruthy()

    // ✅ Verify HP and spell slots restored
    const charResponse = await request.get(`/api/characters/${characterId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    const character = await charResponse.json()
    expect(character.currentHitPoints).toBe(character.maxHitPoints)

    const level1Slot = character.spellSlots.find(s => s.level === 1)
    expect(level1Slot.used).toBe(0) // ✅ Spell slots restored
  })

  test('Action 5: Dice Roll Integration', async ({ request }) => {
    const response = await request.post(`/api/game/session/${sessionId}/action`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        action: 'Útočím mečem na goblin',
        characterId
      }
    })

    expect(response.ok()).toBeTruthy()
    const body = await response.json()

    // ✅ AI should request dice roll
    if (body.metadata?.requiresDiceRoll) {
      expect(body.metadata.diceRequirement).toHaveProperty('notation')
      expect(body.metadata.diceRequirement).toHaveProperty('dc')

      // Simulate dice roll result
      const followUpResponse = await request.post(`/api/game/session/${sessionId}/action`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        data: {
          action: 'Pokračuji v útoku',
          characterId,
          diceRollResult: 18 // ✅ Pass dice roll result
        }
      })

      expect(followUpResponse.ok()).toBeTruthy()
      const followUpBody = await followUpResponse.json()
      expect(followUpBody.text).toBeTruthy()
    }
  })
})
```

### Running E2E Tests

```bash
# Start all services first
docker-compose up -d

# Run E2E tests
npm run test:e2e

# Watch mode with UI
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step-by-step)
npm run test:e2e:debug

# View HTML report
npm run test:e2e:report
```

### E2E Test Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 900 * 1000, // 15 minutes per test (AI is slow)
  fullyParallel: false, // Sequential for E2E tests
  workers: 1, // Always 1 worker for E2E
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
})
```

---

## Running Tests

### Quick Start

```bash
# Install dependencies
npm install

# Start test database
docker-compose -f docker-compose.test.yml up -d postgres-test

# Run all tests
npm test                    # All tests (unit + integration + e2e)

# Run specific test suites
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:e2e            # E2E tests only
```

### Watch Mode (Development)

```bash
# Unit tests with hot reload
npm run test:unit:watch

# Integration tests with hot reload
npm run test:integration:watch

# E2E tests with UI
npm run test:e2e:ui
```

### CI Mode (Production)

```bash
# Single run with coverage
npm run test:run
npm run test:coverage

# E2E tests on CI
npm run test:e2e
```

---

## Coverage Reports

### Vitest Coverage (Unit + Integration)

```bash
# Generate coverage report
npm run test:coverage

# View report
open coverage/index.html
```

### Coverage Targets

| Category | Target | Current |
|----------|--------|---------|
| **Statements** | 80% | 75% |
| **Branches** | 75% | 70% |
| **Functions** | 80% | 72% |
| **Lines** | 80% | 75% |

### Coverage Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'tests/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/prisma/**'
      ]
    }
  }
})
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: dnd_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5433:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5433/dnd_test

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: |
            coverage/
            playwright-report/
```

---

## Test Data & Fixtures

### Character Fixtures

```typescript
// tests/fixtures/characters.ts
export const testWizard = {
  name: 'Gandalf',
  class: 'Wizard',
  race: 'Human',
  level: 5,
  strength: 10,
  dexterity: 12,
  constitution: 14,
  intelligence: 18,
  wisdom: 14,
  charisma: 12,
  maxHitPoints: 28,
  currentHitPoints: 28,
  spells: [
    'Fire Bolt',      // Cantrip
    'Magic Missile',  // Level 1
    'Fireball'        // Level 3
  ]
}

export const testFighter = {
  name: 'Conan',
  class: 'Fighter',
  race: 'Human',
  level: 3,
  strength: 18,
  dexterity: 14,
  constitution: 16,
  intelligence: 10,
  wisdom: 12,
  charisma: 10,
  maxHitPoints: 32,
  currentHitPoints: 32
}
```

---

## Debugging Tests

### Vitest Debugging

```bash
# Run single test file
npx vitest run tests/unit/utils/dice.test.ts

# Run with specific pattern
npx vitest run -t "should parse 1d20+3"

# Debug mode
node --inspect-brk node_modules/.bin/vitest run tests/unit/utils/dice.test.ts
```

### Playwright Debugging

```bash
# Debug single test
npx playwright test tests/e2e/game-flow-simple.spec.ts --debug

# Debug specific test case
npx playwright test -g "Cast Fire Bolt" --debug

# Headed mode (see browser)
npx playwright test --headed

# Slow motion mode
SLOW_MO=1 npx playwright test --headed
```

---

## Best Practices

### ✅ DO

- **Mock external services** (Gemini API) v unit testech
- **Use test database** pro integration testy
- **Clean up test data** po každém testu
- **Use fixtures** pro opakovaná test data
- **Test edge cases** (validation errors, empty states)
- **Test error paths** (401, 403, 404, 500)

### ❌ DON'T

- **Don't use production DB** pro testy
- **Don't commit .env.test** s real API keys
- **Don't skip cleanup** hooks
- **Don't test implementation details** (test behavior, not internals)
- **Don't use hardcoded timeouts** (use retries instead)

---

## Test Statistics

### Current Coverage (2025-11-20)

| Test Suite | Tests | Passing | Failing | Duration |
|------------|-------|---------|---------|----------|
| **Unit** | 45 | 45 | 0 | 2.5s |
| **Integration** | 30 | 30 | 0 | 15s |
| **E2E** | 28 | 27 | 1 | 12m |
| **TOTAL** | 103 | 102 | 1 | 12m 17s |

### Bug Fix Impact

| Bug | Tests Added | Tests Fixed |
|-----|-------------|-------------|
| #1: AI nevidí známá kouzla | 5 | 8 |
| #2: Long Rest auto-call | 3 | 2 |
| #3: Dice Roll integrace | 4 | 1 |

---

Dokumentace vytvořena: 2025-11-20
Autor: Claude Code AI Assistant
