# D&D AI Game - Testing Guide

Kompletní průvodce testováním pro D&D AI Game projekt s Vitest, Vue Test Utils a Playwright.

## Obsah

1. [Rychlý start](#rychlý-start)
2. [Test infrastruktura](#test-infrastruktura)
3. [Spouštění testů](#spouštění-testů)
4. [Psaní testů](#psaní-testů)
5. [Coverage requirements](#coverage-requirements)
6. [Best practices](#best-practices)

---

## Rychlý start

### Backend testy

```bash
cd /home/scoreone/dnd/backend

# Spustit všechny testy
npm run test

# Spustit testy s UI
npm run test:ui

# Spustit testy jednou (CI mode)
npm run test:run

# Spustit s coverage reportem
npm run test:coverage

# Watch mode
npm run test:watch
```

### Frontend testy

```bash
cd /home/scoreone/dnd/frontend

# Spustit všechny testy
npm run test

# Spustit testy s UI
npm run test:ui

# Spustit testy jednou (CI mode)
npm run test:run

# Spustit s coverage reportem
npm run test:coverage

# Watch mode
npm run test:watch

# E2E testy (Playwright)
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
```

---

## Test infrastruktura

### Backend Stack

- **Vitest** - Test runner
- **@vitest/ui** - Webové UI pro testy
- **@vitest/coverage-v8** - Coverage reporting
- **Supertest** - HTTP testing
- **@faker-js/faker** - Mock data generation
- **Prisma Test Client** - Database testing

### Frontend Stack

- **Vitest** - Test runner
- **@vue/test-utils** - Vue component testing
- **happy-dom** - DOM environment
- **MSW (Mock Service Worker)** - API mocking
- **Playwright** - E2E testing

---

## Struktura testů

### Backend

```
backend/
├── tests/
│   ├── setup.ts                    # Test setup & Prisma client
│   ├── fixtures/
│   │   └── characters.ts           # Mock character data
│   ├── unit/
│   │   ├── utils/
│   │   │   └── dice.test.ts        # Dice utils tests
│   │   ├── services/               # Service tests
│   │   └── middleware/             # Middleware tests
│   └── integration/                # Integration tests
├── vitest.config.ts                # Vitest configuration
└── package.json                    # Test scripts
```

### Frontend

```
frontend/
├── tests/
│   ├── setup.ts                    # Test setup & MSW server
│   ├── fixtures/
│   │   └── mockData.ts             # Mock data (characters, sessions, dice)
│   ├── unit/
│   │   ├── composables/
│   │   │   └── useDice.test.ts     # Composable tests
│   │   ├── utils/                  # Utility tests
│   │   └── stores/                 # Store tests
│   ├── integration/                # Integration tests
│   └── e2e/                        # Playwright E2E tests
├── vitest.config.ts                # Vitest configuration
└── package.json                    # Test scripts
```

---

## Spouštění testů

### Development workflow

```bash
# 1. Backend - watch mode
cd backend
npm run test:watch

# 2. Frontend - watch mode
cd frontend
npm run test:watch

# 3. Full coverage check
cd backend && npm run test:coverage
cd frontend && npm run test:coverage
```

### CI/CD workflow

```bash
# Backend
cd backend
npm run test:run
npm run test:coverage

# Frontend
cd frontend
npm run test:run
npm run test:coverage
npm run test:e2e
```

### Test database (optional pro integration tests)

```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run migrations
cd backend
DATABASE_URL_TEST=postgresql://test_user:test_pass@localhost:5433/dnd_test npx prisma migrate dev

# Stop test database
docker-compose -f docker-compose.test.yml down
```

---

## Psaní testů

### Backend Unit Test Example (dice.test.ts)

```typescript
import { describe, it, expect, vi } from 'vitest'
import { rollDice, parseDiceNotation } from '@/utils/dice'

describe('Dice Utilities', () => {
  describe('parseDiceNotation', () => {
    it('should parse basic dice notation (1d20)', () => {
      const result = parseDiceNotation('1d20')

      expect(result.count).toBe(1)
      expect(result.sides).toBe(20)
      expect(result.modifier).toBe(0)
    })

    it('should throw error for invalid notation', () => {
      expect(() => parseDiceNotation('invalid')).toThrow('Invalid dice notation')
    })
  })

  describe('rollDice', () => {
    it('should return complete dice roll result', () => {
      const result = rollDice('1d20+5')

      expect(result.notation).toBe('1d20+5')
      expect(result.rolls).toHaveLength(1)
      expect(result.total).toBe(result.rolls[0] + 5)
    })

    it('should mock random for deterministic tests', () => {
      const mockRandom = vi.spyOn(Math, 'random')
      mockRandom.mockReturnValueOnce(0.7) // (0.7 * 20) + 1 = 15

      const result = rollDice('1d20')

      expect(result.rolls[0]).toBe(15)
      mockRandom.mockRestore()
    })
  })
})
```

### Frontend Composable Test Example (useDice.test.ts)

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useDice } from '@/composables/useDice'
import { server } from '../../setup'
import { http, HttpResponse } from 'msw'

describe('useDice Composable', () => {
  beforeEach(() => {
    server.resetHandlers()
  })

  it('should successfully roll dice and add to history', async () => {
    // Mock API response
    server.use(
      http.post('http://localhost:3000/api/dice/roll', () => {
        return HttpResponse.json({
          success: true,
          data: {
            notation: '1d20+5',
            rolls: [15],
            total: 20
          }
        })
      })
    )

    const { rollDice, rollHistory } = useDice()

    const result = await rollDice('1d20+5')

    expect(result?.total).toBe(20)
    expect(rollHistory.value).toHaveLength(1)
  })
})
```

### Frontend Component Test Example

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DiceRoller from '@/components/DiceRoller.vue'

describe('DiceRoller Component', () => {
  it('should render dice buttons', () => {
    const wrapper = mount(DiceRoller)

    expect(wrapper.find('[data-testid="d20-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="d6-button"]').exists()).toBe(true)
  })

  it('should emit roll event on button click', async () => {
    const wrapper = mount(DiceRoller)

    await wrapper.find('[data-testid="d20-button"]').trigger('click')

    expect(wrapper.emitted('roll')).toBeTruthy()
  })
})
```

---

## Coverage Requirements

### Minimum thresholds

```javascript
{
  statements: 70,
  branches: 65,
  functions: 70,
  lines: 70
}
```

### Co testovat prioritně

1. **Critical D&D mechanics**
   - Dice rolling (all dice types, advantage/disadvantage)
   - Ability score calculations
   - Attack rolls & damage calculations
   - Saving throws
   - Leveling up logic

2. **Business logic**
   - Character creation
   - Game session management
   - Inventory management
   - Quest tracking

3. **API endpoints**
   - Character CRUD operations
   - Game session endpoints
   - Dice rolling API
   - AI narrator integration

4. **User interactions**
   - Character creation flow
   - Dice rolling UI
   - Chat interface
   - Save/Load game

---

## Best Practices

### 1. Test Structure (AAA Pattern)

```typescript
it('should calculate ability modifier correctly', () => {
  // Arrange
  const abilityScore = 16

  // Act
  const modifier = calculateAbilityModifier(abilityScore)

  // Assert
  expect(modifier).toBe(3)
})
```

### 2. Descriptive Test Names

```typescript
// Good
it('should return critical hit for natural 20')
it('should throw error for invalid dice notation')
it('should apply racial bonuses to ability scores')

// Bad
it('test 1')
it('works correctly')
it('rolls dice')
```

### 3. Mock External Dependencies

```typescript
// Mock Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    character: {
      create: vi.fn(),
      findMany: vi.fn()
    }
  }))
}))

// Mock API calls
server.use(
  http.get('http://localhost:3000/api/characters', () => {
    return HttpResponse.json({ success: true, data: [] })
  })
)

// Mock Math.random for dice rolls
const mockRandom = vi.spyOn(Math, 'random')
mockRandom.mockReturnValue(0.95) // Natural 20
```

### 4. Test Edge Cases

```typescript
describe('Dice Rolling', () => {
  it('should handle minimum roll (natural 1)')
  it('should handle maximum roll (natural 20)')
  it('should handle negative modifiers')
  it('should handle zero modifier')
  it('should handle multiple dice (2d6, 3d8)')
  it('should throw error for invalid dice count (0, 101)')
  it('should throw error for invalid dice type (d7, d13)')
})
```

### 5. Test Isolation

```typescript
beforeEach(() => {
  // Clean database before each test
  // Reset mocks
  // Clear state
})

afterEach(() => {
  // Cleanup
  vi.clearAllMocks()
})
```

### 6. Fixtures Usage

```typescript
import { mockCharacter, mockWizard, mockFighter } from '../fixtures/characters'

it('should create character with correct stats', () => {
  const character = createCharacter(mockWizard)

  expect(character.intelligence).toBe(15)
  expect(character.hitPoints).toBe(8)
})
```

---

## Coverage Reporting

### View HTML Report

```bash
# Backend
cd backend
npm run test:coverage
open coverage/index.html

# Frontend
cd frontend
npm run test:coverage
open coverage/index.html
```

### CI Integration

```bash
# Generate LCOV report for CI tools
npm run test:coverage

# Coverage files:
# - coverage/lcov.info
# - coverage/coverage-final.json
```

---

## Troubleshooting

### Tests failing randomly

- Use `vi.mock()` pro deterministické testy
- Vyhni se závislosti na časování (použij `vi.useFakeTimers()`)
- Ujisti se, že testy jsou izolované (cleanup mezi testy)

### Database tests failing

```bash
# Reset test database
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d

# Run migrations
cd backend
DATABASE_URL_TEST=postgresql://test_user:test_pass@localhost:5433/dnd_test npx prisma migrate dev
```

### MSW not intercepting requests

```typescript
// Ujisti se, že server běží
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' })
})

// Reset handlers po každém testu
afterEach(() => {
  server.resetHandlers()
})

// Zavři server po všech testech
afterAll(() => {
  server.close()
})
```

---

## Next Steps

1. **Phase 2**: Unit testy pro všechny utility funkce
2. **Phase 3**: Service layer testy
3. **Phase 4**: API endpoint integration tests
4. **Phase 5**: Frontend store testy
5. **Phase 6**: Component testy
6. **Phase 7**: E2E user journeys
7. **Phase 8**: Performance & load testing

---

## Užitečné odkazy

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [MSW Documentation](https://mswjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Faker.js Documentation](https://fakerjs.dev/)

---

## Kontakt

Pro otázky nebo problémy s testy, kontaktuj tým nebo vytvoř issue v repozitáři.
