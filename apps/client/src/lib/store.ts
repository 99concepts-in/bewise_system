'use client'
/**
 * @module   client-store
 * @owner    CLIENT
 * @screens  all CL-xx / IN-xx in the standalone preview
 * Purpose:  On-device state (zustand + localStorage) standing in for server modules until the HUB foundation lands.
 *           Every action here maps 1:1 to a contract call (noted per action) so swapping to the real API is mechanical.
 * @sensitive profile photo, intake answers and journal live only on this device in the preview.
 * @stub
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ConsultationId, Emotion } from './data'
import { CONSULTATIONS, PRODUCTS, REORDER_PRICE_PAISE, STUDIO, istDate, productTitle, variantById } from './data'
import { isoDay } from './supply'
import { COUPON_DAYS, COUPON_PCT, PLANS, type PlanId } from './offer'
import { uid, dayKey, formatINR } from './format'

export type Profile = {
  name: string; phone: string; dob: string; city: string; gender?: string
  /** owner 2026-11-23: how they heard of us / who referred them */
  reference?: string
  /** details we already had (booking link or a booking made by Jitendra Khimlani / the team), shown for checking */
  prefilledFrom?: 'booking-link' | 'staff'
  photo?: string; consents: { wellbeing: boolean; whatsapp: boolean; offers: boolean }
  allergies: string[]; onboardedAt?: string
}
// @decision(D-19) owner 2026-11-18: journal entries may carry an optional note (was emotion + time only)
export type JournalEntry = { id: string; emotion: Emotion; at: string; note?: string }
/** owner 2026-11-18: daily goals get a check-in each day; long-term goals are checked off once. `progress` is legacy. */
export type Goal = { id: string; title: string; progress: number; done: boolean; kind?: 'daily' | 'once'; days?: string[]; doneAt?: string }
export type Feedback = { rating: number; tags: string[]; notes: string; benefits?: string[] } // benefits: 'How do you feel after the session?' (client's words, owner 2026-11-18)
export type Appointment = {
  id: string; code: string; type: ConsultationId; mode: 'online' | 'in_person'; startsAt: string
  status: 'confirmed' | 'completed' | 'awaiting_payment' | 'expired'; amountPaise: number; createdAt: string; feedback?: Feedback; rescheduled?: number
  /** who made the booking — staff-made bookings arrive awaiting payment (owner 2026-11-18) */
  source?: 'client' | 'consultant' | 'manager'
  /** paid after the hold expired → no time yet; client picks a new one at no cost (consultant K1 §4.3) */
  needsNewTime?: boolean; paidAt?: string
  /** owner 2026-11-18: client chose to pay after the consultation (UPI, card or at the center) */
  payLater?: boolean
  /** owner 2026-11-18: the client picks a preferred time after paying; Jitendra Khimlani or Haresh bhai confirm it (else the team calls) */
  timeRequested?: boolean
  /** covered by a consultation plan */
  planId?: PlanId
  /** owner 2026-11-21: the client just books an appointment; Jitendra Khimlani or Haresh bhai decide first visit or
   *  follow-up and the fee (most clients already met him before the app), then the client pays in the app */
  kindTbc?: boolean
  /** owner 2026-11-20: clients only request; the Manager or Jitendra Khimlani set the time. True until they do. */
  timeTbc?: boolean
  /** the client's optional hints for the team */
  prefs?: { days?: string; times?: string[]; date?: string; note?: string }
}
export type Plan = { id: PlanId; months: number; pricePaise: number; startedAt: string; used: number }
export type Coupon = { code: string; pct: number; expiresAt: string; usedAt?: string }
export type IntakeAnswers = {
  who: 'me' | 'child' | 'someone_else'; dependent?: { name: string; age: string; relation: string }
  onMind: string; duration?: 'Days' | 'Weeks' | 'Months' | 'Years'
  feelings: string[]; nuance: Record<string, { statements: string[]; intensity?: 'Mild' | 'Moderate' | 'Strong' }>
  bodyAny?: boolean; body: string[]; bodyTypes: string[]
  sleepQuality?: 1 | 2 | 3 | 4 | 5; hours?: string; wakes?: boolean; energy: number; stress: number
  life: string[]; lifeOther: string
  safety: { doctor?: boolean; medicines?: boolean; medicinesText: string; pregnant?: boolean; alcoholFree?: boolean; allergies?: boolean; allergiesText: string }
  selfHarm?: 'No' | 'Sometimes' | 'Often'
  goals: string[]; goalText: string
  consentAi: boolean
}
export type Blend = { name: string; version: number; flowers: string[]; drops: number; timesPerDay: number; startedOn: string; days: number; reminderTimes: string[]; alcoholFree: boolean }
export type CartLine = { key: string; qty: number } // key = variantId | 'remedy-reorder' | 'remedy-reorder-spray'
export type Address = { id: string; name: string; phone: string; line1: string; line2: string; city: string; state: string; pin: string }
export type OrderLine = { key: string; name: string; label: string; qty: number; pricePaise: number; kind: 'product' | 'remedy' }
export type Order = { id: string; code: string; lines: OrderLine[]; totalPaise: number; address: Address; placedAt: string; stage: 0 | 1 | 2 | 3; pickup?: boolean; discountPaise?: number; coupon?: string; subscribed?: string[]; review?: { rating: number; text: string; at: string } }
export type ChatMsg = { id: string; role: 'user' | 'bot'; text: string; products?: string[]; actions?: { id: string; label: string }[]; safety?: boolean; at: string }
export type Notice = { id: string; title: string; body: string; at: string; read: boolean; href?: string }

export type CheckinAnswers = { now?: Emotion; changes: Record<string, 'Better' | 'Same' | 'Harder'>; news: string; drops?: string }

export const emptyIntake = (): IntakeAnswers => ({
  who: 'me', onMind: '', feelings: [], nuance: {}, body: [], bodyTypes: [], energy: 3, stress: 3, life: [], lifeOther: '',
  safety: { medicinesText: '', allergiesText: '' }, goals: [], goalText: '', consentAi: true,
})

type State = {
  hydrated: boolean
  profile: Profile | null
  journal: JournalEntry[]
  goals: Goal[]
  appointments: Appointment[]
  intake: { answers: IntakeAnswers; step: number; submittedAt?: string } | null
  blend: Blend | null
  /** daily "Took my drops" tick — remedies.logDrops({ date, taken }) (consultant request 2026-11-18) */
  drops: Record<string, boolean>
  /** owner 2026-11-18: each dose checked in (4 drops, up to timesPerDay a day) → count per day */
  doses: Record<string, number>
  checkins: Record<string, { at: string; answers: CheckinAnswers }>
  cart: CartLine[]
  wishlist: string[]
  addresses: Address[]
  orders: Order[]
  chat: ChatMsg[]
  notices: Notice[]
  plan: Plan | null
  coupon: Coupon | null
  offer: { skippedAt?: string; downsellAt?: string }
  seq: number
  // actions
  setProfile: (p: Partial<Profile>) => void
  logMood: (e: Emotion, at?: Date, note?: string) => JournalEntry   // journal.createEntry
  updateMood: (id: string, patch: Partial<Pick<JournalEntry, 'emotion' | 'note'>>) => void
  removeMood: (id: string) => void
  addGoal: (title: string, kind?: 'daily' | 'once') => void
  checkGoal: (id: string) => boolean                         // daily: toggles today · once: toggles done → returns new checked state
  updateGoal: (id: string, patch: Partial<Goal>) => void
  removeGoal: (id: string) => void
  saveIntake: (answers: IntakeAnswers, step: number) => void // intake.saveIntakeDraft
  submitIntake: () => void                                   // intake.submitIntake
  book: (a: Omit<Appointment, 'id' | 'code' | 'createdAt' | 'status'>) => Appointment // holdAppointment + payment.captured
  reschedule: (id: string, startsAt: string) => void         // scheduling.rescheduleAppointment (staff side)
  requestNewTime: (id: string, note?: string) => void          // client asks for a different time; the team sets it
  giveFeedback: (id: string, f: Feedback) => void            // scheduling.submitSessionFeedback
  logDrops: (date: string, taken: boolean) => void            // remedies.logDrops
  logDoses: (date: string, n: number) => void                  // remedies.logDrops({ date, doses })
  payAppointment: (id: string) => void                         // finance checkout for an existing appointment → payment.captured
  pickNewTime: (id: string, startsAt: string) => void          // scheduling.rescheduleAppointment (no cost) → confirmed
  submitCheckin: (appointmentId: string, answers: CheckinAnswers) => void // intake.submitCheckin
  simulateStaffBooking: (late?: boolean) => Appointment         // preview only: what a booking from Jitendra Khimlani / Haresh looks like
  setReminderTimes: (t: string[]) => void
  addToCart: (key: string, qty?: number) => void             // commerce.addToCart
  setQty: (key: string, qty: number) => void
  toggleWish: (slug: string) => void
  upsertAddress: (a: Omit<Address, 'id'> & { id?: string }) => Address // crm.upsertAddress
  placeOrder: (addressId: string, subscribe?: string[]) => Order // commerce.createOrderFromCart + payment (coupon applied, subscriptions confirmed)
  buyPlan: (id: PlanId, pricePaise: number) => Plan            // finance: plan purchase → unlocks the first-purchase coupon
  setOffer: (o: { skippedAt?: string; downsellAt?: string }) => void
  confirmTime: (id: string) => void                            // preview only: Jitendra Khimlani / Haresh bhai approve the preferred time
  reviewOrder: (id: string, rating: number, text: string) => void
  subscribeOrder: (id: string, keys: string[]) => void          // commerce.createSubscription (refills confirmed on WhatsApp)
  pushChat: (m: Omit<ChatMsg, 'id' | 'at'>) => void
  clearChat: () => void
  readNotices: () => void
  notify: (n: Omit<Notice, 'id' | 'at' | 'read'>) => void
  loadDemo: () => void
  resetAll: () => void
}

const initial = {
  profile: null, journal: [], goals: [], appointments: [], intake: null, blend: null, drops: {}, doses: {}, checkins: {}, cart: [], wishlist: [],
  addresses: [], orders: [], chat: [], notices: [], plan: null, coupon: null, offer: {}, seq: 41,
}

/** a valid, unused coupon (owner 2026-11-18: 15% off every product on the first shop order, 7 days) */
export const couponOk = (c: Coupon | null, now = Date.now()) => !!c && !c.usedAt && +new Date(c.expiresAt) > now
export const couponDiscount = (s: { coupon: Coupon | null }, lines: { pricePaise: number; qty: number; kind: string }[]) =>
  couponOk(s.coupon) ? Math.round(lines.filter((l) => l.kind === 'product').reduce((t, l) => t + l.pricePaise * l.qty, 0) * s.coupon!.pct / 100) : 0
export const planLeft = (p: Plan | null) => (p ? p.months - p.used : 0)

export const cartLineInfo = (l: CartLine) => {
  if (l.key === 'remedy-reorder') return { name: 'Personal blend', label: '30 ml dropper', pricePaise: REORDER_PRICE_PAISE, kind: 'remedy' as const, art: 'products/bach-remedy-dropper' }
  if (l.key === 'remedy-reorder-spray') return { name: 'Personal blend', label: '30 ml spray', pricePaise: REORDER_PRICE_PAISE, kind: 'remedy' as const, art: 'products/bach-remedy-spray' }
  const v = variantById(l.key)
  if (!v) return null
  return { name: productTitle(v.product), label: v.variant.label, pricePaise: v.variant.pricePaise, kind: 'product' as const, art: v.product.art, product: v.product }
}

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...initial,
      setProfile: (p) => set((s) => ({ profile: { ...(s.profile ?? { name: '', phone: '', dob: '', city: '', consents: { wellbeing: false, whatsapp: false, offers: false }, allergies: [] }), ...p } })),
      logMood: (emotion, at = new Date(), note) => {
        const e: JournalEntry = { id: uid(), emotion, at: at.toISOString(), ...(note?.trim() ? { note: note.trim().slice(0, 500) } : {}) }
        set((s) => ({ journal: [e, ...s.journal] }))
        return e
      },
      updateMood: (id, patch) => set((s) => ({ journal: s.journal.map((j) => (j.id === id ? { ...j, ...patch, note: patch.note !== undefined ? (patch.note.trim().slice(0, 500) || undefined) : j.note } : j)) })),
      removeMood: (id) => set((s) => ({ journal: s.journal.filter((j) => j.id !== id) })),
      addGoal: (title, kind = 'daily') => set((s) => ({ goals: [...s.goals, { id: uid(), title, progress: 0, done: false, kind, days: [] }].slice(0, 5) })),
      checkGoal: (id) => {
        const g = get().goals.find((x) => x.id === id); if (!g) return false
        if ((g.kind ?? 'daily') === 'once') {
          const done = !g.done
          set((s) => ({ goals: s.goals.map((x) => (x.id === id ? { ...x, done, progress: done ? 100 : 0, doneAt: done ? new Date().toISOString() : undefined } : x)) }))
          return done
        }
        const today = isoDay(new Date()); const days = g.days ?? []
        const on = !days.includes(today)
        set((s) => ({ goals: s.goals.map((x) => (x.id === id ? { ...x, days: on ? [...days, today].slice(-120) : days.filter((d) => d !== today) } : x)) }))
        return on
      },
      updateGoal: (id, patch) => set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
      saveIntake: (answers, step) => set((s) => ({ intake: { ...(s.intake ?? {}), answers, step } })),
      submitIntake: () => {
        const s = get()
        if (!s.intake) return
        const allergies = s.intake.answers.safety.allergies ? s.intake.answers.safety.allergiesText.toLowerCase().split(/[,\s]+/).filter(Boolean) : []
        set({ intake: { ...s.intake, submittedAt: new Date().toISOString() }, profile: s.profile ? { ...s.profile, allergies } : s.profile })
      },
      book: (a) => {
        const seq = get().seq + 1
        const appt: Appointment = { ...a, id: uid(), code: `BW-A-${String(seq).padStart(5, '0')}`, createdAt: new Date().toISOString(), status: 'confirmed' }
        set((s) => ({ appointments: [...s.appointments, appt], seq, ...(a.planId && s.plan ? { plan: { ...s.plan, used: s.plan.used + 1 } } : {}) }))
        if (!appt.needsNewTime) get().notify(appt.timeRequested ? { title: 'Request sent', body: 'Jitendra Khimlani or the team will confirm a time and message you on WhatsApp.', href: `/app/sessions/view?id=${appt.id}` } : { title: 'You’re booked', body: 'Jitendra Khimlani will read your answers before you meet.', href: `/app/sessions/view?id=${appt.id}` })
        return appt
      },
      requestNewTime: (id, note) => {
        set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, timeTbc: true, timeRequested: true, rescheduled: (a.rescheduled ?? 0) + 1, prefs: { ...a.prefs, note: note || a.prefs?.note } } : a)) }))
        get().notify({ title: 'New time requested', body: 'The team will confirm a new time and message you on WhatsApp.', href: `/app/sessions/view?id=${id}` })
      },
      reschedule: (id, startsAt) => set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, startsAt, rescheduled: (a.rescheduled ?? 0) + 1 } : a)) })),
      giveFeedback: (id, f) => set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, feedback: f } : a)) })),
      logDrops: (date, taken) => set((s) => ({ drops: { ...s.drops, [date]: taken }, doses: { ...s.doses, [date]: taken ? (s.blend?.timesPerDay ?? 4) : 0 } })),
      logDoses: (date, n) => set((s) => {
        const max = s.blend?.timesPerDay ?? 4, v = Math.max(0, Math.min(max, n))
        return { doses: { ...s.doses, [date]: v }, drops: { ...s.drops, [date]: v > 0 } }
      }),
      payAppointment: (id) => {
        const a = get().appointments.find((x) => x.id === id)
        if (!a) return
        if (a.payLater) { set((s) => ({ appointments: s.appointments.map((x) => (x.id === id ? { ...x, paidAt: new Date().toISOString() } : x)) })); get().notify({ title: 'Payment received', body: 'Thank you. Your receipt is in Payments.', href: `/app/sessions/view?id=${id}` }); return }
        const late = a.status === 'expired'
        // owner 2026-11-20: a late payment no longer asks the client to pick; the team confirms a new time
        set((s) => ({ appointments: s.appointments.map((x) => (x.id === id ? { ...x, paidAt: new Date().toISOString(), status: 'confirmed' as const, ...(late ? { timeTbc: true, timeRequested: true } : {}) } : x)) }))
        get().notify(late ? { title: 'Payment received', body: 'The team will confirm a new time with you, at no extra cost.', href: `/app/sessions/view?id=${id}` } : { title: 'You’re booked', body: 'Payment received. See you soon.', href: `/app/sessions/view?id=${id}` })
      },
      // owner 2026-11-18: a chosen time is a request until Jitendra Khimlani or Haresh bhai confirm it
      pickNewTime: (id, startsAt) => {
        set((s) => ({ appointments: s.appointments.map((x) => (x.id === id ? { ...x, startsAt, status: 'confirmed' as const, needsNewTime: false, timeRequested: true } : x)) }))
        get().notify({ title: 'Time requested', body: 'Jitendra Khimlani or our team will confirm your time soon and message you on WhatsApp.', href: `/app/sessions/view?id=${id}` })
      },
      submitCheckin: (appointmentId, answers) => set((s) => ({ checkins: { ...s.checkins, [appointmentId]: { at: new Date().toISOString(), answers } } })),
      simulateStaffBooking: (late = false) => {
        const seq = get().seq + 1
        const d = new Date(); d.setDate(d.getDate() + 3); d.setHours(11, 0, 0, 0)
        const appt: Appointment = {
          id: uid(), code: `BW-A-${String(seq).padStart(5, '0')}`, type: get().appointments.length ? 'followup' : 'first', mode: 'online', startsAt: d.toISOString(),
          status: late ? 'expired' : 'awaiting_payment', amountPaise: get().appointments.length ? 80000 : 100000, createdAt: new Date().toISOString(), source: 'consultant',
        }
        set((s) => ({ appointments: [...s.appointments, appt], seq }))
        get().notify({ title: 'Jitendra Khimlani booked a session for you', body: 'Complete the payment to confirm it.', href: `/app/pay?appointment=${appt.id}` })
        return appt
      },
      setReminderTimes: (t) => set((s) => (s.blend ? { blend: { ...s.blend, reminderTimes: t } } : {})),
      addToCart: (key, qty = 1) => set((s) => {
        const ex = s.cart.find((l) => l.key === key)
        const max = key.startsWith('remedy-reorder') ? 1 : 10
        return { cart: ex ? s.cart.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + qty, max) } : l)) : [...s.cart, { key, qty: Math.min(qty, max) }] }
      }),
      setQty: (key, qty) => set((s) => ({ cart: qty <= 0 ? s.cart.filter((l) => l.key !== key) : s.cart.map((l) => (l.key === key ? { ...l, qty } : l)) })),
      toggleWish: (slug) => set((s) => ({ wishlist: s.wishlist.includes(slug) ? s.wishlist.filter((x) => x !== slug) : [...s.wishlist, slug] })),
      upsertAddress: (a) => {
        const addr = { ...a, id: a.id ?? uid() } as Address
        set((s) => ({ addresses: [addr, ...s.addresses.filter((x) => x.id !== addr.id)] }))
        return addr
      },
      placeOrder: (addressId, subscribe) => {
        const s = get()
        const lines: OrderLine[] = s.cart.flatMap((l) => {
          const i = cartLineInfo(l); return i ? [{ key: l.key, name: i.name, label: i.label, qty: l.qty, pricePaise: i.pricePaise, kind: i.kind }] : []
        })
        const seq = s.seq + 1
        const discountPaise = couponDiscount(s, lines)
        const order: Order = {
          id: uid(), code: `BW-${String(seq).padStart(5, '0')}`, lines, totalPaise: lines.reduce((t, l) => t + l.pricePaise * l.qty, 0) - discountPaise,
          address: addressId === 'pickup' ? { id: 'pickup', name: STUDIO.name, phone: '', line1: STUDIO.line1, line2: STUDIO.line2, city: 'Vadodara', state: 'Gujarat', pin: '390007' } : s.addresses.find((a) => a.id === addressId)!,
          placedAt: new Date().toISOString(), stage: 0, ...(addressId === 'pickup' ? { pickup: true } : {}),
          ...(discountPaise ? { discountPaise, coupon: s.coupon!.code } : {}), ...(subscribe?.length ? { subscribed: subscribe } : {}),
        }
        set({ orders: [order, ...s.orders], cart: [], seq, ...(discountPaise ? { coupon: { ...s.coupon!, usedAt: new Date().toISOString() } } : {}) })
        get().notify({ title: 'Order placed', body: `${order.code}, we’ll let you know when it ships.`, href: `/app/orders/view?id=${order.id}` })
        return order
      },
      buyPlan: (id, pricePaise) => {
        const plan: Plan = { id, months: PLANS[id].months, pricePaise, startedAt: new Date().toISOString(), used: 0 }
        const s = get()
        const coupon = s.coupon ?? { code: 'WELCOME15', pct: COUPON_PCT, expiresAt: new Date(Date.now() + COUPON_DAYS * 864e5).toISOString() }
        set({ plan, coupon })
        get().notify({ title: `${PLANS[id].name} active`, body: `${COUPON_PCT}% off your first shop order. Code ${coupon.code}, valid ${COUPON_DAYS} days.`, href: '/app/shop' })
        return plan
      },
      setOffer: (o) => set((s) => ({ offer: { ...s.offer, ...o } })),
      confirmTime: (id) => {
        // preview of the staff side: the team sets a time (next day, 11:00 IST, or the client's preferred date) and, for a plain
        // appointment request, the type and fee (owner 2026-11-21) — then the client pays in the app ("Complete your booking")
        const before = get().appointments.find((x) => x.id === id)
        const returning = !!get().blend || get().appointments.some((x) => x.id !== id && x.status === 'completed')
        set((s) => ({ appointments: s.appointments.map((x) => {
          if (x.id !== id) return x
          let y: Appointment = x.timeTbc
            ? { ...x, timeTbc: false, timeRequested: false, startsAt: istDate(x.prefs?.date ? new Date(`${x.prefs.date}T00:00:00+05:30`) : new Date(Date.now() + 864e5), '11:00').toISOString() }
            : { ...x, timeRequested: false }
          if (y.kindTbc) {
            const t = returning ? 'followup' : 'first'
            const fee = CONSULTATIONS.find((c) => c.id === t)!.feePaise
            y = { ...y, kindTbc: false, type: t, ...(y.planId ? { amountPaise: 0 } : { amountPaise: fee, status: 'awaiting_payment', source: 'manager' }) }
          }
          return y
        }) }))
        const after = get().appointments.find((x) => x.id === id)
        if (before?.kindTbc && after?.status === 'awaiting_payment')
          get().notify({ title: 'Your appointment is set', body: `Pay ${formatINR(after.amountPaise)} in the app to confirm it.`, href: `/app/pay?appointment=${id}` })
        else get().notify({ title: 'Your time is confirmed', body: 'Jitendra Khimlani will see you then.', href: `/app/sessions/view?id=${id}` })
      },
      subscribeOrder: (id, keys) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, subscribed: keys } : o)) })),
      reviewOrder: (id, rating, text) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, review: { rating, text, at: new Date().toISOString() } } : o)) })),
      pushChat: (m) => set((s) => ({ chat: [...s.chat, { ...m, id: uid(), at: new Date().toISOString() }].slice(-80) })),
      clearChat: () => set({ chat: [] }),
      readNotices: () => set((s) => ({ notices: s.notices.map((n) => ({ ...n, read: true })) })),
      notify: (n) => set((s) => ({ notices: [{ ...n, id: uid(), at: new Date().toISOString(), read: false }, ...s.notices].slice(0, 30) })),
      loadDemo: () => set((s) => demoState(s)),
      resetAll: () => set({ ...initial }),
    }),
    {
      name: 'bewise-client-v1',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: ({ hydrated, ...rest }) => rest as unknown as State,
    },
  ),
)

/** Preview-only "returning client" journey so every screen can be explored. */
function demoState(s: State): Partial<State> {
  const now = new Date()
  const d = (days: number, h = 10, m = 0) => { const x = new Date(now); x.setDate(x.getDate() + days); x.setHours(h, m, 0, 0); return x }
  const pattern: Emotion[] = ['anxious', 'tired', 'anxious', 'sad', 'tired', 'calm', 'anxious', 'calm', 'tired', 'calm', 'hopeful', 'calm', 'joyful', 'calm']
  const journal: JournalEntry[] = pattern.flatMap((e, i) => {
    const day = 13 - i
    const out: JournalEntry[] = [{ id: uid(), emotion: e, at: d(-day, 9, 20 + i).toISOString() }]
    if (i % 3 === 0) out.push({ id: uid(), emotion: i > 8 ? 'grateful' : 'tired', at: d(-day, 20, 5).toISOString() })
    return out
  }).reverse()
  const drops: Record<string, boolean> = {}
  for (let i = 1; i <= 12; i++) drops[dayKey(d(-i))] = i % 5 !== 0
  const doses: Record<string, number> = {}
  for (let i = 1; i <= 12; i++) doses[dayKey(d(-i))] = i % 5 === 0 ? 1 : i % 3 === 0 ? 3 : 4
  const first: Appointment = { id: 'demo-a1', code: 'BW-A-00038', type: 'first', mode: 'online', startsAt: d(-14, 11).toISOString(), status: 'completed', amountPaise: 100000, createdAt: d(-17).toISOString() }
  const next: Appointment = { id: 'demo-a2', code: 'BW-A-00041', type: 'followup', mode: 'online', startsAt: d(3, 11).toISOString(), status: 'confirmed', amountPaise: 80000, createdAt: d(-1).toISOString() }
  const addr: Address = { id: 'demo-addr', name: s.profile?.name || 'Priya Shah', phone: s.profile?.phone || '9876543210', line1: '12, Shanti Kunj', line2: 'Alkapuri', city: 'Vadodara', state: 'Gujarat', pin: '390007' }
  return {
    journal: [...journal, ...s.journal],
    drops, doses,
    appointments: [first, next],
    blend: { name: 'Personal blend', version: 1, flowers: ['Mimulus', 'White Chestnut', 'Larch', 'Impatiens', 'Walnut'], drops: 4, timesPerDay: 4, startedOn: d(-13).toISOString(), days: 25, reminderTimes: ['08:00', '13:00', '18:00', '22:00'], alcoholFree: true },
    goals: s.goals.length ? s.goals : [{ id: uid(), title: 'Sleep by 11 PM', progress: 0, done: false, kind: 'daily', days: [-1, -2, -3].map((n) => isoDay(d(n))) }, { id: uid(), title: 'Finish a 30-day morning walk habit', progress: 0, done: false, kind: 'once' }],
    addresses: s.addresses.length ? s.addresses : [addr],
    orders: [{ id: 'demo-o1', code: 'BW-00040', lines: [{ key: 'remedy', name: 'Personal blend v1', label: '30 ml', qty: 1, pricePaise: 0, kind: 'remedy' }, { key: 'sleep-roll-on-15', name: 'Sleep Roll-on', label: '15 ml', qty: 1, pricePaise: 60000, kind: 'product' }], totalPaise: 60000, address: addr, placedAt: d(-12).toISOString(), stage: 3 }],
    profile: s.profile ? { ...s.profile, allergies: s.profile.allergies.length ? s.profile.allergies : ['lavender'] } : s.profile,
    intake: s.intake ?? { answers: { ...emptyIntake(), feelings: ['Fear', 'Overthinking'] }, step: 99, submittedAt: d(-16).toISOString() },
  }
}

/** Call once on the client to rehydrate persisted state without SSR mismatches. */
export function hydrateStore() {
  if (useApp.getState().hydrated) return
  Promise.resolve(useApp.persist.rehydrate()).then(() => useApp.setState({ hydrated: true }))
}

export const isProduct = (k: string) => PRODUCTS.some((p) => p.variants.some((v) => v.id === k))
