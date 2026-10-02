/* A&P bank loading (audit 2026-10): Practice, Review and Exams used to fetch
   all 54 bank files before showing anything. Now they read the index, fetch
   only the chapters a set draws from, and each chapter's explanations after
   a question is answered. These run AnpCore against the built files. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';

const BANK = 'anatomy-physiology/assets/bank/';

function boot() {
  const fetched = [];
  const noop = () => {};
  const store = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
  const document = { readyState: 'complete', addEventListener: noop, removeEventListener: noop, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, createElementNS: () => ({ setAttribute: noop, appendChild: noop, style: {} }), documentElement: { classList: { add: noop } }, body: { appendChild: noop, insertBefore: noop }, head: { appendChild: noop } };
  const window = { localStorage: store(), document, location: { search: '', href: 'http://localhost/' }, addEventListener: noop, removeEventListener: noop, ANP_BASE: '' };
  window.window = window;
  const sandbox = {
    window, document, localStorage: window.localStorage, location: window.location, console, setTimeout, clearTimeout, URLSearchParams,
    fetch: (u) => {
      fetched.push(u);
      const rel = String(u).replace(/^\.\.\//, '');
      try { const body = readFileSync('anatomy-physiology/' + rel, 'utf8'); return Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(body)) }); }
      catch { return Promise.resolve({ ok: false, status: 404 }); }
    },
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  const load = (p) => vm.runInContext(readFileSync(p, 'utf8'), sandbox, { filename: p });
  load('anatomy-physiology/assets/anp-curriculum.js');
  load('anatomy-physiology/assets/anp-core.js');
  return { Core: window.AnpCore, fetched };
}
const plain = (x) => JSON.parse(JSON.stringify(x));

test('the index lists every built question with the fields sets are built from', async () => {
  const { Core, fetched } = boot();
  const stubs = plain(await Core.loadIndex(''));
  const full = readdirSync(BANK).filter((f) => f.endsWith('.json') && !f.endsWith('-why.json') && f !== 'index.json')
    .flatMap((f) => JSON.parse(readFileSync(BANK + f, 'utf8')));
  assert.equal(stubs.length, full.length);
  const byId = new Map(full.map((q) => [q.id, q]));
  for (const s of stubs) {
    const q = byId.get(s.id);
    assert.ok(q, `index id ${s.id} is in the bank`);
    for (const k of ['topic', 'chapter', 'course', 'teas', 'type', 'level', 'diff']) assert.deepEqual(s[k], q[k], `${s.id} ${k}`);
    assert.deepEqual(s.core, q.core || [], `${s.id} core`);
  }
  assert.deepEqual(fetched, ['assets/bank/index.json']);
});

test('a set fetches only its own chapters, and no explanations', async () => {
  const { Core, fetched } = boot();
  const stubs = await Core.loadIndex('');
  const pick = [stubs.find((q) => q.chapter === 'blood'), stubs.find((q) => q.chapter === 'urinary')];
  const qs = await Core.loadQuestions('', pick);
  assert.deepEqual(plain(qs.map((q) => q.id)), pick.map((q) => q.id));
  assert.ok(qs.every((q) => q.options || q.variables), 'full questions');
  assert.ok(qs.every((q) => !q.why), 'no explanation yet');
  assert.deepEqual(fetched.slice().sort(), ['assets/bank/blood.json', 'assets/bank/index.json', 'assets/bank/urinary.json']);
  // Ids alone work too (review stores ids).
  const again = await Core.loadQuestions('', [pick[0].id]);
  assert.equal(again[0].id, pick[0].id);
  assert.equal(fetched.filter((u) => u === 'assets/bank/blood.json').length, 1, 'each file once');
});

test('the explanation arrives after the answer, one file per chapter', async () => {
  const { Core, fetched } = boot();
  const stubs = await Core.loadIndex('');
  const two = stubs.filter((q) => q.chapter === 'blood').slice(0, 2);
  const qs = await Core.loadQuestions('', two);
  await Core.loadWhy('', qs[0]);
  await Core.loadWhy('', qs[1]);
  assert.ok(qs[0].why && qs[0].why.correct, 'explanation merged');
  assert.equal(fetched.filter((u) => u === 'assets/bank/blood-why.json').length, 1);
  const pr = stubs.find((q) => q.type === 'predict');
  const [p] = await Core.loadQuestions('', [pr]);
  assert.ok(p.variables.every((v) => v.answer && !v.why), 'predict keys without their reasons');
  await Core.loadWhy('', p);
  assert.ok(p.variables.every((v) => v.answer && v.why), 'reasons merged');
});
