'use client'
/**
 * @module   client-home
 * @owner    CLIENT
 * @screens  v5 "Meet Jitu Bhaiya" story (DESIGN-SYSTEM §7) — opened from the Home card and from Book → Meet Jitu Bhaiya
 * v5 (HUB 2026-11-20): new full-screen experience. The card's portrait grows into a tall arch (shared layoutId, 450 ms),
 *   navy hero with the white stacked logo and slowly drifting line-flower petals (CSS 18–30 s loops), headline reveals word by
 *   word, stats count up, "His approach" icons draw in, real testimonials only (TESTIMONIALS), sticky "Book with Jitu Bhaiya".
 *   Close with ⨯, Esc or a swipe down from the top. prefers-reduced-motion → fades only.
 * Copy rule: no cure / medical claims.
 */
import { useRouter } from 'next/navigation'
import { AnimatePresence, animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { ArrowRight, ChevronLeft, ChevronRight, Droplets, Ear, ExternalLink, HeartHandshake, Quote, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { LogoStacked } from './brand'
import { FlowerArt } from './flower'
import { buzz, cx, ease } from './ui'
import { CONSULTANT, TESTIMONIALS } from '@/lib/data'
import { BP } from '@/lib/asset'

export const JITU_LAYOUT_ID = 'jitu-portrait'
const HERO_EASE = [0.22, 1, 0.36, 1] as const

/** Portrait used by both the Home card and the story arch, so the shared-element morph reads as one photo. */
export function JituPortrait({ className, radius, priority }: { className?: string; radius: string; priority?: boolean }) {
  return (
    <motion.div layoutId={JITU_LAYOUT_ID} transition={{ duration: 0.45, ease: HERO_EASE }} className={cx('overflow-hidden bg-sky-100', className)} style={{ borderRadius: radius }}>
      <img src={`${BP}/img/jitu-portrait.webp`} alt="Jitu Bhaiya (Jitendra Khimlani), smiling" className="h-full w-full object-cover object-[50%_30%]"
        draggable={false} decoding="async" fetchPriority={priority ? 'high' : undefined} />
    </motion.div>
  )
}

export function JituStory({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <AnimatePresence>{open && <Story key="story" onClose={onClose} />}</AnimatePresence>
}

function Story({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const reduce = useReducedMotion()
  const scroller = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  // swipe down from the very top closes (touch only, so normal scrolling is untouched)
  const pull = useMotionValue(0)
  const fade = useTransform(pull, [0, 220], [1, 0.4])
  const start = useRef<number | null>(null)

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 480)
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; clearTimeout(t); prev?.focus?.() }
  }, [onClose])

  const onTouchStart = (e: React.TouchEvent) => { start.current = (scroller.current?.scrollTop ?? 0) <= 0 ? e.touches[0].clientY : null }
  const onTouchMove = (e: React.TouchEvent) => {
    if (start.current === null) return
    const dy = e.touches[0].clientY - start.current
    if (dy > 0 && (scroller.current?.scrollTop ?? 0) <= 0) pull.set(dy * 0.6)
  }
  const onTouchEnd = () => {
    if (start.current === null) return
    start.current = null
    if (pull.get() > 110) { buzz(6); onClose() } else animate(pull, 0, { duration: 0.28, ease })
  }

  const book = () => { buzz(); onClose(); router.push('/app/book?type=first') }

  return (
    <motion.div role="dialog" aria-modal="true" aria-label="Meet Jitu Bhaiya" className="fixed inset-0 z-[60] mx-auto max-w-[480px]"
      initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.28 } }}>
      {/* navy ground fades in under the morphing portrait */}
      <motion.div className="absolute inset-0 bg-sky-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} />
      <motion.div ref={scroller} style={{ y: pull, opacity: fade }} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        className="no-scrollbar relative h-full overflow-y-auto overscroll-contain">

        {/* ---------- hero ---------- */}
        <header className="relative overflow-hidden bg-navy px-5 pb-16 pt-[max(env(safe-area-inset-top),14px)]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.15 }} aria-hidden><Petals /></motion.div>
          <div className="relative flex items-start justify-between">
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5, ease }}>
              <LogoStacked white height={64} />
            </motion.div>
            <button ref={closeRef} onClick={onClose} aria-label="Close" className="grid size-11 place-items-center rounded-full bg-white/12 text-white ring-1 ring-white/25 backdrop-blur hover:bg-white/20">
              <X className="size-5" />
            </button>
          </div>
          <div className="relative mx-auto -mt-6 w-[min(232px,62vw)]">
            <JituPortrait priority className="aspect-[4/5] w-full shadow-[0_24px_48px_rgba(0,0,0,.28)] ring-4 ring-white/90" radius="999px 999px 28px 28px" />
            <motion.span initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.55, type: 'spring', stiffness: 260, damping: 14 }}
              className="absolute -right-5 top-10" aria-hidden><Sparkle size={34} /></motion.span>
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, type: 'spring', stiffness: 260, damping: 14 }}
              className="absolute -left-4 bottom-16" aria-hidden><Sparkle size={18} /></motion.span>
          </div>
        </header>

        {/* ---------- story ---------- */}
        <motion.article className="relative -mt-8 rounded-t-[32px] bg-sky-50 px-5 pb-40 pt-7"
          initial={{ y: reduce ? 0 : 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, ease, delay: 0.2 }}>
          <span className="inline-flex items-center rounded-full bg-marigold-100 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink">Your consultant</span>
          <Words className="h-display mt-4" text="Jitu Bhaiya listens first." delay={0.35} />
          <motion.p className="mt-3 text-[16px] leading-6 text-ink-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.6 }}>
            {CONSULTANT.fullName}, {CONSULTANT.title}. For more than 12 years he has guided people, gently and without judgement, with the wisdom of Bach flower remedies.
          </motion.p>

          <div className="mt-6 grid grid-cols-[1fr_1.5fr_1fr] gap-2.5">
            <Stat value={12} suffix="+" label="years" tint="bg-sky-100" />
            <Stat value={200000} suffix="+" label="people guided" tint="bg-marigold-100" />
            <Stat value={38} label="flowers" tint="bg-teal-100" />
          </div>

          <section className="mt-9" aria-labelledby="approach-h">
            <div className="flex items-center gap-3"><h2 id="approach-h" className="h-section shrink-0 text-[22px]">His approach</h2><span className="h-px flex-1 bg-sky-200" /></div>
            <ol className="mt-4 space-y-3">
              <Step n={1} tint="bg-sky-100" icon={<Ear />} title="Listen" body="A safe, unhurried space to share how you really feel." />
              <Step n={2} tint="bg-rose-100" icon={<HeartHandshake />} title="Understand" body="He gently finds the feelings underneath, at your pace." />
              <Step n={3} tint="bg-teal-100" icon={<Droplets />} title="Your personal blend" body="A blend of Bach flower essences chosen for you, included in your consultation." />
            </ol>
          </section>

          <Testimonials />

          <section className="relative mt-8 overflow-hidden rounded-[24px] bg-white p-5 shadow-[var(--shadow-card)]">
            <FlowerArt name="Mimulus" decorative className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 opacity-90" />
            <h2 className="h-section pr-16">How Bach remedies work</h2>
            <p className="mt-2 pr-14 text-[14px] leading-[21px] text-ink-2">Dr Edward Bach described 38 flower essences, each linked to a feeling. Your blend is chosen for how you feel. A gentle, complementary practice alongside your doctor’s care.</p>
            <a href={CONSULTANT.website} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-[14px] font-semibold text-navy underline underline-offset-4">Visit his website <ExternalLink className="size-4" /></a>
          </section>
        </motion.article>
      </motion.div>

      {/* sticky CTA */}
      <motion.div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-sky-50 via-sky-50/95 to-transparent px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-10"
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6, duration: 0.45, ease }}>
        <button onClick={book} className="pointer-events-auto flex h-[60px] w-full items-center justify-center gap-2 rounded-full bg-navy font-display text-[18px] font-semibold text-white shadow-[var(--shadow-float)] transition-colors hover:bg-navy-2">
          Book with Jitu Bhaiya <ArrowRight className="size-5" />
        </button>
      </motion.div>
    </motion.div>
  )
}

/** Headline word-by-word (fade only under reduced motion). */
function Words({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const reduce = useReducedMotion()
  return (
    <h1 className={className} aria-label={text}>
      {text.split(' ').map((w, i) => (
        <motion.span key={i} aria-hidden className="mr-[0.24em] inline-block" initial={{ opacity: 0, y: reduce ? 0 : 14, filter: reduce ? 'none' : 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: delay + i * 0.09, duration: 0.5, ease }}>{w}</motion.span>
      ))}
    </h1>
  )
}

function Stat({ value, suffix = '', label, tint }: { value: number; suffix?: string; label: string; tint: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const seen = useInView(ref, { once: true, margin: '-20px' })
  const reduce = useReducedMotion()
  const [n, setN] = useState(reduce ? value : 0)
  useEffect(() => {
    if (!seen || reduce) { if (reduce) setN(value); return }
    const c = animate(0, value, { duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.15, onUpdate: (v) => setN(Math.round(v)) })
    return () => c.stop()
  }, [seen, reduce, value])
  const full = `${value.toLocaleString('en-IN')}${suffix}`
  return (
    <div ref={ref} className={cx('rounded-[20px] px-2.5 py-3.5', tint)}>
      <p className="whitespace-nowrap font-display text-[21px] font-bold leading-7 text-ink tnum" aria-label={full}>
        <span aria-hidden>{n.toLocaleString('en-IN')}{suffix}</span>
      </p>
      <p className="mt-0.5 text-[12px] font-medium leading-4 text-ink-2">{label}</p>
    </div>
  )
}

function Step({ n, icon, title, body, tint }: { n: number; icon: ReactNode; title: string; body: string; tint: string }) {
  const ref = useRef<HTMLLIElement>(null)
  const seen = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.li ref={ref} className="flex items-start gap-4 rounded-[24px] bg-white p-4 shadow-[var(--shadow-card)]"
      initial={{ opacity: 0, y: 12 }} animate={seen ? { opacity: 1, y: 0 } : undefined} transition={{ duration: 0.5, ease, delay: (n - 1) * 0.08 }}>
      <span className={cx('draw-icon relative grid size-14 shrink-0 place-items-center rounded-full text-navy [&_svg]:size-7', tint, seen && 'is-drawn')}>
        {icon}
        <span className="absolute -left-1 -top-1 grid size-6 place-items-center rounded-full bg-navy text-[12px] font-bold text-white ring-2 ring-white">{n}</span>
      </span>
      <span className="pt-1">
        <span className="block font-display text-[18px] font-semibold leading-6 text-ink">{title}</span>
        <span className="mt-0.5 block text-[14px] leading-5 text-ink-2">{body}</span>
      </span>
    </motion.li>
  )
}

function Testimonials() {
  const [k, setK] = useState(0)
  const n = TESTIMONIALS.length
  if (!n) return null
  const t = TESTIMONIALS[k]
  const go = (d: number) => { buzz(5); setK((x) => (x + d + n) % n) }
  return (
    <section className="mt-9" aria-roledescription="carousel" aria-labelledby="stories-h">
      <div className="flex items-center gap-3"><h2 id="stories-h" className="h-section shrink-0 text-[22px]">In their words</h2><span className="h-px flex-1 bg-sky-200" /></div>
      <div className="relative mt-4 min-h-[236px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.figure key={k} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.25}
            onDragEnd={(_, i) => { if (i.offset.x < -50) go(1); else if (i.offset.x > 50) go(-1) }}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35, ease }}
            aria-roledescription="slide" aria-label={`${k + 1} of ${n}`}
            className="relative cursor-grab overflow-hidden rounded-[24px] bg-rose-100 p-6 active:cursor-grabbing">
            <Quote className="size-8 fill-rose-500 text-rose-500" aria-hidden />
            <blockquote className="mt-3 font-display text-[18px] font-medium italic leading-[27px] text-ink">“{t.quote}”</blockquote>
            <figcaption className="mt-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-2">{t.name}{t.city ? `, ${t.city}` : ''}</figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>
      {n > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <button aria-label="Previous story" onClick={() => go(-1)} className="grid size-11 place-items-center rounded-full bg-white text-navy shadow-[var(--shadow-card)]"><ChevronLeft className="size-5" /></button>
          <div className="flex gap-1.5" aria-hidden>{TESTIMONIALS.map((_, j) => <span key={j} className={cx('h-2 rounded-full transition-all duration-300', j === k ? 'w-6 bg-navy' : 'w-2 bg-sky-200')} />)}</div>
          <button aria-label="Next story" onClick={() => go(1)} className="grid size-11 place-items-center rounded-full bg-white text-navy shadow-[var(--shadow-card)]"><ChevronRight className="size-5" /></button>
        </div>
      )}
      <p className="mt-3 text-center text-[12px] text-muted">Real words from clients, shared with permission.</p>
    </section>
  )
}

/** Four-point marigold sparkle (the "Meet Jitu Bhaiya" accent). */
export function Sparkle({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={cx('animate-twinkle', className)} aria-hidden>
      <path d="M12 1.5c.7 5.2 2.3 7.8 7.5 10.5-5.2 2.7-6.8 5.3-7.5 10.5-.7-5.2-2.3-7.8-7.5-10.5C9.7 9.3 11.3 6.7 12 1.5Z" fill="#F2A93B" />
    </svg>
  )
}

/** Hand-drawn line flowers + petals in white, drifting on 18–30 s loops (CSS; stilled by reduced motion). */
function Petals() {
  const items = [
    { x: '4%', y: '20%', s: 92, d: 24, delay: -3, kind: 'flower' },
    { x: '76%', y: '36%', s: 104, d: 28, delay: -9, kind: 'sprig' },
    { x: '82%', y: '8%', s: 30, d: 19, delay: -2, kind: 'petal' },
    { x: '12%', y: '64%', s: 26, d: 22, delay: -6, kind: 'petal' },
    { x: '64%', y: '74%', s: 34, d: 30, delay: -12, kind: 'petal' },
    { x: '30%', y: '6%', s: 20, d: 18, delay: -4, kind: 'petal' },
    { x: '88%', y: '62%', s: 22, d: 26, delay: -15, kind: 'petal' },
  ] as const
  return (
    <div className="pointer-events-none absolute inset-0 text-white">
      {items.map((p, i) => (
        <span key={i} className="animate-drift absolute opacity-30" style={{ left: p.x, top: p.y, width: p.s, height: p.s, ['--dur' as string]: `${p.d}s`, ['--delay' as string]: `${p.delay}s` }}>
          {p.kind === 'flower' ? <LineFlower /> : p.kind === 'sprig' ? <LineSprig /> : <LinePetal />}
        </span>
      ))}
    </div>
  )
}
const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
function LineFlower() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" {...line}>
      {[0, 72, 144, 216, 288].map((r) => <path key={r} d="M32 30c-6-6-6-16 0-20 6 4 6 14 0 20Z" transform={`rotate(${r} 32 30)`} />)}
      <circle cx="32" cy="30" r="3" />
      <path d="M32 33c0 10-2 18-6 28M29 50c-6-2-10-6-11-11 6 0 10 4 11 11Z" />
    </svg>
  )
}
function LineSprig() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" {...line}>
      <path d="M14 60C24 44 34 30 50 6" />
      <path d="M22 47c-7 0-11-4-12-9 6-1 10 3 12 9ZM30 36c-2-7 0-12 5-15 2 6 0 11-5 15ZM38 25c-7-1-10-5-10-10 6 0 9 4 10 10ZM45 15c1-6 4-9 9-9-1 5-4 8-9 9Z" />
    </svg>
  )
}
function LinePetal() {
  return <svg viewBox="0 0 24 24" className="h-full w-full" {...line}><path d="M12 3c5 4 6 11 0 18-6-7-5-14 0-18Z" /><path d="M12 7v10" /></svg>
}
