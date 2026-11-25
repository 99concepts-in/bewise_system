'use client'
/**
 * @module   intake (UI)
 * @owner    CLIENT builds UI · CONSULTANT owns intake.getCheckinForm / submitCheckin
 * @screens  IN-12 follow-up check-in as a deep link — /app/checkin?appointment=<id> (consultant "Ask" WhatsApp; request §5)
 */
import { goSafe } from '@/lib/nav'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft } from 'lucide-react'
import { Suspense, useState } from 'react'
import { Mascot } from '@/components/brand'
import { Btn, IconBtn, ProgressBar, ease } from '@/components/ui'
import { CheckinChanges, CheckinNews, CheckinNow, type Checkin } from '../book/intake'
import { useApp } from '@/lib/store'
import { fmtLongDay, fmtTime } from '@/lib/format'
import { tbc } from '@/lib/appt'

export default function Page() { return <Suspense><CheckinLink /></Suspense> }

function CheckinLink() {
  const router = useRouter()
  const id = useSearchParams().get('appointment') ?? ''
  const appt = useApp((s) => s.appointments.find((a) => a.id === id))
  const prev = useApp((s) => s.intake?.answers.feelings ?? [])
  const existing = useApp((s) => s.checkins[id])
  const submit = useApp((s) => s.submitCheckin)
  const [step, setStep] = useState(0)
  const [c, setC] = useState<Checkin>(() => existing?.answers ?? { changes: {}, news: '' })
  const set = (p: Partial<Checkin>) => setC((x) => ({ ...x, ...p }))
  const finish = () => { submit(id || 'latest', c); setStep(3) }

  return (
    <main className="flex min-h-dvh flex-col px-5 safe-t">
      {step < 3 && (
        <header className="sticky top-0 z-30 -mx-5 flex items-center gap-3 bg-sky-50/95 backdrop-blur-xl px-5 pb-5 pt-2">
          <IconBtn label="Back" onClick={() => (step ? setStep(step - 1) : goSafe(router, '/app'))}><ChevronLeft className="size-5" /></IconBtn>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-navy">2-minute check-in · {step + 1} of 3</p>
            <ProgressBar value={(step + 1) / 3} className="mt-1.5" />
          </div>
        </header>
      )}
      {appt && step < 3 && <p className="-mt-2 mb-3 text-[13px] text-muted">For your session <b className="text-navy">{tbc(appt) ? '(time to be confirmed)' : `on ${fmtLongDay(appt.startsAt)} · ${fmtTime(appt.startsAt)}`}</b> · everything optional</p>}
      <div className="flex-1 pb-36">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3, ease }}>
            {step === 0 && <CheckinNow c={c} set={set} />}
            {step === 1 && <CheckinChanges c={c} set={set} feelings={prev} />}
            {step === 2 && <CheckinNews c={c} set={set} />}
            {step === 3 && (
              <div className="flex flex-col items-center pt-12 text-center">
                <Mascot pose="bottle" height={220} priority />
                <h1 className="h-duo mt-6 text-[32px]">Thank <em>you</em></h1>
                <p className="mt-2 max-w-[300px] text-[15px] leading-6 text-muted">Jitendra Khimlani will see how you’ve been before you meet.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] bg-gradient-to-t from-sky-50 via-sky-50/95 to-transparent px-5 pb-3 pt-8 safe-b">
        {step < 2 && <Btn full variant="gradient" onClick={() => setStep(step + 1)}>Continue</Btn>}
        {step === 2 && <Btn full variant="gradient" onClick={finish}>Send to Jitendra Khimlani</Btn>}
        {step === 3 && <Btn full onClick={() => router.replace(appt ? `/app/sessions/view?id=${appt.id}` : '/app')}>{appt ? 'View my session' : 'Back to home'}</Btn>}
      </div>
    </main>
  )
}
