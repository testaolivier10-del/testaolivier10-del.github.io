/* The readiness model (assets/course/readiness.js, docs/progress-profile.md). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';
const B = createBrowser(); B.load('assets/course/readiness.js');
const R = B.window.LevlReady;

const NOW = Date.UTC(2026, 10, 13);
const bank = { A: Array(60).fill('medium').concat(Array(20).fill('hard'), Array(20).fill('easy')), B: Array(100).fill('medium') };
function answers(area, n, rate, diff, ageDays){
  const out = [];
  for(let i = 0; i < n; i++) out.push({ id: area + i, area, right: i < Math.round(n * rate) ? 1 : 0, total: 1, t: NOW - (ageDays || 0) * 864e5, diff: diff || 'medium' });
  return out;
}

test('no answers: a typical student on the bank mix, with a wide range', () => {
  const r = R.estimate({ answers: [], bank, blueprint: { A: 1, B: 1 }, now: NOW });
  assert.ok(r.value > 55 && r.value < 80, String(r.value));
  assert.ok(r.hi - r.lo > 20, 'range ' + r.lo + '-' + r.hi);
});

test('more right answers raise the estimate; more answers narrow the range', () => {
  const lo = R.estimate({ answers: answers('A', 40, 0.5).concat(answers('B', 40, 0.5)), bank, blueprint: { A: 1, B: 1 }, now: NOW });
  const hi = R.estimate({ answers: answers('A', 40, 0.9).concat(answers('B', 40, 0.9)), bank, blueprint: { A: 1, B: 1 }, now: NOW });
  const big = R.estimate({ answers: answers('A', 400, 0.9).concat(answers('B', 400, 0.9)), bank, blueprint: { A: 1, B: 1 }, now: NOW });
  assert.ok(hi.value > lo.value + 15);
  assert.ok(big.hi - big.lo < hi.hi - hi.lo);
  assert.ok(lo.value >= lo.lo && lo.value <= lo.hi);
});

test('the same share right on hard questions counts for more than on easy ones', () => {
  const easy = R.estimate({ answers: answers('B', 60, 0.7, 'easy'), bank, blueprint: { B: 1 }, now: NOW });
  const hard = R.estimate({ answers: answers('B', 60, 0.7, 'hard'), bank, blueprint: { B: 1 }, now: NOW });
  assert.ok(hard.value > easy.value + 5, easy.value + ' vs ' + hard.value);
});

test('the blueprint weighs areas: a weak heavy area pulls more than a weak light one', () => {
  const a = answers('A', 80, 0.4).concat(answers('B', 80, 0.9));
  const heavyA = R.estimate({ answers: a, bank, blueprint: { A: 4, B: 1 }, now: NOW });
  const lightA = R.estimate({ answers: a, bank, blueprint: { A: 1, B: 4 }, now: NOW });
  assert.ok(heavyA.value < lightA.value - 10);
});

test('old answers count less than recent ones', () => {
  const recentGood = R.estimate({ answers: answers('B', 50, 0.9, 'medium', 1).concat(answers('B', 50, 0.4, 'medium', 120).map(x => ({ ...x, id: 'o' + x.id }))), bank, blueprint: { B: 1 }, now: NOW });
  const recentBad = R.estimate({ answers: answers('B', 50, 0.4, 'medium', 1).concat(answers('B', 50, 0.9, 'medium', 120).map(x => ({ ...x, id: 'o' + x.id }))), bank, blueprint: { B: 1 }, now: NOW });
  assert.ok(recentGood.value > recentBad.value + 5);
});

test('repeats of one question count as at most 1.5 answers', () => {
  const once = R.estimate({ answers: [{ id: 'x', area: 'B', right: 1, total: 1, diff: 'medium', t: NOW }], bank, blueprint: { B: 1 }, now: NOW });
  const many = R.estimate({ answers: [{ id: 'x', area: 'B', right: 30, total: 30, diff: 'medium', t: NOW }], bank, blueprint: { B: 1 }, now: NOW });
  assert.ok(many.value - once.value < 4);
});

test('live difficulty replaces the written one at 20 answers', () => {
  const a = [{ id: 'q1', area: 'B', right: 1, total: 1, diff: 'easy', t: NOW }];
  const without = R.estimate({ answers: a, bank, blueprint: { B: 1 }, now: NOW });
  const few = R.estimate({ answers: a, bank, blueprint: { B: 1 }, now: NOW, live: { q1: [10, 1] } });
  const enough = R.estimate({ answers: a, bank, blueprint: { B: 1 }, now: NOW, live: { q1: [40, 4] } });
  assert.equal(few.value, without.value);
  assert.ok(enough.value > without.value);
});

test('AP band: cutoffs per course, free response counted by its share', () => {
  const mcq = { value: 75, lo: 70, hi: 80 };
  const bio = R.apBand('apbio', mcq, null);
  assert.equal(bio.band, 5);
  assert.ok(bio.lo <= bio.band && bio.hi >= bio.band);
  const weakFrq = R.apBand('apbio', mcq, { pct: 30, n: 4 });
  assert.ok(weakFrq.band < 5 && weakFrq.withFrq);
  const macro = R.apBand('apmacro', mcq, null);
  assert.equal(macro.band, 4);
  assert.equal(R.apBand('nope', mcq, null), null);
});

test('an area with no answers counts at guessing level when asked (AP: a unit not studied)', () => {
  const a = answers('A', 60, 0.8);
  const same = R.estimate({ answers: a, bank, blueprint: { A: 1, B: 1 }, now: NOW });
  const low = R.estimate({ answers: a, bank, blueprint: { A: 1, B: 1 }, now: NOW, unseen: -1.4 });
  assert.ok(low.value < same.value - 10);
  assert.ok(low.areas.B.pct < 45);
});

test('worker /outcome keeps only the allowed fields and values', async () => {
  const { outcomeRoute } = await import('../../worker/src/readiness.js');
  const sent = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => { sent.push({ url: String(url), body: JSON.parse(init.body) }); return { ok: true }; };
  try {
    const env = { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_KEY: 'k' };
    const req = b => ({ json: async () => b });
    assert.equal((await outcomeRoute(req({ course: 'nremt', result: 'maybe' }), env)).status, 400);
    assert.equal((await outcomeRoute(req({ course: 'NREMT!', result: 'pass' }), env)).status, 400);
    const ok = await outcomeRoute(req({ course: 'apbio', result: '4', predicted: 140, lo: -5, hi: 70, band: 9, answers: 120, days: 3, email: 'a@b.c' }), env);
    assert.equal(ok.status, 200);
    const row = sent[0].body;
    assert.match(sent[0].url, /exam_outcomes$/);
    assert.deepEqual(row, { course: 'apbio', result: '4', predicted: 100, lo: 0, hi: 70, band: 5, answers: 120, days: 3 });
  } finally { globalThis.fetch = realFetch; }
});
