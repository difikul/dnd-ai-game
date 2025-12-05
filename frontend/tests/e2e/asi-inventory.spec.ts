import { test, expect } from '@playwright/test';

/**
 * E2E Test: ASI (Ability Score Improvement) and Inventory Systems
 * Tests the ability score improvement modal and inventory management
 */

// Test data
const TEST_USER_EMAIL = `e2etest${Date.now()}@dnd.test`;
const TEST_USER_PASSWORD = 'testpass123';
const TEST_USER_NAME = `E2E Tester ${Date.now()}`;

test.describe('ASI and Inventory Systems', () => {
  // Shared state for tests
  let authToken: string;
  let characterId: string;

  test.beforeAll(async ({ request }) => {
    // Register test user
    const registerResponse = await request.post('/api/auth/register', {
      data: {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        username: TEST_USER_NAME,
      },
    });
    expect(registerResponse.ok()).toBeTruthy();
    const registerData = await registerResponse.json();
    authToken = registerData.data.token;

    // Create character at level 4 (has pending ASI)
    const characterResponse = await request.post('/api/characters', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        name: 'ASI Test Fighter',
        race: 'Human',
        class: 'Fighter',
        background: 'Soldier',
        strength: 16,
        dexterity: 14,
        constitution: 14,
        intelligence: 10,
        wisdom: 12,
        charisma: 8,
      },
    });
    expect(characterResponse.ok()).toBeTruthy();
    const charData = await characterResponse.json();
    characterId = charData.data.id;

    // Level up character to level 4 (ASI level)
    // First add XP to reach level 2
    await request.post(`/api/characters/${characterId}/add-experience`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { experience: 300 },
    });
    await request.post(`/api/characters/${characterId}/level-up`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    // Level 3
    await request.post(`/api/characters/${characterId}/add-experience`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { experience: 900 },
    });
    await request.post(`/api/characters/${characterId}/level-up`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    // Level 4 (triggers pending ASI)
    await request.post(`/api/characters/${characterId}/add-experience`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { experience: 2700 },
    });
    await request.post(`/api/characters/${characterId}/level-up`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
  });

  test.describe('Inventory API', () => {
    test('should add item to inventory', async ({ request }) => {
      const response = await request.post(`/api/characters/${characterId}/inventory`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          name: 'Longsword +1',
          type: 'weapon',
          rarity: 'uncommon',
          description: 'A finely crafted longsword with magical enhancement',
          damage: '1d8+1',
          statBonuses: { strength: 0 },
          requiresAttunement: false,
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Longsword +1');
      expect(data.data.type).toBe('weapon');
      expect(data.data.equipped).toBe(false);
    });

    test('should add magical item requiring attunement', async ({ request }) => {
      const response = await request.post(`/api/characters/${characterId}/inventory`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          name: 'Ring of Strength +2',
          type: 'accessory',
          rarity: 'rare',
          description: 'Increases strength by 2 when attuned',
          statBonuses: { strength: 2 },
          requiresAttunement: true,
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.requiresAttunement).toBe(true);
      expect(data.data.isAttuned).toBe(false);
    });

    test('should get inventory list', async ({ request }) => {
      const response = await request.get(`/api/characters/${characterId}/inventory`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.length).toBeGreaterThanOrEqual(2);
    });

    test('should equip and attune item', async ({ request }) => {
      // Get inventory
      const inventoryResponse = await request.get(`/api/characters/${characterId}/inventory`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const inventory = await inventoryResponse.json();
      const ring = inventory.data.find((item: any) => item.name === 'Ring of Strength +2');

      // Equip
      const equipResponse = await request.post(
        `/api/characters/${characterId}/inventory/${ring.id}/equip`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      expect(equipResponse.ok()).toBeTruthy();
      const equipData = await equipResponse.json();
      expect(equipData.data.equipped).toBe(true);

      // Attune
      const attuneResponse = await request.post(
        `/api/characters/${characterId}/inventory/${ring.id}/attune`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      expect(attuneResponse.ok()).toBeTruthy();
      const attuneData = await attuneResponse.json();
      expect(attuneData.data.isAttuned).toBe(true);
    });

    test('should calculate equipped bonuses', async ({ request }) => {
      const response = await request.get(`/api/characters/${characterId}/inventory/bonuses`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      // Ring of Strength +2 is equipped and attuned
      expect(data.data.strength).toBe(2);
    });

    test('should enforce max 3 attunement limit', async ({ request }) => {
      // Add 2 more items requiring attunement
      for (let i = 1; i <= 3; i++) {
        await request.post(`/api/characters/${characterId}/inventory`, {
          headers: { Authorization: `Bearer ${authToken}` },
          data: {
            name: `Attune Test Item ${i}`,
            type: 'accessory',
            rarity: 'rare',
            requiresAttunement: true,
          },
        });
      }

      // Get inventory
      const inventoryResponse = await request.get(`/api/characters/${characterId}/inventory`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const inventory = await inventoryResponse.json();
      const attuneItems = inventory.data.filter(
        (item: any) => item.requiresAttunement && !item.isAttuned
      );

      // Attune first 2 (should succeed, will have 3 total including ring)
      for (let i = 0; i < 2; i++) {
        const response = await request.post(
          `/api/characters/${characterId}/inventory/${attuneItems[i].id}/attune`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        expect(response.ok()).toBeTruthy();
      }

      // Try to attune 4th item (should fail)
      const failResponse = await request.post(
        `/api/characters/${characterId}/inventory/${attuneItems[2].id}/attune`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      expect(failResponse.status()).toBe(400);
      const failData = await failResponse.json();
      expect(failData.error).toContain('Maximum');
    });
  });

  test.describe('ASI API', () => {
    test('should verify character has pending ASI at level 4', async ({ request }) => {
      const response = await request.get(`/api/characters/${characterId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.data.level).toBe(4);
      expect(data.data.pendingASI).toBe(true);
    });

    test('should reject ASI with sum not equal to 2', async ({ request }) => {
      const response = await request.post(
        `/api/characters/${characterId}/ability-score-improvement`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          data: {
            improvements: { strength: 1 }, // Sum is 1, should be 2
          },
        }
      );

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('2');
    });

    test('should reject ASI that exceeds max 20', async ({ request }) => {
      // Character has strength 16, adding +5 would exceed 20
      const response = await request.post(
        `/api/characters/${characterId}/ability-score-improvement`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          data: {
            improvements: { strength: 5 }, // Would result in 21
          },
        }
      );

      expect(response.status()).toBe(400);
    });

    test('should apply ASI successfully (+2 to one stat)', async ({ request }) => {
      // Get current character
      const beforeResponse = await request.get(`/api/characters/${characterId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const beforeData = await beforeResponse.json();
      const beforeStrength = beforeData.data.strength;

      // Apply ASI: +2 to strength
      const response = await request.post(
        `/api/characters/${characterId}/ability-score-improvement`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          data: {
            improvements: { strength: 2 },
          },
        }
      );

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.data.strength).toBe(beforeStrength + 2);
      expect(data.data.pendingASI).toBe(false);
      expect(data.data.asiHistory.length).toBe(1);
      expect(data.data.asiHistory[0].level).toBe(4);
    });

    test('should reject ASI when no pending ASI', async ({ request }) => {
      // ASI was already applied, so pendingASI is false now
      const response = await request.post(
        `/api/characters/${characterId}/ability-score-improvement`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          data: {
            improvements: { dexterity: 2 },
          },
        }
      );

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('pending');
    });
  });

  test.describe('ASI UI Flow', () => {
    test('should show ASI button when character has pending ASI', async ({ page, request }) => {
      test.setTimeout(180000); // 3 minutes

      // Create a fresh character for UI test
      const charResponse = await request.post('/api/characters', {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          name: 'UI ASI Test Wizard',
          race: 'Elf',
          class: 'Wizard',
          background: 'Sage',
          strength: 8,
          dexterity: 14,
          constitution: 12,
          intelligence: 16,
          wisdom: 14,
          charisma: 10,
        },
      });
      const charData = await charResponse.json();
      const uiCharId = charData.data.id;

      // Level up to 4
      for (let targetLevel = 2; targetLevel <= 4; targetLevel++) {
        const xpNeeded = [300, 900, 2700][targetLevel - 2];
        await request.post(`/api/characters/${uiCharId}/add-experience`, {
          headers: { Authorization: `Bearer ${authToken}` },
          data: { experience: xpNeeded },
        });
        await request.post(`/api/characters/${uiCharId}/level-up`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }

      // Login to UI
      await page.goto('/login');
      await page.getByLabel(/Email/i).fill(TEST_USER_EMAIL);
      await page.getByLabel(/Heslo/i).fill(TEST_USER_PASSWORD);
      await page.getByRole('button', { name: /Přihlásit/i }).click();
      await page.waitForURL('/');

      // Start game with ASI character
      await page.getByRole('button', { name: /Nová Hra/i }).click();

      // Select the wizard character
      await page.getByText('UI ASI Test Wizard').click();
      await page.getByRole('button', { name: /Vybrat a hrát/i }).click();

      // Wait for game to load
      await page.waitForURL(/\/game\/.+/);

      // Verify ASI button is visible (pulsing yellow button)
      const asiButton = page.getByTestId('asi-button');
      await expect(asiButton).toBeVisible({ timeout: 30000 });

      // Click ASI button
      await asiButton.click();

      // Verify ASI modal opens
      await expect(page.getByText(/Ability Score Improvement/i)).toBeVisible();
    });
  });

  test.describe('Inventory UI Flow', () => {
    test('should open inventory panel and show items', async ({ page, request }) => {
      test.setTimeout(180000);

      // Login
      await page.goto('/login');
      await page.getByLabel(/Email/i).fill(TEST_USER_EMAIL);
      await page.getByLabel(/Heslo/i).fill(TEST_USER_PASSWORD);
      await page.getByRole('button', { name: /Přihlásit/i }).click();
      await page.waitForURL('/');

      // Start game
      await page.getByRole('button', { name: /Nová Hra/i }).click();

      // Select first character
      await page.locator('.character-card, [data-testid="character-card"]').first().click();
      await page.getByRole('button', { name: /Vybrat a hrát|Hrát/i }).click();

      // Wait for game
      await page.waitForURL(/\/game\/.+/);

      // Click inventory button
      const inventoryButton = page.getByTestId('inventory-button');
      await expect(inventoryButton).toBeVisible({ timeout: 30000 });
      await inventoryButton.click();

      // Verify inventory panel is visible
      await expect(page.getByText(/Inventář|Vše|Nasazené/i)).toBeVisible();
    });
  });
});
