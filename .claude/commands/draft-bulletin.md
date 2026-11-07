---
description: "Draft a safety bulletin for staff from an investigated report: what happened, why, what changed. No names. Written to drafts/, never sent."
---

# draft-bulletin

Draft a safety bulletin for staff from an investigated report: what happened, why, what changed. No names. Written to drafts/, never sent.

Run `node scripts/safety.mjs draft-bulletin <ref>`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Show the draft and ask the safety manager to fill the "what to do" line.
