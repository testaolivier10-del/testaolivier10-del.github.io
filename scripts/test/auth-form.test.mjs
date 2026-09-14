/* assets/account.js — the three pure helpers the sign-in form is built on.

   All three exist because the honest version of the failure is invisible from
   the code: a student who cannot get back in does not file a bug, they stop
   coming. So the things being asserted here are really sentences —
   does the wrong-password case point at the reset link, does a bar that says
   "Strong" mean it, does an address that will never receive mail get caught
   before the confirmation is sent to it. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

function account(){
  const b = createBrowser();
  b.load('assets/account.js');
  return b.window.StudyHubAccount;
}

/* ---- error copy ------------------------------------------------------- */

test('a wrong password says what to do, not what the API called it', () => {
  const A = account();
  const msg = A.authMessage({ message: 'Invalid login credentials', code: 'invalid_credentials', status: 400 });
  assert.match(msg, /don’t match/);
  assert.match(msg, /reset/);
  assert.doesNotMatch(msg, /credentials/i);
});

test('signing up with an address that already exists sends you to sign in', () => {
  const A = account();
  assert.match(A.authMessage({ message: 'User already registered' }), /Sign in instead/);
});

test('an unconfirmed email mentions the spam folder, where it usually is', () => {
  const A = account();
  assert.match(A.authMessage({ code: 'email_not_confirmed', message: 'Email not confirmed' }), /spam/);
});

test('a 429 is a wait, not a failure', () => {
  const A = account();
  assert.match(A.authMessage({ status: 429, message: 'Request rate limit reached' }), /Wait a minute/);
});

test('an expired recovery link says to ask for another', () => {
  const A = account();
  assert.match(A.authMessage({ code: 'otp_expired', message: 'Token has expired or is invalid' }), /expired/);
});

test('an unrecognised error keeps its own text rather than becoming a shrug', () => {
  const A = account();
  assert.equal(A.authMessage({ message: 'Signups are disabled for this project' }),
    'Signups are disabled for this project');
});

test('an error with nothing in it still says something', () => {
  const A = account();
  assert.match(A.authMessage({}), /Something went wrong/);
  assert.match(A.authMessage(null), /Something went wrong/);
});

/* ---- password strength ------------------------------------------------ */

test('under the minimum counts down instead of just refusing', () => {
  const A = account();
  const r = A.passwordScore('abc');
  assert.equal(r.score, 0);
  assert.equal(r.label, 'Too short');
  assert.match(r.hint, /5 more characters/);
});

test('one short of the minimum says "1 more character", singular', () => {
  const A = account();
  assert.match(A.passwordScore('abcdefg').hint, /1 more character\b/);
});

test('a long password beats a short one with every character class in it', () => {
  const A = account();
  const long = A.passwordScore('correcthorsebatterystaple');
  const gnarly = A.passwordScore('P@ssw1rd');
  assert.ok(long.score > gnarly.score,
    'length has to outrank symbol variety, or the meter teaches the wrong habit');
});

test('the meter never calls a breach-list password strong, however long', () => {
  const A = account();
  const r = A.passwordScore('password123');
  assert.equal(r.score, 0);
  assert.match(r.label, /common/i);
});

test('the site\'s own name is treated as the guess it is', () => {
  const A = account();
  assert.equal(A.passwordScore('levlprep').score, 0);
});

test('an empty field advises rather than scolds', () => {
  const A = account();
  const r = A.passwordScore('');
  assert.equal(r.score, 0);
  assert.equal(r.label, '');
  assert.match(r.hint, /At least 8/);
});

test('the score stays inside the four segments the bar can draw', () => {
  const A = account();
  for(const pw of ['', 'a', 'abcdefgh', 'abcdefghij1', 'Abcdefghijkl1', 'Abcdefghijklmn1!', 'x'.repeat(200)]){
    const s = A.passwordScore(pw).score;
    assert.ok(s >= 0 && s <= 4, `${JSON.stringify(pw)} scored ${s}`);
  }
});

/* ---- email typos ------------------------------------------------------ */

test('a one-keystroke domain typo is caught before the mail is sent nowhere', () => {
  const A = account();
  assert.equal(A.emailTypo('sam@gmial.com'), 'sam@gmail.com');
  assert.equal(A.emailTypo('sam@hotmial.com'), 'sam@hotmail.com');
  assert.equal(A.emailTypo('sam@outlok.com'), 'sam@outlook.com');
});

test('the suggestion keeps the local part exactly as typed, case and plus tag', () => {
  const A = account();
  assert.equal(A.emailTypo('Sam.O+study@gmail.co'), 'Sam.O+study@gmail.com');
});

test('a domain that is merely uncommon is left alone', () => {
  const A = account();
  assert.equal(A.emailTypo('student@ucdavis.edu'), null);
  assert.equal(A.emailTypo('sam@gmail.com'), null);
});

test('half-typed and malformed addresses never produce a suggestion', () => {
  const A = account();
  for(const v of ['', 'sam', 'sam@', '@gmail.com', null, undefined]){
    assert.equal(A.emailTypo(v), null, `${JSON.stringify(v)} should not suggest anything`);
  }
});

/* ---- the mail cap is not the sign-in cap ------------------------------- */

test('a used-up mail allowance does not promise that a minute will fix it', () => {
  const A = account();
  const msg = A.authMessage({ code: 'over_email_send_rate_limit', message: 'email rate limit exceeded', status: 429 });
  // The cap is hourly and project-wide, so "wait a minute" is a false promise
  // to someone whose only real option is a different way in.
  assert.doesNotMatch(msg, /minute/);
  assert.match(msg, /hour/);
  assert.match(msg, /password/);
});

test('an ordinary sign-in rate limit still says to wait a minute', () => {
  const A = account();
  assert.match(A.authMessage({ status: 429, message: 'Request rate limit reached' }), /Wait a minute/);
});
