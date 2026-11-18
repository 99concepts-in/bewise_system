/**
 * @screens MG-15 Products (phone) · MG-16 Quick edit (phone) · MG-30 Products (computer) · MG-31 Add/edit product (computer)
 * Validation follows docs/specs/manager/04-PRODUCT-EDITOR.md. Cost is never shown in the shop preview.
 */
import { AnimatePresence, motion } from 'motion/react'
import { Plus, Search, Upload, AlertCircle, CheckCircle2, Trash2, ImagePlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useStore, available } from '../lib/store'
import { inr, uid } from '../lib/format'
import type { Product, Variant } from '../lib/types'
import {
  Button, Chip, Empty, Field, ProductArt, Screen, SectionTitle, Segmented, Surface, Switch, areaCls, cx, inputCls, spring, useDesktop,
} from '../ui/kit'

const toR = (p: number) => (p / 100).toString()
const toP = (r: string) => Math.round(Number(r || 0) * 100)

export function Products() {
  const s = useStore()
  const desktop = useDesktop()
  const [q, setQ] = useState('')
  const [col, setCol] = useState('all')
  const cols = Array.from(new Set(s.products.map((p) => p.collection)))
  const list = s.products.filter((p) => p.status !== 'archived' && (col === 'all' || p.collection === col) && (p.name + p.variants.map((v) => v.sku).join(' ')).toLowerCase().includes(q.toLowerCase()))
  const stockOf = (p: Product) => p.variants.reduce((a, v) => a + available(s.stock.find((x) => x.id === v.stockId) ?? { qty: 0, reserved: 0 } as never), 0)
  return (
    <Screen wide={desktop} title="Products" sub={`${s.products.filter((p) => p.status === 'active').length} in the shop · sample prices until the real list arrives`}
      actions={<Button kind="primary" className="h-11" icon={<Plus size={18} />} onClick={() => s.go({ name: 'product', id: 'new', intent: 'full' })}>{desktop ? 'Add product' : 'Add'}</Button>}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-80">
          <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-3" />
          <input id="prod-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or SKU" className={cx(inputCls, 'h-[52px] rounded-full pl-11 shadow-soft')} aria-label="Search products" />
        </div>
        <Segmented id="col" className="lg:w-[420px]" value={col} onChange={setCol} options={[{ value: 'all', label: 'All' }, ...cols.map((c) => ({ value: c, label: c }))]} />
      </div>

      {desktop ? (
        <div className="mt-5 overflow-x-auto rounded-[24px] bg-surface shadow-soft">
          <table className="w-full min-w-[760px] text-left">
            <thead><tr className="border-b border-[var(--line)] text-[12.5px] font-semibold text-ink-2">
              <th className="py-3 pl-5">Product</th><th className="py-3">Collection</th><th className="py-3">Sizes</th><th className="py-3 text-right">From</th><th className="py-3 text-right">In stock</th><th className="py-3 pl-6">Show in shop</th>
            </tr></thead>
            <tbody>
              <AnimatePresence initial={false}>
                {list.map((p) => {
                  const st = stockOf(p)
                  return (
                    <motion.tr key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => s.go({ name: 'product', id: p.id, intent: 'full' })} className="cursor-pointer border-b border-[var(--line)] last:border-0 hover:bg-surface-2/60">
                      <td className="py-3 pl-5"><span className="flex items-center gap-3"><ProductArt hue={p.hue} kind={p.kind} size={44} /><span><span className="block text-[15px] font-semibold text-ink">{p.name}</span><span className="text-[12.5px] text-ink-2">{p.short}</span></span></span></td>
                      <td className="text-[14px] text-ink">{p.collection}</td>
                      <td className="text-[14px] text-ink">{p.variants.map((v) => v.label).join(', ')}</td>
                      <td className="text-right text-[14.5px] font-semibold text-ink tnum">{inr(Math.min(...p.variants.map((v) => v.pricePaise)))}</td>
                      <td className="text-right"><Chip tone={st <= 10 ? 'warn' : 'neutral'}>{st} pcs</Chip></td>
                      <td className="pl-6" onClick={(e) => e.stopPropagation()}><Switch label={`Show ${p.name} in shop`} on={p.status === 'active'} onChange={(v) => { s.setProductStatus(p.id, v ? 'active' : 'draft'); s.toast(v ? `${p.name} is in the shop` : `${p.name} hidden from the shop`, 'info') }} /></td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {list.map((p, i) => (
            <motion.button key={p.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.03 }} whileTap={{ scale: 0.985 }}
              onClick={() => s.go({ name: 'product', id: p.id })} className="flex w-full items-center gap-3 rounded-[24px] bg-surface p-3 pr-4 text-left shadow-soft">
              <ProductArt hue={p.hue} kind={p.kind} size={56} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15.5px] font-semibold text-ink">{p.name}</span>
                <span className="block text-[13px] text-ink-2 tnum">from {inr(Math.min(...p.variants.map((v) => v.pricePaise)))} · {stockOf(p)} in stock</span>
              </span>
              <Chip tone={p.status === 'active' ? 'ok' : 'neutral'}>{p.status === 'active' ? 'In shop' : 'Draft'}</Chip>
            </motion.button>
          ))}
        </div>
      )}
      {list.length === 0 && <Surface className="mt-4"><Empty title="No products match" body="Try another name or collection, or add a product." /></Surface>}
    </Screen>
  )
}

/* ───────── MG-16 quick edit (phone) ───────── */
export function ProductRoute({ id, intent }: { id: string; intent?: string }) {
  const desktop = useDesktop()
  if (id === 'new' || intent === 'full' || desktop) return <ProductEditor id={id} />
  return <QuickEdit id={id} />
}

function QuickEdit({ id }: { id: string }) {
  const s = useStore()
  const p = s.products.find((x) => x.id === id)
  if (!p) return <Screen title="Product"><Empty title="Product not found" body="It may have been removed." /></Screen>
  return (
    <Screen title={p.name} sub={`${p.collection} · quick edit`}>
      <Surface className="flex items-center gap-4">
        <ProductArt hue={p.hue} kind={p.kind} size={64} />
        <span className="flex-1"><span className="block text-[15.5px] font-semibold text-ink">Show in shop</span><span className="block text-[13px] text-ink-2">{p.status === 'active' ? 'Clients can buy it now' : 'Hidden from clients'}</span></span>
        <Switch label="Show in shop" on={p.status === 'active'} onChange={(v) => { s.setProductStatus(p.id, v ? 'active' : 'draft'); s.toast(v ? 'Now in the shop' : 'Hidden from the shop', 'info') }} />
      </Surface>
      {p.variants.map((v) => <VariantQuick key={v.id} p={p} v={v} />)}
      <Button full className="mt-6" onClick={() => s.go({ name: 'product', id: p.id, intent: 'full' })}>Edit photos, description and tax</Button>
      <p className="mt-2 text-center text-[12.5px] text-ink-2">Full editing is easier on a computer.</p>
    </Screen>
  )
}
function VariantQuick({ p, v }: { p: Product; v: Variant }) {
  const s = useStore()
  const [d, setD] = useState({ mrp: toR(v.mrpPaise), price: toR(v.pricePaise), cost: toR(v.costPaise) })
  const dirty = toP(d.mrp) !== v.mrpPaise || toP(d.price) !== v.pricePaise || toP(d.cost) !== v.costPaise
  const err = toP(d.price) > toP(d.mrp) ? 'Price can’t be above MRP' : toP(d.price) <= 0 ? 'Price must be more than ₹0' : undefined
  const margin = toP(d.price) > 0 ? Math.round((1 - toP(d.cost) / toP(d.price)) * 100) : 0
  return (
    <>
      <SectionTitle action={<span className="flex items-center gap-2"><span className="text-[13px] text-ink-2">Active</span><Switch label={`${v.label} active`} on={v.active} onChange={(a) => s.patchVariant(p.id, v.id, { active: a })} /></span>}>{v.label} <span className="font-medium text-ink-3">· {v.sku}</span></SectionTitle>
      <Surface className="space-y-3">
        <div className="grid grid-cols-3 gap-2.5">
          {(['mrp', 'price', 'cost'] as const).map((k) => (
            <Field key={k} label={k === 'mrp' ? 'MRP ₹' : k === 'price' ? 'Price ₹' : 'Cost ₹'}>
              <input id={`${v.id}-${k}`} inputMode="decimal" className={cx(inputCls, 'px-3 text-[16px] font-bold tnum')} value={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.value.replace(/[^\d.]/g, '') })} />
            </Field>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className={cx('text-[13px] font-semibold', err ? 'text-bad' : 'text-ink-2')}>{err ?? `Margin ${margin}% · cost is never shown to clients`}</span>
          <AnimatePresence>
            {dirty && <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              <Button kind="primary" className="h-10 px-4 text-[14px]" disabled={!!err} onClick={() => { s.patchVariant(p.id, v.id, { mrpPaise: toP(d.mrp), pricePaise: toP(d.price), costPaise: toP(d.cost) }); s.toast(`${p.name} ${v.label} saved`) }}>Save</Button>
            </motion.span>}
          </AnimatePresence>
        </div>
      </Surface>
    </>
  )
}

/* ───────── MG-31 add / edit product (computer) ───────── */
const KIND_CODE = { oil: 'OL', spray: 'SP', salt: 'SL' } as const
const HUES: [string, string][] = [['#C9C3EC', '#E9E4F7'], ['#F2D9A6', '#FBEFD6'], ['#BFD8C2', '#E6F1E7'], ['#F4C2C8', '#FBE4E7'], ['#B9CBF2', '#E3EAFB']]
const blank = (): Product => {
  const id = 'p' + uid()
  return { id, name: '', collection: 'Oils', kind: 'oil', short: '', description: '', ingredients: '', howTo: '', safety: 'For external use only. Patch test before use. Keep away from eyes and children. Consult a doctor if pregnant or under medical care.', status: 'draft', hsn: '3301', gst: 18, hue: HUES[Math.floor(Math.random() * HUES.length)], variants: [{ id: id + 'v0', label: '30 ml', sku: '', mrpPaise: 0, pricePaise: 0, costPaise: 0, weightG: 120, active: true, stockId: 'fg-' + id + 'v0' }] }
}

function checks(p: Product, photos: string[]) {
  const out: { field: string; msg: string }[] = []
  if (p.name.trim().length < 2) out.push({ field: 'name', msg: 'Add a name' })
  if (p.short.trim().length < 20) out.push({ field: 'short', msg: 'Short description needs at least 20 characters' })
  if (p.description.trim().length < 50) out.push({ field: 'description', msg: 'Description needs at least 50 characters' })
  if (!p.ingredients.trim()) out.push({ field: 'ingredients', msg: 'Add ingredients' })
  if (!p.howTo.trim()) out.push({ field: 'howTo', msg: 'Add how to use' })
  if (!/^\d{4}(\d{2}){0,2}$/.test(p.hsn)) out.push({ field: 'hsn', msg: 'HSN code must be 4, 6 or 8 digits' })
  if (photos.length === 0 && p.sample !== true) out.push({ field: 'photos', msg: 'Add at least one photo' })
  p.variants.forEach((v) => {
    if (!v.label.trim()) out.push({ field: 'v', msg: 'Every size needs a label' })
    if (v.pricePaise <= 0) out.push({ field: 'v', msg: `${v.label || 'A size'}: add a price` })
    else if (v.pricePaise > v.mrpPaise) out.push({ field: 'v', msg: `${v.label}: price is above MRP` })
    if (v.weightG <= 0) out.push({ field: 'v', msg: `${v.label}: add the packed weight` })
  })
  return out
}

function ProductEditor({ id }: { id: string }) {
  const s = useStore()
  const existing = s.products.find((x) => x.id === id)
  const [p, setP] = useState<Product>(() => existing ? structuredClone(existing) : blank())
  const [photos, setPhotos] = useState<string[]>([])
  const [tab, setTab] = useState<'ingredients' | 'howTo' | 'safety'>('ingredients')
  const [tried, setTried] = useState(false)
  const issues = useMemo(() => checks(p, photos), [p, photos])
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }))
  const setV = (i: number, patch: Partial<Variant>) => setP((x) => ({ ...x, variants: x.variants.map((v, k) => (k === i ? { ...v, ...patch } : v)) }))
  const sku = (v: Variant) => v.sku || `${KIND_CODE[p.kind]}-${(p.name.split(' ')[0] || 'XX').slice(0, 2).toUpperCase()}-${v.label.replace(/\D/g, '').padStart(3, '0')}`
  const save = (publish: boolean) => {
    if (publish) { setTried(true); if (issues.length) { s.toast(`${issues.length} thing${issues.length > 1 ? 's' : ''} to fix before publishing`, 'bad'); return } }
    if (!p.name.trim()) { setTried(true); s.toast('Add a name to save a draft', 'bad'); return }
    const final: Product = { ...p, status: publish ? 'active' : existing?.status === 'active' ? 'active' : 'draft', variants: p.variants.map((v) => ({ ...v, sku: sku(v) })) }
    s.saveProduct(final)
    s.toast(publish ? `${p.name} published` : 'Draft saved')
    if (!existing) s.back()
  }
  const addPhotos = (files: FileList | null) => {
    if (!files) return
    Array.from(files).slice(0, 8 - photos.length).forEach((f) => { const r = new FileReader(); r.onload = () => setPhotos((x) => [...x, String(r.result)]); r.readAsDataURL(f) })
  }
  const show = (f: string) => tried && issues.some((i) => i.field === f)
  const v0 = p.variants[0]
  return (
    <Screen wide title={existing ? p.name || 'Untitled' : 'New product'} sub={existing ? `${p.collection} · ${p.status === 'active' ? 'in the shop' : 'draft'}` : 'Saved as a draft until you publish'}
      actions={<><Button onClick={() => save(false)} className="hidden h-11 sm:inline-flex">Save draft</Button><Button kind="primary" className="h-11" onClick={() => save(true)}>Publish</Button></>}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <Surface>
            <h3 className="mb-3 text-[16px] font-bold text-ink">Photos</h3>
            <div className="flex gap-3 overflow-x-auto pb-1">
              <label htmlFor="ph" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addPhotos(e.dataTransfer.files) }}
                className={cx('flex h-32 w-52 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-[20px] border-2 border-dashed text-center hover:border-[var(--accent)]', show('photos') ? 'border-[var(--bad)]' : 'border-[var(--line)]')}>
                <Upload size={22} className="text-accent" /><span className="text-[14px] font-semibold text-ink">Drag photos here</span><span className="text-[12px] text-ink-2">or click to choose · up to 8</span>
              </label>
              <input id="ph" type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addPhotos(e.target.files)} />
              <AnimatePresence>
                {photos.map((src, i) => (
                  <motion.div key={src.slice(-24) + i} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="group relative h-32 w-32 shrink-0 overflow-hidden rounded-[20px]">
                    <img src={src} alt={`${p.name} photo ${i + 1}`} className="size-full object-cover" />
                    {i === 0 && <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white">Cover</span>}
                    <button aria-label="Remove photo" onClick={() => setPhotos((x) => x.filter((_, k) => k !== i))} className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"><Trash2 size={14} /></button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {photos.length === 0 && <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-[20px]" style={{ background: `linear-gradient(150deg, ${p.hue[1]}, ${p.hue[0]})` }}><ImagePlus size={24} className="text-[#182957]/50" /></div>}
            </div>
          </Surface>

          <Surface className="space-y-4">
            <h3 className="text-[16px] font-bold text-ink">Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" error={show('name') ? 'Add a name' : undefined}><input id="pe-name" className={inputCls} value={p.name} onChange={(e) => set('name', e.target.value)} placeholder="Calm Mist" /></Field>
              <Field label="Collection">
                <select id="pe-col" className={inputCls} value={p.collection} onChange={(e) => { const c = e.target.value; set('collection', c); set('kind', c === 'Sprays' ? 'spray' : c === 'Salts' ? 'salt' : 'oil'); set('hsn', c === 'Oils' ? '3301' : '3307') }}>
                  {['Oils', 'Sprays', 'Salts'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
            </div>
            <Field label={`Short description · ${p.short.length}/140`} error={show('short') ? 'At least 20 characters — this shows on the shop card' : undefined}>
              <input id="pe-short" maxLength={140} className={inputCls} value={p.short} onChange={(e) => set('short', e.target.value)} placeholder="A soothing mist to calm the mind and body." />
            </Field>
            <Field label="Description" error={show('description') ? 'At least 50 characters' : undefined}><textarea id="pe-desc" maxLength={2000} className={areaCls} value={p.description} onChange={(e) => set('description', e.target.value)} /></Field>
          </Surface>

          <Surface className="space-y-3">
            <Segmented id="pe-tab" value={tab} onChange={setTab} options={[{ value: 'ingredients', label: 'Ingredients' }, { value: 'howTo', label: 'How to use' }, { value: 'safety', label: 'Safety' }]} />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}>
                <textarea id={'pe-' + tab} aria-label={tab} className={cx(areaCls, show(tab) && 'border-[var(--bad)]')} value={p[tab]} onChange={(e) => set(tab, e.target.value)} />
              </motion.div>
            </AnimatePresence>
          </Surface>

          <Surface pad={false} className="overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3"><h3 className="text-[16px] font-bold text-ink">Sizes & prices</h3><span className="text-[12.5px] text-ink-2">Prices include GST</span></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead><tr className="text-[12px] font-semibold text-ink-2"><th className="px-5 py-2">Size</th><th className="py-2">SKU</th><th className="py-2">MRP ₹</th><th className="py-2">Price ₹</th><th className="py-2">Cost ₹</th><th className="py-2">Weight g</th><th /></tr></thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {p.variants.map((v, i) => (
                      <motion.tr key={v.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-t border-[var(--line)]">
                        <td className="px-5 py-2"><input aria-label="Size" className={cx(inputCls, 'h-10 w-24 px-3')} value={v.label} onChange={(e) => setV(i, { label: e.target.value })} /></td>
                        <td className="py-2 pr-2 text-[13px] text-ink-2 tnum">{sku(v)}</td>
                        {(['mrpPaise', 'pricePaise', 'costPaise'] as const).map((k) => (
                          <td key={k} className="py-2 pr-2"><input aria-label={k} inputMode="decimal" className={cx(inputCls, 'h-10 w-24 px-3 tnum', k === 'pricePaise' && tried && (v.pricePaise <= 0 || v.pricePaise > v.mrpPaise) && 'border-[var(--bad)]')} value={v[k] ? toR(v[k]) : ''} placeholder="0" onChange={(e) => setV(i, { [k]: toP(e.target.value.replace(/[^\d.]/g, '')) })} /></td>
                        ))}
                        <td className="py-2 pr-2"><input aria-label="Weight" inputMode="numeric" className={cx(inputCls, 'h-10 w-20 px-3 tnum')} value={v.weightG || ''} onChange={(e) => setV(i, { weightG: Number(e.target.value.replace(/\D/g, '')) })} /></td>
                        <td className="pr-4">{p.variants.length > 1 && <button aria-label="Remove size" onClick={() => setP((x) => ({ ...x, variants: x.variants.filter((_, k) => k !== i) }))} className="grid size-9 place-items-center rounded-full text-ink-3 hover:bg-bad-soft hover:text-bad"><Trash2 size={15} /></button>}</td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            <button onClick={() => setP((x) => { const vid = x.id + 'v' + uid(); return { ...x, variants: [...x.variants, { id: vid, label: '100 ml', sku: '', mrpPaise: 0, pricePaise: 0, costPaise: 0, weightG: 200, active: true, stockId: 'fg-' + vid }] } })}
              className="m-3 flex items-center gap-1.5 rounded-full px-3 py-2 text-[14px] font-semibold text-accent hover:bg-accent-soft"><Plus size={16} /> Add size</button>
          </Surface>
        </div>

        <div className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:self-start">
          <AnimatePresence>
            {tried && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cx('rounded-[24px] p-4', issues.length ? 'bg-bad-soft' : 'bg-ok-soft')}>
                {issues.length ? (
                  <>
                    <div className="mb-2 flex items-center gap-2 text-[15px] font-bold text-ink"><AlertCircle size={18} className="text-bad" />{issues.length} thing{issues.length > 1 ? 's' : ''} before this can go live</div>
                    <ul className="space-y-1 text-[13.5px] text-ink">{issues.map((x, i) => <li key={i}>· {x.msg}</li>)}</ul>
                  </>
                ) : <div className="flex items-center gap-2 text-[15px] font-bold text-ink"><CheckCircle2 size={18} className="text-ok" />Ready to publish</div>}
              </motion.div>
            )}
          </AnimatePresence>
          <Surface className="space-y-4">
            <div className="flex items-center justify-between"><span className="text-[15px] font-semibold text-ink">Show in shop</span><Chip tone={p.status === 'active' ? 'ok' : 'neutral'}>{p.status === 'active' ? 'Live' : 'Draft'}</Chip></div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="HSN code" error={show('hsn') ? '4, 6 or 8 digits' : undefined}><input id="pe-hsn" inputMode="numeric" className={cx(inputCls, 'tnum')} value={p.hsn} onChange={(e) => set('hsn', e.target.value.replace(/\D/g, ''))} /></Field>
              <Field label="GST"><select id="pe-gst" className={inputCls} value={p.gst} onChange={(e) => set('gst', Number(e.target.value))}>{[5, 12, 18].map((g) => <option key={g} value={g}>{g}%</option>)}</select></Field>
            </div>
            <p className="text-[12.5px] text-ink-2">Each size gets its own finished-goods stock item · reorder at 10 pcs.</p>
          </Surface>
          <div>
            <h3 className="mb-2 px-1 text-[15px] font-bold text-ink">Shop preview</h3>
            <div className="mx-auto w-[260px] rounded-[40px] border-[6px] border-[var(--nav)] bg-[var(--ground-mid)] p-3 shadow-lift">
              <div className="overflow-hidden rounded-[26px] bg-surface">
                <div className="relative grid aspect-square place-items-center" style={{ background: `linear-gradient(150deg, ${p.hue[1]}, ${p.hue[0]})` }}>
                  {photos[0] ? <img src={photos[0]} alt="" className="absolute inset-0 size-full object-cover" /> : <ProductArt hue={p.hue} kind={p.kind} size={120} className="!bg-none" />}
                </div>
                <div className="p-4">
                  <motion.div key={p.name} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="text-[18px] font-bold text-ink">{p.name || 'Product name'}</motion.div>
                  <div className="text-[12.5px] text-ink-2">{p.collection.replace(/s$/, '')} · {v0?.label}</div>
                  <p className="mt-2 line-clamp-2 text-[12.5px] text-ink-2">{p.short || 'Short description shows here.'}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span><span className="text-[17px] font-bold text-ink tnum">{inr(v0?.pricePaise ?? 0)}</span>{v0 && v0.mrpPaise > v0.pricePaise && <span className="ml-1.5 text-[12px] text-ink-3 line-through tnum">{inr(v0.mrpPaise)}</span>}</span>
                    <span className="cta rounded-full px-3 py-1.5 text-[12px] font-bold">Add to bag</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Screen>
  )
}

