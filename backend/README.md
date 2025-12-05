# Backend - D&D AI Game API

Backend API pro D&D AI aplikaci s Google Gemini narrator.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 16
- **AI**: Google Gemini 2.0 Flash
- **Validation**: Zod
- **Authentication**: JWT + bcrypt
- **Testing**: Vitest (unit/integration) + Playwright (E2E)

---

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts             # Seed data
│   └── migrations/         # Database migrations
├── src/
│   ├── server.ts           # Express server entry point
│   ├── app.ts              # App configuration
│   ├── controllers/        # Route handlers
│   │   ├── authController.ts
│   │   ├── characterController.ts
│   │   ├── gameController.ts
│   │   ├── diceController.ts
│   │   └── saveController.ts
│   ├── services/           # Business logic
│   │   ├── authService.ts
│   │   ├── characterService.ts
│   │   ├── gameService.ts
│   │   ├── geminiService.ts
│   │   ├── contextService.ts
│   │   └── saveService.ts
│   ├── routes/             # API routes
│   │   ├── authRoutes.ts
│   │   ├── characterRoutes.ts
│   │   ├── gameRoutes.ts
│   │   ├── diceRoutes.ts
│   │   └── saveRoutes.ts
│   ├── middleware/         # Express middleware
│   │   ├── authMiddleware.ts
│   │   ├── errorHandler.ts
│   │   └── validation.middleware.ts
│   ├── types/              # TypeScript types
│   │   ├── api.types.ts
│   │   ├── game.types.ts
│   │   └── character.types.ts
│   ├── config/             # Configuration
│   │   └── gemini.config.ts
│   └── utils/              # Utility functions
│       └── dice.ts
├── tests/                  # Test suites
│   ├── unit/               # Unit tests (Vitest)
│   ├── integration/        # Integration tests (Vitest + Supertest)
│   └── e2e/                # E2E tests (Playwright)
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── Dockerfile
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 16+ (nebo Docker)
- Google Gemini API key

### Installation

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edituj .env a přidej DATABASE_URL a GEMINI_API_KEY
```

### Development

```bash
# Start dev server (hot reload)
npm run dev

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed

# Open Prisma Studio
npm run prisma:studio
```

Server běží na `http://localhost:3000`.

---

## 🧪 Testing

Backend má 3-tier testing strategii: **Unit Tests** (Vitest), **Integration Tests** (Vitest + Supertest), **E2E Tests** (Playwright).

📖 **Viz [../docs/TESTING.md](../docs/TESTING.md)** pro kompletní testing guide.

### Quick Start

#### Unit Tests

```bash
# Watch mode (development)
npm run test:unit:watch

# Single run (CI)
npm run test:unit
```

**Co testujeme:**
- Business logic (services)
- Utility functions (dice, calculations)
- Middleware (validation, auth)

**Příklad:**
```typescript
// tests/unit/utils/dice.test.ts
import { describe, it, expect } from 'vitest'
import { rollDice, parseDiceNotation } from '@/utils/dice'

describe('Dice Utils', () => {
  it('should parse 1d20+3', () => {
    const result = parseDiceNotation('1d20+3')
    expect(result).toEqual({
      count: 1,
      sides: 20,
      modifier: 3
    })
  })
})
```

---

#### Integration Tests

```bash
# Start test database
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

**Co testujeme:**
- HTTP Request/Response
- Database operations (CRUD)
- Authentication/Authorization
- Validation schemas
- Service layer integrace

**Příklad:**
```typescript
// tests/integration/game.api.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import app from '@/app'

describe('Game API - POST /api/game/session/:id/action', () => {
  let authToken: string
  let sessionId: string

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password123!' })
    authToken = loginRes.body.token
  })

  it('should process player action', async () => {
    const response = await request(app)
      .post(`/api/game/session/${sessionId}/action`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        action: 'Podívám se kolem sebe',
        characterId: 'test-character-id'
      })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('text')
  })
})
```

---

#### E2E Tests

```bash
# Start all services
docker-compose up -d

# Run E2E tests
npm run test:e2e

# With UI
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# View report
npm run test:e2e:report
```

**Co testujeme:**
- AI Integration (Gemini API responses)
- Game Flow (Character creation → Session → Actions → Combat → Long Rest)
- Spell Casting (Known spells, spell slots, AI validation)
- Dice Rolling (AI dice requirements, frontend integration)
- State Management (Database persistence across actions)

**Příklad:**
```typescript
// tests/e2e/game-flow-simple.spec.ts
import { test, expect } from '@playwright/test'

test('should accept known spell (Fire Bolt)', async ({ request }) => {
  const response = await request.post(`/api/game/session/${sessionId}/action`, {
    headers: { 'Authorization': `Bearer ${authToken}` },
    data: {
      action: 'Hodím Fire Bolt na goblin',
      characterId
    }
  })

  expect(response.ok()).toBeTruthy()
  const body = await response.json()
  expect(body.text.toLowerCase()).not.toContain('nemáš to kouzlo')
})
```

---

### Test Database

**Production DB**: `localhost:5432`
**Test DB**: `localhost:5433`

```bash
# Connection string
DATABASE_URL=postgresql://test_user:test_pass@localhost:5433/dnd_test
```

Test database je automaticky izolovaná a čistí se po každém test run.

---

### Coverage Reports

```bash
# Generate coverage
npm run test:coverage

# View report
open coverage/index.html
```

**Current Coverage:**

| Category | Target | Current |
|----------|--------|---------|
| Statements | 80% | 75% |
| Branches | 75% | 70% |
| Functions | 80% | 72% |
| Lines | 80% | 75% |

---

### Test Statistics

| Test Suite | Tests | Passing | Duration |
|------------|-------|---------|----------|
| **Unit** | 45 | 45 ✅ | 2.5s |
| **Integration** | 30 | 30 ✅ | 15s |
| **E2E** | 28 | 27 ✅ | 12m |
| **TOTAL** | 103 | 102 ✅ | 12m 17s |

---

## 📝 API Documentation

**Base URL:** `http://localhost:3000/api`

### Authentication

#### POST `/api/auth/register`
Registrace nového uživatele.

**Request:**
```json
{
  "email": "player@example.com",
  "username": "player123",
  "password": "SecurePass123!",
  "geminiApiKey": "AIzaSy..." (optional)
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "abc123",
    "email": "player@example.com",
    "username": "player123"
  }
}
```

#### POST `/api/auth/login`
Přihlášení existujícího uživatele.

**Request:**
```json
{
  "email": "player@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "abc123",
    "email": "player@example.com",
    "username": "player123"
  }
}
```

---

### Characters

#### POST `/api/characters`
Vytvoření nové postavy.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "Gandalf",
  "race": "Human",
  "class": "Wizard",
  "level": 1,
  "strength": 8,
  "dexterity": 10,
  "constitution": 12,
  "intelligence": 15,
  "wisdom": 13,
  "charisma": 14,
  "background": "Sage",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Response:**
```json
{
  "id": "char123",
  "name": "Gandalf",
  "race": "Human",
  "class": "Wizard",
  "level": 1,
  "maxHitPoints": 8,
  "currentHitPoints": 8,
  "armorClass": 10,
  "strength": 8,
  "dexterity": 10,
  "constitution": 12,
  "intelligence": 15,
  "wisdom": 13,
  "charisma": 14,
  "createdAt": "2025-11-20T12:00:00.000Z"
}
```

#### GET `/api/characters/:id`
Načtení postavy podle ID.

#### PUT `/api/characters/:id`
Aktualizace postavy.

#### DELETE `/api/characters/:id`
Smazání postavy.

---

### Game Session

#### POST `/api/game/start`
Zahájení nové herní session.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "characterId": "char123"
}
```

**Response:**
```json
{
  "sessionId": "session123",
  "characterId": "char123",
  "messages": [
    {
      "role": "narrator",
      "text": "Vítej v magickém světě...",
      "timestamp": "2025-11-20T12:00:00.000Z"
    }
  ]
}
```

#### POST `/api/game/session/:id/action`
Odeslání player akce do AI.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "action": "Podívám se kolem sebe",
  "characterId": "char123",
  "diceRollResult": 18 // (optional) Výsledek hodu kostkou
}
```

**Response:**
```json
{
  "text": "Rozhlédneš se po okolí...",
  "timestamp": "2025-11-20T12:00:05.000Z",
  "metadata": {
    "requiresDiceRoll": false
  }
}
```

**Dice Roll Response (pokud AI požaduje hod):**
```json
{
  "text": "Pro útok hoď 1d20+3 (DC 15)",
  "timestamp": "2025-11-20T12:00:10.000Z",
  "metadata": {
    "requiresDiceRoll": true,
    "diceRequirement": {
      "notation": "1d20+3",
      "dc": 15,
      "skillName": "Attack Roll",
      "description": "Útok na goblin"
    }
  }
}
```

#### GET `/api/game/session/:id`
Načtení aktuálního game state.

#### POST `/api/game/session/:id/end`
Ukončení session.

---

### Dice Rolling

#### POST `/api/dice/roll`
Hod kostkou.

**Request:**
```json
{
  "notation": "1d20+5",
  "advantage": false,
  "disadvantage": false
}
```

**Response:**
```json
{
  "total": 18,
  "rolls": [13],
  "modifier": 5,
  "notation": "1d20+5",
  "isCritical": false,
  "isCriticalFail": false
}
```

#### GET `/api/dice/types`
Seznam podporovaných kostek.

**Response:**
```json
{
  "types": [4, 6, 8, 10, 12, 20, 100]
}
```

---

### Save/Load

#### POST `/api/saves/:sessionId`
Uložení hry.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "token": "abc123-def456-ghi789",
  "savedAt": "2025-11-20T12:00:00.000Z"
}
```

#### GET `/api/saves`
Seznam všech uložených her.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "saves": [
    {
      "sessionId": "session123",
      "token": "abc123-def456-ghi789",
      "savedAt": "2025-11-20T12:00:00.000Z",
      "character": {
        "name": "Gandalf",
        "class": "Wizard",
        "level": 3
      }
    }
  ]
}
```

#### GET `/api/saves/token/:token`
Načtení hry podle tokenu.

**Response:**
```json
{
  "sessionId": "session123",
  "characterId": "char123",
  "messages": [...],
  "character": {...}
}
```

#### DELETE `/api/saves/:sessionId`
Smazání uložené hry.

---

## 🔒 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dnd_game?schema=public

# Server
PORT=3000
NODE_ENV=development # development | production | test

# JWT Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Google Gemini API
GEMINI_API_KEY=AIzaSy...

# CORS (development only)
CORS_ORIGIN=http://localhost:5173
```

---

## 📦 Scripts

```bash
# Development
npm run dev                    # Start dev server (hot reload)
npm run build                  # Build for production
npm run start                  # Start production server

# Database
npm run prisma:generate        # Generate Prisma Client
npm run prisma:migrate         # Run migrations
npm run prisma:studio          # Open Prisma Studio
npm run prisma:seed            # Seed database

# Code Quality
npm run lint                   # Run ESLint
npm run type-check             # TypeScript type checking

# Testing
npm test                       # Run all tests
npm run test:ui                # Run tests with UI
npm run test:run               # Single test run (CI)
npm run test:coverage          # Coverage report
npm run test:watch             # Watch mode
npm run test:unit              # Unit tests only
npm run test:unit:watch        # Unit tests watch mode
npm run test:integration       # Integration tests only
npm run test:integration:watch # Integration tests watch mode
npm run test:integration:ui    # Integration tests with UI
npm run test:integration:coverage # Integration tests coverage
npm run test:e2e               # E2E tests
npm run test:e2e:ui            # E2E tests with UI
npm run test:e2e:headed        # E2E tests in browser
npm run test:e2e:debug         # E2E tests debug mode
npm run test:e2e:report        # E2E tests HTML report
```

---

## 🐛 Bug Fixes

Viz [../docs/BUG_FIXES.md](../docs/BUG_FIXES.md) pro seznam opravených bugů:

1. **AI nevidí známá kouzla** (CRITICAL) - Opraveno přidáním `knownSpells` a `spellSlots` do Prisma include
2. **Long Rest automatické volání** (MEDIUM) - Opraveno keyword detection a automatické volání `performLongRest()`
3. **Dice Roll integrace** (MEDIUM) - Opraveno přidáním `diceRollResult` parametru do API

---

## 📚 Documentation

- **[../docs/TESTING.md](../docs/TESTING.md)** - Kompletní testing guide
- **[../docs/BUG_FIXES.md](../docs/BUG_FIXES.md)** - Opravené bugy
- **[../docs/FRONTEND_DATA_TESTID.md](../docs/FRONTEND_DATA_TESTID.md)** - Frontend test IDs
- **[../ARCHITECTURE.md](../ARCHITECTURE.md)** - System architecture
- **[../DEVOPS.md](../DEVOPS.md)** - DevOps dokumentace
- **[../ROADMAP.md](../ROADMAP.md)** - Development roadmap

---

## 🤝 Contributing

Contributions welcome! Prosím dodržuj:

1. **TypeScript strict mode** - Žádné `any` types
2. **Zod validation** - Vždy validuj incoming data
3. **Error handling** - Používej custom Error classes
4. **Testing** - Každý feature musí mít testy (unit + integration + E2E)
5. **Conventional Commits** - `feat:`, `fix:`, `docs:`, `test:`, `chore:`

---

## 📄 License

MIT License - see LICENSE file for details

---

**Happy coding! 🎲⚔️**
