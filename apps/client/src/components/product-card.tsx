'use client'
/** @module commerce-ux @owner CLIENT @screens CL-32/33/34/36 product tiles with quick add + fly-to-bag */
import Link from 'next/link'
import { motion } from 'motion/react'
import { AlertTriangle, Heart, ShoppingBag } from 'lucide-react'
import { useRef } from 'react'
import { ProductArt } from './brand'
import { buzz, toast, useChrome } from './ui'
import type { Product } from '@/lib/data'
import { useApp } from '@/lib/store'
import { formatINR } from '@/lib/format'
import { BP } from '@/lib/asset'

export const allergyHit = (p: Product, allergies: string[]) => p.allergens.find((a) => allergies.some((x) => x.includes(a) || a.includes(x)))

export function ProductCard({ p, i = 0, wide }: { p: Product; i?: number; wide?: boolean }) {
  const add = useApp((s) => s.addToCart)
  const wish = useApp((s) => s.wishlist.includes(p.slug))
  const toggleWish = useApp((s) => s.toggleWish)
  const allergies = useApp((s) => s.profile?.allergies ?? [])
  const { flyToBag } = useChrome()
  const ref = useRef<HTMLDivElement>(null)
  const v = p.variants[p.variants.length - 1]
  const hit = allergyHit(p, allergies)
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`card relative flex flex-col p-2.5 ${wide ? 'w-[176px] shrink-0' : ''}`}>
      <Link href={`/app/shop/${p.slug}`} className="block" aria-label={p.name}>
        <div ref={ref}><ProductArt product={p} /></div>
        <div className="px-1.5 pt-2.5">
          <p className="text-[15px] font-bold leading-tight text-navy">{p.name}</p>
          <p className="text-[12px] text-muted">{p.variants.length > 1 ? `${p.variants.length} sizes` : v.label}{hit ? '' : ` · ${p.type}`}</p>
          {hit && <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-rose"><AlertTriangle className="size-3" /> Contains {hit}</p>}
        </div>
      </Link>
      <div className="mt-auto flex items-center justify-between px-1.5 pb-0.5 pt-2">
        <span className="text-[16px] font-extrabold text-navy tnum">{p.variants.length > 1 ? 'from ' : ''}{formatINR(p.variants[0].pricePaise)}</span>
        <motion.button whileTap={{ scale: 0.85 }} aria-label={`Add ${p.name} to bag`} onClick={() => {
          add(v.id); buzz(12); const r = ref.current?.getBoundingClientRect(); if (r) flyToBag(r, `${BP}/img/${p.art}.webp`); toast(`${p.name} added to your bag`)
        }} className="grid size-10 place-items-center rounded-full bg-navy text-white shadow-[var(--shadow-cta)]"><ShoppingBag className="size-[18px]" /></motion.button>
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
