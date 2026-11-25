'use client'
/**
 * @module brand @owner CLIENT
 * Owner 2026-11-23: a "verified" badge next to Jitendra Khimlani's name (certified therapist). A scalloped rosette in BeWise
 * blue with a white tick and a soft shine that passes over it now and then.
 */
import { motion, useReducedMotion } from 'motion/react'
import { useId } from 'react'
import { cx } from './ui'

// 12-scallop rosette around (12,12): arcs bulging outward between points on a circle
const PATH = (() => {
  const n = 12, R = 9.4, pts = Array.from({ length: n }, (_, i) => { const a = (2 * Math.PI * i) / n - Math.PI / 2; return [12 + R * Math.cos(a), 12 + R * Math.sin(a)] })
  return `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)} ` + pts.map((_, i) => { const q = pts[(i + 1) % n]; return `A2.75,2.75 0 0 1 ${q[0].toFixed(2)},${q[1].toFixed(2)}` }).join(' ') + ' Z'
})()

export function Verified({ size = 18, className, label = 'Verified: Certified Bach Flower Therapist' }: { size?: number; className?: string; label?: string }) {
  const id = useId().replace(/:/g, '')
  const still = useReducedMotion()
  return (
    <span className={cx('relative inline-grid shrink-0 place-items-center align-[-0.12em]', className)} style={{ width: size, height: size }} role="img" aria-label={label} title={label}>
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
        <defs>
          <linearGradient id={`v${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4C8DF6" /><stop offset="1" stopColor="#1F5BD8" /></linearGradient>
          <clipPath id={`c${id}`}><path d={PATH} /></clipPath>
        </defs>
        <path d={PATH} fill={`url(#v${id})`} />
        <g clipPath={`url(#c${id})`}>
          {!still && <motion.rect x={-14} y={-4} width={7} height={32} fill="#fff" opacity={0.45} transform="rotate(20 12 12)"
            animate={{ x: [-14, 34] }} transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }} />}
        </g>
        <path d="M7.4 12.3l3.1 3.1 6.1-6.6" fill="none" stroke="#fff" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}
