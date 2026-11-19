// Sweep DC fee API: every program x start x residence. Usage: node tests/sweep.mjs [raw-out.json]
import { writeFileSync } from 'node:fs';

const BASE = 'https://durhamcollege.ca/wp-json/dc/v2/programs/fees/';
const STARTS = ['fall', 'winter', 'spring'];
const RES = ['domestic', 'international'];
const FEES = ['TUITION', 'DC_ANCILLARY', 'DCSI_ANCILLARY', 'PROGRAM_FEE', 'COOP_FEE'];
const CONC = 5, DELAY = 100;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  let err;
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) { err = e; await sleep(500 * (i + 1)); }
  }
  throw err;
}

const programs = await get(BASE + 'programs');
const codes = Object.keys(programs);
console.log(`programs: ${codes.length}`);

const jobs = codes.flatMap((c) => STARTS.flatMap((s) => RES.map((r) => ({ c, s, r }))));
const results = [];
let idx = 0, done = 0;
async function worker() {
  while (idx < jobs.length) {
    const j = jobs[idx++];
    const url = `${BASE}program/${j.c.toLowerCase()}/${j.s}/${j.r}`;
    try { j.data = await get(url); } catch (e) { j.error = String(e.message || e); }
    results.push(j);
    if (++done % 200 === 0) console.log(`  ${done}/${jobs.length}`);
    await sleep(DELAY);
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(results));

// ---- analysis ----
const issues = {};
const add = (k, v) => (issues[k] ??= []).push(v);
const key = (j) => `${j.c}/${j.s}/${j.r}`;
const hasData = new Map(); // code|res -> Set(starts)

for (const j of results) {
  const d = j.data;
  if (j.error) { add('1 error', `${key(j)} ${j.error}`); continue; }
  if (Array.isArray(d) && !d.length) { add('1 empty []', key(j)); continue; }
  if (!d || typeof d !== 'object' || Array.isArray(d)) { add('1 non-object', `${key(j)} ${JSON.stringify(d)?.slice(0, 60)}`); continue; }
  const rows = Object.values(d).flat();
  if (!rows.length) { add('1 empty', key(j)); continue; }
  const hk = j.c + '|' + j.r;
  if (!hasData.has(hk)) hasData.set(hk, new Set());
  hasData.get(hk).add(j.s);

  const seen = new Map();
  for (const row of rows) {
    const sem = row.SEMESTER;
    if (typeof row !== 'object' || row === null) { add('1 non-object row', key(j)); continue; }
    if (!/^\d+$/.test(String(sem))) add('2 SEMESTER not integer', `${key(j)} SEMESTER=${JSON.stringify(sem)}`);
    for (const f of FEES) {
      const v = row[f];
      if (!(f in row)) add('3 fee missing', `${key(j)} ${f}`);
      else if (v === null || v === '') add('3 fee null/empty', `${key(j)} ${f}=${JSON.stringify(v)}`);
      else if (!Number.isFinite(Number(v))) add('3 fee non-numeric', `${key(j)} ${f}=${JSON.stringify(v)}`);
      else if (Number(v) < 0) add('3 fee negative', `${key(j)} ${f}=${v}`);
    }
    const total = FEES.reduce((a, f) => a + Number(row[f]), 0);
    if (total === 0) add('4 total 0', `${key(j)} SEMESTER=${sem}`);
    else if (Number.isNaN(total)) add('4 total NaN', `${key(j)} SEMESTER=${sem}`);
    seen.set(String(sem), (seen.get(String(sem)) || 0) + 1);
  }
  for (const [s, n] of seen) if (n > 1) add('5 duplicate SEMESTER', `${key(j)} SEMESTER=${s} x${n}`);
  // sort NaN check
  if (rows.some((a, i) => rows.some((b) => Number.isNaN(a.SEMESTER - b.SEMESTER))))
    add('2 sort NaN combo', key(j));
}

for (const [hk, set] of hasData) {
  if (set.size < 3) {
    const [c, r] = hk.split('|');
    add('6 partial starts', `${c}/${r} has: ${[...set].join(',')} missing: ${STARTS.filter((s) => !set.has(s)).join(',')}`);
  }
}
// programs with no data at all for a residence are covered by 1 empty

const coop = [];
for (const c of codes) {
  const nm = programs[c];
  const rows = results.filter((j) => j.c === c && j.data && typeof j.data === 'object').flatMap((j) => Object.values(j.data).flat());
  const flagged = /co-?op|internship|placement/i.test(nm) || rows.some((r) => r.COOP === 'Y');
  if (flagged) coop.push({ c, nm, sems: [...new Set(rows.map((r) => r.SEMESTER))].join(','), coopVals: [...new Set(rows.map((r) => r.COOP))].join('|'), coopFee: rows.filter((r) => Number(r.COOP_FEE) > 0).length });
}

console.log('\n==== SUMMARY ====');
for (const k of Object.keys(issues).sort()) {
  const v = issues[k];
  console.log(`\n[${k}] count=${v.length}`);
  v.slice(0, 5).forEach((x) => console.log('   ' + x));
}
if (!Object.keys(issues).length) console.log('no issues');
console.log(`\n[7 co-op/internship-ish] count=${coop.length}`);
coop.slice(0, 8).forEach((x) => console.log(`   ${x.c} "${x.nm}" semesters=${x.sems} COOP=${x.coopVals} rowsWithCoopFee=${x.coopFee}`));
const semShapes = {};
coop.forEach((x) => (semShapes[x.sems] = (semShapes[x.sems] || 0) + 1));
console.log('   semester-set distribution:', JSON.stringify(semShapes));
