'use client'
/**
 * @module   booking
 * @owner    CLIENT (UI) · OWNER finance sends the link & owns Razorpay · CONSULTANT scheduling owns appointment states
 * @screens  Pay for a session booked by Jitu Bhaiya / Haresh — /app/pay?appointment=<id>  (owner 2026-11-18; consultant request §4)
 *           No slot picking. If payment lands after the hold expired → "Payment received — pick a new time" (K1 §4.3, point 8).
 */
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarCheck2, Check, Clock, Info, MapPin, Video } from 'lucide-react'
import { Suspense, useState } from 'react'
import { Mascot, Petals } from '@/components/brand'
import { PaySheet } from '@/components/pay-sheet'
import { AppHeader } from '@/components/shell'
import { TimePicker } from '@/components/time-picker'
import { Btn, ease, toast } from '@/components/ui'
import { CONSULTATIONS, STUDIO } from '@/lib/data'
import { useApp } from '@/lib/store'
import { fmtLongDay, fmtTime, formatINR } from '@/lib/format'
import { BP } from '@/lib/asset'

export default function Page() { return <Suspense><Pay /></Suspense> }

function Pay() {
  const router = useRouter()
  const id = useSearchParams().get('appointment') ?? ''
  const a = useApp((s) => s.appointments.find((x) => x.id === id))
  const pay = useApp((s) => s.payAppointment)
  const pickNewTime = useApp((s) => s.pickNewTime)
  const [paying, setPaying] = useState(false)
  const [slot, setSlot] = useState<Date>()
  const [done, setDone] = useState(false)

  if (!a) return (
    <main className="px-5 pb-32"><AppHeader back="/app" />
      <div className="card mt-6 p-8 text-center"><p className="text-[16px] font-bold text-navy">We couldn’t find this booking</p><p className="mt-1 text-[14px] text-muted">The link may be old. Please message us on WhatsApp and we’ll send a fresh one.</p></div>
    </main>
  )
  const c = CONSULTATIONS.find((x) => x.id === a.type)!
  const by = a.source === 'manager' ? 'The BeWise team' : 'Jitu Bhaiya'

  // ---- paid after the held time expired → pick a new time (no cost)
  if (a.needsNewTime) return (
    <main className="px-5 pb-40">
      <AppHeader back="/app" />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 flex items-start gap-3 rounded-[24px] bg-sage-100/80 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sage-text text-white"><Check className="size-5" strokeWidth={3} /></span>
        <div><p className="text-[16px] font-extrabold text-navy">{a.status === 'expired' ? 'Payment received. Pick a new time' : 'Choose your preferred time'}</p><p className="text-[13px] leading-5 text-sage-text">{a.status === 'expired' ? 'The time we were holding was released before the payment arrived. Choose any time below at no extra cost.' : 'Jitu Bhaiya or Haresh bhai will confirm it. If it doesn’t suit, our team will call you.'}</p></div>
      </motion.div>
      <div className="mt-5"><TimePicker slot={slot} setSlot={setSlot} /></div>
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] bg-gradient-to-t from-[#e6eee3] via-[#e6eee3]/95 to-transparent px-5 pb-3 pt-8 safe-b">
        <Btn full variant="gradient" disabled={!slot} onClick={() => { if (!slot) return; pickNewTime(a.id, slot.toISOString()); toast('Time requested. We’ll confirm soon'); router.replace(`/app/sessions/view?id=${a.id}`) }}>
          {slot ? `Request ${fmtLongDay(slot).split(',')[0]} · ${fmtTime(slot)}` : 'Choose a time'}
        </Btn>
      </div>
    </main>
  )

  // ---- already paid
  if ((a.paidAt || (a.status === 'confirmed' && !a.payLater)) && !done) return (
    <main className="px-5 pb-32"><AppHeader back="/app" />
      <div className="card mt-6 p-8 text-center"><CalendarCheck2 className="mx-auto size-10 text-sage" /><p className="mt-3 text-[17px] font-bold text-navy">This session is already paid</p>
        <Btn className="mt-5" size="md" onClick={() => router.replace(`/app/sessions/view?id=${a.id}`)}>View session</Btn></div>
    </main>
  )

  if (done) return (
    <main className="flex min-h-dvh flex-col px-5 safe-t">
      <Petals />
      <h1 className="h-duo mt-12 text-[36px]">{a.payLater ? <>Thank <em>you</em></> : <>You’re <em>booked</em></>}</h1>
      <motion.div className="mx-auto mt-4" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 13 }}><Mascot pose="wave" height={230} priority /></motion.div>
      <p className="mt-3 text-center text-[15px] text-muted">{fmtLongDay(a.startsAt)} · {fmtTime(a.startsAt)}</p>
      <div className="mt-auto pb-3 pt-6 safe-b"><Btn full onClick={() => router.replace(`/app/sessions/view?id=${a.id}`)}>View appointment</Btn></div>
    </main>
  )

  // ---- awaiting payment (or expired hold): pay without picking a slot
  return (
    <main className="px-5 pb-40">
      <AppHeader back="/app" />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="mt-2 flex items-center gap-3">
        <img src={`${BP}/img/jitu.webp`} alt="" className="size-16 shrink-0 rounded-[20px] bg-[linear-gradient(160deg,#e7ecfa,#f6efe4)] object-cover object-top" />
        <div><p className="text-[13px] font-semibold text-peri">{a.payLater ? 'Your session with Jitu Bhaiya' : `${by} booked this for you`}</p><h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-navy">{a.payLater ? <>Pay for your <span className="text-soft">session</span></> : <>Complete your <span className="text-soft">booking</span></>}</h1></div>
      </motion.div>
      <section className="card mt-5 p-5">
        {[
          { i: <Clock className="size-5" />, t: `${fmtLongDay(a.startsAt)} · ${fmtTime(a.startsAt)}` },
          { i: a.mode === 'online' ? <Video className="size-5" /> : <MapPin className="size-5" />, t: a.mode === 'online' ? 'Online · video call' : `In person · ${STUDIO.short}` },
          { i: <Check className="size-5" />, t: `${c.name} · remedy blend included` },
        ].map((r, k) => (
          <div key={k} className="flex items-center gap-3 border-b border-line py-3.5 last:border-0">
            <span className="grid size-10 place-items-center rounded-full bg-peri-50 text-navy">{r.i}</span><span className="text-[15px] font-semibold text-ink">{r.t}</span>
          </div>
        ))}
      </section>
      <div className="mt-4 flex items-start gap-3 rounded-[22px] bg-sage-100/70 p-4 text-[14px] leading-5 text-sage-text">
        <Info className="mt-0.5 size-5 shrink-0" /><p>Sessions are non-refundable, but you can reschedule free up to 24 h before.</p>
      </div>
      <AnimatePresence>
        {a.status === 'expired' && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 px-2 text-[13px] text-muted">The held time may have been released. If so, you’ll pick a new time right after paying, at no extra cost.</motion.p>
        )}
      </AnimatePresence>
      <div className="card mt-4 flex items-center justify-between p-5"><span className="text-[20px] font-extrabold text-navy">Total</span><span className="text-[30px] font-extrabold text-navy tnum">{formatINR(a.amountPaise)}</span></div>
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] bg-gradient-to-t from-[#e6eee3] via-[#e6eee3]/95 to-transparent px-5 pb-3 pt-8 safe-b">
        <Btn full variant="gradient" onClick={() => setPaying(true)}><span aria-hidden>🔒</span> Pay {formatINR(a.amountPaise)}</Btn>
        <p className="mt-2 text-center text-[12px] text-muted">Secured by Razorpay · UPI, cards, netbanking</p>
      </div>
      <PaySheet open={paying} amountPaise={a.amountPaise} purpose={`${c.name} · ${fmtTime(a.startsAt)}`} onClose={() => setPaying(false)}
        onPaid={() => { const late = a.status === 'expired'; pay(a.id); setPaying(false); if (!late) setDone(true) }} />
    </main>
  )
}
