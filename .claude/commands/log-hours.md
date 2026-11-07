---
description: "Log an aircraft's flight hours for a finished month (from the tech log). Indicators are worked out per 1,000 hours, so every aircraft needs every month."
---

# log-hours

Log an aircraft's flight hours for a finished month (from the tech log). Indicators are worked out per 1,000 hours, so every aircraft needs every month.

Run `node scripts/safety.mjs log-hours <rego> --month=YYYY-MM --hours=<n> --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Confirm, then say if any other aircraft is still missing that month.
