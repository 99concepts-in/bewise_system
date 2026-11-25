'use client'
/** @module client-help @owner CLIENT @screens CL-51 Help — FAQs, contact, policies (drafts in docs/specs/client/legal/) */
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, MessageCircle, Phone } from 'lucide-react'
import { useState } from 'react'
import { AppHeader } from '@/components/shell'
import { HELPLINE, waLink } from '@/lib/offer'
import { SafetyCard } from '../book/intake'

const FAQ = [
  ['What happens in a wellness session?', 'A calm, private conversation with Jitendra Khimlani about how you’ve been feeling. Afterwards he prepares your personal blend of Bach flower remedies, included in the fee.'],
  ['How much does it cost?', '₹1,000 for a first visit and ₹800 after that, both with your remedy blend. Just book a session: our team confirms which applies when they set your time, and you pay in the app. Reorders of the same blend are charged separately.'],
  ['Can I cancel?', 'Sessions are non-refundable, but you can reschedule, free up to 24 hours before; within 24 hours you can move it once. A missed session can’t be moved.'],
  ['My product arrived damaged', 'We’re sorry! Go to My orders → Request a replacement and add a photo. We don’t offer returns for change of mind.'],
  ['Is my information private?', 'Yes. Only Jitendra Khimlani sees your answers and journal. Our office team sees only what’s needed to prepare and ship your order. You can download or delete your data anytime in Me → Privacy & data.'],
  ['Are Bach remedies medicine?', 'No. They’re a gentle, complementary wellness practice for emotional balance, not a substitute for your doctor. Please don’t stop any medicine without medical advice.'],
]
const POLICIES = [
  ['privacy', 'Privacy policy', 'We collect only what we need to care for you, keep it safe, and never sell it. Full policy coming before launch.'],
  ['terms', 'Terms of use', 'Using BeWise means agreeing to our terms, including our no-refund, reschedule-only policy for sessions.'],
  ['shipping', 'Shipping', 'We ship across India with trusted courier partners. Blends are prepared fresh after your session.'],
  ['replacement', 'Replacement policy', 'Damaged, leaking, wrong or missing items are replaced. No returns for change of mind.'],
  ['disclaimer', 'Wellness disclaimer', 'BeWise offers complementary wellness support for emotional balance. It isn’t medical advice or treatment. Please keep seeing your doctor.'],
]

export default function Help() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <main className="px-5 pb-32">
      <AppHeader back />
      <h1 className="h-duo pt-2">How can we <em>help?</em></h1>
      <div className="card mt-5 divide-y divide-line px-5">
        {FAQ.map(([q, a], i) => (
          <div key={q}>
            <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center gap-3 py-4 text-left">
              <span className="flex-1 text-[15px] font-semibold text-navy">{q}</span>
              <motion.span animate={{ rotate: open === i ? 180 : 0 }}><ChevronDown className="size-5 text-soft" /></motion.span>
            </button>
            <AnimatePresence initial={false}>{open === i && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pb-4 text-[14px] leading-6 text-muted">{a}</motion.p>}</AnimatePresence>
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <a href={waLink('Hi BeWise, I need help with my session booking')} target="_blank" rel="noopener noreferrer" className="card flex flex-col items-start gap-1 p-4">
          <span className="grid size-10 place-items-center rounded-full bg-sage-100 text-sage-text"><MessageCircle className="size-5" /></span>
          <span className="mt-1 text-[15px] font-bold text-navy">WhatsApp</span><span className="text-[12px] text-muted">Session bookings · 90542 20952</span>
        </a>
        <a href={`tel:${HELPLINE.tel}`} className="card flex flex-col items-start gap-1 p-4">
          <span className="grid size-10 place-items-center rounded-full bg-peri-50 text-navy"><Phone className="size-5" /></span>
          <span className="mt-1 text-[15px] font-bold text-navy">Helpline</span><span className="text-[12px] text-muted">{HELPLINE.name} · {HELPLINE.label}</span>
        </a>
      </div>
      <h2 className="h-section mt-8">Need to talk to someone now?</h2>
      <div className="mt-3"><SafetyCard /></div>
      <h2 className="h-section mt-8" id="privacy">Policies</h2>
      <div className="mt-3 space-y-2">
        {POLICIES.map(([id, t, d]) => (
          <div key={id} id={id} className="card p-4"><p className="text-[15px] font-bold text-navy">{t}</p><p className="mt-1 text-[13px] leading-5 text-muted">{d}</p></div>
        ))}
      </div>
    </main>
  )
}
