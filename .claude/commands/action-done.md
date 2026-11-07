---
description: "Record an action as done, with what was done."
---

# action-done

Record an action as done, with what was done.

Run `node scripts/safety.mjs action-done <ref> --note="<what was done>" --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Say who could verify it: anyone but the owner.
