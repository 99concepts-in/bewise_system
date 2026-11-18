/**
 * @module   client-data
 * @owner    CLIENT
 * @screens  CL-08 CL-09 CL-11 CL-14 CL-32…CL-35 IN-02…IN-12
 * Purpose:  Static/seed data for the standalone preview. Replaced by module calls once the foundation lands:
 *           consultation types → scheduling.listConsultationTypes, products → catalog.*, intake bank → intake.getIntakeForm.
 */
import type { FaceSpec } from '@/components/mood-face'

/** The 8 illustrated mood characters (design/assets/v4/mood-characters.png). */
export type MoodSprite = 'calm' | 'joyful' | 'grateful' | 'hopeful' | 'tired' | 'anxious' | 'sad' | 'irritated'

// @cross(HUB) extends the contract Emotion enum (8 values) — additive; request filed. Extra feelings reuse the closest
// character in their own colour until bespoke illustrations exist.
type MoodDef = { key: string; label: string; color: string; sprite: MoodSprite; filter?: string; pleasant: boolean; lift: number; words?: string }
const M = (key: string, label: string, color: string, sprite: MoodSprite, pleasant: boolean, lift: number, filter?: string, words?: string): MoodDef =>
  ({ key, label, color, sprite, pleasant, lift, filter, words })

export const MOODS = [
  // primary grid (8)
  M('happy', 'Happy', '#F7D774', 'joyful', true, 5, 'hue-rotate(-12deg) saturate(1.15)', 'glad good cheerful smile'),
  M('calm', 'Calm', '#B5D3B8', 'calm', true, 4.5, undefined, 'relaxed settled'),
  M('grateful', 'Grateful', '#F4C2C8', 'grateful', true, 5, undefined, 'thankful blessed'),
  M('hopeful', 'Hopeful', '#B9CBF2', 'hopeful', true, 4, undefined, 'optimistic'),
  M('tired', 'Tired', '#CFC2EE', 'tired', false, 2.5, undefined, 'sleepy exhausted drained'),
  M('anxious', 'Anxious', '#AFD6EE', 'anxious', false, 2, undefined, 'nervous uneasy'),
  M('sad', 'Sad', '#B7C3D6', 'sad', false, 1.5, undefined, 'down low unhappy blue'),
  M('irritated', 'Irritated', '#F2A797', 'irritated', false, 2, undefined, 'annoyed'),
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

/** Face for every feeling — round, expressive, BeWise palette (owner 2026-11-18). */
export const MOOD_FACES: Record<string, FaceSpec> = {
  happy: { eyes: 'happy', mouth: 'grin', extras: ['blush'] },
  calm: { eyes: 'closed', mouth: 'small', extras: ['blush'] },
  grateful: { eyes: 'closed', mouth: 'smile', extras: ['blush', 'heart'] },
  hopeful: { eyes: 'up', mouth: 'small', extras: ['sparkle'] },
  tired: { eyes: 'sleepy', mouth: 'flat', extras: ['zzz'] },
  anxious: { eyes: 'wide', mouth: 'wavy', brows: 'worried', extras: ['sweat'] },
  sad: { eyes: 'open', mouth: 'frown', brows: 'sad', extras: ['tear'] },
  irritated: { eyes: 'squint', mouth: 'flat', brows: 'angry' },
  joyful: { eyes: 'happy', mouth: 'grin', extras: ['blush', 'sparkle'] },
  excited: { eyes: 'star', mouth: 'grin', extras: ['blush', 'sparkle'] },
  loved: { eyes: 'heart', mouth: 'smile', extras: ['blush'] },
  peaceful: { eyes: 'closed', mouth: 'small' },
  relaxed: { eyes: 'closed', mouth: 'smile', extras: ['blush'] },
  content: { eyes: 'happy', mouth: 'small' },
  confident: { eyes: 'open', mouth: 'smirk', brows: 'raised' },
  proud: { eyes: 'closed', mouth: 'grin', extras: ['sparkle'] },
  motivated: { eyes: 'open', mouth: 'grin', brows: 'determined' },
  loving: { eyes: 'happy', mouth: 'smile', extras: ['blush', 'heart'] },
  worried: { eyes: 'open', mouth: 'smallfrown', brows: 'worried' },
  stressed: { eyes: 'squint', mouth: 'teeth', brows: 'worried', extras: ['sweat'] },
  scared: { eyes: 'wide', mouth: 'o', brows: 'worried' },
  overwhelmed: { eyes: 'tight', mouth: 'wavy', extras: ['sweat'] },
  bored: { eyes: 'sleepy', mouth: 'flat' },
  restless: { eyes: 'side', mouth: 'wavy' },
  lonely: { eyes: 'down', mouth: 'smallfrown', brows: 'sad' },
  hurt: { eyes: 'tight', mouth: 'frown', extras: ['tears'] },
  guilty: { eyes: 'down', mouth: 'wavy', brows: 'sad', extras: ['blush'] },
  angry: { eyes: 'squint', mouth: 'teeth', brows: 'angry' },
  frustrated: { eyes: 'tight', mouth: 'flat', brows: 'angry' },
  jealous: { eyes: 'side', mouth: 'smirk', brows: 'angry' },
  confused: { eyes: 'open', mouth: 'wavy', brows: 'raised', extras: ['question'] },
}

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
/** Client words as published in the owner's BeWise Holistic Wellness brochure (supplied 2026-11-18), quoted verbatim. */
export const TESTIMONIALS: { name: string; city?: string; quote: string; rating?: number }[] = [
  { name: 'Akshay Magnani', quote: 'His bach flower remedy, aroma therapy and consultation on important decisions of my life has literally helped me change my life. He has amazing intuitive skills.' },
  { name: 'Divya Solanki', quote: 'His bach flower and aroma therapy work like magic; drastic changes in my thoughts, goals and nature; in short, I received a life upgrade.' },
  { name: 'Khushboo Gurnani', quote: 'Jitendra Khimlani has the best Bach flower & aroma oils therapy. I’ve benefited drastically mentally. It gave me a sense of calm and sound sleep after I took the treatment.' },
]
/** BeWise contact from the brochure and remedy label. */
export const CONTACT = { whatsapp: '919054220952', whatsappLabel: '90542 20952', social: '@bewiseglobal' }
export const TESTIMONIALS_SOURCE = 'https://www.jitendrakhimlani.com'

/** In-person studio (owner 2026-11-18; CONTENT-CHECKLIST #7). */
const STUDIO_FULL = '102, Yogikrupa Apartment, 19/A, Nutan Bharat Society, Alkapuri, Vadodara, Gujarat 390007'
export const STUDIO = {
  name: 'BeWise studio',
  line1: '102, Yogikrupa Apartment',
  line2: '19/A, Nutan Bharat Society, Alkapuri',
  city: 'Vadodara, Gujarat 390007',
  short: 'Alkapuri, Vadodara',
  full: STUDIO_FULL,
  // Google Business listing "Be Wise Holistic Wellness" (owner's share link https://share.google/BrjgaRA5OBCBexeyK)
  mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Be Wise Holistic Wellness, ${STUDIO_FULL}`)}`,
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`Be Wise Holistic Wellness, ${STUDIO_FULL}`)}`,
  shareUrl: 'https://share.google/BrjgaRA5OBCBexeyK',
}

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
/** Intake feelings: the 9 most common first, the rest behind "More feelings" (owner 2026-11-18: less cluttered, with icons). */
export const FEELINGS_COMMON = ['Worry', 'Anxiety', 'Overthinking', 'Sadness', 'Exhaustion', 'Irritability', 'Fear', 'Overwhelm', 'Loneliness'] as const
const FEELING_MOOD: Record<string, string> = {
  Fear: 'scared', Worry: 'worried', Anxiety: 'anxious', Overthinking: 'stressed', Anger: 'angry', Irritability: 'irritated', Sadness: 'sad',
  Loneliness: 'lonely', Guilt: 'guilty', Overwhelm: 'overwhelmed', Indecision: 'confused', Exhaustion: 'tired', 'Grief or loss': 'hurt',
  Jealousy: 'jealous', Restlessness: 'restless',
}
const FEELING_CUSTOM: Record<string, { color: string; face: FaceSpec }> = {
  Shock: { color: '#C9D7F0', face: { eyes: 'wide', mouth: 'o', brows: 'raised' } },
  Hopelessness: { color: '#C3C9D9', face: { eyes: 'down', mouth: 'frown', brows: 'sad', extras: ['tear'] } },
  'Low confidence': { color: '#D8CFEA', face: { eyes: 'side', mouth: 'smallfrown', brows: 'worried' } },
}
export const feelingIcon = (f: string): { color: string; face: FaceSpec } => {
  if (FEELING_CUSTOM[f]) return FEELING_CUSTOM[f]
  const m = MOODS.find((x) => x.key === FEELING_MOOD[f]) ?? MOODS.find((x) => x.key === 'calm')!
  return { color: m.color, face: MOOD_FACES[m.key] ?? MOOD_FACES.calm }
}
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

// ---------- Shop: the owner's product range (Bewise Products Range.xlsx, 2026-11-18) ----------
// Copy is written as aromatherapy & wellbeing support only: no cure / treatment claims (DMR Act; owner rule "no medical claims").
export type Category = 'rollons' | 'sprays' | 'remedies' | 'bath' | 'care'
export type Intent = 'sleep' | 'abundance' | 'calm' | 'wellness' | 'protection' | 'beauty'
export type Product = {
  slug: string; name: string; tagline: string; format: 'Roll-on' | 'Spray' | 'Dropper' | 'Bath salt'
  category: Category; intents: Intent[]
  art: string; color: string; tint: [string, string]; wide?: boolean
  /** made for each client after a consultation: reorder only */
  personal?: 'dropper' | 'spray'
  soldOut?: boolean
  variants: { id: string; label: string; pricePaise: number; mrpPaise?: number }[]
  allergens: string[]; about: string; feel: string[]; ingredients: string; howTo: string; safety: string
}
const ROLL_HOW = 'Apply the roll-on to both palms and rub them together. Cup your hands over your nose and breathe in deeply through your nose. Repeat 3 to 4 times. Apply any remaining oil to the area your Bach expert recommends.'
const SPRAY_HOW = 'Gently spray around your body 3 to 4 times to refresh your aura. Use 2 to 3 times a day, or whenever you feel low, drained or in need of a lift.'
const SALT_HOW = 'Add 2 to 3 spoonfuls to warm water and enjoy a relaxing bath, or soak your feet for 15 to 20 minutes.'
const INGR = 'A blend of pure essential oils. The full ingredient list is printed on the label. If you have allergies, message us on WhatsApp before ordering.'
const OIL_SAFE = 'For external use only. Patch test on your inner arm first. Avoid eyes and broken skin. Keep away from children. If you are pregnant, nursing or under medical care, check with your doctor first.'
const MIST_SAFE = 'Do not spray on the face or near the eyes. Keep away from children and flames. If you are pregnant or nursing, check with your doctor first.'
const CARE = ' Aromatherapy supports comfort and wellbeing. It is not a medicine and does not replace your doctor’s care.'
const rollon = (slug: string, name: string, color: string, tint: [string, string], intents: Intent[], tagline: string, about: string, feel: string[], extra = ''): Product => ({
  slug: `${slug}-roll-on`, name, tagline, format: 'Roll-on', category: 'rollons', intents, art: `products/${slug}-rollon`, color, tint,
  variants: [{ id: `${slug}-roll-on-15`, label: '15 ml', pricePaise: 60000 }], allergens: [], about, feel, ingredients: INGR, howTo: ROLL_HOW, safety: OIL_SAFE + extra + CARE,
})
const aura = (slug: string, name: string, color: string, tint: [string, string], intents: Intent[], tagline: string, about: string, feel: string[], howTo = SPRAY_HOW): Product => ({
  slug: `${slug}-spray`, name, tagline, format: 'Spray', category: 'sprays', intents, art: `products/${slug}-spray`, color, tint,
  variants: [{ id: `${slug}-spray-100`, label: '100 ml', pricePaise: 120000 }], allergens: [], about, feel, ingredients: INGR, howTo, safety: MIST_SAFE + CARE,
})
export const PRODUCTS: Product[] = [
  rollon('abundance', 'Abundance', '#B58A3C', ['#fbf3dc', '#f7ecd7'], ['abundance'], 'For a positive, confident mindset',
    'A warm blend for days you want to feel motivated, focused and open to abundance. Make it part of your morning intention.', ['Positive', 'Confident', 'Motivated', 'Focused']),
  rollon('sleep', 'Sleep', '#24508F', ['#e7ecfa', '#efe9fb'], ['sleep', 'calm'], 'For a calm mind at bedtime',
    'A soothing blend to help you relax and settle into a peaceful bedtime routine.', ['Relaxed', 'Calm mind', 'Peaceful', 'Rested']),
  rollon('immutime', 'Immutime', '#3E8E3A', ['#e5efe2', '#eef5e6'], ['wellness'], 'Feel refreshed and balanced',
    'A fresh, revitalising blend to make part of your everyday wellness routine, for days you want to feel refreshed and balanced.', ['Refreshed', 'Balanced', 'Revitalised']),
  rollon('detox', 'Detox', '#D0723F', ['#fbeadf', '#fbf3dc'], ['wellness'], 'Light, fresh and renewed',
    'A bright blend for your cleanse and reset days, to help you feel fresh, light and well.', ['Fresh', 'Light', 'Renewed']),
  rollon('cough-cold', 'Cough & Cold', '#2E918E', ['#dff0ee', '#e7ecfa'], ['wellness'], 'A comforting aroma for the cold season',
    'A warm, comforting aromatic blend for the cold season, for cosy moments of rest when you feel under the weather.', ['Comforted', 'Cosy', 'Soothed'], ' Not a cough or cold medicine.'),
  rollon('diabetes', 'Diabetes', '#7A4E9F', ['#efe9fb', '#f4eef8'], ['wellness', 'calm'], 'A calm companion for your daily routine',
    'A gentle aromatherapy blend to complement your daily wellness routine and help you feel calm and steady. It does not lower or manage blood sugar.', ['Calm', 'Steady', 'Cared for'], ' Keep taking your medicines exactly as your doctor advises.'),
  rollon('bp', 'BP', '#B6475E', ['#fbe9ee', '#f8f1f4'], ['calm', 'wellness'], 'Unwind and ease everyday stress',
    'A calming blend to help you relax and ease everyday stress, for slower, steadier moments in your day. It does not lower blood pressure.', ['Calm', 'Relaxed', 'Unwound'], ' Keep taking your medicines exactly as your doctor advises.'),
  // owner 2026-11-18: Migraine Go Roll On, 15 ml, ₹600 (copy kept to aromatherapy comfort, no treatment claim)
  rollon('migraine-go', 'Migraine Go', '#7F6BC0', ['#efe9fb', '#e7ecfa'], ['calm', 'wellness'], 'Calm, cool comfort for tense days',
    'A soothing aromatherapy blend for moments of head tension and stress. Helps relax the mind, ease tension and bring a sense of freshness and well-being.', ['Soothed', 'Relaxed', 'Fresh'], ' Not a migraine or headache medicine. If headaches are frequent or severe, please see your doctor.'),
  aura('abundance', 'Abundance', '#B58A3C', ['#fbf3dc', '#f6efe4'], ['abundance'], 'Aura spray for an uplifting space',
    'An uplifting mist that creates a positive, bright atmosphere around you and in your space.', ['Uplifted', 'Positive', 'Bright']),
  aura('protection', 'Protection', '#7A4E9F', ['#efe9fb', '#eef1fb'], ['protection', 'calm'], 'Aura spray for grounding and calm',
    'A grounding mist for a sense of calm and personal protection. Many people use it to feel shielded from negativity and the evil eye.', ['Grounded', 'Calm', 'Shielded']),
  aura('aura', 'Aura', '#5B78B8', ['#e7ecfa', '#eef1fb'], ['protection', 'calm'], 'Refresh your energy',
    'A light mist to refresh your energy and help you feel lighter, calmer and more centred.', ['Lighter', 'Calmer', 'Centred']),
  aura('sleep', 'Sleep', '#24508F', ['#e7ecfa', '#efe9fb'], ['sleep'], 'Pillow & room spray',
    'A soothing aroma to help you unwind and drift into a peaceful night.', ['Unwound', 'Peaceful', 'Rested'],
    'Before bedtime, spray once on each collar of your shirt or t-shirt and 1 to 2 times on your pillow. Breathe slowly as you settle in.'),
  { slug: 'bach-remedy-dropper', name: 'Bach Flower Remedy', tagline: 'Your personal blend, dropper', format: 'Dropper', category: 'remedies', intents: ['calm'],
    art: 'products/bach-remedy-dropper', color: '#5E8F6A', tint: ['#e5efe2', '#f1f6ec'], personal: 'dropper',
    variants: [{ id: 'bach-remedy-dropper-30', label: '30 ml', pricePaise: 80000 }], allergens: [],
    about: 'A personalised blend of Bach flower essences, chosen by Jitu Bhaiya for how you feel. Your first blend comes with your consultation; reorder the same blend here anytime.',
    feel: ['Made for you', 'Gentle', 'Natural'], ingredients: 'Bach flower essences chosen for you by Jitu Bhaiya.',
    howTo: 'Take 4 drops, 4 times a day, directly or in any drink you like, or as your Bach expert suggests. A bottle lasts up to 25 days when taken regularly.',
    safety: 'An individual, customised remedy for personal use only. Store at room temperature, away from direct sunlight, and keep away from children. Bach flower remedies are a gentle, complementary practice for emotional balance, not a substitute for your doctor.' },
  { slug: 'bach-remedy-spray', name: 'Bach Remedy Spray', tagline: 'Your personal blend, spray', format: 'Spray', category: 'remedies', intents: ['calm'],
    art: 'products/bach-remedy-spray', color: '#5E8F6A', tint: ['#e5efe2', '#eef1fb'], personal: 'spray',
    variants: [{ id: 'bach-remedy-spray-30', label: '30 ml', pricePaise: 80000 }], allergens: [],
    about: 'Your personalised Bach flower blend in an easy spray, handy on the go. Available once Jitu Bhaiya has prepared your blend.',
    feel: ['Made for you', 'On the go', 'Gentle'], ingredients: 'Bach flower essences chosen for you by Jitu Bhaiya.',
    howTo: 'Spray directly into your mouth, 3 sprays per dose, 4 times a day, or as your Bach expert recommends.',
    safety: 'An individual, customised remedy for personal use only. Store at room temperature, away from direct sunlight, and keep away from children. Bach flower remedies are a gentle, complementary practice for emotional balance, not a substitute for your doctor.' },
  { slug: 'rescue-remedy', name: 'Rescue Remedy', tagline: 'For stressful moments', format: 'Spray', category: 'remedies', intents: ['calm'],
    art: 'products/rescue-remedy-spray', color: '#C7892E', tint: ['#fbf0dc', '#fbf3dc'],
    variants: [{ id: 'rescue-remedy-30', label: '30 ml', pricePaise: 80000 }], allergens: [],
    about: 'A classic Bach blend to help calm the mind and soothe your nerves in stressful moments, like exams, interviews or travel.',
    feel: ['Calm', 'Steady', 'Reassured'], ingredients: 'The classic five-flower Bach rescue blend.',
    howTo: 'Spray directly into your mouth, 3 sprays per dose, up to 4 times a day, or as your Bach expert recommends.',
    safety: 'A gentle, complementary practice for emotional balance, not a substitute for your doctor. If you are pregnant or nursing, check with your doctor first.' },
  { slug: 'hair-oil', name: 'Hair Oil', tagline: 'Nourish hair and scalp', format: 'Dropper', category: 'care', intents: ['beauty'],
    art: 'products/hair-oil', color: '#C7892E', tint: ['#fbf0dc', '#f6efe4'],
    variants: [{ id: 'hair-oil-30', label: '30 ml', pricePaise: 60000 }], allergens: [],
    about: 'A nourishing blend for your hair and scalp, for natural softness and shine.', feel: ['Nourished', 'Soft', 'Shiny'], ingredients: INGR,
    howTo: 'Warm a few drops between your fingertips and massage gently into your scalp. Leave for at least an hour, or overnight, then wash as usual.',
    safety: 'For external use only. Patch test first. Avoid eyes. Keep away from children.' },
  { ...aura('beauty', 'Beauty', '#C96A86', ['#fbe9ee', '#f8f1f4'], ['beauty'], 'Face & body mist',
    'A light, revitalising mist to refresh and nourish your skin through the day.', ['Refreshed', 'Glowing', 'Soft'],
    'Close your eyes and mist lightly over your face and body from about 20 cm. Use whenever your skin needs a refresh.'),
    category: 'care' as const, safety: 'Keep your eyes closed while misting. Patch test first. Stop use if any irritation appears.' },
  { slug: 'aura-bath-salt', name: 'Aura', tagline: 'Bath salt to cleanse your aura', format: 'Bath salt', category: 'bath', intents: ['protection', 'calm'],
    art: 'products/aura-bath-salt', color: '#5B78B8', tint: ['#e7ecfa', '#fbe9ee'],
    variants: [{ id: 'aura-bath-salt-200', label: '200 g', pricePaise: 50000 }], allergens: [],
    about: 'A soothing bath ritual to help cleanse your aura and leave you feeling light and renewed.', feel: ['Cleansed', 'Light', 'Renewed'],
    ingredients: 'Natural salts, dried flower petals and essential oils. Full list on the pack.', howTo: SALT_HOW, safety: 'For external use only. Do not use on broken skin. Not for eating. Keep away from children.' },
  { slug: 'abundance-bath-salt', name: 'Abundance', tagline: 'Bath salt for positivity and self-love', format: 'Bath salt', category: 'bath', intents: ['abundance'],
    art: 'products/abundance-bath-salt', color: '#B58A3C', tint: ['#fbf3dc', '#fbe9ee'],
    variants: [{ id: 'abundance-bath-salt-200', label: '200 g', pricePaise: 50000 }], allergens: [],
    about: 'A warm bath ritual to welcome abundance, positivity and self-love into your day.', feel: ['Positive', 'Abundant', 'Self-love'],
    ingredients: 'Natural salts, dried flower petals and essential oils. Full list on the pack.', howTo: SALT_HOW, safety: 'For external use only. Do not use on broken skin. Not for eating. Keep away from children.' },
  { slug: 'happiness-bath-salt', name: 'Happiness', tagline: 'Bath salt for a lighter, happier mood', format: 'Bath salt', category: 'bath', intents: ['calm'],
    art: 'products/happiness-bath-salt', color: '#C7892E', tint: ['#fbf3dc', '#fbf0dc'], soldOut: true,
    variants: [{ id: 'happiness-bath-salt-200', label: '200 g', pricePaise: 50000 }], allergens: [],
    about: 'A sunny bath ritual to lift your mood and invite a little more joy into your day.', feel: ['Joyful', 'Light', 'Uplifted'],
    ingredients: 'Natural salts, dried flower petals and essential oils. Full list on the pack.', howTo: SALT_HOW, safety: 'For external use only. Do not use on broken skin. Not for eating. Keep away from children.' },
]
/** Product line name as shown on cards: "Abundance" + "Roll-on" etc. */
export const productTitle = (p: Product) => (p.category === 'remedies' || p.category === 'care' && p.format === 'Dropper' ? p.name : `${p.name} ${p.format === 'Bath salt' ? 'Bath Salt' : p.format === 'Roll-on' ? 'Roll-on' : p.slug === 'beauty-spray' ? 'Mist' : 'Spray'}`)
export const CATEGORIES: { key: Category | 'consult'; label: string; sub: string; tint: string; art: string[] }[] = [
  { key: 'rollons', label: 'Roll-on oils', sub: '8 blends', tint: '#e7ecfa', art: ['products/sleep-rollon', 'products/abundance-rollon', 'products/immutime-rollon'] },
  { key: 'sprays', label: 'Aura sprays', sub: '4 mists', tint: '#efe9fb', art: ['products/protection-spray', 'products/aura-spray'] },
  { key: 'remedies', label: 'Bach remedies', sub: 'Made for you', tint: '#e5efe2', art: ['products/bach-remedy-dropper', 'products/rescue-remedy-spray'] },
  { key: 'bath', label: 'Bath salts', sub: '3 rituals', tint: '#fbe9ee', art: ['products/aura-bath-salt', 'products/abundance-bath-salt'] },
  { key: 'care', label: 'Hair & beauty', sub: 'Oil & mist', tint: '#fbf0dc', art: ['products/hair-oil', 'products/beauty-spray'] },
  { key: 'consult', label: 'Consultation', sub: 'With Jitu Bhaiya', tint: '#f1ece4', art: [] },
]
export const INTENTS: { key: Intent; label: string; emoji: string; tint: string; line: string }[] = [
  { key: 'sleep', label: 'Sleep', emoji: '🌙', tint: '#e7ecfa', line: 'Wind down gently' },
  { key: 'calm', label: 'Calm', emoji: '🍃', tint: '#e5efe2', line: 'Ease everyday stress' },
  { key: 'abundance', label: 'Abundance', emoji: '✨', tint: '#fbf3dc', line: 'Positive and confident' },
  { key: 'protection', label: 'Protection', emoji: '🛡️', tint: '#efe9fb', line: 'Grounded and shielded' },
  { key: 'wellness', label: 'Wellness', emoji: '🌿', tint: '#dff0ee', line: 'Fresh and balanced' },
  { key: 'beauty', label: 'Beauty', emoji: '🌸', tint: '#fbe9ee', line: 'Hair and skin care' },
]
export const productBySlug = (s: string) => PRODUCTS.find((p) => p.slug === s)
export const variantById = (id: string) => {
  for (const p of PRODUCTS) { const v = p.variants.find((x) => x.id === id); if (v) return { product: p, variant: v } }
  return undefined
}
export const REORDER_PRICE_PAISE = 80000 // owner sheet 2026-11-18: Bach Flower Remedy 30 ml ₹800 (dropper or spray)

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

/** Session feedback — "How do you feel after the session?" in the client's own words (consultant request §2). Shown to
 * Jitu Bhaiya as "What people said they felt" — never as a BeWise claim. */
export const BENEFITS = ['Calmer', 'Felt heard', 'Sleeping better', 'Lighter', 'Clearer mind', 'More confident', 'Less anxious', 'More hopeful', 'More patient', 'More energy', 'At peace', 'More connected']

export const HELPLINES = [
  { name: 'Tele-MANAS', number: '14416', note: 'Free, confidential, 24×7' }, // @decision(D-38) verify before launch
  { name: 'Emergency', number: '112', note: 'If you are in immediate danger' },
]
