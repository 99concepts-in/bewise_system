'use client'
/**
 * @module   sharing
 * @owner    CLIENT
 * Purpose:  owner 2026-11-24: a preview of the share card with Share (system sheet: WhatsApp, Instagram stories, …),
 *           WhatsApp, Copy link and Save image. Used for stories and for the review card.
 */
import { motion } from 'motion/react'
import { Download, Link2, Share2 } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Sheet, buzz, toast } from './ui'
import { shareCard, waLink } from '@/lib/share'

export function ShareSheet({ open, onClose, heading, sub, make, filename, shareTitle, text, url, extra }: {
  open: boolean; onClose: () => void; heading: ReactNode; sub?: string; make: () => Promise<Blob>; filename: string
  shareTitle: string; text: string; url: string; extra?: ReactNode
}) {
  const [blob, setBlob] = useState<Blob>()
  const [src, setSrc] = useState<string>()
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!open) return
    let alive = true, u = ''
    setFailed(false)
    make().then((b) => { if (!alive) return; u = URL.createObjectURL(b); setBlob(b); setSrc(u) }).catch(() => alive && setFailed(true))
    return () => { alive = false; if (u) URL.revokeObjectURL(u); setBlob(undefined); setSrc(undefined) }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const share = async () => {
    buzz(8)
    const r = await shareCard({ blob, filename, title: shareTitle, text, url })
    if (r === 'unsupported') { window.open(waLink(text, url), '_blank', 'noopener'); }
  }
  const copy = async () => { try { await navigator.clipboard.writeText(url); toast('Link copied') } catch { toast(url) } }
  const save = () => { if (!src) return; const a = document.createElement('a'); a.href = src; a.download = filename; a.click(); toast('Image saved') }

  return (
    <Sheet open={open} onClose={onClose} title="Share" tall>
      <h2 className="h-duo pr-12 text-[24px]">{heading}</h2>
      {sub && <p className="mt-1 text-[14px] text-ink-2">{sub}</p>}
      <div className="mx-auto mt-4 aspect-[9/16] w-[52%] max-w-[220px] overflow-hidden rounded-[20px] bg-peri-50 shadow-[var(--shadow-float)]">
        {src ? <motion.img initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} src={src} alt="Share card preview" className="size-full object-cover" />
          : <div className="grid size-full place-items-center text-[13px] text-muted">{failed ? 'Could not make the image' : 'Making your card…'}</div>}
      </div>
      <button onClick={share} disabled={!src && !failed} className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-navy text-[16px] font-semibold text-white shadow-[var(--shadow-cta)] disabled:opacity-60">
        <Share2 className="size-5" /> Share
      </button>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <a href={waLink(text, url)} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-1.5 rounded-full bg-[#e7f7ee] text-[14px] font-semibold text-[#146c3c]">
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.4 1.8 2.2 1.2 1.1 2.2 1.4 2.5 1.6.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.2Z" /></svg>
          WhatsApp
        </a>
        <button onClick={copy} className="flex h-12 items-center justify-center gap-1.5 rounded-full bg-peri-50 text-[14px] font-semibold text-navy"><Link2 className="size-4" /> Copy link</button>
        <button onClick={save} disabled={!src} className="flex h-12 items-center justify-center gap-1.5 rounded-full bg-peri-50 text-[14px] font-semibold text-navy disabled:opacity-50"><Download className="size-4" /> Save image</button>
      </div>
      {extra}
      <p className="mt-3 pb-2 text-center text-[12px] text-muted">For Instagram stories, tap Share and choose Instagram.</p>
    </Sheet>
  )
}
