---
description: "Mark a person as left or active again, with the reason. Lists the open actions that now need a new owner."
---

# person-status

Mark a person as left or active again, with the reason. Lists the open actions that now need a new owner.

Run `node scripts/safety.mjs person-status <person> --status=left|active --reason="<why>" --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

List the actions to reassign.
