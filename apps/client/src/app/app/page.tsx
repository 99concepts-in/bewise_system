'use client'
/**
 * @module   client-home
 * @owner    CLIENT
 * @screens  CL-08 Home (spec docs/specs/client/CL-08-home.md) · CL-56 progress (compact)
 * v5 (HUB 2026-11-20): Blue Bloom Home (DESIGN-SYSTEM §7) — greeting + "How are you feeling today?" as 6 colourful feeling
 *   circles (logs a journal mood, petal burst, one gentle line) → one actionable card when something needs the client
 *   (pay / resume answers / next session / feedback) → "Meet Jitendra Khimlani" (opens the full-screen story) → today's blend →
 *   shop row → journal · goals · Ask BeWise tiles. Floating "Book" pill above the tab bar. Kept uncluttered: the v4 goals
 *   card, daily insight and progress moved to Journal / Goals / Care (all still one tap away).
 */
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRight, BookHeart, CalendarHeart, Check, ChevronRight, MessageCircleHeart, Target, Video, Smile, PenLine } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MoodImg } from '@/components/brand'
import { LaunchBanner } from '@/components/launch-offer'
import { MoodLogger } from '@/components/mood-logger'
import { Tour } from '@/components/tour'
import { SetupFlow } from '@/components/prompts'
import { BlendPreparing } from '@/components/blend-preparing'
import { MoodGarden } from '@/components/mood-garden'
import { NoteCard } from '@/components/note-card'
import { MOOD_LEVELS, MoodShape } from '@/components/mood-shape'
import { LearnCard } from '@/components/learn-card'
import { ReminderSetup, useMorningNudge } from '@/components/reminder-setup'
import { AppHeader } from '@/components/shell'
import { SessionDateArt } from '@/components/session-art'
import { FeelingIcon } from '@/components/flower'
import { JituPortrait, JituStory, Sparkle } from '@/components/jitu-story'
import { ProductCard } from '@/components/product-card'
import { BtnLink, Item, Reveal, buzz, cx, ease, toast, useChrome, useNow } from '@/components/ui'
import { CONSULTATIONS, CONSULTANT, PRODUCTS, moodOf, type Emotion } from '@/lib/data'
import { ACCENTS, HOME_FEELINGS, type HomeFeeling } from '@/lib/feelings'
import { apptName, isUpcoming, tbc, whenShort } from '@/lib/appt'
import { GoalCheck } from '@/components/goal-check'
import { doneToday, kindOf, streak } from '@/lib/goals'
import { DoseBlooms, DoseCalendar, careDays } from '@/components/dose-tracker'
import { RemedyBottle } from '@/components/remedy-bottle'
import { doseStats, dosesOn, perDay } from '@/lib/doses'
import { useApp, type Appointment } from '@/lib/store'
import { dayKey, firstName, fmtDay, fmtTime, formatINR } from '@/lib/format'
import { blendSupply } from '@/lib/supply'
import { Verified } from '@/components/verified'
import { BP } from '@/lib/asset'

const greet = (h: number) => (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')

export default function Home() {
  const profile = useApp((s) => s.profile)
  const blend = useApp((s) => s.blend)
  const [story, setStory] = useState(false)
  const [logger, setLogger] = useState<'moment' | 'day' | null>(null)
  const now = useNow(60_000)
  useMorningNudge()

  return (
    <main className="home-wash -mx-0 min-h-dvh px-5 pb-[calc(env(safe-area-inset-bottom)+104px)]">
      <AppHeader />
      <Reveal className="space-y-6">
        <Item>
          <p className="text-[16px] font-medium text-ink-2">{greet(new Date(now).getHours())},</p>
          <h1 className="h-display mt-0.5">{firstName(profile?.name)}</h1>
        </Item>

        {/* owner 2026-11-23: the remedy first, then "log how you feel" right under it (the feelings grid is gone) */}
        {/* owner 2026-11-24: the day's last dose opens the mood logger straight away (the breathe screen is off for now) */}
        {/* owner 2026-11-24: every dose checked in asks how they feel */}
        {blend ? <Item data-tour="remedy"><TodaysBlend onDose={() => setLogger('moment')} /></Item> : <BlendPreparing />}

        <Item data-tour="mood"><MoodPrompt onLog={(k) => setLogger(k)} /></Item>

        <ContextCard />

        {/* owner 2026-11-24: the mood graph lives on Home; it blooms after 10 check-ins */}
        <Item><MoodGarden onLog={() => setLogger('moment')} /></Item>

        <Item><NoteCard /></Item>

        {/* owner 2026-11-24: "How Bach flowers can help" sits above the book-a-session card */}
        <Item data-tour="learn"><LearnCard /></Item>

        <Item data-tour="meet"><MeetCard open={story} onOpen={() => { buzz(8); setStory(true) }} /></Item>

        <GoalsCard />

        {/* owner 2026-11-24: the offer sits near the bottom, just above the rituals */}
        <Item className="empty:hidden"><LaunchBanner /></Item>

        <Item><ShopRow /></Item>

        <Item data-tour="ask"><YourSpace /></Item>
      </Reveal>

      <MoodLogger open={!!logger} kind={logger ?? 'moment'} onClose={() => setLogger(null)} />
      <Tour />
      <SetupFlow />
      <ReminderSetup />
      <JituStory open={story} onClose={() => setStory(false)} />
    </main>
  )
}

/* ---------------- log how you feel (owner 2026-11-23) ---------------- */
/** After logging, the card shows that feeling for 4 hours, then asks again. From 7 PM it also asks about the day overall. */
function MoodPrompt({ onLog }: { onLog: (k: 'moment' | 'day') => void }) {
  const journal = useApp((s) => s.journal)
  const { openEntry } = useChrome()
  const now = useNow(60_000)
  const last = journal.find((e) => e.kind !== 'day')
  const recent = last && now - +new Date(last.at) < 4 * 3600_000 ? last : null
  const evening = new Date(now).getHours() >= 19
  const dayDone = journal.some((e) => e.kind === 'day' && dayKey(e.at) === dayKey(new Date(now)))
  return (
    <section className="space-y-2.5" aria-label="Log how you feel">
      {recent ? (
        <div className="card p-4">
          <div className="flex items-center gap-3">
            {recent.valence ? <span className="grid size-14 shrink-0 place-items-center rounded-[18px] bg-[#1f2128]"><MoodShape v={recent.valence - 1} size={48} spin={false} /></span> : <MoodImg mood={recent.emotion} size={48} />}
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-muted">You felt{recent.valence ? ` · ${MOOD_LEVELS[recent.valence - 1].toLowerCase()}` : ''} · {fmtTime(recent.at)}</p>
              <p className="font-display text-[19px] font-semibold leading-6 text-ink">{[recent.emotion, ...(recent.also ?? [])].map((e) => moodOf(e).label).join(', ')}</p>
            </div>
          </div>
          {recent.note && <button onClick={() => openEntry(recent.id)} className="mt-3 block w-full rounded-[16px] bg-peri-50/70 px-3.5 py-2.5 text-left text-[14px] italic leading-5 text-ink-2">“{recent.note}”</button>}
          {/* owner 2026-11-24: after logging, an option to add a note */}
          <div className="mt-3 flex gap-2">
            <button onClick={() => { buzz(8); openEntry(recent.id) }} className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-navy text-[14px] font-semibold text-white"><PenLine className="size-4" /> {recent.note ? 'Edit note' : 'Add a note'}</button>
            <button onClick={() => { buzz(8); onLog('moment') }} className="flex h-11 flex-1 items-center justify-center rounded-full bg-peri-50 text-[14px] font-semibold text-navy">Log again</button>
          </div>
        </div>
      ) : (
        <motion.button onClick={() => { buzz(8); onLog('moment') }} whileTap={{ scale: 0.98 }} className="card relative flex w-full items-center gap-3 overflow-hidden p-4 text-left">
          {/* owner 2026-11-24: simple icon (the animated petals felt odd): a soft mood-colour tile with a smile, gently breathing */}
          <motion.span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-[linear-gradient(135deg,#8B5CF6,#5E9DB5_50%,#F0904A)] text-white shadow-[0_6px_16px_rgba(91,92,200,.25)]"
            animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
            <Smile className="size-6" strokeWidth={2.2} />
          </motion.span>
          <span className="min-w-0 flex-1"><span className="block text-[16px] font-bold text-navy">Log how you feel right now</span><span className="text-[13px] text-muted">Takes 5 seconds</span></span>
          <ChevronRight className="size-5 text-navy" />
        </motion.button>
      )}
      {evening && !dayDone && (
        <motion.button onClick={() => { buzz(8); onLog('day') }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.98 }}
          className="flex w-full items-center gap-3 rounded-[24px] bg-[linear-gradient(120deg,#2b2f6b,#5b3fb8)] p-4 text-left text-white shadow-[var(--shadow-float)]">
          <span className="text-[26px]" aria-hidden>🌙</span>
          <span className="min-w-0 flex-1"><span className="block text-[16px] font-bold">How was your day overall?</span><span className="text-[13px] text-white/80">A quick evening check-in</span></span>
          <ChevronRight className="size-5" />
        </motion.button>
      )}
    </section>
  )
}

/* ---------------- feelings (retired from Home 2026-11-23; kept for reference) ---------------- */
/** owner 2026-11-20: after picking, a short celebration plays, then the grid collapses into a card made for that feeling. */
function FeelingCircles() {
  const journal = useApp((s) => s.journal)
  const logMood = useApp((s) => s.logMood)
  const { openLog, openEntry } = useChrome()
  const reduce = useReducedMotion()
  const todays = journal.filter((e) => dayKey(e.at) === dayKey(new Date()))
  const last = todays[0]
  const [phase, setPhase] = useState<'pick' | 'celebrate' | 'done'>(() => (last ? 'done' : 'pick'))
  const [picked, setPicked] = useState<HomeFeeling | null>(null)
  const current = picked ?? HOME_FEELINGS.find((f) => f.mood === last?.emotion) ?? null

  const tap = (f: HomeFeeling) => {
    logMood(f.mood); buzz(12); setPicked(f)
    if (reduce) return setPhase('done')
    setPhase('celebrate'); window.setTimeout(() => setPhase('done'), 1700)
  }

  return (
    <motion.section layout transition={{ duration: 0.45, ease }} aria-label="Log how you feel">
      <AnimatePresence mode="wait" initial={false}>
        {phase === 'pick' && (
          <motion.div key="pick" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3, ease }}>
            <div className="grid grid-cols-3 gap-x-3 gap-y-4">
              {HOME_FEELINGS.map((f) => <FeelingCircle key={f.mood} f={f} selected={last?.emotion === f.mood} onPick={() => tap(f)} />)}
            </div>
            <p className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[14px] text-ink-2">
              <span>One tap. Takes 3 seconds.</span>
              <span className="flex items-center gap-1">
                <button onClick={openLog} className="min-h-11 rounded-full px-2 font-semibold text-navy underline-offset-4 hover:underline">More feelings</button>
                {last && <button onClick={() => setPhase('done')} className="min-h-11 rounded-full px-2 font-semibold text-navy">Cancel</button>}
              </span>
            </p>
          </motion.div>
        )}
        {phase === 'celebrate' && current && <Celebrate key="celebrate" f={current} />}
        {phase === 'done' && current && last && (
          <motion.div key="done" initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease }}
            className="overflow-hidden rounded-[28px] p-4 shadow-[var(--shadow-card)]" style={{ background: `linear-gradient(135deg, ${ACCENTS[current.accent].c100}, #ffffff 70%)` }} role="status">
            <div className="flex items-center gap-3.5">
              <span className="grid size-14 shrink-0 place-items-center rounded-full shadow-[0_8px_18px_rgba(23,33,74,.12)]" style={{ background: ACCENTS[current.accent].c500, color: ACCENTS[current.accent].onInk ? '#17214A' : '#FFFFFF' }}>
                <FeelingIcon icon={current.icon} size={30} strokeWidth={1.9} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-ink-2">Today you’re feeling</p>
                <p className="font-display text-[20px] font-semibold leading-6 text-ink">{current.label} <span className="text-[13px] font-medium text-ink-2">· {fmtTime(last.at)}</span></p>
              </div>
              <button onClick={() => setPhase('pick')} className="min-h-11 shrink-0 rounded-full bg-white px-3.5 text-[13px] font-semibold text-navy shadow-[var(--shadow-card)]">Change</button>
            </div>
            <p className="mt-3 text-[14px] leading-5 text-ink">{current.tip}</p>
            {/* owner 2026-11-20: just two options here */}
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => openEntry(last.id)} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-navy px-4 text-[14px] font-semibold text-white">{last.note ? 'Edit note' : 'Add a note'}</button>
              <Link href="/app/journal" className="inline-flex min-h-11 items-center gap-1 rounded-full bg-white px-4 text-[14px] font-semibold text-navy shadow-[var(--shadow-card)]">My journal<ChevronRight className="size-4" /></Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

/** The moment between tap and the collapsed card: the circle blooms, rings ripple out, petals fly. */
function Celebrate({ f }: { f: HomeFeeling }) {
  const a = ACCENTS[f.accent]
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
      className="relative flex h-[300px] flex-col items-center justify-center overflow-hidden rounded-[28px]" style={{ background: `radial-gradient(circle at 50% 45%, ${a.c100}, #ffffff 75%)` }} aria-live="polite">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} aria-hidden className="absolute left-1/2 top-[42%] size-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
          style={{ borderColor: a.c500 }} initial={{ scale: 0.6, opacity: 0.7 }} animate={{ scale: 2.6, opacity: 0 }} transition={{ duration: 1.4, delay: i * 0.25, ease: 'easeOut' }} />
      ))}
      <motion.span className="relative grid size-[120px] place-items-center rounded-full shadow-[0_18px_40px_rgba(23,33,74,.18)]"
        style={{ background: a.c500, color: a.onInk ? '#17214A' : '#FFFFFF' }}
        initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: [0.4, 1.12, 1], rotate: [-20, 6, 0] }} transition={{ duration: 0.8, ease }}>
        <FeelingIcon icon={f.icon} size={64} strokeWidth={1.75} />
        <PetalBurst color={a.c500} big />
      </motion.span>
      <motion.p className="mt-6 font-display text-[22px] font-semibold text-ink" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }}>
        {f.label}, noted
      </motion.p>
      <motion.p className="mt-1 text-[14px] text-ink-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>Thank you for checking in with yourself</motion.p>
    </motion.div>
  )
}

function FeelingCircle({ f, selected, burstKey, onPick }: { f: HomeFeeling; selected: boolean; burstKey?: number; onPick: () => void }) {
  const a = ACCENTS[f.accent]
  const reduce = useReducedMotion()
  return (
    <button type="button" onClick={onPick} aria-pressed={selected} aria-label={f.label} className="group flex flex-col items-center gap-2 rounded-[20px] pb-1">
      <motion.span key={burstKey} className="relative grid aspect-square w-full max-w-[96px] place-items-center rounded-full shadow-[0_8px_18px_rgba(23,33,74,.10)]"
        style={{ background: a.c500, color: a.onInk ? '#17214A' : '#FFFFFF' }}
        animate={burstKey && !reduce ? { scale: [0.94, 1.04, 1] } : undefined} transition={{ duration: 0.45, ease }} whileTap={{ scale: 0.94 }}>
        <FeelingIcon icon={f.icon} size={54} strokeWidth={1.75} />
        <AnimatePresence>{selected && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute right-0.5 top-0.5 grid size-6 place-items-center rounded-full bg-white text-navy shadow-[var(--shadow-card)]">
            <Check className="size-3.5" strokeWidth={3} aria-hidden />
          </motion.span>
        )}</AnimatePresence>
        <AnimatePresence>{burstKey && !reduce ? <PetalBurst key={burstKey} color={a.c500} /> : null}</AnimatePresence>
      </motion.span>
      <span className="text-[13px] font-semibold text-ink">{f.label}</span>
    </button>
  )
}

/** Small petal burst from the tapped circle (signature moment §8). */
function PetalBurst({ color, big }: { color: string; big?: boolean }) {
  const ps = useMemo(() => Array.from({ length: big ? 16 : 9 }, (_, i, arr = big ? 16 : 9) => ({ a: (i / arr) * Math.PI * 2 + 0.3, d: (big ? 110 : 58) + (i % 3) * (big ? 22 : 10), r: (i % 2 ? 1 : -1) * (90 + i * 20) })), [big])
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden>
      {ps.map((p, i) => (
        <motion.span key={i} className="absolute left-1/2 top-1/2 block h-3 w-2 rounded-[60%_10%_60%_10%]"
          style={{ background: i % 3 === 0 ? '#F2A93B' : color, marginLeft: -4, marginTop: -6 }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }} animate={{ x: Math.cos(p.a) * p.d, y: Math.sin(p.a) * p.d, opacity: 0, scale: 1, rotate: p.r }}
          transition={{ duration: 0.75, ease }} />
      ))}
    </span>
  )
}

/* ---------------- Meet Jitendra Khimlani ---------------- */
/**
 * owner 2026-11-21: Jitendra Khimlani's card is where clients book from Home: a clear "Book appointment"
 * (owner 2026-11-21: one kind of appointment; the team sets first visit or follow-up and the fee) and "More about him".
 */
function MeetCard({ open, onOpen }: { open: boolean; onOpen: () => void }) {
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-sky-100 p-4" aria-labelledby="meet-h">
      <span className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-white/45" aria-hidden />
      <div className="relative flex items-center gap-4">
        <button onClick={onOpen} aria-label="Open Jitendra Khimlani's story" aria-haspopup="dialog" className="relative h-[116px] w-[92px] shrink-0 transition-transform active:scale-[0.97]">
          {!open && <JituPortrait className="h-full w-full ring-[3px] ring-white" radius="999px 999px 18px 18px" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-navy">Certified Bach Flower Therapist</p>
          <h2 id="meet-h" className="mt-1 font-display text-[21px] font-semibold leading-[26px] text-ink">Jitendra Khimlani <Verified size={19} /></h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['12+ years', 'Online or in person'].map((t) => (
              <span key={t} className="rounded-full bg-white/80 px-2.5 py-1 text-[12px] font-semibold text-navy">{t}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="relative mt-4 space-y-2">
        <Link href="/app/book" onClick={() => buzz()}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-navy px-4 font-display text-[16px] font-semibold text-white shadow-[var(--shadow-cta)] transition-transform active:scale-[0.98]">
          <CalendarHeart className="size-[18px]" /> Book a session
        </Link>
        <button onClick={onOpen} aria-haspopup="dialog"
          className="flex h-12 w-full items-center justify-center gap-1 rounded-full bg-white text-[15px] font-semibold text-navy transition-transform active:scale-[0.98]">
          More about him <ChevronRight className="size-4" />
        </button>
      </div>
      <p className="relative mt-2.5 text-center text-[12px] text-ink-2">Remedy blend included · nothing to pay until your time is set</p>
      <Sparkle size={22} className="absolute left-[100px] top-3" />
    </section>
  )
}

/* ---------------- one actionable card (only when something needs the client) ---------------- */
function useNextAppointment() {
  const appts = useApp((s) => s.appointments)
  const now = useNow()
  return useMemo(() => {
    const upcoming = appts.filter((a) => a.status === 'confirmed' && isUpcoming(a, now)).sort((a, b) => Number(tbc(b)) - Number(tbc(a)) || +new Date(a.startsAt) - +new Date(b.startsAt))[0]
    const needsFeedback = appts.find((a) => !tbc(a) && (a.status === 'completed' || new Date(a.startsAt).getTime() + 60 * 60_000 < now) && !a.feedback && now - new Date(a.startsAt).getTime() < 14 * 86_400_000)
    return { upcoming, needsFeedback, now }
  }, [appts, now])
}

function ContextCard() {
  const intake = useApp((s) => s.intake)
  const appts = useApp((s) => s.appointments)
  const { upcoming, needsFeedback, now } = useNextAppointment()
  const toPay = appts.find((x) => (x.status === 'awaiting_payment' || x.status === 'expired') && !x.paidAt)
  let card: React.ReactNode = null
  if (toPay)
    card = <Ctx tone="navy" kicker={toPay.source === 'manager' ? 'From the BeWise team' : 'From Jitendra Khimlani'} title="Complete your booking" body={`${whenShort(toPay)}. Pay to confirm your session.`} cta={`Pay ${formatINR(toPay.amountPaise)}`} href={`/app/pay?appointment=${toPay.id}`} />
  else if (intake && !intake.submittedAt && intake.step > 0)
    card = <Ctx tone="sky" kicker="Almost there" title="Your answers are saved" body="Finish in about 3 minutes, then send your request." cta="Continue" href="/app/book?resume=1" />
  else if (upcoming && tbc(upcoming))
    card = <Ctx tone="teal" kicker="Request received" title="We’ll confirm your time" body="Jitendra Khimlani or our team will set a time and message you on WhatsApp." cta="View request" href={`/app/sessions/view?id=${upcoming.id}`} />
  else if (upcoming) {
    const mins = Math.round((new Date(upcoming.startsAt).getTime() - now) / 60_000)
    card = mins <= 60
      ? <Ctx tone="navy" kicker="Starting soon" title={mins > 0 ? `Your session begins in ${mins} min` : 'Your session is live'} body="Find a quiet spot. Jitendra Khimlani will join you." cta={mins <= 10 ? 'Join now' : 'Open'} href={`/app/sessions/view?id=${upcoming.id}`} icon={<Video className="size-5" />} />
      : <NextSession a={upcoming} />
  } else if (needsFeedback)
    card = <Ctx tone="rose" kicker="Two minutes" title="How was your session?" body="Your notes go straight to Jitendra Khimlani." cta="Share feedback" href={`/app/sessions/view?id=${needsFeedback.id}&feedback=1`} art={<div className="absolute bottom-4 right-4"><MoodImg mood="grateful" size={72} /></div>} />
  return card ? <Item>{card}</Item> : null
}

const TONES = { sky: 'bg-white', navy: 'bg-navy text-white', rose: 'bg-rose-100', teal: 'bg-teal-100' }
function Ctx({ tone, kicker, title, body, cta, href, icon, art }: { tone: keyof typeof TONES; kicker: string; title: string; body: string; cta: string; href: string; icon?: React.ReactNode; art?: React.ReactNode }) {
  const dark = tone === 'navy'
  return (
    <section className={cx('relative overflow-hidden rounded-[24px] p-5 shadow-[var(--shadow-card)]', TONES[tone])}>
      <div className={art ? 'pr-24' : ''}>
        <p className={cx('eyebrow', dark ? 'text-white/75' : 'text-navy')}>{kicker}</p>
        <h2 className={cx('mt-1 font-display text-[20px] font-semibold leading-[26px]', dark ? 'text-white' : 'text-ink')}>{title}</h2>
        <p className={cx('mt-1 text-[14px] leading-5', dark ? 'text-white/80' : 'text-ink-2')}>{body}</p>
        <BtnLink href={href} size="sm" variant={dark ? 'white' : 'primary'} className="mt-4">{icon}{cta}<ArrowRight className="size-4" /></BtnLink>
      </div>
      {art}
    </section>
  )
}

function NextSession({ a }: { a: Appointment }) {
  const c = { name: apptName(a) }
  return (
    <Link href={`/app/sessions/view?id=${a.id}`} className="card flex items-center gap-4 p-4">
      <SessionDateArt startsAt={a.startsAt} mode={a.mode} />
      <span className="min-w-0 flex-1">
        <span className="eyebrow text-navy">{tbc(a) ? 'Requested' : 'Next session'}</span>
        <span className="mt-0.5 block font-display text-[18px] font-semibold leading-6 text-ink">{whenShort(a)}</span>
        <span className="block text-[13px] text-ink-2">{c.name} · {a.mode === 'online' ? 'Online' : 'In person'}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted" />
    </Link>
  )
}

/* ---------------- today's blend ---------------- */
/**
 * owner 2026-11-20: Home shows only the essentials of the blend: a bottle that empties as doses are checked in,
 * today's 4 drops, and a way into the full details (remedies, emotions, calendar) in My care.
 */
function TodaysBlend({ onDose }: { onDose?: () => void }) {
  const s = useApp()
  const [cal, setCal] = useState(false)
  const blend = s.blend!
  const [pulse, setPulse] = useState(0)
  const of = perDay(s), today = dayKey(new Date()), n = dosesOn(s, today)
  const st = doseStats(s)
  const left = Math.max(0, st.of - st.day)
  // the bottle lasts its 25 days: it reflects the days gone by, and lowers a notch with each dose taken today
  const level = 1 - (st.day - 1 + n / of) / st.of
  const tap = (i: number) => {
    const next = i < n ? i : i + 1
    s.logDoses(today, next); buzz(next > n ? 14 : 8)
    if (next > n) { setPulse(Date.now()); if (next === of) toast(`All ${of} done today 🌸 Another day of self-care`); setTimeout(() => onDose?.(), 700) }
  }
  const caption = n >= of ? 'All done for today 🌿' : n === 0 ? 'Tap a drop each time you take your dose' : `${of - n} more to go today`
  return (
    // owner 2026-11-24: "too bland": a warm sunrise wash, the bottle on a glowing halo, the bottle's 25 days as a petal row,
    // and today's doses as buds on a vine that bloom when checked in
    <section className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(165deg,#FFFFFF_0%,#FFF6E8_48%,#FDEBF2_100%)] p-5 shadow-[var(--shadow-card)]" aria-labelledby="blend-h">
      {/* owner 2026-11-24: a real flower photo, small, in the corner */}
      <img src={`${BP}/img/deco/mimulus.webp`} alt="" aria-hidden className="pointer-events-none absolute -right-4 -top-5 w-[78px] rotate-[24deg] select-none drop-shadow-[0_6px_10px_rgba(120,90,20,.18)]" />
      <div className="relative flex items-center gap-4">
        <div className="relative flex w-[84px] shrink-0 justify-center">
          <span className="absolute left-1/2 top-1/2 size-[104px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#FFE6B8_0%,rgba(255,230,184,.45)_45%,transparent_70%)]" aria-hidden />
          <span className="absolute bottom-0 h-3 w-14 rounded-[50%] bg-[#b07a3a]/20 blur-[5px]" aria-hidden />
          <RemedyBottle level={level} pulse={pulse} height={132} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-sage-text">Your remedy</p>
          <h2 id="blend-h" className="h-section mt-0.5 tnum">Day {st.day} <span className="text-muted">of {st.of}</span></h2>
          <p className="mt-0.5 text-[13px] text-ink-2">{left ? `${left} day${left > 1 ? 's' : ''} left in this bottle` : 'Last day of this bottle'}</p>
          {/* the bottle's days as a row of petals */}
          <div className="mt-2 flex gap-[2px]" role="img" aria-label={`Day ${st.day} of ${st.of}`}>
            {Array.from({ length: st.of }, (_, i) => (
              <span key={i} className={cx('h-2 flex-1 rounded-full', i < st.day - 1 ? 'bg-[linear-gradient(180deg,#F7C873,#E9A23B)]' : i === st.day - 1 ? 'bg-[#F4A3B4]' : 'bg-[#ece7f3]')} />
            ))}
          </div>
          <span className={cx('mt-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold', st.streak ? 'bg-[#fde3ec] text-[#8a2f52]' : 'bg-white text-muted')}>
            🌸 {careDays(st.streak)}
          </span>
        </div>
      </div>

      <div className="relative mt-4 rounded-[24px] bg-white/75 px-3 pb-3 pt-3.5 ring-1 ring-white">
        <div className="flex items-baseline justify-between px-1">
          <p className="text-[14px] font-bold text-navy">Today’s doses</p>
          <p className="text-[12px] font-semibold text-muted">{blend.drops} drops, {of}× a day</p>
        </div>
        <div className="mt-3"><DoseBlooms n={n} of={of} times={blend.reminderTimes} onTap={tap} label={`Today: ${n} of ${of} doses`} /></div>
        <p className="mt-2.5 text-center text-[12px] font-semibold text-muted" aria-live="polite">{caption}</p>
      </div>

      {/* owner 2026-11-24: "View my progress" opens the 25-day summary right here */}
      <button onClick={() => { buzz(6); setCal(true) }} aria-haspopup="dialog" className="relative -mb-2 mt-2 flex h-12 w-full items-center justify-between px-1 pt-1 text-[15px] font-semibold text-navy">
        View my progress<ChevronRight className="size-5" />
      </button>
      <DoseCalendar open={cal} onClose={() => setCal(false)} />
    </section>
  )
}

/* ---------------- goals: daily check-in (owner 2026-11-18) ---------------- */
function GoalsCard() {
  const goals = useApp((s) => s.goals)
  if (!goals.length) return null
  const left = goals.filter((g) => kindOf(g) === 'daily' && !doneToday(g)).length
  return (
    <Item>
      <section className="card p-5" aria-labelledby="goals-h">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="goals-h" className="h-section">Today’s check-in</h2>
            <p className="text-[12px] text-muted">{left ? `${left} daily goal${left > 1 ? 's' : ''} to tick` : 'All daily goals done. Lovely 🌿'}</p>
          </div>
          <Link href="/app/goals" className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-navy">All<ChevronRight className="size-4" /></Link>
        </div>
        <ul className="mt-3 space-y-2.5">
          {goals.map((g) => {
            const once = kindOf(g) === 'once', s = streak(g)
            return (
              <li key={g.id} className="flex items-center gap-3">
                <GoalCheck g={g} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className={`block text-[15px] font-semibold ${once && g.done ? 'text-sage-text line-through decoration-sage/50' : 'text-navy'}`}>{g.title}</span>
                  <span className="text-[12px] text-muted">{once ? (g.done ? '🎯 Achieved' : '🎯 Long-term') : s ? `☀️ Daily · 🌸 ${s} day${s === 1 ? '' : 's'} in a row` : '☀️ Daily'}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </section>
    </Item>
  )
}

/* ---------------- shop row ---------------- */
const SHOP_PICKS = ['sleep-roll-on', 'aura-spray', 'rescue-remedy', 'abundance-bath-salt']
function ShopRow() {
  const picks = SHOP_PICKS.map((s) => PRODUCTS.find((p) => p.slug === s)).filter((p): p is (typeof PRODUCTS)[number] => !!p)
  return (
    <section aria-labelledby="shop-h">
      <div className="flex items-end justify-between">
        <h2 id="shop-h" className="h-section">Gentle rituals</h2>
        <Link href="/app/shop" className="-mr-2 inline-flex min-h-11 items-center gap-0.5 rounded-full px-2 text-[14px] font-semibold text-navy">Shop<ChevronRight className="size-4" /></Link>
      </div>
      <div className="no-scrollbar -mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-2">
        {picks.map((p, i) => <ProductCard key={p.slug} p={p} i={i} wide />)}
      </div>
    </section>
  )
}

/* ---------------- journal · goals · ask ---------------- */
function YourSpace() {
  const journal = useApp((s) => s.journal.length)
  const goals = useApp((s) => s.goals.length)
  const tiles = [
    { href: '/app/journal', t: 'Journal', d: journal ? `${journal} entries` : 'Your feelings', icon: <BookHeart className="size-[22px]" strokeWidth={1.75} />, tint: 'bg-lilac-100' },
    { href: '/app/goals', t: 'Goals', d: goals ? `${goals} active` : 'Small steps', icon: <Target className="size-[22px]" strokeWidth={1.75} />, tint: 'bg-teal-100' },
    { href: '/app/ask', t: 'Ask BeWise', d: 'Your companion', icon: <MessageCircleHeart className="size-[22px]" strokeWidth={1.75} />, tint: 'bg-marigold-100' },
  ]
  return (
    <section aria-label="Your space" className="grid grid-cols-3 gap-3">
      {tiles.map((t) => (
        <Link key={t.href} href={t.href} className="card flex flex-col items-start gap-3 p-4">
          <span className={cx('grid size-11 place-items-center rounded-full text-ink', t.tint)}>{t.icon}</span>
          <span><span className="block font-display text-[16px] font-semibold leading-5 text-ink">{t.t}</span><span className="block text-[12px] text-ink-2">{t.d}</span></span>
        </Link>
      ))}
    </section>
  )
}

