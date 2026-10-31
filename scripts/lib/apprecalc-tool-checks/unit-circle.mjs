/* Validator for precalculus/data/tools/unit-circle.json (Unit circle), run by
   scripts/check-apprecalc-content.mjs. OWNED BY THIS TOOL ONLY (builder T3).
   check(data, map) -> problems.

   1. The frame (slug, kind, topic, intro, howItWorks, contexts, trademark);
      each context's kind is a model kind, on the topic that teaches it.
   2. The Explore model: the exact cos, sin and tan of all 16 special angles
      (their TeX, read here by its own small reader) against Math.cos,
      Math.sin and Math.tan; every special angle found by nextSpecial and
      snap; the quadrant and reference angle of a grid of angles.
   3. 300 seeded problems per context (_drills.mjs sweep), every key
      recomputed here from the problem's givens with Math.cos and friends,
      a choice's right option read back from its own text, every wrong
      option checked wrong, and no calculus wording anywhere. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const KINDS = { radian: 'sine-cosine-tangent', coords: 'sine-cosine-tangent', ray: 'sine-cosine-tangent', values: 'sine-cosine-values', graphs: 'sine-cosine-curves' };
const PI = Math.PI;
const CALC = /derivative|instantaneous|at an? (in|de)creasing rate|\bf['′]/i;
const ROMAN = ['', 'I', 'II', 'III', 'IV'];

/* The option's plain reading: the sr-only text when it has math, else its text. */
export function optText(html) {
  const sr = /<span class="sr-only">([\s\S]*?)<\/span>/.exec(html);
  return (sr ? sr[1] : String(html).replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<[^>]+>/g, '')).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/−/g, '-').replace(/\s+/g, ' ').trim();
}
/* A TeX value (\frac, \sqrt, \pi, a minus sign) as a number, read here, not by the model. */
export function texValue(t) {
  if (t === 'none' || t == null) return NaN;
  let s = String(t).trim(), sign = 1;
  if (s.startsWith('-')) { sign = -1; s = s.slice(1); }
  const atom = a => {
    a = a.trim();
    let m;
    if ((m = /^(\d*)\\sqrt\{(\d+)\}$/.exec(a))) return (m[1] ? +m[1] : 1) * Math.sqrt(+m[2]);
    if ((m = /^(\d*)\\pi$/.exec(a))) return (m[1] ? +m[1] : 1) * PI;
    if (/^\d+(\.\d+)?$/.test(a)) return +a;
    return NaN;
  };
  const f = /^\\frac\{([^{}]*(?:\{[^{}]*\})?[^{}]*)\}\{(\d+)\}$/.exec(s);
  return sign * (f ? atom(f[1]) / +f[2] : atom(s));
}
/* pi-fraction words in plain text ("3π/2", "π", "0") as numbers, in order. */
function piWords(text) {
  return (String(text).replace(/\(|\)/g, ' ').match(/-?\d*π(\/\d+)?|\b\d+\b/g) || []).map(w => {
    const m = /^(-?)(\d*)π(?:\/(\d+))?$/.exec(w);
    if (!m) return +w;
    return (m[1] ? -1 : 1) * (m[2] ? +m[2] : 1) * PI / (m[3] ? +m[3] : 1);
  });
}
const quadOf = t => { const c = Math.cos(t), s = Math.sin(t); if (Math.abs(c) < 1e-12 || Math.abs(s) < 1e-12) return 0; return c > 0 ? (s > 0 ? 1 : 4) : (s > 0 ? 2 : 3); };
const refOf = t => Math.acos(Math.min(1, Math.abs(Math.cos(t))));

export function modelProblems(model) {
  const errs = [];
  if (model.SPECIAL.length !== 16) errs.push(`expected 16 special angles, got ${model.SPECIAL.length}`);
  for (const m of model.SPECIAL) {
    const a = model.angle(m), t = m * PI / 12;
    if (!close(texValue(a.cos.tex), Math.cos(t), 1e-9, 1e-12)) errs.push(`angle ${a.text}: cos is ${a.cos.tex}, Math.cos gives ${Math.cos(t)}`);
    if (!close(texValue(a.sin.tex), Math.sin(t), 1e-9, 1e-12)) errs.push(`angle ${a.text}: sin is ${a.sin.tex}, Math.sin gives ${Math.sin(t)}`);
    if (Math.abs(Math.cos(t)) < 1e-12) { if (!a.tan.undef) errs.push(`angle ${a.text}: tan should be not defined`); }
    else if (!close(texValue(a.tan.tex), Math.tan(t), 1e-9, 1e-12)) errs.push(`angle ${a.text}: tan is ${a.tan.tex}, Math.tan gives ${Math.tan(t)}`);
    if (!close(texValue(a.tex), t, 1e-12, 1e-12)) errs.push(`angle m=${m}: its TeX ${a.tex} is not ${t}`);
    if (a.quadrant !== quadOf(t)) errs.push(`angle ${a.text}: quadrant ${a.quadrant}, the signs say ${quadOf(t)}`);
    if (!close(model.refOf(a).theta, refOf(t), 1e-9, 1e-12)) errs.push(`angle ${a.text}: reference angle ${model.refOf(a).theta}, expected ${refOf(t)}`);
    if (!close(model.nextSpecial(t + 1e-3, -1), t, 1e-9, 1e-9)) errs.push(`nextSpecial does not step back to ${a.text}`);
    if (!close(model.snap(t + 0.02, 0.05), t, 1e-9, 1e-9)) errs.push(`snap misses ${a.text}`);
  }
  for (let i = 0; i <= 400; i++) {
    const t = 2 * PI * i / 400 + 0.003, at = model.at(t);
    if (at.quadrant !== quadOf(t) || !close(at.ref, refOf(t), 1e-9, 1e-9)) { errs.push(`at(${t}): quadrant or reference angle is off`); break; }
  }
  return errs;
}

/* Every key of a problem against its givens. */
export function recheck(model, p, ctx, w, errs) {
  const st = Object.fromEntries(p.steps.map(s => [s.key, s]));
  const num = (k, v, what) => { const s = st[k]; if (!s) errs.push(`${w}: no step ${k}`); else if (!close(s.cell.answer, v, 1e-9, 1e-9)) errs.push(`${w}: ${what} is ${s.cell.answer}, expected ${v}`); };
  const right = k => optText(st[k].options[st[k].correct]);
  const allText = [p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, s.hint || '', ...(s.options || []), ...(s.why || []), ...((s.cell && s.cell.mistakes) || []).map(m => m.why)])].join(' ');
  if (CALC.test(allText.replace(/<annotation[\s\S]*?<\/annotation>/g, ''))) errs.push(`${w}: calculus wording`);
  const g = p.given;
  if (p.type === 'radian') {
    const t = g.s / g.r;
    num('theta', t, 'theta'); if (!close(t, g.m * PI / 12, 1e-12, 1e-12)) errs.push(`${w}: the arc does not give the angle`);
    if (right('quad') !== 'Quadrant ' + ROMAN[quadOf(t)]) errs.push(`${w}: the quadrant option "${right('quad')}" is not Quadrant ${ROMAN[quadOf(t)]}`);
    num('ref', refOf(t), 'reference angle');
  } else if (p.type === 'coords') {
    const t = g.m * PI / 12, c = Math.cos(t), s = Math.sin(t);
    num('cos', Math.abs(c) < 1e-12 ? 0 : c, 'cos'); num('sin', Math.abs(s) < 1e-12 ? 0 : s, 'sin');
    const T = st.tan, want = Math.abs(c) < 1e-12 ? NaN : s / c;
    T.src.forEach((src, i) => {
      const v = texValue(src), isRight = Number.isNaN(want) ? src === 'none' : close(v, want, 1e-9, 1e-12);
      if ((i === T.correct) !== isRight) errs.push(`${w}: tan option ${src} is marked ${i === T.correct ? 'right' : 'wrong'}`);
    });
  } else if (p.type === 'ray') {
    const r = Math.hypot(g.x, g.y);
    num('r', r, 'r'); num('sin', g.y / r, 'sin'); num('cos', g.x / r, 'cos'); num('tan', g.y / g.x, 'tan');
    if (!Number.isInteger(r)) errs.push(`${w}: r is not a whole number`);
  } else if (p.type === 'values') {
    const t = g.m * PI / 12, f = g.fn === 'sin' ? Math.sin : Math.cos;
    num('ref', refOf(t), 'reference angle'); num(g.fn, f(t), g.fn); num('rc', g.r * f(t), 'coordinate on the circle of radius r');
    const want = `cos θ ${Math.cos(t) > 0 ? '>' : '<'} 0 and sin θ ${Math.sin(t) > 0 ? '>' : '<'} 0`;
    if (right('signs') !== want) errs.push(`${w}: the signs option "${right('signs')}" is not "${want}"`);
  } else if (p.type === 'graphs') {
    const f = g.fn === 'sin' ? Math.sin : Math.cos, t = g.m * PI / 12;
    num('val', f(t), 'value');
    const rising = ([a, b]) => { for (let i = 0; i < 200; i++) { const x = a + (b - a) * i / 200; if (!(f(x + (b - a) / 200) > f(x))) return false; } return true; };
    st.inc.options.forEach((o, i) => {
      const ends = piWords(optText(o));
      if (ends.length !== 2) { errs.push(`${w}: interval option "${optText(o)}" does not read`); return; }
      if ((i === st.inc.correct) !== rising(ends)) errs.push(`${w}: interval ${optText(o)} is marked ${i === st.inc.correct ? 'right' : 'wrong'}`);
    });
    const zeros = [0, 1, 2, 3, 4].map(k => k * PI / 2).filter(x => Math.abs(f(x)) < 1e-12);
    st.zero.options.forEach((o, i) => {
      const xs = piWords(optText(o)), same = xs.length === zeros.length && xs.every((x, j) => close(x, zeros[j], 1e-12, 1e-12));
      if ((i === st.zero.correct) !== same) errs.push(`${w}: zeros option "${optText(o)}" is marked ${i === st.zero.correct ? 'right' : 'wrong'}`);
    });
    const a = g.q * PI / 2, b = a + PI / 2, mid = (a + b) / 2, h = PI / 4;
    const inc = f(b) > f(a), r1 = (f(mid) - f(a)) / h, r2 = (f(b) - f(mid)) / h;   // two secant slopes on equal halves
    const want = `y is ${inc ? 'increasing' : 'decreasing'} and the rate of change of y is ${r2 > r1 ? 'increasing' : 'decreasing'}`;
    if (right('rate') !== want) errs.push(`${w}: the rate option "${right('rate')}" is not "${want}"`);
  }
}

export function check(data, map) {
  const errs = [];
  frame(data, 'unit-circle', 'simulator', map, errs);
  const { M, model } = runtime('unit-circle');
  if (!model) { errs.push('the model ApPrecalcMath.unitCircle is not registered (precalculus/assets/tools/math/unit-circle.js)'); return errs; }
  if (model.stub) { errs.push('the model is still the Phase 0 stub: build it before adding data (docs/apprecalc-briefs/t3.md)'); return errs; }
  for (const c of data.contexts || []) {
    if (!KINDS[c.kind]) errs.push(`context ${c.id}: kind "${c.kind}" is not one of ${Object.keys(KINDS).join(', ')}`);
    else if (c.topic !== KINDS[c.kind]) errs.push(`context ${c.id}: kind ${c.kind} belongs to topic ${KINDS[c.kind]} (got ${c.topic})`);
  }
  for (const k of Object.keys(KINDS)) if (!(data.contexts || []).some(c => c.kind === k)) errs.push(`no context for the kind ${k}`);
  for (const k of model.KINDS) if (!KINDS[k]) errs.push(`the model has a kind ${k} this validator does not check`);
  errs.push(...modelProblems(model));
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(model, p, c, w, errs));
  void M;
  return errs;
}
