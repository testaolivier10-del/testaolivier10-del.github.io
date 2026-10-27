/* Development: its model (psychology/assets/tools/math/development.js) and
   its validator (scripts/lib/appsych-tool-checks/development.mjs). OWNED BY
   THIS TOOL ONLY (builder T4). The frame and registration; the shipped data
   passing (300 problems per context and type, every key recomputed from the
   tables in the validator); the same seed gives the same problem; planted
   mistakes are caught; and the science: the stages come in order and cover
   the lifespan without gaps, heights only grow until adulthood, fluid
   intelligence declines while crystallized holds into the 60s, every
   parenting quadrant is reachable, and no psychosexual stage appears. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/appsych-tool-checks/_shared.mjs';
import { check, recheck, TYPES } from '../lib/appsych-tool-checks/development.mjs';
import { ROOT, loadMap } from '../lib/appsych-build.mjs';

const { M, model: D } = runtime('development');
const data = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'tools', 'development.json'), 'utf8'));
const ctx = id => data.contexts.find(c => c.id === id);

test('development: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  assert.ok(D && typeof D.generate === 'function' && !D.stub, 'ApPsychMath.development is the real model');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'psychology', 'assets', 'tools', 'development.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'development');
  assert.ok(entry && entry.studio === true, 'registered in pages.json on the Tool Studio');
  assert.equal(entry.topic, 'cognitive-development');
  assert.equal(entry.premium, 'tools');
  const map = { topicById: id => id === 'cognitive-development' ? { id } : null };
  const ok = { slug: 'development', kind: 'simulator', topic: 'cognitive-development', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'cognitive-development', types: ['piaget'] }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, contexts: [{ id: 'c1', topic: 'cognitive-development', types: ['freud'] }] }, map).some(e => /unknown type/.test(e)));
});

test('development: the shipped data passes (300 problems per context and type, every key rechecked)', () => {
  assert.deepEqual(check(data, loadMap()), []);
  assert.deepEqual([...new Set(data.contexts.flatMap(c => c.types))].sort(), [...TYPES].sort(), 'every problem type is offered');
});

test('development: the same seed gives the same problem, for every type', () => {
  for (const c of data.contexts) for (const t of c.types) {
    const a = D.generate(M.rng(31337), c, t), b = D.generate(M.rng(31337), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b), `${c.id} ${t}`);
    assert.equal(a.type, t);
  }
});

test('development: planted mistakes are caught', () => {
  const tries = [
    ['piaget', 'piaget', p => { const s = p.steps.find(x => x.key === 'stage'); s.correct = (s.correct + 1) % s.options.length; }, /stage key/],
    ['erikson', 'erikson', p => { const s = p.steps.find(x => x.key === 'next'); s.correct = (s.correct + 1) % s.options.length; }, /next key/],
    ['attach', 'attachment', p => { const s = p.steps.find(x => x.key === 'style'); s.correct = (s.correct + 1) % s.options.length; }, /style key/],
    ['teens', 'adolescence', p => { const s = p.steps.find(x => x.key === 'period'); s.correct = (s.correct + 1) % s.options.length; }, /period key/],
    ['methods', 'methods', p => { p.steps.find(x => x.key === 'mean').cell.answer += 1; }, /mean key/],
    ['methods', 'methods', p => { p.text = p.text.replace('Invented study for practice. ', ''); }, /invented/],
    ['piaget', 'piaget', p => { p.solution.push('Freud\'s oral stage'); }, /psychosexual/]
  ];
  for (const [c, t, plant, re] of tries) {
    const p = D.generate(M.rng(9), ctx(c), t), errs = [];
    plant(p);
    recheck(p, ctx(c), 'planted', errs);
    assert.ok(errs.some(e => re.test(e)), `${t}: ${re} not caught (${errs.join('; ')})`);
  }
});

test('development: the stages are in order and cover the lifespan', () => {
  for (const list of [D.PIAGET, D.ERIKSON]) {
    assert.equal(list[0].from, 0);
    for (let i = 1; i < list.length; i++) assert.equal(list[i].from, list[i - 1].to, `${list[i].name} starts where ${list[i - 1].name} ends`);
  }
  assert.equal(JSON.stringify(D.PIAGET.map(p => p.name)), JSON.stringify(['Sensorimotor', 'Preoperational', 'Concrete operational', 'Formal operational']));
  assert.equal(D.ERIKSON.length, 8);
  for (const L of D.LANES) {
    assert.equal(L.bands[0][0], 0, `${L.name} starts at birth`);
    assert.equal(L.bands[L.bands.length - 1][1], 90, `${L.name} ends at 90`);
    for (let i = 1; i < L.bands.length; i++) assert.equal(L.bands[i][0], L.bands[i - 1][1], `${L.name}: no gap before ${L.bands[i][2]}`);
  }
  for (const a of [0, 1, 2, 5, 7, 12, 18, 40, 65, 90]) assert.ok(D.stageAt(D.ERIKSON, a), `a stage at ${a}`);
});

test('development: the aging curves and parenting grid follow the research', () => {
  assert.ok(D.fluid(70) < D.fluid(25), 'fluid intelligence declines');
  assert.ok(D.crystallized(60) > D.crystallized(25), 'crystallized grows into the 60s');
  assert.ok(D.crystallized(75) > D.fluid(75), 'crystallized holds better than fluid');
  const seen = new Set();
  for (let w = 0; w <= 10; w++) for (let d = 0; d <= 10; d++) seen.add(D.parentStyle(w, d).id);
  assert.deepEqual([...seen].sort(), ['authoritarian', 'authoritative', 'permissive', 'uninvolved']);
  assert.equal(D.parentStyle(9, 9).id, 'authoritative');
  assert.equal(D.parentStyle(1, 9).id, 'authoritarian');
});

test('development: no psychosexual stages and no em dashes anywhere a student reads', () => {
  const src = readFileSync(join(ROOT, 'psychology', 'assets', 'tools', 'development.js'), 'utf8') + readFileSync(join(ROOT, 'psychology', 'assets', 'tools', 'math', 'development.js'), 'utf8');
  assert.ok(!/—/.test(src), 'no em dash');
  assert.ok(!/oral stage|anal stage|phallic|latency stage|Oedipus/i.test(src), 'no psychosexual stage content');
});
