---
description: "Add or change a safety performance indicator: reports per 1,000 flight hours, optionally for one category or class, with a target and an alert level."
---

# add-spi

Add or change a safety performance indicator: reports per 1,000 flight hours, optionally for one category or class, with a target and an alert level.

Run `node scripts/safety.mjs add-spi --code=<code> --name="<name>" --target=<n> --alert=<n> [--category=<category>] [--class-min=incident|serious|accident] --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Show where it stands today.
