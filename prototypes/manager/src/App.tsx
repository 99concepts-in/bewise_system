/**
 * @module   ops-prototype
 * @owner    MANAGER
 * Purpose:  Manager app shell + in-memory router (artifact-safe: only plain #name hashes for top-level views).
 */
import { MotionConfig } from 'motion/react'
import { useStore } from './lib/store'
import { BottomNav, SideNav, QuickActions } from './shell/Shell'
import { Bloom, Toasts } from './ui/kit'
import { Today, Notifications } from './screens/Today'
import { Orders, Shipments } from './screens/Orders'
import { OrderDetail } from './screens/OrderDetail'
import { Money, InvoiceDetail } from './screens/Money'
import { Appointments, Clients, ClientDetail } from './screens/Desk'
import { Products, ProductRoute } from './screens/Products'
import { Stock, StockItemScreen } from './screens/Stock'
import { Production, BatchDetail, Purchases, ReceivePO } from './screens/Make'
import { Me, Reports } from './screens/Me'
import type { Route } from './lib/types'

function View({ r }: { r: Route }) {
  const id = r.id ?? ''
  switch (r.name) {
    case 'today': return <Today />
    case 'orders': return <Orders />
    case 'order': return <OrderDetail id={id} />
    case 'shipments': return <Shipments />
    case 'money': return <Money />
    case 'invoice': return <InvoiceDetail id={id} />
    case 'appointments': return <Appointments />
    case 'clients': return <Clients />
    case 'client': return <ClientDetail id={id} />
    case 'products': return <Products />
    case 'product': return <ProductRoute id={id} intent={r.intent} />
    case 'stock': return <Stock />
    case 'stockItem': return <StockItemScreen id={id} />
    case 'production': return <Production />
    case 'batch': return <BatchDetail id={id} />
    case 'purchases': return <Purchases />
    case 'po': return <ReceivePO id={id} />
    case 'reports': return <Reports />
    case 'notifications': return <Notifications />
    case 'me': return <Me />
  }
}

export default function App() {
  const top = useStore((s) => s.stack[s.stack.length - 1])
  const root = useStore((s) => s.root)
  const r: Route = top ?? { name: root }
  const depth = useStore((s) => s.stack.length)
  return (
    <MotionConfig reducedMotion="user">
      <div className="ground min-h-full">
        <SideNav />
        <main className="gutter lg:pl-[calc(244px+40px)] lg:pr-10">
          <View key={`${r.name}:${r.id ?? ''}:${depth}`} r={r} />
        </main>
        <BottomNav />
        <QuickActions />
        <Toasts />
        <Bloom />
      </div>
    </MotionConfig>
  )
}
