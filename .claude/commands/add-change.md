---
description: "Start a management of change record for a change to the operation: new route, aircraft, base, procedure or key person."
---

# add-change

Start a management of change record for a change to the operation: new route, aircraft, base, procedure or key person.

Run `node scripts/safety.mjs add-change --title="<change>" --owner=<person> [--description="<detail>"] --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Then offer to identify its hazards.
