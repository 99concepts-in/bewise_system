// @owner HUB · Types for api/sdk/bewise-api.js. Copy into your app (e.g. src/types/bewise-api.d.ts) or reference it.
export type BeWiseResult<T> = { ok: true; data: T; status: number } | { ok: false; error: { code: string; message: string }; status: number }
export type Role = 'client' | 'consultant' | 'manager' | 'owner' | 'accountant'
export type Me = { id: string; email: string | null; name: string; phone: string | null; roles: Role[]; clientId: string | null; clientCode: string | null; hasPassword: boolean }
export interface BeWiseError extends Error { code: string; status: number }
type Fn = (input?: Record<string, unknown>) => Promise<any>
export interface BeWiseSDK {
  /** never throws */
  call<T = any>(fn: `${string}.${string}`, input?: Record<string, unknown>): Promise<BeWiseResult<T>>
  /** throws BeWiseError */
  req<T = any>(fn: `${string}.${string}`, input?: Record<string, unknown>): Promise<T>
  api: Record<string, Record<string, Fn>> & { auth: { me(): Promise<Me | null>; verifyOtp(i: { email: string; code: string }): Promise<Me>; login(i: { email: string; password: string }): Promise<Me> } & Record<string, Fn> }
  pay(purpose: 'appointment' | 'sales_order', refId: string): Promise<{ paid?: true; manual?: true; amountPaise?: number; upi?: string | null }>
  available(): Promise<boolean>
  on(evt: 'signedout', cb: (payload: unknown) => void): () => void
  base(): string
  setBase(url: string): void
  version: string
}
declare global { interface Window { BeWise: BeWiseSDK; BEWISE_API_BASE?: string } }
declare const BeWise: BeWiseSDK
export default BeWise
