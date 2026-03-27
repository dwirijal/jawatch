import { defineConfig, devices } from '@playwright/test';

const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH || '/usr/bin/chromium-browser';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:3020',
    browserName: 'chromium',
    headless: true,
    launchOptions: {
      executablePath: chromiumPath,
    },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'PORT=3020 npm run start',
    url: 'http://127.0.0.1:3020',
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
