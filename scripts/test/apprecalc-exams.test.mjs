/* AP® Precalculus practice exams, "Make it specific", formula page, and the
   exam format (docs/apprecalc-architecture.md, "Practice exams", "Make it
   specific", "Exams and entry pages"). Forked from apcalc-exams.test.mjs:
   - no score calculator, no readiness band, no composite (spec section 1);
   - the practice exam page runs the May 2027 format: Section I Part A 29 in
     65 min without a calculator, Part B 13 in 40 min with one; Section II
     Part A Q1 and Q2 in 35 min with a calculator, Part B Q3 and Q4 in 35
     min without; 6 points each; a calculator notice per part, with a link
     (no embedded script);
   - Unit 4 (beyond the exam, spec decision 7) has no exam weight, is never
     in a form, a unit test, an FRQ or a cram plan;
   - the unit weight ranges come out right for 42 questions;
   - a good form passes and the checker catches each way a form can break
     (synthetic forms; the real ones arrive in Phase 3);
   - the "Make it specific" checker refuses the reader-report traps;
   - the generator serves no forms and no unit tests before anything is
     published, a unit test once one is, and never one for Unit 4. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, cpSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { loadMap, trademarkProblems } from '../lib/apprecalc-build.mjs';
import { scanPage } from '../lib/apprecalc-map.mjs';
import { loadExams, loadJustify, checkForms, checkJustify, checkNumbers, unitRange, MCQ_TOTAL, MCQ_PARTS, FRQ_PARTS, FRQ_POINTS, FRQ_TOTAL, FRQ_ORDER, FRQ_CALC, SECTION_WEIGHTS, JUSTIFY_SKILLS, EXAM_NUMBERS, JUSTIFY_NUMBERS } from '../lib/apprecalc-exams.mjs';

const FIX = 'scripts/test/fixtures/apprecalc-data';

test('no score calculator, no readiness band, no composite anywhere in the course', () => {
  assert.equal(existsSync('precalculus/assets/pages/score.js'), false);
  assert.equal(existsSync('precalculus/score-calculator.html'), false);
  const ex = readFileSync('precalculus/assets/pages/exams.js', 'utf8');
  assert.doesNotMatch(ex, /function band\(|Readiness estimate|NOT_CALIBRATED|score-calculator/);
  assert.match(ex, /var composite = 0, b = 0;/);
  const dash = readFileSync('precalculus/assets/pages/dashboard.js', 'utf8');
  assert.match(dash, /band: false/);
  for (const f of ['precalculus/assets/pages/cram.js', 'scripts/lib/apprecalc-entry.mjs', 'scripts/build-apprecalc.mjs'])
    assert.doesNotMatch(readFileSync(f, 'utf8'), /score-calculator\.html/, f);
  assert.deepEqual(SECTION_WEIGHTS, { mcq: 62.5, frq: 37.5 });
});

test('the practice exam page runs the May 2027 format, a calculator notice per part', () => {
  const ex = readFileSync('precalculus/assets/pages/exams.js', 'utf8');
  assert.match(ex, /var MCQ_PARTS = \[\{ key: 'A', n: 29, sec: 65 \* 60, calc: false \}, \{ key: 'B', n: 13, sec: 40 \* 60, calc: true \}\];/);
  assert.match(ex, /var FRQ_PARTS = \[\{ key: 'A', n: 2, sec: 35 \* 60, calc: true \}, \{ key: 'B', n: 2, sec: 35 \* 60, calc: false \}\];/);
  assert.match(ex, /var FRQ_POINTS = 6;/);
  assert.match(ex, /var FRQ_ORDER = \['concepts', 'modeling', 'periodic', 'symbolic'\];/);
  assert.deepEqual(MCQ_PARTS.map(p => [p.n, p.minutes, p.calc]), [[29, 65, false], [13, 40, true]]);
  assert.deepEqual(FRQ_PARTS.map(p => [p.n, p.minutes, p.calc, p.types]), [[2, 35, true, ['concepts', 'modeling']], [2, 35, false, ['periodic', 'symbolic']]]);
  assert.equal(MCQ_TOTAL, 42); assert.equal(FRQ_POINTS, 6); assert.equal(FRQ_TOTAL, 4);
  assert.deepEqual(FRQ_ORDER, ['concepts', 'modeling', 'periodic', 'symbolic']);
  assert.deepEqual(FRQ_CALC, { concepts: true, modeling: true, periodic: false, symbolic: false });
  // A link to a free graphing calculator, never a third-party script.
  assert.match(ex, /https:\/\/www\.desmos\.com\/calculator/);
  assert.doesNotMatch(ex, /createElement\('script'\)[\s\S]{0,80}desmos/i);
  assert.match(ex, /Calculator allowed\.[\s\S]*No calculator\./);
  // Exam units only: Unit 4 is beyond the exam.
  assert.match(ex, /u\.part === 'course' && !u\.beyond/);
  assert.match(readFileSync('precalculus/assets/pages/cram.js', 'utf8'), /var DEFAULT_EXAM = '2027-05-11';/);
  assert.match(readFileSync('assets/exam-date.js', 'utf8'), /apprecalc: \{ date: '2027-05-11', label: 'AP® Precalculus exam \(Tue, May 11, 2027\)' \}/);
  const kit = readFileSync('precalculus/assets/pages/frq-kit.js', 'utf8');
  assert.match(kit, /concepts: 'Q1: Function Concepts', modeling: 'Q2: Modeling a Non-Periodic Context', periodic: 'Q3: Modeling a Periodic Context', symbolic: 'Q4: Symbolic Manipulations'/);
  for (const fn of ['startExam', 'startSectionOne', 'endSectionOne', 'startSectionTwo', 'endFrqPart', 'selfScore', 'pcalcNotice', 'pickFrqs']) assert.match(ex, new RegExp(`function ${fn}\\(`));
});

/* --------------------------------------------------------- exam forms */
const map = loadMap();
const units = map.chapters.filter(c => c.part === 'course' && !c.beyondExam);

test('unit weight ranges for 42 questions match the course framework; Unit 4 has none', () => {
  assert.deepEqual(units.map(u => u.id), ['unit-1', 'unit-2', 'unit-3']);
  assert.deepEqual(units.map(u => unitRange(u.weight)), [[12, 17], [10, 17], [12, 15]]);
  const lo = units.reduce((s, u) => s + unitRange(u.weight)[0], 0), hi = units.reduce((s, u) => s + unitRange(u.weight)[1], 0);
  assert.ok(lo <= 42 && hi >= 42, `${lo}..${hi}`);
  assert.deepEqual(map.chapterById('unit-4').weight, [0, 0]);
});

/* A synthetic bank and two forms that pass, so each rule can be broken once:
   per unit, its no-calculator questions, then (in Part B) its calculator ones. */
function synth() {
  const A = { 'unit-1': 10, 'unit-2': 9, 'unit-3': 10 };
  const B = { 'unit-1': 4, 'unit-2': 5, 'unit-3': 4 };
  assert.equal(Object.values(A).reduce((a, b) => a + b, 0), 29);
  assert.equal(Object.values(B).reduce((a, b) => a + b, 0), 13);
  const bank = new Map(), orderOf = {};
  const forms = [1, 2].map(n => {
    const mcq = [];
    for (const [part, counts] of [[false, A], [true, B]]) for (const [u, k] of Object.entries(counts)) {
      const topic = map.topics.find(t => t.chapter === u && t.kind === 'concept').id;
      for (let i = 0; i < k; i++) {
        const id = `pcalc-${topic}-${n * 100 + (part ? 50 : 0) + i}`;
        bank.set(id, { id, type: 'single', unit: u, topic, practice: '1.A', options: ['a', 'b', 'c', 'd'], correct: 0, ...(part ? { calc: true } : {}) });
        orderOf[id] = i;
        mcq.push([id]);
      }
    }
    return { id: `form-${n}`, title: `Practice exam ${n}`, mcq, frq: FRQ_ORDER.map(t => `frq-q${FRQ_ORDER.indexOf(t) + 1}-${t}-${n}`) };
  });
  const frqs = Object.fromEntries(forms.flatMap(f => f.frq.map(id => { const type = id.split('-')[2]; return [id, { id, type, units: ['unit-1'], points: 6, calc: FRQ_CALC[type] }]; })));
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
  bad(f => { f[0].frq = f[0].frq.slice().reverse(); }, /Section II question 1 is Q1: Function Concepts/);
  bad(f => { f[0].frq.pop(); }, /Section II has 3 questions, not 4/);
  bad(f => { f[1].mcq[0] = f[0].mcq[0]; }, /is also in form-1/);
  bad(f => { f[1].frq[0] = f[0].frq[0]; }, /FRQ .* is also in form-1/);
  // A unit outside its weight range (Unit 1 down to 11, Unit 3 up to 18 of 42).
  bad(f => { const ones = f[0].mcq.filter(b => ctx.bank.get(b[0]).unit === 'unit-1' && !ctx.bank.get(b[0]).calc); f[0].mcq = f[0].mcq.filter(b => !ones.slice(0, 3).includes(b)); f[0].mcq.splice(10, 0, ...f[1].mcq.filter(b => ctx.bank.get(b[0]).unit === 'unit-3' && !ctx.bank.get(b[0]).calc).slice(0, 3)); }, /Unit 1 has 11 questions/);
  // Unit 4 is never in an exam (spec decision 7).
  const ctx2 = { ...ctx, bank: new Map(ctx.bank) };
  const first = forms[0].mcq[0][0];
  ctx2.bank.set(first, { ...ctx.bank.get(first), unit: 'unit-4' });
  bad(() => {}, /unit-4, which is not an exam unit/, ctx2);
  const ctx3 = { ...ctx, frqs: { ...ctx.frqs, [forms[0].frq[0]]: { ...ctx.frqs[forms[0].frq[0]], units: ['unit-4'] } } };
  bad(() => {}, /lists unit-4, which is never in an exam/, ctx3);
  const ctx4 = { ...ctx, frqs: { ...ctx.frqs, [forms[0].frq[0]]: { ...ctx.frqs[forms[0].frq[0]], points: 9 } } };
  bad(() => {}, /worth 9 points, not 6/, ctx4);
  const ctx5 = { ...ctx, frqs: { ...ctx.frqs, [forms[0].frq[2]]: { ...ctx.frqs[forms[0].frq[2]], calc: true } } };
  bad(() => {}, /is a periodic question, so it is not a calculator question/, ctx5);
});

test('the "Make it specific" checker refuses the reader-report traps', () => {
  assert.deepEqual(Object.keys(JUSTIFY_SKILLS).sort(), ['concavity', 'decimals', 'domain', 'invertible', 'limits', 'model', 'periodic', 'rates', 'symbolic', 'values']);
  const t = map.topics.find(x => x.id === 'linear-quadratic-rates');
  const base = {
    id: 'u1-secant-estimate', unit: 'unit-1', topic: t.id, practice: '3.C', skill: 'rates', title: 'Estimate with the secant line',
    prompt: '<b>Explain</b> how the average rate of change on the interval gives an estimate of the value of the function between the two points.',
    checklist: ['Names the average rate of change as the slope of the secant line', 'Uses the given values to write the estimate'],
    earns: { answer: 'The average rate of change on [1, 3] is (9 - 1) / (3 - 1) = 4, the slope of the secant line through (1, 1) and (3, 9).', why: 'It names the secant line and uses the given values, as the rubric asks.' },
    misses: { answer: 'The function goes up by about 4 each time.', why: 'No secant line and no values from the table, so the point is lost.' },
    file: 'unit-1.json',
  };
  const ctx = { map, trademarkProblems, scanPage };
  assert.deepEqual(checkJustify([base], ctx), []);
  const bad = (mut, re) => { const p = JSON.parse(JSON.stringify(base)); mut(p); const e = checkJustify([p], ctx); assert.ok(e.some(x => re.test(x)), `${re}: ${e.join(' | ')}`); };
  bad(p => { p.earns.answer = 'The function is increasing at a decreasing rate on the interval, so the estimate is too high for the values.'; }, /calculus wording/);
  bad(p => { p.skill = 'invertible'; p.earns.answer = 'The function is not invertible because it fails the horizontal line test on the whole interval.'; }, /specific values/);
  bad(p => { p.earns.answer = 'The average rate of change on the interval is 4, found from the two outputs given in the table above.'; }, /names the secant line/);
  bad(p => { p.id = 'u5-oops'; }, /id must be/);
  bad(p => { p.practice = '4.C'; }, /practice must be a skill id/);
  bad(p => { p.skill = 'theorems'; }, /skill must be one of/);
});

test('exam numbers: Phase 3 fills them; the checker needs every listed item', () => {
  assert.deepEqual(EXAM_NUMBERS, []);
  assert.deepEqual(JUSTIFY_NUMBERS, []);
  assert.deepEqual(checkNumbers(new Map(), []), []);
  const ex = loadExams('precalculus/data');
  assert.deepEqual(ex.forms, [], 'no practice exam is written in Phase 0');
  assert.deepEqual(loadJustify('precalculus/data', map), []);
});

test('the generator serves nothing before a unit is published, a unit test once one is, and none for Unit 4', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'apprecalc-exams-')), 'precalculus');
  execFileSync(process.execPath, ['scripts/build-apprecalc.mjs', '--out', out], { env: { ...process.env, APPRECALC_DATA: '', APPRECALC_PUBLISHED: '' } });
  assert.deepEqual(JSON.parse(readFileSync(join(out, 'assets/exams/forms.json'), 'utf8')), []);
  assert.deepEqual(JSON.parse(readFileSync(join(out, 'assets/justify.json'), 'utf8')).prompts, []);
  assert.equal(existsSync(join(out, 'unit-tests')), false);
  assert.equal(existsSync(join(out, 'score-calculator.html')), false);
  const out2 = join(mkdtempSync(join(tmpdir(), 'apprecalc-exams-')), 'precalculus');
  execFileSync(process.execPath, ['scripts/build-apprecalc.mjs', '--out', out2], { env: { ...process.env, APPRECALC_DATA: FIX, APPRECALC_PUBLISHED: 'unit-3' } });
  const html = readFileSync(join(out2, 'unit-tests/unit-3.html'), 'utf8');
  assert.ok((html.match(/<div class="pcalc-q" data-qid=/g) || []).length >= 4, 'a sample of the unit\'s questions (the fixture is one small topic)');
  assert.match(html, /<details class="pcalc-q-key">/, 'answers readable without JavaScript');
  assert.match(html, /<math class="pcalc-m">/, 'with rendered math');
  const f = readFileSync(join(out2, 'formula-sheet.html'), 'utf8');
  assert.match(f, /The exam gives no formula sheet/);
  assert.match(f, /Radian mode and exact values/);
  assert.doesNotMatch(f, /score-calculator|Estimate your score/);
  // The fixture topic moved into Unit 4: it builds, says "beyond the exam", and gets no unit test.
  const data = mkdtempSync(join(tmpdir(), 'apprecalc-data-'));
  cpSync(FIX, data, { recursive: true });
  const T = 'polar-rates', U = 'vectors';
  const mv = (dir, ext) => { const s = readFileSync(join(data, dir, `${T}.${ext}`), 'utf8').replace(/polar-rates/g, U).replace(/"unit-3"/g, '"unit-4"'); writeFileSync(join(data, dir, `${U}.${ext}`), s); };
  for (const [d, e] of [['lessons', 'json'], ['notes', 'html'], ['questions', 'json']]) mv(d, e);
  writeFileSync(join(data, 'glossary', `${U}.json`), JSON.stringify({ vector: { def: 'A quantity with a size (its magnitude) and a direction, drawn as an arrow; in the plane it has two components.' } }));
  const out3 = join(mkdtempSync(join(tmpdir(), 'apprecalc-exams-')), 'precalculus');
  execFileSync(process.execPath, ['scripts/build-apprecalc.mjs', '--out', out3], { env: { ...process.env, APPRECALC_DATA: data, APPRECALC_PUBLISHED: 'unit-4' } });
  assert.equal(existsSync(join(out3, 'unit-tests/unit-4.html')), false, 'no unit test for a unit beyond the exam');
  for (const p of [`lessons/${U}.html`, `notes/${U}.html`, 'units/unit-4.html', 'unit-sheets/unit-4.html']) {
    const page = readFileSync(join(out3, p), 'utf8');
    assert.match(page, /class="pcalc-beyond pcalc-nav-ref"><b>Beyond the exam\.<\/b> The AP® Precalculus exam does not test this unit\./, p);
  }
  const unit = readFileSync(join(out3, 'units/unit-4.html'), 'utf8');
  assert.doesNotMatch(unit, /exams\.html\?unit=unit-4/, 'no unit-test card');
  const cur = JSON.parse(readFileSync(join(out3, 'assets/pcalc-curriculum.js'), 'utf8').match(/window\.ApPrecalcCurriculum = (.*);/)[1]);
  assert.equal(cur.units.find(u => u.id === 'unit-4').beyond, true);
  assert.ok(cur.units.filter(u => u.id !== 'unit-4').every(u => !u.beyond));
});
