import { test, expect } from '@playwright/test'
import { quickCreateCharacter } from './helpers/character-creation'

/**
 * E2E Test: Save/Load Game Flow
 * Tests complete save and load functionality including:
 * - Saving game and getting token
 * - Loading game by token
 * - Browsing saved games
 * - Deleting saved games
 */
test.describe('Save/Load Game Flow', () => {
  test('should save game, copy token, and load successfully', async ({ page }) => {
    test.setTimeout(180000) // 3 minutes for complete flow

    // Listen to console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser Console Error:', msg.text())
      }
    })

    // ========================================================================
    // Step 1: Create character and start game
    // ========================================================================
    await test.step('Create character and start game', async () => {
      const sessionId = await quickCreateCharacter(page)
      await expect(page).toHaveURL(/\/game\/.+/)
      console.log('Created game session:', sessionId)

      // Wait for initial narrative to load
      await page.waitForTimeout(3000)
    })

    // ========================================================================
    // Step 2: Send test message to create conversation history
    // ========================================================================
    await test.step('Send a test message', async () => {
      const chatInput = page.locator('textarea, input[type="text"]').last()

      const testMessage = 'Testovaci zprava pro save/load system. Zdravim!'
      await chatInput.fill(testMessage)
      await chatInput.press('Enter')

      // Wait for message to appear
      await expect(page.getByText(testMessage)).toBeVisible({ timeout: 5000 })

      // Wait a moment for AI response (optional)
      await page.waitForTimeout(3000)
    })

    // ========================================================================
    // Step 3: Save the game
    // ========================================================================
    let gameToken = ''

    await test.step('Save game and get token', async () => {
      // Click Save button
      const saveButton = page.getByRole('button', { name: /Uložit/i })
      await expect(saveButton).toBeVisible()
      await saveButton.click()

      // Wait for save modal to appear
      await expect(page.getByText(/Hra uložena/i)).toBeVisible({ timeout: 10000 })

      // Find token in modal (usually in <code> element)
      const tokenElement = page.locator('code')
      await expect(tokenElement).toBeVisible()

      gameToken = await tokenElement.textContent() || ''
      console.log('Game token:', gameToken)

      // Verify token format
      expect(gameToken).toMatch(/^gs_/)
      expect(gameToken.length).toBeGreaterThan(10)

      // Take screenshot of save modal
      await page.screenshot({
        path: 'tests/e2e/screenshots/save-modal.png',
        fullPage: true
      })

      // Try to click copy button (if exists)
      const copyButton = page.getByRole('button', { name: /Kopírovat/i })
      if (await copyButton.isVisible()) {
        await copyButton.click()
        await page.waitForTimeout(500)
      }

      // Close modal
      const closeButton = page.getByRole('button', { name: /Zavřít/i })
      await closeButton.click()
      await expect(page.getByText(/Hra uložena/i)).not.toBeVisible()
    })

    // ========================================================================
    // Step 4: Leave the game
    // ========================================================================
    await test.step('Leave game', async () => {
      // Click "Odejít" button
      const leaveButton = page.getByRole('button', { name: /Odejít/i })
      await expect(leaveButton).toBeVisible()

      // Set up dialog handler for confirmation (if exists)
      page.on('dialog', dialog => {
        console.log('Dialog appeared:', dialog.message())
        dialog.accept()
      })

      await leaveButton.click()

      // Should navigate back to home
      await expect(page).toHaveURL('/', { timeout: 5000 })
      await expect(page.getByRole('heading', { name: /D&D AI Game/i })).toBeVisible()
    })

    // ========================================================================
    // Step 5: Load game using token
    // ========================================================================
    await test.step('Load game by token', async () => {
      // Find token input field
      const tokenInput = page.getByPlaceholder(/gs_/)
      await expect(tokenInput).toBeVisible()

      // Enter token
      await tokenInput.fill(gameToken)

      // Submit (either Enter key or Load button)
      await tokenInput.press('Enter')

      // Wait for game to load
      await expect(page).toHaveURL(/\/game\/.+/, { timeout: 15000 })

      // Wait for loading state to disappear
      await expect(page.getByText(/Načítám hru/i)).not.toBeVisible({ timeout: 20000 })

      console.log('Game loaded successfully from token')
    })

    // ========================================================================
    // Step 6: Verify loaded game state
    // ========================================================================
    await test.step('Verify game state after load', async () => {
      // Verify character name is present
      await expect(page.getByText(/Quick Test/i).first()).toBeVisible()

      // Verify our test message is still in history
      await expect(page.getByText(/Testovaci zprava/i)).toBeVisible({ timeout: 5000 })

      // Verify game controls are visible
      await expect(page.getByRole('button', { name: /Uložit/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /Odejít/i })).toBeVisible()

      // Take screenshot of loaded game
      await page.screenshot({
        path: 'tests/e2e/screenshots/save-load-success.png',
        fullPage: true
      })

      console.log('✅ Save/Load cycle successful!')
    })
  })

  test('should browse saved games and delete', async ({ page }) => {
    test.setTimeout(120000) // 2 minutes

    // ========================================================================
    // Step 1: Navigate to saved games list
    // ========================================================================
    await test.step('Navigate to saved games', async () => {
      await page.goto('/')

      // Click "Prohlédnout uložené hry" or similar button
      const browseButton = page.getByRole('button', { name: /Prohlédnout/i })

      if (await browseButton.isVisible()) {
        await browseButton.click()
      } else {
        // Alternative: navigate directly
        await page.goto('/saves')
      }

      // Should be on saves page
      await expect(page).toHaveURL('/saves', { timeout: 5000 })
    })

    // ========================================================================
    // Step 2: Check if saved games exist
    // ========================================================================
    await test.step('View saved games list', async () => {
      // Wait for page to load
      await page.waitForTimeout(2000)

      // Check if there are any saved games
      const gameCards = page.locator('[class*="card"], [class*="game"]')
      const count = await gameCards.count()

      console.log(`Found ${count} saved games`)

      if (count === 0) {
        // Empty state
        await expect(page.getByText(/Žádné uložené hry/i)).toBeVisible()
        console.log('No saved games found (empty state is valid)')
      } else {
        // Games exist
        await expect(gameCards.first()).toBeVisible()
        console.log('Saved games are displayed')
      }

      // Take screenshot
      await page.screenshot({
        path: 'tests/e2e/screenshots/saved-games-list.png',
        fullPage: true
      })
    })

    // ========================================================================
    // Step 3: Delete a game (if any exist)
    // ========================================================================
    await test.step('Delete a saved game', async () => {
      // Look for delete buttons
      const deleteButtons = page.getByRole('button', { name: /Smazat|🗑️/i })
      const deleteCount = await deleteButtons.count()

      if (deleteCount > 0) {
        console.log(`Found ${deleteCount} delete buttons`)

        // Click first delete button
        await deleteButtons.first().click()

        // Wait for confirmation modal
        await expect(page.getByText(/Smazat hru/i)).toBeVisible({ timeout: 3000 })

        // Confirm deletion
        const confirmButton = page.getByRole('button', { name: /Ano|Smazat/i })
        await confirmButton.click()

        // Wait for modal to close
        await expect(page.getByText(/Smazat hru/i)).not.toBeVisible({ timeout: 5000 })

        // Take screenshot after deletion
        await page.screenshot({
          path: 'tests/e2e/screenshots/after-delete.png',
          fullPage: true
        })

        console.log('✅ Game deleted successfully')
      } else {
        console.log('No games to delete (skip deletion test)')
      }
    })

    // ========================================================================
    // Step 4: Navigate back to home
    // ========================================================================
    await test.step('Return to home', async () => {
      const homeButton = page.getByRole('button', { name: /Zpět|Domů|Hlavní/i })

      if (await homeButton.isVisible()) {
        await homeButton.click()
      } else {
        // Fallback: use browser back button
        await page.goBack()
      }

      // Should be back at home
      await expect(page).toHaveURL('/', { timeout: 5000 })
      await expect(page.getByRole('heading', { name: /D&D AI Game/i })).toBeVisible()
    })
  })

  test('should handle invalid token gracefully', async ({ page }) => {
    test.setTimeout(30000)

    // ========================================================================
    // Test loading with invalid token
    // ========================================================================
    await test.step('Try to load with invalid token', async () => {
      await page.goto('/')

      // Enter invalid token
      const tokenInput = page.getByPlaceholder(/gs_/)
      await expect(tokenInput).toBeVisible()
      await tokenInput.fill('gs_INVALID_TOKEN_12345')
      await tokenInput.press('Enter')

      // Should show error message
      await expect(
        page.getByText(/Chyba|nenalezena|neplatný/i)
      ).toBeVisible({ timeout: 5000 })

      // Should NOT navigate to game
      await expect(page).toHaveURL('/')

      console.log('✅ Invalid token handled correctly')
    })
  })

  test('should handle empty token input', async ({ page }) => {
    test.setTimeout(30000)

    // ========================================================================
    // Test loading with empty token
    // ========================================================================
    await test.step('Try to load with empty token', async () => {
      await page.goto('/')

      // Try to submit without entering token
      const tokenInput = page.getByPlaceholder(/gs_/)
      await expect(tokenInput).toBeVisible()
      await tokenInput.press('Enter')

      // Should either show validation message or do nothing
      // Should NOT navigate
      await page.waitForTimeout(1000)
      await expect(page).toHaveURL('/')

      console.log('✅ Empty token handled correctly')
    })
  })
})
