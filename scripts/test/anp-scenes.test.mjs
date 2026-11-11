/* Scene plates for the pathway tracer and Predict the change
   (anatomy-physiology/data/scenes.json, pathway-scenes.json,
   predict-scenes.json; tool redesign 2026-11). Every scene must sit on a
   registered figure with its places inside the picture; every pathway and
   scenario entry must fit its item step for step (or variable for variable)
   and name only places its scene has. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url);
const read = p => JSON.parse(readFileSync(new URL(p, ROOT), 'utf8'));
const SC = read('anatomy-physiology/data/scenes.json').scenes;
const PS = read('anatomy-physiology/data/pathway-scenes.json').pathways;
const QS = read('anatomy-physiology/data/predict-scenes.json').scenarios;
const P = read('anatomy-physiology/data/tools/pathways.json').pathways;
const Q = read('anatomy-physiology/data/tools/predict.json').scenarios;
const FIG = {};
for (const f of readdirSync(new URL('anatomy-physiology/data/figures/', ROOT))) Object.assign(FIG, read(`anatomy-physiology/data/figures/${f}`));
const labelsOf = id => existsSync(new URL(`anatomy-physiology/data/labels/${id}.json`, ROOT)) ? read(`anatomy-physiology/data/labels/${id}.json`).labels : [];
const sizeOf = id => {
  // OpenStax figures carry their size in the lab practical's figure list or
  // their labels' extent; read the JPG header when neither is set.
  const f = FIG[id];
  if (f && f.w && f.h) return [f.w, f.h];
  const buf = readFileSync(new URL(`anatomy-physiology/figures/${id}.jpg`, ROOT));
  for (let i = 2; i < buf.length;) {
    if (buf[i] !== 0xFF) return null;
    const m = buf[i + 1], len = buf.readUInt16BE(i + 2);
    if (m >= 0xC0 && m <= 0xC3) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
    i += 2 + len;
  }
  return null;
};

test('each scene sits on a registered figure, with its places inside it', () => {
  for (const [id, s] of Object.entries(SC)) {
    assert.ok(FIG[s.figure], `${id}: ${s.figure} is not a registered figure`);
    const ext = FIG[s.figure].ext || 'jpg';
    assert.ok(existsSync(new URL(`anatomy-physiology/figures/${s.figure}.${ext}`, ROOT)), `${id}: figure file`);
    const wh = sizeOf(s.figure);
    assert.ok(wh, `${id}: figure size`);
    assert.ok(s.title && Object.keys(s.places).length, `${id}: title and places`);
    for (const [pid, pl] of Object.entries(s.places)) {
      assert.ok(pl.name, `${id}.${pid}: name`);
      const [x, y] = pl.pt;
      assert.ok(x >= 0 && y >= 0 && x <= wh[0] && y <= wh[1], `${id}.${pid}: ${x},${y} is off the ${wh.join('x')} figure`);
    }
    if (Array.isArray(s.hide)) {
      const ids = new Set(labelsOf(s.figure).map(l => l.id));
      for (const l of s.hide) assert.ok(ids.has(l), `${id}: hide names ${l}, not a label on ${s.figure}`);
    } else assert.ok(s.hide === undefined || s.hide === true, `${id}: hide is true or a list`);
    for (const b of s.cover || []) assert.ok(b.length === 4 && b.every(Number.isFinite), `${id}: cover box`);
  }
});

test('each pathway entry fits its pathway step for step', () => {
  for (const [id, a] of Object.entries(PS)) {
    const p = P.find(x => x.id === id);
    assert.ok(p, `${id}: no such pathway`);
    assert.ok(SC[a.scene], `${id}: no scene ${a.scene}`);
    assert.equal(a.at.length, p.steps.length, `${id}: one place (or null) per step`);
    assert.ok(a.at.filter(Boolean).length >= 2, `${id}: at least two steps placed`);
    for (const x of a.at) assert.ok(x === null || SC[a.scene].places[x], `${id}: ${x} is not a place on ${a.scene}`);
  }
});

test('each scenario entry fits its scenario variable for variable', () => {
  for (const [id, a] of Object.entries(QS)) {
    const s = Q.find(x => x.id === id);
    assert.ok(s, `${id}: no such scenario`);
    assert.ok(SC[a.scene], `${id}: no scene ${a.scene}`);
    assert.ok(a.start === null || SC[a.scene].places[a.start], `${id}: start ${a.start}`);
    const vars = new Set((s.stages ? s.stages.flatMap(st => st.variables) : s.variables).map(v => v.id));
    for (const v of vars) assert.ok(v in a.vars, `${id}: variable ${v} has no entry`);
    for (const [v, x] of Object.entries(a.vars)) {
      assert.ok(vars.has(v), `${id}: ${v} is not a variable of the scenario`);
      assert.ok(x === null || SC[a.scene].places[x], `${id}: ${x} is not a place on ${a.scene}`);
    }
  }
});

test('the published tool data carries the scene for built items', () => {
  const pub = read('anatomy-physiology/assets/tool-data/pathways.json').pathways;
  for (const id of Object.keys(PS)) {
    const p = pub.find(x => x.id === id);
    if (!p) continue;
    assert.ok(p.scene && p.scene.src && p.scene.w && p.scene.pts.length === p.steps.length, `${id}: published scene`);
  }
  const pq = read('anatomy-physiology/assets/tool-data/predict.json').scenarios;
  for (const id of Object.keys(QS)) {
    const s = pq.find(x => x.id === id);
    if (!s) continue;
    assert.ok(s.scene && s.scene.src && s.scene.vars, `${id}: published scene`);
  }
});
