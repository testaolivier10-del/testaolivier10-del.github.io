/* assets/account.js — how a cloud pull meets what this browser already knows.

   The failure this guards against is silent and only shows up a device later:
   you read half a chapter on a phone, open the laptop, and the sections you
   just read are unticked again. That happens whenever a pull overwrites a
   local key wholesale, so the keys that are really *sets of things you have
   done* register a merge rule instead. These tests hold that rule to a union,
   and hold everything else to the old cloud-wins behaviour, since merging a
   key that is a single value would be nonsense. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

function fresh(){
  const b = createBrowser();
  b.load('assets/account.js');
  b.load('assets/hub-progress.js');
  b.load('ochem/assets/ochem-xp.js');
  return { b, A: b.window.StudyHubAccount, ls: b.localStorage };
}

const READ = 'ochem_textbook_read';

test('a pull unions the textbook read map instead of replacing it', () => {
  const { A, ls } = fresh();
  ls.setItem(READ, JSON.stringify({ resonance: '2026-02-01T10:00:00.000Z' }));
  A.applyNamespace('ochem', { [READ]: JSON.stringify({ pka: '2026-01-05T10:00:00.000Z' }) });
  const out = JSON.parse(ls.getItem(READ));
  assert.deepEqual(Object.keys(out).sort(), ['pka', 'resonance']);
});

test('a section read on both devices keeps the earlier date', () => {
  const { A, ls } = fresh();
  ls.setItem(READ, JSON.stringify({ pka: '2026-03-09T10:00:00.000Z' }));
  A.applyNamespace('ochem', { [READ]: JSON.stringify({ pka: '2026-01-05T10:00:00.000Z' }) });
  assert.equal(JSON.parse(ls.getItem(READ)).pka, '2026-01-05T10:00:00.000Z');
});

test('an empty cloud copy cannot un-read anything', () => {
  const { A, ls } = fresh();
  ls.setItem(READ, JSON.stringify({ pka: '2026-03-09T10:00:00.000Z' }));
  A.applyNamespace('ochem', { [READ]: '{}' });
  assert.deepEqual(JSON.parse(ls.getItem(READ)), { pka: '2026-03-09T10:00:00.000Z' });
});

test('a corrupt cloud copy leaves this browser alone', () => {
  const { A, ls } = fresh();
  ls.setItem(READ, JSON.stringify({ pka: '2026-03-09T10:00:00.000Z' }));
  A.applyNamespace('ochem', { [READ]: 'not json' });
  assert.deepEqual(JSON.parse(ls.getItem(READ)), { pka: '2026-03-09T10:00:00.000Z' });
});

test('keys with no merge rule still take the cloud copy', () => {
  const { A, ls } = fresh();
  ls.setItem('ochem_game_v1', '{"local":1}');
  A.applyNamespace('ochem', { ochem_game_v1: '{"cloud":1}' });
  assert.equal(ls.getItem('ochem_game_v1'), '{"cloud":1}');
});

test('a cloud bucket cannot write a key the namespace never declared', () => {
  const { A, ls } = fresh();
  A.applyNamespace('ochem', { sb_auth_token: 'stolen' });
  assert.equal(ls.getItem('sb_auth_token'), null);
});
