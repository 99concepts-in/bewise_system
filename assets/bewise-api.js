/**
 * @owner HUB · BeWise API client for every app (client, consultant, manager, owner). No dependencies.
 *
 *   <script src="/api/sdk/bewise-api.js"></script>          → window.BeWise
 *   import { api, call } from '<site>/api/sdk/bewise-api.js' (also works as an ES module via window.BeWise)
 *
 *   const { ok, data, error } = await BeWise.call('scheduling.listAppointments', { status: ['confirmed'] })
 *   const me = await BeWise.api.auth.me()           // throws BeWiseError on { ok:false }
 *
 * Function names = docs/03-CONTRACTS.md §5 (see api/sdk/README.md for the full list).
 * Session: HttpOnly cookie set by auth.verifyOtp / auth.login — same origin, nothing to store in the app.
 * Base URL: auto-detected ("/api" next to the app); override with window.BEWISE_API_BASE = 'https://domain/api'.
 */
(function (root) {
  'use strict'
  function detectBase() {
    if (root.BEWISE_API_BASE) return String(root.BEWISE_API_BASE).replace(/\/$/, '')
    try {
      var s = document.currentScript && document.currentScript.src
      if (s && s.indexOf('/sdk/bewise-api.js') > 0) return s.slice(0, s.indexOf('/sdk/bewise-api.js'))
    } catch (e) {}
    // apps live at /<app>/ (or /<base>/<app>/): the API is a sibling folder
    var p = location.pathname.replace(/\/(client|consultant|manager|owner)(\/.*)?$/, '')
    return p.replace(/\/$/, '') + '/api'
  }
  var BASE = null
  function base() { return BASE || (BASE = detectBase()) }

  function BeWiseError(code, message, status) {
    var e = new Error(message); e.name = 'BeWiseError'; e.code = code; e.status = status; return e
  }

  /** Low-level: never throws for API errors — returns { ok, data } | { ok:false, error:{ code, message } } */
  function call(fn, input) {
    return fetch(base() + '/v1/' + fn, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-BeWise': '1' },
      body: JSON.stringify(input || {}),
    }).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: { code: 'bad_response', message: 'The server sent an unexpected reply (' + r.status + ').' } } })
        .then(function (j) { j.status = r.status; if (r.status === 401) emit('signedout', j); return j })
    }, function () { return { ok: false, error: { code: 'offline', message: 'You seem to be offline. Please check your connection.' } } })
  }
  /** Throwing variant: resolves to data, rejects with BeWiseError. */
  function req(fn, input) {
    return call(fn, input).then(function (j) { if (j.ok) return j.data; throw BeWiseError(j.error.code, j.error.message, j.status) })
  }

  var listeners = {}
  function on(evt, cb) { (listeners[evt] = listeners[evt] || []).push(cb); return function () { listeners[evt] = listeners[evt].filter(function (x) { return x !== cb }) } }
  function emit(evt, payload) { (listeners[evt] || []).forEach(function (cb) { try { cb(payload) } catch (e) {} }) }

  /** Is the real backend reachable and installed? Apps use this to choose live mode vs. demo data. */
  function available() {
    return fetch(base() + '/v1/system.health', { credentials: 'include' })
      .then(function (r) { return r.ok ? r.json() : null }).then(function (j) { return !!(j && j.ok) }, function () { return false })
  }

  /** Opens Razorpay Checkout for an appointment / order. Resolves { paid:true } | { manual:true } | rejects. */
  function pay(purpose, refId) {
    return req('finance.createCheckout', { purpose: purpose, refId: refId }).then(function (c) {
      if (c.provider === 'manual') return { manual: true, amountPaise: c.amountPaise, upi: c.upi }
      return loadRazorpay().then(function () {
        return new Promise(function (resolve, reject) {
          var rz = new root.Razorpay({
            key: c.keyId, order_id: c.razorpayOrderId, amount: c.amountPaise, currency: 'INR', name: c.name, description: c.description, prefill: c.prefill,
            theme: { color: '#243D91' },
            handler: function (res) {
              req('finance.verifyCheckout', { razorpayOrderId: res.razorpay_order_id, razorpayPaymentId: res.razorpay_payment_id, signature: res.razorpay_signature })
                .then(function () { resolve({ paid: true }) }, reject)
            },
            modal: { ondismiss: function () { reject(BeWiseError('cancelled', 'Payment was cancelled.', 0)) } },
          })
          rz.on('payment.failed', function (r) { reject(BeWiseError('payment_failed', (r.error && r.error.description) || 'Payment failed.', 0)) })
          rz.open()
        })
      })
    })
  }
  function loadRazorpay() {
    if (root.Razorpay) return Promise.resolve()
    return new Promise(function (ok, bad) {
      var s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'
      s.onload = ok; s.onerror = function () { bad(BeWiseError('offline', 'Could not load the payment window.', 0)) }; document.head.appendChild(s)
    })
  }

  // api.<module>.<fn>(input) → Promise<data>
  var api = new Proxy({}, { get: function (_, mod) { return new Proxy({}, { get: function (_, fn) { return function (input) { return req(mod + '.' + fn, input) } } }) } })

  var BeWise = { call: call, req: req, api: api, on: on, pay: pay, available: available, base: base, setBase: function (b) { BASE = String(b).replace(/\/$/, '') }, version: '1.0.0' }
  root.BeWise = BeWise
  if (typeof module === 'object' && module.exports) module.exports = BeWise
})(typeof window !== 'undefined' ? window : globalThis)
