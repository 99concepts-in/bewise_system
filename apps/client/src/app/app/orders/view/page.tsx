'use client'
/** @module commerce-ux @owner CLIENT @screens CL-42 Order tracking · CL-43 Request a replacement (no refunds, D-16) */
import { useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { Camera, Check, Package, Truck } from 'lucide-react'
import { Suspense, useState } from 'react'
import { AppHeader } from '@/components/shell'
import { Btn, Chip, Sheet, cx, ease, toast } from '@/components/ui'
import { useApp } from '@/lib/store'
import { addDays, fmtDay, formatINR } from '@/lib/format'
import { STAGES, stageOf } from '@/lib/orders'

export default function Page() { return <Suspense><OrderDetail /></Suspense> }

function OrderDetail() {
  const id = useSearchParams().get('id') ?? ''
  const o = useApp((s) => s.orders.find((x) => x.id === id))
  const [rep, setRep] = useState(false)
  if (!o) return <main className="px-5"><AppHeader back /><p className="mt-10 text-center text-muted">Order not found.</p></main>
  const st = stageOf(o)
  return (
    <main className="px-5 pb-32">
      <AppHeader back="/app/orders" title={o.code} />
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-2 rounded-[32px] bg-navy p-6 text-white shadow-[var(--shadow-float)]">
        <p className="text-[13px] font-semibold text-white/70">{st === 3 ? 'Delivered' : 'Arriving by'}</p>
        <p className="mt-1 text-[28px] font-extrabold">{fmtDay(addDays(new Date(o.placedAt), st === 3 ? 4 : 5))}</p>
        <p className="mt-1 flex items-center gap-2 text-[14px] text-white/80"><Truck className="size-4" /> {st >= 2 ? 'Shiprocket · AWB 7812 4410 0291' : 'Being prepared with care'}</p>
      </motion.section>

      <section className="card mt-4 p-5">
        <h2 className="h-section">Tracking</h2>
        <ol className="mt-4">
          {STAGES.map((s, i) => {
            const done = i <= st
            return (
              <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
                {i < STAGES.length - 1 && <span className="absolute left-[13px] top-7 h-[calc(100%-20px)] w-[3px] overflow-hidden rounded-full bg-peri-100"><motion.span className="block w-full bg-navy" initial={{ height: 0 }} animate={{ height: i < st ? '100%' : '0%' }} transition={{ duration: 0.6, delay: 0.3 + i * 0.25, ease }} /></span>}
                <motion.span className={cx('relative grid size-7 shrink-0 place-items-center rounded-full', done ? 'bg-navy text-white' : 'bg-peri-100')} initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + i * 0.25, type: 'spring', stiffness: 400, damping: 18 }}>
                  {done ? <Check className="size-4" strokeWidth={3} /> : <span className="size-2 rounded-full bg-white" />}
                  {i === st && st < 3 && <motion.span className="absolute inset-0 rounded-full ring-4 ring-navy/25" animate={{ scale: [1, 1.5], opacity: [0.8, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />}
                </motion.span>
                <div><p className={cx('text-[15px] font-bold', done ? 'text-navy' : 'text-muted')}>{s}</p><p className="text-[13px] text-muted">{done ? fmtDay(addDays(new Date(o.placedAt), [0, 1, 2, 4][i])) : 'Pending'}</p></div>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="card mt-4 p-5">
        <h2 className="h-section">Items</h2>
        <ul className="mt-3 space-y-2">{o.lines.map((l) => <li key={l.key} className="flex justify-between text-[14px]"><span>{l.name} · {l.label} × {l.qty}{l.kind === 'remedy' && l.pricePaise === 0 && <span className="ml-1.5 rounded-full bg-sage-100 px-2 py-0.5 text-[11px] font-bold text-sage-text">Included</span>}</span><span className="font-semibold tnum">{l.pricePaise ? formatINR(l.pricePaise * l.qty) : '₹0'}</span></li>)}</ul>
        {o.discountPaise ? <div className="mt-2 flex justify-between text-[14px] font-semibold text-sage-text"><span>🎁 {o.coupon}</span><span className="tnum">−{formatINR(o.discountPaise)}</span></div> : null}
        {o.subscribed?.length ? <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-peri-50 px-3 py-1 text-[12px] font-bold text-navy">🔁 Subscribed · every 30 days</p> : null}
        <div className="mt-3 flex justify-between border-t border-line pt-3 text-[16px] font-extrabold text-navy"><span>Paid</span><span className="tnum">{formatINR(o.totalPaise)}</span></div>
        <p className="mt-2 text-[13px] text-muted">To {o.address.name}, {o.address.line1}, {o.address.city} {o.address.pin}</p>
      </section>

      {st === 3 && <ReviewCard id={o.id} review={o.review} />}
      {st === 3 && <Btn full variant="white" className="mt-4" onClick={() => setRep(true)}><Package className="size-5" /> Request a replacement</Btn>}
      <ReplacementSheet open={rep} onClose={() => setRep(false)} lines={o.lines.map((l) => l.name)} />
    </main>
  )
}

function ReplacementSheet({ open, onClose, lines }: { open: boolean; onClose: () => void; lines: string[] }) {
  const [items, setItems] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [photo, setPhoto] = useState<string>()
  const [sent, setSent] = useState(false)
  return (
    <Sheet open={open} onClose={() => { onClose(); setSent(false) }} title="Request a replacement" tall>
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div key="ok" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-sage-100 text-sage-text"><Check className="size-8" strokeWidth={3} /></span>
            <p className="mt-4 text-[20px] font-extrabold text-navy">We’re on it</p>
            <p className="mt-1 text-[14px] text-muted">Our team will review your photo and send a replacement. We’ll message you within a day.</p>
          </motion.div>
        ) : (
          <motion.div key="form">
            <h2 className="h-duo text-[24px]">Request a <em>replacement</em></h2>
            <p className="mt-2 text-[14px] text-muted">For damaged, leaking or wrong items. We don’t offer returns for change of mind.</p>
            <p className="mb-2 mt-4 text-[14px] font-bold text-navy">Which items?</p>
            <div className="flex flex-wrap gap-2">{lines.map((l) => <Chip key={l} on={items.includes(l)} onClick={() => setItems(items.includes(l) ? items.filter((x) => x !== l) : [...items, l])}>{l}</Chip>)}</div>
            <p className="mb-2 mt-4 text-[14px] font-bold text-navy">What happened?</p>
            <div className="flex flex-wrap gap-2">{['Damaged', 'Leaking', 'Wrong item', 'Missing item'].map((r) => <Chip key={r} on={reason === r} onClick={() => setReason(r)}>{r}</Chip>)}</div>
            <label className="mt-4 flex h-28 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-[20px] border-2 border-dashed border-[#c9cfe1] text-[14px] font-semibold text-navy">
              {photo ? <img src={photo} alt="Your photo" className="h-full w-full object-cover" /> : <><Camera className="size-5" /> Add a photo (required)</>}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhoto(URL.createObjectURL(f)) }} />
            </label>
            <Btn full className="mt-5" disabled={!items.length || !reason || !photo} onClick={() => { setSent(true); toast('Replacement requested') }}>Send request</Btn>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  )
}

/** owner 2026-11-18: ask for a product review after delivery (also sent on WhatsApp a few days after delivery by the team). */
function ReviewCard({ id, review }: { id: string; review?: { rating: number; text: string } }) {
  const save = useApp((s) => s.reviewOrder)
  const [rating, setRating] = useState(review?.rating ?? 0)
  const [text, setText] = useState(review?.text ?? '')
  if (review) return (
    <section className="card mt-4 flex items-center gap-3 p-5">
      <span className="text-[24px]" aria-hidden>💛</span>
      <p className="flex-1 text-[14px] text-muted"><b className="text-navy">Thank you for your review.</b> {'★'.repeat(review.rating)}</p>
    </section>
  )
  return (
    <section className="card mt-4 p-5">
      <h2 className="h-section">How are you liking it?</h2>
      <p className="mt-1 text-[13px] text-muted">Your review helps others find their ritual. We’ll also check in on WhatsApp.</p>
      <div className="mt-3 flex gap-1.5" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <motion.button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} of 5`} whileTap={{ scale: 0.85 }} onClick={() => setRating(n)}
            className={cx('grid size-11 place-items-center rounded-full text-[22px]', n <= rating ? 'bg-marigold-100 text-[#b58a3c]' : 'bg-peri-50 text-[#c7cbe0]')}>★</motion.button>
        ))}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 500))} rows={2} placeholder="A line about how it feels (optional)" aria-label="Your review"
        className="mt-3 w-full resize-none rounded-[18px] bg-peri-50/70 p-3.5 text-[15px] outline-none focus:ring-2 focus:ring-blue" />
      <Btn size="md" className="mt-3" disabled={!rating} onClick={() => { save(id, rating, text.trim()); toast('Thank you for your review') }}>Send review</Btn>
    </section>
  )
}
