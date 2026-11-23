import { Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { LazyMotion, MotionConfig, m } from 'motion/react'
import { Home, IndianRupee, LayoutDashboard, MessageSquare, Users } from 'lucide-react'
import { StoreProvider, useStore } from './state/store'
import { ToastProvider, go, spring, useRoute } from './ui/kit'
import { SheetsProvider } from './screens/Sheets'
import Today from './screens/Today'
import { SheetBody } from './screens/Sheets'
import { lazyWithPreload } from './ui/lazy'
import type { Bucket } from './lib/derive'

// Today ships in the first bundle; everything else is split and prefetched while idle, so taps stay instant.
const Sessions = lazyWithPreload(() => import('./screens/Sessions'))
const People = lazyWithPreload(() => import('./screens/People'))
const Profile = lazyWithPreload(() => import('./screens/Profile'))
const Live = lazyWithPreload(() => import('./screens/Live'))
const Growth = lazyWithPreload(() => import('./screens/Growth'))
const Messages = lazyWithPreload(() => import('./screens/Messages'))
const Dashboard = lazyWithPreload(() => import('./screens/Dashboard'))
const Finance = lazyWithPreload(() => import('./screens/Finance'))
const loadFeatures = () => import('./motionFeatures').then((r) => r.default)

function prefetchAll() {
  const run = () => { loadFeatures(); SheetBody.preload(); [People, Messages, Dashboard, Finance, Profile, Live, Sessions, Growth].forEach((c) => c.preload()) }
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback
  if (ric) ric(run, { timeout: 1500 }); else setTimeout(run, 300)
}

// Owner 2026-11-20: Today · People (mood board) · Messages · Dashboard · Finance
const TABS = [
  { path: '/', key: '', label: 'Today', Icon: Home },
  { path: '/people', key: 'people', label: 'People', Icon: Users },
  { path: '/messages', key: 'messages', label: 'Messages', Icon: MessageSquare },
  { path: '/dashboard', key: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { path: '/finance', key: 'finance', label: 'Finance', Icon: IndianRupee },
]
const TAB_OF: Record<string, string> = { sessions: '', session: '', growth: 'dashboard' }

function useUnread() {
  const { s } = useStore()
  return s.threads.reduce((n, t) => n + t.messages.filter((x) => x.from === 'client' && x.at > t.readAt).length, 0)
}

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
  else if (top === 'people' && parts[1]) screen = <Profile key={parts[1]} id={parts[1]} tab={q || undefined} />
  else if (top === 'people') screen = <People initialBucket={(q || undefined) as Bucket | undefined} />
  else if (top === 'growth') screen = <Growth />
  else if (top === 'messages') screen = <Messages pid={parts[1]} />
  else if (top === 'dashboard') screen = <Dashboard />
  else if (top === 'finance') screen = <Finance />
  else screen = <Today />
  const activeTab = TAB_OF[top] ?? top
  const unread = useUnread()

  return (
    <div className={'app' + (top === 'session' ? ' is-focus' : '')}>
      <a className="skip" href="#main">Skip to content</a>
      <nav className="nav" aria-label="Main">
        <img className="nav-logo" src="./img/owl-drops-160.webp" width={40} height={40} alt="BeWise" decoding="async" />
        {TABS.map(({ path, key: k, label, Icon }) => {
          const on = activeTab === k
          const n = k === 'messages' ? unread : 0
          return (
            <button key={path} className={'nav-btn' + (on ? ' is-on' : '')} onClick={() => go(path)} aria-current={on ? 'page' : undefined} aria-label={n ? `${label}, ${n} unread` : label}>
              {on && <m.span layoutId="nav-pill" className="nav-pill" transition={spring} />}
              <Icon size={21} strokeWidth={on ? 2.3 : 1.9} />
              <span className="nav-label">{label}</span>
              {n > 0 && <span className="nav-badge" aria-hidden>{n}</span>}
            </button>
          )
        })}
      </nav>
      <main id="main" className={'main' + (top === '' || top === 'messages' ? ' main-wide' : '')}>
        {/* Enter-only transition: the new screen never waits for the old one to leave (instant, and nothing can stall it). */}
        <m.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
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
