import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env['BASE_URL'] || 'http://localhost:3000';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'node apps/web-e2e/src/mock-server/anilist-mock.mjs',
      url: 'http://127.0.0.1:4010',
      reuseExistingServer: false,
      cwd: workspaceRoot,
      timeout: 30000,
    },
    {
      command: 'npx nx run web:dev',
      url: 'http://localhost:3000',
      reuseExistingServer: false,
      cwd: workspaceRoot,
      timeout: 120000,
      env: {
        ...process.env,
        PLAYWRIGHT_TEST: '1',
        ANILIST_ENDPOINT: 'http://127.0.0.1:4010',
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
