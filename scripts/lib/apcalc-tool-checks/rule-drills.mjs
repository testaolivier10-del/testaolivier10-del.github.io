/* Validator for calculus/data/tools/rule-drills.json (Rule drills), run by
   scripts/check-apcalc-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. Every problem the page can show is
   regenerated (300 seeds per context, through ApCalcMath.ruleDrills, the
   code the page runs) and every key is recomputed here without the model's
   algebra: each expression key is compared, at 25 points, with a central
   difference of the function it claims to differentiate (f', f'', u', the
   outer derivative at the inner function, or -F_x/F_y for an implicit
   curve); rewrite answers are checked by c·x^p = f; inverse-function answers
   by solving f(x) = a and differencing f; the rule asked for first is read
   off the function's parse tree; every string is checked as TeX (strict);
   and the rule picker is checked on a fixed list of expressions. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

const H = 1e-5;
const d1 = (f, x) => (f(x + H) - f(x - H)) / (2 * H);
const d2 = (f, x) => { const h = 1e-3; return (f(x + h) - 2 * f(x) + f(x - h)) / (h * h); };

function texOk(Tex, s, w, errs) {
  try { Tex.html(String(s), { strict: true }); } catch (e) { errs.push(`${w}: TeX: ${e.message}`); }
}
// The top-level rule of an expression, from its parse tree alone.
function topRule(Expr, s) {
  let t = Expr.parse(s);
  while (t.k === 'paren') t = t.a;
  const has = n => n && (n.k === 'var' ? n.v === 'x' : has(n.a) || has(n.b));
  const un = n => { while (n && n.k === 'paren') n = n.a; return n; };
  if (t.k === 'mul' && has(t.a) && has(t.b)) return 'product';
  if (t.k === 'div' && has(t.b)) return 'quotient';
  if (t.k === 'fn' && un(t.a).k !== 'var') return 'chain';
  if (t.k === 'pow' && has(t.a) && !has(t.b) && un(t.a).k !== 'var') return 'chain';
  if (t.k === 'pow' && !has(t.a) && has(t.b) && un(t.b).k !== 'var') return 'chain';
  if (t.k === 'add' || t.k === 'sub') return 'sum';
  return 'other';
}
const RULE_NAME = { product: 'Product rule', quotient: 'Quotient rule', chain: 'Chain rule' };

export function check(data, map) {
  const errs = [];
  frame(data, 'rule-drills', 'drill', map, errs);
  const { M, Expr, Tex, model } = runtime('rule-drills');
  if (!model || typeof model.generate !== 'function') { errs.push('calculus/assets/tools/math/rule-drills.js does not register ApCalcMath.ruleDrills with a generate()'); return errs; }
  const types = new Map(model.TYPES.map(t => [t.value, t]));
  for (const c of data.contexts || []) {
    for (const t of c.types || []) if (!types.has(t)) errs.push(`context ${c.id}: unknown kind "${t}"`);
    const T = types.get((c.types || [c.id])[0]);
    if (T && T.topic !== c.topic) errs.push(`context ${c.id}: topic "${c.topic}" is not the kind's topic "${T.topic}"`);
  }

  /* -------------------------------------------- the rule picker */
  for (const s of model.EXAMPLES.concat(['x^2 sin(3x)', '1/x', 'x^x', 'log_2(x)', 'sec(x)^2', 'arccos(x^3)', 'sqrt(x)/(3x+1)^2', 'cos(x^2 e^x)'])) {
    const a = model.analyze(s);
    if (!a.ok) { errs.push(`rule picker: "${s}" fails: ${a.error}`); continue; }
    const f = Expr.compile(a.tree), g = Expr.compile(a.d), h = Expr.fn(a.dstr);
    for (let i = 0; i < 25; i++) {
      const x = 0.2 + i * 0.03, want = d1(v => f({ x: v }), x);
      if (!close(g({ x }), want, 1e-5, 1e-6) || !close(h(x), want, 1e-5, 1e-6)) { errs.push(`rule picker: d/dx ${s} is wrong at x = ${x}`); break; }
    }
    texOk(Tex, '$' + a.dtex + '$', `rule picker ${s}`, errs);
    if (!a.steps.length) errs.push(`rule picker: "${s}" lists no rule`);
    const top = topRule(Expr, s);
    if (RULE_NAME[top] && !a.steps[0].name.startsWith(RULE_NAME[top]) && !(top === 'quotient' && /negative power/.test(a.steps[0].name))) errs.push(`rule picker: "${s}" starts with ${a.steps[0].name}, the tree says ${top}`);
  }

  /* -------------------------------------------- the drills */
  const at = (E, i) => {
    const d = E.domain;
    if (Array.isArray(d)) return { x: d[0] + (d[1] - d[0]) * (i + 0.5) / 25 };
    return { x: d.x[0] + (d.x[1] - d.x[0]) * ((i * 7) % 25 + 0.5) / 25, y: d.y[0] + (d.y[1] - d.y[0]) * (i + 0.5) / 25 };
  };
  const recheck = (p, c, w) => {
    const before = errs.length;
    const strs = [p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, s.hint || '', ...(s.options || []), ...(s.why || []), ...((s.cell && s.cell.mistakes) || []).map(m => m.why)])];
    for (const s of strs) texOk(Tex, s, w, errs);
    if (errs.length > before) return;
    for (const s of p.steps) {
      if (s.kind === 'expr') {
        const E = s.cell.expr, k = Expr.fn(E.answer, E.vars || ['x']), ck = s.check || {};
        for (const m of E.mistakes || []) {
          if (/[<>$\\]/.test(m.why)) errs.push(`${w}: step ${s.key}: a slip's note must be plain text (the page escapes it)`);
          if (!Expr.read(m.expr, { vars: E.vars || ['x'] }).ok) errs.push(`${w}: step ${s.key}: the slip "${m.expr}" does not parse`);
        }
        let fail = null, used = 0;
        for (let i = 0; i < 25 && !fail; i++) {
          const pt = at(E, i), kv = (E.vars || ['x']).length > 1 ? k(pt) : k(pt.x);
          let want;
          if (ck.d1) { const f = Expr.fn(ck.d1); want = d1(f, pt.x); }
          else if (ck.d2) { const f = Expr.fn(ck.d2); want = d2(f, pt.x); }
          else if (ck.outerAt) { const o = Expr.fn(ck.outerAt[0], ['u']), u = Expr.fn(ck.outerAt[1])(pt.x); want = d1(o, u); }
          else if (ck.implicit) { const F = Expr.fn(ck.implicit, ['x', 'y']); want = -((F({ x: pt.x + H, y: pt.y }) - F({ x: pt.x - H, y: pt.y })) / (2 * H)) / ((F({ x: pt.x, y: pt.y + H }) - F({ x: pt.x, y: pt.y - H })) / (2 * H)); }
          else { errs.push(`${w}: step ${s.key} says nothing about what its key equals`); return; }
          if (!Number.isFinite(want)) continue;
          used++;
          if (!close(kv, want, ck.d2 ? 2e-4 : 1e-5, ck.d2 ? 1e-4 : 1e-6)) fail = `${w}: step ${s.key}: key ${E.answer} = ${kv} at ${JSON.stringify(pt)}, the difference quotient gives ${want}`;
        }
        if (fail) errs.push(fail);
        if (used < 20) errs.push(`${w}: step ${s.key}: the key is undefined on most of its domain`);
      }
    }
    const st = k => p.steps.find(s => s.key === k);
    const rule = st('rule');
    if (rule) {
      const top = topRule(Expr, p.meta.f);
      if (rule.options[rule.correct] !== RULE_NAME[top]) errs.push(`${w}: the first rule is keyed "${rule.options[rule.correct]}", the tree of ${p.meta.f} says ${top}`);
    }
    switch (p.type) {
      case 'rewrite': {
        const f = Expr.fn(p.meta.f), c = st('c').cell.answer, q = st('p').cell.answer;
        for (const x of [0.4, 0.9, 1.7, 2.6]) if (!close(c * Math.pow(x, q), f(x), 1e-9)) { errs.push(`${w}: c·x^p = ${c}·x^${q} is not f at ${x}`); break; }
        break;
      }
      case 'power': {
        const f = Expr.fn(p.meta.f), q = st('p').cell.answer;
        if (!close(f(2.3) / f(1.15), Math.pow(2, q), 1e-9)) errs.push(`${w}: p = ${q} is not the power of f`);
        break;
      }
      case 'implicit': {
        const F = Expr.fn(p.meta.F, ['x', 'y']), { x0, y0, C } = p.meta;
        if (!close(F({ x: x0, y: y0 }), C)) errs.push(`${w}: (${x0}, ${y0}) is not on the curve`);
        const want = -((F({ x: x0 + H, y: y0 }) - F({ x: x0 - H, y: y0 })) / (2 * H)) / ((F({ x: x0, y: y0 + H }) - F({ x: x0, y: y0 - H })) / (2 * H));
        if (!close(st('slope').cell.answer, want, 1e-6, 1e-8)) errs.push(`${w}: slope keyed ${st('slope').cell.answer}, the curve gives ${want}`);
        if (!/frac\{dy\}\{dx\}/.test(st('y').options[st('y').correct])) errs.push(`${w}: the keyed derivative of the y term has no dy/dx`);
        break;
      }
      case 'inverse': {
        const f = Expr.fn(p.meta.f), a = p.meta.a;
        // solve f(x) = a by bisection on [-10, 10] (f is increasing)
        let lo = -10, hi = 10;
        for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (f(m) < a) lo = m; else hi = m; }
        const b = (lo + hi) / 2;
        if (!close(st('ginv').cell.answer, b, 1e-6, 1e-6)) errs.push(`${w}: g(a) keyed ${st('ginv').cell.answer}, solving gives ${b}`);
        if (!close(st('fp').cell.answer, d1(f, b), 1e-6, 1e-6)) errs.push(`${w}: f'(g(a)) keyed ${st('fp').cell.answer}`);
        // g'(a) as a difference quotient of the inverse itself
        const inv = y => { let l = -10, h = 10; for (let i = 0; i < 200; i++) { const m = (l + h) / 2; if (f(m) < y) l = m; else h = m; } return (l + h) / 2; };
        const gp = (inv(a + 1e-4) - inv(a - 1e-4)) / 2e-4;
        if (!close(st('gp').cell.answer, gp, 1e-5, 1e-6)) errs.push(`${w}: g'(a) keyed ${st('gp').cell.answer}, the inverse gives ${gp}`);
        break;
      }
      case 'higher': {
        const f = Expr.fn(p.meta.f), v = d2(f, p.meta.x0);
        if (!close(st('v').cell.answer, v, 1e-3, 1e-3)) errs.push(`${w}: f''(${p.meta.x0}) keyed ${st('v').cell.answer}, differencing gives ${v}`);
        break;
      }
    }
  };
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), recheck, c => c.types || [c.id]);
  return errs;
}
