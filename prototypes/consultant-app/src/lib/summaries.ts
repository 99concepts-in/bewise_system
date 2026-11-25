/**
 * @module   prototype/consultant-app/summaries
 * @owner    CONSULTANT
 * Purpose:  The short summary at the top of every person / appointment tab (owner 2026-11-25: "a summary in all the tabs").
 *           Descriptive only, same wording rule as the wellness summary (NOT_SAID).
 */
import type { Mood } from '../data/types'
import { DAY, startOfDay } from '../data/seed'
import { adherence, allNotes, summariseNotes, type PersonView } from './derive'
import { generalReading } from './loshu'
import { feelingWord, journeyTag, recency, wellnessSummary } from './journey'
import { fmtShort } from './time'

export type PersonTab = 'overview' | 'loshu' | 'moods' | 'notes' | 'remedy' | 'sessions' | 'about'

const SETTLED: Mood[] = ['calm', 'joyful', 'grateful', 'hopeful']
export const MOOD_LABEL: Record<Mood, string> = { calm: 'Calm', joyful: 'Joyful', grateful: 'Grateful', hopeful: 'Hopeful', tired: 'Tired', anxious: 'Uneasy', sad: 'Low', irritated: 'Irritable' }

/** Mood board for one person: the last `span` days, counts per feeling and which way it is moving. */
export function moodStats(v: PersonView, now: number, span = 28) {
  const today = startOfDay(now)
  const days = Array.from({ length: span }, (_, i) => today - (span - 1 - i) * DAY).map((d) => ({ day: d, mood: v.p.moods.find((m) => m.day === d)?.mood }))
  const logged = days.filter((d) => d.mood) as { day: number; mood: Mood }[]
  const counts = new Map<Mood, number>()
  for (const d of logged) counts.set(d.mood, (counts.get(d.mood) ?? 0) + 1)
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
  const settled = logged.filter((d) => SETTLED.includes(d.mood)).length
  const half = Math.floor(logged.length / 2)
  const r = (xs: typeof logged) => (xs.length ? xs.filter((d) => SETTLED.includes(d.mood)).length / xs.length : 0)
  const early = r(logged.slice(0, half)), late = r(logged.slice(half))
  const trend: 'up' | 'down' | 'steady' | 'none' = logged.length < 4 ? 'none' : late - early > 0.15 ? 'up' : early - late > 0.15 ? 'down' : 'steady'
  return { days, logged: logged.length, settled, counts: sorted, top: sorted[0]?.[0], trend }
}

export function notesOf(v: PersonView) { return allNotes(v.sessions, v.p.notes) }

/** 1–3 short lines for the top of each tab. */
export function tabSummary(tab: PersonTab, v: PersonView, now: number): string[] {
  const p = v.p
  switch (tab) {
    case 'overview': {
      const s = wellnessSummary(v, now)
      return [s.focus[0]]
    }
    case 'loshu': {
      const g = generalReading(p.dob, now)
      return g ? [g.summary] : [`No date of birth yet. Ask ${p.first} to add it in the app, or add it here.`]
    }
    case 'moods': {
      const m = moodStats(v, now)
      if (!m.logged) return [`${p.first} hasn't logged feelings in the last 4 weeks, or keeps the journal private.`]
      const trend = m.trend === 'up' ? 'More settled days lately.' : m.trend === 'down' ? 'Fewer settled days lately than earlier.' : m.trend === 'steady' ? 'Steady across the 4 weeks.' : ''
      const ck = p.checkin && now - p.checkin.at < 21 * DAY ? p.checkin : undefined
      return [
        `${m.logged} feelings logged in 4 weeks: ${m.settled} settled. Most often ${MOOD_LABEL[m.top!].toLowerCase()}. ${trend}`.trim(),
        ...(ck ? [`Check-in: ${ck.better.length ? `${ck.better.map(feelingWord).join(', ')} better` : 'nothing better yet'}${ck.harder.length ? `; ${ck.harder.map(feelingWord).join(', ')} harder` : ''}.`] : []),
      ]
    }
    case 'notes': {
      const s = summariseNotes(notesOf(v))
      if (!s) return [`No notes yet. Add one after the session; the summary builds from them.`]
      return [
        `${s.notes} ${s.notes === 1 ? 'note' : 'notes'} since ${fmtShort(s.since)}.${s.themes.length ? ` Comes up most: ${s.themes.slice(0, 3).map(([t]) => t.toLowerCase()).join(', ')}.` : ''}`,
        `Last (${fmtShort(s.last.start)}): ${s.lastLine}`,
        ...(s.advice ? [`To follow up: ${s.advice}`] : []),
      ]
    }
    case 'remedy': {
      const b = v.blend?.remedy
      if (!b) return [`No remedy given yet. Create ${p.first}'s first blend here.`]
      const a = adherence(p, now)
      const left = v.daysLeft !== undefined ? (v.daysLeft >= 0 ? `${v.daysLeft} ${v.daysLeft === 1 ? 'day' : 'days'} left` : `finished ${-v.daysLeft} ${v.daysLeft === -1 ? 'day' : 'days'} ago`) : ''
      return [
        `Current blend: ${b.flowers.join(', ')} (since ${fmtShort(b.givenAt)}${left ? `, ${left}` : ''}).`,
        a ? (a.last7Missed >= 3 ? `Drops missed on ${a.last7Missed} of the last 7 days.` : `Taking the drops: ${Math.round(a.pct * 100)}% of days, ${a.streak}-day streak.`) : `${p.first} isn't ticking "took my drops" in the app yet.`,
        `${v.remedies.length} ${v.remedies.length === 1 ? 'remedy' : 'remedies'} so far.`,
      ]
    }
    case 'sessions': {
      const done = v.past.filter((a) => a.status === 'completed').length
      const j = journeyTag(v, now)
      const r = recency(v.last?.start, now)
      return [`${done} ${done === 1 ? 'session' : 'sessions'}${v.avgRating ? `, rated ${v.avgRating.toFixed(1)} on average` : ''}.${r ? ` Last ${r.label}.` : ''}${v.next ? ` Next ${fmtShort(v.next.start)}.` : ''}${j ? ` ${j.tag}.` : ''}`]
    }
    case 'about': {
      const app = p.app
      return [`${app?.installed ? (app.lastOpen && now - app.lastOpen > 14 * DAY ? `Has the BeWise app but last opened it ${Math.round((now - app.lastOpen) / DAY)} days ago.` : 'Uses the BeWise app.') : 'Hasn\'t installed the BeWise app yet.'} With you since ${fmtShort(p.joinedAt)}.`]
    }
  }
}
