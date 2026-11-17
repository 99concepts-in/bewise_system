/**
 * @module   ops-prototype/ui
 * @owner    MANAGER
 * Purpose:  Small motion-first UI kit for the manager app (v4 Soft Bloom tokens). Only transform/opacity animate,
 *           so everything stays at 60fps on a mid-range phone.
 */
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from 'motion/react'
import { ChevronLeft, Check } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useStore } from '../lib/store'
import type { Tone } from '../lib/stages'

export const spring = { type: 'spring', stiffness: 520, damping: 38, mass: 0.8 } as const
export const soft = { type: 'spring', stiffness: 300, damping: 32 } as const

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export function useMedia(q: string) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [q])
  return m
}
export const useDesktop = () => useMedia('(min-width: 1024px)')

/* ───────────────────────── Screen & header ───────────────────────── */
export function Screen({ title, sub, back = true, actions, children, wide }: {
  title: ReactNode; sub?: ReactNode; back?: boolean; actions?: ReactNode; children: ReactNode; wide?: boolean
}) {
  const stack = useStore((s) => s.stack.length)
  const root = useStore((s) => s.root)
  const popStack = useStore((s) => s.back)
  const setRoot = useStore((s) => s.setRoot)
  const desktop = useDesktop()
  const subOfMe = !desktop && stack === 0 && !['today', 'orders', 'money', 'me'].includes(root)
  const goBack = stack > 0 ? popStack : () => setRoot('me')
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      className={cx('mx-auto w-full pb-60 lg:pb-32', wide ? 'max-w-6xl' : 'max-w-3xl')}
    >
      <header className="flex items-start gap-3 pt-5 pb-5 lg:pt-10">
        {back && (stack > 0 || subOfMe) && (
          <IconButton label="Back" onClick={goBack} className="mt-1 shrink-0"><ChevronLeft size={20} /></IconButton>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] leading-[1.12] font-bold tracking-[-0.02em] text-ink lg:text-[32px]">{title}</h1>
          {sub && <p className="mt-1 text-[15px] font-medium text-ink-2">{sub}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2 pt-1">{actions}</div>}
      </header>
      {children}
    </motion.div>
  )
}

export function IconButton({ label, children, onClick, className, badge }: { label: string; children: ReactNode; onClick?: () => void; className?: string; badge?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }} transition={spring} aria-label={label} title={label} onClick={onClick}
      className={cx('relative grid size-11 place-items-center rounded-full bg-surface text-ink shadow-soft', className)}
    >
      {children}
      {badge && <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-bad ring-2 ring-[var(--surface)]" />}
    </motion.button>
  )
}

/* ───────────────────────── Surfaces ───────────────────────── */
export function Surface({ children, className, pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return <section className={cx('rounded-[28px] bg-surface shadow-soft', pad && 'p-5', className)}>{children}</section>
}
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mt-7 mb-3 flex items-baseline justify-between gap-3 px-1">
      <h2 className="text-[17px] font-bold tracking-[-0.01em] text-ink">{children}</h2>
      {action}
    </div>
  )
}
export function Row({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) {
  const Comp = onClick ? motion.button : motion.div
  return (
    <Comp
      layout="position" onClick={onClick} whileTap={onClick ? { scale: 0.985 } : undefined} transition={spring}
      className={cx('flex w-full items-center gap-3 px-4 py-3.5 text-left', onClick && 'hover:bg-surface-2/70', className)}
    >
      {children}
    </Comp>
  )
}
export function Divided({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-[var(--line)] overflow-hidden rounded-[24px] bg-surface shadow-soft">{children}</div>
}

const TONE: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-2', accent: 'bg-accent-soft text-accent', sage: 'bg-sage-soft text-sage',
  gold: 'bg-gold-soft text-gold', ok: 'bg-ok-soft text-ok', warn: 'bg-warn-soft text-warn', bad: 'bg-bad-soft text-bad',
}
export function Chip({ tone = 'neutral', children, icon, className }: { tone?: Tone; children: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-semibold whitespace-nowrap', TONE[tone], className)}>
      {icon}{children}
    </span>
  )
}

/* ───────────────────────── Buttons ───────────────────────── */
type BtnKind = 'primary' | 'secondary' | 'ghost' | 'danger'
export function Button({ kind = 'secondary', children, onClick, disabled, className, icon, type = 'button', full }: {
  kind?: BtnKind; children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string; icon?: ReactNode; type?: 'button' | 'submit'; full?: boolean
}) {
  const styles: Record<BtnKind, string> = {
    primary: 'cta shadow-lift', secondary: 'bg-surface text-ink shadow-soft', ghost: 'text-accent hover:bg-accent-soft', danger: 'bg-bad-soft text-bad',
  }
  return (
    <motion.button
      type={type} whileTap={disabled ? undefined : { scale: 0.96 }} transition={spring} onClick={onClick} disabled={disabled}
      className={cx('inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold transition-opacity disabled:opacity-40', styles[kind], full && 'w-full', className)}
    >
      {icon}{children}
    </motion.button>
  )
}

/**
 * The one big button that moves work forward. Label morphs between stages.
 * hold=true → press and hold ~0.7s to confirm (irreversible actions such as dispatch).
 */
export function FlowBar({ label, onAction, disabled, hint, hold, secondary, icon, inline }: {
  label: string; onAction: () => void; disabled?: boolean; hint?: string; hold?: boolean; secondary?: ReactNode; icon?: ReactNode; inline?: boolean
}) {
  const p = useMotionValue(0)
  const width = useTransform(p, (v) => `${v * 100}%`)
  const anim = useRef<ReturnType<typeof animate> | null>(null)
  const reduce = useReducedMotion()
  const start = () => {
    if (!hold || disabled) return
    anim.current?.stop()
    anim.current = animate(p, 1, { duration: reduce ? 0.05 : 0.7, ease: 'linear', onComplete: () => { p.set(0); onAction() } })
  }
  const cancel = () => { if (!hold) return; anim.current?.stop(); animate(p, 0, { duration: 0.2 }) }
  return (
    <div className={inline ? 'relative' : 'pointer-events-none fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom,0px))] z-30 lg:bottom-6 lg:left-[244px]'}>
      <div className={cx('pointer-events-auto mx-auto flex max-w-3xl items-center gap-3', !inline && 'gutter')}>
        {secondary}
        <motion.button
          layout disabled={disabled}
          onClick={hold ? undefined : onAction}
          onPointerDown={start} onPointerUp={cancel} onPointerLeave={cancel}
          onKeyDown={(e) => { if (hold && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onAction() } }}
          whileTap={disabled ? undefined : { scale: 0.97 }} transition={spring}
          className="cta relative h-[58px] flex-1 overflow-hidden rounded-full text-[16px] font-bold shadow-lift disabled:cursor-not-allowed disabled:![background:var(--surface-2)] disabled:!text-ink-3 disabled:shadow-soft"
        >
          {hold && <motion.span aria-hidden style={{ width }} className="absolute inset-y-0 left-0 bg-white/25" />}
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={label} initial={{ y: 22, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -22, opacity: 0 }} transition={spring}
              className="relative flex items-center justify-center gap-2"
            >
              {icon}{label}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
      {hint && <p className="pointer-events-none mt-2 text-center"><span className="rounded-full bg-surface px-3 py-1 text-[12px] font-semibold text-ink-2 shadow-soft">{hint}</span></p>}
    </div>
  )
}

/* ───────────────────────── Segmented & filter pills ───────────────────────── */
export function Segmented<T extends string>({ options, value, onChange, id, className }: {
  options: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; id: string; className?: string
}) {
  return (
    <div role="tablist" className={cx('flex gap-1 rounded-full bg-surface p-1 shadow-soft', className)}>
      {options.map((o) => (
        <button
          key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={cx('relative h-10 flex-1 rounded-full px-3 text-[14px] font-semibold whitespace-nowrap transition-colors', value === o.value ? 'text-[var(--cta-fg)]' : 'text-ink-2 hover:text-ink')}
        >
          {value === o.value && <motion.span layoutId={`seg-${id}`} transition={spring} className="absolute inset-0 rounded-full bg-[var(--cta-from)]" />}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

/* ───────────────────────── Numbers ───────────────────────── */
export function CountUp({ value, format = (n) => Math.round(n).toLocaleString('en-IN') }: { value: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prev = useRef(0)
  const reduce = useReducedMotion()
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduce) { el.textContent = format(value); prev.current = value; return }
    const c = animate(prev.current, value, { duration: 0.7, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => { el.textContent = format(v) } })
    prev.current = value
    return () => c.stop()
  }, [value, format, reduce])
  return <span ref={ref} className="tnum">{format(value)}</span>
}

/* ───────────────────────── Check row ───────────────────────── */
export function CheckRow({ checked, onToggle, label, sub, strong }: { checked: boolean; onToggle: () => void; label: ReactNode; sub?: ReactNode; strong?: boolean }) {
  return (
    <motion.button
      role="checkbox" aria-checked={checked} onClick={onToggle} whileTap={{ scale: 0.98 }} transition={spring}
      className={cx('flex w-full items-center gap-3.5 rounded-2xl px-3 py-3 text-left transition-colors', checked ? 'bg-sage-soft/60' : 'hover:bg-surface-2', strong && !checked && 'ring-2 ring-[var(--gold)]')}
    >
      <motion.span
        animate={{ backgroundColor: checked ? 'var(--cta-from)' : 'rgba(0,0,0,0)', borderColor: checked ? 'var(--cta-from)' : 'var(--ink-3)' }}
        transition={{ duration: 0.18 }}
        className="grid size-7 shrink-0 place-items-center rounded-full border-2"
      >
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <motion.path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="var(--cta-fg)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
            initial={false} animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }} transition={{ duration: 0.22, ease: 'easeOut' }} />
        </svg>
      </motion.span>
      <span className="min-w-0 flex-1">
        <span className={cx('block text-[15px] font-semibold transition-colors', checked ? 'text-ink' : 'text-ink')}>{label}</span>
        {sub && <span className="block text-[13px] text-ink-2">{sub}</span>}
      </span>
    </motion.button>
  )
}

/* ───────────────────────── Sheet (bottom sheet on phone, dialog on computer) ───────────────────────── */
export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const desktop = useDesktop()
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  const onDragEnd = (_: unknown, i: PanInfo) => { if (i.offset.y > 120 || i.velocity.y > 600) onClose() }
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center" role="dialog" aria-modal aria-label={typeof title === 'string' ? title : undefined}>
          <motion.div className="absolute inset-0 bg-[var(--scrim)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose} />
          <motion.div
            initial={desktop ? { opacity: 0, scale: 0.96, y: 12 } : { y: '100%' }}
            animate={desktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={desktop ? { opacity: 0, scale: 0.97, y: 8 } : { y: '100%' }}
            transition={desktop ? { duration: 0.18 } : { type: 'spring', stiffness: 420, damping: 40 }}
            drag={desktop ? false : 'y'} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }} onDragEnd={onDragEnd}
            className="relative flex max-h-[92dvh] w-full flex-col rounded-t-[32px] bg-[var(--ground-mid)] shadow-lift lg:max-w-lg lg:rounded-[32px]"
          >
            <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-[var(--line)] lg:hidden" />
            <div className="gutter flex items-center justify-between pt-4 pb-3">
              <h2 className="text-[20px] font-bold tracking-[-0.01em] text-ink">{title}</h2>
              <button onClick={onClose} className="rounded-full px-3 py-1.5 text-[14px] font-semibold text-accent hover:bg-accent-soft">Close</button>
            </div>
            <div className="gutter min-h-0 flex-1 overflow-y-auto pb-4" onPointerDownCapture={(e) => e.stopPropagation()}>{children}</div>
            {footer && <div className="gutter shrink-0 pt-2 pb-[max(16px,env(safe-area-inset-bottom,0px))]">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/* ───────────────────────── Form fields ───────────────────────── */
export function Field({ label, children, hint, error }: { label: string; children: ReactNode; hint?: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-[12.5px] font-semibold text-bad">{error}</span> : hint && <span className="mt-1 block text-[12.5px] text-ink-2">{hint}</span>}
    </label>
  )
}
export const inputCls = 'h-12 w-full rounded-2xl border border-[var(--line)] bg-surface px-4 text-[15px] text-ink outline-none transition-shadow placeholder:text-ink-3 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]'
export const areaCls = 'min-h-24 w-full rounded-2xl border border-[var(--line)] bg-surface px-4 py-3 text-[15px] leading-relaxed text-ink outline-none placeholder:text-ink-3 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]'

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={cx('relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200', on ? 'bg-[var(--cta-from)]' : 'bg-surface-2 ring-1 ring-[var(--line)]')}>
      <motion.span layout transition={spring} className={cx('absolute top-1 size-6 rounded-full bg-white shadow', on ? 'right-1' : 'left-1')} />
    </button>
  )
}

/** Choice pills (courier, method, reason). */
export function Choices<T extends string>({ options, value, onChange, id }: { options: { value: T; label: ReactNode }[]; value: T | undefined; onChange: (v: T) => void; id: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cx('relative h-10 rounded-full px-4 text-[14px] font-semibold transition-colors', value === o.value ? 'text-[var(--cta-fg)]' : 'bg-surface text-ink shadow-soft')}>
          {value === o.value && <motion.span layoutId={`choice-${id}`} transition={spring} className="absolute inset-0 rounded-full bg-[var(--cta-from)]" />}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

/* ───────────────────────── Empty state ───────────────────────── */
export function Empty({ img, title, body, action }: { img?: string; title: string; body: string; action?: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={soft} className="flex flex-col items-center px-6 py-10 text-center">
      {img && <motion.img src={img} alt="" width={132} height={132} className="mb-4 size-[132px] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />}
      <h3 className="text-[19px] font-bold text-ink">{title}</h3>
      <p className="mt-1 max-w-xs text-[14.5px] text-ink-2">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  )
}

/* ───────────────────────── Toasts ───────────────────────── */
export function Toasts() {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismissToast)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(12px+env(safe-area-inset-top,0px))] z-[70] flex flex-col items-center gap-2 px-4" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.button
            key={t.id} layout onClick={() => dismiss(t.id)}
            initial={{ opacity: 0, y: -24, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16, scale: 0.97 }} transition={spring}
            className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-[var(--nav)] py-2.5 pr-5 pl-2.5 text-[14px] font-semibold text-[var(--nav-active)] shadow-lift"
          >
            <span className={cx('grid size-7 place-items-center rounded-full', t.tone === 'bad' ? 'bg-bad' : t.tone === 'info' ? 'bg-accent' : 'bg-ok')}>
              <Check size={15} strokeWidth={3} className="text-white" />
            </span>
            {t.text}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}

/* ───────────────────────── Bloom: the one celebratory moment (dispatch / batch received) ───────────────────────── */
const PETALS = ['#B9CBF2', '#F4C2C8', '#BFD8C2', '#F6DE8D', '#D6CBEF', '#F3B1A4']
export function Bloom() {
  const n = useStore((s) => s.bloom)
  const reduce = useReducedMotion()
  const [burst, setBurst] = useState(0)
  useEffect(() => { if (n > 0 && !reduce) setBurst(n) }, [n, reduce])
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-[150px] z-[65] flex justify-center lg:bottom-24">
      <AnimatePresence>
        {burst > 0 && (
          <motion.div key={burst} className="relative size-0" onAnimationComplete={() => setBurst(0)} initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {Array.from({ length: 18 }, (_, i) => {
              const a = (i / 18) * Math.PI * 2 + (i % 2) * 0.2
              const r = 110 + (i % 4) * 34
              return (
                <motion.span key={i}
                  className="absolute -left-1.5 -top-2.5 block h-5 w-3 rounded-[50%_50%_50%_50%/60%_60%_40%_40%]"
                  style={{ background: PETALS[i % PETALS.length] }}
                  initial={{ x: 0, y: 0, scale: 0.2, rotate: 0, opacity: 1 }}
                  animate={{ x: Math.cos(a) * r, y: Math.sin(a) * r - 60, scale: 1, rotate: (i % 2 ? 1 : -1) * 220, opacity: 0 }}
                  transition={{ duration: 1.1, ease: [0.15, 0.7, 0.3, 1] }}
                />
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ───────────────────────── Product art placeholder ───────────────────────── */
export function ProductArt({ hue, kind, size = 48, className }: { hue: [string, string]; kind: 'oil' | 'spray' | 'salt'; size?: number; className?: string }) {
  return (
    <span className={cx('relative grid shrink-0 place-items-center overflow-hidden rounded-2xl', className)} style={{ width: size, height: size, background: `linear-gradient(150deg, ${hue[1]}, ${hue[0]})` }} aria-hidden>
      <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55} fill="none" stroke="#182957" strokeOpacity={0.7} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
        {kind === 'oil' && <><path d="M10 2h4v3h-4z" /><path d="M9 5h6l1 3v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8z" /><path d="M8 13h8" /></>}
        {kind === 'spray' && <><path d="M10 2h3v4h-3z" /><path d="M13 3h3" /><path d="M8 6h7a1 1 0 0 1 1 1v13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1z" /><path d="M7 12h9" /></>}
        {kind === 'salt' && <><path d="M5 9h14v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" /><path d="M4 6h16v3H4z" /><path d="M9 14h6" /></>}
      </svg>
    </span>
  )
}

export function Stat({ label, value, tone = 'neutral', onClick }: { label: string; value: ReactNode; tone?: Tone; onClick?: () => void }) {
  const bg: Record<Tone, string> = { neutral: 'bg-surface', accent: 'bg-accent-soft', sage: 'bg-sage-soft', gold: 'bg-gold-soft', ok: 'bg-ok-soft', warn: 'bg-warn-soft', bad: 'bg-bad-soft' }
  const Comp = onClick ? motion.button : motion.div
  return (
    <Comp whileTap={onClick ? { scale: 0.97 } : undefined} transition={spring} onClick={onClick} className={cx('rounded-[24px] p-4 text-left', bg[tone])}>
      <div className="text-[30px] leading-none font-bold tracking-[-0.02em] text-ink">{value}</div>
      <div className="mt-2 text-[13.5px] font-semibold text-ink-2">{label}</div>
    </Comp>
  )
}

/** Run fn once when a quick action targeted this screen. */
export function useIntent(key: string, fn: () => void) {
  const intent = useStore((s) => s.intent)
  const clear = useStore((s) => s.clearIntent)
  useEffect(() => {
    if (intent === key) { clear(); fn() }
  }, [intent]) // eslint-disable-line react-hooks/exhaustive-deps
}

/** Photo picker (camera on phones via capture, file on computer). Returns a small data URL. */
export function PhotoInput({ value, onChange, label, id }: { value?: string; onChange: (v: string | undefined) => void; label: string; id: string }) {
  const pick = (f?: File | null) => {
    if (!f) return
    const img = new Image()
    const url = URL.createObjectURL(f)
    img.onload = () => {
      const s = Math.min(1, 640 / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = img.width * s; c.height = img.height * s
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      onChange(c.toDataURL('image/jpeg', 0.75))
      URL.revokeObjectURL(url)
    }
    img.src = url
  }
  return (
    <div>
      <input id={id} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
      <AnimatePresence mode="wait" initial={false}>
        {value ? (
          <motion.div key="img" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative overflow-hidden rounded-[22px]">
            <img src={value} alt={label} className="max-h-64 w-full object-cover" />
            <button onClick={() => onChange(undefined)} className="absolute top-3 right-3 rounded-full bg-black/55 px-3 py-1.5 text-[13px] font-semibold text-white">Remove</button>
          </motion.div>
        ) : (
          <motion.label key="pick" htmlFor={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-[22px] border-2 border-dashed border-[var(--line)] bg-surface text-center hover:border-[var(--accent)]">
            <span className="text-[15px] font-semibold text-accent">{label}</span>
            <span className="text-[12.5px] text-ink-2">Take a photo or choose a file</span>
          </motion.label>
        )}
      </AnimatePresence>
    </div>
  )
}

export function copyText(text: string, done: (ok: boolean) => void) {
  try {
    navigator.clipboard.writeText(text).then(() => done(true), () => done(false))
  } catch { done(false) }
}
