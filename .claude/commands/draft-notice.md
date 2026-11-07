---
description: "Draft the occurrence details for the CAA (to copy into form CA005 or the online report) or the written report for the ATSB, from the records. Written to drafts/, never sent."
---

# draft-notice

Draft the occurrence details for the CAA (to copy into form CA005 or the online report) or the written report for the ATSB, from the records. Written to drafts/, never sent.

Run `node scripts/safety.mjs draft-notice <ref>`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Say what is missing that only the flight records hold. A person lodges it, then run /notify.
