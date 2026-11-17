import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, animate, m, useMotionValue, useTransform } from 'motion/react'
import { Check } from 'lucide-react'
import type { Mood } from '../data/types'

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

// ---------------------------------------------------------------- springs
export const spring = { type: 'spring', stiffness: 420, damping: 36, mass: 0.8 } as const
export const softSpring = { type: 'spring', stiffness: 260, damping: 30 } as const

// ---------------------------------------------------------------- avatar
const TINTS = ['#DCE2F5', '#DCE7D9', '#F4E6CF', '#EBDDF3', '#D8EBF2', '#F3DDD9']
export const MOOD_COLOR: Record<Mood, string> = {
  calm: '#BFD8C2', joyful: '#F6DE8D', grateful: '#F4C2C8', hopeful: '#B9CBF2',
  tired: '#D6CBEF', anxious: '#BFE0F2', sad: '#C3CCD8', irritated: '#F3B1A4',
}
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

export function MoodFace({ mood, size = 40 }: { mood: Mood; size?: number }) {
  return <img className="mood" src={`./img/mood-${mood}.webp`} width={size} height={size} alt={mood} loading="lazy" decoding="async" />
}

// ---------------------------------------------------------------- segmented
export function Segmented<T extends string>({ value, options, onChange, id }: { value: T; options: { value: T; label: string; count?: number }[]; onChange: (v: T) => void; id: string }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} className="seg-btn" onClick={() => onChange(o.value)}>
          {value === o.value && <m.span layoutId={`seg-${id}`} className="seg-pill" transition={spring} />}
          <span className="seg-label">{o.label}{o.count !== undefined && <span className="seg-count">{o.count}</span>}</span>
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------- chips
export function Chip({ active, children, onClick, count }: { active?: boolean; children: ReactNode; onClick?: () => void; count?: number }) {
  return (
    <button className={'chip' + (active ? ' is-on' : '')} aria-pressed={active} onClick={onClick}>
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
    const t = setTimeout(() => setMounted(false), 340)
    return () => clearTimeout(t)
  }, [open])
  if (!mounted && !open) return null
  return (
    <div className="sheet-root" role="dialog" aria-modal aria-label={label} aria-hidden={!open} style={{ pointerEvents: open ? 'auto' : 'none' }}>
      <m.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: open ? 1 : 0 }} transition={{ duration: 0.2 }} onClick={onClose} />
      <m.div
        className="sheet"
        initial={{ y: '100%' }} animate={{ y: open ? 0 : '100%' }} transition={spring}
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
export function CountUp({ to, format = (n) => Math.round(n).toLocaleString('en-IN'), duration = 0.9 }: { to: number; format?: (n: number) => string; duration?: number }) {
  const v = useMotionValue(0)
  const text = useTransform(v, format)
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { v.set(to); return }
    const c = animate(v, to, { duration, ease: [0.22, 1, 0.36, 1] })
    return () => c.stop()
  }, [to, duration, v])
  return <m.span className="num">{text}</m.span>
}

export function Empty({ img, title, body, action }: { img: string; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <img src={`./img/${img}.webp`} width={120} height={120} alt="" />
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  )
}
