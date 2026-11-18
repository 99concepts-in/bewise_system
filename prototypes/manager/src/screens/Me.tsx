/**
 * @screens MG-27 Me hub · MG-28 Reports (incl. sales & profit, D-33)
 */
import { motion } from 'motion/react'
import { CalendarDays, Users, Sparkles, Boxes, FlaskConical, ShoppingCart, BarChart3, Truck, Bell, RotateCcw, Moon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useStore, isLow } from '../lib/store'
import { inr } from '../lib/format'
import type { RouteName } from '../lib/types'
import { Button, CountUp, Screen, SectionTitle, Sheet, Stat, Surface, Segmented, cx, spring } from '../ui/kit'

export function Me() {
  const s = useStore()
  const [reset, setReset] = useState(false)
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>(() => (document.documentElement.dataset.theme as 'light' | 'dark') ?? 'system')
  const tiles: { name: RouteName; label: string; sub: string; icon: ReactNode; tone: string }[] = [
    { name: 'appointments', label: 'Appointments', sub: `${s.appointments.filter((a) => a.status !== 'completed').length} still today`, icon: <CalendarDays size={21} />, tone: 'bg-sage-soft text-sage' },
    { name: 'shipments', label: 'Shipments', sub: `${s.orders.filter((o) => o.stage === 'dispatched').length} on the way`, icon: <Truck size={21} />, tone: 'bg-accent-soft text-accent' },
    { name: 'clients', label: 'Clients', sub: `${s.clients.length} people`, icon: <Users size={21} />, tone: 'bg-accent-soft text-accent' },
    { name: 'products', label: 'Products', sub: `${s.products.filter((p) => p.status === 'active').length} in the shop`, icon: <Sparkles size={21} />, tone: 'bg-gold-soft text-gold' },
    { name: 'stock', label: 'Stock', sub: `${s.stock.filter(isLow).length} running low`, icon: <Boxes size={21} />, tone: 'bg-warn-soft text-warn' },
    { name: 'production', label: 'Production', sub: `${s.batches.filter((b) => b.step < 5).length} batches open`, icon: <FlaskConical size={21} />, tone: 'bg-sage-soft text-sage' },
    { name: 'purchases', label: 'Purchases', sub: `${s.pos.filter((p) => p.status !== 'received').length} waiting`, icon: <ShoppingCart size={21} />, tone: 'bg-gold-soft text-gold' },
    { name: 'reports', label: 'Reports', sub: 'Sales, profit, couriers', icon: <BarChart3 size={21} />, tone: 'bg-accent-soft text-accent' },
  ]
  const applyTheme = (t: typeof theme) => {
    setTheme(t)
    if (t === 'system') delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = t
    try { localStorage.setItem('bewise-ops-theme', t) } catch { /* storage blocked */ }
  }
  return (
    <Screen back={false} title={<><span className="block">Haresh Moorjani</span><span className="block text-ink-3">Office manager</span></>}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t, i) => (
          <motion.button key={t.name} onClick={() => s.setRoot(t.name)} whileTap={{ scale: 0.96 }}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.03 }}
            className="flex flex-col items-start gap-4 rounded-[26px] bg-surface p-4 text-left shadow-soft">
            <span className={cx('grid size-11 place-items-center rounded-full', t.tone)}>{t.icon}</span>
            <span><span className="block text-[16px] font-bold text-ink">{t.label}</span><span className="block text-[13px] text-ink-2">{t.sub}</span></span>
          </motion.button>
        ))}
      </div>
      <SectionTitle>Settings</SectionTitle>
      <Surface className="space-y-4">
        <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-[15px] font-semibold text-ink"><Moon size={18} /> Appearance</span></div>
        <Segmented id="theme" value={theme} onChange={applyTheme} options={[{ value: 'system', label: 'Auto' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
        <div className="flex gap-3 border-t border-[var(--line)] pt-4">
          <Button className="flex-1" icon={<Bell size={17} />} onClick={() => s.setRoot('notifications')}>Notifications</Button>
          <Button className="flex-1" icon={<RotateCcw size={17} />} onClick={() => setReset(true)}>Reset demo</Button>
        </div>
      </Surface>
      <p className="mt-4 px-2 text-[12.5px] text-ink-2">Prototype with sample data. Shiprocket, WhatsApp and payments are simulated until the real accounts are connected.</p>
      <Sheet open={reset} onClose={() => setReset(false)} title="Reset demo data?"
        footer={<Button kind="danger" full onClick={() => { s.reset(); setReset(false) }}>Reset everything</Button>}>
        <p className="text-[15px] text-ink-2">Orders, stock, money and products go back to the starting sample. This only affects this browser.</p>
      </Sheet>
    </Screen>
  )
}

/* ───────── Reports ───────── */
const WEEKS = [
  { w: '29 Sep', sales: 3860000, profit: 1430000 }, { w: '6 Oct', sales: 4120000, profit: 1560000 }, { w: '13 Oct', sales: 3690000, profit: 1310000 },
  { w: '20 Oct', sales: 5240000, profit: 2080000 }, { w: '27 Oct', sales: 4810000, profit: 1860000 }, { w: '3 Nov', sales: 5530000, profit: 2210000 },
  { w: '10 Nov', sales: 6020000, profit: 2390000 }, { w: '17 Nov', sales: 4470000, profit: 1720000 },
]
const COURIERS = [{ name: 'Blue Dart Air', pct: 97 }, { name: 'Delhivery Surface', pct: 93 }, { name: 'DTDC', pct: 88 }, { name: 'Xpressbees', pct: 86 }, { name: 'Ekart', pct: 81 }]

export function Reports() {
  const s = useStore()
  const [metric, setMetric] = useState<'sales' | 'profit'>('sales')
  const [hover, setHover] = useState<number | null>(null)
  const stockValue = s.stock.reduce((a, i) => a + i.qty * i.avgCostPaise, 0)
  const prepHours = (() => {
    const d = s.orders.flatMap((o) => { const a = o.history.find((h) => h.stage === 'preparing'); const b = o.history.find((h) => h.stage === 'quality_check'); return a && b ? [(b.at - a.at) / 3600e3] : [] })
    return d.length ? d.reduce((x, y) => x + y, 0) / d.length : 3.2
  })()
  const vals = WEEKS.map((w) => w[metric])
  const max = Math.ceil(Math.max(...vals) / 2000000) * 2000000
  const H = 180, W = 560, padL = 44, padB = 26, bw = (W - padL) / WEEKS.length
  const ticks = [0, max / 2, max]
  const month = WEEKS.slice(-3).reduce((a, w) => a + w.sales, 0)
  const monthProfit = WEEKS.slice(-3).reduce((a, w) => a + w.profit, 0)
  return (
    <Screen title="Reports" sub="Sample figures until live orders flow in">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="sales this month" tone="accent" value={<CountUp value={month / 100} format={(n) => '₹' + (n / 100000).toFixed(2) + 'L'} />} />
        <Stat label={`profit · ${Math.round((monthProfit / month) * 100)}% margin`} tone="sage" value={<CountUp value={monthProfit / 100} format={(n) => '₹' + (n / 100000).toFixed(2) + 'L'} />} />
        <Stat label="stock value now" tone="gold" value={<CountUp value={stockValue / 100} format={(n) => '₹' + Math.round(n).toLocaleString('en-IN')} />} />
        <Stat label="avg prep time" value={<CountUp value={prepHours} format={(n) => n.toFixed(1) + ' h'} />} />
      </div>

      <SectionTitle action={<Segmented id="metric" className="w-44" value={metric} onChange={setMetric} options={[{ value: 'sales', label: 'Sales' }, { value: 'profit', label: 'Profit' }]} />}>By week</SectionTitle>
      <Surface>
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H + padB}`} className="w-full" role="img" aria-label={`Weekly ${metric}, last 8 weeks`}>
            {ticks.map((t) => {
              const y = H - (t / max) * (H - 10)
              return <g key={t}><line x1={padL} x2={W} y1={y} y2={y} stroke="var(--line)" strokeWidth={1} /><text x={padL - 8} y={y + 4} textAnchor="end" fontSize="11" fill="var(--ink-2)">{t === 0 ? '0' : `₹${t / 10000000}L`}</text></g>
            })}
            {WEEKS.map((w, i) => {
              const v = w[metric]
              const h = (v / max) * (H - 10)
              const x = padL + i * bw + bw * 0.22
              const last = i === WEEKS.length - 1
              return (
                <g key={w.w} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} onClick={() => setHover(i)}>
                  <rect x={padL + i * bw} y={0} width={bw} height={H + padB} fill="transparent" />
                  <motion.rect x={x} width={bw * 0.56} rx={4} fill={hover === i ? 'var(--cta-from)' : last ? 'var(--accent)' : metric === 'sales' ? 'var(--accent)' : 'var(--sage)'}
                    fillOpacity={hover === null || hover === i ? 1 : 0.45}
                    initial={{ height: 0, y: H }} animate={{ height: h, y: H - h }} transition={{ type: 'spring', stiffness: 200, damping: 26, delay: i * 0.035 }} />
                  <text x={x + bw * 0.28} y={H + 18} textAnchor="middle" fontSize="11" fill="var(--ink-2)">{w.w}</text>
                </g>
              )
            })}
          </svg>
          {hover !== null && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="pointer-events-none absolute top-0 rounded-2xl bg-[var(--nav)] px-3 py-2 text-[12.5px] text-[var(--nav-active)] shadow-lift"
              style={{ left: `${Math.min(70, ((padL + hover * bw) / W) * 100)}%` }}>
              <div className="font-semibold">Week of {WEEKS[hover].w}</div>
              <div className="tnum">Sales {inr(WEEKS[hover].sales)} · Profit {inr(WEEKS[hover].profit)}</div>
            </motion.div>
          )}
        </div>
      </Surface>

      <SectionTitle>Courier on-time delivery</SectionTitle>
      <Surface className="space-y-3">
        {COURIERS.map((c, i) => (
          <div key={c.name} className="grid grid-cols-[130px_1fr_44px] items-center gap-3">
            <span className="truncate text-[14px] font-semibold text-ink">{c.name}</span>
            <span className="h-2.5 overflow-hidden rounded-full bg-surface-2">
              <motion.span className="block h-full origin-left rounded-full bg-[var(--accent)]" initial={{ scaleX: 0 }} animate={{ scaleX: c.pct / 100 }} transition={{ type: 'spring', stiffness: 140, damping: 24, delay: i * 0.05 }} />
            </span>
            <span className="text-right text-[14px] font-bold text-ink tnum">{c.pct}%</span>
          </div>
        ))}
      </Surface>
    </Screen>
  )
}
