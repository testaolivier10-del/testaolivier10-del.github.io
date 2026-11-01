/* One source, one runtime (docs/apcalcbc-architecture.md, "Reuse"): AB's generator with no
   APCALC_COURSE writes exactly what is on disk (so AB is unchanged by BC), and AB's runtime
   files, run with window.ApCalcCourse = BC's config, keep BC's progress in apcalcbc_*, read
   BC's own question ids (cbc-) beside AB's (calc-), and with no config behave as AB always has. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createBrowser } from './harness.mjs';

test('AB\'s build is unchanged: build-apcalc --check is clean', () => {
  const env = { ...process.env }; delete env.APCALC_COURSE;
  const out = execFileSync(process.execPath, ['scripts/build-apcalc.mjs', '--check'], { env, encoding: 'utf8' });
  assert.match(out, /AP Calculus AB: 88 topics built/);
});

const CUR = { units: [{ id: 'unit-10', n: 10, part: 'course' }, { id: 'unit-1', n: 1, part: 'course' }], topics: [
  { id: 'ratio-test', unit: 'unit-10', built: true, free: false, qn: 15, pfx: 'cbc' }, { id: 'limit-notation', unit: 'unit-1', built: true, free: true, qn: 15 }],
  practices: [{ id: 1, name: 'x' }], practiceCounts: { 1: 10 } };
function boot(cfg) {
  const b = createBrowser();
  b.window.ApCalcCurriculum = JSON.parse(JSON.stringify(CUR));
  if (cfg) b.window.ApCalcCourse = cfg;
  b.load('calculus/assets/calc-core.js');
  return { ...b, Core: b.window.ApCalcCore };
}

test('with BC\'s config the store is apcalcbc_progress_v1 and the course key apcalcbc', () => {
  const { Core, window } = boot({ key: 'apcalcbc', name: 'AP® Calculus BC' });
  assert.equal(Core.KEY, 'apcalcbc_progress_v1'); assert.equal(Core.COURSE, 'apcalcbc');
  Core.record('cbc-ratio-test-3', true, { topic: 'ratio-test', unit: 'unit-10', practice: '3.C', level: 'apply', diff: 2 });
  Core.record('calc-limit-notation-1', false, { topic: 'limit-notation', unit: 'unit-1', practice: '1.E', level: 'apply', diff: 1 });
  assert.ok(window.localStorage.getItem('apcalcbc_progress_v1'));
  assert.equal(window.localStorage.getItem('apcalc_progress_v1'), null);
  assert.deepEqual(Object.keys(Core.load().q).sort(), ['calc-limit-notation-1', 'cbc-ratio-test-3']);
});

test('with no config the runtime is AB, as before', () => {
  const { Core } = boot();
  assert.equal(Core.KEY, 'apcalc_progress_v1'); assert.equal(Core.COURSE, 'apcalc');
});
