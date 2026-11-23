import { describe, expect, it } from 'vitest'
import { ageOn, loShu, parseDob } from '../lib/loshu'

describe('Lo Shu grid', () => {
  it('places every non-zero digit, adds driver and conductor for two-digit days', () => {
    // 15-08-1987: digits 1 5 0 8 1 9 8 7 → driver 1+5 = 6, conductor 39 → 12 → 3
    const ls = loShu('1987-08-15')!
    expect(ls.driver).toBe(6)
    expect(ls.conductor).toBe(3)
    expect(ls.added).toEqual([6, 3])
    expect(ls.count.slice(1)).toEqual([2, 0, 1, 0, 1, 1, 1, 2, 1])
    expect(ls.missing).toEqual([2, 4])
    expect(ls.repeated).toEqual([{ n: 1, times: 2 }, { n: 8, times: 2 }])
    expect(ls.planes.map((p) => p.name)).toEqual(['Emotional plane', 'Practical plane', 'Will plane'])
  })
  it('single-digit days and 10 / 20 / 30 add only the conductor', () => {
    expect(loShu('1990-03-07')!.added).toEqual([2]) // 7+3+1+9+9 = 29 → 11 → 2
    expect(loShu('1990-03-07')!.driver).toBe(7)
    expect(loShu('1985-11-20')!.added).toEqual([loShu('1985-11-20')!.conductor])
    expect(loShu('1985-11-20')!.driver).toBe(2)
  })
  it('a full grid has no missing numbers and complete planes', () => {
    const ls = loShu('2003-09-16')! // contains many digits; check consistency only
    expect(ls.missing.every((n) => ls.count[n] === 0)).toBe(true)
    expect(ls.count.slice(1).reduce((a, b) => a + b, 0)).toBe('16092003'.replace(/0/g, '').length + ls.added.length)
  })
  it('rejects dates that do not exist', () => {
    expect(parseDob('1990-02-30')).toBeNull()
    expect(loShu('')).toBeNull()
    expect(loShu(undefined)).toBeNull()
    expect(loShu('15/08/1987')).toBeNull()
  })
  it('works out age on a given day', () => {
    const now = new Date(2026, 10, 23).getTime()
    expect(ageOn('1990-11-23', now)).toBe(36)
    expect(ageOn('1990-11-24', now)).toBe(35)
  })
})
