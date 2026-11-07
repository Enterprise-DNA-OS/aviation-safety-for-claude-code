# Moving off SMS Pro

Bring your reports and hazard register across in an afternoon, check them, then run both systems side by side for one reporting cycle before you stop the subscription.

## 1. Get your records out

SMS Pro does not publish an export format. Save each register as a spreadsheet, one row per record, then save it as CSV:

- **Reports:** your report listing (hazard reports, occurrences and suggestions) with the report number, date, time, base, aircraft, reporter, category, title, description and status.
- **Hazards:** your hazard register with the hazard number, title, description, area, likelihood, severity, owner and existing controls.

If your account cannot list a register, ask SMS Pro for a copy of your data. Your safety records are yours. The files in `examples/sms-pro/` show the shape.

## 2. Set up the operation first

Add your bases, people and aircraft so the import can match them: `add-person`, `add-aircraft`, and bases with `/customise` or the seed file. Then log the last six months of flight hours (`log-hours`), so the indicators have hours to divide by.

## 3. Import, dry run first

```bash
node scripts/safety.mjs import sms-pro hazards.csv --kind=hazards --actor="Your name" --dry-run
node scripts/safety.mjs import sms-pro hazards.csv --kind=hazards --actor="Your name"
node scripts/safety.mjs import sms-pro reports.csv --kind=reports --base=ZQN --actor="Your name" --dry-run
node scripts/safety.mjs import sms-pro reports.csv --kind=reports --base=ZQN --actor="Your name"
```

Imports are atomic: one bad row stops the whole file and nothing is written. Running the same file twice skips the rows already in (each row keeps its SMS Pro number).

## The headings each import reads

| Field | Headings it looks for | Notes |
|---|---|---|
| Report id | Report Number, Report ID, Report No, Number, ID | Required |
| Title | Title, Subject, Summary, Short Description | Falls back to the first 80 characters of the description |
| Date and time | Date, Event Date, Date of Event, Occurrence Date, Occurred; Time, Event Time, Local Time | YYYY-MM-DD or DD/MM/YYYY, read on the base's clock; noon when there is no time |
| Base | Base, Location, Station, Department | Matched to a base code or name; `--base` for rows without one |
| Aircraft | Aircraft, Registration, Tail Number, Rego | ZKHSB and ZK-HSB both match |
| Reporter | Reporter, Reported By, Submitted By, Employee | Matched by full name; left blank when no one matches |
| Category | Category, Event Type, Type, Classification | Mapped to the nearest category for closed reports |
| Status | Status, State | Closed or Complete come in closed; everything else comes in new |
| Hazard id | Hazard ID, Hazard Number, Hazard No, ID | Required |
| Hazard | Hazard, Title, Name, Hazard Description | Required |
| Area | Area, Department, Category, Operational Area | Mapped to the nearest area |
| Likelihood, severity | Likelihood, Probability; Severity, Consequence Severity | 1 to 5 or the ICAO words; severity also A to E, with 5 as catastrophic. Becomes the first risk assessment |
| Owner, controls | Owner, Hazard Owner, Responsible; Controls, Existing Controls, Mitigation | |

Other headings: `--map=title=Event Summary,base=Site`.

## 4. Check what came across

- Every open report comes in as **new**, so `/attention` lists it for triage. Triage each one: the class decides which CAA or ATSB notices are owed, and the system works out the deadlines from the date it happened. Record notices already given with `notify`.
- Run `/hazards` and `/compliance`. Hazards with no rating show as never assessed.

## What does not carry over

- Attachments and photos. Keep the SMS Pro copy or a folder export; link a file path in the description if you need it.
- Investigation worksheets, audit checklists and training records beyond what is in your spreadsheets. Add audits, findings and training with `add-audit`, `add-finding` and `add-training`, or have Enterprise DNA map your full export.
- Closed reports come in with their status but without their history of who did what in SMS Pro.
