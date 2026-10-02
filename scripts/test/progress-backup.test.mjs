/* assets/progress-backup.js — restoring a file onto a browser that already has
   progress. A restore used to clear every key and write the file's copy, so a
   month-old backup restored onto a device studied on since deleted the month.
   It now merges the way a cloud sync does; these tests hold it to that. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

// account.js always: the merge rules live there (StudyHubAccount.mergeRaw), and
// every page that offers a restore loads it. withAccount adds the subjects'
// registered merge rules on top.
function fresh(withAccount = false){
  const b = createBrowser();
  b.load('assets/account.js');
  if(withAccount){
    b.load('assets/hub-progress.js');
    b.load('ochem/assets/ochem-xp.js');
  }
  b.load('assets/progress-backup.js');
  return { B: b.window.LevlBackup, ls: b.localStorage };
}

const file = data => JSON.stringify({ format: 'levlprep-progress', version: 1, exportedAt: '2026-01-01T00:00:00Z', data });
const J = JSON.stringify;

test('an older backup cannot lower XP or forget answered questions', () => {
  const { B, ls } = fresh();
  ls.setItem('hub_xp_v1', J({ v: 1, total: 900, subjects: { nremt: 600, ochem: 300 }, badges: {} }));
  ls.setItem('nremt_seen_questions', J(['q1', 'q2', 'q3']));
  const res = B.restore(file({
    hub_xp_v1: J({ v: 1, total: 400, subjects: { nremt: 400 }, badges: {} }),
    nremt_seen_questions: J(['q1', 'q9']),
  }));
  assert.equal(res.ok, true);
  const xp = JSON.parse(ls.getItem('hub_xp_v1'));
  assert.equal(xp.total, 900);
  assert.deepEqual(xp.subjects, { nremt: 600, ochem: 300 });
  assert.deepEqual(JSON.parse(ls.getItem('nremt_seen_questions')), ['q1', 'q2', 'q3', 'q9']);
});

test('keys only this browser has survive a restore; keys only the file has arrive', () => {
  const { B, ls } = fresh();
  ls.setItem('anp_progress_v1', J({ a: 1 }));
  B.restore(file({ ochem_progress: J({ b: 2 }) }));
  assert.equal(ls.getItem('anp_progress_v1'), J({ a: 1 }));
  assert.equal(ls.getItem('ochem_progress'), J({ b: 2 }));
});

test('a timestamped record is taken whole from the side that touched it last', () => {
  const { B, ls } = fresh();
  ls.setItem('anp_flashcards_v1', J({ v: 1, cards: { c1: { t: 200, box: 3 }, c2: { t: 50, box: 1 } } }));
  B.restore(file({ anp_flashcards_v1: J({ v: 1, cards: { c1: { t: 100, box: 5 }, c2: { t: 90, box: 2 } } }) }));
  const cards = JSON.parse(ls.getItem('anp_flashcards_v1')).cards;
  assert.deepEqual(cards.c1, { t: 200, box: 3 });
  assert.deepEqual(cards.c2, { t: 90, box: 2 });
});

test('activity days union, per-day counts take the larger, streak record the longer', () => {
  const { B, ls } = fresh();
  ls.setItem('hub_activity_v1', J({ v: 1, days: { '2026-01-10': { nremt: 5 } }, longest: 4 }));
  B.restore(file({ hub_activity_v1: J({ v: 1, days: { '2026-01-10': { nremt: 2, ochem: 3 }, '2026-01-02': { nremt: 9 } }, longest: 7 }) }));
  const a = JSON.parse(ls.getItem('hub_activity_v1'));
  assert.deepEqual(a.days, { '2026-01-10': { nremt: 5, ochem: 3 }, '2026-01-02': { nremt: 9 } });
  assert.equal(a.longest, 7);
});

test('a conflicting setting keeps the side studied on more recently, unless told otherwise', () => {
  const recentHere = J({ v: 1, days: { '2026-03-01': { nremt: 1 } } });
  const olderFile = J({ v: 1, days: { '2026-01-01': { nremt: 1 } } });

  let { B, ls } = fresh();
  ls.setItem('hub_activity_v1', recentHere);
  ls.setItem('nremt_theme', 'dark');
  let p = B.plan(file({ hub_activity_v1: olderFile, nremt_theme: 'light' }));
  assert.deepEqual([...p.conflicts], ['nremt_theme']);
  assert.equal(p.newer, 'local');
  B.restore(file({ hub_activity_v1: olderFile, nremt_theme: 'light' }));
  assert.equal(ls.getItem('nremt_theme'), 'dark');

  B.restore(file({ hub_activity_v1: olderFile, nremt_theme: 'light' }), 'backup');
  assert.equal(ls.getItem('nremt_theme'), 'light');

  ({ B, ls } = fresh());
  ls.setItem('hub_activity_v1', olderFile);
  ls.setItem('nremt_theme', 'dark');
  B.restore(file({ hub_activity_v1: recentHere, nremt_theme: 'light' }));
  assert.equal(ls.getItem('nremt_theme'), 'light', 'a newer backup wins conflicts by default');
});

test('a merge rule registered with the account sync is used for that key', () => {
  const { B, ls } = fresh(true);
  // ochem's read map keeps the EARLIER read date; the generic rule would keep the later.
  ls.setItem('ochem_textbook_read', J({ pka: '2026-03-09T10:00:00.000Z' }));
  B.restore(file({ ochem_textbook_read: J({ pka: '2026-01-05T10:00:00.000Z', sn2: '2026-01-06T10:00:00.000Z' }) }));
  const read = JSON.parse(ls.getItem('ochem_textbook_read'));
  assert.equal(read.pka, '2026-01-05T10:00:00.000Z');
  assert.ok(read.sn2);
});

test('the allow-list still applies on the way in', () => {
  const { B, ls } = fresh();
  const res = B.restore(file({ sb_session: 'secret', hub_xp_v1: J({ v: 1, total: 1 }) }));
  assert.equal(res.ok, true);
  assert.equal(res.dropped, 1);
  assert.equal(ls.getItem('sb_session'), null);
});

test('restoring the same backup twice changes nothing the second time', () => {
  const { B, ls } = fresh();
  ls.setItem('nremt_exam100_history', J([{ at: 1, score: 70 }]));
  const f = file({ nremt_exam100_history: J([{ at: 2, score: 80 }]) });
  B.restore(f);
  const once = ls.getItem('nremt_exam100_history');
  const second = B.restore(f);
  assert.equal(ls.getItem('nremt_exam100_history'), once);
  assert.equal(second.written, 0);
});
