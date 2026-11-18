/**
 * @module   ops-prototype/shell
 * @owner    MANAGER
 * @screens  MG-27b (quick actions), navigation
 */
import { motion } from 'motion/react'
import {
  Home, Package, Plus, Wallet, UserRound, Truck, CalendarDays, Users, Sparkles, Boxes, FlaskConical, ShoppingCart, BarChart3,
  Receipt, IndianRupee, UserPlus, Bell, Link2, Zap,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useStore } from '../lib/store'
import type { RouteName } from '../lib/types'
import { Sheet, cx, spring } from '../ui/kit'

const TABS: { name: RouteName; label: string; icon: ReactNode }[] = [
  { name: 'today', label: 'Today', icon: <Home size={22} /> },
  { name: 'orders', label: 'Orders', icon: <Package size={22} /> },
  { name: 'money', label: 'Money', icon: <Wallet size={22} /> },
  { name: 'me', label: 'Me', icon: <UserRound size={22} /> },
]

export function BottomNav() {
  const root = useStore((s) => s.root)
  const setRoot = useStore((s) => s.setRoot)
  const setQuick = useStore((s) => s.setQuick)
  const quickOpen = useStore((s) => s.quickOpen)
  const meRoots: RouteName[] = ['me', 'shipments', 'appointments', 'clients', 'products', 'stock', 'production', 'purchases', 'reports', 'notifications']
  const active = meRoots.includes(root) ? 'me' : root
  const tab = (t: (typeof TABS)[number]) => (
    <button key={t.name} onClick={() => setRoot(t.name)} aria-label={t.label} aria-current={active === t.name ? 'page' : undefined}
      className="relative grid size-12 place-items-center rounded-full">
      {active === t.name && <motion.span layoutId="nav-dot" transition={spring} className="absolute inset-0 rounded-full bg-nav-active" />}
      <span className={cx('relative transition-colors', active === t.name ? 'text-nav-active-fg' : 'text-nav-fg')}>{t.icon}</span>
    </button>
  )
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(14px,env(safe-area-inset-bottom,0px))] lg:hidden" aria-label="Main">
      <div className="flex h-16 items-center gap-1.5 rounded-full bg-nav px-2 shadow-lift">
        {tab(TABS[0])}{tab(TABS[1])}
        <motion.button
          onClick={() => setQuick(!quickOpen)} aria-label="Quick actions" whileTap={{ scale: 0.9 }} animate={{ rotate: quickOpen ? 45 : 0 }} transition={spring}
          className="cta mx-1 grid size-12 place-items-center rounded-full ring-2 ring-white/25"
        >
          <Plus size={24} strokeWidth={2.5} />
        </motion.button>
        {tab(TABS[2])}{tab(TABS[3])}
      </div>
    </nav>
  )
}

const SIDE: { name: RouteName; label: string; icon: ReactNode }[] = [
  { name: 'today', label: 'Today', icon: <Home size={19} /> },
  { name: 'orders', label: 'Orders', icon: <Package size={19} /> },
  { name: 'shipments', label: 'Shipments', icon: <Truck size={19} /> },
  { name: 'money', label: 'Money', icon: <Wallet size={19} /> },
  { name: 'appointments', label: 'Appointments', icon: <CalendarDays size={19} /> },
  { name: 'clients', label: 'Clients', icon: <Users size={19} /> },
  { name: 'products', label: 'Products', icon: <Sparkles size={19} /> },
  { name: 'stock', label: 'Stock', icon: <Boxes size={19} /> },
  { name: 'production', label: 'Production', icon: <FlaskConical size={19} /> },
  { name: 'purchases', label: 'Purchases', icon: <ShoppingCart size={19} /> },
  { name: 'reports', label: 'Reports', icon: <BarChart3 size={19} /> },
]

export function SideNav() {
  const root = useStore((s) => s.root)
  const setRoot = useStore((s) => s.setRoot)
  const setQuick = useStore((s) => s.setQuick)
  const unread = useStore((s) => s.notes.filter((n) => !n.read).length)
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[244px] flex-col bg-nav px-3 pt-6 pb-5 lg:flex" aria-label="Main">
      <div className="mb-6 flex items-center gap-3 px-3">
        <OwlMark />
        <div className="leading-tight">
          <div className="text-[17px] font-bold text-nav-active">BeWise</div>
          <div className="text-[12px] font-medium text-nav-fg">Holistic Wellness · Office</div>
        </div>
      </div>
      <button onClick={() => setQuick(true)} className="cta mb-4 flex h-11 items-center justify-center gap-2 rounded-full text-[14px] font-bold ring-1 ring-white/20">
        <Plus size={18} strokeWidth={2.5} /> New
      </button>
      <nav className="no-scrollbar flex-1 space-y-0.5 overflow-y-auto">
        {SIDE.map((t) => (
          <button key={t.name} onClick={() => setRoot(t.name)} aria-current={root === t.name ? 'page' : undefined}
            className={cx('relative flex h-11 w-full items-center gap-3 rounded-full px-4 text-[14.5px] font-semibold transition-colors', root === t.name ? 'text-nav-active-fg' : 'text-nav-fg hover:text-nav-active')}>
            {root === t.name && <motion.span layoutId="side-pill" transition={spring} className="absolute inset-0 rounded-full bg-nav-active" />}
            <span className="relative">{t.icon}</span><span className="relative">{t.label}</span>
          </button>
        ))}
      </nav>
      <button onClick={() => setRoot('notifications')} className="mt-3 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left hover:bg-white/5">
        <span className="grid size-9 place-items-center rounded-full bg-white/10 text-[13px] font-bold text-nav-active">HM</span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[14px] font-semibold text-nav-active">Haresh Moorjani</span>
          <span className="block text-[12px] text-nav-fg">Office manager</span>
        </span>
        <span className="relative text-nav-fg"><Bell size={18} />{unread > 0 && <span className="absolute -top-1 -right-1 size-2 rounded-full bg-bad" />}</span>
      </button>
    </aside>
  )
}

export function OwlMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="19" fill="none" stroke="var(--nav-active)" strokeOpacity=".5" strokeWidth="1.2" />
      <path d="M12 15c2-4 14-4 16 0 2 4 1 13-8 16-9-3-10-12-8-16z" fill="none" stroke="var(--nav-active)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M15 17c1.2-1 2.8-1 4 0M21 17c1.2-1 2.8-1 4 0" stroke="var(--nav-active)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M19 20l1 1.6 1-1.6" stroke="var(--gold)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M17 25c2 1.4 4 1.4 6 0" stroke="var(--sage)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function QuickActions() {
  const open = useStore((s) => s.quickOpen)
  const setQuick = useStore((s) => s.setQuick)
  const setRoot = useStore((s) => s.setRoot)
  const items: { label: string; sub: string; icon: ReactNode; run: () => void }[] = [
    { label: 'Share booking link', sub: 'Send on WhatsApp or copy', icon: <Link2 size={20} />, run: () => setRoot('today', 'share') },
    { label: 'Express booking', sub: 'Next free time, greet and confirm', icon: <Zap size={20} />, run: () => setRoot('today', 'express') },
    { label: 'Add client', sub: 'Name, mobile, city', icon: <UserPlus size={20} />, run: () => setRoot('clients', 'add') },
    { label: 'Record payment', sub: 'Paid at the desk or by bank', icon: <IndianRupee size={20} />, run: () => setRoot('money', 'collect') },
    { label: 'Add expense', sub: 'Photo of the receipt for approval', icon: <Receipt size={20} />, run: () => setRoot('money', 'expense') },
    { label: 'New batch', sub: 'Make oils, sprays or salts', icon: <FlaskConical size={20} />, run: () => setRoot('production', 'new') },
  ]
  return (
    <Sheet open={open} onClose={() => setQuick(false)} title="Quick actions">
      <div className="grid grid-cols-2 gap-3 pb-2">
        {items.map((it, i) => (
          <motion.button
            key={it.label} onClick={it.run}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.03 * i }} whileTap={{ scale: 0.96 }}
            className="flex flex-col items-start gap-3 rounded-[24px] bg-surface p-4 text-left shadow-soft"
          >
            <span className="grid size-11 place-items-center rounded-full bg-accent-soft text-accent">{it.icon}</span>
            <span>
              <span className="block text-[15px] font-bold text-ink">{it.label}</span>
              <span className="block text-[12.5px] leading-snug text-ink-2">{it.sub}</span>
            </span>
          </motion.button>
        ))}
      </div>
    </Sheet>
  )
}
