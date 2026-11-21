/** @owner CLIENT — owner rules 2026-11-18: drops tick, feedback benefits, public booking link, staff-made booking pay page, check-in deep link. */
import { expect, test } from '@playwright/test'
import { seed } from './seed'

const state = (page: import('@playwright/test').Page) => page.evaluate(() => JSON.parse(localStorage.getItem('bewise-client-v1') || '{}').state)

test('dose check-ins: dots light up, streak, 25-day calendar with past days', async ({ page }) => {
  await seed(page)
  await page.goto('/app')
  await expect(page.getByRole('group', { name: 'Today: 0 of 4 doses' })).toBeVisible()
  // Home (owner 2026-11-20): bottle + 4 drops; each tapped drop lowers the bottle
  const bottle = async () => Number((await page.getByRole('img', { name: /Remedy bottle/ }).getAttribute('aria-label'))!.match(/(\d+)%/)![1])
  const before = await bottle()
  for (let i = 1; i <= 4; i++) await page.getByRole('button', { name: `Dose ${i}`, exact: true }).click()
  await expect(page.getByRole('group', { name: 'Today: 4 of 4 doses' })).toBeVisible()
  await expect(page.getByText('All done for today')).toBeVisible()
  expect(await bottle()).toBeLessThan(before)
  await page.getByRole('link', { name: /View my blend/ }).click(); await page.waitForURL('**/app/remedies**')
  await page.getByRole('button', { name: /See all 25 days/ }).click()
  await expect(page.getByRole('grid', { name: 'Doses by day' })).toBeVisible()
  const pastDay = page.getByRole('grid', { name: 'Doses by day' }).getByRole('button').filter({ hasNotText: '' }).first()
  await pastDay.click(); await page.getByRole('button', { name: 'All 4' }).click()
  const s = await state(page)
  expect(Object.values(s.doses).filter((n) => n === 4).length).toBeGreaterThanOrEqual(2)
})

test('feedback: face, quick tag, optional comment', async ({ page }) => {
  await seed(page)
  await page.goto('/app/sessions/view?id=a1&feedback=1')
  await expect(page.getByText('How do you feel after the session?')).toHaveCount(0)
  await page.getByRole('button', { name: '5 of 5' }).click()
  await page.getByRole('checkbox', { name: 'Felt heard' }).click()
  await page.getByRole('button', { name: 'Add a comment' }).click()
  await page.getByLabel('Your comment').fill('Thank you')
  await page.getByRole('button', { name: 'Send to Jitendra Khimlani' }).click()
  const fb = (await state(page)).appointments.find((a: { id: string }) => a.id === 'a1').feedback
  expect(fb).toMatchObject({ rating: 5, tags: ['Felt heard'], notes: 'Thank you' })
})

test('public booking link: new visitor → landing → sign-in; signed-in → booking with type', async ({ page }) => {
  await seed(page, { onboarded: false })
  await page.goto('/book/jitendra-khimlani?type=followup')
  await expect(page.getByRole('heading', { name: /Book with Jitendra Khimlani/ })).toBeVisible()
  await page.getByRole('button', { name: 'Book an appointment' }).click()
  await page.waitForURL('**/sign-in')
  expect(await page.evaluate(() => sessionStorage.getItem('bw-next'))).toBe('/app/book?type=followup')
  await seed(page)
  await page.goto('/book/jitendra-khimlani?type=followup'); await page.waitForURL('**/app/book?type=followup')
})

test('staff-made booking: pay without picking a slot; late payment → the team confirms a new time', async ({ page }) => {
  await seed(page)
  await page.goto('/app')
  await expect(page.getByText('Complete your booking')).toBeVisible()
  await page.goto('/app/pay?appointment=a3')
  await expect(page.getByText('Jitendra Khimlani booked this for you')).toBeVisible()
  await page.getByRole('button', { name: /Pay ₹800/ }).click(); await page.getByRole('button', { name: 'Google Pay' }).click()
  await expect(page.getByRole('heading', { name: /booked/ })).toBeVisible({ timeout: 8000 })
  expect((await state(page)).appointments.find((a: { id: string }) => a.id === 'a3').status).toBe('confirmed')
  // late payment
  await page.goto('/app/me'); await page.getByRole('button', { name: '…paid after hold expired' }).click()
  await page.getByRole('button', { name: /Pay ₹/ }).click(); await page.getByRole('button', { name: 'Google Pay' }).click()
  await expect(page.getByRole('button', { name: 'View my request' })).toBeVisible({ timeout: 8000 })
  const late = (await state(page)).appointments.find((x: { source?: string; timeTbc?: boolean; paidAt?: string }) => x.timeTbc && x.paidAt && x.source)
  expect(late).toBeTruthy()
  await page.goto(`/app/sessions/view?id=${late.id}`); await expect(page.getByText('Time to be confirmed')).toBeVisible()
})

test('check-in deep link saves against the appointment', async ({ page }) => {
  await seed(page)
  await page.goto('/app/checkin?appointment=a2')
  await page.locator('button[aria-pressed]:has-text("calm")').first().click()
  await page.getByRole('button', { name: 'Continue' }).click(); await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('checkbox', { name: 'Most days' }).click()
  await page.getByRole('button', { name: 'Send to Jitendra Khimlani' }).click()
  await expect(page.getByRole('heading', { name: /Thank you/ })).toBeVisible()
  expect((await state(page)).checkins.a2.answers.now).toBe('calm')
  await page.goto('/app/sessions/view?id=a2'); await expect(page.getByText('Check-in shared')).toBeVisible()
})

test('pay after session: due shown on the session, paying keeps it booked', async ({ page }) => {
  await seed(page)
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('bewise-client-v1')!)
    raw.state.appointments = raw.state.appointments.map((a: { id: string }) => (a.id === 'a2' ? { ...a, payLater: true, status: 'confirmed' } : a))
    localStorage.setItem('bewise-client-v1', JSON.stringify(raw))
  })
  await page.goto('/app/sessions/view?id=a2')
  await expect(page.getByText(/due after your session/)).toBeVisible()
  await page.getByRole('button', { name: /now$/ }).click()
  await expect(page.getByText('Your session with Jitendra Khimlani')).toBeVisible()
  await page.getByRole('button', { name: /Pay ₹/ }).click(); await page.getByRole('button', { name: 'Google Pay' }).click()
  await expect(page.getByRole('heading', { name: 'Thank you' })).toBeVisible({ timeout: 8000 })
  const s = await state(page)
  const a = s.appointments.find((x: { id: string }) => x.id === 'a2')
  expect(a.status).toBe('confirmed'); expect(a.paidAt).toBeTruthy()
})

test('launch offer: yearly reveal → are you sure → 6-month offer → pay → congrats + 15% coupon at checkout', async ({ page }) => {
  await seed(page)
  await page.goto('/app'); await page.getByRole('button', { name: 'Reveal your introductory offer' }).click()
  await expect(page.getByRole('heading', { name: 'Yearly plan' })).toBeVisible()
  await expect(page.getByText('You save ₹1,600')).toBeVisible({ timeout: 5000 })
  await expect(page.getByText('2 months FREE', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ask on WhatsApp' })).toHaveAttribute('href', /wa\.me\/919054220952\?text=I%20want%20to%20avail%20the%20yearly%20offer/)
  await page.getByRole('button', { name: 'Close offer' }).click()
  await expect(page.getByText('Are you sure?')).toBeVisible()
  await page.getByRole('button', { name: 'Yes, I’m sure' }).click()
  await expect(page.getByRole('heading', { name: '6-month plan' })).toBeVisible()
  await expect(page.getByText('1 month FREE')).toBeVisible({ timeout: 5000 })
  await page.getByRole('button', { name: /Claim offer · Pay ₹4,000/ }).click(); await page.getByRole('button', { name: 'Google Pay' }).click()
  await expect(page.getByText(/first step towards your mental and emotional wellbeing/)).toBeVisible({ timeout: 8000 })
  await expect(page.getByText('Expires in 7 days')).toBeVisible()
  const s = await state(page)
  expect(s.plan.id).toBe('half'); expect(s.coupon.pct).toBe(15)
  await page.goto('/app/bag'); await expect(page.getByText(/WELCOME15/)).toBeVisible()
})

test('follow-up with a plan: request only (optional preferences, typed date), the team sets the time', async ({ page }) => {
  await seed(page)
  await page.goto('/app/book?type=followup')
  await expect(page.getByRole('radio', { name: /6 months/ })).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('radio', { name: /Yearly/ }).click()
  await page.getByRole('button', { name: 'Start 2-minute check-in' }).click()
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('radio', { name: /^Online/ }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page.getByRole('heading', { name: /suits you/ })).toBeVisible()
  await page.getByRole('checkbox', { name: 'Evening' }).click()
  await page.getByRole('textbox', { name: 'Preferred date (DD/MM/YYYY)' }).fill('05122026')
  await expect(page.getByRole('textbox', { name: 'Preferred date (DD/MM/YYYY)' })).toHaveValue('05/12/2026')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: /Pay ₹8,000/ }).click(); await page.getByRole('button', { name: 'Google Pay' }).click()
  await expect(page.getByRole('heading', { name: /Request sent/ })).toBeVisible({ timeout: 8000 })
  const s = await state(page)
  const a = s.appointments[s.appointments.length - 1]
  expect(a.timeTbc).toBe(true); expect(a.prefs).toMatchObject({ times: ['Evening'], date: '2026-12-05' }); expect(a.planId).toBe('yearly'); expect(s.plan.used).toBe(1)
  // the team sets the time (preview tool) → the session shows a real date
  await page.goto('/app/me'); await page.getByRole('button', { name: 'Team confirms my time' }).click()
  await page.goto(`/app/sessions/view?id=${a.id}`); await expect(page.getByText('05/12/2026')).toBeVisible()
})

test('checkout: pick up from center, pay, then say yes to subscribing', async ({ page }) => {
  await seed(page)
  await page.goto('/app/checkout')
  await page.getByRole('radio', { name: /Pick up from the center/ }).click()
  await expect(page.getByText('Ready in 1 to 2 days', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: /^🔒 Pay|Pay ₹/ }).click(); await page.getByRole('button', { name: 'Google Pay' }).click()
  await expect(page.getByRole('heading', { name: /Thank you/ })).toBeVisible({ timeout: 8000 })
  await expect(page.getByText('Never run out')).toBeVisible({ timeout: 5000 })
  await page.getByRole('button', { name: 'Yes, subscribe' }).click()
  const s = await state(page)
  expect(s.orders[0].pickup).toBe(true); expect(s.orders[0].subscribed).toEqual(['sleep-roll-on-15'])
})

test('back from checkout returns to the bag, then to the shop (no loop)', async ({ page }) => {
  await seed(page)
  await page.goto('/app/shop')
  await page.getByRole('link', { name: /^Bag/ }).first().click(); await page.waitForURL('**/app/bag**')
  await page.getByRole('link', { name: /checkout/i }).or(page.getByRole('button', { name: /checkout/i })).first().click(); await page.waitForURL('**/app/checkout**')
  await page.getByRole('button', { name: 'Back' }).click(); await page.waitForURL('**/app/bag**')
  await page.getByRole('button', { name: 'Back' }).click(); await page.waitForURL(/\/app\/shop\/?$/)
})

test('?reset=1 starts the device fresh for a demo', async ({ page }) => {
  await seed(page)
  await page.goto('/?reset=1'); await page.waitForURL('**/welcome**')
  const s = await state(page)
  expect(s.profile).toBeNull(); expect(s.appointments).toEqual([]); expect(s.plan).toBeNull()
})

test('My remedies shows the booked session when there is no blend yet', async ({ page }) => {
  await seed(page)
  await page.evaluate(() => { const r = JSON.parse(localStorage.getItem('bewise-client-v1')!); r.state.blend = null; localStorage.setItem('bewise-client-v1', JSON.stringify(r)) })
  await page.goto('/app/remedies')
  await expect(page.getByRole('heading', { name: 'Upcoming sessions' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Book a new session/ })).toBeVisible()
})

test('shop shows a checkout bar once the cart has items', async ({ page }) => {
  await seed(page)
  await page.goto('/app/shop')
  await page.getByRole('button', { name: /^Checkout/ }).click()
  await page.waitForURL('**/app/checkout**')
})

test('launch offer: yearly screen links straight to the 6-month option', async ({ page }) => {
  await seed(page)
  await page.goto('/app'); await page.getByRole('button', { name: 'Reveal your introductory offer' }).click()
  await page.getByRole('button', { name: /Try 6 months/ }).click()
  await expect(page.getByText('Scared of a big commitment? Try 6 months first.')).toBeVisible()
  await expect(page.getByText('Recommended minimum')).toBeVisible()
})

test('home feelings: pick → celebration → collapsed card for that feeling; Change reopens the grid', async ({ page }) => {
  await seed(page)
  await page.evaluate(() => { const r = JSON.parse(localStorage.getItem('bewise-client-v1')!); r.state.journal = []; localStorage.setItem('bewise-client-v1', JSON.stringify(r)) })
  await page.goto('/app')
  await page.getByRole('button', { name: 'Anxious', exact: true }).click()
  await expect(page.getByText('Anxious, noted')).toBeVisible()
  await expect(page.getByText('Today you’re feeling')).toBeVisible({ timeout: 4000 })
  await expect(page.getByRole('button', { name: 'Add a note' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'My journal' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Calm', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Change' }).click()
  await expect(page.getByRole('button', { name: 'Calm', exact: true })).toBeVisible()
})

test('home shows the 4-dose remedy check-in when there is a blend', async ({ page }) => {
  await seed(page)
  await page.goto('/app')
  await expect(page.getByRole('group', { name: /Today: \d of 4 doses/ })).toBeVisible()
})

test('session page: 2-minute check-in Start opens the check-in', async ({ page }) => {
  await seed(page)
  await page.evaluate(() => { const k = 'bewise-client-v1'; const s = JSON.parse(localStorage.getItem(k)!); s.state.checkins = {}; localStorage.setItem(k, JSON.stringify(s)) })
  await page.goto('/app/sessions/view?id=a2')
  await page.getByRole('link', { name: /2-minute check-in/ }).click()
  await page.waitForURL('**/app/checkin**appointment=a2')
  await expect(page.getByText('2-minute check-in · 1 of 3')).toBeVisible()
})
