/* AP® Calculus AB practice exams, justification trainer, formula page and
   score estimate (docs/apcalc-architecture.md, "Practice exams",
   "Justification trainer", "Exams and entry pages"). Forked from
   apphys-exams.test.mjs:
   - the score calculator's composite (pages/score.js) is 50/50 by section,
     out of 42 questions and 54 points (6 FRQs of 9), clamps its inputs,
     gives the band the practice exam gives for the same result
     (pages/exams.js), and says what reaches the next band;
   - the practice exam page runs the May 2027 format: Section I Part A 29 in
     62 min without a calculator, Part B 13 in 38 min with one; Section II
     Part A 2 FRQs in 30 min with a calculator, Part B 4 in 60 min without;
     a calculator notice per part, with a link (no embedded script);
   - the unit weight ranges come out right for 42 questions;
   - a good form passes and the checker catches each way a form can break
     (synthetic forms; Phase 3 writes the real ones);
   - the justification checker refuses a value theorem without continuity;
   - the generator serves no forms and no unit tests before anything is
     published, a unit test once one is, and the formula and score pages. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createBrowser } from './harness.mjs';
import { loadMap } from '../lib/apcalc-build.mjs';
import { loadExams, checkForms, checkJustify, unitRange, MCQ_TOTAL, MCQ_PARTS, FRQ_PARTS, FRQ_POINTS, FRQ_TOTAL, JUSTIFY_SKILLS } from '../lib/apcalc-exams.mjs';
import { EQ } from '../lib/apcalc-entry.mjs';

const S = (() => { const b = createBrowser(); b.load('calculus/assets/pages/score.js'); return b.window.ApCalcScore; })();

test('score: each section is half, out of 42 questions and 54 points', () => {
  assert.equal(S.MCQ, 42);
  assert.equal(S.FRQ_TOTAL, 54);
  assert.deepEqual([...S.FRQ], [9, 9, 9, 9, 9, 9]);
  assert.equal(S.composite(42, 54).composite, 100);
  assert.equal(S.composite(42, 0).composite, 50);
  assert.equal(S.composite(0, 54).composite, 50);
  assert.equal(S.composite(30, 25).composite, Math.round((50 * 30 / 42 + 50 * 25 / 54) * 10) / 10);
  assert.equal(S.composite(20, [9, 12, 7, 9, 9, 9]).frq, 9 + 9 + 7 + 27, 'each question capped at 9');
  assert.equal(S.composite(75, 60).composite, 100);
  assert.equal(S.composite(-5, -1).composite, 0);
});

test('score: the calculator and the practice exam use the same placeholder cut-offs (64, 48, 37, 27)', () => {
  assert.deepEqual([...S.CUTS], [64, 48, 37, 27]);
  for (const [c, b] of [[100, 5], [64, 5], [63.9, 4], [48, 4], [37, 3], [27, 2], [26.9, 1]]) assert.equal(S.band(c), b, `composite ${c}`);
  const ex = readFileSync('calculus/assets/pages/exams.js', 'utf8');
  const m = /function band\(p\)\{ return p >= (\d+) \? 5 : p >= (\d+) \? 4 : p >= (\d+) \? 3 : p >= (\d+) \? 2 : 1; \}/.exec(ex);
  assert.ok(m, 'exams.js still has its band function');
  assert.deepEqual(m.slice(1).map(Number), [...S.CUTS]);
  assert.match(ex, /0\.5 \* mcqP \+ 0\.5 \* \(fg \/ fo \* 100\)/, 'the practice exam weights the sections 50/50 too');
  assert.match(ex, /Not calibrated/);
  const r = S.composite(24, 18);
  assert.ok(S.composite(24 + r.next.mcq, 18).band > r.band && S.composite(24 + r.next.mcq - 1, 18).band === r.band);
  assert.equal(S.composite(42, 54).next, null, 'nothing above band 5');
});

test('the practice exam page runs the May 2027 format, a calculator notice per part', () => {
  const ex = readFileSync('calculus/assets/pages/exams.js', 'utf8');
  assert.match(ex, /var MCQ_PARTS = \[\{ key: 'A', n: 29, sec: 62 \* 60, calc: false \}, \{ key: 'B', n: 13, sec: 38 \* 60, calc: true \}\];/);
  assert.match(ex, /var FRQ_PARTS = \[\{ key: 'A', n: 2, sec: 30 \* 60, calc: true \}, \{ key: 'B', n: 4, sec: 60 \* 60, calc: false \}\];/);
  assert.match(ex, /var FRQ_POINTS = 9;/);
  assert.deepEqual(MCQ_PARTS.map(p => [p.n, p.minutes, p.calc]), [[29, 62, false], [13, 38, true]]);
  assert.deepEqual(FRQ_PARTS.map(p => [p.n, p.minutes, p.calc]), [[2, 30, true], [4, 60, false]]);
  assert.equal(MCQ_TOTAL, 42); assert.equal(FRQ_POINTS, 9); assert.equal(FRQ_TOTAL, 6);
  // A link to a free graphing calculator, never a third-party script.
  assert.match(ex, /https:\/\/www\.desmos\.com\/calculator/);
  assert.doesNotMatch(ex, /createElement\('script'\)[\s\S]{0,80}desmos/i);
  assert.match(ex, /Calculator allowed\.[\s\S]*No calculator\./);
  assert.match(readFileSync('calculus/assets/pages/cram.js', 'utf8'), /var DEFAULT_EXAM = '2027-05-10';/);
  assert.match(readFileSync('assets/exam-date.js', 'utf8'), /apcalc: \{ date: '2027-05-10', label: 'AP® Calculus AB exam \(Mon, May 10, 2027\)' \}/);
  // The exam engine parses and its part flow is wired.
  for (const fn of ['startExam', 'startSectionOne', 'endSectionOne', 'startSectionTwo', 'endFrqPart', 'selfScore', 'calcNotice']) assert.match(ex, new RegExp(`function ${fn}\\(`));
});

/* --------------------------------------------------------- exam forms */
const map = loadMap();
const units = map.chapters.filter(c => c.part === 'course');

test('unit weight ranges for 42 questions match the course framework', () => {
  assert.deepEqual(unitRange([5, 10]), [2, 5]);
  assert.deepEqual(unitRange([10, 15]), [4, 7]);
  assert.deepEqual(unitRange([15, 20]), [6, 9]);
  const lo = units.reduce((s, u) => s + unitRange(u.weight)[0], 0), hi = units.reduce((s, u) => s + unitRange(u.weight)[1], 0);
  assert.ok(lo <= 42 && hi >= 42, `${lo}..${hi}`);
});

/* A synthetic bank and two forms that pass, so each rule can be broken once:
   per unit, its no-calculator questions, then (in Part B) its calculator ones. */
function synth() {
  const A = { 'unit-1': 4, 'unit-2': 4, 'unit-3': 3, 'unit-4': 3, 'unit-5': 4, 'unit-6': 5, 'unit-7': 2, 'unit-8': 4 };
  const B = { 'unit-1': 1, 'unit-2': 1, 'unit-3': 0, 'unit-4': 2, 'unit-5': 3, 'unit-6': 2, 'unit-7': 1, 'unit-8': 3 };
  assert.equal(Object.values(A).reduce((a, b) => a + b, 0), 29);
  assert.equal(Object.values(B).reduce((a, b) => a + b, 0), 13);
  const bank = new Map(), orderOf = {};
  const forms = [1, 2].map(n => {
    const mcq = [];
    for (const [part, counts] of [[false, A], [true, B]]) for (const [u, k] of Object.entries(counts)) {
      const topic = map.topics.find(t => t.chapter === u && t.kind === 'concept').id;
      for (let i = 0; i < k; i++) {
        const id = `calc-${topic}-${n * 100 + (part ? 50 : 0) + i}`;
        bank.set(id, { id, type: 'single', unit: u, topic, practice: '1.E', options: ['a', 'b', 'c', 'd'], correct: 0, ...(part ? { calc: true } : {}) });
        orderOf[id] = i;
        mcq.push([id]);
      }
    }
    return { id: `form-${n}`, title: `Practice exam ${n}`, mcq, frq: ['table', 'model', 'motion', 'graph', 'de', 'implicit'].map(t => `frq-${t}-${n}`) };
  });
  const frqs = Object.fromEntries(forms.flatMap(f => f.frq.map((id, i) => [id, { id, type: id.split('-')[1], units: ['unit-1'], points: 9, calc: i < 2 }])));
  return { forms, ctx: { map, bank, examItems: new Map(), frqs, orderOf: id => orderOf[id] } };
}

test('a form in the real format passes, and every way to break it is caught', () => {
  const { forms, ctx } = synth();
  assert.deepEqual(checkForms(forms, ctx), []);
  const clone = x => JSON.parse(JSON.stringify(x));
  const bad = (mut, re, c = ctx) => { const f = clone(forms); mut(f); const e = checkForms(f, c); assert.ok(e.some(x => re.test(x)), `${re}: ${e.join(' | ')}`); };
  bad(f => { f.pop(); }, /need at least 2 practice exams/);
  bad(f => { f[0].mcq.pop(); }, /Section I has 41 questions, not 42/);
  bad(f => { f[0].mcq.pop(); }, /12 calculator questions; Part A is 29 and Part B 13/);
  bad(f => { const last = f[0].mcq.pop(); f[0].mcq.unshift(last); }, /Part A \(no calculator\) comes before Part B/);
  bad(f => { f[0].frq = f[0].frq.slice().reverse(); }, /Section II question 1 is in Part A \(calculator\)/);
  bad(f => { f[0].frq.pop(); }, /Section II has 5 questions, not 6/);
  bad(f => { f[1].mcq[0] = f[0].mcq[0]; }, /is also in form-1/);
  bad(f => { f[1].frq[0] = f[0].frq[0]; }, /FRQ .* is also in form-1/);
  bad(f => { const ones = f[0].mcq.filter(b => ctx.bank.get(b[0]).unit === 'unit-1' && !ctx.bank.get(b[0]).calc); f[0].mcq = f[0].mcq.filter(b => !ones.slice(0, 2).includes(b)); f[0].mcq.splice(10, 0, ...f[1].mcq.filter(b => ctx.bank.get(b[0]).unit === 'unit-6' && !ctx.bank.get(b[0]).calc).slice(0, 2)); }, /Unit 1 has 3 questions/);
  const ctx2 = { ...ctx, bank: new Map(ctx.bank) };
  const first = forms[0].mcq[0][0];
  ctx2.bank.set(first, { ...ctx.bank.get(first), practice: '4.C' });
  bad(() => {}, /practice 4/, ctx2);
  const ctx3 = { ...ctx, frqs: { ...ctx.frqs } };
  for (const id of forms[0].frq.slice(2, 5)) ctx3.frqs[id] = { ...ctx3.frqs[id], type: 'area' };
  bad(() => {}, /3 questions of type area \(at most 2\)/, ctx3);
  const ctx4 = { ...ctx, frqs: { ...ctx.frqs, [forms[0].frq[0]]: { ...ctx.frqs[forms[0].frq[0]], points: 10 } } };
  bad(() => {}, /worth 10 points, not 9/, ctx4);
});

test('the justification checker wants a value theorem with its hypotheses', () => {
  assert.deepEqual(Object.keys(JUSTIFY_SKILLS).sort(), ['accumulation', 'behavior', 'context', 'de', 'extrema', 'limits', 'motion', 'theorems']);
  const p = {
    id: 'u5-mvt-speed', unit: 'unit-5', topic: 'mean-value-theorem', practice: '3.C', skill: 'theorems', title: 'A car on a toll road',
    prompt: '<b>Justify</b> that at some time the speedometer read exactly the average speed over the trip.',
    checklist: ['Names the Mean Value Theorem as the reason for the conclusion', 'Says the position is continuous and differentiable on the intervals'],
    earns: { answer: 'Position is differentiable, so it is continuous on [0, 2] and differentiable on (0, 2); by the Mean Value Theorem some time has velocity equal to the average.', why: 'It names the theorem and checks both hypotheses before concluding anything.' },
    misses: { answer: 'By the Mean Value Theorem the car went the average speed at some time.', why: 'It names the theorem but never checks its hypotheses on the interval.' },
  };
  assert.deepEqual(checkJustify([p], { map }), []);
  const q = JSON.parse(JSON.stringify(p));
  q.earns.answer = 'By the Mean Value Theorem, some time in (0, 2) has an instantaneous velocity equal to the average velocity over the trip.';
  assert.ok(checkJustify([q], { map }).some(e => /continuous/.test(e)));
});

test('Phase 0: no real forms or prompts yet, and the formula page is an empty frame', () => {
  const ex = loadExams('calculus/data');
  assert.deepEqual(ex.forms, []);
  assert.deepEqual(EQ, []);
});

test('the generator serves nothing before a unit is published, and a unit test, the formula and score pages once one is', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'apcalc-exams-')), 'calculus');
  execFileSync(process.execPath, ['scripts/build-apcalc.mjs', '--out', out], { env: { ...process.env, APCALC_DATA: '', APCALC_PUBLISHED: '' } });
  assert.deepEqual(JSON.parse(readFileSync(join(out, 'assets/exams/forms.json'), 'utf8')), []);
  assert.equal(existsSync(join(out, 'unit-tests')), false);
  const out2 = join(mkdtempSync(join(tmpdir(), 'apcalc-exams-')), 'calculus');
  execFileSync(process.execPath, ['scripts/build-apcalc.mjs', '--out', out2], { env: { ...process.env, APCALC_DATA: 'scripts/test/fixtures/apcalc-data', APCALC_PUBLISHED: 'unit-6' } });
  const html = readFileSync(join(out2, 'unit-tests/unit-6.html'), 'utf8');
  assert.ok((html.match(/<div class="calc-q" data-qid=/g) || []).length >= 4, 'a sample of the unit\'s questions (the fixture is one small topic)');
  assert.match(html, /<details class="calc-q-key">/, 'answers readable without JavaScript');
  assert.match(html, /<math class="calc-m">/, 'with rendered math');
  const calc = readFileSync(join(out2, 'score-calculator.html'), 'utf8');
  assert.match(calc, /50 &times; \(multiple-choice right &divide; 42\) \+ 50 &times; \(free-response points &divide; 54\)/);
  assert.match(calc, /64 or more is shown as a 5, 48 or more as a 4, 37 or more as a 3, 27 or more as a 2/);
  assert.match(calc, /Not calibrated/);
  const f = readFileSync(join(out2, 'formula-sheet.html'), 'utf8');
  assert.match(f, /The exam gives no formula sheet/);
  assert.match(f, /arrives with the first published unit/);
});
