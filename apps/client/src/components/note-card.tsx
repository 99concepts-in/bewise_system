'use client'
/**
 * @module   member-notes
 * @owner    CLIENT
 * @screens  CL-08 Home "Send a note to Jitendra Khimlani" card · the note popup after every mood log (owner 2026-11-24)
 */
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { CheckCheck, ChevronRight, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { MoodImg } from './brand'
import { Verified } from './verified'
import { Sheet, buzz, type NoteAskReq } from './ui'
import { BP } from '@/lib/asset'
import { moodOf, type Emotion } from '@/lib/data'
import { useApp } from '@/lib/store'
import { fmtTime } from '@/lib/format'
import { TOPICS, receiptOf, usePreviewReceipts } from '@/lib/notes'

export function NoteCard() {
  const notes = useApp((s) => s.notes) ?? []
  const still = useReducedMotion()
  usePreviewReceipts()
  const last = notes[notes.length - 1]
  const r = last && last.from === 'me' ? receiptOf(last) : null
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(150deg,#E8F1FF_0%,#F1E9FF_55%,#FFE9F0_100%)] p-5 shadow-[var(--shadow-card)]" aria-labelledby="note-h">
      <motion.span aria-hidden className="pointer-events-none absolute -right-6 -top-6 text-[88px] leading-none opacity-[0.16]" animate={still ? undefined : { rotate: [0, 8, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}>💌</motion.span>
      <div className="relative flex items-center gap-3">
        <span className="relative shrink-0">
          <img src={`${BP}/img/jitu-portrait.webp`} alt="" className="size-[58px] rounded-full object-cover object-[50%_30%] ring-[3px] ring-white" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="note-h" className="font-display text-[19px] font-semibold leading-6 text-ink">Send a note to Jitendra Khimlani</h2>
          <p className="mt-0.5 flex items-center gap-1 text-[12px] font-semibold text-ink-2">Your personal chat <Verified size={14} /></p>
        </div>
      </div>

      {last ? (
        <Link href="/app/chat" className="relative mt-3 flex items-center gap-2 rounded-[18px] bg-white/80 px-3.5 py-2.5">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] text-ink">{last.from === 'me' ? 'You: ' : ''}{last.text}</span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-muted">
              {fmtTime(last.at)}
              {r && <span className={r === 'read' ? 'inline-flex items-center gap-0.5 text-[#2f8be0]' : 'inline-flex items-center gap-0.5'}>· {r === 'sent' ? <Check className="size-3.5" /> : <CheckCheck className="size-3.5" />}{r === 'read' ? 'Read' : r === 'delivered' ? 'Delivered' : 'Sent'}</span>}
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-navy" />
        </Link>
      ) : (
        <p className="relative mt-3 text-[14px] leading-5 text-ink-2">Tell him how you feel, say thank you, or share anything on your mind.</p>
      )}

      <div className="relative mt-3 grid grid-cols-3 gap-2">
        {TOPICS.map((t, i) => (
          <motion.div key={t.id} whileTap={{ scale: 0.96 }}>
            <Link href={`/app/chat?topic=${t.id}`} onClick={() => buzz(6)} className="flex h-full flex-col items-center gap-1 rounded-[18px] bg-white px-1.5 py-3 text-center shadow-[0_4px_12px_rgba(60,50,120,.06)]">
              <motion.span className="text-[24px] leading-none" aria-hidden animate={still ? undefined : { y: [0, -3, 0] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}>{t.emoji}</motion.span>
              <span className="text-[12px] font-bold leading-4 text-navy">{t.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

/** owner 2026-11-24: after a mood log, offer to send a note to Jitendra Khimlani, at most once a day. */
export function NoteAsk({ ask, onClose }: { ask: NoteAskReq | null; onClose: () => void }) {
  const router = useRouter()
  const m = ask?.mood ? moodOf(ask.mood) : null
  return (
    <Sheet open={!!ask} onClose={onClose} title="Send a note">
      {ask && (
        <div className="pb-2 text-center">
          <div className="relative mx-auto w-max">
            <img src={`${BP}/img/jitu-portrait.webp`} alt="" className="size-[76px] rounded-full object-cover object-[50%_30%] ring-4 ring-white shadow-[var(--shadow-card)]" />
            <motion.span className="absolute -bottom-1 -right-3 grid size-[38px] place-items-center rounded-full bg-white text-[20px] shadow-[var(--shadow-card)]" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 14 }}>
              {ask.mood ? <MoodImg mood={ask.mood} size={38} /> : <span aria-hidden>🌸</span>}
            </motion.span>
          </div>
          <h2 className="h-duo mt-3 text-[24px]">Send a note to <em>Jitendra Khimlani?</em></h2>
          <p className="mx-auto mt-1.5 max-w-[300px] text-[14px] leading-5 text-ink-2">{ask.lastDose
              ? `All your drops are done for today${m ? `, and you felt ${m.label.toLowerCase()}` : ''}. Tell him how your day went. He reads every note.`
              : `You felt ${m?.label.toLowerCase() ?? 'something'}. Let him know how you are doing. He reads every note.`}</p>
          <button onClick={() => { buzz(8); onClose(); router.push(ask.mood ? `/app/chat?topic=feeling&mood=${ask.mood}${ask.valence ? `&v=${ask.valence}` : ''}` : '/app/chat?topic=feeling') }}
            className="mt-5 flex h-[52px] w-full items-center justify-center rounded-full bg-navy text-[16px] font-semibold text-white shadow-[var(--shadow-cta)] active:scale-[0.98]">Send a note</button>
          <button onClick={onClose} className="mt-2 h-12 w-full rounded-full text-[15px] font-semibold text-navy">Not now</button>
        </div>
      )}
    </Sheet>
  )
}
