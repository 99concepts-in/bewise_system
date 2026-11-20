/**
 * @screens CN-09 CN-10 CN-14 CN-15 CN-19 CN-28 — every bottom-sheet body, loaded lazily (and prefetched on idle).
 * v5 (HUB 2026-11-20, D-45): remedy builder is a flower-tile grid ("Flowers to consider" first), max 7 flowers,
 *          with a floating "Build remedy · n/7 flowers" pill; feelings and blends shown as colour chips and flower thumbnails.
 */
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { Copy, Share2, ChevronLeft, Check, ArrowLeft, Zap, UserPlus, Search, ChevronRight, CalendarClock, Droplet, MapPin, MessageCircle, Phone, Play, Star, Video, BellRing, PackageCheck, CalendarPlus, ClipboardCheck, IndianRupee, Repeat, ShieldAlert, X } from 'lucide-react'
import { useIndex, useStore } from '../state/store'
import { Avatar, Chip, Segmented, go, softSpring, spring, useToast } from '../ui/kit'
import { dayLabel, fmtDay, fmtShort, fmtTime, relative, inr } from '../lib/time'
import { nextDays, nextFree, slotsForDay } from '../lib/slots'
import { FLOWERS, MIN, startOfDay } from '../data/seed'
import { suggestFlowers } from '../lib/derive'
import { FlowerTile, Suggestions } from '../ui/care'
import { FeelingChips, FlowerArt, FlowerChip } from '../ui/art'
import { pron, type Appt, type Kind, type Mode, type Person } from '../data/types'

import { FEE, KIND_LABEL, MAX_FLOWERS, STATUS_LABEL, waLink, BOOKING_LINK } from '../lib/labels'
import type { Api, Open } from './Sheets'

// ---------------------------------------------------------------- session details
function SessionBody({ id, close, api }: { id: string; close: () => void; api: Api }) {
  const { s, now } = useStore()
  const { person } = useIndex()
  const a = s.appts.find((x) => x.id === id)
  if (!a) return null
  const p = person.get(a.personId)!
  const upcoming = a.status === 'confirmed' || a.status === 'awaiting_payment' || a.status === 'checked_in'
  const startsSoon = a.start - now < 30 * MIN
  return (
    <div className="sd">
      <button className="sd-head" onClick={() => { close(); go(`/people/${p.id}`) }}>
        <Avatar name={p.name} size={52} mood={p.moods.at(-1)?.mood} />
        <span>
          <strong>{p.name}</strong>
          <small>{p.city}</small>
        </span>
        <span className="sd-open">Profile <ChevronRight size={16} /></span>
      </button>

      <div className="sd-when">
        <div><span className="muted">{dayLabel(a.start, now)}</span><b>{fmtTime(a.start)}</b></div>
        <div><span className="muted">{KIND_LABEL[a.kind]}</span><b>{a.durationMin} min</b></div>
        <div><span className="muted">{a.mode === 'online' ? 'Online' : 'In person'}</span><b>{a.mode === 'online' ? <Video size={18} /> : <MapPin size={18} />}</b></div>
      </div>
      <div className={`status status-${a.status}`}><span>{STATUS_LABEL[a.status]}{upcoming ? `, starts ${relative(a.start, now)}` : ""}</span>{a.status !== 'no_show' && <span className="fee"><IndianRupee size={12} />{inr(FEE[a.kind]).slice(1)} incl. remedy</span>}</div>

      {a.safety && upcoming && <p className="safety-note"><ShieldAlert size={18} aria-hidden /><span><b>Safety answer in the intake.</b> Read it before you begin.</span></p>}
      {a.note && <blockquote className="quote-note">“{a.note}”<cite>{p.first}'s note when booking</cite></blockquote>}

      {a.feelings && (
        <section className="sd-sec"><h4>How {p.first} is feeling</h4>
          <FeelingChips items={a.feelings} max={6} /></section>
      )}
      {a.troubling && (
        <section className="sd-sec"><h4>What was troubling {pron(p).obj}</h4>
          <FeelingChips items={a.troubling} max={12} /></section>
      )}
      {a.remedy && (
        <section className="sd-sec"><h4><Droplet size={16} aria-hidden /> Remedy given {fmtShort(a.remedy.givenAt)}</h4>
          <div className="fchips">{a.remedy.flowers.map((f) => <FlowerChip key={f} name={f} />)}</div></section>
      )}
      {a.rating && (
        <section className="sd-sec"><h4>{p.first}'s feedback</h4>
          <div className="stars" aria-label={`${a.rating} out of 5`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} size={16} className={i < a.rating! ? 'on' : ''} />)}</div>
          {a.feedback && <p className="kind-small">“{a.feedback}”</p>}</section>
      )}

      <div className="sd-actions">
        {upcoming && <>
          <button className="btn btn-primary" disabled={!startsSoon} onClick={() => { close(); go(`/session/${a.id}`) }}>
            <Play size={18} aria-hidden /> {startsSoon ? 'Start session' : `Starts ${relative(a.start, now)}`}
          </button>
          <div className="btn-row">
            <button className="btn btn-quiet" onClick={() => api.reschedule(a.id)}><CalendarClock size={16} /> Reschedule</button>
            <a className="btn btn-quiet" href={waLink(p.phone, `Namaste ${p.first}, this is Jitendra Khimlani from BeWise. `)} target="_blank" rel="noreferrer"><MessageCircle size={16} /> WhatsApp</a>
            <a className="btn btn-quiet" href={`tel:${p.phone.replace(/\s/g, '')}`}><Phone size={16} /> Call</a>
          </div>
        </>}
        {a.status === 'completed' && !a.remedy && <button className="btn btn-primary" onClick={() => api.remedy(a.id)}><Droplet size={18} aria-hidden /> Give remedy</button>}
        {(a.status === 'completed' || a.status === 'no_show') && <button className="btn btn-quiet" onClick={() => api.book(p.id)}><CalendarPlus size={16} /> Book follow-up</button>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- slot picker
function SlotBody({ o, close }: { o: Extract<Open, { k: 'slots' }>; close: () => void }) {
  const { s, dispatch, now } = useStore()
  const { person, byPerson } = useIndex()
  const toast = useToast()
  const appt = o.mode === 'reschedule' ? s.appts.find((x) => x.id === o.apptId) : undefined
  const personId = appt?.personId ?? (o.mode === 'book' ? o.personId : '')
  const p = person.get(personId)!
  const hasHistory = (byPerson.get(personId) ?? []).some((a) => a.status === 'completed')
  const [kind, setKind] = useState<Kind>(appt?.kind ?? (hasHistory ? 'followup' : 'first'))
  const [mode, setMode] = useState<Mode>(appt?.mode ?? 'online')
  const duration = kind === 'first' ? 60 : 30
  const days = useMemo(() => nextDays(now, 15), [now])
  const counts = useMemo(() => days.map((d) => slotsForDay(d, duration, s.appts, s, now, appt?.id).length), [days, duration, s, now, appt?.id])
  const firstOpen = counts.findIndex((c) => c > 0)
  const [day, setDay] = useState(days[Math.max(0, firstOpen)])
  const slots = useMemo(() => slotsForDay(day, duration, s.appts, s, now, appt?.id), [day, duration, s, now, appt?.id])
  const [pick, setPick] = useState<number | null>(null)
  const [review, setReview] = useState(false)

  const confirm = () => {
    if (pick === null) return
    if (appt) { dispatch({ type: 'reschedule', apptId: appt.id, start: pick }); toast(`Moved to ${dayLabel(pick, now)}, ${fmtTime(pick)}. ${p.first} will be told.`); close() }
    else setReview(true)
  }
  if (review && pick !== null && !appt) return <ConfirmBooking p={p} start={pick} kind={kind} mode={mode} onBack={() => setReview(false)} close={close} />

  return (
    <div className="slots">
      <h3 className="sheet-title">{appt ? `Move ${p.first}'s session` : `Book ${p.first}`}</h3>
      {appt && <p className="muted small">Currently {dayLabel(appt.start, now).toLowerCase()} at {fmtTime(appt.start)}. Moving it doesn't use up {pron(p).poss} free reschedules.</p>}
      {!appt && (
        <div className="slots-opts">
          <Segmented id="kind" value={kind} onChange={(v) => { setKind(v); setPick(null) }} options={[{ value: 'followup', label: 'Follow-up ₹800' }, { value: 'first', label: 'First ₹1,000' }]} />
          <Segmented id="mode" value={mode} onChange={setMode} options={[{ value: 'online', label: 'Online' }, { value: 'in_person', label: 'In person' }]} />
        </div>
      )}
      <div className="daystrip" role="listbox" aria-label="Day">
        {days.map((d, i) => (
          <button key={d} role="option" aria-selected={d === day} disabled={counts[i] === 0} className={'day' + (d === day ? ' is-on' : '')} onClick={() => { setDay(d); setPick(null) }}>
            {d === day && <m.span layoutId="day-pill" className="day-pill" transition={spring} />}
            <span className="day-wd">{i === 0 ? 'Today' : new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(d)}</span>
            <span className="day-n">{new Date(d).getDate()}</span>
            <span className="day-c">{counts[i] ? `${counts[i]} free` : 'full'}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={day + kind} className="slot-grid" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.12 }}>
          {slots.length === 0 && <p className="muted small">No free times on {fmtDay(day)}. Try another day.</p>}
          {slots.map((t) => (
            <button key={t} className={'slot' + (pick === t ? ' is-on' : '')} onClick={() => setPick(t)} aria-pressed={pick === t}>{fmtTime(t)}</button>
          ))}
        </m.div>
      </AnimatePresence>
      <button className="btn btn-primary btn-block" disabled={pick === null} onClick={confirm}>
        {pick === null ? 'Pick a time' : appt ? `Move to ${fmtTime(pick)}` : `Continue with ${fmtTime(pick)}`}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------- give remedy: the remedy builder
function RemedyBody({ apptId, close }: { apptId: string; close: () => void }) {
  const { s, dispatch, now } = useStore()
  const { person, byPerson } = useIndex()
  const toast = useToast()
  const a = s.appts.find((x) => x.id === apptId)!
  const p = person.get(a.personId)!
  const last = [...(byPerson.get(p.id) ?? [])].reverse().find((x) => x.remedy && x.id !== a.id)
  const [picked, setPicked] = useState<string[]>((last?.remedy?.flowers ?? []).slice(0, MAX_FLOWERS))
  const [q, setQ] = useState('')
  const history = (byPerson.get(p.id) ?? []).filter((x) => x.id !== a.id && x.start < a.start)
  const suggestions = useMemo(() => suggestFlowers(p, history, a.troubling ?? []), [p, history.length, a.troubling]) // eslint-disable-line react-hooks/exhaustive-deps
  const suggested = new Set(suggestions.map((x) => x.flower))
  const ql = q.trim().toLowerCase()
  // all 38 + Rescue: while searching show every match; otherwise the ones not already offered above
  const list = FLOWERS.filter((f) => (ql ? f.toLowerCase().includes(ql) : !suggested.has(f)))
  const full = picked.length >= MAX_FLOWERS
  const toggle = (f: string) => {
    if (picked.includes(f)) { setPicked((x) => x.filter((y) => y !== f)); return }
    if (full) { toast(`A blend holds up to ${MAX_FLOWERS} flowers. Remove one to add ${f}.`); return }
    setPicked((x) => [...x, f])
  }
  const give = () => { dispatch({ type: 'giveRemedy', apptId, flowers: picked, now: Date.now() }); toast(`Remedy given. The office is preparing ${p.first}'s bottle.`); close() }
  return (
    <div className="remedy">
      <h3 className="sheet-title">Give {p.first}'s remedy</h3>
      <p className="muted small">Session {dayLabel(a.start, now).toLowerCase()} at {fmtTime(a.start)}. Included in the {inr(FEE[a.kind])} fee.{last ? ' Started from the last blend.' : ''}</p>
      {(a.troubling ?? a.feelings) && <div className="remedy-feel"><FeelingChips items={a.troubling ?? a.feelings ?? []} max={6} size="sm" /></div>}

      <section className="blend-box" aria-label={`${p.first}'s blend`}>
        <div className="blend-head"><h4>{p.first}'s blend</h4><span className="blend-count" aria-live="polite">{picked.length}/{MAX_FLOWERS} flowers</span></div>
        <div className="blend">
          <AnimatePresence initial={false}>
            {picked.map((f) => (
              <m.button layout key={f} type="button" className="blend-chip" onClick={() => toggle(f)} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} aria-label={`Remove ${f}`}>
                <FlowerArt name={f} decorative /><span>{f}</span><X size={14} aria-hidden />
              </m.button>
            ))}
          </AnimatePresence>
          {picked.length === 0 && <span className="muted small">Tap flowers below to add them.</span>}
        </div>
        <p className="dosage"><b>4 drops, 4 times a day</b> for 3 weeks, 30 ml bottle</p>
      </section>

      {!ql && <Suggestions first={p.first} items={suggestions} picked={picked} onToggle={toggle} full={full} limit={7}
        onAddAll={() => setPicked((x) => [...new Set([...x, ...suggestions.map((sg) => sg.flower)])].slice(0, MAX_FLOWERS))} />}

      <section className="all-flowers">
        <h4 className="sugg-title">{ql ? `Flowers matching “${q.trim()}”` : suggestions.length ? 'All other flowers' : 'All flowers'}</h4>
        <div className="search-wrap search-in-sheet">
          <Search size={18} aria-hidden />
          <input className="search" placeholder="Search by flower name" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search flowers" />
          {q && <button type="button" className="icon-btn sm" onClick={() => setQ('')} aria-label="Clear search"><X size={16} /></button>}
        </div>
        {list.length === 0 && <p className="muted small">No flower matches “{q.trim()}”.</p>}
        <ul className="ftile-grid">
          {list.map((f) => <li key={f}><FlowerTile name={f} on={picked.includes(f)} onToggle={toggle} full={full} /></li>)}
        </ul>
      </section>

      <div className="sheet-fab">
        <m.button type="button" className="fab" disabled={!picked.length} onClick={give} whileTap={{ scale: 0.97 }}>
          <Droplet size={20} aria-hidden /> Build remedy · {picked.length}/{MAX_FLOWERS} flowers
        </m.button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- notices
const NOTICE_ICON = { booked: CalendarPlus, rescheduled: Repeat, feedback: Star, delivered: PackageCheck, payment: IndianRupee, checkin: ClipboardCheck }
function NoticesBody({ close }: { close: () => void }) {
  const { s, dispatch, now } = useStore()
  const unread = s.notices.filter((n) => n.at > s.readUpTo && !n.seen).length
  return (
    <div className="notices">
      <div className="sheet-title-row"><h3 className="sheet-title">Updates</h3>
        {unread > 0 && <button className="link" onClick={() => dispatch({ type: 'readAll', now })}>Mark all read</button>}</div>
      {s.notices.length === 0 && <p className="muted">You're up to date.</p>}
      <ul>
        {s.notices.map((n, i) => {
          const Icon = NOTICE_ICON[n.kind] ?? BellRing
          return (
            <m.li key={n.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03, ...spring }}>
              <button onClick={() => { if (n.personId) { close(); go(`/people/${n.personId}`) } }} className={n.at > s.readUpTo && !n.seen ? 'unread' : ''}>
                <span className={`n-ic n-${n.kind}`}><Icon size={16} /></span>
                <span className="n-text">{n.text}<small>{relative(n.at, now)}</small></span>
              </button>
            </m.li>
          )
        })}
      </ul>
    </div>
  )
}

// ---------------------------------------------------------------- add a person
const CITY_OPTIONS = ['Vadodara', 'Ahmedabad', 'Surat', 'Anand', 'Rajkot', 'Mumbai', 'Pune']
function AddPersonBody({ then, close, api }: { then: 'profile' | 'express'; close: () => void; api: Api }) {
  const { s, dispatch } = useStore()
  const toast = useToast()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('Vadodara')
  const [pronoun, setPronoun] = useState<Person['pronoun']>('they')
  const [touched, setTouched] = useState(false)
  const digits = phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')
  const nameErr = name.trim().length < 2 ? 'Enter their name.' : null
  const phoneErr = !/^[6-9]\d{9}$/.test(digits) ? 'Enter a 10-digit mobile number.' : null
  const dup = !phoneErr ? s.people.find((p) => p.phone.replace(/\D/g, '').endsWith(digits)) : undefined

  const save = (next: 'profile' | 'express') => {
    setTouched(true)
    if (nameErr || phoneErr || dup) return
    const clean = name.trim().replace(/\s+/g, ' ')
    const person: Person = {
      id: `n${Date.now()}`, name: clean.replace(/\b\w/g, (c) => c.toUpperCase()), first: clean.split(' ')[0].replace(/^\w/, (c) => c.toUpperCase()),
      pronoun, city: city.trim() || 'Vadodara', phone: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`, joinedAt: Date.now(), moods: [],
    }
    dispatch({ type: 'addPerson', person })
    if (next === 'express') { api.express(person.id) } else { toast(`${person.first} added`); close(); go(`/people/${person.id}`) }
  }

  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); save(then) }} noValidate>
      <h3 className="sheet-title">Add a person</h3>
      <p className="muted small">They'll get a WhatsApp invite to fill their intake before the first session.</p>
      <label className="field"><span>Full name</span>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} placeholder="e.g. Priya Shah" autoComplete="name" aria-invalid={touched && !!nameErr} />
        {touched && nameErr && <small className="err">{nameErr}</small>}
      </label>
      <label className="field"><span>Mobile number</span>
        <div className="phone"><b>+91</b><input inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setTouched(true)} placeholder="98765 43210" autoComplete="tel-national" aria-invalid={touched && (!!phoneErr || !!dup)} /></div>
        {touched && phoneErr && <small className="err">{phoneErr}</small>}
        {dup && <small className="err">Already registered as {dup.name}. <button type="button" className="link" onClick={() => { close(); go(`/people/${dup.id}`) }}>Open profile</button></small>}
      </label>
      <div className="field"><span>City</span>
        <div className="chips-wrap tight">{CITY_OPTIONS.map((c) => <Chip key={c} active={city === c} onClick={() => setCity(c)}>{c}</Chip>)}</div>
        <input value={CITY_OPTIONS.includes(city) ? '' : city} onChange={(e) => setCity(e.target.value)} placeholder="Another city" aria-label="Another city" />
      </div>
      <div className="field"><span>How to refer to them</span>
        <Segmented id="pronoun" value={pronoun} onChange={setPronoun} options={[{ value: 'she', label: 'She' }, { value: 'he', label: 'He' }, { value: 'they', label: 'They' }]} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-quiet" onClick={() => save('profile')}><UserPlus size={16} /> Save</button>
        <button type="button" className="btn btn-primary" onClick={() => save('express')}><Zap size={16} /> Save and book</button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------- greet & confirm (payment link follows automatically)
function greetingFor(p: Person, start: number, kind: Kind, mode: Mode, now: number) {
  const when = `${dayLabel(start, now) === 'Today' || dayLabel(start, now) === 'Tomorrow' ? dayLabel(start, now).toLowerCase() + ', ' + fmtShort(start) : fmtDay(start)} at ${fmtTime(start)}`
  return [
    `Namaste ${p.first} 🙏`,
    `This is Jitendra Khimlani from BeWise. Your ${KIND_LABEL[kind].toLowerCase()} is booked for ${when}, ${mode === 'online' ? 'online (the video link comes with your reminder)' : 'at the studio in Vadodara'}.`,
    kind === 'first' ? 'Before we meet, please fill the short intake form so I can understand you better.' : 'Looking forward to hearing how you have been.',
  ].join('\n\n')
}

function ConfirmBooking({ p, start, kind, mode, onBack, close }: { p: Person; start: number; kind: Kind; mode: Mode; onBack: () => void; close: () => void }) {
  const { dispatch, now } = useStore()
  const [msg, setMsg] = useState(() => greetingFor(p, start, kind, mode, now))
  const [stage, setStage] = useState<'review' | 'sending' | 'done'>('review')
  const send = () => {
    dispatch({ type: 'book', personId: p.id, start, kind, mode, id: `b${Date.now()}`, now: Date.now(), greeting: msg })
    setStage('sending')
    setTimeout(() => setStage('done'), 1500)
  }
  const steps = [
    { label: `Greeting sent to ${p.first} on WhatsApp`, on: stage !== 'review' },
    { label: `Booking confirmed for ${dayLabel(start, now).toLowerCase()}, ${fmtTime(start)}`, on: stage !== 'review' },
    { label: stage === 'done' ? 'Payment link sent automatically' : 'Sending the payment link automatically', on: stage === 'done' },
  ]
  if (stage !== 'review') return (
    <div className="confirm-done">
      <m.div className="done-badge" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={softSpring}><Check size={40} strokeWidth={2.6} aria-hidden /></m.div>
      <h3 className="sheet-title">{p.first} is booked</h3>
      <ol className="done-steps">
        {steps.map((st, i) => (
          <m.li key={i} className={st.on ? 'on' : ''} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.1 + i * 0.12 }}>
            <span className="ds-dot">{st.on ? <Check size={13} strokeWidth={3} /> : <span className="ds-spin" />}</span>{st.label}
          </m.li>
        ))}
      </ol>
      <p className="muted small">You don't need to send anything else. BeWise sends the payment link and the reminders.</p>
      <button className="btn btn-primary btn-block" onClick={close}>Done</button>
    </div>
  )
  return (
    <div className="confirm">
      <button className="link back-link" onClick={onBack}><ArrowLeft size={15} /> Change time</button>
      <h3 className="sheet-title">Greet and confirm</h3>
      <div className="confirm-summary">
        <Avatar name={p.name} size={44} />
        <span><b>{p.name}</b><small>{KIND_LABEL[kind]}, {dayLabel(start, now)} at {fmtTime(start)}, {mode === 'online' ? 'online' : 'in person'}</small></span>
        <span className="confirm-fee">{inr(FEE[kind])}</span>
      </div>
      <label className="field"><span>Your greeting on WhatsApp</span>
        <textarea className="wa-bubble" value={msg} onChange={(e) => setMsg(e.target.value)} rows={7} />
      </label>
      <p className="auto-note"><IndianRupee size={14} /> After you confirm, BeWise sends {p.first} the payment link automatically. Nothing to send yourself.</p>
      <button className="btn btn-primary btn-block" disabled={msg.trim().length < 5} onClick={send}><MessageCircle size={16} /> Confirm booking and greet {p.first}</button>
    </div>
  )
}

// ---------------------------------------------------------------- express booking: person → next free time → done
function ExpressBody({ personId, close, api }: { personId?: string; close: () => void; api: Api }) {
  const { s, now } = useStore()
  const { person, byPerson } = useIndex()
  const [pid, setPid] = useState(personId)
  const [q, setQ] = useState('')
  const p = pid ? person.get(pid) : undefined
  const returning = p ? (byPerson.get(p.id) ?? []).some((a) => a.status === 'completed') : false
  const [kind, setKind] = useState<Kind>(returning ? 'followup' : 'first')
  const [mode, setMode] = useState<Mode>('online')
  const effKind: Kind = p && !returning ? 'first' : kind
  const free = useMemo(() => nextFree(effKind === 'first' ? 60 : 30, s.appts, s, now, 6), [effKind, s, now])
  const [picked, setPicked] = useState<number | null>(null)

  if (!p) {
    const ql = q.trim().toLowerCase()
    const matches = (ql ? s.people.filter((x) => x.name.toLowerCase().includes(ql) || x.phone.replace(/\s/g, '').includes(ql.replace(/\s/g, ''))) : s.people.slice(0, 0)).slice(0, 6)
    return (
      <div className="express">
        <h3 className="sheet-title"><Zap size={20} /> Express booking</h3>
        <p className="muted small">Pick who it's for. The next free times come up straight away.</p>
        <div className="search-wrap"><Search size={18} aria-hidden /><input className="search" placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search people" /></div>
        <ul className="pick-list">
          {matches.map((x) => (
            <li key={x.id}><button className="row" onClick={() => { setPid(x.id); setKind((byPerson.get(x.id) ?? []).some((a) => a.status === 'completed') ? 'followup' : 'first') }}>
              <Avatar name={x.name} size={38} /><span className="row-main"><b>{x.name}</b><small>{x.city}, {x.phone}</small></span><ChevronRight size={16} /></button></li>
          ))}
          {ql && matches.length === 0 && <li className="muted small pad">No one matches “{q}”.</li>}
        </ul>
        <button className="btn btn-quiet btn-block" onClick={() => api.addPerson('express')}><UserPlus size={16} /> Add someone new</button>
      </div>
    )
  }

  if (picked !== null) return <ConfirmBooking p={p} start={picked} kind={effKind} mode={mode} onBack={() => setPicked(null)} close={close} />
  return (
    <div className="express">
      <h3 className="sheet-title"><Zap size={20} /> Book {p.first}</h3>
      {!personId && <button className="link" onClick={() => setPid(undefined)}>Change person</button>}
      <div className="slots-opts">
        {returning
          ? <Segmented id="x-kind" value={kind} onChange={setKind} options={[{ value: 'followup', label: 'Follow-up ₹800' }, { value: 'first', label: 'First ₹1,000' }]} />
          : <p className="pill-note">First consultation, 60 min, ₹1,000 incl. remedy</p>}
        <Segmented id="x-mode" value={mode} onChange={setMode} options={[{ value: 'online', label: 'Online' }, { value: 'in_person', label: 'In person' }]} />
      </div>
      <h4 className="x-head">Next free times</h4>
      {free.length === 0 && <p className="muted small">No free times in the next 3 weeks. Open more hours in availability.</p>}
      <ul className="x-list">
        {free.map((t, i) => (
          <m.li key={t} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.04 }}>
            <button className={'x-slot' + (i === 0 ? ' is-first' : '')} onClick={() => setPicked(t)}>
              <span><b>{dayLabel(t, now)}</b><small>{fmtTime(t)}</small></span>
              <span className="x-cta">{i === 0 ? 'Book earliest' : 'Book'}</span>
            </button>
          </m.li>
        ))}
      </ul>
      <button className="btn btn-quiet btn-block" onClick={() => api.book(p.id)}><CalendarClock size={16} /> Pick another day</button>
    </div>
  )
}

// ---------------------------------------------------------------- share booking link (+ QR for workshops)
const SHARE_MSGS: Record<'new' | 'followup' | 'workshop', { label: string; text: string }> = {
  new: { label: 'New client', text: 'Namaste 🙏 You can book a calm, one-to-one consultation with me here. Pick any time that suits you:' },
  followup: { label: 'Follow-up', text: 'Namaste 🙏 Time for our follow-up. Choose a time that works for you here:' },
  workshop: { label: 'Workshop', text: 'Thank you for joining the workshop today 🙏 If you would like a personal session with me, book here:' },
}
function ShareBody() {
  const { s, now } = useStore()
  const toast = useToast()
  const [kind, setKind] = useState<keyof typeof SHARE_MSGS>('new')
  const [qr, setQr] = useState<string | null>(null)
  const msg = `${SHARE_MSGS[kind].text}\n${BOOKING_LINK}`
  useEffect(() => {
    let live = true
    import('qrcode').then((Q) => Q.toDataURL(BOOKING_LINK, { margin: 1, width: 360, color: { dark: '#17214A', light: '#FFFFFF' } })).then((u) => { if (live) setQr(u) }).catch(() => {})
    return () => { live = false }
  }, [])
  const m0 = new Date(now); m0.setDate(1); m0.setHours(0, 0, 0, 0)
  const firsts = s.appts.filter((a) => a.kind === 'first' && a.start >= m0.getTime()).length
  const copy = async (text = BOOKING_LINK, done = 'Link copied') => {
    try { await navigator.clipboard.writeText(text); toast(done) }
    catch { toast('Copy not allowed here. Long-press the text to copy.') }
  }
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator
  return (
    <div className="share">
      <h3 className="sheet-title">Your booking link</h3>
      <p className="muted small">Anyone with this link sees your free times and can book with you. {firsts} first consultations booked this month.</p>
      <div className="link-box"><span>{BOOKING_LINK.replace('https://', '')}</span><button className="btn btn-primary btn-sm" onClick={() => copy()}><Copy size={15} /> Copy</button></div>
      <div className="chips-wrap tight">{(Object.keys(SHARE_MSGS) as (keyof typeof SHARE_MSGS)[]).map((k) => <Chip key={k} active={kind === k} onClick={() => setKind(k)}>{SHARE_MSGS[k].label}</Chip>)}</div>
      <p className="wa-bubble wa-preview">{msg}</p>
      <div className="form-actions">
        <a className="btn btn-quiet" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer"><MessageCircle size={16} /> WhatsApp</a>
        {canShare
          ? <button className="btn btn-primary" onClick={() => navigator.share({ title: 'Book with Jitendra Khimlani', text: SHARE_MSGS[kind].text, url: BOOKING_LINK }).catch(() => {})}><Share2 size={16} /> Share</button>
          : <button className="btn btn-primary" onClick={() => copy(msg, 'Message copied')}><Copy size={16} /> Copy message</button>}
      </div>
      <div className="qr">
        {qr ? <m.img src={qr} width={180} height={180} alt="QR code for your booking link" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={softSpring} /> : <span className="qr-ph" />}
        <div><b>QR code</b><p className="muted small">Show it at workshops or keep it at the studio desk. People scan and book.</p>
          {qr && <a className="link" href={qr} download="jitendra-khimlani-booking-qr.png">Download QR</a>}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- calendar (month view of all appointments)
function CalendarBody({ api }: { api: Api }) {
  const { s, now } = useStore()
  const { person } = useIndex()
  const today = startOfDay(now)
  const [month, setMonth] = useState(() => { const d = new Date(now); d.setDate(1); d.setHours(0, 0, 0, 0); return d.getTime() })
  const [dir, setDir] = useState(0)
  const [sel, setSel] = useState(today)
  const byDay = useMemo(() => {
    const mp = new Map<number, Appt[]>()
    for (const a of s.appts) { if (a.status === 'no_show') continue; const d = startOfDay(a.start); const l = mp.get(d); if (l) l.push(a); else mp.set(d, [a]) }
    return mp
  }, [s.appts])
  const md = new Date(month)
  const lead = (md.getDay() + 6) % 7
  const daysIn = new Date(md.getFullYear(), md.getMonth() + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((lead + daysIn) / 7) * 7 }, (_, i) => i - lead + 1)
  const shift = (n: number) => { const d = new Date(month); d.setMonth(d.getMonth() + n); setDir(n); setMonth(d.getTime()) }
  const list = byDay.get(sel) ?? []
  const max = Math.max(1, ...[...byDay.values()].map((l) => l.length))
  return (
    <div className="cal">
      <div className="cal-head">
        <button className="icon-btn sm" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
        <h3 className="sheet-title">{new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(month)}</h3>
        <button className="icon-btn sm" onClick={() => shift(1)} aria-label="Next month"><ChevronRight size={18} /></button>
      </div>
      <div className="cal-wd">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((w, i) => <span key={i}>{w}</span>)}</div>
      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <m.div key={month} className="cal-grid" initial={{ opacity: 0, x: dir * 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -30 }} transition={{ duration: 0.18 }}>
          {cells.map((n, i) => {
            if (n < 1 || n > daysIn) return <span key={i} />
            const d = new Date(md.getFullYear(), md.getMonth(), n).getTime()
            const l = byDay.get(d) ?? []
            const unpaid = l.some((a) => a.status === 'awaiting_payment')
            return (
              <button key={i} className={'cal-d' + (d === sel ? ' is-sel' : '') + (d === today ? ' is-today' : '') + (d < today ? ' is-past' : '')} onClick={() => setSel(d)} aria-label={`${n}: ${l.length} sessions`} aria-pressed={d === sel}>
                <span className="cal-n">{n}</span>
                {l.length > 0 && <span className="cal-bar" style={{ opacity: 0.35 + 0.65 * (l.length / max) }}>{l.length}</span>}
                {unpaid && <i className="cal-unpaid" aria-hidden />}
              </button>
            )
          })}
        </m.div>
      </AnimatePresence>
      <p className="cal-legend"><span className="cal-bar demo">3</span> sessions that day <i className="cal-unpaid" /> awaiting payment</p>
      <h4 className="x-head">{dayLabel(sel, now)}{list.length ? `, ${list.length} ${list.length === 1 ? 'session' : 'sessions'}` : ''}</h4>
      {list.length === 0 ? <p className="muted small">Nothing booked.</p> : (
        <ul className="rows cal-list">
          {list.map((a) => {
            const p = person.get(a.personId)!
            return (
              <li key={a.id}><button className="row" onClick={() => api.session(a.id)}>
                <span className="row-time">{fmtTime(a.start)}<small>{a.durationMin} min</small></span>
                <span className="row-main"><b>{p.name}</b><small>{KIND_LABEL[a.kind]}{a.status !== 'confirmed' ? `, ${STATUS_LABEL[a.status].toLowerCase()}` : ''}</small></span>
                <span className="mode-ic">{a.mode === 'online' ? <Video size={15} /> : <MapPin size={15} />}</span>
              </button></li>
            )
          })}
        </ul>
      )}
    </div>
  )
}


/** One lazily loaded entry point for every sheet body. */
export default function SheetBody({ open, close, api }: { open: NonNullable<Open>; close: () => void; api: Api }) {
  switch (open.k) {
    case 'session': return <SessionBody id={open.id} close={close} api={api} />
    case 'slots': return <SlotBody o={open} close={close} />
    case 'remedy': return <RemedyBody apptId={open.apptId} close={close} />
    case 'notices': return <NoticesBody close={close} />
    case 'add': return <AddPersonBody then={open.then} close={close} api={api} />
    case 'express': return <ExpressBody key={open.personId ?? 'pick'} personId={open.personId} close={close} api={api} />
    case 'share': return <ShareBody />
    case 'calendar': return <CalendarBody api={api} />
  }
}
