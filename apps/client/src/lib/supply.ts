/**
 * @module   remedies-ux
 * @owner    CLIENT
 * @screens  CL-08 blend bottle · CL-26 My Remedies
 * Purpose:  How much of the current blend is "left" — full at the start, empty at the next appointment
 *           (or at start + blend.days when nothing is booked). Suggests a pre-book date before it runs low.
 */
import type { Appointment, Blend } from './store'
import { addDays, startOfDay } from './format'
import { slotsFor } from './data'

const DAY = 86_400_000
export function blendSupply(blend: Blend, appointments: Appointment[], now = Date.now()) {
  const start = new Date(blend.startedOn).getTime()
  const next = appointments
    .filter((a) => a.status === 'confirmed' && +new Date(a.startsAt) > now)
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))[0]
  const runOut = start + blend.days * DAY
  const end = next ? +new Date(next.startsAt) : runOut
  const total = Math.max(DAY, end - start)
  const level = Math.max(0, Math.min(1, (end - now) / total))
  const daysLeft = Math.max(0, Math.ceil((end - now) / DAY))
  // suggest the first open day ~3 days before it runs out (never in the past, never Sunday)
  let suggest = addDays(startOfDay(new Date(Math.max(now + DAY, runOut - 3 * DAY))), 0)
  for (let i = 0; i < 10 && slotsFor(suggest).length === 0; i++) suggest = addDays(suggest, 1)
  return { level, daysLeft, next, runOut: new Date(runOut), suggest, low: !next && daysLeft <= 5 }
}

export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const parseIsoDay = (s?: string | null) => {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined
  const [y, m, d] = s.split('-').map(Number); const x = new Date(y, m - 1, d); return isNaN(+x) ? undefined : x
}
