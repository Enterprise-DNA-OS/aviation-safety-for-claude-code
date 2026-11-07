---
description: "Record an audit finding: major, minor or observation, with what was found."
---

# add-finding

Record an audit finding: major, minor or observation, with what was found.

Run `node scripts/safety.mjs add-finding <audit> --level=major|minor|observation --description="<finding>" --actor="<you>"`. Add `--json` when you need every field. Resolve the report, hazard, action, person, aircraft or base by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the operator. Never run a placeholder.

For a major or minor finding, offer to add the action.
