/* Author A's AP® Precalculus lesson figures (Unit 1 topics 1.1-1.10 and the first seven
   "Algebra you need" topics). Every curve is sampled from the function string the caption
   states, compiled by the course's own parser (precalculus/assets/pcalc-expr.js), so the
   picture cannot drift from the math in the lesson and its questions.

     node scripts/apprecalc-figures/a.mjs   writes precalculus/figures/<id>.svg and the
                                            registry precalculus/data/figures/<topic>.json

   Style (docs/apprecalc-briefs/content-common.md): white background, role="img" with <title>
   and <desc>, Arial/Helvetica, ink #1F2A28, course green #11592F, Okabe-Ito blue #0072B2 and
   vermillion #D55E00; labelled axes, dashed asymptotes, open dots at holes. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Expr } from '../lib/apprecalc-mathlib.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'precalculus', 'figures');
const REG = join(ROOT, 'precalculus', 'data', 'figures');
const INK = '#1F2A28', GREEN = '#11592F', BLUE = '#0072B2', VERM = '#D55E00', GRID = '#E4E8E6', SOFT = '#5B6663';
const COLORS = { green: GREEN, blue: BLUE, verm: VERM, ink: INK, soft: SOFT };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n2 = v => +v.toFixed(2);
const minus = s => String(s).replace(/-/g, '−');

/* spec: { id, topic, title, desc, w, h, x, y, xStep, yStep, xLabel, yLabel,
   curves: [{ fn, domain, color, dashed, width }], vlines: [{ x, color }], hlines: [{ y, color }],
   segs: [{ from: [x, y], to: [x, y], color, dashed }], lines: [{ through: [[x1, y1], [x2, y2]], color, dashed }],
   points: [{ at, open, color, shape }], labels: [{ at, text, color, anchor, dx, dy, size, bold }] } */
function plot(s) {
  const W = s.w || 640, H = s.h || 420, L = 56, R = 20, T = 18, B = 50;
  const [x0, x1] = s.x, [y0, y1] = s.y;
  const sx = v => L + (v - x0) / (x1 - x0) * (W - L - R), sy = v => T + (y1 - v) / (y1 - y0) * (H - T - B);
  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d" font-family="Arial, Helvetica, sans-serif">`);
  out.push(`<title id="t">${esc(s.title)}</title><desc id="d">${esc(s.desc)}</desc>`);
  out.push(`<rect width="${W}" height="${H}" fill="#FFFFFF"/>`);
  out.push(`<clipPath id="c"><rect x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}"/></clipPath>`);
  const ticks = (a, b, st) => { const o = []; for (let v = Math.ceil(a / st - 1e-9) * st; v <= b + 1e-9; v += st) o.push(+v.toFixed(6)); return o; };
  const xt = ticks(x0, x1, s.xStep || 1), yt = ticks(y0, y1, s.yStep || 1);
  for (const v of xt) out.push(`<line x1="${n2(sx(v))}" y1="${T}" x2="${n2(sx(v))}" y2="${H - B}" stroke="${GRID}" stroke-width="1"/>`);
  for (const v of yt) out.push(`<line x1="${L}" y1="${n2(sy(v))}" x2="${W - R}" y2="${n2(sy(v))}" stroke="${GRID}" stroke-width="1"/>`);
  const ax = y0 <= 0 && 0 <= y1 ? sy(0) : H - B, ay = x0 <= 0 && 0 <= x1 ? sx(0) : L;
  out.push(`<line x1="${L}" y1="${n2(ax)}" x2="${W - R}" y2="${n2(ax)}" stroke="${INK}" stroke-width="1.4"/>`);
  out.push(`<line x1="${n2(ay)}" y1="${T}" x2="${n2(ay)}" y2="${H - B}" stroke="${INK}" stroke-width="1.4"/>`);
  for (const v of xt) if (v !== 0) out.push(`<text x="${n2(sx(v))}" y="${n2(ax + 17)}" font-size="13" fill="${INK}" text-anchor="middle" paint-order="stroke" stroke="#FFFFFF" stroke-width="3">${minus(v)}</text>`);
  for (const v of yt) if (v !== 0) out.push(`<text x="${n2(ay - 6)}" y="${n2(sy(v) + 4.5)}" font-size="13" fill="${INK}" text-anchor="end" paint-order="stroke" stroke="#FFFFFF" stroke-width="3">${minus(v)}</text>`);
  out.push(`<text x="${W - R - 4}" y="${n2(ax - 8)}" font-size="15" fill="${INK}" text-anchor="end" font-style="italic">${esc(s.xLabel || 'x')}</text>`);
  out.push(`<text x="${n2(ay + 8)}" y="${T + 14}" font-size="15" fill="${INK}" font-style="italic">${esc(s.yLabel || 'y')}</text>`);
  out.push('<g clip-path="url(#c)">');
  for (const l of s.vlines || []) out.push(`<line x1="${n2(sx(l.x))}" y1="${T}" x2="${n2(sx(l.x))}" y2="${H - B}" stroke="${COLORS[l.color || 'soft']}" stroke-width="1.6" stroke-dasharray="7 5"/>`);
  for (const l of s.hlines || []) out.push(`<line x1="${L}" y1="${n2(sy(l.y))}" x2="${W - R}" y2="${n2(sy(l.y))}" stroke="${COLORS[l.color || 'soft']}" stroke-width="1.6" stroke-dasharray="7 5"/>`);
  for (const l of s.lines || []) {
    const [[a, b], [c, d]] = l.through, m = (d - b) / (c - a), yAt = x => b + m * (x - a);
    out.push(`<line x1="${n2(sx(x0))}" y1="${n2(sy(yAt(x0)))}" x2="${n2(sx(x1))}" y2="${n2(sy(yAt(x1)))}" stroke="${COLORS[l.color || 'blue']}" stroke-width="2"${l.dashed ? ' stroke-dasharray="7 5"' : ''}/>`);
  }
  for (const g of s.segs || []) out.push(`<line x1="${n2(sx(g.from[0]))}" y1="${n2(sy(g.from[1]))}" x2="${n2(sx(g.to[0]))}" y2="${n2(sy(g.to[1]))}" stroke="${COLORS[g.color || 'blue']}" stroke-width="2"${g.dashed === false ? '' : ' stroke-dasharray="6 4"'}/>`);
  for (const c of s.curves || []) {
    const f = Expr.fn(c.fn, ['x']);
    const [a, b] = c.domain || [x0, x1], N = 1200, runs = [[]];
    const span = y1 - y0;
    for (let i = 0; i <= N; i++) {
      const x = a + (b - a) * i / N, y = f(x);
      if (!Number.isFinite(y) || y > y1 + 2 * span || y < y0 - 2 * span) { if (runs[runs.length - 1].length) runs.push([]); continue; }
      const prev = runs[runs.length - 1][runs[runs.length - 1].length - 1];
      if (prev && Math.abs(prev[1] - y) > 1.5 * span) runs.push([]);
      runs[runs.length - 1].push([x, y]);
    }
    for (const r of runs) if (r.length > 1) out.push(`<polyline points="${r.map(([x, y]) => `${n2(sx(x))},${n2(sy(y))}`).join(' ')}" fill="none" stroke="${COLORS[c.color || 'green']}" stroke-width="${c.width || 2.8}"${c.dashed ? ' stroke-dasharray="7 5"' : ''} stroke-linejoin="round" stroke-linecap="round"/>`);
  }
  out.push('</g>');
  for (const p of s.points || []) {
    const c = COLORS[p.color || 'ink'], X = n2(sx(p.at[0])), Y = n2(sy(p.at[1]));
    if (p.shape === 'square') out.push(`<rect x="${n2(X - 5)}" y="${n2(Y - 5)}" width="10" height="10" fill="${p.open ? '#FFFFFF' : c}" stroke="${c}" stroke-width="2"/>`);
    else out.push(`<circle cx="${X}" cy="${Y}" r="5" fill="${p.open ? '#FFFFFF' : c}" stroke="${c}" stroke-width="2.2"/>`);
  }
  for (const t of s.labels || []) out.push(`<text x="${n2(sx(t.at[0]) + (t.dx || 0))}" y="${n2(sy(t.at[1]) + (t.dy || 0))}" font-size="${t.size || 14}" fill="${COLORS[t.color || 'ink']}" text-anchor="${t.anchor || 'start'}" stroke="#FFFFFF" stroke-width="4" stroke-linejoin="round" paint-order="stroke"${t.bold ? ' font-weight="bold"' : ''}>${esc(minus(t.text))}</text>`);
  out.push('</svg>');
  return out.join('\n') + '\n';
}

export const FIGURES = [
  { id: 'alg-functions-graph', topic: 'alg-functions', x: [-5, 6], y: [-2, 3],
    title: 'The graph of f(x) = √(x + 4) − 1',
    desc: 'The graph of f(x) = square root of (x + 4), minus 1, starts at the closed point (−4, −1), crosses the x-axis at the zero (−3, 0), crosses the y-axis at (0, 1) and passes through (5, 2). Its domain is x ≥ −4 and its range is y ≥ −1.',
    curves: [{ fn: 'sqrt(x + 4) - 1', domain: [-4, 6] }],
    points: [{ at: [-4, -1], color: 'green' }, { at: [-3, 0] }, { at: [0, 1] }, { at: [5, 2] }],
    labels: [{ at: [-4, -1], text: 'start (-4, -1)', dx: 10, dy: 18 }, { at: [-3, 0], text: 'zero (-3, 0)', dx: -8, dy: -12, anchor: 'end' }, { at: [0, 1], text: 'y-intercept (0, 1)', dx: 10, dy: 20 }, { at: [5, 2], text: 'f(5) = 2', dx: -6, dy: -12, anchor: 'end' }] },
  { id: 'alg-intervals-outputs', topic: 'alg-intervals', x: [-4, 5], y: [-4, 12], yStep: 2,
    title: 'Inputs that give outputs from −1 up to 9',
    desc: 'The line y = 2x + 3. The solid green piece runs from the closed point (−2, −1) to the open point (3, 9): the inputs in [−2, 3) are exactly the ones whose outputs satisfy −1 ≤ 2x + 3 < 9. Dashed horizontal lines mark y = −1 and y = 9.',
    curves: [{ fn: '2x + 3', color: 'blue', dashed: true, width: 1.8 }, { fn: '2x + 3', domain: [-2, 3] }],
    hlines: [{ y: -1 }, { y: 9 }],
    points: [{ at: [-2, -1], color: 'green' }, { at: [3, 9], color: 'green', open: true }],
    labels: [{ at: [-2, -1], text: '(-2, -1) included', dx: 10, dy: 38 }, { at: [3, 9], text: '(3, 9) not included', dx: -10, dy: -10, anchor: 'end' }, { at: [-3.9, 3], text: 'inputs: [-2, 3)', color: 'green', bold: true }] },
  { id: 'change-in-tandem-shape', topic: 'change-in-tandem', x: [-4.5, 4.5], y: [-6, 6],
    title: 'Where f(x) = (x³ − 12x)/4 is increasing, decreasing, concave up and concave down',
    desc: 'The graph of f(x) = (x³ − 12x)/4 on [−4, 4]. It increases from (−4, −4) to (−2, 4), decreases from (−2, 4) to (2, −4), then increases to (4, 4). Left of x = 0 the graph bends downward (concave down); right of x = 0 it bends upward (concave up).',
    curves: [{ fn: '(x^3 - 12x)/4', domain: [-4, 4] }],
    vlines: [{ x: 0, color: 'verm' }],
    points: [{ at: [-2, 4] }, { at: [2, -4] }, { at: [-4, -4] }, { at: [4, 4] }],
    labels: [{ at: [-3.6, 1.2], text: 'increasing', color: 'blue', anchor: 'end', dx: 40 }, { at: [0.25, 1.9], text: 'decreasing', color: 'blue' }, { at: [3.55, -2.6], text: 'increasing', color: 'blue' }, { at: [-4.3, 5.3], text: 'concave down', color: 'verm', bold: true }, { at: [0.3, -5.4], text: 'concave up', color: 'verm', bold: true }, { at: [-2, 4], text: '(-2, 4)', dy: -12, anchor: 'middle' }, { at: [2, -4], text: '(2, -4)', dy: 22, anchor: 'middle' }] },
  { id: 'alg-lines-slope', topic: 'alg-lines', x: [-1, 6], y: [-1, 10],
    title: 'Slope as rise over run',
    desc: 'The line through (1, 2) and (4, 8). A dashed horizontal run of 3 goes from (1, 2) to (4, 2) and a dashed vertical rise of 6 goes up to (4, 8), so the slope is 6/3 = 2.',
    lines: [{ through: [[1, 2], [4, 8]], color: 'green' }],
    segs: [{ from: [1, 2], to: [4, 2] }, { from: [4, 2], to: [4, 8] }],
    points: [{ at: [1, 2] }, { at: [4, 8] }],
    labels: [{ at: [2.5, 2], text: 'run = 3', dy: 20, anchor: 'middle', color: 'blue' }, { at: [4, 5], text: 'rise = 6', dx: 10, color: 'blue' }, { at: [1, 2], text: '(1, 2)', dx: -10, dy: -6, anchor: 'end' }, { at: [4, 8], text: '(4, 8)', dx: -10, dy: -4, anchor: 'end' }, { at: [0.2, 8.6], text: 'slope = 6/3 = 2', bold: true, color: 'green' }] },
  { id: 'rates-of-change-line', topic: 'rates-of-change', x: [-0.5, 9.5], y: [-1, 13],
    title: 'The average rate of change of f(x) = 4√x on [1, 4]',
    desc: 'The graph of f(x) = 4 times the square root of x for 0 ≤ x ≤ 9, with a blue line through (1, 4) and (4, 8). The slope of that line, (8 − 4)/(4 − 1) = 4/3, is the average rate of change of f on [1, 4].',
    curves: [{ fn: '4sqrt(x)', domain: [0, 9.5] }],
    lines: [{ through: [[1, 4], [4, 8]] }],
    points: [{ at: [1, 4] }, { at: [4, 8] }],
    labels: [{ at: [1, 4], text: '(1, f(1)) = (1, 4)', dx: 10, dy: 20 }, { at: [4, 8], text: '(4, f(4)) = (4, 8)', dx: 10, dy: 22 }, { at: [5.6, 11.6], text: 'slope = 4/3', color: 'blue', bold: true }, { at: [8.9, 12.6], text: 'f', color: 'green', bold: true, size: 16 }] },
  { id: 'alg-quadratics-parabola', topic: 'alg-quadratics', x: [-3, 5], y: [-5, 6],
    title: 'The parabola y = x² − 2x − 3',
    desc: 'The parabola y = x² − 2x − 3 = (x − 1)² − 4 opens upward. Its vertex is (1, −4), on the dashed axis of symmetry x = 1. Its zeros are x = −1 and x = 3, and its y-intercept is (0, −3).',
    curves: [{ fn: 'x^2 - 2x - 3' }],
    vlines: [{ x: 1 }],
    points: [{ at: [-1, 0] }, { at: [3, 0] }, { at: [1, -4], color: 'green' }, { at: [0, -3] }],
    labels: [{ at: [-1, 0], text: '(-1, 0)', dx: -8, dy: -10, anchor: 'end' }, { at: [3, 0], text: '(3, 0)', dx: 8, dy: -10 }, { at: [1, -4], text: 'vertex (1, -4)', dx: 10, dy: 4 }, { at: [0, -3], text: '(0, -3)', dx: -8, dy: 4, anchor: 'end' }, { at: [1, 5.2], text: 'x = 1', dx: 8, color: 'soft' }] },
  { id: 'linear-quadratic-rates-secant', topic: 'linear-quadratic-rates', x: [-0.5, 8.5], y: [-1, 10],
    title: 'A secant line on f(x) = −0.5x² + 4x',
    desc: 'The graph of f(x) = −0.5x² + 4x for 0 ≤ x ≤ 8 and the blue secant line through (1, 3.5) and (5, 7.5), which has slope 1. At x = 2 the secant line gives 4.5 (square) while the graph gives f(2) = 6 (dot): the graph is concave down and lies above the secant line between x = 1 and x = 5.',
    curves: [{ fn: '-0.5x^2 + 4x', domain: [0, 8] }],
    lines: [{ through: [[1, 3.5], [5, 7.5]] }],
    points: [{ at: [1, 3.5] }, { at: [5, 7.5] }, { at: [2, 4.5], color: 'blue', shape: 'square' }, { at: [2, 6], color: 'green' }],
    labels: [{ at: [1, 3.5], text: '(1, 3.5)', dx: 10, dy: 18 }, { at: [5, 7.5], text: '(5, 7.5)', dy: 58, anchor: 'middle' }, { at: [2, 4.5], text: 'secant gives 4.5', dx: 10, dy: 18, color: 'blue' }, { at: [2, 6], text: 'f(2) = 6', dx: -10, dy: -8, anchor: 'end', color: 'green' }, { at: [6.3, 9.6], text: 'secant line', color: 'blue', bold: true }] },
  { id: 'alg-polynomial-algebra-factors', topic: 'alg-polynomial-algebra', x: [-4.5, 4.5], y: [-15, 15], yStep: 5,
    title: 'Each factor of x³ − 9x gives a zero',
    desc: 'The graph of y = x³ − 9x = x(x − 3)(x + 3). It crosses the x-axis at x = −3, 0 and 3, one crossing for each factor: x + 3 = 0, x = 0 and x − 3 = 0.',
    curves: [{ fn: 'x^3 - 9x' }],
    points: [{ at: [-3, 0], color: 'green' }, { at: [0, 0], color: 'green' }, { at: [3, 0], color: 'green' }],
    labels: [{ at: [-3, 0], text: 'x + 3 = 0', dx: 8, dy: 44 }, { at: [0, 0], text: 'x = 0', dx: 10, dy: -12 }, { at: [3, 0], text: 'x - 3 = 0', dy: -14, anchor: 'middle' }, { at: [-4.3, 12.5], text: 'y = x(x - 3)(x + 3)', bold: true, color: 'green' }] },
  { id: 'polynomial-rates-cubic', topic: 'polynomial-rates', x: [-1, 5], y: [-3, 7],
    title: 'Local extrema and a point of inflection of f(x) = x³ − 6x² + 9x',
    desc: 'The graph of f(x) = x³ − 6x² + 9x for −0.4 ≤ x ≤ 4.4. It increases to a local maximum at (1, 4), decreases to a local minimum at (3, 0), then increases. Its point of inflection is (2, 2), where it changes from concave down to concave up.',
    curves: [{ fn: 'x^3 - 6x^2 + 9x', domain: [-0.4, 4.4] }],
    points: [{ at: [1, 4], color: 'green' }, { at: [3, 0], color: 'green' }, { at: [2, 2], color: 'verm', shape: 'square' }],
    labels: [{ at: [1, 4], text: 'local maximum (1, 4)', dy: -14, anchor: 'middle' }, { at: [3, 0], text: 'local minimum (3, 0)', dy: 40, anchor: 'middle' }, { at: [2, 2], text: 'point of inflection (2, 2)', dx: 12, dy: 4, color: 'verm' }, { at: [1.4, 0.8], text: 'concave down', color: 'verm', anchor: 'middle' }, { at: [3.3, 5.6], text: 'concave up', color: 'verm' }] },
  { id: 'alg-complex-numbers-noreal', topic: 'alg-complex-numbers', x: [-6, 2], y: [-1, 16], yStep: 2,
    title: 'A parabola with no x-intercepts',
    desc: 'The parabola y = x² + 4x + 13 = (x + 2)² + 9 has its vertex at (−2, 9) and never reaches the x-axis. The equation x² + 4x + 13 = 0 has no real solutions; its solutions are the complex numbers −2 + 3i and −2 − 3i.',
    curves: [{ fn: 'x^2 + 4x + 13' }],
    points: [{ at: [-2, 9], color: 'green' }],
    labels: [{ at: [-2, 9], text: 'vertex (-2, 9)', dy: 24, anchor: 'middle' }, { at: [-5.8, 3], text: 'no x-intercepts:', bold: true, color: 'verm' }, { at: [-5.8, 1.4], text: 'x = -2 + 3i or -2 - 3i', color: 'verm' }] },
  { id: 'complex-zeros-touch', topic: 'complex-zeros', x: [-3, 4], y: [-6, 7],
    title: 'Crossing and touching zeros of p(x) = 0.25(x + 2)(x − 1)²(x − 3)',
    desc: 'The graph of p(x) = 0.25(x + 2)(x − 1)²(x − 3). It crosses the x-axis at x = −2 and x = 3, the zeros of multiplicity 1, and touches the axis without crossing at x = 1, the zero of multiplicity 2.',
    curves: [{ fn: '0.25(x + 2)(x - 1)^2(x - 3)', domain: [-2.45, 3.55] }],
    points: [{ at: [-2, 0], color: 'green' }, { at: [1, 0], color: 'verm' }, { at: [3, 0], color: 'green' }],
    labels: [{ at: [-2, 0], text: 'crosses at -2', dx: -6, dy: -12, anchor: 'end' }, { at: [1, 0], text: 'touches at 1 (double zero)', dy: -14, anchor: 'middle', color: 'verm' }, { at: [3, 0], text: 'crosses at 3', dx: -8, dy: -12, anchor: 'end' }] },
  { id: 'polynomial-end-behavior-ends', topic: 'polynomial-end-behavior', x: [-4, 4], y: [-8, 8], yStep: 2,
    title: 'End behavior of p(x) = −0.5x³ + 3x',
    desc: 'The graph of p(x) = −0.5x³ + 3x. Its leading term is −0.5x³ (odd degree, negative leading coefficient): the left end rises without bound and the right end falls without bound.',
    curves: [{ fn: '-0.5x^3 + 3x', domain: [-3.6, 3.6] }],
    labels: [{ at: [-3.9, 7.1], text: 'as x → -∞, p(x) → ∞', color: 'blue', bold: true }, { at: [3.9, -7.1], text: 'as x → ∞, p(x) → -∞', color: 'blue', bold: true, anchor: 'end' }, { at: [0.5, 4.6], text: 'leading term -0.5x³', color: 'green' }] },
  { id: 'alg-rational-expressions-missing', topic: 'alg-rational-expressions', x: [-4, 5], y: [-2, 7],
    title: 'The graph of y = (x² − 4)/(x − 2)',
    desc: 'The graph of y = (x² − 4)/(x − 2) is the line y = x + 2 with one point missing: an open circle at (2, 4), because x = 2 is not in the domain of the original expression.',
    curves: [{ fn: '(x^2 - 4)/(x - 2)', domain: [-4, 5] }],
    points: [{ at: [2, 4], open: true, color: 'green' }],
    labels: [{ at: [2, 4], text: '(2, 4) is missing', dx: 12, dy: 24, size: 13 }, { at: [-3.8, 1.2], text: 'same outputs as x + 2 for x ≠ 2', color: 'green', size: 13 }] },
  { id: 'rational-end-behavior-ha', topic: 'rational-end-behavior', x: [-10, 10], y: [-9, 4], xStep: 2,
    title: 'r(x) = (2x² − 8)/(x² + 1) levels off at y = 2',
    desc: 'The graph of r(x) = (2x² − 8)/(x² + 1). Its zeros are x = −2 and x = 2 and its y-intercept is (0, −8). For large positive and negative x the graph gets close to the dashed horizontal asymptote y = 2, the quotient of the leading terms 2x²/x².',
    curves: [{ fn: '(2x^2 - 8)/(x^2 + 1)' }],
    hlines: [{ y: 2, color: 'verm' }],
    points: [{ at: [-2, 0] }, { at: [2, 0] }, { at: [0, -8], color: 'green' }],
    labels: [{ at: [9.8, 2], text: 'y = 2', dy: -8, anchor: 'end', color: 'verm', bold: true }, { at: [0, -8], text: '(0, -8)', dx: 10, dy: 4 }, { at: [-2, 0], text: '(-2, 0)', dx: -8, dy: 36, anchor: 'end' }, { at: [2, 0], text: '(2, 0)', dx: 8, dy: 36 }] },
  { id: 'rational-zeros-sign', topic: 'rational-zeros', x: [-4, 6], y: [-10, 10], yStep: 2,
    title: 'Signs of r(x) = (x + 1)(x − 3)/(x − 1)',
    desc: 'The graph of r(x) = (x + 1)(x − 3)/(x − 1). Its zeros are x = −1 and x = 3; the dashed line x = 1 marks the input that is not in the domain. The output is negative for x < −1, positive for −1 < x < 1, negative for 1 < x < 3 and positive for x > 3.',
    curves: [{ fn: '(x + 1)(x - 3)/(x - 1)' }],
    vlines: [{ x: 1 }],
    points: [{ at: [-1, 0], color: 'green' }, { at: [3, 0], color: 'green' }],
    labels: [{ at: [-2.5, 0], text: '−', dy: 28, anchor: 'middle', size: 22, bold: true, color: 'verm' }, { at: [0.35, 0], text: '+', dy: -10, anchor: 'middle', size: 22, bold: true, color: 'blue' }, { at: [2, 0], text: '−', dy: 28, anchor: 'middle', size: 22, bold: true, color: 'verm' }, { at: [4.6, 0], text: '+', dy: -10, anchor: 'middle', size: 22, bold: true, color: 'blue' }, { at: [1, 9], text: 'x = 1 not in the domain', dx: 8, color: 'soft', size: 13 }] },
  { id: 'vertical-asymptotes-sides', topic: 'vertical-asymptotes', x: [-5, 5], y: [-6, 6],
    title: 'Vertical asymptotes of r(x) = x/((x − 1)(x + 2))',
    desc: 'The graph of r(x) = x/((x − 1)(x + 2)) with dashed vertical asymptotes x = −2 and x = 1. As x approaches −2 from the left the outputs decrease without bound, and from the right they increase without bound. As x approaches 1 from the left the outputs decrease without bound, and from the right they increase without bound.',
    curves: [{ fn: 'x/((x - 1)(x + 2))' }],
    vlines: [{ x: -2, color: 'verm' }, { x: 1, color: 'verm' }],
    points: [{ at: [0, 0] }],
    labels: [{ at: [-2, 5.2], text: 'x = -2', dx: 6, color: 'verm', bold: true }, { at: [1, 5.2], text: 'x = 1', dx: 6, color: 'verm', bold: true }, { at: [-4.9, -5.5], text: 'x → 1⁻: r(x) → -∞', size: 13 }, { at: [1, 3.6], text: 'x → 1⁺: r(x) → ∞', dx: 30, size: 13 }] },
  { id: 'rational-holes-hole', topic: 'rational-holes', x: [-5, 5], y: [-5, 6],
    title: 'A hole and two asymptotes: r(x) = (x² + x − 2)/(x² − 1)',
    desc: 'The graph of r(x) = (x² + x − 2)/(x² − 1), which equals (x + 2)/(x + 1) for x ≠ 1. It has a hole (open circle) at (1, 1.5), a dashed vertical asymptote x = −1 and a dashed horizontal asymptote y = 1. Its zero is x = −2.',
    curves: [{ fn: '(x^2 + x - 2)/(x^2 - 1)' }],
    vlines: [{ x: -1, color: 'verm' }], hlines: [{ y: 1, color: 'verm' }],
    points: [{ at: [1, 1.5], open: true, color: 'green' }, { at: [-2, 0] }],
    labels: [{ at: [1, 1.5], text: 'hole (1, 1.5)', dx: 10, dy: -10, color: 'green', bold: true }, { at: [-1, 5.3], text: 'x = -1', dx: 6, color: 'verm' }, { at: [-4.9, 1], text: 'y = 1', dy: -8, color: 'verm' }, { at: [-2, 0], text: '(-2, 0)', dx: -8, dy: 36, anchor: 'end' }] },
];

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(OUT, { recursive: true }); mkdirSync(REG, { recursive: true });
  const reg = {};
  for (const f of FIGURES) {
    writeFileSync(join(OUT, `${f.id}.svg`), plot(f));
    (reg[f.topic] ||= {})[f.id] = { file: `figures/${f.id}.svg`, ext: 'svg', w: f.w || 640, h: f.h || 420, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt: f.desc };
  }
  for (const [t, r] of Object.entries(reg)) writeFileSync(join(REG, `${t}.json`), JSON.stringify(r, null, 1) + '\n');
  console.log(`wrote ${FIGURES.length} figures`);
}
