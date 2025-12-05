/**
 * E2E Test: Stat Bonuses from Equipment in UI
 *
 * Ověřuje, že effectiveStats z propojeného vybavení se správně zobrazují
 * v CharacterSheet UI (oprava BUG-001).
 */

import { test, expect } from '@playwright/test'

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
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async ({ request }) => {
    // Přihlášení přes API
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: {
        emailOrUsername: TEST_USER.email,
        password: TEST_USER.password
      }
    })
    expect(loginResponse.ok()).toBeTruthy()
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
    expect(charResponse.ok()).toBeTruthy()
    const charData = await charResponse.json()
    context.characterId = charData.data.id
    console.log(`Created test character: ${context.characterId}`)
  })

  test.afterAll(async ({ request }) => {
    // Cleanup - smazat testovací postavu
    if (context.characterId) {
      await request.delete(`${API_URL}/characters/${context.characterId}`, {
        headers: { Authorization: `Bearer ${context.authToken}` }
      })
      console.log(`Deleted test character: ${context.characterId}`)
    }
  })

  test('should display base STR 15 without equipment', async ({ page }) => {
    // Přihlášení přes UI
    await page.goto(`${BASE_URL}/login`)
    await page.fill('[data-testid="login-email-or-username-input"]', TEST_USER.email)
    await page.fill('[data-testid="login-password-input"]', TEST_USER.password)
    await page.click('[data-testid="submit-login-button"]')

    // Počkat na přesměrování
    await page.waitForURL('**/', { timeout: 10000 })

    // Přejít na profil/postavu
    await page.goto(`${BASE_URL}/profile`)
    await page.waitForTimeout(1000)

    // Kliknout na postavu pro zobrazení detailu
    const charSelector = `[data-testid="select-character-${context.characterId}"]`
    await page.waitForSelector(charSelector, { timeout: 5000 })
    await page.click(charSelector)
    await page.waitForTimeout(500)

    // Ověřit základní STR hodnotu
    const strStatBlock = page.locator('.stat-block').filter({ hasText: /SÍL|STR/i }).first()
    await expect(strStatBlock).toBeVisible()
    const strValue = strStatBlock.locator('.text-4xl')
    await expect(strValue).toContainText('15')

    console.log('✅ Base STR 15 verified')
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
    expect(itemResponse.ok()).toBeTruthy()
    const itemData = await itemResponse.json()
    context.itemId = itemData.data.id
    console.log(`Created item: ${context.itemId}`)

    // Nasadit předmět (POST, not PUT!)
    const equipResponse = await request.post(
      `${API_URL}/characters/${context.characterId}/inventory/${context.itemId}/equip`,
      { headers: { Authorization: `Bearer ${context.authToken}` } }
    )
    expect(equipResponse.ok()).toBeTruthy()
    console.log('Item equipped')

    // Refresh stránky
    await page.reload()
    await page.waitForTimeout(1000)

    // STR by měla být stále 15 (předmět není attuned)
    const strStatBlock = page.locator('.stat-block').filter({ hasText: /SÍL|STR/i }).first()
    await expect(strStatBlock).toBeVisible()
    const strValue = strStatBlock.locator('.text-4xl')
    await expect(strValue).toContainText('15')

    // Bonus badge by neměl být viditelný
    const bonusBadge = strStatBlock.locator('.bg-fantasy-emerald')
    await expect(bonusBadge).not.toBeVisible()

    console.log('✅ STR still 15 when equipped but not attuned')
  })

  test('should apply bonus and show visual indicator when item is attuned', async ({ request, page }) => {
    // Propojit předmět (POST, not PUT!)
    const attuneResponse = await request.post(
      `${API_URL}/characters/${context.characterId}/inventory/${context.itemId}/attune`,
      { headers: { Authorization: `Bearer ${context.authToken}` } }
    )
    expect(attuneResponse.ok()).toBeTruthy()
    console.log('Item attuned')

    // Refresh stránky
    await page.reload()
    await page.waitForTimeout(1000)

    // STR by měla být 17 (15 + 2)
    const strStatBlock = page.locator('.stat-block').filter({ hasText: /SÍL|STR/i }).first()
    await expect(strStatBlock).toBeVisible()
    const strValue = strStatBlock.locator('.text-4xl')
    await expect(strValue).toContainText('17')

    // Bonus badge by měl být viditelný s "+2"
    const bonusBadge = strStatBlock.locator('.bg-fantasy-emerald')
    await expect(bonusBadge).toBeVisible()
    await expect(bonusBadge).toContainText('+2')

    // Modifikátor by měl být +3 (pro STR 17)
    const modifier = strStatBlock.locator('.rounded-full').last()
    await expect(modifier).toContainText('+3')

    console.log('✅ STR 17 with +2 bonus badge when attuned')
  })

  test('should remove bonus when item is unattuned', async ({ request, page }) => {
    // Odpojit předmět (POST, not PUT!)
    const unattuneResponse = await request.post(
      `${API_URL}/characters/${context.characterId}/inventory/${context.itemId}/unattune`,
      { headers: { Authorization: `Bearer ${context.authToken}` } }
    )
    expect(unattuneResponse.ok()).toBeTruthy()
    console.log('Item unattuned')

    // Refresh stránky
    await page.reload()
    await page.waitForTimeout(1000)

    // STR by měla být zpět na 15
    const strStatBlock = page.locator('.stat-block').filter({ hasText: /SÍL|STR/i }).first()
    await expect(strStatBlock).toBeVisible()
    const strValue = strStatBlock.locator('.text-4xl')
    await expect(strValue).toContainText('15')

    // Bonus badge by neměl být viditelný
    const bonusBadge = strStatBlock.locator('.bg-fantasy-emerald')
    await expect(bonusBadge).not.toBeVisible()

    console.log('✅ STR back to 15 when unattuned')
  })
})
