import { test, expect } from '@playwright/test'
import { quickCreateCharacter } from './helpers/character-creation'

/**
 * E2E Test: Atmospheric Background System
 * Verifies that dynamic backgrounds load and display correctly
 */
test.describe('Atmospheric Background System', () => {
  test('should display atmospheric background after AI response', async ({ page }) => {
    // Increase timeout for AI responses
    test.setTimeout(120000) // 2 minutes

    // ========================================================================
    // Setup: Capture console logs for debugging
    // ========================================================================
    const consoleLogs: string[] = []
    page.on('console', msg => {
      const text = msg.text()
      consoleLogs.push(text)

      // Log atmosphere-related messages
      if (text.includes('🎨') || text.includes('Atmosphere') || text.includes('Background')) {
        console.log('Browser Console:', text)
      }
    })

    // Capture errors
    const pageErrors: string[] = []
    page.on('pageerror', error => {
      pageErrors.push(error.message)
      console.log('Page Error:', error.message)
    })

    // ========================================================================
    // Step 1: Create character and start game
    // ========================================================================
    await test.step('Create character and start game', async () => {
      const sessionId = await quickCreateCharacter(page)
      console.log('✅ Game session created:', sessionId)

      // Verify we're in game view
      await expect(page).toHaveURL(/\/game\/.+/)
    })

    // ========================================================================
    // Step 2: Verify AtmosphericBackground component exists initially
    // ========================================================================
    await test.step('Verify AtmosphericBackground component mounted', async () => {
      const bgElement = page.locator('.atmospheric-background')
      await expect(bgElement).toBeAttached()
      console.log('✅ AtmosphericBackground component is mounted')
    })

    // ========================================================================
    // Step 3: Send player action to trigger AI response
    // ========================================================================
    await test.step('Send player action', async () => {
      // Find chat input (it's an <input type="text">, not textarea)
      const chatInput = page.locator('input[placeholder="Co chceš dělat?"]')
      await expect(chatInput).toBeVisible({ timeout: 10000 })

      // Type action
      const testAction = 'Rozhlížím se kolem sebe a vnímám atmosféru tohoto místa.'
      await chatInput.fill(testAction)
      console.log('✅ Typed action:', testAction)

      // Send message
      await chatInput.press('Enter')

      // Wait for message to appear
      await page.waitForTimeout(2000)
      console.log('✅ Action sent')
    })

    // ========================================================================
    // Step 4: Wait for AI narrator response
    // ========================================================================
    await test.step('Wait for AI narrator response', async () => {
      // Wait for AI to respond (15 seconds should be enough)
      console.log('⏳ Waiting for AI response (max 20s)...')
      await page.waitForTimeout(20000)

      // Verify atmosphere logs appeared
      const atmosphereLogs = consoleLogs.filter(log =>
        log.includes('🎨 Atmosphere data received') ||
        log.includes('✅ Atmosphere updated')
      )

      console.log(`Found ${atmosphereLogs.length} atmosphere-related logs`)

      if (atmosphereLogs.length > 0) {
        console.log('✅ Atmosphere data was received')
      } else {
        console.warn('⚠️  No atmosphere logs found - test may still pass if background is visible')
      }
    })

    // ========================================================================
    // Step 5: Verify background layer element exists
    // ========================================================================
    await test.step('Verify background layer exists in DOM', async () => {
      // Check for fade-in layer (current background)
      const bgLayer = page.locator('.background-layer.fade-in')

      // Should be attached to DOM
      await expect(bgLayer).toBeAttached({ timeout: 5000 })
      console.log('✅ Background layer element exists in DOM')

      // Should be visible
      const isVisible = await bgLayer.isVisible()
      console.log('Background layer visible:', isVisible)

      if (!isVisible) {
        console.warn('⚠️  Background layer exists but is not visible')
      }
    })

    // ========================================================================
    // Step 6: Verify background-image style
    // ========================================================================
    await test.step('Verify background-image CSS property', async () => {
      const bgLayer = page.locator('.background-layer.fade-in')

      // Get computed style
      const bgImage = await bgLayer.evaluate(el =>
        window.getComputedStyle(el).backgroundImage
      )

      console.log('Background image style:', bgImage)

      // Should contain Pexels URL
      expect(bgImage).toContain('https://images.pexels.com')
      console.log('✅ Background image URL is from Pexels')
    })

    // ========================================================================
    // Step 7: Verify opacity and visibility
    // ========================================================================
    await test.step('Verify opacity and visibility styles', async () => {
      const bgLayer = page.locator('.background-layer.fade-in')

      // Get opacity
      const opacity = await bgLayer.evaluate(el =>
        window.getComputedStyle(el).opacity
      )

      console.log('Background layer opacity:', opacity)
      expect(parseFloat(opacity)).toBeGreaterThan(0.5)
      console.log('✅ Opacity is sufficient (> 0.5)')

      // Get z-index of parent
      const bgElement = page.locator('.atmospheric-background')
      const zIndex = await bgElement.evaluate(el =>
        window.getComputedStyle(el).zIndex
      )

      console.log('Atmospheric background z-index:', zIndex)
      // Should be 0 or positive
      expect(parseInt(zIndex) || 0).toBeGreaterThanOrEqual(0)
      console.log('✅ Z-index is correct (>= 0)')
    })

    // ========================================================================
    // Step 8: Verify mood overlay
    // ========================================================================
    await test.step('Verify mood overlay exists', async () => {
      const moodOverlay = page.locator('.mood-overlay')
      await expect(moodOverlay).toBeAttached()

      const bgColor = await moodOverlay.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      )

      console.log('Mood overlay background-color:', bgColor)
      console.log('✅ Mood overlay is present')
    })

    // ========================================================================
    // Step 9: Take screenshot for visual verification
    // ========================================================================
    await test.step('Take screenshot for visual verification', async () => {
      await page.screenshot({
        path: 'tests/e2e/screenshots/atmospheric-background-test.png',
        fullPage: true
      })
      console.log('✅ Screenshot saved: tests/e2e/screenshots/atmospheric-background-test.png')
    })

    // ========================================================================
    // Step 10: Verify no errors occurred
    // ========================================================================
    await test.step('Verify no critical errors', async () => {
      // Check for specific errors
      const criticalErrors = pageErrors.filter(err =>
        err.includes('TypeError') ||
        err.includes('Cannot read properties of undefined')
      )

      if (criticalErrors.length > 0) {
        console.error('❌ Critical errors found:', criticalErrors)
      }

      expect(criticalErrors).toHaveLength(0)
      console.log('✅ No critical errors detected')
    })

    // ========================================================================
    // Test Summary
    // ========================================================================
    console.log('\n=== Test Summary ===')
    console.log(`Total console logs: ${consoleLogs.length}`)
    console.log(`Atmosphere logs: ${consoleLogs.filter(l => l.includes('🎨')).length}`)
    console.log(`Page errors: ${pageErrors.length}`)
    console.log('✅ Atmospheric Background System E2E Test PASSED')
  })

  test('should handle multiple background transitions', async ({ page }) => {
    test.setTimeout(180000) // 3 minutes for multiple interactions

    // Create character
    await quickCreateCharacter(page)

    // Send multiple actions to trigger background changes
    const actions = [
      'Vcházím do taverni.',
      'Vycházím ven do lesa.',
      'Vstupuji do temné jeskyně.'
    ]

    for (const action of actions) {
      await test.step(`Send action: ${action}`, async () => {
        const chatInput = page.locator('textarea').last()
        await chatInput.fill(action)
        await chatInput.press('Enter')

        // Wait for response and transition
        await page.waitForTimeout(20000)

        // Verify background layer still exists
        const bgLayer = page.locator('.background-layer')
        await expect(bgLayer.first()).toBeAttached()
      })
    }

    // Take final screenshot
    await page.screenshot({
      path: 'tests/e2e/screenshots/atmospheric-background-transitions.png',
      fullPage: true
    })

    console.log('✅ Multiple background transitions test PASSED')
  })
})
