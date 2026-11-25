/**
 * @module   prototype/consultant-app/canvasArt
 * @owner    CONSULTANT
 * Purpose:  Ready-made marketing images drawn in the browser (no server): Instagram/WhatsApp story 1080×1920, post 1080×1080.
 *           Brand: BeWise logo + flower illustrations from website/assets (copied to public/img), Plus Jakarta Sans + Cormorant italic.
 */
import type { Format, Post } from './marketing'

const INK = '#182957', MUTED = '#5F667A', PERI = '#5E7FB8', SAGE = '#4F6249', GOLD = '#B89B64'
const SANS = '"Plus Jakarta Sans", system-ui, sans-serif'
const SERIF = '"Cormorant Garamond", Georgia, serif'

export const SIZE: Record<Format, [number, number]> = { story: [1080, 1920], post: [1080, 1080] }
export const flowerSlug = (f: string) => f.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, '')
export const flowerImg = (f: string) => `./img/flowers/${flowerSlug(f)}.svg`

// ---------------------------------------------------------------- assets (cached; SVGs get explicit sizes so every browser can draw them)
const cache = new Map<string, Promise<HTMLImageElement | null>>()
function loadImg(src: string, w = 1000): Promise<HTMLImageElement | null> {
  if (!cache.has(src)) cache.set(src, (async () => {
    try {
      let url = src
      if (src.endsWith('.svg')) {
        const txt = await (await fetch(src)).text()
        const vb = /viewBox="([\d.\s-]+)"/.exec(txt)?.[1].split(/\s+/).map(Number)
        const h = vb ? Math.round((w * vb[3]) / vb[2]) : w
        const sized = txt.replace(/<svg\b([^>]*)>/, (m0, attrs: string) => /\swidth=/.test(attrs) ? m0 : `<svg${attrs} width="${w}" height="${h}">`)
        url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }))
      }
      const img = new Image()
      img.decoding = 'async'
      img.src = url
      await img.decode()
      return img
    } catch { return null }
  })())
  return cache.get(src)!
}
async function fontsReady() {
  try { await Promise.all([document.fonts.load(`800 60px ${SANS}`), document.fonts.load(`600 40px ${SANS}`), document.fonts.load(`italic 500 60px ${SERIF}`)]) } catch { /* fall back to system fonts */ }
}
export interface Assets { logo: HTMLImageElement | null; flower: HTMLImageElement | null; owl: HTMLImageElement | null; photo: HTMLImageElement | null }
export async function loadAssets(post: Post): Promise<Assets> {
  await fontsReady()
  const [logo, flower, owl, photo] = await Promise.all([
    loadImg('./brand/bewise-logo-horizontal.svg', 1200),
    post.kind === 'flower' && post.flower ? loadImg(flowerImg(post.flower), 900) : Promise.resolve(null),
    post.kind === 'story' || post.kind === 'review' || post.kind === 'tip' || post.kind === 'impact' ? loadImg('./img/owl-wave.webp') : Promise.resolve(null),
    post.kind === 'book' ? loadImg('./img/jitu.webp') : Promise.resolve(null),
  ])
  return { logo, flower, owl, photo }
}

// ---------------------------------------------------------------- text helpers
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/), lines: string[] = []
  let line = ''
  for (const w of words) {
    const t = line ? line + ' ' + w : w
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w } else line = t
  }
  if (line) lines.push(line)
  return lines
}
/** Biggest font size (down to `min`) whose wrapped text fits `maxLines`. */
function fit(ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, start: number, min: number, maxW: number, maxLines: number) {
  for (let px = start; px >= min; px -= 2) {
    ctx.font = font(px)
    const lines = wrap(ctx, text, maxW)
    if (lines.length <= maxLines) return { px, lines }
  }
  ctx.font = font(min)
  const lines = wrap(ctx, text, maxW)
  return { px: min, lines: lines.length > maxLines ? [...lines.slice(0, maxLines - 1), lines[maxLines - 1].replace(/\s+\S*$/, '') + '…'] : lines }
}
function lines(ctx: CanvasRenderingContext2D, ls: string[], x: number, y: number, lh: number) { ls.forEach((l, i) => ctx.fillText(l, x, y + i * lh)); return y + ls.length * lh }
function pill(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, bg: string, fg: string, px = 30) {
  ctx.font = `700 ${px}px ${SANS}`
  const w = ctx.measureText(text).width + px * 1.6, h = px * 1.9
  ctx.fillStyle = bg; round(ctx, cx - w / 2, y, w, h, h / 2); ctx.fill()
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, cx, y + h / 2 + 1)
  ctx.textBaseline = 'alphabetic'
  return y + h
}
function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
}
function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)) }
  ctx.closePath(); ctx.fill()
}
function contain(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, maxW: number, maxH: number) {
  const s = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight)
  const w = img.naturalWidth * s, h = img.naturalHeight * s
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h)
  return h
}

// ---------------------------------------------------------------- the picture
export function paint(ctx: CanvasRenderingContext2D, post: Post, format: Format, a: Assets, opts: { showName?: boolean } = {}) {
  const [W, H] = SIZE[format]
  const story = format === 'story'
  const k = story ? 1 : 0.86 // type scale for the square post
  const M = 96 // side margin
  ctx.clearRect(0, 0, W, H)
  // background: warm ivory to periwinkle, two soft petals of light
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#FBF9F4'); g.addColorStop(0.55, '#F1F2F8'); g.addColorStop(1, '#DCE2F5')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  const glow = (x: number, y: number, r: number, c: string) => { const rg = ctx.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, c); rg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H) }
  glow(W * 0.92, H * 0.12, W * 0.55, 'rgba(130,151,126,0.20)')
  glow(W * 0.05, H * 0.88, W * 0.6, 'rgba(94,127,184,0.20)')
  // logo
  const top = story ? 150 : 76
  if (a.logo) contain(ctx, a.logo, W / 2, top + 40 * k, 380 * k, 110 * k)
  else { ctx.fillStyle = INK; ctx.font = `800 ${64 * k}px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText('BeWise', W / 2, top + 60 * k) }

  ctx.textAlign = 'center'
  const maxW = W - M * 2
  const midTop = story ? (post.kind === 'flower' || post.kind === 'book' ? 400 : 520) : 210
  const footY = H - (story ? 150 : 74)
  let y = midTop

  switch (post.kind) {
    case 'review':
    case 'story': {
      y = pill(ctx, post.kind === 'review' ? 'Kind words' : 'A BeWise story', W / 2, y, 'rgba(94,127,184,0.14)', '#3E5C94', 30 * k) + (story ? 90 : 46)
      if (post.rating) { ctx.fillStyle = GOLD; for (let i = 0; i < 5; i++) star(ctx, W / 2 + (i - 2) * 74 * k, y, 28 * k); y += story ? 90 : 60 }
      ctx.fillStyle = 'rgba(94,127,184,0.35)'; ctx.font = `italic 500 ${260 * k}px ${SERIF}`; ctx.fillText('“', W / 2, y + 150 * k); y += story ? 110 : 76
      const t = fit(ctx, post.body, (px) => `italic 500 ${px}px ${SERIF}`, story ? 84 : 70, story ? 50 : 40, maxW, story ? 9 : 5)
      ctx.fillStyle = INK
      y = lines(ctx, t.lines, W / 2, y + t.px, t.px * 1.22) + (story ? 70 : 34)
      ctx.fillStyle = MUTED; ctx.font = `600 ${34 * k}px ${SANS}`
      ctx.fillText(`— ${opts.showName && post.authorFull ? post.authorFull : post.author ?? 'A member'}`, W / 2, y)
      if (a.owl && story) contain(ctx, a.owl, W / 2, footY - 300, 300, 300)
      break
    }
    case 'flower': {
      y = pill(ctx, 'Flower of the week', W / 2, y, 'rgba(130,151,126,0.18)', SAGE, 30 * k) + (story ? 40 : 18)
      const box = story ? 640 : 430
      if (a.flower) { contain(ctx, a.flower, W / 2, y + box / 2, box, box) }
      y += box + (story ? 70 : 30)
      ctx.fillStyle = INK; ctx.font = `800 ${(story ? 92 : 72)}px ${SANS}`; ctx.fillText(post.flower ?? '', W / 2, y); y += story ? 40 : 20
      ctx.fillStyle = MUTED
      const body = post.body.charAt(0).toUpperCase() + post.body.slice(1)
      const t = fit(ctx, body, (px) => `500 ${px}px ${SANS}`, story ? 46 : 38, 30, maxW - 40, 3)
      lines(ctx, t.lines, W / 2, y + t.px * 1.2, t.px * 1.35)
      break
    }
    case 'tip': {
      y = pill(ctx, 'A small practice', W / 2, y, 'rgba(184,155,100,0.18)', '#7A5E28', 30 * k) + (story ? 120 : 60)
      ctx.fillStyle = INK
      const tt = fit(ctx, post.title, (px) => `800 ${px}px ${SANS}`, story ? 104 : 84, 56, maxW, 2)
      y = lines(ctx, tt.lines, W / 2, y + tt.px, tt.px * 1.12) + (story ? 60 : 30)
      ctx.fillStyle = '#33406a'
      const t = fit(ctx, post.body, (px) => `500 ${px}px ${SANS}`, story ? 52 : 42, 32, maxW - 20, story ? 7 : 4)
      lines(ctx, t.lines, W / 2, y + t.px, t.px * 1.4)
      if (a.owl && story) contain(ctx, a.owl, W / 2, footY - 300, 300, 300)
      break
    }
    case 'book': {
      const r = story ? 220 : 130
      const cy = y + r + (story ? 20 : 0)
      if (a.photo) {
        ctx.save(); ctx.beginPath(); ctx.arc(W / 2, cy, r, 0, Math.PI * 2); ctx.closePath(); ctx.clip()
        const s = Math.max((r * 2) / a.photo.naturalWidth, (r * 2) / a.photo.naturalHeight)
        ctx.drawImage(a.photo, W / 2 - (a.photo.naturalWidth * s) / 2, cy - (a.photo.naturalHeight * s) / 2, a.photo.naturalWidth * s, a.photo.naturalHeight * s)
        ctx.restore()
        ctx.lineWidth = 12; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(W / 2, cy, r, 0, Math.PI * 2); ctx.stroke()
      }
      y = cy + r + (story ? 110 : 66)
      ctx.fillStyle = INK
      const tt = fit(ctx, post.title, (px) => `800 ${px}px ${SANS}`, story ? 92 : 70, 50, maxW, 2)
      y = lines(ctx, tt.lines, W / 2, y, tt.px * 1.12) + (story ? 30 : 10)
      ctx.fillStyle = '#33406a'
      const t = fit(ctx, post.body, (px) => `500 ${px}px ${SANS}`, story ? 46 : 36, 28, maxW - 40, 3)
      y = lines(ctx, t.lines, W / 2, y + t.px * 0.6, t.px * 1.4) + (story ? 60 : 24)
      pill(ctx, 'Ask for a session', W / 2, y, INK, '#fff', story ? 40 : 32)
      break
    }
    case 'impact': {
      y = pill(ctx, 'Thank you', W / 2, y, 'rgba(94,127,184,0.14)', '#3E5C94', 30 * k) + (story ? 120 : 60)
      ctx.fillStyle = INK
      const big = fit(ctx, post.stat ?? '', (px) => `800 ${px}px ${SANS}`, story ? 230 : 190, 100, maxW, 1)
      ctx.fillText(big.lines[0], W / 2, y + big.px * 0.75); y += big.px * 0.75 + (story ? 110 : 76)
      ctx.fillStyle = '#33406a'
      const t = fit(ctx, post.body, (px) => `500 ${px}px ${SANS}`, story ? 52 : 42, 30, maxW - 40, 3)
      lines(ctx, t.lines, W / 2, y, t.px * 1.4)
      if (a.owl && story) contain(ctx, a.owl, W / 2, footY - 300, 300, 300)
      break
    }
  }
  // footer
  ctx.fillStyle = PERI; ctx.fillRect(W / 2 - 40, footY - 70 * k, 80, 4)
  ctx.fillStyle = INK; ctx.font = `700 ${32 * k}px ${SANS}`; ctx.textAlign = 'center'
  ctx.fillText('bewiseglobal.in', W / 2, footY)
  ctx.fillStyle = MUTED; ctx.font = `500 ${26 * k}px ${SANS}`
  ctx.fillText('Jitendra Khimlani · Bach flower remedies · Vadodara', W / 2, footY + 44 * k)
}

// ---------------------------------------------------------------- export + share
export async function renderBlob(post: Post, format: Format, opts: { showName?: boolean } = {}): Promise<Blob> {
  const [W, H] = SIZE[format]
  const c = document.createElement('canvas'); c.width = W; c.height = H
  paint(c.getContext('2d')!, post, format, await loadAssets(post), opts)
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('no image'))), 'image/png'))
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a'); link.href = url; link.download = name
  document.body.appendChild(link); link.click(); link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
/** Native share sheet with the image + caption (phones); otherwise download the image and copy the caption. */
export async function sharePost(post: Post, format: Format, caption: string, opts: { showName?: boolean } = {}): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const blob = await renderBlob(post, format, opts)
  const file = new File([blob], `bewise-${post.kind}-${format}.png`, { type: 'image/png' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], text: caption }); return 'shared' } catch (e) { if ((e as Error).name === 'AbortError') return 'cancelled' }
  }
  download(blob, file.name)
  try { await navigator.clipboard.writeText(caption) } catch { /* clipboard blocked */ }
  return 'downloaded'
}
