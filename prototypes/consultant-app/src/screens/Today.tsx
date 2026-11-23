/**
 * @screens CN-03 Today — in the order Jitu Bhaiya asked for (owner 2026-11-20):
 *   1. today's appointments  2. requests waiting for a time  3. mood board of people who missed their remedy  4. remedies about to end.
 */
import { useMemo, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { Archive, Bell, CalendarDays, CalendarPlus, Check, ChevronRight, ClipboardCheck, ClipboardList, Leaf, Link2, MapPin, MessageSquare, Phone, Play, Plus, UserCheck, Video } from 'lucide-react'
import { useIndex, useStore } from '../state/store'
import { Avatar, Empty, MoodFace, go, softSpring, spring, useToast } from '../ui/kit'
import { TypeBadge } from '../ui/bits'
import { useSheets, waLink } from './Sheets'
import { adherence, personView, remedyBoard, type PersonView } from '../lib/derive'
import { dayLabel, fmtDay, fmtTime, greeting, relative } from '../lib/time'
import { MIN, startOfDay, DAY } from '../data/seed'
import type { Appt } from '../data/types'

export default function Today() {
  const { s, now } = useStore()
  const { person, byPerson } = useIndex()
  const sheets = useSheets()
  const today = startOfDay(now)
  const todays = useMemo(() => s.appts.filter((a) => startOfDay(a.start) === today), [s.appts, today])
  const done = todays.filter((a) => a.status === 'completed' || a.status === 'no_show').length
  const live = todays.find((a) => a.status === 'in_session')
  const next = live ?? todays.find((a) => a.status === 'checked_in') ?? todays.find((a) => a.start > now - 15 * MIN && (a.status === 'confirmed' || a.status === 'awaiting_payment'))
  const unread = s.notices.filter((n) => n.at > s.readUpTo && !n.seen).length
  const views = useMemo(() => s.people.map((p) => personView(p, byPerson.get(p.id), now)), [s.people, byPerson, now])
  const board = useMemo(() => remedyBoard(views, now), [views, now])

  const sub = todays.length === 0 ? 'No sessions today.'
    : !next ? `All ${todays.length} sessions done. Thank you for today.`
    : live ? `You're with ${person.get(live.personId)?.first} now.`
    : `${done} of ${todays.length} done. Next at ${fmtTime(next.start)}.`

  return (
    <div className="screen today">
      <header className="topbar">
        <img className="me" src="./img/jitu.webp" width={44} height={44} alt="Jitu Bhaiya" />
        <div className="brand"><b>BeWise</b><span>Consultant</span></div>
        <m.button className="share-btn" onClick={sheets.share} whileTap={{ scale: 0.95 }}><Link2 size={16} /> Share my link</m.button>
        <button className="icon-btn" aria-label={`Updates${unread ? `, ${unread} new` : ''}`} onClick={sheets.notices}>
          <Bell size={20} />
          <AnimatePresence>{unread > 0 && <m.span className="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring}>{unread}</m.span>}</AnimatePresence>
        </button>
      </header>

      <h1 className="hello"><span>{greeting(now)}, Jitu Bhaiya.</span><span className="hello-sub">{sub}</span></h1>

      <TodayList todays={todays} next={next} done={done} now={now} />
      <Requests />
      <MissedStrip people={board.missing} />
      <EndingSoon week={board.ending7} next={board.ending14} />
      {todays.length === 0 && s.requests.length === 0 && <Empty img="owl-read" title="A quiet day" body="Nothing booked and no one waiting. A good day to message people whose remedy is ending." action={<button className="btn btn-quiet" onClick={() => go('/dashboard')}>Open the remedy dashboard</button>} />}
    </div>
  )
}

function HeadActions() {
  const sheets = useSheets()
  return (
    <div className="head-actions">
      <button className="cal-btn" onClick={sheets.calendar} aria-label="Calendar"><CalendarDays size={16} /><span className="hide-xs">Calendar</span></button>
      <button className="cal-btn new-btn" onClick={() => sheets.newAppt()} aria-label="New appointment"><Plus size={16} /><span>New</span></button>
    </div>
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
            <m.button key={v.p.id} role="listitem" className="mood-card" onClick={() => go(`/people/${v.p.id}?care`)} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...softSpring, delay: 0.1 + i * 0.04 }}>
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
                  <span className="row-main"><b>{v.p.name}</b><small className={v.daysLeft! <= 2 ? 'warn' : ''}><Leaf size={12} /> {v.daysLeft === 0 ? 'Ends today' : v.daysLeft === 1 ? 'Ends tomorrow' : `Ends in ${v.daysLeft} days`}<span className="hide-sm">, {fmtDay(v.endsOn!)}</span></small></span>
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

// ---------------------------------------------------------------- the bloom
function Bloom({ appts, now, onPetal }: { appts: Appt[]; now: number; onPetal: (a: Appt) => void }) {
  const n = Math.max(appts.length, 1)
  const nextIdx = appts.findIndex((a) => a.status === 'in_session' || a.status === 'checked_in' || (a.start > now - 15 * MIN && a.status === 'confirmed'))
  const w = Math.min(1, 6 / n)
  return (
    <svg className="bloom" viewBox="0 0 200 200" role="group" aria-label={`${appts.length} sessions today`}>
      <defs>
        <linearGradient id="petal-done" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#182957" /><stop offset="1" stopColor="#5E7FB8" /></linearGradient>
        <radialGradient id="core" cx="0.5" cy="0.45" r="0.6"><stop offset="0" stopColor="#FFF8E8" /><stop offset="1" stopColor="#E9D9B4" /></radialGradient>
      </defs>
      {appts.length === 0 && <circle cx="100" cy="100" r="62" fill="none" stroke="#C9D2EC" strokeDasharray="4 6" strokeWidth="2" />}
      {appts.map((a, i) => {
        const st = a.status === 'completed' || a.status === 'no_show' ? 'done' : i === nextIdx ? 'next' : 'later'
        const angle = (360 / n) * i - 90 + (n === 1 ? 90 : 0)
        return (
          <g key={a.id} transform={`translate(100 100) rotate(${angle + 90})`}>
            <m.g
              initial={{ scale: 0, rotate: -24, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ ...softSpring, delay: 0.12 + i * 0.09 }}
              style={{ originX: '0px', originY: '0px' }}
            >
              <m.path
                className={`petal petal-${st}`}
                d="M0,-14 C-27,-32 -31,-74 0,-90 C31,-74 27,-32 0,-14Z"
                transform={`scale(${w} 1)`}
                animate={st === 'next' ? { scale: [1, 1.05, 1] } : undefined}
                transition={st === 'next' ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } : undefined}
                style={{ originX: '0px', originY: '-14px' }}
                tabIndex={0}
                role="button"
                aria-label={`${fmtTime(a.start)}, ${st === 'done' ? 'done' : st === 'next' ? 'next' : 'later'}`}
                onClick={() => onPetal(a)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onPetal(a) }}
              />
            </m.g>
          </g>
        )
      })}
      <m.circle cx="100" cy="100" r="17" fill="url(#core)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...softSpring, delay: 0.05 }} style={{ originX: '100px', originY: '100px' }} />
    </svg>
  )
}

// ---------------------------------------------------------------- today's appointments with check-in
function TodayList({ todays, next, done, now }: { todays: Appt[]; next?: Appt; done: number; now: number }) {
  const { person } = useIndex()
  const { s, dispatch } = useStore()
  const sheets = useSheets()
  const toast = useToast()
  if (todays.length === 0) return (
    <section className="card today-list" aria-label="Today's appointments">
      <div className="tdl-head"><div><h2>Today's appointments</h2><small>None booked yet</small></div><HeadActions /></div>
    </section>
  )
  return (
    <section className="card today-list" aria-label="Today's appointments">
      <div className="tdl-head">
        <div className="mini-bloom"><Bloom appts={todays} now={now} onPetal={(a) => sheets.session(a.id)} /></div>
        <div><h2>Today's appointments</h2><small>{done} of {todays.length} done{todays.filter((a) => a.status === 'checked_in').length ? `, ${todays.filter((a) => a.status === 'checked_in').length} checked in` : ''}</small></div>
        <HeadActions />
      </div>
      <ul className="tdl">
        {todays.map((a, i) => {
          const p = person.get(a.personId)!
          const isNext = a === next
          const fin = a.status === 'completed' || a.status === 'no_show'
          const soon = a.start - now < 2 * 60 * MIN
          const form = a.kind === 'followup' ? (p.checkin && now - p.checkin.at < 10 * DAY ? 'filled' : 'missing') : null
          let action: JSX.Element | null = null
          if (a.status === 'confirmed' && soon) action = <m.button className="tdl-act act-in" whileTap={{ scale: 0.94 }} onClick={() => { dispatch({ type: 'checkIn', apptId: a.id }); toast(`${p.first} ${a.mode === 'online' ? 'has joined' : 'has arrived'}. Start when you're ready.`) }}><UserCheck size={14} /> Check in</m.button>
          else if (a.status === 'checked_in') action = <m.button className="tdl-act act-start" whileTap={{ scale: 0.94 }} onClick={() => go(`/session/${a.id}`)}><Play size={14} /> Start</m.button>
          else if (a.status === 'in_session') action = <m.button className="tdl-act act-start" whileTap={{ scale: 0.94 }} onClick={() => go(`/session/${a.id}`)}><Play size={14} /> Open</m.button>
          else if (a.status === 'completed' && a.service === 'bach' && !a.remedy) action = <m.button className="tdl-act act-remedy" whileTap={{ scale: 0.94 }} onClick={() => sheets.remedy(a.id)}><Leaf size={14} /> Give remedy</m.button>
          else if (fin) action = <span className="tdl-done">{a.status === 'no_show' ? "Didn't come" : <><Check size={14} /> Done</>}</span>
          return (
            <m.li key={a.id} className={'tdl-row' + (fin ? ' is-fin' : '') + (isNext ? ' is-next' : '') + (a.status === 'in_session' ? ' is-live' : '')} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05, duration: 0.24 }}>
              <div className="tdl-line">
                <button className="tdl-who" onClick={() => sheets.session(a.id)}>
                  <span className="tdl-time">{fmtTime(a.start)}<small>{isNext && !fin ? (a.status === 'in_session' ? 'now' : relative(a.start, now)) : `${a.durationMin} min`}</small></span>
                  <span className="tdl-main"><b>{p.name}</b>
                    <small><TypeBadge service={a.service} kind={a.kind} />{a.mode === 'online' ? <Video size={12} aria-label="Online" /> : <MapPin size={12} aria-label="In person" />}{a.status === 'checked_in' ? (a.mode === 'online' ? ' joined' : ' arrived') : ''}</small></span>
                </button>
                {action}
              </div>
              {!fin && a.mode === 'online' && (
                <div className="tdl-form">
                  {a.meetingUrl
                    ? <button className="form-ok" onClick={() => sheets.session(a.id)}><Video size={13} /> Video link shared</button>
                    : <button className="form-miss" onClick={() => sheets.session(a.id)}><Link2 size={13} /> Add the video link</button>}
                </div>
              )}
              {!fin && a.service === 'bach' && form && (
                <div className="tdl-form">
                  {form === 'filled'
                    ? <button className="form-ok" onClick={() => go(`/people/${p.id}`)}><ClipboardCheck size={13} /> Check-in form filled {relative(p.checkin!.at, now)}</button>
                    : <a className="form-miss" href={waLink(p.phone, `Namaste ${p.first} 🙏 Before our follow-up at ${fmtTime(a.start)}, please fill the 2-minute check-in in the BeWise app so I can see how you've been. Jitu Bhaiya`)} target="_blank" rel="noreferrer"><ClipboardList size={13} /> No check-in form yet. Ask {p.first}</a>}
                </div>
              )}
              {isNext && a.note && !fin && <p className="tdl-note">“{a.note}”</p>}
            </m.li>
          )
        })}
      </ul>
      {todays.length > 0 && !next && <p className="muted small tdl-end">That's everyone for today. Tomorrow: {s.appts.filter((x) => startOfDay(x.start) === startOfDay(now) + DAY).length} sessions booked.</p>}
    </section>
  )
}

