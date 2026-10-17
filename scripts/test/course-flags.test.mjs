/* assets/course/flags.js: the flag on a question in A&P and the four AP courses.

   A flag is a promise to the student ("this stays until you remove it"), and
   breaking it is silent: nothing throws when a flag is lost on reload, kept
   by the wrong course, or left out of the backup file. So: */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createBrowser } from './harness.mjs';

function fresh(){
  const b = createBrowser();
  // flags.js dispatches a CustomEvent on every change; the harness has none.
  b.window.CustomEvent = class { constructor(type, o){ this.type = type; this.detail = o && o.detail; } };
  b.load('assets/course/flags.js');
  return b;
}

test('a flag persists per course under <course>_flagged_v1 and survives a reload', () => {
  const b = fresh();
  const F = b.window.LevlFlags;
  assert.equal(F.key('apbio'), 'apbio_flagged_v1');
  assert.equal(F.toggle('apbio', 'bio-cells-3'), true);
  assert.equal(F.toggle('anp', 'anp-heart-2'), true);
  assert.ok(F.has('apbio', 'bio-cells-3'));
  assert.ok(!F.has('apchem', 'bio-cells-3'), 'another course does not see it');
  const raw = JSON.parse(b.localStorage.getItem('apbio_flagged_v1'));
  assert.deepEqual(Object.keys(raw), ['bio-cells-3']);

  // A reload is a fresh module over the same storage.
  b.load('assets/course/flags.js');
  assert.ok(b.window.LevlFlags.has('apbio', 'bio-cells-3'));
  assert.equal(b.window.LevlFlags.count('anp'), 1);
});

test('only the student clears a flag, and the newest flag lists first', () => {
  const b = fresh();
  const F = b.window.LevlFlags;
  F.toggle('apcalc', 'a');
  b.setNow(b.now() + 1000);
  F.toggle('apcalc', 'b');
  assert.deepEqual([...F.list('apcalc')], ['b', 'a']);
  assert.equal(F.toggle('apcalc', 'a'), false);
  assert.deepEqual([...F.list('apcalc')], ['b']);
});

test('an exam-only flag lasts the session and is never stored', () => {
  const b = fresh();
  const F = b.window.LevlFlags;
  assert.equal(F.toggle('apchem', 'chem-exam-1-14', true), true);
  assert.ok(F.has('apchem', 'chem-exam-1-14'));
  assert.equal(F.count('apchem'), 0);
  assert.equal(b.localStorage.getItem('apchem_flagged_v1'), null);
});

test('a corrupt record reads as empty instead of breaking the page', () => {
  const b = fresh();
  b.localStorage.setItem('apphys_flagged_v1', '[1,2');
  assert.equal(b.window.LevlFlags.count('apphys'), 0);
  b.localStorage.setItem('apphys_flagged_v1', '["x"]');
  assert.equal(b.window.LevlFlags.count('apphys'), 0);
});

test('flags go into the progress backup and are registered for account sync', () => {
  const b = fresh();
  b.window.LevlFlags.toggle('apphys', 'phys-forces-1');
  b.load('assets/progress-backup.js');
  const snap = b.window.LevlBackup.snapshot();
  assert.ok('apphys_flagged_v1' in snap.data, 'the backup file carries the flags');
  for (const [file, course] of [['bio/assets/bio-core.js', 'apbio'], ['chem/assets/chem-core.js', 'apchem'],
    ['physics/assets/phys-core.js', 'apphys'], ['calculus/assets/calc-core.js', 'apcalc'], ['statistics/assets/stat-core.js', 'apstat'], ['anatomy-physiology/assets/anp-core.js', 'anp']]) {
    const src = readFileSync(file, 'utf8');
    assert.match(src, new RegExp(`registerNamespace\\([^)]*'${course}_flagged_v1'`), `${file} syncs ${course}_flagged_v1`);
  }
});
