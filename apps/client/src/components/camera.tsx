'use client'
/**
 * @module   onboarding
 * @owner    CLIENT
 * @screens  CL-05b Your photo (owner request 2026-11-17) · reused in Me → change photo
 * @sensitive Profile photo. Preview keeps it on-device; production uploads to a private bucket (signed URL) via crm.
 * Purpose:  Live selfie capture in a circular viewfinder (getUserMedia), shutter flash, flip camera, retake,
 *           gallery fallback, square 512px JPEG output.
 */
import { AnimatePresence, motion } from 'motion/react'
import { Camera, ImagePlus, RefreshCw, SwitchCamera, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Btn, buzz, ease } from './ui'

type Mode = 'idle' | 'starting' | 'live' | 'review' | 'blocked'
const OUT = 512

export function PhotoCapture({ initial, onDone, onSkip, skipLabel = 'Skip for now' }: { initial?: string; onDone: (dataUrl: string) => void; onSkip?: () => void; skipLabel?: string }) {
  const [mode, setMode] = useState<Mode>(initial ? 'review' : 'idle')
  const [shot, setShot] = useState<string | undefined>(initial)
  const [facing, setFacing] = useState<'user' | 'environment'>('user')
  const [flash, setFlash] = useState(0)
  const [blockedMsg, setBlockedMsg] = useState('')
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const file = useRef<HTMLInputElement>(null)

  const [canCam, setCanCam] = useState(true)
  const stop = useCallback(() => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null }, [])
  useEffect(() => stop, [stop])
  useEffect(() => { setCanCam(!!navigator.mediaDevices?.getUserMedia) }, [])
  // attach the stream once the <video> has mounted
  useEffect(() => {
    if (mode === 'live' && video.current && stream.current && video.current.srcObject !== stream.current) {
      video.current.srcObject = stream.current; video.current.play().catch(() => {})
    }
  }, [mode])

  const start = useCallback(async (face = facing) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setBlockedMsg('This browser can’t open the camera here. You can choose a photo instead.'); setMode('blocked'); return
    }
    setMode('starting'); stop()
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: face, width: { ideal: 1080 }, height: { ideal: 1080 } }, audio: false })
      stream.current = s
      setMode('live')
    } catch (e) {
      const name = (e as DOMException)?.name
      setBlockedMsg(name === 'NotAllowedError' ? 'Camera access was blocked. You can allow it in your browser settings, or choose a photo instead.' : 'We couldn’t start the camera. You can choose a photo instead.')
      setMode('blocked')
    }
  }, [facing, stop])

  const capture = () => {
    const v = video.current
    if (!v || !v.videoWidth) return
    const side = Math.min(v.videoWidth, v.videoHeight)
    const c = document.createElement('canvas'); c.width = c.height = OUT
    const ctx = c.getContext('2d')!
    if (facing === 'user') { ctx.translate(OUT, 0); ctx.scale(-1, 1) } // selfie = mirror, like the preview
    ctx.drawImage(v, (v.videoWidth - side) / 2, (v.videoHeight - side) / 2, side, side, 0, 0, OUT, OUT)
    const url = c.toDataURL('image/jpeg', 0.86)
    buzz(20); setFlash((f) => f + 1)
    setTimeout(() => { setShot(url); setMode('review'); stop() }, 160)
  }

  const fromFile = async (f?: File) => {
    if (!f) return
    try {
      const bmp = await createImageBitmap(f, { imageOrientation: 'from-image' } as ImageBitmapOptions)
      const side = Math.min(bmp.width, bmp.height)
      const c = document.createElement('canvas'); c.width = c.height = OUT
      c.getContext('2d')!.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, OUT, OUT)
      setShot(c.toDataURL('image/jpeg', 0.86)); setMode('review'); stop()
    } catch { setBlockedMsg('That file couldn’t be opened. Try a JPG or PNG photo.'); setMode('blocked') }
  }

  const flip = () => { const n = facing === 'user' ? 'environment' : 'user'; setFacing(n); start(n) }

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative mx-auto mt-5 grid size-[min(232px,30dvh)] place-items-center">
        {/* breathing rings */}
        <motion.span className="absolute inset-[-18px] rounded-full border-2 border-white" animate={{ scale: [1, 1.05, 1], opacity: [0.7, 0.3, 0.7] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        <svg className="absolute inset-[-8px] -rotate-90" viewBox="0 0 288 288" aria-hidden>
          <circle cx="144" cy="144" r="140" fill="none" stroke="#dfe4f3" strokeWidth="3" />
          <motion.circle cx="144" cy="144" r="140" fill="none" stroke="url(#ring)" strokeWidth="4" strokeLinecap="round"
            animate={{ pathLength: mode === 'review' ? 1 : mode === 'live' ? 0.72 : 0.18, rotate: mode === 'live' ? 360 : 0 }}
            transition={{ pathLength: { duration: 0.8, ease }, rotate: { duration: 6, repeat: mode === 'live' ? Infinity : 0, ease: 'linear' } }} style={{ originX: '50%', originY: '50%' }} />
          <defs><linearGradient id="ring" x1="0" x2="1"><stop offset="0" stopColor="#243D91" /><stop offset="1" stopColor="#b89b64" /></linearGradient></defs>
        </svg>
        <div className="relative size-[calc(100%-16px)] overflow-hidden rounded-full bg-sky-100 shadow-[inset_0_0_0_6px_rgba(255,255,255,.8)]">
          <AnimatePresence mode="wait">
            {mode === 'review' && shot ? (
              <motion.img key="shot" src={shot} alt="Your photo" className="h-full w-full object-cover" initial={{ scale: 1.15, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease }} />
            ) : mode === 'live' || mode === 'starting' ? (
              <motion.video key="live" ref={video} playsInline muted autoPlay className="h-full w-full object-cover" style={{ transform: facing === 'user' ? 'scaleX(-1)' : undefined }}
                initial={{ opacity: 0 }} animate={{ opacity: mode === 'live' ? 1 : 0 }} />
            ) : (
              <motion.div key="ph" className="grid h-full w-full place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <svg viewBox="0 0 120 120" className="h-28 w-28 text-white" aria-hidden><circle cx="60" cy="46" r="22" fill="currentColor" /><path d="M18 112c4-24 22-36 42-36s38 12 42 36" fill="currentColor" /></svg>
              </motion.div>
            )}
          </AnimatePresence>
          {mode === 'live' && (
            <motion.div className="pointer-events-none absolute inset-[18%] rounded-[50%] border-2 border-dashed border-white/70" initial={{ opacity: 0 }} animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2.2, repeat: Infinity }} />
          )}
          <AnimatePresence>{flash ? <motion.div key={flash} className="absolute inset-0 bg-white" initial={{ opacity: 0.95 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }} /> : null}</AnimatePresence>
        </div>
      </div>

      <p className="mx-auto mt-5 max-w-[300px] text-center text-[14px] leading-5 text-muted" aria-live="polite">
        {mode === 'live' ? 'Centre your face in the circle. Soft light works best.' : mode === 'review' ? 'Lovely. You can change this anytime from Me.' : mode === 'blocked' ? blockedMsg : 'Optional. Your photo stays private. Only you and Jitendra Khimlani can see it.'}
      </p>

      <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => fromFile(e.target.files?.[0])} />

      <div className="mt-auto space-y-3 pt-4 pb-3 safe-b">
        {mode === 'live' ? (
          <div className="flex items-center justify-between px-6">
            <motion.button whileTap={{ scale: 0.9 }} aria-label="Cancel" onClick={() => { stop(); setMode(shot ? 'review' : 'idle') }} className="grid size-12 place-items-center rounded-full bg-white text-navy shadow-[var(--shadow-card)]"><X className="size-5" /></motion.button>
            <motion.button whileTap={{ scale: 0.86 }} aria-label="Take photo" onClick={capture} className="grid size-[78px] place-items-center rounded-full bg-white shadow-[var(--shadow-float)]">
              <span className="size-[62px] rounded-full bg-navy ring-4 ring-white" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9, rotate: 180 }} aria-label="Switch camera" onClick={flip} className="grid size-12 place-items-center rounded-full bg-white text-navy shadow-[var(--shadow-card)]"><SwitchCamera className="size-5" /></motion.button>
          </div>
        ) : mode === 'review' && shot ? (
          <>
            <Btn full variant="gradient" onClick={() => onDone(shot)}>Use this photo</Btn>
            <div className="flex gap-3">
              <Btn full size="md" variant="white" onClick={() => start()}><RefreshCw className="size-4" /> Retake</Btn>
              <Btn full size="md" variant="white" onClick={() => file.current?.click()}><ImagePlus className="size-4" /> Gallery</Btn>
            </div>
          </>
        ) : (
          <>
            <Btn full variant="gradient" loading={mode === 'starting'} onClick={() => start()} disabled={!canCam}><Camera className="size-5" /> Take a photo</Btn>
            <Btn full size="md" variant="white" onClick={() => file.current?.click()}><ImagePlus className="size-4" /> Choose from gallery</Btn>
            {onSkip && <Btn full size="md" variant="ghost" onClick={onSkip}>{skipLabel}</Btn>}
          </>
        )}
      </div>
    </div>
  )
}
