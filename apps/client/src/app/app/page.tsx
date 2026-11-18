'use client'
/**
 * @module   client-home
 * @owner    CLIENT
 * @screens  CL-08 Home (spec docs/specs/client/CL-08-home.md) · CL-56 progress (compact)
 */
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, BookOpen, Check, ChevronRight, Lightbulb, Sparkles, Video } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Mascot, MoodButton, MoodImg } from '@/components/brand'
import { AppHeader } from '@/components/shell'
import { ConsultInviteArt, SessionDateArt } from '@/components/session-art'
import { BlendBottleCard } from '@/components/blend-bottle'
import { Btn, BtnLink, Item, Reveal, Ring, buzz, spring, toast, useChrome, useNow } from '@/components/ui'
import { CONSULTATIONS, QUICK_MOODS, moodOf, type Emotion } from '@/lib/data'
import { useApp, type Appointment } from '@/lib/store'
import { dayKey, firstName, fmtDay, fmtTime, formatINR } from '@/lib/format'
import { dailyInsight, progressLines } from '@/lib/insights'
import { BP } from '@/lib/asset'

export default function Home() {
  const profile = useApp((s) => s.profile)
  const journal = useApp((s) => s.journal)
  const logMood = useApp((s) => s.logMood)
  const blend = useApp((s) => s.blend)
  const { openLog, openEntry } = useChrome()
  const [burst, setBurst] = useState<{ mood: Emotion; n: number } | null>(null)
  const todays = journal.filter((e) => dayKey(e.at) === dayKey(new Date()))
  const lastToday = todays[0]

  const tapMood = (m: Emotion) => {
    logMood(m); buzz(10)
    setBurst((b) => ({ mood: m, n: (b?.n ?? 0) + 1 }))
  }

  return (
    <main className="px-5 pb-32">
      <AppHeader />
      <Reveal className="space-y-4">
        <Item className="pt-3">
          <h1 className="text-[34px] font-extrabold leading-[1.05] tracking-[-0.03em] text-navy">Hi {firstName(profile?.name)}</h1>
          <p className="mt-1 text-[24px] font-bold leading-tight tracking-[-0.02em] text-soft">how are you feeling today?</p>
        </Item>

        <Item>
          <section className="card px-3 pb-3 pt-5" aria-labelledby="mood-h">
            <div className="px-2">
              <h2 id="mood-h" className="h-section">Today’s mood</h2>
              <p className="mt-0.5 text-[13px] text-muted">Tap once to reflect. Takes 3 seconds.</p>
            </div>
            <div className="mt-3 flex justify-between">
              {QUICK_MOODS.map((m) => (
                <MoodButton key={m} mood={m} size={54} burstKey={burst?.mood === m ? burst.n : undefined} selected={lastToday?.emotion === m} onPick={() => tapMood(m)} />
              ))}
            </div>
            <div className="mt-2 flex min-h-9 items-center justify-between px-2">
              <AnimatePresence mode="wait">
                {lastToday ? (
                  <motion.p key={lastToday.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[13px] text-muted">
                    Logged <b className="text-navy">{moodOf(lastToday.emotion).label}</b> at {fmtTime(lastToday.at)} ·{' '}
                    <button onClick={() => openEntry(lastToday.id)} className="font-semibold text-navy underline underline-offset-2">{lastToday.note ? 'Edit note' : 'Add a note'}</button>
                  </motion.p>
                ) : <motion.p key="none" className="text-[13px] text-muted">Nothing logged yet today</motion.p>}
              </AnimatePresence>
              <div className="flex gap-3 text-[13px] font-semibold text-navy">
                <button onClick={openLog}>More</button>
                <Link href="/app/journal" className="inline-flex items-center gap-0.5">Journal<ChevronRight className="size-4" /></Link>
              </div>
            </div>
          </section>
        </Item>

        <Item><ContextCard /></Item>

        {blend && <Item><BlendBottleCard /></Item>}

        <GoalsCard />

        <Item>
          <Link href="/app/ask" className="card group relative block overflow-hidden p-5 pr-[42%]">
            <span className="absolute -right-6 -top-6 size-44 rounded-full bg-[radial-gradient(circle,#dce2f5_0%,transparent_70%)]" />
            <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-navy">Ask <span className="text-soft">BeWise</span></h2>
            <p className="mt-1.5 text-[14px] leading-5 text-muted">Your wise companion — answers about your remedy, journal and orders.</p>
            <span className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-navy px-5 text-[14px] font-semibold text-white shadow-[var(--shadow-cta)]"><Sparkles className="size-4" /> Start a chat</span>
            <div className="absolute bottom-2 right-3"><Mascot pose="wave" height={150} /></div>
          </Link>
        </Item>

        {blend && <Item><ProgressCompact /></Item>}

        <Item>
          <div className="card flex items-start gap-3 p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#fbf3dc] text-gold"><Lightbulb className="size-5" /></span>
            <p className="text-[14px] leading-6 text-ink"><b className="text-navy">Your daily insight</b> — {dailyInsight(journal)}</p>
          </div>
        </Item>
      </Reveal>
    </main>
  )
}

function useNextAppointment() {
  const appts = useApp((s) => s.appointments)
  const now = useNow()
  return useMemo(() => {
    const upcoming = appts.filter((a) => a.status === 'confirmed' && new Date(a.startsAt).getTime() + 60 * 60_000 > now).sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))[0]
    const needsFeedback = appts.find((a) => (a.status === 'completed' || new Date(a.startsAt).getTime() + 60 * 60_000 < now) && !a.feedback && now - new Date(a.startsAt).getTime() < 14 * 86_400_000)
    return { upcoming, needsFeedback, any: appts.length > 0, now }
  }, [appts, now])
}

/** CL-08 ONE contextual card — priority order from the spec. */
function ContextCard() {
  const intake = useApp((s) => s.intake)
  const blend = useApp((s) => s.blend)
  const { upcoming, needsFeedback, any, now } = useNextAppointment()
  const router = useRouter()

  const appts = useApp.getState().appointments
  const toPay = appts.find((x) => x.needsNewTime || ((x.status === 'awaiting_payment' || x.status === 'expired') && !x.paidAt))
  if (toPay?.needsNewTime)
    return <Ctx tone="sage" kicker="Payment received" title="Pick a new time" body="The held time was released before your payment arrived — choose any time, no extra cost." cta="Choose a time" href={`/app/pay?appointment=${toPay.id}`} />
  if (toPay)
    return <Ctx tone="navy" kicker={toPay.source === 'manager' ? 'From the BeWise team' : 'From Jitu Bhaiya'} title="Complete your booking" body={`${fmtDay(toPay.startsAt)} · ${fmtTime(toPay.startsAt)} — pay to confirm your session.`} cta={`Pay ${formatINR(toPay.amountPaise)}`} href={`/app/pay?appointment=${toPay.id}`} />

  if (intake && !intake.submittedAt && intake.step > 0)
    return <Ctx tone="peri" kicker="Almost there" title="Your answers are saved" body="Finish in about 3 minutes, then pick a time." cta="Continue" href="/app/book?resume=1" img={`${BP}/img/owl-read.webp`} />

  if (upcoming) {
    const mins = Math.round((new Date(upcoming.startsAt).getTime() - now) / 60_000)
    if (mins <= 60) return <Ctx tone="navy" kicker="Starting soon" title={mins > 0 ? `Your session begins in ${mins} min` : 'Your session is live'} body="Find a quiet spot. Jitu Bhaiya will join you." cta={mins <= 10 ? 'Join now' : 'Open'} href={`/app/sessions/view?id=${upcoming.id}`} icon={<Video className="size-5" />} />
    return <NextSession a={upcoming} onOpen={() => router.push(`/app/sessions/view?id=${upcoming.id}`)} />
  }
  if (needsFeedback)
    return <Ctx tone="rose" kicker="Two minutes" title="How was your session?" body="Your notes go straight to Jitu Bhaiya." cta="Share feedback" href={`/app/sessions/view?id=${needsFeedback.id}&feedback=1`} art={<div className="absolute bottom-4 right-4"><MoodImg mood="grateful" size={84} /></div>} />
  if (blend && any) return null // the "Your blend" card carries the follow-up pre-book (owner 2026-11-18)
  return <Ctx tone="peri" kicker="Begin gently" title="Your first consultation" body={`A calm, unhurried conversation with Jitu Bhaiya · ₹1,000, your remedy blend included.`} cta="Book" href="/app/book" art={<ConsultInviteArt />} wide />
}

const TONES = { peri: 'bg-[linear-gradient(135deg,#ffffff_40%,#e9edfa)]', navy: 'bg-[linear-gradient(135deg,#182957,#3c5596)] text-white', rose: 'bg-[linear-gradient(135deg,#fff_40%,#fbe9ee)]', sage: 'bg-[linear-gradient(135deg,#fff_40%,#e5efe2)]' }
function Ctx({ tone, kicker, title, body, cta, href, img, icon, wide, art }: { tone: keyof typeof TONES; kicker: string; title: string; body: string; cta: string; href: string; img?: string; icon?: React.ReactNode; wide?: boolean; art?: React.ReactNode }) {
  const dark = tone === 'navy'
  return (
    <section className={`relative overflow-hidden rounded-[28px] p-5 shadow-[var(--shadow-card)] ${TONES[tone]}`}>
      <div className={wide ? 'pr-[38%]' : 'pr-24'}>
        <p className={`text-[12px] font-bold uppercase tracking-[0.12em] ${dark ? 'text-white/70' : 'text-peri'}`}>{kicker}</p>
        <h2 className={`mt-1 text-[20px] font-extrabold leading-tight tracking-[-0.02em] ${dark ? 'text-white' : 'text-navy'}`}>{title}</h2>
        <p className={`mt-1 text-[14px] leading-5 ${dark ? 'text-white/80' : 'text-muted'}`}>{body}</p>
        <BtnLink href={href} size="sm" variant={dark ? 'white' : 'primary'} className="mt-4">{icon}{cta}<ArrowRight className="size-4" /></BtnLink>
      </div>
      {art}
      {img && <motion.img src={img} alt="" aria-hidden className={`absolute bottom-0 object-contain ${wide ? 'multiply -right-2 h-[118px]' : 'right-3 h-[108px]'}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, ...spring }} />}
    </section>
  )
}

function NextSession({ a, onOpen }: { a: Appointment; onOpen: () => void }) {
  const c = CONSULTATIONS.find((x) => x.id === a.type)!
  return (
    <section className="card relative overflow-hidden p-5">
      <h2 className="h-section">Next session</h2>
      <div className="mt-3 flex items-center gap-4">
        <SessionDateArt startsAt={a.startsAt} mode={a.mode} />
        <div className="flex-1">
          <p className="text-[15px] font-semibold text-navy">{fmtDay(a.startsAt)} · {fmtTime(a.startsAt)}</p>
          <p className="text-[13px] text-muted">{c.name} · {a.mode === 'online' ? 'Online' : 'In person'} with Jitu Bhaiya</p>
          <Btn size="sm" className="mt-3 px-6" onClick={onOpen}>View</Btn>
        </div>
      </div>
    </section>
  )
}

function ProgressCompact() {
  const journal = useApp((s) => s.journal)
  const blend = useApp((s) => s.blend)
  const lines = progressLines(journal, blend?.startedOn)
  if (!lines.length) return null
  return (
    <Link href="/app/remedies#progress" className="card block p-5">
      <div className="flex items-center justify-between">
        <h2 className="h-section">Since your blend <span className="text-soft">began</span></h2>
        <ChevronRight className="size-5 text-soft" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <MoodImg mood={lines[0].mood} size={44} />
        <p className="text-[14px] leading-5 text-ink">{lines[0].text}</p>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted"><BookOpen className="size-3.5" /> From your journal · not medical advice</p>
    </Link>
  )
}

/** Goals the client set (CL-31) — shown on Home once there is at least one (owner 2026-11-18). */
function GoalsCard() {
  const goals = useApp((s) => s.goals)
  const upd = useApp((s) => s.updateGoal)
  if (!goals.length) return null
  return (
    <Item>
      <section className="card p-5" aria-labelledby="goals-h">
        <div className="flex items-center justify-between">
          <h2 id="goals-h" className="h-section">Your goals</h2>
          <Link href="/app/goals" className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-navy">All<ChevronRight className="size-4" /></Link>
        </div>
        <ul className="mt-3 space-y-2.5">
          {goals.map((g) => (
            <li key={g.id} className="flex items-center gap-3">
              <Ring value={g.progress / 100} size={44} stroke={5} color={g.done ? '#82977e' : '#182957'}>
                {g.done ? <Check className="size-4 text-sage" strokeWidth={3} /> : <span className="text-[11px] font-bold text-navy tnum">{g.progress}</span>}
              </Ring>
              <span className={`flex-1 text-[15px] font-semibold ${g.done ? 'text-sage-text line-through decoration-sage/50' : 'text-navy'}`}>{g.title}</span>
              {!g.done && (
                <motion.button whileTap={{ scale: 0.88 }} aria-label={`Add progress to ${g.title}`}
                  onClick={() => { const n = Math.min(100, g.progress + 10); buzz(8); upd(g.id, { progress: n, done: n === 100 }); if (n === 100) toast('Goal complete — well done') }}
                  className="h-9 rounded-full bg-peri-50 px-3 text-[13px] font-bold text-navy">+10%</motion.button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </Item>
  )
}
