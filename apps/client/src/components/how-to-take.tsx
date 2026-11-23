'use client'
/**
 * @module   remedies-ux
 * @owner    CLIENT
 * @screens  CL-26 My care · "How to take your remedy"
 * Purpose:  The instructions Jitendra Khimlani sends on WhatsApp with every bottle (owner 2026-11-23), in the app.
 *           Softened for no medical claims: "gentle and natural" (not "no side effects"); first days: emotional changes only.
 */
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { cx } from './ui'

export const JITU_WHATSAPP = { tel: '919898020939', label: '98980 20939' }

const TIPS: { e: string; t: string; d: string }[] = [
  { e: '💧', t: '4 drops, 4 times a day', d: 'Morning, afternoon, evening and night: 16 drops in all. Or add 16 drops to a litre of water and sip it through the day.' },
  { e: '☕', t: 'In anything you like', d: 'Straight on the tongue, or in water, tea, coffee or food.' },
  { e: '🕰️', t: 'Any time', d: 'Before, after or with your meals.' },
  { e: '🗓️', t: 'One bottle, about 25 days', d: 'When it is nearly finished, book your next session so Jitendra Khimlani can review your blend.' },
  { e: '🌱', t: 'Gentle and natural', d: 'In the first 3 days you may notice your feelings shift. That is common: it is part of letting go of what you no longer need.' },
  { e: '🏠', t: 'Keep it safe', d: 'Out of reach of children, in a cool, dry place.' },
]

export function HowToTake({ open: initial = false }: { open?: boolean }) {
  const [open, setOpen] = useState(initial)
  return (
    <section className="card overflow-hidden" aria-labelledby="howto-h">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-3 p-5 text-left">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-marigold-100 text-[20px]" aria-hidden>🌸</span>
        <span className="flex-1"><span id="howto-h" className="block font-display text-[18px] font-semibold text-ink">How to take your remedy</span><span className="text-[13px] text-muted">4 drops, 4 times a day · one bottle lasts 25 days</span></span>
        <ChevronDown className={cx('size-5 text-navy transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <ul className="space-y-3 px-5">
              {TIPS.map((x) => (
                <li key={x.t} className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-peri-50 text-[17px]" aria-hidden>{x.e}</span>
                  <span className="min-w-0"><span className="block text-[15px] font-bold text-navy">{x.t}</span><span className="block text-[13px] leading-5 text-ink-2">{x.d}</span></span>
                </li>
              ))}
            </ul>
            <div className="m-5 rounded-[20px] bg-sage-100/70 p-4">
              <p className="text-[14px] leading-5 text-sage-text">While you take your remedy, keep sharing how you feel with Jitendra Khimlani.</p>
              <a href={`https://wa.me/${JITU_WHATSAPP.tel}?text=${encodeURIComponent('Hi Jitendra Khimlani, sharing how I feel on my remedy: ')}`} target="_blank" rel="noopener noreferrer"
                className="mt-3 flex h-11 items-center justify-center gap-2 rounded-full bg-[#1f8f5f] text-[14px] font-semibold text-white"><MessageCircle className="size-4" /> WhatsApp {JITU_WHATSAPP.label}</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
