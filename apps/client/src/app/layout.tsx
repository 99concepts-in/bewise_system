/**
 * @module client-shell  @owner CLIENT
 * Purpose: Root document — fonts (self-hosted Fraunces + Inter), cool paper background, PWA meta.
 * v5 (HUB 2026-11-20): Blue Bloom — the fixed v4 gradient wash is gone (one soft wash lives at the top of Home only).
 */
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { BP } from '@/lib/asset'

export const metadata: Metadata = {
  title: { default: 'BeWise · Holistic Wellness', template: '%s · BeWise' },
  description: 'Bach flower wellness sessions with Jitendra Khimlani, your personal blend, mood journal and gentle aromatherapy rituals.',
  applicationName: 'BeWise',
  manifest: `${BP}/manifest.webmanifest`,
  icons: { icon: `${BP}/img/brand/bewise-mark.svg`, apple: `${BP}/icon-192.png` },
  appleWebApp: { capable: true, title: 'BeWise', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  ...(process.env.NEXT_PUBLIC_NOINDEX === '1' ? { robots: { index: false, follow: false } } : {}),
}
export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#f3f6ff',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>
        <Providers>
          <div className="relative mx-auto min-h-dvh w-full max-w-[480px]">{children}</div>
        </Providers>
      </body>
    </html>
  )
}
