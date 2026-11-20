'use client'
/**
 * @module   remedies-ux
 * @owner    CLIENT (views) · CONSULTANT owns remedies data (getCurrentRemedyForClient — names, ritual; never reasons)
 * @screens  CL-26 My Remedies · CL-27 Flower detail · CL-28 Ritual & reminders · CL-29 Past blends · CL-56 Progress
 * v5 (HUB 2026-11-20): this is the "Care" tab (route unchanged). Order per DESIGN-SYSTEM §7: next appointment → your blend
 *   (flower tiles, day x of 25, drops tick) → FAQ accordion → existing content (progress, reorder, past blends).
 *   Flower art now uses the real Bach vectors (FlowerArt), with a soft fallback while a file is missing.
 */
import { motion } from 'motion/react'
import { Bell, CalendarHeart, ChevronRight, Lightbulb, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { Mascot, MoodImg } from '@/components/brand'
import { AppHeader } from '@/components/shell'
import { FaqCard } from '@/components/faq'
import { FlowerArt, FlowerTile } from '@/components/flower'
import { SessionDateArt } from '@/components/session-art'
import { Btn, BtnLink, Item, Reveal, Sheet, buzz, ease, toast, useChrome } from '@/components/ui'
import { BACH_REMEDIES, CONSULTATIONS, moodOf, REORDER_PRICE_PAISE, type ConsultationId } from '@/lib/data'
import type { Appointment } from '@/lib/store'
import { useApp } from '@/lib/store'
import { isUpcoming, tbc, whenShort } from '@/lib/appt'
import { dayKey, fmtDay, fmtTime, formatINR } from '@/lib/format'
import { dailyInsight, moodMix, progressLines } from '@/lib/insights'
import { DoseTracker } from '@/components/dose-tracker'
import { blendSupply } from '@/lib/supply'
import { BP } from '@/lib/asset'

// @decision(D-10) generic Bach descriptions — Jitendra Khimlani approves final wording before launch. Never the reason it was chosen.
const ABOUT: Record<string, string> = {
  Mimulus: 'Dr Bach described Mimulus for everyday fears of known things, a gentle companion for quiet courage.',
  'White Chestnut': 'Associated with a busy mind and repeating thoughts, for a calmer, clearer head.',
  Larch: 'Linked with self-belief, for having a go without expecting to fail.',
  Impatiens: 'Associated with impatience and irritation, for an easier, unhurried pace.',
  Walnut: 'Known as the remedy for times of change, for steadiness while life shifts.',
}

export default function Remedies() {
  const blend = useApp((s) => s.blend)
  const appointments = useApp((s) => s.appointments)
  const journal = useApp((s) => s.journal)
  const addToCart = useApp((s) => s.addToCart)
  const { flyToBag } = useChrome()
  const [flower, setFlower] = useState<string | null>(null)
  const [times, setTimes] = useState(false)
  const reorderRef = useRef<HTMLButtonElement>(null)

  if (!blend) return (
    <main className="px-5 pb-32">
      <AppHeader />
      <Reveal className="space-y-6">
        <Item><h1 className="h-duo pt-1">My <em>care</em></h1></Item>
        <Item><Upcoming /></Item>
        <Item>
          <div className="card flex flex-col items-center p-7 text-center">
            <Mascot pose="sleep" height={132} />
            <p className="mt-4 font-display text-[20px] font-semibold text-ink">Your blend will bloom here</p>
            <p className="mt-1 max-w-[290px] text-[14px] leading-5 text-ink-2">After your first session, Jitendra Khimlani prepares a personal blend of flower remedies, included in your consultation.</p>
          </div>
        </Item>
        <Item><PastSessions /></Item>
        <Item><FaqCard /></Item>
      </Reveal>
    </main>
  )

  const since = new Date(blend.startedOn)
  const dayN = Math.floor((Date.now() - +since) / 86_400_000) + 1
  const sup = blendSupply(blend, appointments)
  const left = sup.daysLeft
  const lines = progressLines(journal, blend.startedOn)
  const mix = moodMix(journal)
  const reorder = () => {
    addToCart('remedy-reorder'); buzz(12)
    const r = reorderRef.current?.getBoundingClientRect(); if (r) flyToBag(r, `${BP}/img/products/bach-remedy-dropper.webp`)
    toast(`Blend added to cart · ${formatINR(REORDER_PRICE_PAISE)}`)
  }

  return (
    <main className="px-5 pb-32">
      <AppHeader />
      <Reveal className="space-y-4">
        <Item><h1 className="h-duo pt-1">My <em>care</em></h1></Item>
        <Item><Upcoming /></Item>
        <Item>
          <section className="card p-5" aria-labelledby="blend-h">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow text-navy">Since {fmtDay(blend.startedOn)}</p>
                <h2 id="blend-h" className="h-section mt-1">{blend.name} <span className="text-soft">v{blend.version}</span></h2>
                <p className="mt-0.5 text-[14px] text-ink-2">{blend.drops} drops, {blend.timesPerDay}× a day</p>
              </div>
              <img src={`${BP}/img/products/bach-remedy-dropper.webp`} alt="" aria-hidden className="-my-2 h-[84px] w-auto drop-shadow-[0_10px_12px_rgba(23,33,74,.18)]" />
            </div>
            <div className="mt-4 flex items-center justify-between text-[14px]">
              <span className="font-semibold text-ink tnum">Day {Math.min(dayN, blend.days)} of {blend.days}</span>
              <span className="text-ink-2 tnum">{left} {left === 1 ? 'day' : 'days'} left</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sky-100" role="progressbar" aria-label="Blend progress" aria-valuemin={1} aria-valuemax={blend.days} aria-valuenow={Math.min(dayN, blend.days)}>
              <motion.div className="h-full rounded-full bg-blue" initial={{ width: 0 }} animate={{ width: `${(Math.min(dayN, blend.days) / blend.days) * 100}%` }} transition={{ duration: 0.9, ease }} />
            </div>
            <p className="mt-2 text-[12px] text-muted">{sup.next ? 'Lasts until your next session.' : 'A follow-up refreshes your blend.'}</p>

            {/* owner 2026-11-20: every remedy in the blend and the emotion it addresses */}
            <h3 className="mt-5 font-sans text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-2">Remedies in your blend</h3>
            <ul className="mt-3 space-y-2">
              {blend.flowers.map((f, i) => {
                const info = BACH_REMEDIES[f]
                return (
                  <motion.li key={f} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05, ease, duration: 0.4 }}>
                    <button onClick={() => setFlower(f)} className="flex w-full items-center gap-3 rounded-[20px] bg-sky-50 p-3 text-left">
                      <FlowerArt name={f} decorative className="size-12 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-[16px] font-semibold text-ink">{f}</span>
                        <span className="block text-[13px] leading-[18px] text-ink-2">For: {info?.emotion ?? 'emotional balance'}</span>
                      </span>
                      {info && <MoodImg mood={info.mood as never} size={32} />}
                      <ChevronRight className="size-4 shrink-0 text-muted" />
                    </button>
                  </motion.li>
                )
              })}
            </ul>

            <div className="mt-5 border-t border-line pt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 id="drops-h" className="font-display text-[18px] font-semibold text-ink">Your daily drops</h3>
                <button onClick={() => setTimes(true)} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-sky-50 px-3.5 text-[13px] font-semibold text-navy ring-1 ring-sky-200"><Bell className="size-4" /> {blend.reminderTimes.length} times</button>
              </div>
              <DoseTracker full />
            </div>
          </section>
        </Item>

        <Item><FaqCard /></Item>

        {lines.length > 0 && (
          <Item>
            <section id="progress" className="card p-5">
              <h2 className="h-section">Since your blend <span className="text-soft">began</span></h2>
              <p className="text-[13px] text-muted">{fmtDay(blend.startedOn)} → today</p>
              <div className="mt-3 divide-y divide-line">
                {lines.map((l, i) => (
                  <motion.div key={i} className="flex items-center gap-3 py-3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.1, ease, duration: 0.5 }}>
                    <MoodImg mood={l.mood} size={46} /><p className="text-[14px] leading-5 text-ink">{l.text}</p>
                  </motion.div>
                ))}
              </div>
              {mix.length > 0 && (
                <div className="mt-2 flex items-center gap-5 rounded-[20px] bg-sky-50 p-4">
                  <Donut mix={mix} />
                  <ul className="flex-1 space-y-1.5">
                    {mix.slice(0, 4).map((m) => <li key={m.mood} className="flex items-center gap-2 text-[13px]"><span className="size-3 rounded-full" style={{ background: moodOf(m.mood).color }} /><span className="flex-1 text-ink">{moodOf(m.mood).label}</span><b className="tnum text-navy">{m.pct}%</b></li>)}
                  </ul>
                </div>
              )}
              <p className="mt-3 flex items-start gap-2 text-[13px] leading-5 text-muted"><Lightbulb className="mt-0.5 size-4 shrink-0 text-gold" />{dailyInsight(journal)}</p>
              <p className="mt-2 text-[11px] text-muted">From your journal and check-ins · not medical advice</p>
            </section>
          </Item>
        )}

        <Item>
          <section className="card flex items-center gap-4 p-5">
            <div className="flex-1"><h2 className="h-section">Running low?</h2><p className="text-[13px] text-muted">Reorder the same blend · {formatINR(REORDER_PRICE_PAISE)}</p></div>
            <Btn ref={reorderRef} size="md" onClick={reorder}><ShoppingBag className="size-4" /> Reorder</Btn>
          </section>
        </Item>

        <Item><PastSessions /></Item>
        <Item>
          <section className="card p-5">
            <h2 className="h-section">Past blends</h2>
            <div className="mt-3 flex items-center gap-3 rounded-[20px] bg-sky-50 p-3">
              <span className="grid size-11 place-items-center rounded-full bg-white text-[13px] font-extrabold text-navy">v{blend.version}</span>
              <div className="flex-1"><p className="text-[14px] font-bold text-navy">Current · since {fmtDay(blend.startedOn)}</p><p className="truncate text-[12px] text-muted">{blend.flowers.join(', ')}</p></div>
            </div>
            <p className="mt-3 text-[12px] text-muted">Earlier blends appear here after each follow-up.</p>
          </section>
        </Item>
      </Reveal>

      <Sheet open={!!flower} onClose={() => setFlower(null)} title={flower ?? 'Flower'}>
        {flower && (
          <div className="pb-2">
            <motion.div className="mx-auto grid size-[200px] place-items-center rounded-full bg-sky-50" initial={{ scale: 0.7, rotate: -8, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }}>
              <FlowerArt name={flower} className="h-[170px] w-[170px] text-[48px]" />
            </motion.div>
            <h2 className="h-duo mt-2 text-[28px]">{flower}</h2>
            {BACH_REMEDIES[flower] && <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-peri-50 py-1 pl-1 pr-3 text-[13px] font-semibold text-navy"><MoodImg mood={BACH_REMEDIES[flower].mood as never} size={26} /> For: {BACH_REMEDIES[flower].emotion}</p>}
            <p className="mt-3 text-[15px] leading-6 text-ink">{ABOUT[flower] ?? (BACH_REMEDIES[flower] ? `Associated with ${BACH_REMEDIES[flower].emotion.charAt(0).toLowerCase()}${BACH_REMEDIES[flower].emotion.slice(1)}.` : 'One of Dr Bach’s flower remedies.')}</p>
            <p className="mt-4 rounded-[18px] bg-marigold-100 p-3 text-[13px] font-semibold text-ink">In your blend since {fmtDay(blend.startedOn)}</p>
          </div>
        )}
      </Sheet>
      <ReminderSheet open={times} onClose={() => setTimes(false)} />
    </main>
  )
}

function Donut({ mix }: { mix: { mood: Parameters<typeof moodOf>[0]; pct: number }[] }) {
  const r = 34, c = 2 * Math.PI * r
  let acc = 0
  return (
    <svg width="92" height="92" viewBox="0 0 92 92" className="-rotate-90" role="img" aria-label="Mood mix, last 14 days">
      {mix.map((m, i) => {
        const len = (m.pct / 100) * c
        const el = <motion.circle key={m.mood} cx="46" cy="46" r={r} fill="none" stroke={moodOf(m.mood).color} strokeWidth="14" strokeDasharray={`${len} ${c}`} strokeDashoffset={-acc}
          initial={{ opacity: 0, pathLength: 0 }} animate={{ opacity: 1, pathLength: 1 }} transition={{ delay: 0.2 + i * 0.1, duration: 0.6 }} />
        acc += len
        return el
      })}
    </svg>
  )
}

function ReminderSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const blend = useApp((s) => s.blend)
  const set = useApp((s) => s.setReminderTimes)
  const [t, setT] = useState<string[]>(blend?.reminderTimes ?? [])
  if (!blend) return null
  return (
    <Sheet open={open} onClose={onClose} title="Reminder times">
      <h2 className="h-duo text-[26px]">Gentle <em>reminders</em></h2>
      <p className="mt-1 text-[14px] text-muted">We’ll nudge you at these times.</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {t.map((v, i) => (
          <label key={i} className="flex h-14 items-center gap-2 rounded-[18px] bg-peri-50 px-4">
            <span className="text-[13px] font-semibold text-muted">Dose {i + 1}</span>
            <input type="time" value={v} onChange={(e) => setT(t.map((x, k) => (k === i ? e.target.value : x)))} className="flex-1 bg-transparent text-right text-[16px] font-bold text-navy outline-none" aria-label={`Dose ${i + 1} time`} />
          </label>
        ))}
      </div>
      <Btn full className="mt-5" onClick={() => { set([...t].sort()); toast('Reminders updated'); onClose() }}>Save times</Btn>
      <p className="mt-3 flex items-center justify-center gap-1 text-[12px] text-muted">Notifications arrive once the app is installed <ChevronRight className="size-3" /></p>
    </Sheet>
  )
}


/** owner 2026-11-18: sessions live here too, with booking one tap away (the separate Book tab is gone). */
function Upcoming() {
  const appts = useApp((s) => s.appointments)
  const now = Date.now()
  const up = appts.filter((a) => isUpcoming(a, now)).sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
  const hasHistory = appts.length > 0
  return (
    <section className="card p-5" aria-labelledby="up-h">
      <div className="flex items-center justify-between">
        <h2 id="up-h" className="h-section">{up.length ? 'Upcoming sessions' : 'Your sessions'}</h2>
        {appts.length > 0 && <Link href="/app/sessions" className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-navy">All<ChevronRight className="size-4" /></Link>}
      </div>
      {up.length ? (
        <ul className="mt-3 space-y-2.5">
          {up.map((a) => (
            <li key={a.id}>
              <Link href={a.status === 'awaiting_payment' ? `/app/pay?appointment=${a.id}` : `/app/sessions/view?id=${a.id}`} className="flex items-center gap-3 rounded-[20px] bg-peri-50/70 p-3.5">
                <span className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-navy text-white"><CalendarHeart className="size-6" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold text-peri">{a.status === 'awaiting_payment' ? 'Awaiting payment' : tbc(a) ? 'Requested · we’ll confirm the time' : a.type === 'first' ? 'First consultation' : 'Follow-up'}</span>
                  <span className="block text-[16px] font-bold text-navy">{whenShort(a)}</span>
                  <span className="block text-[12px] text-muted">{a.mode === 'online' ? 'Online' : 'In person'} with Jitendra Khimlani</span>
                </span>
                <ChevronRight className="size-5 text-navy" />
              </Link>
            </li>
          ))}
        </ul>
      ) : <p className="mt-1 text-[14px] text-muted">Nothing booked right now.</p>}
      <BtnLink href={hasHistory ? '/app/book?type=followup' : '/app/book'} size="md" variant={up.length ? 'white' : 'gradient'} className="mt-4 w-full">
        <CalendarHeart className="size-4" /> {hasHistory ? 'Book a new session' : 'Book your first consultation'}
      </BtnLink>
    </section>
  )
}

function PastSessions() {
  const appts = useApp((s) => s.appointments)
  const now = Date.now()
  const past = appts.filter((a) => a.status === 'completed' || (a.status === 'confirmed' && !tbc(a) && +new Date(a.startsAt) + 3600_000 <= now))
    .sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt)).slice(0, 5)
  if (!past.length) return null
  return (
    <section className="card p-5" aria-labelledby="past-h">
      <h2 id="past-h" className="h-section">Past sessions</h2>
      <ul className="mt-2 divide-y divide-line">
        {past.map((a) => (
          <li key={a.id}>
            <Link href={`/app/sessions/view?id=${a.id}`} className="flex items-center gap-3 py-3">
              <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold text-navy">{a.type === 'first' ? 'First consultation' : 'Follow-up'}</span>
                <span className="text-[13px] text-muted">{fmtDay(a.startsAt)} · {a.mode === 'online' ? 'Online' : 'In person'}</span></span>
              {!a.feedback && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose">Add feedback</span>}
              <ChevronRight className="size-4 text-soft" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
