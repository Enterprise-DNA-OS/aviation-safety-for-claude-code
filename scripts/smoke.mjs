#!/usr/bin/env node
// npm test: a temporary database, the demo operator, every command exercised, then cleaned up.
// Set TEST_DATABASE_URL to run the same checks against an empty Postgres database instead of PGlite.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { migrate } from './migrate.mjs';
import { seed } from './seed.mjs';
import { run, reads, commands, QUESTIONS, stamp, date, month, severity, likelihood } from './lib/domain.mjs';

const root = mkdtempSync(path.join(os.tmpdir(), 'safety-test-'));
process.env.DATA_DIR = path.join(root, 'db');
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || '';
process.env.OUTPUT_DIR = path.join(root, 'out');

let db;
let checks = 0;
const ok = (v, msg) => { assert.ok(v, msg); checks++; };
const eq = (a, b, msg) => { assert.equal(a, b, msg); checks++; };
const fails = async (fn, re, msg) => { await assert.rejects(fn, re, msg); checks++; };
const call = (cmd, args = [], f = {}) => run(db, cmd, args, f);
const A = { actor: 'Test' };
const one = async (sql, p = []) => (await db.query(sql, p))[0];
// A wall-clock time at a base, h hours before its now.
const ago = async (zone, h) => (await one(`select to_char((now() at time zone $1) - make_interval(hours => $2), 'YYYY-MM-DD HH24:MI') as t`, [zone, h])).t;
const lastMonth = async () => (await one(`select to_char(date_trunc('month', current_date) - interval '1 month', 'YYYY-MM') as m`)).m;

try {
  db = await getDb();
  await migrate(db);
  eq((await migrate(db)).ran.length, 0, 'migrate twice is a no-op');
  await seed(db);
  const counts = await one('select (select count(*) from reports)::int as r, (select count(*) from risk_assessments)::int as ra, (select count(*) from flight_hours)::int as fh');
  await seed(db);
  const again = await one('select (select count(*) from reports)::int as r, (select count(*) from risk_assessments)::int as ra, (select count(*) from flight_hours)::int as fh');
  eq(JSON.stringify(again), JSON.stringify(counts), 'seed is idempotent');
  eq((await one('select count(*)::int as n from activity')).n, 1, 'seed activity written once');
  eq(counts.r, 11, 'eleven demo reports');

  // Every read runs.
  for (const cmd of Object.keys(reads)) {
    const a = { report: ['R-0147'], hazard: ['H-002'], audit: ['AU-11'] }[cmd] || [];
    ok(await call(cmd, a, {}), `read ${cmd}`);
  }
  eq(QUESTIONS.length, 10, 'ten questions');
  const ins = await call('insights');
  eq(ins.length, 10);
  ok(ins.every((q) => Array.isArray(q.rows)), 'every question returns rows');
  ok(ins[0].rows.some((r) => r.ref === 'H-005'), 'Q1 finds the untreated fatigue hazard');
  ok(ins[4].rows.some((r) => r.ref === 'R-0149'), 'Q5 finds the late CAA details');
  ok(ins[5].rows.some((r) => r.ref === 'H-001' && r.first_risk === '4A' && r.latest_risk === '2A'), 'Q6 finds the wire strike risk brought down');
  ok(ins[6].rows.some((r) => r.ref === 'CA-034'), 'Q7 finds the unverified action');
  ok(ins[8].rows.some((r) => r.code === 'SPI-2'), 'Q9 finds bird strikes above alert');
  ok(ins[9].rows.some((r) => r.name === 'Ben Hollis' && r.standing === 'expired'), 'Q10 finds expired training');

  // Parsing is strict.
  eq(stamp('2026-11-09 6:05', 'x'), '2026-11-09 06:05:00');
  eq(stamp('2026-11-09T14:20', 'x'), '2026-11-09 14:20:00');
  assert.throws(() => stamp('2026-11-09 25:00', 'x'), /impossible/); checks++;
  assert.throws(() => stamp('09/11/2026', 'x'), /date and time/); checks++;
  assert.throws(() => date('2026-02-30', 'x'), /date/); checks++;
  eq(month('2026-10', 'm'), '2026-10-01');
  assert.throws(() => month('2026-13', 'm'), /month/); checks++;
  eq(severity('catastrophic'), 'A'); eq(severity('d'), 'D'); eq(severity('5'), 'A'); eq(severity('1'), 'E');
  eq(likelihood('Frequent'), 5); eq(likelihood('extremely improbable'), 1); eq(likelihood('3'), 3);
  assert.throws(() => severity('F'), /A to E/); checks++;
  assert.throws(() => likelihood('6'), /1 to 5/); checks++;

  // The ICAO matrix, every band.
  const band = async (l, s) => (await one('select risk_band($1, $2) as b', [l, s])).b;
  for (const r of ['5A', '5B', '5C', '4A', '4B', '3A']) eq(await band(Number(r[0]), r[1]), 'intolerable', r);
  for (const r of ['5D', '5E', '4C', '4D', '4E', '3B', '3C', '3D', '2A', '2B', '2C', '1A']) eq(await band(Number(r[0]), r[1]), 'tolerable', r);
  for (const r of ['3E', '2D', '2E', '1B', '1C', '1D', '1E']) eq(await band(Number(r[0]), r[1]), 'acceptable', r);
  eq(await band(6, 'A'), null, 'off the matrix');

  // The demo's notices: NZ 14 days overdue, AU 72 hours overdue, one due, one sent late.
  const n = await call('notifications', [], { all: true });
  ok(n.some((x) => x.ref === 'R-0147' && x.authority === 'CAA' && x.kind === 'details' && x.standing === 'overdue'), 'NZ serious incident details overdue after 14 days');
  ok(n.some((x) => x.ref === 'R-0144' && x.authority === 'ATSB' && x.kind === 'written' && x.standing === 'overdue'), 'AU written report overdue after 72 hours');
  ok(n.some((x) => x.ref === 'R-0141' && x.kind === 'details' && x.standing === 'due'), 'NZ details still due inside 14 days');
  ok(n.some((x) => x.ref === 'R-0149' && x.standing === 'sent late' && Number(x.hours_late) > 0), 'late notice measured in hours');
  ok(n.some((x) => x.ref === 'R-0141' && x.kind === 'initial' && x.standing === 'sent'), 'initial call sent');
  ok(!n.some((x) => x.ref === 'R-0148'), 'a suggestion owes no notice');
  const att = await call('attention');
  for (const item of ['notice overdue', 'notice due', 'intolerable risk, no open action', 'report not triaged', 'investigation overdue', 'action overdue', 'action not verified',
    'finding with no action', 'audit overdue', 'hazard never assessed', 'hazard review due', 'change not assessed', 'training expired', 'training never done', 'indicator above alert', 'flight hours missing']) {
    ok(att.some((a) => a.item === item), `attention raises ${item}`);
  }
  eq(att[0].item, 'notice overdue', 'regulator notices lead');
  const comp = await call('compliance');
  eq(comp[0].standing, 'breach', 'breaches first');
  ok(comp.every((c) => c.source), 'every rule cites its source');

  // Confidential reports stay confidential.
  const conf = (await call('reports')).find((r) => r.ref === 'R-0145');
  eq(conf.reporter, 'confidential');
  const detail = await call('report', ['R-0145']);
  ok(!JSON.stringify(detail).includes('Aroha'), 'report detail hides a confidential reporter');
  ok(!('reporter_id' in detail.report), 'no reporter id in the detail');

  // File, triage and notify a new AU occurrence.
  const cns = await ago('Australia/Brisbane', 5);
  await fails(() => call('file-report', [], { ...A, kind: 'occurrence', title: 'x', base: 'CNS', at: '2099-01-01 10:00' }), /future/, 'future occurrence refused');
  const filed = await call('file-report', [], { ...A, kind: 'occurrence', title: 'Hard landing at the Green Island pad', description: 'Firm touchdown in a gust.', base: 'Cairns', at: cns, aircraft: 'VHSAH', reporter: 'Sarah' });
  eq(filed.ref, 'R-0150', 'next report number');
  await fails(() => call('triage', ['R-0150'], { ...A, class: 'serious', category: 'runway-landing-site', by: 'Rangi', investigator: 'Sarah Lim' }), /investigator should not be the person who filed/);
  const tri = await call('triage', ['R-0150'], { ...A, class: 'serious', category: 'runway-landing-site', by: 'Rangi', investigator: 'Tom', hazard: 'H-007' });
  eq(tri.notices_owed.length, 2, 'an AU serious incident owes a call and a written report');
  ok(tri.notices_owed.every((x) => x.standing === 'due'), 'both still due');
  await fails(() => call('notify', ['R-0150'], { ...A, kind: 'details', by: 'Rangi', reference: 'x' }), /owes no details notice/, 'an AU report owes no CAA-style details');
  await fails(() => call('notify', ['R-0150'], { ...A, kind: 'written', by: 'Rangi', authority: 'CAA' }), /go to the ATSB/, 'wrong regulator refused');
  await fails(() => call('notify', ['R-0150'], { ...A, kind: 'written', by: 'Rangi' }), /reference is required/, 'written report needs a reference');
  const sent = await call('notify', ['R-0150'], { ...A, kind: 'initial', by: 'Rangi' });
  eq(sent.standing, 'sent');
  await fails(() => call('notify', ['R-0150'], { ...A, kind: 'initial', by: 'Rangi' }), /already recorded/);
  // A notice recorded after its deadline is measured as late.
  const late = await call('notify', ['R-0144'], { ...A, kind: 'written', by: 'Rangi', reference: 'ATSB OA2026-0981' });
  eq(late.standing, 'sent late', 'past 72 hours is late');

  // NZ accident deadlines: initial on the house target, details at 10 days.
  const zqn = await ago('Pacific/Auckland', 2);
  const acc = await call('file-report', [], { ...A, kind: 'occurrence', title: 'Skid struck a rock on landing', base: 'ZQN', at: zqn, aircraft: 'ZK-HSA' });
  const t2 = await call('triage', [acc.ref], { ...A, class: 'accident', category: 'runway-landing-site', by: 'Rangi' });
  ok(t2.notices_owed.some((x) => x.kind === 'initial' && /12\.51/.test(x.rule)) && t2.notices_owed.some((x) => x.kind === 'details' && /12\.53/.test(x.rule)), 'accident cites 12.51 and 12.53');
  const gap = await one(`select extract(epoch from (max(due_at) - min(due_at))) / 3600 as h from v_notifications where ref = $1`, [acc.ref]);
  eq(Math.round(Number(gap.h)), 240 - 24, 'details 10 days after, initial 24 hours after');
  await call('set', ['asap_hours', '6'], A);
  const gap2 = await one(`select extract(epoch from (max(due_at) - min(due_at))) / 3600 as h from v_notifications where ref = $1`, [acc.ref]);
  eq(Math.round(Number(gap2.h)), 240 - 6, 'asap_hours moves the initial target');
  await call('set', ['asap_hours', '24'], A);
  await fails(() => call('set', ['nope', '1'], A), /Unknown setting/);

  // The close-out gate.
  await fails(() => call('close-report', ['R-0143'], { ...A, outcome: 'x' }), /not been triaged/);
  await fails(() => call('close-report', ['R-0150'], { ...A, outcome: 'x' }), /ATSB written notice.*root cause/s, 'notice and root cause both block');
  await call('notify', ['R-0150'], { ...A, kind: 'written', by: 'Rangi', reference: 'ATSB OA2026-1002' });
  await fails(() => call('investigation', ['R-0143'], { ...A, 'root-cause': 'x' }), /triage it first/);
  await call('investigation', ['R-0150'], { ...A, 'root-cause': 'Gust front not in the forecast; no wind limit for the pad.' });
  const act = await call('add-action', [], { ...A, description: 'Set a wind limit for the Green Island pad', owner: 'Sarah', due: '2026-12-01', report: 'R-0150' });
  eq(act.ref, 'CA-038');
  ok(act.for.includes('H-007'), 'action inherits the report hazard');
  await fails(() => call('close-report', ['R-0150'], { ...A, outcome: 'x' }), /CA-038 is still open/);
  await fails(() => call('verify-action', ['CA-038'], { ...A, by: 'Rangi', effective: 'yes' }), /only a done action/);
  await fails(() => call('action-done', ['CA-038'], A), /--note is required/);
  await call('action-done', ['CA-038'], { ...A, note: 'Wind limit 25 kt added to the pad brief.' });
  await fails(() => call('close-report', ['R-0150'], { ...A, outcome: 'x' }), /done but not verified/);
  await fails(() => call('verify-action', ['CA-038'], { ...A, by: 'Sarah Lim', effective: 'yes' }), /Someone else checks/, 'the owner cannot verify');
  const v = await call('verify-action', ['CA-038'], { ...A, by: 'Tom', effective: 'yes' });
  ok(/assess H-007/.test(v.next), 'verification points at reassessing the hazard');
  const closed = await call('close-report', ['R-0150'], { ...A, outcome: 'Wind limit set for the pad.' });
  eq(closed.status, 'closed');
  await fails(() => call('close-report', ['R-0150'], { ...A, outcome: 'x' }), /already closed/);
  await fails(() => call('add-action', [], { ...A, description: 'x', owner: 'Tom', due: '2026-12-01' }), /Link the action/);
  await fails(() => db.query(`update actions set status = 'verified', verified_by = owner_id, verified_on = current_date, effective = true, done_on = current_date, done_note = 'x' where ref = 'CA-032'`), /check/, 'the database refuses self-verification too');

  // Hazards and the matrix.
  const hz = await call('add-hazard', [], { ...A, title: 'Night vision goggle failure on the medevac route', area: 'flight-ops', owner: 'Tom', change: 'MOC-07' });
  eq(hz.ref, 'H-009');
  await fails(() => call('change-status', ['MOC-07'], { ...A, status: 'approved', by: 'Helen' }), /H-009 is not assessed/, 'unassessed hazard blocks approval');
  const intol = await call('assess', ['H-009'], { ...A, likelihood: 'occasional', severity: 'hazardous', by: 'Rangi' });
  eq(intol.band, 'intolerable'); ok(intol.warning, 'intolerable warns');
  await fails(() => call('change-status', ['MOC-07'], { ...A, status: 'approved', by: 'Helen' }), /intolerable \(4B\)/, 'intolerable hazard blocks approval');
  await call('assess', ['H-009'], { ...A, likelihood: 2, severity: 'B', by: 'Rangi', controls: 'Dual NVG sets, goggle check before every sector' });
  await fails(() => call('change-status', ['MOC-07'], { ...A, status: 'approved', by: 'Aroha' }), /accountable manager or the safety manager/);
  await fails(() => call('change-status', ['MOC-07'], { ...A, status: 'implemented' }), /approved before it is implemented/);
  const appr = await call('change-status', ['MOC-07'], { ...A, status: 'approved', by: 'Helen' });
  eq(appr.status, 'approved');
  await fails(() => call('change-status', ['MOC-06'], { ...A, status: 'closed' }), /CA-037/, 'a change with open actions cannot close');
  await fails(() => call('close-hazard', ['H-004'], { ...A, reason: 'x' }), /not yet verified/);
  const rev = await call('review-hazard', ['H-005'], { ...A, note: 'Roster reviewed with the chief pilot.' });
  eq(rev.reviewed, (await one('select current_date::text as d')).d);
  ok(!(await call('attention')).some((a) => a.item === 'hazard review due' && a.ref === 'H-005'), 'review clears the flag');
  eq((await call('hazard', ['wire'])).hazard.ref, 'H-001', 'partial name resolves');
  await fails(() => call('hazard', ['strike']), /ambiguous/, 'ambiguous names list candidates');

  // Audits and findings.
  const au = await call('add-audit', [], { ...A, title: 'Queenstown passenger handling', area: 'passengers', scheduled: '2026-12-10', base: 'ZQN', auditor: 'Rangi' });
  eq(au.ref, 'AU-14');
  await call('audit-done', ['AU-14'], { ...A, summary: 'Boarding observed on six departures.' });
  await fails(() => call('audit-done', ['AU-14'], { ...A, summary: 'x' }), /was done on/);
  const fi = await call('add-finding', ['AU-14'], { ...A, level: 'minor', description: 'No briefing card in Mandarin.' });
  eq(fi.ref, 'F-14-1');
  ok((await call('attention')).some((a) => a.ref === 'F-14-1'), 'new finding with no action raised');
  await call('add-action', [], { ...A, description: 'Print Mandarin briefing cards', owner: 'Lucy', due: '2026-12-20', finding: 'F-14-1' });
  ok(!(await call('attention')).some((a) => a.ref === 'F-14-1'), 'action clears the finding');

  // People, aircraft, hours, training, indicators.
  const np = await call('add-person', [], { ...A, name: 'Mia Chen', role: 'pilot', base: 'CNS' });
  eq(np.code, 'P-11');
  ok((await call('training')).some((t) => t.name === 'Mia Chen' && t.standing === 'never done'), 'a new pilot needs training');
  await call('add-training', ['Mia'], { ...A, course: 'sms', completed: '2026-10-01' });
  ok(!(await call('training')).some((t) => t.name === 'Mia Chen' && t.course === 'sms'), 'training recorded');
  await fails(() => call('add-training', ['Mia'], { ...A, course: 'sms', completed: '2099-01-01' }), /future/);
  await fails(() => call('add-aircraft', ['ZK-HSAX'], { ...A, type: 'x', base: 'ZQN' }), /registration/);
  await call('add-aircraft', ['VH-SAJ'], { ...A, type: 'Airbus H125', base: 'CNS' });
  const thisMonth = (await one(`select to_char(current_date, 'YYYY-MM') as m`)).m;
  await fails(() => call('log-hours', ['ZK-SAF'], { ...A, month: thisMonth, hours: 10 }), /not finished/);
  await call('log-hours', ['ZK-SAF'], { ...A, month: await lastMonth(), hours: 58 });
  await call('log-hours', ['VH-SAJ'], { ...A, month: await lastMonth(), hours: 12 });
  ok(!(await call('attention')).some((a) => a.item === 'flight hours missing'), 'hours logged clears the flag');
  const spi = await call('add-spi', [], { ...A, code: 'spi-5', name: 'Landing site occurrences', category: 'runway-landing-site', target: 1, alert: 3 });
  eq(spi.code, 'SPI-5');
  await fails(() => call('add-spi', [], { ...A, code: 'x', name: 'x', target: 3, alert: 1 }), /at or above/);
  const left = await call('person-status', ['Lucy'], { ...A, status: 'left', reason: 'Moved to Wanaka' });
  ok(left.actions_to_reassign.length >= 1, 'leaving lists the actions to reassign');
  await fails(() => call('add-action', [], { ...A, description: 'x', owner: 'Lucy', due: '2026-12-01', hazard: 'H-004' }), /has left/);

  // Writes leave an audit trail, and the log cannot be changed.
  await call('log', ['h-005'], { ...A, note: 'Raised at the safety meeting.' });
  await fails(() => call('log', ['X-999'], { ...A, note: 'x' }), /not a known reference/);
  await fails(() => call('add-hazard', [], { title: 'x', area: 'flight-ops' }), /--actor is required/);
  await fails(() => call('nope'), /Unknown command/);
  ok((await call('activity')).length > 20, 'activity logged');
  await fails(() => db.query(`delete from activity`), /append-only/, 'activity cannot be deleted');
  await fails(() => db.query(`update activity set actor = 'x'`), /append-only/, 'activity cannot be changed');

  // Drafts never send; a confidential reporter never appears.
  const wr = await call('weekly-review');
  ok(existsSync(path.join(process.env.OUTPUT_DIR, wr.file)), 'weekly review written');
  const dn = await call('draft-notice', ['R-0147']);
  const dnText = readFileSync(path.join(process.env.OUTPUT_DIR, dn.file), 'utf8');
  ok(/CA005/.test(dnText) && /Homer Saddle/.test(dnText), 'CAA draft names the form and the event');
  await fails(() => call('draft-notice', ['R-0148']), /owes the regulator no notice/);
  const anon = await call('file-report', [], { ...A, kind: 'occurrence', title: 'Near miss with a drone at Milford', base: 'MFN', at: await ago('Pacific/Auckland', 3), reporter: 'Ben', confidential: true });
  await call('triage', [anon.ref], { ...A, class: 'serious', category: 'airspace', by: 'Rangi' });
  const anonDraft = readFileSync(path.join(process.env.OUTPUT_DIR, (await call('draft-notice', [anon.ref])).file), 'utf8');
  ok(!anonDraft.includes('Ben Hollis') && /confidential/.test(anonDraft), 'confidential reporter kept out of the draft');
  await fails(() => call('draft-bulletin', ['R-0141']), /no root cause/);
  const bl = readFileSync(path.join(process.env.OUTPUT_DIR, (await call('draft-bulletin', ['R-0149'])).file), 'utf8');
  ok(/refuel/i.test(bl) && !bl.includes('Matt Duncan'), 'bulletin has the cause and no names');
  const rem = await call('draft-action-reminder', ['Ben']);
  eq(rem.actions, 2);
  await fails(() => call('draft-action-reminder', ['Helen']), /no open actions/);

  // Import from SMS Pro: dry run, real, repeat, rollback.
  const rep = path.join(REPO_ROOT, 'examples', 'sms-pro', 'reports.csv');
  const haz = path.join(REPO_ROOT, 'examples', 'sms-pro', 'hazards.csv');
  const before = (await one('select count(*)::int as n from reports')).n;
  const dry = await call('import', ['sms-pro', rep], { ...A, kind: 'reports', base: 'ZQN', 'dry-run': true });
  eq(dry.added, 3); eq((await one('select count(*)::int as n from reports')).n, before, 'dry run writes nothing');
  const real = await call('import', ['sms-pro', rep], { ...A, kind: 'reports', base: 'ZQN' });
  eq(real.added, 3);
  const rpt = await call('import', ['sms-pro', rep], { ...A, kind: 'reports', base: 'ZQN' });
  eq(rpt.added, 0); eq(rpt.skipped, 3, 'repeat rows skipped');
  const imported = await db.query(`select r.status, a.rego, b.code from reports r left join aircraft a on a.id = r.aircraft_id join bases b on b.id = r.base_id where r.external_id like 'sms-pro:%' order by r.external_id`);
  eq(imported[0].status, 'closed'); eq(imported[0].rego, 'ZK-HSB', 'ZKHSB matches ZK-HSB');
  eq(imported[1].code, 'MFN', 'base matched by name'); eq(imported[1].status, 'new', 'open reports come in for triage');
  const h1 = await call('import', ['sms-pro', haz], { ...A, kind: 'hazards' });
  eq(h1.added, 2);
  const hr = await db.query(`select h.title, l.risk from hazards h join v_risk_latest l on l.hazard_id = h.id where h.external_id like 'sms-pro:%' order by h.external_id`);
  eq(hr[0].risk, '4C', 'occasional, major is 4C'); eq(hr[1].risk, '3B', 'severity 4 of 5 is B');
  const bad = path.join(root, 'bad.csv');
  (await import('node:fs')).writeFileSync(bad, 'Report Number,Event Date,Title\n2001,2026-10-01,Good row\n2002,not a date,Bad row\n');
  const n0 = (await one('select count(*)::int as n from reports')).n;
  await fails(() => call('import', ['sms-pro', bad], { ...A, kind: 'reports', base: 'ZQN' }), /row 3.*Nothing was imported/);
  eq((await one('select count(*)::int as n from reports')).n, n0, 'a bad row rolls back the whole file');
  await fails(() => call('import', ['sms-pro', rep], { ...A, kind: 'reports', map: 'nope=x' }), /--map key/);

  // Export.
  const ex = await call('export');
  ok(existsSync(ex.file) && ex.rows.reports > 10, 'export written');

  // Database checks hold even without the CLI.
  await fails(() => db.query(`insert into risk_assessments (hazard_id, likelihood, severity) select id, 6, 'A' from hazards limit 1`), /check/);
  await fails(() => db.query(`update reports set status = 'triaged' where ref = 'R-0143'`), /check/, 'a triaged report needs class and category');
  await fails(() => db.query(`insert into flight_hours (aircraft_id, month, hours) select id, '2026-10-15', 1 from aircraft limit 1`), /check/);

  // HTML is escaped in views and documents.
  await db.query(`update reports set title = '<script>x</script> gull' where ref = 'R-0141'`);
  await db.close(); db = null;
  for (const script of ['view.mjs', 'docs.mjs']) {
    const r = spawnSync(process.execPath, [path.join('scripts', script)], { cwd: REPO_ROOT, env: process.env, encoding: 'utf8' });
    eq(r.status, 0, `${script} runs: ${r.stderr}`);
  }
  const week = readFileSync(path.join(process.env.OUTPUT_DIR, 'views', 'week.html'), 'utf8');
  ok(week.includes('&lt;script&gt;') && !week.includes('<script>x'), 'views escape HTML');
  const docDir = path.join(process.env.OUTPUT_DIR, 'docs-out', 'occurrence-report');
  const docFile = readdirSync(docDir).find((f) => f.startsWith('r-0141'));
  ok(docFile && readFileSync(path.join(docDir, docFile), 'utf8').includes('&lt;script&gt;'), 'documents escape HTML');
  ok(readdirSync(path.join(process.env.OUTPUT_DIR, 'docs-out')).length === 4, 'four document types rendered');

  // Every CLI command has a slash command and a routing row.
  const md = readdirSync(path.join(REPO_ROOT, '.claude', 'commands')).map((f) => f.replace(/\.md$/, ''));
  const claude = readFileSync(path.join(REPO_ROOT, 'CLAUDE.md'), 'utf8');
  for (const c of commands) { ok(md.includes(c), `/${c} has a command file`); ok(claude.includes(`\`/${c}\``), `/${c} is routed in CLAUDE.md`); }

  console.log(`PASS: ${checks} checks, ${commands.length} CLI commands, ${md.filter((m) => m !== 'README').length} slash commands (${process.env.DATABASE_URL ? 'postgres' : 'pglite'})`);
} finally {
  await db?.close();
  rmSync(root, { recursive: true, force: true });
}
