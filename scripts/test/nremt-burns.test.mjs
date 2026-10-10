/* Burns mode of the body map (nremt/assets/burns.js): the Rule of Nines
   numbers, the child chart, and every quiz answer. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const window = {};
vm.runInNewContext(readFileSync('nremt/assets/burns.js', 'utf8'), { window });
const P = window.NremtBurns.pure;
const all = child => Object.fromEntries(P.REGIONS.map(r => [r.id, 1]));
const part = (name, child) => P.total(Object.fromEntries(P.PARTS[name].map(id => [id, 1])), child);

test('the whole body is 100% on both charts', () => {
  assert.equal(P.total(all(), false), 100);
  assert.equal(P.total(all(), true), 100);
});

test('adult Rule of Nines', () => {
  assert.equal(part('head', false), 9);
  assert.equal(part('right arm', false), 9);
  assert.equal(part('left arm', false), 9);
  assert.equal(part('anterior trunk', false), 18);
  assert.equal(part('back', false), 18);
  assert.equal(part('right leg', false), 18);
  assert.equal(part('left leg', false), 18);
  assert.equal(part('genitals', false), 1);
});

test('child chart: head 18, each leg 13.5, everything else as adult', () => {
  assert.equal(part('head', true), 18);
  assert.equal(part('right leg', true), 13.5);
  assert.equal(part('left leg', true), 13.5);
  for (const n of ['right arm', 'left arm', 'anterior trunk', 'back', 'genitals']) assert.equal(part(n, true), part(n, false), n);
});

test('a half mark is half the region', () => {
  assert.equal(P.total({ chest: 0.5 }, false), 4.5);
  assert.equal(P.total({ 'rleg-f': 0.5 }, true), 3.375);
});

test('estimate questions: the answer is offered once, and textbook cases come out right', () => {
  const by = Object.fromEntries(P.ESTIMATE.map(q => [q.id, q]));
  assert.equal(P.scenarioAnswer(by['arm-trunk']), 27); // bank question: anterior trunk + one arm = 27
  assert.equal(P.scenarioAnswer(by['both-arms']), 18);
  assert.equal(P.scenarioAnswer(by['c-head']), 18);    // bank question 533: infant head about 18
  assert.equal(P.scenarioAnswer(by['c-head-legs']), 45);
  for (const q of P.ESTIMATE) {
    const c = P.choices(q), ans = P.scenarioAnswer(q);
    assert.equal(c.filter(v => v === ans).length, 1, q.id);
    assert.ok(c.length >= 3, q.id);
    assert.equal(new Set(c).size, c.length, q.id);
  }
});

test('every paint target is reachable with whole and half regions', () => {
  for (const q of P.PAINT) {
    const vals = P.REGIONS.map(r => (q.child ? r.child : r.adult));
    // subset-sum over full and half marks, in quarter-percent steps
    let reach = new Set([0]);
    for (const v of vals) {
      const next = new Set(reach);
      for (const s of reach) { next.add(s + v * 4); next.add(s + v * 2); }
      reach = next;
    }
    assert.ok(reach.has(q.target * 4), q.id);
  }
});
