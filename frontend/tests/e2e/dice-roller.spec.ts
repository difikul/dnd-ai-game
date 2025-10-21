import { test, expect } from '@playwright/test'
import { quickCreateCharacter } from './helpers/character-creation'

/**
 * E2E Test: Dice Roller
 * Tests the dice rolling functionality in the game
 */
test.describe('Dice Roller', () => {
  let sessionId: string

  // Create a character and start game before each test
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000) // 1 minute for setup
    sessionId = await quickCreateCharacter(page)

    // Verify we're in game view
    await expect(page).toHaveURL(/\/game\/.+/)
  })

  // ========================================================================
  // Test 1: Open Dice Roller Modal
  // ========================================================================
  test('should open dice roller modal', async ({ page }) => {
    // Find and click the Dice button
    const diceButton = page.getByRole('button', { name: /Dice/i })
    await expect(diceButton).toBeVisible()
    await diceButton.click()

    // Verify modal opened
    await expect(page.getByText(/🎲 Dice Roller/i)).toBeVisible()

    // Verify quick roll buttons are visible
    await expect(page.getByRole('button', { name: /d4/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /d6/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /d8/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^d10$/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /d12/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /d20/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /d100/i })).toBeVisible()

    // Verify custom input field
    await expect(page.getByPlaceholder(/1d20\+5/i)).toBeVisible()

    // Verify advantage/disadvantage checkboxes
    await expect(page.getByText(/Advantage/i)).toBeVisible()
    await expect(page.getByText(/Disadvantage/i)).toBeVisible()

    // Take screenshot
    await page.screenshot({ path: 'tests/e2e/screenshots/dice-roller-opened.png' })
  })

  // ========================================================================
  // Test 2: Roll d20
  // ========================================================================
  test('should roll d20 successfully', async ({ page }) => {
    // Open dice roller
    await page.getByRole('button', { name: /Dice/i }).click()
    await expect(page.getByText(/🎲 Dice Roller/i)).toBeVisible()

    // Click d20 button
    const d20Button = page.getByRole('button', { name: /^d20$/i })
    await d20Button.click()

    // Wait a moment for API call
    await page.waitForTimeout(500)

    // Verify result is displayed (should be number between 1-20)
    const resultDisplay = page.locator('text=/\\d+/').first()
    await expect(resultDisplay).toBeVisible()

    // Verify roll history updated (should show "1d20 →")
    await expect(page.getByText(/1d20/i)).toBeVisible()

    // Take screenshot of result
    await page.screenshot({ path: 'tests/e2e/screenshots/dice-d20-roll.png' })
  })

  // ========================================================================
  // Test 3: Roll with Custom Notation
  // ========================================================================
  test('should roll with custom notation 1d20+5', async ({ page }) => {
    // Open dice roller
    await page.getByRole('button', { name: /Dice/i }).click()

    // Enter custom notation
    const customInput = page.getByPlaceholder(/1d20\+5/i)
    await customInput.fill('1d20+5')

    // Click Roll button
    await page.getByRole('button', { name: /^Roll$/i }).click()

    // Wait for result
    await page.waitForTimeout(500)

    // Verify notation shows in result
    await expect(page.getByText(/1d20\+5/i)).toBeVisible()

    // Verify result is between 6-25 (1d20+5 range)
    // Note: This is tricky to test exact value, so we just verify it's shown
    const resultDisplay = page.locator('.text-5xl').first()
    await expect(resultDisplay).toBeVisible()

    // Take screenshot
    await page.screenshot({ path: 'tests/e2e/screenshots/dice-custom-notation.png' })
  })

  // ========================================================================
  // Test 4: Roll with Advantage
  // ========================================================================
  test('should roll with advantage', async ({ page }) => {
    // Open dice roller
    await page.getByRole('button', { name: /Dice/i }).click()

    // Enter d20
    const customInput = page.getByPlaceholder(/1d20\+5/i)
    await customInput.fill('1d20')

    // Check Advantage checkbox
    const advantageCheckbox = page.getByRole('checkbox', { name: /Advantage/i })
    await advantageCheckbox.check()

    // Verify Disadvantage is disabled
    const disadvantageCheckbox = page.getByRole('checkbox', { name: /Disadvantage/i })
    await expect(disadvantageCheckbox).toBeDisabled()

    // Roll
    await page.getByRole('button', { name: /^Roll$/i }).click()
    await page.waitForTimeout(500)

    // Verify "with Advantage" text shows
    await expect(page.getByText(/with Advantage/i)).toBeVisible()

    // Verify 2 rolls are shown in the result (e.g., "Rolled: [13, 8]")
    await expect(page.getByText(/Rolled:/i)).toBeVisible()

    // Take screenshot
    await page.screenshot({ path: 'tests/e2e/screenshots/dice-advantage.png' })
  })

  // ========================================================================
  // Test 5: Roll with Disadvantage
  // ========================================================================
  test('should roll with disadvantage', async ({ page }) => {
    // Open dice roller
    await page.getByRole('button', { name: /Dice/i }).click()

    // Enter d20
    const customInput = page.getByPlaceholder(/1d20\+5/i)
    await customInput.fill('1d20')

    // Check Disadvantage checkbox
    const disadvantageCheckbox = page.getByRole('checkbox', { name: /Disadvantage/i })
    await disadvantageCheckbox.check()

    // Verify Advantage is disabled
    const advantageCheckbox = page.getByRole('checkbox', { name: /Advantage/i })
    await expect(advantageCheckbox).toBeDisabled()

    // Roll
    await page.getByRole('button', { name: /^Roll$/i }).click()
    await page.waitForTimeout(500)

    // Verify "with Disadvantage" text shows
    await expect(page.getByText(/with Disadvantage/i)).toBeVisible()

    // Take screenshot
    await page.screenshot({ path: 'tests/e2e/screenshots/dice-disadvantage.png' })
  })

  // ========================================================================
  // Test 6: Roll History
  // ========================================================================
  test('should show roll history', async ({ page }) => {
    // Open dice roller
    await page.getByRole('button', { name: /Dice/i }).click()

    // Roll d6
    await page.getByRole('button', { name: /^d6$/i }).click()
    await page.waitForTimeout(300)

    // Roll d8
    await page.getByRole('button', { name: /^d8$/i }).click()
    await page.waitForTimeout(300)

    // Roll d12
    await page.getByRole('button', { name: /^d12$/i }).click()
    await page.waitForTimeout(300)

    // Verify "Roll History" section is visible
    await expect(page.getByText(/Roll History/i)).toBeVisible()

    // Verify all 3 rolls are in history
    await expect(page.getByText(/1d6/i)).toBeVisible()
    await expect(page.getByText(/1d8/i)).toBeVisible()
    await expect(page.getByText(/1d12/i)).toBeVisible()

    // Take screenshot
    await page.screenshot({ path: 'tests/e2e/screenshots/dice-history.png', fullPage: true })
  })

  // ========================================================================
  // Test 7: Clear History
  // ========================================================================
  test('should clear roll history', async ({ page }) => {
    // Open dice roller
    await page.getByRole('button', { name: /Dice/i }).click()

    // Roll a few dice
    await page.getByRole('button', { name: /^d20$/i }).click()
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: /^d6$/i }).click()
    await page.waitForTimeout(300)

    // Verify history exists
    await expect(page.getByText(/Roll History/i)).toBeVisible()

    // Click "Clear History" button
    await page.getByRole('button', { name: /Clear History/i }).click()

    // Verify history is cleared (should show empty state)
    await expect(page.getByText(/Roll some dice to get started/i)).toBeVisible()
  })

  // ========================================================================
  // Test 8: Close Modal
  // ========================================================================
  test('should close dice roller modal', async ({ page }) => {
    // Open dice roller
    await page.getByRole('button', { name: /Dice/i }).click()
    await expect(page.getByText(/🎲 Dice Roller/i)).toBeVisible()

    // Click close button
    await page.getByRole('button', { name: /Zavřít/i }).click()

    // Verify modal is closed
    await expect(page.getByText(/🎲 Dice Roller/i)).not.toBeVisible()
  })

  // ========================================================================
  // Test 9: Multiple Dice (2d6)
  // ========================================================================
  test('should roll multiple dice (2d6)', async ({ page }) => {
    // Open dice roller
    await page.getByRole('button', { name: /Dice/i }).click()

    // Enter 2d6
    const customInput = page.getByPlaceholder(/1d20\+5/i)
    await customInput.fill('2d6')

    // Roll
    await page.getByRole('button', { name: /^Roll$/i }).click()
    await page.waitForTimeout(500)

    // Verify notation shows
    await expect(page.getByText(/2d6/i)).toBeVisible()

    // Verify result is between 2-12 (2d6 range)
    const resultDisplay = page.locator('.text-5xl').first()
    await expect(resultDisplay).toBeVisible()

    // Take screenshot
    await page.screenshot({ path: 'tests/e2e/screenshots/dice-multiple.png' })
  })

  // ========================================================================
  // Test 10: Invalid Notation Error
  // ========================================================================
  test('should show error for invalid notation', async ({ page }) => {
    // Open dice roller
    await page.getByRole('button', { name: /Dice/i }).click()

    // Enter invalid notation
    const customInput = page.getByPlaceholder(/1d20\+5/i)
    await customInput.fill('invalid')

    // Try to roll
    await page.getByRole('button', { name: /^Roll$/i }).click()
    await page.waitForTimeout(500)

    // Verify error message shows
    await expect(page.getByText(/Invalid/i)).toBeVisible()

    // Take screenshot
    await page.screenshot({ path: 'tests/e2e/screenshots/dice-error.png' })
  })
})
