'use client'
/**
 * @module   remedies-ux
 * @owner    CLIENT (UI) · CONSULTANT owns remedies.logDrops (request 20261118-consultant-to-client-drops-feedback-booking §1)
 * @screens  CL-08 Home (compact) · CL-26 My Remedies (full, 14-day strip)
 * Purpose:  One tap a day — "Took my drops" Yes / Not today, editable 2 days back. Never shaming.
 */
import { AnimatePresence, motion } from 'motion/react'
import { Check } from 'lucide-react'
import { addDays, dayKey, startOfDay } from '@/lib/format'
import { useApp } from '@/lib/store'
import { buzz, cx, spring, toast } from './ui'

const label = (d: Date, i: number) => (i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString('en-IN', { weekday: 'long' }))

export function DropsTick({ full = false }: { full?: boolean }) {
  const drops = useApp((s) => s.drops)
  const log = useApp((s) => s.logDrops)
  const today = startOfDay()
  const k0 = dayKey(today)
  const v = drops[k0]
  const set = (k: string, taken: boolean, quiet = false) => {
    log(k, taken); buzz(taken ? 14 : 6)
    if (!quiet) toast(taken ? 'Lovely, drops ticked for today' : 'That’s okay. Tomorrow is a new day')
  }
  const past = [1, 2].map((i) => ({ d: addDays(today, -i), i }))
  const strip = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13))
  const counted = strip.filter((d) => drops[dayKey(d)] !== undefined)
  const took = strip.filter((d) => drops[dayKey(d)] === true).length

  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        {v === undefined ? (
          <motion.div key="ask" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <p className="text-[15px] font-semibold text-ink">Took your drops today?</p>
            <div className="mt-2 flex gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => set(k0, true)} className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-[16px] bg-navy font-display text-[16px] font-semibold text-white shadow-[var(--shadow-cta)]">
                <Check className="size-4" strokeWidth={3} /> Yes, took them
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => set(k0, false)} className="h-12 flex-1 rounded-[16px] bg-white font-display text-[16px] font-semibold text-navy ring-1 ring-sky-200">Not today</motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div key={String(v)} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={spring}
            className={cx('flex items-center gap-3 rounded-[18px] px-3.5 py-3', v ? 'bg-teal-100' : 'bg-sky-50')}>
            <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 14 }}
              className={cx('grid size-9 shrink-0 place-items-center rounded-full', v ? 'bg-teal text-white' : 'bg-white text-navy')} aria-hidden>
              {v ? <Check className="size-5" strokeWidth={3} /> : <span className="text-[16px]">🌙</span>}
            </motion.span>
            <p className="flex-1 text-[14px] leading-5 text-ink">{v ? <><b className="text-navy">Drops taken today.</b> Lovely.</> : <><b className="text-navy">Not today, that’s okay.</b> Tomorrow is a new day.</>}</p>
            <button onClick={() => set(k0, !v, true)} className="text-[13px] font-semibold text-navy underline underline-offset-2">Change</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the last 2 days stay editable */}
      <div className="mt-3 space-y-1.5">
        {past.map(({ d, i }) => {
          const k = dayKey(d), pv = drops[k]
          return (
            <div key={k} className="flex items-center gap-2 text-[13px]">
              <span className="flex-1 font-medium text-muted">{label(d, i)}</span>
              {([true, false] as const).map((t) => (
                <button key={String(t)} aria-pressed={pv === t} onClick={() => set(k, t, true)}
                  className={cx('min-h-9 rounded-full px-3 text-[12px] font-semibold transition-colors', pv === t ? (t ? 'bg-teal text-white' : 'bg-navy text-white') : 'bg-white text-navy ring-1 ring-sky-200')}>
                  {t ? 'Took them' : 'Not that day'}
                </button>
              ))}
            </div>
          )
        })}
      </div>

      {full && (
        <div className="mt-4">
          <div className="flex gap-1" role="img" aria-label={`Drops ticked on ${took} of the last 14 days`}>
            {strip.map((d) => {
              const x = drops[dayKey(d)]
              return <span key={dayKey(d)} title={d.toDateString()} className={cx('h-6 flex-1 rounded-[6px]', x === true ? 'bg-marigold' : x === false ? 'bg-sky-200' : 'bg-white ring-1 ring-line')} />
            })}
          </div>
          <p className="mt-2 text-[12px] text-muted">{counted.length ? `You took them on ${took} of the last ${counted.length} days you logged. Every day counts.` : 'Tick once a day. It helps Jitu Bhaiya see how your blend is going.'}</p>
        </div>
      )}
    </div>
  )
}
