'use client'
/** @module client-shell @owner CLIENT — entry gate: returning client → Home, new → Welcome (CL-01). */
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'motion/react'
import { useApp } from '@/lib/store'
import { LogoMark } from '@/components/brand'

export default function Entry() {
  const router = useRouter()
  const hydrated = useApp((s) => s.hydrated)
  const onboarded = useApp((s) => !!s.profile?.onboardedAt)
  useEffect(() => {
    if (!hydrated) return
    const t = setTimeout(() => router.replace(onboarded ? '/app' : '/welcome'), onboarded ? 450 : 0)
    return () => clearTimeout(t)
  }, [hydrated, onboarded, router])
  return (
    <main className="grid min-h-dvh place-items-center">
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
        <LogoMark size={88} />
      </motion.div>
    </main>
  )
}
