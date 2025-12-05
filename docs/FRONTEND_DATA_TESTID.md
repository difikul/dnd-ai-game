# Frontend Data-TestID Dokumentace

Datum: 2025-11-20

Tento dokument obsahuje kompletní seznam všech `data-testid` atributů použitých ve frontend komponentách pro E2E testování s Playwright.

---

## 📋 Table of Contents

1. [Authentication Views](#authentication-views)
2. [Character Management](#character-management)
3. [Game Session](#game-session)
4. [Profile & Settings](#profile--settings)
5. [Naming Conventions](#naming-conventions)

---

## Authentication Views

### LoginView.vue

| Test ID | Element | Purpose |
|---------|---------|---------|
| `login-email-or-username-input` | Input field | Zadání emailu nebo username |
| `login-password-input` | Input field | Zadání hesla |
| `submit-login-button` | Button | Odeslání login formuláře |

**Lokace:** `/home/scoreone/dnd/frontend/src/views/LoginView.vue`

**Příklad použití (Playwright):**
```typescript
await page.fill('[data-testid="login-email-or-username-input"]', 'gandalf@test.com')
await page.fill('[data-testid="login-password-input"]', 'Password123!')
await page.click('[data-testid="submit-login-button"]')
```

---

### RegisterView.vue

| Test ID | Element | Purpose |
|---------|---------|---------|
| `register-email-input` | Input field | Zadání emailu |
| `register-username-input` | Input field | Zadání username |
| `register-password-input` | Input field | Zadání hesla |
| `register-confirm-password-input` | Input field | Potvrzení hesla |
| `register-gemini-api-key-input` | Input field | Zadání Gemini API klíče |
| `submit-registration-button` | Button | Odeslání registračního formuláře |

**Lokace:** `/home/scoreone/dnd/frontend/src/views/RegisterView.vue`

**Příklad použití (Playwright):**
```typescript
await page.fill('[data-testid="register-email-input"]', 'new@user.com')
await page.fill('[data-testid="register-username-input"]', 'newuser')
await page.fill('[data-testid="register-password-input"]', 'SecurePass123!')
await page.fill('[data-testid="register-confirm-password-input"]', 'SecurePass123!')
await page.fill('[data-testid="register-gemini-api-key-input"]', 'AIzaSy...')
await page.click('[data-testid="submit-registration-button"]')
```

---

## Character Management

### CharacterCreator.vue

| Test ID | Element | Purpose |
|---------|---------|---------|
| `character-name-input` | Input field | Zadání jména postavy |
| `create-character-button` | Button | Vytvoření nové postavy |

**Lokace:** `/home/scoreone/dnd/frontend/src/components/character/CharacterCreator.vue`

**Příklad použití (Playwright):**
```typescript
await page.fill('[data-testid="character-name-input"]', 'Gandalf')
// Select race and class (implementation specific)
await page.click('[data-testid="create-character-button"]')
```

---

### CharacterList.vue

| Test ID | Element | Purpose |
|---------|---------|---------|
| `select-character-${character.id}` | Button | Výběr postavy pro hru (dynamický ID) |

**Lokace:** `/home/scoreone/dnd/frontend/src/components/character/CharacterList.vue`

**Příklad použití (Playwright):**
```typescript
// Dynamický selector podle ID postavy
await page.click('[data-testid="select-character-abc123"]')

// Nebo pomocí pattern matchingu
await page.click('[data-testid^="select-character-"]')
```

**Poznámka:** Test ID obsahuje dynamický `character.id` - při testování je třeba znát konkrétní ID nebo použít CSS selector pattern.

---

### CharacterSheet.vue

| Test ID | Element | Purpose |
|---------|---------|---------|
| `character-hp-display` | Container | HP display container |
| `character-current-hp` | Text element | Zobrazení aktuálních HP |
| `character-max-hp` | Text element | Zobrazení maximálních HP |
| `character-ac-display` | Container | AC display container |
| `character-ac-value` | Text element | Hodnota Armor Class |

**Lokace:** `/home/scoreone/dnd/frontend/src/components/character/CharacterSheet.vue`

**Příklad použití (Playwright):**
```typescript
// Načti aktuální HP
const currentHP = await page.textContent('[data-testid="character-current-hp"]')
const maxHP = await page.textContent('[data-testid="character-max-hp"]')

// Načti AC
const ac = await page.textContent('[data-testid="character-ac-value"]')

// Verifikuj HP range
expect(parseInt(currentHP)).toBeLessThanOrEqual(parseInt(maxHP))
```

---

## Game Session

### HomeView.vue

| Test ID | Element | Purpose |
|---------|---------|---------|
| `start-new-game-button` | Button | Začátek nové herní session |
| `load-token-input` | Input field | Zadání load tokenu pro existující hru |
| `load-game-by-token-button` | Button | Načtení hry podle tokenu |

**Lokace:** `/home/scoreone/dnd/frontend/src/views/HomeView.vue`

**Příklad použití (Playwright):**
```typescript
// Start new game
await page.click('[data-testid="start-new-game-button"]')

// Load existing game
await page.fill('[data-testid="load-token-input"]', 'abc123-token')
await page.click('[data-testid="load-game-by-token-button"]')
```

---

### GameView.vue

| Test ID | Element | Purpose |
|---------|---------|---------|
| `open-dice-roller-button` | Button | Otevření dice roller komponenty |
| `save-game-button` | Button | Uložení aktuální hry |
| `leave-game-button` | Button | Opuštění herní session |

**Lokace:** `/home/scoreone/dnd/frontend/src/views/GameView.vue`

**Příklad použití (Playwright):**
```typescript
// Open dice roller
await page.click('[data-testid="open-dice-roller-button"]')

// Save game
await page.click('[data-testid="save-game-button"]')
await page.waitForSelector('.success-message') // Wait for confirmation

// Leave game
await page.click('[data-testid="leave-game-button"]')
await page.waitForURL('/home') // Verify redirect
```

---

### GameChat.vue

| Test ID | Element | Purpose |
|---------|---------|---------|
| `narrator-messages-container` | Container | Kontejner pro AI narrator zprávy |
| `action-input` | Textarea | Input pole pro player actions |
| `submit-action-button` | Button | Odeslání player akce |

**Lokace:** `/home/scoreone/dnd/frontend/src/components/game/GameChat.vue`

**Příklad použití (Playwright):**
```typescript
// Odeslání akce
await page.fill('[data-testid="action-input"]', 'Podívám se kolem sebe')
await page.click('[data-testid="submit-action-button"]')

// Počkej na AI response
await page.waitForSelector('[data-testid="narrator-messages-container"] .message-bubble', {
  state: 'attached'
})

// Načti poslední narrator zprávu
const messages = await page.locator('[data-testid="narrator-messages-container"] .message-bubble').all()
const lastMessage = messages[messages.length - 1]
const narratorText = await lastMessage.textContent()
```

---

### DiceRoller.vue

| Test ID | Element | Purpose |
|---------|---------|---------|
| `roll-dice-button` | Button | Hod kostkou podle AI požadavku |
| `dice-roll-result` | Container | Kontejner pro výsledek hodu |
| `dice-roll-total` | Text element | Celkový výsledek hodu |

**Lokace:** `/home/scoreone/dnd/frontend/src/components/game/DiceRoller.vue`

**Příklad použití (Playwright):**
```typescript
// Otevři dice roller
await page.click('[data-testid="open-dice-roller-button"]')

// Hod kostkou (AI requirement)
await page.click('[data-testid="roll-dice-button"]')

// Počkej na výsledek
await page.waitForSelector('[data-testid="dice-roll-result"]', { state: 'visible' })

// Načti celkový výsledek
const total = await page.textContent('[data-testid="dice-roll-total"]')
console.log(`Rolled: ${total}`)

// Verifikuj range (např. 1d20 = 1-20)
expect(parseInt(total)).toBeGreaterThanOrEqual(1)
expect(parseInt(total)).toBeLessThanOrEqual(20)
```

---

## Profile & Settings

### ProfileView.vue

| Test ID | Element | Purpose |
|---------|---------|---------|
| `profile-gemini-api-key-input` | Input field | Zadání/úprava Gemini API klíče |
| `save-gemini-api-key-button` | Button | Uložení API klíče |

**Lokace:** `/home/scoreone/dnd/frontend/src/views/ProfileView.vue`

**Příklad použití (Playwright):**
```typescript
await page.fill('[data-testid="profile-gemini-api-key-input"]', 'AIzaSy...')
await page.click('[data-testid="save-gemini-api-key-button"]')
await page.waitForSelector('.success-message') // Wait for confirmation
```

---

## Naming Conventions

### Struktura Test ID

Aplikace používá **konzistentní naming pattern**:

```
{component}-{element}-{type}
```

**Příklady:**
- `login-email-input` → Login view, email input field
- `character-hp-display` → Character sheet, HP display container
- `submit-action-button` → Game chat, submit button

### Typy elementů

| Suffix | Element Type |
|--------|--------------|
| `-input` | Input field (text, email, password) |
| `-button` | Button (submit, action, navigation) |
| `-container` | Container/wrapper element |
| `-display` | Read-only display element |
| `-value` | Specific value element |

### Dynamické Test IDs

Některé komponenty používají **dynamické test IDs** s interpolací:

```vue
:data-testid="`select-character-${character.id}`"
```

**Playwright selector strategie:**
```typescript
// Option 1: Exact ID (pokud znáš ID)
await page.click('[data-testid="select-character-abc123"]')

// Option 2: Pattern matching (pro dynamické IDs)
await page.click('[data-testid^="select-character-"]')

// Option 3: nth-child (pro první match)
await page.click('[data-testid^="select-character-"]:first-of-type')
```

---

## Best Practices

### ✅ DO

1. **Use data-testid for user-facing elements** - Buttons, inputs, containers
2. **Keep IDs stable** - Neměnit test IDs mezi verzemi
3. **Descriptive names** - `save-game-button` místo `btn-1`
4. **Consistent naming** - Dodržovat naming conventions
5. **Test dynamic IDs** - Používat pattern matchers pro dynamické IDs

### ❌ DON'T

1. **Don't use CSS classes** pro testování - CSS může být refactored
2. **Don't use text content** - Text se může měnit (i18n)
3. **Don't use deeply nested selectors** - Fragile testy
4. **Don't test implementation details** - Testuj behavior, ne internals
5. **Don't duplicate test IDs** - Každý ID musí být unique

---

## Playwright Helper Functions

### Často používané patterns

```typescript
// Helper: Fill form fields
async function fillLoginForm(page, email: string, password: string) {
  await page.fill('[data-testid="login-email-or-username-input"]', email)
  await page.fill('[data-testid="login-password-input"]', password)
  await page.click('[data-testid="submit-login-button"]')
}

// Helper: Wait for narrator response
async function waitForNarratorResponse(page) {
  await page.waitForSelector('[data-testid="narrator-messages-container"] .message-bubble:last-child', {
    state: 'attached',
    timeout: 30000 // AI responses can be slow
  })
}

// Helper: Get character HP
async function getCharacterHP(page): Promise<{ current: number, max: number }> {
  const current = await page.textContent('[data-testid="character-current-hp"]')
  const max = await page.textContent('[data-testid="character-max-hp"]')
  return {
    current: parseInt(current),
    max: parseInt(max)
  }
}

// Helper: Roll dice
async function rollDice(page) {
  await page.click('[data-testid="roll-dice-button"]')
  await page.waitForSelector('[data-testid="dice-roll-result"]', { state: 'visible' })
  const total = await page.textContent('[data-testid="dice-roll-total"]')
  return parseInt(total)
}
```

---

## Coverage Statistics

### Komponenty s Data-TestID

| Kategorie | Komponenty s TestID | Total Komponenty | Coverage |
|-----------|---------------------|------------------|----------|
| **Views** | 5 | 16 | 31% |
| **Components** | 4 | 29 | 14% |
| **TOTAL** | 9 | 45 | 20% |

### Priorita pro budoucí TestIDs

**HIGH Priority (kritické pro E2E testy):**
- ✅ Authentication (LoginView, RegisterView)
- ✅ Character Creation (CharacterCreator)
- ✅ Game Session (GameView, GameChat)
- ⏸️ Admin Dashboard views
- ⏸️ Bug Report Modal

**MEDIUM Priority:**
- Race/Class Selectors (RaceSelector.vue, ClassSelector.vue)
- Stat Block display (StatBlock.vue)
- API Quota display (ApiQuotaStatusBar.vue)

**LOW Priority:**
- Visual components (AtmosphericBackground.vue, TypingIndicator.vue)
- Message formatting (MessageBubble.vue)

---

## Kompletní Index

### Alphabetical List

```
action-input                         → GameChat.vue
character-ac-display                 → CharacterSheet.vue
character-ac-value                   → CharacterSheet.vue
character-current-hp                 → CharacterSheet.vue
character-hp-display                 → CharacterSheet.vue
character-max-hp                     → CharacterSheet.vue
character-name-input                 → CharacterCreator.vue
create-character-button              → CharacterCreator.vue
dice-roll-result                     → DiceRoller.vue
dice-roll-total                      → DiceRoller.vue
leave-game-button                    → GameView.vue
load-game-by-token-button            → HomeView.vue
load-token-input                     → HomeView.vue
login-email-or-username-input        → LoginView.vue
login-password-input                 → LoginView.vue
narrator-messages-container          → GameChat.vue
open-dice-roller-button              → GameView.vue
profile-gemini-api-key-input         → ProfileView.vue
register-confirm-password-input      → RegisterView.vue
register-email-input                 → RegisterView.vue
register-gemini-api-key-input        → RegisterView.vue
register-password-input              → RegisterView.vue
register-username-input              → RegisterView.vue
roll-dice-button                     → DiceRoller.vue
save-game-button                     → GameView.vue
save-gemini-api-key-button           → ProfileView.vue
select-character-${character.id}     → CharacterList.vue (dynamic)
start-new-game-button                → HomeView.vue
submit-action-button                 → GameChat.vue
submit-login-button                  → LoginView.vue
submit-registration-button           → RegisterView.vue
```

**Total:** 31 unique test IDs (včetně 1 dynamického)

---

Dokumentace vytvořena: 2025-11-20
Autor: Claude Code AI Assistant
