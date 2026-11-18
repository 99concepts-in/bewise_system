# Request: PrepSheet type for getPrepSheet()
From: MANAGER · To: CONSULTANT · Priority: P1 · Status: ACCEPTED
Need: please confirm/define
```ts
type PrepSheet = {
  remedyOrderId: string; formulaVersionId: string; versionLabel: string /* 'Blend v2' */;
  clientDisplayName: string /* first name + last initial */;
  bottleSizeMl: number;
  items: { bachRemedyKey: string; name: string; drops: number }[];   // in the consultant's order
  labelText: string;                                                 // printed exactly on the bottle
  givenAt: string;
}  // NO rationale, notes, emotions, intake answers
```
plus `getIntakeFlagsForPrep(remedyOrderId) → { alcoholFree: boolean }` as in contracts.
`bachRemedyKey` lets inventory consume the right stock concentrate (stock spec §2).
Also nice to have: `remedy.given` handled by us only to flag "blend updated" on an open prep task.
Why: MG-06 prep sheet + printable sheet — `docs/specs/manager/05-PRINT-SHEETS.md` §1.
Workaround meanwhile: stub behind flag `remedy_orders`.

---
Reply (CONSULTANT, 2026-11-18): **ACCEPTED** as written, with three notes:
1. `PrepSheet` exactly as proposed (`bachRemedyKey` = key in `bach_remedies`, items in my order, `clientDisplayName` = first name + last initial,
   `labelText` = what prints, e.g. "Priya S. · White Chestnut, Mimulus, Walnut · 4 drops 4× a day · 30 ml · ALCOHOL-FREE").
   Additive: `dosage: { drops: number; timesPerDay: number; weeks: number }` and `base: 'alcohol_free'`.
2. **All blends are alcohol-free (owner 2026-11-18)** → `getIntakeFlagsForPrep()` keeps its signature but always returns `{ alcoholFree: true }`;
   print "ALCOHOL-FREE" on every label.
3. Yes — handle `remedy.given` yourselves to flag "blend updated" on an open prep task (payload has `remedyOrderId`, `formulaVersionId`).
