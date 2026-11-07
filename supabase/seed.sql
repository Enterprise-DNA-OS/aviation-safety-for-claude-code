-- A fictional scenic flight and charter operator: Southern Alps Air, with bases in Queenstown
-- and Milford Sound (New Zealand) and Cairns (Queensland). Dates are relative to today, so there
-- is always something overdue. Safe to run twice: every insert skips rows that already exist.

insert into bases (code, name, country, zone) values
  ('ZQN', 'Queenstown', 'NZ', 'Pacific/Auckland'),
  ('MFN', 'Milford Sound', 'NZ', 'Pacific/Auckland'),
  ('CNS', 'Cairns', 'AU', 'Australia/Brisbane')
on conflict (code) do nothing;

insert into people (code, name, role, base_id, email) values
  ('P-01', 'Helen Ward', 'accountable-manager', (select id from bases where code = 'ZQN'), 'helen@southernalps.example'),
  ('P-02', 'Rangi Parata', 'safety-manager', (select id from bases where code = 'ZQN'), 'rangi@southernalps.example'),
  ('P-03', 'Tom Gillies', 'chief-pilot', (select id from bases where code = 'ZQN'), 'tom@southernalps.example'),
  ('P-04', 'Aroha King', 'pilot', (select id from bases where code = 'ZQN'), 'aroha@southernalps.example'),
  ('P-05', 'Ben Hollis', 'pilot', (select id from bases where code = 'MFN'), 'ben@southernalps.example'),
  ('P-06', 'Sarah Lim', 'pilot', (select id from bases where code = 'CNS'), 'sarah@southernalps.example'),
  ('P-07', 'Matt Duncan', 'engineer', (select id from bases where code = 'ZQN'), 'matt@southernalps.example'),
  ('P-08', 'Josh Tane', 'engineer', (select id from bases where code = 'CNS'), 'josh@southernalps.example'),
  ('P-09', 'Lucy Fraser', 'ground-crew', (select id from bases where code = 'ZQN'), 'lucy@southernalps.example'),
  ('P-10', 'Kiri Watene', 'ground-crew', (select id from bases where code = 'MFN'), 'kiri@southernalps.example')
on conflict (code) do nothing;

insert into aircraft (rego, type, base_id) values
  ('ZK-HSA', 'Airbus AS350 B2', (select id from bases where code = 'ZQN')),
  ('ZK-HSB', 'Airbus AS350 B3', (select id from bases where code = 'ZQN')),
  ('ZK-HSC', 'Bell 407', (select id from bases where code = 'MFN')),
  ('ZK-SAF', 'Cessna 208 Caravan', (select id from bases where code = 'ZQN')),
  ('VH-SAH', 'Airbus AS350 B3', (select id from bases where code = 'CNS'))
on conflict (rego) do nothing;

-- Six full months of flight hours. Last month is missing for ZK-SAF on purpose.
insert into flight_hours (aircraft_id, month, hours)
select a.id, (date_trunc('month', current_date) - make_interval(months => m))::date, h.hours * (1 + (m % 3) * 0.1)
from aircraft a
join (values ('ZK-HSA', 62.0), ('ZK-HSB', 71.0), ('ZK-HSC', 48.0), ('ZK-SAF', 55.0), ('VH-SAH', 66.0)) as h(rego, hours) on h.rego = a.rego
cross join generate_series(1, 6) as m
where not (a.rego = 'ZK-SAF' and m = 1)
on conflict (aircraft_id, month) do nothing;

-- A change to the operation, proposed and not yet assessed, and one approved.
insert into changes (ref, title, description, owner_id, status, approved_by, approved_on) values
  ('MOC-07', 'Night medevac standby from Queenstown', 'Offer night patient transfer from Queenstown to Dunedin under NVIS from next season.', (select id from people where code = 'P-03'), 'proposed', null, null),
  ('MOC-06', 'New Milford Sound landing site on the Tutoko glacier', 'Add a glacier landing to the Milford scenic product.', (select id from people where code = 'P-03'), 'approved', (select id from people where code = 'P-01'), current_date - 40)
on conflict (ref) do nothing;

insert into hazards (ref, title, description, area, owner_id, change_id, last_reviewed) values
  ('H-001', 'Wire strike in the Shotover and Kawarau valleys', 'Unmarked power and stock wires across low-level scenic routes.', 'flight-ops', (select id from people where code = 'P-03'), null, current_date - 60),
  ('H-002', 'Bird strike on Milford Sound approach', 'Black-backed gulls and kea around the Milford aerodrome and fiord.', 'wildlife', (select id from people where code = 'P-05'), null, current_date - 200),
  ('H-003', 'Rapidly closing weather in Fiordland', 'Cloud and rain closing the Homer Saddle and fiords within minutes.', 'weather', (select id from people where code = 'P-03'), null, current_date - 30),
  ('H-004', 'Passengers walking into the tail rotor area', 'Passengers moving around the aircraft on unprepared landing sites.', 'passengers', (select id from people where code = 'P-09'), null, current_date - 90),
  ('H-005', 'Pilot fatigue in peak summer rosters', 'Long duty days with many short sectors from December to February.', 'fatigue', (select id from people where code = 'P-03'), null, current_date - 210),
  ('H-006', 'Glacier landing whiteout and crevasses', 'Flat light and hidden crevasses on the new Tutoko glacier site.', 'flight-ops', (select id from people where code = 'P-05'), (select id from changes where ref = 'MOC-06'), current_date - 45),
  ('H-007', 'Fuel contamination from drum stock at Cairns', 'Water in drum fuel kept for remote reef pad refuelling.', 'maintenance', (select id from people where code = 'P-08'), null, current_date - 20),
  ('H-008', 'Drone activity near scenic routes', 'Recreational drones over Queenstown lakefront and Milford.', 'airspace', (select id from people where code = 'P-02'), null, current_date - 15)
on conflict (ref) do nothing;

insert into risk_assessments (hazard_id, assessed_on, likelihood, severity, controls, assessed_by)
select h.id, current_date - x.days_ago, x.l, x.s, x.controls, (select id from people where code = 'P-02')
from (values
  ('H-001', 120, 4, 'A', 'Wire maps on board'),
  ('H-001', 60, 2, 'A', 'Wire maps on board, minimum heights on routes, wire hazard briefing'),
  ('H-002', 200, 3, 'C', 'Bird activity noted in the daily brief'),
  ('H-003', 30, 3, 'B', 'Weather minima, two-pilot decision on doubtful days'),
  ('H-004', 90, 3, 'A', 'Passenger safety briefing'),
  ('H-005', 210, 4, 'B', 'Duty limits in the exposition'),
  ('H-006', 45, 3, 'A', 'Route survey flown, glacier training planned'),
  ('H-007', 20, 2, 'B', 'Water-finding paste on every drum')
) as x(ref, days_ago, l, s, controls)
join hazards h on h.ref = x.ref
where not exists (select 1 from risk_assessments r where r.hazard_id = h.id and r.assessed_on = current_date - x.days_ago);

-- Safety reports. Times are written on each base's own clock.
insert into reports (ref, kind, title, description, occurred_at, reported_at, base_id, aircraft_id, reporter_id, confidential, category, class, status,
  triaged_at, triaged_by, hazard_id, investigator_id, investigation_due, root_cause, investigated_on, outcome, closed_at)
select x.ref, x.kind, x.title, x.description,
  ((current_date - x.days_ago)::timestamp + x.at::time) at time zone b.zone,
  ((current_date - x.days_ago)::timestamp + x.at::time) at time zone b.zone + make_interval(hours => x.report_lag),
  b.id, (select id from aircraft where rego = x.rego), (select id from people where code = x.reporter), x.confidential, x.category, x.class, x.status,
  case when x.status <> 'new' then ((current_date - x.days_ago)::timestamp + x.at::time) at time zone b.zone + interval '20 hours' end,
  case when x.status <> 'new' then (select id from people where code = 'P-02') end,
  (select id from hazards where ref = x.hazard), (select id from people where code = x.investigator),
  case when x.inv_due is not null then current_date + x.inv_due end, x.root_cause,
  case when x.root_cause is not null then current_date - x.days_ago + 9 end, x.outcome,
  case when x.status = 'closed' then ((current_date - x.days_ago)::timestamp + x.at::time) at time zone b.zone + interval '30 days' end
from (values
  ('R-0141', 'occurrence', 'Gull strike on short final, Milford', 'Gull struck the windscreen on short final to the Milford aerodrome. Landed normally, windscreen cracked.', 6, '15:40', 2, 'MFN', 'ZK-HSC', 'P-05', false, 'bird-strike', 'serious', 'triaged', 'H-002', 'P-02', 20, null, null),
  ('R-0142', 'occurrence', 'Tail rotor guard struck by a passenger''s bag, Coronet Peak site', 'A passenger swung a daypack into the tail rotor guard while walking aft on a snow landing. Rotor stopped, no contact with blades.', 25, '11:05', 1, 'ZQN', 'ZK-HSA', 'P-09', false, 'passenger', 'incident', 'triaged', 'H-004', 'P-02', -3, null, null),
  ('R-0143', 'hazard', 'Fuel drum at the Green Island pad showed water', 'Water-finding paste turned red on drum 14 before refuelling at the Green Island pad.', 2, '09:15', 1, 'CNS', 'VH-SAH', 'P-08', false, null, null, 'new', null, null, null, null, null),
  ('R-0144', 'occurrence', 'Rotor overspeed during autorotation recovery, Cairns training', 'Rotor RPM exceeded the limit for about two seconds during a practice autorotation recovery.', 4, '14:30', 3, 'CNS', 'VH-SAH', 'P-06', false, 'technical', 'incident', 'triaged', null, 'P-02', 24, null, null),
  ('R-0145', 'hazard', 'Rostered six days straight in the Christmas peak', 'Summer roster has three pilots on six-day stretches of 10-hour duty days.', 9, '18:00', 1, 'ZQN', null, 'P-04', true, null, null, 'new', null, null, null, null, null),
  ('R-0146', 'occurrence', 'Drone seen at 400 ft over Queenstown Bay', 'Drone passed within 200 m of ZK-HSB on the lakefront departure.', 40, '13:10', 2, 'ZQN', 'ZK-HSB', 'P-04', false, 'airspace', 'incident', 'closed', 'H-008', 'P-02', -20, 'No drone notice in the briefing; lakefront has no published drone restriction.', 'Reported to CAA and the council; NOTAM checks added to the daily brief.'),
  ('R-0147', 'occurrence', 'Inadvertent cloud entry near the Homer Saddle', 'Cloud closed behind the aircraft; pilot climbed out on instruments and returned to Milford.', 18, '16:20', 4, 'MFN', 'ZK-HSC', 'P-05', false, 'weather', 'serious', 'triaged', 'H-003', 'P-03', 10, null, null),
  ('R-0148', 'suggestion', 'Paint the walkway to the Caravan float', 'A painted walkway would keep passengers clear of the float strut and prop.', 12, '10:00', 2, 'ZQN', 'ZK-SAF', 'P-09', false, 'passenger', 'none', 'triaged', 'H-004', null, null, null, null),
  ('R-0139', 'occurrence', 'Kea strike on departure from Milford', 'Kea struck the left skid gear on lift-off from the Milford pad. Gear inspected, no damage.', 70, '09:50', 1, 'MFN', 'ZK-HSC', 'P-05', false, 'bird-strike', 'incident', 'closed', 'H-002', 'P-02', -55, 'Kea feeding on scraps left near the pad by visitors.', 'Pad bins fitted with lids; kea activity added to the Milford brief.'),
  ('R-0140', 'occurrence', 'Gull strike at 500 ft over Milford Sound', 'Gull struck the main rotor at 500 ft over the fiord. Blade inspected, minor paint damage.', 40, '12:15', 1, 'MFN', 'ZK-HSC', 'P-05', false, 'bird-strike', 'incident', 'closed', 'H-002', 'P-02', -25, 'Gulls gather over the fishing boats at the wharf from noon.', 'Departure track moved east of the wharf between 11:00 and 14:00.'),
  ('R-0149', 'occurrence', 'Fuel cap left off after refuelling, Queenstown', 'Fuel cap found loose on the walk-round before the first flight.', 60, '07:30', 1, 'ZQN', 'ZK-HSA', 'P-07', false, 'maintenance', 'incident', 'closed', null, 'P-02', -40, 'Refueller interrupted by a phone call; no cap check in the refuel procedure.', 'Cap check added to the refuel card; refuellers briefed.')
) as x(ref, kind, title, description, days_ago, at, report_lag, base, rego, reporter, confidential, category, class, status, hazard, investigator, inv_due, root_cause, outcome)
join bases b on b.code = x.base
on conflict (ref) do nothing;

-- Notices already given. R-0141 (serious, NZ) had its initial call but no details yet; R-0144 (AU) has no written report.
insert into notifications (report_id, authority, kind, sent_at, reference, by_id)
select r.id, x.authority, x.kind, r.occurred_at + make_interval(hours => x.after_hours), x.reference, (select id from people where code = 'P-02')
from (values
  ('R-0141', 'CAA', 'initial', 3, null),
  ('R-0139', 'CAA', 'details', 100, 'CAA OCC 26/3011'),
  ('R-0140', 'CAA', 'details', 150, 'CAA OCC 26/3297'),
  ('R-0142', 'CAA', 'details', 200, 'CAA OCC 26/3871'),
  ('R-0146', 'CAA', 'details', 30, 'CAA OCC 26/3402'),
  ('R-0147', 'CAA', 'initial', 2, null),
  ('R-0149', 'CAA', 'details', 400, 'CAA OCC 26/3105')
) as x(ref, authority, kind, after_hours, reference)
join reports r on r.ref = x.ref
on conflict (report_id, authority, kind) do nothing;

insert into audits (ref, title, area, base_id, auditor_id, scheduled_on, done_on, summary) values
  ('AU-11', 'Milford base ramp and refuelling', 'ground-ops', (select id from bases where code = 'MFN'), (select id from people where code = 'P-02'), current_date - 50, current_date - 48, 'Ramp layout and fuel quality checks sampled over two days.'),
  ('AU-12', 'Training records against the exposition', 'organisational', (select id from bases where code = 'ZQN'), (select id from people where code = 'P-02'), current_date - 10, null, null),
  ('AU-13', 'Cairns base maintenance control', 'maintenance', (select id from bases where code = 'CNS'), (select id from people where code = 'P-02'), current_date + 21, null, null)
on conflict (ref) do nothing;

insert into findings (ref, audit_id, level, description) values
  ('F-11-1', (select id from audits where ref = 'AU-11'), 'major', 'Fuel drum water checks not recorded for 9 of 30 days sampled.'),
  ('F-11-2', (select id from audits where ref = 'AU-11'), 'minor', 'No passenger holding line painted at the Milford ramp.'),
  ('F-11-3', (select id from audits where ref = 'AU-11'), 'observation', 'Fire extinguisher at the fuel bay due for service next month.')
on conflict (ref) do nothing;

insert into actions (ref, description, report_id, hazard_id, finding_id, change_id, owner_id, due_on, status, done_on, done_note, verified_by, verified_on, effective)
select x.ref, x.description, (select id from reports where ref = x.report), (select id from hazards where ref = x.hazard), (select id from findings where ref = x.finding),
  (select id from changes where ref = x.change), (select id from people where code = x.owner), current_date + x.due, x.status,
  case when x.done is not null then current_date + x.done end, x.note, (select id from people where code = x.verifier),
  case when x.verifier is not null then current_date + x.done + 5 end, x.effective
from (values
  ('CA-031', 'Add wire hazard maps for the Shotover route to every aircraft tablet', null, 'H-001', null, null, 'P-03', -70, 'verified', -75, 'Maps loaded on all five tablets.', 'P-02', true),
  ('CA-032', 'Fit a bird radar or bird-scaring routine at Milford with the aerodrome operator', 'R-0141', 'H-002', null, null, 'P-05', 14, 'open', null, null, null, null),
  ('CA-033', 'Brief every passenger at the aircraft on the tail rotor, with a ground crew escort on snow sites', 'R-0142', 'H-004', null, null, 'P-09', -6, 'open', null, null, null, null),
  ('CA-034', 'Record drum fuel water checks on the daily fuel sheet at Milford', null, null, 'F-11-1', null, 'P-10', -30, 'done', -33, 'Daily fuel sheet updated and in use.', null, null),
  ('CA-035', 'Add NOTAM and drone checks to the daily brief', 'R-0146', 'H-008', null, null, 'P-02', -25, 'verified', -28, 'Daily brief template updated.', 'P-03', true),
  ('CA-036', 'Add a cap check to the refuel card', 'R-0149', null, null, null, 'P-07', -45, 'verified', -48, 'Refuel card revision 4 issued.', 'P-02', true),
  ('CA-037', 'Glacier landing training and a crevasse probe kit for each glacier aircraft', null, 'H-006', null, 'MOC-06', 'P-05', -2, 'open', null, null, null, null)
) as x(ref, description, report, hazard, finding, change, owner, due, status, done, note, verifier, effective)
on conflict (ref) do nothing;

insert into spis (code, name, category, class_min, target_per_1000, alert_per_1000) values
  ('SPI-1', 'Reportable occurrences', null, 'incident', 8.00, 15.00),
  ('SPI-2', 'Bird strikes', 'bird-strike', null, 1.00, 2.00),
  ('SPI-3', 'Weather-related occurrences', 'weather', null, 2.00, 4.00),
  ('SPI-4', 'Safety reports filed (all kinds)', null, null, 20.00, 60.00)
on conflict (code) do nothing;

insert into training (person_id, course, completed_on, provider)
select p.id, x.course, current_date - x.days_ago, x.provider
from (values
  ('P-01', 'sms', 400, 'In house'), ('P-02', 'sms', 300, 'Aviation safety course'), ('P-02', 'investigation', 500, 'Investigation course'),
  ('P-03', 'sms', 380, 'In house'), ('P-03', 'human-factors', 700, 'In house'),
  ('P-04', 'sms', 200, 'In house'), ('P-04', 'human-factors', 200, 'In house'), ('P-04', 'dangerous-goods', 710, 'DG provider'),
  ('P-05', 'sms', 760, 'In house'), ('P-05', 'human-factors', 300, 'In house'), ('P-05', 'dangerous-goods', 300, 'DG provider'),
  ('P-06', 'sms', 100, 'In house'), ('P-06', 'human-factors', 100, 'In house'), ('P-06', 'dangerous-goods', 100, 'DG provider'),
  ('P-07', 'sms', 150, 'In house'), ('P-07', 'human-factors', 150, 'In house'),
  ('P-08', 'sms', 250, 'In house'), ('P-08', 'human-factors', 250, 'In house'),
  ('P-09', 'sms', 90, 'In house'), ('P-09', 'dangerous-goods', 90, 'DG provider'),
  ('P-10', 'sms', 60, 'In house')
) as x(code, course, days_ago, provider)
join people p on p.code = x.code
on conflict (person_id, course, completed_on) do nothing;

insert into activity (actor, action, ref, detail)
select 'Seed', 'seed', 'demo', 'Southern Alps Air demo data loaded'
where not exists (select 1 from activity where action = 'seed');
