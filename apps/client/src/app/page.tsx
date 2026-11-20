'use client'
/** @module client-shell @owner CLIENT · entry gate: returning client → Home, new → Welcome (CL-01). `?reset=1` wipes this device for a fresh demo. */
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'motion/react'
import { useApp } from '@/lib/store'
import { LogoStacked } from '@/components/brand'

export default function Entry() {
  const router = useRouter()
  const hydrated = useApp((s) => s.hydrated)
  const onboarded = useApp((s) => !!s.profile?.onboardedAt)
  useEffect(() => {
    if (!hydrated) return
    // demo reset: open the app with ?reset=1 to start fresh as a brand-new client (owner 2026-11-18)
    if (new URLSearchParams(window.location.search).has('reset')) {
      useApp.getState().resetAll()
      try { Object.keys(localStorage).filter((k) => k.startsWith('bewise')).forEach((k) => { if (k !== 'bewise-client-v1') localStorage.removeItem(k) }); sessionStorage.clear() } catch {}
      router.replace('/welcome'); return
    }
    const t = setTimeout(() => router.replace(onboarded ? '/app' : '/welcome'), onboarded ? 450 : 0)
    return () => clearTimeout(t)
  }, [hydrated, onboarded, router])
  return (
    <main className="grid min-h-dvh place-items-center">
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
        <LogoStacked height={140} />
      </motion.div>
    </main>
  )
}
