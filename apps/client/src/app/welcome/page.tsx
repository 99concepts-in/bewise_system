'use client'
/**
 * @module   onboarding
 * @owner    CLIENT
 * @screens  CL-01 Splash · CL-02 Welcome story — owner copy 2026-11-18: welcome · book with Jitendra Khimlani · Bach flower benefits
 */
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, type PanInfo } from 'motion/react'
import { useEffect, useState } from 'react'
import { LogoMark, Mascot, MoodImg } from '@/components/brand'
import { Btn, ease, cx } from '@/components/ui'
import { BP } from '@/lib/asset'

// Copy rule: no cure / medical claims — "gently support emotional balance" (design system §10)
const SLIDES = [
  { lead: 'Welcome to', em: 'BeWise Wellness', sub: 'A calm, private space for your emotional wellbeing — guided by Jitu Bhaiya and the gentle wisdom of Bach flower remedies.' },
  { lead: 'Book your appointment with', em: 'Jitendra Khimlani', sub: 'Jitu Bhaiya, Bach Remedy Therapist. Online or in person — your personal remedy blend is included.' },
  { lead: 'Bach flower remedy', em: 'benefits', sub: '38 natural flower essences that gently support emotional balance — chosen for how you feel.', chips: ['Gentle & natural', 'Made just for you', 'A few drops a day'] },
] as { lead: string; em: string; sub: string; chips?: string[] }[]

export default function Welcome() {
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
              <div className="mt-6 flex overflow-hidden text-[40px] font-extrabold tracking-[-0.03em] text-navy" aria-label="BeWise">
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
      <div className="absolute inset-0 grid place-items-center">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          className="relative aspect-square h-[62%] overflow-hidden rounded-full bg-white p-1.5 shadow-[var(--shadow-float)]">
          <img src={`${BP}/img/jitu-portrait.webp`} alt="Jitendra Khimlani — Jitu Bhaiya" className="h-full w-full rounded-full object-cover object-[50%_18%]" />
        </motion.div>
      </div>
      <Float className="left-[6%] top-[14%]" delay={0.3} dy={6}>
        <div className="rounded-[18px] rounded-bl-md bg-white px-3.5 py-2 text-[13px] font-semibold text-navy shadow-[var(--shadow-card)]">Bach Remedy Therapist</div>
      </Float>
      <Float className="right-[6%] top-[30%]" delay={0.45} dy={7}>
        <div className="rounded-[18px] rounded-br-md bg-navy px-3.5 py-2 text-[13px] font-semibold text-white shadow-[var(--shadow-float)]">Online · In person</div>
      </Float>
      <Float className="bottom-[12%] left-[10%]" delay={0.6} dy={5}>
        <div className="flex items-center gap-1.5 rounded-full bg-sage-100 px-3.5 py-2 text-[13px] font-semibold text-sage-text shadow-[var(--shadow-card)]">✓ Remedy blend included</div>
      </Float>
    </div>
  )
}

function ArtEssence() {
  const [calm, setCalm] = useState(false)
  useEffect(() => { const t = setInterval(() => setCalm((c) => !c), 2400); return () => clearInterval(t) }, [])
  return (
    <div className="relative h-full">
      <Halo inner={0.72} />
      <Float className="left-[6%] top-[14%]" delay={0.1} dy={6}><img src={`${BP}/img/f-rose.webp`} alt="" className="h-[92px] w-auto" /></Float>
      <Float className="right-[4%] top-[8%]" delay={0.25} dy={8}><img src={`${BP}/img/f-mimulus.webp`} alt="" className="h-[118px] w-auto" /></Float>
      <div className="absolute left-1/2 top-[8%] -translate-x-1/2">
        <motion.img src={`${BP}/img/p-dropper.webp`} alt="" className="h-[150px] w-auto drop-shadow-[0_14px_16px_rgba(24,41,87,.2)]"
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, ease }} />
        {[0, 1, 2].map((k) => (
          <motion.span key={k} className="absolute left-1/2 top-[150px] block size-3 -translate-x-1/2 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-[linear-gradient(180deg,#e7b768,#b77a2c)]"
            initial={{ y: 0, opacity: 0, scale: 0.6 }} animate={{ y: [0, 70], opacity: [0, 1, 1, 0], scale: [0.6, 1, 1, 0.4] }}
            transition={{ duration: 1.4, delay: 0.6 + k * 0.8, repeat: Infinity, repeatDelay: 1, ease: 'easeIn' }} />
        ))}
      </div>
      <div className="absolute bottom-[10%] left-1/2 grid size-[96px] -translate-x-1/2 place-items-center rounded-full bg-white shadow-[var(--shadow-card)]">
        <AnimatePresence mode="wait">
          <motion.div key={String(calm)} initial={{ scale: 0.5, opacity: 0, rotate: -10 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
            <MoodImg mood={calm ? 'calm' : 'anxious'} size={74} />
          </motion.div>
        </AnimatePresence>
        <motion.span className="absolute -right-16 top-1/2 -translate-y-1/2 rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-navy shadow-[var(--shadow-card)]" key={'l' + calm} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{calm ? 'Calm' : 'Anxious'}</motion.span>
      </div>
    </div>
  )
}
