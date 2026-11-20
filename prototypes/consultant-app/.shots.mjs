// temporary screenshot script (removed after use)
import { chromium } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
const DIST = new URL('./dist/', import.meta.url).pathname
const OUT = process.argv[2]
const only = process.argv[3]
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' }
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: 'block' })
const errors = []
await ctx.route('http://app.local/**', async (r) => {
  let p = decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//, '') || 'index.html'
  try { const body = await readFile(join(DIST, p)); await r.fulfill({ body, contentType: TYPES[extname(p)] ?? 'application/octet-stream' }) }
  catch { errors.push('404 ' + p); await r.fulfill({ status: 404, body: 'nf' }) }
})
const page = await ctx.newPage()
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
const go = async (hash) => { await page.goto('http://app.local/index.html#' + hash); await page.waitForTimeout(1300) }
await go('/'); await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(1300)
await page.waitForFunction(() => localStorage.getItem('bewise.consult.v1'), null, { timeout: 5000 }).catch(() => { console.log(errors.join('\n')) })
const shot = async (name, full = false) => { if (only && !name.includes(only)) return; await page.waitForTimeout(500); await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full }) }
await shot('01-today')
await shot('01b-today-full', true)
// session sheet
await page.locator('.tdl-row:has(.safety) .tl-hit').first().click(); await page.waitForTimeout(900)
await shot('05-session-sheet')
await page.keyboard.press('Escape'); await page.waitForTimeout(500)
// live session -> end -> remedy builder (the real flow)
{
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('bewise.consult.v1') || '{}'))
  const a = st.appts.find((x) => x.status === 'confirmed' && x.start > Date.now() && x.feelings && st.appts.some((y) => y.personId === x.personId && y.remedy))
  await go('/session/' + a.id)
  for (const c of ['Anxiety', 'Overthinking']) await page.getByRole('button', { name: new RegExp('^' + c) }).click()
  await page.waitForTimeout(600)
  await shot('08-live'); await shot('08b-live-full', true)
  await page.locator('.live-foot .fab').click(); await page.waitForTimeout(700)
  await page.getByRole('button', { name: 'End and give remedy' }).click(); await page.waitForTimeout(1500)
  const tiles = page.locator('.sheet .sugg .ftile:not(.is-on)')
  for (let i = 0; i < 2; i++) await tiles.nth(0).click()
  await page.waitForTimeout(500)
  await shot('02-remedy-builder')
  await page.locator('.sheet-root[aria-hidden="false"] .sheet-body').evaluate((el) => el.scrollTo(0, 700)); await page.waitForTimeout(600)
  await shot('02b-remedy-builder-scrolled')
  await page.keyboard.press('Escape'); await page.waitForTimeout(500)
}
const s = await page.evaluate(() => JSON.parse(localStorage.getItem('bewise.consult.v1') || '{}'))
const pid = s.people.find((p) => p.drops && s.appts.filter((a) => a.personId === p.id && a.remedy).length > 2)?.id ?? s.people.find((p) => p.drops).id
await go('/people/' + pid); await shot('03-profile'); await shot('03b-profile-full', true)
await go('/sessions'); await shot('04-sessions')
await go('/people'); await shot('06-people')
await go('/growth'); await shot('07-growth')
await page.setViewportSize({ width: 1280, height: 800 }); await go('/'); await shot('09-desktop-today')
console.log(errors.length ? errors.join('\n') : 'no errors')
await b.close()
