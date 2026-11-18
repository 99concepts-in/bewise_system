'use client'
/**
 * @module   client-shell
 * @owner    CLIENT
 * @screens  nav (Home · Remedies · Book · Shop · Me), header, CL-09 Log a feeling sheet, CL-10 Notifications sheet
 */
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { Bell, CalendarDays, ChevronLeft, Home, Leaf, Search, ShoppingBag, User, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { create } from 'zustand'
import { Avatar, Logo, MoodButton, MoodImg } from './brand'
import { Btn, Chrome, IconBtn, Sheet, buzz, spring, toast, useChrome } from './ui'
import { MOODS, PRIMARY_MOODS, moodOf, searchMoods, type Emotion } from '@/lib/data'
import { useApp } from '@/lib/store'
import { fmtTime, fmtDay } from '@/lib/format'
import { BP } from '@/lib/asset'

export const useUi = create<{ navHidden: boolean; setNavHidden: (v: boolean) => void }>((set) => ({ navHidden: false, setNavHidden: (v) => set({ navHidden: v }) }))

const NAV = [
  { href: '/app', label: 'Home', icon: Home, match: (p: string) => p === '/app' || p.startsWith('/app/journal') || p.startsWith('/app/goals') || p.startsWith('/app/ask') },
  { href: '/app/remedies', label: 'Remedies', icon: Leaf, match: (p: string) => p.startsWith('/app/remedies') },
  { href: '/app/book', label: 'Book', icon: CalendarDays, match: (p: string) => p.startsWith('/app/book') || p.startsWith('/app/sessions') },
  { href: '/app/shop', label: 'Shop', icon: ShoppingBag, match: (p: string) => p.startsWith('/app/shop') || p.startsWith('/app/bag') || p.startsWith('/app/checkout') || p.startsWith('/app/orders') },
  { href: '/app/me', label: 'Me', icon: User, match: (p: string) => p.startsWith('/app/me') || p.startsWith('/app/help') },
]
const NAV_ROOTS = new Set(['/app', '/app/remedies', '/app/book', '/app/shop', '/app/me', '/app/journal', '/app/sessions', '/app/orders', '/app/goals'])

/** Static hosting serves /app/ (trailing slash) — compare routes without it. */
export const usePath = () => { const p = usePathname() || '/'; return p.length > 1 ? p.replace(/\/+$/, '') : p }

function BottomNav() {
  const path = usePath()
  const hidden = useUi((s) => s.navHidden)
  const count = useApp((s) => s.cart.reduce((n, l) => n + l.qty, 0))
  const show = NAV_ROOTS.has(path) && !hidden
  return (
    <AnimatePresence>
      {show && (
        <motion.nav aria-label="Main" initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} transition={spring}
          className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] px-5 safe-b">
          <div className="flex h-16 items-center justify-between rounded-full bg-navy/95 px-2 shadow-[0_16px_40px_rgba(24,41,87,.35)] backdrop-blur-xl">
            {NAV.map(({ href, label, icon: Icon, match }) => {
              const active = match(path)
              return (
                <Link key={href} href={href} aria-label={label} aria-current={active ? 'page' : undefined} onClick={() => buzz(5)} id={label === 'Shop' ? 'nav-bag' : undefined}
                  className="relative grid size-12 place-items-center rounded-full">
                  {active && <motion.span layoutId="nav-active" transition={spring} className="absolute inset-0 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,.18)]" />}
                  <motion.span className="relative" animate={{ scale: active ? 1 : 0.94 }} transition={spring}>
                    <Icon className={active ? 'size-[22px] text-navy' : 'size-[22px] text-white/85'} strokeWidth={active ? 2.3 : 1.9} />
                  </motion.span>
                  {label === 'Shop' && count > 0 && (
                    <motion.span key={count} initial={{ scale: 0.3 }} animate={{ scale: [1.5, 1] }} transition={spring}
                      className="absolute right-0.5 top-0.5 grid min-w-[18px] place-items-center rounded-full bg-[#f3b1a4] px-1 text-[10px] font-extrabold leading-[18px] text-navy">{count}</motion.span>
                  )}
                </Link>
              )
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  )
}

export function AppHeader({ back, right, title }: { back?: boolean | string; right?: ReactNode; title?: string }) {
  const router = useRouter()
  const { openNotices } = useChrome()
  const unread = useApp((s) => s.notices.filter((n) => !n.read).length)
  const profile = useApp((s) => s.profile)
  return (
    <header className="sticky top-0 z-30 -mx-5 flex items-center justify-between gap-3 bg-[linear-gradient(180deg,#dce2f5_0%,#dfe4f6_72%,rgba(223,228,246,0)_100%)] px-5 pb-4 pt-2 safe-t">
      {back ? (
        <div className="flex items-center gap-3">
          <IconBtn label="Back" onClick={() => (typeof back === 'string' ? router.push(back) : router.back())}><ChevronLeft className="size-5" /></IconBtn>
          {title ? <span className="text-[16px] font-bold text-navy">{title}</span> : null}
        </div>
      ) : (
        <Link href="/app" aria-label="Home"><Logo compact /></Link>
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
        className={`inline-flex h-12 items-center gap-2 rounded-full pl-1.5 pr-4 text-[14px] font-semibold transition-colors ${on ? 'bg-navy text-white' : 'bg-peri-50/80 text-navy'}`}>
        <span className="grid size-9 place-items-center rounded-full bg-white"><MoodImg mood={k} size={30} /></span>{m.label}
      </motion.button>
    )
  }
  return (
    <Sheet open={open} onClose={onClose} title="Log a feeling" tall>
      <h2 className="h-duo mt-1 text-[26px]">How are you <em>feeling?</em></h2>
      <p className="mt-1 text-[14px] text-muted">Today · {fmtTime(now)}</p>
      <label className="mt-4 flex h-12 items-center gap-3 rounded-full bg-peri-50 px-4 focus-within:ring-2 focus-within:ring-navy">
        <Search className="size-[18px] text-navy" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search feelings — happy, stressed, loved…" aria-label="Search feelings"
          className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted" />
        {q && <button aria-label="Clear search" onClick={() => setQ('')}><X className="size-4 text-muted" /></button>}
      </label>
      {q ? (
        <div className="mt-4 flex min-h-[120px] flex-wrap content-start gap-2">
          {results.length ? results.map((m) => <Pill key={m.key} k={m.key as Emotion} />) : <p className="w-full py-6 text-center text-[14px] text-muted">No match for “{q}” — try a simpler word like “stressed” or “happy”.</p>}
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
              className="w-full resize-none rounded-[20px] bg-peri-50/80 p-4 text-[15px] leading-6 outline-none placeholder:text-muted focus:ring-2 focus:ring-navy" />
          </motion.label>
        )}
      </AnimatePresence>
      <div className="sticky bottom-0 -mx-5 mt-4 bg-gradient-to-t from-white via-white to-white/0 px-5 pb-1 pt-4">
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
              className="w-full resize-none rounded-[20px] bg-peri-50/80 p-4 text-[15px] leading-6 outline-none placeholder:text-muted focus:ring-2 focus:ring-navy" />
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
              <button onClick={() => { onClose(); if (n.href) router.push(n.href) }} className="flex w-full items-start gap-3 rounded-[20px] bg-peri-50/70 p-4 text-left">
                <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-rose'}`} />
                <span className="flex-1"><span className="block text-[15px] font-bold text-navy">{n.title}</span><span className="block text-[13px] text-muted">{n.body}</span></span>
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
      <LogSheet open={log} onClose={() => setLog(false)} />
      <NoticeSheet open={notes} onClose={() => setNotes(false)} />
      <EntrySheet id={entry} onClose={() => setEntry(null)} />
      <Flyer fly={fly} onDone={() => setFly(null)} />
    </Chrome.Provider>
  )
}
