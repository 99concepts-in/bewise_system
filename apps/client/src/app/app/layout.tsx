'use client'
/** @module client-shell @owner CLIENT — /app guard (must be onboarded), chrome (nav, sheets). */
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AppChrome } from '@/components/shell'
import { AppSkeleton } from '@/components/skeleton'
import { useApp } from '@/lib/store'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const hydrated = useApp((s) => s.hydrated)
  const onboarded = useApp((s) => !!s.profile?.onboardedAt)
  useEffect(() => { if (hydrated && !onboarded) router.replace('/welcome') }, [hydrated, onboarded, router])
  if (!hydrated || !onboarded) return <AppSkeleton />
  return <AppChrome>{children}</AppChrome>
}
