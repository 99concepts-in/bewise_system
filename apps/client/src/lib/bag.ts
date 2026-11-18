'use client'
/** @module commerce-ux @owner CLIENT — bag totals (preview mirror of commerce.getCart() server totals). */
import { cartLineInfo, couponDiscount, couponOk, useApp } from './store'

export const FREE_SHIP_PAISE = 99900, SHIP_PAISE = 6000 // @decision placeholder — shipping.rates (OWNER settings)
export function useBagTotals() {
  const cart = useApp((s) => s.cart)
  const lines = cart.map((l) => ({ l, i: cartLineInfo(l) })).filter((x) => x.i)
  const sub = lines.reduce((t, x) => t + x.i!.pricePaise * x.l.qty, 0)
  const ship = sub === 0 || sub >= FREE_SHIP_PAISE ? 0 : SHIP_PAISE
  const coupon = useApp((s) => s.coupon)
  const discount = couponDiscount({ coupon }, lines.map((x) => ({ pricePaise: x.i!.pricePaise, qty: x.l.qty, kind: x.i!.kind })))
  return { lines, sub, ship, discount, coupon: couponOk(coupon) ? coupon : null, total: sub - discount + ship }
}

