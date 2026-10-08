/* ?ref= on the links the site sends students back on (push, email, share).
   analytics.js reads it once, reports only known values, and takes it out of
   the address bar so a bookmark or a re-share does not carry it on. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';
import { withRef } from '../../worker/src/email.js';

function landOn(href){
  const b = createBrowser();
  const u = new URL(href);
  Object.assign(b.window.location, { href: u.href, pathname: u.pathname, search: u.search });
  const sent = [];
  b.window.umami = { track: (name, data) => sent.push({ name, data }) };
  b.load('assets/analytics.js');
  b.window.LevlAnalytics.mount();
  return { b, sent };
}

test('a reminder click is reported as ref-open and on the visit', () => {
  const { b, sent } = landOn('http://localhost/ochem/review.html?ref=push&x=1#top');
  const open = sent.find(e => e.name === 'ref-open');
  assert.deepEqual({ ...open.data }, { ref: 'push', course: 'ochem' });
  assert.equal(sent.find(e => e.name === 'visit').data.ref, 'push');
  assert.equal(b.window.location.search, '?x=1', 'ref is stripped, other params kept');
});

test('an unknown ref is stripped but not reported', () => {
  const { b, sent } = landOn('http://localhost/nremt/?ref=<script>');
  assert.equal(sent.find(e => e.name === 'ref-open'), undefined);
  assert.equal(sent.find(e => e.name === 'visit').data.ref, 'none');
  assert.equal(b.window.location.search, '');
});

test('ref-open still fires when today\'s visit was already sent', () => {
  const first = landOn('http://localhost/nremt/');
  const day = first.b.localStorage.getItem('levlprep_visits');
  const b = createBrowser();
  b.localStorage.setItem('levlprep_visits', day);
  Object.assign(b.window.location, { href: 'http://localhost/nremt/?ref=email', pathname: '/nremt/', search: '?ref=email' });
  const sent = [];
  b.window.umami = { track: (name, data) => sent.push({ name, data }) };
  b.load('assets/analytics.js');
  b.window.LevlAnalytics.mount();
  assert.deepEqual([...sent.map(e => e.name)], ['ref-open']);
});

test('the email button carries ref=email', () => {
  assert.equal(withRef('https://levlprep.com/ochem/review.html?a=1', 'email'), 'https://levlprep.com/ochem/review.html?a=1&ref=email');
  assert.equal(withRef('not a url', 'email'), 'not a url');
});

test('a video tag (tt-/yt-<topic>) is reported, and a malformed one is not', () => {
  const { b, sent } = landOn('http://localhost/ochem/?ref=tt-sn2-vs-sn1');
  assert.deepEqual({ ...sent.find(e => e.name === 'ref-open').data }, { ref: 'tt-sn2-vs-sn1', course: 'ochem' });
  assert.equal(b.window.location.search, '');
  const bad = landOn('http://localhost/ochem/?ref=tt-SN2!').sent;
  assert.equal(bad.find(e => e.name === 'ref-open'), undefined);
});
