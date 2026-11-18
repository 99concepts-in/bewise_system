/**
 * @module   journal
 * @owner    CLIENT
 * @screens  every mood picker / journal / intake / feedback face
 * Purpose:  Round mood faces in flat, simple colours (owner 2026-11-18: keep the coloured faces, no shine or reflections).
 *           Pastel body per feeling, navy features, each feeling its own expression.
 */

export type Eyes = 'open' | 'wide' | 'happy' | 'closed' | 'sleepy' | 'squint' | 'heart' | 'down' | 'side' | 'tight' | 'star' | 'up'
export type Mouth = 'smile' | 'small' | 'grin' | 'flat' | 'frown' | 'smallfrown' | 'o' | 'wavy' | 'teeth' | 'smirk'
export type Brows = 'none' | 'worried' | 'angry' | 'sad' | 'raised' | 'determined'
export type Extra = 'blush' | 'tear' | 'sweat' | 'sparkle' | 'heart' | 'zzz' | 'question' | 'tears'
export type FaceSpec = { eyes: Eyes; mouth: Mouth; brows?: Brows; extras?: Extra[] }

const INK = '#182957'

function Eye({ kind, x, side }: { kind: Eyes; x: number; side: -1 | 1 }) {
  const y = 45
  const s = { stroke: INK, strokeWidth: 4.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }
  const pupil = (rx: number, ry: number, dx = 0, dy = 0) => (
    <ellipse cx={x + dx} cy={y + dy} rx={rx} ry={ry} fill={INK} />
  )
  switch (kind) {
    case 'open': return pupil(4.8, 6.4)
    case 'wide': return <g><ellipse cx={x} cy={y} rx={7.2} ry={8.4} fill="#fff" stroke={INK} strokeWidth={2.4} />{pupil(3.6, 4.4, 0, 0.6)}</g>
    case 'up': return pupil(4.6, 6, 0.6, -2)
    case 'down': return pupil(4.4, 5.2, 0, 2.6)
    case 'side': return pupil(4.4, 5.6, 2.8 * side * -1 + 3, 0.5)
    case 'happy': return <path d={`M${x - 6.5} ${y + 2} Q${x} ${y - 7} ${x + 6.5} ${y + 2}`} {...s} />
    case 'closed': return <path d={`M${x - 6.5} ${y - 1} Q${x} ${y + 6} ${x + 6.5} ${y - 1}`} {...s} />
    case 'sleepy': return <g><path d={`M${x - 6.5} ${y} H${x + 6.5}`} {...s} /><path d={`M${x - 5} ${y + 1} A5 5 0 0 0 ${x + 5} ${y + 1} Z`} fill={INK} /></g>
    case 'squint': return <path d={side < 0 ? `M${x - 6} ${y - 2} L${x + 6} ${y + 1}` : `M${x - 6} ${y + 1} L${x + 6} ${y - 2}`} {...s} />
    case 'tight': return <path d={side < 0 ? `M${x - 5} ${y - 5} L${x + 4} ${y} L${x - 5} ${y + 5}` : `M${x + 5} ${y - 5} L${x - 4} ${y} L${x + 5} ${y + 5}`} {...s} />
    case 'heart': return <path d={`M${x} ${y + 6} C${x - 9} ${y} ${x - 6} ${y - 8} ${x} ${y - 3} C${x + 6} ${y - 8} ${x + 9} ${y} ${x} ${y + 6} Z`} fill="#d9546f" />
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
        <path d="M41 70 Q50 64 59 70 Q55 76 50 76 Q45 76 41 70 Z" fill="#e8798c" /></g>
    )
    case 'teeth': return (
      <g><rect x="35" y="60" width="30" height="12" rx="6" fill="#fff" stroke={INK} strokeWidth={3.2} />
        <path d="M35.5 66 H64.5 M42.5 60.5 V71.5 M50 60.5 V71.5 M57.5 60.5 V71.5" stroke={INK} strokeWidth={1.6} /></g>
    )
  }
}

function Extras({ list }: { list: Extra[] }) {
  return (
    <>
      {list.includes('blush') && <g fill="#f08fa0" opacity=".5"><ellipse cx="27" cy="58" rx="6.5" ry="3.8" /><ellipse cx="73" cy="58" rx="6.5" ry="3.8" /></g>}
      {list.includes('tear') && <path d="M69 52 C66 57 66 60 69 61 C72 60 72 57 69 52 Z" fill="#7fb4e6" stroke="#5c93c8" strokeWidth=".8" />}
      {list.includes('tears') && <g fill="#7fb4e6" stroke="#5c93c8" strokeWidth=".8"><path d="M31 52 C28 57 28 60 31 61 C34 60 34 57 31 52 Z" /><path d="M69 52 C66 57 66 60 69 61 C72 60 72 57 69 52 Z" /></g>}
      {list.includes('sweat') && <path d="M80 22 C76 28 76 32 80 33 C84 32 84 28 80 22 Z" fill="#9ccbf0" stroke="#5c93c8" strokeWidth=".9" />}
      {list.includes('sparkle') && <path d="M81 14 L83 20 L89 22 L83 24 L81 30 L79 24 L73 22 L79 20 Z" fill="#d3a64a" />}
      {list.includes('heart') && <path d="M82 28 C74 22 77 14 82 18 C87 14 90 22 82 28 Z" fill="#d9546f" />}
      {list.includes('zzz') && <text x="74" y="24" fontSize="13" fontWeight="800" fill={INK} fontFamily="inherit">z<tspan fontSize="9" dy="-5">z</tspan></text>}
      {list.includes('question') && <text x="77" y="27" fontSize="17" fontWeight="800" fill={INK} fontFamily="inherit">?</text>}
    </>
  )
}

/** Round mood face: one flat pastel colour, navy features. No gradients, highlights or shadows. */
export function MoodFace({ color, face, size = 56, className, title }: { color?: string; face: FaceSpec; size?: number; className?: string; title?: string; ink?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <circle cx="50" cy="50" r="44" fill={color ?? '#B5D3B8'} />
      {face.extras && <Extras list={face.extras.filter((e) => e === 'blush')} />}
      <Brow kind={face.brows ?? 'none'} x={36} side={-1} /><Brow kind={face.brows ?? 'none'} x={64} side={1} />
      <Eye kind={face.eyes} x={36} side={-1} /><Eye kind={face.eyes} x={64} side={1} />
      <MouthShape kind={face.mouth} />
      {face.extras && <Extras list={face.extras.filter((e) => e !== 'blush')} />}
    </svg>
  )
}
