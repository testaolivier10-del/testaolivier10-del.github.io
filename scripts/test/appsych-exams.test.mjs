/* AP® Psychology practice exams, the "Make it specific" checker and
   the formula page (docs/appsych-architecture.md, "Practice exams", "Make it
   specific", "Exams and entry pages"). Forked from the AP® Statistics Phase 0
   tests:
   - the practice exam page runs the May 2027 format: Section I, 80
     four-option questions in 90 minutes; Section II, 3 FRQs of 10 points in
     70 minutes (design, data, calc); a calculator allowed, with a link to a
     scientific one (no embedded script); no readiness band, no score
     calculator;
   - unit weight ranges come out right for 80 questions;
   - a good form passes and the checker catches each way a form can break,
     including the three set kinds and the FRQ order (synthetic forms);
   - the "Make it specific" checker refuses a question for a hypothesis, a
     solution that does not say how it works, and a builder slot without a why;
   - the two real forms, the 40+ prompts and every recomputed number pass
     (Phase 3), and the number check bites;
   - the formula page covers every ApPsychCalc recipe named in spec section 7,
     each row with a worked line whose answer ApPsychCalc computes, and each
     row is a card in the "Formulas" flashcard deck;
   - the generator serves no forms and no unit tests before anything is
     published, and a unit test and the formula page once one is. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { loadMap, fromValue } from '../lib/appsych-build.mjs';
import { Tex, Calc } from '../lib/appsych-mathlib.mjs';
import { loadExams, loadJustify, checkNumbers, EXAM_NUMBERS, JUSTIFY_NUMBERS, checkForms, checkJustify, unitRange, MCQ_TOTAL, MCQ_PARTS, FRQ_PARTS, FRQ_POINTS, FRQ_TOTAL, FRQ_ORDER, EXAM_SETS, JUSTIFY_SKILLS } from '../lib/appsych-exams.mjs';
import { EQ, NOT_ON, TABLES, workedTex, workedValue, formulaCards } from '../lib/appsych-entry.mjs';

const map = loadMap();
const units = map.chapters.filter(c => c.part === 'course');

test('the practice exam page runs the May 2027 format: 80 in 90 minutes, then 3 FRQs of 10 points in 70, no band', () => {
  const ex = readFileSync('psychology/assets/pages/exams.js', 'utf8');
  assert.match(ex, /var MCQ_PARTS = \[\{ key: '', n: 80, sec: 90 \* 60, calc: false \}\];/);
  assert.match(ex, /var FRQ_PARTS = \[\{ key: '', n: 3, sec: 70 \* 60, calc: false \}\];/);
  assert.match(ex, /var FRQ_POINTS = 10;/);
  assert.deepEqual(MCQ_PARTS.map(p => [p.n, p.minutes]), [[80, 90]]);
  assert.deepEqual(FRQ_PARTS.map(p => [p.n, p.minutes]), [[3, 70]]);
  assert.equal(MCQ_TOTAL, 80); assert.equal(FRQ_POINTS, 10); assert.equal(FRQ_TOTAL, 3);
  assert.deepEqual(FRQ_ORDER, ['design', 'data', 'calc']);
  assert.deepEqual(EXAM_SETS, { quantitative: [3, 5], visual: [3, 5], text: [2, 2] });
  assert.match(ex, /https:\/\/www\.desmos\.com\/scientific/, 'a link to a free scientific calculator');
  assert.doesNotMatch(ex, /<script[^>]+desmos/i);
  assert.match(ex, /Calculator allowed\./);
  assert.match(ex, /graphing calculators are not/);
  assert.doesNotMatch(ex, /No calculator\.|function band\(|readiness estimate|score-calculator/i, 'no band, no score calculator');
  for (const fn of ['startExam', 'startSectionOne', 'endSectionOne', 'startSectionTwo', 'endFrqPart', 'selfScore', 'calcNotice']) assert.match(ex, new RegExp(`function ${fn}\\(`));
  assert.ok(!existsSync('psychology/assets/pages/score.js'));
});

test('unit weight ranges for 80 questions match the course framework', () => {
  assert.deepEqual(unitRange([6, 8]), [4, 7]);
  assert.deepEqual(unitRange([10, 15]), [8, 12]);
  assert.deepEqual(unitRange([7, 10]), [5, 8]);
  assert.deepEqual(unitRange([15, 20]), [12, 16]);
  const lo = units.reduce((s, u) => s + unitRange(u.weight)[0], 0), hi = units.reduce((s, u) => s + unitRange(u.weight)[1], 0);
  assert.ok(lo <= 80 && hi >= 80, `${lo}..${hi}`);
  assert.ok(!map.practicesConfirmed, 'practice weights are third party until a person confirms them (needs-author)');
});

/* A synthetic bank and two forms that pass, so each rule can be broken once:
   per unit its share of 80; 4 quantitative, 4 visual and 2 text sets of 3. */
function synth() {
  const counts = { 'unit-1': 6, 'unit-2': 6, 'unit-3': 10, 'unit-4': 10, 'unit-5': 10, 'unit-6': 10, 'unit-7': 7, 'unit-8': 7, 'unit-9': 14 };
  assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), 80);
  const SETS = { 'unit-3': ['quantitative', 'visual'], 'unit-4': ['visual'], 'unit-5': ['quantitative'], 'unit-6': ['text', 'visual'], 'unit-8': ['quantitative'], 'unit-9': ['quantitative', 'visual', 'text'] };
  const bank = new Map(), orderOf = {}, stimuli = {};
  const forms = [1, 2].map(n => {
    const mcq = [];
    for (const [u, c] of Object.entries(counts)) {
      const topic = map.topics.find(t => t.chapter === u && t.kind === 'concept').id;
      const kinds = SETS[u] || [];
      let i = 0;
      for (const [k, kind] of kinds.entries()) {
        const stim = `${topic}-set${n}-${k}`, block = [];
        stimuli[stim] = { kind };
        for (let j = 0; j < 3; j++, i++) {
          const id = `psy-${topic}-${n * 100 + i}`;
          bank.set(id, { id, type: 'single', unit: u, topic, practice: '1.A', options: ['a', 'b', 'c', 'd'], correct: 0, stimulus: stim });
          orderOf[id] = i; block.push(id);
        }
        mcq.push(block);
      }
      for (; i < c; i++) {
        const id = `psy-${topic}-${n * 100 + i}`;
        bank.set(id, { id, type: 'single', unit: u, topic, practice: '1.A', options: ['a', 'b', 'c', 'd'], correct: 0 });
        orderOf[id] = i; mcq.push([id]);
      }
    }
    return { id: `form-${n}`, title: `Practice exam ${n}`, mcq, frq: FRQ_ORDER.map(t => `frq-${t}-${n}`) };
  });
  const frqs = Object.fromEntries(forms.flatMap(f => f.frq.map(id => [id, { id, type: id.split('-')[1], units: ['unit-1'], points: 10 }])));
  return { forms, ctx: { map, bank, examItems: new Map(), frqs, orderOf: id => orderOf[id], stimuli: id => stimuli[id] } };
}

test('a form in the real format passes, and every way to break it is caught', () => {
  const { forms, ctx } = synth();
  assert.deepEqual(checkForms(forms, ctx), []);
  const clone = x => JSON.parse(JSON.stringify(x));
  const bad = (mut, re, c = ctx) => { const f = clone(forms); mut(f); const e = checkForms(f, c); assert.ok(e.some(x => re.test(x)), `${re}: ${e.join(' | ')}`); };
  const kindOf = b => b.length > 1 && ctx.stimuli(ctx.bank.get(b[0]).stimulus).kind;
  bad(f => { f.pop(); }, /need at least 2 practice exams/);
  bad(f => { f[0].mcq.pop(); }, /Section I has 79 questions, not 80/);
  bad(f => { const i = f[0].mcq.findIndex(b => kindOf(b) === 'text'); f[0].mcq.splice(i, 1, ...f[0].mcq[i].map(() => f[1].mcq.find(b => b.length === 1 && ctx.bank.get(b[0]).unit === 'unit-6'))); }, /1 text sets; the exam has 2/);
  bad(f => { const s = f[0].mcq.find(b => b.length === 3); s.length = 1; }, /needs its stimulus/);
  bad(f => { f[0].frq = f[0].frq.slice().reverse(); }, /Section II question 1 is a design question/);
  bad(f => { f[0].frq.pop(); }, /Section II has 2 questions, not 3/);
  bad(f => { f[1].mcq[0] = f[0].mcq[0]; }, /is also in form-1/);
  bad(f => { f[1].frq[0] = f[0].frq[0]; }, /FRQ .* is also in form-1/);
  bad(f => { const ones = f[0].mcq.filter(b => b.length === 1 && ctx.bank.get(b[0]).unit === 'unit-9'); f[0].mcq = f[0].mcq.filter(b => !ones.slice(0, 3).includes(b)); f[0].mcq.push(...f[1].mcq.filter(b => b.length === 1 && ctx.bank.get(b[0]).unit === 'unit-7').slice(0, 3)); }, /Unit 9 has 11 questions/);
  const ctx4 = { ...ctx, frqs: { ...ctx.frqs, [forms[0].frq[0]]: { ...ctx.frqs[forms[0].frq[0]], points: 9 } } };
  bad(() => {}, /worth 9 points, not 10/, ctx4);
  const ctx5 = { ...ctx, bank: new Map(ctx.bank) };
  const one = forms[0].mcq.find(b => b.length === 1)[0];
  ctx5.bank.set(one, { ...ctx.bank.get(one), type: 'numeric' });
  bad(() => {}, /not a four-option single-answer question/, ctx5);
});

test('the "Make it specific" checker refuses a question for a hypothesis, a solution without how, and a builder slot without a why', () => {
  assert.deepEqual(Object.keys(JUSTIFY_SKILLS).sort(), ['chain', 'control', 'hypothesis', 'policy', 'solution', 'tradeoff', 'trend', 'variables']);
  const topic = map.topics.find(t => t.chapter === 'unit-1' && t.kind === 'concept');
  const p = {
    id: 'u1-fertilizer-hypothesis', unit: 'unit-1', topic: topic.id, practice: '4.B', skill: 'hypothesis', title: 'Fertilizer and algae growth',
    prompt: '<b>Write</b> a testable hypothesis for the experiment described above.',
    checklist: ['States what is changed and what is measured', 'Gives a direction: increase or decrease'],
    earns: { answer: 'If more nitrate fertilizer is added to the pond water, then the algae growth in the tanks will increase.', why: 'It names the change, the measured variable and the direction, as a statement.' },
    misses: { answer: 'Does fertilizer affect how much the algae grow in the tanks?', why: 'A question is not a hypothesis, and it gives no direction for the result.' },
  };
  assert.deepEqual(checkJustify([p], { map }), []);
  const q = JSON.parse(JSON.stringify(p));
  q.earns.answer = 'Does adding more nitrate fertilizer to the pond water change how much algae grows in the tanks?';
  assert.ok(checkJustify([q], { map }).some(e => /directional statement/.test(e)));
  const s = { ...JSON.parse(JSON.stringify(p)), id: 'u1-fertilizer-solution', skill: 'solution' };
  s.earns.answer = 'Plant buffer strips of native grass along the stream banks next to the farm fields in the valley.';
  assert.ok(checkJustify([s], { map }).some(e => /says how it works/.test(e)));
  const b = { ...JSON.parse(JSON.stringify(p)), id: 'u1-fertilizer-builder', specific: { slots: { change: { label: 'Change', options: ['more nitrate', 'more light'], correct: 0 }, effect: { label: 'Effect', options: ['algae increase', 'algae decrease'], correct: 0, why: { 1: 'Placeholder: nitrate is a limiting nutrient here.' } } } } };
  assert.ok(checkJustify([b], { map }).some(e => /slot change option 2 needs a why/.test(e)));
  const t = JSON.parse(JSON.stringify(p)); t.earns.answer += ' APES students know this.';
  assert.ok(checkJustify([t], { map, trademarkProblems: s => /APES/.test(s) ? ['APES'] : [] }).some(e => /trademark/.test(e)));
});

test('the two real forms and the 40+ prompts pass every check, and every recomputed number is in place', () => {
  const D = 'psychology/data';
  const ex = loadExams(D);
  assert.equal(ex.forms.length, 2);
  const bank = new Map(), stim = {}, orderOf = {};
  for (const t of map.topics) { const p = join(D, 'questions', `${t.id}.json`); if (!existsSync(p)) continue; const d = JSON.parse(readFileSync(p, 'utf8')); d.items.forEach((q, i) => { bank.set(q.id, q); orderOf[q.id] = i; }); Object.assign(stim, d.stimuli || {}); }
  ex.items.forEach((q, i) => { orderOf[q.id] = i; });
  const examItems = new Map(ex.items.map(q => [q.id, q]));
  const frqs = {}; for (const f of readdirSync(join(D, 'frq'))) { const d = JSON.parse(readFileSync(join(D, 'frq', f), 'utf8')); frqs[d.id] = d; }
  assert.deepEqual(checkForms(ex.forms, { map, bank, examItems, frqs, orderOf: id => orderOf[id], stimuli: id => ex.stimuli[id] || stim[id] }), []);
  // Section II: the authored FRQs in exam order, none used twice.
  assert.deepEqual(ex.forms.map(f => f.frq.map(id => frqs[id].type)), [FRQ_ORDER, FRQ_ORDER]);
  // No bank question in a form is a lesson check item (the free lessons show those).
  const checks = new Set(); for (const t of map.topics) { const p = join(D, 'lessons', `${t.id}.json`); if (existsSync(p)) for (const id of JSON.parse(readFileSync(p, 'utf8')).check || []) checks.add(id); }
  for (const f of ex.forms) for (const id of f.mcq.flat()) assert.ok(!checks.has(id), `${f.id}: ${id} is a lesson check item`);
  const prompts = loadJustify(D, map);
  assert.ok(prompts.length >= 40);
  for (const u of units) { const n = prompts.filter(p => p.unit === u.id).length; assert.ok(n >= 4 && n <= 6, `${u.id}: ${n}`); }
  for (const k of Object.keys(JUSTIFY_SKILLS)) assert.ok(prompts.some(p => p.skill === k), k);
  assert.ok(prompts.filter(p => p.specific).length >= 20, 'slot builders where the answer has components');
  assert.deepEqual(checkJustify(prompts, { map }), []);
  assert.deepEqual(checkNumbers(examItems, prompts), []);
  // Every computed exam-only key and every prompt number is covered, and the check bites.
  assert.ok(EXAM_NUMBERS.length >= 15 && JUSTIFY_NUMBERS.length >= 6);
  const wrong = new Map(examItems); const q = JSON.parse(JSON.stringify(examItems.get('psy-exam-1-11'))); q.options[q.correct] = '13,000 kWh'; wrong.set(q.id, q);
  assert.ok(checkNumbers(wrong, prompts).some(e => /psy-exam-1-11/.test(e)));
  const q2 = JSON.parse(JSON.stringify(examItems.get('psy-exam-2-13'))); q2.options[(q2.correct + 1) % 4] = '1 m³'; const w2 = new Map(examItems); w2.set(q2.id, q2);
  assert.ok(checkNumbers(w2, prompts).some(e => /psy-exam-2-13.*distractor/.test(e)), 'a named-slip distractor that is not recomputed is caught');
  const p2 = JSON.parse(JSON.stringify(prompts).replace(/2025 \+ 40 = 2065/g, '2025 + 40 = 2056'));
  assert.ok(checkNumbers(examItems, p2).some(e => /u3-doubling-year/.test(e)));
});

test('the formula page covers every calculation type, each row a real ApPsychCalc recipe, with nothing on it the exam does not use', () => {
  const rows = EQ.flatMap(s => s.rows);
  const topics = new Set(map.topics.map(t => t.id));
  const tools = new Set(JSON.parse(readFileSync('psychology/data/pages.json', 'utf8')).tools.map(t => t.slug));
  for (const r of rows) {
    assert.equal(Tex.check(`$${r[0]}$`).length, 0, r[0]);
    // A backslash command inside \text{} prints literally ("growth rate (\%)").
    for (const t of [r[0], r[8][0], r[8][2] || '']) assert.doesNotMatch(t, /\\text\{[^{}]*\\/, t);
    for (const t of [r[1], r[2], r[3]]) assert.doesNotMatch(t, /[\x00-\x08]|—/, t);
    assert.match(r[4], /^(Unit [1-9]|Math you need)$/);
    assert.ok(topics.has(r[5]), r[5]);
    for (const s of r[6]) assert.ok(tools.has(s), s);
    assert.ok(Calc.FNS.includes(r[7]) && typeof Calc[r[7]] === 'function', `recipe ${r[7]}`);
    // A worked line with units, its answer computed by ApPsychCalc, valid TeX.
    assert.ok(Array.isArray(r[8]) && Number.isFinite(workedValue(r[8])), `worked line for ${r[7]}`);
    assert.equal(Tex.check(`$${workedTex(r[8])}$`).length, 0, workedTex(r[8]));
    assert.ok(r[8][2] || r[8][4] || r[7] === 'doublingYear', `${r[7]}: the worked answer has a unit`);
  }
  // The worked lines' answers, as a reader would check them by hand.
  const W = Object.fromEntries(rows.map(r => [r[7], workedValue(r[8])]));
  assert.deepEqual([W.percentChange, W.naturalIncrease, W.ruleOf70, W.doublingYear, W.npp, W.tenPercent, W.halfLifeLeft, W.biomagnify, W.cost, W.emissions], [25, 2, 50, 2075, 15000, 150, 10, 40, 1632, 5440]);
  // The "Formulas" flashcard deck: one card per row, permanent ids.
  const cards = formulaCards();
  assert.equal(cards.length, rows.length);
  assert.equal(new Set(cards.map(c => c.id)).size, cards.length);
  for (const c of cards) { assert.match(c.id, /^eq:[a-zA-Z0-9]+$/); assert.match(c.formula, /<math/); assert.match(c.worked, /<math/); }
  assert.match(readFileSync('psychology/assets/pages/flashcards.js', 'utf8'), /assets\/formulas\.json/);
  // Spec section 7: every calculation type the exam uses has a row.
  const named = new Set(rows.map(r => r[7]));
  for (const fn of ['percentChange', 'percentOf', 'naturalIncrease', 'growthRate', 'ruleOf70', 'doublingYear', 'exponential', 'afterDoublings', 'tfr', 'aboveReplacement', 'npp', 'tenPercent', 'efficiency', 'chainEfficiency', 'emissions', 'cost', 'savings', 'convert', 'halfLives', 'halfLifeLeft', 'ld50', 'doseFor', 'biomagnify', 'magnification', 'perCapita', 'density', 'waterVolume', 'waterPerArea']) assert.ok(named.has(fn), fn);
  assert.ok(NOT_ON.length >= 3);
  for (const r of NOT_ON) { assert.ok(topics.has(r[2]), r[0]); assert.equal(Tex.check(r[0] + ' ' + r[1]).length, 0, r[0]); }
  assert.ok(TABLES.some(t => /No formula sheet/.test(t[0])));
  // Each recipe gives the value its row's trap describes.
  assert.equal(fromValue({ fn: 'naturalIncrease', args: [30, 10] }), 2);
  assert.equal(fromValue({ fn: 'ruleOf70', args: [2] }), 35);
  assert.equal(fromValue({ fn: 'tenPercent', args: [10000, 2] }), 100);
  assert.equal(fromValue({ fn: 'percentChange', args: [120, 150] }), 25);
});

test('the generator serves nothing before a unit is published, and a unit test and the formula page once one is', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'appsych-exams-')), 'psychology');
  execFileSync(process.execPath, ['scripts/build-appsych.mjs', '--out', out], { env: { ...process.env, APPSYCH_DATA: '', APPSYCH_PUBLISHED: '' } });
  assert.deepEqual(JSON.parse(readFileSync(join(out, 'assets/exams/forms.json'), 'utf8')), []);
  assert.equal(existsSync(join(out, 'unit-tests')), false);
  assert.equal(existsSync(join(out, 'score-calculator.html')), false);
  const out2 = join(mkdtempSync(join(tmpdir(), 'appsych-exams-')), 'psychology');
  execFileSync(process.execPath, ['scripts/build-appsych.mjs', '--out', out2], { env: { ...process.env, APPSYCH_DATA: 'scripts/test/fixtures/appsych-data', APPSYCH_PUBLISHED: 'unit-3' } });
  const html = readFileSync(join(out2, 'unit-tests/unit-3.html'), 'utf8');
  assert.ok((html.match(/<div class="psy-q" data-qid=/g) || []).length >= 4, 'a sample of the unit\'s questions');
  assert.match(html, /<details class="psy-q-key">/, 'answers readable without JavaScript');
  assert.match(html, /<math class="psy-m">/, 'with rendered math');
  const f = readFileSync(join(out2, 'formula-sheet.html'), 'utf8');
  assert.match(f, /<h1>Formulas you must memorize<\/h1>/);
  assert.equal((f.match(/<th scope="row">/g) || []).length, EQ.flatMap(s => s.rows).length);
  assert.match(f, /No formula sheet/);
  assert.doesNotMatch(f, /score-calculator|reference sheet, explained/i);
});

test('timed sections: a fixed exam can run Section I or Section II alone (?section=1|2)', () => {
  const ex = readFileSync('psychology/assets/pages/exams.js', 'utf8');
  assert.match(ex, /p\.get\('section'\) === '1' \|\| p\.get\('section'\) === '2'/);
  assert.match(ex, /startExam\(sec === '2' \? \[\] : qs, sec === '1' \? \[\] : r\[1\]/);
  assert.match(ex, /if\(!mcqParts\.length && frqParts\.length\) return startSectionTwo\(0\);/);
  assert.match(ex, /Section I only \(80 questions, 90 min\)/);
  assert.match(ex, /Section II only \(3 questions, 70 min\)/);
});
