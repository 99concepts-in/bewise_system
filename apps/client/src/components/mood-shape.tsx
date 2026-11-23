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

export function MoodShape({ v, size = 260, spin = true }: { v: MotionValue<number> | number; size?: number; spin?: boolean }) {
  const id = useId().replace(/:/g, '')
  const still = useReducedMotion()
  const local = useMotionValue(typeof v === 'number' ? v : v.get())
  useEffect(() => { if (typeof v === 'number') local.set(v) }, [v, local])
  const mv = typeof v === 'number' ? local : v
  const outer = useTransform(mv, (x) => shapePath(x, 100, 0))
  const mid = useTransform(mv, (x) => shapePath(x, 76, 0))
  const inner = useTransform(mv, (x) => shapePath(x, 46, 0))
  const ghost = useTransform(mv, (x) => shapePath(x, 108, Math.PI / 16))
  const c = useTransform(mv, (x) => moodColor(x))
  const c60 = useTransform(mv, (x) => moodColor(x, 0.6))
  const c30 = useTransform(mv, (x) => moodColor(x, 0.28))
  return (
    <motion.div className="relative" style={{ width: size, height: size, ['--c' as string]: c, ['--c60' as string]: c60, ['--c30' as string]: c30 }} aria-hidden
      animate={still || !spin ? undefined : { scale: [1, 1.025, 1] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="-125 -125 250 250" className="size-full overflow-visible">
        <defs>
          <radialGradient id={`f${id}`} cx="0.42" cy="0.36" r="0.75">
            <stop offset="0" stopColor="#ffffff" stopOpacity={0.55} />
            <stop offset="0.45" style={{ stopColor: 'var(--c60)' }} />
            <stop offset="1" style={{ stopColor: 'var(--c30)' }} />
          </radialGradient>
          <radialGradient id={`i${id}`} cx="0.4" cy="0.35" r="0.8">
            <stop offset="0" stopColor="#ffffff" stopOpacity={0.85} />
            <stop offset="0.5" style={{ stopColor: 'var(--c)' }} />
            <stop offset="1" style={{ stopColor: 'var(--c60)' }} />
          </radialGradient>
          <linearGradient id={`s${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity={0.95} />
            <stop offset="0.5" style={{ stopColor: 'var(--c)' }} />
            <stop offset="1" stopColor="#ffffff" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <motion.g animate={still || !spin ? undefined : { rotate: 360 }} transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}>
          <motion.path d={ghost} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={1} />
          <motion.path d={outer} fill={`url(#f${id})`} stroke={`url(#s${id})`} strokeWidth={1.6} />
          <motion.path d={mid} fill={`url(#f${id})`} stroke={`url(#s${id})`} strokeWidth={1.4} opacity={0.95} />
          <motion.path d={inner} fill={`url(#i${id})`} stroke="rgba(255,255,255,.6)" strokeWidth={1} />
          <motion.circle r={5} style={{ fill: 'var(--c)' }} stroke="rgba(255,255,255,.7)" strokeWidth={1} />
        </motion.g>
      </svg>
    </motion.div>
  )
}

/** readable text on the mood colour: dark on light (green, gold), white otherwise */
export function moodInk(v: number) {
  const m = moodColor(v).match(/\d+/g)!.map(Number).map((c) => { const x = c / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4) })
  return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2] > 0.36 ? '#15161a' : '#ffffff'
}
