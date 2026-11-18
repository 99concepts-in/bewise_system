/**
 * @module client-lib  @owner CLIENT
 * Purpose: money & date formatting (paise → ₹, IST). Mirrors HUB lib/format once it exists.
 */
const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
export const formatINR = (paise: number) => inr.format(Math.round(paise / 100))

const TZ = 'Asia/Kolkata'
export const fmtTime = (d: Date | string) =>
  new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ }).replace('am', 'AM').replace('pm', 'PM')
export const fmtDay = (d: Date | string) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ })
export const fmtLongDay = (d: Date | string) => new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ })
export const fmtMonth = (d: Date) => d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: TZ })
export const dayKey = (d: Date | string) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
export const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }
export const firstName = (n?: string) => (n || '').trim().split(/\s+/)[0] || 'there'
export const uid = () => (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string
