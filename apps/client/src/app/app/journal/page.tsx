'use client'
/**
 * @module   journal
 * @owner    CLIENT
 * @screens  CL-30 Journal — date · time · emotion + search (D-19 minimal), week row, daily bars + tooltip, insight
 */
import { AnimatePresence, motion } from 'motion/react'
import { Lightbulb, Plus, Search, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MoodImg } from '@/components/brand'
import { AppHeader } from '@/components/shell'
import { Item, Reveal, Sheet, Btn, ease, spring, toast, useChrome } from '@/components/ui'
import { MOOD_LIFT, moodOf } from '@/lib/data'
import { useApp, type JournalEntry } from '@/lib/store'
import { dayKey, fmtDay, fmtTime } from '@/lib/format'
import { dailyInsight, lastNDays, weekRow } from '@/lib/insights'
import { BP } from '@/lib/asset'

export default function Journal() {
  const journal = useApp((s) => s.journal)
  const { openLog, openEntry } = useChrome()
  const [q, setQ] = useState('')
  const [tip, setTip] = useState<number | null>(null)
  const week = weekRow(journal)
  const days = lastNDays(journal, 14)

  const groups = useMemo(() => {
    const ql = q.trim().toLowerCase()
    const list = journal.filter((e) => !ql || moodOf(e.emotion).label.toLowerCase().includes(ql) || (e.note ?? '').toLowerCase().includes(ql) || fmtDay(e.at).toLowerCase().includes(ql) || new Date(e.at).toLocaleDateString('en-IN', { month: 'long' }).toLowerCase().includes(ql))
    const m = new Map<string, JournalEntry[]>()
    for (const e of list) { const k = dayKey(e.at); m.set(k, [...(m.get(k) ?? []), e]) }
    return [...m.entries()]
  }, [journal, q])

  return (
    <main className="px-5 pb-32">
      <AppHeader />
      <Reveal className="space-y-4">
        <Item><h1 className="h-duo pt-2 text-[32px]">Your mood <em>journal</em></h1></Item>
        <Item>
          <label className="flex h-14 items-center gap-3 rounded-full bg-white px-5 shadow-[var(--shadow-card)] focus-within:ring-2 focus-within:ring-navy">
            <Search className="size-5 text-navy" aria-hidden />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search feelings, notes or dates" aria-label="Search feelings, notes or dates" className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-soft" />
            {q && <button aria-label="Clear search" onClick={() => setQ('')}><X className="size-4 text-muted" /></button>}
          </label>
        </Item>

        {!q && (
          <>
            <Item>
              <section className="card p-5">
                <h2 className="h-section">This week</h2>
                <div className="mt-3 flex justify-between">
                  {week.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...spring, delay: 0.15 + i * 0.05 }}
                        className={`grid size-11 place-items-center rounded-full ${d.mood ? '' : 'bg-[#f0f2f8]'} ${d.today ? 'ring-2 ring-navy ring-offset-2' : ''}`}>
                        {d.mood ? <MoodImg mood={d.mood} size={42} /> : <span className="text-[16px] text-soft">{d.future ? '' : '·'}</span>}
                      </motion.div>
                      <span className={`text-[12px] ${d.today ? 'font-bold text-navy' : 'text-muted'}`}>{d.date.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                    </div>
                  ))}
                </div>
              </section>
            </Item>

            <Item>
              <section className="card relative p-5" aria-labelledby="daily-h">
                <h2 id="daily-h" className="h-section">Daily mood</h2>
                <p className="text-[13px] text-muted">Last 14 days · tap a bar</p>
                <div className="relative mt-4 flex h-[150px] items-end gap-[6px] pl-1" onMouseLeave={() => setTip(null)}>
                  {days.map((d, i) => {
                    const h = d.mood ? 22 + MOOD_LIFT[d.mood] * 22 : 10
                    const on = tip === i
                    return (
                      <button key={i} aria-label={`${fmtDay(d.date)}: ${d.mood ? moodOf(d.mood).label : 'nothing logged'}`} onClick={() => setTip(on ? null : i)} className="relative flex h-full flex-1 items-end">
                        <motion.span className="block w-full rounded-full" style={{ background: d.mood ? (on ? '#182957' : moodOf(d.mood).color) : '#eef0f6' }}
                          initial={{ height: 0 }} animate={{ height: h }} transition={{ duration: 0.8, ease, delay: 0.25 + i * 0.035 }} />
                        <AnimatePresence>
                          {on && d.mood && (
                            <motion.span initial={{ opacity: 0, y: 6, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4 }} transition={spring}
                              className={`absolute bottom-full z-10 mb-2 w-[176px] rounded-[14px] bg-navy px-3 py-2 text-left text-[12px] leading-4 text-white shadow-[var(--shadow-float)] ${i > 9 ? 'right-0' : i < 4 ? 'left-0' : 'left-1/2 -translate-x-1/2'}`}>
                              You logged “{moodOf(d.mood).label}” {d.entries.length > 1 ? `${d.entries.length} times` : `at ${fmtTime(d.entries[0].at)}`} on {fmtDay(d.date)}.
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    )
                  })}
                </div>
                <div className="mt-2 flex justify-between px-1 text-[11px] text-soft tnum">
                  {days.map((d, i) => <span key={i} className="flex-1 text-center">{d.date.getDate()}</span>)}
                </div>
                <table className="sr-only"><caption>Daily mood, last 14 days</caption><tbody>{days.map((d, i) => <tr key={i}><td>{fmtDay(d.date)}</td><td>{d.mood ? moodOf(d.mood).label : 'none'}</td></tr>)}</tbody></table>
              </section>
            </Item>

            <Item>
              <div className="card flex items-start gap-3 p-5">
                <Lightbulb className="mt-0.5 size-5 shrink-0 text-gold" />
                <p className="text-[14px] leading-6"><b className="text-navy">Your daily insight</b> — {dailyInsight(journal)}</p>
              </div>
            </Item>
          </>
        )}

        <Item>
          {groups.length === 0 ? (
            <div className="card flex flex-col items-center p-8 text-center">
              <img src={`${BP}/img/owl-read.webp`} alt="" className="h-28" />
              <p className="mt-3 text-[15px] font-semibold text-navy">{q ? `Nothing for “${q}”` : 'Your journal is waiting'}</p>
              <p className="mt-1 text-[14px] text-muted">{q ? 'Try a feeling like “calm” or a day like “Mon”.' : 'Tap + to log your first feeling.'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map(([k, es]) => (
                <section key={k} aria-label={fmtDay(es[0].at)}>
                  <h3 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-[0.1em] text-muted">{dayKey(new Date()) === k ? 'Today' : fmtDay(es[0].at)}</h3>
                  <ul className="card divide-y divide-line px-4">
                    <AnimatePresence initial={false}>
                      {es.map((e) => (
                        <motion.li key={e.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                          <button onClick={() => openEntry(e.id)} className="flex w-full items-center gap-3 py-3 text-left">
                            <span className="grid size-12 place-items-center rounded-[16px]" style={{ background: moodOf(e.emotion).color + '55' }}>
                              <span className="text-[11px] font-bold leading-none text-navy">{new Date(e.at).getDate()}<br /><span className="font-medium">{new Date(e.at).toLocaleDateString('en-IN', { month: 'short' })}</span></span>
                            </span>
                            <span className="min-w-0 flex-1"><span className="block text-[15px] font-bold text-navy">{moodOf(e.emotion).label} <span className="font-medium text-muted">· {fmtTime(e.at)}</span></span>
                              {e.note ? <span className="line-clamp-2 block text-[13px] leading-5 text-ink/80">“{e.note}”</span> : <span className="text-[12px] font-semibold text-peri">+ Add a note</span>}</span>
                            <MoodImg mood={e.emotion} size={40} />
                          </button>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </section>
              ))}
            </div>
          )}
        </Item>
      </Reveal>

      <motion.button aria-label="Log a feeling" onClick={openLog} whileTap={{ scale: 0.9 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring, delay: 0.4 }}
        className="fixed bottom-28 right-[max(20px,calc(50vw-220px))] z-30 grid size-14 place-items-center rounded-full bg-[linear-gradient(135deg,#182957,#5e7fb8)] text-white shadow-[var(--shadow-float)]">
        <Plus className="size-6" />
      </motion.button>

    </main>
  )
}
