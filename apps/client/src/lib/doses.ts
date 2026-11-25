/**
 * @module remedies @owner CLIENT
 * Dose check-ins (owner 2026-11-18): the blend is taken 4 drops, 4 times a day; each time is one check-in.
 * A day counts towards the streak once every dose is in. Older one-tap days (drops=true) count as a full day.
 */
import type { Blend } from './store'
import { addDays, dayKey, startOfDay } from './format'

type S = { doses: Record<string, number>; drops: Record<string, boolean>; blend: Blend | null }
export const perDay = (s: Pick<S, 'blend'>) => s.blend?.timesPerDay ?? 4
export const dosesOn = (s: S, key: string) => s.doses[key] ?? (s.drops[key] ? perDay(s) : 0)

/** consecutive full days, ending today (or yesterday when today isn't complete yet) */
export function doseStreak(s: S, now = new Date()) {
  const full = perDay(s)
  let d = startOfDay(now)
  if (dosesOn(s, dayKey(d)) < full) d = addDays(d, -1)
  let n = 0
  while (dosesOn(s, dayKey(d)) >= full) { n++; d = addDays(d, -1) }
  return n
}

/** the blend's days (default 25), oldest first */
export function blendDays(s: S, now = new Date()) {
  if (!s.blend) return []
  const start = startOfDay(new Date(s.blend.startedOn)), today = startOfDay(now)
  return Array.from({ length: s.blend.days }, (_, i) => {
    const d = addDays(start, i), key = dayKey(d)
    return { d, key, n: dosesOn(s, key), future: d > today, today: +d === +today, index: i + 1 }
  })
}

export function doseStats(s: S, now = new Date()) {
  const days = blendDays(s, now), sofar = days.filter((x) => !x.future)
  const taken = sofar.reduce((t, x) => t + x.n, 0), due = sofar.length * perDay(s)
  return { day: Math.min(sofar.length, days.length), of: days.length, taken, due, pct: due ? Math.round((taken / due) * 100) : 0, streak: doseStreak(s, now) }
}
