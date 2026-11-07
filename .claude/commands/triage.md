---
description: "Triage a report: its class (none, incident, serious, accident), category, the hazard it belongs to and, if it needs one, the investigator. Prints the notices the CAA or ATSB are now owed, with their deadlines. The investigator cannot be the reporter."
---

# triage

Triage a report: its class (none, incident, serious, accident), category, the hazard it belongs to and, if it needs one, the investigator. Prints the notices the CAA or ATSB are now owed, with their deadlines. The investigator cannot be the reporter.

Run `node scripts/safety.mjs triage <ref> --class=none|incident|serious|accident --category=<category> --by=<person> [--hazard=<hazard>] [--investigator=<person>] --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Lead with the notices owed and when. Never pick the class for the operator: ask if it is not clear.
