/**
 * lazy() that can be preloaded and renders synchronously once loaded (no Suspense flash on later navigations).
 */
import { createElement, lazy, type ComponentType } from 'react'

export function lazyWithPreload<P extends object>(factory: () => Promise<{ default: ComponentType<P> }>) {
  let Loaded: ComponentType<P> | null = null
  let promise: Promise<{ default: ComponentType<P> }> | null = null
  const load = () => (promise ??= factory().then((m) => { Loaded = m.default; return m }))
  const Lazy = lazy(load)
  const C = (props: P) => createElement((Loaded ?? Lazy) as ComponentType<P>, props)
  C.preload = load
  return C as ComponentType<P> & { preload: () => Promise<unknown> }
}
