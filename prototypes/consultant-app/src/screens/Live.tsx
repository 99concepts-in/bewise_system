/**
 * @screens CN-05 + CN-06 + CN-08 — the session itself: summary first, then today's troubling emotions,
 *          private notes, flowers to consider; End session → Give remedy.
 */
import { useEffect, useMemo, useState } from 'react'
import { m } from 'motion/react'
import { ArrowLeft, Leaf, Lock, MapPin, StopCircle, Video, UserRound } from 'lucide-react'
import { useIndex, useStore } from '../state/store'
import { Chip, Empty, Segmented, Sheet, go, softSpring } from '../ui/kit'
import { AdherenceCard, Suggestions } from '../ui/care'
import { useSheets, KIND_LABEL } from './Sheets'
import { personView, sinceLastRemedy, suggestFlowers } from '../lib/derive'
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

  return (
    <div className="screen live">
      <header className="live-top">
        <button className="icon-btn" onClick={() => history.length >= 0 && go(`/people/${p.id}`)} aria-label="Back to profile"><ArrowLeft size={20} /></button>
        <div className="live-who"><b>{p.name}</b><small>{KIND_LABEL[a.kind]}, {a.durationMin} min</small></div>
        <span className={'timer' + (over ? ' over' : '')} aria-label={`${mm} minutes in`}>{ended ? 'Ended' : `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`}</span>
      </header>
      <div className="live-chips">
        <span className="pill">{a.mode === 'online' ? <><Video size={13} /> Online</> : <><MapPin size={13} /> In person</>}</span>
        {a.mode === 'online' && <a className="pill pill-link" href="https://meet.google.com/" target="_blank" rel="noreferrer">Open video</a>}
        <button className="pill pill-link" onClick={() => go(`/people/${p.id}`)}><UserRound size={13} /> Full profile</button>
      </div>

      <m.section className="card live-sum" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={softSpring}>
        <h2>Before you begin</h2>
        {a.note && <blockquote className="quote-note">“{a.note}”<cite>{p.first}'s note when booking</cite></blockquote>}
        {last ? (
          <ul className="three">
            {(lines ?? [`Last session ${relative(last.start, now)}${last.troubling ? `: ${last.troubling.join(', ').toLowerCase()}` : ''}.`]).map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        ) : <p className="muted small">First visit. {p.first}'s intake answers and an AI case summary will show here.</p>}
        {v.blend?.remedy && <p className="live-blend"><Leaf size={14} /> Current blend since {fmtShort(v.blend.remedy.givenAt)}: <b>{v.blend.remedy.flowers.join(', ')}</b></p>}
      </m.section>

      {v.blend?.remedy && <div className="live-adh"><AdherenceCard p={p} now={now} compact /></div>}

      <section className="block">
        <div className="block-head"><h2>What's troubling {obj} today?</h2><span className="muted small">{today.length ? `${today.length} chosen` : 'Tap all that apply'}</span></div>
        <div className="chips-wrap">
          {CONCERNS.map((c) => {
            const before = last?.troubling?.includes(c)
            return <Chip key={c} active={today.includes(c)} onClick={() => toggle(c)}>{c}{before && !today.includes(c) ? <span className="chip-hint">last time</span> : null}</Chip>
          })}
        </div>
      </section>

      <section className="block">
        <div className="block-head"><h2><Lock size={16} /> Private notes</h2><span className="muted small">Only you can see this</span></div>
        <textarea className="notes" placeholder={`What ${p.first} shares today…`} value={a.privateNote ?? ''} onChange={(e) => dispatch({ type: 'setNote', apptId: a.id, note: e.target.value })} rows={5} />
        <p className="muted small saved">{a.privateNote ? 'Saved on this device' : 'Saves as you type'}</p>
      </section>

      <section className="block">
        <Suggestions first={p.first} items={suggestions} picked={[]} onToggle={() => {}} limit={4} />
      </section>

      <div className="live-foot">
        {ended
          ? <button className="btn btn-primary btn-block" onClick={() => { go(`/people/${p.id}`); if (!a.remedy && a.status === 'completed') setTimeout(() => sheets.remedy(a.id), 120) }}><Leaf size={16} /> {a.remedy ? 'Back to profile' : 'Give remedy'}</button>
          : <button className="btn btn-primary btn-block" onClick={() => setEnding(true)}><StopCircle size={17} /> End session</button>}
      </div>

      <Sheet open={ending} onClose={() => setEnding(false)} label="End session">
        <EndBody first={p.first} poss={poss} onCancel={() => setEnding(false)} onEnd={(outcome, weeks, summary) => {
          dispatch({ type: 'endSession', apptId: a.id, outcome, followUpWeeks: weeks, shareSummary: summary })
          setEnding(false)
          go(`/people/${p.id}`)
          if (outcome === 'completed') setTimeout(() => sheets.remedy(a.id), 160)
        }} />
      </Sheet>
    </div>
  )
}

function EndBody({ first, poss, onEnd, onCancel }: { first: string; poss: string; onEnd: (o: 'completed' | 'no_show', weeks: number | undefined, summary?: string) => void; onCancel: () => void }) {
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
          {outcome === 'completed' ? <><Leaf size={16} /> End and give remedy</> : 'Mark as not attended'}
        </button>
      </div>
    </div>
  )
}
