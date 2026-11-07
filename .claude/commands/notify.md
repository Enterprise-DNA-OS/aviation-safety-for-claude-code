---
description: "Record that a notice was given to the regulator: an initial call, the details (CAA, Part 12) or the written report (ATSB), with the reference they gave. Refuses a notice the report does not owe and the wrong regulator for the base."
---

# notify

Record that a notice was given to the regulator: an initial call, the details (CAA, Part 12) or the written report (ATSB), with the reference they gave. Refuses a notice the report does not owe and the wrong regulator for the base.

Run `node scripts/safety.mjs notify <ref> --kind=initial|details|written --by=<person> [--reference="<their reference>"] [--at="YYYY-MM-DD HH:MM"] --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Say whether it went in on time. Never record a notice nobody has given.
