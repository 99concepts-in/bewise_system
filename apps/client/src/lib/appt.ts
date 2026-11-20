/** @module scheduling-ux @owner CLIENT · Appointment display helpers (owner 2026-11-20: the team sets the time). */
import type { Appointment } from './store'
import { fmtDay, fmtLongDay, fmtTime } from './format'

export const tbc = (a: Pick<Appointment, 'timeTbc' | 'needsNewTime'>) => !!(a.timeTbc || a.needsNewTime)
export const whenShort = (a: Appointment) => (tbc(a) ? 'Time to be confirmed' : `${fmtDay(a.startsAt)} · ${fmtTime(a.startsAt)}`)
export const whenLong = (a: Appointment) => (tbc(a) ? 'Time to be confirmed' : `${fmtLongDay(a.startsAt)} · ${fmtTime(a.startsAt)}`)
/** upcoming = booked and either still to happen or waiting for the team to set the time */
export const isUpcoming = (a: Appointment, now = Date.now()) =>
  (a.status === 'confirmed' || a.status === 'awaiting_payment' || !!a.needsNewTime) && (tbc(a) || +new Date(a.startsAt) + 3600_000 > now)
