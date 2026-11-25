'use client'
/**
 * @module   member-notes
 * @owner    CLIENT
 * @screens  Personal chat with Jitendra Khimlani (owner 2026-11-24)
 * Members choose how they feel, send a thank-you note, or write anything else. Each sent note shows ticks:
 * one grey (sent), two grey (delivered), two blue + "Read" (he opened it). Opened from the Home card,
 * from the note popup after a mood log (?topic=feeling&mood=calm), or from Me.
 * Server: messages.send / messages.list / readAt (request 20261124-member-notes). Preview receipts: lib/notes.ts.
 */
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, Check, CheckCheck } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import { AppHeader } from '@/components/shell'
import { MoodImg } from '@/components/brand'
import { Verified } from '@/components/verified'
import { buzz, cx, spring } from '@/components/ui'
import { BP } from '@/lib/asset'
import { MOODS, PRIMARY_MOODS, moodOf, type Emotion } from '@/lib/data'
import { useApp, type NoteMsg } from '@/lib/store'
import { fmtDay, fmtTime, dayKey } from '@/lib/format'
import { GRATITUDE_START, TOPICS, feelingLine, receiptOf, usePreviewReceipts, type Topic } from '@/lib/notes'

export default function Page() { return <Suspense><Chat /></Suspense> }

function Chat() {
  const params = useSearchParams()
  const notes = useApp((s) => s.notes) ?? []
  const sendNote = useApp((s) => s.sendNote)
  const [topic, setTopic] = useState<Topic | null>(null)
  const [mood, setMood] = useState<Emotion | null>(null)
  const [valence, setValence] = useState<number | undefined>()
  const [text, setText] = useState('')
  const input = useRef<HTMLTextAreaElement>(null)
  const end = useRef<HTMLDivElement>(null)
  usePreviewReceipts()

  // arriving from a mood log or a Home chip: preselect the topic (and the feeling)
  useEffect(() => {
    const t = params.get('topic') as Topic | null
    const m = params.get('mood') as Emotion | null
    const v = Number(params.get('v')) || undefined
    if (t && TOPICS.some((x) => x.id === t)) pickTopic(t, m && MOODS.some((x) => x.key === m) ? m : null, v)
  }, [params]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [notes.length])

  function pickTopic(t: Topic, m: Emotion | null = null, v?: number) {
    buzz(6); setTopic(t); setMood(m); setValence(v)
    setText(t === 'feeling' ? (m ? feelingLine(m) + ' ' : '') : t === 'gratitude' ? GRATITUDE_START : '')
    window.setTimeout(() => { const el = input.current; if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length) } }, 60)
  }
  const pickMood = (m: Emotion) => {
    buzz(6); setMood(m)
    setText((t) => { const rest = t.replace(/^Today I’m feeling [^.]*\.\s*/, ''); return feelingLine(m) + ' ' + rest })
  }
  const send = () => {
    const t = text.trim(); if (!t) return
    sendNote({ text: t, topic: topic ?? 'other', ...(topic === 'feeling' && mood ? { mood, valence } : {}) })
    buzz(12); setText(''); setTopic(null); setMood(null); setValence(undefined)
  }

  const lastRead = [...notes].reverse().find((m) => m.from === 'me' && m.readAt)

  return (
    <main className="flex min-h-dvh flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+190px)]">
      <AppHeader back title="Jitendra Khimlani" />

      <section className="mt-1 flex flex-col items-center text-center">
        <span className="relative">
          <img src={`${BP}/img/jitu-portrait.webp`} alt="" className="size-[84px] rounded-full object-cover object-[50%_30%] ring-4 ring-white shadow-[var(--shadow-card)]" />
        </span>
        <h1 className="mt-2 flex items-center gap-1 font-display text-[20px] font-semibold text-ink">Jitendra Khimlani <Verified size={18} /></h1>
        <p className="text-[13px] text-ink-2">Certified Bach Flower Remedy Therapist</p>
        <p className="mt-3 max-w-[320px] rounded-[18px] bg-white/80 px-4 py-2.5 text-[13px] leading-5 text-ink-2 shadow-[var(--shadow-card)]">
          Your personal space with Jitendra Khimlani. Share how you feel, a thank-you, or anything on your mind. He reads every note and usually replies within a day.
        </p>
      </section>

      <ol className="mt-5 flex flex-1 flex-col gap-2" aria-label="Messages">
        {notes.map((m, i) => {
          const prev = notes[i - 1]
          const newDay = !prev || dayKey(prev.at) !== dayKey(m.at)
          return (
            <li key={m.id} className="flex flex-col">
              {newDay && <p className="my-2 self-center rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold text-muted">{dayKey(m.at) === dayKey(new Date()) ? 'Today' : fmtDay(m.at)}</p>}
              <Bubble m={m} showRead={m.id === lastRead?.id} />
            </li>
          )
        })}
      </ol>
      <div ref={end} />

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] bg-gradient-to-t from-sky-50 via-sky-50/95 to-transparent px-4 pb-2 pt-6 safe-b">
        <AnimatePresence initial={false}>
          {topic === 'feeling' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="no-scrollbar -mx-4 mb-2 flex gap-2 overflow-x-auto px-4" role="group" aria-label="How do you feel?">
              {PRIMARY_MOODS.map((k) => (
                <button key={k} onClick={() => pickMood(k)} aria-pressed={mood === k} className={cx('flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-[13px] font-semibold ring-1 transition-colors', mood === k ? 'bg-navy text-white ring-navy' : 'bg-white text-navy ring-[#e3e6ef]')}>
                  <MoodImg mood={k} size={26} /> {moodOf(k).label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="no-scrollbar -mx-4 mb-2 flex gap-2 overflow-x-auto px-4" role="group" aria-label="What would you like to send?">
          {TOPICS.map((t) => (
            <button key={t.id} onClick={() => pickTopic(t.id)} aria-pressed={topic === t.id}
              className={cx('shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors', topic === t.id ? 'bg-navy text-white' : 'bg-white text-navy shadow-[var(--shadow-card)]')}>
              <span aria-hidden>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send() }} className="flex items-end gap-2 rounded-[28px] bg-white py-2 pl-4 pr-2 shadow-[var(--shadow-float)]">
          <textarea ref={input} value={text} onChange={(e) => setText(e.target.value.slice(0, 1000))} rows={1} aria-label="Message Jitendra Khimlani"
            placeholder={TOPICS.find((t) => t.id === topic)?.hint ?? 'Write a note…'} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer: fine)').matches) { e.preventDefault(); send() } }}
            className="max-h-32 min-h-12 flex-1 resize-none bg-transparent py-3 text-[16px] leading-6 outline-none [field-sizing:content] placeholder:text-soft" />
          <motion.button type="submit" aria-label="Send" whileTap={{ scale: 0.85 }} disabled={!text.trim()} animate={{ scale: text.trim() ? 1 : 0.85, opacity: text.trim() ? 1 : 0.5 }}
            className="grid size-12 shrink-0 place-items-center rounded-full bg-navy text-white">
            <ArrowUp className="size-5" />
          </motion.button>
        </form>
      </div>
    </main>
  )
}

function Bubble({ m, showRead }: { m: NoteMsg; showRead: boolean }) {
  const mine = m.from === 'me'
  const r = receiptOf(m)
  const t = TOPICS.find((x) => x.id === m.topic)
  return (
    <motion.div initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring} className={cx('flex max-w-[84%] flex-col', mine ? 'items-end self-end' : 'items-start self-start')}>
      <div className={cx('rounded-[22px] px-4 py-2.5 text-[15px] leading-[22px]', mine ? 'rounded-br-md bg-navy text-white' : 'rounded-bl-md bg-white text-ink shadow-[var(--shadow-card)]')}>
        {m.mood ? (
          <span className={cx('mb-1.5 flex w-max items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2.5 text-[12px] font-bold', mine ? 'bg-white/15' : 'bg-peri-50 text-navy')}>
            <MoodImg mood={m.mood} size={22} /> Feeling {moodOf(m.mood).label.toLowerCase()}
          </span>
        ) : t && t.id !== 'other' ? (
          <span className={cx('mb-1.5 block w-max rounded-full px-2.5 py-0.5 text-[12px] font-bold', mine ? 'bg-white/15' : 'bg-peri-50 text-navy')}>{t.emoji} {t.id === 'gratitude' ? 'Thank-you note' : t.label}</span>
        ) : null}
        <p className="whitespace-pre-wrap break-words">{m.text}</p>
      </div>
      <p className="mt-1 flex items-center gap-1 px-1 text-[11px] font-semibold text-muted">
        {fmtTime(m.at)}
        {mine && (
          <span className={cx('inline-flex items-center', r === 'read' ? 'text-[#2f8be0]' : 'text-muted')} aria-label={r === 'read' ? 'Read' : r === 'delivered' ? 'Delivered' : 'Sent'} role="img">
            {r === 'sent' ? <Check className="size-3.5" strokeWidth={2.6} /> : <CheckCheck className="size-3.5" strokeWidth={2.6} />}
          </span>
        )}
      </p>
      {showRead && m.readAt && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-1 text-[11px] font-semibold text-[#2f8be0]">Read by Jitendra Khimlani · {fmtTime(m.readAt)}</motion.p>}
    </motion.div>
  )
}
