'use client'
/**
 * @module   booking
 * @owner    CLIENT
 * @screens  Public booking link (owner 2026-11-18; consultant request §3) — /book/jitendra-khimlani (owner 2026-11-21: one kind of appointment)
 *           Shared by Jitendra Khimlani and Haresh on WhatsApp and as a QR code. Signed-in clients go straight to booking;
 *           new visitors see a short welcome, then sign-in → onboarding → booking (type kept).
 * v5 (HUB 2026-11-20): official logo kit in the header (no typed wordmark), arch portrait, Blue Bloom chips.
 */
import { goSafe } from '@/lib/nav'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { Check, MapPin, Sparkles, Video } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { Logo, LogoMark } from '@/components/brand'
import { Sparkle } from '@/components/jitu-story'
import { Btn, cx, ease } from '@/components/ui'
import { CONSULTANT, CONSULTATIONS, STUDIO } from '@/lib/data'
import { formatINR } from '@/lib/format'
import { setNextStep } from '@/lib/next-step'
import { BP } from '@/lib/asset'
import { useApp } from '@/lib/store'
import { Verified } from '@/components/verified'
import { AboutRemedies } from '@/components/about-remedies'

export default function Page() { return <Suspense><BookingLink /></Suspense> }

function BookingLink() {
  const router = useRouter()
  const params = useSearchParams()
  // owner 2026-11-21: no first / follow-up choice; everyone books an appointment and the team sets the type and fee (?type= is ignored)
  const hydrated = useApp((s) => s.hydrated)
  const onboarded = useApp((s) => !!s.profile?.onboardedAt)
  const dest = '/app/book'
  useEffect(() => { if (hydrated && onboarded) router.replace(dest) }, [hydrated, onboarded, dest, router])
  const go = () => { setNextStep(dest); goSafe(router, '/sign-in') }
  if (!hydrated || onboarded) return <div className="grid min-h-dvh place-items-center"><LogoMark size={64} label="BeWise" /></div>

  return (
    <main className="flex min-h-dvh flex-col px-5 pb-4 safe-t">
      <header className="flex items-center pt-3"><Logo height={32} /></header>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mt-6 flex flex-col items-center text-center">
        <div className="relative">
          <img src={`${BP}/img/jitu-portrait.webp`} alt="Jitendra Khimlani" className="relative h-[190px] w-[152px] rounded-[999px_999px_24px_24px] object-cover object-[50%_30%] ring-4 ring-white shadow-[var(--shadow-float)]" />
          <Sparkle size={26} className="absolute -right-4 top-6" />
        </div>
        <h1 className="h-duo mt-6 text-[30px]">Book with <em>Jitendra Khimlani</em> <Verified size={24} /></h1>
        <p className="mt-1 text-[14px] font-semibold text-navy">{CONSULTANT.title} · {CONSULTANT.stats[0]}</p>
        <p className="mt-3 max-w-[330px] text-[16px] leading-6 text-ink-2">{CONSULTANT.approach.replace(/^Jitendra Khimlani listens first\./, 'He listens first.')}</p>
      </motion.div>

      <div className="mt-6 rounded-[24px] bg-white p-4 text-center shadow-[var(--shadow-card)]">
        <p className="text-[16px] font-bold text-navy">One to one with Jitendra Khimlani</p>
        <p className="mt-1 text-[13px] leading-5 text-muted">{formatINR(CONSULTATIONS[0].feePaise)} first visit · {formatINR(CONSULTATIONS[1].feePaise)} after that. Our team confirms your time and fee, then you pay in the app.</p>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2 text-[12px] font-semibold text-navy">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-sky-200"><Video className="size-3.5" /> Online</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-sky-200"><MapPin className="size-3.5" /> {STUDIO.short}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-sky-200">🌿 Remedy blend included</span>
      </div>

      {/* owner 2026-11-25: more about the remedy, for people who don't know Bach flowers yet */}
      <div className="mt-6"><AboutRemedies storyHref="/s/spotlight" /></div>

      <div className="mt-auto space-y-2 pt-8 safe-b">
        <Btn full variant="gradient" onClick={go}>Book a session</Btn>
        <p className="text-center text-[12px] text-muted">Takes about 3 minutes · sessions are non-refundable, but you can reschedule</p>
      </div>
    </main>
  )
}
