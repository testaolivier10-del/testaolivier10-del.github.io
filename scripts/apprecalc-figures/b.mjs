/* Author B's AP® Precalculus lesson figures (Unit 1 topics 1.11-1.14, Unit 2 topics 2.1-2.6,
   "Algebra you need": systems and exponents). Every curve is sampled from the function the
   caption states, so the picture cannot drift from the math.

     node scripts/apprecalc-figures/b.mjs        writes precalculus/figures/<id>.svg

   Style (docs/apprecalc-briefs/content-common.md): white background, role="img" with <title>
   and <desc>, Arial/Helvetica, ink #1F2A28, course green #11592F, Okabe-Ito blue #0072B2 and
   vermillion #D55E00; labelled axes, dashed asymptotes, open dots at holes. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'precalculus', 'figures');
const INK = '#1F2A28', GREEN = '#11592F', BLUE = '#0072B2', VERM = '#D55E00', GRID = '#E4E8E6';
const COLORS = { green: GREEN, blue: BLUE, verm: VERM, ink: INK };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n2 = v => +v.toFixed(2);

/* One plot. spec: { id, title, desc, w, h, x:[a,b], y:[c,d], xStep, yStep, xLabel, yLabel,
   curves:[{f, domain, color, dashed, width}], lines:[{x}|{y}|{slope, b}, color, dashed],
   points:[{at:[x,y], open, color, shape}], labels:[{at:[x,y], text, color, anchor, dx, dy}],
   xTickFmt, yTickFmt } */
function plot(s) {
  const W = s.w || 640, H = s.h || 420, L = 62, R = 20, T = 18, B = 54;
  const [x0, x1] = s.x, [y0, y1] = s.y;
  const sx = v => L + (v - x0) / (x1 - x0) * (W - L - R), sy = v => T + (y1 - v) / (y1 - y0) * (H - T - B);
  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d" font-family="Arial, Helvetica, sans-serif">`);
  out.push(`<title id="t">${esc(s.title)}</title><desc id="d">${esc(s.desc)}</desc>`);
  out.push(`<rect width="${W}" height="${H}" fill="#FFFFFF"/>`);
  out.push(`<clipPath id="c"><rect x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}"/></clipPath>`);
  const ticks = (a, b, st) => { const o = []; for (let v = Math.ceil(a / st - 1e-9) * st; v <= b + 1e-9; v += st) o.push(+v.toFixed(6)); return o; };
  const xt = ticks(x0, x1, s.xStep), yt = ticks(y0, y1, s.yStep);
  for (const v of xt) out.push(`<line x1="${n2(sx(v))}" y1="${T}" x2="${n2(sx(v))}" y2="${H - B}" stroke="${GRID}" stroke-width="1"/>`);
  for (const v of yt) out.push(`<line x1="${L}" y1="${n2(sy(v))}" x2="${W - R}" y2="${n2(sy(v))}" stroke="${GRID}" stroke-width="1"/>`);
  // axes: at 0 when 0 is in the window, else at the window's edge
  const ax = y0 <= 0 && 0 <= y1 ? sy(0) : H - B, ay = x0 <= 0 && 0 <= x1 ? sx(0) : L;
  out.push(`<line x1="${L}" y1="${n2(ax)}" x2="${W - R}" y2="${n2(ax)}" stroke="${INK}" stroke-width="1.4"/>`);
  out.push(`<line x1="${n2(ay)}" y1="${T}" x2="${n2(ay)}" y2="${H - B}" stroke="${INK}" stroke-width="1.4"/>`);
  const fx = s.xTickFmt || (v => String(v)), fy = s.yTickFmt || (v => String(v));
  for (const v of xt) if (v !== 0 || ay === L) out.push(`<text x="${n2(sx(v))}" y="${n2(ax + 17)}" font-size="13" fill="${INK}" text-anchor="middle">${esc(fx(v)).replace('-', '−')}</text>`);
  for (const v of yt) if (v !== 0 || ax === H - B) out.push(`<text x="${n2(ay - 7)}" y="${n2(sy(v) + 4.5)}" font-size="13" fill="${INK}" text-anchor="end">${esc(fy(v)).replace('-', '−')}</text>`);
  out.push(`<text x="${n2((L + W - R) / 2)}" y="${H - 12}" font-size="14" fill="${INK}" text-anchor="middle" font-style="italic">${esc(s.xLabel)}</text>`);
  out.push(`<text transform="translate(16 ${n2((T + H - B) / 2)}) rotate(-90)" font-size="14" fill="${INK}" text-anchor="middle" font-style="italic">${esc(s.yLabel)}</text>`);
  out.push('<g clip-path="url(#c)">');
  for (const l of s.lines || []) {
    const c = COLORS[l.color || 'ink'], d = l.dashed === false ? '' : ' stroke-dasharray="7 5"';
    if ('x' in l) out.push(`<line x1="${n2(sx(l.x))}" y1="${T}" x2="${n2(sx(l.x))}" y2="${H - B}" stroke="${c}" stroke-width="1.6"${d}/>`);
    else if ('y' in l) out.push(`<line x1="${L}" y1="${n2(sy(l.y))}" x2="${W - R}" y2="${n2(sy(l.y))}" stroke="${c}" stroke-width="1.6"${d}/>`);
    else out.push(`<line x1="${n2(sx(x0))}" y1="${n2(sy(l.slope * x0 + l.b))}" x2="${n2(sx(x1))}" y2="${n2(sy(l.slope * x1 + l.b))}" stroke="${c}" stroke-width="1.6"${d}/>`);
  }
  for (const c of s.curves || []) {
    const [a, b] = c.domain || [x0, x1], N = 600, runs = [[]];
    for (let i = 0; i <= N; i++) {
      const x = a + (b - a) * i / N, y = c.f(x);
      if (!Number.isFinite(y) || y > y1 + 3 * (y1 - y0) || y < y0 - 3 * (y1 - y0)) { if (runs[runs.length - 1].length) runs.push([]); continue; }
      runs[runs.length - 1].push(`${n2(sx(x))},${n2(sy(y))}`);
    }
    for (const r of runs) if (r.length > 1) out.push(`<polyline points="${r.join(' ')}" fill="none" stroke="${COLORS[c.color || 'green']}" stroke-width="${c.width || 2.6}"${c.dashed ? ' stroke-dasharray="7 5"' : ''} stroke-linejoin="round" stroke-linecap="round"/>`);
  }
  out.push('</g>');
  for (const p of s.points || []) {
    const c = COLORS[p.color || 'ink'], X = n2(sx(p.at[0])), Y = n2(sy(p.at[1]));
    if (p.shape === 'square') out.push(`<rect x="${X - 5}" y="${Y - 5}" width="10" height="10" fill="${p.open ? '#FFFFFF' : c}" stroke="${c}" stroke-width="2"/>`);
    else out.push(`<circle cx="${X}" cy="${Y}" r="${p.r || 5}" fill="${p.open ? '#FFFFFF' : c}" stroke="${c}" stroke-width="2"/>`);
  }
  for (const t of s.labels || []) out.push(`<text x="${n2(sx(t.at[0]) + (t.dx || 0))}" y="${n2(sy(t.at[1]) + (t.dy || 0))}" font-size="${t.size || 14}" fill="${COLORS[t.color || 'ink']}" text-anchor="${t.anchor || 'start'}" stroke="#FFFFFF" stroke-width="4" stroke-linejoin="round" paint-order="stroke"${t.bold ? ' font-weight="bold"' : ''}>${esc(t.text)}</text>`);
  out.push('</svg>');
  return out.join('\n') + '\n';
}

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// Data shared with the topics (the same numbers are in the lessons and notes).
const FOLLOW = { t: [0, 1, 2, 3, 4, 5, 6], y: [210, 262, 330, 410, 515, 640, 805] }; // model-validation
// Least squares, as a calculator's regression: linear on (t, y), exponential as linear on (t, ln y).
function linfit(xs, ys) {
  const n = xs.length, mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
  let sxy = 0, sxx = 0; xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; });
  const m = sxy / sxx; return { m, b: my - m * mx };
}
const lin = linfit(FOLLOW.t, FOLLOW.y), lg = linfit(FOLLOW.t, FOLLOW.y.map(Math.log));
const expA = Math.exp(lg.b), expB = Math.exp(lg.m);

export const FIGURES = [
  {
    id: 'equivalent-representations-forms', w: 640, h: 440,
    title: 'Three forms of one rational function',
    desc: 'The graph of r(x) = (x^2 - x - 2)/(x - 3) = (x - 2)(x + 1)/(x - 3) = x + 2 + 4/(x - 3). It crosses the x-axis at x = -1 and x = 2, has a dashed vertical asymptote at x = 3 and approaches the dashed slant asymptote y = x + 2 at both ends.',
    x: [-5, 11], y: [-8, 20], xStep: 1, yStep: 4, xLabel: 'x', yLabel: 'y',
    xTickFmt: v => (v % 2 ? '' : String(v)),
    lines: [{ x: 3, color: 'ink' }, { slope: 1, b: 2, color: 'blue' }],
    curves: [{ f: x => (x * x - x - 2) / (x - 3), domain: [-5, 2.999] }, { f: x => (x * x - x - 2) / (x - 3), domain: [3.001, 11] }],
    points: [{ at: [-1, 0], color: 'green' }, { at: [2, 0], color: 'green' }],
    labels: [{ at: [8, 8.3], text: 'y = x + 2', color: 'blue' }, { at: [3, 18.3], text: 'x = 3', dx: -6, anchor: 'end' },
      { at: [-1, 0], text: '(−1, 0)', dx: -4, dy: -26, anchor: 'end', color: 'green' }, { at: [2, 0], text: '(2, 0)', dx: -6, dy: 20, anchor: 'end', color: 'green' }],
  },
  {
    id: 'transformations-parent', w: 640, h: 440,
    title: 'A parent graph and its transformation',
    desc: 'The parent f(x) = x^2 in green with vertex (0, 0), and g(x) = 2f(x - 3) - 1 = 2(x - 3)^2 - 1 in blue with vertex (3, -1): shifted 3 right, stretched vertically by a factor of 2, then shifted 1 down. The point (1, 1) on f moves to (4, 1) on g.',
    x: [-4, 7], y: [-3, 9], xStep: 1, yStep: 1, xLabel: 'x', yLabel: 'y',
    curves: [{ f: x => x * x, color: 'green' }, { f: x => 2 * (x - 3) ** 2 - 1, color: 'blue' }],
    points: [{ at: [0, 0], color: 'green' }, { at: [1, 1], color: 'green' }, { at: [3, -1], color: 'blue' }, { at: [4, 1], color: 'blue' }],
    labels: [{ at: [-2.6, 7.6], text: 'f(x) = x²', color: 'green' }, { at: [4.75, 7.6], text: 'g(x) = 2f(x − 3) − 1', color: 'blue', anchor: 'middle' },
      { at: [3, -1], text: '(3, −1)', dx: 10, dy: 18, color: 'blue' }, { at: [0, 0], text: '(0, 0)', dx: 10, dy: 18, color: 'green' },
      { at: [1, 1], text: '(1, 1)', dx: 8, dy: -6, color: 'green' }, { at: [4, 1], text: '(4, 1)', dx: 9, dy: 4, color: 'blue' }],
  },
  {
    id: 'model-selection-symmetric', w: 640, h: 420,
    title: 'Data with one maximum and symmetry',
    desc: 'Five data points (0, 2), (1, 5), (2, 6), (3, 5), (4, 2) rise to a single highest point at (2, 6) and fall back symmetrically. The quadratic model y = -x^2 + 4x + 2 passes through all five.',
    x: [-0.5, 4.5], y: [0, 7], xStep: 1, yStep: 1, xLabel: 'x', yLabel: 'y',
    curves: [{ f: x => -x * x + 4 * x + 2, color: 'blue', width: 2.2 }],
    points: [0, 1, 2, 3, 4].map(x => ({ at: [x, -x * x + 4 * x + 2], color: 'ink', r: 5.5 })),
    labels: [{ at: [2, 6], text: 'highest point (2, 6)', dy: -12, anchor: 'middle' }, { at: [3.3, 3.6], text: 'y = −x² + 4x + 2', color: 'blue' }],
  },
  {
    id: 'model-construction-quadratic', w: 640, h: 420,
    title: 'A quadratic model through three data points',
    desc: 'Plant sales S(t), in hundreds, t months after March 1. The data points (1, 14), (3, 30) and (5, 30) lie on S(t) = -2t^2 + 16t, drawn for 0 <= t <= 8, the months when the model gives sales that are not negative. The highest point is (4, 32).',
    x: [-0.5, 9], y: [-4, 36], xStep: 1, yStep: 4, xLabel: 't (months after March 1)', yLabel: 'S (hundreds of plants)',
    curves: [{ f: t => -2 * t * t + 16 * t, domain: [0, 8], color: 'blue' }],
    points: [{ at: [1, 14] }, { at: [3, 30] }, { at: [5, 30] }, { at: [0, 0], color: 'blue' }, { at: [8, 0], color: 'blue' }],
    labels: [{ at: [1, 14], text: '(1, 14)', dx: 10, dy: 4 }, { at: [3, 30], text: '(3, 30)', dx: -10, dy: 4, anchor: 'end' }, { at: [5, 30], text: '(5, 30)', dx: 10, dy: 4 },
      { at: [8, 0], text: 'S(8) = 0', dx: -6, dy: -10, anchor: 'end', color: 'blue' }],
  },
  {
    id: 'sequences-dots', w: 640, h: 420,
    title: 'An arithmetic and a geometric sequence',
    desc: 'Dots only, at whole-number inputs n = 0 to 5. The arithmetic sequence a_n = 2 + 5n (green: 2, 7, 12, 17, 22, 27) rises by 5 each step. The geometric sequence g_n = 2^n (blue squares: 1, 2, 4, 8, 16, 32) doubles each step and passes the arithmetic one at n = 5.',
    x: [-0.5, 5.5], y: [0, 34], xStep: 1, yStep: 4, xLabel: 'n', yLabel: 'term value',
    points: [...range(0, 5).map(n => ({ at: [n, 2 + 5 * n], color: 'green', r: 5.5 })), ...range(0, 5).map(n => ({ at: [n, 2 ** n], color: 'blue', shape: 'square' }))],
    labels: [{ at: [0.2, 30], text: '● aₙ = 2 + 5n (add 5)', color: 'green' }, { at: [0.2, 26.5], text: '■ gₙ = 2ⁿ (multiply by 2)', color: 'blue' }],
  },
  {
    id: 'linear-vs-exponential-steps', w: 640, h: 420,
    title: 'Equal steps: added amounts and multiplied amounts',
    desc: 'On equal input steps of 1 from x = 0 to x = 5, the line f(x) = 4 + 6x (green) adds 6 each step: 4, 10, 16, 22, 28, 34. The exponential g(x) = 4(1.5)^x (blue) multiplies by 1.5 each step: 4, 6, 9, 13.5, 20.25, 30.375, and passes the line between x = 5 and x = 6.',
    x: [-0.5, 6.5], y: [0, 52], xStep: 1, yStep: 8, xLabel: 'x', yLabel: 'y',
    curves: [{ f: x => 4 + 6 * x, color: 'green' }, { f: x => 4 * 1.5 ** x, color: 'blue' }],
    points: [...range(0, 6).map(x => ({ at: [x, 4 + 6 * x], color: 'green' })), ...range(0, 6).map(x => ({ at: [x, 4 * 1.5 ** x], color: 'blue', shape: 'square' }))],
    labels: [{ at: [6.4, 30], text: 'f(x) = 4 + 6x', color: 'green', anchor: 'end' }, { at: [5.6, 48], text: 'g(x) = 4(1.5)ˣ', color: 'blue', anchor: 'end' }],
  },
  {
    id: 'exponential-functions-growth-decay', w: 640, h: 420,
    title: 'Exponential growth and decay',
    desc: 'f(x) = 3(2)^x in green rises from left to right and g(x) = 3(1/2)^x in blue falls. Both pass through (0, 3), both are concave up and both approach the dashed horizontal asymptote y = 0: f as x decreases without bound, g as x increases without bound.',
    x: [-4, 4], y: [-1, 13], xStep: 1, yStep: 2, xLabel: 'x', yLabel: 'y',
    lines: [{ y: 0, color: 'verm' }],
    curves: [{ f: x => 3 * 2 ** x, color: 'green' }, { f: x => 3 * 0.5 ** x, color: 'blue' }],
    points: [{ at: [0, 3] }, { at: [1, 6], color: 'green' }, { at: [-1, 6], color: 'blue' }],
    labels: [{ at: [2.1, 8], text: 'f(x) = 3(2)ˣ', color: 'green' }, { at: [-2.1, 8], text: 'g(x) = 3(1/2)ˣ', color: 'blue', anchor: 'end' },
      { at: [0, 3], text: '(0, 3)', dx: 12, dy: 36 }, { at: [3.9, 0], text: 'y = 0', color: 'verm', anchor: 'end', dy: -8 }],
  },
  {
    id: 'exponential-manipulation-shift', w: 640, h: 420,
    title: 'A horizontal shift is a vertical stretch',
    desc: 'The graph of h(x) = 2^(x + 3) in blue is the graph of 2^x in green moved 3 units left. The same blue curve is 8(2^x): every output of 2^x multiplied by 8. The point (0, 1) on 2^x corresponds to (-3, 1) and to (0, 8) on h.',
    x: [-5, 3], y: [-1, 17], xStep: 1, yStep: 2, xLabel: 'x', yLabel: 'y',
    lines: [{ y: 0, color: 'verm' }],
    curves: [{ f: x => 2 ** x, color: 'green' }, { f: x => 2 ** (x + 3), color: 'blue' }],
    points: [{ at: [0, 1], color: 'green' }, { at: [-3, 1], color: 'blue' }, { at: [0, 8], color: 'blue' }],
    labels: [{ at: [2.85, 3.2], text: 'y = 2ˣ', color: 'green', anchor: 'end' }, { at: [-0.75, 13], text: 'h(x) = 2ˣ⁺³ = 8(2ˣ)', color: 'blue', anchor: 'end' },
      { at: [-3, 1], text: '(−3, 1)', dx: -8, dy: -8, color: 'blue', anchor: 'end' }, { at: [0, 8], text: '(0, 8)', dx: 10, dy: 4, color: 'blue' }, { at: [0, 1], text: '(0, 1)', dx: 10, dy: 16, color: 'green' }],
  },
  {
    id: 'exponential-modeling-phone', w: 640, h: 420,
    title: 'An exponential model from two points',
    desc: 'The value V(t) of a phone, in dollars, t years after purchase. Two data points, (0, 800) and (2, 512), give the model V(t) = 800(0.8)^t, drawn for 0 <= t <= 8 and approaching the dashed asymptote V = 0. Each year the value is 80% of the year before.',
    x: [-0.5, 8.5], y: [-40, 880], xStep: 1, yStep: 100, xLabel: 't (years)', yLabel: 'V (dollars)',
    lines: [{ y: 0, color: 'verm' }],
    curves: [{ f: t => 800 * 0.8 ** t, domain: [0, 8.5], color: 'blue' }],
    points: [{ at: [0, 800] }, { at: [2, 512] }],
    labels: [{ at: [0, 800], text: '(0, 800)', dx: 10, dy: -6 }, { at: [2, 512], text: '(2, 512)', dx: 10, dy: -4 }, { at: [5, 330], text: 'V(t) = 800(0.8)ᵗ', color: 'blue' }],
  },
  {
    id: 'model-validation-residuals', w: 640, h: 420,
    title: 'Residual plots for two models of the same data',
    desc: 'Residuals (actual minus predicted followers) for a linear model (vermillion squares) and an exponential model (blue circles) of seven weekly follower counts. The linear residuals form a U: positive, then negative, then positive again. The exponential residuals stay near 0 with no pattern, so the exponential model is the better fit.',
    x: [-0.5, 6.5], y: [-80, 120], xStep: 1, yStep: 20, xLabel: 't (weeks)', yLabel: 'residual (followers)',
    lines: [{ y: 0, color: 'ink', dashed: false }],
    points: [...FOLLOW.t.map((t, i) => ({ at: [t, FOLLOW.y[i] - (lin.m * t + lin.b)], color: 'verm', shape: 'square' })),
      ...FOLLOW.t.map((t, i) => ({ at: [t, FOLLOW.y[i] - expA * expB ** t], color: 'blue' }))],
    labels: [{ at: [0.1, 108], text: '■ linear model', color: 'verm' }, { at: [0.1, 94], text: '● exponential model', color: 'blue' }],
  },
  {
    id: 'alg-systems-lines', w: 640, h: 420,
    title: 'The solution of a system is where the lines meet',
    desc: 'The lines y = 2x - 1 (green) and y = -x + 5 (blue) cross at (2, 3), the one point on both lines, so (2, 3) is the solution of the system.',
    x: [-2, 6], y: [-4, 8], xStep: 1, yStep: 1, xLabel: 'x', yLabel: 'y',
    curves: [{ f: x => 2 * x - 1, color: 'green' }, { f: x => -x + 5, color: 'blue' }],
    points: [{ at: [2, 3] }],
    labels: [{ at: [2, 3], text: '(2, 3)', dx: 4, dy: 30 }, { at: [4.3, 5.8], text: 'y = 2x − 1', color: 'green' }, { at: [-1.8, 5.2], text: 'y = −x + 5', color: 'blue' }],
  },
  {
    id: 'alg-exponents-roots', w: 640, h: 420,
    title: 'Rational exponents as roots',
    desc: 'y = x^(1/2), the square root, in green and y = x^(1/3), the cube root, in blue, for x from 0 to 9. They meet at (0, 0) and (1, 1). The square root reaches 2 at x = 4 and 3 at x = 9; the cube root reaches 2 at x = 8.',
    x: [-0.5, 9.5], y: [-0.5, 3.5], xStep: 1, yStep: 0.5, xLabel: 'x', yLabel: 'y',
    yTickFmt: v => (Number.isInteger(v) ? String(v) : ''),
    curves: [{ f: x => Math.sqrt(x), domain: [0, 9.5], color: 'green' }, { f: x => Math.cbrt(x), domain: [0, 9.5], color: 'blue' }],
    points: [{ at: [4, 2], color: 'green' }, { at: [9, 3], color: 'green' }, { at: [8, 2], color: 'blue' }, { at: [1, 1] }],
    labels: [{ at: [4, 2], text: '(4, 2)', dx: -8, dy: -8, color: 'green', anchor: 'end' }, { at: [9, 3], text: '(9, 3)', dx: -8, dy: -8, color: 'green', anchor: 'end' },
      { at: [8, 2], text: '(8, 2)', dx: 0, dy: 22, color: 'blue', anchor: 'middle' }, { at: [1, 1], text: '(1, 1)', dx: 8, dy: 18 },
      { at: [5.5, 2.75], text: 'y = x^(1/2)', color: 'green' }, { at: [6.2, 1.55], text: 'y = x^(1/3)', color: 'blue' }],
  },
];

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync(OUT, { recursive: true });
  for (const f of FIGURES) writeFileSync(join(OUT, `${f.id}.svg`), plot(f));
  console.log(`wrote ${FIGURES.length} figures to precalculus/figures/`);
  console.log('model-validation fits:', JSON.stringify({ lin, expA, expB }));
}
