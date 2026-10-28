/* Article Analysis Studio: its model (psychology/assets/tools/math/article-studio.js) and
   its validator (scripts/lib/appsych-tool-checks/article-studio.mjs). OWNED BY
   THIS TOOL ONLY (builder T1). The frame and registration; the shipped data
   passing (300 drills per context and type, every key recomputed); the same
   seed giving the same problem; planted mistakes caught; and the model's
   science: every number from ApPsychStats, a null result is never called
   significant, r is the plotted points' r, the summary tags every AAQ part,
   and every wrong option names its slip. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/appsych-tool-checks/_shared.mjs';
import { check, recheck, TYPES } from '../lib/appsych-tool-checks/article-studio.mjs';
import { ROOT, loadMap } from '../lib/appsych-build.mjs';

const { M, Stats, model: A } = runtime('article-studio');
const data = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'tools', 'article-studio.json'), 'utf8'));
const ctx = id => data.contexts.find(c => c.id === id);

test('article-studio: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  assert.ok(A && typeof A.generate === 'function' && !A.stub, 'ApPsychMath.articleStudio is the real model');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'psychology', 'assets', 'tools', 'article-studio.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'article-studio');
  assert.ok(entry && entry.studio === true, 'registered in pages.json on the Tool Studio');
  assert.equal(entry.topic, 'research-methods');
  assert.equal(entry.premium, undefined, 'the flagship is free');
  const map = { topicById: id => id === 'research-methods' ? { id } : null };
  const ok = { slug: 'article-studio', kind: 'simulator', topic: 'research-methods', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [] };
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
  assert.ok(check(ok, map).some(e => /no contexts/.test(e)));
});

test('article-studio: the shipped data passes (300 drills per context and type, every key rechecked)', () => {
  assert.deepEqual(check(data, loadMap()), []);
  assert.ok(data.contexts.length >= 6 && data.contexts.some(c => c.kind === 'r') && data.contexts.some(c => c.method === 'naturalistic'), 'experiments, a correlational study and an observation');
});

test('article-studio: the same seed gives the same problem, for every type', () => {
  for (const c of data.contexts) for (const t of TYPES) {
    const a = A.generate(M.rng(31337), c, t), b = A.generate(M.rng(31337), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b), `${c.id} ${t}`);
    assert.equal(a.type, t);
  }
});

test('article-studio: every number comes from ApPsychStats and the picture agrees with it', () => {
  for (const c of data.contexts) for (const v of c.variants || A.VARIANTS) for (let s = 1; s < 40; s++) {
    const st = A.study(c, v, M.rng(s));
    if (st.kind === 'means') {
      assert.equal(st.diff, Stats.evaluate({ fn: 'abs', args: [{ fn: 'sub', args: [st.means[st.hi], st.means[st.lo]] }] }));
      assert.equal(st.sig, v !== 'null', `${c.id} ${v}: significance`);
      if (v === 'support') assert.ok(st.means[st.hi] > st.means[st.lo]);
      if (v === 'reverse') assert.ok(st.means[st.hi] < st.means[st.lo]);
    } else {
      assert.equal(st.r, Stats.evaluate({ fn: 'r', args: [st.points] }));
      assert.equal(st.slope, Stats.evaluate({ fn: 'slope', args: [st.points] }));
      if (v === 'null') assert.ok(Math.abs(st.r) < 0.1);
      else assert.ok(Math.sign(st.r) === (v === 'support' ? c.direction : -c.direction) && Math.abs(st.r) >= 0.35);
    }
    // The results text says what the numbers say.
    const res = A.summary(c, st).find(x => x.k === 'results').html;
    if (st.kind === 'means') { for (const m of st.means) assert.ok(res.includes(M.fixed(m, st.dec)), `${c.id}: mean ${m} in the text`); assert.equal(/not statistically significant/.test(res), !st.sig); }
    else assert.ok(res.includes(A.rtxt(st.r2)));
  }
});

test('article-studio: the summary tags every AAQ part, and each part has an answer and a named slip', () => {
  for (const c of data.contexts) {
    const st = A.study(c, 'support', M.rng(3)), html = A.summary(c, st).map(s => s.html).join('');
    for (const p of A.PARTS) {
      assert.ok(html.includes(`data-part="${p.k}"`), `${c.id}: part ${p.k} is tagged`);
      const P = A.parts(c, st)[p.k];
      assert.ok(P.where && P.earns && P.misses && P.slip, `${c.id}: part ${p.k} complete`);
    }
    assert.equal(A.PARTS.reduce((n, p) => n + p.pts, 0), 7, 'the AAQ is worth 7 points');
  }
});

test('article-studio: every wrong option says why it is wrong (no bare "incorrect")', () => {
  for (const c of data.contexts) for (const t of TYPES) for (let s = 1; s < 25; s++) {
    const p = A.generate(M.rng(s), c, t);
    for (const st of p.steps.filter(x => x.kind === 'choice')) st.why.forEach((w, i) => {
      if (i === st.correct) return;
      assert.ok(w.length > 30 && !/^(incorrect|wrong)\.?$/i.test(w), `${c.id} ${st.key}: "${w}"`);
    });
  }
});

test('article-studio: planted mistakes are caught', () => {
  const run = (id, type, seed, plant, re) => {
    const c = ctx(id); let p, i = seed;
    do p = A.generate(M.rng(i++), c, type); while (p.given.variant !== 'support');
    plant(p); const e = []; recheck(p, c, 'planted', e);
    assert.ok(e.some(x => re.test(x)), `${id} ${type}: ${e.join(' | ') || 'nothing caught'}`);
  };
  run('sleep-words', 'results', 1, p => { p.steps.find(s => s.key === 'diff').cell.answer += 1; }, /diff key/);
  run('quiz-reread', 'design', 2, p => { const s = p.steps.find(x => x.key === 'method'); s.correct = (s.correct + 1) % s.options.length; }, /method key/);
  run('walk-stress', 'ethics', 3, p => { const s = p.steps.find(x => x.key === 'ethics'); s.options[s.correct] = 'Confidentiality'; }, /ethics key/);
  run('reading-points', 'full', 4, p => { const s = p.steps.find(x => x.key === 'argue'); s.options[s.correct] = 'Refutes: ' + s.options[s.correct].slice(10); }, /argument key/);
  run('caffeine-sleep', 'results', 5, p => { p.given.points[0][1] = 9; p.given.points[1][1] = 9; p.given.points[2][1] = 5; }, /r .* is not the plotted/);
  run('trail-runners', 'ethics', 6, p => { const s = p.steps.find(x => x.key === 'gen'); s.options[s.correct] = 'No: only 80 runners.'; }, /generalize key/);
});
