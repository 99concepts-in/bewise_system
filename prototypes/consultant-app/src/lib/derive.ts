/**
 * Derived views: per-person summary, people filters, weekly stats and the "Needs you" insights.
 * Everything is computed from data — no hard-coded insight text.
 */
import { pron, type Appt, type Mood, type Person } from '../data/types'
import { CONCERN_FLOWERS, DAY, FLOWER_NOTE, HOUR, MIN, startOfDay } from '../data/seed'
import { weekLoad, type Availability } from './slots'
import { fmtTime, relative } from './time'

export type Bucket = 'all' | 'care' | 'due' | 'new' | 'quiet' | 'missing'

export interface PersonView {
  p: Person
  sessions: Appt[]
  past: Appt[]
  last?: Appt
  next?: Appt
  blend?: Appt
  dueOn?: number
  buckets: Bucket[]
  latestMood?: Mood
  avgRating?: number
}

export function personView(p: Person, list: Appt[] = [], now: number): PersonView {
  const past = list.filter((a) => a.start + a.durationMin * MIN <= now || a.status === 'completed' || a.status === 'no_show').filter((a) => a.status !== 'confirmed' && a.status !== 'awaiting_payment')
  const done = past.filter((a) => a.status === 'completed')
  const last = done.at(-1)
  const next = list.find((a) => a.start > now - 30 * MIN && (a.status === 'confirmed' || a.status === 'awaiting_payment' || a.status === 'checked_in' || a.status === 'in_session'))
  const blend = [...done].reverse().find((a) => a.remedy)
  const dueOn = last && !next ? startOfDay(last.start) + (last.followUpWeeks ?? 4) * 7 * DAY : undefined
  const buckets: Bucket[] = ['all']
  const sinceLast = last ? now - last.start : Infinity
  if (next || sinceLast < 60 * DAY) buckets.push('care')
  if (dueOn && dueOn <= now && sinceLast < 120 * DAY) buckets.push('due')
  if (now - p.joinedAt < 30 * DAY) buckets.push('new')
  if (!next && sinceLast >= 120 * DAY) buckets.push('quiet')
  const ad = adherence(p, now)
  if (ad && ad.last7Missed >= 3) buckets.push('missing')
  const rated = done.filter((a) => a.rating)
  return {
    p, sessions: list, past, last, next, blend, dueOn, buckets,
    latestMood: p.moods.at(-1)?.mood,
    avgRating: rated.length ? rated.reduce((s, a) => s + (a.rating ?? 0), 0) / rated.length : undefined,
  }
}

/** Plain-language 3-line "since last remedy" note (stands in for the AI summary — see K6 spec). */
export function sinceLastRemedy(v: PersonView, now: number): string[] | null {
  const since = v.blend?.remedy?.givenAt
  if (!since) return null
  const moods = v.p.moods.filter((m) => m.day >= startOfDay(since))
  if (moods.length < 3 && !v.p.checkin) return null
  const count = (ms: Mood[]) => moods.filter((m) => ms.includes(m.mood)).length
  const good = count(['calm', 'joyful', 'grateful', 'hopeful'])
  const hard = count(['anxious', 'sad', 'irritated', 'tired'])
  const half = Math.floor(moods.length / 2)
  const g1 = moods.slice(0, half).filter((m) => ['calm', 'joyful', 'grateful', 'hopeful'].includes(m.mood)).length
  const g2 = moods.slice(half).filter((m) => ['calm', 'joyful', 'grateful', 'hopeful'].includes(m.mood)).length
  const days = Math.max(1, Math.round((now - since) / DAY))
  const lines = [
    `Logged ${moods.length} feelings in ${days} days: ${good} settled, ${hard} heavy.`,
    g2 > g1 ? 'Settled days are rising in the second half of the period.' : g2 < g1 ? 'Fewer settled days lately than at the start.' : 'Mood has been steady across the period.',
  ]
  const ck = v.p.checkin
  lines.push(ck ? `Check-in ${relative(ck.at, now)}: ${ck.better.length ? `${ck.better.join(', ')} better` : 'nothing better yet'}${ck.harder.length ? `, ${ck.harder.join(', ').toLowerCase()} harder` : ''}.` : 'No check-in yet before the next session.')
  return lines
}

// ---------------------------------------------------------------- insights
export type InsightTone = 'rose' | 'mist' | 'sage' | 'gold'
export interface Insight {
  key: string
  tone: InsightTone
  title: string
  why: string
  action: { label: string; kind: 'give-remedy' | 'people' | 'person' | 'saturday' | 'whatsapp' | 'session'; target?: string; bucket?: Bucket }
}

export function insights(people: Person[], views: Map<string, PersonView>, appts: Appt[], av: Availability, now: number): Insight[] {
  const out: Insight[] = []
  const name = (id: string) => people.find((p) => p.id === id)?.first ?? 'Client'

  // 1. finished sessions with no remedy yet
  const pending = appts.filter((a) => a.status === 'completed' && !a.remedy && now - a.start < 2 * DAY)
  for (const a of pending) out.push({
    key: `remedy-${a.id}`, tone: 'rose', title: `Give ${name(a.personId)}'s remedy`,
    why: `Session ended ${relative(a.start + a.durationMin * MIN, now)}. The office can't start preparing until you give it.`,
    action: { label: 'Give remedy', kind: 'give-remedy', target: a.id },
  })

  // 2. awaiting payment holds
  const holds = appts.filter((a) => a.status === 'awaiting_payment' && a.start > now)
  if (holds.length) {
    const h = holds[0]
    const p = people.find((x) => x.id === h.personId)!
    out.push({
      key: `hold-${h.id}`, tone: 'gold', title: `${p.first} hasn't paid yet`,
      why: `The payment link went out automatically after ${holds.length > 1 ? `${holds.length} bookings` : 'the booking'}. A warm reminder from you usually helps.`,
      action: { label: 'Send a reminder', kind: 'whatsapp', target: p.id },
    })
  }

  // 3. check-in says something feels harder
  const harder = people.find((p) => p.checkin?.harder.length && now - p.checkin.at < 7 * DAY)
  if (harder) {
    const v = views.get(harder.id)
    out.push({
      key: `checkin-${harder.id}`, tone: 'mist', title: `${harder.first} says ${harder.checkin!.harder.join(', ').toLowerCase()} feels harder`,
      why: v?.next ? `Worth reading before ${pron(harder).poss} session ${relative(v.next.start, now)} at ${fmtTime(v.next.start)}.` : 'From the check-in. No session booked yet.',
      action: { label: 'Open profile', kind: 'person', target: harder.id },
    })
  }

  // 3b. people missing their drops this week
  const missing = [...views.values()].filter((v) => v.buckets.includes('missing'))
  if (missing.length) out.push({
    key: `missing-${missing.length}`, tone: 'gold', title: `${missing.length} ${missing.length === 1 ? 'person has' : 'people have'} missed drops this week`,
    why: `${missing.slice(0, 3).map((v) => v.p.first).join(', ')}${missing.length > 3 ? ' and others' : ''} skipped 3 or more days. A gentle nudge keeps the blend working as you intended.`,
    action: { label: 'See who', kind: 'people', bucket: 'missing' },
  })

  // 4. follow-ups due
  const due = [...views.values()].filter((v) => v.buckets.includes('due'))
  if (due.length) out.push({
    key: `due-${due.length}`, tone: 'sage', title: `${due.length} ${due.length === 1 ? 'person is' : 'people are'} past their follow-up`,
    why: `${due.slice(0, 3).map((v) => v.p.first).join(', ')}${due.length > 3 ? ' and others' : ''} haven't booked since their last remedy ran out.`,
    action: { label: 'See who', kind: 'people', bucket: 'due' },
  })

  // 5. capacity
  const load = weekLoad(appts, av, now)
  if (load > 0.55 && !av.saturdayMorning) out.push({
    key: 'capacity', tone: 'mist', title: `Next week is ${Math.round(load * 100)}% booked`,
    why: 'Follow-ups are landing further out. Opening Saturday 10 AM–1 PM adds 5 slots.',
    action: { label: 'Open Saturday morning', kind: 'saturday' },
  })

  // 6. quiet people
  const quiet = [...views.values()].filter((v) => v.buckets.includes('quiet'))
  if (quiet.length > 4) out.push({
    key: `quiet-${quiet.length}`, tone: 'sage', title: `${quiet.length} people haven't visited in 4+ months`,
    why: 'A short "thinking of you" message keeps the door open without pushing.',
    action: { label: 'See who', kind: 'people', bucket: 'quiet' },
  })
  return out
}

// ---------------------------------------------------------------- growth stats
export function weekStart(t: number) { const d = new Date(startOfDay(t)); const dow = (d.getDay() + 6) % 7; return d.getTime() - dow * DAY }

export function growth(appts: Appt[], people: Person[], now: number) {
  const done = appts.filter((a) => a.status === 'completed')
  const ws = weekStart(now)
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const s = ws - (7 - i) * 7 * DAY
    const e = s + 7 * DAY
    return { start: s, count: done.filter((a) => a.start >= s && a.start < e).length }
  })
  const thisWeek = appts.filter((a) => a.start >= ws && a.start < ws + 7 * DAY && a.status === 'completed').length
  const bookedRest = appts.filter((a) => a.start >= now && a.start < ws + 7 * DAY && (a.status === 'confirmed' || a.status === 'checked_in' || a.status === 'in_session')).length
  const m0 = new Date(now); m0.setDate(1); m0.setHours(0, 0, 0, 0)
  const monthStart = m0.getTime()
  const lm = new Date(monthStart); lm.setMonth(lm.getMonth() - 1)
  const lastMonthSame = lm.getTime() + (now - monthStart)
  const inRange = (a: Appt, s: number, e: number) => a.start >= s && a.start < e
  const month = done.filter((a) => inRange(a, monthStart, now))
  const lastMonth = done.filter((a) => inRange(a, lm.getTime(), lastMonthSame))
  const monthPeople = new Set(month.map((a) => a.personId))
  const returning = month.filter((a) => a.kind === 'followup').length
  const rated = month.filter((a) => a.rating)
  const avg = rated.length ? rated.reduce((s, a) => s + a.rating!, 0) / rated.length : 0
  const remedies = month.filter((a) => a.remedy).length
  const newPeople = people.filter((p) => p.joinedAt >= monthStart).length

  // busy grid: weekday (Mon..Sat) × hour, last 8 weeks
  const hours = [10, 11, 12, 16, 17, 18, 19]
  const grid = Array.from({ length: 6 }, () => hours.map(() => 0))
  for (const a of appts) {
    if (a.start < ws - 8 * 7 * DAY || a.status === 'no_show') continue
    const d = new Date(a.start); const dow = (d.getDay() + 6) % 7; const hi = hours.indexOf(d.getHours())
    if (dow < 6 && hi >= 0) grid[dow][hi]++
  }
  // top troubling emotions this month vs last
  const tally = (xs: Appt[]) => { const m = new Map<string, number>(); for (const a of xs) for (const t of a.troubling ?? []) m.set(t, (m.get(t) ?? 0) + 1); return m }
  const tm = tally(done.filter((a) => a.start >= now - 30 * DAY))
  const top = [...tm.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  const total = done.length
  const ratings5 = done.filter((a) => a.rating === 5)
  return { weeks, thisWeek, bookedRest, month: month.length, lastMonth: lastMonth.length, monthPeople: monthPeople.size, returning, avg, remedies, newPeople, grid, hours, top, total, kind: ratings5 }
}

// ---------------------------------------------------------------- impact (motivation)
export function nextMilestone(n: number, steps = [50, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 2500, 5000, 10000]) {
  const target = steps.find((s) => s > n) ?? Math.ceil((n + 1) / 1000) * 1000
  const prev = [...steps].reverse().find((s) => s <= n) ?? 0
  return { target, prev, left: target - n, pct: (n - prev) / (target - prev) }
}

export function impact(appts: Appt[], people: Person[], now: number) {
  const done = appts.filter((a) => a.status === 'completed')
  const helped = new Set(done.map((a) => a.personId))
  const personOf = new Map(people.map((p) => [p.id, p]))
  const minutes = done.reduce((s, a) => s + a.durationMin, 0)
  const rated = done.filter((a) => a.rating)
  const fiveStar = rated.filter((a) => a.rating === 5).length
  const perPerson = new Map<string, number>()
  for (const a of done) perPerson.set(a.personId, (perPerson.get(a.personId) ?? 0) + 1)
  const cameBack = [...perPerson.values()].filter((n) => n >= 2).length
  const cities = new Set([...helped].map((id) => personOf.get(id)?.city))
  // "said something feels better": a benefit in feedback, or "better" in a check-in
  const spoke = new Set<string>(), better = new Set<string>()
  for (const a of rated) { spoke.add(a.personId); if (a.benefits?.length) better.add(a.personId) }
  for (const p of people) if (p.checkin) { spoke.add(p.id); if (p.checkin.better.length) better.add(p.id) }
  const benefitCounts = new Map<string, number>()
  for (const a of done) for (const b of a.benefits ?? []) benefitCounts.set(b, (benefitCounts.get(b) ?? 0) + 1)
  const benefits = [...benefitCounts.entries()].sort((a, b) => b[1] - a[1])
  const benefitMonth = done.filter((a) => a.start >= now - 30 * DAY).reduce((s, a) => s + (a.benefits?.length ? 1 : 0), 0)
  return {
    sessions: done.length, helped: helped.size, hours: Math.round(minutes / 60), fiveStar, rated: rated.length,
    cameBackPct: helped.size ? cameBack / helped.size : 0, cities: cities.size,
    betterPct: spoke.size ? better.size / spoke.size : 0, betterPeople: better.size,
    benefits, benefitMonth,
    sessionMilestone: nextMilestone(done.length), peopleMilestone: nextMilestone(helped.size),
  }
}

export const WEEK_GOAL = 25
export const LIFETIME_REACH = 200000
export const HOURS_PER_SESSION = HOUR

// ---------------------------------------------------------------- suggested flowers (D-37: for Jitu Bhaiya only, his judgement decides)
export interface Suggestion { flower: string; note: string; reasons: string[]; score: number }
const CHECKIN_FLOWERS: Record<string, string[]> = { Sleep: ['White Chestnut', 'Olive'] }

/**
 * Deterministic, explainable: every suggestion lists why. Never auto-applied — he taps to add.
 * Inputs: today's troubling emotions, the last 3 sessions, the latest check-in, and what the last blend helped with.
 */
export function suggestFlowers(person: Person, history: Appt[] = [], today: string[] = [], hidden: string[] = []): Suggestion[] {
  const map = new Map<string, Suggestion>()
  const add = (f: string, why: string, w: number) => {
    if (hidden.includes(f)) return
    const s = map.get(f) ?? { flower: f, note: FLOWER_NOTE[f] ?? '', reasons: [], score: 0 }
    if (!s.reasons.includes(why)) s.reasons.push(why)
    s.score += w
    map.set(f, s)
  }
  for (const c of today) for (const f of CONCERN_FLOWERS[c] ?? []) add(f, `${c} today`, 3)
  const done = history.filter((a) => a.status === 'completed' && a.troubling)
  const recent = done.slice(-3)
  const counts = new Map<string, number>()
  for (const a of recent) for (const c of a.troubling!) counts.set(c, (counts.get(c) ?? 0) + 1)
  for (const [c, n] of counts) for (const f of CONCERN_FLOWERS[c] ?? []) add(f, n > 1 ? `${c} in ${n} of last ${recent.length} sessions` : `${c} last time`, n)
  const ck = person.checkin
  if (ck) {
    for (const h of ck.harder) for (const f of CHECKIN_FLOWERS[h] ?? CONCERN_FLOWERS[h] ?? []) add(f, `Check-in: ${h.toLowerCase()} feels harder`, 2)
    for (const h of ck.same) for (const f of CONCERN_FLOWERS[h] ?? []) add(f, `Check-in: ${h.toLowerCase()} the same`, 1)
  }
  const lastBlend = [...done].reverse().find((a) => a.remedy)
  const helped = [...history].reverse().find((a) => a.benefits?.length)
  if (lastBlend?.remedy && helped) for (const f of lastBlend.remedy.flowers) if (map.has(f)) add(f, `In the last blend, after which ${person.first} felt ${helped.benefits![0].toLowerCase()}`, 1)
  return [...map.values()].sort((a, b) => b.score - a.score || a.flower.localeCompare(b.flower)).slice(0, 7)
}

// ---------------------------------------------------------------- taking the remedy (adherence)
export interface Adherence { days: { day: number; state: 'taken' | 'missed' | 'none' }[]; pct: number; streak: number; last7Missed: number; since: number; logged: number }
export function adherence(p: Person, now: number, span = 14): Adherence | null {
  if (!p.drops) return null
  const today = startOfDay(now)
  const byDay = new Map(p.drops.map((d) => [d.day, d.taken]))
  const since = p.drops[0]?.day ?? today
  const days = Array.from({ length: span }, (_, i) => today - (span - 1 - i) * DAY)
    .filter((d) => d >= since)
    .map((d) => ({ day: d, state: (byDay.has(d) ? (byDay.get(d) ? 'taken' : 'missed') : 'none') as 'taken' | 'missed' | 'none' }))
  const total = Math.max(1, Math.round((today - since) / DAY) + 1)
  const taken = p.drops.filter((d) => d.taken).length
  let streak = 0
  for (let d = today; d >= since; d -= DAY) { if (byDay.get(d)) streak++; else if (d === today && !byDay.has(d)) continue; else break }
  const last7Missed = Array.from({ length: 7 }, (_, i) => today - i * DAY).filter((d) => d >= since && byDay.get(d) !== true).length
  return { days, pct: taken / total, streak, last7Missed, since, logged: p.drops.length }
}
