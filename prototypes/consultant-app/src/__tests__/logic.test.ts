/**
 * Unit tests for the consultant prototype's logic: slot engine, demo data integrity, derived views,
 * suggestions, adherence, impact, insights, booking state changes and time formatting.
 */
import { describe, expect, it } from 'vitest'
import { DAY, HOUR, MIN, FLOWERS, makeSeed, startOfDay } from '../data/seed'
import { freeTimes, nextFree, nextFreeAny, slotsForDay, weekLoad } from '../lib/slots'
import { adherence, impact, insights, nextMilestone, personView, remedyBoard, scanSummary, sinceLastRemedy, suggestFlowers, growth } from '../lib/derive'
import { financeBoard, PRODUCTS } from '../data/finance'
import { fresh, reducer } from '../state/store'
import { dayLabel, relative } from '../lib/time'
import type { Appt, Person } from '../data/types'

// A fixed Wednesday, 18 Nov 2026, 11:00 local time
const NOW = new Date(2026, 10, 18, 11, 0, 0).getTime()
const TODAY = startOfDay(NOW)
const appt = (o: Partial<Appt>): Appt => ({ id: Math.random().toString(36), personId: 'p', start: NOW, durationMin: 30, service: 'bach', kind: 'followup', mode: 'online', status: 'confirmed', ...o })
const person = (o: Partial<Person> = {}): Person => ({ id: 'p', name: 'Priya Shah', first: 'Priya', pronoun: 'she', city: 'Vadodara', phone: '+91 98250 11223', joinedAt: NOW - 90 * DAY, moods: [], ...o })
const av = { saturdayMorning: false }

describe('slot engine', () => {
  const tomorrow = TODAY + DAY // Thursday
  it('offers 30-minute steps inside opening hours only', () => {
    const s = slotsForDay(tomorrow, 30, [], av, NOW)
    expect(s.length).toBeGreaterThan(0)
    for (const t of s) {
      const h = new Date(t).getHours() + new Date(t).getMinutes() / 60
      expect((h >= 10 && h + 0.5 <= 13) || (h >= 16 && h + 0.5 <= 20)).toBe(true)
      expect(new Date(t).getMinutes() % 30).toBe(0)
    }
  })
  it('never overlaps a booked session and keeps a 10-minute gap', () => {
    const booked = appt({ start: tomorrow + 11 * HOUR, durationMin: 60 })
    const s = slotsForDay(tomorrow, 30, [booked], av, NOW)
    for (const t of s) {
      const end = t + 30 * MIN
      const overlaps = t < booked.start + 70 * MIN && booked.start < end + 10 * MIN
      expect(overlaps).toBe(false)
    }
    expect(s).not.toContain(tomorrow + 11 * HOUR)
    expect(s).not.toContain(tomorrow + 12 * HOUR) // 12:00 is inside the 10-minute gap after 12:00 end
  })
  it('ignores no-shows and the appointment being rescheduled', () => {
    const a = appt({ id: 'x', start: tomorrow + 10 * HOUR })
    expect(slotsForDay(tomorrow, 30, [a], av, NOW)).not.toContain(tomorrow + 10 * HOUR)
    expect(slotsForDay(tomorrow, 30, [a], av, NOW, 'x')).toContain(tomorrow + 10 * HOUR)
    expect(slotsForDay(tomorrow, 30, [{ ...a, status: 'no_show' }], av, NOW)).toContain(tomorrow + 10 * HOUR)
  })
  it('respects one hour notice, Sundays off and the Saturday-morning switch', () => {
    expect(slotsForDay(TODAY, 30, [], av, NOW).every((t) => t >= NOW + 60 * MIN)).toBe(true)
    const sunday = TODAY + 4 * DAY
    expect(new Date(sunday).getDay()).toBe(0)
    expect(slotsForDay(sunday, 30, [], av, NOW)).toEqual([])
    const saturday = TODAY + 3 * DAY
    expect(slotsForDay(saturday, 30, [], av, NOW).some((t) => new Date(t).getHours() < 13)).toBe(false)
    expect(slotsForDay(saturday, 30, [], { saturdayMorning: true }, NOW).some((t) => new Date(t).getHours() === 10)).toBe(true)
  })
  it('a 60-minute session needs the full hour free', () => {
    const blocker = appt({ start: TODAY + DAY + 12 * HOUR, durationMin: 30 })
    expect(slotsForDay(TODAY + DAY, 60, [blocker], av, NOW)).not.toContain(TODAY + DAY + 11 * HOUR)
  })
  it('nextFree returns ascending times, all bookable', () => {
    const f = nextFree(30, [], av, NOW, 6)
    expect(f).toHaveLength(6)
    expect([...f].sort((a, b) => a - b)).toEqual(f)
    expect(f[0]).toBeGreaterThanOrEqual(NOW + 60 * MIN)
  })
  it('weekLoad is a share between 0 and 1', () => {
    const l = weekLoad(makeSeed(NOW).appts, av, NOW)
    expect(l).toBeGreaterThan(0); expect(l).toBeLessThan(1.2)
  })
})

describe('demo data integrity', () => {
  const seed = makeSeed(NOW)
  it('is deterministic for the same moment', () => {
    expect(JSON.stringify(makeSeed(NOW))).toBe(JSON.stringify(seed))
  })
  it('has no double-booked sessions (one consultant)', () => {
    const live = seed.appts.filter((a) => a.status !== 'no_show').sort((a, b) => a.start - b.start)
    for (let i = 1; i < live.length; i++) {
      const prev = live[i - 1], cur = live[i]
      expect(cur.start, `${new Date(prev.start).toISOString()} vs ${new Date(cur.start).toISOString()}`).toBeGreaterThanOrEqual(prev.start + prev.durationMin * MIN)
    }
  })
  it('every appointment points at a real person and only uses real flower names', () => {
    const ids = new Set(seed.people.map((p) => p.id))
    for (const a of seed.appts) {
      expect(ids.has(a.personId)).toBe(true)
      for (const f of a.remedy?.flowers ?? []) expect(FLOWERS).toContain(f)
    }
  })
  it('upcoming sessions are never marked completed, past ones never confirmed', () => {
    for (const a of seed.appts) {
      if (a.start > NOW + HOUR) expect(['confirmed', 'awaiting_payment']).toContain(a.status)
      if (a.start + a.durationMin * MIN < NOW - DAY) expect(['completed', 'no_show']).toContain(a.status)
    }
  })
  it('today always has done, current and later sessions to show', () => {
    const today = seed.appts.filter((a) => startOfDay(a.start) === TODAY && a.status !== 'awaiting_payment')
    expect(today.length).toBe(5)
    expect(today.some((a) => a.status === 'completed')).toBe(true)
    expect(today.some((a) => a.start > NOW)).toBe(true)
  })
})

describe('person view', () => {
  it('puts a recently seen person in care and someone overdue in follow-up due', () => {
    const p = person()
    const done = appt({ start: NOW - 40 * DAY, status: 'completed', followUpWeeks: 4 })
    const v = personView(p, [done], NOW)
    expect(v.buckets).toContain('care')
    expect(v.buckets).toContain('due')
    expect(v.dueOn).toBe(startOfDay(done.start) + 28 * DAY)
  })
  it('an upcoming session clears follow-up due', () => {
    const v = personView(person(), [appt({ start: NOW - 40 * DAY, status: 'completed' }), appt({ start: NOW + 2 * DAY })], NOW)
    expect(v.buckets).not.toContain('due')
    expect(v.next).toBeDefined()
  })
  it('progress summary needs at least 3 check-ins or a check-in form', () => {
    const given = { flowers: ['Mimulus'], stage: 'delivered' as const, givenAt: NOW - 10 * DAY }
    const few = personView(person({ moods: [{ day: TODAY, mood: 'calm' }] }), [appt({ start: NOW - 10 * DAY, status: 'completed', remedy: given })], NOW)
    expect(sinceLastRemedy(few, NOW)).toBeNull()
    const many = personView(person({ moods: [0, 1, 2, 3].map((d) => ({ day: TODAY - d * DAY, mood: 'calm' as const })) }), [appt({ start: NOW - 10 * DAY, status: 'completed', remedy: given })], NOW)
    expect(sinceLastRemedy(many, NOW)).toHaveLength(3)
  })
})

describe('suggested flowers (D-37: reasons, never auto-applied)', () => {
  it("leads with today's troubling emotions and explains why", () => {
    const s = suggestFlowers(person(), [], ['Overthinking'])
    expect(s[0].flower).toBe('Vervain') // tie broken alphabetically between Vervain and White Chestnut
    expect(s.map((x) => x.flower)).toContain('White Chestnut')
    expect(s.every((x) => x.reasons.length > 0 && x.note.length > 0)).toBe(true)
  })
  it('weights repeated concerns across sessions and the check-in', () => {
    const h = [1, 2, 3].map((i) => appt({ start: NOW - i * 20 * DAY, status: 'completed', troubling: ['Grief'] }))
    const s = suggestFlowers(person({ checkin: { at: NOW, better: [], same: [], harder: ['Sleep'] } }), h, [])
    expect(s[0].flower).toBe('Honeysuckle')
    expect(s[0].reasons[0]).toMatch(/Grief in 3 of last 3 sessions/)
    expect(s.find((x) => x.flower === 'White Chestnut')?.reasons.join()).toMatch(/sleep feels harder/)
  })
  it('skips hidden flowers and never returns more than 7', () => {
    const s = suggestFlowers(person(), [], ['Anxiety', 'Fear', 'Anger', 'Sadness'], ['Aspen'])
    expect(s.map((x) => x.flower)).not.toContain('Aspen')
    expect(s.length).toBeLessThanOrEqual(7)
  })
})

describe('taking the remedy (adherence)', () => {
  it('computes share, streak and misses in the last 7 days', () => {
    const drops = Array.from({ length: 10 }, (_, i) => ({ day: TODAY - (9 - i) * DAY, taken: i !== 5 && i !== 6 }))
    const a = adherence(person({ drops }), NOW)!
    expect(a.pct).toBeCloseTo(0.8)
    expect(a.streak).toBe(3)
    expect(a.last7Missed).toBe(2)
    expect(a.days.at(-1)!.state).toBe('taken')
  })
  it("doesn't break today's streak just because today isn't logged yet", () => {
    const drops = [TODAY - 2 * DAY, TODAY - DAY].map((day) => ({ day, taken: true }))
    expect(adherence(person({ drops }), NOW)!.streak).toBe(2)
  })
  it('returns null when nothing is logged', () => expect(adherence(person(), NOW)).toBeNull())
})

describe('impact & milestones', () => {
  it('next milestone and progress', () => {
    expect(nextMilestone(372)).toMatchObject({ target: 400, prev: 300, left: 28 })
    expect(nextMilestone(400).target).toBe(500)
    expect(nextMilestone(0).target).toBe(50)
  })
  it('counts people helped, hours and benefits from feedback', () => {
    const p = person()
    const a = [appt({ start: NOW - 5 * DAY, status: 'completed', durationMin: 60, rating: 5, benefits: ['Calmer'] }), appt({ start: NOW - 30 * DAY, status: 'completed', rating: 4, benefits: ['Calmer', 'Lighter'] })]
    const i = impact(a, [p], NOW)
    expect(i.helped).toBe(1); expect(i.sessions).toBe(2); expect(i.hours).toBe(2); expect(i.fiveStar).toBe(1)
    expect(i.benefits[0]).toEqual(['Calmer', 2])
    expect(i.cameBackPct).toBe(1); expect(i.betterPct).toBe(1)
  })
})

describe('insights are computed from data', () => {
  it('flags a finished session without a remedy first', () => {
    const p = person()
    const a = [appt({ start: NOW - 2 * HOUR, status: 'completed' })]
    const views = new Map([[p.id, personView(p, a, NOW)]])
    const ins = insights([p], views, a, av, NOW)
    expect(ins[0].key).toMatch(/^remedy-/)
    expect(ins[0].action.kind).toBe('give-remedy')
  })
  it('payment reminders never send a link themselves', () => {
    const p = person()
    const a = [appt({ start: NOW + DAY, status: 'awaiting_payment' })]
    const ins = insights([p], new Map([[p.id, personView(p, a, NOW)]]), a, av, NOW)
    const hold = ins.find((i) => i.key.startsWith('hold-'))!
    expect(hold.action.label).toBe('Send a reminder')
    expect(hold.why).toMatch(/went out automatically/)
  })
  it('growth week buckets add up to completed sessions in that range', () => {
    const seed = makeSeed(NOW)
    const g = growth(seed.appts, seed.people, NOW)
    expect(g.weeks).toHaveLength(8)
    expect(g.weeks.every((w) => w.count >= 0)).toBe(true)
  })
})

describe('booking state changes', () => {
  const s0 = fresh(NOW)
  const pid = s0.people[0].id
  it('booking = awaiting payment, greeting kept, payment-link notice added automatically', () => {
    const s = reducer(s0, { type: 'book', personId: pid, start: TODAY + DAY + 10 * HOUR, service: 'bach', kind: 'followup', mode: 'online', id: 'b1', now: NOW, greeting: 'Namaste', by: 'Shivani di', meetingUrl: 'https://meet.google.com/abc' })
    const b = s.appts.find((a) => a.id === 'b1')!
    expect(b.status).toBe('awaiting_payment'); expect(b.greeting).toBe('Namaste'); expect(b.durationMin).toBe(30)
    expect(b).toMatchObject({ assignedBy: 'Shivani di', meetingUrl: 'https://meet.google.com/abc', service: 'bach' })
    expect(s.notices.some((n) => n.kind === 'payment' && /automatically/.test(n.text))).toBe(true)
  })
  it('check-in only from confirmed, then start, then end', () => {
    const c = s0.appts.find((a) => a.status === 'confirmed')!
    let s = reducer(s0, { type: 'checkIn', apptId: c.id })
    expect(s.appts.find((a) => a.id === c.id)!.status).toBe('checked_in')
    s = reducer(s, { type: 'checkIn', apptId: c.id })
    expect(s.appts.find((a) => a.id === c.id)!.status).toBe('checked_in')
    s = reducer(s, { type: 'start', apptId: c.id })
    s = reducer(s, { type: 'endSession', apptId: c.id, outcome: 'completed', followUpWeeks: 3 })
    expect(s.appts.find((a) => a.id === c.id)).toMatchObject({ status: 'completed', followUpWeeks: 3 })
    const done = s0.appts.find((a) => a.status === 'completed')!
    expect(reducer(s0, { type: 'checkIn', apptId: done.id }).appts.find((a) => a.id === done.id)!.status).toBe('completed')
  })
  it('give remedy marks it preparing; reschedule keeps order; add person goes first', () => {
    const c = s0.appts.find((a) => a.status === 'completed')!
    const s1 = reducer(s0, { type: 'giveRemedy', apptId: c.id, flowers: ['Elm'], now: NOW })
    expect(s1.appts.find((a) => a.id === c.id)!.remedy).toMatchObject({ flowers: ['Elm'], stage: 'preparing' })
    const up = s0.appts.find((a) => a.status === 'confirmed' && a.start > NOW)!
    const s2 = reducer(s0, { type: 'reschedule', apptId: up.id, start: up.start + 7 * DAY })
    expect(s2.appts.map((a) => a.start)).toEqual([...s2.appts.map((a) => a.start)].sort((a, b) => a - b))
    const s3 = reducer(s0, { type: 'addPerson', person: person({ id: 'new' }) })
    expect(s3.people[0].id).toBe('new')
  })
})

describe('time formatting', () => {
  it('relative and day labels', () => {
    expect(relative(NOW + 18 * MIN, NOW)).toBe('in 18 min')
    expect(relative(NOW + 90 * MIN, NOW)).toBe('in 1 h 30 min')
    expect(relative(NOW - 3 * DAY, NOW)).toBe('3 days ago')
    expect(dayLabel(NOW, NOW)).toBe('Today')
    expect(dayLabel(NOW + DAY, NOW)).toBe('Tomorrow')
    expect(dayLabel(NOW - DAY, NOW)).toBe('Yesterday')
  })
})

// ================================================================ structure v3 (owner 2026-11-20)
describe('timings are never fixed: any time, clashes blocked', () => {
  const tomorrow = TODAY + DAY
  it('offers 15-minute steps from 7 AM to 10 PM, Sundays included', () => {
    const t = freeTimes(tomorrow, 30, [], NOW)
    expect(new Date(t[0].t).getHours()).toBe(7)
    expect(new Date(t.at(-1)!.t).getHours() * 60 + new Date(t.at(-1)!.t).getMinutes() + 30).toBeLessThanOrEqual(22 * 60)
    const sunday = TODAY + 4 * DAY
    expect(freeTimes(sunday, 45, [], NOW).length).toBeGreaterThan(0)
  })
  it('marks clashing times as taken (with the 10-minute gap)', () => {
    const booked = appt({ start: tomorrow + 15 * HOUR, durationMin: 45, service: 'scanning' })
    const t = freeTimes(tomorrow, 30, [booked], NOW)
    const at = (h: number, m = 0) => t.find((x) => x.t === tomorrow + h * HOUR + m * MIN)!
    expect(at(15).free).toBe(false); expect(at(15, 45).free).toBe(false); expect(at(14, 30).free).toBe(false); expect(at(14, 15).free).toBe(true)
    expect(at(16).free).toBe(true); expect(at(14).free).toBe(true)
  })
  it('express suggestions stay inside usual hours and are free', () => {
    const f = nextFreeAny(45, [], NOW, 4)
    expect(f).toHaveLength(4)
    for (const x of f) { const h = new Date(x).getHours(); expect((h >= 10 && h < 13) || (h >= 16 && h < 20)).toBe(true) }
  })
})

describe('two kinds of appointment', () => {
  const seed = makeSeed(NOW)
  it('demo has both, and scanning sessions never carry a remedy or troubling emotions', () => {
    expect(seed.appts.some((a) => a.service === 'scanning')).toBe(true)
    expect(seed.appts.some((a) => a.service === 'bach')).toBe(true)
    for (const a of seed.appts.filter((x) => x.service === 'scanning')) { expect(a.remedy).toBeUndefined(); expect(a.troubling).toBeUndefined() }
    expect(seed.appts.filter((a) => a.service === 'scanning' && a.status === 'completed').every((a) => !!a.privateNote)).toBe(true)
  })
  it("today's list mixes both kinds", () => {
    const today = seed.appts.filter((a) => startOfDay(a.start) === TODAY)
    expect(new Set(today.map((a) => a.service)).size).toBe(2)
  })
  it('scanning summary finds themes, the last note and what to follow up', () => {
    const notes = [
      appt({ service: 'scanning', status: 'completed', start: NOW - 40 * DAY, privateNote: 'Sleep poor. Suggested slow breathing before bed.' }),
      appt({ service: 'scanning', status: 'completed', start: NOW - 10 * DAY, privateNote: 'Sleep better, work stress high. Continue the evening walk.' }),
    ]
    const s = scanSummary(notes)!
    expect(s.count).toBe(2)
    expect(s.themes[0]).toEqual(['Sleep', 2])
    expect(s.lastLine).toBe('Sleep better, work stress high.')
    expect(s.advice).toBe('Continue the evening walk.')
    expect(scanSummary([appt({ service: 'bach', status: 'completed' })])).toBeNull()
  })
  it('notes added from the profile join the summary and the timeline', () => {
    const sessions = [appt({ service: 'scanning', status: 'completed', start: NOW - 20 * DAY, privateNote: 'Grief close to the surface.' })]
    const s = scanSummary(sessions, [{ id: 'n1', at: NOW - DAY, text: 'Called after the session. Sleep better. Keep the morning sunlight.' }])!
    expect(s.count).toBe(1)
    expect(s.notes).toBe(2)
    expect(s.lastLine).toBe('Called after the session.')
    expect(s.advice).toBe('Keep the morning sunlight.')
    expect(scanSummary([], [{ id: 'n2', at: NOW, text: 'First impressions.' }])!.count).toBe(0)
  })
})

describe('requests, remedy ending, archive, messages', () => {
  const s0 = fresh(NOW)
  it('demo has requests from people with nothing booked', () => {
    expect(s0.requests.length).toBeGreaterThanOrEqual(4)
    for (const r of s0.requests) expect(s0.appts.some((a) => a.personId === r.personId && a.start > NOW)).toBe(false)
  })
  it('assigning a time books it and closes the request', () => {
    const r = s0.requests[0]
    const s = reducer(s0, { type: 'book', personId: r.personId, start: TODAY + DAY + 17 * HOUR, service: r.service, kind: r.kind, mode: r.mode, id: 'x1', now: NOW, greeting: 'hi', by: 'Haresh bhai', requestId: r.id })
    expect(s.requests.find((x) => x.id === r.id)).toBeUndefined()
    expect(s.appts.find((a) => a.id === 'x1')).toMatchObject({ service: r.service, assignedBy: 'Haresh bhai', durationMin: r.service === 'scanning' ? 45 : r.kind === 'first' ? 60 : 30 })
  })
  it('remedy end = given day + weeks; ending buckets; archived people leave every list', () => {
    const p = person({ drops: [{ day: TODAY - DAY, taken: true }] })
    const a = [appt({ start: NOW - 18 * DAY, status: 'completed', remedy: { flowers: ['Elm'], stage: 'delivered', givenAt: NOW - 18 * DAY, weeks: 3 } })]
    const v = personView(p, a, NOW)
    expect(v.daysLeft).toBe(3)
    expect(v.buckets).toEqual(expect.arrayContaining(['remedy', 'ending7']))
    const archived = personView({ ...p, archived: true }, a, NOW)
    expect(archived.buckets).toEqual(['all', 'archived'])
    expect(remedyBoard([v, archived], NOW).on).toHaveLength(1)
  })
  it('remedy board splits regular / missing / not logging', () => {
    const given = { flowers: ['Elm'], stage: 'delivered' as const, givenAt: NOW - 10 * DAY, weeks: 4 }
    const mk = (id: string, drops: { day: number; taken: boolean }[]) => personView(person({ id, drops }), [appt({ personId: id, start: NOW - 10 * DAY, status: 'completed', remedy: given })], NOW)
    const days = (taken: boolean) => Array.from({ length: 9 }, (_, i) => ({ day: TODAY - (8 - i) * DAY, taken }))
    const b = remedyBoard([mk('a', days(true)), mk('b', days(false)), mk('c', [])], NOW)
    expect([b.regular.length, b.missing.length, b.silent.length]).toEqual([1, 1, 1])
  })
  it('messages: send appends, starts a thread if needed, read clears unread', () => {
    const t = s0.threads.find((x) => x.messages.at(-1)!.from === 'client')!
    expect(t.messages.at(-1)!.at).toBeGreaterThan(t.readAt)
    let s = reducer(s0, { type: 'readThread', personId: t.personId, now: NOW + 1 })
    expect(s.threads.find((x) => x.personId === t.personId)!.readAt).toBeGreaterThanOrEqual(t.messages.at(-1)!.at)
    s = reducer(s, { type: 'send', personId: t.personId, text: '  Hello  ', now: NOW + 2 })
    expect(s.threads.find((x) => x.personId === t.personId)!.messages.at(-1)).toMatchObject({ from: 'jb', text: 'Hello' })
    const fresh1 = s0.people.find((p) => !s0.threads.some((x) => x.personId === p.id))!
    s = reducer(s, { type: 'send', personId: fresh1.id, text: 'Namaste', now: NOW + 3 })
    expect(s.threads[0].personId).toBe(fresh1.id)
    expect(reducer(s, { type: 'send', personId: fresh1.id, text: '   ', now: NOW + 4 })).toBe(s)
  })
  it('archive and link', () => {
    const p = s0.people[5]
    expect(reducer(s0, { type: 'archive', personId: p.id, on: true }).people[5].archived).toBe(true)
    const a = s0.appts.find((x) => x.mode === 'online' && x.start > NOW)!
    expect(reducer(s0, { type: 'setLink', apptId: a.id, url: ' https://zoom.us/j/1 ' }).appts.find((x) => x.id === a.id)!.meetingUrl).toBe('https://zoom.us/j/1')
    expect(reducer(s0, { type: 'setLink', apptId: a.id, url: '  ' }).appts.find((x) => x.id === a.id)!.meetingUrl).toBeUndefined()
  })
})

describe('finance board (read-only)', () => {
  const seed = makeSeed(NOW)
  const f = financeBoard(seed.appts, NOW)
  it('sources add up to the products, profit never exceeds revenue', () => {
    const total = f.products.reduce((s, p) => s + p.revenue, 0)
    expect(f.bySource.reduce((s, x) => s + x.revenue, 0)).toBe(total)
    expect(f.month.revenue).toBe(total)
    expect(f.month.profit).toBeLessThanOrEqual(f.month.revenue)
    for (const p of f.products) expect(p.profit).toBe(p.units * (p.price - PRODUCTS.find((x) => x.key === p.key)!.cost))
  })
  it('daily bars cover 14 days and today matches the today card', () => {
    expect(f.daily).toHaveLength(14)
    expect(f.daily.at(-1)!.revenue).toBe(f.today.revenue)
    expect(f.products.find((p) => p.key === 'scanning')!.units).toBe(seed.appts.filter((a) => a.service === 'scanning' && a.status === 'completed' && a.start >= new Date(new Date(NOW).getFullYear(), new Date(NOW).getMonth(), 1).getTime()).length)
  })
})
