'use client'
/** @module onboarding @owner CLIENT @screens CL-05 About you — name, date of birth, city (gender optional). */
import { useRouter } from 'next/navigation'
import { goSafe } from '@/lib/nav'
import { useState } from 'react'
import { motion } from 'motion/react'
import { CalendarDays, MapPin, User } from 'lucide-react'
import { OnboardShell } from '@/components/onboard-shell'
import { Btn, Chip, rise, stagger } from '@/components/ui'
import { useApp } from '@/lib/store'

const CITIES = ['Vadodara', 'Ahmedabad', 'Mumbai', 'Surat', 'Pune', 'Bengaluru', 'Delhi']

export default function About() {
  const router = useRouter()
  const profile = useApp((s) => s.profile)
  const setProfile = useApp((s) => s.setProfile)
  const [name, setName] = useState(profile?.name ?? '')
  const [dob, setDob] = useState(profile?.dob ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [gender, setGender] = useState(profile?.gender ?? '')
  const [touched, setTouched] = useState(false)
  const age = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / 31_557_600_000) : NaN
  const errs = { name: name.trim().length < 2 ? 'Please tell us your name' : '', dob: !dob ? 'Please add your date of birth' : age < 18 ? 'You need to be 18 or over. A parent can book for you' : age > 110 ? 'Please check the year' : '', city: city.trim().length < 2 ? 'Please add your city' : '' }
  const ok = !errs.name && !errs.dob && !errs.city
  const next = () => { setTouched(true); if (!ok) return; setProfile({ name: name.trim(), dob, city: city.trim(), gender: gender || undefined }); goSafe(router, '/onboarding/photo') }

  return (
    <OnboardShell step={1} title="A little about" em="you" sub="So Jitu Bhaiya knows who he’s meeting.">
      <motion.div variants={stagger} initial="hidden" animate="show" className="mt-7 space-y-4">
        <motion.div variants={rise}><Field icon={<User className="size-5" />} label="Your name" err={touched ? errs.name : ''}>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Priya Shah" className="w-full bg-transparent text-[17px] font-semibold text-navy outline-none placeholder:font-medium placeholder:text-[#b6bccb]" />
        </Field></motion.div>
        <motion.div variants={rise}><Field icon={<CalendarDays className="size-5" />} label="Date of birth" err={touched ? errs.dob : ''}>
          <input type="date" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDob(e.target.value)} autoComplete="bday" className="w-full bg-transparent text-[17px] font-semibold text-navy outline-none" />
        </Field></motion.div>
        <motion.div variants={rise}><Field icon={<MapPin className="size-5" />} label="City" err={touched ? errs.city : ''}>
          <input value={city} onChange={(e) => setCity(e.target.value)} list="cities" autoComplete="address-level2" placeholder="Vadodara" className="w-full bg-transparent text-[17px] font-semibold text-navy outline-none placeholder:font-medium placeholder:text-[#b6bccb]" />
          <datalist id="cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
        </Field></motion.div>
        <motion.div variants={rise}>
          <p className="mb-2 mt-2 text-[13px] font-semibold text-navy">Gender <span className="font-normal text-muted">(optional)</span></p>
          <div className="flex flex-wrap gap-2">{['Woman', 'Man', 'Non-binary', 'Prefer not to say'].map((g) => <Chip key={g} on={gender === g} onClick={() => setGender(gender === g ? '' : g)}>{g}</Chip>)}</div>
        </motion.div>
      </motion.div>
      <div className="mt-auto pb-3 pt-8 safe-b"><Btn full variant="gradient" onClick={next}>Continue</Btn></div>
    </OnboardShell>
  )
}

function Field({ icon, label, err, children }: { icon: React.ReactNode; label: string; err?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold text-navy">{label}</span>
      <span className={`flex h-16 items-center gap-3 rounded-[20px] bg-white px-5 shadow-[var(--shadow-card)] ring-1 transition focus-within:ring-2 focus-within:ring-blue ${err ? 'ring-rose' : 'ring-sky-200'}`}>
        <span className="text-peri">{icon}</span>{children}
      </span>
      {err ? <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 block text-[13px] text-rose" role="alert">{err}</motion.span> : null}
    </label>
  )
}
