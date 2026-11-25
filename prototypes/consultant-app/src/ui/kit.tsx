/**
 * UI kit: router, sheets, toast, chips, segmented, avatar, count-up, empty state, app header.
 * v5 (HUB 2026-11-20): restyled to "Blue Bloom" (D-45); sheets move on the spec's 280 ms soft easing; header carries the official logo.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { Check } from 'lucide-react'
import type { Mood } from '../data/types'
import { Logo, MoodCircle } from './art'
import { ACCENT, MOOD_TONE } from './tone'

// ---------------------------------------------------------------- router (hash)
export function useRoute() {
  const read = () => {
    const [path, q = ''] = (location.hash.replace(/^#/, '') || '/').split('?')
    return { parts: path.split('/').filter(Boolean), q }
  }
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const on = () => setRoute(read())
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return route
}
export const go = (path: string) => { if (location.hash !== '#' + path) location.hash = path }

// ---------------------------------------------------------------- media query (re-renders only when it flips)
export function useMedia(q: string) {
  const [on, setOn] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(q).matches)
  useEffect(() => {
    const m = matchMedia(q)
    const f = () => setOn(m.matches)
    m.addEventListener('change', f); f()
    return () => m.removeEventListener('change', f)
  }, [q])
  return on
}

// ---------------------------------------------------------------- springs
export const spring = { type: 'spring', stiffness: 420, damping: 36, mass: 0.8 } as const
export const softSpring = { type: 'spring', stiffness: 260, damping: 30 } as const
/** Spec §8: one soft easing; 160 ms taps, 280 ms sheets, 450 ms hero moments. */
export const EASE = [0.22, 1, 0.36, 1] as const
export const sheetTween = { duration: 0.28, ease: EASE } as const

// ---------------------------------------------------------------- app header: the official horizontal logo, 28 px (spec §1)
export function AppHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="topbar">
      <Logo className="topbar-logo" />
      {children && <div className="topbar-end">{children}</div>}
    </header>
  )
}

// ---------------------------------------------------------------- avatar
// v5: pale accent tints behind initials (ink text on every one is AA)
const TINTS = ['#E6EDFF', '#DDF4F1', '#FFF1D9', '#EEE8FF', '#DFF0FF', '#FDE3EB', '#FFE6DE']
export const MOOD_COLOR = Object.fromEntries(Object.entries(MOOD_TONE).map(([k, t]) => [k, ACCENT[t].c500])) as Record<Mood, string>
function hash(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h) }

export function Avatar({ name, size = 44, mood, layoutId }: { name: string; size?: number; mood?: Mood; layoutId?: string }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('')
  return (
    <m.span
      layoutId={layoutId}
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.36, background: TINTS[hash(name) % TINTS.length], boxShadow: mood ? `0 0 0 2.5px #fff, 0 0 0 5px ${MOOD_COLOR[mood]}` : undefined }}
      aria-hidden
    >
      {initials}
    </m.span>
  )
}

/** A journal mood. v5 Blue Bloom draws it as an accent circle with a line icon (MoodCircle); the name stays for older screens. */
export function MoodFace({ mood, size = 40 }: { mood: Mood; size?: number }) {
  return <MoodCircle mood={mood} size={size} />
}

// ---------------------------------------------------------------- segmented
export function Segmented<T extends string>({ value, options, onChange, id }: { value: T; options: { value: T; label: string; count?: number }[]; onChange: (v: T) => void; id: string }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button type="button" key={o.value} role="tab" aria-selected={value === o.value} className="seg-btn" onClick={() => onChange(o.value)}>
          {value === o.value && <m.span layoutId={`seg-${id}`} className="seg-pill" transition={spring} />}
          <span className="seg-label">{o.label}{o.count !== undefined && <span className="seg-count">{o.count}</span>}</span>
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------- chips
/** `tone` (v5): a feeling chip — when on, it takes that feeling's accent tint instead of navy. */
export function Chip({ active, children, onClick, count, tone }: { active?: boolean; children: ReactNode; onClick?: () => void; count?: number; tone?: string }) {
  return (
    <button type="button" className={'chip' + (tone ? ` chip-tone tone-${tone}` : '') + (active ? ' is-on' : '')} aria-pressed={active} onClick={onClick}>
      {children}{count !== undefined && <span className="chip-count">{count}</span>}
    </button>
  )
}

// ---------------------------------------------------------------- bottom sheet
export function Sheet({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    addEventListener('keydown', onKey)
    document.body.classList.add('locked')
    return () => { removeEventListener('keydown', onKey); document.body.classList.remove('locked') }
  }, [open, onClose])
  // The sheet owns its own presence: while closing it stops taking taps at once, keeps the last content
  // on screen for the slide-down, then unmounts. Nested layout animations can never hold it open.
  const [mounted, setMounted] = useState(open)
  const last = useRef<ReactNode>(children)
  if (open) last.current = children
  useEffect(() => {
    if (open) { setMounted(true); return }
    const t = setTimeout(() => setMounted(false), 320)
    return () => clearTimeout(t)
  }, [open])
  if (!mounted && !open) return null
  return (
    <div className="sheet-root" role="dialog" aria-modal aria-label={label} aria-hidden={!open} style={{ pointerEvents: open ? 'auto' : 'none' }}>
      <m.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: open ? 1 : 0 }} transition={{ duration: 0.24, ease: EASE }} onClick={onClose} />
      <m.div
        className="sheet"
        initial={{ y: '100%' }} animate={{ y: open ? 0 : '100%' }} transition={sheetTween}
        drag={open ? 'y' : false} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }} dragSnapToOrigin
        onDragEnd={(_, i) => { if (i.offset.y > 110 || i.velocity.y > 600) onClose() }}
      >
        <div className="sheet-grip" aria-hidden />
        <div className="sheet-body">{open ? children : last.current}</div>
      </m.div>
    </div>
  )
}

// ---------------------------------------------------------------- toast
const ToastC = createContext<(text: string) => void>(() => {})
export function ToastProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState<{ id: number; text: string } | null>(null)
  const timer = useRef<number>()
  const show = useCallback((text: string) => {
    setT({ id: Date.now(), text })
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setT(null), 2600)
  }, [])
  return (
    <ToastC.Provider value={show}>
      {children}
      <div className="toast-zone" aria-live="polite">
        <AnimatePresence>
          {t && (
            <m.div key={t.id} className="toast" initial={{ y: 24, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 12, opacity: 0 }} transition={spring}>
              <span className="toast-tick"><Check size={14} strokeWidth={3} /></span>{t.text}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </ToastC.Provider>
  )
}
export const useToast = () => useContext(ToastC)

// ---------------------------------------------------------------- count-up number
/** Count-up via a tiny rAF loop — writes straight to the DOM node, no re-renders, no animation engine needed. */
export function CountUp({ to, format = (n) => Math.round(n).toLocaleString('en-IN'), duration = 0.9 }: { to: number; format?: (n: number) => string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const from = useRef(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const start = from.current
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || start === to) { el.textContent = format(to); from.current = to; return }
    const t0 = performance.now(), ms = duration * 1000
    let raf = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms)
      const e = 1 - Math.pow(1 - k, 3)
      el.textContent = format(start + (to - start) * e)
      if (k < 1) raf = requestAnimationFrame(tick); else from.current = to
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); from.current = to }
  }, [to, duration]) // eslint-disable-line react-hooks/exhaustive-deps
  return <span ref={ref} className="num">{format(from.current)}</span>
}

export function Empty({ img, title, body, action }: { img: string; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <img src={`./img/${img}.webp`} width={120} height={120} alt="" loading="lazy" decoding="async" />
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  )
}
