---
description: "Record the finished investigation of a report: the root cause, in the investigator's words."
---

# investigation

Record the finished investigation of a report: the root cause, in the investigator's words.

Run `node scripts/safety.mjs investigation <ref> --root-cause="<cause>" [--on=YYYY-MM-DD] --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Then offer to add the corrective actions.
