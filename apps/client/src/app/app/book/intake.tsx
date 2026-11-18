'use client'
/**
 * @module   intake (UI)
 * @owner    CLIENT builds UI · CONSULTANT owns data, mapping, AI (D-35/D-36/D-37)
 * @screens  IN-01…IN-11 (spec docs/specs/client/C3-intake-IN-01-IN-12.md), IN-12 check-in, safety card (D-38)
 * @sensitive intake answers
 */
import { AnimatePresence, motion } from 'motion/react'
import { Heart, Lock, Mic, Phone, Sparkles, Square, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MoodImg } from '@/components/brand'
import { Chip, Segmented, Toggle, buzz, cx, spring } from '@/components/ui'
import { BODY_AREAS, FEELINGS, GOAL_FEELINGS, HELPLINES, LIFE_CHANGES, NUANCE, type Emotion } from '@/lib/data'
import type { IntakeAnswers } from '@/lib/store'

type P = { a: IntakeAnswers; set: (p: Partial<IntakeAnswers>) => void }
const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

export function StepTitle({ lead, em, sub }: { lead: string; em: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h1 className="h-duo">{lead} <em>{em}</em></h1>
      {sub && <p className="mt-2 text-[15px] leading-6 text-muted">{sub}</p>}
    </div>
  )
}
function Card({ children, className }: { children: ReactNode; className?: string }) { return <div className={cx('card p-5', className)}>{children}</div> }
function Label({ children }: { children: ReactNode }) { return <p className="mb-3 text-[16px] font-bold text-navy">{children}</p> }

/** IN-01 — a guided breath before the questions (owner 2026-11-18). 4 s in · 2 s hold · 6 s out, looping. */
const BREATH = [{ t: 'Breathe in…', d: 4 }, { t: 'Hold', d: 2 }, { t: 'Breathe out…', d: 6 }] as const
export function IntakeIntro() {
  const [phase, setPhase] = useState(0)
  const [cycles, setCycles] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => { setPhase((p) => (p + 1) % 3); if (phase === 2) setCycles((c) => c + 1) }, BREATH[phase].d * 1000)
    return () => clearTimeout(t)
  }, [phase])
  const scale = phase === 0 ? 1 : phase === 1 ? 1 : 0.62
  const dur = BREATH[phase].d
  return (
    <div className="flex flex-col items-center pt-2 text-center">
      <motion.h1 className="h-duo text-[32px]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        Take a deep <em>breath</em>
      </motion.h1>
      <motion.p className="mt-2 max-w-[300px] text-[15px] leading-6 text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }}>
        Let your shoulders drop. There’s no rush here.
      </motion.p>

      <div className="relative mt-4 grid size-[min(300px,36dvh)] place-items-center" aria-hidden>
        {/* soft outer petals rotate slowly */}
        <motion.div className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}>
          {Array.from({ length: 6 }).map((_, k) => (
            <motion.span key={k} className="absolute left-1/2 top-1/2 block h-[46%] w-[30%] origin-[50%_100%] rounded-[50%] bg-[linear-gradient(180deg,rgba(185,203,242,.55),rgba(220,231,217,.25))] mix-blend-multiply"
              style={{ translateX: '-50%', translateY: '-100%', rotate: k * 60 }}
              animate={{ scaleY: phase === 2 ? 0.55 : 1, opacity: phase === 2 ? 0.45 : 0.9 }} transition={{ duration: dur, ease: [0.45, 0, 0.55, 1] }} />
          ))}
        </motion.div>
        {/* breathing orb */}
        <motion.div className="absolute size-[62%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff,#dce2f5_55%,#c9d6f2)] shadow-[0_20px_60px_rgba(94,127,184,.35)]"
          initial={{ scale: 0.62 }} animate={{ scale }} transition={{ duration: dur, ease: [0.45, 0, 0.55, 1] }} />
        <motion.div className="absolute size-[62%] rounded-full border-2 border-white/80" initial={{ scale: 0.62, opacity: 0.6 }}
          animate={{ scale: phase === 2 ? 0.7 : 1.18, opacity: phase === 1 ? 0.9 : 0.35 }} transition={{ duration: dur, ease: [0.45, 0, 0.55, 1] }} />
        <AnimatePresence mode="wait">
          <motion.p key={phase} className="relative text-[20px] font-bold text-navy" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.6 }}>
            {BREATH[phase].t}
          </motion.p>
        </AnimatePresence>
      </div>
      <p className="sr-only" aria-live="polite">{BREATH[phase].t}</p>

      <motion.div className="mt-4 flex flex-wrap justify-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
        {['Private to Jitu Bhaiya', 'Everything optional', 'About 5 minutes'].map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[12px] font-semibold text-navy shadow-[var(--shadow-card)]"><span className="size-1.5 rounded-full bg-sage" />{t}</span>
        ))}
      </motion.div>
      <AnimatePresence>{cycles >= 1 && <motion.p className="mt-4 text-[13px] text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Ready when you are.</motion.p>}</AnimatePresence>
    </div>
  )
}

export function StepWho({ a, set }: P) {
  return (
    <div className="space-y-4">
      <StepTitle lead="Anything you’d like to" em="share?" sub="In your own words, or record a voice note. Optional — Jitu Bhaiya will read it before you meet." />
      <Card>
        <Label>In your own words</Label>
        <textarea value={a.onMind} onChange={(e) => set({ onMind: e.target.value.slice(0, 1000) })} rows={4} placeholder="Work has felt heavy lately, and I can’t switch off at night…"
          className="w-full resize-none rounded-[20px] bg-peri-50/70 p-4 text-[15px] leading-6 outline-none placeholder:text-soft focus:ring-2 focus:ring-navy" aria-label="What’s been on your mind" />
        <VoiceNote />
      </Card>
      <Card>
        <Label>For how long?</Label>
        <div className="grid grid-cols-4 gap-2">
          {(['Days', 'Weeks', 'Months', 'Years'] as const).map((d) => <Chip key={d} on={a.duration === d} onClick={() => set({ duration: d })} className="justify-center px-2">{d}</Chip>)}
        </div>
      </Card>
    </div>
  )
}

/** IN-02b voice note — MediaRecorder; preview keeps the clip on this device only. */
function VoiceNote() {
  const [state, setState] = useState<'idle' | 'rec' | 'done' | 'blocked'>('idle')
  const [secs, setSecs] = useState(0)
  const [url, setUrl] = useState<string>()
  const rec = useRef<MediaRecorder | null>(null)
  useEffect(() => { if (state !== 'rec') return; const t = setInterval(() => setSecs((s) => { if (s >= 119) rec.current?.stop(); return s + 1 }), 1000); return () => clearInterval(t) }, [state])
  const start = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true })
      const r = new MediaRecorder(s); const chunks: BlobPart[] = []
      r.ondataavailable = (e) => chunks.push(e.data)
      r.onstop = () => { s.getTracks().forEach((t) => t.stop()); setUrl(URL.createObjectURL(new Blob(chunks, { type: r.mimeType }))); setState('done') }
      rec.current = r; r.start(); setSecs(0); setState('rec'); buzz()
    } catch { setState('blocked') }
  }
  if (state === 'blocked') return <p className="mt-3 text-[13px] text-muted">Voice notes need microphone access — you can type instead.</p>
  return (
    <div className="mt-3 flex items-center gap-3">
      {state === 'rec' ? (
        <>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => rec.current?.stop()} className="grid size-11 place-items-center rounded-full bg-rose text-white" aria-label="Stop recording"><Square className="size-4 fill-current" /></motion.button>
          <div className="flex h-8 flex-1 items-center gap-[3px]" aria-hidden>
            {Array.from({ length: 26 }).map((_, i) => <motion.span key={i} className="w-[3px] rounded-full bg-navy" animate={{ height: [6, 8 + ((i * 7) % 20), 6] }} transition={{ duration: 0.6 + (i % 4) * 0.1, repeat: Infinity }} />)}
          </div>
          <span className="tnum text-[13px] font-semibold text-rose">0:{String(secs).padStart(2, '0')}</span>
        </>
      ) : state === 'done' && url ? (
        <>
          <audio src={url} controls className="h-10 flex-1" />
          <button aria-label="Delete voice note" onClick={() => { setUrl(undefined); setState('idle') }} className="grid size-10 place-items-center rounded-full bg-peri-50 text-navy"><Trash2 className="size-4" /></button>
        </>
      ) : (
        <button onClick={start} className="inline-flex h-11 items-center gap-2 rounded-full bg-peri-50 px-4 text-[14px] font-semibold text-navy"><Mic className="size-4" /> Record a voice note</button>
      )}
    </div>
  )
}

export function StepFeelings({ a, set }: P) {
  return (
    <div>
      <StepTitle lead="How have you been" em="feeling?" sub="Pick all that fit. You can explain more next." />
      <div className="flex flex-wrap gap-2">
        {FEELINGS.map((f, i) => (
          <motion.div key={f} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }}>
            <Chip on={a.feelings.includes(f)} onClick={() => set({ feelings: toggle(a.feelings, f) })}>{f}</Chip>
          </motion.div>
        ))}
      </div>
      {a.feelings.length > 6 && <p className="mt-4 text-[13px] text-muted">That’s a lot to carry. Pick the ones that feel strongest if you like.</p>}
    </div>
  )
}

export function StepNuance({ a, set }: P) {
  const list = a.feelings.filter((f) => NUANCE[f])
  return (
    <div className="space-y-4">
      <StepTitle lead="Tell us a little" em="more" />
      {list.map((f, idx) => {
        const v = a.nuance[f] ?? { statements: [] }
        const upd = (p: Partial<typeof v>) => set({ nuance: { ...a.nuance, [f]: { ...v, ...p } } })
        return (
          <motion.div key={f} className="card p-5" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}>
            <p className="text-[18px] font-extrabold text-navy">{f} <span className="font-bold text-soft">— which feels closest?</span></p>
            <div className="mt-3 space-y-2" role="group" aria-label={`${f} statements`}>
              {NUANCE[f].map((s) => {
                const on = v.statements.includes(s)
                return (
                  <button key={s} role="checkbox" aria-checked={on} onClick={() => { buzz(5); upd({ statements: toggle(v.statements, s) }) }}
                    className={cx('flex w-full items-center gap-3 rounded-[18px] px-3 py-3 text-left text-[14px] transition-colors', on ? 'bg-peri-100 font-semibold text-navy' : 'bg-[#f7f8fb] text-ink')}>
                    <span className={cx('grid size-6 shrink-0 place-items-center rounded-full border-2 transition', on ? 'border-navy bg-navy' : 'border-[#c6cbd9]')}>
                      {on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="size-2.5 rounded-full bg-white" />}
                    </span>{s}
                  </button>
                )
              })}
            </div>
            <p className="mb-2 mt-4 text-[14px] font-bold text-navy">Intensity</p>
            <Segmented value={v.intensity} onChange={(intensity) => upd({ intensity })} options={(['Mild', 'Moderate', 'Strong'] as const).map((x) => ({ value: x, label: x }))} />
          </motion.div>
        )
      })}
      {list.length === 0 && <p className="text-[15px] text-muted">Nothing more needed here — tap Continue.</p>}
    </div>
  )
}

const FRONT: Record<string, [number, number, number, number]> = { Head: [60, 22, 17, 19], Neck: [60, 46, 9, 6], Shoulders: [60, 58, 34, 8], Chest: [60, 76, 20, 12], Stomach: [60, 102, 17, 12], Joints: [60, 176, 24, 8] }
const BACK: Record<string, [number, number, number, number]> = { 'Upper back': [60, 76, 22, 14], 'Lower back': [60, 106, 18, 11] }
function Figure({ regions, on, toggleArea, label }: { regions: Record<string, [number, number, number, number]>; on: string[]; toggleArea: (s: string) => void; label: string }) {
  return (
    <svg viewBox="0 0 120 220" className="h-[210px] w-auto" role="group" aria-label={label}>
      <defs><linearGradient id={`body-${label}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#dbe1f6" /><stop offset="1" stopColor="#c9d2ef" /></linearGradient></defs>
      <g fill={`url(#body-${label})`}>
        <circle cx="60" cy="24" r="17" /><rect x="53" y="38" width="14" height="12" rx="6" />
        <path d="M30 56c0-6 6-10 14-10h32c8 0 14 4 14 10l6 62c1 6-8 8-9 2l-6-46-2 40H41l-2-40-6 46c-1 6-10 4-9-2Z" />
        <path d="M43 116h34l-3 92c0 6-10 6-10 0l-4-62-4 62c0 6-10 6-10 0Z" />
      </g>
      {Object.entries(regions).map(([k, [cx_, cy, rx, ry]]) => {
        const sel = on.includes(k)
        return (
          <g key={k} role="checkbox" aria-checked={sel} aria-label={k} tabIndex={0} onClick={() => toggleArea(k)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleArea(k)} className="cursor-pointer outline-none">
            <motion.ellipse cx={cx_} cy={cy} rx={rx} ry={ry} fill="#f08a7e" initial={false} animate={{ opacity: sel ? 0.75 : 0, scale: sel ? 1 : 0.6 }} style={{ filter: 'blur(3px)', transformOrigin: `${cx_}px ${cy}px` }} />
            <ellipse cx={cx_} cy={cy} rx={rx} ry={ry} fill="transparent" />
          </g>
        )
      })}
    </svg>
  )
}
export function StepBody({ a, set }: P) {
  const tog = (s: string) => { buzz(5); set({ body: toggle(a.body, s) }) }
  return (
    <div className="space-y-4">
      <StepTitle lead="Any physical" em="discomfort?" />
      <Segmented value={a.bodyAny === undefined ? undefined : a.bodyAny ? 'yes' : 'no'} onChange={(v) => set({ bodyAny: v === 'yes', ...(v === 'no' ? { body: [], bodyTypes: [] } : {}) })} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
      <AnimatePresence>
        {a.bodyAny && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="card p-4">
            <div>
              <div className="flex justify-center gap-6"><Figure label="Front" regions={FRONT} on={a.body} toggleArea={tog} /><Figure label="Back" regions={BACK} on={a.body} toggleArea={tog} /></div>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {BODY_AREAS.map((b) => <Chip key={b} on={a.body.includes(b)} onClick={() => set({ body: toggle(a.body, b) })} className="min-h-9 px-3 text-[13px]">{b}</Chip>)}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {['Pain', 'Stiffness', 'Tension'].map((t) => <Chip key={t} on={a.bodyTypes.includes(t)} onClick={() => set({ bodyTypes: toggle(a.bodyTypes, t) })} className="justify-center px-2">{t}</Chip>)}
            </div>
            <p className="mt-4 text-center text-[13px] text-muted">We don’t diagnose or treat medical conditions — please keep seeing your doctor.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="flex items-baseline justify-between"><p className="text-[18px] font-extrabold text-navy">{label} <span className="text-soft">{value}/5</span></p></div>
      <input type="range" min={1} max={5} step={1} value={value} onChange={(e) => { buzz(4); onChange(Number(e.target.value)) }} aria-label={label}
        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-peri-100 accent-navy [&::-webkit-slider-thumb]:size-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-navy [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
        style={{ background: `linear-gradient(90deg,#182957 ${(value - 1) * 25}%,#dce2f5 ${(value - 1) * 25}%)` }} />
    </div>
  )
}
const SLEEP = ['Very poor', 'Poor', 'Okay', 'Good', 'Very good'] as const
export function StepSleep({ a, set }: P) {
  return (
    <div className="space-y-4">
      <StepTitle lead="Sleep &" em="energy" />
      <Card>
        <Label>How well do you sleep?</Label>
        {/* simple 5-step scale (owner 2026-11-18) — bars grow with quality */}
        <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Sleep quality">
          {SLEEP.map((label, i) => {
            const v = (i + 1) as 1 | 2 | 3 | 4 | 5
            const on = a.sleepQuality === v
            return (
              <motion.button key={label} type="button" role="radio" aria-checked={on} whileTap={{ scale: 0.92 }} onClick={() => { buzz(6); set({ sleepQuality: v }) }}
                className={cx('flex flex-col items-center gap-2 rounded-[18px] px-1 pb-2.5 pt-3 transition-colors', on ? 'bg-navy text-white shadow-[0_6px_16px_rgba(24,41,87,.25)]' : 'bg-peri-50/80 text-navy')}>
                <span className="flex h-7 items-end gap-[3px]" aria-hidden>
                  {[0, 1, 2, 3, 4].map((k) => (
                    <span key={k} className={cx('w-[4px] rounded-full', k <= i ? (on ? 'bg-white' : 'bg-navy') : (on ? 'bg-white/30' : 'bg-[#cfd5e5]'))} style={{ height: 8 + k * 5 }} />
                  ))}
                </span>
                <span className="text-center text-[11.5px] font-semibold leading-tight">{label}</span>
              </motion.button>
            )
          })}
        </div>
      </Card>
      <Card>
        <Label>Hours a night</Label>
        <div className="grid grid-cols-4 gap-2">{['< 5', '5 – 6', '7 – 8', '8+'].map((h) => <Chip key={h} on={a.hours === h} onClick={() => set({ hours: h })} className="justify-center px-1">{h}</Chip>)}</div>
        <div className="mt-4 flex items-center justify-between"><span className="text-[15px] font-semibold text-navy">Waking at night?</span><Segmented className="w-44" value={a.wakes === undefined ? undefined : a.wakes ? 'y' : 'n'} onChange={(v) => set({ wakes: v === 'y' })} options={[{ value: 'n', label: 'No' }, { value: 'y', label: 'Yes' }]} /></div>
      </Card>
      <Card className="space-y-6">
        <Slider label="Energy" value={a.energy} onChange={(energy) => set({ energy })} />
        <Slider label="Stress" value={a.stress} onChange={(stress) => set({ stress })} />
      </Card>
    </div>
  )
}

export function StepLife({ a, set }: P) {
  return (
    <div className="space-y-4">
      <StepTitle lead="Anything changing" em="in life?" />
      <div className="grid grid-cols-2 gap-2.5">
        {[...LIFE_CHANGES, { label: 'Nothing major', mood: 'tired' as Emotion }].map((l, i) => {
          const on = a.life.includes(l.label)
          const pick = () => { buzz(5); set({ life: l.label === 'Nothing major' ? (on ? [] : ['Nothing major']) : toggle(a.life.filter((x) => x !== 'Nothing major'), l.label) }) }
          return (
            <motion.button key={l.label} role="checkbox" aria-checked={on} onClick={pick} whileTap={{ scale: 0.96 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={cx('flex min-h-[64px] items-center gap-2.5 rounded-[22px] p-3 text-left text-[14px] font-semibold transition-colors', on ? 'bg-navy text-white' : 'bg-white text-navy shadow-[var(--shadow-card)]', l.label === 'Nothing major' && 'col-span-2')}>
              <MoodImg mood={l.mood} size={36} />{l.label}
            </motion.button>
          )
        })}
      </div>
      <input value={a.lifeOther} onChange={(e) => set({ lifeOther: e.target.value.slice(0, 300) })} placeholder="Anything else you’d like to share" aria-label="Anything else you’d like to share"
        className="h-14 w-full rounded-[22px] bg-white px-5 text-[15px] shadow-[var(--shadow-card)] outline-none placeholder:text-soft focus:ring-2 focus:ring-navy" />
    </div>
  )
}

function YesNo({ label, hint, value, onChange, children }: { label: string; hint?: string; value?: boolean; onChange: (v: boolean) => void; children?: ReactNode }) {
  return (
    <div className="py-3.5">
      <div className="flex items-center gap-3">
        <div className="flex-1"><p className="text-[15px] font-bold leading-5 text-navy">{label}</p>{hint && <p className="mt-0.5 text-[12px] text-muted">{hint}</p>}</div>
        <Segmented className="w-[132px] shrink-0 [&>button]:h-10 [&>button]:text-[14px]" value={value === undefined ? undefined : value ? 'y' : 'n'} onChange={(v) => onChange(v === 'y')} options={[{ value: 'n', label: 'No' }, { value: 'y', label: 'Yes' }]} />
      </div>
      <AnimatePresence>{value && children ? <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">{children}</motion.div> : null}</AnimatePresence>
    </div>
  )
}
const small = 'mt-2 h-11 w-full rounded-full bg-peri-50 px-4 text-[14px] outline-none focus:ring-2 focus:ring-navy'
export function StepSafety({ a, set }: P) {
  const s = a.safety, up = (p: Partial<typeof s>) => set({ safety: { ...s, ...p } })
  return (
    <div>
      <StepTitle lead="For your" em="safety" sub="Helps us prepare your remedy and suggest products safely." />
      <p className="mb-3 flex items-center gap-2 rounded-[18px] bg-sage-100/80 px-4 py-3 text-[14px] font-semibold text-sage-text">
        <span aria-hidden>🌿</span> All BeWise remedy blends are alcohol-free.
      </p>
      <div className="card divide-y divide-line px-5">
        <YesNo label="Seeing a doctor or therapist?" value={s.doctor} onChange={(doctor) => up({ doctor })} />
        <YesNo label="Taking any medicines?" value={s.medicines} onChange={(medicines) => up({ medicines })}>
          <input className={small} placeholder="Which ones? e.g. thyroid tablet" value={s.medicinesText} onChange={(e) => up({ medicinesText: e.target.value })} aria-label="Medicines" />
        </YesNo>
        <YesNo label="Pregnant or breastfeeding?" value={s.pregnant} onChange={(pregnant) => up({ pregnant })} />
        <YesNo label="Allergies or sensitive skin?" value={s.allergies} onChange={(allergies) => up({ allergies })}>
          <input className={small} placeholder="e.g. lavender, citrus" value={s.allergiesText} onChange={(e) => up({ allergiesText: e.target.value })} aria-label="Allergies" />
        </YesNo>
      </div>
    </div>
  )
}

export function SafetyCard() {
  return (
    <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring}
      className="rounded-[28px] bg-[linear-gradient(135deg,#e9edfa,#dce2f5)] p-5" role="region" aria-label="Support">
      <div className="flex items-start gap-3">
        <motion.span animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 1.6, repeat: Infinity }} className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-navy"><Heart className="size-5" /></motion.span>
        <div><p className="text-[18px] font-extrabold text-navy">You’re not alone.</p><p className="text-[14px] leading-5 text-muted">Talk to someone now — free and confidential.</p></div>
      </div>
      <div className="mt-4 space-y-2">
        {HELPLINES.map((h) => (
          <a key={h.number} href={`tel:${h.number}`} className="flex items-center justify-between rounded-[20px] bg-white px-4 py-3 shadow-[var(--shadow-card)]">
            <span><span className="block text-[16px] font-extrabold text-navy">{h.name} · {h.number}</span><span className="text-[12px] text-muted">{h.note}</span></span>
            <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-navy px-4 text-[14px] font-semibold text-white"><Phone className="size-4" /> Call</span>
          </a>
        ))}
      </div>
    </motion.div>
  )
}

export function StepGentle({ a, set }: P) {
  return (
    <div className="space-y-5">
      <StepTitle lead="One gentle" em="question" sub="Lately, have you had thoughts of harming yourself, or that life isn’t worth living?" />
      <Segmented value={a.selfHarm} onChange={(selfHarm) => set({ selfHarm })} options={(['No', 'Sometimes', 'Often'] as const).map((x) => ({ value: x, label: x }))} />
      <AnimatePresence>
        {a.selfHarm && a.selfHarm !== 'No' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <SafetyCard />
            <p className="px-2 text-[14px] text-muted">Jitu Bhaiya will be gently informed before your session. You can keep booking whenever you’re ready.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function StepGoals({ a, set }: P) {
  return (
    <div className="space-y-4">
      <StepTitle lead="How would you" em="like to feel?" />
      <div className="card grid grid-cols-2 gap-2.5 p-4">
        {GOAL_FEELINGS.map((g) => <Chip key={g} on={a.goals.includes(g)} onClick={() => set({ goals: toggle(a.goals, g) })} className="justify-center">{g}</Chip>)}
      </div>
      <div className="card p-5">
        <p className="mb-2 text-[14px] text-muted">In your own words —</p>
        <input value={a.goalText} onChange={(e) => set({ goalText: e.target.value.slice(0, 200) })} placeholder="Able to switch off and sleep well" aria-label="Your goal in your own words"
          className="h-12 w-full rounded-full bg-peri-50 px-4 text-[15px] outline-none placeholder:text-soft focus:ring-2 focus:ring-navy" />
      </div>
    </div>
  )
}

export function StepReview({ a, set, edit }: P & { edit: (step: string) => void }) {
  const rows = [
    { k: 'who', icon: '💭', t: 'On your mind', d: [a.onMind.slice(0, 48) + (a.onMind.length > 48 ? '…' : ''), a.duration?.toLowerCase()].filter(Boolean).join(' · ') },
    { k: 'feelings', icon: '💗', t: 'Feelings', d: Object.values(a.nuance).flatMap((n) => n.statements).slice(0, 3).join(' · ') || a.feelings.join(' · ') },
    { k: 'body', icon: '🌿', t: 'Body', d: a.bodyAny === undefined ? '' : a.bodyAny ? a.body.join(', ').toLowerCase() : 'nothing noted' },
    { k: 'sleep', icon: '🌙', t: 'Sleep', d: a.hours || a.sleepQuality ? [a.sleepQuality && SLEEP[a.sleepQuality - 1].toLowerCase(), a.hours && `${a.hours} h`, `energy ${a.energy}/5`, `stress ${a.stress}/5`].filter(Boolean).join(' · ') : '' },
    { k: 'safety', icon: '🛡️', t: 'Safety', d: [a.safety.allergies && a.safety.allergiesText && `${a.safety.allergiesText} allergy`, a.safety.pregnant && 'pregnant'].filter(Boolean).join(' · ') || 'nothing to flag' },
    { k: 'goals', icon: '✨', t: 'You’d like to feel', d: [...a.goals, a.goalText].filter(Boolean).join(' · ').toLowerCase() || '—' },
  ]
  return (
    <div className="space-y-3">
      <StepTitle lead="Your" em="answers" />
      {rows.map((r, i) => (
        <motion.div key={r.k} className="card flex items-center gap-3 p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-peri-50 text-[18px]" aria-hidden>{r.icon}</span>
          <div className="min-w-0 flex-1"><p className="text-[15px] font-bold text-navy">{r.t}</p><p className="truncate text-[13px] text-muted">{r.d && r.d !== '—' ? r.d : 'Skipped'}</p></div>
          <button onClick={() => edit(r.k)} className="text-[14px] font-semibold text-navy underline underline-offset-4">Edit</button>
        </motion.div>
      ))}
      <div className="card divide-y divide-line px-5">
        <div className="flex items-center gap-3 py-4"><Lock className="size-5 text-navy" /><span className="flex-1 text-[15px] font-semibold text-navy">Share with my consultant</span><Toggle label="Share with my consultant" on onChange={() => {}} /></div>
        <div className="flex items-center gap-3 py-4"><Sparkles className="size-5 text-navy" /><span className="flex-1 text-[15px] font-semibold text-navy">Let AI prepare a private summary for Jitu Bhaiya</span><Toggle label="AI summary" on={a.consentAi} onChange={(consentAi) => set({ consentAi })} /></div>
      </div>
      <p className="px-2 text-[12px] text-muted">Sharing is needed so Jitu Bhaiya can prepare. The AI summary is optional and only he sees it.</p>
    </div>
  )
}

// ---------- IN-12 follow-up check-in ----------
export type Checkin = { now?: Emotion; changes: Record<string, 'Better' | 'Same' | 'Harder'>; news: string; drops?: string }
export function CheckinNow({ c, set }: { c: Checkin; set: (p: Partial<Checkin>) => void }) {
  return (
    <div>
      <StepTitle lead="How are you" em="now?" sub="A 2-minute check-in before your follow-up." />
      <div className="card grid grid-cols-4 gap-y-3 p-4">
        {(['calm', 'joyful', 'grateful', 'hopeful', 'tired', 'anxious', 'sad', 'irritated'] as Emotion[]).map((m) => (
          <motion.button key={m} whileTap={{ scale: 0.88 }} aria-pressed={c.now === m} onClick={() => set({ now: m })} className={cx('flex flex-col items-center gap-1 rounded-[18px] p-1.5', c.now === m && 'ring-2 ring-navy')}>
            <MoodImg mood={m} size={52} /><span className="text-[12px] font-semibold capitalize text-navy">{m}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
export function CheckinChanges({ c, set, feelings }: { c: Checkin; set: (p: Partial<Checkin>) => void; feelings: string[] }) {
  const list = feelings.length ? feelings : ['Worry', 'Sleep', 'Energy']
  return (
    <div className="space-y-3">
      <StepTitle lead="Since we last" em="met" />
      {list.map((f) => (
        <div key={f} className="card p-4">
          <p className="mb-3 text-[16px] font-bold text-navy">{f}</p>
          <Segmented value={c.changes[f]} onChange={(v) => set({ changes: { ...c.changes, [f]: v } })} options={(['Better', 'Same', 'Harder'] as const).map((x) => ({ value: x, label: x }))} />
        </div>
      ))}
    </div>
  )
}
export function CheckinNews({ c, set }: { c: Checkin; set: (p: Partial<Checkin>) => void }) {
  return (
    <div className="space-y-4">
      <StepTitle lead="Anything" em="new?" />
      <textarea value={c.news} onChange={(e) => set({ news: e.target.value.slice(0, 800) })} rows={4} placeholder="Optional — anything you’d like Jitu Bhaiya to know" aria-label="Anything new"
        className="card w-full resize-none p-5 text-[15px] outline-none placeholder:text-soft focus:ring-2 focus:ring-navy" />
      <div className="card p-5">
        <Label>I took my drops</Label>
        <div className="grid grid-cols-2 gap-2">{['Every day', 'Most days', 'Sometimes', 'Rarely'].map((d) => <Chip key={d} on={c.drops === d} onClick={() => set({ drops: d })} className="justify-center">{d}</Chip>)}</div>
      </div>
    </div>
  )
}
