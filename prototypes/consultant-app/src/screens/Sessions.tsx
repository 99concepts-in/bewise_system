/**
 * @screens CN-16 / CN-14 — every appointment in one place: Upcoming and Past, searchable, grouped by day.
 */
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { MapPin, Search, Star, Video, X } from 'lucide-react'
import { useIndex, useStore } from '../state/store'
import { Avatar, Chip, Empty, Segmented } from '../ui/kit'
import { useSheets, KIND_LABEL, STATUS_LABEL } from './Sheets'
import { dayLabel, fmtTime } from '../lib/time'
import { MIN, startOfDay } from '../data/seed'
import type { Appt } from '../data/types'

type Tab = 'upcoming' | 'past'
type Filter = 'all' | 'first' | 'followup' | 'online' | 'in_person' | 'unpaid' | 'no_show'

export default function Sessions() {
  const { s, now } = useStore()
  const { person } = useIndex()
  const sheets = useSheets()
  const [tab, setTab] = useState<Tab>('upcoming')
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const dq = useDeferredValue(q.trim().toLowerCase())

  const isPast = (a: Appt) => a.status === 'completed' || a.status === 'no_show' || (a.start + a.durationMin * MIN < now && a.status !== 'in_session')
  const upcoming = useMemo(() => s.appts.filter((a) => !isPast(a)), [s.appts, now]) // eslint-disable-line react-hooks/exhaustive-deps
  const past = useMemo(() => s.appts.filter(isPast).reverse(), [s.appts, now]) // eslint-disable-line react-hooks/exhaustive-deps
  const base = tab === 'upcoming' ? upcoming : past

  const list = useMemo(() => base.filter((a) => {
    if (filter === 'first' && a.kind !== 'first') return false
    if (filter === 'followup' && a.kind !== 'followup') return false
    if (filter === 'online' && a.mode !== 'online') return false
    if (filter === 'in_person' && a.mode !== 'in_person') return false
    if (filter === 'unpaid' && a.status !== 'awaiting_payment') return false
    if (filter === 'no_show' && a.status !== 'no_show') return false
    if (dq) { const p = person.get(a.personId)!; if (!p.name.toLowerCase().includes(dq) && !p.city.toLowerCase().includes(dq)) return false }
    return true
  }), [base, filter, dq, person])

  // incremental rendering — keeps long histories instant
  const [limit, setLimit] = useState(40)
  useEffect(() => setLimit(40), [tab, filter, dq])
  const sentinel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) setLimit((l) => l + 40) }, { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [list.length])

  const groups = useMemo(() => {
    const out: { day: number; items: Appt[] }[] = []
    for (const a of list.slice(0, limit)) {
      const d = startOfDay(a.start)
      const g = out.at(-1)
      if (g && g.day === d) g.items.push(a); else out.push({ day: d, items: [a] })
    }
    return out
  }, [list, limit])

  const filters: { v: Filter; label: string }[] = tab === 'upcoming'
    ? [{ v: 'all', label: 'All' }, { v: 'first', label: 'First' }, { v: 'followup', label: 'Follow-up' }, { v: 'online', label: 'Online' }, { v: 'in_person', label: 'In person' }, { v: 'unpaid', label: 'Awaiting payment' }]
    : [{ v: 'all', label: 'All' }, { v: 'first', label: 'First' }, { v: 'followup', label: 'Follow-up' }, { v: 'online', label: 'Online' }, { v: 'in_person', label: 'In person' }, { v: 'no_show', label: 'No-show' }]

  return (
    <div className="screen">
      <h1 className="page-title">Sessions</h1>
      <Segmented id="sessions-tab" value={tab} onChange={(v) => { setTab(v); setFilter('all') }}
        options={[{ value: 'upcoming', label: 'Upcoming', count: upcoming.length }, { value: 'past', label: 'Past', count: past.length }]} />
      <div className="search-wrap">
        <Search size={18} aria-hidden />
        <input className="search" placeholder="Search by name or city" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search sessions" />
        {q && <button className="icon-btn sm" onClick={() => setQ('')} aria-label="Clear search"><X size={16} /></button>}
      </div>
      <div className="chips-scroll">{filters.map((f) => <Chip key={f.v} active={filter === f.v} onClick={() => setFilter(f.v)}>{f.label}</Chip>)}</div>

      <AnimatePresence mode="wait" initial={false}>
        <m.div key={tab + filter} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
          {list.length === 0 && (
            <Empty img="owl-read" title={dq ? `No sessions match “${q}”` : 'Nothing here'} body={dq ? 'Check the spelling or search by city.' : tab === 'upcoming' ? 'No upcoming sessions with this filter.' : 'No past sessions with this filter.'} />
          )}
          {groups.map((g) => (
            <section key={g.day} className="day-group">
              <h2 className="day-head"><span>{dayLabel(g.day, now)}</span><small>{g.items.length} {g.items.length === 1 ? 'session' : 'sessions'}</small></h2>
              <ul className="rows">
                {g.items.map((a) => {
                  const p = person.get(a.personId)!
                  return (
                    <li key={a.id}>
                      <button className="row" onClick={() => sheets.session(a.id)}>
                        <span className="row-time">{fmtTime(a.start)}<small>{a.durationMin} min</small></span>
                        <Avatar name={p.name} size={40} />
                        <span className="row-main"><b>{p.name}</b><small>{KIND_LABEL[a.kind]}</small></span>
                        <span className="row-end">
                          {a.rating ? <span className="mini-rating"><Star size={12} />{a.rating}</span> : null}
                          {a.status !== 'completed' && a.status !== 'confirmed' && <span className={`st st-${a.status}`}>{STATUS_LABEL[a.status]}</span>}
                          <span className="mode-ic" aria-label={a.mode === 'online' ? 'Online' : 'In person'}>{a.mode === 'online' ? <Video size={15} /> : <MapPin size={15} />}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
          {limit < list.length && <div ref={sentinel} className="sentinel" aria-hidden />}
        </m.div>
      </AnimatePresence>
    </div>
  )
}
