'use client'
/**
 * @module   journal
 * @owner    CLIENT
 * @screens  CL-08 Home · mood garden (owner 2026-11-24)
 * Purpose:  The member's moods as a garden: a "bloom" graph where each petal is a feeling (longer petal = felt more often),
 *           a 14-day row of little flowers, and two gentle lines. Until there are 10 check-ins, a 10-petal flower fills in
 *           one petal per check-in and asks for a few more. Never medical, never a score.
 */
import { motion, useReducedMotion } from 'motion/react'
import { Lightbulb, Plus } from 'lucide-react'
import { MoodImg } from './brand'
import { buzz } from './ui'
import { useApp } from '@/lib/store'
import { moodOf, type Emotion } from '@/lib/data'
import { dailyInsight, lastNDays, moodMix, progressLines } from '@/lib/insights'
import { fmtDay } from '@/lib/format'

export const GARDEN_MIN = 10
const WASH = 'linear-gradient(160deg,#FFF3DF 0%,#FDE3EC 42%,#E7E4FF 78%,#DDF0F4 100%)'

/** petal from the centre up to length L (half width w); same shape at every size so motion can tween `d` */
const petal = (L: number, w: number) => `M0 0C${w} ${-L * 0.3} ${w * 0.85} ${-L * 0.9} 0 ${-L}C${-w * 0.85} ${-L * 0.9} ${-w} ${-L * 0.3} 0 0Z`
const shade = (hex: string, k = 0.78) => {
  const n = parseInt(hex.slice(1), 16), f = (x: number) => Math.round(x * k)
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`
}

export function MoodGarden({ onLog }: { onLog: () => void }) {
  const journal = useApp((s) => s.journal)
  const blend = useApp((s) => s.blend)
  if (journal.length < GARDEN_MIN) return <Seedling n={journal.length} onLog={onLog} colors={[...journal].reverse().map((e) => moodOf(e.emotion).color)} />
  const mix = moodMix(journal, 30).slice(0, 7)
  const days = lastNDays(journal, 14)
  const lines = progressLines(journal, blend?.startedOn).slice(0, 2)
  return (
    <section className="relative overflow-hidden rounded-[30px] p-5 shadow-[var(--shadow-card)]" style={{ background: WASH }} aria-labelledby="garden-h">
      <Deco />
      <div className="relative">
        <p className="eyebrow text-[#8a4b6b]">{blend ? `Since ${fmtDay(blend.startedOn)}` : 'Last 30 days'}</p>
        <h2 id="garden-h" className="h-duo mt-0.5 text-[26px]">Your mood <em>garden</em></h2>
      </div>

      <div className="relative mt-3 flex items-center gap-4">
        <Bloom mix={mix} total={journal.length} />
        <ul className="min-w-0 flex-1 space-y-1.5" aria-label="How often you felt each way">
          {mix.slice(0, 5).map((m) => (
            <li key={m.mood} className="flex items-center gap-2 rounded-full bg-white/70 py-1 pl-1 pr-3 text-[13px]">
              <MoodImg mood={m.mood} size={24} />
              <span className="min-w-0 flex-1 truncate font-semibold text-ink">{moodOf(m.mood).label}</span>
              <b className="tnum text-navy">{m.pct}%</b>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mt-4 rounded-[22px] bg-white/65 px-3 pb-2.5 pt-3">
        <p className="px-1 text-[12px] font-bold uppercase tracking-[0.1em] text-muted">Last 14 days</p>
        <div className="mt-2 grid grid-cols-7 gap-y-2" role="img" aria-label={`Last 14 days: ${days.filter((d) => d.mood).length} days with a check-in`}>
          {days.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <MiniFlower color={d.mood ? moodOf(d.mood).color : undefined} delay={i * 0.04} />
              <span className="text-[10px] font-semibold text-muted">{d.date.toLocaleDateString('en-IN', { weekday: 'narrow' })}</span>
            </div>
          ))}
        </div>
      </div>

      {lines.length > 0 && (
        <ul className="relative mt-3 space-y-2">
          {lines.map((l, i) => (
            <motion.li key={i} className="flex items-center gap-3 rounded-[18px] bg-white/55 p-2.5 pr-3" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}>
              <MoodImg mood={l.mood} size={34} /><p className="text-[14px] leading-5 text-ink">{l.text}</p>
            </motion.li>
          ))}
        </ul>
      )}
      <p className="relative mt-3 flex items-start gap-2 text-[13px] leading-5 text-ink-2"><Lightbulb className="mt-0.5 size-4 shrink-0 text-gold" />{dailyInsight(journal)}</p>
      <p className="relative mt-2 text-[11px] text-muted">From your check-ins · not medical advice</p>
    </section>
  )
}

/** The graph: one petal per feeling, length by how often it was felt; it opens like a flower and turns very slowly. */
function Bloom({ mix, total }: { mix: { mood: Emotion; pct: number }[]; total: number }) {
  const still = useReducedMotion()
  const max = Math.max(1, ...mix.map((m) => m.pct))
  const n = Math.max(mix.length, 3)
  const w = n <= 4 ? 30 : n <= 5 ? 26 : 22
  return (
    <motion.svg viewBox="-100 -100 200 200" className="size-[150px] shrink-0 drop-shadow-[0_8px_16px_rgba(120,80,140,.18)]" role="img"
      aria-label={`Mood bloom: ${mix.map((m) => `${moodOf(m.mood).label} ${m.pct}%`).join(', ')}`}
      animate={still ? undefined : { rotate: 360 }} transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}>
      {mix.map((m, i) => {
        const L = 42 + 52 * (m.pct / max), c = moodOf(m.mood).color
        return (
          <g key={m.mood} transform={`rotate(${(360 / n) * i})`}>
            <motion.path fill={c} stroke={shade(c)} strokeWidth={1.5} initial={{ d: petal(4, 3) }} animate={{ d: petal(L, w) }}
              transition={still ? { duration: 0 } : { delay: 0.15 + i * 0.09, type: 'spring', stiffness: 90, damping: 13 }} />
            <path d={`M0 -10L0 ${-L * 0.72}`} stroke="#fff" strokeOpacity={0.55} strokeWidth={1.4} strokeLinecap="round" />
          </g>
        )
      })}
      <circle r={22} fill="#fff" />
      <circle r={22} fill="none" stroke="#F2C14E" strokeWidth={3} strokeDasharray="2 4" />
      <text y={6} textAnchor="middle" className="fill-navy font-display text-[19px] font-bold">{total}</text>
    </motion.svg>
  )
}

function MiniFlower({ color, delay }: { color?: string; delay: number }) {
  if (!color) return <svg viewBox="-12 -12 24 24" className="size-6" aria-hidden><circle r={3} fill="#d6d9e6" /></svg>
  return (
    <motion.svg viewBox="-12 -12 24 24" className="size-6" aria-hidden initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 14 }}>
      {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={0} cy={-6} rx={4.2} ry={6} fill={color} stroke={shade(color)} strokeWidth={0.6} transform={`rotate(${a})`} />)}
      <circle r={3} fill="#F7C548" />
    </motion.svg>
  )
}

/** Before 10 check-ins: a flower with 10 petals, one coloured in for each check-in. */
function Seedling({ n, colors, onLog }: { n: number; colors: string[]; onLog: () => void }) {
  const still = useReducedMotion()
  const left = GARDEN_MIN - n
  return (
    <section className="relative overflow-hidden rounded-[30px] p-5 shadow-[var(--shadow-card)]" style={{ background: WASH }} aria-labelledby="garden-h">
      <Deco />
      <div className="relative flex items-center gap-4">
        <svg viewBox="-100 -100 200 200" className="size-[124px] shrink-0" role="img" aria-label={`${n} of ${GARDEN_MIN} check-ins`}>
          {Array.from({ length: GARDEN_MIN }, (_, i) => {
            const on = i < n, c = colors[i] ?? '#ffffff'
            return (
              <g key={i} transform={`rotate(${i * 36})`}>
                <motion.path d={petal(84, 20)} fill={on ? c : 'rgba(255,255,255,.75)'} stroke={on ? shade(c) : '#c9c3e6'} strokeWidth={on ? 1.4 : 1.6} strokeDasharray={on ? undefined : '4 4'}
                  initial={on && !still ? { scale: 0.6, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} style={{ originX: '50%', originY: '100%' }} transition={{ delay: i * 0.06 }} />
              </g>
            )
          })}
          <circle r={26} fill="#fff" />
          <text y={7} textAnchor="middle" className="fill-navy font-display text-[22px] font-bold">{n}/{GARDEN_MIN}</text>
        </svg>
        <div className="min-w-0 flex-1">
          <h2 id="garden-h" className="h-duo text-[24px]">Your mood <em>garden</em></h2>
          <p className="mt-1 text-[14px] leading-5 text-ink-2">Log how you feel {GARDEN_MIN} times and your mood graph blooms here.</p>
          <p className="mt-1.5 text-[13px] font-bold text-[#8a4b6b]">{left} more check-in{left === 1 ? '' : 's'} to go</p>
        </div>
      </div>
      <button onClick={() => { buzz(8); onLog() }} className="relative mt-4 flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-navy text-[15px] font-semibold text-white shadow-[var(--shadow-cta)] active:scale-[0.98]">
        <Plus className="size-4" strokeWidth={3} /> Log how you feel
      </button>
    </section>
  )
}

/** soft flowers in the corners of the card */
function Deco() {
  const F = (x: number, y: number, s: number, c: string, o: number) => (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={0} cy={-11} rx={8} ry={12} fill={c} transform={`rotate(${a})`} />)}
      <circle r={6} fill="#F7C548" />
    </g>
  )
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="xMaxYMin slice" viewBox="0 0 360 400" aria-hidden>
      {F(330, 26, 1.5, '#F5A3B8', 0.35)}
      {F(296, 70, 0.8, '#B9A7F2', 0.35)}
      {F(18, 380, 1.3, '#9ED3C2', 0.3)}
      {F(345, 360, 0.9, '#F7C98B', 0.35)}
    </svg>
  )
}
