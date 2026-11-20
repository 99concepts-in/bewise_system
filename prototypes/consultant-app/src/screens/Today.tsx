/**
 * @screens CN-03 Today — share link, today's appointments with check-in (+ calendar), impact, "Needs you" insights, motivation.
 * v5 (HUB 2026-11-20, D-45 "Blue Bloom"): serif greeting, navy summary card (sessions · blends to give · today's sales),
 *          a calm session timeline with each client's chosen feelings as coloured chips, a safety dot, check-in state,
 *          and one floating primary action (build the pending remedy, or start the session that's ready).
 */
import { useMemo, useState } from 'react'
import { AnimatePresence, m, useMotionValue, useTransform } from 'motion/react'
import { Bell, MapPin, Video, Play, Sparkles, ChevronRight, MessageCircle, Link2, CalendarDays, UserCheck, Check, ClipboardCheck, ClipboardList, Droplet, Users, CalendarPlus, Quote } from 'lucide-react'
import { useIndex, useStore } from '../state/store'
import { AppHeader, CountUp, Empty, go, spring, useMedia, useToast } from '../ui/kit'
import { FeelingChips, FlowerStack } from '../ui/art'
import { useSheets, waLink, reminderText, FEE } from './Sheets'
import { ImpactCard } from './Impact'
import { insights, personView, growth, WEEK_GOAL, LIFETIME_REACH, type Insight, type PersonView } from '../lib/derive'
import { fmtDay, fmtTime, greeting, relative, inr } from '../lib/time'
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

  // v5 summary: everything from existing data (fees per session kind; a blend is due from every session that happens)
  const attended = todays.filter((a) => a.status !== 'no_show')
  const blendsToGive = attended.filter((a) => !a.remedy).length
  const sales = attended.reduce((sum, a) => sum + FEE[a.kind], 0)

  const sub = todays.length === 0 ? 'No sessions today. A good day for follow-ups.'
    : !next ? `All ${todays.length} sessions done. Thank you for today.`
    : live ? `You're with ${person.get(live.personId)?.first} now.`
    : `${done} of ${todays.length} done. Next at ${fmtTime(next.start)}.`

  // one primary action on this screen (spec §4): the remedy that's waiting, else the session that's ready to start
  const pendingRemedy = todays.find((a) => a.status === 'completed' && !a.remedy)
  const ready = todays.find((a) => a.status === 'in_session') ?? todays.find((a) => a.status === 'checked_in')
  const pill = pendingRemedy
    ? { label: `Build ${person.get(pendingRemedy.personId)?.first}'s remedy`, Icon: Droplet, run: () => sheets.remedy(pendingRemedy.id) }
    : ready ? { label: `${ready.status === 'in_session' ? 'Open' : 'Start'} ${person.get(ready.personId)?.first}'s session`, Icon: Play, run: () => go(`/session/${ready.id}`) }
    : null

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
                <p className="reach"><Sparkles size={15} aria-hidden /> <span><b><CountUp to={inCare} /></b> people in your care right now, part of the {(LIFETIME_REACH).toLocaleString('en-IN')}+ lives you've reached</span></p>
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

      <AnimatePresence>
        {pill && (
          <m.button key={pill.label} className="fab" onClick={pill.run} initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} whileTap={{ scale: 0.97 }}>
            <pill.Icon size={20} aria-hidden /> {pill.label}
          </m.button>
        )}
      </AnimatePresence>
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
        <button className="link link-ic" onClick={sheets.calendar}><CalendarDays size={16} aria-hidden /> Calendar</button>
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
          const form = a.kind === 'followup' ? (p.checkin && now - p.checkin.at < 10 * DAY ? 'filled' : 'missing') : null
          // what the client chose when booking; for sessions already held, what was troubling them
          const lastTroubling = [...(byPerson.get(p.id) ?? [])].reverse().find((x) => x.start < a.start && x.troubling)?.troubling
          const feelings = a.feelings ?? a.troubling ?? lastTroubling ?? []
          let action: JSX.Element | null = null
          if (a.status === 'confirmed' && soon) action = <m.button className="btn btn-quiet btn-sm" whileTap={{ scale: 0.95 }} onClick={() => { dispatch({ type: 'checkIn', apptId: a.id }); toast(`${p.first} ${a.mode === 'online' ? 'has joined' : 'has arrived'}. Start when you're ready.`) }}><UserCheck size={16} aria-hidden /> Check in</m.button>
          else if (a.status === 'checked_in') action = <m.button className="btn btn-quiet btn-sm" whileTap={{ scale: 0.95 }} onClick={() => go(`/session/${a.id}`)}><Play size={16} aria-hidden /> Start</m.button>
          else if (a.status === 'in_session') action = <m.button className="btn btn-quiet btn-sm" whileTap={{ scale: 0.95 }} onClick={() => go(`/session/${a.id}`)}><Play size={16} aria-hidden /> Open</m.button>
          else if (a.status === 'completed' && !a.remedy) action = <m.button className="btn btn-quiet btn-sm" whileTap={{ scale: 0.95 }} onClick={() => sheets.remedy(a.id)}><Droplet size={16} aria-hidden /> Give remedy</m.button>
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
                  <span className="tl-meta">{a.mode === 'online' ? <Video size={15} aria-hidden /> : <MapPin size={15} aria-hidden />}{a.kind === 'first' ? 'First consultation' : 'Follow-up'}<i aria-hidden>·</i>{a.mode === 'online' ? 'Online' : 'Center'}</span>
                </button>
                {feelings.length > 0 && !fin && <FeelingChips items={feelings} size="sm" />}
                {isNext && a.note && !fin && <p className="tdl-note">“{a.note}”</p>}
                {(action || (!fin && form) || (fin && a.remedy)) && (
                  <div className="tl-foot">
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

// ---------------------------------------------------------------- insight deck (swipe to dismiss)
const TONE_ACCENT: Record<Insight['tone'], string> = { rose: 'coral', mist: 'sky', sage: 'teal', gold: 'marigold' }
const ACTION_ICON: Record<Insight['action']['kind'], typeof Droplet> = { 'give-remedy': Droplet, whatsapp: MessageCircle, person: ClipboardList, people: Users, saturday: CalendarPlus, session: Play }
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
    <div className="deck" style={{ height: 206 }}>
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
  const rotate = useTransform(x, [-220, 0, 220], [-6, 0, 6])
  const top = depth === 0
  const Icon = ACTION_ICON[it.action.kind]
  return (
    <m.article
      className="insight"
      style={{ x: top ? x : 0, rotate: top ? rotate : 0, zIndex: 10 - depth }}
      initial={{ scale: 0.92, y: 22, opacity: 0 }}
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
      <span className={`insight-ic tone-${TONE_ACCENT[it.tone]}`} aria-hidden><Icon size={20} /></span>
      <h3>{it.title}</h3>
      <p>{it.why}</p>
      <div className="insight-foot">
        <button className="btn btn-primary btn-sm" onClick={onAct} tabIndex={top ? 0 : -1}>
          {it.action.kind === 'whatsapp' && <MessageCircle size={16} aria-hidden />}{it.action.label}{it.action.kind === 'people' || it.action.kind === 'person' ? <ChevronRight size={16} aria-hidden /> : null}
        </button>
        <button className="link" onClick={onDismiss} tabIndex={top ? 0 : -1}>Later</button>
        {depth === 0 && total > 1 && <span className="muted small deck-hint">{total - 1} more</span>}
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
      <circle cx="42" cy="42" r={r} fill="none" stroke="#E6EDFF" strokeWidth="8" />
      <m.circle cx="42" cy="42" r={r} fill="none" stroke="#4C6FD6" strokeWidth="8" strokeLinecap="round" transform="rotate(-90 42 42)"
        strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }} />
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
      <figcaption className="kind-cap"><Quote size={16} aria-hidden /> What people told you</figcaption>
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

