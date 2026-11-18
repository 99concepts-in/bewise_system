/** Shared labels and message helpers (kept tiny so every screen can import them without pulling the sheets). */
import { dayLabel, fmtTime } from './time'
import type { Appt, Kind } from '../data/types'

export const FEE: Record<Kind, number> = { first: 1000, followup: 800 }
export const KIND_LABEL: Record<Kind, string> = { first: 'First consultation', followup: 'Follow-up' }
export const STATUS_LABEL: Record<Appt['status'], string> = {
  awaiting_payment: 'Awaiting payment', confirmed: 'Confirmed', checked_in: 'Checked in', in_session: 'In session', completed: 'Completed', no_show: 'No-show',
}

export function waLink(phone: string, text: string) {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
}
/** A warm payment reminder — he never sends the link himself; BeWise already did. */
export function reminderText(first: string, start: number | undefined, now: number) {
  return `Namaste ${first} 🙏 Just checking you got the BeWise message about your session${start ? ` on ${dayLabel(start, now).toLowerCase()} at ${fmtTime(start)}` : ''}. The payment link is in that chat. Looking forward to seeing you. Jitu Bhaiya`
}

export const BOOKING_LINK = 'https://bewise.in/book/jitu-bhaiya' // illustrative until the domain is set (D-12)
