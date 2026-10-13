/* Validator for calculus/data/tools/limit-explorer.json (Limit explorer), run by
   scripts/check-apcalc-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. Every problem the page can show is
   regenerated (300 seeds per context and kind, through the model the page
   runs, ApCalcMath.limitExplorer) and every key is recomputed here from the
   problem's own functions, by evaluating them next to the point, never from
   the generator's arithmetic: one-sided limits from the drawn curves, table
   cells from the function, limit laws by substituting the given limits into
   the expression, discontinuity kinds from the picture, the IVT count from
   the sign changes in the table. Every string is checked as TeX (strict).
   The explore gallery is checked the same way (limits, the checklist, the
   zoom windows, the squeeze bounds). */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

const KINDS = ['removable', 'jump', 'infinite', 'continuous'];
const FAILS = ['defined', 'exists', 'equal', 'none'];
const EPS = 1e-7;

// The number a choice option names ($-\frac{3}{4}$, $\infty$), or null.
function optNum(Expr, t) {
  const m = /^\s*(?:is |It is about |It equals )?\$([^$]+)\$/.exec(t);
  if (!m) return null;
  const s = m[1].trim();
  if (s === '\\infty') return Infinity;
  if (s === '-\\infty') return -Infinity;
  const e = s.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)');
  const v = Expr.number(e);
  return Number.isFinite(v) ? v : null;
}
function texOk(Tex, s, w, errs) {
  try { Tex.html(String(s), { strict: true }); } catch (e) { errs.push(`${w}: TeX: ${e.message}`); }
}
// The value a drawn graph takes at x = a: a filled point, or a closed curve end.
function drawnValue(plot, a) {
  for (const p of plot.points || []) if (!p.open && Math.abs(p.at[0] - a) < 1e-9) return p.at[1];
  for (const c of plot.curves || []) {
    const ends = c.ends || [];
    if (ends[0] === 'closed' && Math.abs(c.domain[0] - a) < 1e-9) return c.fn(a);
    if (ends[1] === 'closed' && Math.abs(c.domain[1] - a) < 1e-9) return c.fn(a);
  }
  return null;
}
// One-sided limits from the drawn curves, by evaluating next to a.
function drawnSides(plot, a) {
  let L = NaN, R = NaN;
  for (const c of plot.curves) {
    const [lo, hi] = c.domain;
    if (lo < a && hi >= a - 0.05) L = c.fn(a - EPS);
    if (hi > a && lo <= a + 0.05) R = c.fn(a + EPS);
  }
  return [L, R];
}

export function check(data, map) {
  const errs = [];
  frame(data, 'limit-explorer', 'simulator', map, errs);
  const { M, Expr, Tex, Plot, model } = runtime('limit-explorer');
  if (!model || typeof model.generate !== 'function') { errs.push('calculus/assets/tools/math/limit-explorer.js does not register ApCalcMath.limitExplorer with a generate()'); return errs; }
  const types = new Set(model.TYPES.map(t => t.value));
  for (const c of data.contexts || []) {
    for (const t of c.types || []) if (!types.has(t)) errs.push(`context ${c.id}: unknown kind "${t}"`);
    const T = model.TYPES.find(t => t.value === (c.types || [c.id])[0]);
    if (T && T.topic !== c.topic) errs.push(`context ${c.id}: topic "${c.topic}" is not the kind's topic "${T.topic}"`);
  }

  /* ------------------------------------------------ the explore gallery */
  for (const e of model.GALLERY) {
    const w = `gallery ${e.id}`;
    texOk(Tex, '$' + e.tex + '$', w, errs);
    if (!map.topicById(e.topic)) errs.push(`${w}: unknown topic ${e.topic}`);
    if (e.a === 'inf') {
      for (const s of [-1, 1]) { const v = e.f(s * 1e8); if (!close(v, e.hasym, 1e-6, 1e-6)) errs.push(`${w}: f(${s}·10^8) = ${v}, not near the asymptote ${e.hasym}`); }
      if (e.left !== e.hasym || e.right !== e.hasym) errs.push(`${w}: limits at ±∞ must equal the asymptote`);
      continue;
    }
    const a = e.a, sides = [e.f(a - EPS), e.f(a + EPS)], lim = [e.left, e.right];
    if (e.kind === 'oscillating') {
      const vals = [1, 2, 3, 4, 5].map(k => e.f(a + Math.pow(10, -k)));
      if (Math.max(...vals) - Math.min(...vals) < 0.5) errs.push(`${w}: the table should not settle`);
      if (!Number.isNaN(e.left) || !Number.isNaN(e.right)) errs.push(`${w}: no one-sided limit should be stated`);
    } else lim.forEach((L, i) => {
      if (Number.isFinite(L)) { if (!close(sides[i], L, 1e-5, 1e-5)) errs.push(`${w}: ${i ? 'right' : 'left'} limit stated ${L}, the function gives ${sides[i]}`); }
      else if (!(Math.abs(sides[i]) > 1e6 && Math.sign(sides[i]) === Math.sign(L))) errs.push(`${w}: ${i ? 'right' : 'left'} limit stated ${L}, the function gives ${sides[i]}`);
    });
    const ck = model.check(e, false), defined = e.at != null, exists = Number.isFinite(e.left) && e.left === e.right;
    if (ck.defined !== defined || ck.exists !== exists || ck.equal !== (defined && exists && e.at === e.left)) errs.push(`${w}: the continuity checklist disagrees with the function`);
    if (e.fill != null) {
      const f2 = model.check(e, true);
      if (!f2.continuous || e.fill !== e.left) errs.push(`${w}: filling with ${e.fill} must make it continuous`);
    }
    if (e.bounds) for (let x = -2; x <= 2; x += 0.0137) { const y = e.f(x); if (y < e.bounds[0](x) - 1e-12 || y > e.bounds[1](x) + 1e-12) { errs.push(`${w}: not between its bounds at ${x}`); break; } }
    // At every zoom the tracers sit inside the window (where the function has a finite limit).
    for (let z = 0; z <= 4.0001; z += 0.25) {
      const v = model.view(e, z), xs = [a - v.h, a + v.h];
      if (xs.some(x => x <= v.x[0] || x >= v.x[1])) errs.push(`${w}: zoom ${z}: a tracer leaves the window`);
      if (e.kind !== 'oscillating' && xs.some(x => { const y = e.f(x); return y < v.y[0] || y > v.y[1]; })) { errs.push(`${w}: zoom ${z}: a tracer's height is outside the window`); break; }
      const rows = model.rows(e, z);
      rows.forEach(r => { if (!close(r.fl, e.f(a - r.h), 1e-12) || !close(r.fr, e.f(a + r.h), 1e-12)) errs.push(`${w}: table row h = ${r.h} is not f(a ± h)`); });
    }
  }

  /* ------------------------------------------------ the drills */
  const gen = (r, c, t) => model.generate(r, c, t);
  const correctText = s => s.options[s.correct];
  const recheck = (p, c, w) => {
    const before = errs.length;
    const strs = [p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, s.hint || '', ...(s.options || []), ...(s.why || []), ...((s.cell && s.cell.mistakes) || []).map(m => m.why)])];
    for (const s of strs) texOk(Tex, s, w, errs);
    for (const s of p.steps) if (s.kind === 'expr') for (const m of s.cell.expr.mistakes || []) if (/[<>$\\]/.test(m.why)) errs.push(`${w}: an expression slip's note must be plain text (the page escapes it)`);
    if (p.fig && p.fig.plot) { try { Plot.svg(p.fig.plot); } catch (e) { errs.push(`${w}: figure: ${e.message}`); } }
    if (p.fig && p.fig.table) for (const s of [...p.fig.table.cols, ...p.fig.table.rows.flat()]) texOk(Tex, s, w, errs);
    if (errs.length > before) return;
    const st = k => p.steps.find(s => s.key === k), K = p.key;
    const num = (k, v, tol = 1e-6) => { const s = st(k); if (!s) errs.push(`${w}: no step ${k}`); else if (!close(s.cell.answer, v, tol, tol)) errs.push(`${w}: step ${k} keys ${s.cell.answer}, recomputed ${v}`); };
    const choiceIs = (k, ok, what) => { const s = st(k); if (!s) errs.push(`${w}: no step ${k}`); else if (!ok(correctText(s))) errs.push(`${w}: step ${k}: the keyed option "${correctText(s)}" is not ${what}`); };
    const same = (u, v, tol = 1e-5) => u !== null && (Number.isFinite(v) ? close(u, v, tol, tol) : u === v);
    const limitChoice = (k, v, tol) => choiceIs(k, t => v === null ? /does not exist|It does not exist/.test(t) : same(optNum(Expr, t), v, tol), v === null ? 'DNE' : String(v));
    switch (p.type) {
      case 'graph': {
        const pl = p.fig.plot, a = K.a, [L, R] = drawnSides(pl, a), v = drawnValue(pl, a);
        num('left', L, 1e-5); num('right', R, 1e-5);
        limitChoice('two', close(L, R, 1e-6, 1e-6) ? L : null);
        choiceIs('value', t => v === null ? /not defined/.test(t) : close(optNum(Expr, t), v, 1e-9, 1e-9), v === null ? 'undefined' : String(v));
        const ys = [L, R, v].filter(y => y !== null);
        if (ys.some(y => y <= pl.y[0] || y >= pl.y[1])) errs.push(`${w}: a limit or the value is outside the drawn window`);
        break;
      }
      case 'table': {
        const L = K.f(K.a - 1e-4), R = K.f(K.a + 1e-4);
        num('left', L, 1e-3); num('right', R, 1e-3);
        limitChoice('two', close(L, R, 1e-3, 1e-3) ? R : null, 1e-3);
        const xs = p.fig.table.cols.slice(1).map(s => Expr.number(s.replace(/\$/g, '')));
        p.fig.table.rows[0].slice(1).forEach((s, i) => { const y = K.f(xs[i]); if (!close(Number(s.replace('−', '-')), y, 0, 6e-6)) errs.push(`${w}: table cell ${i} reads ${s}, f gives ${y}`); });
        break;
      }
      case 'onesided': {
        const L = K.left(K.a), R = K.right(K.a);
        num('left', L); num('right', R); limitChoice('two', close(L, R) ? L : null);
        break;
      }
      case 'laws': {
        p.steps.forEach((s, i) => {
          const e = K.forms[i].replace(/\\left\[/g, '(').replace(/\\right\]/g, ')').replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)').replace(/\\,/g, '*').replace(/f\(x\)/g, `(${K.p})`).replace(/g\(x\)/g, `(${K.q})`);
          const v = Expr.number(e);
          if (!close(s.cell.answer, v)) errs.push(`${w}: ${s.key} keys ${s.cell.answer}, substituting gives ${v}`);
        });
        break;
      }
      case 'algebra': {
        const L = (K.f(K.a - 1e-6) + K.f(K.a + 1e-6)) / 2;
        num('lim', L, 1e-5);
        if (Number.isFinite(K.f(K.a))) errs.push(`${w}: f is defined at a, so the problem is not 0/0`);
        const s = st('simp'), E = s.cell.expr, g = Expr.fn(E.answer);
        for (let i = 0; i <= 20; i++) { const x = E.domain[0] + (E.domain[1] - E.domain[0]) * i / 20; if (Math.abs(x - K.a) > 1e-6 && !close(g(x), K.f(x), 1e-9, 1e-9)) { errs.push(`${w}: the simplified form ${E.answer} differs from f at ${x}`); break; } }
        break;
      }
      case 'squeeze': {
        const L = K.L, a = K.a;
        if (!close(K.lo(a + 1e-6), L, 1e-6, 1e-6) || !close(K.hi(a - 1e-6), L, 1e-6, 1e-6)) errs.push(`${w}: the bounds do not both head to ${L}`);
        if (K.f) for (let x = -1; x <= 1; x += 0.0173) if (Math.abs(x) > 1e-9) { const y = K.f(x); if (y < K.lo(x) - 1e-12 || y > K.hi(x) + 1e-12) { errs.push(`${w}: f escapes its bounds at ${x}`); break; } }
        for (let x = a - 1; x <= a + 1; x += 0.05) if (K.lo(x) > K.hi(x) + 1e-12) { errs.push(`${w}: the lower bound is above the upper one at ${x}`); break; }
        if (st('lim').kind === 'num') num('lim', L); else choiceIs('lim', t => /squeeze/.test(t) && optNum(Expr, t) !== null && close(optNum(Expr, t), L), 'the squeeze conclusion');
        if (st('lo')) { num('lo', K.lo(a)); num('hi', K.hi(a)); }
        break;
      }
      case 'classify': {
        const pl = p.fig.plot, a = K.a, [L, R] = drawnSides(pl, a), v = drawnValue(pl, a);
        const holeOpen = (pl.points || []).some(q => q.open && Math.abs(q.at[0] - a) < 1e-9);
        let kind, fails;
        if (Math.abs(L) > 1e4 || Math.abs(R) > 1e4) { kind = 'infinite'; fails = v === null ? 'defined' : 'exists'; }
        else if (!close(L, R, 1e-6, 1e-6)) { kind = 'jump'; fails = v === null ? 'defined' : 'exists'; }
        else if (v === null) { kind = 'removable'; fails = 'defined'; }
        else if (!close(v, L, 1e-6, 1e-6)) { kind = 'removable'; fails = 'equal'; }
        else { kind = holeOpen ? 'removable' : 'continuous'; fails = 'none'; }
        const ts = st('type'), fs = st('fails');
        if (KINDS[ts.correct] !== kind) errs.push(`${w}: keyed kind ${KINDS[ts.correct]}, the picture shows ${kind}`);
        if (FAILS[fs.correct] !== fails) errs.push(`${w}: keyed first failure ${FAILS[fs.correct]}, the picture gives ${fails}`);
        break;
      }
      case 'continuity': {
        const L = K.left(K.a), R = K.right(K.a), ex = close(L, R);
        num('value', K.v); limitChoice('lim', ex ? L : null);
        const want = ex && close(K.v, L) ? 0 : !ex ? 1 : 2;
        if (st('cont').correct !== want) errs.push(`${w}: continuity conclusion keyed ${st('cont').correct}, should be ${want}`);
        break;
      }
      case 'remove': {
        if (K.kind === 'hole') num('k', (K.f(K.a - 1e-6) + K.f(K.a + 1e-6)) / 2, 1e-5);
        else { num('right', K.a * K.a + K.c); if (!close(st('k').cell.answer * K.a + K.b, K.a * K.a + K.c)) errs.push(`${w}: k does not join the pieces`); }
        break;
      }
      case 'vertical': {
        const sL = K.f(K.a - 1e-6), sR = K.f(K.a + 1e-6);
        if (!(Math.abs(sL) > 1e5 && Math.abs(sR) > 1e5)) errs.push(`${w}: f is not unbounded at a`);
        limitChoice('left', sL > 0 ? Infinity : -Infinity); limitChoice('right', sR > 0 ? Infinity : -Infinity);
        break;
      }
      case 'infinity': {
        for (const [k, x] of [['pinf', 1e6], ['minf', -1e6]]) {
          const y = K.f(x), y2 = K.f(100 * x);
          const v = Math.abs(y2) > 1e4 && Math.abs(y2) > 50 * Math.abs(y) ? (y2 > 0 ? Infinity : -Infinity) : y2;
          const got = optNum(Expr, correctText(st(k)));
          if (got === null || (Number.isFinite(v) ? !close(got, v, 1e-5, 1e-5) : got !== v)) errs.push(`${w}: ${k} keyed ${correctText(st(k))}, f gives ${y2} far out`);
        }
        break;
      }
      case 'ivt': {
        let n = 0;
        for (let i = 0; i + 1 < K.ys.length; i++) if ((K.ys[i] - K.k) * (K.ys[i + 1] - K.k) < 0) n++;
        num('count', n);
        const ia = K.xs.indexOf(K.a);
        if (ia < 0 || K.xs[ia + 1] !== K.b || !((K.ys[ia] - K.k) * (K.ys[ia + 1] - K.k) < 0)) errs.push(`${w}: the justified interval does not straddle k`);
        if (!/continuous/.test(correctText(st('just')))) errs.push(`${w}: the keyed justification must state continuity`);
        break;
      }
      default: errs.push(`${w}: unknown kind ${p.type}`);
    }
  };
  sweep(data, errs, gen, recheck, c => c.types || [c.id]);
  return errs;
}
