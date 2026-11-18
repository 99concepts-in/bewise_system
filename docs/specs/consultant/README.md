# CONSULTANT — detailed specs

Written by the CONSULTANT chat before building each screen: one file per screen ID (e.g. `CN-06.md`) with layout, fields, validation, states, permissions, events, and acceptance criteria. Engine/data specs are named by milestone.

| File | Covers | Milestone |
|---|---|---|
| `00-CONSULTANT-FLOW-AND-SCREENS.md` | Flow & screen list CN-01…CN-36 (HUB) | — |
| `K1-SCHEDULING-AND-CALENDAR-SYNC.md` | Tables, slot engine, holds, payment handler, reschedule policy, Google / iCloud / ICS sync | K1 |
| `K3-INTAKE-DATA-MODEL-AND-MAPPING.md` | Intake tables, answer schemas, mapping seed (38 flowers), flags, flowers-to-consider, safety | K3 |
| `K6-AI-PROMPTS-AND-SCHEMAS.md` | Claude case summary + 3-line progress summaries: prompts, zod schemas, validator, caching, audit | K6 |
| `CN-03.md` | Today | K2 |
| `CN-05.md` | Session prep + CN-33 case summary + CN-36 safety / since last time | K3–K6 |
| `CN-06.md` | Live session + CN-07 troubling sheet | K4 |
| `CN-09.md` | Remedy builder → Give remedy + CN-10 | K5 |
