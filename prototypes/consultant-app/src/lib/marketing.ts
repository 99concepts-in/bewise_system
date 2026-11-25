/**
 * @module   prototype/consultant-app/marketing
 * @owner    CONSULTANT
 * Purpose:  Marketing tab (owner 2026-11-25): who to nudge, broadcast audiences, ready-made posts and captions.
 * Rules:    WhatsApp messages from the BeWise number use approved templates (backend); nobody is nudged twice within 7 days;
 *           reviews are shared without the member's name unless he switches it on after asking them.
 */
import type { Appt, Person } from '../data/types'
import { DAY, FLOWERS, FLOWER_NOTE, KIND_WORDS } from '../data/seed'
import { personView, type PersonView } from './derive'
import { journeyTag } from './journey'
import { APP_LINK, BOOKING_LINK } from './labels'
import type { Mkt, NudgeKind } from '../state/store'

// ---------------------------------------------------------------- audiences
export interface Audience { key: NudgeKind; label: string; why: string; people: PersonView[] }

export function recentlyNudged(mkt: Mkt, personId: string, now: number) {
  return mkt.nudges.some((n) => n.personId === personId && now - n.at < 7 * DAY)
}

export function audiences(people: Person[], byPerson: Map<string, Appt[]>, mkt: Mkt, now: number): Record<NudgeKind, Audience> {
  const views = people.filter((p) => !p.archived).map((p) => personView(p, byPerson.get(p.id), now))
  const fresh = (v: PersonView) => !recentlyNudged(mkt, v.p.id, now)
  const notUsing = views.filter((v) => !v.p.app?.installed || (v.p.app.lastOpen !== undefined && now - v.p.app.lastOpen > 14 * DAY))
  const drifting = views.filter((v) => journeyTag(v, now)?.tag === 'Drifting')
  const due = views.filter((v) => v.buckets.includes('due') && !v.next && journeyTag(v, now)?.tag !== 'Drifting')
  const happy = views.filter((v) => v.past.some((a) => a.rating === 5 && now - a.start < 90 * DAY))
  const drops = views.filter((v) => v.buckets.includes('missing'))
  const mk = (key: NudgeKind, label: string, why: string, list: PersonView[]): Audience => ({ key, label, why, people: list.filter(fresh) })
  return {
    app: mk('app', 'Not using the app', 'Never installed it, or not opened in 2 weeks', notUsing),
    drifting: mk('drifting', 'Drifting away', 'No session for over 3 months', drifting),
    due: mk('due', 'Follow-up due', 'Their follow-up date has passed, nothing booked', due),
    review: mk('review', 'Happy members', 'Rated a session 5 stars in the last 3 months', happy),
    drops: mk('drops', 'Missing their drops', 'Missed 3 or more of the last 7 days', drops),
  }
}

/** Message templates; {name} becomes each person's first name. Sent from the BeWise WhatsApp number and shown in the app. */
export const NUDGE_TEXT: Record<NudgeKind, string> = {
  app: 'Namaste {name} 🙏 Your BeWise app keeps your remedy, reminders and feelings journal in one place, and you can message me there directly. Open it here: ' + APP_LINK,
  drifting: 'Namaste {name} 🙏 It has been a while. I hope you are keeping well. If you would like a calm hour to talk, ask for a time here and my team will call you: ' + BOOKING_LINK,
  due: 'Namaste {name} 🙏 It is time for your follow-up. Ask for a time that suits you and Haresh bhai or Shivani di will call to fix it: ' + BOOKING_LINK,
  review: 'Namaste {name} 🙏 Thank you for your kind words after our session. If it helped, would you share a few lines on Google, or tell a friend who might need it? This is my booking link: ' + BOOKING_LINK,
  drops: 'Namaste {name} 🙏 A gentle reminder to take your drops today: 4 drops, 4 times a day. Small steps, every day.',
}
export const fill = (text: string, first: string) => text.replace(/\{name\}/g, first)

// ---------------------------------------------------------------- broadcast
export interface BroadcastAudience { key: string; label: string; people: PersonView[] }
export function broadcastAudiences(people: Person[], byPerson: Map<string, Appt[]>, now: number): BroadcastAudience[] {
  const views = people.filter((p) => !p.archived).map((p) => personView(p, byPerson.get(p.id), now))
  return [
    { key: 'all', label: 'Everyone', people: views },
    { key: 'remedy', label: 'On a remedy', people: views.filter((v) => v.buckets.includes('remedy')) },
    { key: 'bach', label: 'Bach flower', people: views.filter((v) => v.service === 'bach') },
    { key: 'scanning', label: 'Scanning', people: views.filter((v) => v.service === 'scanning') },
    { key: 'quiet', label: 'Not seen in 2 months', people: views.filter((v) => !v.next && (!v.last || now - v.last.start > 60 * DAY)) },
  ]
}
export const BROADCAST_TEMPLATES: { key: string; label: string; text: string }[] = [
  { key: 'slots', label: 'New times open', text: 'Namaste {name} 🙏 I have a few calm hours free this week, in person in Vadodara and online. Ask for a time and my team will call you: ' + BOOKING_LINK },
  { key: 'festival', label: 'Festival wishes', text: 'Namaste {name} 🙏 Wishing you and your family a peaceful and joyful festive season. May the days ahead feel lighter. Jitendra Khimlani, BeWise' },
  { key: 'tip', label: 'Wellness thought', text: 'Namaste {name} 🙏 A small practice for this week: before sleep, write down one thing that went well today. It quietly changes how the mind settles. Jitendra Khimlani' },
  { key: 'event', label: 'Talk or workshop', text: 'Namaste {name} 🙏 I am holding a free 45-minute talk on calming an anxious mind with Bach flowers, this Sunday at 11 AM, online. Reply YES and we will send the link.' },
]

// ---------------------------------------------------------------- ready-made posts
export type PostKind = 'review' | 'story' | 'flower' | 'tip' | 'book' | 'impact'
export type Format = 'story' | 'post'
export interface Post { id: string; kind: PostKind; title: string; body: string; author?: string; authorFull?: string; rating?: number; flower?: string; stat?: string; caption: string }

const TIPS = [
  { t: 'One slow breath', b: 'When the mind races, breathe in for four, hold for four, out for six. Three rounds. Let the body lead the mind.' },
  { t: 'Name the feeling', b: 'Saying "I feel worried" softens it. A feeling named is a feeling that has somewhere to go.' },
  { t: 'Morning sunlight', b: 'Ten minutes of early light, before the phone. It sets the day\'s rhythm and lifts the mood quietly.' },
  { t: 'One thing that went well', b: 'Before sleep, write one good thing from today. Small, honest, yours. The mind learns to look for them.' },
  { t: 'Say no kindly', b: 'A gentle "not this time" protects your energy. Caring for yourself is how you keep caring for others.' },
]
const tag = '#BachFlowerRemedies #EmotionalWellbeing #Vadodara #BeWise'

export function readyPosts(appts: Appt[], people: Person[], now: number, reached: number): Post[] {
  const byId = new Map(people.map((p) => [p.id, p]))
  const week = Math.floor(now / (7 * DAY))
  const reviews = appts.filter((a) => a.status === 'completed' && (a.rating ?? 0) >= 5 && a.feedback && a.feedback.length > 24 && now - a.start < 120 * DAY)
    .sort((a, b) => b.start - a.start).slice(0, 4)
  const posts: Post[] = reviews.map((a) => {
    const p = byId.get(a.personId)!
    return { id: `rv-${a.id}`, kind: 'review', title: 'Kind words', body: a.feedback!, rating: a.rating, author: `A member, ${p.city}`, authorFull: `${p.first} ${p.name.split(' ').slice(-1)[0][0]}., ${p.city}`, caption: `“${a.feedback}” Thank you for trusting me with your journey. 🙏\n\nAsk for a session: ${BOOKING_LINK}\n${tag}` }
  })
  const story = KIND_WORDS[week % KIND_WORDS.length]
  posts.unshift({ id: 'story-week', kind: 'story', title: 'A BeWise story', body: story, author: 'A member', caption: `Every week someone walks out a little lighter. “${story}” 🌿\n\nYour story can start here: ${BOOKING_LINK}\n${tag}` })
  const flower = FLOWERS[week % FLOWERS.length]
  posts.push({ id: 'flower-week', kind: 'flower', title: 'Flower of the week', flower, body: FLOWER_NOTE[flower] ?? '', caption: `Flower of the week: ${flower}. ${FLOWER_NOTE[flower] ?? ''} 🌼\n\nCurious which flowers are right for you? ${BOOKING_LINK}\n${tag}` })
  const tip = TIPS[week % TIPS.length]
  posts.push({ id: 'tip-week', kind: 'tip', title: tip.t, body: tip.b, caption: `${tip.t}. ${tip.b}\n\nSave this for a busy day. 🙏\n${tag}` })
  posts.push({ id: 'book', kind: 'book', title: 'Feeling stuck or heavy?', body: 'A calm hour to talk, and a Bach flower blend made just for you. In person in Vadodara or online.', caption: `Feeling stuck, restless or heavy? Let's talk. A calm hour, and a Bach flower blend made just for you, in Vadodara or online. Ask for a time: ${BOOKING_LINK}\n${tag}` })
  posts.push({ id: 'impact', kind: 'impact', title: 'People reached', stat: reached.toLocaleString('en-IN'), body: 'lives touched through Bach flower remedies. Thank you for the trust.', caption: `${reached.toLocaleString('en-IN')} people reached and counting. Thank you for every story you have shared with me. 🙏\n\n${BOOKING_LINK}\n${tag}` })
  return posts
}
