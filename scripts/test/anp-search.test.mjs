/* A&P course search with the site chrome loaded first, as on every A&P page.

   Audit 2026-10, fix 6: site-chrome.js used to set window.LevlSearch to its
   own small helper object, so anatomy-physiology/assets/apps/search.js found
   that name taken, never loaded the real engine (assets/site-search.js), and
   every query failed with "S.tokenize is not a function". This loads both
   files in one sandbox in page order, runs a query and expects results. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function el(id) {
  const listeners = {};
  return {
    id, value: '', innerHTML: '', textContent: '', href: '', style: {},
    addEventListener: (t, f) => { (listeners[t] = listeners[t] || []).push(f); },
    fire: (t, e) => (listeners[t] || []).forEach((f) => f(e || {})),
    querySelector: () => null, querySelectorAll: () => [], focus() {}, select() {},
    setAttribute() {}, classList: { add() {}, remove() {}, toggle() {} },
  };
}

function boot() {
  const els = {};
  const noop = () => {};
  let sandbox;
  const load = (p) => vm.runInContext(readFileSync(p, 'utf8'), sandbox, { filename: p });
  const document = {
    readyState: 'complete', addEventListener: noop, removeEventListener: noop,
    documentElement: { classList: { add: noop, remove: noop, toggle: noop }, setAttribute: noop, getAttribute: () => null },
    getElementById: (id) => (id === 'app' || id.startsWith('anp-sr') ? (els[id] = els[id] || el(id)) : null),
    querySelector: () => null, querySelectorAll: () => [],
    createElement: () => ({ style: {}, setAttribute: noop, appendChild: noop, addEventListener: noop, classList: { add: noop } }),
    body: { appendChild: noop, insertBefore: noop, classList: { add: noop, remove: noop, contains: () => false } },
    // A <script src> appended by search.js's loadEngine() runs at once, as the
    // browser would run it, then fires onload.
    head: { appendChild: (s) => { if (s && /site-search\.js$/.test(s.src || '')) { load('assets/site-search.js'); s.onload && s.onload(); } } },
  };
  const store = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
  const window = {
    document, localStorage: store(), sessionStorage: store(),
    location: { search: '?q=', pathname: '/anatomy-physiology/search.html', href: 'http://localhost/anatomy-physiology/search.html', origin: 'http://localhost' },
    navigator: { userAgent: 'node' }, matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }),
    addEventListener: noop, removeEventListener: noop, ANP_BASE: '', requestAnimationFrame: () => 0,
  };
  window.window = window;
  sandbox = {
    window, document, localStorage: window.localStorage, sessionStorage: window.sessionStorage, location: window.location,
    navigator: window.navigator, console, setTimeout, clearTimeout, setInterval, clearInterval, URLSearchParams, URL,
    matchMedia: window.matchMedia, requestAnimationFrame: () => 0,
    history: { replaceState: noop },
    fetch: (u) => {
      // The glossary is served from the repo; notes are left out (offline).
      if (/glossary\.json$/.test(u)) return Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(readFileSync('anatomy-physiology/assets/glossary.json', 'utf8'))) });
      return Promise.resolve({ ok: false });
    },
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  return { load, els, window };
}

const settle = () => new Promise((r) => setTimeout(r, 80));

test('site chrome does not take the search engine name', () => {
  const { load, window } = boot();
  load('assets/site-chrome.js');
  assert.equal(window.LevlSearch, undefined);
  assert.equal(typeof window.LevlSearchChrome.url, 'function');
});

test('A&P search runs a query with the site chrome loaded first', async () => {
  const { load, els, window } = boot();
  load('assets/site-chrome.js');
  load('anatomy-physiology/assets/anp-curriculum.js');
  load('anatomy-physiology/assets/apps/search.js');
  await settle();
  assert.equal(typeof window.LevlSearch.rank, 'function', 'the real engine loaded');
  const box = els['anp-sr-q'], results = els['anp-sr-results'], status = els['anp-sr-status'];
  assert.doesNotMatch(status.textContent, /did not load/);
  box.value = 'sodium';
  box.fire('input');
  await settle();
  assert.match(results.innerHTML, /class="anp-sr-hit"/, 'a query returns results');
  assert.match(status.textContent, /\d+ results?/);
});
