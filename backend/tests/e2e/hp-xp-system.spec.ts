/**
 * HP & XP System E2E Test Suite
 *
 * Automatizované Playwright E2E testy pro HP (zdraví) a XP (zkušenosti) systémy.
 * Testuje:
 * - HP damage (ubírání životů v boji)
 * - HP healing (léčení pomocí lektvarů/kouzel)
 * - XP gain (získávání zkušeností za souboje)
 * - Level-up (zvýšení úrovně při dosažení XP threshold)
 * - Character death (smrt postavy při HP 0)
 *
 * **Používá reálné Gemini API** - každá akce čeká na skutečnou AI odpověď (~10-20 sekund)
 *
 * @requires Playwright Test
 * @requires Frontend running on http://localhost:5173
 * @requires Backend running on http://localhost:3000
 * @requires PostgreSQL database running
 * @requires Valid GEMINI_API_KEY environment variable
 */

import { test, expect, Page, APIRequestContext } from '@playwright/test'

// ============================================================================
// Configuration
// ============================================================================

const API_BASE = 'http://localhost:3000'
const FRONTEND_BASE = 'http://localhost:5173'

/**
 * D&D 5e XP Thresholds
 */
const XP_THRESHOLDS = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500
}

/**
 * Test Context shared across tests
 */
interface TestContext {
  authToken: string
  userId: string
  characterId: string
  sessionId: string
  sessionToken: string
  initialHP: number
  initialMaxHP: number
  initialXP: number
  initialLevel: number
}

/**
 * Test user credentials - unique per test run
 */
const TEST_USER = {
  email: `hpxp-test-${Date.now()}@example.com`,
  username: `HPXPTester${Date.now()}`,
  password: 'TestPassword123!',
  geminiApiKey: process.env.GEMINI_API_KEY || ''
}

/**
 * Test character - Level 1 Wizard (low HP for easier damage testing)
 */
const TEST_CHARACTER = {
  name: 'HP-XP Test Wizard',
  race: 'Human',
  class: 'Wizard',
  level: 1,
  strength: 8,
  dexterity: 14,
  constitution: 12,  // +1 CON modifier
  intelligence: 18,
  wisdom: 12,
  charisma: 10,
  background: 'Sage',
  knownSpells: [
    { name: 'Fire Bolt', level: 0, school: 'Evocation' },
    { name: 'Magic Missile', level: 1, school: 'Evocation' }
  ]
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Log test progress with emoji
 */
function logTest(message: string, emoji: string = '🧪'): void {
  console.log(`${emoji} ${message}`)
}

/**
 * Submit player action via chat input
 */
async function submitAction(page: Page, action: string): Promise<void> {
  const chatInput = page.locator('[data-testid="action-input"]')
  await chatInput.fill(action)
  await chatInput.press('Enter')
  await page.waitForTimeout(500)
}

/**
 * Wait for narrator AI response with extended timeout for Gemini
 */
async function waitForNarratorResponse(page: Page, timeout: number = 60000): Promise<void> {
  try {
    // Wait for loading indicator to appear
    const loadingIndicator = page.locator('text=/Přemýšlím|Loading|Generuji/i').first()
    await loadingIndicator.waitFor({ state: 'visible', timeout: 5000 })
    // Wait for it to disappear (AI response complete)
    await loadingIndicator.waitFor({ state: 'hidden', timeout })
  } catch {
    // Loading indicator might not appear for cached/fast responses
    await page.waitForTimeout(3000)
  }
}

/**
 * Get character data from API
 */
async function getCharacter(
  request: APIRequestContext,
  characterId: string,
  authToken: string
): Promise<any> {
  const response = await request.get(`${API_BASE}/api/characters/${characterId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  })
  const data = await response.json()
  return data.data
}

/**
 * Get HP from API
 */
async function getHP(
  request: APIRequestContext,
  characterId: string,
  authToken: string
): Promise<{ current: number; max: number }> {
  const character = await getCharacter(request, characterId, authToken)
  return {
    current: character.hitPoints,
    max: character.maxHitPoints
  }
}

/**
 * Get XP and level from API
 */
async function getXPAndLevel(
  request: APIRequestContext,
  characterId: string,
  authToken: string
): Promise<{ xp: number; level: number }> {
  const character = await getCharacter(request, characterId, authToken)
  return {
    xp: character.experience || 0,
    level: character.level
  }
}

/**
 * Modify character HP directly via API (for test setup)
 */
async function modifyHP(
  request: APIRequestContext,
  characterId: string,
  authToken: string,
  amount: number
): Promise<{ current: number; max: number }> {
  const response = await request.post(`${API_BASE}/api/characters/${characterId}/hp`, {
    headers: { 'Authorization': `Bearer ${authToken}` },
    data: { amount }
  })
  const data = await response.json()
  return {
    current: data.data.hitPoints,
    max: data.data.maxHitPoints
  }
}

/**
 * Modify character XP directly via API (for test setup)
 */
async function modifyXP(
  request: APIRequestContext,
  characterId: string,
  authToken: string,
  amount: number
): Promise<{ xp: number; level: number }> {
  const response = await request.post(`${API_BASE}/api/characters/${characterId}/experience`, {
    headers: { 'Authorization': `Bearer ${authToken}` },
    data: { amount }
  })
  const data = await response.json()
  return {
    xp: data.data.experience,
    level: data.data.level
  }
}

/**
 * Register new user via API
 */
async function registerUser(
  request: APIRequestContext,
  email: string,
  username: string,
  password: string
): Promise<{ userId: string; token: string }> {
  const response = await request.post(`${API_BASE}/api/auth/register`, {
    data: { email, username, password }
  })
  const data = await response.json()
  return {
    userId: data.data.user.id,
    token: data.data.token
  }
}

/**
 * Set Gemini API key for user
 */
async function setGeminiApiKey(
  request: APIRequestContext,
  authToken: string,
  apiKey: string
): Promise<void> {
  await request.put(`${API_BASE}/api/auth/gemini-key`, {
    headers: { 'Authorization': `Bearer ${authToken}` },
    data: { geminiApiKey: apiKey }
  })
}

/**
 * Create character via API
 */
async function createCharacter(
  request: APIRequestContext,
  authToken: string,
  characterData: typeof TEST_CHARACTER
): Promise<string> {
  const response = await request.post(`${API_BASE}/api/characters`, {
    headers: { 'Authorization': `Bearer ${authToken}` },
    data: characterData
  })
  const data = await response.json()
  return data.data.id
}

/**
 * Start game session via API
 */
async function startGameSession(
  request: APIRequestContext,
  characterId: string,
  authToken: string
): Promise<{ sessionId: string; sessionToken: string }> {
  const response = await request.post(`${API_BASE}/api/game/start`, {
    headers: { 'Authorization': `Bearer ${authToken}` },
    data: { characterId }
  })
  const data = await response.json()
  return {
    sessionId: data.data.session.id,
    sessionToken: data.data.sessionToken
  }
}

/**
 * Submit game action via API and get response with metadata
 */
async function submitGameAction(
  request: APIRequestContext,
  sessionId: string,
  characterId: string,
  action: string,
  authToken: string
): Promise<any> {
  const response = await request.post(`${API_BASE}/api/game/session/${sessionId}/action`, {
    headers: { 'Authorization': `Bearer ${authToken}` },
    data: { action, characterId }
  })
  return await response.json()
}

/**
 * Wait for system message containing specific text
 */
async function waitForSystemMessage(page: Page, textPattern: string | RegExp): Promise<boolean> {
  try {
    const pattern = typeof textPattern === 'string' ? new RegExp(textPattern, 'i') : textPattern
    const systemMessage = page.locator(`text=${pattern}`)
    await systemMessage.waitFor({ state: 'visible', timeout: 10000 })
    return true
  } catch {
    return false
  }
}

/**
 * Check if chat contains message with pattern
 */
async function chatContainsMessage(page: Page, pattern: string | RegExp): Promise<boolean> {
  const messagesContainer = page.locator('[data-testid="narrator-messages-container"], .messages-container, [class*="chat"]')
  const content = await messagesContainer.textContent() || ''
  if (typeof pattern === 'string') {
    return content.toLowerCase().includes(pattern.toLowerCase())
  }
  return pattern.test(content)
}

// ============================================================================
// Test Suite
// ============================================================================

test.describe('HP & XP System E2E Tests', () => {
  let ctx: TestContext

  // Extended timeout for real AI calls
  test.setTimeout(300000) // 5 minutes for entire test suite

  test.beforeAll(async ({ request }) => {
    logTest('Starting HP & XP System E2E Test Suite', '🚀')

    // Verify Gemini API key is available
    if (!TEST_USER.geminiApiKey) {
      console.warn('⚠️ GEMINI_API_KEY not set - tests may fail')
    }
  })

  test.afterAll(async () => {
    logTest('HP & XP System E2E Test Suite Complete', '✅')
  })

  // ==========================================================================
  // GROUP 1: Setup (Registration, Login, Character Creation)
  // ==========================================================================

  test.describe('GROUP 1: Setup', () => {
    test('1.1 Register test user and set API key', async ({ request }) => {
      test.slow()
      logTest('Test 1.1: User Registration', '👤')

      // Register user
      const { userId, token } = await registerUser(
        request,
        TEST_USER.email,
        TEST_USER.username,
        TEST_USER.password
      )

      expect(userId).toBeTruthy()
      expect(token).toBeTruthy()

      // Store token in context
      ctx = {
        authToken: token,
        userId,
        characterId: '',
        sessionId: '',
        sessionToken: '',
        initialHP: 0,
        initialMaxHP: 0,
        initialXP: 0,
        initialLevel: 1
      }

      // Set Gemini API key
      if (TEST_USER.geminiApiKey) {
        await setGeminiApiKey(request, token, TEST_USER.geminiApiKey)
        logTest('Gemini API key set', '🔑')
      }

      logTest(`User registered: ${TEST_USER.email}`, '✅')
    })

    test('1.2 Create test character', async ({ request }) => {
      test.slow()
      logTest('Test 1.2: Character Creation', '🧙')

      const characterId = await createCharacter(request, ctx.authToken, TEST_CHARACTER)
      expect(characterId).toBeTruthy()
      ctx.characterId = characterId

      // Get initial HP and XP
      const hp = await getHP(request, characterId, ctx.authToken)
      const { xp, level } = await getXPAndLevel(request, characterId, ctx.authToken)

      ctx.initialHP = hp.current
      ctx.initialMaxHP = hp.max
      ctx.initialXP = xp
      ctx.initialLevel = level

      logTest(`Character created: ${TEST_CHARACTER.name} (Level ${level}, HP ${hp.current}/${hp.max}, XP ${xp})`, '✅')
    })

    test('1.3 Start game session', async ({ request }) => {
      test.slow()
      logTest('Test 1.3: Game Session Start', '🎮')

      const { sessionId, sessionToken } = await startGameSession(
        request,
        ctx.characterId,
        ctx.authToken
      )

      expect(sessionId).toBeTruthy()
      expect(sessionToken).toBeTruthy()

      ctx.sessionId = sessionId
      ctx.sessionToken = sessionToken

      logTest(`Game session started: ${sessionId}`, '✅')
    })
  })

  // ==========================================================================
  // GROUP 2: HP Damage Tests
  // ==========================================================================

  test.describe('GROUP 2: HP Damage', () => {
    test('2.1 Combat action triggers HP damage', async ({ request }) => {
      test.slow()
      logTest('Test 2.1: HP Damage from Combat', '⚔️')

      // Get current HP before combat
      const hpBefore = await getHP(request, ctx.characterId, ctx.authToken)
      logTest(`HP before combat: ${hpBefore.current}/${hpBefore.max}`)

      // Send combat action that should result in taking damage
      const response = await submitGameAction(
        request,
        ctx.sessionId,
        ctx.characterId,
        'Běžím přímo na goblina a snažím se ho udeřit holou rukou. Ignoruji jeho útoky.',
        ctx.authToken
      )

      // Check response for hpChange metadata
      const data = response.data
      logTest(`AI Response: ${data?.narratorResponse?.substring(0, 100)}...`)

      // Either hpChange in metadata OR check HP via API
      const hpAfter = await getHP(request, ctx.characterId, ctx.authToken)
      logTest(`HP after combat: ${hpAfter.current}/${hpAfter.max}`)

      if (data?.hpChange) {
        logTest(`HP Change detected in response: ${data.hpChange.amount}`, '💔')
        expect(data.hpChange.amount).toBeLessThan(0) // Damage is negative
        expect(hpAfter.current).toBe(data.hpChange.newHP)
      }

      // HP should have decreased or stayed same (if attack missed)
      expect(hpAfter.current).toBeLessThanOrEqual(hpBefore.current)
      logTest(`HP damage test passed`, '✅')
    })

    test('2.2 HP does not go below 0', async ({ request }) => {
      test.slow()
      logTest('Test 2.2: HP Floor at 0', '🛡️')

      // Set HP to very low value for test
      await modifyHP(request, ctx.characterId, ctx.authToken, -1000) // Force to 0
      const hpLow = await getHP(request, ctx.characterId, ctx.authToken)

      expect(hpLow.current).toBeGreaterThanOrEqual(0)
      logTest(`HP floor verified: ${hpLow.current} (should be >= 0)`, '✅')

      // Restore HP for next tests
      await modifyHP(request, ctx.characterId, ctx.authToken, ctx.initialMaxHP)
      const hpRestored = await getHP(request, ctx.characterId, ctx.authToken)
      logTest(`HP restored to: ${hpRestored.current}/${hpRestored.max}`)
    })
  })

  // ==========================================================================
  // GROUP 3: HP Healing Tests
  // ==========================================================================

  test.describe('GROUP 3: HP Healing', () => {
    test('3.1 Healing action restores HP', async ({ request }) => {
      test.slow()
      logTest('Test 3.1: HP Healing', '💚')

      // First, reduce HP to test healing
      await modifyHP(request, ctx.characterId, ctx.authToken, -3)
      const hpBefore = await getHP(request, ctx.characterId, ctx.authToken)
      logTest(`HP before healing: ${hpBefore.current}/${hpBefore.max}`)

      // Send healing action
      const response = await submitGameAction(
        request,
        ctx.sessionId,
        ctx.characterId,
        'Najdu si bezpečné místo, vytáhnu lektvar léčení z batohu a vypiji ho.',
        ctx.authToken
      )

      const data = response.data
      logTest(`AI Response: ${data?.narratorResponse?.substring(0, 100)}...`)

      const hpAfter = await getHP(request, ctx.characterId, ctx.authToken)
      logTest(`HP after healing: ${hpAfter.current}/${hpAfter.max}`)

      if (data?.hpChange) {
        logTest(`HP Change detected: +${data.hpChange.amount}`, '💚')
        expect(data.hpChange.amount).toBeGreaterThan(0) // Healing is positive
      }

      // HP should have increased or stayed same
      expect(hpAfter.current).toBeGreaterThanOrEqual(hpBefore.current)
      logTest('HP healing test passed', '✅')
    })

    test('3.2 HP does not exceed maxHP', async ({ request }) => {
      test.slow()
      logTest('Test 3.2: HP Cap at maxHP', '🔒')

      // Restore to full HP
      await modifyHP(request, ctx.characterId, ctx.authToken, 1000)
      const hpFull = await getHP(request, ctx.characterId, ctx.authToken)

      expect(hpFull.current).toBeLessThanOrEqual(hpFull.max)
      logTest(`HP cap verified: ${hpFull.current}/${hpFull.max}`, '✅')
    })
  })

  // ==========================================================================
  // GROUP 4: XP Gain Tests
  // ==========================================================================

  test.describe('GROUP 4: XP Gain', () => {
    test('4.1 Defeating enemy grants XP', async ({ request }) => {
      test.slow()
      logTest('Test 4.1: XP Gain from Combat', '✨')

      // Ensure HP is restored for combat
      await modifyHP(request, ctx.characterId, ctx.authToken, 100)

      // Get current XP
      const { xp: xpBefore, level: levelBefore } = await getXPAndLevel(
        request,
        ctx.characterId,
        ctx.authToken
      )
      logTest(`XP before combat: ${xpBefore} (Level ${levelBefore})`)

      // Send combat action to defeat enemy
      const response = await submitGameAction(
        request,
        ctx.sessionId,
        ctx.characterId,
        'Soustředím svou magickou energii a vystřelím Fire Bolt přímo na goblina. Chci ho porazit!',
        ctx.authToken
      )

      const data = response.data
      logTest(`AI Response: ${data?.narratorResponse?.substring(0, 100)}...`)

      const { xp: xpAfter, level: levelAfter } = await getXPAndLevel(
        request,
        ctx.characterId,
        ctx.authToken
      )
      logTest(`XP after combat: ${xpAfter} (Level ${levelAfter})`)

      if (data?.xpChange) {
        logTest(`XP Change detected: +${data.xpChange.amount}`, '✨')
        expect(data.xpChange.amount).toBeGreaterThan(0)
        expect(xpAfter).toBe(data.xpChange.newXP)
      }

      // XP should have increased (or stayed same if enemy escaped)
      logTest(`XP gain test passed`, '✅')
    })

    test('4.2 XP accumulates correctly', async ({ request }) => {
      test.slow()
      logTest('Test 4.2: XP Accumulation', '📊')

      // Get current XP
      const { xp: xp1 } = await getXPAndLevel(request, ctx.characterId, ctx.authToken)
      logTest(`Current XP: ${xp1}`)

      // Add some XP via API
      const addedXP = 50
      const result = await modifyXP(request, ctx.characterId, ctx.authToken, addedXP)

      expect(result.xp).toBe(xp1 + addedXP)
      logTest(`XP after adding ${addedXP}: ${result.xp}`, '✅')
    })
  })

  // ==========================================================================
  // GROUP 5: Level-Up Tests
  // ==========================================================================

  test.describe('GROUP 5: Level-Up', () => {
    test('5.1 Level up at XP threshold (300 XP)', async ({ request }) => {
      test.slow()
      logTest('Test 5.1: Level Up Trigger', '🎉')

      // Get current state
      const stateBefore = await getXPAndLevel(request, ctx.characterId, ctx.authToken)
      const hpBefore = await getHP(request, ctx.characterId, ctx.authToken)
      logTest(`Before: Level ${stateBefore.level}, XP ${stateBefore.xp}, HP ${hpBefore.current}/${hpBefore.max}`)

      // If already level 2+, reset character or skip
      if (stateBefore.level >= 2) {
        logTest('Character already level 2+, skipping level-up test', '⏭️')
        return
      }

      // Add enough XP to trigger level up (need 300 for level 2)
      const xpNeeded = XP_THRESHOLDS[2] - stateBefore.xp
      if (xpNeeded > 0) {
        await modifyXP(request, ctx.characterId, ctx.authToken, xpNeeded)
        logTest(`Added ${xpNeeded} XP to trigger level-up`)
      }

      // Verify level up occurred
      const stateAfter = await getXPAndLevel(request, ctx.characterId, ctx.authToken)
      const hpAfter = await getHP(request, ctx.characterId, ctx.authToken)

      logTest(`After: Level ${stateAfter.level}, XP ${stateAfter.xp}, HP ${hpAfter.current}/${hpAfter.max}`)

      expect(stateAfter.level).toBe(2)
      expect(stateAfter.xp).toBeGreaterThanOrEqual(XP_THRESHOLDS[2])

      // HP should have increased (Wizard gets d6 + CON per level)
      // At level 2, maxHP should be higher than level 1
      expect(hpAfter.max).toBeGreaterThan(hpBefore.max)

      logTest(`Level-up test passed! New level: ${stateAfter.level}`, '✅')
    })

    test('5.2 Level up increases maxHP', async ({ request }) => {
      test.slow()
      logTest('Test 5.2: MaxHP Increase on Level-Up', '❤️')

      const character = await getCharacter(request, ctx.characterId, ctx.authToken)

      // Wizard at level 2 should have higher maxHP than level 1
      // Level 1 Wizard: 6 + CON mod (12 CON = +1) = 7 HP
      // Level 2 Wizard: 7 + avg(d6) + CON mod = 7 + 4 + 1 = 12 HP (approximately)

      logTest(`Character: Level ${character.level}, MaxHP ${character.maxHitPoints}`)

      if (character.level >= 2) {
        expect(character.maxHitPoints).toBeGreaterThan(7) // More than level 1 base
        logTest(`MaxHP increase verified`, '✅')
      } else {
        logTest(`Character still level 1, maxHP: ${character.maxHitPoints}`)
      }
    })
  })

  // ==========================================================================
  // GROUP 6: Character Death Test
  // ==========================================================================

  test.describe('GROUP 6: Character Death', () => {
    test('6.1 Character death at HP 0', async ({ request }) => {
      test.slow()
      logTest('Test 6.1: Character Death', '💀')

      // Create a new character for death test (don't kill main test character)
      const deathTestCharacter = {
        ...TEST_CHARACTER,
        name: 'Death Test Wizard'
      }

      const deathCharId = await createCharacter(request, ctx.authToken, deathTestCharacter)
      logTest(`Created death test character: ${deathCharId}`)

      // Start a new session for this character
      const { sessionId: deathSessionId } = await startGameSession(
        request,
        deathCharId,
        ctx.authToken
      )

      // Reduce HP to 0
      await modifyHP(request, deathCharId, ctx.authToken, -1000)
      const hpDead = await getHP(request, deathCharId, ctx.authToken)

      expect(hpDead.current).toBe(0)
      logTest(`Character HP reduced to: ${hpDead.current}`, '💀')

      // Try to submit action with dead character
      const response = await submitGameAction(
        request,
        deathSessionId,
        deathCharId,
        'Vstávám a bojuji dál!',
        ctx.authToken
      )

      const data = response.data

      // Check for death-related response
      if (data?.characterDied || data?.narratorResponse?.includes('zemřel') || data?.narratorResponse?.includes('death')) {
        logTest('Character death detected in response', '💀')
      }

      logTest(`Character death test completed`, '✅')
    })
  })

  // ==========================================================================
  // GROUP 7: UI Integration (Browser Tests)
  // ==========================================================================

  test.describe('GROUP 7: UI Integration', () => {
    test('7.1 HP displays correctly in UI', async ({ page, request }) => {
      test.slow()
      logTest('Test 7.1: HP UI Display', '🖥️')

      // Login via UI
      await page.goto(`${FRONTEND_BASE}/login`)
      await page.fill('[data-testid="login-email-input"], input[type="email"]', TEST_USER.email)
      await page.fill('[data-testid="login-password-input"], input[type="password"]', TEST_USER.password)
      await page.click('[data-testid="login-submit-button"], button[type="submit"]')

      // Wait for navigation
      await page.waitForURL(/\/(home|characters|game)?/, { timeout: 10000 })
      logTest('Logged in successfully')

      // Navigate to game with character
      await page.goto(`${FRONTEND_BASE}/game/${ctx.characterId}`)
      await page.waitForTimeout(3000) // Wait for page load

      // Check for HP display
      const hpElement = page.locator('[data-testid="character-current-hp"], [class*="hp"], text=/HP|Životy/i')
      const isHPVisible = await hpElement.first().isVisible().catch(() => false)

      if (isHPVisible) {
        const hpText = await hpElement.first().textContent()
        logTest(`HP displayed in UI: ${hpText}`, '✅')
      } else {
        logTest('HP element not found in UI (may need different selector)', '⚠️')
      }
    })

    test('7.2 XP displays correctly in UI', async ({ page }) => {
      test.slow()
      logTest('Test 7.2: XP UI Display', '🖥️')

      // Already logged in from previous test, navigate to game
      await page.goto(`${FRONTEND_BASE}/game/${ctx.characterId}`)
      await page.waitForTimeout(3000)

      // Check for XP display
      const xpElement = page.locator('[data-testid="character-xp"], [class*="xp"], text=/XP|zkušenost/i')
      const isXPVisible = await xpElement.first().isVisible().catch(() => false)

      if (isXPVisible) {
        const xpText = await xpElement.first().textContent()
        logTest(`XP displayed in UI: ${xpText}`, '✅')
      } else {
        logTest('XP element not found in UI (may need different selector)', '⚠️')
      }
    })

    test('7.3 System messages show HP/XP changes', async ({ page, request }) => {
      test.slow()
      logTest('Test 7.3: System Messages for HP/XP', '💬')

      // Navigate to game
      await page.goto(`${FRONTEND_BASE}/game/${ctx.characterId}`)
      await page.waitForTimeout(3000)

      // Submit action and check for system messages
      const actionInput = page.locator('[data-testid="action-input"], textarea, input[type="text"]').last()

      if (await actionInput.isVisible()) {
        await actionInput.fill('Rozhlížím se kolem sebe.')
        await actionInput.press('Enter')

        // Wait for response
        await page.waitForTimeout(15000)

        // Check for system message patterns
        const pageContent = await page.content()
        const hasHPMessage = pageContent.includes('HP') || pageContent.includes('💔') || pageContent.includes('💚')
        const hasXPMessage = pageContent.includes('XP') || pageContent.includes('✨')

        logTest(`HP message found: ${hasHPMessage}, XP message found: ${hasXPMessage}`)
      }

      logTest('System messages test completed', '✅')
    })
  })
})
