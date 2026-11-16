# BeWise Wellness — Design System

> **Owner:** HUB. Token source of truth: `design/tokens.json`. Visual reference boards: `design/boards/`.
> Brand guide rule: changing the logo, primary navy or core fonts needs owner approval.

## 1. Principles

1. **Calm for clients, precise for staff.** Same family, different density. Client screens breathe; ops screens are compact and scannable.
2. **One primary action per screen.** Navy button = the next step. Everything else is secondary (sage) or quiet (outline / text).
3. **Show status in words + icon + colour** — never colour alone.
4. **Progressive disclosure.** Show the 20% people need; tuck the rest into tabs, drawers and "More".
5. **Privacy is visible.** Anything private carries a lock icon and "Visible only to you / to staff". Clients never see rationale or internal notes.
6. **Honest UI.** Every button works. Loading, empty, error and success states exist for every screen (PRD §20).
7. **Owl = signature, not wallpaper.** Logo in shells, splash, empty states, documents. Not on every card.

## 2. Brand assets

| Asset | Where | Rule |
|---|---|---|
| Full logo (owl + BeWise + WELLNESS) | Public header/footer, sign-in, invoices, splash | Never redraw, stretch, recolour outside navy/white. Clear space ≥ owl-head height. |
| Owl-only mark | App icon, favicon, collapsed sidebar, loading spinner, empty states | |
| Reference file | `design/brand/bewise-logo-reference.png` | **Needs a designer-made SVG master** before launch (brand guide §2). |
| Splash animation | `design/motion/` | Line-draws the owl; ends on exact logo. Disable under reduced-motion. |

## 3. Colour usage

| Token | Hex | Use | Don't |
|---|---|---|---|
| Primary Navy | `#263C78` | Primary buttons, headings, active nav, links, key numbers | Large decorative fills on client screens |
| Deep Navy | `#182957` | Owner/Manager sidebars, footer, strong headings | Body text on ivory (use `ink`) |
| Soft Ivory | `#FAF9F5` | App/page background everywhere | |
| White | `#FFFFFF` | Cards, forms, tables, drawers | |
| Botanical Sage | `#82977E` | Secondary buttons, wellness accents, client/consultant active states | Primary CTA |
| Soft Green | `#DCE7D9` | Selected states, info panels, "approved" surfaces | Text |
| Warm Beige | `#EDE5D9` | Product & editorial backgrounds, store item tiles, Personal-finance band | Status |
| Muted Gold | `#B89B64` | Thin dividers, owner accents, small premium highlights | Blocks, buttons, text < 18px on ivory (contrast) |

Text on ivory: `ink #1B2238` (body), `ink-muted #5B6275` (secondary). Sage text uses `sage-text #4F6249` for AA contrast.

**Role space accents** (top border of the shell + active nav indicator): Client & Consultant = sage, Manager = navy, Owner = gold hairline. **Personal finance** always shows a beige band labelled "Personal — separate from business".

## 4. Typography

| Style | Font | Size/Line | Use |
|---|---|---|---|
| display-xl / lg / md | Cormorant Garamond 600 | 48/56 · 36/44 · 28/36 | Public hero, page titles in client & consultant spaces, client name on profile |
| title | Inter 600 | 20/28 | Card titles, ops page titles (ops spaces use Inter titles, not serif, for density) |
| subtitle | Inter 600 | 16/24 | Section headings |
| body / body-sm | Inter 400 | 15/24 · 13/20 | Text, table cells |
| label | Inter 500 | 13/16 | Form labels, buttons, tabs, chips |
| overline | Inter 600 caps +12% tracking | 11/16 | Section eyebrows ("BRAND COLOURS") |
| money | Inter, `font-variant-numeric: tabular-nums` | — | **Every** amount, quantity and date column, right-aligned in tables |

INR formatting: Indian grouping `₹4,82,300` · paise shown only in finance documents/reports (`₹4,82,300.00`). Negative = `−₹1,200` with danger colour **and** minus sign.

## 5. Layout & navigation per space

| Space | Shell | Navigation | Breakpoints |
|---|---|---|---|
| Public | Top nav (logo · Consultations · Bach Flower Remedies · Shop · About · Journal · Sign in · **Book a consultation**) + navy footer | Mobile: hamburger + sticky "Book" CTA | Content max 1200px |
| Client `/app` | Header with owl + bell + help; **bottom tab bar** on mobile: Home · Book · Remedies · Shop · Profile | Desktop: same 5 items as left top-nav | Phone first (375px) |
| Consultant `/consult` | Left **rail** (navy) with icons+labels: Today · Clients · Calendar · Remedy builder · Library · Follow-ups; top "Today: n sessions" strip | Tablet landscape first; rail collapses to bottom bar on phone | 1024px+ |
| Manager `/ops` | Left **sidebar** (navy) grouped: Operations · Orders · Remedy prep · Manufacturing · Inventory · Purchases · Billing · Follow-ups · Clients · Appointments · Reports | Phone: "Dispatch mode" (scan/enter AWB, mark dispatched) | Desktop first 1280px |
| Owner `/owner` | Left sidebar (deep navy, gold hairline): Command centre · Finance · Accounting · Reports · Approvals · Operations · Products · People · Personal finance · Settings & roles · Audit log | Phone: Command Centre as stacked KPI cards + alerts + Ask BeWise | Desktop + phone |

Multi-role users (e.g. owner who is also consultant) get a **space switcher** in the avatar menu. URL prefix decides the space.

## 6. Core components (in `src/components/ui`)

| Component | Notes |
|---|---|
| `Button` | variants: `primary` (navy), `secondary` (sage), `outline`, `ghost`, `danger`; sizes sm/md/lg; min height 44px on touch; `loading` state with spinner + disabled |
| `Input`, `Textarea`, `Select`, `Combobox`, `DatePicker`, `TimeSlotGrid`, `PhoneInput (+91)`, `MoneyInput (₹, paise)` | Label above, helper below, error replaces helper with icon. Validate on blur + submit. |
| `Card` | white, hairline border, radius 12, shadow `card`; header/title/actions slots |
| `StatusBadge` | Takes a **domain status enum** and maps to label+icon+tone centrally (`src/components/ui/status-map.ts`). Never hand-colour statuses. |
| `Stepper` | Horizontal (ops/formula) and compact (client order tracker) |
| `DataTable` | Sorting, filters, column visibility, sticky header, pagination, row actions, **responsive card view under md**, CSV/Excel export hook |
| `KpiTile` | label, value (tabular), delta vs period with arrow icon + sign, optional sparkline |
| `Drawer` / `Sheet` | Right-side detail panels in ops/owner; bottom sheet on mobile |
| `Dialog`, `ConfirmDialog` | Destructive confirms name the object ("Cancel appointment BW-A-00042?") |
| `Tabs`, `SegmentedControl` | Segmented for 2–3 options (Online / In-person, Business / Personal) |
| `EmptyState` | Owl mark + one sentence + one action |
| `Skeleton` | Matches final layout; no spinners for page loads |
| `Toast` | Only after server confirms success. Errors persist until dismissed. |
| `Timeline` | Consultation timeline, order history, audit trail |
| `PrivateBlock` | Lock icon + "Visible only to you" header; used for practitioner notes |
| `MoneyText`, `DateText`, `QtyText` | Formatting in one place |
| `FileUpload` | Receipts, images; shows type/size limits; secure storage only |
| `NotificationBell` + inbox | Reads `notifications_inbox` |

## 7. States checklist (every screen)

`loading` (skeleton) · `empty` (EmptyState with next action) · `error` (what happened + retry, no stack traces) · `success` (toast or inline confirmation) · `no permission` (friendly 403 with way back) · `offline` (banner; disable writes unless queued safely).

## 8. Forms & interaction rules

- Labels always visible (no placeholder-only labels). Required marked with `*` + text for screen readers.
- Phone defaults to +91, 10 digits. Pincode → auto city/state.
- Money entry in rupees, stored in paise.
- Long forms: save-and-resume (questionnaire, product, formula).
- Keyboard: ops tables support `/` search, `j/k` row move, `Enter` open, `Esc` close drawer.
- Destructive or financial actions: confirm + reason field where audit needs it (refund, void, adjust stock).

## 9. Accessibility

WCAG 2.1 AA: contrast ≥ 4.5:1 for text, focus ring 2px navy + 2px ivory offset, 44px targets, semantic headings, form errors linked via `aria-describedby`, charts have a data-table alternative, `prefers-reduced-motion` respected, language `en-IN`.

## 10. Voice & copy

Warm, clear, reassuring, knowledgeable (brand guide §7).

| Do | Don't |
|---|---|
| "Your remedy blend is being prepared." | "Your treatment is on its way to cure…" |
| "Supports emotional balance" | "Heals anxiety", "clinically proven", "guaranteed" |
| "₹1,500 due on 25 Nov — Pay now" | "FINAL WARNING: pay immediately" |
| "Prepared and approved by your consultant." | Mystical/vague language |

Reminder messages are polite and include an opt-out where required. Product copy is evidence-aware; no before/after claims.

## 11. Imagery

Real product photography for the live store (amber glass, botanicals, salts, soft directional light, clean beige/ivory backgrounds). AI concept images may be used for mood only and must **not** misrepresent actual products, ingredients or packaging (brand guide §6). Consultation imagery: welcoming, private, professional; no clinical imagery.

## 12. Documents & print (owned by the module that generates them)

Invoice / receipt / credit note (OWNER finance), preparation sheet & pick list & shipping label (MANAGER), client consultation summary (CONSULTANT), batch sheet (MANAGER), reports PDF (OWNER). All use: logo top-left, Inter, tabular numerals, navy headings, gold hairline divider, footer with legal entity + GSTIN + page x/y + generated timestamp.

## 13. Design boards (reference)

| Board | File | Covers screens |
|---|---|---|
| Design system | `design/boards/00-design-system.jpg` | Tokens, buttons, inputs, chips, cards, icons |
| Client: home, booking, pay | `01-client-home-booking.jpg` | C-02, C-03 |
| Client: questionnaire, remedies, journal | `02-client-questionnaire-remedies-journal.jpg` | C-05, C-06, C-07 |
| Client: shop, product, cart | `03-client-store-checkout.jpg` | P-04, P-05, C-09 |
| Public website | `04-public-website.jpg` | P-01 |
| Consultant: client profile | `05-consultant-client-profile.jpg` | K-01 strip, K-04 |
| Consultant: remedy builder | `06-consultant-remedy-builder.jpg` | K-06, K-07 |
| Manager: operations board | `07-manager-operations-board.jpg` | M-04, M-05 |
| Manager: inventory & manufacturing | `08-manager-inventory-manufacturing.jpg` | M-09, M-08 |
| Manager: payment follow-up | `09-manager-payment-followups.jpg` | M-13, M-14 |
| Owner: command centre | `10-owner-command-centre.jpg` | O-01, O-12 |
| Owner: finance reports | `11-owner-finance-reports.jpg` | O-04, O-08 switch |

**Known board inaccuracies — do not copy:** sample numbers/names/dates are illustrative; the Owner board lists products that are not in our catalogue (use Oils/Sprays/Bath); the cart board shows GST ₹0 (real GST comes from finance tax config); some boards say "therapeutic" — not allowed in copy; client bottom tabs differ between boards — **the standard is Home · Book · Remedies · Shop · Profile** (Journal & Appointments live inside Home/Profile).
