/** @module commerce-ux @owner CLIENT @screens CL-35 — server wrapper so product pages pre-render (static export). */
import { PRODUCTS } from '@/lib/data'
import ProductPage from './product'

export const dynamicParams = false
export function generateStaticParams() { return PRODUCTS.map((p) => ({ slug: p.slug })) }
export default function Page() { return <ProductPage /> }
