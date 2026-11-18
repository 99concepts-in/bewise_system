import { DAY, MIN, startOfDay } from '../data/seed'

const tf = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
const df = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
const dShort = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })
const dLong = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const wd = new Intl.DateTimeFormat('en-IN', { weekday: 'short' })
const month = new Intl.DateTimeFormat('en-IN', { month: 'long' })

export const fmtTime = (t: number) => tf.format(t).replace(' am', ' AM').replace(' pm', ' PM')
export const fmtDay = (t: number) => df.format(t)
export const fmtShort = (t: number) => dShort.format(t)
export const fmtLong = (t: number) => dLong.format(t)
export const fmtWeekday = (t: number) => wd.format(t)
export const fmtMonth = (t: number) => month.format(t)

export function dayLabel(t: number, now: number) {
  const diff = Math.round((startOfDay(t) - startOfDay(now)) / DAY)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return fmtDay(t)
}

export function relative(t: number, now: number) {
  const m = Math.round((t - now) / MIN)
  if (m > 0) {
    if (m < 60) return `in ${m} min`
    if (m < 60 * 24) { const h = Math.floor(m / 60), r = m % 60; return r ? `in ${h} h ${r} min` : `in ${h} h` }
    const d = Math.round(m / 1440); return d === 1 ? 'tomorrow' : `in ${d} days`
  }
  const a = -m
  if (a < 1) return 'just now'
  if (a < 60) return `${a} min ago`
  if (a < 60 * 24) return `${Math.floor(a / 60)} h ago`
  const d = Math.round(a / 1440)
  if (d === 1) return 'yesterday'
  if (d < 30) return `${d} days ago`
  const mo = Math.round(d / 30)
  return mo === 1 ? 'a month ago' : `${mo} months ago`
}

export function greeting(now: number) {
  const h = new Date(now).getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export const inr = (n: number) => '₹' + n.toLocaleString('en-IN')
