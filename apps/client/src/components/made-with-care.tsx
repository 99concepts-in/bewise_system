'use client'
/**
 * @module   remedies-ux
 * @owner    CLIENT
 * Owner 2026-11-23: (1) remedies only after a session — members should not pick flowers themselves from a list;
 * (2) a separate "How our remedies are made" card: vibrationally charged with mantras, curated by a certified expert,
 * best-quality flower blends.
 */
import { ShieldCheck } from 'lucide-react'
import { cx } from './ui'

export const SESSION_ONLY = 'Take Bach remedies only after a session with Jitendra Khimlani. Chosen on your own, a remedy may not suit you or may not help at all.'

/** small notice shown wherever remedy names appear */
export function SessionOnly({ dark, className }: { dark?: boolean; className?: string }) {
  return (
    <p className={cx('flex items-start gap-2 rounded-[16px] px-3.5 py-3 text-[13px] font-semibold leading-5', dark ? 'bg-[#fff6dc] text-[#6b5320]' : 'bg-marigold-100 text-[#6b5320]', className)}>
      <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> <span>{SESSION_ONLY}</span>
    </p>
  )
}

const POINTS = [
  { e: '🕉️', t: 'Vibrationally charged', d: 'Charged with mantras while each blend is being made.' },
  { e: '🎓', t: 'Curated by a certified expert', d: 'Every blend is chosen by Jitendra Khimlani, Certified Bach Flower Remedy Therapist, for you alone.' },
  { e: '🌼', t: 'Best quality flower blends', d: 'Made with the finest flower remedies, imported from the official Bach Centre, UK.' },
]

export function MadeWithCare({ className }: { className?: string }) {
  return (
    <section className={cx('overflow-hidden rounded-[28px] bg-[linear-gradient(160deg,#fff7e6,#fdeef3)] p-5 shadow-[var(--shadow-card)]', className)} aria-labelledby="made-h">
      <p className="eyebrow text-[#9a6b12]">The BeWise difference</p>
      <h2 id="made-h" className="mt-1 font-display text-[21px] font-semibold leading-7 text-ink">How our remedies are made</h2>
      <ul className="mt-4 space-y-3">
        {POINTS.map((p) => (
          <li key={p.t} className="flex gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[20px] shadow-[var(--shadow-card)]" aria-hidden>{p.e}</span>
            <span className="min-w-0"><span className="block text-[15px] font-bold text-navy">{p.t}</span><span className="block text-[13px] leading-5 text-ink-2">{p.d}</span></span>
          </li>
        ))}
      </ul>
    </section>
  )
}
