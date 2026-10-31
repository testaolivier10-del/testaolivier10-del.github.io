/* The AP® Calculus BC generator (scripts/build-apcalcbc.mjs, the AB generator with the BC
   profile) against the real BC map, AB's real authored data and the BC placeholder sample in
   scripts/test/fixtures/apcalcbc-data (one 10.13 topic with an interval item, a numeric and an
   expr item, two stimulus sets, and one FRQ of each BC type; never in calculus-bc/data). With
   Units 6, 9 and 10 published it builds AB's Unit 6 topics from calculus/data/ and the BC topic
   from the fixture into calculus-bc/, every page running AB's runtime from /calculus/assets/
   with window.ApCalcCourse; AB topic pages name the AB page as canonical; BC question ids are
   cbc-; there is no score calculator and no readiness band; the BC site rules pass. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import trademark from '../site-rules/apcalcbc-trademark.mjs';
import beta from '../site-rules/apcalcbc-beta-and-report.mjs';

const FIX = 'scripts/test/fixtures/apcalcbc-data';
const T = 'radius-interval-convergence';
function build(published) {
  const root = mkdtempSync(join(tmpdir(), 'apcalcbc-build-'));
  const env = { ...process.env, APCALCBC_DATA: FIX, APCALCBC_PUBLISHED: published };
  delete env.APCALC_COURSE;
  execFileSync(process.execPath, ['scripts/build-apcalcbc.mjs', '--out', join(root, 'calculus-bc')], { env });
  const files = [];
  const walk = d => { for (const n of readdirSync(d)) { const f = join(d, n); statSync(f).isDirectory() ? walk(f) : files.push(f); } };
  walk(root);
  return { root, files, rel: files.map(f => f.slice(root.length + 1)), html: files.filter(f => f.endsWith('.html')) };
}
const B = build('unit-6,unit-9,unit-10');
const read = r => readFileSync(join(B.root, r), 'utf8');

test('AB topics come from calculus/data, BC topics from calculus-bc/data, in one course', () => {
  for (const p of ['index.html', 'learn.html', 'glossary.html', 'units/unit-6.html', 'units/unit-10.html', `lessons/${T}.html`, `notes/${T}.html`, 'lessons/antiderivatives.html', 'notes/u-substitution.html', 'unit-sheets/unit-10.html', 'practice.html', 'exams.html', 'frq.html', 'formula-sheet.html', 'assets/bank/index.json', 'assets/calc-curriculum.js'])
    assert.ok(B.rel.includes(`calculus-bc/${p}`), p);
  assert.ok(B.rel.every(r => !/(^|[^a-z0-9])ap([^a-z0-9]|$)/i.test(r.slice('calculus-bc/'.length))));
  // The 6.11-6.13 topics have no files yet, so Unit 6 shows them as coming soon, in CED order.
  const unit6 = read('calculus-bc/units/unit-6.html');
  assert.ok(unit6.indexOf('Integration by Parts') > unit6.indexOf('Long Division') && unit6.indexOf('Integration by Parts') < unit6.indexOf('Choosing an Antidifferentiation'));
});

test('no score calculator and no readiness band (owner 2026-10-14)', () => {
  assert.ok(!B.rel.includes('calculus-bc/score-calculator.html'));
  assert.doesNotMatch(read('calculus-bc/formula-sheet.html'), /score-calculator/);
  assert.match(read('calculus-bc/exams.html'), /"band":false/);
});

test('pages run AB\'s runtime, told which course they are', () => {
  const p = read(`calculus-bc/lessons/${T}.html`);
  assert.match(p, /<script src="\.\.\/\.\.\/calculus\/assets\/calc-core\.js" defer>/);
  assert.match(p, /<script src="\.\.\/assets\/calc-curriculum\.js" defer>/);
  assert.match(p, /href="\.\.\/\.\.\/calculus\/assets\/calc\.css"/);
  assert.match(p, /href="\.\.\/assets\/cbc\.css"/);
  assert.match(p, /<body class="calc cbc" data-course="apcalcbc"/);
  const cfg = JSON.parse(p.match(/window\.ApCalcCourse = (\{[^<]*?\});/)[1]);
  assert.equal(cfg.key, 'apcalcbc'); assert.equal(cfg.rt, '../../calculus/'); assert.equal(cfg.band, false); assert.equal(cfg.score, false);
  assert.deepEqual(Object.keys(cfg.frqTypes).slice(-3), ['parametric', 'techniques', 'series']);
});

test('AB topic pages name the AB page as canonical; BC pages their own', () => {
  assert.match(read('calculus-bc/lessons/antiderivatives.html'), /<link rel="canonical" href="https:\/\/levlprep\.com\/calculus\/lessons\/antiderivatives\.html">/);
  assert.match(read('calculus-bc/notes/u-substitution.html'), /<link rel="canonical" href="https:\/\/levlprep\.com\/calculus\/notes\/u-substitution\.html">/);
  assert.match(read(`calculus-bc/notes/${T}.html`), new RegExp(`<link rel="canonical" href="https://levlprep\\.com/calculus-bc/notes/${T}\\.html">`));
});

test('the bank: AB ids calc-, BC ids cbc-; the interval key is rendered math', () => {
  const ix = JSON.parse(read('calculus-bc/assets/bank/index.json'));
  assert.ok(ix.t[T] && ix.t.antiderivatives);
  const cur = read('calculus-bc/assets/calc-curriculum.js');
  assert.match(cur, new RegExp(`"id":"${T}"[^}]*"pfx":"cbc"`));
  assert.doesNotMatch(cur, /"id":"antiderivatives"[^}]*"pfx"/);
  const bank = JSON.parse(read('calculus-bc/assets/bank/unit-10.json'));
  const iv = bank.items.find(q => q.type === 'interval');
  assert.match(iv.id, /^cbc-/);
  assert.match(iv.interval.answerHtml, /<math class="calc-m">[\s\S]*\[1, 5\)/);
  assert.match(read(`calculus-bc/lessons/${T}.html`), /Answer: <math class="calc-m">/);
});

test('BC FRQ types are served, with AB\'s FRQs for the shared questions', () => {
  const ix = JSON.parse(read('calculus-bc/assets/frq/index.json'));
  for (const t of ['parametric', 'techniques', 'series']) assert.ok(ix.some(f => f.type === t), t);
  assert.ok(ix.some(f => /^frq-u6-/.test(f.id)));
});

test('AB trainers are linked, never built under calculus-bc/', () => {
  assert.ok(!B.rel.some(r => r.startsWith('calculus-bc/tools/')));
  const hub = read('calculus-bc/tools.html');
  if (existsSync('calculus/tools/riemann-sums.html')) assert.match(hub, /href="\.\.\/calculus\/tools\/riemann-sums\.html"/);
});

test('the course rules pass, and with nothing published every page is noindex', () => {
  const fails = [];
  trademark({ ROOT: B.root, fail: m => fails.push(m), htmlFiles: B.html });
  beta({ ROOT: B.root, fail: m => fails.push(m), htmlFiles: B.html });
  assert.deepEqual(fails, []);
  const E = build('');
  for (const f of E.html) assert.match(readFileSync(f, 'utf8'), /noindex/, f);
});
