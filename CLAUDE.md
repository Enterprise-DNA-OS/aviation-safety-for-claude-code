# Aviation Safety for Claude Code: operating instructions

Claude Code reads this file at the start of every session. It says who this is for, the house rules, and the one right way to do each recurring job.

## Who this is for

- **Business:** [YOUR AIR OPERATOR], [CAA or CASA certificate numbers: Part 119/135, Part 141, Part 145, AOC]
- **Operator:** [YOUR NAME], [your role: safety manager, accountable manager, chief pilot]
- **What matters most:** [for example: no CAA or ATSB notice ever late, every intolerable risk acted on the same day, every action checked by someone other than its owner]

The work is an air operator's safety management system in New Zealand or Australia: bases, people and aircraft, monthly flight hours, safety reports (occurrences, hazards, suggestions) and the notices the CAA or ATSB are owed, the hazard register and its risk assessments on the ICAO matrix, corrective actions, audits and findings, safety performance indicators, management of change, and safety training.

## Rules

- Read the CLI result before answering. Every answer about a report, hazard, action, audit, change or person starts with data from `node scripts/safety.mjs`. Never answer from memory.
- Resolve names first. If the CLI says a name is ambiguous, list the candidates and ask; never pick the first.
- Times are the base's own clock. "14:20" at Cairns is 2:20 pm in Cairns. Write them as `--at="2026-11-09 14:20"`.
- The safety manager decides a report's class at triage (none, incident, serious, accident). Never pick the class yourself; if the facts do not make it clear, ask. The class decides which notices the regulator is owed.
- Never record a notice to the CAA or ATSB that nobody has given. `notify` records what a person already lodged, with the reference the regulator gave.
- A confidential report stays confidential. Never try to work out who filed it, and never put a reporter's name in a bulletin.
- An action is verified by someone other than its owner. `verify-action` refuses the owner; so do you.
- An intolerable risk is acted on now: say so, and offer the action and the restriction the operator wants to record.
- Every write names `--actor`. That is a label in the activity log, not a verified identity.
- Never invent a date, a time, a root cause, a regulator reference, a risk rating or a training date. Copy them from the report, the investigator, the regulator or the certificate.
- Never send, call, lodge or delete. Notices, reminders and bulletins are drafts in `drafts/`; documents are in `docs-out/`. A person lodges and sends.
- The rules in `docs/compliance.md` are records checks, not legal advice. If a rule looks out of date, say so and stop.
- Back up before a schema change. Use a new numbered migration (`/customise`), run `npm test`, and keep real data, exports and credentials out of Git.
- The database owner can bypass every application check. Protect that credential. Row security and revoked public privileges restrict unrelated database roles; a shared installation needs authenticated access.

## Routing table: one right way for each recurring job

| When the operator asks for... | Use this |
|---|---|
| Record an action as done, with what was done. | `/action-done` |
| Corrective and preventive actions: open ones by due date, then done ones waiting for someone else to verify them. --owner=<person> for one person, --all for every action. | `/actions` |
| The activity log for the last 7 days (or --days=N): who did what. | `/activity` |
| Add a corrective or preventive action with an owner and due date, linked to the report, hazard, audit finding or change it fixes. | `/add-action` |
| Add an aircraft by registration (ZK- or VH-), with its type and base. | `/add-aircraft` |
| Schedule an audit: title, area, base, auditor and date. | `/add-audit` |
| Start a management of change record for a change to the operation: new route, aircraft, base, procedure or key person. | `/add-change` |
| Record an audit finding: major, minor or observation, with what was found. | `/add-finding` |
| Add a hazard to the register: title, area, owner, and the change it came from if any. | `/add-hazard` |
| Add a person: name, role (accountable-manager, safety-manager, chief-pilot, pilot, engineer, ground-crew, office), base and email. | `/add-person` |
| Add or change a safety performance indicator: reports per 1,000 flight hours, optionally for one category or class, with a target and an alert level. | `/add-spi` |
| Record a training course a person finished: sms, human-factors, investigation, dangerous-goods or another, with the date and provider. The expiry follows the rule for their role unless the certificate says otherwise. | `/add-training` |
| Every aircraft: type, base, flight hours and reports over the last six months. | `/aircraft` |
| Assess a hazard's risk on the ICAO matrix: likelihood 1 to 5 and severity A to E, with the controls in place. Says whether it is intolerable, tolerable or acceptable. | `/assess` |
| Show what needs a person today: regulator notices overdue or due, intolerable risks with no action, reports not triaged, investigations and actions overdue, findings with no action, actions not verified, audits overdue, hazards never assessed or due for review, changes not assessed, training expired or expiring, indicators above alert and missing flight hours. | `/attention` |
| One audit in full with its findings and the actions against each. | `/audit` |
| Record an audit as done with a one-line summary. | `/audit-done` |
| Every audit with its standing (planned, overdue, done), how many findings it raised and how many have no action. | `/audits` |
| Cancel an action with the reason. | `/cancel-action` |
| Move a change to approved, implemented, closed or withdrawn. Approval needs the accountable manager or safety manager, at least one hazard identified for it, every one assessed, and none intolerable. Implemented needs approval first; closed needs its actions verified. | `/change-status` |
| Every management of change record with its status, the hazards identified for it and their latest ratings, and open actions. | `/changes` |
| Close a hazard that no longer exists, with the reason. Refuses while it has actions not yet verified. | `/close-hazard` |
| Close a report with its outcome. Refuses until it is triaged, every notice owed is recorded, the investigation has a root cause and every action is verified. | `/close-report` |
| Check the records against the rules in docs/compliance.md: CAA Part 12 notices, ATSB reportable matters, risk management and safety assurance under Part 100, management of change, training, and the house rules for investigations and actions. Breaches first, each with its source. | `/compliance` |
| Make this system yours in plain language. Add a field, rename stages, change a rule, add a column to a document. Writes the migration, applies it, updates the commands that touch it. | `/customise` |
| Render occurrence reports, hazard and risk assessments, audit reports and the safety meeting pack as branded HTML from the records. | `/documents` |
| Draft a reminder to a person listing the safety actions they own, late ones marked. Written to drafts/, never sent. | `/draft-action-reminder` |
| Draft a safety bulletin for staff from an investigated report: what happened, why, what changed. No names. Written to drafts/, never sent. | `/draft-bulletin` |
| Draft the occurrence details for the CAA (to copy into form CA005 or the online report) or the written report for the ATSB, from the records. Written to drafts/, never sent. | `/draft-notice` |
| Export every record to one JSON file the business owns. | `/export` |
| File a safety report: an occurrence, a hazard or a suggestion, at a base, at the local time it happened, with the aircraft and the reporter. --confidential hides the reporter everywhere it is shown. | `/file-report` |
| One hazard in full: its risk assessments over time, the reports linked to it and the actions against it. | `/hazard` |
| The hazard register: every open hazard, intolerable first, with its first and latest risk rating on the ICAO matrix, open actions, linked reports and review date. --all includes closed hazards. | `/hazards` |
| Flight hours logged by aircraft and month for the last 6 months (or --months=N). | `/hours` |
| Bring hazard reports and the hazard register across from SMS Pro, or any safety spreadsheet saved as CSV. Dry run first. --map=<field>=<heading> for other headings. | `/import` |
| The ten questions SMS Pro's screens do not answer directly: untreated risks, rising categories, reports per 100 hours by aircraft, triage and closure times by base, late regulator notices, actions that lowered a risk, actions not verified, reporting rates by base, indicators above target, and training running out. | `/insights` |
| Record the finished investigation of a report: the root cause, in the investigator's words. | `/investigation` |
| Add a note to the activity log about a report, hazard, action, audit, change, aircraft or person. | `/log` |
| Log an aircraft's flight hours for a finished month (from the tech log). Indicators are worked out per 1,000 hours, so every aircraft needs every month. | `/log-hours` |
| Add a read-only HTML view (a dashboard page) from a plain-language description, rendered in the operator's brand by `npm run view`. | `/new-view` |
| Notices owed to the CAA (Civil Aviation Rules Part 12) or the ATSB (TSI Act 2003 ss 18 and 19), overdue first, with the deadline on the base's clock. --all includes those already given and how late each was. | `/notifications` |
| Record that a notice was given to the regulator: an initial call, the details (CAA, Part 12) or the written report (ATSB), with the reference they gave. Refuses a notice the report does not owe and the wrong regulator for the base. | `/notify` |
| Everyone in the operation: role, base, open actions they own and training that is not current. | `/people` |
| Mark a person as left or active again, with the reason. Lists the open actions that now need a new owner. | `/person-status` |
| One report in full: what happened, the notices owed to the CAA or ATSB and whether each was given, the investigation, its actions and its activity. | `/report` |
| Every safety report, newest first: occurrences, hazards and suggestions, with class, status and the hazard it is linked to. --open hides closed ones; --base and --kind filter. A confidential reporter shows as confidential. | `/reports` |
| Record a review of a hazard with what was looked at. Resets its review date. | `/review-hazard` |
| Change a house rule: triage_days, asap_hours, investigation_days, verify_days, hazard_review_days or warn_days. | `/set` |
| Safety performance indicators: reports per 1,000 flight hours over the last three full months against each target and alert level. | `/spis` |
| Safety training not current: SMS, human factors, investigation and dangerous goods by role, expired or never done first. --days=N shows anything expiring within N days; --all shows everyone. | `/training` |
| Triage a report: its class (none, incident, serious, accident), category, the hazard it belongs to and, if it needs one, the investigator. Prints the notices the CAA or ATSB are now owed, with their deadlines. The investigator cannot be the reporter. | `/triage` |
| Record that someone other than the owner checked a done action, and whether it worked. Not effective means a new action and a new risk assessment. | `/verify-action` |
| Render the read-only dashboards in views.json (this week, the hazard register, corrective actions, safety assurance) as HTML in your brand. | `/view` |
| Write the Monday safety review to drafts/ from the notices owed, the rules, new reports, actions due and late, the indicators and everything that needs a person. | `/weekly-review` |

If an ask fits nothing here, run `node scripts/safety.mjs --help`, answer from the records, then propose a new command for it.

## Where things live

- `scripts/safety.mjs` is the one CLI. `scripts/lib/domain.mjs` holds its rules.
- `supabase/migrations/` is the schema in plain SQL. `v_notifications` works out every notice the CAA or ATSB is owed from the report's class and its base's country. `v_attention` is everything that needs a person, in one place: the CLI, the views and the documents all read it. `risk_band()` is the ICAO matrix. `npm run migrate` applies it. `DATABASE_URL` chooses Postgres; unset, it uses PGlite in `.data/`.
- `settings` holds the house rules (`set` changes them); `training_rules` says which course each role needs and for how long. Laws and their sources are in `docs/compliance.md`.
- `views.json` and `documents.json` define the dashboards and documents. `brand.json` is your name, colours and logo.
- `docs/replace-sms-pro.md` is the switching guide. `docs/cli.md` lists every option.

Built by Enterprise DNA. Installed and run for you as part of Omni: https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=sms-pro&utm_medium=readme
