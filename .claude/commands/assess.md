---
description: "Assess a hazard's risk on the ICAO matrix: likelihood 1 to 5 and severity A to E, with the controls in place. Says whether it is intolerable, tolerable or acceptable."
---

# assess

Assess a hazard's risk on the ICAO matrix: likelihood 1 to 5 and severity A to E, with the controls in place. Says whether it is intolerable, tolerable or acceptable.

Run `node scripts/safety.mjs assess <hazard> --likelihood=1-5 --severity=A-E --by=<person> [--controls="<controls>"] --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Say the band and what it means. For intolerable, say the exposed operation is stopped or restricted until actions bring it down.
