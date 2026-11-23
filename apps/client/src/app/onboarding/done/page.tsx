'use client'
/** @module onboarding @owner CLIENT @screens CL-07 You're in — celebration + two first choices. */
import { useRouter } from 'next/navigation'
import { goSafe } from '@/lib/nav'
import { motion } from 'motion/react'
import { BookOpen, CalendarHeart, ChevronRight, House } from 'lucide-react'
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
          // owner 2026-11-21: the owl says hi. No CSS drop-shadow here: iOS Safari drew it as a grey box inside the animated wrapper.
          <motion.div className="absolute -bottom-2 -right-3" initial={{ scale: 0, rotate: 20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.7 }}>
            <span className="absolute bottom-3 left-1/2 h-2.5 w-12 -translate-x-1/2 rounded-[50%] bg-navy/15 blur-[4px]" aria-hidden />
            <motion.div style={{ originX: 0.5, originY: 1 }} animate={{ rotate: [0, -7, 6, -4, 0] }} transition={{ duration: 1.1, delay: 1.2, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' }}>
              <Mascot pose="wave" height={96} float={false} shadow={false} />
            </motion.div>
            <motion.span className="absolute -top-6 -right-1 whitespace-nowrap rounded-[16px] rounded-br-[4px] bg-white px-3 py-1.5 text-[15px] font-bold text-navy shadow-[0_6px_16px_rgba(23,33,74,.14)]"
              initial={{ scale: 0, opacity: 0, originX: 1, originY: 1 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 16, delay: 1.1 }}>
              Hi! 👋
            </motion.span>
          </motion.div>
        )}
      </div>
      <motion.div variants={stagger} initial="hidden" animate="show" className="mt-10 text-center">
        <motion.h1 variants={rise} className="h-duo text-[34px]">You’re in, <em>{firstName(profile?.name)}</em></motion.h1>
        <motion.p variants={rise} className="mx-auto mt-3 max-w-[300px] text-[15px] leading-6 text-muted">Your calm little corner is ready. Everything for your wellness journey with Jitendra Khimlani is here.</motion.p>
      </motion.div>
      <motion.div variants={stagger} initial="hidden" animate="show" transition={{ delayChildren: 0.5 }} className="mt-auto space-y-3 pb-3 pt-8 safe-b">
        {/* owner 2026-11-23: no booking prompt in onboarding (members book inside the app); only the booking link continues to its booking */}
        {(next ? [
          { icon: <CalendarHeart className="size-6" />, t: 'Continue to your booking', d: 'Remedy blend included · nothing to pay until your time is set', href: next, primary: true },
          { icon: <BookOpen className="size-6" />, t: 'Read a Bach flower story', d: 'Sleep, anxiety, relationships · 3 min each', href: '/app/learn' },
        ] : [
          { icon: <House className="size-6" />, t: 'Take me home', d: 'Your blend, drops and how you feel', href: '/app', primary: true },
          { icon: <BookOpen className="size-6" />, t: 'Read a Bach flower story', d: 'Sleep, anxiety, relationships · 3 min each', href: '/app/learn' },
        ]).map((o) => (
          <motion.button variants={rise} whileTap={{ scale: 0.98 }} key={o.t} onClick={() => { if (o.primary) takeNextStep(); goSafe(router, o.href, 'replace') }}
            className={`flex w-full items-center gap-4 rounded-[26px] p-4 text-left shadow-[var(--shadow-card)] ${o.primary ? 'bg-navy text-white' : 'bg-white text-navy'}`}>
            <span className={`grid size-12 place-items-center rounded-full ${o.primary ? 'bg-white/15' : 'bg-peri-50'}`}>{o.icon}</span>
            <span className="flex-1"><span className="block text-[16px] font-bold">{o.t}</span><span className={`text-[13px] ${o.primary ? 'text-white/75' : 'text-muted'}`}>{o.d}</span></span>
            <ChevronRight className="size-5 opacity-70" />
          </motion.button>
        ))}
        {next && <button onClick={() => goSafe(router, '/app', 'replace')} className="w-full py-2 text-[14px] font-semibold text-navy">Take me home</button>}
      </motion.div>
    </main>
  )
}
