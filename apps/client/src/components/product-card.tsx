'use client'
/** @module commerce-ux @owner CLIENT @screens CL-32/33/34/36 product tiles with quick add + fly-to-bag */
import { goSafe } from '@/lib/nav'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, CalendarHeart, Check, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useRef } from 'react'
import { ProductArt } from './brand'
import { buzz, toast, useChrome } from './ui'
import { productTitle, type Product } from '@/lib/data'
import { useApp } from '@/lib/store'
import { formatINR } from '@/lib/format'
import { BP } from '@/lib/asset'

export const allergyHit = (p: Product, allergies: string[]) => p.allergens.find((a) => allergies.some((x) => x.includes(a) || a.includes(x)))

/**
 * Adding to bag. Personal Bach blends are made after a consultation, so they become a reorder of the client's own blend
 * (or a nudge to book, if Jitendra Khimlani hasn't prepared one yet).
 */
export function useAddProduct() {
  const add = useApp((s) => s.addToCart)
  const hasBlend = useApp((s) => !!s.blend)
  const { flyToBag } = useChrome()
  const router = useRouter()
  return (p: Product, variantId: string, qty = 1, from?: DOMRect) => {
    if (p.soldOut) { toast('Sold out for now. We’ll restock soon'); return }
    if (p.personal && !hasBlend) { toast('Your personal blend is made after a wellness session'); goSafe(router, '/app/book'); return }
    const key = p.personal ? (p.personal === 'spray' ? 'remedy-reorder-spray' : 'remedy-reorder') : variantId
    add(key, p.personal ? 1 : qty); buzz(12)
    if (from) flyToBag(from, `${BP}/img/${p.art}.webp`)
    toast(p.personal ? 'Your blend is in the cart' : `${productTitle(p)} added to cart`)
  }
}

export function ProductCard({ p, i = 0, wide }: { p: Product; i?: number; wide?: boolean }) {
  const addProduct = useAddProduct()
  const hasBlend = useApp((s) => !!s.blend)
  const allergies = useApp((s) => s.profile?.allergies ?? [])
  const ref = useRef<HTMLDivElement>(null)
  const cartKey = p.personal ? (p.personal === 'spray' ? 'remedy-reorder-spray' : 'remedy-reorder') : p.variants[p.variants.length - 1].id
  const inCart = useApp((s) => s.cart.find((l) => l.key === cartKey)?.qty ?? 0)
  const setQty = useApp((s) => s.setQty)
  const v = p.variants[p.variants.length - 1]
  const hit = allergyHit(p, allergies)
  const title = productTitle(p)
  const bookFirst = p.personal && !hasBlend
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`card relative flex flex-col p-2.5 ${wide ? 'w-[172px] shrink-0' : ''}`}>
      <Link href={`/app/shop/${p.slug}`} className="block" aria-label={title}>
        <div ref={ref} className="relative"><ProductArt product={p} className={p.soldOut ? 'opacity-70 grayscale-[35%]' : undefined} />
          {p.soldOut && <span className="absolute left-2.5 top-2.5 rounded-full bg-navy px-2.5 py-1 text-[11px] font-bold text-white">Sold out</span>}</div>
        <div className="px-1.5 pt-2.5">
          <p className="font-display text-[16px] font-semibold leading-5 text-ink">{title}</p>
          <p className="mt-0.5 text-[12px] text-ink-2">{p.personal ? `Made for you · ${v.label}` : `${v.label} · ${p.format}`}</p>
          {hit && <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-rose"><AlertTriangle className="size-3" /> Contains {hit}</p>}
        </div>
      </Link>
      <div className="mt-auto px-1.5 pb-0.5 pt-2">
        <span className="text-[16px] font-semibold text-ink tnum">{formatINR(v.pricePaise)}</span>
        {/* owner 2026-11-18: a plain "Add to cart", then a counter once it's in the cart */}
        <div className="mt-2 h-11">
          <AnimatePresence mode="wait" initial={false}>
            {p.soldOut ? (
              <span key="sold" className="flex h-11 w-full items-center justify-center rounded-[14px] bg-sky-100 text-[13px] font-bold text-ink-2" aria-label={`${title} is sold out`}>Sold out</span>
            ) : inCart > 0 && !p.personal ? (
              <motion.div key="qty" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.18 }}
                className="flex h-11 items-center justify-between rounded-[14px] bg-navy px-1 text-white" role="group" aria-label={`${title} in cart`}>
                <button aria-label={`One less ${title}`} onClick={() => { buzz(6); setQty(cartKey, inCart - 1) }} className="grid size-9 place-items-center rounded-[10px] bg-white/15">{inCart === 1 ? <Trash2 className="size-3.5" /> : <Minus className="size-3.5" />}</button>
                <AnimatePresence mode="popLayout" initial={false}><motion.span key={inCart} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} className="text-[15px] font-bold tnum" aria-live="polite">{inCart}</motion.span></AnimatePresence>
                <button aria-label={`One more ${title}`} onClick={() => { buzz(6); if (inCart < 10) addProduct(p, v.id, 1, ref.current?.getBoundingClientRect()) }} className="grid size-9 place-items-center rounded-[10px] bg-white/15"><Plus className="size-3.5" /></button>
              </motion.div>
            ) : (
              <motion.button key="add" whileTap={{ scale: 0.95 }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.18 }}
                aria-label={bookFirst ? `Book a session for ${title}` : inCart ? `${title} is in your cart` : `Add ${title} to cart`}
                onClick={() => (inCart ? undefined : addProduct(p, v.id, 1, ref.current?.getBoundingClientRect()))}
                className={`flex h-11 w-full items-center justify-center gap-1.5 rounded-[14px] font-display text-[15px] font-semibold ${inCart ? 'bg-teal-100 text-sage-text' : 'bg-navy text-white'}`}>
                {bookFirst ? <><CalendarHeart className="size-4" /> Book first</> : inCart ? <><Check className="size-4" strokeWidth={3} /> In cart</> : <><ShoppingBag className="size-4" /> Add to cart</>}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* owner 2026-11-18: a cart icon instead of the heart */}
      {!p.soldOut && !bookFirst && (
        <motion.button whileTap={{ scale: 0.8 }} aria-label={inCart ? `${title}: ${inCart} in cart, add one more` : `Add ${title} to cart`}
          onClick={() => { if (!(p.personal && inCart)) addProduct(p, v.id, 1, ref.current?.getBoundingClientRect()) }}
          className={`absolute right-3.5 top-3.5 grid size-10 place-items-center rounded-full shadow-[var(--shadow-card)] backdrop-blur ${inCart ? 'bg-navy text-white' : 'bg-white/90 text-navy'}`}>
          <ShoppingBag className="size-[18px]" />
          {inCart > 0 && <motion.span key={inCart} initial={{ scale: 0.4 }} animate={{ scale: 1 }} className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#f6de8d] text-[11px] font-extrabold text-navy tnum">{inCart}</motion.span>}
        </motion.button>
      )}
    </motion.div>
  )
}
