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
import { CalendarPlus, Check, ChevronLeft, ChevronRight, Clock, ExternalLink, Info, Laptop, MapPin, Phone, Quote, Sparkles, Video, CalendarCheck2 } from 'lucide-react'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Mascot, Petals } from '@/components/brand'
import { PaySheet } from '@/components/pay-sheet'
import { AppHeader, useUi } from '@/components/shell'
import { Btn, IconBtn, ProgressBar, Sheet, buzz, cx, ease, spring, toast, useStableCallback } from '@/components/ui'
import { CONSULTANT, CONSULTATIONS, NUANCE, STUDIO, TESTIMONIALS, TESTIMONIALS_SOURCE, istDate, slotsFor, type ConsultationId } from '@/lib/data'
import { InPersonArt, OnlineArt } from '@/components/mode-art'
import { TimePicker } from '@/components/time-picker'
import { parseIsoDay } from '@/lib/supply'
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
  const pickTime = useApp((s) => s.pickNewTime)
  const buyPlan = useApp((s) => s.buyPlan)
  const plan = useApp((s) => s.plan)
  const hasHistory = useApp((s) => s.appointments.length > 0 || !!s.blend)

  const [type, setType] = useState<ConsultationId | null>(() => (params.get('type') as ConsultationId) || (hasHistory ? null : 'first')) // new clients: first consultation pre-selected (owner 2026-11-18)
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
  const [skipAsk, setSkipAsk] = useState(false)
  const [payWhen, setPayWhen] = useState<'now' | 'later'>('now')
  // owner 2026-11-18: after the first consultation, offer 6 months (recommended), yearly (best value) or one time
  const [planPick, setPlanPick] = useState<PlanPick>('half')
  const [pending, setPending] = useState<Appointment>() // paid (or pay later) → choose a preferred time next

  // decided once per visit: submitting the intake mid-flow must not remove the steps we're standing on
  const [needIntake] = useState(() => !intake?.submittedAt)
  // owner 2026-11-18: no follow-up questions for the chosen feelings (or none chosen) → skip "Tell us a little more"
  const skipNuance = !answers.feelings.some((f) => NUANCE[f])
  const flow: Step[] = useMemo(() => {
    // owner 2026-11-18: payment first, then a preferred time (confirmed by Jitendra Khimlani or Haresh bhai)
    if (type === 'followup') return ['choose', ...CHECKIN, 'mode', 'pay', 'time', 'done']
    return ['choose', ...(needIntake ? INTAKE.filter((x) => x !== 'nuance' || !skipNuance) : []), 'mode', 'pay', 'time', 'done'] as Step[]
  }, [type, needIntake, skipNuance])

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
    go(n)
  }
  // owner 2026-11-18: "Skip" replaces "Save for later"; answers so far are kept, straight on to choosing a time
  const skipIntake = () => { saveIntake(answers, Math.max(1, INTAKE.indexOf(step as never))); setSkipAsk(false); go('mode') }
  const back = () => (idx <= 0 ? router.back() : go(flow[idx - 1], -1))
  const setA = (p: Partial<IntakeAnswers>) => setAnswers((a) => ({ ...a, ...p }))
  const c = CONSULTATIONS.find((x) => x.id === (type ?? 'first'))!
  const inPlan = type === 'followup' && planLeft(plan) > 0
  const pick: PlanPick = type === 'followup' && hasHistory && !inPlan ? planPick : 'once'
  const fee = inPlan ? 0 : pick === 'once' ? c.feePaise : planPrice(pick)
  const feeLabel = inPlan ? 'Included in your plan' : pick === 'once' ? c.name : `${PLANS[pick].name} · launch offer`

  // owner 2026-11-18: every intake / check-in question is optional — only mode and time are needed to book
  const can: Partial<Record<Step, boolean>> = { mode: !!mode, time: !!slot }
  const steps = COUNTED.filter((x) => x !== 'nuance' || !skipNuance)
  const counted = steps.indexOf(step as string)
  const isIntake = INTAKE.includes(step as never) && step !== 'saved'

  // paid (or chose to pay later / covered by a plan): the booking exists, the time comes next
  const confirmPaid = (later = false) => {
    if (!mode) return
    if (pick !== 'once' && !inPlan && !later) buyPlan(pick, fee)
    const usePlan = inPlan || (pick !== 'once' && !later)
    const a = book({ type: c.id, mode, startsAt: new Date().toISOString(), amountPaise: usePlan ? 0 : fee, needsNewTime: true,
      ...(later ? { payLater: true } : { paidAt: new Date().toISOString() }), ...(usePlan ? { planId: pick === 'once' ? plan?.id : pick } : {}) })
    setPaying(false); setPending(a); go('time')
  }
  const requestTime = () => {
    if (!pending || !slot) return
    pickTime(pending.id, slot.toISOString())
    setBooked({ ...pending, startsAt: slot.toISOString(), needsNewTime: false, timeRequested: true }); go('done')
  }

  if (step === 'done' && booked) return <Booked a={booked} />

  return (
    <main className="flex min-h-dvh flex-col px-5">
      {step === 'choose' ? <AppHeader back="/app/remedies" /> : (
        <header className="sticky top-0 z-30 -mx-5 bg-[linear-gradient(180deg,#dce2f5_0%,#dce2f5_75%,rgba(220,226,245,0)_100%)] px-5 pb-5 pt-2 safe-t">
          <div className="flex items-center gap-3">
            <IconBtn label="Back" onClick={back}><ChevronLeft className="size-5" /></IconBtn>
            {isIntake ? (
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-navy">{step === 'intro' ? 'A moment for you' : counted >= 0 ? `Step ${counted + 1} of ${steps.length}` : 'Almost done'}</p>
                <ProgressBar value={step === 'intro' ? 0.02 : counted >= 0 ? (counted + 1) / steps.length : 1} className="mt-1.5" />
              </div>
            ) : <Stepper at={CHECKIN.includes(step as never) || INTAKE.includes(step as never) ? 0 : step === 'time' ? 2 : 1} />}
            {isIntake && step !== 'intro' && (
              <button onClick={() => (hasHistory ? skipIntake() : setSkipAsk(true))}
                className="shrink-0 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-navy shadow-[var(--shadow-card)]">Skip</button>
            )}
          </div>
        </header>
      )}

      <div className={cx('relative flex-1 pt-2', step === 'choose' ? 'pb-48' : 'pb-36')}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -40 }} transition={{ duration: 0.32, ease }}>
            {step === 'choose' && <Choose type={type} setType={setType} canFollow={hasHistory} plan={plan} planPick={planPick} setPlanPick={setPlanPick} onMeet={() => setMeet(true)} onStories={() => setStories(true)} />}
            {step === 'intro' && <I.IntakeIntro />}
            {step === 'who' && <I.StepWho a={answers} set={setA} />}
            {step === 'feelings' && <I.StepFeelings a={answers} set={setA} />}
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
            {step === 'ck-news' && <I.CheckinNews c={checkin} set={(p) => setCheckin((x) => ({ ...x, ...p }))} />}
            {step === 'mode' && <Mode mode={mode} setMode={setMode} />}
            {step === 'time' && <><TimeHead /><TimePicker slot={slot} setSlot={setSlot} initialDay={parseIsoDay(params.get('date'))} heading={false} /></>}
            {step === 'pay' && mode && <Review c={c} mode={mode} fee={fee} feeLabel={feeLabel} inPlan={inPlan} canLater={pick === 'once' && !inPlan} payWhen={payWhen} setPayWhen={setPayWhen} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={cx('fixed inset-x-0 z-30 mx-auto max-w-[480px] px-5', step === 'choose' ? 'bottom-[calc(max(env(safe-area-inset-bottom),12px)+76px)] pb-2' : 'bottom-0 bg-gradient-to-t from-[#e6eee3] via-[#e6eee3]/95 to-transparent pb-3 pt-8 safe-b')}>
        {step === 'choose' ? (
          <Btn full variant="gradient" disabled={!type} onClick={next}>{type === 'followup' ? 'Start 2-minute check-in' : 'Continue'}</Btn>
        ) : step === 'pay' ? (
          <>
            {inPlan ? <>
              <Btn full variant="gradient" onClick={() => confirmPaid()}><CalendarCheck2 className="size-5" /> Continue to choose a time</Btn>
              <p className="mt-2 text-center text-[12px] text-muted">{planLeft(plan)} sessions left in your plan</p>
            </> : payWhen === 'now' || pick !== 'once' ? <>
              <Btn full variant="gradient" onClick={() => setPaying(true)}><span aria-hidden>🔒</span> Pay {formatINR(fee)}</Btn>
              <p className="mt-2 text-center text-[12px] text-muted">Secured by Razorpay · then choose your preferred time</p>
            </> : <>
              <Btn full variant="gradient" onClick={() => confirmPaid(true)}><CalendarCheck2 className="size-5" /> Continue to choose a time</Btn>
              <p className="mt-2 text-center text-[12px] text-muted">Pay {formatINR(fee)} after your session</p>
            </>}
          </>
        ) : step === 'time' ? (
          <>
            <Btn full variant={slot ? 'gradient' : 'primary'} disabled={!slot} onClick={requestTime}>Request this time</Btn>
            <p className="mt-2 text-center text-[12px] text-muted">Jitendra Khimlani or Haresh bhai will confirm it</p>
          </>
        ) : (
          <Btn full variant={can[step] === false ? 'primary' : 'gradient'} disabled={can[step] === false} onClick={next}>
            {step === 'intro' ? 'I’m ready, let’s start' : step === 'gentle' ? 'Review answers' : step === 'review' ? 'Save & continue' : 'Continue'}
          </Btn>
        )}
      </div>

      <PaySheet open={paying} amountPaise={fee} purpose={feeLabel} onClose={() => setPaying(false)} onPaid={() => confirmPaid()} />
      <MeetSheet open={meet} onClose={() => setMeet(false)} />
      <StoriesSheet open={stories} onClose={() => setStories(false)} />
      <Sheet open={skipAsk} onClose={() => setSkipAsk(false)} title="Skip the questions?">
        <div className="text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#fbf3dc] text-[30px]" aria-hidden>🌼</span>
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
    { k: 'half', t: '6 months', tag: 'Recommended', price: planPrice('half'), full: live ? planFull('half') : undefined, note: live ? '1 month free' : '6 consultations', emoji: '🌱' },
    { k: 'yearly', t: 'Yearly', tag: 'Best value', price: planPrice('yearly'), full: live ? planFull('yearly') : undefined, note: live ? `2 months free · save ${formatINR(planSaving('yearly'))}` : '12 consultations', emoji: '🌳' },
    { k: 'once', t: 'One time', price: CONSULTATIONS.find((x) => x.id === 'followup')!.feePaise, note: 'Just this session', emoji: '🌼' },
  ]
  return (
    <section aria-labelledby="plan-h">
      <h2 id="plan-h" className="px-1 text-[15px] font-bold text-navy">How would you like to continue?</h2>
      <p className="px-1 text-[13px] text-muted">A consultation every month keeps your blend fresh.</p>
      <div className="mt-3 space-y-2.5" role="radiogroup" aria-label="Plan">
        {opts.map((o, i) => {
          const on = pick === o.k
          return (
            <motion.button key={o.k} type="button" role="radio" aria-checked={on} onClick={() => { buzz(6); setPick(o.k) }} whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05 }}
              className={cx('relative flex w-full items-center gap-3 rounded-[22px] p-4 text-left transition-colors', on ? 'bg-white ring-2 ring-navy shadow-[var(--shadow-float)]' : 'bg-white shadow-[var(--shadow-card)]')}>
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-peri-50 text-[22px]" aria-hidden>{o.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5"><span className="text-[16px] font-bold text-navy">{o.t}</span>
                  {o.tag && <span className={cx('rounded-full px-2 py-0.5 text-[11px] font-bold', o.k === 'yearly' ? 'bg-[#fbf3dc] text-[#8a6a2c]' : 'bg-sage-100 text-sage-text')}>{o.tag}</span>}</span>
                <span className="block text-[12px] text-muted">{o.note}</span>
              </span>
              <span className="text-right">
                {o.full && <span className="block text-[12px] text-muted line-through tnum">{formatINR(o.full)}</span>}
                <span className="block text-[17px] font-extrabold text-navy tnum">{formatINR(o.price)}</span>
              </span>
              <span className={cx('grid size-6 shrink-0 place-items-center rounded-full border-2', on ? 'border-navy bg-navy text-white' : 'border-[#cfd5e5]')}>{on && <Check className="size-3.5" strokeWidth={3} />}</span>
            </motion.button>
          )
        })}
      </div>
      {live && <p className="mt-2 px-1 text-[12px] font-semibold text-[#8a6a2c]">🎁 Launch prices till 1 December</p>}
    </section>
  )
}

function Stepper({ at }: { at: number }) {
  return (
    <div className="flex flex-1 items-center justify-center" role="group" aria-label={`Step ${at + 1} of 3`}>
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

function Choose({ type, setType, canFollow, plan, planPick, setPlanPick, onMeet, onStories }: { type: ConsultationId | null; setType: (t: ConsultationId) => void; canFollow: boolean; plan: Plan | null; planPick: PlanPick; setPlanPick: (p: PlanPick) => void; onMeet: () => void; onStories: () => void }) {
  // returning clients who met Jitendra Khimlani before the app have no history here — offer follow-up quietly (owner 2026-11-18)
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
      {type === 'followup' && canFollow && (planLeft(plan) > 0 ? (
        <div className="flex items-center gap-3 rounded-[22px] bg-sage-100/80 p-4 text-[14px] text-sage-text">
          <span className="text-[22px]" aria-hidden>{PLANS[plan!.id].emoji}</span>
          <span className="flex-1"><b>{PLANS[plan!.id].name}</b> · {planLeft(plan)} sessions left. This one is included.</span>
        </div>
      ) : <PlanPicker pick={planPick} setPick={setPlanPick} />)}
      {!follow && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} onClick={() => { buzz(); setShowFollow(true); setType('followup') }}
          className="mx-auto -mt-1 block rounded-full px-4 py-2 text-[14px] text-muted">
          <span className="font-semibold text-navy underline underline-offset-4">Book a follow-up · ₹800</span>
        </motion.button>
      )}
      <motion.button onClick={onMeet} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="card flex w-full items-center gap-4 p-4 text-left">
        <img src={`${BP}/img/jitu.webp`} alt="" className="size-16 shrink-0 rounded-[20px] bg-[linear-gradient(160deg,#e7ecfa,#f6efe4)] object-cover object-top" />
        <span className="flex-1"><span className="block text-[16px] font-bold text-navy">Meet Jitendra Khimlani</span><span className="text-[13px] text-muted">{CONSULTANT.title} · {CONSULTANT.stats[0]}</span></span>
        <ChevronRight className="size-5 text-soft" />
      </motion.button>
      <motion.button onClick={onStories} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.36 }} className="card flex w-full items-center gap-4 p-4 text-left">
        <span className="relative grid size-14 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#fbf3dc,#fbe9ee)] ring-4 ring-peri-50">
          <Quote className="size-6 text-gold" aria-hidden />
        </span>
        <span className="flex-1"><span className="block text-[16px] font-bold text-navy">Client stories</span><span className="text-[13px] text-muted">{TESTIMONIALS.length ? `View ${TESTIMONIALS.length} testimonials` : 'View testimonials'}</span></span>
        <ChevronRight className="size-5 text-soft" />
      </motion.button>
      <p className="px-2 text-center text-[13px] text-muted">Online or in person, you choose next. Sessions are non-refundable, but you can reschedule.</p>
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
      <p className="mt-1 text-[14px] text-muted">In their own words, shared with permission.</p>
      {n ? (
        <>
          <div className="relative mt-5 min-h-[210px]">
            <AnimatePresence mode="wait">
              <motion.figure key={k} drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={(_, i) => { if (i.offset.x < -50) setK((k + 1) % n); else if (i.offset.x > 50) setK((k - 1 + n) % n) }}
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35, ease }}
                className="rounded-[26px] bg-[linear-gradient(140deg,#fbf3dc,#f6efe4_55%,#eef1fb)] p-6">
                <Quote className="size-8 text-gold" aria-hidden />
                {t.rating ? <p className="mt-2 text-[15px] tracking-[2px] text-gold" role="img" aria-label={`${t.rating} out of 5`}>{'★'.repeat(t.rating)}</p> : null}
                <blockquote className="mt-3 text-[17px] font-semibold leading-7 text-navy">“{t.quote}”</blockquote>
                <figcaption className="mt-4 text-[14px] text-muted">{t.name}{t.city ? `, ${t.city}` : ''}</figcaption>
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
          <a href={TESTIMONIALS_SOURCE} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-navy underline underline-offset-4">Read stories on Jitendra Khimlani’s website <ExternalLink className="size-4" /></a>
        </div>
      )}
    </Sheet>
  )
}

function MeetSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Meet your consultant" tall>
      <div className="relative mt-1 flex h-[300px] items-end justify-center overflow-hidden rounded-[24px] bg-[linear-gradient(160deg,#e7ecfa,#f6efe4)]">
        <img src={`${BP}/img/jitu-portrait.webp`} alt="Jitendra Khimlani, smiling" className="h-[96%] w-auto object-contain" />
      </div>
      <h2 className="h-duo mt-4 text-[28px]">Jitendra <em>Khimlani</em></h2>
      <p className="text-[14px] font-semibold text-peri">{CONSULTANT.title}</p>
      <p className="mt-3 text-[15px] leading-6 text-ink">{CONSULTANT.approach}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">{CONSULTANT.stats.map((s) => <div key={s} className="rounded-[18px] bg-peri-50 p-3 text-[13px] font-semibold text-navy">{s}</div>)}</div>
      <div className="mt-4 rounded-[22px] bg-[linear-gradient(135deg,#fbf3dc,#eef1fb)] p-4">
        <p className="text-[15px] font-bold text-navy">How Bach remedies work</p>
        <p className="mt-1 text-[14px] leading-5 text-muted">Dr Edward Bach’s flower remedies are each linked to an emotional state. Your blend is chosen for how you feel. A gentle, complementary practice alongside your doctor’s care.</p>
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
            className={cx('relative w-full cursor-pointer overflow-hidden rounded-[28px] p-5 text-left transition-colors duration-300', on ? 'bg-navy text-white shadow-[var(--shadow-float)]' : 'bg-white shadow-[var(--shadow-card)]')}>
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

function TimeHead() {
  return (
    <div className="mb-4">
      <p className="inline-flex items-center gap-1.5 rounded-full bg-sage-100 px-3 py-1.5 text-[12px] font-bold text-sage-text"><Check className="size-3.5" strokeWidth={3} /> You’re all set</p>
      <h1 className="h-duo mt-3">Your preferred <em>time</em></h1>
      <p className="mt-1 text-[14px] leading-5 text-muted">Pick what suits you. Jitendra Khimlani or Haresh bhai will confirm it, or our team will call you to find a better time.</p>
    </div>
  )
}

function Review({ c, mode, fee, feeLabel, inPlan, canLater, payWhen, setPayWhen }: { c: (typeof CONSULTATIONS)[number]; mode: 'online' | 'in_person'; fee: number; feeLabel: string; inPlan: boolean; canLater: boolean; payWhen: 'now' | 'later'; setPayWhen: (v: 'now' | 'later') => void }) {
  return (
    <div className="space-y-4">
      <h1 className="h-duo">Review & <em>book</em></h1>
      <div className="card p-5">
        <div className="-mx-5 -mt-5 mb-1 flex items-end gap-4 overflow-hidden rounded-t-[28px] border-b border-line bg-[linear-gradient(160deg,#e7ecfa,#f6efe4)] px-5 pt-4">
          <img src={`${BP}/img/jitu-portrait.webp`} alt="" className="h-[140px] w-auto shrink-0 object-contain" />
          <div className="pb-5"><p className="text-[20px] font-extrabold text-navy">Jitendra Khimlani</p><p className="text-[13px] text-muted">{CONSULTANT.title}</p></div>
        </div>
        {[
          { i: <Sparkles className="size-5" />, t: feeLabel === c.name ? c.name : `${c.name} · ${feeLabel}` },
          { i: mode === 'online' ? <Video className="size-5" /> : <MapPin className="size-5" />, t: mode === 'online' ? 'Online · video call' : `In person · ${STUDIO.short}` },
          { i: <Clock className="size-5" />, t: 'Preferred time: you choose next' },
        ].map((r, k) => (
          <motion.div key={k} className="flex items-center gap-3 border-b border-line py-3.5 last:border-0" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + k * 0.06 }}>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-peri-50 text-navy">{r.i}</span><span className="text-[15px] font-semibold text-ink">{r.t}</span>
          </motion.div>
        ))}
        <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-sage-100 px-3 py-1.5 text-[12px] font-bold text-sage-text"><Check className="size-3.5" strokeWidth={3} /> Remedy blend included</span>
      </div>
      <div className="flex items-start gap-3 rounded-[22px] bg-sage-100/70 p-4 text-[14px] leading-5 text-sage-text">
        <Info className="mt-0.5 size-5 shrink-0" /><p>Sessions are non-refundable, but you can reschedule free up to 24 h before.</p>
      </div>
      {canLater && (
        <div role="radiogroup" aria-label="When would you like to pay?" className="grid grid-cols-2 gap-2.5">
          {([
            { k: 'now', e: '💳', t: 'Pay now', d: 'UPI, cards, netbanking' },
            { k: 'later', e: '🤝', t: 'Pay after session', d: 'UPI, card or at the center' },
          ] as const).map((o) => {
            const on = payWhen === o.k
            return (
              <motion.button key={o.k} type="button" role="radio" aria-checked={on} whileTap={{ scale: 0.97 }} onClick={() => { buzz(6); setPayWhen(o.k) }}
                className={cx('relative rounded-[22px] p-4 text-left transition-colors', on ? 'bg-navy text-white shadow-[var(--shadow-float)]' : 'bg-white text-navy shadow-[var(--shadow-card)]')}>
                <span className="text-[22px]" aria-hidden>{o.e}</span>
                <span className="mt-1.5 block text-[15px] font-bold">{o.t}</span>
                <span className={cx('block text-[12px] leading-4', on ? 'text-white/75' : 'text-muted')}>{o.d}</span>
                <AnimatePresence>{on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring} className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-white text-navy"><Check className="size-3.5" strokeWidth={3} /></motion.span>}</AnimatePresence>
              </motion.button>
            )
          })}
        </div>
      )}
      <div className="card flex items-center justify-between p-5">
        <span className="text-[20px] font-extrabold text-navy">{inPlan ? 'In your plan' : payWhen === 'later' && canLater ? 'Due after session' : 'Total'}</span>
        <span className="text-[30px] font-extrabold tracking-[-0.02em] text-navy tnum">{formatINR(fee)}</span>
      </div>
    </div>
  )
}

function Booked({ a }: { a: Appointment }) {
  const router = useRouter()
  const [cal, setCal] = useState(false)
  const c = CONSULTATIONS.find((x) => x.id === a.type)!
  const ev = { id: a.id, title: 'BeWise session with Jitendra Khimlani', start: a.startsAt, minutes: c.minutes, location: a.mode === 'online' ? 'Online (link in the BeWise app)' : `${STUDIO.name}, ${STUDIO.full}`, description: `${c.name} (${a.code}). Find a quiet spot and keep water nearby.` }
  return (
    <main className="flex min-h-dvh flex-col px-5 safe-t">
      <Petals />
      <h1 className="h-duo mt-12 text-[38px]">{a.timeRequested ? <>Time <em>requested</em></> : <>You’re <em>booked</em></>}</h1>
      <motion.div className="mx-auto mt-4" initial={{ scale: 0.4, rotate: -10, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}>
        <Mascot pose="wave" height={250} priority />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5, ease }} className="card mt-4 flex items-center gap-4 p-5">
        <span className="grid size-12 place-items-center rounded-full bg-peri-50 text-navy"><CalendarPlus className="size-6" /></span>
        <div><p className="text-[16px] font-bold text-navy">{fmtLongDay(a.startsAt)}</p><p className="text-[14px] text-muted">{fmtTime(a.startsAt)} · {a.mode === 'online' ? 'Online' : 'In person'} with Jitendra Khimlani</p></div>
      </motion.div>
      {a.timeRequested && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mt-3 rounded-[22px] bg-[#fbf3dc] p-4 text-[14px] leading-5 text-[#6b5320]">
          <p><b>Waiting for confirmation.</b> Jitendra Khimlani or Haresh bhai will confirm this time. If it doesn’t work, our team will call you.</p>
          <a href={`tel:${HELPLINE.tel}`} className="mt-2 inline-flex items-center gap-1.5 font-semibold text-navy underline underline-offset-4"><Phone className="size-4" /> Helpline {HELPLINE.label} ({HELPLINE.name})</a>
        </motion.div>
      )}
      <p className="mt-3 text-center text-[13px] text-muted">{a.payLater ? `Booking ${a.code}. You can pay ${formatINR(a.amountPaise)} after your session.` : `Receipt ${a.code} is in Payments.`} Jitendra Khimlani will read your answers before you meet.</p>
      <div className="mt-auto space-y-3 pb-3 pt-6 safe-b">
        <Btn full onClick={() => router.replace(`/app/sessions/view?id=${a.id}`)}>View appointment</Btn>
        <Btn full variant="white" onClick={() => (isAndroid() ? addToCalendar(ev) : setCal(true))}><CalendarPlus className="size-5" /> Add to calendar</Btn>
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
