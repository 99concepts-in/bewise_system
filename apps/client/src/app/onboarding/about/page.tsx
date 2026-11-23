'use client'
/** @module onboarding @owner CLIENT @screens CL-05 About you — name, date of birth, city, gender (optional), reference (optional).
 *  owner 2026-11-23: details we already have (booking link, or a booking made by Jitendra Khimlani / the team) arrive filled in, editable. */
import { useRouter } from 'next/navigation'
import { goSafe } from '@/lib/nav'
import { useState } from 'react'
import { motion } from 'motion/react'
import { CalendarDays, MapPin, User } from 'lucide-react'
import { OnboardShell } from '@/components/onboard-shell'
import { DateInput } from '@/components/date-input'
import { Btn, Chip, rise, stagger } from '@/components/ui'
import { useApp } from '@/lib/store'

const CITIES = ['Vadodara', 'Ahmedabad', 'Mumbai', 'Surat', 'Pune', 'Bengaluru', 'Delhi']
// owner 2026-11-23: sign-up adds "reference" (how they heard of us / who referred them)
const REFS = ['Jitendra Khimlani', 'Someone I know', 'Instagram', 'Google', 'A workshop', 'Other']

export default function About() {
  const router = useRouter()
  const profile = useApp((s) => s.profile)
  const setProfile = useApp((s) => s.setProfile)
  const [name, setName] = useState(profile?.name ?? '')
  const [dob, setDob] = useState(profile?.dob ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [gender, setGender] = useState(profile?.gender ?? '')
  const [heard, setHeard] = useState(() => (REFS.includes(profile?.reference ?? '') ? profile!.reference! : profile?.reference ? 'Someone I know' : ''))
  const [refName, setRefName] = useState(() => (profile?.reference && !REFS.includes(profile.reference) ? profile.reference : ''))
  const prefilled = profile?.prefilledFrom
  const [touched, setTouched] = useState(false)
  const age = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / 31_557_600_000) : NaN
  const errs = { name: name.trim().length < 2 ? 'Please tell us your name' : '', dob: !dob ? 'Please add your date of birth' : age < 18 ? 'You need to be 18 or over. A parent can book for you' : age > 110 ? 'Please check the year' : '', city: city.trim().length < 2 ? 'Please add your city' : '' }
  const ok = !errs.name && !errs.dob && !errs.city
  const next = () => { setTouched(true); if (!ok) return; setProfile({ name: name.trim(), dob, city: city.trim(), gender: gender || undefined, reference: (heard === 'Someone I know' ? refName.trim() || heard : heard) || undefined, prefilledFrom: undefined }); goSafe(router, '/onboarding/photo') }

  return (
    <OnboardShell step={1} title="A little about" em="you" sub="So Jitendra Khimlani knows who he’s meeting.">
      {prefilled && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 flex items-start gap-3 rounded-[20px] bg-teal-100 p-4 text-[14px] leading-5 text-sage-text" role="status">
          <span className="text-[20px]" aria-hidden>🌿</span>
          <p><b>Welcome back.</b> {prefilled === 'staff' ? 'Jitendra Khimlani’s team already added your details.' : 'We have your details from your session booking.'} Please check them; you can change anything.</p>
        </motion.div>
      )}
      <motion.div variants={stagger} initial="hidden" animate="show" className="mt-7 space-y-4">
        <motion.div variants={rise}><Field icon={<User className="size-5" />} label="Your name" err={touched ? errs.name : ''}>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Priya Shah" className="w-full bg-transparent text-[17px] font-semibold text-navy outline-none placeholder:font-medium placeholder:text-[#b6bccb]" />
        </Field></motion.div>
        <motion.div variants={rise}><Field icon={<CalendarDays className="size-5" />} label="Date of birth" err={touched ? errs.dob : ''}>
          <DateInput value={dob} onChange={setDob} label="Date of birth (DD/MM/YYYY)" autoComplete="bday" className="w-full bg-transparent text-[17px] font-semibold tracking-[0.04em] text-navy outline-none placeholder:font-medium placeholder:text-[#b6bccb]" />
        </Field></motion.div>
        <motion.div variants={rise}><Field icon={<MapPin className="size-5" />} label="City" err={touched ? errs.city : ''}>
          <input value={city} onChange={(e) => setCity(e.target.value)} list="cities" autoComplete="address-level2" placeholder="Vadodara" className="w-full bg-transparent text-[17px] font-semibold text-navy outline-none placeholder:font-medium placeholder:text-[#b6bccb]" />
          <datalist id="cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
        </Field></motion.div>
        <motion.div variants={rise}>
          <p className="mb-2 mt-2 text-[13px] font-semibold text-navy">Gender <span className="font-normal text-muted">(optional)</span></p>
          <div className="flex flex-wrap gap-2">{['Male', 'Female', 'Prefer not to say'].map((g) => <Chip key={g} on={gender === g} onClick={() => setGender(gender === g ? '' : g)}>{g}</Chip>)}</div>
        </motion.div>
        <motion.div variants={rise}>
          <p className="mb-2 mt-2 text-[13px] font-semibold text-navy">How did you hear about us? <span className="font-normal text-muted">(optional)</span></p>
          <div className="flex flex-wrap gap-2">{REFS.map((r) => <Chip key={r} on={heard === r} onClick={() => setHeard(heard === r ? '' : r)}>{r}</Chip>)}</div>
          {heard === 'Someone I know' && (
            <input value={refName} onChange={(e) => setRefName(e.target.value.slice(0, 60))} placeholder="Their name (optional)" aria-label="Who referred you"
              className="mt-3 h-12 w-full rounded-full bg-white px-4 text-[16px] text-navy shadow-[var(--shadow-card)] outline-none ring-1 ring-sky-200 focus:ring-2 focus:ring-blue" />
          )}
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
