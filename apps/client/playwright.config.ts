/** @owner CLIENT — browser tests: layout at 11 sizes, axe accessibility, owner-rule flows. Run: pnpm build && pnpm test:e2e */
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests',
  timeout: 120_000,
  fullyParallel: true,
  workers: 3,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:3500', trace: 'off', timezoneId: 'Asia/Kolkata', locale: 'en-IN' },
  webServer: { command: 'npx next start -p 3500', url: 'http://localhost:3500/welcome', reuseExistingServer: true, timeout: 60_000 },
  projects: [{ name: 'phone', use: { ...devices['Pixel 7'] } }],
})
