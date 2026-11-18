/**
 * @screens MG-23 Money (to collect · to pay · expenses) · MG-24 Invoice & reminder · MG-25 Record payment · MG-26 Add expense
 * UI only — in the real build these call OWNER finance.* functions (flag follow_up_centre). No refunds (D-16).
 */
import { AnimatePresence, motion } from 'motion/react'
import { Plus, MessageCircle, Mail, IndianRupee, Repeat, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../lib/store'
import { ago, dateKey, day, dueLabel, firstName, inr } from '../lib/format'
import type { Invoice } from '../lib/types'
import {
  Button, Chip, Choices, CountUp, Divided, Empty, Field, FlowBar, PhotoInput, Row, Screen, SectionTitle, Segmented, Sheet, Stat, Surface,
  cx, inputCls, spring, useIntent,
} from '../ui/kit'
import owlSleep from '../assets/owl-sleep.webp'

const due = (i: Invoice) => i.totalPaise - i.paidPaise
const rupees = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

export function Money() {
  const s = useStore()
  const [tab, setTab] = useState<'collect' | 'pay' | 'expenses'>('collect')
  const [pay, setPay] = useState<{ open: boolean; id?: string }>({ open: false })
  const [exp, setExp] = useState(false)
  const [bill, setBill] = useState<string>()
  useIntent('collect', () => { setTab('collect'); setPay({ open: true }) })
  useIntent('expense', () => { setTab('expenses'); setExp(true) })

  const today = dateKey(0)
  const open = s.invoices.filter((i) => due(i) > 0)
  const dueToday = open.filter((i) => i.dueOn === today)
  const overdue = open.filter((i) => i.dueOn < today)
  const part = open.filter((i) => i.paidPaise > 0)
  const bills = s.bills.filter((b) => b.status === 'due').sort((a, b) => a.dueOn.localeCompare(b.dueOn))
  const sum = (l: Invoice[]) => l.reduce((a, i) => a + due(i), 0) / 100

  return (
    <Screen title="Money" sub={`${rupees(sum(open))} to collect · ${rupees(bills.reduce((a, b) => a + b.amountPaise, 0) / 100)} to pay`}
      actions={<Button kind="secondary" className="h-11" icon={<Plus size={18} />} onClick={() => (tab === 'expenses' ? setExp(true) : setPay({ open: true }))}>{tab === 'expenses' ? 'Expense' : 'Payment'}</Button>}>
      <Segmented id="money" value={tab} onChange={setTab} options={[{ value: 'collect', label: 'To collect' }, { value: 'pay', label: 'To pay' }, { value: 'expenses', label: 'Expenses' }]} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}>
          {tab === 'collect' && (
            <>
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                <Stat label="due today" tone="accent" value={<CountUp value={sum(dueToday)} format={rupees} />} />
                <Stat label="overdue" tone="bad" value={<CountUp value={sum(overdue)} format={rupees} />} />
                <Stat label="part-paid" tone="gold" value={<CountUp value={sum(part)} format={rupees} />} />
              </div>
              <SectionTitle>Clients</SectionTitle>
              {open.length === 0 ? <Surface><Empty img={owlSleep} title="Nothing to collect" body="Every invoice is paid. New dues appear here when invoices are issued." /></Surface> : (
                <Divided>
                  {[...open].sort((a, b) => a.dueOn.localeCompare(b.dueOn)).map((i) => {
                    const c = s.clients.find((x) => x.id === i.clientId)!
                    const late = i.dueOn < today
                    return (
                      <Row key={i.id} onClick={() => s.go({ name: 'invoice', id: i.id })}>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-semibold text-ink">{c.name}</span>
                          <span className="block truncate text-[13px] text-ink-2">{i.label}</span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-[16px] font-bold text-ink tnum">{inr(due(i))}</span>
                          <Chip tone={late ? 'bad' : i.paidPaise ? 'gold' : i.dueOn === today ? 'accent' : 'neutral'}>{i.paidPaise ? 'part-paid · ' : ''}{dueLabel(i.dueOn)}</Chip>
                        </span>
                      </Row>
                    )
                  })}
                </Divided>
              )}
            </>
          )}
          {tab === 'pay' && (
            <>
              <SectionTitle>Bills & recurring</SectionTitle>
              {bills.length === 0 ? <Surface><Empty img={owlSleep} title="No bills due" body="Supplier bills appear here when you receive goods." /></Surface> : (
                <Divided>
                  {bills.map((b) => (
                    <Row key={b.id} onClick={() => setBill(b.id)}>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-[15px] font-semibold text-ink">{b.party}{b.recurring && <Repeat size={13} className="text-ink-3" aria-label="Recurring" />}</span>
                        <span className="block truncate text-[13px] text-ink-2">{b.label}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-[16px] font-bold text-ink tnum">{inr(b.amountPaise)}</span>
                        <Chip tone={b.dueOn < today ? 'bad' : b.dueOn === today ? 'accent' : 'neutral'}>{dueLabel(b.dueOn)}</Chip>
                      </span>
                    </Row>
                  ))}
                </Divided>
              )}
              <p className="mt-3 px-2 text-[12.5px] text-ink-2">Bills over the approval limit go to the owner before payment.</p>
            </>
          )}
          {tab === 'expenses' && (
            <>
              <SectionTitle action={<Button kind="ghost" className="h-9 px-3" icon={<Plus size={16} />} onClick={() => setExp(true)}>Add</Button>}>Your expenses</SectionTitle>
              <Divided>
                <AnimatePresence initial={false}>
                  {s.expenses.map((e) => (
                    <motion.div key={e.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={spring}>
                      <div className="flex items-center gap-3 px-4 py-3.5">
                        {e.receipt ? <img src={e.receipt} alt="Receipt" className="size-11 shrink-0 rounded-xl object-cover" /> : <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink-2"><IndianRupee size={18} /></span>}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-semibold text-ink">{e.category}</span>
                          <span className="block truncate text-[13px] text-ink-2">{e.note || e.paidFrom} · {ago(e.at)}</span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-[15.5px] font-bold text-ink tnum">{inr(e.amountPaise)}</span>
                          <Chip tone={e.status === 'approved' ? 'ok' : e.status === 'rejected' ? 'bad' : 'gold'}>{e.status === 'submitted' ? 'Waiting for owner' : e.status === 'approved' ? 'Approved' : 'Rejected'}</Chip>
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Divided>
            </>
          )}
        </motion.div>
      </AnimatePresence>
      <RecordPaymentSheet open={pay.open} invoiceId={pay.id} onClose={() => setPay({ open: false })} />
      <AddExpenseSheet open={exp} onClose={() => setExp(false)} />
      <PayBillSheet id={bill} onClose={() => setBill(undefined)} />
    </Screen>
  )
}

/* ───────── MG-24 Invoice & reminder ───────── */
export function InvoiceDetail({ id }: { id: string }) {
  const s = useStore()
  const i = s.invoices.find((x) => x.id === id)
  const [pay, setPay] = useState(false)
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp')
  if (!i) return <Screen title="Invoice"><Empty title="Invoice not found" body="It may have been removed in a demo reset." /></Screen>
  const c = s.clients.find((x) => x.id === i.clientId)!
  const left = due(i)
  // Haresh never sends a payment link by hand — BeWise sent it automatically; the reminder points to that message.
  const msg = `Namaste ${firstName(c.name)} 🙏 Just checking you got the BeWise message about ${inr(left)} for "${i.label}" (${i.code}). The payment link is in that chat. Thank you! Haresh, BeWise`
  return (
    <Screen title={<span className="tnum">{inr(left)}</span>} sub={`${c.name} · ${i.code}`}
      actions={<Chip tone={left === 0 ? 'ok' : i.dueOn < dateKey(0) ? 'bad' : 'accent'}>{left === 0 ? 'Paid' : dueLabel(i.dueOn)}</Chip>}>
      <Divided>
        <div className="flex justify-between px-4 py-3 text-[14.5px]"><span className="text-ink-2">For</span><span className="max-w-[65%] text-right font-semibold text-ink">{i.label}</span></div>
        <div className="flex justify-between px-4 py-3 text-[14.5px]"><span className="text-ink-2">Invoice total</span><span className="font-semibold text-ink tnum">{inr(i.totalPaise)}</span></div>
        <div className="flex justify-between px-4 py-3 text-[14.5px]"><span className="text-ink-2">Paid so far</span><span className="font-semibold text-ink tnum">{inr(i.paidPaise)}</span></div>
        <div className="flex justify-between px-4 py-3 text-[14.5px]"><span className="text-ink-2">Issued · due</span><span className="font-semibold text-ink">{day(i.issuedOn)} · {day(i.dueOn)}</span></div>
      </Divided>
      {left > 0 && (
        <>
          <SectionTitle>Reminder preview</SectionTitle>
          <Segmented id="ch" value={channel} onChange={setChannel} options={[{ value: 'whatsapp', label: 'WhatsApp' }, { value: 'email', label: 'Email' }]} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={channel} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className={cx('mt-3 rounded-[24px] p-4', channel === 'whatsapp' ? 'bg-[var(--wa-bg)]' : 'bg-surface shadow-soft')}>
              {channel === 'whatsapp' ? (
                <div className="ml-auto max-w-[88%] rounded-[18px] rounded-tr-md bg-[var(--wa-bubble)] px-4 py-3 text-[14.5px] leading-relaxed text-[var(--wa-fg)] shadow-sm">
                  {msg}<div className="mt-1 text-right text-[11px] opacity-60">Approved template · payment_reminder</div>
                </div>
              ) : (
                <div className="text-[14.5px] leading-relaxed text-ink"><div className="mb-2 text-[13px] text-ink-2">Subject: Payment reminder · {i.code}</div>{msg}</div>
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}
      <SectionTitle>History</SectionTitle>
      <Divided>
        {[...i.payments.map((p) => ({ at: p.at, text: `Payment ${inr(p.amountPaise)} · ${p.method}${p.ref ? ' · ' + p.ref : ''}`, icon: <IndianRupee size={16} /> })),
          ...i.reminders.map((r) => ({ at: r.at, text: `Reminder sent on ${r.channel === 'whatsapp' ? 'WhatsApp' : 'email'}`, icon: r.channel === 'whatsapp' ? <MessageCircle size={16} /> : <Mail size={16} /> }))]
          .sort((a, b) => b.at - a.at).map((h, k) => (
            <div key={k} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-8 place-items-center rounded-full bg-surface-2 text-ink-2">{h.icon}</span>
              <span className="flex-1 text-[14px] text-ink">{h.text}</span>
              <span className="text-[12.5px] text-ink-3">{ago(h.at)}</span>
            </div>
          ))}
        {i.payments.length + i.reminders.length === 0 && <div className="px-4 py-4 text-[14px] text-ink-2">No reminders or payments yet.</div>}
      </Divided>
      {left > 0 && (
        <>
          <FlowBar label={`Send reminder on ${channel === 'whatsapp' ? 'WhatsApp' : 'email'}`} icon={channel === 'whatsapp' ? <MessageCircle size={19} /> : <Mail size={19} />}
            onAction={() => { s.remind(i.id, channel); s.toast('Reminder sent') }}
            secondary={<Button onClick={() => setPay(true)} className="h-[58px] shrink-0" icon={<IndianRupee size={17} />}>Paid</Button>} />
        </>
      )}
      <RecordPaymentSheet open={pay} invoiceId={i.id} onClose={() => setPay(false)} />
    </Screen>
  )
}

/* ───────── MG-25 Record payment ───────── */
const METHODS = ['UPI', 'Cash', 'Card', 'Bank transfer', 'Cheque']
export function RecordPaymentSheet({ open, invoiceId, onClose }: { open: boolean; invoiceId?: string; onClose: () => void }) {
  const s = useStore()
  const openInv = s.invoices.filter((i) => due(i) > 0)
  const [pick, setPick] = useState<string>()
  const id = invoiceId ?? pick ?? openInv[0]?.id
  const inv = s.invoices.find((i) => i.id === id)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('UPI')
  const [ref, setRef] = useState('')
  const value = amount === '' && inv ? due(inv) / 100 : Number(amount)
  const valid = inv && value > 0 && value * 100 <= due(inv)
  return (
    <Sheet open={open} onClose={onClose} title="Record payment"
      footer={<Button kind="primary" full disabled={!valid} onClick={() => { s.recordPayment(inv!.id, Math.round(value * 100), method, ref || undefined); s.toast(`${inr(Math.round(value * 100))} recorded`); setAmount(''); setRef(''); onClose() }}>Record {valid ? inr(Math.round(value * 100)) : 'payment'}</Button>}>
      <div className="space-y-4">
        {!invoiceId && (
          <Field label="Invoice">
            <select id="pay-inv" className={inputCls} value={id} onChange={(e) => { setPick(e.target.value); setAmount('') }}>
              {openInv.map((i) => <option key={i.id} value={i.id}>{s.clients.find((c) => c.id === i.clientId)!.name} · {inr(due(i))} · {i.code}</option>)}
            </select>
          </Field>
        )}
        <Field label="Amount (₹)" hint={inv ? `${inr(due(inv))} is pending. Part payments are fine.` : undefined} error={inv && value * 100 > due(inv) ? `More than the ${inr(due(inv))} pending` : undefined}>
          <input id="pay-amt" inputMode="decimal" className={cx(inputCls, 'text-[20px] font-bold tnum')} value={amount === '' && inv ? String(due(inv) / 100) : amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} />
        </Field>
        <div><span className="mb-2 block text-[13px] font-semibold text-ink-2">Method</span><Choices id="pay-m" value={method} onChange={setMethod} options={METHODS.map((m) => ({ value: m, label: m }))} /></div>
        <Field label="Reference (optional)"><input id="pay-ref" className={inputCls} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="UPI ref, cheque no." /></Field>
      </div>
    </Sheet>
  )
}

/* ───────── MG-26 Add expense ───────── */
const CATS = ['Courier & postage', 'Office supplies', 'Packaging', 'Travel', 'Utilities', 'Repairs', 'Other']
export function AddExpenseSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useStore()
  const [photo, setPhoto] = useState<string>()
  const [amount, setAmount] = useState('')
  const [cat, setCat] = useState(CATS[0])
  const [from, setFrom] = useState('Petty cash')
  const [note, setNote] = useState('')
  const v = Number(amount)
  return (
    <Sheet open={open} onClose={onClose} title="Add expense"
      footer={<Button kind="primary" full disabled={!(v > 0)} onClick={() => { s.addExpense({ amountPaise: Math.round(v * 100), category: cat, paidFrom: from, note, receipt: photo }); s.toast('Sent to owner for approval'); setAmount(''); setNote(''); setPhoto(undefined); onClose() }}>Submit for approval</Button>}>
      <div className="space-y-4">
        <PhotoInput id="exp-photo" value={photo} onChange={setPhoto} label="Photo of the receipt" />
        <Field label="Amount (₹)"><input id="exp-amt" inputMode="decimal" className={cx(inputCls, 'text-[20px] font-bold tnum')} value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" /></Field>
        <div><span className="mb-2 block text-[13px] font-semibold text-ink-2">Category</span><Choices id="exp-cat" value={cat} onChange={setCat} options={CATS.map((c) => ({ value: c, label: c }))} /></div>
        <div><span className="mb-2 block text-[13px] font-semibold text-ink-2">Paid from</span><Choices id="exp-from" value={from} onChange={setFrom} options={['Petty cash', 'Office UPI', 'Own pocket'].map((c) => ({ value: c, label: c }))} /></div>
        <Field label="Note"><input id="exp-note" className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was it for?" /></Field>
      </div>
    </Sheet>
  )
}

function PayBillSheet({ id, onClose }: { id?: string; onClose: () => void }) {
  const s = useStore()
  const b = s.bills.find((x) => x.id === id)
  const [method, setMethod] = useState('Bank transfer')
  return (
    <Sheet open={!!b} onClose={onClose} title={b?.party ?? ''}
      footer={<Button kind="primary" full icon={<CheckCheck size={18} />} onClick={() => { s.payBill(b!.id); s.toast(`${inr(b!.amountPaise)} marked paid`); onClose() }}>Mark {b ? inr(b.amountPaise) : ''} paid</Button>}>
      {b && (
        <div className="space-y-4">
          <Surface><div className="text-[14.5px] text-ink">{b.label}</div><div className="mt-1 text-[13px] text-ink-2">{dueLabel(b.dueOn)} · {day(b.dueOn)}</div></Surface>
          <div><span className="mb-2 block text-[13px] font-semibold text-ink-2">Paid by</span><Choices id="bill-m" value={method} onChange={setMethod} options={['Bank transfer', 'UPI', 'Cheque', 'Cash'].map((m) => ({ value: m, label: m }))} /></div>
        </div>
      )}
    </Sheet>
  )
}
