/* AP® Physics 1 practice exams and score estimate (docs/apphys-architecture.md,
   "Practice exams", "Exams and entry pages"). Forked from apchem-exams.test.mjs;
   the course has no exam content yet (Phase 3), so the form checker is tested
   on synthetic forms built from a synthetic bank:
   - the score calculator's composite (pages/score.js) is 50/50 by section,
     out of 42 questions and 40 points (mr 10, tbr 12, lab 10, qqt 8), clamps
     its inputs, gives the band the practice exam gives for the same result
     (pages/exams.js), and says what reaches the next band;
   - the practice exam page runs the May 2027 format: 42 in 85 min, then the
     four types in order with times in proportion to points (95 min in all);
   - the unit weight ranges come out right for 42 questions;
   - a good form passes and the checker catches each way a form can break;
   - the generator serves no forms and no unit tests before anything is
     published, and a unit test once a unit is. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createBrowser } from './harness.mjs';
import { loadMap } from '../lib/apphys-build.mjs';
import { checkForms, unitRange, MCQ_TOTAL, FRQ_SLOTS, FRQ_POINTS, EXAM_NUMBERS, checkNumbers } from '../lib/apphys-exams.mjs';

const S = (() => { const b = createBrowser(); b.load('physics/assets/pages/score.js'); return b.window.ApPhysScore; })();

test('score: each section is half, out of 42 questions and 40 points', () => {
  assert.equal(S.MCQ, 42);
  assert.equal(S.FRQ_TOTAL, 40);
  assert.deepEqual([...S.FRQ], [10, 12, 10, 8]);
  assert.equal(S.composite(42, 40).composite, 100);
  assert.equal(S.composite(42, 0).composite, 50);
  assert.equal(S.composite(0, 40).composite, 50);
  assert.equal(S.composite(30, 25).composite, Math.round((50 * 30 / 42 + 50 * 25 / 40) * 10) / 10);
});

test('score: a list of the four question scores is summed, each capped at its points', () => {
  const r = S.composite(20, [10, 15, 7, 9]);
  assert.equal(r.frq, 10 + 12 + 7 + 8);
});

test('score: inputs are clamped and rounded', () => {
  assert.equal(S.composite(75, 60).composite, 100);
  assert.equal(S.composite(-5, -1).composite, 0);
  assert.equal(S.composite('abc', null).composite, 0);
  assert.equal(S.composite(20.6, 20).mcq, 21);
});

test('score: the calculator and the practice exam use the same cut-offs', () => {
  const cases = [[100, 5], [72, 5], [71.9, 4], [58, 4], [57.9, 3], [42, 3], [41.9, 2], [27, 2], [26.9, 1], [0, 1]];
  for (const [c, b] of cases) assert.equal(S.band(c), b, `composite ${c}`);
  const ex = readFileSync('physics/assets/pages/exams.js', 'utf8');
  const m = /function band\(p\)\{ return p >= (\d+) \? 5 : p >= (\d+) \? 4 : p >= (\d+) \? 3 : p >= (\d+) \? 2 : 1; \}/.exec(ex);
  assert.ok(m, 'exams.js still has its band function');
  assert.deepEqual(m.slice(1).map(Number), [...S.CUTS]);
  assert.match(ex, /0\.5 \* mcqP \+ 0\.5 \* \(fg \/ fo \* 100\)/, 'the practice exam weights the sections 50/50 too');
});

test('score: what it takes to reach the next band', () => {
  const r = S.composite(24, 18);   // 28.57 + 22.5 = 51.1, band 3
  assert.equal(r.band, 3);
  assert.equal(r.next.at, 58);
  assert.ok(S.composite(24 + r.next.mcq, 18).band >= 4);
  assert.ok(S.composite(24 + r.next.mcq - 1, 18).band < 4);
  assert.ok(S.composite(24, 18 + r.next.frq).band >= 4);
  assert.ok(S.composite(24, 18 + r.next.frq - 1).band < 4);
  assert.equal(S.composite(42, 40).next, null, 'nothing above band 5');
  assert.equal(S.composite(5, 40).next.frq, null, 'no FRQ route when the section is full');
});

test('the practice exam page runs the May 2027 format', () => {
  const ex = readFileSync('physics/assets/pages/exams.js', 'utf8');
  assert.match(ex, /var MCQ_TOTAL = 42, MCQ_SEC = 85 \* 60 \/ 42;/);
  assert.match(ex, /var FRQ_SLOTS = \['mr', 'tbr', 'lab', 'qqt'\];/);
  const sec = JSON.parse(ex.match(/var FRQ_SEC = (\{[^}]+\});/)[1].replace(/(\w+):/g, '"$1":'));
  const pts = JSON.parse(ex.match(/var FRQ_POINTS = (\{[^}]+\});/)[1].replace(/(\w+):/g, '"$1":'));
  assert.deepEqual(pts, FRQ_POINTS);
  assert.equal(Object.values(sec).reduce((a, b) => a + b, 0), 95 * 60, 'Section II is 95 minutes');
  for (const t of FRQ_SLOTS) assert.equal(sec[t] / (95 * 60), pts[t] / 40, `${t} time in proportion to its points`);
  assert.deepEqual(FRQ_SLOTS, ['mr', 'tbr', 'lab', 'qqt']);
  assert.equal(MCQ_TOTAL, 42);
  const kit = readFileSync('physics/assets/pages/frq-kit.js', 'utf8');
  assert.match(kit, /var ORDER = \['mr', 'tbr', 'lab', 'qqt'\];/);
  assert.match(readFileSync('physics/assets/pages/cram.js', 'utf8'), /var DEFAULT_EXAM = '2027-05-05';/);
});

/* --------------------------------------------------------- exam forms */
const map = loadMap();
const units = map.chapters.filter(c => c.part === 'course');

test('unit weight ranges for 42 questions match the course framework', () => {
  assert.deepEqual(unitRange([5, 8]), [2, 4]);
  assert.deepEqual(unitRange([10, 15]), [4, 7]);
  assert.deepEqual(unitRange([18, 23]), [7, 10]);
  // The midpoints can fill 42: the ranges' sums bracket it.
  const lo = units.reduce((s, u) => s + unitRange(u.weight)[0], 0), hi = units.reduce((s, u) => s + unitRange(u.weight)[1], 0);
  assert.ok(lo <= 42 && hi >= 42, `${lo}..${hi}`);
});

/* A synthetic bank and two forms that pass, so each rule can be broken once. */
function synth() {
  const counts = { 'unit-1': 5, 'unit-2': 8, 'unit-3': 8, 'unit-4': 5, 'unit-5': 5, 'unit-6': 3, 'unit-7': 3, 'unit-8': 5 };
  assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), 42);
  const bank = new Map(), orderOf = {};
  const forms = [1, 2].map(n => {
    const mcq = [];
    for (const [u, k] of Object.entries(counts)) {
      const topic = map.topics.find(t => t.chapter === u && t.kind === 'concept').id;
      for (let i = 0; i < k; i++) {
        const id = `phys-${topic}-${n * 100 + i}`;
        bank.set(id, { id, type: 'single', unit: u, topic, practice: '2.B', options: ['a', 'b', 'c', 'd'], correct: 0 });
        orderOf[id] = i;
        mcq.push([id]);
      }
    }
    return { id: `form-${n}`, title: `Practice exam ${n}`, mcq, frq: FRQ_SLOTS.map(t => `frq-${t}-${n}`) };
  });
  const frqs = Object.fromEntries(forms.flatMap(f => f.frq).map(id => [id, { id, type: id.split('-')[1], units: ['unit-1'] }]));
  return { forms, ctx: { map, bank, examItems: new Map(), frqs, orderOf: id => orderOf[id] } };
}

test('a form in the real format passes, and every way to break it is caught', () => {
  const { forms, ctx } = synth();
  assert.deepEqual(checkForms(forms, ctx), []);
  const clone = x => JSON.parse(JSON.stringify(x));
  const bad = (mut, re) => { const f = clone(forms); mut(f); const e = checkForms(f, ctx); assert.ok(e.some(x => re.test(x)), `${re}: ${e.join(' | ')}`); };
  bad(f => { f.pop(); }, /need at least 2 practice exams/);
  bad(f => { f[0].mcq.pop(); }, /Section I has 41 questions, not 42/);
  bad(f => { f[0].frq = f[0].frq.slice().reverse(); }, /question 1 must be mr/);
  bad(f => { f[0].frq.pop(); }, /Section II has 3 questions, not 4/);
  bad(f => { f[1].mcq[0] = f[0].mcq[0]; }, /is also in form-1/);
  bad(f => { const ones = f[0].mcq.filter(b => ctx.bank.get(b[0]).unit === 'unit-1'); f[0].mcq = f[0].mcq.filter(b => !ones.slice(0, 2).includes(b)).concat(f[1].mcq.filter(b => ctx.bank.get(b[0]).unit === 'unit-6').slice(0, 2)); }, /Unit 1 has 3 questions/);
  const ctx2 = { ...ctx, bank: new Map(ctx.bank) };
  const first = forms[0].mcq[0][0];
  ctx2.bank.set(first, { ...ctx.bank.get(first), practice: '1.A' });
  assert.ok(checkForms(forms, ctx2).some(e => /practice 1/.test(e)), 'Creating Representations is free response only');
});

test('no recomputed exam numbers yet, and the checker runs on an empty list', () => {
  assert.deepEqual(EXAM_NUMBERS, []);
  assert.deepEqual(checkNumbers(new Map(), []), []);
});

test('the generator serves nothing before a unit is published, and a unit test once one is', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'apphys-exams-')), 'physics');
  execFileSync(process.execPath, ['scripts/build-apphys.mjs', '--out', out], { env: { ...process.env, APPHYS_DATA: '', APPHYS_PUBLISHED: '' } });
  assert.deepEqual(JSON.parse(readFileSync(join(out, 'assets/exams/forms.json'), 'utf8')), []);
  assert.equal(existsSync(join(out, 'unit-tests')), false);
  const out2 = join(mkdtempSync(join(tmpdir(), 'apphys-exams-')), 'physics');
  execFileSync(process.execPath, ['scripts/build-apphys.mjs', '--out', out2], { env: { ...process.env, APPHYS_DATA: 'scripts/test/fixtures/apphys-data', APPHYS_PUBLISHED: 'unit-1,skills-math' } });
  const html = readFileSync(join(out2, 'unit-tests/unit-1.html'), 'utf8');
  assert.ok((html.match(/<div class="phys-q" data-qid=/g) || []).length >= 4, 'a sample of the unit\'s questions (the fixture is one small topic)');
  assert.match(html, /<details class="phys-q-key">/, 'answers readable without JavaScript');
  const calc = readFileSync(join(out2, 'score-calculator.html'), 'utf8');
  assert.match(calc, /50 &times; \(multiple-choice right &divide; 42\) \+ 50 &times; \(free-response points &divide; 40\)/);
});
