/* AP® Macroeconomics practice exams, the "Make it specific" checker and the
   graphs and formulas page (docs/apmacro-architecture.md, "Practice exams",
   "Make it specific", "Exams and entry pages"). Forked from AP® Psychology's
   Phase 0 tests:
   - the exam config is May 2027's, the same in the page and the generator:
     Section I, 60 questions in 70 minutes (66%); Section II, one long (10
     points) then two short (5 points) in 60 minutes with a 10-minute reading
     period (33%); a four-function calculator; no band, no score calculator;
     Friday 7 May 2027 in the cram kit and the shared exam date;
   - unit weight ranges come out right for 60 questions;
   - a good form passes and the checker catches each way a form can break,
     including the set kinds and the long-short-short order (synthetic forms);
   - the "Make it specific" checker refuses a chain without its links,
     self-adjustment without SRAS, a gap that is not divided, and a builder
     slot without a why;
   - the formulas page uses only ApMacroCalc recipes, each row with a worked
     line ApMacroCalc computes, each row a card in the "Formulas" deck, and
     the nine graphs drawn by ApMacroGraph;
   - the generator serves no forms and no unit tests before anything is
     published, and a unit test and the formulas page once one is.
   The real forms and prompts arrive in Phase 3 (their tests then). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { loadMap } from '../lib/apmacro-build.mjs';
import { Tex, Calc, Graph } from '../lib/apmacro-mathlib.mjs';
import { loadExams, loadJustify, FREE_JUSTIFY, JUSTIFY_PER_CHAPTER, checkNumbers, checkForms, checkJustify, unitRange, MCQ_TOTAL, MCQ_PARTS, FRQ_PARTS, FRQ_POINTS, FRQ_TOTAL, FRQ_ORDER, EXAM_SETS, JUSTIFY_SKILLS, EXAM_NUMBERS, JUSTIFY_NUMBERS, MCQ_WEIGHT, FRQ_WEIGHT, EXAM_DATE } from '../lib/apmacro-exams.mjs';
import { EQ, NOT_ON, TABLES, GRAPHS, workedTex, workedValue, formulaCards } from '../lib/apmacro-entry.mjs';

const map = loadMap();
const units = map.chapters.filter(c => c.part === 'course');

test('the exam config is May 2027\'s, the same in the page, the cram kit and the generator', () => {
  const ex = readFileSync('macroeconomics/assets/pages/exams.js', 'utf8');
  assert.match(ex, /var MCQ_PARTS = \[\{ key: '', n: 60, sec: 70 \* 60, calc: false \}\];/);
  assert.match(ex, /var FRQ_PARTS = \[\{ key: '', n: 3, sec: 60 \* 60, calc: false, types: \['long', 'short', 'short'\] \}\];/);
  assert.match(ex, /var FRQ_POINTS = \{ long: 10, short: 5 \};/);
  assert.match(ex, /var WEIGHTS = \{ mcq: 66, frq: 33 \};/);
  assert.match(ex, /var FRQ_READING_MIN = 10;/);
  assert.deepEqual(MCQ_PARTS.map(p => [p.n, p.minutes]), [[60, 70]]);
  assert.deepEqual(FRQ_PARTS.map(p => [p.n, p.minutes, p.readingMinutes]), [[3, 60, 10]]);
  assert.equal(MCQ_TOTAL, 60); assert.equal(FRQ_TOTAL, 3);
  assert.deepEqual({ ...FRQ_POINTS }, { long: 10, short: 5 });
  assert.deepEqual(FRQ_ORDER, ['long', 'short', 'short']);
  assert.deepEqual([MCQ_WEIGHT, FRQ_WEIGHT], [66, 33]);
  assert.equal(EXAM_DATE, '2027-05-07');
  assert.deepEqual(Object.keys(EXAM_SETS), ['data', 'graph', 'text']);
  assert.match(ex, /Four-function calculator only\./);
  assert.doesNotMatch(ex, /No calculator\.|function band\(|readiness estimate|score-calculator|Article Analysis|Evidence-Based/i, 'no band, no score calculator, nothing of AP® Psychology');
  for (const fn of ['startExam', 'startSectionOne', 'endSectionOne', 'startSectionTwo', 'endFrqPart', 'selfScore', 'calcNotice', 'pickFrqs']) assert.match(ex, new RegExp(`function ${fn}\\(`));
  assert.match(ex, /Section I only \(60 questions, 70 min\)/);
  assert.match(ex, /Section II only \(3 questions, 60 min\)/);
  assert.ok(!existsSync('macroeconomics/assets/pages/score.js'));
  assert.match(readFileSync('macroeconomics/assets/pages/cram.js', 'utf8'), /var DEFAULT_EXAM = '2027-05-07';/, 'Friday 7 May 2027');
  assert.match(readFileSync('assets/exam-date.js', 'utf8'), /apmacro: \{ date: '2027-05-07'/);
  assert.match(readFileSync('macroeconomics/assets/pages/frq-kit.js', 'utf8'), /var TYPES = \{ long: 'Long free-response question', short: 'Short free-response question' \};/);
});

test('unit weight ranges for 60 questions match the course framework', () => {
  assert.deepEqual(unitRange([5, 10]), [3, 6]);
  assert.deepEqual(unitRange([20, 30]), [12, 18]);
  const lo = units.reduce((s, u) => s + unitRange(u.weight)[0], 0), hi = units.reduce((s, u) => s + unitRange(u.weight)[1], 0);
  assert.ok(lo <= 60 && hi >= 60, `${lo}..${hi}`);
  assert.ok(!map.practicesConfirmed, 'practice weights are not published (needs-author)');
});

/* A synthetic bank and two forms that pass, so each rule can be broken once:
   60 questions by unit weight, 2 data, 2 graph and 1 scenario set of 3. */
function synth() {
  const counts = { 'unit-1': 4, 'unit-2': 9, 'unit-3': 13, 'unit-4': 12, 'unit-5': 15, 'unit-6': 7 };
  const SETS = { 'unit-2': ['data'], 'unit-3': ['graph', 'text'], 'unit-4': ['graph'], 'unit-5': ['data'] };
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
          const id = `mac-${topic}-${n * 100 + i}`;
          bank.set(id, { id, type: 'single', unit: u, topic, practice: '1.A', options: ['a', 'b', 'c', 'd'], correct: 0, stimulus: stim });
          orderOf[id] = i; block.push(id);
        }
        mcq.push(block);
      }
      for (; i < c; i++) {
        const id = `mac-${topic}-${n * 100 + i}`;
        bank.set(id, { id, type: 'single', unit: u, topic, practice: '1.A', options: ['a', 'b', 'c', 'd'], correct: 0 });
        orderOf[id] = i; mcq.push([id]);
      }
    }
    return { id: `form-${n}`, title: `Practice exam ${n}`, mcq, frq: FRQ_ORDER.map(t => `frq-${t}-${n}`) };
  });
    // (ids made unique per position: long, short, short)
  forms.forEach(f => { f.frq = f.frq.map((id, i) => `${id}-${i}`); });
  const frqs = Object.fromEntries(forms.flatMap(f => f.frq.map(id => [id, { id, type: id.split('-')[1], units: ['unit-1'], points: FRQ_POINTS[id.split('-')[1]] }])));
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
  bad(f => { f[0].frq = f[0].frq.slice().reverse(); }, /Section II question 1 is a long question/);
  bad(f => { f[0].frq.pop(); }, /Section II has 2 questions, not 3/);
  bad(f => { f[1].mcq[0] = f[0].mcq[0]; }, /is also in form-1/);
  bad(f => { f[1].frq[0] = f[0].frq[0]; }, /FRQ .* is also in form-1/);
  bad(f => { const ones = f[0].mcq.filter(b => b.length === 1 && ctx.bank.get(b[0]).unit === 'unit-5'); f[0].mcq = f[0].mcq.filter(b => !ones.slice(0, 5).includes(b)); f[0].mcq.push(...f[1].mcq.filter(b => b.length === 1 && ctx.bank.get(b[0]).unit === 'unit-1').slice(0, 4), f[1].mcq.find(b => b.length === 1 && ctx.bank.get(b[0]).unit === 'unit-2')); }, /Unit 5 has 10 questions|Unit 1 has 8 questions/);
  bad(f => { for (const fm of f) fm.mcq = fm.mcq.flatMap(b => b.length === 3 && ctx.stimuli(ctx.bank.get(b[0]).stimulus).kind === 'text' ? [b, ...Array.from({ length: 5 }, () => b)] : [b]); }, /text sets|Section I has/);
  const ctx4 = { ...ctx, frqs: { ...ctx.frqs, [forms[0].frq[0]]: { ...ctx.frqs[forms[0].frq[0]], points: 9 } } };
  bad(() => {}, /worth 9 points, not 10/, ctx4);
  const ctx5 = { ...ctx, bank: new Map(ctx.bank) };
  const one = forms[0].mcq.find(b => b.length === 1)[0];
  ctx5.bank.set(one, { ...ctx.bank.get(one), type: 'numeric' });
  bad(() => {}, /not a 4-option single-answer question/, ctx5);
  // A set is whole: a usable question of its stimulus left out is caught,
  // unless it is a lesson check item or not a four-option single answer.
  const ctx6 = { ...ctx, bank: new Map(ctx.bank) };
  const set = forms[0].mcq.find(b => b.length === 3), stim = ctx.bank.get(set[0]).stimulus, extra = `${set[0]}-extra`;
  ctx6.bank.set(extra, { ...ctx.bank.get(set[0]), id: extra });
  bad(() => {}, new RegExp(`set ${stim} leaves out ${extra}`), ctx6);
  assert.deepEqual(checkForms(forms, { ...ctx6, lessonChecks: new Set([extra]) }), []);
  ctx6.bank.set(extra, { ...ctx.bank.get(set[0]), id: extra, type: 'numeric', options: undefined });
  assert.deepEqual(checkForms(forms, ctx6), []);
  bad(f => { const b = f[0].mcq.find(x => x.length === 3); b.pop(); }, /leaves out/);
});

test('the "Make it specific" checker refuses a chain without links, self-adjustment without SRAS, an undivided gap, and a slot without a why', () => {
  assert.deepEqual(Object.keys(JUSTIFY_SKILLS).sort(), ['calculate', 'chain', 'currency', 'graph', 'identify', 'multiplier', 'selfadjust', 'tool']);
  const topic = map.topics.find(t => t.id === 'monetary-policy');
  const p = {
    id: 'u4-ample-chain', unit: 'unit-4', topic: topic.id, practice: '2.B', skill: 'chain', title: 'Lowering the policy rate',
    prompt: '<b>Explain</b> how lowering the interest on reserves affects real output in the short run.',
    checklist: ['Names the policy rate falling as the first link', 'Links lower rates to more investment and AD, then to output'],
    earns: { answer: 'Lower interest on reserves lowers the policy rate, which lowers other interest rates, so investment rises, which raises aggregate demand, so real output rises.', why: 'Every link from the tool to output is named in order.' },
    misses: { answer: 'Lower interest on reserves makes real output rise.', why: 'It gives the conclusion without the links between the tool and output.' },
  };
  assert.deepEqual(checkJustify([p], { map }), []);
  const q = JSON.parse(JSON.stringify(p)); q.earns.answer = 'Lower interest on reserves helps the economy grow over the next year or two in the short run overall.';
  assert.ok(checkJustify([q], { map }).some(e => /at least three links/.test(e)));
  const t3 = map.topics.find(t => t.id === 'long-run-self-adjustment');
  const sa = { ...JSON.parse(JSON.stringify(p)), id: 'u3-gap-selfadjust', unit: 'unit-3', topic: t3.id, skill: 'selfadjust' };
  sa.earns.answer = 'In a recessionary gap unemployment is high, so over time the economy returns to full employment on its own path.';
  assert.ok(checkJustify([sa], { map }).some(x => /names SRAS shifting/.test(x)));
  const mu = { ...JSON.parse(JSON.stringify(sa)), id: 'u3-gap-multiplier', skill: 'multiplier', topic: 'multipliers' };
  mu.earns.answer = 'The gap is 100 and the multiplier is 4, so spending must rise by 400 to close the recessionary gap entirely.';
  assert.ok(checkJustify([mu], { map }).some(x => /divides the gap/.test(x)));
  const b = { ...JSON.parse(JSON.stringify(p)), id: 'u4-ample-builder', specific: { slots: { rate: { label: 'The rate', options: ['falls', 'rises'], correct: 0 }, spending: { label: 'Investment', options: ['rises', 'falls'], correct: 0, why: { 1: 'Placeholder: lower rates make borrowing cheaper.' } } } } };
  assert.ok(checkJustify([b], { map }).some(x => /slot rate option 2 needs a why/.test(x)));
  const t = JSON.parse(JSON.stringify(p)); t.earns.answer += ' AP Macro students know this.';
  assert.ok(checkJustify([t], { map, trademarkProblems: s => /AP Macro/.test(s) ? ['AP Macro'] : [] }).some(x => /trademark/.test(x)));
  const g = { ...JSON.parse(JSON.stringify(p)), id: 'gs-shift-graph', unit: 'graph-skills', topic: 'shifts-movements', skill: 'graph' };
  assert.deepEqual(checkJustify([g], { map }).filter(e => /id must/.test(e)), [], 'gs- ids in the graph skills chapter');
});

test('the formulas page: every row a real ApMacroCalc recipe with a worked line, a flashcard each, and the nine graphs', () => {
  const rows = EQ.flatMap(s => s.rows);
  const topics = new Set(map.topics.map(t => t.id));
  const tools = new Set(JSON.parse(readFileSync('macroeconomics/data/pages.json', 'utf8')).tools.map(t => t.slug));
  for (const r of rows) {
    assert.equal(Tex.check(`$${r[0]}$`).length, 0, r[0]);
    for (const t of [r[1], r[2], r[3]]) assert.doesNotMatch(t, /[\x00-\x08]|—/, t);
    assert.match(r[4], /^Unit [1-6]$/);
    assert.ok(topics.has(r[5]), r[5]);
    for (const s of r[6]) assert.ok(tools.has(s), s);
    assert.ok(Calc.FNS.includes(r[7]) && typeof Calc[r[7]] === 'function', `recipe ${r[7]}`);
    assert.ok(Array.isArray(r[8]) && Number.isFinite(workedValue(r[8])), `worked line for ${r[7]}`);
    assert.equal(Tex.check(`$${workedTex(r[8])}$`).length, 0, workedTex(r[8]));
  }
  const W = Object.fromEntries(rows.map(r => [r[7], workedValue(r[8])]));
  assert.deepEqual([W.gdp, W.cpi, W.inflation, W.deflator, W.realValue, W.unemploymentRate, W.spendingMultiplier, W.taxMultiplier, W.gapChange, W.moneyMultiplier, W.realRate, W.excessReserves, W.velocity], [830, 110, 10, 120, 1000, 5, 5, -4, 25, 10, 4, 100, 4]);
  const cards = formulaCards();
  assert.equal(cards.length, rows.length);
  assert.equal(new Set(cards.map(c => c.id)).size, cards.length);
  for (const c of cards) { assert.match(c.id, /^eq:[a-zA-Z0-9]+$/); assert.match(c.formula, /<math/); assert.match(c.worked, /<math/); }
  assert.deepEqual(GRAPHS.map(g => g[0]).sort(), Object.keys(Graph.KINDS).sort(), 'every graph kind is on the page');
  for (const g of GRAPHS) assert.ok(topics.has(g[1]), g[0]);
  for (const r of NOT_ON) assert.ok(topics.has(r[2]), r[0]);
  assert.ok(TABLES.some(t => /Four-function calculator/.test(t[0])) && TABLES.some(t => /No formula sheet/.test(t[0])));
});

test('the generator serves nothing before a unit is published, and a unit test and the formulas page once one is', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'apmacro-exams-')), 'macroeconomics');
  execFileSync(process.execPath, ['scripts/build-apmacro.mjs', '--out', out], { env: { ...process.env, APMACRO_DATA: '', APMACRO_PUBLISHED: '' } });
  assert.deepEqual(JSON.parse(readFileSync(join(out, 'assets/exams/forms.json'), 'utf8')), []);
  assert.equal(existsSync(join(out, 'unit-tests')), false);
  assert.equal(existsSync(join(out, 'score-calculator.html')), false);
  const out2 = join(mkdtempSync(join(tmpdir(), 'apmacro-exams-')), 'macroeconomics');
  execFileSync(process.execPath, ['scripts/build-apmacro.mjs', '--out', out2], { env: { ...process.env, APMACRO_DATA: 'scripts/test/fixtures/apmacro-data', APMACRO_PUBLISHED: 'unit-3' } });
  const html = readFileSync(join(out2, 'unit-tests/unit-3.html'), 'utf8');
  assert.ok((html.match(/<div class="mac-q" data-qid=/g) || []).length >= 4, 'a sample of the unit\'s questions');
  assert.match(html, /<details class="mac-q-key">/, 'answers readable without JavaScript');
  const f = readFileSync(join(out2, 'formula-sheet.html'), 'utf8');
  assert.match(f, /<h1>Graphs and formulas you must know<\/h1>/);
  assert.equal((f.match(/<th scope="row">/g) || []).length, EQ.flatMap(s => s.rows).length);
  assert.equal((f.match(/<svg class="mac-graph-svg"/g) || []).length, GRAPHS.length, 'the graphs drawn at build time');
  assert.match(f, /Four-function calculator/);
  assert.doesNotMatch(f, /score-calculator|Statistics you must know/i);
});

test('Phase 3 fills the recomputed numbers; until then the lists are empty and the checks pass on nothing', () => {
  assert.deepEqual([EXAM_NUMBERS.length, JUSTIFY_NUMBERS.length], [0, 0]);
  assert.deepEqual(checkNumbers(new Map(), []), []);
  assert.deepEqual(loadExams('scripts/test/fixtures/apmacro-data').forms, []);
  assert.deepEqual(loadJustify('scripts/test/fixtures/apmacro-data', map), []);
});

test('timed sections: a fixed exam can run Section I or Section II alone (?section=1|2)', () => {
  const ex = readFileSync('macroeconomics/assets/pages/exams.js', 'utf8');
  assert.match(ex, /p\.get\('section'\) === '1' \|\| p\.get\('section'\) === '2'/);
  assert.match(ex, /startExam\(sec === '2' \? \[\] : qs, sec === '1' \? \[\] : r\[1\]/);
  assert.match(ex, /if\(!mcqParts\.length && frqParts\.length\) return startSectionTwo\(0\);/);
});
