---
description: "Every safety report, newest first: occurrences, hazards and suggestions, with class, status and the hazard it is linked to. --open hides closed ones; --base and --kind filter. A confidential reporter shows as confidential."
---

# reports

Every safety report, newest first: occurrences, hazards and suggestions, with class, status and the hazard it is linked to. --open hides closed ones; --base and --kind filter. A confidential reporter shows as confidential.

Run `node scripts/safety.mjs reports [--open] [--base=<base>] [--kind=occurrence|hazard|suggestion]`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Show the table. Never try to work out who filed a confidential report.
