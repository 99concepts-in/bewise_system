'use client'
/**
 * @module   client-home
 * @owner    CLIENT
 * @screens  CL-08 Home — "Next session" + "Your first consultation" art (owner 2026-11-18: replace flat clip-art)
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
      <span className="absolute inset-2 rounded-[26px] bg-[radial-gradient(circle,#dce2f5,transparent_70%)]" />
      <motion.div className="absolute left-1 top-2 h-[90px] w-[80px] overflow-hidden rounded-[20px] bg-white shadow-[0_14px_26px_rgba(24,41,87,.18)] ring-1 ring-[#e7e9f1]"
        style={{ rotate: -6 }} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 18 }}>
        <div className="bg-[linear-gradient(90deg,#182957,#3c5596)] py-1 text-center text-[10px] font-extrabold tracking-[0.14em] text-white">{month}</div>
        <div className="text-center text-[30px] font-extrabold leading-[38px] tracking-[-0.03em] text-navy tnum">{day}</div>
        <div className="-mt-1 text-center text-[11px] font-semibold text-muted">{wk}</div>
      </motion.div>
      <motion.img src={`${BP}/img/jitu.webp`} alt="" className="absolute -right-1 bottom-0 size-10 rounded-full object-cover ring-[3px] ring-white shadow-[0_6px_12px_rgba(24,41,87,.2)]"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 320, damping: 16 }} />
      <span className="absolute left-[70px] top-0 grid size-7 place-items-center rounded-full bg-sage-100 text-sage-text ring-[3px] ring-white shadow-[0_4px_10px_rgba(24,41,87,.15)]">
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
      <div className="absolute right-3 top-2 size-[96px] overflow-hidden rounded-full bg-white p-1 shadow-[0_14px_26px_rgba(24,41,87,.2)]">
        <img src={`${BP}/img/jitu-portrait.webp`} alt="" className="h-full w-full rounded-full object-cover object-[50%_18%]" />
      </div>
      <motion.img src={`${BP}/img/f-rose.webp`} alt="" className="absolute -bottom-1 left-0 h-[50px]" animate={{ rotate: [0, 6, 0] }} transition={{ duration: 6, repeat: Infinity }} />
    </div>
  )
}
