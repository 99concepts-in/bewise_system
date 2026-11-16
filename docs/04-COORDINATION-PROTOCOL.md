# Coordination Protocol — how 4 chats + the HUB work as one team

> **Owner:** HUB. Every chat follows this exactly. It exists so that no chat overwrites another's work and
> the HUB can always answer "what's done, what's in review, what's live?".

## 1. Branches

| Branch | Purpose | Who writes |
|---|---|---|
| `main` | **Integration branch = source of truth.** Deploys to production once go-live starts. | Only via merged PRs (HUB merges on the user's go-ahead) |
| `claude/...` (each chat's own branch, assigned by its session) | Day-to-day work of that chat | That chat only |

No chat pushes to `main` or to another chat's branch. No force-pushes.

## 2. Start-of-task ritual (every chat, every time it starts a task)

```bash
git fetch origin main
git merge --no-edit origin/main         # bring in everyone else's merged work
```
Then read, in this order:
1. `docs/coordination/STATUS.md` — what is live/merged, what's blocked.
2. `docs/coordination/DECISIONS.md` — owner decisions (use defaults if still open).
3. `docs/coordination/log/*.md` — **other chats' latest entries** (top of each file).
4. `docs/coordination/requests/` — any open request addressed **to you** (`*-to-<you>-*.md`).
5. `docs/03-CONTRACTS.md` — if you will call another module.

If you see a request to you: handle it first or reply in the file with a plan/ETA.

## 3. Ownership rules

- Edit **only** folders/tables/files your brief lists as yours.
- **Shared kit** (`src/components/ui`, `src/components/shell`, `src/lib`) — HUB-owned. You may make **small additive** changes (new prop, new variant, new helper) if you log them. Never change existing behaviour; open a request instead.
- **Another chat's module** — never edit. Need a new function/field/event? Write a request (§5) and build against a typed stub behind a feature flag meanwhile.
- **Migrations** — only for your own tables, file name `<timestamp>_<module>_<desc>.sql`. Never alter another module's table. Need a column in someone else's table? Request it.
- **Docs** — never edit HUB docs (`docs/00-04`, `STATUS.md`, `DECISIONS.md`, `chats/*`). Write your own specs in `docs/specs/<your-chat>/`.

## 4. Your log — `docs/coordination/log/<your-chat>.md`

Only you write it. **Newest entry at the top.** Add an entry at the end of every working session and whenever you change anything others use.

```md
## 2026-11-20 — K1 Scheduling engine (PR #12, branch claude/xyz)
**Status:** In review
**Done:** availability rules UI (K-02), getAvailableSlots(), holdAppointment(), 15-min hold expiry cron
**Contracts changed:** scheduling.getAvailableSlots now returns `Slot.isPreferred` (additive)
**Events:** emits appointment.held / appointment.confirmed (listens to payment.captured)
**Migrations:** 20261120101500_scheduling_core.sql
**Needs from others:** OWNER: real fees in settings (D-09) — using placeholders
**Breaking changes:** none
**Next:** K2 Today screen
```

## 5. Cross-chat requests — `docs/coordination/requests/`

One **new file per request** (never edit a shared list → no merge conflicts):
`<YYYYMMDD>-<from>-to-<to>-<short-slug>.md`, e.g. `20261121-client-to-manager-product-badges.md`

```md
# Request: product "new" badge field
From: CLIENT · To: MANAGER · Priority: P2 · Status: OPEN
Need: `ProductCard.badges: ('new'|'bestseller')[]` from catalog.listProducts()
Why: P-04 shop grid design
Workaround meanwhile: hidden behind flag `store`
---
Reply (MANAGER): Accepted — shipping in M1 PR. Status: DONE (PR #15)
```
The receiving chat replies **in the same file** and updates `Status:` (OPEN → ACCEPTED → DONE / DECLINED with reason). HUB watches all requests.

## 6. Pull requests

- One PR per milestone (or smaller). Title: `[CONSULTANT] K1 Scheduling engine` (use your chat tag).
- Base: `main`. Before opening: merge latest `origin/main`, run `pnpm lint && pnpm typecheck && pnpm test`.
- PR body sections: **Screens** (IDs) · **What works** · **Contracts/events/migrations changed** · **Flags** · **Tests** · **Screenshots** (mobile + desktop) · **Known gaps**.
- Add your log entry in the same PR.
- HUB reviews for contract/ownership violations and merges when the user says so. After merge, HUB updates `STATUS.md`.

## 7. Code comment conventions (so any chat can read any file)

Every file you create starts with an ownership header:
```ts
/**
 * @module   scheduling
 * @owner    CONSULTANT            // CLIENT | CONSULTANT | MANAGER | OWNER | HUB
 * @screens  K-02, C-03            // screen IDs from docs/02-FLOWS-AND-SCREENS.md
 * @contract docs/03-CONTRACTS.md#scheduling-consultant
 * Purpose:  Slot generation from availability rules minus booked/held appointments.
 */
```
Inline tags (grep-able across the repo):
| Tag | Meaning |
|---|---|
| `// @contract v1` | Above an exported function others call. Don't change signature without a request. |
| `// @emits order.paid` / `// @handles payment.captured` | Event producers/consumers |
| `// @cross(MANAGER): ...` | Code that depends on / affects another chat |
| `// @todo(OWNER): ...` | Work waiting on another chat (also open a request) |
| `// @flag(store)` | Code path behind a feature flag |
| `// @decision(D-02)` | Behaviour follows a default that may change when the owner decides |
| `// @sensitive` | Touches notes, formulas, finance or personal data — extra review |
| `// @stub` | Temporary stub; must be gone before the flag is turned on in production |

Migration header: `-- @owner MANAGER  @module inventory  purpose: ...`

## 8. Definition of done (per screen / feature)

- Real data, real persistence, server-side permission check, RLS policy + test.
- Loading / empty / error / success / no-permission states.
- Mobile + desktop checked (client: 375px first; ops: 1280px first).
- Accessible (labels, focus, contrast, keyboard).
- Events emitted/handled as per contract; idempotent handlers.
- Tests: unit for logic (money, transitions), e2e for the main path.
- Log entry + PR. No fake buttons, no misleading success toasts (PRD §20).

## 9. How the HUB stays aware

The user asks the HUB chat for updates. The HUB will:
1. `git fetch --all` and read every chat's branch log, open PRs and request files.
2. Update `docs/coordination/STATUS.md` (module × status × PR × live?).
3. Flag conflicts, contract drift, blocked dependencies and decisions needed.
4. Merge approved PRs into `main` and announce what is live.

So: **push your branch at the end of every session** — unpushed work is invisible to the HUB and other chats.
