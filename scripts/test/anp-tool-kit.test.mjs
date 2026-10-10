/* The A&P tools' "See it on the 3D body" link (anatomy-physiology/assets/
   tools/tool-kit.js) may only name a structure the body map lists in its
   Browse by name panel (docs/tools-upgrade.md, body map deep link contract).
   The kit keeps its own copy of those labels; these tests fail when the copy
   and nremt/body-map.html drift apart, when an alias points at a label that
   does not exist, and when a lookup guesses. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ROOT = new URL('../../', import.meta.url);
const read = p => readFileSync(new URL(p, ROOT), 'utf8');

function kit() {
  const window = {};
  vm.runInNewContext(read('anatomy-physiology/assets/tools/tool-kit.js'), { window, document: {} });
  return window.AnpToolKit;
}
function bodyMapLabels() {
  // The labels live in the body viewer module since the Phase 1 split.
  const html = read('nremt/assets/body-viewer.js');
  const groups = JSON.parse(html.match(/const GROUP_CONTENT = (\{.*\});\n/)[1]);
  const points = JSON.parse(html.match(/const POINTS_3D = (\[.*\]);\n/)[1]);
  return [...new Set([...Object.values(groups), ...points].map(c => c.name))].sort((a, b) => a.localeCompare(b));
}

test('the kit lists exactly the body map Browse-by-name labels', () => {
  const K = kit();
  assert.deepEqual([...K.BODY].sort((a, b) => a.localeCompare(b)), bodyMapLabels());
});

test('every alias points at a real label', () => {
  const K = kit(), labels = new Set(bodyMapLabels());
  for (const [k, v] of Object.entries(K.ALIAS)) assert.ok(labels.has(v), `${k} -> ${v}`);
});

test('lookups are exact, case-insensitive, and never partial', () => {
  const K = kit();
  assert.equal(K.bodyName('heart'), 'Heart');
  assert.equal(K.bodyName('Gallbladder'), 'Gall bladder');
  assert.equal(K.bodyName('Right lung'), 'Lung');
  assert.equal(K.bodyName('Left atrium'), '');
  assert.equal(K.bodyName('Heart wall'), '');
  assert.equal(K.bodyName('Radial'), '');
  assert.equal(K.bodyName(''), '');
});
