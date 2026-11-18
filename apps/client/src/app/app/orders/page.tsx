'use client'
/** @module commerce-ux @owner CLIENT @screens CL-41 My orders */
import Link from 'next/link'
import { motion } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import { ProductArt } from '@/components/brand'
import { AppHeader } from '@/components/shell'
import { BtnLink } from '@/components/ui'
import { useApp } from '@/lib/store'
import { fmtDay, formatINR } from '@/lib/format'
import { variantById } from '@/lib/data'
import { STAGES, stageOf } from '@/lib/orders'
import { BP } from '@/lib/asset'

const orderArt = (o: { lines: { key: string; kind: string }[] }) => {
  const l = o.lines.find((x) => x.kind === 'product') ?? o.lines[0]
  const v = l && variantById(l.key)
  return v ? v.product : { art: 'products/bach-remedy-dropper', tint: ['#e5efe2', '#f1f6ec'] as [string, string], name: '', color: '#5E8F6A' }
}

export default function Orders() {
  const orders = useApp((s) => s.orders)
  return (
    <main className="px-5 pb-32">
      <AppHeader back="/app/me" />
      <h1 className="h-duo pt-2">My <em>orders</em></h1>
      <div className="mt-5 space-y-3">
        {orders.length === 0 ? (
          <div className="card flex flex-col items-center p-8 text-center"><img src={`${BP}/img/owl-bottle.webp`} alt="" className="h-28" /><p className="mt-3 text-[16px] font-bold text-navy">No orders yet</p><BtnLink href="/app/shop" size="md" className="mt-4">Visit the shop</BtnLink></div>
        ) : orders.map((o, i) => (
          <motion.div key={o.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link href={`/app/orders/view?id=${o.id}`} className="card flex items-center gap-3 p-3">
              <ProductArt product={orderArt(o)} size="sm" className="w-[76px] shrink-0" />
              <span className="flex-1">
                <span className="block text-[15px] font-bold text-navy">{o.code}</span>
                <span className="block text-[13px] text-muted">{o.lines.map((l) => l.name).join(', ')}</span>
                <span className="mt-1 inline-flex items-center gap-2 text-[12px]"><span className="rounded-full bg-sage-100 px-2 py-0.5 font-bold text-sage-text">{STAGES[stageOf(o)]}</span><span className="text-muted">{fmtDay(o.placedAt)} · {formatINR(o.totalPaise)}</span></span>
              </span>
              <ChevronRight className="size-5 text-soft" />
            </Link>
          </motion.div>
        ))}
      </div>
    </main>
  )
}
