import type { NextConfig } from 'next'

// STATIC_EXPORT=1 → plain static site for GitHub Pages (preview build). Response headers don't apply there.
const exportMode = process.env.STATIC_EXPORT === '1'
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

async function headers() {
  return [
    { source: '/img/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    {
      source: '/:path*',
      headers: [
        // camera is needed for the onboarding photo (CL-05b); microphone for intake voice notes
        { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ]
}

const config: NextConfig = {
  ...(exportMode ? { output: 'export' as const, trailingSlash: true, basePath, images: { unoptimized: true } } : { headers }),
  reactStrictMode: true,
  poweredByHeader: false,
  agentRules: false,
  devIndicators: false,
  experimental: { optimizePackageImports: ['lucide-react', 'motion'] },
}
export default config
