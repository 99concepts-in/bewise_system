/**
 * @module   sharing
 * @owner    CLIENT
 * @screens  Public story page (owner 2026-11-24): what a shared story link opens. Anyone can read the whole story.
 *           Signed-in members go to the same story inside the app; others are asked "You seem to be new here".
 *           One static page per story, with its own link preview (title, line and cover) for WhatsApp and others.
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { STORIES, storyById } from '@/lib/stories'
import { BP } from '@/lib/asset'
import { SITE_ORIGIN } from '@/lib/share'
import { PublicStory } from './public-story'

export const dynamicParams = false
export function generateStaticParams() { return STORIES.map((s) => ({ id: s.id })) }

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const s = storyById((await params).id)
  if (!s) return {}
  const c = s.slides[0]
  const description = `${c.k === 'cover' ? c.sub + '. ' : ''}Read it on BeWise Wellness.`
  const image = `${SITE_ORIGIN}${BP}/img/stories/og/${s.id}.jpg`
  const url = `${SITE_ORIGIN}${BP}/s/${s.id}/`
  return {
    title: s.title, description,
    openGraph: { type: 'article', title: s.title, description, url, siteName: 'BeWise Holistic Wellness', images: [{ url: image, width: 1200, height: 630, alt: s.title }] },
    twitter: { card: 'summary_large_image', title: s.title, description, images: [image] },
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!storyById(id)) notFound()
  return <PublicStory id={id} />
}
