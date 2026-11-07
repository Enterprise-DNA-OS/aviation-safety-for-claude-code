-- Aviation Safety for Claude Code: an air operator's safety management system in plain tables.
-- Bases and their country, people and aircraft, flight hours, safety reports (hazards and
-- occurrences) with the notifications the regulator is owed, the hazard register and its risk
-- assessments, corrective actions, audits and findings, safety performance indicators,
-- management of change, training, and an append-only activity log.
-- Occurrence times are stored as timestamptz and read and written on the base's own clock.

create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ------------------------------------------------------------------ settings (house rules)

create table if not exists settings (
  key text primary key,
  value text not null,
  note text,
  updated_at timestamptz not null default now()
);

create or replace function setting_num(k text) returns numeric language sql stable as $$
  select value::numeric from settings where key = k
$$;

insert into settings (key, value, note) values
  ('triage_days', '2', 'A new report is triaged by the safety manager within this many days.'),
  ('asap_hours', '24', 'House target for a notice the law says to give as soon as practicable.'),
  ('investigation_days', '28', 'Days from triage to a finished investigation, when one is needed.'),
  ('verify_days', '14', 'Days a finished action may wait for someone else to check it worked.'),
  ('hazard_review_days', '180', 'Days between reviews of each open hazard.'),
  ('warn_days', '30', 'How far ahead training expiries and due dates are raised.')
on conflict (key) do nothing;

-- ------------------------------------------------------------------ bases, people, aircraft

create table if not exists bases (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  country text not null check (country in ('NZ', 'AU')),
  zone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  role text not null check (role in ('accountable-manager', 'safety-manager', 'chief-pilot', 'pilot', 'engineer', 'ground-crew', 'office')),
  base_id uuid references bases(id),
  email text,
  status text not null default 'active' check (status in ('active', 'left')),
  external_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists aircraft (
  id uuid primary key default gen_random_uuid(),
  rego text not null unique,
  type text not null,
  base_id uuid references bases(id),
  status text not null default 'active' check (status in ('active', 'sold', 'stored')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists flight_hours (
  id uuid primary key default gen_random_uuid(),
  aircraft_id uuid not null references aircraft(id),
  month date not null check (extract(day from month) = 1),
  hours numeric(7,1) not null check (hours >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (aircraft_id, month)
);

-- ------------------------------------------------------------------ hazards and risk

create table if not exists changes (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  title text not null,
  description text,
  owner_id uuid references people(id),
  status text not null default 'proposed' check (status in ('proposed', 'approved', 'implemented', 'closed', 'withdrawn')),
  approved_by uuid references people(id),
  approved_on date,
  implemented_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hazards (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  title text not null,
  description text,
  area text not null check (area in ('flight-ops', 'maintenance', 'ground-ops', 'passengers', 'weather', 'airspace', 'wildlife', 'fatigue', 'organisational', 'other')),
  owner_id uuid references people(id),
  change_id uuid references changes(id),
  status text not null default 'open' check (status in ('open', 'closed')),
  last_reviewed date not null default current_date,
  closed_reason text,
  external_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ICAO Safety Management Manual (Doc 9859) matrix: likelihood 1 (extremely improbable) to 5
-- (frequent), severity A (catastrophic) to E (negligible).
create or replace function risk_band(likelihood int, severity text) returns text language sql immutable as $$
  select case
    when likelihood::text || severity in ('5A', '5B', '5C', '4A', '4B', '3A') then 'intolerable'
    when likelihood::text || severity in ('5D', '5E', '4C', '4D', '4E', '3B', '3C', '3D', '2A', '2B', '2C', '1A') then 'tolerable'
    when likelihood between 1 and 5 and severity in ('A', 'B', 'C', 'D', 'E') then 'acceptable'
  end
$$;

create table if not exists risk_assessments (
  id uuid primary key default gen_random_uuid(),
  hazard_id uuid not null references hazards(id),
  assessed_on date not null default current_date,
  likelihood int not null check (likelihood between 1 and 5),
  severity text not null check (severity in ('A', 'B', 'C', 'D', 'E')),
  controls text,
  assessed_by uuid references people(id),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ safety reports

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  kind text not null check (kind in ('occurrence', 'hazard', 'suggestion')),
  title text not null,
  description text,
  occurred_at timestamptz not null,
  reported_at timestamptz not null default now(),
  base_id uuid not null references bases(id),
  aircraft_id uuid references aircraft(id),
  reporter_id uuid references people(id),
  confidential boolean not null default false,
  category text check (category in ('airspace', 'bird-strike', 'cfit-terrain', 'fuel', 'ground-handling', 'maintenance', 'passenger',
    'runway-landing-site', 'technical', 'weather', 'fatigue', 'dangerous-goods', 'procedures', 'other')),
  class text check (class in ('none', 'incident', 'serious', 'accident')),
  status text not null default 'new' check (status in ('new', 'triaged', 'closed')),
  triaged_at timestamptz,
  triaged_by uuid references people(id),
  hazard_id uuid references hazards(id),
  investigator_id uuid references people(id),
  investigation_due date,
  root_cause text,
  investigated_on date,
  outcome text,
  closed_at timestamptz,
  external_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status = 'new' or (class is not null and category is not null and triaged_at is not null)),
  check (kind <> 'occurrence' or status = 'new' or class is not null)
);

-- Notifications given to the regulator: one row per notice actually given.
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id),
  authority text not null check (authority in ('CAA', 'ATSB')),
  kind text not null check (kind in ('initial', 'details', 'written')),
  sent_at timestamptz not null,
  reference text,
  by_id uuid references people(id),
  created_at timestamptz not null default now(),
  unique (report_id, authority, kind)
);

-- ------------------------------------------------------------------ audits and actions

create table if not exists audits (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  title text not null,
  area text not null,
  base_id uuid references bases(id),
  auditor_id uuid references people(id),
  scheduled_on date not null,
  done_on date,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists findings (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  audit_id uuid not null references audits(id),
  level text not null check (level in ('major', 'minor', 'observation')),
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists actions (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  description text not null,
  report_id uuid references reports(id),
  hazard_id uuid references hazards(id),
  finding_id uuid references findings(id),
  change_id uuid references changes(id),
  owner_id uuid not null references people(id),
  due_on date not null,
  status text not null default 'open' check (status in ('open', 'done', 'verified', 'cancelled')),
  done_on date,
  done_note text,
  verified_by uuid references people(id),
  verified_on date,
  effective boolean,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (report_id is not null or hazard_id is not null or finding_id is not null or change_id is not null),
  check (status not in ('done', 'verified') or (done_on is not null and done_note is not null)),
  check (status <> 'verified' or (verified_by is not null and verified_by <> owner_id and verified_on is not null and effective is not null)),
  check (status <> 'cancelled' or cancel_reason is not null)
);

-- ------------------------------------------------------------------ indicators and training

create table if not exists spis (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text,
  class_min text check (class_min in ('incident', 'serious', 'accident')),
  target_per_1000 numeric(7,2) not null,
  alert_per_1000 numeric(7,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (alert_per_1000 >= target_per_1000)
);

create table if not exists training_rules (
  role text not null,
  course text not null,
  months_valid int not null check (months_valid > 0),
  primary key (role, course)
);

create table if not exists training (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people(id),
  course text not null,
  completed_on date not null,
  expires_on date,
  provider text,
  created_at timestamptz not null default now(),
  unique (person_id, course, completed_on)
);

insert into training_rules (role, course, months_valid) values
  ('accountable-manager', 'sms', 36), ('safety-manager', 'sms', 24), ('safety-manager', 'investigation', 36),
  ('chief-pilot', 'sms', 24), ('chief-pilot', 'human-factors', 24),
  ('pilot', 'sms', 24), ('pilot', 'human-factors', 24), ('pilot', 'dangerous-goods', 24),
  ('engineer', 'sms', 24), ('engineer', 'human-factors', 24),
  ('ground-crew', 'sms', 24), ('ground-crew', 'dangerous-goods', 24)
on conflict do nothing;

-- ------------------------------------------------------------------ activity log (append only)

create table if not exists activity (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text not null,
  action text not null,
  ref text,
  detail text
);

create or replace function activity_append_only() returns trigger language plpgsql as $$
begin
  raise exception 'the activity log is append-only';
end $$;

drop trigger if exists activity_no_change on activity;
create trigger activity_no_change before update or delete on activity for each row execute function activity_append_only();

do $$
declare t text;
begin
  foreach t in array array['settings', 'bases', 'people', 'aircraft', 'flight_hours', 'changes', 'hazards', 'reports', 'audits', 'actions', 'spis'] loop
    execute format('drop trigger if exists %I_touch on %I', t, t);
    execute format('create trigger %I_touch before update on %I for each row execute function touch_updated_at()', t, t);
  end loop;
  foreach t in array array['settings', 'bases', 'people', 'aircraft', 'flight_hours', 'changes', 'hazards', 'risk_assessments', 'reports',
    'notifications', 'audits', 'findings', 'actions', 'spis', 'training_rules', 'training', 'activity'] loop
    execute format('alter table %I enable row level security', t);
    execute format('revoke all on %I from public', t);
  end loop;
end $$;

-- ------------------------------------------------------------------ views

-- Every report on its base's clock, the reporter hidden when the report is confidential.
create or replace view v_reports as
select r.*, b.code as base, b.country, b.zone,
  to_char(r.occurred_at at time zone b.zone, 'YYYY-MM-DD HH24:MI') as occurred_local,
  a.rego as aircraft,
  case when r.confidential then 'confidential' else p.name end as reporter,
  h.ref as hazard,
  i.name as investigator,
  round(extract(epoch from (now() - r.reported_at)) / 86400.0, 1) as days_open
from reports r
join bases b on b.id = r.base_id
left join aircraft a on a.id = r.aircraft_id
left join people p on p.id = r.reporter_id
left join hazards h on h.id = r.hazard_id
left join people i on i.id = r.investigator_id;

-- The notices the law asks for, from each report's class and its base's country, and whether each was given.
-- NZ: Civil Aviation Rules Part 12. AU: Transport Safety Investigation Act 2003 ss 18-19.
create or replace view v_notifications as
with need as (
  select r.id as report_id, r.ref, r.occurred_at, r.country, r.zone, x.authority, x.kind, x.due_at, x.rule, x.asap
  from v_reports r
  cross join lateral (values
    ('CAA', 'initial', r.occurred_at + make_interval(hours => setting_num('asap_hours')::int), 'Civil Aviation Rules 12.51: notify an accident as soon as practicable', true, r.country = 'NZ' and r.class = 'accident'),
    ('CAA', 'details', r.occurred_at + interval '10 days', 'Civil Aviation Rules 12.53: accident details within 10 days', false, r.country = 'NZ' and r.class = 'accident'),
    ('CAA', 'initial', r.occurred_at + make_interval(hours => setting_num('asap_hours')::int), 'Civil Aviation Rules 12.55: notify a serious incident as soon as practicable', true, r.country = 'NZ' and r.class = 'serious'),
    ('CAA', 'details', r.occurred_at + interval '14 days', 'Civil Aviation Rules 12.57: incident details within 14 days', false, r.country = 'NZ' and r.class in ('serious', 'incident')),
    ('ATSB', 'initial', r.occurred_at + make_interval(hours => setting_num('asap_hours')::int), 'TSI Act 2003 s 18: immediately reportable matter by phone as soon as practicable', true, r.country = 'AU' and r.class in ('accident', 'serious')),
    ('ATSB', 'written', r.occurred_at + interval '72 hours', 'TSI Act 2003 s 19: written report within 72 hours', false, r.country = 'AU' and r.class in ('accident', 'serious', 'incident'))
  ) as x(authority, kind, due_at, rule, asap, applies)
  where x.applies
)
select n.report_id, n.ref, n.authority, n.kind, n.rule, n.asap,
  to_char(n.due_at at time zone n.zone, 'YYYY-MM-DD HH24:MI') as due_local, n.due_at,
  s.sent_at, s.reference,
  to_char(s.sent_at at time zone n.zone, 'YYYY-MM-DD HH24:MI') as sent_local,
  case when s.id is not null and s.sent_at > n.due_at then 'sent late'
       when s.id is not null then 'sent'
       when now() > n.due_at then 'overdue'
       else 'due' end as standing,
  case when s.id is not null then round(extract(epoch from (s.sent_at - n.due_at)) / 3600.0, 1) end as hours_late
from need n
left join notifications s on s.report_id = n.report_id and s.authority = n.authority and s.kind = n.kind;

create or replace view v_risk_latest as
select distinct on (ra.hazard_id) ra.hazard_id, ra.assessed_on, ra.likelihood, ra.severity,
  ra.likelihood::text || ra.severity as risk, risk_band(ra.likelihood, ra.severity) as band, ra.controls
from risk_assessments ra
order by ra.hazard_id, ra.assessed_on desc, ra.created_at desc;

create or replace view v_risk_first as
select distinct on (ra.hazard_id) ra.hazard_id, ra.likelihood::text || ra.severity as risk, risk_band(ra.likelihood, ra.severity) as band
from risk_assessments ra
order by ra.hazard_id, ra.assessed_on, ra.created_at;

create or replace view v_hazards as
select h.id, h.ref, h.title, h.area, h.status, p.name as owner, c.ref as change,
  l.risk, l.band, l.assessed_on, f.risk as first_risk,
  h.last_reviewed, h.last_reviewed + setting_num('hazard_review_days')::int as review_due,
  (select count(*)::int from actions a where a.hazard_id = h.id and a.status in ('open', 'done')) as open_actions,
  (select count(*)::int from reports r where r.hazard_id = h.id) as reports,
  case l.band when 'intolerable' then 1 when 'tolerable' then 2 when 'acceptable' then 3 else 0 end as band_rank
from hazards h
left join people p on p.id = h.owner_id
left join changes c on c.id = h.change_id
left join v_risk_latest l on l.hazard_id = h.id
left join v_risk_first f on f.hazard_id = h.id;

create or replace view v_actions as
select a.id, a.ref, a.description, a.status, p.name as owner, a.owner_id, a.due_on,
  coalesce(r.ref, h.ref, f.ref, c.ref) as source,
  a.done_on, a.done_note, v.name as verified_by, a.verified_on, a.effective,
  case when a.status = 'open' and a.due_on < current_date then current_date - a.due_on end as days_overdue,
  case when a.status = 'done' then current_date - a.done_on end as days_unverified,
  a.report_id, a.hazard_id, a.finding_id, a.change_id
from actions a
join people p on p.id = a.owner_id
left join people v on v.id = a.verified_by
left join reports r on r.id = a.report_id
left join hazards h on h.id = a.hazard_id
left join findings f on f.id = a.finding_id
left join changes c on c.id = a.change_id;

create or replace view v_training as
select p.id as person_id, p.code, p.name, p.role, b.code as base, tr.course, tr.months_valid,
  t.completed_on, coalesce(t.expires_on, (t.completed_on + make_interval(months => tr.months_valid))::date) as expires_on,
  coalesce(t.expires_on, (t.completed_on + make_interval(months => tr.months_valid))::date) - current_date as days_left,
  case when t.completed_on is null then 'never done'
       when coalesce(t.expires_on, (t.completed_on + make_interval(months => tr.months_valid))::date) < current_date then 'expired'
       when coalesce(t.expires_on, (t.completed_on + make_interval(months => tr.months_valid))::date) < current_date + setting_num('warn_days')::int then 'expiring'
       else 'current' end as standing
from people p
join training_rules tr on tr.role = p.role
left join bases b on b.id = p.base_id
left join lateral (select * from training x where x.person_id = p.id and x.course = tr.course order by x.completed_on desc limit 1) t on true
where p.status = 'active';

-- Safety performance indicators: reports per 1,000 flight hours over the last three full months.
create or replace view v_spis as
with window_ as (
  select (date_trunc('month', current_date) - interval '3 months')::date as from_month, date_trunc('month', current_date)::date as to_month
), hours as (
  select coalesce(sum(fh.hours), 0) as hours from flight_hours fh, window_ w where fh.month >= w.from_month and fh.month < w.to_month
)
select s.code, s.name, s.category, s.class_min, s.target_per_1000, s.alert_per_1000,
  (select count(*)::int from reports r, window_ w where r.occurred_at >= w.from_month and r.occurred_at < w.to_month
     and (s.category is null or r.category = s.category)
     and (s.class_min is null or r.class = any (case s.class_min when 'incident' then array['incident', 'serious', 'accident'] when 'serious' then array['serious', 'accident'] else array['accident'] end))) as reports,
  h.hours,
  case when h.hours > 0 then round(1000.0 * (select count(*) from reports r, window_ w where r.occurred_at >= w.from_month and r.occurred_at < w.to_month
     and (s.category is null or r.category = s.category)
     and (s.class_min is null or r.class = any (case s.class_min when 'incident' then array['incident', 'serious', 'accident'] when 'serious' then array['serious', 'accident'] else array['accident'] end))) / h.hours, 2) end as rate_per_1000
from spis s, hours h;

-- Every open thing that needs a person, in one place: the CLI, the views and the documents all read it.
create or replace view v_attention as
select 1 as rank, 'notice overdue' as item, n.ref, n.authority || ' ' || n.kind || ' was due ' || n.due_local || ' [' || n.rule || ']' as detail
  from v_notifications n where n.standing = 'overdue'
union all
select 2, 'notice due', n.ref, n.authority || ' ' || n.kind || ' due ' || n.due_local || ' [' || n.rule || ']'
  from v_notifications n where n.standing = 'due'
union all
select 2, 'intolerable risk, no open action', h.ref, h.title || ' (' || h.risk || ')'
  from v_hazards h where h.status = 'open' and h.band = 'intolerable' and h.open_actions = 0
union all
select 3, 'report not triaged', r.ref, r.title || ', ' || r.days_open || ' days since reported'
  from v_reports r where r.status = 'new' and r.reported_at < now() - make_interval(days => setting_num('triage_days')::int)
union all
select 3, 'investigation overdue', r.ref, r.title || ', due ' || r.investigation_due || coalesce(' (' || r.investigator || ')', '')
  from v_reports r where r.status = 'triaged' and r.investigation_due < current_date and r.root_cause is null
union all
select 3, 'action overdue', a.ref, a.description || ' (' || a.owner || ', ' || a.days_overdue || ' days late)'
  from v_actions a where a.status = 'open' and a.due_on < current_date
union all
select 4, 'action not verified', a.ref, a.description || ' (done ' || a.days_unverified || ' days ago)'
  from v_actions a where a.status = 'done' and a.days_unverified > setting_num('verify_days')
union all
select 3, 'finding with no action', f.ref, au.ref || ' ' || f.level || ': ' || f.description
  from findings f join audits au on au.id = f.audit_id
  where f.level <> 'observation' and not exists (select 1 from actions a where a.finding_id = f.id and a.status <> 'cancelled')
union all
select 4, 'audit overdue', au.ref, au.title || ', scheduled ' || au.scheduled_on
  from audits au where au.done_on is null and au.scheduled_on < current_date
union all
select 4, 'hazard never assessed', h.ref, h.title
  from v_hazards h where h.status = 'open' and h.risk is null
union all
select 4, 'hazard review due', h.ref, h.title || ', last reviewed ' || h.last_reviewed
  from v_hazards h where h.status = 'open' and h.review_due < current_date
union all
select 4, 'change not assessed', c.ref, c.title || ': no hazard assessed for this change'
  from changes c where c.status = 'proposed' and not exists (select 1 from hazards h join v_risk_latest l on l.hazard_id = h.id where h.change_id = c.id)
union all
select 4, 'training ' || t.standing, t.code, t.name || ' ' || t.course || coalesce(' expires ' || t.expires_on, '')
  from v_training t where t.standing in ('expired', 'never done', 'expiring')
union all
select 4, 'indicator above alert', s.code, s.name || ': ' || s.rate_per_1000 || ' per 1,000 hours (alert ' || s.alert_per_1000 || ')'
  from v_spis s where s.rate_per_1000 > s.alert_per_1000
union all
select 5, 'flight hours missing', a.rego, 'no hours logged for ' || to_char(date_trunc('month', current_date) - interval '1 month', 'Mon YYYY')
  from aircraft a where a.status = 'active' and not exists (select 1 from flight_hours fh where fh.aircraft_id = a.id and fh.month = (date_trunc('month', current_date) - interval '1 month')::date);
