/**
 * @screens CN-03 Today — share link, today's appointments with check-in (+ calendar), impact, "Needs you" insights, motivation.
 */
import { useMemo, useState } from 'react'
import { AnimatePresence, m, useMotionValue, useTransform } from 'motion/react'
import { Bell, MapPin, Video, Play, Sparkles, ChevronRight, MessageCircle, Link2, CalendarDays, UserCheck, Leaf, Check, ClipboardCheck, ClipboardList } from 'lucide-react'
import { useIndex, useStore } from '../state/store'
import { CountUp, Empty, go, softSpring, spring, useMedia, useToast } from '../ui/kit'
import { useSheets, waLink, reminderText } from './Sheets'
import { ImpactCard } from './Impact'
import { insights, personView, growth, WEEK_GOAL, LIFETIME_REACH, type Insight, type PersonView } from '../lib/derive'
import { fmtTime, greeting, relative } from '../lib/time'
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

  const views = useMemo(() => new Map(s.people.map((p) => [p.id, personView(p, byPerson.get(p.id), now)])), [s.people, byPerson, now])
  const deck = useMemo(() => insights(s.people, views, s.appts, s, now).filter((i) => !s.dismissed.includes(i.key)), [s, views, now])
  const g = useMemo(() => growth(s.appts, s.people, now), [s.appts, s.people, now])
  const wide = useMedia('(min-width: 1180px)')
  const inCare = useMemo(() => [...views.values()].filter((v) => v.buckets.includes('care')).length, [views])

  const sub = todays.length === 0 ? 'No sessions today. A good day for follow-ups.'
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

      {(() => {
        const list = <TodayList todays={todays} next={next} done={done} now={now} />
        const impact = <ImpactCard />
        const needs = (
          <section className="block" aria-label="Needs you">
            <div className="block-head"><h2>Needs you</h2>{deck.length > 0 && <span className="muted small">{deck.length} {deck.length === 1 ? 'thing' : 'things'}</span>}</div>
            <InsightDeck items={deck} views={views} />
          </section>
        )
        const week = (
          <section className="block" aria-label="Your week">
            <div className="block-head"><h2>Your week</h2><button className="link" onClick={() => go('/growth')}>Growth</button></div>
            <div className="week card">
              <Ring value={g.thisWeek} goal={WEEK_GOAL} />
              <div className="week-stats">
                <p><b><CountUp to={g.thisWeek} /></b> of {WEEK_GOAL} sessions done this week</p>
                <p className="muted small">{g.thisWeek >= WEEK_GOAL ? 'Weekly goal reached. Remember to rest too.' : g.thisWeek + g.bookedRest >= WEEK_GOAL ? `${g.bookedRest} more booked. You're on track for your goal.` : `${g.bookedRest} more booked, ${WEEK_GOAL - g.thisWeek - g.bookedRest} open ${WEEK_GOAL - g.thisWeek - g.bookedRest === 1 ? 'spot' : 'spots'} to your goal.`}</p>
                <p className="reach"><Sparkles size={14} /> <span><b><CountUp to={inCare} /></b> people in your care right now, part of the {(LIFETIME_REACH).toLocaleString('en-IN')}+ lives you've reached</span></p>
              </div>
            </div>
            <KindWords appts={g.kind} />
          </section>
        )
        // wide screens: two calm columns (work on the left, motivation on the right); phones keep the requested order
        return wide
          ? <div className="today-cols"><div>{list}{needs}</div><div>{impact}{week}</div></div>
          : <>{list}{impact}{needs}{week}</>
      })()}

      {todays.length === 0 && <Empty img="owl-read" title="A quiet day" body="No sessions booked today. Follow-ups that are due are a gentle place to start." action={<button className="btn btn-quiet" onClick={() => go('/people?due')}>See follow-ups due</button>} />}
    </div>
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
      <div className="tdl-head"><div><h2>Today's appointments</h2><small>None booked</small></div><button className="cal-btn" onClick={sheets.calendar}><CalendarDays size={16} /> Calendar</button></div>
    </section>
  )
  return (
    <section className="card today-list" aria-label="Today's appointments">
      <div className="tdl-head">
        <div className="mini-bloom"><Bloom appts={todays} now={now} onPetal={(a) => sheets.session(a.id)} /></div>
        <div><h2>Today's appointments</h2><small>{done} of {todays.length} done{todays.filter((a) => a.status === 'checked_in').length ? `, ${todays.filter((a) => a.status === 'checked_in').length} checked in` : ''}</small></div>
        <button className="cal-btn" onClick={sheets.calendar}><CalendarDays size={16} /> Calendar</button>
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
          else if (a.status === 'completed' && !a.remedy) action = <m.button className="tdl-act act-remedy" whileTap={{ scale: 0.94 }} onClick={() => sheets.remedy(a.id)}><Leaf size={14} /> Give remedy</m.button>
          else if (fin) action = <span className="tdl-done">{a.status === 'no_show' ? "Didn't come" : <><Check size={14} /> Done</>}</span>
          return (
            <m.li key={a.id} className={'tdl-row' + (fin ? ' is-fin' : '') + (isNext ? ' is-next' : '') + (a.status === 'in_session' ? ' is-live' : '')} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05, duration: 0.24 }}>
              <div className="tdl-line">
                <button className="tdl-who" onClick={() => sheets.session(a.id)}>
                  <span className="tdl-time">{fmtTime(a.start)}<small>{isNext && !fin ? (a.status === 'in_session' ? 'now' : relative(a.start, now)) : `${a.durationMin} min`}</small></span>
                  <span className="tdl-main"><b>{p.name}</b>
                    <small>{a.mode === 'online' ? <Video size={12} /> : <MapPin size={12} />} {a.kind === 'first' ? 'First visit' : 'Follow-up'}{a.status === 'checked_in' ? (a.mode === 'online' ? ', joined' : ', arrived') : ''}</small></span>
                </button>
                {action}
              </div>
              {!fin && form && (
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

// ---------------------------------------------------------------- insight deck (swipe to dismiss)
const TONE_IMG: Record<Insight['tone'], string> = { rose: 'owl-drops', mist: 'owl-read', sage: 'owl-wave', gold: 'owl-wave' }
function InsightDeck({ items, views }: { items: Insight[]; views: Map<string, PersonView> }) {
  const { s, dispatch, now } = useStore()
  const sheets = useSheets()
  const toast = useToast()
  const [, force] = useState(0)
  if (items.length === 0) {
    return <div className="card all-clear"><img src="./img/owl-wave-160.webp" width={64} height={64} alt="" decoding="async" /><div><b>You're all caught up.</b><p className="muted small">New things will appear here as they happen.</p></div></div>
  }
  const act = (i: Insight) => {
    const a = i.action
    if (a.kind === 'give-remedy' && a.target) sheets.remedy(a.target)
    if (a.kind === 'person' && a.target) go(`/people/${a.target}`)
    if (a.kind === 'people') go(`/people?${a.bucket}`)
    if (a.kind === 'saturday') { dispatch({ type: 'saturday', on: true }); dispatch({ type: 'dismiss', key: i.key }); toast('Saturday 10 AM to 1 PM is now open for booking') }
    if (a.kind === 'whatsapp' && a.target) {
      const p = s.people.find((x) => x.id === a.target)!
      const v = views.get(p.id)
      window.open(waLink(p.phone, reminderText(p.first, v?.next?.start, now)), '_blank', 'noopener')
      dispatch({ type: 'dismiss', key: i.key })
    }
    force((x) => x + 1)
  }
  const visible = items.slice(0, 3)
  return (
    <div className="deck" style={{ height: 196 }}>
      <AnimatePresence initial={false}>
        {visible.map((it, i) => (
          <DeckCard key={it.key} it={it} depth={i} total={items.length} onAct={() => act(it)} onDismiss={() => dispatch({ type: 'dismiss', key: it.key })} />
        )).reverse()}
      </AnimatePresence>
    </div>
  )
}

function DeckCard({ it, depth, total, onAct, onDismiss }: { it: Insight; depth: number; total: number; onAct: () => void; onDismiss: () => void }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 0, 220], [-8, 0, 8])
  const top = depth === 0
  return (
    <m.article
      className={`insight tone-${it.tone}`}
      style={{ x: top ? x : 0, rotate: top ? rotate : 0, zIndex: 10 - depth }}
      initial={{ scale: 0.9, y: 22, opacity: 0 }}
      animate={{ scale: 1 - depth * 0.05, y: depth * 12, opacity: depth > 1 ? 0.6 : 1 }}
      exit={{ x: x.get() < 0 ? -420 : 420, opacity: 0, transition: { duration: 0.25 } }}
      transition={spring}
      drag={top ? 'x' : false}
      dragSnapToOrigin
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 110 || Math.abs(info.velocity.x) > 700) { x.set(info.offset.x); onDismiss() }
      }}
      aria-hidden={!top}
    >
      <img className="insight-owl" src={`./img/${TONE_IMG[it.tone]}-160.webp`} width={72} height={72} alt="" decoding="async" />
      <h3>{it.title}</h3>
      <p>{it.why}</p>
      <div className="insight-foot">
        <button className="btn btn-primary btn-sm" onClick={onAct} tabIndex={top ? 0 : -1}>
          {it.action.kind === 'whatsapp' && <MessageCircle size={15} />}{it.action.label}{it.action.kind === 'people' || it.action.kind === 'person' ? <ChevronRight size={15} /> : null}
        </button>
        <button className="link" onClick={onDismiss} tabIndex={top ? 0 : -1}>Later</button>
        {depth === 0 && total > 1 && <span className="muted small deck-hint">{total - 1} more, swipe for next</span>}
      </div>
    </m.article>
  )
}

// ---------------------------------------------------------------- week ring
function Ring({ value, goal }: { value: number; goal: number }) {
  const r = 34, c = 2 * Math.PI * r
  const pct = Math.min(1, value / goal)
  return (
    <svg className="ring" viewBox="0 0 84 84" width={84} height={84} aria-label={`${value} of ${goal} sessions this week`} role="img">
      <circle cx="42" cy="42" r={r} fill="none" stroke="#E6EAF6" strokeWidth="8" />
      <m.circle cx="42" cy="42" r={r} fill="none" stroke="url(#ring-g)" strokeWidth="8" strokeLinecap="round" transform="rotate(-90 42 42)"
        strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }} />
      <defs><linearGradient id="ring-g" x1="0" x2="1"><stop offset="0" stopColor="#82977E" /><stop offset="1" stopColor="#5E7FB8" /></linearGradient></defs>
      <text x="42" y="47" textAnchor="middle" className="ring-text">{Math.round(pct * 100)}%</text>
    </svg>
  )
}

// ---------------------------------------------------------------- kind words (what clients said)
function KindWords({ appts }: { appts: Appt[] }) {
  const { person } = useIndex()
  const recent = useMemo(() => [...appts].sort((a, b) => b.start - a.start).filter((a) => a.feedback).slice(0, 6), [appts])
  const [i, setI] = useState(0)
  const { now } = useStore()
  if (!recent.length) return null
  const a = recent[i % recent.length]
  const p = person.get(a.personId)!
  const step = (d: number) => setI((x) => (x + d + recent.length) % recent.length)
  return (
    <figure className="kind card">
      <figcaption className="muted small">What people told you</figcaption>
      <AnimatePresence mode="wait" initial={false}>
        <m.blockquote key={a.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}
          drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.4} onDragEnd={(_, inf) => { if (inf.offset.x < -50) step(1); if (inf.offset.x > 50) step(-1) }}>
          “{a.feedback}”
          <cite>{p.first}, {p.city}, {relative(a.start, now)}</cite>
        </m.blockquote>
      </AnimatePresence>
      <div className="dots" role="tablist" aria-label="Choose a message">
        {recent.map((r, k) => <button key={r.id} role="tab" aria-selected={k === i % recent.length} aria-label={`Message ${k + 1}`} onClick={() => setI(k)} className={k === i % recent.length ? 'on' : ''} />)}
      </div>
    </figure>
  )
}
