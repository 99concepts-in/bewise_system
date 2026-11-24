/** @owner CLIENT — owner rules 2026-11-18: drops tick, feedback benefits, public booking link, staff-made booking pay page, check-in deep link. */
import { expect, test } from '@playwright/test'
import { seed } from './seed'

const state = (page: import('@playwright/test').Page) => page.evaluate(() => JSON.parse(localStorage.getItem('bewise-client-v1') || '{}').state)

test('dose check-ins: each dose asks how you feel, then View my progress shows the 25 days', async ({ page }) => {
  await seed(page)
  await page.goto('/app')
  await expect(page.getByRole('group', { name: 'Today: 0 of 4 doses' })).toBeVisible()
  // Home (owner 2026-11-20): bottle + 4 drops; each tapped drop lowers the bottle
  const bottle = async () => Number((await page.getByRole('img', { name: /Remedy bottle/ }).getAttribute('aria-label'))!.match(/(\d+)%/)![1])
  const before = await bottle()
  // owner 2026-11-24: every dose asks how they feel (the mood logger opens); close it and carry on
  for (let i = 1; i <= 4; i++) {
    await page.getByRole('button', { name: `Dose ${i}`, exact: true }).click()
    await expect(page.getByRole('slider', { name: 'How pleasant or unpleasant' })).toBeVisible({ timeout: 3000 })
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Log how you feel' })).toHaveCount(0)
  }
  await expect(page.getByRole('group', { name: 'Today: 4 of 4 doses' })).toBeVisible()
  await expect(page.getByText('All done for today')).toBeVisible()
  expect(await bottle()).toBeLessThan(before)
  // owner 2026-11-24: "View my progress" opens the 25-day summary on Home
  await page.getByRole('button', { name: 'View my progress' }).click()
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

test('feedback: adding a comment keeps the sheet open; only the handle swipes it closed', async ({ page }) => {
  await seed(page)
  await page.goto('/app/sessions/view?id=a1&feedback=1')
  await page.getByRole('button', { name: '5 of 5' }).click()
  await page.getByRole('button', { name: 'Add a comment' }).click()
  const box = page.getByLabel('Your comment')
  await box.click(); await box.fill('Lovely session')
  // a downward drag inside the sheet (like a scroll or iPhone's zoom on focus) must not close it
  const bb = (await box.boundingBox())!
  await page.mouse.move(bb.x + 40, bb.y + 10); await page.mouse.down(); await page.mouse.move(bb.x + 40, bb.y + 320, { steps: 8 }); await page.mouse.up()
  await page.waitForTimeout(500)
  await expect(page.getByLabel('Your comment')).toHaveValue('Lovely session')
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('#fbnotes')!).fontSize)).toBe('16px')
  // dragging the handle down does close it
  const dlg = page.getByRole('dialog', { name: 'How was your session?' })
  const hb = (await dlg.boundingBox())!
  await page.mouse.move(hb.x + hb.width / 2, hb.y + 12); await page.mouse.down(); await page.mouse.move(hb.x + hb.width / 2, hb.y + 400, { steps: 10 }); await page.mouse.up()
  await expect(dlg).toHaveCount(0, { timeout: 3000 })
})

test('feedback: a smiling face hides the negative tags (and drops them if picked)', async ({ page }) => {
  await seed(page)
  await page.goto('/app/sessions/view?id=a1&feedback=1')
  await page.getByRole('button', { name: '2 of 5' }).click()
  await page.getByRole('checkbox', { name: 'Too short' }).click()
  await page.getByRole('button', { name: '5 of 5' }).click()
  await expect(page.getByRole('checkbox', { name: 'Too short' })).toHaveCount(0)
  await expect(page.getByRole('checkbox', { name: 'Hard to connect' })).toHaveCount(0)
  await expect(page.getByRole('checkbox', { name: 'Warm' })).toBeVisible()
  await page.getByRole('button', { name: 'Send to Jitendra Khimlani' }).click()
  const fb = (await state(page)).appointments.find((a: { id: string }) => a.id === 'a1').feedback
  expect(fb.tags).toEqual([])
})

test('review card: 4 or 5 stars invites a shareable card; 3 stars does not', async ({ page }) => {
  await seed(page)
  await page.goto('/app/sessions/view?id=a1&feedback=1')
  await page.getByRole('button', { name: '3 of 5' }).click()
  await page.getByRole('button', { name: 'Send to Jitendra Khimlani' }).click()
  await expect(page.getByText('Thank you', { exact: true })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Share your experience' })).toHaveCount(0)
  await page.goto('/app/sessions/view?id=a1&feedback=1')
  await page.getByRole('button', { name: '5 of 5' }).click()
  await page.getByRole('checkbox', { name: 'Felt heard' }).click()
  await page.getByRole('button', { name: 'Send to Jitendra Khimlani' }).click()
  // owner 2026-11-24: straight to a full screen with the card, share icons, or a Google review instead
  const screen = page.getByRole('dialog', { name: 'Share your experience' })
  await expect(screen).toBeVisible()
  await expect(screen.getByRole('img', { name: 'Share card preview' })).toBeVisible({ timeout: 8000 })
  for (const n of ['Instagram', 'More', 'Save', 'Copy link']) await expect(screen.getByRole('button', { name: n })).toBeVisible()
  await expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', /wa\.me\/\?text=.*welcome/)
  await expect(screen.getByRole('link', { name: /Write a Google review instead/ })).toHaveAttribute('href', /google/)
  // themes, edit the words, then review / tags / both
  const src = () => screen.getByRole('img', { name: 'Share card preview' }).getAttribute('src')
  const before = await src()
  await screen.getByRole('radio', { name: 'Midnight' }).click()
  await expect.poll(src).not.toBe(before)
  await expect(screen.getByRole('radiogroup', { name: 'Show on the card' })).toHaveCount(0) // only tags so far
  await screen.getByRole('button', { name: 'Edit' }).click()
  await screen.getByLabel('Your words on the card').fill('I felt calm for the first time in weeks.')
  await screen.getByRole('button', { name: 'Done' }).first().click()
  for (const n of ['Review', 'Tags', 'Both']) await expect(screen.getByRole('radio', { name: n })).toBeVisible()
  await screen.getByRole('radio', { name: 'Both' }).click()
  await expect(screen.getByRole('radio', { name: 'Both' })).toHaveAttribute('aria-checked', 'true')
  await screen.getByRole('button', { name: 'Done' }).click()
  await expect(screen).toHaveCount(0)
})

test('story sharing: card preview and link to the public story page', async ({ page }) => {
  await seed(page); await page.goto('/app/learn/story?id=anger')
  await page.getByRole('button', { name: 'Share this story' }).first().click()
  await expect(page.getByRole('heading', { name: 'Share this story' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Share card preview' })).toBeVisible({ timeout: 8000 })
  await expect(page.getByRole('link', { name: /WhatsApp/ })).toHaveAttribute('href', /s%2Fanger%2F/)
})

test('shared story link: anyone can read it; not signed in → "new here" → more stories → onboarding', async ({ page }) => {
  await page.goto('/s/anger')
  await expect(page.getByText('Anger · 1 of 7')).toBeVisible()
  await page.getByRole('button', { name: 'Close story' }).click()
  await expect(page.getByRole('heading', { name: 'You seem to be new here' })).toBeVisible()
  await page.getByRole('link', { name: 'View more stories' }).click()
  await page.waitForURL('**/stories**')
  await expect(page.getByRole('link', { name: /^Read: / })).toHaveCount(8)
  await page.getByRole('link', { name: 'Start my journey' }).click()
  await page.waitForURL('**/welcome**')
})

test('shared story link: a signed-in member continues in the app', async ({ page }) => {
  await seed(page); await page.goto('/s/sleep')
  await page.waitForURL('**/app/learn/story?id=sleep')
  await expect(page.getByText(/Sleep · 1 of/)).toBeVisible()
})

test('public booking link: new visitor → landing → sign-in; signed-in → booking', async ({ page }) => {
  await seed(page, { onboarded: false })
  await page.goto('/book/jitendra-khimlani?type=followup')
  await expect(page.getByRole('heading', { name: /Book with Jitendra Khimlani/ })).toBeVisible()
  await page.getByRole('button', { name: 'Book a session' }).click()
  await page.waitForURL('**/sign-in')
  expect(await page.evaluate(() => sessionStorage.getItem('bw-next'))).toBe('/app/book')
  await seed(page)
  await page.goto('/book/jitendra-khimlani?type=followup'); await page.waitForURL('**/app/book')
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
  await page.goto('/app'); await page.getByRole('button', { name: 'Reveal your wellness journey plan' }).click()
  await expect(page.getByRole('heading', { name: 'Yearly plan' })).toBeVisible()
  await expect(page.getByText('You save ₹1,600')).toBeVisible({ timeout: 5000 })
  await expect(page.getByText('2 months FREE', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ask on WhatsApp' })).toHaveAttribute('href', /wa\.me\/919054220952\?text=I%20want%20to%20start%20the%201-year%20wellness%20journey%20plan/)
  await page.getByRole('button', { name: 'Close plan' }).click()
  await expect(page.getByText('Are you sure?')).toBeVisible()
  await page.getByRole('button', { name: 'Yes, I’m sure' }).click()
  await expect(page.getByRole('heading', { name: '6-month plan' })).toBeVisible()
  await expect(page.getByText('1 month FREE')).toBeVisible({ timeout: 5000 })
  await page.getByRole('button', { name: /Start my plan · Pay ₹4,000/ }).click(); await page.getByRole('button', { name: 'Google Pay' }).click()
  await expect(page.getByText(/first step towards your mental and emotional wellbeing/)).toBeVisible({ timeout: 8000 })
  await expect(page.getByText('Expires in 7 days')).toBeVisible()
  const s = await state(page)
  expect(s.plan.id).toBe('half'); expect(s.coupon.pct).toBe(15)
  await page.goto('/app/bag'); await expect(page.getByText(/WELCOME15/)).toBeVisible()
})

test('appointment with a plan: request only (optional preferences, typed date), the team sets the time', async ({ page }) => {
  await seed(page)
  await page.goto('/app/book')
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

test('my care: remedies collapsed to what the blend supports; tap to expand', async ({ page }) => {
  await seed(page); await page.goto('/app/remedies')
  const toggle = page.getByRole('button', { name: /Your blend supports/ })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('list', { name: 'What your blend supports' }).getByRole('listitem')).toHaveCount(3)
  await expect(page.getByRole('list', { name: 'Remedies in your blend' })).toHaveCount(0)
  await toggle.click()
  await expect(page.getByRole('list', { name: 'Remedies in your blend' }).getByRole('button')).toHaveCount(3)
})

test('checkout: a saved address is selected on load; the new-address form can be closed', async ({ page }) => {
  await seed(page)
  await page.goto('/app/checkout')
  const pay = page.getByRole('button', { name: /Pay ₹/ })
  await expect(page.getByRole('button', { name: /Priya Shah/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(pay).toBeEnabled()
  await page.getByRole('button', { name: 'Add a new address' }).click()
  await expect(page.getByText('New address', { exact: true })).toBeVisible()
  await expect(pay).toBeEnabled()
  await page.getByRole('button', { name: 'Close new address' }).click()
  await expect(page.getByText('New address', { exact: true })).toHaveCount(0)
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
  await expect(page.getByRole('link', { name: /Book a session/ })).toBeVisible()
})

test('shop shows a checkout bar once the cart has items', async ({ page }) => {
  await seed(page)
  await page.goto('/app/shop')
  await page.getByRole('button', { name: /^Checkout/ }).click()
  await page.waitForURL('**/app/checkout**')
})

test('launch offer: yearly screen links straight to the 6-month option', async ({ page }) => {
  await seed(page)
  await page.goto('/app'); await page.getByRole('button', { name: 'Reveal your wellness journey plan' }).click()
  await page.getByRole('button', { name: /Try 6 months/ }).click()
  await expect(page.getByText('Scared of a big commitment? Try 6 months first.')).toBeVisible()
  await expect(page.getByText('Recommended minimum')).toBeVisible()
})

test('home: log how you feel (slider → feeling → note), shown for 4 hours; evening asks about the day', async ({ page }) => {
  await seed(page)
  await page.evaluate(() => { const r = JSON.parse(localStorage.getItem('bewise-client-v1')!); r.state.journal = []; localStorage.setItem('bewise-client-v1', JSON.stringify(r)) })
  await page.goto('/app')
  await page.getByRole('button', { name: /Log how you feel right now/ }).click()
  const slider = page.getByRole('slider', { name: 'How pleasant or unpleasant' })
  await slider.fill('6')
  await expect(page.getByText('Very pleasant', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('textbox', { name: 'Search any feeling' }).fill('calm')
  await page.getByRole('button', { name: 'Calm', exact: true }).click()
  await page.getByRole('textbox', { name: 'Add a note' }).fill('after a walk')
  await page.getByRole('button', { name: 'Log it' }).click()
  await expect(page.getByText('Daily mood').or(page.getByText('Right now', { exact: true }))).toBeVisible()
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByText(/You felt/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Edit note' })).toBeVisible()
  const s = await state(page)
  expect(s.journal[0]).toMatchObject({ emotion: 'calm', valence: 7, kind: 'moment', note: 'after a walk' })
  // 4 hours later the prompt is back
  await page.evaluate(() => { const r = JSON.parse(localStorage.getItem('bewise-client-v1')!); r.state.journal[0].at = new Date(Date.now() - 5 * 3600e3).toISOString(); localStorage.setItem('bewise-client-v1', JSON.stringify(r)) })
  await page.reload()
  await expect(page.getByRole('button', { name: /Log how you feel right now/ })).toBeVisible()
})

test('first time with a blend: reminders popup', async ({ page }) => {
  await seed(page)
  await page.evaluate(() => { const r = JSON.parse(localStorage.getItem('bewise-client-v1')!); r.state.reminders = {}; localStorage.setItem('bewise-client-v1', JSON.stringify(r)) })
  await page.goto('/app')
  await expect(page.getByRole('heading', { name: /Never miss your drops/ })).toBeVisible({ timeout: 5000 })
  await page.getByRole('button', { name: 'Not now' }).click()
  expect((await state(page)).reminders.askedAt).toBeTruthy()
  await page.reload(); await page.waitForTimeout(1600)
  await expect(page.getByRole('heading', { name: /Never miss your drops/ })).toHaveCount(0)
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

test('one appointment: no first/follow-up choice, nothing to pay now; the team sets type, fee and time, then the client pays', async ({ page }) => {
  await seed(page)
  await page.evaluate(() => { const k = 'bewise-client-v1'; const s = JSON.parse(localStorage.getItem(k)!); s.state.plan = null; s.state.appointments = s.state.appointments.filter((a: { status: string }) => a.status === 'completed'); localStorage.setItem(k, JSON.stringify(s)) })
  await page.goto('/app/book')
  await expect(page.getByRole('heading', { name: /Book a wellness session/ })).toBeVisible()
  await expect(page.getByText('First consultation', { exact: true })).toHaveCount(0)
  await page.getByRole('radio', { name: /One session/ }).click()
  await page.getByRole('button', { name: 'Start 2-minute check-in' }).click()
  await page.getByRole('button', { name: 'calm' }).click()
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('radio', { name: /^In person/ }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page.getByText('To pay now')).toBeVisible()
  await page.getByRole('button', { name: 'Send request' }).click()
  await expect(page.getByRole('heading', { name: /Request sent/ })).toBeVisible()
  let s = await state(page)
  const a = s.appointments[s.appointments.length - 1]
  expect(a).toMatchObject({ kindTbc: true, amountPaise: 0, timeTbc: true }); expect(a.paidAt).toBeUndefined()
  expect(s.checkins[a.id].answers.now).toBe('calm')
  // the team sets it (preview tool): returning client → follow-up ₹800, awaiting payment
  await page.goto('/app/me'); await page.getByRole('button', { name: 'Team confirms my time' }).click()
  await expect(page.getByText('Time confirmed by the team')).toBeVisible()
  s = await state(page)
  expect(s.appointments.find((x: { id: string }) => x.id === a.id)).toMatchObject({ kindTbc: false, type: 'followup', amountPaise: 80000, status: 'awaiting_payment' })
  await page.goto('/app'); await expect(page.getByText('Complete your booking')).toBeVisible({ timeout: 10000 })
})

test('learn: search a concern, open a story, tap through to the end, book', async ({ page }) => {
  await seed(page)
  await page.goto('/app/learn')
  await page.getByRole('textbox', { name: 'Search a concern' }).fill('sleep')
  await expect(page.getByText('We can help with this', { exact: true })).toBeVisible()
  // owner 2026-11-24: no remedy names in search results
  await expect(page.getByText(/White Chestnut|Vervain|Olive/)).toHaveCount(0)
  await page.getByRole('link', { name: 'Read: Bach flowers and sleep' }).click()
  await page.waitForURL('**/app/learn/story**')
  for (let i = 0; i < 7; i++) await page.getByRole('button', { name: 'Next slide' }).click()
  await expect(page.getByText('Sleep · 8 of 8')).toBeVisible()
  await expect(page.getByText(/do not replace medical care/)).toBeVisible()
  await page.getByRole('link', { name: 'Book a session' }).click()
  await page.waitForURL('**/app/book**')
})

test('my care: how to take your remedy', async ({ page }) => {
  await seed(page)
  await page.goto('/app/remedies')
  await page.getByRole('button', { name: /How to take your remedy/ }).click()
  await expect(page.getByText('4 drops, 4 times a day', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /WhatsApp 98980 20939/ })).toHaveAttribute('href', /wa\.me\/919898020939/)
})

test('after onboarding: add to home screen, then "Turn on notifications?" → the phone asks (Android)', async ({ page }) => {
  // stand-in for the phone's own permission dialog: records that it was asked and answers Allow
  await page.addInitScript(() => {
    let perm = 'default'
    Object.defineProperty(Notification, 'permission', { get: () => perm, configurable: true })
    Notification.requestPermission = async () => { (window as unknown as { __asked: number }).__asked = 1; perm = 'granted'; return 'granted' as NotificationPermission }
  })
  await seed(page)
  await page.evaluate(() => localStorage.removeItem('bewise-setup'))
  await page.goto('/app')
  await expect(page.getByRole('heading', { name: 'Keep BeWise one tap away' })).toBeVisible({ timeout: 4000 })
  await expect(page.getByText('Open the menu')).toBeVisible()
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('heading', { name: 'Turn on notifications?' })).toBeVisible()
  await page.getByRole('button', { name: 'Allow notifications' }).click()
  await expect.poll(() => page.evaluate(() => (window as unknown as { __asked?: number }).__asked)).toBe(1)
  await expect(page.getByRole('heading', { name: 'Turn on notifications?' })).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('bewise-setup'))).toBe('done')
  // shown once only
  await page.reload(); await page.waitForTimeout(1800)
  await expect(page.getByRole('heading', { name: 'Keep BeWise one tap away' })).toHaveCount(0)
})

test('after onboarding on iPhone Safari: home screen steps, then we ask for notifications from the home screen app', async ({ browser }) => {
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', viewport: { width: 390, height: 664 }, hasTouch: true, isMobile: true })
  const page = await ctx.newPage()
  // like Safari on iPhone before BeWise is on the home screen: no notifications at all
  await page.addInitScript(() => { delete (window as unknown as { Notification?: unknown }).Notification })
  await seed(page)
  await page.evaluate(() => localStorage.removeItem('bewise-setup'))
  await page.goto('/app')
  await expect(page.getByRole('heading', { name: 'Keep BeWise one tap away' })).toBeVisible({ timeout: 4000 })
  await expect(page.getByText('Tap Share')).toBeVisible()
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByText(/once BeWise is on your home screen/)).toBeVisible()
  await page.getByRole('button', { name: 'Okay' }).click()
  expect(await page.evaluate(() => localStorage.getItem('bewise-setup'))).toBe('notify-later')
  await ctx.close()
})

test('onboarding: phone → name → birthdate → gender → home; details we know are prefilled and editable', async ({ page }) => {
  await page.goto('/?reset=1'); await page.waitForURL('**/welcome**')
  await page.goto('/sign-in')
  await page.getByRole('textbox').first().fill('9898989898')
  await page.getByRole('button', { name: 'Send code' }).click()
  await page.getByLabel('4-digit code').fill('2468')
  await page.waitForURL('**/onboarding/name')
  await expect(page.getByLabel('Your name')).toHaveValue('Meera Patel')
  await page.getByLabel('Your name').fill('Meera P. Patel')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.waitForURL('**/onboarding/dob')
  await expect(page.getByLabel('Date of birth (DD/MM/YYYY)')).toHaveValue('14/03/1988')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.waitForURL('**/onboarding/gender')
  await expect(page.getByRole('radio', { name: /Female/ })).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('button', { name: 'Let’s go' }).click()
  await page.waitForURL('**/app')
  const s = await state(page)
  expect(s.profile).toMatchObject({ name: 'Meera P. Patel', dob: '1988-03-14', gender: 'Female', phone: '9898989898' })
  expect(s.profile.onboardedAt).toBeTruthy()
  // short tour, skippable
  await expect(page.getByText(/Quick tour · 1 of/)).toBeVisible({ timeout: 5000 })
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByText(/Quick tour · 2 of/)).toBeVisible()
  await page.getByRole('button', { name: 'Skip tour' }).click()
  await expect(page.getByText(/Quick tour/)).toHaveCount(0)
  expect((await state(page)).profile.tourPending).toBe(false)
})

test('welcome: Start my journey → 6 screens → Let’s get started → sign in; Already a member', async ({ page }) => {
  await page.goto('/?reset=1'); await page.waitForURL('**/welcome**')
  await expect(page.getByRole('heading', { name: /Welcome to BeWise Holistic Wellness/ })).toBeVisible({ timeout: 5000 })
  await expect(page.getByRole('button', { name: 'Already a member' })).toBeVisible()
  await page.getByRole('button', { name: 'Start my journey' }).click()
  await expect(page.getByRole('heading', { name: /emotional wellbeing/ })).toBeVisible()
  for (const h of [/Bach flower journey/, /can help you/, /Ask BeWise/, /wellness products/, /Jitendra Khimlani/]) { await page.getByRole('button', { name: 'Next' }).click(); await expect(page.getByRole('heading', { name: h })).toBeVisible() }
  await page.getByRole('button', { name: 'Let’s get started' }).click()
  await page.waitForURL('**/sign-in')
})

test('blend being prepared: after a session, before the blend is ready', async ({ page }) => {
  await seed(page)
  await page.evaluate(() => { const k = 'bewise-client-v1'; const r = JSON.parse(localStorage.getItem(k)!); r.state.blend = null; localStorage.setItem(k, JSON.stringify(r)) })
  await page.goto('/app')
  await expect(page.getByRole('heading', { name: 'Your blend is being prepared' })).toBeVisible()
  await page.goto('/app/remedies')
  await expect(page.getByRole('heading', { name: 'Your blend is being prepared' })).toBeVisible()
})

test('dose reminders: app follows up 45 min after the first (WhatsApp) one, then 4 h after each dose, repeating every 45 min', async ({ page }) => {
  await seed(page)
  const set = (fn: string) => page.evaluate((f) => { const k = 'bewise-client-v1'; const r = JSON.parse(localStorage.getItem(k)!); new Function('s', f)(r.state); localStorage.setItem(k, JSON.stringify(r)) }, fn)
  const today = await page.evaluate(() => { const x = new Date(); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}` })
  const hhmm = await page.evaluate(() => { const d = new Date(Date.now() - 2 * 3600e3); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` })
  const notices = async () => (await state(page)).notices.map((n: { title: string }) => n.title)
  // first dose due 2 h ago, nothing logged → follow-up
  await set(`s.reminders = { askedAt: new Date().toISOString(), on: true, firstAt: '${hhmm}' }; s.doses = s.doses || {}; s.doses['${today}'] = 0; s.drops = {}; s.notices = []`)
  await page.goto('/app'); await page.waitForTimeout(800)
  expect((await notices())[0]).toMatch(/first drops/)
  // nudged 10 min ago → no repeat yet
  const before = (await notices()).length
  await page.reload(); await page.waitForTimeout(800)
  expect((await notices()).length).toBe(before)
  // one dose taken 5 h ago → next reminder due → nudge for dose 2
  await set(`s.doses['${today}'] = 1; s.reminders.lastDoseAt = new Date(Date.now() - 5 * 3600e3).toISOString(); s.reminders.lastNudgeAt = undefined; s.notices = []`)
  await page.reload(); await page.waitForTimeout(800)
  expect((await notices())[0]).toMatch(/2 of 4/)
  // still not logged 50 min later → repeat
  await set(`s.reminders.lastNudgeAt = new Date(Date.now() - 50 * 60e3).toISOString(); s.notices = []`)
  await page.reload(); await page.waitForTimeout(800)
  expect((await notices())[0]).toMatch(/2 of 4/)
})

test('last dose of the day opens the mood slider straight away (no breathe screen)', async ({ page }) => {
  await seed(page)
  const today = await page.evaluate(() => { const x = new Date(); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}` })
  await page.evaluate((d) => { const k = 'bewise-client-v1'; const r = JSON.parse(localStorage.getItem(k)!); r.state.doses = { ...(r.state.doses || {}), [d]: 3 }; localStorage.setItem(k, JSON.stringify(r)) }, today)
  await page.goto('/app')
  await page.getByRole('button', { name: 'Dose 4', exact: true }).click()
  await expect(page.getByRole('slider', { name: 'How pleasant or unpleasant' })).toBeVisible({ timeout: 3000 })
  await expect(page.getByRole('dialog', { name: 'A moment to breathe' })).toHaveCount(0)
})

test('home: connect with Jitendra Khimlani on Instagram', async ({ page }) => {
  await seed(page); await page.goto('/app')
  await expect(page.getByRole('link', { name: /Connect with Jitendra Khimlani on Instagram/ })).toHaveAttribute('href', 'https://www.instagram.com/jitubhaiyajgd/')
})

test('mood garden: blooms after 10 check-ins, asks for more before that', async ({ page }) => {
  await seed(page); await page.goto('/app')
  await expect(page.getByRole('heading', { name: 'Your mood garden' })).toBeVisible()
  await expect(page.getByRole('img', { name: /^Mood flower: / })).toBeVisible()
  await expect(page.getByText('Last 14 days')).toBeVisible()
  await page.evaluate(() => { const k = 'bewise-client-v1'; const r = JSON.parse(localStorage.getItem(k)!); r.state.journal = r.state.journal.slice(0, 3); localStorage.setItem(k, JSON.stringify(r)) })
  await page.reload()
  await expect(page.getByRole('img', { name: '3 of 10 check-ins' })).toBeVisible()
  await expect(page.getByText('7 more check-ins to go')).toBeVisible()
})

test('note to Jitendra Khimlani: pick a topic, send, see delivered then read', async ({ page }) => {
  await seed(page); await page.goto('/app')
  await page.getByRole('link', { name: /Say thank you/ }).click()
  await page.waitForURL('**/app/chat?topic=gratitude')
  const box = page.getByRole('textbox', { name: 'Message Jitendra Khimlani' })
  await expect(box).toHaveValue(/^Thank you, Jitu bhaiya\./)
  await box.fill('Thank you, Jitu bhaiya. I slept well this week.')
  await page.getByRole('button', { name: 'Send' }).click()
  const msgs = page.getByRole('list', { name: 'Messages' })
  await expect(msgs.getByText('I slept well this week.', { exact: false })).toBeVisible()
  await expect(msgs.getByRole('img', { name: 'Delivered' })).toBeVisible({ timeout: 4000 })
  await expect(page.getByText(/Read by Jitendra Khimlani/)).toBeVisible({ timeout: 16000 })
})

test('after logging a mood, a popup offers a note to Jitendra Khimlani, once a day', async ({ page }) => {
  await seed(page); await page.goto('/app')
  await page.getByRole('button', { name: /Log how you feel|Log again/ }).first().click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('dialog', { name: 'Log how you feel' }).getByRole('button', { name: 'Calm', exact: true }).click()
  await page.getByRole('button', { name: 'Log it' }).click()
  await expect(page.getByRole('status').filter({ hasText: /Keep it up|first step|Logging regularly|Naming a feeling|check-ins|showed up|journal|skill|Awareness|Feelings come|Well done|honesty/ })).toBeVisible()
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('heading', { name: /Send a note to Jitendra Khimlani\?/ })).toBeVisible({ timeout: 3000 })
  await page.getByRole('button', { name: 'Send a note' }).click()
  await page.waitForURL('**/app/chat?topic=feeling&mood=calm**')
  await expect(page.getByRole('textbox', { name: 'Message Jitendra Khimlani' })).toHaveValue(/^Today I’m feeling calm\./)
  // only once a day: logging again today does not ask again
  await page.goto('/app')
  await page.getByRole('button', { name: /Log how you feel|Log again/ }).first().click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('dialog', { name: 'Log how you feel' }).getByRole('button', { name: 'Calm', exact: true }).click()
  await page.getByRole('button', { name: 'Log it' }).click()
  await page.getByRole('button', { name: 'Done' }).click()
  await page.waitForTimeout(1200)
  await expect(page.getByRole('heading', { name: /Send a note to Jitendra Khimlani\?/ })).toHaveCount(0)
})

test('mood logger fits a short Safari screen: the Next button is fully visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 })
  await seed(page); await page.goto('/app')
  await page.getByRole('button', { name: /Log how you feel|Log again/ }).first().click()
  await page.waitForTimeout(900)
  const next = page.getByRole('button', { name: 'Next' })
  const b = (await next.boundingBox())!
  expect(b.y + b.height).toBeLessThanOrEqual(600)
  await next.click()
  await expect(page.getByRole('button', { name: 'Pick a feeling' })).toBeInViewport()
})

test('mood slider: tap anywhere on the track and drag with a finger', async ({ page }) => {
  await seed(page); await page.goto('/app')
  await page.getByRole('button', { name: /Log how you feel|Log again/ }).first().click()
  const slider = page.getByRole('slider', { name: 'How pleasant or unpleasant' })
  const track = page.getByRole('dialog', { name: 'Log how you feel' }).locator('div.touch-none')
  await page.waitForTimeout(800) // let the sheet finish sliding up before measuring
  const b = (await track.boundingBox())!
  // tap near the right end → very pleasant
  await page.mouse.click(b.x + b.width - 10, b.y + b.height / 2)
  await expect(slider).toHaveAttribute('aria-valuetext', 'Very pleasant')
  // drag from the middle (not on the thumb) to the left end → very unpleasant
  const cdp = await page.context().newCDPSession(page)
  const y = b.y + b.height / 2
  const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x: number) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] })
  await touch('touchStart', b.x + b.width / 2)
  for (const x of [b.x + 150, b.x + 100, b.x + 50, b.x + 10]) await touch('touchMove', x)
  await touch('touchEnd', b.x + 10)
  await expect(slider).toHaveAttribute('aria-valuetext', 'Very unpleasant')
})

test('home: Bach flower story cards slide and open their story; 8 stories in Learn', async ({ page }) => {
  await seed(page); await page.goto('/app')
  await page.getByRole('link', { name: 'Read: Bach flowers and self-doubt' }).click()
  await page.waitForURL('**/app/learn/story?id=self-doubt')
  await expect(page.getByText(/Self-doubt · 1 of \d/)).toBeVisible()
  await page.goto('/app/learn')
  for (const t of ['confidence', 'money and business worries', 'constant change', 'self-doubt', 'sleep', 'anger']) await expect(page.getByRole('link', { name: new RegExp(`Read: .*${t}`) })).toBeVisible()
})

test('stories: relaxing music can be muted and changed', async ({ page }) => {
  await seed(page)
  await page.goto('/app/learn/story?id=sleep')
  await page.getByRole('button', { name: 'Next slide' }).click()
  const music = page.getByRole('button', { name: /^Music: / })
  const first = await music.getAttribute('aria-label')
  await music.click()
  expect(await music.getAttribute('aria-label')).not.toBe(first)
  await page.getByRole('button', { name: 'Mute music' }).click()
  await expect(page.getByRole('button', { name: 'Turn music on' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('bw-story-sound'))).toBe('off')
})
