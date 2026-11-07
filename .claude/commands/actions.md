---
description: "Corrective and preventive actions: open ones by due date, then done ones waiting for someone else to verify them. --owner=<person> for one person, --all for every action."
---

# actions

Corrective and preventive actions: open ones by due date, then done ones waiting for someone else to verify them. --owner=<person> for one person, --all for every action.

Run `node scripts/safety.mjs actions [--owner=<person>] [--all]`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Late ones first, with days late and the owner.
