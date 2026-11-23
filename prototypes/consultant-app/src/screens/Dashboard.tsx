/**
 * Dashboard (owner 2026-11-20): how many people are taking their remedy — and a personal message to anyone, one tap away.
 * Below: impact, this week, what people told him, and the full growth charts.
 */
import { useMemo, useState } from 'react'
import { m } from 'motion/react'
import { ChevronRight, Leaf, MessageSquare, Sparkles } from 'lucide-react'
import { useIndex, useStore } from '../state/store'
import { Avatar, CountUp, go, softSpring } from '../ui/kit'
import { KindWords, Ring } from '../ui/bits'
import { ImpactCard } from './Impact'
import { adherence, growth, personView, remedyBoard, WEEK_GOAL, type PersonView } from '../lib/derive'
import { fmtDay } from '../lib/time'

type Tab = 'missing' | 'silent' | 'ending' | 'regular'

export default function Dashboard() {
  const { s, now } = useStore()
  const { byPerson } = useIndex()
  const views = useMemo(() => s.people.map((p) => personView(p, byPerson.get(p.id), now)), [s.people, byPerson, now])
  const b = useMemo(() => remedyBoard(views, now), [views, now])
  const g = useMemo(() => growth(s.appts, s.people, now), [s.appts, s.people, now])
  const [tab, setTab] = useState<Tab>('missing')
  const ending = [...b.ending7, ...b.ending14]
  const total = Math.max(1, b.on.length)
  const parts = [
    { key: 'regular', label: 'Taking it regularly', n: b.regular.length, cls: 'ok' },
    { key: 'missing', label: 'Missing days', n: b.missing.length, cls: 'warn' },
    { key: 'silent', label: 'Not logging', n: b.silent.length, cls: 'mute' },
  ]
  const lists: Record<Tab, PersonView[]> = { missing: b.missing, silent: b.silent, ending, regular: b.regular }
  const TABS: { v: Tab; label: string; n: number }[] = [
    { v: 'missing', label: 'Missing days', n: b.missing.length }, { v: 'ending', label: 'Ending soon', n: ending.length },
    { v: 'silent', label: 'Not logging', n: b.silent.length }, { v: 'regular', label: 'Regular', n: b.regular.length },
  ]

  return (
    <div className="screen dash">
      <h1 className="page-title">Dashboard</h1>

      <m.section className="card remedy-hero" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={softSpring} aria-label="People taking a remedy">
        <p className="rh-big"><Leaf size={22} /><b><CountUp to={b.on.length} /></b><span>people are on a remedy right now</span></p>
        <div className="stack" role="img" aria-label={parts.map((x) => `${x.label}: ${x.n}`).join(', ')}>
          {parts.map((x, i) => x.n > 0 && (
            <m.span key={x.key} className={`stack-seg ${x.cls}`} initial={{ width: 0 }} animate={{ width: `${(x.n / total) * 100}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 + i * 0.08 }} />
          ))}
        </div>
        <ul className="stack-legend">
          {parts.map((x) => <li key={x.key}><i className={x.cls} /><b>{x.n}</b> {x.label.toLowerCase()}</li>)}
        </ul>
        <p className="muted small">Remedy ends within a week for <b>{b.ending7.length}</b>, in 1–2 weeks for <b>{b.ending14.length}</b>.</p>
      </m.section>

      <section className="block" aria-label="Message people personally">
        <div className="block-head"><h2>Message personally</h2><button className="link" onClick={() => go('/messages')}>Messages <ChevronRight size={14} /></button></div>
        <div className="chips-scroll">
          {TABS.map((t) => <button key={t.v} className={'chip' + (tab === t.v ? ' is-on' : '') + (t.v === 'missing' ? ' chip-attn' : '')} aria-pressed={tab === t.v} onClick={() => setTab(t.v)}>{t.label}<span className="chip-count">{t.n}</span></button>)}
        </div>
        <ul className="rows">
          {lists[tab].slice(0, 25).map((v) => {
            const a = adherence(v.p, now)
            const line = tab === 'ending' ? `Ends ${fmtDay(v.endsOn!)}, in ${v.daysLeft} ${v.daysLeft === 1 ? 'day' : 'days'}`
              : tab === 'missing' ? `Missed ${a?.last7Missed} of the last 7 days`
              : tab === 'silent' ? 'Not ticking "took my drops" in the app'
              : `${Math.round((a?.pct ?? 0) * 100)}% of days, ${a?.streak ?? 0}-day streak`
            return (
              <li key={v.p.id}>
                <div className="row row-split">
                  <button className="row-hit" onClick={() => go(`/people/${v.p.id}?care`)}>
                    <Avatar name={v.p.name} size={40} mood={v.latestMood} />
                    <span className="row-main"><b>{v.p.name}</b><small className={tab === 'missing' ? 'warn' : ''}>{line}</small></span>
                  </button>
                  <span className="row-end"><button className="act act-msg" onClick={() => go(`/messages/${v.p.id}`)}><MessageSquare size={14} /> Message</button></span>
                </div>
              </li>
            )
          })}
        </ul>
        {lists[tab].length === 0 && <p className="muted small">No one in this group right now.</p>}
      </section>

      <section className="block" aria-label="Your impact"><ImpactCard /></section>

      <section className="block" aria-label="Your week">
        <div className="block-head"><h2>Your week</h2><button className="link" onClick={() => go('/growth')}>Growth charts <ChevronRight size={14} /></button></div>
        <div className="week card">
          <Ring value={g.thisWeek} goal={WEEK_GOAL} />
          <div className="week-stats">
            <p><b><CountUp to={g.thisWeek} /></b> of {WEEK_GOAL} sessions done this week</p>
            <p className="muted small">{g.bookedRest} more booked this week.</p>
            <p className="reach"><Sparkles size={14} /> <span>Bach flower and scanning together. Every one of them is a person you listened to.</span></p>
          </div>
        </div>
        <KindWords appts={g.kind} />
      </section>
    </div>
  )
}
