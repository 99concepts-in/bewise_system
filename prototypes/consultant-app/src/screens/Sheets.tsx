/**
 * Sheets: one provider, lazily loaded bodies (SheetBodies.tsx) so the first screen paints with less JavaScript.
 */
import { createContext, Suspense, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Sheet } from '../ui/kit'
import { lazyWithPreload } from '../ui/lazy'
export * from '../lib/labels'
import type { Service } from '../data/types'


export type Open =
  | { k: 'session'; id: string }
  | { k: 'slots'; mode: 'reschedule'; apptId: string }
  | { k: 'new'; personId?: string; requestId?: string; service?: Service }
  | { k: 'remedy'; apptId: string }
  | { k: 'notices' }
  | { k: 'add'; then: 'profile' | 'express' }
  | { k: 'share' }
  | { k: 'calendar' }
  | null

export interface Api {
  session: (id: string) => void
  reschedule: (apptId: string) => void
  book: (personId: string) => void
  remedy: (apptId: string) => void
  notices: () => void
  addPerson: (then?: 'profile' | 'express') => void
  /** New appointment by Jitu Bhaiya or the team — any time of day; `express` jumps straight to the next free times */
  newAppt: (o?: { personId?: string; requestId?: string; service?: Service }) => void
  assign: (requestId: string) => void
  express: (personId?: string) => void
  share: () => void
  calendar: () => void
}
const C = createContext<Api | null>(null)
export const useSheets = () => useContext(C)!

export function SheetsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<Open>(null)
  const close = useCallback(() => setOpen(null), [])
  const api = useMemo<Api>(() => ({
    session: (id) => setOpen({ k: 'session', id }),
    reschedule: (apptId) => setOpen({ k: 'slots', mode: 'reschedule', apptId }),
    book: (personId) => setOpen({ k: 'new', personId }),
    remedy: (apptId) => setOpen({ k: 'remedy', apptId }),
    notices: () => setOpen({ k: 'notices' }),
    addPerson: (then = 'profile') => setOpen({ k: 'add', then }),
    express: (personId) => setOpen({ k: 'new', personId }),
    newAppt: (o = {}) => setOpen({ k: 'new', ...o }),
    assign: (requestId) => setOpen({ k: 'new', requestId }),
    share: () => setOpen({ k: 'share' }),
    calendar: () => setOpen({ k: 'calendar' }),
  }), [])
  return (
    <C.Provider value={api}>
      {children}
      {KINDS.map((k) => (
        <Sheet key={k} open={open?.k === k} onClose={close} label={SHEET_LABEL[k]}>
          {open?.k === k && <Suspense fallback={<div className="sheet-loading" aria-busy="true" />}><SheetBody open={open} close={close} api={api} /></Suspense>}
        </Sheet>
      ))}
    </C.Provider>
  )
}

type Kind_ = NonNullable<Open>['k']
const KINDS: Kind_[] = ['session', 'slots', 'remedy', 'notices', 'add', 'new', 'share', 'calendar']
const SHEET_LABEL: Record<Kind_, string> = {
  session: 'Session details', slots: 'Pick a time', remedy: 'Give remedy', notices: 'Updates',
  add: 'Add a person', new: 'New appointment', share: 'Share your booking link', calendar: 'Calendar',
}
export const SheetBody = lazyWithPreload(() => import('./SheetBodies'))

