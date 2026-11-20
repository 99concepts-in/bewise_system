/**
 * @module   client-data
 * @owner    CLIENT
 * Purpose:  v5 "Blue Bloom" (HUB 2026-11-20, D-45) — accent colour + line icon for every feeling, so the same feeling
 *           wears the same colour on Home, in the intake and (later) on Jitendra Khimlani's Today timeline.
 *           Pure presentation: intake answer values (FEELINGS strings) and journal Emotion keys are unchanged.
 */
import type { Emotion } from './data'

export type Accent = 'marigold' | 'coral' | 'rose' | 'lilac' | 'teal' | 'sky' | 'navy'
/** spec §2 — 500 = circles/icons (white text ≥18 px bold except marigold), 100 = tints with ink text */
export const ACCENTS: Record<Accent, { c500: string; c100: string; onInk: boolean }> = {
  marigold: { c500: '#F2A93B', c100: '#FFF1D9', onInk: true }, // ink on marigold, never white
  coral: { c500: '#EE7F5F', c100: '#FFE6DE', onInk: false },
  rose: { c500: '#E06A8E', c100: '#FDE3EB', onInk: false },
  lilac: { c500: '#8E74DB', c100: '#EEE8FF', onInk: false },
  teal: { c500: '#2FA39A', c100: '#DDF4F1', onInk: false },
  sky: { c500: '#3E9BE6', c100: '#DFF0FF', onInk: false },
  navy: { c500: '#243D91', c100: '#E6EDFF', onInk: false },
}

/** Line-icon keys (public/img/feelings/<key>.svg — single colour, tinted with CSS mask). */
export type FeelingKey =
  | 'fear' | 'worry' | 'anxiety' | 'overthinking' | 'anger' | 'irritability' | 'sadness' | 'loneliness' | 'guilt'
  | 'low-confidence' | 'overwhelm' | 'indecision' | 'exhaustion' | 'grief' | 'shock' | 'jealousy' | 'hopelessness' | 'restlessness'

/** Intake feelings (FEELINGS strings in data.ts) → icon + accent. */
export const INTAKE_FEELING: Record<string, { icon: FeelingKey; accent: Accent }> = {
  Fear: { icon: 'fear', accent: 'coral' },
  Worry: { icon: 'worry', accent: 'sky' },
  Anxiety: { icon: 'anxiety', accent: 'coral' },
  Overthinking: { icon: 'overthinking', accent: 'rose' },
  Anger: { icon: 'anger', accent: 'coral' },
  Irritability: { icon: 'irritability', accent: 'marigold' },
  Sadness: { icon: 'sadness', accent: 'lilac' },
  Loneliness: { icon: 'loneliness', accent: 'sky' },
  Guilt: { icon: 'guilt', accent: 'rose' },
  'Low confidence': { icon: 'low-confidence', accent: 'lilac' },
  Overwhelm: { icon: 'overwhelm', accent: 'navy' },
  Indecision: { icon: 'indecision', accent: 'sky' },
  Exhaustion: { icon: 'exhaustion', accent: 'teal' },
  'Grief or loss': { icon: 'grief', accent: 'lilac' },
  Shock: { icon: 'shock', accent: 'coral' },
  Jealousy: { icon: 'jealousy', accent: 'teal' },
  Hopelessness: { icon: 'hopelessness', accent: 'navy' },
  Restlessness: { icon: 'restlessness', accent: 'marigold' },
}
export const intakeFeeling = (f: string) => INTAKE_FEELING[f] ?? { icon: 'worry' as FeelingKey, accent: 'navy' as Accent }

/**
 * Home "How are you feeling today?" — 6 circles, 3 lighter + 3 heavier. Each logs a journal Emotion (unchanged keys).
 * Pleasant moods have no traced line icon yet, so they use a lucide line icon (same 1.75 stroke look).
 */
export type HomeFeeling = { mood: Emotion; label: string; accent: Accent; icon: FeelingKey | 'sun' | 'leaf' | 'heart'; tip: string }
export const HOME_FEELINGS: HomeFeeling[] = [
  { mood: 'happy', label: 'Happy', accent: 'marigold', icon: 'sun', tip: 'Lovely. Notice one small thing that made today good.' },
  { mood: 'calm', label: 'Calm', accent: 'teal', icon: 'leaf', tip: 'Savour it. Three slow breaths help it stay a little longer.' },
  { mood: 'grateful', label: 'Grateful', accent: 'rose', icon: 'heart', tip: 'Beautiful. A quick note in your journal keeps this feeling close.' },
  { mood: 'anxious', label: 'Anxious', accent: 'coral', icon: 'anxiety', tip: 'Try breathing in for 4 and out for 6. You’re safe right now.' },
  { mood: 'sad', label: 'Low', accent: 'lilac', icon: 'sadness', tip: 'Be gentle with yourself today. A short walk or a warm drink can help.' },
  { mood: 'stressed', label: 'Stressed', accent: 'navy', icon: 'overwhelm', tip: 'Pick just one thing to do next. The rest can wait a little.' },
]
