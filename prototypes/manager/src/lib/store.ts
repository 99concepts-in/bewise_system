/**
 * Single client-side store for the prototype. Every action mirrors a server function from the manager specs
 * (docs/specs/manager/01…05) so swapping in real calls later is mechanical. No refunds anywhere (D-16).
 */
import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { seed, bachId } from './seed'
import type { Expense, Movement, MovementType, Order, Product, Route, RouteName, Shipment, Stage, StockItem } from './types'
import { dateKey, uid } from './format'

type Data = ReturnType<typeof seed>
export type Toast = { id: string; text: string; tone: 'good' | 'info' | 'bad' }

interface UI {
  root: RouteName
  stack: Route[]
  toasts: Toast[]
  bloom: number           // increments → celebratory bloom
  quickOpen: boolean
  intent: string | null
}
interface Actions {
  go: (r: Route) => void
  setRoot: (r: RouteName, intent?: string) => void
  clearIntent: () => void
  back: () => void
  toast: (text: string, tone?: Toast['tone']) => void
  dismissToast: (id: string) => void
  setQuick: (v: boolean) => void
  reset: () => void

  toggleCheck: (orderId: string, key: string) => void
  advance: (orderId: string, to: Stage, note?: string) => void
  sendToQc: (orderId: string) => void
  qc: (orderId: string, result: 'pass' | 'redo', note?: string, photo?: string) => void
  packed: (orderId: string, weightG: number, box: string) => void
  dispatch: (orderId: string, s: Omit<Shipment, 'events'>) => void
  handOver: (orderId: string, collector: string) => void
  delivered: (orderId: string) => void
  reattempt: (orderId: string) => void
  reportFailed: (orderId: string, reason: string) => void
  sendReplacement: (orderId: string, reason: string) => string
  setDelivery: (orderId: string, d: Order['delivery']) => void

  adjustStock: (id: string, delta: number, reason: string, type?: MovementType) => void
  saveProduct: (p: Product) => void
  patchVariant: (pid: string, vid: string, patch: Partial<Product['variants'][number]>) => void
  setProductStatus: (pid: string, status: Product['status']) => void

  recordPayment: (invoiceId: string, amountPaise: number, method: string, ref?: string) => void
  remind: (invoiceId: string, channel: 'whatsapp' | 'email') => void
  payBill: (billId: string) => void
  addExpense: (e: Omit<Expense, 'id' | 'code' | 'at' | 'status'>) => void

  advanceBatch: (id: string) => void
  newBatch: (productId: string, variantId: string, units: number) => string
  receivePO: (id: string, received: Record<string, number>, billPaise: number) => void
  createPO: (stockId: string) => string

  checkIn: (apptId: string) => void
  walkIn: (input: { name: string; phone: string; type: 'First consultation' | 'Follow-up'; minutes: number; startsAt: number; method: string; amountPaise: number }) => void
  readNotes: () => void
}
export type State = Data & UI & Actions

const safeStorage: StateStorage = {
  getItem: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  setItem: (k, v) => { try { localStorage.setItem(k, v) } catch { /* storage blocked */ } },
  removeItem: (k) => { try { localStorage.removeItem(k) } catch { /* storage blocked */ } },
}

const ROOTS: RouteName[] = ['today', 'orders', 'money', 'me', 'shipments', 'appointments', 'clients', 'products', 'stock', 'production', 'purchases', 'reports', 'notifications']
const readHash = (): RouteName => {
  try { const h = location.hash.slice(1) as RouteName; return ROOTS.includes(h) ? h : 'today' } catch { return 'today' }
}
const writeHash = (r: RouteName) => { try { history.replaceState(null, '', '#' + r) } catch { /* sandboxed */ } }

const mv = (type: MovementType, qty: number, ref: string, note?: string): Movement => ({ id: uid(), type, qty, at: Date.now(), ref, note })
function move(stock: StockItem[], id: string, m: Movement, reservedDelta = 0) {
  return stock.map((s) => s.id === id ? { ...s, qty: Math.max(0, +(s.qty + m.qty).toFixed(3)), reserved: Math.max(0, s.reserved + reservedDelta), movements: [m, ...s.movements] } : s)
}
const stamp = (o: Order, stage: Stage, note?: string): Order => ({ ...o, stage, history: [...o.history, { stage, at: Date.now(), note }] })

export const useStore = create<State>()(persist((set, get) => {
  const patchOrder = (id: string, fn: (o: Order) => Order) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? fn(o) : o)) }))
  const order = (id: string) => get().orders.find((o) => o.id === id)!
  return {
    ...seed(),
    root: readHash(),
    stack: [],
    toasts: [],
    bloom: 0,
    quickOpen: false,
    intent: null,

    go: (r) => { set((s) => ({ stack: [...s.stack, r], quickOpen: false })); try { window.scrollTo({ top: 0 }) } catch { /* noop */ } },
    setRoot: (r, intent) => { writeHash(r); set({ root: r, stack: [], quickOpen: false, intent: intent ?? null }); try { window.scrollTo({ top: 0 }) } catch { /* noop */ } },
    clearIntent: () => set({ intent: null }),
    back: () => { set((s) => ({ stack: s.stack.slice(0, -1) })); try { window.scrollTo({ top: 0 }) } catch { /* noop */ } },
    toast: (text, tone = 'good') => {
      const id = uid()
      set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, tone }] }))
      setTimeout(() => get().dismissToast(id), 2600)
    },
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    setQuick: (v) => set({ quickOpen: v }),
    reset: () => { set({ ...seed(), stack: [] }); get().toast('Demo data reset') },

    toggleCheck: (id, key) => patchOrder(id, (o) => ({ ...o, checks: { ...o.checks, [key]: !o.checks[key] } })),
    advance: (id, to, note) => patchOrder(id, (o) => stamp(o, to, note)),
    sendToQc: (id) => {
      const o = order(id)
      let stock = get().stock
      if (o.prep) {
        const ref = o.code
        for (const f of o.prep.flowers) stock = move(stock, bachId(f.name), mv('remedy_prep_consume', -(f.drops / 20), ref, `${f.drops} drops`))
        const flowerMl = o.prep.flowers.reduce((s, f) => s + f.drops / 20, 0)
        stock = move(stock, o.alcoholFree ? 'rm-glycerine' : 'rm-brandy', mv('remedy_prep_consume', -+(o.prep.bottleMl - flowerMl).toFixed(2), ref, 'Base fill'))
        stock = move(stock, 'pk-drop30', mv('remedy_prep_consume', -1, ref))
        stock = move(stock, 'pk-label', mv('remedy_prep_consume', -1, ref))
      }
      set({ stock })
      patchOrder(id, (x) => stamp(x, 'quality_check'))
    },
    qc: (id, result, note, photo) => {
      if (result === 'pass') patchOrder(id, (o) => stamp({ ...o, qc: { result, note, photo } }, 'packing'))
      else {
        set((s) => ({ stock: move(move(s.stock, 'pk-drop30', mv('wastage', -1, order(id).code, 'QC redo')), 'pk-label', mv('wastage', -1, order(id).code, 'QC redo')) }))
        patchOrder(id, (o) => stamp({ ...o, qc: { result, note, photo }, checks: {} }, 'preparing', note))
      }
    },
    packed: (id, weightG, box) => {
      const boxId = box === 'Medium' ? 'pk-box-m' : 'pk-box-s'
      set((s) => ({ stock: move(s.stock, boxId, mv('sale', -1, order(id).code, 'Mailer box')) }))
      patchOrder(id, (o) => stamp({ ...o, pack: { weightG, box } }, 'ready_to_dispatch'))
    },
    dispatch: (id, sh) => {
      const o = order(id)
      let stock = get().stock
      for (const i of o.items) if (i.variantId) stock = move(stock, 'fg-' + i.variantId, mv('sale', -i.qty, o.code), -i.qty)
      set((s) => ({ stock, bloom: s.bloom + 1 }))
      patchOrder(id, (x) => stamp({ ...x, problem: undefined, shipment: { ...sh, events: [{ label: sh.provider === 'shiprocket' ? 'Shipment created · pickup scheduled' : 'Handed to courier', at: Date.now() }] } }, 'dispatched'))
    },
    handOver: (id, collector) => {
      const o = order(id)
      let stock = get().stock
      for (const i of o.items) if (i.variantId) stock = move(stock, 'fg-' + i.variantId, mv('sale', -i.qty, o.code), -i.qty)
      set((s) => ({ stock, bloom: s.bloom + 1 }))
      patchOrder(id, (x) => stamp(stamp(x, 'dispatched', 'Studio pickup'), 'delivered', `Collected by ${collector}`))
    },
    delivered: (id) => patchOrder(id, (o) => stamp({ ...o, problem: undefined, shipment: o.shipment && { ...o.shipment, events: [...o.shipment.events, { label: 'Delivered', at: Date.now() }] } }, 'delivered')),
    reportFailed: (id, reason) => patchOrder(id, (o) => stamp({ ...o, problem: reason, shipment: o.shipment && { ...o.shipment, events: [...o.shipment.events, { label: 'Delivery attempt failed · ' + reason, at: Date.now() }] } }, 'failed_delivery', reason)),
    reattempt: (id) => patchOrder(id, (o) => stamp({ ...o, problem: undefined, shipment: o.shipment && { ...o.shipment, events: [...o.shipment.events, { label: 'Reattempt requested', at: Date.now() }] } }, 'dispatched', 'Reattempt')),
    sendReplacement: (id, reason) => {
      const o = order(id)
      const n = get().seq.order + 1
      const code = `BW-${String(n).padStart(5, '0')}`
      const nid = 'o' + n
      const fresh: Order = {
        ...o, id: nid, code, stage: 'new', paidAt: Date.now(), dueAt: Date.now() + 24 * 3600e3, totalPaise: 0, checks: {}, qc: undefined, pack: undefined,
        shipment: undefined, problem: undefined, replacementOf: o.code, items: o.items.map((i) => ({ ...i, pricePaise: 0 })), history: [{ stage: 'new', at: Date.now(), note: `Replacement for ${o.code} · ${reason}` }],
      }
      set((s) => ({ orders: [fresh, ...s.orders.map((x) => (x.id === id ? { ...x, problem: `Replacement sent · ${code}` } : x))], seq: { ...s.seq, order: n } }))
      return nid
    },
    setDelivery: (id, d) => patchOrder(id, (o) => ({ ...o, delivery: d })),

    adjustStock: (id, delta, reason, type = 'adjustment') => set((s) => ({ stock: move(s.stock, id, mv(type, delta, 'Manual', reason)) })),
    saveProduct: (p) => set((s) => {
      const exists = s.products.some((x) => x.id === p.id)
      const stock = [...s.stock]
      for (const v of p.variants) if (!stock.some((x) => x.id === v.stockId))
        stock.push({ id: v.stockId, code: `FG-${v.sku}`, name: `${p.name} ${v.label}`, kind: 'finished_good', group: p.collection, unit: 'pcs', qty: 0, reserved: 0, reorderLevel: 10, reorderQty: 40, avgCostPaise: v.costPaise, movements: [] })
      return { products: exists ? s.products.map((x) => (x.id === p.id ? p : x)) : [p, ...s.products], stock }
    }),
    patchVariant: (pid, vid, patch) => set((s) => ({ products: s.products.map((p) => p.id !== pid ? p : { ...p, variants: p.variants.map((v) => (v.id === vid ? { ...v, ...patch } : v)) }) })),
    setProductStatus: (pid, status) => set((s) => ({ products: s.products.map((p) => (p.id === pid ? { ...p, status } : p)) })),

    recordPayment: (id, amount, method, ref) => set((s) => ({
      invoices: s.invoices.map((i) => i.id !== id ? i : { ...i, paidPaise: Math.min(i.totalPaise, i.paidPaise + amount), payments: [...i.payments, { at: Date.now(), amountPaise: amount, method, ref }] }),
    })),
    remind: (id, channel) => set((s) => ({ invoices: s.invoices.map((i) => (i.id === id ? { ...i, reminders: [...i.reminders, { at: Date.now(), channel }] } : i)) })),
    payBill: (id) => set((s) => ({ bills: s.bills.map((b) => (b.id === id ? { ...b, status: 'paid' } : b)) })),
    addExpense: (e) => set((s) => {
      const n = s.seq.expense + 1
      return { expenses: [{ ...e, id: uid(), code: `EXP/2026-27/${String(n).padStart(4, '0')}`, at: Date.now(), status: 'submitted' }, ...s.expenses], seq: { ...s.seq, expense: n } }
    }),

    advanceBatch: (id) => set((s) => {
      const b = s.batches.find((x) => x.id === id)!
      const step = Math.min(5, b.step + 1)
      let stock = s.stock
      let costPaise = b.costPaise
      if (step === 1) for (const m of b.materials) {
        const item = stock.find((x) => x.id === m.stockId)
        costPaise += Math.round((item?.avgCostPaise ?? 0) * m.qty)
        stock = move(stock, m.stockId, mv('production_consume', -m.qty, b.code))
      }
      const extra = step === 2 ? { mfg: dateKey(0), expiry: dateKey(730) } : {}
      if (step === 5) {
        const p = s.products.find((x) => x.id === b.productId)!
        const v = p.variants.find((x) => x.id === b.variantId)!
        const good = Math.round(b.units * (1 - (b.wastagePct ?? 1) / 100))
        stock = move(stock, v.stockId, mv('production_output', good, b.code))
        return { stock, bloom: s.bloom + 1, batches: s.batches.map((x) => (x.id === id ? { ...x, step, costPaise, wastagePct: x.wastagePct ?? 1 } : x)) }
      }
      return { stock, batches: s.batches.map((x) => (x.id === id ? { ...x, step, costPaise, ...extra } : x)) }
    }),
    newBatch: (productId, variantId, units) => {
      const n = get().seq.batch + 1
      const id = uid()
      const kind = get().products.find((p) => p.id === productId)!.kind
      const materials = kind === 'salt' ? [{ stockId: 'rm-epsom', qty: units * 240 }, { stockId: 'rm-lavender', qty: Math.ceil(units / 2) }, { stockId: 'pk-jar250', qty: units }]
        : kind === 'spray' ? [{ stockId: 'rm-rose', qty: units * 60 }, { stockId: 'rm-lavender', qty: Math.ceil(units / 3) }, { stockId: 'pk-spray100', qty: units }]
          : [{ stockId: 'rm-almond', qty: units * 28 }, { stockId: 'rm-lavender', qty: Math.ceil(units / 3) }, { stockId: 'pk-drop30', qty: units }]
      const yymm = dateKey(0).slice(2, 7).replace('-', '')
      set((s) => ({ batches: [{ id, code: `BW-B-${yymm}-${String(n).padStart(2, '0')}`, productId, variantId, units, step: 0, costPaise: 0, materials }, ...s.batches], seq: { ...s.seq, batch: n } }))
      return id
    },
    receivePO: (id, received, billPaise) => set((s) => {
      const po = s.pos.find((p) => p.id === id)!
      let stock = s.stock
      const lines = po.lines.map((l) => {
        const q = received[l.stockId] ?? 0
        if (q > 0) {
          const item = stock.find((x) => x.id === l.stockId)!
          // moving weighted average
          const avg = Math.round((item.avgCostPaise * item.qty + l.pricePaise * q) / (item.qty + q))
          stock = move(stock, l.stockId, mv('purchase_receipt', q, po.code)).map((x) => (x.id === l.stockId ? { ...x, avgCostPaise: avg } : x))
        }
        return { ...l, received: l.received + q }
      })
      const status = lines.every((l) => l.received >= l.ordered) ? 'received' : 'partial'
      const supplier = s.suppliers.find((x) => x.id === po.supplierId)!
      return {
        stock, pos: s.pos.map((p) => (p.id === id ? { ...p, lines, status } : p)),
        bills: billPaise > 0 ? [{ id: uid(), party: supplier.name, label: `Bill against ${po.code}`, amountPaise: billPaise, dueOn: dateKey(15), status: 'due' as const, poId: id }, ...s.bills] : s.bills,
      }
    }),
    createPO: (stockId) => {
      const s = get()
      const item = s.stock.find((x) => x.id === stockId)!
      const n = s.seq.po + 1
      const supplierId = item.group === 'Bach stock concentrates' ? 's1' : item.kind === 'packaging' ? 's3' : 's2'
      const id = uid()
      set({ pos: [{ id, code: `PO/2026-27/${String(n).padStart(4, '0')}`, supplierId, status: 'sent', expectedOn: dateKey(5), lines: [{ stockId, ordered: item.reorderQty, received: 0, pricePaise: item.avgCostPaise }] }, ...s.pos], seq: { ...s.seq, po: n } })
      return id
    },

    checkIn: (id) => set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, status: 'checked_in' } : a)) })),
    walkIn: (x) => set((s) => {
      let client = s.clients.find((c) => c.phone.replace(/\D/g, '').endsWith(x.phone.replace(/\D/g, '').slice(-10)))
      let clients = s.clients
      let seq = s.seq
      if (!client) {
        const n = s.seq.client + 1
        client = { id: uid(), code: `BW-C-${String(n).padStart(5, '0')}`, name: x.name, city: 'Vadodara', phone: x.phone, address: '', pincode: '', since: Date.now() }
        clients = [client, ...clients]
        seq = { ...seq, client: n }
      }
      const n = seq.inv + 1
      return {
        clients, seq: { ...seq, inv: n },
        appointments: [...s.appointments, { id: uid(), clientId: client.id, startsAt: x.startsAt, minutes: x.minutes, type: x.type, mode: 'in_person' as const, status: 'confirmed' as const }].sort((a, b) => a.startsAt - b.startsAt),
        invoices: [{ id: uid(), code: `INV/2026-27/${String(n).padStart(4, '0')}`, clientId: client.id, label: `${x.type} (walk-in)`, totalPaise: x.amountPaise, paidPaise: x.amountPaise, issuedOn: dateKey(0), dueOn: dateKey(0), reminders: [], payments: [{ at: Date.now(), amountPaise: x.amountPaise, method: x.method }] }, ...s.invoices],
      }
    }),
    readNotes: () => set((s) => ({ notes: s.notes.map((n) => ({ ...n, read: true })) })),
  }
}, {
  name: 'bewise-ops-demo-v1',
  storage: createJSONStorage(() => safeStorage),
  partialize: (s) => {
    const { stack: _s, toasts: _t, bloom: _b, quickOpen: _q, root: _r, intent: _i, ...rest } = s
    void _s; void _t; void _b; void _q; void _r; void _i
    return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')) as Partial<State>
  },
}))

export const current = (s: State): Route => s.stack[s.stack.length - 1] ?? { name: s.root }

/** derived helpers */
export const isOpen = (st: Stage) => ['new', 'preparing', 'quality_check', 'packing', 'ready_to_dispatch'].includes(st)
export const available = (i: StockItem) => +(i.qty - i.reserved).toFixed(3)
export const isLow = (i: StockItem) => available(i) <= i.reorderLevel
