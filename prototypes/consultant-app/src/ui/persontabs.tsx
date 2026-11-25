/**
 * @module   prototype/consultant-app/ui/persontabs
 * @owner    CONSULTANT
 * Purpose:  Tab bodies for a person / appointment (owner 2026-11-25): a summary on every tab, the overview "at a glance",
 *           mood board, his notes (add more), remedies (create new, all past), Lo Shu general reading.
 */
import { useState } from 'react'
import { m } from 'motion/react'
import { ArrowRight, Droplet, NotebookPen, Plus, Sparkles, Star, MapPin, Video, Sun, Target, Compass } from 'lucide-react'
import { useStore } from '../state/store'
import { MoodFace, softSpring, useToast } from './kit'
import { LoShuGrid } from './loshu'
import { AdherenceCard } from './care'
import { blendJourney } from '../lib/journey'
import { moodStats, notesOf, tabSummary, MOOD_LABEL, type PersonTab } from '../lib/summaries'
import { generalReading, loShu } from '../lib/loshu'
import { flowerImg } from '../lib/canvasArt'
import type { PersonView } from '../lib/derive'
import { STATUS_LABEL, typeLabel } from '../lib/labels'
import { fmtLong, fmtShort, fmtTime, fmtWeekday, relative } from '../lib/time'
import { DAY } from '../data/seed'
import type { RemedyStage } from '../data/types'

/** The summary strip at the top of every tab. */
export function TabSummary({ tab, v, now, title }: { tab: PersonTab; v: PersonView; now: number; title?: string }) {
  const lines = tabSummary(tab, v, now)
  return (
    <section className="tab-sum" aria-label="Summary">
      <span className="tab-sum-ic" aria-hidden><Sparkles size={16} /></span>
      <div>
        <b>{title ?? 'Summary'}</b>
        {lines.map((l) => <p key={l}>{l}</p>)}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- overview: everything at a glance, each tile opens its tab
export function AtAGlance({ v, now, open }: { v: PersonView; now: number; open: (t: PersonTab) => void }) {
  const ls = loShu(v.p.dob)
  const ms = moodStats(v, now, 7)
  const notes = notesOf(v)
  const lastNote = notes.at(-1)
  const b = v.blend?.remedy
  return (
    <div className="glance">
      <button type="button" className="gl-tile" onClick={() => open('loshu')}>
        <span className="gl-head"><b>Lo Shu</b><ArrowRight size={15} aria-hidden /></span>
        {ls ? <span className="gl-loshu"><LoShuGrid ls={ls} small /><small>Driver {ls.driver} · Conductor {ls.conductor}</small></span> : <small className="muted">No date of birth yet</small>}
      </button>
      <button type="button" className="gl-tile" onClick={() => open('moods')}>
        <span className="gl-head"><b>Moods</b><ArrowRight size={15} aria-hidden /></span>
        <span className="gl-faces">{ms.days.map((d) => d.mood ? <MoodFace key={d.day} mood={d.mood} size={24} /> : <i key={d.day} className="gl-empty" aria-hidden />)}</span>
        <small>{ms.logged ? `${ms.settled} of ${ms.logged} settled this week` : 'Nothing logged this week'}</small>
      </button>
      <button type="button" className="gl-tile" onClick={() => open('notes')}>
        <span className="gl-head"><b>Notes</b><ArrowRight size={15} aria-hidden /></span>
        {lastNote ? <><small className="gl-note">{lastNote.text}</small><small className="muted">{fmtShort(lastNote.start)}, {notes.length} {notes.length === 1 ? 'note' : 'notes'}</small></> : <small className="muted">No notes yet. Add one.</small>}
      </button>
      <button type="button" className="gl-tile" onClick={() => open('remedy')}>
        <span className="gl-head"><b>Remedy</b><ArrowRight size={15} aria-hidden /></span>
        {b ? <>
          <span className="gl-flowers">{b.flowers.slice(0, 4).map((f) => <img key={f} src={flowerImg(f)} alt="" width={30} height={30} loading="lazy" />)}</span>
          <small>{b.flowers.length} flowers{v.daysLeft !== undefined ? (v.daysLeft >= 0 ? `, ${v.daysLeft} days left` : ', finished') : ''}</small>
        </> : <small className="muted">No remedy yet</small>}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------- Lo Shu: general reading
export function LoShuReading({ v, now }: { v: PersonView; now: number }) {
  const g = generalReading(v.p.dob, now)
  if (!g) return null
  const year = new Date(now).getFullYear()
  return (
    <section className="card pf-card ls-reading">
      <h2>General reading</h2>
      <ul className="lr-list">
        <li><span className="lr-ic" aria-hidden><Compass size={16} /></span><span><b>Day to day</b><small>{g.driver}</small></span></li>
        <li><span className="lr-ic" aria-hidden><Target size={16} /></span><span><b>Life path</b><small>{g.conductor}</small></span></li>
        <li className="lr-year"><span className="lr-ic" aria-hidden><Sun size={16} /></span><span><b>{year}: personal year {g.year}, {g.yearTheme.word.toLowerCase()}</b><small>{g.yearTheme.line}</small></span></li>
      </ul>
      {(g.strengths.length > 0 || g.work.length > 0) && (
        <div className="lr-two">
          {g.strengths.length > 0 && <div><small>Strengths</small><p>{g.strengths.join(', ')}</p></div>}
          {g.work.length > 0 && <div><small>Room to grow</small><p>{g.work.join(', ')}</p></div>}
        </div>
      )}
      <p className="tagline">General tendencies from numerology, to open a conversation. Not a forecast; your own reading comes first.</p>
    </section>
  )
}

// ---------------------------------------------------------------- moods: the person's own mood board
export function MoodsTab({ v, now }: { v: PersonView; now: number }) {
  const ms = moodStats(v, now, 28)
  const ck = v.p.checkin && now - v.p.checkin.at < 21 * DAY ? v.p.checkin : undefined
  const max = Math.max(1, ...ms.counts.map(([, n]) => n))
  if (!ms.logged && !ck) return (
    <section className="card pf-card m-empty">
      <MoodFace mood="calm" size={56} />
      <h2>No feelings logged yet</h2>
      <p className="muted small">When {v.p.first} logs feelings in the BeWise app, the last 4 weeks show here as a mood board.</p>
    </section>
  )
  return (
    <>
      <section className="card pf-card">
        <h2>Last 4 weeks</h2>
        <div className="mcal" role="grid" aria-label="Feelings, last 4 weeks">
          {ms.days.slice(0, 7).map((d) => <small key={'h' + d.day} className="mcal-h" aria-hidden>{fmtWeekday(d.day).slice(0, 2)}</small>)}
          {ms.days.map((d, i) => (
            <m.span key={d.day} role="gridcell" className={'mcal-d' + (d.mood ? '' : ' empty')} aria-label={`${fmtShort(d.day)}: ${d.mood ? MOOD_LABEL[d.mood] : 'no entry'}`}
              initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...softSpring, delay: 0.01 * i }}>
              {d.mood ? <MoodFace mood={d.mood} size={34} /> : <i />}
              <small>{new Date(d.day).getDate()}</small>
            </m.span>
          ))}
        </div>
      </section>
      {ms.counts.length > 0 && (
        <section className="card pf-card">
          <h2>How often</h2>
          <ul className="mbars">
            {ms.counts.map(([mood, n], i) => (
              <li key={mood}>
                <MoodFace mood={mood} size={28} />
                <span className="mb-label">{MOOD_LABEL[mood]}</span>
                <span className="mb-track"><m.i initial={{ width: 0 }} animate={{ width: `${(n / max) * 100}%` }} transition={{ duration: 0.5, delay: 0.05 * i }} className={['calm', 'joyful', 'grateful', 'hopeful'].includes(mood) ? 'ok' : 'heavy'} /></span>
                <b>{n}</b>
              </li>
            ))}
          </ul>
        </section>
      )}
      {ck && (
        <section className="card pf-card">
          <h2>Check-in, {relative(ck.at, now)}</h2>
          <div className="ck-cols">
            <div><small className="ck-better">Better</small>{ck.better.length ? ck.better.map((x) => <span key={x} className="tag tag-sage">{x}</span>) : <span className="muted small">Nothing yet</span>}</div>
            <div><small>The same</small>{ck.same.length ? ck.same.map((x) => <span key={x} className="tag">{x}</span>) : <span className="muted small">None</span>}</div>
            <div><small className="ck-harder">Harder</small>{ck.harder.length ? ck.harder.map((x) => <span key={x} className="tag tag-rose">{x}</span>) : <span className="muted small">None</span>}</div>
          </div>
        </section>
      )}
    </>
  )
}

// ---------------------------------------------------------------- notes: everything he wrote, add more
export function NotesTab({ v }: { v: PersonView }) {
  const { dispatch } = useStore()
  const toast = useToast()
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const notes = [...notesOf(v)].reverse()
  const first = v.p.first
  const save = () => {
    if (!text.trim()) return
    const at = Date.now()
    dispatch({ type: 'addNote', personId: v.p.id, id: `note-${at}`, at, text })
    setText(''); setOpen(false)
    toast('Note saved')
  }
  return (
    <section className="card pf-card">
      <div className="notes-head">
        <h2><NotebookPen size={16} /> Your notes</h2>
        {!open && <button type="button" className="cal-btn" onClick={() => setOpen(true)}><Plus size={15} /> Add a note</button>}
      </div>
      {open && (
        <form className="note-add" onSubmit={(e) => { e.preventDefault(); save() }}>
          <label className="sr-only" htmlFor="note-add">New note for {first}</label>
          <textarea id="note-add" className="notes" rows={3} autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={`What you noticed about ${first}, what you suggested…`} onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); setText('') } }} />
          <div className="note-add-actions">
            <button type="button" className="btn btn-quiet" onClick={() => { setOpen(false); setText('') }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!text.trim()}>Save note</button>
          </div>
        </form>
      )}
      {notes.length === 0 && !open && <p className="muted small">No notes yet for {first}. Only you can see them.</p>}
      <ol className="note-tl">
        {notes.map((n) => (
          <li key={n.id}><span className="nt-date">{fmtShort(n.start)}<small>{n.extra ? 'added' : 'after session'}</small></span><p>{n.text}</p></li>
        ))}
      </ol>
      <p className="tagline">Only you can see these notes.</p>
    </section>
  )
}

// ---------------------------------------------------------------- remedy: create a new one, see every past one
const STAGES: RemedyStage[] = ['given', 'preparing', 'dispatched', 'delivered']
const STAGE_LABEL: Record<RemedyStage, string> = { given: 'Given', preparing: 'Preparing', dispatched: 'Dispatched', delivered: 'Delivered' }

export function RemedyTab({ v, now, onCreate, createLabel }: { v: PersonView; now: number; onCreate: () => void; createLabel: string }) {
  const steps = blendJourney(v).reverse()
  const cur = v.blend?.remedy
  return (
    <>
      <button type="button" className="btn btn-primary btn-block rm-create" onClick={onCreate}><Droplet size={16} /> {createLabel}</button>
      {cur && (
        <section className="card pf-card rm-current">
          <div className="block-head"><h2>Current blend</h2><span className="tag tag-sage">{v.daysLeft !== undefined && v.daysLeft >= 0 ? `${v.daysLeft} days left` : 'Finished'}</span></div>
          <ul className="rm-flowers">
            {cur.flowers.map((f, i) => (
              <m.li key={f} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: 0.04 * i }}>
                <img src={flowerImg(f)} alt="" width={56} height={56} loading="lazy" /><span>{f}</span>
              </m.li>
            ))}
          </ul>
          <p className="muted small">Given {fmtLong(cur.givenAt)}{v.blend?.remedyOnly ? ', between sessions' : ''}. 4 drops, 4 times a day.{v.endsOn ? ` Ends ${fmtShort(v.endsOn)}.` : ''}</p>
          <ol className="stages">
            {STAGES.map((st, i) => <li key={st} className={STAGES.indexOf(cur.stage) >= i ? 'on' : ''}><span className="stage-dot" />{STAGE_LABEL[st]}</li>)}
          </ol>
        </section>
      )}
      {cur && <AdherenceCard p={v.p} now={now} />}
      <section className="card pf-card">
        <h2>All remedies <span className="muted small">{steps.length}</span></h2>
        {steps.length === 0 && <p className="muted small">No remedy yet. The first blend you create shows here.</p>}
        <ol className="rm-hist">
          {steps.map((st, i) => (
            <li key={st.appt.id}>
              <span className="rh-date"><b>{fmtShort(st.appt.remedy!.givenAt)}</b><small>{st.appt.remedyOnly ? 'between sessions' : typeLabel(st.appt).replace('Bach flower, ', '')}</small>{i === 0 && <em>latest</em>}</span>
              <span className="rh-body">
                <span className="chips-wrap tight">{st.flowers.map((f) => <span key={f} className={'tag ' + (st.added.includes(f) ? 'tag-new' : 'tag-sage')}>{st.added.includes(f) && <span className="sr-only">New: </span>}{f}</span>)}</span>
                {(st.added.length > 0 || st.dropped.length > 0) && <small>{st.added.length ? `Added ${st.added.join(', ')}` : ''}{st.added.length && st.dropped.length ? '. ' : ''}{st.dropped.length ? `Left out ${st.dropped.join(', ')}` : ''}.</small>}
                {!st.appt.remedyOnly && st.appt.benefits?.length ? <small className="rh-felt">Felt after: {st.appt.benefits.join(', ').toLowerCase()}</small> : null}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}

// ---------------------------------------------------------------- sessions list
export function SessionsList({ v, now, onOpen }: { v: PersonView; now: number; onOpen: (id: string) => void }) {
  const timeline = [...v.sessions].reverse()
  return (
    <section className="block">
      {timeline.length === 0 && <p className="muted small">No sessions yet.</p>}
      <ul className="rows">
        {timeline.map((a) => (
          <li key={a.id}>
            <button className="row" onClick={() => onOpen(a.id)}>
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
