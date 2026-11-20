'use client'
/**
 * @module   remedies-ux
 * @owner    CLIENT (UI) · copy pending Jitendra Khimlani's approval (design/v5-bloom/BRIEF.md §8)
 * @screens  v5 Care tab — FAQ accordion (DESIGN-SYSTEM §5): navy card, white Fraunces questions, marigold +/× circles,
 *           answers in sky-100, a flower peeking from the bottom-right.
 * v5 (HUB 2026-11-20): new. Plain words, no medical claims.
 */
import { AnimatePresence, motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { FlowerArt } from './flower'
import { buzz, ease } from './ui'

// @decision(D-45) draft wording — Jitendra Khimlani approves before launch
export const FAQ: { q: string; a: string }[] = [
  { q: 'What are Bach flower remedies?', a: 'Gentle, natural flower remedies, chosen for how you feel, to support your emotional balance. Each one is linked to a feeling.' },
  { q: 'How do I take my blend?', a: '4 drops, 4 times a day, straight on the tongue or in any drink, or as Jitendra Khimlani advises. A bottle lasts about 25 days.' },
  { q: 'How soon will I notice a change?', a: 'Everyone is different. Many people notice small shifts in 2 to 3 weeks. Your journal helps you see them.' },
  { q: 'Can I take them with my medicines?', a: 'They’re a complementary practice and never replace your doctor. Please tell Jitendra Khimlani about any medicines you take.' },
  { q: 'Is there alcohol in it?', a: 'Traditionally a little brandy keeps the blend fresh. Alcohol-free blends are available, just ask.' },
  { q: 'Are they safe for children and in pregnancy?', a: 'Tell us before your session and Jitendra Khimlani will advise you. Always check with your doctor too.' },
  { q: 'Online or in person?', a: 'Both. Online by video call, or at our studio in Alkapuri, Vadodara. You choose when you book.' },
  { q: 'What if I need to reschedule?', a: 'It’s free up to 24 hours before. We don’t offer refunds, but your session is always kept for you.' },
]

export function FaqCard({ title = 'Good to know', defaultOpen = -1 }: { title?: string; defaultOpen?: number }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <section className="relative overflow-hidden rounded-[32px] bg-navy px-5 pb-28 pt-6 text-white shadow-[var(--shadow-card)]" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="font-display text-[26px] font-semibold leading-8 text-white">{title}</h2>
      <p className="mt-1 text-[14px] text-sky-200">Answers to what people ask most.</p>
      <ul className="relative z-10 mt-4">
        {FAQ.map((f, i) => {
          const on = open === i
          return (
            <li key={f.q} className="border-b border-white/15 last:border-0">
              <h3 className="font-sans">
                <button type="button" aria-expanded={on} aria-controls={`${id}-${i}`} id={`${id}-b${i}`} onClick={() => { buzz(5); setOpen(on ? -1 : i) }}
                  className="flex min-h-[60px] w-full items-center gap-3.5 py-3 text-left">
                  <motion.span animate={{ rotate: on ? 45 : 0 }} transition={{ duration: 0.28, ease }}
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-marigold text-ink" aria-hidden>
                    <Plus className="size-[18px]" strokeWidth={2.5} />
                  </motion.span>
                  <span className="flex-1 font-display text-[17px] font-semibold leading-[23px] text-white">{f.q}</span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.div id={`${id}-${i}`} role="region" aria-labelledby={`${id}-b${i}`} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease }} className="overflow-hidden">
                    <p className="pb-4 pl-[46px] pr-2 text-[15px] leading-[23px] text-sky-100">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>
      <FlowerArt name="Wild Rose" decorative className="pointer-events-none absolute -bottom-8 -right-6 h-[150px] w-[150px] rotate-[-8deg]" />
      <FlowerArt name="Mimulus" decorative className="pointer-events-none absolute -bottom-10 right-[104px] h-[96px] w-[96px] rotate-[12deg] opacity-90" />
    </section>
  )
}
