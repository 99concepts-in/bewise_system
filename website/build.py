#!/usr/bin/env python3
"""@owner HUB · Builds bewiseglobal.in (public website, Razorpay-ready) → dist/website/

Usage (repo root):  python3 website/build.py
Content that must match the business's Razorpay / KYC details lives in BUSINESS below — edit it there only.
"""
import html, json, os, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'website'
OUT = ROOT / 'dist' / 'website'
API = os.environ.get('BW_API_BASE', 'https://app.bewiseglobal.in/api')

# ⚠️ Must match what you give Razorpay (business name, address, contact). Owner to confirm legal name & email.
BUSINESS = {
    'brand': 'BeWise Holistic Wellness',
    'legal': 'BeWise Holistic Wellness',          # legal / registered business name as on PAN / GST / bank account
    'owner': 'Jitendra Khimlani',
    'address': '102, Yogikrupa Apartment, 19/A, Nutan Bharat Society, Alkapuri, Vadodara, Gujarat 390007, India',
    'city': 'Vadodara, Gujarat',
    'phone': '+91 90542 20952', 'phone_raw': '+919054220952', 'whatsapp': '919054220952',
    'email': 'care@bewiseglobal.in',
    'hours': 'Monday to Saturday, 10:00 am – 1:00 pm and 4:00 pm – 7:00 pm (IST)',
    'gstin': '',                                    # add when available — shown in the footer
    'domain': 'bewiseglobal.in',
    'updated': '19 November 2026',
    'maps': 'https://www.google.com/maps/search/?api=1&query=Be+Wise+Holistic+Wellness+Alkapuri+Vadodara',
}
E = html.escape
B = {k: E(v) for k, v in BUSINESS.items()}

products = json.loads((ROOT / 'api/seed/products.json').read_text())
PUBLIC = [{'slug': p['slug'], 'name': p['name'], 'tagline': p['tagline'], 'category': p['category'], 'format': p['format'], 'soldOut': p['sold_out'],
           **{k: p['data'].get(k) for k in ('about', 'feel', 'ingredients', 'howTo', 'safety', 'art', 'tint', 'personal', 'intents')},
           'variants': [{'id': v['id'], 'label': v['label'], 'pricePaise': v['price_paise']} for v in p['variants']]} for p in products]
inr = lambda paise: '₹' + f"{paise / 100:,.0f}"

NAV = [('index.html', 'Home'), ('consultations.html', 'Consultations'), ('shop.html', 'Shop'), ('about.html', 'About'), ('contact.html', 'Contact')]
WA_SVG = '<svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.6 11.6 0 0 0 4.4 3.9c1.6.7 2.3.8 3.1.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3Z"/></svg>'
BAG_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 7h12l1 13H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>'


def page(fname, title, desc, body, scripts=True):
    nav = ''.join(f'<a href="{h}"{" class=on" if h == fname else ""}>{t}</a>' for h, t in NAV)
    nav += '<a href="account.html" data-account-label>Sign in</a>'
    gst = f' · GSTIN {B["gstin"]}' if BUSINESS['gstin'] else ''
    js = (f'<script>window.BEWISE_API_BASE={json.dumps(API)}</script><script src="assets/bewise-api.js"></script>'
          f'<script src="assets/products.js"></script><script src="assets/site.js"></script>') if scripts else ''
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{E(title)} · {B["brand"]}</title><meta name="description" content="{E(desc)}">
<meta property="og:title" content="{E(title)} · {B["brand"]}"><meta property="og:description" content="{E(desc)}"><meta property="og:image" content="https://{B["domain"]}/assets/img/og.jpg">
<link rel="icon" href="assets/img/brand/bewise-mark.svg" type="image/svg+xml"><link rel="alternate icon" href="assets/img/logo-mark.png"><link rel="canonical" href="https://{B["domain"]}/{'' if fname == 'index.html' else fname}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/site.css"></head><body>
<header class="top"><div class="wrap"><a class="brand" href="index.html" aria-label="BeWise Holistic Wellness — home"><img src="assets/img/brand/bewise-logo-horizontal.svg" alt="BeWise Holistic Wellness" class="logo"></a>
<nav class="nav">{nav}</nav><button class="menu" aria-label="Menu">☰</button><a class="bag" href="cart.html" aria-label="Bag">{BAG_SVG}<b></b></a></div></header>
<main>{body}</main>
<footer><div class="wrap">
<div><a class="brand" href="index.html" aria-label="BeWise Holistic Wellness — home"><img src="assets/img/brand/bewise-logo-horizontal-white.svg" alt="BeWise Holistic Wellness" class="logo"></a>
<p style="margin-top:14px">Bach flower consultations with Jitendra Khimlani and natural aromatherapy blends, made in Vadodara.</p>
<p>{B["address"]}<br><a href="tel:{B["phone_raw"]}" style="display:inline">{B["phone"]}</a> · <a href="mailto:{B["email"]}" style="display:inline">{B["email"]}</a></p></div>
<div><h4>Explore</h4><a href="consultations.html">Consultations</a><a href="shop.html">Shop</a><a href="pricing.html">Pricing</a><a href="about.html">About Jitendra Khimlani</a><a href="https://app.bewiseglobal.in/client/">BeWise app</a></div>
<div><h4>Help</h4><a href="contact.html">Contact us</a><a href="account.html">My account</a><a href="shipping-policy.html">Shipping &amp; delivery</a><a href="refund-policy.html">Cancellation &amp; refunds</a></div>
<div><h4>Legal</h4><a href="terms-and-conditions.html">Terms &amp; conditions</a><a href="privacy-policy.html">Privacy policy</a><a href="refund-policy.html">Refund policy</a><a href="https://www.instagram.com/bewiseglobal" rel="noopener">Instagram</a><a href="https://www.facebook.com/bewiseglobal" rel="noopener">Facebook</a></div>
<div class="legalline">© 2026 {B["legal"]}{gst}. Payments are processed securely by Razorpay. Bach flower remedies and aromatherapy are complementary wellness practices — they do not diagnose, treat or cure any disease and do not replace your doctor’s care.</div>
</div></footer>
<a class="wa" href="https://wa.me/{B["whatsapp"]}" aria-label="Chat on WhatsApp" rel="noopener">{WA_SVG}</a><div class="toast" id="toast"></div>
{js}</body></html>
'''


T = {'first': 100000, 'followup': 80000}
TESTIMONIALS = [
    ('Akshay Magnani', 'His bach flower remedy, aroma therapy and consultation on important decisions of my life has literally helped me change my life. He has amazing intuitive skills.'),
    ('Divya Solanki', 'His bach flower and aroma therapy work like magic; drastic changes in my thoughts, goals and nature; in short, I received a life upgrade.'),
    ('Khushboo Gurnani', 'Jitendra Khimlani has the best Bach flower & aroma oils therapy. I’ve benefited drastically mentally. It gave me a sense of calm and sound sleep after I took the treatment.'),
]
quotes = ''.join(f'<div class="card"><p class="quote">{E(q)}</p><p class="small"><b>{E(n)}</b></p></div>' for n, q in TESTIMONIALS)

consult_cards = f'''<div class="grid g2">
<div class="card"><span class="eyebrow" style="box-shadow:none;background:var(--peri)">60 minutes · Online or at the studio</span><h3>First consultation</h3>
<div class="price"><span data-fee="first">{inr(T["first"])}</span> <small>incl. taxes</small></div>
<ul class="ticks"><li>An unhurried conversation about how you’ve been feeling</li><li>Your personalised Bach flower blend (30 ml) — <b>included</b></li><li>How to take it, and what to notice</li></ul>
<div class="actions"><a class="btn" href="consultations.html#first">Book first consultation</a></div></div>
<div class="card"><span class="eyebrow" style="box-shadow:none;background:var(--sage)">30 minutes · Online or at the studio</span><h3>Follow-up</h3>
<div class="price"><span data-fee="followup">{inr(T["followup"])}</span> <small>incl. taxes</small></div>
<ul class="ticks"><li>See what has changed since your last blend</li><li>A refreshed Bach flower blend (30 ml) — <b>included</b></li><li>Recommended every 3–4 weeks</li></ul>
<div class="actions"><a class="btn ghost" href="consultations.html#followup">Book follow-up</a></div></div></div>'''

pages = {}

pages['index.html'] = page('index.html', 'Bach flower remedies & aromatherapy in Vadodara', 'Personal Bach flower consultations with Jitendra Khimlani and natural aromatherapy roll-ons, aura sprays and bath salts. Book online or shop across India.', f'''
<section class="hero"><div class="wrap"><div class="copy">
<span class="eyebrow">Bach flower remedies · Aromatherapy</span>
<h1>Feel lighter, <em>one drop</em> at a time.</h1>
<p class="lead">Talk to Jitendra Khimlani about what’s been on your mind. He prepares a Bach flower blend just for how you feel — and our aromatherapy blends support your everyday calm, sleep and confidence.</p>
<div class="actions"><a class="btn" href="consultations.html">Book a consultation</a><a class="btn ghost" href="shop.html">Shop the range</a></div>
<div class="stats"><div><b>12+ years</b><span>of workshops</span></div><div><b>2,00,000+</b><span>people guided</span></div><div><b>Online & Vadodara</b><span>consultations</span></div></div></div>
<div class="hero-art"><img class="owl" src="assets/img/owl-bottle.webp" alt="BeWise owl holding a remedy bottle"><img class="b1" src="assets/img/products/bach-remedy-dropper.webp" alt="Bach flower remedy dropper"><img class="b2" src="assets/img/products/sleep-rollon.webp" alt="Sleep roll-on"></div>
</div></section>
<section><div class="wrap"><div class="center"><span class="divider"></span><span class="eyebrow">How it works</span><h2>Three gentle steps</h2></div>
<div class="grid g3" style="margin-top:26px">
<div class="card step"><span class="n">1</span><h3>Share how you feel</h3><p class="muted">Book online and answer a few private questions — worries, sleep, energy, what you’d like to feel instead.</p></div>
<div class="card step"><span class="n">2</span><h3>Meet Jitendra Khimlani</h3><p class="muted">A calm, unhurried consultation online or at our Alkapuri studio. He listens first.</p></div>
<div class="card step"><span class="n">3</span><h3>Your personal blend</h3><p class="muted">He prepares a Bach flower blend from the 38 remedies for your emotional state — included in your fee.</p></div></div></div></section>
<section><div class="wrap"><div class="center"><span class="eyebrow">Consultations</span><h2>Simple, clear pricing</h2><p class="lead">Your remedy blend is included. No hidden charges.</p></div><div style="margin-top:26px">{consult_cards}</div></div></section>
<section><div class="wrap"><div style="display:flex;justify-content:space-between;align-items:end;gap:16px;flex-wrap:wrap"><div><span class="eyebrow">Shop</span><h2>Aromatherapy for every day</h2></div><a class="btn ghost" href="shop.html">See all products</a></div>
<div class="grid g4" id="featured" style="margin-top:22px"></div></div></section>
<section><div class="wrap"><div class="card person sprig r" style="overflow:hidden"><img src="assets/img/jitu-portrait.webp" alt="Jitendra Khimlani"><div><span class="eyebrow" style="box-shadow:none;background:var(--peri)">Your consultant</span>
<h2>Jitendra Khimlani <em>· Jitendra Khimlani</em></h2><p class="lead" style="font-size:17px">Bach Remedy Therapist. Jitendra Khimlani listens first. Then he prepares a blend of Bach flower essences chosen for how you feel.</p>
<div class="actions"><a class="btn ghost" href="about.html">About Jitendra Khimlani</a><a class="btn ghost" href="https://www.jitendrakhimlani.com" rel="noopener">jitendrakhimlani.com</a></div></div></div></div></section>
<section><div class="wrap"><div class="center"><span class="divider"></span><span class="eyebrow">Kind words</span><h2>From people we’ve guided</h2></div><div class="grid g3" style="margin-top:26px">{quotes}</div></div></section>
<section><div class="wrap"><div class="card center sprig r" style="background:linear-gradient(160deg,#fff,#eef1fb);overflow:hidden"><span class="divider"></span><h2>Ready when you are</h2><p class="lead">Book your first consultation today — online, or at our studio in Alkapuri, Vadodara.</p><div class="actions" style="justify-content:center"><a class="btn" href="consultations.html">Book now · {inr(T["first"])}</a><a class="btn ghost" href="https://wa.me/{B["whatsapp"]}">WhatsApp us</a></div></div></div></section>''')

pages['consultations.html'] = page('consultations.html', 'Book a consultation', 'Book a Bach flower consultation with Jitendra Khimlani online or at the studio in Alkapuri, Vadodara. First consultation ₹1,000, follow-up ₹800 — personal remedy blend included.', f'''
<section style="padding-bottom:10px"><div class="wrap"><span class="eyebrow">Consultations</span><h1>Book a consultation</h1><p class="lead">Choose your session, pick a time that suits you and pay securely. Your personalised Bach flower blend is included in the fee.</p></div></section>
<section style="padding-top:20px"><div class="wrap"><div class="grid" style="grid-template-columns:1.25fr .75fr;align-items:start" id="book">
<div class="card">
<h3>1 · Which session?</h3><div class="opt">
<button class="on" data-type="first"><b>First consultation</b><span>60 min · <span data-fee="first">{inr(T["first"])}</span> · blend included</span></button>
<button data-type="followup"><b>Follow-up</b><span>30 min · <span data-fee="followup">{inr(T["followup"])}</span> · blend included</span></button></div>
<h3 style="margin-top:24px">2 · Where?</h3><div class="opt"><button class="on" data-mode="online"><b>Online</b><span>Video call from home</span></button><button data-mode="in_person"><b>At the studio</b><span>Alkapuri, Vadodara</span></button></div>
<h3 style="margin-top:24px">3 · When?</h3><div class="days" id="days"></div><div class="times" id="times"></div>
<label for="bnote">Anything you’d like Jitendra Khimlani to know? <span class="muted">(optional, private)</span></label><textarea id="bnote" rows="3" maxlength="2000" placeholder="e.g. I’ve been anxious about work and not sleeping well"></textarea>
</div>
<div class="card" style="position:sticky;top:90px"><h3>4 · Confirm &amp; pay</h3><div id="bwho"></div><div id="bsignin"></div>
<div id="bphoneBox" hidden><label for="bphone">WhatsApp number <span class="muted">(confirmation &amp; reminders)</span></label><input id="bphone" inputmode="tel" autocomplete="tel" placeholder="98xxxxxxxx"></div>
<button class="btn block" id="confirm" disabled style="margin-top:16px">Confirm &amp; pay</button><div class="note" id="bmsg" style="margin-top:12px"></div>
<p class="small muted" style="margin-top:14px">Times are shown in Indian Standard Time. You can move your session for free up to 24 hours before. See our <a href="refund-policy.html">cancellation policy</a>.</p></div>
</div></div></section>
<section><div class="wrap">{consult_cards}</div></section>''').replace('grid-template-columns:1.25fr .75fr;', 'grid-template-columns:repeat(auto-fit,minmax(320px,1fr));')

pages['shop.html'] = page('shop.html', 'Shop aromatherapy roll-ons, aura sprays & bath salts', 'Natural aromatherapy roll-ons, aura sprays, bath salts and Bach Rescue Remedy by BeWise Holistic Wellness. Delivered across India.', '''
<section style="padding-bottom:0"><div class="wrap"><span class="eyebrow">Shop</span><h1>Small rituals, <em>big calm.</em></h1><p class="lead">Aromatherapy blends made in Vadodara — roll-ons, aura sprays and bath salts. Delivered across India, or collect from our studio.</p><div class="chips" id="chips"></div>
<div class="grid g4" id="shop"></div></div></section>
<div class="modal" id="pmodal" role="dialog" aria-modal="true"><div class="sheet"><button class="x" aria-label="Close">×</button><div class="sheet-body"></div></div></div>''')

pages['cart.html'] = page('cart.html', 'Your bag & checkout', 'Review your bag and check out securely with Razorpay.', '''
<section style="padding-bottom:10px"><div class="wrap"><span class="eyebrow">Checkout</span><h1>Your bag</h1></div></section>
<section style="padding-top:10px"><div class="wrap"><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr));align-items:start">
<div class="card"><div id="cart"></div></div>
<div class="card" id="checkout" hidden><h3>Delivery</h3>
<div class="opt" id="deliv"><button class="on" data-d="ship"><b>Deliver to me</b><span>Across India · free delivery</span></button><button data-d="pickup"><b>Collect from studio</b><span>Alkapuri, Vadodara</span></button></div>
<div id="addr"><div class="frow"><div><label>Full name</label><input name="a_name" autocomplete="name"></div><div><label>Mobile</label><input name="a_phone" inputmode="tel" autocomplete="tel"></div></div>
<label>Address</label><input name="a_line1" autocomplete="address-line1" placeholder="House / flat, street"><input name="a_line2" autocomplete="address-line2" placeholder="Area, landmark (optional)" style="margin-top:8px">
<div class="frow"><div><label>City</label><input name="a_city" autocomplete="address-level2"></div><div><label>State</label><input name="a_state" autocomplete="address-level1"></div></div>
<label>PIN code</label><input name="a_pin" inputmode="numeric" maxlength="6" autocomplete="postal-code"></div>
<h3 style="margin-top:24px">Your account</h3><div id="who"></div><div id="signin"></div>
<div id="placeBox" hidden><button class="btn block" id="place" style="margin-top:16px">Place order &amp; pay</button></div><div class="note" id="cmsg" style="margin-top:12px"></div>
<p class="small muted" style="margin-top:14px">Secure payment by Razorpay (UPI, cards, net banking, wallets). Read our <a href="shipping-policy.html">shipping</a> and <a href="refund-policy.html">replacement</a> policies.</p></div>
</div></div></section>''')

pages['account.html'] = page('account.html', 'My account', 'Sign in to see your BeWise consultations and orders.', '''
<section><div class="wrap" id="account" style="max-width:820px">
<div id="acc-out" hidden><span class="eyebrow">My account</span><h1>Sign in</h1><p class="lead">Use the 6-digit code we email you — no password needed.</p><div class="card" style="max-width:460px;margin-top:20px"><div id="acc-signin"></div></div></div>
<div id="acc-in" hidden><span class="eyebrow">My account</span><h1 id="acc-name">Welcome</h1><p class="muted" id="acc-mail"></p>
<div class="actions"><a class="btn" href="consultations.html">Book a session</a><a class="btn ghost" href="https://app.bewiseglobal.in/client/">Open the BeWise app</a><button class="btn ghost" id="signout">Sign out</button></div>
<div class="note" id="accmsg" style="margin-top:16px"></div>
<h2 style="margin-top:34px;font-size:26px">Consultations</h2><div class="list" id="acc-appts"><p class="muted">Loading…</p></div>
<h2 style="margin-top:34px;font-size:26px">Orders</h2><div class="list" id="acc-orders"><p class="muted">Loading…</p></div></div>
</div></section>''')

rows = ''.join(f'<tr><td>{E(p["name"])} {E(p["format"] if p["format"] not in ("Dropper",) else "")}</td><td>{E(v["label"])}</td><td style="text-align:right"><b>{inr(v["price_paise"])}</b></td></tr>'
               for p in products for v in p['variants'])
pages['pricing.html'] = page('pricing.html', 'Pricing', 'All BeWise prices in Indian Rupees: consultations and products.', f'''
<section><div class="wrap legal"><span class="eyebrow">Pricing</span><h1>Pricing</h1><p class="lead">All prices are in Indian Rupees (INR) and include applicable taxes. The amount you pay is always shown on the secure Razorpay payment screen before you confirm.</p>
<div class="card" style="margin-top:20px"><h2 style="margin-top:0">Consultations with Jitendra Khimlani</h2><table style="width:100%;border-collapse:collapse">
<tr><td>First consultation (60 min, online or studio) — personal Bach flower blend 30 ml included</td><td style="text-align:right"><b>{inr(T["first"])}</b></td></tr>
<tr><td>Follow-up consultation (30 min) — refreshed blend 30 ml included</td><td style="text-align:right"><b>{inr(T["followup"])}</b></td></tr>
<tr><td>Reorder of your personal Bach flower blend (30 ml, dropper or spray)</td><td style="text-align:right"><b>{inr(80000)}</b></td></tr></table>
<h2>Products</h2><table style="width:100%;border-collapse:collapse">{rows}</table>
<p class="small muted" style="margin-top:18px">Delivery within India is currently free. Prices may change; the price shown at checkout applies to your order.</p></div></div></section>'''.replace('<td>', '<td style="padding:10px 4px;border-bottom:1px solid var(--line)">'))

pages['about.html'] = page('about.html', 'About us', 'BeWise Holistic Wellness — Bach flower consultations by Jitendra Khimlani and natural aromatherapy, Vadodara.', f'''
<section><div class="wrap"><span class="eyebrow">About us</span><h1>Wellness that starts <em>with listening.</em></h1>
<p class="lead">{B["brand"]} was founded in Vadodara to make Bach flower remedies and aromatherapy simple, personal and accessible — online across India and at our studio in Alkapuri.</p></div></section>
<section style="padding-top:0"><div class="wrap"><div class="card person sprig r" style="overflow:hidden"><img src="assets/img/jitu-portrait.webp" alt="Jitendra Khimlani"><div><h2>Jitendra Khimlani <em>· Jitendra Khimlani</em></h2>
<p>Bach Remedy Therapist with 12+ years of workshops and more than 2,00,000 people guided. In every consultation he listens first, understands what you’ve been feeling, and prepares a blend from the 38 Bach flower essences for your emotional state.</p>
<p>Learn more at <a href="https://www.jitendrakhimlani.com" rel="noopener">www.jitendrakhimlani.com</a>.</p></div></div>
<div class="grid g3" style="margin-top:20px">
<div class="card"><h3>What we offer</h3><p class="muted">Personal Bach flower consultations (online and in person), personalised remedy blends, and aromatherapy roll-ons, aura sprays and bath salts.</p></div>
<div class="card"><h3>How we work</h3><p class="muted">Gentle, natural and private. Your answers are shared only with your consultant. We never sell your data.</p></div>
<div class="card"><h3>Our promise</h3><p class="muted">Bach flower remedies and aromatherapy are complementary practices for emotional balance and everyday wellbeing. They don’t replace medical care — please keep seeing your doctor.</p></div></div></div></section>''')

pages['contact.html'] = page('contact.html', 'Contact us', f'Contact {BUSINESS["brand"]}: {BUSINESS["phone"]}, {BUSINESS["email"]}, {BUSINESS["address"]}.', f'''
<section><div class="wrap"><span class="eyebrow">Contact us</span><h1>We’re here to help</h1><p class="lead">Questions about a consultation, an order or your remedy? Reach us any way you like.</p>
<div class="grid g2" style="margin-top:24px;align-items:start"><div class="card">
<h3>{B["legal"]}</h3><p>{B["address"]}</p>
<p><b>Phone / WhatsApp:</b> <a href="tel:{B["phone_raw"]}">{B["phone"]}</a><br><b>Email:</b> <a href="mailto:{B["email"]}">{B["email"]}</a><br><b>Hours:</b> {B["hours"]}</p>
<div class="actions"><a class="btn" href="https://wa.me/{B["whatsapp"]}">WhatsApp us</a><a class="btn ghost" href="{B["maps"]}" rel="noopener">Get directions</a></div>
<p class="small muted" style="margin-top:18px">We reply within one working day. For order issues please include your order number (for example BW-00012).</p></div>
<form class="card" id="contactForm"><h3>Send us a message</h3><label>Your name</label><input name="name" required><label>Mobile</label><input name="phone" inputmode="tel" required><label>Message</label><textarea name="msg" rows="4" required></textarea>
<button class="btn" style="margin-top:16px">Send on WhatsApp</button></form></div></div></section>''')

def legal(fname, title, desc, body):
    pages[fname] = page(fname, title, desc, f'<section><div class="wrap legal"><span class="eyebrow">Legal</span><h1>{E(title)}</h1><p class="muted">Last updated: {B["updated"]}</p><div class="card" style="margin-top:20px">{body}</div></div></section>')

legal('terms-and-conditions.html', 'Terms & conditions', 'Terms and conditions for using bewiseglobal.in and BeWise services.', f'''
<p>These terms apply to the website <b>{B["domain"]}</b>, the BeWise app at app.{B["domain"]} and all services and products offered by <b>{B["legal"]}</b> (“BeWise”, “we”, “us”), {B["address"]}. By booking a consultation, placing an order or using our website you agree to these terms.</p>
<h2>1. Our services</h2><p>We offer Bach flower remedy consultations with our consultant Jitendra Khimlani, online by video call or in person at our studio, personalised Bach flower remedy blends, and aromatherapy products (roll-ons, aura sprays, bath salts and related items).</p>
<h2>2. Not medical advice</h2><p>Bach flower remedies and aromatherapy are complementary wellness practices that support emotional balance and everyday wellbeing. They do not diagnose, treat, cure or prevent any disease and are not a substitute for professional medical advice. Please continue any treatment advised by your doctor and tell us about medicines, pregnancy or allergies. If you are in crisis, call Tele-MANAS 14416 or 112 immediately.</p>
<h2>3. Eligibility</h2><p>You must be 18 or older to book or buy. Consultations for a child must be booked and attended by a parent or guardian.</p>
<h2>4. Bookings</h2><p>A consultation is confirmed once payment is received (or, where offered, when you choose to pay at the studio). Times are in Indian Standard Time. Online sessions need a stable internet connection; if a session cannot happen because of a problem on our side, we will reschedule it at no cost. Rescheduling and cancellations follow our <a href="refund-policy.html">Cancellation &amp; Refund Policy</a>.</p>
<h2>5. Prices and payment</h2><p>All prices are in Indian Rupees (INR) and include applicable taxes unless stated. Payments are processed by Razorpay Software Private Limited using UPI, debit/credit cards, net banking or wallets. We do not see or store your card details. We may change prices at any time; the price shown at checkout applies to your order.</p>
<h2>6. Orders and delivery</h2><p>Orders are accepted when payment is confirmed. Delivery is made as described in our <a href="shipping-policy.html">Shipping &amp; Delivery Policy</a>. Personalised remedy blends are prepared for one person only and must not be shared or resold.</p>
<h2>7. Your account</h2><p>You sign in with a one-time code sent to your email. Keep access to your email secure; you are responsible for activity on your account. Tell us at once if you think someone else has used it.</p>
<h2>8. Acceptable use</h2><p>Do not misuse the website, attempt to access other people’s data, interfere with its security or use it for anything unlawful.</p>
<h2>9. Intellectual property</h2><p>All content, logos, product names, images and text on this website belong to BeWise and may not be copied without written permission.</p>
<h2>10. Liability</h2><p>To the extent allowed by law, our total liability for any claim related to a booking or order is limited to the amount you paid for it. We are not liable for indirect losses or for delays caused by events outside our control (for example courier or network outages).</p>
<h2>11. Governing law</h2><p>These terms are governed by the laws of India. Courts at Vadodara, Gujarat have exclusive jurisdiction.</p>
<h2>12. Contact</h2><p>{B["legal"]}, {B["address"]} · <a href="tel:{B["phone_raw"]}">{B["phone"]}</a> · <a href="mailto:{B["email"]}">{B["email"]}</a></p>''')

legal('privacy-policy.html', 'Privacy policy', 'How BeWise collects, uses and protects your personal data.', f'''
<p>{B["legal"]} (“BeWise”) respects your privacy. This policy explains what personal data we collect through {B["domain"]} and the BeWise app, why, and your choices. We follow the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000.</p>
<h2>1. What we collect</h2><ul><li><b>Account &amp; contact:</b> name, email, mobile number, city, delivery address.</li>
<li><b>Bookings &amp; orders:</b> sessions booked, products bought, payment status (not your card or UPI details).</li>
<li><b>Wellbeing information you choose to share:</b> answers before a consultation (feelings, sleep, life changes, safety questions), notes for your consultant, mood journal and goals in the app.</li>
<li><b>Technical:</b> basic device and log data needed to keep the service secure.</li></ul>
<h2>2. Why we use it</h2><ul><li>To provide consultations, prepare your remedy blend and deliver your orders.</li><li>To send booking confirmations, reminders, order updates and sign-in codes.</li><li>To take payments and keep accounts as required by law.</li><li>To improve our service using anonymous, aggregated statistics.</li></ul>
<h2>3. Who can see your wellbeing information</h2><p>Your consultation answers and session notes are shared only with your consultant, Jitendra Khimlani. They are encrypted on our servers. Our office team sees only what is needed to prepare and deliver your remedy (for example the bottle size and whether you prefer it alcohol-free). If you allow it, a private summary may be prepared with the help of an AI service for your consultant only.</p>
<h2>4. Sharing</h2><p>We never sell your data. We share it only with service providers who help us run BeWise — Razorpay (payments), courier partners (delivery address and phone), our hosting provider Hostinger (servers in a secure data centre), email/WhatsApp messaging providers — and when required by law.</p>
<h2>5. Payments</h2><p>Payments are processed by Razorpay. Card, UPI and bank details are entered on Razorpay’s secure page and are not stored by us. See Razorpay’s privacy policy at razorpay.com.</p>
<h2>6. Cookies</h2><p>We use a single essential cookie to keep you signed in and local storage to remember your bag. We do not use advertising cookies.</p>
<h2>7. How long we keep it</h2><p>We keep account and wellbeing information while your account is active and for up to 3 years after your last visit, and invoices for 8 years as required by tax law. You can ask us to delete your account at any time.</p>
<h2>8. Your rights</h2><p>You can ask to see, correct or delete your data, or withdraw consent (for example to WhatsApp messages or AI summaries), by writing to <a href="mailto:{B["email"]}">{B["email"]}</a>. We will respond within 30 days.</p>
<h2>9. Grievance officer</h2><p>{B["owner"]}, {B["legal"]}, {B["address"]} · <a href="mailto:{B["email"]}">{B["email"]}</a> · {B["phone"]}</p>''')

legal('refund-policy.html', 'Cancellation & refund policy', 'Cancellation, rescheduling, replacement and refund policy of BeWise Holistic Wellness.', f'''
<p>We want every BeWise experience to feel right. Because each consultation reserves Jitendra Khimlani’s time and each remedy blend is prepared personally for you, we follow the policy below. Please read it before you pay.</p>
<h2>1. Consultations</h2><ul>
<li><b>Reschedule for free</b> up to 24 hours before your session — from My account or by WhatsApp ({B["phone"]}).</li>
<li>Within 24 hours of the session you can reschedule <b>once</b> by contacting us.</li>
<li>If you miss a session without telling us (no-show), the session is treated as used.</li>
<li>If we have to cancel or cannot hold your session (for example the consultant is unavailable or a technical problem on our side), we will offer a new time of your choice at no extra cost.</li>
<li>Consultation fees are <b>non-refundable</b> once paid; instead, your payment always remains valid for a rescheduled session.</li></ul>
<h2>2. Personalised remedy blends</h2><p>Your Bach flower blend is prepared for you alone, so it cannot be cancelled or returned once preparation has started.</p>
<h2>3. Products</h2><ul>
<li>You can cancel a product order <b>before it is dispatched</b> by contacting us; the full amount is kept as BeWise credit you can use for any product or consultation.</li>
<li>For hygiene reasons opened products cannot be returned.</li>
<li><b>Damaged, leaking, wrong or missing item?</b> Tell us within 48 hours of delivery with your order number and a photo. We will send a <b>free replacement</b>.</li>
<li>If a parcel is lost in transit or returned to us undelivered, we will re-send it at no cost.</li></ul>
<h2>4. Failed or duplicate payments</h2><p>If money is debited but your booking or order is not confirmed, or you are charged twice, the amount is returned automatically to your original payment method by Razorpay/your bank, usually within <b>5–7 working days</b>. If it has not arrived, write to us with the payment reference and we will resolve it.</p>
<h2>5. Summary</h2><p>BeWise does not offer cash refunds for completed purchases. You are always protected by free rescheduling, credit for orders cancelled before dispatch, free replacements for damaged or wrong items, and automatic reversal of failed or duplicate payments.</p>
<h2>6. Contact</h2><p>{B["legal"]} · <a href="tel:{B["phone_raw"]}">{B["phone"]}</a> · <a href="mailto:{B["email"]}">{B["email"]}</a> · {B["address"]}</p>''')

legal('shipping-policy.html', 'Shipping & delivery policy', 'How BeWise ships orders across India.', f'''
<h2>1. Where we deliver</h2><p>We deliver to addresses across India through trusted courier partners. You can also collect your order from our studio in Alkapuri, Vadodara at no cost.</p>
<h2>2. Processing time</h2><ul><li><b>Products:</b> packed and dispatched within 1–3 working days of payment.</li><li><b>Personalised remedy blends:</b> prepared within 1–2 working days after your consultation or reorder.</li></ul>
<h2>3. Delivery time</h2><p>Usually 3–7 working days after dispatch depending on your location (metro cities are often faster). Delays caused by couriers, weather or public holidays are outside our control, but we will always help track your parcel.</p>
<h2>4. Delivery charges</h2><p>Delivery within India is currently <b>free</b>. If this changes, the delivery charge will be shown clearly at checkout before you pay.</p>
<h2>5. Tracking</h2><p>Once dispatched you’ll receive the courier name and tracking number by email/WhatsApp and in My account.</p>
<h2>6. Studio pickup</h2><p>Choose “Collect from studio” at checkout. We’ll tell you when it’s ready. Pickup hours: {B["hours"]}. Address: {B["address"]}.</p>
<h2>7. Damaged or missing items</h2><p>See our <a href="refund-policy.html">Cancellation &amp; Refund Policy</a> — we replace damaged, wrong or missing items free of charge.</p>
<h2>8. Services</h2><p>Consultations are services and are not shipped. Online sessions take place by video call; the joining link is shared after booking.</p>''')

pages['404.html'] = page('404.html', 'Page not found', 'Page not found', '<section><div class="wrap center"><h1>Page not found</h1><p class="lead">The page you were looking for has moved.</p><div class="actions" style="justify-content:center"><a class="btn" href="index.html">Go home</a></div></div></section>')

# ── write ──
if OUT.exists(): shutil.rmtree(OUT)
(OUT / 'assets/img/products').mkdir(parents=True)
for name, content in pages.items(): (OUT / name).write_text(content)
shutil.copy(SRC / 'assets/site.css', OUT / 'assets/site.css')
shutil.copy(SRC / 'assets/site.js', OUT / 'assets/site.js')
shutil.copy(ROOT / 'api/sdk/bewise-api.js', OUT / 'assets/bewise-api.js')
(OUT / 'assets/products.js').write_text('window.BW_PRODUCTS=' + json.dumps(PUBLIC, ensure_ascii=False) + ';\n')
img = ROOT / 'apps/client/public/img'
for f in ['logo-mark.png', 'logo-mark-white.png', 'jitu-portrait.webp', 'owl-bottle.webp', 'owl-wave.webp']: shutil.copy(img / f, OUT / 'assets/img' / f)
shutil.copytree(SRC / 'assets/img', OUT / 'assets/img', dirs_exist_ok=True)   # Higgsfield stages, hero scene, sprig, texture
for f in (img / 'products').glob('*.webp'): shutil.copy(f, OUT / 'assets/img/products' / f.name)
try:
    from PIL import Image
    Image.open(ROOT / 'design/brand/bewise-logo-holistic-wellness.jpg').convert('RGB').resize((630, 630)).save(OUT / 'assets/img/og.jpg', quality=85)
except Exception as e:
    print('og image skipped:', e, file=sys.stderr)
(OUT / '.htaccess').write_text('''# @owner HUB · bewiseglobal.in
Options -Indexes
DirectoryIndex index.html
ErrorDocument 404 /404.html
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteCond %{HTTP:X-Forwarded-Proto} !https
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]
RewriteRule ^ https://%1%{REQUEST_URI} [L,R=301]
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Strict-Transport-Security "max-age=31536000"
  <FilesMatch "\\.(html)$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
  <FilesMatch "\\.(webp|png|jpg|css|js)$">
    Header set Cache-Control "public, max-age=86400"
  </FilesMatch>
</IfModule>
''')
(OUT / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: https://{BUSINESS["domain"]}/sitemap.xml\n')
(OUT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    ''.join(f'<url><loc>https://{BUSINESS["domain"]}/{"" if n == "index.html" else n}</loc></url>' for n in pages if n not in ('404.html', 'cart.html', 'account.html')) + '</urlset>\n')
print(f'Built {OUT} — {len(pages)} pages, {len(PUBLIC)} products, API {API}')
