---
description: "Add a hazard to the register: title, area, owner, and the change it came from if any."
---

# add-hazard

Add a hazard to the register: title, area, owner, and the change it came from if any.

Run `node scripts/safety.mjs add-hazard --title="<hazard>" --area=<area> [--owner=<person>] [--change=<MOC ref>] [--description="<detail>"] --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Then offer to assess it.
