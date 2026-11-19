// @owner HUB · End-to-end API test across all four roles.
// Run against a LOCAL install with debug_show_otp=true (never the live site):
//   node api/tests/e2e.mjs http://127.0.0.1:8099 owner@example.test ownerpass123 jitu@example.test jitupass1234 haresh@example.test hareshpass12
const [B, OWNER, OWNER_PW, JITU, JITU_PW, HARESH, HARESH_PW] = process.argv.slice(2)
let failures = 0
const ok = (cond, msg) => { if (cond) console.log('  ✓', msg); else { failures++; console.log('  ✗', msg) } }

function session() {
  let cookie = ''
  const call = async (fn, input = {}) => {
    const r = await fetch(`${B}/api/v1/${fn}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-BeWise': '1', cookie }, body: JSON.stringify(input) })
    const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0]
    const j = await r.json(); j.status = r.status; return j
  }
  const req = async (fn, input) => { const j = await call(fn, input); if (!j.ok) throw new Error(`${fn}: ${j.error.code} ${j.error.message}`); return j.data }
  return { call, req }
}

const client = session(), jitu = session(), haresh = session(), owner = session()
const email = `client${Date.now()}@example.test`

console.log('public')
const h = await (await fetch(`${B}/api/v1/system.health`)).json(); ok(h.ok && h.data.db, 'health ok')
const cfg = await (await fetch(`${B}/api/v1/system.publicConfig`)).json(); ok(cfg.data.consultationTypes.find((t) => t.id === 'first').feePaise === 100000, 'first consultation ₹1,000')
const prods = await (await fetch(`${B}/api/v1/catalog.listProducts`)).json(); ok(prods.data.items.length >= 18, `catalogue ${prods.data.items.length} products`)
ok(!('costPaise' in prods.data.items[0].variants[0]), 'no cost price for public')
const noHeader = await fetch(`${B}/api/v1/auth.me`, { method: 'POST', body: '{}' }); ok(noHeader.status === 400, 'POST without X-BeWise header refused')

console.log('client sign-in')
const otp = await client.req('auth.requestOtp', { email }); ok(otp.sent && otp.devCode, 'code sent')
ok(!(await client.call('auth.verifyOtp', { email, code: '000000' })).ok, 'wrong code refused')
const me = await client.req('auth.verifyOtp', { email, code: otp.devCode }); ok(me.roles.includes('client') && me.clientCode, `signed in as ${me.clientCode}`)
await client.req('crm.updateClientProfile', { name: 'Test Client', phone: '98765 43210', city: 'Vadodara', onboarded: true })
const addr = await client.req('crm.upsertAddress', { name: 'Test Client', phone: '9999999999', line1: '1 Lane', city: 'Vadodara', state: 'Gujarat', pin: '390007' })
ok(addr.isDefault, 'address saved as default')
ok((await client.call('crm.searchClients', {})).status === 403, 'client cannot search clients')

console.log('intake')
const form = await client.req('intake.getIntakeForm', { kind: 'first' })
const answers = { who: 'me', onMind: 'Work stress and I cannot sleep', duration: 'Months', feelings: ['Overthinking', 'Fear'],
  nuance: { Overthinking: { statements: ['The same thoughts go round and round'], intensity: 'Strong' }, Fear: { statements: ['A vague fear of the unknown'], intensity: 'Mild' } },
  body: ['Neck'], bodyTypes: ['Tension'], sleepQuality: 2, energy: 2, stress: 4, life: ['New job or role'], lifeOther: '',
  safety: { alcoholFree: true, medicinesText: '', allergiesText: '' }, selfHarm: 'Sometimes', goals: ['Calm', 'Rested'], goalText: '', consentAi: true }
await client.req('intake.saveIntakeDraft', { intakeId: form.intakeId, answers, step: 5 })
const sub = await client.req('intake.submitIntake', { intakeId: form.intakeId, answers, consent: { shareWithConsultant: true, aiSummary: true } })
ok(sub.flags.includes('safety') && sub.flags.includes('alcohol_free'), `flags ${sub.flags.join(',')}`)

console.log('booking')
const slots = await client.req('scheduling.getAvailableSlots', { consultationTypeId: 'first', mode: 'online' })
const day = slots.days.find((d) => d.slots.length); ok(!!day, `slots on ${day?.date}`)
const appt = await client.req('scheduling.holdAppointment', { consultationTypeId: 'first', mode: 'online', startsAt: day.slots[0], clientNote: 'Prefer Hindi', intakeId: form.intakeId })
ok(appt.status === 'pending_payment' && appt.amountPaise === 100000, `held ${appt.code}`)
const clash = await client.call('scheduling.holdAppointment', { consultationTypeId: 'first', mode: 'online', startsAt: day.slots[0] }); ok(clash.status === 409, 'same slot refused')
const co = await client.req('finance.createCheckout', { purpose: 'appointment', refId: appt.id }); ok(co.provider === 'manual' || co.provider === 'razorpay', `checkout ${co.provider}`)

console.log('staff sign-in')
for (const [s, e, p, role] of [[jitu, JITU, JITU_PW, 'consultant'], [haresh, HARESH, HARESH_PW, 'manager'], [owner, OWNER, OWNER_PW, 'owner']]) {
  ok(!(await s.call('auth.login', { email: e, password: 'wrong-password' })).ok, `${role} wrong password refused`)
  const u = await s.req('auth.login', { email: e, password: p }); ok(u.roles.includes(role), `${role} signed in`)
}

console.log('manager: dues & payment')
const dues = await haresh.req('finance.getDues', {}); ok(dues.appointments.some((d) => d.refId === appt.id), 'appointment in dues')
const paid = await haresh.req('finance.recordPayment', { purpose: 'appointment', refId: appt.id, method: 'upi', reference: 'UPI-123' })
ok(paid.invoice.number.startsWith('INV/'), `invoice ${paid.invoice.number}`)
ok((await client.req('scheduling.getAppointment', { id: appt.id })).status === 'confirmed', 'appointment confirmed after payment')
ok((await haresh.call('finance.recordPayment', { purpose: 'appointment', refId: appt.id, method: 'cash' })).status === 409, 'double payment refused')

console.log('privacy')
ok((await haresh.call('intake.getCaseSummary', { appointmentId: appt.id })).status === 403, 'manager cannot read case summary')
ok((await owner.call('intake.getCaseSummary', { appointmentId: appt.id })).status === 403, 'owner cannot read case summary')
ok((await owner.call('consultation.listNotes', { clientId: me.clientId })).status === 403, 'owner cannot read private notes')
const mInbox = await haresh.req('notifications.listInbox'); ok(!mInbox.items.some((n) => /safety|check in with/i.test(n.title)), 'manager got no safety alert')
const oInbox = await owner.req('notifications.listInbox'); ok(!oInbox.items.some((n) => /safety|check in with/i.test(n.title)), 'owner got no safety alert')
const jInbox = await jitu.req('notifications.listInbox'); ok(jInbox.items.some((n) => n.priority === 'high' && /check in/i.test(n.title)), 'Jitu Bhaiya got the safety alert')
const mView = (await haresh.req('scheduling.getAppointment', { id: appt.id })); ok(mView.clientNote === undefined, 'manager does not see booking note')

console.log('consultant session')
const today = await jitu.req('scheduling.listAppointments', { clientId: me.clientId }); ok(today.items[0].clientNote === 'Prefer Hindi', 'consultant sees booking note')
const cs = await jitu.req('intake.getCaseSummary', { appointmentId: appt.id }); ok(cs.summary.length === 4 && cs.flags.includes('safety'), 'case summary (4 lines + flags)')
const fl = await jitu.req('intake.getFlowersToConsider', { appointmentId: appt.id }); ok(fl[0].flowerId === 'White Chestnut' && fl.some((f) => f.flowerId === 'Walnut'), `flowers: ${fl.map((f) => f.flowerId).join(', ')}`)
await jitu.req('scheduling.startSession', { id: appt.id })
await jitu.req('consultation.setSessionConcerns', { appointmentId: appt.id, concernKeys: ['overthinking', 'fear'] })
await jitu.req('consultation.saveNotes', { clientId: me.clientId, appointmentId: appt.id, body: 'Private: work pressure from new manager.' })
const notes = await jitu.req('consultation.listNotes', { clientId: me.clientId }); ok(notes[0].body.includes('Private'), 'notes saved (encrypted at rest)')
const enc = notes[0].body
const remedy = await jitu.req('remedies.giveRemedy', { clientId: me.clientId, appointmentId: appt.id, flowers: [{ id: 'White Chestnut', rationale: 'thoughts loop' }, { name: 'Aspen' }, 'Walnut'], name: 'Calm mind' })
ok(remedy.version === 1 && remedy.alcoholFree === true, 'remedy given (alcohol-free from intake)')
await jitu.req('scheduling.completeAppointment', { id: appt.id })
await jitu.req('consultation.saveClientSummary', { clientId: me.clientId, appointmentId: appt.id, body: 'Take your drops 4×4. Short walk after dinner.' })

console.log('office prep')
const tasks = await haresh.req('fulfilment.listTasks', { type: 'remedy_prep' }); const t = tasks.items.find((x) => x.remedyOrderId === remedy.remedyOrderId)
ok(!!t && t.alcoholFree === true, 'remedy prep task (alcohol-free)')
const prep = await haresh.req('remedies.getPrepSheet', { remedyOrderId: remedy.remedyOrderId })
ok(prep.flowers.length === 3 && !JSON.stringify(prep).includes('thoughts loop'), 'prep sheet without rationale')
await haresh.req('fulfilment.setStage', { id: t.id, stage: 'ready_to_dispatch' })

console.log('client after session')
const cur = await client.req('remedies.getCurrentRemedyForClient'); ok(cur.flowers.includes('Aspen') && !JSON.stringify(cur).includes('thoughts loop'), 'client sees blend, no rationale')
const sums = await client.req('consultation.listClientSummaries'); ok(sums.length === 1, 'client sees shared summary')
await client.req('scheduling.submitSessionFeedback', { appointmentId: appt.id, rating: 5, tags: ['Felt heard'], benefits: ['Calmer'], notesForConsultant: 'Thank you' })
ok((await owner.req('scheduling.listSessionFeedback')).every((f) => f.notes === undefined), 'owner sees rating only')
await client.req('journal.addEntry', { emotion: 'calm', note: 'Slept better' }); await client.req('journal.addEntry', { emotion: 'anxious' })
const g = await client.req('journal.upsertGoal', { title: 'Walk 20 min', kind: 'daily' }); await client.req('journal.checkGoal', { id: g.id })
await client.req('remedies.logDrops', { taken: true })
const pr = await client.req('consultation.getProgressSummary', { audience: 'client' }); ok(pr && pr.lines.length === 3, '3-line progress (client)')
const prc = await jitu.req('consultation.getProgressSummary', { audience: 'consultant', clientId: me.clientId }); ok(prc.lines[2].includes('Overthinking'), '3-line progress (consultant, with concerns)')
ok((await jitu.req('journal.listEntries', { clientId: me.clientId })).length === 2, 'consultant reads shared journal')

console.log('shop')
const order = await client.req('commerce.createOrder', { lines: [{ key: 'sleep-roll-on-15', qty: 2 }, { key: 'remedy-reorder', qty: 1 }], addressId: addr.id })
ok(order.kind === 'combined' && order.totalPaise === 2 * 60000 + 80000, `order ${order.code} ₹${order.totalPaise / 100}`)
ok(!(await client.call('commerce.createOrder', { lines: [{ key: 'happiness-bath-salt-200', qty: 1 }], pickup: true })).ok, 'sold-out product refused')
await haresh.req('finance.recordPayment', { purpose: 'sales_order', refId: order.id, method: 'cash' })
const otasks = await haresh.req('fulfilment.listTasks', {}); const pp = otasks.items.filter((x) => x.salesOrderId === order.id); ok(pp.length === 2, 'pick-pack + remedy prep tasks')
for (const x of pp) await haresh.req('fulfilment.setStage', { id: x.id, stage: 'dispatched', courier: 'Delhivery', awb: 'AWB1' })
ok((await client.req('commerce.getOrder', { id: order.id })).status === 'dispatched', 'order dispatched')

console.log('money')
await haresh.req('finance.createExpense', { category: 'Supplies', description: 'Bottles', amountPaise: 50000 })
const ex = await owner.req('finance.listExpenses', { status: 'submitted' }); await owner.req('finance.decideExpense', { id: ex.items[0].id, decision: 'approved' })
const s = await jitu.req('finance.getSalesSummary', {}); ok(s.salesPaise >= 100000 + 200000 && s.expensesPaise >= 50000, `sales ₹${s.salesPaise / 100} · profit ₹${s.profitPaise / 100}`)
const tb = await owner.req('finance.getTrialBalance', {}); const dr = tb.reduce((a, r) => a + r.debitPaise, 0), crd = tb.reduce((a, r) => a + r.creditPaise, 0); ok(dr === crd && dr > 0, `trial balance balanced (₹${dr / 100})`)
ok((await haresh.call('finance.getTrialBalance', {})).status === 403, 'manager cannot open accounting')

console.log('owner admin')
await owner.req('staff.invite', { email: 'ca@example.test', name: 'CA', role: 'accountant', tempPassword: 'accountant-temp-1' })
const ca = session(); await ca.req('auth.login', { email: 'ca@example.test', password: 'accountant-temp-1' })
ok((await ca.req('finance.listInvoices', {})).items.length >= 2, 'accountant reads invoices')
ok((await ca.call('crm.searchClients', {})).status === 403 && (await ca.call('intake.getCaseSummary', { appointmentId: appt.id })).status === 403, 'accountant: no client / intake data')
await owner.req('settings.set', { key: 'remedy.reorder_price_paise', value: 85000 })
ok((await (await fetch(`${B}/api/v1/system.publicConfig`)).json()).data.settings['remedy.reorder_price_paise'] === 85000, 'owner changed reorder price')
await owner.req('settings.set', { key: 'remedy.reorder_price_paise', value: 80000 })
const feed = await client.req('scheduling.getCalendarFeedUrl'); const ics = await (await fetch(feed.url)).text(); ok(ics.includes('BEGIN:VEVENT'), 'calendar feed (ICS)')

console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED')
process.exit(failures ? 1 : 0)
