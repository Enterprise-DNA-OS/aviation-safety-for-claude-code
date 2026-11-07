# CLI reference

Every command is `node scripts/safety.mjs <command>`. Options use `--key=value`. Add `--json` to any command for machine output. Every write needs `--actor="<your name>"`. Times are the base's own clock: `--at="2026-11-09 14:20"` at Cairns is 2:20 pm in Cairns.

## action-done

Record an action as done, with what was done.

```
node scripts/safety.mjs action-done <ref> --note="<what was done>" --actor="<you>"
```

## actions

Corrective and preventive actions: open ones by due date, then done ones waiting for someone else to verify them. --owner=<person> for one person, --all for every action.

```
node scripts/safety.mjs actions [--owner=<person>] [--all]
```

## activity

The activity log for the last 7 days (or --days=N): who did what.

```
node scripts/safety.mjs activity [--days=N]
```

## add-action

Add a corrective or preventive action with an owner and due date, linked to the report, hazard, audit finding or change it fixes.

```
node scripts/safety.mjs add-action --description="<what>" --owner=<person> --due=YYYY-MM-DD [--report=<ref>] [--hazard=<ref>] [--finding=<ref>] [--change=<ref>] --actor="<you>"
```

## add-aircraft

Add an aircraft by registration (ZK- or VH-), with its type and base.

```
node scripts/safety.mjs add-aircraft <rego> --type="<type>" --base=<base> --actor="<you>"
```

## add-audit

Schedule an audit: title, area, base, auditor and date.

```
node scripts/safety.mjs add-audit --title="<title>" --area="<area>" --scheduled=YYYY-MM-DD [--base=<base>] [--auditor=<person>] --actor="<you>"
```

## add-change

Start a management of change record for a change to the operation: new route, aircraft, base, procedure or key person.

```
node scripts/safety.mjs add-change --title="<change>" --owner=<person> [--description="<detail>"] --actor="<you>"
```

## add-finding

Record an audit finding: major, minor or observation, with what was found.

```
node scripts/safety.mjs add-finding <audit> --level=major|minor|observation --description="<finding>" --actor="<you>"
```

## add-hazard

Add a hazard to the register: title, area, owner, and the change it came from if any.

```
node scripts/safety.mjs add-hazard --title="<hazard>" --area=<area> [--owner=<person>] [--change=<MOC ref>] [--description="<detail>"] --actor="<you>"
```

## add-person

Add a person: name, role (accountable-manager, safety-manager, chief-pilot, pilot, engineer, ground-crew, office), base and email.

```
node scripts/safety.mjs add-person --name="<name>" --role=<role> --base=<base> --email=<email> --actor="<you>"
```

## add-spi

Add or change a safety performance indicator: reports per 1,000 flight hours, optionally for one category or class, with a target and an alert level.

```
node scripts/safety.mjs add-spi --code=<code> --name="<name>" --target=<n> --alert=<n> [--category=<category>] [--class-min=incident|serious|accident] --actor="<you>"
```

## add-training

Record a training course a person finished: sms, human-factors, investigation, dangerous-goods or another, with the date and provider. The expiry follows the rule for their role unless the certificate says otherwise.

```
node scripts/safety.mjs add-training <person> --course=<course> --completed=YYYY-MM-DD [--expires=YYYY-MM-DD] [--provider="<provider>"] --actor="<you>"
```

## aircraft

Every aircraft: type, base, flight hours and reports over the last six months.

```
node scripts/safety.mjs aircraft
```

## assess

Assess a hazard's risk on the ICAO matrix: likelihood 1 to 5 and severity A to E, with the controls in place. Says whether it is intolerable, tolerable or acceptable.

```
node scripts/safety.mjs assess <hazard> --likelihood=1-5 --severity=A-E --by=<person> [--controls="<controls>"] --actor="<you>"
```

## attention

Show what needs a person today: regulator notices overdue or due, intolerable risks with no action, reports not triaged, investigations and actions overdue, findings with no action, actions not verified, audits overdue, hazards never assessed or due for review, changes not assessed, training expired or expiring, indicators above alert and missing flight hours.

```
node scripts/safety.mjs attention
```

## audit

One audit in full with its findings and the actions against each.

```
node scripts/safety.mjs audit <ref>
```

## audit-done

Record an audit as done with a one-line summary.

```
node scripts/safety.mjs audit-done <ref> --summary="<summary>" [--on=YYYY-MM-DD] --actor="<you>"
```

## audits

Every audit with its standing (planned, overdue, done), how many findings it raised and how many have no action.

```
node scripts/safety.mjs audits
```

## cancel-action

Cancel an action with the reason.

```
node scripts/safety.mjs cancel-action <ref> --reason="<why>" --actor="<you>"
```

## change-status

Move a change to approved, implemented, closed or withdrawn. Approval needs the accountable manager or safety manager, at least one hazard identified for it, every one assessed, and none intolerable. Implemented needs approval first; closed needs its actions verified.

```
node scripts/safety.mjs change-status <ref> --status=approved|implemented|closed|withdrawn [--by=<person>] [--reason="<why>"] --actor="<you>"
```

## changes

Every management of change record with its status, the hazards identified for it and their latest ratings, and open actions.

```
node scripts/safety.mjs changes
```

## close-hazard

Close a hazard that no longer exists, with the reason. Refuses while it has actions not yet verified.

```
node scripts/safety.mjs close-hazard <hazard> --reason="<why>" --actor="<you>"
```

## close-report

Close a report with its outcome. Refuses until it is triaged, every notice owed is recorded, the investigation has a root cause and every action is verified.

```
node scripts/safety.mjs close-report <ref> --outcome="<what changed>" --actor="<you>"
```

## compliance

Check the records against the rules in docs/compliance.md: CAA Part 12 notices, ATSB reportable matters, risk management and safety assurance under Part 100, management of change, training, and the house rules for investigations and actions. Breaches first, each with its source.

```
node scripts/safety.mjs compliance
```

## draft-action-reminder

Draft a reminder to a person listing the safety actions they own, late ones marked. Written to drafts/, never sent.

```
node scripts/safety.mjs draft-action-reminder <person>
```

## draft-bulletin

Draft a safety bulletin for staff from an investigated report: what happened, why, what changed. No names. Written to drafts/, never sent.

```
node scripts/safety.mjs draft-bulletin <ref>
```

## draft-notice

Draft the occurrence details for the CAA (to copy into form CA005 or the online report) or the written report for the ATSB, from the records. Written to drafts/, never sent.

```
node scripts/safety.mjs draft-notice <ref>
```

## export

Export every record to one JSON file the business owns.

```
node scripts/safety.mjs export [--out=<file>]
```

## file-report

File a safety report: an occurrence, a hazard or a suggestion, at a base, at the local time it happened, with the aircraft and the reporter. --confidential hides the reporter everywhere it is shown.

```
node scripts/safety.mjs file-report --kind=occurrence|hazard|suggestion --title="<what>" --description="<detail>" --base=<base> --at="YYYY-MM-DD HH:MM" [--aircraft=<rego>] [--reporter=<person>] [--confidential] --actor="<you>"
```

## hazard

One hazard in full: its risk assessments over time, the reports linked to it and the actions against it.

```
node scripts/safety.mjs hazard <ref or title>
```

## hazards

The hazard register: every open hazard, intolerable first, with its first and latest risk rating on the ICAO matrix, open actions, linked reports and review date. --all includes closed hazards.

```
node scripts/safety.mjs hazards [--all]
```

## hours

Flight hours logged by aircraft and month for the last 6 months (or --months=N).

```
node scripts/safety.mjs hours [--months=N]
```

## import

Bring hazard reports and the hazard register across from SMS Pro, or any safety spreadsheet saved as CSV. Dry run first. --map=<field>=<heading> for other headings.

```
node scripts/safety.mjs import sms-pro <file.csv> --kind=reports|hazards --base=<default base> --actor="<you>" --dry-run
```

## insights

The ten questions SMS Pro's screens do not answer directly: untreated risks, rising categories, reports per 100 hours by aircraft, triage and closure times by base, late regulator notices, actions that lowered a risk, actions not verified, reporting rates by base, indicators above target, and training running out.

```
node scripts/safety.mjs insights
```

## investigation

Record the finished investigation of a report: the root cause, in the investigator's words.

```
node scripts/safety.mjs investigation <ref> --root-cause="<cause>" [--on=YYYY-MM-DD] --actor="<you>"
```

## log

Add a note to the activity log about a report, hazard, action, audit, change, aircraft or person.

```
node scripts/safety.mjs log <ref> --note="<note>" --actor="<you>"
```

## log-hours

Log an aircraft's flight hours for a finished month (from the tech log). Indicators are worked out per 1,000 hours, so every aircraft needs every month.

```
node scripts/safety.mjs log-hours <rego> --month=YYYY-MM --hours=<n> --actor="<you>"
```

## notifications

Notices owed to the CAA (Civil Aviation Rules Part 12) or the ATSB (TSI Act 2003 ss 18 and 19), overdue first, with the deadline on the base's clock. --all includes those already given and how late each was.

```
node scripts/safety.mjs notifications [--all]
```

## notify

Record that a notice was given to the regulator: an initial call, the details (CAA, Part 12) or the written report (ATSB), with the reference they gave. Refuses a notice the report does not owe and the wrong regulator for the base.

```
node scripts/safety.mjs notify <ref> --kind=initial|details|written --by=<person> [--reference="<their reference>"] [--at="YYYY-MM-DD HH:MM"] --actor="<you>"
```

## people

Everyone in the operation: role, base, open actions they own and training that is not current.

```
node scripts/safety.mjs people
```

## person-status

Mark a person as left or active again, with the reason. Lists the open actions that now need a new owner.

```
node scripts/safety.mjs person-status <person> --status=left|active --reason="<why>" --actor="<you>"
```

## report

One report in full: what happened, the notices owed to the CAA or ATSB and whether each was given, the investigation, its actions and its activity.

```
node scripts/safety.mjs report <ref>
```

## reports

Every safety report, newest first: occurrences, hazards and suggestions, with class, status and the hazard it is linked to. --open hides closed ones; --base and --kind filter. A confidential reporter shows as confidential.

```
node scripts/safety.mjs reports [--open] [--base=<base>] [--kind=occurrence|hazard|suggestion]
```

## review-hazard

Record a review of a hazard with what was looked at. Resets its review date.

```
node scripts/safety.mjs review-hazard <hazard> --note="<what was reviewed>" --actor="<you>"
```

## set

Change a house rule: triage_days, asap_hours, investigation_days, verify_days, hazard_review_days or warn_days.

```
node scripts/safety.mjs set <key> <value> --actor="<you>"
```

## spis

Safety performance indicators: reports per 1,000 flight hours over the last three full months against each target and alert level.

```
node scripts/safety.mjs spis
```

## training

Safety training not current: SMS, human factors, investigation and dangerous goods by role, expired or never done first. --days=N shows anything expiring within N days; --all shows everyone.

```
node scripts/safety.mjs training [--days=N] [--all]
```

## triage

Triage a report: its class (none, incident, serious, accident), category, the hazard it belongs to and, if it needs one, the investigator. Prints the notices the CAA or ATSB are now owed, with their deadlines. The investigator cannot be the reporter.

```
node scripts/safety.mjs triage <ref> --class=none|incident|serious|accident --category=<category> --by=<person> [--hazard=<hazard>] [--investigator=<person>] --actor="<you>"
```

## verify-action

Record that someone other than the owner checked a done action, and whether it worked. Not effective means a new action and a new risk assessment.

```
node scripts/safety.mjs verify-action <ref> --by=<person> --effective=yes|no [--note="<what was checked>"] --actor="<you>"
```

## weekly-review

Write the Monday safety review to drafts/ from the notices owed, the rules, new reports, actions due and late, the indicators and everything that needs a person.

```
node scripts/safety.mjs weekly-review
```

## Values

- `--class`: none, incident, serious, accident. Serious means an accident nearly occurred (Civil Aviation Rules Part 12 definitions).
- `--category`: airspace, bird-strike, cfit-terrain, fuel, ground-handling, maintenance, passenger, runway-landing-site, technical, weather, fatigue, dangerous-goods, procedures, other.
- `--area` (hazards): flight-ops, maintenance, ground-ops, passengers, weather, airspace, wildlife, fatigue, organisational, other.
- `--likelihood`: 1 to 5, or extremely improbable, improbable, remote, occasional, frequent.
- `--severity`: A to E, or catastrophic, hazardous, major, minor, negligible. A number 1 to 5 reads 5 as catastrophic.
