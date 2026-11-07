---
description: "Add an aircraft by registration (ZK- or VH-), with its type and base."
---

# add-aircraft

Add an aircraft by registration (ZK- or VH-), with its type and base.

Run `node scripts/safety.mjs add-aircraft <rego> --type="<type>" --base=<base> --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Confirm it.
