/**
 * @module   prototype/consultant-app
 * @owner    CONSULTANT
 * Purpose:  v5 "Blue Bloom" (HUB 2026-11-20, D-45): one consistent colour per feeling, and asset ids for flowers and feelings.
 *           Pure functions, no React, so they are unit-tested and shared by every screen.
 */
import type { Mood } from '../data/types'

export type Accent = 'marigold' | 'coral' | 'rose' | 'lilac' | 'teal' | 'sky' | 'navy'

/** Spec §2 accent table (500 = strong, 100 = pale tint for chips with ink text). */
export const ACCENT: Record<Accent, { c500: string; c100: string }> = {
  marigold: { c500: '#F2A93B', c100: '#FFF1D9' },
  coral: { c500: '#EE7F5F', c100: '#FFE6DE' },
  rose: { c500: '#E06A8E', c100: '#FDE3EB' },
  lilac: { c500: '#8E74DB', c100: '#EEE8FF' },
  teal: { c500: '#2FA39A', c100: '#DDF4F1' },
  sky: { c500: '#3E9BE6', c100: '#DFF0FF' },
  navy: { c500: '#243D91', c100: '#E6EDFF' },
}

// Order matters: the first rule that matches wins.
const RULES: [RegExp, Accent][] = [
  [/anx|fear|panic|scared|shock|terror/, 'coral'],
  [/sad|low mood|lonel|grief|loss|hopeless|sleep|gloom|despair/, 'lilac'],
  [/tired|exhaust|drain|fatigue|calm|peace|growth/, 'teal'],
  [/stress|overwhelm|anger|angry|irritat|restless|focus|impatien/, 'navy'],
  [/overthink|guilt|jealous|grate|love|rumin/, 'rose'],
  [/worr|insecur|confiden|indecis|doubt|clarity/, 'sky'],
  [/joy|hope|happy|energy/, 'marigold'],
]

/** Feeling or troubling emotion → accent. Anxious/fear coral, low mood lilac, tired teal, stressed navy, overthinking rose, worry sky, joyful marigold. */
export function feelingTone(name: string): Accent {
  const n = name.toLowerCase()
  for (const [re, a] of RULES) if (re.test(n)) return a
  return 'sky'
}

export const MOOD_TONE: Record<Mood, Accent> = {
  calm: 'teal', joyful: 'marigold', grateful: 'rose', hopeful: 'marigold',
  tired: 'teal', anxious: 'coral', sad: 'lilac', irritated: 'navy',
}

/** "Star of Bethlehem" → "star-of-bethlehem" (= the API's bach_remedies.id and the file name in public/img/flowers). */
export const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
export const flowerId = slug

/** Feeling / troubling emotion → line-icon id in public/img/feelings (client intake words and consultant concerns). */
const FEELING_ICON_ALIAS: Record<string, string> = {
  'grief-or-loss': 'grief', insecurity: 'low-confidence', 'low-confidence': 'low-confidence', irritated: 'irritability',
  anxious: 'anxiety', worried: 'worry', tired: 'exhaustion', sad: 'sadness', stressed: 'overwhelm', angry: 'anger',
}
export function feelingIconId(name: string) {
  const s = slug(name)
  return FEELING_ICON_ALIAS[s] ?? s
}
