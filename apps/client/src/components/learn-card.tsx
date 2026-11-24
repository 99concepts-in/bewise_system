'use client'
/**
 * @module learn @owner CLIENT
 * Owner 2026-11-24 (reference: a bold "Daily Challenge" style card with a big blob flower): a slider of colourful story cards
 * on Home and in My care. Each card opens its story directly. Auto-slides every 5 s, swipe to browse, dots below.
 */
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { STORIES } from '@/lib/stories'
import { cx } from './ui'

// one bold colour pair per story: card background + blob flower
const SHORT: Record<string, string> = {
  sleep: 'Rest easy tonight', anxiety: 'Calm a worried mind', relationships: 'Closer and kinder', confidence: 'Step into confidence',
  finance: 'Calm about money', change: 'Steady in change', 'self-doubt': 'Trust yourself again',
}
const LOOK: Record<string, { bg: string; blob: string; ink: string }> = {
  sleep: { bg: '#C9C2F5', blob: '#3F3AA8', ink: '#17163d' },
  anxiety: { bg: '#CFE9D9', blob: '#E9A23B', ink: '#13321f' },
  relationships: { bg: '#F7D3DC', blob: '#D9475F', ink: '#3d1520' },
  confidence: { bg: '#FFE2B8', blob: '#E2573A', ink: '#3d1f0b' },
  finance: { bg: '#D8E7C5', blob: '#3F7A4A', ink: '#1a2e16' },
  change: { bg: '#C7E5EA', blob: '#2F7F8C', ink: '#0f2c31' },
  'self-doubt': { bg: '#D9D7FB', blob: '#6E5BD9', ink: '#1e1a4a' },
}
// soft five-lobed blob flower
const BLOB = 'M0,-86 C22,-86 30,-48 20,-30 C40,-52 82,-40 80,-16 C78,8 40,8 30,6 C52,22 60,64 36,74 C14,84 6,46 0,32 C-6,46 -14,84 -36,74 C-60,64 -52,22 -30,6 C-40,8 -78,8 -80,-16 C-82,-40 -40,-52 -20,-30 C-30,-48 -22,-86 0,-86Z'

export function LearnCard() {
  const still = useReducedMotion()
  const row = useRef<HTMLDivElement>(null)
  const [at, setAt] = useState(0)
  const paused = useRef(false)
  const go = (i: number) => { const el = row.current; if (!el) return; const card = el.children[i] as HTMLElement | undefined; if (card) el.scrollTo({ left: card.offsetLeft - 20, behavior: 'smooth' }) }
  useEffect(() => {
    if (still) return
    const t = setInterval(() => { if (!paused.current && document.visibilityState === 'visible') go((at + 1) % STORIES.length) }, 5000)
    return () => clearInterval(t)
  }, [at, still])
  const onScroll = () => {
    const el = row.current; if (!el) return
    const w = (el.children[0] as HTMLElement)?.offsetWidth ?? 1
    setAt(Math.max(0, Math.min(STORIES.length - 1, Math.round(el.scrollLeft / (w + 12)))))
  }
  return (
    <section aria-label="Learn how Bach flowers can help you">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="h-section">How Bach flowers can help</h2>
        <Link href="/app/learn" className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-navy">All<ArrowRight className="size-4" /></Link>
      </div>
      <div ref={row} onScroll={onScroll} onPointerDown={() => { paused.current = true }} onPointerUp={() => { setTimeout(() => { paused.current = false }, 4000) }}
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1">
        {STORIES.map((s, i) => {
          const l = LOOK[s.id] ?? LOOK.sleep
          return (
            <Link key={s.id} href={`/app/learn/story?id=${s.id}`} aria-label={`Read: ${s.title}`}
              className="relative flex h-[168px] w-[86%] shrink-0 snap-start flex-col overflow-hidden rounded-[28px] p-5" style={{ background: l.bg, color: l.ink }}>
              <motion.svg viewBox="-90 -90 180 180" aria-hidden className="absolute -right-12 top-1/2 size-[160px] -translate-y-1/2"
                animate={still || at !== i ? undefined : { rotate: [0, 12, 0], scale: [1, 1.05, 1] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
                <path d={BLOB} fill={l.blob} />
                <circle r={14} fill={l.bg} opacity={0.55} />
              </motion.svg>
              <span className="relative max-w-[68%] text-[11px] font-bold uppercase tracking-[0.12em] opacity-70">{s.tag}</span>
              <span className="relative mt-1.5 line-clamp-2 max-w-[70%] text-[22px] font-extrabold leading-[26px] tracking-[-0.01em]">{SHORT[s.id] ?? s.tag}</span>
              <span className="relative mt-auto inline-flex w-max items-center gap-1.5 rounded-full bg-white/80 px-3.5 py-1.5 text-[13px] font-bold">Read now <ArrowRight className="size-4" /></span>
            </Link>
          )
        })}
        <span className="w-2 shrink-0" aria-hidden />
      </div>
      <div className="mt-2.5 flex justify-center gap-1.5" role="tablist" aria-label="Stories">
        {STORIES.map((s, i) => (
          <button key={s.id} role="tab" aria-selected={at === i} aria-label={s.title} onClick={() => go(i)} className="grid h-6 place-items-center px-0.5">
            <span className={cx('block h-2 rounded-full transition-all', at === i ? 'w-5 bg-navy' : 'w-2 bg-[#cfd6ea]')} />
          </button>
        ))}
      </div>
    </section>
  )
}
