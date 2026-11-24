/**
 * @module   journal
 * @owner    CLIENT
 * Purpose:  owner 2026-11-24: after each mood log, a random line that encourages the member and explains why noticing and
 *           logging feelings helps. Wellbeing language only, never medical. No dashes in copy.
 */
export const ENCOURAGE = [
  'Keep it up. Every check-in is a small act of care for yourself.',
  'The first step to easing any feeling is noticing it. You just did.',
  'Logging regularly helps Jitendra Khimlani understand your journey at your next session.',
  'Naming a feeling gives you a little space from it.',
  'Small, steady check-ins reveal patterns you may not notice day to day.',
  'You showed up for yourself today. That matters.',
  'Your journal is building a clear picture of how you feel over time.',
  'Noticing how you feel is a skill. It grows each time you practise.',
  'Awareness comes first. Calm often follows.',
  'Feelings come and go. Your log shows how they change.',
  'Well done. Your check-ins make your next session more personal.',
  'A few seconds of honesty with yourself goes a long way.',
] as const

/** a random line, never the same one twice in a row */
let last = -1
export function encourage() {
  let i = Math.floor(Math.random() * ENCOURAGE.length)
  if (i === last) i = (i + 1) % ENCOURAGE.length
  last = i
  return ENCOURAGE[i]
}
