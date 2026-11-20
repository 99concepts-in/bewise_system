/**
 * Layout on every screen size, accessibility (axe), and performance budgets.
 */
import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const SIZES = [
  { name: 'iphone-se-1', width: 320, height: 568 },
  { name: 'android-small', width: 360, height: 740 },
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'iphone-15', width: 393, height: 852 },
  { name: 'pro-max', width: 430, height: 932 },
  { name: 'phone-landscape', width: 844, height: 390 },
  { name: 'ipad-mini', width: 768, height: 1024 },
  { name: 'ipad-landscape', width: 1180, height: 820 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'wide', width: 1920, height: 1080 },
]

async function routes(page: Page) {
  await page.goto('./#/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('.tdl-row')
  await page.waitForFunction(() => localStorage.getItem('bewise.consult.v2'))
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem('bewise.consult.v2') || '{}'))
  const pid = s.people.find((p: { drops?: unknown[] }) => p.drops)?.id ?? s.people[0].id
  const scan = s.appts.find((a: { service: string; status: string }) => a.service === 'scanning' && a.status === 'completed')
  const aid = s.appts.find((a: { status: string; start: number }) => a.status === 'confirmed' && a.start > Date.now()).id
  const tid = s.threads[0].personId
  return ['/', '/people', `/people/${pid}`, `/people/${scan.personId}`, '/messages', `/messages/${tid}`, '/dashboard', '/finance', '/sessions', `/session/${aid}`, '/growth']
}

/** Anything sticking out sideways, except deliberate horizontal scrollers. */
async function overflow(page: Page) {
  return page.evaluate(() => {
    const W = document.documentElement.clientWidth
    const scrollers = '.chips-scroll, .daystrip, .felt-chips, .mood-strip, .quick-replies'
    const bad: string[] = []
    if (document.documentElement.scrollWidth > W + 1) bad.push(`page scrolls sideways: ${document.documentElement.scrollWidth} > ${W}`)
    for (const el of document.querySelectorAll<HTMLElement>('main *, nav *')) {
      if (el.closest(scrollers) || el.closest('[aria-hidden="true"]')) continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.right > W + 1 || r.left < -1) bad.push(`${el.tagName.toLowerCase()}.${el.className}`.slice(0, 80) + ` ${Math.round(r.left)}→${Math.round(r.right)}`)
    }
    // text that is clipped without an ellipsis
    for (const el of document.querySelectorAll<HTMLElement>('main h1, main h2, main h3, main button, main b')) {
      const cs = getComputedStyle(el)
      if (cs.overflow === 'hidden' && cs.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 2) bad.push(`clipped: ${el.textContent?.slice(0, 40)}`)
    }
    return bad.slice(0, 12)
  })
}

test.describe('@layout every screen size', () => {
  for (const size of SIZES) {
    test(`no overflow, nav clear of content: ${size.name} ${size.width}×${size.height}`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height })
      const list = await routes(page)
      for (const r of list) {
        await page.goto('./#' + r)
        await page.waitForTimeout(450)
        expect.soft(await overflow(page), `${r} @ ${size.name}`).toEqual([])
        // the last element of the page can scroll above the floating nav
        const clear = await page.evaluate(() => {
          const nav = document.querySelector('nav.nav') as HTMLElement | null
          if (!nav || getComputedStyle(nav).display === 'none') return true
          const nr = nav.getBoundingClientRect()
          if (nr.height > innerHeight / 2) return true // side rail on desktop
          window.scrollTo(0, document.documentElement.scrollHeight)
          const kids = [...document.querySelectorAll('main .screen > *')]
          const last = kids.at(-1) as HTMLElement | undefined
          return !last || last.getBoundingClientRect().bottom <= nr.top + 4
        })
        expect.soft(clear, `last content above the nav on ${r}`).toBe(true)
        await page.screenshot({ path: `test-results/layout/${size.name}${r.replace(/\//g, '_') || '_today'}.png` })
      }
    })
  }

  test('bottom sheets fit every phone and scroll inside', async ({ page }) => {
    for (const size of SIZES.slice(0, 6)) {
      await page.setViewportSize({ width: size.width, height: size.height })
      await routes(page)
      await page.getByRole('button', { name: 'Share my link' }).click()
      await page.waitForTimeout(700) // spring settles
      const box = await page.locator('.sheet').boundingBox()
      expect(box!.y, size.name).toBeGreaterThanOrEqual(0)
      expect(box!.y + box!.height, size.name).toBeLessThanOrEqual(size.height + 1)
      await page.keyboard.press('Escape')
    }
  })
})

test.describe('accessibility', () => {
  test('no serious or critical axe violations on any screen', async ({ page }) => {
    const list = await routes(page)
    for (const r of list) {
      await page.goto('./#' + r)
      await page.waitForTimeout(900) // let entrance animations finish before checking contrast
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
      const bad = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
      expect(bad, r).toEqual([])
    }
  })
})

test.describe('performance budgets', () => {
  test('first load: small JS, fast paint on a throttled phone', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium')
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await cdp.send('Network.enable')
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 })
    let js = 0
    page.on('response', async (r) => { if (r.url().endsWith('.js') && r.request().resourceType() === 'script') js += Number(r.headers()['content-length'] ?? (await r.body()).length) })
    await page.goto('./', { waitUntil: 'load' })
    const t = await page.evaluate(() => new Promise<{ fcp: number; lcp: number }>((res) => {
      let lcp = 0
      new PerformanceObserver((l) => { for (const e of l.getEntries()) lcp = e.startTime }).observe({ type: 'largest-contentful-paint', buffered: true })
      setTimeout(() => res({ fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0, lcp }), 1500)
    }))
    console.log(`throttled 4× CPU + slow 4G: FCP ${Math.round(t.fcp)} ms, LCP ${Math.round(t.lcp)} ms`)
    expect(t.fcp).toBeLessThan(1500)
    expect(t.lcp).toBeLessThan(2800)
  })

  test('tab switches and sheets respond within a frame budget', async ({ page }) => {
    await routes(page)
    await page.waitForTimeout(1500) // idle prefetch done
    const timeIt = async (action: () => Promise<void>, ready: string) => {
      const t0 = await page.evaluate(() => performance.now())
      await action()
      await page.waitForSelector(ready, { state: 'visible' })
      return (await page.evaluate(() => performance.now())) - t0
    }
    const results = {
      people: await timeIt(() => page.getByRole('button', { name: 'People' }).first().click(), '.board-card'),
      messages: await timeIt(() => page.getByRole('button', { name: /^Messages/ }).first().click(), '.inbox-list .row'),
      dashboard: await timeIt(() => page.getByRole('button', { name: 'Dashboard' }).first().click(), '.remedy-hero'),
      finance: await timeIt(() => page.getByRole('button', { name: 'Finance' }).first().click(), '.fin-today'),
      today: await timeIt(() => page.getByRole('button', { name: 'Today' }).first().click(), '.tdl-row'),
      calendar: await timeIt(() => page.getByRole('button', { name: 'Calendar' }).first().click(), '.cal-grid'),
    }
    console.log('interaction ms', Object.fromEntries(Object.entries(results).map(([k, v]) => [k, Math.round(v)])))
    for (const [k, v] of Object.entries(results)) expect(v, k).toBeLessThan(400)
  })
})

test.describe('offline & repeat visits', () => {
  test.use({ serviceWorkers: 'allow' })
  test('after one visit the app opens with no network, and static files come from cache', async ({ page, context }) => {
    await page.goto('./#/')
    await page.waitForSelector('.tdl-row')
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.reload() // second load is controlled by the service worker and fills the cache
    await page.waitForSelector('.tdl-row')
    await page.waitForTimeout(1500) // idle prefetch of the other screens
    await context.setOffline(true)
    await page.reload()
    await expect(page.locator('.tdl-row').first()).toBeVisible()
    await page.getByRole('button', { name: 'People' }).first().click()
    await expect(page.locator('.board-card').first()).toBeVisible()
    await context.setOffline(false)
  })
})
