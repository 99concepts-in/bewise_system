/**
 * @module client-shell @owner CLIENT
 * Purpose: remember where a visitor was heading (e.g. the public booking link) across sign-in + onboarding.
 */
const KEY = 'bw-next'
const SAFE = /^\/app\/[a-z0-9/_-]*(\?[a-z0-9=&_-]*)?$/i // in-app paths only (no open redirects)
export function setNextStep(path: string) { try { if (SAFE.test(path)) sessionStorage.setItem(KEY, path) } catch { /* private mode */ } }
export function peekNextStep(): string | null { try { const v = sessionStorage.getItem(KEY); return v && SAFE.test(v) ? v : null } catch { return null } }
export function takeNextStep(): string | null { const v = peekNextStep(); try { sessionStorage.removeItem(KEY) } catch { /* noop */ } return v }
