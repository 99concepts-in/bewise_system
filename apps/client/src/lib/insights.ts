/**
 * @module   journal
 * @owner    CLIENT
 * @screens  CL-08 daily insight · CL-30 journal stats · CL-56 progress (preview)
 * Purpose:  Deterministic, client-safe insights from the client's own journal. CL-56's production lines come from
 *           progress.getProgressSummary({ audience: 'client' }) (AI, CONSULTANT) — this is the on-device fallback.
 *           Never medical, never claims a remedy "worked".
 */
import { MOOD_LIFT, moodOf, type Emotion } from './data'
import type { JournalEntry } from './store'
import { addDays, dayKey, startOfDay } from './format'

export function byDay(journal: JournalEntry[]) {
  const map = new Map<string, JournalEntry[]>()
  for (const e of journal) { const k = dayKey(e.at); map.set(k, [...(map.get(k) ?? []), e]) }
  return map
}

/** dominant emotion of a day = most frequent, ties → latest */
export function dayMood(entries?: JournalEntry[]): Emotion | undefined {
  if (!entries?.length) return undefined
  const c = new Map<Emotion, number>()
  for (const e of entries) c.set(e.emotion, (c.get(e.emotion) ?? 0) + 1)
  return [...c.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

export function lastNDays(journal: JournalEntry[], n: number, end = new Date()) {
  const m = byDay(journal)
  return Array.from({ length: n }, (_, i) => {
    const d = addDays(startOfDay(end), i - (n - 1))
    const entries = m.get(dayKey(d)) ?? []
    return { date: d, entries, mood: dayMood(entries) }
  })
}

export function weekRow(journal: JournalEntry[]) {
  const today = startOfDay()
  const sunday = addDays(today, -today.getDay())
  const m = byDay(journal)
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(sunday, i)
    return { date: d, mood: dayMood(m.get(dayKey(d))), future: d > today, today: dayKey(d) === dayKey(today) }
  })
}

export function dailyInsight(journal: JournalEntry[]): string {
  const days = lastNDays(journal, 14).filter((d) => d.mood)
  if (!journal.length) return 'Log how you feel once a day, patterns appear after about a week.'
  let streak = 0
  for (let i = days.length - 1; i >= 0; i--) { if (days[i].mood && MOOD_LIFT[days[i].mood!] >= 4) streak++; else break }
  if (streak >= 3) return `You’ve felt ${moodOf(days[days.length - 1].mood!).label.toLowerCase()} or brighter ${streak} days in a row. Lovely.`
  const evenings = journal.filter((e) => new Date(e.at).getHours() >= 19)
  if (evenings.length >= 3 && evenings.filter((e) => e.emotion === 'tired').length / evenings.length > 0.5) return 'Evenings often feel tired, a slower wind-down might help.'
  const last = journal[0]
  return last ? `Your last check-in: ${moodOf(last.emotion).label.toLowerCase()}. Thank you for noticing.` : 'One tap a day is enough.'
}

export function progressLines(journal: JournalEntry[], since?: string): { mood: Emotion; text: string }[] {
  if (!since) return []
  const start = startOfDay(new Date(since))
  const days = Math.max(1, Math.round((startOfDay().getTime() - start.getTime()) / 86_400_000) + 1)
  const all = lastNDays(journal, days)
  const half = Math.floor(all.length / 2)
  const first = all.slice(0, half), second = all.slice(half)
  const count = (arr: typeof all, moods: Emotion[]) => arr.filter((d) => d.mood && moods.includes(d.mood)).length
  const calm = count(all, ['calm', 'joyful', 'grateful', 'hopeful'])
  const anxA = count(first, ['anxious']), anxB = count(second, ['anxious'])
  const tired = count(second, ['tired'])
  const out: { mood: Emotion; text: string }[] = [
    { mood: 'calm', text: `You’ve felt calm or brighter on ${calm} of ${all.length} days.` },
    anxB < anxA ? { mood: 'anxious', text: `Anxious days dropped from ${anxA} to ${anxB}.` } : { mood: 'hopeful', text: 'Keep logging, the picture gets clearer each week.' },
  ]
  if (tired >= 2) out.push({ mood: 'tired', text: 'Tiredness still shows up, worth sharing at your follow-up.' })
  else out.push({ mood: 'grateful', text: 'Small rituals add up. Your consistency shows.' })
  return out
}

export function moodMix(journal: JournalEntry[], days = 14) {
  const from = addDays(startOfDay(), -(days - 1))
  const recent = journal.filter((e) => new Date(e.at) >= from)
  const c = new Map<Emotion, number>()
  for (const e of recent) c.set(e.emotion, (c.get(e.emotion) ?? 0) + 1)
  const total = recent.length || 1
  return [...c.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ mood: k, pct: Math.round((v / total) * 100) }))
}
