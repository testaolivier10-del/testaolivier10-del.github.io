/* AP® Calculus BC Phase 3 (docs/apcalcbc-spec.md row 3): the two practice
   exams, the BC justification prompts, the formula page's BC rows, the
   hand-picked unit tests for Units 9 and 10 and the cram plan on BC's units.
   - each form passes AB's assembly rules with BC's slots (Q2 parametric or
     polar, Q5 techniques, Q6 series), the BC unit weights, 13 exam-only
     calculator items, no lesson checks, nothing shared with the other form
     or with AB's practice exams;
   - every exam-only key is recomputed (CBC_EXAM_NUMBERS) and the runtime
     grader credits exactly the key; no numeric key below 0.005;
   - the trainer serves AB's prompts and BC's, which cover endpoints, error
     bounds, the ratio test's limit and polar set-ups, every number checked;
   - the BC formula rows teach-topic, unit and trainer all resolve;
   - the unit tests follow their rules and a broken one is caught;
   - the cram plan gives every BC unit a session, more to Unit 10 than to
     Unit 7, and opens practice exam 1 and 2 on the exam days;
   - with every unit published, the build serves both forms, 26 exam-only
     items, the BC prompts and the 12-question unit tests. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
process.env.APCALC_COURSE = 'bc';
const { createBrowser } = await import('./harness.mjs');
const { loadMap, trademarkProblems } = await import('../lib/apcalc-build.mjs');
const { scanPage } = await import('../lib/apcalc-map.mjs');
const { Tex } = await import('../lib/apcalc-mathlib.mjs');
const { loadExams, loadJustify, checkForms, checkJustify, checkNumbers, unitRange, BC_FRQ_SLOTS, JUSTIFY_SKILLS, JUSTIFY_NUMBERS } = await import('../lib/apcalc-exams.mjs');
const { CBC_EXAM_NUMBERS, CBC_JUSTIFY_NUMBERS, BC_EQ, BC_GROUPS, BC_NOT_ON, mergeEq, loadUnitTests, checkUnitTests } = await import('../lib/apcalcbc-exams.mjs');
const { EQ, NOT_ON } = await import('../lib/apcalc-entry.mjs');

const map = loadMap();
const AB = 'calculus/data', BCD = 'calculus-bc/data';
const R = p => JSON.parse(readFileSync(p, 'utf8'));
const dirOf = t => t.source === 'ab' ? AB : BCD;
const ex = loadExams(BCD);
const bank = new Map(), orderOf = {}, checks = new Set();
for (const t of map.topics) {
  const p = join(dirOf(t), 'questions', `${t.id}.json`);
  if (existsSync(p)) R(p).items.forEach((q, i) => { bank.set(q.id, q); orderOf[q.id] = i; });
  const l = join(dirOf(t), 'lessons', `${t.id}.json`);
  if (existsSync(l)) for (const id of R(l).check || []) checks.add(id);
}
ex.items.forEach((q, i) => { orderOf[q.id] = i; });
const examItems = new Map(ex.items.map(q => [q.id, q]));
const frqs = {};
for (const d of [AB, BCD]) for (const f of readdirSync(join(d, 'frq'))) { const x = R(join(d, 'frq', f)); frqs[x.id] = x; }
const ctx = { map, bank, examItems, frqs, orderOf: id => orderOf[id], slots: BC_FRQ_SLOTS };
const clone = x => JSON.parse(JSON.stringify(x));
const prompts = loadJustify([AB, BCD], map);
const own = prompts.filter(p => existsSync(join(BCD, 'justify', p.file)) && R(join(BCD, 'justify', p.file)).prompts.some(x => x.id === p.id));

test('the two BC practice exams pass every assembly rule, with the BC slots and weights', () => {
  assert.equal(ex.forms.length, 2);
  assert.deepEqual(checkForms(ex.forms, ctx), []);
  const abForms = R(join(AB, 'exams', 'forms.json')).forms;
  const abIds = new Set(abForms.flatMap(f => [...f.mcq.flat(), ...f.frq]));
  const units = map.chapters.filter(c => c.part === 'course');
  assert.equal(units.length, 10);
  for (const f of ex.forms) {
    const ids = f.mcq.flat(), q = id => bank.get(id) || examItems.get(id);
    assert.equal(ids.slice(0, 29).filter(id => !q(id).calc).length, 29, `${f.id}: Part A`);
    assert.deepEqual(ids.slice(29), ex.items.filter(x => x.id.startsWith(`cbc-exam-${f.id.slice(5)}-`)).map(x => x.id), `${f.id}: Part B is its 13 exam-only items`);
    assert.equal(ids.filter(id => checks.has(id)).length, 0, `${f.id}: no lesson checks`);
    assert.equal(ids.filter(id => abIds.has(id)).length + f.frq.filter(id => abIds.has(id)).length, 0, `${f.id}: nothing from AB's practice exams`);
    for (const u of units) {
      const n = ids.filter(id => q(id).unit === u.id).length, [lo, hi] = unitRange(u.weight);
      assert.ok(n >= lo && n <= hi, `${f.id}: ${u.id} has ${n} (${lo}-${hi})`);
    }
    // BC content: Units 9 and 10 and the BC topics of 6-8 carry a real share.
    const bcShare = ids.filter(id => (map.topicById(q(id).topic) || {}).source === 'bc').length;
    assert.ok(bcShare >= 18, `${f.id}: ${bcShare} BC-topic questions`);
    assert.deepEqual(f.frq.map(id => frqs[id].type).map((t, i) => BC_FRQ_SLOTS[i] ? t : 'ab'), ['ab', 'parametric', 'ab', 'ab', 'techniques', 'series']);
  }
  const all = ex.forms.flatMap(f => [...f.mcq.flat(), ...f.frq]);
  assert.equal(new Set(all).size, all.length, 'nothing in both forms');
  // The check still bites on BC data: a swapped slot.
  const bad = clone(ex.forms); [bad[0].frq[1], bad[0].frq[4]] = [bad[0].frq[4], bad[0].frq[1]];
  assert.ok(checkForms(bad, ctx).some(e => /parametric slot|Part A \(calculator\)/.test(e)));
});

test('every BC exam-only key is recomputed, and the runtime grader credits exactly the key', () => {
  const lists = { exam: CBC_EXAM_NUMBERS, justify: [...JUSTIFY_NUMBERS, ...CBC_JUSTIFY_NUMBERS] };
  assert.deepEqual(checkNumbers(examItems, prompts, lists), []);
  assert.deepEqual(ex.items.map(q => q.id).filter(id => !CBC_EXAM_NUMBERS.some(n => n.id === id)), [], 'every item keys a recomputed value');
  // The three-decimal rule is weak below 0.005: no such key.
  for (const q of ex.items) { const m = /^\$(-?\d+\.\d+)\$/.exec(q.options[q.correct]); if (m) assert.ok(Math.abs(+m[1]) >= 0.005, q.id); }
  const b = createBrowser(); b.load('calculus/assets/calc-expr.js'); b.load('calculus/assets/calc-math.js');
  const Q = b.load('calculus/assets/calc-questions.js').ApCalcQuestions;
  for (const q of ex.items) q.options.forEach((_, i) => assert.equal(Q.grade(q, i).correct, i === q.correct, `${q.id} option ${i}`));
  const m = new Map(examItems); const w = clone(m.get('cbc-exam-2-04')); w.correct = 0; m.set(w.id, w);
  assert.ok(checkNumbers(m, prompts, lists).some(e => /cbc-exam-2-04/.test(e)));
});

test('the BC justification prompts pass and cover the BC misses', () => {
  assert.deepEqual(checkJustify(prompts, { map, trademarkProblems, scanPage }), []);
  assert.ok(prompts.length - own.length >= 32, 'AB\'s prompts are served too');
  assert.ok(own.length >= 10, `${own.length} BC prompts`);
  for (const u of ['unit-9', 'unit-10']) { const n = prompts.filter(p => p.unit === u).length; assert.ok(n >= 3 && n <= 5, `${u}: ${n}`); }
  for (const k of ['series', 'error', 'polar']) assert.ok(JUSTIFY_SKILLS[k] && own.some(p => p.skill === k), k);
  for (const k of Object.keys(JUSTIFY_SKILLS)) assert.ok(prompts.some(p => p.skill === k), k);
  const ids = own.map(p => p.id).join(' ');
  for (const w of ['endpoints', 'ratio-test-limit', 'alternating-bound-conditions', 'lagrange', 'polar-petal', 'toward-origin', 'speed', 'improper']) assert.match(ids, new RegExp(w));
  for (const n of CBC_JUSTIFY_NUMBERS) assert.ok(own.some(p => p.id === n.id), n.id);
  const p = clone(own.find(x => x.id === 'u10-alternating-bound-conditions'));
  p.earns.answer = p.earns.answer.replace('\\frac{1}{64}', '\\frac{1}{27}');
  assert.ok(checkNumbers(examItems, prompts.map(x => x.id === p.id ? p : x), { exam: [], justify: CBC_JUSTIFY_NUMBERS }).some(e => /u10-alternating/.test(e)));
});

test('the formula page adds the BC rows, each tied to a BC topic and BC trainers', () => {
  const { eq, notOn } = mergeEq(EQ, NOT_ON);
  assert.equal(eq.length, EQ.length + BC_GROUPS.length);
  for (const k of Object.keys(BC_EQ)) assert.ok(EQ.some(g => g.id === k), `AB group ${k}`);
  const rows = [...Object.values(BC_EQ).flat(), ...BC_GROUPS.flatMap(g => g.rows)];
  const slugs = new Set(R(join(BCD, 'pages.json')).tools.map(t => t.slug));
  for (const r of rows) {
    const t = map.topicById(r[4]);
    assert.ok(t && t.source === 'bc', `${r[0]}: BC topic ${r[4]}`);
    assert.equal(r[3], `Unit ${t.chapter.slice(5)}`, r[0]);
    for (const sl of r[5] || []) assert.ok(slugs.has(sl), `${r[0]}: trainer ${sl}`);
    for (const x of [`$${r[0]}$`, r[1], r[2]]) assert.equal(Tex.check(x).length, 0, `${r[0]}: math`);
    for (const x of [r[1], r[2]]) assert.deepEqual(trademarkProblems(x), [], r[0]);
  }
  const taught = new Set(rows.map(r => r[4]));
  for (const t of map.topics.filter(t => t.source === 'bc' && /^unit-(9|10)$/.test(t.chapter) && !/series-convergence|vector-derivatives/.test(t.id))) assert.ok(taught.has(t.id), `a row for ${t.id}`);
  const all = rows.map(r => r[0] + r[1]).join(' ');
  for (const s of ['\\frac{1}{2}\\int_{\\alpha}^{\\beta} r^2', 'uv - \\int v\\,du', '\\lim_{b \\to \\infty}', '\\frac{A}{x - a}', '(n + 1)!', 'a_{n+1}']) assert.ok(all.includes(s), s);
  assert.equal(notOn.length, NOT_ON.length + BC_NOT_ON.length);
  for (const r of BC_NOT_ON) assert.ok(map.topicById(r[2]), r[0]);
});

test('the hand-picked unit tests for Units 9 and 10 follow their rules', () => {
  const tests = loadUnitTests(BCD);
  assert.deepEqual(Object.keys(tests).sort(), ['unit-10', 'unit-9']);
  const c = { map, bank, lessonChecks: checks, formIds: new Set(ex.forms.flatMap(f => f.mcq.flat())), orderOf: id => orderOf[id] };
  assert.deepEqual(checkUnitTests(tests, c), []);
  const t = clone(tests);
  t['unit-9'][0] = [...checks].find(id => (bank.get(id) || {}).unit === 'unit-9');
  t['unit-10'] = t['unit-10'].slice(0, 11);
  const errs = checkUnitTests(t, c);
  assert.ok(errs.some(e => /lesson check/.test(e)) && errs.some(e => /11 questions/.test(e)), errs.join(' | '));
});

test('the cram plan on BC\'s ten units', () => {
  const b = createBrowser(); b.load('calculus/assets/pages/cram.js');
  const P = b.window.ApCalcCramPlan;
  const units = map.chapters.map(c => ({ id: c.id, n: c.n, part: c.part, title: c.title, weight: c.weight }));
  const topics = map.topics.filter(t => /^unit-/.test(t.chapter)).map(t => ({ id: t.id, unit: t.chapter, title: t.title, built: true }));
  const fl = Object.values(frqs).map(f => ({ id: f.id, type: f.type, units: f.units }));
  for (const weeks of [3, 2]) {
    const p = P.build({ exam: '2027-05-10', weeks, units, topics, mastery: null, frqs: fl });
    assert.equal(Object.keys(p.shares).length, 10);
    for (const u of units.filter(u => u.part === 'course')) assert.ok(p.slots[u.id] >= 1, `${weeks} weeks: ${u.id}`);
    assert.ok(p.slots['unit-10'] > p.slots['unit-7'], 'Unit 10 (15-20%) before Unit 7 (5-10%)');
    assert.deepEqual([...p.days.filter(d => d.kind === 'exam').map(d => d.exam)], [1, 2]);
    assert.equal(p.days[p.days.length - 1].date, '2027-05-09');
  }
});

test('with every unit published the build serves the BC exams, prompts and unit tests', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'apcalcbc-p3-')), 'calculus-bc');
  const pub = map.chapters.map(c => c.id).join(',');
  execFileSync(process.execPath, ['scripts/build-apcalcbc.mjs', '--out', out], { env: { ...process.env, APCALCBC_PUBLISHED: pub } });
  const forms = R(join(out, 'assets/exams/forms.json'));
  assert.deepEqual(forms.map(f => f.id), ['form-1', 'form-2']);
  assert.equal(R(join(out, 'assets/exams/items.json')).items.length, 26);
  const j = R(join(out, 'assets/justify.json'));
  assert.equal(j.prompts.length, prompts.length);
  assert.ok(j.skills.series && j.skills.error && j.skills.polar);
  for (const u of ['unit-9', 'unit-10']) {
    const h = readFileSync(join(out, `unit-tests/${u}.html`), 'utf8');
    const d = JSON.parse(h.match(/id="calc-page-data">([\s\S]*?)<\/script>/)[1]);
    assert.deepEqual(d.check.map(q => q.id), loadUnitTests(BCD)[u]);
  }
  const f = readFileSync(join(out, 'formula-sheet.html'), 'utf8');
  assert.match(f, /Series tests/);
  assert.match(f, /Parametric, vector and polar/);
  assert.equal((f.match(/<th scope="row">/g) || []).length, mergeEq(EQ, NOT_ON).eq.flatMap(s => s.rows).length);
});
