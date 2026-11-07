---
description: "Show what needs a person today: regulator notices overdue or due, intolerable risks with no action, reports not triaged, investigations and actions overdue, findings with no action, actions not verified, audits overdue, hazards never assessed or due for review, changes not assessed, training expired or expiring, indicators above alert and missing flight hours."
---

# attention

Show what needs a person today: regulator notices overdue or due, intolerable risks with no action, reports not triaged, investigations and actions overdue, findings with no action, actions not verified, audits overdue, hazards never assessed or due for review, changes not assessed, training expired or expiring, indicators above alert and missing flight hours.

Run `node scripts/safety.mjs attention`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Lead with regulator notices and intolerable risks. One line each, the reference first. Offer the fix command for the top three.
