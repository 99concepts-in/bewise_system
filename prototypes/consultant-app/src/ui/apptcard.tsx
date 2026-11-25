/**
 * @module   prototype/consultant-app/ui/apptcard
 * @owner    CONSULTANT
 * Purpose:  The appointment at the top of the appointment view (owner 2026-11-25): when, type, status, fee, video link,
 *           the client's note, and one clear next step (Check in → Start → Open → Give remedy → Book the next one).
 */
import { useEffect, useRef, useState } from 'react'
import { m } from 'motion/react'
import { CalendarClock, CalendarPlus, ChevronRight, IndianRupee, Droplet, MapPin, MessageCircle, MessageSquare, Phone, Play, UserCheck, Video } from 'lucide-react'
import { useStore } from '../state/store'
import { Avatar, go, softSpring, useToast } from './kit'
import { TypeBadge } from './bits'
import { JourneyTag } from './console'
import { DEFAULT_MEET, STATUS_LABEL, feeOf, linkMessage, waLink } from '../lib/labels'
import { dayLabel, fmtTime, inr, relative } from '../lib/time'
import { MIN } from '../data/seed'
import type { PersonView } from '../lib/derive'
import type { Appt } from '../data/types'
import type { Api } from '../screens/Sheets'

export function ApptCard({ a, v, api, onRemedy }: { a: Appt; v: PersonView; api: Api; onRemedy: () => void }) {
  const { dispatch, now } = useStore()
  const toast = useToast()
  const p = v.p
  const [link, setLink] = useState(a.meetingUrl ?? '')
  const latest = useRef({ link, saved: a.meetingUrl ?? '' })
  latest.current.link = link
  useEffect(() => () => { const { link: l, saved } = latest.current; if (l.trim() !== saved) dispatch({ type: 'setLink', apptId: a.id, url: l }) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const saveLink = (value = link) => { if (value.trim() !== (a.meetingUrl ?? '')) { dispatch({ type: 'setLink', apptId: a.id, url: value }); latest.current.saved = value.trim(); toast(value.trim() ? 'Link saved. It shows in the client\'s app.' : 'Link removed') } }

  const upcoming = a.status === 'confirmed' || a.status === 'awaiting_payment' || a.status === 'checked_in'
  const soon = a.start - now < 30 * MIN
  const when = `${dayLabel(a.start, now).toLowerCase()} at ${fmtTime(a.start)}`

  let primary: JSX.Element | null = null
  if (a.status === 'confirmed' && soon) primary = <button className="btn btn-primary" onClick={() => { dispatch({ type: 'checkIn', apptId: a.id }); toast(`${p.first} ${a.mode === 'online' ? 'has joined' : 'has arrived'}. Start when you're ready.`) }}><UserCheck size={16} /> Check in</button>
  else if (a.status === 'checked_in') primary = <button className="btn btn-primary" onClick={() => go(`/session/${a.id}`)}><Play size={16} /> Start session</button>
  else if (a.status === 'in_session') primary = <button className="btn btn-primary" onClick={() => go(`/session/${a.id}`)}><Play size={16} /> Open the live session</button>
  else if (a.status === 'completed' && a.service === 'bach' && !a.remedy) primary = <button className="btn btn-primary" onClick={onRemedy}><Droplet size={16} /> Give remedy</button>
  else if (a.status === 'completed' || a.status === 'no_show') primary = <button className="btn btn-primary" onClick={() => api.newAppt({ personId: p.id, service: a.service })}><CalendarPlus size={16} /> Book the next one</button>
  else if (upcoming) primary = <button className="btn btn-quiet" disabled><Play size={16} /> Starts {relative(a.start, now)}</button>

  return (
    <m.section className="appt-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={softSpring} aria-label="Appointment">
      <button type="button" className="ac-who" onClick={() => go(`/people/${p.id}`)}>
        <Avatar name={p.name} size={52} mood={v.latestMood} layoutId={`av-${p.id}`} />
        <span className="ac-name"><b>{p.name}</b><small>{p.city}</small></span>
        <span className="ac-profile">Profile <ChevronRight size={15} /></span>
      </button>
      <div className="ac-badges"><TypeBadge service={a.service} kind={a.kind} /><JourneyTag v={v} now={now} /></div>
      <div className="ac-when">
        <div><small>{dayLabel(a.start, now)}</small><b>{fmtTime(a.start)}</b></div>
        <div><small>Length</small><b>{a.durationMin} min</b></div>
        <div><small>{a.mode === 'online' ? 'Online' : 'In person'}</small><b>{a.mode === 'online' ? <Video size={18} aria-label="Online" /> : <MapPin size={18} aria-label="In person" />}</b></div>
      </div>
      <div className={`status status-${a.status}`}>
        <span>{STATUS_LABEL[a.status]}{upcoming ? `, starts ${relative(a.start, now)}` : ''}</span>
        {a.status !== 'no_show' && <span className="fee"><IndianRupee size={12} />{inr(feeOf(a.service, a.kind)).slice(1)}{a.service === 'bach' ? ' incl. remedy' : ''}</span>}
      </div>
      {a.assignedBy && upcoming && <p className="muted small ac-assigned">Time fixed by {a.assignedBy}</p>}
      {a.note && <blockquote className="quote-note">“{a.note}”<cite>{p.first}'s note when asking</cite></blockquote>}

      {a.mode === 'online' && upcoming && (
        <div className="ac-link">
          <div className="link-edit">
            <Video size={16} aria-hidden />
            <input value={link} onChange={(e) => setLink(e.target.value)} onBlur={() => saveLink()} onKeyDown={(e) => { if (e.key === 'Enter') saveLink() }} placeholder="Paste a Google Meet or Zoom link" aria-label="Video link" inputMode="url" />
            {!link && <button className="link" onClick={() => { setLink(DEFAULT_MEET); saveLink(DEFAULT_MEET) }}>Use my room</button>}
          </div>
          {link && <a className="btn btn-quiet btn-sm" href={waLink(p.phone, linkMessage(p.first, when, link))} target="_blank" rel="noreferrer" onClick={() => saveLink()}><MessageCircle size={15} /> Share link on WhatsApp</a>}
        </div>
      )}

      {primary && <div className="ac-primary">{primary}</div>}
      <div className="ac-actions">
        {upcoming && <button className="btn btn-quiet btn-sm" onClick={() => api.reschedule(a.id)}><CalendarClock size={15} /> Move</button>}
        <button className="btn btn-quiet btn-sm" onClick={() => go(`/messages/${p.id}`)}><MessageSquare size={15} /> Message</button>
        <a className="btn btn-quiet btn-sm" href={`tel:${p.phone.replace(/\s/g, '')}`}><Phone size={15} /> Call</a>
        <a className="btn btn-quiet btn-sm" href={waLink(p.phone, `Namaste ${p.first}, this is Jitendra Khimlani from BeWise. `)} target="_blank" rel="noreferrer"><MessageCircle size={15} /> WhatsApp</a>
      </div>
    </m.section>
  )
}
