/**
 * @module   knowledge
 * @owner    CLIENT (shared data; CONSULTANT app uses it to suggest remedies — see docs/knowledge/remedy-finder.json)
 * Purpose:  Concern → Bach flower remedies often considered, with the reason in plain words.
 * Sources:  "Bach Flower Remedies: A Step-by-Step Guide" (Non Shaw, Element 1998) — Treating common ailments, pp. 53–58;
 *           Edward Bach, "The Twelve Healers and Other Remedies" (1936) remedy descriptions, as reprinted in
 *           "The Bach Flower Remedies" (Bach & Wheeler). Owner supplied both books 2026-11-23.
 * Rules:    Suggestions for Jitendra Khimlani to consider, never a prescription shown as one. Members see these only as
 *           "flowers often chosen for…", always with "your blend is chosen for you". Emotional wellbeing, not treatment.
 */
export type FinderEntry = { concern: string; keywords: string[]; remedies: { name: string; why: string }[]; note?: string; source: 'guide' | 'bach' }

export const REMEDY_FINDER: FinderEntry[] = [
  { concern: 'Trouble falling asleep (racing thoughts)', keywords: ['sleep', 'insomnia', 'night', 'thoughts', 'awake', 'overthinking'], source: 'guide',
    remedies: [{ name: 'White Chestnut', why: 'worrying thoughts going round and round' }, { name: 'Vervain', why: 'finds it hard to switch off' }, { name: 'Olive', why: 'worn out by long-standing poor sleep' }] },
  { concern: 'Nightmares or waking frightened', keywords: ['nightmare', 'sleep', 'night', 'wake', 'dream'], source: 'guide',
    remedies: [{ name: 'Rescue Remedy', why: 'a few drops in water by the bed to sip' }, { name: 'Star of Bethlehem', why: 'waking with a start' }, { name: 'Rock Rose', why: 'waking with terror' }, { name: 'Cherry Plum', why: 'waking with fear and panic' }] },
  { concern: 'Worry and anxiety', keywords: ['anxiety', 'anxious', 'worry', 'worried', 'nervous', 'tension'], source: 'guide',
    remedies: [{ name: 'White Chestnut', why: 'anxious, unproductive thoughts on repeat' }, { name: 'Agrimony', why: 'worry hidden behind cheerfulness' }, { name: 'Red Chestnut', why: 'over-worry about the welfare of others' }, { name: 'Mimulus', why: 'when the worry is a fear of something known' }] },
  { concern: 'Fear of known things', keywords: ['fear', 'scared', 'phobia', 'exam', 'flying', 'shy', 'stage'], source: 'guide',
    remedies: [{ name: 'Mimulus', why: 'everyday fears of known things: illness, flying, being late' }] },
  { concern: 'Vague fear or foreboding', keywords: ['fear', 'unknown', 'dread', 'foreboding', 'apprehension', 'uneasy'], source: 'guide',
    remedies: [{ name: 'Aspen', why: 'nameless, unexplained fears' }] },
  { concern: 'Panic', keywords: ['panic', 'terror', 'attack', 'fear', 'shaking'], source: 'guide',
    remedies: [{ name: 'Rock Rose', why: 'terror and panic' }, { name: 'Cherry Plum', why: 'fear of losing control' }, { name: 'Aspen', why: 'vague fears before an attack' }, { name: 'Rescue Remedy', why: 'in the moment' }] },
  { concern: 'Fear of losing control', keywords: ['control', 'snap', 'breakdown', 'outburst', 'fear'], source: 'guide',
    remedies: [{ name: 'Cherry Plum', why: 'fear the mind is over-strained, of doing something dreaded' }] },
  { concern: 'Worry for loved ones', keywords: ['family', 'children', 'parents', 'worry', 'loved ones', 'safety'], source: 'guide',
    remedies: [{ name: 'Red Chestnut', why: 'fear for the safety of others' }] },
  { concern: 'Feeling low for a reason', keywords: ['sad', 'low', 'down', 'setback', 'discouraged', 'depression'], source: 'guide',
    remedies: [{ name: 'Gentian', why: 'mild despondency after a setback' }] },
  { concern: 'Gloom out of nowhere', keywords: ['sad', 'gloom', 'low', 'dark cloud', 'depression', 'heavy'], source: 'guide',
    remedies: [{ name: 'Mustard', why: 'deep gloom that comes and goes with no known reason' }] },
  { concern: 'Hopelessness', keywords: ['hopeless', 'give up', 'despair', 'long illness'], source: 'guide',
    remedies: [{ name: 'Gorse', why: 'hopelessness, often after a long struggle' }] },
  { concern: 'At the end of endurance', keywords: ['anguish', 'despair', 'breaking point', 'unbearable'], source: 'guide',
    remedies: [{ name: 'Sweet Chestnut', why: 'feeling stretched beyond endurance' }] },
  { concern: 'Apathy, drifting along', keywords: ['apathy', 'resigned', 'no interest', 'flat', 'motivation'], source: 'guide',
    remedies: [{ name: 'Wild Rose', why: 'quiet resignation, interest has faded' }, { name: 'Gentian', why: 'discouraged after trying' }] },
  { concern: 'Exhaustion after effort', keywords: ['tired', 'exhausted', 'drained', 'fatigue', 'burnout'], source: 'guide',
    remedies: [{ name: 'Olive', why: 'complete tiredness after a long effort' }] },
  { concern: 'Monday-morning tiredness', keywords: ['tired', 'procrastination', 'weary', 'start', 'routine'], source: 'guide',
    remedies: [{ name: 'Hornbeam', why: 'tired at the thought of doing something' }] },
  { concern: 'Stress and overwork', keywords: ['stress', 'work', 'pressure', 'overwork', 'relax'], source: 'guide',
    remedies: [{ name: 'Vervain', why: 'works too hard, cannot relax' }, { name: 'Olive', why: 'too tired to relax' }, { name: 'Elm', why: 'overwhelmed by responsibility' }, { name: 'Oak', why: 'keeps going when life feels like a struggle' }] },
  { concern: 'Overwhelmed by responsibility', keywords: ['overwhelmed', 'responsibility', 'too much', 'stress', 'work'], source: 'guide',
    remedies: [{ name: 'Elm', why: 'temporary feeling of not coping, in capable people' }] },
  { concern: 'Lack of confidence', keywords: ['confidence', 'self-esteem', 'inferior', 'fail', 'self-doubt'], source: 'guide',
    remedies: [{ name: 'Larch', why: 'expects to fail, so does not try' }, { name: 'Cerato', why: 'does not trust their own judgement' }, { name: 'Centaury', why: 'cannot stand up for themselves' }] },
  { concern: 'Finding it hard to say no', keywords: ['say no', 'people pleaser', 'doormat', 'boundaries', 'relationship'], source: 'guide',
    remedies: [{ name: 'Centaury', why: 'too eager to please, easily used' }] },
  { concern: 'Indecision', keywords: ['decide', 'decision', 'confused', 'choice', 'indecisive'], source: 'guide',
    remedies: [{ name: 'Scleranthus', why: 'torn between two options' }, { name: 'Cerato', why: 'keeps asking others' }] },
  { concern: 'Unsure of life direction', keywords: ['career', 'direction', 'purpose', 'path', 'business', 'decision'], source: 'guide',
    remedies: [{ name: 'Wild Oat', why: 'an important life choice, finding one’s path' }] },
  { concern: 'Impatience and irritability', keywords: ['impatient', 'irritable', 'angry', 'temper', 'frustrated'], source: 'guide',
    remedies: [{ name: 'Impatiens', why: 'irritated by slower people' }, { name: 'Beech', why: 'intolerance of other ways' }] },
  { concern: 'Anger', keywords: ['anger', 'angry', 'rage', 'frustration', 'temper'], source: 'guide',
    remedies: [{ name: 'Impatiens', why: 'frustrated anger from impatience' }, { name: 'Vervain', why: 'anger when plans are blocked' }, { name: 'Holly', why: 'anger with jealousy or wanting revenge' }] },
  { concern: 'Jealousy and envy', keywords: ['jealous', 'envy', 'suspicion', 'relationship', 'partner'], source: 'guide',
    remedies: [{ name: 'Holly', why: 'jealousy, suspicion, hatred' }, { name: 'Willow', why: '“why me?” resentment' }] },
  { concern: 'Resentment, feeling hard done by', keywords: ['resentment', 'bitter', 'unfair', 'why me', 'grudge'], source: 'guide',
    remedies: [{ name: 'Willow', why: 'resentful, blames life or others' }] },
  { concern: 'Possessive or clingy love', keywords: ['clingy', 'possessive', 'attention', 'relationship', 'family', 'children'], source: 'bach',
    remedies: [{ name: 'Chicory', why: 'love that needs to be needed and kept close' }] },
  { concern: 'Critical of others', keywords: ['critical', 'judgemental', 'intolerant', 'relationship'], source: 'bach',
    remedies: [{ name: 'Beech', why: 'critical, intolerant of others’ ways' }] },
  { concern: 'Dominating, must be in charge', keywords: ['dominating', 'control', 'bossy', 'relationship'], source: 'bach',
    remedies: [{ name: 'Vine', why: 'strong-willed, takes charge of others' }] },
  { concern: 'Loneliness', keywords: ['lonely', 'alone', 'isolated', 'relationship'], source: 'guide',
    remedies: [{ name: 'Water Violet', why: 'keeps a distance from others' }, { name: 'Heather', why: 'fear of being alone, needs company' }, { name: 'Agrimony', why: 'inner loneliness behind a cheerful face' }] },
  { concern: 'Hidden worry behind a smile', keywords: ['hide', 'mask', 'cheerful', 'smile', 'pretend'], source: 'guide',
    remedies: [{ name: 'Agrimony', why: 'deep tension hidden under a joke or a smile' }] },
  { concern: 'Guilt and self-blame', keywords: ['guilt', 'blame', 'sorry', 'regret'], source: 'guide',
    remedies: [{ name: 'Pine', why: 'blames oneself, takes on too much responsibility' }] },
  { concern: 'Living in the past', keywords: ['past', 'nostalgia', 'regret', 'memories', 'grief'], source: 'guide',
    remedies: [{ name: 'Honeysuckle', why: 'thoughts dwell on the past' }, { name: 'Walnut', why: 'to break old links' }] },
  { concern: 'Shock or loss', keywords: ['shock', 'loss', 'grief', 'bereavement', 'trauma', 'bad news', 'big life event'], source: 'guide',
    remedies: [{ name: 'Star of Bethlehem', why: 'the effects of shock, however long ago' }, { name: 'Gorse', why: 'hopelessness after a loss' }] },
  { concern: 'Big life change', keywords: ['change', 'move', 'marriage', 'new job', 'baby', 'menopause', 'big life event', 'transition'], source: 'guide',
    remedies: [{ name: 'Walnut', why: 'adjusting to change, breaking links' }, { name: 'Larch', why: 'when confidence dips' }, { name: 'Elm', why: 'feeling inadequate for a while' }, { name: 'Mimulus', why: 'fear of the known' }, { name: 'Aspen', why: 'fear of the unknown' }] },
  { concern: 'Mood swings', keywords: ['mood swings', 'up and down', 'hormones', 'pms', 'changeable'], source: 'guide',
    remedies: [{ name: 'Scleranthus', why: 'moods that swing from one extreme to the other' }, { name: 'Walnut', why: 'during times of hormonal change' }] },
  { concern: 'Daydreaming, poor focus', keywords: ['focus', 'concentration', 'distracted', 'daydream', 'study'], source: 'guide',
    remedies: [{ name: 'Clematis', why: 'thoughts drift to the future' }, { name: 'Chestnut Bud', why: 'repeats the same mistakes' }] },
  { concern: 'Feeling unclean, self-image', keywords: ['skin', 'unclean', 'self-image', 'body', 'weight', 'appearance'], source: 'guide',
    remedies: [{ name: 'Crab Apple', why: 'feeling unclean or unhappy with how one looks' }] },
  { concern: 'Obsessive habits', keywords: ['obsessive', 'compulsive', 'checking', 'habit'], source: 'guide',
    remedies: [{ name: 'Crab Apple', why: 'compulsive cleaning or checking' }, { name: 'White Chestnut', why: 'fixed, repeating thoughts' }] },
  { concern: 'Discouraged by a long illness', keywords: ['illness', 'chronic', 'pain', 'long term', 'diabetes', 'health'], source: 'guide',
    remedies: [{ name: 'Gentian', why: 'discouragement' }, { name: 'Gorse', why: 'hopelessness about getting better' }, { name: 'Oak', why: 'struggling on bravely' }],
    note: 'Emotional support alongside medical care, never instead of it.' },
  { concern: 'Exams and stressful events', keywords: ['exam', 'interview', 'test', 'presentation', 'stress'], source: 'guide',
    remedies: [{ name: 'Rescue Remedy', why: 'for the moment itself' }, { name: 'Mimulus', why: 'fear of the known event' }, { name: 'Larch', why: 'expecting to fail' }] },
  { concern: 'Children: tantrums, change, worries', keywords: ['children', 'child', 'kids', 'school', 'tantrum', 'family'], source: 'guide',
    remedies: [{ name: 'Cherry Plum', why: 'tantrums' }, { name: 'Impatiens', why: 'impatience' }, { name: 'Clematis', why: 'daydreamers' }, { name: 'Walnut', why: 'changes like a new school' }, { name: 'White Chestnut', why: 'worries and a busy mind' }] },
]

/** member-facing search: concerns whose words match the query */
export function findConcerns(q: string) {
  const t = q.trim().toLowerCase()
  if (!t) return []
  return REMEDY_FINDER.filter((e) => e.concern.toLowerCase().includes(t) || e.keywords.some((k) => k.includes(t) || t.includes(k)))
}
