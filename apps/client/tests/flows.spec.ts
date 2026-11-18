/** @owner CLIENT — owner rules 2026-11-18: drops tick, feedback benefits, public booking link, staff-made booking pay page, check-in deep link. */
import { expect, test } from '@playwright/test'
import { seed } from './seed'

const state = (page: import('@playwright/test').Page) => page.evaluate(() => JSON.parse(localStorage.getItem('bewise-client-v1') || '{}').state)

test('drops tick: yes today, change, edit yesterday, gentle copy', async ({ page }) => {
  await seed(page)
  await page.goto('/app'); await page.getByRole('button', { name: 'Not today' }).click()
  await expect(page.getByText('Not today, that’s okay.')).toBeVisible()
  await page.getByRole('button', { name: 'Change' }).click()
  await expect(page.getByText('Drops taken today.')).toBeVisible()
  await page.goto('/app/remedies'); await page.getByRole('button', { name: 'Took them' }).first().click()
  const s = await state(page)
  expect(Object.values(s.drops).filter(Boolean).length).toBeGreaterThanOrEqual(3)
  await expect(page.getByText(/You took them on \d+ of the last \d+ days/)).toBeVisible()
})

test('feedback sends benefits[]', async ({ page }) => {
  await seed(page)
  await page.goto('/app/sessions/view?id=a1&feedback=1')
  await page.getByRole('button', { name: '5 of 5' }).click()
  await page.getByRole('checkbox', { name: 'Calmer' }).click(); await page.getByRole('checkbox', { name: 'Sleeping better' }).click()
  await page.getByRole('button', { name: 'Send to Jitu Bhaiya' }).click()
  const s = await state(page)
  expect(s.appointments.find((a: { id: string }) => a.id === 'a1').feedback.benefits).toEqual(['Calmer', 'Sleeping better'])
})

test('public booking link: new visitor → landing → sign-in; signed-in → booking with type', async ({ page }) => {
  await seed(page, { onboarded: false })
  await page.goto('/book/jitu-bhaiya?type=followup')
  await expect(page.getByRole('heading', { name: /Book with Jitu Bhaiya/ })).toBeVisible()
  await page.getByRole('button', { name: 'Book with Jitu Bhaiya' }).click()
  await page.waitForURL('**/sign-in')
  expect(await page.evaluate(() => sessionStorage.getItem('bw-next'))).toBe('/app/book?type=followup')
  await seed(page)
  await page.goto('/book/jitu-bhaiya?type=followup'); await page.waitForURL('**/app/book?type=followup')
})

test('staff-made booking: pay without picking a slot; late payment → pick a new time', async ({ page }) => {
  await seed(page)
  await page.goto('/app')
  await expect(page.getByText('Complete your booking')).toBeVisible()
  await page.goto('/app/pay?appointment=a3')
  await expect(page.getByText('Jitu Bhaiya booked this for you')).toBeVisible()
  await page.getByRole('button', { name: /Pay ₹800/ }).click(); await page.getByRole('button', { name: 'Google Pay' }).click()
  await expect(page.getByRole('heading', { name: /booked/ })).toBeVisible({ timeout: 8000 })
  expect((await state(page)).appointments.find((a: { id: string }) => a.id === 'a3').status).toBe('confirmed')
  // late payment
  await page.goto('/app/me'); await page.getByRole('button', { name: '…paid after hold expired' }).click()
  await page.getByRole('button', { name: /Pay ₹/ }).click(); await page.getByRole('button', { name: 'Google Pay' }).click()
  await expect(page.getByText('Payment received. Pick a new time')).toBeVisible({ timeout: 8000 })
  await page.locator('button[aria-pressed="false"]:has-text(":")').first().click()
  await page.getByRole('button', { name: /^Confirm/ }).click()
  await page.waitForURL('**/app/sessions/view?id=*')
})

test('check-in deep link saves against the appointment', async ({ page }) => {
  await seed(page)
  await page.goto('/app/checkin?appointment=a2')
  await page.locator('button[aria-pressed]:has-text("calm")').first().click()
  await page.getByRole('button', { name: 'Continue' }).click(); await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('checkbox', { name: 'Most days' }).click()
  await page.getByRole('button', { name: 'Send to Jitu Bhaiya' }).click()
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
  await expect(page.getByText('Your session with Jitu Bhaiya')).toBeVisible()
  await page.getByRole('button', { name: /Pay ₹/ }).click(); await page.getByRole('button', { name: 'Google Pay' }).click()
  await expect(page.getByRole('heading', { name: 'Thank you' })).toBeVisible({ timeout: 8000 })
  const s = await state(page)
  const a = s.appointments.find((x: { id: string }) => x.id === 'a2')
  expect(a.status).toBe('confirmed'); expect(a.paidAt).toBeTruthy()
})
