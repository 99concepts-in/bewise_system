/**
 * @screens CN-05 + CN-06 + CN-08 — the session itself: summary first, then today's troubling emotions,
 *          private notes, flowers to consider; End session → Give remedy.
 * v5 (HUB 2026-11-20): troubling emotions as accent-coloured chips, flowers to consider as read-only flower tiles
 *          (the old add buttons here did nothing), current blend as thumbnails, "End session" as the floating navy pill.
 */
import { useEffect, useMemo, useState } from 'react'
import { m } from 'motion/react'
import { ArrowLeft, Droplet, Lock, MapPin, ShieldAlert, StopCircle, Video, UserRound } from 'lucide-react'
import { useIndex, useStore } from '../state/store'
import { Chip, Empty, Segmented, Sheet, go, softSpring } from '../ui/kit'
import { AdherenceCard, Suggestions } from '../ui/care'
import { FeelingChips, FlowerStack } from '../ui/art'
import { feelingTone } from '../ui/tone'
import { useSheets, typeLabel } from './Sheets'
import { TypeBadge } from '../ui/bits'
import { personView, scanSummary, sinceLastRemedy, suggestFlowers } from '../lib/derive'
import { fmtShort, relative } from '../lib/time'
import { CONCERNS, MIN } from '../data/seed'
import { pron } from '../data/types'

export default function Live({ id }: { id: string }) {
  const { s, dispatch, now } = useStore()
  const { person, byPerson } = useIndex()
  const sheets = useSheets()
  const a = s.appts.find((x) => x.id === id)
  const p = a ? person.get(a.personId) : undefined
  const history = useMemo(() => (a ? (byPerson.get(a.personId) ?? []).filter((x) => x.id !== a.id && x.start < a.start) : []), [a, byPerson])
  const v = useMemo(() => p && personView(p, history, now), [p, history, now])
  const last = history.filter((x) => x.status === 'completed').at(-1)
  const [ending, setEnding] = useState(false)
  const [tick, setTick] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setTick(Date.now()), 1000); return () => clearInterval(t) }, [])
  // start the clock as soon as the session is opened
  useEffect(() => { if (a && (a.status === 'confirmed' || a.status === 'checked_in')) dispatch({ type: 'start', apptId: a.id }) }, [a, dispatch])

  if (!a || !p || !v) return <div className="screen"><Empty img="owl-read" title="Session not found" body="It may have been moved or removed." action={<button className="btn btn-quiet" onClick={() => go('/sessions')}>Back to sessions</button>} /></div>

  const today = a.troubling ?? []
  const toggle = (c: string) => dispatch({ type: 'setTroubling', apptId: a.id, troubling: today.includes(c) ? today.filter((x) => x !== c) : [...today, c] })
  const suggestions = suggestFlowers(p, history, today)
  const lines = sinceLastRemedy(v, now)
  const elapsed = Math.max(0, tick - a.start)
  const mm = Math.floor(elapsed / MIN), ss = Math.floor((elapsed % MIN) / 1000)
  const over = mm >= a.durationMin
  const ended = a.status === 'completed' || a.status === 'no_show'
  const { obj, poss } = pron(p)
  const scanning = a.service === 'scanning'
  const scan = scanning ? scanSummary(history, p?.notes) : null

  return (
    <div className="screen live">
      <header className="live-top">
        <button className="icon-btn" onClick={() => history.length >= 0 && go(`/people/${p.id}`)} aria-label="Back to profile"><ArrowLeft size={20} /></button>
        <div className="live-who"><b>{p.name}</b><small>{typeLabel(a)}, {a.durationMin} min</small></div>
        <span className={'timer' + (over ? ' over' : '')} role="timer" aria-label={`${mm} minutes in`}>{ended ? 'Ended' : `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`}</span>
      </header>
      <div className="live-chips">
        <span className="pill">{a.mode === 'online' ? <><Video size={13} /> Online</> : <><MapPin size={13} /> In person</>}</span>
        <TypeBadge service={a.service} kind={a.kind} big />
        {a.mode === 'online' && (a.meetingUrl
          ? <a className="pill pill-link" href={a.meetingUrl} target="_blank" rel="noreferrer"><Video size={13} /> Open video</a>
          : <button className="pill pill-link" onClick={() => sheets.session(a.id)}><Video size={13} /> Add video link</button>)}
        <button className="pill pill-link" onClick={() => go(`/people/${p.id}`)}><UserRound size={13} /> Full profile</button>
      </div>

      <m.section className="card live-sum" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={softSpring}>
        <h2>Before you begin</h2>
        {a.safety && !ended && <p className="safety-note"><ShieldAlert size={18} aria-hidden /><span><b>Safety answer in the intake.</b> Read it before you begin.</span></p>}
        {a.feelings && <div className="live-feel"><span className="muted small">Chose when booking</span><FeelingChips items={a.feelings} max={6} size="sm" /></div>}
        {a.note && <blockquote className="quote-note">“{a.note}”<cite>{p.first}'s note when booking</cite></blockquote>}
        {scanning ? (scan ? (
          <ul className="three">
            <li>{scan.count} scanning {scan.count === 1 ? 'session' : 'sessions'} so far. Comes up most: {scan.themes.map(([t]) => t.toLowerCase()).join(', ') || 'nothing repeated yet'}.</li>
            <li>Last time ({fmtShort(scan.last.start)}): {scan.lastLine}</li>
            {scan.advice && <li>To follow up: {scan.advice}</li>}
          </ul>
        ) : <p className="muted small">First scanning session with {p.first}. Your notes from today start the history.</p>) : last ? (
          <ul className="three">
            {(lines ?? [`Last session ${relative(last.start, now)}${last.troubling ? `: ${last.troubling.join(', ').toLowerCase()}` : ''}.`]).map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        ) : <p className="muted small">First visit. {p.first}'s intake answers and an AI case summary will show here.</p>}
        {v.blend?.remedy && <div className="live-blend"><FlowerStack flowers={v.blend.remedy.flowers} size={30} max={5} /><span>Current blend since {fmtShort(v.blend.remedy.givenAt)}: <b>{v.blend.remedy.flowers.join(', ')}</b></span></div>}
      </m.section>

      {!scanning && v.blend?.remedy && <div className="live-adh"><AdherenceCard p={p} now={now} compact /></div>}

      {!scanning && <section className="block">
        <div className="block-head"><h2>What's troubling {obj} today?</h2><span className="muted small">{today.length ? `${today.length} chosen` : 'Tap all that apply'}</span></div>
        <div className="chips-wrap">
          {CONCERNS.map((c) => {
            const before = last?.troubling?.includes(c)
            return <Chip key={c} tone={feelingTone(c)} active={today.includes(c)} onClick={() => toggle(c)}><i className="feel-dot" aria-hidden />{c}{before && !today.includes(c) ? <span className="chip-hint">last time</span> : null}</Chip>
          })}
        </div>
      </section>}

      <section className="block">
        <div className="block-head"><h2><Lock size={16} /> {scanning ? 'Scanning notes' : 'Private notes'}</h2><span className="muted small">Only you can see this</span></div>
        <textarea className="notes" placeholder={scanning ? `What you noticed in ${p.first}'s scan, and what you suggested…` : `What ${p.first} shares today…`} value={a.privateNote ?? ''} onChange={(e) => dispatch({ type: 'setNote', apptId: a.id, note: e.target.value })} rows={5} />
        <p className="muted small saved">{a.privateNote ? 'Saved on this device' : 'Saves as you type'}</p>
      </section>

      {!scanning && <section className="block">
        <Suggestions first={p.first} items={suggestions} limit={6} />
      </section>}

      <div className="live-foot">
        {ended
          ? <m.button className="fab" whileTap={{ scale: 0.97 }} onClick={() => { go(`/people/${p.id}${scanning ? '?notes' : ''}`); if (!scanning && !a.remedy && a.status === 'completed') setTimeout(() => sheets.remedy(a.id), 120) }}>{scanning || a.remedy ? 'Back to profile' : <><Droplet size={20} aria-hidden /> Give remedy</>}</m.button>
          : <m.button className="fab" whileTap={{ scale: 0.97 }} onClick={() => setEnding(true)}><StopCircle size={20} aria-hidden /> End session</m.button>}
      </div>

      <Sheet open={ending} onClose={() => setEnding(false)} label="End session">
        <EndBody first={p.first} poss={poss} scanning={scanning} onCancel={() => setEnding(false)} onEnd={(outcome, weeks, summary) => {
          dispatch({ type: 'endSession', apptId: a.id, outcome, followUpWeeks: weeks, shareSummary: summary })
          setEnding(false)
          go(`/people/${p.id}${scanning ? '?notes' : ''}`) // scanning: straight to the notes
          if (outcome === 'completed' && !scanning) setTimeout(() => sheets.remedy(a.id), 160)
        }} />
      </Sheet>
    </div>
  )
}

function EndBody({ first, poss, scanning, onEnd, onCancel }: { first: string; poss: string; scanning: boolean; onEnd: (o: 'completed' | 'no_show', weeks: number | undefined, summary?: string) => void; onCancel: () => void }) {
  const [outcome, setOutcome] = useState<'completed' | 'no_show'>('completed')
  const [weeks, setWeeks] = useState<number | undefined>(4)
  const [share, setShare] = useState(false)
  const [summary, setSummary] = useState('')
  return (
    <div className="end">
      <h3 className="sheet-title">End session with {first}</h3>
      <Segmented id="outcome" value={outcome} onChange={setOutcome} options={[{ value: 'completed', label: 'Completed' }, { value: 'no_show', label: `${first} didn't come` }]} />
      {outcome === 'completed' && <>
        <div className="field"><span>Follow-up in</span>
          <div className="chips-wrap tight">{[2, 3, 4, 6].map((w) => <Chip key={w} active={weeks === w} onClick={() => setWeeks(w)}>{w} weeks</Chip>)}<Chip active={weeks === undefined} onClick={() => setWeeks(undefined)}>No follow-up</Chip></div>
        </div>
        <label className="toggle-row"><input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} /><span>Share a short summary with {first} <small>Optional. Kind and simple, never your private notes.</small></span></label>
        {share && <textarea className="notes" rows={3} placeholder={`For ${first}: what we talked about and ${poss} next small step…`} value={summary} onChange={(e) => setSummary(e.target.value)} />}
      </>}
      <div className="form-actions">
        <button className="btn btn-quiet" onClick={onCancel}>Keep going</button>
        <button className="btn btn-primary" onClick={() => onEnd(outcome, outcome === 'completed' ? weeks : undefined, share && summary.trim() ? summary.trim() : undefined)}>
          {outcome === 'completed' ? (scanning ? 'End and save notes' : <><Droplet size={18} aria-hidden /> End and give remedy</>) : 'Mark as not attended'}
        </button>
      </div>
    </div>
  )
}
