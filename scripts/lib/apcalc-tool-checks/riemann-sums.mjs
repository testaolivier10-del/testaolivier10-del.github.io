/* Validator for calculus/data/tools/riemann-sums.json (Riemann sums), run by
   scripts/check-apcalc-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. The explore presets are checked for sound
   functions and tables (each table value is its trend rounded as stated);
   then every context and problem type is regenerated SEEDS times through
   the model the page runs (ApCalcMath.riemannSums.generate) and every key is
   recomputed here independently: sums from the table by their own loop,
   the setup choice by evaluating each option's formula, over/under by the
   actual sum against an adaptive integral, areas by trapezoids, limits of
   sums by their pieces. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime, topicOk } from './_shared.mjs';

const TYPES = ['table', 'overunder', 'context', 'sigma', 'tosum'];
const texOf = html => [...String(html).matchAll(/<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/g)].map(m => m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
/* A sum written in TeX ("2(44) + \tfrac{1}{2}(3)(36 + 26)") as a number. */
function texNumber(Expr, t) {
  const s = t.replace(/\\tfrac\{([^}]*)\}\{([^}]*)\}/g, '(($1)/($2))').replace(/\\cdot/g, '*').replace(/\\,/g, '').replace(/−/g, '-');
  return Expr.number(s);
}
function mySum(xs, ys, kind) {
  let s = 0;
  if (kind === 'mid') { for (let i = 0; i + 2 < xs.length; i += 2) s += (xs[i + 2] - xs[i]) * ys[i + 1]; return s; }
  for (let i = 0; i + 1 < xs.length; i++) {
    const w = xs[i + 1] - xs[i];
    s += kind === 'left' ? w * ys[i] : kind === 'right' ? w * ys[i + 1] : w * (ys[i] + ys[i + 1]) / 2;
  }
  return s;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'riemann-sums', 'simulator', map, errs);
  const { M, Expr, model } = runtime('riemann-sums');
  if (!model || typeof model.generate !== 'function') { errs.push('calculus/assets/tools/math/riemann-sums.js does not register ApCalcMath.riemannSums with a generate()'); return errs; }

  // ---- explore presets
  const E = data.explore || {}, ids = new Set();
  const seen = id => { if (!id || ids.has(id)) errs.push(`explore: missing or duplicate id "${id}"`); ids.add(id); };
  if (!(E.functions || []).length) errs.push('explore.functions: at least one function');
  for (const f of [...(E.functions || []), ...(E.flows || [])]) {
    seen(f.id);
    if (!topicOk(f.topic, map)) errs.push(`explore ${f.id}: unknown topic "${f.topic}"`);
    if (!f.name || !f.tex || f.tex.includes('$')) errs.push(`explore ${f.id}: needs a name and a tex (no $)`);
    let fn; try { fn = M.fn(f.fn); } catch (e) { errs.push(`explore ${f.id}: fn "${f.fn}" does not parse`); continue; }
    if (!(f.b > f.a)) errs.push(`explore ${f.id}: a must be less than b`);
    for (let i = 0; i <= 200; i++) if (!Number.isFinite(fn(f.a + (f.b - f.a) * i / 200))) { errs.push(`explore ${f.id}: f is not finite on [a, b]`); break; }
  }
  for (const f of E.flows || []) {
    for (const k of ['rate', 'var', 'varUnit', 'rateUnit', 'amtUnit']) if (!f[k]) errs.push(`explore flow ${f.id}: "${k}" is required`);
    if (f.rateUnit && f.amtUnit && f.varUnit && !f.rateUnit.startsWith(f.amtUnit + ' per ')) errs.push(`explore flow ${f.id}: the rate unit should be "${f.amtUnit} per <time>"`);
    const fn = M.fn(f.fn);
    for (let i = 0; i <= 200; i++) if (fn(f.a + (f.b - f.a) * i / 200) < 0) { errs.push(`explore flow ${f.id}: a flow rate below zero would empty the tank`); break; }
  }
  for (const t of E.tables || []) {
    seen(t.id);
    if (!topicOk(t.topic, map)) errs.push(`explore table ${t.id}: unknown topic "${t.topic}"`);
    if (!Array.isArray(t.xs) || !Array.isArray(t.ys) || t.xs.length !== t.ys.length || t.xs.length < 3) { errs.push(`explore table ${t.id}: xs and ys of the same length (3+)`); continue; }
    for (let i = 1; i < t.xs.length; i++) if (!(t.xs[i] > t.xs[i - 1])) errs.push(`explore table ${t.id}: xs must increase`);
    const widths = t.xs.slice(1).map((x, i) => x - t.xs[i]);
    if (widths.every(w => w === widths[0])) errs.push(`explore table ${t.id}: a table for this tool has unequal widths`);
    if (t.trend) {
      const fn = M.fn(t.trend), k = 10 ** (t.decimals ?? 1);
      t.xs.forEach((x, i) => { if (Math.abs(Math.round(fn(x) * k) / k - t.ys[i]) > 1e-9) errs.push(`explore table ${t.id}: ys[${i}] = ${t.ys[i]} is not the trend ${t.trend} at ${x} rounded (${Math.round(fn(x) * k) / k})`); });
    }
    for (const k of ['rate', 'var', 'varUnit', 'rateUnit', 'amtUnit']) if (!t[k]) errs.push(`explore table ${t.id}: "${k}" is required`);
  }
  // the model's own sums agree with the shared helpers on every preset
  for (const f of E.functions || []) for (const k of model.KINDS) for (const n of [1, 3, 8]) {
    const a = model.total(model.pieces(f.fn, model.partition(f.a, f.b, n), k)), b = M.riemann(f.fn, f.a, f.b, n, k);
    if (!close(a, b, 1e-10, 1e-12)) errs.push(`explore ${f.id}: ${k} n=${n}: pieces sum ${a} but ApCalcMath.riemann gives ${b}`);
  }
  for (const t of E.tables || []) for (const k of model.KINDS) {
    if (k === 'mid' && !model.midOk(t.xs)) continue;
    const a = model.total(model.tablePieces(t.xs, t.ys, k)), b = mySum(t.xs, t.ys, k);
    if (!close(a, b, 1e-10, 1e-12)) errs.push(`explore table ${t.id}: ${k}: ${a} but recomputed ${b}`);
  }
  // the shapes the over/under drill states
  for (const F of model.SHAPES) {
    const sh = model.shape(F.fn, F.a, F.b);
    if (!sh.inc || !sh.conc) errs.push(`model SHAPES ${F.fn}: not monotonic and of one concavity on [${F.a}, ${F.b}]`);
  }

  // ---- drills
  for (const c of data.contexts || []) {
    for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type "${t}"`);
    if ((c.types || []).some(t => ['table', 'overunder', 'context'].includes(t))) {
      for (const k of ['lead', 'rate', 'var', 'rateUnit', 'varUnit', 'varUnitOne', 'amtUnit', 'amount', 'have']) if (!c[k]) errs.push(`context ${c.id}: "${k}" is required`);
      if (c.rateUnit && c.amtUnit && !c.rateUnit.startsWith(c.amtUnit + ' per ')) errs.push(`context ${c.id}: rateUnit should read "${c.amtUnit} per ${c.varUnitOne}"`);
    }
  }
  const step = (p, key) => p.steps.find(s => s.key === key);
  const correctTex = s => texOf(s.options[s.correct]).join(' ');
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const bad = m => errs.push(`${w}: ${m}`);
    if (p.type === 'table') {
      const g = p.figure, S = mySum(g.xs, g.ys, g.sumKind);
      const widths = g.xs.slice(1).map((x, i) => x - g.xs[i]);
      if (widths.every(x => x === widths[0])) bad('the table widths are all equal');
      if (!close(step(p, 'sum').cell.answer, S)) bad(`sum key ${step(p, 'sum').cell.answer} but recomputed ${S}`);
      const st = step(p, 'setup');
      st.options.forEach((o, i) => {
        const v = texNumber(Expr, texOf(o).join(''));
        if (i === st.correct && !close(v, S)) bad(`the correct setup evaluates to ${v}, not ${S}`);
        if (i !== st.correct && close(v, S)) bad(`a wrong setup option also evaluates to the sum ${S}`);
      });
      const me = step(p, 'meaning'), good = me.options[me.correct];
      if (!good.includes(' ' + c.amtUnit + ':') || good.includes(c.rateUnit)) bad('the correct meaning does not name the amount unit');
    } else if (p.type === 'overunder') {
      const v = step(p, 'verdict'), saysOver = v.correct === 0;
      if (p.figure) {
        const g = p.figure, f = M.fn(g.fn), n = 4, h = (g.b - g.a) / n;
        let s = 0;
        for (let i = 0; i < n; i++) { const x0 = g.a + i * h, x1 = x0 + h; s += h * (g.sumKind === 'left' ? f(x0) : g.sumKind === 'right' ? f(x1) : g.sumKind === 'mid' ? f((x0 + x1) / 2) : (f(x0) + f(x1)) / 2); }
        const I = M.integral(f, g.a, g.b);
        if ((s > I) !== saysOver) bad(`verdict says ${saysOver ? 'over' : 'under'} but the ${g.sumKind} sum with n = 4 is ${s} against ${I}`);
      } else {
        const txt = p.text.replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<'), inc = /′\(t\) >|′\(\w\) >/.test(txt), cu = /″\(\w\) >/.test(txt);
        const kind = /left Riemann/.test(txt) ? 'left' : /right Riemann/.test(txt) ? 'right' : /midpoint/.test(txt) ? 'mid' : 'trap';
        const over = kind === 'left' ? !inc : kind === 'right' ? inc : kind === 'mid' ? !cu : cu;
        if (over !== saysOver) bad(`rate stated ${inc ? 'increasing' : 'decreasing'}, concave ${cu ? 'up' : 'down'}: a ${kind} sum is ${over ? 'over' : 'under'}`);
      }
      const rs = step(p, 'reason'), lr = /left Riemann|right Riemann/.test(p.text);
      if (!(lr ? /increasing|decreasing/ : /concave/).test(rs.options[rs.correct])) bad('the correct reason names the wrong property');
    } else if (p.type === 'context') {
      const g = p.figure; let area = 0;
      for (let i = 0; i + 1 < g.xs.length; i++) area += (g.xs[i + 1] - g.xs[i]) * (g.ys[i] + g.ys[i + 1]) / 2;
      const A0 = +(/there are (\d+)/.exec(p.text) || [])[1];
      if (!close(step(p, 'area').cell.answer, area)) bad(`area ${step(p, 'area').cell.answer} but trapezoids give ${area}`);
      if (!close(step(p, 'total').cell.answer, A0 + area)) bad(`total ${step(p, 'total').cell.answer} but ${A0} + ${area}`);
      const u = step(p, 'units');
      if (u.options[u.correct].replace(/<[^>]+>/g, '') !== c.amtUnit) bad('the units key is not the amount unit');
    } else if (p.type === 'sigma') {
      const tx = texOf(p.text).join(' '), a = +(/a = (-?\d+)/.exec(tx) || [])[1];
      const w = step(p, 'width').cell.answer, b = step(p, 'upper').cell.answer;
      if (!close(b - a, w)) bad(`upper ${b} − lower ${a} is not the width ${w}`);
      if (!tx.includes(`\\frac{${w}}{n}`) || !tx.includes(`\\frac{${w}k}{n}`)) bad(`the sum does not show Δx = ${w}/n`);
      const f = M.fn(step(p, 'integrand').cell.expr.answer);
      // the limit of right sums of the key integrand on [a, b] is what the summand builds
      const n = 3000, dx = w / n; let s = 0;
      for (let k = 1; k <= n; k++) s += f(a + k * dx) * dx;
      if (!close(s, M.integral(f, a, b), 5e-3, 5e-3)) bad('the right sums do not approach the integral (domain problem?)');
    } else if (p.type === 'tosum') {
      const g = p.figure, f = M.fn(g.fn), h = (g.b - g.a) / 4;
      let s = 0; for (let k = 1; k <= 4; k++) s += f(g.a + k * h) * h;
      if (!close(step(p, 'value').cell.answer, s)) bad(`R4 key ${step(p, 'value').cell.answer} but recomputed ${s}`);
      const ct = correctTex(step(p, 'pick')), w = g.b - g.a;
      if (!ct.includes(`${g.a} + \\frac{${w}k}{n}`) || !ct.includes(`\\cdot \\frac{${w}}{n}`)) bad('the correct sum does not have x_k = a + (b − a)k/n and Δx = (b − a)/n');
    } else bad(`unknown type ${p.type}`);
  }, c => c.types || [undefined]);
  return errs;
}
