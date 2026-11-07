---
description: "Record that someone other than the owner checked a done action, and whether it worked. Not effective means a new action and a new risk assessment."
---

# verify-action

Record that someone other than the owner checked a done action, and whether it worked. Not effective means a new action and a new risk assessment.

Run `node scripts/safety.mjs verify-action <ref> --by=<person> --effective=yes|no [--note="<what was checked>"] --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

If effective, offer to reassess the hazard. If not, offer a new action.
