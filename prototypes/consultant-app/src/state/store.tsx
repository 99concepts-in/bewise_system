/**
 * App state: seeded demo data + the changes he makes (persisted per device, per day).
 * localStorage is a convenience only; every read/write is guarded so the app works without it.
 */
import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import { makeSeed, startOfDay, MIN } from '../data/seed'
import type { Appt, ApptRequest, Kind, Mode, Notice, Person, Service, Staff, Thread } from '../data/types'

export interface State {
  day: number
  people: Person[]
  appts: Appt[]
  notices: Notice[]
  requests: ApptRequest[]
  threads: Thread[]
  readUpTo: number
  dismissed: string[]
  saturdayMorning: boolean
}

export type Action =
  | { type: 'giveRemedy'; apptId: string; flowers: string[]; now: number }
  | { type: 'reschedule'; apptId: string; start: number }
  | { type: 'book'; personId: string; start: number; service: Service; kind: Kind; mode: Mode; id: string; now: number; greeting: string; meetingUrl?: string; by: Staff; requestId?: string }
  | { type: 'setLink'; apptId: string; url: string }
  | { type: 'archive'; personId: string; on: boolean }
  | { type: 'send'; personId: string; text: string; now: number }
  | { type: 'readThread'; personId: string; now: number }
  | { type: 'start'; apptId: string }
  | { type: 'checkIn'; apptId: string }
  | { type: 'dismiss'; key: string }
  | { type: 'readAll'; now: number }
  | { type: 'saturday'; on: boolean }
  | { type: 'addPerson'; person: Person }
  | { type: 'setTroubling'; apptId: string; troubling: string[] }
  | { type: 'setNote'; apptId: string; note: string }
  | { type: 'endSession'; apptId: string; outcome: 'completed' | 'no_show'; followUpWeeks?: number; shareSummary?: string }
  | { type: 'reset'; now: number }

const KEY = 'bewise.consult.v2' // v2: services, requests, chat (2026-11-20)

export function fresh(now: number): State {
  const s = makeSeed(now)
  return { day: startOfDay(now), ...s, readUpTo: 0, dismissed: [], saturdayMorning: false }
}

function load(now: number): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as State
      if (s.day === startOfDay(now)) return s
    }
  } catch { /* storage unavailable — start fresh */ }
  return fresh(now)
}

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'giveRemedy':
      return { ...s, appts: s.appts.map((x) => x.id === a.apptId ? { ...x, remedy: { flowers: a.flowers, stage: 'preparing', givenAt: a.now } } : x) }
    case 'reschedule': {
      const p = s.appts.find((x) => x.id === a.apptId)
      const appts = s.appts.map((x) => x.id === a.apptId ? { ...x, start: a.start } : x).sort((x, y) => x.start - y.start)
      return { ...s, appts, notices: p ? [{ id: `n${Date.now()}`, at: Date.now(), kind: 'rescheduled', text: `You moved ${s.people.find((q) => q.id === p.personId)?.first}'s session`, personId: p.personId, seen: true }, ...s.notices] : s.notices }
    }
    case 'book': {
      // Flow (owner 2026-11-18/20): the team assigns the time, greets + confirms; the client gets it on WhatsApp and in the app,
      // then BeWise sends the payment link automatically. A request (if any) is closed by the booking.
      const appt: Appt = {
        id: a.id, personId: a.personId, start: a.start, durationMin: durationOf(a.service, a.kind), service: a.service, kind: a.kind, mode: a.mode,
        status: 'awaiting_payment', greeting: a.greeting, meetingUrl: a.mode === 'online' ? a.meetingUrl : undefined, assignedBy: a.by,
      }
      const first = s.people.find((q) => q.id === a.personId)?.first ?? 'Client'
      const n = (k: 'booked' | 'payment', text: string, d: number) => ({ id: `n${a.id}${k}`, at: a.now + d, kind: k, text, personId: a.personId, seen: true })
      return {
        ...s, appts: [...s.appts, appt].sort((x, y) => x.start - y.start),
        requests: a.requestId ? s.requests.filter((r) => r.id !== a.requestId) : s.requests,
        notices: [n('payment', `Payment link sent automatically to ${first}`, 2000), n('booked', `${first} got the time on WhatsApp and in the app`, 0), ...s.notices],
      }
    }
    case 'setLink':
      return { ...s, appts: s.appts.map((x) => x.id === a.apptId ? { ...x, meetingUrl: a.url.trim() || undefined } : x) }
    case 'archive':
      return { ...s, people: s.people.map((p) => p.id === a.personId ? { ...p, archived: a.on } : p) }
    case 'send': {
      const text = a.text.trim()
      if (!text) return s
      const msg = { id: `m${a.now}`, from: 'jb' as const, text, at: a.now }
      const has = s.threads.some((t) => t.personId === a.personId)
      const threads = has
        ? s.threads.map((t) => t.personId === a.personId ? { ...t, messages: [...t.messages, msg], readAt: a.now } : t)
        : [{ personId: a.personId, messages: [msg], readAt: a.now }, ...s.threads]
      return { ...s, threads }
    }
    case 'readThread':
      return { ...s, threads: s.threads.map((t) => t.personId === a.personId ? { ...t, readAt: Math.max(t.readAt, a.now) } : t) }
    case 'start':
      return { ...s, appts: s.appts.map((x) => x.id === a.apptId ? { ...x, status: 'in_session' } : x) }
    case 'checkIn':
      return { ...s, appts: s.appts.map((x) => x.id === a.apptId && x.status === 'confirmed' ? { ...x, status: 'checked_in' } : x) }
    case 'dismiss':
      return s.dismissed.includes(a.key) ? s : { ...s, dismissed: [...s.dismissed, a.key] }
    case 'readAll':
      return { ...s, readUpTo: a.now }
    case 'saturday':
      return { ...s, saturdayMorning: a.on }
    case 'setTroubling':
      return { ...s, appts: s.appts.map((x) => x.id === a.apptId ? { ...x, troubling: a.troubling } : x) }
    case 'setNote':
      return { ...s, appts: s.appts.map((x) => x.id === a.apptId ? { ...x, privateNote: a.note } : x) }
    case 'endSession':
      return { ...s, appts: s.appts.map((x) => x.id === a.apptId ? { ...x, status: a.outcome, followUpWeeks: a.followUpWeeks, sharedSummary: a.shareSummary } : x) }
    case 'addPerson':
      return { ...s, people: [a.person, ...s.people], notices: [{ id: `n${a.person.id}`, at: a.person.joinedAt, kind: 'booked', text: `You added ${a.person.first}`, personId: a.person.id, seen: true }, ...s.notices] }
    case 'reset':
      return fresh(a.now)
  }
}

interface Ctx { s: State; dispatch: React.Dispatch<Action>; now: number }
const C = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(() => Date.now())
  const [s, dispatch] = useReducer(reducer, now, load)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    const id = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignore */ } }, 250)
    return () => clearTimeout(id)
  }, [s])
  const value = useMemo(() => ({ s, dispatch, now }), [s, now])
  return <C.Provider value={value}>{children}</C.Provider>
}

export function useStore() {
  const c = useContext(C)
  if (!c) throw new Error('StoreProvider missing')
  return c
}

/** Fast lookups shared by every screen. */
export function useIndex() {
  const { s, now } = useStore()
  return useMemo(() => {
    const person = new Map(s.people.map((p) => [p.id, p]))
    const byPerson = new Map<string, Appt[]>()
    for (const a of s.appts) {
      const l = byPerson.get(a.personId)
      if (l) l.push(a); else byPerson.set(a.personId, [a])
    }
    return { person, byPerson, now }
  }, [s.people, s.appts, now])
}

/** Scanning sessions are 45 min; Bach flower first consultation 60, follow-up 30 (owner to confirm durations, D-09). */
export function durationOf(service: Service, kind: Kind) { return service === 'scanning' ? 45 : kind === 'first' ? 60 : 30 }

export const minutes = (n: number) => n * MIN
