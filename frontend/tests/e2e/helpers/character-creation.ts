/**
 * E2E Test Helpers - Character Creation
 * Reusable functions for creating characters in tests
 */

import { Page, expect } from '@playwright/test'

/**
 * Create a character and start a game
 * Returns the session ID for further testing
 */
export async function createCharacterAndStartGame(
  page: Page,
  characterName: string = 'Test Character',
  race: string = 'Human',
  characterClass: string = 'Fighter'
): Promise<string> {
  // Navigate to homepage
  await page.goto('/')

  // Click "Nová Hra"
  await page.getByRole('button', { name: /Nová Hra/i }).click()
  await expect(page).toHaveURL(/\/create-character/)

  // Step 1: Name and Race
  const nameInput = page.getByLabel(/Jméno postavy/i)
  await nameInput.fill(characterName)
  await page.getByText(race, { exact: true }).click()
  await page.getByRole('button', { name: /Další/i }).click()

  // Step 2: Class
  await page.waitForTimeout(300)
  await page.getByText(characterClass, { exact: true }).click()
  await page.getByRole('button', { name: /Další/i }).click()

  // Step 3: Ability Scores (use standard array)
  await page.waitForTimeout(300)
  const abilities = [
    { name: 'Síla', value: '15' },
    { name: 'Odolnost', value: '14' },
    { name: 'Obratnost', value: '13' },
    { name: 'Moudrost', value: '12' },
    { name: 'Charisma', value: '10' },
    { name: 'Inteligence', value: '8' },
  ]

  for (const ability of abilities) {
    const select = page.locator(`select`, {
      has: page.locator(`..`).filter({ hasText: ability.name })
    }).first()
    await select.selectOption(ability.value)
  }

  await page.getByRole('button', { name: /Další/i }).click()

  // Step 4: Background (optional) and Create
  await page.waitForTimeout(300)
  const createButton = page.getByRole('button', { name: /Vytvořit postavu/i })
  await expect(createButton).toBeEnabled()

  await Promise.all([
    page.waitForURL(/\/game\/.+/, { timeout: 30000 }),
    createButton.click()
  ])

  // Wait for game to load
  await expect(page.getByText(/Načítám hru/i)).not.toBeVisible({ timeout: 25000 })

  // Extract session ID from URL
  const url = page.url()
  const match = url.match(/\/game\/([a-f0-9-]+)/)
  if (!match) {
    throw new Error('Could not extract session ID from URL')
  }

  return match[1]
}

/**
 * Quick character creation (skip to game faster)
 * Uses default values for everything
 */
export async function quickCreateCharacter(page: Page): Promise<string> {
  return createCharacterAndStartGame(page, 'Quick Test', 'Human', 'Fighter')
}
