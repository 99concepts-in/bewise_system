'use client'
/**
 * @module   booking
 * @owner    CLIENT
 * @screens  CL-13 Online or in person — custom art (owner 2026-11-18: replace flat clip-art with something premium)
 * Purpose:  Code-drawn illustrations (crisp at any size, theme-aware on the selected navy card):
 *           v5 (HUB 2026-11-20): flower accents use the real Bach vectors.
 *           OnlineArt = tilted phone with Jitendra Khimlani on a video call · InPersonArt = soft map tile of Alkapuri with a pulsing pin.
 */
import { motion } from 'motion/react'
import { BP } from '@/lib/asset'
import { FlowerArt } from './flower'

export function OnlineArt({ on }: { on: boolean }) {
  return (
    <div className="pointer-events-none absolute -right-2 top-[8px] h-[156px] w-[150px]" aria-hidden>
      <motion.div className="absolute -right-3 top-0" animate={{ rotate: [0, 4, 0] }} transition={{ duration: 6, repeat: Infinity }}><FlowerArt name="Mimulus" decorative className="h-[92px] w-[92px]" /></motion.div>
      <motion.div className="absolute bottom-1 left-6 h-[148px] w-[84px] overflow-hidden rounded-[20px] bg-white p-[5px] shadow-[0_18px_30px_rgba(23,33,74,.28)]"
        style={{ rotate: -8 }} animate={{ y: [0, -5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
        <div className="relative h-full w-full overflow-hidden rounded-[15px] bg-[#e9edf8]">
          <img src={`${BP}/img/jitu.webp`} alt="" className="h-full w-full object-cover object-top" />
          <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-white/90 px-1.5 py-[2px] text-[8px] font-bold text-navy">
            <motion.span className="size-1.5 rounded-full bg-rose" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />Live
          </span>
          <span className="absolute bottom-6 right-1.5 h-[34px] w-[24px] rounded-[7px] bg-sky-100 ring-2 ring-white" />
          <span className="absolute inset-x-0 bottom-1.5 flex justify-center gap-1.5">
            <span className="size-3.5 rounded-full bg-white/90" /><span className="size-3.5 rounded-full bg-rose" /><span className="size-3.5 rounded-full bg-white/90" />
          </span>
        </div>
      </motion.div>
      <span className={`absolute bottom-0 left-4 h-3 w-24 rounded-[50%] blur-md ${on ? 'bg-black/30' : 'bg-navy/15'}`} />
    </div>
  )
}

export function InPersonArt({ on }: { on: boolean }) {
  return (
    <div className="pointer-events-none absolute -right-3 top-[14px] h-[140px] w-[160px]" aria-hidden>
      <motion.div className="absolute right-4 top-2 h-[118px] w-[132px] overflow-hidden rounded-[24px] shadow-[0_16px_30px_rgba(23,33,74,.22)] ring-4 ring-white"
        style={{ rotate: 6 }} animate={{ y: [0, -4, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}>
        <svg viewBox="0 0 132 118" className="h-full w-full">
          <rect width="132" height="118" fill="#eef1fb" />
          <path d="M-10 92 C 30 70, 60 110, 142 76 L142 118 L-10 118Z" fill="#E6EDFF" />
          <ellipse cx="30" cy="28" rx="26" ry="18" fill="#dce7d9" />
          <ellipse cx="108" cy="100" rx="22" ry="12" fill="#dce7d9" />
          <path d="M-5 58 C 40 50, 80 66, 140 44" stroke="#fff" strokeWidth="9" fill="none" strokeLinecap="round" />
          <path d="M70 -5 C 64 40, 82 80, 76 125" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d="M-5 20 L 140 30" stroke="#fff" strokeWidth="4" fill="none" opacity=".8" />
          <path d="M20 125 L 44 -5" stroke="#fff" strokeWidth="4" fill="none" opacity=".8" />
          <rect x="88" y="10" width="16" height="12" rx="3" fill="#fff" opacity=".9" /><rect x="96" y="66" width="14" height="10" rx="3" fill="#fff" opacity=".9" />
          <rect x="8" y="70" width="18" height="12" rx="3" fill="#fff" opacity=".9" />
        </svg>
        <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-bold text-navy shadow-sm">Alkapuri</span>
      </motion.div>
      {/* pin */}
      <div className="absolute left-[58px] top-[30px]">
        <motion.span className="absolute left-1/2 top-[27px] h-3 w-6 -translate-x-1/2 rounded-[50%] bg-navy/30" animate={{ scale: [0.6, 1.8], opacity: [0.6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }} />
        <motion.svg viewBox="0 0 24 32" className="relative h-9 w-7 drop-shadow-[0_6px_8px_rgba(23,33,74,.35)]" animate={{ y: [0, -4, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
          <path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.4 12 32 12 32s12-11.6 12-20.3C24 5.2 18.6 0 12 0Z" fill={on ? '#ffffff' : '#243D91'} />
          <circle cx="12" cy="11.5" r="4.6" fill={on ? '#243D91' : '#ffffff'} />
        </motion.svg>
      </div>
      <FlowerArt name="Wild Rose" decorative className="absolute -bottom-3 left-1 h-[54px] w-[54px]" />
    </div>
  )
}
