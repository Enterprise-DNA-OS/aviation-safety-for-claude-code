---
description: "Record an audit as done with a one-line summary."
---

# audit-done

Record an audit as done with a one-line summary.

Run `node scripts/safety.mjs audit-done <ref> --summary="<summary>" [--on=YYYY-MM-DD] --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Then offer to record its findings.
