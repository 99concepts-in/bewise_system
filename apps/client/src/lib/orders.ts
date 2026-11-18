/** @module commerce-ux @owner CLIENT — order stage labels; production status comes from fulfilment events. */
export const STAGES = ['Ordered', 'Preparing', 'Shipped', 'Delivered'] as const
export const stageOf = (o: { stage: number; placedAt: string }) => Math.max(o.stage, Math.min(3, Math.floor((Date.now() - +new Date(o.placedAt)) / (24 * 3600_000)))) // preview: advances a day at a time

