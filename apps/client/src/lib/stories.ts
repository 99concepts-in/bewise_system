/**
 * @module   learn
 * @owner    CLIENT
 * @screens  Learn tab: "Know how Bach flower therapy can help you" (owner 2026-11-23)
 * Purpose:  Insta-story style stories, 6 to 8 slides each, tap right for the next. Original writing informed by the books the
 *           owner supplied (Bach, The Twelve Healers 1936; Non Shaw, A Step-by-Step Guide 1998). Framed as emotional wellbeing
 *           support, never treatment of a condition. Testimonials are REAL quotes from lib/data.ts TESTIMONIALS only.
 * Copy:     no em/en dashes; no cure or medical claims.
 */
import { TESTIMONIALS } from './data'

export type Slide =
  | { k: 'cover'; title: string; sub: string; minutes: number }
  | { k: 'text'; kicker: string; title: string; body: string; flower?: string; emoji?: string }
  | { k: 'remedies'; title: string; sub?: string; items: { name: string; line: string }[] }
  | { k: 'steps'; title: string; items: { emoji: string; t: string; d: string }[] }
  | { k: 'know'; fact: string; source: string }
  | { k: 'quote'; quote: string; name: string }
  | { k: 'end'; title: string; body: string; care: string }

export type Story = { id: string; title: string; tag: string; cover: string; tint: string; keywords: string[]; slides: Slide[] }

const quote = (name: string) => { const t = TESTIMONIALS.find((x) => x.name === name)!; return { k: 'quote' as const, quote: t.quote, name: t.name } }

export const STORIES: Story[] = [
  {
    id: 'sleep', title: 'Bach flowers and sleep', tag: 'Sleep', cover: 'stories/sleep', tint: '#2b2f6b',
    keywords: ['sleep', 'insomnia', 'night', 'tired', 'rest', 'thoughts', 'overthinking', 'nightmare'],
    slides: [
      { k: 'cover', title: 'Bach flowers and sleep', sub: 'When your body is tired but your mind won’t switch off', minutes: 3 },
      { k: 'text', kicker: 'The 2 a.m. loop', title: 'Tired body, busy mind', body: 'Many sleepless nights begin in the mind, not the bed. A conversation replays. Tomorrow’s list grows. A worry returns just as you drift off. How we feel during the day travels with us into the night.', emoji: '🌙' },
      { k: 'know', fact: 'Dr Edward Bach was a London doctor and bacteriologist. In the 1930s he left his practice to find 38 flower remedies, each one matched to a state of mind rather than a physical complaint.', source: 'Edward Bach, The Twelve Healers, 1936' },
      { k: 'text', kicker: 'White Chestnut', title: 'For thoughts that circle', body: 'Bach described White Chestnut for thoughts that we do not want, which go round and round and return even when we push them away. It is the flower most often chosen for a mind that keeps talking at night.', flower: 'White Chestnut' },
      { k: 'remedies', title: 'Flowers often chosen for restless nights', items: [
        { name: 'White Chestnut', line: 'Repeating, unwanted thoughts' },
        { name: 'Vervain', line: 'A busy mind that finds it hard to switch off' },
        { name: 'Olive', line: 'Worn out after a long stretch of poor sleep' },
        { name: 'Aspen', line: 'Vague unease or fears that grow at night' },
      ] },
      { k: 'steps', title: 'A gentle evening ritual', items: [
        { emoji: '📵', t: 'Screens away', d: 'Put the phone down 30 minutes before bed.' },
        { emoji: '💧', t: 'Your night drops', d: '4 drops of your blend, in water or a warm drink.' },
        { emoji: '📝', t: 'Park tomorrow', d: 'Write tomorrow’s worries on paper, then close the notebook.' },
        { emoji: '🌬️', t: 'Five slow breaths', d: 'Breathe out a little longer than you breathe in.' },
      ] },
      quote('Khushboo Gurnani'),
      { k: 'end', title: 'Your blend is made for you', body: 'Jitendra Khimlani listens to what keeps you awake and chooses a blend for how you feel.', care: 'Bach flowers support emotional wellbeing and do not replace medical care. If poor sleep goes on for weeks, please also see your doctor.' },
    ],
  },
  {
    id: 'anxiety', title: 'Bach flowers and anxiety', tag: 'Anxiety', cover: 'stories/anxiety', tint: '#5b6b1f',
    keywords: ['anxiety', 'anxious', 'worry', 'fear', 'panic', 'nervous', 'stress', 'tension', 'overthinking'],
    slides: [
      { k: 'cover', title: 'Bach flowers and anxiety', sub: 'Gentle support for a worried mind', minutes: 3 },
      { k: 'text', kicker: 'Not all worry is the same', title: 'Fear has many faces', body: 'Some fear has a name: an exam, a flight, a hospital visit. Some has none, just a heavy feeling that something is wrong. Bach described each kind separately, because each one asks for something different.', emoji: '🌤️' },
      { k: 'remedies', title: 'Five flowers for five kinds of fear', items: [
        { name: 'Mimulus', line: 'Fear of known things, everyday nerves' },
        { name: 'Aspen', line: 'Vague fear you cannot explain' },
        { name: 'Rock Rose', line: 'Sudden panic or terror' },
        { name: 'Cherry Plum', line: 'Fear of losing control' },
        { name: 'Red Chestnut', line: 'Constant worry for people you love' },
      ] },
      { k: 'text', kicker: 'The quiet kind', title: 'Worry behind a smile', body: 'Some of us carry worry where no one can see it. We joke, we reassure everyone else, and stay up with our thoughts. Bach described Agrimony for exactly this: cheerful on the outside, troubled within.', flower: 'Agrimony' },
      { k: 'know', fact: 'Rescue Remedy, the best known Bach blend, combines five flowers: Rock Rose, Impatiens, Clematis, Cherry Plum and Star of Bethlehem. It is kept for moments that need calm right away.', source: 'Non Shaw, Bach Flower Remedies: A Step-by-Step Guide, 1998' },
      { k: 'steps', title: 'When worry rises', items: [
        { emoji: '🏷️', t: 'Name it', d: 'Is it a known fear, or a vague one? Naming it softens it.' },
        { emoji: '🌬️', t: 'Breathe 4 in, 6 out', d: 'A longer breath out tells your body it is safe.' },
        { emoji: '💧', t: 'Sip slowly', d: 'Take your drops in a glass of water, sip by sip.' },
        { emoji: '💬', t: 'Share it', d: 'Tell Jitendra Khimlani what you noticed. It helps him fine-tune your blend.' },
      ] },
      quote('Divya Solanki'),
      { k: 'end', title: 'Feel calmer, day by day', body: 'In a session, Jitendra Khimlani listens for the kind of worry you carry and chooses a blend for it.', care: 'Bach flowers support emotional wellbeing and do not replace medical care. If anxiety stops you from living your day, please also talk to your doctor.' },
    ],
  },
  {
    id: 'relationships', title: 'Bach flowers in relationships', tag: 'Relationships', cover: 'stories/relationships', tint: '#7a3b4b',
    keywords: ['relationship', 'relationships', 'partner', 'marriage', 'family', 'jealous', 'anger', 'love', 'lonely', 'say no', 'children', 'parents'],
    slides: [
      { k: 'cover', title: 'Bach flowers in relationships', sub: 'Feel more like yourself with the people you love', minutes: 3 },
      { k: 'text', kicker: 'We bring our feelings home', title: 'It is not about blame', body: 'Snapping after a long day. A jealous thought. Needing to fix everyone. Never saying no. Bach saw these not as faults to fight but as feelings that can be met with care.', emoji: '🤍' },
      { k: 'remedies', title: 'Flowers for how we relate', items: [
        { name: 'Holly', line: 'Jealousy, suspicion, flashes of anger' },
        { name: 'Chicory', line: 'Love that holds on too tightly' },
        { name: 'Centaury', line: 'Finding it hard to say no' },
        { name: 'Beech', line: 'Criticism, little patience for other ways' },
        { name: 'Walnut', line: 'Adjusting to change: marriage, a move, a new baby' },
      ] },
      { k: 'know', fact: 'Bach wrote that we do not need to fight a difficult feeling. Instead we can bring in “such a flood of its opposing virtue” that the old pattern is swept away.', source: 'Edward Bach, Heal Thyself, 1931' },
      { k: 'remedies', title: 'What each flower brings out', items: [
        { name: 'Holly', line: 'Warmth and generosity' },
        { name: 'Chicory', line: 'Love given freely' },
        { name: 'Centaury', line: 'Kindness with healthy limits' },
        { name: 'Beech', line: 'Tolerance and understanding' },
      ] },
      { k: 'steps', title: 'Small things that help', items: [
        { emoji: '⏸️', t: 'Pause before you reply', d: 'Three breaths turn a reaction into a response.' },
        { emoji: '🙏', t: 'One appreciation a day', d: 'Say one thing you value in them, out loud.' },
        { emoji: '🗣️', t: 'Ask clearly', d: 'Say what you need, without waiting to be guessed.' },
        { emoji: '💧', t: 'Keep your rhythm', d: 'Take your drops at the same times each day.' },
      ] },
      quote('Akshay Magnani'),
      { k: 'end', title: 'Closer, calmer, kinder', body: 'Jitendra Khimlani listens to what is happening in your relationships and chooses a blend for how you feel.', care: 'Bach flowers support emotional wellbeing. They are not couples or family therapy, and do not replace professional help when you need it.' },
    ],
  },
]

export const storyById = (id: string) => STORIES.find((s) => s.id === id)
