'use client'
/** @module commerce-ux @owner CLIENT @screens CL-35 Product — sizes, tabs, allergy / pregnancy warning, add to bag */
import { useParams } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, Heart, Minus, Plus } from 'lucide-react'
import { useRef, useState } from 'react'
import { ProductArt } from '@/components/brand'
import { allergyHit } from '@/components/product-card'
import { AppHeader } from '@/components/shell'
import { Btn, IconBtn, Sheet, buzz, cx, ease, spring, toast, useChrome } from '@/components/ui'
import { productBySlug } from '@/lib/data'
import { useApp } from '@/lib/store'
import { formatINR } from '@/lib/format'

const TABS = ['About', 'Ingredients', 'How to use', 'Safety'] as const

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const p = productBySlug(slug)
  const add = useApp((s) => s.addToCart)
  const wish = useApp((s) => s.wishlist.includes(slug))
  const toggleWish = useApp((s) => s.toggleWish)
  const allergies = useApp((s) => s.profile?.allergies ?? [])
  const pregnant = useApp((s) => !!s.intake?.answers.safety.pregnant)
  const { flyToBag } = useChrome()
  const [vid, setVid] = useState(p?.variants[p.variants.length - 1].id)
  const [tab, setTab] = useState<(typeof TABS)[number]>('About')
  const [qty, setQty] = useState(1)
  const [confirm, setConfirm] = useState(false)
  const art = useRef<HTMLDivElement>(null)
  if (!p) return <main className="px-5"><AppHeader back /><p className="mt-10 text-center text-muted">This product isn’t available.</p></main>
  const v = p.variants.find((x) => x.id === vid)!
  const hit = allergyHit(p, allergies)
  const doAdd = () => {
    add(v.id, qty); buzz(14)
    const r = art.current?.getBoundingClientRect(); if (r) flyToBag(r, `/img/${p.art}.webp`)
    toast(`${p.name} · ${v.label} added`); setConfirm(false)
  }
  const body = { About: p.about, Ingredients: p.ingredients, 'How to use': p.howTo, Safety: p.safety }[tab]

  return (
    <main className="px-5 pb-36">
      <AppHeader back right={<IconBtn label={wish ? 'Remove from saved' : 'Save for later'} onClick={() => { toggleWish(p.slug); buzz(6) }}><Heart className={cx('size-5', wish && 'fill-navy')} /></IconBtn>} />
      <motion.section initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease }} className="relative mt-1 overflow-hidden rounded-[30px] shadow-[var(--shadow-card)]">
        <div ref={art}><ProductArt product={p} size="lg" className="h-[330px] rounded-[30px]" /></div>
        <div className="absolute left-6 top-6 max-w-[55%]">
          <h1 className="text-[32px] font-extrabold leading-[1.05] tracking-[-0.03em] text-navy">{p.name.split(' ')[0]} <span className="text-soft">{p.name.split(' ').slice(1).join(' ')}</span></h1>
          <p className="mt-2 text-[14px] leading-5 text-muted">{p.tagline}.</p>
        </div>
      </motion.section>

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
          {v.mrpPaise && <p className="text-[14px] text-soft line-through tnum">{formatINR(v.mrpPaise)}</p>}
        </div>
      </div>

      {(hit || (pregnant && /pregnan/i.test(p.safety))) && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-4 flex items-center gap-3 rounded-[22px] bg-rose-50 p-4" role="alert">
          <AlertTriangle className="size-6 shrink-0 text-rose" />
          <p className="text-[14px] font-semibold leading-5 text-rose">{hit ? `Contains ${hit} — you noted an allergy.` : 'Not recommended during pregnancy — please check with your doctor.'}</p>
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

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[480px] items-center gap-3 bg-gradient-to-t from-[#e6eee3] via-[#e6eee3]/95 to-transparent px-5 pb-3 pt-8 safe-b">
        <div className="flex h-14 items-center gap-1 rounded-full bg-white px-2 shadow-[var(--shadow-card)]">
          <button aria-label="Fewer" onClick={() => setQty(Math.max(1, qty - 1))} className="grid size-10 place-items-center rounded-full text-navy"><Minus className="size-4" /></button>
          <AnimatePresence mode="popLayout"><motion.span key={qty} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-6 text-center text-[17px] font-bold text-navy tnum">{qty}</motion.span></AnimatePresence>
          <button aria-label="More" onClick={() => setQty(Math.min(10, qty + 1))} className="grid size-10 place-items-center rounded-full text-navy"><Plus className="size-4" /></button>
        </div>
        <Btn full variant="gradient" onClick={() => (hit ? setConfirm(true) : doAdd())}>Add to bag</Btn>
      </div>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Add anyway?">
        <h2 className="h-duo text-[24px]">Add <em>anyway?</em></h2>
        <p className="mt-2 text-[15px] leading-6 text-muted">{p.name} contains {hit}, which you noted an allergy to. You may prefer something else.</p>
        <div className="mt-5 flex gap-3 pb-1"><Btn full variant="white" size="md" onClick={() => setConfirm(false)}>Cancel</Btn><Btn full size="md" onClick={doAdd}>Add anyway</Btn></div>
      </Sheet>
    </main>
  )
}
