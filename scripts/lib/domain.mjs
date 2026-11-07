// The rules of the safety office. scripts/safety.mjs is a thin shell over run().
// Every write names an actor and leaves a row in the append-only activity log.
// Occurrence times are wall-clock times at the base: "2026-11-09 14:20" at Cairns means 2:20 pm in Cairns.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './db.mjs';
import { parseCsv, pick } from './csv.mjs';

export const today = () => new Date().toISOString().slice(0, 10);

export function date(v, label) {
  const s = String(v ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw Error(`--${label} must be a date (YYYY-MM-DD)`);
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) throw Error(`--${label} must be a date (YYYY-MM-DD)`);
  return s;
}

// "2026-11-09 14:20" (or with a T) -> "2026-11-09 14:20:00", a wall-clock time at the base.
export function stamp(v, label) {
  const s = String(v ?? '').trim().replace('T', ' ');
  const m = s.match(/^(\d{4}-\d{2}-\d{2}) (\d{1,2}):(\d{2})(?::00)?$/);
  if (!m) throw Error(`--${label} must be a date and time like 2026-11-09 14:20`);
  date(m[1], label);
  const h = Number(m[2]);
  const min = Number(m[3]);
  if (h > 23 || min > 59) throw Error(`--${label} has an impossible time`);
  return `${m[1]} ${String(h).padStart(2, '0')}:${m[3]}:00`;
}

export function month(v, label) {
  const s = String(v ?? '').trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(s)) throw Error(`--${label} must be a month like 2026-10`);
  return `${s}-01`;
}

function num(v, label, { min = 0, max = Infinity } = {}) {
  const n = Number(v);
  if (v === undefined || v === true || String(v).trim() === '' || !Number.isFinite(n) || n < min || n > max) throw Error(`--${label} must be a number from ${min} to ${max}`);
  return n;
}
function need(flags, ...keys) {
  for (const k of keys) if (flags[k] === undefined || flags[k] === true || String(flags[k]).trim() === '') throw Error(`--${k} is required`);
}
function oneOf(v, allowed, label) {
  if (!allowed.includes(v)) throw Error(`--${label} must be one of: ${allowed.join(', ')}`);
  return v;
}
const text = (v) => (v === undefined || v === true ? null : String(v).trim() || null);
const yes = (v) => v === true || ['yes', 'true', 'y', '1'].includes(String(v ?? '').toLowerCase());

export const ROLES = ['accountable-manager', 'safety-manager', 'chief-pilot', 'pilot', 'engineer', 'ground-crew', 'office'];
export const KINDS = ['occurrence', 'hazard', 'suggestion'];
export const CLASSES = ['none', 'incident', 'serious', 'accident'];
export const CATEGORIES = ['airspace', 'bird-strike', 'cfit-terrain', 'fuel', 'ground-handling', 'maintenance', 'passenger', 'runway-landing-site', 'technical',
  'weather', 'fatigue', 'dangerous-goods', 'procedures', 'other'];
export const AREAS = ['flight-ops', 'maintenance', 'ground-ops', 'passengers', 'weather', 'airspace', 'wildlife', 'fatigue', 'organisational', 'other'];
const SEVERITY_WORDS = { catastrophic: 'A', hazardous: 'B', major: 'C', minor: 'D', negligible: 'E' };
const LIKELIHOOD_WORDS = { frequent: 5, occasional: 4, remote: 3, improbable: 2, 'extremely improbable': 1 };

export function severity(v, label = 'severity') {
  const s = String(v ?? '').trim();
  if (/^[A-Ea-e]$/.test(s)) return s.toUpperCase();
  if (SEVERITY_WORDS[s.toLowerCase()]) return SEVERITY_WORDS[s.toLowerCase()];
  if (/^[1-5]$/.test(s)) return 'EDCBA'[Number(s) - 1]; // 5 is the worst, as in most spreadsheets
  throw Error(`--${label} must be A to E (A catastrophic, E negligible) or one of: ${Object.keys(SEVERITY_WORDS).join(', ')}`);
}
export function likelihood(v, label = 'likelihood') {
  const s = String(v ?? '').trim().toLowerCase();
  if (/^[1-5]$/.test(s)) return Number(s);
  if (LIKELIHOOD_WORDS[s]) return LIKELIHOOD_WORDS[s];
  throw Error(`--${label} must be 1 to 5 (5 frequent, 1 extremely improbable) or one of: ${Object.keys(LIKELIHOOD_WORDS).join(', ')}`);
}

async function tx(db, fn) {
  await db.exec('begin');
  try { const r = await fn(); await db.exec('commit'); return r; } catch (e) { await db.exec('rollback'); throw e; }
}
async function log(db, actor, action, ref, detail) {
  await db.query('insert into activity (actor, action, ref, detail) values ($1,$2,$3,$4)', [actor, action, ref, detail]);
}
function actorOf(flags) {
  need(flags, 'actor');
  return String(flags.actor).trim();
}

// Resolve one record from a code, reference, id prefix or name. Exact (case-insensitive) beats
// partial; more than one partial match lists the candidates and fails.
function choose(rows, term, what, label) {
  const t = String(term ?? '').trim().toLowerCase();
  if (!t || t === 'true') throw Error(`Name the ${what.toLowerCase()}`);
  const exact = rows.filter((r) => label(r).some((x) => x && String(x).toLowerCase() === t));
  if (exact.length === 1) return exact[0];
  const partial = exact.length ? exact : rows.filter((r) => label(r).some((x) => x && String(x).toLowerCase().includes(t)));
  if (partial.length === 1) return partial[0];
  if (!partial.length) throw Error(`${what} "${term}" not found`);
  throw Error(`"${term}" is ambiguous: ${partial.map((r) => label(r).filter(Boolean).slice(0, 2).join(' / ')).join('; ')}`);
}
export const base = async (db, term) => choose(await db.query('select * from bases order by code'), term, 'Base', (r) => [r.code, r.name, r.id]);
export const person = async (db, term) => choose(await db.query('select * from people order by code'), term, 'Person', (r) => [r.code, r.name, r.email, r.id]);
export const aircraft = async (db, term) => choose(await db.query('select * from aircraft order by rego'), term, 'Aircraft', (r) => [r.rego, r.rego.replace('-', ''), r.id]);
export const report = async (db, term) => choose(await db.query('select * from v_reports order by ref'), term, 'Report', (r) => [r.ref, r.title, r.id]);
export const hazard = async (db, term) => choose(await db.query('select * from hazards order by ref'), term, 'Hazard', (r) => [r.ref, r.title, r.id]);
const action = async (db, term) => choose(await db.query('select * from actions order by ref'), term, 'Action', (r) => [r.ref, r.id]);
const audit = async (db, term) => choose(await db.query('select * from audits order by ref'), term, 'Audit', (r) => [r.ref, r.title, r.id]);
const finding = async (db, term) => choose(await db.query('select * from findings order by ref'), term, 'Finding', (r) => [r.ref, r.id]);
const change = async (db, term) => choose(await db.query('select * from changes order by ref'), term, 'Change', (r) => [r.ref, r.title, r.id]);

async function nextRef(db, table, prefix, width) {
  const rows = await db.query(`select ref from ${table} where ref ~ $1`, [`^${prefix}\\d+$`]);
  const n = rows.reduce((m, r) => Math.max(m, Number(r.ref.slice(prefix.length))), 0) + 1;
  return `${prefix}${String(n).padStart(width, '0')}`;
}

function draftFile(name, body) {
  const dir = path.join(process.env.OUTPUT_DIR || REPO_ROOT, 'drafts');
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name);
  writeFileSync(file, body);
  return path.relative(process.env.OUTPUT_DIR || REPO_ROOT, file).replace(/\\/g, '/');
}

// ------------------------------------------------------------------ reads

const REPORT_COLS = `ref, kind, occurred_local as occurred, base, aircraft, title, reporter, category, class, status, hazard, days_open`;

export const reads = {
  async attention(db) {
    return db.query('select item, ref, detail from v_attention order by rank, item, ref');
  },

  async compliance(db) {
    const one = async (sql) => (await db.query(sql))[0];
    const rules = [
      { rule: 'Accident and incident notices to the CAA (New Zealand)', source: 'Civil Aviation Rules Part 12: 12.51, 12.53, 12.55, 12.57',
        breach: await one(`select count(*)::int as n, min(ref || ' ' || kind || ' due ' || due_local) as ex from v_notifications where authority = 'CAA' and standing = 'overdue'`),
        due: await one(`select count(*)::int as n, min(ref || ' ' || kind || ' due ' || due_local) as ex from v_notifications where authority = 'CAA' and standing = 'due'`) },
      { rule: 'Reportable matters to the ATSB (Australia)', source: 'Transport Safety Investigation Act 2003 ss 18 and 19; TSI Regulations 2021',
        breach: await one(`select count(*)::int as n, min(ref || ' ' || kind || ' due ' || due_local) as ex from v_notifications where authority = 'ATSB' and standing = 'overdue'`),
        due: await one(`select count(*)::int as n, min(ref || ' ' || kind || ' due ' || due_local) as ex from v_notifications where authority = 'ATSB' and standing = 'due'`) },
      { rule: 'Hazards identified and their risks evaluated and managed', source: 'Civil Aviation Rules 100.3(a)(2); CASR Part 119 Subpart 119.F',
        breach: await one(`select count(*)::int as n, min(ref || ' ' || title || ' (' || risk || ')') as ex from v_hazards where status = 'open' and band = 'intolerable' and open_actions = 0`),
        due: await one(`select count(*)::int as n, min(ref || ' ' || title) as ex from v_hazards where status = 'open' and (risk is null or review_due < current_date)`) },
      { rule: 'Safety goals set and their attainment measured', source: 'Civil Aviation Rules 100.3(a)(3)',
        breach: await one(`select count(*)::int as n, min(code || ' ' || name || ' at ' || rate_per_1000) as ex from v_spis where rate_per_1000 > alert_per_1000`),
        due: await one(`select (case when (select count(*) from spis) = 0 then 1 else 0 end + (select count(*) from v_attention where item = 'flight hours missing'))::int as n,
          coalesce(case when (select count(*) from spis) = 0 then 'no safety performance indicators set' end, (select min(ref) || ': flight hours missing' from v_attention where item = 'flight hours missing')) as ex`) },
      { rule: 'Changes assessed for hazards before they are made', source: 'ICAO Annex 19, Appendix 2, element 3.2 (management of change); AC100-1',
        breach: await one(`select count(*)::int as n, min(c.ref || ' ' || c.title) as ex from changes c where c.status in ('approved', 'implemented')
          and not exists (select 1 from hazards h join v_risk_latest l on l.hazard_id = h.id where h.change_id = c.id)`),
        due: await one(`select count(*)::int as n, min(ref || ' ' || detail) as ex from v_attention where item = 'change not assessed'`) },
      { rule: 'Staff trained for their safety duties', source: 'ICAO Annex 19, Appendix 2, element 4.1 (training and education)',
        breach: await one(`select count(*)::int as n, min(name || ' ' || course || ' ' || standing) as ex from v_training where standing in ('expired', 'never done')`),
        due: await one(`select count(*)::int as n, min(name || ' ' || course || ' expires ' || expires_on) as ex from v_training where standing = 'expiring'`) },
      { rule: 'Investigations finished and actions closed on time (house rules)', source: 'Your exposition; settings investigation_days and verify_days',
        breach: await one(`select count(*)::int as n, min(ref || ' ' || item) as ex from v_attention where item in ('investigation overdue', 'action overdue', 'finding with no action')`),
        due: await one(`select count(*)::int as n, min(ref || ' ' || item) as ex from v_attention where item in ('action not verified', 'report not triaged', 'audit overdue')`) },
    ];
    const rows = rules.map((r) => ({ standing: r.breach.n ? 'breach' : r.due.n ? 'to fix' : 'clean', rule: r.rule, count: r.breach.n || r.due.n, example: (r.breach.n ? r.breach.ex : r.due.ex) || '', source: r.source }));
    const order = { breach: 0, 'to fix': 1, clean: 2 };
    return rows.sort((a, b) => order[a.standing] - order[b.standing]);
  },

  async reports(db, args, f = {}) {
    const where = [];
    const p = [];
    if (f.open) where.push(`status <> 'closed'`);
    if (f.base) { p.push((await base(db, f.base)).code); where.push(`base = $${p.length}`); }
    if (f.kind) { p.push(oneOf(f.kind, KINDS, 'kind')); where.push(`kind = $${p.length}`); }
    return db.query(`select ${REPORT_COLS} from v_reports ${where.length ? 'where ' + where.join(' and ') : ''} order by occurred_at desc`, p);
  },

  async report(db, args) {
    const r = await report(db, args[0]);
    const { id, base_id, aircraft_id, reporter_id, triaged_by, hazard_id, investigator_id, external_id, zone, occurred_at, reported_at, triaged_at, closed_at, created_at, updated_at, ...rest } = r;
    return {
      report: rest,
      notices: await db.query('select authority, kind, due_local as due, standing, sent_local as sent, reference, rule from v_notifications where report_id = $1 order by due_at', [id]),
      actions: await db.query('select ref, description, owner, due_on, status, days_overdue from v_actions where report_id = $1 order by ref', [id]),
      activity: await db.query(`select to_char(at, 'YYYY-MM-DD HH24:MI') as at, actor, action, detail from activity where ref = $1 order by at`, [r.ref]),
    };
  },

  async notifications(db, args, f = {}) {
    return db.query(`select ref, authority, kind, due_local as due, standing, sent_local as sent, reference, hours_late, rule from v_notifications
      ${f.all ? '' : `where standing in ('overdue', 'due')`} order by case standing when 'overdue' then 0 when 'due' then 1 else 2 end, due_at`);
  },

  async hazards(db, args, f = {}) {
    return db.query(`select ref, title, area, owner, risk, band, first_risk, open_actions, reports, last_reviewed, review_due, status from v_hazards
      ${f.all ? '' : `where status = 'open'`} order by band_rank, risk, ref`);
  },

  async hazard(db, args) {
    const h = await hazard(db, args[0]);
    return {
      hazard: (await db.query('select ref, title, area, owner, change, risk, band, status, last_reviewed, review_due from v_hazards where id = $1', [h.id]))[0],
      description: { text: h.description || '' },
      assessments: await db.query(`select ra.assessed_on, ra.likelihood::text || ra.severity as risk, risk_band(ra.likelihood, ra.severity) as band, ra.controls, p.name as by
        from risk_assessments ra left join people p on p.id = ra.assessed_by where ra.hazard_id = $1 order by ra.assessed_on, ra.created_at`, [h.id]),
      reports: await db.query(`select ref, occurred_local as occurred, title, class, status from v_reports where hazard_id = $1 order by occurred_at`, [h.id]),
      actions: await db.query('select ref, description, owner, due_on, status, effective from v_actions where hazard_id = $1 order by ref', [h.id]),
    };
  },

  async actions(db, args, f = {}) {
    const p = [];
    const where = [f.all ? 'true' : `status in ('open', 'done')`];
    if (f.owner) { p.push((await person(db, f.owner)).id); where.push(`owner_id = $${p.length}`); }
    return db.query(`select ref, source, description, owner, due_on, status, days_overdue, days_unverified, verified_by, effective from v_actions
      where ${where.join(' and ')} order by case status when 'open' then 0 when 'done' then 1 else 2 end, due_on`, p);
  },

  async audits(db) {
    return db.query(`select au.ref, au.title, au.area, b.code as base, p.name as auditor, au.scheduled_on, au.done_on,
        case when au.done_on is not null then 'done' when au.scheduled_on < current_date then 'overdue' else 'planned' end as standing,
        (select count(*)::int from findings f where f.audit_id = au.id) as findings,
        (select count(*)::int from findings f where f.audit_id = au.id and f.level <> 'observation' and not exists (select 1 from actions a where a.finding_id = f.id and a.status <> 'cancelled')) as findings_without_action
      from audits au left join bases b on b.id = au.base_id left join people p on p.id = au.auditor_id order by au.scheduled_on`);
  },

  async audit(db, args) {
    const a = await audit(db, args[0]);
    return {
      audit: (await db.query(`select au.ref, au.title, au.area, b.code as base, p.name as auditor, au.scheduled_on, au.done_on, au.summary
        from audits au left join bases b on b.id = au.base_id left join people p on p.id = au.auditor_id where au.id = $1`, [a.id]))[0],
      findings: await db.query(`select f.ref, f.level, f.description, (select string_agg(x.ref || ' ' || x.status, ', ') from actions x where x.finding_id = f.id) as actions
        from findings f where f.audit_id = $1 order by f.ref`, [a.id]),
    };
  },

  async spis(db) {
    return db.query(`select code, name, coalesce(category, 'all') as category, coalesce(class_min, 'any') as class_min, reports, hours, rate_per_1000, target_per_1000, alert_per_1000,
      case when rate_per_1000 is null then 'no hours' when rate_per_1000 > alert_per_1000 then 'above alert' when rate_per_1000 > target_per_1000 then 'above target' else 'on target' end as standing
      from v_spis order by code`);
  },

  async changes(db) {
    return db.query(`select c.ref, c.title, c.status, o.name as owner, a.name as approved_by, c.approved_on, c.implemented_on,
        (select string_agg(h.ref || coalesce(' ' || l.risk, ' not assessed'), ', ') from hazards h left join v_risk_latest l on l.hazard_id = h.id where h.change_id = c.id) as hazards,
        (select count(*)::int from actions x where x.change_id = c.id and x.status = 'open') as open_actions
      from changes c left join people o on o.id = c.owner_id left join people a on a.id = c.approved_by order by c.ref desc`);
  },

  async training(db, args, f = {}) {
    const days = f.days !== undefined ? num(f.days, 'days') : null;
    return db.query(`select code, name, role, base, course, completed_on, expires_on, days_left, standing from v_training
      where ${f.all ? 'true' : days !== null ? `(days_left is null or days_left <= ${days})` : `standing <> 'current'`}
      order by days_left nulls first, name, course`);
  },

  async people(db) {
    return db.query(`select p.code, p.name, p.role, b.code as base, p.email, p.status,
        (select count(*)::int from actions a where a.owner_id = p.id and a.status = 'open') as open_actions,
        (select count(*)::int from v_training t where t.person_id = p.id and t.standing <> 'current') as training_due
      from people p left join bases b on b.id = p.base_id order by p.status, p.code`);
  },

  async aircraft(db) {
    return db.query(`select a.rego, a.type, b.code as base, a.status,
        (select sum(hours) from flight_hours fh where fh.aircraft_id = a.id and fh.month >= (date_trunc('month', current_date) - interval '6 months')::date) as hours_6_months,
        (select count(*)::int from reports r where r.aircraft_id = a.id and r.occurred_at > now() - interval '6 months') as reports_6_months
      from aircraft a left join bases b on b.id = a.base_id order by a.rego`);
  },

  async hours(db, args, f = {}) {
    const months = f.months !== undefined ? num(f.months, 'months', { min: 1, max: 36 }) : 6;
    return db.query(`select to_char(fh.month, 'YYYY-MM') as month, a.rego, fh.hours from flight_hours fh join aircraft a on a.id = fh.aircraft_id
      where fh.month >= (date_trunc('month', current_date) - make_interval(months => $1))::date order by fh.month desc, a.rego`, [months]);
  },

  async activity(db, args, f = {}) {
    const days = f.days !== undefined ? num(f.days, 'days', { min: 1 }) : 7;
    return db.query(`select to_char(at, 'YYYY-MM-DD HH24:MI') as at, actor, action, ref, detail from activity where at > now() - make_interval(days => $1) order by at desc`, [days]);
  },

  async insights(db) { return insights(db); },
};

// ------------------------------------------------------------------ ten questions

export const QUESTIONS = [
  { question: 'Which open hazards are rated intolerable or tolerable and have no open action to bring the risk down?',
    sql: `select ref, title, risk, band, owner, assessed_on from v_hazards where status = 'open' and band in ('intolerable', 'tolerable') and open_actions = 0 order by band_rank, risk` },
  { question: 'Which report categories rose over the last 90 days against the 90 days before?',
    sql: `select coalesce(category, 'not triaged') as category,
            count(*) filter (where occurred_at > now() - interval '90 days')::int as last_90_days,
            count(*) filter (where occurred_at <= now() - interval '90 days' and occurred_at > now() - interval '180 days')::int as previous_90_days
          from reports where occurred_at > now() - interval '180 days' group by 1
          having count(*) filter (where occurred_at > now() - interval '90 days') > count(*) filter (where occurred_at <= now() - interval '90 days' and occurred_at > now() - interval '180 days')
          order by 2 desc, 1` },
  { question: 'Which aircraft have the most reports per 100 flight hours over the last six months?',
    sql: `select a.rego, a.type, count(r.id)::int as reports, h.hours, round(100.0 * count(r.id) / nullif(h.hours, 0), 2) as per_100_hours
          from aircraft a
          cross join lateral (select coalesce(sum(fh.hours), 0) as hours from flight_hours fh where fh.aircraft_id = a.id and fh.month >= (date_trunc('month', current_date) - interval '6 months')::date) h
          left join reports r on r.aircraft_id = a.id and r.occurred_at > now() - interval '6 months'
          where a.status = 'active' group by a.rego, a.type, h.hours order by per_100_hours desc nulls last` },
  { question: 'How long does each base take from a report to triage, and from triage to closure?',
    sql: `select base, count(*)::int as reports, round(avg(extract(epoch from (triaged_at - reported_at)) / 86400.0), 1) as days_to_triage,
            round(avg(extract(epoch from (closed_at - triaged_at)) / 86400.0) filter (where closed_at is not null), 1) as days_to_close,
            count(*) filter (where status = 'new')::int as waiting_triage
          from v_reports group by base order by days_to_triage desc nulls first` },
  { question: 'Which regulator notices went in late, and by how many hours, over the last 12 months?',
    sql: `select ref, authority, kind, due_local as due, sent_local as sent, hours_late, rule from v_notifications where standing = 'sent late' and sent_at > now() - interval '12 months' order by hours_late desc` },
  { question: "Which finished actions actually brought a hazard's risk down, from the first rating to the latest?",
    sql: `select h.ref, h.title, h.first_risk, h.risk as latest_risk, h.band, string_agg(a.ref, ', ' order by a.ref) as actions
          from v_hazards h join actions a on a.hazard_id = h.id and a.status = 'verified' and a.effective
          where h.first_risk is distinct from h.risk group by h.ref, h.title, h.first_risk, h.risk, h.band order by h.ref` },
  { question: 'Which actions were done more than the verify period ago and nobody has checked they worked?',
    sql: `select ref, source, description, owner, done_on, days_unverified from v_actions where status = 'done' and days_unverified > setting_num('verify_days') order by days_unverified desc` },
  { question: 'How many safety reports does each base file per 1,000 flight hours, and how many are confidential?',
    sql: `select b.code as base, count(r.id)::int as reports_6_months, count(r.id) filter (where r.confidential)::int as confidential, h.hours,
            round(1000.0 * count(r.id) / nullif(h.hours, 0), 1) as per_1000_hours
          from bases b
          cross join lateral (select coalesce(sum(fh.hours), 0) as hours from flight_hours fh join aircraft a on a.id = fh.aircraft_id where a.base_id = b.id and fh.month >= (date_trunc('month', current_date) - interval '6 months')::date) h
          left join reports r on r.base_id = b.id and r.reported_at > now() - interval '6 months'
          group by b.code, h.hours order by per_1000_hours nulls first` },
  { question: 'Which safety performance indicators are above target or alert over the last three months?',
    sql: `select code, name, reports, hours, rate_per_1000, target_per_1000, alert_per_1000, case when rate_per_1000 > alert_per_1000 then 'above alert' else 'above target' end as standing
          from v_spis where rate_per_1000 > target_per_1000 order by rate_per_1000 - alert_per_1000 desc` },
  { question: 'Who is out of date on safety, human factors or dangerous goods training, or will be within 60 days?',
    sql: `select name, role, base, course, expires_on, days_left, standing from v_training where standing <> 'current' or days_left <= 60 order by days_left nulls first, name` },
];

export async function insights(db) {
  const out = [];
  for (const q of QUESTIONS) out.push({ question: q.question, rows: await db.query(q.sql) });
  return out;
}

// ------------------------------------------------------------------ writes

const writes = {
  async 'add-person'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'name', 'role');
    const role = oneOf(f.role, ROLES, 'role');
    const b = f.base ? await base(db, f.base) : null;
    return tx(db, async () => {
      const code = await nextRefCode(db);
      const [p] = await db.query('insert into people (code, name, role, base_id, email) values ($1,$2,$3,$4,$5) returning code, name, role', [code, text(f.name), role, b?.id ?? null, text(f.email)]);
      await log(db, actor, 'add-person', code, `${p.name}, ${role}`);
      return p;
    });
  },

  async 'person-status'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'status', 'reason');
    const p = await person(db, args[0]);
    const status = oneOf(f.status, ['active', 'left'], 'status');
    return tx(db, async () => {
      await db.query('update people set status = $1 where id = $2', [status, p.id]);
      await log(db, actor, 'person-status', p.code, `${status}: ${text(f.reason)}`);
      const owned = await db.query(`select ref, description, due_on from actions where owner_id = $1 and status = 'open' order by due_on`, [p.id]);
      return { person: p.name, status, actions_to_reassign: owned };
    });
  },

  async 'add-aircraft'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'type', 'base');
    const rego = String(args[0] ?? '').trim().toUpperCase();
    if (!/^(ZK|VH)-[A-Z0-9]{3}$/.test(rego)) throw Error('Give the registration like ZK-HSA or VH-SAH');
    const b = await base(db, f.base);
    return tx(db, async () => {
      const [a] = await db.query('insert into aircraft (rego, type, base_id) values ($1,$2,$3) returning rego, type', [rego, text(f.type), b.id]);
      await log(db, actor, 'add-aircraft', rego, `${a.type} at ${b.code}`);
      return { ...a, base: b.code };
    });
  },

  async 'log-hours'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'month', 'hours');
    const a = await aircraft(db, args[0]);
    const m = month(f.month, 'month');
    if (m >= today().slice(0, 7) + '-01' && !f.partial) throw Error('That month is not finished. Log a finished month, or add --partial.');
    const hours = num(f.hours, 'hours', { min: 0, max: 744 });
    return tx(db, async () => {
      await db.query('insert into flight_hours (aircraft_id, month, hours) values ($1,$2,$3) on conflict (aircraft_id, month) do update set hours = excluded.hours', [a.id, m, hours]);
      await log(db, actor, 'log-hours', a.rego, `${m.slice(0, 7)}: ${hours} hours`);
      return { aircraft: a.rego, month: m.slice(0, 7), hours };
    });
  },

  async 'file-report'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'kind', 'title', 'base', 'at');
    const kind = oneOf(f.kind, KINDS, 'kind');
    const b = await base(db, f.base);
    const at = stamp(f.at, 'at');
    const a = f.aircraft ? await aircraft(db, f.aircraft) : null;
    const who = f.reporter ? await person(db, f.reporter) : null;
    return tx(db, async () => {
      const ref = await nextRef(db, 'reports', 'R-', 4);
      const [r] = await db.query(`insert into reports (ref, kind, title, description, occurred_at, base_id, aircraft_id, reporter_id, confidential)
        values ($1,$2,$3,$4,($5::timestamp at time zone $6),$7,$8,$9,$10) returning ref`,
      [ref, kind, text(f.title), text(f.description), at, b.zone, b.id, a?.id ?? null, who?.id ?? null, yes(f.confidential)]);
      if ((await db.query('select 1 from reports where ref = $1 and occurred_at > now() + interval \'1 hour\'', [ref])).length) throw Error('--at is in the future at that base');
      await log(db, actor, 'file-report', ref, `${kind} at ${b.code}: ${text(f.title)}${yes(f.confidential) ? ' (confidential)' : ''}`);
      return { ref: r.ref, kind, base: b.code, occurred: at.slice(0, 16), confidential: yes(f.confidential), next: 'triage within ' + (await setting(db, 'triage_days', 2)) + ' days' };
    });
  },

  async triage(db, args, f) {
    const actor = actorOf(f);
    need(f, 'class', 'category', 'by');
    const r = await report(db, args[0]);
    if (r.status === 'closed') throw Error(`${r.ref} is closed`);
    const cls = oneOf(f.class, CLASSES, 'class');
    const category = oneOf(f.category, CATEGORIES, 'category');
    const by = await person(db, f.by);
    const h = f.hazard ? await hazard(db, f.hazard) : null;
    const inv = f.investigator ? await person(db, f.investigator) : null;
    if (f.investigator && inv.id === r.reporter_id) throw Error('Refused: the investigator should not be the person who filed the report. Choose someone else.');
    const days = await setting(db, 'investigation_days', 28);
    return tx(db, async () => {
      await db.query(`update reports set class = $1, category = $2, status = 'triaged', triaged_at = coalesce(triaged_at, now()), triaged_by = $3, hazard_id = coalesce($4, hazard_id),
        investigator_id = coalesce($5, investigator_id), investigation_due = case when $5::uuid is not null then coalesce(investigation_due, current_date + $6::int) else investigation_due end where id = $7`,
      [cls, category, by.id, h?.id ?? null, inv?.id ?? null, days, r.id]);
      await log(db, actor, 'triage', r.ref, `${cls}, ${category}${h ? `, hazard ${h.ref}` : ''}${inv ? `, investigator ${inv.name}` : ''}`);
      const notices = await db.query('select authority, kind, due_local as due, standing, rule from v_notifications where report_id = $1 order by due_at', [r.id]);
      return { ref: r.ref, class: cls, category, hazard: h?.ref ?? r.hazard ?? null, investigator: inv?.name ?? r.investigator ?? null, notices_owed: notices };
    });
  },

  async investigation(db, args, f) {
    const actor = actorOf(f);
    need(f, 'root-cause');
    const r = await report(db, args[0]);
    if (r.status !== 'triaged') throw Error(`${r.ref} is ${r.status}; triage it first`);
    const on = f.on ? date(f.on, 'on') : today();
    return tx(db, async () => {
      await db.query('update reports set root_cause = $1, investigated_on = $2 where id = $3', [text(f['root-cause']), on, r.id]);
      await log(db, actor, 'investigation', r.ref, text(f['root-cause']));
      return { ref: r.ref, root_cause: text(f['root-cause']), investigated_on: on, next: 'add the corrective actions with add-action --report=' + r.ref };
    });
  },

  async notify(db, args, f) {
    const actor = actorOf(f);
    need(f, 'kind', 'by');
    const r = await report(db, args[0]);
    const authority = r.country === 'NZ' ? 'CAA' : 'ATSB';
    if (f.authority && String(f.authority).toUpperCase() !== authority) throw Error(`Refused: ${r.ref} happened at ${r.base} (${r.country}); its notices go to the ${authority}`);
    const kind = oneOf(f.kind, ['initial', 'details', 'written'], 'kind');
    const owed = await db.query('select * from v_notifications where report_id = $1 and kind = $2', [r.id, kind]);
    if (!owed.length) throw Error(`Refused: ${r.ref} (${r.class || 'not triaged'}, ${r.country}) owes no ${kind} notice to the ${authority}. Triage it first if the class is wrong.`);
    if (owed[0].sent_at) throw Error(`${r.ref} ${kind} notice was already recorded as sent ${owed[0].sent_local}`);
    if (kind !== 'initial' && !text(f.reference)) throw Error('--reference is required: copy the reference the regulator gave, or the form number you lodged');
    const by = await person(db, f.by);
    const at = f.at ? stamp(f.at, 'at') : null;
    return tx(db, async () => {
      await db.query(`insert into notifications (report_id, authority, kind, sent_at, reference, by_id) values ($1,$2,$3, coalesce(($4::timestamp at time zone $5), now()), $6, $7)`,
        [r.id, authority, kind, at, r.zone, text(f.reference), by.id]);
      await log(db, actor, 'notify', r.ref, `${authority} ${kind}${text(f.reference) ? ' ' + text(f.reference) : ''}`);
      const [n] = await db.query('select authority, kind, due_local as due, sent_local as sent, standing, reference from v_notifications where report_id = $1 and kind = $2', [r.id, kind]);
      return n;
    });
  },

  async 'close-report'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'outcome');
    const r = await report(db, args[0]);
    if (r.status === 'closed') throw Error(`${r.ref} is already closed`);
    const why = [];
    if (r.status === 'new') why.push('it has not been triaged');
    for (const n of await db.query(`select authority, kind from v_notifications where report_id = $1 and sent_at is null`, [r.id])) why.push(`the ${n.authority} ${n.kind} notice has not been recorded`);
    if (r.investigator_id && !r.root_cause) why.push('the investigation has no root cause recorded');
    for (const a of await db.query(`select ref, status from actions where report_id = $1 and status in ('open', 'done')`, [r.id])) why.push(`action ${a.ref} is ${a.status === 'open' ? 'still open' : 'done but not verified'}`);
    if (why.length) throw Error(`Refused: ${r.ref} cannot close because ${why.join('; ')}`);
    return tx(db, async () => {
      await db.query(`update reports set status = 'closed', outcome = $1, closed_at = now() where id = $2`, [text(f.outcome), r.id]);
      await log(db, actor, 'close-report', r.ref, text(f.outcome));
      return { ref: r.ref, status: 'closed', outcome: text(f.outcome) };
    });
  },

  async 'add-hazard'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'title', 'area');
    const area = oneOf(f.area, AREAS, 'area');
    const owner = f.owner ? await person(db, f.owner) : null;
    const c = f.change ? await change(db, f.change) : null;
    return tx(db, async () => {
      const ref = await nextRef(db, 'hazards', 'H-', 3);
      await db.query('insert into hazards (ref, title, description, area, owner_id, change_id) values ($1,$2,$3,$4,$5,$6)', [ref, text(f.title), text(f.description), area, owner?.id ?? null, c?.id ?? null]);
      await log(db, actor, 'add-hazard', ref, `${text(f.title)}${c ? ` (change ${c.ref})` : ''}`);
      return { ref, title: text(f.title), area, owner: owner?.name ?? null, change: c?.ref ?? null, next: `assess it: assess ${ref} --likelihood=1-5 --severity=A-E` };
    });
  },

  async assess(db, args, f) {
    const actor = actorOf(f);
    need(f, 'likelihood', 'severity', 'by');
    const h = await hazard(db, args[0]);
    if (h.status === 'closed') throw Error(`${h.ref} is closed`);
    const l = likelihood(f.likelihood);
    const s = severity(f.severity);
    const by = await person(db, f.by);
    const on = f.on ? date(f.on, 'on') : today();
    return tx(db, async () => {
      await db.query('insert into risk_assessments (hazard_id, assessed_on, likelihood, severity, controls, assessed_by) values ($1,$2,$3,$4,$5,$6)', [h.id, on, l, s, text(f.controls), by.id]);
      await db.query('update hazards set last_reviewed = greatest(last_reviewed, $1::date) where id = $2', [on, h.id]);
      const [{ band }] = await db.query('select risk_band($1, $2) as band', [l, s]);
      await log(db, actor, 'assess', h.ref, `${l}${s} ${band}`);
      const out = { ref: h.ref, risk: `${l}${s}`, band };
      if (band === 'intolerable') out.warning = 'Intolerable under the matrix: the operation exposed to this hazard is stopped or restricted until actions bring the risk down. Add the actions now.';
      if (band === 'tolerable') out.note = 'Tolerable only with mitigation the accountable manager accepts. Record the actions that reduce it.';
      return out;
    });
  },

  async 'review-hazard'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'note');
    const h = await hazard(db, args[0]);
    return tx(db, async () => {
      await db.query('update hazards set last_reviewed = current_date where id = $1', [h.id]);
      await log(db, actor, 'review-hazard', h.ref, text(f.note));
      return { ref: h.ref, reviewed: today(), note: text(f.note) };
    });
  },

  async 'close-hazard'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'reason');
    const h = await hazard(db, args[0]);
    const open = await db.query(`select ref from actions where hazard_id = $1 and status in ('open', 'done')`, [h.id]);
    if (open.length) throw Error(`Refused: ${h.ref} has actions not yet verified (${open.map((a) => a.ref).join(', ')})`);
    return tx(db, async () => {
      await db.query(`update hazards set status = 'closed', closed_reason = $1 where id = $2`, [text(f.reason), h.id]);
      await log(db, actor, 'close-hazard', h.ref, text(f.reason));
      return { ref: h.ref, status: 'closed' };
    });
  },

  async 'add-action'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'description', 'owner', 'due');
    const owner = await person(db, f.owner);
    if (owner.status !== 'active') throw Error(`${owner.name} has left; choose an active owner`);
    const due = date(f.due, 'due');
    const r = f.report ? await report(db, f.report) : null;
    const h = f.hazard ? await hazard(db, f.hazard) : null;
    const fi = f.finding ? await finding(db, f.finding) : null;
    const c = f.change ? await change(db, f.change) : null;
    if (!r && !h && !fi && !c) throw Error('Link the action to what it fixes: --report, --hazard, --finding or --change');
    return tx(db, async () => {
      const ref = await nextRef(db, 'actions', 'CA-', 3);
      await db.query('insert into actions (ref, description, report_id, hazard_id, finding_id, change_id, owner_id, due_on) values ($1,$2,$3,$4,$5,$6,$7,$8)',
        [ref, text(f.description), r?.id ?? null, h?.id ?? r?.hazard_id ?? null, fi?.id ?? null, c?.id ?? null, owner.id, due]);
      await log(db, actor, 'add-action', ref, `${text(f.description)} (${owner.name}, due ${due})`);
      return { ref, owner: owner.name, due_on: due, for: [r?.ref, h?.ref ?? r?.hazard, fi?.ref, c?.ref].filter(Boolean).join(', ') };
    });
  },

  async 'action-done'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'note');
    const a = await action(db, args[0]);
    if (a.status !== 'open') throw Error(`${a.ref} is ${a.status}`);
    const on = f.on ? date(f.on, 'on') : today();
    return tx(db, async () => {
      await db.query(`update actions set status = 'done', done_on = $1, done_note = $2 where id = $3`, [on, text(f.note), a.id]);
      await log(db, actor, 'action-done', a.ref, text(f.note));
      return { ref: a.ref, status: 'done', next: 'someone other than the owner checks it worked: verify-action ' + a.ref };
    });
  },

  async 'verify-action'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'by', 'effective');
    const a = await action(db, args[0]);
    if (a.status !== 'done') throw Error(`Refused: ${a.ref} is ${a.status}; only a done action can be verified`);
    const by = await person(db, f.by);
    if (by.id === a.owner_id) throw Error(`Refused: ${by.name} owns ${a.ref}. Someone else checks that it worked.`);
    const effective = yes(f.effective);
    return tx(db, async () => {
      await db.query(`update actions set status = 'verified', verified_by = $1, verified_on = current_date, effective = $2 where id = $3`, [by.id, effective, a.id]);
      await log(db, actor, 'verify-action', a.ref, `${effective ? 'effective' : 'not effective'}${text(f.note) ? ': ' + text(f.note) : ''}`);
      const out = { ref: a.ref, status: 'verified', effective, verified_by: by.name };
      if (!effective) out.next = 'It did not work. Raise a new action on the same hazard or report, and reassess the risk.';
      else if (a.hazard_id) out.next = 'Reassess the hazard so the register shows the lower risk: assess ' + (await db.query('select ref from hazards where id = $1', [a.hazard_id]))[0].ref;
      return out;
    });
  },

  async 'cancel-action'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'reason');
    const a = await action(db, args[0]);
    if (!['open', 'done'].includes(a.status)) throw Error(`${a.ref} is ${a.status}`);
    return tx(db, async () => {
      await db.query(`update actions set status = 'cancelled', cancel_reason = $1 where id = $2`, [text(f.reason), a.id]);
      await log(db, actor, 'cancel-action', a.ref, text(f.reason));
      return { ref: a.ref, status: 'cancelled' };
    });
  },

  async 'add-audit'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'title', 'area', 'scheduled');
    const b = f.base ? await base(db, f.base) : null;
    const who = f.auditor ? await person(db, f.auditor) : null;
    const on = date(f.scheduled, 'scheduled');
    return tx(db, async () => {
      const ref = await nextRef(db, 'audits', 'AU-', 2);
      await db.query('insert into audits (ref, title, area, base_id, auditor_id, scheduled_on) values ($1,$2,$3,$4,$5,$6)', [ref, text(f.title), text(f.area), b?.id ?? null, who?.id ?? null, on]);
      await log(db, actor, 'add-audit', ref, `${text(f.title)} on ${on}`);
      return { ref, title: text(f.title), scheduled_on: on };
    });
  },

  async 'audit-done'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'summary');
    const a = await audit(db, args[0]);
    if (a.done_on) throw Error(`${a.ref} was done on ${a.done_on}`);
    const on = f.on ? date(f.on, 'on') : today();
    return tx(db, async () => {
      await db.query('update audits set done_on = $1, summary = $2 where id = $3', [on, text(f.summary), a.id]);
      await log(db, actor, 'audit-done', a.ref, text(f.summary));
      return { ref: a.ref, done_on: on, next: `record each finding with add-finding ${a.ref}` };
    });
  },

  async 'add-finding'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'level', 'description');
    const a = await audit(db, args[0]);
    const level = oneOf(f.level, ['major', 'minor', 'observation'], 'level');
    return tx(db, async () => {
      const prefix = `F-${a.ref.replace(/^AU-/, '')}-`;
      const ref = await nextRef(db, 'findings', prefix, 1);
      await db.query('insert into findings (ref, audit_id, level, description) values ($1,$2,$3,$4)', [ref, a.id, level, text(f.description)]);
      await log(db, actor, 'add-finding', ref, `${level}: ${text(f.description)}`);
      return { ref, audit: a.ref, level, next: level === 'observation' ? null : `add-action --finding=${ref}` };
    });
  },

  async 'add-change'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'title', 'owner');
    const owner = await person(db, f.owner);
    return tx(db, async () => {
      const ref = await nextRef(db, 'changes', 'MOC-', 2);
      await db.query('insert into changes (ref, title, description, owner_id) values ($1,$2,$3,$4)', [ref, text(f.title), text(f.description), owner.id]);
      await log(db, actor, 'add-change', ref, text(f.title));
      return { ref, title: text(f.title), status: 'proposed', next: `identify its hazards: add-hazard --change=${ref}, then assess each` };
    });
  },

  async 'change-status'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'status');
    const c = await change(db, args[0]);
    const status = oneOf(f.status, ['approved', 'implemented', 'closed', 'withdrawn'], 'status');
    const hz = await db.query(`select h.ref, l.risk, l.band from hazards h left join v_risk_latest l on l.hazard_id = h.id where h.change_id = $1 and h.status = 'open'`, [c.id]);
    if (status === 'approved') {
      need(f, 'by');
      if (c.status !== 'proposed') throw Error(`${c.ref} is ${c.status}`);
      const by = await person(db, f.by);
      if (!['accountable-manager', 'safety-manager'].includes(by.role)) throw Error(`Refused: ${by.name} is ${by.role}. A change is approved by the accountable manager or the safety manager.`);
      if (!hz.length) throw Error(`Refused: ${c.ref} has no hazards identified. Add them with add-hazard --change=${c.ref} and assess each.`);
      const bad = hz.filter((h) => !h.risk || h.band === 'intolerable');
      if (bad.length) throw Error(`Refused: ${bad.map((h) => `${h.ref} ${h.risk ? 'is intolerable (' + h.risk + ')' : 'is not assessed'}`).join('; ')}`);
      return tx(db, async () => {
        await db.query(`update changes set status = 'approved', approved_by = $1, approved_on = current_date where id = $2`, [by.id, c.id]);
        await log(db, actor, 'change-status', c.ref, `approved by ${by.name}`);
        return { ref: c.ref, status, approved_by: by.name, hazards: hz };
      });
    }
    if (status === 'implemented' && c.status !== 'approved') throw Error(`Refused: ${c.ref} is ${c.status}; it is approved before it is implemented`);
    if (status === 'closed') {
      const open = await db.query(`select ref from actions where change_id = $1 and status in ('open', 'done')`, [c.id]);
      if (open.length) throw Error(`Refused: ${c.ref} has actions not yet verified (${open.map((a) => a.ref).join(', ')})`);
    }
    if (status === 'withdrawn') need(f, 'reason');
    return tx(db, async () => {
      await db.query(`update changes set status = $1, implemented_on = case when $1 = 'implemented' then current_date else implemented_on end where id = $2`, [status, c.id]);
      await log(db, actor, 'change-status', c.ref, `${status}${text(f.reason) ? ': ' + text(f.reason) : ''}`);
      return { ref: c.ref, status };
    });
  },

  async 'add-training'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'course', 'completed');
    const p = await person(db, args[0]);
    const course = String(f.course).trim().toLowerCase();
    const done = date(f.completed, 'completed');
    if (done > today()) throw Error('--completed is in the future');
    const expires = f.expires ? date(f.expires, 'expires') : null;
    return tx(db, async () => {
      await db.query('insert into training (person_id, course, completed_on, expires_on, provider) values ($1,$2,$3,$4,$5) on conflict do nothing', [p.id, course, done, expires, text(f.provider)]);
      await log(db, actor, 'add-training', p.code, `${course} ${done}`);
      const [t] = await db.query('select course, completed_on, expires_on, standing from v_training where person_id = $1 and course = $2', [p.id, course]);
      return { person: p.name, ...(t || { course, completed_on: done, note: 'not a required course for this role' }) };
    });
  },

  async 'add-spi'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'code', 'name', 'target', 'alert');
    const target = num(f.target, 'target');
    const alert = num(f.alert, 'alert');
    if (alert < target) throw Error('--alert must be at or above --target');
    const category = f.category ? oneOf(f.category, CATEGORIES, 'category') : null;
    const cmin = f['class-min'] ? oneOf(f['class-min'], ['incident', 'serious', 'accident'], 'class-min') : null;
    return tx(db, async () => {
      await db.query(`insert into spis (code, name, category, class_min, target_per_1000, alert_per_1000) values ($1,$2,$3,$4,$5,$6)
        on conflict (code) do update set name = excluded.name, category = excluded.category, class_min = excluded.class_min, target_per_1000 = excluded.target_per_1000, alert_per_1000 = excluded.alert_per_1000`,
      [String(f.code).trim().toUpperCase(), text(f.name), category, cmin, target, alert]);
      await log(db, actor, 'add-spi', String(f.code).toUpperCase(), `${text(f.name)}: target ${target}, alert ${alert} per 1,000 hours`);
      return (await db.query('select * from v_spis where code = $1', [String(f.code).trim().toUpperCase()]))[0];
    });
  },

  async set(db, args, f) {
    const actor = actorOf(f);
    const [key, value] = args;
    const [row] = await db.query('select key from settings where key = $1', [key]);
    if (!row) throw Error(`Unknown setting "${key}". Settings: ${(await db.query('select key from settings order by key')).map((r) => r.key).join(', ')}`);
    num(value, key, { min: 0 });
    return tx(db, async () => {
      await db.query('update settings set value = $1 where key = $2', [String(value), key]);
      await log(db, actor, 'set', key, String(value));
      return { key, value: String(value) };
    });
  },

  async log(db, args, f) {
    const actor = actorOf(f);
    need(f, 'note');
    const ref = String(args[0] ?? '').trim();
    if (!ref) throw Error('Name the report, hazard, action, audit or change the note is about');
    const known = await db.query(`select ref from reports where ref = upper($1) union select ref from hazards where ref = upper($1) union select ref from actions where ref = upper($1)
      union select ref from audits where ref = upper($1) union select ref from changes where ref = upper($1) union select rego from aircraft where rego = upper($1) union select code from people where code = upper($1)`, [ref]);
    if (!known.length) throw Error(`"${ref}" is not a known reference`);
    await log(db, actor, 'note', known[0].ref, text(f.note));
    return { ref: known[0].ref, note: text(f.note) };
  },
};

async function nextRefCode(db) {
  const rows = await db.query(`select code from people where code ~ '^P-\\d+$'`);
  return `P-${String(rows.reduce((m, r) => Math.max(m, Number(r.code.slice(2))), 0) + 1).padStart(2, '0')}`;
}
const setting = async (db, key, dflt) => Number((await db.query('select value from settings where key = $1', [key]))[0]?.value ?? dflt);

// ------------------------------------------------------------------ drafts (written to drafts/, never sent)

const mdTable = (rows) => {
  if (!rows.length) return '_None._\n';
  const keys = Object.keys(rows[0]);
  return [`| ${keys.join(' | ')} |`, `|${keys.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${keys.map((k) => String(r[k] ?? '').replace(/\|/g, '/').replace(/\n/g, ' ')).join(' | ')} |`)].join('\n') + '\n';
};

const drafts = {
  async 'weekly-review'(db) {
    const att = await reads.attention(db);
    const comp = await reads.compliance(db);
    const notices = await reads.notifications(db, [], {});
    const acts = await db.query(`select ref, description, owner, due_on, days_overdue from v_actions where status = 'open' and due_on < current_date + 7 order by due_on`);
    const spis = await reads.spis(db);
    const newReports = await db.query(`select ref, kind, occurred_local as occurred, base, title, status from v_reports where reported_at > now() - interval '7 days' order by reported_at`);
    const body = `# Safety review, week of ${today()}\n\nWritten from the records. Check each line before the safety meeting.\n\n` +
      `## Regulator notices due or overdue\n\n${mdTable(notices.map(({ rule, ...n }) => n))}\n## Rules and where we stand\n\n${mdTable(comp.map(({ standing, rule, count, example }) => ({ standing, rule, count, example })))}\n` +
      `## New reports this week\n\n${mdTable(newReports)}\n## Actions due this week or late\n\n${mdTable(acts)}\n## Safety performance indicators\n\n${mdTable(spis)}\n` +
      `## Everything that needs a person\n\n${mdTable(att)}`;
    const file = draftFile(`weekly-review-${today()}.md`, body);
    return { file, needs_attention: att.length, breaches: comp.filter((c) => c.standing === 'breach').length, notices_due: notices.length };
  },

  async 'draft-notice'(db, args) {
    const r = await report(db, args[0]);
    const owed = await db.query('select authority, kind, due_local as due, standing, rule from v_notifications where report_id = $1 order by due_at', [r.id]);
    if (!owed.length) throw Error(`${r.ref} (${r.class || 'not triaged'}) owes the regulator no notice. Triage it first if that is wrong.`);
    const [ac] = r.aircraft_id ? await db.query('select rego, type from aircraft where id = $1', [r.aircraft_id]) : [null];
    const who = r.reporter_id ? (await db.query('select name, role from people where id = $1', [r.reporter_id]))[0] : null;
    const authority = owed[0].authority;
    const body = `# ${authority === 'CAA' ? 'Occurrence details for the CAA (to copy into form CA005 or the online occurrence report)' : 'Written report for the ATSB (to copy into the ATSB online reporting form)'}\n\n` +
      `Draft from the records for ${r.ref}. Not sent. A person lodges it and then records it with \`notify ${r.ref}\`.\n\n` +
      `## What is owed\n\n${mdTable(owed)}\n## The occurrence\n\n` +
      `- Date and local time: ${r.occurred_local} (${r.base}, ${r.zone})\n- Aircraft: ${ac ? `${ac.rego}, ${ac.type}` : 'not recorded'}\n- Class: ${r.class}\n- Category: ${r.category}\n` +
      `- Title: ${r.title}\n- What happened: ${r.description || '[to complete from the reporter]'}\n` +
      `- Reported by: ${r.confidential ? '[confidential: the safety manager supplies the contact the regulator needs]' : who ? `${who.name}, ${who.role}` : 'not recorded'}\n` +
      `- Investigation: ${r.root_cause ? r.root_cause : r.investigator ? `under way with ${r.investigator}, due ${r.investigation_due}` : 'none started'}\n\n` +
      `## Before it goes\n\n- Check every fact against the reporter's own account and the aircraft records.\n- Fill the form's operator, pilot and flight details from the flight records; they are not in this system.\n`;
    const file = draftFile(`notice-${r.ref}.md`, body);
    return { file, authority, owed };
  },

  async 'draft-action-reminder'(db, args) {
    const p = await person(db, args[0]);
    const acts = await db.query(`select ref, description, source, due_on, days_overdue from v_actions where owner_id = $1 and status = 'open' order by due_on`, [p.id]);
    if (!acts.length) throw Error(`${p.name} has no open actions`);
    const body = `To: ${p.email || p.name}\nSubject: Safety actions you own\n\nKia ora ${p.name.split(' ')[0]},\n\nThese safety actions are yours. When one is done, tell me what you did and I will record it so someone else can check it worked.\n\n` +
      acts.map((a) => `- ${a.ref} (${a.source}): ${a.description}. Due ${a.due_on}${a.days_overdue ? `, ${a.days_overdue} days late` : ''}.`).join('\n') + '\n\nThanks,\n[Safety manager]\n';
    const file = draftFile(`action-reminder-${p.code}.md`, body);
    return { file, person: p.name, actions: acts.length };
  },

  async 'draft-bulletin'(db, args) {
    const r = await report(db, args[0]);
    if (!r.root_cause) throw Error(`${r.ref} has no root cause yet. Record the investigation first.`);
    const acts = await db.query(`select description, status from actions where report_id = $1 and status <> 'cancelled' order by ref`, [r.id]);
    const body = `# Safety bulletin: ${r.title}\n\nFrom report ${r.ref}. No names: this bulletin is about what happened, not who.\n\n` +
      `## What happened\n\n${r.description || r.title}\n\n## Why it happened\n\n${r.root_cause}\n\n## What we have changed\n\n` +
      (acts.length ? acts.map((a) => `- ${a.description}${a.status === 'open' ? ' (in progress)' : ''}`).join('\n') : '- [actions to be added]') +
      `\n\n## What to do\n\n[Safety manager: one or two lines on what every pilot, engineer or ground crew member does differently from today.]\n\nThank you to the person who reported this. Every report makes the operation safer.\n`;
    const file = draftFile(`bulletin-${r.ref}.md`, body);
    return { file, report: r.ref };
  },
};

// ------------------------------------------------------------------ import from SMS Pro (or any safety spreadsheet saved as CSV)

const HEADINGS = {
  reports: { id: ['Report Number', 'Report ID', 'Report No', 'Number', 'ID'], title: ['Title', 'Subject', 'Summary', 'Short Description'], description: ['Description', 'Details', 'Narrative', 'Event Description'],
    date: ['Date', 'Event Date', 'Date of Event', 'Occurrence Date', 'Occurred'], time: ['Time', 'Event Time', 'Local Time'], base: ['Base', 'Location', 'Station', 'Department'],
    aircraft: ['Aircraft', 'Registration', 'Tail Number', 'Rego'], reporter: ['Reporter', 'Reported By', 'Submitted By', 'Employee'], category: ['Category', 'Event Type', 'Type', 'Classification'],
    status: ['Status', 'State'], kind: ['Report Type', 'Kind'] },
  hazards: { id: ['Hazard ID', 'Hazard Number', 'Hazard No', 'ID'], title: ['Hazard', 'Title', 'Name', 'Hazard Description'], description: ['Description', 'Details', 'Consequence'],
    area: ['Area', 'Department', 'Category', 'Operational Area'], likelihood: ['Likelihood', 'Probability'], severity: ['Severity', 'Consequence Severity'], owner: ['Owner', 'Hazard Owner', 'Responsible'],
    controls: ['Controls', 'Existing Controls', 'Mitigation'] },
};

function guessCategory(v) {
  const s = String(v || '').toLowerCase();
  const pairs = [['bird', 'bird-strike'], ['wildlife', 'bird-strike'], ['airspace', 'airspace'], ['drone', 'airspace'], ['weather', 'weather'], ['fuel', 'fuel'], ['maint', 'maintenance'],
    ['technical', 'technical'], ['defect', 'technical'], ['passenger', 'passenger'], ['ground', 'ground-handling'], ['ramp', 'ground-handling'], ['runway', 'runway-landing-site'],
    ['landing', 'runway-landing-site'], ['terrain', 'cfit-terrain'], ['fatigue', 'fatigue'], ['dangerous', 'dangerous-goods'], ['procedure', 'procedures']];
  return (pairs.find(([k]) => s.includes(k)) || [null, s ? 'other' : null])[1];
}
function guessArea(v) {
  const s = String(v || '').toLowerCase();
  return AREAS.find((a) => s.includes(a.split('-')[0])) || (s.includes('flight') || s.includes('ops') ? 'flight-ops' : s.includes('bird') ? 'wildlife' : 'other');
}

async function importSmsPro(db, args, f) {
  const actor = actorOf(f);
  if (args[0] !== 'sms-pro') throw Error('Usage: import sms-pro <file.csv> --kind=reports|hazards --base=<default base> --actor="..." [--dry-run]');
  const kind = oneOf(f.kind, ['reports', 'hazards'], 'kind');
  if (!args[1]) throw Error('Name the CSV file');
  const rows = parseCsv(readFileSync(args[1], 'utf8'));
  const map = { ...HEADINGS[kind] };
  if (f.map) for (const pair of String(f.map).split(',')) {
    const [k, v] = pair.split('=').map((x) => x.trim());
    if (!map[k]) throw Error(`--map key "${k}" is not one of: ${Object.keys(map).join(', ')}`);
    map[k] = [v];
  }
  const get = (r, k) => pick(r, ...map[k]).trim();
  const dry = Boolean(f['dry-run']);
  const fallback = f.base ? await base(db, f.base) : null;
  const bases = await db.query('select * from bases');
  let added = 0;
  let skipped = 0;
  await db.exec('begin');
  try {
    for (const [i, r] of rows.entries()) {
      const at = `row ${i + 2}`;
      try {
        const id = get(r, 'id');
        if (!id) throw Error('no id column (use --map=id=<heading>)');
        if (kind === 'reports') {
          const title = get(r, 'title') || get(r, 'description').slice(0, 80);
          if (!title) throw Error('no title or description');
          const where = get(r, 'base');
          const b = bases.find((x) => where && (x.code.toLowerCase() === where.toLowerCase() || x.name.toLowerCase() === where.toLowerCase())) || fallback;
          if (!b) throw Error(`base "${where}" not found; add --base=<code> for rows without one`);
          const d = get(r, 'date');
          const day = /^\d{4}-\d{2}-\d{2}/.test(d) ? d.slice(0, 10) : (() => { const m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/); if (!m) throw Error(`date "${d}" is not YYYY-MM-DD or DD/MM/YYYY`); return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; })();
          date(day, 'date');
          const t = (get(r, 'time') || d.slice(11, 16) || '12:00').match(/^(\d{1,2}):(\d{2})/);
          const when = stamp(`${day} ${t ? `${t[1]}:${t[2]}` : '12:00'}`, 'date');
          const reg = get(r, 'aircraft').toUpperCase();
          const [ac] = reg ? await db.query(`select id from aircraft where replace(rego, '-', '') = replace($1, '-', '')`, [reg]) : [];
          const name = get(r, 'reporter');
          const [who] = name ? await db.query('select id from people where lower(name) = lower($1)', [name]) : [];
          const rawKind = get(r, 'kind').toLowerCase();
          const k = rawKind.includes('hazard') ? 'hazard' : rawKind.includes('suggest') ? 'suggestion' : 'occurrence';
          const closed = /closed|complete/i.test(get(r, 'status'));
          const ref = await nextRef(db, 'reports', 'R-', 4);
          const res = await db.query(`insert into reports (ref, kind, title, description, occurred_at, reported_at, base_id, aircraft_id, reporter_id, category, class, status, triaged_at, outcome, closed_at, external_id)
            values ($1,$2,$3,$4,($5::timestamp at time zone $6),($5::timestamp at time zone $6),$7,$8,$9,$10,$11,$12,$13,$14,$13,$15) on conflict (external_id) do nothing returning ref`,
          [ref, k, title, get(r, 'description') || null, when, b.zone, b.id, ac?.id ?? null, who?.id ?? null, closed ? guessCategory(get(r, 'category')) || 'other' : null,
            closed ? 'none' : null, closed ? 'closed' : 'new', closed ? new Date().toISOString() : null, closed ? 'Closed in SMS Pro before import' : null, `sms-pro:report:${id}`]);
          if (res.length) added++; else skipped++;
        } else {
          const title = get(r, 'title');
          if (!title) throw Error('no hazard title');
          const ref = await nextRef(db, 'hazards', 'H-', 3);
          const ownerName = get(r, 'owner');
          const [owner] = ownerName ? await db.query('select id from people where lower(name) = lower($1)', [ownerName]) : [];
          const res = await db.query(`insert into hazards (ref, title, description, area, owner_id, external_id) values ($1,$2,$3,$4,$5,$6) on conflict (external_id) do nothing returning id`,
            [ref, title, get(r, 'description') || null, guessArea(get(r, 'area')), owner?.id ?? null, `sms-pro:hazard:${id}`]);
          if (!res.length) { skipped++; continue; }
          added++;
          if (get(r, 'likelihood') && get(r, 'severity')) {
            await db.query('insert into risk_assessments (hazard_id, likelihood, severity, controls) values ($1,$2,$3,$4)',
              [res[0].id, likelihood(get(r, 'likelihood'), 'likelihood'), severity(get(r, 'severity'), 'severity'), get(r, 'controls') || null]);
          }
        }
      } catch (e) {
        throw Error(`${at}: ${e.message}. Nothing was imported.`);
      }
    }
    if (!dry) await log(db, actor, 'import', `sms-pro:${kind}`, `${added} added, ${skipped} skipped from ${path.basename(args[1])}`);
    await db.exec(dry ? 'rollback' : 'commit');
  } catch (e) {
    await db.exec('rollback');
    throw e;
  }
  return { kind, rows: rows.length, added, skipped, dry_run: dry, next: kind === 'reports' && added ? 'Open reports come in as new: triage each so the regulator notices it owes are worked out.' : undefined };
}

async function exportAll(db, args, f) {
  const tables = ['settings', 'bases', 'people', 'aircraft', 'flight_hours', 'changes', 'hazards', 'risk_assessments', 'reports', 'notifications', 'audits', 'findings', 'actions',
    'spis', 'training_rules', 'training', 'activity'];
  const out = {};
  for (const t of tables) out[t] = await db.query(`select * from ${t}`);
  const file = f.out || path.join(process.env.OUTPUT_DIR || REPO_ROOT, 'exports', `safety-${today()}.json`);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(out, null, 2));
  return { file, rows: Object.fromEntries(tables.map((t) => [t, out[t].length])) };
}

const all = { ...reads, ...writes, ...drafts, import: importSmsPro, export: exportAll };
export const commands = Object.keys(all).sort();

export async function run(db, command, args = [], flags = {}) {
  const fn = all[command];
  if (!fn) throw Error(`Unknown command "${command}". Commands: ${commands.join(', ')}`);
  return fn(db, args, flags);
}
