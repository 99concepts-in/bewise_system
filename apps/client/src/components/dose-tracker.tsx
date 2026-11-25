'use client'
/**
 * @module   remedies-ux
 * @owner    CLIENT (UI) · CONSULTANT owns remedies.logDrops
 * @screens  CL-08 Home blend card · CL-26 My care
 * Purpose:  Owner 2026-11-18: 4 dots that light up with each dose (4 drops, 4× a day), days of self-care, a few stats,
 *           and a 25-day calendar (the life of a bottle) where past days can be checked in too. Never shaming.
 */
import { AnimatePresence, motion } from 'motion/react'
import { CalendarDays, Flower2, Plus, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { Btn, Sheet, buzz, cx, spring, toast } from './ui'
import { useApp } from '@/lib/store'
import { dayKey, fmtDay } from '@/lib/format'
import { blendDays, doseStats, dosesOn, perDay } from '@/lib/doses'

/** owner 2026-11-21: one dose = 4 drops, so each dose shows 4 little drops that fall in together when ticked. */
const DROP = 'M0 -4.6C2.2 -1.6 3.2 0.3 3.2 1.7A3.2 3.2 0 0 1 -3.2 1.7C-3.2 0.3 -2.2 -1.6 0 -4.6Z'
const SPOTS = [[12, 5.6], [6, 12.2], [18, 12.2], [12, 18.6]]
function FourDrops({ on, animate }: { on: boolean; animate: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-[62%]" aria-hidden>
      {SPOTS.map(([x, y], k) => (
        <g key={k} transform={`translate(${x} ${y})`}>
          <motion.path d={DROP} fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={on ? 0 : 1.3} strokeLinejoin="round"
            initial={animate ? { y: -7, opacity: 0 } : false} animate={{ y: 0, opacity: 1 }} transition={{ delay: animate ? k * 0.07 : 0, type: 'spring', stiffness: 420, damping: 16 }} />
        </g>
      ))}
    </svg>
  )
}

function Dots({ n, of, size = 'lg', onTap, label, fluid }: { n: number; of: number; size?: 'lg' | 'sm' | 'xs'; onTap?: (i: number) => void; label?: string; fluid?: boolean }) {
  const px = size === 'lg' ? 'size-12' : size === 'sm' ? 'size-9' : 'size-[7px]'
  return (
    <div className={cx('flex', fluid ? 'w-full justify-between' : size === 'xs' ? 'gap-[3px]' : size === 'lg' ? 'gap-3.5' : 'gap-2')} role={onTap ? 'group' : 'img'} aria-label={label ?? `${n} of ${of} doses`}>
      {Array.from({ length: of }, (_, i) => {
        const on = i < n
        if (size === 'xs') return <span key={i} className={cx('rounded-full', px, on ? 'bg-navy' : 'bg-[#d8dcea]')} />
        const body = (
          <motion.span key={on ? 'on' : 'off'} initial={on ? { scale: 0.7 } : false} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 14 }}
            className={cx('relative grid place-items-center rounded-full transition-colors', px, on ? 'bg-[radial-gradient(circle_at_35%_30%,#f6de8d,#d9a94a)] text-white shadow-[0_6px_14px_rgba(181,138,60,.4)]' : 'bg-white text-[#c3cadd] ring-1 ring-[#e3e6ef]')}>
            <FourDrops on={on} animate={on} />
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
export function DoseTracker({ full = false, compact = false }: { full?: boolean; compact?: boolean }) {
  const s = useApp()
  const [cal, setCal] = useState(false)
  if (!s.blend) return null
  const of = perDay(s), today = dayKey(new Date()), n = dosesOn(s, today)
  const st = doseStats(s)
  const checkIn = () => {
    if (n >= of) return
    s.logDoses(today, n + 1); buzz(16)
    toast(n + 1 === of ? `All ${of} done today 🌸 Another day of self-care` : `Dose ${n + 1} of ${of} checked in 🌿`)
  }
  return (
    <div>
      {!compact && <>
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-bold text-navy">Today’s drops <span className="font-semibold text-muted">· {n} of {of}</span></p>
        <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold', st.streak ? 'bg-[#fde3ec] text-[#8a2f52]' : 'bg-peri-50 text-muted')}>
          <Flower2 className="size-3.5" /> {careDays(st.streak)}
        </span>
      </div>
      <div className="mt-3 flex justify-center">
        <Dots n={n} of={of} onTap={(i) => { s.logDoses(today, i < n ? i : i + 1); buzz(8) }} label={`Today: ${n} of ${of} doses`} />
      </div>
      <motion.button whileTap={{ scale: 0.96 }} onClick={checkIn} disabled={n >= of}
        className={cx('mt-3 flex h-12 w-full items-center justify-center gap-1.5 rounded-full text-[15px] font-bold', n >= of ? 'bg-sage-100 text-sage-text' : 'bg-navy text-white shadow-[var(--shadow-cta)]')}>
        {n >= of ? 'All done' : <><Plus className="size-4" strokeWidth={3} /> Took a dose</>}
      </motion.button>
      </>}
      <div className={cx('grid grid-cols-3 gap-2 text-center', !compact && 'mt-4')}>
        {[
          { v: `${st.day}/${st.of}`, l: 'Day of bottle' },
          { v: `${st.pct}%`, l: 'Doses taken' },
          { v: `${st.streak}🌸`, l: 'Self-care days' },
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
        <span className="rounded-full bg-[#fde3ec] px-2.5 py-1 text-[#8a2f52]">🌸 {careDays(st.streak)}</span>
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

/** owner 2026-11-24: wellness words instead of "streak" */
export const careDays = (n: number) => `${n} day${n === 1 ? '' : 's'} of self-care`

const BLOOMS = [
  { petal: '#F7C873', deep: '#E39A2D' }, // morning marigold
  { petal: '#F4A3B4', deep: '#D9647F' }, // afternoon rose
  { petal: '#B9A6F2', deep: '#7D63D8' }, // evening lilac
  { petal: '#8FC9E8', deep: '#3D8CB8' }, // night sky
]
const PART = ['Morning', 'Afternoon', 'Evening', 'Night']
const hm = (t?: string) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`
}

/**
 * owner 2026-11-24: "the remedy tracker is too bland". Each dose is a bud on a vine; checking it in makes it bloom
 * (a different flower for morning, afternoon, evening and night), and the vine fills as the day goes.
 */
export function DoseBlooms({ n, of, times, onTap, label }: { n: number; of: number; times: string[]; onTap: (i: number) => void; label: string }) {
  return (
    <div className="relative" role="group" aria-label={label}>
      {/* the vine */}
      <span className="absolute inset-x-[12%] top-[30px] h-[3px] rounded-full bg-[#e4e2f3]" aria-hidden />
      <motion.span className="absolute left-[12%] top-[30px] h-[3px] rounded-full bg-[linear-gradient(90deg,#9ccf9f,#5fa36a)]" aria-hidden
        initial={false} animate={{ width: `${(Math.max(0, Math.min(n, of) - 1) / Math.max(1, of - 1)) * 76}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
      <div className="relative flex justify-between">
        {Array.from({ length: of }, (_, i) => {
          const on = i < n, b = BLOOMS[i % BLOOMS.length]
          return (
            <button key={i} type="button" aria-label={`Dose ${i + 1}${on ? ', taken' : ''}`} aria-pressed={on} onClick={() => onTap(i)}
              className="group flex w-[22%] flex-col items-center gap-1.5 outline-none">
              <span className="relative grid size-[62px] place-items-center">
                <AnimatePresence initial={false} mode="popLayout">
                  {on ? (
                    <motion.svg key="on" viewBox="-32 -32 64 64" className="absolute inset-0 size-full drop-shadow-[0_6px_10px_rgba(120,80,40,.22)]"
                      initial={{ scale: 0.2, rotate: -70, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 13 }}>
                      {[0, 60, 120, 180, 240, 300].map((a) => <ellipse key={a} cx={0} cy={-17} rx={11} ry={15} fill={b.petal} stroke={b.deep} strokeOpacity={0.35} strokeWidth={1} transform={`rotate(${a})`} />)}
                      <circle r={12} fill="#fff" />
                      <path d="M-5 0.5 -1.5 4 5.5 -3.5" fill="none" stroke={b.deep} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  ) : (
                    <motion.span key="off" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
                      className="absolute inset-[7px] grid place-items-center rounded-full bg-white text-[#b9b4dc] shadow-[0_4px_12px_rgba(60,50,120,.08)] border-[1.5px] border-dashed border-[#cfc9ee] transition-transform group-active:scale-95">
                      <FourDrops on={false} animate={false} />
                    </motion.span>
                  )}
                </AnimatePresence>
                {on && <motion.span key={`r${n}`} className="absolute inset-1 rounded-full" style={{ boxShadow: `0 0 0 2px ${b.petal}` }} initial={{ scale: 1, opacity: 0.9 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ duration: 0.8 }} aria-hidden />}
              </span>
              <span className="text-center leading-none">
                <span className={cx('block text-[11px] font-bold', on ? 'text-navy' : 'text-muted')}>{PART[i] ?? `Dose ${i + 1}`}</span>
                <span className="mt-0.5 block text-[10px] font-semibold text-muted">{hm(times[i])}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
