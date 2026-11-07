---
description: "Add a person: name, role (accountable-manager, safety-manager, chief-pilot, pilot, engineer, ground-crew, office), base and email."
---

# add-person

Add a person: name, role (accountable-manager, safety-manager, chief-pilot, pilot, engineer, ground-crew, office), base and email.

Run `node scripts/safety.mjs add-person --name="<name>" --role=<role> --base=<base> --email=<email> --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Confirm the code and the training their role needs.
