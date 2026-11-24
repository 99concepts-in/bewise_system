/**
 * @module   learn
 * @owner    CLIENT
 * Purpose:  Owner 2026-11-24: relaxing background music for stories, 3 kinds, mutable. Generated live with the Web Audio API
 *           (no audio files, nothing to license, loops forever without a seam):
 *             calm   · warm, slowly changing pad chords
 *             rain   · soft rain and wind over a low drone
 *             chimes · gentle wind chimes on a pentatonic scale over a drone
 *           Browsers only allow sound after a tap, so `start` is called from a tap; it fades in and out gently.
 */
export type AmbientKind = 'calm' | 'rain' | 'chimes'
export const AMBIENT: { id: AmbientKind; label: string; emoji: string }[] = [
  { id: 'calm', label: 'Calm', emoji: '🌙' },
  { id: 'rain', label: 'Rain', emoji: '🌧️' },
  { id: 'chimes', label: 'Chimes', emoji: '🎐' },
]

const VOL = 0.22
type Stopper = () => void

class Ambient {
  private ctx: AudioContext | null = null
  private out: GainNode | null = null
  private verb: ConvolverNode | null = null
  private stopFns: Stopper[] = []
  private timers: number[] = []
  kind: AmbientKind | null = null

  private ensure() {
    if (this.ctx) return this.ctx
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
    const ctx = new AC()
    const out = ctx.createGain(); out.gain.value = 0; out.connect(ctx.destination)
    // simple reverb: decaying stereo noise impulse
    const len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6) }
    const verb = ctx.createConvolver(); verb.buffer = ir
    const wet = ctx.createGain(); wet.gain.value = 0.55; verb.connect(wet); wet.connect(out)
    this.ctx = ctx; this.out = out; this.verb = verb
    return ctx
  }

  /** start (or switch to) a soundscape; call from a tap */
  start(kind: AmbientKind) {
    const ctx = this.ensure()
    if (ctx.state === 'suspended') void ctx.resume()
    if (this.kind === kind) { this.fade(VOL); return }
    this.clear()
    this.kind = kind
    if (kind === 'calm') this.calm(); else if (kind === 'rain') this.rain(); else this.chimes()
    this.fade(VOL)
  }
  fade(to: number, sec = 1.6) {
    if (!this.ctx || !this.out) return
    const g = this.out.gain, t = this.ctx.currentTime
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(to, t + sec)
  }
  /** fade out and stop everything */
  stop() {
    if (!this.ctx) return
    this.fade(0, 0.8)
    const ctx = this.ctx
    window.setTimeout(() => { this.clear(); this.kind = null; if (ctx.state === 'running') void ctx.suspend() }, 900)
  }
  private clear() { this.stopFns.forEach((f) => { try { f() } catch { /* already stopped */ } }); this.stopFns = []; this.timers.forEach((t) => clearTimeout(t)); this.timers = [] }
  private dest(dry = 0.7) {
    const ctx = this.ctx!, g = ctx.createGain(); g.gain.value = dry; g.connect(this.out!); const send = ctx.createGain(); send.gain.value = 0.6; send.connect(this.verb!)
    const bus = ctx.createGain(); bus.connect(g); bus.connect(send); return bus
  }
  private drone(freq: number, level: number) {
    const ctx = this.ctx!, bus = this.dest(0.8)
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.connect(bus)
    const g = ctx.createGain(); g.gain.value = level; g.connect(lp)
    const os = [freq, freq * 1.5, freq * 2.005].map((f, k) => { const o = ctx.createOscillator(); o.type = k ? 'sine' : 'triangle'; o.frequency.value = f; o.connect(g); o.start(); return o })
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = level * 0.5; lfo.connect(lg); lg.connect(g.gain); lfo.start()
    this.stopFns.push(() => { os.forEach((o) => o.stop()); lfo.stop() })
  }

  // calm: slow pad chords (A minor 9 → F major 7 → C add9 → G add9), each held ~9 s with soft swells
  private calm() {
    const ctx = this.ctx!, bus = this.dest(0.6)
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; lp.Q.value = 0.4; lp.connect(bus)
    const chords = [[220, 261.6, 329.6, 493.9], [174.6, 220, 261.6, 329.6], [130.8, 196, 293.7, 329.6], [196, 246.9, 293.7, 440]]
    let i = 0
    const play = () => {
      const t = ctx.currentTime, notes = chords[i++ % chords.length]
      notes.forEach((f) => {
        [-4, 4].forEach((det) => {
          const o = ctx.createOscillator(), g = ctx.createGain()
          o.type = 'sine'; o.frequency.value = f; o.detune.value = det
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.045, t + 3); g.gain.linearRampToValueAtTime(0.03, t + 7); g.gain.linearRampToValueAtTime(0, t + 11)
          o.connect(g); g.connect(lp); o.start(t); o.stop(t + 11.2)
        })
      })
      this.timers.push(window.setTimeout(play, 8500))
    }
    play()
    this.drone(55, 0.05)
  }

  // rain: filtered noise with slow gusts, a few soft droplets, low drone underneath
  private rain() {
    const ctx = this.ctx!, bus = this.dest(0.9)
    const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate), d = buf.getChannelData(0)
    let last = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.04 * w) / 1.04; d[i] = last * 3.2 + w * 0.12 }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 250
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600
    const g = ctx.createGain(); g.gain.value = 0.5
    src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(bus); src.start()
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.05; lg.gain.value = 0.18; lfo.connect(lg); lg.connect(g.gain); lfo.start()
    this.stopFns.push(() => { src.stop(); lfo.stop() })
    const drop = () => {
      const t = ctx.currentTime, o = ctx.createOscillator(), og = ctx.createGain()
      o.type = 'sine'; o.frequency.setValueAtTime(1400 + Math.random() * 1600, t); o.frequency.exponentialRampToValueAtTime(400, t + 0.08)
      og.gain.setValueAtTime(0.025, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
      o.connect(og); og.connect(bus); o.start(t); o.stop(t + 0.15)
      this.timers.push(window.setTimeout(drop, 120 + Math.random() * 600))
    }
    drop()
    this.drone(65.4, 0.035)
  }

  // chimes: random notes from a pentatonic scale, bell-like (two partials), long decay, over a drone
  private chimes() {
    const ctx = this.ctx!, bus = this.dest(0.5)
    const scale = [523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7]
    const ring = () => {
      const t = ctx.currentTime, f = scale[Math.floor(Math.random() * scale.length)]
      ;[[f, 0.06], [f * 2.76, 0.018]].forEach(([fr, lv]) => {
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.type = 'sine'; o.frequency.value = fr
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lv, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5)
        o.connect(g); g.connect(bus); o.start(t); o.stop(t + 4.6)
      })
      this.timers.push(window.setTimeout(ring, 700 + Math.random() * 1900))
    }
    ring()
    this.drone(87.3, 0.04)
  }
}

let one: Ambient | null = null
export const ambient = () => (one ??= new Ambient())
