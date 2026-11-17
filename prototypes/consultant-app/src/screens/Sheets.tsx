import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { ChevronRight, CalendarClock, Leaf, MapPin, MessageCircle, Phone, Play, Star, Video, BellRing, PackageCheck, CalendarPlus, ClipboardCheck, IndianRupee, Repeat } from 'lucide-react'
import { useIndex, useStore } from '../state/store'
import { Avatar, Chip, Segmented, Sheet, go, spring, useToast } from '../ui/kit'
import { dayLabel, fmtDay, fmtShort, fmtTime, relative, inr } from '../lib/time'
import { nextDays, slotsForDay } from '../lib/slots'
import { CONCERNS, FLOWERS, MIN, startOfDay } from '../data/seed'
import type { Appt, Kind, Mode } from '../data/types'

type Open =
  | { k: 'session'; id: string }
  | { k: 'slots'; mode: 'reschedule'; apptId: string }
  | { k: 'slots'; mode: 'book'; personId: string }
  | { k: 'remedy'; apptId: string }
  | { k: 'notices' }
  | null

interface Api {
  session: (id: string) => void
  reschedule: (apptId: string) => void
  book: (personId: string) => void
  remedy: (apptId: string) => void
  notices: () => void
}
const C = createContext<Api | null>(null)
export const useSheets = () => useContext(C)!

export const FEE: Record<Kind, number> = { first: 1000, followup: 800 }
export const KIND_LABEL: Record<Kind, string> = { first: 'First consultation', followup: 'Follow-up' }
export const STATUS_LABEL: Record<Appt['status'], string> = {
  awaiting_payment: 'Awaiting payment', confirmed: 'Confirmed', in_session: 'In session', completed: 'Completed', no_show: 'No-show',
}

export function waLink(phone: string, text: string) {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
}

export function SheetsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<Open>(null)
  const close = useCallback(() => setOpen(null), [])
  const api = useMemo<Api>(() => ({
    session: (id) => setOpen({ k: 'session', id }),
    reschedule: (apptId) => setOpen({ k: 'slots', mode: 'reschedule', apptId }),
    book: (personId) => setOpen({ k: 'slots', mode: 'book', personId }),
    remedy: (apptId) => setOpen({ k: 'remedy', apptId }),
    notices: () => setOpen({ k: 'notices' }),
  }), [])
  return (
    <C.Provider value={api}>
      {children}
      <Sheet open={open?.k === 'session'} onClose={close} label="Session details">
        {open?.k === 'session' && <SessionBody id={open.id} close={close} api={api} />}
      </Sheet>
      <Sheet open={open?.k === 'slots'} onClose={close} label="Pick a time">
        {open?.k === 'slots' && <SlotBody o={open} close={close} />}
      </Sheet>
      <Sheet open={open?.k === 'remedy'} onClose={close} label="Give remedy">
        {open?.k === 'remedy' && <RemedyBody apptId={open.apptId} close={close} />}
      </Sheet>
      <Sheet open={open?.k === 'notices'} onClose={close} label="Updates">
        {open?.k === 'notices' && <NoticesBody close={close} />}
      </Sheet>
    </C.Provider>
  )
}

// ---------------------------------------------------------------- session details
function SessionBody({ id, close, api }: { id: string; close: () => void; api: Api }) {
  const { s, dispatch, now } = useStore()
  const { person } = useIndex()
  const toast = useToast()
  const a = s.appts.find((x) => x.id === id)
  if (!a) return null
  const p = person.get(a.personId)!
  const upcoming = a.status === 'confirmed' || a.status === 'awaiting_payment'
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

      {a.note && <blockquote className="quote-note">“{a.note}”<cite>{p.first}'s note when booking</cite></blockquote>}

      {a.troubling && (
        <section className="sd-sec"><h4>What was troubling {p.pronoun === 'she' ? 'her' : 'him'}</h4>
          <div className="chips-wrap">{a.troubling.map((t) => <span key={t} className="tag">{t}</span>)}</div></section>
      )}
      {a.remedy && (
        <section className="sd-sec"><h4><Leaf size={15} /> Remedy given {fmtShort(a.remedy.givenAt)}</h4>
          <div className="chips-wrap">{a.remedy.flowers.map((f) => <span key={f} className="tag tag-sage">{f}</span>)}</div></section>
      )}
      {a.rating && (
        <section className="sd-sec"><h4>{p.first}'s feedback</h4>
          <div className="stars" aria-label={`${a.rating} out of 5`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} size={16} className={i < a.rating! ? 'on' : ''} />)}</div>
          {a.feedback && <p className="kind-small">“{a.feedback}”</p>}</section>
      )}

      <div className="sd-actions">
        {upcoming && <>
          <button className="btn btn-primary" disabled={!startsSoon} onClick={() => { dispatch({ type: 'start', apptId: a.id }); toast(`Session with ${p.first} started`); close() }}>
            <Play size={16} /> {startsSoon ? 'Start session' : `Starts ${relative(a.start, now)}`}
          </button>
          <div className="btn-row">
            <button className="btn btn-quiet" onClick={() => api.reschedule(a.id)}><CalendarClock size={16} /> Reschedule</button>
            <a className="btn btn-quiet" href={waLink(p.phone, `Namaste ${p.first}, this is Jitu Bhaiya from BeWise. `)} target="_blank" rel="noreferrer"><MessageCircle size={16} /> WhatsApp</a>
            <a className="btn btn-quiet" href={`tel:${p.phone.replace(/\s/g, '')}`}><Phone size={16} /> Call</a>
          </div>
        </>}
        {a.status === 'completed' && !a.remedy && <button className="btn btn-primary" onClick={() => api.remedy(a.id)}><Leaf size={16} /> Give remedy</button>}
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

  const confirm = () => {
    if (pick === null) return
    if (appt) { dispatch({ type: 'reschedule', apptId: appt.id, start: pick }); toast(`Moved to ${dayLabel(pick, now)}, ${fmtTime(pick)}. ${p.first} will be told.`) }
    else { dispatch({ type: 'book', personId, start: pick, kind, mode, id: `b${Date.now()}`, now }); toast(`Booked. Payment link sent to ${p.first}.`) }
    close()
  }

  return (
    <div className="slots">
      <h3 className="sheet-title">{appt ? `Move ${p.first}'s session` : `Book ${p.first}`}</h3>
      {appt && <p className="muted small">Currently {dayLabel(appt.start, now).toLowerCase()} at {fmtTime(appt.start)}. Moving it doesn't use up {p.pronoun === 'she' ? 'her' : 'his'} free reschedules.</p>}
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
        {pick === null ? 'Pick a time' : appt ? `Move to ${fmtTime(pick)}` : `Book ${fmtTime(pick)} and send payment link`}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------- give remedy
function RemedyBody({ apptId, close }: { apptId: string; close: () => void }) {
  const { s, dispatch, now } = useStore()
  const { person, byPerson } = useIndex()
  const toast = useToast()
  const a = s.appts.find((x) => x.id === apptId)!
  const p = person.get(a.personId)!
  const last = [...(byPerson.get(p.id) ?? [])].reverse().find((x) => x.remedy && x.id !== a.id)
  const [picked, setPicked] = useState<string[]>(last?.remedy?.flowers ?? [])
  const [q, setQ] = useState('')
  const list = FLOWERS.filter((f) => f.toLowerCase().includes(q.toLowerCase()))
  const toggle = (f: string) => setPicked((x) => x.includes(f) ? x.filter((y) => y !== f) : [...x, f])
  return (
    <div className="remedy">
      <h3 className="sheet-title">{p.first}'s blend</h3>
      <p className="muted small">Session {dayLabel(a.start, now).toLowerCase()} at {fmtTime(a.start)}. Included in the {inr(FEE[a.kind])} fee.{last ? ' Started from the last blend.' : ''}</p>
      <div className="blend">
        <AnimatePresence initial={false}>
          {picked.map((f) => (
            <m.button layout key={f} className="tag tag-sage tag-x" onClick={() => toggle(f)} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={spring} aria-label={`Remove ${f}`}>{f} ×</m.button>
          ))}
        </AnimatePresence>
        {picked.length === 0 && <span className="muted small">Tap flowers below to add them.</span>}
      </div>
      <p className="dosage"><b>4 drops, 4 times a day</b> for 3 weeks, 30 ml bottle</p>
      <input className="search" placeholder="Search 38 flowers and Rescue Remedy" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search flowers" />
      <div className="flower-list">
        {list.map((f) => <Chip key={f} active={picked.includes(f)} onClick={() => toggle(f)}>{f}</Chip>)}
      </div>
      <button className="btn btn-primary btn-block" disabled={!picked.length} onClick={() => { dispatch({ type: 'giveRemedy', apptId, flowers: picked, now: Date.now() }); toast(`Remedy given. The office is preparing ${p.first}'s bottle.`); close() }}>
        <Leaf size={16} /> Give remedy · {picked.length} {picked.length === 1 ? 'flower' : 'flowers'}
      </button>
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

export const ALL_CONCERNS = CONCERNS
export { startOfDay }
