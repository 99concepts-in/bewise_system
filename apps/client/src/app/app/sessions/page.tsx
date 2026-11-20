'use client'
/** @module scheduling-ux @owner CLIENT @screens CL-18 My appointments (Upcoming / Past) */
import Link from 'next/link'
import { motion } from 'motion/react'
import { ChevronRight, Laptop, MapPin } from 'lucide-react'
import { useState } from 'react'
import { Mascot } from '@/components/brand'
import { AppHeader } from '@/components/shell'
import { BtnLink, Segmented, ease } from '@/components/ui'
import { CONSULTATIONS } from '@/lib/data'
import { useApp } from '@/lib/store'
import { fmtDate, fmtTime } from '@/lib/format'
import { isUpcoming, tbc } from '@/lib/appt'

export default function Sessions() {
  const appts = useApp((s) => s.appointments)
  const [tab, setTab] = useState<'up' | 'past'>('up')
  const now = Date.now()
  const isUp = (a: (typeof appts)[number]) => isUpcoming(a, now)
  const list = appts.filter((a) => (tab === 'up' ? isUp(a) : !isUp(a)))
    .sort((a, b) => (tab === 'up' ? 1 : -1) * (+new Date(a.startsAt) - +new Date(b.startsAt)))
  return (
    <main className="px-5 pb-32">
      <AppHeader />
      <h1 className="h-duo pt-2">My <em>sessions</em></h1>
      <Segmented className="mt-5" value={tab} onChange={setTab} options={[{ value: 'up', label: 'Upcoming' }, { value: 'past', label: 'Past' }]} />
      <div className="mt-5 space-y-3">
        {list.length === 0 ? (
          <div className="card flex flex-col items-center p-8 text-center">
            <Mascot pose="sleep" height={120} />
            <p className="mt-3 text-[16px] font-bold text-navy">{tab === 'up' ? 'Nothing booked yet' : 'No past sessions'}</p>
            <p className="mt-1 text-[14px] text-muted">{tab === 'up' ? 'When you’re ready, Jitendra Khimlani is here.' : 'Your session history will appear here.'}</p>
            {tab === 'up' && <BtnLink href="/app/book" size="md" className="mt-5">Book a session</BtnLink>}
          </div>
        ) : list.map((a, i) => {
          const d = new Date(a.startsAt)
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.4, ease }}>
              <Link href={a.status === 'awaiting_payment' ? `/app/pay?appointment=${a.id}` : `/app/sessions/view?id=${a.id}`} className="card flex items-center gap-4 p-4">
                <span className={`flex size-16 shrink-0 flex-col items-center justify-center rounded-[20px] ${tab === 'up' ? 'bg-navy text-white' : 'bg-peri-50 text-navy'}`}>
                  {tbc(a) ? <span className="text-[13px] font-extrabold leading-tight">Time<br />TBC</span> : <><span className="text-[22px] font-extrabold leading-none">{d.getDate()}</span><span className="text-[12px] font-semibold uppercase opacity-80">{d.toLocaleDateString('en-IN', { month: 'short' })}</span></>}
                </span>
                <span className="flex-1">
                  <span className="block text-[16px] font-bold text-navy">{CONSULTATIONS.find((c) => c.id === a.type)!.name}</span>
                  <span className="flex items-center gap-1.5 text-[13px] text-muted">{a.mode === 'online' ? <Laptop className="size-3.5" /> : <MapPin className="size-3.5" />}{tbc(a) ? 'Time to be confirmed' : `${fmtDate(d)} · ${fmtTime(d)}`} · {a.mode === 'online' ? 'Online' : 'In person'}</span>
                  {a.status === 'awaiting_payment' && <span className="mt-1 inline-block rounded-full bg-[#fbe3c0] px-2 py-0.5 text-[11px] font-bold text-[#7a4a10]">Awaiting payment</span>}
                  {tbc(a) && <span className="mt-1 inline-block rounded-full bg-[#fbf3dc] px-2 py-0.5 text-[11px] font-bold text-[#7a5a1c]">Requested · time to be confirmed</span>}
                  {tab === 'past' && !a.feedback && <span className="mt-1 inline-block rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose">Add feedback</span>}
                </span>
                <ChevronRight className="size-5 text-soft" />
              </Link>
            </motion.div>
          )
        })}
      </div>
    </main>
  )
}
