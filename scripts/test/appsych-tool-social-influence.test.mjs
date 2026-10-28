/* Social influence: its model (psychology/assets/tools/math/social-influence.js)
   and its validator (scripts/lib/appsych-tool-checks/social-influence.mjs).
   OWNED BY THIS TOOL ONLY (builder T4). The frame and registration; the
   shipped data passing (the published numbers checked against the papers,
   300 problems per context and type with every key recomputed); the same
   seed gives the same problem; planted mistakes are caught; and the
   science: conformity rises with a unanimous majority up to three and
   falls with one partner, obedience falls as the learner comes closer or
   the authority leaves, helping falls with more bystanders, and every
   classic study names its replication record. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/appsych-tool-checks/_shared.mjs';
import { check, recheck, TYPES } from '../lib/appsych-tool-checks/social-influence.mjs';
import { ROOT, loadMap } from '../lib/appsych-build.mjs';

const { M, model: D } = runtime('social-influence');
const data = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'tools', 'social-influence.json'), 'utf8'));
const ctx = id => data.contexts.find(c => c.id === id);

test('social-influence: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  assert.ok(D && typeof D.generate === 'function' && !D.stub, 'ApPsychMath.socialInfluence is the real model');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'psychology', 'assets', 'tools', 'social-influence.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'social-influence');
  assert.ok(entry && entry.studio === true, 'registered in pages.json on the Tool Studio');
  assert.equal(entry.topic, 'social-situations');
  assert.equal(entry.premium, 'tools');
  const map = { topicById: id => id === 'social-situations' ? { id } : null };
  const ok = { slug: 'social-influence', kind: 'simulator', topic: 'social-situations', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'social-situations', types: ['groups'] }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
});

test('social-influence: the shipped data passes (published numbers, 300 problems per context and type)', () => {
  assert.deepEqual(check(data, loadMap()), []);
  assert.deepEqual([...new Set(data.contexts.flatMap(c => c.types))].sort(), [...TYPES].sort(), 'every problem type is offered');
});

test('social-influence: the same seed gives the same problem, for every type', () => {
  for (const c of data.contexts) for (const t of c.types) {
    const a = D.generate(M.rng(4242), c, t), b = D.generate(M.rng(4242), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b), `${c.id} ${t}`);
  }
});

test('social-influence: planted mistakes are caught', () => {
  const flip = k => p => { const s = p.steps.find(x => x.key === k); s.correct = (s.correct + 1) % s.options.length; };
  const tries = [
    ['conformity', 'conformity', flip('concept'), /concept key/],
    ['conformity', 'conformity', flip('predict'), /predict key/],
    ['obedience', 'obedience', flip('study'), /study key/],
    ['bystanders', 'bystander', p => { p.steps.find(x => x.key === 'percent').cell.answer += 5; }, /percent key/],
    ['attribution', 'attribution', flip('concept'), /concept key/],
    ['compliance', 'compliance', flip('concept'), /concept key/],
    ['groups', 'groups', p => { p.text = p.text.replace('Invented scenario. ', ''); }, /invented/]
  ];
  for (const [c, t, plant, re] of tries) {
    const p = D.generate(M.rng(11), ctx(c), t), errs = [];
    plant(p);
    recheck(p, ctx(c), 'planted', errs);
    assert.ok(errs.some(e => re.test(e)), `${t}: ${re} not caught (${errs.join('; ')})`);
  }
  // A wrong published number in the model is caught by the frame check.
  const saved = D.MILGRAM[0].pct; D.MILGRAM[0].pct = 75;
  try { assert.ok(check(data, loadMap()).some(e => /Milgram remote/.test(e))); } finally { D.MILGRAM[0].pct = saved; }
});

test('social-influence: the model shows the published patterns', () => {
  assert.ok(D.aschPct(1) < D.aschPct(2) && D.aschPct(2) < D.aschPct(3), 'conformity rises from 1 to 3');
  assert.ok(Math.abs(D.aschPct(8) - D.aschPct(3)) < 5, 'and levels off after 3');
  assert.ok(D.aschPct(3, true) < D.aschPct(3) / 4, 'one partner cuts it sharply');
  assert.ok(D.aschPct(0) < 1, 'alone, almost no errors');
  const ob = id => D.byId(D.MILGRAM, id).pct;
  assert.ok(ob('remote') > ob('proximity') && ob('proximity') > ob('touch'), 'obedience falls as the learner comes closer');
  assert.ok(ob('phone') < ob('voice') && ob('peers') < ob('phone'), 'and when the authority leaves or peers refuse');
  assert.ok(D.DARLEY.beforeEnd[0] > D.DARLEY.beforeEnd[1] && D.DARLEY.beforeEnd[1] > D.DARLEY.beforeEnd[2], 'helping falls with more bystanders');
  assert.ok(D.FACIL.good[1] > D.FACIL.good[0] && D.FACIL.poor[1] < D.FACIL.poor[0], 'audiences help easy tasks and hurt hard ones');
  assert.ok(D.LOAF.effort[2] < D.LOAF.effort[1] && D.LOAF.effort[1] < D.LOAF.effort[0], 'effort falls in larger pooled groups');
});

test('social-influence: every classic study states its replication record; no em dashes', () => {
  assert.match(D.CONF_STUDY.right, /Franzen and Mader, 2023/);
  assert.match(D.OBEY_STUDY.right, /Burger, 2009/);
  assert.match(D.BY_STUDY.right, /Philpot/);
  const src = readFileSync(join(ROOT, 'psychology', 'assets', 'tools', 'social-influence.js'), 'utf8') + readFileSync(join(ROOT, 'psychology', 'assets', 'tools', 'math', 'social-influence.js'), 'utf8');
  for (const want of ['Franzen and Mader', 'Bond and Smith', 'Burger (2009)', 'Haslam and colleagues', 'Fischer and colleagues', 'Philpot and colleagues', 'Karau and Williams']) assert.ok(src.includes(want), `cites ${want}`);
  assert.ok(!/—/.test(src), 'no em dash');
});
