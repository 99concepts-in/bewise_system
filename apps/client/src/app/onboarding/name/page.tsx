'use client'
/** @module onboarding @owner CLIENT @screens Sign-up 1 of 3 · Your name (owner 2026-11-24: name → birthdate → gender → home). Prefilled when we know the member. */
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { User } from 'lucide-react'
import { OnboardShell } from '@/components/onboard-shell'
import { Btn } from '@/components/ui'
import { useApp } from '@/lib/store'
import { goSafe } from '@/lib/nav'

export default function NameStep() {
  const router = useRouter()
  const profile = useApp((s) => s.profile)
  const setProfile = useApp((s) => s.setProfile)
  const [name, setName] = useState(profile?.name ?? '')
  const ok = name.trim().length >= 2
  const next = () => { if (!ok) return; setProfile({ name: name.trim().slice(0, 60) }); goSafe(router, '/onboarding/dob') }
  return (
    <OnboardShell step={1} title="What should we" em="call you?" sub={profile?.prefilledFrom ? 'Welcome back. We already have your details, please check them.' : 'So Jitendra Khimlani knows who he’s meeting.'}>
      <label className="mt-8 flex h-16 items-center gap-3 rounded-[20px] bg-white px-5 shadow-[var(--shadow-card)] ring-1 ring-sky-200 focus-within:ring-2 focus-within:ring-blue">
        <User className="size-5 text-peri" aria-hidden />
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') next() }} autoFocus autoComplete="name" placeholder="Your name" aria-label="Your name"
          className="w-full bg-transparent text-[18px] font-semibold text-navy outline-none placeholder:font-medium placeholder:text-[#b6bccb]" />
      </label>
      <div className="mt-auto pb-3 pt-8 safe-b"><Btn full variant="gradient" disabled={!ok} onClick={next}>Continue</Btn></div>
    </OnboardShell>
  )
}
