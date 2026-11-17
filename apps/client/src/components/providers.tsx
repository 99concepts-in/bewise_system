'use client'
/** @module client-shell @owner CLIENT — motion config (respects reduced motion), store hydration, toasts. */
import { MotionConfig } from 'motion/react'
import { useEffect } from 'react'
import { hydrateStore } from '@/lib/store'
import { Toaster } from './ui'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => { hydrateStore() }, [])
  return (
    <MotionConfig reducedMotion="user">
      {children}
      <Toaster />
    </MotionConfig>
  )
}
