---
description: "Record a training course a person finished: sms, human-factors, investigation, dangerous-goods or another, with the date and provider. The expiry follows the rule for their role unless the certificate says otherwise."
---

# add-training

Record a training course a person finished: sms, human-factors, investigation, dangerous-goods or another, with the date and provider. The expiry follows the rule for their role unless the certificate says otherwise.

Run `node scripts/safety.mjs add-training <person> --course=<course> --completed=YYYY-MM-DD [--expires=YYYY-MM-DD] [--provider="<provider>"] --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Confirm the new expiry.
