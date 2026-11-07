---
description: "Add a corrective or preventive action with an owner and due date, linked to the report, hazard, audit finding or change it fixes."
---

# add-action

Add a corrective or preventive action with an owner and due date, linked to the report, hazard, audit finding or change it fixes.

Run `node scripts/safety.mjs add-action --description="<what>" --owner=<person> --due=YYYY-MM-DD [--report=<ref>] [--hazard=<ref>] [--finding=<ref>] [--change=<ref>] --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Confirm the reference, owner and due date.
