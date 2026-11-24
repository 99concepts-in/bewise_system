'use client'
/**
 * @module   onboarding
 * @owner    CLIENT
 * @screens  CL-01 Splash · CL-02 Welcome + 5 benefits (owner 2026-11-24)
 *   0 Welcome to BeWise Holistic Wellness — "My journey" · "Already a member"
 *   1 Take charge of your emotional wellbeing (mood flower)
 *   2 Keep track of your Bach flower journey (bottle + drops; reminders, moods, sessions)
 *   3 Learn, the easy way (stories preview)
 *   4 Ask BeWise (chat preview)
 *   5 Sessions and the wellness shop — "Let's get started" → phone sign-in
 * Colourful, flowers everywhere, warm. Copy rule: no cure / medical claims, no dashes.
 */
import { goSafe } from '@/lib/nav'
import { useRouter } from 'next/navigation'
import { preload } from 'react-dom'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, type PanInfo } from 'motion/react'
import { Bell, CalendarCheck2, Check, Droplets, Smile } from 'lucide-react'
import { useEffect, useState } from 'react'
import { LogoMark, Mascot, MoodImg } from '@/components/brand'
import { FlowerArt } from '@/components/flower'
import { MoodShape } from '@/components/mood-shape'
import { RemedyBottle } from '@/components/remedy-bottle'
import { Btn, buzz, cx, ease } from '@/components/ui'
import { STORIES } from '@/lib/stories'
import { BP } from '@/lib/asset'

type Slide = { bg: string; kicker?: string; title: string; em?: string; sub: string; bullets?: { icon: React.ReactNode; t: string }[]; flowers: string[] }
const SLIDES: Slide[] = [
  { bg: 'linear-gradient(170deg,#FFE7D6 0%,#FDE3EB 55%,#F3E8FF 100%)', title: 'Welcome to', em: 'BeWise Holistic Wellness', sub: 'A warm, private space for your emotional wellbeing, with Jitendra Khimlani and the gentle wisdom of Bach flowers.', flowers: ['Wild Rose', 'Mimulus', 'Centaury', 'Chicory'] },
  { bg: 'linear-gradient(170deg,#EDE6FF 0%,#E3ECFF 60%,#FFF1E6 100%)', kicker: 'Benefit 1', title: 'Take charge of your', em: 'emotional wellbeing', sub: 'Notice how you feel, day by day, and gently move towards calm, balance and joy.', flowers: ['Larch', 'Agrimony', 'Clematis'] },
  { bg: 'linear-gradient(170deg,#FFF1D6 0%,#FFE9C9 55%,#FDE3EB 100%)', kicker: 'Benefit 2', title: 'Keep track of your', em: 'Bach flower journey', sub: 'Your blend, your daily drops and how you are changing, all in one place.',
    bullets: [{ icon: <Bell className="size-4" />, t: 'Regular reminders for your remedy' }, { icon: <Smile className="size-4" />, t: 'Become aware of your moods and emotions' }, { icon: <CalendarCheck2 className="size-4" />, t: 'Book sessions right from the app' }], flowers: ['Gorse', 'Honeysuckle'] },
  { bg: 'linear-gradient(170deg,#DDF4EA 0%,#E3F2FF 60%,#FFF6E0 100%)', kicker: 'Benefit 3', title: 'Learn the', em: 'easy way', sub: 'Short, beautiful stories on sleep, anxiety, confidence and more. Three minutes each.', flowers: ['White Chestnut', 'Walnut'] },
  { bg: 'linear-gradient(170deg,#DFF0FF 0%,#E9E6FF 60%,#FDE3EB 100%)', kicker: 'Benefit 4', title: 'Ask', em: 'BeWise', sub: 'Get answers about you and your journey, anytime: your drops, your blend, your next session.', flowers: ['Cerato', 'Vervain'] },
  { bg: 'linear-gradient(170deg,#FDE3EB 0%,#FFE7D6 55%,#FFF6E0 100%)', kicker: 'Benefit 5', title: 'Sessions and', em: 'wellness shop', sub: 'Book wellness sessions with reminders, and find our aromatherapy and wellness products.', flowers: ['Wild Rose', 'Holly'] },
]
const LAST = SLIDES.length - 1
const WELCOME_IMAGES = ['img/owl-wave.webp', 'img/bottle-remedy.webp', ...STORIES.slice(0, 4).map((s) => `img/${s.cover}.webp`), 'img/products/sleep-spray.webp', 'img/products/aura-bath-salt.webp', 'img/products/migraine-go-rollon.webp']

export default function Welcome() {
  for (const src of WELCOME_IMAGES) preload(`${BP}/${src}`, { as: 'image', fetchPriority: 'high' })
  const router = useRouter()
  const [phase, setPhase] = useState<'splash' | 'story'>('splash')
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  useEffect(() => { const t = setTimeout(() => setPhase('story'), 1900); return () => clearTimeout(t) }, [])
  useEffect(() => { router.prefetch('/sign-in') }, [router])
  const go = (n: number) => { if (n < 0 || n > LAST) return; buzz(6); setDir(n > i ? 1 : -1); setI(n) }
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -400) go(i + 1)
    else if (info.offset.x > 60 || info.velocity.x > 400) go(i - 1)
  }
  const s = SLIDES[i]

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 'splash' ? (
          <motion.div key="splash" className="grid flex-1 place-items-center" exit={{ opacity: 0, scale: 1.04, filter: 'blur(6px)' }} transition={{ duration: 0.45, ease }}>
            {/* owner 2026-11-21: the golden line splash (ring draws around the owl, name rises in) */}
            <div className="flex flex-col items-center">
              <div className="relative grid size-[150px] place-items-center">
                <motion.span className="absolute inset-0 rounded-full bg-white/70" initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.9, ease }} />
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 150 150" aria-hidden>
                  <motion.circle cx="75" cy="75" r="72" fill="none" stroke="#b89b64" strokeWidth="1.5" strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.2, ease, delay: 0.25 }} />
                </svg>
                <motion.div initial={{ scale: 0.6, opacity: 0, filter: 'blur(8px)' }} animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 0.8, ease, delay: 0.1 }}>
                  <LogoMark size={110} />
                </motion.div>
              </div>
              <div className="mt-6 flex overflow-hidden text-[40px] font-extrabold tracking-[-0.03em] text-navy" role="img" aria-label="BeWise">
                {'BeWise'.split('').map((c, k) => (
                  <motion.span key={k} initial={{ y: 48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease, delay: 0.55 + k * 0.05 }}>{c}</motion.span>
                ))}
              </div>
              <motion.p className="mt-1 text-[15px] font-medium uppercase tracking-[0.18em] text-ink-2" initial={{ opacity: 0, letterSpacing: '0.4em' }} animate={{ opacity: 1, letterSpacing: '0.18em' }} transition={{ duration: 0.9, delay: 1 }}>
                Holistic Wellness
              </motion.p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="story" className="relative flex flex-1 flex-col safe-t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            {/* colourful, warm background that changes per screen */}
            <AnimatePresence initial={false}>
              <motion.div key={i} aria-hidden className="absolute inset-0" style={{ background: s.bg }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} />
            </AnimatePresence>
            <FloatingFlowers names={s.flowers} k={i} />

            <header className="relative flex items-center justify-between px-5 pt-2">
              <LogoMark size={40} label="BeWise" />
              {i > 0 && i < LAST && <button onClick={() => go(LAST)} className="rounded-full bg-white/60 px-4 py-2 text-[14px] font-semibold text-navy backdrop-blur">Skip</button>}
            </header>

            <motion.div className="relative flex flex-1 touch-pan-y flex-col" drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.18} onDragEnd={onDragEnd}>
              <div className={cx('relative', i === 0 ? 'h-[40dvh] min-h-[250px]' : 'h-[36dvh] min-h-[230px]')}>
                <AnimatePresence mode="popLayout" custom={dir} initial={false}>
                  <motion.div key={i} custom={dir} className="absolute inset-0" initial={{ opacity: 0, x: dir * 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -60 }} transition={{ duration: 0.5, ease }}>
                    {i === 0 ? <ArtHello /> : i === 1 ? <ArtMood /> : i === 2 ? <ArtBottle /> : i === 3 ? <ArtLearn /> : i === 4 ? <ArtAsk /> : <ArtShop />}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="relative z-10 mt-2 px-6">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease }}>
                    {s.kicker && <p className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.14em] text-[#b0532f]">{s.kicker}</p>}
                    <h1 className={cx('h-duo', i === 0 && 'text-[34px] leading-[40px]')}>{s.title} <em>{s.em}</em></h1>
                    <p className="mt-2.5 text-[16px] leading-6 text-ink-2">{s.sub}</p>
                    {s.bullets && (
                      <ul className="mt-3 space-y-2">
                        {s.bullets.map((b, k) => (
                          <motion.li key={b.t} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + k * 0.12 }} className="flex items-center gap-2.5 text-[14px] font-semibold text-navy">
                            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/80 text-[#b0532f]">{b.icon}</span>{b.t}
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            <footer className="relative space-y-3 px-5 pb-3 pt-4 safe-b">
              {i > 0 && (
                <div className="mb-2 flex justify-center gap-2" role="tablist" aria-label="Benefits">
                  {SLIDES.slice(1).map((_, k) => (
                    <button key={k} role="tab" aria-selected={k + 1 === i} aria-label={`Benefit ${k + 1}`} onClick={() => go(k + 1)} className="grid h-6 place-items-center px-0.5">
                      <motion.span className="block h-2 rounded-full" animate={{ width: k + 1 === i ? 26 : 8, backgroundColor: k + 1 === i ? '#243D91' : '#ffffffcc' }} transition={{ duration: 0.35, ease }} />
                    </button>
                  ))}
                </div>
              )}
              {i === 0 ? (
                <>
                  <Btn variant="gradient" full onClick={() => go(1)}>My journey</Btn>
                  <Btn variant="ghost" full size="md" onClick={() => goSafe(router, '/sign-in?returning=1')}>Already a member</Btn>
                </>
              ) : i < LAST ? (
                <Btn variant="gradient" full onClick={() => go(i + 1)}>Next</Btn>
              ) : (
                <Btn variant="gradient" full onClick={() => goSafe(router, '/sign-in')}>Let’s get started</Btn>
              )}
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

/** Bach flowers drifting gently around each screen */
function FloatingFlowers({ names, k }: { names: string[]; k: number }) {
  const still = useReducedMotion()
  const spots = [{ l: '-4%', t: '8%', s: 78 }, { l: '78%', t: '4%', s: 70 }, { l: '82%', t: '34%', s: 56 }, { l: '-2%', t: '38%', s: 60 }]
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {names.map((n, j) => {
        const p = spots[j % spots.length]
        return (
          <motion.div key={`${k}-${n}`} className="absolute opacity-80" style={{ left: p.l, top: p.t, width: p.s, height: p.s }}
            initial={{ opacity: 0, scale: 0.5, rotate: -20 }} animate={{ opacity: 0.85, scale: 1, rotate: 0, y: still ? 0 : [0, -10, 0] }}
            transition={{ opacity: { delay: 0.1 + j * 0.1 }, scale: { delay: 0.1 + j * 0.1, type: 'spring', stiffness: 200, damping: 16 }, rotate: { delay: 0.1 + j * 0.1 }, y: { duration: 5 + j, repeat: Infinity, ease: 'easeInOut' } }}>
            <FlowerArt name={n} decorative className="size-full" />
          </motion.div>
        )
      })}
    </div>
  )
}

/** 0 · Welcome: the owl waves inside a ring of Bach flowers that slowly turns */
function ArtHello() {
  const still = useReducedMotion()
  const ring = ['Wild Rose', 'Mimulus', 'Larch', 'Chicory', 'Gorse', 'Centaury', 'Clematis', 'Honeysuckle']
  return (
    <div className="relative grid h-full place-items-center">
      <motion.div className="absolute aspect-square h-[88%]" animate={still ? undefined : { rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }} aria-hidden>
        {ring.map((n, k) => {
          const a = (k / ring.length) * Math.PI * 2
          return (
            <motion.span key={n} className="absolute grid size-[22%] place-items-center rounded-full bg-white/85 shadow-[0_8px_20px_rgba(176,83,47,.15)]"
              style={{ left: `${50 + 44 * Math.cos(a) - 11}%`, top: `${50 + 44 * Math.sin(a) - 11}%` }}
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15 + k * 0.06, type: 'spring', stiffness: 260, damping: 16 }}>
              <FlowerArt name={n} decorative className="size-[80%]" />
            </motion.span>
          )
        })}
      </motion.div>
      <span className="absolute aspect-square h-[58%] rounded-full bg-white/70 blur-[2px]" aria-hidden />
      <div className="relative"><Mascot pose="wave" height={150} priority /></div>
    </div>
  )
}

/** 1 · Mood: our flower opening and closing, faces drifting around */
function ArtMood() {
  const v = useMotionValue(1)
  const still = useReducedMotion()
  useEffect(() => { if (still) { v.set(5); return } const c = animate(v, [1, 5.6, 3, 6, 1], { duration: 9, repeat: Infinity, ease: 'easeInOut' }); return () => c.stop() }, [v, still])
  const faces = [{ m: 'happy', l: '6%', t: '10%' }, { m: 'calm', l: '74%', t: '14%' }, { m: 'anxious', l: '10%', t: '66%' }, { m: 'grateful', l: '72%', t: '64%' }] as const
  return (
    <div className="relative grid h-full place-items-center">
      <div className="grid aspect-square h-[92%] place-items-center rounded-full bg-[#1f2235] shadow-[0_20px_50px_rgba(60,40,120,.25)]"><MoodShape v={v} size={200} /></div>
      {faces.map((f, k) => (
        <motion.span key={f.m} className="absolute" style={{ left: f.l, top: f.t }} initial={{ scale: 0 }} animate={{ scale: 1, y: [0, -8, 0] }}
          transition={{ scale: { delay: 0.3 + k * 0.1, type: 'spring' }, y: { duration: 4 + k, repeat: Infinity, ease: 'easeInOut' } }}>
          <MoodImg mood={f.m} size={48} />
        </motion.span>
      ))}
    </div>
  )
}

/** 2 · Journey: our bottle, drops falling into today's dose circles, the level easing down */
function ArtBottle() {
  const [n, setN] = useState(0)
  useEffect(() => { const t = setInterval(() => setN((x) => (x + 1) % 5), 1300); return () => clearInterval(t) }, [])
  return (
    <div className="relative flex h-full items-center justify-center gap-6">
      <div className="relative">
        <span className="absolute bottom-0 left-1/2 h-3 w-16 -translate-x-1/2 rounded-[50%] bg-[#b0532f]/20 blur-[5px]" aria-hidden />
        <RemedyBottle level={0.85 - n * 0.06} height={190} pulse={n} />
        <AnimatePresence>
          {n > 0 && <motion.span key={n} className="absolute left-1/2 top-[30%] text-[#e2a24c]" initial={{ y: 0, opacity: 1 }} animate={{ y: 120, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: 'easeIn' }} aria-hidden><Droplets className="size-5" /></motion.span>}
        </AnimatePresence>
      </div>
      <div className="grid grid-cols-2 gap-2.5" aria-hidden>
        {[0, 1, 2, 3].map((k) => (
          <motion.span key={k} className={cx('grid size-12 place-items-center rounded-full transition-colors duration-500', k < n ? 'bg-[radial-gradient(circle_at_35%_30%,#f6de8d,#d9a94a)] text-white shadow-[0_6px_14px_rgba(181,138,60,.4)]' : 'bg-white/80 text-[#d8b98a]')}
            animate={k === n - 1 ? { scale: [0.7, 1.12, 1] } : { scale: 1 }} transition={{ duration: 0.5 }}>
            {k < n ? <Check className="size-5" strokeWidth={3} /> : <Droplets className="size-5" />}
          </motion.span>
        ))}
      </div>
    </div>
  )
}

/** 3 · Learn: story covers fan and cycle, headlines underneath */
function ArtLearn() {
  const list = STORIES.slice(0, 5)
  const [at, setAt] = useState(0)
  useEffect(() => { const t = setInterval(() => setAt((x) => (x + 1) % list.length), 1800); return () => clearInterval(t) }, [list.length])
  return (
    <div className="relative grid h-full place-items-center">
      {list.map((s, k) => {
        const d = (k - at + list.length) % list.length
        return (
          <motion.div key={s.id} className="absolute aspect-[3/4] h-[86%] overflow-hidden rounded-[22px] shadow-[0_16px_40px_rgba(30,60,60,.25)]"
            animate={{ x: d === 0 ? 0 : d === 1 ? 70 : d === list.length - 1 ? -70 : 0, rotate: d === 0 ? 0 : d === 1 ? 8 : d === list.length - 1 ? -8 : 0, scale: d === 0 ? 1 : d <= 1 || d === list.length - 1 ? 0.86 : 0.7, opacity: d === 0 || d === 1 || d === list.length - 1 ? 1 : 0, zIndex: d === 0 ? 3 : 1 }}
            transition={{ type: 'spring', stiffness: 160, damping: 20 }}>
            <img src={`${BP}/img/${s.cover}.webp`} alt="" className="size-full object-cover" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <span className="absolute inset-x-3 bottom-3 text-left text-white">
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/80">{s.tag} · 3 min</span>
              <span className="block font-display text-[15px] font-semibold leading-5">{s.title}</span>
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

/** 4 · Ask BeWise: a short conversation types itself in */
function ArtAsk() {
  const msgs = [
    { me: true, t: 'When should I take my drops?' },
    { me: false, t: '4 drops, 4 times a day. Your next one is at 6 PM 🌿' },
    { me: true, t: 'When is my next session?' },
    { me: false, t: 'Thursday at 11 AM with Jitendra Khimlani.' },
  ]
  const [n, setN] = useState(1)
  useEffect(() => { const t = setInterval(() => setN((x) => (x >= msgs.length ? 1 : x + 1)), 1400); return () => clearInterval(t) }, [msgs.length])
  return (
    <div className="relative mx-auto flex h-full w-[86%] flex-col justify-center gap-2" aria-hidden>
      <AnimatePresence initial={false}>
        {msgs.slice(0, n).map((m, k) => (
          <motion.div key={k} layout initial={{ opacity: 0, y: 12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className={cx('flex items-end gap-2', m.me ? 'justify-end' : 'justify-start')}>
            {!m.me && <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white shadow-[var(--shadow-card)]"><LogoMark size={22} /></span>}
            <span className={cx('max-w-[78%] rounded-[18px] px-3.5 py-2.5 text-[14px] leading-5 shadow-[var(--shadow-card)]', m.me ? 'rounded-br-[6px] bg-navy text-white' : 'rounded-bl-[6px] bg-white text-ink')}>{m.t}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/** 5 · Sessions + shop: a session reminder drops in over the products */
function ArtShop() {
  const items = ['products/sleep-spray', 'products/aura-bath-salt', 'products/migraine-go-rollon']
  return (
    <div className="relative grid h-full place-items-center">
      <div className="relative flex items-end" aria-hidden>
        {items.map((p, k) => (
          <motion.img key={p} src={`${BP}/img/${p}.webp`} alt="" className="h-[150px] w-auto object-contain drop-shadow-[0_14px_18px_rgba(120,50,40,.2)]"
            style={{ marginLeft: k ? -24 : 0, zIndex: k === 1 ? 2 : 1 }} initial={{ y: 30, opacity: 0, rotate: (k - 1) * 8 }} animate={{ y: k === 1 ? -10 : 0, opacity: 1, rotate: (k - 1) * 8 }}
            transition={{ delay: 0.15 + k * 0.1, type: 'spring', stiffness: 180, damping: 18 }} />
        ))}
      </div>
      <motion.div className="absolute left-1/2 top-[4%] flex w-[84%] -translate-x-1/2 items-center gap-3 rounded-[20px] bg-white/95 p-3 shadow-[0_14px_30px_rgba(120,50,40,.18)]"
        initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6, type: 'spring', stiffness: 200, damping: 18 }} aria-hidden>
        <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-navy text-white"><CalendarCheck2 className="size-5" /></span>
        <span className="min-w-0"><span className="block text-[13px] font-bold text-navy">Session tomorrow · 11:00 AM</span><span className="block text-[12px] text-ink-2">with Jitendra Khimlani · Online</span></span>
      </motion.div>
    </div>
  )
}
