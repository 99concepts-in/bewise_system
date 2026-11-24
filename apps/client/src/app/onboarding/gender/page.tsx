'use client'
/**
 * @module onboarding @owner CLIENT @screens Sign-up 3 of 3 · Gender → straight to Home (owner 2026-11-24), where a short tour starts.
 * Consent: continuing agrees to the privacy policy; wellbeing data is only shared with Jitendra Khimlani (DPDP). WhatsApp on for reminders.
 */
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Check, Lock, Mars, Venus } from 'lucide-react'
import { useState } from 'react'
import { OnboardShell } from '@/components/onboard-shell'
import { Btn, buzz, cx } from '@/components/ui'
import { useApp } from '@/lib/store'
import { goSafe } from '@/lib/nav'
import { takeNextStep } from '@/lib/next-step'

// owner 2026-11-24: proper icons instead of emoji
const OPTS = [{ v: 'Female', Icon: Venus, tint: 'bg-rose-100 text-[#c2416a]' }, { v: 'Male', Icon: Mars, tint: 'bg-sky-100 text-[#2d6fb8]' }, { v: 'Prefer not to say', Icon: Lock, tint: 'bg-peri-50 text-navy' }]

export default function GenderStep() {
  const router = useRouter()
  const profile = useApp((s) => s.profile)
  const setProfile = useApp((s) => s.setProfile)
  const [g, setG] = useState(profile?.gender ?? '')
  const finish = () => {
    if (!g) return
    buzz(14)
    setProfile({ gender: g, prefilledFrom: undefined, consents: { wellbeing: true, whatsapp: true, offers: profile?.consents?.offers ?? false }, onboardedAt: profile?.onboardedAt ?? new Date().toISOString(), tourPending: true })
    goSafe(router, takeNextStep() ?? '/app', 'replace')
  }
  return (
    <OnboardShell step={3} title="How do you" em="identify?" sub="Choose what feels right.">
      <div className="mt-8 space-y-3" role="radiogroup" aria-label="Gender">
        {OPTS.map((o) => {
          const on = g === o.v
          return (
            <motion.button key={o.v} role="radio" aria-checked={on} whileTap={{ scale: 0.98 }} onClick={() => { buzz(6); setG(o.v) }}
              className={cx('flex h-16 w-full items-center gap-3 rounded-[20px] px-5 text-left text-[17px] font-semibold shadow-[var(--shadow-card)] transition-colors', on ? 'bg-navy text-white' : 'bg-white text-navy')}>
              <span className={cx('grid size-10 shrink-0 place-items-center rounded-full', on ? 'bg-white/15 text-white' : o.tint)} aria-hidden><o.Icon className="size-5" strokeWidth={2.2} /></span><span className="flex-1">{o.v}</span>
              {on && <Check className="size-5" strokeWidth={3} />}
            </motion.button>
          )
        })}
      </div>
      <div className="mt-auto pb-3 pt-8 safe-b">
        <p className="mb-3 text-center text-[12px] leading-5 text-muted">By continuing you agree to our <Link href="/app/help#privacy" className="font-semibold text-navy underline">privacy policy</Link>. Your answers are only shared with Jitendra Khimlani.</p>
        <Btn full variant="gradient" disabled={!g} onClick={finish}>Let’s go</Btn>
      </div>
    </OnboardShell>
  )
}
