/**
 * @module   prototype/consultant-app/journey
 * @owner    CONSULTANT
 * Purpose:  Consultant console (owner 2026-11-23): last-visit recency colour, journey tag (Occasional / Regular / Drifting),
 *           the wellness summary (rule-based stand-in for the AI summary, K6), wellness journey timeline and blend journey.
 * Wording:  descriptive only. No diagnostic or medical words (see NOT_SAID and the unit test that enforces it).
 */
import type { Appt, Mood } from '../data/types'
import { DAY, startOfDay } from '../data/seed'
import { adherence, scanSummary, type PersonView } from './derive'
import { fmtShort } from './time'

// ---------------------------------------------------------------- last visit + colour cue
export type Recency = 'recent' | 'while' | 'long'
/** green: within about a month (≤ 35 days) · amber: 2–3 months (36–90 days) · soft red: beyond 90 days */
export function recency(lastStart: number | undefined, now: number): { days: number; tone: Recency; label: string } | null {
  if (lastStart === undefined) return null
  const days = Math.max(0, Math.round((startOfDay(now) - startOfDay(lastStart)) / DAY))
  const tone: Recency = days <= 35 ? 'recent' : days <= 90 ? 'while' : 'long'
  return { days, tone, label: days === 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago` }
}

// ---------------------------------------------------------------- journey tag
export type Journey = 'Regular' | 'Occasional' | 'Drifting'
export const JOURNEY_RULE: Record<Journey, string> = {
  Regular: '3 or more sessions in the last 6 months, last one within 2 months',
  Occasional: 'Comes now and then, last session within 3 months',
  Drifting: 'No session for over 3 months, or the follow-up is a month overdue',
}
export function journeyTag(v: PersonView, now: number): { tag: Journey; why: string } | null {
  const done = v.past.filter((a) => a.status === 'completed')
  if (!done.length) return null
  const sinceLast = now - done.at(-1)!.start
  const recent = done.filter((a) => now - a.start <= 182 * DAY).length
  const months = (ms: number) => Math.max(1, Math.round(ms / (30 * DAY)))
  if (!v.next && (sinceLast > 90 * DAY || (v.dueOn !== undefined && now - v.dueOn > 30 * DAY)))
    return { tag: 'Drifting', why: sinceLast > 90 * DAY ? `Last session ${months(sinceLast)} months ago` : `Follow-up was due ${fmtShort(v.dueOn!)}` }
  if (recent >= 3 && (sinceLast <= 60 * DAY || v.next)) {
    const gaps = done.filter((a) => now - a.start <= 182 * DAY).map((a) => a.start).map((t, i, arr) => (i ? t - arr[i - 1] : 0)).slice(1)
    const avgWeeks = gaps.length ? Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length / (7 * DAY)) : 0
    return { tag: 'Regular', why: `${recent} sessions in 6 months${avgWeeks ? `, about every ${avgWeeks} ${avgWeeks === 1 ? 'week' : 'weeks'}` : ''}` }
  }
  return { tag: 'Occasional', why: `${recent || done.length} ${(recent || done.length) === 1 ? 'session' : 'sessions'} ${recent ? 'in 6 months' : 'so far'}` }
}

// ---------------------------------------------------------------- wellness summary
/** Session concerns in everyday words, so the summary describes feelings rather than labelling anyone. */
const FEELING: Record<string, string> = {
  Anxiety: 'worry', Fear: 'fear', Overthinking: 'overthinking', Sadness: 'sadness', Loneliness: 'loneliness', Anger: 'anger',
  Insecurity: 'self-doubt', Exhaustion: 'tiredness', Grief: 'grief', Indecision: 'indecision', Overwhelm: 'feeling overwhelmed', Guilt: 'guilt',
}
export const feelingWord = (concern: string) => FEELING[concern] ?? concern.toLowerCase()
const SETTLED: Mood[] = ['calm', 'joyful', 'grateful', 'hopeful']
const MOOD_WORD: Record<Mood, string> = { calm: 'calm', joyful: 'joyful', grateful: 'grateful', hopeful: 'hopeful', tired: 'tired', anxious: 'uneasy', sad: 'low', irritated: 'irritable' }

/** Words the summary must never use (descriptive, not diagnostic). Enforced by a unit test. */
export const NOT_SAID = /diagnos|disorder|depress|symptom|patient|treat|cure|clinical|illness|disease|prescri|medicat|condition|anxiety|therapy/i

export interface WellnessSummary {
  flag?: string // the blend routine isn't being followed regularly
  emotions: string[] // feelings noted, everyday words
  emotionLine: string
  blendLine: string
  blend?: Appt
  focus: string[] // 1–2 lines for the next session
}

export function wellnessSummary(v: PersonView, now: number): WellnessSummary {
  const done = v.past.filter((a) => a.status === 'completed')
  const recentSessions = done.slice(-2)
  const first = v.p.first

  // 1. blend routine
  let flag: string | undefined
  const onRemedy = v.daysLeft !== undefined && v.daysLeft >= 0
  if (v.service === 'bach' && onRemedy) {
    const a = adherence(v.p, now)
    const loggedLately = a?.days.slice(-3).some((d) => d.state !== 'none')
    if (!a || !loggedLately) flag = `${first} hasn't ticked "took my drops" in the last few days, so the routine is unclear.`
    else if (a.last7Missed >= 3) flag = `Drops missed on ${a.last7Missed} of the last 7 days.`
    else if (a.pct < 0.6 && a.logged >= 7) flag = `Drops taken on ${Math.round(a.pct * 100)}% of days since the blend started.`
  }

  // 2. feelings noted
  let emotions: string[] = []
  let emotionLine: string
  if (v.service === 'scanning') {
    const s = scanSummary(v.sessions, v.p.notes)
    emotions = s ? s.themes.slice(0, 3).map(([t]) => t.toLowerCase()) : []
    emotionLine = emotions.length ? 'What comes up most in your notes.' : 'No notes yet to draw from.'
  } else {
    const tally = new Map<string, number>()
    for (const a of recentSessions) for (const c of a.troubling ?? []) tally.set(c, (tally.get(c) ?? 0) + 1)
    emotions = [...tally.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => feelingWord(c)).slice(0, 4)
    emotionLine = emotions.length
      ? `From the last ${recentSessions.length === 1 ? 'session' : `${recentSessions.length} sessions`}.`
      : recentSessions.length ? 'Nothing specific was noted in recent sessions.' : 'No sessions yet.'
  }
  const fortnight = v.p.moods.filter((m) => m.day >= startOfDay(now) - 13 * DAY)
  if (fortnight.length >= 3) {
    const settled = fortnight.filter((m) => SETTLED.includes(m.mood)).length
    const heavy = fortnight.filter((m) => !SETTLED.includes(m.mood))
    const common = [...heavy.reduce((mp, m) => mp.set(m.mood, (mp.get(m.mood) ?? 0) + 1), new Map<Mood, number>()).entries()].sort((a, b) => b[1] - a[1])[0]
    emotionLine += ` Journal, last 2 weeks: ${settled} settled ${settled === 1 ? 'day' : 'days'} of ${fortnight.length}${common ? `, ${MOOD_WORD[common[0]]} most often on the others` : ''}.`
  }

  // 3. last blend
  const blend = v.blend
  const blendLine = blend?.remedy
    ? `${blend.remedy.flowers.join(', ')}, given ${fmtShort(blend.remedy.givenAt)} (${Math.max(0, Math.round((now - blend.remedy.givenAt) / DAY))} days ago).`
    : v.service === 'scanning' ? 'No blend: scanning sessions only.' : 'No blend given yet.'

  // 4. suggested focus (descriptive prompts, 1–2 lines)
  const focus: string[] = []
  const last3 = done.slice(-3)
  const repeat = [...new Set(last3.flatMap((a) => a.troubling ?? []))]
    .map((c) => ({ c, n: last3.filter((a) => a.troubling?.includes(c)).length })).filter((x) => x.n >= 2).sort((a, b) => b.n - a.n)[0]
  const ck = v.p.checkin && now - v.p.checkin.at < 21 * DAY ? v.p.checkin : undefined
  const tag = journeyTag(v, now)
  if (ck?.harder.length) focus.push(`Check-in says ${ck.harder.map(feelingWord).join(' and ')} ${ck.harder.length === 1 ? 'feels' : 'feel'} harder. A good place to begin.`)
  if (repeat) focus.push(`${feelingWord(repeat.c).replace(/^\w/, (x) => x.toUpperCase())} came up in ${repeat.n} of the last ${last3.length} sessions. Explore what has shifted since then.`)
  if (flag) focus.push('Ask gently how the drops fit into the day.')
  if (tag?.tag === 'Drifting') focus.push('First session in a while. Start with what has changed.')
  if (ck?.better.length) focus.push(`${ck.better.map(feelingWord).join(' and ').replace(/^\w/, (x) => x.toUpperCase())} ${ck.better.length === 1 ? 'feels' : 'feel'} better. Note what helped.`)
  if (v.service === 'scanning') { const s = scanSummary(v.sessions, v.p.notes); if (s?.advice) focus.push(`Follow up: ${s.advice}`) }
  if (!focus.length) focus.push(blend ? 'Review how the last blend felt and whether to continue it.' : 'Get to know what brings them here.')

  return { flag, emotions, emotionLine, blendLine, blend, focus: focus.slice(0, 2) }
}

// ---------------------------------------------------------------- wellness journey timeline
export interface JourneyStep { appt: Appt; gapWeeks?: number; troubling: string[]; felt: string[]; flowers?: number }
export function journeySteps(v: PersonView): JourneyStep[] {
  const done = v.past.filter((a) => a.status === 'completed')
  return done.map((a, i) => ({
    appt: a,
    gapWeeks: i ? Math.max(1, Math.round((a.start - done[i - 1].start) / (7 * DAY))) : undefined,
    troubling: (a.troubling ?? []).map(feelingWord),
    felt: a.benefits ?? [],
    flowers: a.remedy?.flowers.length,
  }))
}

// ---------------------------------------------------------------- blend journey
export interface BlendStep { appt: Appt; flowers: string[]; added: string[]; dropped: string[]; kept: string[] }
export function blendJourney(v: PersonView): BlendStep[] {
  const blends = v.remedies
  return blends.map((a, i) => {
    const prev = i ? blends[i - 1].remedy!.flowers : []
    const now = a.remedy!.flowers
    return { appt: a, flowers: now, added: i ? now.filter((f) => !prev.includes(f)) : [], dropped: prev.filter((f) => !now.includes(f)), kept: i ? now.filter((f) => prev.includes(f)) : now }
  })
}
