/**
 * @module   prototype/consultant-app
 * @owner    CONSULTANT
 * Purpose:  Deterministic demo data generated relative to "now", so every state (done / now / next / quiet) is real.
 *           Names, quotes and numbers are illustrative only.
 */
import type { Appt, ApptRequest, Kind, Mode, Mood, Notice, Person, Service, Staff, Thread } from './types'

export const FLOWERS = [
  'Agrimony', 'Aspen', 'Beech', 'Centaury', 'Cerato', 'Cherry Plum', 'Chestnut Bud', 'Chicory', 'Clematis',
  'Crab Apple', 'Elm', 'Gentian', 'Gorse', 'Heather', 'Holly', 'Honeysuckle', 'Hornbeam', 'Impatiens', 'Larch',
  'Mimulus', 'Mustard', 'Oak', 'Olive', 'Pine', 'Red Chestnut', 'Rock Rose', 'Rock Water', 'Scleranthus',
  'Star of Bethlehem', 'Sweet Chestnut', 'Vervain', 'Vine', 'Walnut', 'Water Violet', 'White Chestnut',
  'Wild Oat', 'Wild Rose', 'Willow', 'Rescue Remedy',
]
/** One-line Bach description per flower (draft, pending Jitu Bhaiya's approval — D-10). Shown as the reason. */
export const FLOWER_NOTE: Record<string, string> = {
  Agrimony: 'worries hidden behind a cheerful face', Aspen: 'vague fear without a clear reason', Beech: 'critical, intolerant of others',
  Centaury: "can't say no, pleases others", Cerato: 'doubts own judgement', 'Cherry Plum': 'fear of losing control',
  'Chestnut Bud': 'repeating the same mistakes', Chicory: 'possessive, needs to be needed', Clematis: 'daydreaming, not present',
  'Crab Apple': 'feels unclean, dislikes something about self', Elm: 'overwhelmed by responsibility', Gentian: 'discouraged after a setback',
  Gorse: 'has given up hope', Heather: "can't bear being alone", Holly: 'jealousy, anger, suspicion', Honeysuckle: 'living in the past',
  Hornbeam: 'Monday-morning heaviness', Impatiens: 'impatient, quick to irritate', Larch: 'expects to fail', Mimulus: 'fear of known things',
  Mustard: 'gloom with no clear cause', Oak: 'keeps going past exhaustion', Olive: 'drained after long effort', Pine: 'guilt, self-blame',
  'Red Chestnut': 'worry for loved ones', 'Rock Rose': 'panic, terror', 'Rock Water': 'hard on self, strict standards',
  Scleranthus: "can't decide between two", 'Star of Bethlehem': 'shock or grief', 'Sweet Chestnut': 'at the end of what they can bear',
  Vervain: 'over-enthusiastic, can\'t switch off', Vine: 'needs to control', Walnut: 'big life change', 'Water Violet': 'withdrawn, prefers to be alone',
  'White Chestnut': 'same thoughts going round', 'Wild Oat': 'unsure of life direction', 'Wild Rose': 'resigned, apathetic', Willow: 'resentment, "why me?"',
  'Rescue Remedy': 'acute stress',
}
export const CONCERNS = [
  'Anxiety', 'Fear', 'Overthinking', 'Sadness', 'Loneliness', 'Anger', 'Insecurity', 'Exhaustion', 'Grief',
  'Indecision', 'Overwhelm', 'Guilt',
]
export const CONCERN_FLOWERS: Record<string, string[]> = {
  Anxiety: ['Aspen', 'Mimulus', 'Red Chestnut'], Fear: ['Mimulus', 'Rock Rose', 'Aspen'],
  Overthinking: ['White Chestnut', 'Vervain'], Sadness: ['Mustard', 'Gentian'], Loneliness: ['Heather', 'Water Violet'],
  Anger: ['Holly', 'Impatiens', 'Willow'], Insecurity: ['Larch', 'Cerato', 'Centaury'], Exhaustion: ['Olive', 'Hornbeam', 'Oak'],
  Grief: ['Star of Bethlehem', 'Honeysuckle'], Indecision: ['Scleranthus', 'Wild Oat'], Overwhelm: ['Elm', 'Vervain'],
  Guilt: ['Pine', 'Crab Apple'],
}
/** Feedback tags a client can pick after a session (CL-23) — their words, never a claim by BeWise. */
export const BENEFITS = ['Calmer', 'Felt heard', 'Sleeping better', 'Lighter', 'Clearer mind', 'More confident', 'Less anxious', 'More hopeful', 'More patient', 'More energy', 'At peace', 'More connected']
const CONCERN_BENEFITS: Record<string, string[]> = {
  Anxiety: ['Calmer', 'Less anxious', 'Sleeping better'], Fear: ['Less anxious', 'More confident'], Overthinking: ['Clearer mind', 'Sleeping better', 'Calmer'],
  Sadness: ['Lighter', 'More hopeful'], Loneliness: ['Felt heard', 'More connected'], Anger: ['More patient', 'Calmer'],
  Insecurity: ['More confident'], Exhaustion: ['More energy', 'Sleeping better'], Grief: ['At peace', 'Felt heard', 'Lighter'],
  Indecision: ['Clearer mind', 'More confident'], Overwhelm: ['Calmer', 'Lighter'], Guilt: ['Lighter', 'At peace'],
}
const FEMALE = ['Priya', 'Ananya', 'Kavya', 'Meera', 'Nisha', 'Heena', 'Pooja', 'Riya', 'Sneha', 'Aditi', 'Tanvi', 'Zoya',
  'Simran', 'Jasmine', 'Ishita', 'Khushi', 'Bhavna', 'Dimple', 'Hetal', 'Komal', 'Mansi', 'Nidhi', 'Rupal', 'Shreya',
  'Trupti', 'Urvi', 'Vaishali', 'Yashvi', 'Aarti', 'Devanshi', 'Falguni', 'Gauri', 'Jinal', 'Krupa', 'Leena', 'Payal']
const MALE = ['Rohan', 'Dhruv', 'Arjun', 'Ishaan', 'Karan', 'Vikram', 'Neel', 'Farhan', 'Harsh', 'Jay', 'Kunal', 'Manan',
  'Parth', 'Raj', 'Sagar', 'Tejas', 'Utsav', 'Viraj', 'Yash', 'Aakash', 'Chirag', 'Deep', 'Gaurav', 'Hitesh']
const LAST = ['Shah', 'Mehta', 'Rao', 'Patel', 'Desai', 'Joshi', 'Trivedi', 'Bhatt', 'Parikh', 'Modi', 'Vyas', 'Pandya',
  'Iyer', 'Malhotra', 'Kulkarni', 'Chauhan', 'Gandhi', 'Thakkar', 'Khan', 'Sheikh', 'Kaur', "D'Souza", 'Soni', 'Dave',
  'Raval', 'Amin', 'Nair', 'Kapoor', 'Jain', 'Doshi']
const CITIES = ['Vadodara', 'Vadodara', 'Vadodara', 'Vadodara', 'Ahmedabad', 'Ahmedabad', 'Surat', 'Anand', 'Rajkot',
  'Mumbai', 'Pune', 'Bengaluru', 'Dubai', 'London']
const NOTES = [
  'Sleep is better, but still anxious about the project deadline.',
  'My exams start next month and I freeze when I sit to study.',
  'Since Papa passed, evenings are the hardest.',
  'I keep saying yes to everyone at work and I am tired.',
  'Feeling much calmer. Want to talk about the next step.',
  'Arguments at home have reduced. Still get angry quickly.',
  'New city, new job. Everything feels too much right now.',
  'Booking for my daughter (11). She is scared of school.',
  'I want to stop overthinking every small decision.',
  'The drops are going well. A few heavy days this week.',
]
export const KIND_WORDS = [
  'Felt lighter walking out of the session than I have in months.',
  'He listened without rushing me. First time I felt heard.',
  'I finally said no at work without feeling guilty.',
  'Calmer mornings this week. My family noticed before I did.',
  'Thank you for the patience with all my questions.',
  'My daughter reminds me about her drops every morning.',
  'I could talk about Papa today without breaking down.',
  'Small steps, but I am sleeping on time again.',
  'Clear, kind and practical. Exactly what I needed.',
  'I left with a plan instead of a knot in my stomach.',
]
const FEEDBACK_OK = ['Good session, a lot to think about.', 'Helpful, would like a longer follow-up next time.', 'Nice talk.']

export const HOUR = 3_600_000
export const DAY = 24 * HOUR
export const MIN = 60_000

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function startOfDay(t: number) { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime() }

export interface Seed { people: Person[]; appts: Appt[]; notices: Notice[]; requests: ApptRequest[]; threads: Thread[] }
type Draft = Omit<Appt, 'service'> & { service?: Service }

/** Notes Jitu Bhaiya writes after a Scanning session (demo, illustrative wording — no diagnosis). */
const SCAN_NOTES = [
  'Energy low and scattered today. Shoulders and jaw holding stress. Suggested 10 minutes of slow breathing before sleep.',
  'Much steadier than last time. Sleep pattern improving. Continue the evening walk and less screen time after 10 PM.',
  'Restless mind, overthinking about work. Asked to write three worries down each night and close the notebook.',
  'Grief still close to the surface. Gentle session. Suggested a weekly call with her sister and sunlight in the morning.',
  'Feels drained after long workdays. Advised short breaks every 90 minutes and an early dinner.',
  'Calmer overall. Wants to work on confidence before the interview next month. Practise the morning affirmation.',
  'Tension around the stomach when anxious. Breath into the belly, 4 counts in and 6 out, three times a day.',
  'Better focus this week. Family support has helped. Keep the gratitude note going.',
]
const meetLink = (rnd: () => number) => {
  const c = () => 'abcdefghijkmnopqrstuvwxyz'[Math.floor(rnd() * 25)]
  return `https://meet.google.com/${c()}${c()}${c()}-${c()}${c()}${c()}${c()}-${c()}${c()}${c()}`
}

export function makeSeed(now: number): Seed {
  const r = mulberry32(20261117)
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)]
  const pickN = <T,>(xs: T[], n: number) => { const c = [...xs]; const o: T[] = []; while (o.length < n && c.length) o.push(c.splice(Math.floor(r() * c.length), 1)[0]); return o }
  const today = startOfDay(now)
  const people: Person[] = []
  const appts: Draft[] = []
  const used = new Set<string>()
  const N = 128
  let aid = 1
  // one consultant: every session must land in a free slot (10-min gap), past and future alike
  const busy = new Map<number, [number, number][]>()
  const isFree = (s: number, dur: number) => (busy.get(startOfDay(s)) ?? []).every(([a, b]) => s + dur * MIN + 10 * MIN <= a || s >= b + 10 * MIN)
  const occupy = (s: number, dur: number) => { const d = startOfDay(s); const l = busy.get(d) ?? []; l.push([s, s + dur * MIN]); busy.set(d, l) }
  const TIMES = [10, 10.5, 11, 11.5, 12, 16, 16.5, 17, 17.5, 18, 18.5, 19]

  for (let i = 0; i < N; i++) {
    const female = r() < 0.66
    let first = '', name = ''
    do { first = pick(female ? FEMALE : MALE); name = `${first} ${pick(LAST)}` } while (used.has(name))
    used.add(name)
    const joinedDaysAgo = Math.floor(Math.pow(r(), 1.6) * 520) + 3
    const p: Person = {
      id: `p${i + 1}`, name, first, pronoun: female ? 'she' : 'he', city: pick(CITIES),
      phone: `+91 9${Math.floor(r() * 9e8 + 1e8)}`.replace(/(\d{5})(\d{5})$/, '$1 $2'),
      joinedAt: today - joinedDaysAgo * DAY + Math.floor(r() * 10) * HOUR, moods: [],
    }
    people.push(p)
    const mainConcerns = pickN(CONCERNS, 1 + Math.floor(r() * 3))
    // past sessions: first, then follow-ups every 3–6 weeks
    let t = startOfDay(p.joinedAt) + 2 * DAY
    let k = 0
    const maxSessions = 1 + Math.floor(r() * 7)
    let lastFlowers: string[] = []
    while (t < today - DAY && k < maxSessions) {
      const day = startOfDay(t)
      const dow = new Date(day).getDay()
      if (dow === 0) { t += DAY; continue }
      const kind: Kind = k === 0 ? 'first' : 'followup'
      const dur = kind === 'first' ? 60 : 30
      const off = Math.floor(r() * TIMES.length)
      const slot = [...TIMES.slice(off), ...TIMES.slice(0, off)].map((h) => day + h * HOUR).find((s) => s + dur * MIN <= day + (s < day + 13 * HOUR ? 13 : 20) * HOUR && isFree(s, dur))
      if (slot === undefined) { t += DAY; continue }
      occupy(slot, dur)
      const noShow = k > 0 && r() < 0.05
      const troubling = pickN([...mainConcerns, ...pickN(CONCERNS, 1)], 1 + Math.floor(r() * 3))
      const flowers = noShow ? [] : (k > 0 && r() < 0.35 && lastFlowers.length ? lastFlowers : pickN(troubling.flatMap((c) => CONCERN_FLOWERS[c]), 3 + Math.floor(r() * 3)))
      if (!noShow) lastFlowers = flowers
      const rated = !noShow && r() < 0.78
      const rating = rated ? (r() < 0.72 ? 5 : r() < 0.85 ? 4 : 3) : undefined
      appts.push({
        id: `a${aid++}`, personId: p.id, start: slot, durationMin: dur,
        kind, mode: r() < 0.62 ? 'online' : 'in_person', status: noShow ? 'no_show' : 'completed',
        note: r() < 0.5 ? pick(NOTES) : undefined, troubling: noShow ? undefined : troubling,
        remedy: noShow ? undefined : { flowers, stage: 'delivered', givenAt: slot + (dur + 15) * MIN },
        rating, feedback: rating ? (rating === 5 ? pick(KIND_WORDS) : pick(FEEDBACK_OK)) : undefined,
        followUpWeeks: pick([3, 4, 4, 6]),
      })
      k++
      t = day + (21 + Math.floor(r() * 24)) * DAY
    }
    // journal moods (only for people in care recently)
    const last = appts.filter((a) => a.personId === p.id).at(-1)
    if (last && today - last.start < 60 * DAY) {
      const bias: Mood[] = r() < 0.6 ? ['calm', 'hopeful', 'joyful', 'grateful', 'calm', 'tired', 'anxious'] : ['anxious', 'tired', 'sad', 'calm', 'irritated', 'hopeful']
      for (let d = 13; d >= 0; d--) if (r() < 0.7) p.moods.push({ day: today - d * DAY, mood: pick(bias) })
      if (r() < 0.35) {
        const tr = last.troubling ?? []
        p.checkin = { at: today - Math.floor(r() * 5) * DAY - 3 * HOUR, better: tr.slice(0, 1), same: tr.slice(1, 2), harder: r() < 0.45 ? ['Sleep'] : [] }
      }
    }
  }

  // ---- today: anchored to now so the demo always has done / now / next
  const nowH = new Date(now).getHours() + new Date(now).getMinutes() / 60
  const anchor = today + Math.min(18, Math.max(11, nowH)) * HOUR
  const round15 = (x: number) => Math.round(x / (15 * MIN)) * 15 * MIN
  const todayPlan: [number, Kind, Mode][] = [
    [-3 * HOUR, 'followup', 'in_person'], [-90 * MIN, 'first', 'online'], [18 * MIN, 'followup', 'online'],
    [150 * MIN, 'followup', 'in_person'], [270 * MIN, 'first', 'online'],
  ]
  const inCare = people.filter((p) => appts.some((a) => a.personId === p.id && a.status === 'completed'))
  const fresh = people.filter((p) => !appts.some((a) => a.personId === p.id))
  const todayPeople = [inCare[0], fresh[0] ?? inCare[9], inCare[1], inCare[2], fresh[1] ?? inCare[10]]
  todayPlan.forEach(([off, kind, mode], i) => {
    const start = round15(anchor + off)
    const end = start + (kind === 'first' ? 60 : 30) * MIN
    const p = todayPeople[i]
    occupy(start, kind === 'first' ? 60 : 30)
    const status = end <= now ? 'completed' : start <= now ? 'in_session' : 'confirmed'
    const done = status === 'completed'
    appts.push({
      id: `a${aid++}`, personId: p.id, start, durationMin: kind === 'first' ? 60 : 30, kind, mode, status,
      note: NOTES[i * 2 % NOTES.length], troubling: done ? pickN(CONCERNS, 2) : undefined,
      // the most recent finished session has no remedy yet → drives an insight
      remedy: done && i === 0 ? { flowers: ['White Chestnut', 'Mimulus', 'Elm', 'Walnut'], stage: 'preparing', givenAt: end + 5 * MIN } : undefined,
      rating: done && i === 0 ? 5 : undefined, feedback: done && i === 0 ? KIND_WORDS[0] : undefined,
    })
  })

  // ---- upcoming 3 weeks
  const upcomingPool = inCare.slice(3)
  let u = 0
  for (let d = 1; d <= 21; d++) {
    const day = today + d * DAY
    const dow = new Date(day).getDay()
    if (dow === 0) continue
    const load = d <= 7 ? 4 + Math.floor(r() * 3) : Math.max(0, 4 - Math.floor((d - 7) / 4) + Math.floor(r() * 2) - 1)
    const hours = pickN([10, 11, 12, 16, 17, 18, 19], Math.min(load, 6)).sort((a, b) => a - b)
    for (const h of hours) {
      const isFirst = r() < 0.22
      const p = isFirst && fresh[2 + u % 10] ? fresh[2 + u % 10] : upcomingPool[u % upcomingPool.length]
      u++
      if (appts.some((a) => a.personId === p.id && a.start > now)) continue
      if (!isFree(day + h * HOUR, isFirst ? 60 : 30)) continue
      occupy(day + h * HOUR, isFirst ? 60 : 30)
      appts.push({
        id: `a${aid++}`, personId: p.id, start: day + h * HOUR, durationMin: isFirst ? 60 : 30,
        kind: isFirst ? 'first' : 'followup', mode: r() < 0.6 ? 'online' : 'in_person',
        status: d === 1 && u % 5 === 0 ? 'awaiting_payment' : 'confirmed', note: r() < 0.5 ? pick(NOTES) : undefined,
      })
    }
  }
  // one hold awaiting payment today-ish (drives an insight)
  const holdP = fresh[12] ?? inCare[20]
  let holdAt = 0
  for (let d = 2; d < 14 && !holdAt; d++) {
    const day = today + d * DAY
    if (new Date(day).getDay() === 0) continue
    holdAt = [17, 18, 16, 10, 11].map((h) => day + h * HOUR).find((x) => isFree(x, 60)) ?? 0
  }
  occupy(holdAt, 60)
  appts.push({ id: `a${aid++}`, personId: holdP.id, start: holdAt, durationMin: 60, kind: 'first', mode: 'online', status: 'awaiting_payment', note: NOTES[6] })

  appts.sort((a, b) => a.start - b.start)

  // ---- two kinds of appointment (owner 2026-11-20): about a fifth of people come for Scanning, the rest for Bach flower remedies
  const rs = mulberry32(2020)
  const track = new Map<string, Service>()
  for (const p of people) track.set(p.id, rs() < 0.22 ? 'scanning' : 'bach')
  ;[0, 1, 2].forEach((i) => track.set(todayPeople[i].id, 'bach'))
  ;[3, 4].forEach((i) => track.set(todayPeople[i].id, 'scanning'))
  const STAFF: Staff[] = ['Haresh bhai', 'Shivani di', 'Haresh bhai', 'Jitu Bhaiya']
  for (const a of appts) {
    a.service = track.get(a.personId) ?? 'bach'
    if (a.service === 'scanning') {
      a.remedy = undefined; a.troubling = undefined
      if (a.status === 'completed') a.privateNote = SCAN_NOTES[Math.floor(rs() * SCAN_NOTES.length)]
    } else if (a.remedy) a.remedy.weeks = rs() < 0.5 ? 3 : 4
    if (a.mode === 'online' && a.start > now - DAY && rs() < 0.8) a.meetingUrl = meetLink(rs)
    if (a.start > now - HOUR && a.status !== 'completed') a.assignedBy = STAFF[Math.floor(rs() * STAFF.length)]
  }

  // ---- benefits clients reported in their feedback (separate RNG so the rest of the demo stays stable)
  const rb = mulberry32(777)
  for (const a of appts) {
    if (a.status !== 'completed' || !a.rating || a.rating < 4) continue
    const pool = a.service === 'scanning' ? ['Felt heard', 'Calmer', 'Lighter', 'More energy', 'Clearer mind'] : [...new Set([...(a.troubling ?? []).flatMap((t) => CONCERN_BENEFITS[t] ?? []), 'Felt heard'])]
    const n = 1 + Math.floor(rb() * Math.min(3, pool.length))
    const chosen: string[] = []
    while (chosen.length < n) { const b = pool[Math.floor(rb() * pool.length)]; if (!chosen.includes(b)) chosen.push(b) }
    a.benefits = chosen
  }

  // ---- "took my drops" log since the current blend was given (separate RNG)
  const rd = mulberry32(4242)
  for (const p of people) {
    const blend = appts.filter((a) => a.personId === p.id && a.remedy && a.status === 'completed').at(-1)
    if (!blend?.remedy || today - blend.remedy.givenAt > 40 * DAY) continue
    const style = rd()
    const takeP = style < 0.55 ? 0.94 : style < 0.82 ? 0.76 : 0.42
    const logP = style < 0.82 ? 0.96 : 0.7
    p.drops = []
    for (let d = startOfDay(blend.remedy.givenAt) + DAY; d <= today; d += DAY) {
      if (rd() > logP) continue
      // irregular people tail off in the last week
      const late = today - d < 7 * DAY && takeP < 0.5 ? 0.25 : takeP
      p.drops.push({ day: d, taken: rd() < late })
    }
  }

  // ---- appointment requests: clients only ask; the team calls and assigns a time
  const PREFS = ['Weekday evenings after 6 PM', 'Saturday morning', 'Any time this week', 'Tomorrow if possible', 'Lunch time, 1 to 2 PM', 'Online, any evening']
  const hasUpcoming = (id: string) => appts.some((a) => a.personId === id && a.start > now)
  const candidates = [...fresh.slice(14), ...inCare.slice(25)].filter((x) => !hasUpcoming(x.id) && !todayPeople.includes(x))
  const reqPeople = [candidates[0], candidates[1], candidates[candidates.length - 1], candidates[candidates.length - 3], candidates[2]].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i)
  const requests: ApptRequest[] = reqPeople.map((pp, i) => ({
    id: `r${i + 1}`, personId: pp.id, service: i === 1 || i === 4 ? 'scanning' : track.get(pp.id) ?? 'bach',
    kind: appts.some((a) => a.personId === pp.id && a.status === 'completed') ? 'followup' : 'first',
    mode: i % 3 === 0 ? 'in_person' : 'online', preferred: PREFS[i], note: i % 2 === 0 ? NOTES[(i + 3) % NOTES.length] : undefined,
    at: now - (35 + i * 170) * MIN,
  }))

  // ---- in-app chat with Jitu Bhaiya (demo conversations; his replies never change medicines — he points to the doctor)
  const CONVOS: [('c' | 'j'), string][][] = [
    [['c', 'Namaste Bhaiya 🙏 I have been taking the drops 4 times a day. Sleep is a little better.'], ['j', 'So happy to hear that. Keep going, and note how you feel each evening.'], ['c', 'Thank you Bhaiya, will do.']],
    [['c', 'Can I take the drops with my thyroid tablet?'], ['j', 'Please keep taking your medicine exactly as your doctor advised. Take the drops at a different time, 15 minutes apart. We can talk more in your session.']],
    [['c', 'Bhaiya, my bottle will finish on Sunday. Should I book a follow-up?']],
    [['c', 'Had a hard day at work, felt that old panic again.'], ['j', 'Thank you for telling me. Sit for a minute and breathe slowly, 4 counts in and 6 out. Let us speak tomorrow.'], ['c', 'Feeling calmer now 🙏']],
    [['c', 'Can we do the scanning online this time? I am travelling next week.']],
    [['j', 'Hope the week is going gently. Remember your drops tonight 🌿'], ['c', 'Missed two days, sorry Bhaiya. Starting again today.']],
    [['c', 'My daughter is asking when her next session is.']],
    [['c', 'Thank you for yesterday. I felt so light walking out.'], ['j', 'That makes my day. Keep the gratitude note going 🙏']],
    [['c', 'Is the remedy alcohol-free? I do not take alcohol at all.'], ['j', 'Yes, every BeWise blend is alcohol-free.'], ['c', 'Perfect, thank you!']],
    [['c', 'Bhaiya, the payment link is not opening on my phone.']],
  ]
  const chatPeople = inCare.slice(3, 3 + CONVOS.length)
  const threads: Thread[] = chatPeople.map((pp, i) => {
    let t = now - (i * 13 + 7) * HOUR
    const messages = CONVOS[i].map(([from, text], k) => { t += (k ? 25 + k * 40 : 0) * MIN; return { id: `m${i}-${k}`, from: from === 'c' ? 'client' as const : 'jb' as const, text, at: t } })
    const last = messages.at(-1)!
    return { personId: pp.id, messages, readAt: last.from === 'client' ? last.at - MIN : last.at }
  })

  // ---- notices
  const notices: Notice[] = []
  const nx = (minsAgo: number, kind: Notice['kind'], text: string, personId?: string) =>
    notices.push({ id: `n${notices.length + 1}`, at: now - minsAgo * MIN, kind, text, personId })
  const up = appts.filter((a) => a.start > now && a.status === 'confirmed')
  const nameOf = (id: string) => people.find((p) => p.id === id)!.first
  if (up[3]) nx(12, 'booked', `${nameOf(up[3].personId)} booked a follow-up`, up[3].personId)
  nx(40, 'feedback', `${todayPeople[0].first} rated today's session 5 stars`, todayPeople[0].id)
  if (up[6]) nx(95, 'rescheduled', `${nameOf(up[6].personId)} moved their session to a new time`, up[6].personId)
  nx(180, 'delivered', `${inCare[5].first}'s remedy was delivered`, inCare[5].id)
  const ck = people.find((p) => p.checkin?.harder.length)
  if (ck) nx(260, 'checkin', `${ck.first} filled the check-in before their follow-up`, ck.id)
  nx(26 * 60, 'payment', `${holdP.first} started booking a first consultation`, holdP.id)
  if (requests[0]) nx(35, 'request', `${nameOf(requests[0].personId)} asked for an appointment (${requests[0].preferred.toLowerCase()})`, requests[0].personId)
  const assigned = appts.find((a) => a.start > now && a.assignedBy === 'Shivani di')
  if (assigned) nx(70, 'booked', `Shivani di assigned ${nameOf(assigned.personId)} a time: ${new Date(assigned.start).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`, assigned.personId)
  notices.sort((a, b) => b.at - a.at)
  // BeWise app usage: some never installed it, some haven't opened it in a while
  const rapp = mulberry32(3131)
  people.forEach((p) => {
    const x = rapp()
    p.app = x < 0.22 ? { installed: false } : { installed: true, lastOpen: now - (x < 0.38 ? 15 + Math.floor(rapp() * 60) : Math.floor(rapp() * 6)) * DAY - Math.floor(rapp() * 20) * HOUR }
  })

  // date of birth: entered by the member in the client app (CL-05); a few haven't added it yet
  const rdob = mulberry32(1955)
  const thisYear = new Date(now).getFullYear()
  people.forEach((p, i) => {
    const y = thisYear - 22 - Math.floor(rdob() * 46), m = 1 + Math.floor(rdob() * 12), d = 1 + Math.floor(rdob() * 28)
    if (i % 11 !== 7) p.dob = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  })

  return { people, appts: appts as Appt[], notices, requests, threads }
}
