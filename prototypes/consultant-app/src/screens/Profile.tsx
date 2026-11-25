/**
 * @screens CN-13 Person + CN-09 Appointment (owner 2026-11-25): one screen, two ways in.
 *   /people/:id      → person header + actions, then sliding tabs
 *   /appt/:apptId    → the appointment card, then the same sliding tabs
 * Tabs (swipe left / right, or tap; remembered in the URL): Overview · Lo Shu · Moods · Notes · Remedy · Sessions · About.
 * Every tab opens with a short summary.
 */
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { m, useDragControls, type PanInfo } from 'motion/react'
import { Archive, ArchiveRestore, ArrowLeft, CalendarPlus, MessageCircle, MessageSquare, Phone } from 'lucide-react'
import { useIndex, useStore } from '../state/store'
import { Avatar, MoodFace, Empty, go, softSpring, spring, useToast } from '../ui/kit'
import { TypeBadge } from '../ui/bits'
import { LoShuPanel } from '../ui/loshu'
import { ConcernsCard, JourneyTag, JourneyTimeline, LastSeen, WellnessSummaryCard } from '../ui/console'
import { ApptCard } from '../ui/apptcard'
import { AtAGlance, LoShuReading, MoodsTab, NotesTab, RemedyTab, SessionsList, TabSummary } from '../ui/persontabs'
import { useSheets, waLink } from './Sheets'
import { personView, type PersonView } from '../lib/derive'
import { ageOn, parseDob } from '../lib/loshu'
import type { PersonTab } from '../lib/summaries'
import { dayLabel, fmtLong, fmtShort, fmtWeekday, relative } from '../lib/time'
import { DAY, MIN, startOfDay } from '../data/seed'
import type { Person } from '../data/types'

const TABS: PersonTab[] = ['overview', 'loshu', 'moods', 'notes', 'remedy', 'sessions', 'about']
const LABEL: Record<PersonTab, string> = { overview: 'Overview', loshu: 'Lo Shu', moods: 'Moods', notes: 'Notes', remedy: 'Remedy', sessions: 'Sessions', about: 'About' }
/** old links (?care) still land somewhere sensible */
const ALIAS: Record<string, PersonTab> = { care: 'remedy' }

export default function Profile({ id, apptId, tab: initialTab }: { id?: string; apptId?: string; tab?: string }) {
  const { s, now } = useStore()
  const { person, byPerson } = useIndex()
  const sheets = useSheets()
  const appt = apptId ? s.appts.find((a) => a.id === apptId) : undefined
  const pid = id ?? appt?.personId
  const p = pid ? person.get(pid) : undefined
  const v = useMemo(() => p && personView(p, byPerson.get(p.id), now), [p, byPerson, now])
  const start = (ALIAS[initialTab ?? ''] ?? initialTab) as PersonTab
  const [tab, setTabState] = useState<PersonTab>(TABS.includes(start) ? start : 'overview')
  const [dir, setDir] = useState(0)
  const barRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Partial<Record<PersonTab, HTMLButtonElement | null>>>({})
  const drag = useDragControls()
  useEffect(() => { tabRefs.current[tab]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }) }, [tab])
  if (!p || !v) return <div className="screen"><Empty img="owl-read" title={apptId ? 'Appointment not found' : 'Person not found'} body="It may have been removed from this device's demo data." action={<a className="btn btn-quiet" href="#/people">Back to people</a>} /></div>

  const base = apptId ? `#/appt/${apptId}` : `#/people/${p.id}`
  const setTab = (t: PersonTab) => {
    if (t === tab) return
    setDir(TABS.indexOf(t) > TABS.indexOf(tab) ? 1 : -1)
    setTabState(t)
    history.replaceState(null, '', `${base}${t === 'overview' ? '' : '?' + t}`)
    const bar = barRef.current
    if (bar && bar.getBoundingClientRect().top < 0) bar.scrollIntoView({ block: 'start' })
  }
  const step = (d: 1 | -1) => { const i = TABS.indexOf(tab) + d; if (i >= 0 && i < TABS.length) setTab(TABS[i]) }
  const onKey = (e: KeyboardEvent) => {
    const i = TABS.indexOf(tab)
    const next = e.key === 'ArrowRight' ? TABS[(i + 1) % TABS.length] : e.key === 'ArrowLeft' ? TABS[(i + TABS.length - 1) % TABS.length] : e.key === 'Home' ? TABS[0] : e.key === 'End' ? TABS.at(-1)! : null
    if (next) { e.preventDefault(); setTab(next); tabRefs.current[next]?.focus() }
  }
  // swipe between tabs; never steals a drag that starts in a field, a button row that scrolls, or selected text
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') return
    if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable], .no-swipe')) return
    drag.start(e)
  }
  const onDragEnd = (_: unknown, info: PanInfo) => {
    const dx = info.offset.x, vx = info.velocity.x
    if (Math.abs(dx) < Math.abs(info.offset.y)) return
    if (dx < -70 || vx < -500) step(1)
    else if (dx > 70 || vx > 500) step(-1)
  }

  // where a new remedy goes: this appointment (once it has started) / a session that just ended / between sessions
  const remedyTarget = (): { apptId?: string; label: string } => {
    if (appt && !appt.remedy && (appt.status === 'in_session' || appt.status === 'completed' || appt.status === 'checked_in')) return { apptId: appt.id, label: 'Create the remedy for this session' }
    const recent = v.past.filter((a) => a.status === 'completed' && !a.remedy && a.service === 'bach' && now - a.start < 2 * DAY).at(-1)
    if (!appt && recent) return { apptId: recent.id, label: `Create the remedy for ${dayLabel(recent.start, now).toLowerCase()}'s session` }
    return { label: v.blend ? 'Create a new remedy' : 'Create the first remedy' }
  }
  const target = remedyTarget()
  const createRemedy = () => sheets.newRemedy(p.id, target.apptId)

  return (
    <div className={'screen profile' + (apptId ? ' is-appt' : '')}>
      <header className="topbar">
        <button className="icon-btn" onClick={() => history.length > 1 ? history.back() : (location.hash = apptId ? '/' : '/people')} aria-label="Back"><ArrowLeft size={20} /></button>
        {apptId && <span className="topbar-title">Appointment</span>}
      </header>

      {appt ? <ApptCard a={appt} v={v} api={sheets} onRemedy={createRemedy} /> : <PersonHead p={p} v={v} now={now} />}

      <div className="pf-tabs" ref={barRef}>
        <div className="pf-tablist" role="tablist" aria-label={`${p.first}'s details`} onKeyDown={onKey}>
          {TABS.map((t) => (
            <button key={t} ref={(el) => { tabRefs.current[t] = el }} role="tab" type="button" id={`tab-${t}`} aria-selected={tab === t} aria-controls={`panel-${t}`} tabIndex={tab === t ? 0 : -1}
              className={'pf-tab' + (tab === t ? ' is-on' : '')} onClick={() => setTab(t)}>
              {tab === t && <m.span layoutId="pf-tab-pill" className="pf-tab-pill" transition={spring} />}
              <span className="pf-tab-label">{LABEL[t]}{t === 'sessions' && v.sessions.length ? <small>{v.sessions.length}</small> : null}</span>
            </button>
          ))}
        </div>
        <div className="pf-dots" aria-hidden>{TABS.map((t) => <i key={t} className={t === tab ? 'on' : ''} />)}</div>
      </div>

      <m.div key={tab} role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="pf-panel"
        drag="x" dragControls={drag} dragListener={false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.22} dragDirectionLock dragSnapToOrigin onDragEnd={onDragEnd} onPointerDown={onPointerDown}
        initial={{ opacity: 0, x: dir * 36 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 38 }}>
        {tab === 'overview' && <Overview v={v} now={now} open={setTab} onOpen={(aid) => go(`/appt/${aid}`)} />}
        {tab === 'loshu' && <><TabSummary tab="loshu" v={v} now={now} /><LoShuPanel p={p} now={now} after={<LoShuReading v={v} now={now} />} /></>}
        {tab === 'moods' && <><TabSummary tab="moods" v={v} now={now} /><MoodsTab v={v} now={now} /></>}
        {tab === 'notes' && <><TabSummary tab="notes" v={v} now={now} title="Summary of all notes" /><NotesTab v={v} /></>}
        {tab === 'remedy' && <><TabSummary tab="remedy" v={v} now={now} /><RemedyTab v={v} now={now} onCreate={createRemedy} createLabel={target.label} /></>}
        {tab === 'sessions' && <><TabSummary tab="sessions" v={v} now={now} /><SessionsList v={v} now={now} onOpen={(aid) => go(`/appt/${aid}`)} /></>}
        {tab === 'about' && <><TabSummary tab="about" v={v} now={now} /><AboutTab p={p} now={now} /></>}
      </m.div>
      <p className="swipe-hint" aria-hidden>Swipe left or right for more</p>
    </div>
  )
}

function PersonHead({ p, v, now }: { p: Person; v: PersonView; now: number }) {
  const sheets = useSheets()
  const age = ageOn(p.dob, now)
  return (
    <>
      <div className="pf-head">
        <Avatar name={p.name} size={88} mood={v.latestMood} layoutId={`av-${p.id}`} />
        <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: 0.08 }}>
          <h1>{p.name}</h1>
          <p className="muted">{p.city}{age != null ? `, ${age}` : ''}, with you since {fmtLong(p.joinedAt)}</p>
          <span className="pf-badges"><TypeBadge service={v.service} /><JourneyTag v={v} now={now} />{p.archived && <span className="tag">Archived</span>}</span>
          <LastSeen v={v} now={now} />
        </m.div>
      </div>
      <div className="pf-actions">
        <button className="btn btn-quiet" onClick={() => go(`/messages/${p.id}`)}><MessageSquare size={16} /> Message</button>
        <a className="btn btn-quiet" href={`tel:${p.phone.replace(/\s/g, '')}`} aria-label={`Call ${p.first}`}><Phone size={16} /><span className="hide-xs">Call</span></a>
        <a className="btn btn-quiet" href={waLink(p.phone, `Namaste ${p.first}, this is Jitu Bhaiya from BeWise. `)} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle size={16} /><span className="hide-sm">WhatsApp</span></a>
        <button className="btn btn-primary" onClick={() => sheets.newAppt({ personId: p.id, service: v.service })}><CalendarPlus size={16} /> Book</button>
      </div>
      {v.next && v.next.start - now < 60 * MIN && (
        <m.button className="live-banner" onClick={() => go(`/appt/${v.next!.id}`)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <span className="live-dot" /><span><b>{v.next.status === 'in_session' ? 'Session in progress' : v.next.status === 'checked_in' ? `${p.first} has ${v.next.mode === 'online' ? 'joined' : 'arrived'}` : `Session ${relative(v.next.start, now)}`}</b><small>Open the appointment</small></span>
          <span className="lb-cta">Open</span>
        </m.button>
      )}
    </>
  )
}

/** Overview: the summary, everything at a glance (each tile opens its tab), the journey and concerns. */
function Overview({ v, now, open, onOpen }: { v: PersonView; now: number; open: (t: PersonTab) => void; onOpen: (id: string) => void }) {
  const p = v.p
  const today = startOfDay(now)
  const doneCount = v.past.filter((a) => a.status === 'completed').length
  return (
    <>
      <WellnessSummaryCard v={v} now={now} />
      <div className="pf-stats">
        <div><b>{doneCount}</b><span>{doneCount === 1 ? 'session' : 'sessions'}</span></div>
        <div>{v.avgRating ? <b>{v.avgRating.toFixed(1)}</b> : <b className="dim">None yet</b>}<span>avg rating</span></div>
        <div>{v.next ? <b>{dayLabel(v.next.start, now)}</b> : v.dueOn ? <b>{v.dueOn < now ? 'Due now' : fmtShort(v.dueOn)}</b> : <b className="dim">Not set</b>}<span>{v.next ? 'next session' : 'follow-up'}</span></div>
      </div>
      <AtAGlance v={v} now={now} open={open} />
      <JourneyTimeline v={v} onOpen={onOpen} showAll={() => open('sessions')} />
      <ConcernsCard v={v} />
      {p.moods.length > 0 && (
        <section className="card pf-card">
          <h2>{p.first}'s week</h2>
          <div className="mood-week">
            {Array.from({ length: 7 }, (_, i) => today - (6 - i) * DAY).map((d) => {
              const mood = p.moods.find((x) => x.day === d)?.mood
              return <div key={d} className="mw-day">{mood ? <MoodFace mood={mood} size={38} /> : <span className="mw-empty" role="img" aria-label="No entry" />}<small>{fmtWeekday(d).slice(0, 2)}</small></div>
            })}
          </div>
        </section>
      )}
    </>
  )
}

function AboutTab({ p, now }: { p: Person; now: number }) {
  const { dispatch } = useStore()
  const toast = useToast()
  const d = parseDob(p.dob)
  const age = ageOn(p.dob, now)
  const app = p.app
  const rows: [string, string][] = [
    ['Mobile', p.phone],
    ['City', p.city],
    ['Date of birth', d ? `${fmtLong(new Date(d.y, d.m - 1, d.d).getTime())}${age != null ? `, ${age} years` : ''}` : 'Not added yet'],
    ['BeWise app', !app?.installed ? 'Not installed' : app.lastOpen ? `Last opened ${relative(app.lastOpen, now)}` : 'Installed'],
    ['Refer to as', p.pronoun === 'she' ? 'She / her' : p.pronoun === 'he' ? 'He / him' : 'They / them'],
    ['With you since', fmtLong(p.joinedAt)],
  ]
  return (
    <>
      <section className="card pf-card">
        <dl className="about-list">{rows.map(([k, val]) => <div key={k}><dt>{k}</dt><dd>{val}</dd></div>)}</dl>
      </section>
      <div className="pf-archive">
        <button className="btn btn-quiet btn-block" onClick={() => { dispatch({ type: 'archive', personId: p.id, on: !p.archived }); toast(p.archived ? `${p.first} is back on the mood board` : `${p.first} archived. Find them under People, Archived.`) }}>
          {p.archived ? <><ArchiveRestore size={16} /> Bring back to the mood board</> : <><Archive size={16} /> Archive {p.first}</>}
        </button>
        <p className="muted small">Archiving hides {p.first} from the mood board and remedy lists. Nothing is deleted.</p>
      </div>
    </>
  )
}

