'use client'
/**
 * @module   client-ui
 * @owner    CLIENT
 * Purpose:  v5 Blue Bloom primitives (DESIGN-SYSTEM §5) — buttons, icon buttons, chips, toggles, segmented, sheets, toasts, reveals.
 *           v5 (HUB 2026-11-20): Fraunces buttons (radius 16, 54 px), solid navy (the v4 gradient variant now renders solid),
 *           thin blue progress, white sheets on a navy scrim.
 *           Small additive kit until HUB's src/components/ui exists; then these become variants there.
 */
import Link from 'next/link'
import { AnimatePresence, motion, type HTMLMotionProps, type PanInfo } from 'motion/react'
import { Check, Loader2, X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { create } from 'zustand'

export const spring = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 } as const
export const soft = { type: 'spring', stiffness: 260, damping: 30 } as const
export const ease = [0.22, 1, 0.36, 1] as const

/**
 * Gentle haptic tap. Android: Vibration API. iPhone (Safari has no vibrate): tapping a hidden native switch
 * gives the system's light haptic on iOS 18+ (owner 2026-11-21: "add some haptic feedback, gentle"). Must run in a tap handler.
 */
let hapticLabel: HTMLLabelElement | null = null
const iosTick = () => {
  if (!hapticLabel) {
    const l = document.createElement('label'); l.setAttribute('aria-hidden', 'true')
    l.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none'
    const i = document.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', ''); i.tabIndex = -1
    l.appendChild(i); document.body.appendChild(l); hapticLabel = l
  }
  hapticLabel.click()
}
export const buzz = (ms = 8) => {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(ms)
    else if (typeof document !== 'undefined') iosTick()
  } catch { /* not supported */ }
}

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')
export { cx }

type BtnVariant = 'primary' | 'gradient' | 'white' | 'outline' | 'ghost' | 'sage'
const btnBase = 'relative inline-flex select-none items-center justify-center gap-2 font-display font-semibold tracking-[-0.005em] transition-colors disabled:cursor-not-allowed disabled:opacity-45'
const btnVar: Record<BtnVariant, string> = {
  primary: 'bg-navy text-white shadow-[var(--shadow-cta)] hover:bg-navy-2 disabled:shadow-none',
  gradient: 'bg-navy text-white shadow-[var(--shadow-cta)] hover:bg-navy-2 disabled:shadow-none', // v5: no gradients on buttons
  white: 'border border-sky-200 bg-white text-navy hover:bg-sky-50', // spec "Secondary"
  outline: 'border border-sky-200 bg-white text-navy hover:bg-sky-50',
  ghost: 'text-navy underline-offset-4 hover:underline',
  sage: 'bg-teal-100 text-sage-text',
}
const btnSize = { sm: 'h-11 rounded-[14px] px-4 text-[15px]', md: 'h-12 rounded-[16px] px-6 text-[16px]', lg: 'h-[54px] rounded-[16px] px-7 text-[17px]' }

type BtnProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  variant?: BtnVariant; size?: keyof typeof btnSize; full?: boolean; loading?: boolean; children?: ReactNode
}
export function Btn({ variant = 'primary', size = 'lg', full, loading, className, children, disabled, onClick, ...rest }: BtnProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.965 }}
      transition={spring}
      disabled={disabled || loading}
      onClick={(e) => { buzz(); onClick?.(e) }}
      className={cx(btnBase, btnVar[variant], btnSize[size], full && 'w-full', className)}
      {...rest}
    >
      {loading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
      <span className={cx('inline-flex items-center gap-2', loading && 'opacity-80')}>{children}</span>
    </motion.button>
  )
}

const MLink = motion.create(Link)
export function BtnLink({ href, variant = 'primary', size = 'lg', full, className, children }: { href: string; variant?: BtnVariant; size?: keyof typeof btnSize; full?: boolean; className?: string; children: ReactNode }) {
  return (
    <MLink href={href} whileTap={{ scale: 0.965 }} transition={spring} onClick={() => buzz()} className={cx(btnBase, btnVar[variant], btnSize[size], full && 'w-full', className)}>
      {children}
    </MLink>
  )
}

export function IconBtn({ label, children, onClick, href, className, badge }: { label: string; children: ReactNode; onClick?: () => void; href?: string; className?: string; badge?: number | boolean }) {
  const cls = cx('relative grid size-11 shrink-0 place-items-center rounded-full bg-white text-navy shadow-[var(--shadow-card)] transition-colors hover:bg-sky-50', className)
  const dot = badge ? (
    <motion.span key={String(badge)} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={spring}
      className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-coral px-1 text-[10px] font-bold leading-[18px] text-white ring-2 ring-white">
      {typeof badge === 'number' ? badge : ''}
    </motion.span>
  ) : null
  if (href) return <MLink href={href} aria-label={label} whileTap={{ scale: 0.9 }} className={cls}>{children}{dot}</MLink>
  return <motion.button aria-label={label} whileTap={{ scale: 0.9 }} onClick={() => { buzz(); onClick?.() }} className={cls}>{children}{dot}</motion.button>
}

export function Chip({ on, onClick, children, className, icon }: { on: boolean; onClick: () => void; children: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <motion.button
      type="button" role="checkbox" aria-checked={on} whileTap={{ scale: 0.95 }} layout transition={spring}
      onClick={() => { buzz(6); onClick() }}
      className={cx('inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[14px] font-semibold transition-colors duration-200',
        on ? 'bg-navy text-white shadow-[var(--shadow-cta)]' : 'bg-white text-ink ring-1 ring-sky-200', className)}
    >
      {icon}
      <AnimatePresence initial={false}>
        {on && !icon ? (
          <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: 16, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="inline-flex overflow-hidden">
            <Check className="size-4" strokeWidth={3} aria-hidden />
          </motion.span>
        ) : null}
      </AnimatePresence>
      {children}
    </motion.button>
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => { buzz(6); onChange(!on) }}
      className={cx('relative h-8 w-[52px] shrink-0 rounded-full transition-colors duration-300', on ? 'bg-navy' : 'bg-sky-200')}>
      <motion.span layout transition={spring} className="absolute top-1 size-6 rounded-full bg-white shadow" style={{ left: on ? 24 : 4 }} />
    </button>
  )
}

export function Segmented<T extends string>({ value, options, onChange, className }: { value?: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; className?: string }) {
  const id = useId()
  return (
    <div role="radiogroup" className={cx('flex gap-2', className)}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => { buzz(6); onChange(o.value) }}
            className={cx('relative h-12 flex-1 rounded-full text-[15px] font-semibold transition-colors', on ? 'text-white' : 'bg-white text-ink ring-1 ring-sky-200')}>
            {on && <motion.span layoutId={`seg-${id}`} transition={spring} className="absolute inset-0 rounded-full bg-navy shadow-[var(--shadow-cta)]" />}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Bottom sheet with spring entrance, drag-to-dismiss, Esc to close and focus handling. */
export function Sheet({ open, onClose, children, title, tall }: { open: boolean; onClose: () => void; children: ReactNode; title?: string; tall?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const t = setTimeout(() => ref.current?.focus(), 60)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(t); document.body.style.overflow = ''; prev?.focus?.() }
  }, [open, onClose])
  const onDragEnd = (_: unknown, i: PanInfo) => { if (i.offset.y > 110 || i.velocity.y > 600) onClose() }
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.28, ease }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0.05, bottom: 0.6 }} onDragEnd={onDragEnd}
            className={cx('relative w-full max-w-[480px] rounded-t-[32px] bg-white px-5 pt-3 shadow-[0_-12px_40px_rgba(23,33,74,.16)] outline-none safe-b', tall ? 'max-h-[92dvh]' : 'max-h-[86dvh]')}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-sky-200" />
            <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-20 grid size-11 place-items-center rounded-full bg-sky-50 text-navy hover:bg-sky-100"><X className="size-[18px]" /></button>
            <div className="no-scrollbar max-h-[calc(86dvh-40px)] overflow-y-auto overscroll-contain pb-2">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function ProgressBar({ value, className, label = 'Progress' }: { value: number; className?: string; label?: string }) {
  return (
    <div className={cx('h-1 overflow-hidden rounded-full bg-sky-200', className)} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
      <motion.div className="h-full rounded-full bg-blue" initial={false} animate={{ width: `${Math.max(4, value * 100)}%` }} transition={soft} />
    </div>
  )
}

export function Ring({ value, size = 64, stroke = 7, color = '#243D91', track = '#E6EDFF', children }: { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - Math.min(1, Math.max(0, value))) }} transition={{ duration: 1.1, ease }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

// ---------- Staggered reveal for page sections ----------
export const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } } }
export const rise = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } } }
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return <motion.div variants={stagger} initial="hidden" animate="show" className={className}>{children}</motion.div>
}
export function Item({ children, className, ...rest }: HTMLMotionProps<'div'>) {
  return <motion.div variants={rise} className={className} {...rest}>{children}</motion.div>
}

// ---------- Toasts (only after "server" success — PRD §20) ----------
type ToastT = { id: number; text: string; action?: { label: string; onClick: () => void } }
const useToasts = create<{ list: ToastT[]; push: (t: Omit<ToastT, 'id'>) => void; drop: (id: number) => void }>((set) => ({
  list: [],
  push: (t) => { const id = Date.now() + Math.random(); set((s) => ({ list: [...s.list.slice(-2), { ...t, id }] })); setTimeout(() => set((s) => ({ list: s.list.filter((x) => x.id !== id) })), 2800) },
  drop: (id) => set((s) => ({ list: s.list.filter((x) => x.id !== id) })),
}))
export const toast = (text: string, action?: ToastT['action']) => useToasts.getState().push({ text, action })
export function Toaster() {
  const list = useToasts((s) => s.list), drop = useToasts((s) => s.drop)
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 safe-t">
      <AnimatePresence>
        {list.map((t) => (
          <motion.div key={t.id} layout initial={{ y: -40, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -30, opacity: 0 }} transition={spring}
            className="pointer-events-auto mt-2 flex max-w-[440px] items-center gap-3 rounded-[18px] bg-ink py-2.5 pl-3 pr-2.5 text-[14px] font-medium text-white shadow-[var(--shadow-float)]">
            <span className="grid size-6 place-items-center rounded-full bg-teal text-white"><Check className="size-3.5" strokeWidth={3} /></span>
            <span className="pr-2">{t.text}</span>
            {t.action ? <button onClick={() => { t.action!.onClick(); drop(t.id) }} className="min-h-8 rounded-full bg-white/15 px-3 py-1 text-[13px] font-semibold">{t.action.label}</button> : null}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ---------- Simple context for one-sheet-at-a-time app chrome (log feeling, notifications) ----------
type ChromeCtx = { openLog: () => void; openNotices: () => void; openEntry: (id: string) => void; flyToBag: (from: DOMRect, img: string) => void }
export const Chrome = createContext<ChromeCtx>({ openLog: () => {}, openNotices: () => {}, openEntry: () => {}, flyToBag: () => {} })
export const useChrome = () => useContext(Chrome)

export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), intervalMs); return () => clearInterval(t) }, [intervalMs])
  return now
}

export function useStableCallback<T extends (...a: never[]) => unknown>(fn: T) {
  const r = useRef(fn); r.current = fn
  return useCallback(((...a: never[]) => r.current(...a)) as T, [])
}
