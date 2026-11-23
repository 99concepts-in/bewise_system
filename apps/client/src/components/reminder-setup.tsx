'use client'
/**
 * @module   remedies-ux
 * @owner    CLIENT
 * Owner 2026-11-23: (1) the first time a member has a blend, a popup to set their remedy reminders; (2) a morning nudge
 * until they check in their first dose. Live push needs the server (web push / WhatsApp reminder, requested); in the app we
 * show a notice in the bell and, when allowed, a system notification while the app is open or comes back to the screen.
 */
import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Btn, Sheet, buzz, toast } from './ui'
import { useApp } from '@/lib/store'
import { dayKey } from '@/lib/format'
import { dosesOn } from '@/lib/doses'

const SLOT = ['Morning', 'Afternoon', 'Evening', 'Night']
const canNotify = () => typeof window !== 'undefined' && 'Notification' in window
const minutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }

export function ReminderSetup() {
  const s = useApp()
  const blend = s.blend
  const asked = !!s.reminders?.askedAt
  const [open, setOpen] = useState(false)
  const [times, setTimes] = useState<string[]>(() => blend?.reminderTimes ?? ['08:00', '13:00', '18:00', '22:00'])
  useEffect(() => { if (blend && !asked) { const t = setTimeout(() => setOpen(true), 1200); return () => clearTimeout(t) } }, [blend, asked])

  const save = async (on: boolean) => {
    let allowed = false
    if (on && canNotify()) { try { allowed = (await Notification.requestPermission()) === 'granted' } catch { /* blocked */ } }
    s.setReminderTimes([...times].sort())
    s.setReminders({ askedAt: new Date().toISOString(), on })
    setOpen(false); buzz(12)
    toast(on ? (allowed || !canNotify() ? 'Reminders set 🌿' : 'Reminders set. Allow notifications in your phone settings to get them.') : 'You can set reminders anytime in My care')
  }
  if (!blend) return null
  return (
    <Sheet open={open} onClose={() => save(false)} title="Your remedy reminders">
      <div className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-marigold-100 text-navy"><Bell className="size-7" /></span>
        <h2 className="h-duo mt-3 text-[26px]">Never miss <em>your drops</em></h2>
        <p className="mx-auto mt-1 max-w-[300px] text-[14px] leading-5 text-muted">4 drops, 4 times a day. We’ll remind you at these times, and nudge you each morning until you check in.</p>
      </div>
      <ul className="mt-5 space-y-2">
        {times.map((t, i) => (
          <li key={i} className="flex items-center justify-between rounded-[18px] bg-peri-50/70 px-4 py-2.5">
            <span className="text-[15px] font-semibold text-navy">{SLOT[i] ?? `Dose ${i + 1}`}</span>
            <input type="time" value={t} onChange={(e) => setTimes(times.map((x, k) => (k === i ? e.target.value || x : x)))} aria-label={`${SLOT[i] ?? 'Dose'} reminder time`}
              className="rounded-full bg-white px-3 py-1.5 text-[15px] font-semibold text-navy outline-none focus:ring-2 focus:ring-navy" />
          </li>
        ))}
      </ul>
      <div className="mt-5 space-y-2 pb-1">
        <Btn full onClick={() => save(true)}>Turn on reminders</Btn>
        <Btn full variant="ghost" size="md" onClick={() => save(false)}>Not now</Btn>
      </div>
    </Sheet>
  )
}

/** morning nudge until the first dose of the day is checked in (in-app notice + system notification when allowed) */
export function useMorningNudge() {
  const s = useApp()
  useEffect(() => {
    if (!s.blend || !s.reminders?.on) return
    const check = () => {
      const st = useApp.getState(); const today = dayKey(new Date())
      const first = minutes(st.blend?.reminderTimes?.[0] ?? '08:00'), now = new Date().getHours() * 60 + new Date().getMinutes()
      if (now < first || now > 12 * 60 || dosesOn(st, today) > 0 || st.reminders?.nudgedOn === today) return
      st.notify({ title: 'Good morning 🌿 Time for your first drops', body: '4 drops, then tap the first drop on Home to check in.', href: '/app' })
      st.setReminders({ nudgedOn: today })
      if (canNotify() && Notification.permission === 'granted') { try { new Notification('Good morning 🌿', { body: 'Time for your first drops. Tap to check in.' }) } catch { /* not allowed here */ } }
    }
    check()
    const t = setInterval(check, 5 * 60_000)
    const onVis = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis) }
  }, [s.blend, s.reminders?.on])
}
