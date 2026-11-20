'use client'
/**
 * @module   remedies-ux
 * @owner    CLIENT (UI) · CONSULTANT owns remedies.logDrops
 * @screens  CL-08 Home blend card · CL-26 My care
 * Purpose:  Owner 2026-11-18: 4 dots that light up with each dose (4 drops, 4× a day), a streak, a few stats,
 *           and a 25-day calendar (the life of a bottle) where past days can be checked in too. Never shaming.
 */
import { AnimatePresence, motion } from 'motion/react'
import { CalendarDays, Droplet, Flame, Plus, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { Btn, Sheet, buzz, cx, spring, toast } from './ui'
import { useApp } from '@/lib/store'
import { dayKey, fmtDay } from '@/lib/format'
import { blendDays, doseStats, dosesOn, perDay } from '@/lib/doses'

function Dots({ n, of, size = 'lg', onTap, label }: { n: number; of: number; size?: 'lg' | 'sm' | 'xs'; onTap?: (i: number) => void; label?: string }) {
  const px = size === 'lg' ? 'size-12' : size === 'sm' ? 'size-9' : 'size-[7px]'
  return (
    <div className={cx('flex', size === 'xs' ? 'gap-[3px]' : size === 'lg' ? 'gap-3.5' : 'gap-2')} role={onTap ? 'group' : 'img'} aria-label={label ?? `${n} of ${of} doses`}>
      {Array.from({ length: of }, (_, i) => {
        const on = i < n
        if (size === 'xs') return <span key={i} className={cx('rounded-full', px, on ? 'bg-navy' : 'bg-[#d8dcea]')} />
        const body = (
          <motion.span key={on ? 'on' : 'off'} initial={on ? { scale: 0.5 } : false} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 14 }}
            className={cx('relative grid place-items-center rounded-full transition-colors', px, on ? 'bg-[radial-gradient(circle_at_35%_30%,#f6de8d,#d9a94a)] text-white shadow-[0_6px_14px_rgba(181,138,60,.4)]' : 'bg-white text-[#c9cfe0] ring-1 ring-[#e3e6ef]')}>
            <Droplet className={size === 'lg' ? 'size-5' : 'size-4'} strokeWidth={2.4} fill={on ? 'currentColor' : 'none'} />
            {on && size === 'lg' && <motion.span className="absolute inset-0 rounded-full ring-2 ring-[#f6de8d]" initial={{ scale: 1, opacity: 0.9 }} animate={{ scale: 1.6, opacity: 0 }} transition={{ duration: 0.7 }} />}
          </motion.span>
        )
        return onTap
          ? <button key={i} type="button" aria-label={`Dose ${i + 1}${on ? ', taken' : ''}`} aria-pressed={on} onClick={() => onTap(i)}>{body}</button>
          : <span key={i}>{body}</span>
      })}
    </div>
  )
}

/** Today's 4 dots + check-in button + streak + stats; opens the 25-day calendar. */
export function DoseTracker({ full = false }: { full?: boolean }) {
  const s = useApp()
  const [cal, setCal] = useState(false)
  if (!s.blend) return null
  const of = perDay(s), today = dayKey(new Date()), n = dosesOn(s, today)
  const st = doseStats(s)
  const checkIn = () => {
    if (n >= of) return
    s.logDoses(today, n + 1); buzz(16)
    toast(n + 1 === of ? `All ${of} done today 🔥 Your streak grows` : `Dose ${n + 1} of ${of} checked in 🌿`)
  }
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-bold text-navy">Today’s drops <span className="font-semibold text-muted">· {n} of {of}</span></p>
        <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold', st.streak ? 'bg-[#fbe9d6] text-[#9a4f12]' : 'bg-peri-50 text-muted')}>
          <Flame className="size-3.5" fill={st.streak ? 'currentColor' : 'none'} /> {st.streak}-day streak
        </span>
      </div>
      <div className="mt-3 flex justify-center">
        <Dots n={n} of={of} onTap={(i) => { s.logDoses(today, i < n ? i : i + 1); buzz(8) }} label={`Today: ${n} of ${of} doses`} />
      </div>
      <motion.button whileTap={{ scale: 0.96 }} onClick={checkIn} disabled={n >= of}
        className={cx('mt-3 flex h-12 w-full items-center justify-center gap-1.5 rounded-full text-[15px] font-bold', n >= of ? 'bg-sage-100 text-sage-text' : 'bg-navy text-white shadow-[var(--shadow-cta)]')}>
        {n >= of ? 'All done' : <><Plus className="size-4" strokeWidth={3} /> Took a dose</>}
      </motion.button>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { v: `${st.day}/${st.of}`, l: 'Day of bottle' },
          { v: `${st.pct}%`, l: 'Doses taken' },
          { v: `${st.streak}🔥`, l: 'Day streak' },
        ].map((x) => (
          <div key={x.l} className="rounded-[16px] bg-white/80 px-2 py-2.5 ring-1 ring-[#eef0f6]">
            <p className="text-[18px] font-extrabold leading-none text-navy tnum">{x.v}</p>
            <p className="mt-1 text-[11px] font-semibold text-muted">{x.l}</p>
          </div>
        ))}
      </div>
      <button onClick={() => setCal(true)} className={cx('mt-3 flex w-full items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-semibold text-navy', full ? 'bg-peri-50' : 'bg-white/70')}>
        <CalendarDays className="size-4" /> See all {st.of} days · fill in past days
      </button>
      <DoseCalendar open={cal} onClose={() => setCal(false)} />
    </div>
  )
}

/** The bottle's 25 days as a calendar: each day shows its doses; tap a past day to check in. */
export function DoseCalendar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useApp()
  const [sel, setSel] = useState<string | null>(null)
  if (!s.blend) return null
  const of = perDay(s), days = blendDays(s), st = doseStats(s)
  const picked = days.find((d) => d.key === sel) ?? days.find((d) => d.today) ?? days[days.length - 1]
  const lead = (days[0].d.getDay() + 6) % 7 // Monday-first grid
  return (
    <Sheet open={open} onClose={onClose} title="Your 25 days" tall>
      <h2 className="h-duo text-[26px]">Your <em>{st.of} days</em></h2>
      <p className="mt-1 text-[13px] text-muted">One bottle, {of} doses a day. Tap any past day to check in.</p>
      <div className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-navy">
        <span className="rounded-full bg-peri-50 px-2.5 py-1">{st.taken} of {st.due} doses</span>
        <span className="rounded-full bg-[#fbe9d6] px-2.5 py-1 text-[#9a4f12]">🔥 {st.streak}-day streak</span>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center" role="grid" aria-label="Doses by day">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((w, i) => <span key={i} className="text-[11px] font-bold text-muted">{w}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={`l${i}`} />)}
        {days.map((d) => {
          const fullDay = d.n >= of, isSel = picked?.key === d.key
          return (
            <button key={d.key} type="button" disabled={d.future} onClick={() => setSel(d.key)} aria-label={`${d.d.toDateString()}: ${d.n} of ${of} doses`} aria-pressed={isSel}
              className={cx('flex aspect-square flex-col items-center justify-center gap-1 rounded-[12px] text-[12px] font-bold transition-colors',
                d.future ? 'bg-[#f4f5f9] text-[#b8bdcc]' : fullDay ? 'bg-navy text-white' : d.n ? 'bg-[#e7ecfa] text-navy' : 'bg-white text-navy ring-1 ring-[#e7e9f1]',
                isSel && 'ring-2 ring-[#d9a94a] ring-offset-1', d.today && !isSel && 'ring-2 ring-navy/40')}>
              <span className="tnum leading-none">{d.d.getDate()}</span>
              {!d.future && <span className="flex gap-[2px]">{Array.from({ length: of }, (_, i) => <span key={i} className={cx('size-[4px] rounded-full', i < d.n ? (fullDay ? 'bg-[#f6de8d]' : 'bg-navy') : fullDay ? 'bg-white/30' : 'bg-[#cfd4e3]')} />)}</span>}
            </button>
          )
        })}
      </div>
      {/* simple bar graph of the same days */}
      <div className="mt-4 flex h-16 items-end gap-[3px]" aria-hidden>
        {days.map((d) => <span key={d.key} className={cx('flex-1 rounded-t-[3px]', d.future ? 'bg-[#eef0f6]' : d.n >= of ? 'bg-navy' : 'bg-[#aebde6]')} style={{ height: `${d.future ? 8 : Math.max(8, (d.n / of) * 100)}%` }} />)}
      </div>
      <AnimatePresence mode="wait">
        {picked && !picked.future && (
          <motion.div key={picked.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring} className="mt-4 rounded-[22px] bg-peri-50/70 p-4">
            <p className="text-[14px] font-bold text-navy">{picked.today ? 'Today' : fmtDay(picked.d)} · day {picked.index}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <Dots n={picked.n} of={of} size="sm" onTap={(i) => { s.logDoses(picked.key, i < picked.n ? i : i + 1); buzz(8) }} />
              <div className="flex gap-1.5">
                {picked.n > 0 && <button onClick={() => s.logDoses(picked.key, 0)} aria-label="Clear this day" className="grid size-9 place-items-center rounded-full bg-white text-muted"><Undo2 className="size-4" /></button>}
                <Btn size="sm" onClick={() => { s.logDoses(picked.key, of); buzz(14); toast('Marked as all taken') }} disabled={picked.n >= of}>All {of}</Btn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="h-2" />
    </Sheet>
  )
}

export { Dots as DoseDots }
