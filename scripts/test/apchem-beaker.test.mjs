/* AP® Chemistry live beaker (chem/assets/tools/live-beaker.js): the pure
   parts behind ApChemBeaker.mount, loaded in a vm with chem-tool-math.js as
   the browser loads them. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { ROOT } from '../lib/apchem-build.mjs';

const ctx = {};
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['chem-tool-math.js', 'live-beaker.js']) vm.runInContext(readFileSync(join(ROOT, 'chem', 'assets', 'tools', f), 'utf8'), ctx, { filename: f });
const P = ctx.ApChemBeaker.pure;
const tally = list => list.reduce((o, p) => (o[p.key] = (o[p.key] || 0) + 1, o), {});

test('slots: enough distinct places inside the liquid, same for a seed', () => {
  const s = P.slots(40, 7);
  assert.ok(s.length >= 40);
  assert.equal(JSON.stringify(s), JSON.stringify(P.slots(40, 7)));
  assert.notEqual(JSON.stringify(s), JSON.stringify(P.slots(40, 8)));
  for (const p of s) { assert.ok(p.x > 36 && p.x < 264, `x ${p.x}`); assert.ok(p.y > 72 && p.y < 254, `y ${p.y}`); }
  assert.equal(new Set(s.map(p => p.x + ',' + p.y)).size, s.length);
});

test('scale: keeps totals under max, ratios close, and every species seen', () => {
  assert.deepEqual({ ...P.scale({ A: 3, B: 0 }, 40).counts }, { A: 3, B: 0 });
  const r = P.scale({ A: 300, B: 100, C: 1 }, 40);
  const c = r.counts;
  assert.equal(c.A + c.B + c.C, 40);
  assert.ok(c.C >= 1);
  assert.ok(Math.abs(c.A / c.B - 3) < 0.4, `${c.A}/${c.B}`);
  assert.ok(r.factor < 1);
});

test('assign: matches counts, keeps ids and places, reuses freed places for the species that grows', () => {
  const a = P.assign([], { HA: 6, 'A-': 4 }, 40);
  assert.deepEqual({ ...tally(a) }, { HA: 6, 'A-': 4 });
  const b = P.assign(a, { HA: 3, 'A-': 7 }, 40);
  assert.deepEqual({ ...tally(b) }, { HA: 3, 'A-': 7 });
  const kept = b.filter(p => a.some(q => q.id === p.id));
  for (const p of kept) assert.equal(a.find(q => q.id === p.id).slot, p.slot);
  const freed = a.filter(p => !b.some(q => q.id === p.id)).map(p => p.slot).sort();
  const newA = b.filter(p => !a.some(q => q.id === p.id)).map(p => p.slot).sort();
  assert.deepEqual(newA, freed, 'the 3 new A⁻ sit where the 3 lost HA were');
  assert.equal(new Set(b.map(p => p.slot)).size, b.length, 'no two particles share a place');
  assert.equal(new Set(b.map(p => p.id)).size, b.length);
  assert.equal(P.assign(b, {}, 40).length, 0);
});

test('readout words: pH and Q vs K', () => {
  assert.equal(P.phWord(4.74), 'acidic');
  assert.equal(P.phWord(7), 'neutral');
  assert.equal(P.phWord(9.2), 'basic');
  assert.equal(P.qk(0.5, 4).dir, 'fwd');
  assert.equal(P.qk(9, 4).dir, 'rev');
  assert.equal(P.qk(4.02, 4).dir, 'eq');
  assert.equal(P.qk(1, 0).dir, '');
});

test('describe: counts by name, readout and note in words', () => {
  const sp = [{ key: 'HA', name: 'acetic acid' }, { key: 'A-', label: 'A⁻' }];
  const t = P.describe({ counts: { HA: 5, 'A-': 1 }, pH: 4.04 }, { species: sp, readout: 'pH', title: 'Buffer' });
  assert.match(t, /^Buffer: the beaker holds 5 acetic acid and 1 A⁻ particle\./);
  assert.match(t, /pH 4\.04, acidic\./);
  const q = P.describe({ counts: { A: 2 }, Q: 0.5, K: 4, note: 'Added 2 A.' }, { species: [{ key: 'A' }], readout: 'qk' });
  assert.match(q, /Q < K: the forward reaction runs/);
  assert.match(q, /Added 2 A\.$/);
});
