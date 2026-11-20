import { Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { LazyMotion, MotionConfig, m } from 'motion/react'
import { CalendarDays, Home, Sprout, Users } from 'lucide-react'
import { StoreProvider } from './state/store'
import { ToastProvider, go, spring, useRoute } from './ui/kit'
import { SheetsProvider } from './screens/Sheets'
import Today from './screens/Today'
import { SheetBody } from './screens/Sheets'
import { lazyWithPreload } from './ui/lazy'
import { Logo } from './ui/art'
import type { Bucket } from './lib/derive'

// Today ships in the first bundle; everything else is split and prefetched while idle, so taps stay instant.
const Sessions = lazyWithPreload(() => import('./screens/Sessions'))
const People = lazyWithPreload(() => import('./screens/People'))
const Profile = lazyWithPreload(() => import('./screens/Profile'))
const Live = lazyWithPreload(() => import('./screens/Live'))
const Growth = lazyWithPreload(() => import('./screens/Growth'))
const loadFeatures = () => import('./motionFeatures').then((r) => r.default)

function prefetchAll() {
  const run = () => { loadFeatures(); SheetBody.preload(); [Sessions, People, Profile, Live, Growth].forEach((c) => c.preload()) }
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback
  if (ric) ric(run, { timeout: 1500 }); else setTimeout(run, 300)
}

const TABS = [
  { path: '/', key: '', label: 'Today', Icon: Home },
  { path: '/sessions', key: 'sessions', label: 'Sessions', Icon: CalendarDays },
  { path: '/people', key: 'people', label: 'People', Icon: Users },
  { path: '/growth', key: 'growth', label: 'Growth', Icon: Sprout },
]

function Shell() {
  const { parts, q } = useRoute()
  const top = parts[0] ?? ''
  const key = parts.join('/') || 'today'
  const scrolls = useRef(new Map<string, number>())
  const prev = useRef(key)

  // remember scroll per screen; restore when coming back (e.g. profile → people)
  useLayoutEffect(() => {
    scrolls.current.set(prev.current, scrollY)
    prev.current = key
  }, [key])
  useEffect(() => {
    const y = scrolls.current.get(key) ?? 0
    requestAnimationFrame(() => scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }))
  }, [key])

  useEffect(prefetchAll, [])

  let screen
  if (top === 'session' && parts[1]) screen = <Live id={parts[1]} />
  else if (top === 'sessions') screen = <Sessions />
  else if (top === 'people' && parts[1]) screen = <Profile id={parts[1]} />
  else if (top === 'people') screen = <People initialBucket={(q || undefined) as Bucket | undefined} />
  else if (top === 'growth') screen = <Growth />
  else screen = <Today />

  return (
    <div className={'app' + (top === 'session' ? ' is-focus' : '')}>
      <a className="skip" href="#main">Skip to content</a>
      {/* v5 (HUB 2026-11-20): white tab bar, active = navy icon + label + 4 px dot above; side rail with the official logo on wide screens */}
      <nav className="nav" aria-label="Main">
        <Logo className="nav-logo" />
        {TABS.map(({ path, key: k, label, Icon }) => {
          const on = top === k
          return (
            <button key={path} className={'nav-btn' + (on ? ' is-on' : '')} onClick={() => go(path)} aria-current={on ? 'page' : undefined}>
              {on && <m.span layoutId="nav-dot" className="nav-dot" transition={spring} />}
              <Icon size={22} strokeWidth={on ? 2.2 : 1.75} aria-hidden />
              <span className="nav-label">{label}</span>
            </button>
          )
        })}
      </nav>
      <main id="main" className={'main' + (top === '' ? ' main-wide' : '')}>
        {/* Enter-only transition: the new screen never waits for the old one to leave (instant, and nothing can stall it). */}
        <m.div key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
          <Suspense fallback={<ScreenSkeleton />}>{screen}</Suspense>
        </m.div>
      </main>
    </div>
  )
}

function ScreenSkeleton() {
  return (
    <div className="screen skel" aria-busy="true" aria-label="Loading">
      <span className="skel-line w40" /><span className="skel-block" /><span className="skel-block short" /><span className="skel-block" />
    </div>
  )
}

export default function App() {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        <StoreProvider>
          <ToastProvider>
            <SheetsProvider>
              <Shell />
            </SheetsProvider>
          </ToastProvider>
        </StoreProvider>
      </MotionConfig>
    </LazyMotion>
  )
}
