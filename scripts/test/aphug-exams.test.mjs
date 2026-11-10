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
     published, and a unit test and the formulas page once one is. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { loadMap } from '../lib/aphug-build.mjs';
import { Tex, Calc } from '../lib/aphug-mathlib.mjs';
import { checkForms, checkJustify, unitRange, MCQ_TOTAL, MCQ_PARTS, MCQ_OPTIONS, FRQ_PARTS, FRQ_POINTS, FRQ_TOTAL, FRQ_ORDER, FRQ_TYPES, FRQ_STIMULI, FRQ_LABELS, VERBS, EXAM_SETS, JUSTIFY_SKILLS } from '../lib/aphug-exams.mjs';
import { EQ, NOT_ON, TABLES, workedTex, workedValue, formulaCards } from '../lib/aphug-entry.mjs';

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
  assert.match(ex, /f\.fifth && f\.fifth\[q\.id\]/, 'a bank item gets its fifth option from the form');
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
  const bank = new Map(), orderOf = {}, stimuli = {};
  const forms = [1, 2].map(n => {
    const mcq = [];
    for (const [u, c] of Object.entries(counts)) {
      const topic = map.topics.find(t => t.chapter === u && t.kind === 'concept').id;
      let i = 0;
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
    const fifth = Object.fromEntries(mcq.flat().filter(id => bank.get(id).options.length === 4).map(id => [id, { text: 'e', why: 'Placeholder: the fifth option.' }]));
    return { id: `form-${n}`, title: `Practice exam ${n}`, mcq, fifth, frq: FRQ_ORDER.map(t => `frq-${t}-${n}`) };
  });
  const frqs = Object.fromEntries(forms.flatMap(f => f.frq.map(id => [id, { id, type: id.split('-')[1], units: ['unit-1'], points: 7 }])));
  return { forms, ctx: { map, bank, examItems: new Map(), frqs, orderOf: id => orderOf[id], stimuli: id => stimuli[id] } };
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
  bad(f => { delete f[0].fifth[f[0].mcq.find(b => b.length === 1)[0]]; }, /not a 5-option single-answer question/);
  bad(f => { for (const fm of f) fm.mcq = fm.mcq.filter(b => !(b.length === 3 && ctx.stimuli(ctx.bank.get(b[0]).stimulus).kind === 'map')); }, /map sets|Section I has/);
  const ctx4 = { ...ctx, frqs: { ...ctx.frqs, [forms[0].frq[0]]: { ...ctx.frqs[forms[0].frq[0]], points: 9 } } };
  bad(() => {}, /worth 9 points, not 7/, ctx4);
  const ctx5 = { ...ctx, bank: new Map(ctx.bank) };
  const one = forms[0].mcq.find(b => b.length === 1)[0];
  ctx5.bank.set(one, { ...ctx.bank.get(one), type: 'numeric' });
  bad(() => {}, /not a 5-option single-answer question/, ctx5);
  // A set is whole: a usable question of its stimulus left out is caught,
  // unless it is a lesson check item or not a single answer.
  const ctx6 = { ...ctx, bank: new Map(ctx.bank) };
  const set = forms[0].mcq.find(b => b.length === 3), stim = ctx.bank.get(set[0]).stimulus, extra = `${set[0]}-extra`;
  ctx6.bank.set(extra, { ...ctx.bank.get(set[0]), id: extra });
  bad(() => {}, new RegExp(`set ${stim} leaves out ${extra}`), ctx6);
  assert.deepEqual(checkForms(forms, { ...ctx6, lessonChecks: new Set([extra]) }), []);
});

test('the "Make it specific" checker refuses an explain with no link, a compare with one side, a degree not stated, a scale not named, and a slot without a why', () => {
  assert.deepEqual(Object.keys(JUSTIFY_SKILLS).sort(), ['compare', 'degree', 'describe', 'explain', 'limitation', 'model', 'place', 'scale']);
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
