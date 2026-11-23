/**
 * @screens CN-13 Client profile — header + actions, then tabs (scrollable, remembered in the URL):
 *          Overview · Remedy (Bach flower) or Notes (Scanning) · Lo Shu · Sessions · About.
 */
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { m } from 'motion/react'
import { Archive, ArchiveRestore, ArrowLeft, CalendarPlus, Leaf, MapPin, NotebookPen, Plus, MessageCircle, MessageSquare, Phone, Sparkles, Star, Video } from 'lucide-react'
import { useIndex, useStore } from '../state/store'
import { Avatar, MoodFace, Empty, go, softSpring, spring, useToast } from '../ui/kit'
import { TypeBadge } from '../ui/bits'
import { LoShuPanel } from '../ui/loshu'
import { BlendJourney, ConcernsCard, JourneyTag, JourneyTimeline, LastSeen, LoShuCard, WellnessSummaryCard } from '../ui/console'
import { useSheets, STATUS_LABEL, typeLabel, waLink } from './Sheets'
import { personView, scanNotes, scanSummary, sinceLastRemedy, type PersonView } from '../lib/derive'
import { ageOn, parseDob } from '../lib/loshu'
import { AdherenceCard } from '../ui/care'
import { dayLabel, fmtLong, fmtShort, fmtTime, fmtWeekday, relative } from '../lib/time'
import { DAY, MIN, startOfDay } from '../data/seed'
import { pron, type Appt, type Person, type RemedyStage } from '../data/types'

const STAGES: RemedyStage[] = ['given', 'preparing', 'dispatched', 'delivered']
const STAGE_LABEL: Record<RemedyStage, string> = { given: 'Given', preparing: 'Preparing', dispatched: 'Dispatched', delivered: 'Delivered' }

type Tab = 'overview' | 'care' | 'loshu' | 'sessions' | 'about'
const TABS: Tab[] = ['overview', 'care', 'loshu', 'sessions', 'about']

export default function Profile({ id, tab: initialTab }: { id: string; tab?: string }) {
  const { now } = useStore()
  const { person, byPerson } = useIndex()
  const sheets = useSheets()
  const p = person.get(id)
  const v = useMemo(() => p && personView(p, byPerson.get(p.id), now), [p, byPerson, now])
  const [tab, setTabState] = useState<Tab>(TABS.includes(initialTab as Tab) ? (initialTab as Tab) : 'overview')
  const barRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({})
  useEffect(() => { tabRefs.current[tab]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }) }, [tab])
  if (!p || !v) return <div className="screen"><Empty img="owl-read" title="Person not found" body="They may have been removed from this device's demo data." action={<a className="btn btn-quiet" href="#/people">Back to people</a>} /></div>

  const setTab = (t: Tab) => {
    setTabState(t)
    history.replaceState(null, '', `#/people/${p.id}${t === 'overview' ? '' : '?' + t}`)
    // keep the tab bar in view when switching from far down the page
    const bar = barRef.current
    if (bar && bar.getBoundingClientRect().top < 0) bar.scrollIntoView({ block: 'start' })
  }
  const onKey = (e: KeyboardEvent) => {
    const i = TABS.indexOf(tab)
    const next = e.key === 'ArrowRight' ? TABS[(i + 1) % TABS.length] : e.key === 'ArrowLeft' ? TABS[(i + TABS.length - 1) % TABS.length] : e.key === 'Home' ? TABS[0] : e.key === 'End' ? TABS.at(-1)! : null
    if (next) { e.preventDefault(); setTab(next); tabRefs.current[next]?.focus() }
  }
  const scanning = v.service === 'scanning'
  const label: Record<Tab, string> = { overview: 'Overview', care: scanning ? 'Notes' : 'Remedy', loshu: 'Lo Shu', sessions: 'Sessions', about: 'About' }
  const count: Partial<Record<Tab, number>> = { sessions: v.sessions.length, care: scanning ? scanNotes(v.sessions, p.notes).length : undefined }

  return (
    <div className="screen profile">
      <header className="topbar">
        <button className="icon-btn" onClick={() => history.length > 1 ? history.back() : (location.hash = '/people')} aria-label="Back"><ArrowLeft size={20} /></button>
      </header>
      <div className="pf-head">
        <Avatar name={p.name} size={88} mood={v.latestMood} layoutId={`av-${p.id}`} />
        <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: 0.08 }}>
          <h1>{p.name}</h1>
          <p className="muted">{p.city}{ageOn(p.dob, now) != null ? `, ${ageOn(p.dob, now)}` : ''}, with you since {fmtLong(p.joinedAt)}</p>
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
        <m.button className="live-banner" onClick={() => go(`/session/${v.next!.id}`)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <span className="live-dot" /><span><b>{v.next.status === 'in_session' ? 'Session in progress' : v.next.status === 'checked_in' ? `${p.first} has ${v.next.mode === 'online' ? 'joined' : 'arrived'}` : `Session ${relative(v.next.start, now)}`}</b><small>{fmtTime(v.next.start)}, {v.next.mode === 'online' ? 'online' : 'in person'}</small></span>
          <span className="lb-cta">{v.next.status === 'in_session' ? 'Open' : 'Start'}</span>
        </m.button>
      )}

      <div className="pf-tabs" ref={barRef}>
        <div className="pf-tablist" role="tablist" aria-label={`${p.first}'s details`} onKeyDown={onKey}>
          {TABS.map((t) => (
            <button key={t} ref={(el) => { tabRefs.current[t] = el }} role="tab" type="button" id={`tab-${t}`} aria-selected={tab === t} aria-controls={`panel-${t}`} tabIndex={tab === t ? 0 : -1}
              className={'pf-tab' + (tab === t ? ' is-on' : '')} onClick={() => setTab(t)}>
              {tab === t && <m.span layoutId="pf-tab-pill" className="pf-tab-pill" transition={spring} />}
              <span className="pf-tab-label">{label[t]}{count[t] ? <small>{count[t]}</small> : null}</span>
            </button>
          ))}
        </div>
      </div>

      <m.div key={tab} role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="pf-panel"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: 'easeOut' }}>
        {tab === 'overview' && <Overview p={p} v={v} now={now} open={setTab} />}
        {tab === 'care' && (scanning ? <ScanNotes sessions={v.sessions} personId={p.id} extra={p.notes} first={p.first} now={now} /> : <RemedyTab p={p} v={v} now={now} />)}
        {tab === 'loshu' && <LoShuPanel p={p} now={now} />}
        {tab === 'sessions' && <SessionsTab v={v} now={now} />}
        {tab === 'about' && <AboutTab p={p} now={now} />}
      </m.div>
    </div>
  )
}

/** Overview = the consultant console: AI wellness summary, then Lo Shu, wellness journey, concerns and blend journey. */
function Overview({ p, v, now, open }: { p: Person; v: PersonView; now: number; open: (t: Tab) => void }) {
  const sheets = useSheets()
  const today = startOfDay(now)
  const week = Array.from({ length: 7 }, (_, i) => today - (6 - i) * DAY).map((d) => ({ d, mood: p.moods.find((x) => x.day === d)?.mood }))
  const doneCount = v.past.filter((a) => a.status === 'completed').length
  return (
    <>
      <div className="pf-stats">
        <div><b>{doneCount}</b><span>{doneCount === 1 ? 'session' : 'sessions'}</span></div>
        <div>{v.avgRating ? <b>{v.avgRating.toFixed(1)}</b> : <b className="dim">None yet</b>}<span>avg rating</span></div>
        <div>{v.next ? <b>{dayLabel(v.next.start, now)}</b> : v.dueOn ? <b>{v.dueOn < now ? 'Due now' : fmtShort(v.dueOn)}</b> : <b className="dim">Not set</b>}<span>{v.next ? 'next session' : 'follow-up'}</span></div>
      </div>
      <WellnessSummaryCard v={v} now={now} />
      <LoShuCard v={v} open={() => open('loshu')} />
      <JourneyTimeline v={v} onOpen={(id) => sheets.session(id)} showAll={() => open('sessions')} />
      <ConcernsCard v={v} />
      <BlendJourney v={v} />
      <section className="card pf-card">
        <h2>{p.first}'s week</h2>
        <div className="mood-week">
          {week.map(({ d, mood }, i) => (
            <div key={d} className="mw-day">
              {mood ? <m.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...softSpring, delay: 0.05 + i * 0.03 }}><MoodFace mood={mood} size={38} /></m.span> : <span className="mw-empty" role="img" aria-label="No entry" />}
              <small>{fmtWeekday(d).slice(0, 2)}</small>
            </div>
          ))}
        </div>
        {p.moods.length === 0 && <p className="muted small">{p.first} hasn't logged feelings yet, or keeps the journal private.</p>}
      </section>
    </>
  )
}

/** Bach flower clients: drops, blend and what troubled them across sessions. */
function RemedyTab({ p, v, now }: { p: Person; v: PersonView; now: number }) {
  const lines = sinceLastRemedy(v, now)
  const her = pron(p).poss
  return (
    <>
      <AdherenceCard p={p} now={now} />
      {v.blend?.remedy ? (
        <section className="card pf-card">
          <h2><Leaf size={16} /> Current blend</h2>
          <div className="chips-wrap">{v.blend.remedy.flowers.map((f) => <span key={f} className="tag tag-sage">{f}</span>)}</div>
          <p className="muted small">Given {fmtLong(v.blend.remedy.givenAt)}. 4 drops, 4 times a day.{v.endsOn ? ` Ends ${fmtShort(v.endsOn)}.` : ''}</p>
          <ol className="stages">
            {STAGES.map((st, i) => {
              const reached = STAGES.indexOf(v.blend!.remedy!.stage) >= i
              return <li key={st} className={reached ? 'on' : ''}><m.span className="stage-dot" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...softSpring, delay: 0.1 + i * 0.06 }} />{STAGE_LABEL[st]}</li>
            })}
          </ol>
        </section>
      ) : <section className="card pf-card"><h2><Leaf size={16} /> Remedy</h2><p className="muted small">No remedy given yet.</p></section>}
      <section className="card pf-card">
        <h2>{v.blend ? `Since ${her} last remedy` : 'Progress'}</h2>
        {lines ? <ul className="three">{lines.map((l) => <li key={l}>{l}</li>)}</ul>
          : <p className="muted small">{v.blend ? 'Not enough check-ins yet to show progress.' : `Progress shows here after ${p.first}'s first remedy.`}</p>}
        <p className="tagline">Auto summary from {her} check-ins. Verify with {p.first}.</p>
      </section>
      <BlendJourney v={v} />
    </>
  )
}

function SessionsTab({ v, now }: { v: PersonView; now: number }) {
  const sheets = useSheets()
  const timeline = [...v.sessions].reverse()
  return (
    <section className="block">
      {timeline.length === 0 && <p className="muted small">No sessions yet.</p>}
      <ul className="rows">
        {timeline.map((a) => (
          <li key={a.id}>
            <button className="row" onClick={() => sheets.session(a.id)}>
              <span className="row-time">{fmtShort(a.start)}<small>{fmtTime(a.start)}</small></span>
              <span className="row-main"><b>{typeLabel(a)}</b><small>{a.start > now ? relative(a.start, now) : STATUS_LABEL[a.status]}{a.remedy ? `, ${a.remedy.flowers.length} flowers` : ''}</small></span>
              <span className="row-end">
                {a.rating ? <span className="mini-rating"><Star size={12} />{a.rating}</span> : null}
                <span className="mode-ic">{a.mode === 'online' ? <Video size={15} /> : <MapPin size={15} />}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function AboutTab({ p, now }: { p: Person; now: number }) {
  const { dispatch } = useStore()
  const toast = useToast()
  const d = parseDob(p.dob)
  const age = ageOn(p.dob, now)
  const rows: [string, string][] = [
    ['Mobile', p.phone],
    ['City', p.city],
    ['Date of birth', d ? `${fmtLong(new Date(d.y, d.m - 1, d.d).getTime())}${age != null ? `, ${age} years` : ''}` : 'Not added yet'],
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

/** Scanning clients: his notes after every session + a summary of all of them (AI in the live app, K6). */
function ScanNotes({ sessions, personId, extra, first, now }: { sessions: Appt[]; personId: string; extra?: { id: string; at: number; text: string }[]; first: string; now: number }) {
  const { dispatch } = useStore()
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const sum = scanSummary(sessions, extra)
  const notes = scanNotes(sessions, extra).reverse()
  const save = () => {
    if (!text.trim()) return
    const at = Date.now()
    dispatch({ type: 'addNote', personId, id: `note-${at}`, at, text })
    setText(''); setAdding(false)
    toast('Note saved')
  }
  return (
    <>
      <section className="card pf-card scan-sum">
        <h2><Sparkles size={16} /> Summary of all notes</h2>
        {sum ? (
          <ul className="three">
            <li>{sum.count} scanning {sum.count === 1 ? 'session' : 'sessions'}{sum.notes > sum.count ? ` and ${sum.notes - sum.count} added ${sum.notes - sum.count === 1 ? 'note' : 'notes'}` : ''} since {fmtLong(sum.since)}.</li>
            {sum.themes.length > 0 && <li>Comes up most: {sum.themes.map(([t, n]) => `${t.toLowerCase()} (${n})`).join(', ')}.</li>}
            <li>Last note ({fmtShort(sum.last.start)}): {sum.lastLine}</li>
            {sum.advice && <li>To follow up: {sum.advice}</li>}
          </ul>
        ) : <p className="muted small">Add a note after each scanning session and the summary appears here.</p>}
        <p className="tagline">Auto summary of your notes. Only you can see them.</p>
      </section>
      <section className="card pf-card">
        <div className="notes-head">
          <h2><NotebookPen size={16} /> Notes after each scanning</h2>
          {!adding && <button type="button" className="cal-btn" onClick={() => setAdding(true)}><Plus size={15} /> Add a note</button>}
        </div>
        {adding && (
          <form className="note-add" onSubmit={(e) => { e.preventDefault(); save() }}>
            <label className="sr-only" htmlFor="note-add">New note for {first}</label>
            <textarea id="note-add" className="notes" rows={3} autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={`What you felt in ${first}'s scanning today, what you suggested…`} onKeyDown={(e) => { if (e.key === 'Escape') { setAdding(false); setText('') } }} />
            <div className="note-add-actions">
              <button type="button" className="btn btn-quiet" onClick={() => { setAdding(false); setText('') }}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={!text.trim()}>Save note</button>
            </div>
          </form>
        )}
        {notes.length === 0 && !adding && <p className="muted small">No notes yet for {first}.</p>}
        <ol className="note-tl">
          {notes.map((n) => (
            <li key={n.id}><span className="nt-date">{fmtShort(n.start)}<small>{relative(n.start, now)}</small></span><p>{n.text}</p></li>
          ))}
        </ol>
      </section>
    </>
  )
}
