# BeWise Operations — manager app prototype (MANAGER chat)

Working front end for Mr. Haresh Moorjani's office app (`/ops`), built while the HUB foundation is pending.
Demo data only; every action works in the browser (stage machine, stock ledger, money, production, purchases).
Shiprocket, WhatsApp and payments are **simulated**.

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # single-file dist/index.html
pnpm artifact     # dist/artifact.html for sharing
```

- Visual language: v4 Soft Bloom tokens (`src/styles.css`), Plus Jakarta Sans, owl mascot crops from `design/assets/v4`.
- Motion: `motion` (Framer Motion) — springs on transform/opacity only; `prefers-reduced-motion` respected via `MotionConfig`.
- State: `zustand` store in `src/lib/store.ts`; each action mirrors a server function in `docs/specs/manager/01…05`.
- Screens: MG-02…MG-31 in `src/screens/*` with screen IDs in each file header.
- Porting plan: screens → `src/app/(manager)/ops/**`, store actions → `src/modules/{fulfilment,inventory,catalog,…}` server actions once FOUNDATION ✅.
