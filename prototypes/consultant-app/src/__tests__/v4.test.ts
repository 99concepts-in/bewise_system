import { describe, expect, it } from 'vitest'
import { DAY, makeSeed } from '../data/seed'
import { personView } from '../lib/derive'
import { generalReading, personalYear } from '../lib/loshu'
import { NOT_SAID } from '../lib/journey'
import { tabSummary, moodStats, type PersonTab } from '../lib/summaries'
import { audiences, fill, readyPosts, NUDGE_TEXT } from '../lib/marketing'
import { fresh, reducer } from '../state/store'
import type { Appt } from '../data/types'

const NOW = new Date(2026, 10, 25, 11, 0, 0).getTime()
const byPersonOf = (appts: Appt[]) => { const m = new Map<string, Appt[]>(); for (const a of appts) m.set(a.personId, [...(m.get(a.personId) ?? []), a]); for (const l of m.values()) l.sort((a, b) => a.start - b.start); return m }

describe('Lo Shu general reading', () => {
  it('personal year = day + month + this year, reduced', () => {
    // 15 Aug, 2026: 1+5 + 8 + 2+0+2+6 = 24 → 6
    expect(personalYear('1987-08-15', NOW)).toBe(6)
    const g = generalReading('1987-08-15', NOW)!
    expect(g.year).toBe(6)
    expect(g.yearTheme.word).toBe('Home and care')
    expect(g.summary).toMatch(/^Driver 6, conductor 3\. 2026 is a personal year 6/)
    expect(generalReading(undefined, NOW)).toBeNull()
  })
})

describe('a summary on every tab', () => {
  it('every tab has 1–3 lines for every member, and never uses diagnostic words', () => {
    const seed = makeSeed(NOW)
    const by = byPersonOf(seed.appts)
    const tabs: PersonTab[] = ['overview', 'loshu', 'moods', 'notes', 'remedy', 'sessions', 'about']
    for (const p of seed.people) {
      const v = personView(p, by.get(p.id), NOW)
      for (const t of tabs) {
        const lines = tabSummary(t, v, NOW)
        expect(lines.length, `${p.name} ${t}`).toBeGreaterThanOrEqual(1)
        expect(lines.length).toBeLessThanOrEqual(3)
        expect(lines.join(' '), `${p.name} ${t}`).not.toMatch(NOT_SAID)
        expect(lines.join(' ')).not.toMatch(/undefined|NaN/)
      }
    }
  })
  it('mood board counts the last 4 weeks', () => {
    const seed = makeSeed(NOW)
    const p = seed.people.find((x) => x.moods.length > 5)!
    const m = moodStats(personView(p, [], NOW), NOW)
    expect(m.days).toHaveLength(28)
    expect(m.logged).toBe(m.days.filter((d) => d.mood).length)
    expect(m.counts.reduce((s, [, n]) => s + n, 0)).toBe(m.logged)
  })
})

describe('remedy between sessions', () => {
  it('becomes the current blend and joins the remedy history', () => {
    let s = fresh(NOW)
    const p = s.people[0]
    const before = personView(p, byPersonOf(s.appts).get(p.id), NOW).remedies.length
    s = reducer(s, { type: 'giveRemedyBetween', personId: p.id, id: 'rmX', flowers: ['Olive', 'Hornbeam'], now: NOW })
    const v = personView(s.people[0], byPersonOf(s.appts).get(p.id), NOW)
    expect(v.blend?.remedy?.flowers).toEqual(['Olive', 'Hornbeam'])
    expect(v.blend?.remedyOnly).toBe(true)
    expect(v.remedies).toHaveLength(before + 1)
    expect(v.sessions.some((a) => a.remedyOnly)).toBe(false) // never counted as a session
  })
})

describe('marketing', () => {
  it('audiences skip anyone nudged in the last 7 days', () => {
    let s = fresh(NOW)
    const by = byPersonOf(s.appts)
    const a1 = audiences(s.people, by, s.mkt, NOW)
    expect(a1.app.people.length).toBeGreaterThan(0)
    const ids = a1.app.people.slice(0, 3).map((v) => v.p.id)
    s = reducer(s, { type: 'nudge', personIds: ids, kind: 'app', now: NOW })
    const a2 = audiences(s.people, by, s.mkt, NOW)
    expect(a2.app.people.length).toBe(a1.app.people.length - 3)
    expect(audiences(s.people, by, s.mkt, NOW + 8 * DAY).app.people.map((v) => v.p.id)).toEqual(expect.arrayContaining(ids))
  })
  it('templates fill the first name; posts never carry a full name by default', () => {
    expect(fill(NUDGE_TEXT.drifting, 'Asha')).toMatch(/^Namaste Asha/)
    const seed = makeSeed(NOW)
    const posts = readyPosts(seed.appts, seed.people, NOW, 200000)
    expect(posts.some((p) => p.kind === 'review')).toBe(true)
    for (const p of posts.filter((x) => x.kind === 'review')) expect(p.author).toMatch(/^A member/)
    expect(new Set(posts.map((p) => p.kind))).toEqual(new Set(['story', 'review', 'flower', 'tip', 'book', 'impact']))
  })
})
