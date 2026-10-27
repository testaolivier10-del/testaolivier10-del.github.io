/* Neuron: its model (psychology/assets/tools/math/neuron.js) and its
   validator (scripts/lib/appsych-tool-checks/neuron.mjs). OWNED BY THIS TOOL
   ONLY (builder T2). The frame and registration; the shipped data passing
   (300 problems per context and type, every key recomputed); same seed same
   problem; planted mistakes caught; and the science of the model:
   threshold, all-or-none, the refractory periods, the rate code, and the
   synapse (agonist and reuptake inhibitor raise the signal, an antagonist
   lowers it; only the eight CED neurotransmitters). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/appsych-tool-checks/_shared.mjs';
import { check, recheck } from '../lib/appsych-tool-checks/neuron.mjs';
import { ROOT, loadMap } from '../lib/appsych-build.mjs';

const { M, model: N } = runtime('neuron');
const data = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'tools', 'neuron.json'), 'utf8'));
const ctx = id => data.contexts.find(c => c.id === id);

test('neuron: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  assert.ok(N && typeof N.generate === 'function' && !N.stub, 'ApPsychMath.neuron is the real model');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'psychology', 'assets', 'tools', 'neuron.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'neuron');
  assert.ok(entry && entry.studio === true, 'registered in pages.json on the Tool Studio');
  assert.equal(entry.topic, 'neural-firing');
  assert.equal(entry.premium, undefined, 'free');
  const map = { topicById: id => id === 'neural-firing' ? { id } : null };
  const ok = { slug: 'neuron', kind: 'simulator', topic: 'neural-firing', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'neural-firing', types: ['parts'] }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, contexts: [{ id: 'c1', topic: 'neural-firing', types: ['bogus'] }] }, map).some(e => /unknown type/.test(e)));
  assert.ok(check({ ...ok, intro: '<p>a — b</p>' }, map).some(e => /em dash/.test(e)));
});

test('neuron: the shipped data passes (300 problems per context and type, every key rechecked)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('neuron: the same seed gives the same problem, for every type', () => {
  for (const c of data.contexts) for (const t of c.types) {
    const a = N.generate(M.rng(31337), c, t), b = N.generate(M.rng(31337), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b), `${c.id} ${t}`);
    assert.equal(a.type, t);
  }
});

test('neuron: threshold, all-or-none and the refractory period', () => {
  const need = N.THRESH - N.REST;
  assert.equal(N.needed({}), need);
  assert.equal(N.simulate({ mode: 'pulse', S: need - 1 }).spikes.length, 0, 'below threshold: no spike');
  assert.equal(N.simulate({ mode: 'pulse', S: need + 1 }).spikes.length, 1, 'past threshold: one spike');
  const peaks = [need + 1, 25, 40].map(S => Math.max(...N.simulate({ mode: 'pulse', S }).v));
  for (const p of peaks) assert.ok(Math.abs(p - N.PEAK) < 1e-6, 'every spike peaks at the same height');
  const low = Math.min(...N.simulate({ mode: 'pulse', S: 30 }).v);
  assert.ok(low < N.REST - 5, 'the membrane dips below rest after a spike');
  assert.equal(N.simulate({ mode: 'pair', S: 30, gap: 1 }).spikes.length, 1, 'absolute refractory period blocks a second pulse');
  assert.equal(N.simulate({ mode: 'pair', S: 30, gap: 8 }).spikes.length, 2, 'after the refractory period a second pulse fires');
  const ev = N.simulate({ mode: 'pair', S: 30, gap: 1 }).events;
  assert.equal(ev[1].effect, 'absolute');
});

test('neuron: a stronger held stimulus fires more often, never bigger', () => {
  let prev = 0;
  for (const S of [16, 20, 25, 30, 35, 40]) { const n = N.rate(S); assert.ok(n >= prev, `rate at ${S} mV`); prev = n; }
  assert.ok(N.rate(40) > N.rate(16));
  assert.equal(N.rate(10), 0, 'a held stimulus below threshold never fires');
  const run = N.simulate({ mode: 'held', S: 40 });
  const tops = []; let cur = null;
  run.v.forEach(v => { if (v > 0) cur = Math.max(cur ?? v, v); else if (cur != null) { tops.push(cur); cur = null; } });
  assert.ok(tops.length > 2 && tops.every(t => Math.abs(t - N.PEAK) < 1e-6));
});

test('neuron: the synapse model and the drug table', () => {
  assert.deepEqual(Object.keys(N.NT).sort(), ['acetylcholine', 'dopamine', 'endorphins', 'gaba', 'glutamate', 'norepinephrine', 'serotonin', 'substanceP']);
  assert.equal(N.signalPct('none'), 100);
  assert.ok(N.signalPct('agonist') > 100);
  assert.ok(N.signalPct('reuptake') > 100);
  assert.ok(N.signalPct('antagonist') < 100);
  for (const c of ['none', 'agonist', 'antagonist', 'reuptake']) {
    const s = N.synapse(c);
    assert.ok(s.act.every(a => a >= 0 && a <= 1), `${c}: activation is a share`);
  }
  for (const d of N.DRUGS) assert.ok(N.NT[d.nt] && N.CLASSES[d.cls], d.id);
  assert.equal(N.drugById('ssri').cls, 'reuptake');
  assert.equal(N.drugById('naloxone').cls, 'antagonist');
});

test('neuron: planted mistakes are caught', () => {
  const p = N.generate(M.rng(5), ctx('lab-recording'), 'trace'), e1 = [];
  p.steps.find(s => s.key === 'count').cell.answer += 1;
  recheck(p, ctx('lab-recording'), 'planted', e1);
  assert.ok(e1.some(e => /count key/.test(e)));
  const q = N.generate(M.rng(6), ctx('squid-axon'), 'trace'), e2 = [];
  q.steps.find(s => s.key === 'gap').cell.answer = Math.abs(q.given.thresh);
  recheck(q, ctx('squid-axon'), 'planted', e2);
  assert.ok(e2.some(e => /gap key/.test(e)));
  const r = N.generate(M.rng(7), ctx('pharmacology'), 'drug'), e3 = [];
  const cs = r.steps.find(s => s.key === 'cls'); cs.correct = (cs.correct + 1) % cs.options.length;
  recheck(r, ctx('pharmacology'), 'planted', e3);
  assert.ok(e3.some(e => /class key/.test(e)));
  const t = N.generate(M.rng(8), ctx('everyday'), 'transmitter'), e4 = [];
  t.given.nt = t.given.nt === 'dopamine' ? 'serotonin' : 'dopamine';
  recheck(t, ctx('everyday'), 'planted', e4);
  assert.ok(e4.some(e => /case/.test(e)));
  const u = N.generate(M.rng(9), ctx('anatomy'), 'parts'), e5 = [];
  u.steps[0].options[u.steps[0].correct] = 'Axon hillock';
  recheck(u, ctx('anatomy'), 'planted', e5);
  assert.ok(e5.some(e => /case/.test(e)));
});
