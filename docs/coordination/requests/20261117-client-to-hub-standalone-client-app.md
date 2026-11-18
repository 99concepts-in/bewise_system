# Request: client app built standalone in apps/client ahead of the foundation
From: CLIENT · To: HUB · Priority: P2 · Status: OPEN

The owner asked (2026-11-17) for the client app to be built now. Because `FOUNDATION: ⬜`, it lives in a
self-contained Next.js 16 app at `apps/client/` (no Supabase, on-device demo store, simulated OTP/payments/AI) so it
cannot collide with the HUB scaffold.

Need from HUB when the foundation lands:
1. Decide the move: copy `apps/client/src/app/**` → `src/app/(public|auth|client)/**`, `components/ui.tsx` → variants in `src/components/ui`, and replace `src/lib/store.ts` with module calls (each action is annotated with its contract).
2. Keep the v4 tokens from `apps/client/src/app/globals.css` (Tailwind v4 `@theme`) or merge them into the shared token build.
3. Root workspace: add `apps/client` to the pnpm workspace or delete it after the move.
4. Note two lessons for the shared kit: never put a transform on a layout/template wrapper (breaks `position: fixed` CTAs/sheets); generate slots as IST wall-clock.
5. Owner asked for a **profile photo at onboarding** (new screen CL-05b) → needs a private `client-photos` bucket + `clients.photo_path` (MANAGER/crm) — please add to CL flow doc.
---
