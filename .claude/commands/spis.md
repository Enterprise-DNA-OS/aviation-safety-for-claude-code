---
description: "Safety performance indicators: reports per 1,000 flight hours over the last three full months against each target and alert level."
---

# spis

Safety performance indicators: reports per 1,000 flight hours over the last three full months against each target and alert level.

Run `node scripts/safety.mjs spis`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Name any indicator above target or alert, and the reports behind it.
