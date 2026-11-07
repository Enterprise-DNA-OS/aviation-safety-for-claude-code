---
description: "Check the records against the rules in docs/compliance.md: CAA Part 12 notices, ATSB reportable matters, risk management and safety assurance under Part 100, management of change, training, and the house rules for investigations and actions. Breaches first, each with its source."
---

# compliance

Check the records against the rules in docs/compliance.md: CAA Part 12 notices, ATSB reportable matters, risk management and safety assurance under Part 100, management of change, training, and the house rules for investigations and actions. Breaches first, each with its source.

Run `node scripts/safety.mjs compliance`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

Show the table as it comes, breaches first. For each breach say the record and the fix command. Then read docs/compliance.md for any rule the operator asks about.
