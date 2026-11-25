/**
 * @screens CN-09 CN-10 CN-14 CN-15 CN-19 CN-28 — every bottom-sheet body, loaded lazily (and prefetched on idle).
 */
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { Copy, Share2, ChevronLeft, Check, ArrowLeft, Zap, UserPlus, Search, ChevronRight, Leaf, MapPin, MessageCircle, MessageSquare, Phone, Star, Video, BellRing, PackageCheck, CalendarPlus, ClipboardCheck, IndianRupee, Repeat, Inbox, Brain, Flower2 } from 'lucide-react'
import { durationOf, useIndex, useStore } from '../state/store'
import { parseDob } from '../lib/loshu'
import { Avatar, Chip, Segmented, go, softSpring, spring, useToast } from '../ui/kit'
import { dayLabel, fmtDay, fmtShort, fmtTime, relative, inr } from '../lib/time'
import { freeTimes, nextDays, nextFreeAny } from '../lib/slots'
import { FLOWERS, startOfDay } from '../data/seed'
import { suggestFlowers } from '../lib/derive'
import { Suggestions } from '../ui/care'
import { TypeBadge } from '../ui/bits'
import { type Appt, type Kind, type Mode, type Person, type Service } from '../data/types'

import { DEFAULT_MEET, FEE, STATUS_LABEL, feeOf, typeLabel, BOOKING_LINK } from '../lib/labels'
import type { Api, Open } from './Sheets'

// ---------------------------------------------------------------- time picker (his timings are never fixed: any time 7 AM–10 PM, clashes blocked)
function TimePicker({ duration, value, onChange, ignoreId }: { duration: number; value: number | null; onChange: (t: number) => void; ignoreId?: string }) {
  const { s, now } = useStore()
  const days = useMemo(() => nextDays(now, 15), [now])
  const counts = useMemo(() => days.map((d) => freeTimes(d, duration, s.appts, now, ignoreId).filter((x) => x.free).length), [days, duration, s.appts, now, ignoreId])
  const [day, setDay] = useState(() => value ? startOfDay(value) : days[Math.max(0, counts.findIndex((c) => c > 0))])
  const times = useMemo(() => freeTimes(day, duration, s.appts, now, ignoreId), [day, duration, s.appts, now, ignoreId])
  const quick = useMemo(() => nextFreeAny(duration, s.appts.filter((a) => a.id !== ignoreId), now, 3), [duration, s.appts, now, ignoreId])
  const groups: [string, number, number][] = [['Morning', 7, 12], ['Afternoon', 12, 17], ['Evening', 17, 22]]
  return (
    <div className="tp">
      {quick.length > 0 && (
        <div className="tp-quick"><span className="muted small"><Zap size={13} /> Express</span>
          {quick.map((t) => <button key={t} className={'chip' + (value === t ? ' is-on' : '')} onClick={() => { setDay(startOfDay(t)); onChange(t) }}>{dayLabel(t, now)}, {fmtTime(t)}</button>)}
        </div>
      )}
      <div className="daystrip" role="listbox" aria-label="Day">
        {days.map((d, i) => (
          <button key={d} role="option" aria-selected={d === day} disabled={counts[i] === 0} className={'day' + (d === day ? ' is-on' : '')} onClick={() => setDay(d)}>
            {d === day && <m.span layoutId="day-pill" className="day-pill" transition={spring} />}
            <span className="day-wd">{i === 0 ? 'Today' : new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(d)}</span>
            <span className="day-n">{new Date(d).getDate()}</span>
            <span className="day-c">{counts[i] ? `${counts[i]} free` : 'full'}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={day + '-' + duration} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
          {groups.map(([label, h0, h1]) => {
            const list = times.filter(({ t }) => { const h = new Date(t).getHours(); return h >= h0 && h < h1 })
            if (!list.length) return null
            return (
              <div key={label} className="tp-group">
                <h5>{label}</h5>
                <div className="slot-grid tp-grid">
                  {list.map(({ t, free }) => (
                    <button key={t} className={'slot' + (value === t ? ' is-on' : '') + (free ? '' : ' is-taken')} disabled={!free} onClick={() => onChange(t)} aria-pressed={value === t} aria-label={`${fmtTime(t)}${free ? '' : ', taken'}`}>{fmtTime(t).replace(' AM', '').replace(' PM', '')}</button>
                  ))}
                </div>
              </div>
            )
          })}
          {times.length === 0 && <p className="muted small">No times left today. Pick another day.</p>}
        </m.div>
      </AnimatePresence>
    </div>
  )
}

function SlotBody({ o, close }: { o: Extract<Open, { k: 'slots' }>; close: () => void }) {
  const { s, dispatch, now } = useStore()
  const { person } = useIndex()
  const toast = useToast()
  const appt = s.appts.find((x) => x.id === o.apptId)!
  const p = person.get(appt.personId)!
  const [pick, setPick] = useState<number | null>(null)
  return (
    <div className="slots">
      <h3 className="sheet-title">Move {p.first}'s session</h3>
      <p className="muted small">Currently {dayLabel(appt.start, now).toLowerCase()} at {fmtTime(appt.start)}. {p.first} gets the new time on WhatsApp and in the app.</p>
      <TimePicker duration={appt.durationMin} value={pick} onChange={setPick} ignoreId={appt.id} />
      <button className="btn btn-primary btn-block" disabled={pick === null} onClick={() => { if (pick === null) return; dispatch({ type: 'reschedule', apptId: appt.id, start: pick }); toast(`Moved to ${dayLabel(pick, now)}, ${fmtTime(pick)}. ${p.first} will be told.`); close() }}>
        {pick === null ? 'Pick a time' : `Move to ${dayLabel(pick, now).toLowerCase()}, ${fmtTime(pick)}`}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------- give remedy
function RemedyBody({ apptId, personId, close }: { apptId?: string; personId: string; close: () => void }) {
  const { s, dispatch, now } = useStore()
  const { person, byPerson } = useIndex()
  const toast = useToast()
  const a = apptId ? s.appts.find((x) => x.id === apptId) : undefined
  const p = person.get(a?.personId ?? personId)!
  const all = byPerson.get(p.id) ?? []
  const lastFlowers = [...all.filter((x) => x.remedy && x.id !== a?.id).map((x) => x.remedy!), ...(p.remedies ?? [])].sort((x, y) => x.givenAt - y.givenAt).at(-1)?.flowers
  const [picked, setPicked] = useState<string[]>(lastFlowers ?? [])
  const [q, setQ] = useState('')
  const history = all.filter((x) => x.id !== a?.id && x.start < (a?.start ?? now))
  const suggestions = useMemo(() => suggestFlowers(p, history, a?.troubling ?? []), [p, history.length, a?.troubling]) // eslint-disable-line react-hooks/exhaustive-deps
  const list = FLOWERS.filter((f) => f.toLowerCase().includes(q.toLowerCase()))
  const toggle = (f: string) => setPicked((x) => x.includes(f) ? x.filter((y) => y !== f) : [...x, f])
  const give = () => {
    if (a) dispatch({ type: 'giveRemedy', apptId: a.id, flowers: picked, now: Date.now() })
    else dispatch({ type: 'giveRemedyBetween', personId: p.id, id: `rm${Date.now()}`, flowers: picked, now: Date.now() })
    toast(`${a ? 'Remedy given' : 'Remedy created'}. The office is preparing ${p.first}'s bottle.`)
    close()
  }
  return (
    <div className="remedy">
      <h3 className="sheet-title">{a ? `Give ${p.first}'s remedy` : `New remedy for ${p.first}`}</h3>
      <p className="muted small">{a ? `Session ${dayLabel(a.start, now).toLowerCase()} at ${fmtTime(a.start)}. Included in the ${inr(FEE[a.kind])} fee.` : 'Between sessions: a refill or a changed blend. The office prepares and sends it.'}{lastFlowers ? ' Started from the last blend.' : ''}</p>
      <Suggestions first={p.first} items={suggestions} picked={picked} onToggle={toggle} onAddAll={() => setPicked((x) => [...new Set([...x, ...suggestions.slice(0, 5).map((s) => s.flower)])])} />
      <h4 className="blend-head">{p.first}'s blend{picked.length ? `, ${picked.length} ${picked.length === 1 ? 'flower' : 'flowers'}` : ''}</h4>
      <div className="blend">
        <AnimatePresence initial={false}>
          {picked.map((f) => (
            <m.button layout key={f} className="tag tag-sage tag-x" onClick={() => toggle(f)} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={spring} aria-label={`Remove ${f}`}>{f} ×</m.button>
          ))}
        </AnimatePresence>
        {picked.length === 0 && <span className="muted small">Tap flowers below to add them.</span>}
      </div>
      <p className="dosage"><b>4 drops, 4 times a day</b> for 3 weeks, 30 ml bottle</p>
      <input className="search" placeholder="Add any other flower: search 38 and Rescue Remedy" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search flowers" />
      <div className="flower-list">
        {list.map((f) => <Chip key={f} active={picked.includes(f)} onClick={() => toggle(f)}>{f}</Chip>)}
      </div>
      <button className="btn btn-primary btn-block" disabled={!picked.length} onClick={give}>
        <Leaf size={16} /> {a ? 'Give remedy' : 'Create remedy'} with {picked.length} {picked.length === 1 ? 'flower' : 'flowers'}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------- notices
const NOTICE_ICON = { booked: CalendarPlus, rescheduled: Repeat, feedback: Star, delivered: PackageCheck, payment: IndianRupee, checkin: ClipboardCheck, request: Inbox, message: MessageSquare }
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
  const [dob, setDob] = useState('')
  const [touched, setTouched] = useState(false)
  const digits = phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')
  const nameErr = name.trim().length < 2 ? 'Enter their name.' : null
  const phoneErr = !/^[6-9]\d{9}$/.test(digits) ? 'Enter a 10-digit mobile number.' : null
  const dup = !phoneErr ? s.people.find((p) => p.phone.replace(/\D/g, '').endsWith(digits)) : undefined
  const dobErr = dob && (!parseDob(dob) || dob > new Date().toISOString().slice(0, 10)) ? 'Check the date of birth.' : null

  const save = (next: 'profile' | 'express') => {
    setTouched(true)
    if (nameErr || phoneErr || dup || dobErr) return
    const clean = name.trim().replace(/\s+/g, ' ')
    const person: Person = {
      id: `n${Date.now()}`, name: clean.replace(/\b\w/g, (c) => c.toUpperCase()), first: clean.split(' ')[0].replace(/^\w/, (c) => c.toUpperCase()),
      pronoun, city: city.trim() || 'Vadodara', phone: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`, joinedAt: Date.now(), moods: [], ...(dob ? { dob } : {}),
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
      <label className="field"><span>Date of birth <small className="muted">(optional, for the Lo Shu grid)</small></span>
        <input type="date" value={dob} max={new Date().toISOString().slice(0, 10)} min="1920-01-01" onChange={(e) => setDob(e.target.value)} aria-invalid={!!dobErr} />
        {dobErr && <small className="err">{dobErr}</small>}
      </label>
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
function greetingFor(p: Person, start: number, service: Service, kind: Kind, mode: Mode, url: string | undefined, now: number) {
  const when = `${dayLabel(start, now) === 'Today' || dayLabel(start, now) === 'Tomorrow' ? dayLabel(start, now).toLowerCase() + ', ' + fmtShort(start) : fmtDay(start)} at ${fmtTime(start)}`
  const what = service === 'scanning' ? 'Scanning session' : kind === 'first' ? 'first Bach flower consultation' : 'Bach flower follow-up'
  return [
    `Namaste ${p.first} 🙏`,
    `This is Jitu Bhaiya from BeWise. Your ${what} is fixed for ${when}, ${mode === 'online' ? 'online' : 'at the studio in Alkapuri, Vadodara'}.`,
    mode === 'online' ? (url ? `Join here: ${url}` : 'The video link comes with your reminder.') : '',
    service === 'bach' && kind === 'first' ? 'Before we meet, please fill the short intake form in the BeWise app.' : 'Looking forward to seeing you.',
  ].filter(Boolean).join('\n\n')
}

interface Draft { p: Person; start: number; service: Service; kind: Kind; mode: Mode; url?: string; requestId?: string }
function ConfirmBooking({ d, onBack, close }: { d: Draft; onBack: () => void; close: () => void }) {
  const { dispatch, now } = useStore()
  const { p, start, service, kind, mode, url, requestId } = d
  const [msg, setMsg] = useState(() => greetingFor(p, start, service, kind, mode, url, now))
  const [stage, setStage] = useState<'review' | 'sending' | 'done'>('review')
  const send = () => {
    dispatch({ type: 'book', personId: p.id, start, service, kind, mode, meetingUrl: url, id: `b${Date.now()}`, now: Date.now(), greeting: msg, by: 'Jitu Bhaiya', requestId })
    setStage('sending')
    setTimeout(() => setStage('done'), 1500)
  }
  const steps = [
    { label: `${p.first} got the time on WhatsApp and in the app`, on: stage !== 'review' },
    ...(mode === 'online' ? [{ label: url ? 'Video link shared with the time' : 'Video link to add before the session', on: stage !== 'review' && !!url }] : []),
    { label: stage === 'done' ? 'Payment link sent automatically' : 'Sending the payment link automatically', on: stage === 'done' },
  ]
  if (stage !== 'review') return (
    <div className="confirm-done">
      <m.div className="done-badge" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={softSpring}><img src="./img/owl-wave.webp" width={96} height={96} alt="" /></m.div>
      <h3 className="sheet-title">{p.first} is booked</h3>
      <ol className="done-steps">
        {steps.map((st, i) => (
          <m.li key={i} className={st.on ? 'on' : ''} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.1 + i * 0.12 }}>
            <span className="ds-dot">{st.on ? <Check size={13} strokeWidth={3} /> : <span className="ds-spin" />}</span>{st.label}
          </m.li>
        ))}
      </ol>
      <p className="muted small">Nothing else to send. BeWise sends the payment link and the reminders.</p>
      <button className="btn btn-primary btn-block" onClick={close}>Done</button>
    </div>
  )
  return (
    <div className="confirm">
      <button className="link back-link" onClick={onBack}><ArrowLeft size={15} /> Change</button>
      <h3 className="sheet-title">Greet and confirm</h3>
      <div className="confirm-summary">
        <Avatar name={p.name} size={44} />
        <span><b>{p.name}</b><TypeBadge service={service} kind={kind} /><small>{dayLabel(start, now)} at {fmtTime(start)}, {mode === 'online' ? 'online' : 'in person'}</small></span>
        <span className="confirm-fee">{inr(feeOf(service, kind))}</span>
      </div>
      <label className="field"><span>Your greeting on WhatsApp</span>
        <textarea className="wa-bubble" value={msg} onChange={(e) => setMsg(e.target.value)} rows={7} />
      </label>
      <p className="auto-note"><IndianRupee size={14} /> After you confirm, {p.first} sees the time in the BeWise app too, and BeWise sends the payment link automatically.</p>
      <button className="btn btn-primary btn-block" disabled={msg.trim().length < 5} onClick={send}><MessageCircle size={16} /> Confirm and greet {p.first}</button>
    </div>
  )
}

// ---------------------------------------------------------------- new appointment (Jitu Bhaiya or the team): type → person → online/link → any time → greet
function NewApptBody({ o, close, api }: { o: Extract<Open, { k: 'new' }>; close: () => void; api: Api }) {
  const { s, now } = useStore()
  const { person, byPerson } = useIndex()
  const req = o.requestId ? s.requests.find((r) => r.id === o.requestId) : undefined
  const [service, setService] = useState<Service | undefined>(req?.service ?? o.service)
  const [pid, setPid] = useState<string | undefined>(req?.personId ?? o.personId)
  const [q, setQ] = useState('')
  const p = pid ? person.get(pid) : undefined
  const returning = p ? (byPerson.get(p.id) ?? []).some((a) => a.status === 'completed' && a.service === (service ?? 'bach')) : false
  const kind: Kind = req?.kind ?? (returning ? 'followup' : 'first')
  const [mode, setMode] = useState<Mode>(req?.mode ?? 'online')
  const [url, setUrl] = useState(DEFAULT_MEET)
  const [start, setStart] = useState<number | null>(null)
  const [confirm, setConfirm] = useState(false)
  const duration = durationOf(service ?? 'bach', kind)

  if (confirm && p && service && start !== null) return <ConfirmBooking d={{ p, start, service, kind, mode, url: mode === 'online' ? url.trim() || undefined : undefined, requestId: req?.id }} onBack={() => setConfirm(false)} close={close} />

  const head = req && p && (
    <div className="req-head">
      <span><b>{p.first} asked {relative(req.at, now)}</b><small>Prefers: {req.preferred}</small>{req.note && <em>“{req.note}”</em>}</span>
      <a className="btn btn-quiet btn-sm" href={`tel:${p.phone.replace(/\s/g, '')}`}><Phone size={15} /> Call</a>
    </div>
  )

  if (!service) return (
    <div className="na">
      <h3 className="sheet-title">New appointment</h3>
      <p className="muted small">What is it for?</p>
      <div className="svc-pick">
        <button className="svc svc-bach" onClick={() => setService('bach')}><Flower2 size={26} /><b>Bach flower remedy</b><small>Consultation, then a remedy</small></button>
        <button className="svc svc-scanning" onClick={() => setService('scanning')}><Brain size={26} /><b>Scanning</b><small>Intuitive session, your notes only</small></button>
      </div>
    </div>
  )

  if (!p) {
    const ql = q.trim().toLowerCase()
    const matches = ql ? s.people.filter((x) => x.name.toLowerCase().includes(ql) || x.phone.replace(/\s/g, '').includes(ql.replace(/\s/g, ''))).slice(0, 6) : []
    return (
      <div className="na">
        <button className="link back-link" onClick={() => setService(undefined)}><ArrowLeft size={15} /> <TypeBadge service={service} /></button>
        <h3 className="sheet-title">Who is it for?</h3>
        <div className="search-wrap"><Search size={18} aria-hidden /><input className="search" autoFocus placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search people" /></div>
        <ul className="pick-list">
          {matches.map((x) => (
            <li key={x.id}><button className="row" onClick={() => setPid(x.id)}><Avatar name={x.name} size={38} /><span className="row-main"><b>{x.name}</b><small>{x.city}, {x.phone}</small></span><ChevronRight size={16} /></button></li>
          ))}
          {ql && matches.length === 0 && <li className="muted small pad">No one matches “{q}”.</li>}
        </ul>
        <button className="btn btn-quiet btn-block" onClick={() => api.addPerson('express')}><UserPlus size={16} /> Add someone new</button>
      </div>
    )
  }

  return (
    <div className="na">
      {!req && <button className="link back-link" onClick={() => (o.personId ? setService(undefined) : setPid(undefined))}><ArrowLeft size={15} /> Change</button>}
      <h3 className="sheet-title">{req ? `Assign a time for ${p.first}` : `Book ${p.first}`}</h3>
      {head}
      <div className="na-type"><TypeBadge service={service} kind={kind} big /><span className="muted small">{duration} min, {inr(feeOf(service, kind))}</span></div>
      <Segmented id="na-mode" value={mode} onChange={setMode} options={[{ value: 'online', label: 'Online' }, { value: 'in_person', label: 'In person' }]} />
      {mode === 'online' && (
        <label className="field"><span>Video link (sent to {p.first} on WhatsApp and in the app)</span>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a Google Meet or Zoom link" inputMode="url" />
        </label>
      )}
      <TimePicker duration={duration} value={start} onChange={setStart} />
      <button className="btn btn-primary btn-block" disabled={start === null} onClick={() => setConfirm(true)}>
        {start === null ? 'Pick a time' : `Continue with ${dayLabel(start, now).toLowerCase()}, ${fmtTime(start)}`}
      </button>
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
    import('qrcode').then((Q) => Q.toDataURL(BOOKING_LINK, { margin: 1, width: 360, color: { dark: '#182957', light: '#FFFFFF' } })).then((u) => { if (live) setQr(u) }).catch(() => {})
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
          ? <button className="btn btn-primary" onClick={() => navigator.share({ title: 'Book with Jitu Bhaiya', text: SHARE_MSGS[kind].text, url: BOOKING_LINK }).catch(() => {})}><Share2 size={16} /> Share</button>
          : <button className="btn btn-primary" onClick={() => copy(msg, 'Message copied')}><Copy size={16} /> Copy message</button>}
      </div>
      <div className="qr">
        {qr ? <m.img src={qr} width={180} height={180} alt="QR code for your booking link" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={softSpring} /> : <span className="qr-ph" />}
        <div><b>QR code</b><p className="muted small">Show it at workshops or keep it at the studio desk. People scan and book.</p>
          {qr && <a className="link" href={qr} download="jitu-bhaiya-booking-qr.png">Download QR</a>}</div>
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
                <span className="row-main"><b>{p.name}</b><small>{typeLabel(a)}{a.status !== 'confirmed' ? `, ${STATUS_LABEL[a.status].toLowerCase()}` : ''}</small></span>
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
    case 'slots': return <SlotBody o={open} close={close} />
    case 'remedy': return <RemedyBody apptId={open.apptId} personId={open.personId} close={close} />
    case 'notices': return <NoticesBody close={close} />
    case 'add': return <AddPersonBody then={open.then} close={close} api={api} />
    case 'new': return <NewApptBody key={(open.requestId ?? '') + (open.personId ?? '') + (open.service ?? '')} o={open} close={close} api={api} />
    case 'share': return <ShareBody />
    case 'calendar': return <CalendarBody api={api} />
  }
}
