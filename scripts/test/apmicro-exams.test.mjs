/* AP® Microeconomics practice exams, the "Make it specific" prompts and the
   graphs and formulas page (docs/apmicro-architecture.md, "Practice exams",
   "Make it specific", "Exams and entry pages"). Forked from AP® Macroeconomics's
   tests, then Phase 3 (as AP® Macroeconomics's):
   - the exam config is May 2027's, the same in the page and the generator:
     Section I, 60 questions in 70 minutes (66%), five choices on forms (four
     in the bank); Section II, one long (10 points) then two short (5 points)
     in 60 minutes with a 10-minute reading period (33%); a four-function
     calculator; no band, no score calculator; Tuesday 4 May 2027;
   - unit weight ranges come out right for 60 questions;
   - a good form passes and the checker catches each way a form can break
     (synthetic forms), and the two real forms pass every rule: standalone
     questions in course order, one question per stimulus, a fifth option
     for every bank question, the unit counts, graph-reading and payoff-matrix
     questions in each form, the FRQ mix;
   - every exam-only number is recomputed with ApMicroCalc, every graph read
     checked with ApMicroGraph and every matrix read with ApMicroMatrix, and
     the runtime grader credits exactly the key;
   - the "Make it specific" checker refuses each reader-report miss, and the
     64 prompts pass, about ten a unit, every skill, a builder on each;
   - the formulas page: every row a real ApMicroCalc recipe with a worked
     line, the easy-to-forget ones flagged, the graphs and the payoff matrix;
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
import { loadMap, trademarkProblems } from '../lib/apmicro-build.mjs';
import { scanPage } from '../lib/apmicro-map.mjs';
import { Tex, Calc, Graph, Matrix, Grade } from '../lib/apmicro-mathlib.mjs';
import { loadExams, loadJustify, FREE_JUSTIFY, JUSTIFY_PER_CHAPTER, JUSTIFY_PER_SKILLS_CHAPTER, checkForms, checkJustify, checkGraphs, checkMatrices, checkNumbers, checkFifth, examVersion, fifthAt, formUnits, EXAM_STIMULI, EXAM_MATRICES, unitRange, MCQ_OPTIONS, BANK_OPTIONS, MCQ_TOTAL, MCQ_PARTS, FRQ_PARTS, FRQ_POINTS, FRQ_TOTAL, FRQ_ORDER, EXAM_SETS, JUSTIFY_SKILLS, EXAM_NUMBERS, EXAM_GRAPHS, JUSTIFY_NUMBERS, MCQ_WEIGHT, FRQ_WEIGHT, EXAM_DATE } from '../lib/apmicro-exams.mjs';
import { EQ, NOT_ON, TABLES, GRAPHS, MATRIX_CARD, workedTex, workedValue, formulaCards } from '../lib/apmicro-entry.mjs';

const map = loadMap();
const units = map.chapters.filter(c => c.part === 'course');

test('the exam config is May 2027\'s, the same in the page, the cram kit and the generator', () => {
  const ex = readFileSync('microeconomics/assets/pages/exams.js', 'utf8');
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
  assert.equal(EXAM_DATE, '2027-05-04');
  assert.deepEqual(Object.keys(EXAM_SETS), ['data', 'graph', 'text']);
  assert.match(ex, /Four-function calculator only\./);
  assert.doesNotMatch(ex, /No calculator\.|function band\(|readiness estimate|score-calculator|Article Analysis|Evidence-Based/i, 'no band, no score calculator, nothing of AP® Psychology');
  for (const fn of ['startExam', 'startSectionOne', 'endSectionOne', 'startSectionTwo', 'endFrqPart', 'selfScore', 'calcNotice', 'pickFrqs']) assert.match(ex, new RegExp(`function ${fn}\\(`));
  assert.match(ex, /Section I only \(60 questions, 70 min\)/);
  assert.match(ex, /Section II only \(3 questions, 60 min\)/);
  assert.ok(!existsSync('microeconomics/assets/pages/score.js'));
  assert.match(readFileSync('microeconomics/assets/pages/cram.js', 'utf8'), /var DEFAULT_EXAM = '2027-05-04';/, 'Tuesday 4 May 2027');
  assert.match(readFileSync('assets/exam-date.js', 'utf8'), /apmicro: \{ date: '2027-05-04'/);
  assert.match(readFileSync('microeconomics/assets/pages/frq-kit.js', 'utf8'), /var TYPES = \{ long: 'Long free-response question', short: 'Short free-response question' \};/);
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
  const counts = { 'unit-1': 8, 'unit-2': 14, 'unit-3': 14, 'unit-4': 11, 'unit-5': 7, 'unit-6': 6 };
  const KINDS = { 'unit-2': ['data', 'graph', 'text'], 'unit-3': ['graph', 'data'], 'unit-4': ['graph', 'data'], 'unit-5': ['text'] };
  const bank = new Map(), stimuli = {}, fifth = {};
  const forms = [1, 2].map(n => {
    const mcq = [];
    for (const [u, c] of Object.entries(counts)) {
      const topic = map.topics.find(t => t.chapter === u && t.kind === 'concept').id;
      for (let i = 0; i < c; i++) {
        const id = `mic-${topic}-${n * 100 + i}`, kind = (KINDS[u] || [])[i];
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
  bad(f => { const u3 = f[0].mcq.filter(b => ctx.bank.get(b[0]).unit === 'unit-3' && !ctx.bank.get(b[0]).stimulus).slice(0, 4); f[0].mcq = f[0].mcq.filter(b => !u3.includes(b)); f[0].mcq.splice(0, 0, ...f[1].mcq.filter(b => ctx.bank.get(b[0]).unit === 'unit-1').slice(0, 4)); }, /Unit 1 has 12 questions|Unit 3 has 10 questions/);
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
  const own = { id: 'mic-exam-2-01', type: 'single', unit: 'unit-1', topic: ctx.bank.get(forms[0].mcq[0][0]).topic, options: ['a', 'b', 'c', 'd', 'e'], correct: 0 };
  const withOwn = { ...ctx, examItems: new Map([[own.id, own]]) };
  bad(f => { f[0].mcq[0] = [own.id]; }, /exam-only item mic-exam-2-01 belongs to form-2/, withOwn);
  bad(f => { f[0].mcq[0] = [own.id]; }, /exam-only items \(8 to 16\)/, withOwn);
});

test('the "Make it specific" checker refuses a long-run chain without entry, a hire without MRP, one comparison, a price off MR, and a slot without a why', () => {
  assert.deepEqual(Object.keys(JUSTIFY_SKILLS).sort(), ['area', 'calculate', 'compare', 'derived', 'efficiency', 'graph', 'identify', 'longrun', 'marginal', 'price']);
  const p = {
    id: 'u3-loss-longrun', unit: 'unit-3', topic: 'perfect-competition', practice: '2.B', skill: 'longrun', title: 'Losses in a competitive market',
    prompt: '<b>Explain</b> what happens to the market price in the long run when firms in a perfectly competitive market are making losses.',
    checklist: ['Names firms exiting because of the losses', 'Links exit to market supply falling and price rising to minimum ATC'],
    earns: { answer: 'Losses cause some firms to exit, which shifts market supply to the left, so the price rises until it equals minimum ATC and economic profit is zero.', why: 'Every link from the loss to the new price is named in order.' },
    misses: { answer: 'Firms are making losses so the price rises in the long run.', why: 'It gives the conclusion without exit and the supply shift between them.' },
  };
  assert.deepEqual(checkJustify([p], { map }), []);
  const clone = x => JSON.parse(JSON.stringify(x));
  const q = clone(p); q.earns.answer = 'Losses mean the market is not stable, and over time the price will be higher than it is today for all of these firms.';
  assert.ok(checkJustify([q], { map }).some(e => /at least three links/.test(e)));
  const q2 = clone(p); q2.earns.answer = 'Losses shift market supply to the left, which raises the price, so the price rises until it equals minimum ATC and profit is zero.';
  assert.ok(checkJustify([q2], { map }).some(e => /names entry or exit/.test(e)));
  const d = { ...clone(p), id: 'u5-derived-chain', unit: 'unit-5', topic: 'competitive-factor-markets', skill: 'derived' };
  d.earns.answer = 'Higher demand for bread raises its price, which raises the value of each worker, so labor demand shifts right and the firm hires more workers.';
  assert.ok(checkJustify([d], { map }).some(e => /names MRP/.test(e)));
  const c = { ...clone(p), id: 'u4-dominant-compare', unit: 'unit-4', topic: 'oligopoly-game-theory', skill: 'compare' };
  c.earns.answer = 'Firm A has a dominant strategy of a low price, because 40 > 20 when Firm B picks a low price, so Firm A always picks it.';
  assert.ok(checkJustify([c], { map }).some(e => /both comparisons/.test(e)));
  c.earns.answer = 'Firm A has a dominant strategy of a low price: 40 > 20 when Firm B picks a low price, and 70 > 50 when Firm B picks a high price.';
  assert.deepEqual(checkJustify([c], { map }), []);
  const pr = { ...clone(p), id: 'u4-monopoly-price', unit: 'unit-4', topic: 'monopoly', skill: 'price' };
  pr.earns.answer = 'The monopolist produces where MR = MC at 40 units and charges the price where MR equals 12 dollars at that quantity, the profit-maximizing price.';
  assert.ok(checkJustify([pr], { map }).some(e => /read from the demand curve/.test(e)));
  const mg = { ...clone(p), id: 'u3-profit-marginal', unit: 'unit-3', topic: 'profit-maximization', skill: 'marginal' };
  mg.earns.answer = 'The firm should produce 6 units, because that is where its total profit is the largest of every output level shown in the table.';
  assert.ok(checkJustify([mg], { map }).some(e => /states the rule/.test(e)));
  const b = { ...clone(p), id: 'u3-loss-builder', specific: { slots: { exit: { label: 'Firms', options: ['exit', 'enter'], correct: 0 }, supply: { label: 'Market supply', options: ['falls', 'rises'], correct: 0, why: { 1: 'Placeholder: exit lowers market supply.' } } } } };
  assert.ok(checkJustify([b], { map }).some(x => /slot exit option 2 needs a why/.test(x)));
  const t = clone(p); t.earns.answer += ' AP Micro students know this.';
  assert.ok(checkJustify([t], { map, trademarkProblems: s => /AP Micro/.test(s) ? ['AP Micro'] : [] }).some(x => /trademark/.test(x)));
  const g = { ...clone(p), id: 'gs-shift-graph', unit: 'graph-skills', topic: 'shifts-movements', skill: 'graph' };
  assert.deepEqual(checkJustify([g], { map }).filter(e => /id must/.test(e)), [], 'gs- ids in the graph skills chapter');
});

test('the formulas page: every row a real ApMicroCalc recipe with a worked line, a flashcard each, the graphs and the payoff matrix', () => {
  const rows = EQ.flatMap(s => s.rows);
  const topics = new Set(map.topics.map(t => t.id));
  const tools = new Set(JSON.parse(readFileSync('microeconomics/data/pages.json', 'utf8')).tools.map(t => t.slug));
  for (const r of rows) {
    assert.equal(Tex.check(`$${r[0]}$`).length, 0, r[0]);
    for (const t of [r[1], r[2], r[3]]) assert.doesNotMatch(t, /[\x00-\x08]|—/, t);
    assert.match(r[4], /^Unit [1-6]$/);
    assert.ok(topics.has(r[5]), r[5]);
    for (const s of r[6]) assert.ok(tools.has(s), s);
    assert.ok(Calc.FNS.includes(r[7]) && typeof Calc[r[7]] === 'function', `recipe ${r[7]}`);
    assert.ok(Array.isArray(r[8]) && Number.isFinite(workedValue(r[8])), `worked line for ${r[7]}`);
    assert.equal(Tex.check(`$${workedTex(r[8])}$`).length, 0, workedTex(r[8]));
    assert.equal(r[4], `Unit ${map.topicById(r[5]).chapter.slice(5)}`, `${r[7]}: the unit of ${r[5]}`);
  }
  const W = Object.fromEntries(rows.map(r => [r[7], workedValue(r[8])]));
  assert.deepEqual([W.opportunityCost, W.priceElasticity, W.totalRevenue, W.consumerSurplus, W.taxRevenue, W.dwl, W.marginalCost, W.atc, W.afc, W.mrp, W.wageBill], [2, 2, 400, 80, 80, 20, 6, 12, 4, 40, 360]);
  const cards = formulaCards();
  assert.equal(cards.length, rows.length);
  assert.equal(new Set(cards.map(c => c.id)).size, cards.length);
  for (const c of cards) { assert.match(c.id, /^eq:[a-zA-Z0-9]+$/); assert.match(c.formula, /<math/); assert.match(c.worked, /<math/); }
  for (const u of [1, 2, 3, 5]) assert.ok(rows.some(r => r[4] === `Unit ${u}`), `Unit ${u} has a row`);
  const hot = rows.filter(r => r[9] === true).map(r => r[7]);
  for (const r of ['marginalCost', 'dwl', 'mrp', 'crossElasticity']) assert.ok(hot.includes(r), `${r} is flagged easy to forget`);
  assert.ok(hot.length <= rows.length / 2, 'flags are for the few that cost the most');
  // Every graph kind is drawn on the page, each a valid spec on a real topic.
  const kinds = new Set(GRAPHS.map(g => g[0].kind));
  for (const k of Object.keys(Graph.KINDS).filter(k => k !== 'ppcin')) assert.ok(kinds.has(k), `the ${k} graph is on the page`);
  for (const g of GRAPHS) { assert.ok(topics.has(g[1]), g[0].kind); assert.deepEqual([...Graph.check(g[0])].filter(e => !/^graph.do lists/.test(e)), [], g[0].kind); }
  for (const r of NOT_ON) assert.ok(topics.has(r[2]), r[0]);
  assert.ok(TABLES.some(t => /Four-function calculator/.test(t[0])) && TABLES.some(t => /No formula sheet/.test(t[0])));
  // The payoff matrix card: a real matrix, the topic it belongs to, and Firm A's dominant strategy as the note says.
  assert.ok(topics.has(MATRIX_CARD.topic));
  assert.deepEqual([...Matrix.check(MATRIX_CARD.matrix)].filter(e => !/^matrix.do lists/.test(e)), []);
  assert.equal(Matrix.dominant(MATRIX_CARD.matrix, 0), 0);
  assert.match(MATRIX_CARD.note, /Low price/);
});

test('the generator serves nothing before a unit is published, and a unit test and the formulas page once one is', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'apmicro-exams-')), 'microeconomics');
  execFileSync(process.execPath, ['scripts/build-apmicro.mjs', '--out', out], { env: { ...process.env, APMICRO_DATA: '', APMICRO_PUBLISHED: '' } });
  assert.deepEqual(JSON.parse(readFileSync(join(out, 'assets/exams/forms.json'), 'utf8')), []);
  assert.equal(existsSync(join(out, 'unit-tests')), false);
  assert.equal(existsSync(join(out, 'score-calculator.html')), false);
  const out2 = join(mkdtempSync(join(tmpdir(), 'apmicro-exams-')), 'microeconomics');
  execFileSync(process.execPath, ['scripts/build-apmicro.mjs', '--out', out2], { env: { ...process.env, APMICRO_DATA: 'scripts/test/fixtures/apmicro-data', APMICRO_PUBLISHED: 'unit-6' } });
  const html = readFileSync(join(out2, 'unit-tests/unit-6.html'), 'utf8');
  assert.ok((html.match(/<div class="mic-q" data-qid=/g) || []).length >= 4, 'a sample of the unit\'s questions');
  assert.match(html, /<details class="mic-q-key">/, 'answers readable without JavaScript');
  const f = readFileSync(join(out2, 'formula-sheet.html'), 'utf8');
  assert.match(f, /<h1>Graphs and formulas you must know<\/h1>/);
  assert.equal((f.match(/<th scope="row">/g) || []).length, EQ.flatMap(s => s.rows).length);
  // Two-panel graphs (market and firm) draw two SVGs.
  assert.equal((f.match(/<svg class="mic-graph-svg"/g) || []).length, GRAPHS.reduce((n, g) => n + ((Graph.KINDS[g[0].kind].panels || []).length || 1), 0), 'the graphs drawn at build time');
  assert.match(f, /Four-function calculator/);
  assert.match(f, /<h2 id="eq-hot">Easy to forget<\/h2>/);
  assert.equal((f.match(/<span class="mic-eq-flag">Easy to forget<\/span>/g) || []).length, EQ.flatMap(s => s.rows).filter(r => r[9]).length + GRAPHS.filter(g => g[3]).length);
  assert.equal((f.match(/<svg class="mic-graph-svg"/g) || []).length >= GRAPHS.length, true);
  assert.match(f, /<table class="mic-mx"/, 'the payoff matrix, drawn as a table');
  assert.doesNotMatch(f, /score-calculator|Statistics you must know/i);
});

test('with every unit published: the exams with five options, the prompts, the formula page and 12-question unit tests apart from the exams', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'apmicro-exams-')), 'microeconomics');
  execFileSync(process.execPath, ['scripts/build-apmicro.mjs', '--out', out], { env: { ...process.env, APMICRO_DATA: '', APMICRO_PUBLISHED: map.chapters.map(c => c.id).join(',') }, maxBuffer: 1 << 26 });
  const forms = JSON.parse(readFileSync(join(out, 'assets/exams/forms.json'), 'utf8'));
  assert.deepEqual(forms.map(f => f.id), ['form-1', 'form-2']);
  const served = JSON.parse(readFileSync(join(out, 'assets/exams/items.json'), 'utf8'));
  assert.equal(served.items.length, 120, 'every question of both forms, as the exam serves it');
  assert.ok(served.items.every(q => q.options.length === 5 && q.why && q.why.correct && q.why.options.length === 5), 'five options, explained inline');
  const needs = new Set(served.items.map(q => q.stimulus).filter(Boolean));
  assert.deepEqual(Object.keys(served.stimuli).sort(), [...needs].sort(), 'each stimulus a question needs, and no other');
  assert.ok(Object.entries(served.stimuli).filter(([, st]) => st.kind === 'graph').every(([, st]) => /<svg class="mic-graph-svg"/.test(st.html)), 'graph stimuli drawn by ApMicroGraph');
  assert.ok(Object.values(served.stimuli).filter(st => /<table class="mic-mx"/.test(st.html)).length >= 2, 'payoff matrices drawn by ApMicroMatrix');
  for (const q of served.items) for (const t of [q.q, ...q.options, q.why.correct, ...q.why.options]) assert.doesNotMatch(String(t).replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, ''), /\\(frac|times|text)\b/, `${q.id}: math rendered`);
  const j = JSON.parse(readFileSync(join(out, 'assets/justify.json'), 'utf8'));
  assert.deepEqual(j.skills, JUSTIFY_SKILLS);
  assert.equal(j.prompts.length, loadJustify('microeconomics/data', map).length);
  assert.equal(j.prompts.filter(p => p.free).length, FREE_JUSTIFY);
  assert.ok(j.prompts.slice(0, FREE_JUSTIFY).every(p => p.free) && j.prompts.every(p => p.specific));
  const inForms = new Set(forms.flatMap(f => f.mcq.flat()));
  for (const u of units) {
    const html = readFileSync(join(out, `unit-tests/${u.id}.html`), 'utf8');
    const ids = [...html.matchAll(/data-qid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(ids.length, 12, `${u.id}: 12 questions`);
    assert.deepEqual(ids.filter(id => inForms.has(id) || /mic-exam-/.test(id)), [], `${u.id}: nothing from the practice exams`);
  }
  const eq = readFileSync(join(out, 'formula-sheet.html'), 'utf8');
  assert.equal((eq.match(/<th scope="row">/g) || []).length, EQ.flatMap(s => s.rows).length);
  for (const sl of [...eq.matchAll(/href="tools\/([a-z-]+)\.html"/g)].map(m => m[1])) assert.ok(existsSync(join(out, 'tools', `${sl}.html`)), `the page links only live trainers (${sl})`);
  const page = readFileSync(join(out, 'exams.html'), 'utf8');
  assert.doesNotMatch(page, /Beta|score-calculator|readiness/i, 'no Beta label, no score calculator, no band');
  assert.match(page, /has not yet been reviewed by an AP® Microeconomics teacher/, 'the review note stays');
});

/* Phase 3: the two real forms, their fifth options and exam-only items. */
const DATA = 'microeconomics/data';
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
    assert.deepEqual(units.map(u => ids.filter(id => qOf(id).unit === u.id).length), [8, 14, 14, 11, 7, 6], `${f.id}: units by weight`);
    const own = ids.filter(id => examItems.has(id));
    assert.equal(own.length, 10, `${f.id}: exam-only items`);
    assert.ok(own.every(id => id.startsWith(`mic-exam-${f.id.slice(5)}-`)));
    assert.ok(ids.every((id, i) => !i || pos(id) >= pos(ids[i - 1])), `${f.id}: course order`);
    assert.equal(ids.filter(id => checksR.has(id)).length, 0, `${f.id}: no lesson check item`);
    for (const id of ids) {
      const q = examItems.get(id) || examVersion(bankR.get(id), ex.fifth);
      assert.equal(q.options.length, 5, id); assert.equal(q.why.options.length, 5, id);
      if (bankR.has(id)) {
        // The fifth goes in at fifthAt(id); the bank's four keep their order and the key moves with its option.
        const b = bankR.get(id), at = fifthAt(id);
        assert.equal(q.options[at], ex.fifth[id].option, id); assert.equal(q.why.options[at], ex.fifth[id].why, id);
        assert.deepEqual(q.options.filter((_, i) => i !== at), b.options, id); assert.deepEqual(q.why.options.filter((_, i) => i !== at), b.why.options, id);
        assert.equal(q.options[q.correct], b.options[b.correct], id);
      }
    }
    const kinds = {}; let graphs = 0, matrices = 0;
    for (const id of ids) { const st = rctx.stimuli(qOf(id).stimulus); if (st) { kinds[st.kind] = (kinds[st.kind] || 0) + 1; if (st.graph) graphs++; if (st.matrix) matrices++; } }
    const n = Object.values(kinds).reduce((a, b) => a + b, 0);
    assert.ok(n >= EXAM_STIMULI[0] && n <= EXAM_STIMULI[1] && kinds.graph >= 3 && kinds.data >= 2, `${f.id}: stimulus questions ${JSON.stringify(kinds)}`);
    assert.ok(graphs >= 6 && matrices >= 1, `${f.id}: graph-reading (${graphs}) and payoff-matrix (${matrices}) questions`);
    // Section II: long (with graph parts) then two short, no unit twice.
    assert.deepEqual(f.frq.map(id => frqsR[id].type), FRQ_ORDER);
    assert.ok(frqsR[f.frq[0]].parts.some(p => p.type === 'graph'));
    const us = f.frq.flatMap(id => frqsR[id].units); assert.equal(new Set(us).size, us.length, `${f.id}: FRQs cover different units`);
    assert.deepEqual(formUnits(f, rctx).sort(), units.map(u => u.id));
  }
  assert.deepEqual(ex.forms.map(f => f.frq), [['frq-perfect-competition-long', 'frq-game-theory-short', 'frq-externality-short'], ['frq-labor-market-long', 'frq-price-control-short', 'frq-ppc-trade-short']]);
  const all = ex.forms.flatMap(f => f.mcq.flat());
  assert.equal(new Set(all).size, 120, 'no question in both forms');
  const stims = all.map(id => qOf(id).stimulus).filter(Boolean);
  assert.equal(new Set(stims).size, stims.length, 'no stimulus carries two questions');
  assert.equal(Object.keys(ex.fifth).length, 100, 'a fifth option for each of the 100 bank questions');
  assert.equal(new Set(Object.keys(ex.fifth).map(fifthAt)).size, MCQ_OPTIONS, 'the fifth option is placed at every position, not always (E)');
  assert.ok(ex.items.every(q => ex.forms.some(f => f.mcq.flat().includes(q.id))), 'every exam-only item is used');
  assert.deepEqual([0, 1, 2, 3, 4].map(k => ex.items.filter(q => q.correct === k).length), [4, 4, 4, 4, 4], 'exam-only keys spread over (A) to (E)');
});

test('the assembly check catches a broken real form', () => {
  const clone = x => JSON.parse(JSON.stringify(x));
  const bad = (mut, re) => { const f = clone(ex.forms); mut(f); const e = checkForms(f, rctx); assert.ok(e.some(x => re.test(x)), `${re}: ${e.join(' | ')}`); };
  bad(f => { f[0].mcq.reverse(); }, /course order/);
  bad(f => { const a = f[0].mcq.findIndex(b => b[0].startsWith('mic-exam-1-')); const j = f[1].mcq.findIndex(b => b[0].startsWith('mic-exam-2-')); f[1].mcq[j] = f[0].mcq[a]; }, /belongs to form-1/);
  bad(f => { f[1].frq[1] = f[0].frq[1]; }, /FRQ .* is also in form-1/);
  bad(f => { f[0].frq[2] = 'frq-monocomp-short'; }, /both cover unit-4/);
  const fifth = { ...ex.fifth }; const id = Object.keys(fifth)[0]; delete fifth[id];
  assert.ok(checkForms(ex.forms, { ...rctx, fifth }).some(e => e.includes(`${id} needs a fifth option`)));
  const dup = { ...ex.fifth, [id]: { option: bankR.get(id).options[1], why: 'The same words as an option already there.' } };
  assert.ok(checkFifth(dup, { bank: bankR, forms: ex.forms }).some(e => /repeats an option/.test(e)));
  const abs = { ...ex.fifth, [id]: { option: 'It always rises', why: 'An absolute word gives a distractor away.' } };
  assert.ok(checkFifth(abs, { bank: bankR, forms: ex.forms }).some(e => /absolute word/.test(e)));
});

/* The runtime grader (mic-questions.js) on every exam question as served:
   the key is graded right and every other option wrong. */
test('every exam-only number, graph and payoff matrix is recomputed, and the runtime grader credits exactly the key', () => {
  const prompts = loadJustify(DATA, map);
  assert.deepEqual(checkNumbers(examItems, prompts), []);
  assert.deepEqual(checkGraphs(examItems, ex.stimuli), []);
  assert.deepEqual(checkMatrices(examItems, ex.stimuli), []);
  const numeric = ex.items.filter(q => /\d/.test(q.options[q.correct]));
  assert.deepEqual(numeric.map(q => q.id).filter(id => !EXAM_NUMBERS.some(n => n.id === id)), [], 'every numeric key is recomputed');
  assert.ok(ex.items.filter(q => q.stimulus && ex.stimuli[q.stimulus].kind === 'graph').every(q => EXAM_GRAPHS.some(g => g.id === q.id)), 'every graph read is checked');
  assert.ok(ex.items.filter(q => q.stimulus && ex.stimuli[q.stimulus].matrix).every(q => EXAM_MATRICES.some(g => g.id === q.id)), 'every matrix read is checked');
  assert.ok(EXAM_MATRICES.length >= 2 && EXAM_GRAPHS.length >= 6);
  const B = createBrowser(); for (const f of ['mic-math.js', 'mic-calc.js', 'mic-graph.js', 'mic-matrix.js', 'mic-grade.js']) B.load(`microeconomics/assets/${f}`);
  const Q = B.load('microeconomics/assets/mic-questions.js').ApMicroQuestions;
  for (const f of ex.forms) for (const id of f.mcq.flat()) {
    const q = examItems.get(id) || examVersion(bankR.get(id), ex.fifth);
    q.options.forEach((_, i) => assert.equal(Q.grade(q, i).correct, i === q.correct, `${id} option ${i}`));
  }
  // A key that no longer matches the math, a graph that no longer shows the key and a changed matrix are caught.
  const m = new Map(examItems); const w = JSON.parse(JSON.stringify(m.get('mic-exam-1-03'))); w.options[w.correct] = '\\$60'; m.set(w.id, w);
  assert.ok(checkNumbers(m, prompts).some(e => /mic-exam-1-03/.test(e)));
  const st = JSON.parse(JSON.stringify(ex.stimuli)); st['exam-1-s5'].graph.start = { D: -1 };
  assert.ok(checkGraphs(examItems, st).some(e => /mic-exam-1-05/.test(e)), 'a firm drawn with a loss no longer shows profit area a');
  const st2 = JSON.parse(JSON.stringify(ex.stimuli)); st2['exam-1-s2'].graph.policy = { type: 'floor', at: 7 };
  assert.ok(checkGraphs(examItems, st2).some(e => /mic-exam-1-02/.test(e)));
  const st3 = JSON.parse(JSON.stringify(ex.stimuli)); st3['exam-1-s8'].matrix.payoffs[1][1] = [45, 35];
  assert.ok(checkMatrices(examItems, st3).some(e => /mic-exam-1-08/.test(e)), 'Bexley with a dominant strategy no longer matches the key');
});

test('the "Make it specific" prompts pass: about ten a unit, every skill, a builder on each', () => {
  const prompts = loadJustify(DATA, map);
  assert.deepEqual(checkJustify(prompts, { map, trademarkProblems, scanPage }), []);
  assert.equal(prompts.length, 64);
  for (const u of map.chapters) { const n = prompts.filter(p => p.unit === u.id).length, [lo, hi] = u.part === 'course' ? JUSTIFY_PER_CHAPTER : JUSTIFY_PER_SKILLS_CHAPTER; assert.ok(n >= lo && n <= hi, `${u.id}: ${n}`); }
  for (const u of units) assert.equal(prompts.filter(p => p.unit === u.id).length, 10, u.id);
  assert.equal(prompts.filter(p => p.unit === 'graph-skills').length, 4);
  // The reader-report misses each have prompts: graphs, areas, both comparisons, the long run, derived demand, the marginal rules, price from demand.
  for (const [k, n] of [['graph', 10], ['calculate', 12], ['identify', 6], ['marginal', 5], ['area', 4], ['compare', 4], ['longrun', 3], ['derived', 3], ['efficiency', 3], ['price', 2]]) assert.ok(prompts.filter(p => p.skill === k).length >= n, `${k}: ${prompts.filter(p => p.skill === k).length}`);
  for (const p of prompts) {
    assert.ok(p.specific && Object.keys(p.specific.slots).length >= 2, `${p.id}: a builder`);
    for (const [k, sl] of Object.entries(p.specific.slots)) sl.options.forEach((_, i) => assert.ok(i === sl.correct || (sl.why[i] || '').length >= 20, `${p.id} ${k} option ${i} has a why`));
    const right = Object.fromEntries(Object.entries(p.specific.slots).map(([k, sl]) => [k, sl.correct]));
    assert.equal(Grade.specific(p.specific, right).correct, true, `${p.id}: the right picks are credited`);
    const [k0, s0] = Object.entries(p.specific.slots)[0];
    assert.equal(Grade.specific(p.specific, { ...right, [k0]: (s0.correct + 1) % s0.options.length }).correct, false, `${p.id}: a wrong pick is not`);
    assert.doesNotMatch(JSON.stringify(p), /—|–/, `${p.id}: no dashes as punctuation`);
  }
  assert.ok(JUSTIFY_NUMBERS.length >= 20);
  for (const n of JUSTIFY_NUMBERS) assert.ok(prompts.some(p => p.id === n.id), `${n.id} exists`);
  const p = JSON.parse(JSON.stringify(prompts.find(x => x.id === 'u3-marginal-cost-table')));
  p.earns.answer = p.earns.answer.replace('= \\$6 per unit', '= \\$120 per unit');
  assert.ok(checkNumbers(examItems, prompts.map(x => x.id === p.id ? p : x)).some(e => /u3-marginal-cost-table/.test(e)));
});

test('timed sections: a fixed exam can run Section I or Section II alone (?section=1|2)', () => {
  const ex = readFileSync('microeconomics/assets/pages/exams.js', 'utf8');
  assert.match(ex, /p\.get\('section'\) === '1' \|\| p\.get\('section'\) === '2'/);
  assert.match(ex, /startExam\(sec === '2' \? \[\] : qs, sec === '1' \? \[\] : r\[1\]/);
  assert.match(ex, /if\(!mcqParts\.length && frqParts\.length\) return startSectionTwo\(0\);/);
});
