'use client'
/**
 * @module   booking
 * @owner    CLIENT
 * @screens  CL-11 Choose · CL-12 Meet your consultant · IN-01…IN-11 · IN-12 · CL-13 Mode · CL-14 Time · CL-16 Review & pay · CL-17 Booked
 * Spec:     docs/specs/client/C3-booking-wizard.md
 * @stub     scheduling.holdAppointment / finance.createCheckout are simulated in the preview (flags booking, checkout).
 */
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarPlus, Check, ChevronLeft, ChevronRight, Clock, ExternalLink, Info, Laptop, MapPin, Quote, Sparkles, Video } from 'lucide-react'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Mascot, Petals } from '@/components/brand'
import { PaySheet } from '@/components/pay-sheet'
import { AppHeader, useUi } from '@/components/shell'
import { Btn, IconBtn, ProgressBar, Sheet, buzz, cx, ease, spring, toast, useStableCallback } from '@/components/ui'
import { CONSULTANT, CONSULTATIONS, NUANCE, TESTIMONIALS, TESTIMONIALS_SOURCE, istDate, slotsFor, type ConsultationId } from '@/lib/data'
import { emptyIntake, useApp, type Appointment, type IntakeAnswers } from '@/lib/store'
import { addDays, fmtLongDay, fmtMonth, fmtTime, formatINR, startOfDay } from '@/lib/format'
import { downloadIcs, googleCalUrl, sessionIcs } from '@/lib/ics'
import * as I from './intake'
import { BP } from '@/lib/asset'

const INTAKE = ['intro', 'who', 'feelings', 'nuance', 'body', 'sleep', 'life', 'safety', 'gentle', 'goals', 'review', 'saved'] as const
const COUNTED = ['who', 'feelings', 'nuance', 'body', 'sleep', 'life', 'safety', 'gentle']
const CHECKIN = ['ck-now', 'ck-changes', 'ck-news'] as const
type Step = 'choose' | (typeof INTAKE)[number] | (typeof CHECKIN)[number] | 'mode' | 'time' | 'pay' | 'done'

export default function BookPage() { return <Suspense><Book /></Suspense> }

function Book() {
  const router = useRouter()
  const params = useSearchParams()
  const setNavHidden = useUi((s) => s.setNavHidden)
  const intake = useApp((s) => s.intake)
  const saveIntake = useApp((s) => s.saveIntake)
  const submitIntake = useApp((s) => s.submitIntake)
  const book = useApp((s) => s.book)
  const hasHistory = useApp((s) => s.appointments.length > 0 || !!s.blend)

  const [type, setType] = useState<ConsultationId | null>((params.get('type') as ConsultationId) || null)
  const [step, setStep] = useState<Step>('choose')
  const [dir, setDir] = useState(1)
  const [answers, setAnswers] = useState<IntakeAnswers>(() => intake?.answers ?? emptyIntake())
  const [checkin, setCheckin] = useState<I.Checkin>({ changes: {}, news: '' })
  const [mode, setMode] = useState<'online' | 'in_person'>()
  const [slot, setSlot] = useState<Date>()
  const [paying, setPaying] = useState(false)
  const [booked, setBooked] = useState<Appointment>()
  const [meet, setMeet] = useState(false)
  const [stories, setStories] = useState(false)
  const [holdUntil, setHoldUntil] = useState(0)

  // decided once per visit: submitting the intake mid-flow must not remove the steps we're standing on
  const [needIntake] = useState(() => !intake?.submittedAt)
  const flow: Step[] = useMemo(() => {
    if (type === 'followup') return ['choose', ...CHECKIN, 'mode', 'time', 'pay', 'done']
    return ['choose', ...(needIntake ? INTAKE : []), 'mode', 'time', 'pay', 'done'] as Step[]
  }, [type, needIntake])

  useEffect(() => { setNavHidden(step !== 'choose'); return () => setNavHidden(false) }, [step, setNavHidden])
  useEffect(() => {
    if (params.get('resume') && intake && !intake.submittedAt && intake.step > 0) { setType('first'); setStep(INTAKE[Math.min(intake.step, INTAKE.length - 1)]) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [step])

  const go = (s: Step, d = 1) => { setDir(d); setStep(s) }
  const idx = flow.indexOf(step)
  const next = () => {
    const n = flow[idx + 1]
    if (INTAKE.includes(step as never)) saveIntake(answers, INTAKE.indexOf(step as never) + 1)
    if (step === 'review') submitIntake()
    if (n === 'pay') setHoldUntil(Date.now() + 15 * 60_000) // scheduling.holdAppointment → holdExpiresAt
    go(n)
  }
  const back = () => (idx <= 0 ? router.back() : go(flow[idx - 1], -1))
  const setA = (p: Partial<IntakeAnswers>) => setAnswers((a) => ({ ...a, ...p }))
  const c = CONSULTATIONS.find((x) => x.id === (type ?? 'first'))!

  // owner 2026-11-18: every intake / check-in question is optional — only mode and time are needed to book
  const can: Partial<Record<Step, boolean>> = { mode: !!mode, time: !!slot }
  const counted = COUNTED.indexOf(step as string)
  const isIntake = INTAKE.includes(step as never) && step !== 'saved'

  const confirmPaid = () => {
    if (!slot || !mode) return
    const a = book({ type: c.id, mode, startsAt: slot.toISOString(), amountPaise: c.feePaise })
    setPaying(false); setBooked(a); go('done')
  }

  if (step === 'done' && booked) return <Booked a={booked} />

  return (
    <main className="flex min-h-dvh flex-col px-5">
      {step === 'choose' ? <AppHeader /> : (
        <header className="sticky top-0 z-30 -mx-5 bg-[linear-gradient(180deg,#dce2f5_0%,#dce2f5_75%,rgba(220,226,245,0)_100%)] px-5 pb-5 pt-2 safe-t">
          <div className="flex items-center gap-3">
            <IconBtn label="Back" onClick={back}><ChevronLeft className="size-5" /></IconBtn>
            {isIntake ? (
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-navy">{step === 'intro' ? 'About 5 minutes' : counted >= 0 ? `Step ${counted + 1} of 8` : 'Almost done'}</p>
                <ProgressBar value={step === 'intro' ? 0.02 : counted >= 0 ? (counted + 1) / 8 : 1} className="mt-1.5" />
              </div>
            ) : <Stepper at={CHECKIN.includes(step as never) || INTAKE.includes(step as never) ? 0 : step === 'pay' ? 2 : 1} />}
            {isIntake && step !== 'intro' && (
              <button onClick={() => { saveIntake(answers, Math.max(1, INTAKE.indexOf(step as never))); toast('Saved — finish anytime'); router.push('/app') }}
                className="shrink-0 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-navy shadow-[var(--shadow-card)]">Save for later</button>
            )}
          </div>
        </header>
      )}

      <div className={cx('relative flex-1 pt-2', step === 'choose' ? 'pb-48' : 'pb-36')}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -40 }} transition={{ duration: 0.32, ease }}>
            {step === 'choose' && <Choose type={type} setType={setType} canFollow={hasHistory} onMeet={() => setMeet(true)} onStories={() => setStories(true)} />}
            {step === 'intro' && <I.IntakeIntro />}
            {step === 'who' && <I.StepWho a={answers} set={setA} />}
            {step === 'feelings' && <I.StepFeelings a={answers} set={setA} />}
            {step === 'nuance' && <I.StepNuance a={answers} set={setA} />}
            {step === 'body' && <I.StepBody a={answers} set={setA} />}
            {step === 'sleep' && <I.StepSleep a={answers} set={setA} />}
            {step === 'life' && <I.StepLife a={answers} set={setA} />}
            {step === 'safety' && <I.StepSafety a={answers} set={setA} />}
            {step === 'gentle' && <I.StepGentle a={answers} set={setA} />}
            {step === 'goals' && <I.StepGoals a={answers} set={setA} />}
            {step === 'review' && <I.StepReview a={answers} set={setA} edit={(k) => go(k as Step, -1)} />}
            {step === 'saved' && <Saved />}
            {step === 'ck-now' && <I.CheckinNow c={checkin} set={(p) => setCheckin((x) => ({ ...x, ...p }))} />}
            {step === 'ck-changes' && <I.CheckinChanges c={checkin} set={(p) => setCheckin((x) => ({ ...x, ...p }))} feelings={intake?.answers.feelings ?? []} />}
            {step === 'ck-news' && <I.CheckinNews c={checkin} set={(p) => setCheckin((x) => ({ ...x, ...p }))} />}
            {step === 'mode' && <Mode mode={mode} setMode={setMode} />}
            {step === 'time' && <TimePicker slot={slot} setSlot={setSlot} />}
            {step === 'pay' && slot && mode && <Review c={c} slot={slot} mode={mode} holdUntil={holdUntil} onExpire={() => { toast('Your held time was released — pick again'); go('time', -1) }} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={cx('fixed inset-x-0 z-30 mx-auto max-w-[480px] px-5', step === 'choose' ? 'bottom-[calc(max(env(safe-area-inset-bottom),12px)+76px)] pb-2' : 'bottom-0 bg-gradient-to-t from-[#e6eee3] via-[#e6eee3]/95 to-transparent pb-3 pt-8 safe-b')}>
        {step === 'choose' ? (
          <Btn full variant="gradient" disabled={!type} onClick={next}>{type === 'followup' ? 'Start 2-minute check-in' : 'Continue'}</Btn>
        ) : step === 'pay' ? (
          <>
            <Btn full variant="gradient" onClick={() => setPaying(true)}><span aria-hidden>🔒</span> Pay {formatINR(c.feePaise)}</Btn>
            <p className="mt-2 text-center text-[12px] text-muted">Secured by Razorpay · UPI, cards, netbanking</p>
          </>
        ) : (
          <Btn full variant={can[step] === false ? 'primary' : 'gradient'} disabled={can[step] === false} onClick={next}>
            {step === 'intro' ? 'Begin' : step === 'goals' ? 'Review answers' : step === 'review' ? 'Save & choose a time' : step === 'saved' ? 'Choose a time' : 'Continue'}
          </Btn>
        )}
      </div>

      <PaySheet open={paying} amountPaise={c.feePaise} purpose={`${c.name} · ${slot ? fmtTime(slot) : ''}`} onClose={() => setPaying(false)} onPaid={confirmPaid} />
      <MeetSheet open={meet} onClose={() => setMeet(false)} />
      <StoriesSheet open={stories} onClose={() => setStories(false)} />
    </main>
  )
}

function Stepper({ at }: { at: number }) {
  return (
    <div className="flex flex-1 items-center justify-center" aria-label={`Step ${at + 1} of 3`}>
      {[0, 1, 2].map((k) => (
        <div key={k} className="flex items-center">
          <motion.span className="grid size-8 place-items-center rounded-full" animate={{ backgroundColor: k <= at ? '#182957' : '#ffffff', scale: k === at ? 1.08 : 1 }} transition={spring}
            style={{ boxShadow: k === at ? '0 0 0 4px rgba(24,41,87,.12)' : 'var(--shadow-card)' }}>
            {k < at ? <Check className="size-4 text-white" strokeWidth={3} /> : <span className={cx('size-2.5 rounded-full', k === at ? 'bg-white' : 'bg-[#cfd5e5]')} />}
          </motion.span>
          {k < 2 && <span className="mx-1 h-[3px] w-12 overflow-hidden rounded-full bg-white"><motion.span className="block h-full bg-navy" animate={{ width: k < at ? '100%' : '0%' }} transition={{ duration: 0.5, ease }} /></span>}
        </div>
      ))}
    </div>
  )
}

function Choose({ type, setType, canFollow, onMeet, onStories }: { type: ConsultationId | null; setType: (t: ConsultationId) => void; canFollow: boolean; onMeet: () => void; onStories: () => void }) {
  // returning clients who met Jitu Bhaiya before the app have no history here — offer follow-up quietly (owner 2026-11-18)
  const [showFollow, setShowFollow] = useState(type === 'followup')
  const follow = canFollow || showFollow
  return (
    <div className="space-y-4">
      <h1 className="h-duo pt-2">Book a <em>session</em></h1>
      {CONSULTATIONS.filter((c) => c.id === 'first' || follow).map((c, i) => {
        const on = type === c.id
        return (
          <motion.button key={c.id} onClick={() => { buzz(); setType(c.id) }} aria-pressed={on} whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.08, ease, duration: 0.5 }}
            className={cx('relative w-full overflow-hidden rounded-[28px] p-5 text-left transition-shadow', on ? 'bg-navy text-white shadow-[var(--shadow-float)]' : 'bg-white shadow-[var(--shadow-card)]')}>
            {c.id === 'first' && <span className={cx('absolute right-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-bold', on ? 'bg-white/15 text-white' : 'bg-[#fbf3dc] text-[#8a6a2c]')}>Start here</span>}
            <p className={cx('text-[13px] font-semibold', on ? 'text-white/70' : 'text-peri')}>Online or in person</p>
            <p className="mt-1 text-[22px] font-extrabold tracking-[-0.02em]">{c.name}</p>
            <p className={cx('mt-1 max-w-[80%] text-[14px] leading-5', on ? 'text-white/80' : 'text-muted')}>{c.blurb}</p>
            <div className="mt-4 flex items-end justify-between">
              <span className={cx('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold', on ? 'bg-white/15' : 'bg-sage-100 text-sage-text')}><Sparkles className="size-3.5" /> Remedy blend included</span>
              <span className="text-[26px] font-extrabold tnum">{formatINR(c.feePaise)}</span>
            </div>
            <AnimatePresence>{on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring} className="absolute bottom-[74px] right-5 grid size-7 place-items-center rounded-full bg-white text-navy"><Check className="size-4" strokeWidth={3} /></motion.span>}</AnimatePresence>
          </motion.button>
        )
      })}
      {!follow && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} onClick={() => { buzz(); setShowFollow(true); setType('followup') }}
          className="mx-auto -mt-1 block rounded-full px-4 py-2 text-[14px] text-muted">
          Seen Jitu Bhaiya before? <span className="font-semibold text-navy underline underline-offset-4">Book a follow-up · ₹800</span>
        </motion.button>
      )}
      <motion.button onClick={onMeet} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="card flex w-full items-center gap-4 p-4 text-left">
        <img src={`${BP}/img/jitu.webp`} alt="" className="size-14 rounded-full object-cover ring-4 ring-peri-50" />
        <span className="flex-1"><span className="block text-[16px] font-bold text-navy">Meet Jitu Bhaiya</span><span className="text-[13px] text-muted">{CONSULTANT.title} · {CONSULTANT.stats[0]}</span></span>
        <ChevronRight className="size-5 text-soft" />
      </motion.button>
      <motion.button onClick={onStories} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.36 }} className="card flex w-full items-center gap-4 p-4 text-left">
        <span className="relative grid size-14 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#fbf3dc,#fbe9ee)] ring-4 ring-peri-50">
          <Quote className="size-6 text-gold" aria-hidden />
        </span>
        <span className="flex-1"><span className="block text-[16px] font-bold text-navy">Client stories</span><span className="text-[13px] text-muted">{TESTIMONIALS.length ? `View ${TESTIMONIALS.length} testimonials` : 'View testimonials'}</span></span>
        <ChevronRight className="size-5 text-soft" />
      </motion.button>
      <p className="px-2 text-center text-[13px] text-muted">Online or in person — you choose next. Sessions are non-refundable, but you can reschedule.</p>
    </div>
  )
}

/** Testimonials — swipeable quote cards; real, consented quotes only (TESTIMONIALS in lib/data.ts). */
function StoriesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [k, setK] = useState(0)
  useEffect(() => { if (open) setK(0) }, [open])
  const n = TESTIMONIALS.length
  const t = TESTIMONIALS[k]
  return (
    <Sheet open={open} onClose={onClose} title="Client stories">
      <h2 className="h-duo text-[26px]">Client <em>stories</em></h2>
      <p className="mt-1 text-[14px] text-muted">In their own words — shared with permission.</p>
      {n ? (
        <>
          <div className="relative mt-5 min-h-[210px]">
            <AnimatePresence mode="wait">
              <motion.figure key={k} drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={(_, i) => { if (i.offset.x < -50) setK((k + 1) % n); else if (i.offset.x > 50) setK((k - 1 + n) % n) }}
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35, ease }}
                className="rounded-[26px] bg-[linear-gradient(140deg,#fbf3dc,#f6efe4_55%,#eef1fb)] p-6">
                <Quote className="size-8 text-gold" aria-hidden />
                {t.rating ? <p className="mt-2 text-[15px] tracking-[2px] text-gold" aria-label={`${t.rating} out of 5`}>{'★'.repeat(t.rating)}</p> : null}
                <blockquote className="mt-3 text-[17px] font-semibold leading-7 text-navy">“{t.quote}”</blockquote>
                <figcaption className="mt-4 text-[14px] text-muted">— {t.name}{t.city ? `, ${t.city}` : ''}</figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>
          {n > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <button aria-label="Previous story" onClick={() => setK((k - 1 + n) % n)} className="grid size-11 place-items-center rounded-full bg-peri-50 text-navy"><ChevronLeft className="size-5" /></button>
              <div className="flex gap-1.5">{TESTIMONIALS.map((_, j) => <span key={j} className={cx('h-2 rounded-full transition-all', j === k ? 'w-6 bg-navy' : 'w-2 bg-[#c7cde0]')} />)}</div>
              <button aria-label="Next story" onClick={() => setK((k + 1) % n)} className="grid size-11 place-items-center rounded-full bg-peri-50 text-navy"><ChevronRight className="size-5" /></button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-5 rounded-[26px] bg-[linear-gradient(140deg,#fbf3dc,#eef1fb)] p-6 text-center">
          <Quote className="mx-auto size-8 text-gold" aria-hidden />
          <p className="mt-3 text-[16px] font-bold text-navy">Stories are on their way</p>
          <p className="mt-1 text-[14px] leading-5 text-muted">We’re gathering words from clients who’ve kindly agreed to share their experience.</p>
          <a href={TESTIMONIALS_SOURCE} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-navy underline underline-offset-4">Read stories on Jitu Bhaiya’s website <ExternalLink className="size-4" /></a>
        </div>
      )}
    </Sheet>
  )
}

function MeetSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Meet your consultant" tall>
      <div className="relative mt-1 h-[280px] overflow-hidden rounded-[24px] bg-peri-50">
        <img src={`${BP}/img/jitu-portrait.webp`} alt="Jitu Bhaiya, smiling" className="h-full w-full object-cover object-[50%_20%]" />
      </div>
      <h2 className="h-duo mt-4 text-[28px]">Jitu <em>Bhaiya</em></h2>
      <p className="text-[14px] font-semibold text-peri">{CONSULTANT.fullName} · {CONSULTANT.title}</p>
      <p className="mt-3 text-[15px] leading-6 text-ink">{CONSULTANT.approach}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">{CONSULTANT.stats.map((s) => <div key={s} className="rounded-[18px] bg-peri-50 p-3 text-[13px] font-semibold text-navy">{s}</div>)}</div>
      <div className="mt-4 rounded-[22px] bg-[linear-gradient(135deg,#fbf3dc,#eef1fb)] p-4">
        <p className="text-[15px] font-bold text-navy">How Bach remedies work</p>
        <p className="mt-1 text-[14px] leading-5 text-muted">Dr Edward Bach described 38 flower essences, each linked to an emotional state. Your blend is chosen for how you feel — a gentle, complementary practice alongside your doctor’s care.</p>
      </div>
      <a href={CONSULTANT.website} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-navy underline underline-offset-4">Visit his website <ExternalLink className="size-4" /></a>
    </Sheet>
  )
}

function Saved() {
  const name = useApp((s) => s.profile?.name?.split(' ')[0])
  return (
    <div className="flex flex-col items-center pt-6 text-center">
      <h1 className="h-duo text-[34px]">Thank you, <em>{name}</em></h1>
      <p className="mt-3 max-w-[320px] text-[15px] leading-6 text-muted">Jitu Bhaiya will read this before you meet. You can update it until 2 hours before your session.</p>
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.15 }} className="mt-6"><Mascot pose="bottle" height={240} /></motion.div>
    </div>
  )
}

function Mode({ mode, setMode }: { mode?: 'online' | 'in_person'; setMode: (m: 'online' | 'in_person') => void }) {
  const opts = [
    { v: 'online' as const, icon: <Laptop className="size-7" />, t: 'Online', d: 'Video call · link shared in the app', img: `${BP}/img/cat-calm.webp` },
    { v: 'in_person' as const, icon: <MapPin className="size-7" />, t: 'In person', d: 'BeWise studio, Vadodara · address shared after booking', img: `${BP}/img/cat-consult.webp` },
  ]
  return (
    <div className="space-y-4">
      <h1 className="h-duo">Online or <em>in person?</em></h1>
      {opts.map((o, i) => {
        const on = mode === o.v
        return (
          <motion.button key={o.v} onClick={() => { buzz(); setMode(o.v) }} aria-pressed={on} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={cx('relative flex h-[150px] w-full overflow-hidden rounded-[28px] p-5 text-left', on ? 'bg-navy text-white shadow-[var(--shadow-float)]' : 'bg-white shadow-[var(--shadow-card)]')}>
            <div className="relative z-10 flex flex-col">
              <span className={cx('grid size-12 place-items-center rounded-full', on ? 'bg-white/15' : 'bg-peri-50 text-navy')}>{o.icon}</span>
              <span className="mt-auto text-[20px] font-extrabold">{o.t}</span>
              <span className={cx('max-w-[200px] text-[13px] leading-4', on ? 'text-white/75' : 'text-muted')}>{o.d}</span>
            </div>
            <img src={o.img} alt="" aria-hidden className={cx('multiply absolute -right-4 bottom-0 h-[140px] object-contain transition-opacity', on && 'opacity-25')} />
          </motion.button>
        )
      })}
    </div>
  )
}

function TimePicker({ slot, setSlot }: { slot?: Date; setSlot: (d: Date) => void }) {
  const today = startOfDay()
  const monday = addDays(today, -((today.getDay() + 6) % 7))
  const [week, setWeek] = useState(0)
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, week * 7 + i))
  const firstOpen = days.find((d) => d >= today && slotsFor(d).length) ?? days[0]
  const [day, setDay] = useState<Date>(slot ? startOfDay(slot) : firstOpen)
  useEffect(() => { if (!days.some((d) => +d === +day)) setDay(days.find((d) => d >= today && slotsFor(d).length) ?? days[0]) }, [week]) // eslint-disable-line react-hooks/exhaustive-deps
  const times = day >= today ? slotsFor(day) : []
  const groups = [
    { t: 'Morning', f: (h: number) => h < 12 }, { t: 'Afternoon', f: (h: number) => h >= 12 && h < 17 }, { t: 'Evening', f: (h: number) => h >= 17 },
  ]
  const pick = (t: string) => { buzz(); setSlot(istDate(day, t)) }
  return (
    <div className="space-y-4">
      <h1 className="h-duo">Pick a <em>time</em></h1>
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <button aria-label="Previous week" disabled={week === 0} onClick={() => setWeek((w) => w - 1)} className="grid size-10 place-items-center rounded-full bg-peri-50 text-navy disabled:opacity-30"><ChevronLeft className="size-5" /></button>
          <motion.p key={week} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-[17px] font-bold text-navy">{fmtMonth(days[3])}</motion.p>
          <button aria-label="Next week" disabled={week >= 7} onClick={() => setWeek((w) => w + 1)} className="grid size-10 place-items-center rounded-full bg-peri-50 text-navy disabled:opacity-30"><ChevronRight className="size-5" /></button>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center">
          {days.map((d) => {
            const open = d >= today && slotsFor(d).length > 0
            const on = +d === +day
            return (
              <button key={+d} disabled={!open} aria-pressed={on} aria-label={fmtLongDay(d)} onClick={() => { buzz(5); setDay(d) }} className="flex flex-col items-center gap-1.5 py-1 disabled:opacity-35">
                <span className="text-[12px] font-medium text-muted">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                <span className="relative grid size-10 place-items-center text-[16px] font-bold">
                  {on && <motion.span layoutId="day-pill" transition={spring} className="absolute inset-0 rounded-full bg-navy" />}
                  <span className={cx('relative', on ? 'text-white' : 'text-navy')}>{d.getDate()}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="card p-5">
        {times.length === 0 ? <p className="py-4 text-center text-[14px] text-muted">No times this day — try another.</p> : groups.map((g) => {
          const ts = times.filter((t) => g.f(Number(t.split(':')[0])))
          if (!ts.length) return null
          return (
            <div key={g.t} className="border-b border-line py-3 first:pt-0 last:border-0 last:pb-0">
              <p className="mb-2.5 text-[16px] font-bold text-navy">{g.t}</p>
              <div className="grid grid-cols-3 gap-2">
                {ts.map((t, i) => {
                  const d = istDate(day, t)
                  const on = slot && +slot === +d
                  return (
                    <motion.button key={t} onClick={() => pick(t)} aria-pressed={!!on} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                      className={cx('relative h-11 rounded-full text-[14px] font-semibold', on ? 'text-white' : 'bg-peri-50/70 text-navy')}>
                      {on && <motion.span layoutId="slot-pill" transition={spring} className="absolute inset-0 rounded-full bg-navy shadow-[0_6px_14px_rgba(24,41,87,.3)]" />}
                      <span className="relative">{fmtTime(d)}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )
        })}
        <p className="mt-3 text-[12px] text-soft">Times in IST</p>
      </div>
    </div>
  )
}

function Review({ c, slot, mode, holdUntil, onExpire }: { c: (typeof CONSULTATIONS)[number]; slot: Date; mode: 'online' | 'in_person'; holdUntil: number; onExpire: () => void }) {
  const [left, setLeft] = useState(Math.max(0, holdUntil - Date.now()))
  const expire = useStableCallback(onExpire)
  useEffect(() => { const t = setInterval(() => { const l = Math.max(0, holdUntil - Date.now()); setLeft(l); if (l === 0) { clearInterval(t); expire() } }, 1000); return () => clearInterval(t) }, [holdUntil, expire])
  const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000)
  return (
    <div className="space-y-4">
      <h1 className="h-duo">Review & <em>pay</em></h1>
      <div className="card p-5">
        <div className="flex items-center gap-4 border-b border-line pb-4">
          <img src={`${BP}/img/jitu.webp`} alt="" className="size-16 rounded-full object-cover" />
          <div><p className="text-[19px] font-extrabold text-navy">Jitu Bhaiya</p><p className="text-[13px] text-muted">{CONSULTANT.title}</p></div>
        </div>
        {[
          { i: <Sparkles className="size-5" />, t: c.name },
          { i: <Clock className="size-5" />, t: `${fmtLongDay(slot)} · ${fmtTime(slot)}` },
          { i: mode === 'online' ? <Video className="size-5" /> : <MapPin className="size-5" />, t: mode === 'online' ? 'Online · video call' : 'In person · BeWise studio' },
        ].map((r, k) => (
          <motion.div key={k} className="flex items-center gap-3 border-b border-line py-3.5 last:border-0" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + k * 0.06 }}>
            <span className="grid size-10 place-items-center rounded-full bg-peri-50 text-navy">{r.i}</span><span className="text-[15px] font-semibold text-ink">{r.t}</span>
          </motion.div>
        ))}
        <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-sage-100 px-3 py-1.5 text-[12px] font-bold text-sage-text"><Check className="size-3.5" strokeWidth={3} /> Remedy blend included</span>
      </div>
      <div className="flex items-start gap-3 rounded-[22px] bg-sage-100/70 p-4 text-[14px] leading-5 text-sage-text">
        <Info className="mt-0.5 size-5 shrink-0" /><p>Sessions are non-refundable — you can reschedule free up to 24 h before.</p>
      </div>
      <div className="flex items-center justify-between px-1">
        <span className="text-[14px] text-muted">We’re holding this time for <b className="tnum text-navy">{mm}:{String(ss).padStart(2, '0')}</b></span>
      </div>
      <div className="card flex items-center justify-between p-5">
        <span className="text-[20px] font-extrabold text-navy">Total</span>
        <span className="text-[30px] font-extrabold tracking-[-0.02em] text-navy tnum">{formatINR(c.feePaise)}</span>
      </div>
    </div>
  )
}

function Booked({ a }: { a: Appointment }) {
  const router = useRouter()
  const [cal, setCal] = useState(false)
  const c = CONSULTATIONS.find((x) => x.id === a.type)!
  const ev = { id: a.id, title: 'BeWise session with Jitu Bhaiya', start: a.startsAt, minutes: c.minutes, location: a.mode === 'online' ? 'Online — link in the BeWise app' : 'BeWise studio, Vadodara', description: `${c.name} (${a.code}). Find a quiet spot and keep water nearby.` }
  return (
    <main className="flex min-h-dvh flex-col px-5 safe-t">
      <Petals />
      <h1 className="h-duo mt-12 text-[38px]">You’re <em>booked</em></h1>
      <motion.div className="mx-auto mt-4" initial={{ scale: 0.4, rotate: -10, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}>
        <Mascot pose="wave" height={250} priority />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5, ease }} className="card mt-4 flex items-center gap-4 p-5">
        <span className="grid size-12 place-items-center rounded-full bg-peri-50 text-navy"><CalendarPlus className="size-6" /></span>
        <div><p className="text-[16px] font-bold text-navy">{fmtLongDay(a.startsAt)}</p><p className="text-[14px] text-muted">{fmtTime(a.startsAt)} · {a.mode === 'online' ? 'Online' : 'In person'} with Jitu Bhaiya</p></div>
      </motion.div>
      <p className="mt-3 text-center text-[13px] text-muted">Receipt {a.code} is in Payments. Jitu Bhaiya will read your answers before you meet.</p>
      <div className="mt-auto space-y-3 pb-3 pt-6 safe-b">
        <Btn full onClick={() => router.replace(`/app/sessions/view?id=${a.id}`)}>View appointment</Btn>
        <Btn full variant="white" onClick={() => setCal(true)}><CalendarPlus className="size-5" /> Add to calendar</Btn>
      </div>
      <Sheet open={cal} onClose={() => setCal(false)} title="Add to calendar">
        <h2 className="h-duo text-[24px]">Add to <em>calendar</em></h2>
        <div className="mt-4 space-y-2 pb-2">
          <a href={googleCalUrl(ev)} target="_blank" rel="noopener noreferrer" onClick={() => setCal(false)} className="flex h-14 items-center gap-3 rounded-[20px] bg-peri-50 px-4 text-[15px] font-semibold text-navy"><span className="text-[20px]">📅</span> Google Calendar</a>
          <button onClick={() => { downloadIcs('bewise-session.ics', sessionIcs(ev)); setCal(false); toast('Calendar file ready') }} className="flex h-14 w-full items-center gap-3 rounded-[20px] bg-peri-50 px-4 text-[15px] font-semibold text-navy"><span className="text-[20px]">🗓️</span> Apple Calendar & others (.ics)</button>
        </div>
      </Sheet>
    </main>
  )
}
