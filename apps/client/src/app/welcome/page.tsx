'use client'
/**
 * @module   onboarding
 * @owner    CLIENT
 * @screens  CL-01 Splash · CL-02 Welcome story — owner copy 2026-11-18: welcome · book with Jitendra Khimlani · Bach flower benefits
 */
import { useRouter } from 'next/navigation'
import { preload } from 'react-dom'
import { AnimatePresence, motion, type PanInfo } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { LogoMark, Mascot, MoodImg } from '@/components/brand'
import { Btn, ease, cx } from '@/components/ui'
import { BP } from '@/lib/asset'

// Copy rule: no cure / medical claims — "gently support emotional balance" (design system §10)
const SLIDES = [
  { lead: 'Welcome to', em: 'BeWise Wellness', sub: 'A calm, private space for your emotional wellbeing, guided by Jitendra Khimlani and the gentle wisdom of Bach flower remedies.' },
  { lead: 'Book your appointment with', em: 'Jitendra Khimlani', sub: 'Jitendra Khimlani is a Bach Flower Remedy therapist. Talk to him about how you feel, and get a remedy blend made just for you.' },
  { lead: 'Bach flower remedy', em: 'benefits', sub: 'Natural Bach flower remedies that gently support emotional balance, chosen for how you feel.', chips: ['Gentle & natural', 'Made just for you', 'Feel calmer, day by day'] },
] as { lead: string; em: string; sub: string; chips?: string[] }[]

// owner 2026-11-18: slide images felt slow; fetch them all up front (during the 1.9 s splash) at high priority
const WELCOME_IMAGES = ['img/owl-wave.webp', 'img/jitu-portrait.webp', 'img/f-rose.webp', 'img/f-mimulus.webp']

export default function Welcome() {
  for (const src of WELCOME_IMAGES) preload(`${BP}/${src}`, { as: 'image', fetchPriority: 'high' })
  const router = useRouter()
  const [phase, setPhase] = useState<'splash' | 'story'>('splash')
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  useEffect(() => { const t = setTimeout(() => setPhase('story'), 1900); return () => clearTimeout(t) }, [])
  useEffect(() => { router.prefetch('/sign-in') }, [router])

  const go = (n: number) => { if (n < 0 || n > 2) return; setDir(n > i ? 1 : -1); setI(n) }
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -400) go(i + 1)
    else if (info.offset.x > 60 || info.velocity.x > 400) go(i - 1)
  }

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 'splash' ? (
          <motion.div key="splash" className="grid flex-1 place-items-center" exit={{ opacity: 0, scale: 1.04, filter: 'blur(6px)' }} transition={{ duration: 0.45, ease }}>
            <div className="flex flex-col items-center">
              <div className="relative grid size-[150px] place-items-center">
                <motion.span className="absolute inset-0 rounded-full bg-white/70" initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.9, ease }} />
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 150 150" aria-hidden>
                  <motion.circle cx="75" cy="75" r="72" fill="none" stroke="#b89b64" strokeWidth="1.5" strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.2, ease, delay: 0.25 }} />
                </svg>
                <motion.div layoutId="brand-mark" initial={{ scale: 0.6, opacity: 0, filter: 'blur(8px)' }} animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 0.8, ease, delay: 0.1 }}>
                  <LogoMark size={110} />
                </motion.div>
              </div>
              <div className="mt-6 flex overflow-hidden text-[40px] font-extrabold tracking-[-0.03em] text-navy" role="img" aria-label="BeWise">
                {'BeWise'.split('').map((c, k) => (
                  <motion.span key={k} initial={{ y: 48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease, delay: 0.55 + k * 0.05 }}>{c}</motion.span>
                ))}
              </div>
              <motion.p className="mt-1 text-[15px] font-medium tracking-[0.18em] text-muted uppercase" initial={{ opacity: 0, letterSpacing: '0.4em' }} animate={{ opacity: 1, letterSpacing: '0.18em' }} transition={{ duration: 0.9, delay: 1 }}>
                Holistic Wellness
              </motion.p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="story" className="flex flex-1 flex-col safe-t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <header className="flex items-center justify-between px-5 pt-2">
              <motion.div layoutId="brand-mark" className="flex items-center gap-2.5">
                <LogoMark size={40} />
              </motion.div>
              <button onClick={() => router.push('/sign-in')} className={cx('rounded-full px-4 py-2 text-[14px] font-semibold text-navy transition-opacity', i === 2 && 'pointer-events-none opacity-0')}>Skip</button>
            </header>

            <motion.div className="relative flex flex-1 touch-pan-y flex-col" drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.18} onDragEnd={onDragEnd}>
              {/* art box is clipped and its lower edge fades out, so decoration never crosses the text below */}
              <div className="relative h-[44dvh] min-h-[290px] overflow-hidden [mask-image:linear-gradient(to_bottom,#000_88%,transparent)]">
                <AnimatePresence mode="popLayout" custom={dir} initial={false}>
                  <motion.div key={i} custom={dir} className="absolute inset-0"
                    initial={{ opacity: 0, x: dir * 70 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -70 }} transition={{ duration: 0.5, ease }}>
                    {i === 0 ? <ArtWelcome /> : i === 1 ? <ArtBook /> : <ArtEssence />}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="relative z-10 mt-3 px-6">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease }}>
                    <h1 className="text-[28px] font-extrabold leading-[1.12] tracking-[-0.025em] text-navy">
                      {SLIDES[i].lead} <span className="text-soft">{SLIDES[i].em}</span>
                    </h1>
                    <p className="mt-3 text-[15px] leading-6 text-muted">{SLIDES[i].sub}</p>
                    {SLIDES[i].chips && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {SLIDES[i].chips!.map((c, k) => (
                          <motion.span key={c} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + k * 0.08 }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-navy shadow-[var(--shadow-card)]">
                            <span className="size-1.5 rounded-full bg-sage" />{c}
                          </motion.span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            <footer className="space-y-3 px-5 pb-2 safe-b">
              <div className="mb-4 flex justify-center gap-2" role="tablist" aria-label="Welcome slides">
                {SLIDES.map((_, k) => (
                  <button key={k} role="tab" aria-selected={k === i} aria-label={`Slide ${k + 1}`} onClick={() => go(k)} className="grid h-6 place-items-center px-0.5">
                    <motion.span className="block h-2 rounded-full" animate={{ width: k === i ? 26 : 8, backgroundColor: k === i ? '#182957' : '#c7cde0' }} transition={{ duration: 0.35, ease }} />
                  </button>
                ))}
              </div>
              <Btn variant="gradient" full onClick={() => (i < 2 ? go(i + 1) : router.push('/sign-in'))}>{i < 2 ? 'Next' : 'Let’s begin'}</Btn>
              <Btn variant="ghost" full size="md" onClick={() => router.push('/sign-in?returning=1')}>I have an account</Btn>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

/** Soft halo behind the art. Sized from the art box's height (not fixed px) so it can never reach the headline. */
function Halo({ inner = 0.76 }: { inner?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      <span className="animate-breathe absolute aspect-square rounded-full bg-white/70" style={{ height: `${inner * 100}%` }} />
      <span className="animate-breathe absolute aspect-square rounded-full border border-white/80" style={{ height: '92%', animationDelay: '1s' }} />
    </div>
  )
}

function Float({ children, className, delay = 0, dy = 10 }: { children: React.ReactNode; className?: string; delay?: number; dy?: number }) {
  return (
    <motion.div className={cx('absolute', className)} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1, y: [0, -dy, 0] }}
      transition={{ opacity: { delay, duration: 0.5 }, scale: { delay, type: 'spring', stiffness: 260, damping: 18 }, y: { delay, duration: 4.5, repeat: Infinity, ease: 'easeInOut' } }}>
      {children}
    </motion.div>
  )
}

function ArtWelcome() {
  return (
    <div className="relative h-full">
      <Halo />
      <div className="absolute inset-0 grid place-items-center"><Mascot pose="wave" height={220} priority /></div>
      <Float className="left-[7%] top-[12%]" delay={0.2} dy={6}><img src={`${BP}/img/f-rose.webp`} alt="" className="h-[78px] w-auto" /></Float>
      <Float className="right-[6%] top-[8%]" delay={0.35} dy={8}><img src={`${BP}/img/f-mimulus.webp`} alt="" className="h-[96px] w-auto" /></Float>
      <Float className="bottom-[16%] left-[11%]" delay={0.55} dy={6}><MoodImg mood="calm" size={46} /></Float>
      <Float className="bottom-[20%] right-[12%]" delay={0.7} dy={7}><MoodImg mood="happy" size={50} /></Float>
    </div>
  )
}

function ArtBook() {
  return (
    <div className="relative h-full">
      <Halo inner={0.74} />
      {/* owner 2026-11-18: background removed, no circular frame */}
      <div className="absolute inset-x-0 bottom-[6%] top-[10%] flex items-end justify-center">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }} className="h-full">
          <FadeImg src={`${BP}/img/jitu-portrait.webp`} alt="Jitendra Khimlani" className="h-full w-auto object-contain drop-shadow-[0_18px_24px_rgba(24,41,87,.18)] [mask-image:linear-gradient(to_bottom,black_80%,transparent)]" />
        </motion.div>
      </div>
      <Float className="left-[6%] top-[14%]" delay={0.3} dy={6}>
        <div className="rounded-[18px] rounded-bl-md bg-white px-3.5 py-2 text-[13px] font-semibold text-navy shadow-[var(--shadow-card)]">Bach Flower Remedy Therapist</div>
      </Float>
      <Float className="bottom-[12%] left-[10%]" delay={0.6} dy={5}>
        <div className="flex items-center gap-1.5 rounded-full bg-sage-100 px-3.5 py-2 text-[13px] font-semibold text-sage-text shadow-[var(--shadow-card)]">✓ Remedy blend included</div>
      </Float>
    </div>
  )
}

/**
 * Slide 3 story (owner 2026-11-18): the dropper lifts out of the bottle, moves over the mood character, four drops fall,
 * and after the 4th the character turns from Sad to Happy — then it all resets and loops.
 */
const STAGE = { w: 300, h: 300 }
type Phase = 'rest' | 'lift' | 'over' | 'drop' | 'happy' | 'back'
function ArtEssence() {
  const [phase, setPhase] = useState<Phase>('rest')
  const [drops, setDrops] = useState(0)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const after = (ms: number, fn: () => void) => { t = setTimeout(fn, ms) }
    if (phase === 'rest') after(900, () => setPhase('lift'))
    else if (phase === 'lift') after(800, () => setPhase('over'))
    else if (phase === 'over') after(750, () => { setDrops(0); setPhase('drop') })
    else if (phase === 'drop') after(drops === 0 ? 250 : 750, () => { if (drops < 4) setDrops((d) => d + 1); else setPhase('happy') })
    else if (phase === 'happy') after(2600, () => setPhase('back'))
    else if (phase === 'back') after(900, () => { setDrops(0); setPhase('rest') })
    return () => clearTimeout(t)
  }, [phase, drops])
  const happy = phase === 'happy' || phase === 'back'
  const box = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(1)
  useEffect(() => {
    const el = box.current; if (!el) return
    const ro = new ResizeObserver(([e]) => setFit(Math.min(1, e.contentRect.height / STAGE.h, e.contentRect.width / STAGE.w)))
    ro.observe(el); return () => ro.disconnect()
  }, [])
  // dropper offsets relative to its resting place in the bottle neck
  const pos = phase === 'rest' ? { x: 0, y: 0, r: 0 } : phase === 'lift' || phase === 'back' ? { x: 0, y: -90, r: 0 } : { x: 104, y: -80, r: 6 }
  return (
    <div ref={box} className="relative h-full">
      <Halo inner={0.72} />
      <Float className="left-[4%] top-[10%]" delay={0.1} dy={6}><img src={`${BP}/img/f-rose.webp`} alt="" className="h-[78px] w-auto" /></Float>
      <Float className="right-[2%] top-[4%]" delay={0.25} dy={8}><img src={`${BP}/img/f-mimulus.webp`} alt="" className="h-[96px] w-auto" /></Float>
      <div className="absolute left-1/2 top-1/2" style={{ width: STAGE.w, height: STAGE.h, transform: `translate(-50%, -50%) scale(${fit})` }} aria-hidden>
        {/* open amber bottle */}
        <svg viewBox="0 0 90 130" className="absolute" style={{ left: 46, top: 128, width: 82, height: 118 }}>
          <defs><linearGradient id="amb" x1="0" x2="1"><stop offset="0" stopColor="#7a4312" /><stop offset=".45" stopColor="#c7832f" /><stop offset="1" stopColor="#6c3a10" /></linearGradient></defs>
          <rect x="31" y="0" width="28" height="16" rx="4" fill="#5b3412" />
          <path d="M22 16h46c8 0 13 6 13 14v86c0 8-6 14-14 14H23c-8 0-14-6-14-14V30c0-8 5-14 13-14Z" fill="url(#amb)" />
          <path d="M16 36c0-5 3-9 7-9" stroke="#fff" strokeOpacity=".5" strokeWidth="4" strokeLinecap="round" fill="none" />
        </svg>
        {/* dropper: bulb + glass pipette, starts inside the neck */}
        <motion.div className="absolute" style={{ left: 75, top: 92, width: 24, height: 118, originX: '50%', originY: '20%' }}
          animate={{ x: pos.x, y: pos.y, rotate: pos.r }} transition={{ type: 'spring', stiffness: 90, damping: 16 }}>
          <svg viewBox="0 0 24 118" className="h-full w-full">
            <rect x="3" y="0" width="18" height="30" rx="9" fill="#1d1f2b" />
            <rect x="1" y="26" width="22" height="10" rx="3" fill="#2a2e44" />
            <path d="M8 36h8v64l-2.5 14h-3L8 100Z" fill="#dfe6f3" fillOpacity=".85" stroke="#b9c3d8" strokeWidth="1" />
            <path d="M9.5 70h5v30l-1.6 10h-1.8L9.5 100Z" fill="#e2a24c" />
          </svg>
        </motion.div>
        {/* label drawn above the pipette so the text is never covered (owner 2026-11-20: "Flower Remedy") */}
        <svg viewBox="0 0 90 130" className="pointer-events-none absolute" style={{ left: 46, top: 128, width: 82, height: 118 }}>
          <rect x="18" y="58" width="54" height="40" rx="6" fill="#f5efe4" />
          <text x="45" y="76" textAnchor="middle" fontSize="9" fontWeight="800" fill="#182957">BeWise</text>
          <text x="45" y="88" textAnchor="middle" fontSize="6.4" fontWeight="600" fill="#5f667a">Flower Remedy</text>
        </svg>
        {/* drops: fall from the pipette tip (stage ≈ x 199, y 108) onto the mood character */}
        <AnimatePresence>
          {phase === 'drop' && drops > 0 && drops <= 4 && (
            <motion.span key={drops} className="absolute block h-[14px] w-[11px] rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-[linear-gradient(180deg,#f3c06b,#b77a2c)] shadow-[0_2px_4px_rgba(122,67,18,.3)]"
              style={{ left: 184, top: 124 }} initial={{ y: 0, opacity: 0, scale: 0.5 }} animate={{ y: [0, 4, 78], opacity: [0, 1, 1], scale: [0.5, 1, 0.9] }} exit={{ opacity: 0, scale: 0.2 }}
              transition={{ duration: 0.55, times: [0, 0.25, 1], ease: 'easeIn' }} />
          )}
        </AnimatePresence>
        {/* mood character */}
        <div className="absolute grid size-[90px] place-items-center rounded-full bg-white shadow-[var(--shadow-card)]" style={{ left: 145, top: 198 }}>
          <AnimatePresence>
            {phase === 'drop' && drops > 0 && (
              <motion.span key={'s' + drops} className="absolute left-1/2 top-[18px] h-3 w-10 -translate-x-1/2 rounded-[50%] border-2 border-[#e2a24c]" initial={{ scale: 0.3, opacity: 0.9 }} animate={{ scale: 1.6, opacity: 0 }} transition={{ duration: 0.6, delay: 0.5 }} />
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.div key={happy ? 'h' : 's'} initial={{ scale: 0.5, opacity: 0, rotate: -12 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
              <MoodImg mood={happy ? 'happy' : 'sad'} size={68} />
            </motion.div>
          </AnimatePresence>
          {happy && phase === 'happy' && (
            <span className="pointer-events-none absolute inset-0">
              {Array.from({ length: 8 }).map((_, k) => (
                <motion.span key={k} className="absolute left-1/2 top-1/2 block size-2 rounded-full" style={{ background: k % 2 ? '#F6DE8D' : '#BFD8C2' }}
                  initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: Math.cos((k / 8) * 6.28) * 64, y: Math.sin((k / 8) * 6.28) * 64, opacity: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }} />
              ))}
            </span>
          )}
          <motion.span key={'l' + happy} initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }}
            className="absolute left-[98px] top-1/2 flex -translate-y-1/2 flex-col items-start gap-1 whitespace-nowrap rounded-[14px] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-navy shadow-[var(--shadow-card)]">
            {happy ? 'Happy' : 'Sad'}
            <span className="flex gap-1">{[1, 2, 3, 4].map((k) => (
              <motion.span key={k} className="block size-2 rounded-full" animate={{ backgroundColor: (phase === 'drop' && drops >= k) || happy ? '#c48a3a' : '#d9dce6', scale: phase === 'drop' && drops === k ? [1, 1.5, 1] : 1 }} transition={{ duration: 0.3 }} />
            ))}</span>
          </motion.span>
        </div>
      </div>
    </div>
  )
}

/** Image that fades in once decoded (no pop-in), with a soft tinted placeholder behind it. */
function FadeImg({ className, ...p }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [ok, setOk] = useState(false)
  return <img {...p} decoding="async" fetchPriority="high" onLoad={() => setOk(true)} ref={(el) => { if (el?.complete) setOk(true) }}
    className={cx(className, 'transition-opacity duration-300', ok ? 'opacity-100' : 'opacity-0')} />
}
