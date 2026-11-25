/**
 * Messages (owner 2026-11-20): clients chat with Jitendra Khimlani in the BeWise app. Inbox + conversation.
 * Live: a new messaging module (request filed) — client UI by CLIENT, this side by CONSULTANT.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { ArrowLeft, CalendarPlus, Phone, Search, Send, UserRound } from 'lucide-react'
import { useIndex, useStore } from '../state/store'
import { AppHeader, Avatar, Empty, go, spring, useMedia } from '../ui/kit'
import { TypeBadge } from '../ui/bits'
import { useSheets } from './Sheets'
import { personView } from '../lib/derive'
import { fmtTime, relative, dayLabel } from '../lib/time'
import { startOfDay } from '../data/seed'
import type { Thread } from '../data/types'

const QUICK = [
  'Thank you for telling me 🙏 Let us talk about it in your session.',
  'Keep taking 4 drops, 4 times a day. Small steps every day 🌿',
  'Please keep taking your medicines exactly as your doctor advised.',
  'Your remedy is ending soon. Shall we fix a follow-up?',
]
export const unreadOf = (t: Thread) => t.messages.filter((x) => x.from === 'client' && x.at > t.readAt).length

export default function Messages({ pid }: { pid?: string }) {
  const wide = useMedia('(min-width: 1100px)')
  if (wide) return (
    <div className="screen msg-split">
      <Inbox active={pid} />
      {pid ? <Conversation pid={pid} key={pid} /> : <div className="msg-empty"><Empty img="owl-read" title="Pick a conversation" body="Messages from people appear here. Replies reach them in the BeWise app." /></div>}
    </div>
  )
  return <div className="screen">{pid ? <Conversation pid={pid} key={pid} /> : <><AppHeader /><Inbox /></>}</div>
}

function Inbox({ active }: { active?: string }) {
  const { s, now } = useStore()
  const { person } = useIndex()
  const [q, setQ] = useState('')
  const threads = useMemo(() => [...s.threads].sort((a, b) => (b.messages.at(-1)?.at ?? 0) - (a.messages.at(-1)?.at ?? 0)), [s.threads])
  const ql = q.trim().toLowerCase()
  const list = threads.filter((t) => !ql || person.get(t.personId)?.name.toLowerCase().includes(ql))
  const unread = threads.reduce((n, t) => n + unreadOf(t), 0)
  return (
    <section className="inbox" aria-label="Conversations">
      <h1 className="page-title">Messages{unread > 0 && <span className="title-count">{unread} unread</span>}</h1>
      <div className="search-wrap"><Search size={18} aria-hidden /><input className="search" placeholder="Search people" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search conversations" /></div>
      {list.length === 0 && <Empty img="owl-read" title="No conversations yet" body="When people write to you in the app, their messages show here." />}
      <ul className="rows inbox-list">
        {list.map((t) => {
          const p = person.get(t.personId)
          if (!p) return null
          const last = t.messages.at(-1)!
          const n = unreadOf(t)
          return (
            <li key={t.personId}>
              <button className={'row' + (n ? ' is-unread' : '') + (active === t.personId ? ' is-active' : '')} onClick={() => go(`/messages/${t.personId}`)}>
                <Avatar name={p.name} size={46} mood={p.moods.at(-1)?.mood} />
                <span className="row-main"><b>{p.name}</b><small>{last.from === 'jb' ? 'You: ' : ''}{last.text}</small></span>
                <span className="row-end inbox-end"><small>{startOfDay(last.at) === startOfDay(now) ? fmtTime(last.at) : dayLabel(last.at, now)}</small>{n > 0 && <span className="unread-dot" aria-label={`${n} unread`}>{n}</span>}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Conversation({ pid }: { pid: string }) {
  const { s, dispatch, now } = useStore()
  const { person, byPerson } = useIndex()
  const sheets = useSheets()
  const p = person.get(pid)
  const t = s.threads.find((x) => x.personId === pid)
  const [text, setText] = useState(() => {
    try { return sessionStorage.getItem(`draft:${pid}`) ?? '' } catch { return '' }
  })
  const end = useRef<HTMLDivElement>(null)
  const v = useMemo(() => p && personView(p, byPerson.get(p.id), now), [p, byPerson, now])
  useEffect(() => { if (t && unreadOf(t)) dispatch({ type: 'readThread', personId: pid, now: Date.now() }) }, [t, pid, dispatch])
  useLayoutEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [t?.messages.length])
  useEffect(() => { try { sessionStorage.setItem(`draft:${pid}`, text) } catch { /* ignore */ } }, [pid, text])
  if (!p || !v) return <Empty img="owl-read" title="Conversation not found" body="This person may have been removed." action={<button className="btn btn-quiet" onClick={() => go('/messages')}>All messages</button>} />

  const send = (body = text) => {
    if (!body.trim()) return
    dispatch({ type: 'send', personId: pid, text: body, now: Date.now() })
    setText('')
  }
  let lastDay = 0
  return (
    <section className="convo" aria-label={`Conversation with ${p.name}`}>
      <header className="convo-top">
        <button className="icon-btn" onClick={() => go('/messages')} aria-label="All messages"><ArrowLeft size={20} /></button>
        <button className="convo-who" onClick={() => go(`/people/${p.id}`)}>
          <Avatar name={p.name} size={40} mood={v.latestMood} />
          <span><b>{p.name}</b><small><TypeBadge service={v.service} /></small></span>
        </button>
        <a className="icon-btn sm" href={`tel:${p.phone.replace(/\s/g, '')}`} aria-label={`Call ${p.first}`}><Phone size={16} /></a>
        <button className="icon-btn sm" onClick={() => sheets.newAppt({ personId: p.id, service: v.service })} aria-label={`Book ${p.first}`}><CalendarPlus size={16} /></button>
        <button className="icon-btn sm" onClick={() => go(`/people/${p.id}`)} aria-label="Profile"><UserRound size={16} /></button>
      </header>
      <div className="bubbles" role="log" aria-live="polite">
        {!t && <p className="muted small convo-hint">Start the conversation. {p.first} sees your message in the BeWise app and gets a notification.</p>}
        <AnimatePresence initial={false}>
          {t?.messages.map((msg) => {
            const d = startOfDay(msg.at)
            const sep = d !== lastDay ? (lastDay = d, <div className="day-sep" key={'d' + msg.id}><span>{dayLabel(msg.at, now)}</span></div>) : null
            return [sep, (
              <m.div key={msg.id} className={'bubble ' + (msg.from === 'jb' ? 'b-me' : 'b-them')} initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring}>
                <p>{msg.text}</p><time>{fmtTime(msg.at)}</time>
              </m.div>
            )]
          })}
        </AnimatePresence>
        <div ref={end} />
      </div>
      <div className="quick-replies" role="list" aria-label="Quick replies">
        {QUICK.map((qr) => <button key={qr} role="listitem" className="chip" onClick={() => setText(qr)}>{qr.length > 34 ? qr.slice(0, 32) + '…' : qr}</button>)}
      </div>
      <form className="composer" onSubmit={(e) => { e.preventDefault(); send() }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} placeholder={`Message ${p.first}…`} aria-label={`Message ${p.first}`}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) { e.preventDefault(); send() } }} />
        <m.button type="submit" className="send" disabled={!text.trim()} whileTap={{ scale: 0.9 }} aria-label="Send"><Send size={18} /></m.button>
      </form>
      {t?.messages.some((x) => x.from === 'client') && <p className="muted small convo-foot">Last message from {p.first} {relative(Math.max(...t.messages.filter((x) => x.from === 'client').map((x) => x.at)), now)}</p>}
    </section>
  )
}
