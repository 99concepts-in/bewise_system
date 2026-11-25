'use client'
/**
 * @module   sharing
 * @owner    CLIENT
 * @screens  Public "More stories" (owner 2026-11-24): for people who opened a shared story and are not members yet.
 *           Every story, then Start my journey (onboarding) or Already a member. Members go to the Learn tab.
 */
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { Logo } from '@/components/brand'
import { cx, ease } from '@/components/ui'
import { STORIES } from '@/lib/stories'
import { BP } from '@/lib/asset'
import { useApp } from '@/lib/store'

export default function Stories() {
  const router = useRouter()
  const hydrated = useApp((s) => s.hydrated)
  const member = useApp((s) => !!s.profile?.onboardedAt)
  useEffect(() => { if (hydrated && member) router.replace('/app/learn') }, [hydrated, member, router])
  return (
    <main className="min-h-dvh px-5 pb-36 pt-[max(env(safe-area-inset-top),16px)]">
      <Link href="/welcome" aria-label="BeWise" className="inline-block py-2"><Logo height={34} /></Link>
      <h1 className="h-duo mt-3">How <em>Bach flowers</em> help</h1>
      <p className="mt-1 text-[14px] text-ink-2">Short stories on sleep, worry, confidence and more. Tap one to read.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {STORIES.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.45, ease }} className={cx(i === 0 && 'col-span-2')}>
            <Link href={`/s/${s.id}`} aria-label={`Read: ${s.title}`} className="relative block overflow-hidden rounded-[24px] shadow-[var(--shadow-float)]">
              <img src={`${BP}/img/${s.cover}.webp`} alt="" className={cx('w-full object-cover', i === 0 ? 'aspect-[4/3]' : 'aspect-[3/4]')} />
              <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-bold text-navy">{s.tag}</span>
              <span className="absolute inset-x-3 bottom-3 font-display text-[18px] font-semibold leading-6 text-white">{s.title}</span>
            </Link>
          </motion.div>
        ))}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] bg-gradient-to-t from-sky-50 via-sky-50/95 to-transparent px-5 pb-3 pt-8 safe-b">
        <Link href="/welcome" className="flex h-[52px] items-center justify-center rounded-full bg-navy font-display text-[16px] font-semibold text-white shadow-[var(--shadow-cta)]">Start my journey</Link>
        <Link href="/sign-in" className="mt-1 flex h-11 items-center justify-center text-[14px] font-semibold text-navy">Already a member? Sign in</Link>
      </div>
    </main>
  )
}
