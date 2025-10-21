import { test, expect } from '@playwright/test';

/**
 * E2E Test: Complete Game Flow
 * Tests the entire user journey from homepage to playing the game
 */
test.describe('Complete Game Flow', () => {
  test('should create character and start game successfully', async ({ page }) => {
    // Increase timeout for this test (AI responses can take time)
    test.setTimeout(120000); // 2 minutes

    // Listen to console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser Console Error:', msg.text());
      }
    });

    // Listen to page errors
    page.on('pageerror', error => {
      console.log('Page Error:', error.message);
    });

    // ========================================================================
    // Step 1: Homepage
    // ========================================================================
    await test.step('Navigate to homepage', async () => {
      await page.goto('/');

      // Verify homepage loaded
      await expect(page).toHaveTitle(/D&D AI Game/);

      // Verify main heading
      await expect(page.getByRole('heading', { name: /D&D AI Game/i })).toBeVisible();

      // Verify description text
      await expect(page.getByText(/Zahrajte si Dungeons & Dragons s AI vypravěčem/i)).toBeVisible();

      // Verify buttons exist
      await expect(page.getByRole('button', { name: /Nová Hra/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Načíst Hru/i })).toBeVisible();
    });

    // ========================================================================
    // Step 2: Navigate to Character Creation
    // ========================================================================
    await test.step('Click "Nová Hra" button', async () => {
      await page.getByRole('button', { name: /Nová Hra/i }).click();

      // Verify navigation to character creation
      await expect(page).toHaveURL(/\/create-character/);

      // Verify character creation page loaded (use first() to avoid strict mode violation)
      await expect(page.getByRole('heading', { name: /Vytvoření Postavy/i }).first()).toBeVisible();
    });

    // ========================================================================
    // Step 3: Character Creation - Name and Race
    // ========================================================================
    await test.step('Fill in character name and select race', async () => {
      // Fill in character name
      const nameInput = page.getByLabel(/Jméno postavy/i);
      await nameInput.fill('Thorin Oakenshield');

      // Verify name was filled
      await expect(nameInput).toHaveValue('Thorin Oakenshield');

      // Select race (Dwarf)
      // Note: This depends on your RaceSelector implementation
      // Adjust selector as needed based on actual component structure
      await page.getByText('Dwarf', { exact: true }).click();

      // Click "Další" button
      await page.getByRole('button', { name: /Další/i }).click();
    });

    // ========================================================================
    // Step 4: Character Creation - Class
    // ========================================================================
    await test.step('Select character class', async () => {
      // Wait for class selection step
      await page.waitForTimeout(500);

      // Select class (Fighter)
      await page.getByText('Fighter', { exact: true }).click();

      // Click "Další" button
      await page.getByRole('button', { name: /Další/i }).click();
    });

    // ========================================================================
    // Step 5: Character Creation - Ability Scores
    // ========================================================================
    await test.step('Assign ability scores', async () => {
      // Wait for ability scores step
      await page.waitForTimeout(500);

      // Standard Array should be selected by default
      // Assign scores to each ability
      const abilities = [
        { name: 'Síla', value: '15' },
        { name: 'Odolnost', value: '14' },
        { name: 'Obratnost', value: '13' },
        { name: 'Moudrost', value: '12' },
        { name: 'Charisma', value: '10' },
        { name: 'Inteligence', value: '8' },
      ];

      for (const ability of abilities) {
        const select = page.locator(`select`, {
          has: page.locator(`..`).filter({ hasText: ability.name })
        }).first();
        await select.selectOption(ability.value);
      }

      // Verify stats preview is visible
      await expect(page.getByText(/Max HP:/i)).toBeVisible();
      await expect(page.getByText(/AC:/i)).toBeVisible();

      // Click "Další" button
      await page.getByRole('button', { name: /Další/i }).click();
    });

    // ========================================================================
    // Step 6: Character Creation - Background (Final Step)
    // ========================================================================
    await test.step('Complete character creation', async () => {
      // Wait for background step
      await page.waitForTimeout(500);

      // Optionally fill background (not required)
      const backgroundTextarea = page.getByLabel(/Příběh postavy/i);
      await backgroundTextarea.fill('Odvážný trpasličí válečník z Ereboru.');

      // Verify summary is displayed
      await expect(page.getByText(/Shrnutí:/i)).toBeVisible();
      await expect(page.getByText(/Thorin Oakenshield/i)).toBeVisible();
      await expect(page.getByText(/Dwarf/i)).toBeVisible();
      await expect(page.getByText(/Fighter/i)).toBeVisible();

      // Take screenshot before clicking
      await page.screenshot({ path: 'tests/e2e/screenshots/before-create.png' });

      // Click "Vytvořit postavu" button and wait for navigation
      const createButton = page.getByRole('button', { name: /Vytvořit postavu/i });
      await expect(createButton).toBeEnabled();

      await Promise.all([
        page.waitForURL(/\/game\/.+/, { timeout: 20000 }),
        createButton.click()
      ]);
    });

    // ========================================================================
    // Step 7: Wait for Game to Load
    // ========================================================================
    await test.step('Wait for game to load', async () => {
      // Should navigate to game view with session ID
      await expect(page).toHaveURL(/\/game\/.+/, { timeout: 15000 });

      // Wait for loading state to disappear
      await expect(page.getByText(/Načítám hru/i)).not.toBeVisible({ timeout: 20000 });

      // Verify we're not in error state
      await expect(page.getByText(/Chyba při načítání hry/i)).not.toBeVisible();
    });

    // ========================================================================
    // Step 8: Verify Game View UI
    // ========================================================================
    await test.step('Verify game view loaded successfully', async () => {
      // Verify character name in header (use first() to avoid strict mode with multiple instances)
      await expect(page.getByText(/Thorin Oakenshield/i).first()).toBeVisible();

      // Verify location indicator (use first() to avoid strict mode)
      await expect(page.locator('text=/📍/i').first()).toBeVisible();

      // Verify online status
      await expect(page.getByText(/● Online/i).first()).toBeVisible();

      // Verify action buttons
      await expect(page.getByRole('button', { name: /Uložit/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Odejít/i })).toBeVisible();

      // Verify chat area exists
      await expect(page.locator('[class*="chat"]')).toBeVisible();
    });

    // ========================================================================
    // Step 9: Send First Message
    // ========================================================================
    await test.step('Send a message to AI narrator', async () => {
      // Find chat input (textarea or input)
      const chatInput = page.locator('textarea, input[type="text"]').last();

      // Type message
      const testMessage = 'Rozhlížím se kolem sebe a snažím se pochopit, kde jsem.';
      await chatInput.fill(testMessage);

      // Send message (usually Enter key or a send button)
      // Try Enter key first
      await chatInput.press('Enter');

      // Wait a moment for message to be sent
      await page.waitForTimeout(1000);

      // Verify message appears in chat
      await expect(page.getByText(testMessage)).toBeVisible({ timeout: 5000 });
    });

    // ========================================================================
    // Step 10: Wait for AI Response
    // ========================================================================
    await test.step('Wait for AI narrator response', async () => {
      // AI response can take 5-15 seconds
      // Look for a message that's NOT from the player
      // Narrator messages typically have different styling or role indicator

      // Wait for at least 2 messages in chat (player + narrator)
      await page.waitForTimeout(15000); // Give AI time to respond

      // Verify that there are multiple messages now
      const messages = page.locator('[class*="message"]');
      await expect(messages).toHaveCount(3, { timeout: 5000 }); // Initial + player + narrator

      // Take a screenshot of successful game state
      await page.screenshot({
        path: 'tests/e2e/screenshots/game-flow-success.png',
        fullPage: true
      });
    });

    // ========================================================================
    // Step 11: Test Dice Roller Integration
    // ========================================================================
    await test.step('Test dice roller in game', async () => {
      // Click Dice button in header
      const diceButton = page.getByRole('button', { name: /Dice/i })
      await expect(diceButton).toBeVisible()
      await diceButton.click()

      // Wait for modal to open
      await expect(page.getByText(/🎲 Dice Roller/i)).toBeVisible({ timeout: 3000 })

      // Roll d20
      const d20Button = page.getByRole('button', { name: /^d20$/i })
      await d20Button.click()

      // Wait for result
      await page.waitForTimeout(1000)

      // Verify result is displayed
      const resultDisplay = page.locator('.text-5xl').first()
      await expect(resultDisplay).toBeVisible()

      // Take screenshot of dice roller
      await page.screenshot({
        path: 'tests/e2e/screenshots/dice-roller-integrated.png',
        fullPage: true
      })

      // Close dice roller
      await page.getByRole('button', { name: /Zavřít/i }).click()
      await expect(page.getByText(/🎲 Dice Roller/i)).not.toBeVisible()
    })

    // ========================================================================
    // Test Complete! 🎉
    // ========================================================================
    console.log('✅ E2E Test Passed: Complete game flow with dice roller working!');
  });

  test('should handle navigation back to home', async ({ page }) => {
    await test.step('Navigate to character creation and back', async () => {
      await page.goto('/');

      // Go to character creation
      await page.getByRole('button', { name: /Nová Hra/i }).click();
      await expect(page).toHaveURL(/\/create-character/);

      // Click back button
      await page.getByRole('button', { name: /Zpět na hlavní stránku/i }).click();

      // Should be back at homepage
      await expect(page).toHaveURL('/');
      await expect(page.getByRole('heading', { name: /D&D AI Game/i })).toBeVisible();
    });
  });
});
