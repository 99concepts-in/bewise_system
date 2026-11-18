/**
 * Care widgets shared by Profile, Live session and the remedy sheet:
 * - AdherenceCard: is the person taking their drops (client ticks "took my drops" daily)?
 * - Suggestions: flowers to consider, with reasons (D-37 — Jitu Bhaiya only; reference, he decides).
 */
import { m } from 'motion/react'
import { Check, MessageCircle, Plus, Sparkles } from 'lucide-react'
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
          <MessageCircle size={15} /> Send a gentle nudge
        </a>
      )}
    </section>
  )
}

export function Suggestions({ first, items, picked, onToggle, onAddAll, limit = 5 }: { first: string; items: Suggestion[]; picked: string[]; onToggle: (f: string) => void; onAddAll?: () => void; limit?: number }) {
  if (!items.length) return <p className="muted small sugg-empty">No suggestions yet. Mark what's troubling {first} today and flowers to consider appear here.</p>
  const shown = items.slice(0, limit)
  const allIn = shown.every((s) => picked.includes(s.flower))
  return (
    <section className="sugg">
      <div className="sugg-head">
        <h4><Sparkles size={15} /> Suggested from {first}'s data</h4>
        {onAddAll && !allIn && <button className="link" onClick={onAddAll}>Add all {shown.length}</button>}
      </div>
      <ul>
        {shown.map((s, i) => {
          const on = picked.includes(s.flower)
          return (
            <m.li key={s.flower} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.03 }}>
              <div className="sugg-main">
                <b>{s.flower}</b>
                <small className="sugg-note">{s.note}</small>
                <span className="sugg-why">{s.reasons.slice(0, 2).join('; ')}</span>
              </div>
              <m.button className={'sugg-add' + (on ? ' on' : '')} whileTap={{ scale: 0.9 }} onClick={() => onToggle(s.flower)} aria-pressed={on} aria-label={on ? `Remove ${s.flower}` : `Add ${s.flower}`}>
                {on ? <Check size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={2.6} />}
              </m.button>
            </m.li>
          )
        })}
      </ul>
      <p className="sugg-foot">Reference only, from troubling emotions, check-ins and past blends. Your judgement decides.</p>
    </section>
  )
}
