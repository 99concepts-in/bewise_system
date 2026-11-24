'use client'
/**
 * @module client-ui @owner CLIENT
 * Owner 2026-11-20: dates are typed, not picked: a plain number box shown as DD/MM/YYYY (slashes added as you type).
 * `value` / `onChange` use ISO yyyy-mm-dd; onChange('') until the date is complete and real.
 */
import { useEffect, useState } from 'react'

const toText = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '')
const mask = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 8)
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean).join('/')
}
export function parseDMY(text: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text)
  if (!m) return ''
  const [, dd, mm, yyyy] = m, dt = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
  if (dt.getFullYear() !== Number(yyyy) || dt.getMonth() !== Number(mm) - 1 || dt.getDate() !== Number(dd)) return ''
  return `${yyyy}-${mm}-${dd}`
}

/** `min` / `max` (ISO) — owner 2026-11-24: a preferred session date can't be in the past. Out of range → onChange('') and a message. */
export function DateInput({ value, onChange, className, id, label = 'Date (DD/MM/YYYY)', autoComplete, min, max, minMsg = 'Please choose today or a later date', maxMsg = 'Please choose an earlier date' }: {
  value: string; onChange: (iso: string) => void; className?: string; id?: string; label?: string; autoComplete?: string
  min?: string; max?: string; minMsg?: string; maxMsg?: string
}) {
  const [text, setText] = useState(() => toText(value))
  const [err, setErr] = useState('')
  useEffect(() => { if (value && toText(value) !== text) setText(toText(value)) }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  // a saved date that is now out of range (e.g. yesterday's draft) is flagged and cleared from the answer
  useEffect(() => {
    if (!value) return
    const e = min && value < min ? minMsg : max && value > max ? maxMsg : ''
    if (e) { setErr(e); onChange('') }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const change = (raw: string) => {
    const t = mask(raw); setText(t)
    const iso = parseDMY(t)
    const e = iso && min && iso < min ? minMsg : iso && max && iso > max ? maxMsg : t.length === 10 && !iso ? 'Please check the date' : ''
    setErr(e); onChange(e ? '' : iso)
  }
  return (
    <>
      <input id={id} type="text" inputMode="numeric" autoComplete={autoComplete} placeholder="DD/MM/YYYY" aria-label={label} maxLength={10} value={text}
        aria-invalid={!!err || undefined} onChange={(e) => change(e.target.value)} className={className} />
      {err && (min || max) ? <p role="alert" className="mt-1.5 px-1 text-[13px] font-semibold text-[#b3261e]">{err}</p> : null}
    </>
  )
}
