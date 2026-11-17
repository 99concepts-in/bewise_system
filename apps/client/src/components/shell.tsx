'use client'
/**
 * @module   client-shell
 * @owner    CLIENT
 * @screens  nav (Home · Remedies · Book · Shop · Me), header, CL-09 Log a feeling sheet, CL-10 Notifications sheet
 */
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { Bell, CalendarDays, ChevronLeft, Home, Leaf, ShoppingBag, User } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { create } from 'zustand'
import { Avatar, Logo, MoodButton } from './brand'
import { Btn, Chrome, IconBtn, Sheet, buzz, spring, toast, useChrome } from './ui'
import { MOODS, type Emotion } from '@/lib/data'
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

function BottomNav() {
  const path = usePathname()
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

function LogSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const logMood = useApp((s) => s.logMood)
  const [pick, setPick] = useState<Emotion | null>(null)
  const [burst, setBurst] = useState(0)
  const now = new Date()
  useEffect(() => { if (open) setPick(null) }, [open])
  return (
    <Sheet open={open} onClose={onClose} title="Log a feeling">
      <h2 className="h-duo mt-1 text-[26px]">How are you <em>feeling?</em></h2>
      <p className="mt-1 text-[14px] text-muted">Today · {fmtTime(now)}</p>
      <div className="mt-5 grid grid-cols-4 gap-y-3">
        {MOODS.map((m) => (
          <MoodButton key={m.key} mood={m.key} size={62} selected={pick === m.key} burstKey={pick === m.key ? burst : undefined} onPick={() => { setPick(m.key); setBurst((b) => b + 1); buzz(8) }} />
        ))}
      </div>
      <Btn full className="mt-6" disabled={!pick} onClick={() => { if (!pick) return; logMood(pick); toast(`Logged · ${MOODS.find((x) => x.key === pick)!.label}`); onClose() }}>Save</Btn>
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
                <span className="text-[12px] text-soft">{fmtDay(n.at)}</span>
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

export function AppChrome({ children }: { children: ReactNode }) {
  const [log, setLog] = useState(false)
  const [notes, setNotes] = useState(false)
  const [fly, setFly] = useState<{ from: DOMRect; img: string; id: number } | null>(null)
  const openLog = useCallback(() => setLog(true), [])
  const openNotices = useCallback(() => setNotes(true), [])
  const flyToBag = useCallback((from: DOMRect, img: string) => setFly({ from, img, id: Date.now() }), [])
  const ctx = useMemo(() => ({ openLog, openNotices, flyToBag }), [openLog, openNotices, flyToBag])
  return (
    <Chrome.Provider value={ctx}>
      {children}
      <BottomNav />
      <LogSheet open={log} onClose={() => setLog(false)} />
      <NoticeSheet open={notes} onClose={() => setNotes(false)} />
      <Flyer fly={fly} onDone={() => setFly(null)} />
    </Chrome.Provider>
  )
}
