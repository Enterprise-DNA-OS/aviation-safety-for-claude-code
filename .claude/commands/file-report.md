---
description: "File a safety report: an occurrence, a hazard or a suggestion, at a base, at the local time it happened, with the aircraft and the reporter. --confidential hides the reporter everywhere it is shown."
---

# file-report

File a safety report: an occurrence, a hazard or a suggestion, at a base, at the local time it happened, with the aircraft and the reporter. --confidential hides the reporter everywhere it is shown.

Run `node scripts/safety.mjs file-report --kind=occurrence|hazard|suggestion --title="<what>" --description="<detail>" --base=<base> --at="YYYY-MM-DD HH:MM" [--aircraft=<rego>] [--reporter=<person>] [--confidential] --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Give the reference and the triage deadline. If it sounds like an accident or serious incident, say so and offer to triage it now.
