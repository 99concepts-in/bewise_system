'use client'
/**
 * @module   learn
 * @owner    CLIENT
 * @screens  Learn tab: "Know how Bach flower therapy can help you" (owner 2026-11-23)
 * Story cards (Higgsfield covers), search by concern (stories + the concern finder), member stories and Google reviews link.
 */
import Link from 'next/link'
import { motion } from 'motion/react'
import { ChevronRight, ExternalLink, Quote, Search, Star, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AppHeader } from '@/components/shell'
import { FlowerArt } from '@/components/flower'
import { SessionOnly } from '@/components/made-with-care'
import { cx, ease } from '@/components/ui'
import { STORIES } from '@/lib/stories'
import { findConcerns } from '@/lib/remedy-finder'
import { GOOGLE_REVIEWS_URL, TESTIMONIALS } from '@/lib/data'
import { BP } from '@/lib/asset'

const POPULAR = ['Sleep', 'Worry', 'Anger', 'Confidence', 'Big life change', 'Loneliness', 'Stress', 'Relationship']
// owner 2026-11-23: next topics, framed as emotional wellbeing alongside medical care
const SOON = ['Living with diabetes', 'Physical pain', 'Low mood', 'Weight and self-image']

export default function Learn() {
  const [q, setQ] = useState('')
  const t = q.trim().toLowerCase()
  const stories = useMemo(() => (t ? STORIES.filter((s) => s.title.toLowerCase().includes(t) || s.keywords.some((k) => k.includes(t) || t.includes(k))) : STORIES), [t])
  const concerns = useMemo(() => findConcerns(q).slice(0, 6), [q])

  return (
    <main className="px-5 pb-32">
      <AppHeader />
      <h1 className="h-duo pt-2">Know how <em>Bach flower therapy</em> can help you</h1>
      <p className="mt-2 text-[14px] leading-5 text-ink-2">Short stories, 3 minutes each. Tap the right side to move on.</p>

      <label className="mt-5 flex h-12 items-center gap-2 rounded-full bg-white px-4 shadow-[var(--shadow-card)] focus-within:ring-2 focus-within:ring-navy">
        <Search className="size-5 text-muted" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value.slice(0, 40))} placeholder="Search a concern, like sleep or worry" aria-label="Search a concern"
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-[#8a91a8]" />
        {q && <button onClick={() => setQ('')} aria-label="Clear search" className="grid size-8 place-items-center rounded-full text-muted"><X className="size-4" /></button>}
      </label>
      {!t && (
        <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
          {POPULAR.map((p) => <button key={p} onClick={() => setQ(p)} className="shrink-0 rounded-full bg-peri-50 px-3.5 py-2 text-[13px] font-semibold text-navy">{p}</button>)}
        </div>
      )}

      {stories.length > 0 && (
        <section className="mt-6" aria-label="Stories">
          <div className="grid grid-cols-2 gap-3">
            {stories.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.45, ease }} className={cx(i === 0 && !t && 'col-span-2')}>
                <Link href={`/app/learn/story?id=${s.id}`} className="group relative block overflow-hidden rounded-[24px] shadow-[var(--shadow-float)]" aria-label={`Read: ${s.title}`}>
                  <img src={`${BP}/img/${s.cover}.webp`} alt="" className={cx('w-full object-cover transition-transform duration-700 group-active:scale-[1.03]', i === 0 && !t ? 'aspect-[4/3]' : 'aspect-[3/4]')} />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-bold text-navy backdrop-blur">{s.tag}</span>
                  <span className="absolute inset-x-3 bottom-3 text-white">
                    <span className="block font-display text-[19px] font-semibold leading-6">{s.title}</span>
                    <span className="mt-0.5 block text-[12px] text-white/85">{s.slides.length} slides · 3 min</span>
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {t && concerns.length > 0 && (
        <section className="mt-6 space-y-3" aria-label="Flowers often chosen">
          <h2 className="h-section">Flowers often chosen</h2>
          {concerns.map((c) => (
            <div key={c.concern} className="card p-4">
              <p className="text-[15px] font-bold text-navy">{c.concern}</p>
              <ul className="mt-2 space-y-2">
                {c.remedies.slice(0, 3).map((r) => (
                  <li key={r.name} className="flex items-center gap-3">
                    <FlowerArt name={r.name} decorative className="size-10 shrink-0" />
                    <span className="min-w-0 text-[13px] leading-5"><b className="text-ink">{r.name}</b> <span className="text-muted">· {r.why}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <SessionOnly />
          <p className="px-1 text-[12px] leading-5 text-muted">Shown to explain how Bach flowers relate to feelings. Your blend is chosen for you by Jitendra Khimlani after a session. Emotional wellbeing support, not medical treatment.</p>
          <Link href="/app/book" className="flex h-12 items-center justify-center rounded-full bg-navy text-[15px] font-semibold text-white shadow-[var(--shadow-cta)]">Book a session</Link>
        </section>
      )}
      {t && !stories.length && !concerns.length && (
        <div className="card mt-6 p-5 text-center">
          <p className="text-[15px] font-bold text-navy">Nothing on “{q}” yet</p>
          <p className="mt-1 text-[13px] text-muted">Tell Jitendra Khimlani about it in a session. He chooses your blend for exactly how you feel.</p>
          <Link href="/app/book" className="mt-3 inline-flex h-11 items-center rounded-full bg-navy px-5 text-[14px] font-semibold text-white">Book a session</Link>
        </div>
      )}

      {!t && (
        <>
          <section className="mt-7">
            <h2 className="h-section">Coming soon</h2>
            <div className="mt-3 flex flex-wrap gap-2">{SOON.map((s) => <span key={s} className="rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-ink-2 ring-1 ring-[#e3e6ef]">{s}</span>)}</div>
          </section>

          <section className="mt-7" aria-labelledby="say-h">
            <div className="flex items-end justify-between">
              <h2 id="say-h" className="h-section">What members say</h2>
              <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] font-semibold text-navy">Google reviews <ExternalLink className="size-3.5" /></a>
            </div>
            <div className="no-scrollbar -mx-5 mt-3 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2" tabIndex={0} role="region" aria-label="Member words">
              {TESTIMONIALS.map((r) => (
                <figure key={r.name} className="w-[78%] shrink-0 snap-start rounded-[22px] bg-rose-100 p-5">
                  <Quote className="size-6 fill-rose-500 text-rose-500" aria-hidden />
                  <blockquote className="mt-2 font-display text-[16px] italic leading-6 text-ink">“{r.quote}”</blockquote>
                  <figcaption className="mt-3 text-[13px] font-semibold text-ink-2">{r.name}</figcaption>
                </figure>
              ))}
              <span className="w-2 shrink-0" aria-hidden />
            </div>
            <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer" className="card mt-2 flex items-center gap-3 p-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-marigold-100 text-[#b8860b]"><Star className="size-5 fill-current" /></span>
              <span className="flex-1"><span className="block text-[15px] font-bold text-navy">Read all reviews on Google</span><span className="text-[12px] text-muted">From members of Jitendra Khimlani</span></span>
              <ChevronRight className="size-5 text-soft" />
            </a>
          </section>
        </>
      )}
    </main>
  )
}
