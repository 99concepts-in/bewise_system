'use client'
/**
 * @module   booking
 * @owner    CLIENT
 * @screens  Public booking link (owner 2026-11-18; consultant request §3) — /book/jitu-bhaiya?type=first|followup
 *           Shared by Jitu Bhaiya and Haresh on WhatsApp and as a QR code. Signed-in clients go straight to booking;
 *           new visitors see a short welcome, then sign-in → onboarding → booking (type kept).
 */
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { Check, MapPin, Sparkles, Video } from 'lucide-react'
import { Suspense, useEffect } from 'react'
import { LogoMark } from '@/components/brand'
import { Btn, cx, ease } from '@/components/ui'
import { CONSULTANT, CONSULTATIONS, STUDIO } from '@/lib/data'
import { formatINR } from '@/lib/format'
import { setNextStep } from '@/lib/next-step'
import { BP } from '@/lib/asset'
import { useApp } from '@/lib/store'

export default function Page() { return <Suspense><BookingLink /></Suspense> }

function BookingLink() {
  const router = useRouter()
  const params = useSearchParams()
  const type = params.get('type') === 'followup' ? 'followup' : 'first'
  const hydrated = useApp((s) => s.hydrated)
  const onboarded = useApp((s) => !!s.profile?.onboardedAt)
  const dest = `/app/book?type=${type}`
  useEffect(() => { if (hydrated && onboarded) router.replace(dest) }, [hydrated, onboarded, dest, router])
  const go = () => { setNextStep(dest); router.push('/sign-in') }
  if (!hydrated || onboarded) return <div className="grid min-h-dvh place-items-center"><LogoMark size={64} /></div>

  return (
    <main className="flex min-h-dvh flex-col px-5 pb-4 safe-t">
      <header className="flex items-center gap-2.5 pt-3"><LogoMark size={36} /><span className="text-[15px] font-extrabold text-navy">BeWise <span className="font-semibold text-muted">· Holistic Wellness</span></span></header>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mt-6 flex flex-col items-center text-center">
        <div className="relative">
          <motion.span className="absolute -inset-3 rounded-full border-2 border-white" animate={{ scale: [1, 1.06, 1], opacity: [0.9, 0.4, 0.9] }} transition={{ duration: 4, repeat: Infinity }} />
          <img src={`${BP}/img/jitu-portrait.webp`} alt="Jitendra Khimlani — Jitu Bhaiya" className="relative size-[148px] rounded-full object-cover object-[50%_18%] ring-[6px] ring-white shadow-[var(--shadow-float)]" />
        </div>
        <h1 className="h-duo mt-6 text-[30px]">Book with <em>Jitu Bhaiya</em></h1>
        <p className="mt-1 text-[14px] font-semibold text-peri">{CONSULTANT.fullName} · {CONSULTANT.title}</p>
        <p className="mt-3 max-w-[330px] text-[15px] leading-6 text-muted">{CONSULTANT.approach}</p>
      </motion.div>

      <div className="mt-6 space-y-3">
        {CONSULTATIONS.map((c, i) => {
          const on = c.id === type
          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }}
              className={cx('flex items-center gap-3 rounded-[24px] p-4', on ? 'bg-navy text-white shadow-[var(--shadow-float)]' : 'bg-white text-navy shadow-[var(--shadow-card)]')}>
              <span className={cx('grid size-10 shrink-0 place-items-center rounded-full', on ? 'bg-white/15' : 'bg-peri-50')}>{on ? <Check className="size-5" strokeWidth={3} /> : <Sparkles className="size-5" />}</span>
              <span className="flex-1"><span className="block text-[16px] font-bold">{c.name}</span><span className={cx('text-[13px]', on ? 'text-white/75' : 'text-muted')}>Remedy blend included</span></span>
              <span className="text-[20px] font-extrabold tnum">{formatINR(c.feePaise)}</span>
            </motion.div>
          )
        })}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2 text-[12px] font-semibold text-navy">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 shadow-[var(--shadow-card)]"><Video className="size-3.5" /> Online</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 shadow-[var(--shadow-card)]"><MapPin className="size-3.5" /> {STUDIO.short}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 shadow-[var(--shadow-card)]">🌿 Alcohol-free blends</span>
      </div>

      <div className="mt-auto space-y-2 pt-8 safe-b">
        <Btn full variant="gradient" onClick={go}>Book with Jitu Bhaiya</Btn>
        <p className="text-center text-[12px] text-muted">Takes about 3 minutes · sessions are non-refundable, but you can reschedule</p>
      </div>
    </main>
  )
}
