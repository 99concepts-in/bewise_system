'use client'
/**
 * @module   client-ui
 * @owner    CLIENT
 * Purpose:  v5 "Blue Bloom" (HUB 2026-11-20, D-45) art primitives:
 *           - FlowerArt / FlowerTile — the realistic Bach flower vectors (public/img/flowers/<id>.svg, id = API bach_remedies.id)
 *           - FeelingIcon — the traced single-colour feeling line icons (public/img/feelings/<key>.svg) tinted via CSS mask
 *           Both fall back gracefully while a file is still missing.
 */
import { AlertCircle, Brain, CloudDrizzle, CloudLightning, CloudRain, Flame, Heart, HeartCrack, Leaf, Moon, Shuffle, Sun, Users, Waves, Zap, type LucideIcon } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { BP } from '@/lib/asset'
import type { FeelingKey } from '@/lib/feelings'
import { cx } from './ui'

/** "White Chestnut" → "white-chestnut", "Star of Bethlehem" → "star-of-bethlehem", "Rescue Remedy" → "rescue-remedy". */
export const flowerId = (name: string) => name.trim().toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Flower vector at its natural aspect; falls back to a soft sky-100 circle with the initial. */
export function FlowerArt({ name, className, style, decorative }: { name: string; className?: string; style?: CSSProperties; decorative?: boolean }) {
  const [bad, setBad] = useState(false)
  const id = flowerId(name)
  useEffect(() => setBad(false), [id])
  if (bad) {
    return (
      <span role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : name} aria-hidden={decorative || undefined}
        className={cx('grid aspect-square place-items-center rounded-full bg-sky-100 font-display text-[1.6em] font-semibold text-navy', className)} style={style}>
        {name.trim()[0]?.toUpperCase()}
      </span>
    )
  }
  return <img src={`${BP}/img/flowers/${id}.svg`} alt={decorative ? '' : name} aria-hidden={decorative || undefined} loading="lazy" decoding="async" draggable={false}
    onError={() => setBad(true)} className={cx('select-none object-contain', className)} style={style} />
}

/** Spec §5 flower tile: square, sky-50 ground, flower at 80 %, Fraunces 15 px name below. */
export function FlowerTile({ name, onClick, size, className }: { name: string; onClick?: () => void; size?: number; className?: string }) {
  const body = (
    <>
      <span className="grid aspect-square w-full place-items-center rounded-[20px] bg-sky-50">
        <FlowerArt name={name} decorative className="h-[80%] w-[80%] text-[22px]" />
      </span>
      <span className="mt-1.5 block text-center font-display text-[15px] font-semibold leading-[18px] text-ink">{name}</span>
    </>
  )
  const cls = cx('block min-w-0 text-left', className)
  if (onClick) return <button type="button" onClick={onClick} className={cls} style={size ? { width: size } : undefined} aria-label={`About ${name}`}>{body}</button>
  return <span className={cls} style={size ? { width: size } : undefined}>{body}</span>
}

const FALLBACK: Record<string, LucideIcon> = {
  fear: AlertCircle, worry: CloudDrizzle, anxiety: Waves, overthinking: Brain, anger: Flame, irritability: Zap, sadness: CloudRain,
  loneliness: Users, guilt: HeartCrack, 'low-confidence': CloudDrizzle, overwhelm: CloudLightning, indecision: Shuffle, exhaustion: Moon,
  grief: HeartCrack, shock: Zap, jealousy: Flame, hopelessness: CloudRain, restlessness: Waves, sun: Sun, leaf: Leaf, heart: Heart,
}
const LUCIDE_ONLY = new Set(['sun', 'leaf', 'heart'])
const status = new Map<string, boolean>() // src → loaded ok (checked once per session)

/** Single-colour line icon in `currentColor` (white on accent circles, ink on white). */
export function FeelingIcon({ icon, size = 40, className, strokeWidth = 1.75 }: { icon: FeelingKey | 'sun' | 'leaf' | 'heart'; size?: number; className?: string; strokeWidth?: number }) {
  const src = `${BP}/img/feelings/${icon}.svg`
  const [ok, setOk] = useState(() => !LUCIDE_ONLY.has(icon) && status.get(src) !== false)
  useEffect(() => {
    if (LUCIDE_ONLY.has(icon)) { setOk(false); return }
    if (status.has(src)) { setOk(status.get(src)!); return }
    const img = new Image()
    img.onload = () => { status.set(src, true); setOk(true) }
    img.onerror = () => { status.set(src, false); setOk(false) }
    img.src = src
  }, [icon, src])
  if (!ok) {
    const L = FALLBACK[icon] ?? Heart
    return <L aria-hidden className={className} style={{ width: size * 0.62, height: size * 0.62 }} strokeWidth={strokeWidth} />
  }
  return <span aria-hidden className={cx('mask-icon', className)} style={{ width: size, height: size, ['--icon' as string]: `url("${src}")` } as CSSProperties} />
}
