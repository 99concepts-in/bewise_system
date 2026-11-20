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
import { ArrowRight, BookHeart, Check, ChevronRight, MessageCircleHeart, Target, Video } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MoodImg } from '@/components/brand'
import { LaunchBanner } from '@/components/launch-offer'
import { AppHeader, useNavShown } from '@/components/shell'
import { SessionDateArt } from '@/components/session-art'
import { FeelingIcon, FlowerTile } from '@/components/flower'
import { JituPortrait, JituStory, Sparkle } from '@/components/jitu-story'
import { ProductCard } from '@/components/product-card'
import { BtnLink, Item, Reveal, buzz, cx, ease, toast, useChrome, useNow } from '@/components/ui'
import { CONSULTATIONS, CONSULTANT, PRODUCTS, moodOf, type Emotion } from '@/lib/data'
import { ACCENTS, HOME_FEELINGS, type HomeFeeling } from '@/lib/feelings'
import { useApp, type Appointment } from '@/lib/store'
import { dayKey, firstName, fmtDay, fmtTime, formatINR } from '@/lib/format'
import { blendSupply } from '@/lib/supply'

const greet = (h: number) => (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')

export default function Home() {
  const profile = useApp((s) => s.profile)
  const blend = useApp((s) => s.blend)
  const [story, setStory] = useState(false)
  const now = useNow(60_000)

  return (
    <main className="home-wash -mx-0 min-h-dvh px-5 pb-[calc(env(safe-area-inset-bottom)+176px)]">
      <AppHeader />
      <Reveal className="space-y-6">
        <Item className="pt-1">
          <p className="text-[16px] font-medium text-ink-2">{greet(new Date(now).getHours())}, {firstName(profile?.name)}</p>
          <h1 className="h-display mt-1">How are you feeling today?</h1>
        </Item>

        <Item><FeelingCircles /></Item>

        <ContextCard />

        <Item><MeetCard open={story} onOpen={() => { buzz(8); setStory(true) }} /></Item>

        {blend && <Item><TodaysBlend /></Item>}

        <Item><LaunchBanner /></Item>

        <Item><ShopRow /></Item>

        <Item><YourSpace /></Item>
      </Reveal>

      <BookPill />
      <JituStory open={story} onClose={() => setStory(false)} />
    </main>
  )
}

/* ---------------- feelings ---------------- */
function FeelingCircles() {
  const journal = useApp((s) => s.journal)
  const logMood = useApp((s) => s.logMood)
  const { openLog, openEntry } = useChrome()
  const [burst, setBurst] = useState<{ mood: Emotion; n: number } | null>(null)
  const todays = journal.filter((e) => dayKey(e.at) === dayKey(new Date()))
  const last = todays[0]
  const tip = burst ? HOME_FEELINGS.find((f) => f.mood === burst.mood)?.tip : undefined

  const tap = (f: HomeFeeling) => {
    logMood(f.mood); buzz(10)
    setBurst((b) => ({ mood: f.mood, n: (b?.n ?? 0) + 1 }))
    toast(`Logged · ${f.label}`)
  }

  return (
    <section aria-label="Log how you feel">
      <div className="grid grid-cols-3 gap-x-3 gap-y-4">
        {HOME_FEELINGS.map((f) => (
          <FeelingCircle key={f.mood} f={f} selected={last?.emotion === f.mood} burstKey={burst?.mood === f.mood ? burst.n : undefined} onPick={() => tap(f)} />
        ))}
      </div>
      <div className="mt-4 min-h-[52px]">
        <AnimatePresence mode="wait">
          {tip && last ? (
            <motion.div key={`tip-${burst?.n}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.3, ease }}
              className="flex items-start gap-3 rounded-[20px] bg-white p-3.5 shadow-[var(--shadow-card)]" role="status">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full" style={{ background: ACCENTS[HOME_FEELINGS.find((f) => f.mood === last.emotion)?.accent ?? 'navy'].c100 }} aria-hidden>
                <Sparkle size={16} className="[animation:none]" />
              </span>
              <p className="flex-1 text-[14px] leading-5 text-ink">
                {tip}{' '}
                <button onClick={() => openEntry(last.id)} className="font-semibold text-navy underline underline-offset-4">{last.note ? 'Edit note' : 'Add a note'}</button>
              </p>
            </motion.div>
          ) : (
            <motion.p key="meta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center justify-between gap-2 text-[14px] text-ink-2">
              <span>{last ? <>Today: <b className="font-semibold text-ink">{moodOf(last.emotion).label}</b> at {fmtTime(last.at)}</> : 'One tap. Takes 3 seconds.'}</span>
              <span className="flex items-center gap-1">
                <button onClick={openLog} className="min-h-11 rounded-full px-2 font-semibold text-navy underline-offset-4 hover:underline">More feelings</button>
                <Link href="/app/journal" className="inline-flex min-h-11 items-center gap-0.5 rounded-full px-2 font-semibold text-navy underline-offset-4 hover:underline">Journal<ChevronRight className="size-4" /></Link>
              </span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
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
function PetalBurst({ color }: { color: string }) {
  const ps = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ a: (i / 9) * Math.PI * 2 + 0.3, d: 58 + (i % 3) * 10, r: (i % 2 ? 1 : -1) * (90 + i * 20) })), [])
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
function MeetCard({ open, onOpen }: { open: boolean; onOpen: () => void }) {
  return (
    <button onClick={onOpen} aria-label="Meet Jitendra Khimlani, your consultant" aria-haspopup="dialog"
      className="relative flex w-full items-center gap-4 overflow-hidden rounded-[28px] bg-sky-100 p-3 pr-4 text-left transition-transform active:scale-[0.99]">
      <span className="relative h-[116px] w-[92px] shrink-0">
        {!open && <JituPortrait className="h-full w-full ring-[3px] ring-white" radius="999px 999px 18px 18px" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="eyebrow text-navy">Your consultant</span>
        <span className="mt-1 block font-display text-[22px] font-semibold leading-7 text-ink">Meet Jitendra Khimlani</span>
        <span className="mt-0.5 block text-[14px] leading-5 text-ink-2">{CONSULTANT.title} · 12+ years</span>
        <span className="mt-2 inline-flex items-center gap-1 text-[14px] font-semibold text-navy">Hear his story <ArrowRight className="size-4" /></span>
      </span>
      <Sparkle size={22} className="absolute left-[94px] top-3" />
    </button>
  )
}

/* ---------------- one actionable card (only when something needs the client) ---------------- */
function useNextAppointment() {
  const appts = useApp((s) => s.appointments)
  const now = useNow()
  return useMemo(() => {
    const upcoming = appts.filter((a) => a.status === 'confirmed' && !a.needsNewTime && new Date(a.startsAt).getTime() + 60 * 60_000 > now).sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))[0]
    const needsFeedback = appts.find((a) => (a.status === 'completed' || new Date(a.startsAt).getTime() + 60 * 60_000 < now) && !a.feedback && now - new Date(a.startsAt).getTime() < 14 * 86_400_000)
    return { upcoming, needsFeedback, now }
  }, [appts, now])
}

function ContextCard() {
  const intake = useApp((s) => s.intake)
  const appts = useApp((s) => s.appointments)
  const { upcoming, needsFeedback, now } = useNextAppointment()
  const toPay = appts.find((x) => x.needsNewTime || ((x.status === 'awaiting_payment' || x.status === 'expired') && !x.paidAt))
  let card: React.ReactNode = null
  if (toPay?.needsNewTime)
    card = <Ctx tone="teal" kicker={toPay.payLater ? 'Almost booked' : 'Payment received'} title={toPay.status === 'expired' ? 'Pick a new time' : 'Choose your preferred time'} body={toPay.status === 'expired' ? 'The held time was released before your payment arrived. Choose any time at no extra cost.' : 'Pick a time that suits you. Jitendra Khimlani or Haresh bhai will confirm it.'} cta="Choose a time" href={`/app/pay?appointment=${toPay.id}`} />
  else if (toPay)
    card = <Ctx tone="navy" kicker={toPay.source === 'manager' ? 'From the BeWise team' : 'From Jitendra Khimlani'} title="Complete your booking" body={`${fmtDay(toPay.startsAt)} · ${fmtTime(toPay.startsAt)}, pay to confirm your session.`} cta={`Pay ${formatINR(toPay.amountPaise)}`} href={`/app/pay?appointment=${toPay.id}`} />
  else if (intake && !intake.submittedAt && intake.step > 0)
    card = <Ctx tone="sky" kicker="Almost there" title="Your answers are saved" body="Finish in about 3 minutes, then pick a time." cta="Continue" href="/app/book?resume=1" />
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
  const c = CONSULTATIONS.find((x) => x.id === a.type)!
  return (
    <Link href={`/app/sessions/view?id=${a.id}`} className="card flex items-center gap-4 p-4">
      <SessionDateArt startsAt={a.startsAt} mode={a.mode} />
      <span className="min-w-0 flex-1">
        <span className="eyebrow text-navy">{a.timeRequested ? 'Awaiting confirmation' : 'Next session'}</span>
        <span className="mt-0.5 block font-display text-[18px] font-semibold leading-6 text-ink">{fmtDay(a.startsAt)} · {fmtTime(a.startsAt)}</span>
        <span className="block text-[13px] text-ink-2">{c.name} · {a.mode === 'online' ? 'Online' : 'In person'}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted" />
    </Link>
  )
}

/* ---------------- today's blend ---------------- */
function TodaysBlend() {
  const blend = useApp((s) => s.blend)!
  const appts = useApp((s) => s.appointments)
  const drops = useApp((s) => s.drops)
  const logDrops = useApp((s) => s.logDrops)
  const now = useNow(60_000)
  const day = Math.min(blend.days, Math.max(1, Math.floor((now - +new Date(blend.startedOn)) / 86_400_000) + 1))
  const sup = blendSupply(blend, appts, now)
  const k = dayKey(new Date(now))
  const took = drops[k]
  return (
    <section className="card p-5" aria-labelledby="blend-h">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="blend-h" className="h-section">Today’s blend</h2>
          <p className="mt-0.5 text-[14px] text-ink-2"><span className="tnum">Day {day} of {blend.days}</span> · {blend.drops} drops, {blend.timesPerDay}× a day</p>
        </div>
        <Link href="/app/remedies" className="-mr-2 inline-flex min-h-11 items-center gap-0.5 rounded-full px-2 text-[14px] font-semibold text-navy">Care<ChevronRight className="size-4" /></Link>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sky-100" role="progressbar" aria-label="Blend progress" aria-valuemin={1} aria-valuemax={blend.days} aria-valuenow={day}>
        <motion.div className="h-full rounded-full bg-blue" initial={{ width: 0 }} animate={{ width: `${(day / blend.days) * 100}%` }} transition={{ duration: 0.9, ease }} />
      </div>
      <div className="no-scrollbar -mx-5 mt-4 flex gap-3 overflow-x-auto px-5 pb-1">
        {blend.flowers.map((f) => <FlowerTile key={f} name={f} size={84} className="shrink-0" />)}
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-[18px] bg-sky-50 p-2 pl-4">
        <p className="flex-1 text-[14px] text-ink">{took ? <><b className="font-semibold">Drops taken today.</b> Lovely.</> : sup.low ? 'Running low. Your follow-up refreshes it.' : 'Took your drops today?'}</p>
        {took ? (
          <button onClick={() => logDrops(k, false)} aria-label="Undo drops taken" className="grid size-11 place-items-center rounded-full bg-teal text-white"><Check className="size-5" strokeWidth={3} /></button>
        ) : (
          <button onClick={() => { logDrops(k, true); buzz(14); toast('Lovely, drops ticked for today') }} className="inline-flex h-11 items-center gap-1.5 rounded-[14px] bg-navy px-4 font-display text-[15px] font-semibold text-white">
            <Check className="size-4" strokeWidth={3} /> Yes
          </button>
        )}
      </div>
    </section>
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

/* ---------------- floating Book pill ---------------- */
function BookPill() {
  const shown = useNavShown()
  const appts = useApp((s) => s.appointments)
  const hasBlend = useApp((s) => !!s.blend)
  const now = useNow()
  const busy = appts.some((a) => (a.status === 'confirmed' && +new Date(a.startsAt) + 3600_000 > now) || a.needsNewTime || a.status === 'awaiting_payment')
  if (busy) return null
  const follow = hasBlend || appts.length > 0
  const c = CONSULTATIONS.find((x) => x.id === (follow ? 'followup' : 'first'))!
  return (
    <AnimatePresence>
      {shown && (
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ duration: 0.28, ease, delay: 0.3 }}
          className="pointer-events-none fixed inset-x-0 z-30 mx-auto max-w-[480px] px-5" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 76px)' }}>
          <Link href={`/app/book${follow ? '?type=followup' : ''}`} onClick={() => buzz()}
            className="pointer-events-auto flex h-[60px] items-center justify-center gap-2 rounded-full bg-navy px-6 font-display text-[17px] font-semibold text-white shadow-[var(--shadow-float)] transition-colors hover:bg-navy-2">
            {follow ? 'Book a follow-up' : 'Book your consultation'} <span className="text-white/60" aria-hidden>·</span> <span className="font-sans text-[16px] font-semibold tnum">{formatINR(c.feePaise)}</span> <ArrowRight className="size-5" />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
