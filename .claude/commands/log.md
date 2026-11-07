---
description: "Add a note to the activity log about a report, hazard, action, audit, change, aircraft or person."
---

# log

Add a note to the activity log about a report, hazard, action, audit, change, aircraft or person.

Run `node scripts/safety.mjs log <ref> --note="<note>" --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Confirm it.
