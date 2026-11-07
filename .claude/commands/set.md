---
description: "Change a house rule: triage_days, asap_hours, investigation_days, verify_days, hazard_review_days or warn_days."
---

# set

Change a house rule: triage_days, asap_hours, investigation_days, verify_days, hazard_review_days or warn_days.

Run `node scripts/safety.mjs set <key> <value> --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Confirm the old and new value.
