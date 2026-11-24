'use client'
/** @module learn @owner CLIENT · member story viewer (see components/story-viewer.tsx). */
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { StoryViewer } from '@/components/story-viewer'
import { STORIES, storyById } from '@/lib/stories'

export default function Page() { return <Suspense><View /></Suspense> }
function View() {
  const story = storyById(useSearchParams().get('id') ?? '') ?? STORIES[0]
  return <StoryViewer key={story.id} story={story} />
}
