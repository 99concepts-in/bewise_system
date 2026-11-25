/**
 * @owner CLIENT — layout at 11 screen sizes (no sideways scroll, content clear of the floating nav) + axe (WCAG A/AA).
 * Mirrors prototypes/consultant-app/tests/quality.spec.ts.
 */
import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { PUBLIC, ROUTES, seed } from './seed'

const SIZES = [
  { name: 'iphone-se-1', width: 320, height: 568 }, { name: 'android-small', width: 360, height: 740 }, { name: 'iphone-se', width: 375, height: 667 },
  { name: 'iphone-15', width: 393, height: 852 }, { name: 'pro-max', width: 430, height: 932 }, { name: 'phone-landscape', width: 844, height: 390 },
  { name: 'ipad-mini', width: 768, height: 1024 }, { name: 'ipad-landscape', width: 1180, height: 820 }, { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1440, height: 900 }, { name: 'wide', width: 1920, height: 1080 },
]

async function settle(page: Page, r: string) {
  await page.goto(r)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(700)
}

/** Anything sticking out sideways, except deliberate horizontal scrollers. */
async function overflow(page: Page) {
  return page.evaluate(() => {
    const W = document.documentElement.clientWidth
    const bad: string[] = []
    if (document.documentElement.scrollWidth > W + 1) bad.push(`page scrolls sideways: ${document.documentElement.scrollWidth} > ${W}`)
    for (const el of document.querySelectorAll<HTMLElement>('main *, nav *')) {
      if (el.closest('.no-scrollbar, [aria-hidden="true"], svg')) continue
      // clipped by an ancestor that hides overflow (decorative glows inside cards)
      let p = el.parentElement, clipped = false
      while (p && p !== document.body) { const o = getComputedStyle(p).overflowX; if (o === 'hidden' || o === 'clip') { const pr = p.getBoundingClientRect(); if (pr.right <= W + 1 && pr.left >= -1) { clipped = true; break } } p = p.parentElement }
      if (clipped) continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.right > W + 1 || r.left < -1) bad.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)} ${Math.round(r.left)}→${Math.round(r.right)}`)
    }
    return bad.slice(0, 8)
  })
}

/** The last piece of content can scroll fully above the floating nav. */
async function clearOfNav(page: Page) {
  return page.evaluate(async () => {
    const nav = document.querySelector('nav[aria-label="Main"]') as HTMLElement | null
    if (!nav) return true
    window.scrollTo(0, document.documentElement.scrollHeight)
    await new Promise((r) => setTimeout(r, 120))
    const top = nav.getBoundingClientRect().top
    const items = [...document.querySelectorAll<HTMLElement>('main section, main li, main a, main button, main p')].filter((e) => !nav.contains(e) && getComputedStyle(e).position !== 'fixed' && !e.closest('[class*="fixed"]'))
    const last = items.sort((a, b) => b.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom)[0]
    return !last || last.getBoundingClientRect().bottom <= top + 4
  })
}

test.describe('layout on every screen size', () => {
  for (const size of SIZES) {
    test(`${size.name} ${size.width}×${size.height}`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height })
      await seed(page)
      for (const r of ROUTES) {
        await settle(page, r)
        expect.soft(await overflow(page), `${r} overflow @ ${size.name}`).toEqual([])
        expect.soft(await clearOfNav(page), `${r} content hidden behind nav @ ${size.name}`).toBe(true)
      }
      await seed(page, { onboarded: false })
      for (const r of PUBLIC) {
        await settle(page, r)
        expect.soft(await overflow(page), `${r} overflow @ ${size.name}`).toEqual([])
      }
    })
  }
})

test.describe('accessibility (axe WCAG A/AA)', () => {
  for (const r of [...ROUTES, ...PUBLIC]) {
    test(`axe ${r}`, async ({ page }) => {
      await seed(page, { onboarded: !PUBLIC.includes(r) })
      await settle(page, r)
      // the welcome splash fades text in over ~2 s; check the settled screen, not a mid-fade frame
      await page.waitForTimeout(r === '/welcome' ? 2800 : 600)
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      const serious = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ') + (n.any[0]?.message ? ` (${n.any[0].message.slice(0, 90)})` : '')).join(' | ')}`)
      expect(serious, r).toEqual([])
    })
  }
})
