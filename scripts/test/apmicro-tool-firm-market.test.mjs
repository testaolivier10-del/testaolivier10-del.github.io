/* Firm and Market Lab: its model (microeconomics/assets/tools/math/firm-market.js)
   and its validator (scripts/lib/apmicro-tool-checks/firm-market.mjs). OWNED BY
   THIS TOOL ONLY (builder T2). The shipped data passes the full sweep (300
   problems per context and kind, every key recomputed); a seed gives the same
   problem twice; the explore states agree with ApMicroGraph (price carried
   across, q where P = MC, the long run back at minimum ATC, Q where MR = MC
   with P from demand, zero profit and excess capacity in monopolistic
   competition); planted mistakes are caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmicro-tool-checks/_shared.mjs';
import { check, recheck, TYPES } from '../lib/apmicro-tool-checks/firm-market.mjs';
import { ROOT } from '../lib/apmicro-build.mjs';

const DATA = JSON.parse(readFileSync(join(ROOT, 'microeconomics', 'data', 'tools', 'firm-market.json'), 'utf8'));
const MAP = JSON.parse(readFileSync(join(ROOT, 'docs', 'apmicro-dependency-map.json'), 'utf8'));
const map = { topicById: id => MAP.topics.find(t => t.id === id) || null };
const ctx = id => DATA.contexts.find(c => c.id === id);

test('firm-market: registers, the page script parses, it is registered on the Tool Studio', () => {
  const { model } = runtime('firm-market');
  assert.ok(model && typeof model.generate === 'function' && !model.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'microeconomics', 'assets', 'tools', 'firm-market.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'microeconomics', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'firm-market');
  assert.ok(entry && entry.studio === true);
  assert.equal(entry.topic, 'perfect-competition');
  assert.equal(DATA.topic, entry.topic);
  const ok = { slug: 'firm-market', kind: 'simulator', topic: 'perfect-competition', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'perfect-competition', types: ['longrun'] }] };
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
});

test('firm-market: the shipped data passes the frame and the full drill sweep', () => {
  assert.deepEqual(check(DATA, map), []);
  assert.deepEqual([...new Set(DATA.contexts.flatMap(c => c.types))].sort(), [...TYPES].sort());
  // each context unlocks with its own unit
  for (const id of ['quantity', 'shutdown', 'longrun']) assert.equal(map.topicById(ctx(id).topic).chapter, 'unit-3');
  for (const id of ['monopoly', 'monocomp']) assert.equal(map.topicById(ctx(id).topic).chapter, 'unit-4');
});

test('firm-market: a seed gives the same problem twice', () => {
  const { M, model } = runtime('firm-market');
  for (const c of DATA.contexts) for (const seed of [13, 7932, 99991]) {
    const a = model.generate(M.rng(seed), c, c.types[0]), b = model.generate(M.rng(seed), c, c.types[0]);
    assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  }
});

test('firm-market: the explore states agree with ApMicroGraph', () => {
  const { Graph: G, model } = runtime('firm-market');
  for (const d of [-2, -1, -0.5, 0, 0.5, 1, 2]) {
    const S = model.pcState(d, 0), off = d ? { D: d } : {};
    assert.equal(S.P, G.lineAt({ kind: 'pc' }, { shifts: off }), 'the firm takes the market price');
    const mc = G.find(G.curves({ kind: 'pc' }, off), 'MC');
    assert.ok(Math.abs(G.y(mc, S.q) - S.P) < 1e-4, 'q where P = MC');
    assert.equal(S.kind, Math.abs(S.P - S.atc) < 0.05 ? 'zero' : S.P > S.atc ? 'profit' : 'loss');
    assert.ok(!S.shut, 'explore prices stay above the shutdown price');
    // the long run: supply moves until P is back at the minimum of ATC
    const L = model.pcState(d, model.pcLongRun(d));
    assert.ok(Math.abs(L.P - L.minAtc[1]) < 1e-6 && L.kind === 'zero');
    if (d > 0) assert.ok(model.pcLongRun(d) > 0, 'entry: supply right');
    if (d < 0) assert.ok(model.pcLongRun(d) < 0, 'exit: supply left');
  }
  const m = model.monoState({ kind: 'monopoly' }, {});
  const mr = G.find(G.curves({ kind: 'monopoly' }, {}), 'MR'), D = G.find(G.curves({ kind: 'monopoly' }, {}), 'D');
  assert.ok(Math.abs(G.y(mr, m.Q) - m.mc) < 1e-4, 'MR = MC at Q');
  assert.ok(Math.abs(G.y(D, m.Q) - m.P) < 1e-6 && m.P > m.mc + 1, 'price from demand, above MC');
  assert.ok(m.alloc[0] > m.Q, 'the efficient quantity is larger');
  const lr = model.monoState({ kind: 'monocomp', run: 'short' }, { D: model.longRunD() });
  assert.equal(lr.kind, 'zero');
  assert.ok(lr.Q < G.named({ kind: 'monocomp', run: 'short' }, { D: model.longRunD() }, 'min-atc')[0], 'excess capacity');
  assert.ok(lr.P > lr.mc, 'P > MC in the long run');
});

test('firm-market: planted mistakes are caught', () => {
  const { M, model } = runtime('firm-market');
  const tweak = (p, key, f) => { const q = JSON.parse(JSON.stringify(p)); f(q.steps.find(x => x.key === key)); return q; };
  const mono = model.generate(M.rng(21), ctx('monopoly'), 'monopoly');
  assert.deepEqual(recheck(mono, ctx('monopoly'), 'ok'), []);
  // the monopoly price read from MR
  const mrAt = mono.steps.find(s => s.key === 'p').cell.mistakes[0].value;
  assert.ok(recheck(tweak(mono, 'p', s => { s.cell.answer = mrAt; }), ctx('monopoly'), 'w').some(e => /P /.test(e)));
  const lr = model.generate(M.rng(4), ctx('longrun'), 'longrun');
  // entry shifting demand instead of supply
  assert.ok(recheck(tweak(lr, 'graph', s => { s.spec.key.shifts = [{ curve: 'D', dir: 'right' }]; }), ctx('longrun'), 'w').length > 0);
  // firms entering "because demand rose"
  assert.ok(recheck(tweak(lr, 'entry', s => { s.correct = 2; }), ctx('longrun'), 'w').some(e => /entry keyed/.test(e)));
  const sd = model.generate(M.rng(8), ctx('shutdown'), 'shutdown');
  assert.ok(recheck(tweak(sd, 'decide', s => { s.correct = (s.correct + 1) % 3; }), ctx('shutdown'), 'w').some(e => /decision/.test(e)));
});
