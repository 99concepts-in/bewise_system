/**
 * Small shared pieces: Bach flower / Scanning badge, weekly ring, kind words carousel.
 */
import { useMemo, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { Flower2, ScanLine } from 'lucide-react'
import { useIndex, useStore } from '../state/store'
import { relative } from '../lib/time'
import type { Appt, Kind, Service } from '../data/types'

/** Bach flower vs Scanning — always the same colour + icon + word, so they are told apart at a glance. */
export function TypeBadge({ service, kind, big }: { service: Service; kind?: Kind; big?: boolean }) {
  const Icon = service === 'scanning' ? ScanLine : Flower2
  return <span className={`type-badge type-${service}${big ? ' big' : ''}`}><Icon size={big ? 15 : 12} aria-hidden />{service === 'scanning' ? 'Scanning' : kind === 'first' ? 'Bach flower, first visit' : 'Bach flower'}</span>
}

// ---------------------------------------------------------------- week ring
export function Ring({ value, goal }: { value: number; goal: number }) {
  const r = 34, c = 2 * Math.PI * r
  const pct = Math.min(1, value / goal)
  return (
    <svg className="ring" viewBox="0 0 84 84" width={84} height={84} aria-label={`${value} of ${goal} sessions this week`} role="img">
      <circle cx="42" cy="42" r={r} fill="none" stroke="#E6EAF6" strokeWidth="8" />
      <m.circle cx="42" cy="42" r={r} fill="none" stroke="url(#ring-g)" strokeWidth="8" strokeLinecap="round" transform="rotate(-90 42 42)"
        strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }} />
      <defs><linearGradient id="ring-g" x1="0" x2="1"><stop offset="0" stopColor="#82977E" /><stop offset="1" stopColor="#5E7FB8" /></linearGradient></defs>
      <text x="42" y="47" textAnchor="middle" className="ring-text">{Math.round(pct * 100)}%</text>
    </svg>
  )
}

// ---------------------------------------------------------------- kind words (what clients said)
export function KindWords({ appts }: { appts: Appt[] }) {
  const { person } = useIndex()
  const recent = useMemo(() => [...appts].sort((a, b) => b.start - a.start).filter((a) => a.feedback).slice(0, 6), [appts])
  const [i, setI] = useState(0)
  const { now } = useStore()
  if (!recent.length) return null
  const a = recent[i % recent.length]
  const p = person.get(a.personId)!
  const step = (d: number) => setI((x) => (x + d + recent.length) % recent.length)
  return (
    <figure className="kind card">
      <figcaption className="muted small">What people told you</figcaption>
      <AnimatePresence mode="wait" initial={false}>
        <m.blockquote key={a.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}
          drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.4} onDragEnd={(_, inf) => { if (inf.offset.x < -50) step(1); if (inf.offset.x > 50) step(-1) }}>
          “{a.feedback}”
          <cite>{p.first}, {p.city}, {relative(a.start, now)}</cite>
        </m.blockquote>
      </AnimatePresence>
      <div className="dots" role="tablist" aria-label="Choose a message">
        {recent.map((r, k) => <button key={r.id} role="tab" aria-selected={k === i % recent.length} aria-label={`Message ${k + 1}`} onClick={() => setI(k)} className={k === i % recent.length ? 'on' : ''} />)}
      </div>
    </figure>
  )
}
