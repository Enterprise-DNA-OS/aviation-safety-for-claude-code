---
description: "Record a review of a hazard with what was looked at. Resets its review date."
---

# review-hazard

Record a review of a hazard with what was looked at. Resets its review date.

Run `node scripts/safety.mjs review-hazard <hazard> --note="<what was reviewed>" --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Confirm the next review date.
