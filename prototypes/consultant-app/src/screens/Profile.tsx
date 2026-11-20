/**
 * @screens CN-13 Client profile — Bach flower: progress, feelings week, troubling over time, blend, drops. Scanning: notes history + summary. Archive.
 */
import { useMemo } from 'react'
import { m } from 'motion/react'
import { Archive, ArchiveRestore, ArrowLeft, CalendarPlus, Leaf, Lock, MapPin, MessageCircle, MessageSquare, Phone, Sparkles, Star, Video } from 'lucide-react'
import { useIndex, useStore } from '../state/store'
import { Avatar, MoodFace, Empty, go, softSpring, useToast } from '../ui/kit'
import { TypeBadge } from '../ui/bits'
import { useSheets, STATUS_LABEL, typeLabel, waLink } from './Sheets'
import { personView, scanSummary, sinceLastRemedy } from '../lib/derive'
import { AdherenceCard } from '../ui/care'
import { dayLabel, fmtLong, fmtShort, fmtTime, fmtWeekday, relative } from '../lib/time'
import { DAY, MIN, startOfDay } from '../data/seed'
import { pron, type Appt, type RemedyStage } from '../data/types'

const STAGES: RemedyStage[] = ['given', 'preparing', 'dispatched', 'delivered']
const STAGE_LABEL: Record<RemedyStage, string> = { given: 'Given', preparing: 'Preparing', dispatched: 'Dispatched', delivered: 'Delivered' }

export default function Profile({ id }: { id: string }) {
  const { dispatch, now } = useStore()
  const { person, byPerson } = useIndex()
  const toast = useToast()
  const sheets = useSheets()
  const p = person.get(id)
  const v = useMemo(() => p && personView(p, byPerson.get(p.id), now), [p, byPerson, now])
  if (!p || !v) return <div className="screen"><Empty img="owl-read" title="Person not found" body="They may have been removed from this device's demo data." action={<a className="btn btn-quiet" href="#/people">Back to people</a>} /></div>

  const lines = sinceLastRemedy(v, now)
  const today = startOfDay(now)
  const week = Array.from({ length: 7 }, (_, i) => today - (6 - i) * DAY).map((d) => ({ d, mood: p.moods.find((x) => x.day === d)?.mood }))
  const troublingHistory = v.past.filter((a) => a.troubling).slice(-5)
  const allConcerns = [...new Set(troublingHistory.flatMap((a) => a.troubling!))]
  const timeline = [...v.sessions].reverse()
  const her = pron(p).poss
  const them = pron(p).obj
  const doneCount = v.past.filter((a) => a.status === 'completed').length

  return (
    <div className="screen profile">
      <header className="topbar">
        <button className="icon-btn" onClick={() => history.length > 1 ? history.back() : (location.hash = '/people')} aria-label="Back"><ArrowLeft size={20} /></button>
      </header>
      <div className="pf-head">
        <Avatar name={p.name} size={88} mood={v.latestMood} layoutId={`av-${p.id}`} />
        <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: 0.08 }}>
          <h1>{p.name}</h1>
          <p className="muted">{p.city}, with you since {fmtLong(p.joinedAt)}</p>
          <span className="pf-badges"><TypeBadge service={v.service} />{p.archived && <span className="tag">Archived</span>}</span>
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
      <div className="pf-stats">
        <div><b>{doneCount}</b><span>{doneCount === 1 ? 'session' : 'sessions'}</span></div>
        <div>{v.avgRating ? <b>{v.avgRating.toFixed(1)}</b> : <b className="dim">None yet</b>}<span>avg rating</span></div>
        <div>{v.next ? <b>{dayLabel(v.next.start, now)}</b> : v.dueOn ? <b>{v.dueOn < now ? 'Due now' : fmtShort(v.dueOn)}</b> : <b className="dim">Not set</b>}<span>{v.next ? 'next session' : 'follow-up'}</span></div>
      </div>

      {v.service === 'scanning' && <ScanNotes sessions={v.sessions} first={p.first} now={now} />}

      {v.service === 'bach' && <>
      <section className="card pf-card">
        <h2>{v.blend ? `Since ${her} last remedy` : 'Progress'}</h2>
        {lines ? <ul className="three">{lines.map((l, i) => <m.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.07 }}>{l}</m.li>)}</ul>
          : <p className="muted small">{v.blend ? 'Not enough check-ins yet to show progress.' : `Progress shows here after ${p.first}'s first remedy.`}</p>}
        <p className="tagline">Auto summary from {her} check-ins. Verify with {p.first}.</p>
      </section>

      <AdherenceCard p={p} now={now} />
      </>}

      <section className="card pf-card">
        <h2>{p.first}'s week</h2>
        <div className="mood-week">
          {week.map(({ d, mood }, i) => (
            <div key={d} className="mw-day">
              {mood ? <m.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...softSpring, delay: 0.1 + i * 0.04 }}><MoodFace mood={mood} size={38} /></m.span> : <span className="mw-empty" role="img" aria-label="No entry" />}
              <small>{fmtWeekday(d).slice(0, 2)}</small>
            </div>
          ))}
        </div>
        {p.moods.length === 0 && <p className="muted small">{p.first} hasn't logged feelings yet, or keeps the journal private.</p>}
      </section>

      {allConcerns.length > 0 && (
        <section className="card pf-card">
          <h2>What troubled {them} across sessions</h2>
          <div className="concern-grid" style={{ gridTemplateColumns: `minmax(92px, 1fr) repeat(${troublingHistory.length}, minmax(0, 46px))` }}>
            <span />
            {troublingHistory.map((a) => <small key={a.id} className="cg-h">{fmtShort(a.start)}</small>)}
            {allConcerns.map((c) => (
              <div key={c} className="cg-row" style={{ display: 'contents' }}>
                <span className="cg-name">{c}</span>
                {troublingHistory.map((a) => <span key={a.id} role="img" className={'cg-cell' + (a.troubling!.includes(c) ? ' on' : '')} aria-label={a.troubling!.includes(c) ? `${c} on ${fmtShort(a.start)}` : `No ${c.toLowerCase()} on ${fmtShort(a.start)}`} />)}
              </div>
            ))}
          </div>
        </section>
      )}

      {v.blend?.remedy && (
        <section className="card pf-card">
          <h2><Leaf size={16} /> Current blend</h2>
          <div className="chips-wrap">{v.blend.remedy.flowers.map((f) => <span key={f} className="tag tag-sage">{f}</span>)}</div>
          <p className="muted small">Given {fmtLong(v.blend.remedy.givenAt)}. 4 drops, 4 times a day.</p>
          <ol className="stages">
            {STAGES.map((st, i) => {
              const reached = STAGES.indexOf(v.blend!.remedy!.stage) >= i
              return <li key={st} className={reached ? 'on' : ''}><m.span className="stage-dot" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...softSpring, delay: 0.2 + i * 0.08 }} />{STAGE_LABEL[st]}</li>
            })}
          </ol>
        </section>
      )}

      <section className="block">
        <div className="block-head"><h2>All sessions</h2><span className="muted small">{timeline.length}</span></div>
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
      <div className="pf-archive">
        <button className="btn btn-quiet btn-block" onClick={() => { dispatch({ type: 'archive', personId: p.id, on: !p.archived }); toast(p.archived ? `${p.first} is back on the mood board` : `${p.first} archived. Find them under People, Archived.`) }}>
          {p.archived ? <><ArchiveRestore size={16} /> Bring back to the mood board</> : <><Archive size={16} /> Archive {p.first}</>}
        </button>
        <p className="muted small">Archiving hides {p.first} from the mood board and remedy lists. Nothing is deleted.</p>
      </div>
    </div>
  )
}

/** Scanning clients: his notes after every session + a summary of all of them (AI in the live app, K6). */
function ScanNotes({ sessions, first, now }: { sessions: Appt[]; first: string; now: number }) {
  const sum = scanSummary(sessions)
  const notes = sessions.filter((a) => a.service === 'scanning' && a.status === 'completed' && a.privateNote).reverse()
  return (
    <>
      <section className="card pf-card scan-sum">
        <h2><Sparkles size={16} /> Summary of all notes</h2>
        {sum ? (
          <ul className="three">
            <li>{sum.count} scanning {sum.count === 1 ? 'session' : 'sessions'} since {fmtLong(sum.since)}.</li>
            {sum.themes.length > 0 && <li>Comes up most: {sum.themes.map(([t, n]) => `${t.toLowerCase()} (${n})`).join(', ')}.</li>}
            <li>Last time ({fmtShort(sum.last.start)}): {sum.lastLine}</li>
            {sum.advice && <li>To follow up: {sum.advice}</li>}
          </ul>
        ) : <p className="muted small">After the first scanning session, add notes and the summary appears here.</p>}
        <p className="tagline">Auto summary of your notes. Only you can see them.</p>
      </section>
      <section className="card pf-card">
        <h2><Lock size={16} /> Notes after each scanning</h2>
        {notes.length === 0 && <p className="muted small">No notes yet for {first}.</p>}
        <ol className="note-tl">
          {notes.map((a) => (
            <li key={a.id}><span className="nt-date">{fmtShort(a.start)}<small>{relative(a.start, now)}</small></span><p>{a.privateNote}</p></li>
          ))}
        </ol>
      </section>
    </>
  )
}
