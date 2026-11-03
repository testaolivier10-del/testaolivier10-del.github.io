/* AP® Macroeconomics practice exams, the "Make it specific" prompts and the
   graphs and formulas page (docs/apmacro-architecture.md, "Practice exams",
   "Make it specific", "Exams and entry pages"). Forked from AP® Psychology's
   Phase 0 tests, then Phase 3 (as AP® Precalculus's):
   - the exam config is May 2027's, the same in the page and the generator:
     Section I, 60 questions in 70 minutes (66%), five choices each;
     Section II, one long (10 points) then two short (5 points) in 60
     minutes with a 10-minute reading period (33%); a four-function
     calculator; no band, no score calculator; Friday 7 May 2027;
   - unit weight ranges come out right for 60 questions;
   - a good form passes and the checker catches each way a form can break
     (synthetic forms), and the two real forms pass every rule: standalone
     questions in course order, one question per stimulus, a fifth option
     for every bank question, the unit counts, the FRQ mix;
   - every exam-only number is recomputed with ApMacroCalc, every graph an
     exam-only key reads is checked with ApMacroGraph, and the runtime
     grader credits exactly the key;
   - the "Make it specific" prompts pass, about ten a unit, every skill, a
     builder on each that the grader credits exactly;
   - the formulas page: every row a real ApMacroCalc recipe with a worked
     line, the easy-to-forget ones flagged, the graphs and the balance sheet;
   - the generator serves nothing before a unit is published, and with every
     unit published the exams with five options, the prompts, the formula
     page and 12-question unit tests that share nothing with the exams. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { createBrowser } from './harness.mjs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { loadMap, trademarkProblems } from '../lib/apmacro-build.mjs';
import { Tex, Calc, Graph, Grade } from '../lib/apmacro-mathlib.mjs';
import { scanPage } from '../lib/apmacro-map.mjs';
import { loadExams, loadJustify, FREE_JUSTIFY, JUSTIFY_PER_CHAPTER, JUSTIFY_PER_SKILLS_CHAPTER, checkNumbers, checkForms, checkJustify, checkFifth, checkGraphs, examVersion, formUnits, unitRange, MCQ_OPTIONS, BANK_OPTIONS, EXAM_STIMULI, EXAM_ONLY, EXAM_GRAPHS, MCQ_TOTAL, MCQ_PARTS, FRQ_PARTS, FRQ_POINTS, FRQ_TOTAL, FRQ_ORDER, EXAM_SETS, JUSTIFY_SKILLS, EXAM_NUMBERS, JUSTIFY_NUMBERS, MCQ_WEIGHT, FRQ_WEIGHT, EXAM_DATE } from '../lib/apmacro-exams.mjs';
import { EQ, NOT_ON, TABLES, GRAPHS, BALANCE_SHEET, workedTex, workedValue, formulaCards } from '../lib/apmacro-entry.mjs';

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
   60 standalone questions by unit weight, each bank question with a fifth
   option, eight of them each with its own stimulus (3 data, 3 graph, 2
   scenario). */
function synth() {
  const counts = { 'unit-1': 4, 'unit-2': 9, 'unit-3': 13, 'unit-4': 12, 'unit-5': 15, 'unit-6': 7 };
  const KINDS = { 'unit-2': ['data', 'text'], 'unit-3': ['graph', 'data'], 'unit-4': ['graph'], 'unit-5': ['data', 'graph', 'text'] };
  const bank = new Map(), stimuli = {}, fifth = {};
  const forms = [1, 2].map(n => {
    const mcq = [];
    for (const [u, c] of Object.entries(counts)) {
      const topic = map.topics.find(t => t.chapter === u && t.kind === 'concept').id;
      for (let i = 0; i < c; i++) {
        const id = `mac-${topic}-${n * 100 + i}`, kind = (KINDS[u] || [])[i];
        const q = { id, type: 'single', unit: u, topic, practice: '1.A', q: 'What happens next?', options: ['a', 'b', 'c', 'd'], correct: 0, why: { correct: 'Because.', options: ['w', 'x', 'y', 'z'] } };
        if (kind) { q.stimulus = `${id}-s`; stimuli[q.stimulus] = { kind }; }
        bank.set(id, q); fifth[id] = { option: 'e', why: 'A fifth option, explained at some length.' };
        mcq.push([id]);
      }
    }
    return { id: `form-${n}`, title: `Practice exam ${n}`, mcq, frq: [`frq-long-${n}`, `frq-short-${n}-a`, `frq-short-${n}-b`] };
  });
  const frqs = {};
  forms.forEach((f, k) => f.frq.forEach((id, i) => { frqs[id] = { id, type: i ? 'short' : 'long', units: [`unit-${k * 3 + i + 1}`], points: i ? 5 : 10, parts: i ? [] : [{ type: 'graph' }] }; }));
  return { forms, ctx: { map, bank, examItems: new Map(), frqs, stimuli: id => stimuli[id], fifth } };
}

test('a form in the real format passes, and every way to break it is caught', () => {
  const { forms, ctx } = synth();
  assert.deepEqual(checkForms(forms, ctx), []);
  const clone = x => JSON.parse(JSON.stringify(x));
  const bad = (mut, re, c = ctx) => { const f = clone(forms); mut(f); const e = checkForms(f, c); assert.ok(e.some(x => re.test(x)), `${re}: ${e.join(' | ')}`); };
  bad(f => { f.pop(); }, /need at least 2 practice exams/);
  bad(f => { f[0].mcq.pop(); }, /Section I has 59 questions, not 60/);
  bad(f => { const b = f[0].mcq.splice(1, 1)[0]; f[0].mcq[0].push(...b); }, /stand alone, one a block/);
  bad(f => { f[0].mcq.push(f[0].mcq.shift()); }, /Section I runs in course order/);
  bad(f => { f[0].frq = f[0].frq.slice().reverse(); }, /Section II question 1 is a long question/);
  bad(f => { f[0].frq.pop(); }, /Section II has 2 questions, not 3/);
  bad(f => { f[1].mcq[0] = f[0].mcq[0]; }, /is also in form-1/);
  bad(f => { f[1].frq[0] = f[0].frq[0]; }, /FRQ .* is also in form-1/);
  bad(f => { const u5 = f[0].mcq.filter(b => ctx.bank.get(b[0]).unit === 'unit-5' && !ctx.bank.get(b[0]).stimulus).slice(0, 4); f[0].mcq = f[0].mcq.filter(b => !u5.includes(b)); f[0].mcq.splice(0, 0, ...f[1].mcq.filter(b => ctx.bank.get(b[0]).unit === 'unit-1').slice(0, 4)); }, /Unit 1 has 8 questions|Unit 5 has 11 questions/);
  const one = forms[0].mcq.find(b => !ctx.bank.get(b[0]).stimulus)[0];
  const noFifth = { ...ctx, fifth: { ...ctx.fifth } }; delete noFifth.fifth[one];
  bad(() => {}, /needs a fifth option/, noFifth);
  const numeric = { ...ctx, bank: new Map(ctx.bank) }; numeric.bank.set(one, { ...ctx.bank.get(one), type: 'numeric' });
  bad(() => {}, /not a single-answer question/, numeric);
  const leans = { ...ctx, bank: new Map(ctx.bank) }; leans.bank.set(one, { ...ctx.bank.get(one), q: 'Using the previous question, what changes?' });
  bad(() => {}, /leans on another question/, leans);
  const shared = { ...ctx, bank: new Map(ctx.bank) }; const s1 = forms[0].mcq.map(b => ctx.bank.get(b[0])).find(q => q.stimulus);
  shared.bank.set(one, { ...ctx.bank.get(one), stimulus: s1.stimulus });
  bad(() => {}, /shares stimulus .* a stimulus carries one question/, shared);
  bad(() => {}, /lesson check item/, { ...ctx, lessonChecks: new Set([one]) });
  const flat = { ...ctx, stimuli: id => ({ ...ctx.stimuli(id), kind: ctx.stimuli(id).kind === 'graph' ? 'data' : ctx.stimuli(id).kind }) };
  bad(() => {}, /questions with a graph stimulus; a form has 3 to 10/, flat);
  const noGraph = { ...ctx, frqs: { ...ctx.frqs, [forms[0].frq[0]]: { ...ctx.frqs[forms[0].frq[0]], parts: [] } } };
  bad(() => {}, /is the long question, so it has a graph part/, noGraph);
  const sameUnit = { ...ctx, frqs: { ...ctx.frqs, [forms[0].frq[2]]: { ...ctx.frqs[forms[0].frq[2]], units: ctx.frqs[forms[0].frq[1]].units } } };
  bad(() => {}, /both cover unit-2/, sameUnit);
  const ctx4 = { ...ctx, frqs: { ...ctx.frqs, [forms[0].frq[0]]: { ...ctx.frqs[forms[0].frq[0]], points: 9 } } };
  bad(() => {}, /worth 9 points, not 10/, ctx4);
  // An exam-only question has five options of its own and belongs to its form.
  const own = { id: 'mac-exam-2-01', type: 'single', unit: 'unit-1', topic: ctx.bank.get(forms[0].mcq[0][0]).topic, options: ['a', 'b', 'c', 'd', 'e'], correct: 0 };
  const withOwn = { ...ctx, examItems: new Map([[own.id, own]]) };
  bad(f => { f[0].mcq[0] = [own.id]; }, /exam-only item mac-exam-2-01 belongs to form-2/, withOwn);
  bad(f => { f[0].mcq[0] = [own.id]; }, /exam-only items \(8 to 16\)/, withOwn);
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
  // Phase 3: every formula the course computes, every unit, the easy-to-forget ones flagged.
  assert.ok(rows.length >= 25, `${rows.length} rows`);
  for (const r of ['opportunityCost', 'netExports', 'perCapita', 'growth', 'laborForce', 'cyclicalRate', 'mps', 'totalChange', 'requiredReserves', 'maxMoneyChange', 'budgetBalance', 'inverseRate', 'convert']) assert.ok(W[r] !== undefined, `a row for ${r}`);
  for (const u of [1, 2, 3, 4, 5, 6]) assert.ok(rows.some(r => r[4] === `Unit ${u}`), `Unit ${u} has a row`);
  for (const r of rows) assert.equal(r[4], `Unit ${map.topicById(r[5]).chapter.slice(5)}`, `${r[7]}: the unit of ${r[5]}`);
  const hot = rows.filter(r => r[9] === true).map(r => r[7]);
  for (const r of ['gapChange', 'taxMultiplier', 'realValue', 'unemploymentRate', 'cyclicalRate', 'maxMoneyChange', 'realRate', 'inverseRate']) assert.ok(hot.includes(r), `${r} is flagged easy to forget`);
  assert.ok(hot.length <= rows.length / 2, 'flags are for the few that cost the most');
  assert.deepEqual(GRAPHS.filter(g => g[3]).map(g => g[0]).sort(), ['forex', 'lf', 'money', 'reserves']);
  assert.ok(topics.has(BALANCE_SHEET.topic));
  const sum = a => a.reduce((n, x) => n + Number(x[1].replace(/,/g, '')), 0);
  assert.equal(sum(BALANCE_SHEET.assets), sum(BALANCE_SHEET.liabilities), 'the balance sheet balances');
  assert.equal(Calc.evaluate({ fn: 'requiredReserves', args: [1000, 0.1] }), Number(BALANCE_SHEET.assets[0][1]));
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
  assert.match(f, /<h2 id="eq-hot">Easy to forget<\/h2>/);
  assert.equal((f.match(/<span class="mac-eq-flag">Easy to forget<\/span>/g) || []).length, EQ.flatMap(s => s.rows).filter(r => r[9]).length + GRAPHS.filter(g => g[3]).length);
  assert.match(f, /<table class="mac-bs">/, 'the bank balance sheet, the ninth thing students draw');
  assert.doesNotMatch(f, /score-calculator|Statistics you must know/i);
});

test('with every unit published: the exams with five options, the prompts, the formula page and 12-question unit tests apart from the exams', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'apmacro-exams-')), 'macroeconomics');
  execFileSync(process.execPath, ['scripts/build-apmacro.mjs', '--out', out], { env: { ...process.env, APMACRO_DATA: '', APMACRO_PUBLISHED: map.chapters.map(c => c.id).join(',') }, maxBuffer: 1 << 26 });
  const forms = JSON.parse(readFileSync(join(out, 'assets/exams/forms.json'), 'utf8'));
  assert.deepEqual(forms.map(f => f.id), ['form-1', 'form-2']);
  const served = JSON.parse(readFileSync(join(out, 'assets/exams/items.json'), 'utf8'));
  assert.equal(served.items.length, 120, 'every question of both forms, as the exam serves it');
  assert.ok(served.items.every(q => q.options.length === 5 && q.why && q.why.correct && q.why.options.length === 5), 'five options, explained inline');
  const needs = new Set(served.items.map(q => q.stimulus).filter(Boolean));
  assert.deepEqual(Object.keys(served.stimuli).sort(), [...needs].sort(), 'each stimulus a question needs, and no other');
  assert.ok(Object.entries(served.stimuli).filter(([, st]) => st.kind === 'graph').every(([, st]) => /<svg class="mac-graph-svg"/.test(st.html)), 'graph stimuli drawn by ApMacroGraph');
  for (const q of served.items) for (const t of [q.q, ...q.options, q.why.correct, ...q.why.options]) assert.doesNotMatch(String(t).replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, ''), /\\(frac|times|text)\b/, `${q.id}: math rendered`);
  const j = JSON.parse(readFileSync(join(out, 'assets/justify.json'), 'utf8'));
  assert.deepEqual(j.skills, JUSTIFY_SKILLS);
  assert.equal(j.prompts.length, loadJustify('macroeconomics/data', map).length);
  assert.equal(j.prompts.filter(p => p.free).length, FREE_JUSTIFY);
  assert.ok(j.prompts.slice(0, FREE_JUSTIFY).every(p => p.free) && j.prompts.every(p => p.specific));
  const inForms = new Set(forms.flatMap(f => f.mcq.flat()));
  for (const u of units) {
    const html = readFileSync(join(out, `unit-tests/${u.id}.html`), 'utf8');
    const ids = [...html.matchAll(/data-qid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(ids.length, 12, `${u.id}: 12 questions`);
    assert.deepEqual(ids.filter(id => inForms.has(id) || /mac-exam-/.test(id)), [], `${u.id}: nothing from the practice exams`);
  }
  const eq = readFileSync(join(out, 'formula-sheet.html'), 'utf8');
  assert.equal((eq.match(/<th scope="row">/g) || []).length, EQ.flatMap(s => s.rows).length);
  for (const sl of [...eq.matchAll(/href="tools\/([a-z-]+)\.html"/g)].map(m => m[1])) assert.ok(existsSync(join(out, 'tools', `${sl}.html`)), `the page links only live trainers (${sl})`);
  const page = readFileSync(join(out, 'exams.html'), 'utf8');
  assert.doesNotMatch(page, /Beta|score-calculator|readiness/i, 'no Beta label, no score calculator, no band');
  assert.match(page, /has not yet been reviewed by an AP® Macroeconomics teacher/, "the review note stays");
});

/* Phase 3: the two real forms, their fifth options and exam-only items. */
const DATA = 'macroeconomics/data';
const ex = loadExams(DATA);
const bankR = new Map(), stimR = {};
for (const f of readdirSync(join(DATA, 'questions'))) { const j = JSON.parse(readFileSync(join(DATA, 'questions', f), 'utf8')); for (const q of j.items) bankR.set(q.id, q); Object.assign(stimR, j.stimuli || {}); }
const examItems = new Map(ex.items.map(q => [q.id, q]));
const frqsR = Object.fromEntries(readdirSync(join(DATA, 'frq')).map(f => JSON.parse(readFileSync(join(DATA, 'frq', f), 'utf8'))).map(f => [f.id, f]));
const checksR = new Set(readdirSync(join(DATA, 'lessons')).flatMap(f => JSON.parse(readFileSync(join(DATA, 'lessons', f), 'utf8')).check || []));
const rctx = { map, bank: bankR, examItems, frqs: frqsR, stimuli: id => ex.stimuli[id] || stimR[id], fifth: ex.fifth, lessonChecks: checksR };
const qOf = id => bankR.get(id) || examItems.get(id);

test('the two practice exams pass every assembly rule, in the May 2027 format', () => {
  assert.equal(MCQ_OPTIONS, 5, 'five choices (needs-author mcq-options)');
  assert.equal(BANK_OPTIONS, 4);
  assert.equal(ex.forms.length, 2);
  assert.deepEqual(checkForms(ex.forms, rctx), []);
  assert.deepEqual(checkFifth(ex.fifth, { bank: bankR, forms: ex.forms }), []);
  const pos = id => map.topics.findIndex(t => t.id === qOf(id).topic);
  for (const f of ex.forms) {
    const ids = f.mcq.flat();
    assert.equal(ids.length, 60);
    assert.ok(f.mcq.every(b => b.length === 1), `${f.id}: every question stands alone`);
    assert.deepEqual(units.map(u => ids.filter(id => qOf(id).unit === u.id).length), [5, 9, 13, 12, 14, 7], `${f.id}: units by weight`);
    const own = ids.filter(id => examItems.has(id));
    assert.equal(own.length, 10, `${f.id}: exam-only items`);
    assert.ok(own.every(id => id.startsWith(`mac-exam-${f.id.slice(5)}-`)));
    assert.ok(ids.every((id, i) => !i || pos(id) >= pos(ids[i - 1])), `${f.id}: course order`);
    assert.equal(ids.filter(id => checksR.has(id)).length, 0, `${f.id}: no lesson check item`);
    // Every question served with five options, the bank's key unchanged.
    for (const id of ids) {
      const q = examItems.get(id) || examVersion(bankR.get(id), ex.fifth);
      assert.equal(q.options.length, 5, id); assert.equal(q.why.options.length, 5, id);
      if (bankR.has(id)) { assert.equal(q.correct, bankR.get(id).correct); assert.deepEqual(q.options.slice(0, 4), bankR.get(id).options); }
    }
    const kinds = {}; for (const id of ids) { const st = rctx.stimuli(qOf(id).stimulus); if (st) kinds[st.kind] = (kinds[st.kind] || 0) + 1; }
    const n = Object.values(kinds).reduce((a, b) => a + b, 0);
    assert.ok(n >= EXAM_STIMULI[0] && n <= EXAM_STIMULI[1] && kinds.graph >= 3 && kinds.data >= 2, `${f.id}: stimulus questions ${JSON.stringify(kinds)}`);
    // Section II: long (with graph parts) then two short, no unit twice.
    assert.deepEqual(f.frq.map(id => frqsR[id].type), FRQ_ORDER);
    assert.ok(frqsR[f.frq[0]].parts.some(p => p.type === 'graph'));
    const us = f.frq.flatMap(id => frqsR[id].units); assert.equal(new Set(us).size, us.length, `${f.id}: FRQs cover different units`);
    assert.deepEqual(formUnits(f, rctx).sort(), units.map(u => u.id));
  }
  assert.deepEqual(ex.forms.map(f => f.frq), [['frq-recession-long', 'frq-real-nominal-short', 'frq-forex-short'], ['frq-phillips-long', 'frq-money-multiplier-short', 'frq-ppc-trade-short']]);
  const all = ex.forms.flatMap(f => f.mcq.flat());
  assert.equal(new Set(all).size, 120, 'no question in both forms');
  const stims = all.map(id => qOf(id).stimulus).filter(Boolean);
  assert.equal(new Set(stims).size, stims.length, 'no stimulus carries two questions');
  assert.equal(Object.keys(ex.fifth).length, 100, 'a fifth option for each of the 100 bank questions');
  assert.ok(ex.items.every(q => ex.forms.some(f => f.mcq.flat().includes(q.id))), 'every exam-only item is used');
});

test('the assembly check catches a broken real form', () => {
  const clone = x => JSON.parse(JSON.stringify(x));
  const bad = (mut, re) => { const f = clone(ex.forms); mut(f); const e = checkForms(f, rctx); assert.ok(e.some(x => re.test(x)), `${re}: ${e.join(' | ')}`); };
  bad(f => { f[0].mcq.reverse(); }, /course order/);
  bad(f => { const a = f[0].mcq.findIndex(b => b[0].startsWith('mac-exam-1-')); const j = f[1].mcq.findIndex(b => b[0].startsWith('mac-exam-2-')); f[1].mcq[j] = f[0].mcq[a]; }, /belongs to form-1/);
  bad(f => { f[1].frq[1] = f[0].frq[1]; }, /FRQ .* is also in form-1/);
  const fifth = { ...ex.fifth }; const id = Object.keys(fifth)[0]; delete fifth[id];
  assert.ok(checkForms(ex.forms, { ...rctx, fifth }).some(e => e.includes(`${id} needs a fifth option`)));
  const dup = { ...ex.fifth, [id]: { option: bankR.get(id).options[1], why: 'The same words as an option already there.' } };
  assert.ok(checkFifth(dup, { bank: bankR, forms: ex.forms }).some(e => /repeats an option/.test(e)));
});

/* The runtime grader (mac-questions.js) on every exam question as served:
   the key is graded right and every other option wrong. */
test('every exam-only number and graph is recomputed, and the runtime grader credits exactly the key', () => {
  const prompts = loadJustify(DATA, map);
  assert.deepEqual(checkNumbers(examItems, prompts), []);
  assert.deepEqual(checkGraphs(examItems, ex.stimuli), []);
  const numeric = ex.items.filter(q => /\d/.test(q.options[q.correct]));
  assert.deepEqual(numeric.map(q => q.id).filter(id => !EXAM_NUMBERS.some(n => n.id === id)), [], 'every numeric key is recomputed');
  assert.ok(ex.items.filter(q => q.stimulus && ex.stimuli[q.stimulus].kind === 'graph').every(q => EXAM_GRAPHS.some(g => g.id === q.id)), 'every graph read is checked');
  const B = createBrowser(); for (const f of ['mac-math.js', 'mac-calc.js', 'mac-graph.js', 'mac-grade.js']) B.load(`macroeconomics/assets/${f}`);
  const Q = B.load('macroeconomics/assets/mac-questions.js').ApMacroQuestions;
  for (const f of ex.forms) for (const id of f.mcq.flat()) {
    const q = examItems.get(id) || examVersion(bankR.get(id), ex.fifth);
    q.options.forEach((_, i) => assert.equal(Q.grade(q, i).correct, i === q.correct, `${id} option ${i}`));
  }
  // A key that no longer matches the math, and a graph that no longer shows the key, are caught.
  const m = new Map(examItems); const w = JSON.parse(JSON.stringify(m.get('mac-exam-1-05'))); w.options[w.correct] = '\\$200'; m.set(w.id, w);
  assert.ok(checkNumbers(m, prompts).some(e => /mac-exam-1-05/.test(e)));
  const st = JSON.parse(JSON.stringify(ex.stimuli)); st['exam-1-s6'].graph.show = { SLF: 1 };
  assert.ok(checkGraphs(examItems, st).some(e => /mac-exam-1-08/.test(e)));
  const st2 = JSON.parse(JSON.stringify(ex.stimuli)); st2['exam-2-s2'].graph.start = { AD: -1 };
  assert.ok(checkGraphs(examItems, st2).some(e => /mac-exam-2-03/.test(e)));
});

test('the "Make it specific" prompts pass: about ten a unit, every skill, a builder on each', () => {
  const prompts = loadJustify(DATA, map);
  assert.deepEqual(checkJustify(prompts, { map, trademarkProblems, scanPage }), []);
  assert.equal(prompts.length, 64);
  for (const u of map.chapters) { const n = prompts.filter(p => p.unit === u.id).length, [lo, hi] = u.part === 'course' ? JUSTIFY_PER_CHAPTER : JUSTIFY_PER_SKILLS_CHAPTER; assert.ok(n >= lo && n <= hi, `${u.id}: ${n}`); }
  for (const u of units) assert.equal(prompts.filter(p => p.unit === u.id).length, 10, u.id);
  for (const k of Object.keys(JUSTIFY_SKILLS)) assert.ok(prompts.some(p => p.skill === k), `a prompt for ${k}`);
  // The reader-report misses each have prompts: the chain, the tool, self-adjustment, the gap divided, the currency.
  for (const [k, n] of [['chain', 6], ['tool', 4], ['selfadjust', 3], ['multiplier', 2], ['currency', 4], ['graph', 10], ['calculate', 15]]) assert.ok(prompts.filter(p => p.skill === k).length >= n, `${k}: ${prompts.filter(p => p.skill === k).length}`);
  for (const p of prompts) {
    assert.ok(p.specific && Object.keys(p.specific.slots).length >= 2, `${p.id}: a builder`);
    for (const [k, sl] of Object.entries(p.specific.slots)) sl.options.forEach((_, i) => assert.ok(i === sl.correct || (sl.why[i] || '').length >= 20, `${p.id} ${k} option ${i} has a why`));
    const right = Object.fromEntries(Object.entries(p.specific.slots).map(([k, sl]) => [k, sl.correct]));
    assert.equal(Grade.specific(p.specific, right).correct, true, `${p.id}: the right picks are credited`);
    const [k0, s0] = Object.entries(p.specific.slots)[0];
    assert.equal(Grade.specific(p.specific, { ...right, [k0]: (s0.correct + 1) % s0.options.length }).correct, false, `${p.id}: a wrong pick is not`);
  }
  assert.ok(JUSTIFY_NUMBERS.length >= 15);
  for (const n of JUSTIFY_NUMBERS) assert.ok(prompts.some(p => p.id === n.id), `${n.id} exists`);
  const p = JSON.parse(JSON.stringify(prompts.find(x => x.id === 'u3-close-gap-spending')));
  p.earns.answer = p.earns.answer.replace('30 billion', '480 billion');
  assert.ok(checkNumbers(examItems, prompts.map(x => x.id === p.id ? p : x)).some(e => /u3-close-gap-spending/.test(e)));
});

test('timed sections: a fixed exam can run Section I or Section II alone (?section=1|2)', () => {
  const ex = readFileSync('macroeconomics/assets/pages/exams.js', 'utf8');
  assert.match(ex, /p\.get\('section'\) === '1' \|\| p\.get\('section'\) === '2'/);
  assert.match(ex, /startExam\(sec === '2' \? \[\] : qs, sec === '1' \? \[\] : r\[1\]/);
  assert.match(ex, /if\(!mcqParts\.length && frqParts\.length\) return startSectionTwo\(0\);/);
});
