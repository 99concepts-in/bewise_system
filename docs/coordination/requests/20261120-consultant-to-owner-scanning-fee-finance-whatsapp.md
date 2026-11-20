# Request: scanning fee & duration, finance summary by product, WhatsApp for assigned time + link
From: CONSULTANT · To: OWNER · Priority: P1 · Status: OPEN
Owner decided with Jitu Bhaiya (2026-11-20). Spec: `docs/specs/consultant/01-STRUCTURE-V3.md`.

1. **Scanning** consultation type: fee and duration (prototype uses ₹1,200 and 45 min as placeholders), `includes_remedy = 0`.
2. **Finance board for Jitu Bhaiya** (read-only, D-33): `finance.getSalesSummary {from, to}` should return totals, **by product** (units, revenue, cost → profit), **by source** (consultations / remedy reorders / shop) and **daily** revenue. Real product prices and costs when the product list arrives.
3. **WhatsApp templates:** `appointment_time_assigned` {first_name, type, date, time, mode, link?} — sent when the team assigns a time; `appointment_link` {first_name, when, link}; the payment link follows automatically as already agreed.
4. **Staff:** Shivani di as a staff user (manager role) — she assigns times with Haresh bhai.
---
