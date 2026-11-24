'use client'
/**
 * @module   sharing
 * @owner    CLIENT
 * Purpose:  owner 2026-11-24: a preview of the share card with Share (system sheet: WhatsApp, Instagram stories, …),
 *           WhatsApp, Copy link and Save image. Used for stories and for the review card.
 */
import { AnimatePresence, motion } from 'motion/react'
import { Download, Link2, Share2, X } from 'lucide-react'
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

const IG = <svg viewBox="0 0 24 24" className="size-6" aria-hidden><defs><linearGradient id="igg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#FEDA75" /><stop offset=".35" stopColor="#FA7E1E" /><stop offset=".6" stopColor="#D62976" /><stop offset=".85" stopColor="#962FBF" /><stop offset="1" stopColor="#4F5BD5" /></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#igg)" /><rect x="6.5" y="6.5" width="11" height="11" rx="5.5" fill="none" stroke="#fff" strokeWidth="1.8" /><circle cx="17.3" cy="6.7" r="1.2" fill="#fff" /></svg>
const WA = <svg viewBox="0 0 24 24" className="size-6" aria-hidden><circle cx="12" cy="12" r="11" fill="#25D366" /><path fill="#fff" d="M12 5.2a6.8 6.8 0 0 0-5.9 10.2L5.2 18.8l3.5-.9A6.8 6.8 0 1 0 12 5.2Zm3.6 9.6c-.15.42-.88.8-1.22.83-.33.04-.66.06-2.23-.55-1.9-.75-3.1-2.7-3.2-2.83-.08-.13-.75-1-.75-1.97s.48-1.37.67-1.56c.16-.18.35-.2.47-.2h.34c.12 0 .27-.01.42.35l.55 1.35c.05.1.08.23.01.36l-.27.42-.27.3c-.09.11-.18.22-.07.42.12.2.53.86 1.13 1.4.77.69 1.43.9 1.63 1 .2.1.33.08.44-.05l.62-.73c.13-.18.27-.15.45-.09l1.3.62c.19.09.32.14.37.22.05.1.05.5-.12.98Z" /></svg>
const GOOGLE = <svg viewBox="0 0 24 24" className="size-5" aria-hidden><path fill="#4285F4" d="M22.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-7.9Z" /><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z" /><path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.7-2.8Z" /><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.6l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4Z" /></svg>

/**
 * owner 2026-11-24: after 4 or 5 star feedback, a full screen with the review card itself, share icons
 * (Instagram, WhatsApp, More, Save, Copy link) and, instead, "Write a Google review".
 */
export function ShareScreen({ open, onClose, title, sub, make, deps = '', controls, filename, shareTitle, text, url, googleUrl }: {
  open: boolean; onClose: () => void; title: ReactNode; sub?: string; make: () => Promise<Blob>; deps?: string; controls?: ReactNode; filename: string
  shareTitle: string; text: string; url: string; googleUrl?: string
}) {
  const [blob, setBlob] = useState<Blob>()
  const [src, setSrc] = useState<string>()
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); setBlob(undefined); setSrc((u) => { if (u) URL.revokeObjectURL(u); return undefined }) }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  // (re)draw the card whenever an option changes; the old preview stays until the new one is ready
  useEffect(() => {
    if (!open) return
    let alive = true
    setFailed(false)
    const t = setTimeout(() => {
      make().then((b) => { if (!alive) return; const u = URL.createObjectURL(b); setBlob(b); setSrc((old) => { if (old) URL.revokeObjectURL(old); return u }) }).catch(() => alive && setFailed(true))
    }, 120)
    return () => { alive = false; clearTimeout(t) }
  }, [open, deps]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => { if (!src) return; const a = document.createElement('a'); a.href = src; a.download = filename; a.click(); toast('Image saved') }
  const system = async () => {
    buzz(8)
    const r = await shareCard({ blob, filename, title: shareTitle, text, url })
    if (r === 'unsupported') { save(); toast('Image saved. Share it from your photos.') }
  }
  // Instagram has no web link that accepts an image: the phone's share sheet (choose Instagram) does, else we save the image
  const insta = async () => {
    buzz(8)
    const r = await shareCard({ blob, filename, title: shareTitle, text, url })
    if (r === 'unsupported') { save(); toast('Image saved. Open Instagram and add it to your story.') }
  }
  const copy = async () => { try { await navigator.clipboard.writeText(url); toast('Link copied') } catch { toast(url) } }
  const items = [
    { k: 'ig', label: 'Instagram', icon: IG, on: insta },
    { k: 'wa', label: 'WhatsApp', icon: WA, href: waLink(text, url) },
    { k: 'more', label: 'More', icon: <Share2 className="size-5 text-navy" />, on: system },
    { k: 'save', label: 'Save', icon: <Download className="size-5 text-navy" />, on: save },
    { k: 'copy', label: 'Copy link', icon: <Link2 className="size-5 text-navy" />, on: copy },
  ]

  return (
    <AnimatePresence>
      {open && (
        <motion.div role="dialog" aria-modal="true" aria-label="Share your experience" className="fixed inset-0 z-[60] mx-auto flex max-w-[480px] flex-col overflow-y-auto bg-[linear-gradient(170deg,#FFF6EA_0%,#FDE9F0_45%,#EEEAFF_100%)] px-5 pb-[max(env(safe-area-inset-bottom),18px)] pt-[max(env(safe-area-inset-top),12px)]"
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#8a4b6b]">Thank you 🌸</p>
            <button onClick={onClose} aria-label="Close" className="grid size-11 place-items-center rounded-full bg-white/80 text-navy shadow-[var(--shadow-card)]"><X className="size-5" /></button>
          </div>
          <h2 className="h-duo mt-1 text-[28px]">{title}</h2>
          {sub && <p className="mt-0.5 text-[14px] text-ink-2">{sub}</p>}

          <div className="my-3 flex min-h-0 flex-1 items-center justify-center">
            <div className="aspect-[9/16] h-full max-h-[48svh] min-h-[240px] overflow-hidden rounded-[24px] bg-white/60 shadow-[0_24px_60px_rgba(90,60,140,.25)] ring-4 ring-white">
              {src ? <motion.img key={src} initial={{ opacity: 0.4, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 20 }} src={src} alt="Share card preview" className="size-full object-cover" />
                : <div className="grid size-full place-items-center px-6 text-center text-[13px] text-muted">{failed ? 'Could not make the image' : 'Making your card…'}</div>}
            </div>
          </div>

          {controls}
          <div className="mt-3 flex justify-between gap-1" role="group" aria-label="Share to">
            {items.map((x) => {
              const inner = <><span className="grid size-[54px] place-items-center rounded-full bg-white shadow-[var(--shadow-card)]">{x.icon}</span><span className="text-[11px] font-semibold text-ink">{x.label}</span></>
              return x.href
                ? <a key={x.k} href={x.href} target="_blank" rel="noopener noreferrer" aria-label={x.label} className="flex w-[64px] flex-col items-center gap-1.5">{inner}</a>
                : <button key={x.k} onClick={x.on} disabled={!src && x.k !== 'copy'} aria-label={x.label} className="flex w-[64px] flex-col items-center gap-1.5 disabled:opacity-50">{inner}</button>
            })}
          </div>

          {googleUrl && <>
            <div className="my-3 flex items-center gap-3 text-[12px] font-semibold text-muted" aria-hidden><span className="h-px flex-1 bg-[#d9d3ea]" />or<span className="h-px flex-1 bg-[#d9d3ea]" /></div>
            <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="flex h-[52px] items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-ink shadow-[var(--shadow-card)]">{GOOGLE} Write a Google review instead</a>
          </>}
          <button onClick={onClose} className="mt-2 h-11 text-[15px] font-semibold text-navy">Done</button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
