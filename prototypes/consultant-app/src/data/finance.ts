/**
 * Finance board demo data (read-only for Jitu Bhaiya, D-33). Live: finance.getSalesSummary {from, to}.
 * Consultation income comes from the real demo appointments; shop and reorder sales are generated per day.
 * Prices and costs are placeholders until the owner's product list arrives (CONTENT-CHECKLIST #6).
 */
import { DAY, startOfDay } from './seed'
import { FEE, SCAN_FEE } from '../lib/labels'
import type { Appt } from './types'

export type Source = 'consultations' | 'remedies' | 'shop'
export interface Product { key: string; name: string; source: Source; price: number; cost: number }

export const PRODUCTS: Product[] = [
  { key: 'bach_first', name: 'Bach flower, first visit', source: 'consultations', price: FEE.first, cost: 140 },   // cost = the included remedy (D-02)
  { key: 'bach_followup', name: 'Bach flower, follow-up', source: 'consultations', price: FEE.followup, cost: 140 },
  { key: 'scanning', name: 'Scanning session', source: 'consultations', price: SCAN_FEE, cost: 0 },
  { key: 'reorder', name: 'Remedy reorder', source: 'remedies', price: 600, cost: 140 },
  { key: 'sleep_oil', name: 'Sleep Oil', source: 'shop', price: 650, cost: 210 },
  { key: 'abundance_oil', name: 'Abundance Oil', source: 'shop', price: 650, cost: 220 },
  { key: 'abundance_spray', name: 'Abundance Spray', source: 'shop', price: 550, cost: 160 },
  { key: 'aura_spray', name: 'Aura Spray', source: 'shop', price: 550, cost: 150 },
  { key: 'bath_salt', name: 'Bath Salt', source: 'shop', price: 450, cost: 120 },
  { key: 'aura_salt', name: 'Aura Salt', source: 'shop', price: 480, cost: 130 },
]
const BY_KEY = new Map(PRODUCTS.map((p) => [p.key, p]))

function rng(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

/** units sold per product per day, last `days` days (today included, partial). */
export function salesLedger(appts: Appt[], now: number, days = 62) {
  const r = rng(9090)
  const today = startOfDay(now)
  const rows: { day: number; key: string; units: number }[] = []
  const DEMAND: Record<string, number> = { reorder: 1.6, sleep_oil: 1.4, abundance_oil: 0.9, abundance_spray: 0.8, aura_spray: 0.6, bath_salt: 1.1, aura_salt: 0.5 }
  for (let d = days - 1; d >= 0; d--) {
    const day = today - d * DAY
    const weekend = [0, 6].includes(new Date(day).getDay()) ? 1.3 : 1
    const partial = d === 0 ? Math.min(1, (now - today) / DAY + 0.15) : 1
    for (const [key, mean] of Object.entries(DEMAND)) {
      let units = 0
      for (let k = 0; k < 4; k++) if (r() < (mean * weekend * partial) / 4) units++
      if (units) rows.push({ day, key, units })
    }
    const done = appts.filter((a) => a.status === 'completed' && startOfDay(a.start) === day)
    const count = (k: string, f: (a: Appt) => boolean) => { const n = done.filter(f).length; if (n) rows.push({ day, key: k, units: n }) }
    count('bach_first', (a) => a.service === 'bach' && a.kind === 'first')
    count('bach_followup', (a) => a.service === 'bach' && a.kind === 'followup')
    count('scanning', (a) => a.service === 'scanning')
  }
  return rows
}

export function financeBoard(appts: Appt[], now: number) {
  const rows = salesLedger(appts, now)
  const today = startOfDay(now)
  const m0 = new Date(now); m0.setDate(1); m0.setHours(0, 0, 0, 0)
  const monthStart = m0.getTime()
  const lm = new Date(monthStart); lm.setMonth(lm.getMonth() - 1)
  const lastStart = lm.getTime(), lastEnd = lastStart + (today - monthStart) + DAY
  const sum = (from: number, to: number, f: (p: Product) => number) =>
    rows.filter((r) => r.day >= from && r.day < to).reduce((s, r) => s + r.units * f(BY_KEY.get(r.key)!), 0)
  const rev = (p: Product) => p.price
  const profit = (p: Product) => p.price - p.cost
  const products = PRODUCTS.map((p) => {
    const mine = rows.filter((r) => r.key === p.key && r.day >= monthStart)
    const units = mine.reduce((s, r) => s + r.units, 0)
    return { ...p, units, revenue: units * p.price, profit: units * (p.price - p.cost) }
  }).sort((a, b) => b.revenue - a.revenue)
  const bySource = (['consultations', 'remedies', 'shop'] as Source[]).map((s) => ({ source: s, revenue: products.filter((p) => p.source === s).reduce((t, p) => t + p.revenue, 0) }))
  const daily = Array.from({ length: 14 }, (_, i) => { const day = today - (13 - i) * DAY; return { day, revenue: sum(day, day + DAY, rev) } })
  const todayRows = rows.filter((r) => r.day === today)
  return {
    today: { revenue: sum(today, today + DAY, rev), profit: sum(today, today + DAY, profit), orders: todayRows.reduce((s, r) => s + r.units, 0) },
    month: { revenue: sum(monthStart, today + DAY, rev), profit: sum(monthStart, today + DAY, profit) },
    lastMonth: { revenue: sum(lastStart, lastEnd, rev), profit: sum(lastStart, lastEnd, profit) },
    products, bySource, daily,
    todayTop: [...todayRows].sort((a, b) => b.units * BY_KEY.get(b.key)!.price - a.units * BY_KEY.get(a.key)!.price).slice(0, 3).map((r) => ({ name: BY_KEY.get(r.key)!.name, units: r.units, revenue: r.units * BY_KEY.get(r.key)!.price })),
  }
}
