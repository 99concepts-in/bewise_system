import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { LazyMotion, MotionConfig, domMax, m } from 'motion/react'
import { CalendarDays, Home, Sprout, Users } from 'lucide-react'
import { StoreProvider } from './state/store'
import { ToastProvider, go, spring, useRoute } from './ui/kit'
import { SheetsProvider } from './screens/Sheets'
import Today from './screens/Today'
import Sessions from './screens/Sessions'
import People from './screens/People'
import Profile from './screens/Profile'
import type { Bucket } from './lib/derive'

const Growth = lazy(() => import('./screens/Growth'))

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

  let screen
  if (top === 'sessions') screen = <Sessions />
  else if (top === 'people' && parts[1]) screen = <Profile id={parts[1]} />
  else if (top === 'people') screen = <People initialBucket={(q || undefined) as Bucket | undefined} />
  else if (top === 'growth') screen = <Suspense fallback={<div className="screen" />}><Growth /></Suspense>
  else screen = <Today />

  return (
    <div className="app">
      <a className="skip" href="#main">Skip to content</a>
      <nav className="nav" aria-label="Main">
        <img className="nav-logo" src="./img/owl-drops.webp" width={40} height={40} alt="BeWise" />
        {TABS.map(({ path, key: k, label, Icon }) => {
          const on = top === k
          return (
            <button key={path} className={'nav-btn' + (on ? ' is-on' : '')} onClick={() => go(path)} aria-current={on ? 'page' : undefined} aria-label={label}>
              {on && <m.span layoutId="nav-pill" className="nav-pill" transition={spring} />}
              <Icon size={21} strokeWidth={on ? 2.3 : 1.9} />
              <span className="nav-label">{label}</span>
            </button>
          )
        })}
      </nav>
      <main id="main" className="main">
        {/* Enter-only transition: the new screen never waits for the old one to leave (instant, and nothing can stall it). */}
        <m.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
          {screen}
        </m.div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <LazyMotion features={domMax} strict>
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
