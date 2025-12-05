# E2E Test: Stat Bonusy z Vybavení v UI

**Datum:** 2025-11-27
**Status:** PLANNED
**Cíl:** Ověřit, že effectiveStats z propojeného vybavení se správně zobrazují v CharacterSheet UI

---

## Popis testu

Test ověřuje kompletní flow změny statistik postavy na základě magického předmětu:
1. Postava má základní STR 15
2. Po propojení "Ring of Strength +2" se STR změní na 17
3. UI správně zobrazuje efektivní hodnotu a vizuální indikaci bonusu

---

## Testovací scénáře

### Scénář 1: Základní statistiky bez vybavení
- Vytvořit postavu s STR 15
- Ověřit, že UI zobrazuje STR: 15 (+2)

### Scénář 2: Nasazený předmět bez attunementu
- Přidat Ring of Strength +2 (requiresAttunement: true)
- Nasadit předmět
- Ověřit, že STR zůstává 15 (bonus se neaplikuje bez attunementu)

### Scénář 3: Propojený předmět s bonusem
- Propojit předmět (attune)
- Ověřit, že STR se změnila na 17 (+3)
- Ověřit vizuální indikaci (zelený badge "+2")

### Scénář 4: Odpojení předmětu
- Odpojit předmět (unattune)
- Ověřit, že STR se vrátila na 15 (+2)

---

## Implementace testu

**Soubor:** `frontend/tests/e2e/stat-bonuses-equipment.spec.ts`

```typescript
import { test, expect, Page } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'
const API_URL = 'http://localhost:3000/api'

// Testovací uživatel
const TEST_USER = {
  email: 'aitest2@dnd.test',
  password: 'TestPassword123!'
}

interface TestContext {
  authToken: string
  characterId: string
  itemId: string
}

const context: TestContext = {
  authToken: '',
  characterId: '',
  itemId: ''
}

test.describe('Stat Bonuses from Equipment in UI', () => {

  test.beforeAll(async ({ request }) => {
    // Přihlášení přes API
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: {
        emailOrUsername: TEST_USER.email,
        password: TEST_USER.password
      }
    })
    const loginData = await loginResponse.json()
    context.authToken = loginData.data.token

    // Vytvoření testovací postavy s STR 15
    const charResponse = await request.post(`${API_URL}/characters`, {
      headers: { Authorization: `Bearer ${context.authToken}` },
      data: {
        name: `StatBonus Tester ${Date.now()}`,
        race: 'Human',
        class: 'Fighter',
        strength: 15,
        dexterity: 14,
        constitution: 13,
        intelligence: 12,
        wisdom: 10,
        charisma: 8
      }
    })
    const charData = await charResponse.json()
    context.characterId = charData.data.id
  })

  test.afterAll(async ({ request }) => {
    // Cleanup - smazat testovací postavu
    if (context.characterId) {
      await request.delete(`${API_URL}/characters/${context.characterId}`, {
        headers: { Authorization: `Bearer ${context.authToken}` }
      })
    }
  })

  test('should display base STR 15 without equipment', async ({ page }) => {
    // Přihlášení přes UI
    await page.goto(`${BASE_URL}/login`)
    await page.fill('[data-testid="login-email-or-username-input"]', TEST_USER.email)
    await page.fill('[data-testid="login-password-input"]', TEST_USER.password)
    await page.click('[data-testid="submit-login-button"]')

    // Počkat na přesměrování
    await page.waitForURL('**/')

    // Přejít na profil/postavu
    await page.goto(`${BASE_URL}/profile`)
    await page.waitForTimeout(1000)

    // Kliknout na postavu
    await page.click(`[data-testid="select-character-${context.characterId}"]`)
    await page.waitForTimeout(500)

    // Ověřit základní STR hodnotu
    const strStatBlock = page.locator('.stat-block').filter({ hasText: /SÍL|STR/i })
    await expect(strStatBlock.locator('.text-4xl')).toContainText('15')
  })

  test('should not apply bonus when item is equipped but not attuned', async ({ request, page }) => {
    // Přidat magický předmět přes API
    const itemResponse = await request.post(
      `${API_URL}/characters/${context.characterId}/inventory`,
      {
        headers: { Authorization: `Bearer ${context.authToken}` },
        data: {
          name: 'Ring of Strength +2',
          type: 'accessory',
          rarity: 'rare',
          requiresAttunement: true,
          statBonuses: { strength: 2 }
        }
      }
    )
    const itemData = await itemResponse.json()
    context.itemId = itemData.data.id

    // Nasadit předmět
    await request.post(
      `${API_URL}/characters/${context.characterId}/inventory/${context.itemId}/equip`,
      { headers: { Authorization: `Bearer ${context.authToken}` } }
    )

    // Refresh stránky
    await page.reload()
    await page.waitForTimeout(1000)

    // STR by měla být stále 15 (předmět není attuned)
    const strStatBlock = page.locator('.stat-block').filter({ hasText: /SÍL|STR/i })
    await expect(strStatBlock.locator('.text-4xl')).toContainText('15')

    // Bonus badge by neměl být viditelný
    await expect(strStatBlock.locator('.bg-fantasy-emerald')).not.toBeVisible()
  })

  test('should apply bonus and show visual indicator when item is attuned', async ({ request, page }) => {
    // Propojit předmět
    await request.post(
      `${API_URL}/characters/${context.characterId}/inventory/${context.itemId}/attune`,
      { headers: { Authorization: `Bearer ${context.authToken}` } }
    )

    // Refresh stránky
    await page.reload()
    await page.waitForTimeout(1000)

    // STR by měla být 17 (15 + 2)
    const strStatBlock = page.locator('.stat-block').filter({ hasText: /SÍL|STR/i })
    await expect(strStatBlock.locator('.text-4xl')).toContainText('17')

    // Bonus badge by měl být viditelný s "+2"
    await expect(strStatBlock.locator('.bg-fantasy-emerald')).toBeVisible()
    await expect(strStatBlock.locator('.bg-fantasy-emerald')).toContainText('+2')

    // Modifikátor by měl být +3
    await expect(strStatBlock.locator('.rounded-full')).toContainText('+3')
  })

  test('should remove bonus when item is unattuned', async ({ request, page }) => {
    // Odpojit předmět
    await request.post(
      `${API_URL}/characters/${context.characterId}/inventory/${context.itemId}/unattune`,
      { headers: { Authorization: `Bearer ${context.authToken}` } }
    )

    // Refresh stránky
    await page.reload()
    await page.waitForTimeout(1000)

    // STR by měla být zpět na 15
    const strStatBlock = page.locator('.stat-block').filter({ hasText: /SÍL|STR/i })
    await expect(strStatBlock.locator('.text-4xl')).toContainText('15')

    // Bonus badge by neměl být viditelný
    await expect(strStatBlock.locator('.bg-fantasy-emerald')).not.toBeVisible()
  })

})
```

---

## Lokátory pro StatBlock

| Element | Lokátor |
|---------|---------|
| StatBlock container | `.stat-block` |
| StatBlock s bonusem | `.ring-fantasy-emerald` |
| Bonus badge | `.bg-fantasy-emerald` (absolutní pozice -top-2 -right-2) |
| Hodnota statistiky | `.text-4xl` |
| Modifikátor | `.rounded-full` (absolutní pozice bottom-2) |
| Label (SÍL/STR) | `.text-xs.uppercase` |

---

## Prerekvizity

1. Backend běží na `localhost:3000`
2. Frontend běží na `localhost:5173`
3. Testovací uživatel `aitest2@dnd.test` existuje
4. Oprava BUG-001 je implementována (effectiveStats v API)

---

## Spuštění testu

```bash
# Z frontend adresáře
cd frontend
npx playwright test stat-bonuses-equipment.spec.ts --headed

# Nebo s MCP Playwright
# Použít mcp__playwright__browser_navigate a další MCP nástroje
```

---

## Očekávané výsledky

| Test | Očekávaný výsledek |
|------|-------------------|
| Base STR without equipment | STR: 15 (+2), žádný badge |
| Equipped but not attuned | STR: 15 (+2), žádný badge |
| Attuned with bonus | STR: 17 (+3), zelený badge "+2" |
| Unattuned | STR: 15 (+2), žádný badge |

---

## Alternativa: Test přes Playwright MCP

Pro interaktivní testování přes MCP Playwright:

1. `mcp__playwright__browser_navigate` → login stránka
2. `mcp__playwright__browser_fill_form` → přihlášení
3. `mcp__playwright__browser_click` → navigace na postavu
4. `mcp__playwright__browser_snapshot` → ověření STR hodnoty
5. API volání pro equip/attune
6. `mcp__playwright__browser_snapshot` → ověření změny

---

## Kritické soubory

| Soubor | Účel |
|--------|------|
| `frontend/tests/e2e/stat-bonuses-equipment.spec.ts` | Nový test soubor |
| `frontend/src/components/character/StatBlock.vue` | Komponenta s bonus indikací |
| `frontend/src/components/character/CharacterSheet.vue` | Zobrazení statistik |
| `frontend/playwright.config.ts` | Playwright konfigurace |
