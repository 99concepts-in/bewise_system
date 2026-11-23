import { defineConfig } from 'vitest/config'

// unit tests only; the browser tests in tests/ run with Playwright (pnpm test:e2e)
export default defineConfig({ test: { include: ['src/**/*.test.ts'] } })
