/**
 * @screens MG-17 Stock · MG-18 Stock item (movements, adjust with reason, reorder)
 * Ledger rules: docs/specs/manager/03-STOCK-MOVEMENTS-AND-VALUATION.md — moving weighted average, adjustments need a reason.
 */
import { AnimatePresence, motion } from 'motion/react'
import { Search, Minus, Plus, ShoppingCart, FlaskConical, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useStore, available, isLow } from '../lib/store'
import { day, inr, qty } from '../lib/format'
import type { MovementType, StockItem, StockKind } from '../lib/types'
import { Button, Chip, Choices, Divided, Empty, Field, FlowBar, Row, Screen, SectionTitle, Segmented, Sheet, Surface, CountUp, cx, inputCls, spring } from '../ui/kit'

const MV_LABEL: Record<MovementType, string> = {
  purchase_receipt: 'Received', production_consume: 'Used in batch', production_output: 'Made in batch', sale: 'Dispatched',
  remedy_prep_consume: 'Remedy prep', adjustment: 'Adjustment', return: 'Returned', wastage: 'Wastage',
}

function Level({ i }: { i: StockItem }) {
  const pct = Math.min(1, available(i) / Math.max(1, i.reorderLevel * 3))
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
      <motion.span className={cx('block h-full origin-left rounded-full', isLow(i) ? 'bg-warn' : 'bg-sage')} initial={{ scaleX: 0 }} animate={{ scaleX: pct }} transition={{ type: 'spring', stiffness: 160, damping: 26 }} />
    </span>
  )
}

export function Stock() {
  const s = useStore()
  const [kind, setKind] = useState<StockKind>('finished_good')
  const [q, setQ] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const items = s.stock.filter((i) => i.kind === kind && i.name.toLowerCase().includes(q.toLowerCase()) && (!lowOnly || isLow(i)))
  const lowCount = s.stock.filter((i) => isLow(i)).length
  const value = s.stock.reduce((a, i) => a + i.qty * i.avgCostPaise, 0) / 100
  const groups = Array.from(new Set(items.map((i) => i.group)))
  return (
    <Screen title="Stock" sub={<span>Worth <CountUp value={value} format={(n) => '₹' + Math.round(n).toLocaleString('en-IN')} /> at average cost</span>}>
      <Segmented id="sk" value={kind} onChange={setKind} options={[{ value: 'finished_good', label: 'Finished' }, { value: 'raw_material', label: 'Raw' }, { value: 'packaging', label: 'Packaging' }]} />
      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-3" />
          <input id="stock-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search stock" className={cx(inputCls, 'rounded-full pl-11 shadow-soft')} aria-label="Search stock" />
        </div>
        <button onClick={() => setLowOnly(!lowOnly)} aria-pressed={lowOnly} className={cx('h-12 shrink-0 rounded-full px-4 text-[14px] font-semibold transition-colors', lowOnly ? 'bg-warn text-white' : 'bg-warn-soft text-warn')}>{lowCount} low</button>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={kind + lowOnly} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {groups.map((g) => (
            <div key={g}>
              <SectionTitle>{g}</SectionTitle>
              <Divided>
                {items.filter((i) => i.group === g).map((i) => (
                  <Row key={i.id} onClick={() => s.go({ name: 'stockItem', id: i.id })}>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2"><span className="truncate text-[15px] font-semibold text-ink">{i.name}</span>{isLow(i) && <Chip tone="warn">Low</Chip>}</span>
                      <span className="mt-1.5 block max-w-56"><Level i={i} /></span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[16px] font-bold text-ink tnum">{qty(available(i), i.unit)}</span>
                      {i.reserved > 0 ? <span className="block text-[12px] text-ink-2 tnum">{i.reserved} reserved</span> : <span className="block text-[12px] text-ink-3">{i.code}</span>}
                    </span>
                  </Row>
                ))}
              </Divided>
            </div>
          ))}
          {items.length === 0 && <Surface className="mt-4"><Empty title="Nothing here" body={lowOnly ? 'Nothing is running low in this list.' : 'No stock item matches.'} /></Surface>}
        </motion.div>
      </AnimatePresence>
    </Screen>
  )
}

const REASONS = ['Count correction', 'Found extra', 'Spilled', 'Damaged', 'Expired', 'Sample or gift']
export function StockItemScreen({ id }: { id: string }) {
  const s = useStore()
  const i = s.stock.find((x) => x.id === id)
  const [adj, setAdj] = useState(false)
  if (!i) return <Screen title="Stock item"><Empty title="Not found" body="This stock item doesn't exist." /></Screen>
  const product = s.products.find((p) => p.variants.some((v) => v.stockId === i.id))
  const kindLabel = { finished_good: 'Finished good', raw_material: 'Raw material', packaging: 'Packaging' }[i.kind]
  return (
    <Screen title={i.name} sub={`${kindLabel} · ${i.code}`}>
      <Surface className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[44px] leading-none font-bold tracking-[-0.03em] text-ink"><CountUp value={available(i)} format={(n) => (Math.round(n * 10) / 10).toLocaleString('en-IN')} /> <span className="text-[22px] font-semibold text-ink-2">{i.unit}</span></div>
          <div className="mt-2 text-[14px] text-ink-2">available · reorder at {qty(i.reorderLevel, i.unit)}{i.reserved ? ` · ${i.reserved} reserved for paid orders` : ''}</div>
        </div>
        {isLow(i) ? <Chip tone="warn">Low</Chip> : <Chip tone="ok">Healthy</Chip>}
      </Surface>
      <div className="mt-3 grid grid-cols-3 gap-2.5">
        <Surface className="!p-4"><div className="text-[12.5px] font-semibold text-ink-2">Value</div><div className="mt-1 text-[16px] font-bold text-ink tnum">{inr(Math.round(i.qty * i.avgCostPaise))}</div></Surface>
        <Surface className="!p-4"><div className="text-[12.5px] font-semibold text-ink-2">Avg cost</div><div className="mt-1 text-[16px] font-bold text-ink tnum">{inr(i.avgCostPaise, { decimals: i.avgCostPaise < 1000 })}/{i.unit}</div></Surface>
        <Surface className="!p-4"><div className="text-[12.5px] font-semibold text-ink-2">Use by</div><div className="mt-1 text-[16px] font-bold text-ink">{i.expiresOn ? day(i.expiresOn) : '—'}</div></Surface>
      </div>
      <SectionTitle>Recent movements</SectionTitle>
      <Divided>
        <AnimatePresence initial={false}>
          {i.movements.slice(0, 12).map((m) => (
            <motion.div key={m.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={spring}>
              <div className="flex items-center gap-3 px-4 py-3">
                <span className={cx('w-[86px] shrink-0 text-[15px] font-bold tnum', m.qty > 0 ? 'text-ok' : 'text-ink')}>{m.qty > 0 ? '+' : '−'}{qty(Math.abs(m.qty), i.unit)}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[14.5px] font-semibold text-ink">{MV_LABEL[m.type]}{m.note ? ` · ${m.note}` : ''}</span><span className="block text-[12.5px] text-ink-2 tnum">{m.ref}</span></span>
                <span className="shrink-0 text-[12.5px] text-ink-3">{day(m.at)}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </Divided>
      <FlowBar
        label={i.kind === 'finished_good' ? 'Plan a new batch' : 'Order more'}
        icon={i.kind === 'finished_good' ? <FlaskConical size={19} /> : <ShoppingCart size={19} />}
        onAction={() => {
          if (i.kind === 'finished_good' && product) { const v = product.variants.find((x) => x.stockId === i.id)!; const b = s.newBatch(product.id, v.id, i.reorderQty * 2); s.toast('Batch requested'); s.go({ name: 'batch', id: b }) }
          else { const po = s.createPO(i.id); s.toast(`Purchase order for ${qty(i.reorderQty, i.unit)} sent`); s.go({ name: 'po', id: po }) }
        }}
        secondary={<Button onClick={() => setAdj(true)} className="h-[58px] shrink-0" icon={<SlidersHorizontal size={17} />}>Adjust</Button>}
      />
      <AdjustSheet i={i} open={adj} onClose={() => setAdj(false)} />
    </Screen>
  )
}

function AdjustSheet({ i, open, onClose }: { i: StockItem; open: boolean; onClose: () => void }) {
  const s = useStore()
  const step = i.unit === 'pcs' ? 1 : i.unit === 'ml' && i.qty < 50 ? 0.5 : 10
  const [delta, setDelta] = useState(-step)
  const [reason, setReason] = useState<string>()
  const value = Math.round(Math.abs(delta) * i.avgCostPaise)
  const needsApproval = delta < 0 && value > 200000
  const after = +(i.qty + delta).toFixed(3)
  return (
    <Sheet open={open} onClose={onClose} title={`Adjust ${i.name}`}
      footer={<FlowBarInline disabled={!reason || delta === 0 || after < 0} label={needsApproval ? 'Hold to send for approval' : `Hold to ${delta > 0 ? 'add' : 'remove'} ${qty(Math.abs(delta), i.unit)}`}
        onDone={() => { s.adjustStock(i.id, delta, reason!, reason === 'Spilled' || reason === 'Damaged' || reason === 'Expired' ? 'wastage' : 'adjustment'); s.toast(needsApproval ? 'Sent to owner for approval' : 'Stock adjusted'); onClose() }} />}>
      <div className="space-y-5">
        <div className="flex items-center justify-center gap-5">
          <motion.button whileTap={{ scale: 0.88 }} aria-label="Less" onClick={() => setDelta((d) => +(d - step).toFixed(3))} className="grid size-14 place-items-center rounded-full bg-surface text-ink shadow-soft"><Minus size={22} /></motion.button>
          <div className="w-40 text-center">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div key={delta} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={spring}
                className={cx('text-[38px] font-bold tracking-[-0.02em] tnum', delta > 0 ? 'text-ok' : delta < 0 ? 'text-bad' : 'text-ink')}>{delta > 0 ? '+' : delta < 0 ? '−' : ''}{Math.abs(delta)}</motion.div>
            </AnimatePresence>
            <div className="text-[13px] text-ink-2">{i.unit} · leaves {qty(Math.max(0, after), i.unit)}</div>
          </div>
          <motion.button whileTap={{ scale: 0.88 }} aria-label="More" onClick={() => setDelta((d) => +(d + step).toFixed(3))} className="grid size-14 place-items-center rounded-full bg-surface text-ink shadow-soft"><Plus size={22} /></motion.button>
        </div>
        <Field label="Exact change"><input id="adj-exact" inputMode="decimal" className={cx(inputCls, 'text-center tnum')} value={delta} onChange={(e) => setDelta(Number(e.target.value.replace(/[^\d.-]/g, '')) || 0)} /></Field>
        <div><span className="mb-2 block text-[13px] font-semibold text-ink-2">Reason (required)</span><Choices id={'adj-r-' + i.id} value={reason} onChange={setReason} options={REASONS.map((r) => ({ value: r, label: r }))} /></div>
        <p className="text-[12.5px] text-ink-2">Value {inr(value)}{needsApproval ? ' — write-offs over ₹2,000 wait for the owner.' : ''}. Every adjustment is logged with your name.</p>
      </div>
    </Sheet>
  )
}

/** hold-to-confirm inside a sheet footer */
function FlowBarInline({ label, onDone, disabled }: { label: string; onDone: () => void; disabled?: boolean }) {
  return <FlowBar inline hold label={label} onAction={onDone} disabled={disabled} />
}
