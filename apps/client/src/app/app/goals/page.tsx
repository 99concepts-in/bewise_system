'use client'
/** @module journal @owner CLIENT @screens CL-31 Goals — up to 3, separate from the journal (D-19) */
import { AnimatePresence, motion } from 'motion/react'
import { Check, Minus, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Petals } from '@/components/brand'
import { AppHeader } from '@/components/shell'
import { Btn, Ring, buzz, toast } from '@/components/ui'
import { useApp } from '@/lib/store'

const IDEAS = ['Sleep by 11 PM', 'Morning walk 3× a week', 'Five slow breaths before work', 'Phone away at dinner']

export default function Goals() {
  const goals = useApp((s) => s.goals)
  const add = useApp((s) => s.addGoal)
  const upd = useApp((s) => s.updateGoal)
  const del = useApp((s) => s.removeGoal)
  const [t, setT] = useState('')
  const [party, setParty] = useState(0)
  const bump = (id: string, p: number, d: number) => {
    const n = Math.max(0, Math.min(100, p + d)); buzz(6); upd(id, { progress: n, done: n === 100 })
    if (n === 100 && p < 100) { setParty(Date.now()); toast('Goal complete. Well done!') }
  }
  return (
    <main className="px-5 pb-32">
      {party > 0 && <Petals key={party} />}
      <AppHeader back />
      <h1 className="h-duo pt-2">Your <em>goals</em></h1>
      <p className="mt-1 text-[14px] text-muted">Up to three small things that matter to you.</p>
      <ul className="mt-5 space-y-3">
        <AnimatePresence initial={false}>
          {goals.map((g) => (
            <motion.li key={g.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: 60 }} className="card flex items-center gap-4 p-4">
              <Ring value={g.progress / 100} size={66} stroke={7} color={g.done ? '#82977e' : '#182957'}>
                {g.done ? <Check className="size-6 text-sage" strokeWidth={3} /> : <span className="text-[14px] font-bold text-navy tnum">{g.progress}%</span>}
              </Ring>
              <div className="flex-1">
                <p className={`text-[16px] font-bold ${g.done ? 'text-sage-text' : 'text-navy'}`}>{g.title}</p>
                <div className="mt-2 flex gap-2">
                  <button aria-label="Less progress" onClick={() => bump(g.id, g.progress, -10)} className="grid size-9 place-items-center rounded-full bg-peri-50 text-navy"><Minus className="size-4" /></button>
                  <button aria-label="More progress" onClick={() => bump(g.id, g.progress, 10)} className="grid size-9 place-items-center rounded-full bg-navy text-white"><Plus className="size-4" /></button>
                  <button aria-label="Remove goal" onClick={() => del(g.id)} className="ml-auto grid size-9 place-items-center rounded-full text-muted"><Trash2 className="size-4" /></button>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {goals.length < 3 && (
        <div className="card mt-4 p-4">
          <form onSubmit={(e) => { e.preventDefault(); if (t.trim()) { add(t.trim()); setT(''); buzz() } }} className="flex gap-2">
            <input value={t} onChange={(e) => setT(e.target.value.slice(0, 60))} placeholder="Add a goal…" aria-label="New goal" className="h-12 min-w-0 flex-1 rounded-full bg-peri-50 px-4 text-[16px] outline-none focus:ring-2 focus:ring-navy" />
            <Btn size="md" type="submit" disabled={!t.trim()}>Add</Btn>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">{IDEAS.filter((i) => !goals.some((g) => g.title === i)).map((i) => <button key={i} onClick={() => add(i)} className="rounded-full bg-[#f6f1e8] px-3 py-1.5 text-[13px] font-semibold text-navy">+ {i}</button>)}</div>
        </div>
      )}
    </main>
  )
}
