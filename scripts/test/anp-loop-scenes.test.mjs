/* Feedback loop scenes (tool review 2026-11, anatomy-physiology/assets/tools/loop-scenes.js):
   every loop has a drawing of the place in the body that answers, and each drawing is well formed. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ROOT = new URL('../../', import.meta.url);
const loops = JSON.parse(readFileSync(new URL('anatomy-physiology/data/tools/feedback-loops.json', ROOT), 'utf8')).loops;
const ctx = { window: {} };
vm.runInNewContext(readFileSync(new URL('anatomy-physiology/assets/tools/loop-scenes.js', ROOT), 'utf8'), ctx);
const A = ctx.window.AnpLoopScenes;

test('every loop has a scene', () => {
  for (const l of loops) assert.ok(A.has(l), `${l.id}: no scene in loop-scenes.js LOOPS`);
  for (const id of Object.keys(A.LOOPS)) assert.ok(loops.some(l => l.id === id), `LOOPS names ${id}, which is not a loop`);
});

test('each scene is one svg with a label and balanced tags', () => {
  for (const l of loops) {
    const s = A.svg(l);
    assert.match(s, /^<svg class="fl-scene [^"]+" viewBox="0 0 260 160" role="img" aria-label="[^"]+">/, l.id);
    assert.ok(s.endsWith('</svg>'), l.id);
    for (const t of ['g', 'text']) assert.equal((s.match(new RegExp('<' + t + '[ >]', 'g')) || []).length, (s.match(new RegExp('</' + t + '>', 'g')) || []).length, `${l.id}: <${t}> unbalanced`);
    assert.ok(!/NaN|undefined/.test(s), `${l.id}: NaN or undefined in the drawing`);
  }
});
