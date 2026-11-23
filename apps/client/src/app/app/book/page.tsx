'use client'
/**
 * @module   booking
 * @owner    CLIENT
 * @screens  CL-11 Choose · CL-12 Meet your consultant · IN-01…IN-11 · IN-12 · CL-13 Mode · CL-14 Time · CL-16 Review & pay · CL-17 Booked
 * Spec:     docs/specs/client/C3-booking-wizard.md
 * @stub     scheduling.holdAppointment / finance.createCheckout are simulated in the preview (flags booking, checkout).
 * v5 (HUB 2026-11-20): Blue Bloom intake — optional "What should we call you?" step (only when the profile has no name),
 *   thin blue progress bar, sticky primary Next, feelings as icon circles, nuance statements as list cards. Answer shapes and
 *   NUANCE strings are unchanged. "Meet Jitendra Khimlani" opens the full-screen story. After booking: one reminder prompt.
 */
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarPlus, Check, ChevronLeft, ChevronRight, Clock, ExternalLink, Info, Laptop, MapPin, Phone, Quote, Sparkles, Video, CalendarCheck2 } from 'lucide-react'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Mascot, Petals } from '@/components/brand'
import { JituPortrait, JituStory } from '@/components/jitu-story'
import { NotifyPrompt, markFirstBooking } from '@/components/prompts'
import { PaySheet } from '@/components/pay-sheet'
import { DateInput } from '@/components/date-input'
import { AppHeader, useUi } from '@/components/shell'
import { Btn, Chip, IconBtn, ProgressBar, Sheet, buzz, cx, ease, spring, toast, useStableCallback } from '@/components/ui'
import { CONSULTANT, CONSULTATIONS, NUANCE, STUDIO, TESTIMONIALS, TESTIMONIALS_SOURCE, istDate, slotsFor, type ConsultationId } from '@/lib/data'
import { InPersonArt, OnlineArt } from '@/components/mode-art'
import { apptMinutes, apptName } from '@/lib/appt'
import { emptyIntake, planLeft, useApp, type Appointment, type IntakeAnswers, type Plan } from '@/lib/store'
import { HELPLINE, PLANS, offerLive, planFull, planPrice, planSaving, type PlanId } from '@/lib/offer'
import { addDays, fmtLongDay, fmtMonth, fmtTime, formatINR, startOfDay } from '@/lib/format'
import { addToCalendar, downloadIcs, googleCalUrl, isAndroid, sessionIcs } from '@/lib/ics'
import * as I from './intake'
import { BP } from '@/lib/asset'

// owner 2026-11-18: breathe first → feelings → … → personal message later ('who' = the share/voice-note step)
const INTAKE = ['intro', 'feelings', 'nuance', 'body', 'sleep', 'life', 'who', 'safety', 'gentle', 'review', 'saved'] as const // owner 2026-11-18: "How would you like to feel?" removed
const COUNTED = ['feelings', 'nuance', 'body', 'sleep', 'life', 'who', 'safety', 'gentle']
const CHECKIN = ['ck-now', 'ck-changes', 'ck-news'] as const
type Step = 'choose' | 'name' | (typeof INTAKE)[number] | (typeof CHECKIN)[number] | 'mode' | 'prefs' | 'pay' | 'done'

export default function BookPage() { return <Suspense><Book /></Suspense> }

function Book() {
  const router = useRouter()
  const params = useSearchParams()
  const setNavHidden = useUi((s) => s.setNavHidden)
  const intake = useApp((s) => s.intake)
  const saveIntake = useApp((s) => s.saveIntake)
  const submitIntake = useApp((s) => s.submitIntake)
  const book = useApp((s) => s.book)
  const buyPlan = useApp((s) => s.buyPlan)
  const plan = useApp((s) => s.plan)
  const hasHistory = useApp((s) => s.appointments.length > 0 || !!s.blend)
  const profileName = useApp((s) => s.profile?.name ?? '')
  const setProfile = useApp((s) => s.setProfile)
  // v5: ask for a name only if we don't have one (decided once per visit so the step doesn't vanish mid-flow)
  const [askName] = useState(() => !profileName.trim())
  const [nameDraft, setNameDraft] = useState(profileName)

  const hasBlend = useApp((s) => !!s.blend)
  const submitCheckin = useApp((s) => s.submitCheckin)
  const [step, setStep] = useState<Step>('choose')
  const [dir, setDir] = useState(1)
  const [answers, setAnswers] = useState<IntakeAnswers>(() => intake?.answers ?? emptyIntake())
  const [checkin, setCheckin] = useState<I.Checkin>({ changes: {}, news: '' })
  const [mode, setMode] = useState<'online' | 'in_person'>()
  const [prefs, setPrefs] = useState<NonNullable<Appointment['prefs']>>(() => ({ date: params.get('date') ?? undefined }))
  const [paying, setPaying] = useState(false)
  const [booked, setBooked] = useState<Appointment>()
  const [meet, setMeet] = useState(false)
  const [stories, setStories] = useState(false)
  const [skipAsk, setSkipAsk] = useState(false)
  const [payWhen, setPayWhen] = useState<'now' | 'later'>('now')
  // owner 2026-11-18: after the first consultation, offer 6 months (recommended), yearly (best value) or one time
  const [planPick, setPlanPick] = useState<PlanPick>('half')

  // owner 2026-11-21: no first / follow-up choice any more (most clients met Jitendra Khimlani before the app).
  // Everyone books "an appointment": 2-minute check-in → online or in person → preferred time → send. The team sets type, fee and time.
  const flow: Step[] = useMemo(() => ['choose', ...(askName ? ['name' as Step] : []), ...CHECKIN, 'mode', 'prefs', 'pay', 'done'], [askName])

  useEffect(() => { setNavHidden(step !== 'choose'); return () => setNavHidden(false) }, [step, setNavHidden])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [step])

  const go = (s: Step, d = 1) => { setDir(d); setStep(s) }
  const idx = flow.indexOf(step)
  const next = () => {
    const n = flow[idx + 1]
    if (INTAKE.includes(step as never)) saveIntake(answers, INTAKE.indexOf(step as never) + 1)
    if (step === 'review') submitIntake()
    if (step === 'name' && nameDraft.trim()) setProfile({ name: nameDraft.trim().slice(0, 60) })
    go(n)
  }
  // owner 2026-11-18: "Skip" replaces "Save for later"; answers so far are kept, straight on to choosing a time
  const skipIntake = () => { saveIntake(answers, Math.max(1, INTAKE.indexOf(step as never))); setSkipAsk(false); go('mode') }
  const back = () => (idx <= 0 ? router.back() : go(flow[idx - 1], -1))
  const setA = (p: Partial<IntakeAnswers>) => setAnswers((a) => ({ ...a, ...p }))
  const inPlan = planLeft(plan) > 0
  const pick: PlanPick = inPlan ? 'once' : planPick
  // one appointment: nothing to pay now (the team sets the fee with the time); a plan is paid now at the launch price
  const fee = pick === 'once' ? 0 : planPrice(pick)
  const feeLabel = pick === 'once' ? 'Wellness session' : `${PLANS[pick].name} · wellness journey plan`

  // owner 2026-11-18: every intake / check-in question is optional — only mode and time are needed to book
  const can: Partial<Record<Step, boolean>> = { mode: !!mode }
  const steps: string[] = []
  const counted = -1
  const isIntake = false

  // the request goes to the team, who set the time (and, for a single appointment, first visit or follow-up and the fee)
  const confirmPaid = () => {
    if (!mode) return
    if (pick !== 'once') buyPlan(pick, fee)
    const usePlan = inPlan || pick !== 'once'
    const clean = { ...prefs, note: prefs.note?.trim() || undefined }
    const a = book({ type: hasHistory ? 'followup' : 'first', kindTbc: true, mode, startsAt: new Date(Date.now() + 7 * 864e5).toISOString(), amountPaise: 0, timeTbc: true, timeRequested: true, prefs: clean,
      ...(usePlan ? { planId: pick === 'once' ? plan?.id : pick, paidAt: new Date().toISOString() } : {}) })
    if (checkin.now || checkin.news.trim() || checkin.drops || Object.keys(checkin.changes).length) submitCheckin(a.id, checkin)
    setPaying(false); setBooked(a); markFirstBooking(); go('done')
  }

  if (step === 'done' && booked) return <Booked a={booked} />

  return (
    <main className="flex min-h-dvh flex-col px-5">
      {step === 'choose' ? <AppHeader back="/app/remedies" /> : (
        <header className="sticky top-0 z-30 -mx-5 bg-sky-50/95 px-5 pb-4 pt-2 backdrop-blur-xl safe-t">
          <div className="flex items-center gap-3">
            <IconBtn label="Back" onClick={back}><ChevronLeft className="size-5" /></IconBtn>
            {isIntake ? (
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-ink-2 tnum">{step === 'intro' ? 'A moment for you' : counted >= 0 ? `Your check-in · ${counted + 1} of ${steps.length}` : 'Almost done'}</p>
                <ProgressBar value={step === 'intro' ? 0.02 : counted >= 0 ? (counted + 1) / steps.length : 1} className="mt-2" label="Check-in progress" />
              </div>
            ) : <Stepper at={CHECKIN.includes(step as never) || INTAKE.includes(step as never) ? 0 : step === 'pay' ? 2 : 1} />}
            {isIntake && step !== 'intro' && (
              <button onClick={() => (hasHistory ? skipIntake() : setSkipAsk(true))}
                className="min-h-11 shrink-0 rounded-full px-3 text-[14px] font-semibold text-navy underline-offset-4 hover:underline">Skip</button>
            )}
          </div>
        </header>
      )}

      <div className={cx('relative flex-1 pt-2', step === 'choose' ? 'pb-48' : 'pb-36')}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -40 }} transition={{ duration: 0.32, ease }}>
            {step === 'choose' && <Choose plan={plan} planPick={planPick} setPlanPick={setPlanPick} onMeet={() => setMeet(true)} meetOpen={meet} onStories={() => setStories(true)} />}
            {step === 'intro' && <I.IntakeIntro />}
            {step === 'name' && <I.StepName value={nameDraft} onChange={setNameDraft} onEnter={next} />}
            {step === 'who' && <I.StepWho a={answers} set={setA} />}
            {step === 'feelings' && <I.StepFeelings a={answers} set={setA} name={nameDraft.trim() || profileName} />}
            {step === 'nuance' && <I.StepNuance a={answers} set={setA} />}
            {step === 'body' && <I.StepBody a={answers} set={setA} />}
            {step === 'sleep' && <I.StepSleep a={answers} set={setA} />}
            {step === 'life' && <I.StepLife a={answers} set={setA} />}
            {step === 'safety' && <I.StepSafety a={answers} set={setA} />}
            {step === 'gentle' && <I.StepGentle a={answers} set={setA} />}
            {step === 'review' && <I.StepReview a={answers} set={setA} edit={(k) => go(k as Step, -1)} />}
            {step === 'saved' && <Saved />}
            {step === 'ck-now' && <I.CheckinNow c={checkin} set={(p) => setCheckin((x) => ({ ...x, ...p }))} />}
            {step === 'ck-changes' && <I.CheckinChanges c={checkin} set={(p) => setCheckin((x) => ({ ...x, ...p }))} feelings={intake?.answers.feelings ?? []} />}
            {step === 'ck-news' && <I.CheckinNews c={checkin} set={(p) => setCheckin((x) => ({ ...x, ...p }))} showDrops={hasBlend} />}
            {step === 'mode' && <Mode mode={mode} setMode={setMode} />}
            {step === 'prefs' && <Prefs prefs={prefs} setPrefs={setPrefs} />}
            {step === 'pay' && mode && <Review mode={mode} fee={fee} pick={pick} inPlan={inPlan} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={cx('fixed inset-x-0 z-30 mx-auto max-w-[480px] px-5', step === 'choose' ? 'bottom-[calc(max(env(safe-area-inset-bottom),12px)+76px)] pb-2' : 'bottom-0 bg-gradient-to-t from-sky-50 via-sky-50/95 to-transparent pb-3 pt-8 safe-b')}>
        {step === 'choose' ? (
          <Btn full variant="gradient" onClick={next}>Start 2-minute check-in</Btn>
        ) : step === 'pay' ? (
          <>
            {inPlan ? <>
              <Btn full variant="gradient" onClick={() => confirmPaid()}><CalendarCheck2 className="size-5" /> Send request</Btn>
              <p className="mt-2 text-center text-[12px] text-muted">{planLeft(plan)} sessions left in your plan</p>
            </> : pick !== 'once' ? <>
              <Btn full variant="gradient" onClick={() => setPaying(true)}><span aria-hidden>🔒</span> Pay {formatINR(fee)} & send request</Btn>
              <p className="mt-2 text-center text-[12px] text-muted">Secured by Razorpay · the team confirms your time</p>
            </> : <>
              <Btn full variant="gradient" onClick={() => confirmPaid()}><CalendarCheck2 className="size-5" /> Send request</Btn>
              <p className="mt-2 text-center text-[12px] text-muted">Nothing to pay now · you’ll pay in the app once your time is set</p>
            </>}
          </>
        ) : (
          <Btn full variant={can[step] === false ? 'primary' : 'gradient'} disabled={can[step] === false} onClick={next}>
            {step === 'intro' ? 'I’m ready, let’s start' : step === 'gentle' ? 'Review answers' : step === 'review' ? 'Save & continue' : isIntake ? 'Next' : 'Continue'}
          </Btn>
        )}
      </div>

      <PaySheet open={paying} amountPaise={fee} purpose={feeLabel} onClose={() => setPaying(false)} onPaid={() => confirmPaid()} />
      <JituStory open={meet} onClose={() => setMeet(false)} />
      <StoriesSheet open={stories} onClose={() => setStories(false)} />
      <Sheet open={skipAsk} onClose={() => setSkipAsk(false)} title="Skip the questions?">
        <div className="text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-marigold-100 text-[30px]" aria-hidden>🌼</span>
          <h2 className="h-duo mt-3 text-[26px]">We <em>recommend</em> this</h2>
          <p className="mx-auto mt-2 max-w-[300px] text-[15px] leading-6 text-muted">These few questions help Jitendra Khimlani understand you before you meet, so your first session goes deeper. It takes about 2 minutes.</p>
        </div>
        <div className="mt-6 flex gap-3 pb-1">
          <Btn full variant="white" size="md" onClick={skipIntake}>Skip anyway</Btn>
          <Btn full size="md" onClick={() => setSkipAsk(false)}>Continue</Btn>
        </div>
      </Sheet>
    </main>
  )
}

/** owner 2026-11-18: after the first consultation, 6 months (recommended) or yearly (best value), or one time. */
function PlanPicker({ pick, setPick }: { pick: PlanPick; setPick: (p: PlanPick) => void }) {
  const live = offerLive()
  const opts: { k: PlanPick; t: string; tag?: string; price: number; full?: number; note: string; emoji: string }[] = [
    { k: 'half', t: '6 months', tag: 'Recommended', price: planPrice('half'), full: live ? planFull('half') : undefined, note: live ? '1 month free' : '6 wellness sessions', emoji: '🌱' },
    { k: 'yearly', t: 'Yearly', tag: 'Best value', price: planPrice('yearly'), full: live ? planFull('yearly') : undefined, note: live ? `2 months free · save ${formatINR(planSaving('yearly'))}` : '12 wellness sessions', emoji: '🌳' },
    { k: 'once', t: 'One session', price: 0, note: 'Pay once the team sets your fee', emoji: '🌼' },
  ]
  return (
    <section aria-labelledby="plan-h">
      <h2 id="plan-h" className="scroll-mt-24 px-1 text-[15px] font-bold text-navy">How would you like to book?</h2>
      <p className="px-1 text-[13px] text-muted">A session every month keeps your blend fresh. Plans include one session a month.</p>
      <div className="mt-3 space-y-2.5" role="radiogroup" aria-label="Plan">
        {opts.map((o, i) => {
          const on = pick === o.k
          return (
            <motion.button key={o.k} type="button" role="radio" aria-checked={on} onClick={() => { buzz(6); setPick(o.k) }} whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05 }}
              className={cx('relative flex w-full items-center gap-3 rounded-[20px] p-4 text-left transition-colors', on ? 'bg-white ring-2 ring-navy shadow-[var(--shadow-float)]' : 'bg-white shadow-[var(--shadow-card)]')}>
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-peri-50 text-[22px]" aria-hidden>{o.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5"><span className="text-[16px] font-bold text-navy">{o.t}</span>
                  {o.tag && <span className={cx('rounded-full px-2 py-0.5 text-[11px] font-bold', o.k === 'yearly' ? 'bg-marigold-100 text-ink' : 'bg-teal-100 text-sage-text')}>{o.tag}</span>}</span>
                <span className="block text-[12px] text-muted">{o.note}</span>
              </span>
              <span className="text-right">
                {o.full && <span className="block text-[12px] text-muted line-through tnum">{formatINR(o.full)}</span>}
                {o.k === 'once' ? <span className="block text-[14px] font-bold text-navy">Pay later</span> : <span className="block text-[17px] font-extrabold text-navy tnum">{formatINR(o.price)}</span>}
              </span>
              <span className={cx('grid size-6 shrink-0 place-items-center rounded-full border-2', on ? 'border-navy bg-navy text-white' : 'border-sky-200')}>{on && <Check className="size-3.5" strokeWidth={3} />}</span>
            </motion.button>
          )
        })}
      </div>
      {live && <p className="mt-2 px-1 text-[12px] font-semibold text-ink-2">🎁 Launch prices till 1 December</p>}
    </section>
  )
}

function Stepper({ at }: { at: number }) {
  return (
    <div className="flex flex-1 items-center justify-center" role="group" aria-label={`Step ${at + 1} of 3`}>
      {[0, 1, 2].map((k) => (
        <div key={k} className="flex items-center">
          <motion.span className="grid size-8 place-items-center rounded-full" animate={{ backgroundColor: k <= at ? '#243D91' : '#ffffff', scale: k === at ? 1.08 : 1 }} transition={spring}
            style={{ boxShadow: k === at ? '0 0 0 4px rgba(76,111,214,.18)' : 'var(--shadow-card)' }}>
            {k < at ? <Check className="size-4 text-white" strokeWidth={3} /> : <span className={cx('size-2.5 rounded-full', k === at ? 'bg-white' : 'bg-sky-200')} />}
          </motion.span>
          {k < 2 && <span className="mx-1 h-[3px] w-12 overflow-hidden rounded-full bg-sky-200"><motion.span className="block h-full bg-navy" animate={{ width: k < at ? '100%' : '0%' }} transition={{ duration: 0.5, ease }} /></span>}
        </div>
      ))}
    </div>
  )
}

/** owner 2026-11-21: one way in for everyone — "Book an appointment". The team decides first visit or follow-up and the fee. */
function Choose({ plan, planPick, setPlanPick, onMeet, meetOpen, onStories }: { plan: Plan | null; planPick: PlanPick; setPlanPick: (p: PlanPick) => void; onMeet: () => void; meetOpen: boolean; onStories: () => void }) {
  const first = CONSULTATIONS.find((x) => x.id === 'first')!.feePaise, follow = CONSULTATIONS.find((x) => x.id === 'followup')!.feePaise
  return (
    <div className="space-y-4">
      <h1 className="h-duo pt-2">Book a <em>wellness session</em></h1>
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="card overflow-hidden">
        <button onClick={onMeet} aria-haspopup="dialog" aria-label="Meet Jitendra Khimlani" className="flex w-full items-end gap-4 bg-sky-100 px-5 pt-4 text-left">
          {!meetOpen ? <JituPortrait className="h-[118px] w-[94px] shrink-0 ring-[3px] ring-white" radius="999px 999px 16px 16px" /> : <span className="h-[118px] w-[94px] shrink-0" />}
          <span className="min-w-0 flex-1 pb-4">
            <span className="block font-display text-[20px] font-semibold leading-6 text-ink">Jitendra Khimlani</span>
            <span className="block text-[13px] text-ink-2">{CONSULTANT.title}</span>
            <span className="mt-1.5 inline-flex items-center gap-0.5 text-[13px] font-semibold text-navy">More about him <ChevronRight className="size-4" /></span>
          </span>
        </button>
        <ul className="divide-y divide-line px-5">
          {[
            { i: <Video className="size-5" />, t: 'One to one, online or in person', d: `Video call, or at ${STUDIO.name}` },
            { i: <Sparkles className="size-5" />, t: 'Your remedy blend is included', d: 'Prepared for you after the session' },
            { i: <Clock className="size-5" />, t: 'Our team confirms your time and fee', d: `${formatINR(first)} first visit · ${formatINR(follow)} after that` },
          ].map((r) => (
            <li key={r.t} className="flex items-center gap-3 py-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-peri-50 text-navy">{r.i}</span>
              <span className="min-w-0"><span className="block text-[15px] font-semibold text-ink">{r.t}</span><span className="block text-[12px] text-muted">{r.d}</span></span>
            </li>
          ))}
        </ul>
      </motion.section>
      {planLeft(plan) > 0 ? (
        <div className="flex items-center gap-3 rounded-[20px] bg-teal-100 p-4 text-[14px] text-sage-text">
          <span className="text-[22px]" aria-hidden>{PLANS[plan!.id].emoji}</span>
          <span className="flex-1"><b>{PLANS[plan!.id].name}</b> · {planLeft(plan)} sessions left. This one is included.</span>
        </div>
      ) : <PlanPicker pick={planPick} setPick={setPlanPick} />}
      <motion.button onClick={onStories} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.36 }} className="card flex w-full items-center gap-4 p-4 text-left">
        <span className="relative grid size-14 shrink-0 place-items-center rounded-full bg-rose-100 ring-4 ring-sky-100">
          <Quote className="size-6 fill-rose-500 text-rose-500" aria-hidden />
        </span>
        <span className="flex-1"><span className="block text-[16px] font-bold text-navy">Member stories</span><span className="text-[13px] text-muted">{TESTIMONIALS.length ? `View ${TESTIMONIALS.length} testimonials` : 'View testimonials'}</span></span>
        <ChevronRight className="size-5 text-soft" />
      </motion.button>
      <p className="px-2 text-center text-[13px] text-muted">Sessions are non-refundable, but you can reschedule.</p>
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
    <Sheet open={open} onClose={onClose} title="Member stories">
      <h2 className="h-duo text-[26px]">Member <em>stories</em></h2>
      <p className="mt-1 text-[14px] text-muted">In their own words, shared with permission.</p>
      {n ? (
        <>
          <div className="relative mt-5 min-h-[210px]">
            <AnimatePresence mode="wait">
              <motion.figure key={k} drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={(_, i) => { if (i.offset.x < -50) setK((k + 1) % n); else if (i.offset.x > 50) setK((k - 1 + n) % n) }}
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35, ease }}
                className="rounded-[24px] bg-rose-100 p-6">
                <Quote className="size-8 fill-rose-500 text-rose-500" aria-hidden />
                {t.rating ? <p className="mt-2 text-[15px] tracking-[2px] text-gold" role="img" aria-label={`${t.rating} out of 5`}>{'★'.repeat(t.rating)}</p> : null}
                <blockquote className="mt-3 font-display text-[18px] font-medium italic leading-7 text-ink">“{t.quote}”</blockquote>
                <figcaption className="mt-4 text-[14px] text-muted">{t.name}{t.city ? `, ${t.city}` : ''}</figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>
          {n > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <button aria-label="Previous story" onClick={() => setK((k - 1 + n) % n)} className="grid size-11 place-items-center rounded-full bg-sky-50 text-navy"><ChevronLeft className="size-5" /></button>
              <div className="flex gap-1.5">{TESTIMONIALS.map((_, j) => <span key={j} className={cx('h-2 rounded-full transition-all', j === k ? 'w-6 bg-navy' : 'w-2 bg-sky-200')} />)}</div>
              <button aria-label="Next story" onClick={() => setK((k + 1) % n)} className="grid size-11 place-items-center rounded-full bg-sky-50 text-navy"><ChevronRight className="size-5" /></button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-5 rounded-[24px] bg-marigold-100 p-6 text-center">
          <Quote className="mx-auto size-8 text-gold" aria-hidden />
          <p className="mt-3 text-[16px] font-bold text-navy">Stories are on their way</p>
          <p className="mt-1 text-[14px] leading-5 text-muted">We’re gathering words from members who’ve kindly agreed to share their experience.</p>
          <a href={TESTIMONIALS_SOURCE} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-navy underline underline-offset-4">Read stories on Jitendra Khimlani’s website <ExternalLink className="size-4" /></a>
        </div>
      )}
    </Sheet>
  )
}

function Saved() {
  const name = useApp((s) => s.profile?.name?.split(' ')[0])
  return (
    <div className="flex flex-col items-center pt-6 text-center">
      <h1 className="h-duo text-[34px]">Thank you, <em>{name}</em></h1>
      <p className="mt-3 max-w-[320px] text-[15px] leading-6 text-muted">Jitendra Khimlani will read this before you meet. You can update it until 2 hours before your session.</p>
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.15 }} className="mt-6"><Mascot pose="bottle" height={240} /></motion.div>
    </div>
  )
}

function Mode({ mode, setMode }: { mode?: 'online' | 'in_person'; setMode: (m: 'online' | 'in_person') => void }) {
  const opts = [
    { v: 'online' as const, icon: <Laptop className="size-6" />, t: 'Online', d: 'Video call · link shared in the app' },
    { v: 'in_person' as const, icon: <MapPin className="size-6" />, t: 'In person', d: `${STUDIO.name} · ${STUDIO.short}` },
  ]
  return (
    <div className="space-y-4" role="radiogroup" aria-label="Online or in person">
      <h1 className="h-duo">Online or <em>in person?</em></h1>
      {opts.map((o, i) => {
        const on = mode === o.v
        const pick = () => { buzz(); setMode(o.v) }
        return (
          <motion.div key={o.v} role="radio" aria-checked={on} tabIndex={0} onClick={pick} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick() } }}
            whileTap={{ scale: 0.985 }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={cx('relative w-full cursor-pointer overflow-hidden rounded-[24px] p-5 text-left transition-colors duration-300', on ? 'bg-navy text-white shadow-[var(--shadow-float)]' : 'bg-white shadow-[var(--shadow-card)]')}>
            {o.v === 'online' ? <OnlineArt on={on} /> : <InPersonArt on={on} />}
            <div className="relative z-10 flex min-h-[118px] max-w-[58%] flex-col">
              <span className={cx('grid size-11 place-items-center rounded-full', on ? 'bg-white/15' : 'bg-peri-50 text-navy')}>{o.icon}</span>
              <span className="mt-auto pt-3 text-[20px] font-extrabold">{o.t}</span>
              <span className={cx('text-[13px] leading-4', on ? 'text-white/75' : 'text-muted')}>{o.d}</span>
            </div>
            <AnimatePresence initial={false}>
              {on && o.v === 'in_person' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="relative z-10 overflow-hidden">
                  <div className="mt-5 rounded-[18px] bg-white/10 p-3.5 text-[13px] leading-5">
                    <p className="font-semibold">{STUDIO.line1}</p><p className="text-white/80">{STUDIO.line2}</p><p className="text-white/80">{STUDIO.city}</p>
                    <a href={STUDIO.mapsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="mt-2 inline-flex items-center gap-1.5 font-semibold text-white underline underline-offset-4">Open in Maps <ExternalLink className="size-3.5" /></a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}

type PlanPick = 'once' | PlanId

const DAYS = ['Weekdays', 'Weekends', 'Any day'] as const
const TIMES = ['Morning', 'Afternoon', 'Evening'] as const

/** owner 2026-11-20: the client only requests; these optional hints help the team pick a time. */
function Prefs({ prefs, setPrefs }: { prefs: NonNullable<Appointment['prefs']>; setPrefs: (p: NonNullable<Appointment['prefs']>) => void }) {
  const up = (p: Partial<NonNullable<Appointment['prefs']>>) => setPrefs({ ...prefs, ...p })
  return (
    <div className="space-y-4">
      <div>
        <h1 className="h-duo">When usually <em>suits you?</em></h1>
        <p className="mt-1 text-[14px] leading-5 text-muted">Optional. Jitendra Khimlani or our team will confirm the exact time and message you on WhatsApp.</p>
      </div>
      <div className="card p-5">
        <p className="mb-3 text-[15px] font-bold text-navy">Days</p>
        <div className="flex flex-wrap gap-2">{DAYS.map((d) => <Chip key={d} on={prefs.days === d} onClick={() => up({ days: prefs.days === d ? undefined : d })}>{d}</Chip>)}</div>
        <p className="mb-3 mt-5 text-[15px] font-bold text-navy">Time of day</p>
        <div className="flex flex-wrap gap-2">{TIMES.map((t) => { const on = !!prefs.times?.includes(t); return <Chip key={t} on={on} onClick={() => up({ times: on ? prefs.times!.filter((x) => x !== t) : [...(prefs.times ?? []), t] })}>{t}</Chip> })}</div>
        <p className="mb-2 mt-5 text-[15px] font-bold text-navy">Preferred date <span className="font-medium text-muted">(optional)</span></p>
        <DateInput value={prefs.date ?? ''} onChange={(date) => up({ date: date || undefined })} label="Preferred date (DD/MM/YYYY)"
          className="h-12 w-full rounded-full bg-peri-50 px-4 text-[16px] font-semibold tracking-[0.04em] text-navy outline-none placeholder:font-medium placeholder:text-[#9aa2b8] focus:ring-2 focus:ring-navy" />
        <p className="mb-2 mt-5 text-[15px] font-bold text-navy">Anything else? <span className="font-medium text-muted">(optional)</span></p>
        <textarea value={prefs.note ?? ''} onChange={(e) => up({ note: e.target.value.slice(0, 300) })} rows={2} placeholder="e.g. after 6 PM works best"
          aria-label="Note for the team" className="w-full resize-none rounded-[18px] bg-peri-50 p-3.5 text-[15px] outline-none focus:ring-2 focus:ring-navy" />
      </div>
    </div>
  )
}

function Review({ mode, fee, pick, inPlan }: { mode: 'online' | 'in_person'; fee: number; pick: PlanPick; inPlan: boolean }) {
  const first = CONSULTATIONS.find((x) => x.id === 'first')!.feePaise, follow = CONSULTATIONS.find((x) => x.id === 'followup')!.feePaise
  return (
    <div className="space-y-4">
      <h1 className="h-duo">Review & <em>send</em></h1>
      <div className="card p-5">
        <div className="-mx-5 -mt-5 mb-1 flex items-end gap-4 overflow-hidden rounded-t-[28px] border-b border-line bg-sky-100 px-5 pt-4">
          <img src={`${BP}/img/jitu-portrait.webp`} alt="" className="h-[140px] w-auto shrink-0 object-contain" />
          <div className="pb-5"><p className="font-display text-[20px] font-semibold text-ink">Jitendra Khimlani</p><p className="text-[13px] text-muted">{CONSULTANT.title}</p></div>
        </div>
        {[
          { i: <Sparkles className="size-5" />, t: inPlan ? 'Wellness session · in your plan' : pick === 'once' ? 'Wellness session' : `Wellness session · ${PLANS[pick].name}` },
          { i: mode === 'online' ? <Video className="size-5" /> : <MapPin className="size-5" />, t: mode === 'online' ? 'Online · video call' : `In person · ${STUDIO.short}` },
          { i: <Clock className="size-5" />, t: 'Time: confirmed by the team after your request' },
        ].map((r, k) => (
          <motion.div key={k} className="flex items-center gap-3 border-b border-line py-3.5 last:border-0" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + k * 0.06 }}>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-peri-50 text-navy">{r.i}</span><span className="text-[15px] font-semibold text-ink">{r.t}</span>
          </motion.div>
        ))}
        <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1.5 text-[12px] font-bold text-sage-text"><Check className="size-3.5" strokeWidth={3} /> Remedy blend included</span>
      </div>
      <div className="flex items-start gap-3 rounded-[20px] bg-teal-100 p-4 text-[14px] leading-5 text-sage-text">
        <Info className="mt-0.5 size-5 shrink-0" /><p>Sessions are non-refundable, but you can reschedule free up to 24 h before.</p>
      </div>
      {inPlan ? (
        <div className="card flex items-center justify-between p-5"><span className="text-[20px] font-extrabold text-navy">In your plan</span><span className="text-[30px] font-extrabold tracking-[-0.02em] text-navy tnum">{formatINR(0)}</span></div>
      ) : pick !== 'once' ? (
        <div className="card flex items-center justify-between p-5"><span className="text-[20px] font-extrabold text-navy">Total</span><span className="text-[30px] font-extrabold tracking-[-0.02em] text-navy tnum">{formatINR(fee)}</span></div>
      ) : (
        <div className="card p-5">
          <div className="flex items-center justify-between"><span className="text-[20px] font-extrabold text-navy">To pay now</span><span className="text-[30px] font-extrabold tracking-[-0.02em] text-navy tnum">{formatINR(0)}</span></div>
          <p className="mt-2 text-[13px] leading-5 text-muted">Jitendra Khimlani or our team will set your time and fee ({formatINR(first)} first visit, {formatINR(follow)} after that). You then pay in the app by UPI or card, or at the center.</p>
        </div>
      )}
    </div>
  )
}

function Booked({ a }: { a: Appointment }) {
  const router = useRouter()
  const [cal, setCal] = useState(false)
  const c = { name: apptName(a), minutes: apptMinutes(a) }
  const ev = { id: a.id, title: 'BeWise session with Jitendra Khimlani', start: a.startsAt, minutes: c.minutes, location: a.mode === 'online' ? 'Online (link in the BeWise app)' : `${STUDIO.name}, ${STUDIO.full}`, description: `${c.name} (${a.code}). Find a quiet spot and keep water nearby.` }
  return (
    <main className="flex min-h-dvh flex-col px-5 safe-t">
      <Petals />
      <NotifyPrompt />
      <h1 className="h-duo mt-12 text-[36px]">{a.timeTbc ? <>Request <em>sent</em></> : a.timeRequested ? <>Time <em>requested</em></> : <>You’re <em>booked</em></>}</h1>
      <motion.div className="mx-auto mt-4" initial={{ scale: 0.4, rotate: -10, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}>
        <Mascot pose="wave" height={250} priority />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5, ease }} className="card mt-4 flex items-center gap-4 p-5">
        <span className="grid size-12 place-items-center rounded-full bg-peri-50 text-navy"><CalendarPlus className="size-6" /></span>
        {a.timeTbc
          ? <div><p className="text-[16px] font-bold text-navy">{c.name}</p><p className="text-[14px] text-muted">{a.mode === 'online' ? 'Online' : 'In person'} with Jitendra Khimlani · time to be confirmed</p></div>
          : <div><p className="text-[16px] font-bold text-navy">{fmtLongDay(a.startsAt)}</p><p className="text-[14px] text-muted">{fmtTime(a.startsAt)} · {a.mode === 'online' ? 'Online' : 'In person'} with Jitendra Khimlani</p></div>}
      </motion.div>
      {a.timeRequested && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mt-3 rounded-[20px] bg-marigold-100 p-4 text-[14px] leading-5 text-ink">
          <p><b>What happens next:</b> Jitendra Khimlani or our team will set a time for you and confirm it on WhatsApp.{a.kindTbc && !a.planId ? ' You’ll then see your fee here and can pay in the app.' : ''} If anything is unclear, we’ll call you.</p>
          <a href={`tel:${HELPLINE.tel}`} className="mt-2 inline-flex items-center gap-1.5 font-semibold text-navy underline underline-offset-4"><Phone className="size-4" /> Helpline {HELPLINE.label} ({HELPLINE.name})</a>
        </motion.div>
      )}
      <p className="mt-3 text-center text-[13px] text-muted">{a.kindTbc && !a.paidAt ? `Request ${a.code}. Nothing to pay yet.` : a.payLater ? `Booking ${a.code}. You can pay ${formatINR(a.amountPaise)} after your session.` : `Receipt ${a.code} is in Payments.`} Jitendra Khimlani will read your answers before you meet.</p>
      <div className="mt-auto space-y-3 pb-3 pt-6 safe-b">
        <Btn full onClick={() => router.replace(`/app/sessions/view?id=${a.id}`)}>View session booking</Btn>
        {!a.timeTbc && <Btn full variant="white" onClick={() => (isAndroid() ? addToCalendar(ev) : setCal(true))}><CalendarPlus className="size-5" /> Add to calendar</Btn>}
      </div>
      <Sheet open={cal} onClose={() => setCal(false)} title="Add to calendar">
        <h2 className="h-duo text-[24px]">Add to <em>calendar</em></h2>
        <div className="mt-4 space-y-2 pb-2">
          <a href={googleCalUrl(ev)} target="_blank" rel="noopener noreferrer" onClick={() => setCal(false)} className="flex h-14 items-center gap-3 rounded-[20px] bg-sky-50 px-4 text-[15px] font-semibold text-navy"><span className="text-[20px]">📅</span> Google Calendar</a>
          <button onClick={() => { downloadIcs('bewise-session.ics', sessionIcs(ev)); setCal(false); toast('Calendar file ready') }} className="flex h-14 w-full items-center gap-3 rounded-[20px] bg-sky-50 px-4 text-[15px] font-semibold text-navy"><span className="text-[20px]">🗓️</span> Apple Calendar & others (.ics)</button>
        </div>
      </Sheet>
    </main>
  )
}
