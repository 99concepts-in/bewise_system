/**
 * App state: seeded demo data + the changes he makes (persisted per device, per day).
 * localStorage is a convenience only; every read/write is guarded so the app works without it.
 */
import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import { makeSeed, startOfDay, MIN } from '../data/seed'
import type { Appt, Kind, Mode, Notice, Person } from '../data/types'

interface State {
  day: number
  people: Person[]
  appts: Appt[]
  notices: Notice[]
  readUpTo: number
  dismissed: string[]
  saturdayMorning: boolean
}

type Action =
  | { type: 'giveRemedy'; apptId: string; flowers: string[]; now: number }
  | { type: 'reschedule'; apptId: string; start: number }
  | { type: 'book'; personId: string; start: number; kind: Kind; mode: Mode; id: string; now: number }
  | { type: 'start'; apptId: string }
  | { type: 'dismiss'; key: string }
  | { type: 'readAll'; now: number }
  | { type: 'saturday'; on: boolean }
  | { type: 'reset'; now: number }

const KEY = 'bewise.consult.v1'

function fresh(now: number): State {
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

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'giveRemedy':
      return { ...s, appts: s.appts.map((x) => x.id === a.apptId ? { ...x, remedy: { flowers: a.flowers, stage: 'preparing', givenAt: a.now } } : x) }
    case 'reschedule': {
      const p = s.appts.find((x) => x.id === a.apptId)
      const appts = s.appts.map((x) => x.id === a.apptId ? { ...x, start: a.start } : x).sort((x, y) => x.start - y.start)
      return { ...s, appts, notices: p ? [{ id: `n${Date.now()}`, at: Date.now(), kind: 'rescheduled', text: `You moved ${s.people.find((q) => q.id === p.personId)?.first}'s session`, personId: p.personId, seen: true }, ...s.notices] : s.notices }
    }
    case 'book': {
      const appt: Appt = { id: a.id, personId: a.personId, start: a.start, durationMin: a.kind === 'first' ? 60 : 30, kind: a.kind, mode: a.mode, status: 'awaiting_payment' }
      return { ...s, appts: [...s.appts, appt].sort((x, y) => x.start - y.start) }
    }
    case 'start':
      return { ...s, appts: s.appts.map((x) => x.id === a.apptId ? { ...x, status: 'in_session' } : x) }
    case 'dismiss':
      return s.dismissed.includes(a.key) ? s : { ...s, dismissed: [...s.dismissed, a.key] }
    case 'readAll':
      return { ...s, readUpTo: a.now }
    case 'saturday':
      return { ...s, saturdayMorning: a.on }
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

export const minutes = (n: number) => n * MIN
