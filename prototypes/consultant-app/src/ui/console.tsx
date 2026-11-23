/**
 * @module   prototype/consultant-app/ui/console
 * @owner    CONSULTANT
 * Purpose:  Consultant console blocks (owner 2026-11-23): last-visit chip, journey tag, AI wellness summary,
 *           Lo Shu card, wellness journey timeline, concerns over time, blend journey.
 */
import { m } from 'motion/react'
import { AlertCircle, ChevronRight, Compass, Flower2, Leaf, MessageCircleHeart, Sparkles, Star } from 'lucide-react'
import type { PersonView } from '../lib/derive'
import { blendJourney, feelingWord, journeySteps, journeyTag, recency, wellnessSummary, JOURNEY_RULE, type Journey } from '../lib/journey'
import { loShu, NUMBER_MEANING } from '../lib/loshu'
import { LoShuGrid } from './loshu'
import { softSpring } from './kit'
import { fmtShort } from '../lib/time'
import { typeLabel } from '../lib/labels'
import { pron } from '../data/types'

/** "12 Oct · 41 days ago" with a colour dot: green within about a month, amber 2–3 months, soft red beyond. */
export function LastSeen({ v, now, short = false }: { v: PersonView; now: number; short?: boolean }) {
  const r = recency(v.last?.start, now)
  if (!r) return <span className="last-seen none">No session yet</span>
  return (
    <span className={`last-seen ${r.tone}`} title={`Last session ${fmtShort(v.last!.start)}, ${r.label}`}>
      <i aria-hidden />{short ? r.label : <>Last session {fmtShort(v.last!.start)}<span className="ls-sep">·</span>{r.label}</>}
    </span>
  )
}

export function JourneyTag({ v, now }: { v: PersonView; now: number }) {
  const j = journeyTag(v, now)
  if (!j) return null
  return <span className={`journey j-${j.tag.toLowerCase()}`} title={`${j.why}. ${JOURNEY_RULE[j.tag as Journey]}.`}>{j.tag}</span>
}

/** AI wellness summary (rule-based in the prototype; Claude in the live app, K6). Descriptive only. */
export function WellnessSummaryCard({ v, now }: { v: PersonView; now: number }) {
  const s = wellnessSummary(v, now)
  const j = journeyTag(v, now)
  return (
    <section className="card pf-card wsum" aria-labelledby="wsum-h">
      <h2 id="wsum-h"><Sparkles size={16} /> Wellness summary</h2>
      {s.flag && (
        <m.p className="wsum-flag" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={softSpring}>
          <AlertCircle size={16} aria-hidden /><span><b>Blend routine</b>{s.flag}</span>
        </m.p>
      )}
      <dl className="wsum-list">
        <div>
          <dt><MessageCircleHeart size={15} aria-hidden /> Feelings noted</dt>
          <dd>{s.emotions.length > 0 && <span className="chips-wrap tight">{s.emotions.map((e) => <span key={e} className="tag tag-mist">{e}</span>)}</span>}<span>{s.emotionLine}</span></dd>
        </div>
        <div>
          <dt><Leaf size={15} aria-hidden /> Last blend</dt>
          <dd>{s.blendLine}</dd>
        </div>
        {j && (
          <div>
            <dt><Compass size={15} aria-hidden /> Journey</dt>
            <dd>{j.tag}: {j.why.charAt(0).toLowerCase() + j.why.slice(1)}.</dd>
          </div>
        )}
      </dl>
      <div className="wsum-focus">
        <b>Suggested focus for the session</b>
        <ul>{s.focus.map((f) => <li key={f}>{f}</li>)}</ul>
      </div>
      <p className="tagline">AI summary from sessions, check-ins, journal and drops. It describes, it doesn't diagnose. Verify with {v.p.first}.</p>
    </section>
  )
}

export function LoShuCard({ v, open }: { v: PersonView; open: () => void }) {
  const ls = loShu(v.p.dob)
  return (
    <section className="card pf-card ls-card">
      <div className="block-head"><h2>Lo Shu grid</h2><button type="button" className="pf-more" onClick={open}>{ls ? 'Full reading' : 'Add date of birth'}<ChevronRight size={16} /></button></div>
      {ls ? (
        <div className="ls-card-body">
          <LoShuGrid ls={ls} small />
          <div className="ls-card-facts">
            <span><small>Driver</small><b>{ls.driver}</b></span>
            <span><small>Conductor</small><b>{ls.conductor}</b></span>
            <p className="small">{ls.missing.length ? <>Missing {ls.missing.map((n) => `${n} (${NUMBER_MEANING[n].word.toLowerCase()})`).join(', ')}.</> : 'No missing numbers.'}{ls.planes.length ? ` ${ls.planes.length} complete ${ls.planes.length === 1 ? 'plane' : 'planes'}.` : ''}</p>
          </div>
        </div>
      ) : <p className="muted small">No date of birth yet. {v.p.first} adds it in the app, or you can add it.</p>}
    </section>
  )
}

/** Every completed session in order, with the gap since the one before, what troubled them, how they felt after, the blend. */
export function JourneyTimeline({ v, onOpen, max = 6, showAll }: { v: PersonView; onOpen: (id: string) => void; max?: number; showAll?: () => void }) {
  const steps = journeySteps(v)
  const shown = steps.slice(-max).reverse()
  return (
    <section className="card pf-card">
      <div className="block-head"><h2>Wellness journey</h2>{steps.length > max && showAll && <button type="button" className="pf-more" onClick={showAll}>All {steps.length}<ChevronRight size={16} /></button>}</div>
      {steps.length === 0 ? <p className="muted small">The journey starts after the first session.</p> : (
        <ol className="jt">
          {shown.map((st, i) => (
            <m.li key={st.appt.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
              <span className={`jt-dot ${st.appt.service}`} aria-hidden />
              <button type="button" className="jt-body" onClick={() => onOpen(st.appt.id)}>
                <span className="jt-top"><b>{fmtShort(st.appt.start)}</b><span>{typeLabel(st.appt)}</span>{st.appt.rating ? <span className="mini-rating"><Star size={11} />{st.appt.rating}</span> : null}</span>
                {st.troubling.length > 0 && <small>Brought: {st.troubling.join(', ')}</small>}
                {st.felt.length > 0 && <small className="jt-felt">Felt after: {st.felt.join(', ').toLowerCase()}</small>}
                {st.flowers ? <small>Blend of {st.flowers} flowers</small> : null}
                {st.appt.service === 'scanning' && st.appt.privateNote && <small className="jt-note">{st.appt.privateNote.split(/(?<=\.)\s+/)[0]}</small>}
              </button>
              {st.gapWeeks ? <span className="jt-gap">{st.gapWeeks} {st.gapWeeks === 1 ? 'week' : 'weeks'} after the one before</span> : null}
            </m.li>
          ))}
        </ol>
      )}
    </section>
  )
}

/** What troubled them across the last sessions (dot grid), in everyday words. */
export function ConcernsCard({ v }: { v: PersonView }) {
  const history = v.past.filter((a) => a.troubling?.length).slice(-5)
  const all = [...new Set(history.flatMap((a) => a.troubling!))]
  if (!all.length) return null
  return (
    <section className="card pf-card">
      <h2>Concerns across sessions</h2>
      <div className="concern-grid" style={{ gridTemplateColumns: `minmax(92px, 1fr) repeat(${history.length}, minmax(0, 46px))` }}>
        <span />
        {history.map((a) => <small key={a.id} className="cg-h">{fmtShort(a.start)}</small>)}
        {all.map((c) => (
          <div key={c} className="cg-row" style={{ display: 'contents' }}>
            <span className="cg-name">{feelingWord(c).replace(/^\w/, (x) => x.toUpperCase())}</span>
            {history.map((a) => <span key={a.id} role="img" className={'cg-cell' + (a.troubling!.includes(c) ? ' on' : '')} aria-label={a.troubling!.includes(c) ? `${feelingWord(c)} on ${fmtShort(a.start)}` : `No ${feelingWord(c)} on ${fmtShort(a.start)}`} />)}
          </div>
        ))}
      </div>
      <p className="tagline">What {v.p.first} brought to each session, from {pron(v.p).poss} check-in and your notes.</p>
    </section>
  )
}

/** Each blend in order: which flowers were added, kept and dropped. */
export function BlendJourney({ v }: { v: PersonView }) {
  const steps = blendJourney(v).slice(-5).reverse()
  if (!steps.length) return null
  return (
    <section className="card pf-card">
      <h2><Flower2 size={16} /> Blend journey</h2>
      <ol className="bj">
        {steps.map((st, i) => (
          <li key={st.appt.id}>
            <span className="bj-date"><b>{fmtShort(st.appt.remedy!.givenAt)}</b>{i === 0 && <small>latest</small>}</span>
            <span className="bj-flowers">
              <span className="chips-wrap tight">
                {st.flowers.map((f) => <span key={f} className={'tag ' + (st.added.includes(f) ? 'tag-new' : 'tag-sage')}>{st.added.includes(f) && <span className="sr-only">New: </span>}{f}</span>)}
              </span>
              {(st.added.length > 0 || st.dropped.length > 0) && (
                <small>{st.added.length ? `Added ${st.added.join(', ')}` : ''}{st.added.length && st.dropped.length ? '. ' : ''}{st.dropped.length ? `Left out ${st.dropped.join(', ')}` : ''}.</small>
              )}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
