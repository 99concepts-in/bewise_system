/**
 * @module   onboarding
 * @owner    CLIENT
 * Purpose:  Owner 2026-11-23: most people first book through the booking link (or Jitendra Khimlani / the team books for them),
 *           and only later sign in to the app. When they sign in, everything we already know is filled in for them, editable.
 * Live:     the server looks the member up by WhatsApp number after the code is verified (crm.findMemberByPhone, requested
 *           in docs/coordination/requests/20261123-client-to-hub-manager-consultant-sd-appointment-admin.md).
 * Preview:  a small on-device directory, filled when a booking request is sent or a staff booking is simulated, plus one
 *           demo member made by Jitendra Khimlani: 98989 89898.
 */
import type { Profile } from './store'

export type KnownMember = Pick<Profile, 'name' | 'dob' | 'city' | 'gender' | 'reference' | 'photo'> & { phone: string; source: 'booking-link' | 'staff'; by?: string }
const KEY = 'bewise-members'

const DEMO: KnownMember[] = [
  { phone: '9898989898', name: 'Meera Patel', dob: '1988-03-14', city: 'Vadodara', gender: 'Female', reference: 'Jitendra Khimlani', source: 'staff', by: 'Jitendra Khimlani' },
]

function read(): Record<string, KnownMember> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export function rememberMember(m: KnownMember) {
  if (!/^[6-9]\d{9}$/.test(m.phone) || !m.name?.trim()) return
  try { const all = read(); all[m.phone] = { ...all[m.phone], ...m }; localStorage.setItem(KEY, JSON.stringify(all)) } catch { /* storage off */ }
}

export function lookupMember(phone: string): KnownMember | null {
  return read()[phone] ?? DEMO.find((d) => d.phone === phone) ?? null
}
