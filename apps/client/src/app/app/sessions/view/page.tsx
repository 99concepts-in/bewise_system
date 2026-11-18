'use client'
/**
 * @module   scheduling-ux
 * @owner    CLIENT
 * @screens  (route /app/sessions/view?id=…) CL-19 Appointment detail · CL-20 Waiting room · CL-21/22 Can't make it? (reschedule only, D-08/D-16) · CL-23 Feedback · CL-58 calendar
 */
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarPlus, Check, Clock, Droplets, FileText, Headphones, Laptop, MapPin, Sun, Video } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { Mascot, MoodImg } from '@/components/brand'
import { AppHeader } from '@/components/shell'
import { Btn, Chip, Sheet, buzz, cx, ease, spring, toast, useNow } from '@/components/ui'
import { CONSULTATIONS, STUDIO, istDate, slotsFor, type Emotion } from '@/lib/data'
import { useApp } from '@/lib/store'
import { addDays, fmtDay, fmtLongDay, fmtTime, formatINR, startOfDay } from '@/lib/format'
import { downloadIcs, sessionIcs } from '@/lib/ics'
import { BP } from '@/lib/asset'

export default function Page() { return <Suspense><Detail /></Suspense> }

function Detail() {
  const params = useSearchParams()
  const id = params.get('id') ?? ''
  const router = useRouter()
  const a = useApp((s) => s.appointments.find((x) => x.id === id))
  const now = useNow(1000)
  const [move, setMove] = useState(false)
  const [fb, setFb] = useState(params.get('feedback') === '1')
  if (!a) return <main className="px-5"><AppHeader back /><p className="mt-10 text-center text-muted">We couldn’t find that session.</p></main>
  const c = CONSULTATIONS.find((x) => x.id === a.type)!
  const start = +new Date(a.startsAt)
  const mins = Math.round((start - now) / 60_000)
  const past = a.status === 'completed' || now > start + c.minutes * 60_000
  const joinable = !past && mins <= 10
  const soon = !past && mins <= 60
  const ics = () => downloadIcs('bewise-session.ics', sessionIcs({ id: a.id, title: 'BeWise session with Jitu Bhaiya', start: a.startsAt, minutes: c.minutes, location: a.mode === 'online' ? 'Online — link in the BeWise app' : `${STUDIO.name}, ${STUDIO.full}`, description: c.name }))

  return (
    <main className="px-5 pb-36">
      <AppHeader back="/app/sessions" title={a.code} />
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
        className={cx('relative mt-2 overflow-hidden rounded-[30px] p-6', past ? 'bg-white shadow-[var(--shadow-card)]' : 'bg-[linear-gradient(140deg,#182957,#3c5596_60%,#5e7fb8)] text-white shadow-[var(--shadow-float)]')}>
        {!past && <motion.span className="absolute -right-10 -top-10 size-48 rounded-full bg-white/10" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 5, repeat: Infinity }} />}
        <p className={cx('text-[13px] font-semibold', past ? 'text-peri' : 'text-white/70')}>{past ? 'Completed' : soon ? 'Starting soon' : 'Upcoming'}</p>
        <p className="mt-1 text-[30px] font-extrabold leading-tight tracking-[-0.02em]">{fmtTime(a.startsAt)}</p>
        <p className={cx('text-[16px] font-semibold', past ? 'text-navy' : 'text-white/90')}>{fmtLongDay(a.startsAt)}</p>
        {!past && (
          <div className="mt-4 flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[14px] backdrop-blur" aria-live="polite">
            <Clock className="size-4" />
            {mins > 1440 ? `In ${Math.round(mins / 1440)} days` : mins > 60 ? `In ${Math.floor(mins / 60)} h ${mins % 60} min` : mins > 0 ? `Your session begins in ${mins} min` : 'Happening now'}
          </div>
        )}
      </motion.section>

      <div className="mt-4 space-y-3">
        <div className="card divide-y divide-line px-5">
          <Row icon={<img src={`${BP}/img/jitu.webp`} alt="" className="size-10 rounded-full object-cover" />} t="Jitu Bhaiya" d="Bach Remedy Therapist" />
          <Row icon={<span className="grid size-10 place-items-center rounded-full bg-peri-50 text-navy">{a.mode === 'online' ? <Laptop className="size-5" /> : <MapPin className="size-5" />}</span>} t={c.name} d={a.mode === 'online' ? 'Online video call' : STUDIO.full} />
          <Row icon={<span className="grid size-10 place-items-center rounded-full bg-peri-50 text-navy"><FileText className="size-5" /></span>} t={`Paid ${formatINR(a.amountPaise)}`} d="Remedy blend included · receipt in Payments" />
        </div>

        {!past && (
          <div className="card p-5">
            <p className="h-section">Before you begin</p>
            <ul className="mt-3 space-y-3">
              {[{ i: <Headphones className="size-5" />, t: 'Find a quiet, private spot' }, { i: <Droplets className="size-5" />, t: 'Keep a glass of water nearby' }, { i: <Sun className="size-5" />, t: 'Take three slow breaths before you join' }].map((x, k) => (
                <motion.li key={k} className="flex items-center gap-3 text-[15px] text-ink" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + k * 0.07 }}>
                  <span className="grid size-9 place-items-center rounded-full bg-sage-100 text-sage-text">{x.i}</span>{x.t}
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {past && (
          <div className="card p-5">
            <p className="h-section">How was your session?</p>
            {a.feedback ? (
              <div className="mt-3 flex items-center gap-3"><MoodImg mood={RATING[a.feedback.rating - 1]} size={44} /><p className="flex-1 text-[14px] text-muted">{a.feedback.tags.join(' · ') || 'Thank you for sharing.'}</p><button onClick={() => setFb(true)} className="text-[14px] font-semibold text-navy underline underline-offset-4">Edit</button></div>
            ) : (
              <><p className="mt-1 text-[14px] text-muted">Your notes go straight to Jitu Bhaiya.</p><Btn size="md" className="mt-4" onClick={() => setFb(true)}>Share feedback</Btn></>
            )}
          </div>
        )}
      </div>

      {!past && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] space-y-2.5 bg-gradient-to-t from-[#e6eee3] via-[#e6eee3]/95 to-transparent px-5 pb-3 pt-8 safe-b">
          {a.mode === 'online'
            ? <Btn full variant={joinable ? 'gradient' : 'primary'} disabled={!joinable} onClick={() => toast('The video link opens here at session time')}><Video className="size-5" /> {joinable ? 'Join session' : 'Join opens 10 min before'}</Btn>
            : <Btn full variant="gradient" onClick={() => window.open(STUDIO.directionsUrl, '_blank', 'noopener')}><MapPin className="size-5" /> Directions</Btn>}
          <div className="flex gap-2.5">
            <Btn full size="md" variant="white" onClick={ics}><CalendarPlus className="size-4" /> Calendar</Btn>
            <Btn full size="md" variant="white" onClick={() => setMove(true)}>Can’t make it?</Btn>
          </div>
        </div>
      )}

      <RescheduleSheet open={move} onClose={() => setMove(false)} id={a.id} startsAt={a.startsAt} used={a.rescheduled ?? 0} />
      <FeedbackSheet open={fb} onClose={() => { setFb(false); if (params.get('feedback')) router.replace(`/app/sessions/view?id=${a.id}`) }} id={a.id} />
    </main>
  )
}

function Row({ icon, t, d }: { icon: React.ReactNode; t: string; d: string }) {
  return <div className="flex items-center gap-3 py-3.5">{icon}<div><p className="text-[15px] font-bold text-navy">{t}</p><p className="text-[13px] text-muted">{d}</p></div></div>
}

function RescheduleSheet({ open, onClose, id, startsAt, used }: { open: boolean; onClose: () => void; id: string; startsAt: string; used: number }) {
  const reschedule = useApp((s) => s.reschedule)
  const hoursLeft = (+new Date(startsAt) - Date.now()) / 3600_000
  const late = hoursLeft < 24
  const blocked = late && used >= 1
  const opts = Array.from({ length: 10 }, (_, i) => addDays(startOfDay(), i + 1)).flatMap((d) => slotsFor(d).slice(0, 2).map((t) => istDate(d, t))).slice(0, 8)
  const [pick, setPick] = useState<Date>()
  useEffect(() => { if (open) setPick(undefined) }, [open])
  return (
    <Sheet open={open} onClose={onClose} title="Can’t make it?">
      <h2 className="h-duo text-[26px]">Can’t make <em>it?</em></h2>
      <p className="mt-2 text-[14px] leading-5 text-muted">Sessions are non-refundable, but you can move yours to another time.</p>
      <div className={cx('mt-3 rounded-[18px] p-3 text-[13px] font-semibold', blocked ? 'bg-rose-50 text-rose' : 'bg-sage-100 text-sage-text')}>
        {blocked ? 'You’ve already moved this session once within 24 hours. Please message us on WhatsApp.' : late ? 'Less than 24 h to go — you can move it once.' : 'Free to reschedule — more than 24 h to go.'}
      </div>
      {!blocked && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {opts.map((d) => {
              const on = pick && +pick === +d
              return (
                <button key={+d} onClick={() => { buzz(5); setPick(d) }} aria-pressed={!!on} className={cx('relative rounded-[18px] px-3 py-3 text-left', on ? 'text-white' : 'bg-peri-50 text-navy')}>
                  {on && <motion.span layoutId="rs-pill" transition={spring} className="absolute inset-0 rounded-[18px] bg-navy" />}
                  <span className="relative block text-[13px] font-semibold opacity-80">{fmtDay(d)}</span><span className="relative text-[16px] font-bold">{fmtTime(d)}</span>
                </button>
              )
            })}
          </div>
          <Btn full className="mt-5" disabled={!pick} onClick={() => { if (!pick) return; reschedule(id, pick.toISOString()); toast(`Moved to ${fmtDay(pick)} · ${fmtTime(pick)}`); onClose() }}>Move my session</Btn>
        </>
      )}
    </Sheet>
  )
}

const RATING: Emotion[] = ['sad', 'tired', 'calm', 'grateful', 'joyful']
const TAGS = ['Felt heard', 'Clear guidance', 'Calming', 'Warm', 'Too short', 'Hard to connect']
function FeedbackSheet({ open, onClose, id }: { open: boolean; onClose: () => void; id: string }) {
  const existing = useApp((s) => s.appointments.find((x) => x.id === id)?.feedback)
  const give = useApp((s) => s.giveFeedback)
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [tags, setTags] = useState<string[]>(existing?.tags ?? [])
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [sent, setSent] = useState(false)
  useEffect(() => { if (open) setSent(false) }, [open])
  return (
    <Sheet open={open} onClose={onClose} title="How was your session?" tall>
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-6 text-center">
            <Mascot pose="wave" height={160} />
            <p className="mt-3 text-[22px] font-extrabold text-navy">Thank you</p>
            <p className="mt-1 text-[14px] text-muted">Jitu Bhaiya will read this. You can edit it anytime.</p>
            <Btn className="mt-6" onClick={onClose}>Done</Btn>
          </motion.div>
        ) : (
          <motion.div key="form" exit={{ opacity: 0 }}>
            <h2 className="h-duo text-[26px]">How was your <em>session?</em></h2>
            <div className="mt-5 flex justify-between">
              {RATING.map((m, i) => (
                <motion.button key={m} whileTap={{ scale: 0.85 }} aria-label={`${i + 1} of 5`} aria-pressed={rating === i + 1} onClick={() => { buzz(8); setRating(i + 1) }}
                  animate={{ scale: rating === i + 1 ? 1.15 : rating ? 0.9 : 1, opacity: rating && rating !== i + 1 ? 0.5 : 1 }} transition={spring}>
                  <MoodImg mood={m} size={54} />
                </motion.button>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">{TAGS.map((t) => <Chip key={t} on={tags.includes(t)} onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}>{t}</Chip>)}</div>
            <label className="mt-5 block text-[15px] font-bold text-navy" htmlFor="fbnotes">Notes for Jitu Bhaiya</label>
            <textarea id="fbnotes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 800))} placeholder="Anything you’d like him to know…" className="mt-2 w-full resize-none rounded-[20px] bg-peri-50/70 p-4 text-[15px] outline-none focus:ring-2 focus:ring-navy" />
            <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-muted"><Check className="size-3.5" /> Visible only to your consultant</p>
            <Btn full className="mt-5" disabled={!rating} onClick={() => { give(id, { rating, tags, notes }); setSent(true); buzz(20) }}>Send to Jitu Bhaiya</Btn>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  )
}
