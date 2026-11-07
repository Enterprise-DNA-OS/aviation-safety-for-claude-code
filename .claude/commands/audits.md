---
description: "Every audit with its standing (planned, overdue, done), how many findings it raised and how many have no action."
---

# audits

Every audit with its standing (planned, overdue, done), how many findings it raised and how many have no action.

Run `node scripts/safety.mjs audits`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Overdue audits first.
