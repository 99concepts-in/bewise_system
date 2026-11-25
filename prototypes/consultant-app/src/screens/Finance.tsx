/**
 * Finance board (owner 2026-11-20, D-33 read-only): today's sales, the month's revenue and profit,
 * which products bring the money. Live: finance.getSalesSummary {from, to}.
 */
import { useMemo, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { Lock, TrendingDown, TrendingUp } from 'lucide-react'
import { useStore } from '../state/store'
import { AppHeader, CountUp, softSpring } from '../ui/kit'
import { financeBoard, type Source } from '../data/finance'
import { fmtMonth, fmtShort, inr } from '../lib/time'

const SOURCE_LABEL: Record<Source, string> = { consultations: 'Consultations', remedies: 'Remedy reorders', shop: 'Shop products' }
const money = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

export default function Finance() {
  const { s, now } = useStore()
  const f = useMemo(() => financeBoard(s.appts, now), [s.appts, now])
  const [by, setBy] = useState<'revenue' | 'profit'>('revenue')
  const delta = f.month.revenue - f.lastMonth.revenue
  const pct = f.lastMonth.revenue ? Math.round((delta / f.lastMonth.revenue) * 100) : 0
  const Trend = delta >= 0 ? TrendingUp : TrendingDown
  const products = [...f.products].filter((p) => p.units > 0).sort((a, b) => b[by] - a[by])
  const maxP = Math.max(1, ...products.map((p) => p[by]))
  const maxDay = Math.max(1, ...f.daily.map((d) => d.revenue))
  const [sel, setSel] = useState(f.daily.length - 1)

  return (
    <div className="screen fin">
      <AppHeader />
      <div className="title-row"><h1 className="page-title">Finance</h1><span className="ro-pill"><Lock size={13} /> Read-only</span></div>

      <m.section className="card fin-today" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={softSpring} aria-label="Today">
        <p className="muted">Today's sales</p>
        <p className="fin-big"><CountUp to={f.today.revenue} format={money} /></p>
        <p className="muted small">{f.today.orders} sales so far, {money(f.today.profit)} profit{f.todayTop.length ? `. Top: ${f.todayTop.map((t) => t.name).join(', ')}` : ''}</p>
      </m.section>

      <div className="g-stats fin-stats">
        <div className="stat"><b><CountUp to={f.month.revenue} format={money} /></b><span>{fmtMonth(now)} revenue</span></div>
        <div className="stat"><b><CountUp to={f.month.profit} format={money} /></b><span>{fmtMonth(now)} profit</span></div>
      </div>
      <p className={'g-delta ' + (delta >= 0 ? 'up' : 'down')}><Trend size={16} />{delta >= 0 ? `${pct}% more` : `${Math.abs(pct)}% less`} than the same days last month</p>

      <section className="card chart-card" aria-label="Where the money comes from">
        <h2>Where the money comes from</h2>
        <ul className="hbars src-bars">
          {f.bySource.map((x, i) => (
            <li key={x.source}><span className="hb-name">{SOURCE_LABEL[x.source]}</span>
              <span className="hb-track"><m.span className="hb-fill" initial={{ scaleX: 0 }} animate={{ scaleX: x.revenue / Math.max(1, ...f.bySource.map((y) => y.revenue)) }} transition={{ ...softSpring, delay: 0.1 + i * 0.06 }} /></span>
              <span className="hb-v money-v">{money(x.revenue)}</span></li>
          ))}
        </ul>
      </section>

      <section className="card chart-card" aria-label="What brings money">
        <div className="title-row"><h2>What brings the money</h2>
          <div className="mini-seg sm" role="tablist">
            <button role="tab" aria-selected={by === 'revenue'} className={by === 'revenue' ? 'on' : ''} onClick={() => setBy('revenue')}>Revenue</button>
            <button role="tab" aria-selected={by === 'profit'} className={by === 'profit' ? 'on' : ''} onClick={() => setBy('profit')}>Profit</button>
          </div>
        </div>
        <p className="muted small">This month, by product.</p>
        <ul className="prod-list">
          {products.map((p, i) => (
            <li key={p.key}>
              <div className="pl-top"><b>{p.name}</b><span className="money-v">{money(p[by])}</span></div>
              <div className="pl-bar"><m.span initial={{ scaleX: 0 }} animate={{ scaleX: p[by] / maxP }} transition={{ ...softSpring, delay: 0.05 + i * 0.04 }} className={p.source} /></div>
              <small className="muted">{p.units} sold{p.price ? `, ${inr(p.price)} each` : ''}{by === 'revenue' ? `, profit ${money(p.profit)}` : `, revenue ${money(p.revenue)}`}</small>
            </li>
          ))}
        </ul>
      </section>

      <section className="card chart-card" aria-label="Daily sales">
        <h2>Daily sales</h2>
        <p className="muted small">Last 14 days. Tap a bar.</p>
        <div className="dbars" role="group" aria-label="Daily sales, last 14 days">
          {f.daily.map((d, i) => (
            <button key={d.day} className={'dbar' + (i === sel ? ' is-sel' : '') + (i === f.daily.length - 1 ? ' is-today' : '')} onClick={() => setSel(i)} onMouseEnter={() => setSel(i)} aria-label={`${fmtShort(d.day)}: ${money(d.revenue)}`}>
              <m.span className="dbar-fill" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ ...softSpring, delay: 0.05 + i * 0.03 }} style={{ height: `${Math.max(3, (d.revenue / maxDay) * 100)}%` }} />
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <m.p key={sel} className="dbar-tip" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <b>{sel === f.daily.length - 1 ? 'Today' : fmtShort(f.daily[sel].day)}</b> {money(f.daily[sel].revenue)}
          </m.p>
        </AnimatePresence>
      </section>
      <p className="muted small fin-foot">From BeWise accounts. Prices and costs are placeholders until the product list is final. Profit = sales minus product and remedy cost.</p>
    </div>
  )
}
