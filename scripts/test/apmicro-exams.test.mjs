/* AP® Microeconomics practice exams, the "Make it specific" prompts and the
   graphs and formulas page (docs/apmicro-architecture.md, "Practice exams",
   "Make it specific", "Exams and entry pages"). Forked from AP® Macroeconomics's
   tests at Phase 0 (no forms, prompts or exam-only items are written yet):
   - the exam config is May 2027's, the same in the page and the generator:
     Section I, 60 questions in 70 minutes (66%), five choices on forms (four
     in the bank); Section II, one long (10 points) then two short (5 points)
     in 60 minutes with a 10-minute reading period (33%); a four-function
     calculator; no band, no score calculator; Tuesday 4 May 2027;
   - unit weight ranges come out right for 60 questions;
   - a good form passes and the checker catches each way a form can break
     (synthetic forms);
   - the "Make it specific" checker refuses each reader-report miss;
   - the formulas page: every row a real ApMicroCalc recipe with a worked
     line, the easy-to-forget ones flagged, the graphs and the payoff matrix;
   - the generator serves nothing before a unit is published, and a unit test
     and the formulas page once one is. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { loadMap } from '../lib/apmicro-build.mjs';
import { Tex, Calc, Graph, Matrix } from '../lib/apmicro-mathlib.mjs';
import { loadExams, loadJustify, checkForms, checkJustify, checkGraphs, checkNumbers, unitRange, MCQ_OPTIONS, BANK_OPTIONS, MCQ_TOTAL, MCQ_PARTS, FRQ_PARTS, FRQ_POINTS, FRQ_TOTAL, FRQ_ORDER, EXAM_SETS, JUSTIFY_SKILLS, EXAM_NUMBERS, EXAM_GRAPHS, JUSTIFY_NUMBERS, MCQ_WEIGHT, FRQ_WEIGHT, EXAM_DATE } from '../lib/apmicro-exams.mjs';
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

test('Phase 0: no forms, prompts or exam-only items yet, and the checks that will read them are ready', () => {
  const ex = loadExams('microeconomics/data');
  assert.deepEqual([ex.forms.length, ex.items.length], [0, 0]);
  assert.deepEqual(loadJustify('microeconomics/data', map), []);
  assert.deepEqual([EXAM_NUMBERS.length, EXAM_GRAPHS.length, JUSTIFY_NUMBERS.length], [0, 0, 0]);
  assert.deepEqual(checkGraphs(new Map(), {}), []);
  assert.deepEqual(checkNumbers(new Map(), []), []);
  assert.equal(MCQ_OPTIONS, 5, 'five choices on forms (needs-author mcq-options)');
  assert.equal(BANK_OPTIONS, 4);
  // With every unit published and no data, the generator still builds and serves no exam.
  const out = join(mkdtempSync(join(tmpdir(), 'apmicro-exams-')), 'microeconomics');
  execFileSync(process.execPath, ['scripts/build-apmicro.mjs', '--out', out], { env: { ...process.env, APMICRO_DATA: '', APMICRO_PUBLISHED: map.chapters.map(c => c.id).join(',') }, maxBuffer: 1 << 26 });
  assert.deepEqual(JSON.parse(readFileSync(join(out, 'assets/exams/forms.json'), 'utf8')), []);
  const page = readFileSync(join(out, 'exams.html'), 'utf8');
  assert.doesNotMatch(page, /score-calculator|readiness/i, 'no score calculator, no band');
});

test('timed sections: a fixed exam can run Section I or Section II alone (?section=1|2)', () => {
  const ex = readFileSync('microeconomics/assets/pages/exams.js', 'utf8');
  assert.match(ex, /p\.get\('section'\) === '1' \|\| p\.get\('section'\) === '2'/);
  assert.match(ex, /startExam\(sec === '2' \? \[\] : qs, sec === '1' \? \[\] : r\[1\]/);
  assert.match(ex, /if\(!mcqParts\.length && frqParts\.length\) return startSectionTwo\(0\);/);
});
