'use client'
/**
 * @module   commerce-ux
 * @owner    CLIENT
 * @screens  Launch offer banner + full-screen offer (owner 2026-11-18)
 * Flow:     banner → animated yearly offer (₹9,600 cut to ₹8,000, 2 months free, save ₹1,600) → pay or WhatsApp
 *           ✕ → "Are you sure?" → 6-month offer (1 month free) → claim or skip
 *           paid → congratulations + 15% first-purchase coupon (7 days)
 */
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { Gift, MessageCircle, Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PaySheet } from './pay-sheet'
import { Btn, buzz, cx, useNow } from './ui'
import { useApp } from '@/lib/store'
import { formatINR } from '@/lib/format'
import { COUPON_DAYS, COUPON_PCT, OFFER_ENDS, PLANS, countdown, offerLive, planFull, planPrice, planSaving, waLink, type PlanId } from '@/lib/offer'

const pad = (n: number) => String(n).padStart(2, '0')

export function Countdown({ dark, compact }: { dark?: boolean; compact?: boolean }) {
  const now = useNow(1000)
  const c = countdown(+OFFER_ENDS, now)
  if (compact) return <span className="tnum">{c.d}d {pad(c.h)}h {pad(c.m)}m</span>
  return (
    <div className="flex items-center justify-center gap-2" role="timer" aria-label={`Offer ends in ${c.d} days ${c.h} hours`}>
      {[[c.d, 'days'], [c.h, 'hrs'], [c.m, 'min'], [c.s, 'sec']].map(([v, l]) => (
        <div key={l} className={cx('w-[58px] rounded-[16px] py-2 text-center', dark ? 'bg-white/12' : 'bg-white shadow-[var(--shadow-card)]')}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p key={String(v)} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} transition={{ duration: 0.25 }}
              className={cx('text-[20px] font-extrabold leading-none tnum', dark ? 'text-white' : 'text-navy')}>{pad(Number(v))}</motion.p>
          </AnimatePresence>
          <p className={cx('mt-1 text-[11px] font-semibold', dark ? 'text-white/70' : 'text-muted')}>{l}</p>
        </div>
      ))}
    </div>
  )
}

/** Top-of-app launch banner. */
export function LaunchBanner() {
  const [open, setOpen] = useState(false)
  const plan = useApp((s) => s.plan)
  const show = offerLive() && !plan
  if (!show && !open) return null
  return (
    <>
      {show && <motion.button onClick={() => { buzz(10); setOpen(true) }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="relative flex w-full items-center gap-3 overflow-hidden rounded-[24px] bg-[linear-gradient(120deg,#182957,#2c4384_55%,#b58a3c)] p-3.5 pr-4 text-left text-white shadow-[var(--shadow-float)]"
        aria-label="Reveal your introductory offer">
        <motion.span aria-hidden className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-white/20 blur-md"
          animate={{ x: ['0%', '480%'] }} transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' }} />
        <motion.span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/15 text-[22px]" animate={{ rotate: [0, -10, 10, -6, 0] }} transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.5 }} aria-hidden>🎁</motion.span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#f6de8d]">Just for you</span>
          <span className="block text-[15px] font-bold leading-tight">A new introductory offer for you</span>
          <span className="block text-[12px] text-white/75">Valid till 1 December · <Countdown compact /> left</span>
        </span>
        <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-navy">Reveal</span>
      </motion.button>}
      <LaunchOffer open={open} onClose={() => setOpen(false)} />
    </>
  )
}

type Stage = 'yearly' | 'sure' | 'half' | 'congrats'

export function LaunchOffer({ open, onClose, start = 'yearly' }: { open: boolean; onClose: () => void; start?: PlanId }) {
  const buyPlan = useApp((s) => s.buyPlan)
  const setOffer = useApp((s) => s.setOffer)
  const [stage, setStage] = useState<Stage>(start === 'half' ? 'half' : 'yearly')
  const [paying, setPaying] = useState<PlanId | null>(null)
  useEffect(() => { if (open) setStage(start === 'half' ? 'half' : 'yearly') }, [open, start])
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }) // eslint-disable-line react-hooks/exhaustive-deps
  const close = () => {
    if (stage === 'yearly') return setStage('sure')
    if (stage === 'half') setOffer({ skippedAt: new Date().toISOString() })
    onClose()
  }
  const id: PlanId = stage === 'half' ? 'half' : 'yearly'

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div role="dialog" aria-modal="true" aria-label="Launch offer" className="fixed inset-0 z-[44] mx-auto flex max-w-[480px] flex-col overflow-y-auto bg-[radial-gradient(120%_80%_at_50%_0%,#2c4384_0%,#182957_55%,#0f1b3d_100%)] text-white"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Sparkle />
            {stage !== 'congrats' && (
              <button onClick={close} aria-label="Close offer" className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-white/12 safe-t"><X className="size-5" /></button>
            )}
            <AnimatePresence mode="wait">
              {stage === 'yearly' && <OfferBody key="y" id="yearly" onClaim={() => setPaying('yearly')} />}
              {stage === 'half' && <OfferBody key="h" id="half" onClaim={() => setPaying('half')} onSkip={close} />}
              {stage === 'congrats' && <Congrats key="c" onDone={onClose} />}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* are you sure */}
      <AnimatePresence>
        {open && stage === 'sure' && (
          <motion.div className="fixed inset-0 z-[46] mx-auto flex max-w-[480px] items-center justify-center bg-[#0f1b3d]/70 px-6 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div role="alertdialog" aria-modal="true" aria-labelledby="sure-h" className="w-full rounded-[28px] bg-white p-6 text-center shadow-[var(--shadow-float)]"
              initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 24 }}>
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#fbf3dc] text-[30px]" aria-hidden>🥺</span>
              <h2 id="sure-h" className="mt-3 text-[22px] font-extrabold tracking-[-0.02em] text-navy">Are you sure?</h2>
              <p className="mt-1.5 text-[15px] leading-6 text-muted">You’ll miss <b className="text-navy">2 months free</b> and a saving of {formatINR(planSaving('yearly'))}. This price won’t come back after 1 December.</p>
              <div className="mt-5 space-y-2">
                <Btn full variant="gradient" onClick={() => setStage('yearly')}>Keep my offer</Btn>
                <Btn full variant="white" onClick={() => { setOffer({ downsellAt: new Date().toISOString() }); setStage('half') }}>Yes, I’m sure</Btn>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PaySheet open={!!paying} amountPaise={paying ? planPrice(paying) : 0} purpose={paying ? `${PLANS[paying].name} · launch offer` : ''} onClose={() => setPaying(null)}
        onPaid={() => { if (!paying) return; buyPlan(paying, planPrice(paying)); setPaying(null); setStage('congrats') }} />
      <span className="sr-only" aria-live="polite">{open ? `${PLANS[id].name} offer` : ''}</span>
    </>
  )
}

function OfferBody({ id, onClaim, onSkip }: { id: PlanId; onClaim: () => void; onSkip?: () => void }) {
  const p = PLANS[id]
  const full = planFull(id), price = planPrice(id), save = planSaving(id)
  const [phase, setPhase] = useState(0) // 0 intro · 1 full price · 2 cut · 3 new price + badges
  useEffect(() => {
    const t = [setTimeout(() => setPhase(1), 650), setTimeout(() => setPhase(2), 1350), setTimeout(() => setPhase(3), 1900)]
    return () => t.forEach(clearTimeout)
  }, [])
  const shown = useCountUp(phase >= 3 ? price : full, full, 700)
  const half = id === 'half'
  return (
    <motion.div className="relative flex min-h-full flex-1 flex-col px-6 pb-6 pt-14 safe-t" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      <div className="relative mx-auto grid size-[112px] place-items-center">
        <motion.span aria-hidden className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#f6de8d55,transparent_25%,#f6de8d55_50%,transparent_75%,#f6de8d55)]"
          animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} />
        <motion.span aria-hidden className="absolute inset-3 rounded-full bg-[#f6de8d]/25 blur-xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2.4, repeat: Infinity }} />
        <motion.span className="relative text-[58px]" aria-hidden initial={{ scale: 0, rotate: -30 }} animate={{ scale: [0, 1.25, 1], rotate: [-30, 8, 0] }} transition={{ duration: 0.8, ease: 'easeOut' }}>
          {half ? '🌱' : '🎁'}
        </motion.span>
      </div>

      <motion.p className="mt-4 text-center text-[12px] font-bold uppercase tracking-[0.3em] text-[#f6de8d]" initial={{ opacity: 0, letterSpacing: '0.6em' }} animate={{ opacity: 1, letterSpacing: '0.3em' }} transition={{ delay: 0.2, duration: 0.7 }}>
        {half ? 'Wait, one more gift' : 'Launch offer'}
      </motion.p>
      <motion.h2 className="mt-2 text-center text-[30px] font-extrabold leading-tight tracking-[-0.03em]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        {p.name}
      </motion.h2>
      <motion.p className="mx-auto mt-1 max-w-[300px] text-center text-[14px] leading-5 text-white/75" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
        A consultation with Jitu Bhaiya every month for {p.months} months, your remedy blend included each time.
      </motion.p>

      <motion.div className="relative mx-auto mt-6 w-full max-w-[340px] rounded-[30px] bg-white/10 p-5 text-center ring-1 ring-white/15 backdrop-blur" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 220, damping: 20 }}>
        <div className="relative mx-auto h-8 w-fit">
          <motion.span className="text-[22px] font-bold text-white/70 tnum" animate={{ opacity: phase >= 1 ? 1 : 0, scale: phase >= 3 ? 0.9 : 1 }}>{formatINR(full)}</motion.span>
          <motion.span aria-hidden className="absolute left-[-6%] top-1/2 h-[3px] w-[112%] origin-left -rotate-6 rounded-full bg-[#f08fa0]" initial={{ scaleX: 0 }} animate={{ scaleX: phase >= 2 ? 1 : 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} />
        </div>
        <motion.p className="mt-1 text-[52px] font-extrabold leading-none tracking-[-0.03em] text-[#f6de8d] tnum" animate={phase >= 3 ? { scale: [1, 1.12, 1] } : {}} transition={{ duration: 0.5 }}>
          {formatINR(shown)}
        </motion.p>
        <p className="mt-1 text-[13px] text-white/70">for {p.months} months · {formatINR(Math.round(price / p.months))} a month</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <AnimatePresence>
            {phase >= 3 && <motion.span key="free" initial={{ scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 14 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#f6de8d] px-3.5 py-1.5 text-[13px] font-extrabold text-navy"><Gift className="size-4" /> {p.free} month{p.free > 1 ? 's' : ''} FREE</motion.span>}
            {phase >= 3 && <motion.span key="save" initial={{ scale: 0, rotate: 12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 14, delay: 0.15 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#bfd8c2] px-3.5 py-1.5 text-[13px] font-extrabold text-[#1f4a2c]"><Sparkles className="size-4" /> You save {formatINR(save)}</motion.span>}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div className="mt-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        <p className="mb-2 text-center text-[12px] font-semibold text-white/75">Only valid till 1 December</p>
        <Countdown dark />
      </motion.div>

      <div className="mt-auto space-y-2.5 pt-6 safe-b">
        <motion.div className="rounded-full" animate={{ boxShadow: ['0 0 0 0 rgba(246,222,141,.55)', '0 0 0 14px rgba(246,222,141,0)'] }} transition={{ duration: 1.8, repeat: Infinity, delay: 2.2 }}>
          <button onClick={() => { buzz(14); onClaim() }} className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#f6de8d,#e9c46a)] text-[16px] font-extrabold text-navy shadow-[0_12px_30px_rgba(246,222,141,.35)]">
            <span aria-hidden>🔒</span> Claim offer · Pay {formatINR(price)}
          </button>
        </motion.div>
        <a href={waLink(half ? 'I want to avail the 6-month offer' : 'I want to avail the yearly offer')} target="_blank" rel="noopener noreferrer"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white/12 text-[15px] font-semibold text-white ring-1 ring-white/20">
          <MessageCircle className="size-5" /> Ask on WhatsApp
        </a>
        {onSkip && <button onClick={onSkip} className="block w-full py-2 text-center text-[14px] font-semibold text-white/70 underline underline-offset-4">Skip offer</button>}
      </div>
    </motion.div>
  )
}

function Congrats({ onDone }: { onDone: () => void }) {
  const coupon = useApp((s) => s.coupon)
  const days = coupon ? Math.max(1, Math.ceil((+new Date(coupon.expiresAt) - Date.now()) / 864e5)) : COUPON_DAYS
  return (
    <motion.div className="relative flex min-h-full flex-1 flex-col items-center px-6 pb-6 pt-16 text-center safe-t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Confetti />
      <div className="relative grid size-[150px] place-items-center">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} aria-hidden className="absolute inset-0 rounded-full border-2 border-[#f6de8d]/60" initial={{ scale: 0.4, opacity: 0.9 }} animate={{ scale: 1.6, opacity: 0 }} transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.7 }} />
        ))}
        <motion.span className="relative grid size-[110px] place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff6d6,#f6de8d_60%,#d9b35a)] text-[54px] shadow-[0_0_60px_rgba(246,222,141,.55)]"
          initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} aria-hidden>🌸</motion.span>
      </div>
      <motion.p className="mt-6 text-[12px] font-bold uppercase tracking-[0.3em] text-[#f6de8d]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>Congratulations</motion.p>
      <motion.h2 className="mt-2 text-[26px] font-extrabold leading-tight tracking-[-0.02em]" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        You’ve just taken the first step towards your mental and emotional wellbeing
      </motion.h2>

      <motion.div className="relative mt-7 w-full max-w-[340px] overflow-hidden rounded-[26px] bg-white p-5 text-left text-navy shadow-[0_20px_50px_rgba(0,0,0,.25)]"
        initial={{ opacity: 0, y: 40, rotate: -4 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 1, type: 'spring', stiffness: 160, damping: 16 }}>
        <span aria-hidden className="absolute -left-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-[#182957]" />
        <span aria-hidden className="absolute -right-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-[#182957]" />
        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#8a6a2c]">🎁 A gift from the BeWise app</p>
        <p className="mt-1 text-[34px] font-extrabold leading-none tracking-[-0.03em]">{coupon?.pct ?? COUPON_PCT}% off</p>
        <p className="mt-1 text-[14px] text-muted">on all products, on your first purchase</p>
        <div className="mt-3 flex items-center justify-between border-t border-dashed border-line pt-3">
          <span className="rounded-[10px] bg-peri-50 px-3 py-1.5 font-mono text-[14px] font-bold tracking-[0.12em]">{coupon?.code ?? 'WELCOME15'}</span>
          <span className="text-[13px] font-semibold text-rose">Expires in {days} days</span>
        </div>
      </motion.div>

      <div className="mt-auto w-full space-y-2.5 pt-7 safe-b">
        <Link href="/app/shop" onClick={onDone} className="flex h-14 w-full items-center justify-center rounded-full bg-[linear-gradient(90deg,#f6de8d,#e9c46a)] text-[16px] font-extrabold text-navy">Shop with {coupon?.pct ?? COUPON_PCT}% off</Link>
        <Link href="/app/book?type=followup" onClick={onDone} className="flex h-12 w-full items-center justify-center rounded-full bg-white/12 text-[15px] font-semibold text-white ring-1 ring-white/20">Book my session</Link>
      </div>
    </motion.div>
  )
}

function useCountUp(target: number, from: number, ms: number) {
  const [v, setV] = useState(from)
  useEffect(() => {
    const start = performance.now(), a = v
    let raf = 0
    const tick = (t: number) => { const k = Math.min(1, (t - start) / ms); const e = 1 - Math.pow(1 - k, 3); setV(Math.round(a + (target - a) * e)); if (k < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target]) // eslint-disable-line react-hooks/exhaustive-deps
  return v
}

function Sparkle() {
  const dots = useMemo(() => Array.from({ length: 22 }, (_, i) => ({ x: (i * 37) % 100, y: (i * 53) % 100, s: 2 + (i % 3), d: 2 + (i % 5) * 0.6, delay: (i % 7) * 0.4 })), [])
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {dots.map((p, i) => (
        <motion.span key={i} className="absolute rounded-full bg-[#f6de8d]" style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s }}
          animate={{ opacity: [0, 1, 0], scale: [0.6, 1.4, 0.6] }} transition={{ duration: p.d, repeat: Infinity, delay: p.delay }} />
      ))}
    </div>
  )
}

function Confetti() {
  const ps = useMemo(() => Array.from({ length: 36 }, (_, i) => ({
    x: (i / 36) * 100 + (i % 3) * 2, delay: (i % 9) * 0.07, dur: 2.6 + (i % 5) * 0.3, rot: (i % 2 ? 1 : -1) * (160 + i * 11),
    c: ['#F4C2C8', '#B9CBF2', '#F6DE8D', '#BFD8C2', '#D6CBEF', '#ffffff'][i % 6], s: 7 + (i % 4) * 3,
  })), [])
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {ps.map((p, i) => (
        <motion.span key={i} className="absolute top-0 block rounded-[60%_10%_60%_10%]" style={{ left: `${p.x}%`, width: p.s, height: p.s * 1.3, background: p.c }}
          initial={{ y: -40, opacity: 0 }} animate={{ y: '110vh', opacity: [0, 1, 1, 0], rotate: p.rot, x: [0, 20, -16, 10] }} transition={{ duration: p.dur, delay: p.delay, ease: 'easeIn' }} />
      ))}
    </div>
  )
}
