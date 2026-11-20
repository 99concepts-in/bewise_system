/**
 * @screens MG-02 Today · MG-03 Notifications
 * Owner feedback 2026-11-18: keep it very simple, in the order Haresh works —
 *   1 today's sessions (check in)  2 remedies to make  3 deliveries  4 payments (send reminder / link)
 * plus a quick "Share booking link" button.
 */
import { AnimatePresence, motion } from 'motion/react'
import { Bell, Check, ChevronRight, Leaf, Link2, MessageCircle, Copy, Truck, Store, Video, Package, RotateCcw, Zap } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useStore } from '../lib/store'
import { ago, dateKey, dueLabel, firstName, greeting, inr, longDay, shortName, time, when } from '../lib/format'
import type { Appointment, Invoice, Order } from '../lib/types'
import { CheckInControl, ExpressBookingSheet } from './Desk'
import { Chip, Choices, Divided, Field, IconButton, Row, Sheet, copyText, cx, inputCls, spring, useDesktop, useIntent } from '../ui/kit'

// Same link as the consultant app; the page itself is owned by the CLIENT chat. @decision(D-12) domain pending
export const BOOKING_LINK = 'https://app.bewiseglobal.in/client/book/jitendra-khimlani'
const waLink = (phone: string, text: string) => {
  const d = phone.replace(/\D/g, '')
  return `https://wa.me/${d.length === 10 ? '91' + d : d}?text=${encodeURIComponent(text)}`
}

/** A row whose main area opens the item, with its own action buttons on the right (no nested buttons). */
function Line({ onOpen, children, actions, label }: { onOpen: () => void; children: ReactNode; actions: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 py-2 pr-3 pl-1">
      <motion.button whileTap={{ scale: 0.985 }} transition={spring} onClick={onOpen} aria-label={label}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-3 py-1.5 text-left hover:bg-surface-2/70">{children}</motion.button>
      {actions}
    </div>
  )
}

/* ───────── small building blocks ───────── */
function Section({ title, count, done, children, more }: { title: string; count: number; done: string; children: ReactNode; more?: ReactNode }) {
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-baseline gap-2 px-1">
        <h2 className="text-[19px] font-bold tracking-[-0.01em] text-ink">{title}</h2>
        {count > 0 && <span className="rounded-full bg-[var(--cta-from)] px-2 py-0.5 text-[12.5px] font-bold text-[var(--cta-fg)] tnum">{count}</span>}
      </div>
      {count === 0 ? (
        <div className="flex items-center gap-3 rounded-[24px] bg-surface px-4 py-4 shadow-soft">
          <span className="grid size-9 place-items-center rounded-full bg-ok-soft text-ok"><Check size={17} strokeWidth={3} /></span>
          <span className="text-[15px] font-semibold text-ink-2">{done}</span>
        </div>
      ) : <Divided>{children}</Divided>}
      {more}
    </section>
  )
}

/** Big, obvious action button on the right of a row. */
function Act({ children, onClick, kind = 'primary', icon }: { children: ReactNode; onClick: () => void; kind?: 'primary' | 'soft' | 'bad'; icon?: ReactNode }) {
  const cls = { primary: 'cta shadow-lift', soft: 'bg-accent-soft text-accent', bad: 'bg-bad text-white' }[kind]
  return (
    <motion.button whileTap={{ scale: 0.94 }} transition={spring} onClick={(e) => { e.stopPropagation(); onClick() }}
      className={cx('inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-[14.5px] font-bold', cls)}>
      {icon}{children}
    </motion.button>
  )
}

/* ───────── 1 · sessions ───────── */
function SessionRow({ a }: { a: Appointment }) {
  const s = useStore()
  const c = s.clients.find((x) => x.id === a.clientId)!
  return (
    <div className={cx('flex items-center gap-3 px-4 py-3.5', a.status === 'completed' && 'opacity-50')}>
      <span className="w-[74px] shrink-0 text-[15px] font-bold whitespace-nowrap text-ink tnum">{time(a.startsAt)}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] font-semibold text-ink">{c.name}</span>
        <span className="flex items-center gap-1.5 truncate text-[13px] text-ink-2">{a.mode === 'online' ? <Video size={13} className="shrink-0" /> : <Store size={13} className="shrink-0" />}{a.mode === 'online' ? 'Online' : 'In person'} · {a.type === 'First consultation' ? 'First' : 'Follow-up'}</span>
      </span>
      <CheckInControl a={a} big />
    </div>
  )
}

/* ───────── 2 · remedies ───────── */
const REMEDY_ACTION: Partial<Record<Order['stage'], string>> = { new: 'Start', preparing: 'Continue', quality_check: 'Check' }
function RemedyRow({ o }: { o: Order }) {
  const s = useStore()
  const c = s.clients.find((x) => x.id === o.clientId)!
  const late = o.dueAt < Date.now()
  return (
    <Line label={`Open remedy for ${c.name}`} onOpen={() => s.go({ name: 'order', id: o.id })}
      actions={<Act kind={o.stage === 'new' ? 'primary' : 'soft'} onClick={() => s.go({ name: 'order', id: o.id })}>{REMEDY_ACTION[o.stage]}</Act>}>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sage-soft text-sage"><Leaf size={18} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold text-ink">{shortName(c.name)}</span>
        <span className={cx('block text-[13px]', late ? 'font-semibold text-bad' : 'text-ink-2')}>
          {o.prep?.flowers.length} flowers · {late ? 'late, was due' : 'due'} {when(o.dueAt)}
        </span>
      </span>
    </Line>
  )
}

/* ───────── 3 · deliveries ───────── */
function DeliveryRow({ o }: { o: Order }) {
  const s = useStore()
  const c = s.clients.find((x) => x.id === o.clientId)!
  const open = () => s.go({ name: 'order', id: o.id })
  const pickup = o.delivery === 'studio_pickup'
  let sub = '', act: ReactNode = null, icon = <Package size={18} />, tone = 'bg-accent-soft text-accent'
  if (o.stage === 'failed_delivery') {
    sub = o.problem ?? 'Delivery failed'; icon = <Truck size={18} />; tone = 'bg-bad-soft text-bad'
    act = <Act kind="bad" icon={<RotateCcw size={15} />} onClick={() => { s.reattempt(o.id); s.toast('Courier will try again') }}>Retry</Act>
  } else if (o.stage === 'rto') {
    sub = 'Came back to us · send a replacement'; icon = <RotateCcw size={18} />; tone = 'bg-bad-soft text-bad'
    act = <Act kind="bad" onClick={open}>Replace</Act>
  } else if (o.stage === 'ready_to_dispatch') {
    sub = pickup ? 'Packed · client collects at center' : `Packed · ${o.pack?.weightG ?? 0} g`; icon = pickup ? <Store size={18} /> : <Truck size={18} />
    act = <Act onClick={open}>{pickup ? 'Hand over' : 'Ship'}</Act>
  } else {
    sub = o.stage === 'packing' ? 'Packing started' : `${o.items.length} item${o.items.length > 1 ? 's' : ''} to pack`
    act = <Act kind={o.stage === 'packing' ? 'soft' : 'primary'} onClick={open}>Pack</Act>
  }
  return (
    <Line label={`Open ${o.code}`} onOpen={open} actions={act}>
      <span className={cx('grid size-10 shrink-0 place-items-center rounded-full', tone)}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] font-semibold text-ink">{shortName(c.name)} <span className="font-medium text-ink-3 tnum">· {o.code}</span></span>
        <span className={cx('block truncate text-[13px]', tone.includes('bad') ? 'font-semibold text-bad' : 'text-ink-2')}>{sub}</span>
      </span>
    </Line>
  )
}

/* ───────── 4 · payments ───────── */
function PaymentRow({ i }: { i: Invoice }) {
  const s = useStore()
  const c = s.clients.find((x) => x.id === i.clientId)!
  const left = i.totalPaise - i.paidPaise
  const late = i.dueOn < dateKey(0)
  const last = i.reminders.at(-1)
  const justSent = last && Date.now() - last.at < 60_000
  const actions = (
    <>
      <AnimatePresence mode="wait" initial={false}>
        {justSent ? (
          <motion.span key="sent" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-ok-soft px-4 text-[14px] font-bold text-ok"><Check size={16} strokeWidth={3} />Sent</motion.span>
        ) : (
          <motion.span key="btn" exit={{ scale: 0.85, opacity: 0 }}>
            <Act icon={<MessageCircle size={15} />} onClick={() => { s.remind(i.id, 'whatsapp'); s.toast(`Reminder sent to ${firstName(c.name)}`) }}>{last ? 'Again' : 'Remind'}</Act>
          </motion.span>
        )}
      </AnimatePresence>
    </>
  )
  return (
    <Line label={`Open invoice for ${c.name}`} onOpen={() => s.go({ name: 'invoice', id: i.id })} actions={actions}>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2"><span className="text-[16px] font-semibold text-ink">{shortName(c.name)}</span><span className="text-[16px] font-bold text-ink tnum">{inr(left)}</span></span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          <Chip tone={late ? 'bad' : i.paidPaise ? 'gold' : i.dueOn === dateKey(0) ? 'accent' : 'neutral'}>{i.paidPaise ? 'Part-paid · ' : ''}{dueLabel(i.dueOn)}</Chip>
          <span className="text-[12.5px] text-ink-3">{last ? `reminded ${ago(last.at)}` : 'not reminded yet'}</span>
        </span>
      </span>
    </Line>
  )
}

/* ───────── share booking link (same link + messages as the consultant app) ───────── */
const SHARE_MSGS = {
  new: { label: 'New client', type: 'first', text: 'Namaste 🙏 You can book a calm, one-to-one consultation with Jitendra Khimlani here. Pick any time that suits you:' },
  followup: { label: 'Follow-up', type: 'followup', text: 'Namaste 🙏 Time for your follow-up with Jitendra Khimlani. Choose a time that works for you here:' },
  workshop: { label: 'Workshop', type: 'first', text: 'Thank you for joining the workshop today 🙏 If you would like a personal session with Jitendra Khimlani, book here:' },
} as const
export function ShareBookingSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useStore()
  const [kind, setKind] = useState<keyof typeof SHARE_MSGS>('new')
  const [phone, setPhone] = useState('')
  const link = `${BOOKING_LINK}?type=${SHARE_MSGS[kind].type}`
  const text = `${SHARE_MSGS[kind].text}\n${link}`
  const ok10 = phone.replace(/\D/g, '').length >= 10
  return (
    <Sheet open={open} onClose={onClose} title="Share booking link">
      <div className="space-y-4">
        <p className="text-[13.5px] text-ink-2">Anyone with this link sees Jitendra Khimlani's free times and can book. BeWise sends the payment link after they book.</p>
        <Choices id="bk-kind" value={kind} onChange={setKind} options={(Object.keys(SHARE_MSGS) as (keyof typeof SHARE_MSGS)[]).map((k) => ({ value: k, label: SHARE_MSGS[k].label }))} />
        <Field label="Client's WhatsApp number (optional)"><input id="bk-phone" inputMode="tel" className={cx(inputCls, 'tnum')} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98250 00000" /></Field>
        <div className="rounded-[22px] bg-[var(--wa-bg)] p-3">
          <div className="ml-auto max-w-[92%] rounded-[18px] rounded-tr-md bg-[var(--wa-bubble)] px-4 py-3 text-[14.5px] leading-relaxed whitespace-pre-line text-[var(--wa-fg)]">{text}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => copyText(link, (ok) => s.toast(ok ? 'Link copied' : 'Copy not allowed here. Long-press the link to copy.', ok ? 'good' : 'bad'))}
            className="flex h-14 items-center justify-center gap-2 rounded-full bg-surface text-[15px] font-bold text-ink shadow-soft"><Copy size={18} />Copy link</motion.button>
          <motion.a whileTap={{ scale: 0.96 }} href={ok10 ? waLink(phone, text) : `https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer"
            className="cta flex h-14 items-center justify-center gap-2 rounded-full text-[15px] font-bold shadow-lift"><MessageCircle size={18} />WhatsApp</motion.a>
        </div>
        <p className="text-center text-[12.5px] break-all text-ink-3 select-all">{link}</p>
      </div>
    </Sheet>
  )
}

/* ───────── Today ───────── */
export function Today() {
  const s = useStore()
  const desktop = useDesktop()
  const [share, setShare] = useState(false)
  const [express, setExpress] = useState(false)
  useIntent('share', () => setShare(true))
  useIntent('express', () => setExpress(true))

  const sessions = s.appointments
  const left = sessions.filter((a) => a.status !== 'completed' && a.status !== 'checked_in').length
  const remedies = s.orders.filter((o) => o.kind !== 'store' && ['new', 'preparing', 'quality_check'].includes(o.stage)).sort((a, b) => a.dueAt - b.dueAt)
  const deliveries = s.orders
    .filter((o) => ['failed_delivery', 'rto'].includes(o.stage) && !o.problem?.startsWith('Replacement sent')
      || o.stage === 'ready_to_dispatch' || o.stage === 'packing' || (o.kind === 'store' && o.stage === 'new'))
    .sort((a, b) => rank(a) - rank(b))
  const onTheWay = s.orders.filter((o) => o.stage === 'dispatched').length
  const payments = s.invoices.filter((i) => i.paidPaise < i.totalPaise).sort((a, b) => a.dueOn.localeCompare(b.dueOn))
  const unread = s.notes.filter((n) => !n.read).length

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="mx-auto w-full max-w-2xl pb-60 lg:pb-24">
      <header className="flex items-start justify-between gap-3 pt-6 lg:pt-10">
        <div>
          <p className="text-[14px] font-semibold text-ink-2">{longDay(Date.now())}</p>
          <h1 className="mt-1 text-[28px] leading-[1.15] font-bold tracking-[-0.02em] text-ink lg:text-[32px]">{greeting()}, Haresh</h1>
        </div>
        {!desktop && <IconButton label="Notifications" badge={unread > 0} onClick={() => s.setRoot('notifications')}><Bell size={20} /></IconButton>}
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <motion.button whileTap={{ scale: 0.97 }} transition={spring} onClick={() => setShare(true)}
          className="cta flex h-[60px] items-center justify-center gap-2 rounded-full px-3 text-[15px] font-bold whitespace-nowrap shadow-lift">
          <Link2 size={18} /> Booking link
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} transition={spring} onClick={() => setExpress(true)}
          className="flex h-[60px] items-center justify-center gap-2 rounded-full bg-surface px-3 text-[15px] font-bold whitespace-nowrap text-ink shadow-soft">
          <Zap size={18} /> Express booking
        </motion.button>
      </div>

      <Section title="Sessions today" count={left} done="No more sessions today">
        {sessions.map((a) => <SessionRow key={a.id} a={a} />)}
      </Section>

      <Section title="Remedies to make" count={remedies.length} done="All remedies are made">
        {remedies.map((o) => <RemedyRow key={o.id} o={o} />)}
      </Section>

      <Section title="Deliveries" count={deliveries.length} done="Nothing to pack or ship"
        more={onTheWay > 0 && (
          <button onClick={() => s.setRoot('shipments')} className="mt-2 flex w-full items-center justify-between rounded-full px-4 py-3 text-[14.5px] font-semibold text-accent hover:bg-accent-soft">
            <span className="flex items-center gap-2"><Truck size={17} />{onTheWay} parcel{onTheWay > 1 ? 's' : ''} on the way</span><ChevronRight size={18} />
          </button>
        )}>
        {deliveries.map((o) => <DeliveryRow key={o.id} o={o} />)}
      </Section>

      <Section title="Payments pending" count={payments.length} done="Everyone has paid"
        more={payments.length > 0 && <p className="mt-2 px-2 text-[12.5px] text-ink-2">Total {inr(payments.reduce((a, i) => a + i.totalPaise - i.paidPaise, 0))}. BeWise already sent each payment link — Remind is a gentle nudge that points to it.</p>}>
        {payments.map((i) => <PaymentRow key={i.id} i={i} />)}
      </Section>

      <ShareBookingSheet open={share} onClose={() => setShare(false)} />
      <ExpressBookingSheet open={express} onClose={() => setExpress(false)} />
    </motion.div>
  )
}
const rank = (o: Order) => (o.stage === 'failed_delivery' || o.stage === 'rto' ? 0 : o.stage === 'ready_to_dispatch' ? 1 : 2)

/* ───────── MG-03 Notifications ───────── */
export function Notifications() {
  const notes = useStore((s) => s.notes)
  const read = useStore((s) => s.readNotes)
  const go = useStore((s) => s.go)
  const setRoot = useStore((s) => s.setRoot)
  const desktop = useDesktop()
  const tone = { info: 'bg-accent', good: 'bg-ok', bad: 'bg-bad', warn: 'bg-warn' }
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-3xl pb-40">
      <header className="flex items-center gap-3 pt-5 pb-5 lg:pt-10">
        {!desktop && <IconButton label="Back" onClick={() => setRoot('today')}><ChevronRight size={20} className="rotate-180" /></IconButton>}
        <h1 className="flex-1 text-[28px] font-bold tracking-[-0.02em] text-ink">Notifications</h1>
        <button onClick={read} className="rounded-full px-3 py-2 text-[14px] font-semibold text-accent hover:bg-accent-soft">Mark all read</button>
      </header>
      <Divided>
        {notes.map((n) => (
          <Row key={n.id} onClick={n.route ? () => go(n.route!) : undefined}>
            <span className={cx('size-2.5 shrink-0 rounded-full', n.read ? 'bg-surface-2' : tone[n.tone])} />
            <span className="min-w-0 flex-1">
              <span className={cx('block text-[15px] text-ink', n.read ? 'font-medium' : 'font-bold')}>{n.title}</span>
              <span className="block text-[13px] text-ink-2">{n.body}</span>
            </span>
            <span className="shrink-0 text-[12px] font-medium text-ink-3">{ago(n.at)}</span>
          </Row>
        ))}
      </Divided>
    </motion.div>
  )
}
