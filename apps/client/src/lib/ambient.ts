/**
 * @module   learn
 * @owner    CLIENT
 * Purpose:  Relaxing loop music for stories (owner 2026-11-24). 2 soundscapes (Calm, Chimes; owner removed Rain, Ocean and
 *           Binaural the same day), a random one on each open, mutable.
 *           Each is rendered once with an OfflineAudioContext into a seamless ~32 s loop (equal-power crossfade at the seam),
 *           encoded as WAV and played through an <audio> element. Media playback is not silenced by the iPhone ringer switch
 *           (live Web Audio was), and it starts reliably from a tap. No audio files, nothing to license.
 */
export type AmbientKind = 'calm' | 'chimes'
export const AMBIENT: { id: AmbientKind; label: string; emoji: string; hint?: string }[] = [
  { id: 'calm', label: 'Calm', emoji: '🌙' },
  { id: 'chimes', label: 'Chimes', emoji: '🎐' },
]
export const randomAmbient = (not?: AmbientKind) => { const pool = AMBIENT.filter((a) => a.id !== not); return pool[Math.floor(Math.random() * pool.length)].id }

const SR = 32000, LOOP = 32, XF = 4

// small seeded random so a soundscape renders the same each time
const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }

function reverb(ctx: BaseAudioContext, out: AudioNode, wetLevel = 0.5) {
  const len = Math.floor(ctx.sampleRate * 3), ir = ctx.createBuffer(2, len, ctx.sampleRate), r = rng(7)
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, 2.6) }
  const v = ctx.createConvolver(); v.buffer = ir
  const wet = ctx.createGain(); wet.gain.value = wetLevel; v.connect(wet); wet.connect(out)
  return v
}
function bus(ctx: BaseAudioContext, out: AudioNode, verb: AudioNode, dry = 0.7, send = 0.6) {
  const b = ctx.createGain(), d = ctx.createGain(), s = ctx.createGain(); d.gain.value = dry; s.gain.value = send
  b.connect(d); d.connect(out); b.connect(s); s.connect(verb); return b
}
function drone(ctx: BaseAudioContext, to: AudioNode, f: number, level: number, end: number) {
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.connect(to)
  const g = ctx.createGain(); g.gain.value = level; g.connect(lp)
  ;[f, f * 1.5, f * 2.005].forEach((fr, k) => { const o = ctx.createOscillator(); o.type = k ? 'sine' : 'triangle'; o.frequency.value = fr; o.connect(g); o.start(0); o.stop(end) })
}
function pads(ctx: BaseAudioContext, to: AudioNode, end: number, level = 0.05) {
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; lp.connect(to)
  const chords = [[220, 261.6, 329.6, 493.9], [174.6, 220, 261.6, 329.6], [130.8, 196, 293.7, 329.6], [196, 246.9, 293.7, 440]]
  for (let t = -3, i = 0; t < end; t += 8, i++) chords[i % 4].forEach((f) => [-4, 4].forEach((det) => {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f; o.detune.value = det
    const s = Math.max(0, t)
    g.gain.setValueAtTime(t < 0 ? level * 0.8 : 0, s); g.gain.linearRampToValueAtTime(level, t + 3); g.gain.linearRampToValueAtTime(level * 0.7, t + 7); g.gain.linearRampToValueAtTime(0, t + 11)
    o.connect(g); g.connect(lp); o.start(s); o.stop(t + 11.2)
  }))
}

async function render(kind: AmbientKind): Promise<AudioBuffer> {
  const total = LOOP + XF, ctx = new OfflineAudioContext(2, SR * total, SR)
  const master = ctx.createGain(); master.connect(ctx.destination)
  const verb = reverb(ctx, master)
  const r = rng(kind.length * 97 + 3)
  if (kind === 'calm') { pads(ctx, bus(ctx, master, verb, 0.6), total); drone(ctx, bus(ctx, master, verb, 0.8), 55, 0.05, total) }
  if (kind === 'chimes') {
    const b = bus(ctx, master, verb, 0.5, 0.8), scale = [523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7]
    for (let t = 0.2; t < total; t += 0.7 + r() * 1.9) {
      const f = scale[Math.floor(r() * scale.length)]
      ;[[f, 0.06], [f * 2.76, 0.018]].forEach(([fr, lv]) => {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = fr
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lv, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5); o.connect(g); g.connect(b); o.start(t); o.stop(t + 4.6)
      })
    }
    drone(ctx, bus(ctx, master, verb, 0.8), 87.3, 0.04, total)
  }
  const out = await ctx.startRendering()
  // seamless loop: fold the tail into the head with an equal-power crossfade, then normalise
  const n = SR * LOOP, x = SR * XF, loop = new AudioBuffer({ numberOfChannels: 2, length: n, sampleRate: SR })
  let peak = 0
  for (let c = 0; c < 2; c++) {
    const src = out.getChannelData(c), dst = loop.getChannelData(c)
    for (let i = 0; i < n; i++) {
      let v = src[i]
      if (i < x) { const p = i / x; v = src[i] * Math.sin((p * Math.PI) / 2) + src[n + i] * Math.cos((p * Math.PI) / 2) }
      dst[i] = v; peak = Math.max(peak, Math.abs(v))
    }
  }
  const k = peak > 0 ? 0.55 / peak : 1
  for (let c = 0; c < 2; c++) { const d = loop.getChannelData(c); for (let i = 0; i < n; i++) d[i] *= k }
  return loop
}

function wav(buf: AudioBuffer) {
  const ch = buf.numberOfChannels, n = buf.length, bytes = 44 + n * ch * 2, ab = new ArrayBuffer(bytes), v = new DataView(ab)
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
  w(0, 'RIFF'); v.setUint32(4, bytes - 8, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true)
  v.setUint32(24, buf.sampleRate, true); v.setUint32(28, buf.sampleRate * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * ch * 2, true)
  const data = [0, 1].slice(0, ch).map((c) => buf.getChannelData(c))
  let o = 44
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, data[c][i])); v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2 }
  return URL.createObjectURL(new Blob([ab], { type: 'audio/wav' }))
}

class Player {
  private el: HTMLAudioElement | null = null
  private urls = new Map<AmbientKind, Promise<string>>()
  private ready = new Map<AmbientKind, string>()
  kind: AmbientKind | null = null
  private audio() {
    if (!this.el) { this.el = new Audio(); this.el.loop = true; this.el.preload = 'auto'; this.el.setAttribute('playsinline', '') }
    // iOS 16.4+: play as media so the ringer switch doesn't silence it
    try { (navigator as unknown as { audioSession?: { type: string } }).audioSession!.type = 'playback' } catch { /* older browsers */ }
    return this.el
  }
  /** render a soundscape ahead of time (call when a story opens) */
  prepare(kind: AmbientKind) {
    if (!this.urls.has(kind)) this.urls.set(kind, render(kind).then(wav).then((u) => { this.ready.set(kind, u); return u }))
    return this.urls.get(kind)!
  }
  /** prepare the others quietly in the background, one at a time, so switching is instant */
  prepareAll(first: AmbientKind) {
    let chain = this.prepare(first)
    for (const a of AMBIENT) if (a.id !== first) chain = chain.then(() => new Promise((r) => setTimeout(r, 400))).then(() => this.prepare(a.id))
    return chain
  }
  /** call from a tap */
  async play(kind: AmbientKind) {
    const a = this.audio(); this.kind = kind
    // ready already: start inside the tap itself (iPhone needs that); otherwise wait for it
    const cached = this.ready.get(kind)
    if (cached) { if (a.src !== cached) { a.src = cached; a.currentTime = 0 } try { await a.play() } catch { /* blocked until the next tap */ } return }
    const url = await this.prepare(kind)
    if (this.kind !== kind) return
    if (a.src !== url) { a.src = url; a.currentTime = 0 }
    try { await a.play() } catch { /* blocked until the next tap */ }
  }
  pause() { this.el?.pause() }
  stop() { if (this.el) { this.el.pause(); this.el.currentTime = 0 } this.kind = null }
  get playing() { return !!this.el && !this.el.paused }
}

let one: Player | null = null
export const ambient = () => (one ??= new Player())
