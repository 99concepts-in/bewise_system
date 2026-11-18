/**
 * @module   prototype/consultant-app
 * @owner    CONSULTANT
 * @screens  CN-03, CN-12, CN-13, CN-14, CN-16, CN-26
 * Purpose:  Domain types for the consultant prototype (demo data only — real data comes from src/modules/* later).
 */
export type Mode = 'online' | 'in_person'
export type Kind = 'first' | 'followup'
export type Mood = 'calm' | 'joyful' | 'grateful' | 'hopeful' | 'tired' | 'anxious' | 'sad' | 'irritated'
export type ApptStatus = 'awaiting_payment' | 'confirmed' | 'checked_in' | 'in_session' | 'completed' | 'no_show'
export type RemedyStage = 'given' | 'preparing' | 'dispatched' | 'delivered'

export interface Person {
  id: string
  name: string
  first: string
  pronoun: 'she' | 'he' | 'they'
  city: string
  phone: string
  joinedAt: number
  moods: { day: number; mood: Mood }[] // journal entries (shared with him), newest last
  checkin?: { at: number; better: string[]; same: string[]; harder: string[] }
  drops?: { day: number; taken: boolean }[] // client ticks "took my drops" in their app (CL-26); missing day = not logged
}

/** Object / possessive forms — "they" is the default when a person is added without a pronoun. */
export function pron(p: Pick<Person, 'pronoun'>) {
  return p.pronoun === 'she' ? { obj: 'her', poss: 'her' } : p.pronoun === 'he' ? { obj: 'him', poss: 'his' } : { obj: 'them', poss: 'their' }
}

export interface Appt {
  id: string
  personId: string
  start: number
  durationMin: number
  kind: Kind
  mode: Mode
  status: ApptStatus
  note?: string
  troubling?: string[]
  remedy?: { flowers: string[]; stage: RemedyStage; givenAt: number }
  rating?: number
  feedback?: string
  benefits?: string[] // what the client said they felt after the session (feedback tags, client's words)
  followUpWeeks?: number
  privateNote?: string // 🔒 only him
  sharedSummary?: string // optional summary shared with the client (D-26)
  greeting?: string // the WhatsApp greeting he sent when booking
}

export interface Notice {
  id: string
  at: number
  kind: 'booked' | 'rescheduled' | 'feedback' | 'delivered' | 'payment' | 'checkin'
  text: string
  personId?: string
  seen?: boolean
}
