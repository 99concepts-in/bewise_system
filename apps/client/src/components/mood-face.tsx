/**
 * @module   journal
 * @owner    CLIENT
 * @screens  every mood picker / journal / intake / feedback face
 * Purpose:  Flat 2D line faces in ONE colour (owner 2026-11-18: "create 2d files, in one color only").
 *           Everything is drawn in `ink` (navy by default, white on dark tiles); each feeling keeps its own expression.
 */

export type Eyes = 'open' | 'wide' | 'happy' | 'closed' | 'sleepy' | 'squint' | 'heart' | 'down' | 'side' | 'tight' | 'star' | 'up'
export type Mouth = 'smile' | 'small' | 'grin' | 'flat' | 'frown' | 'smallfrown' | 'o' | 'wavy' | 'teeth' | 'smirk'
export type Brows = 'none' | 'worried' | 'angry' | 'sad' | 'raised' | 'determined'
export type Extra = 'blush' | 'tear' | 'sweat' | 'sparkle' | 'heart' | 'zzz' | 'question' | 'tears'
export type FaceSpec = { eyes: Eyes; mouth: Mouth; brows?: Brows; extras?: Extra[] }

const INK = 'currentColor'

function Eye({ kind, x, side }: { kind: Eyes; x: number; side: -1 | 1 }) {
  const y = 45
  const s = { stroke: INK, strokeWidth: 4.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }
  const pupil = (rx: number, ry: number, dx = 0, dy = 0) => (
    <ellipse cx={x + dx} cy={y + dy} rx={rx} ry={ry} fill={INK} />
  )
  switch (kind) {
    case 'open': return pupil(4.8, 6.4)
    case 'wide': return <g><ellipse cx={x} cy={y} rx={7.2} ry={8.4} fill="none" stroke={INK} strokeWidth={3} />{pupil(3.2, 4, 0, 0.6)}</g>
    case 'up': return pupil(4.6, 6, 0.6, -2)
    case 'down': return pupil(4.4, 5.2, 0, 2.6)
    case 'side': return pupil(4.4, 5.6, 2.8 * side * -1 + 3, 0.5)
    case 'happy': return <path d={`M${x - 6.5} ${y + 2} Q${x} ${y - 7} ${x + 6.5} ${y + 2}`} {...s} />
    case 'closed': return <path d={`M${x - 6.5} ${y - 1} Q${x} ${y + 6} ${x + 6.5} ${y - 1}`} {...s} />
    case 'sleepy': return <g><path d={`M${x - 6.5} ${y} H${x + 6.5}`} {...s} /><path d={`M${x - 5} ${y + 1} A5 5 0 0 0 ${x + 5} ${y + 1} Z`} fill={INK} /></g>
    case 'squint': return <path d={side < 0 ? `M${x - 6} ${y - 2} L${x + 6} ${y + 1}` : `M${x - 6} ${y + 1} L${x + 6} ${y - 2}`} {...s} />
    case 'tight': return <path d={side < 0 ? `M${x - 5} ${y - 5} L${x + 4} ${y} L${x - 5} ${y + 5}` : `M${x + 5} ${y - 5} L${x - 4} ${y} L${x + 5} ${y + 5}`} {...s} />
    case 'heart': return <path d={`M${x} ${y + 6} C${x - 9} ${y} ${x - 6} ${y - 8} ${x} ${y - 3} C${x + 6} ${y - 8} ${x + 9} ${y} ${x} ${y + 6} Z`} fill={INK} />
    case 'star': return <path d={`M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2} Z`} fill={INK} />
  }
}

function Brow({ kind, x, side }: { kind: Brows; x: number; side: -1 | 1 }) {
  if (kind === 'none') return null
  const s = { stroke: INK, strokeWidth: 3.6, strokeLinecap: 'round' as const, fill: 'none' }
  const inner = x + 6 * -side, outer = x - 6 * -side // inner = towards the nose
  const y = 32
  if (kind === 'worried') return <path d={`M${outer} ${y + 3} L${inner} ${y - 3}`} {...s} />
  if (kind === 'sad') return <path d={`M${outer} ${y + 2} Q${x} ${y - 2} ${inner} ${y - 3}`} {...s} />
  if (kind === 'angry') return <path d={`M${outer} ${y - 3} L${inner} ${y + 3}`} {...s} />
  if (kind === 'determined') return <path d={`M${outer} ${y - 1} L${inner} ${y + 2}`} {...s} />
  if (kind === 'raised') return side > 0 ? <path d={`M${x - 6} ${y - 1} Q${x} ${y - 7} ${x + 6} ${y - 2}`} {...s} /> : <path d={`M${x - 6} ${y} H${x + 6}`} {...s} />
  return null
}

function MouthShape({ kind }: { kind: Mouth }) {
  const s = { stroke: INK, strokeWidth: 4.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }
  switch (kind) {
    case 'smile': return <path d="M37 62 Q50 75 63 62" {...s} />
    case 'small': return <path d="M43 65 Q50 71 57 65" {...s} />
    case 'smirk': return <path d="M41 66 Q53 72 61 61" {...s} />
    case 'flat': return <path d="M41 67 H59" {...s} />
    case 'frown': return <path d="M38 71 Q50 60 62 71" {...s} />
    case 'smallfrown': return <path d="M43 69 Q50 64 57 69" {...s} />
    case 'wavy': return <path d="M37 67 Q41.5 62 46 67 T55 67 T64 66" {...s} />
    case 'o': return <ellipse cx="50" cy="67" rx="5.2" ry="6.4" fill={INK} />
    case 'grin': return (
      <g><path d="M33 59 Q50 83 67 59 Z" fill={INK} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      </g>
    )
    case 'teeth': return (
      <g><rect x="35" y="60" width="30" height="12" rx="6" fill="none" stroke={INK} strokeWidth={3.6} />
        <path d="M35.5 66 H64.5 M42.5 60.5 V71.5 M50 60.5 V71.5 M57.5 60.5 V71.5" stroke={INK} strokeWidth={1.6} /></g>
    )
  }
}

function Extras({ list }: { list: Extra[] }) {
  const o = { fill: 'none', stroke: INK, strokeWidth: 2.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <>
      {list.includes('blush') && <g {...o} strokeWidth={2.2}><path d="M22 60 l3 -4 M27 61 l3 -4" /><path d="M70 60 l3 -4 M75 61 l3 -4" /></g>}
      {list.includes('tear') && <path d="M69 53 C66 58 66 61 69 62 C72 61 72 58 69 53 Z" {...o} />}
      {list.includes('tears') && <g {...o}><path d="M31 53 C28 58 28 61 31 62 C34 61 34 58 31 53 Z" /><path d="M69 53 C66 58 66 61 69 62 C72 61 72 58 69 53 Z" /></g>}
      {list.includes('sweat') && <path d="M82 20 C78 26 78 30 82 31 C86 30 86 26 82 20 Z" {...o} />}
      {list.includes('sparkle') && <path d="M84 10 L86 16 L92 18 L86 20 L84 26 L82 20 L76 18 L82 16 Z" fill={INK} />}
      {list.includes('heart') && <path d="M84 26 C76 20 79 12 84 16 C89 12 92 20 84 26 Z" fill={INK} />}
      {list.includes('zzz') && <text x="78" y="20" fontSize="13" fontWeight="800" fill={INK} fontFamily="inherit">z<tspan fontSize="9" dy="-5">z</tspan></text>}
      {list.includes('question') && <text x="80" y="22" fontSize="17" fontWeight="800" fill={INK} fontFamily="inherit">?</text>}
    </>
  )
}

/** Flat 2D mood face: one colour line art (navy by default; pass ink="#fff" on dark backgrounds). */
export function MoodFace({ face, size = 56, className, title, ink = '#182957' }: { color?: string; face: FaceSpec; size?: number; className?: string; title?: string; ink?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} style={{ color: ink }} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <circle cx="50" cy="50" r="42" fill="none" stroke={INK} strokeWidth="4.2" />
      <Brow kind={face.brows ?? 'none'} x={36} side={-1} /><Brow kind={face.brows ?? 'none'} x={64} side={1} />
      <Eye kind={face.eyes} x={36} side={-1} /><Eye kind={face.eyes} x={64} side={1} />
      <MouthShape kind={face.mouth} />
      {face.extras && <Extras list={face.extras.filter((e) => e !== 'blush')} />}
    </svg>
  )
}
