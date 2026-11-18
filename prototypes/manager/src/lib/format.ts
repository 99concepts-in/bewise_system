export const inr = (paise: number, opts: { decimals?: boolean } = {}) => {
  const rupees = paise / 100
  return '₹' + rupees.toLocaleString('en-IN', {
    minimumFractionDigits: opts.decimals ? 2 : 0,
    maximumFractionDigits: opts.decimals ? 2 : 0,
  })
}
export const qty = (n: number, unit: string) =>
  `${n.toLocaleString('en-IN', { maximumFractionDigits: 1 })} ${unit}`

const tf = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
const df = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })
const dfl = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' })

export const time = (t: number) => tf.format(t).replace(' ', ' ').toUpperCase().replace('AM', 'AM').replace('PM', 'PM')
export const day = (t: number | string) => df.format(typeof t === 'string' ? new Date(t) : t)
export const longDay = (t: number) => dfl.format(t)

const istKey = (t: number) => new Date(t + 5.5 * 3600e3).toISOString().slice(0, 10)
export const isToday = (t: number) => istKey(t) === istKey(Date.now())

/** "today 1:00 PM", "tomorrow 11:00 AM", "21 Nov" */
export const when = (t: number) => {
  const d = Math.round((Date.parse(istKey(t)) - Date.parse(istKey(Date.now()))) / 864e5)
  if (d === 0) return `today ${time(t)}`
  if (d === 1) return `tomorrow ${time(t)}`
  if (d === -1) return `yesterday ${time(t)}`
  return day(t)
}
export const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} h ago`
  return day(t)
}
export const dueLabel = (dueOn: string) => {
  const d = Math.round((Date.parse(dueOn) - Date.parse(istKey(Date.now()))) / 864e5)
  if (d === 0) return 'due today'
  if (d < 0) return `${-d} day${d === -1 ? '' : 's'} overdue`
  if (d === 1) return 'due tomorrow'
  return `due in ${d} days`
}
export const dateKey = (offsetDays = 0) => istKey(Date.now() + offsetDays * 864e5)
export const greeting = () => {
  const h = new Date(Date.now() + 5.5 * 3600e3).getUTCHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}
export const firstName = (n: string) => n.split(' ')[0]
export const shortName = (n: string) => { const [a, b] = n.split(' '); return b ? `${a} ${b[0]}.` : a }
export const uid = () => Math.random().toString(36).slice(2, 10)
