'use client'
/**
 * @module journal @owner CLIENT @screens CL-31 Goals (D-19)
 * owner 2026-11-18: daily goals get a check-in every day (with a 7-day strip and streak);
 * long-term goals are checked off once. The type is chosen when adding.
 */
import { AnimatePresence, motion } from 'motion/react'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Petals } from '@/components/brand'
import { AppHeader } from '@/components/shell'
import { Btn, Segmented, buzz, cx } from '@/components/ui'
import { GoalCheck } from '@/components/goal-check'
import { useApp, type Goal } from '@/lib/store'
import { kindOf, streak, week } from '@/lib/goals'

const IDEAS: { t: string; k: 'daily' | 'once' }[] = [
  { t: 'Sleep by 11 PM', k: 'daily' }, { t: 'Five slow breaths before work', k: 'daily' }, { t: 'Phone away at dinner', k: 'daily' },
  { t: 'Morning walk', k: 'daily' }, { t: 'Read one book this month', k: 'once' }, { t: 'Plan a day just for me', k: 'once' },
]

export default function Goals() {
  const goals = useApp((s) => s.goals)
  const add = useApp((s) => s.addGoal)
  const del = useApp((s) => s.removeGoal)
  const [t, setT] = useState('')
  const [kind, setKind] = useState<'daily' | 'once'>('daily')
  const [party, setParty] = useState(0)
  const daily = goals.filter((g) => kindOf(g) === 'daily'), once = goals.filter((g) => kindOf(g) === 'once')
  return (
    <main className="px-5 pb-32">
      {party > 0 && <Petals key={party} />}
      <AppHeader back />
      <h1 className="h-duo pt-2">Your <em>goals</em></h1>
      <p className="mt-1 text-[14px] text-muted">Daily habits to check in on, and bigger goals to tick off.</p>

      {daily.length > 0 && <h2 className="h-section mt-6">☀️ Daily check-in</h2>}
      <ul className="mt-3 space-y-3">
        <AnimatePresence initial={false}>
          {daily.map((g) => <GoalRow key={g.id} g={g} onDelete={() => del(g.id)} onParty={() => setParty(Date.now())} />)}
        </AnimatePresence>
      </ul>
      {once.length > 0 && <h2 className="h-section mt-6">🎯 Long-term goals</h2>}
      <ul className="mt-3 space-y-3">
        <AnimatePresence initial={false}>
          {once.map((g) => <GoalRow key={g.id} g={g} onDelete={() => del(g.id)} onParty={() => setParty(Date.now())} />)}
        </AnimatePresence>
      </ul>

      {goals.length < 5 && (
        <div className="card mt-6 p-4">
          <p className="mb-3 text-[15px] font-bold text-navy">Add a goal</p>
          <Segmented value={kind} onChange={setKind} options={[{ value: 'daily', label: '☀️ Daily' }, { value: 'once', label: '🎯 Long-term' }]} />
          <p className="mt-2 px-1 text-[12px] text-muted">{kind === 'daily' ? 'Check in each day you do it.' : 'Tick it off once, when you get there.'}</p>
          <form onSubmit={(e) => { e.preventDefault(); if (t.trim()) { add(t.trim(), kind); setT(''); buzz() } }} className="mt-3 flex gap-2">
            <input value={t} onChange={(e) => setT(e.target.value.slice(0, 60))} placeholder={kind === 'daily' ? 'e.g. Drink 8 glasses of water' : 'e.g. Run a 5 km'} aria-label="New goal" className="h-12 min-w-0 flex-1 rounded-full bg-peri-50 px-4 text-[16px] outline-none focus:ring-2 focus:ring-navy" />
            <Btn size="md" type="submit" disabled={!t.trim()}>Add</Btn>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {IDEAS.filter((i) => i.k === kind && !goals.some((g) => g.title === i.t)).map((i) => (
              <button key={i.t} onClick={() => add(i.t, i.k)} className="rounded-full bg-[#f6f1e8] px-3 py-1.5 text-[13px] font-semibold text-navy">+ {i.t}</button>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

function GoalRow({ g, onDelete, onParty }: { g: Goal; onDelete: () => void; onParty: () => void }) {
  const once = kindOf(g) === 'once'
  const s = streak(g)
  return (
    <motion.li layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: 60 }} className="card p-4">
      <div className="flex items-center gap-3">
        <GoalCheck g={g} onParty={onParty} />
        <div className="min-w-0 flex-1">
          <p className={cx('text-[16px] font-bold', once && g.done ? 'text-sage-text line-through decoration-sage/50' : 'text-navy')}>{g.title}</p>
          <p className="text-[12px] text-muted">{once ? (g.done ? 'Achieved' : 'Long-term goal · tick it off when you get there') : s ? `🔥 ${s}-day streak` : 'Check in today'}</p>
        </div>
        <button aria-label={`Remove ${g.title}`} onClick={onDelete} className="grid size-9 place-items-center rounded-full text-muted"><Trash2 className="size-4" /></button>
      </div>
      {!once && (
        <div className="mt-3 flex justify-between gap-1 pl-[60px]" aria-label="Last 7 days">
          {week(g).map((d, i) => (
            <span key={i} className="flex flex-col items-center gap-1">
              <span className={cx('size-6 rounded-full', d.on ? 'bg-navy' : 'bg-peri-50', d.today && 'ring-2 ring-navy/30 ring-offset-1')} />
              <span className="text-[10px] font-semibold text-muted">{d.day}</span>
            </span>
          ))}
        </div>
      )}
    </motion.li>
  )
}
