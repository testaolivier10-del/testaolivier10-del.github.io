/* assets/courses.js, the course registry, and the two scripts built on it.

   The registry is the list every other copy is generated from or checked
   against, so a malformed entry would be copied faithfully into a dozen
   files. What is pinned here: every field present and well-formed, nothing
   two courses could collide on (key, folder, storage prefix), NREMT first
   (it is the fallback for a page outside every course), the lookups, and
   that the generated blocks and the drift check are in step today. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createBrowser } from './harness.mjs';
import { COURSES, KEYS, PAID_KEYS, DEFAULT_KEY, byKey } from '../lib/courses.mjs';
import { applyBlocks, renderBlock } from '../build-courses.mjs';

const FIELDS = {
  key: 'string', short: 'string', name: 'string', productName: 'string', path: 'string', dir: 'string',
  storagePrefix: 'string', rankLabel: 'string', searchLabel: 'string', aliases: 'object', paid: 'boolean',
  status: 'string', order: 'number',
};

function registry() {
  const b = createBrowser();
  b.load('assets/courses.js');
  return b.window.LevlCourses;
}

test('every course has every field, well formed', () => {
  assert.ok(COURSES.length >= 3);
  for (const c of COURSES) {
    assert.deepEqual(Object.keys(c).sort(), Object.keys(FIELDS).sort(), `${c.key}: fields`);
    for (const [f, type] of Object.entries(FIELDS)) assert.equal(typeof c[f], type, `${c.key}.${f}`);
    assert.match(c.key, /^[a-z][a-z0-9]*$/, `${c.key}: key is a bare lowercase id`);
    assert.match(c.dir, /^[a-z][a-z0-9-]*$/, `${c.key}: dir`);
    assert.equal(c.path, `/${c.dir}/`, `${c.key}: path is /dir/`);
    assert.equal(c.storagePrefix, `${c.key}_`, `${c.key}: storage prefix is key_`);
    assert.ok(['live', 'beta', 'hidden'].includes(c.status), `${c.key}: status`);
    assert.ok(Array.isArray(c.aliases) && c.aliases.every((a) => a === a.toLowerCase() && !KEYS.includes(a)), `${c.key}: aliases`);
    if (c.status !== 'hidden') assert.ok(existsSync(c.dir + '/index.html'), `${c.key}: ${c.dir}/index.html exists`);
  }
});

test('nothing two courses could collide on', () => {
  for (const f of ['key', 'dir', 'storagePrefix', 'order', 'short', 'name']) {
    const vals = COURSES.map((c) => c[f]);
    assert.equal(new Set(vals).size, vals.length, `duplicate ${f}`);
  }
  const aliases = COURSES.flatMap((c) => c.aliases);
  assert.equal(new Set(aliases).size, aliases.length, 'an alias names two courses');
  // A prefix that starts another would make account deletion of one wipe the other.
  for (const a of COURSES) for (const b of COURSES) {
    if (a !== b) assert.ok(!b.storagePrefix.startsWith(a.storagePrefix), `${a.storagePrefix} is a prefix of ${b.storagePrefix}`);
    if (a !== b) assert.ok(!b.path.startsWith(a.path), `${a.path} contains ${b.path}`);
  }
});

test('the three existing courses, in order, with NREMT the fallback', () => {
  assert.deepEqual(KEYS.slice(0, 3), ['nremt', 'ochem', 'anp']);
  assert.equal(DEFAULT_KEY, 'nremt');
  assert.deepEqual(COURSES.map((c) => c.order), COURSES.map((c) => c.order).slice().sort((a, b) => a - b));
  for (const k of ['nremt', 'ochem', 'anp']) assert.ok(PAID_KEYS.includes(k));
  assert.equal(byKey('anp').path, '/anatomy-physiology/');
  assert.equal(byKey('nope'), null);
});

test('the browser lookups', () => {
  const R = registry();
  assert.equal(R.defaultKey, 'nremt');
  assert.equal(R.byKey('ochem').short, 'Ochem');
  assert.equal(R.byKey('x'), null);
  assert.equal(R.keyOfPath('/ochem/lessons/pka.html'), 'ochem');
  assert.equal(R.keyOfPath('/anatomy-physiology/'), 'anp');
  assert.equal(R.keyOfPath('/nremt'), 'nremt');
  assert.equal(R.keyOfPath('/nremt-old/x.html'), null);
  assert.equal(R.keyOfPath('/search.html'), null);
  assert.deepEqual(JSON.parse(JSON.stringify(R.keys())), KEYS);
  assert.deepEqual(JSON.parse(JSON.stringify(R.paid().map((c) => c.key))), PAID_KEYS);
});

test('a generated block carries exactly the fields it names', () => {
  const src = 'a();\n  // courses:begin LIST key,short\n  var LIST = [];\n  // courses:end\nb();\n';
  const { out, n } = applyBlocks(src);
  assert.equal(n, 1);
  assert.ok(out.startsWith('a();\n') && out.endsWith('\nb();\n'));
  const LIST = new Function(out.replace(/^a\(\);|b\(\);\n$/g, '') + 'return LIST;')();
  assert.deepEqual(LIST, COURSES.map((c) => ({ key: c.key, short: c.short })));
  assert.equal(applyBlocks(out).out, out, 'applying twice changes nothing');
  assert.throws(() => renderBlock('', 'X', ['nofield']), /not a field/);
});

test('every generated copy and every per-course table is in step', () => {
  execFileSync(process.execPath, ['scripts/build-courses.mjs', '--check'], { stdio: 'pipe' });
  execFileSync(process.execPath, ['scripts/check-courses.mjs', '--check'], { stdio: 'pipe' });
});

test('consumers read the registry: rank labels and what account deletion clears', () => {
  const b = createBrowser();
  b.load('assets/hub-progress.js');
  for (const c of COURSES) assert.equal(b.window.HubProgress.award(c.key, 1).course, c.rankLabel);

  const a = createBrowser();
  a.load('assets/account.js');
  for (const c of COURSES) a.localStorage.setItem(c.storagePrefix + 'x', '1');
  a.localStorage.setItem('hub_xp', '1');
  a.localStorage.setItem('levlprep_x', '1');
  a.localStorage.setItem('other_x', '1');
  a.window.StudyHubAccount._clearLocalProgress(a.localStorage);
  assert.equal(a.localStorage.length, 1);
  assert.equal(a.localStorage.getItem('other_x'), '1');
});
