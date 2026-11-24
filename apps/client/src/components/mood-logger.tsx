'use client'
/**
 * @module   journal
 * @owner    CLIENT
 * @screens  CL-08 Home · "Log how you feel" (owner 2026-11-23, redesigned the same day to the immersive style the owner shared)
 * Purpose:  Full-screen, colour-tinted sheet in three steps:
 *           1) slider very unpleasant → very pleasant; the layered mood shape morphs (spiky star → circle → flower) and the whole
 *              screen re-tints, with a haptic tick on each step;
 *           2) pick one or more feelings that fit (or search any), optional note;
 *           3) a summary card ("Peaceful, Grateful · A very pleasant day"), then Done.
 *           "Right now" or "Today overall". Saved as a journal entry (valence 1 to 7, kind, extra feelings in `also`).
 */
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react'
import { Check, ChevronLeft, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { buzz, cx, toast } from './ui'
import { MoodImg } from './brand'
import { MOOD_LEVELS, MoodShape, moodColor, moodInk } from './mood-shape'
import { MOODS, moodOf, type Emotion } from '@/lib/data'
import { useApp } from '@/lib/store'

export const LEVELS = MOOD_LEVELS
export const hueAt = (v: number) => moodColor(v)

/** feelings that fit a level: unpleasant ones low, pleasant ones high, the calmer middle around neutral */
function fits(level: number) {
  return MOODS.filter((m) => (level <= 1 ? !m.pleasant && m.lift <= 2.2 : level === 2 ? !m.pleasant : level === 3 ? m.lift >= 2 && m.lift <= 4.5 : level === 4 ? m.pleasant && m.lift <= 4.5 : m.pleasant))
}
const dayWord = (l: number) => ['A very unpleasant', 'An unpleasant', 'A slightly unpleasant', 'A neutral', 'A slightly pleasant', 'A pleasant', 'A very pleasant'][l]

export function MoodLogger({ open, onClose, kind: kind0 = 'moment' }: { open: boolean; onClose: () => void; kind?: 'moment' | 'day' }) {
  const logMood = useApp((s) => s.logMood)
  const [kind, setKind] = useState(kind0)
  const [step, setStep] = useState<'feel' | 'pick' | 'done'>('feel')
  const v = useMotionValue(3)
  const [level, setLevel] = useState(3)
  const [q, setQ] = useState('')
  const [picks, setPicks] = useState<Emotion[]>([])
  const [note, setNote] = useState('')
  useEffect(() => { if (open) { setKind(kind0); setStep('feel'); v.set(3); setLevel(3); lastLevel.current = 3; setQ(''); setPicks([]); setNote('') } }, [open, kind0, v])
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [open, onClose])

  // the whole screen takes the mood's colour: a dark base tinted from the top
  const bg = useTransform(v, (x) => `radial-gradient(130% 75% at 50% 0%, ${moodColor(x, 0.55)}, transparent 70%), linear-gradient(180deg, ${moodColor(x, 0.28)}, #17181d 85%)`)
  const btn = useTransform(v, (x) => moodColor(x))
  const ink = useTransform(v, (x) => moodInk(x))
  const thumbLeft = useTransform(v, (raw) => { const x = Math.max(0, Math.min(6, raw)); return `calc(${(x / 6) * 100}% + ${20 - (x / 6) * 40}px)` })
  const lastLevel = useRef(3)
  useMotionValueEvent(v, 'change', (x) => { const l = Math.max(0, Math.min(6, Math.round(x))); if (l !== lastLevel.current) { lastLevel.current = l; setLevel(l); buzz(6) } })
  const snap = useRef<ReturnType<typeof animate> | null>(null)
  const settle = () => { snap.current?.stop(); snap.current = animate(v, Math.max(0, Math.min(6, Math.round(v.get()))), { type: 'spring', bounce: 0, duration: 0.35 }) }
  const track = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  // finger x → 0..6, accounting for the thumb's 20 px inset at each end
  const fromPointer = (clientX: number) => {
    const r = track.current?.getBoundingClientRect(); if (!r) return
    v.set(Math.max(0, Math.min(6, ((clientX - r.left - 20) / Math.max(1, r.width - 40)) * 6)))
  }

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return t ? MOODS.filter((m) => m.label.toLowerCase().includes(t) || (m.words ?? '').includes(t)) : fits(level)
  }, [q, level])
  const toggle = (k: Emotion) => { buzz(8); setPicks((p) => (p.includes(k) ? p.filter((x) => x !== k) : p.length >= 3 ? [...p.slice(1), k] : [...p, k])) }
  const save = () => {
    if (!picks.length) return
    logMood(picks[0], new Date(), note, { valence: level + 1, kind, also: picks.slice(1) })
    buzz(14); setStep('done')
  }
  const names = picks.map((p) => moodOf(p).label).join(', ')

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={kind === 'day' ? 'How was your day overall' : 'Log how you feel'}>
          <motion.div className="absolute inset-0 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="absolute inset-x-0 bottom-0 mx-auto flex h-[94dvh] max-w-[480px] flex-col overflow-hidden rounded-t-[34px] bg-[#17181d] text-white"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
            <motion.div className="pointer-events-none absolute inset-0" style={{ background: bg }} aria-hidden />

            {/* header */}
            <div className="relative flex items-center justify-between px-4 pt-4">
              <button onClick={() => (step === 'pick' ? setStep('feel') : onClose())} aria-label={step === 'pick' ? 'Back' : 'Close'} className="grid size-11 place-items-center rounded-full bg-black/25 ring-1 ring-white/10">
                {step === 'pick' ? <ChevronLeft className="size-5" /> : <X className="size-5" />}
              </button>
              {step !== 'done' ? (
                <div className="flex rounded-full bg-black/25 p-1 ring-1 ring-white/10" role="tablist" aria-label="What are you logging?">
                  {(['moment', 'day'] as const).map((k) => (
                    <button key={k} role="tab" aria-selected={kind === k} onClick={() => setKind(k)} className={cx('rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors', kind === k ? 'bg-white text-[#17181d]' : 'text-white/80')}>
                      {k === 'moment' ? 'Right now' : 'Today overall'}
                    </button>
                  ))}
                </div>
              ) : <p className="text-[15px] font-semibold">{kind === 'day' ? 'Daily mood' : 'Logged'}</p>}
              <button onClick={onClose} aria-label="Close" className={cx('grid size-11 place-items-center rounded-full bg-black/25 ring-1 ring-white/10', step === 'feel' && 'invisible')}><X className="size-5" /></button>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {step === 'feel' && (
                <motion.div key="feel" className="relative flex flex-1 flex-col px-6 pb-[max(env(safe-area-inset-bottom),20px)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }}>
                  <h2 className="mt-7 text-center font-sans text-[26px] font-semibold leading-8 text-white/90">{kind === 'day' ? 'Choose how you’ve felt overall today' : 'Choose how you feel right now'}</h2>
                  <div className="flex flex-1 items-center justify-center"><MoodShape v={v} size={270} /></div>
                  <AnimatePresence mode="wait">
                    <motion.p key={level} initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }} transition={{ duration: 0.2 }}
                      className="text-center text-[32px] font-semibold text-white/90" aria-live="polite">{MOOD_LEVELS[level]}</motion.p>
                  </AnimatePresence>
                  <div className="mt-7">
                    {/* owner 2026-11-24: "the slider sometimes doesn't work" — iOS only drags a native range from its tiny thumb.
                        The whole track now follows the finger (tap to jump, drag anywhere); a visually hidden range stays for keyboards and screen readers. */}
                    <div ref={track} className="relative h-12 cursor-pointer touch-none select-none" aria-hidden
                      onPointerDown={(e) => { snap.current?.stop(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); dragging.current = true; fromPointer(e.clientX) }}
                      onPointerMove={(e) => { if (dragging.current) fromPointer(e.clientX) }}
                      onPointerUp={() => { dragging.current = false; settle() }} onPointerCancel={() => { dragging.current = false; settle() }}>
                      <div className="absolute inset-x-0 top-1/2 h-12 -translate-y-1/2 rounded-full bg-white/12 ring-1 ring-white/10" />
                      <motion.span className="pointer-events-none absolute top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_6px_18px_rgba(0,0,0,.35)]" style={{ left: thumbLeft }} />
                    </div>
                    <input type="range" min={0} max={6} step={1} value={level} onChange={(e) => { const x = Number(e.target.value); v.set(x); setLevel(x) }}
                      aria-label="How pleasant or unpleasant" aria-valuetext={MOOD_LEVELS[level]} className="sr-only" />
                    <div className="mt-2 flex justify-between px-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-white/60"><span>Very unpleasant</span><span>Very pleasant</span></div>
                  </div>
                  <motion.button onClick={() => { buzz(8); setStep('pick') }} style={{ background: btn, color: ink }} whileTap={{ scale: 0.98 }}
                    className="mt-7 h-14 w-full rounded-full text-[17px] font-semibold shadow-[0_10px_30px_rgba(0,0,0,.35)] ring-1 ring-white/20">Next</motion.button>
                </motion.div>
              )}

              {step === 'pick' && (
                <motion.div key="pick" className="relative flex min-h-0 flex-1 flex-col" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex flex-col items-center px-6 pt-3">
                    <MoodShape v={level} size={96} spin={false} />
                    <p className="mt-1 text-[13px] font-semibold uppercase tracking-[0.1em] text-white/70">{MOOD_LEVELS[level]}</p>
                    <h2 className="mt-1 text-center font-sans text-[24px] font-semibold text-white/90">What describes this feeling?</h2>
                    <p className="text-[13px] text-white/60">Pick up to 3</p>
                    <label className="mt-3 flex h-11 w-full items-center gap-2 rounded-full bg-white/12 px-4 ring-1 ring-white/10 focus-within:ring-white/40">
                      <Search className="size-4 text-white/60" aria-hidden />
                      <input value={q} onChange={(e) => setQ(e.target.value.slice(0, 30))} placeholder="Search any feeling" aria-label="Search any feeling" className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-white/50" />
                    </label>
                  </div>
                  <div className="no-scrollbar mt-4 min-h-0 flex-1 overflow-y-auto px-5 pb-4">
                    {/* owner 2026-11-24: our own feeling faces on each choice */}
                    <div className="grid grid-cols-3 gap-2.5">
                      {list.map((m, k) => {
                        const on = picks.includes(m.key as Emotion)
                        return (
                          <motion.button key={m.key} type="button" aria-pressed={on} aria-label={m.label} onClick={() => toggle(m.key as Emotion)}
                            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: on ? 1.03 : 1 }} transition={{ delay: Math.min(k, 14) * 0.02, type: 'spring', stiffness: 400, damping: 24 }}
                            className={cx('relative flex flex-col items-center gap-1.5 rounded-[22px] px-1 pb-2.5 pt-3 ring-1 transition-colors', on ? 'bg-white ring-white' : 'bg-white/10 ring-white/15')}>
                            <MoodImg mood={m.key as Emotion} size={48} />
                            <span className={cx('text-[14px] font-semibold', on ? 'text-[#17181d]' : 'text-white')}>{m.label}</span>
                            {on && <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-[#17181d] text-white"><Check className="size-3" strokeWidth={3.2} /></span>}
                          </motion.button>
                        )
                      })}
                    </div>
                    {!list.length && <p className="mt-6 text-center text-[14px] text-white/60">No feeling called “{q}”. Try another word.</p>}
                  </div>
                  <div className="relative px-5 pb-[max(env(safe-area-inset-bottom),14px)] pt-3">
                    {picks.length > 0 && <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 300))} rows={2} placeholder="Add a note (optional)" aria-label="Add a note"
                      className="mb-2 w-full resize-none rounded-[18px] bg-white/10 p-3 text-[15px] text-white outline-none ring-1 ring-white/10 placeholder:text-white/50 focus:ring-white/40" />}
                    <motion.button disabled={!picks.length} onClick={save} style={{ background: picks.length ? moodColor(level) : 'rgba(255,255,255,.12)', color: picks.length ? moodInk(level) : undefined }} whileTap={{ scale: 0.98 }}
                      className="h-14 w-full rounded-full text-[17px] font-semibold text-white ring-1 ring-white/20 disabled:text-white/50">{picks.length ? 'Log it' : 'Pick a feeling'}</motion.button>
                  </div>
                </motion.div>
              )}

              {step === 'done' && (
                <motion.div key="done" className="relative flex flex-1 flex-col px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-6" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 22 }}>
                  <div className="flex flex-1 flex-col items-center justify-center rounded-[30px] bg-black/25 px-6 py-8 text-center ring-1 ring-white/10">
                    <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/70">{kind === 'day' ? 'Daily mood' : 'Right now'}</p>
                    <div className="my-4"><MoodShape v={level} size={190} /></div>
                    <p className="text-[28px] font-semibold leading-8">{names}</p>
                    <p className="mt-1 text-[17px] text-white/85">{kind === 'day' ? `${dayWord(level)} day` : MOOD_LEVELS[level]}</p>
                    {note.trim() && <p className="mt-4 max-w-[300px] text-[14px] italic leading-5 text-white/70">“{note.trim()}”</p>}
                  </div>
                  <motion.button onClick={() => { toast('Saved to your journal 🌿'); onClose() }} style={{ background: moodColor(level), color: moodInk(level) }} whileTap={{ scale: 0.98 }}
                    className="mt-5 h-14 w-full rounded-full text-[17px] font-semibold ring-1 ring-white/20">Done</motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
