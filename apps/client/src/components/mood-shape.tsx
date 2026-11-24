'use client'
/**
 * @module journal @owner CLIENT
 * Owner 2026-11-23: the mood visual. Three translucent, nested shapes that morph with how pleasant a feeling is:
 * a spiky star (very unpleasant) → wavy → softer ripples → a calm circle (neutral) → soft five-lobed → rounded star →
 * a five-petal flower (very pleasant). Colours move purple → blue → icy blue → green → gold → orange.
 * `v` is 0..6 (continuous while sliding). Works with a MotionValue (live) or a plain number (static badge).
 */
import { motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useId } from 'react'

export const MOOD_LEVELS = ['Very unpleasant', 'Unpleasant', 'Slightly unpleasant', 'Neutral', 'Slightly pleasant', 'Pleasant', 'Very pleasant']
export const MOOD_COLORS = ['#8B5CF6', '#5B7BEA', '#6F9BD6', '#5E9DB5', '#8BCB4E', '#E9BE3E', '#F0904A']

// per level: lobes n, sharpness k (k>2 spiky, 2 smooth wave, <2 rounded petals), amplitude a
const SHAPE = [
  { n: 8, k: 3, a: 0.3 }, { n: 8, k: 2, a: 0.12 }, { n: 10, k: 2, a: 0.05 }, { n: 1, k: 2, a: 0 },
  { n: 5, k: 2, a: 0.07 }, { n: 5, k: 1.3, a: 0.14 }, { n: 5, k: 0.55, a: 0.2 },
]
const lobe = (t: number, s: { n: number; k: number; a: number }) => s.a * (2 * Math.pow(Math.abs(Math.cos((s.n * t) / 2)), s.k) - 1)

/** closed path of the shape at level v (0..6), radius R, rotated by rot (radians) */
export function shapePath(v: number, R: number, rot = 0) {
  const i = Math.max(0, Math.min(5, Math.floor(v))), f = Math.min(1, Math.max(0, v - i))
  const A = SHAPE[i], B = SHAPE[i + 1]
  const N = 180
  let d = ''
  for (let j = 0; j <= N; j++) {
    const t = (j / N) * Math.PI * 2
    const r = R * (1 + (1 - f) * lobe(t - rot, A) + f * lobe(t - rot, B))
    const x = r * Math.sin(t), y = -r * Math.cos(t)
    d += `${j ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`
  }
  return d + 'Z'
}

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
export function moodColor(v: number, alpha = 1) {
  const i = Math.max(0, Math.min(5, Math.floor(v))), f = Math.min(1, Math.max(0, v - i))
  const a = hex(MOOD_COLORS[i]), b = hex(MOOD_COLORS[i + 1])
  const c = a.map((x, k) => Math.round(x + (b[k] - x) * f))
  return alpha === 1 ? `rgb(${c.join(',')})` : `rgba(${c.join(',')},${alpha})`
}

/**
 * Owner 2026-11-24: our own flower instead of abstract shapes. A bud that opens into a bloom as the feeling gets more pleasant:
 * petals grow, widen and round off; a second, inner layer of petals unfolds; golden stamens appear in the centre.
 * Always alive: petals sway, the flower breathes. Colours follow MOOD_COLORS (cool and muted → warm and bright).
 */
const PETALS = 5
const petal = (L: number, W: number, round: number) => {
  // round 0 = pointed tip, 1 = soft rounded tip with a slight heart notch (wild rose)
  const t = -L, c1 = -L * 0.35, c2 = -L * (0.86 + 0.1 * round)
  const notch = round * L * 0.07
  return `M0,0 C${W},${c1} ${W * (0.75 + 0.35 * round)},${c2} ${W * 0.22 * round},${t + notch * 0.2} Q0,${t + notch} ${-W * 0.22 * round},${t + notch * 0.2} C${-W * (0.75 + 0.35 * round)},${c2} ${-W},${c1} 0,0Z`
}

export function MoodShape({ v, size = 260, spin = true }: { v: MotionValue<number> | number; size?: number; spin?: boolean }) {
  const id = useId().replace(/:/g, '')
  const still = useReducedMotion()
  const local = useMotionValue(typeof v === 'number' ? v : v.get())
  useEffect(() => { if (typeof v === 'number') local.set(v) }, [v, local])
  const mv = typeof v === 'number' ? local : v
  const o = useTransform(mv, (x) => Math.max(0, Math.min(1, x / 6)))      // openness 0 bud → 1 full bloom
  const outer = useTransform(o, (k) => petal(38 + k * 56, 12 + k * 30, k))
  const inner = useTransform(o, (k) => petal(22 + k * 40, 8 + k * 20, Math.max(0, k - 0.15)))
  const innerScale = useTransform(o, (k) => 0.55 + k * 0.45)
  const budTwist = useTransform(o, (k) => (1 - k) * 28)                   // closed buds wrap round each other
  const coreR = useTransform(o, (k) => 7 + k * 9)
  const stamen = useTransform(o, (k) => Math.max(0, (k - 0.35) / 0.65))   // stamens fade in as it opens
  const c = useTransform(mv, (x) => moodColor(x))
  const c70 = useTransform(mv, (x) => moodColor(x, 0.7))
  const c35 = useTransform(mv, (x) => moodColor(x, 0.35))
  const live = !still && spin
  return (
    <motion.div className="relative" style={{ width: size, height: size, ['--c' as string]: c, ['--c70' as string]: c70, ['--c35' as string]: c35 }} aria-hidden
      animate={live ? { scale: [1, 1.035, 1] } : undefined} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}>
      <motion.span className="absolute inset-[12%] rounded-full blur-2xl" style={{ background: 'var(--c35)' }} />
      <svg viewBox="-110 -110 220 220" className="relative size-full overflow-visible">
        <defs>
          <radialGradient id={`p${id}`} cx="0.5" cy="0.95" r="1" fx="0.5" fy="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity={0.9} />
            <stop offset="0.35" style={{ stopColor: 'var(--c)' }} />
            <stop offset="1" style={{ stopColor: 'var(--c70)' }} />
          </radialGradient>
          <radialGradient id={`q${id}`} cx="0.5" cy="0.95" r="1" fx="0.5" fy="1">
            <stop offset="0" stopColor="#fff7e0" />
            <stop offset="0.6" style={{ stopColor: 'var(--c)' }} />
            <stop offset="1" style={{ stopColor: 'var(--c)' }} />
          </radialGradient>
        </defs>
        <motion.g animate={live ? { rotate: 360 } : undefined} transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}>
          {Array.from({ length: PETALS }, (_, i) => (
            <g key={`o${i}`} transform={`rotate(${(360 / PETALS) * i})`}>
              <motion.g style={{ rotate: budTwist, originX: '50%', originY: '100%' }} animate={live ? { scaleY: [1, 1.05, 1], skewX: [0, 2, 0] } : undefined} transition={{ duration: 3.2, delay: i * 0.25, repeat: Infinity, ease: 'easeInOut' }}>
                <motion.path d={outer} fill={`url(#p${id})`} stroke="rgba(255,255,255,.55)" strokeWidth={1} />
              </motion.g>
            </g>
          ))}
          <motion.g style={{ scale: innerScale }}>
            {Array.from({ length: PETALS }, (_, i) => (
              <g key={`i${i}`} transform={`rotate(${(360 / PETALS) * i + 36})`}>
                <motion.path d={inner} fill={`url(#q${id})`} stroke="rgba(255,255,255,.45)" strokeWidth={0.8} opacity={0.95} />
              </g>
            ))}
          </motion.g>
          <motion.g style={{ opacity: stamen }}>
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2, r = 14 + (i % 2) * 5
              return <g key={i}><line x1={0} y1={0} x2={Math.cos(a) * r} y2={Math.sin(a) * r} stroke="#f6d77a" strokeWidth={1.2} opacity={0.8} /><circle cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={2.2} fill="#f2b93b" /></g>
            })}
          </motion.g>
          <motion.circle r={coreR} fill="#fff4cf" stroke="rgba(255,255,255,.8)" strokeWidth={1} />
          <motion.circle r={useTransform(coreR, (r) => r * 0.55)} fill="#e9a93a" opacity={0.85} />
        </motion.g>
      </svg>
    </motion.div>
  )
}

/** Owner 2026-11-24: a constantly moving backdrop behind the flower: three soft glowing lights drifting and pollen floating up. */
export function LiveBackdrop({ v }: { v: MotionValue<number> }) {
  const still = useReducedMotion()
  const a = useTransform(v, (x) => moodColor(x, 0.55))
  const b = useTransform(v, (x) => moodColor(Math.min(6, x + 1), 0.4))
  const d = useTransform(v, (x) => moodColor(Math.max(0, x - 1), 0.35))
  const motes = Array.from({ length: 12 }, (_, i) => ({ left: (i * 53) % 100, size: 3 + (i % 4) * 1.5, dur: 9 + (i % 5) * 2.5, delay: (i * 0.9) % 9 }))
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {[{ c: a, l: '-10%', t: '5%', x: ['0%', '40%', '0%'], y: ['0%', '20%', '0%'], s: 'size-[70%]', d: 18 }, { c: b, l: '45%', t: '30%', x: ['0%', '-45%', '0%'], y: ['0%', '-35%', '0%'], s: 'size-[60%]', d: 22 }, { c: d, l: '5%', t: '55%', x: ['0%', '50%', '0%'], y: ['0%', '-25%', '0%'], s: 'size-[65%]', d: 26 }].map((o, k) => (
        <motion.span key={k} className={`absolute rounded-full blur-3xl will-change-transform ${o.s}`} style={{ background: o.c, left: o.l, top: o.t }}
          animate={still ? undefined : { x: o.x, y: o.y }} transition={{ duration: o.d, repeat: Infinity, ease: 'easeInOut' }} />
      ))}
      {!still && motes.map((m, i) => (
        <motion.span key={i} className="absolute rounded-full bg-white" style={{ left: `${m.left}%`, width: m.size, height: m.size, bottom: '-4%' }}
          animate={{ y: ['0vh', '-95vh'], opacity: [0, 0.7, 0], x: [0, i % 2 ? 18 : -18, 0] }} transition={{ duration: m.dur, delay: m.delay, repeat: Infinity, ease: 'linear' }} />
      ))}
    </div>
  )
}

/** readable text on the mood colour: dark on light (green, gold), white otherwise */
export function moodInk(v: number) {
  const m = moodColor(v).match(/\d+/g)!.map(Number).map((c) => { const x = c / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4) })
  return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2] > 0.36 ? '#15161a' : '#ffffff'
}
