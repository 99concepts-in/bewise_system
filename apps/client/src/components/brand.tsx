'use client'
/**
 * @module   client-ui
 * @owner    CLIENT
 * Purpose:  Brand & illustration pieces — logo lock-up (D-23), 3D owl mascot, 8 mood characters, avatar, product art, petal burst.
 */
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, type CSSProperties } from 'react'
import type { Emotion, Product } from '@/lib/data'
import { moodOf } from '@/lib/data'
import { cx } from './ui'
import { BP } from '@/lib/asset'

export function LogoMark({ size = 40, white }: { size?: number; white?: boolean }) {
  return <img src={white ? `${BP}/img/logo-mark-white.png` : `${BP}/img/logo-mark.png`} width={size} height={size} alt="" aria-hidden className="shrink-0" draggable={false} />
}
export function Logo({ white, compact }: { white?: boolean; compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5" aria-label="BeWise · Holistic Wellness">
      <LogoMark size={compact ? 36 : 42} white={white} />
      <div className={cx('leading-none', white ? 'text-white' : 'text-navy')}>
        <div className="text-[19px] font-extrabold tracking-[-0.02em]">BeWise</div>
        <div className={cx('mt-0.5 text-[11px] font-medium', white ? 'text-white/75' : 'text-muted')}>Holistic Wellness</div>
      </div>
    </div>
  )
}

export type Pose = 'wave' | 'bottle' | 'read' | 'sleep'
const poseSize: Record<Pose, [number, number]> = { wave: [294, 640], bottle: [226, 640], read: [261, 640], sleep: [351, 640] }
export function Mascot({ pose = 'wave', height = 160, float = true, className, priority, style }: { pose?: Pose; height?: number; float?: boolean; className?: string; priority?: boolean; style?: CSSProperties }) {
  const [w, h] = poseSize[pose]
  return (
    <div className={cx('relative', float && 'animate-floaty', className)} style={{ height, width: (w / h) * height, ...style }}>
      <img src={`${BP}/img/owl-${pose}.webp`} alt="" aria-hidden width={w} height={h} draggable={false}
        loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : 'low'}
        className="h-full w-full object-contain drop-shadow-[0_14px_18px_rgba(24,41,87,.18)]" />
    </div>
  )
}

export function MoodImg({ mood, size = 56, className }: { mood: Emotion; size?: number; className?: string }) {
  return <img src={`${BP}/img/mood-${mood}.webp`} alt="" aria-hidden width={size} height={size} draggable={false} loading="lazy" decoding="async"
    className={cx('object-contain drop-shadow-[0_6px_8px_rgba(24,41,87,.10)]', className)} style={{ width: size, height: size }} />
}

/** Tap-to-log mood character with squash bounce + sparkle burst. */
export function MoodButton({ mood, size = 58, selected, onPick, burstKey, showLabel = true }: { mood: Emotion; size?: number; selected?: boolean; onPick: () => void; burstKey?: number; showLabel?: boolean }) {
  const m = moodOf(mood)
  return (
    <motion.button type="button" aria-pressed={selected} aria-label={m.label} onClick={onPick} whileTap={{ scale: 0.86 }}
      className={cx('relative flex flex-col items-center gap-1.5 rounded-[22px] px-1 pb-1 pt-1.5 outline-none', selected && 'ring-2 ring-navy ring-offset-2 ring-offset-white')}>
      <motion.span key={burstKey} className="relative block"
        animate={burstKey ? { scale: [1, 1.22, 0.92, 1.04, 1], rotate: [0, -6, 4, 0] } : undefined} transition={{ duration: 0.6, ease: 'easeOut' }}>
        <MoodImg mood={mood} size={size} />
        <AnimatePresence>{burstKey ? <Burst key={burstKey} color={m.color} /> : null}</AnimatePresence>
      </motion.span>
      {showLabel && <span className="text-[13px] font-semibold text-navy">{m.label}</span>}
    </motion.button>
  )
}

function Burst({ color }: { color: string }) {
  const parts = useMemo(() => Array.from({ length: 10 }, (_, i) => ({ a: (i / 10) * Math.PI * 2, d: 34 + (i % 3) * 10, s: 6 + (i % 2) * 4 })), [])
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden>
      {parts.map((p, i) => (
        <motion.span key={i} className="absolute left-1/2 top-1/2 rounded-full"
          style={{ width: p.s, height: p.s, background: i % 3 === 0 ? '#182957' : color, marginLeft: -p.s / 2, marginTop: -p.s / 2 }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }} animate={{ x: Math.cos(p.a) * p.d, y: Math.sin(p.a) * p.d, opacity: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
      ))}
    </span>
  )
}

export function Avatar({ photo, name, size = 44, ring }: { photo?: string; name?: string; size?: number; ring?: boolean }) {
  const initials = (name || '?').split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span className={cx('relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#dce2f5,#dce7d9)] font-bold text-navy', ring && 'ring-[3px] ring-white shadow-[var(--shadow-card)]')}
      style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {photo ? <img src={photo} alt="" className="h-full w-full object-cover" draggable={false} /> : initials}
    </span>
  )
}

export function ProductArt({ product, size = 'md', className }: { product: Pick<Product, 'art' | 'accent' | 'tint' | 'name'>; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const h = size === 'lg' ? 'h-[240px]' : size === 'md' ? 'h-[150px]' : 'h-[84px]'
  return (
    <div className={cx('relative overflow-hidden rounded-[24px]', h, className)} style={{ background: `linear-gradient(150deg, ${product.tint[0]}, ${product.tint[1]})` }}>
      <span className="absolute -bottom-6 left-1/2 h-10 w-[70%] -translate-x-1/2 rounded-[50%] bg-[#182957]/10 blur-md" />
      {product.accent && size !== 'sm' && (
        <img src={`${BP}/img/${product.accent}.webp`} alt="" aria-hidden loading="lazy" decoding="async"
          className={cx('absolute object-contain opacity-95', size === 'lg' ? '-right-6 bottom-6 h-[150px]' : '-right-4 bottom-3 h-[84px]')} />
      )}
      <img src={`${BP}/img/${product.art}.webp`} alt={product.name} loading="lazy" decoding="async" draggable={false}
        className={cx('absolute left-1/2 -translate-x-1/2 object-contain drop-shadow-[0_12px_14px_rgba(24,41,87,.18)]', size === 'lg' ? 'bottom-4 h-[200px]' : size === 'md' ? 'bottom-3 h-[118px]' : 'bottom-1.5 h-[70px]')} />
    </div>
  )
}

/** Soft petal confetti for success moments. */
export function Petals({ count = 26 }: { count?: number }) {
  const ps = useMemo(() => Array.from({ length: count }, (_, i) => ({
    x: (i / count) * 100 + (i % 3) * 3, delay: (i % 7) * 0.08, dur: 2.4 + (i % 5) * 0.35, rot: (i % 2 ? 1 : -1) * (120 + i * 9),
    c: ['#F4C2C8', '#B9CBF2', '#F6DE8D', '#BFD8C2', '#D6CBEF', '#B89B64'][i % 6], s: 8 + (i % 4) * 3,
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
