'use client'
/**
 * @module   client-shell
 * @owner    CLIENT
 * @screens  v5 Add to Home Screen prompt · v5 session-reminder (notification) prompt — DESIGN-SYSTEM §7
 * v5 (HUB 2026-11-20): new. One small, dismissible bottom card at a time, never on the first screen.
 *   - Install: after the 2nd visit or right after the first booking. iOS = 3 illustrated steps, Android/Chrome =
 *     `beforeinstallprompt`. "Not now" snoozes 14 days. Hidden when already installed (display-mode: standalone).
 *   - Reminders: asked once, in context, after a booking is confirmed. Only "Yes" calls Notification.requestPermission();
 *     on iPhone it's offered only once installed. The choice can be changed in Me → Reminders.
 * owner 2026-11-24: SetupFlow after onboarding (after the tour): Add to Home Screen sheet, then "Turn on notifications?".
 * Everything here is per-device preference in localStorage (never sensitive data).
 */
import { AnimatePresence, motion } from 'motion/react'
import { BellRing, Share, SquarePlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { LogoMark } from './brand'
import { Btn, Sheet, buzz, ease, toast } from './ui'
import { useApp } from '@/lib/store'
import { usePath, useNavShown } from './shell'

const K = { visits: 'bewise-visits', counted: 'bewise-visit-counted', snooze: 'bewise-install-snooze', booked: 'bewise-first-booking', asked: 'bewise-notify-asked', reminders: 'bewise-reminders' }
const SNOOZE_MS = 14 * 86_400_000

const ls = {
  get: (k: string) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* private mode */ } },
}

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
const usePrompts = create<{ deferred: BIPEvent | null; notifyOpen: boolean; set: (p: Partial<{ deferred: BIPEvent | null; notifyOpen: boolean }>) => void }>((set) => ({
  deferred: null, notifyOpen: false, set: (p) => set(p),
}))

export const isStandalone = () => typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true)
export const isIOS = () => typeof navigator !== 'undefined' && (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

/** Mounted once in AppChrome: counts visits (once per browser session) and keeps Chrome's install event for later. */
export function usePromptBoot() {
  const set = usePrompts((s) => s.set)
  useEffect(() => {
    try {
      if (!sessionStorage.getItem(K.counted)) { sessionStorage.setItem(K.counted, '1'); ls.set(K.visits, String(Number(ls.get(K.visits) || 0) + 1)) }
    } catch { /* storage blocked */ }
    const onBip = (e: Event) => { e.preventDefault(); set({ deferred: e as BIPEvent }) }
    const onInstalled = () => set({ deferred: null })
    window.addEventListener('beforeinstallprompt', onBip)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onBip); window.removeEventListener('appinstalled', onInstalled) }
  }, [set])
}

/** Call when a booking is confirmed — makes the install card eligible even on the first visit. */
export const markFirstBooking = () => { if (!ls.get(K.booked)) ls.set(K.booked, new Date().toISOString()) }

// ---------- reminders preference ----------
export type ReminderPref = 'on' | 'off' | null
export const remindersPref = (): ReminderPref => (ls.get(K.reminders) as ReminderPref) ?? null
/** Notifications can be asked for here: supported, not yet decided, and on iPhone only once installed (iOS 16.4+). */
export const canAskNotifications = () =>
  typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && !(isIOS() && !isStandalone())
/** Turn reminders on: asks the system only when it can; otherwise remembers the wish for when it can. */
export async function enableReminders(): Promise<boolean> {
  ls.set(K.reminders, 'on'); ls.set(K.asked, '1')
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (!canAskNotifications()) return false
  try { return (await Notification.requestPermission()) === 'granted' } catch { return false }
}
export const disableReminders = () => { ls.set(K.reminders, 'off'); ls.set(K.asked, '1') }

function PromptCard({ onClose, label, children, bottom }: { onClose: () => void; label: string; children: React.ReactNode; bottom: string }) {
  return (
    <motion.div role="dialog" aria-label={label} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.28, ease }}
      className="fixed inset-x-0 z-[45] mx-auto max-w-[480px] px-4" style={{ bottom }}>
      <div className="relative rounded-[24px] bg-white p-5 shadow-[var(--shadow-float)] ring-1 ring-line">
        <button onClick={onClose} aria-label="Close" className="absolute right-2 top-2 grid size-11 place-items-center rounded-full text-muted hover:bg-sky-50"><X className="size-[18px]" /></button>
        {children}
      </div>
    </motion.div>
  )
}

/** Add to Home Screen — subtle, single bottom card above the tab bar. */
export function InstallPrompt() {
  const path = usePath()
  const navShown = useNavShown()
  const deferred = usePrompts((s) => s.deferred)
  const notifyOpen = usePrompts((s) => s.notifyOpen)
  const [moved, setMoved] = useState(false) // never on the first screen of a visit
  const [first] = useState(path)
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => { if (path !== first) setMoved(true) }, [path, first])
  useEffect(() => { const t = setTimeout(() => setMoved(true), 15_000); return () => clearTimeout(t) }, [])
  useEffect(() => {
    const visits = Number(ls.get(K.visits) || 0)
    const snoozed = Number(ls.get(K.snooze) || 0) > Date.now()
    setIos(isIOS())
    setReady(!isStandalone() && !snoozed && ls.get(SETUP) !== null && (visits >= 2 || !!ls.get(K.booked)))
  }, [path])
  const platformOk = ios || !!deferred
  useEffect(() => {
    if (!(ready && moved && navShown && platformOk && !notifyOpen)) { setOpen(false); return }
    const t = setTimeout(() => setOpen(true), 900)
    return () => clearTimeout(t)
  }, [ready, moved, navShown, platformOk, notifyOpen])

  const snooze = () => { ls.set(K.snooze, String(Date.now() + SNOOZE_MS)); setReady(false); setOpen(false) }
  const install = async () => {
    if (!deferred) return
    buzz(); await deferred.prompt()
    const r = await deferred.userChoice.catch(() => ({ outcome: 'dismissed' as const }))
    usePrompts.getState().set({ deferred: null })
    if (r.outcome === 'accepted') { setReady(false); toast('BeWise is on your home screen') } else snooze()
  }

  return (
    <AnimatePresence>
      {open && (
        <PromptCard key="install" label="Add BeWise to your home screen" onClose={snooze} bottom="calc(env(safe-area-inset-bottom) + 76px)">
          <div className="flex items-start gap-3 pr-8">
            <span className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-white shadow-[var(--shadow-card)] ring-1 ring-line"><LogoMark size={34} /></span>
            <div>
              <p className="font-display text-[18px] font-semibold leading-6 text-ink">Keep BeWise close</p>
              <p className="mt-0.5 text-[14px] leading-5 text-ink-2">Add it to your home screen to open in one tap, like any app.</p>
            </div>
          </div>
          {ios ? (
            <ol className="mt-4 grid grid-cols-3 gap-2" aria-label="How to add on iPhone">
              {[
                { n: 1, icon: <Share className="size-5" strokeWidth={1.75} />, t: 'Tap Share' },
                { n: 2, icon: <SquarePlus className="size-5" strokeWidth={1.75} />, t: 'Add to Home Screen' },
                { n: 3, icon: null, t: 'Tap Add' },
              ].map((x) => (
                <li key={x.n} className="flex flex-col items-center gap-1.5 rounded-[16px] bg-sky-50 px-1.5 py-3 text-center">
                  <span className="relative grid size-10 place-items-center rounded-[12px] bg-white text-[#3E9BE6] shadow-[var(--shadow-card)]">
                    {x.n === 3 ? <span className="font-display text-[15px] font-semibold text-[#2f7fc4]">Add</span> : x.icon}
                    <span className="absolute -left-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-navy text-[11px] font-bold text-white">{x.n}</span>
                  </span>
                  <span className="text-[12px] font-semibold leading-4 text-ink">{x.t}</span>
                </li>
              ))}
            </ol>
          ) : null}
          <div className="mt-4 flex gap-2">
            <Btn size="sm" variant="white" className="flex-1" onClick={snooze}>Not now</Btn>
            {ios ? <Btn size="sm" className="flex-1" onClick={() => { setOpen(false); ls.set(K.snooze, String(Date.now() + SNOOZE_MS)) }}>Got it</Btn>
              : <Btn size="sm" className="flex-1" onClick={install}>Add to home screen</Btn>}
          </div>
        </PromptCard>
      )}
    </AnimatePresence>
  )
}

/** "Want a gentle reminder before your session?" — once, after a booking is confirmed. */
export function NotifyPrompt({ delay = 1400 }: { delay?: number }) {
  const set = usePrompts((s) => s.set)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (ls.get(K.asked) || !canAskNotifications()) return
    const t = setTimeout(() => { setOpen(true); set({ notifyOpen: true }) }, delay)
    return () => clearTimeout(t)
  }, [delay, set])
  const close = () => { setOpen(false); set({ notifyOpen: false }) }
  const no = () => { ls.set(K.asked, '1'); close() }
  const yes = async () => {
    close()
    const ok = await enableReminders()
    toast(ok ? 'We’ll remind you gently before your session' : 'Okay. You can turn reminders on in Me → Reminders')
  }
  return (
    <AnimatePresence>
      {open && (
        <PromptCard key="notify" label="Session reminders" onClose={no} bottom="calc(env(safe-area-inset-bottom) + 16px)">
          <div className="flex items-start gap-3 pr-8">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-marigold-100 text-[#9a5b12]"><BellRing className="size-[22px]" strokeWidth={1.75} /></span>
            <div>
              <p className="font-display text-[18px] font-semibold leading-6 text-ink">Want a gentle reminder before your session?</p>
              <p className="mt-0.5 text-[14px] leading-5 text-ink-2">A day before and 30 minutes before. Nothing else.</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Btn size="sm" variant="white" className="flex-1" onClick={no}>Not now</Btn>
            <Btn size="sm" className="flex-1" onClick={yes}>Yes, remind me</Btn>
          </div>
        </PromptCard>
      )}
    </AnimatePresence>
  )
}

// ---------- after onboarding: Add to Home Screen, then notifications (owner 2026-11-24) ----------
const SETUP = 'bewise-setup' // '' → not started · 'notify-later' (iPhone: ask again once opened from the home screen) · 'done'
export const setupState = () => ls.get(SETUP) ?? ''
const isAndroid = () => typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)

/**
 * Once the Home tour is over: 1) a friendly Add to Home Screen sheet (iPhone steps, or Android's install prompt),
 * 2) "Turn on notifications?" and only on "Allow" the phone's own permission dialog. On iPhone in Safari the phone can't
 * ask yet (Apple allows it only from the home screen app), so we ask again the first time BeWise opens from the home screen.
 */
export function SetupFlow() {
  const tourPending = useApp((s) => !!s.profile?.tourPending)
  const deferred = usePrompts((s) => s.deferred)
  const [step, setStep] = useState<'install' | 'notify' | null>(null)
  const [ios, setIos] = useState(false)
  useEffect(() => {
    if (tourPending) return
    const st = setupState()
    setIos(isIOS())
    let next: 'install' | 'notify' | null = null
    if (st === '') next = !isStandalone() && (isIOS() || isAndroid() || !!usePrompts.getState().deferred) ? 'install' : 'notify'
    else if (st === 'notify-later' && isStandalone()) next = 'notify'
    if (next === 'notify' && typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'default') { ls.set(SETUP, 'done'); next = null }
    if (!next) return
    const t = setTimeout(() => { setStep(next); usePrompts.getState().set({ notifyOpen: true }) }, 1200)
    return () => clearTimeout(t)
  }, [tourPending])

  const toNotify = () => {
    ls.set(K.snooze, String(Date.now() + SNOOZE_MS)) // the small install card stays away for a while
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'default') return finish()
    setStep('notify')
  }
  const install = async () => {
    if (!deferred) return toNotify()
    buzz(); await deferred.prompt()
    const r = await deferred.userChoice.catch(() => ({ outcome: 'dismissed' as const }))
    usePrompts.getState().set({ deferred: null })
    if (r.outcome === 'accepted') toast('BeWise is on your home screen')
    toNotify()
  }
  const finish = (later = false) => { ls.set(SETUP, later ? 'notify-later' : 'done'); ls.set(K.asked, '1'); setStep(null); usePrompts.getState().set({ notifyOpen: false }) }
  const canAsk = typeof window !== 'undefined' && 'Notification' in window && !(ios && !isStandalone())
  const allow = async () => {
    buzz(10)
    if (!canAsk) return finish(true) // iPhone in Safari: ask again from the home screen
    ls.set(K.reminders, 'on')
    let ok = false
    try { ok = (await Notification.requestPermission()) === 'granted' } catch { /* blocked */ }
    finish()
    toast(ok ? 'Notifications on 🌿' : 'Okay. You can allow notifications later in your phone settings')
  }
  const notNow = () => { ls.set(K.reminders, 'off'); finish() }

  return (
    <>
      <Sheet open={step === 'install'} onClose={toNotify} title="Add BeWise to your home screen">
        <div className="pb-2 text-center">
          <span className="mx-auto grid size-[72px] place-items-center rounded-[20px] bg-white shadow-[var(--shadow-float)] ring-1 ring-line"><LogoMark size={50} /></span>
          <h2 className="h-duo mt-3 text-[26px]">Keep BeWise <em>one tap away</em></h2>
          <p className="mx-auto mt-1.5 max-w-[300px] text-[14px] leading-5 text-ink-2">Add BeWise to your home screen. It opens like an app, and lets us send you gentle reminders.</p>
          {ios || !deferred ? (
            <ol className="mt-5 grid grid-cols-3 gap-2 text-left" aria-label="How to add it">
              {(ios
                ? [{ icon: <Share className="size-5" />, t: 'Tap Share', d: 'or ••• then Share' }, { icon: <SquarePlus className="size-5" />, t: 'Add to Home Screen', d: 'scroll down a little' }, { icon: <span className="font-display text-[14px] font-semibold">Add</span>, t: 'Tap Add', d: 'top right' }]
                : [{ icon: <span className="text-[18px] font-bold leading-none">⋮</span>, t: 'Open the menu', d: 'top right of Chrome' }, { icon: <SquarePlus className="size-5" />, t: 'Add to Home screen', d: 'or Install app' }, { icon: <span className="font-display text-[14px] font-semibold">Add</span>, t: 'Tap Add', d: 'to confirm' }]
              ).map((x, i) => (
                <li key={i} className="flex flex-col items-center gap-1.5 rounded-[18px] bg-sky-50 px-1.5 py-3 text-center">
                  <span className="relative grid size-11 place-items-center rounded-[12px] bg-white text-[#2f7fc4] shadow-[var(--shadow-card)]">
                    {x.icon}<span className="absolute -left-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-navy text-[11px] font-bold text-white">{i + 1}</span>
                  </span>
                  <span className="text-[12px] font-bold leading-4 text-ink">{x.t}</span>
                  <span className="text-[11px] leading-4 text-muted">{x.d}</span>
                </li>
              ))}
            </ol>
          ) : null}
          <div className="mt-5 space-y-2">
            {!ios && deferred ? <Btn full onClick={install}>Add to home screen</Btn> : <Btn full onClick={toNotify}>Done</Btn>}
            <Btn full variant="ghost" size="md" onClick={toNotify}>Maybe later</Btn>
          </div>
        </div>
      </Sheet>

      <Sheet open={step === 'notify'} onClose={notNow} title="Turn on notifications">
        <div className="pb-2 text-center">
          <motion.span className="mx-auto grid size-[72px] place-items-center rounded-full bg-marigold-100 text-[#9a5b12]"
            animate={{ rotate: [0, -12, 12, -8, 0] }} transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.4 }}><BellRing className="size-8" strokeWidth={1.75} /></motion.span>
          <h2 className="h-duo mt-3 text-[26px]">Turn on <em>notifications?</em></h2>
          <p className="mx-auto mt-1.5 max-w-[300px] text-[14px] leading-5 text-ink-2">Gentle reminders for your drops and sessions, and a note when Jitendra Khimlani replies. Nothing else.</p>
          {!canAsk && <p className="mx-auto mt-3 max-w-[300px] rounded-[16px] bg-sky-50 px-3 py-2.5 text-[13px] leading-5 text-ink-2">On iPhone, notifications can be turned on once BeWise is on your home screen. Open it from there and we’ll ask again.</p>}
          <div className="mt-5 space-y-2">
            <Btn full onClick={allow}>{canAsk ? 'Allow notifications' : 'Okay'}</Btn>
            <Btn full variant="ghost" size="md" onClick={notNow}>Not now</Btn>
          </div>
        </div>
      </Sheet>
    </>
  )
}
