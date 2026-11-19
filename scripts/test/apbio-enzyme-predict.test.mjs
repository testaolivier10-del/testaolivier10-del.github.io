/* AP® Biology Enzyme activity, Test yourself (docs/tools-v2-enzyme-activity-brief.md, Recheck 1): every kind of
   challenge, for many seeds, is explained by the variable that changed. The tool's pure challenge code
   (ApBioTools.enzymePredict in bio/assets/tools/enzyme-activity.js) runs in a vm with the browser's model. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { ROOT } from '../lib/apbio-build.mjs';

const ctx = {};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync(join(ROOT, 'bio', 'assets', 'tools', 'bio-tool-math.js'), 'utf8'), ctx);
const M = ctx.ApBioMath;
// bio-tools.js's number format; mount does nothing, so only the pure code runs
ctx.ApBioTools = { F: (x, d) => { const s = M.fixed(x, d == null ? 2 : d); return s.charAt(0) === '-' ? '−' + s.slice(1) : s; }, mount() {} };
ctx.LevlKit2 = {};
vm.runInContext(readFileSync(join(ROOT, 'bio', 'assets', 'tools', 'enzyme-activity.js'), 'utf8'), ctx);
const data = JSON.parse(readFileSync(join(ROOT, 'bio', 'data', 'tools', 'enzyme-activity.json'), 'utf8'));
const PK = ctx.ApBioTools.enzymePredict(data, ctx.ApBioTools.F);

const NAMES = { S: /substrate/i, T: /°C|temperature|colder|warmer/i, pH: /\bpH\b/, I: /inhibitor/i };
const SUBSTRATE_ONLY = /empty, waiting for substrate|\(saturated\)/;

test('every challenge explanation names the variable that changed', () => {
  const seen = {};
  for (let seed = 1; seed <= 60; seed++) {
    for (let n = 0; n < 28; n++) {
      const x = PK.make(seed * 1009, n);
      assert.ok(x, `seed ${seed} n ${n}: no challenge`);
      const w = PK.why(x), key = x.ch.key, tag = `${x.p.short} ${x.ch.id} ${x.a} -> ${x.b} (${x.dir})`;
      seen[x.ch.id + ' ' + x.p.short] = true;
      assert.ok(w && w.length > 40, `${tag}: no explanation`);
      assert.match(w, NAMES[key], `${tag}: "${w}" does not name ${key}`);
      if (key !== 'S') assert.doesNotMatch(w, SUBSTRATE_ONLY, `${tag}: substrate reason for a ${key} change: "${w}"`);
      // the direction words agree with the rate
      if (x.dir === 'up') assert.doesNotMatch(w, /rate (falls|drops)|fewer products/, `${tag}: "${w}"`);
      if (x.dir === 'down') assert.doesNotMatch(w, /faster rate|more products form/, `${tag}: "${w}"`);
    }
  }
  // every kind came up, and Enzyme B's pH challenges near its best pH are among them
  for (const ch of PK.changes) assert.ok(Object.keys(seen).some(k => k.startsWith(ch.id + ' ')), `${ch.id} never made`);
});

test('Enzyme B, pH 2 to 1: the pH reason, not the substrate one (Recheck 1)', () => {
  const p = data.profiles.find(q => q.id === 'b'), ch = PK.changes.find(c => c.id === 'ph');
  const c = { S: 2, T: 37, pH: 2, inhibitor: 'none', I: 2 }, c2 = { ...c, pH: 1 };
  const w = PK.why({ p, ch, c, c2, a: 2, b: 1, dir: 'down' });
  assert.match(w, /farther from this enzyme’s best pH/);
  assert.match(w, /charges/);
  assert.doesNotMatch(w, SUBSTRATE_ONLY);
});
