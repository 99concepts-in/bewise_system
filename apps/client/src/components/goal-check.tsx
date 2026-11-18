'use client'
/** @module journal @owner CLIENT · Goal check button: daily check-in or one-time check-off (owner 2026-11-18). */
import { AnimatePresence, motion } from 'motion/react'
import { Check } from 'lucide-react'
import { buzz, cx, spring, toast } from './ui'
import { useApp, type Goal } from '@/lib/store'
import { doneToday, kindOf } from '@/lib/goals'

export function GoalCheck({ g, size = 'md', onParty }: { g: Goal; size?: 'sm' | 'md'; onParty?: () => void }) {
  const check = useApp((s) => s.checkGoal)
  const on = doneToday(g)
  const once = kindOf(g) === 'once'
  const px = size === 'sm' ? 'size-10' : 'size-12'
  return (
    <motion.button type="button" role="checkbox" aria-checked={on} whileTap={{ scale: 0.85 }}
      aria-label={once ? `${g.title}: ${on ? 'achieved' : 'mark as achieved'}` : `${g.title}: ${on ? 'done today' : 'check in for today'}`}
      onClick={() => {
        const now = check(g.id); buzz(now ? 14 : 6)
        if (now) { toast(once ? 'Goal achieved. Well done!' : 'Checked in for today 🌿'); if (once) onParty?.() }
      }}
      className={cx('relative grid shrink-0 place-items-center rounded-full border-2 transition-colors', px, on ? 'border-navy bg-navy text-white' : 'border-[#cfd5e5] bg-white text-transparent')}>
      <AnimatePresence initial={false}>
        {on && <motion.span key="c" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={spring}><Check className={size === 'sm' ? 'size-5' : 'size-6'} strokeWidth={3} /></motion.span>}
      </AnimatePresence>
    </motion.button>
  )
}

