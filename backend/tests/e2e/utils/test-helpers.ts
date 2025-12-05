/**
 * E2E Test Helper Utilities
 *
 * Reusable helper functions pro Playwright E2E testy.
 * Tyto funkce zjednodušují interakci s aplikací a API.
 */

import { Page, APIRequestContext } from '@playwright/test'

// ============================================================================
// Type Definitions
// ============================================================================

export interface SpellSlot {
  id: string
  level: number
  current: number
  maximum: number
}

export interface HP {
  current: number
  max: number
}

export interface Character {
  id: string
  name: string
  class: string
  level: number
  hitPoints: number
  maxHitPoints: number
  spellSlots?: SpellSlot[]
}

export interface GameSession {
  id: string
  sessionToken: string
  characterId: string
  isActive: boolean
  currentLocation: string
}

// ============================================================================
// Page Interaction Helpers
// ============================================================================

/**
 * Submit player action and wait for submission
 */
export async function submitAction(page: Page, action: string): Promise<void> {
  const inputSelector = 'textarea[placeholder*="akci"], textarea[placeholder*="action"], input[type="text"]'
  const chatInput = page.locator(inputSelector).last()

  await chatInput.fill(action)
  await chatInput.press('Enter')

  // Wait for message to appear in chat
  await page.waitForTimeout(500)
}

/**
 * Wait for narrator response with timeout
 */
export async function waitForNarratorResponse(page: Page, timeout: number = 15000): Promise<void> {
  // Wait for AI typing indicator to appear and disappear
  const typingIndicator = page.locator('text=/Typing|Přemýšlím|AI píše/i').first()

  try {
    await typingIndicator.waitFor({ state: 'visible', timeout: 2000 })
    await typingIndicator.waitFor({ state: 'hidden', timeout })
  } catch {
    // Typing indicator might not appear for fast responses
    await page.waitForTimeout(2000)
  }
}

/**
 * Get message count in chat
 */
export async function getMessageCount(page: Page): Promise<number> {
  const messages = page.locator('[class*="message"], .message, [data-testid*="message"]')
  return await messages.count()
}

/**
 * Get last message text from chat
 */
export async function getLastMessage(page: Page): Promise<string> {
  const messages = page.locator('[class*="message"], .message, [data-testid*="message"]')
  const lastMessage = messages.last()
  return await lastMessage.textContent() || ''
}

/**
 * Check if error message is visible
 */
export async function hasErrorMessage(page: Page): Promise<boolean> {
  const errorMsg = page.locator('text=/error|chyba|failed|selhalo/i')
  return await errorMsg.isVisible().catch(() => false)
}

/**
 * Clear chat input
 */
export async function clearChatInput(page: Page): Promise<void> {
  const inputSelector = 'textarea[placeholder*="akci"], textarea[placeholder*="action"], input[type="text"]'
  const chatInput = page.locator(inputSelector).last()
  await chatInput.clear()
}

// ============================================================================
// API Helpers - Character
// ============================================================================

/**
 * Get spell slots from API for character
 */
export async function getSpellSlots(
  request: APIRequestContext,
  characterId: string,
  authToken: string
): Promise<SpellSlot[]> {
  const response = await request.get(`http://localhost:5000/api/characters/${characterId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  })

  const data = await response.json()
  return data.data.spellSlots || []
}

/**
 * Get HP from API for character
 */
export async function getHP(
  request: APIRequestContext,
  characterId: string,
  authToken: string
): Promise<HP> {
  const response = await request.get(`http://localhost:5000/api/characters/${characterId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  })

  const data = await response.json()
  return {
    current: data.data.hitPoints,
    max: data.data.maxHitPoints
  }
}

/**
 * Get full character data from API
 */
export async function getCharacter(
  request: APIRequestContext,
  characterId: string,
  authToken: string
): Promise<Character> {
  const response = await request.get(`http://localhost:5000/api/characters/${characterId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  })

  const data = await response.json()
  return data.data
}

/**
 * Modify character HP
 */
export async function modifyHP(
  request: APIRequestContext,
  characterId: string,
  authToken: string,
  amount: number
): Promise<HP> {
  const response = await request.post(`http://localhost:5000/api/characters/${characterId}/hp`, {
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
 * Set spell slot count
 */
export async function setSpellSlot(
  request: APIRequestContext,
  characterId: string,
  authToken: string,
  level: number,
  current: number
): Promise<void> {
  await request.put(`http://localhost:5000/api/characters/${characterId}/spell-slots`, {
    headers: { 'Authorization': `Bearer ${authToken}` },
    data: { level, current }
  })
}

// ============================================================================
// API Helpers - Game Session
// ============================================================================

/**
 * Get game session state
 */
export async function getGameState(
  request: APIRequestContext,
  sessionId: string,
  authToken: string
): Promise<any> {
  const response = await request.get(`http://localhost:5000/api/game/session/${sessionId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  })

  const data = await response.json()
  return data.data
}

/**
 * Perform long rest
 */
export async function performLongRest(
  request: APIRequestContext,
  sessionId: string,
  authToken: string
): Promise<void> {
  await request.post(`http://localhost:5000/api/rest/long-rest/${sessionId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  })
}

/**
 * Perform short rest
 */
export async function performShortRest(
  request: APIRequestContext,
  sessionId: string,
  authToken: string
): Promise<void> {
  await request.post(`http://localhost:5000/api/rest/short-rest/${sessionId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  })
}

/**
 * End game session
 */
export async function endGameSession(
  request: APIRequestContext,
  sessionId: string,
  authToken: string
): Promise<void> {
  await request.post(`http://localhost:5000/api/game/session/${sessionId}/end`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  })
}

// ============================================================================
// API Helpers - Auth
// ============================================================================

/**
 * Register new user
 */
export async function registerUser(
  request: APIRequestContext,
  email: string,
  username: string,
  password: string
): Promise<{ userId: string; token: string }> {
  const response = await request.post('http://localhost:5000/api/auth/register', {
    data: { email, username, password }
  })

  const data = await response.json()
  return {
    userId: data.data.user.id,
    token: data.data.token
  }
}

/**
 * Login user
 */
export async function loginUser(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<{ userId: string; token: string }> {
  const response = await request.post('http://localhost:5000/api/auth/login', {
    data: { email, password }
  })

  const data = await response.json()
  return {
    userId: data.data.user.id,
    token: data.data.token
  }
}

/**
 * Set Gemini API key
 */
export async function setGeminiApiKey(
  request: APIRequestContext,
  authToken: string,
  apiKey: string
): Promise<void> {
  await request.put('http://localhost:5000/api/auth/gemini-key', {
    headers: { 'Authorization': `Bearer ${authToken}` },
    data: { geminiApiKey: apiKey }
  })
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Log test progress
 */
export function logTest(message: string, emoji: string = '🧪'): void {
  console.log(`${emoji} ${message}`)
}

/**
 * Measure execution time
 */
export async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const startTime = Date.now()
  const result = await fn()
  const duration = Date.now() - startTime
  return { result, duration }
}

/**
 * Wait for condition with timeout
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeout: number = 10000,
  interval: number = 500
): Promise<boolean> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }

  return false
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      const delay = baseDelay * Math.pow(2, i)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Generate random test email
 */
export function generateTestEmail(prefix: string = 'test'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return `${prefix}-${timestamp}-${random}@example.com`
}

/**
 * Generate random username
 */
export function generateUsername(prefix: string = 'TestUser'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return `${prefix}_${timestamp}_${random}`
}

/**
 * Clean up test data (characters, sessions, etc.)
 */
export async function cleanupTestData(
  request: APIRequestContext,
  authToken: string,
  characterId?: string,
  sessionId?: string
): Promise<void> {
  if (sessionId) {
    try {
      await endGameSession(request, sessionId, authToken)
    } catch (error) {
      // Session might already be ended
    }
  }

  if (characterId) {
    try {
      await request.delete(`http://localhost:5000/api/characters/${characterId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
    } catch (error) {
      // Character might already be deleted
    }
  }
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert spell slot matches expected value
 */
export function assertSpellSlot(
  slots: SpellSlot[],
  level: number,
  expectedCurrent: number,
  expectedMaximum?: number
): void {
  const slot = slots.find(s => s.level === level)

  if (!slot) {
    throw new Error(`Spell slot level ${level} not found`)
  }

  if (slot.current !== expectedCurrent) {
    throw new Error(
      `Spell slot level ${level} current mismatch: expected ${expectedCurrent}, got ${slot.current}`
    )
  }

  if (expectedMaximum !== undefined && slot.maximum !== expectedMaximum) {
    throw new Error(
      `Spell slot level ${level} maximum mismatch: expected ${expectedMaximum}, got ${slot.maximum}`
    )
  }
}

/**
 * Assert HP matches expected value
 */
export function assertHP(hp: HP, expectedCurrent: number, expectedMax?: number): void {
  if (hp.current !== expectedCurrent) {
    throw new Error(`HP current mismatch: expected ${expectedCurrent}, got ${hp.current}`)
  }

  if (expectedMax !== undefined && hp.max !== expectedMax) {
    throw new Error(`HP max mismatch: expected ${expectedMax}, got ${hp.max}`)
  }
}
