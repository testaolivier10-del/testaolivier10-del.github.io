/* ochem/assets/exam-core.js — what an ochem exam asks and how it is scored.

   Every failure here is silent: an exam that quietly skips a chapter, leans
   on easy questions, asks the same question twice, or resumes against a
   question the bank has since rewritten still renders and still produces a
   score. The picking tests run against the real bank and curriculum, many
   times each, because the picker is random. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createBrowser } from './harness.mjs';

const core = JSON.parse(readFileSync('ochem/assets/practice-bank-core.json', 'utf8'));

function boot(){
  const b = createBrowser();
  b.load('ochem/assets/curriculum.js');
  b.load('ochem/assets/exam-core.js');
  return b.window;
}

/* Values made inside the VM have its own Array prototype; deepEqual compares
   prototypes, so copy them out first. */
const plain = (x) => JSON.parse(JSON.stringify(x));

const DIFF = { easy: 'easy', medium: 'medium', hard: 'hard' };
function realPool(w){
  const pool = [];
  w.OchemCurriculum.MODULES.forEach((m) => m.topics.forEach((t) => {
    (core[t.id] || []).forEach((q, i) => pool.push({ id: 'lb:' + t.id + ':' + i, topic: t.id, chapter: m.id, diff: DIFF[q.difficulty] || 'medium' }));
  }));
  return pool;
}

/* A seeded generator so a failure can be replayed. */
function rng(seed){
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

test('allocate: proportional, capped, sums to n', () => {
  const X = boot().OchemExamCore;
  const out = X.allocate({ a: 1, b: 2, c: 1 }, 8, null, rng(1));
  assert.deepEqual({ ...out }, { a: 2, b: 4, c: 2 });
  const capped = X.allocate({ a: 1, b: 1 }, 10, { a: 2, b: 50 }, rng(2));
  assert.equal(capped.a, 2);
  assert.equal(capped.b, 8);
  const short = X.allocate({ a: 1, b: 1 }, 10, { a: 1, b: 2 }, rng(3));
  assert.equal(short.a + short.b, 3, 'never more than the caps allow');
});

test('allocate: min1 gives every key one before weighting', () => {
  const X = boot().OchemExamCore;
  const out = X.allocate({ big: 100, small: 1, tiny: 1 }, 5, null, rng(4), true);
  assert.ok(out.small >= 1 && out.tiny >= 1);
  assert.equal(out.big + out.small + out.tiny, 5);
});

test('chapter test: n distinct questions from that chapter, every topic covered, difficulty balanced', () => {
  const w = boot(), X = w.OchemExamCore;
  const pool = realPool(w);
  const byId = Object.fromEntries(pool.map((q) => [q.id, q]));
  for (const m of w.OchemCurriculum.MODULES) {
    const sub = pool.filter((q) => q.chapter === m.id);
    for (let seed = 1; seed <= 5; seed++) {
      const ids = X.pick(sub, 20, { rng: rng(seed * 97 + m.topics.length) });
      assert.equal(ids.length, 20, m.id);
      assert.equal(new Set(ids).size, 20, m.id + ': a question asked twice');
      const qs = ids.map((id) => byId[id]);
      assert.ok(qs.every((q) => q.chapter === m.id), m.id + ': a question from another chapter');
      const topics = new Set(qs.map((q) => q.topic));
      assert.equal(topics.size, Math.min(20, m.topics.length), m.id + ': a topic left out');
      // Topics within one of each other.
      const per = {};
      qs.forEach((q) => { per[q.topic] = (per[q.topic] || 0) + 1; });
      const counts = Object.values(per);
      assert.ok(Math.max(...counts) - Math.min(...counts) <= 1, m.id + ': topics uneven ' + counts);
      // 30/45/25 of 20 is 6/9/5; allow one either way for what a topic lacks.
      const d = { easy: 0, medium: 0, hard: 0 };
      qs.forEach((q) => d[q.diff]++);
      assert.ok(Math.abs(d.easy - 6) <= 1 && Math.abs(d.medium - 9) <= 1 && Math.abs(d.hard - 5) <= 1,
        m.id + ': difficulty ' + JSON.stringify(d));
    }
  }
});

test('final: 50 questions, every chapter at least once, weighted by topics', () => {
  const w = boot(), X = w.OchemExamCore;
  const pool = realPool(w);
  const byId = Object.fromEntries(pool.map((q) => [q.id, q]));
  const mods = w.OchemCurriculum.MODULES;
  const topicsTotal = mods.reduce((s, m) => s + m.topics.length, 0);
  for (let seed = 1; seed <= 20; seed++) {
    const ids = X.pick(pool, 50, { cumulative: true, rng: rng(seed) });
    assert.equal(ids.length, 50);
    assert.equal(new Set(ids).size, 50);
    const per = {};
    ids.forEach((id) => { const c = byId[id].chapter; per[c] = (per[c] || 0) + 1; });
    for (const m of mods) {
      assert.ok(per[m.id] >= 1, 'chapter ' + m.id + ' missing from the final');
      const share = 50 * m.topics.length / topicsTotal;
      assert.ok(Math.abs(per[m.id] - share) < 1.5, m.id + ': ' + per[m.id] + ' vs share ' + share.toFixed(2));
    }
  }
});

test('midterm range: only the chosen chapters', () => {
  const w = boot(), X = w.OchemExamCore;
  const pool = realPool(w);
  const range = new Set(w.OchemCurriculum.MODULES.slice(0, 9).map((m) => m.id));
  const sub = pool.filter((q) => range.has(q.chapter));
  const byId = Object.fromEntries(pool.map((q) => [q.id, q]));
  const ids = X.pick(sub, 40, { cumulative: true, rng: rng(7) });
  assert.equal(ids.length, 40);
  assert.ok(ids.every((id) => range.has(byId[id].chapter)));
  assert.equal(new Set(ids.map((id) => byId[id].chapter)).size, 9);
});

test('pick never asks for more than the pool holds', () => {
  const X = boot().OchemExamCore;
  const pool = [1, 2, 3].map((i) => ({ id: 'q' + i, topic: 't', chapter: 'c', diff: 'hard' }));
  assert.deepEqual(plain([...X.pick(pool, 20, { rng: rng(1) })]).sort(), ['q1', 'q2', 'q3']);
});

test('score: right, blanks, per chapter/topic/difficulty, weak topics worst first', () => {
  const X = boot().OchemExamCore;
  const items = [
    { id: 1, topic: 'a', chapter: 'c1', diff: 'easy', answer: 0, choice: 0 },
    { id: 2, topic: 'a', chapter: 'c1', diff: 'hard', answer: 1, choice: 0 },
    { id: 3, topic: 'b', chapter: 'c2', diff: 'easy', answer: 2, choice: null },
    { id: 4, topic: 'b', chapter: 'c2', diff: 'easy', answer: 0, choice: 1 },
    { id: 5, topic: 'c', chapter: 'c2', diff: 'medium', answer: 3, choice: 3 },
  ];
  const s = X.score(items);
  assert.equal(s.right, 2);
  assert.equal(s.total, 5);
  assert.equal(s.answered, 4);
  assert.equal(s.pct, 40);
  assert.deepEqual(plain(s.byChapter).map((x) => [x.key, x.c, x.n]), [['c1', 1, 2], ['c2', 1, 3]]);
  assert.deepEqual(plain(s.byDiff).map((x) => [x.key, x.c, x.n]), [['easy', 1, 3], ['hard', 0, 1], ['medium', 1, 1]]);
  assert.deepEqual(plain(s.weak).map((x) => x.key), ['b', 'a'], 'b at 0%, then a at 50%; c at 100% is not weak');
});

test('timeLeft: wall-clock deadline, no pause, untimed is infinite', () => {
  const X = boot().OchemExamCore;
  assert.equal(X.timeLeft({ deadline: 1000 }, 400), 600);
  assert.equal(X.timeLeft({ deadline: 1000 }, 5000), 0);
  assert.equal(X.timeLeft({ deadline: 0 }, 5000), Infinity);
});

test('validRun: resumes only an attempt that still matches the bank', () => {
  const X = boot().OchemExamCore;
  const bank = {
    'lb:t:0': { prompt: 'Which is more acidic?', options: ['A', 'B', 'C', 'D'] },
    'lb:t:1': { prompt: 'True or false?', options: ['True', 'False'] },
  };
  const lookup = (id) => bank[id];
  const run = {
    v: 1, ids: ['lb:t:0', 'lb:t:1'],
    hashes: [X.hash('Which is more acidic?'), X.hash('True or false?')],
    orders: [[2, 0, 3, 1], [0, 1]], choices: [3, null], flags: [false, true],
  };
  assert.equal(X.validRun(run, lookup), true);
  assert.equal(X.validRun({ ...run, v: 2 }, lookup), false);
  assert.equal(X.validRun({ ...run, choices: [9, null] }, lookup), false, 'a choice past the options');
  assert.equal(X.validRun(run, (id) => (id === 'lb:t:0' ? { ...bank[id], prompt: 'Edited stem' } : bank[id])), false, 'a stem edited since');
  assert.equal(X.validRun(run, (id) => (id === 'lb:t:1' ? null : bank[id])), false, 'a question deleted since');
  assert.equal(X.validRun(run, (id) => (id === 'lb:t:0' ? { ...bank[id], options: ['A', 'B', 'C'] } : bank[id])), false, 'an option removed since');
});

test('addHistory keeps the newest', () => {
  const X = boot().OchemExamCore;
  let h = [];
  for (let i = 0; i < X.HISTORY_MAX + 5; i++) h = X.addHistory(h, { ts: i });
  assert.equal(h.length, X.HISTORY_MAX);
  assert.equal(h[0].ts, 5);
  assert.equal(h.at(-1).ts, X.HISTORY_MAX + 4);
});
