/**
 * @module   companion
 * @owner    CLIENT
 * @screens  CL-55 Ask BeWise
 * @stub     On-device intent responder for the preview. Production = companion.sendCompanionMessage (Claude, server-side,
 *           tools on the client's own data) per docs/specs/client/C7-CL-55-ask-bewise.md. Same guardrails here:
 *           no diagnosis, never changes/recommends Bach flowers, no cure claims, crisis → helplines first, actions need a tap.
 */
import { CONSULTATIONS, PRODUCTS, moodOf } from './data'
import type { Appointment, Blend, JournalEntry, Order } from './store'
import { dayKey, fmtDay, fmtTime, formatINR } from './format'
import { lastNDays } from './insights'
import { stageOf, STAGES } from './orders'

export type Ctx = { name: string; blend: Blend | null; ritualToday: number; journal: JournalEntry[]; appointments: Appointment[]; orders: Order[]; allergies: string[] }
export type Reply = { text: string; products?: string[]; actions?: { id: string; label: string }[]; quick?: string[]; safety?: boolean }

const CRISIS = /(kill myself|end my life|suicid|harm myself|hurt myself|no reason to live|want to die|don'?t want to live|marna chah|jeena nahi|khudkushi|self.?harm)/i
const BLEND_CHANGE = /(change|add|remove|switch|stronger|more|which|recommend|suggest).{0,30}(flower|remedy|blend|essence|bach)|(flower|remedy|essence).{0,20}(should i|for me|best)/i
const MEDICAL = /(diagnos|depress(ion|ed)? (disorder|medic)|medicine|tablet|dose of|stop taking|doctor said|prescri|disease|cure)/i

export function crisisCheck(text: string) { return CRISIS.test(text) }

export function respond(raw: string, c: Ctx): Reply {
  const t = raw.toLowerCase().trim()
  if (CRISIS.test(t)) return {
    safety: true,
    text: `I’m really glad you told me, ${c.name}. You deserve support right now — please call Tele-MANAS on 14416 (free, any time), or 112 if you’re in danger. Jitu Bhaiya is here for you too.`,
    quick: ['Message the team on WhatsApp', 'Book a session'],
  }
  if (BLEND_CHANGE.test(t) && !/when|time|how many|drops/.test(t)) return {
    text: 'Choosing flowers is Jitu Bhaiya’s call — he knows your story. Would you like to book a follow-up to talk it through?',
    actions: [{ id: 'book-followup', label: 'Book a follow-up' }], quick: ['When should I take my drops?'],
  }
  if (MEDICAL.test(t)) return {
    text: 'I’m not able to advise on medical questions or medicines — please keep checking with your doctor. For how you’re feeling emotionally, Jitu Bhaiya can help at your next session.',
    quick: ['When is my next session?', 'How have I been feeling?'],
  }
  if (/(drop|ritual|when should|take my|dose|blend)/.test(t)) {
    if (!c.blend) return { text: 'Your personal blend arrives after your first session with Jitu Bhaiya — it’s included in the consultation.', actions: [{ id: 'book-first', label: 'Book a consultation' }] }
    const next = c.blend.reminderTimes[c.ritualToday]
    return {
      text: `Your blend is ${c.blend.drops} drops, ${c.blend.timesPerDay} times a day. You’ve taken ${c.ritualToday} today${next ? ` — next at ${next}.` : ' — all done. Lovely.'}${next ? ' Want a reminder?' : ''}`,
      actions: next ? [{ id: `remind-${next}`, label: `Remind me at ${next}` }] : undefined, quick: ['What’s in my blend?'],
    }
  }
  if (/(in my blend|what.*flowers|which flowers)/.test(t) && c.blend) return { text: `Your blend has ${c.blend.flowers.join(', ')}. Tap any flower in My Remedies to read about it.`, actions: [{ id: 'open-remedies', label: 'Open My Remedies' }] }
  if (/(sleep|restless|can'?t switch off|insomnia|tired|night)/.test(t)) {
    const days = lastNDays(c.journal, 7).filter((d) => d.mood === 'tired').length
    const safe = PRODUCTS.filter((p) => ['sleep', 'bath'].includes(p.collection) && !p.allergens.some((a) => c.allergies.includes(a))).slice(0, 2)
    const fallback = PRODUCTS.filter((p) => p.collection === 'calm' && !p.allergens.some((a) => c.allergies.includes(a))).slice(0, 2)
    const picks = safe.length ? safe : fallback
    return {
      text: `I’m sorry it’s been restless.${days ? ` Your journal shows tired on ${days} of the last 7 days.` : ''} A slow wind-down can help — many people enjoy these in their evening routine:`,
      products: picks.map((p) => p.slug), actions: days >= 3 ? [{ id: 'book-followup', label: 'Book a follow-up with Jitu Bhaiya' }] : undefined,
    }
  }
  if (/(feel|mood|journal|week|how have i)/.test(t)) {
    const d = lastNDays(c.journal, 7).filter((x) => x.mood)
    if (!d.length) return { text: 'Your journal is empty this week. One tap on Home is enough — want to log how you feel now?', actions: [{ id: 'log', label: 'Log a feeling' }] }
    const counts = new Map<string, number>(); d.forEach((x) => counts.set(x.mood!, (counts.get(x.mood!) ?? 0) + 1))
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])
    return { text: `This week you logged ${d.length} days. Most often: ${top.slice(0, 2).map(([m, n]) => `${moodOf(m as never).label.toLowerCase()} (${n})`).join(' and ')}. Thank you for noticing — it all helps your next session.`, actions: [{ id: 'open-journal', label: 'Open journal' }] }
  }
  if (/(next|session|appointment|book|meet)/.test(t)) {
    const up = c.appointments.filter((a) => a.status === 'confirmed' && +new Date(a.startsAt) > Date.now()).sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))[0]
    if (up) return { text: `Your next session is ${fmtDay(up.startsAt)} at ${fmtTime(up.startsAt)} — ${CONSULTATIONS.find((x) => x.id === up.type)!.name.toLowerCase()}, ${up.mode === 'online' ? 'online' : 'in person'} with Jitu Bhaiya.`, actions: [{ id: `open-session-${up.id}`, label: 'View session' }] }
    return { text: 'You don’t have a session booked. A first consultation is ₹1,000 and a follow-up ₹800 — both include your remedy blend.', actions: [{ id: c.appointments.length ? 'book-followup' : 'book-first', label: 'Book now' }] }
  }
  if (/(order|deliver|track|ship|parcel)/.test(t)) {
    const o = c.orders[0]
    if (!o) return { text: 'You haven’t placed an order yet. Shall I open the shop?', actions: [{ id: 'open-shop', label: 'Open shop' }] }
    return { text: `Order ${o.code} is ${STAGES[stageOf(o)].toLowerCase()}.`, actions: [{ id: `open-order-${o.id}`, label: 'Track order' }] }
  }
  if (/(refund|cancel|reschedul|money back|return)/.test(t)) return { text: 'Sessions are non-refundable, but you can reschedule — free up to 24 hours before. Damaged or wrong items are always replaced.', quick: ['When is my next session?'] }
  if (/(pay|due|invoice|receipt)/.test(t)) return { text: 'You have nothing due right now. Receipts for your sessions and orders live in Me → Payments.' }
  if (/(price|cost|fee|how much)/.test(t)) return { text: `A first consultation is ${formatINR(100000)} and a follow-up ${formatINR(80000)} — both include your personal remedy blend.` }
  if (/^(hi|hello|hey|namaste|hii+)/.test(t)) return { text: `Hi ${c.name} 🌿 I can help with your ritual, journal, sessions and orders. What’s on your mind?`, quick: ['When should I take my drops?', 'How have I been feeling?', 'Where’s my order?'] }
  return { text: 'I’m still learning — I can help with your drops and ritual, your mood journal, sessions, orders and our products. For anything about your blend, Jitu Bhaiya is the best person.', quick: ['When should I take my drops?', 'How have I been feeling?', 'I’ve been struggling to sleep'] }
}

export const todayKey = () => dayKey(new Date())
