# Rules and sources

`/compliance` checks the records against these rules. Each row says where the rule comes from, what a breach looks like in the data, and where it is checked. Laws and rules are checked as such; house rules are the operator's own limits, changed with `set`, and are never reported as law.

Nothing here is legal advice. It records the rules the operator has asked the system to enforce. The Civil Aviation Rules are being realigned under the Civil Aviation Act 2023, and CASA has proposed a new CASR Part 5 for safety management. If a rule changes, update this page and the check together (`/customise`), then run `npm test`.

## Notices to the regulator

| Rule | Source | Breach in the data | Checked in |
|---|---|---|---|
| New Zealand: notify the CAA of an accident as soon as practicable | Civil Aviation Rules 12.51 (Initial notification of accident) | A report classed `accident` at an NZ base with no `CAA initial` notice after the house target (`asap_hours`, default 24) | `v_notifications`; `/attention` |
| New Zealand: give the CAA the details of an accident within 10 days, on form CA005 or another way the CAA accepts | Civil Aviation Rules 12.53 (Full notification of accident details) | An NZ `accident` with no `CAA details` notice 10 days after it happened | `v_notifications` |
| New Zealand: notify the CAA of a serious incident as soon as practicable | Civil Aviation Rules 12.55 | An NZ `serious` report with no `CAA initial` notice after `asap_hours` | `v_notifications` |
| New Zealand: give the CAA the details of an incident within 14 days, on form CA005 or CA005D or another way the CAA accepts | Civil Aviation Rules 12.57; CAA Advisory Circular AC012-1 | An NZ `incident` or `serious` report with no `CAA details` notice 14 days after it happened | `v_notifications`; the demo's cloud entry near the Homer Saddle is overdue |
| Australia: report an immediately reportable matter to the ATSB by phone as soon as reasonably practicable | Transport Safety Investigation Act 2003 s 18; Transport Safety Investigation Regulations 2021; AIP ENR 1.14 | An `accident` or `serious` report at an AU base with no `ATSB initial` notice after `asap_hours` | `v_notifications` |
| Australia: give the ATSB a written report within 72 hours, for immediately and routine reportable matters | Transport Safety Investigation Act 2003 s 19; AIP ENR 1.14; ATSB, About mandatory occurrence reporting | An AU `incident`, `serious` or `accident` with no `ATSB written` notice 72 hours after it happened | `v_notifications`; the demo's Cairns rotor overspeed is overdue |

How the class maps: `accident` and `serious` (an incident where an accident nearly occurred) are immediately reportable matters in Australia; `incident` is a routine reportable matter. Which events are reportable is set out in the Part 12 definitions and in the TSI Regulations 2021 lists for each kind of operation. The safety manager decides the class at triage; the system never guesses it.

Deadlines run from the time it happened, on the base's own clock. "As soon as practicable" has no fixed hours in law; `asap_hours` is the house target that raises it.

## The safety management system

| Rule | Source | Breach in the data | Checked in |
|---|---|---|---|
| A process for risk management that identifies hazards and evaluates and manages the risks | Civil Aviation Rules 100.3(a)(2); CASR Part 119 Subpart 119.F and Division 138.B.6 (Australian air transport and aerial work operators); ICAO Annex 19, Appendix 2, element 2 | An open hazard never assessed; an intolerable hazard with no open action; a hazard past its review date (`hazard_review_days`) | `v_hazards`, `v_attention`; `/compliance` |
| Safety assurance: goals for improving safety are set and their attainment is measured | Civil Aviation Rules 100.3(a)(3) | No safety performance indicators; an indicator above its alert level; an aircraft with no flight hours for last month, so the rate cannot be measured | `v_spis`, `v_attention` |
| A change is assessed for the hazards it brings before it is made | ICAO Annex 19, Appendix 2, element 3.2 (management of change); CAA AC100-1 | A change approved or implemented with no assessed hazard linked to it; a proposed change with none yet | `change-status` refuses approval; `/compliance` |
| Staff are trained for their safety duties | ICAO Annex 19, Appendix 2, element 4.1 (training and education) | A required course (by role, in `training_rules`) never done or expired | `v_training` |
| The system fits the size and complexity of the operation, and its processes are documented | Civil Aviation Rules 100.3(b) and (c) | Not a records check: your exposition says how you run it | `CLAUDE.md` (who this is for) |

## The risk matrix

Risk is likelihood (1 extremely improbable, 2 improbable, 3 remote, 4 occasional, 5 frequent) and severity (A catastrophic, B hazardous, C major, D minor, E negligible), on the safety risk tolerability matrix in the ICAO Safety Management Manual (Doc 9859):

- **Intolerable:** 5A, 5B, 5C, 4A, 4B, 3A. The operation exposed to the hazard is stopped or restricted until actions bring the risk down.
- **Tolerable:** 5D, 5E, 4C, 4D, 4E, 3B, 3C, 3D, 2A, 2B, 2C, 1A. Accepted only with mitigation, and the actions recorded.
- **Acceptable:** everything else.

The bands live in one database function, `risk_band()`. If your exposition uses a different matrix, change it with `/customise`.

## House rules (yours to change with `set`)

| Setting | Default | What it raises |
|---|---|---|
| `triage_days` | 2 | A report not triaged within this many days |
| `asap_hours` | 24 | A notice the law says to give as soon as practicable |
| `investigation_days` | 28 | Days from triage to a finished investigation |
| `verify_days` | 14 | A done action nobody has checked |
| `hazard_review_days` | 180 | A hazard not reviewed |
| `warn_days` | 30 | Training expiring soon |

## The gates

- `close-report` refuses a report that is not triaged, owes a notice not recorded, has an investigator but no root cause, or has an action not verified.
- `notify` refuses a notice the report does not owe and the wrong regulator for the base.
- `verify-action` refuses the action's own owner. Someone else checks it worked.
- `triage` refuses an investigator who filed the report.
- `change-status` refuses approval without the accountable manager or safety manager, without an assessed hazard, or with an intolerable one; it refuses implemented before approved, and closed with actions not verified.
- A confidential report never shows its reporter in a list, a document or a draft.

## Sources

- Civil Aviation Rules Part 12, Accidents, Incidents, and Statistics (consolidation): https://www.aviation.govt.nz/assets/rules/consolidations/Part_012_Consolidation.pdf
- CAA Advisory Circular AC012-1: https://www.aviation.govt.nz/assets/rules/advisory-circulars/AC012-1.pdf
- Civil Aviation Rules Part 100, Safety Management: https://www.aviation.govt.nz/rules/rule-part/part-100/full-rule-part/
- CAA Advisory Circular AC100-1, Safety Management: https://www.aviation.govt.nz/assets/rules/advisory-circulars/AC100-1.pdf
- ATSB, About mandatory occurrence reporting: https://www.atsb.gov.au/node/182
- AIP ENR 1.14, Air traffic incidents and reportable matters: https://www.atsb.gov.au/sites/default/files/2022-11/ENR%201.14.pdf
- CASA, Part 119 of CASR: https://www.casa.gov.au/rules/regulatory-framework/casr/part-119-casr-australian-air-transport-operators-certification-and-management
- CASA, Part 5 of CASR, Safety Management Systems (proposed): https://www.casa.gov.au/rules/regulatory-framework/casr/part-5-casr-safety-management-systems

Checked 7 November 2026.
