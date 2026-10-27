/* Conditioning lab: its model (psychology/assets/tools/math/conditioning-lab.js)
   and its validator (scripts/lib/appsych-tool-checks/conditioning-lab.mjs).
   OWNED BY THIS TOOL ONLY (builder T3). The frame; the shipped data passing
   (300 problems per context and type, every key rechecked); same seed, same
   problem; planted mistakes caught; the slips named (negative reinforcement
   is not punishment, UCR vs CR, extinction vs spontaneous recovery); and the
   models keep the published shapes (acquisition rises and levels,
   extinction falls, a rest brings a weaker CR back; the four cumulative
   records). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/appsych-tool-checks/_shared.mjs';
import { check, recheck, shapes } from '../lib/appsych-tool-checks/conditioning-lab.mjs';
import { loadMap, ROOT } from '../lib/appsych-build.mjs';

const { M, Stats, model: CL } = runtime('conditioning-lab');
const data = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'tools', 'conditioning-lab.json'), 'utf8'));
const ctx = id => data.contexts.find(c => c.id === id);

test('conditioning-lab: registers, the page script parses, it is registered, the frame is checked', () => {
  assert.ok(CL && typeof CL.generate === 'function' && !CL.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'psychology', 'assets', 'tools', 'conditioning-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'conditioning-lab');
  assert.ok(entry && entry.studio === true);
  assert.equal(entry.topic, 'classical-conditioning');
  assert.equal(entry.premium, 'tools');
  const map = loadMap();
  const ok = { slug: 'conditioning-lab', kind: 'simulator', topic: 'classical-conditioning', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'classical-conditioning', types: ['labels'] }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, contexts: [{ id: 'c1', topic: 'classical-conditioning', types: ['nope'] }] }, map).some(e => /unknown type/.test(e)));
});

test('conditioning-lab: the shipped data passes (300 problems per context and type, every key rechecked)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('conditioning-lab: the same seed gives the same problem, for every type', () => {
  for (const c of data.contexts) for (const t of c.types) {
    const a = CL.generate(M.rng(777), c, t), b = CL.generate(M.rng(777), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b), `${c.id} ${t}`);
    assert.equal(a.type, t);
  }
});

test('conditioning-lab: planted mistakes are caught', () => {
  const plant = (id, t, seed, f, re) => {
    const p = CL.generate(M.rng(seed), ctx(id), t), e = [];
    f(p); recheck(p, ctx(id), 'planted', e);
    assert.ok(e.some(x => re.test(x)), `${id} ${t}: ${e.join('; ') || 'nothing caught'}`);
  };
  // The UCR offered as the CR (the classic slip).
  plant('everyday-cc', 'labels', 3, p => { const s = p.steps.find(x => x.key === 'cs'); s.correct = s.options.findIndex((o, i) => i !== s.correct); }, /cs key/);
  plant('pavlov-record', 'phases', 4, p => { p.steps.find(s => s.key === 'mean').cell.answer += 1; }, /mean key/);
  plant('pavlov-record', 'phases', 5, p => { const s = p.steps.find(x => x.key === 'phase'); s.correct = (s.correct + 1) % s.options.length; }, /phase key/);
  plant('schedules', 'schedule', 6, p => { const s = p.steps.find(x => x.key === 'sched'); s.correct = (s.correct + 1) % 4; }, /schedule key/);
  plant('consequences', 'operant', 7, p => { p.given.up = !p.given.up; }, /term key|reinforced-or-punished/);
});

test('conditioning-lab: the drill feedback names the slips', () => {
  // Every negative-reinforcement item explains why punishment is wrong, and vice versa.
  let negR = 0, punish = 0;
  for (let s = 1; s < 200; s++) {
    const p = CL.generate(M.rng(s), ctx('consequences'), 'operant'), st = p.steps.find(x => x.key === 'name');
    if (p.given.name === 'Negative reinforcement') { negR++; assert.ok(st.why.some((w, i) => i !== st.correct && /Negative does not mean bad/.test(w))); }
    if (/punishment/.test(p.given.name)) { punish++; const k = st.options.indexOf('Negative reinforcement.'); assert.match(st.why[k], /increases a behavior/); }
  }
  assert.ok(negR > 5 && punish > 5, 'both kinds come up');
  // UCR vs CR: a wrong pick names the label it actually is.
  const l = CL.generate(M.rng(9), ctx('everyday-cc'), 'labels'), cr = l.steps.find(s => s.key === 'cr') || l.steps[0];
  assert.ok(cr.why.every((w, i) => i === cr.correct || /^That is the (unconditioned|conditioned) (stimulus|response)/.test(w)));
  // Continuous reinforcement is named as the fastest to extinguish.
  const sc = CL.generate(M.rng(10), ctx('schedules'), 'schedule'), rs = sc.steps.find(s => s.key === 'resist');
  assert.ok(rs.why.some(w => /extinguished fastest/.test(w)));
});

test('conditioning-lab: the classical model rises, levels, extinguishes and recovers', () => {
  const t = [...Array(10).fill('pair'), ...Array(10).fill('tone'), 'rest', 'tone'];
  const { cr, v } = CL.classical(t);
  for (let i = 1; i < 10; i++) assert.ok(cr[i] > cr[i - 1] && cr[i] - cr[i - 1] < cr[i - 1] - (i > 1 ? cr[i - 2] : 0) + 1e-9, 'acquisition rises, each gain smaller');
  for (let i = 11; i < 20; i++) assert.ok(cr[i] < cr[i - 1], 'extinction falls');
  assert.ok(cr[21] > cr[19] && cr[21] < cr[9], 'spontaneous recovery: back, but weaker');
  assert.ok(v.every(x => x >= 0 && x <= 1));
  assert.equal(CL.classical(['tone', 'tone']).cr.join(), '0,0', 'a tone never paired brings nothing');
});

test('conditioning-lab: the four cumulative records keep their shapes', () => {
  const sh = shapes(CL);
  assert.ok(sh.vr.rate > sh.fr.rate && sh.fr.rate > sh.vi.rate && sh.vi.rate > sh.fi.rate, JSON.stringify(sh));
  assert.ok(sh.fi.late > 4 * sh.fi.early, 'fixed-interval scallops');
  assert.ok(sh.fr.early === 0 || sh.fr.late > 3 * sh.fr.early, 'fixed-ratio post-reward pause');
  // FR rewards exactly every 30th press.
  const fr = CL.session('fr', 3, 10);
  fr.rewards.forEach((t, i) => assert.equal(fr.presses.indexOf(t) + 1, 30 * (i + 1)));
  // The cumulative record counts presses: it never falls and ends at the total.
  const cum = CL.cumulative(fr.presses, 10, 0.5);
  assert.ok(cum.every((q, i) => !i || q[1] >= cum[i - 1][1]));
  assert.equal(cum[cum.length - 1][1], fr.presses.length);
  // A mean of the VR requirements is close to 30 (the schedule's number).
  const vr = CL.session('vr', 4, 10), gaps = vr.rewards.map((t, i) => vr.presses.indexOf(t) - (i ? vr.presses.indexOf(vr.rewards[i - 1]) : -1));
  assert.ok(Math.abs(Stats.mean(gaps) - 30) < 5, `VR mean requirement ${Stats.mean(gaps)}`);
});
