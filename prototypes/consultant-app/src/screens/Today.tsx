/**
 * @screens CN-03 Today, in Jitendra Khimlani's own order (owner 2026-11-20): all today's appointments, people asking for a time,
 *          who missed their remedy (mood board), whose remedy is about to end.
 * v5 (HUB 2026-11-20, D-45 "Blue Bloom"): serif greeting, navy summary card (sessions · blends to give · today's sales),
 *          a calm session timeline with each client's chosen feelings as coloured chips, a safety dot and check-in state.
 * Owner 2026-11-25: no floating primary-action pill; every row carries its own action.
 */
import { useMemo, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { Archive, Bell, CalendarDays, CalendarPlus, Check, ChevronRight, ClipboardCheck, ClipboardList, Droplet, Link2, MapPin, MessageSquare, Phone, Play, Plus, UserCheck, Video } from 'lucide-react'
import { useIndex, useStore } from '../state/store'
import { AppHeader, Avatar, CountUp, Empty, MoodFace, go, softSpring, spring, useMedia, useToast } from '../ui/kit'
import { FeelingChips, FlowerStack } from '../ui/art'
import { TypeBadge } from '../ui/bits'
import { useSheets, waLink, feeOf } from './Sheets'
import { adherence, personView, remedyBoard, type PersonView } from '../lib/derive'
import { dayLabel, fmtDay, fmtTime, greeting, relative, inr } from '../lib/time'
import { MIN, startOfDay, DAY } from '../data/seed'
import type { Appt } from '../data/types'

export default function Today() {
  const { s, now } = useStore()
  const { person, byPerson } = useIndex()
  const sheets = useSheets()
  const today = startOfDay(now)
  const todays = useMemo(() => s.appts.filter((a) => startOfDay(a.start) === today && a.status !== 'awaiting_payment'), [s.appts, today])
  const done = todays.filter((a) => a.status === 'completed' || a.status === 'no_show').length
  const live = todays.find((a) => a.status === 'in_session')
  const next = live ?? todays.find((a) => a.status === 'checked_in') ?? todays.find((a) => a.start > now - 15 * MIN && a.status === 'confirmed')
  const unread = s.notices.filter((n) => n.at > s.readUpTo && !n.seen).length
  const views = useMemo(() => s.people.map((p) => personView(p, byPerson.get(p.id), now)), [s.people, byPerson, now])
  const board = useMemo(() => remedyBoard(views, now), [views, now])
  const wide = useMedia('(min-width: 1180px)')

  // summary: everything from existing data (fee per type; a blend is due from every Bach flower session that happens)
  const attended = todays.filter((a) => a.status !== 'no_show')
  const blendsToGive = attended.filter((a) => a.service === 'bach' && !a.remedy).length
  const sales = attended.reduce((sum, a) => sum + feeOf(a.service, a.kind), 0)

  const sub = todays.length === 0 ? 'No sessions today. A good day for follow-ups.'
    : !next ? `All ${todays.length} sessions done. Thank you for today.`
    : live ? `You're with ${person.get(live.personId)?.first} now.`
    : `${done} of ${todays.length} done. Next at ${fmtTime(next.start)}.`

  const list = <TodayList todays={todays} next={next} done={done} now={now} />
  const rest = <><Requests /><MissedStrip people={board.missing} /><EndingSoon week={board.ending7} next={board.ending14} /></>
  return (
    <div className="screen today">
      <AppHeader>
        <m.button className="icon-btn" onClick={sheets.share} whileTap={{ scale: 0.94 }} aria-label="Share my link"><Link2 size={20} /></m.button>
        <button className="icon-btn" aria-label={`Updates${unread ? `, ${unread} new` : ''}`} onClick={sheets.notices}>
          <Bell size={20} />
          <AnimatePresence>{unread > 0 && <m.span className="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring}>{unread}</m.span>}</AnimatePresence>
        </button>
      </AppHeader>

      <p className="eyebrow">{fmtDay(now)}</p>
      <h1 className="hello">{greeting(now)}, Jitendra Khimlani</h1>
      <p className="hello-sub">{sub}</p>

      <m.section className="summary" aria-label="Today at a glance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
        <p><b><CountUp to={todays.length} /></b><span>{todays.length === 1 ? 'session' : 'sessions'}</span></p>
        <p><b><CountUp to={blendsToGive} /></b><span>{blendsToGive === 1 ? 'blend to give' : 'blends to give'}</span></p>
        <p><b><CountUp to={sales} format={(n) => inr(Math.round(n))} /></b><span>today's sales</span></p>
      </m.section>

      {wide ? <div className="today-cols"><div>{list}</div><div>{rest}</div></div> : <>{list}{rest}</>}

      {todays.length === 0 && s.requests.length === 0 && <Empty img="owl-read" title="A quiet day" body="Nothing booked and no one waiting. A good day to message people whose remedy is ending." action={<button className="btn btn-quiet" onClick={() => go('/dashboard')}>Open the remedy dashboard</button>} />}
    </div>
  )
}

// ---------------------------------------------------------------- today's sessions: a calm timeline
function TodayList({ todays, next, done, now }: { todays: Appt[]; next?: Appt; done: number; now: number }) {
  const { person, byPerson } = useIndex()
  const { s, dispatch } = useStore()
  const sheets = useSheets()
  const toast = useToast()
  const checkedIn = todays.filter((a) => a.status === 'checked_in').length
  return (
    <section className="block today-list" aria-label="Today's appointments">
      <div className="block-head">
        <h2>Today's sessions</h2>
        <span className="tl-head-acts">
          <button className="link link-ic" onClick={sheets.calendar} aria-label="Calendar"><CalendarDays size={16} aria-hidden /> <span className="hide-xs">Calendar</span></button>
          <button className="btn btn-primary btn-sm new-btn" onClick={() => sheets.newAppt()} aria-label="New appointment"><Plus size={16} aria-hidden /> New</button>
        </span>
      </div>
      {todays.length === 0
        ? <p className="muted small">None booked.</p>
        : <p className="muted small tl-sum">{done} of {todays.length} done{checkedIn ? `, ${checkedIn} checked in` : ''}</p>}
      <ol className="tl">
        {todays.map((a, i) => {
          const p = person.get(a.personId)!
          const isNext = a === next
          const fin = a.status === 'completed' || a.status === 'no_show'
          const soon = a.start - now < 2 * 60 * MIN
          const form = a.kind === 'followup' && a.service === 'bach' ? (p.checkin && now - p.checkin.at < 10 * DAY ? 'filled' : 'missing') : null
          // what the client chose when booking; for sessions already held, what was troubling them
          const lastTroubling = [...(byPerson.get(p.id) ?? [])].reverse().find((x) => x.start < a.start && x.troubling)?.troubling
          const feelings = a.feelings ?? a.troubling ?? lastTroubling ?? []
          let action: JSX.Element | null = null
          if (a.status === 'confirmed' && soon) action = <m.button className="btn btn-quiet btn-sm" whileTap={{ scale: 0.95 }} onClick={() => { dispatch({ type: 'checkIn', apptId: a.id }); toast(`${p.first} ${a.mode === 'online' ? 'has joined' : 'has arrived'}. Start when you're ready.`) }}><UserCheck size={16} aria-hidden /> Check in</m.button>
          else if (a.status === 'checked_in') action = <m.button className="btn btn-quiet btn-sm" whileTap={{ scale: 0.95 }} onClick={() => go(`/session/${a.id}`)}><Play size={16} aria-hidden /> Start</m.button>
          else if (a.status === 'in_session') action = <m.button className="btn btn-quiet btn-sm" whileTap={{ scale: 0.95 }} onClick={() => go(`/session/${a.id}`)}><Play size={16} aria-hidden /> Open</m.button>
          else if (a.status === 'completed' && !a.remedy && a.service === 'bach') action = <m.button className="btn btn-quiet btn-sm" whileTap={{ scale: 0.95 }} onClick={() => sheets.remedy(a.id)}><Droplet size={16} aria-hidden /> Give remedy</m.button>
          const state = a.status === 'checked_in' ? { cls: 'teal', text: a.mode === 'online' ? 'Joined' : 'Checked in', tick: true }
            : a.status === 'in_session' ? { cls: 'blue', text: 'In session', tick: false }
            : a.status === 'completed' ? { cls: 'done', text: 'Done', tick: true }
            : a.status === 'no_show' ? { cls: 'coral', text: "Didn't come", tick: false }
            : isNext ? { cls: 'sky', text: relative(a.start, now), tick: false } : null
          return (
            <m.li key={a.id} className={'tdl-row' + (fin ? ' is-fin' : '') + (isNext ? ' is-next' : '') + (a.status === 'in_session' ? ' is-live' : '')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
              <span className="tl-rail" aria-hidden><i className="tl-dot">{fin && a.status === 'completed' ? <Check size={10} strokeWidth={3.4} /> : null}</i></span>
              <div className="tl-card">
                <div className="tl-top">
                  <span className="tl-time">{fmtTime(a.start)}<span className="muted"> · {a.durationMin} min</span></span>
                  {a.safety && !fin && <span className="safety" role="img" aria-label="Safety answer in the intake. Read it before the session." title="Safety answer in the intake. Read it before the session." />}
                  {state && <span className={`state state-${state.cls}`}>{state.tick && <Check size={13} strokeWidth={3} aria-hidden />}{state.text}</span>}
                </div>
                <button className="tl-hit" onClick={() => sheets.session(a.id)}>
                  <span className="tl-name">{p.name}</span>
                  <span className="tl-meta"><TypeBadge service={a.service} kind={a.kind} />{a.mode === 'online' ? <Video size={15} aria-hidden /> : <MapPin size={15} aria-hidden />}{a.mode === 'online' ? 'Online' : 'Center'}</span>
                </button>
                {feelings.length > 0 && !fin && <FeelingChips items={feelings} size="sm" />}
                {isNext && a.note && !fin && <p className="tdl-note">“{a.note}”</p>}
                {(action || (!fin && form) || (fin && a.remedy) || (!fin && a.mode === 'online')) && (
                  <div className="tl-foot">
                    {!fin && a.mode === 'online' && (a.meetingUrl
                      ? <button className="form-ok" onClick={() => sheets.session(a.id)}><Video size={15} aria-hidden /> Video link shared</button>
                      : <button className="form-miss" onClick={() => sheets.session(a.id)}><Link2 size={15} aria-hidden /> Add the video link</button>)}
                    {!fin && form === 'filled' && <button className="form-ok" onClick={() => go(`/people/${p.id}`)}><ClipboardCheck size={15} aria-hidden /> Check-in filled {relative(p.checkin!.at, now)}</button>}
                    {!fin && form === 'missing' && <a className="form-miss" href={waLink(p.phone, `Namaste ${p.first} 🙏 Before our follow-up at ${fmtTime(a.start)}, please fill the 2-minute check-in in the BeWise app so I can see how you've been. Jitendra Khimlani`)} target="_blank" rel="noreferrer"><ClipboardList size={15} aria-hidden /> Ask for check-in</a>}
                    {fin && a.remedy && <span className="tl-blend"><FlowerStack flowers={a.remedy.flowers} size={26} /><span className="muted small">Blend given</span></span>}
                    {action}
                  </div>
                )}
              </div>
            </m.li>
          )
        })}
      </ol>
      {todays.length > 0 && !next && <p className="muted small tdl-end">That's everyone for today. Tomorrow: {s.appts.filter((x) => startOfDay(x.start) === startOfDay(now) + DAY).length} sessions booked.</p>}
    </section>
  )
}

// ---------------------------------------------------------------- 2. requests: clients ask, the team calls and assigns a time
function Requests() {
  const { s, now } = useStore()
  const { person } = useIndex()
  const sheets = useSheets()
  if (!s.requests.length) return null
  const list = [...s.requests].sort((a, b) => a.at - b.at)
  return (
    <section className="block" aria-label="Asking for an appointment">
      <div className="block-head"><h2>Asking for a time <span className="count-pill">{list.length}</span></h2><span className="muted small">Call, then assign</span></div>
      <ul className="req-list">
        {list.map((r, i) => {
          const p = person.get(r.personId)!
          return (
            <m.li key={r.id} className="req" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.04 }} layout>
              <Avatar name={p.name} size={40} />
              <div className="req-main">
                <b>{p.name}</b>
                <span className="req-meta"><TypeBadge service={r.service} kind={r.kind} />{r.mode === 'online' ? <Video size={12} aria-label="Online" /> : <MapPin size={12} aria-label="In person" />}<span>asked {relative(r.at, now)}</span></span>
                <small>Prefers: {r.preferred}</small>
              </div>
              <div className="req-acts">
                <a className="icon-btn sm" href={`tel:${p.phone.replace(/\s/g, '')}`} aria-label={`Call ${p.first}`}><Phone size={16} /></a>
                <button className="tdl-act act-in" onClick={() => sheets.assign(r.id)}><CalendarPlus size={14} /> Assign</button>
              </div>
            </m.li>
          )
        })}
      </ul>
    </section>
  )
}

// ---------------------------------------------------------------- 3. mood board strip: people who missed their remedy
function MissedStrip({ people }: { people: PersonView[] }) {
  const { now } = useStore()
  if (!people.length) return null
  return (
    <section className="block" aria-label="Missed their remedy">
      <div className="block-head"><h2>Missed their remedy</h2><button className="link" onClick={() => go('/people?missing')}>Mood board <ChevronRight size={14} /></button></div>
      <div className="mood-strip" role="list">
        {people.slice(0, 12).map((v, i) => {
          const a = adherence(v.p, now)
          return (
            <m.button key={v.p.id} role="listitem" className="mood-card" onClick={() => go(`/people/${v.p.id}?remedy`)} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...softSpring, delay: 0.1 + i * 0.04 }}>
              {v.latestMood ? <MoodFace mood={v.latestMood} size={56} /> : <Avatar name={v.p.name} size={56} />}
              <b>{v.p.first}</b>
              <small className="miss">Missed {a?.last7Missed ?? 0} of 7 days</small>
            </m.button>
          )
        })}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- 4. remedies about to end (this week / next week) — message, book, archive
function EndingSoon({ week, next }: { week: PersonView[]; next: PersonView[] }) {
  const { dispatch, now } = useStore()
  const sheets = useSheets()
  const toast = useToast()
  const [tab, setTab] = useState<'week' | 'next'>('week')
  if (!week.length && !next.length) return null
  const list = tab === 'week' ? week : next
  return (
    <section className="block" aria-label="Remedy about to end">
      <div className="block-head"><h2>Remedy about to end</h2></div>
      <div className="mini-seg" role="tablist">
        <button role="tab" aria-selected={tab === 'week'} className={tab === 'week' ? 'on' : ''} onClick={() => setTab('week')}>Within a week <em>{week.length}</em></button>
        <button role="tab" aria-selected={tab === 'next'} className={tab === 'next' ? 'on' : ''} onClick={() => setTab('next')}>In 1–2 weeks <em>{next.length}</em></button>
      </div>
      <ul className="rows ending">
        <AnimatePresence initial={false}>
          {list.map((v) => (
            <m.li key={v.p.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}>
              <div className="row row-split">
                <button className="row-hit" onClick={() => go(`/people/${v.p.id}`)}>
                  <Avatar name={v.p.name} size={40} mood={v.latestMood} />
                  <span className="row-main"><b>{v.p.name}</b><small className={v.daysLeft! <= 2 ? 'warn' : ''}><Droplet size={12} aria-hidden /> {v.daysLeft === 0 ? 'Ends today' : v.daysLeft === 1 ? 'Ends tomorrow' : `Ends in ${v.daysLeft} days`}<span className="hide-sm">, {fmtDay(v.endsOn!)}</span></small></span>
                </button>
                <span className="row-end end-acts">
                  <button className="icon-btn sm" aria-label={`Message ${v.p.first}`} onClick={() => go(`/messages/${v.p.id}`)}><MessageSquare size={15} /></button>
                  {v.next ? <span className="next-chip">{dayLabel(v.next.start, now)}</span> : <button className="act act-book" onClick={() => sheets.newAppt({ personId: v.p.id, service: 'bach' })}><CalendarPlus size={14} /> Book</button>}
                  <button className="icon-btn sm" aria-label={`Archive ${v.p.first}`} onClick={() => { dispatch({ type: 'archive', personId: v.p.id, on: true }); toast(`${v.p.first} archived. Find them under People, Archived.`) }}><Archive size={15} /></button>
                </span>
              </div>
            </m.li>
          ))}
        </AnimatePresence>
      </ul>
      {list.length === 0 && <p className="muted small">No one in this group.</p>}
    </section>
  )
}
