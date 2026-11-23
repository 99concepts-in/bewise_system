import { describe, expect, it } from 'vitest'
import { DAY, makeSeed } from '../data/seed'
import { personView } from '../lib/derive'
import { NOT_SAID, blendJourney, journeySteps, journeyTag, recency, wellnessSummary } from '../lib/journey'
import type { Appt, Person } from '../data/types'

const NOW = new Date(2026, 10, 23, 11, 0, 0).getTime()
const person = (over: Partial<Person> = {}): Person => ({ id: 'x', name: 'Asha Shah', first: 'Asha', pronoun: 'she', city: 'Vadodara', phone: '+91 98765 43210', joinedAt: NOW - 400 * DAY, moods: [], ...over })
let n = 0
const done = (daysAgo: number, over: Partial<Appt> = {}): Appt => ({ id: `a${n++}`, personId: 'x', start: NOW - daysAgo * DAY, durationMin: 30, service: 'bach', kind: 'followup', mode: 'in_person', status: 'completed', ...over })

describe('last visit colour', () => {
  it('green within about a month, amber 2–3 months, soft red beyond', () => {
    expect(recency(NOW - 10 * DAY, NOW)!.tone).toBe('recent')
    expect(recency(NOW - 35 * DAY, NOW)!.tone).toBe('recent')
    expect(recency(NOW - 36 * DAY, NOW)!.tone).toBe('while')
    expect(recency(NOW - 90 * DAY, NOW)!.tone).toBe('while')
    expect(recency(NOW - 91 * DAY, NOW)!.tone).toBe('long')
    expect(recency(NOW - 41 * DAY, NOW)!.label).toBe('41 days ago')
    expect(recency(undefined, NOW)).toBeNull()
  })
})

describe('journey tag', () => {
  it('Regular: 3+ sessions in 6 months and seen within 2 months', () => {
    const v = personView(person(), [done(120), done(80), done(40), done(10)], NOW)
    expect(journeyTag(v, NOW)!.tag).toBe('Regular')
    expect(journeyTag(v, NOW)!.why).toMatch(/4 sessions in 6 months, about every \d+ weeks/)
  })
  it('Drifting: nothing for over 3 months', () => {
    const v = personView(person(), [done(300), done(200), done(120, { followUpWeeks: 4 })], NOW)
    expect(journeyTag(v, NOW)!.tag).toBe('Drifting')
  })
  it('Occasional: the rest', () => {
    const v = personView(person(), [done(150), done(20, { followUpWeeks: 8 })], NOW)
    expect(journeyTag(v, NOW)!.tag).toBe('Occasional')
  })
  it('no tag before the first session', () => {
    expect(journeyTag(personView(person(), [], NOW), NOW)).toBeNull()
  })
})

describe('wellness summary', () => {
  it('flags a blend routine that is not followed, lists feelings, last blend and a focus', () => {
    const today = new Date(NOW); today.setHours(0, 0, 0, 0)
    const t = today.getTime()
    const drops = Array.from({ length: 10 }, (_, i) => ({ day: t - (9 - i) * DAY, taken: i % 2 === 0 }))
    const v = personView(person({ drops }), [
      done(60, { troubling: ['Loneliness', 'Anxiety'] }),
      done(10, { troubling: ['Loneliness', 'Exhaustion'], remedy: { flowers: ['Water Violet', 'Heather', 'Olive'], stage: 'delivered', givenAt: NOW - 10 * DAY, weeks: 3 } }),
    ], NOW)
    const s = wellnessSummary(v, NOW)
    expect(s.flag).toMatch(/Drops missed on \d of the last 7 days/)
    expect(s.emotions).toEqual(['loneliness', 'worry', 'tiredness'])
    expect(s.blendLine).toBe('Water Violet, Heather, Olive, given 13 Nov (10 days ago).')
    expect(s.focus.length).toBeGreaterThanOrEqual(1)
    expect(s.focus.length).toBeLessThanOrEqual(2)
    expect(s.focus[0]).toMatch(/Loneliness came up in 2 of the last 2 sessions/)
  })
  it('never uses diagnostic words, for anyone in the demo data', () => {
    const seed = makeSeed(NOW)
    for (const p of seed.people) {
      const v = personView(p, seed.appts.filter((a) => a.personId === p.id).sort((a, b) => a.start - b.start), NOW)
      const s = wellnessSummary(v, NOW)
      const text = [s.flag, s.emotionLine, s.blendLine, ...s.focus, ...s.emotions].filter(Boolean).join(' ')
      expect(text, p.name).not.toMatch(NOT_SAID)
      expect(s.focus.length).toBeGreaterThanOrEqual(1)
      expect(s.focus.length).toBeLessThanOrEqual(2)
    }
  })
})

describe('journey timeline and blend journey', () => {
  it('timeline has gaps between sessions; blends show added and left-out flowers', () => {
    const r = (flowers: string[], d: number) => ({ flowers, stage: 'delivered' as const, givenAt: NOW - d * DAY })
    const v = personView(person(), [done(70, { remedy: r(['Mimulus', 'Larch'], 70) }), done(28, { remedy: r(['Mimulus', 'Walnut'], 28) })], NOW)
    expect(journeySteps(v)[1].gapWeeks).toBe(6)
    const bj = blendJourney(v)
    expect(bj[1].added).toEqual(['Walnut'])
    expect(bj[1].dropped).toEqual(['Larch'])
    expect(bj[1].kept).toEqual(['Mimulus'])
  })
})
