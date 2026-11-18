/**
 * @screens MG-05 Order detail · MG-06 Prepare remedy · MG-07 Quality check · MG-08 Pick & pack
 *          MG-09 Dispatch (Shiprocket + manual) · MG-09b Shipment created · MG-10 problems (reattempt / replacement)
 * Prep data = prep sheet + alcohol-free flag only. No consultation notes, reasons or intake answers. No refunds (D-16).
 */
import { AnimatePresence, motion } from 'motion/react'
import {
  Lock, Phone, Copy, MapPin, Store, Truck, FileText, Star, Check, Leaf, Package, RotateCcw, Undo2, Tag, Scale, Box,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { PREP_CHECKS, QC_CHECKS, STAGE_LABEL, STAGE_TONE, journey, journeyIndex, KIND_LABEL } from '../lib/stages'
import { ago, dateKey, day, inr, shortName, time, when, firstName } from '../lib/format'
import type { Client, Order } from '../lib/types'
import {
  Button, CheckRow, Chip, Choices, Divided, Empty, Field, FlowBar, PhotoInput, Row, Screen, SectionTitle, Segmented, Sheet, Surface, Switch,
  areaCls, copyText, cx, inputCls, soft, spring,
} from '../ui/kit'
import { KindIcon } from './Orders'
import owlBottle from '../assets/owl-bottle.webp'

export function OrderDetail({ id }: { id: string }) {
  const o = useStore((s) => s.orders.find((x) => x.id === id))
  const c = useStore((s) => s.clients.find((x) => x.id === o?.clientId))
  if (!o || !c) return <Screen title="Order not found"><Empty title="This order is gone" body="It may have been removed in a demo reset." /></Screen>
  return (
    <Screen
      title={<span className="tnum">{o.code}</span>}
      sub={`${shortName(c.name)} · ${c.city}${o.replacementOf ? ` · replaces ${o.replacementOf}` : ''}`}
      actions={<Chip tone="neutral" icon={<KindIcon kind={o.kind} size={13} />}>{KIND_LABEL[o.kind]}</Chip>}
    >
      <Journey o={o} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={o.stage} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          <StagePanel o={o} c={c} />
        </motion.div>
      </AnimatePresence>
      <OrderFacts o={o} c={c} />
    </Screen>
  )
}

/* ───────── journey rail ───────── */
function Journey({ o }: { o: Order }) {
  const steps = journey(o)
  const idx = journeyIndex(o)
  const bad = o.stage === 'failed_delivery' || o.stage === 'rto'
  const pct = steps.length > 1 ? idx / (steps.length - 1) : 0
  return (
    <div className="mb-5 rounded-[24px] bg-surface px-3 pt-4 pb-3 shadow-soft">
      <div className="relative grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        <div className="absolute top-[11px] h-[3px] rounded-full bg-surface-2" style={{ left: `${50 / steps.length}%`, right: `${50 / steps.length}%` }} />
        <motion.div className="absolute top-[11px] h-[3px] origin-left rounded-full" initial={false}
          style={{ left: `${50 / steps.length}%`, width: `${100 - 100 / steps.length}%`, background: bad ? 'var(--bad)' : 'linear-gradient(90deg, var(--accent), var(--sage))' }}
          animate={{ scaleX: pct }} transition={soft} />
        {steps.map((s, i) => {
          const done = i < idx || (i === idx && o.stage === 'delivered')
          const now = i === idx && o.stage !== 'delivered'
          return (
            <div key={s.key} className="relative flex flex-col items-center gap-1.5">
              <motion.span initial={false}
                animate={{ scale: now ? 1.15 : 1, backgroundColor: done ? 'var(--sage)' : now ? (bad ? 'var(--bad)' : 'var(--cta-from)') : 'var(--surface-2)' }}
                transition={spring} className="grid size-[25px] place-items-center rounded-full ring-4 ring-[var(--surface)]">
                {done ? <Check size={13} strokeWidth={3.2} className="text-white" /> : now ? <motion.span className="size-2 rounded-full bg-white" animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 1.6, repeat: Infinity }} /> : null}
              </motion.span>
              <span className={cx('text-center text-[11px] leading-tight font-semibold', now ? 'text-ink' : 'text-ink-3')}>{bad && now ? STAGE_LABEL[o.stage] : s.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ───────── per-stage panel ───────── */
function StagePanel({ o, c }: { o: Order; c: Client }) {
  const s = useStore()
  const remedyFlow = o.kind !== 'store'
  switch (o.stage) {
    case 'new':
      return remedyFlow ? (
        <>
          <PrepSheet o={o} readOnly />
          <FlowBar label="Start preparing" icon={<Leaf size={19} />} onAction={() => { s.advance(o.id, 'preparing'); s.toast('Preparing ' + o.code, 'info') }} />
        </>
      ) : (
        <>
          <PickList o={o} readOnly />
          <FlowBar label="Start packing" icon={<Package size={19} />} onAction={() => { s.advance(o.id, 'packing'); s.toast('Packing ' + o.code, 'info') }} />
        </>
      )
    case 'preparing': return <PreparePanel o={o} />
    case 'quality_check': return <QcPanel o={o} />
    case 'packing': return <PackPanel o={o} />
    case 'ready_to_dispatch': return o.delivery === 'studio_pickup' ? <HandOverPanel o={o} c={c} /> : <DispatchPanel o={o} c={c} />
    case 'dispatched': return <TrackingPanel o={o} />
    case 'failed_delivery':
    case 'rto': return <ProblemPanel o={o} />
    case 'delivered': return <DeliveredPanel o={o} />
    default: return <Surface><p className="text-[15px] text-ink-2">This order was cancelled.</p></Surface>
  }
}

/* ───────── MG-06 Prepare remedy ───────── */
export function PrepSheet({ o, readOnly }: { o: Order; readOnly?: boolean }) {
  if (!o.prep) return null
  const total = o.prep.flowers.reduce((a, f) => a + f.drops, 0)
  return (
    <div className="space-y-3">
      {o.alcoholFree && (
        <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring}
          className="flex items-center gap-3 rounded-[22px] border-2 border-[var(--ink)] bg-gold-soft px-4 py-3.5" role="alert">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--ink)] text-[13px] font-extrabold text-[var(--surface)]">AF</span>
          <span>
            <span className="block text-[16px] font-extrabold tracking-[0.02em] text-ink">ALCOHOL-FREE BASE</span>
            <span className="block text-[13.5px] font-medium text-ink">Use glycerine base. Not brandy. The client asked for this.</span>
          </span>
        </motion.div>
      )}
      <Surface pad={false} className="overflow-hidden">
        <div className="flex items-baseline justify-between px-5 pt-4 pb-2">
          <h3 className="text-[16px] font-bold text-ink">{o.prep.blend} · {o.prep.bottleMl} ml</h3>
          <span className="text-[13px] font-semibold text-ink-2 tnum">{total} drops total</span>
        </div>
        <ul className="divide-y divide-[var(--line)]">
          {o.prep.flowers.map((f, i) => (
            <motion.li key={f.name} initial={readOnly ? false : { opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: i * 0.04 }}
              className="flex items-center gap-3 px-5 py-3">
              <span className="grid size-9 place-items-center rounded-full bg-sage-soft text-sage"><Leaf size={16} /></span>
              <span className="flex-1 text-[16px] font-semibold text-ink">{f.name}</span>
              <span className="text-[15px] font-bold text-ink tnum">{f.drops} drops</span>
            </motion.li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-px border-t border-[var(--line)] bg-[var(--line)]">
          <div className="bg-surface px-5 py-3"><span className="block text-[12.5px] font-semibold text-ink-2">Base</span><span className="text-[14.5px] font-semibold text-ink">{o.alcoholFree ? 'Glycerine (alcohol-free)' : 'Brandy'} · fill to {o.prep.bottleMl} ml</span></div>
          <div className="bg-surface px-5 py-3"><span className="block text-[12.5px] font-semibold text-ink-2">Bottle</span><span className="text-[14.5px] font-semibold text-ink">{o.prep.bottleMl} ml amber dropper</span></div>
        </div>
        <div className="flex items-center gap-3 border-t border-[var(--line)] bg-accent-soft/50 px-5 py-3.5">
          <Tag size={18} className="shrink-0 text-accent" />
          <span className="text-[15px] font-semibold text-ink">{o.prep.label}{o.alcoholFree ? ' · AF' : ''}</span>
        </div>
      </Surface>
      <p className="flex items-center gap-2 px-2 text-[12.5px] font-medium text-ink-2"><Lock size={13} /> Consultation notes are private and not shown here.</p>
    </div>
  )
}

function PreparePanel({ o }: { o: Order }) {
  const s = useStore()
  const [sheet, setSheet] = useState(false)
  const checks = o.alcoholFree ? [{ key: 'af', label: 'Alcohol-free base used' }, ...PREP_CHECKS] : PREP_CHECKS
  const done = checks.filter((x) => o.checks[x.key]).length
  const all = done === checks.length
  return (
    <>
      <PrepSheet o={o} />
      <SectionTitle action={<span className="text-[13px] font-semibold text-ink-2 tnum">{done}/{checks.length}</span>}>Checklist</SectionTitle>
      <Surface pad={false} className="p-2">
        {checks.map((x) => <CheckRow key={x.key} checked={!!o.checks[x.key]} onToggle={() => s.toggleCheck(o.id, x.key)} label={x.label} strong={x.key === 'af'} />)}
      </Surface>
      <FlowBar label="Send to quality check" disabled={!all} hint={all ? undefined : 'Tick every step to continue'} onAction={() => { s.sendToQc(o.id); s.toast('Sent to quality check') }}
        secondary={<Button onClick={() => setSheet(true)} icon={<FileText size={18} />} className="h-[58px] shrink-0">Sheet</Button>} />
      <PrepSheetDoc o={o} open={sheet} onClose={() => setSheet(false)} />
    </>
  )
}

function PrepSheetDoc({ o, open, onClose }: { o: Order; open: boolean; onClose: () => void }) {
  const c = useStore((s) => s.clients.find((x) => x.id === o.clientId)!)
  if (!o.prep) return null
  return (
    <Sheet open={open} onClose={onClose} title="Prep sheet">
      <div className="rounded-[18px] border border-[var(--line)] bg-white p-5 text-[#182957] shadow-soft">
        <div className="flex items-start justify-between border-b border-[#18295722] pb-3">
          <div><div className="text-[15px] font-bold">BeWise · Holistic Wellness</div><div className="text-[12px] text-[#646b80]">Order {o.code} · paid {when(o.paidAt)}</div></div>
          <div className="text-right text-[12px] font-bold tracking-wide">PREP SHEET</div>
        </div>
        <div className="py-3 text-[13px]">Client: <b>{shortName(c.name)}</b> · {o.prep.blend} · {o.prep.bottleMl} ml dropper · due <b>{when(o.dueAt)}</b></div>
        {o.alcoholFree && <div className="mb-3 border-[3px] border-[#182957] px-3 py-2 text-center text-[14px] font-extrabold tracking-wide">ALCOHOL-FREE BASE — glycerine, NOT brandy</div>}
        <table className="w-full text-[14px]"><tbody>
          {o.prep.flowers.map((f) => <tr key={f.name} className="border-b border-dotted border-[#18295733]"><td className="py-1.5">☐ {f.name}</td><td className="py-1.5 text-right font-semibold tnum">{f.drops} drops</td></tr>)}
          <tr><td className="py-1.5">☐ Base: {o.alcoholFree ? 'alcohol-free' : 'brandy'} — fill to {o.prep.bottleMl} ml</td><td /></tr>
        </tbody></table>
        <div className="mt-3 text-[12px] font-semibold text-[#646b80]">Label text (print exactly)</div>
        <div className="mt-1 rounded-lg border border-[#18295744] px-3 py-2 text-[14px] font-semibold">{o.prep.label}</div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-[12px] text-[#646b80]"><span>Prepared by ________</span><span>QC by ________</span></div>
        <div className="mt-4 border-t border-[#18295722] pt-2 text-[11.5px] text-[#646b80]">🔒 Consultation notes are private and not shown here.</div>
      </div>
    </Sheet>
  )
}

/* ───────── MG-07 Quality check ───────── */
function QcPanel({ o }: { o: Order }) {
  const s = useStore()
  const [photo, setPhoto] = useState<string>()
  const [redo, setRedo] = useState(false)
  const [note, setNote] = useState('')
  const done = QC_CHECKS.filter((x) => o.checks[x.key]).length
  const all = done === QC_CHECKS.length
  return (
    <>
      <PrepSheet o={o} readOnly />
      <SectionTitle action={<span className="text-[13px] font-semibold text-ink-2 tnum">{done}/{QC_CHECKS.length}</span>}>Quality check</SectionTitle>
      <Surface pad={false} className="p-2">
        {QC_CHECKS.map((x) => <CheckRow key={x.key} checked={!!o.checks[x.key]} onToggle={() => s.toggleCheck(o.id, x.key)} label={x.label} />)}
      </Surface>
      <SectionTitle>Photo of the bottle <span className="font-medium text-ink-3">(optional)</span></SectionTitle>
      <PhotoInput id={'qc-' + o.id} value={photo} onChange={setPhoto} label="Add photo" />
      <FlowBar label="Pass quality check" disabled={!all} hint={all ? undefined : 'Tick every check to pass'}
        onAction={() => { s.qc(o.id, 'pass', undefined, photo); s.toast('Passed · ready to pack') }}
        secondary={<Button kind="danger" onClick={() => setRedo(true)} icon={<RotateCcw size={18} />} className="h-[58px] shrink-0">Redo</Button>} />
      <Sheet open={redo} onClose={() => setRedo(false)} title="Send back to prepare"
        footer={<Button kind="primary" full disabled={note.trim().length < 3} onClick={() => { s.qc(o.id, 'redo', note.trim(), photo); setRedo(false); s.toast('Sent back to prepare', 'info') }}>Send back</Button>}>
        <p className="mb-3 text-[14.5px] text-ink-2">The bottle and label are written off as wastage and the checklist starts again.</p>
        <Field label="What needs fixing?"><textarea id="redo-note" className={areaCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Label text has a typo" /></Field>
      </Sheet>
    </>
  )
}

/* ───────── MG-08 Pick & pack ───────── */
function PickList({ o, readOnly, checks, onToggle }: { o: Order; readOnly?: boolean; checks?: Record<string, boolean>; onToggle?: (k: string) => void }) {
  return (
    <Surface pad={false} className="p-2">
      {o.items.map((i) => {
        const label = <span className="flex items-center justify-between gap-2"><span>{i.name}</span><span className="text-ink-2 tnum">× {i.qty}</span></span>
        return readOnly
          ? <div key={i.id} className="flex items-center gap-3 px-3 py-3 text-[15px] font-semibold text-ink"><span className="grid size-8 place-items-center rounded-full bg-surface-2 text-ink-2">{i.kind === 'remedy' ? <Leaf size={15} /> : <Package size={15} />}</span><span className="flex-1">{label}</span></div>
          : <CheckRow key={i.id} checked={!!checks?.['pick-' + i.id]} onToggle={() => onToggle?.('pick-' + i.id)} label={label} sub={i.kind === 'remedy' ? 'From quality check tray' : 'From finished goods shelf'} />
      })}
    </Surface>
  )
}

const BOXES = [{ value: 'Small', label: 'Small 15×10×8' }, { value: 'Medium', label: 'Medium 20×15×10' }]
function PackPanel({ o }: { o: Order }) {
  const s = useStore()
  const estimate = useMemo(() => {
    const prods = s.products.flatMap((p) => p.variants)
    return o.items.reduce((g, i) => g + (i.kind === 'remedy' ? 110 : (prods.find((v) => v.id === i.variantId)?.weightG ?? 200) * i.qty), 60)
  }, [o, s.products])
  const [weight, setWeight] = useState(String(Math.round(estimate / 10) * 10))
  const [box, setBox] = useState(o.items.length > 2 ? 'Medium' : 'Small')
  const picks = o.items.every((i) => o.checks['pick-' + i.id])
  const w = Number(weight)
  const ok = picks && w > 0 && w < 30000
  return (
    <>
      <SectionTitle>Pick list</SectionTitle>
      <PickList o={o} checks={o.checks} onToggle={(k) => s.toggleCheck(o.id, k)} />
      <SectionTitle>Parcel</SectionTitle>
      <Surface className="space-y-4">
        <Field label="Weight with box (grams)" hint={`Estimated ${estimate} g from the items`}>
          <div className="relative"><Scale size={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-ink-3" />
            <input id="pack-weight" inputMode="numeric" className={cx(inputCls, 'pl-11 tnum')} value={weight} onChange={(e) => setWeight(e.target.value.replace(/\D/g, ''))} />
            <span className="absolute top-1/2 right-4 -translate-y-1/2 text-[14px] font-semibold text-ink-2">g</span></div>
        </Field>
        <div><span className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-ink-2"><Box size={14} /> Box</span><Choices id={'box-' + o.id} options={BOXES} value={box} onChange={setBox} /></div>
      </Surface>
      <FlowBar label="Packed · ready to dispatch" disabled={!ok} hint={!picks ? 'Tick every item as you pack it' : undefined}
        onAction={() => { s.packed(o.id, w, box); s.toast('Packed · ' + o.code) }} />
    </>
  )
}

/* ───────── MG-09 Dispatch via Shiprocket ───────── */
type Rate = { id: string; courier: string; pricePaise: number; days: number; rating: number }
function rates(pincode: string, weightG: number): Rate[] {
  const zone = pincode.startsWith('390') ? 0 : pincode.startsWith('3') ? 1 : pincode.startsWith('4') || pincode.startsWith('1') ? 2 : 3
  const slabs = Math.max(1, Math.ceil(weightG / 500))
  const mk = (id: string, courier: string, base: number, per: number, days: number, rating: number): Rate => ({ id, courier, pricePaise: Math.round((base + per * (slabs - 1)) * (1 + zone * 0.35)) * 100, days: days + zone, rating })
  return [
    mk('dl', 'Delhivery Surface', 52, 38, 2, 4.3), mk('xb', 'Xpressbees', 49, 36, 3, 4.0), mk('bd', 'Blue Dart Air', 88, 60, 1, 4.6),
    mk('ek', 'Ekart', 46, 34, 3, 3.8), mk('dt', 'DTDC', 58, 40, 2, 3.9),
  ].sort((a, b) => a.pricePaise - b.pricePaise)
}
const recommend = (rs: Rate[]) => {
  const fastest = Math.min(...rs.map((r) => r.days))
  return rs.filter((r) => r.days <= fastest + 1 && r.rating >= 3.5).sort((a, b) => a.pricePaise - b.pricePaise)[0]?.id
}

function DispatchPanel({ o, c }: { o: Order; c: Client }) {
  const s = useStore()
  const [mode, setMode] = useState<'shiprocket' | 'manual'>('shiprocket')
  const rs = useMemo(() => rates(c.pincode, o.pack?.weightG ?? 300), [c.pincode, o.pack])
  const rec = recommend(rs)
  const [pick, setPick] = useState(rec)
  const [pickup, setPickup] = useState<'today' | 'tomorrow'>(new Date().getHours() < 15 ? 'today' : 'tomorrow')
  const [wa, setWa] = useState(true)
  const [creating, setCreating] = useState(false)
  const [manual, setManual] = useState({ courier: 'DTDC', awb: '', freight: '' })
  const chosen = rs.find((r) => r.id === pick)
  return (
    <>
      <AddressCard c={c} o={o} />
      <Segmented id={'dmode-' + o.id} className="mt-4" value={mode} onChange={setMode} options={[{ value: 'shiprocket', label: 'Shiprocket' }, { value: 'manual', label: 'Manual AWB' }]} />
      <AnimatePresence mode="wait" initial={false}>
        {mode === 'shiprocket' ? (
          <motion.div key="sr" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18 }}>
            <SectionTitle action={<span className="text-[13px] font-semibold text-ink-2 tnum">{o.pack?.weightG} g · {o.pack?.box} box</span>}>Choose a courier</SectionTitle>
            <div className="space-y-2" role="radiogroup" aria-label="Courier">
              {rs.map((r, i) => {
                const on = pick === r.id
                return (
                  <motion.button key={r.id} role="radio" aria-checked={on} onClick={() => setPick(r.id)}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.035 }} whileTap={{ scale: 0.985 }}
                    className={cx('relative flex w-full items-center gap-3 rounded-[22px] p-4 text-left transition-shadow', on ? 'bg-surface shadow-lift ring-2 ring-[var(--cta-from)]' : 'bg-surface shadow-soft')}>
                    <span className={cx('grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors', on ? 'border-[var(--cta-from)] bg-[var(--cta-from)]' : 'border-[var(--ink-3)]')}>
                      {on && <motion.span layoutId={'radio-' + o.id} className="size-2 rounded-full bg-[var(--cta-fg)]" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2"><span className="text-[15.5px] font-bold text-ink">{r.courier}</span>{r.id === rec && <Chip tone="ok">Recommended</Chip>}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-[13px] text-ink-2"><span>{r.days === 1 ? 'Next day' : `${r.days} days`}</span><span className="inline-flex items-center gap-0.5"><Star size={12} className="fill-current" /> {r.rating}</span></span>
                    </span>
                    <span className="text-[17px] font-bold text-ink tnum">{inr(r.pricePaise)}</span>
                  </motion.button>
                )
              })}
            </div>
            <SectionTitle>Pickup</SectionTitle>
            <Surface className="space-y-4">
              <Choices id={'pk-' + o.id} value={pickup} onChange={setPickup} options={[{ value: 'today', label: 'Today, 4 PM' }, { value: 'tomorrow', label: 'Tomorrow, 4 PM' }]} />
              <div className="flex items-center justify-between gap-3">
                <span><span className="block text-[15px] font-semibold text-ink">Send tracking on WhatsApp</span><span className="block text-[13px] text-ink-2">To {c.phone}</span></span>
                <Switch on={wa} onChange={setWa} label="Send tracking on WhatsApp" />
              </div>
            </Surface>
            <FlowBar hold label={`Hold to create shipment · ${chosen ? inr(chosen.pricePaise) : ''}`} icon={<Truck size={19} />} onAction={() => setCreating(true)} hint="Press and hold — this books the courier" />
          </motion.div>
        ) : (
          <motion.div key="man" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>
            <SectionTitle>Courier details</SectionTitle>
            <Surface className="space-y-4">
              <Choices id={'mc-' + o.id} value={manual.courier} onChange={(v) => setManual({ ...manual, courier: v })} options={['DTDC', 'India Post', 'Blue Dart', 'Delhivery', 'Hand delivery'].map((v) => ({ value: v, label: v }))} />
              <Field label="AWB / tracking number"><input id="man-awb" className={cx(inputCls, 'tnum uppercase')} value={manual.awb} onChange={(e) => setManual({ ...manual, awb: e.target.value.toUpperCase() })} placeholder="Type the number on the slip" autoComplete="off" /></Field>
              <Field label="Courier charge (₹)"><input id="man-fr" inputMode="decimal" className={cx(inputCls, 'tnum')} value={manual.freight} onChange={(e) => setManual({ ...manual, freight: e.target.value.replace(/[^\d.]/g, '') })} placeholder="0" /></Field>
            </Surface>
            <FlowBar hold label="Hold to mark dispatched" icon={<Truck size={19} />} disabled={manual.courier !== 'Hand delivery' && manual.awb.length < 6}
              hint={manual.courier !== 'Hand delivery' && manual.awb.length < 6 ? 'Enter the AWB number first' : 'Press and hold to confirm'}
              onAction={() => { s.dispatch(o.id, { provider: 'manual', courier: manual.courier, awb: manual.awb || 'HAND', freightPaise: Math.round(Number(manual.freight || 0) * 100), etd: dateKey(3) }); s.toast('Dispatched · ' + o.code) }} />
          </motion.div>
        )}
      </AnimatePresence>
      <CreateShipment open={creating} onClose={() => setCreating(false)} o={o} c={c} rate={chosen} pickup={pickup} wa={wa} />
    </>
  )
}

const SR_STEPS = ['Shiprocket order created', 'AWB assigned', 'Pickup scheduled', 'Label ready']
function CreateShipment({ open, onClose, o, c, rate, pickup, wa }: { open: boolean; onClose: () => void; o: Order; c: Client; rate?: Rate; pickup: string; wa: boolean }) {
  const s = useStore()
  const [step, setStep] = useState(0)
  const [awb, setAwb] = useState('')
  const [label, setLabel] = useState(false)
  useEffect(() => {
    if (!open) return
    setStep(0); setLabel(false)
    const code = 'SR' + String(Math.floor(1e9 + Math.random() * 9e9))
    setAwb(code)
    const timers = SR_STEPS.map((_, i) => setTimeout(() => setStep(i + 1), 420 * (i + 1)))
    return () => { timers.forEach(clearTimeout) }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const finished = step >= SR_STEPS.length
  // the order moves to "In transit" when the sheet closes, so the confirmation stays on screen until then
  const close = () => {
    if (finished && rate) {
      s.dispatch(o.id, { provider: 'shiprocket', courier: rate.courier, awb, freightPaise: rate.pricePaise, etd: dateKey(rate.days), pickupOn: dateKey(pickup === 'today' ? 0 : 1) })
      s.toast('Dispatched · ' + o.code)
    }
    onClose()
  }
  const link = `https://shiprocket.co/tracking/${awb}`
  return (
    <Sheet open={open} onClose={close} title={finished ? 'Shipment created' : 'Creating shipment…'}
      footer={finished ? <div className="flex gap-3"><Button onClick={() => setLabel(!label)} icon={<FileText size={18} />} className="flex-1">{label ? 'Hide label' : 'View label'}</Button><Button kind="primary" onClick={close} className="flex-1">Done</Button></div> : undefined}>
      <ul className="space-y-1">
        {SR_STEPS.map((t, i) => (
          <li key={t} className="flex items-center gap-3 rounded-2xl px-2 py-2.5">
            <span className="relative grid size-8 place-items-center">
              <AnimatePresence mode="wait" initial={false}>
                {step > i ? (
                  <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring} className="grid size-8 place-items-center rounded-full bg-ok"><Check size={16} strokeWidth={3} className="text-white" /></motion.span>
                ) : step === i ? (
                  <motion.span key="spin" className="size-7 rounded-full border-[3px] border-[var(--accent-soft)] border-t-[var(--accent)]" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                ) : <motion.span key="idle" className="size-7 rounded-full border-2 border-[var(--line)]" />}
              </AnimatePresence>
            </span>
            <span className={cx('text-[15.5px] font-semibold', step >= i ? 'text-ink' : 'text-ink-3')}>{t}</span>
          </li>
        ))}
      </ul>
      <AnimatePresence>
        {finished && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={soft} className="mt-4 space-y-3">
            <Surface className="text-center">
              <span className="block text-[13px] font-semibold text-ink-2">AWB · {rate?.courier}</span>
              <span className="mt-1 block text-[26px] font-bold tracking-[0.02em] text-ink tnum">{awb}</span>
              <span className="mt-1 block text-[13.5px] text-ink-2">Pickup {pickup === 'today' ? 'today' : 'tomorrow'} at 4 PM · {wa ? `tracking will go to ${firstName(c.name)} on WhatsApp` : 'no WhatsApp tracking'}</span>
              <button onClick={() => copyText(link, (ok) => s.toast(ok ? 'Tracking link copied' : 'Copy blocked — select the link instead', ok ? 'good' : 'bad'))}
                className="mx-auto mt-3 flex items-center gap-1.5 rounded-full bg-accent-soft px-4 py-2 text-[13.5px] font-semibold text-accent"><Copy size={14} /> Copy tracking link</button>
              <span className="mt-2 block text-[12px] break-all text-ink-3 select-all">{link}</span>
            </Surface>
            <AnimatePresence>{label && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><ShippingLabel o={o} c={c} awb={awb} courier={rate?.courier ?? ''} /></motion.div>}</AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  )
}

function Barcode({ value }: { value: string }) {
  const bars = useMemo(() => value.split('').flatMap((ch) => { const n = ch.charCodeAt(0); return [1 + (n % 3), 1 + ((n >> 2) % 2), 1 + ((n >> 3) % 3), 1 + (n % 2)] }), [value])
  let x = 0
  return (
    <svg viewBox={`0 0 ${bars.reduce((a, b) => a + b, 0)} 40`} preserveAspectRatio="none" className="h-14 w-full" aria-label={`Barcode ${value}`}>
      {bars.map((w, i) => { const r = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={40} fill="#000" /> : null; x += w; return r })}
    </svg>
  )
}
function ShippingLabel({ o, c, awb, courier }: { o: Order; c: Client; awb: string; courier: string }) {
  return (
    <div className="rounded-[14px] border-2 border-black bg-white p-4 font-sans text-black">
      <div className="flex justify-between text-[12px] font-bold"><span>{courier}</span><span>PREPAID</span></div>
      <Barcode value={awb} />
      <div className="text-center text-[13px] font-bold tracking-[0.15em]">{awb}</div>
      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-black pt-2 text-[12px] leading-snug">
        <div><b>Ship to</b><br />{c.name}<br />{c.address}<br />{c.city} {c.pincode}<br />{c.phone}</div>
        <div><b>From</b><br />BeWise Holistic Wellness<br />Karelibaug, Vadodara 390018<br /><br />Order {o.code} · {o.pack?.weightG} g</div>
      </div>
    </div>
  )
}

/* ───────── studio pickup ───────── */
function HandOverPanel({ o, c }: { o: Order; c: Client }) {
  const s = useStore()
  const [who, setWho] = useState(c.name)
  return (
    <>
      <Surface className="flex items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sage-soft text-sage"><Store size={22} /></span>
        <span><span className="block text-[16px] font-bold text-ink">Collect at the studio</span><span className="block text-[13.5px] text-ink-2">{firstName(c.name)} will pick this up in person. No courier needed.</span></span>
      </Surface>
      <SectionTitle>Handed to</SectionTitle>
      <Surface><Field label="Name of the person collecting"><input id="collector" className={inputCls} value={who} onChange={(e) => setWho(e.target.value)} /></Field></Surface>
      <FlowBar hold label="Hold to hand over" icon={<Check size={19} />} disabled={who.trim().length < 2} hint="Press and hold to confirm"
        onAction={() => { s.handOver(o.id, who.trim()); s.toast(`Handed over to ${firstName(who)}`) }} />
    </>
  )
}

/* ───────── in transit ───────── */
function Timeline({ o }: { o: Order }) {
  const ev = [...(o.shipment?.events ?? [])].reverse()
  return (
    <Surface>
      <ol className="relative space-y-4 pl-6">
        <span className="absolute top-2 bottom-2 left-[7px] w-[2px] rounded-full bg-surface-2" aria-hidden />
        {ev.map((e, i) => (
          <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: i * 0.04 }} className="relative">
            <span className={cx('absolute top-1.5 -left-6 size-4 rounded-full ring-4 ring-[var(--surface)]', i === 0 ? (o.stage === 'failed_delivery' || o.stage === 'rto' ? 'bg-bad' : o.stage === 'delivered' ? 'bg-ok' : 'bg-accent') : 'bg-[var(--ink-3)]')} />
            <span className={cx('block text-[15px]', i === 0 ? 'font-bold text-ink' : 'font-medium text-ink-2')}>{e.label}</span>
            <span className="block text-[12.5px] text-ink-3">{when(e.at)}</span>
          </motion.li>
        ))}
      </ol>
    </Surface>
  )
}
function ShipmentHeader({ o }: { o: Order }) {
  const s = useStore()
  if (!o.shipment) return null
  return (
    <Surface className="flex items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><Truck size={20} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15.5px] font-bold text-ink">{o.shipment.courier}</span>
        <span className="block text-[13px] text-ink-2 tnum select-all">AWB {o.shipment.awb} · {o.shipment.provider === 'shiprocket' ? 'via Shiprocket' : 'manual'}{o.shipment.freightPaise ? ` · ${inr(o.shipment.freightPaise)}` : ''}</span>
      </span>
      <button aria-label="Copy AWB" onClick={() => copyText(o.shipment!.awb, (ok) => s.toast(ok ? 'AWB copied' : 'Copy blocked — select the number instead', ok ? 'good' : 'bad'))} className="grid size-10 place-items-center rounded-full bg-surface-2 text-ink"><Copy size={16} /></button>
    </Surface>
  )
}
function TrackingPanel({ o }: { o: Order }) {
  const s = useStore()
  const [fail, setFail] = useState(false)
  return (
    <div className="space-y-3">
      <ShipmentHeader o={o} />
      <Timeline o={o} />
      <p className="px-2 text-[12.5px] text-ink-2">{o.shipment?.provider === 'shiprocket' ? 'Updates arrive from Shiprocket on their own. Use these only if the courier told you directly.' : 'Manual shipment — update the status yourself.'}</p>
      <div className="flex gap-3">
        <Button className="flex-1" onClick={() => setFail(true)}>Report a problem</Button>
        <Button kind="primary" className="flex-1" onClick={() => { s.delivered(o.id); s.toast('Marked delivered') }}>Mark delivered</Button>
      </div>
      <Sheet open={fail} onClose={() => setFail(false)} title="What happened?">
        <div className="space-y-2">
          {['Customer not reachable', 'Address incomplete', 'Customer refused', 'Parcel damaged in transit'].map((r) => (
            <Row key={r} className="rounded-2xl bg-surface shadow-soft" onClick={() => { s.reportFailed(o.id, r); setFail(false); s.toast('Problem recorded', 'bad') }}>
              <span className="text-[15px] font-semibold text-ink">{r}</span>
            </Row>
          ))}
        </div>
      </Sheet>
    </div>
  )
}

/* ───────── problems: reattempt / replacement (no refunds) ───────── */
function ProblemPanel({ o }: { o: Order }) {
  const s = useStore()
  const [repl, setRepl] = useState(false)
  const replaced = o.problem?.startsWith('Replacement sent')
  return (
    <div className="space-y-3">
      <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }} className="flex items-start gap-3 rounded-[24px] bg-bad-soft p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-bad text-white">{o.stage === 'rto' ? <Undo2 size={19} /> : <Truck size={19} />}</span>
        <span><span className="block text-[16px] font-bold text-ink">{o.stage === 'rto' ? 'Parcel came back to us' : 'Delivery failed'}</span><span className="block text-[14px] text-ink">{o.problem}</span></span>
      </motion.div>
      <ShipmentHeader o={o} />
      <Timeline o={o} />
      {!replaced && (o.stage === 'failed_delivery'
        ? <FlowBar label="Ask courier to reattempt" icon={<RotateCcw size={19} />} onAction={() => { s.reattempt(o.id); s.toast('Reattempt requested') }}
            secondary={<Button onClick={() => setRepl(true)} className="h-[58px] shrink-0">Replace</Button>} />
        : <FlowBar label="Send a replacement" icon={<RotateCcw size={19} />} onAction={() => setRepl(true)} />)}
      <ReplacementSheet o={o} open={repl} onClose={() => setRepl(false)} defaultReason={o.stage === 'rto' ? 'Returned to origin' : 'Failed delivery'} />
    </div>
  )
}
function ReplacementSheet({ o, open, onClose, defaultReason }: { o: Order; open: boolean; onClose: () => void; defaultReason: string }) {
  const s = useStore()
  const [reason, setReason] = useState(defaultReason)
  return (
    <Sheet open={open} onClose={onClose} title="Send a replacement"
      footer={<Button kind="primary" full onClick={() => { const id = s.sendReplacement(o.id, reason); onClose(); s.toast('Replacement order created'); s.go({ name: 'order', id }) }}>Create replacement order</Button>}>
      <p className="mb-4 text-[14.5px] text-ink-2">A new ₹0 order with the same items goes to the start of the line. BeWise doesn't refund. Replacements are how we make it right.</p>
      <Choices id={'repl-' + o.id} value={reason} onChange={setReason} options={['Returned to origin', 'Failed delivery', 'Damaged item', 'Wrong item', 'Lost in transit'].map((v) => ({ value: v, label: v }))} />
    </Sheet>
  )
}

function DeliveredPanel({ o }: { o: Order }) {
  const [repl, setRepl] = useState(false)
  return (
    <div className="space-y-3">
      <Surface className="flex items-center gap-4">
        <img src={owlBottle} alt="" className="size-16 rounded-full" />
        <span><span className="block text-[17px] font-bold text-ink">Delivered</span><span className="block text-[13.5px] text-ink-2">{when(o.history.at(-1)!.at)} · {o.history.at(-1)?.note ?? o.shipment?.courier}</span></span>
      </Surface>
      {o.shipment && <Timeline o={o} />}
      <button onClick={() => setRepl(true)} className="w-full rounded-full py-3 text-[14px] font-semibold text-accent hover:bg-accent-soft">Damaged or wrong item? Send a replacement</button>
      <ReplacementSheet o={o} open={repl} onClose={() => setRepl(false)} defaultReason="Damaged item" />
    </div>
  )
}

/* ───────── facts: items, payment, client, history ───────── */
function AddressCard({ c, o }: { c: Client; o: Order }) {
  const s = useStore()
  return (
    <Surface className="space-y-3">
      <div className="flex items-start gap-3">
        <MapPin size={18} className="mt-0.5 shrink-0 text-ink-3" />
        <span className="text-[14.5px] leading-snug text-ink"><b>{c.name}</b><br />{c.address}, {c.city} {c.pincode}</span>
      </div>
      <div className="flex items-center gap-3">
        <Phone size={18} className="shrink-0 text-ink-3" />
        <span className="flex-1 text-[14.5px] text-ink tnum select-all">{c.phone}</span>
        <button onClick={() => copyText(c.phone, (ok) => s.toast(ok ? 'Number copied' : 'Copy blocked — select the number instead', ok ? 'good' : 'bad'))} className="rounded-full bg-surface-2 px-3 py-1.5 text-[13px] font-semibold text-ink">Copy</button>
      </div>
      {['new', 'preparing', 'quality_check', 'packing', 'ready_to_dispatch'].includes(o.stage) && (
        <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
          <span className="text-[14px] font-semibold text-ink">Delivery</span>
          <Choices id={'dl-' + o.id} value={o.delivery} onChange={(v) => { s.setDelivery(o.id, v); s.toast(v === 'studio_pickup' ? 'Switched to studio pickup' : 'Switched to courier', 'info') }}
            options={[{ value: 'courier', label: 'Courier' }, { value: 'studio_pickup', label: 'Studio pickup' }]} />
        </div>
      )}
    </Surface>
  )
}

function OrderFacts({ o, c }: { o: Order; c: Client }) {
  const showAddress = o.stage !== 'ready_to_dispatch' || o.delivery === 'studio_pickup'
  return (
    <div className="mt-2">
      <SectionTitle>Items & payment</SectionTitle>
      <Divided>
        {o.items.map((i) => (
          <div key={i.id} className="flex items-center gap-3 px-4 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-2">{i.kind === 'remedy' ? <Leaf size={16} /> : <Package size={16} />}</span>
            <span className="min-w-0 flex-1 text-[15px] font-medium text-ink">{i.name} <span className="text-ink-2">× {i.qty}</span></span>
            <span className="text-[14.5px] font-semibold text-ink tnum">{i.pricePaise ? inr(i.pricePaise * i.qty) : <span className="text-sage">Included</span>}</span>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-[14.5px] font-semibold text-ink">{o.totalPaise ? 'Paid' : o.replacementOf ? 'Replacement · no charge' : 'Included in consultation fee'}</span>
          <span className="text-[16px] font-bold text-ink tnum">{inr(o.totalPaise)}</span>
        </div>
      </Divided>
      {showAddress && <><SectionTitle>Client</SectionTitle><AddressCard c={c} o={o} /></>}
      <SectionTitle>History</SectionTitle>
      <Divided>
        {[...o.history].reverse().map((h, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Chip tone={STAGE_TONE[h.stage]}>{STAGE_LABEL[h.stage]}</Chip>
            <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink-2">{h.note ?? ''}</span>
            <span className="shrink-0 text-[12.5px] text-ink-3 tnum">{day(h.at)}, {time(h.at)}</span>
          </div>
        ))}
      </Divided>
      <p className="mt-3 px-2 text-[12px] text-ink-3">Paid {ago(o.paidAt)} · due {when(o.dueAt)}</p>
    </div>
  )
}

