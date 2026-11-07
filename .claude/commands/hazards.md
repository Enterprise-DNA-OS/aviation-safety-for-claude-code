---
description: "The hazard register: every open hazard, intolerable first, with its first and latest risk rating on the ICAO matrix, open actions, linked reports and review date. --all includes closed hazards."
---

# hazards

The hazard register: every open hazard, intolerable first, with its first and latest risk rating on the ICAO matrix, open actions, linked reports and review date. --all includes closed hazards.

Run `node scripts/safety.mjs hazards [--all]`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Show the table. Call out any intolerable hazard with no open action.
