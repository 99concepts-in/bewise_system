/**
 * @module   prototype/consultant-app/ui/loshu
 * @owner    CONSULTANT
 * Purpose:  Lo Shu grid views — the full panel (profile tab) and a small grid (overview, live session).
 */
import { useState, type ReactNode } from 'react'
import { m } from 'motion/react'
import { MessageCircle } from 'lucide-react'
import { LOSHU_LAYOUT, NUMBER_MEANING, PLANES, ageOn, loShu, parseDob, type LoShu } from '../lib/loshu'
import { softSpring } from './kit'
import { waLink } from '../lib/labels'
import { fmtLong } from '../lib/time'
import { useStore } from '../state/store'
import type { Person } from '../data/types'

export function LoShuGrid({ ls, small = false }: { ls: LoShu; small?: boolean }) {
  return (
    <div className={'loshu' + (small ? ' loshu-sm' : '')} role="table" aria-label="Lo Shu grid">
      {[0, 1, 2].map((row) => (
        <div key={row} role="row" className="ls-row">
          {LOSHU_LAYOUT.slice(row * 3, row * 3 + 3).map((n, i) => {
            const c = ls.count[n]
            const extra = ls.added.filter((x) => x === n).length
            const own = c - extra
            return (
              <m.div key={n} role="cell" className={'ls-cell' + (c ? ' on' : ' empty') + (c > 1 ? ' many' : '')}
                aria-label={c ? `${n}, ${c} ${c === 1 ? 'time' : 'times'}${extra ? `, ${extra} added` : ''}` : `${n} missing`}
                initial={small ? false : { opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...softSpring, delay: small ? 0 : 0.04 * (row * 3 + i) }}>
                {c ? <span className="ls-num">{String(n).repeat(own)}{extra > 0 && <em>{String(n).repeat(extra)}</em>}</span> : <span className="ls-ghost">{n}</span>}
              </m.div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/** Full Lo Shu tab: grid, driver + conductor, missing / repeated numbers, complete planes, how it was worked out. */
export function LoShuPanel({ p, now, after }: { p: Person; now: number; after?: ReactNode }) {
  const ls = loShu(p.dob)
  if (!ls) return <NoDob p={p} />
  const d = parseDob(p.dob)!
  const age = ageOn(p.dob, now)
  const digits = `${String(d.d).padStart(2, '0')} ${String(d.m).padStart(2, '0')} ${d.y}`
  return (
    <div className="ls-panel">
      <section className="card pf-card ls-main">
        <div className="ls-meta">
          <div><small>Born</small><b>{fmtLong(new Date(d.y, d.m - 1, d.d).getTime())}</b>{age != null && <small>{age} years</small>}</div>
          <div className="ls-key"><small>Driver</small><b>{ls.driver}</b><small>Mulank</small></div>
          <div className="ls-key"><small>Conductor</small><b>{ls.conductor}</b><small>Bhagyank</small></div>
        </div>
        <LoShuGrid ls={ls} />
        <p className="tagline">Digits of {digits}{ls.added.length === 2 ? `, plus driver ${ls.driver} and conductor ${ls.conductor}` : `, plus conductor ${ls.conductor}`} (in italics). Zeros are not placed.</p>
      </section>

      {after}

      <section className="card pf-card">
        <h2>Missing numbers <span className="muted small">{ls.missing.length}</span></h2>
        {ls.missing.length === 0 ? <p className="muted small">Every number from 1 to 9 is present.</p> : (
          <ul className="ls-list">{ls.missing.map((n) => <li key={n}><span className="ls-badge miss">{n}</span><span><b>{NUMBER_MEANING[n].word}</b><small>{NUMBER_MEANING[n].line}</small></span></li>)}</ul>
        )}
      </section>

      {ls.repeated.length > 0 && (
        <section className="card pf-card">
          <h2>Repeated numbers</h2>
          <ul className="ls-list">{ls.repeated.map(({ n, times }) => <li key={n}><span className="ls-badge">{String(n).repeat(times)}</span><span><b>{NUMBER_MEANING[n].word}, {times} times</b><small>{NUMBER_MEANING[n].line}</small></span></li>)}</ul>
        </section>
      )}

      <section className="card pf-card">
        <h2>Planes</h2>
        <ul className="ls-planes">
          {PLANES.map((pl) => {
            const full = ls.planes.includes(pl)
            return (
              <li key={pl.name} className={full ? 'full' : ''}>
                <span className="ls-plane-nums">{pl.nums.map((n) => <i key={n} className={ls.count[n] ? 'on' : ''}>{n}</i>)}</span>
                <span><b>{pl.name}</b><small>{full ? `Complete: ${pl.line}` : `Missing ${pl.nums.filter((n) => !ls.count[n]).join(', ')}`}</small></span>
              </li>
            )
          })}
        </ul>
      </section>
      <p className="tagline ls-foot">Meanings are short reminders for you. Your own reading comes first.</p>
    </div>
  )
}

function NoDob({ p }: { p: Person }) {
  const { dispatch } = useStore()
  const [dob, setDob] = useState('')
  const today = new Date().toISOString().slice(0, 10)
  const ok = !!parseDob(dob) && dob <= today && dob >= '1900-01-01'
  return (
    <section className="card pf-card ls-empty">
      <h2>No date of birth yet</h2>
      <p className="muted small">{p.first} adds it in the app under About you. You can ask, or add it here if {p.first} tells you.</p>
      <form className="ls-add" onSubmit={(e) => { e.preventDefault(); if (ok) dispatch({ type: 'setDob', personId: p.id, dob }) }}>
        <label className="sr-only" htmlFor="ls-dob">Date of birth</label>
        <input id="ls-dob" type="date" value={dob} max={today} min="1900-01-01" onChange={(e) => setDob(e.target.value)} />
        <button className="btn btn-primary" disabled={!ok}>Show grid</button>
      </form>
      <a className="btn btn-quiet btn-block" href={waLink(p.phone, `Namaste ${p.first}, could you add your date of birth in the BeWise app (Me, About you)? It helps me prepare for your session. 🙏`)} target="_blank" rel="noreferrer"><MessageCircle size={16} /> Ask on WhatsApp</a>
    </section>
  )
}
