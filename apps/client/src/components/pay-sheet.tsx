'use client'
/**
 * @module   checkout-ux
 * @owner    CLIENT (UI) · OWNER finance owns Razorpay server code
 * @screens  CL-16 / CL-39 payment step · CL-53 payment issue
 * @stub     Preview: simulates Razorpay Checkout (UPI first). Production: finance.createCheckout() → Razorpay
 *           Checkout.js → finance.verifyCheckout(); "paid" only after the server confirms (webhook).
 */
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronRight, CreditCard, Landmark, Lock, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Sheet, buzz, ease } from './ui'
import { formatINR } from '@/lib/format'

const UPI = [
  { id: 'gpay', name: 'Google Pay', c: '#4285F4' }, { id: 'phonepe', name: 'PhonePe', c: '#5f259f' },
  { id: 'paytm', name: 'Paytm', c: '#00b9f1' }, { id: 'bhim', name: 'Other UPI', c: '#182957' },
]

export function PaySheet({ open, amountPaise, purpose, onClose, onPaid }: { open: boolean; amountPaise: number; purpose: string; onClose: () => void; onPaid: () => void }) {
  const [phase, setPhase] = useState<'choose' | 'waiting' | 'confirming' | 'done' | 'failed'>('choose')
  const [method, setMethod] = useState('')
  useEffect(() => { if (open) setPhase('choose') }, [open])

  const pay = (m: string) => {
    setMethod(m); setPhase('waiting'); buzz()
    setTimeout(() => setPhase('confirming'), 1700)
    setTimeout(() => { setPhase('done'); buzz(30) }, 2700)
    setTimeout(() => onPaid(), 3600)
  }

  return (
    <Sheet open={open} onClose={phase === 'choose' || phase === 'failed' ? onClose : () => {}} title="Payment">
      <div className="flex items-center justify-between pb-3 pt-1">
        <div>
          <p className="text-[13px] font-semibold text-muted">{purpose}</p>
          <p className="text-[30px] font-extrabold tracking-[-0.02em] text-navy tnum">{formatINR(amountPaise)}</p>
        </div>
        <span className="mr-10 flex items-center gap-1.5 rounded-full bg-sage-100 px-3 py-1.5 text-[12px] font-semibold text-sage-text"><Lock className="size-3.5" /> Secured by Razorpay</span>
      </div>
      <AnimatePresence mode="wait">
        {phase === 'choose' ? (
          <motion.div key="choose" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25, ease }}>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.12em] text-muted">Pay with UPI</p>
            <div className="grid grid-cols-4 gap-2">
              {UPI.map((u, i) => (
                <motion.button key={u.id} onClick={() => pay(u.name)} whileTap={{ scale: 0.92 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex flex-col items-center gap-2 rounded-[18px] bg-peri-50/70 py-3">
                  <span className="grid size-11 place-items-center rounded-full text-[15px] font-extrabold text-white" style={{ background: u.c }}>{u.name[0]}</span>
                  <span className="text-[11px] font-semibold text-navy">{u.name}</span>
                </motion.button>
              ))}
            </div>
            <p className="mb-2 mt-5 text-[12px] font-bold uppercase tracking-[0.12em] text-muted">Other ways</p>
            <div className="divide-y divide-line rounded-[20px] bg-peri-50/50">
              {[{ n: 'Card', i: <CreditCard className="size-5" /> }, { n: 'Netbanking', i: <Landmark className="size-5" /> }, { n: 'UPI ID', i: <Smartphone className="size-5" /> }].map((o) => (
                <button key={o.n} onClick={() => pay(o.n)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] font-semibold text-navy">
                  <span className="grid size-9 place-items-center rounded-full bg-white">{o.i}</span><span className="flex-1">{o.n}</span><ChevronRight className="size-4 text-soft" />
                </button>
              ))}
            </div>
            <p className="mt-4 text-center text-[12px] text-muted">Preview build — this simulates Razorpay. No money moves.</p>
          </motion.div>
        ) : (
          <motion.div key="progress" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-8 text-center" aria-live="polite">
            <div className="relative grid size-28 place-items-center">
              <motion.span className="absolute inset-0 rounded-full border-[6px] border-peri-100" />
              {phase !== 'done' ? (
                <motion.span className="absolute inset-0 rounded-full border-[6px] border-transparent border-t-navy" animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
              ) : (
                <motion.span className="absolute inset-0 grid place-items-center rounded-full bg-[linear-gradient(135deg,#82977e,#4f6249)]" initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 16 }}>
                  <motion.span initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.12, type: 'spring', stiffness: 400, damping: 14 }}><Check className="size-12 text-white" strokeWidth={3} /></motion.span>
                </motion.span>
              )}
            </div>
            <p className="mt-5 text-[18px] font-bold text-navy">{phase === 'waiting' ? `Approve in ${method}` : phase === 'confirming' ? 'Confirming with your bank…' : 'Payment received'}</p>
            <p className="mt-1 text-[14px] text-muted">{phase === 'done' ? 'Thank you — one moment…' : 'Please don’t close this screen.'}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  )
}
