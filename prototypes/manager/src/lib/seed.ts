/**
 * Demo data — clearly sample content (names, prices, stock) until real data arrives (product list 2026-11-18).
 */
import type {
  Appointment, Batch, Bill, Client, Expense, Invoice, Note, Order, Product, PurchaseOrder, StockItem, Supplier,
} from './types'
import { dateKey } from './format'

const H = 3600e3
const now = () => Date.now()

export const BACH = [
  'Agrimony', 'Aspen', 'Beech', 'Centaury', 'Cerato', 'Cherry Plum', 'Chestnut Bud', 'Chicory', 'Clematis',
  'Crab Apple', 'Elm', 'Gentian', 'Gorse', 'Heather', 'Holly', 'Honeysuckle', 'Hornbeam', 'Impatiens', 'Larch',
  'Mimulus', 'Mustard', 'Oak', 'Olive', 'Pine', 'Red Chestnut', 'Rock Rose', 'Rock Water', 'Scleranthus',
  'Star of Bethlehem', 'Sweet Chestnut', 'Vervain', 'Vine', 'Walnut', 'Water Violet', 'White Chestnut',
  'Wild Oat', 'Wild Rose', 'Willow', 'Rescue Remedy',
]
export const bachId = (name: string) => 'bach-' + name.toLowerCase().replace(/\s+/g, '-')

export function seed() {
  const t = now()
  const clients: Client[] = [
    { id: 'c1', code: 'BW-C-00012', name: 'Priya Shah', city: 'Vadodara', phone: '+91 98250 41122', email: 'priya.s@example.com', address: '14 Shreeji Society, Karelibaug', pincode: '390018', since: t - 210 * 24 * H, pronoun: 'she' },
    { id: 'c2', code: 'BW-C-00027', name: 'Rohan Mehta', city: 'Ahmedabad', phone: '+91 99099 30218', address: 'B-402 Shivalik Heights, Satellite', pincode: '380015', since: t - 90 * 24 * H, pronoun: 'he' },
    { id: 'c3', code: 'BW-C-00031', name: 'Ananya Desai', city: 'Surat', phone: '+91 97277 55610', email: 'ananya.d@example.com', address: '7 Ghod Dod Road, Athwalines', pincode: '395007', since: t - 60 * 24 * H, pronoun: 'she' },
    { id: 'c4', code: 'BW-C-00035', name: 'Kavita Joshi', city: 'Vadodara', phone: '+91 98988 12077', address: '22 Alkapuri Society', pincode: '390007', since: t - 45 * 24 * H, pronoun: 'she' },
    { id: 'c5', code: 'BW-C-00038', name: 'Neel Patel', city: 'Mumbai', phone: '+91 98200 66431', email: 'neel.p@example.com', address: '9th floor, Sea Breeze, Andheri West', pincode: '400053', since: t - 40 * 24 * H, pronoun: 'he' },
    { id: 'c6', code: 'BW-C-00041', name: 'Meera Iyer', city: 'Bengaluru', phone: '+91 99860 21934', address: '41 4th Cross, Indiranagar', pincode: '560038', since: t - 30 * 24 * H, pronoun: 'she' },
    { id: 'c7', code: 'BW-C-00044', name: 'Dhaval Gohil', city: 'Rajkot', phone: '+91 94262 70115', address: '3 Kalawad Road', pincode: '360005', since: t - 21 * 24 * H, pronoun: 'he' },
    { id: 'c8', code: 'BW-C-00046', name: 'Sneha Trivedi', city: 'Vadodara', phone: '+91 97129 88340', address: '5 New VIP Road', pincode: '390019', since: t - 14 * 24 * H, pronoun: 'she' },
    { id: 'c9', code: 'BW-C-00049', name: 'Arjun Kapoor', city: 'Delhi', phone: '+91 98110 45672', address: 'C-12 Greater Kailash II', pincode: '110048', since: t - 9 * 24 * H, pronoun: 'he' },
    { id: 'c10', code: 'BW-C-00051', name: 'Riya Bhatt', city: 'Pune', phone: '+91 98500 77213', address: '18 Koregaon Park Lane 5', pincode: '411001', since: t - 5 * 24 * H, pronoun: 'she' },
  ]

  const products: Product[] = [
    mk('p1', 'Sleep Oil', 'Oils', 'oil', 'A calming body oil for slower, quieter evenings.', ['#C9C3EC', '#E9E4F7'], [['30 ml', 49900, 45000, 11800, 120], ['100 ml', 129900, 119900, 31000, 260]], 'active'),
    mk('p2', 'Abundance Oil', 'Oils', 'oil', 'A warm, uplifting oil for mornings with intention.', ['#F2D9A6', '#FBEFD6'], [['30 ml', 54900, 49900, 13200, 120]], 'active'),
    mk('p3', 'Abundance Spray', 'Sprays', 'spray', 'A room and aura mist with sweet orange and basil.', ['#F6C9B8', '#FCE8DF'], [['100 ml', 64900, 59900, 14500, 190]], 'active'),
    mk('p4', 'Aura Spray', 'Sprays', 'spray', 'A soft lavender and rose mist to reset the space around you.', ['#BFD8C2', '#E6F1E7'], [['50 ml', 44900, 39900, 9800, 120], ['100 ml', 69900, 64900, 16000, 190]], 'active'),
    mk('p5', 'Bath Salt', 'Salts', 'salt', 'Epsom and Himalayan salt with lavender for a long soak.', ['#B9CBF2', '#E3EAFB'], [['250 g', 39900, 34900, 8200, 300]], 'active'),
    mk('p6', 'Aura Salt', 'Salts', 'salt', 'Cleansing salt with rose petals for your space.', ['#F4C2C8', '#FBE4E7'], [['200 g', 34900, 29900, 7000, 260]], 'draft'),
  ]

  const fg: StockItem[] = products.flatMap((p) => p.variants.map((v, i) => ({
    id: v.stockId, code: `FG-${v.sku}`, name: `${p.name} ${v.label}`, kind: 'finished_good' as const, group: p.collection,
    unit: 'pcs' as const, qty: [42, 18, 26, 9, 31, 14, 37, 6][(+p.id.slice(1) + i) % 8], reserved: 0, reorderLevel: 10, reorderQty: 40,
    avgCostPaise: v.costPaise, expiresOn: dateKey(380 + i * 30), movements: [
      { id: 'm-' + v.id + '1', type: 'production_output' as const, qty: 60, at: t - 26 * 24 * H, ref: 'BW-B-2610-03' },
      { id: 'm-' + v.id + '2', type: 'sale' as const, qty: -3, at: t - 3 * 24 * H, ref: 'BW-00031' },
    ],
  })))

  const bach: StockItem[] = BACH.map((name, i) => ({
    id: bachId(name), code: `RM-BF-${String(i + 1).padStart(3, '0')}`, name: `${name} stock`, kind: 'raw_material', group: 'Bach stock concentrates',
    unit: 'ml', qty: [14.5, 9, 18, 3.5, 12, 16, 7.5, 11][i % 8] + (i % 3), reserved: 0, reorderLevel: 5, reorderQty: 20,
    avgCostPaise: 4250, expiresOn: dateKey(500 + i * 7),
    movements: [{ id: 'mb' + i, type: 'purchase_receipt', qty: 20, at: t - 40 * 24 * H, ref: 'PO/2026-27/0014' }],
  }))
  // make a couple genuinely low for the demo
  bach.find((b) => b.id === bachId('Larch'))!.qty = 4
  bach.find((b) => b.id === bachId('Rescue Remedy'))!.qty = 3.5

  const raw: StockItem[] = [
    rawItem('rm-brandy', 'RM-BS-001', 'Brandy base', 'Bases & carriers', 'ml', 1850, 500, 2000, 180),
    rawItem('rm-glycerine', 'RM-BS-002', 'Vegetable glycerine (alcohol-free base)', 'Bases & carriers', 'ml', 420, 300, 1000, 90),
    rawItem('rm-lavender', 'RM-EO-001', 'Lavender oil', 'Essential oils', 'ml', 120, 250, 500, 520),
    rawItem('rm-orange', 'RM-EO-002', 'Sweet orange oil', 'Essential oils', 'ml', 380, 200, 500, 310),
    rawItem('rm-almond', 'RM-CO-001', 'Sweet almond oil', 'Bases & carriers', 'ml', 6400, 2000, 5000, 42),
    rawItem('rm-epsom', 'RM-SL-001', 'Epsom salt', 'Salts', 'g', 9200, 3000, 10000, 9),
    rawItem('rm-rose', 'RM-HY-001', 'Rose hydrosol', 'Essential oils', 'ml', 1500, 800, 2000, 65),
  ]
  const pack: StockItem[] = [
    packItem('pk-drop30', 'PK-DB-030', '30 ml amber dropper bottle', 140, 50, 300, 1400),
    packItem('pk-label', 'PK-LB-001', 'Remedy label (50 × 30 mm)', 610, 200, 1000, 120),
    packItem('pk-spray100', 'PK-SP-100', '100 ml spray bottle', 64, 80, 300, 2600),
    packItem('pk-jar250', 'PK-JR-250', '250 g kraft jar', 210, 60, 200, 3100),
    packItem('pk-box-s', 'PK-BX-S', 'Mailer box small 15×10×8 cm', 85, 50, 200, 1800),
    packItem('pk-box-m', 'PK-BX-M', 'Mailer box medium 20×15×10 cm', 46, 40, 150, 2400),
  ]
  const stock = [...fg, ...bach, ...raw, ...pack]

  // label text as consultation.getPrepSheet() returns it — every blend is alcohol-free (owner 2026-11-18)
  const remedy = (blend: string, flowers: [string, number][], who: string) => ({
    blend, bottleMl: 30, flowers: flowers.map(([name, drops]) => ({ name, drops })), base: 'alcohol_free' as const,
    dosage: { drops: 4, timesPerDay: 4, weeks: 3 },
    label: `${who.split(' ')[0]} · ${flowers.map(([n]) => n).join(', ')} · 4 drops 4× a day · 30 ml · ALCOHOL-FREE`,
  })
  const remedyItem = (id: string) => ({ id, name: 'Bach flower blend · 30 ml', qty: 1, kind: 'remedy' as const, pricePaise: 0 })
  const prod = (id: string, p: Product, vi: number, q = 1) => ({ id, name: `${p.name} ${p.variants[vi].label}`, qty: q, kind: 'product' as const, variantId: p.variants[vi].id, pricePaise: p.variants[vi].pricePaise })
  const order = (o: Partial<Order> & Pick<Order, 'id' | 'code' | 'clientId' | 'kind' | 'items' | 'stage'>, paidH: number, dueH: number): Order => {
    const paidAt = t - paidH * H
    return {
      totalPaise: o.items.reduce((s, i) => s + i.pricePaise * i.qty, 0), paidAt, dueAt: t + dueH * H, delivery: 'courier',
      checks: {}, history: [{ stage: 'new', at: paidAt }], ...o,
      alcoholFree: true, remedyOrderId: o.kind === 'store' ? undefined : 'ro-' + o.id,
    }
  }
  const [p1, p2, p3, p4, p5] = products
  const orders: Order[] = [
    order({ id: 'o42', code: 'BW-00042', clientId: 'c1', kind: 'remedy', stage: 'new', items: [remedyItem('i1')], prep: remedy('Blend v2', [['Mimulus', 2], ['Larch', 2], ['Elm', 2], ['Walnut', 2]], 'Priya') }, 2, 3),
    order({ id: 'o43', code: 'BW-00043', clientId: 'c8', kind: 'remedy', stage: 'new', delivery: 'studio_pickup', items: [remedyItem('i1')], prep: remedy('Blend v1', [['White Chestnut', 2], ['Olive', 2], ['Impatiens', 2], ['Rescue Remedy', 4]], 'Sneha') }, 1, 5),
    order({ id: 'o44', code: 'BW-00044', clientId: 'c9', kind: 'combined', stage: 'new', items: [remedyItem('i1'), prod('i2', p1, 0)], prep: remedy('Blend v1', [['Agrimony', 2], ['Gentian', 2], ['Honeysuckle', 2]], 'Arjun') }, 0.5, 22),
    order({ id: 'o41', code: 'BW-00041', clientId: 'c2', kind: 'store', stage: 'packing', items: [prod('i1', p3, 0), prod('i2', p5, 0), prod('i3', p2, 0)], history: [{ stage: 'new', at: t - 20 * H }, { stage: 'packing', at: t - 2 * H }] }, 20, 6),
    order({ id: 'o40', code: 'BW-00040', clientId: 'c3', kind: 'combined', stage: 'quality_check', items: [remedyItem('i1'), prod('i2', p4, 1)], prep: remedy('Blend v3', [['Cerato', 2], ['Scleranthus', 2], ['Wild Oat', 2], ['Walnut', 2]], 'Ananya'), checks: { cleaned: true, flowers: true, base: true, label: true, sealed: true }, history: [{ stage: 'new', at: t - 26 * H }, { stage: 'preparing', at: t - 4 * H }, { stage: 'quality_check', at: t - 1 * H }] }, 26, 20),
    order({ id: 'o39', code: 'BW-00039', clientId: 'c4', kind: 'remedy', stage: 'preparing', items: [remedyItem('i1')], prep: remedy('Blend v2', [['Red Chestnut', 2], ['Aspen', 2], ['Star of Bethlehem', 2]], 'Kavita'), checks: { cleaned: true }, history: [{ stage: 'new', at: t - 5 * H }, { stage: 'preparing', at: t - 0.6 * H }] }, 5, 1),
    order({ id: 'o38', code: 'BW-00038', clientId: 'c5', kind: 'store', stage: 'ready_to_dispatch', items: [prod('i1', p1, 1), prod('i2', p4, 0)], pack: { weightG: 520, box: 'Small' }, history: [{ stage: 'new', at: t - 30 * H }, { stage: 'packing', at: t - 8 * H }, { stage: 'ready_to_dispatch', at: t - 5 * H }] }, 30, -1),
    order({ id: 'o37', code: 'BW-00037', clientId: 'c6', kind: 'remedy', stage: 'ready_to_dispatch', items: [remedyItem('i1')], prep: remedy('Blend v4', [['Holly', 2], ['Willow', 2], ['Pine', 2]], 'Meera'), pack: { weightG: 140, box: 'Small' }, history: [{ stage: 'new', at: t - 28 * H }, { stage: 'ready_to_dispatch', at: t - 3 * H }] }, 28, 3),
    shipped(order({ id: 'o36', code: 'BW-00036', clientId: 'c7', kind: 'store', stage: 'dispatched', items: [prod('i1', p2, 0), prod('i2', p5, 0)] }, 70, -40), 'Delhivery Surface', 'SR4417820931', 6400, t - 36 * H, ['Picked up', 'In transit · Ahmedabad hub']),
    shipped(order({ id: 'o35', code: 'BW-00035', clientId: 'c10', kind: 'remedy', stage: 'failed_delivery', problem: 'Customer not reachable — courier will retry once you confirm', items: [remedyItem('i1')], prep: remedy('Blend v1', [['Mimulus', 2], ['Rock Rose', 2]], 'Riya') }, 96, -70), 'Xpressbees', 'XB1290044716', 5900, t - 60 * H, ['Picked up', 'In transit', 'Out for delivery · Pune', 'Delivery attempt failed']),
    shipped(order({ id: 'o34', code: 'BW-00034', clientId: 'c5', kind: 'store', stage: 'rto', problem: 'Returned to origin after 3 failed attempts', items: [prod('i1', p3, 0)] }, 240, -200), 'Blue Dart', 'BD7781023345', 9800, t - 200 * H, ['Picked up', 'In transit', 'Delivery attempt failed', 'RTO initiated', 'RTO delivered']),
    shipped(order({ id: 'o33', code: 'BW-00033', clientId: 'c1', kind: 'remedy', stage: 'delivered', items: [remedyItem('i1')], prep: remedy('Blend v1', [['Mimulus', 2], ['Larch', 2], ['Elm', 2]], 'Priya') }, 300, -280), 'Delhivery Surface', 'SR4417712020', 5600, t - 280 * H, ['Picked up', 'In transit', 'Out for delivery', 'Delivered']),
    shipped(order({ id: 'o32', code: 'BW-00032', clientId: 'c3', kind: 'store', stage: 'delivered', items: [prod('i1', p4, 1), prod('i2', p1, 0, 2)] }, 150, -130), 'Ekart', 'EK5520918833', 7200, t - 130 * H, ['Picked up', 'In transit', 'Delivered']),
  ]
  // reservations for paid, undispatched store items
  for (const o of orders) if (['new', 'preparing', 'quality_check', 'packing', 'ready_to_dispatch'].includes(o.stage))
    for (const i of o.items) if (i.variantId) { const s = stock.find((x) => x.id === 'fg-' + i.variantId); if (s) s.reserved += i.qty }

  const appointments: Appointment[] = [
    { id: 'a1', clientId: 'c4', startsAt: todayAt(10, 0), minutes: 30, type: 'Follow-up', mode: 'in_person', status: 'completed' },
    { id: 'a2', clientId: 'c1', startsAt: todayAt(11, 0), minutes: 30, type: 'Follow-up', mode: 'in_person', status: 'confirmed' },
    { id: 'a3', clientId: 'c6', startsAt: todayAt(13, 30), minutes: 30, type: 'Follow-up', mode: 'online', status: 'confirmed' },
    { id: 'a4', clientId: 'c10', startsAt: todayAt(16, 0), minutes: 60, type: 'First consultation', mode: 'in_person', status: 'confirmed' },
    { id: 'a5', clientId: 'c9', startsAt: todayAt(18, 0), minutes: 60, type: 'First consultation', mode: 'online', status: 'awaiting_payment', invoiceId: 'v6' },
  ]

  const invoices: Invoice[] = [
    inv('v1', 'INV/2026-27/0118', 'c7', 'Walk-in follow-up consultation', 80000, 0, dateKey(-6), dateKey(-3), [{ at: t - 50 * H, channel: 'whatsapp' }]),
    inv('v2', 'INV/2026-27/0121', 'c2', 'Bulk order — 6 × Aura Spray 100 ml (corporate gifting)', 389400, 150000, dateKey(-12), dateKey(-2), []),
    inv('v3', 'INV/2026-27/0124', 'c5', 'First consultation (pay later)', 100000, 0, dateKey(-1), dateKey(0), []),
    inv('v4', 'INV/2026-27/0126', 'c6', 'Remedy reorder × 2', 120000, 0, dateKey(0), dateKey(5), []),
    inv('v6', 'INV/2026-27/0127', 'c9', 'First consultation', 100000, 0, dateKey(0), dateKey(0), []),
    inv('v5', 'INV/2026-27/0109', 'c4', 'Workshop seat — Inner Calm (Sunday)', 250000, 0, dateKey(-25), dateKey(-15), [{ at: t - 240 * H, channel: 'whatsapp' }, { at: t - 100 * H, channel: 'email' }]),
  ]
  const suppliers: Supplier[] = [
    { id: 's1', name: 'Healing Herbs India (Bach stock)', city: 'Mumbai', phone: '+91 22 4012 7788' },
    { id: 's2', name: 'Kannauj Aroma Co.', city: 'Kannauj', phone: '+91 5694 23 4410' },
    { id: 's3', name: 'Packwell Containers', city: 'Ahmedabad', phone: '+91 79 2589 1123' },
  ]
  const pos: PurchaseOrder[] = [
    { id: 'po1', code: 'PO/2026-27/0021', supplierId: 's2', status: 'sent', expectedOn: dateKey(1), lines: [{ stockId: 'rm-lavender', ordered: 500, received: 0, pricePaise: 520 }, { stockId: 'rm-orange', ordered: 250, received: 0, pricePaise: 310 }] },
    { id: 'po2', code: 'PO/2026-27/0022', supplierId: 's3', status: 'partial', expectedOn: dateKey(-1), lines: [{ stockId: 'pk-spray100', ordered: 300, received: 150, pricePaise: 2600 }, { stockId: 'pk-drop30', ordered: 200, received: 200, pricePaise: 1400 }] },
    { id: 'po3', code: 'PO/2026-27/0019', supplierId: 's1', status: 'received', expectedOn: dateKey(-9), lines: [{ stockId: bachId('Mimulus'), ordered: 20, received: 20, pricePaise: 4250 }, { stockId: bachId('Walnut'), ordered: 20, received: 20, pricePaise: 4250 }] },
  ]
  const bills: Bill[] = [
    { id: 'b1', party: 'Shiprocket', label: 'Wallet top-up (balance ₹1,240)', amountPaise: 500000, dueOn: dateKey(1), status: 'due', recurring: true },
    { id: 'b2', party: 'Packwell Containers', label: 'Bill PW/1182 · against PO/2026-27/0022', amountPaise: 670000, dueOn: dateKey(-4), status: 'due', poId: 'po2' },
    { id: 'b3', party: 'Kannauj Aroma Co.', label: 'Bill KA/7720 · lavender & rose', amountPaise: 1840000, dueOn: dateKey(9), status: 'due' },
    { id: 'b4', party: 'Studio rent', label: 'December rent · Karelibaug studio', amountPaise: 2500000, dueOn: dateKey(14), status: 'due', recurring: true },
  ]
  const expenses: Expense[] = [
    { id: 'e1', code: 'EXP/2026-27/0061', amountPaise: 38000, category: 'Courier & postage', paidFrom: 'Petty cash', note: 'India Post for Bengaluru remedy', at: t - 30 * H, status: 'approved' },
    { id: 'e2', code: 'EXP/2026-27/0064', amountPaise: 124000, category: 'Office supplies', paidFrom: 'Petty cash', note: 'Label printer ribbon × 2', at: t - 6 * H, status: 'submitted' },
  ]
  const batches: Batch[] = [
    { id: 'bt1', code: 'BW-B-2611-07', productId: 'p1', variantId: 'p1v0', units: 200, step: 3, mfg: dateKey(-3), expiry: dateKey(727), costPaise: 1840000, wastagePct: 1.5, materials: [{ stockId: 'rm-almond', qty: 5600 }, { stockId: 'rm-lavender', qty: 60 }, { stockId: 'pk-drop30', qty: 200 }] },
    { id: 'bt2', code: 'BW-B-2611-08', productId: 'p4', variantId: 'p4v1', units: 150, step: 2, costPaise: 1210000, materials: [{ stockId: 'rm-rose', qty: 9000 }, { stockId: 'rm-lavender', qty: 45 }, { stockId: 'pk-spray100', qty: 150 }] },
    { id: 'bt3', code: 'BW-B-2611-09', productId: 'p5', variantId: 'p5v0', units: 80, step: 0, costPaise: 0, materials: [{ stockId: 'rm-epsom', qty: 20000 }, { stockId: 'rm-lavender', qty: 40 }, { stockId: 'pk-jar250', qty: 80 }] },
    { id: 'bt4', code: 'BW-B-2610-03', productId: 'p3', variantId: 'p3v0', units: 120, step: 5, mfg: dateKey(-26), expiry: dateKey(704), costPaise: 1650000, wastagePct: 0.8, materials: [] },
  ]
  const notes: Note[] = [
    { id: 'n1', title: 'New remedy to prepare', body: 'Jitendra Khimlani gave Arjun K. a new blend · BW-00044', at: t - 0.5 * H, read: false, tone: 'info', route: { name: 'order', id: 'o44' } },
    { id: 'n2', title: 'Delivery failed', body: 'Riya B. was not reachable in Pune · BW-00035', at: t - 3 * H, read: false, tone: 'bad', route: { name: 'order', id: 'o35' } },
    { id: 'n3', title: 'Lavender oil is running low', body: '120 ml left · reorder level 250 ml', at: t - 5 * H, read: false, tone: 'warn', route: { name: 'stockItem', id: 'rm-lavender' } },
    { id: 'n4', title: 'Expense approved', body: 'EXP/2026-27/0061 · ₹380 courier', at: t - 20 * H, read: true, tone: 'good' },
  ]
  return { clients, products, stock, orders, appointments, invoices, suppliers, pos, bills, expenses, batches, notes, events: [] as import('./types').DomainEvent[], seq: { order: 44, expense: 64, batch: 9, po: 22, inv: 126, client: 51 } }
}

function todayAt(h: number, m: number) {
  const d = new Date(Date.now() + 5.5 * 3600e3)
  d.setUTCHours(h, m, 0, 0)
  return d.getTime() - 5.5 * 3600e3
}
function mk(id: string, name: string, collection: string, kind: Product['kind'], short: string, hue: [string, string], sizes: [string, number, number, number, number][], status: Product['status']): Product {
  const code = { oil: 'OL', spray: 'SP', salt: 'SL' }[kind]
  return {
    id, name, collection, kind, short, status, hue, hsn: kind === 'oil' ? '3301' : '3307', gst: 18, sample: true,
    description: `${name} is made in small batches at the BeWise studio in Vadodara. Sample description — the real copy arrives with the product list.`,
    ingredients: kind === 'salt' ? 'Epsom salt, Himalayan pink salt, lavender essential oil.' : kind === 'spray' ? 'Rose hydrosol, lavender essential oil, plant-derived solubiliser, purified water.' : 'Sweet almond oil, lavender, chamomile and vetiver essential oils.',
    howTo: kind === 'salt' ? 'Dissolve two handfuls in a warm bath. Soak for 20 minutes.' : kind === 'spray' ? 'Mist 3–4 sprays into the air or over your pillow.' : 'Warm 3–4 drops between palms and massage into wrists and temples.',
    safety: 'For external use only. Patch test before use. Keep away from eyes and children. Consult a doctor if pregnant or under medical care.',
    variants: sizes.map(([label, mrp, price, cost, w], i) => ({
      id: `${id}v${i}`, label, sku: `${code}-${name.split(' ')[0].slice(0, 2).toUpperCase()}-${label.replace(/\D/g, '').padStart(3, '0')}`,
      mrpPaise: mrp, pricePaise: price, costPaise: cost, weightG: w, active: true, stockId: `fg-${id}v${i}`,
    })),
  }
}
function rawItem(id: string, code: string, name: string, group: string, unit: 'ml' | 'g', q: number, lvl: number, rq: number, cost: number): StockItem {
  return { id, code, name, kind: 'raw_material', group, unit, qty: q, reserved: 0, reorderLevel: lvl, reorderQty: rq, avgCostPaise: cost, expiresOn: dateKey(300), movements: [{ id: 'm' + id, type: 'purchase_receipt', qty: q + 200, at: Date.now() - 20 * 24 * H, ref: 'PO/2026-27/0016' }, { id: 'm2' + id, type: 'production_consume', qty: -200, at: Date.now() - 4 * 24 * H, ref: 'BW-B-2611-07' }] }
}
function packItem(id: string, code: string, name: string, q: number, lvl: number, rq: number, cost: number): StockItem {
  return { id, code, name, kind: 'packaging', group: 'Packaging', unit: 'pcs', qty: q, reserved: 0, reorderLevel: lvl, reorderQty: rq, avgCostPaise: cost, movements: [{ id: 'm' + id, type: 'purchase_receipt', qty: q + 40, at: Date.now() - 18 * 24 * H, ref: 'PO/2026-27/0017' }, { id: 'm2' + id, type: 'sale', qty: -40, at: Date.now() - 2 * 24 * H, ref: 'Dispatches' }] }
}
function inv(id: string, code: string, clientId: string, label: string, total: number, paid: number, issuedOn: string, dueOn: string, reminders: Invoice['reminders']): Invoice {
  return { id, code, clientId, label, totalPaise: total, paidPaise: paid, issuedOn, dueOn, reminders, payments: paid ? [{ at: Date.now() - 100 * H, amountPaise: paid, method: 'UPI', ref: 'UPI 4410 2281' }] : [] }
}
function shipped(o: Order, courier: string, awb: string, freight: number, at: number, labels: string[]): Order {
  const step = (Date.now() - at) / (labels.length + 1)
  return {
    ...o, checks: {}, pack: { weightG: 300, box: 'Small' },
    shipment: { provider: 'shiprocket', courier, awb, freightPaise: freight, etd: dateKey(-1), events: labels.map((label, i) => ({ label, at: at + step * (i + 1) })) },
    history: [{ stage: 'new', at: o.paidAt }, { stage: 'dispatched', at }, ...(o.stage !== 'dispatched' ? [{ stage: o.stage, at: at + step * labels.length }] : [])],
  }
}
