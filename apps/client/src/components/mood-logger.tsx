'use client'
/**
 * @module   journal
 * @owner    CLIENT
 * @screens  CL-08 Home · "Log how you feel" (owner 2026-11-23)
 * Purpose:  A bottom sheet in two steps. 1) A slider from very unpleasant to very pleasant; a flower opens and warms up as it
 *           moves (and closes, cools and droops the other way). 2) Feelings that match, or search any feeling; optional note.
 *           "Right now" or, in the evening, "Today overall". Saved as a journal entry with valence 1 to 7.
 */
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { ChevronLeft, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { MoodImg } from './brand'
import { Btn, buzz, cx, toast } from './ui'
import { MOODS, moodOf, type Emotion } from '@/lib/data'
import { useApp } from '@/lib/store'

export const LEVELS = ['Very unpleasant', 'Unpleasant', 'Slightly unpleasant', 'Neutral', 'Slightly pleasant', 'Pleasant', 'Very pleasant']
// indigo → lilac → slate → sky → sage → marigold → coral-orange
const HUES = ['#4B3FA6', '#7B63D6', '#8D95B8', '#7FB2DA', '#7CC4A4', '#F2B33B', '#F08A3C']
const mix = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const [x, y] = [p(a), p(b)]
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`
}
export const hueAt = (v: number) => { const i = Math.max(0, Math.min(5, Math.floor(v))); return mix(HUES[i], HUES[i + 1], Math.min(1, v - i)) }

/** feelings that fit a level: unpleasant ones low, pleasant ones high, the calmer middle around neutral */
function fits(level: number) {
  return MOODS.filter((m) => (level <= 2 ? !m.pleasant && m.lift <= 2.2 : level === 3 ? !m.pleasant : level === 4 ? m.lift >= 2 && m.lift <= 4.5 : level === 5 ? m.pleasant && m.lift <= 4.5 : m.pleasant))
}

export function MoodLogger({ open, onClose, kind: kind0 = 'moment' }: { open: boolean; onClose: () => void; kind?: 'moment' | 'day' }) {
  const logMood = useApp((s) => s.logMood)
  const still = useReducedMotion()
  const [kind, setKind] = useState(kind0)
  const [step, setStep] = useState<'feel' | 'pick'>('feel')
  const v = useMotionValue(3) // 0..6 continuous
  const [level, setLevel] = useState(3)
  const [q, setQ] = useState('')
  const [pick, setPick] = useState<Emotion | null>(null)
  const [note, setNote] = useState('')
  useEffect(() => { if (open) { setKind(kind0); setStep('feel'); v.set(3); setLevel(3); setQ(''); setPick(null); setNote('') } }, [open, kind0, v])
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [open, onClose])

  const color = useTransform(v, (x) => hueAt(x))
  const glow = useTransform(v, (x) => `radial-gradient(120% 70% at 50% 18%, ${hueAt(x)}55, transparent 70%)`)
  const thumbLeft = useTransform(v, (x) => `calc(${(x / 6) * 100}% + ${18 - (x / 6) * 36}px)`)
  const onSlide = (x: number) => {
    v.set(x)
    const l = Math.round(x)
    if (l !== level) { setLevel(l); buzz(6) }
  }
  const settle = () => animate(v, level, { type: 'spring', stiffness: 300, damping: 26 })

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return t ? MOODS.filter((m) => m.label.toLowerCase().includes(t) || (m.words ?? '').includes(t)) : fits(level + 1)
  }, [q, level])

  const save = () => {
    if (!pick) return
    logMood(pick, new Date(), note, { valence: level + 1, kind })
    buzz(14); toast(`${moodOf(pick).label} · logged 🌿`); onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={kind === 'day' ? 'How was your day overall' : 'Log how you feel'}>
          <motion.div className="absolute inset-0 bg-[#0d1230]/45 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="absolute inset-x-0 bottom-0 mx-auto flex h-[92dvh] max-w-[480px] flex-col overflow-hidden rounded-t-[32px] bg-[#f7f8fc]"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
            <motion.div className="pointer-events-none absolute inset-0" style={{ background: glow }} aria-hidden />
            <div className="relative flex items-center justify-between px-4 pt-4">
              {step === 'pick'
                ? <button onClick={() => setStep('feel')} aria-label="Back" className="grid size-10 place-items-center rounded-full bg-white shadow-[var(--shadow-card)]"><ChevronLeft className="size-5 text-navy" /></button>
                : <span className="size-10" />}
              <div className="flex rounded-full bg-white/80 p-1 shadow-[var(--shadow-card)]" role="tablist" aria-label="What are you logging?">
                {(['moment', 'day'] as const).map((k) => (
                  <button key={k} role="tab" aria-selected={kind === k} onClick={() => setKind(k)} className={cx('rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors', kind === k ? 'bg-navy text-white' : 'text-navy')}>
                    {k === 'moment' ? 'Right now' : 'Today overall'}
                  </button>
                ))}
              </div>
              <button onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-full bg-white shadow-[var(--shadow-card)]"><X className="size-5 text-navy" /></button>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {step === 'feel' ? (
                <motion.div key="feel" className="relative flex flex-1 flex-col px-6 pb-[max(env(safe-area-inset-bottom),20px)]" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <h2 className="mt-6 text-center font-display text-[26px] font-semibold leading-8 text-ink">{kind === 'day' ? 'How was your day overall?' : 'How do you feel right now?'}</h2>
                  <div className="flex flex-1 items-center justify-center"><Bloom v={v} still={!!still} level={level} /></div>
                  <AnimatePresence mode="wait">
                    <motion.p key={level} initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }} transition={{ duration: 0.22 }}
                      className="text-center font-display text-[30px] font-semibold text-ink" aria-live="polite">{LEVELS[level]}</motion.p>
                  </AnimatePresence>
                  <div className="mt-6">
                    <div className="relative h-11">
                      <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full" style={{ background: `linear-gradient(90deg, ${HUES.join(', ')})` }} />
                      <motion.span className="pointer-events-none absolute top-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white shadow-[0_6px_18px_rgba(20,30,70,.3)]"
                        style={{ left: thumbLeft, background: color }} />
                      <input type="range" min={0} max={6} step={0.01} defaultValue={3} onChange={(e) => onSlide(Number(e.target.value))} onPointerUp={settle} onKeyUp={settle}
                        aria-label="How pleasant or unpleasant" aria-valuetext={LEVELS[level]} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                    </div>
                    <div className="mt-1 flex justify-between text-[12px] font-semibold text-muted"><span>Very unpleasant</span><span>Very pleasant</span></div>
                  </div>
                  <Btn full className="mt-6" onClick={() => { buzz(8); setStep('pick') }}>Next</Btn>
                </motion.div>
              ) : (
                <motion.div key="pick" className="relative flex min-h-0 flex-1 flex-col" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
                  <div className="px-6 pt-5">
                    <p className="text-center text-[13px] font-bold uppercase tracking-[0.1em]" style={{ color: hueAt(level) }}>{LEVELS[level]}</p>
                    <h2 className="mt-1 text-center font-display text-[24px] font-semibold text-ink">What describes it best?</h2>
                    <label className="mt-4 flex h-11 items-center gap-2 rounded-full bg-white px-4 shadow-[var(--shadow-card)] focus-within:ring-2 focus-within:ring-navy">
                      <Search className="size-4 text-muted" aria-hidden />
                      <input value={q} onChange={(e) => setQ(e.target.value.slice(0, 30))} placeholder="Search any feeling" aria-label="Search any feeling" className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none" />
                    </label>
                  </div>
                  <div className="no-scrollbar mt-4 min-h-0 flex-1 overflow-y-auto px-5 pb-4">
                    <div className="grid grid-cols-3 gap-2.5">
                      {list.map((m, k) => (
                        <motion.button key={m.key} type="button" aria-pressed={pick === m.key} onClick={() => { buzz(8); setPick(m.key as Emotion) }}
                          initial={{ opacity: 0, scale: 0.85, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: Math.min(k, 12) * 0.025, type: 'spring', stiffness: 380, damping: 24 }}
                          className={cx('flex flex-col items-center gap-1 rounded-[20px] bg-white p-2.5 shadow-[var(--shadow-card)] transition-shadow', pick === m.key && 'ring-2 ring-navy')}>
                          <MoodImg mood={m.key as Emotion} size={46} />
                          <span className="text-[13px] font-semibold text-navy">{m.label}</span>
                        </motion.button>
                      ))}
                    </div>
                    {!list.length && <p className="mt-6 text-center text-[14px] text-muted">No feeling called “{q}”. Try another word.</p>}
                  </div>
                  <div className="border-t border-line bg-white/90 px-5 pb-[max(env(safe-area-inset-bottom),14px)] pt-3 backdrop-blur">
                    {pick && <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 300))} rows={2} placeholder="Add a note (optional)" aria-label="Add a note"
                      className="mb-2 w-full resize-none rounded-[16px] bg-peri-50 p-3 text-[15px] outline-none focus:ring-2 focus:ring-navy" />}
                    <Btn full disabled={!pick} onClick={save}>{pick ? `Log “${moodOf(pick).label}”` : 'Pick a feeling'}</Btn>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/** A flower that opens, warms and lifts as the slider moves to pleasant; closes, cools and droops towards unpleasant. */
function Bloom({ v, still, level }: { v: ReturnType<typeof useMotionValue<number>>; still: boolean; level: number }) {
  const PETALS = 10
  const fill = useTransform(v, (x) => hueAt(x))
  const len = useTransform(v, (x) => 30 + x * 6.5)      // petal length
  const wid = useTransform(v, (x) => 12 + x * 2)        // petal width
  const open = useTransform(v, (x) => 0.6 + x * 0.06)    // how far petals spread
  const core = useTransform(v, (x) => 16 + x * 1.6)
  const pop = useMotionValue(1)
  useEffect(() => { if (!still) animate(pop, [0.92, 1.04, 1], { duration: 0.45, ease: 'easeOut' }) }, [level, still, pop])
  return (
    <motion.div className="relative size-[230px]" style={{ scale: pop }} aria-hidden>
      <motion.span className="absolute inset-6 rounded-full blur-2xl" style={{ background: fill, opacity: 0.35 }} />
      {!still && <motion.span key={level} className="absolute inset-10 rounded-full border-2" style={{ borderColor: fill }} initial={{ scale: 0.6, opacity: 0.8 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }} />}
      <motion.svg viewBox="-140 -140 280 280" className="absolute inset-0 size-full" animate={still ? undefined : { rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}>
        {Array.from({ length: PETALS }, (_, i) => (
          <g key={i} transform={`rotate(${(360 / PETALS) * i})`}>
            <motion.ellipse cx={0} cy={useTransform([len, open], ([l, o]) => -(l as number) * (o as number))} rx={wid} ry={len} style={{ fill }} opacity={0.82} />
          </g>
        ))}
        <motion.circle r={core} fill="#fff" opacity={0.92} />
        <motion.circle r={useTransform(core, (c) => c * 0.55)} style={{ fill }} />
      </motion.svg>
    </motion.div>
  )
}
