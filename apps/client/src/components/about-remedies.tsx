'use client'
/**
 * @module   remedies-ux
 * @owner    CLIENT
 * @screens  Book (in the app) · public booking link /book/jitendra-khimlani (owner 2026-11-25: "a section where we write more about the remedy")
 * Purpose:  What Bach flower remedies are, how the personal blend is made and taken, care alongside other treatment, and
 *           who uses them (the "In the spotlight" story). Wellbeing language only; no remedy names; no medical claims.
 */
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { buzz, cx, ease } from './ui'
import { BP } from '@/lib/asset'

const ITEMS = [
  { emoji: '🌼', q: 'What are Bach flower remedies?', a: 'Gentle flower essences found by Dr Edward Bach, a London doctor, in the 1930s. There are 38, and each one is matched to a feeling, like worry, fear, low confidence or a busy mind, rather than to a physical complaint.' },
  { emoji: '🫶', q: 'How is my blend made?', a: 'In your session Jitendra Khimlani listens to how you feel and chooses a few flowers that fit you. Your blend is prepared by hand from the best quality flower essences, vibrationally charged with mantras while it is made.' },
  { emoji: '💧', q: 'How do I take it?', a: '4 drops, 4 times a day. One bottle lasts about 25 days, usually until your next session. The app reminds you and keeps track of your days.' },
  { emoji: '🩺', q: 'Can I take it with my other care?', a: 'Bach flowers are taken alongside the care you already have. Tell Jitendra Khimlani about any medicines or allergies in your check-in. They support emotional wellbeing and never replace medical treatment or professional help.' },
]

export function AboutRemedies({ storyHref }: { storyHref: string }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="card overflow-hidden p-0" aria-labelledby="about-rem-h">
      <div className="relative bg-[linear-gradient(150deg,#FFF3DF,#FDE3EC_55%,#ECE8FF)] px-5 pb-4 pt-5">
        <img src={`${BP}/img/deco/rose.webp`} alt="" aria-hidden className="pointer-events-none absolute -right-3 -top-4 w-[78px] rotate-[16deg]" />
        <p className="eyebrow text-[#8a4b6b]">Good to know</p>
        <h2 id="about-rem-h" className="h-duo mt-0.5 pr-14 text-[24px]">About Bach <em>flower remedies</em></h2>
      </div>
      <ul className="divide-y divide-line px-2">
        {ITEMS.map((x, i) => {
          const on = open === i
          return (
            <li key={x.q}>
              <button onClick={() => { buzz(5); setOpen(on ? null : i) }} aria-expanded={on} className="flex w-full items-center gap-3 px-3 py-3.5 text-left">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-peri-50 text-[17px]" aria-hidden>{x.emoji}</span>
                <span className="flex-1 text-[15px] font-semibold text-navy">{x.q}</span>
                <ChevronDown className={cx('size-5 shrink-0 text-muted transition-transform', on && 'rotate-180')} />
              </button>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease }}
                    className="overflow-hidden px-3 pb-3.5 pl-[60px] text-[14px] leading-[21px] text-ink-2">{x.a}</motion.p>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>
      <Link href={storyHref} className="m-3 mt-1 flex items-center gap-3 rounded-[18px] bg-[#FBE3B8]/60 p-3">
        <img src={`${BP}/img/stories/spotlight.webp`} alt="" className="h-14 w-10 shrink-0 rounded-[10px] object-cover" />
        <span className="min-w-0 flex-1"><span className="block text-[14px] font-bold text-navy">Who else uses them?</span><span className="block text-[12px] text-ink-2">Actors and athletes who have spoken about Bach flowers</span></span>
        <ChevronRight className="size-5 shrink-0 text-navy" />
      </Link>
    </section>
  )
}
