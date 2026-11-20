/**
 * @screens MG-11 Appointments today · MG-12 Express booking (greet and confirm) · MG-13 Clients (+ add client) · MG-14 Client detail (no notes)
 * Wording matches the consultant app (preview/consultant): Check in → "Checked in"; Express booking → Greet and confirm;
 * Haresh never sends a payment link by hand — BeWise sends it automatically after the greeting.
 */
import { AnimatePresence, motion } from 'motion/react'
import { UserPlus, Video, Store, Search, Lock, Phone, Mail, MapPin, MessageCircle, Check, Zap, ArrowLeft, IndianRupee, UserCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useStore, isOpen } from '../lib/store'
import { STAGE_LABEL, STAGE_TONE } from '../lib/stages'
import { ago, day, dueLabel, firstName, inr, time } from '../lib/format'
import type { Appointment, Client, Pronoun } from '../lib/types'
import { Button, Chip, Choices, Divided, Empty, Field, Row, Screen, SectionTitle, Segmented, Sheet, Surface, copyText, cx, inputCls, soft, spring, useIntent } from '../ui/kit'

const FEE = { 'First consultation': 100000, 'Follow-up': 80000 } as const // D-09, remedy included
const MIN = { 'First consultation': 60, 'Follow-up': 30 } as const
export const STATUS_LABEL: Record<Appointment['status'], string> = { awaiting_payment: 'Awaiting payment', confirmed: 'Confirmed', checked_in: 'Checked in', completed: 'Completed' }

/** Check-in control shared by Today and Appointments — same states as Jitendra Khimlani's Today. */
export function CheckInControl({ a, big }: { a: Appointment; big?: boolean }) {
  const s = useStore()
  const c = s.clients.find((x) => x.id === a.clientId)!
  const h = big ? 'h-11 px-4 text-[14.5px]' : 'h-10 px-3.5 text-[14px]'
  return (
    <AnimatePresence mode="wait" initial={false}>
      {a.status === 'completed' ? <motion.span key="d" className="text-[13px] font-semibold text-ink-3">Completed</motion.span>
        : a.status === 'checked_in' ? (
          <motion.span key="in" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring} className={cx('inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ok-soft font-bold text-ok', h)}><Check size={16} strokeWidth={3} />Checked in</motion.span>
        ) : a.status === 'awaiting_payment' ? (
          <motion.span key="ap"><Chip tone="gold">Awaiting payment</Chip></motion.span>
        ) : (
          <motion.button key="btn" exit={{ scale: 0.85, opacity: 0 }} whileTap={{ scale: 0.94 }} transition={spring}
            onClick={(e) => { e.stopPropagation(); s.checkIn(a.id); s.toast(`${firstName(c.name)} ${a.mode === 'online' ? 'has joined' : 'has arrived'}. Jitendra Khimlani can see it too.`) }}
            className={cx('cta inline-flex shrink-0 items-center gap-1.5 rounded-full font-bold shadow-lift', h)}><UserCheck size={16} />Check in</motion.button>
        )}
    </AnimatePresence>
  )
}

export function Appointments() {
  const s = useStore()
  const [express, setExpress] = useState(false)
  const [desk, setDesk] = useState<Appointment>()
  useIntent('express', () => setExpress(true))
  useIntent('walkin', () => setExpress(true))
  const now = Date.now()
  const today = s.appointments.filter((a) => new Date(a.startsAt).toDateString() === new Date(now).toDateString() || a.startsAt > now)
  return (
    <Screen title="Appointments" sub={`${s.appointments.length} sessions with Jitendra Khimlani`}
      actions={<Button kind="primary" className="h-11" icon={<Zap size={18} />} onClick={() => setExpress(true)}>Express booking</Button>}>
      <div className="relative space-y-2.5 pl-5">
        <span className="absolute top-3 bottom-3 left-[5px] w-[2px] rounded-full bg-[var(--line)]" aria-hidden />
        {today.map((a, i) => {
          const c = s.clients.find((x) => x.id === a.clientId)!
          const past = a.startsAt + a.minutes * 60000 < now
          const live = a.startsAt <= now && !past
          return (
            <motion.div key={a.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: i * 0.04 }} className="relative">
              <span className={cx('absolute top-6 -left-5 size-3 rounded-full ring-4 ring-[var(--ground-mid)]', live ? 'bg-ok' : a.status === 'completed' || past ? 'bg-[var(--ink-3)]' : 'bg-accent')} />
              <Surface className={cx('!p-4', a.status === 'completed' && 'opacity-55')}>
                <div className="flex items-center gap-3">
                  <span className="w-[74px] shrink-0">
                    <span className="block text-[15px] font-bold whitespace-nowrap text-ink tnum">{time(a.startsAt)}</span>
                    <span className="block text-[12px] text-ink-2">{new Date(a.startsAt).toDateString() === new Date(now).toDateString() ? `${a.minutes} min` : day(a.startsAt)}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15.5px] font-semibold text-ink">{c.name}</span>
                    <span className="flex items-center gap-1.5 text-[13px] text-ink-2">{a.mode === 'online' ? <Video size={13} /> : <Store size={13} />}{a.type} · {a.mode === 'online' ? 'Online' : 'In person'}</span>
                  </span>
                  <CheckInControl a={a} />
                </div>
                {a.status === 'awaiting_payment' && (
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
                    <span className="text-[12.5px] text-ink-2">BeWise sent the payment link automatically.</span>
                    <button onClick={() => setDesk(a)} className="shrink-0 rounded-full bg-surface-2 px-3 py-2 text-[13px] font-semibold text-ink">Paid at desk</button>
                  </div>
                )}
              </Surface>
            </motion.div>
          )
        })}
      </div>
      <p className="mt-4 px-2 text-[12.5px] text-ink-2">Check-in shows on Jitendra Khimlani's Today as well. To move a session, use his calendar. No refunds — cancellations become a reschedule.</p>
      <ExpressBookingSheet open={express} onClose={() => setExpress(false)} />
      <PaidAtDeskSheet a={desk} onClose={() => setDesk(undefined)} />
    </Screen>
  )
}

function PaidAtDeskSheet({ a, onClose }: { a?: Appointment; onClose: () => void }) {
  const s = useStore()
  const [method, setMethod] = useState('UPI')
  const c = a ? s.clients.find((x) => x.id === a.clientId) : undefined
  return (
    <Sheet open={!!a} onClose={onClose} title="Paid at the desk"
      footer={<Button kind="primary" full onClick={() => { s.paidAtDesk(a!.id, method); s.toast(`${inr(FEE[a!.type])} recorded · ${firstName(c!.name)} is confirmed`); onClose() }}>Record {a ? inr(FEE[a.type]) : ''}</Button>}>
      {a && c && (
        <div className="space-y-4">
          <p className="text-[14.5px] text-ink-2">{c.name} paid in person for the {a.type.toLowerCase()} at {time(a.startsAt)}. The payment link BeWise sent stops working.</p>
          <Choices id="desk-m" value={method} onChange={setMethod} options={['UPI', 'Cash', 'Card'].map((m) => ({ value: m, label: m }))} />
        </div>
      )}
    </Sheet>
  )
}

/* ───────── Express booking: person → next free time → greet and confirm ───────── */
function nextFree(minutes: number, appts: Appointment[], count = 6) {
  const out: number[] = []
  const IST = 5.5 * 3600e3
  for (let d = 0; d < 14 && out.length < count; d++) {
    for (let h = 10; h < 19 && out.length < count; h++) for (const m of [0, 30]) {
      const base = new Date(Date.now() + IST + d * 864e5)
      base.setUTCHours(h, m, 0, 0)
      const t = base.getTime() - IST
      if (t < Date.now() + 15 * 60000 || out.length >= count) continue
      if (base.getUTCDay() === 0) continue // Sunday closed
      if (appts.some((a) => a.status !== 'completed' && t < a.startsAt + a.minutes * 60000 && a.startsAt < t + minutes * 60000)) continue
      out.push(t)
    }
  }
  return out
}
const dayLabel = (t: number) => {
  const k = (x: number) => new Date(x + 5.5 * 3600e3).toISOString().slice(0, 10)
  const diff = Math.round((Date.parse(k(t)) - Date.parse(k(Date.now()))) / 864e5)
  return diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }).format(t)
}
function greetingFor(c: Client, start: number, type: Appointment['type'], mode: Appointment['mode']) {
  return [
    `Namaste ${firstName(c.name)} 🙏`,
    `This is Haresh from BeWise. Your ${type.toLowerCase()} with Jitendra Khimlani is booked for ${dayLabel(start).toLowerCase()} at ${time(start)}, ${mode === 'online' ? 'online (the video link comes with your reminder)' : 'at the studio in Vadodara'}.`,
    type === 'First consultation' ? 'Before you come, please fill the short intake form so Jitendra Khimlani can understand you better.' : 'Jitendra Khimlani is looking forward to hearing how you have been.',
  ].join('\n\n')
}

export function ExpressBookingSheet({ open, onClose, clientId: initial }: { open: boolean; onClose: () => void; clientId?: string }) {
  const s = useStore()
  const [cid, setCid] = useState<string | undefined>(initial)
  const [adding, setAdding] = useState(false)
  const [q, setQ] = useState('')
  const [mode, setMode] = useState<Appointment['mode']>('in_person')
  const [picked, setPicked] = useState<number | null>(null)
  const [msg, setMsg] = useState('')
  const [stage, setStage] = useState<'pick' | 'confirm' | 'sending' | 'done'>('pick')
  const c = s.clients.find((x) => x.id === cid)
  const returning = !!c && s.appointments.some((a) => a.clientId === c.id && a.status === 'completed')
  const [typeChoice, setType] = useState<Appointment['type']>('Follow-up')
  const type: Appointment['type'] = returning ? typeChoice : 'First consultation'
  const free = useMemo(() => nextFree(MIN[type], s.appointments), [type, s.appointments])
  const reset = () => { setCid(initial); setAdding(false); setQ(''); setPicked(null); setStage('pick'); setMsg('') }
  const close = () => { onClose(); setTimeout(reset, 300) }
  const confirm = () => {
    s.book({ clientId: c!.id, startsAt: picked!, type, mode, greeting: msg })
    setStage('sending'); setTimeout(() => setStage('done'), 1500)
  }
  const ql = q.trim().toLowerCase()
  const matches = ql ? s.clients.filter((x) => x.name.toLowerCase().includes(ql) || x.phone.replace(/\s/g, '').includes(ql.replace(/\s/g, ''))).slice(0, 6) : []

  let body: React.ReactNode
  if (adding) body = <AddClientForm onDone={(nc, book) => { setAdding(false); if (book) setCid(nc.id); else close() }} onOpen={() => close()} />
  else if (!c) body = (
    <div className="space-y-3">
      <p className="text-[14px] text-ink-2">Pick who it's for. The next free times come up straight away.</p>
      <div className="relative"><Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-3" />
        <input id="xb-search" autoFocus className={cx(inputCls, 'rounded-full pl-11')} placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search clients" /></div>
      {matches.length > 0 && <Divided>{matches.map((x) => (
        <Row key={x.id} onClick={() => setCid(x.id)}><span className="grid size-9 place-items-center rounded-full bg-accent-soft text-[13px] font-bold text-accent">{x.name.split(' ').map((p) => p[0]).join('')}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-semibold text-ink">{x.name}</span><span className="block text-[12.5px] text-ink-2 tnum">{x.city}, {x.phone}</span></span></Row>
      ))}</Divided>}
      {ql && matches.length === 0 && <p className="px-2 text-[14px] text-ink-2">No one matches “{q}”.</p>}
      <Button full icon={<UserPlus size={17} />} onClick={() => setAdding(true)}>Add someone new</Button>
    </div>
  )
  else if (stage === 'pick') body = (
    <div className="space-y-4">
      {!initial && <button onClick={() => { setCid(undefined); setPicked(null) }} className="text-[14px] font-semibold text-accent">Change person</button>}
      {returning
        ? <Segmented id="xb-type" value={typeChoice} onChange={setType} options={[{ value: 'Follow-up', label: 'Follow-up ₹800' }, { value: 'First consultation', label: 'First ₹1,000' }]} />
        : <p className="rounded-2xl bg-sage-soft px-4 py-3 text-[14px] font-semibold text-ink">First consultation, 60 min, ₹1,000 incl. remedy</p>}
      <Segmented id="xb-mode" value={mode} onChange={setMode} options={[{ value: 'in_person', label: 'In person' }, { value: 'online', label: 'Online' }]} />
      <h4 className="px-1 text-[15px] font-bold text-ink">Next free times</h4>
      <div className="space-y-2">
        {free.map((t, i) => (
          <motion.button key={t} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.04 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setPicked(t); setMsg(greetingFor(c, t, type, mode)); setStage('confirm') }}
            className={cx('flex w-full items-center justify-between rounded-[20px] px-4 py-3.5 text-left', i === 0 ? 'bg-accent-soft ring-2 ring-[var(--accent)]' : 'bg-surface shadow-soft')}>
            <span><span className="block text-[15px] font-bold text-ink">{dayLabel(t)}</span><span className="block text-[13px] text-ink-2 tnum">{time(t)}</span></span>
            <span className="text-[14px] font-bold text-accent">{i === 0 ? 'Book earliest' : 'Book'}</span>
          </motion.button>
        ))}
        {free.length === 0 && <p className="text-[14px] text-ink-2">No free times in the next two weeks.</p>}
      </div>
    </div>
  )
  else if (stage === 'confirm') body = (
    <div className="space-y-4">
      <button onClick={() => setStage('pick')} className="flex items-center gap-1 text-[14px] font-semibold text-accent"><ArrowLeft size={15} /> Change time</button>
      <div className="flex items-center gap-3 rounded-[20px] bg-surface p-4 shadow-soft">
        <span className="min-w-0 flex-1"><span className="block text-[15.5px] font-bold text-ink">{c.name}</span><span className="block text-[13px] text-ink-2">{type}, {dayLabel(picked!)} at {time(picked!)}, {mode === 'online' ? 'online' : 'in person'}</span></span>
        <span className="text-[16px] font-bold text-ink tnum">{inr(FEE[type])}</span>
      </div>
      <Field label="Your greeting on WhatsApp">
        <textarea id="xb-msg" rows={7} className="w-full rounded-[18px] border border-[var(--line)] bg-[var(--wa-bubble)] px-4 py-3 text-[14.5px] leading-relaxed text-[var(--wa-fg)] outline-none focus:ring-4 focus:ring-[var(--accent-soft)]" value={msg} onChange={(e) => setMsg(e.target.value)} />
      </Field>
      <p className="flex items-start gap-2 rounded-2xl bg-gold-soft px-4 py-3 text-[13.5px] text-ink"><IndianRupee size={15} className="mt-0.5 shrink-0" /> After you confirm, BeWise sends {firstName(c.name)} the payment link automatically. Nothing to send yourself.</p>
    </div>
  )
  else {
    const steps = [
      { label: `Greeting sent to ${firstName(c.name)} on WhatsApp`, on: true },
      { label: `Booking confirmed for ${dayLabel(picked!).toLowerCase()}, ${time(picked!)}`, on: true },
      { label: stage === 'done' ? 'Payment link sent automatically' : 'Sending the payment link automatically', on: stage === 'done' },
    ]
    body = (
      <div className="flex flex-col items-center text-center">
        <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={soft} className="grid size-20 place-items-center rounded-full bg-ok-soft text-ok"><Check size={36} strokeWidth={3} /></motion.div>
        <h3 className="mt-3 text-[20px] font-bold text-ink">{firstName(c.name)} is booked</h3>
        <ol className="mt-4 w-full space-y-2 text-left">
          {steps.map((st, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.1 + i * 0.12 }} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-soft">
              <span className={cx('grid size-7 shrink-0 place-items-center rounded-full', st.on ? 'bg-ok text-white' : 'bg-surface-2')}>
                {st.on ? <Check size={14} strokeWidth={3} /> : <motion.span className="size-4 rounded-full border-2 border-[var(--accent-soft)] border-t-[var(--accent)]" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />}
              </span>
              <span className="text-[14.5px] font-semibold text-ink">{st.label}</span>
            </motion.li>
          ))}
        </ol>
        <p className="mt-3 text-[13px] text-ink-2">You don't need to send anything else. BeWise sends the payment link and the reminders.</p>
      </div>
    )
  }
  const footer = adding ? undefined
    : stage === 'confirm' && c ? <Button kind="primary" full disabled={msg.trim().length < 5} icon={<MessageCircle size={17} />} onClick={confirm}>Confirm booking and greet {firstName(c.name)}</Button>
    : stage === 'sending' || stage === 'done' ? <Button kind="primary" full onClick={close}>Done</Button> : undefined
  return (
    <Sheet open={open} onClose={close} title={adding ? 'Add a client' : stage === 'confirm' ? 'Greet and confirm' : c && stage === 'pick' ? `Book ${firstName(c.name)}` : stage === 'pick' ? 'Express booking' : 'Booked'} footer={footer}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={(adding ? 'add' : '') + (stage === 'done' ? 'sending' : stage) + (c ? 'c' : '')} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.16 }}>{body}</motion.div>
      </AnimatePresence>
    </Sheet>
  )
}

/* ───────── Add a client (crm.findClientByPhone + crm.createClient) ───────── */
const CITY_OPTIONS = ['Vadodara', 'Ahmedabad', 'Surat', 'Anand', 'Rajkot', 'Mumbai', 'Pune']
export function AddClientForm({ onDone, onOpen }: { onDone: (c: Client, book: boolean) => void; onOpen?: () => void }) {
  const s = useStore()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('Vadodara')
  const [pronoun, setPronoun] = useState<Pronoun>('they')
  const [touched, setTouched] = useState(false)
  const digits = phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')
  const nameErr = name.trim().length < 2 ? 'Enter their name.' : null
  const phoneErr = !/^[6-9]\d{9}$/.test(digits) ? 'Enter a 10-digit mobile number.' : null
  const dup = !phoneErr ? s.findClientByPhone(digits) : undefined
  const save = (book: boolean) => {
    setTouched(true)
    if (nameErr || phoneErr || dup) return
    const c = s.createClient({ name, phone: digits, city, pronoun })
    s.toast(`${firstName(c.name)} added`)
    onDone(c, book)
  }
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(false) }} noValidate>
      <p className="text-[13.5px] text-ink-2">They'll get a WhatsApp invite to fill their intake before the first session.</p>
      <Field label="Full name" error={touched && nameErr ? nameErr : undefined}>
        <input id="ac-name" autoFocus className={inputCls} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} placeholder="e.g. Priya Shah" autoComplete="name" />
      </Field>
      <Field label="Mobile number" error={touched && phoneErr ? phoneErr : undefined}>
        <div className="flex items-center gap-2"><span className="grid h-12 place-items-center rounded-2xl bg-surface-2 px-3 text-[15px] font-bold text-ink">+91</span>
          <input id="ac-phone" inputMode="numeric" className={cx(inputCls, 'tnum')} value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setTouched(true)} placeholder="98765 43210" autoComplete="tel-national" /></div>
      </Field>
      <AnimatePresence>{dup && (
        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="rounded-2xl bg-warn-soft px-4 py-3 text-[13.5px] font-semibold text-ink">
          Already registered as {dup.name}. <button type="button" className="text-accent underline" onClick={() => { onOpen?.(); s.go({ name: 'client', id: dup.id }) }}>Open profile</button>
        </motion.p>
      )}</AnimatePresence>
      <div><span className="mb-2 block text-[13px] font-semibold text-ink-2">City</span>
        <Choices id="ac-city" value={CITY_OPTIONS.includes(city) ? city : undefined} onChange={setCity} options={CITY_OPTIONS.map((c) => ({ value: c, label: c }))} />
        <input aria-label="Another city" className={cx(inputCls, 'mt-2')} value={CITY_OPTIONS.includes(city) ? '' : city} onChange={(e) => setCity(e.target.value)} placeholder="Another city" />
      </div>
      <div><span className="mb-2 block text-[13px] font-semibold text-ink-2">How to refer to them</span>
        <Segmented id="ac-pronoun" value={pronoun} onChange={setPronoun} options={[{ value: 'she', label: 'She' }, { value: 'he', label: 'He' }, { value: 'they', label: 'They' }]} />
      </div>
      <div className="grid grid-cols-2 gap-3 pt-1">
        <Button type="submit" icon={<UserPlus size={16} />}>Save</Button>
        <Button kind="primary" icon={<Zap size={16} />} onClick={() => save(true)}>Save and book</Button>
      </div>
    </form>
  )
}

export function Clients() {
  const s = useStore()
  const [q, setQ] = useState('')
  const [add, setAdd] = useState(false)
  const [book, setBook] = useState<string>()
  useIntent('add', () => setAdd(true))
  const list = s.clients.filter((c) => [c.name, c.city, c.phone, c.code].some((v) => v.toLowerCase().includes(q.toLowerCase())))
  return (
    <Screen title="Clients" sub={`${s.clients.length} people`} actions={<Button kind="primary" className="h-11" icon={<UserPlus size={18} />} onClick={() => setAdd(true)}>Add</Button>}>
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
      {list.length === 0 && <Surface className="mt-3"><Empty title="No client matches" body={`Nobody has "${q}" in their name, city or phone.`} action={<Button kind="primary" icon={<UserPlus size={17} />} onClick={() => setAdd(true)}>Add a client</Button>} /></Surface>}
      <Sheet open={add} onClose={() => setAdd(false)} title="Add a client">
        <AddClientForm onOpen={() => setAdd(false)} onDone={(c, b) => { setAdd(false); if (b) setBook(c.id); else s.go({ name: 'client', id: c.id }) }} />
      </Sheet>
      <ExpressBookingSheet key={book ?? 'none'} open={!!book} clientId={book} onClose={() => setBook(undefined)} />
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
    <Screen title={c.name} sub={`${c.code} · ${c.pronoun === 'they' ? 'they/them' : c.pronoun === 'she' ? 'she/her' : 'he/him'} · client since ${day(c.since)}`}>
      <Divided>
        <Row onClick={() => copy(c.phone, 'Number')}><Phone size={18} className="text-ink-3" /><span className="flex-1 text-[15px] text-ink tnum select-all">{c.phone}</span><span className="text-[13px] font-semibold text-accent">Copy</span></Row>
        {c.email && <Row onClick={() => copy(c.email!, 'Email')}><Mail size={18} className="text-ink-3" /><span className="flex-1 truncate text-[15px] text-ink select-all">{c.email}</span><span className="text-[13px] font-semibold text-accent">Copy</span></Row>}
        <div className="flex items-start gap-3 px-4 py-3.5"><MapPin size={18} className="mt-0.5 text-ink-3" /><span className="text-[15px] text-ink">{c.address || 'No address yet'}{c.address && <>, {c.city} {c.pincode}</>}</span></div>
      </Divided>
      <p className="mt-3 flex items-center gap-2 px-2 text-[12.5px] text-ink-2"><Lock size={13} /> Consultation notes and intake answers stay with Jitendra Khimlani.</p>

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
