import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright Configuration for Backend E2E Tests
 *
 * Testy integrace Frontend → Backend → Database → AI
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Maximum time one test can run for */
  timeout: 900 * 1000, // 15 minutes per test (AI complete game flow is slow)

  /* Run tests in files in parallel */
  fullyParallel: false, // Sequential for E2E tests (shared state)

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : 1, // Always 1 worker for E2E tests

  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'playwright-report/test-results.json' }]
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL for API requests */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',

    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          slowMo: process.env.SLOW_MO ? 100 : 0 // Slow down for debugging
        }
      }
    }
  ]

  /* Note: webServer config removed - use existing Docker services on ports 3000 (backend) and 5173 (frontend) */
})
