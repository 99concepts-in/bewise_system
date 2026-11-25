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
  /** owner 2026-11-25: well-known people and what they have said publicly, each with its source */
  | { k: 'people'; title: string; items: { name: string; role: string; line: string; source: string; emoji: string }[] }
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
  {
    id: 'confidence', title: 'Bach flowers and confidence', tag: 'Confidence', cover: 'stories/confidence', tint: '#8a4b1f',
    keywords: ['confidence', 'self-esteem', 'shy', 'fail', 'courage', 'inferior', 'stage', 'interview'],
    slides: [
      { k: 'cover', title: 'Bach flowers and confidence', sub: 'When you know you can, but something holds you back', minutes: 3 },
      { k: 'text', kicker: 'The quiet voice', title: '“I’m not good enough”', body: 'Many capable people hold back, not because they cannot, but because they expect to fail. So they never quite try. Bach saw this clearly, and named a flower for it.', emoji: '🌱' },
      { k: 'know', fact: 'Bach described Larch for “those who do not consider themselves as good or capable as those around them, who expect failure… and so do not venture or make a strong enough attempt to succeed.”', source: 'Edward Bach, The Twelve Healers and Other Remedies, 1936' },
      { k: 'remedies', title: 'Different roots of low confidence', items: [
        { name: 'Larch', line: 'Expecting to fail, so not trying' },
        { name: 'Mimulus', line: 'Shyness, nerves before known events' },
        { name: 'Centaury', line: 'Too eager to please, hard to say no' },
        { name: 'Cerato', line: 'Not trusting your own judgement' },
      ] },
      { k: 'steps', title: 'Small steps that build courage', items: [
        { emoji: '✍️', t: 'Write one win a day', d: 'Even small ones. Proof builds belief.' },
        { emoji: '🎯', t: 'Try one small brave thing', d: 'Speak first in one conversation today.' },
        { emoji: '🗣️', t: 'Talk to yourself kindly', d: 'Say what you would say to a friend.' },
        { emoji: '💧', t: 'Keep your rhythm', d: 'Take your drops at the same times each day.' },
      ] },
      quote('Divya Solanki'),
      { k: 'end', title: 'Step forward, gently', body: 'Jitendra Khimlani listens for what is holding you back and chooses a blend for how you feel.', care: 'Bach flowers support emotional wellbeing and do not replace professional help when you need it.' },
    ],
  },
  {
    id: 'finance', title: 'Bach flowers for money and business worries', tag: 'Finance & work', cover: 'stories/finance', tint: '#3f5a3a',
    keywords: ['finance', 'money', 'business', 'work', 'job', 'loss', 'debt', 'career', 'stress', 'pressure'],
    slides: [
      { k: 'cover', title: 'Bach flowers for money worries', sub: 'Steadier feelings when finances and business feel heavy', minutes: 3 },
      { k: 'text', kicker: 'It’s not just numbers', title: 'Money worries are feelings too', body: 'A slow month, a loan, a business decision. The numbers are one part. The other part is how it feels: sleepless worry, pressure, fear of letting others down.', emoji: '📒' },
      { k: 'know', fact: 'Bach described Elm for people “doing good work” who, at times, feel “the task they have undertaken is too difficult”. A passing feeling of being overwhelmed, even in very capable people.', source: 'Edward Bach, The Twelve Healers and Other Remedies, 1936' },
      { k: 'remedies', title: 'Feelings money stress can bring', items: [
        { name: 'Elm', line: 'Overwhelmed by responsibility' },
        { name: 'Mimulus', line: 'Fear of known things, like bills or losses' },
        { name: 'White Chestnut', line: 'Worries that circle at night' },
        { name: 'Gentian', line: 'Discouraged after a setback' },
        { name: 'Oak', line: 'Pushing on, never resting' },
      ] },
      { k: 'steps', title: 'Calmer about money', items: [
        { emoji: '🗒️', t: 'Write it all down', d: 'Worries feel smaller on paper than in your head.' },
        { emoji: '1️⃣', t: 'Pick one next step', d: 'Not the whole plan. Just the next small action.' },
        { emoji: '⏰', t: 'Set a worry time', d: '15 minutes a day to think about money, then stop.' },
        { emoji: '🌙', t: 'Protect your sleep', d: 'No bank apps or emails in the last hour of the day.' },
      ] },
      quote('Akshay Magnani'),
      { k: 'end', title: 'Clearer head, steadier heart', body: 'Jitendra Khimlani listens to what weighs on you and chooses a blend for how you feel.', care: 'Bach flowers support emotional wellbeing. They are not financial advice and do not replace professional help when you need it.' },
    ],
  },
  {
    id: 'change', title: 'Bach flowers for constant change', tag: 'Change', cover: 'stories/change', tint: '#2f5d63',
    keywords: ['change', 'move', 'transition', 'new job', 'marriage', 'baby', 'big life event', 'uncertain', 'unsettled'],
    slides: [
      { k: 'cover', title: 'Bach flowers for constant change', sub: 'Feeling steady when life keeps moving', minutes: 3 },
      { k: 'text', kicker: 'Everything is shifting', title: 'When nothing stays still', body: 'A new city, a new job, a wedding, a baby, children leaving home. Even good changes can leave us unsettled, pulled between the old and the new.', emoji: '🍃' },
      { k: 'know', fact: 'Bach wrote that Walnut “gives constancy and protection from outside influences”, for people on their own path who are being pulled away from it.', source: 'Edward Bach, The Twelve Healers and Other Remedies, 1936' },
      { k: 'remedies', title: 'Feelings change can bring', items: [
        { name: 'Walnut', line: 'Adjusting to a new phase of life' },
        { name: 'Honeysuckle', line: 'Missing how things used to be' },
        { name: 'Scleranthus', line: 'Going back and forth, can’t settle' },
        { name: 'Wild Oat', line: 'Unsure which direction to take' },
      ] },
      { k: 'steps', title: 'Steady in the middle of change', items: [
        { emoji: '⚓', t: 'Keep one anchor', d: 'One small routine that stays the same every day.' },
        { emoji: '🙏', t: 'Honour what ends', d: 'It’s okay to miss the old, even when the new is good.' },
        { emoji: '🧭', t: 'One step at a time', d: 'You don’t need the whole map today.' },
        { emoji: '💧', t: 'Keep your rhythm', d: 'Your drops at the same times are an anchor too.' },
      ] },
      quote('Khushboo Gurnani'),
      { k: 'end', title: 'Rooted, even as things change', body: 'Jitendra Khimlani listens to what is changing for you and chooses a blend for how you feel.', care: 'Bach flowers support emotional wellbeing and do not replace professional help when you need it.' },
    ],
  },
  {
    id: 'self-doubt', title: 'Bach flowers and self-doubt', tag: 'Self-doubt', cover: 'stories/self-doubt', tint: '#4b4a8a',
    keywords: ['self-doubt', 'doubt', 'decide', 'decision', 'indecisive', 'confused', 'trust', 'second-guess', 'advice'],
    slides: [
      { k: 'cover', title: 'Bach flowers and self-doubt', sub: 'Learning to trust your own inner voice again', minutes: 3 },
      { k: 'text', kicker: 'Asking everyone but yourself', title: 'Second-guessing every choice', body: 'You decide, then doubt it. You ask five people, then feel more confused. Self-doubt is tiring, and it can quietly take away the joy of your own choices.', emoji: '🪞' },
      { k: 'know', fact: 'In his own grouping of the 38 remedies, Bach put Cerato under “uncertainty”: for those “who have not sufficient confidence in themselves to make their own decisions” and “constantly seek advice from others”.', source: 'Edward Bach, The Twelve Healers and Other Remedies, 1936' },
      { k: 'remedies', title: 'The many shades of doubt', items: [
        { name: 'Cerato', line: 'Not trusting your own judgement' },
        { name: 'Scleranthus', line: 'Torn between two choices' },
        { name: 'Larch', line: 'Doubting you can succeed' },
        { name: 'Gentian', line: 'Doubt after a disappointment' },
      ] },
      { k: 'steps', title: 'Coming back to yourself', items: [
        { emoji: '🤫', t: 'Decide before you ask', d: 'Write your own answer first, then ask others.' },
        { emoji: '⏳', t: 'Give it a day', d: 'Sleep on it, then notice what still feels right.' },
        { emoji: '📓', t: 'Keep a “good calls” list', d: 'Times you trusted yourself and it worked.' },
        { emoji: '💬', t: 'Share it in your session', d: 'Jitendra Khimlani can help you see the pattern.' },
      ] },
      quote('Akshay Magnani'),
      { k: 'end', title: 'Trust your own voice', body: 'Jitendra Khimlani listens to where doubt shows up for you and chooses a blend for how you feel.', care: 'Bach flowers support emotional wellbeing and do not replace professional help when you need it.' },
    ],
  },
  {
    id: 'anger', title: 'Bach flowers and anger', tag: 'Anger', cover: 'stories/anger', tint: '#8a2f24',
    keywords: ['anger', 'angry', 'temper', 'irritable', 'irritation', 'frustrated', 'frustration', 'rage', 'impatient', 'resentment', 'jealous', 'snap'],
    slides: [
      { k: 'cover', title: 'Bach flowers and anger', sub: 'When small things set you off, and you wish they didn’t', minutes: 3 },
      { k: 'text', kicker: 'Anger is a messenger', title: 'There is a feeling underneath', body: 'Anger often comes from somewhere else: feeling rushed, unheard, let down or hurt. Seeing what sits underneath is the first step to feeling calmer.', emoji: '🔥' },
      { k: 'know', fact: 'Bach described Holly for “those who are sometimes attacked by thoughts of such kind as jealousy, envy, revenge, suspicion. For the different forms of vexation.”', source: 'Edward Bach, The Twelve Healers and Other Remedies, 1936' },
      { k: 'remedies', title: 'Different kinds of anger', items: [
        { name: 'Impatiens', line: 'Snapping when things feel too slow' },
        { name: 'Vervain', line: 'Frustrated when plans are blocked' },
        { name: 'Holly', line: 'Anger with jealousy or hurt' },
        { name: 'Beech', line: 'Irritated by how others do things' },
        { name: 'Willow', line: 'Quiet resentment, “why me?”' },
      ] },
      { k: 'steps', title: 'Cool down in the moment', items: [
        { emoji: '🌬️', t: 'Breathe out slowly', d: 'Make the out breath longer than the in breath, five times.' },
        { emoji: '🚶', t: 'Step away for a minute', d: 'A short walk or a glass of water before you reply.' },
        { emoji: '🗣️', t: 'Name the feeling', d: '“I feel rushed” or “I feel unheard”. Naming it softens it.' },
        { emoji: '💧', t: 'Keep your rhythm', d: 'Take your drops at the same times each day.' },
      ] },
      quote('Divya Solanki'),
      { k: 'end', title: 'Calmer, from the inside', body: 'Jitendra Khimlani listens for what sits beneath your anger and chooses a blend for how you feel.', care: 'Bach flowers support emotional wellbeing and do not replace professional help when you need it.' },
    ],
  },
  {
    // owner 2026-11-25: from public accounts collected at olive-tree.in/celebrities, each line attributed as reported.
    // Left out on purpose: accounts with medical or performance claims (blood cleansing, sports form).
    id: 'spotlight', title: 'Bach flowers in the spotlight', tag: 'In the spotlight', cover: 'stories/spotlight', tint: '#5a3a2a',
    keywords: ['celebrity', 'celebrities', 'famous', 'actor', 'actress', 'stage fright', 'nervous', 'calm', 'rescue', 'spotlight', 'performance', 'interview'],
    slides: [
      { k: 'cover', title: 'Bach flowers in the spotlight', sub: 'Actors and athletes who have spoken about their little bottle', minutes: 3 },
      { k: 'text', kicker: 'A quiet habit', title: 'Calm, carried in a pocket', body: 'Before a premiere, on a stage, at the first tee. Many people in high pressure moments keep Bach flowers close. Here is what some of them have shared in interviews and magazines.', emoji: '🎬' },
      { k: 'people', title: 'On screen', items: [
        { name: 'Emma Watson', role: 'Actor', line: '“A few drops of it under my tongue before I go out calms me down. It is in my makeup bag all the time.”', source: 'Her own words, as quoted', emoji: '🎥' },
        { name: 'Cate Blanchett', role: 'Actor', line: 'Asked what she carries, she named little beyond Rescue Remedy: “a little pick-me-up thing”.', source: 'As reported', emoji: '💄' },
        { name: 'Jennifer Aniston', role: 'Actor', line: 'Reportedly uses Bach flowers to keep cool under pressure before films and premieres.', source: 'As reported', emoji: '🌟' },
      ] },
      { k: 'people', title: 'On stage, on the course, on busy days', items: [
        { name: 'Hugh Grant', role: 'Actor', line: 'Takes Rescue Remedy for stage fright.', source: 'Daily Mail', emoji: '🎭' },
        { name: 'Salma Hayek', role: 'Actor', line: 'Uses Rescue Pastilles on crazy busy days, to keep her calm.', source: 'InStyle magazine', emoji: '✨' },
        { name: 'Kris Tschetter', role: 'Golfer', line: '“A few drops of Rescue Remedy mixed in my water bottle does the trick.”', source: 'Golf Today magazine', emoji: '⛳' },
      ] },
      { k: 'know', fact: 'Rescue Remedy is Dr Bach’s best known combination, five of his flowers together for sudden moments of stress. It is the one most of these stories mention.', source: 'Dr Edward Bach, 1930s' },
      { k: 'text', kicker: 'Ready-made or made for you', title: 'A blend that is yours', body: 'A ready-made blend helps in a busy moment. A personal blend goes further: Jitendra Khimlani listens to how you feel and chooses flowers only for you.', emoji: '🌼' },
      { k: 'end', title: 'Find your own calm', body: 'Book a wellness session and get a personal blend, prepared only for you.', care: 'These are public accounts from interviews and magazines, not endorsements of BeWise. Bach flowers support emotional wellbeing and do not replace professional help.' },
    ],
  },
]

export const storyById = (id: string) => STORIES.find((s) => s.id === id)
