'use client'
/**
 * @module   companion
 * @owner    CLIENT
 * @screens  CL-55 Ask BeWise — mascot, streaming-style replies, product suggestions with Add to bag, confirm-before-action,
 *           crisis card, clear history. Caption: "Not medical advice · for your blend, ask Jitu Bhaiya"
 */
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, CalendarDays, ChevronLeft, MoreHorizontal, ShoppingBag, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Mascot, ProductArt } from '@/components/brand'
import { Btn, IconBtn, Sheet, buzz, ease, spring, toast, useChrome } from '@/components/ui'
import { SafetyCard } from '../book/intake'
import { respond, crisisCheck } from '@/lib/companion'
import { productBySlug } from '@/lib/data'
import { useApp } from '@/lib/store'
import { dayKey, firstName, formatINR } from '@/lib/format'

const STARTERS = ['When should I take my drops?', 'How have I been feeling this week?', 'I’ve been struggling to sleep']

export default function Ask() {
  const router = useRouter()
  const s = useApp()
  const { openLog, flyToBag } = useChrome()
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const [menu, setMenu] = useState(false)
  const [reveal, setReveal] = useState<string | null>(null)
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [s.chat.length, typing])

  const send = (msg: string) => {
    const m = msg.trim(); if (!m || typing) return
    buzz(6); setText(''); s.pushChat({ role: 'user', text: m })
    const crisis = crisisCheck(m)
    setTyping(true)
    const reply = respond(m, { name: firstName(s.profile?.name), blend: s.blend, ritualToday: s.ritual[dayKey(new Date())] ?? 0, journal: s.journal, appointments: s.appointments, orders: s.orders, allergies: s.profile?.allergies ?? [] })
    setTimeout(() => {
      setTyping(false)
      s.pushChat({ role: 'bot', text: reply.text, products: reply.products, actions: [...(reply.actions ?? []), ...((reply.quick ?? []).map((q) => ({ id: `q:${q}`, label: q })))], safety: reply.safety })
      setReveal(String(Date.now()))
    }, crisis ? 250 : 650 + Math.min(900, reply.text.length * 6))
  }

  const act = (id: string, label: string) => {
    buzz(8)
    if (id.startsWith('q:')) return send(id.slice(2))
    if (id.startsWith('remind-')) { const t = id.slice(7); toast(`We’ll remind you at ${t}`); s.pushChat({ role: 'bot', text: `Done — a gentle nudge at ${t}. 🌿` }); return }
    if (id === 'book-followup') return router.push('/app/book?type=followup')
    if (id === 'book-first') return router.push('/app/book')
    if (id === 'open-remedies') return router.push('/app/remedies')
    if (id === 'open-journal') return router.push('/app/journal')
    if (id === 'open-shop') return router.push('/app/shop')
    if (id === 'log') return openLog()
    if (id.startsWith('open-session-')) return router.push(`/app/sessions/${id.slice(13)}`)
    if (id.startsWith('open-order-')) return router.push(`/app/orders/${id.slice(11)}`)
    if (/whatsapp/i.test(label)) return toast('WhatsApp opens here once the business number is added')
    if (/book/i.test(label)) return router.push('/app/book')
  }

  return (
    <main className="flex min-h-dvh flex-col px-5">
      <header className="sticky top-0 z-20 -mx-5 flex items-center gap-3 bg-gradient-to-b from-[#dce2f5] via-[#dce2f5]/90 to-transparent px-5 pb-4 pt-2 safe-t">
        <IconBtn label="Back" onClick={() => router.back()}><ChevronLeft className="size-5" /></IconBtn>
        <div className="flex-1">
          <p className="text-[20px] font-extrabold leading-tight tracking-[-0.02em] text-navy">Ask <span className="text-soft">BeWise</span></p>
          <p className="text-[12px] text-muted">Your wise companion</p>
        </div>
        <IconBtn label="Conversation options" onClick={() => setMenu(true)}><MoreHorizontal className="size-5" /></IconBtn>
      </header>

      <div className="flex-1 pb-40" aria-live="polite">
        {s.chat.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center pt-4 text-center">
            <Mascot pose="wave" height={190} priority />
            <h1 className="h-duo mt-4 text-[34px]">Ask <em>BeWise</em></h1>
            <p className="mt-1 max-w-[290px] text-[15px] text-muted">I know your ritual, journal, sessions and orders. Ask me anything.</p>
            <div className="mt-6 w-full space-y-2">
              {STARTERS.map((q, i) => (
                <motion.button key={q} onClick={() => send(q)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }} whileTap={{ scale: 0.98 }}
                  className="card w-full px-5 py-4 text-left text-[15px] font-semibold text-navy">{q}</motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="space-y-3 pt-1">
          {s.chat.map((m, idx) => {
            const last = idx === s.chat.length - 1
            if (m.role === 'user') return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring} className="flex justify-end">
                <p className="max-w-[80%] rounded-[24px] rounded-br-md bg-navy px-5 py-3.5 text-[15px] font-semibold leading-6 text-white shadow-[var(--shadow-cta)]">{m.text}</p>
              </motion.div>
            )
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }} className="space-y-2.5">
                {m.safety && <SafetyCard />}
                <div className="flex items-end gap-2">
                  <img src="/img/owl-wave.webp" alt="" className="mb-1 size-9 shrink-0 rounded-full bg-white object-contain p-0.5 shadow-[var(--shadow-card)]" />
                  <p className="max-w-[82%] rounded-[24px] rounded-bl-md bg-white px-5 py-3.5 text-[15px] leading-6 text-ink shadow-[var(--shadow-card)]">
                    {last && reveal ? <Typewriter key={reveal} text={m.text} /> : m.text}
                  </p>
                </div>
                {m.products?.map((slug, i) => {
                  const p = productBySlug(slug); if (!p) return null
                  const v = p.variants[p.variants.length - 1]
                  return (
                    <motion.div key={slug} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="card ml-11 flex items-center gap-3 p-3">
                      <ProductArt product={p} size="sm" className="w-[84px] shrink-0" />
                      <div className="flex-1"><p className="text-[16px] font-bold text-navy">{p.name}</p><p className="text-[13px] text-muted">{v.label} · {formatINR(v.pricePaise)}</p>
                        <button onClick={(e) => { s.addToCart(v.id); flyToBag(e.currentTarget.getBoundingClientRect(), `/img/${p.art}.webp`); toast(`${p.name} added to your bag`) }} className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-full bg-navy px-4 text-[13px] font-semibold text-white"><ShoppingBag className="size-3.5" /> Add to bag</button>
                      </div>
                    </motion.div>
                  )
                })}
                {!!m.actions?.length && last && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="ml-11 flex flex-wrap gap-2">
                    {m.actions.map((a, i) => (
                      <button key={a.id} onClick={() => act(a.id, a.label)} className={i === 0 && !a.id.startsWith('q:') ? 'inline-flex h-11 items-center gap-1.5 rounded-full bg-navy px-5 text-[14px] font-semibold text-white shadow-[var(--shadow-cta)]' : 'h-11 rounded-full bg-white px-4 text-[14px] font-semibold text-navy shadow-[var(--shadow-card)]'}>
                        {a.id.startsWith('book') && <CalendarDays className="size-4" />}{a.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )
          })}
          <AnimatePresence>
            {typing && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-end gap-2">
                <img src="/img/owl-wave.webp" alt="" className="mb-1 size-9 rounded-full bg-white object-contain p-0.5 shadow-[var(--shadow-card)]" />
                <span className="flex gap-1.5 rounded-[24px] rounded-bl-md bg-white px-5 py-4 shadow-[var(--shadow-card)]" aria-label="BeWise is typing">
                  {[0, 1, 2].map((k) => <motion.span key={k} className="size-2 rounded-full bg-peri" animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.9, repeat: Infinity, delay: k * 0.15 }} />)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={end} />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] bg-gradient-to-t from-[#e6eee3] via-[#e6eee3]/95 to-transparent px-5 pb-2 pt-8 safe-b">
        <form onSubmit={(e) => { e.preventDefault(); send(text) }} className="flex h-16 items-center gap-2 rounded-full bg-white pl-5 pr-2 shadow-[var(--shadow-float)]">
          <input value={text} onChange={(e) => setText(e.target.value.slice(0, 1000))} placeholder="Ask anything…" aria-label="Message Ask BeWise" className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-soft" />
          <motion.button type="submit" aria-label="Send" whileTap={{ scale: 0.85 }} disabled={!text.trim() || typing} animate={{ scale: text.trim() ? 1 : 0.85, opacity: text.trim() ? 1 : 0.5 }} className="grid size-12 place-items-center rounded-full bg-[linear-gradient(135deg,#182957,#5e7fb8)] text-white">
            <ArrowUp className="size-5" />
          </motion.button>
        </form>
        <p className="mt-2 text-center text-[12px] text-muted">Not medical advice · for your blend, ask <b className="text-navy">Jitu Bhaiya</b></p>
      </div>

      <Sheet open={menu} onClose={() => setMenu(false)} title="Ask BeWise">
        <h2 className="h-duo text-[24px]">How Ask BeWise <em>works</em></h2>
        <p className="mt-2 text-[14px] leading-6 text-muted">Ask BeWise reads only <b>your</b> ritual, journal, sessions and orders to answer you. It isn’t a doctor, never changes your blend, and can make mistakes. Your chats are private to you.</p>
        <p className="mt-2 text-[12px] text-soft">Preview build: answers are generated on this device. The full AI companion connects at launch.</p>
        <Btn full variant="white" className="mt-5" onClick={() => { s.clearChat(); setMenu(false); toast('Conversation cleared') }}><Trash2 className="size-4" /> Clear conversation</Btn>
      </Sheet>
    </main>
  )
}

function Typewriter({ text }: { text: string }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let i = 0
    const t = setInterval(() => { i += Math.max(1, Math.round(text.length / 60)); setN(Math.min(i, text.length)); if (i >= text.length) clearInterval(t) }, 16)
    return () => clearInterval(t)
  }, [text])
  return <>{text.slice(0, n)}{n < text.length && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-navy" />}</>
}
