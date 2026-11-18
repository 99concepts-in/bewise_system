/**
 * @screens MG-11 Appointments today · MG-12 Walk-in booking & payment · MG-13 Clients · MG-14 Client detail (no notes)
 */
import { AnimatePresence, motion } from 'motion/react'
import { UserPlus, Video, Store, Search, Lock, Phone, Mail, MapPin, MessageCircle, Check } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useStore, isOpen } from '../lib/store'
import { STAGE_LABEL, STAGE_TONE } from '../lib/stages'
import { ago, day, dueLabel, firstName, inr, time } from '../lib/format'
import { Button, Chip, Choices, Divided, Empty, Field, Row, Screen, SectionTitle, Sheet, Surface, copyText, cx, inputCls, spring, useIntent } from '../ui/kit'

const FEES = { 'First consultation': { paise: 100000, minutes: 60 }, 'Follow-up': { paise: 80000, minutes: 30 } } as const // D-09, remedy included

export function Appointments() {
  const s = useStore()
  const [walk, setWalk] = useState(false)
  useIntent('walkin', () => setWalk(true))
  const now = Date.now()
  return (
    <Screen title="Appointments" sub={`Today · ${s.appointments.length} sessions with Jitu Bhaiya`}
      actions={<Button kind="primary" className="h-11" icon={<UserPlus size={18} />} onClick={() => setWalk(true)}>Walk-in</Button>}>
      <div className="relative space-y-2.5 pl-5">
        <span className="absolute top-3 bottom-3 left-[5px] w-[2px] rounded-full bg-[var(--line)]" aria-hidden />
        {s.appointments.map((a, i) => {
          const c = s.clients.find((x) => x.id === a.clientId)!
          const past = a.startsAt + a.minutes * 60000 < now
          const live = a.startsAt <= now && !past
          return (
            <motion.div key={a.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: i * 0.04 }} className="relative">
              <span className={cx('absolute top-6 -left-5 size-3 rounded-full ring-4 ring-[var(--ground-mid)]', live ? 'bg-ok' : a.status === 'completed' || past ? 'bg-[var(--ink-3)]' : 'bg-accent')} />
              <Surface className={cx('flex items-center gap-3 !p-4', a.status === 'completed' && 'opacity-55')}>
                <span className="w-[64px] shrink-0">
                  <span className="block text-[16px] font-bold text-ink tnum">{time(a.startsAt)}</span>
                  <span className="block text-[12px] text-ink-2">{a.minutes} min</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15.5px] font-semibold text-ink">{c.name}</span>
                  <span className="flex items-center gap-1.5 text-[13px] text-ink-2">{a.mode === 'online' ? <Video size={13} /> : <Store size={13} />}{a.type} · {a.mode === 'online' ? 'Online' : 'At studio'}</span>
                </span>
                <AnimatePresence mode="wait" initial={false}>
                  {a.status === 'checked_in' ? (
                    <motion.span key="in" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring}><Chip tone="ok" icon={<Check size={13} />}>Checked in</Chip></motion.span>
                  ) : a.status === 'completed' ? <Chip key="done">Done</Chip> : a.mode === 'in_person' ? (
                    <motion.span key="btn" exit={{ scale: 0.8, opacity: 0 }}><Button className="h-10 px-4 text-[14px]" onClick={() => { s.checkIn(a.id); s.toast(`${firstName(c.name)} checked in`) }}>Check in</Button></motion.span>
                  ) : <Chip key="on" tone="accent">Link sent</Chip>}
                </AnimatePresence>
              </Surface>
            </motion.div>
          )
        })}
      </div>
      <p className="mt-4 px-2 text-[12.5px] text-ink-2">To move or cancel a session, open it from Jitu Bhaiya's calendar. No refunds — cancellations become a reschedule.</p>
      <WalkInSheet open={walk} onClose={() => setWalk(false)} />
    </Screen>
  )
}

function WalkInSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useStore()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [type, setType] = useState<keyof typeof FEES>('Follow-up')
  const [method, setMethod] = useState('UPI')
  const slots = useMemo(() => {
    const base = new Date(Date.now() + 5.5 * 3600e3)
    const out: number[] = []
    for (let h = Math.max(10, base.getUTCHours() + 1); h <= 19 && out.length < 6; h++) for (const m of [0, 30]) {
      const d = new Date(base); d.setUTCHours(h, m, 0, 0)
      const t = d.getTime() - 5.5 * 3600e3
      if (!s.appointments.some((a) => Math.abs(a.startsAt - t) < a.minutes * 60000) && out.length < 6) out.push(t)
    }
    return out
  }, [s.appointments])
  const [slot, setSlot] = useState<string>()
  const found = s.clients.find((c) => phone.replace(/\D/g, '').length >= 10 && c.phone.replace(/\D/g, '').endsWith(phone.replace(/\D/g, '').slice(-10)))
  const valid = (found || name.trim().length > 1) && phone.replace(/\D/g, '').length >= 10 && slot
  return (
    <Sheet open={open} onClose={onClose} title="Walk-in booking"
      footer={<Button kind="primary" full disabled={!valid} onClick={() => {
        s.walkIn({ name: found?.name ?? name.trim(), phone, type, minutes: FEES[type].minutes, startsAt: Number(slot), method, amountPaise: FEES[type].paise })
        s.toast(`Booked and paid · ${inr(FEES[type].paise)} by ${method}`); setName(''); setPhone(''); setSlot(undefined); onClose()
      }}>Book and record {inr(FEES[type].paise)}</Button>}>
      <div className="space-y-4">
        <Field label="Phone" hint={found ? `Existing client: ${found.name} (${found.code})` : 'New clients are added automatically'}>
          <input id="wi-phone" inputMode="tel" className={cx(inputCls, 'tnum')} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98250 00000" />
        </Field>
        <AnimatePresence initial={false}>
          {!found && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Field label="Name"><input id="wi-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" /></Field>
          </motion.div>}
        </AnimatePresence>
        <div><span className="mb-2 block text-[13px] font-semibold text-ink-2">Session</span>
          <Choices id="wi-type" value={type} onChange={setType} options={[{ value: 'First consultation', label: 'First · ₹1,000' }, { value: 'Follow-up', label: 'Follow-up · ₹800' }]} />
          <p className="mt-1.5 text-[12.5px] text-ink-2">The remedy blend is included in the fee.</p></div>
        <div><span className="mb-2 block text-[13px] font-semibold text-ink-2">Time today</span>
          {slots.length ? <Choices id="wi-slot" value={slot} onChange={setSlot} options={slots.map((t) => ({ value: String(t), label: time(t) }))} /> : <p className="text-[14px] text-ink-2">No free slots left today.</p>}</div>
        <div><span className="mb-2 block text-[13px] font-semibold text-ink-2">Payment</span><Choices id="wi-pay" value={method} onChange={setMethod} options={['UPI', 'Cash', 'Card'].map((m) => ({ value: m, label: m }))} /></div>
      </div>
    </Sheet>
  )
}

export function Clients() {
  const s = useStore()
  const [q, setQ] = useState('')
  const list = s.clients.filter((c) => [c.name, c.city, c.phone, c.code].some((v) => v.toLowerCase().includes(q.toLowerCase())))
  return (
    <Screen title="Clients" sub={`${s.clients.length} people`}>
      <div className="relative mb-4">
        <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-3" />
        <input id="client-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, city or phone" className={cx(inputCls, 'h-[52px] rounded-full pl-11 shadow-soft')} aria-label="Search clients" />
      </div>
      <Divided>
        {list.map((c) => {
          const last = s.orders.filter((o) => o.clientId === c.id).sort((a, b) => b.paidAt - a.paidAt)[0]
          const dueAmt = s.invoices.filter((i) => i.clientId === c.id).reduce((a, i) => a + i.totalPaise - i.paidPaise, 0)
          return (
            <Row key={c.id} onClick={() => s.go({ name: 'client', id: c.id })}>
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-[14px] font-bold text-accent">{c.name.split(' ').map((p) => p[0]).join('')}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-ink">{c.name}</span>
                <span className="block truncate text-[13px] text-ink-2 tnum">{c.city} · {c.phone}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1 text-right">
                {dueAmt > 0 && <Chip tone="gold">{inr(dueAmt)} due</Chip>}
                <span className="text-[12px] text-ink-3">{last ? `Last order ${ago(last.paidAt)}` : 'No orders yet'}</span>
              </span>
            </Row>
          )
        })}
      </Divided>
      {list.length === 0 && <Surface className="mt-3"><Empty title="No client matches" body={`Nobody has "${q}" in their name, city or phone.`} /></Surface>}
    </Screen>
  )
}

export function ClientDetail({ id }: { id: string }) {
  const s = useStore()
  const c = s.clients.find((x) => x.id === id)
  if (!c) return <Screen title="Client"><Empty title="Client not found" body="They may have been removed in a demo reset." /></Screen>
  const orders = s.orders.filter((o) => o.clientId === c.id).sort((a, b) => b.paidAt - a.paidAt)
  const invoices = s.invoices.filter((i) => i.clientId === c.id)
  const reminders = invoices.flatMap((i) => i.reminders.map((r) => ({ ...r, code: i.code }))).sort((a, b) => b.at - a.at)
  const copy = (v: string, what: string) => copyText(v, (ok) => s.toast(ok ? `${what} copied` : 'Copy blocked — select the text instead', ok ? 'good' : 'bad'))
  return (
    <Screen title={c.name} sub={`${c.code} · client since ${day(c.since)}`}>
      <Divided>
        <Row onClick={() => copy(c.phone, 'Number')}><Phone size={18} className="text-ink-3" /><span className="flex-1 text-[15px] text-ink tnum select-all">{c.phone}</span><span className="text-[13px] font-semibold text-accent">Copy</span></Row>
        {c.email && <Row onClick={() => copy(c.email!, 'Email')}><Mail size={18} className="text-ink-3" /><span className="flex-1 truncate text-[15px] text-ink select-all">{c.email}</span><span className="text-[13px] font-semibold text-accent">Copy</span></Row>}
        <div className="flex items-start gap-3 px-4 py-3.5"><MapPin size={18} className="mt-0.5 text-ink-3" /><span className="text-[15px] text-ink">{c.address || 'No address yet'}{c.address && <>, {c.city} {c.pincode}</>}</span></div>
      </Divided>
      <p className="mt-3 flex items-center gap-2 px-2 text-[12.5px] text-ink-2"><Lock size={13} /> Consultation notes and intake answers stay with Jitu Bhaiya.</p>

      <SectionTitle>Orders</SectionTitle>
      {orders.length ? (
        <Divided>{orders.map((o) => (
          <Row key={o.id} onClick={() => s.go({ name: 'order', id: o.id })}>
            <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold text-ink tnum">{o.code}</span><span className="block text-[13px] text-ink-2">{o.items.map((i) => i.name).join(', ')}</span></span>
            <Chip tone={STAGE_TONE[o.stage]}>{isOpen(o.stage) ? 'Open · ' : ''}{STAGE_LABEL[o.stage]}</Chip>
          </Row>
        ))}</Divided>
      ) : <Surface><p className="text-[14px] text-ink-2">No orders yet.</p></Surface>}

      <SectionTitle>Invoices & dues</SectionTitle>
      {invoices.length ? (
        <Divided>{invoices.map((i) => (
          <Row key={i.id} onClick={() => s.go({ name: 'invoice', id: i.id })}>
            <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-semibold text-ink">{i.label}</span><span className="block text-[13px] text-ink-2 tnum">{i.code}</span></span>
            {i.paidPaise >= i.totalPaise ? <Chip tone="ok">Paid</Chip> : <Chip tone="gold">{inr(i.totalPaise - i.paidPaise)} · {dueLabel(i.dueOn)}</Chip>}
          </Row>
        ))}</Divided>
      ) : <Surface><p className="text-[14px] text-ink-2">No invoices.</p></Surface>}

      <SectionTitle>Messages sent</SectionTitle>
      {reminders.length ? (
        <Divided>{reminders.map((r, k) => (
          <div key={k} className="flex items-center gap-3 px-4 py-3"><MessageCircle size={16} className="text-ink-3" /><span className="flex-1 text-[14px] text-ink">Payment reminder · {r.code} · {r.channel === 'whatsapp' ? 'WhatsApp' : 'email'}</span><span className="text-[12.5px] text-ink-3">{ago(r.at)}</span></div>
        ))}</Divided>
      ) : <Surface><p className="text-[14px] text-ink-2">No messages sent yet.</p></Surface>}
    </Screen>
  )
}
