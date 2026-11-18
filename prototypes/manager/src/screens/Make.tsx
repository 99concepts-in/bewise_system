/**
 * @screens MG-19 Production · MG-20 Batch detail · MG-21 Purchases · MG-22 Receive goods
 */
import { AnimatePresence, motion } from 'motion/react'
import { Plus, Check, Lock, Minus, PackageCheck, FlaskConical } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../lib/store'
import { BATCH_STEPS } from '../lib/types'
import { day, dueLabel, inr, qty } from '../lib/format'
import { Button, Chip, Choices, Divided, Empty, Field, FlowBar, PhotoInput, Row, Screen, SectionTitle, Segmented, Sheet, Surface, cx, inputCls, soft, spring, useIntent } from '../ui/kit'

const bucket = (step: number) => (step === 0 ? 'planned' : step <= 2 ? 'progress' : step <= 4 ? 'qc' : 'done')
const STEP_ACTION = ['Allocate materials', 'Start production', 'Record QC pass', 'Bottled and labelled', 'Receive into stock']

export function Production() {
  const s = useStore()
  const [tab, setTab] = useState<'planned' | 'progress' | 'qc' | 'done'>('progress')
  const [open, setOpen] = useState(false)
  useIntent('new', () => setOpen(true))
  const list = s.batches.filter((b) => bucket(b.step) === tab)
  const count = (t: string) => s.batches.filter((b) => bucket(b.step) === t).length
  return (
    <Screen title="Production" sub="Oils, sprays and salts made at the studio"
      actions={<Button kind="primary" className="h-11" icon={<Plus size={18} />} onClick={() => setOpen(true)}>Batch</Button>}>
      <Segmented id="prod" value={tab} onChange={setTab} options={[
        { value: 'planned', label: `Planned ${count('planned')}` }, { value: 'progress', label: `Making ${count('progress')}` },
        { value: 'qc', label: `QC ${count('qc')}` }, { value: 'done', label: `Done ${count('done')}` },
      ]} />
      <div className="mt-4 space-y-2.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {list.map((b, i) => {
            const p = s.products.find((x) => x.id === b.productId)!
            const v = p.variants.find((x) => x.id === b.variantId)!
            return (
              <motion.button key={b.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { ...spring, delay: i * 0.03 } }} exit={{ opacity: 0 }} whileTap={{ scale: 0.985 }}
                onClick={() => s.go({ name: 'batch', id: b.id })} className="flex w-full items-center gap-3 rounded-[24px] bg-surface p-4 text-left shadow-soft">
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-bold text-ink tnum">{b.code}</span>
                  <span className="block text-[14px] text-ink">{p.name} {v.label}</span>
                  <span className="block text-[13px] text-ink-2 tnum">{b.units} units</span>
                </span>
                <span className="flex flex-col items-end gap-2">
                  <Chip tone={b.step === 5 ? 'ok' : b.step >= 3 ? 'accent' : 'gold'}>{BATCH_STEPS[b.step]}</Chip>
                  <span className="flex gap-1">{BATCH_STEPS.map((_, k) => <span key={k} className={cx('h-1.5 w-4 rounded-full', k <= b.step ? 'bg-sage' : 'bg-surface-2')} />)}</span>
                </span>
              </motion.button>
            )
          })}
        </AnimatePresence>
        {list.length === 0 && <Surface><Empty title="No batches here" body="Plan a batch when finished stock runs low." /></Surface>}
      </div>
      <NewBatchSheet open={open} onClose={() => setOpen(false)} />
    </Screen>
  )
}

function NewBatchSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useStore()
  const opts = s.products.flatMap((p) => p.variants.map((v) => ({ value: p.id + '|' + v.id, label: `${p.name} ${v.label}` })))
  const [pick, setPick] = useState(opts[0]?.value)
  const [units, setUnits] = useState('100')
  return (
    <Sheet open={open} onClose={onClose} title="New batch"
      footer={<Button kind="primary" full disabled={!pick || !(Number(units) > 0)} onClick={() => { const [pid, vid] = pick!.split('|'); const id = s.newBatch(pid, vid, Number(units)); s.toast('Batch planned'); onClose(); s.go({ name: 'batch', id }) }}>Plan batch</Button>}>
      <div className="space-y-4">
        <div><span className="mb-2 block text-[13px] font-semibold text-ink-2">Product</span><Choices id="nb-p" value={pick} onChange={setPick} options={opts} /></div>
        <Field label="Units to make"><input id="nb-u" inputMode="numeric" className={cx(inputCls, 'tnum')} value={units} onChange={(e) => setUnits(e.target.value.replace(/\D/g, ''))} /></Field>
      </div>
    </Sheet>
  )
}

export function BatchDetail({ id }: { id: string }) {
  const s = useStore()
  const b = s.batches.find((x) => x.id === id)
  if (!b) return <Screen title="Batch"><Empty title="Batch not found" body="It may have been removed." /></Screen>
  const p = s.products.find((x) => x.id === b.productId)!
  const v = p.variants.find((x) => x.id === b.variantId)!
  const short = b.step === 0 ? b.materials.filter((m) => (s.stock.find((x) => x.id === m.stockId)?.qty ?? 0) < m.qty) : []
  return (
    <Screen title={<span className="tnum">{b.code}</span>} sub={`${p.name} ${v.label} · ${b.units} units`}>
      <Surface pad={false} className="p-3">
        <ol className="relative">
          <span className="absolute top-6 bottom-6 left-[27px] w-[2px] bg-surface-2" aria-hidden />
          <motion.span className="absolute top-6 left-[27px] w-[2px] origin-top bg-sage" aria-hidden initial={false} animate={{ height: `calc(${(b.step / 5) * 100}% - ${(b.step / 5) * 48}px)` }} transition={soft} />
          {BATCH_STEPS.map((t, k) => {
            const done = k < b.step || b.step === 5
            const now = k === b.step && b.step < 5
            return (
              <li key={t} className={cx('relative flex items-center gap-3 rounded-2xl px-2 py-3', now && 'bg-accent-soft/60')}>
                <motion.span initial={false} animate={{ backgroundColor: done ? 'var(--sage)' : now ? 'var(--cta-from)' : 'var(--surface)', scale: now ? 1.08 : 1 }} transition={spring}
                  className={cx('relative z-10 grid size-8 place-items-center rounded-full', !done && !now && 'ring-2 ring-[var(--line)]')}>
                  {done ? <Check size={15} strokeWidth={3} className="text-white" /> : now ? <span className="size-2.5 rounded-full bg-white" /> : null}
                </motion.span>
                <span className={cx('text-[15.5px] font-semibold', done || now ? 'text-ink' : 'text-ink-3')}>{t}</span>
              </li>
            )
          })}
        </ol>
      </Surface>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <Surface className="!p-4"><div className="text-[12.5px] font-semibold text-ink-2">Made on</div><div className="mt-1 text-[17px] font-bold text-ink">{b.mfg ? day(b.mfg) : '—'}</div></Surface>
        <Surface className="!p-4"><div className="text-[12.5px] font-semibold text-ink-2">Use by</div><div className="mt-1 text-[17px] font-bold text-ink">{b.expiry ? day(b.expiry) : '—'}</div></Surface>
        <Surface className="!p-4"><div className="text-[12.5px] font-semibold text-ink-2">Cost so far</div><div className="mt-1 text-[17px] font-bold text-ink tnum">{inr(b.costPaise)}</div>{b.costPaise > 0 && <div className="text-[12px] text-ink-2 tnum">{inr(Math.round(b.costPaise / b.units))} a unit</div>}</Surface>
        <Surface className="!p-4"><div className="text-[12.5px] font-semibold text-ink-2">Wastage</div><div className="mt-1 text-[17px] font-bold text-ink tnum">{b.wastagePct != null ? `${b.wastagePct}%` : '—'}</div></Surface>
      </div>
      {b.materials.length > 0 && (
        <>
          <SectionTitle>Materials</SectionTitle>
          <Divided>
            {b.materials.map((m) => {
              const it = s.stock.find((x) => x.id === m.stockId)!
              const lacking = b.step === 0 && it.qty < m.qty
              return (
                <div key={m.stockId} className="flex items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1 text-[14.5px] font-semibold text-ink">{it.name}</span>
                  <span className="text-[14.5px] font-bold text-ink tnum">{qty(m.qty, it.unit)}</span>
                  {b.step === 0 && <Chip tone={lacking ? 'bad' : 'ok'}>{lacking ? `only ${qty(it.qty, it.unit)}` : 'in stock'}</Chip>}
                </div>
              )
            })}
          </Divided>
          <p className="mt-3 flex items-center gap-2 px-2 text-[12.5px] text-ink-2"><Lock size={13} /> Formula quantities are confidential — visible to production only.</p>
        </>
      )}
      {b.step < 5 && (
        <FlowBar label={STEP_ACTION[b.step]} icon={<FlaskConical size={19} />} disabled={short.length > 0} hint={short.length ? 'Not enough materials — receive goods first' : undefined}
          onAction={() => { s.advanceBatch(b.id); s.toast(b.step === 4 ? `${b.units} units added to stock` : `${BATCH_STEPS[b.step + 1]} ✓`) }} />
      )}
    </Screen>
  )
}

export function Purchases() {
  const s = useStore()
  const [tab, setTab] = useState<'open' | 'received' | 'suppliers'>('open')
  const pos = s.pos.filter((p) => (tab === 'open' ? p.status !== 'received' : p.status === 'received'))
  return (
    <Screen title="Purchases" sub={`${s.pos.filter((p) => p.status !== 'received').length} orders waiting for goods`}>
      <Segmented id="pur" value={tab} onChange={setTab} options={[{ value: 'open', label: 'Open' }, { value: 'received', label: 'Received' }, { value: 'suppliers', label: 'Suppliers' }]} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="mt-4">
          {tab === 'suppliers' ? (
            <Divided>{s.suppliers.map((x) => (
              <div key={x.id} className="flex items-center gap-3 px-4 py-3.5">
                <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold text-ink">{x.name}</span><span className="block text-[13px] text-ink-2 tnum select-all">{x.city} · {x.phone}</span></span>
                <Chip>{s.pos.filter((p) => p.supplierId === x.id).length} POs</Chip>
              </div>
            ))}</Divided>
          ) : pos.length === 0 ? <Surface><Empty title="Nothing here" body="Purchase orders appear when you order more from a stock item." /></Surface> : (
            <Divided>{pos.map((p) => {
              const sup = s.suppliers.find((x) => x.id === p.supplierId)!
              const total = p.lines.reduce((a, l) => a + l.ordered * l.pricePaise, 0)
              return (
                <Row key={p.id} onClick={() => s.go({ name: 'po', id: p.id })}>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-ink tnum">{p.code}</span>
                    <span className="block truncate text-[13px] text-ink-2">{sup.name} · {p.lines.length} item{p.lines.length > 1 ? 's' : ''} · {inr(Math.round(total))}</span>
                  </span>
                  <Chip tone={p.status === 'received' ? 'ok' : p.status === 'partial' ? 'gold' : p.expectedOn < new Date().toISOString().slice(0, 10) ? 'bad' : 'accent'}>
                    {p.status === 'received' ? 'Received' : p.status === 'partial' ? 'Part received' : `Expected · ${dueLabel(p.expectedOn).replace('due ', '')}`}
                  </Chip>
                </Row>
              )
            })}</Divided>
          )}
        </motion.div>
      </AnimatePresence>
    </Screen>
  )
}

export function ReceivePO({ id }: { id: string }) {
  const s = useStore()
  const po = s.pos.find((x) => x.id === id)
  const [got, setGot] = useState<Record<string, number>>(() => Object.fromEntries((po?.lines ?? []).map((l) => [l.stockId, Math.max(0, l.ordered - l.received)])))
  const [photo, setPhoto] = useState<string>()
  if (!po) return <Screen title="Purchase order"><Empty title="Not found" body="This purchase order doesn't exist." /></Screen>
  const sup = s.suppliers.find((x) => x.id === po.supplierId)!
  const bill = po.lines.reduce((a, l) => a + (got[l.stockId] ?? 0) * l.pricePaise, 0)
  const any = Object.values(got).some((v) => v > 0)
  return (
    <Screen title={<span className="tnum">{po.code}</span>} sub={`${sup.name} · expected ${day(po.expectedOn)}`}
      actions={<Chip tone={po.status === 'received' ? 'ok' : po.status === 'partial' ? 'gold' : 'accent'}>{po.status === 'received' ? 'Received' : po.status === 'partial' ? 'Part received' : 'Ordered'}</Chip>}>
      <SectionTitle>{po.status === 'received' ? 'Items' : 'Tick what arrived'}</SectionTitle>
      <Divided>
        {po.lines.map((l) => {
          const it = s.stock.find((x) => x.id === l.stockId)!
          const left = l.ordered - l.received
          const step = it.unit === 'pcs' ? 10 : 50
          return (
            <div key={l.stockId} className="flex items-center gap-3 px-4 py-3.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-ink">{it.name}</span>
                <span className="block text-[13px] text-ink-2 tnum">ordered {qty(l.ordered, it.unit)} · {l.received ? `${qty(l.received, it.unit)} already in · ` : ''}{inr(l.pricePaise, { decimals: l.pricePaise < 1000 })}/{it.unit}</span>
              </span>
              {left > 0 ? (
                <span className="flex items-center gap-1.5">
                  <button aria-label="Less" onClick={() => setGot((g) => ({ ...g, [l.stockId]: Math.max(0, (g[l.stockId] ?? 0) - step) }))} className="grid size-9 place-items-center rounded-full bg-surface-2 text-ink"><Minus size={16} /></button>
                  <span className="w-16 text-center text-[15px] font-bold text-ink tnum">{got[l.stockId] ?? 0}</span>
                  <button aria-label="More" onClick={() => setGot((g) => ({ ...g, [l.stockId]: Math.min(left, (g[l.stockId] ?? 0) + step) }))} className="grid size-9 place-items-center rounded-full bg-surface-2 text-ink"><Plus size={16} /></button>
                </span>
              ) : <Chip tone="ok" icon={<Check size={12} />}>In</Chip>}
            </div>
          )
        })}
      </Divided>
      {po.status !== 'received' && (
        <>
          <SectionTitle>Supplier bill</SectionTitle>
          <PhotoInput id={'bill-' + po.id} value={photo} onChange={setPhoto} label="Photo of the bill" />
          <p className="mt-2 px-2 text-[13px] text-ink-2">Creates a bill of <b className="text-ink tnum">{inr(bill)}</b> in Money → To pay. Partial deliveries are fine.</p>
          <FlowBar label="Receive goods" icon={<PackageCheck size={19} />} disabled={!any}
            onAction={() => { s.receivePO(po.id, got, bill); s.toast('Goods received · bill added to To pay'); s.back() }} />
        </>
      )}
    </Screen>
  )
}
