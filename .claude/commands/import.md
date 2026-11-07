---
description: "Bring hazard reports and the hazard register across from SMS Pro, or any safety spreadsheet saved as CSV. Dry run first. --map=<field>=<heading> for other headings."
---

# import

Bring hazard reports and the hazard register across from SMS Pro, or any safety spreadsheet saved as CSV. Dry run first. --map=<field>=<heading> for other headings.

Run `node scripts/safety.mjs import sms-pro <file.csv> --kind=reports|hazards --base=<default base> --actor="<you>" --dry-run`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Show the counts from the dry run, then run it without --dry-run when the operator says so. Then triage every imported open report.
