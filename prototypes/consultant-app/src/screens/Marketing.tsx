/**
 * @screens CN-30 Marketing (owner 2026-11-25): everything that helps Jitu Bhaiya bring more people in and get bookings.
 *   - Do this today: smart nudges (not using the app, drifting, follow-up due, happy members for reviews, missed drops)
 *   - Share: a BeWise story, a review as a ready image, ready-made posts, broadcast to all, his booking link
 *   - Ready to post: images drawn in the browser, shared straight to WhatsApp / Instagram via the phone's share sheet
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { m } from 'motion/react'
import { BookOpen, Check, ChevronRight, Copy, Download, Image as ImageIcon, Link2, Megaphone, MessageCircle, Quote, Send, Share2, Smartphone, Sparkles, Star, UserRoundX, Users, Droplets, CalendarClock, Heart } from 'lucide-react'
import { useIndex, useStore, type NudgeKind } from '../state/store'
import { Avatar, Chip, Segmented, Sheet, softSpring, useToast } from '../ui/kit'
import { useSheets } from './Sheets'
import { BROADCAST_TEMPLATES, NUDGE_TEXT, audiences, broadcastAudiences, fill, readyPosts, type Format, type Post } from '../lib/marketing'
import { SIZE, download, loadAssets, paint, renderBlob, sharePost } from '../lib/canvasArt'
import { waLink } from '../lib/labels'
import { impact, LIFETIME_REACH } from '../lib/derive'
import { relative } from '../lib/time'
import { DAY } from '../data/seed'

const NUDGE_ICON: Record<NudgeKind, typeof Smartphone> = { app: Smartphone, drifting: UserRoundX, due: CalendarClock, review: Star, drops: Droplets }
const NUDGE_CTA: Record<NudgeKind, string> = { app: 'Invite to the app', drifting: 'Invite back', due: 'Remind to book', review: 'Ask for a review', drops: 'Send a reminder' }
const KIND_LABEL: Record<Post['kind'], string> = { review: 'Review', story: 'Story', flower: 'Flower of the week', tip: 'Wellness tip', book: 'Book a session', impact: 'Milestone' }

export default function Marketing() {
  const { s, now } = useStore()
  const { byPerson } = useIndex()
  const sheets = useSheets()
  const aud = useMemo(() => audiences(s.people, byPerson, s.mkt, now), [s.people, byPerson, s.mkt, now])
  const reached = LIFETIME_REACH + impact(s.appts, s.people, now).helped
  const posts = useMemo(() => readyPosts(s.appts, s.people, now, reached), [s.appts, s.people, now, reached])
  const [nudge, setNudge] = useState<NudgeKind | null>(null)
  const [post, setPost] = useState<{ id: string; format: Format } | null>(null)
  const [broadcast, setBroadcast] = useState(false)

  const week = now - 7 * DAY
  const sent = s.mkt.nudges.filter((n) => n.at > week).length
  const shared = s.mkt.shares.filter((n) => n.at > week).length
  const casts = s.mkt.broadcasts.filter((n) => n.at > week)
  const reachedByCast = casts.reduce((n, b) => n + b.count, 0)
  const booked = s.appts.filter((a) => a.assignedBy && a.start > week).length + s.requests.length

  const order: NudgeKind[] = ['app', 'due', 'drifting', 'review', 'drops']
  const todo = order.map((k) => aud[k]).filter((a) => a.people.length > 0)
  const review = posts.find((p) => p.kind === 'review')
  const story = posts.find((p) => p.kind === 'story')!

  return (
    <div className="screen marketing">
      <header className="mk-head">
        <h1>Grow BeWise</h1>
        <p className="muted">Small things, done often, bring people in. Everything here takes under a minute.</p>
      </header>

      <section className="card mk-week" aria-label="This week">
        <div><b>{shared}</b><span>posts shared</span></div>
        <div><b>{sent + reachedByCast}</b><span>people messaged</span></div>
        <div><b>{booked}</b><span>asked or booked</span></div>
        <p className="mk-week-tip"><Sparkles size={14} aria-hidden /> {shared === 0 ? 'Share one post today. Stories with a real member\'s words bring the most requests.' : sent === 0 ? 'Now send a nudge. People who hear from you are 3 times more likely to book.' : 'Lovely week. Keep one post a day going.'}</p>
      </section>

      <section className="block" aria-labelledby="mk-today">
        <div className="block-head"><h2 id="mk-today">Do this today</h2></div>
        {todo.length === 0 && <p className="muted small">All caught up. Everyone has heard from you this week.</p>}
        <ul className="mk-todo">
          {todo.map((a, i) => {
            const Icon = NUDGE_ICON[a.key]
            return (
              <m.li key={a.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: 0.04 * i }}>
                <button type="button" className={`mk-row mk-${a.key}`} onClick={() => setNudge(a.key)}>
                  <span className="mk-ic" aria-hidden><Icon size={18} /></span>
                  <span className="mk-row-main"><b>{a.label}<em>{a.people.length}</em></b><small>{a.why}</small></span>
                  <span className="mk-cta">{NUDGE_CTA[a.key]}<ChevronRight size={15} aria-hidden /></span>
                </button>
              </m.li>
            )
          })}
        </ul>
      </section>

      <section className="block" aria-labelledby="mk-share">
        <div className="block-head"><h2 id="mk-share">Share and post</h2></div>
        <div className="mk-tiles">
          <button type="button" className="mk-tile t-story" onClick={() => setPost({ id: story.id, format: 'story' })}><BookOpen size={22} aria-hidden /><b>Share a BeWise story</b><small>A member's words as a story image</small></button>
          {review && <button type="button" className="mk-tile t-review" onClick={() => setPost({ id: review.id, format: 'post' })}><Quote size={22} aria-hidden /><b>Share a review</b><small>5-star words, ready as an image</small></button>}
          <button type="button" className="mk-tile t-cast" onClick={() => setBroadcast(true)}><Megaphone size={22} aria-hidden /><b>Broadcast to all</b><small>One message to everyone, in the app and WhatsApp</small></button>
          <button type="button" className="mk-tile t-link" onClick={() => sheets.share()}><Link2 size={22} aria-hidden /><b>My booking link</b><small>Link and QR to share anywhere</small></button>
        </div>
      </section>

      <section className="block" aria-labelledby="mk-ready">
        <div className="block-head"><h2 id="mk-ready">Ready to post</h2><span className="muted small">{posts.length} this week</span></div>
        <ul className="mk-gallery no-swipe">
          {posts.map((p) => (
            <li key={p.id}>
              <button type="button" className="mk-thumb" onClick={() => setPost({ id: p.id, format: 'post' })} aria-label={`${KIND_LABEL[p.kind]}: ${p.title}. Open to share`}>
                <PostCanvas post={p} format="post" width={150} />
                <span className="mk-thumb-label"><ImageIcon size={12} aria-hidden /> {KIND_LABEL[p.kind]}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <Recent />

      <NudgeSheet kind={nudge} onClose={() => setNudge(null)} onKind={setNudge} aud={aud} />
      <PostSheet open={post} posts={posts} onClose={() => setPost(null)} onPick={(id) => setPost((x) => (x ? { ...x, id } : x))} onFormat={(f) => setPost((x) => (x ? { ...x, format: f } : x))} />
      <BroadcastSheet open={broadcast} onClose={() => setBroadcast(false)} />
    </div>
  )
}

// ---------------------------------------------------------------- a post drawn into a canvas at any display width
function PostCanvas({ post, format, width, showName }: { post: Post; format: Format; width: number; showName?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [W, H] = SIZE[format]
  const height = Math.round((width * H) / W)
  useEffect(() => {
    let live = true
    loadAssets(post).then((a) => {
      const c = ref.current
      if (!live || !c) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      c.width = Math.round(width * dpr); c.height = Math.round(height * dpr)
      const ctx = c.getContext('2d')!
      ctx.setTransform((width * dpr) / W, 0, 0, (width * dpr) / W, 0, 0)
      paint(ctx, post, format, a, { showName })
    })
    return () => { live = false }
  }, [post, format, width, height, W, showName])
  return <canvas ref={ref} className="post-canvas" style={{ width, height }} role="img" aria-label={`${post.title}: ${post.body}`} />
}

// ---------------------------------------------------------------- post: preview, caption, share / download
function PostSheet({ open, posts, onClose, onPick, onFormat }: { open: { id: string; format: Format } | null; posts: Post[]; onClose: () => void; onPick: (id: string) => void; onFormat: (f: Format) => void }) {
  const { dispatch } = useStore()
  const toast = useToast()
  const post = posts.find((p) => p.id === open?.id)
  const [caption, setCaption] = useState('')
  const [showName, setShowName] = useState(false)
  const [busy, setBusy] = useState(false)
  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 390))
  useEffect(() => { setCaption(post?.caption ?? ''); setShowName(false) }, [post?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const f = () => setVw(window.innerWidth); addEventListener('resize', f); return () => removeEventListener('resize', f) }, [])
  const format = open?.format ?? 'post'
  const width = format === 'story' ? Math.min(240, vw - 120) : Math.min(340, vw - 72)
  const share = async () => {
    if (!post) return
    setBusy(true)
    try {
      const r = await sharePost(post, format, caption, { showName })
      if (r !== 'cancelled') { dispatch({ type: 'shared', kind: post.kind, now: Date.now() }); toast(r === 'shared' ? 'Shared. Lovely.' : 'Image saved and caption copied. Paste it with the image.') }
    } finally { setBusy(false) }
  }
  const save = async () => { if (!post) return; download(await renderBlob(post, format, { showName }), `bewise-${post.kind}-${format}.png`); toast('Image saved') }
  const copy = async () => { try { await navigator.clipboard.writeText(caption); toast('Caption copied') } catch { toast('Select the caption and copy it') } }
  return (
    <Sheet open={!!post} onClose={onClose} label="Share a post">
      {post && (
        <div className="post-sheet">
          <h3 className="sheet-title">{KIND_LABEL[post.kind]}</h3>
          <ul className="ps-pick no-swipe" aria-label="Other posts">
            {posts.map((p) => <li key={p.id}><Chip active={p.id === post.id} onClick={() => onPick(p.id)}>{KIND_LABEL[p.kind]}{p.kind === 'review' ? ` ${posts.filter((x) => x.kind === 'review').indexOf(p) + 1}` : ''}</Chip></li>)}
          </ul>
          <Segmented id="fmt" value={format} onChange={onFormat} options={[{ value: 'post', label: 'Post (square)' }, { value: 'story', label: 'Story (tall)' }]} />
          <div className="ps-preview"><PostCanvas post={post} format={format} width={width} showName={showName} /></div>
          {post.kind === 'review' && (
            <label className="ps-toggle"><input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} /><span>Show the member's first name <small>Only after they say yes</small></span></label>
          )}
          <label className="field"><span>Caption</span>
            <textarea className="notes ps-caption" rows={4} value={caption} onChange={(e) => setCaption(e.target.value)} />
          </label>
          <button className="btn btn-primary btn-block" onClick={share} disabled={busy}><Share2 size={16} /> {busy ? 'Preparing…' : 'Share'}</button>
          <div className="btn-row">
            <button className="btn btn-quiet" onClick={save}><Download size={16} /> Save image</button>
            <button className="btn btn-quiet" onClick={copy}><Copy size={16} /> Copy caption</button>
          </div>
          <p className="muted small">Share opens WhatsApp, Instagram and the rest on your phone. On a computer the image is saved and the caption copied.</p>
        </div>
      )}
    </Sheet>
  )
}

// ---------------------------------------------------------------- nudges: pick who, check the words, send
function NudgeSheet({ kind, onClose, onKind, aud }: { kind: NudgeKind | null; onClose: () => void; onKind: (k: NudgeKind) => void; aud: ReturnType<typeof audiences> }) {
  const { dispatch } = useStore()
  const toast = useToast()
  const a = kind ? aud[kind] : null
  const [text, setText] = useState('')
  const [off, setOff] = useState<Set<string>>(new Set())
  useEffect(() => { if (kind) { setText(NUDGE_TEXT[kind]); setOff(new Set()) } }, [kind])
  const chosen = a ? a.people.filter((v) => !off.has(v.p.id)) : []
  const send = () => {
    if (!kind || !chosen.length) return
    dispatch({ type: 'nudge', personIds: chosen.map((v) => v.p.id), kind, now: Date.now() })
    toast(`Sent to ${chosen.length} ${chosen.length === 1 ? 'person' : 'people'} on WhatsApp and in the app`)
    onClose()
  }
  return (
    <Sheet open={!!kind} onClose={onClose} label="Send a nudge">
      {a && kind && (
        <div className="nudge-sheet">
          <h3 className="sheet-title">{a.label}</h3>
          <div className="chips-wrap tight no-swipe">
            {(Object.keys(aud) as NudgeKind[]).filter((k) => aud[k].people.length).map((k) => <Chip key={k} active={k === kind} onClick={() => onKind(k)} count={aud[k].people.length}>{aud[k].label}</Chip>)}
          </div>
          <p className="muted small">{a.why}. People you messaged in the last 7 days are left out.</p>
          <label className="field"><span>Message <small className="muted">({'{name}'} becomes each first name)</small></span>
            <textarea className="notes" rows={4} value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <div className="wa-bubble nudge-preview" aria-label="Preview">{fill(text, chosen[0]?.p.first ?? 'Priya')}</div>
          <div className="nudge-head"><b>{chosen.length} of {a.people.length} selected</b>
            <button className="link" onClick={() => setOff(off.size ? new Set() : new Set(a.people.map((v) => v.p.id)))}>{off.size ? 'Select all' : 'Clear'}</button></div>
          <ul className="nudge-list">
            {a.people.map((v) => {
              const on = !off.has(v.p.id)
              return (
                <li key={v.p.id}>
                  <label className="nudge-row">
                    <input type="checkbox" checked={on} onChange={() => setOff((x) => { const n = new Set(x); if (n.has(v.p.id)) n.delete(v.p.id); else n.add(v.p.id); return n })} />
                    <Avatar name={v.p.name} size={34} />
                    <span className="nr-main"><b>{v.p.name}</b><small>{kind === 'app' ? (v.p.app?.installed ? `Opened ${relative(v.p.app.lastOpen ?? 0, Date.now())}` : 'App not installed') : v.last ? `Last session ${relative(v.last.start, Date.now())}` : v.p.city}</small></span>
                  </label>
                  <a className="icon-btn sm" href={waLink(v.p.phone, fill(text, v.p.first))} target="_blank" rel="noreferrer" aria-label={`Send to ${v.p.first} from your WhatsApp`}><MessageCircle size={16} /></a>
                </li>
              )
            })}
          </ul>
          <button className="btn btn-primary btn-block nudge-send" disabled={!chosen.length || !text.trim()} onClick={send}><Send size={16} /> Send to {chosen.length} {chosen.length === 1 ? 'person' : 'people'}</button>
          <p className="muted small">Goes from the BeWise WhatsApp number and shows in their app. The green button on a row sends it from your own WhatsApp instead.</p>
        </div>
      )}
    </Sheet>
  )
}

// ---------------------------------------------------------------- broadcast to everyone (or a group)
function BroadcastSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { s, dispatch, now } = useStore()
  const { byPerson } = useIndex()
  const toast = useToast()
  const groups = useMemo(() => broadcastAudiences(s.people, byPerson, now), [s.people, byPerson, now])
  const [key, setKey] = useState('all')
  const [tpl, setTpl] = useState(BROADCAST_TEMPLATES[0].key)
  const [text, setText] = useState(BROADCAST_TEMPLATES[0].text)
  const [app, setApp] = useState(true)
  const [wa, setWa] = useState(true)
  const [confirm, setConfirm] = useState(false)
  useEffect(() => { if (open) setConfirm(false) }, [open])
  const g = groups.find((x) => x.key === key)!
  const channels = [...(app ? ['app' as const] : []), ...(wa ? ['whatsapp' as const] : [])]
  const send = () => {
    dispatch({ type: 'broadcast', id: `bc${Date.now()}`, audience: g.label, text, count: g.people.length, channels, now: Date.now() })
    toast(`Broadcast sent to ${g.people.length} people`)
    onClose()
  }
  return (
    <Sheet open={open} onClose={onClose} label="Broadcast">
      {open && (confirm ? (
        <div className="cast-confirm">
          <Megaphone size={34} aria-hidden />
          <h3 className="sheet-title">Send to {g.people.length} people?</h3>
          <p className="muted">{g.label}, {channels.map((c) => (c === 'app' ? 'in the BeWise app' : 'on WhatsApp')).join(' and ')}. This can't be unsent.</p>
          <div className="wa-bubble">{fill(text, g.people[0]?.p.first ?? 'Priya')}</div>
          <button className="btn btn-primary btn-block" onClick={send}><Send size={16} /> Yes, send now</button>
          <button className="btn btn-quiet btn-block" onClick={() => setConfirm(false)}>Back</button>
        </div>
      ) : (
        <div className="cast-sheet">
          <h3 className="sheet-title">Broadcast</h3>
          <div className="field"><span>To</span>
            <div className="chips-wrap tight no-swipe">{groups.map((x) => <Chip key={x.key} active={x.key === key} count={x.people.length} onClick={() => setKey(x.key)}>{x.label}</Chip>)}</div>
          </div>
          <div className="field"><span>Start from</span>
            <div className="chips-wrap tight no-swipe">{BROADCAST_TEMPLATES.map((t) => <Chip key={t.key} active={t.key === tpl} onClick={() => { setTpl(t.key); setText(t.text) }}>{t.label}</Chip>)}</div>
          </div>
          <label className="field"><span>Message <small className="muted">({'{name}'} becomes each first name)</small></span>
            <textarea className="notes" rows={5} value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <div className="field"><span>Send by</span>
            <div className="cast-ch">
              <label className={app ? 'on' : ''}><input type="checkbox" checked={app} onChange={(e) => setApp(e.target.checked)} /><Smartphone size={16} aria-hidden /> BeWise app</label>
              <label className={wa ? 'on' : ''}><input type="checkbox" checked={wa} onChange={(e) => setWa(e.target.checked)} /><MessageCircle size={16} aria-hidden /> WhatsApp</label>
            </div>
          </div>
          <button className="btn btn-primary btn-block" disabled={!text.trim() || !channels.length || !g.people.length} onClick={() => setConfirm(true)}><Users size={16} /> Review and send to {g.people.length}</button>
        </div>
      ))}
    </Sheet>
  )
}

// ---------------------------------------------------------------- what he sent recently
function Recent() {
  const { s, now } = useStore()
  const { person } = useIndex()
  type Item = { id: string; at: number; icon: typeof Send; text: string }
  const items: Item[] = []
  for (const b of s.mkt.broadcasts) items.push({ id: b.id, at: b.at, icon: Megaphone, text: `Broadcast to ${b.count} (${b.audience.toLowerCase()})` })
  const batches = new Map<string, { at: number; kind: NudgeKind; n: number; first?: string }>()
  for (const n of s.mkt.nudges) { const k = `${n.at}-${n.kind}`; const b = batches.get(k) ?? { at: n.at, kind: n.kind, n: 0, first: person.get(n.personId)?.first }; b.n++; batches.set(k, b) }
  for (const [k, b] of batches) items.push({ id: k, at: b.at, icon: Heart, text: `${NUDGE_CTA[b.kind]}: ${b.n === 1 ? b.first : `${b.n} people`}` })
  for (const x of s.mkt.shares) items.push({ id: x.id, at: x.at, icon: Share2, text: `Shared a ${KIND_LABEL[x.kind as Post['kind']]?.toLowerCase() ?? 'post'}` })
  items.sort((a, b) => b.at - a.at)
  if (!items.length) return null
  return (
    <section className="block" aria-labelledby="mk-recent">
      <div className="block-head"><h2 id="mk-recent">Recently sent</h2></div>
      <ul className="mk-recent">
        {items.slice(0, 8).map((x) => <li key={x.id}><span className="mk-ic sm" aria-hidden><x.icon size={14} /></span><span>{x.text}</span><small>{relative(x.at, now)}</small><Check size={14} className="mk-ok" aria-label="Sent" /></li>)}
      </ul>
    </section>
  )
}
