'use client'
/**
 * @module   client-ui
 * @owner    CLIENT
 * Purpose:  Brand & illustration pieces — logo kit (v5 D-45, vector), 3D owl mascot (illustration only), mood characters,
 *           avatar, product art, petal burst.
 */
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, type CSSProperties } from 'react'
import type { Emotion, Product } from '@/lib/data'
import { MOOD_FACES, moodOf } from '@/lib/data'
import { MoodFace } from './mood-face'
import { cx } from './ui'
import { BP } from '@/lib/asset'

// v5 (HUB 2026-11-20): every logo renders the official vector kit (design/brand/kit → public/img/brand). Never re-typed,
// recoloured or redrawn; navy on light, the white version on navy or photos (DESIGN-SYSTEM §1).
const KIT = { horizontal: 5913 / 2072, stacked: 2492 / 3320, mark: 1, wordmark: 2492 / 904 } as const
type LogoKind = keyof typeof KIT
const kitSrc = (kind: LogoKind, white?: boolean) => `${BP}/img/brand/${kind === 'mark' ? 'bewise-mark' : kind === 'wordmark' ? 'bewise-wordmark' : `bewise-logo-${kind}`}${white ? '-white' : ''}.svg`

/** The owl mark only (min 24 px). Decorative by default — pass `label` when it stands alone as the brand. */
export function LogoMark({ size = 40, white, label }: { size?: number; white?: boolean; label?: string }) {
  return <img src={kitSrc('mark', white)} width={size} height={size} alt={label ?? ''} aria-hidden={label ? undefined : true} className="shrink-0 select-none" draggable={false} />
}
/** Horizontal lock-up: 32 px high in the client header (min 28 px). */
export function Logo({ white, height = 32, className }: { white?: boolean; height?: number; compact?: boolean; className?: string }) {
  return <img src={kitSrc('horizontal', white)} height={height} width={Math.round(height * KIT.horizontal)} style={{ height, width: 'auto' }} alt="BeWise · Holistic Wellness" className={cx('shrink-0 select-none', className)} draggable={false} />
}
/** Stacked lock-up for splash, welcome and the Jitendra Khimlani story. */
export function LogoStacked({ white, height = 96, className }: { white?: boolean; height?: number; className?: string }) {
  return <img src={kitSrc('stacked', white)} height={height} width={Math.round(height * KIT.stacked)} style={{ height, width: 'auto' }} alt="BeWise · Holistic Wellness" className={cx('shrink-0 select-none', className)} draggable={false} />
}

export type Pose = 'wave' | 'bottle' | 'read' | 'sleep'
const poseSize: Record<Pose, [number, number]> = { wave: [294, 640], bottle: [226, 640], read: [261, 640], sleep: [351, 640] }
export function Mascot({ pose = 'wave', height = 160, float = true, className, priority, style }: { pose?: Pose; height?: number; float?: boolean; className?: string; priority?: boolean; style?: CSSProperties }) {
  const [w, h] = poseSize[pose]
  return (
    <div className={cx('relative', float && 'animate-floaty', className)} style={{ height, width: (w / h) * height, ...style }}>
      <img src={`${BP}/img/owl-${pose}.webp`} alt="" aria-hidden width={w} height={h} draggable={false}
        loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : 'low'}
        className="h-full w-full object-contain drop-shadow-[0_14px_18px_rgba(23,33,74,.18)]" />
    </div>
  )
}

export function MoodImg({ mood, size = 56, className, ink }: { mood: Emotion; size?: number; className?: string; ink?: string }) {
  const m = moodOf(mood)
  return <MoodFace color={m.color} face={MOOD_FACES[m.key] ?? MOOD_FACES.calm} size={size} className={className} ink={ink} />
}

/** Tap-to-log mood character with squash bounce + sparkle burst. */
export function MoodButton({ mood, size = 58, selected, onPick, burstKey, showLabel = true, fluid }: { mood: Emotion; size?: number; selected?: boolean; onPick: () => void; burstKey?: number; showLabel?: boolean; fluid?: boolean }) {
  const m = moodOf(mood)
  return (
    <motion.button type="button" aria-pressed={selected} aria-label={m.label} onClick={onPick} whileTap={{ scale: 0.86 }}
      className={cx('relative flex min-w-0 flex-col items-center gap-1.5 rounded-[20px] px-0.5 pb-1 pt-1.5 outline-none', selected && 'ring-2 ring-navy ring-offset-2 ring-offset-white')}>
      <motion.span key={burstKey} className={cx('relative block', fluid && 'w-full')} style={fluid ? { maxWidth: size } : undefined}
        animate={burstKey ? { scale: [1, 1.22, 0.92, 1.04, 1], rotate: [0, -6, 4, 0] } : undefined} transition={{ duration: 0.6, ease: 'easeOut' }}>
        <MoodImg mood={mood} size={size} className={fluid ? 'h-auto w-full' : undefined} />
        <AnimatePresence>{burstKey ? <Burst key={burstKey} color={m.color} /> : null}</AnimatePresence>
      </motion.span>
      {showLabel && <span className={cx('font-semibold text-navy', fluid ? 'max-w-full truncate text-[12px]' : 'text-[13px]')}>{m.label}</span>}
    </motion.button>
  )
}

function Burst({ color }: { color: string }) {
  const parts = useMemo(() => Array.from({ length: 10 }, (_, i) => ({ a: (i / 10) * Math.PI * 2, d: 34 + (i % 3) * 10, s: 6 + (i % 2) * 4 })), [])
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden>
      {parts.map((p, i) => (
        <motion.span key={i} className="absolute left-1/2 top-1/2 rounded-full"
          style={{ width: p.s, height: p.s, background: i % 3 === 0 ? '#243D91' : color, marginLeft: -p.s / 2, marginTop: -p.s / 2 }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }} animate={{ x: Math.cos(p.a) * p.d, y: Math.sin(p.a) * p.d, opacity: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
      ))}
    </span>
  )
}

export function Avatar({ photo, name, size = 44, ring }: { photo?: string; name?: string; size?: number; ring?: boolean }) {
  const initials = (name || '?').split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span className={cx('relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-sky-100 font-bold text-navy', ring && 'ring-2 ring-white shadow-[var(--shadow-card)]')}
      style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {photo ? <img src={photo} alt="" className="h-full w-full object-cover" draggable={false} /> : initials}
    </span>
  )
}

type ArtInput = Pick<Product, 'art' | 'tint' | 'name'> & { color?: string; wide?: boolean }
/** Product photo on a soft BeWise tile: tint gradient, a glow in the product's colour, floor shadow. */
/**
 * Premium podium "stage" behind each product (Higgsfield, HUB 2026-11-19 — design/assets/v4/stages), picked by the
 * product's tint hue so colours stay on-brand. Same stages as bewiseglobal.in.
 */
const STAGE_MASK = 'linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent)'
export function stageFor(tint: string): string {
  const h = tint.replace('#', ''), r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
  let hue = 0
  if (d) hue = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
  hue = (hue * 60 + 360) % 360
  const n = hue < 15 || hue >= 290 ? 'blush' : hue < 62 ? 'butter' : hue < 150 ? 'sage' : hue < 200 ? 'aqua' : hue < 238 ? 'periwinkle' : 'lavender'
  return `${BP}/img/stages/${n}.webp`
}

export function ProductArt({ product, size = 'md', className }: { product: ArtInput; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const h = size === 'lg' ? 'h-[240px]' : size === 'md' ? 'h-[150px]' : 'h-[84px]'
  // the product stands on the podium (podium top ≈ 84% down the square stage)
  const img = product.wide ? 'bottom-[15%] w-[62%]' : size === 'sm' ? 'bottom-[15%] h-[58%]' : 'bottom-[15%] h-[66%]'
  return (
    <div className={cx('relative overflow-hidden rounded-[24px]', h, className)} style={{ background: `linear-gradient(155deg, ${product.tint[0]}, ${product.tint[1]})` }}>
      <img src={stageFor(product.tint[0])} alt="" aria-hidden loading="lazy" decoding="async" draggable={false}
        className="absolute left-1/2 top-0 aspect-square h-full max-w-none -translate-x-1/2 object-cover"
        style={{ maskImage: STAGE_MASK, WebkitMaskImage: STAGE_MASK }} />
      <img src={`${BP}/img/${product.art}.webp`} alt={product.name} loading="lazy" decoding="async" draggable={false}
        className={cx('absolute left-1/2 -translate-x-1/2 object-contain drop-shadow-[0_12px_12px_rgba(23,33,74,.2)]', img)} />
    </div>
  )
}

/** Soft petal confetti for success moments. */
export function Petals({ count = 26 }: { count?: number }) {
  const ps = useMemo(() => Array.from({ length: count }, (_, i) => ({
    x: (i / count) * 100 + (i % 3) * 3, delay: (i % 7) * 0.08, dur: 2.4 + (i % 5) * 0.35, rot: (i % 2 ? 1 : -1) * (120 + i * 9),
    c: ['#E06A8E', '#4C6FD6', '#F2A93B', '#2FA39A', '#8E74DB', '#EE7F5F'][i % 6], s: 8 + (i % 4) * 3,
  })), [count])
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {ps.map((p, i) => (
        <motion.span key={i} className="absolute top-0 block rounded-[60%_10%_60%_10%]" style={{ left: `${p.x}%`, width: p.s, height: p.s * 1.3, background: p.c }}
          initial={{ y: -40, opacity: 0, rotate: 0 }} animate={{ y: '105vh', opacity: [0, 1, 1, 0], rotate: p.rot, x: [0, 18, -14, 10] }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'easeIn' }} />
      ))}
    </div>
  )
}
