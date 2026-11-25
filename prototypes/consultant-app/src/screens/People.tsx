/**
 * @screens CN-12 People as a mood board (owner 2026-11-20): latest feeling per person, who missed their remedy,
 *          whose remedy is ending, scanning clients, archived. Tap a card for every detail.
 */
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { m } from 'motion/react'
import { CalendarPlus, LayoutGrid, List, Search, UserPlus, X } from 'lucide-react'
import { useIndex, useStore } from '../state/store'
import { AppHeader, Avatar, Chip, Empty, MoodFace, go } from '../ui/kit'
import { TypeBadge } from '../ui/bits'
import { JourneyTag, LastSeen } from '../ui/console'
import { useSheets } from './Sheets'
import { adherence, personView, type Bucket, type PersonView } from '../lib/derive'
import { dayLabel } from '../lib/time'

const BUCKETS: { v: Bucket; label: string; attn?: boolean }[] = [
  { v: 'missing', label: 'Missed remedy', attn: true }, { v: 'ending7', label: 'Ends this week', attn: true }, { v: 'ending14', label: 'Ends in 1–2 weeks' },
  { v: 'remedy', label: 'On a remedy' }, { v: 'scanning', label: 'Scanning' }, { v: 'all', label: 'Everyone' }, { v: 'archived', label: 'Archived' },
]

/** One short line saying what matters most about this person right now. */
function statusLine(v: PersonView, now: number): { text: string; tone: 'warn' | 'gold' | 'ok' | '' } {
  if (v.p.archived) return { text: 'Archived', tone: '' }
  const a = adherence(v.p, now)
  if (v.buckets.includes('missing')) return { text: `Missed ${a?.last7Missed} of 7 days`, tone: 'warn' }
  if (v.daysLeft !== undefined && v.daysLeft >= 0 && v.daysLeft <= 14) return { text: v.daysLeft === 0 ? 'Remedy ends today' : `Remedy ends in ${v.daysLeft} ${v.daysLeft === 1 ? 'day' : 'days'}`, tone: 'gold' }
  if (v.buckets.includes('remedy')) return { text: 'Taking the remedy', tone: 'ok' }
  if (v.next) return { text: `Next: ${dayLabel(v.next.start, now)}`, tone: '' }
  if (v.last) return { text: 'No session booked', tone: '' }
  return { text: 'New', tone: '' }
}
const URGENCY = (v: PersonView) => (v.buckets.includes('missing') ? 0 : v.buckets.includes('ending7') ? 1 : v.buckets.includes('ending14') ? 2 : 3)

export default function People({ initialBucket }: { initialBucket?: Bucket }) {
  const { s, now } = useStore()
  const { byPerson } = useIndex()
  const sheets = useSheets()
  const [bucket, setBucket] = useState<Bucket>(initialBucket ?? 'missing')
  useEffect(() => { if (initialBucket) setBucket(initialBucket) }, [initialBucket])
  const [view, setView] = useState<'board' | 'list'>('board')
  const [q, setQ] = useState('')
  const dq = useDeferredValue(q.trim().toLowerCase())

  const views = useMemo(() => s.people.map((p) => personView(p, byPerson.get(p.id), now)), [s.people, byPerson, now])
  const counts = useMemo(() => Object.fromEntries(BUCKETS.map((b) => [b.v, views.filter((v) => v.buckets.includes(b.v)).length])) as Record<Bucket, number>, [views])
  const list = useMemo(() => {
    const l = views.filter((v) => (dq ? !v.p.archived || bucket === 'archived' : v.buckets.includes(bucket)) && (!dq || v.p.name.toLowerCase().includes(dq) || v.p.city.toLowerCase().includes(dq) || v.p.phone.replace(/\s/g, '').includes(dq.replace(/\s/g, ''))))
    return l.sort((a, b) => URGENCY(a) - URGENCY(b) || (a.daysLeft ?? 99) - (b.daysLeft ?? 99) || (b.last?.start ?? b.p.joinedAt) - (a.last?.start ?? a.p.joinedAt))
  }, [views, bucket, dq])

  const [limit, setLimit] = useState(36)
  useEffect(() => setLimit(36), [bucket, dq, view])
  const sentinel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) setLimit((x) => x + 36) }, { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [list.length])

  return (
    <div className="screen">
      <AppHeader />
      <div className="title-row">
        <h1 className="page-title">People<span className="title-count">{s.people.filter((p) => !p.archived).length} registered</span></h1>
        <div className="view-toggle" role="group" aria-label="View">
          <button aria-pressed={view === 'board'} onClick={() => setView('board')} aria-label="Mood board"><LayoutGrid size={17} /></button>
          <button aria-pressed={view === 'list'} onClick={() => setView('list')} aria-label="List"><List size={17} /></button>
        </div>
      </div>
      <div className="quick-actions">
        <button className="btn btn-primary" onClick={() => sheets.addPerson('profile')}><UserPlus size={18} aria-hidden /> New person</button>
        <button className="btn btn-quiet" onClick={() => sheets.newAppt()}><CalendarPlus size={18} aria-hidden /> New appointment</button>
      </div>
      <div className="search-wrap">
        <Search size={18} aria-hidden />
        <input className="search" placeholder="Search name, city or phone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search people" />
        {q && <button className="icon-btn sm" onClick={() => setQ('')} aria-label="Clear search"><X size={16} /></button>}
      </div>
      <div className="chips-scroll">
        {BUCKETS.map((b) => (
          <Chip key={b.v} active={!dq && bucket === b.v} count={counts[b.v]} onClick={() => { setQ(''); setBucket(b.v); history.replaceState(null, '', `#/people?${b.v}`) }}>{b.label}</Chip>
        ))}
      </div>

      {list.length === 0 && <Empty img="owl-read" title={dq ? `No one matches “${q}”` : 'No one here right now'} body={dq ? 'Try a first name, a city, or the last digits of a phone number. Or add them now.' : 'This group is empty. That is usually good news.'} action={dq ? <button className="btn btn-primary" onClick={() => sheets.addPerson('profile')}><UserPlus size={16} /> Add a new person</button> : undefined} />}

      {view === 'board' ? (
        <ul className="board">
          {list.slice(0, limit).map((v, i) => {
            const st = statusLine(v, now)
            return (
              <m.li key={v.p.id} layout="position" initial={i < 12 ? { opacity: 0, scale: 0.94 } : false} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(i, 12) * 0.025, duration: 0.22 }}>
                <button className={'board-card' + (st.tone ? ` tone-${st.tone}` : '')} onClick={() => go(`/people/${v.p.id}${tabFor(bucket)}`)}>
                  <span className="bc-face">{v.latestMood ? <MoodFace mood={v.latestMood} size={64} /> : <Avatar name={v.p.name} size={56} layoutId={`av-${v.p.id}`} />}</span>
                  <b>{v.p.name}</b>
                  <TypeBadge service={v.service} />
                  <small className={`bc-status ${st.tone}`}>{st.text}</small>
                  <span className="bc-foot"><LastSeen v={v} now={now} short /><JourneyTag v={v} now={now} /></span>
                </button>
              </m.li>
            )
          })}
        </ul>
      ) : (
        <ul className="rows people">
          {list.slice(0, limit).map((v) => {
            const st = statusLine(v, now)
            return (
              <li key={v.p.id}>
                <button className="row" onClick={() => go(`/people/${v.p.id}${tabFor(bucket)}`)}>
                  <Avatar name={v.p.name} size={44} mood={v.latestMood} layoutId={`av-${v.p.id}`} />
                  <span className="row-main"><b>{v.p.name}</b><small className={st.tone === 'warn' ? 'warn' : ''}>{v.p.city}, {st.text.toLowerCase()}</small><LastSeen v={v} now={now} short /></span>
                  <span className="row-end people-end"><TypeBadge service={v.service} /><JourneyTag v={v} now={now} /></span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {limit < list.length && <div ref={sentinel} className="sentinel" aria-hidden />}
    </div>
  )
}

/** From a remedy group (missed, ending, on a remedy) open the person's Remedy tab; everywhere else the Overview. */
function tabFor(b: Bucket) { return b === 'missing' || b === 'ending7' || b === 'ending14' || b === 'remedy' ? '?remedy' : '' }
