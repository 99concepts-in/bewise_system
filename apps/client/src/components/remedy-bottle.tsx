'use client'
/**
 * @module   remedies-ux
 * @owner    CLIENT
 * @screens  CL-08 Home blend card
 * Purpose:  Owner 2026-11-20: a remedy bottle that empties little by little as doses are checked in.
 *           `level` is 0..1 (what is left). The surface eases down on each dose and gently sways.
 */
import { motion, useReducedMotion } from 'motion/react'
import { useId } from 'react'
import { BP } from '@/lib/asset'

// body interior in viewBox units: liquid can sit between TOP (full) and BOTTOM (empty)
const TOP = 58, BOTTOM = 141

export function RemedyBottle({ level, className, pulse = 0 }: { level: number; className?: string; pulse?: number }) {
  const id = useId().replace(/:/g, '')
  const still = useReducedMotion()
  const l = Math.max(0, Math.min(1, level))
  // keep a sliver visible until the bottle is truly empty
  const y = l <= 0 ? BOTTOM + 2 : BOTTOM - Math.max(0.05, l) * (BOTTOM - TOP)
  return (
    <svg viewBox="0 0 100 150" className={className} role="img" aria-label={`Remedy bottle, about ${Math.round(l * 100)}% left`}>
      <defs>
        <clipPath id={`b${id}`}>
          <path d="M28 47h44c8 0 13 6 13 13v73c0 7-6 12-13 12H28c-7 0-13-5-13-12V60c0-7 5-13 13-13Z" />
        </clipPath>
        <linearGradient id={`l${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6d27c" />
          <stop offset="1" stopColor="#d4923a" />
        </linearGradient>
        <linearGradient id={`g${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".75" />
          <stop offset=".5" stopColor="#eef2fb" stopOpacity=".55" />
          <stop offset="1" stopColor="#dfe5f4" stopOpacity=".8" />
        </linearGradient>
      </defs>

      {/* dropper: bulb + collar */}
      <rect x="39" y="2" width="22" height="24" rx="11" fill="#243D91" />
      <rect x="34" y="23" width="32" height="13" rx="3.5" fill="#1b2c6b" />
      {/* neck */}
      <rect x="40" y="35" width="20" height="13" rx="2" fill={`url(#g${id})`} stroke="#c6d0e8" strokeWidth="1.5" />

      {/* glass body */}
      <path d="M28 47h44c8 0 13 6 13 13v73c0 7-6 12-13 12H28c-7 0-13-5-13-12V60c0-7 5-13 13-13Z" fill={`url(#g${id})`} />
      <g clipPath={`url(#b${id})`}>
        <motion.g initial={false} animate={{ y }} transition={still ? { duration: 0 } : { type: 'spring', stiffness: 60, damping: 14 }}>
          {/* wide wavy surface that sways sideways; liquid fills down to the base */}
          <motion.path
            d="M-60 0 q 12.5 -5 25 0 t 25 0 t 25 0 t 25 0 t 25 0 t 25 0 t 25 0 t 25 0 V 120 H -60 Z"
            fill={`url(#l${id})`}
            animate={still ? undefined : { x: [0, 50] }}
            transition={{ duration: 3.2, ease: 'linear', repeat: Infinity }}
          />
          {/* a ripple each time a dose is taken */}
          {pulse > 0 && !still && (
            <motion.ellipse key={pulse} cx="50" cy="0" rx="10" ry="2.4" fill="none" stroke="#fff" strokeWidth="1.4"
              initial={{ scale: 0.4, opacity: 0.9 }} animate={{ scale: 3, opacity: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }} />
          )}
        </motion.g>
      </g>
      <path d="M28 47h44c8 0 13 6 13 13v73c0 7-6 12-13 12H28c-7 0-13-5-13-12V60c0-7 5-13 13-13Z" fill="none" stroke="#c6d0e8" strokeWidth="2" />
      {/* glass shine */}
      <path d="M22 64c0-5 2-8 6-9" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity=".9" />
      <path d="M22 72v40" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" opacity=".55" />

      {/* label sits on the shoulder so the liquid level stays visible below it */}
      <rect x="25" y="58" width="50" height="19" rx="5" fill="#fff" opacity=".96" />
      <image href={`${BP}/img/brand/bewise-mark.svg`} x="28.5" y="61.5" width="12" height="12" />
      <text x="42" y="67" fontSize="5.6" fontWeight="800" fill="#243D91" fontFamily="inherit">Flower</text>
      <text x="42" y="73.5" fontSize="5.6" fontWeight="800" fill="#243D91" fontFamily="inherit">Remedy</text>
    </svg>
  )
}
