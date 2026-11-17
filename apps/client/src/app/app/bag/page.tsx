'use client'
/** @module commerce-ux @owner CLIENT @screens CL-37 Your bag — remedy reorder + products together, server-style totals */
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, Minus, Plus, X } from 'lucide-react'
import { ProductArt } from '@/components/brand'
import { allergyHit } from '@/components/product-card'
import { AppHeader } from '@/components/shell'
import { Btn, BtnLink, toast } from '@/components/ui'
import { useApp } from '@/lib/store'
import { FREE_SHIP_PAISE, useBagTotals } from '@/lib/bag'
import { formatINR } from '@/lib/format'

export default function Bag() {
  const router = useRouter()
  const setQty = useApp((s) => s.setQty)
  const add = useApp((s) => s.addToCart)
  const allergies = useApp((s) => s.profile?.allergies ?? [])
  const { lines, sub, ship, total } = useBagTotals()
  return (
    <main className="px-5 pb-40">
      <AppHeader back />
      <h1 className="h-duo pt-2">Your <em>bag</em></h1>
      {lines.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card mt-6 flex flex-col items-center p-8 text-center">
          <img src="/img/owl-bottle.webp" alt="" className="h-36" />
          <p className="mt-3 text-[18px] font-extrabold text-navy">Your bag is empty</p>
          <p className="mt-1 text-[14px] text-muted">Little rituals are waiting.</p>
          <BtnLink href="/app/shop" size="md" className="mt-5">Explore the shop</BtnLink>
        </motion.div>
      ) : (
        <>
          <ul className="mt-5 space-y-3">
            <AnimatePresence initial={false}>
              {lines.map(({ l, i }) => {
                const info = i!
                const hit = info.kind === 'product' && info.product ? allergyHit(info.product, allergies) : undefined
                return (
                  <motion.li key={l.key} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60, height: 0, marginTop: 0 }} transition={{ duration: 0.3 }} className="card flex items-center gap-3 p-3">
                    <ProductArt product={info.product ?? { art: 'p-dropper', tint: ['#fbf3dc', '#f6efe4'], name: info.name }} size="sm" className="w-[84px] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold text-navy">{info.name} · {info.label}</p>
                      {info.kind === 'remedy' && <span className="mt-0.5 inline-block rounded-full bg-sage-100 px-2 py-0.5 text-[11px] font-bold text-sage-text">Remedy</span>}
                      {hit && <p className="mt-0.5 flex items-center gap-1 text-[12px] font-semibold text-rose"><AlertTriangle className="size-3" /> Contains {hit}</p>}
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[16px] font-extrabold text-navy tnum">{formatINR(info.pricePaise * l.qty)}</span>
                        {info.kind === 'product' && (
                          <div className="flex h-9 items-center rounded-full bg-peri-50">
                            <button aria-label="Fewer" onClick={() => setQty(l.key, l.qty - 1)} className="grid size-9 place-items-center text-navy"><Minus className="size-3.5" /></button>
                            <motion.span key={l.qty} initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="w-5 text-center text-[14px] font-bold text-navy tnum">{l.qty}</motion.span>
                            <button aria-label="More" onClick={() => setQty(l.key, Math.min(10, l.qty + 1))} className="grid size-9 place-items-center text-navy"><Plus className="size-3.5" /></button>
                          </div>
                        )}
                      </div>
                    </div>
                    <button aria-label={`Remove ${info.name}`} onClick={() => { const q = l.qty; setQty(l.key, 0); toast(`${info.name} removed`, { label: 'Undo', onClick: () => add(l.key, q) }) }} className="grid size-9 shrink-0 place-items-center self-start rounded-full bg-peri-50 text-navy"><X className="size-4" /></button>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
          <section className="card mt-4 space-y-3 p-5">
            <div className="flex justify-between text-[15px]"><span className="text-muted">Subtotal <span className="block text-[12px]">GST included</span></span><span className="font-bold text-navy tnum">{formatINR(sub)}</span></div>
            <div className="flex justify-between text-[15px]"><span className="text-muted">Delivery</span><span className={ship ? 'font-bold text-navy tnum' : 'font-bold text-sage-text'}>{ship ? formatINR(ship) : 'Free'}</span></div>
            {ship > 0 && <p className="rounded-[14px] bg-peri-50 px-3 py-2 text-[12px] text-navy">Add {formatINR(FREE_SHIP_PAISE - sub)} more for free delivery</p>}
            <div className="flex justify-between border-t border-line pt-3"><span className="text-[20px] font-extrabold text-navy">Total</span><span className="text-[26px] font-extrabold text-navy tnum">{formatINR(total)}</span></div>
          </section>
          <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] bg-gradient-to-t from-[#e6eee3] via-[#e6eee3]/95 to-transparent px-5 pb-3 pt-8 safe-b">
            <Btn full variant="gradient" onClick={() => router.push('/app/checkout')}>Checkout · {formatINR(total)}</Btn>
          </div>
        </>
      )}
    </main>
  )
}
