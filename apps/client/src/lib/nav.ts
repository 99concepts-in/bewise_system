/**
 * @module client-shell @owner CLIENT
 * Navigation that can't get stuck: try the fast in-app route change, and if the page hasn't changed shortly after
 * (e.g. the host failed to serve the next screen's files), fall back to a normal page load (owner 2026-11-18).
 */
import { BP } from './asset'

type R = { push: (h: string) => void; replace: (h: string) => void }
const norm = (p: string) => p.replace(/\/+$/, '') || '/'

export function goSafe(router: R, href: string, mode: 'push' | 'replace' = 'push') {
  const from = norm(window.location.pathname)
  router[mode](href)
  window.setTimeout(() => {
    if (norm(window.location.pathname) !== from) return
    const url = `${BP}${href}`
    if (mode === 'replace') window.location.replace(url); else window.location.assign(url)
  }, 1500)
}
