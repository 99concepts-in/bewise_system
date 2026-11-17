'use client'
/**
 * @module   onboarding
 * @owner    CLIENT
 * @screens  CL-01 Splash · CL-02 Welcome story (3 slides; slide 2 = how Bach remedies work)
 */
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, type PanInfo } from 'motion/react'
import { useEffect, useState } from 'react'
import { LogoMark, Mascot, MoodImg } from '@/components/brand'
import { Btn, ease, cx } from '@/components/ui'

const SLIDES = [
  { lead: 'A gentle conversation about how you', em: 'feel', sub: 'Talk with Jitu Bhaiya — online or in person. No rush, no judgement.' },
  { lead: 'Flower essences, chosen for your emotions, help you find your way back to', em: 'balance', sub: 'Dr Bach’s 38 flower essences, blended just for you.' },
  { lead: 'A personal blend, a few drops a', em: 'day', sub: 'Gentle reminders, a mood journal and a companion that knows your ritual.' },
]

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
              <div className="relative h-[44dvh] min-h-[290px]">
                <AnimatePresence mode="popLayout" custom={dir} initial={false}>
                  <motion.div key={i} custom={dir} className="absolute inset-0"
                    initial={{ opacity: 0, x: dir * 70 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -70 }} transition={{ duration: 0.5, ease }}>
                    {i === 0 ? <ArtTalk /> : i === 1 ? <ArtEssence /> : <ArtRitual />}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="px-6">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease }}>
                    <h1 className="text-[28px] font-extrabold leading-[1.12] tracking-[-0.025em] text-navy">
                      {SLIDES[i].lead} <span className="text-soft">{SLIDES[i].em}</span>
                    </h1>
                    <p className="mt-3 text-[15px] leading-6 text-muted">{SLIDES[i].sub}</p>
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
              <Btn variant="gradient" full onClick={() => (i < 2 ? go(i + 1) : router.push('/sign-in'))}>{i < 2 ? 'Next' : 'Begin'}</Btn>
              <Btn variant="ghost" full size="md" onClick={() => router.push('/sign-in?returning=1')}>I have an account</Btn>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

function Halo({ size = 260 }: { size?: number }) {
  return (
    <>
      <span className="animate-breathe absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" style={{ width: size, height: size }} />
      <span className="animate-breathe absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" style={{ width: size * 1.28, height: size * 1.28, animationDelay: '1s' }} />
    </>
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

function ArtTalk() {
  return (
    <div className="relative h-full">
      <Halo />
      <div className="absolute inset-0 grid place-items-center"><Mascot pose="wave" height={230} priority /></div>
      <Float className="left-[9%] top-[16%]" delay={0.25}>
        <div className="rounded-[20px] rounded-bl-md bg-white px-4 py-2.5 text-[14px] font-semibold text-navy shadow-[var(--shadow-card)]">How have you been feeling?</div>
      </Float>
      <Float className="bottom-[14%] right-[7%]" delay={0.5} dy={8}>
        <div className="flex items-center gap-2 rounded-[20px] rounded-br-md bg-navy px-4 py-2.5 text-[14px] font-semibold text-white shadow-[var(--shadow-float)]">
          <img src="/img/jitu.webp" alt="" className="size-7 rounded-full object-cover" />Take your time.
        </div>
      </Float>
      <Float className="right-[10%] top-[12%]" delay={0.7}><MoodImg mood="hopeful" size={48} /></Float>
      <Float className="bottom-[20%] left-[12%]" delay={0.9} dy={6}><MoodImg mood="calm" size={42} /></Float>
    </div>
  )
}

function ArtEssence() {
  const [calm, setCalm] = useState(false)
  useEffect(() => { const t = setInterval(() => setCalm((c) => !c), 2400); return () => clearInterval(t) }, [])
  return (
    <div className="relative h-full">
      <Halo size={240} />
      <Float className="left-[6%] top-[14%]" delay={0.1} dy={6}><img src="/img/f-rose.webp" alt="" className="h-[92px] w-auto" /></Float>
      <Float className="right-[4%] top-[8%]" delay={0.25} dy={8}><img src="/img/f-mimulus.webp" alt="" className="h-[118px] w-auto" /></Float>
      <div className="absolute left-1/2 top-[8%] -translate-x-1/2">
        <motion.img src="/img/p-dropper.webp" alt="" className="h-[150px] w-auto drop-shadow-[0_14px_16px_rgba(24,41,87,.2)]"
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

function ArtRitual() {
  const [n, setN] = useState(0)
  useEffect(() => { const t = setInterval(() => setN((x) => (x + 1) % 5), 700); return () => clearInterval(t) }, [])
  return (
    <div className="relative h-full">
      <Halo />
      <div className="absolute inset-0 grid place-items-center"><Mascot pose="bottle" height={220} /></div>
      <Float className="bottom-[8%] left-1/2 -translate-x-1/2" delay={0.3} dy={4}>
        <div className="flex items-center gap-3 rounded-full bg-white px-4 py-2.5 shadow-[var(--shadow-card)]">
          <span className="text-[13px] font-semibold text-navy">Today</span>
          {[0, 1, 2, 3].map((k) => (
            <motion.span key={k} className="block size-4 rounded-[50%_50%_50%_50%/60%_60%_40%_40%]" animate={{ backgroundColor: k < n ? '#c48a3a' : '#e6e8f0', scale: k === n - 1 ? [1, 1.35, 1] : 1 }} transition={{ duration: 0.35 }} />
          ))}
        </div>
      </Float>
      {(['joyful', 'grateful', 'calm'] as const).map((m, k) => (
        <Float key={m} className={['left-[8%] top-[18%]', 'right-[9%] top-[22%]', 'right-[16%] bottom-[30%]'][k]} delay={0.2 + k * 0.2} dy={7 + k * 2}>
          <MoodImg mood={m} size={44 + k * 4} />
        </Float>
      ))}
    </div>
  )
}
