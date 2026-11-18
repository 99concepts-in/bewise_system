/**
 * @screens CN-16 / CN-14 — Sessions, calm by default: a short summary, what needs you (with inline actions),
 *          the next 7 days, everything else folded away. Past shows what people said they felt.
 */
import { useDeferredValue, useMemo, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { CalendarDays, CalendarPlus, ChevronDown, Leaf, MapPin, MessageCircle, Search, Star, Video, X, Zap } from 'lucide-react'
import { useIndex, useStore } from '../state/store'
import { Avatar, Empty, Segmented, softSpring, spring } from '../ui/kit'
import { useSheets, reminderText, waLink } from './Sheets'
import { personView } from '../lib/derive'
import { nextFree } from '../lib/slots'
import { dayLabel, fmtMonth, fmtTime, relative } from '../lib/time'
import { DAY, MIN, startOfDay } from '../data/seed'
import type { Appt } from '../data/types'

type Tab = 'upcoming' | 'past'
type Focus = 'all' | 'action' | 'first' | 'remedy' | 'followup' | 'noshow'
type Act = { label: string; icon: 'remind' | 'remedy' | 'book'; run: () => void }

export default function Sessions() {
  const { s, now } = useStore()
  const { person, byPerson } = useIndex()
  const sheets = useSheets()
  const [tab, setTab] = useState<Tab>('upcoming')
  const [focus, setFocus] = useState<Focus>('all')
  const [searching, setSearching] = useState(false)
  const [q, setQ] = useState('')
  const dq = useDeferredValue(q.trim().toLowerCase())
  const [showLater, setShowLater] = useState(false)
  const [pastDays, setPastDays] = useState(14)

  const isPast = (a: Appt) => a.status === 'completed' || a.status === 'no_show' || (a.start + a.durationMin * MIN < now && a.status !== 'in_session' && a.status !== 'checked_in')
  const upcoming = useMemo(() => s.appts.filter((a) => !isPast(a)), [s.appts, now]) // eslint-disable-line react-hooks/exhaustive-deps
  const past = useMemo(() => s.appts.filter(isPast).reverse(), [s.appts, now]) // eslint-disable-line react-hooks/exhaustive-deps

  // what each row asks of him
  const latestDone = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of s.people) { const v = personView(p, byPerson.get(p.id), now); if (v.buckets.includes('due') && v.last) m.set(v.last.id, p.id) }
    return m
  }, [s.people, byPerson, now])
  const actionFor = (a: Appt): Act | null => {
    const p = person.get(a.personId)!
    if (a.status === 'awaiting_payment') return { label: 'Remind', icon: 'remind', run: () => window.open(waLink(p.phone, reminderText(p.first, a.start, now)), '_blank', 'noopener') }
    if (a.status === 'completed' && !a.remedy) return { label: 'Give remedy', icon: 'remedy', run: () => sheets.remedy(a.id) }
    if (latestDone.has(a.id)) return { label: 'Book', icon: 'book', run: () => sheets.express(a.personId) }
    return null
  }
  const sessionNo = (a: Appt) => (byPerson.get(a.personId) ?? []).filter((x) => x.start <= a.start && x.status !== 'no_show').length

  // ---- summary numbers
  const weekEnd = startOfDay(now) + 7 * DAY
  const week = upcoming.filter((a) => a.start < weekEnd)
  const unpaid = upcoming.filter((a) => a.status === 'awaiting_payment')
  const firsts = week.filter((a) => a.kind === 'first')
  const open = useMemo(() => nextFree(30, s.appts, s, now, 40, 7).length, [s, now])
  const remedyDue = past.filter((a) => a.status === 'completed' && !a.remedy)
  const followDue = past.filter((a) => latestDone.has(a.id))
  const noShows = past.filter((a) => a.status === 'no_show' && a.start > now - 30 * DAY)
  const month0 = new Date(now); month0.setDate(1); month0.setHours(0, 0, 0, 0)
  const pastMonth = past.filter((a) => a.status === 'completed' && a.start >= month0.getTime())
  const felt = pastMonth.filter((a) => a.benefits?.length).length

  const focusOptions: { v: Focus; label: string; n: number }[] = tab === 'upcoming'
    ? [{ v: 'all', label: 'All', n: upcoming.length }, { v: 'action', label: 'Awaiting payment', n: unpaid.length }, { v: 'first', label: 'First visits', n: upcoming.filter((a) => a.kind === 'first').length }]
    : [{ v: 'all', label: 'All', n: past.length }, { v: 'remedy', label: 'Remedy to give', n: remedyDue.length }, { v: 'followup', label: 'Follow-up not booked', n: followDue.length }, { v: 'noshow', label: 'No-shows', n: noShows.length }]

  const base = tab === 'upcoming' ? upcoming : past
  const list = useMemo(() => base.filter((a) => {
    if (focus === 'action' && a.status !== 'awaiting_payment') return false
    if (focus === 'first' && a.kind !== 'first') return false
    if (focus === 'remedy' && !(a.status === 'completed' && !a.remedy)) return false
    if (focus === 'followup' && !latestDone.has(a.id)) return false
    if (focus === 'noshow' && a.status !== 'no_show') return false
    if (dq) { const p = person.get(a.personId)!; if (!p.name.toLowerCase().includes(dq) && !p.city.toLowerCase().includes(dq)) return false }
    return true
  }), [base, focus, dq, person, latestDone])

  // ---- grouping: upcoming = days within 7, rest folded · past = days within N, then months
  const filtered = focus !== 'all' || !!dq
  const groups = useMemo(() => {
    const out: { key: string; title: string; items: Appt[] }[] = []
    const push = (key: string, title: string, a: Appt) => { const g = out.at(-1); if (g && g.key === key) g.items.push(a); else out.push({ key, title, items: [a] }) }
    for (const a of list) {
      const d = startOfDay(a.start)
      if (tab === 'upcoming') {
        if (!filtered && !showLater && d >= weekEnd) continue
        push(String(d), dayLabel(d, now), a)
      } else {
        if (!filtered && d < startOfDay(now) - pastDays * DAY) continue
        push(String(d), dayLabel(d, now), a)
      }
    }
    return out
  }, [list, tab, filtered, showLater, weekEnd, pastDays, now])
  const hiddenLater = tab === 'upcoming' && !filtered && !showLater ? list.filter((a) => a.start >= weekEnd).length : 0
  const hiddenPast = tab === 'past' && !filtered ? list.filter((a) => startOfDay(a.start) < startOfDay(now) - pastDays * DAY).length : 0

  return (
    <div className="screen sessions">
      <div className="title-row">
        <h1 className="page-title">Sessions</h1>
        <div className="title-actions">
          <button className="icon-btn" aria-label={searching ? 'Close search' : 'Search'} aria-expanded={searching} onClick={() => { setSearching((x) => !x); setQ('') }}>{searching ? <X size={19} /> : <Search size={19} />}</button>
          <button className="icon-btn" aria-label="Calendar" onClick={sheets.calendar}><CalendarDays size={19} /></button>
          <button className="sort-btn" onClick={() => sheets.express()}><Zap size={16} /><span className="hide-xs">Express</span></button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {searching && (
          <m.div className="search-wrap" initial={{ height: 0, opacity: 0, marginTop: 0 }} animate={{ height: 50, opacity: 1, marginTop: 4 }} exit={{ height: 0, opacity: 0, marginTop: 0 }} transition={spring} style={{ overflow: 'visible' }}>
            <Search size={18} aria-hidden />
            <input className="search" autoFocus placeholder="Search by name or city" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search sessions" />
          </m.div>
        )}
      </AnimatePresence>

      <div className="tab-gap"><Segmented id="sessions-tab" value={tab} onChange={(v) => { setTab(v); setFocus('all') }}
        options={[{ value: 'upcoming', label: 'Upcoming', count: upcoming.length }, { value: 'past', label: 'Past', count: past.length }]} /></div>

      {/* one-line insight, then three numbers that can be tapped */}
      <m.section key={tab} className="sum card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={softSpring}>
        {tab === 'upcoming' ? <>
          <p className="sum-line">{unpaid.length ? <><b>{unpaid.length} {unpaid.length === 1 ? 'booking is' : 'bookings are'} waiting for payment.</b> A reminder from you usually does it.</> : <><b>Everyone this week has paid.</b> Nothing to chase.</>}</p>
          <div className="sum-stats">
            <button onClick={() => setFocus('all')}><b>{week.length}</b><span>sessions in the next 7 days</span></button>
            <button onClick={() => setFocus('first')}><b>{firsts.length}</b><span>first visits</span></button>
            <button onClick={() => sheets.express()}><b>{open}</b><span>open slots left</span></button>
          </div>
        </> : <>
          <p className="sum-line">{remedyDue.length ? <><b>{remedyDue.length} {remedyDue.length === 1 ? 'remedy' : 'remedies'} still to give.</b> The office is waiting.</> : followDue.length ? <><b>{followDue.length} people are due a follow-up</b> and haven't booked yet.</> : <><b>All caught up.</b> Every session has its remedy.</>}</p>
          <div className="sum-stats">
            <button onClick={() => setFocus('all')}><b>{pastMonth.length}</b><span>sessions this month</span></button>
            <button onClick={() => setFocus('followup')}><b>{followDue.length}</b><span>follow-ups to book</span></button>
            <button onClick={() => setFocus('all')}><b>{felt}</b><span>said they felt better</span></button>
          </div>
        </>}
      </m.section>

      <div className="chips-scroll">
        {focusOptions.filter((o) => o.v === 'all' || o.n > 0).map((o) => (
          <button key={o.v} className={'chip' + (focus === o.v ? ' is-on' : '') + (o.v !== 'all' && o.v !== 'first' ? ' chip-attn' : '')} aria-pressed={focus === o.v} onClick={() => setFocus(o.v)}>
            {o.label}<span className="chip-count">{o.n}</span>
          </button>
        ))}
      </div>

      {list.length === 0 && <Empty img="owl-read" title={dq ? `No sessions match “${q}”` : 'Nothing here'} body={dq ? 'Check the spelling or search by city.' : 'Nothing needs you in this group.'} />}

      {groups.map((g) => (
        <section key={g.key} className="day-group">
          <h2 className="day-head"><span>{g.title}</span><small>{g.items.length} {g.items.length === 1 ? 'session' : 'sessions'}</small></h2>
          <ul className="rows">
            {g.items.map((a) => <Row key={a.id} a={a} act={actionFor(a)} n={sessionNo(a)} past={tab === 'past'} />)}
          </ul>
        </section>
      ))}

      {hiddenLater > 0 && (
        <button className="fold" onClick={() => setShowLater(true)}><ChevronDown size={18} />Show {hiddenLater} later {hiddenLater === 1 ? 'session' : 'sessions'}, up to {fmtMonth(list.at(-1)!.start)} {new Date(list.at(-1)!.start).getDate()}</button>
      )}
      {hiddenPast > 0 && (
        <button className="fold" onClick={() => setPastDays((d) => d + 30)}><ChevronDown size={18} />Show the 30 days before</button>
      )}
    </div>
  )
}

function Row({ a, act, n, past }: { a: Appt; act: Act | null; n: number; past: boolean }) {
  const { person } = useIndex()
  const { now } = useStore()
  const sheets = useSheets()
  const p = person.get(a.personId)!
  const soon = !past && a.start - now < 2 * 60 * MIN && a.start > now - 30 * MIN
  let sub: string
  if (past) sub = a.status === 'no_show' ? 'Did not come' : a.benefits?.length ? `Felt ${a.benefits.slice(0, 2).join(', ').toLowerCase()}` : a.rating ? 'Left a rating' : 'No feedback yet'
  else sub = a.kind === 'first' ? 'First visit' : `Follow-up, session ${n}`
  const Icon = act?.icon === 'remind' ? MessageCircle : act?.icon === 'remedy' ? Leaf : CalendarPlus
  return (
    <li>
      <div className={'row row-split' + (soon ? ' is-soon' : '')}>
        <button className="row-hit" onClick={() => sheets.session(a.id)}>
          <span className="row-time">{fmtTime(a.start)}<small>{soon ? relative(a.start, now) : `${a.durationMin} min`}</small></span>
          <Avatar name={p.name} size={40} />
          <span className="row-main"><b>{p.name}</b><small className={past && a.benefits?.length ? 'felt' : a.status === 'no_show' ? 'warn' : ''}>{sub}</small></span>
          {past && a.rating ? <span className="mini-rating"><Star size={12} />{a.rating}</span> : null}
        </button>
        <span className="row-end">
          {act ? (
            <m.button className={`act act-${act.icon}`} whileTap={{ scale: 0.94 }} onClick={act.run}>
              <Icon size={14} />{act.label}
            </m.button>
          ) : !past && <span className="mode-ic" role="img" aria-label={a.mode === 'online' ? 'Online' : 'In person'}>{a.mode === 'online' ? <Video size={15} /> : <MapPin size={15} />}</span>}
        </span>
      </div>
    </li>
  )
}
