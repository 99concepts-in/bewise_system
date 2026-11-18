/**
 * @module   ops-prototype
 * @owner    MANAGER
 * Purpose:  Front-end types for the manager prototype. They mirror docs/03-CONTRACTS.md enums so screens port to
 *           src/app/(manager)/ops once the foundation exists. Money = integer paise.
 */
export type Stage =
  | 'new' | 'preparing' | 'quality_check' | 'packing' | 'ready_to_dispatch'
  | 'dispatched' | 'delivered' | 'failed_delivery' | 'rto' | 'cancelled'
export type OrderKind = 'remedy' | 'store' | 'combined'
export type DeliveryMethod = 'courier' | 'studio_pickup'

export interface Flower { name: string; drops: number }
export interface OrderItem { id: string; name: string; qty: number; kind: 'remedy' | 'product'; variantId?: string; pricePaise: number }
export interface Shipment {
  provider: 'shiprocket' | 'manual'
  courier: string; awb: string; freightPaise: number; etd: string; pickupOn?: string
  events: { label: string; at: number }[]
}
export interface Order {
  id: string; code: string; clientId: string; kind: OrderKind; items: OrderItem[]
  totalPaise: number; paidAt: number; dueAt: number; stage: Stage; delivery: DeliveryMethod
  alcoholFree: boolean
  /** consultation.getPrepSheet() shape (accepted 2026-11-18). All blends are alcohol-free (owner 2026-11-18). */
  prep?: { blend: string; bottleMl: number; flowers: Flower[]; label: string; dosage: { drops: number; timesPerDay: number; weeks: number }; base: 'alcohol_free' }
  remedyOrderId?: string
  checks: Record<string, boolean>
  qc?: { result: 'pass' | 'redo'; note?: string; photo?: string }
  pack?: { weightG: number; box: string }
  shipment?: Shipment
  problem?: string
  replacementOf?: string
  history: { stage: Stage; at: number; note?: string }[]
}

export type Pronoun = 'she' | 'he' | 'they'
export const pron = (p: Pronoun) => (p === 'she' ? { obj: 'her', poss: 'her' } : p === 'he' ? { obj: 'him', poss: 'his' } : { obj: 'them', poss: 'their' })

export interface Client {
  id: string; code: string; name: string; city: string; phone: string; email?: string
  address: string; pincode: string; since: number
  pronoun: Pronoun   // she | he | they — default they (consultant request 2026-11-18)
}

export interface Variant { id: string; label: string; sku: string; mrpPaise: number; pricePaise: number; costPaise: number; weightG: number; active: boolean; stockId: string }
export interface Product {
  id: string; name: string; collection: string; kind: 'oil' | 'spray' | 'salt'
  short: string; description: string; ingredients: string; howTo: string; safety: string
  status: 'draft' | 'active' | 'archived'; hsn: string; gst: number; hue: [string, string]
  variants: Variant[]; sample?: boolean
}

export type StockKind = 'raw_material' | 'packaging' | 'finished_good'
export type MovementType = 'purchase_receipt' | 'production_consume' | 'production_output' | 'sale' | 'remedy_prep_consume' | 'adjustment' | 'return' | 'wastage'
export interface Movement { id: string; type: MovementType; qty: number; at: number; ref: string; note?: string }
export interface StockItem {
  id: string; code: string; name: string; kind: StockKind; group: string; unit: 'ml' | 'g' | 'pcs'
  qty: number; reserved: number; reorderLevel: number; reorderQty: number
  avgCostPaise: number           // per unit, display only — value = qty × avg (moving weighted average)
  expiresOn?: string; movements: Movement[]
}

export const BATCH_STEPS = ['Request', 'Materials', 'Produce', 'Quality check', 'Bottle & label', 'Received'] as const
export interface Batch {
  id: string; code: string; productId: string; variantId: string; units: number; step: number
  mfg?: string; expiry?: string; costPaise: number; wastagePct?: number
  materials: { stockId: string; qty: number }[]
}

export interface Supplier { id: string; name: string; city: string; phone: string }
export interface PurchaseOrder {
  id: string; code: string; supplierId: string; status: 'sent' | 'partial' | 'received'; expectedOn: string
  lines: { stockId: string; ordered: number; received: number; pricePaise: number }[]
}

export interface Invoice {
  id: string; code: string; clientId: string; label: string; totalPaise: number; paidPaise: number
  issuedOn: string; dueOn: string; reminders: { at: number; channel: 'whatsapp' | 'email' }[]
  payments: { at: number; amountPaise: number; method: string; ref?: string }[]
}
export interface Bill { id: string; party: string; label: string; amountPaise: number; dueOn: string; status: 'due' | 'paid'; recurring?: boolean; poId?: string }
export interface Expense { id: string; code: string; amountPaise: number; category: string; paidFrom: string; note: string; at: number; status: 'submitted' | 'approved' | 'rejected'; receipt?: string }

export interface Appointment {
  id: string; clientId: string; startsAt: number; minutes: number; type: 'First consultation' | 'Follow-up'
  mode: 'in_person' | 'online'; status: 'awaiting_payment' | 'confirmed' | 'checked_in' | 'completed'
  invoiceId?: string; greeting?: string
}
export interface Note { id: string; title: string; body: string; at: number; read: boolean; tone: 'info' | 'good' | 'bad' | 'warn'; route?: Route }

export type RouteName =
  | 'today' | 'orders' | 'money' | 'me' | 'shipments' | 'appointments' | 'clients' | 'products' | 'stock'
  | 'production' | 'purchases' | 'reports' | 'notifications'
  | 'order' | 'client' | 'product' | 'stockItem' | 'batch' | 'po' | 'invoice'
export interface Route { name: RouteName; id?: string; intent?: string }

/** Outbox events the real build emits (docs/03-CONTRACTS.md §4) — logged in the prototype so the flow is visible. */
export interface DomainEvent { id: string; type: string; at: number; payload: Record<string, unknown> }
