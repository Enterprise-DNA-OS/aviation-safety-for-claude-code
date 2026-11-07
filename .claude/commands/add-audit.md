---
description: "Schedule an audit: title, area, base, auditor and date."
---

# add-audit

Schedule an audit: title, area, base, auditor and date.

Run `node scripts/safety.mjs add-audit --title="<title>" --area="<area>" --scheduled=YYYY-MM-DD [--base=<base>] [--auditor=<person>] --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Confirm it.
