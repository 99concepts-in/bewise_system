'use client'
/**
 * @module   auth-ux
 * @owner    CLIENT (UX) · auth provider = HUB/OWNER (D-04 phone OTP)
 * @screens  CL-03 Your number · CL-04 Verify
 * @stub     Preview build: no SMS is sent; demo code below. Replace with Supabase phone OTP once FOUNDATION ✅.
 */
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion, useAnimate } from 'motion/react'
import { ChevronLeft, ShieldCheck } from 'lucide-react'
import { Suspense, useEffect, useRef, useState } from 'react'
import { LogoMark } from '@/components/brand'
import { Btn, IconBtn, buzz, ease } from '@/components/ui'
import { useApp } from '@/lib/store'
import { takeNextStep } from '@/lib/next-step'

const CODE_LEN = 4 // owner 2026-11-18: 4-digit codes everywhere
const DEMO_CODE = '2468'

export default function SignInPage() {
  return <Suspense><SignIn /></Suspense>
}

function SignIn() {
  const router = useRouter()
  const params = useSearchParams()
  const returning = params.get('returning') === '1'
  const profile = useApp((s) => s.profile)
  const setProfile = useApp((s) => s.setProfile)
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [left, setLeft] = useState(24)
  const [scope, animate] = useAnimate()
  const codeRef = useRef<HTMLInputElement>(null)
  const valid = /^[6-9]\d{9}$/.test(phone)

  useEffect(() => {
    if (step !== 'code') return
    setLeft(24)
    const t = setInterval(() => setLeft((x) => (x > 0 ? x - 1 : 0)), 1000)
    setTimeout(() => codeRef.current?.focus(), 350)
    return () => clearInterval(t)
  }, [step])

  const sendCode = async () => {
    if (!valid) { setErr('Please enter a 10-digit Indian mobile number'); return }
    setErr(''); setBusy(true)
    await new Promise((r) => setTimeout(r, 650))
    setBusy(false); setStep('code')
  }

  const verify = async (c: string) => {
    setBusy(true)
    await new Promise((r) => setTimeout(r, 550))
    setBusy(false)
    if (c !== DEMO_CODE) {
      setErr('That code doesn’t match. Please try again.'); buzz(30)
      animate(scope.current, { x: [0, -10, 10, -6, 6, 0] }, { duration: 0.4 })
      setCode(''); codeRef.current?.focus(); return
    }
    setProfile({ phone })
    if (profile?.onboardedAt && (returning || profile.phone === phone)) router.replace(takeNextStep() ?? '/app')
    else router.push('/onboarding/about')
  }

  const onCode = (v: string) => {
    const c = v.replace(/\D/g, '').slice(0, CODE_LEN)
    setCode(c); setErr('')
    if (c.length === CODE_LEN) verify(c)
  }

  return (
    <main className="flex min-h-dvh flex-col px-5 safe-t">
      <header className="flex items-center justify-between pt-2">
        <IconBtn label="Back" onClick={() => (step === 'code' ? setStep('phone') : router.back())}><ChevronLeft className="size-5" /></IconBtn>
        <LogoMark size={36} />
        <span className="size-11" />
      </header>

      <AnimatePresence mode="wait">
        {step === 'phone' ? (
          <motion.section key="phone" className="flex flex-1 flex-col" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35, ease }}>
            <h1 className="h-duo mt-10">{returning ? 'Welcome' : 'Welcome to'} <em>{returning ? 'back' : 'BeWise'}</em></h1>
            <p className="mt-3 text-[15px] text-muted">Enter your mobile number. We’ll send a 4-digit code to sign you in.</p>
            <label htmlFor="phone" className="mt-8 text-[13px] font-semibold text-navy">Mobile number</label>
            <div className="mt-2 flex h-16 items-center rounded-full bg-white pl-2 pr-5 shadow-[var(--shadow-card)] ring-1 ring-transparent transition focus-within:ring-navy">
              <span className="mr-3 flex h-12 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-peri-50 px-4 text-[16px] font-bold text-navy">🇮🇳 +91</span>
              <input id="phone" inputMode="numeric" autoComplete="tel-national" autoFocus value={phone} maxLength={10}
                onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setErr('') }}
                onKeyDown={(e) => e.key === 'Enter' && sendCode()}
                className="tnum w-full bg-transparent text-[20px] font-semibold tracking-[0.06em] text-navy outline-none placeholder:text-[#b6bccb]" placeholder="98765 43210" aria-describedby="phone-err" />
            </div>
            <p id="phone-err" className="mt-2 min-h-5 text-[13px] text-rose">{err}</p>
            <div className="mt-auto space-y-3 pb-3 safe-b">
              <p className="flex items-center justify-center gap-1.5 text-[12px] text-muted"><ShieldCheck className="size-4 text-sage" /> Your number stays private. We never share it.</p>
              <Btn full variant={valid ? 'gradient' : 'primary'} disabled={!valid} loading={busy} onClick={sendCode}>Send code</Btn>
            </div>
          </motion.section>
        ) : (
          <motion.section key="code" className="flex flex-1 flex-col" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35, ease }}>
            <h1 className="h-duo mt-10">Check your <em>messages</em></h1>
            <p className="mt-3 text-[15px] text-muted">We sent a code to <b className="text-navy">+91 {phone.slice(0, 5)} {phone.slice(5)}</b></p>
            <div ref={scope} className="relative mt-8" onClick={() => codeRef.current?.focus()}>
              <input ref={codeRef} value={code} onChange={(e) => onCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={CODE_LEN}
                aria-label="4-digit code" aria-describedby="code-err" className="absolute inset-0 z-10 opacity-0" />
              <div className="mx-auto flex max-w-[300px] justify-between gap-3" aria-hidden>
                {Array.from({ length: CODE_LEN }).map((_, k) => {
                  const ch = code[k], active = k === code.length
                  return (
                    <motion.div key={k} className="grid h-[72px] flex-1 place-items-center rounded-[22px] bg-white text-[28px] font-bold text-navy shadow-[var(--shadow-card)]"
                      animate={{ scale: active ? 1.05 : 1, boxShadow: active ? '0 0 0 2px #182957' : '0 8px 24px rgba(24,41,87,0.06)' }} transition={{ duration: 0.2 }}>
                      <AnimatePresence mode="popLayout">
                        {ch ? <motion.span key={ch + k} initial={{ y: 12, opacity: 0, scale: 0.6 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 26 }}>{ch}</motion.span>
                          : active ? <motion.span className="block h-6 w-0.5 rounded bg-navy" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} /> : null}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            </div>
            <p id="code-err" className="mt-3 min-h-5 text-[13px] text-rose">{err}</p>
            <div className="mt-1 flex items-center justify-between text-[14px]">
              <span className="text-muted">{left > 0 ? <>Resend in <span className="tnum font-semibold text-navy">0:{String(left).padStart(2, '0')}</span></> : 'Didn’t get it?'}</span>
              <button disabled={left > 0} onClick={() => setLeft(24)} className="font-semibold text-navy disabled:opacity-40">Resend code</button>
            </div>
            <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} onClick={() => onCode(DEMO_CODE)}
              className="mx-auto mt-8 rounded-full border border-dashed border-[#b9c2dc] bg-white/60 px-4 py-2 text-[13px] text-muted">
              Preview build — no SMS is sent. Tap to use code <b className="tnum text-navy">{DEMO_CODE}</b>
            </motion.button>
            <div className="mt-auto pb-3 safe-b">
              <Btn full variant="gradient" disabled={code.length < CODE_LEN} loading={busy} onClick={() => verify(code)}>Verify</Btn>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  )
}
