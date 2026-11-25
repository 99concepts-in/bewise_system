'use client'
/**
 * @module   remedies-ux
 * @owner    CLIENT
 * Owner 2026-11-23 (revised): the first time a member has a blend, ask only for the time of their FIRST dose.
 *   · The first reminder each day goes on WhatsApp at that time (server cron; requested).
 *   · After each dose is checked in, the next reminder comes 4 hours later.
 *   · If a reminder isn't followed by a check-in, it repeats every 45 minutes until the dose is logged (not mentioned to members).
 * In the app (open or coming back on screen) we show these as bell notices and, when allowed, phone notifications. Reminders
 * while the app is closed need the server (web push), requested in docs/coordination/requests.
 */
import { useEffect, useState } from 'react'
import { Bell, MessageCircle } from 'lucide-react'
import { Btn, Sheet, buzz, toast } from './ui'
import { useApp } from '@/lib/store'
import { dayKey } from '@/lib/format'
import { dosesOn, perDay } from '@/lib/doses'
import { setupState } from './prompts'

const canNotify = () => typeof window !== 'undefined' && 'Notification' in window
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const toHHMM = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
export const REPEAT_MIN = 45
export const NEXT_AFTER_MIN = 4 * 60

export function ReminderSetup() {
  const s = useApp()
  const blend = s.blend
  // owner 2026-11-24: never on top of the tour, and only after the home screen + notifications setup
  const [setupDone, setSetupDone] = useState(false)
  useEffect(() => { const f = () => setSetupDone(['done', 'notify-later'].includes(setupState())); f(); const t = setInterval(f, 1000); return () => clearInterval(t) }, [])
  const asked = !!s.reminders?.askedAt || !!s.profile?.tourPending || !setupDone
  const [open, setOpen] = useState(false)
  const [first, setFirst] = useState(() => s.reminders?.firstAt ?? blend?.reminderTimes?.[0] ?? '08:00')
  useEffect(() => { if (blend && !asked) { const t = setTimeout(() => setOpen(true), 1200); return () => clearTimeout(t) } }, [blend, asked])

  const save = async (on: boolean) => {
    let allowed = false
    if (on && canNotify()) { try { allowed = (await Notification.requestPermission()) === 'granted' } catch { /* blocked */ } }
    // the day's four doses, 4 hours apart from the first (shown in My care; reminders follow the real check-in times)
    s.setReminderTimes([0, 1, 2, 3].map((k) => toHHMM(toMin(first) + k * NEXT_AFTER_MIN)))
    s.setReminders({ askedAt: new Date().toISOString(), on, firstAt: first })
    setOpen(false); buzz(12)
    toast(on ? (allowed || !canNotify() ? 'Reminders on 🌿' : 'Reminders on. Allow notifications in your phone settings too.') : 'You can turn reminders on anytime in My care')
  }
  if (!blend) return null
  return (
    <Sheet open={open} onClose={() => save(false)} title="Your remedy reminders">
      <div className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-marigold-100 text-navy"><Bell className="size-7" /></span>
        <h2 className="h-duo mt-3 text-[26px]">Never miss <em>your drops</em></h2>
        <p className="mx-auto mt-1 max-w-[300px] text-[14px] leading-5 text-muted">When do you take your first drops of the day? We’ll remind you then, and again 4 hours after each dose.</p>
      </div>
      <label className="mt-5 flex items-center justify-between rounded-[20px] bg-peri-50/70 px-4 py-3">
        <span className="text-[16px] font-semibold text-navy">First drops</span>
        <input type="time" value={first} onChange={(e) => setFirst(e.target.value || first)} aria-label="Time of your first drops"
          className="rounded-full bg-white px-4 py-2 text-[17px] font-semibold text-navy outline-none focus:ring-2 focus:ring-navy" />
      </label>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[13px] text-muted"><MessageCircle className="size-4 text-[#1f8f5f]" /> Your first reminder each day comes on WhatsApp</p>
      <div className="mt-5 space-y-2 pb-1">
        <Btn full onClick={() => save(true)}>Turn on reminders</Btn>
        <Btn full variant="ghost" size="md" onClick={() => save(false)}>Not now</Btn>
      </div>
    </Sheet>
  )
}

/** when the next dose is due today (Date), or null when all doses are done */
export function nextDoseDue(st: ReturnType<typeof useApp.getState>, now = new Date()): Date | null {
  const today = dayKey(now), n = dosesOn(st, today)
  if (!st.blend || n >= perDay(st)) return null
  const at = (min: number) => { const d = new Date(now); d.setHours(0, 0, 0, 0); d.setMinutes(min); return d }
  const first = at(toMin(st.reminders?.firstAt ?? st.blend.reminderTimes?.[0] ?? '08:00'))
  if (n === 0) return first
  const last = st.reminders?.lastDoseAt && dayKey(st.reminders.lastDoseAt) === today ? new Date(st.reminders.lastDoseAt) : null
  return last ? new Date(+last + NEXT_AFTER_MIN * 60_000) : at(toMin(first.toTimeString().slice(0, 5)) + n * NEXT_AFTER_MIN)
}

/** in-app reminders: due → nudge; not logged → again every 45 min. The day's first reminder is WhatsApp's; the app follows up. */
export function useMorningNudge() {
  const s = useApp()
  useEffect(() => {
    if (!s.blend || !s.reminders?.on) return
    const check = () => {
      const st = useApp.getState(), now = new Date()
      const due = nextDoseDue(st, now)
      if (!due || now < due || now.getHours() >= 23) return
      const firstOfDay = dosesOn(st, dayKey(now)) === 0
      const lastNudge = st.reminders?.lastNudgeAt ? new Date(st.reminders.lastNudgeAt) : null
      const sinceDue = lastNudge && lastNudge >= due ? lastNudge : null
      // first dose: WhatsApp sends the on-time reminder, the app follows up after 45 min; later doses: the app reminds on time
      const wait = sinceDue ? REPEAT_MIN : firstOfDay ? REPEAT_MIN : 0
      const from = sinceDue ?? due
      if (+now - +from < wait * 60_000) return
      const n = dosesOn(st, dayKey(now))
      const title = n === 0 ? 'Good morning 🌿 Time for your first drops' : `Time for your drops 🌿 (${n + 1} of ${perDay(st)})`
      st.notify({ title, body: '4 drops, then tap the drop on Home to check in.', href: '/app' })
      st.setReminders({ lastNudgeAt: now.toISOString(), nudgedOn: dayKey(now) })
      if (canNotify() && Notification.permission === 'granted') { try { new Notification(title, { body: 'Tap to check in your dose.' }) } catch { /* not allowed here */ } }
    }
    check()
    const t = setInterval(check, 60_000)
    const onVis = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis) }
  }, [s.blend, s.reminders?.on])
}
