/**
 * @module client-shell @owner CLIENT
 * Purpose: instant skeleton (pure CSS, no JS animation) shown before the client store / route code is ready.
 */
const Bar = ({ w, h = 14, r = 999, className = '' }: { w: string; h?: number; r?: number; className?: string }) => (
  <span className={`bw-shimmer block ${className}`} style={{ width: w, height: h, borderRadius: r }} />
)
export function AppSkeleton() {
  return (
    <div className="px-5 pt-3" role="status" aria-busy="true" aria-label="Loading">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5"><Bar w="40px" h={40} /><div className="space-y-1.5"><Bar w="74px" h={14} /><Bar w="96px" h={9} /></div></div>
        <div className="flex gap-2.5"><Bar w="44px" h={44} /><Bar w="44px" h={44} /></div>
      </div>
      <div className="mt-7 space-y-2.5"><Bar w="46%" h={30} r={10} /><Bar w="78%" h={22} r={8} /></div>
      {[132, 210, 150].map((h, i) => (
        <div key={i} className="mt-4 rounded-[24px] bg-white/80 p-5 shadow-[var(--shadow-card)]" style={{ height: h }}>
          <Bar w="42%" h={18} r={8} /><div className="mt-3"><Bar w="68%" h={12} r={6} /></div>
        </div>
      ))}
    </div>
  )
}
