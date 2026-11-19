/* @owner HUB · bewiseglobal.in — shop, bag, booking, account. Talks to the BeWise API at app.bewiseglobal.in/api
 * (SDK assets/bewise-api.js, CORS allow-listed). Prices always come from the server at checkout (commerce.createOrder). */
(function () {
  'use strict'
  var $ = function (s, r) { return (r || document).querySelector(s) }
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)) }
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] }) }
  var inr = function (p) { return '₹' + (Math.round(p) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 }) }
  var api = window.BeWise
  var PRODUCTS = window.BW_PRODUCTS || []
  var IMG = function (art) { return 'assets/img/' + String(art || '').replace(/^products\//, 'products/') + '.webp' }

  function toast(t) { var el = $('#toast'); if (!el) return; el.textContent = t; el.classList.add('show'); clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('show') }, 2600) }
  function note(el, text, kind) { if (!el) return; el.className = 'note' + (kind ? ' ' + kind : ''); el.textContent = text || '' }

  // ── mobile menu ──
  var mb = $('.menu'); if (mb) mb.addEventListener('click', function () { $('.nav').classList.toggle('open') })

  // ── bag (localStorage, per device) ──
  var BAG_KEY = 'bw_bag_v1'
  function bag() { try { return JSON.parse(localStorage.getItem(BAG_KEY) || '[]') } catch (e) { return [] } }
  function saveBag(b) { try { localStorage.setItem(BAG_KEY, JSON.stringify(b)) } catch (e) {} ; bagCount() }
  function bagCount() { var n = bag().reduce(function (a, l) { return a + l.qty }, 0); $$('.bag b').forEach(function (b) { b.textContent = n ? n : '' }) }
  function addToBag(key, qty) { var b = bag(); var l = b.find(function (x) { return x.key === key }); if (l) l.qty = Math.min(20, l.qty + (qty || 1)); else b.push({ key: key, qty: qty || 1 }); saveBag(b); toast('Added to your bag') }
  function variant(key) { for (var i = 0; i < PRODUCTS.length; i++) { var p = PRODUCTS[i]; for (var j = 0; j < p.variants.length; j++) if (p.variants[j].id === key) return { p: p, v: p.variants[j] } } return null }
  bagCount()

  // refresh prices / sold-out from the live catalogue
  var live = api && api.req ? fetch(api.base() + '/v1/catalog.listProducts', { credentials: 'include' }).then(function (r) { return r.json() }).then(function (j) {
    if (j && j.ok && j.data.items.length) { PRODUCTS = j.data.items; return true } return false
  }).catch(function () { return false }) : Promise.resolve(false)

  // ── signed-in user ──
  var meP = api ? api.call('auth.me').then(function (j) { return j.ok ? j.data : null }) : Promise.resolve(null)
  meP.then(function (me) { $$('[data-account-label]').forEach(function (a) { a.textContent = me ? 'My account' : 'Sign in' }) })

  // ── sign-in widget (used on account, cart, booking) ──
  function signIn(box, onDone) {
    box.innerHTML = '<div class="tabs"><button class="on" data-t="code">Email code</button><button data-t="pass">Username &amp; password</button></div>' +
      '<div data-p="code"><label>Email</label><input type="email" name="email" autocomplete="email" placeholder="you@example.com">' +
      '<div data-step2 hidden><label>6-digit code</label><input name="code" inputmode="numeric" maxlength="6" placeholder="••••••"></div>' +
      '<button class="btn block" data-go style="margin-top:14px">Send code</button></div>' +
      '<div data-p="pass" hidden><label>Email or username</label><input name="login" autocomplete="username"><label>Password</label><input type="password" name="password" autocomplete="current-password">' +
      '<button class="btn block" data-login style="margin-top:14px">Sign in</button></div><div class="note" data-msg style="margin-top:12px"></div>'
    var msg = $('[data-msg]', box)
    $$('.tabs button', box).forEach(function (t) { t.onclick = function () { $$('.tabs button', box).forEach(function (x) { x.classList.toggle('on', x === t) }); $$('[data-p]', box).forEach(function (p) { p.hidden = p.getAttribute('data-p') !== t.getAttribute('data-t') }); note(msg, '') } })
    var sent = false
    $('[data-go]', box).onclick = function () {
      var email = $('[name=email]', box).value.trim(), btn = this
      btn.disabled = true
      if (!sent) {
        api.call('auth.requestOtp', { email: email }).then(function (j) {
          btn.disabled = false
          if (!j.ok) return note(msg, j.error.message, 'err')
          sent = true; $('[data-step2]', box).hidden = false; btn.textContent = 'Sign in'; note(msg, 'We emailed a 6-digit code to ' + email + '. It works for 10 minutes.', 'ok'); $('[name=code]', box).focus()
        })
      } else {
        api.call('auth.verifyOtp', { email: email, code: $('[name=code]', box).value.trim() }).then(function (j) {
          btn.disabled = false
          if (!j.ok) return note(msg, j.error.message, 'err')
          onDone(j.data)
        })
      }
    }
    $('[data-login]', box).onclick = function () {
      var btn = this; btn.disabled = true
      api.call('auth.login', { login: $('[name=login]', box).value.trim(), password: $('[name=password]', box).value }).then(function (j) {
        btn.disabled = false
        if (!j.ok) return note(msg, j.error.message, 'err')
        onDone(j.data)
      })
    }
  }

  function payFlow(purpose, id, msgEl, done) {
    note(msgEl, 'Opening secure payment…')
    return api.pay(purpose, id).then(function (r) {
      if (r.paid) { note(msgEl, 'Payment received — thank you! A confirmation is on its way to your email.', 'ok'); done && done(true) }
      else { note(msgEl, 'Saved. Online payment is being set up — please pay at the studio or by UPI and we\'ll confirm (WhatsApp +91 90542 20952).', 'ok'); done && done(false) }
    }).catch(function (e) { note(msgEl, e.message || 'Payment did not go through. You can try again from My account.', 'err') })
  }

  // ── product card / detail ──
  function card(p) {
    var v = p.variants[0] || { pricePaise: 0, label: '' }
    var personal = !!p.personal
    return '<a class="prod" href="#' + esc(p.slug) + '" data-slug="' + esc(p.slug) + '"><div class="art" style="background:linear-gradient(160deg,' + esc((p.tint || ['#eef1fb', '#f6f3ec'])[0]) + ',' + esc((p.tint || ['#eef1fb', '#f6f3ec'])[1]) + ')">' +
      '<img loading="lazy" src="' + IMG(p.art) + '" alt="' + esc(p.name + ' ' + p.format) + '"></div><div class="body"><span class="fmt">' + esc(p.format) + ' · ' + esc(v.label) + '</span><h3>' + esc(p.name) + '</h3><p>' + esc(p.tagline) + '</p>' +
      '<div class="row"><b>' + inr(v.pricePaise) + '</b>' + (p.soldOut ? '<span class="tag">Sold out</span>' : personal ? '<span class="tag" style="background:#e5efe2;color:#3d6b48">After consultation</span>' : '<span class="btn sm">View</span>') + '</div></div></a>'
  }
  function detail(p) {
    var v = p.variants[0]
    var buy = p.soldOut ? '<p class="tag">Sold out — back soon</p>'
      : p.personal ? '<div class="note">Your personal blend is prepared by Jitu Bhaiya after a consultation — the first bottle is included in the consultation fee. Reorders are ' + inr(v.pricePaise) + ' from <a href="account.html">My account</a> or the BeWise app.</div><div class="actions"><a class="btn" href="consultations.html">Book a consultation</a></div>'
      : '<div class="actions"><button class="btn" data-add="' + esc(v.id) + '">Add to bag · ' + inr(v.pricePaise) + '</button><a class="btn ghost" href="cart.html">View bag</a></div>'
    return '<div class="pd"><div class="art" style="background:linear-gradient(160deg,' + esc((p.tint || ['#eef1fb'])[0]) + ',' + esc((p.tint || ['#eef1fb', '#f6f3ec'])[1]) + ')"><img src="' + IMG(p.art) + '" alt=""></div><div>' +
      '<span class="fmt muted small" style="font-weight:700;text-transform:uppercase;letter-spacing:.05em">' + esc(p.format) + ' · ' + esc(v.label) + '</span><h2 style="margin-top:6px">' + esc(p.name) + '</h2><p class="lead" style="font-size:17px">' + esc(p.about || p.tagline) + '</p>' +
      '<div class="price">' + inr(v.pricePaise) + ' <small>incl. taxes</small></div>' + buy +
      (p.feel && p.feel.length ? '<p class="small muted" style="margin-top:16px">Helps you feel: ' + p.feel.map(esc).join(' · ') + '</p>' : '') +
      '<details open><summary>How to use</summary><p>' + esc(p.howTo) + '</p></details><details><summary>Ingredients</summary><p>' + esc(p.ingredients) + '</p></details><details><summary>Safety</summary><p>' + esc(p.safety) + '</p></details></div></div>'
  }

  // ── SHOP ──
  var shop = $('#shop')
  if (shop) {
    var cats = [['all', 'All'], ['rollons', 'Roll-ons'], ['sprays', 'Aura sprays'], ['bath', 'Bath salts'], ['remedies', 'Bach remedies'], ['care', 'Care']]
    var cur = 'all'
    var chips = $('#chips'); chips.innerHTML = cats.map(function (c) { return '<button class="chip' + (c[0] === 'all' ? ' on' : '') + '" data-c="' + c[0] + '">' + c[1] + '</button>' }).join('')
    var render = function () { shop.innerHTML = PRODUCTS.filter(function (p) { return cur === 'all' || p.category === cur }).map(card).join('') }
    chips.onclick = function (e) { var b = e.target.closest('[data-c]'); if (!b) return; cur = b.getAttribute('data-c'); $$('.chip', chips).forEach(function (x) { x.classList.toggle('on', x === b) }); render() }
    var modal = $('#pmodal')
    var open = function (slug) { var p = PRODUCTS.find(function (x) { return x.slug === slug }); if (!p) return; $('.sheet-body', modal).innerHTML = detail(p); modal.classList.add('open') }
    var close = function () { modal.classList.remove('open'); if (location.hash) history.replaceState(null, '', location.pathname) }
    shop.onclick = function (e) { var a = e.target.closest('[data-slug]'); if (!a) return; e.preventDefault(); history.replaceState(null, '', '#' + a.getAttribute('data-slug')); open(a.getAttribute('data-slug')) }
    modal.onclick = function (e) { if (e.target === modal || e.target.closest('.x')) close(); var add = e.target.closest('[data-add]'); if (add) addToBag(add.getAttribute('data-add'), 1) }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close() })
    render(); if (location.hash) open(location.hash.slice(1))
    live.then(function (ok) { if (ok) { render() } })
  }
  // home featured
  var feat = $('#featured')
  if (feat) {
    var pick = ['sleep-roll-on', 'abundance-roll-on', 'protection-spray', 'rescue-remedy', 'aura-bath-salt', 'migraine-go-roll-on', 'sleep-spray', 'hair-oil']
    var rf = function () { feat.innerHTML = pick.map(function (s) { return PRODUCTS.find(function (p) { return p.slug === s }) }).filter(Boolean).slice(0, 4).map(function (p) { return card(p).replace('href="#', 'href="shop.html#') }).join('') }
    rf(); live.then(function (ok) { if (ok) rf() })
  }

  // ── BAG / CHECKOUT ──
  var cartEl = $('#cart')
  if (cartEl) {
    var drawCart = function () {
      var b = bag().filter(function (l) { return variant(l.key) })
      if (!b.length) { cartEl.innerHTML = '<div class="center" style="padding:30px 0"><h3>Your bag is empty</h3><p class="muted">Explore roll-ons, aura sprays and bath salts.</p><a class="btn" href="shop.html">Go to shop</a></div>'; $('#checkout').hidden = true; return }
      $('#checkout').hidden = false
      var sub = 0
      cartEl.innerHTML = b.map(function (l) { var x = variant(l.key); sub += x.v.pricePaise * l.qty
        return '<div class="line"><img src="' + IMG(x.p.art) + '" alt="" style="background:' + esc((x.p.tint || ['#eef1fb'])[0]) + '"><div class="grow"><b>' + esc(x.p.name) + '</b> <span class="muted small">' + esc(x.p.format) + ' · ' + esc(x.v.label) + '</span><br><span class="small">' + inr(x.v.pricePaise) + '</span></div>' +
          '<div class="qty"><button data-dec="' + esc(l.key) + '" aria-label="less">−</button><span>' + l.qty + '</span><button data-inc="' + esc(l.key) + '" aria-label="more">+</button></div></div>' }).join('') +
        '<div style="padding-top:12px"><div class="sum"><span>Subtotal</span><b>' + inr(sub) + '</b></div><div class="sum"><span>Delivery</span><span data-ship>Free</span></div><div class="sum total"><span>Total</span><span>' + inr(sub) + '</span></div><p class="small muted">Prices include taxes. Final amount is confirmed on the payment screen.</p></div>'
    }
    cartEl.onclick = function (e) {
      var inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]'); if (!inc && !dec) return
      var k = (inc || dec).getAttribute(inc ? 'data-inc' : 'data-dec'), b = bag(), l = b.find(function (x) { return x.key === k })
      if (!l) return; l.qty += inc ? 1 : -1; saveBag(b.filter(function (x) { return x.qty > 0 })); drawCart()
    }
    drawCart(); live.then(function (ok) { if (ok) drawCart() })
    var deliv = 'ship'
    $$('#deliv button').forEach(function (bt) { bt.onclick = function () { deliv = bt.getAttribute('data-d'); $$('#deliv button').forEach(function (x) { x.classList.toggle('on', x === bt) }); $('#addr').hidden = deliv !== 'ship' } })
    var msgC = $('#cmsg')
    var showCheckout = function (me) {
      $('#who').innerHTML = me ? '<p class="small muted">Signed in as <b>' + esc(me.email || me.name) + '</b></p>' : ''
      $('#signin').hidden = !!me; $('#placeBox').hidden = !me
      if (!me) signIn($('#signin'), function (u) { showCheckout(u) })
    }
    meP.then(showCheckout)
    $('#place').onclick = function () {
      var btn = this, lines = bag().filter(function (l) { return variant(l.key) }).map(function (l) { return { key: l.key, qty: l.qty } })
      if (!lines.length) return
      btn.disabled = true; note(msgC, 'Placing your order…')
      var addrP = deliv === 'pickup' ? Promise.resolve(null) : api.call('crm.upsertAddress', {
        name: $('[name=a_name]').value, phone: $('[name=a_phone]').value, line1: $('[name=a_line1]').value, line2: $('[name=a_line2]').value,
        city: $('[name=a_city]').value, state: $('[name=a_state]').value, pin: $('[name=a_pin]').value, isDefault: true }).then(function (j) { if (!j.ok) throw new Error(j.error.message); return j.data.id })
      addrP.then(function (addressId) {
        return api.call('commerce.createOrder', deliv === 'pickup' ? { lines: lines, pickup: true } : { lines: lines, addressId: addressId })
      }).then(function (j) {
        if (!j.ok) throw new Error(j.error.message)
        saveBag([]); drawCart(); $('#checkout').hidden = false
        note(msgC, 'Order ' + j.data.code + ' · ' + inr(j.data.totalPaise))
        return payFlow('sales_order', j.data.id, msgC, function () { btn.hidden = true })
      }).catch(function (e) { note(msgC, e.message, 'err') }).then(function () { btn.disabled = false })
    }
  }

  // ── BOOKING ──
  var bookEl = $('#book')
  if (bookEl) {
    var st = { type: 'first', mode: 'online', day: null, slot: null, days: [] }
    var types = { first: 100000, followup: 80000 }
    if (api) api.call('scheduling.listConsultationTypes').then(function (j) { if (j.ok) j.data.forEach(function (t) { types[t.id] = t.feePaise; var el = $('[data-fee="' + t.id + '"]'); if (el) el.textContent = inr(t.feePaise) }) })
    var msgB = $('#bmsg')
    var setOpt = function (group, val) { $$('[data-' + group + ']').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-' + group) === val) }) }
    $$('[data-type]').forEach(function (b) { b.onclick = function () { st.type = b.getAttribute('data-type'); setOpt('type', st.type); loadSlots() } })
    $$('[data-mode]').forEach(function (b) { b.onclick = function () { st.mode = b.getAttribute('data-mode'); setOpt('mode', st.mode); loadSlots() } })
    if (/followup/.test(location.hash)) { st.type = 'followup'; setOpt('type', 'followup') }
    var wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    var drawDays = function () {
      $('#days').innerHTML = st.days.map(function (d) { var dt = new Date(d.date + 'T00:00:00'); return '<button data-day="' + d.date + '"' + (d.slots.length ? '' : ' disabled') + (st.day === d.date ? ' class="on"' : '') + '><span>' + wd[dt.getDay()] + '</span><b>' + dt.getDate() + '</b><span>' + dt.toLocaleString('en-IN', { month: 'short' }) + '</span></button>' }).join('')
      var d = st.days.find(function (x) { return x.date === st.day })
      $('#times').innerHTML = d ? d.slots.map(function (s) { var hm = s.slice(11, 16).split(':'), h = +hm[0]; return '<button data-slot="' + s + '"' + (st.slot === s ? ' class="on"' : '') + '>' + ((h % 12) || 12) + ':' + hm[1] + (h < 12 ? ' am' : ' pm') + '</button>' }).join('') : ''
      $('#confirm').disabled = !st.slot
    }
    $('#days').onclick = function (e) { var b = e.target.closest('[data-day]'); if (!b || b.disabled) return; st.day = b.getAttribute('data-day'); st.slot = null; drawDays() }
    $('#times').onclick = function (e) { var b = e.target.closest('[data-slot]'); if (!b) return; st.slot = b.getAttribute('data-slot'); drawDays() }
    var loadSlots = function () {
      st.slot = null; note(msgB, 'Loading open times…')
      var from = new Date(), to = new Date(Date.now() + 21 * 864e5), f = function (d) { return d.toISOString().slice(0, 10) }
      api.call('scheduling.getAvailableSlots', { consultationTypeId: st.type, mode: st.mode, from: f(from), to: f(to) }).then(function (j) {
        if (!j.ok) { st.days = []; drawDays(); return note(msgB, j.error.code === 'no_consultant' ? 'Online booking opens shortly. Please WhatsApp +91 90542 20952 to book.' : j.error.message, 'err') }
        st.days = j.data.days; var first = st.days.find(function (d) { return d.slots.length }); st.day = first ? first.date : null
        note(msgB, first ? '' : 'No open times in the next 3 weeks — please WhatsApp us and we\'ll find one.'); drawDays()
      })
    }
    loadSlots()
    var showWho = function (me) {
      $('#bsignin').hidden = !!me; $('#bwho').innerHTML = me ? '<p class="small muted">Booking as <b>' + esc(me.email || me.name) + '</b></p>' : ''
      if (!me) signIn($('#bsignin'), showWho)
    }
    meP.then(showWho)
    $('#confirm').onclick = function () {
      var btn = this
      meP.then(function () { return api.call('auth.me') }).then(function (j) {
        if (!j.ok || !j.data) { note(msgB, 'Please sign in first (below).', 'err'); return }
        btn.disabled = true; note(msgB, 'Holding your time…')
        api.call('scheduling.holdAppointment', { consultationTypeId: st.type, mode: st.mode, startsAt: st.slot, clientNote: $('#bnote').value.trim() || undefined }).then(function (h) {
          btn.disabled = false
          if (!h.ok) { note(msgB, h.error.message, 'err'); if (h.status === 409) loadSlots(); return }
          payFlow('appointment', h.data.id, msgB, function (paid) { if (paid) btn.hidden = true })
        })
      })
    }
  }

  // ── ACCOUNT ──
  var acc = $('#account')
  if (acc) {
    var draw = function (me) {
      if (!me) { $('#acc-in').hidden = true; $('#acc-out').hidden = false; signIn($('#acc-signin'), draw); return }
      $('#acc-out').hidden = true; $('#acc-in').hidden = false
      $('#acc-name').textContent = me.name || me.email || 'Welcome'
      $('#acc-mail').textContent = me.email || ''
      if (me.roles.indexOf('client') < 0) { $('#acc-appts').innerHTML = '<p class="muted">This is a team account — open your app at <a href="https://app.bewiseglobal.in/">app.bewiseglobal.in</a>.</p>'; $('#acc-orders').innerHTML = ''; return }
      api.call('scheduling.listAppointments', { order: 'desc' }).then(function (j) {
        var items = j.ok ? j.data.items.filter(function (a) { return a.status !== 'expired' }) : []
        $('#acc-appts').innerHTML = items.length ? items.map(function (a) {
          var when = a.startsAt ? new Date(a.startsAt).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : 'Time to be confirmed'
          var unpaid = a.paymentStatus === 'unpaid' && ['pending_payment', 'confirmed'].indexOf(a.status) >= 0
          return '<div class="item"><div><b>' + (a.type === 'first' ? 'First consultation' : 'Follow-up') + '</b> <span class="muted small">· ' + (a.mode === 'online' ? 'Online' : 'At the studio') + ' · ' + esc(a.code) + '</span><br><span class="small">' + when + '</span></div>' +
            '<div style="display:flex;gap:8px;align-items:center"><span class="badge ' + (a.status === 'confirmed' || a.status === 'completed' ? 'ok' : 'warn') + '">' + esc(a.status.replace('_', ' ')) + '</span>' + (unpaid ? '<button class="btn sm" data-pay="appointment" data-id="' + a.id + '">Pay ' + inr(a.amountPaise) + '</button>' : '') + '</div></div>' }).join('') : '<p class="muted">No consultations yet. <a href="consultations.html">Book one</a>.</p>'
      })
      api.call('commerce.listOrders').then(function (j) {
        var items = j.ok ? j.data.items : []
        $('#acc-orders').innerHTML = items.length ? items.map(function (o) {
          return '<div class="item"><div><b>' + esc(o.code) + '</b> <span class="muted small">· ' + new Date(o.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + '</span><br><span class="small">' + o.lines.map(function (l) { return esc(l.name) + ' ×' + l.qty }).join(', ') + '</span></div>' +
            '<div style="display:flex;gap:8px;align-items:center"><b>' + inr(o.totalPaise) + '</b><span class="badge ' + (o.status === 'pending_payment' ? 'warn' : 'ok') + '">' + esc(o.status.replace('_', ' ')) + '</span>' + (o.status === 'pending_payment' ? '<button class="btn sm" data-pay="sales_order" data-id="' + o.id + '">Pay</button>' : '') + '</div></div>' }).join('') : '<p class="muted">No orders yet. <a href="shop.html">Visit the shop</a>.</p>'
      })
    }
    acc.onclick = function (e) {
      var b = e.target.closest('[data-pay]'); if (b) payFlow(b.getAttribute('data-pay'), b.getAttribute('data-id'), $('#accmsg'), function () { meP = api.call('auth.me').then(function (j) { return j.data }); meP.then(draw) })
      if (e.target.closest('#signout')) api.call('auth.logout').then(function () { location.reload() })
    }
    meP.then(draw)
  }

  // contact form → WhatsApp (no server mail needed)
  var cf = $('#contactForm')
  if (cf) cf.onsubmit = function (e) { e.preventDefault(); var t = 'Hello BeWise, I am ' + cf.name.value + ' (' + cf.phone.value + '). ' + cf.msg.value; window.open('https://wa.me/919054220952?text=' + encodeURIComponent(t), '_blank') }
})()
