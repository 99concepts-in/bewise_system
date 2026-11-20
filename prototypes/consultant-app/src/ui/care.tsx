/**
 * Care widgets shared by Profile, Live session and the remedy sheet:
 * - AdherenceCard: is the person taking their drops (client ticks "took my drops" daily)?
 * - Suggestions: flowers to consider, with reasons (D-37 — Jitu Bhaiya only; reference, he decides).
 * v5 (HUB 2026-11-20): suggestions and the remedy builder use flower tiles (FlowerTile); adherence restyled to Blue Bloom.
 */
import { AnimatePresence, m } from 'motion/react'
import { Check, MessageCircle, Sparkles } from 'lucide-react'
import { FlowerArt } from './art'
import { adherence, type Suggestion } from '../lib/derive'
import { fmtShort, fmtWeekday } from '../lib/time'
import { softSpring, spring } from './kit'
import type { Person } from '../data/types'

export function nudgeText(first: string) {
  return `Namaste ${first} 🙏 A gentle reminder to take your drops today: 4 drops, 4 times a day. Small steps, every day. Jitu Bhaiya`
}

export function AdherenceCard({ p, now, compact }: { p: Person; now: number; compact?: boolean }) {
  const a = adherence(p, now)
  if (!a) return (
    <section className={compact ? 'adh adh-compact' : 'card pf-card adh'}>
      <h2>Taking the remedy</h2>
      <p className="muted small">No log yet. Once {p.first} ticks “took my drops” in the BeWise app, every day shows here.</p>
    </section>
  )
  const ok = a.last7Missed <= 1
  const pct = Math.round(a.pct * 100)
  return (
    <section className={compact ? 'adh adh-compact' : 'card pf-card adh'}>
      <div className="adh-head">
        <h2>Taking the remedy</h2>
        <span className={'adh-pill ' + (ok ? 'ok' : 'warn')}>{ok ? 'On track' : `Missed ${a.last7Missed} of last 7 days`}</span>
      </div>
      <div className="adh-nums">
        <p><b>{pct}%</b><span>of days since {fmtShort(a.since)}</span></p>
        <p><b>{a.streak}</b><span>{a.streak === 1 ? 'day' : 'days'} in a row</span></p>
      </div>
      <ol className="adh-strip" aria-label="Last 14 days">
        {a.days.map((d, i) => (
          <li key={d.day} className={`adh-d ${d.state}`} aria-label={`${fmtShort(d.day)}: ${d.state === 'taken' ? 'took drops' : d.state === 'missed' ? 'missed' : 'not logged'}`}>
            <m.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...softSpring, delay: 0.05 + i * 0.025 }}>{d.state === 'taken' && <Check size={12} strokeWidth={3.2} />}</m.span>
            <small>{fmtWeekday(d.day).slice(0, 1)}</small>
          </li>
        ))}
      </ol>
      {!compact && <p className="adh-legend"><i className="taken" />Took drops<i className="missed" />Missed<i className="none" />Not logged</p>}
      {!ok && (
        <a className="btn btn-quiet btn-sm adh-nudge" href={`https://wa.me/${p.phone.replace(/\D/g, '')}?text=${encodeURIComponent(nudgeText(p.first))}`} target="_blank" rel="noreferrer">
          <MessageCircle size={16} aria-hidden /> Send a gentle nudge
        </a>
      )}
    </section>
  )
}

// ---------------------------------------------------------------- v5 (HUB 2026-11-20): flower tiles (spec §5 "Flower tile")
/** Square tile: sky-50 field, the flower at 80 %, Fraunces name. Selected = navy ring + check. Read-only tiles are plain list content. */
export function FlowerTile({ name, on, reason, onToggle, full }: { name: string; on?: boolean; reason?: string; onToggle?: (f: string) => void; full?: boolean }) {
  const body = (
    <>
      <span className="ftile-art">
        <FlowerArt name={name} decorative />
        <AnimatePresence>{on && <m.span className="ftile-check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring}><Check size={14} strokeWidth={3.2} /></m.span>}</AnimatePresence>
      </span>
      <span className="ftile-name">{name}</span>
      {reason && <span className="ftile-why">{reason}</span>}
    </>
  )
  if (!onToggle) return <div className="ftile is-static">{body}</div>
  return (
    <m.button type="button" className={'ftile' + (on ? ' is-on' : '') + (full && !on ? ' is-full' : '')} aria-pressed={!!on} aria-disabled={full && !on ? true : undefined}
      whileTap={{ scale: 0.95 }} transition={{ duration: 0.16 }} onClick={() => onToggle(name)}>
      {body}
    </m.button>
  )
}

/** "Flowers to consider": reasons always visible (D-37), never auto-applied. Without onToggle it's reference only (live session). */
export function Suggestions({ first, items, picked = [], onToggle, onAddAll, limit = 6, full }: { first: string; items: Suggestion[]; picked?: string[]; onToggle?: (f: string) => void; onAddAll?: () => void; limit?: number; full?: boolean }) {
  if (!items.length) return <p className="muted small sugg-empty">No suggestions yet. Mark what's troubling {first} today and flowers to consider appear here.</p>
  const shown = items.slice(0, limit)
  const allIn = shown.every((s) => picked.includes(s.flower))
  return (
    <section className="sugg">
      <div className="sugg-head">
        <h4><Sparkles size={16} aria-hidden /> Flowers to consider</h4>
        {onAddAll && !allIn && <button type="button" className="link" onClick={onAddAll}>Add all {Math.min(shown.length, 7)}</button>}
      </div>
      <ul className="ftile-grid">
        {shown.map((s, i) => (
          <m.li key={s.flower} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: i * 0.03 }}>
            <FlowerTile name={s.flower} on={picked.includes(s.flower)} reason={s.reasons[0]} onToggle={onToggle} full={full} />
          </m.li>
        ))}
      </ul>
      <p className="sugg-foot">Suggested from {first}'s troubling emotions, check-ins and past blends. Reference only, your judgement decides.</p>
    </section>
  )
}
