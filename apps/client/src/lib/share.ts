/**
 * @module   sharing
 * @owner    CLIENT
 * Purpose:  owner 2026-11-24: share a story (cover card + "Read more on BeWise Wellness" + link) and, after 4 or 5 star feedback,
 *           a review card. Cards are drawn on a canvas on the device (1080 × 1920, story size) and shared with the system share
 *           sheet (WhatsApp, Instagram stories, …). Links point at the public story page /s/<id>/ and the app's welcome.
 */
import { BP } from './asset'
import type { Story } from './stories'

/** where links point when we cannot read window.location (build time, OG tags) */
export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN || (BP.startsWith('/bewise_system') ? 'https://99concepts-in.github.io' : 'https://app.bewiseglobal.in')
const origin = () => (typeof window !== 'undefined' ? window.location.origin : SITE_ORIGIN)
export const storyUrl = (id: string) => `${origin()}${BP}/s/${id}/`
export const appUrl = () => `${origin()}${BP}/welcome/`
export const prettyHost = (u: string) => u.replace(/^https?:\/\//, '').replace(/\/$/, '')

const W = 1080, H = 1920
const DISPLAY = '"Fraunces Variable", Georgia, serif'
const SANS = '"Inter Variable", system-ui, sans-serif'

function img(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src })
}
async function fonts() {
  try { await Promise.all([document.fonts.load(`600 80px ${DISPLAY}`), document.fonts.load(`italic 500 60px ${DISPLAY}`), document.fonts.load(`600 40px ${SANS}`)]) } catch { /* fall back */ }
}
function cover(ctx: CanvasRenderingContext2D, im: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / im.width, h / im.height), iw = im.width * s, ih = im.height * s
  ctx.drawImage(im, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih)
}
/** wraps text into lines that fit `max` px; caps at `limit` lines with an ellipsis */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number, limit = 99) {
  const words = text.split(/\s+/), lines: string[] = []
  let line = ''
  for (const w of words) {
    const t = line ? `${line} ${w}` : w
    if (ctx.measureText(t).width > max && line) { lines.push(line); line = w } else line = t
  }
  if (line) lines.push(line)
  if (lines.length > limit) { const cut = lines.slice(0, limit); cut[limit - 1] = cut[limit - 1].replace(/\s+\S*$/, '') + '…'; return cut }
  return lines
}
function pill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fillStyle = fill; ctx.fill()
}
function brand(ctx: CanvasRenderingContext2D, mark: HTMLImageElement, x: number, y: number, color: string) {
  ctx.drawImage(mark, x, y, 84, 84)
  ctx.fillStyle = color; ctx.font = `600 50px ${DISPLAY}`; ctx.textBaseline = 'middle'
  ctx.fillText('BeWise', x + 100, y + 36)
  ctx.font = `500 24px ${SANS}`; ctx.globalAlpha = 0.85; ctx.fillText('Holistic Wellness', x + 102, y + 72); ctx.globalAlpha = 1
}
const toBlob = (c: HTMLCanvasElement) => new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('no image'))), 'image/jpeg', 0.9))

/** Story card: the cover full bleed, title, a "Read more on BeWise Wellness" button and the link. */
export async function storyCard(story: Story, url: string) {
  await fonts()
  const [bg, mark] = await Promise.all([img(`${BP}/img/${story.cover}.webp`), img(`${BP}/img/logo-mark-white.png`)])
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d')!
  cover(ctx, bg, 0, 0, W, H)
  const g = ctx.createLinearGradient(0, H * 0.35, 0, H); g.addColorStop(0, 'rgba(10,12,30,0)'); g.addColorStop(0.55, 'rgba(10,12,30,.62)'); g.addColorStop(1, 'rgba(10,12,30,.92)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  const top = ctx.createLinearGradient(0, 0, 0, 320); top.addColorStop(0, 'rgba(10,12,30,.45)'); top.addColorStop(1, 'rgba(10,12,30,0)')
  ctx.fillStyle = top; ctx.fillRect(0, 0, W, 320)
  brand(ctx, mark, 80, 96, '#fff')

  const cover0 = story.slides[0]
  const sub = cover0.k === 'cover' ? cover0.sub : ''
  ctx.textBaseline = 'alphabetic'
  ctx.font = `700 30px ${SANS}`
  const tag = story.tag.toUpperCase(), tw = ctx.measureText(tag).width + 56
  let y = 1130
  ctx.font = `600 96px ${DISPLAY}`
  const tl = wrap(ctx, story.title, W - 160, 3)
  ctx.font = `400 42px ${SANS}`
  const sl = sub ? wrap(ctx, sub, W - 160, 3) : []
  y = H - 470 - tl.length * 104 - sl.length * 58
  pill(ctx, 80, y - 50, tw, 64, 'rgba(255,255,255,.9)')
  ctx.fillStyle = '#243D91'; ctx.font = `700 30px ${SANS}`; ctx.fillText(tag, 108, y - 7)
  y += 110
  ctx.fillStyle = '#fff'; ctx.font = `600 96px ${DISPLAY}`
  for (const l of tl) { ctx.fillText(l, 80, y); y += 104 }
  ctx.font = `400 42px ${SANS}`; ctx.fillStyle = 'rgba(255,255,255,.9)'
  y += 6
  for (const l of sl) { ctx.fillText(l, 80, y); y += 58 }

  // call to action
  const by = H - 300
  pill(ctx, 80, by, W - 160, 128, '#fff')
  ctx.fillStyle = '#243D91'; ctx.font = `600 46px ${DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('Read more on BeWise Wellness  →', W / 2, by + 66)
  ctx.font = `600 34px ${SANS}`; ctx.fillStyle = 'rgba(255,255,255,.85)'
  ctx.fillText(prettyHost(url), W / 2, by + 196)
  ctx.textAlign = 'left'
  return toBlob(c)
}

/** Review card for members who gave 4 or 5 stars: their stars and their own words, Jitendra Khimlani and the app link. */
export async function reviewCard(r: { rating: number; quote: string; name: string }, url: string) {
  await fonts()
  const [mark, jitu] = await Promise.all([img(`${BP}/img/logo-mark.png`), img(`${BP}/img/jitu-portrait.webp`)])
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#FFF3DF'); g.addColorStop(0.45, '#FDE3EC'); g.addColorStop(0.8, '#E7E4FF'); g.addColorStop(1, '#DDF0F4')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  // soft flowers
  const flower = (x: number, y: number, s: number, col: string, a: number) => {
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a; ctx.fillStyle = col
    for (let k = 0; k < 5; k++) { ctx.rotate((Math.PI * 2) / 5); ctx.beginPath(); ctx.ellipse(0, -s * 0.55, s * 0.36, s * 0.55, 0, 0, Math.PI * 2); ctx.fill() }
    ctx.globalAlpha = a * 1.4; ctx.fillStyle = '#F7C548'; ctx.beginPath(); ctx.arc(0, 0, s * 0.26, 0, Math.PI * 2); ctx.fill(); ctx.restore()
  }
  flower(960, 170, 190, '#F5A3B8', 0.35); flower(110, 1780, 170, '#9ED3C2', 0.32); flower(990, 1640, 110, '#B9A7F2', 0.32); flower(120, 420, 70, '#F7C98B', 0.4)
  brand(ctx, mark, 80, 110, '#17214A')

  // stars
  ctx.textBaseline = 'alphabetic'
  const sy = 420
  for (let k = 0; k < 5; k++) {
    const cx = 120 + k * 104, on = k < r.rating
    ctx.save(); ctx.translate(cx, sy); ctx.beginPath()
    for (let p = 0; p < 10; p++) { const rad = p % 2 ? 19 : 44, a = (Math.PI / 5) * p - Math.PI / 2; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad) }
    ctx.closePath(); ctx.fillStyle = on ? '#F2B233' : 'rgba(23,33,74,.15)'; ctx.fill(); ctx.restore()
  }
  // card with the quote
  const cy = 520, ch = 820
  ctx.save(); ctx.shadowColor = 'rgba(60,40,110,.16)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18
  ctx.beginPath(); ctx.roundRect(70, cy, W - 140, ch, 56); ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fill(); ctx.restore()
  ctx.fillStyle = '#E5577A'; ctx.font = `600 190px ${DISPLAY}`; ctx.fillText('“', 120, cy + 190)
  ctx.font = `italic 500 58px ${DISPLAY}`
  const ql = wrap(ctx, r.quote, W - 300, 7)
  let y = cy + 260 + Math.max(0, (6 - ql.length) * 30)
  ctx.fillStyle = '#17214A'
  for (const l of ql) { ctx.fillText(l, 150, y); y += 78 }
  ctx.font = `700 36px ${SANS}`; ctx.fillStyle = '#5B6384'
  ctx.fillText(`${r.name}, BeWise member`, 150, cy + ch - 70)

  // Jitendra Khimlani
  const py = 1420
  ctx.save(); ctx.beginPath(); ctx.arc(170, py + 90, 90, 0, Math.PI * 2); ctx.closePath(); ctx.clip()
  ctx.fillStyle = '#E6EDFF'; ctx.fillRect(80, py, 180, 180)
  cover(ctx, jitu, 80, py - 10, 180, 220); ctx.restore()
  ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(170, py + 90, 90, 0, Math.PI * 2); ctx.stroke()
  ctx.fillStyle = '#17214A'; ctx.font = `600 50px ${DISPLAY}`; ctx.fillText('Wellness session with', 300, py + 74)
  ctx.fillText('Jitendra Khimlani', 300, py + 134)
  ctx.font = `600 30px ${SANS}`; ctx.fillStyle = '#5B6384'; ctx.fillText('Certified Bach Flower Remedy Therapist', 300, py + 184)

  const by = H - 230
  pill(ctx, 80, by, W - 160, 120, '#243D91')
  ctx.fillStyle = '#fff'; ctx.font = `600 44px ${DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('Begin your journey on BeWise  →', W / 2, by + 62)
  ctx.font = `600 32px ${SANS}`; ctx.fillStyle = '#243D91'
  ctx.fillText(prettyHost(url), W / 2, by + 170)
  ctx.textAlign = 'left'
  return toBlob(c)
}

export type ShareResult = 'shared' | 'cancelled' | 'unsupported'
/** System share sheet with the image when the device allows it, else text + link only. */
export async function shareCard({ blob, filename, title, text, url }: { blob?: Blob; filename: string; title: string; text: string; url: string }): Promise<ShareResult> {
  if (typeof navigator === 'undefined' || !navigator.share) return 'unsupported'
  const full = `${text}\n${url}`
  try {
    if (blob) {
      const file = new File([blob], filename, { type: blob.type })
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title, text: full }); return 'shared' }
    }
    await navigator.share({ title, text, url }); return 'shared'
  } catch (e) {
    return (e as Error)?.name === 'AbortError' ? 'cancelled' : 'unsupported'
  }
}
export const waLink = (text: string, url: string) => `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`
