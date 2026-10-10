/* The live feedback loop ("Watch it work", anatomy-physiology/assets/tools/
   feedback-loops.js) is driven by each loop's "live" block. These tests pin
   the rules the accuracy review relies on: every loop has one, a positive
   loop says what ends it, and the gauge never shows a number the loop's own
   text does not already give (docs/tools-upgrade-notes/anp-loops.md). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { check, LIVE_BROKEN } from '../lib/anp-tool-checks/feedback-loops.mjs';

const ROOT = new URL('../../', import.meta.url);
const data = JSON.parse(readFileSync(new URL('anatomy-physiology/data/tools/feedback-loops.json', ROOT), 'utf8'));
const map = JSON.parse(readFileSync(new URL('docs/anp-dependency-map.json', ROOT), 'utf8'));
const one = (id) => ({ ...data, loops: data.loops.filter((l) => l.id === id).map((l) => JSON.parse(JSON.stringify(l))) });

test('every loop has a live block the player can run', () => {
  for (const l of data.loops) {
    assert.ok(l.live && l.live.variable, l.id);
    assert.ok(['up', 'down'].includes(l.live.dir), l.id);
    assert.ok(LIVE_BROKEN.includes(l.live.broken), l.id);
    if (l.kind === 'positive') assert.ok(l.live.end, l.id + ' needs live.end');
  }
});

test('a set point number the loop text does not give is refused', () => {
  const d = one('temperature-cold');
  assert.deepEqual(check(d, map).filter((e) => /live/.test(e) && /temperature-cold/.test(e)), []);
  d.loops[0].live.setPoint = 'about 37.4 °C';
  assert.ok(check(d, map).some((e) => /number \(37\.4\)/.test(e)));
});

test('a positive loop without an ending is refused', () => {
  const d = one('childbirth');
  delete d.loops[0].live.end;
  assert.ok(check(d, map).some((e) => /live\.end/.test(e)));
});
