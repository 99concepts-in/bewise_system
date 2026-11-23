'use client'
/**
 * @module   remedies-ux
 * @owner    CLIENT
 * @screens  CL-08 Home blend card
 * Purpose:  Owner 2026-11-23: a replica of our own 30 ml remedy bottle (frosted glass, white dropper), without the label, that empties little by little.
 *           Layers: amber liquid (clipped to the inside of the glass by bottle-remedy-mask.png) under the
 *           photo-real bottle, which is multiplied on top so the glass, pipette and reflections show through.
 *           `level` is 0..1 (what is left).
 */
import { motion, useReducedMotion } from 'motion/react'
import { BP } from '@/lib/asset'

// inside of the glass, as % of the image height (measured from bottle-remedy.webp, 159×440: our 30 ml bottle, no label)
const FULL = 41.7, EMPTY = 93.4
const RATIO = 159 / 440

export function RemedyBottle({ level, height = 140, pulse = 0 }: { level: number; height?: number; pulse?: number }) {
  const still = useReducedMotion()
  const l = Math.max(0, Math.min(1, level))
  const top = l <= 0 ? 100 : EMPTY - Math.max(0.04, l) * (EMPTY - FULL)
  const mask = `url(${BP}/img/bottle-remedy-mask.png)`
  return (
    <div className="relative" style={{ height, width: height * RATIO }} role="img" aria-label={`Remedy bottle, about ${Math.round(l * 100)}% left`}>
      {/* liquid, clipped to the inside of the glass */}
      <div className="absolute inset-0" style={{ WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: '100% 100%', maskSize: '100% 100%' }} aria-hidden>
        <motion.div className="absolute inset-x-0 bottom-0" initial={false} animate={{ top: `${top}%` }}
          transition={still ? { duration: 0 } : { type: 'spring', stiffness: 50, damping: 14 }}>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#f6d184_0%,#eab45c_50%,#d9963f_100%)] opacity-90" />
          {/* glass light through the liquid */}
          <div className="absolute inset-y-0 left-[30%] w-[12%] bg-white/35 blur-[1.5px]" />
          <div className="absolute inset-y-0 right-[24%] w-[5%] bg-white/25" />
          {/* surface, seen slightly from above */}
          <div className="absolute inset-x-0 -top-[3px] h-[6px] rounded-[50%] bg-[#f8dc97]" />
          {pulse > 0 && !still && (
            <motion.span key={pulse} className="absolute left-1/2 -top-[3px] h-[6px] w-full -translate-x-1/2 rounded-[50%] border border-white/90"
              initial={{ scaleX: 0.2, opacity: 1 }} animate={{ scaleX: 1, opacity: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }} />
          )}
        </motion.div>
      </div>
      {/* the bottle photo, multiplied so its white background disappears and the glass sits over the liquid */}
      <img src={`${BP}/img/bottle-remedy.webp`} alt="" className="absolute inset-0 h-full w-full mix-blend-multiply" draggable={false} />
    </div>
  )
}
