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

export type CardTheme = 'blush' | 'midnight' | 'garden'
export type CardShow = 'review' | 'tags' | 'both'
export const CARD_THEMES: { id: CardTheme; label: string; swatch: string }[] = [
  { id: 'blush', label: 'Blush', swatch: 'linear-gradient(135deg,#FFF3DF,#FDE3EC 50%,#E7E4FF)' },
  { id: 'midnight', label: 'Midnight', swatch: 'linear-gradient(135deg,#17214A,#2E3E8F)' },
  { id: 'garden', label: 'Garden', swatch: 'linear-gradient(135deg,#FBF6EC,#E8F1DF)' },
]

/**
 * Review card for members who gave 4 or 5 stars: their stars, their own words and/or the tags they picked, Jitendra Khimlani
 * and the app link. owner 2026-11-24: 3 themes; review only, tags only, or both; the words can be edited before sharing.
 */
export async function reviewCard(r: { rating: number; quote: string; name: string; tags?: string[]; theme?: CardTheme; show?: CardShow }, url: string) {
  await fonts()
  const theme = r.theme ?? 'blush'
  const dark = theme === 'midnight'
  const ink = dark ? '#FFFFFF' : '#17214A', soft = dark ? 'rgba(255,255,255,.78)' : '#5B6384'
  const [mark, jitu, rose, mimulus, chicory] = await Promise.all([
    img(`${BP}/img/${dark ? 'logo-mark-white' : 'logo-mark'}.png`), img(`${BP}/img/jitu-portrait.webp`),
    img(`${BP}/img/deco/rose.webp`), img(`${BP}/img/deco/mimulus.webp`), img(`${BP}/img/deco/chicory.webp`),
  ])
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, W, H)
  if (theme === 'blush') { g.addColorStop(0, '#FFF3DF'); g.addColorStop(0.45, '#FDE3EC'); g.addColorStop(0.8, '#E7E4FF'); g.addColorStop(1, '#DDF0F4') }
  else if (dark) { g.addColorStop(0, '#141C42'); g.addColorStop(0.6, '#24357F'); g.addColorStop(1, '#3B2F7A') }
  else { g.addColorStop(0, '#FBF6EC'); g.addColorStop(0.6, '#F4F1E4'); g.addColorStop(1, '#E6F0DC') }
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  const photo = (im: HTMLImageElement, x: number, y: number, w: number, rot: number, a = 1) => {
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate((rot * Math.PI) / 180); const h = (im.height / im.width) * w; ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore()
  }
  if (theme === 'blush') {
    const flower = (x: number, y: number, s: number, col: string, a: number) => {
      ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a; ctx.fillStyle = col
      for (let k = 0; k < 5; k++) { ctx.rotate((Math.PI * 2) / 5); ctx.beginPath(); ctx.ellipse(0, -s * 0.55, s * 0.36, s * 0.55, 0, 0, Math.PI * 2); ctx.fill() }
      ctx.globalAlpha = a * 1.4; ctx.fillStyle = '#F7C548'; ctx.beginPath(); ctx.arc(0, 0, s * 0.26, 0, Math.PI * 2); ctx.fill(); ctx.restore()
    }
    flower(960, 170, 190, '#F5A3B8', 0.35); flower(110, 1780, 170, '#9ED3C2', 0.32); flower(990, 1640, 110, '#B9A7F2', 0.32)
  } else if (dark) {
    photo(rose, 960, 150, 300, 18, 0.95); photo(chicory, 980, 1640, 200, -14, 0.8)
    for (let k = 0; k < 40; k++) { ctx.fillStyle = `rgba(255,236,170,${0.15 + ((k * 37) % 50) / 100})`; ctx.beginPath(); ctx.arc((k * 263) % W, (k * 541) % H, 2 + (k % 3), 0, Math.PI * 2); ctx.fill() }
  } else {
    photo(rose, 930, 170, 340, 16); photo(mimulus, 120, 1700, 300, -18); photo(chicory, 990, 1620, 220, 12)
  }
  brand(ctx, mark, 80, 110, ink)

  // stars
  ctx.textBaseline = 'alphabetic'
  for (let k = 0; k < 5; k++) {
    const cx = 120 + k * 104, on = k < r.rating
    ctx.save(); ctx.translate(cx, 420); ctx.beginPath()
    for (let p = 0; p < 10; p++) { const rad = p % 2 ? 19 : 44, a = (Math.PI / 5) * p - Math.PI / 2; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad) }
    ctx.closePath(); ctx.fillStyle = on ? '#F2B233' : dark ? 'rgba(255,255,255,.2)' : 'rgba(23,33,74,.15)'; ctx.fill(); ctx.restore()
  }

  // the card: their words, their tags, or both
  const tags = r.tags ?? []
  const show: CardShow = !tags.length ? 'review' : !r.quote.trim() ? 'tags' : (r.show ?? 'review')
  const cy = 520, ch = 820
  ctx.save(); ctx.shadowColor = dark ? 'rgba(0,0,0,.35)' : 'rgba(60,40,110,.16)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18
  ctx.beginPath(); ctx.roundRect(70, cy, W - 140, ch, 56); ctx.fillStyle = dark ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.92)'; ctx.fill(); ctx.restore()
  if (dark) { ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.roundRect(70, cy, W - 140, ch, 56); ctx.stroke() }
  const chips = (top: number, size: number) => {
    ctx.font = `600 ${size}px ${SANS}`
    let x = 150, y = top; const hgt = size * 2.1, maxX = W - 150
    for (const t of tags) {
      const w = ctx.measureText(t).width + size * 1.6 + 46
      if (x + w > maxX) { x = 150; y += hgt + 20 }
      pill(ctx, x, y, w, hgt, dark ? 'rgba(255,255,255,.16)' : theme === 'garden' ? '#E5F0DA' : '#FDE3EC')
      ctx.fillStyle = dark ? '#FFE7A3' : theme === 'garden' ? '#2F6B3A' : '#D9466C'; ctx.textBaseline = 'middle'
      ctx.fillText('✓', x + 24, y + hgt / 2 + 1)
      ctx.fillStyle = ink; ctx.fillText(t, x + 24 + size * 1.1, y + hgt / 2 + 1)
      ctx.textBaseline = 'alphabetic'
      x += w + 18
    }
    return y + hgt
  }
  if (show === 'tags') {
    const rows = Math.ceil(tags.length / 2), top = cy + 250 - Math.min(rows, 3) * 30
    ctx.fillStyle = ink; ctx.font = `600 68px ${DISPLAY}`; ctx.fillText('My session felt', 150, top)
    chips(top + 70, 46)
  } else {
    ctx.fillStyle = dark ? '#F7B8C8' : '#E5577A'; ctx.font = `600 190px ${DISPLAY}`; ctx.fillText('“', 120, cy + 190)
    ctx.font = `italic 500 58px ${DISPLAY}`
    const room = show === 'both' ? 4 : 7
    const ql = wrap(ctx, r.quote, W - 300, room)
    // keep short words centred in the card instead of hugging the top
    let y = cy + 250 + (show === 'both' ? Math.max(0, (4 - ql.length) * 48) : Math.max(0, (6 - ql.length) * 34))
    ctx.fillStyle = ink
    for (const l of ql) { ctx.fillText(l, 150, y); y += 78 }
    if (show === 'both') chips(y + 10, 34)
  }
  ctx.font = `700 36px ${SANS}`; ctx.fillStyle = soft
  ctx.fillText(`${r.name}, BeWise member`, 150, cy + ch - 70)

  // Jitendra Khimlani
  const py = 1420
  ctx.save(); ctx.beginPath(); ctx.arc(170, py + 90, 90, 0, Math.PI * 2); ctx.closePath(); ctx.clip()
  ctx.fillStyle = '#E6EDFF'; ctx.fillRect(80, py, 180, 180)
  cover(ctx, jitu, 80, py - 10, 180, 220); ctx.restore()
  ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(170, py + 90, 90, 0, Math.PI * 2); ctx.stroke()
  ctx.fillStyle = ink; ctx.font = `600 50px ${DISPLAY}`; ctx.fillText('Wellness session with', 300, py + 74)
  ctx.fillText('Jitendra Khimlani', 300, py + 134)
  ctx.font = `600 30px ${SANS}`; ctx.fillStyle = soft; ctx.fillText('Certified Bach Flower Remedy Therapist', 300, py + 184)

  const by = H - 230
  pill(ctx, 80, by, W - 160, 120, dark ? '#FFFFFF' : '#243D91')
  ctx.fillStyle = dark ? '#17214A' : '#fff'; ctx.font = `600 44px ${DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('Begin your journey on BeWise  →', W / 2, by + 62)
  ctx.font = `600 32px ${SANS}`; ctx.fillStyle = dark ? '#fff' : '#243D91'
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
