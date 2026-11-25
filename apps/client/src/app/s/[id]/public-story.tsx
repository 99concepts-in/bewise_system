'use client'
/** @module sharing @owner CLIENT · a shared story: members continue in the app, everyone else reads it here. */
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { StoryViewer } from '@/components/story-viewer'
import { storyById, STORIES } from '@/lib/stories'
import { useApp } from '@/lib/store'

export function PublicStory({ id }: { id: string }) {
  const router = useRouter()
  const hydrated = useApp((s) => s.hydrated)
  const member = useApp((s) => !!s.profile?.onboardedAt)
  useEffect(() => { if (hydrated && member) router.replace(`/app/learn/story?id=${id}`) }, [hydrated, member, id, router])
  if (!hydrated || member) return <main className="fixed inset-0 bg-[#0f1226]" />
  return <StoryViewer story={storyById(id) ?? STORIES[0]} mode="public" />
}
