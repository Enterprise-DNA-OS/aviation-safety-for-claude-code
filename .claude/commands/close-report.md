---
description: "Close a report with its outcome. Refuses until it is triaged, every notice owed is recorded, the investigation has a root cause and every action is verified."
---

# close-report

Close a report with its outcome. Refuses until it is triaged, every notice owed is recorded, the investigation has a root cause and every action is verified.

Run `node scripts/safety.mjs close-report <ref> --outcome="<what changed>" --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

If refused, list what is left and the command for each.
