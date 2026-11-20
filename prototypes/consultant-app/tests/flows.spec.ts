/**
 * End-to-end flows Jitendra Khimlani uses every day. Run on phone, small phone, tablet and desktop.
 */
import { expect, test, type Page } from '@playwright/test'

const fresh = async (page: Page, hash = '/') => {
  await page.goto('./#' + hash)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForFunction(() => localStorage.getItem('bewise.consult.v1'))
}
const state = async (page: Page) => { await page.waitForTimeout(320); return page.evaluate(() => JSON.parse(localStorage.getItem('bewise.consult.v1') || '{}')) } // saves are debounced 250 ms
const errors: string[] = []
test.beforeEach(({ page }) => {
  errors.length = 0
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
})
test.afterEach(() => expect(errors, 'no console errors').toEqual([]))

test.describe('@flows', () => {
  test('Today shows impact, today\'s appointments and needs-you', async ({ page }) => {
    await fresh(page)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Jitendra Khimlani')
    await expect(page.locator('.impact .ms-title')).toContainText(/sessions? to your \d/)
    await expect(page.locator('.tdl-row')).toHaveCount(5)
    await expect(page.getByRole('region', { name: 'Needs you' })).toBeVisible()
  })

  test('share link: copy, templates and QR', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {})
    await fresh(page)
    await page.getByRole('button', { name: 'Share my link' }).click()
    const sheet = page.getByRole('dialog', { name: 'Share your booking link' })
    await expect(sheet.getByAltText('QR code for your booking link')).toBeVisible()
    await sheet.getByRole('button', { name: 'Workshop' }).click()
    await expect(sheet.locator('.wa-preview')).toContainText('workshop')
    await expect(sheet.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', /wa\.me\/\?text=.*bewise\.in/)
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
  })

  test('check in → start → troubling + notes → end → give remedy from suggestions', async ({ page }) => {
    await fresh(page)
    const checkIn = page.locator('.act-in').first()
    if (await checkIn.count()) {
      await checkIn.click()
      await expect(page.locator('.act-start').first()).toBeVisible()
      await page.locator('.act-start').first().click()
    } else {
      const s = await state(page)
      const a = s.appts.find((x: { status: string; start: number }) => x.status === 'confirmed' && x.start > Date.now())
      await page.goto('./#/session/' + a.id)
    }
    await expect(page.locator('.live-top')).toBeVisible()
    await expect(page.locator('.timer')).toHaveText(/\d\d:\d\d/)
    await page.locator('.live .chips-wrap .chip', { hasText: 'Overthinking' }).click()
    await page.locator('.live .chips-wrap .chip', { hasText: 'Anxiety' }).click()
    await expect(page.locator('.sugg li').first()).toBeVisible()
    await page.locator('textarea.notes').fill('Deadline on Friday. Sleeping after 1 AM.')
    await page.getByRole('button', { name: 'End session' }).click()
    await page.getByRole('button', { name: '3 weeks' }).click()
    await page.getByRole('button', { name: 'End and give remedy' }).click()
    const remedy = page.getByRole('dialog', { name: 'Give remedy' })
    await expect(remedy.locator('.sugg-why', { hasText: 'today' }).first()).toBeVisible()
    await remedy.getByRole('button', { name: /Add all/ }).click()
    await remedy.getByRole('button', { name: /Give remedy with \d+ flowers/ }).click()
    await expect(page.locator('.toast').last()).toContainText('Remedy given')
    const s = await state(page)
    const ended = s.appts.find((x: { privateNote?: string }) => x.privateNote?.startsWith('Deadline'))
    expect(ended.status).toBe('completed')
    expect(ended.followUpWeeks).toBe(3)
    expect(ended.troubling).toEqual(expect.arrayContaining(['Overthinking', 'Anxiety']))
    expect(ended.remedy.flowers.length).toBeGreaterThan(0)
  })

  test('new person: validation, duplicate check, save and book with greeting', async ({ page }) => {
    await fresh(page, '/people')
    await page.getByRole('button', { name: 'New person' }).click()
    const form = page.getByRole('dialog', { name: 'Add a person' })
    await form.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(form.getByText('Enter their name.')).toBeVisible()
    await expect(form.getByText('Enter a 10-digit mobile number.')).toBeVisible()
    // duplicate phone
    const s = await state(page)
    const existing = s.people[3].phone.replace(/\D/g, '').slice(-10)
    await form.getByLabel('Full name').fill('Someone New')
    await form.getByLabel('Mobile number').fill(existing)
    await expect(form.getByText(/Already registered as/)).toBeVisible()
    await form.getByLabel('Mobile number').fill('98250 11223')
    await form.getByRole('button', { name: 'Surat' }).click()   // must not submit the form
    await expect(form).toBeVisible()
    await form.getByRole('tab', { name: 'She' }).click()
    await form.getByRole('button', { name: 'Save and book' }).click()
    const express = page.getByRole('dialog', { name: 'Express booking' })
    await express.locator('.x-slot.is-first').click()
    await expect(express.locator('.wa-bubble')).toHaveValue(/Namaste Someone/)
    await express.getByRole('button', { name: /Confirm booking and greet/ }).click()
    await expect(express.getByText('Payment link sent automatically')).toBeVisible({ timeout: 4000 })
    await express.getByRole('button', { name: 'Done' }).click()
    const after = await state(page)
    const p = after.people.find((x: { name: string }) => x.name === 'Someone New')
    expect(p).toMatchObject({ city: 'Surat', pronoun: 'she', phone: '+91 98250 11223' })
    const b = after.appts.find((x: { personId: string }) => x.personId === p.id)
    expect(b).toMatchObject({ status: 'awaiting_payment', kind: 'first' })
    expect(b.greeting).toContain('Namaste Someone')
  })

  test('sessions: summary, focus chips, inline actions, fold and calendar', async ({ page }) => {
    await fresh(page, '/sessions')
    await expect(page.locator('.sum-line')).toBeVisible()
    await page.getByRole('button', { name: /Awaiting payment/ }).click()
    await expect(page.locator('.act-remind').first()).toBeVisible()
    await page.getByRole('button', { name: /^All/ }).click()
    await page.locator('.fold').click()
    await page.getByRole('tab', { name: /Past/ }).click()
    await expect(page.locator('.row-main small.felt').first()).toBeVisible()
    await page.getByRole('button', { name: 'Calendar' }).click()
    const cal = page.getByRole('dialog', { name: 'Calendar' })
    await cal.getByRole('button', { name: 'Next month' }).click()
    await cal.locator('.cal-d').nth(10).click()
    await expect(cal.locator('.x-head')).toBeVisible()
  })

  test('reschedule moves the session and keeps one per slot', async ({ page }) => {
    await fresh(page, '/sessions')
    const before = await state(page)
    await page.locator('.rows .row').nth(1).click()
    const sheet = page.getByRole('dialog', { name: 'Session details' })
    await sheet.getByRole('button', { name: 'Reschedule' }).click()
    const pick = page.getByRole('dialog', { name: 'Pick a time' })
    await pick.locator('.day:not([disabled])').nth(2).click()
    await pick.locator('.slot').first().click()
    await pick.getByRole('button', { name: /Move to/ }).click()
    await expect(page.locator('.toast').last()).toContainText('Moved to')
    const after = await state(page)
    const moved = after.appts.filter((a: { id: string; start: number }) => before.appts.find((b: { id: string; start: number }) => b.id === a.id)?.start !== a.start)
    expect(moved).toHaveLength(1)
  })

  test('people: groups, search, profile with adherence and nudge', async ({ page }) => {
    await fresh(page, '/people?missing')
    await expect(page.getByRole('button', { name: /Missing drops/ })).toHaveAttribute('aria-pressed', 'true')
    await page.locator('.people .row').first().click()
    await expect(page.locator('.adh')).toBeVisible()
    await expect(page.locator('.adh-pill')).toContainText(/Missed \d of last 7 days/)
    await expect(page.getByRole('link', { name: 'Send a gentle nudge' })).toHaveAttribute('href', /wa\.me/)
    await page.goBack()
    await page.getByLabel('Search people').fill('zzzz')
    await expect(page.getByText(/No one matches/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add a new person' })).toBeVisible()
  })

  test('growth shows impact and what people felt', async ({ page }) => {
    await fresh(page, '/growth')
    await expect(page.locator('.impact-panel .ms')).toHaveCount(2)
    await expect(page.getByText('What people said they felt')).toBeVisible()
    await expect(page.locator('.hb-fill.felt').first()).toBeVisible()
  })

  test('changes survive a reload (same day)', async ({ page }) => {
    await fresh(page)
    await page.locator('.act-in').first().click().catch(() => {})
    const s1 = await state(page)
    await page.reload()
    await page.waitForTimeout(400)
    const s2 = await state(page)
    expect(s2.appts.filter((a: { status: string }) => a.status === 'checked_in').length).toBe(s1.appts.filter((a: { status: string }) => a.status === 'checked_in').length)
  })

  test('keyboard: Escape closes sheets, focus is visible', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'keyboard check on desktop')
    await fresh(page)
    await page.getByRole('button', { name: 'Calendar' }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Calendar' })).toBeHidden()
    await page.keyboard.press('Tab')
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle)
    expect(outline).not.toBe('none')
  })
})
