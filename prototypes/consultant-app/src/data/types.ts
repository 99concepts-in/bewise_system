/**
 * @module   prototype/consultant-app
 * @owner    CONSULTANT
 * @screens  CN-03, CN-12, CN-13, CN-14, CN-16, CN-26
 * Purpose:  Domain types for the consultant prototype (demo data only — real data comes from src/modules/* later).
 */
export type Mode = 'online' | 'in_person'
export type Kind = 'first' | 'followup'
export type Mood = 'calm' | 'joyful' | 'grateful' | 'hopeful' | 'tired' | 'anxious' | 'sad' | 'irritated'
export type ApptStatus = 'awaiting_payment' | 'confirmed' | 'in_session' | 'completed' | 'no_show'
export type RemedyStage = 'given' | 'preparing' | 'dispatched' | 'delivered'

export interface Person {
  id: string
  name: string
  first: string
  pronoun: 'she' | 'he'
  city: string
  phone: string
  joinedAt: number
  moods: { day: number; mood: Mood }[] // journal entries (shared with him), newest last
  checkin?: { at: number; better: string[]; same: string[]; harder: string[] }
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
  followUpWeeks?: number
}

export interface Notice {
  id: string
  at: number
  kind: 'booked' | 'rescheduled' | 'feedback' | 'delivered' | 'payment' | 'checkin'
  text: string
  personId?: string
  seen?: boolean
}
