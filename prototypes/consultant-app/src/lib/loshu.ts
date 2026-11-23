/**
 * @module   prototype/consultant-app/loshu
 * @owner    CONSULTANT
 * Purpose:  Lo Shu grid from a date of birth (the member enters it in the client app, CL-05; backend `clients.dob`).
 *           One calculation shared with the client app so both show the same grid (spec: docs/specs/consultant/02-LO-SHU-GRID.md).
 *
 * Rules (common Indian practice; Jitu Bhaiya to confirm):
 *  - Every non-zero digit of the date (DD MM YYYY) goes into its cell. Zeros are not placed.
 *  - Driver (Mulank)    = day reduced to one digit.
 *  - Conductor (Bhagyank) = all digits of the date reduced to one digit.
 *  - The conductor is always added to the grid. The driver is added only when the day has two digits
 *    and is not 10, 20 or 30 (for single-digit days and 10/20/30 the driver is already the day's own digit).
 */

/** The magic square, read row by row: top 4 9 2 · middle 3 5 7 · bottom 8 1 6. */
export const LOSHU_LAYOUT = [4, 9, 2, 3, 5, 7, 8, 1, 6] as const

export const NUMBER_MEANING: Record<number, { word: string; line: string }> = {
  1: { word: 'Expression', line: 'Communication, independence, speaking up.' },
  2: { word: 'Sensitivity', line: 'Intuition, feelings, cooperation.' },
  3: { word: 'Imagination', line: 'Creativity, ideas, memory.' },
  4: { word: 'Order', line: 'Discipline, planning, practical sense.' },
  5: { word: 'Balance', line: 'The centre: stability, freedom, flexibility.' },
  6: { word: 'Care', line: 'Home, family, responsibility.' },
  7: { word: 'Learning', line: 'Lessons through experience, the inner life.' },
  8: { word: 'Wisdom', line: 'Detail, judgement, money matters.' },
  9: { word: 'Compassion', line: 'Ideals, ambition, service to others.' },
}

export const PLANES: { name: string; nums: [number, number, number]; line: string }[] = [
  { name: 'Mental plane', nums: [4, 9, 2], line: 'thinking and ideas' },
  { name: 'Emotional plane', nums: [3, 5, 7], line: 'feelings and inner strength' },
  { name: 'Practical plane', nums: [8, 1, 6], line: 'getting things done' },
  { name: 'Thought plane', nums: [4, 3, 8], line: 'planning' },
  { name: 'Will plane', nums: [9, 5, 1], line: 'determination' },
  { name: 'Action plane', nums: [2, 7, 6], line: 'putting plans into action' },
  { name: 'Golden plane', nums: [4, 5, 6], line: 'success and prosperity' },
  { name: 'Silver plane', nums: [2, 5, 8], line: 'property and stability' },
]

const reduce = (n: number): number => { while (n > 9) n = String(n).split('').reduce((s, d) => s + Number(d), 0); return n }

/** Parses 'YYYY-MM-DD' strictly; returns null for anything that isn't a real calendar date. */
export function parseDob(dob: string | undefined | null): { y: number; m: number; d: number } | null {
  const mt = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob ?? '')
  if (!mt) return null
  const [y, m, d] = [Number(mt[1]), Number(mt[2]), Number(mt[3])]
  const t = new Date(Date.UTC(y, m - 1, d))
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null
  return { y, m, d }
}

export interface LoShu {
  /** how many times each number 1–9 appears (index = number; index 0 unused) */
  count: number[]
  /** the numbers added on top of the birth digits (shown differently in the grid) */
  added: number[]
  driver: number
  conductor: number
  missing: number[]
  repeated: { n: number; times: number }[]
  planes: typeof PLANES
}

export function loShu(dob: string | undefined | null): LoShu | null {
  const p = parseDob(dob)
  if (!p) return null
  const dd = String(p.d).padStart(2, '0'), mm = String(p.m).padStart(2, '0'), yyyy = String(p.y)
  const digits = (dd + mm + yyyy).split('').map(Number)
  const driver = reduce(p.d)
  const conductor = reduce(digits.reduce((s, x) => s + x, 0))
  const added = [conductor]
  if (p.d > 9 && p.d % 10 !== 0) added.unshift(driver)
  const count = Array(10).fill(0)
  for (const x of [...digits, ...added]) if (x > 0) count[x]++
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  return {
    count, added, driver, conductor,
    missing: nums.filter((n) => count[n] === 0),
    repeated: nums.filter((n) => count[n] > 1).map((n) => ({ n, times: count[n] })),
    planes: PLANES.filter((pl) => pl.nums.every((n) => count[n] > 0)),
  }
}

/** Whole years on `now`. */
export function ageOn(dob: string | undefined | null, now: number): number | null {
  const p = parseDob(dob)
  if (!p) return null
  const t = new Date(now)
  let age = t.getFullYear() - p.y
  if (t.getMonth() + 1 < p.m || (t.getMonth() + 1 === p.m && t.getDate() < p.d)) age--
  return age
}
