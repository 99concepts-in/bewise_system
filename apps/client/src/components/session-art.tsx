'use client'
/**
 * @module   client-home
 * @owner    CLIENT
 * @screens  CL-08 Home — "Next session" + "Your first consultation" art (owner 2026-11-18: replace flat clip-art)
 * v5 (HUB 2026-11-20): flat sky/navy tile, Fraunces date, marigold mode badge.
 */
import { motion } from 'motion/react'
import { BP } from '@/lib/asset'

/** Tilted calendar tile with the session date, Jitu Bhaiya's photo badge and a mode marker. */
export function SessionDateArt({ startsAt, mode }: { startsAt: string; mode: 'online' | 'in_person' }) {
  const d = new Date(startsAt)
  const month = d.toLocaleDateString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' }).toUpperCase()
  const day = d.toLocaleDateString('en-IN', { day: 'numeric', timeZone: 'Asia/Kolkata' })
  const wk = d.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' })
  return (
    <div className="relative h-[108px] w-[108px] shrink-0" aria-hidden>
      <span className="absolute inset-3 rounded-[26px] bg-sky-100" />
      <motion.div className="absolute left-1 top-2 h-[90px] w-[80px] overflow-hidden rounded-[20px] bg-white shadow-[0_10px_22px_rgba(23,33,74,.14)] ring-1 ring-line"
        style={{ rotate: -6 }} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 18 }}>
        <div className="bg-navy py-1 text-center text-[10px] font-bold tracking-[0.14em] text-white">{month}</div>
        <div className="text-center font-display text-[30px] font-semibold leading-[38px] text-ink tnum">{day}</div>
        <div className="-mt-1 text-center text-[11px] font-semibold text-muted">{wk}</div>
      </motion.div>
      <motion.img src={`${BP}/img/jitu.webp`} alt="" className="absolute -right-1 bottom-0 size-10 rounded-full object-cover ring-[3px] ring-white shadow-[0_6px_12px_rgba(23,33,74,.2)]"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 320, damping: 16 }} />
      <span className="absolute left-[70px] top-0 grid size-7 place-items-center rounded-full bg-marigold text-ink ring-[3px] ring-white shadow-[0_4px_10px_rgba(23,33,74,.15)]">
        {mode === 'online'
          ? <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><rect x="3" y="6" width="13" height="12" rx="3" /><path d="m16 10 5-3v10l-5-3" /></svg>
          : <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor"><path d="M12 2C8 2 5 5 5 8.8 5 14 12 22 12 22s7-8 7-13.2C19 5 16 2 12 2Zm0 9.3a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2Z" /></svg>}
      </span>
    </div>
  )
}

/** Jitu Bhaiya in a soft ring with a flower accent — for the "first consultation" invitation. */
export function ConsultInviteArt() {
  return (
    <div className="pointer-events-none absolute bottom-3 right-3 h-[124px] w-[120px]" aria-hidden>
      <motion.span className="absolute right-1 top-0 size-[112px] rounded-full border-2 border-white/90" animate={{ scale: [1, 1.05, 1], opacity: [0.9, 0.5, 0.9] }} transition={{ duration: 4, repeat: Infinity }} />
      <div className="absolute right-3 top-2 size-[96px] overflow-hidden rounded-full bg-white p-1 shadow-[0_14px_26px_rgba(23,33,74,.2)]">
        <img src={`${BP}/img/jitu-portrait.webp`} alt="" className="h-full w-full rounded-full object-cover object-[50%_18%]" />
      </div>
      <motion.img src={`${BP}/img/f-rose.webp`} alt="" className="absolute -bottom-1 left-0 h-[50px]" animate={{ rotate: [0, 6, 0] }} transition={{ duration: 6, repeat: Infinity }} />
    </div>
  )
}
