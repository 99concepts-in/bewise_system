/**
 * @module   prototype/consultant-app
 * @owner    CONSULTANT
 * Purpose:  v5 "Blue Bloom" (HUB 2026-11-20, D-45) brand + art primitives: the official logo, Bach flower vectors,
 *           feeling chips in accent colours, mood circles. Every screen uses these, so the look stays identical.
 */
import { useState } from 'react'
import { BatteryLow, CloudRain, Flame, Heart, Leaf, Sun, Sunrise, Wind } from 'lucide-react'
import { flowers as FLOWER_FILES, feelings as FEELING_FILES } from 'virtual:art-index'
import { feelingIconId, feelingTone, flowerId, MOOD_TONE } from './tone'
import type { Mood } from '../data/types'

const FLOWER_SET = new Set(FLOWER_FILES)
const FEELING_SET = new Set(FEELING_FILES)

// ---------------------------------------------------------------- logo: the official kit, never redrawn (spec §1)
const LOGO_RATIO = { horizontal: 5913 / 2072, stacked: 2492 / 3320, mark: 1 }
export function Logo({ variant = 'horizontal', white, height = 28, className }: { variant?: keyof typeof LOGO_RATIO; white?: boolean; height?: number; className?: string }) {
  const file = variant === 'horizontal' ? 'bewise-logo-horizontal' : variant === 'stacked' ? 'bewise-logo-stacked' : 'bewise-mark'
  return (
    <img
      className={'logo' + (className ? ' ' + className : '')}
      src={`./brand/${file}${white ? '-white' : ''}.svg`}
      height={height} width={Math.round(height * LOGO_RATIO[variant])}
      alt="BeWise" decoding="async"
    />
  )
}

// ---------------------------------------------------------------- Bach flower vector, with a calm fallback
/**
 * Flower art by name. Files are known at build time, so a missing one never hits the network:
 * it shows a sky-100 circle with the initial instead (and an onError guard covers anything else).
 * `decorative` when the flower's name is already visible next to it (avoids reading the name twice).
 */
export function FlowerArt({ name, size, decorative, className }: { name: string; size?: number; decorative?: boolean; className?: string }) {
  const id = flowerId(name)
  const [broken, setBroken] = useState(false)
  const cls = 'flower-art' + (className ? ' ' + className : '')
  const style = size ? { width: size, height: size } : undefined
  if (!FLOWER_SET.has(id) || broken) {
    return <span className={cls + ' flower-ph'} style={style} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : name} aria-hidden={decorative || undefined}><span>{name.charAt(0)}</span></span>
  }
  return <img className={cls} style={style} src={`./img/flowers/${id}.svg`} alt={decorative ? '' : name} loading="lazy" decoding="async" onError={() => setBroken(true)} />
}

/** A few overlapping flower thumbnails (blend history, past sessions). */
export function FlowerStack({ flowers, max = 4, size = 28 }: { flowers: string[]; max?: number; size?: number }) {
  const shown = flowers.slice(0, max)
  const rest = flowers.length - shown.length
  return (
    <span className="fstack" role="img" aria-label={`Blend: ${flowers.join(', ')}`}>
      {shown.map((f) => <span key={f} className="fstack-i" style={{ width: size, height: size }}><FlowerArt name={f} decorative /></span>)}
      {rest > 0 && <span className="fstack-i fstack-more" style={{ width: size, height: size }}>+{rest}</span>}
    </span>
  )
}

/** Thumbnail + name, for a blend listed as text (session sheet, profile). */
export function FlowerChip({ name }: { name: string }) {
  return <span className="fchip"><FlowerArt name={name} decorative /><span>{name}</span></span>
}

// ---------------------------------------------------------------- feelings in accent colours (the label is always text)
export function FeelingChip({ name, icon = true, size }: { name: string; icon?: boolean; size?: 'sm' }) {
  const tone = feelingTone(name)
  const ic = feelingIconId(name)
  return (
    <span className={`feel tone-${tone}` + (size ? ' feel-sm' : '')}>
      {icon && FEELING_SET.has(ic)
        ? <i className="feel-ic" style={{ maskImage: `url(./img/feelings/${ic}.svg)`, WebkitMaskImage: `url(./img/feelings/${ic}.svg)` }} aria-hidden />
        : <i className="feel-dot" aria-hidden />}
      {name}
    </span>
  )
}

export function FeelingChips({ items, max = 3, size }: { items: string[]; max?: number; size?: 'sm' }) {
  if (!items.length) return null
  const shown = items.slice(0, max)
  return (
    <span className="feel-row">
      {shown.map((f) => <FeelingChip key={f} name={f} size={size} />)}
      {items.length > max && <span className="feel feel-more">+{items.length - max}</span>}
    </span>
  )
}

// ---------------------------------------------------------------- mood circle (journal), accent-500 fill + white line icon
const MOOD_ICON: Record<Mood, typeof Sun> = {
  calm: Leaf, joyful: Sun, grateful: Heart, hopeful: Sunrise, tired: BatteryLow, anxious: Wind, sad: CloudRain, irritated: Flame,
}
export function MoodCircle({ mood, size = 38 }: { mood: Mood; size?: number }) {
  const Icon = MOOD_ICON[mood]
  return (
    <span className={`mood-c tone-${MOOD_TONE[mood]}`} style={{ width: size, height: size }} role="img" aria-label={mood}>
      <Icon size={Math.round(size * 0.48)} strokeWidth={1.9} aria-hidden />
    </span>
  )
}
