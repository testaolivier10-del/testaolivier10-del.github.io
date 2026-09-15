/* assets/account.js — erasing this browser's copy when an account is deleted.

   Deleting an account deletes the synced row. Progress also lives in
   localStorage, separately, and almost nobody expects that — so the delete
   screen offers to clear the browser too, on by default. This is the function
   behind that checkbox, and it is the only code on the site whose job is to
   destroy a student's work.

   Which makes both of its failure modes expensive and neither of them loud. A
   list that is too narrow leaves a streak and four months of answers sitting
   in a browser someone believes they have wiped. A list that is too wide takes
   something that was never theirs to take — and the specific case worth a test
   is the analytics opt-out, because wiping that turns "delete my account" into
   "and start tracking me again". */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

function fresh(seed) {
  const b = createBrowser();
  b.load('assets/account.js');
  for (const [k, v] of Object.entries(seed)) b.localStorage.setItem(k, v);
  return { b, clear: () => b.window.StudyHubAccount._clearLocalProgress(b.localStorage) };
}

const PROGRESS = {
  hub_xp_v1: '{"total":4200}',
  hub_activity_v1: '{"2026-09-15":{"nremt":12}}',
  nremt_seen_questions: '[1,2,3]',
  nremt_exam100_history: '[{"score":78}]',
  nremt_mastery: '{"12":{"level":3}}',
  nremt_option_order: '{"0":[1,0]}',
  ochem_progress: '{"pka":0.7}',
  ochem_mastery_v1: '{"sn2":{"s":0.8}}',
  levl_sound: 'on',
  levlprep_visits: '{"firstDay":"2026-01-02"}',
  levlprep_reported_v1: '{"nremt:5":true}',
};

test('every record of studying here is gone', () => {
  const { b, clear } = fresh(PROGRESS);
  clear();
  for (const key of Object.keys(PROGRESS)) {
    if (key === 'levlprep_analytics_opt_out') continue;
    assert.equal(b.localStorage.getItem(key), null, `${key} survived`);
  }
});

test('the analytics opt-out survives, because it is not progress', () => {
  const { b, clear } = fresh({ ...PROGRESS, levlprep_analytics_opt_out: '1' });
  clear();
  // A standing instruction not to collect something. Wiping it would silently
  // opt a departing user back in, which is the opposite of what they asked
  // for and the one thing that must outlive the account.
  assert.equal(b.localStorage.getItem('levlprep_analytics_opt_out'), '1');
});

test('a key that is nobody’s business here is left alone', () => {
  const { b, clear } = fresh({ ...PROGRESS, some_other_app: 'x', theme: 'dark' });
  // An allow-list, so the failure mode is leaving something rather than taking
  // something. On this side of the site that is the right way round.
  clear();
  assert.equal(b.localStorage.getItem('some_other_app'), 'x');
  assert.equal(b.localStorage.getItem('theme'), 'dark');
});

test('it clears every matching key, not every other one', () => {
  const seed = {};
  for (let i = 0; i < 40; i++) seed['nremt_k' + i] = String(i);
  const { b, clear } = fresh(seed);
  // Removing inside the walk renumbers the keys under the index it is walking
  // and skips half of them — the classic version of this bug, and one that
  // leaves a browser looking mostly wiped.
  const removed = clear();
  assert.equal(removed.length, 40);
  assert.equal(b.localStorage.length, 0);
});

test('the Supabase session is not this function’s to remove', () => {
  const { b, clear } = fresh({ ...PROGRESS, 'sb-abc-auth-token': '{"access_token":"x"}' });
  clear();
  // signOut() drops the session, and it has to still be there when the delete
  // RPC runs — the token is what proves whose account is being deleted.
  assert.equal(b.localStorage.getItem('sb-abc-auth-token'), '{"access_token":"x"}');
});

test('an empty browser is not an error', () => {
  const { clear } = fresh({});
  assert.deepEqual(JSON.parse(JSON.stringify(clear())), []);
});

test('a browser that refuses localStorage does not throw', () => {
  const b = createBrowser();
  b.load('assets/account.js');
  const angry = {
    get length() { throw new Error('denied'); },
    key() { throw new Error('denied'); },
    removeItem() { throw new Error('denied'); },
  };
  assert.doesNotThrow(() => b.window.StudyHubAccount._clearLocalProgress(angry));
});
