---
description: "Write the Monday safety review to drafts/ from the notices owed, the rules, new reports, actions due and late, the indicators and everything that needs a person."
---

# weekly-review

Write the Monday safety review to drafts/ from the notices owed, the rules, new reports, actions due and late, the indicators and everything that needs a person.

Run `node scripts/safety.mjs weekly-review`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Summarise in five lines: notices, risks, reports, actions, indicators.
