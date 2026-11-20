/**
 * Slot engine (prototype of docs/specs/consultant/K1-SCHEDULING-AND-CALENDAR-SYNC.md §3).
 * Every busy thing occupies [start, end + gap); a candidate [s, s + duration + gap) must overlap none.
 */
import type { Appt } from '../data/types'
import { DAY, HOUR, MIN, startOfDay } from '../data/seed'

export interface Availability { saturdayMorning: boolean }
const GAP = 10 * MIN
const STEP = 30 * MIN
const NOTICE = 60 * MIN

function openHours(day: number, av: Availability): [number, number][] {
  const dow = new Date(day).getDay()
  if (dow === 0) return []
  if (dow === 6) return av.saturdayMorning ? [[10, 13], [16, 19]] : [[16, 19]]
  return [[10, 13], [16, 20]]
}

export function slotsForDay(day: number, durationMin: number, appts: Appt[], av: Availability, now: number, ignoreId?: string) {
  const busy = appts
    .filter((a) => a.id !== ignoreId && a.status !== 'no_show' && startOfDay(a.start) === day)
    .map((a) => [a.start, a.start + a.durationMin * MIN + GAP] as const)
  const out: number[] = []
  for (const [h0, h1] of openHours(day, av)) {
    for (let s = day + h0 * HOUR; s + durationMin * MIN <= day + h1 * HOUR; s += STEP) {
      if (s < now + NOTICE) continue
      const e = s + durationMin * MIN + GAP
      if (busy.some(([b0, b1]) => s < b1 && b0 < e)) continue
      out.push(s)
    }
  }
  return out
}

export function nextDays(now: number, n: number) {
  const t = startOfDay(now)
  return Array.from({ length: n }, (_, i) => t + i * DAY)
}

/** Share of open hours already booked in the next 7 days (for the capacity insight). */
export function weekLoad(appts: Appt[], av: Availability, now: number) {
  let open = 0, booked = 0
  for (const day of nextDays(now + DAY, 7)) {
    for (const [a, b] of openHours(day, av)) open += (b - a) * 60
    booked += appts.filter((x) => startOfDay(x.start) === day && x.status !== 'no_show').reduce((s, x) => s + x.durationMin + 10, 0)
  }
  return open ? booked / open : 0
}

/** Express booking: the next `count` free start times from now, across the booking window. */
export function nextFree(durationMin: number, appts: Appt[], av: Availability, now: number, count = 4, days = 21) {
  const out: number[] = []
  for (const day of nextDays(now, days)) {
    for (const s of slotsForDay(day, durationMin, appts, av, now)) { out.push(s); if (out.length >= count) return out }
  }
  return out
}

/**
 * His timings are never fixed (owner 2026-11-20): staff may put a session at any time between 7 AM and 10 PM,
 * as long as it doesn't clash with another session (10-minute gap). 15-minute steps.
 */
export function freeTimes(day: number, durationMin: number, appts: Appt[], now: number, ignoreId?: string, fromH = 7, toH = 22) {
  const busy = appts
    .filter((a) => a.id !== ignoreId && a.status !== 'no_show' && startOfDay(a.start) === day)
    .map((a) => [a.start, a.start + a.durationMin * MIN + GAP] as const)
  const out: { t: number; free: boolean }[] = []
  for (let s = day + fromH * HOUR; s + durationMin * MIN <= day + toH * HOUR; s += 15 * MIN) {
    if (s < now + 15 * MIN) continue
    const e = s + durationMin * MIN + GAP
    out.push({ t: s, free: !busy.some(([b0, b1]) => s < b1 && b0 < e) })
  }
  return out
}

/** Express: the next free times inside his usual working hours (10–1, 4–8), from now. */
export function nextFreeAny(durationMin: number, appts: Appt[], now: number, count = 4, days = 14) {
  const out: number[] = []
  for (const day of nextDays(now, days)) {
    if (new Date(day).getDay() === 0) continue
    for (const { t, free } of freeTimes(day, durationMin, appts, now)) {
      const h = new Date(t).getHours() + new Date(t).getMinutes() / 60
      const usual = (h >= 10 && h + durationMin / 60 <= 13) || (h >= 16 && h + durationMin / 60 <= 20)
      if (free && usual && new Date(t).getMinutes() % 30 === 0) { out.push(t); if (out.length >= count) return out }
    }
  }
  return out
}
