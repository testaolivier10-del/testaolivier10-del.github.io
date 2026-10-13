/* AP® Physics 1 practice exams, justification trainer, equations sheet and
   score estimate (docs/apphys-architecture.md, "Practice exams",
   "Justification trainer", "Exams and entry pages"). Forked from
   apchem-exams.test.mjs:
   - the score calculator's composite (pages/score.js) is 50/50 by section,
     out of 42 questions and 40 points (mr 10, tbr 12, lab 10, qqt 8), clamps
     its inputs, gives the band the practice exam gives for the same result
     (pages/exams.js), and says what reaches the next band;
   - the practice exam page runs the May 2027 format: 42 in 85 min, then the
     four types in order with times in proportion to points (95 min in all);
   - the unit weight ranges come out right for 42 questions;
   - a good form passes and the checker catches each way a form can break,
     on synthetic forms and on the two real ones (physics/data/exams/);
   - every exam-only key is recomputed (EXAM_NUMBERS) and graded right by
     the runtime grader, every distractor graded wrong;
   - the 33+ justification prompts pass and cover every unit and skill;
   - the equations sheet has every equation and constant on the official
     sheet, and what it leaves out;
   - the generator serves no forms and no unit tests before anything is
     published, and serves the exams, prompts and 12-question unit tests
     once every unit is. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createBrowser } from './harness.mjs';
import { loadMap, trademarkProblems } from '../lib/apphys-build.mjs';
import { scanPage } from '../lib/apphys-map.mjs';
import { loadExams, loadJustify, checkForms, checkJustify, checkNumbers, unitRange, formUnits, MCQ_TOTAL, FRQ_SLOTS, FRQ_POINTS, FREE_JUSTIFY, JUSTIFY_SKILLS, EXAM_NUMBERS, JUSTIFY_NUMBERS } from '../lib/apphys-exams.mjs';
import { EQ, NOT_ON } from '../lib/apphys-entry.mjs';

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

test('score: the calculator and the practice exam use the same estimated cut-offs (70, 55, 41, 31)', () => {
  assert.deepEqual([...S.CUTS], [70, 55, 41, 31]);
  const cases = [[100, 5], [70, 5], [69.9, 4], [55, 4], [54.9, 3], [41, 3], [40.9, 2], [31, 2], [30.9, 1], [0, 1]];
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
  assert.equal(r.next.at, 55);
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

/* ---------------------------------------------------- the real forms */
const DATA = 'physics/data';
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
    assert.deepEqual(f.frq.map(id => frqs[id].type), FRQ_SLOTS);
    const sets = f.mcq.filter(b => b.length > 1);
    assert.ok(sets.length >= 7, `${f.id}: stimulus sets of 3-5 (${sets.length} sets)`);
    assert.ok(sets.flat().length >= 21, `${f.id}: at least half the questions in sets`);
    const own = ids.filter(id => examItems.has(id));
    assert.ok(own.length >= 12 && own.length <= 14, `${f.id}: 12-14 exam-only items (${own.length})`);
    assert.ok(own.every(id => id.startsWith(`phys-exam-${f.id.slice(5)}-`)), 'exam-only items belong to their form');
    const fromBank = ids.filter(id => bank.has(id));
    assert.ok(fromBank.filter(id => checks.has(id)).length === 0, `${f.id}: no lesson-check items`);
    assert.equal(formUnits(f, ctx).filter(u => u.startsWith('unit-')).length, 8, 'every unit is on each exam');
    const by = {}; for (const id of ids) { const q = bank.get(id) || examItems.get(id); by[q.unit] = (by[q.unit] || 0) + 1; }
    assert.ok(by['unit-2'] >= 7 && by['unit-3'] >= 7, 'Units 2 and 3 are the heaviest');
  }
  const all = ex.forms.flatMap(f => f.mcq.flat());
  assert.equal(new Set(all).size, all.length, 'no question in both forms');
  const allF = ex.forms.flatMap(f => f.frq);
  assert.equal(new Set(allF).size, allF.length, 'no FRQ in both forms');
  assert.ok(ex.items.every(q => ex.forms.some(f => f.mcq.flat().includes(q.id))), 'every exam-only item is used');
});

test('the assembly check catches a broken real form', () => {
  const bad = (mut, re) => { const f = clone(ex.forms); mut(f); const e = checkForms(f, ctx); assert.ok(e.some(x => re.test(x)), `${re}: ${e.join(' | ')}`); };
  bad(f => { const i = f[0].mcq.findIndex(b => b.length > 2); f[0].mcq[i] = f[0].mcq[i].slice().reverse(); }, /not in authored order/);
  bad(f => { const i = f[0].mcq.findIndex(b => b.length > 2 && !b[0].startsWith('phys-exam-')); const b = f[0].mcq[i]; f[0].mcq.splice(i, 1, [b[0]], b.slice(1)); }, /needs its stimulus|has 2 questions/);
  bad(f => { f[1].frq[0] = f[0].frq[0]; }, /FRQ .* is also in form-1/);
  bad(f => { const own = f[0].mcq.findIndex(b => b.length === 1 && b[0].startsWith('phys-exam-1-')); const j = f[1].mcq.findIndex(b => b.length === 1 && !b[0].startsWith('phys-exam-')); f[1].mcq[j] = f[0].mcq[own]; }, /belongs to form-1/);
});

/* The runtime grader (phys-questions.js) on every exam-only item: the key is
   graded right and every other option wrong, so a key the data marks right
   is the one a student is credited for. */
test('every exam-only key is recomputed, and the runtime grader credits exactly the key', () => {
  const prompts = loadJustify(DATA, map);
  assert.deepEqual(checkNumbers(examItems, prompts), []);
  // Every exam-only item keys a recomputed number except the three that key a reason.
  const keyed = new Set(EXAM_NUMBERS.map(n => n.id));
  assert.deepEqual(ex.items.map(q => q.id).filter(id => !keyed.has(id)), ['phys-exam-1-13', 'phys-exam-2-05', 'phys-exam-2-08']);
  const Q = createBrowser().load('physics/assets/phys-questions.js').ApPhysQuestions;
  for (const q of ex.items) {
    q.options.forEach((_, i) => assert.equal(Q.grade(q, i).correct, i === q.correct, `${q.id} option ${i}`));
  }
  // A wrong key is caught.
  const m = new Map(examItems); const w = clone(m.get('phys-exam-1-12')); w.correct = 1; m.set(w.id, w);
  assert.ok(checkNumbers(m, prompts).some(e => /phys-exam-1-12/.test(e)));
});

test('the justification prompts pass, cover every unit and use the physics skills', () => {
  const prompts = loadJustify(DATA, map);
  assert.deepEqual(checkJustify(prompts, { map, trademarkProblems, scanPage }), []);
  assert.ok(prompts.length >= 32, `${prompts.length} prompts`);
  for (const u of map.chapters.filter(c => c.part === 'course')) {
    const n = prompts.filter(p => p.unit === u.id).length;
    assert.ok(n >= 3 && n <= 5, `${u.id}: ${n} prompts (3 to 5)`);
  }
  assert.deepEqual(Object.keys(JUSTIFY_SKILLS).sort(), ['conservation', 'energy-momentum', 'fluids', 'forces', 'functional-dependence', 'graphs', 'procedure']);
  for (const k of Object.keys(JUSTIFY_SKILLS)) assert.ok(prompts.some(p => p.skill === k), `a prompt for ${k}`);
  for (const n of JUSTIFY_NUMBERS) assert.ok(prompts.some(p => p.id === n.id), `${n.id} exists`);
  // The runtime (pages/justify.js) reads the skill names from the served data, not a list of its own.
  assert.doesNotMatch(readFileSync('physics/assets/pages/justify.js', 'utf8'), /coulomb|q-vs-k|titration|electrochem/);
  // A circular model answer is refused.
  const p = clone(prompts.find(x => x.skill === 'conservation'));
  p.earns.answer = 'Momentum is conserved because of the law of conservation of momentum, so the total stays the same before and after.';
  assert.ok(checkJustify([p], { map }).some(e => /circular/.test(e)));
});

test('the equations sheet has every equation and constant on the official sheet', () => {
  const rows = EQ.flatMap(s => s.rows);
  const all = rows.map(r => r[0]).join(' | ');
  const sheet = ['g = 9.8 m/s²', '9.8 N/kg', 'G = 6.67 × 10⁻¹¹', '1 atm = 1.0 × 10⁵ Pa', 'v_x = v_x0 + a_x t', 'x = x₀ + v_x0 t + ½a_x t²', 'v_x² = v_x0² + 2a_x(x − x₀)', 'x_cm = Σm_i x_i / Σm_i',
    'a_sys = ΣF / m_sys', '|F_g| = G m₁m₂ / r²', '|F_f| ≤ |μ F_N|', 'F_s = −k Δx', 'a_c = v² / r', 'K = ½mv²', 'W = F_∥ d = F d cos θ', 'ΔK = ΣW_i', 'U_s = ½k(Δx)²', 'U_G = −G m₁m₂ / r', 'ΔU_g = m g Δy',
    'P_avg = W / Δt = ΔE / Δt', 'P_inst = F_∥ v = F v cos θ', 'p = m v', 'F_net = Δp / Δt', 'J = F_avg Δt = Δp', 'v_cm = Σp_i / Σm_i', 'ω = ω₀ + α t', 'θ = θ₀ + ω₀ t + ½α t²', 'ω² = ω₀² + 2α(θ − θ₀)',
    'v = r ω', 'a_T = r α', 'τ = r_⊥ F = r F sin θ', 'I = Σm_i r_i²', 'I\' = I_cm + M d²', 'α_sys = Στ / I_sys', 'K = ½ I ω²', 'W = τ Δθ', 'L = I ω', 'L = r m v sin θ', 'ΔL = τ Δt', 'Δx_cm = r Δθ',
    'T = 1 / f', 'T_s = 2π √(m / k)', 'T_p = 2π √(ℓ / g)', 'x = A cos(2π f t)', 'x = A sin(2π f t)', 'ρ = m / V', 'P = F_⊥ / A', 'P = P₀ + ρ g h', 'P_gauge = ρ g h', 'F_b = ρ V g', 'A₁v₁ = A₂v₂', 'P₁ + ρgy₁ + ½ρv₁² = P₂ + ρgy₂ + ½ρv₂²',
    'c² = a² + b²', 's = r θ', 'C = 2πr', 'A = πr²', 'V = 4/3 πr³', 'S = 4πr²', 'Conventions'];
  for (const e of sheet) assert.ok(all.includes(e), `the sheet's "${e}" is on the page`);
  const topics = new Set(map.topics.map(t => t.id));
  const slugs = new Set(JSON.parse(readFileSync('physics/data/pages.json', 'utf8')).tools.map(t => t.slug));
  for (const r of rows) {
    assert.equal(r.length >= 5, true, r[0]);
    assert.ok(r[1].length >= 20 && r[2].length >= 20, `${r[0]}: what it is and when to use it`);
    assert.ok(topics.has(r[4]), `${r[0]}: topic ${r[4]}`);
    for (const sl of r[5] || []) assert.ok(slugs.has(sl), `${r[0]}: trainer ${sl}`);
    for (const t of [r[1], r[2]]) assert.deepEqual(trademarkProblems(t), [], r[0]);
  }
  const left = NOT_ON.map(r => r[0]).join(' | ');
  for (const w of ['Rotational inertia of a disk', 'Escape speed', 'Torricelli', 'Kepler', 'loop', 'greatest speed of an oscillator']) assert.match(left, new RegExp(w), `not on the sheet: ${w}`);
  for (const r of NOT_ON) assert.ok(topics.has(r[2]), r[0]);
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

test('with every unit published: the exams, the prompts, the equations sheet and 12-question unit tests', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'apphys-exams-')), 'physics');
  execFileSync(process.execPath, ['scripts/build-apphys.mjs', '--out', out], { env: { ...process.env, APPHYS_DATA: '', APPHYS_PUBLISHED: 'skills-math,unit-1,unit-2,unit-3,unit-4,unit-5,unit-6,unit-7,unit-8' } });
  const forms = JSON.parse(readFileSync(join(out, 'assets/exams/forms.json'), 'utf8'));
  assert.equal(forms.length, ex.forms.length);
  const own = JSON.parse(readFileSync(join(out, 'assets/exams/items.json'), 'utf8'));
  assert.equal(own.items.length, ex.items.length);
  assert.ok(own.items.every(q => q.why && q.why.correct), 'exam-only items carry their explanations');
  assert.deepEqual(Object.keys(own.stimuli).sort(), Object.keys(ex.stimuli).sort());
  const j = JSON.parse(readFileSync(join(out, 'assets/justify.json'), 'utf8'));
  assert.deepEqual(j.skills, JUSTIFY_SKILLS);
  assert.equal(j.prompts.filter(p => p.free).length, FREE_JUSTIFY);
  assert.ok(j.prompts.slice(0, FREE_JUSTIFY).every(p => p.free), 'the first prompts in course order are the free ones');
  for (let n = 1; n <= 8; n++) {
    const html = readFileSync(join(out, `unit-tests/unit-${n}.html`), 'utf8');
    assert.equal((html.match(/<div class="phys-q" data-qid=/g) || []).length, 12, `unit ${n} sample has 12 questions`);
    assert.match(html, new RegExp(`practice\\.html\\?unit=unit-${n}`));
    assert.match(html, /<details class="phys-q-key">/, 'answers readable without JavaScript');
    assert.doesNotMatch(html, /phys-exam-/, 'exam-only questions never appear on a free page');
  }
  const eq = readFileSync(join(out, 'equations-sheet.html'), 'utf8');
  assert.equal((eq.match(/<th scope="row">/g) || []).length, EQ.flatMap(s => s.rows).length);
  assert.doesNotMatch(eq, /arrives with the first published unit/);
  for (const m of eq.matchAll(/href="tools\/([a-z-]+)\.html"/g)) assert.ok(existsSync(join(out, 'tools', `${m[1]}.html`)), `the sheet links only live trainers (${m[1]})`);
  const calc = readFileSync(join(out, 'score-calculator.html'), 'utf8');
  assert.match(calc, /70 or more is shown as a 5, 55 or more as a 4, 41 or more as a 3, 31 or more as a 2/);
  assert.match(calc, /estimates, not official/);
});
