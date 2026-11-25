/** Shared labels and message helpers (kept tiny so every screen can import them without pulling the sheets). */
import { dayLabel, fmtTime } from './time'
import type { Appt, Kind, Service } from '../data/types'

export const FEE: Record<Kind, number> = { first: 1000, followup: 800 }
/** Scanning fee is a placeholder until the owner sets it (request filed 2026-11-20). */
export const SCAN_FEE = 1200
export const feeOf = (service: Service, kind: Kind) => (service === 'scanning' ? SCAN_FEE : FEE[kind])
export const SERVICE_LABEL: Record<Service, string> = { bach: 'Bach flower', scanning: 'Scanning' }
/** "Scanning" or "Bach flower, first" / "Bach flower, follow-up" */
export function typeLabel(a: { service: Service; kind: Kind }) {
  return a.service === 'scanning' ? 'Scanning' : a.kind === 'first' ? 'Bach flower, first visit' : 'Bach flower, follow-up'
}
export const DEFAULT_MEET = 'https://meet.google.com/jitendra-khimlani-room' // his own room (CN-25 setting); per-session links override it
export function linkMessage(first: string, when: string, url: string) {
  return `Namaste ${first} 🙏 Here is the link for your online session with Jitendra Khimlani ${when}: ${url}\nPlease join 2 minutes early from a quiet place.`
}
/** v5 (HUB 2026-11-20): a blend holds at most 7 flowers (spec §5 "Build remedy · 3/7 flowers"). */
export const MAX_FLOWERS = 7
export const KIND_LABEL: Record<Kind, string> = { first: 'First consultation', followup: 'Follow-up' }
export const STATUS_LABEL: Record<Appt['status'], string> = {
  awaiting_payment: 'Awaiting payment', confirmed: 'Confirmed', checked_in: 'Checked in', in_session: 'In session', completed: 'Completed', no_show: 'No-show',
}

export function waLink(phone: string, text: string) {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
}
/** A warm payment reminder — he never sends the link himself; BeWise already did. */
export function reminderText(first: string, start: number | undefined, now: number) {
  return `Namaste ${first} 🙏 Just checking you got the BeWise message about your session${start ? ` on ${dayLabel(start, now).toLowerCase()} at ${fmtTime(start)}` : ''}. The payment link is in that chat. Looking forward to seeing you. Jitendra Khimlani`
}

export const BOOKING_LINK = 'https://app.bewiseglobal.in/client/book/jitendra-khimlani' // live address (owner 2026-11-20); old /book/jitendra-khimlani still works
export const APP_LINK = 'https://app.bewiseglobal.in/client/'
