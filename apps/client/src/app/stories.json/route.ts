/**
 * @module   sharing
 * @owner    CLIENT
 * Purpose:  owner 2026-11-24: the Consultant portal shares stories too. This static list gives every story's public link,
 *           title, tag, first line, cover and link-preview image (request 20261124-client-to-consultant-share-stories).
 */
import { STORIES } from '@/lib/stories'
import { BP } from '@/lib/asset'
import { SITE_ORIGIN } from '@/lib/share'

export const dynamic = 'force-static'

export function GET() {
  const base = `${SITE_ORIGIN}${BP}`
  return Response.json({
    updated: new Date().toISOString().slice(0, 10),
    stories: STORIES.map((s) => {
      const c = s.slides[0]
      return {
        id: s.id, title: s.title, tag: s.tag, line: c.k === 'cover' ? c.sub : '',
        link: `${base}/s/${s.id}/`, cover: `${base}/img/${s.cover}.webp`, preview: `${base}/img/stories/og/${s.id}.jpg`,
        shareText: `${s.title}. Read more on BeWise Wellness:`,
      }
    }),
  })
}
