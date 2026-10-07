/* AP® Chemistry practice exams, score estimate and justification trainer
   (docs/apchem-architecture.md, "Practice exams", "Justification trainer",
   "Exams and entry pages"):
   - the score calculator's composite (pages/score.js) is 50/50 by section,
     clamps its inputs, gives the band the practice exam gives for the same
     result (pages/exams.js), and says what reaches the next band;
   - the two fixed exams pass every assembly rule against the real data,
     and the checker catches each way a form can break;
   - the unit weight ranges come out as the CED's 7-9%, 11-15% and 18-22%;
   - every recomputed number matches its key, and the prompts pass;
   - the generator serves the forms, the prompts (the first three free) and a
     12-question unit test per published unit, all readable without JS. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createBrowser } from './harness.mjs';
import { loadMap, trademarkProblems } from '../lib/apchem-build.mjs';
import { scanPage } from '../lib/apchem-map.mjs';
import { loadExams, loadJustify, checkForms, checkJustify, checkNumbers, unitRange, formUnits, MCQ_TOTAL, FRQ_SLOTS, FREE_JUSTIFY } from '../lib/apchem-exams.mjs';

const S = (() => { const b = createBrowser(); b.load('chem/assets/pages/score.js'); return b.window.ApChemScore; })();

test('score: each section is half, out of 60 questions and 46 points', () => {
  assert.equal(S.MCQ, 60);
  assert.equal(S.FRQ_TOTAL, 46);
  assert.deepEqual([...S.FRQ], [10, 10, 10, 4, 4, 4, 4]);
  assert.equal(S.composite(60, 46).composite, 100);
  assert.equal(S.composite(0, 0).composite, 0);
  assert.equal(S.composite(30, 23).composite, 50);
  assert.equal(S.composite(60, 0).composite, 50);
  assert.equal(S.composite(0, 46).composite, 50);
  assert.equal(S.composite(45, 30).composite, Math.round((50 * 45 / 60 + 50 * 30 / 46) * 10) / 10);
});

test('score: a list of seven question scores is summed, each capped at its points', () => {
  const r = S.composite(40, [10, 7, 12, 4, 3, 9, -2]);
  assert.equal(r.frq, 10 + 7 + 10 + 4 + 3 + 4 + 0);
  assert.equal(S.composite(40, [5, 5, 5, 2, 2, 2, 2]).frq, 23);
});

test('score: inputs are clamped and rounded', () => {
  assert.equal(S.composite(75, 60).composite, 100);
  assert.equal(S.composite(-5, -1).composite, 0);
  assert.equal(S.composite('abc', null).composite, 0);
  assert.equal(S.composite(40.6, 20).mcq, 41);
});

test('score: bands at 72, 58, 42 and 27, the same as the practice exam', () => {
  const cases = [[100, 5], [72, 5], [71.9, 4], [58, 4], [57.9, 3], [42, 3], [41.9, 2], [27, 2], [26.9, 1], [0, 1]];
  for (const [c, b] of cases) assert.equal(S.band(c), b, `composite ${c}`);
  const ex = readFileSync('chem/assets/pages/exams.js', 'utf8');
  const m = /function band\(p\)\{ return p >= (\d+) \? 5 : p >= (\d+) \? 4 : p >= (\d+) \? 3 : p >= (\d+) \? 2 : 1; \}/.exec(ex);
  assert.ok(m, 'exams.js still has its band function');
  assert.deepEqual(m.slice(1).map(Number), [...S.CUTS], 'the calculator and the practice exam use the same cut-offs');
  assert.match(ex, /0\.5 \* mcqP \+ 0\.5 \* \(fg \/ fo \* 100\)/, 'the practice exam weights the sections 50/50 too');
});

test('score: what it takes to reach the next band', () => {
  const r = S.composite(36, 20);   // 30 + 21.74 = 51.7, band 3
  assert.equal(r.band, 3);
  assert.equal(r.next.band, 4);
  assert.equal(r.next.at, 58);
  // 6.26 composite points: 8 more MCQ (50/60 each) or 6 more FRQ points (50/46 each).
  assert.equal(r.next.mcq, 8);
  assert.equal(r.next.frq, 6);
  assert.ok(S.composite(36 + r.next.mcq, 20).band >= 4);
  assert.ok(S.composite(36 + r.next.mcq - 1, 20).band < 4);
  assert.ok(S.composite(36, 20 + r.next.frq).band >= 4);
  assert.ok(S.composite(36, 20 + r.next.frq - 1).band < 4);
  assert.equal(S.composite(60, 46).next, null, 'nothing above band 5');
  const close = S.composite(56, 10);  // 46.7 + 10.9 = 57.5: one more question (47.5 + 10.9) reaches 58
  assert.equal(close.next.mcq, 1);
  const capped = S.composite(5, 46);  // 4.2 + 50 = 54.2, needs 3.8 more: FRQ is full
  assert.equal(capped.next.frq, null, 'no FRQ route when the section is full');
});

/* --------------------------------------------------------- exam forms */
const DATA = 'chem/data';
const map = loadMap();
const ex = loadExams(DATA);
const bank = new Map(), orderOf = {};
for (const t of map.topics) { const p = join(DATA, 'questions', `${t.id}.json`); if (existsSync(p)) JSON.parse(readFileSync(p, 'utf8')).items.forEach((q, i) => { bank.set(q.id, q); orderOf[q.id] = i; }); }
ex.items.forEach((q, i) => { orderOf[q.id] = i; });
const examItems = new Map(ex.items.map(q => [q.id, q]));
const frqs = Object.fromEntries(readdirSync(join(DATA, 'frq')).map(f => JSON.parse(readFileSync(join(DATA, 'frq', f), 'utf8'))).map(f => [f.id, f]));
const ctx = { map, bank, examItems, frqs, orderOf: id => orderOf[id] };
const clone = x => JSON.parse(JSON.stringify(x));

test('unit weight ranges match the course framework', () => {
  assert.deepEqual(unitRange([7, 9]), [4, 6]);
  assert.deepEqual(unitRange([11, 15]), [6, 9]);
  assert.deepEqual(unitRange([18, 22]), [10, 14]);
});

test('the two practice exams pass every assembly rule', () => {
  assert.ok(ex.forms.length >= 2);
  assert.deepEqual(checkForms(ex.forms, ctx), []);
  for (const f of ex.forms) {
    assert.equal(f.mcq.flat().length, MCQ_TOTAL);
    assert.deepEqual(f.frq.map(id => frqs[id].type), FRQ_SLOTS);
    const sets = f.mcq.filter(b => b.length > 1);
    assert.ok(sets.length >= 8, `${f.id}: many questions in stimulus sets (${sets.length} sets)`);
    assert.ok(sets.flat().length >= 30, `${f.id}: at least half the questions in sets`);
    const units = formUnits(f, ctx);
    assert.equal(units.filter(u => u.startsWith('unit-')).length, 9, 'every unit is on each exam');
    const by = {}; for (const id of f.mcq.flat()) { const q = bank.get(id) || examItems.get(id); by[q.unit] = (by[q.unit] || 0) + 1; }
    const max = Object.entries(by).sort((a, b) => b[1] - a[1]);
    assert.equal(max[0][0], 'unit-3', 'Unit 3 is the heaviest');
    assert.equal(max[1][0], 'unit-8', 'Unit 8 is next');
  }
});

test('the assembly check catches a broken form', () => {
  const bad = (mut, re) => { const f = clone(ex.forms); mut(f); const e = checkForms(f, ctx); assert.ok(e.some(x => re.test(x)), `${re}: ${e.join(' | ')}`); };
  bad(f => { f[0].mcq.pop(); }, /Section I has \d+ questions, not 60/);
  bad(f => { f[1].mcq[0] = f[0].mcq[0]; }, /is also in form-1/);
  bad(f => { const i = f[0].mcq.findIndex(b => b.length > 2); f[0].mcq[i] = f[0].mcq[i].slice().reverse(); }, /not in authored order/);
  bad(f => { const i = f[0].mcq.findIndex(b => b.length > 2); const b = f[0].mcq[i]; f[0].mcq.splice(i, 1, [b[0]], b.slice(1)); }, /needs its stimulus|has 2 questions/);
  bad(f => { f[0].frq = f[0].frq.slice().reverse(); }, /must be long/);
  bad(f => { f[1].frq[0] = f[0].frq[0]; }, /FRQ .* is also in form-1/);
  bad(f => { const own = f[0].mcq.findIndex(b => b.some(id => id.startsWith('chem-exam-1-'))); const j = f[1].mcq.findIndex(b => b.length === 1 && !b[0].startsWith('chem-exam-')); f[1].mcq[j] = f[0].mcq[own]; }, /belongs to form-1/);
  bad(f => { const keep = f[0].mcq.filter(b => (bank.get(b[0]) || examItems.get(b[0])).unit !== 'unit-3'); const filler = [...bank.values()].filter(q => q.unit === 'unit-1' && q.type === 'single' && !q.stimulus && !f.flatMap(x => x.mcq.flat()).includes(q.id)).slice(0, 60 - keep.flat().length); f[0].mcq = [...keep, ...filler.map(q => [q.id])]; }, /Unit 3 has 0 questions/);
  bad(f => { f.pop(); }, /need at least 2 practice exams/);
});

test('every recomputed number matches its key, and the prompts pass', () => {
  const prompts = loadJustify(DATA, map);
  assert.deepEqual(checkNumbers(examItems, prompts), []);
  assert.deepEqual(checkJustify(prompts, { map, trademarkProblems, scanPage }), []);
  assert.ok(prompts.length >= 30);
  for (const u of map.chapters.filter(c => c.part === 'course')) assert.ok(prompts.some(p => p.unit === u.id), `a prompt for ${u.id}`);
  // A wrong key is caught.
  const m = new Map(examItems); const q = clone(m.get('chem-exam-1-15')); q.correct = 1; m.set(q.id, q);
  assert.ok(checkNumbers(m, prompts).some(e => /chem-exam-1-15/.test(e)));
});

test('the generator serves the exams, the prompts and the unit tests', () => {
  const root = mkdtempSync(join(tmpdir(), 'apchem-exams-'));
  const out = join(root, 'chem');
  execFileSync(process.execPath, ['scripts/build-apchem.mjs', '--out', out], { env: { ...process.env, APCHEM_DATA: '', APCHEM_PUBLISHED: 'unit-1,unit-2,unit-3,unit-4,unit-5,unit-6,unit-7,unit-8,unit-9,skills-math' } });
  const forms = JSON.parse(readFileSync(join(out, 'assets/exams/forms.json'), 'utf8'));
  assert.equal(forms.length, ex.forms.length);
  const own = JSON.parse(readFileSync(join(out, 'assets/exams/items.json'), 'utf8'));
  assert.equal(own.items.length, ex.items.length);
  assert.ok(own.items.every(q => q.why && q.why.correct), 'exam-only items carry their explanations');
  const j = JSON.parse(readFileSync(join(out, 'assets/justify.json'), 'utf8'));
  assert.equal(j.prompts.filter(p => p.free).length, FREE_JUSTIFY);
  assert.ok(j.prompts.slice(0, FREE_JUSTIFY).every(p => p.free), 'the first prompts in course order are the free ones');
  for (let n = 1; n <= 9; n++) {
    const html = readFileSync(join(out, `unit-tests/unit-${n}.html`), 'utf8');
    const qs = html.match(/<div class="chem-q" data-qid=/g) || [];
    assert.equal(qs.length, 12, `unit ${n} sample has 12 questions`);
    assert.match(html, new RegExp(`practice\\.html\\?unit=unit-${n}`));
    assert.match(html, /<details class="chem-q-key">/, 'answers readable without JavaScript');
    assert.doesNotMatch(html, /chem-exam-/, 'exam-only questions never appear on a free page');
  }
  // With nothing published, nothing is served.
  const out2 = join(mkdtempSync(join(tmpdir(), 'apchem-exams-')), 'chem');
  execFileSync(process.execPath, ['scripts/build-apchem.mjs', '--out', out2], { env: { ...process.env, APCHEM_DATA: '', APCHEM_PUBLISHED: '' } });
  assert.deepEqual(JSON.parse(readFileSync(join(out2, 'assets/exams/forms.json'), 'utf8')), []);
  assert.equal(existsSync(join(out2, 'unit-tests')), false);
});
