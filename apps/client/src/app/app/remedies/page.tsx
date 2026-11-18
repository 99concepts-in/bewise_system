'use client'
/**
 * @module   remedies-ux
 * @owner    CLIENT (views) · CONSULTANT owns remedies data (getCurrentRemedyForClient — names, ritual; never reasons)
 * @screens  CL-26 My Remedies · CL-27 Flower detail · CL-28 Ritual & reminders · CL-29 Past blends · CL-56 Progress
 */
import { motion } from 'motion/react'
import { Bell, ChevronRight, Lightbulb, RotateCcw, ShoppingBag } from 'lucide-react'
import { useRef, useState } from 'react'
import { Mascot, MoodImg } from '@/components/brand'
import { AppHeader } from '@/components/shell'
import { Btn, BtnLink, Item, Reveal, Ring, Sheet, buzz, ease, toast, useChrome } from '@/components/ui'
import { moodOf, REORDER_PRICE_PAISE } from '@/lib/data'
import { useApp } from '@/lib/store'
import { dayKey, fmtDay, formatINR } from '@/lib/format'
import { dailyInsight, moodMix, progressLines } from '@/lib/insights'
import { DropsTick } from '@/components/drops-tick'
import { blendSupply } from '@/lib/supply'
import { BP } from '@/lib/asset'

// @decision(D-10) generic Bach descriptions — Jitu Bhaiya approves final wording before launch. Never the reason it was chosen.
const ABOUT: Record<string, string> = {
  Mimulus: 'Dr Bach described Mimulus for everyday fears of known things, a gentle companion for quiet courage.',
  'White Chestnut': 'Associated with a busy mind and repeating thoughts, for a calmer, clearer head.',
  Larch: 'Linked with self-belief, for having a go without expecting to fail.',
  Impatiens: 'Associated with impatience and irritation, for an easier, unhurried pace.',
  Walnut: 'Known as the remedy for times of change, for steadiness while life shifts.',
}
const FLOWER_IMG = ['f-rose', 'f-mimulus']

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
      <h1 className="h-duo pt-2">My <em>remedies</em></h1>
      <div className="card mt-6 flex flex-col items-center p-8 text-center">
        <Mascot pose="sleep" height={150} />
        <p className="mt-4 text-[18px] font-extrabold text-navy">Your blend will bloom here</p>
        <p className="mt-1 max-w-[280px] text-[14px] leading-5 text-muted">After your first session, Jitu Bhaiya prepares a personal blend of flower essences, included in your consultation.</p>
        <BtnLink href="/app/book" size="md" className="mt-5">Book a consultation</BtnLink>
      </div>
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
        <Item><h1 className="h-duo pt-2">My <em>remedies</em></h1></Item>
        <Item>
          <section className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(150deg,#fbf3dc_0%,#f6efe4_45%,#eef1fb_100%)] p-6 shadow-[var(--shadow-card)]">
            <motion.img src={`${BP}/img/f-mimulus.webp`} alt="" aria-hidden className="absolute -right-10 top-2 h-[150px] opacity-80" animate={{ rotate: [0, 4, 0] }} transition={{ duration: 6, repeat: Infinity }} />
            <motion.img src={`${BP}/img/products/bach-remedy-dropper.webp`} alt="" aria-hidden className="absolute bottom-3 right-6 h-[170px] drop-shadow-[0_18px_18px_rgba(24,41,87,.22)]" initial={{ y: 30, opacity: 0 }} animate={{ y: [0, -8, 0], opacity: 1 }} transition={{ y: { duration: 5, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.6 } }} />
            <p className="text-[13px] font-semibold text-[#8a6a2c]">Since {fmtDay(blend.startedOn)}</p>
            <h2 className="relative mt-1 max-w-[62%] text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-navy">{blend.name} <span className="text-soft">v{blend.version}</span></h2>
            <p className="relative mt-1 max-w-[62%] text-[14px] text-muted">{blend.drops} drops · {blend.timesPerDay}× a day</p>
            <div className="relative mt-5 flex max-w-[62%] items-center gap-3">
              <Ring value={sup.level} size={74} stroke={8} color="#c48a3a" track="#ffffffaa"><span className="text-center leading-none"><b className="text-[18px] text-navy tnum">{left}</b><br /><span className="text-[11px] text-muted">days left</span></span></Ring>
              <p className="text-[13px] leading-4 text-muted">{sup.next ? 'Lasts until your next session.' : 'A follow-up refreshes your blend.'}</p>
            </div>
          </section>
        </Item>

        <Item>
          <section className="card p-5">
            <h2 className="h-section">Flowers in your blend</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {blend.flowers.map((f, i) => (
                <motion.button key={f} onClick={() => setFlower(f)} whileTap={{ scale: 0.95 }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.05 }}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[#f6f1e8] pl-1.5 pr-4 text-[14px] font-semibold text-navy">
                  <img src={`${BP}/img/${FLOWER_IMG[i % 2]}.webp`} alt="" className="size-8 rounded-full bg-white object-contain p-0.5" />{f}
                </motion.button>
              ))}
            </div>
          </section>
        </Item>

        <Item><RitualToday onTimes={() => setTimes(true)} /></Item>

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
                <div className="mt-2 flex items-center gap-5 rounded-[22px] bg-peri-50/60 p-4">
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

        <Item>
          <section className="card p-5">
            <h2 className="h-section">Past blends</h2>
            <div className="mt-3 flex items-center gap-3 rounded-[20px] bg-peri-50/60 p-3">
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
            <motion.img src={`${BP}/img/${FLOWER_IMG[blend.flowers.indexOf(flower) % 2]}.webp`} alt="" className="mx-auto h-[180px]" initial={{ scale: 0.7, rotate: -8, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }} />
            <h2 className="h-duo mt-2 text-[28px]">{flower}</h2>
            <p className="mt-3 text-[15px] leading-6 text-ink">{ABOUT[flower] ?? 'One of Dr Bach’s 38 flower essences.'}</p>
            <p className="mt-4 rounded-[18px] bg-[#f6f1e8] p-3 text-[13px] font-semibold text-[#8a6a2c]">In your blend since {fmtDay(blend.startedOn)}</p>
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

function RitualToday({ onTimes }: { onTimes: () => void }) {
  const blend = useApp((s) => s.blend)!
  return (
    <section className="card p-5" aria-labelledby="drops-h">
      <div className="flex items-start justify-between">
        <div><h2 id="drops-h" className="h-section">Your daily drops</h2><p className="text-[13px] text-muted">{blend.drops} drops, {blend.timesPerDay}× a day · {blend.reminderTimes.join(', ')}</p></div>
        <button onClick={onTimes} className="inline-flex items-center gap-1.5 rounded-full bg-peri-50 px-3 py-2 text-[13px] font-semibold text-navy"><Bell className="size-4" /> Times</button>
      </div>
      <div className="mt-4"><DropsTick full /></div>
    </section>
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
