'use client'
/** @module onboarding @owner CLIENT @screens Sign-up 2 of 3 · Birthdate (typed DD/MM/YYYY, 18+). */
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { OnboardShell } from '@/components/onboard-shell'
import { DateInput } from '@/components/date-input'
import { Btn } from '@/components/ui'
import { useApp } from '@/lib/store'
import { goSafe } from '@/lib/nav'

export default function DobStep() {
  const router = useRouter()
  const profile = useApp((s) => s.profile)
  const setProfile = useApp((s) => s.setProfile)
  const [dob, setDob] = useState(profile?.dob ?? '')
  const [touched, setTouched] = useState(false)
  const age = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / 31_557_600_000) : NaN
  const err = !dob ? 'Please add your date of birth' : age < 18 ? 'You need to be 18 or over. A parent can book for you' : age > 110 ? 'Please check the year' : ''
  const next = () => { setTouched(true); if (err) return; setProfile({ dob }); goSafe(router, '/onboarding/gender') }
  return (
    <OnboardShell step={2} title="When is your" em="birthday?" sub="It helps Jitendra Khimlani understand you better.">
      <label className={`mt-8 flex h-16 items-center gap-3 rounded-[20px] bg-white px-5 shadow-[var(--shadow-card)] ring-1 focus-within:ring-2 focus-within:ring-blue ${touched && err ? 'ring-rose' : 'ring-sky-200'}`}>
        <CalendarDays className="size-5 text-peri" aria-hidden />
        <DateInput value={dob} onChange={setDob} label="Date of birth (DD/MM/YYYY)" autoComplete="bday"
          className="w-full bg-transparent text-[18px] font-semibold tracking-[0.04em] text-navy outline-none placeholder:font-medium placeholder:text-[#b6bccb]" />
      </label>
      {touched && err && <p className="mt-2 text-[13px] text-rose" role="alert">{err}</p>}
      <div className="mt-auto pb-3 pt-8 safe-b"><Btn full variant="gradient" onClick={next}>Continue</Btn></div>
    </OnboardShell>
  )
}
