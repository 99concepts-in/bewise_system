/**
 * @module   client-data
 * @owner    CLIENT
 * @screens  CL-08 CL-09 CL-11 CL-14 CL-32…CL-35 IN-02…IN-12
 * Purpose:  Static/seed data for the standalone preview. Replaced by module calls once the foundation lands:
 *           consultation types → scheduling.listConsultationTypes, products → catalog.*, intake bank → intake.getIntakeForm.
 */
/** The 8 illustrated mood characters (design/assets/v4/mood-characters.png). */
export type MoodSprite = 'calm' | 'joyful' | 'grateful' | 'hopeful' | 'tired' | 'anxious' | 'sad' | 'irritated'

// @cross(HUB) extends the contract Emotion enum (8 values) — additive; request filed. Extra feelings reuse the closest
// character in their own colour until bespoke illustrations exist.
type MoodDef = { key: string; label: string; color: string; sprite: MoodSprite; filter?: string; pleasant: boolean; lift: number; words?: string }
const M = (key: string, label: string, color: string, sprite: MoodSprite, pleasant: boolean, lift: number, filter?: string, words?: string): MoodDef =>
  ({ key, label, color, sprite, pleasant, lift, filter, words })

export const MOODS = [
  // primary grid (8)
  M('happy', 'Happy', '#F6DE8D', 'joyful', true, 5, 'hue-rotate(-12deg) saturate(1.15)', 'glad good cheerful smile'),
  M('calm', 'Calm', '#BFD8C2', 'calm', true, 4.5, undefined, 'relaxed settled'),
  M('grateful', 'Grateful', '#F4C2C8', 'grateful', true, 5, undefined, 'thankful blessed'),
  M('hopeful', 'Hopeful', '#B9CBF2', 'hopeful', true, 4, undefined, 'optimistic'),
  M('tired', 'Tired', '#D6CBEF', 'tired', false, 2.5, undefined, 'sleepy exhausted drained'),
  M('anxious', 'Anxious', '#BFE0F2', 'anxious', false, 2, undefined, 'nervous uneasy'),
  M('sad', 'Sad', '#C3CCD8', 'sad', false, 1.5, undefined, 'down low unhappy blue'),
  M('irritated', 'Irritated', '#F3B1A4', 'irritated', false, 2, undefined, 'annoyed'),
  // more feelings (searchable)
  M('joyful', 'Joyful', '#F6DE8D', 'joyful', true, 5, undefined, 'delighted'),
  M('excited', 'Excited', '#F7C98B', 'joyful', true, 5, 'hue-rotate(-28deg) saturate(1.35)', 'thrilled eager'),
  M('loved', 'Loved', '#F2A9B8', 'grateful', true, 5, 'saturate(1.35) hue-rotate(-8deg)', 'cared for affection'),
  M('peaceful', 'Peaceful', '#C9E2D2', 'calm', true, 4.5, 'hue-rotate(18deg) brightness(1.04)', 'serene still'),
  M('relaxed', 'Relaxed', '#CFE4C4', 'calm', true, 4.5, 'hue-rotate(-18deg)', 'at ease'),
  M('content', 'Content', '#DCE5BE', 'calm', true, 4.5, 'hue-rotate(-42deg) saturate(1.1)', 'satisfied okay fine'),
  M('confident', 'Confident', '#AFC3F0', 'hopeful', true, 4.5, 'saturate(1.3) hue-rotate(-10deg)', 'strong sure'),
  M('proud', 'Proud', '#C4B8F0', 'hopeful', true, 4.5, 'hue-rotate(30deg)', 'accomplished'),
  M('motivated', 'Motivated', '#F5D27A', 'joyful', true, 4.5, 'saturate(1.25)', 'energised driven focused'),
  M('loving', 'Loving', '#F4B6C2', 'grateful', true, 5, 'hue-rotate(-16deg)', 'kind warm'),
  M('worried', 'Worried', '#BFD6F2', 'anxious', false, 2, 'hue-rotate(12deg)', 'concerned'),
  M('stressed', 'Stressed', '#B8CFEA', 'anxious', false, 1.8, 'hue-rotate(24deg) saturate(1.15)', 'pressure tense'),
  M('scared', 'Scared', '#C6D3EE', 'anxious', false, 1.8, 'hue-rotate(38deg) saturate(.85)', 'afraid fear panic'),
  M('overwhelmed', 'Overwhelmed', '#CBC0EC', 'tired', false, 1.8, 'hue-rotate(-14deg) saturate(1.2)', 'too much burdened'),
  M('bored', 'Bored', '#DAD3E8', 'tired', false, 2.5, 'saturate(.7)', 'flat meh'),
  M('restless', 'Restless', '#D9C6EA', 'tired', false, 2.2, 'hue-rotate(14deg)', 'unsettled cannot sleep'),
  M('lonely', 'Lonely', '#BCC7D9', 'sad', false, 1.5, 'hue-rotate(12deg)', 'alone isolated'),
  M('hurt', 'Hurt', '#CBC4D6', 'sad', false, 1.5, 'hue-rotate(40deg)', 'pain upset'),
  M('guilty', 'Guilty', '#C9CDD6', 'sad', false, 1.8, 'saturate(.6)', 'ashamed sorry'),
  M('angry', 'Angry', '#F09C8E', 'irritated', false, 1.5, 'saturate(1.3) hue-rotate(-6deg)', 'mad furious'),
  M('frustrated', 'Frustrated', '#F2B795', 'irritated', false, 1.8, 'hue-rotate(14deg)', 'stuck fed up'),
  M('jealous', 'Jealous', '#DCC3A0', 'irritated', false, 2, 'hue-rotate(38deg) saturate(.8)', 'envious'),
  M('confused', 'Confused', '#C8D9E8', 'hopeful', false, 2.5, 'hue-rotate(-24deg) saturate(.8)', 'unsure lost'),
] as const satisfies readonly MoodDef[]

export type Emotion = (typeof MOODS)[number]['key']
export const PRIMARY_MOODS: Emotion[] = ['happy', 'calm', 'grateful', 'hopeful', 'tired', 'anxious', 'sad', 'irritated']
export const QUICK_MOODS: Emotion[] = ['happy', 'calm', 'tired', 'anxious', 'sad']
const FALLBACK = MOODS[1]
export const moodOf = (k: string): MoodDef => (MOODS as readonly MoodDef[]).find((m) => m.key === k) ?? FALLBACK
/** for charts: higher = lighter day (used only to give the daily bars a shape, never shown as a score) */
export const MOOD_LIFT = Object.fromEntries(MOODS.map((m) => [m.key, m.lift])) as Record<Emotion, number>
export const searchMoods = (q: string) => {
  const s = q.trim().toLowerCase()
  if (!s) return [] as MoodDef[]
  return (MOODS as readonly MoodDef[]).filter((m) => m.label.toLowerCase().includes(s) || (m.words ?? '').includes(s))
}

// @decision(D-09) @decision(D-02) fees include the remedy blend
export const CONSULTATIONS = [
  // minutes = calendar-block length only (never shown — owner 2026-11-18)
  { id: 'first', name: 'First consultation', minutes: 60, feePaise: 100000,
    blurb: 'A gentle, unhurried conversation about how you’ve been feeling.' },
  { id: 'followup', name: 'Follow-up', minutes: 30, feePaise: 80000,
    blurb: 'See how you’re doing and refresh your blend.' },
] as const
export type ConsultationId = (typeof CONSULTATIONS)[number]['id']

/**
 * Client testimonials (CONTENT-CHECKLIST #1). REAL quotes only, each with the client's written consent to publish.
 * Never invent or edit meaning. No cure / medical claims in quotes. Shown in the booking screen's "Client stories" sheet.
 * e.g. { name: 'Monika', city: 'Vadodara', quote: '…', rating: 5 }
 */
export const TESTIMONIALS: { name: string; city?: string; quote: string; rating?: number }[] = []
export const TESTIMONIALS_SOURCE = 'https://www.jitendrakhimlani.com'

export const CONSULTANT = {
  name: 'Jitu Bhaiya',
  fullName: 'Jitendra Khimlani',
  title: 'Bach Remedy Therapist',
  approach: 'Jitu Bhaiya listens first. Then he prepares a blend of Bach flower essences chosen for how you feel.',
  stats: ['12+ years of workshops', '2,00,000+ people guided'],
  website: 'https://www.jitendrakhimlani.com',
}

// ---------- Intake bank (client-facing wording only — the statement→flower mapping stays with CONSULTANT) ----------
export const FEELINGS = [
  'Fear', 'Worry', 'Anxiety', 'Overthinking', 'Anger', 'Irritability', 'Sadness', 'Loneliness', 'Guilt', 'Low confidence',
  'Overwhelm', 'Indecision', 'Exhaustion', 'Grief or loss', 'Shock', 'Jealousy', 'Hopelessness', 'Restlessness',
] as const
export const NUANCE: Record<string, string[]> = {
  Fear: ['Fear of specific things (exams, illness, travel, people)', 'A vague fear of the unknown', 'Sudden panic', 'Fear of losing control', 'Worry for my loved ones'],
  Worry: ['Constant worry for my loved ones', 'Hard on myself; very strict standards'],
  Anxiety: ['A vague fear of the unknown', 'Sudden panic', 'Fear of specific things (exams, illness, travel, people)'],
  Overthinking: ['The same thoughts go round and round', 'I keep making the same mistakes'],
  Anger: ['Quick to get impatient', 'Jealousy, envy or suspicion', 'Bitterness, “why me?”', 'Critical of others', 'A need to be in control'],
  Irritability: ['Quick to get impatient', 'Critical of others'],
  Sadness: ['Heavy gloom for no clear reason', 'Discouraged after a setback'],
  Loneliness: ['I prefer to be alone; others find me distant', 'I can’t bear being alone', 'I need to be needed'],
  Guilt: ['I blame myself, even for others’ mistakes', 'Disliking something about myself'],
  'Low confidence': ['I expect to fail, so I don’t try', 'I can’t say no; I please others', 'I doubt my own judgement'],
  Overwhelm: ['Overwhelmed by responsibilities', 'Trying too hard; can’t relax'],
  Indecision: ['Can’t decide between two choices', 'I doubt my judgement and keep asking others', 'Unsure what to do with my life'],
  Exhaustion: ['Completely drained after a long effort', 'Tasks feel too heavy to start', 'I keep pushing on even when exhausted'],
  'Grief or loss': ['Shock or grief I haven’t recovered from', 'Living in the past; nostalgic'],
  Shock: ['A recent shock'],
  Jealousy: ['Jealousy, envy or suspicion'],
  Hopelessness: ['I’ve given up hope', 'At the very end of what I can bear'],
  Restlessness: ['Hiding worries behind a cheerful face', 'Daydreaming; not really “here”'],
}
export const BODY_AREAS = ['Head', 'Neck', 'Shoulders', 'Upper back', 'Lower back', 'Chest', 'Stomach', 'Joints', 'Skin', 'Other'] as const
export const LIFE_CHANGES: { label: string; mood: Emotion }[] = [
  { label: 'New job or role', mood: 'calm' }, { label: 'Relationship', mood: 'joyful' }, { label: 'Loss of someone close', mood: 'grateful' },
  { label: 'Moving home', mood: 'tired' }, { label: 'Exams', mood: 'hopeful' }, { label: 'Health', mood: 'calm' },
  { label: 'Money worries', mood: 'sad' }, { label: 'New baby', mood: 'grateful' }, { label: 'Retirement', mood: 'hopeful' },
]
export const GOAL_FEELINGS = ['Calm', 'Confident', 'Rested', 'Clear-minded', 'Hopeful', 'Connected', 'Patient', 'Lighter', 'Free', 'Focused'] as const

// ---------- Shop (seeded placeholders until the owner's list arrives 2026-11-18) ----------
export type Product = {
  slug: string; name: string; tagline: string; type: 'Oil' | 'Spray' | 'Salt'
  collection: 'sleep' | 'calm' | 'bath' | 'gifts'
  art: 'p-dropper' | 'p-spray' | 'p-salt'; accent?: 'f-rose' | 'f-mimulus'
  tint: [string, string]
  variants: { id: string; label: string; pricePaise: number; mrpPaise?: number }[]
  allergens: string[]; about: string; ingredients: string; howTo: string; safety: string
}
export const PRODUCTS: Product[] = [
  { slug: 'sleep-oil', name: 'Sleep Oil', tagline: 'Aromatherapy blend for restful evenings', type: 'Oil', collection: 'sleep', art: 'p-dropper', accent: 'f-rose',
    tint: ['#efe9fb', '#f8f1f4'], variants: [{ id: 'sleep-oil-10', label: '10 ml', pricePaise: 39000 }, { id: 'sleep-oil-30', label: '30 ml', pricePaise: 65000, mrpPaise: 75000 }],
    allergens: ['lavender'], about: 'A calming blend for your evening wind-down. A few drops on your pillow or wrists as part of a slow, quiet routine.',
    ingredients: 'Lavender, Roman chamomile and cedarwood essential oils in a sweet almond carrier.', howTo: 'Massage 3–4 drops into wrists and temples, or add 2 drops to your pillow 20 minutes before bed.',
    safety: 'For external use only. Patch-test first. Avoid eyes. Not recommended during pregnancy without advice from your doctor.' },
  { slug: 'abundance-oil', name: 'Abundance Oil', tagline: 'A warm, uplifting morning ritual', type: 'Oil', collection: 'calm', art: 'p-dropper', accent: 'f-mimulus',
    tint: ['#fbf3dc', '#f6efe4'], variants: [{ id: 'abundance-oil-30', label: '30 ml', pricePaise: 65000 }],
    allergens: ['citrus'], about: 'Bright and grounding — many people enjoy it as part of a morning intention-setting moment.',
    ingredients: 'Sweet orange, frankincense and patchouli essential oils in jojoba.', howTo: 'Warm 2–3 drops between your palms, breathe in slowly three times.',
    safety: 'Citrus oils can make skin sensitive to sunlight — avoid sun on applied skin for 12 hours.' },
  { slug: 'abundance-spray', name: 'Abundance Spray', tagline: 'Room & aura mist', type: 'Spray', collection: 'calm', art: 'p-spray', accent: 'f-mimulus',
    tint: ['#f8f1dc', '#eef1fb'], variants: [{ id: 'abundance-spray-100', label: '100 ml', pricePaise: 45000 }],
    allergens: ['citrus'], about: 'A light mist to freshen your space before you begin your day.', ingredients: 'Purified water, sweet orange and frankincense essential oils.',
    howTo: 'Shake, then mist 3–4 times into the air above you.', safety: 'Do not spray on face or near eyes.' },
  { slug: 'aura-spray', name: 'Aura Spray', tagline: 'A soft, floral reset', type: 'Spray', collection: 'calm', art: 'p-spray', accent: 'f-rose',
    tint: ['#fbeef1', '#eef1fb'], variants: [{ id: 'aura-spray-100', label: '100 ml', pricePaise: 45000 }],
    allergens: ['rose'], about: 'A gentle floral mist for a calm pause between tasks.', ingredients: 'Purified water, rose and geranium essential oils.',
    howTo: 'Mist 3–4 times around you and take three slow breaths.', safety: 'Do not spray on face or near eyes.' },
  { slug: 'bath-salt', name: 'Bath Salt', tagline: 'Himalayan pink salt soak', type: 'Salt', collection: 'bath', art: 'p-salt',
    tint: ['#fbecec', '#f6efe4'], variants: [{ id: 'bath-salt-250', label: '250 g', pricePaise: 55000 }],
    allergens: ['lavender'], about: 'A slow, warm soak for the end of a long day.', ingredients: 'Himalayan pink salt, Epsom salt, lavender essential oil.',
    howTo: 'Dissolve two handfuls in a warm bath and soak for 20 minutes.', safety: 'Avoid if you have broken skin.' },
  { slug: 'aura-salt', name: 'Aura Salt', tagline: 'Cleansing salt for your space', type: 'Salt', collection: 'gifts', art: 'p-salt', accent: 'f-rose',
    tint: ['#eef1fb', '#fbeef1'], variants: [{ id: 'aura-salt-250', label: '250 g', pricePaise: 55000 }],
    allergens: [], about: 'A small bowl of salt for your desk or bedside — a quiet reminder to pause.', ingredients: 'Rock salt, dried rose petals.',
    howTo: 'Place a small bowl in your space; refresh weekly.', safety: 'Not for consumption. Keep away from children and pets.' },
]
export const COLLECTIONS = [
  { key: 'sleep', label: 'Sleep', img: 'cat-sleep', tint: '#ece7fb' },
  { key: 'calm', label: 'Calm', img: 'cat-calm', tint: '#e5efe2' },
  { key: 'bath', label: 'Bath', img: 'cat-bath', tint: '#fbe9ee' },
  { key: 'remedies', label: 'Remedies', img: 'cat-remedies', tint: '#fbf0dc' },
  { key: 'gifts', label: 'Gifts', img: 'cat-gifts', tint: '#e7ecfa' },
  { key: 'consult', label: 'Consultation', img: 'cat-consult', tint: '#f1ece4' },
] as const
export const productBySlug = (s: string) => PRODUCTS.find((p) => p.slug === s)
export const variantById = (id: string) => {
  for (const p of PRODUCTS) { const v = p.variants.find((x) => x.id === id); if (v) return { product: p, variant: v } }
  return undefined
}
export const REORDER_PRICE_PAISE = 65000 // @decision(D-02) remedy.reorder_price — owner to set

// ---------- Slots (stub for scheduling.getAvailableSlots) ----------
const BASE_SLOTS = ['10:00', '11:00', '12:00', '14:00', '15:30', '17:00', '18:30']
/** A wall-clock time at the studio (IST, UTC+5:30) on the given calendar day — independent of the device's timezone. */
export function istDate(day: Date, hhmm: string) {
  const ymd = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
  return new Date(`${ymd}T${hhmm}:00+05:30`)
}
export function slotsFor(date: Date): string[] {
  if (date.getDay() === 0) return [] // Sunday off
  const seed = date.getFullYear() * 400 + date.getMonth() * 31 + date.getDate()
  const now = Date.now()
  return BASE_SLOTS.filter((t, i) => {
    if ((seed * 7 + i * 13) % 5 === 0) return false // some already booked
    return istDate(date, t).getTime() - now > 3 * 3600_000
  })
}

export const HELPLINES = [
  { name: 'Tele-MANAS', number: '14416', note: 'Free, confidential, 24×7' }, // @decision(D-38) verify before launch
  { name: 'Emergency', number: '112', note: 'If you are in immediate danger' },
]
