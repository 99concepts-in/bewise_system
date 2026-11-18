/**
 * @screens CN-12 Clients — everyone registered, with care buckets, search and sort.
 */
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { m } from 'motion/react'
import { ArrowDownAZ, CalendarClock, History, Search, X } from 'lucide-react'
import { useIndex, useStore } from '../state/store'
import { Avatar, Chip, Empty, go } from '../ui/kit'
import { personView, type Bucket } from '../lib/derive'
import { dayLabel, fmtShort, relative } from '../lib/time'

const BUCKETS: { v: Bucket; label: string }[] = [
  { v: 'all', label: 'Everyone' }, { v: 'care', label: 'In care' }, { v: 'due', label: 'Follow-up due' }, { v: 'new', label: 'New this month' }, { v: 'quiet', label: 'Quiet 4+ months' },
]
type Sort = 'recent' | 'az' | 'next'

export default function People({ initialBucket }: { initialBucket?: Bucket }) {
  const { s, now } = useStore()
  const { byPerson } = useIndex()
  const [bucket, setBucket] = useState<Bucket>(initialBucket ?? 'all')
  useEffect(() => { if (initialBucket) setBucket(initialBucket) }, [initialBucket])
  const [sort, setSort] = useState<Sort>('recent')
  const [q, setQ] = useState('')
  const dq = useDeferredValue(q.trim().toLowerCase())

  const views = useMemo(() => s.people.map((p) => personView(p, byPerson.get(p.id), now)), [s.people, byPerson, now])
  const counts = useMemo(() => Object.fromEntries(BUCKETS.map((b) => [b.v, views.filter((v) => v.buckets.includes(b.v)).length])) as Record<Bucket, number>, [views])
  const list = useMemo(() => {
    const l = views.filter((v) => v.buckets.includes(bucket) && (!dq || v.p.name.toLowerCase().includes(dq) || v.p.city.toLowerCase().includes(dq) || v.p.phone.replace(/\s/g, '').includes(dq.replace(/\s/g, ''))))
    if (sort === 'az') l.sort((a, b) => a.p.name.localeCompare(b.p.name))
    else if (sort === 'next') l.sort((a, b) => (a.next?.start ?? Infinity) - (b.next?.start ?? Infinity))
    else l.sort((a, b) => (b.last?.start ?? b.p.joinedAt) - (a.last?.start ?? a.p.joinedAt))
    return l
  }, [views, bucket, dq, sort])

  const [limit, setLimit] = useState(30)
  useEffect(() => setLimit(30), [bucket, dq, sort])
  const sentinel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) setLimit((x) => x + 30) }, { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [list.length])

  const nextSort: Record<Sort, Sort> = { recent: 'next', next: 'az', az: 'recent' }
  const SortIcon = sort === 'az' ? ArrowDownAZ : sort === 'next' ? CalendarClock : History
  const sortLabel = sort === 'az' ? 'A to Z' : sort === 'next' ? 'Next session' : 'Recently seen'

  return (
    <div className="screen">
      <div className="title-row">
        <h1 className="page-title">People<span className="title-count">{s.people.length} registered</span></h1>
        <button className="sort-btn" onClick={() => setSort(nextSort[sort])} aria-label={`Sorted by ${sortLabel}. Change sort`}><SortIcon size={16} />{sortLabel}</button>
      </div>
      <div className="search-wrap">
        <Search size={18} aria-hidden />
        <input className="search" placeholder="Search name, city or phone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search people" />
        {q && <button className="icon-btn sm" onClick={() => setQ('')} aria-label="Clear search"><X size={16} /></button>}
      </div>
      <div className="chips-scroll">
        {BUCKETS.map((b) => <Chip key={b.v} active={bucket === b.v} count={counts[b.v]} onClick={() => { setBucket(b.v); history.replaceState(null, '', b.v === 'all' ? '#/people' : `#/people?${b.v}`) }}>{b.label}</Chip>)}
      </div>

      {list.length === 0 && <Empty img="owl-read" title={dq ? `No one matches “${q}”` : 'No one here right now'} body={dq ? 'Try a first name, a city, or the last digits of a phone number.' : 'This group is empty. That is usually good news.'} />}
      <ul className="rows people">
        {list.slice(0, limit).map((v, i) => (
          <m.li key={v.p.id} layout="position" initial={i < 12 ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.025, duration: 0.22 }}>
            <button className="row" onClick={() => go(`/people/${v.p.id}`)}>
              <Avatar name={v.p.name} size={46} mood={v.latestMood} layoutId={`av-${v.p.id}`} />
              <span className="row-main">
                <b>{v.p.name}</b>
                <small>{v.p.city}{v.last ? `, seen ${relative(v.last.start, now)}` : v.next ? ', first visit coming up' : `, joined ${fmtShort(v.p.joinedAt)}`}</small>
              </span>
              <span className="row-end">
                {v.next ? <span className="next-chip">{dayLabel(v.next.start, now)}</span>
                  : v.buckets.includes('due') ? <span className="st st-due">Due</span>
                  : v.buckets.includes('new') ? <span className="st st-new">New</span> : null}
              </span>
            </button>
          </m.li>
        ))}
      </ul>
      {limit < list.length && <div ref={sentinel} className="sentinel" aria-hidden />}
    </div>
  )
}
