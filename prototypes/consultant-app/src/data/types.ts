/**
 * @module   prototype/consultant-app
 * @owner    CONSULTANT
 * @screens  CN-03, CN-12, CN-13, CN-14, CN-16, CN-26
 * Purpose:  Domain types for the consultant prototype (demo data only — real data comes from src/modules/* later).
 */
export type Mode = 'online' | 'in_person'
export type Kind = 'first' | 'followup'
/** Two kinds of appointment (owner 2026-11-20). Scanning sessions keep only notes; Bach flower sessions lead to a remedy. */
export type Service = 'bach' | 'scanning'
export type Staff = 'Jitu Bhaiya' | 'Haresh bhai' | 'Shivani di'
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
  archived?: boolean // hidden from the mood board and remedy lists; restorable
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
  service: Service
  kind: Kind // first / follow-up (Bach flower); scanning keeps 'followup' after the first scan
  mode: Mode
  meetingUrl?: string // online sessions: shared with the client on WhatsApp and in the app
  assignedBy?: Staff // who fixed the time (clients only request; the team assigns)
  status: ApptStatus
  note?: string
  troubling?: string[]
  remedy?: { flowers: string[]; stage: RemedyStage; givenAt: number; weeks?: number }
  rating?: number
  feedback?: string
  benefits?: string[] // what the client said they felt after the session (feedback tags, client's words)
  followUpWeeks?: number
  privateNote?: string // 🔒 only him
  sharedSummary?: string // optional summary shared with the client (D-26)
  greeting?: string // the WhatsApp greeting he sent when booking
}

/** Clients only ask for an appointment; Jitu Bhaiya's timings are never fixed, so Haresh bhai / Shivani di call and assign a time.
 *  Backend: an appointment row with starts_at = NULL (api/migrations/0001_core.sql). */
export interface ApptRequest { id: string; personId: string; service: Service; kind: Kind; mode: Mode; preferred: string; note?: string; at: number }

export interface Message { id: string; from: 'client' | 'jb'; text: string; at: number }
export interface Thread { personId: string; messages: Message[]; readAt: number }

export interface Notice {
  id: string
  at: number
  kind: 'booked' | 'rescheduled' | 'feedback' | 'delivered' | 'payment' | 'checkin' | 'request' | 'message'
  text: string
  personId?: string
  seen?: boolean
}
