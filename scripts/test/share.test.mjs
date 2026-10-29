/* assets/share.js — the link every share hands out, and the sentence a
   results screen sends.

   Both fail quietly. A link that loses its own query (the course and
   milestone on a certificate URL) opens the wrong page on somebody else's
   phone; one that gains a second ref, or forgets it, makes every shared visit
   invisible to analytics.js, which only knows a share happened because of
   that tag. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

function load(){
  const b = createBrowser();
  b.load('assets/share.js');
  return b.window.LevlShare;
}

test('a root-relative link becomes absolute and gains ref=share', () => {
  const S = load();
  assert.equal(S.shareUrl('/ochem/', 'https://levlprep.com/ochem/exams.html'), 'https://levlprep.com/ochem/?ref=share');
});

test('an existing query and fragment are kept, in order', () => {
  const S = load();
  assert.equal(
    S.shareUrl('/certificate.html?course=anp&m=ch-cells#top', 'https://levlprep.com/x.html'),
    'https://levlprep.com/certificate.html?course=anp&m=ch-cells&ref=share#top'
  );
});

test('an existing ref is replaced, never doubled', () => {
  const S = load();
  assert.equal(S.shareUrl('https://levlprep.com/?ref=push&a=1', ''), 'https://levlprep.com/?a=1&ref=share');
  assert.equal(S.shareUrl('https://levlprep.com/?ref=share', ''), 'https://levlprep.com/?ref=share');
  // A parameter that merely starts with "ref" is somebody else's.
  assert.equal(S.shareUrl('https://levlprep.com/?referrer=x', ''), 'https://levlprep.com/?referrer=x&ref=share');
});

test('a page-relative link resolves against the page it was pressed on', () => {
  const S = load();
  assert.equal(S.shareUrl('dashboard.html', 'https://levlprep.com/ochem/exams.html?kind=final'), 'https://levlprep.com/ochem/dashboard.html?ref=share');
});

test('no url means the page itself', () => {
  const S = load();
  assert.equal(S.shareUrl('', 'https://levlprep.com/nremt/exams.html'), 'https://levlprep.com/nremt/exams.html?ref=share');
});

test('a result says the score, what it was on, and nothing grander', () => {
  const S = load();
  const t = S.resultText({ right: 82, total: 100, label: 'a full-length NREMT-EMT practice exam' });
  assert.equal(t, 'I scored 82% on a full-length NREMT-EMT practice exam on LevlPrep (82 of 100 right).');
  assert.doesNotMatch(t, /certif|passed|official/i);
});

test('an empty attempt does not divide by zero', () => {
  const S = load();
  assert.match(S.resultText({ right: 0, total: 0 }), /^I scored 0% on a practice set/);
});

test('an invite code rides along as r=, replacing any r= already there', () => {
  const S = load();
  assert.equal(S.shareUrl('/nremt/?r=zzzzzzzz', 'https://levlprep.com/x.html', 'abcd2345'), 'https://levlprep.com/nremt/?ref=share&r=abcd2345');
  // A malformed code is left off rather than sent.
  assert.equal(S.shareUrl('/nremt/', 'https://levlprep.com/x.html', 'NOPE'), 'https://levlprep.com/nremt/?ref=share');
});

test('myInvite makes one 8-character code with a secret, kept in this browser', () => {
  const b = createBrowser();
  b.load('assets/share.js');
  const S = b.window.LevlShare;
  const code = S.myInvite();
  assert.match(code, /^[a-z2-9]{8}$/);
  assert.equal(S.myInvite(), code);
  const kept = JSON.parse(b.window.localStorage.getItem('levlprep_invite_mine_v1'));
  assert.equal(kept.code, code);
  assert.ok(kept.secret.length >= 30);
});
