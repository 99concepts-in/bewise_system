'use client'
/** @module onboarding @owner CLIENT @screens CL-07 You're in — celebration + two first choices. */
import { useRouter } from 'next/navigation'
import { goSafe } from '@/lib/nav'
import { motion } from 'motion/react'
import { CalendarHeart, ShoppingBag, ChevronRight } from 'lucide-react'
import { Avatar, Mascot, Petals } from '@/components/brand'
import { ease, rise, stagger } from '@/components/ui'
import { useApp } from '@/lib/store'
import { peekNextStep, takeNextStep } from '@/lib/next-step'
import { useEffect, useState } from 'react'
import { firstName } from '@/lib/format'

export default function Done() {
  const router = useRouter()
  const profile = useApp((s) => s.profile)
  const [next, setNext] = useState<string | null>(null)
  useEffect(() => { setNext(peekNextStep()) }, [])
  return (
    <main className="flex min-h-dvh flex-col px-5 safe-t">
      <Petals />
      <div className="relative mx-auto mt-14 grid size-[220px] place-items-center">
        {[0, 1, 2].map((k) => (
          <motion.span key={k} className="absolute inset-0 rounded-full border-2 border-white" initial={{ scale: 0.6, opacity: 0.9 }} animate={{ scale: 1.18 + k * 0.08, opacity: 0 }} transition={{ duration: 2.2, delay: 0.3 + k * 0.35, repeat: Infinity, repeatDelay: 0.6, ease: 'easeOut' }} />
        ))}
        <motion.div initial={{ scale: 0.3, rotate: -12, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.15 }}>
          {profile?.photo ? <Avatar photo={profile.photo} name={profile.name} size={176} ring /> : <Mascot pose="wave" height={200} priority />}
        </motion.div>
        {profile?.photo && (
          <motion.div className="absolute -bottom-2 -right-3" initial={{ scale: 0, rotate: 20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.7 }}>
            <Mascot pose="wave" height={96} float={false} />
          </motion.div>
        )}
      </div>
      <motion.div variants={stagger} initial="hidden" animate="show" className="mt-10 text-center">
        <motion.h1 variants={rise} className="h-duo text-[34px]">You’re in, <em>{firstName(profile?.name)}</em></motion.h1>
        <motion.p variants={rise} className="mx-auto mt-3 max-w-[300px] text-[15px] leading-6 text-muted">Your calm little corner is ready. Where would you like to begin?</motion.p>
      </motion.div>
      <motion.div variants={stagger} initial="hidden" animate="show" transition={{ delayChildren: 0.5 }} className="mt-auto space-y-3 pb-3 pt-8 safe-b">
        {[
          { icon: <CalendarHeart className="size-6" />, t: next ? 'Continue to your booking' : 'Book your first consultation', d: next?.includes('followup') ? '₹800 follow-up · your remedy blend included' : '₹1,000 · your remedy blend included', href: next ?? '/app/book', primary: true },
          { icon: <ShoppingBag className="size-6" />, t: 'Explore the shop', d: 'Oils, mists and bath rituals', href: '/app/shop' },
        ].map((o) => (
          <motion.button variants={rise} whileTap={{ scale: 0.98 }} key={o.t} onClick={() => { if (o.primary) takeNextStep(); goSafe(router, o.href, 'replace') }}
            className={`flex w-full items-center gap-4 rounded-[26px] p-4 text-left shadow-[var(--shadow-card)] ${o.primary ? 'bg-navy text-white' : 'bg-white text-navy'}`}>
            <span className={`grid size-12 place-items-center rounded-full ${o.primary ? 'bg-white/15' : 'bg-peri-50'}`}>{o.icon}</span>
            <span className="flex-1"><span className="block text-[16px] font-bold">{o.t}</span><span className={`text-[13px] ${o.primary ? 'text-white/75' : 'text-muted'}`}>{o.d}</span></span>
            <ChevronRight className="size-5 opacity-70" />
          </motion.button>
        ))}
        <button onClick={() => goSafe(router, '/app', 'replace')} className="w-full py-2 text-[14px] font-semibold text-navy">Take me home</button>
      </motion.div>
    </main>
  )
}
