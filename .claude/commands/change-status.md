---
description: "Move a change to approved, implemented, closed or withdrawn. Approval needs the accountable manager or safety manager, at least one hazard identified for it, every one assessed, and none intolerable. Implemented needs approval first; closed needs its actions verified."
---

# change-status

Move a change to approved, implemented, closed or withdrawn. Approval needs the accountable manager or safety manager, at least one hazard identified for it, every one assessed, and none intolerable. Implemented needs approval first; closed needs its actions verified.

Run `node scripts/safety.mjs change-status <ref> --status=approved|implemented|closed|withdrawn [--by=<person>] [--reason="<why>"] --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

If refused, say what is missing.
