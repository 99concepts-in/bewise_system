'use client'
/**
 * @module   commerce-ux
 * @owner    CLIENT (UI) · MANAGER owns catalog
 * @screens  CL-32 Shop · CL-33 Collection · CL-34 Search · CL-36 Saved
 * @flag(store) seeded placeholder products until the owner's list (2026-11-18)
 */
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { Heart, Search, ShoppingBag, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ProductCard } from '@/components/product-card'
import { AppHeader } from '@/components/shell'
import { IconBtn, Item, Reveal, buzz, cx, spring } from '@/components/ui'
import { COLLECTIONS, PRODUCTS } from '@/lib/data'
import { useApp } from '@/lib/store'

export default function Shop() {
  const router = useRouter()
  const [col, setCol] = useState<string>('all')
  const [q, setQ] = useState('')
  const [searching, setSearching] = useState(false)
  const [saved, setSaved] = useState(false)
  const wishlist = useApp((s) => s.wishlist)
  const bag = useApp((s) => s.cart.reduce((n, l) => n + l.qty, 0))
  const list = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return PRODUCTS.filter((p) => (saved ? wishlist.includes(p.slug) : true) && (col === 'all' || p.collection === col) && (!ql || `${p.name} ${p.tagline} ${p.ingredients}`.toLowerCase().includes(ql)))
  }, [q, col, saved, wishlist])
  const tile = (key: string) => {
    buzz(6)
    if (key === 'consult') return router.push('/app/book')
    if (key === 'remedies') return router.push('/app/remedies')
    setCol(key); setSaved(false); document.getElementById('grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="px-5 pb-32">
      <AppHeader right={<>
        <IconBtn label="Search" onClick={() => setSearching(true)}><Search className="size-5" /></IconBtn>
        <IconBtn label={`Bag, ${bag} items`} href="/app/bag" badge={bag || undefined}><ShoppingBag className="size-5" /></IconBtn>
      </>} />
      <Reveal className="space-y-5">
        <Item><h1 className="h-duo pt-2">Little <em>rituals</em></h1></Item>

        <AnimatePresence>
          {searching && (
            <motion.label initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 56 }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 overflow-hidden rounded-full bg-white px-5 shadow-[var(--shadow-card)]">
              <Search className="size-5 text-navy" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search oils, mists, salts…" aria-label="Search products" className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-soft" />
              <button aria-label="Close search" onClick={() => { setQ(''); setSearching(false) }}><X className="size-5 text-muted" /></button>
            </motion.label>
          )}
        </AnimatePresence>

        {!q && (
          <Item>
            <Link href="/app/shop/sleep-oil" className="relative block h-[190px] overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#e9e4fb,#f8eef3_60%,#fbf3dc)] p-6 shadow-[var(--shadow-card)]">
              <motion.img src="/img/moon.webp" alt="" aria-hidden className="absolute -right-6 -top-4 h-[120px] opacity-90" animate={{ y: [0, -6, 0] }} transition={{ duration: 6, repeat: Infinity }} />
              <motion.img src="/img/p-dropper.webp" alt="" aria-hidden className="absolute bottom-4 right-10 h-[140px] drop-shadow-[0_16px_16px_rgba(24,41,87,.2)]" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring, delay: 0.2 }} />
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-peri">The evening ritual</p>
              <p className="mt-1 max-w-[180px] text-[24px] font-extrabold leading-tight tracking-[-0.02em] text-navy">Wind down, <span className="text-soft">gently</span></p>
              <span className="mt-4 inline-flex h-10 items-center rounded-full bg-navy px-5 text-[14px] font-semibold text-white">Explore</span>
            </Link>
          </Item>
        )}

        {!q && (
          <Item>
            <div className="grid grid-cols-3 gap-2.5">
              {COLLECTIONS.map((c, i) => (
                <motion.button key={c.key} onClick={() => tile(c.key)} whileTap={{ scale: 0.95 }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.04 }}
                  className={cx('relative flex h-[118px] flex-col justify-end overflow-hidden rounded-[24px] p-2.5 text-left shadow-[var(--shadow-card)]', col === c.key && 'ring-2 ring-navy')} style={{ background: c.tint }}>
                  <img src={`/img/${c.img}.webp`} alt="" aria-hidden className="multiply absolute inset-x-0 top-0 h-[84px] w-full object-cover object-top" loading="lazy" />
                  <span className="relative rounded-full bg-white/85 px-2.5 py-1 text-center text-[12px] font-bold text-navy backdrop-blur">{c.label}</span>
                </motion.button>
              ))}
            </div>
          </Item>
        )}

        {!q && col === 'all' && !saved && (
          <Item>
            <div className="mb-3 flex items-baseline justify-between"><h2 className="h-section">For restful evenings</h2></div>
            <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
              {PRODUCTS.filter((p) => ['sleep', 'bath'].includes(p.collection)).map((p, i) => <ProductCard key={p.slug} p={p} i={i} wide />)}
            </div>
          </Item>
        )}

        <Item id="grid">
          <div className="no-scrollbar -mx-5 mb-3 flex gap-2 overflow-x-auto px-5" role="tablist" aria-label="Collections">
            {[{ key: 'all', label: 'All' }, ...COLLECTIONS.filter((c) => !['remedies', 'consult'].includes(c.key))].map((c) => (
              <button key={c.key} role="tab" aria-selected={col === c.key && !saved} onClick={() => { setCol(c.key); setSaved(false) }} className={cx('relative h-10 shrink-0 rounded-full px-4 text-[14px] font-semibold', col === c.key && !saved ? 'text-white' : 'bg-white text-navy shadow-[var(--shadow-card)]')}>
                {col === c.key && !saved && <motion.span layoutId="col-pill" transition={spring} className="absolute inset-0 rounded-full bg-navy" />}
                <span className="relative">{c.label}</span>
              </button>
            ))}
            <button role="tab" aria-selected={saved} onClick={() => { setSaved(!saved); setCol('all') }} className={cx('relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[14px] font-semibold', saved ? 'text-white' : 'bg-white text-navy shadow-[var(--shadow-card)]')}>
              {saved && <motion.span layoutId="col-pill" transition={spring} className="absolute inset-0 rounded-full bg-navy" />}
              <Heart className={cx('relative size-4', saved && 'fill-white')} /><span className="relative">Saved{wishlist.length ? ` ${wishlist.length}` : ''}</span>
            </button>
          </div>
          {list.length === 0 ? (
            <div className="card p-8 text-center">
              <img src="/img/owl-read.webp" alt="" className="mx-auto h-24" />
              <p className="mt-3 text-[15px] font-semibold text-navy">{saved ? 'Tap ♡ on anything you love — it’ll wait here.' : q ? `Nothing found for “${q}”` : 'Nothing here yet'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">{list.map((p, i) => <ProductCard key={p.slug} p={p} i={i} />)}</div>
          )}
        </Item>
      </Reveal>
    </main>
  )
}
