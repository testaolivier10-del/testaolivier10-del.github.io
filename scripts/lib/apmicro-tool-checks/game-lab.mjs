/* Validator for microeconomics/data/tools/game-lab.json (Game Theory Lab), run by
   scripts/check-apmicro-content.mjs. OWNED BY THIS TOOL ONLY (builder T4).
   check(data, map) -> problems: the frame, each context's players, the
   Explore games against their stated shapes, then 300 problems per context
   and type regenerated with the model the page runs (ApMicroMath.gameLab),
   every key recomputed here with this file's own arithmetic (best responses,
   dominant strategies, Nash cells, the joint cell, the changed payoffs), and
   each matrix step's key and slips graded by ApMicroGrade.matrix. */
import { frame, sweep } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['dominant', 'nash', 'best', 'change'];

/* Own arithmetic: payoffs after a change, best responses, strict dominance, Nash, joint. */
export function paysOf(spec) {
  const P = spec.payoffs.map(r => r.map(c => [c[0], c[1]]));
  const ch = spec.change;
  if (ch) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) if (ch.strategy == null || ch.strategy === (ch.player === 0 ? i : j)) P[i][j][ch.player] += ch.amount;
  return P;
}
const own = (P, p, s, o) => (p === 0 ? P[s][o][0] : P[o][s][1]);
export const bestOf = (P, p, o) => (own(P, p, 0, o) > own(P, p, 1, o) ? 0 : 1);
export function domOf(P, p) { const b0 = bestOf(P, p, 0), b1 = bestOf(P, p, 1); return b0 === b1 ? b0 : null; }
export function nashOf(P) { const out = []; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) if (bestOf(P, 0, j) === i && bestOf(P, 1, i) === j) out.push([i, j]); return out; }
export function jointOf(P) { let top = -Infinity, at = null, n = 0; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const v = P[i][j][0] + P[i][j][1]; if (v > top) { top = v; at = [i, j]; n = 1; } else if (v === top) n++; } return n === 1 ? at : null; }
const noTies = P => [0, 1].every(p => [0, 1].every(o => own(P, p, 0, o) !== own(P, p, 1, o)));
const same = (a, b) => a.length === b.length && a.every(c => b.some(d => d[0] === c[0] && d[1] === c[1]));
const right = s => s.options[s.correct];

export function recheck(p, c, w, errs) {
  const { Grade, Matrix } = runtime('game-lab');
  const need = (ok, m) => { if (!ok) errs.push(`${w}: ${m}`); };
  const s = p.matrix;
  need(s.players[0].name === c.players[0].name && s.players[1].name === c.players[1].name, 'the players are not the context’s');
  const P = paysOf(s);
  need(noTies(P), 'the matrix has a tie');
  for (const st of p.steps) {
    if (st.kind !== 'matrix') continue;
    const sp = st.spec, Q = paysOf(sp), k = Matrix.keyResponse(sp);
    need(noTies(Q), `step ${st.key}: a tie`);
    if (k.dominant) for (const q of [0, 1]) { const d = domOf(Q, q); need((d == null ? 'none' : d) === k.dominant[q], `step ${st.key}: player ${q} dominant key ${k.dominant[q]}, own arithmetic ${d}`); }
    if (k.nash) need(same(k.nash, nashOf(Q)), `step ${st.key}: the Nash key differs from own arithmetic`);
    if (k.joint) { const j = jointOf(Q); need(j && j[0] === k.joint[0] && j[1] === k.joint[1], `step ${st.key}: the joint key differs`); }
    if (k.best != null) need(bestOf(Q, sp.ask.best.player, sp.ask.best.given) === k.best, `step ${st.key}: the best-response key differs`);
    // Planted slips are graded wrong: the single largest payoff as dominant, the joint cell as the only Nash, one Nash of two.
    if (k.nash && k.nash.length === 2) need(!Grade.matrix(sp, { nash: [k.nash[0]] }).correct, `step ${st.key}: one Nash of two graded right`);
    if (k.nash && !k.nash.length && jointOf(Q)) need(!Grade.matrix(sp, { nash: [jointOf(Q)] }).correct, `step ${st.key}: the joint cell graded right as Nash`);
    if (k.dominant) { const flip = { 0: k.dominant[0] === 'none' ? 0 : 'none', 1: k.dominant[1] }; need(!Grade.matrix(sp, { dominant: flip }).correct, `step ${st.key}: a wrong dominant claim graded right`); }
  }
  if (p.type === 'dominant') {
    const pr = p.steps.find(x => x.key === 'proof');
    const who = s.players.findIndex(q => pr.label.includes(q.name));
    const d = domOf(P, who), r = right(pr);
    // Both comparisons in the right answer, each with both numbers.
    for (const o of [0, 1]) need(r.includes(`chooses ${s.players[1 - who].strategies[o]}`) && r.includes(String(own(P, who, 0, o))) && r.includes(String(own(P, who, 1, o))), `proof: comparison ${o} missing`);
    need(d == null ? /no dominant strategy/.test(r) : r.includes(`dominant strategy is ${s.players[who].strategies[d]}`), 'proof: the conclusion is wrong');
    need(pr.options.filter(o => /;/.test(o) && /chooses .*; if/.test(o)).length === 1, 'proof: more than one option gives both comparisons');
  }
  if (p.type === 'best') {
    const b = p.steps.find(x => x.key === 'best').spec.ask.best, g = p.steps.find(x => x.key === 'gain');
    const bb = bestOf(P, b.player, b.given);
    need(g.cell.answer === own(P, b.player, bb, b.given) - own(P, b.player, 1 - bb, b.given), 'gain: wrong answer');
  }
  if (p.type === 'nash') {
    const j = jointOf(P), isN = nashOf(P).some(x => x[0] === j[0] && x[1] === j[1]), r = right(p.steps.find(x => x.key === 'stable'));
    need(isN ? r.startsWith('Yes') : r.startsWith('No: at'), 'stable: the key does not match whether the joint cell is Nash');
  }
  if (p.type === 'change') {
    const ch = p.change, s1 = p.steps.find(x => x.key === 'nash').spec, P1 = paysOf(s1);
    need(s1.change && s1.change.amount === ch.amount && s1.change.player === ch.player && s1.change.strategy === ch.strategy, 'the matrix step does not carry the change');
    need(Math.abs(ch.amount) >= 10 && ch.amount % 5 === 0, 'the change is not a multiple of 5 of at least 10');
    const pf = p.steps.find(x => x.key === 'payoff'), m = /in \((.+), (.+)\) after/.exec(pf.label);
    need(!!m, 'payoff: the label names no cell');
    if (m) {
      const i = s.players[0].strategies.indexOf(m[1]), jj = s.players[1].strategies.indexOf(m[2]);
      need(pf.cell.answer === P[i][jj][ch.player] + ch.amount && pf.cell.answer === P1[i][jj][ch.player], 'payoff: wrong new payoff');
      need((ch.player === 0 ? i : jj) === ch.strategy, 'payoff: the cell is not one the change touches');
    }
    const before = nashOf(P), after = nashOf(P1), r = right(p.steps.find(x => x.key === 'moved'));
    const name = c2 => `(${s.players[0].strategies[c2[0]]}, ${s.players[1].strategies[c2[1]]})`;
    if (same(before, after)) need(r.includes('stays at ' + name(before[0])), 'moved: should say it stays');
    else if (!after.length) need(/No cell/.test(r), 'moved: should say no equilibrium');
    else need(after.every(a => r.includes(name(a))) && !r.includes('stays'), 'moved: the new equilibrium is not named');
  }
}

export function check(data, map) {
  const errs = [];
  frame(data, 'game-lab', 'skill', map, errs);
  const { model, Matrix } = runtime('game-lab');
  for (const c of data.contexts || []) {
    if (!Array.isArray(c.players) || c.players.length !== 2 || c.players.some(p => !p.name || !Array.isArray(p.strategies) || p.strategies.length !== 2)) errs.push(`context ${c.id}: two players, each with a name and two strategies`);
    if (!c.story || c.story.length < 30) errs.push(`context ${c.id}: a story of a sentence or more`);
  }
  if (!model || model.stub) { errs.push('ApMicroMath.gameLab is not built'); return errs; }
  // The Explore games: each has the shape it says, and no ties.
  for (const g of model.GAMES) {
    const s = model.spec(g), P = paysOf(s), d = [domOf(P, 0), domOf(P, 1)], n = nashOf(P), j = jointOf(P);
    if (!noTies(P) || Matrix.check(s).length) errs.push(`game ${g.id}: ties or a bad matrix`);
    const shape = d[0] != null && d[1] != null ? (n.length === 1 && j && n[0][0] === j[0] && n[0][1] === j[1] ? 'aligned' : 'dilemma') : d[0] != null || d[1] != null ? 'one' : n.length === 2 ? 'coord' : n.length ? '?' : 'none';
    if (shape !== g.shape) errs.push(`game ${g.id}: says ${g.shape}, own arithmetic gives ${shape}`);
  }
  if (errs.length) return errs;
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), () => TYPES);
  return errs;
}
