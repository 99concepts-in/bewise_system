/**
 * @module   member-notes
 * @owner    CLIENT (UI) · FOUNDATION + CONSULTANT own messages.send / messages.list / readAt (request 20261124-member-notes)
 * Purpose:  owner 2026-11-24: a personal chat with Jitendra Khimlani: how I feel, a thank-you note, or something else.
 *           Sent → delivered → read, shown with ticks. In this standalone preview there is no server yet, so
 *           usePreviewReceipts marks a note delivered after a moment and read a little later, only to show the states.
 */
import { useEffect } from 'react'
import { useApp, type NoteMsg } from './store'
import { moodOf, type Emotion } from './data'

export type Topic = NonNullable<NoteMsg['topic']>
export const TOPICS: { id: Topic; label: string; emoji: string; hint: string }[] = [
  { id: 'feeling', label: 'How I feel', emoji: '😊', hint: 'Share how you are feeling today' },
  { id: 'gratitude', label: 'Say thank you', emoji: '🙏', hint: 'A small thank-you note' },
  { id: 'other', label: 'Something else', emoji: '✍️', hint: 'Anything on your mind' },
]

export const feelingLine = (mood: Emotion) => `Today I’m feeling ${moodOf(mood).label.toLowerCase()}.`
export const GRATITUDE_START = 'Thank you, Jitu bhaiya. '

export type Receipt = 'sent' | 'delivered' | 'read'
export const receiptOf = (m: NoteMsg): Receipt => (m.readAt ? 'read' : m.deliveredAt ? 'delivered' : 'sent')

/** preview only: delivered after 1.5 s, read after 12 s. The server sets both in production. */
export function usePreviewReceipts() {
  const notes = useApp((s) => s.notes)
  const markNote = useApp((s) => s.markNote)
  const pending = (notes ?? []).some((m) => m.from === 'me' && !m.readAt)
  useEffect(() => {
    if (!pending) return
    const tick = () => {
      const now = Date.now()
      for (const m of useApp.getState().notes ?? []) {
        if (m.from !== 'me' || m.readAt) continue
        const age = now - +new Date(m.at)
        if (!m.deliveredAt && age > 1500) markNote(m.id, { deliveredAt: new Date(+new Date(m.at) + 1500).toISOString() })
        if (age > 12_000) markNote(m.id, { readAt: new Date(+new Date(m.at) + 12_000).toISOString() })
      }
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [pending, markNote])
}
