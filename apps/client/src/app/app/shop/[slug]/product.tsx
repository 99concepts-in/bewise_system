'use client'
/** @module commerce-ux @owner CLIENT @screens CL-35 Product — sizes, tabs, allergy / pregnancy warning, add to bag */
import { useParams } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, Check, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useRef, useState } from 'react'
import { ProductArt } from '@/components/brand'
import { allergyHit, useAddProduct } from '@/components/product-card'
import { AppHeader } from '@/components/shell'
import { Btn, BtnLink, IconBtn, Sheet, buzz, cx, ease, spring } from '@/components/ui'
import { productBySlug, productTitle } from '@/lib/data'
import { useApp } from '@/lib/store'
import { formatINR } from '@/lib/format'

const TABS = ['About', 'How to use', 'Ingredients', 'Safety'] as const

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const p = productBySlug(slug)
  const addProduct = useAddProduct()
  const hasBlend = useApp((s) => !!s.blend)
  const cartCount = useApp((s) => s.cart.reduce((n, l) => n + l.qty, 0))
  const inCartBy = useApp((s) => s.cart)
  const setCartQty = useApp((s) => s.setQty)
  const allergies = useApp((s) => s.profile?.allergies ?? [])
  const pregnant = useApp((s) => !!s.intake?.answers.safety.pregnant)
  const [vid, setVid] = useState(p?.variants[p.variants.length - 1].id)
  const [tab, setTab] = useState<(typeof TABS)[number]>('About')
  const [confirm, setConfirm] = useState(false)
  const art = useRef<HTMLDivElement>(null)
  if (!p) return <main className="px-5"><AppHeader back /><p className="mt-10 text-center text-muted">This product isn’t available.</p></main>
  const v = p.variants.find((x) => x.id === vid)!
  const hit = allergyHit(p, allergies)
  const cartKey = p.personal ? (p.personal === 'spray' ? 'remedy-reorder-spray' : 'remedy-reorder') : v.id
  const inCart = inCartBy.find((l) => l.key === cartKey)?.qty ?? 0
  const doAdd = () => { addProduct(p, v.id, 1, art.current?.getBoundingClientRect()); setConfirm(false) }
  const title = productTitle(p)
  const bookFirst = p.personal && !hasBlend
  const body = { About: p.about, Ingredients: p.ingredients, 'How to use': p.howTo, Safety: p.safety }[tab]

  return (
    <main className="px-5 pb-36">
      <AppHeader back right={<IconBtn label={`Cart, ${cartCount} items`} href="/app/bag" badge={cartCount || undefined}><ShoppingBag className="size-5" /></IconBtn>} />
      <motion.section initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease }} className="relative mt-1 overflow-hidden rounded-[32px] shadow-[var(--shadow-card)]">
        <div ref={art}><ProductArt product={p} size="lg" className="h-[360px] rounded-[32px]" /></div>
        <div className="absolute left-6 top-6 max-w-[52%]">
          <h1 className="font-display text-[30px] font-semibold leading-[34px] text-ink">{title.split(' ')[0]}<br /><em className="font-medium text-navy">{title.split(' ').slice(1).join(' ')}</em></h1>
          <p className="mt-2 text-[14px] leading-5 text-ink-2">{p.tagline}.</p>
        </div>
      </motion.section>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="How it may help you feel">
        {p.feel.map((f, i) => (
          <motion.span key={f} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-navy shadow-[var(--shadow-card)]">
            <span className="size-2 rounded-full" style={{ background: p.color }} />{f}
          </motion.span>
        ))}
      </div>

      <div className="mt-4 flex items-end justify-between px-1">
        <div className="flex gap-2">
          {p.variants.map((x) => (
            <button key={x.id} onClick={() => { setVid(x.id); buzz(5) }} aria-pressed={x.id === vid} className={cx('relative h-11 rounded-full px-5 text-[15px] font-semibold', x.id === vid ? 'text-white' : 'bg-white text-navy shadow-[var(--shadow-card)]')}>
              {x.id === vid && <motion.span layoutId="size-pill" transition={spring} className="absolute inset-0 rounded-full bg-navy" />}<span className="relative">{x.label}</span>
            </button>
          ))}
        </div>
        <div className="text-right">
          <AnimatePresence mode="popLayout"><motion.p key={v.id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="text-[30px] font-extrabold leading-none text-navy tnum">{formatINR(v.pricePaise)}</motion.p></AnimatePresence>
          {v.mrpPaise && <p className="text-[14px] text-muted line-through tnum">{formatINR(v.mrpPaise)}</p>}
        </div>
      </div>

      {p.personal && (
        <p className="mt-4 flex items-start gap-2.5 rounded-[20px] bg-sage-100/70 p-4 text-[14px] leading-5 text-sage-text">
          <span aria-hidden className="text-[18px] leading-5">🌼</span>
          <span>{hasBlend ? 'We’ll prepare the same blend Jitendra Khimlani chose for you.' : 'Your first blend is made for you after a wellness session, and it’s included in the fee.'}</span>
        </p>
      )}

      {(hit || (pregnant && /pregnan/i.test(p.safety))) && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-4 flex items-center gap-3 rounded-[20px] bg-rose-50 p-4" role="alert">
          <AlertTriangle className="size-6 shrink-0 text-rose" />
          <p className="text-[14px] font-semibold leading-5 text-rose">{hit ? `Contains ${hit}. You noted an allergy.` : 'Not recommended during pregnancy. Please check with your doctor.'}</p>
        </motion.div>
      )}

      <section className="card mt-4 p-4">
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1" role="tablist">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cx('relative h-10 shrink-0 rounded-full px-4 text-[14px] font-semibold', tab === t ? 'text-white' : 'bg-peri-50 text-navy')}>
              {tab === t && <motion.span layoutId="tab-pill" transition={spring} className="absolute inset-0 rounded-full bg-navy" />}<span className="relative">{t}</span>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={tab} role="tabpanel" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 px-1 text-[15px] leading-6 text-ink">{body}</motion.p>
        </AnimatePresence>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[480px] items-center gap-3 bg-gradient-to-t from-sky-50 via-sky-50/95 to-transparent px-5 pb-3 pt-8 safe-b">
        {/* owner 2026-11-18: same UI as the shop cards: Add to cart, then a counter once it's in the cart */}
        {p.soldOut ? <Btn full variant="primary" disabled>Sold out</Btn>
          : inCart > 0 && !p.personal ? (
            <>
              <div className="flex h-14 items-center gap-1 rounded-full bg-navy px-2 text-white shadow-[var(--shadow-cta)]" role="group" aria-label={`${title} in cart`}>
                <button aria-label="One less" onClick={() => { buzz(6); setCartQty(cartKey, inCart - 1) }} className="grid size-10 place-items-center rounded-full bg-white/15"><Minus className="size-4" /></button>
                <AnimatePresence mode="popLayout"><motion.span key={inCart} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-7 text-center text-[17px] font-bold tnum" aria-live="polite">{inCart}</motion.span></AnimatePresence>
                <button aria-label="One more" onClick={() => { buzz(6); if (inCart < 10) addProduct(p, v.id, 1, art.current?.getBoundingClientRect()) }} className="grid size-10 place-items-center rounded-full bg-white/15"><Plus className="size-4" /></button>
              </div>
              <BtnLink full href="/app/bag" variant="gradient"><ShoppingBag className="size-5" /> Go to cart</BtnLink>
            </>
          ) : inCart > 0 ? <BtnLink full href="/app/bag" variant="gradient"><Check className="size-5" /> In cart · Go to cart</BtnLink>
          : <Btn full variant="gradient" onClick={() => (hit ? setConfirm(true) : doAdd())}>{bookFirst ? 'Book a session' : p.personal ? 'Reorder my blend' : <><ShoppingBag className="size-5" /> Add to cart</>}</Btn>}
      </div>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Add anyway?">
        <h2 className="h-duo text-[24px]">Add <em>anyway?</em></h2>
        <p className="mt-2 text-[15px] leading-6 text-muted">{title} contains {hit}, which you noted an allergy to. You may prefer something else.</p>
        <div className="mt-5 flex gap-3 pb-1"><Btn full variant="white" size="md" onClick={() => setConfirm(false)}>Cancel</Btn><Btn full size="md" onClick={doAdd}>Add anyway</Btn></div>
      </Sheet>
    </main>
  )
}
