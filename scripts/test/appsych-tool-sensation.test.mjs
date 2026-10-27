/* Sensation and perception: its model (psychology/assets/tools/math/sensation.js)
   and its validator (scripts/lib/appsych-tool-checks/sensation.mjs). OWNED BY
   THIS TOOL ONLY (builder T2). The frame and registration (Premium); the
   shipped data passing (300 problems per context and type, every key
   recomputed); same seed same problem; planted mistakes caught; and the
   science: signal detection from the normal curve (a stricter criterion
   lowers hits and false alarms, a stronger signal raises hits alone),
   Weber's law proportional, the detection curve 50% at threshold, opponent
   pairs. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/appsych-tool-checks/_shared.mjs';
import { check, recheck } from '../lib/appsych-tool-checks/sensation.mjs';
import { ROOT, loadMap } from '../lib/appsych-build.mjs';

const { M, model: X } = runtime('sensation');
const data = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'tools', 'sensation.json'), 'utf8'));
const ctx = id => data.contexts.find(c => c.id === id);

test('sensation: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  assert.ok(X && typeof X.generate === 'function' && !X.stub, 'ApPsychMath.sensation is the real model');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'psychology', 'assets', 'tools', 'sensation.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'sensation');
  assert.ok(entry && entry.studio === true, 'registered in pages.json on the Tool Studio');
  assert.equal(entry.topic, 'sensation');
  assert.equal(entry.premium, 'tools');
  const map = { topicById: id => id === 'sensation' ? { id } : null };
  const ok = { slug: 'sensation', kind: 'simulator', topic: 'sensation', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'sensation', types: ['afterimage'] }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
});

test('sensation: the shipped data passes (300 problems per context and type, every key rechecked)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('sensation: the same seed gives the same problem, for every type', () => {
  for (const c of data.contexts) for (const t of c.types) {
    const a = X.generate(M.rng(777), c, t), b = X.generate(M.rng(777), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b), `${c.id} ${t}`);
    assert.equal(a.type, t);
  }
});

test('sensation: signal detection, Weber and thresholds behave as the science says', () => {
  const mid = X.sdt(1.5, 0.75), strict = X.sdt(1.5, 1.75), lenient = X.sdt(1.5, -0.25), strong = X.sdt(2.5, 0.75);
  assert.ok(Math.abs(mid.hit + mid.miss - 100) < 1e-9 && Math.abs(mid.fa + mid.cr - 100) < 1e-9);
  assert.ok(strict.hit < mid.hit && strict.fa < mid.fa, 'stricter: fewer hits and fewer false alarms');
  assert.ok(lenient.hit > mid.hit && lenient.fa > mid.fa, 'more lenient: more of both');
  assert.ok(strong.hit > mid.hit && Math.abs(strong.fa - mid.fa) < 1e-9, 'a stronger signal raises hits, not false alarms');
  assert.ok(Math.abs(X.sdt(0, 0).hit - 50) < 1e-6, 'no signal, criterion in the middle: chance');
  assert.equal(X.jnd(200, 0.08), 2 * X.jnd(100, 0.08), 'the JND is proportional to the stimulus');
  assert.ok(Math.abs(X.detect(10, 10, 2) - 50) < 1e-9 && X.detect(14, 10, 2) > 50 && X.detect(6, 10, 2) < 50);
  for (const [a, b] of Object.entries(X.AFTER)) assert.equal(X.AFTER[b], a, `${a} and ${b} are a pair`);
});

test('sensation: planted mistakes are caught', () => {
  const p = X.generate(M.rng(5), ctx('radiology'), 'sdt'), e1 = [];
  p.steps.find(s => s.key === 'rate').cell.answer += 5;
  recheck(p, ctx('radiology'), 'planted', e1);
  assert.ok(e1.some(e => /rate key/.test(e)));
  const q = X.generate(M.rng(6), ctx('weights'), 'weber'), e2 = [];
  q.given.k = 0.1;
  recheck(q, ctx('weights'), 'planted', e2);
  assert.ok(e2.some(e => /Weber fraction/.test(e)));
  const r = X.generate(M.rng(7), ctx('vision-lab'), 'afterimage'), e3 = [];
  const cs = r.steps.find(s => s.key === 'color'); cs.correct = (cs.correct + 1) % cs.options.length;
  recheck(r, ctx('vision-lab'), 'planted', e3);
  assert.ok(e3.some(e => /afterimage/.test(e)));
  const u = X.generate(M.rng(8), ctx('depth-art'), 'depth'), e4 = [];
  u.given.cue = u.given.cue === 'convergence' ? 'interposition' : 'convergence';
  recheck(u, ctx('depth-art'), 'planted', e4);
  assert.ok(e4.some(e => /scene/.test(e)));
});
