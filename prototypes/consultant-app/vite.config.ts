/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// v5 (HUB 2026-11-20): which flower / feeling vectors exist in public/img, known at build time.
// Lets <FlowerArt> fall back to a calm placeholder without ever requesting a missing file (no 404s, no console noise).
function artIndex(): Plugin {
  const id = 'virtual:art-index', rid = '\0' + id
  const list = (dir: string) => {
    try { return readdirSync(fileURLToPath(new URL(`./public/img/${dir}`, import.meta.url))).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4)).sort() }
    catch { return [] }
  }
  return {
    name: 'bewise-art-index',
    resolveId: (s) => (s === id ? rid : undefined),
    load: (s) => (s === rid ? `export const flowers = ${JSON.stringify(list('flowers'))}\nexport const feelings = ${JSON.stringify(list('feelings'))}\n` : undefined),
  }
}

export default defineConfig({
  plugins: [react(), artIndex()],
  base: './',
  // unit tests only; the browser specs in tests/ run with Playwright (pnpm test:e2e)
  test: { include: ['src/**/*.test.ts'] },
  build: {
    target: 'es2022', cssMinify: true, sourcemap: false, modulePreload: { polyfill: false },
    rollupOptions: { output: { experimentalMinChunkSize: 6000 } }, // fold tiny shared icon chunks into their parents
  },
})
