/**
 * @screens MG-02 Today · MG-03 Notifications
 */
import { motion } from 'motion/react'
import { Bell, ChevronRight, CalendarDays, Truck, PackageX, Droplet, Undo2, Clock } from 'lucide-react'
import type { ReactNode } from 'react'
import { useStore, isOpen, isLow, available } from '../lib/store'
import { ago, greeting, inr, longDay, time, shortName, dateKey, qty } from '../lib/format'
import type { Stage } from '../lib/types'
import { CountUp, Divided, Empty, IconButton, Row, SectionTitle, Stat, cx, spring, useDesktop } from '../ui/kit'
import owlSleep from '../assets/owl-sleep.webp'

const RAIL: { key: Stage; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'preparing', label: 'Prepare' },
  { key: 'quality_check', label: 'Check' },
  { key: 'packing', label: 'Pack' },
  { key: 'ready_to_dispatch', label: 'Ready' },
  { key: 'dispatched', label: 'Out' },
]

/** The stage rail — every paid order travels it. Tap a stop to see who's waiting there. */
export function StageRail() {
  const orders = useStore((s) => s.orders)
  const setRoot = useStore((s) => s.setRoot)
  const counts = RAIL.map((r) => orders.filter((o) => o.stage === r.key).length)
  const max = Math.max(1, ...counts)
  return (
    <div className="rounded-[28px] bg-surface p-4 pt-5 shadow-soft">
      <div className="relative grid grid-cols-6">
        <div className="absolute top-[22px] right-[8.33%] left-[8.33%] h-[3px] rounded-full bg-surface-2" aria-hidden />
        <motion.div
          aria-hidden className="absolute top-[22px] left-[8.33%] h-[3px] origin-left rounded-full"
          style={{ right: '8.33%', background: 'linear-gradient(90deg, var(--accent), var(--sage))' }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1], delay: 0.1 }}
        />
        {RAIL.map((r, i) => {
          const n = counts[i]
          const heat = n / max
          return (
            <motion.button
              key={r.key} onClick={() => setRoot('orders', 'stage:' + r.key)} whileTap={{ scale: 0.92 }}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.08 + i * 0.05 }}
              className="relative flex flex-col items-center gap-2 rounded-2xl py-0.5" aria-label={`${r.label}: ${n} orders`}
            >
              <span className={cx('relative grid size-11 place-items-center rounded-full text-[17px] font-bold tnum ring-4 ring-[var(--surface)] transition-colors',
                n === 0 ? 'bg-surface-2 text-ink-3' : 'text-[var(--cta-fg)]')}
                style={n ? { background: `color-mix(in oklab, var(--cta-from) ${55 + heat * 45}%, var(--accent))` } : undefined}>
                <CountUp value={n} />
                {n > 0 && r.key !== 'dispatched' && (
                  <motion.span aria-hidden className="absolute inset-0 rounded-full ring-2 ring-[var(--accent)]"
                    animate={{ scale: [1, 1.35], opacity: [0.5, 0] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3 }} />
                )}
              </span>
              <span className="text-[12.5px] font-semibold text-ink-2">{r.label}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

export function Today() {
  const s = useStore()
  const desktop = useDesktop()
  const now = Date.now()
  const open = s.orders.filter((o) => isOpen(o.stage))
  const overdueOrders = open.filter((o) => o.dueAt < now)
  const problems = s.orders.filter((o) => (o.stage === 'failed_delivery' || o.stage === 'rto') && !o.problem?.startsWith('Replacement sent'))
  const low = s.stock.filter((i) => isLow(i))
  const today = dateKey(0)
  const overdueMoney = s.invoices.filter((i) => i.paidPaise < i.totalPaise && i.dueOn < today).reduce((a, i) => a + i.totalPaise - i.paidPaise, 0)
  const sessions = s.appointments.filter((a) => a.status !== 'completed')
  const pickups = s.orders.filter((o) => o.stage === 'ready_to_dispatch' && o.delivery === 'courier')
  const unread = s.notes.filter((n) => !n.read).length

  const attention: { key: string; icon: ReactNode; tone: 'bad' | 'warn' | 'accent' | 'sage'; title: string; sub: string; run: () => void }[] = [
    ...problems.map((o) => ({ key: o.id, icon: o.stage === 'rto' ? <Undo2 size={19} /> : <PackageX size={19} />, tone: 'bad' as const, title: `${o.stage === 'rto' ? 'Parcel returned' : 'Delivery failed'} · ${o.code}`, sub: `${shortName(s.clients.find((c) => c.id === o.clientId)!.name)} · ${o.problem ?? ''}`, run: () => s.go({ name: 'order', id: o.id }) })),
    ...overdueOrders.map((o) => ({ key: 'od' + o.id, icon: <Clock size={19} />, tone: 'warn' as const, title: `${o.code} is past its due time`, sub: `${shortName(s.clients.find((c) => c.id === o.clientId)!.name)} · was due ${time(o.dueAt)}`, run: () => s.go({ name: 'order', id: o.id }) })),
    ...low.slice(0, 3).map((i) => ({ key: i.id, icon: <Droplet size={19} />, tone: 'warn' as const, title: `${i.name.replace(' stock', '')} running low`, sub: `${qty(available(i), i.unit)} left · reorder at ${qty(i.reorderLevel, i.unit)}`, run: () => s.go({ name: 'stockItem', id: i.id }) })),
    ...(pickups.length ? [{ key: 'pickup', icon: <Truck size={19} />, tone: 'accent' as const, title: `${pickups.length} parcel${pickups.length > 1 ? 's' : ''} ready for courier`, sub: 'Create shipments before the 4 PM pickup', run: () => s.setRoot('orders', 'stage:ready_to_dispatch') }] : []),
  ]
  const toneCls = { bad: 'bg-bad-soft text-bad', warn: 'bg-warn-soft text-warn', accent: 'bg-accent-soft text-accent', sage: 'bg-sage-soft text-sage' }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="mx-auto w-full max-w-5xl pb-40 lg:pb-16">
      <header className="flex items-start justify-between gap-3 pt-6 pb-6 lg:pt-10">
        <div>
          <p className="text-[14px] font-semibold text-ink-2">{longDay(now)}</p>
          <h1 className="mt-1 text-[30px] leading-[1.1] font-bold tracking-[-0.025em] lg:text-[36px]">
            <span className="block text-ink">{greeting()}, Haresh.</span>
            <span className="block text-ink-3">{attention.length ? `${attention.length} thing${attention.length > 1 ? 's' : ''} need${attention.length > 1 ? '' : 's'} you today.` : 'Everything is moving.'}</span>
          </h1>
        </div>
        {!desktop && <IconButton label="Notifications" badge={unread > 0} onClick={() => s.setRoot('notifications')}><Bell size={20} /></IconButton>}
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0">
          <StageRail />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="overdue to collect" tone="gold" value={<CountUp value={overdueMoney / 100} format={(n) => '₹' + Math.round(n).toLocaleString('en-IN')} />} onClick={() => s.setRoot('money')} />
            <Stat label={`session${sessions.length === 1 ? '' : 's'} still today`} tone="sage" value={<CountUp value={sessions.length} />} onClick={() => s.setRoot('appointments')} />
          </div>

          <SectionTitle>Needs attention</SectionTitle>
          {attention.length === 0 ? (
            <div className="rounded-[28px] bg-surface shadow-soft"><Empty img={owlSleep} title="All caught up" body="No problems, nothing late and stock is healthy. New paid orders will appear on the rail." /></div>
          ) : (
            <Divided>
              {attention.map((a, i) => (
                <motion.div key={a.key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.15 + i * 0.04 }}>
                  <Row onClick={a.run}>
                    <span className={cx('grid size-10 shrink-0 place-items-center rounded-full', toneCls[a.tone])}>{a.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-ink">{a.title}</span>
                      <span className="block truncate text-[13px] text-ink-2">{a.sub}</span>
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-ink-3" />
                  </Row>
                </motion.div>
              ))}
            </Divided>
          )}
        </div>

        <div className="min-w-0">
          <SectionTitle action={<button onClick={() => s.setRoot('appointments')} className="text-[14px] font-semibold text-accent">Desk</button>}>Sessions today</SectionTitle>
          <Divided>
            {s.appointments.map((a) => {
              const c = s.clients.find((x) => x.id === a.clientId)!
              return (
                <Row key={a.id} onClick={() => s.setRoot('appointments')} className={a.status === 'completed' ? 'opacity-50' : ''}>
                  <span className="w-[68px] shrink-0 text-[14px] font-bold text-ink tnum">{time(a.startsAt)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-ink">{c.name}</span>
                    <span className="block text-[13px] text-ink-2">{a.type} · {a.mode === 'online' ? 'Online' : 'At studio'}</span>
                  </span>
                  {a.status === 'checked_in' ? <span className="text-[12.5px] font-semibold text-ok">Checked in</span> : a.status === 'completed' ? <span className="text-[12.5px] font-semibold text-ink-3">Done</span> : <CalendarDays size={17} className="text-ink-3" />}
                </Row>
              )
            })}
          </Divided>
          <SectionTitle>Money today</SectionTitle>
          <Divided>
            <Row onClick={() => s.setRoot('money')}>
              <span className="min-w-0 flex-1 text-[14.5px] font-semibold text-ink">Due today</span>
              <span className="text-[15px] font-bold text-ink tnum">{inr(s.invoices.filter((i) => i.dueOn === today && i.paidPaise < i.totalPaise).reduce((a, i) => a + i.totalPaise - i.paidPaise, 0))}</span>
            </Row>
            <Row onClick={() => s.setRoot('money')}>
              <span className="min-w-0 flex-1 text-[14.5px] font-semibold text-ink">Bills to pay this week</span>
              <span className="text-[15px] font-bold text-ink tnum">{inr(s.bills.filter((b) => b.status === 'due' && b.dueOn <= dateKey(7)).reduce((a, b) => a + b.amountPaise, 0))}</span>
            </Row>
          </Divided>
        </div>
      </div>
    </motion.div>
  )
}

export function Notifications() {
  const notes = useStore((s) => s.notes)
  const read = useStore((s) => s.readNotes)
  const go = useStore((s) => s.go)
  const tone = { info: 'bg-accent', good: 'bg-ok', bad: 'bg-bad', warn: 'bg-warn' }
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-3xl pb-40">
      <NotificationsHeader onRead={read} />
      <Divided>
        {notes.map((n) => (
          <Row key={n.id} onClick={n.route ? () => go(n.route!) : undefined}>
            <span className={cx('size-2.5 shrink-0 rounded-full', n.read ? 'bg-surface-2' : tone[n.tone])} />
            <span className="min-w-0 flex-1">
              <span className={cx('block text-[15px] text-ink', n.read ? 'font-medium' : 'font-bold')}>{n.title}</span>
              <span className="block text-[13px] text-ink-2">{n.body}</span>
            </span>
            <span className="shrink-0 text-[12px] font-medium text-ink-3">{ago(n.at)}</span>
          </Row>
        ))}
      </Divided>
    </motion.div>
  )
}
function NotificationsHeader({ onRead }: { onRead: () => void }) {
  const setRoot = useStore((s) => s.setRoot)
  const desktop = useDesktop()
  return (
    <header className="flex items-center gap-3 pt-5 pb-5 lg:pt-10">
      {!desktop && <IconButton label="Back" onClick={() => setRoot('today')}><ChevronRight size={20} className="rotate-180" /></IconButton>}
      <h1 className="flex-1 text-[28px] font-bold tracking-[-0.02em] text-ink">Notifications</h1>
      <button onClick={onRead} className="rounded-full px-3 py-2 text-[14px] font-semibold text-accent hover:bg-accent-soft">Mark all read</button>
    </header>
  )
}
