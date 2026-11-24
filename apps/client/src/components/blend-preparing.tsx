'use client'
/**
 * @module remedies-ux @owner CLIENT
 * Owner 2026-11-24: after a session and before the blend is ready, members see that their blend is being prepared.
 * Shown on Home (in place of the remedy card) and in My care. Live: CONSULTANT marks the blend ready (remedies.setBlend).
 */
import { motion, useReducedMotion } from 'motion/react'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RemedyBottle } from './remedy-bottle'
import { cx, useNow } from './ui'
import { useApp } from '@/lib/store'
import { tbc } from '@/lib/appt'
import { fmtDay } from '@/lib/format'

export function usePreparing() {
  const appts = useApp((s) => s.appointments)
  const blend = useApp((s) => s.blend)
  const now = useNow(60_000)
  if (blend) return null
  return appts.filter((a) => a.status === 'completed' || (a.status === 'confirmed' && !tbc(a) && +new Date(a.startsAt) + 3600_000 < now))
    .sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt))[0] ?? null
}

export function BlendPreparing({ inCare }: { inCare?: boolean }) {
  const session = usePreparing()
  const still = useReducedMotion()
  const [lvl, setLvl] = useState(0.15)
  useEffect(() => { if (still) { setLvl(0.6); return } const t = setInterval(() => setLvl((x) => (x >= 0.85 ? 0.15 : x + 0.14)), 1100); return () => clearInterval(t) }, [still])
  if (!session) return null
  const steps = [
    { t: 'Session with Jitendra Khimlani', d: fmtDay(session.startsAt), done: true },
    { t: 'Flowers chosen for you', d: 'Based on how you feel', done: true },
    { t: 'Your blend is being prepared', d: 'With care, charged with mantras', active: true },
    { t: 'Ready for you', d: 'We’ll let you know on WhatsApp' },
  ]
  return (
    <section data-tour="blend" className="card overflow-hidden p-5" aria-labelledby="prep-h">
      <div className="flex items-center gap-4">
        <div className="relative flex w-[72px] shrink-0 justify-center">
          <span className="absolute bottom-0 h-3 w-12 rounded-[50%] bg-navy/15 blur-[5px]" aria-hidden />
          <RemedyBottle level={lvl} height={120} pulse={Math.round(lvl * 10)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-sage-text">{inCare ? 'Your blend' : 'Your remedy'}</p>
          <h2 id="prep-h" className="h-section mt-0.5">Your blend is being prepared</h2>
          <p className="mt-1 text-[13px] leading-5 text-ink-2">Jitendra Khimlani is preparing your personal blend. We’ll let you know as soon as it’s ready.</p>
        </div>
      </div>
      <ol className="mt-4 space-y-0">
        {steps.map((s, k) => (
          <li key={s.t} className="flex gap-3">
            <span className="flex flex-col items-center">
              <motion.span className={cx('grid size-6 place-items-center rounded-full', s.done ? 'bg-sage-text text-white' : s.active ? 'bg-marigold-100 ring-2 ring-[#e2a24c]' : 'bg-peri-50')}
                animate={s.active && !still ? { scale: [1, 1.15, 1] } : undefined} transition={{ duration: 1.6, repeat: Infinity }}>
                {s.done ? <Check className="size-3.5" strokeWidth={3} /> : s.active ? <span className="size-2 rounded-full bg-[#e2a24c]" /> : null}
              </motion.span>
              {k < steps.length - 1 && <span className={cx('my-0.5 w-0.5 flex-1', s.done ? 'bg-sage-text/50' : 'bg-peri-50')} style={{ minHeight: 14 }} />}
            </span>
            <span className="pb-2.5">
              <span className={cx('block text-[14px] font-semibold', s.done || s.active ? 'text-navy' : 'text-muted')}>{s.t}</span>
              <span className="block text-[12px] text-muted">{s.d}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
