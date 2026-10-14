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
   - a good form passes and the checker catches each way a form can break,
     on synthetic forms and on the two real ones (calculus/data/exams/);
   - every exam-only key is recomputed (EXAM_NUMBERS) and graded right by
     the runtime grader, every distractor graded wrong;
   - the justification checker refuses a value theorem without continuity,
     and the 32+ prompts pass and cover every unit and skill;
   - the formula page lists the rules, theorems and set-ups to know, each
     with a topic that teaches it and only live trainers;
   - the generator serves no forms and no unit tests before anything is
     published, a unit test once one is, and with every unit published the
     exams, prompts, formula page and 12-question unit tests. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { createBrowser } from './harness.mjs';
import { loadMap, trademarkProblems } from '../lib/apcalc-build.mjs';
import { scanPage } from '../lib/apcalc-map.mjs';
import { Tex } from '../lib/apcalc-mathlib.mjs';
import { loadExams, loadJustify, checkForms, checkJustify, checkNumbers, formUnits, unitRange, MCQ_TOTAL, MCQ_PARTS, FRQ_PARTS, FRQ_POINTS, FRQ_TOTAL, FREE_JUSTIFY, JUSTIFY_SKILLS, EXAM_NUMBERS, JUSTIFY_NUMBERS } from '../lib/apcalc-exams.mjs';
import { EQ, NOT_ON } from '../lib/apcalc-entry.mjs';

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

test('score: the calculator and the practice exam use the same estimated cut-offs (66, 49, 40, 23)', () => {
  assert.deepEqual([...S.CUTS], [66, 49, 40, 23]);
  for (const [c, b] of [[100, 5], [66, 5], [65.9, 4], [49, 4], [40, 3], [39.9, 2], [23, 2], [22.9, 1]]) assert.equal(S.band(c), b, `composite ${c}`);
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
  assert.deepEqual(Object.keys(JUSTIFY_SKILLS).sort(), ['accumulation', 'behavior', 'context', 'de', 'extrema', 'limits', 'motion', 'rules', 'setup', 'theorems']);
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

/* ---------------------------------------------------- the real forms */
const DATA = 'calculus/data';
const ex = loadExams(DATA);
const bank = new Map(), orderOf = {};
for (const t of map.topics) { const p = join(DATA, 'questions', `${t.id}.json`); if (existsSync(p)) JSON.parse(readFileSync(p, 'utf8')).items.forEach((q, i) => { bank.set(q.id, q); orderOf[q.id] = i; }); }
ex.items.forEach((q, i) => { orderOf[q.id] = i; });
const examItems = new Map(ex.items.map(q => [q.id, q]));
const frqs = Object.fromEntries(readdirSync(join(DATA, 'frq')).map(f => JSON.parse(readFileSync(join(DATA, 'frq', f), 'utf8'))).map(f => [f.id, f]));
const ctx = { map, bank, examItems, frqs, orderOf: id => orderOf[id] };
const clone = x => JSON.parse(JSON.stringify(x));
const checks = new Set(readdirSync(join(DATA, 'lessons')).flatMap(f => JSON.parse(readFileSync(join(DATA, 'lessons', f), 'utf8')).check || []));

test('the two practice exams pass every assembly rule', () => {
  assert.equal(ex.forms.length, 2);
  assert.deepEqual(checkForms(ex.forms, ctx), []);
  for (const f of ex.forms) {
    const ids = f.mcq.flat();
    assert.equal(ids.length, MCQ_TOTAL);
    const q = id => bank.get(id) || examItems.get(id);
    assert.equal(ids.slice(0, 29).filter(id => !q(id).calc).length, 29, `${f.id}: Part A is 29 no-calculator questions`);
    assert.equal(ids.slice(29).filter(id => q(id).calc).length, 13, `${f.id}: Part B is 13 calculator questions`);
    const sets = f.mcq.filter(b => b.length > 1);
    assert.ok(sets.length >= 6 && sets.every(b => b.length >= 3 && b.length <= 5), `${f.id}: stimulus sets of 3 to 5 (${sets.map(b => b.length)})`);
    assert.ok(sets.flat().length >= 21, `${f.id}: at least half the questions in sets`);
    const own = ids.filter(id => examItems.has(id));
    assert.ok(own.length >= 12 && own.length <= 14, `${f.id}: 12-14 exam-only items (${own.length})`);
    assert.ok(own.every(id => id.startsWith(`calc-exam-${f.id.slice(5)}-`)), 'exam-only items belong to their form');
    assert.equal(ids.filter(id => bank.has(id) && checks.has(id)).length, 0, `${f.id}: no lesson-check items`);
    assert.equal(formUnits(f, ctx).filter(u => u.startsWith('unit-')).length, 8, 'every unit is on each exam');
    // Section II: a realistic mix, calculator questions first.
    const types = f.frq.map(id => frqs[id].type);
    assert.deepEqual(f.frq.map(id => !!frqs[id].calc), [true, true, false, false, false, false]);
    assert.equal(new Set(types).size, 6, `${f.id}: six different FRQ types (${types})`);
    assert.ok(types.includes('motion') && types.includes('area') && types.includes('de') && types.includes('graph'), `${f.id}: motion, area-volume, a differential equation and a graph of f'`);
    assert.ok(types.includes('table') || types.includes('model'), `${f.id}: a rate from a table or a model`);
    assert.ok(types.includes('implicit') || types.includes('fg'), `${f.id}: implicit or f and g`);
  }
  const all = ex.forms.flatMap(f => f.mcq.flat());
  assert.equal(new Set(all).size, all.length, 'no question in both forms');
  const allF = ex.forms.flatMap(f => f.frq);
  assert.equal(new Set(allF).size, allF.length, 'no FRQ in both forms');
  assert.ok(ex.items.every(q => ex.forms.some(f => f.mcq.flat().includes(q.id))), 'every exam-only item is used');
  assert.ok(ex.items.every(q => q.calc === true && q.type === 'single' && q.options.length === 4), 'exam-only items are four-option calculator questions');
});

test('the assembly check catches a broken real form', () => {
  const bad = (mut, re) => { const f = clone(ex.forms); mut(f); const e = checkForms(f, ctx); assert.ok(e.some(x => re.test(x)), `${re}: ${e.join(' | ')}`); };
  bad(f => { const i = f[0].mcq.findIndex(b => b.length > 2); f[0].mcq[i] = f[0].mcq[i].slice().reverse(); }, /not in authored order/);
  bad(f => { const i = f[0].mcq.findIndex(b => b.length > 2 && !b[0].startsWith('calc-exam-')); const b = f[0].mcq[i]; f[0].mcq.splice(i, 1, [b[0]], b.slice(1)); }, /needs its stimulus|has 2 questions/);
  bad(f => { f[1].frq[0] = f[0].frq[0]; }, /FRQ .* is also in form-1/);
  bad(f => { const own = f[0].mcq.findIndex(b => b.length === 1 && b[0].startsWith('calc-exam-1-')); const j = f[1].mcq.findIndex(b => b.length === 1 && b[0].startsWith('calc-exam-2-')); f[1].mcq[j] = f[0].mcq[own]; }, /belongs to form-1/);
  bad(f => { const j = f[0].mcq.findIndex(b => b.length === 1 && b[0].startsWith('calc-exam-')); const b = f[0].mcq.splice(j, 1)[0]; f[0].mcq.unshift(b); }, /Part A \(no calculator\) comes before Part B/);
});

/* The runtime grader (calc-questions.js) on every exam-only item: the key is
   graded right and every other option wrong, so a key the data marks right
   is the one a student is credited for. */
test('every exam-only key is recomputed, and the runtime grader credits exactly the key', () => {
  const prompts = loadJustify(DATA, map);
  assert.deepEqual(checkNumbers(examItems, prompts), []);
  assert.deepEqual(ex.items.map(q => q.id).filter(id => !EXAM_NUMBERS.some(n => n.id === id)), [], 'every exam-only item keys a recomputed value');
  const b = createBrowser(); b.load('calculus/assets/calc-expr.js'); b.load('calculus/assets/calc-math.js');
  const Q = b.load('calculus/assets/calc-questions.js').ApCalcQuestions;
  for (const q of ex.items) q.options.forEach((_, i) => assert.equal(Q.grade(q, i).correct, i === q.correct, `${q.id} option ${i}`));
  // A wrong key is caught, and so is a key that no longer matches the math.
  const m = new Map(examItems); const w = clone(m.get('calc-exam-1-12')); w.correct = 1; m.set(w.id, w);
  assert.ok(checkNumbers(m, prompts).some(e => /calc-exam-1-12/.test(e)));
  const m2 = new Map(examItems); const w2 = clone(m2.get('calc-exam-2-06')); w2.options[w2.correct] = '$-2.473$'; m2.set(w2.id, w2);
  assert.ok(checkNumbers(m2, prompts).some(e => /calc-exam-2-06/.test(e)));
});

test('the justification prompts pass, cover every unit and every calculus skill', () => {
  const prompts = loadJustify(DATA, map);
  assert.deepEqual(checkJustify(prompts, { map, trademarkProblems, scanPage }), []);
  assert.ok(prompts.length >= 32, `${prompts.length} prompts`);
  for (const u of units) {
    const n = prompts.filter(p => p.unit === u.id).length;
    assert.ok(n >= 3 && n <= 5, `${u.id}: ${n} prompts (3 to 5)`);
  }
  for (const k of Object.keys(JUSTIFY_SKILLS)) assert.ok(prompts.some(p => p.skill === k), `a prompt for ${k}`);
  for (const n of JUSTIFY_NUMBERS) assert.ok(prompts.some(p => p.id === n.id), `${n.id} exists`);
  // The misses the reader reports name: each has a prompt.
  const ids = prompts.map(p => p.id).join(' ');
  for (const w of ['ivt', 'mvt', 'candidates', 'relative-max', 'inflection', 'underestimate', 'continuity', 'lhospital', 'units', 'speeding-up', 'direction']) assert.match(ids, new RegExp(w), `a prompt on ${w}`);
  // The runtime (pages/justify.js) reads the skill names from the served data, not a list of its own.
  assert.doesNotMatch(readFileSync('calculus/assets/pages/justify.js', 'utf8'), /coulomb|free-body|titration/);
  // A wrong number in a model answer is caught.
  const p = clone(prompts.find(x => x.id === 'u6-left-sum-underestimate'));
  p.earns.answer = p.earns.answer.replace('= 65', '= 60');
  p.checklist = p.checklist.map(c => c.replace('= 65', '= 60'));
  assert.ok(checkNumbers(examItems, prompts.map(x => x.id === p.id ? p : x)).some(e => /u6-left-sum-underestimate/.test(e)));
});

test('the formula page lists the rules, theorems and set-ups to know', () => {
  const rows = EQ.flatMap(s => s.rows);
  const all = rows.map(r => r[0]).join(' | ');
  const must = [String.raw`\lim_{h \to 0} \frac{f(a + h) - f(a)}{h}`, String.raw`\frac{\sin x}{x} = 1`, 'n x^{n - 1}', "f'(x)g(x) + f(x)g'(x)", "f'(x)g(x) - f(x)g'(x)", "f'(g(x)) \\cdot g'(x)",
    String.raw`\frac{d}{dx}\sin x = \cos x`, String.raw`\frac{d}{dx}\tan x = \sec^2 x`, String.raw`\frac{d}{dx}\ln x = \frac{1}{x}`, String.raw`\frac{d}{dx}\arctan x`, String.raw`\left(f^{-1}\right)'(b)`, "f(a) + f'(a)(x - a)",
    "\\frac{f'(x)}{g'(x)}", 'a < c < b', String.raw`\max_{[a, b]} f`, String.raw`\text{compare}`, 'concave up', String.raw`f(c) = d \ \text{for some}`,
    String.raw`\int \frac{1}{x}\,dx = \ln|x| + C`, String.raw`\int \sin x\,dx = -\cos x + C`, String.raw`\frac{d}{dx}\int_a^x f(t)\,dt = f(x)`, 'F(b) - F(a)', String.raw`\frac{\Delta x_1}{2}`, String.raw`\int f(u)\,du`,
    String.raw`f_{\text{avg}} = \frac{1}{b - a}`, String.raw`\int_a^b |v(t)|\,dt`, String.raw`x(t) = x(t_0)`, String.raw`\left[f(x) - g(x)\right]dx`, String.raw`\pi\int_a^b \left[R(x)\right]^2 dx`, String.raw`\left[r(x)\right]^2`, String.raw`\frac{\sqrt{3}}{4}s^2`, String.raw`y = y_0 e^{kt}`];
  for (const e of must) assert.ok(all.includes(e), `the page has "${e}"`);
  const topics = new Set(map.topics.map(t => t.id));
  const slugs = new Set(JSON.parse(readFileSync('calculus/data/pages.json', 'utf8')).tools.map(t => t.slug));
  for (const r of rows) {
    assert.ok(r.length >= 5, r[0]);
    assert.ok(r[1].length >= 20 && r[2].length >= 20, `${r[0]}: what it is and when to use it`);
    assert.ok(topics.has(r[4]), `${r[0]}: topic ${r[4]}`);
    assert.equal(r[3], `Unit ${map.topicById(r[4]).chapter.slice(5)}`, `${r[0]}: the unit of ${r[4]}`);
    for (const sl of r[5] || []) assert.ok(slugs.has(sl), `${r[0]}: trainer ${sl}`);
    for (const t of [`$${r[0]}$`, r[1], r[2]]) assert.equal(Tex.check(t).length, 0, `${r[0]}: math renders`);
    for (const t of [r[1], r[2]]) assert.deepEqual(trademarkProblems(t), [], r[0]);
  }
  // A value theorem on the page names its hypotheses.
  for (const r of rows.filter(r => /Value Theorem/.test(r[1]))) assert.match(r[0] + r[1], /continuous/, r[1]);
  assert.ok(NOT_ON.length >= 5);
  for (const r of NOT_ON) { assert.ok(topics.has(r[2]), r[0]); assert.equal(Tex.check(r[0] + ' ' + r[1]).length, 0, r[0]); }
});

test('the generator serves nothing before a unit is published, and a unit test, the formula and score pages once one is', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'apcalc-exams-')), 'calculus');
  execFileSync(process.execPath, ['scripts/build-apcalc.mjs', '--out', out], { env: { ...process.env, APCALC_DATA: '', APCALC_PUBLISHED: '' } });
  assert.deepEqual(JSON.parse(readFileSync(join(out, 'assets/exams/forms.json'), 'utf8')), []);
  assert.deepEqual(JSON.parse(readFileSync(join(out, 'assets/justify.json'), 'utf8')).prompts, []);
  assert.equal(existsSync(join(out, 'unit-tests')), false);
  const out2 = join(mkdtempSync(join(tmpdir(), 'apcalc-exams-')), 'calculus');
  execFileSync(process.execPath, ['scripts/build-apcalc.mjs', '--out', out2], { env: { ...process.env, APCALC_DATA: 'scripts/test/fixtures/apcalc-data', APCALC_PUBLISHED: 'unit-6' } });
  const html = readFileSync(join(out2, 'unit-tests/unit-6.html'), 'utf8');
  assert.ok((html.match(/<div class="calc-q" data-qid=/g) || []).length >= 4, 'a sample of the unit\'s questions (the fixture is one small topic)');
  assert.match(html, /<details class="calc-q-key">/, 'answers readable without JavaScript');
  assert.match(html, /<math class="calc-m">/, 'with rendered math');
  const calc = readFileSync(join(out2, 'score-calculator.html'), 'utf8');
  assert.match(calc, /50 &times; \(multiple-choice right &divide; 42\) \+ 50 &times; \(free-response points &divide; 54\)/);
  assert.match(calc, /66 or more is shown as a 5, 49 or more as a 4, 40 or more as a 3, 23 or more as a 2/);
  assert.match(calc, /estimates, not official/);
  const f = readFileSync(join(out2, 'formula-sheet.html'), 'utf8');
  assert.match(f, /The exam gives no formula sheet/);
  assert.equal((f.match(/<th scope="row">/g) || []).length, EQ.flatMap(s => s.rows).length);
  assert.doesNotMatch(f, /href="tools\//, 'no trainer is live in the fixture, so none is linked');
});

test('with every unit published: the exams, the prompts, the formula page and 12-question unit tests', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'apcalc-exams-')), 'calculus');
  execFileSync(process.execPath, ['scripts/build-apcalc.mjs', '--out', out], { env: { ...process.env, APCALC_DATA: '', APCALC_PUBLISHED: 'skills-math,unit-1,unit-2,unit-3,unit-4,unit-5,unit-6,unit-7,unit-8' }, maxBuffer: 1 << 26 });
  const forms = JSON.parse(readFileSync(join(out, 'assets/exams/forms.json'), 'utf8'));
  assert.equal(forms.length, ex.forms.length);
  const own = JSON.parse(readFileSync(join(out, 'assets/exams/items.json'), 'utf8'));
  assert.equal(own.items.length, ex.items.length);
  assert.ok(own.items.every(q => q.why && q.why.correct && q.calc), 'exam-only items carry their explanations and the calculator flag');
  assert.deepEqual(Object.keys(own.stimuli).sort(), Object.keys(ex.stimuli).sort());
  assert.ok(Object.values(own.stimuli).every(s => /<svg/.test(s.html)), 'the exam stimuli are drawn from their functions');
  const j = JSON.parse(readFileSync(join(out, 'assets/justify.json'), 'utf8'));
  assert.deepEqual(j.skills, JUSTIFY_SKILLS);
  assert.equal(j.prompts.length, loadJustify(DATA, map).length);
  assert.equal(j.prompts.filter(p => p.free).length, FREE_JUSTIFY);
  assert.ok(j.prompts.slice(0, FREE_JUSTIFY).every(p => p.free), 'the first prompts in course order are the free ones');
  for (const p of j.prompts) for (const t of [p.context, p.prompt, ...p.checklist, p.earns.answer, p.earns.why, p.misses.answer, p.misses.why]) assert.doesNotMatch(t.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, ''), /\$/, `${p.id}: math is rendered`);
  for (let n = 1; n <= 8; n++) {
    const html = readFileSync(join(out, `unit-tests/unit-${n}.html`), 'utf8');
    assert.equal((html.match(/<div class="calc-q" data-qid=/g) || []).length, 12, `unit ${n} sample has 12 questions`);
    assert.match(html, new RegExp(`practice\\.html\\?unit=unit-${n}`));
    assert.match(html, /<details class="calc-q-key">/, 'answers readable without JavaScript');
    assert.doesNotMatch(html, /calc-exam-/, 'exam-only questions never appear on a free page');
  }
  const eq = readFileSync(join(out, 'formula-sheet.html'), 'utf8');
  assert.equal((eq.match(/<th scope="row">/g) || []).length, EQ.flatMap(s => s.rows).length);
  const linked = [...eq.matchAll(/href="tools\/([a-z-]+)\.html"/g)].map(m => m[1]);
  assert.ok(linked.length > 10, 'live trainers are linked');
  for (const sl of linked) assert.ok(existsSync(join(out, 'tools', `${sl}.html`)), `the page links only live trainers (${sl})`);
});
