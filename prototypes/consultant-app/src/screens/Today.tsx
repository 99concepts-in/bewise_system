/**
 * @screens CN-03 Today — bloom of today's sessions, next session, "Needs you" insights, timeline, motivation.
 */
import { useMemo, useState } from 'react'
import { AnimatePresence, m, useMotionValue, useTransform, animate } from 'motion/react'
import { Bell, MapPin, Video, Play, NotebookPen, Sparkles, ChevronRight, MessageCircle } from 'lucide-react'
import { useIndex, useStore } from '../state/store'
import { Avatar, CountUp, Empty, go, softSpring, spring, useToast } from '../ui/kit'
import { useSheets, KIND_LABEL, waLink } from './Sheets'
import { insights, personView, growth, WEEK_GOAL, LIFETIME_REACH, type Insight, type PersonView } from '../lib/derive'
import { fmtTime, greeting, relative, dayLabel } from '../lib/time'
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
  const next = live ?? todays.find((a) => a.start > now && a.status === 'confirmed')
  const unread = s.notices.filter((n) => n.at > s.readUpTo && !n.seen).length

  const views = useMemo(() => new Map(s.people.map((p) => [p.id, personView(p, byPerson.get(p.id), now)])), [s.people, byPerson, now])
  const deck = useMemo(() => insights(s.people, views, s.appts, s, now).filter((i) => !s.dismissed.includes(i.key)), [s, views, now])
  const g = useMemo(() => growth(s.appts, s.people, now), [s.appts, s.people, now])
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
        <button className="icon-btn" aria-label={`Updates${unread ? `, ${unread} new` : ''}`} onClick={sheets.notices}>
          <Bell size={20} />
          <AnimatePresence>{unread > 0 && <m.span className="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring}>{unread}</m.span>}</AnimatePresence>
        </button>
      </header>

      <h1 className="hello"><span>{greeting(now)}, Jitu Bhaiya.</span><span className="hello-sub">{sub}</span></h1>

      <section className="bloom-row" aria-label="Today's sessions">
        <Bloom appts={todays} now={now} onPetal={(a) => sheets.session(a.id)} />
        <div className="bloom-legend">
          <p className="bloom-count"><b>{done}</b><span>/{todays.length}</span></p>
          <p className="muted small">sessions done today</p>
          <ul className="legend">
            <li><i className="lg lg-done" />Done</li>
            <li><i className="lg lg-next" />Next</li>
            <li><i className="lg lg-later" />Later</li>
          </ul>
        </div>
      </section>

      {next ? <NextCard a={next} now={now} /> : todays.length > 0 && (
        <div className="card done-card"><img src="./img/owl-sleep.webp" width={72} height={72} alt="" /><div><b>That's everyone for today.</b><p className="muted small">Tomorrow: {s.appts.filter((a) => startOfDay(a.start) === today + DAY).length} sessions booked.</p></div></div>
      )}

      <section className="block" aria-label="Needs you">
        <div className="block-head"><h2>Needs you</h2>{deck.length > 0 && <span className="muted small">{deck.length} {deck.length === 1 ? 'thing' : 'things'}</span>}</div>
        <InsightDeck items={deck} views={views} />
      </section>

      {todays.length > 0 && (
        <section className="block" aria-label="Today's timeline">
          <div className="block-head"><h2>Today</h2><button className="link" onClick={() => go('/sessions')}>All sessions</button></div>
          <ol className="timeline">
            {todays.map((a, i) => {
              const p = person.get(a.personId)!
              const st = a.status === 'completed' || a.status === 'no_show' ? 'done' : a === next ? 'next' : 'later'
              return (
                <m.li key={a.id} className={`tl tl-${st}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.05, duration: 0.25 }}>
                  <button onClick={() => sheets.session(a.id)}>
                    <span className="tl-time">{fmtTime(a.start)}</span>
                    <span className="tl-dot" aria-hidden />
                    <span className="tl-main"><b>{p.name}</b><small>{KIND_LABEL[a.kind]}, {a.durationMin} min</small></span>
                    <span className="tl-mode" aria-label={a.mode === 'online' ? 'Online' : 'In person'}>{a.mode === 'online' ? <Video size={16} /> : <MapPin size={16} />}</span>
                  </button>
                </m.li>
              )
            })}
          </ol>
        </section>
      )}

      <section className="block" aria-label="Your week">
        <div className="block-head"><h2>Your week</h2><button className="link" onClick={() => go('/growth')}>Growth</button></div>
        <div className="week card">
          <Ring value={g.thisWeek} goal={WEEK_GOAL} />
          <div className="week-stats">
            <p><b><CountUp to={g.thisWeek} /></b> of {WEEK_GOAL} sessions done this week</p>
            <p className="muted small">{g.thisWeek >= WEEK_GOAL ? 'Weekly goal reached. Remember to rest too.' : g.thisWeek + g.bookedRest >= WEEK_GOAL ? `${g.bookedRest} more booked. You're on track for your goal.` : `${g.bookedRest} more booked, ${WEEK_GOAL - g.thisWeek - g.bookedRest} open spots to your goal.`}</p>
            <p className="reach"><Sparkles size={14} /> <span><b><CountUp to={inCare} /></b> people in your care right now, part of the {(LIFETIME_REACH).toLocaleString('en-IN')}+ lives you've reached</span></p>
          </div>
        </div>
        <KindWords appts={g.kind} />
      </section>

      {todays.length === 0 && <Empty img="owl-read" title="A quiet day" body="No sessions booked today. Follow-ups that are due are a gentle place to start." action={<button className="btn btn-quiet" onClick={() => go('/people?due')}>See follow-ups due</button>} />}
    </div>
  )
}

// ---------------------------------------------------------------- the bloom
function Bloom({ appts, now, onPetal }: { appts: Appt[]; now: number; onPetal: (a: Appt) => void }) {
  const n = Math.max(appts.length, 1)
  const nextIdx = appts.findIndex((a) => a.status === 'in_session' || (a.start > now && a.status === 'confirmed'))
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

// ---------------------------------------------------------------- next session
function NextCard({ a, now }: { a: Appt; now: number }) {
  const { person } = useIndex()
  const { dispatch } = useStore()
  const sheets = useSheets()
  const toast = useToast()
  const p = person.get(a.personId)!
  const live = a.status === 'in_session'
  const soon = a.start - now < 30 * MIN
  return (
    <m.article className={'card next' + (live ? ' is-live' : '')} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: 0.35 }}>
      <p className="next-when">{live ? <><span className="live-dot" />With {p.first} now</> : <>Next session <b>{relative(a.start, now)}</b></>}</p>
      <button className="next-who" onClick={() => go(`/people/${p.id}`)}>
        <Avatar name={p.name} size={56} mood={p.moods.at(-1)?.mood} layoutId={`av-${p.id}`} />
        <span><strong>{p.name}</strong><small>{KIND_LABEL[a.kind]} at {fmtTime(a.start)}</small>
          <span className="pill">{a.mode === 'online' ? <><Video size={13} /> Online</> : <><MapPin size={13} /> In person</>}</span></span>
      </button>
      {a.note && <p className="next-note">“{a.note}”</p>}
      <div className="btn-row">
        <button className="btn btn-quiet" onClick={() => go(`/people/${p.id}`)}><NotebookPen size={16} /> Prepare</button>
        <button className="btn btn-primary" disabled={!soon && !live} onClick={() => { if (!live) { dispatch({ type: 'start', apptId: a.id }); toast(`Session with ${p.first} started`) } else sheets.session(a.id) }}>
          <Play size={16} /> {live ? 'Open session' : soon ? 'Start' : `Start at ${fmtTime(a.start)}`}
        </button>
      </div>
    </m.article>
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
    return <div className="card all-clear"><img src="./img/owl-wave.webp" width={64} height={64} alt="" /><div><b>You're all caught up.</b><p className="muted small">New things will appear here as they happen.</p></div></div>
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
      window.open(waLink(p.phone, `Namaste ${p.first}, your session${v?.next ? ` on ${dayLabel(v.next.start, now)} at ${fmtTime(v.next.start)}` : ''} is held for you. Here's the payment link to confirm it.`), '_blank', 'noopener')
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
        if (Math.abs(info.offset.x) > 110 || Math.abs(info.velocity.x) > 700) { animate(x, info.offset.x > 0 ? 420 : -420, { duration: 0.2 }); onDismiss() }
      }}
      aria-hidden={!top}
    >
      <img className="insight-owl" src={`./img/${TONE_IMG[it.tone]}.webp`} width={72} height={72} alt="" />
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
