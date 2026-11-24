'use client'
/**
 * @module   learn
 * @owner    CLIENT
 * @screens  Story viewer (owner 2026-11-23): Insta-story style, full screen. Tap right = next, tap left = back, hold = pause,
 *           auto-advance after a reading pause. Slides: cover, text, remedies, steps, "Did you know", member quote, end.
 */
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Lightbulb, Quote, Volume2, VolumeX, X } from 'lucide-react'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { FlowerArt } from '@/components/flower'
import { SessionOnly } from '@/components/made-with-care'
import { useUi } from '@/components/shell'
import { buzz, cx, ease } from '@/components/ui'
import { STORIES, storyById, type Slide, type Story } from '@/lib/stories'
import { BP } from '@/lib/asset'
import { goSafe } from '@/lib/nav'
import { AMBIENT, ambient, type AmbientKind } from '@/lib/ambient'

export default function Page() { return <Suspense><StoryView /></Suspense> }

// reading time per slide (ms): long enough to read, the member can always tap on sooner
const DWELL: Record<Slide['k'], number> = { cover: 5000, text: 11000, remedies: 12000, steps: 12000, know: 10000, quote: 9000, end: 0 }

function StoryView() {
  const router = useRouter()
  const story = storyById(useSearchParams().get('id') ?? '') ?? STORIES[0]
  const setNavHidden = useUi((s) => s.setNavHidden)
  const still = useReducedMotion()
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const n = story.slides.length
  const slide = story.slides[i]
  const close = useCallback(() => goSafe(router, '/app/learn'), [router])
  const go = useCallback((to: number) => {
    if (to < 0) return
    if (to >= n) return close()
    buzz(5); setDir(to > i ? 1 : -1); setI(to); setProgress(0)
  }, [i, n, close])

  useEffect(() => { setNavHidden(true); return () => setNavHidden(false) }, [setNavHidden])

  // owner 2026-11-24: relaxing loop music, 3 kinds, mutable (remembered on this device). Starts on the first tap (browser rule).
  const storyIdx = Math.max(0, STORIES.findIndex((x) => x.id === story.id))
  const [muted, setMuted] = useState(() => { try { return localStorage.getItem('bw-story-sound') === 'off' } catch { return false } })
  const [track, setTrack] = useState<AmbientKind>(() => { try { return (localStorage.getItem('bw-story-track') as AmbientKind) || AMBIENT[storyIdx % AMBIENT.length].id } catch { return AMBIENT[storyIdx % AMBIENT.length].id } })
  const started = useRef(false)
  const sound = useCallback((m = muted, t = track) => { try { if (m) ambient().stop(); else { ambient().start(t); started.current = true } } catch { /* no audio */ } }, [muted, track])
  useEffect(() => () => { try { ambient().stop() } catch { /* no audio */ } }, [])
  const firstTap = () => { if (!started.current && !muted) sound() }
  const toggleMute = () => { const m = !muted; setMuted(m); try { localStorage.setItem('bw-story-sound', m ? 'off' : 'on') } catch { /* private */ } ; sound(m) }
  const nextTrack = () => { const t = AMBIENT[(AMBIENT.findIndex((a) => a.id === track) + 1) % AMBIENT.length].id; setTrack(t); try { localStorage.setItem('bw-story-track', t) } catch { /* private */ } ; if (!muted) sound(false, t) }
  useEffect(() => { setI(0); setProgress(0) }, [story.id])
  // auto-advance with a visible progress bar (paused while held, never on the last slide)
  useEffect(() => {
    const dwell = DWELL[slide.k]
    if (!dwell || paused) return
    let last = performance.now(); let raf = 0
    const tick = (now: number) => {
      setProgress((p) => { const np = p + (now - last) / dwell; if (np >= 1) { setTimeout(() => go(i + 1), 0); return 1 } return np })
      last = now; raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [i, paused, slide.k, go])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') go(i + 1); else if (e.key === 'ArrowLeft') go(i - 1); else if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [i, go, close])

  const holdT = useRef<number | null>(null)
  const down = () => { firstTap(); holdT.current = window.setTimeout(() => setPaused(true), 220) }
  const up = (side: 'l' | 'r') => {
    if (holdT.current) clearTimeout(holdT.current)
    if (paused) { setPaused(false); return }
    go(side === 'r' ? i + 1 : i - 1)
  }
  const next = STORIES[(STORIES.findIndex((s) => s.id === story.id) + 1) % STORIES.length]

  return (
    <main className="fixed inset-0 z-50 mx-auto max-w-[480px] overflow-hidden bg-[#0f1226] text-white" style={{ ['--tint' as string]: story.tint }} aria-roledescription="story" aria-label={story.title}>
      {/* background: the cover, softened behind every slide after the first */}
      <motion.img src={`${BP}/img/${story.cover}.webp`} alt="" aria-hidden className="absolute inset-0 size-full object-cover"
        animate={{ scale: still ? 1 : i === 0 ? 1.06 : 1.12, filter: i === 0 ? 'blur(0px) brightness(1)' : 'blur(14px) brightness(0.55)' }} transition={{ duration: i === 0 ? 6 : 0.8, ease: 'easeOut' }} />
      <div className={cx('absolute inset-0 transition-colors duration-700', i === 0 ? 'bg-gradient-to-t from-black/75 via-black/10 to-black/30' : 'bg-[color-mix(in_srgb,var(--tint)_45%,transparent)]')} aria-hidden />

      {/* progress + close */}
      <div className="absolute inset-x-0 top-0 z-20 px-3 pt-[max(env(safe-area-inset-top),10px)]">
        <div className="flex gap-1" aria-hidden>
          {story.slides.map((_, k) => (
            <span key={k} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
              <span className="block h-full rounded-full bg-white" style={{ width: `${k < i ? 100 : k === i ? (DWELL[slide.k] ? progress * 100 : 100) : 0}%` }} />
            </span>
          ))}
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-white/90">{story.tag} · {i + 1} of {n}</p>
          <div className="flex items-center gap-2">
            <button onClick={nextTrack} aria-label={`Music: ${AMBIENT.find((a) => a.id === track)!.label}. Tap to change`} className="flex h-10 items-center gap-1.5 rounded-full bg-black/25 px-3 text-[13px] font-semibold backdrop-blur">
              <span aria-hidden>{AMBIENT.find((a) => a.id === track)!.emoji}</span>{AMBIENT.find((a) => a.id === track)!.label}
            </button>
            <button onClick={toggleMute} aria-label={muted ? 'Turn music on' : 'Mute music'} aria-pressed={!muted} className="grid size-10 place-items-center rounded-full bg-black/25 backdrop-blur">{muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}</button>
            <button onClick={close} aria-label="Close story" className="grid size-10 place-items-center rounded-full bg-black/25 backdrop-blur"><X className="size-5" /></button>
          </div>
        </div>
      </div>

      {/* tap zones: left third back, right two-thirds forward, hold to pause */}
      <button aria-label="Previous slide" className="absolute bottom-0 left-0 top-20 z-10 w-1/3" onPointerDown={down} onPointerUp={() => up('l')} onContextMenu={(e) => e.preventDefault()} />
      <button aria-label="Next slide" className="absolute bottom-0 right-0 top-20 z-10 w-2/3" onPointerDown={down} onPointerUp={() => up('r')} onContextMenu={(e) => e.preventDefault()} />

      <div className="pointer-events-none absolute inset-0 z-[15] flex flex-col px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-24">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={i} custom={dir} className="flex flex-1 flex-col"
            initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -40 }} transition={{ duration: 0.35, ease }}>
            <SlideBody s={slide} story={story} next={next} />
          </motion.div>
        </AnimatePresence>
      </div>
      {paused && <p className="pointer-events-none absolute inset-x-0 bottom-6 z-20 text-center text-[12px] font-semibold text-white/80">Paused · let go to continue</p>}
    </main>
  )
}

const rise = (d: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: d, duration: 0.5, ease } })

function SlideBody({ s, story, next }: { s: Slide; story: Story; next: Story }) {
  if (s.k === 'cover') return (
    <div className="mt-auto pb-6">
      <motion.p {...rise(0.2)} className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/85">BeWise · {s.minutes} min read</motion.p>
      <motion.h1 {...rise(0.35)} className="mt-2 font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.01em]">{s.title}</motion.h1>
      <motion.p {...rise(0.5)} className="mt-3 text-[17px] leading-6 text-white/90">{s.sub}</motion.p>
      <motion.p {...rise(0.8)} className="mt-6 text-[13px] font-semibold text-white/75">Tap to begin →</motion.p>
    </div>
  )
  if (s.k === 'text') return (
    <div className="my-auto">
      <motion.div initial={{ scale: 0.6, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.1 }}
        className="mx-auto mb-5 grid size-32 place-items-center rounded-full bg-white/90 shadow-[0_20px_50px_rgba(0,0,0,.25)]">
        {s.flower ? <FlowerArt name={s.flower} decorative className="size-24" /> : <span className="text-[56px]" aria-hidden>{s.emoji}</span>}
      </motion.div>
      <motion.p {...rise(0.25)} className="text-center text-[12px] font-bold uppercase tracking-[0.14em] text-white/80">{s.kicker}</motion.p>
      <motion.h2 {...rise(0.35)} className="mt-1.5 text-center font-display text-[30px] font-semibold leading-9">{s.title}</motion.h2>
      <motion.p {...rise(0.5)} className="mt-3 text-center text-[17px] leading-7 text-white/92">{s.body}</motion.p>
    </div>
  )
  if (s.k === 'remedies') return (
    <div className="my-auto">
      <motion.h2 {...rise(0.1)} className="font-display text-[25px] font-semibold leading-8">{s.title}</motion.h2>
      {s.sub && <motion.p {...rise(0.18)} className="mt-1 text-[13px] text-white/80">{s.sub}</motion.p>}
      {/* owner 2026-11-23: never a list to self-pick from */}
      <motion.div {...rise(0.22)}><SessionOnly dark className="mt-3" /></motion.div>
      <ul className="mt-3 space-y-2">
        {s.items.map((r, k) => (
          <motion.li key={r.name} {...rise(0.3 + k * 0.1)} className="flex items-center gap-3 rounded-[18px] bg-white/92 p-2 pr-4 text-ink shadow-[0_10px_30px_rgba(0,0,0,.15)]">
            <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-peri-50"><FlowerArt name={r.name} decorative className="size-10" /></span>
            <span className="min-w-0"><span className="block font-display text-[15px] font-semibold text-navy">{r.name}</span><span className="block text-[12px] leading-4 text-ink-2">{r.line}</span></span>
          </motion.li>
        ))}
      </ul>
    </div>
  )
  if (s.k === 'steps') return (
    <div className="my-auto">
      <motion.h2 {...rise(0.1)} className="font-display text-[26px] font-semibold leading-8">{s.title}</motion.h2>
      <ol className="mt-4 space-y-2.5">
        {s.items.map((x, k) => (
          <motion.li key={x.t} {...rise(0.25 + k * 0.15)} className="flex gap-3 rounded-[20px] bg-white/14 p-3.5 ring-1 ring-white/25 backdrop-blur-md">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[22px]" aria-hidden>{x.emoji}</span>
            <span className="min-w-0"><span className="block text-[12px] font-bold text-white/70">Step {k + 1}</span><span className="block text-[16px] font-bold">{x.t}</span><span className="block text-[14px] leading-5 text-white/88">{x.d}</span></span>
          </motion.li>
        ))}
      </ol>
    </div>
  )
  if (s.k === 'know') return (
    <div className="my-auto">
      <motion.div initial={{ scale: 0.9, opacity: 0, rotate: -2 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 140, damping: 15, delay: 0.1 }}
        className="rounded-[28px] bg-[#fff6dc] p-6 text-ink shadow-[0_24px_60px_rgba(0,0,0,.3)]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f6de8d] px-3 py-1.5 text-[13px] font-bold text-[#6b5320]"><Lightbulb className="size-4" /> Did you know?</span>
        <p className="mt-4 font-display text-[22px] font-medium leading-8">{s.fact}</p>
        <p className="mt-4 text-[12px] font-semibold text-ink-2">{s.source}</p>
      </motion.div>
    </div>
  )
  if (s.k === 'quote') return (
    <div className="my-auto">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.5, ease }}><Quote className="size-12 fill-white/90 text-white/90" aria-hidden /></motion.div>
      <motion.blockquote {...rise(0.25)} className="mt-3 font-display text-[24px] italic leading-9">“{s.quote}”</motion.blockquote>
      <motion.p {...rise(0.45)} className="mt-4 text-[15px] font-semibold">{s.name}</motion.p>
      <motion.p {...rise(0.55)} className="text-[12px] text-white/75">A BeWise member, shared with permission</motion.p>
    </div>
  )
  return (
    <div className="my-auto">
      <motion.img {...rise(0.1)} src={`${BP}/img/jitu-portrait.webp`} alt="" className="mx-auto h-[150px] w-auto object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,.3)]" />
      <motion.h2 {...rise(0.25)} className="mt-4 text-center font-display text-[30px] font-semibold leading-9">{s.title}</motion.h2>
      <motion.p {...rise(0.35)} className="mt-2 text-center text-[16px] leading-6 text-white/92">{s.body}</motion.p>
      <motion.div {...rise(0.5)} className="pointer-events-auto relative z-20 mt-6 space-y-2.5">
        <Link href="/app/book" className="flex h-[52px] items-center justify-center rounded-full bg-white font-display text-[16px] font-semibold text-navy">Book a session</Link>
        {next.id !== story.id && <Link href={`/app/learn/story?id=${next.id}`} className="flex h-12 items-center justify-center rounded-full bg-white/15 text-[15px] font-semibold ring-1 ring-white/30">Next story: {next.title}</Link>}
      </motion.div>
      <motion.p {...rise(0.65)} className="mt-5 text-center text-[12px] leading-5 text-white/75">{s.care}</motion.p>
    </div>
  )
}
