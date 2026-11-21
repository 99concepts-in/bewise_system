'use client'
/**
 * @module   client-me
 * @owner    CLIENT
 * @screens  CL-46 Me · CL-47 Personal details · CL-49 Reminders & notifications (CL-58 calendar auto-add) · CL-50 Privacy & data
 * @sensitive profile, photo, consents, data export / delete (DPDP)
 * v5 (HUB 2026-11-20): Reminders now has "Reminders on this phone" (notification permission, asked only on Yes; on iPhone
 *   only once BeWise is on the home screen) — the same switch the post-booking prompt sets.
 */
import { goSafe } from '@/lib/nav'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Bell, BookHeart, Camera, CalendarDays, ChevronRight, Download, FlaskConical, HelpCircle, LogOut, Package, Shield, Target, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { canAskNotifications, disableReminders, enableReminders, isIOS, isStandalone, remindersPref } from '@/components/prompts'
import { Avatar } from '@/components/brand'
import { PhotoCapture } from '@/components/camera'
import { AppHeader } from '@/components/shell'
import { Btn, Item, Reveal, Sheet, Toggle, toast } from '@/components/ui'
import { useApp } from '@/lib/store'
import { fmtIso } from '@/lib/format'
import { BP } from '@/lib/asset'

export default function Me() {
  const router = useRouter()
  const s = useApp()
  const p = s.profile!
  const [sheet, setSheet] = useState<null | 'photo' | 'details' | 'reminders' | 'privacy' | 'signout'>(null)
  const tiles = [
    { href: '/app/sessions', icon: <CalendarDays className="size-5" />, t: 'Sessions', n: s.appointments.length },
    { href: '/app/orders', icon: <Package className="size-5" />, t: 'Orders', n: s.orders.length },
    { href: '/app/journal', icon: <BookHeart className="size-5" />, t: 'Journal', n: s.journal.length },
    { href: '/app/goals', icon: <Target className="size-5" />, t: 'Goals', n: s.goals.length },
  ]
  const rows = [
    { k: 'details' as const, icon: <UserRound className="size-5" />, t: 'Personal details' },
    { k: 'reminders' as const, icon: <Bell className="size-5" />, t: 'Reminders & notifications' },
    { k: 'privacy' as const, icon: <Shield className="size-5" />, t: 'Privacy & data' },
  ]
  return (
    <main className="px-5 pb-32">
      <AppHeader right={<span />} />
      <Reveal className="space-y-4">
        <Item className="flex flex-col items-center pt-2 text-center">
          <motion.button onClick={() => setSheet('photo')} whileTap={{ scale: 0.96 }} className="relative" aria-label="Change photo">
            <span className="absolute inset-[-8px] rounded-full bg-[conic-gradient(from_180deg,#F2A93B,#EE7F5F,#E06A8E,#8E74DB,#3E9BE6,#2FA39A,#F2A93B)] opacity-90" />
            <span className="relative block rounded-full bg-white p-1"><Avatar photo={p.photo} name={p.name} size={112} /></span>
            <span className="absolute bottom-1 right-1 grid size-9 place-items-center rounded-full bg-navy text-white ring-4 ring-white"><Camera className="size-4" /></span>
          </motion.button>
          <h1 className="mt-4 font-display text-[28px] font-semibold text-ink">{p.name}</h1>
          <p className="text-[14px] text-muted">+91 {p.phone.slice(0, 5)} {p.phone.slice(5)} · {p.city}</p>
        </Item>
        <Item className="grid grid-cols-4 gap-2">
          {tiles.map((t) => (
            <Link key={t.href} href={t.href} className="card flex flex-col items-center gap-1.5 px-1 py-4">
              <span className="grid size-10 place-items-center rounded-full bg-peri-50 text-navy">{t.icon}</span>
              <span className="text-[12px] font-semibold text-navy">{t.t}</span>
            </Link>
          ))}
        </Item>
        <Item className="card divide-y divide-line px-4">
          {rows.map((r) => (
            <button key={r.k} onClick={() => setSheet(r.k)} className="flex w-full items-center gap-3 py-4 text-left">
              <span className="grid size-10 place-items-center rounded-full bg-peri-50 text-navy">{r.icon}</span><span className="flex-1 text-[15px] font-semibold text-navy">{r.t}</span><ChevronRight className="size-5 text-soft" />
            </button>
          ))}
          <Link href="/app/help" className="flex w-full items-center gap-3 py-4"><span className="grid size-10 place-items-center rounded-full bg-peri-50 text-navy"><HelpCircle className="size-5" /></span><span className="flex-1 text-[15px] font-semibold text-navy">Help & policies</span><ChevronRight className="size-5 text-soft" /></Link>
        </Item>
        <Item className="card flex items-center gap-3 p-4">
          <span className="grid size-10 place-items-center rounded-full bg-marigold-100 text-ink"><FlaskConical className="size-5" /></span>
          <div className="flex-1"><p className="text-[15px] font-semibold text-navy">Explore with sample data</p><p className="text-[12px] text-muted">Preview a returning client: blend, sessions, journal, orders</p></div>
          <Btn size="sm" variant="sage" onClick={() => { s.loadDemo(); toast('Sample journey loaded'); goSafe(router, '/app') }}>Load</Btn>
        </Item>
        <Item className="card p-4">
          <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-muted">Preview tools</p>
          <p className="mt-1 text-[12px] text-muted">See what a client receives when Jitendra Khimlani or Haresh books for them.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Btn size="sm" variant="white" onClick={() => { const a = s.simulateStaffBooking(); goSafe(router, `/app/pay?appointment=${a.id}`) }}>Booking from Jitendra Khimlani</Btn>
            <Btn size="sm" variant="white" onClick={() => { const a = s.simulateStaffBooking(true); goSafe(router, `/app/pay?appointment=${a.id}`) }}>…paid after hold expired</Btn>
            <Btn size="sm" variant="white" onClick={() => { const a = s.appointments.find((x) => x.timeRequested); if (a) { s.confirmTime(a.id); toast('Time confirmed by the team') } else toast('No time waiting for confirmation') }}>Team confirms my time</Btn>
          </div>
        </Item>
        <Item><Btn full variant="ghost" size="md" onClick={() => setSheet('signout')}><LogOut className="size-4" /> Sign out</Btn></Item>
        <Item><img src={`${BP}/img/brand/bewise-logo-horizontal.svg`} alt="BeWise · Holistic Wellness" className="mx-auto h-7 w-auto opacity-80" /><p className="pb-2 pt-1.5 text-center text-[11px] text-muted">Preview build</p></Item>
      </Reveal>

      <Sheet open={sheet === 'photo'} onClose={() => setSheet(null)} title="Your photo" tall>
        <h2 className="h-duo text-[26px]">Your <em>photo</em></h2>
        <PhotoCapture initial={p.photo} onDone={(photo) => { s.setProfile({ photo }); setSheet(null); toast('Photo updated') }} onSkip={p.photo ? () => { s.setProfile({ photo: undefined }); setSheet(null); toast('Photo removed') } : undefined} skipLabel="Remove photo" />
      </Sheet>
      <DetailsSheet open={sheet === 'details'} onClose={() => setSheet(null)} />
      <RemindersSheet open={sheet === 'reminders'} onClose={() => setSheet(null)} />
      <PrivacySheet open={sheet === 'privacy'} onClose={() => setSheet(null)} />
      <Sheet open={sheet === 'signout'} onClose={() => setSheet(null)} title="Sign out">
        <h2 className="h-duo text-[24px]">Sign <em>out?</em></h2>
        <p className="mt-2 text-[14px] leading-6 text-muted">In this preview your data lives only on this phone, so signing out clears it.</p>
        <div className="mt-5 flex gap-3 pb-1"><Btn full variant="white" size="md" onClick={() => setSheet(null)}>Stay</Btn><Btn full size="md" onClick={() => { s.resetAll(); router.replace('/welcome') }}>Sign out</Btn></div>
      </Sheet>
    </main>
  )
}

function DetailsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const p = useApp((s) => s.profile)!
  const set = useApp((s) => s.setProfile)
  const [f, setF] = useState({ name: p.name, city: p.city, allergies: p.allergies.join(', ') })
  return (
    <Sheet open={open} onClose={onClose} title="Personal details">
      <h2 className="h-duo text-[26px]">Personal <em>details</em></h2>
      <div className="mt-4 space-y-3">
        {([['name', 'Name'], ['city', 'City'], ['allergies', 'Allergies (for product warnings)']] as const).map(([k, l]) => (
          <label key={k} className="block"><span className="mb-1 block px-1 text-[12px] font-semibold text-muted">{l}</span>
            <input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="h-12 w-full rounded-[16px] bg-peri-50 px-4 text-[15px] font-semibold text-navy outline-none focus:ring-2 focus:ring-blue" /></label>
        ))}
        <p className="px-1 text-[12px] text-muted">Phone: +91 {p.phone} · date of birth {fmtIso(p.dob)}</p>
      </div>
      <Btn full className="mt-5" onClick={() => { set({ name: f.name.trim() || p.name, city: f.city.trim() || p.city, allergies: f.allergies.toLowerCase().split(/[,\s]+/).filter(Boolean) }); toast('Details saved'); onClose() }}>Save</Btn>
    </Sheet>
  )
}

function RemindersSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const p = useApp((s) => s.profile)!
  const set = useApp((s) => s.setProfile)
  const [r, setR] = useState({ ritual: true, sessions: true, calendar: false, whatsapp: p.consents.whatsapp })
  const [phone, setPhone] = useState(() => remindersPref() === 'on')
  const blocked = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied'
  const needsInstall = typeof window !== 'undefined' && isIOS() && !isStandalone()
  const togglePhone = async (v: boolean) => {
    setPhone(v)
    if (!v) { disableReminders(); toast('Reminders on this phone are off'); return }
    const ok = await enableReminders()
    if (!ok) toast(needsInstall ? 'Add BeWise to your home screen first, then turn this on' : blocked || !canAskNotifications() ? 'Allow notifications for BeWise in your phone settings' : 'We’ll remind you when we can')
  }
  const rows = [['ritual', 'Ritual reminders', 'At your drop times'], ['sessions', 'Session reminders', 'A day before and 30 min before'], ['calendar', 'Add sessions to my calendar', 'Automatically, when you book'], ['whatsapp', 'WhatsApp updates', 'Reminders and order updates']] as const
  return (
    <Sheet open={open} onClose={onClose} title="Reminders">
      <h2 className="h-duo text-[26px]">Reminders & <em>updates</em></h2>
      <p className="mt-1 text-[14px] text-ink-2">Gentle, never noisy. Change these any time.</p>
      <div className="mt-3 divide-y divide-line">
        <div className="flex items-center gap-3 py-4">
          <div className="flex-1"><p className="text-[15px] font-semibold text-ink">Reminders on this phone</p><p className="text-[13px] text-ink-2">{needsInstall ? 'Works once BeWise is on your home screen' : blocked ? 'Notifications are blocked in your phone settings' : 'A gentle nudge before sessions and drops'}</p></div>
          <Toggle label="Reminders on this phone" on={phone} onChange={togglePhone} />
        </div>
        {rows.map(([k, t, d]) => (
          <div key={k} className="flex items-center gap-3 py-4"><div className="flex-1"><p className="text-[15px] font-semibold text-navy">{t}</p><p className="text-[13px] text-muted">{d}</p></div><Toggle label={t} on={r[k]} onChange={(v) => setR({ ...r, [k]: v })} /></div>
        ))}
      </div>
      <Btn full className="mt-3" onClick={() => { set({ consents: { ...p.consents, whatsapp: r.whatsapp } }); toast('Preferences saved'); onClose() }}>Save</Btn>
    </Sheet>
  )
}

function PrivacySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const s = useApp()
  const p = s.profile!
  const [share, setShare] = useState(true)
  const [offers, setOffers] = useState(p.consents.offers)
  const [confirm, setConfirm] = useState(false)
  const download = () => {
    const clean = Object.fromEntries(Object.entries(useApp.getState()).filter(([k, v]) => typeof v !== 'function' && k !== 'hydrated'))
    const url = URL.createObjectURL(new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...clean }, null, 2)], { type: 'application/json' }))
    Object.assign(document.createElement('a'), { href: url, download: 'bewise-my-data.json' }).click(); setTimeout(() => URL.revokeObjectURL(url), 2000)
    toast('Your data is downloading')
  }
  return (
    <Sheet open={open} onClose={() => { setConfirm(false); onClose() }} title="Privacy & data" tall>
      <h2 className="h-duo text-[26px]">Privacy & <em>data</em></h2>
      <div className="mt-3 divide-y divide-line">
        <div className="flex items-center gap-3 py-4"><div className="flex-1"><p className="text-[15px] font-semibold text-navy">Share my journal with Jitendra Khimlani</p><p className="text-[13px] text-muted">Emotions and times only. Helps your sessions</p></div><Toggle label="Share journal" on={share} onChange={setShare} /></div>
        <div className="flex items-center gap-3 py-4"><div className="flex-1"><p className="text-[15px] font-semibold text-navy">Gentle offers</p><p className="text-[13px] text-muted">Never more than twice a month</p></div><Toggle label="Gentle offers" on={offers} onChange={(v) => { setOffers(v); s.setProfile({ consents: { ...p.consents, offers: v } }) }} /></div>
      </div>
      <div className="mt-2 space-y-2.5">
        <Btn full variant="white" size="md" onClick={download}><Download className="size-4" /> Download my data</Btn>
        {!confirm ? (
          <Btn full variant="ghost" size="md" className="text-rose" onClick={() => setConfirm(true)}><Trash2 className="size-4" /> Delete my account & data</Btn>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[20px] bg-rose-50 p-4">
            <p className="text-[14px] font-semibold text-rose">This permanently deletes your profile, photo, answers, journal and chats from this device.</p>
            <div className="mt-3 flex gap-2"><Btn full size="sm" variant="white" onClick={() => setConfirm(false)}>Keep</Btn><Btn full size="sm" className="bg-rose! shadow-none" onClick={() => { s.resetAll(); router.replace('/welcome') }}>Delete everything</Btn></div>
          </motion.div>
        )}
      </div>
      <p className="mt-4 text-center text-[12px] text-muted">We follow India’s Digital Personal Data Protection Act, 2023.</p>
    </Sheet>
  )
}
