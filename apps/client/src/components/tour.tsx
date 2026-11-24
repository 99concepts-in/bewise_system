'use client'
/**
 * @module onboarding @owner CLIENT
 * Owner 2026-11-24: after sign-up, a short tour of Home, skippable. Spotlights elements marked data-tour="…"; steps whose
 * element isn't on screen are skipped. Ends (or Skip) → profile.tourPending = false.
 */
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { buzz } from './ui'
import { useApp } from '@/lib/store'

const STEPS = [
  { id: 'remedy', title: 'Your remedy', body: 'Tap a drop each time you take your 4 drops. The bottle shows the days left in this blend.' },
  { id: 'blend', title: 'Your blend', body: 'After your session, Jitendra Khimlani prepares your blend. You’ll see here when it’s ready.' },
  { id: 'mood', title: 'How you feel', body: 'Log how you feel in a few seconds. Over time you’ll notice your patterns.' },
  { id: 'meet', title: 'Book a session', body: 'Book your next wellness session with Jitendra Khimlani, right from here.' },
  { id: 'learn', title: 'Learn', body: 'Short Bach flower stories, 3 minutes each. Tap a card to start.' },
  { id: 'ask', title: 'Ask BeWise', body: 'Questions about your drops, blend or sessions? Ask anytime.' },
  { id: 'nav', title: 'Everything in one place', body: 'My care has your blend and sessions, Learn all the stories, Shop wellness products, and Me your profile.' },
]

export function Tour() {
  const pending = useApp((s) => !!s.profile?.tourPending)
  const setProfile = useApp((s) => s.setProfile)
  const [ready, setReady] = useState(false)
  const [k, setK] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  useEffect(() => { if (pending) { const t = setTimeout(() => setReady(true), 900); return () => clearTimeout(t) } }, [pending])
  const steps = useMemo(() => (ready ? STEPS.filter((s) => document.querySelector(`[data-tour="${s.id}"]`)) : []), [ready])
  const step = steps[k]
  const end = () => { buzz(10); setProfile({ tourPending: false }); setReady(false); setK(0) }
  useLayoutEffect(() => {
    if (!step) return
    const el = document.querySelector(`[data-tour="${step.id}"]`) as HTMLElement | null
    if (!el) return
    if (step.id !== 'nav') el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const measure = () => setRect(el.getBoundingClientRect())
    const t = setTimeout(measure, 450)
    window.addEventListener('resize', measure); window.addEventListener('scroll', measure, true)
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true) }
  }, [step])
  useEffect(() => {
    if (!step) return
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [step])
  if (!pending || !step) return null
  const pad = 8
  const below = rect ? rect.top + rect.height / 2 < window.innerHeight / 2 : true
  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={`Tour: ${step.title}`}>
      <AnimatePresence>
        {rect && (
          <motion.div key="spot" className="pointer-events-none absolute rounded-[28px] ring-2 ring-white/80"
            initial={false} animate={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }} style={{ boxShadow: '0 0 0 9999px rgba(12,16,40,.62)' }} />
        )}
      </AnimatePresence>
      {!rect && <div className="absolute inset-0 bg-[rgba(12,16,40,.62)]" />}
      <motion.div key={step.id} className="absolute inset-x-4 mx-auto max-w-[440px] rounded-[24px] bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,.3)]"
        style={rect ? (below ? { top: Math.min(window.innerHeight - 220, rect.bottom + pad + 12) } : { bottom: Math.max(16, window.innerHeight - rect.top + pad + 12) }) : { top: '40%' }}
        initial={{ opacity: 0, y: below ? 10 : -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-sage-text">Quick tour · {k + 1} of {steps.length}</p>
        <p className="mt-1 font-display text-[21px] font-semibold text-ink">{step.title}</p>
        <p className="mt-1 text-[15px] leading-6 text-ink-2">{step.body}</p>
        <div className="mt-4 flex items-center justify-between">
          <button onClick={end} className="rounded-full px-3 py-2 text-[14px] font-semibold text-muted">Skip tour</button>
          <button onClick={() => { buzz(6); if (k + 1 >= steps.length) end(); else { setRect(null); setK(k + 1) } }} className="h-11 rounded-full bg-navy px-6 text-[15px] font-semibold text-white">
            {k + 1 >= steps.length ? 'Done' : 'Next'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
