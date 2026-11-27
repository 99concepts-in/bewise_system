'use client'
/**
 * @module   sharing
 * @owner    CLIENT
 * Purpose:  owner 2026-11-24: a preview of the share card with Share (system sheet: WhatsApp, Instagram stories, …),
 *           WhatsApp, Copy link and Save image. Used for stories and for the review card.
 */
import { AnimatePresence, motion } from 'motion/react'
import { Download, Link2, PenLine, Share2, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Sheet, buzz, cx, toast } from './ui'
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

const GOOGLE = <svg viewBox="0 0 24 24" className="size-5" aria-hidden><path fill="#4285F4" d="M22.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-7.9Z" /><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z" /><path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.7-2.8Z" /><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.6l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4Z" /></svg>

/**
 * owner 2026-11-24/25: after 4 or 5 star feedback, a full screen to share the review card.
 *   · Swipe between card styles (each a real preview), dots + style name underneath.
 *   · One main button: Share (the phone's share sheet with the image: WhatsApp, Instagram, save… all live there).
 *   · owner 2026-11-27: the only other button is "Review on Google".
 *   · Google: no app can pre-fill a Google review, so we copy their words first, then open the Google review page to paste.
 */
export function ShareScreen({ open, onClose, title, variants, variant, onVariant, make, deps = '', editPanel, filename, shareTitle, text, url, googleUrl, googleText }: {
  open: boolean; onClose: () => void; title: ReactNode
  variants?: { id: string; label: string; bg?: string; dark?: boolean }[]; variant?: string; onVariant?: (id: string) => void
  make: (variant?: string) => Promise<Blob>; deps?: string; editPanel?: ReactNode; filename: string
  shareTitle: string; text: string; url: string; googleUrl?: string; googleText?: string
}) {
  const [editing, setEditing] = useState(false)
  const list: { id: string; label: string; bg?: string; dark?: boolean }[] = variants?.length ? variants : [{ id: '', label: '' }]
  const [imgs, setImgs] = useState<Record<string, { blob: Blob; src: string }>>({})
  const [failed, setFailed] = useState(false)
  const rail = useRef<HTMLDivElement>(null)
  const idx = Math.max(0, list.findIndex((v) => v.id === (variant ?? '')))
  const cur = imgs[list[idx].id]

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); setImgs((m) => { Object.values(m).forEach((x) => URL.revokeObjectURL(x.src)); return {} }) }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  // draw every style whenever the content changes; old previews stay until the new ones are ready
  useEffect(() => {
    if (!open) return
    let alive = true
    setFailed(false)
    const t = setTimeout(async () => {
      for (const v of list) {
        try {
          const b = await make(v.id || undefined); if (!alive) return
          const u = URL.createObjectURL(b)
          setImgs((m) => { if (m[v.id]) URL.revokeObjectURL(m[v.id].src); return { ...m, [v.id]: { blob: b, src: u } } })
        } catch { if (alive) setFailed(true) }
      }
    }, 120)
    return () => { alive = false; clearTimeout(t) }
  }, [open, deps]) // eslint-disable-line react-hooks/exhaustive-deps
  // keep the swipe position in step with the chosen style (a tap on a tab scrolls the cards; that scroll must not re-pick)
  const auto = useRef(0)
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const el = rail.current; if (!open || !el) return
    const slide = el.children[idx] as HTMLElement | undefined
    if (!slide) return
    const left = slide.offsetLeft - (el.clientWidth - slide.clientWidth) / 2
    if (Math.abs(el.scrollLeft - left) < 4) return
    auto.current = Date.now() + 700
    el.scrollTo({ left, behavior: 'smooth' })
  }, [open, idx])
  // a swipe picks the style once the cards come to rest
  const onScroll = () => {
    if (settle.current) clearTimeout(settle.current)
    settle.current = setTimeout(() => {
      const el = rail.current; if (!el || !variants?.length || Date.now() < auto.current) return
      const mid = el.scrollLeft + el.clientWidth / 2
      let best = 0, d = Infinity
      Array.from(el.children).forEach((c, i) => { const h = c as HTMLElement; const dd = Math.abs(h.offsetLeft + h.clientWidth / 2 - mid); if (dd < d) { d = dd; best = i } })
      if (list[best] && list[best].id !== variant) { buzz(4); onVariant?.(list[best].id) }
    }, 140)
  }

  const save = () => { if (!cur) return; const a = document.createElement('a'); a.href = cur.src; a.download = filename; a.click(); toast('Image saved') }
  const share = async () => {
    buzz(10)
    const r = await shareCard({ blob: cur?.blob, filename, title: shareTitle, text, url })
    if (r === 'unsupported') { save(); toast('Image saved. Share it from your photos.') }
  }
  const google = async () => {
    buzz(8)
    let copied = false
    if (googleText) { try { await navigator.clipboard.writeText(googleText); copied = true } catch { /* no clipboard */ } }
    toast(copied ? 'Your words are copied. Paste them in the Google review box.' : 'Opening Google reviews')
    window.open(googleUrl, '_blank', 'noopener')
  }

  const v = list[idx], dark = !!v.dark
  return (
    <AnimatePresence>
      {open && (
        <motion.div role="dialog" aria-modal="true" aria-label="Share your experience" className="fixed inset-0 z-[60] mx-auto flex max-w-[480px] flex-col overflow-hidden transition-[background] duration-500"
          style={{ background: v.bg ?? 'linear-gradient(170deg,#FFF6EA 0%,#FDE9F0 45%,#EEEAFF 100%)' }}
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
          {/* top bar: close · title · edit */}
          <div className={cx('flex shrink-0 items-center justify-between px-4 pb-1 pt-[max(env(safe-area-inset-top),10px)]', dark ? 'text-white' : 'text-navy')}>
            <button onClick={onClose} aria-label="Close" className={cx('grid size-10 place-items-center rounded-full', dark ? 'bg-white/15' : 'bg-white/80')}><X className="size-5" /></button>
            <h2 className="font-display text-[17px] font-semibold">{title}</h2>
            {editPanel ? <button onClick={() => { buzz(6); setEditing(true) }} className={cx('flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold', dark ? 'bg-white/15' : 'bg-white/80')}><PenLine className="size-4" /> Edit</button> : <span className="size-10" />}
          </div>

          {/* the card is the hero: swipe between styles */}
          <div ref={rail} onScroll={onScroll} role="listbox" aria-label="Card style" className="no-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory items-center gap-4 overflow-x-auto px-[calc(50%-min(14.6svh,124px))] py-3">
            {list.map((x, i) => {
              const im = imgs[x.id], on = i === idx
              return (
                <button key={x.id || 'one'} role="option" aria-selected={on} aria-label={x.label ? `${x.label} style` : 'Card'} onClick={() => onVariant?.(x.id)}
                  className={cx('aspect-[9/16] h-[min(52svh,440px)] shrink-0 snap-center overflow-hidden rounded-[20px] transition-all duration-300', on ? 'scale-100 opacity-100 shadow-[0_22px_50px_rgba(20,20,60,.28)]' : 'scale-[0.88] opacity-50')}>
                  {im ? <img src={im.src} alt={on ? 'Share card preview' : ''} className="size-full object-cover" draggable={false} />
                    : <span className="grid size-full place-items-center bg-white/50 px-6 text-center text-[13px] text-muted">{failed ? 'Could not make the image' : 'Making your card…'}</span>}
                </button>
              )
            })}
          </div>
          {variants?.length ? (
            <div className="flex shrink-0 justify-center gap-1.5 pb-3" role="tablist" aria-label="Styles">
              {list.map((x, i) => (
                <button key={x.id} role="tab" aria-selected={i === idx} onClick={() => { buzz(4); onVariant?.(x.id) }}
                  className={cx('h-8 rounded-full px-3.5 text-[13px] font-semibold transition-colors', i === idx ? (dark ? 'bg-white text-navy' : 'bg-navy text-white') : dark ? 'text-white/75' : 'text-ink-2')}>{x.label}</button>
              ))}
            </div>
          ) : null}

          {/* actions, in thumb reach */}
          <div className="shrink-0 rounded-t-[28px] bg-white px-5 pb-[max(env(safe-area-inset-bottom),14px)] pt-4 shadow-[0_-10px_30px_rgba(20,20,60,.08)]">
            <button onClick={share} disabled={!cur} className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-navy font-display text-[17px] font-semibold text-white shadow-[var(--shadow-cta)] active:scale-[0.98] disabled:opacity-60">
              <Share2 className="size-5" /> Share
            </button>
            {/* owner 2026-11-27: just Share, and a Google review button (no WhatsApp / Instagram / Save / Copy link row) */}
            {googleUrl && (
              <button onClick={google} className="mt-2.5 flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-white font-display text-[17px] font-semibold text-ink ring-1 ring-line active:scale-[0.98]">
                <span className="[&>svg]:size-5">{GOOGLE}</span> Review on Google
              </button>
            )}
            {googleUrl && <p className="mt-1.5 text-center text-[12px] text-muted">We copy your words so you can paste them in Google.</p>}
          </div>

          {/* edit: the words and what the card shows */}
          <AnimatePresence>
            {editing && editPanel && (
              <>
                <motion.div className="absolute inset-0 bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditing(false)} />
                <motion.div role="dialog" aria-label="Edit your card" className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white px-5 pb-[max(env(safe-area-inset-bottom),14px)] pt-4"
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 32 }}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-display text-[18px] font-semibold text-ink">Edit your card</p>
                    <button onClick={() => { buzz(6); setEditing(false) }} className="h-10 rounded-full bg-navy px-5 text-[14px] font-semibold text-white">Done</button>
                  </div>
                  {editPanel}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
