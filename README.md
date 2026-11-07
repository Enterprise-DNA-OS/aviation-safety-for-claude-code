<h1 align="center">Aviation Safety for Claude Code</h1>

<p align="center">
  <strong>The open-source aviation safety management system that is just a database and Claude Code.</strong>
</p>

<p align="center">
  Created by <a href="https://www.enterprisedna.co"><strong>Enterprise DNA</strong></a>. Free and open source. Works with Claude Code, Codex, OpenCode or Cursor.
</p>

<!-- three-doors -->
<table align="center">
  <tr>
    <td align="center"><strong>Do it yourself</strong><br/>Clone it, run it, own it. Free, MIT.<br/><a href="#quick-start">Quick start</a></td>
    <td align="center"><strong>We customise it</strong><br/>Your fields, your rules, your SMS Pro data brought across.<br/><a href="https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=sms-pro">Book a call</a></td>
    <td align="center"><strong>We run it for you</strong><br/>Installed, connected and operated inside Omni. Setup fee, then a retainer.<br/><a href="https://enterprisedna.co/omni/instead-of/sms-pro?utm_source=github&utm_medium=readme&utm_campaign=sms-pro">How it works</a></td>
  </tr>
</table>

<p align="center">
  <a href="#what-is-this">What is this</a> &bull;
  <a href="#why-no-front-end">Why no front end</a> &bull;
  <a href="#quick-start">Quick start</a> &bull;
  <a href="#the-commands">Commands</a> &bull;
  <a href="#instead-of-sms-pro">Instead of SMS Pro</a> &bull;
  <a href="#want-it-installed-and-run-for-you">Installed for you</a> &bull;
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node-20+-339933?style=flat-square" alt="Node 20+" />
  <img src="https://img.shields.io/badge/PostgreSQL-any-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PGlite-embedded-3ecf8e?style=flat-square" alt="PGlite" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

---

## What is this

Aviation Safety for Claude Code does the job you pay SMS Pro for, as a Postgres database and a set of agent commands. There is no web front end. You open the folder in [Claude Code](https://claude.com/claude-code) (or Codex, OpenCode, Cursor: see `AGENTS.md`) and ask for what you want in plain language. It runs the right query, and it can answer questions the SMS Pro dashboard cannot.

SMS Pro prices on the number of employees in your company, not the people who use it. Its Enterprise plan is $2,499 a month for 1 to 30 employees ($29,988 a year) and $5,999 a month for 51 to 100 ($71,988 a year) ([asms-pro.com pricing](https://www.asms-pro.com/Pricing-2018-25.aspx), checked 7 November 2026). Every pilot, engineer and ground crew member you hire moves you toward the next band. Here the database is yours, and a new hire costs nothing.

Want the same thing with a web front end, or a phone form for staff to file reports? That is a customisation, and it is exactly what Enterprise DNA does: [book a call](https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=sms-pro).

It covers an air operator's safety management system in New Zealand or Australia: helicopter and scenic flight companies, charter and aerial work operators, flight schools and maintenance organisations, from 10 staff to a few hundred. Reports come in and are triaged; the class decides which notices the CAA (Civil Aviation Rules Part 12) or the ATSB (Transport Safety Investigation Act 2003) are owed, and each deadline is worked out on the base's own clock. Hazards are rated on the ICAO risk matrix, actions are checked by someone other than their owner, changes are assessed before they are approved, and indicators are measured per 1,000 flight hours, as Civil Aviation Rules Part 100 and CASR Part 119 expect.

## Why no front end

- The front end was only ever there because the database was hard to talk to. That is no longer true.
- Your data sits in plain Postgres tables you own. Any tool can read them. No export, no lock-in.
- No seats, no headcount bands, no add-ons. Read [docs/why-no-front-end.md](docs/why-no-front-end.md) for the honest trade-offs too.

## Quick start

Sixty seconds, no database install (an embedded Postgres runs inside Node):

```bash
git clone https://github.com/Enterprise-DNA-OS/aviation-safety-for-claude-code.git
cd aviation-safety-for-claude-code
npm install
npm run demo
```

Then open the folder in Claude Code and type `/attention`. Try `/notifications`, `/hazards` and `/insights` next.

### Use it with your own Postgres or Supabase

Copy `.env.example` to `.env`, set `DATABASE_URL`, then `npm run migrate`. Same commands, shared data, no per-seat fee.

## The commands

| Command | What it does |
|---|---|
| `/attention` | Regulator notices overdue or due, intolerable risks with no action, reports not triaged, investigations and actions late, findings with no action, actions not verified, audits overdue, hazards due for review, changes not assessed, training, indicators above alert and missing flight hours |
| `/compliance` | The records checked against the rules in [docs/compliance.md](docs/compliance.md), breaches first, each with its source |
| `/notifications` | Every notice the CAA or ATSB is owed, overdue first, with the rule and the deadline on the base's clock |
| `/file-report` | File an occurrence, hazard or suggestion, confidential if the reporter asks |
| `/triage` | Class and category a report, link its hazard, name an investigator, and see the notices now owed |
| `/notify` | Record a notice a person lodged, with the regulator's reference. Refuses a notice the report does not owe |
| `/hazards` | The hazard register, intolerable first, first and latest rating on the ICAO matrix |
| `/assess` | Rate a hazard's likelihood and severity; says whether it is intolerable, tolerable or acceptable |
| `/actions` | Open actions by due date, and done ones waiting to be verified |
| `/verify-action` | Someone other than the owner records whether it worked |
| `/change-status` | Approve a change only when its hazards are identified, assessed and none is intolerable |
| `/spis` | Safety performance indicators per 1,000 flight hours against target and alert |
| `/training` | SMS, human factors, investigation and dangerous goods training by role, expired first |
| `/weekly-review` | The Monday safety review, written to `drafts/` |
| `/draft-notice` | The occurrence details for the CAA or the written report for the ATSB, from the records |
| `/draft-bulletin` | A safety bulletin for staff from an investigated report, with no names |
| `/insights` | The ten questions below |

The working commands: `/add-person`, `/person-status`, `/add-aircraft`, `/log-hours`, `/investigation`, `/close-report`, `/add-hazard`, `/review-hazard`, `/close-hazard`, `/add-action`, `/action-done`, `/cancel-action`, `/add-audit`, `/audit-done`, `/add-finding`, `/add-change`, `/add-training`, `/add-spi`, `/set`, `/log`, `/draft-action-reminder`. The reads: `/reports`, `/report`, `/hazard`, `/audits`, `/audit`, `/changes`, `/people`, `/aircraft`, `/hours`, `/activity`. Plus `/import`, `/export`, `/view`, `/documents`, `/new-view` and `/customise`. 54 commands in all; [docs/cli.md](docs/cli.md) lists every option.

Names match case-insensitively. A partial name or reference works when it is unique; when it is not, the command lists the candidates and stops.

## The gates

- `/close-report` refuses a report that is not triaged, owes a notice nobody has recorded, has an investigator but no root cause, or has an action not yet verified.
- `/notify` refuses a notice the report does not owe and the wrong regulator for the base: a Cairns occurrence goes to the ATSB, a Milford one to the CAA.
- `/verify-action` refuses the action's own owner. `/triage` refuses an investigator who filed the report.
- `/change-status` refuses approval without the accountable manager or safety manager, without a hazard identified and assessed for the change, or with an intolerable one.
- A confidential report shows its reporter as confidential in every list, document and draft.

The software records and checks; the safety manager decides. It is not legal advice, and it lodges and sends nothing.

## Instead of SMS Pro

Save your report listing and hazard register as CSV, then import them, dry run first:

```bash
node scripts/safety.mjs import sms-pro hazards.csv --kind=hazards --actor="Your name" --dry-run
node scripts/safety.mjs import sms-pro reports.csv --kind=reports --base=ZQN --actor="Your name" --dry-run
```

Open reports come in as new, so each one is triaged and its notices worked out from the date it happened. The [switching guide](docs/replace-sms-pro.md) covers the headings it reads, `--map` for spreadsheets with other headings, what comes across and what does not. Imports are atomic: repeat rows are skipped and one bad row stops the whole file.

## Ten questions answered from your records

`/insights` runs all ten today.

1. Which open hazards are rated intolerable or tolerable and have no open action to bring the risk down?
2. Which report categories rose over the last 90 days against the 90 days before?
3. Which aircraft have the most reports per 100 flight hours over the last six months?
4. How long does each base take from a report to triage, and from triage to closure?
5. Which regulator notices went in late, and by how many hours, over the last 12 months?
6. Which finished actions actually brought a hazard's risk down, from the first rating to the latest?
7. Which actions were done more than the verify period ago and nobody has checked they worked?
8. How many safety reports does each base file per 1,000 flight hours, and how many are confidential?
9. Which safety performance indicators are above target or alert over the last three months?
10. Who is out of date on safety, human factors or dangerous goods training, or will be within 60 days?

## Your first hour: ten things to ask for

1. What needs my attention today?
2. Which CAA and ATSB notices are owed this week, and which are late?
3. Ben hit a gull on short final at Milford at 3.40 this afternoon. File it.
4. Triage R-0143 as a fuel hazard and link it to the drum fuel hazard.
5. Draft the CA005 details for the Homer Saddle cloud entry.
6. Which hazards are tolerable with nothing being done about them?
7. Rate the summer roster fatigue hazard again now the duty limits have changed.
8. Can we approve the night medevac change yet? What is missing?
9. Write this week's safety review for Monday's meeting.
10. Put our name, logo and certificate number on the occurrence reports and meeting pack through `/customise`.

## Verification

`npm test` runs every command on a temporary database with the demo operator: migrations, repeatable seed data, each base's own time zone, the CAA and ATSB deadlines by class and country (10 days, 14 days, 72 hours and the as-soon-as-practicable target), notices sent on time and late, refusals for the wrong regulator, a notice not owed and a missing reference, the ICAO matrix in every band, triage, investigation and the close-out gate, actions verified only by someone else, the change approval gate, training by role, indicators per 1,000 hours, confidential reports kept confidential, SMS Pro imports with dry run, repeats and rollback, drafts, export, the append-only activity log, database checks, views, documents and escaped HTML. Set `TEST_DATABASE_URL` to run the same checks on an empty Postgres database.

Read the [operating rules](CLAUDE.md), the [rules and sources](docs/compliance.md), the [selection evidence](docs/research.md) and [why there is no front end](docs/why-no-front-end.md).

## Architecture

```
aviation-safety-for-claude-code/
  CLAUDE.md                 how the operator wants this run (routing table + house rules)
  AGENTS.md                 the same, for Codex / OpenCode / Cursor / Gemini CLI
  .claude/commands/         the slash commands
  scripts/safety.mjs        the one CLI the commands drive
  scripts/lib/domain.mjs    its rules
  scripts/lib/db.mjs        one adapter: DATABASE_URL (pg) or embedded PGlite
  supabase/migrations/      plain SQL schema and views
  supabase/seed.sql         demo data (Southern Alps Air, fictional)
  views.json, documents.json  dashboards and documents in your brand
  docs/                     rules and sources, the switching guide, the CLI reference
```

## Built for coding agents

The database, CLI and command recipes work with Claude Code, Codex, OpenCode or Cursor. Ask your coding agent for a new command and have it implement and test the change against the same records.

## Contributing

Issues and pull requests are welcome. Keep the shape: plain SQL, a small CLI, a slash command per recurring job, no front end.

## Want it installed and run for you?

Enterprise DNA installs Aviation Safety for Claude Code for your operation, migrates your SMS Pro records, connects it to the rest of your tools, and runs it for you as part of **Omni**, our managed Command Center. One setup fee, then a monthly retainer.

- Book a call: [enterprisedna.co/omni/book](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=sms-pro)
- Read more: [enterprisedna.co/omni/instead-of/sms-pro](https://enterprisedna.co/omni/instead-of/sms-pro?utm_source=github&utm_medium=readme&utm_campaign=sms-pro)

## License

MIT. Copyright (c) 2026 Enterprise DNA.
