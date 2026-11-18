'use client'
/**
 * @module   booking
 * @owner    CLIENT
 * @screens  CL-14 Date & time · CL-21 reschedule · staff-booking "pick a new time" (shared)
 * @stub     slots from lib/data slotsFor() until scheduling.getAvailableSlots is live
 */
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { buzz, cx, spring } from './ui'
import { istDate, slotsFor } from '@/lib/data'
import { addDays, fmtLongDay, fmtMonth, fmtTime, startOfDay } from '@/lib/format'

export function TimePicker({ slot, setSlot, initialDay, heading = true }: { slot?: Date; setSlot: (d: Date) => void; initialDay?: Date; heading?: boolean }) {
  const today = startOfDay()
  const monday = addDays(today, -((today.getDay() + 6) % 7))
  // pre-book from Home passes ?date= → open that week with that day selected
  const [week, setWeek] = useState(() => initialDay && initialDay >= today ? Math.min(7, Math.floor((startOfDay(initialDay).getTime() - monday.getTime()) / (7 * 86_400_000))) : 0)
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, week * 7 + i))
  const firstOpen = days.find((d) => d >= today && slotsFor(d).length) ?? days[0]
  const [day, setDay] = useState<Date>(slot ? startOfDay(slot) : initialDay && initialDay >= today && slotsFor(initialDay).length ? startOfDay(initialDay) : firstOpen)
  useEffect(() => { if (!days.some((d) => +d === +day)) setDay(days.find((d) => d >= today && slotsFor(d).length) ?? days[0]) }, [week]) // eslint-disable-line react-hooks/exhaustive-deps
  const times = day >= today ? slotsFor(day) : []
  const groups = [
    { t: 'Morning', f: (h: number) => h < 12 }, { t: 'Afternoon', f: (h: number) => h >= 12 && h < 17 }, { t: 'Evening', f: (h: number) => h >= 17 },
  ]
  const pick = (t: string) => { buzz(); setSlot(istDate(day, t)) }
  return (
    <div className="space-y-4">
      {heading && <h1 className="h-duo">Pick a <em>time</em></h1>}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <button aria-label="Previous week" disabled={week === 0} onClick={() => setWeek((w) => w - 1)} className="grid size-10 place-items-center rounded-full bg-peri-50 text-navy disabled:opacity-30"><ChevronLeft className="size-5" /></button>
          <motion.p key={week} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-[17px] font-bold text-navy">{fmtMonth(days[3])}</motion.p>
          <button aria-label="Next week" disabled={week >= 7} onClick={() => setWeek((w) => w + 1)} className="grid size-10 place-items-center rounded-full bg-peri-50 text-navy disabled:opacity-30"><ChevronRight className="size-5" /></button>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center">
          {days.map((d) => {
            const open = d >= today && slotsFor(d).length > 0
            const on = +d === +day
            return (
              <button key={+d} disabled={!open} aria-pressed={on} aria-label={fmtLongDay(d)} onClick={() => { buzz(5); setDay(d) }} className="flex flex-col items-center gap-1.5 py-1 disabled:opacity-35">
                <span className="text-[12px] font-medium text-muted">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                <span className="relative grid size-10 place-items-center text-[16px] font-bold">
                  {on && <motion.span layoutId="day-pill" transition={spring} className="absolute inset-0 rounded-full bg-navy" />}
                  <span className={cx('relative', on ? 'text-white' : 'text-navy')}>{d.getDate()}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="card p-5">
        {times.length === 0 ? <p className="py-4 text-center text-[14px] text-muted">No times this day — try another.</p> : groups.map((g) => {
          const ts = times.filter((t) => g.f(Number(t.split(':')[0])))
          if (!ts.length) return null
          return (
            <div key={g.t} className="border-b border-line py-3 first:pt-0 last:border-0 last:pb-0">
              <p className="mb-2.5 text-[16px] font-bold text-navy">{g.t}</p>
              <div className="grid grid-cols-3 gap-2">
                {ts.map((t, i) => {
                  const d = istDate(day, t)
                  const on = slot && +slot === +d
                  return (
                    <motion.button key={t} onClick={() => pick(t)} aria-pressed={!!on} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                      className={cx('relative h-11 rounded-full text-[14px] font-semibold', on ? 'text-white' : 'bg-peri-50/70 text-navy')}>
                      {on && <motion.span layoutId="slot-pill" transition={spring} className="absolute inset-0 rounded-full bg-navy shadow-[0_6px_14px_rgba(24,41,87,.3)]" />}
                      <span className="relative">{fmtTime(d)}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )
        })}
        <p className="mt-3 text-[12px] text-muted">Times in IST</p>
      </div>
    </div>
  )
}
