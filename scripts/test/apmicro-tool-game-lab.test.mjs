/* Game Theory Lab: its model (microeconomics/assets/tools/math/game-lab.js) and its
   validator (scripts/lib/apmicro-tool-checks/game-lab.mjs). OWNED BY THIS TOOL
   ONLY (builder T4). The shipped data passes the full sweep (300 problems per
   context and type, every key recomputed), a seed gives the same problem
   twice, the model agrees with the validator's own arithmetic, and planted
   mistakes are caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmicro-tool-checks/_shared.mjs';
import { check, recheck, paysOf, domOf, nashOf, jointOf } from '../lib/apmicro-tool-checks/game-lab.mjs';
import { ROOT } from '../lib/apmicro-build.mjs';

const data = JSON.parse(readFileSync(join(ROOT, 'microeconomics', 'data', 'tools', 'game-lab.json'), 'utf8'));
const map = { topicById: id => (id === 'oligopoly-game-theory' ? { id } : null) };

test('game-lab: registered, page script parses, pages.json entry', () => {
  const { model } = runtime('game-lab');
  assert.ok(model && !model.stub && typeof model.generate === 'function');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'microeconomics', 'assets', 'tools', 'game-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'microeconomics', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'game-lab');
  assert.ok(entry && entry.studio === true && entry.topic === 'oligopoly-game-theory' && !entry.premium);
});

test('game-lab: the shipped data passes the full sweep', () => {
  assert.deepEqual(check(data, map), []);
});

test('game-lab: a seed gives the same problem twice', () => {
  const { M, model } = runtime('game-lab');
  for (const t of model.TYPES) for (const c of data.contexts) {
    const a = model.generate(M.rng(4242), c, t), b = model.generate(M.rng(4242), c, t);
    assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  }
});

test('game-lab: model facts match the validator’s own arithmetic (price war)', () => {
  const { model } = runtime('game-lab');
  const s = model.spec(model.gameOf('price-war')), A = JSON.parse(JSON.stringify(model.analyze(s))), P = paysOf(s);
  assert.deepEqual(A.dom, [domOf(P, 0), domOf(P, 1)]);
  assert.deepEqual(A.dom, [0, 0]);
  assert.deepEqual(A.nash, nashOf(P));
  assert.deepEqual(A.joint[0], jointOf(P));
  assert.deepEqual(A.joint[0], [1, 1]);
  // A tax of 25 on Alpha's low fare makes the high fare dominant for Alpha.
  const t = model.spec(model.gameOf('price-war'), { player: 0, strategy: 0, amount: -25 });
  assert.equal(model.analyze(t).dom[0], 1);
  assert.deepEqual([...model.test(s, 1, 1).moves.map(m => m.player)], [0, 1]);
  assert.equal(model.test(s, 0, 0).nash, true);
  assert.match(model.proof(s, 0), /Beta Jet chooses Low fare.*; if Beta Jet chooses High fare/);
});

test('game-lab: planted mistakes are caught', () => {
  const { M, model } = runtime('game-lab');
  const c = data.contexts[0];
  const plant = (t, f) => { const p = model.generate(M.rng(77), c, t); f(p); const errs = []; recheck(p, c, 'planted', errs); return errs; };
  assert.ok(plant('best', p => { p.steps.find(s => s.key === 'gain').cell.answer += 5; }).length, 'a wrong gain');
  assert.ok(plant('dominant', p => { const s = p.steps.find(x => x.key === 'proof'); s.correct = 1; }).length, 'a one-comparison proof keyed right');
  assert.ok(plant('change', p => { p.steps.find(s => s.key === 'payoff').cell.answer -= p.change.amount; }).length, 'the old payoff keyed');
  assert.ok(plant('nash', p => { p.matrix.players[0].name = 'Nobody'; }).length, 'wrong players');
});
