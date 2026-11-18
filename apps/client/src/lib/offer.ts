/**
 * @module   commerce
 * @owner    CLIENT (UI) · OWNER sets prices
 * Purpose:  Consultation plans + the launch offer (owner 2026-11-18).
 *           A plan = one consultation with Jitu Bhaiya every month (remedy blend included), at the follow-up fee.
 *           Launch offer (till 1 Dec): Yearly = 12 months for the price of 10 (2 months free, save ₹1,600);
 *           6 months = 6 for the price of 5 (1 month free). Paying for a plan unlocks a 15% first-purchase shop coupon (7 days).
 */
import { CONSULTATIONS } from './data'

export type PlanId = 'yearly' | 'half'
const MONTHLY = CONSULTATIONS.find((c) => c.id === 'followup')!.feePaise // ₹800

export const OFFER_ENDS = new Date('2026-12-01T23:59:59+05:30')
export const offerLive = (now = Date.now()) => now < +OFFER_ENDS

export const PLANS: Record<PlanId, { id: PlanId; name: string; months: number; free: number; tag: string; emoji: string }> = {
  yearly: { id: 'yearly', name: 'Yearly plan', months: 12, free: 2, tag: 'Best value', emoji: '🌳' },
  half: { id: 'half', name: '6-month plan', months: 6, free: 1, tag: 'Recommended', emoji: '🌱' },
}
export const planFull = (id: PlanId) => PLANS[id].months * MONTHLY
/** price today: launch price while the offer runs, full price after */
export const planPrice = (id: PlanId, now = Date.now()) => (offerLive(now) ? (PLANS[id].months - PLANS[id].free) * MONTHLY : planFull(id))
export const planSaving = (id: PlanId, now = Date.now()) => planFull(id) - planPrice(id, now)

export const COUPON_PCT = 15
export const COUPON_DAYS = 7

export const WHATSAPP_APPOINTMENTS = '919054220952' // appointment number (owner 2026-11-18)
export const HELPLINE = { name: 'Mr. Haresh', tel: '+919601345289', label: '96013 45289' }
export const waLink = (text: string) => `https://wa.me/${WHATSAPP_APPOINTMENTS}?text=${encodeURIComponent(text)}`

export function countdown(to: number, now = Date.now()) {
  const ms = Math.max(0, to - now)
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4), s = Math.floor((ms % 6e4) / 1e3)
  return { d, h, m, s, done: ms === 0 }
}
