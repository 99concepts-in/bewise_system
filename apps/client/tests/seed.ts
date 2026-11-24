/** Seeds a returning client (same shape the app persists) so every screen has content. */
import type { Page } from '@playwright/test'
const D = 864e5
export function seedState(opts: { onboarded?: boolean } = {}) {
  const now = Date.now()
  const iso = (ms: number) => new Date(ms).toISOString()
  const day = (n: number) => { const d = new Date(now + n * D); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
  const at = (n: number, h: number) => { const d = new Date(now + n * D); d.setHours(h, 0, 0, 0); return d.toISOString() }
  return {
    state: {
      profile: { name: 'Priya Shah', phone: '9876543210', dob: '1994-05-12', city: 'Vadodara', consents: { wellbeing: true, whatsapp: true, offers: true }, allergies: ['lavender'], ...(opts.onboarded === false ? {} : { onboardedAt: iso(now - 20 * D) }) },
      journal: Array.from({ length: 10 }, (_, i) => ({ id: 'j' + i, emotion: ['calm', 'anxious', 'happy', 'tired', 'grateful'][i % 5], at: iso(now - i * D), ...(i === 0 ? { note: 'Good chat with my sister' } : {}) })),
      goals: [{ id: 'g1', title: 'Sleep by 11 PM', progress: 0, done: false, kind: 'daily', days: [day(-1), day(-2)] }, { id: 'g2', title: 'Read one book this month', progress: 0, done: false, kind: 'once' }],
      appointments: [
        { id: 'a1', code: 'BW-A-00038', type: 'first', mode: 'online', startsAt: at(-14, 11), status: 'completed', amountPaise: 100000, createdAt: iso(now - 17 * D) },
        { id: 'a2', code: 'BW-A-00041', type: 'followup', mode: 'in_person', startsAt: at(4, 11), status: 'confirmed', amountPaise: 80000, createdAt: iso(now - D) },
        { id: 'a3', code: 'BW-A-00042', type: 'followup', mode: 'online', startsAt: at(9, 15), status: 'awaiting_payment', amountPaise: 80000, createdAt: iso(now), source: 'consultant' },
      ],
      intake: { answers: { who: 'me', onMind: '', feelings: ['Fear', 'Overthinking'], nuance: {}, body: [], bodyTypes: [], energy: 3, stress: 3, life: [], lifeOther: '', safety: { medicinesText: '', allergiesText: '' }, goals: [], goalText: '', consentAi: true }, step: 99, submittedAt: iso(now - 16 * D) },
      blend: { name: 'Personal blend', version: 1, flowers: ['Mimulus', 'White Chestnut', 'Larch'], drops: 4, timesPerDay: 4, startedOn: iso(now - 13 * D), days: 25, reminderTimes: ['08:00', '13:00', '18:00', '22:00'], alcoholFree: true },
      drops: { [day(-1)]: true, [day(-2)]: false, [day(-3)]: true },
      checkins: {}, cart: [{ key: 'sleep-roll-on-15', qty: 1 }], wishlist: ['aura-spray'],
      addresses: [{ id: 'ad1', name: 'Priya Shah', phone: '9876543210', line1: '12, Shanti Kunj', line2: 'Alkapuri', city: 'Vadodara', state: 'Gujarat', pin: '390007' }],
      orders: [{ id: 'o1', code: 'BW-00040', lines: [{ key: 'remedy', name: 'Personal blend v1', label: '30 ml', qty: 1, pricePaise: 0, kind: 'remedy' }], totalPaise: 0, address: { id: 'ad1', name: 'Priya Shah', phone: '9876543210', line1: '12, Shanti Kunj', line2: 'Alkapuri', city: 'Vadodara', state: 'Gujarat', pin: '390007' }, placedAt: iso(now - 12 * D), stage: 3 }],
      chat: [], notices: [], seq: 42, reminders: { askedAt: iso(now - D), on: false },
    },
    version: 0,
  }
}
export async function seed(page: Page, opts: { onboarded?: boolean } = {}) {
  await page.goto('/welcome')
  await page.evaluate((s) => { localStorage.setItem('bewise-client-v1', JSON.stringify(s)) }, seedState(opts))
}
export const ROUTES = ['/app', '/app/learn', '/app/learn/story?id=anxiety', '/app/journal', '/app/goals', '/app/remedies', '/app/book', '/app/sessions', '/app/sessions/view?id=a2', '/app/checkin?appointment=a2',
  '/app/pay?appointment=a3', '/app/shop', '/app/shop/sleep-roll-on', '/app/bag', '/app/checkout', '/app/orders', '/app/orders/view?id=o1', '/app/ask', '/app/chat', '/app/me', '/app/help']
export const PUBLIC = ['/welcome', '/sign-in', '/book/jitendra-khimlani?type=followup', '/onboarding/name', '/onboarding/dob', '/onboarding/gender']
