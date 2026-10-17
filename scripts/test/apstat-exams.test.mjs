/* AP® Statistics practice exams, the "Say it in context" checker and the
   formula page (docs/apstat-architecture.md, "Practice exams",
   "Justification trainer", "Exams and entry pages"). Forked from the AP®
   Calculus AB Phase 0 tests:
   - the practice exam page runs the May 2027 format: Section I, 42
     four-option questions in 90 minutes; Section II, 4 FRQs of 10 points in
     90 minutes; a calculator allowed throughout, with a link (no embedded
     script); no readiness band and no score calculator (spec decision 6);
   - the unit and practice weight ranges come out right for 42 questions;
   - a good form passes and the checker catches each way a form can break,
     including the two exam sets and the Q1 to Q4 order (synthetic forms),
     and the two real forms and the prompts pass, with every recomputed
     number in place and the number and builder checks shown to bite;
   - the justification checker refuses "accept", "prove" and a conclusion
     without the parameter;
   - the formula page lists the 2026 reference sheet, nothing more;
   - the generator serves no forms and no unit tests before anything is
     published, and a unit test and the formula page once one is. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { loadMap } from '../lib/apstat-build.mjs';
import { Tex } from '../lib/apstat-mathlib.mjs';
import { loadExams, loadJustify, checkNumbers, EXAM_NUMBERS, JUSTIFY_NUMBERS, checkForms, checkJustify, unitRange, MCQ_TOTAL, MCQ_PARTS, FRQ_PARTS, FRQ_POINTS, FRQ_TOTAL, FRQ_ORDER, EXAM_SETS, JUSTIFY_SKILLS } from '../lib/apstat-exams.mjs';
import { EQ, NOT_ON, TABLES } from '../lib/apstat-entry.mjs';

const map = loadMap();
const units = map.chapters.filter(c => c.part === 'course');

test('the practice exam page runs the May 2027 format: 42 in 90 minutes, then 4 FRQs of 10 points in 90, no band', () => {
  const ex = readFileSync('statistics/assets/pages/exams.js', 'utf8');
  assert.match(ex, /var MCQ_PARTS = \[\{ key: '', n: 42, sec: 90 \* 60, calc: false \}\];/);
  assert.match(ex, /var FRQ_PARTS = \[\{ key: '', n: 4, sec: 90 \* 60, calc: false \}\];/);
  assert.match(ex, /var FRQ_POINTS = 10;/);
  assert.deepEqual(MCQ_PARTS.map(p => [p.n, p.minutes]), [[42, 90]]);
  assert.deepEqual(FRQ_PARTS.map(p => [p.n, p.minutes]), [[4, 90]]);
  assert.equal(MCQ_TOTAL, 42); assert.equal(FRQ_POINTS, 10); assert.equal(FRQ_TOTAL, 4);
  assert.deepEqual(FRQ_ORDER, ['collect', 'analyze', 'inference', 'multi']);
  assert.deepEqual(EXAM_SETS, ['probability', 'regression']);
  // A link to a free graphing calculator, never a third-party script.
  assert.match(ex, /https:\/\/www\.desmos\.com\/calculator/);
  assert.doesNotMatch(ex, /<script[^>]+desmos/i);
  assert.match(ex, /Calculator allowed\./);
  assert.doesNotMatch(ex, /No calculator\.|function band\(|readiness estimate|score-calculator/i, 'no band, no score calculator');
  for (const fn of ['startExam', 'startSectionOne', 'endSectionOne', 'startSectionTwo', 'endFrqPart', 'selfScore', 'calcNotice']) assert.match(ex, new RegExp(`function ${fn}\\(`));
  assert.ok(!existsSync('statistics/assets/pages/score.js'));
});

test('unit and practice weight ranges for 42 questions match the course framework', () => {
  assert.deepEqual(unitRange([20, 30]), [8, 13]);
  assert.deepEqual(unitRange([15, 25]), [6, 11]);
  assert.deepEqual(unitRange([10, 20]), [4, 9]);
  assert.deepEqual(unitRange([5, 10]), [2, 5]);
  const lo = units.reduce((s, u) => s + unitRange(u.weight)[0], 0), hi = units.reduce((s, u) => s + unitRange(u.weight)[1], 0);
  assert.ok(lo <= 42 && hi >= 42, `${lo}..${hi}`);
  const plo = map.practices.reduce((s, p) => s + unitRange(p.mcqWeight)[0], 0), phi = map.practices.reduce((s, p) => s + unitRange(p.mcqWeight)[1], 0);
  assert.ok(plo <= 42 && phi >= 42, `practices ${plo}..${phi}`);
});

/* A synthetic bank and two forms that pass, so each rule can be broken once:
   per unit its share of 42, one probability set and one regression set of 3,
   practices within their ranges. */
function synth() {
  const counts = { 'unit-1': 10, 'unit-2': 9, 'unit-3': 9, 'unit-4': 7, 'unit-5': 7 };
  assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), 42);
  // Practices in order 1..4: 3, 11, 14, 14 of 42 (within 2-5, 8-13, 10-15, 10-15).
  const practiceFor = i => (i < 3 ? '1.A' : i < 14 ? '2.A' : i < 28 ? '3.B' : '4.A');
  const bank = new Map(), orderOf = {}, stimuli = {};
  const forms = [1, 2].map(n => {
    const mcq = []; let k = 0;
    for (const [u, c] of Object.entries(counts)) {
      const topic = map.topics.find(t => t.chapter === u && t.kind === 'concept').id;
      const set = u === 'unit-2' ? 'probability' : u === 'unit-5' ? 'regression' : null;
      const block = [];
      for (let i = 0; i < c; i++) {
        const id = `stat-${topic}-${n * 100 + i}`;
        const inSet = set && i < 3;
        bank.set(id, { id, type: 'single', unit: u, topic, practice: practiceFor(k++), options: ['a', 'b', 'c', 'd'], correct: 0, ...(inSet ? { stimulus: `${topic}-set${n}` } : {}) });
        orderOf[id] = i;
        if (inSet) block.push(id); else mcq.push([id]);
      }
      if (set) { stimuli[`${topic}-set${n}`] = { kind: 'table', set }; mcq.push(block); }
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
  bad(f => { f.pop(); }, /need at least 2 practice exams/);
  bad(f => { f[0].mcq.shift(); }, /Section I has 41 questions, not 42/);
  bad(f => { f[0].mcq = f[0].mcq.filter(b => b.length === 1 || ctx.stimuli(ctx.bank.get(b[0]).stimulus).set !== 'regression'); }, /0 regression sets; the exam has exactly one/);
  bad(f => { const s = f[0].mcq.find(b => b.length === 3); s.pop(); }, /set .* has 2 questions in the exam \(exactly 3\)/);
  bad(f => { f[0].frq = f[0].frq.slice().reverse(); }, /Section II question 1 is a collect question/);
  bad(f => { f[0].frq.pop(); }, /Section II has 3 questions, not 4/);
  bad(f => { f[1].mcq[0] = f[0].mcq[0]; }, /is also in form-1/);
  bad(f => { f[1].frq[0] = f[0].frq[0]; }, /FRQ .* is also in form-1/);
  bad(f => { const ones = f[0].mcq.filter(b => b.length === 1 && ctx.bank.get(b[0]).unit === 'unit-1'); f[0].mcq = f[0].mcq.filter(b => !ones.slice(0, 3).includes(b)); f[0].mcq.push(...f[1].mcq.filter(b => b.length === 1 && ctx.bank.get(b[0]).unit === 'unit-3').slice(0, 3)); }, /Unit 1 has 7 questions/);
  const ctx2 = { ...ctx, bank: new Map(ctx.bank) };
  for (const [id, q] of ctx.bank) if (q.practice === '1.A') ctx2.bank.set(id, { ...q, practice: '2.A' });
  bad(() => {}, /practice 1 has 0 questions/, ctx2);
  const ctx4 = { ...ctx, frqs: { ...ctx.frqs, [forms[0].frq[0]]: { ...ctx.frqs[forms[0].frq[0]], points: 9 } } };
  bad(() => {}, /worth 9 points, not 10/, ctx4);
});

test('the "Say it in context" checker refuses accept, prove, and a conclusion without its parameter', () => {
  assert.deepEqual(Object.keys(JUSTIFY_SKILLS).sort(), ['compare', 'conditions', 'describe', 'design', 'errors', 'interval', 'probability', 'regression', 'sampling', 'test']);
  const p = {
    id: 'u3-bond-test', unit: 'unit-3', topic: 'test-one-proportion', practice: '4.G', skill: 'test', title: 'A school bond vote',
    prompt: '<b>State</b> the conclusion of the test at the 0.05 level, in context.',
    checklist: ['Compares the p-value with the significance level, with the inequality', 'Names the parameter: the true proportion of all district voters'],
    earns: { answer: 'Because the p-value of 0.012 is less than 0.05, we reject the null hypothesis. There is convincing evidence that the true proportion of all district voters who support the bond is greater than 0.5.', why: 'It compares, uses evidence language, and names the direction and the parameter in context.' },
    misses: { answer: 'Because 0.012 < 0.05, more than half of the voters support the bond.', why: 'It talks about the sample, not the true proportion of all voters, and gives no evidence language.' },
  };
  assert.deepEqual(checkJustify([p], { map }), []);
  const q = JSON.parse(JSON.stringify(p));
  q.earns.answer = 'Because the p-value of 0.012 is less than 0.05, this proves that the true proportion of all district voters who support the bond is greater than 0.5.';
  assert.ok(checkJustify([q], { map }).some(e => /accept|prove/.test(e)));
  const r = JSON.parse(JSON.stringify(p));
  r.earns.answer = 'Because the p-value of 0.012 is less than 0.05, we reject the null hypothesis: there is convincing evidence that support for the bond is above one half in this district.';
  assert.ok(checkJustify([r], { map }).some(e => /names the parameter/.test(e)));
});

test('the two real forms and the 36+ prompts pass every check, and every recomputed number is in place', () => {
  const D = 'statistics/data';
  const ex = loadExams(D);
  assert.equal(ex.forms.length, 2);
  const bank = new Map(), stim = {}, orderOf = {};
  for (const t of map.topics) { const p = join(D, 'questions', `${t.id}.json`); if (!existsSync(p)) continue; const d = JSON.parse(readFileSync(p, 'utf8')); d.items.forEach((q, i) => { bank.set(q.id, q); orderOf[q.id] = i; }); Object.assign(stim, d.stimuli || {}); }
  ex.items.forEach((q, i) => { orderOf[q.id] = i; });
  const examItems = new Map(ex.items.map(q => [q.id, q]));
  const frqs = {}; for (const f of readdirSync(join(D, 'frq'))) { const d = JSON.parse(readFileSync(join(D, 'frq', f), 'utf8')); frqs[d.id] = d; }
  assert.deepEqual(checkForms(ex.forms, { map, bank, examItems, frqs, orderOf: id => orderOf[id], stimuli: id => ex.stimuli[id] || stim[id] }), []);
  const prompts = loadJustify(D, map);
  assert.ok(prompts.length >= 35);
  assert.deepEqual(checkJustify(prompts, { map }), []);
  assert.deepEqual(checkNumbers(examItems, prompts), []);
  // Every computed exam-only key and every prompt number is covered, and the check bites.
  assert.ok(EXAM_NUMBERS.length >= 12 && JUSTIFY_NUMBERS.length >= 15);
  const wrong = new Map(examItems); const q = JSON.parse(JSON.stringify(examItems.get('stat-exam-1-08'))); q.options[q.correct] = '$z \\approx 2.52$'; wrong.set(q.id, q);
  assert.ok(checkNumbers(wrong, prompts).some(e => /stat-exam-1-08/.test(e)));
  const p2 = JSON.parse(JSON.stringify(prompts).replace(/73\.5 = 7\.5/g, '73.5 = 8.5'));
  assert.ok(checkNumbers(examItems, p2).some(e => /u5-residual/.test(e)));
  // A builder slot without a why for a wrong option, or a test builder without p, is refused.
  const b = JSON.parse(JSON.stringify(prompts.find(p => p.conclude && p.conclude.mode === 'test')));
  delete b.conclude.slots.evidence.why; delete b.conclude.p;
  const e = checkJustify([b], { map });
  assert.ok(e.some(x => /needs a why/.test(x)) && e.some(x => /needs p and alpha/.test(x)), e.join(' | '));
});

test('the formula page is the 2026 reference sheet, explained: every formula on it, and only those', () => {
  const rows = EQ.flatMap(s => s.rows);
  const topics = new Set(map.topics.map(t => t.id));
  // The sheet: 3 descriptive, 6 probability, 3 general inference, 5 proportions, 4 means (framework.md section 4).
  assert.deepEqual(EQ.map(s => s.rows.length), [3, 6, 3, 5, 4]);
  for (const r of rows) {
    assert.equal(Tex.check(`$${r[0]}$ ${r[1]} ${r[2]}`).length, 0, r[0]);
    // A TeX command in a plain (non-raw) string loses its backslash ("\hat" becomes "hat", "\b" a backspace).
    for (const t of [r[1], r[2]]) {
      assert.doesNotMatch(t, /[\x00-\x08]/, t);
      for (const m of t.match(/\$[^$]*\$/g) || []) assert.doesNotMatch(m, /(^|[^\\a-z])(hat|bar|ldots|frac|sqrt|sigma|mu|text)\b/, m);
    }
    assert.ok(topics.has(r[4]), r[4]);
    assert.match(r[3], /^Unit [1-5]$/);
  }
  const tex = rows.map(r => r[0]).join(' ');
  assert.match(tex, /p_c/, 'the pooled proportion for the two-proportion test');
  assert.doesNotMatch(tex, /s_p|pooled/i, 'no pooled t (not on the sheet)');
  assert.doesNotMatch(tex, /\\frac\{s_y\}\{s_x\}/, 'b = r s_y / s_x is not on the 2026 sheet');
  assert.equal(TABLES.length, 3);
  assert.ok(NOT_ON.length >= 5);
  for (const r of NOT_ON) { assert.ok(topics.has(r[2]), r[0]); assert.equal(Tex.check(r[0] + ' ' + r[1]).length, 0, r[0]); }
});

test('the generator serves nothing before a unit is published, and a unit test and the formula page once one is', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'apstat-exams-')), 'statistics');
  execFileSync(process.execPath, ['scripts/build-apstat.mjs', '--out', out], { env: { ...process.env, APSTAT_DATA: '', APSTAT_PUBLISHED: '' } });
  assert.deepEqual(JSON.parse(readFileSync(join(out, 'assets/exams/forms.json'), 'utf8')), []);
  assert.equal(existsSync(join(out, 'unit-tests')), false);
  assert.equal(existsSync(join(out, 'score-calculator.html')), false);
  const out2 = join(mkdtempSync(join(tmpdir(), 'apstat-exams-')), 'statistics');
  execFileSync(process.execPath, ['scripts/build-apstat.mjs', '--out', out2], { env: { ...process.env, APSTAT_DATA: 'scripts/test/fixtures/apstat-data', APSTAT_PUBLISHED: 'unit-4' } });
  const html = readFileSync(join(out2, 'unit-tests/unit-4.html'), 'utf8');
  assert.ok((html.match(/<div class="stat-q" data-qid=/g) || []).length >= 4, 'a sample of the unit\'s questions (the fixture is one small topic)');
  assert.match(html, /<details class="stat-q-key">/, 'answers readable without JavaScript');
  assert.match(html, /<math class="stat-m">/, 'with rendered math');
  const f = readFileSync(join(out2, 'formula-sheet.html'), 'utf8');
  assert.match(f, /<h1>The reference sheet, explained<\/h1>/);
  assert.equal((f.match(/<th scope="row">/g) || []).length, EQ.flatMap(s => s.rows).length);
  assert.match(f, /Table A: standard normal probabilities/);
  assert.match(f, /Not on the sheet: know these/);
  assert.doesNotMatch(f, /score-calculator|no formula sheet/i);
});
