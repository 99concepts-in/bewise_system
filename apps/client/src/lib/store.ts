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
import { PRODUCTS, REORDER_PRICE_PAISE, variantById } from './data'
import { uid, dayKey } from './format'

export type Profile = {
  name: string; phone: string; dob: string; city: string; gender?: string
  photo?: string; consents: { wellbeing: boolean; whatsapp: boolean; offers: boolean }
  allergies: string[]; onboardedAt?: string
}
export type JournalEntry = { id: string; emotion: Emotion; at: string }
export type Goal = { id: string; title: string; progress: number; done: boolean }
export type Feedback = { rating: number; tags: string[]; notes: string }
export type Appointment = {
  id: string; code: string; type: ConsultationId; mode: 'online' | 'in_person'; startsAt: string
  status: 'confirmed' | 'completed'; amountPaise: number; createdAt: string; feedback?: Feedback; rescheduled?: number
}
export type IntakeAnswers = {
  who: 'me' | 'child' | 'someone_else'; dependent?: { name: string; age: string; relation: string }
  onMind: string; duration?: 'Days' | 'Weeks' | 'Months' | 'Years'
  feelings: string[]; nuance: Record<string, { statements: string[]; intensity?: 'Mild' | 'Moderate' | 'Strong' }>
  bodyAny?: boolean; body: string[]; bodyTypes: string[]
  sleepQuality?: Emotion; hours?: string; wakes?: boolean; energy: number; stress: number
  life: string[]; lifeOther: string
  safety: { doctor?: boolean; medicines?: boolean; medicinesText: string; pregnant?: boolean; alcoholFree?: boolean; allergies?: boolean; allergiesText: string }
  selfHarm?: 'No' | 'Sometimes' | 'Often'
  goals: string[]; goalText: string
  consentAi: boolean
}
export type Blend = { name: string; version: number; flowers: string[]; drops: number; timesPerDay: number; startedOn: string; days: number; reminderTimes: string[]; alcoholFree: boolean }
export type CartLine = { key: string; qty: number } // key = variantId | 'remedy-reorder'
export type Address = { id: string; name: string; phone: string; line1: string; line2: string; city: string; state: string; pin: string }
export type OrderLine = { key: string; name: string; label: string; qty: number; pricePaise: number; kind: 'product' | 'remedy' }
export type Order = { id: string; code: string; lines: OrderLine[]; totalPaise: number; address: Address; placedAt: string; stage: 0 | 1 | 2 | 3 }
export type ChatMsg = { id: string; role: 'user' | 'bot'; text: string; products?: string[]; actions?: { id: string; label: string }[]; safety?: boolean; at: string }
export type Notice = { id: string; title: string; body: string; at: string; read: boolean; href?: string }

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
  ritual: Record<string, number>
  cart: CartLine[]
  wishlist: string[]
  addresses: Address[]
  orders: Order[]
  chat: ChatMsg[]
  notices: Notice[]
  seq: number
  // actions
  setProfile: (p: Partial<Profile>) => void
  logMood: (e: Emotion, at?: Date) => JournalEntry          // journal.createEntry
  removeMood: (id: string) => void
  addGoal: (title: string) => void
  updateGoal: (id: string, patch: Partial<Goal>) => void
  removeGoal: (id: string) => void
  saveIntake: (answers: IntakeAnswers, step: number) => void // intake.saveIntakeDraft
  submitIntake: () => void                                   // intake.submitIntake
  book: (a: Omit<Appointment, 'id' | 'code' | 'createdAt' | 'status'>) => Appointment // holdAppointment + payment.captured
  reschedule: (id: string, startsAt: string) => void         // scheduling.rescheduleAppointment
  giveFeedback: (id: string, f: Feedback) => void            // scheduling.submitSessionFeedback
  takeDrop: (date?: Date) => void
  untakeDrop: (date?: Date) => void
  setReminderTimes: (t: string[]) => void
  addToCart: (key: string, qty?: number) => void             // commerce.addToCart
  setQty: (key: string, qty: number) => void
  toggleWish: (slug: string) => void
  upsertAddress: (a: Omit<Address, 'id'> & { id?: string }) => Address // crm.upsertAddress
  placeOrder: (addressId: string) => Order                   // commerce.createOrderFromCart + payment
  pushChat: (m: Omit<ChatMsg, 'id' | 'at'>) => void
  clearChat: () => void
  readNotices: () => void
  notify: (n: Omit<Notice, 'id' | 'at' | 'read'>) => void
  loadDemo: () => void
  resetAll: () => void
}

const initial = {
  profile: null, journal: [], goals: [], appointments: [], intake: null, blend: null, ritual: {}, cart: [], wishlist: [],
  addresses: [], orders: [], chat: [], notices: [], seq: 41,
}

export const cartLineInfo = (l: CartLine) => {
  if (l.key === 'remedy-reorder') return { name: 'Personal blend', label: '30 ml', pricePaise: REORDER_PRICE_PAISE, kind: 'remedy' as const, art: 'p-dropper' }
  const v = variantById(l.key)
  if (!v) return null
  return { name: v.product.name, label: v.variant.label, pricePaise: v.variant.pricePaise, kind: 'product' as const, art: v.product.art, product: v.product }
}

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...initial,
      setProfile: (p) => set((s) => ({ profile: { ...(s.profile ?? { name: '', phone: '', dob: '', city: '', consents: { wellbeing: false, whatsapp: false, offers: false }, allergies: [] }), ...p } })),
      logMood: (emotion, at = new Date()) => {
        const e = { id: uid(), emotion, at: at.toISOString() }
        set((s) => ({ journal: [e, ...s.journal] }))
        return e
      },
      removeMood: (id) => set((s) => ({ journal: s.journal.filter((j) => j.id !== id) })),
      addGoal: (title) => set((s) => ({ goals: [...s.goals, { id: uid(), title, progress: 0, done: false }].slice(0, 3) })),
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
        set((s) => ({ appointments: [...s.appointments, appt], seq }))
        get().notify({ title: 'You’re booked', body: 'Jitu Bhaiya will read your answers before you meet.', href: `/app/sessions/view?id=${appt.id}` })
        return appt
      },
      reschedule: (id, startsAt) => set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, startsAt, rescheduled: (a.rescheduled ?? 0) + 1 } : a)) })),
      giveFeedback: (id, f) => set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, feedback: f } : a)) })),
      takeDrop: (date = new Date()) => set((s) => {
        const k = dayKey(date); const max = s.blend?.timesPerDay ?? 4
        return { ritual: { ...s.ritual, [k]: Math.min((s.ritual[k] ?? 0) + 1, max) } }
      }),
      untakeDrop: (date = new Date()) => set((s) => { const k = dayKey(date); return { ritual: { ...s.ritual, [k]: Math.max((s.ritual[k] ?? 0) - 1, 0) } } }),
      setReminderTimes: (t) => set((s) => (s.blend ? { blend: { ...s.blend, reminderTimes: t } } : {})),
      addToCart: (key, qty = 1) => set((s) => {
        const ex = s.cart.find((l) => l.key === key)
        const max = key === 'remedy-reorder' ? 1 : 10
        return { cart: ex ? s.cart.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + qty, max) } : l)) : [...s.cart, { key, qty: Math.min(qty, max) }] }
      }),
      setQty: (key, qty) => set((s) => ({ cart: qty <= 0 ? s.cart.filter((l) => l.key !== key) : s.cart.map((l) => (l.key === key ? { ...l, qty } : l)) })),
      toggleWish: (slug) => set((s) => ({ wishlist: s.wishlist.includes(slug) ? s.wishlist.filter((x) => x !== slug) : [...s.wishlist, slug] })),
      upsertAddress: (a) => {
        const addr = { ...a, id: a.id ?? uid() } as Address
        set((s) => ({ addresses: [addr, ...s.addresses.filter((x) => x.id !== addr.id)] }))
        return addr
      },
      placeOrder: (addressId) => {
        const s = get()
        const lines: OrderLine[] = s.cart.flatMap((l) => {
          const i = cartLineInfo(l); return i ? [{ key: l.key, name: i.name, label: i.label, qty: l.qty, pricePaise: i.pricePaise, kind: i.kind }] : []
        })
        const seq = s.seq + 1
        const order: Order = {
          id: uid(), code: `BW-${String(seq).padStart(5, '0')}`, lines, totalPaise: lines.reduce((t, l) => t + l.pricePaise * l.qty, 0),
          address: s.addresses.find((a) => a.id === addressId)!, placedAt: new Date().toISOString(), stage: 0,
        }
        set({ orders: [order, ...s.orders], cart: [], seq })
        get().notify({ title: 'Order placed', body: `${order.code} — we’ll let you know when it ships.`, href: `/app/orders/view?id=${order.id}` })
        return order
      },
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
  const ritual: Record<string, number> = {}
  for (let i = 1; i <= 12; i++) ritual[dayKey(d(-i))] = i % 5 === 0 ? 2 : i % 3 === 0 ? 3 : 4
  const first: Appointment = { id: 'demo-a1', code: 'BW-A-00038', type: 'first', mode: 'online', startsAt: d(-14, 11).toISOString(), status: 'completed', amountPaise: 100000, createdAt: d(-17).toISOString() }
  const next: Appointment = { id: 'demo-a2', code: 'BW-A-00041', type: 'followup', mode: 'online', startsAt: d(3, 11).toISOString(), status: 'confirmed', amountPaise: 80000, createdAt: d(-1).toISOString() }
  const addr: Address = { id: 'demo-addr', name: s.profile?.name || 'Priya Shah', phone: s.profile?.phone || '9876543210', line1: '12, Shanti Kunj', line2: 'Alkapuri', city: 'Vadodara', state: 'Gujarat', pin: '390007' }
  return {
    journal: [...journal, ...s.journal],
    ritual,
    appointments: [first, next],
    blend: { name: 'Personal blend', version: 1, flowers: ['Mimulus', 'White Chestnut', 'Larch', 'Impatiens', 'Walnut'], drops: 4, timesPerDay: 4, startedOn: d(-13).toISOString(), days: 30, reminderTimes: ['08:00', '13:00', '18:00', '22:00'], alcoholFree: true },
    goals: s.goals.length ? s.goals : [{ id: uid(), title: 'Sleep by 11 PM', progress: 60, done: false }, { id: uid(), title: 'Morning walk 3× a week', progress: 35, done: false }],
    addresses: s.addresses.length ? s.addresses : [addr],
    orders: [{ id: 'demo-o1', code: 'BW-00040', lines: [{ key: 'remedy', name: 'Personal blend v1', label: '30 ml', qty: 1, pricePaise: 0, kind: 'remedy' }, { key: 'sleep-oil-30', name: 'Sleep Oil', label: '30 ml', qty: 1, pricePaise: 65000, kind: 'product' }], totalPaise: 65000, address: addr, placedAt: d(-12).toISOString(), stage: 3 }],
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
