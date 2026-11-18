import type { Order, Stage } from './types'

export const STAGE_LABEL: Record<Stage, string> = {
  new: 'New', preparing: 'Preparing', quality_check: 'Quality check', packing: 'Packing',
  ready_to_dispatch: 'Ready', dispatched: 'In transit', delivered: 'Delivered',
  failed_delivery: 'Delivery failed', rto: 'Returned', cancelled: 'Cancelled',
}
export type Tone = 'neutral' | 'accent' | 'sage' | 'gold' | 'ok' | 'warn' | 'bad'
export const STAGE_TONE: Record<Stage, Tone> = {
  new: 'accent', preparing: 'gold', quality_check: 'accent', packing: 'sage', ready_to_dispatch: 'ok',
  dispatched: 'neutral', delivered: 'ok', failed_delivery: 'bad', rto: 'bad', cancelled: 'neutral',
}
/** the journey an order travels — store orders skip prep & QC */
export const journey = (o: Pick<Order, 'kind' | 'delivery'>): { key: Stage; label: string }[] => {
  const steps: { key: Stage; label: string }[] = o.kind === 'store'
    ? [{ key: 'new', label: 'Paid' }, { key: 'packing', label: 'Pack' }, { key: 'ready_to_dispatch', label: 'Ready' }]
    : [{ key: 'new', label: 'Paid' }, { key: 'preparing', label: 'Prep' }, { key: 'quality_check', label: 'Check' }, { key: 'packing', label: 'Pack' }, { key: 'ready_to_dispatch', label: 'Ready' }]
  return [...steps, { key: 'dispatched', label: o.delivery === 'studio_pickup' ? 'Handed' : 'Sent' }, { key: 'delivered', label: 'Arrived' }]
}
export const journeyIndex = (o: Order) => {
  const j = journey(o)
  const s: Stage = o.stage === 'failed_delivery' || o.stage === 'rto' ? 'dispatched' : o.stage
  return Math.max(0, j.findIndex((x) => x.key === s))
}
export const KIND_LABEL = { remedy: 'Remedy', store: 'Store', combined: 'Combined' } as const

export const PREP_CHECKS = [
  { key: 'cleaned', label: 'Bottle cleaned' },
  { key: 'flowers', label: 'Flowers added' },
  { key: 'base', label: 'Base filled to 30 ml' },
  { key: 'label', label: 'Label printed and applied' },
  { key: 'sealed', label: 'Cap sealed' },
]
export const QC_CHECKS = [
  { key: 'q_flowers', label: 'Every flower on the sheet is in the bottle' },
  { key: 'q_label', label: 'Label matches the sheet' },
  { key: 'q_leak', label: 'No leak when tipped' },
  { key: 'q_clean', label: 'Bottle clean and dry' },
]
