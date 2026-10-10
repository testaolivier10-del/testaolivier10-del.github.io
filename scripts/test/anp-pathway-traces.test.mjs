/* Pathways traced on real figures (anatomy-physiology/data/pathway-traces.json,
   tools upgrade 2026-10). Every trace must fit its pathway step for step,
   stay on its figure, and name only labels the figure really prints. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url);
const read = p => JSON.parse(readFileSync(new URL(p, ROOT), 'utf8'));
const T = read('anatomy-physiology/data/pathway-traces.json').traces;
const P = read('anatomy-physiology/data/tools/pathways.json').pathways;
const LAB = read('anatomy-physiology/data/tools/lab-practical.json').figures;

test('each trace matches its pathway and figure', () => {
  for (const [id, t] of Object.entries(T)) {
    const p = P.find(x => x.id === id);
    assert.ok(p, `${id}: no such pathway`);
    assert.equal(t.pts.length, p.steps.length, `${id}: one point per step`);
    assert.equal(t.labels.length, p.steps.length, `${id}: one label per step`);
    assert.ok(['blood', 'impulse', 'fluid', 'food'].includes(t.token), `${id}: token`);
    assert.ok(existsSync(new URL(`anatomy-physiology/figures/${t.figure}.jpg`, ROOT)), `${id}: figure file`);
    const f = LAB[t.figure];
    assert.ok(f && f.w && f.h, `${id}: figure size known`);
    for (const [x, y] of t.pts) assert.ok(x >= 0 && y >= 0 && x <= f.w && y <= f.h, `${id}: point ${x},${y} off the figure`);
    const labels = new Set(read(`anatomy-physiology/data/labels/${t.figure}.json`).labels.filter(l => !l.cover).map(l => l.id));
    for (const l of t.labels) assert.ok(l === null || labels.has(l), `${id}: ${l} is not a label on ${t.figure}`);
    for (const j of t.jump || []) assert.ok(Number.isInteger(j) && j > 0 && j < t.pts.length, `${id}: jump ${j}`);
    // two steps at one place only when they are the same structure (a pause)
    t.pts.forEach((a, i) => t.pts.forEach((b, k) => {
      if (k > i && a[0] === b[0] && a[1] === b[1]) assert.equal(t.labels[i], t.labels[k], `${id}: steps ${i + 1} and ${k + 1} share a point`);
    }));
  }
});

test('the published tool data carries the trace for built pathways', () => {
  const pub = read('anatomy-physiology/assets/tool-data/pathways.json').pathways;
  for (const id of Object.keys(T)) {
    const p = pub.find(x => x.id === id);
    if (!p) continue;
    assert.ok(p.trace && p.trace.src && p.trace.boxes.length, `${id}: published trace`);
  }
});

test('"also" labels are real labels on the figure, one list per step', () => {
  for (const [id, t] of Object.entries(T)) {
    if (!t.also) continue;
    assert.equal(t.also.length, t.labels.length, `${id}: one also list per step`);
    const labels = new Set(read(`anatomy-physiology/data/labels/${t.figure}.json`).labels.filter(l => !l.cover).map(l => l.id));
    t.also.forEach((ls, i) => ls.forEach(l => {
      assert.ok(labels.has(l), `${id}: ${l} is not a label on ${t.figure}`);
      assert.ok(!t.labels.includes(l) || t.labels[i] === l, `${id}: ${l} is another step's own label`);
    }));
  }
});
