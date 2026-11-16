# Owner Command Centre — Flow & Screen List (v1 draft)

> **Owner:** HUB (designed with the business owner). Status: **DRAFT — waiting for owner feedback.**
> Supersedes O-01…O-12 in `docs/02-FLOWS-AND-SCREENS.md` once approved. Screen IDs `OW-xx` are stable.
> **Phone first** (owner, 2026-11-16), computer for deep reports. **Design v3 "Luxe"** (`design/v3-luxe/README.md`). Boards: `design/owner-v2/`.

## Design intent
The owner checks the business several times a day, usually on the phone. In **10 seconds** they should know:
*How much came in? How much cash do we have? Who owes us / whom do we owe? Is anything stuck or waiting for me?*
Everything else is one tap deeper. Numbers are big, calm and trustworthy (serif numerals). Decisions (approvals) are
one swipe. Personal money lives in a clearly separate beige space. Ask BeWise answers questions in plain words.

## Navigation (phone)
**Home · Insights · ( Ask BeWise 🦉 ) · Money · More** — the raised centre button is the owl: the business assistant.
- **More** = Approvals · Team & roles · Payroll · Personal finance · Reports · Settings · Integrations · Audit log

## Flow
```
GLANCE      Home: today's sales · this month vs last · cash in bank · to collect · to pay · waiting for you (approvals) · alerts
UNDERSTAND  Insights → Sales (streams, compare) · Clients & consultations · Products & stock · Operations
MONEY       Money → Cash & bank · To collect / To pay (ageing) · Expenses by category · Profit & loss · GST · Reports (PDF/Excel)
DECIDE      Approvals → item (receipt photo, who, why) → Approve / Reject with note
ASK         Ask BeWise → "How did shop sales compare to last month?" → answer + small chart + link
PEOPLE      Team (Jitu Bhaiya, Haresh, future staff) → roles & permissions · Payroll run (salary, advances, payslips)
PERSONAL    Personal finance (separate) → net worth, monthly spend, budgets, accounts · Owner transfers (capital / drawing / loan)
SETUP       Settings → business & GST, fees & policies, products tax · Integrations (Razorpay, Shiprocket, WhatsApp, Google) · Audit log
```

## Screens
### A. Glance
| ID | Screen | Content |
|---|---|---|
| OW-01 | Sign in + Face ID | Owner only, biometric re-lock on open |
| OW-02 | Home | Midnight hero "Today ₹…" with vs-yesterday; month sales vs last; tiles cash · to collect · to pay; "Waiting for you" (approvals count); alerts (low stock, failed delivery, overdue); one AI insight line |
| OW-03 | Notifications | Approvals, big payments, alerts, daily summary |

### B. Insights
| ID | Screen | Content |
|---|---|---|
| OW-04 | Sales | Period pills (Today · Week · Month · Year · Custom), compare toggle, streams (Consultations · Remedies · Shop), chart, top days |
| OW-05 | Clients & consultations | Sessions held, new vs returning, average rating, top troubling emotions (aggregate, anonymous), consultant utilisation |
| OW-06 | Products & stock | Best sellers, margin by product, stock value, running low, production cost |
| OW-07 | Operations | Orders flow (paid → dispatched), avg prep time, Shiprocket delivery performance, problems |

### C. Money
| ID | Screen | Content |
|---|---|---|
| OW-08 | Money home | Cash & bank total + accounts (bank, UPI, Razorpay, cash), to collect / to pay tiles, this month in vs out |
| OW-09 | To collect / To pay | Ageing bars (0–30, 31–60, 61–90, 90+), top parties, nudge Haresh / remind |
| OW-10 | Expenses | By category donut, list, receipts |
| OW-11 | Profit & loss | Month / FY, income by stream, costs, net profit, compare |
| OW-12 | Reports | P&L, Balance sheet, Cash flow, Trial balance, GST summary, Ledgers → share PDF / Excel (full view on computer) |

### D. Decide
| ID | Screen | Content |
|---|---|---|
| OW-13 | Approvals | Expenses, supplier bills, stock write-offs, price changes; swipe or tap |
| OW-14 | Approval detail | Receipt image, amount, category, who submitted, note; Approve / Reject with comment |

### E. Ask BeWise (business)
| ID | Screen | Content |
|---|---|---|
| OW-15 | Ask BeWise | Suggested questions, chat answers with mini charts & numbers, links to screens; read-only; "needs your approval for any action" |

### F. People
| ID | Screen | Content |
|---|---|---|
| OW-16 | Team | Members with role, last active; invite |
| OW-17 | Member & permissions | Role, what they can see/do (toggles grouped), deactivate |
| OW-18 | Payroll | Month run: salaries, advances, incentives, deductions → approve → payslips |

### G. Personal (separate space)
| ID | Screen | Content |
|---|---|---|
| OW-19 | Personal home | Beige "Personal — separate from business" band, net worth, this month spend vs budget, accounts & cards, EMIs |
| OW-20 | Add personal entry | Expense / income / investment / EMI, category, account |
| OW-21 | Owner transfer | Business ↔ personal as **capital / drawing / loan** (never sale or expense) |

### H. Setup
| ID | Screen | Content |
|---|---|---|
| OW-22 | More hub | Tiles to everything in More |
| OW-23 | Business settings | Business profile, GSTIN, invoice numbering, fees & durations, reschedule policy (no refunds), shipping |
| OW-24 | Integrations | Razorpay · Shiprocket · WhatsApp · Google Calendar · Email — each Connected / Test mode / Not set up |
| OW-25 | Audit log | Who did what, when; filters |

### I. Computer (deep work)
| ID | Screen | Content |
|---|---|---|
| OW-26 | Command centre (desktop) | All Home + Insights at once |
| OW-27 | Financial reports (desktop) | P&L / Balance sheet / GST with drill-down, export |

## Open questions for the owner
1. **Your name** for greetings (and is the owner also a consultant)? (D-17)
2. Do you want **personal finance** in the first release, or later?
3. **Payroll** now (salaries for Haresh & staff), or later?
4. Will an **accountant/CA** need their own login (view reports, export)?
5. Should Jitu Bhaiya and Haresh see **profit** too, or only sales? (Default: sales only.)
