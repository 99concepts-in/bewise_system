/**
 * Unit tests for the consultant prototype's logic: slot engine, demo data integrity, derived views,
 * suggestions, adherence, impact, insights, booking state changes and time formatting.
 */
import { describe, expect, it } from 'vitest'
import { DAY, HOUR, MIN, FLOWERS, makeSeed, startOfDay } from '../data/seed'
import { nextFree, slotsForDay, weekLoad } from '../lib/slots'
import { adherence, impact, insights, nextMilestone, personView, sinceLastRemedy, suggestFlowers, growth } from '../lib/derive'
import { fresh, reducer } from '../state/store'
import { dayLabel, relative } from '../lib/time'
import type { Appt, Person } from '../data/types'

// A fixed Wednesday, 18 Nov 2026, 11:00 local time
const NOW = new Date(2026, 10, 18, 11, 0, 0).getTime()
const TODAY = startOfDay(NOW)
const appt = (o: Partial<Appt>): Appt => ({ id: Math.random().toString(36), personId: 'p', start: NOW, durationMin: 30, kind: 'followup', mode: 'online', status: 'confirmed', ...o })
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
    const s = reducer(s0, { type: 'book', personId: pid, start: TODAY + DAY + 10 * HOUR, kind: 'followup', mode: 'online', id: 'b1', now: NOW, greeting: 'Namaste' })
    const b = s.appts.find((a) => a.id === 'b1')!
    expect(b.status).toBe('awaiting_payment'); expect(b.greeting).toBe('Namaste'); expect(b.durationMin).toBe(30)
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
