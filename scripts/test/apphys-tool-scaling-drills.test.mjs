/* Scaling drills: its model (physics/assets/tools/math/scaling-drills.js) and
   its validator (scripts/lib/apphys-tool-checks/scaling-drills.mjs). OWNED BY
   THIS TOOL ONLY. The textbook dependences ("4 times as long, twice the
   period"), unit text, conversions, contexts unlocking in course order (the
   math chapter first), the slips named, planted mistakes caught and the
   shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apphys-tool-checks/_shared.mjs';
import { check } from '../lib/apphys-tool-checks/scaling-drills.mjs';
import { loadMap, ROOT } from '../lib/apphys-build.mjs';

const { M, model: SD } = runtime('scaling-drills');
const map = loadMap();
const data = JSON.parse(readFileSync(join(ROOT, 'physics', 'data', 'tools', 'scaling-drills.json'), 'utf8'));
const near = (a, b, rel = 1e-12) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b) + 1e-15, `${a} vs ${b}`);
const p = (rel, sym) => SD.REL[rel].vars.find(v => v.sym === sym).p;

test('scaling-drills: the shipped data pass the validator (300 seeds per context and type)', () => {
  assert.deepEqual(check(data, map), []);
});

test('scaling-drills: the classic functional dependences', () => {
  near(SD.factor(p('pendulum', 'L'), 4), 2);        // L × 4 → T × 2
  near(SD.factor(p('pendulum', 'm'), 3), 1);        // the bob's mass does not matter
  near(SD.factor(p('ke', 'v'), 3), 9);              // K when speed triples
  near(SD.factor(p('gravity', 'r'), 2), 0.25);      // F when r doubles
  near(SD.factor(p('springT', 'm'), 4), 2);
  near(SD.factor(p('springT', 'k'), 4), 0.5);
  near(SD.factor(p('orbitv', 'r'), 4), 0.5);
  near(SD.factor(p('continuity', 'd'), 0.5), 4);    // half the diameter, four times the speed
  near(SD.factor(p('torricelli', 'h'), 4), 2);
});

test('scaling-drills: units text and conversions', () => {
  assert.equal(SD.dimsText([2, 1, -2]), 'kg·m²/s²');
  assert.equal(SD.dimsText([-1, 1, -2]), 'kg/(m·s²)');
  assert.equal(SD.dimsText([1, 0, -1]), 'm/s');
  assert.equal(SD.dimsText([0, 0, 1]), 's');
  near(72 * SD.CONV.kmh.k, 20);
  near(2.7 * SD.CONV.gcm3.k, 2700);
  near(125 * SD.CONV.cm3.k, 1.25e-4);
});

test('scaling-drills: contexts follow the course: the math chapter first, then each relation with its topic', () => {
  assert.equal(data.topic, 'math-proportional');
  const order = map.topics.map(t => t.id);
  const idx = data.contexts.map(c => order.indexOf(c.topic));
  assert.deepEqual(idx, [...idx].sort((a, b) => a - b), 'contexts in course order');
  assert.equal(map.topicById(data.contexts[0].topic).chapter, 'skills-math');
  for (const c of data.contexts) for (const k of c.relations || []) assert.equal(SD.REL[k].topic, c.topic);
});

test('scaling-drills: same seed, same problem; the slips named', () => {
  for (const c of data.contexts) for (const t of c.types) assert.equal(JSON.stringify(SD.generate(M.rng(4), c, t)), JSON.stringify(SD.generate(M.rng(4), c, t)));
  const ctx = data.contexts.find(c => c.id === 'shm-period');
  for (let s = 1; s < 60; s++) {
    const q = SD.generate(M.rng(s), ctx, 'factor');
    if (q.values.v !== 'L' || q.values.k !== 4) continue;
    const cell = q.steps.find(x => x.key === 'k').cell;
    assert.match(M.diagnose(cell, 4).why, /linear/);    // "4 times as long, 4 times the period"
    assert.match(M.diagnose(cell, 16).why, /ROOT/);
    return;
  }
  assert.fail('no seed gave L × 4 on the pendulum');
});

test('scaling-drills: the validator catches planted mistakes', () => {
  const bad = structuredClone(data); bad.contexts[0].relations = ['ke'];
  assert.ok(check(bad, map).some(e => /taught in kinetic-energy/.test(e)));
  const r = SD.REL.ke.vars[0], keep = r.p;
  try { r.p = 1; assert.ok(check(data, map).some(e => /power of v/.test(e))); } finally { r.p = keep; }
  const c = SD.CONV.cm3, kk = c.k;
  try { c.k = 1e-4; assert.ok(check(data, map).some(e => /conversion cm3/.test(e))); } finally { c.k = kk; }
});
