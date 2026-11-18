'use client'
/** @module commerce-ux @owner CLIENT @screens CL-32/33/34/36 product tiles with quick add + fly-to-bag */
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { AlertTriangle, CalendarHeart, Heart, ShoppingBag } from 'lucide-react'
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
 * (or a nudge to book, if Jitu Bhaiya hasn't prepared one yet).
 */
export function useAddProduct() {
  const add = useApp((s) => s.addToCart)
  const hasBlend = useApp((s) => !!s.blend)
  const { flyToBag } = useChrome()
  const router = useRouter()
  return (p: Product, variantId: string, qty = 1, from?: DOMRect) => {
    if (p.personal && !hasBlend) { toast('Your personal blend is made after a consultation'); router.push('/app/book'); return }
    const key = p.personal ? (p.personal === 'spray' ? 'remedy-reorder-spray' : 'remedy-reorder') : variantId
    add(key, p.personal ? 1 : qty); buzz(12)
    if (from) flyToBag(from, `${BP}/img/${p.art}.webp`)
    toast(p.personal ? 'Your blend is in the bag' : `${productTitle(p)} added to your bag`)
  }
}

export function ProductCard({ p, i = 0, wide }: { p: Product; i?: number; wide?: boolean }) {
  const addProduct = useAddProduct()
  const hasBlend = useApp((s) => !!s.blend)
  const wish = useApp((s) => s.wishlist.includes(p.slug))
  const toggleWish = useApp((s) => s.toggleWish)
  const allergies = useApp((s) => s.profile?.allergies ?? [])
  const ref = useRef<HTMLDivElement>(null)
  const v = p.variants[p.variants.length - 1]
  const hit = allergyHit(p, allergies)
  const title = productTitle(p)
  const bookFirst = p.personal && !hasBlend
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`card relative flex flex-col p-2.5 ${wide ? 'w-[172px] shrink-0' : ''}`}>
      <Link href={`/app/shop/${p.slug}`} className="block" aria-label={title}>
        <div ref={ref}><ProductArt product={p} /></div>
        <div className="px-1.5 pt-2.5">
          <p className="text-[15px] font-bold leading-tight text-navy">{title}</p>
          <p className="mt-0.5 text-[12px] text-muted">{p.personal ? `Made for you · ${v.label}` : `${v.label} · ${p.format}`}</p>
          {hit && <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-rose"><AlertTriangle className="size-3" /> Contains {hit}</p>}
        </div>
      </Link>
      <div className="mt-auto flex items-center justify-between px-1.5 pb-0.5 pt-2">
        <span className="text-[16px] font-extrabold text-navy tnum">{formatINR(v.pricePaise)}</span>
        <motion.button whileTap={{ scale: 0.85 }} aria-label={bookFirst ? `Book a consultation for ${title}` : `Add ${title} to bag`}
          onClick={() => addProduct(p, v.id, 1, ref.current?.getBoundingClientRect())}
          className="grid size-10 place-items-center rounded-full bg-navy text-white shadow-[var(--shadow-cta)]">
          {bookFirst ? <CalendarHeart className="size-[18px]" /> : <ShoppingBag className="size-[18px]" />}
        </motion.button>
      </div>
      <motion.button whileTap={{ scale: 0.8 }} aria-label={wish ? 'Remove from saved' : 'Save for later'} aria-pressed={wish} onClick={() => { toggleWish(p.slug); buzz(6) }}
        className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-white/85 backdrop-blur">
        <motion.span key={String(wish)} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
          <Heart className={`size-[18px] ${wish ? 'fill-navy text-navy' : 'text-navy'}`} />
        </motion.span>
      </motion.button>
    </motion.div>
  )
}
