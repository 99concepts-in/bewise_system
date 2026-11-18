import { defineConfig, devices } from '@playwright/test'

/** Browser tests run against the production build (`vite preview`), on phone, tablet and desktop profiles. */
export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4174/', trace: 'off', serviceWorkers: 'block' },
  webServer: { command: 'pnpm build && pnpm vite preview --port 4174 --strictPort', url: 'http://localhost:4174/', reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'] } },
    { name: 'small-phone', use: { browserName: 'chromium', viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, grep: /@flows|@layout/ },
    { name: 'tablet', use: { browserName: 'chromium', viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true }, grep: /@flows|@layout/ },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }, grep: /@flows|@layout/ },
  ],
})
