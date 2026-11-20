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

export function DateInput({ value, onChange, className, id, label = 'Date (DD/MM/YYYY)', autoComplete }: { value: string; onChange: (iso: string) => void; className?: string; id?: string; label?: string; autoComplete?: string }) {
  const [text, setText] = useState(() => toText(value))
  useEffect(() => { if (value && toText(value) !== text) setText(toText(value)) }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <input id={id} type="text" inputMode="numeric" autoComplete={autoComplete} placeholder="DD/MM/YYYY" aria-label={label} maxLength={10} value={text}
      onChange={(e) => { const t = mask(e.target.value); setText(t); onChange(parseDMY(t)) }}
      className={className} />
  )
}
