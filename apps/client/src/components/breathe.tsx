'use client'
/**
 * @module   remedies-ux
 * @owner    CLIENT
 * Owner 2026-11-24: after the day's last dose, a short breathing moment (breathe in, breathe out), then the mood slider.
 * One calm cycle: in for 4 s, out for 6 s. Gentle haptic at each change. Skip is always there.
 */
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { buzz } from './ui'

const IN = 4000, OUT = 6000

export function Breathe({ open, onDone }: { open: boolean; onDone: () => void }) {
  const still = useReducedMotion()
  const [phase, setPhase] = useState<'intro' | 'in' | 'out'>('intro')
  useEffect(() => {
    if (!open) return
    setPhase('intro')
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'
    const t1 = setTimeout(() => { setPhase('in'); buzz(10) }, 1600)
    const t2 = setTimeout(() => { setPhase('out'); buzz(10) }, 1600 + IN)
    const t3 = setTimeout(() => { buzz(14); onDone() }, 1600 + IN + OUT)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); document.body.style.overflow = prev }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const scale = phase === 'in' ? 1 : phase === 'out' ? 0.45 : 0.5
  const dur = phase === 'in' ? IN / 1000 : phase === 'out' ? OUT / 1000 : 0.8
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[65] mx-auto flex max-w-[480px] flex-col items-center overflow-hidden bg-[#141a3a] text-white"
          role="dialog" aria-modal="true" aria-label="A moment to breathe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
          <motion.div aria-hidden className="absolute inset-0" animate={{ background: phase === 'in' ? 'radial-gradient(80% 60% at 50% 45%, #3a5bd6, #141a3a 75%)' : phase === 'out' ? 'radial-gradient(70% 50% at 50% 45%, #2a7f8f, #141a3a 75%)' : 'radial-gradient(60% 45% at 50% 45%, #2b3478, #141a3a 75%)' }}
            transition={{ duration: dur, ease: 'easeInOut' }} />
          <div className="relative flex w-full justify-end px-4 pt-[max(env(safe-area-inset-top),16px)]">
            <button onClick={onDone} className="rounded-full bg-white/12 px-4 py-2 text-[14px] font-semibold ring-1 ring-white/15">Skip</button>
          </div>
          <div className="relative flex flex-1 flex-col items-center justify-center px-8">
            <div className="relative grid size-[300px] place-items-center">
              {[0.9, 0.7, 0.5].map((o, k) => (
                <motion.span key={k} aria-hidden className="absolute inset-0 rounded-full"
                  style={{ background: `radial-gradient(circle at 40% 35%, rgba(255,255,255,${0.35 * o}), rgba(140,170,255,${0.25 * o}) 55%, transparent 70%)`, border: `1px solid rgba(255,255,255,${0.25 * o})` }}
                  animate={{ scale: still ? 0.8 : scale * (1 - k * 0.14) }} transition={{ duration: dur, ease: 'easeInOut', delay: k * 0.12 }} />
              ))}
              <motion.span aria-hidden className="absolute size-16 rounded-full bg-white/85 shadow-[0_0_60px_rgba(255,255,255,.6)]"
                animate={{ scale: still ? 1 : phase === 'in' ? 1.5 : 1 }} transition={{ duration: dur, ease: 'easeInOut' }} />
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={phase} className="mt-8 text-center" initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }} transition={{ duration: 0.5 }}>
                {phase === 'intro' && <><p className="text-[15px] font-semibold text-white/75">All 4 doses done today 🌿</p><p className="mt-1 font-display text-[30px] font-semibold">Let’s take one breath</p></>}
                {phase === 'in' && <p className="font-display text-[36px] font-semibold" aria-live="polite">Breathe in…</p>}
                {phase === 'out' && <p className="font-display text-[36px] font-semibold" aria-live="polite">Breathe out…</p>}
              </motion.div>
            </AnimatePresence>
          </div>
          <p className="relative pb-[max(env(safe-area-inset-bottom),28px)] text-center text-[13px] text-white/60">Next: how do you feel right now?</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
