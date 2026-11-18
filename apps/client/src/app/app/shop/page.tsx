'use client'
/**
 * @module   commerce-ux
 * @owner    CLIENT (UI) · MANAGER owns catalog
 * @screens  CL-32 Shop · CL-33 Collection · CL-34 Search · CL-36 Saved
 * Catalogue: the owner's product range (2026-11-18): roll-on oils, aura sprays, Bach remedies, bath salts, hair & beauty.
 */
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { Heart, Search, ShoppingBag, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ProductCard } from '@/components/product-card'
import { AppHeader } from '@/components/shell'
import { IconBtn, Item, Reveal, buzz, cx, spring } from '@/components/ui'
import { CATEGORIES, INTENTS, PRODUCTS, productBySlug, productTitle, type Category, type Intent } from '@/lib/data'
import { couponOk, useApp } from '@/lib/store'
import { BP } from '@/lib/asset'

const PILLS: { key: Category | 'all'; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'rollons', label: 'Roll-ons' }, { key: 'sprays', label: 'Sprays' },
  { key: 'remedies', label: 'Remedies' }, { key: 'bath', label: 'Bath salts' }, { key: 'care', label: 'Hair & beauty' },
]
const LOVED = ['abundance-roll-on', 'sleep-roll-on', 'rescue-remedy', 'protection-spray', 'aura-bath-salt', 'hair-oil']

export default function Shop() {
  const router = useRouter()
  const [cat, setCat] = useState<Category | 'all'>('all')
  const [intent, setIntent] = useState<Intent | null>(null)
  const [q, setQ] = useState('')
  const [searching, setSearching] = useState(false)
  const [saved, setSaved] = useState(false)
  const wishlist = useApp((s) => s.wishlist)
  const coupon = useApp((s) => s.coupon)
  const bag = useApp((s) => s.cart.reduce((n, l) => n + l.qty, 0))
  const list = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return PRODUCTS.filter((p) => (saved ? wishlist.includes(p.slug) : true) && (cat === 'all' || p.category === cat) && (!intent || p.intents.includes(intent))
      && (!ql || `${productTitle(p)} ${p.tagline} ${p.format} ${p.feel.join(' ')} ${p.intents.join(' ')}`.toLowerCase().includes(ql)))
  }, [q, cat, intent, saved, wishlist])
  const toGrid = () => requestAnimationFrame(() => document.getElementById('grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  const pickCat = (key: Category | 'consult') => {
    buzz(6)
    if (key === 'consult') return router.push('/app/book')
    setCat(key); setIntent(null); setSaved(false); toGrid()
  }
  const pickIntent = (key: Intent) => { buzz(6); setIntent(key); setCat('all'); setSaved(false); toGrid() }
  const browsing = !q && cat === 'all' && !intent && !saved
  const intentInfo = INTENTS.find((x) => x.key === intent)

  return (
    <main className="px-5 pb-32">
      <AppHeader right={<>
        <IconBtn label="Search" onClick={() => setSearching(true)}><Search className="size-5" /></IconBtn>
        <IconBtn label={`Bag, ${bag} items`} href="/app/bag" badge={bag || undefined}><ShoppingBag className="size-5" /></IconBtn>
      </>} />
      <Reveal className="space-y-6">
        <Item>
          <h1 className="h-duo pt-2">Little <em>rituals</em></h1>
          <p className="mt-1 text-[14px] text-muted">Aromatherapy and Bach remedies, made with care 🌿</p>
        </Item>
        {couponOk(coupon) && (
          <Item>
            <div className="flex items-center gap-3 rounded-[22px] border border-dashed border-[#d9b35a] bg-[#fbf3dc] p-3.5">
              <span className="text-[24px]" aria-hidden>🎁</span>
              <span className="flex-1 text-[14px] leading-5 text-[#6b5320]"><b>{coupon!.pct}% off everything</b> on your first order. Applied at checkout · code {coupon!.code}</span>
              <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[12px] font-bold text-rose">{Math.max(1, Math.ceil((+new Date(coupon!.expiresAt) - Date.now()) / 864e5))}d left</span>
            </div>
          </Item>
        )}

        <AnimatePresence>
          {searching && (
            <motion.label initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 56 }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 overflow-hidden rounded-full bg-white px-5 shadow-[var(--shadow-card)]">
              <Search className="size-5 text-navy" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search roll-ons, sprays, salts…" aria-label="Search products" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted" />
              <button aria-label="Close search" onClick={() => { setQ(''); setSearching(false) }}><X className="size-5 text-muted" /></button>
            </motion.label>
          )}
        </AnimatePresence>

        {browsing && (
          <Item>
            <button onClick={() => pickIntent('sleep')} className="relative block h-[200px] w-full overflow-hidden rounded-[30px] bg-[linear-gradient(140deg,#dfe6f8,#ebe6fa_55%,#f6eef3)] p-6 text-left shadow-[var(--shadow-card)]">
              <motion.img src={`${BP}/img/moon.webp`} alt="" aria-hidden className="absolute -top-5 right-[38%] h-[84px] opacity-80" animate={{ y: [0, -6, 0] }} transition={{ duration: 6, repeat: Infinity }} />
              <motion.img src={`${BP}/img/products/sleep-spray.webp`} alt="" aria-hidden className="absolute bottom-3 right-[70px] h-[150px] drop-shadow-[0_14px_14px_rgba(24,41,87,.2)]" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring, delay: 0.15 }} />
              <motion.img src={`${BP}/img/products/sleep-rollon.webp`} alt="" aria-hidden className="absolute bottom-3 right-5 h-[136px] rotate-[6deg] drop-shadow-[0_14px_14px_rgba(24,41,87,.2)]" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring, delay: 0.25 }} />
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-peri">The evening ritual</p>
              <p className="mt-1 max-w-[160px] text-[24px] font-extrabold leading-tight tracking-[-0.02em] text-navy">Wind down, <span className="text-soft">gently</span></p>
              <span className="mt-4 inline-flex h-10 items-center rounded-full bg-navy px-5 text-[14px] font-semibold text-white">Shop sleep</span>
            </button>
          </Item>
        )}

        {browsing && (
          <Item>
            <h2 className="h-section mb-3">Shop by category</h2>
            <div className="grid grid-cols-3 gap-2.5">
              {CATEGORIES.map((c, i) => (
                <motion.button key={c.key} onClick={() => pickCat(c.key)} whileTap={{ scale: 0.95 }} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08 + i * 0.04 }}
                  className="relative flex h-[132px] flex-col justify-end overflow-hidden rounded-[24px] p-2.5 text-left shadow-[var(--shadow-card)]" style={{ background: c.tint }}>
                  <CatArt art={c.art} consult={c.key === 'consult'} />
                  <span className="relative block rounded-[14px] bg-white/90 px-2 py-1.5 backdrop-blur">
                    <span className="block text-[12px] font-bold leading-tight text-navy">{c.label}</span>
                    <span className="block text-[11px] leading-tight text-muted">{c.sub}</span>
                  </span>
                </motion.button>
              ))}
            </div>
          </Item>
        )}

        {browsing && (
          <Item>
            <h2 className="h-section mb-3">How do you want to feel?</h2>
            <div className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1">
              {INTENTS.map((x) => (
                <motion.button key={x.key} whileTap={{ scale: 0.95 }} onClick={() => pickIntent(x.key)}
                  className="flex w-[132px] shrink-0 flex-col items-start rounded-[22px] p-3.5 text-left shadow-[var(--shadow-card)]" style={{ background: x.tint }}>
                  <span className="grid size-10 place-items-center rounded-full bg-white/80 text-[20px]" aria-hidden>{x.emoji}</span>
                  <span className="mt-2.5 text-[15px] font-bold text-navy">{x.label}</span>
                  <span className="text-[12px] leading-4 text-muted">{x.line}</span>
                </motion.button>
              ))}
            </div>
          </Item>
        )}

        {browsing && (
          <Item>
            <h2 className="h-section mb-3">Most loved</h2>
            <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
              {LOVED.map((s, i) => { const p = productBySlug(s); return p ? <ProductCard key={s} p={p} i={i} wide /> : null })}
            </div>
          </Item>
        )}

        <Item id="grid" className="scroll-mt-24">
          {intentInfo && (
            <div className="mb-3 flex items-center gap-3 rounded-[22px] p-3.5" style={{ background: intentInfo.tint }}>
              <span className="grid size-10 place-items-center rounded-full bg-white/80 text-[20px]" aria-hidden>{intentInfo.emoji}</span>
              <span className="flex-1"><span className="block text-[16px] font-bold text-navy">{intentInfo.label}</span><span className="text-[13px] text-muted">{intentInfo.line}</span></span>
              <button onClick={() => setIntent(null)} aria-label={`Clear ${intentInfo.label}`} className="grid size-9 place-items-center rounded-full bg-white/80 text-navy"><X className="size-4" /></button>
            </div>
          )}
          <div className="no-scrollbar -mx-5 mb-3 flex gap-2 overflow-x-auto px-5" role="tablist" aria-label="Categories">
            {PILLS.map((c) => (
              <button key={c.key} role="tab" aria-selected={cat === c.key && !saved} onClick={() => { setCat(c.key); setSaved(false) }} className={cx('relative h-10 shrink-0 rounded-full px-4 text-[14px] font-semibold', cat === c.key && !saved ? 'text-white' : 'bg-white text-navy shadow-[var(--shadow-card)]')}>
                {cat === c.key && !saved && <motion.span layoutId="col-pill" transition={spring} className="absolute inset-0 rounded-full bg-navy" />}
                <span className="relative">{c.label}</span>
              </button>
            ))}
            <button role="tab" aria-selected={saved} onClick={() => { setSaved(!saved); setCat('all'); setIntent(null) }} className={cx('relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[14px] font-semibold', saved ? 'text-white' : 'bg-white text-navy shadow-[var(--shadow-card)]')}>
              {saved && <motion.span layoutId="col-pill" transition={spring} className="absolute inset-0 rounded-full bg-navy" />}
              <Heart className={cx('relative size-4', saved && 'fill-white')} /><span className="relative">Saved{wishlist.length ? ` ${wishlist.length}` : ''}</span>
            </button>
          </div>
          {list.length === 0 ? (
            <div className="card p-8 text-center">
              <img src={`${BP}/img/owl-read.webp`} alt="" className="mx-auto h-24" />
              <p className="mt-3 text-[15px] font-semibold text-navy">{saved ? 'Tap ♡ on anything you love and it’ll wait here.' : q ? `Nothing found for “${q}”` : 'Nothing here yet'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">{list.map((p, i) => <ProductCard key={p.slug} p={p} i={i} />)}</div>
          )}
          <p className="mt-5 px-2 text-center text-[12px] leading-5 text-muted">Aromatherapy and Bach remedies support comfort and emotional wellbeing. They are not medicines and do not replace your doctor’s care.</p>
        </Item>
      </Reveal>
    </main>
  )
}

/** Category tile art: up to three product photos fanned out, or Jitu Bhaiya for the consultation tile. */
function CatArt({ art, consult }: { art: string[]; consult?: boolean }) {
  if (consult) return <img src={`${BP}/img/jitu.webp`} alt="" aria-hidden loading="lazy" className="absolute left-1/2 top-3 size-[66px] -translate-x-1/2 rounded-full object-cover ring-4 ring-white/80" />
  const n = art.length
  return (
    <span className="absolute inset-x-0 top-2 flex h-[76px] items-end justify-center" aria-hidden>
      {art.map((a, i) => {
        const wide = a.includes('bath-salt')
        const rot = n === 1 ? 0 : (i - (n - 1) / 2) * 9
        return (
          <img key={a} src={`${BP}/img/${a}.webp`} alt="" loading="lazy" draggable={false}
            className={cx('object-contain drop-shadow-[0_6px_6px_rgba(24,41,87,.16)]', wide ? 'h-[66px]' : n > 2 ? 'h-[72px]' : 'h-[76px]', n > 1 && '-mx-1.5')}
            style={{ transform: `rotate(${rot}deg) translateY(${Math.abs(rot) * 0.3}px)`, zIndex: i === Math.floor(n / 2) ? 2 : 1 }} />
        )
      })}
    </span>
  )
}
