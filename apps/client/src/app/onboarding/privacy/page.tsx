'use client'
/** @module onboarding @owner CLIENT @screens CL-06 Your privacy — consents (crm.recordConsent). DPDP Act 2023. */
import { useRouter } from 'next/navigation'
import { goSafe } from '@/lib/nav'
import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'motion/react'
import { Check, Lock, MessageCircle, Sparkles } from 'lucide-react'
import { OnboardShell } from '@/components/onboard-shell'
import { Btn, Toggle, rise, stagger } from '@/components/ui'
import { useApp } from '@/lib/store'

export default function Privacy() {
  const router = useRouter()
  const profile = useApp((s) => s.profile)
  const setProfile = useApp((s) => s.setProfile)
  // @decision owner 2026-11-18: WhatsApp updates + gentle offers start ON (client can switch off here or in Me → Privacy).
  // ⚠ DPDP Act expects a clear affirmative act for consent — owner to confirm pre-ticked defaults with counsel before launch.
  const [c, setC] = useState(profile?.onboardedAt && profile.consents ? profile.consents : { wellbeing: true, whatsapp: true, offers: true })
  const rows = [
    { k: 'wellbeing' as const, icon: <Lock className="size-5" />, t: 'Keep my wellbeing data safe', d: 'Needed to use BeWise. Only you and Jitu Bhaiya see your answers and journal.', req: true },
    { k: 'whatsapp' as const, icon: <MessageCircle className="size-5" />, t: 'Updates on WhatsApp', d: 'Session reminders and order updates.' },
    { k: 'offers' as const, icon: <Sparkles className="size-5" />, t: 'Gentle offers', d: 'Now and then, never more than twice a month.' },
  ]
  return (
    <OnboardShell step={3} title="Your" em="privacy" sub="Plain and simple. Change these anytime in Me → Privacy.">
      <motion.div variants={stagger} initial="hidden" animate="show" className="card mt-7 divide-y divide-line px-5">
        {rows.map((r) => (
          <motion.div variants={rise} key={r.k} className="flex items-center gap-4 py-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-peri-50 text-navy">{r.icon}</span>
            <div className="flex-1">
              <p className="text-[15px] font-bold text-navy">{r.t}{r.req && <span className="ml-1.5 rounded-full bg-sage-100 px-2 py-0.5 text-[11px] font-semibold text-sage-text">Required</span>}</p>
              <p className="mt-0.5 text-[13px] leading-5 text-muted">{r.d}</p>
            </div>
            {r.req ? <span className="grid size-8 place-items-center rounded-full bg-sage-100 text-sage-text"><Check className="size-4" strokeWidth={3} aria-hidden /></span> : <Toggle label={r.t} on={c[r.k]} onChange={(v) => setC({ ...c, [r.k]: v })} />}
          </motion.div>
        ))}
      </motion.div>
      <p className="mt-4 text-center text-[13px] text-muted">Read our <Link href="/app/help#privacy" className="font-semibold text-navy underline underline-offset-2">privacy policy</Link></p>
      <div className="mt-auto pb-3 pt-8 safe-b">
        <Btn full variant="gradient" onClick={() => { setProfile({ consents: { ...c, wellbeing: true }, onboardedAt: new Date().toISOString() }); goSafe(router, '/onboarding/done', 'replace') }}>I agree</Btn>
      </div>
    </OnboardShell>
  )
}
