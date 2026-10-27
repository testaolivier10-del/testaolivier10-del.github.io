/* AP® Psychology practice exams, the "Make it specific" checker and the
   statistics page (docs/appsych-architecture.md, "Practice exams", "Make it
   specific", "Exams and entry pages"). Forked from the AP® Environmental
   Science Phase 0 tests:
   - the practice exam page runs the May 2027 format: Section I, 75
     four-option questions in 90 minutes; Section II, the AAQ and the EBQ,
     7 points each, in 70 minutes; no calculator (and no calculator link);
     no readiness band, no score calculator;
   - unit weight ranges come out right for 75 questions;
   - a good form passes and the checker catches each way a form can break,
     including the set kinds and the FRQ order (synthetic forms);
   - the "Make it specific" checker refuses a claim that is a question,
     evidence without a source, reasoning that does not link, and a builder
     slot without a why;
   - the statistics page uses only ApPsychStats recipes, each row with a
     worked line ApPsychStats computes and a number small enough by hand,
     and each row is a card in the "Statistics" flashcard deck;
   - the generator serves no forms and no unit tests before anything is
     published, and a unit test and the statistics page once one is.
   - Phase 3: the two real forms pass every check (75 in course order, every
     unit 11-19, sets in range, AAQ then EBQ, nothing shared, no lesson check
     or free unit-test item), every exam-only number is recomputed by
     ApPsychStats and the check bites; timed sections run alone. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { loadMap } from '../lib/appsych-build.mjs';
import { Tex, Stats } from '../lib/appsych-mathlib.mjs';
import { loadExams, checkNumbers, checkForms, checkJustify, unitRange, MCQ_TOTAL, MCQ_PARTS, FRQ_PARTS, FRQ_POINTS, FRQ_TOTAL, FRQ_ORDER, EXAM_SETS, JUSTIFY_SKILLS, EXAM_NUMBERS, JUSTIFY_NUMBERS } from '../lib/appsych-exams.mjs';
import { EQ, NOT_ON, TABLES, workedTex, workedValue, formulaCards } from '../lib/appsych-entry.mjs';

const map = loadMap();
const units = map.chapters.filter(c => c.part === 'course');

test('the practice exam page runs the May 2027 format: 75 in 90 minutes, then the AAQ and EBQ of 7 points in 70, no calculator, no band', () => {
  const ex = readFileSync('psychology/assets/pages/exams.js', 'utf8');
  assert.match(ex, /var MCQ_PARTS = \[\{ key: '', n: 75, sec: 90 \* 60, calc: false \}\];/);
  assert.match(ex, /var FRQ_PARTS = \[\{ key: '', n: 2, sec: 70 \* 60, calc: false \}\];/);
  assert.match(ex, /var FRQ_POINTS = 7;/);
  assert.deepEqual(MCQ_PARTS.map(p => [p.n, p.minutes]), [[75, 90]]);
  assert.deepEqual(FRQ_PARTS.map(p => [p.n, p.minutes]), [[2, 70]]);
  assert.equal(MCQ_TOTAL, 75); assert.equal(FRQ_POINTS, 7); assert.equal(FRQ_TOTAL, 2);
  assert.deepEqual(FRQ_ORDER, ['aaq', 'ebq']);
  assert.deepEqual(Object.keys(EXAM_SETS), ['study', 'data', 'visual']);
  assert.match(ex, /No calculator\./);
  assert.doesNotMatch(ex, /desmos|Calculator allowed|function band\(|readiness estimate|score-calculator/i, 'no calculator link, no band, no score calculator');
  for (const fn of ['startExam', 'startSectionOne', 'endSectionOne', 'startSectionTwo', 'endFrqPart', 'selfScore', 'calcNotice']) assert.match(ex, new RegExp(`function ${fn}\\(`));
  assert.match(ex, /Section I only \(75 questions, 90 min\)/);
  assert.match(ex, /Section II only \(2 questions, 70 min\)/);
  assert.ok(!existsSync('psychology/assets/pages/score.js'));
  assert.match(readFileSync('psychology/assets/pages/cram.js', 'utf8'), /var DEFAULT_EXAM = '2027-05-14';/, 'Friday 14 May 2027');
});

test('unit weight ranges for 75 questions match the course framework', () => {
  assert.deepEqual(unitRange([15, 25]), [11, 19]);
  const lo = units.reduce((s, u) => s + unitRange(u.weight)[0], 0), hi = units.reduce((s, u) => s + unitRange(u.weight)[1], 0);
  assert.ok(lo <= 75 && hi >= 75, `${lo}..${hi}`);
  assert.ok(!map.practicesConfirmed, 'practice weights are third party until a person confirms them (needs-author)');
});

/* A synthetic bank and two forms that pass, so each rule can be broken once:
   15 questions per unit, 3 study, 3 data and 1 figure set of 3. */
function synth() {
  const counts = { 'unit-1': 15, 'unit-2': 15, 'unit-3': 15, 'unit-4': 15, 'unit-5': 15 };
  const SETS = { 'unit-1': ['study', 'visual'], 'unit-2': ['data', 'study'], 'unit-3': ['data'], 'unit-4': ['study'], 'unit-5': ['data'] };
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
  const frqs = Object.fromEntries(forms.flatMap(f => f.frq.map(id => [id, { id, type: id.split('-')[1], units: ['unit-1'], points: 7 }])));
  return { forms, ctx: { map, bank, examItems: new Map(), frqs, orderOf: id => orderOf[id], stimuli: id => stimuli[id] } };
}

test('a form in the real format passes, and every way to break it is caught', () => {
  const { forms, ctx } = synth();
  assert.deepEqual(checkForms(forms, ctx), []);
  const clone = x => JSON.parse(JSON.stringify(x));
  const bad = (mut, re, c = ctx) => { const f = clone(forms); mut(f); const e = checkForms(f, c); assert.ok(e.some(x => re.test(x)), `${re}: ${e.join(' | ')}`); };
  bad(f => { f.pop(); }, /need at least 2 practice exams/);
  bad(f => { f[0].mcq.pop(); }, /Section I has 74 questions, not 75/);
  bad(f => { const s = f[0].mcq.find(b => b.length === 3); s.length = 1; }, /needs its stimulus/);
  bad(f => { f[0].frq = f[0].frq.slice().reverse(); }, /Section II question 1 is a aaq question/);
  bad(f => { f[0].frq.pop(); }, /Section II has 1 questions, not 2/);
  bad(f => { f[1].mcq[0] = f[0].mcq[0]; }, /is also in form-1/);
  bad(f => { f[1].frq[0] = f[0].frq[0]; }, /FRQ .* is also in form-1/);
  bad(f => { const ones = f[0].mcq.filter(b => b.length === 1 && ctx.bank.get(b[0]).unit === 'unit-5'); f[0].mcq = f[0].mcq.filter(b => !ones.slice(0, 5).includes(b)); f[0].mcq.push(...f[1].mcq.filter(b => b.length === 1 && ctx.bank.get(b[0]).unit === 'unit-4').slice(0, 5)); }, /Unit 5 has 10 questions/);
  bad(f => { for (const fm of f) fm.mcq = fm.mcq.flatMap(b => b.length === 3 && ctx.stimuli(ctx.bank.get(b[0]).stimulus).kind === 'visual' ? [b, ...Array.from({ length: 5 }, () => b)] : [b]); }, /figure|visual|Section I has/);
  const ctx4 = { ...ctx, frqs: { ...ctx.frqs, [forms[0].frq[0]]: { ...ctx.frqs[forms[0].frq[0]], points: 9 } } };
  bad(() => {}, /worth 9 points, not 7/, ctx4);
  const ctx5 = { ...ctx, bank: new Map(ctx.bank) };
  const one = forms[0].mcq.find(b => b.length === 1)[0];
  ctx5.bank.set(one, { ...ctx.bank.get(one), type: 'numeric' });
  bad(() => {}, /not a four-option single-answer question/, ctx5);
});

test('the "Make it specific" checker refuses a claim that is a question, evidence without a source, reasoning that does not link, and a slot without a why', () => {
  assert.deepEqual(Object.keys(JUSTIFY_SKILLS).sort(), ['argue', 'claim', 'ethics', 'evidence', 'generalize', 'method', 'opdef', 'reasoning', 'statistic']);
  const topic = map.topics.find(t => t.id === 'operant-conditioning');
  const p = {
    id: 'u3-schedules-claim', unit: 'unit-3', topic: topic.id, practice: '4.A', skill: 'claim', title: 'Schedules and persistence',
    prompt: '<b>Propose</b> a defensible claim about reinforcement schedules and how long a behavior lasts.',
    checklist: ['States a position that answers the question asked', 'Is a statement that the sources can support or refute'],
    earns: { answer: 'Behaviors reinforced on a variable-ratio schedule last longer after reinforcement stops than behaviors reinforced every time.', why: 'It takes a position that answers the question and that the sources can test.' },
    misses: { answer: 'Do reinforcement schedules change how long behaviors last?', why: 'A question is not a claim: it takes no position the sources could support.' },
  };
  assert.deepEqual(checkJustify([p], { map }), []);
  const q = JSON.parse(JSON.stringify(p)); q.earns.answer = 'Do variable-ratio schedules make behaviors last longer after reinforcement stops than continuous ones?';
  assert.ok(checkJustify([q], { map }).some(e => /a statement, not a question/.test(e)));
  const e = { ...JSON.parse(JSON.stringify(p)), id: 'u3-schedules-evidence', skill: 'evidence', practice: '4.B' };
  e.earns.answer = 'Rats on the variable-ratio schedule kept pressing the lever for twice as long after the food stopped.';
  assert.ok(checkJustify([e], { map }).some(x => /cites its source/.test(x)));
  const r = { ...JSON.parse(JSON.stringify(p)), id: 'u3-schedules-reasoning', skill: 'reasoning', practice: '4.B' };
  r.earns.answer = 'Rats on the variable-ratio schedule kept pressing longest. Variable-ratio schedules are partial reinforcement.';
  assert.ok(checkJustify([r], { map }).some(x => /links the evidence/.test(x)));
  const b = { ...JSON.parse(JSON.stringify(p)), id: 'u3-schedules-builder', specific: { slots: { claim: { label: 'Claim', options: ['variable ratio lasts', 'no effect'], correct: 0 }, source: { label: 'Source', options: ['Source 1', 'Source 2'], correct: 0, why: { 1: 'Placeholder: Source 2 is about intervals.' } } } } };
  assert.ok(checkJustify([b], { map }).some(x => /slot claim option 2 needs a why/.test(x)));
  const t = JSON.parse(JSON.stringify(p)); t.earns.answer += ' AP Psych students know this.';
  assert.ok(checkJustify([t], { map, trademarkProblems: s => /AP Psych/.test(s) ? ['AP Psych'] : [] }).some(x => /trademark/.test(x)));
});

test('the statistics page: every row a real ApPsychStats recipe, a worked line by hand, and a flashcard', () => {
  const rows = EQ.flatMap(s => s.rows);
  const topics = new Set(map.topics.map(t => t.id));
  const tools = new Set(JSON.parse(readFileSync('psychology/data/pages.json', 'utf8')).tools.map(t => t.slug));
  for (const r of rows) {
    assert.equal(Tex.check(`$${r[0]}$`).length, 0, r[0]);
    for (const t of [r[0], r[8][0], r[8][2] || '']) assert.doesNotMatch(t, /\\text\{[^{}]*\\/, t);
    for (const t of [r[1], r[2], r[3]]) assert.doesNotMatch(t, /[\x00-\x08]|—/, t);
    assert.match(r[4], /^(Unit [1-5]|Research skills you need)$/);
    assert.ok(topics.has(r[5]), r[5]);
    for (const s of r[6]) assert.ok(tools.has(s), s);
    assert.ok(Stats.FNS.includes(r[7]) && typeof Stats[r[7]] === 'function', `recipe ${r[7]}`);
    assert.ok(Array.isArray(r[8]) && Number.isFinite(workedValue(r[8])), `worked line for ${r[7]}`);
    assert.equal(Tex.check(`$${workedTex(r[8])}$`).length, 0, workedTex(r[8]));
  }
  const W = Object.fromEntries(rows.map(r => [r[7], workedValue(r[8])]));
  assert.deepEqual([W.mean, W.median, W.mode, W.range, W.z, W.rulePct, W.percentileRule, W.r], [7, 5, 4, 18, 2, 95, 84, 1]);
  assert.ok(Math.abs(W.sd - Math.sqrt(5)) < 1e-9);
  for (const fn of ['mean', 'median', 'mode', 'range', 'sd', 'z', 'rulePct', 'percentileRule', 'r']) assert.ok(rows.some(r => r[7] === fn), fn);
  const cards = formulaCards();
  assert.equal(cards.length, rows.length);
  assert.equal(new Set(cards.map(c => c.id)).size, cards.length);
  for (const c of cards) { assert.match(c.id, /^eq:[a-zA-Z0-9]+$/); assert.match(c.formula, /<math/); assert.match(c.worked, /<math/); }
  assert.ok(NOT_ON.length >= 3);
  for (const r of NOT_ON) assert.ok(topics.has(r[2]), r[0]);
  assert.ok(TABLES.some(t => /No calculator/.test(t[0])) && TABLES.some(t => /No formula sheet/.test(t[0])));
});

test('the generator serves nothing before a unit is published, and a unit test and the statistics page once one is', () => {
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
  const f = readFileSync(join(out2, 'formula-sheet.html'), 'utf8');
  assert.match(f, /<h1>Statistics you must know<\/h1>/);
  assert.equal((f.match(/<th scope="row">/g) || []).length, EQ.flatMap(s => s.rows).length);
  assert.match(f, /No calculator/);
  assert.doesNotMatch(f, /score-calculator|setup with brackets/i);
});

test('the two real forms pass every check, and every recomputed number is in place', () => {
  const D = 'psychology/data';
  const ex = loadExams(D);
  assert.equal(ex.forms.length, 2);
  const bank = new Map(), stim = {}, orderOf = {};
  for (const t of map.topics) { const p = join(D, 'questions', `${t.id}.json`); if (!existsSync(p)) continue; const d = JSON.parse(readFileSync(p, 'utf8')); d.items.forEach((q, i) => { bank.set(q.id, q); orderOf[q.id] = i; }); Object.assign(stim, d.stimuli || {}); }
  ex.items.forEach((q, i) => { orderOf[q.id] = i; });
  const examItems = new Map(ex.items.map(q => [q.id, q]));
  const frqs = {}; for (const f of readdirSync(join(D, 'frq'))) { const d = JSON.parse(readFileSync(join(D, 'frq', f), 'utf8')); frqs[d.id] = d; }
  assert.deepEqual(checkForms(ex.forms, { map, bank, examItems, frqs, orderOf: id => orderOf[id], stimuli: id => ex.stimuli[id] || stim[id] }), []);
  assert.deepEqual(ex.forms.map(f => f.frq.map(id => frqs[id].type)), [FRQ_ORDER, FRQ_ORDER]);
  const checks = new Set(); for (const t of map.topics) { const p = join(D, 'lessons', `${t.id}.json`); if (existsSync(p)) for (const id of JSON.parse(readFileSync(p, 'utf8')).check || []) checks.add(id); }
  const pos = id => map.topics.findIndex(t => t.id === (bank.get(id) || examItems.get(id)).topic);
  for (const f of ex.forms) {
    const ids = f.mcq.flat();
    for (const id of ids) assert.ok(!checks.has(id), `${f.id}: ${id} is a lesson check item`);
    assert.ok(ids.every((id, i) => !i || pos(id) >= pos(ids[i - 1])), `${f.id}: course order`);
    const own = ids.filter(id => examItems.has(id)).length;
    assert.ok(own >= 20 && own <= 30, `${f.id}: ${own} exam-only`);
  }
  assert.deepEqual(checkNumbers(examItems, []), []);
  assert.ok(EXAM_NUMBERS.length >= 12);
  const w = new Map(examItems); const q = JSON.parse(JSON.stringify(examItems.get('psy-exam-2-05'))); q.options[q.correct] = '7 symptoms'; w.set(q.id, q);
  assert.ok(checkNumbers(w, []).some(e => /psy-exam-2-05/.test(e)), 'a wrong key is caught');
  const q2 = JSON.parse(JSON.stringify(examItems.get('psy-exam-1-05'))); q2.options[(q2.correct + 2) % 4] = '70 words'; const w2 = new Map(examItems); w2.set(q2.id, q2);
  assert.ok(checkNumbers(w2, []).some(e => /psy-exam-1-05.*distractor/.test(e)), 'a named-slip distractor that is not recomputed is caught');
});

test('timed sections: a fixed exam can run Section I or Section II alone (?section=1|2)', () => {
  const ex = readFileSync('psychology/assets/pages/exams.js', 'utf8');
  assert.match(ex, /p\.get\('section'\) === '1' \|\| p\.get\('section'\) === '2'/);
  assert.match(ex, /startExam\(sec === '2' \? \[\] : qs, sec === '1' \? \[\] : r\[1\]/);
  assert.match(ex, /if\(!mcqParts\.length && frqParts\.length\) return startSectionTwo\(0\);/);
});
