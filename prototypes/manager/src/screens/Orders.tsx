/**
 * @screens MG-04 Orders · MG-10 Shipments
 */
import { AnimatePresence, motion } from 'motion/react'
import { Search, Leaf, ShoppingBag, Layers, RefreshCw, Store } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useStore, isOpen } from '../lib/store'
import { KIND_LABEL, STAGE_LABEL, STAGE_TONE } from '../lib/stages'
import { ago, when, shortName, inr } from '../lib/format'
import type { Order, Stage } from '../lib/types'
import { Chip, Empty, Screen, Segmented, cx, inputCls, spring, useIntent } from '../ui/kit'
import owlSleep from '../assets/owl-sleep.webp'

type Kind = 'all' | Order['kind']
type Pill = 'open' | Stage | 'problems'
const PILLS: { key: Pill; label: string }[] = [
  { key: 'open', label: 'All open' }, { key: 'new', label: 'New' }, { key: 'preparing', label: 'Preparing' },
  { key: 'quality_check', label: 'Check' }, { key: 'packing', label: 'Packing' }, { key: 'ready_to_dispatch', label: 'Ready' },
  { key: 'dispatched', label: 'In transit' }, { key: 'problems', label: 'Problems' }, { key: 'delivered', label: 'Delivered' },
]
const match = (o: Order, p: Pill) => p === 'open' ? isOpen(o.stage) : p === 'problems' ? o.stage === 'failed_delivery' || o.stage === 'rto' : o.stage === p

export const KindIcon = ({ kind, size = 14 }: { kind: Order['kind']; size?: number }) =>
  kind === 'remedy' ? <Leaf size={size} /> : kind === 'store' ? <ShoppingBag size={size} /> : <Layers size={size} />

export function Orders() {
  const orders = useStore((s) => s.orders)
  const clients = useStore((s) => s.clients)
  const go = useStore((s) => s.go)
  const [kind, setKind] = useState<Kind>('all')
  const [pill, setPill] = useState<Pill>('open')
  const [q, setQ] = useState('')
  useIntent('stage:new', () => setPill('new'))
  useIntent('stage:preparing', () => setPill('preparing'))
  useIntent('stage:quality_check', () => setPill('quality_check'))
  useIntent('stage:packing', () => setPill('packing'))
  useIntent('stage:ready_to_dispatch', () => setPill('ready_to_dispatch'))
  useIntent('stage:dispatched', () => setPill('dispatched'))

  const byKind = orders.filter((o) => kind === 'all' || o.kind === kind)
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return byKind
      .filter((o) => match(o, pill))
      .filter((o) => {
        if (!needle) return true
        const c = clients.find((x) => x.id === o.clientId)!
        return [o.code, c.name, c.city, c.phone].some((v) => v.toLowerCase().includes(needle))
      })
      .sort((a, b) => (isOpen(a.stage) ? a.dueAt - b.dueAt : b.paidAt - a.paidAt))
  }, [byKind, pill, q, clients])

  return (
    <Screen title="Orders" sub={`${orders.filter((o) => isOpen(o.stage)).length} open · ${orders.filter((o) => o.stage === 'dispatched').length} on the way`}>
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-3" />
        <input id="order-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order, name, city or phone" className={cx(inputCls, 'h-[52px] rounded-full pl-11 shadow-soft')} aria-label="Search orders" />
      </div>
      <Segmented id="kind" className="mt-3" value={kind} onChange={setKind}
        options={[{ value: 'all', label: 'All' }, { value: 'remedy', label: 'Remedy' }, { value: 'store', label: 'Store' }, { value: 'combined', label: 'Combined' }]} />
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {PILLS.map((p) => {
          const n = byKind.filter((o) => match(o, p.key)).length
          const on = pill === p.key
          return (
            <button key={p.key} onClick={() => setPill(p.key)} aria-pressed={on}
              className={cx('relative flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[14px] font-semibold transition-colors', on ? 'text-[var(--cta-fg)]' : 'bg-surface text-ink shadow-soft')}>
              {on && <motion.span layoutId="stage-pill" transition={spring} className="absolute inset-0 rounded-full bg-[var(--cta-from)]" />}
              <span className="relative">{p.label}</span>
              <span className={cx('relative min-w-5 rounded-full px-1.5 text-[12px] font-bold tnum', on ? 'bg-white/20' : p.key === 'problems' && n ? 'bg-bad-soft text-bad' : 'bg-surface-2 text-ink-2')}>{n}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 space-y-2.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {list.map((o, i) => <OrderCard key={o.id} o={o} i={i} onOpen={() => go({ name: 'order', id: o.id })} />)}
        </AnimatePresence>
        {list.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[28px] bg-surface shadow-soft">
            <Empty img={owlSleep} title={q ? 'No order matches' : 'Nothing here'} body={q ? `No order has "${q}" in its number, name, city or phone.` : 'No orders are at this stage right now.'} />
          </motion.div>
        )}
      </div>
    </Screen>
  )
}

function OrderCard({ o, i, onOpen }: { o: Order; i: number; onOpen: () => void }) {
  const c = useStore((s) => s.clients.find((x) => x.id === o.clientId)!)
  const late = isOpen(o.stage) && o.dueAt < Date.now()
  const tint = o.kind === 'remedy' ? 'from-sage-soft/70' : o.kind === 'store' ? 'from-gold-soft/70' : 'from-accent-soft/70'
  return (
    <motion.button
      layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { ...spring, delay: Math.min(i, 8) * 0.025 } }} exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.985 }} onClick={onOpen}
      className={cx('flex w-full items-center gap-3 rounded-[24px] bg-gradient-to-r to-[var(--surface)] to-60% p-4 text-left shadow-soft', tint, 'bg-surface')}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[17px] font-bold tracking-[-0.01em] text-ink tnum">{o.code}</span>
          {o.replacementOf && <Chip tone="accent" icon={<RefreshCw size={12} />}>Replacement</Chip>}
        </span>
        <span className="mt-0.5 block truncate text-[14.5px] font-medium text-ink">{shortName(c.name)} · {c.city}</span>
        <span className={cx('mt-0.5 block text-[13px]', late ? 'font-semibold text-bad' : 'text-ink-2')}>
          {o.items.length} item{o.items.length > 1 ? 's' : ''} · {isOpen(o.stage) ? `${late ? 'was due' : 'due'} ${when(o.dueAt)}` : o.shipment ? `${o.shipment.courier} · ${ago(o.shipment.events.at(-1)!.at)}` : when(o.paidAt)}
          {o.totalPaise === 0 ? '' : ` · ${inr(o.totalPaise)}`}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1.5">
        <Chip tone="neutral" icon={<KindIcon kind={o.kind} size={13} />}>{KIND_LABEL[o.kind]}</Chip>
        <Chip tone={STAGE_TONE[o.stage]} icon={o.delivery === 'studio_pickup' && isOpen(o.stage) ? <Store size={12} /> : undefined}>{STAGE_LABEL[o.stage]}</Chip>
      </span>
    </motion.button>
  )
}

export function Shipments() {
  const orders = useStore((s) => s.orders)
  const clients = useStore((s) => s.clients)
  const go = useStore((s) => s.go)
  const [tab, setTab] = useState<'transit' | 'delivered' | 'problems'>('transit')
  const shipped = orders.filter((o) => o.shipment)
  const sets = {
    transit: shipped.filter((o) => o.stage === 'dispatched'),
    delivered: shipped.filter((o) => o.stage === 'delivered'),
    problems: shipped.filter((o) => o.stage === 'failed_delivery' || o.stage === 'rto'),
  }
  const lastSync = Math.max(...shipped.flatMap((o) => o.shipment!.events.map((e) => e.at)))
  return (
    <Screen title="Shipments" sub={<span className="inline-flex items-center gap-1.5"><motion.span animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }} className="inline-flex"><RefreshCw size={13} /></motion.span>Synced with Shiprocket · {ago(lastSync)}</span>}>
      <Segmented id="ship" value={tab} onChange={setTab} options={[
        { value: 'transit', label: `In transit ${sets.transit.length}` },
        { value: 'delivered', label: `Delivered ${sets.delivered.length}` },
        { value: 'problems', label: `Problems ${sets.problems.length}` },
      ]} />
      <div className="mt-4 space-y-2.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {sets[tab].map((o, i) => {
            const c = clients.find((x) => x.id === o.clientId)!
            const last = o.shipment!.events.at(-1)!
            return (
              <motion.button key={o.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { ...spring, delay: i * 0.03 } }} exit={{ opacity: 0, transition: { duration: 0.12 } }}
                whileTap={{ scale: 0.985 }} onClick={() => go({ name: 'order', id: o.id })}
                className="flex w-full items-center gap-3 rounded-[24px] bg-surface p-4 text-left shadow-soft">
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-bold text-ink tnum">{o.code} <span className="font-medium text-ink-2">· {shortName(c.name)}, {c.city}</span></span>
                  <span className="mt-0.5 block text-[13px] text-ink-2 tnum">{o.shipment!.courier} · AWB {o.shipment!.awb}</span>
                  <span className={cx('mt-1 block text-[13.5px] font-semibold', tab === 'problems' ? 'text-bad' : 'text-ink')}>{last.label} · {ago(last.at)}</span>
                </span>
                <Chip tone={STAGE_TONE[o.stage]}>{STAGE_LABEL[o.stage]}</Chip>
              </motion.button>
            )
          })}
        </AnimatePresence>
        {sets[tab].length === 0 && <div className="rounded-[28px] bg-surface shadow-soft"><Empty img={owlSleep} title="Nothing here" body={tab === 'problems' ? 'No failed or returned parcels. Problems from Shiprocket appear here first.' : 'No parcels in this list yet.'} /></div>}
      </div>
    </Screen>
  )
}
