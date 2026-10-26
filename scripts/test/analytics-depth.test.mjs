/* The deeper analytics in assets/analytics.js (docs/analytics-plan.md):
   automation and the owner are not counted, the first-touch source rides on
   every event, answers are batched as anonymous tallies, and an exam left
   halfway is reported with where it stopped. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createBrowser } from './harness.mjs';

function page(href, opts = {}){
  const b = createBrowser();
  const u = new URL(href);
  Object.assign(b.window.location, { href: u.href, pathname: u.pathname, search: u.search, hostname: u.hostname });
  if(opts.ua) b.window.navigator.userAgent = opts.ua;
  if(opts.webdriver) b.window.navigator.webdriver = true;
    const sent = [];
  const rpcs = [];
  b.window.umami = { track: (name, data) => sent.push({ name, data }) };
  b.window.StudyHubAccount = { postRpc: (name, args) => { rpcs.push({ name, args }); return Promise.resolve(true); } };
  b.load('assets/analytics.js');
  return { b, sent, rpcs, A: b.window.LevlAnalytics };
}

test('events go to the site\'s own Worker, not cloud.umami.is', () => {
  const src = readFileSync('assets/analytics.js', 'utf8');
  assert.match(src, /var HOST_URL = 'https:\/\/api\.levlprep\.com'; \/\/ site-config:API_URL/);
});

test('a browser driven by automation is never mounted', () => {
  const { sent, A } = page('http://localhost/nremt/', { webdriver: true });
  A.mount();
  assert.equal(sent.length, 0);
  const h = page('http://localhost/nremt/', { ua: 'Mozilla/5.0 HeadlessChrome/120' });
  h.A.mount();
  assert.equal(h.sent.length, 0);
});

test('?notrack=1 turns counting off for this browser and leaves the address clean', () => {
  const { b, sent, A } = page('http://localhost/nremt/?notrack=1&x=2');
  A.mount();
  assert.equal(sent.length, 0);
  assert.equal(b.localStorage.getItem('levlprep_analytics_opt_out'), '1');
  assert.equal(b.localStorage.getItem('umami.disabled'), '1');
  assert.equal(b.window.location.search, '?x=2');
});

test('the first-touch source is kept and added to every event', () => {
  const tt = page('http://localhost/ochem/?ref=tt-sn2');
  tt.A.mount();
  assert.equal(tt.A.source(), 'tiktok');
  tt.A.event('exam-start', { mode: 'full' });
  assert.equal(tt.sent.at(-1).data.src, 'tiktok');
  assert.equal(JSON.parse(tt.b.localStorage.getItem('levlprep_first')).src, 'tiktok');

  const app = page('http://localhost/nremt/', { ua: 'Mozilla/5.0 (iPhone) musical_ly_32.0 BytedanceWebview' });
  app.A.mount();
  assert.equal(app.A.source(), 'tiktok', 'an in-app browser with no referrer is not "direct"');

  const ai = page('http://localhost/nremt/?utm_source=chatgpt.com');
  ai.A.mount();
  assert.equal(ai.A.source(), 'chatgpt');

  const plain = page('http://localhost/nremt/');
  plain.A.mount();
  assert.equal(plain.A.source(), 'direct');
});

test('answers are batched to track_answers, anonymous and cleaned', () => {
  const { rpcs, A } = page('http://localhost/nremt/practice.html');
  A.mount();
  for(let i = 0; i < 19; i++) A.answer('nremt', i, i % 2 === 0, 'Airway & Breathing');
  assert.equal(rpcs.length, 0, 'not sent before the batch fills');
  A.answer('nremt', 'bad id!', true, 'x');
  assert.equal(rpcs.length, 0, 'a malformed id is dropped');
  A.answer('nremt', 19, true, 'Airway & Breathing');
  assert.equal(rpcs.length, 1);
  const { name, args } = rpcs[0];
  assert.equal(name, 'track_answers');
  assert.equal(args.p_course, 'nremt');
  assert.equal(args.p_items.length, 20);
  assert.deepEqual(Object.keys(args.p_items[0]).sort(), ['c', 'q', 's', 't']);
  assert.equal(args.p_items[0].t, 'airway-breathing');
  assert.equal(args.p_items[0].q, '0');
});

test('opted-out browsers send no answer tallies', () => {
  const { b, rpcs, A } = page('http://localhost/nremt/practice.html');
  b.localStorage.setItem('levlprep_analytics_opt_out', '1');
  for(let i = 0; i < 25; i++) A.answer('nremt', i, true, '');
  assert.equal(rpcs.length, 0);
});

test('the source question is asked once and not over the save prompt', () => {
  const { b, A } = page('http://localhost/nremt/');
  A.mount();
  b.document.getElementById = (id) => (id === 'savePrompt' ? {} : null);
  assert.equal(A.askSource(), false, 'stands down while the save prompt is up');
  b.localStorage.setItem('levlprep_heard', 'tiktok');
  b.document.getElementById = () => null;
  assert.equal(A.askSource(), false, 'already answered');
});

test('exam date is reported in weeks, never as a date', () => {
  const { sent, A } = page('http://localhost/nremt/dashboard.html');
  A.mount();
  A.examDateSet('nremt', 40);
  const e = sent.find((x) => x.name === 'exam-date-set');
  assert.deepEqual({ course: e.data.course, weeks: e.data.weeks }, { course: 'nremt', weeks: '4-8' });
});

test('parts checked together share the time instead of the first part taking it all', () => {
  const { b, rpcs, A } = page('http://localhost/bio/tools/water-potential.html');
  A.mount();
  b.setNow(b.now() + 40000);
  for(const k of ['a', 'b', 'c', 'd']) A.answer('apbio', 'wp:' + k, true, 'water');
  b.setNow(b.now() + 30000);
  A.answer('apbio', 'wp:e', false, 'water');
  A.answer('apbio', 'exam:x', true, 'water', 12);
  for(let i = 0; i < 14; i++){ b.setNow(b.now() + 5000); A.answer('apbio', 'q' + i, true, 'water'); }
  const items = rpcs[0].args.p_items;
  assert.deepEqual([...items.slice(0, 4)].map((x) => x.s), [10, 10, 10, 10], '40 seconds over 4 parts');
  assert.equal(items[4].s, 30, 'a lone answer keeps its own time');
  assert.equal(items[5].s, 12, 'a given time (exam average) is kept');
  assert.equal(items[6].s, 5);
});
