'use client'
/**
 * @module   client-shell
 * @owner    CLIENT
 * @screens  nav (Home · Care · Book · Shop · Me), header, CL-09 Log a feeling sheet, CL-10 Notifications sheet
 * v5 (HUB 2026-11-20): white tab bar with labels + navy dot (DESIGN-SYSTEM §5); 2nd tab renamed "Care" (route stays
 *   /app/remedies); header carries the official horizontal logo (32 px); hosts the install / reminder prompts.
 */
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { Bell, ChevronLeft, House, Search, ShoppingBag, Sprout, User, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { create } from 'zustand'
import { Avatar, Logo, MoodButton, MoodImg, LogoMark } from './brand'
import { Btn, Chrome, IconBtn, Sheet, buzz, spring, toast, useChrome } from './ui'
import { MOODS, PRIMARY_MOODS, moodOf, searchMoods, type Emotion } from '@/lib/data'
import { useApp } from '@/lib/store'
import { fmtTime, fmtDay } from '@/lib/format'
import { BP } from '@/lib/asset'
import { InstallPrompt, usePromptBoot } from './prompts'

export const useUi = create<{ navHidden: boolean; setNavHidden: (v: boolean) => void }>((set) => ({ navHidden: false, setNavHidden: (v) => set({ navHidden: v }) }))

const NAV = [
  { href: '/app', label: 'Home', icon: House, match: (p: string) => p === '/app' || p.startsWith('/app/journal') || p.startsWith('/app/goals') || p.startsWith('/app/ask') },
  // owner 2026-11-18: no separate Book tab; remedies, sessions and booking live together under My care
  { href: '/app/remedies', label: 'My care', icon: Sprout, match: (p: string) => p.startsWith('/app/remedies') || p.startsWith('/app/book') || p.startsWith('/app/sessions') },
  { href: '/app/shop', label: 'Shop', icon: ShoppingBag, match: (p: string) => p.startsWith('/app/shop') || p.startsWith('/app/bag') || p.startsWith('/app/checkout') || p.startsWith('/app/orders') },
  { href: '/app/me', label: 'Me', icon: User, match: (p: string) => p.startsWith('/app/me') || p.startsWith('/app/help') },
]
const NAV_ROOTS = new Set(['/app', '/app/remedies', '/app/book', '/app/shop', '/app/me', '/app/journal', '/app/sessions', '/app/orders', '/app/goals'])

/** Static hosting serves /app/ (trailing slash) — compare routes without it. */
export const usePath = () => { const p = usePathname() || '/'; return p.length > 1 ? p.replace(/\/+$/, '') : p }

// In-app history (paths only), so Back steps back instead of pushing a new page: pushing the parent made
// Checkout → Bag → (back) Checkout loop forever (owner 2026-11-18).
const trail: string[] = []
function useTrail() {
  const path = usePath()
  useEffect(() => {
    if (trail[trail.length - 1] === path) return
    if (trail[trail.length - 2] === path) trail.pop() // went back
    else trail.push(path)
    if (trail.length > 50) trail.shift()
  }, [path])
}
function useBack(target?: string) {
  const router = useRouter()
  return () => {
    const prev = trail[trail.length - 2]
    if (prev && (!target || prev === target)) return router.back()
    router.replace(target ?? '/app')
  }
}

/** True on screens that show the tab bar (prompts and floating pills position against it). */
export function useNavShown() {
  const path = usePath()
  const hidden = useUi((st) => st.navHidden)
  return NAV_ROOTS.has(path) && !hidden
}

function BottomNav() {
  const path = usePath()
  const show = useNavShown()
  const count = useApp((s) => s.cart.reduce((n, l) => n + l.qty, 0))
  return (
    <AnimatePresence>
      {show && (
        <motion.nav aria-label="Main" initial={{ y: 90 }} animate={{ y: 0 }} exit={{ y: 90 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
          <div className="flex h-16 items-stretch justify-around px-1">
            {NAV.map(({ href, label, icon: Icon, match }) => {
              const active = match(path)
              return (
                <Link key={href} href={href} aria-current={active ? 'page' : undefined} onClick={() => buzz(5)} id={label === 'Shop' ? 'nav-bag' : undefined}
                  className={`relative flex min-w-[60px] flex-1 flex-col items-center justify-center gap-1 rounded-[14px] transition-colors ${active ? 'text-navy' : 'text-muted hover:text-ink'}`}>
                  {active && <motion.span layoutId="nav-dot" transition={spring} className="absolute top-1.5 size-1 rounded-full bg-navy" />}
                  <span className="relative mt-1">
                    <Icon className="size-[22px]" strokeWidth={active ? 2.1 : 1.75} aria-hidden />
                    {label === 'Shop' && count > 0 && (
                      <motion.span key={count} initial={{ scale: 0.3 }} animate={{ scale: [1.4, 1] }} transition={spring}
                        className="absolute -right-2.5 -top-1.5 grid min-w-[18px] place-items-center rounded-full bg-coral px-1 text-[10px] font-bold leading-[18px] text-white ring-2 ring-white">{count}</motion.span>
                    )}
                  </span>
                  <span className={`text-[11px] leading-none ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
                </Link>
              )
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  )
}

/** Header turns solid once the page scrolls under it (transparent over Home's soft wash). */
function useScrolled() {
  const [on, setOn] = useState(false)
  useEffect(() => { const f = () => setOn(window.scrollY > 8); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f) }, [])
  return on
}

export function AppHeader({ back, right, title }: { back?: boolean | string; right?: ReactNode; title?: string }) {
  const goBack = useBack(typeof back === 'string' ? back : undefined)
  const { openNotices } = useChrome()
  const unread = useApp((s) => s.notices.filter((n) => !n.read).length)
  const profile = useApp((s) => s.profile)
  const scrolled = useScrolled()
  // owner 2026-11-18: a visible Back button on every screen except Home
  const path = usePath()
  const showBack = !!back || path !== '/app'
  return (
    <header className={`sticky top-0 z-30 -mx-5 flex items-center justify-between gap-3 px-5 pb-3 pt-2 safe-t transition-[background-color,box-shadow] duration-200 ${scrolled ? 'bg-sky-50/90 shadow-[0_1px_0_var(--color-line)] backdrop-blur-xl' : 'bg-transparent'}`}>
      {showBack ? (
        <div className="flex min-w-0 items-center gap-2.5">
          <IconBtn label="Back" onClick={goBack}><ChevronLeft className="size-5" /></IconBtn>
          {title ? <span className="truncate font-display text-[18px] font-semibold text-ink">{title}</span> : <Link href="/app" aria-label="Home" className="shrink-0"><LogoMark size={36} /></Link>}
        </div>
      ) : (
        <Link href="/app" aria-label="BeWise home" className="-my-1 rounded-[8px] py-1"><Logo height={32} /></Link>
      )}
      <div className="flex items-center gap-2.5">
        {right ?? (
          <>
            <IconBtn label={`Notifications${unread ? `, ${unread} new` : ''}`} onClick={openNotices} badge={unread || undefined}><Bell className="size-5" /></IconBtn>
            <Link href="/app/me" aria-label="Me" className="rounded-full"><Avatar photo={profile?.photo} name={profile?.name} size={44} ring /></Link>
          </>
        )}
      </div>
    </header>
  )
}

/** CL-09 — 8 main feelings + a searchable list of more (owner 2026-11-18: "add happy, more options, searchable"). */
function LogSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const logMood = useApp((s) => s.logMood)
  const [pick, setPick] = useState<Emotion | null>(null)
  const [burst, setBurst] = useState(0)
  const [q, setQ] = useState('')
  const [note, setNote] = useState('')
  const now = new Date()
  useEffect(() => { if (open) { setPick(null); setQ(''); setNote('') } }, [open])
  const choose = (k: Emotion) => { setPick(k); setBurst((b) => b + 1); buzz(8) }
  const results = searchMoods(q)
  const more = MOODS.filter((m) => !PRIMARY_MOODS.includes(m.key))
  const Pill = ({ k }: { k: Emotion }) => {
    const m = moodOf(k), on = pick === k
    return (
      <motion.button type="button" layout whileTap={{ scale: 0.94 }} aria-pressed={on} onClick={() => choose(k)}
        className={`inline-flex h-12 items-center gap-2 rounded-full pl-1.5 pr-4 text-[14px] font-semibold transition-colors ${on ? 'bg-navy text-white' : 'bg-sky-50 text-ink ring-1 ring-sky-200'}`}>
        <span className="grid size-9 place-items-center rounded-full bg-white"><MoodImg mood={k} size={30} /></span>{m.label}
      </motion.button>
    )
  }
  return (
    <Sheet open={open} onClose={onClose} title="Log a feeling" tall>
      <h2 className="h-duo mt-1 text-[26px]">How are you <em>feeling?</em></h2>
      <p className="mt-1 text-[14px] text-muted">Today · {fmtTime(now)}</p>
      <label className="mt-4 flex h-12 items-center gap-3 rounded-[16px] bg-sky-50 px-4 ring-1 ring-sky-200 focus-within:ring-2 focus-within:ring-blue">
        <Search className="size-[18px] text-navy" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search feelings like happy, stressed, loved…" aria-label="Search feelings"
          className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted" />
        {q && <button aria-label="Clear search" onClick={() => setQ('')}><X className="size-4 text-muted" /></button>}
      </label>
      {q ? (
        <div className="mt-4 flex min-h-[120px] flex-wrap content-start gap-2">
          {results.length ? results.map((m) => <Pill key={m.key} k={m.key as Emotion} />) : <p className="w-full py-6 text-center text-[14px] text-muted">No match for “{q}”. Try a simpler word like “stressed” or “happy”.</p>}
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-4 gap-y-2">
            {PRIMARY_MOODS.map((k) => (
              <MoodButton key={k} mood={k} size={60} selected={pick === k} burstKey={pick === k ? burst : undefined} onPick={() => choose(k)} />
            ))}
          </div>
          <p className="mb-2 mt-5 text-[12px] font-bold uppercase tracking-[0.12em] text-muted">More feelings</p>
          <p className="mb-2 text-[12px] font-semibold text-sage-text">Pleasant</p>
          <div className="flex flex-wrap gap-2">{more.filter((m) => m.pleasant).map((m) => <Pill key={m.key} k={m.key} />)}</div>
          <p className="mb-2 mt-4 text-[12px] font-semibold text-rose">Difficult</p>
          <div className="flex flex-wrap gap-2">{more.filter((m) => !m.pleasant).map((m) => <Pill key={m.key} k={m.key} />)}</div>
        </>
      )}
      <AnimatePresence>
        {pick && (
          <motion.label initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 block overflow-hidden">
            <span className="mb-1.5 block text-[13px] font-semibold text-navy">Add a note <span className="font-normal text-muted">(optional)</span></span>
            <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))} rows={3} placeholder="What’s behind this feeling? A word or two is enough."
              className="w-full resize-none rounded-[20px] bg-sky-50 p-4 text-[15px] leading-6 outline-none ring-1 ring-sky-200 placeholder:text-muted focus:ring-2 focus:ring-blue" />
          </motion.label>
        )}
      </AnimatePresence>
      <div className="sticky bottom-0 -mx-5 mt-4 bg-white px-5 pb-1 pt-3">
        <Btn full disabled={!pick} onClick={() => { if (!pick) return; logMood(pick, new Date(), note); toast(`Logged · ${moodOf(pick).label}`); onClose() }}>
          {pick ? `Save · ${moodOf(pick).label}` : 'Choose a feeling'}
        </Btn>
      </div>
    </Sheet>
  )
}

/** Journal entry: read / write its note, or remove it. Opened from Home ("Add a note") and the journal list. */
function EntrySheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const entry = useApp((s) => s.journal.find((j) => j.id === id))
  const update = useApp((s) => s.updateMood)
  const remove = useApp((s) => s.removeMood)
  const restore = useApp((s) => s.logMood)
  const [note, setNote] = useState('')
  useEffect(() => { setNote(entry?.note ?? '') }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Sheet open={!!id && !!entry} onClose={onClose} title="Journal entry">
      {entry && (
        <div className="pb-1 pt-1">
          <div className="flex items-center gap-4">
            <MoodImg mood={entry.emotion} size={72} />
            <div><p className="text-[22px] font-extrabold text-navy">{moodOf(entry.emotion).label}</p><p className="text-[14px] text-muted">{fmtDay(entry.at)} · {fmtTime(entry.at)}</p></div>
          </div>
          <label className="mt-5 block">
            <span className="mb-1.5 block text-[13px] font-semibold text-navy">Your note</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))} rows={4} placeholder="What’s behind this feeling? A word or two is enough."
              className="w-full resize-none rounded-[20px] bg-sky-50 p-4 text-[15px] leading-6 outline-none ring-1 ring-sky-200 placeholder:text-muted focus:ring-2 focus:ring-blue" />
            <span className="mt-1 block text-right text-[11px] text-muted tnum">{note.length}/500</span>
          </label>
          <div className="mt-3 flex gap-3">
            <Btn full variant="white" size="md" onClick={() => { const e = entry; remove(e.id); onClose(); toast('Entry removed', { label: 'Undo', onClick: () => restore(e.emotion, new Date(e.at), e.note) }) }}>Remove</Btn>
            <Btn full size="md" onClick={() => { update(entry.id, { note }); toast(note.trim() ? 'Note saved' : 'Saved'); onClose() }}>Save note</Btn>
          </div>
        </div>
      )}
    </Sheet>
  )
}

function NoticeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const notices = useApp((s) => s.notices)
  const read = useApp((s) => s.readNotices)
  const router = useRouter()
  useEffect(() => { if (!open) return; const t = setTimeout(read, 1200); return () => clearTimeout(t) }, [open, read])
  return (
    <Sheet open={open} onClose={onClose} title="Updates">
      <h2 className="h-duo mt-1 text-[26px]">Your <em>updates</em></h2>
      {notices.length === 0 ? (
        <div className="py-10 text-center"><img src={`${BP}/img/owl-sleep.webp`} alt="" className="mx-auto h-28" /><p className="mt-3 text-[14px] text-muted">All quiet for now. We’ll let you know when something needs you.</p></div>
      ) : (
        <ul className="mt-4 space-y-2">
          {notices.map((n, i) => (
            <motion.li key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <button onClick={() => { onClose(); if (n.href) router.push(n.href) }} className="flex w-full items-start gap-3 rounded-[20px] bg-sky-50 p-4 text-left">
                <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-coral'}`} />
                <span className="flex-1"><span className="block font-display text-[16px] font-semibold text-ink">{n.title}</span><span className="block text-[13px] text-muted">{n.body}</span></span>
                <span className="text-[12px] text-muted">{fmtDay(n.at)}</span>
              </button>
            </motion.li>
          ))}
        </ul>
      )}
    </Sheet>
  )
}

/** Image that flies from a product card to the Shop tab when added to bag. */
function Flyer({ fly, onDone }: { fly: { from: DOMRect; img: string; id: number } | null; onDone: () => void }) {
  const [to, setTo] = useState<{ x: number; y: number } | null>(null)
  useEffect(() => {
    if (!fly) return
    const t = document.getElementById('nav-bag')?.getBoundingClientRect()
    setTo(t ? { x: t.left + t.width / 2, y: t.top + t.height / 2 } : { x: window.innerWidth - 40, y: 40 })
  }, [fly])
  if (!fly || !to) return null
  const sx = fly.from.left + fly.from.width / 2, sy = fly.from.top + fly.from.height / 2
  return (
    <motion.img key={fly.id} src={fly.img} alt="" aria-hidden className="pointer-events-none fixed z-[70] h-20 w-20 object-contain"
      style={{ left: sx - 40, top: sy - 40 }}
      initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
      animate={{ x: [0, (to.x - sx) * 0.4, to.x - sx], y: [0, -120, to.y - sy], scale: [1, 0.8, 0.2], opacity: [1, 1, 0.3] }}
      transition={{ duration: 0.8, ease: [0.5, 0, 0.3, 1] }} onAnimationComplete={onDone} />
  )
}

const PREFETCH = ['/app', '/app/remedies', '/app/book', '/app/shop', '/app/me', '/app/journal', '/app/sessions', '/app/ask', '/app/goals', '/app/bag', '/app/checkin', '/app/pay']
/** Fetch the other screens' code while the phone is idle, so the first tap on any tab is instant. */
function IdlePrefetch() {
  const router = useRouter()
  useEffect(() => {
    type IdleWin = Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void }
    const w = window as IdleWin
    let i = 0, handle = 0
    const next = () => { if (i >= PREFETCH.length) return; router.prefetch(PREFETCH[i++]); handle = w.requestIdleCallback ? w.requestIdleCallback(next, { timeout: 2000 }) : window.setTimeout(next, 200) }
    const start = window.setTimeout(next, 1200) // after first paint & hydration
    return () => { clearTimeout(start); if (w.cancelIdleCallback) w.cancelIdleCallback(handle); else clearTimeout(handle) }
  }, [router])
  return null
}

export function AppChrome({ children }: { children: ReactNode }) {
  useTrail()
  usePromptBoot()
  const [log, setLog] = useState(false)
  const [notes, setNotes] = useState(false)
  const [entry, setEntry] = useState<string | null>(null)
  const openEntry = useCallback((id: string) => setEntry(id), [])
  const [fly, setFly] = useState<{ from: DOMRect; img: string; id: number } | null>(null)
  const openLog = useCallback(() => setLog(true), [])
  const openNotices = useCallback(() => setNotes(true), [])
  const flyToBag = useCallback((from: DOMRect, img: string) => setFly({ from, img, id: Date.now() }), [])
  const ctx = useMemo(() => ({ openLog, openNotices, openEntry, flyToBag }), [openLog, openNotices, openEntry, flyToBag])
  return (
    <Chrome.Provider value={ctx}>
      {children}
      <IdlePrefetch />
      <BottomNav />
      <InstallPrompt />
      <LogSheet open={log} onClose={() => setLog(false)} />
      <NoticeSheet open={notes} onClose={() => setNotes(false)} />
      <EntrySheet id={entry} onClose={() => setEntry(null)} />
      <Flyer fly={fly} onDone={() => setFly(null)} />
    </Chrome.Provider>
  )
}
