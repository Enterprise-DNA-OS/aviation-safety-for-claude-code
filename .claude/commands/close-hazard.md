---
description: "Close a hazard that no longer exists, with the reason. Refuses while it has actions not yet verified."
---

# close-hazard

Close a hazard that no longer exists, with the reason. Refuses while it has actions not yet verified.

Run `node scripts/safety.mjs close-hazard <hazard> --reason="<why>" --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Confirm it.
