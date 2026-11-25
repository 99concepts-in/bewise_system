/**
 * @module   prototype/consultant-app/loshu
 * @owner    CONSULTANT
 * Purpose:  Lo Shu grid from a date of birth (the member enters it in the client app, CL-05; backend `clients.dob`).
 *           One calculation shared with the client app so both show the same grid (spec: docs/specs/consultant/02-LO-SHU-GRID.md).
 *
 * Rules (common Indian practice; Jitendra Khimlani to confirm):
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

// ---------------------------------------------------------------- general reading (owner 2026-11-25: "Lo Shu grid with general prediction")
/** Driver (Mulank): how the person tends to show up day to day. General tendencies, for conversation. */
export const DRIVER_TRAIT: Record<number, string> = {
  1: 'Tends to lead and start things. Independent, likes to decide for themselves.',
  2: 'Gentle and sensitive. Values harmony and feels the moods of people around them.',
  3: 'Expressive and optimistic. Enjoys learning, teaching and sharing ideas.',
  4: 'Practical and hard-working. Likes order, but can feel stuck when plans change.',
  5: 'Quick, curious and adaptable. Enjoys variety and people; restless with routine.',
  6: 'Caring and responsible. Home and family come first; can carry others\' worries.',
  7: 'Reflective and private. Seeks meaning, often learns through experience.',
  8: 'Determined and patient. Works steadily towards goals; may hold feelings in.',
  9: 'Energetic and big-hearted. Driven by ideals, quick to act, can be impatient.',
}
/** Conductor (Bhagyank): the longer path. */
export const CONDUCTOR_TRAIT: Record<number, string> = {
  1: 'A path of self-reliance: growth comes from trusting their own lead.',
  2: 'A path of partnership: growth comes through patience and cooperation.',
  3: 'A path of expression: growth comes through creativity and knowledge.',
  4: 'A path of building: steady effort brings lasting results.',
  5: 'A path of change: travel, people and new experiences open doors.',
  6: 'A path of care: responsibility for others brings both weight and reward.',
  7: 'A path of inner learning: answers come from reflection and faith.',
  8: 'A path of effort and reward: results come late but stay.',
  9: 'A path of service: completing things and giving to others brings peace.',
}
/** Personal year = day + month of birth + the current year, reduced. */
export const YEAR_THEME: Record<number, { word: string; line: string }> = {
  1: { word: 'New beginnings', line: 'A year to start fresh and plant seeds.' },
  2: { word: 'Patience', line: 'A slower year for relationships, cooperation and rest.' },
  3: { word: 'Expression', line: 'A social, creative year; good for speaking up.' },
  4: { word: 'Foundations', line: 'A year of steady work, routines and planning.' },
  5: { word: 'Change', line: 'A year of movement and surprises; stay flexible.' },
  6: { word: 'Home and care', line: 'Family and responsibilities take centre stage.' },
  7: { word: 'Reflection', line: 'An inward year for learning, rest and reflection.' },
  8: { word: 'Effort and reward', line: 'A year where work and money matters move forward.' },
  9: { word: 'Completion', line: 'A year to finish, let go and make space for what is next.' },
}
export function personalYear(dob: string | undefined | null, now: number): number | null {
  const p = parseDob(dob)
  if (!p) return null
  return reduce(p.d + p.m + String(new Date(now).getFullYear()).split('').reduce((s, d) => s + Number(d), 0))
}
/** The short general reading shown on the Lo Shu tab. */
export function generalReading(dob: string | undefined | null, now: number) {
  const ls = loShu(dob)
  if (!ls) return null
  const year = personalYear(dob, now)!
  const strengths = ls.planes.map((pl) => pl.line)
  const work = ls.missing.slice(0, 3).map((n) => NUMBER_MEANING[n].word.toLowerCase())
  return {
    driver: DRIVER_TRAIT[ls.driver], conductor: CONDUCTOR_TRAIT[ls.conductor], year, yearTheme: YEAR_THEME[year],
    strengths, work,
    summary: `Driver ${ls.driver}, conductor ${ls.conductor}. ${new Date(now).getFullYear()} is a personal year ${year}: ${YEAR_THEME[year].word.toLowerCase()}.${work.length ? ` Room to grow: ${work.join(', ')}.` : ''}`,
  }
}
