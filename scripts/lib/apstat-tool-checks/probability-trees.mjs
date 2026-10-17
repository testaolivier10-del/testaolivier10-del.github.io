/* Validator for statistics/data/tools/probability-trees.json (Probability
   trees), run by scripts/check-apstat-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. The frame; every explore scene (three
   probabilities in [0, 1], the joint table adding to 1, the Venn overlap
   matching P(A and B) to 1e-6); every context (the ranges are probabilities,
   the event words and table captions exist); then 300 problems per context
   and type through the page's own generator, each key recomputed here with
   independent arithmetic from the numbers the problem prints (the tree's
   three probabilities, the table's counts, or P(A), P(B), P(A and B)):
   joint, total, reversed conditional, union, conditional from a row, and
   the independence and mutually exclusive verdicts. Student-facing text has
   no em or en dashes and no hyphen used as punctuation. */
import { frame, sweep } from './_drills.mjs';
import { runtime } from './_shared.mjs';

const DASH = /[—–]|\s-\s/;
function texts(v, out = []) {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach(x => texts(x, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (k !== 'about') texts(x, out);
  return out;
}
const near = (a, b) => Math.abs(a - b) < 1e-9;
const isP = x => typeof x === 'number' && x >= 0 && x <= 1;

export function check(data, map) {
  const errs = [];
  frame(data, 'probability-trees', 'simulator', map, errs);
  const { M, model } = runtime('probability-trees');
  if (!model || typeof model.generate !== 'function') { errs.push('statistics/assets/tools/math/probability-trees.js does not register ApStatMath.probabilityTrees with a generate()'); return errs; }
  for (const t of texts(data)) if (DASH.test(t)) errs.push(`a dash used as punctuation: "${t.slice(0, 60)}…"`);

  for (const sc of (data.explore && data.explore.scenes) || []) {
    const w = `scene ${sc.id}`;
    for (const k of ['name', 'pop', 'A', 'nA', 'B', 'nB', 'note']) if (!sc[k]) errs.push(`${w}: "${k}" is required`);
    if (![sc.pA, sc.pBgA, sc.pBgNA].every(isP) || sc.pA <= 0 || sc.pA >= 1) { errs.push(`${w}: P(A) must be in (0, 1) and the conditionals in [0, 1]`); continue; }
    const J = model.joint(sc.pA, sc.pBgA, sc.pBgNA);
    if (!near(J.AB + J.AnB + J.nAB + J.nAnB, 1)) errs.push(`${w}: the four outcomes do not add to 1`);
    if (!near(J.AB, sc.pA * sc.pBgA) || !near(J.B, sc.pA * sc.pBgA + (1 - sc.pA) * sc.pBgNA)) errs.push(`${w}: joint or total probability is wrong`);
    if (J.B > 0 && !near(J.AgB, (sc.pA * sc.pBgA) / J.B)) errs.push(`${w}: P(A | B) is wrong`);
    const V = model.venn(J.A, J.B, J.AB, { w: 488, h: 280 });
    if (Math.abs(V.overlap - J.AB) > 1e-6) errs.push(`${w}: the Venn overlap is ${V.overlap}, not P(A and B) = ${J.AB}`);
  }

  for (const c of data.contexts || []) {
    const w = `context ${c.id}`;
    for (const k of ['lead', 'who', 'one', 'many', 'tableLead', 'tableCap']) if (!c[k]) errs.push(`${w}: "${k}" is required`);
    for (const k of ['A', 'Ap', 'nA', 'B', 'Bp', 'nB']) if (!c.ev || !c.ev[k]) errs.push(`${w}: ev.${k} is required`);
    for (const k of ['a', 'ba', 'bna']) if (!c.tree || !c.tree[k]) errs.push(`${w}: tree.${k} is required`);
    for (const k of ['pA', 'pBgA', 'pBgNA']) if (!Array.isArray(c[k]) || c[k].length !== 2 || !c[k].every(isP) || c[k][0] > c[k][1]) errs.push(`${w}: ${k} must be a range of probabilities`);
    if (!c.rules || !c.rules.both || !c.rules.disjoint) errs.push(`${w}: rules.both and rules.disjoint (events that cannot happen together) are required`);
    if (!Array.isArray(c.totals) || !c.totals.length) errs.push(`${w}: totals`);
  }
  if (errs.length) return errs;

  const key = (p, k) => { const s = p.steps.find(x => x.key === k); return s ? (s.kind === 'num' ? s.cell.answer : s.options[s.correct]) : undefined; };
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const plain = p.text.replace(/<[^>]+>/g, ' ');
    if (p.type === 'tree') {
      const { pA, pBgA, pBgNA } = p.figure;
      for (const [k, v] of [['P(A)', pA], ['P(B | A)', pBgA], ['P(B | not A)', pBgNA]]) if (!plain.includes(`${k} = ${v}`)) errs.push(`${w}: the text does not state ${k} = ${v}`);
      const ab = pA * pBgA, b = ab + (1 - pA) * pBgNA;
      if (!near(key(p, 'AB'), ab)) errs.push(`${w}: P(A and B) key`);
      if (!near(key(p, 'B'), b)) errs.push(`${w}: P(B) key`);
      if (!near(key(p, 'AgB'), ab / b)) errs.push(`${w}: P(A | B) key`);
    }
    if (p.type === 'table') {
      const T = p.figure.table, html = p.table.html;
      for (const v of [T.AB, T.AnB, T.nAB, T.nAnB, T.N]) if (!html.includes(`<td>${v.toLocaleString('en-US')}</td>`)) errs.push(`${w}: the table does not show ${v}`);
      if (T.AB + T.AnB + T.nAB + T.nAnB !== T.N || [T.AB, T.AnB, T.nAB, T.nAnB].some(x => !(x > 0))) { errs.push(`${w}: table counts (every cell must be positive)`); return; }
      const nA = T.AB + T.AnB, nB = T.AB + T.nAB;
      if (!near(key(p, 'A'), nA / T.N)) errs.push(`${w}: P(A) key`);
      if (!near(key(p, 'AB'), T.AB / T.N)) errs.push(`${w}: P(A and B) key`);
      if (!near(key(p, 'AorB'), (nA + nB - T.AB) / T.N)) errs.push(`${w}: P(A or B) key`);
      if (!near(key(p, 'BgA'), T.AB / nA)) errs.push(`${w}: P(B | A) key`);
      const indep = T.AB * T.N === nA * nB;
      if (key(p, 'indep').startsWith('Yes') !== indep) errs.push(`${w}: independence verdict`);
    }
    if (p.type === 'rules') {
      const { pA, pB, pAB } = p.figure;
      for (const [k, v] of [['P(A)', pA], ['P(B)', pB], ['P(A and B)', pAB]]) if (!plain.includes(`${k} = ${v}`)) errs.push(`${w}: the text does not state ${k} = ${v}`);
      if (pAB > Math.min(pA, pB) || pA + pB - pAB > 1) errs.push(`${w}: impossible probabilities`);
      if (!near(key(p, 'AorB'), pA + pB - pAB)) errs.push(`${w}: P(A or B) key`);
      if (key(p, 'me').startsWith('Yes') !== (pAB === 0)) errs.push(`${w}: mutually exclusive verdict`);
      if (key(p, 'indep').startsWith('Yes') !== near(pA * pB, pAB)) errs.push(`${w}: independence verdict`);
      if (pAB === 0 && !plain.includes(c.rules.disjoint.A)) errs.push(`${w}: P(A and B) = 0 needs events that cannot happen together`);
    }
  }, c => c.types || model.TYPES);
  return errs;
}
