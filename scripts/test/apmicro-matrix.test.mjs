/* ApMicroMatrix (microeconomics/assets/mic-matrix.js) and ApMicroGrade.matrix:
   payoff matrices as a model (best responses, dominant strategies that win
   every comparison, every pure-strategy Nash equilibrium, the joint-payoff
   cell, a payoff change such as a tax), the authored-spec checker, the grader
   (right answer scores full, each slip the Chief Reader Reports name is
   detected), the two comparisons in words, and the HTML table (accessible:
   a caption, scoped headers, a named button per cell when tapped). The same
   item format is a bank item, a lesson check item, an FRQ part and a drill
   step; the question engine and the FRQ kit route to this grader. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const B = createBrowser();
for (const f of ['mic-graph.js', 'mic-matrix.js', 'mic-grade.js']) B.load(`microeconomics/assets/${f}`);
const X = B.window.ApMicroMatrix, G = B.window.ApMicroGrade;
const plain = x => JSON.parse(JSON.stringify(x));
const players = [{ name: 'Arlo', strategies: ['Low', 'High'] }, { name: 'Bryn', strategies: ['Low', 'High'] }];
// Arlo: Low dominant (40 > 20, 70 > 50). Bryn: Low if Arlo Low (30 > 20), High if Arlo High (50 > 60? no: 60 > 50, Low). One Nash: (Low, Low).
const prisoners = { players, payoffs: [[[40, 30], [70, 20]], [[20, 60], [50, 50]]], unit: '$', do: ['dominant', 'nash'] };
// Coordination: no dominant strategy, two Nash equilibria.
const coord = { players, payoffs: [[[5, 5], [1, 2]], [[2, 1], [4, 4]]], do: ['dominant', 'nash', 'joint'] };
// Matching: no pure-strategy Nash equilibrium.
const match = { players, payoffs: [[[3, 1], [1, 3]], [[1, 3], [3, 1]]], do: ['nash'] };

test('the model: best responses, dominant strategies, Nash equilibria, joint payoff', () => {
  assert.deepEqual(plain(X.best(prisoners, 0, 0)), [0]);
  assert.deepEqual(plain(X.best(prisoners, 1, 1)), [0], 'Bryn picks Low against High: 60 > 50');
  assert.equal(X.dominant(prisoners, 0), 0);
  assert.equal(X.dominant(prisoners, 1), 0);
  assert.deepEqual(plain(X.nash(prisoners)), [[0, 0]]);
  assert.deepEqual(plain(X.joint(prisoners)), [[1, 1]], 'the cooperative cell is not the equilibrium');
  assert.equal(X.dominant(coord, 0), null);
  assert.deepEqual(plain(X.nash(coord)), [[0, 0], [1, 1]]);
  assert.deepEqual(plain(X.nash(match)), []);
});

test('a payoff change (a tax on one strategy) is applied before anything is read', () => {
  const taxed = { ...prisoners, change: { player: 0, strategy: 0, amount: -25 } };
  assert.deepEqual(plain(X.payoffs(taxed)[0][0]), [15, 30]);
  assert.deepEqual(plain(X.payoffs(taxed)[1][0]), [20, 60], 'only the taxed strategy');
  assert.equal(X.dominant(taxed, 0), 1, 'after the tax High wins both comparisons: 20 > 15 and 50 > 45');
  const every = { ...prisoners, change: { player: 1, strategy: null, amount: 10 } };
  assert.deepEqual(plain(X.payoffs(every).map(r => r.map(c => c[1]))), [[40, 30], [70, 60]], 'every cell of that player');
  assert.match(X.html(taxed), /Arlo's payoff falls by \$25 whenever it chooses Low/);
});

test('both comparisons, in words, with the numbers', () => {
  const c = plain(X.comparisons(prisoners, 0));
  assert.equal(c.length, 2);
  assert.match(c[0], /If Bryn chooses Low, Arlo earns \$40 from Low or \$20 from High, so Low is better/);
  assert.match(c[1], /If Bryn chooses High, Arlo earns \$70 from Low or \$50 from High, so Low is better/);
});

test('the checker refuses a broken shape, a tie, an unknown task, a missing best-response question', () => {
  assert.deepEqual(plain(X.check(prisoners)), []);
  assert.match(X.check({ players: [players[0]] })[0], /two players/);
  assert.match(X.check({ players, payoffs: [[[1, 2]]], do: ['nash'] })[0], /2 rows of 2 cells/);
  assert.match(X.check({ ...prisoners, payoffs: [[[40, 30], [70, 20]], [[40, 60], [50, 50]]] }).join(' '), /tie leaves "better" undecided/);
  assert.match(X.check({ ...prisoners, do: ['mixed'] }).join(' '), /unknown task "mixed"/);
  assert.match(X.check({ ...prisoners, do: ['best'] }).join(' '), /ask\.best/);
  assert.match(X.check({ ...prisoners, change: { player: 2, amount: 1 } }).join(' '), /matrix\.change/);
  assert.match(X.check({ ...prisoners, slips: { nash: 'short' } }).join(' '), /explains the slip/);
});

test('grading: the right answer scores full; the key itself grades right', () => {
  for (const s of [prisoners, coord, match, { ...prisoners, do: ['best'], ask: { best: { player: 1, given: 1 } } }]) {
    const g = G.matrix(s, X.keyResponse(s));
    assert.ok(g.correct, g.slip);
    assert.equal(g.score, 1);
  }
  assert.ok(G.matrix(match, { nashNone: true }).correct, '"no Nash equilibrium" is an answer');
});

test('every slip the reader reports is detected and named', () => {
  // Claiming a dominant strategy that does not exist (43-46% earned the point).
  const noDom = G.matrix(coord, { dominant: { 0: 0, 1: 'none' }, nash: [[0, 0], [1, 1]], joint: [0, 0] });
  assert.equal(noDom.correct, false);
  assert.match(noDom.slip, /Arlo has no dominant strategy: If Bryn chooses Low, Arlo earns 5 from Low or 2 from High, so Low is better; If Bryn chooses High, Arlo earns 1 from Low or 4 from High, so High is better/);
  // Saying "none" when there is one.
  assert.match(G.matrix(prisoners, { dominant: { 0: 'none', 1: 0 }, nash: [[0, 0]] }).slip, /Arlo does have a dominant strategy, Low/);
  // Picking the strategy with the single highest payoff.
  const top = { players, payoffs: [[[2, 1], [9, 1]], [[3, 2], [8, 2]]], do: ['dominant'] };
  assert.equal(X.dominant(top, 0), null);
  const t = G.matrix(top, { dominant: { 0: 0, 1: 'none' } });
  assert.match(t.slip, /^That strategy holds the single largest payoff, but a dominant strategy wins every comparison, not one\. Arlo has no dominant strategy/);
  // Finding one of two Nash equilibria (48% earned it).
  assert.match(G.matrix(coord, { dominant: { 0: 'none', 1: 'none' }, nash: [[0, 0]], joint: [0, 0] }).slip, /There are 2 Nash equilibria; you found 1/);
  // Marking the cooperative cell as the equilibrium.
  assert.match(G.matrix(prisoners, { dominant: { 0: 0, 1: 0 }, nash: [[1, 1]] }).slip, /most combined payoff, but it is not an equilibrium: in \(High, High\), Arlo would switch to Low \(\$70 instead of \$50\)/);
  // Saying there is no Nash equilibrium when there is.
  assert.match(G.matrix(prisoners, { dominant: { 0: 0, 1: 0 }, nashNone: true }).slip, /There is a Nash equilibrium: \(Low, Low\)/);
  // A best response read from the other player's payoffs.
  const br = { ...prisoners, do: ['best'], ask: { best: { player: 1, given: 1 } } };
  assert.match(G.matrix(br, { best: 1 }).slip, /Hold Arlo's choice fixed at High and compare only Bryn's payoffs/);
  // Joint payoff summed across cells instead of within one.
  assert.match(G.matrix(coord, { dominant: { 0: 'none', 1: 'none' }, nash: [[0, 0], [1, 1]], joint: [1, 1] }).slip, /Add the two payoffs in each cell/);
  // Nothing answered yet.
  assert.equal(G.matrix(prisoners, {}).valid, false);
  // An authored slip replaces the built-in line.
  assert.match(G.matrix({ ...prisoners, slips: { nash: 'Check each cell: would either firm gain by switching alone?' } }, { dominant: { 0: 0, 1: 0 }, nash: [[1, 1]] }).slip, /Check each cell/);
});

test('the table: a caption naming whose payoff is first, scoped headers, a named button per cell when tapped', () => {
  const h = X.html(prisoners, { tap: true, on: [[0, 0]], key: [[0, 0]] });
  assert.match(h, /<caption class="mic-mx-cap">Payoffs \(dollars\): Arlo first, Bryn second<\/caption>/);
  assert.match(h, /<th scope="colgroup"[^>]*>Bryn<\/th>/);
  assert.match(h, /<th scope="rowgroup"[^>]*><span>Arlo<\/span><\/th>/);
  assert.equal((h.match(/<button type="button" class="mic-mx-btn"/g) || []).length, 4);
  assert.match(h, /aria-label="Low and Low: Arlo \$40, Bryn \$30"/);
  assert.match(h, /class="mic-mx-cell is-on is-key"><button[^>]*aria-pressed="true"/);
  assert.doesNotMatch(X.html(prisoners), /<button/, 'read-only without tap');
});

test('the question engine and the FRQ kit route matrix items to the same grader', () => {
  B.load('microeconomics/assets/mic-questions.js');
  const Q = B.window.ApMicroQuestions;
  const g = Q.grade({ type: 'matrix', matrix: prisoners }, X.keyResponse(prisoners));
  assert.ok(g.correct && g.score === 1);
  const w = Q.grade({ type: 'matrix', matrix: prisoners }, { dominant: { 0: 0, 1: 0 }, nash: [[1, 1]] });
  assert.equal(w.correct, false);
  assert.equal(w.right, 1);
  assert.equal(w.total, 2);
});
