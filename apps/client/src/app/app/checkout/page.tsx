'use client'
/**
 * @module   commerce-ux
 * @owner    CLIENT
 * @screens  CL-38 Address · CL-39 Review & pay · CL-40 Order placed
 * @emits    order.placed / order.paid (production: commerce server functions)
 */
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Home, MapPin, Package, Plus, Truck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Mascot, Petals } from '@/components/brand'
import { PaySheet } from '@/components/pay-sheet'
import { AppHeader } from '@/components/shell'
import { Btn, Sheet, Toggle, cx, ease, spring } from '@/components/ui'
import { useApp, type Order } from '@/lib/store'
import { addDays, fmtDay, formatINR } from '@/lib/format'
import { useBagTotals } from '@/lib/bag'

const PIN_HINT: Record<string, [string, string]> = { '390': ['Vadodara', 'Gujarat'], '380': ['Ahmedabad', 'Gujarat'], '395': ['Surat', 'Gujarat'], '400': ['Mumbai', 'Maharashtra'], '411': ['Pune', 'Maharashtra'], '560': ['Bengaluru', 'Karnataka'], '110': ['New Delhi', 'Delhi'] }

export default function Checkout() {
  const router = useRouter()
  const profile = useApp((s) => s.profile)
  const addresses = useApp((s) => s.addresses)
  const upsert = useApp((s) => s.upsertAddress)
  const placeOrder = useApp((s) => s.placeOrder)
  const { lines, sub, ship, discount, coupon, total } = useBagTotals()
  const [sel, setSel] = useState(addresses[0]?.id)
  const [adding, setAdding] = useState(addresses.length === 0)
  const [f, setF] = useState({ name: profile?.name ?? '', phone: profile?.phone ?? '', pin: '', line1: '', line2: '', city: '', state: '' })
  const [pay, setPay] = useState(false)
  const [ask, setAsk] = useState(false)
  const [subs, setSubs] = useState<string[]>([])
  const products = lines.filter((x) => x.i!.kind === 'product')
  const [done, setDone] = useState<Order>()
  useEffect(() => { if (!lines.length && !done) router.replace('/app/bag') }, [lines.length, done, router])
  useEffect(() => { const h = PIN_HINT[f.pin.slice(0, 3)]; if (f.pin.length === 6 && h && !f.city) setF((x) => ({ ...x, city: h[0], state: h[1] })) }, [f.pin, f.city])

  const valid = f.name.trim().length > 1 && /^[6-9]\d{9}$/.test(f.phone) && /^[1-9]\d{5}$/.test(f.pin) && f.line1.trim().length > 3 && f.city && f.state
  const saveAddr = () => { if (!valid) return; const a = upsert({ name: f.name, phone: f.phone, pin: f.pin, line1: f.line1, line2: f.line2, city: f.city, state: f.state }); setSel(a.id); setAdding(false) }
  const eta = addDays(new Date(), 5)

  if (done) return (
    <main className="flex min-h-dvh flex-col px-5 safe-t">
      <Petals />
      <h1 className="h-duo mt-12 text-[38px]">Thank <em>you</em></h1>
      <p className="mt-2 text-[15px] text-muted">Order {done.code} is confirmed.</p>
      <motion.div className="mx-auto mt-6" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 13 }}><Mascot pose="bottle" height={240} priority /></motion.div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card mt-4 flex items-center gap-4 p-5">
        <span className="grid size-12 place-items-center rounded-full bg-sage-100 text-sage-text"><Truck className="size-6" /></span>
        <div><p className="text-[16px] font-bold text-navy">Arriving by {fmtDay(eta)}</p><p className="text-[13px] text-muted">We’ll message you when it ships.</p></div>
      </motion.div>
      <div className="mt-auto space-y-3 pb-3 pt-6 safe-b">
        <Btn full onClick={() => router.replace(`/app/orders/view?id=${done.id}`)}>Track order</Btn>
        <Btn full variant="ghost" size="md" onClick={() => router.replace('/app/shop')}>Continue browsing</Btn>
      </div>
    </main>
  )

  return (
    <main className="px-5 pb-40">
      <AppHeader back="/app/bag" title="Checkout" />
      <h1 className="h-duo pt-2">Where should it <em>go?</em></h1>
      <div className="mt-5 space-y-3">
        {addresses.map((a) => (
          <motion.button key={a.id} layout onClick={() => setSel(a.id)} aria-pressed={sel === a.id} className={cx('card flex w-full items-start gap-3 p-4 text-left transition', sel === a.id && 'ring-2 ring-navy')}>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-peri-50 text-navy"><Home className="size-5" /></span>
            <span className="flex-1 text-[14px] leading-5"><b className="block text-[15px] text-navy">{a.name}</b><span className="text-muted">{a.line1}, {a.line2 && `${a.line2}, `}{a.city} {a.pin}</span></span>
            <span className={cx('grid size-6 place-items-center rounded-full border-2', sel === a.id ? 'border-navy bg-navy' : 'border-[#cbd0dd]')}>{sel === a.id && <Check className="size-3.5 text-white" strokeWidth={3} />}</span>
          </motion.button>
        ))}
        <AnimatePresence initial={false}>
          {adding ? (
            <motion.div key="form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="card overflow-hidden p-4">
              <p className="mb-3 flex items-center gap-2 text-[16px] font-bold text-navy"><MapPin className="size-5" /> New address</p>
              <div className="grid grid-cols-2 gap-2.5">
                <In label="Full name" v={f.name} on={(name) => setF({ ...f, name })} span />
                <In label="Mobile (+91)" v={f.phone} on={(phone) => setF({ ...f, phone: phone.replace(/\D/g, '').slice(0, 10) })} num />
                <In label="Pincode" v={f.pin} on={(pin) => setF({ ...f, pin: pin.replace(/\D/g, '').slice(0, 6), ...(pin.length < 6 ? { city: '', state: '' } : {}) })} num />
                <In label="House / flat, building" v={f.line1} on={(line1) => setF({ ...f, line1 })} span />
                <In label="Area, street, landmark" v={f.line2} on={(line2) => setF({ ...f, line2 })} span />
                <In label="City" v={f.city} on={(city) => setF({ ...f, city })} />
                <In label="State" v={f.state} on={(state) => setF({ ...f, state })} />
              </div>
              <Btn full size="md" className="mt-4" disabled={!valid} onClick={saveAddr}>Save address</Btn>
            </motion.div>
          ) : (
            <motion.button key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setAdding(true)} className="flex w-full items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-[#c9cfe1] py-4 text-[15px] font-semibold text-navy"><Plus className="size-4" /> Add a new address</motion.button>
          )}
        </AnimatePresence>
      </div>

      <h2 className="h-section mt-7">Review</h2>
      <section className="card mt-3 p-5">
        <ul className="space-y-2">{lines.map(({ l, i }) => <li key={l.key} className="flex justify-between text-[14px]"><span className="text-ink">{i!.name} · {i!.label} × {l.qty}</span><span className="font-semibold text-navy tnum">{formatINR(i!.pricePaise * l.qty)}</span></li>)}</ul>
        <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-[14px]">
          <div className="flex justify-between"><span className="text-muted">Subtotal (GST incl.)</span><span className="tnum">{formatINR(sub)}</span></div>
          {discount > 0 && <div className="flex justify-between font-semibold text-sage-text"><span>🎁 {coupon?.code} · {coupon?.pct}% off</span><span className="tnum">−{formatINR(discount)}</span></div>}
          <div className="flex justify-between"><span className="text-muted">Delivery</span><span className="tnum">{ship ? formatINR(ship) : 'Free'}</span></div>
          <div className="flex justify-between pt-1 text-[18px] font-extrabold text-navy"><span>Total</span><span className="tnum">{formatINR(total)}</span></div>
        </div>
        <p className="mt-3 flex items-center gap-2 text-[13px] text-muted"><Package className="size-4" /> Arrives in 4 to 6 days · No returns for change of mind. Damaged or wrong items are replaced.</p>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] bg-gradient-to-t from-[#e6eee3] via-[#e6eee3]/95 to-transparent px-5 pb-3 pt-8 safe-b">
        <Btn full variant="gradient" disabled={!sel || adding} onClick={() => (products.length ? setAsk(true) : setPay(true))}><span aria-hidden>🔒</span> Pay {formatINR(total)}</Btn>
      </div>
      <PaySheet open={pay} amountPaise={total} purpose="Your order" onClose={() => setPay(false)} onPaid={() => { if (!sel) return; const o = placeOrder(sel, subs); setPay(false); setDone(o) }} />
      {/* owner 2026-11-18: offer a subscription before the order; the order is only placed once they confirm */}
      <Sheet open={ask} onClose={() => setAsk(false)} title="Make it a ritual?">
        <div className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#fbf3dc] text-[26px]" aria-hidden>🔁</span>
          <h2 className="h-duo mt-3 text-[26px]">Make it a <em>ritual?</em></h2>
          <p className="mx-auto mt-1 max-w-[300px] text-[14px] leading-5 text-muted">Subscribe and we’ll send a fresh bottle every 30 days. Pause or cancel anytime on WhatsApp.</p>
        </div>
        <ul className="mt-4 space-y-2">
          {products.map(({ l, i }) => {
            const on = subs.includes(l.key)
            return (
              <li key={l.key} className="flex items-center gap-3 rounded-[18px] bg-peri-50/70 px-4 py-3">
                <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-bold text-navy">{i!.name}</span><span className="text-[12px] text-muted">{i!.label} · every 30 days</span></span>
                <Toggle label={`Subscribe to ${i!.name}`} on={on} onChange={() => setSubs(on ? subs.filter((k) => k !== l.key) : [...subs, l.key])} />
              </li>
            )
          })}
        </ul>
        <div className="mt-5 space-y-2 pb-1">
          <Btn full onClick={() => { setAsk(false); setPay(true) }}>{subs.length ? `Confirm & subscribe` : 'Confirm order'}</Btn>
          {subs.length > 0 && <p className="text-center text-[12px] text-muted">You pay for this order now. Each refill is confirmed with you on WhatsApp first.</p>}
        </div>
      </Sheet>
    </main>
  )
}

function In({ label, v, on, span, num }: { label: string; v: string; on: (v: string) => void; span?: boolean; num?: boolean }) {
  return (
    <label className={cx('block', span && 'col-span-2')}>
      <span className="mb-1 block px-1 text-[12px] font-semibold text-muted">{label}</span>
      <input value={v} onChange={(e) => on(e.target.value)} inputMode={num ? 'numeric' : undefined} className="h-12 w-full rounded-[16px] bg-peri-50 px-4 text-[15px] font-semibold text-navy outline-none focus:ring-2 focus:ring-navy" />
    </label>
  )
}
