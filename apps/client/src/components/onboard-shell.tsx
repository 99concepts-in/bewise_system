'use client'
/** @module onboarding @owner CLIENT — shared frame for CL-05…CL-06 (back, 3-step progress, two-tone title). */
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { IconBtn, ease } from './ui'

export function OnboardShell({ step, title, em, sub, children }: { step: 1 | 2 | 3; title: string; em: string; sub?: string; children: ReactNode }) {
  const router = useRouter()
  return (
    <main className="flex min-h-dvh flex-col px-5 safe-t">
      <header className="flex items-center gap-4 pt-2">
        <IconBtn label="Back" onClick={() => router.back()}><ChevronLeft className="size-5" /></IconBtn>
        <div className="flex flex-1 gap-1.5" role="group" aria-label={`Step ${step} of 3`}>
          {[1, 2, 3].map((k) => (
            <span key={k} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/80">
              <motion.span className="block h-full rounded-full bg-navy" initial={{ width: k < step ? '100%' : 0 }} animate={{ width: k <= step ? '100%' : 0 }} transition={{ duration: 0.6, ease, delay: 0.15 }} />
            </span>
          ))}
        </div>
        <span className="text-[13px] font-semibold text-muted tnum">{step}/3</span>
      </header>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="flex flex-1 flex-col">
        <h1 className="h-duo mt-8">{title} <em>{em}</em></h1>
        {sub && <p className="mt-2 text-[15px] leading-6 text-muted">{sub}</p>}
        {children}
      </motion.div>
    </main>
  )
}
