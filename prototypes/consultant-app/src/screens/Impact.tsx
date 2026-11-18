/**
 * "Your impact" — motivation from real outcomes: next milestone, people reached, and what they said they felt.
 * ImpactCard sits at the top of Today; ImpactPanel opens Growth.
 */
import { useMemo } from 'react'
import { m } from 'motion/react'
import { Award, ChevronRight, HeartHandshake } from 'lucide-react'
import { useStore } from '../state/store'
import { CountUp, go, softSpring } from '../ui/kit'
import { impact, LIFETIME_REACH } from '../lib/derive'

const SUFFIX: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' }
const ord = (n: number) => n.toLocaleString('en-IN') + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : SUFFIX[n % 10] ?? 'th')

function useImpact() {
  const { s, now } = useStore()
  return useMemo(() => impact(s.appts, s.people, now), [s.appts, s.people, now])
}

function Milestone({ left, target, pct, what, delay = 0.25 }: { left: number; target: number; pct: number; what: string; delay?: number }) {
  return (
    <div className="ms">
      <p className="ms-title"><Award size={18} /><span><b>{left} {what === 'sessions' ? (left === 1 ? 'session' : 'sessions') : (left === 1 ? 'person' : 'people')}</b> to your {ord(target)} {what === 'sessions' ? 'session' : 'person helped'} on BeWise</span></p>
      <div className="bar-track"><m.div className="bar-fill" initial={{ width: 0 }} animate={{ width: `${Math.max(4, pct * 100)}%` }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay }} /></div>
    </div>
  )
}

export function ImpactCard() {
  const i = useImpact()
  const top = i.benefits.slice(0, 4)
  return (
    <m.section className="impact card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: 0.15 }} aria-label="Your impact">
      <Milestone what="sessions" {...i.sessionMilestone} />
      <div className="imp-stats">
        <p><b><CountUp to={i.helped} /></b><span>people helped on BeWise</span></p>
        <p><b>{(LIFETIME_REACH / 100000).toFixed(0)} lakh+</b><span>reached in 12 years</span></p>
        <p><b><CountUp to={Math.round(i.betterPct * 100)} />%</b><span>said something feels better</span></p>
      </div>
      {top.length > 0 && (
        <div className="imp-felt">
          <span className="imp-felt-label">They told you they felt</span>
          <div className="felt-chips" tabIndex={0} role="list" aria-label="What people said they felt">
            {top.map(([b, n], k) => (
              <m.span key={b} role="listitem" className="felt-chip" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...softSpring, delay: 0.45 + k * 0.07 }}>{b}<em>{n}</em></m.span>
            ))}
          </div>
        </div>
      )}
      <button className="imp-more" onClick={() => go('/growth')}>See your full impact <ChevronRight size={16} /></button>
    </m.section>
  )
}

export function ImpactPanel() {
  const i = useImpact()
  const max = i.benefits[0]?.[1] ?? 1
  return (
    <section className="impact-panel" aria-label="Your impact">
      <div className="card impact">
        <Milestone what="sessions" {...i.sessionMilestone} />
        <Milestone what="people" {...i.peopleMilestone} delay={0.4} />
      </div>
      <div className="g-stats imp-grid">
        <div className="stat"><b><CountUp to={i.helped} /></b><span>people helped on BeWise</span></div>
        <div className="stat"><b>2,00,000+</b><span>lives reached through workshops and sessions</span></div>
        <div className="stat"><b><CountUp to={i.hours} /></b><span>hours of listening</span></div>
        <div className="stat"><b><CountUp to={i.fiveStar} /></b><span>five-star sessions</span></div>
        <div className="stat"><b><CountUp to={Math.round(i.cameBackPct * 100)} />%</b><span>came back for a follow-up</span></div>
        <div className="stat"><b><CountUp to={i.cities} /></b><span>cities and countries</span></div>
      </div>
      <section className="card chart-card">
        <h2><HeartHandshake size={18} /> What people said they felt</h2>
        <p className="muted small">From feedback after sessions. {i.betterPeople} people said something feels better, {Math.round(i.betterPct * 100)}% of those who answered.</p>
        <ul className="hbars">
          {i.benefits.slice(0, 8).map(([name, v], k) => (
            <li key={name}>
              <span className="hb-name">{name}</span>
              <span className="hb-track"><m.span className="hb-fill felt" initial={{ scaleX: 0 }} animate={{ scaleX: v / max }} transition={{ ...softSpring, delay: 0.1 + k * 0.05 }} /></span>
              <span className="hb-v">{v}</span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}
