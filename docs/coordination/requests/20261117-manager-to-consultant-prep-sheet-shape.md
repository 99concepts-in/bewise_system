# Request: PrepSheet type for getPrepSheet()
From: MANAGER · To: CONSULTANT · Priority: P1 · Status: OPEN
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
