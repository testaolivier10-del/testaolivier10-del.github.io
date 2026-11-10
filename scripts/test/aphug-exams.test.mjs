/* AP® Human Geography practice exams, the "Make it specific" checker and the
   formulas page (docs/aphug-architecture.md, "Practice exams", "Make it
   specific", "Exams and entry pages"). Forked from AP® Psychology's tests:
   - the practice exam page runs the May 2027 format: Section I, 60
     questions in 60 minutes; Section II, three FRQs (no stimulus, one, two),
     7 points each, in 75 minutes; no calculator; no readiness band, no score
     calculator; five options on the forms, four in the bank;
   - unit weight ranges come out right for 60 questions;
   - a good form passes and the checker catches each way a form can break,
     including the set kinds, the fifth option and the FRQ order (synthetic forms);
   - the "Make it specific" checker refuses an explain with no link, a
     compare with one side, a degree not stated, a scale not named, and a
     builder slot without a why;
   - the formulas page uses only ApHugCalc recipes, each row with a worked
     line ApHugCalc computes and a number small enough by hand, and each row
     is a card in the "Formulas" flashcard deck;
   - the generator serves no forms and no unit tests before anything is
     published, and a unit test and the formulas page once one is;
   - Phase 3, the real data: both forms pass every check (60 five-option
     questions by unit weight, 30 to 40 percent with a stimulus, sets of two
     or three, the three FRQ types from different units, no question or FRQ
     in both), each form as served passes the length tell, key position and
     test-wise limits, every exam-only number and map or pyramid read is
     recomputed, no key hinges on a disputed place or a stale figure, the
     fifth options are checked, the "Make it specific" prompts pass (about
     ten a unit, three in the skills chapter, every skill, first three free),
     the models page covers every CED-named model, and the built site serves
     every form question with five options while the free unit tests show
     none of them. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { loadMap } from '../lib/aphug-build.mjs';
import { Tex, Calc } from '../lib/aphug-mathlib.mjs';
import { checkForms, checkJustify, checkFifth, checkReads, checkNumbers, servedForm, examVersion, fifthAt, keyRisks, loadExams, loadJustify, EXAM_STIMULI, EXAM_ONLY, EXAM_NUMBERS, EXAM_READS, JUSTIFY_NUMBERS, JUSTIFY_PER_CHAPTER, JUSTIFY_PER_SKILLS_CHAPTER, FREE_JUSTIFY, unitRange, MCQ_TOTAL, MCQ_PARTS, MCQ_OPTIONS, FRQ_PARTS, FRQ_POINTS, FRQ_TOTAL, FRQ_ORDER, FRQ_TYPES, FRQ_STIMULI, FRQ_LABELS, VERBS, EXAM_SETS, JUSTIFY_SKILLS } from '../lib/aphug-exams.mjs';
import { EQ, NOT_ON, TABLES, workedTex, workedValue, formulaCards, modelEntries } from '../lib/aphug-entry.mjs';

const map = loadMap();
const units = map.chapters.filter(c => c.part === 'course');

test('the practice exam page runs the May 2027 format: 60 in 60 minutes, then three 7-point FRQs in 75, no calculator, no band', () => {
  const ex = readFileSync('human-geography/assets/pages/exams.js', 'utf8');
  assert.match(ex, /var MCQ_PARTS = \[\{ key: '', n: 60, sec: 60 \* 60, calc: false \}\];/);
  assert.match(ex, /var FRQ_PARTS = \[\{ key: '', n: 3, sec: 75 \* 60, calc: false \}\];/);
  assert.match(ex, /var FRQ_POINTS = 7;/);
  assert.deepEqual(MCQ_PARTS.map(p => [p.n, p.minutes]), [[60, 60]]);
  assert.deepEqual(FRQ_PARTS.map(p => [p.n, p.minutes]), [[3, 75]]);
  assert.equal(MCQ_TOTAL, 60); assert.equal(FRQ_POINTS, 7); assert.equal(FRQ_TOTAL, 3);
  assert.deepEqual(MCQ_OPTIONS, { form: 5, bank: 4 });
  assert.deepEqual(FRQ_ORDER, ['none', 'one', 'two']);
  assert.deepEqual(FRQ_STIMULI, { none: 0, one: 1, two: 2 });
  assert.deepEqual(Object.keys(FRQ_TYPES), FRQ_ORDER);
  assert.deepEqual(FRQ_LABELS, ['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  assert.deepEqual(Object.keys(VERBS), ['identify', 'define', 'describe', 'explain', 'compare', 'explain-degree']);
  for (const v of Object.values(VERBS)) { assert.ok(v.name && v.demand.length > 40); assert.doesNotMatch(v.demand, /—/); }
  assert.deepEqual(Object.keys(EXAM_SETS), ['map', 'data', 'image', 'text']);
  assert.match(ex, /No calculator\./);
  assert.doesNotMatch(ex, /desmos|Calculator allowed|function band\(|readiness estimate|score-calculator/i, 'no calculator link, no band, no score calculator');
  for (const fn of ['startExam', 'startSectionOne', 'endSectionOne', 'startSectionTwo', 'endFrqPart', 'selfScore', 'calcNotice']) assert.match(ex, new RegExp(`function ${fn}\\(`));
  assert.match(ex, /Section I only \(60 questions, 60 min\)/);
  assert.match(ex, /Section II only \(3 questions, 75 min\)/);
  assert.match(ex, /q\.own = \/\^hug-exam-\/\.test\(q\.id\)/, 'every form question comes served with five options; only hug-exam-* are exam-only');
  assert.match(ex, /var WEIGHTS = \{ mcq: 50, frq: 50 \};/, 'each section is half the score');
  assert.match(ex, /Section I \(' \+ WEIGHTS\.mcq \+ '% of the exam\)/, 'results show Section I apart, with its weight');
  assert.match(ex, /Section II \(' \+ WEIGHTS\.frq \+ '% of the exam\)/, 'and Section II');
  assert.match(ex, /estimate: null,/, 'no readiness band on the score card');
  assert.doesNotMatch(ex, /Readiness band|Beta|\\u2014/, 'no band, no Beta label, no em dash');
  assert.match(readFileSync('human-geography/assets/pages/cram.js', 'utf8'), /var DEFAULT_EXAM = '2027-05-03';/, 'Monday 3 May 2027');
  assert.match(readFileSync('assets/exam-date.js', 'utf8'), /aphug: \{ date: '2027-05-03'/);
});

test('unit weight ranges for 60 questions match the course framework', () => {
  assert.deepEqual(unitRange([8, 10]), [4, 6]);
  assert.deepEqual(unitRange([12, 17]), [7, 11]);
  const lo = units.reduce((s, u) => s + unitRange(u.weight)[0], 0), hi = units.reduce((s, u) => s + unitRange(u.weight)[1], 0);
  assert.ok(lo <= 60 && hi >= 60, `${lo}..${hi}`);
  assert.ok(!map.practicesConfirmed, 'skill weights are read through a paraphrasing tool until a person confirms them (needs-author)');
});

/* A synthetic bank and two forms that pass, so each rule can be broken once:
   Unit 1 five questions, the rest nine each; map, data, image and text sets of 3. */
function synth() {
  const counts = { 'unit-1': 6, 'unit-2': 9, 'unit-3': 9, 'unit-4': 9, 'unit-5': 9, 'unit-6': 9, 'unit-7': 9 };
  const SETS = { 'unit-2': ['map', 'data'], 'unit-3': ['image'], 'unit-4': ['map'], 'unit-6': ['data'], 'unit-7': ['text'] };
  const bank = new Map(), examItems = new Map(), orderOf = {}, stimuli = {};
  const forms = [1, 2].map(n => {
    const mcq = [];
    let own = 0;
    for (const [u, c] of Object.entries(counts)) {
      const topic = map.topics.find(t => t.chapter === u && t.kind === 'concept').id;
      let i = 0;
      // Units 2 to 7 each give the form one exam-only question (five options).
      if (u !== 'unit-1') { const id = `hug-exam-${n}-${String(++own).padStart(2, '0')}`; examItems.set(id, { id, type: 'single', unit: u, topic, practice: '1.A', options: ['a', 'b', 'c', 'd', 'e'], correct: 0 }); orderOf[id] = own; mcq.push([id]); i++; }
      for (const [k, kind] of (SETS[u] || []).entries()) {
        const stim = `${topic}-set${n}-${k}`, block = [];
        stimuli[stim] = { kind };
        for (let j = 0; j < 3; j++, i++) {
          const id = `hug-${topic}-${n * 100 + i}`;
          bank.set(id, { id, type: 'single', unit: u, topic, practice: '1.A', options: ['a', 'b', 'c', 'd', 'e'], correct: 0, stimulus: stim });
          orderOf[id] = i; block.push(id);
        }
        mcq.push(block);
      }
      for (; i < c; i++) {
        const id = `hug-${topic}-${n * 100 + i}`;
        bank.set(id, { id, type: 'single', unit: u, topic, practice: '1.A', options: ['a', 'b', 'c', 'd'], correct: 0 });
        orderOf[id] = i; mcq.push([id]);
      }
    }
    const fifth = Object.fromEntries(mcq.flat().filter(id => bank.has(id) && bank.get(id).options.length === 4).map(id => [id, { text: 'e', why: 'Placeholder: the fifth option.' }]));
    return { id: `form-${n}`, title: `Practice exam ${n}`, mcq, fifth, frq: FRQ_ORDER.map(t => `frq-${t}-${n}`) };
  });
  const U = { none: 'unit-2', one: 'unit-3', two: 'unit-4' };
  const frqs = Object.fromEntries(forms.flatMap(f => f.frq.map(id => [id, { id, type: id.split('-')[1], units: [U[id.split('-')[1]]], points: 7 }])));
  return { forms, ctx: { map, bank, examItems, frqs, orderOf: id => orderOf[id], stimuli: id => stimuli[id] } };
}

test('a form in the real format passes, and every way to break it is caught', () => {
  const { forms, ctx } = synth();
  assert.deepEqual(checkForms(forms, ctx), []);
  const clone = x => JSON.parse(JSON.stringify(x));
  const bad = (mut, re, c = ctx) => { const f = clone(forms); mut(f); const e = checkForms(f, c); assert.ok(e.some(x => re.test(x)), `${re}: ${e.join(' | ')}`); };
  bad(f => { f.pop(); }, /need at least 2 practice exams/);
  bad(f => { f[0].mcq.pop(); }, /Section I has 59 questions, not 60/);
  bad(f => { const s = f[0].mcq.find(b => b.length === 3); s.length = 1; }, /needs its stimulus/);
  bad(f => { f[0].frq = f[0].frq.slice().reverse(); }, /Section II question 1 is a none question/);
  bad(f => { f[0].frq.pop(); }, /Section II has 2 questions, not 3/);
  bad(f => { f[1].mcq[0] = f[0].mcq[0]; }, /is also in form-1/);
  bad(f => { f[1].frq[0] = f[0].frq[0]; }, /FRQ .* is also in form-1/);
  bad(f => { delete f[0].fifth[f[0].mcq.find(b => b.length === 1 && ctx.bank.has(b[0]))[0]]; }, /not a 5-option single-answer question/);
  bad(f => { for (const fm of f) fm.mcq = fm.mcq.filter(b => !(b.length === 3 && ctx.stimuli(ctx.bank.get(b[0]).stimulus).kind === 'map')); }, /map sets|Section I has/);
  const ctx4 = { ...ctx, frqs: { ...ctx.frqs, [forms[0].frq[0]]: { ...ctx.frqs[forms[0].frq[0]], points: 9 } } };
  bad(() => {}, /worth 9 points, not 7/, ctx4);
  const ctx5 = { ...ctx, bank: new Map(ctx.bank) };
  const one = forms[0].mcq.find(b => b.length === 1 && ctx.bank.has(b[0]))[0];
  ctx5.bank.set(one, { ...ctx.bank.get(one), type: 'numeric' });
  bad(() => {}, /not a 5-option single-answer question/, ctx5);
  // A set is whole: a usable question of its stimulus left out is caught,
  // unless it is a lesson check item or not a single answer.
  const ctx6 = { ...ctx, bank: new Map(ctx.bank) };
  const set = forms[0].mcq.find(b => b.length === 3), stim = ctx.bank.get(set[0]).stimulus, extra = `${set[0]}-extra`;
  ctx6.bank.set(extra, { ...ctx.bank.get(set[0]), id: extra });
  bad(() => {}, new RegExp(`set ${stim} leaves out ${extra}`), ctx6);
  assert.deepEqual(checkForms(forms, { ...ctx6, lessonChecks: new Set([extra]) }), []);
  // Phase 3 rules: each FRQ from different units, 30 to 40 percent with a stimulus, the exam-only share.
  const ctx7 = { ...ctx, frqs: { ...ctx.frqs, [forms[0].frq[1]]: { ...ctx.frqs[forms[0].frq[1]], units: ['unit-2'] } } };
  bad(() => {}, /unit-2 is in two of the form's FRQs/, ctx7);
  const ctx8 = { ...ctx, bank: new Map([...ctx.bank].map(([id, q]) => [id, q.stimulus && /set\d-0$/.test(q.stimulus) ? { ...q, stimulus: undefined } : q])) };
  bad(() => {}, /questions have a stimulus; the exam has about 30 to 40%/, ctx8);
  bad(f => { const k = f[0].mcq.findIndex(b => /hug-exam-/.test(b[0])); f[0].mcq[k] = [f[0].mcq[k][0].replace('hug-exam-1', 'hug-exam-2')]; }, /exam-only item hug-exam-2-\d+ belongs to form-2|is also in/);
  const ctx9 = { ...ctx, examItems: new Map([...ctx.examItems].filter(([id]) => !/hug-exam-1-0[1-3]/.test(id))), bank: new Map(ctx.bank) };
  for (const id of ['hug-exam-1-01', 'hug-exam-1-02', 'hug-exam-1-03']) ctx9.bank.set(id, { ...ctx.examItems.get(id), options: ['a', 'b', 'c', 'd'] });
  const f9 = clone(forms); for (const id of ['hug-exam-1-01', 'hug-exam-1-02', 'hug-exam-1-03']) f9[0].fifth[id] = { text: 'e', why: 'Placeholder: the fifth option.' };
  assert.ok(checkForms(f9, ctx9).some(e => /3 exam-only questions \(6 to 16\)/.test(e)), checkForms(f9, ctx9).join(' | '));
  assert.deepEqual(EXAM_STIMULI, [0.3, 0.4]);
  assert.deepEqual(EXAM_ONLY, [6, 16]);
});

test('the "Make it specific" checker refuses an explain with no link, a compare with one side, a degree not stated, a scale not named, and a slot without a why', () => {
  assert.deepEqual(Object.keys(JUSTIFY_SKILLS).sort(), ['compare', 'degree', 'describe', 'explain', 'legend', 'limitation', 'model', 'place', 'scale']);
  const topic = map.topics.find(t => t.id === 'distribution-consequences');
  const p = {
    id: 'u2-egypt-explain', unit: 'unit-2', topic: topic.id, practice: '1.B', skill: 'explain', title: 'Farmland under pressure',
    prompt: '<b>Explain</b> why a country with a low arithmetic density can still have farmland under heavy pressure.',
    checklist: ['Names the measure that compares people with farmland', 'Links the small share of arable land to the pressure on it'],
    earns: { answer: 'Egypt has a low arithmetic density but a very high physiological density, because almost all its people farm and live on the narrow strip of arable land along the Nile.', why: 'It names the measure, the place and the cause, linked with because.' },
    misses: { answer: 'Egypt has a high physiological density along the Nile.', why: 'It names the measure but never says why the pressure arises.' },
  };
  assert.deepEqual(checkJustify([p], { map }), []);
  const q = JSON.parse(JSON.stringify(p)); q.earns.answer = 'Egypt has a low arithmetic density and a very high physiological density along the narrow strip of farmland by the Nile.';
  assert.ok(checkJustify([q], { map }).some(e => /carries its link/.test(e)));
  const c = { ...JSON.parse(JSON.stringify(p)), id: 'u2-egypt-compare', skill: 'compare' };
  c.earns.answer = 'Egypt has a high physiological density along the Nile, with most farmland crowded into a narrow strip.';
  assert.ok(checkJustify([c], { map }).some(x => /speaks of both sides/.test(x)));
  const d = { ...JSON.parse(JSON.stringify(p)), id: 'u2-egypt-degree', skill: 'degree' };
  assert.ok(checkJustify([d], { map }).some(x => /states the degree first/.test(x)));
  const s = { ...JSON.parse(JSON.stringify(p)), id: 'u2-egypt-scale', skill: 'scale' };
  assert.ok(checkJustify([s], { map }).some(x => /names the scale of analysis/.test(x)));
  const b = { ...JSON.parse(JSON.stringify(p)), id: 'u2-egypt-builder', specific: { slots: { place: { label: 'Place', options: ['Egypt', 'some countries'], correct: 0 }, measure: { label: 'Measure', options: ['physiological density', 'arithmetic density'], correct: 0, why: { 1: 'Placeholder: arithmetic density uses all the land.' } } } } };
  assert.ok(checkJustify([b], { map }).some(x => /slot place option 2 needs a why/.test(x)));
  const t = JSON.parse(JSON.stringify(p)); t.earns.answer += ' APHG students know this.';
  assert.ok(checkJustify([t], { map, trademarkProblems: x => /APHG/.test(x) ? ['APHG'] : [] }).some(x => /trademark/.test(x)));
});

test('the formulas page: every row a real ApHugCalc recipe, a worked line by hand, and a flashcard', () => {
  const rows = EQ.flatMap(s => s.rows);
  const topics = new Set(map.topics.map(t => t.id));
  const tools = new Set(JSON.parse(readFileSync('human-geography/data/pages.json', 'utf8')).tools.map(t => t.slug));
  for (const r of rows) {
    assert.equal(Tex.check(`$${r[0]}$`).length, 0, r[0]);
    for (const t of [r[0], r[8][0], r[8][2] || '']) assert.doesNotMatch(t, /\\text\{[^{}]*\\/, t);
    for (const t of [r[1], r[2], r[3]]) assert.doesNotMatch(t, /[\x00-\x08]|—/, t);
    assert.match(r[4], /^(Unit [1-7]|Skills you need)$/);
    assert.ok(topics.has(r[5]), r[5]);
    for (const sl of r[6]) assert.ok(tools.has(sl), sl);
    assert.ok(Calc.FNS.includes(r[7]) && typeof Calc[r[7]] === 'function', `recipe ${r[7]}`);
    assert.ok(Array.isArray(r[8]) && Number.isFinite(workedValue(r[8])), `worked line for ${r[7]}`);
    assert.equal(Tex.check(`$${workedTex(r[8])}$`).length, 0, workedTex(r[8]));
  }
  const W = Object.fromEntries(rows.map(r => [r[7], workedValue(r[8])]));
  assert.deepEqual([W.cbr, W.rni, W.doublingTime, W.netMigrationRate, W.dependency, W.sexRatio, W.arithmeticDensity, W.physiologicalDensity, W.agriculturalDensity, W.rankSize, W.gravity, W.percentChange, W.mapToGround],
    [30, 2, 35, 4, 50, 105, 20, 200, 20, 4000000, 3, 25, 2]);
  const cards = formulaCards();
  assert.equal(cards.length, rows.length);
  assert.equal(new Set(cards.map(c => c.id)).size, cards.length);
  for (const c of cards) { assert.match(c.id, /^eq:[a-zA-Z0-9]+$/); assert.match(c.formula, /<math/); assert.match(c.worked, /<math/); }
  assert.ok(NOT_ON.length >= 3);
  for (const r of NOT_ON) assert.ok(topics.has(r[2]), r[0]);
  assert.ok(TABLES.some(t => /No calculator/.test(t[0])) && TABLES.some(t => /No formula sheet/.test(t[0])));
});

test('the generator serves nothing before a unit is published, and a unit test and the formulas page once one is', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'aphug-exams-')), 'human-geography');
  execFileSync(process.execPath, ['scripts/build-aphug.mjs', '--out', out], { env: { ...process.env, APHUG_DATA: '', APHUG_PUBLISHED: '' } });
  assert.deepEqual(JSON.parse(readFileSync(join(out, 'assets/exams/forms.json'), 'utf8')), []);
  assert.equal(existsSync(join(out, 'unit-tests')), false);
  assert.equal(existsSync(join(out, 'score-calculator.html')), false);
  const out2 = join(mkdtempSync(join(tmpdir(), 'aphug-exams-')), 'human-geography');
  execFileSync(process.execPath, ['scripts/build-aphug.mjs', '--out', out2], { env: { ...process.env, APHUG_DATA: 'scripts/test/fixtures/aphug-data', APHUG_PUBLISHED: 'unit-2' } });
  const html = readFileSync(join(out2, 'unit-tests/unit-2.html'), 'utf8');
  assert.ok((html.match(/<div class="hug-q" data-qid=/g) || []).length >= 4, 'a sample of the unit\'s questions');
  assert.match(html, /<details class="hug-q-key">/, 'answers readable without JavaScript');
  const f = readFileSync(join(out2, 'formula-sheet.html'), 'utf8');
  assert.match(f, /<h1>Formulas you must know<\/h1>/);
  assert.equal((f.match(/<th scope="row">/g) || []).length, EQ.flatMap(s => s.rows).length);
  assert.match(f, /No calculator/);
  assert.doesNotMatch(f, /score-calculator|Statistics you must know/i);
});

test('timed sections: a fixed exam can run Section I or Section II alone (?section=1|2)', () => {
  const ex = readFileSync('human-geography/assets/pages/exams.js', 'utf8');
  assert.match(ex, /p\.get\('section'\) === '1' \|\| p\.get\('section'\) === '2'/);
  assert.match(ex, /startExam\(sec === '2' \? \[\] : qs, sec === '1' \? \[\] : r\[1\]/);
  assert.match(ex, /if\(!mcqParts\.length && frqParts\.length\) return startSectionTwo\(0\);/);
});

/* ------------------------------------------------ Phase 3: the real data */
const DATA = 'human-geography/data';
const real = (() => {
  const ex = loadExams(DATA), bank = new Map(), stim = {}, orderOf = {}, lessonChecks = new Set();
  for (const t of map.topics) {
    const Q = JSON.parse(readFileSync(join(DATA, 'questions', `${t.id}.json`), 'utf8'));
    Q.items.forEach((q, i) => { bank.set(q.id, q); orderOf[q.id] = i; });
    Object.assign(stim, Q.stimuli || {});
    for (const id of JSON.parse(readFileSync(join(DATA, 'lessons', `${t.id}.json`), 'utf8')).check || []) lessonChecks.add(id);
  }
  ex.items.forEach((q, i) => { orderOf[q.id] = i; });
  const examItems = new Map(ex.items.map(q => [q.id, q]));
  const frqs = {};
  for (const f of readdirSync(join(DATA, 'frq'))) { const d = JSON.parse(readFileSync(join(DATA, 'frq', f), 'utf8')); frqs[d.id] = d; }
  return { ex, bank, examItems, frqs, lessonChecks, stimuli: id => ex.stimuli[id] || stim[id], orderOf: id => orderOf[id] };
})();

test('Phase 3: both practice exams pass every form check, in the May 2027 format', () => {
  const { ex } = real;
  assert.equal(ex.forms.length, 2);
  assert.deepEqual(checkForms(ex.forms, { map, ...real }), []);
  assert.deepEqual(checkFifth(ex.forms, real), []);
  const seenFrq = new Set();
  for (const f of ex.forms) {
    const qs = servedForm(f, real);
    assert.equal(qs.length, 60);
    for (const q of qs) { assert.equal(q.options.length, 5, q.id); assert.equal(q.why.options.length, 5, q.id); assert.ok(Number.isInteger(q.correct) && q.correct < 5); }
    // By unit weight: Unit 1 five or six, Units 2 to 7 about nine each.
    const by = {}; for (const q of qs) by[q.unit] = (by[q.unit] || 0) + 1;
    assert.ok(by['unit-1'] >= 5 && by['unit-1'] <= 6, `Unit 1: ${by['unit-1']}`);
    for (let u = 2; u <= 7; u++) assert.ok(by[`unit-${u}`] >= 8 && by[`unit-${u}`] <= 10, `Unit ${u}: ${by[`unit-${u}`]}`);
    // 30 to 40 percent with a stimulus, some in sets of two or three.
    const st = qs.filter(q => q.stimulus).length;
    assert.ok(st >= 18 && st <= 24, `${f.id}: ${st} with a stimulus`);
    const sets = f.mcq.filter(b => b.length > 1).map(b => b.length);
    assert.ok(sets.some(n => n === 2) && sets.some(n => n === 3), `${f.id} sets ${sets}`);
    for (const b of f.mcq) assert.ok(b.length <= 3, `${f.id}: a set of ${b.length}`);
    // Every stimulus kind the exam uses appears.
    const kinds = new Set(f.mcq.map(b => (real.stimuli(real.bank.get(b[0])?.stimulus || real.examItems.get(b[0])?.stimulus) || {}).kind).filter(Boolean));
    for (const k of ['map', 'data', 'image', 'text']) assert.ok(kinds.has(k), `${f.id} has no ${k} set`);
    // Key position balanced as served; the key is rarely the longest option.
    const pos = [0, 0, 0, 0, 0]; let longest = 0;
    for (const q of qs) { if (!q.fixed) pos[q.correct]++; const L = q.options.map(o => o.length); if (L[q.correct] > Math.max(...L.filter((_, i) => i !== q.correct))) longest++; }
    assert.ok(Math.max(...pos) <= 24 && Math.min(...pos) >= 5, `${f.id} key positions ${pos}`);
    assert.ok(longest <= 24, `${f.id}: key longest in ${longest}`);
    // No key hinges on a disputed place or a stale figure.
    for (const q of qs) assert.deepEqual(keyRisks(q, real.stimuli(q.stimulus)), [], q.id);
    // Section II: none, one, two; different units; nothing in both forms; never a lesson check.
    assert.deepEqual(f.frq.map(id => real.frqs[id].type), ['none', 'one', 'two']);
    const us = f.frq.flatMap(id => real.frqs[id].units);
    assert.equal(new Set(us).size, us.length, `${f.id} FRQ units ${us}`);
    for (const id of f.frq) { assert.ok(!seenFrq.has(id), id); seenFrq.add(id); }
    for (const id of f.mcq.flat()) assert.ok(!real.lessonChecks.has(id), `${id} is a lesson check item`);
  }
  // No question in both forms.
  const a = new Set(ex.forms[0].mcq.flat());
  for (const id of ex.forms[1].mcq.flat()) assert.ok(!a.has(id), id);
});

test('Phase 3: every exam-only number and every map or pyramid read is recomputed from its data', () => {
  assert.deepEqual(checkNumbers(real.examItems, loadJustify(DATA, map)), []);
  assert.deepEqual(checkReads(real.examItems, real.ex.stimuli), []);
  assert.ok(EXAM_NUMBERS.length >= 3 && EXAM_READS.length >= 5 && JUSTIFY_NUMBERS.length >= 1);
  // Break a read and a number: both are caught.
  const items = new Map([...real.examItems].map(([id, q]) => [id, JSON.parse(JSON.stringify(q))]));
  const q = items.get('hug-exam-1-03'); q.options[q.correct] = 'About 300,000';
  assert.ok(checkReads(items, real.ex.stimuli).some(e => /hug-exam-1-03 keys "About 300,000"/.test(e)));
  const stims = JSON.parse(JSON.stringify(real.ex.stimuli)); stims['exam-1-s2'].plot.left[0] = 9.6;
  assert.ok(checkReads(real.examItems, stims).some(e => /hug-exam-1-02/.test(e)), 'a pyramid that no longer sums to 100 or gives the key');
  const n = items.get('hug-exam-2-02'); n.options[n.correct] = 'About 35 years';
  assert.ok(checkNumbers(items, []).some(e => /hug-exam-2-02 keys/.test(e)));
  // examVersion puts the fifth at fifthAt(id) and moves the key with its option.
  const bq = real.bank.get('hug-views-of-the-world-7'), fv = examVersion(bq, { [bq.id]: { text: 'X', why: 'Placeholder why for X.' } });
  assert.equal(fv.options[fifthAt(bq.id)], 'X');
  assert.equal(fv.options[fv.correct], bq.options[bq.correct]);
  assert.equal(fv.why.options[fifthAt(bq.id)], 'Placeholder why for X.');
  // keyRisks: a disputed place or an undated figure in a key is refused.
  assert.ok(keyRisks({ id: 'x', q: 'Which?', options: ['Kosovo', 'b'], correct: 0 }, null).length);
  assert.ok(keyRisks({ id: 'x', q: 'How many?', options: ['About 8.2 billion people', 'b'], correct: 0 }, null).length);
  assert.equal(keyRisks({ id: 'x', q: 'Invented Country H...', options: ['2,000 people per square kilometer', 'b'], correct: 0 }, null).length, 0);
  // A fifth that repeats an option, or one for a question not in the form, is caught.
  const f = JSON.parse(JSON.stringify(real.ex.forms));
  const id0 = f[0].mcq.flat().find(id => real.bank.has(id));
  f[0].fifth[id0].text = real.bank.get(id0).options[0];
  f[0].fifth['hug-views-of-the-world-1'] = { text: 'zzz', why: 'Placeholder: not in the form.' };
  const e = checkFifth(f, real);
  assert.ok(e.some(x => /repeats one of the four options/.test(x)) && e.some(x => /is not in this form/.test(x)), e.join(' | '));
});

test('Phase 3: the "Make it specific" prompts: about ten a unit, three in the skills chapter, every skill, the first three free', () => {
  const prompts = loadJustify(DATA, map);
  assert.deepEqual(checkJustify(prompts, { map }), []);
  for (const ch of map.chapters) {
    const n = prompts.filter(p => p.unit === ch.id).length, [lo, hi] = ch.part === 'course' ? JUSTIFY_PER_CHAPTER : JUSTIFY_PER_SKILLS_CHAPTER;
    assert.ok(n >= lo && n <= hi, `${ch.id}: ${n}`);
    if (ch.part === 'course') assert.ok(n >= 9 && n <= 11, `${ch.id}: about ten, ${n}`);
  }
  assert.equal(prompts.filter(p => p.unit === 'geo-skills').length, 3);
  for (const k of ['place', 'scale', 'explain', 'compare', 'degree', 'legend']) assert.ok(prompts.filter(p => p.skill === k).length >= 7, `${k}: about one a unit`);
  for (const p of prompts) { assert.ok(p.specific && Object.keys(p.specific.slots).length >= 2, `${p.id} has a builder`); assert.doesNotMatch(JSON.stringify(p), /—/, p.id); }
  assert.equal(FREE_JUSTIFY, 3);
  assert.equal(prompts[0].unit, 'geo-skills', 'course order: the skills chapter first');
});

test('Phase 3: the models page covers every CED-named model, each drawn, with a claim, assumptions, a limit and a dated example', () => {
  const es = modelEntries(DATA, map);
  const ids = es.map(e => e.id);
  for (const id of ['determinism-possibilism', 'dtm', 'epidemiological', 'malthus', 'ravenstein', 'diffusion', 'boundaries', 'centripetal-centrifugal', 'von-thunen', 'bid-rent', 'rank-size', 'gravity', 'central-place', 'burgess', 'hoyt', 'multiple-nuclei', 'galactic', 'latin-american', 'southeast-asian', 'african', 'least-cost', 'rostow', 'world-system', 'dependency', 'commodity-dependence', 'complementarity'])
    assert.ok(ids.includes(id), `models page lacks ${id}`);
  for (const e of es) {
    assert.ok(e.claim.length > 40 && e.assumes.length >= 1 && e.limit.length > 30, e.id);
    assert.match(e.example, /\b(1[5-9]\d\d|20\d\d)s?\b/, `${e.id}: the example carries a year`);
    assert.ok(e.key.length >= 2 && e.key.every(k => k.piece), `${e.id}: a numbered key`);
    assert.ok(e.figure || ['rings', 'sectors', 'stages', 'tiers'].includes(e.model.layout), `${e.id}: a picture`);
    for (const [id] of e.confuse) if (id) assert.ok(ids.includes(id), `${e.id} confuses with unknown ${id}`);
    assert.doesNotMatch(JSON.stringify([e.claim, e.limit, e.example, e.confuse]), /—|Griffin|McGee|de Blij/, e.id);
  }
  assert.ok(es.filter(e => e.confuse.some(([id]) => id)).length >= 15, 'the easy-to-confuse ones are flagged');
});

test('Phase 3 build: every form question is served with five options, the free unit tests show none of them, and models.html is built', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'aphug-p3-')), 'human-geography');
  execFileSync(process.execPath, ['scripts/build-aphug.mjs', '--out', out], { env: { ...process.env, APHUG_DATA: '', APHUG_PUBLISHED: map.chapters.map(c => c.id).join(',') } });
  const forms = JSON.parse(readFileSync(join(out, 'assets/exams/forms.json'), 'utf8'));
  const items = JSON.parse(readFileSync(join(out, 'assets/exams/items.json'), 'utf8'));
  assert.equal(forms.length, 2);
  const ids = forms.flatMap(f => f.mcq.flat());
  assert.equal(items.items.length, ids.length);
  for (const q of items.items) { assert.equal(q.options.length, 5, q.id); assert.equal(q.why.options.length, 5, q.id); if (q.stimulus) assert.ok(items.stimuli[q.stimulus], `${q.id}: stimulus served`); }
  const formSets = new Set(items.items.map(q => q.stimulus).filter(Boolean));
  for (const f of readdirSync(join(out, 'unit-tests'))) {
    const html = readFileSync(join(out, 'unit-tests', f), 'utf8');
    for (const id of ids) assert.doesNotMatch(html, new RegExp(`data-qid="${id}"`), `${f} shows ${id}`);
    for (const s of formSets) assert.doesNotMatch(html, new RegExp(`data-stim="${s}"|id="stim-${s}"`), `${f} shows set ${s}`);
    assert.doesNotMatch(html, /study summary/);
  }
  const m = readFileSync(join(out, 'models.html'), 'utf8');
  assert.match(m, /<h1>Models you must know<\/h1>/);
  assert.equal((m.match(/<section class="hug-mdl" id="m-/g) || []).length, modelEntries(DATA, map).length);
  assert.match(m, /Easy to confuse with/);
  assert.doesNotMatch(m.slice(m.indexOf('<body')), /—|Beta|score-calculator/);
  assert.match(m, /<title>Models You Must Know — AP® Human Geography \| LevlPrep<\/title>/, 'a title that is not cut');
  const j = JSON.parse(readFileSync(join(out, 'assets/justify.json'), 'utf8'));
  assert.equal(j.prompts.filter(p => p.free).length, 3);
  assert.ok(j.skills.legend);
});
