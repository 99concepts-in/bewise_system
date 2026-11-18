/**
 * @screens CN-26 My month — momentum, busiest times, what people bring, milestones.
 */
import { useMemo, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { useStore } from '../state/store'
import { CountUp, softSpring } from '../ui/kit'
import { growth } from '../lib/derive'
import { ImpactPanel } from './Impact'
import { fmtMonth, fmtShort } from '../lib/time'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const hourLabel = (h: number) => (h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`)

export default function Growth() {
  const { s, now } = useStore()
  const g = useMemo(() => growth(s.appts, s.people, now), [s.appts, s.people, now])
  const delta = g.month - g.lastMonth
  const Trend = delta >= 0 ? TrendingUp : TrendingDown
  const busiest = useMemo(() => {
    let best = { d: 0, h: 0, v: -1 }
    g.grid.forEach((row, d) => row.forEach((v, h) => { if (v > best.v) best = { d, h, v } }))
    return best
  }, [g.grid])

  return (
    <div className="screen growth">
      <h1 className="page-title">Growth</h1>
      <h2 className="sec-title">Your impact</h2>
      <ImpactPanel />
      <h2 className="sec-title">This month</h2>
      <section className="g-hero">
        <p className="muted">{fmtMonth(now)} so far</p>
        <p className="g-big"><CountUp to={g.month} /><span>sessions</span></p>
        <p className={'g-delta ' + (delta >= 0 ? 'up' : 'down')}><Trend size={16} />{delta === 0 ? 'Same as' : `${Math.abs(delta)} ${delta > 0 ? 'more than' : 'fewer than'}`} the same days last month</p>
      </section>

      <div className="g-stats">
        <Stat label="people met" value={g.monthPeople} />
        <Stat label="returning visits" value={g.returning} />
        <Stat label="average rating" value={g.avg} fmt={(n) => n.toFixed(1)} />
        <Stat label="remedies given" value={g.remedies} />
      </div>

      <section className="card chart-card">
        <h2>Sessions per week</h2>
        <p className="muted small">Completed sessions, last 8 weeks. This week is still in progress.</p>
        <WeekBars weeks={g.weeks} />
      </section>

      <section className="card chart-card">
        <h2>When people book you</h2>
        <p className="muted small">{busiest.v > 0 ? `${DAYS[busiest.d]} at ${hourLabel(g.hours[busiest.h])} fills first. Keep it open for follow-ups.` : 'Not enough bookings yet.'}</p>
        <Heatmap grid={g.grid} hours={g.hours} />
      </section>

      <section className="card chart-card">
        <h2>What people bring to you</h2>
        <p className="muted small">Troubling emotions you noted in the last 30 days.</p>
        <HBars rows={g.top} />
      </section>

    </div>
  )
}

function Stat({ label, value, fmt }: { label: string; value: number; fmt?: (n: number) => string }) {
  return <div className="stat"><b><CountUp to={value} format={fmt} /></b><span>{label}</span></div>
}

function WeekBars({ weeks }: { weeks: { start: number; count: number }[] }) {
  const [sel, setSel] = useState<number | null>(weeks.length - 1)
  const max = Math.max(...weeks.map((w) => w.count), 1)
  const H = 140
  return (
    <div className="wbars" role="img" aria-label={`Sessions per week: ${weeks.map((w) => `week of ${fmtShort(w.start)}, ${w.count}`).join('; ')}`}>
      <div className="wbars-plot" style={{ height: H }}>
        {[0.5, 1].map((f) => <span key={f} className="gridline" style={{ bottom: f * H }}><small>{Math.round(max * f)}</small></span>)}
        {weeks.map((w, i) => (
          <button key={w.start} className={'wbar' + (i === weeks.length - 1 ? ' is-now' : '') + (sel === i ? ' is-sel' : '')} onClick={() => setSel(i)} onMouseEnter={() => setSel(i)} aria-label={`Week of ${fmtShort(w.start)}: ${w.count} sessions`}>
            <m.span className="wbar-fill" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ ...softSpring, delay: 0.1 + i * 0.04 }} style={{ height: Math.max(4, (w.count / max) * H) }} />
            <AnimatePresence>{sel === i && <m.span className="tip" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ bottom: (w.count / max) * H + 8 }}>{w.count}{i === weeks.length - 1 ? ' so far' : ''}</m.span>}</AnimatePresence>
          </button>
        ))}
      </div>
      <div className="wbars-x">{weeks.map((w, i) => <small key={w.start}>{i === weeks.length - 1 ? 'Now' : i % 2 === 0 ? fmtShort(w.start).replace('Sept', 'Sep') : ''}</small>)}</div>
    </div>
  )
}

function Heatmap({ grid, hours }: { grid: number[][]; hours: number[] }) {
  const max = Math.max(...grid.flat(), 1)
  const [tip, setTip] = useState<string | null>(null)
  // sequential: one hue, light → dark
  const shade = (v: number) => {
    const t = v / max
    const a = [234, 238, 249], b = [38, 60, 120]
    return `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * t)).join(',')})`
  }
  return (
    <div className="heat">
      <div className="heat-grid" style={{ gridTemplateColumns: `36px repeat(${hours.length}, 1fr)` }}>
        <span />
        {hours.map((h) => <small key={h} className="heat-h">{hourLabel(h).replace(' ', '')}</small>)}
        {grid.map((row, d) => (
          <div key={d} style={{ display: 'contents' }}>
            <small className="heat-d">{DAYS[d]}</small>
            {row.map((v, h) => (
              <m.button key={h} className="heat-cell" style={{ background: shade(v) }} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 + (d * row.length + h) * 0.008 }}
                aria-label={`${DAYS[d]} ${hourLabel(hours[h])}: ${v} sessions`}
                onMouseEnter={() => setTip(`${DAYS[d]} ${hourLabel(hours[h])}: ${v} sessions in 8 weeks`)} onFocus={() => setTip(`${DAYS[d]} ${hourLabel(hours[h])}: ${v} sessions in 8 weeks`)} onClick={() => setTip(`${DAYS[d]} ${hourLabel(hours[h])}: ${v} sessions in 8 weeks`)} />
            ))}
          </div>
        ))}
      </div>
      <div className="heat-foot">
        <span className="muted small">{tip ?? 'Tap a square for details.'}</span>
        <span className="heat-legend" aria-hidden><small>Fewer</small><i style={{ background: shade(0) }} /><i style={{ background: shade(max / 2) }} /><i style={{ background: shade(max) }} /><small>More</small></span>
      </div>
    </div>
  )
}

function HBars({ rows }: { rows: [string, number][] }) {
  const max = Math.max(...rows.map((r) => r[1]), 1)
  if (!rows.length) return <p className="muted small">No notes yet this month.</p>
  return (
    <ul className="hbars">
      {rows.map(([name, v], i) => (
        <li key={name}>
          <span className="hb-name">{name}</span>
          <span className="hb-track"><m.span className="hb-fill" initial={{ scaleX: 0 }} animate={{ scaleX: v / max }} transition={{ ...softSpring, delay: 0.1 + i * 0.06 }} /></span>
          <span className="hb-v">{v}</span>
        </li>
      ))}
    </ul>
  )
}
