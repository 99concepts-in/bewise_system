/**
 * @module client-shell  @owner CLIENT
 * Purpose: Root document — fonts (self-hosted Plus Jakarta Sans, D-21), v4 gradient wash, PWA meta.
 */
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { BP } from '@/lib/asset'

export const metadata: Metadata = {
  title: { default: 'BeWise · Holistic Wellness', template: '%s · BeWise' },
  description: 'Bach flower remedy consultations with Jitu Bhaiya, your personal blend, mood journal and gentle aromatherapy rituals.',
  applicationName: 'BeWise',
  manifest: `${BP}/manifest.webmanifest`,
  icons: { icon: `${BP}/img/logo-mark.png`, apple: `${BP}/icon-192.png` },
  appleWebApp: { capable: true, title: 'BeWise', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  ...(process.env.NEXT_PUBLIC_NOINDEX === '1' ? { robots: { index: false, follow: false } } : {}),
}
export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#dce2f5',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>
        <div className="bw-wash fixed inset-0 -z-10" aria-hidden />
        <Providers>
          <div className="relative mx-auto min-h-dvh w-full max-w-[480px]">{children}</div>
        </Providers>
      </body>
    </html>
  )
}
