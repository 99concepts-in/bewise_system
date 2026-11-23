'use client'
/** @module learn @owner CLIENT · Owner 2026-11-23: a colourful, animated way into the Learn tab (Home and My care). */
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { FlowerArt } from './flower'

const FLOWERS = [{ n: 'Mimulus', x: '62%', y: '-6%', s: 74, d: 0 }, { n: 'White Chestnut', x: '80%', y: '34%', s: 66, d: 0.6 }, { n: 'Wild Rose', x: '58%', y: '52%', s: 58, d: 1.2 }]

export function LearnCard() {
  const still = useReducedMotion()
  return (
    <Link href="/app/learn" className="relative block overflow-hidden rounded-[28px] p-5 text-white shadow-[var(--shadow-float)]" aria-label="Learn how Bach flowers can help you">
      <motion.span aria-hidden className="absolute inset-0 bg-[linear-gradient(120deg,#5b3fb8,#e0608a,#f2a93b,#2fa39a,#5b3fb8)] bg-[length:300%_300%]"
        animate={still ? undefined : { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} transition={{ duration: 14, repeat: Infinity, ease: 'linear' }} />
      <span aria-hidden className="absolute inset-0 bg-[radial-gradient(80%_60%_at_15%_0%,rgba(255,255,255,.28),transparent)]" />
      {FLOWERS.map((f) => (
        <motion.span key={f.n} aria-hidden className="absolute grid place-items-center rounded-full bg-white/85 shadow-[0_10px_24px_rgba(0,0,0,.15)]" style={{ left: f.x, top: f.y, width: f.s, height: f.s }}
          animate={still ? undefined : { y: [0, -8, 0], rotate: [0, 6, 0] }} transition={{ duration: 4.5, delay: f.d, repeat: Infinity, ease: 'easeInOut' }}>
          <FlowerArt name={f.n} decorative className="size-[80%]" />
        </motion.span>
      ))}
      <span className="relative block max-w-[58%]">
        <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-white/85">3-minute stories</span>
        <span className="mt-1 block font-display text-[22px] font-semibold leading-7">Learn how Bach flowers can help you</span>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-bold text-navy">Start reading <ArrowRight className="size-4" /></span>
      </span>
    </Link>
  )
}
