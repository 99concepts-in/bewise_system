'use client'
/**
 * @module   remedies-ux
 * @owner    CLIENT
 * @screens  CL-08 Home — "Your blend" (owner 2026-11-18): bottle empties until the next appointment, today's drops,
 *           pre-book the next session before it runs low.
 */
import Link from 'next/link'
import { motion } from 'motion/react'
import { CalendarPlus, ChevronRight } from 'lucide-react'
import { useId } from 'react'
import { BtnLink, cx, useNow } from './ui'
import { useApp } from '@/lib/store'
import { DoseTracker } from './dose-tracker'
import { fmtDay, fmtTime } from '@/lib/format'
import { blendSupply, isoDay } from '@/lib/supply'
import { BP } from '@/lib/asset'

/** Amber dropper bottle; liquid height = level (0–1) with a slow moving surface. */
export function Bottle({ level, height = 150 }: { level: number; height?: number }) {
  const id = useId().replace(/:/g, '')
  const top = 58, bottom = 182, liquidY = bottom - (bottom - top) * Math.max(0.03, level)
  return (
    <svg viewBox="0 0 100 190" style={{ height, width: (height * 100) / 190 }} role="img" aria-label={`Blend about ${Math.round(level * 100)}% left`}>
      <defs>
        <clipPath id={`b-${id}`}><path d="M30 52h40c9 0 14 6 14 15v104c0 9-6 15-15 15H31c-9 0-15-6-15-15V67c0-9 5-15 14-15Z" /></clipPath>
        <linearGradient id={`g-${id}`} x1="0" x2="1"><stop offset="0" stopColor="#8a4f17" /><stop offset=".45" stopColor="#c7832f" /><stop offset="1" stopColor="#7a4312" /></linearGradient>
        <linearGradient id={`l-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f3c06b" /><stop offset="1" stopColor="#c47a2a" /></linearGradient>
      </defs>
      {/* dropper cap */}
      <rect x="40" y="6" width="20" height="18" rx="9" fill="#1d1f2b" />
      <rect x="34" y="22" width="32" height="32" rx="6" fill="#23263a" />
      <rect x="36" y="25" width="4" height="26" rx="2" fill="#ffffff22" />
      {/* glass */}
      <path d="M30 52h40c9 0 14 6 14 15v104c0 9-6 15-15 15H31c-9 0-15-6-15-15V67c0-9 5-15 14-15Z" fill={`url(#g-${id})`} opacity=".35" />
      <g clipPath={`url(#b-${id})`}>
        <motion.g initial={{ y: bottom - liquidY }} animate={{ y: 0 }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}>
          <motion.path d={`M-40 ${liquidY} Q -20 ${liquidY - 5} 0 ${liquidY} T 40 ${liquidY} T 80 ${liquidY} T 120 ${liquidY} T 160 ${liquidY} V 200 H -40 Z`}
            fill={`url(#l-${id})`} animate={{ x: [0, -40] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }} />
        </motion.g>
      </g>
      {/* label + highlight */}
      <rect x="24" y="104" width="52" height="44" rx="6" fill="#f5efe4" />
      <image href={`${BP}/img/brand/bewise-mark.svg`} x="41" y="108" width="18" height="18" />
      <text x="50" y="137" textAnchor="middle" fontSize="6.5" fontWeight="600" fill="#5b6275" fontFamily="inherit">personal blend</text>
      <path d="M22 70c0-6 3-10 8-10" stroke="#fff" strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M22 80v70" stroke="#fff" strokeOpacity=".25" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

export function BlendBottleCard() {
  const blend = useApp((s) => s.blend)
  const appointments = useApp((s) => s.appointments)
  const now = useNow(60_000)
  if (!blend) return null
  const sup = blendSupply(blend, appointments, now)
  const req = appointments.find((a) => a.status === 'confirmed' && a.timeTbc)
  return (
    <section className={cx('relative overflow-hidden rounded-[24px] p-5 shadow-[var(--shadow-card)]', sup.low ? 'bg-marigold-100' : 'bg-white')} aria-labelledby="blend-h">
      <div className="flex gap-4">
        <div className="relative shrink-0 pt-1">
          <span className="absolute inset-x-0 bottom-1 mx-auto h-4 w-16 rounded-[50%] bg-[#7a4312]/15 blur-md" />
          <Bottle level={sup.level} height={156} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between">
            <h2 id="blend-h" className="h-section">Your blend</h2>
            <Link href="/app/remedies" aria-label="Open My Remedies" className="-mr-1 grid size-8 place-items-center rounded-full text-soft"><ChevronRight className="size-5" /></Link>
          </div>
          <p className="mt-1 text-[30px] font-extrabold leading-none tracking-[-0.02em] text-navy tnum">{sup.daysLeft}<span className="ml-1 text-[15px] font-bold text-muted">{sup.daysLeft === 1 ? 'day' : 'days'} left</span></p>
          <p className="mt-1.5 text-[13px] leading-[18px] text-muted">
            {sup.next ? <>Lasts until your session · <b className="text-navy">{fmtDay(sup.next.startsAt)}</b></> : sup.low ? <b className="text-[#9a5b12]">Running low. Request your follow-up</b> : <>Runs low around <b className="text-navy">{fmtDay(sup.runOut)}</b></>}
          </p>
          <p className="mt-2 text-[12px] text-muted">{blend.drops} drops, {blend.timesPerDay}× a day</p>
        </div>
      </div>

      <div className="mt-4"><DoseTracker /></div>

      {/* next appointment / pre-book */}
      <div className="mt-4 rounded-[20px] bg-sky-50 p-3.5">
        {req ? (
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#fbf3dc] text-[#8a6a2c]"><CalendarPlus className="size-5" /></span>
            <div className="min-w-0 flex-1"><p className="text-[12px] font-semibold text-muted">Follow-up requested</p><p className="truncate text-[14px] font-bold text-navy">We’ll confirm the time</p></div>
            <BtnLink href={`/app/sessions/view?id=${req.id}`} size="sm" variant="white">View</BtnLink>
          </div>
        ) : sup.next ? (
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-teal-100 text-sage-text"><CalendarPlus className="size-5" /></span>
            <div className="min-w-0 flex-1"><p className="text-[12px] font-semibold text-muted">Next session booked</p><p className="truncate text-[14px] font-bold text-navy">{fmtDay(sup.next.startsAt)} · {fmtTime(sup.next.startsAt)}</p></div>
            <BtnLink href={`/app/sessions/view?id=${sup.next.id}`} size="sm" variant="white">View</BtnLink>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className={cx('grid size-10 shrink-0 place-items-center rounded-full', sup.low ? 'bg-[#fbe3c0] text-[#9a5b12]' : 'bg-peri-50 text-navy')}><CalendarPlus className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-muted">Request your follow-up</p>
                <p className="text-[15px] font-bold text-navy">Suggested · {fmtDay(sup.suggest)}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <BtnLink href="/app/book?type=followup" size="sm" variant="white" className="flex-1 whitespace-nowrap">Other date</BtnLink>
              <BtnLink href={`/app/book?type=followup&date=${isoDay(sup.suggest)}`} size="sm" variant={sup.low ? 'gradient' : 'primary'} className="flex-1">Request</BtnLink>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
