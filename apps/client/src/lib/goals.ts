/** @module journal @owner CLIENT · Goal helpers: daily check-ins and one-time check-offs (owner 2026-11-18). */
import type { Goal } from './store'
import { isoDay } from './supply'

export const kindOf = (g: Goal) => g.kind ?? 'daily'
export const doneToday = (g: Goal, now = new Date()) => kindOf(g) === 'daily' ? (g.days ?? []).includes(isoDay(now)) : g.done

/** consecutive days checked, ending today (or yesterday if today isn't ticked yet) */
export function streak(g: Goal, now = new Date()) {
  const set = new Set(g.days ?? [])
  const d = new Date(now); if (!set.has(isoDay(d))) d.setDate(d.getDate() - 1)
  let n = 0
  while (set.has(isoDay(d))) { n++; d.setDate(d.getDate() - 1) }
  return n
}

/** last 7 days, oldest first */
export function week(g: Goal, now = new Date()) {
  const set = new Set(g.days ?? [])
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now); d.setDate(d.getDate() - (6 - i))
    return { day: d.toLocaleDateString('en-IN', { weekday: 'narrow' }), on: set.has(isoDay(d)), today: i === 6 }
  })
}
