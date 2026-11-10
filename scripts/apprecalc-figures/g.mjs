/* Figures for the AP® Precalculus textbook notes that had none (topics 2.7-2.15,
   3.9 and 4.2). Graphs go through ApPrecalcPlot.svg, the same way as
   scripts/apprecalc-figures/c.mjs (curves are sampled from the function they
   claim to show), with extra marks (segments, arrows, boxes) placed with the
   plot's own frame. Two figures are drawn here in full: the composition
   machines and the pair of plots that compares ordinary and semi-log axes.
   Every figure is 400 px wide or less, so its labels stay readable on a phone.

     node scripts/apprecalc-figures/g.mjs            write every figure
     node scripts/apprecalc-figures/g.mjs <id> ...   write some

   Writes precalculus/figures/<id>.svg and registers each figure (size, credit,
   alt text) in precalculus/data/figures/<topic>.json, keeping the entries that
   are already there. */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Plot } from '../lib/apprecalc-mathlib.mjs';
import { plotFigure, INK, GREEN, BLUE, VERM, GRID } from './c.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'precalculus', 'figures');
const REG = join(ROOT, 'precalculus', 'data', 'figures');
const GRAY = '#6B7470', PI = Math.PI;
const r2 = v => Math.round(v * 100) / 100;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* A plot figure with extra marks: extra(F, m) returns SVG drawn over the plot,
   where F is the plot's frame and m the helpers below (data coordinates). */
function fig(spec, title, desc, extra) {
  const svg = plotFigure(spec, title, desc);
  if (!extra) return svg;
  const F = Plot.frame(spec);
  const m = {
    seg: (p, q, color = INK, w = 2, dash) => `<line x1="${r2(F.sx(p[0]))}" y1="${r2(F.sy(p[1]))}" x2="${r2(F.sx(q[0]))}" y2="${r2(F.sy(q[1]))}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`,
    dot: (p, color = GREEN, open) => `<circle cx="${r2(F.sx(p[0]))}" cy="${r2(F.sy(p[1]))}" r="4" fill="${open ? '#fff' : color}" stroke="${color}" stroke-width="2"/>`,
    text: (p, s, o = {}) => `<text x="${r2(F.sx(p[0]) + (o.dx || 0))}" y="${r2(F.sy(p[1]) + (o.dy || 0))}" text-anchor="${o.anchor || 'start'}" style="font-weight:700;font-size:12px${o.color ? `;fill:${o.color}` : ''}">${esc(s)}</text>`,
    path: (pts, color = GREEN, w = 2.6, dash) => `<path d="M${pts.map(p => `${r2(F.sx(p[0]))} ${r2(F.sy(p[1]))}`).join('L')}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`,
  };
  return svg.replace(/<\/svg>\s*$/, extra(F, m) + '</svg>');
}

const head = (W, H, title, desc) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><desc>${esc(desc)}</desc><style>text{font:600 11px Arial,Helvetica,sans-serif;fill:${INK};}</style><rect width="${W}" height="${H}" fill="#fff"/>`;
function arrow(x1, y1, x2, y2, color = INK) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, bx = x2 - ux * 9, by = y2 - uy * 9;
  return `<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(bx)}" y2="${r2(by)}" stroke="${color}" stroke-width="2"/><polygon points="${r2(x2)},${r2(y2)} ${r2(bx - uy * 4.5)},${r2(by + ux * 4.5)} ${r2(bx + uy * 4.5)},${r2(by - ux * 4.5)}" fill="${color}"/>`;
}

/* Two machines in a row: in -> [g] -> mid -> [f] -> out, once for a general
   input x and once for the numbers of worked example 1. */
function machines() {
  const W = 400, H = 232, o = [];
  const row = (y, vals, note) => {
    const [a, b, c] = vals, t = (x, s, color) => `<text x="${x}" y="${y + 5}" text-anchor="middle" style="font-weight:700;font-size:15px${color ? `;fill:${color}` : ''}">${esc(s)}</text>`;
    o.push(`<text x="20" y="${y - 44}" style="font-weight:700;font-size:12px">${esc(note)}</text>`);
    o.push(t(22, a));
    o.push(arrow(36, y, 62, y));
    o.push(`<rect x="64" y="${y - 26}" width="60" height="52" rx="8" fill="#E3F0F8" stroke="${BLUE}" stroke-width="2"/>`, t(94, 'g', BLUE));
    o.push(arrow(126, y, 150, y));
    o.push(t(176, b));
    o.push(arrow(202, y, 226, y));
    o.push(`<rect x="228" y="${y - 26}" width="60" height="52" rx="8" fill="#E4F1E8" stroke="${GREEN}" stroke-width="2"/>`, t(258, 'f', GREEN));
    o.push(arrow(290, y, 314, y));
    o.push(t(356, c));
  };
  row(70, ['x', 'g(x)', 'f(g(x))'], 'Any input: g works first, then f');
  o.push(`<line x1="20" x2="${W - 20}" y1="116" y2="116" stroke="${GRID}" stroke-width="1.5"/>`);
  row(182, ['2', '0', '4'], 'Worked example 1: g(2) = 0, then f(0) = 4');
  const title = 'A composite function as two machines in a row';
  const desc = 'Top row: an input x goes into the machine g, which sends out g(x); that output goes into the machine f, which sends out f(g(x)). Bottom row, with the numbers of worked example 1: 2 goes into g and comes out as 0; 0 goes into f and comes out as 4, so f(g(2)) = 4.';
  return head(W, H, title, desc) + o.join('') + '</svg>';
}

/* The same data, y = 3 * 2^t for t = 0..6, on ordinary axes (top) and on a
   base-10 log scale (bottom). The two panels share the horizontal scale. */
function comparePanels() {
  const W = 380, L = 58, R = 16, iw = W - L - R, ih = 150, T1 = 34, T2 = T1 + ih + 70, H = T2 + ih + 46, o = [];
  const f = t => 3 * Math.pow(2, t), pts = [0, 1, 2, 3, 4, 5, 6].map(t => [t, f(t)]);
  const sx = t => L + t / 6 * iw;
  const y1 = v => T1 + (200 - v) / 200 * ih;                // ordinary: 0 to 200
  const y2 = v => T2 + (3 - Math.log10(v)) / 3 * ih;        // log scale: 1 to 1,000
  const frame = (T, title) => {
    for (let t = 0; t <= 6; t++) o.push(`<line x1="${r2(sx(t))}" x2="${r2(sx(t))}" y1="${T}" y2="${T + ih}" stroke="${GRID}" stroke-width="0.8"/>`, `<text x="${r2(sx(t))}" y="${T + ih + 16}" text-anchor="middle">${t}</text>`);
    o.push(`<text x="${L}" y="${T - 12}" style="font-weight:700;font-size:12px">${esc(title)}</text>`);
    o.push(`<text x="${L + iw / 2}" y="${T + ih + 34}" text-anchor="middle" style="font-weight:700;font-size:12px">hours, t</text>`);
  };
  frame(T1, 'Ordinary axis: equal steps add 50');
  for (let v = 0; v <= 200; v += 50) o.push(`<line x1="${L}" x2="${L + iw}" y1="${r2(y1(v))}" y2="${r2(y1(v))}" stroke="#C9D0CD" stroke-width="1"/>`, `<text x="${L - 7}" y="${r2(y1(v) + 4)}" text-anchor="end">${v}</text>`);
  frame(T2, 'Log axis: equal steps multiply by 10');
  for (let d = 0; d <= 3; d++) {
    const v = Math.pow(10, d);
    o.push(`<line x1="${L}" x2="${L + iw}" y1="${r2(y2(v))}" y2="${r2(y2(v))}" stroke="#C9D0CD" stroke-width="1"/>`, `<text x="${L - 7}" y="${r2(y2(v) + 4)}" text-anchor="end">${String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</text>`);
    if (d < 3) for (let k = 2; k <= 9; k++) o.push(`<line x1="${L}" x2="${L + iw}" y1="${r2(y2(k * v))}" y2="${r2(y2(k * v))}" stroke="${GRID}" stroke-width="0.8"/>`);
  }
  for (const T of [T1, T2]) o.push(`<line x1="${L}" x2="${L + iw}" y1="${T + ih}" y2="${T + ih}" stroke="${INK}" stroke-width="1.3"/><line x1="${L}" x2="${L}" y1="${T}" y2="${T + ih}" stroke="${INK}" stroke-width="1.3"/>`);
  const curve = [];
  for (let i = 0; i <= 120; i++) { const t = 6 * i / 120; curve.push(`${r2(sx(t))} ${r2(y1(f(t)))}`); }
  o.push(`<path d="M${curve.join('L')}" fill="none" stroke="${BLUE}" stroke-width="2"/>`);
  o.push(`<line x1="${r2(sx(0))}" y1="${r2(y2(f(0)))}" x2="${r2(sx(6))}" y2="${r2(y2(f(6)))}" stroke="${BLUE}" stroke-width="2"/>`);
  for (const p of pts) o.push(`<circle cx="${r2(sx(p[0]))}" cy="${r2(y1(p[1]))}" r="4.5" fill="${GREEN}"/>`, `<circle cx="${r2(sx(p[0]))}" cy="${r2(y2(p[1]))}" r="4.5" fill="${GREEN}"/>`);
  const lab = (x, y, s, anchor = 'start') => o.push(`<text x="${r2(x)}" y="${r2(y)}" text-anchor="${anchor}" style="font-weight:700;font-size:12px">${esc(s)}</text>`);
  lab(sx(6) - 10, y1(192) + 5, '(6, 192)', 'end');
  lab(sx(1), y1(60), 'early points crowd the axis');
  lab(sx(6) - 10, y2(192) - 4, '(6, 192)', 'end');
  lab(sx(0) + 9, y2(3) + 16, '(0, 3)');
  lab(sx(2.6), y2(3.4), 'one straight line');
  for (const [T, s] of [[T1, 'bacteria (thousands)'], [T2, 'bacteria (thousands)']]) o.push(`<text transform="translate(14 ${T + ih / 2}) rotate(-90)" text-anchor="middle" style="font-weight:700;font-size:12px">${s}</text>`);
  const title = 'The same exponential data on ordinary axes and on a semi-log plot';
  const desc = 'Top: on ordinary axes from 0 to 200, the data y = 3·2^t for t = 0 to 6 hours (3, 6, 12, 24, 48, 96, 192 thousand bacteria) make a concave up curve; the first four points sit close to the horizontal axis and the last, (6, 192), is near the top. Bottom: on a vertical log scale where 1, 10, 100 and 1,000 are equally spaced, the same seven points lie on one straight line from (0, 3) to (6, 192).';
  return head(W, H, title, desc) + o.join('') + '</svg>';
}

const log2 = Math.log2, ln = Math.log, log3 = x => Math.log(x) / Math.log(3);
const xt = t => t * t + 1, yt = t => 4 * t - t * t;          // the curve in "Reading the sign"

export const FIGURES = {
  /* ---- 3.9 inverse trigonometric functions */
  'inverse-trig-sine-piece': { topic: 'inverse-trig',
    alt: 'Graph of y = sin x from about negative pi to 2 pi in gray, with the piece from negative pi over 2 to pi over 2 drawn in heavy green, rising from (negative pi over 2, -1) to (pi over 2, 1). A dashed horizontal line at height one half crosses the sine curve at pi over 6 and again at 5 pi over 6.',
    make: () => fig({
      label: 'Graph of y = sin x with the piece from negative pi over 2 to pi over 2 highlighted and the line y = 1/2 crossing the curve twice',
      width: 400, height: 250, x: [-3.7, 6.9], y: [-1.7, 1.9], piX: true, yStep: 1, xLabel: 'x', yLabel: 'y',
      curves: [{ fn: Math.sin, domain: [-3.7, 6.9], cls: 's4' }, { fn: Math.sin, domain: [-PI / 2, PI / 2], cls: 's1' }],
      lines: [{ through: [[-3.7, 0.5], [6.9, 0.5]], cls: 's2', dashed: true }],
      points: [{ at: [-PI / 2, -1], cls: 's1' }, { at: [PI / 2, 1], cls: 's1' }, { at: [PI / 6, 0.5], cls: 's3' }, { at: [5 * PI / 6, 0.5], cls: 's3' }],
      labels: [{ at: [PI / 2, 1.42], text: 'height 1/2 at π/6 and at 5π/6', anchor: 'middle' }, { at: [0.35, -0.8], text: 'kept piece:', anchor: 'start' }, { at: [0.35, -1.2], text: '−π/2 to π/2', anchor: 'start' }, { at: [-3.6, 0.68], text: 'y = 1/2', anchor: 'start' }],
    }, 'Sine repeats its outputs, so one piece is kept', 'The full graph of y = sin x is gray. The dashed line y = 1/2 meets it at x = π/6 and again at x = 5π/6, so two inputs share one output and sine has no inverse on its whole domain. The heavy green piece, from (−π/2, −1) to (π/2, 1), rises the whole way and takes every output from −1 to 1 exactly once.') },
  'inverse-trig-arctan': { topic: 'inverse-trig',
    alt: 'Graph of y = inverse tangent of x for x from -6 to 6. The curve rises through (0, 0) and (1, pi over 4) and levels off between two dashed horizontal asymptotes, y = pi over 2 above and y = negative pi over 2 below.',
    make: () => fig({
      label: 'Graph of y = inverse tangent of x with dashed horizontal asymptotes at y = pi over 2 and y = negative pi over 2',
      width: 400, height: 250, x: [-6.5, 6.5], y: [-2.3, 2.3], xStep: 2, yStep: 1, xLabel: 'x', yLabel: 'y',
      curves: [{ fn: Math.atan, domain: [-6.5, 6.5], cls: 's1' }],
      asymptotes: [{ y: PI / 2 }, { y: -PI / 2 }],
      points: [{ at: [0, 0], cls: 's1' }, { at: [1, PI / 4], cls: 's1' }],
      labels: [{ at: [-6.3, 1.78], text: 'y = π/2 ≈ 1.571', anchor: 'start' }, { at: [6.3, -2.02], text: 'y = −π/2', anchor: 'end' }, { at: [1.4, 0.42], text: '(1, π/4)', anchor: 'start' }, { at: [-3.4, -0.62], text: 'y = tan⁻¹ x', anchor: 'middle' }],
    }, 'The inverse tangent function and its two horizontal asymptotes', 'y = tan⁻¹ x is defined for every real x and always increases. It passes through (0, 0) and (1, π/4). Far to the right it levels off under the dashed line y = π/2; far to the left it levels off above the dashed line y = −π/2. Its outputs stay strictly between −π/2 and π/2.') },

  /* ---- 4.2 parametric functions and rates of change */
  'parametric-rates-skier': { topic: 'parametric-rates',
    alt: 'The four logged positions of the skier: (0, 50) at t = 0, (6, 46) at t = 2, (16, 38) at t = 4 and (30, 26) at t = 6, joined by thin gray segments. A heavy blue segment joins (6, 46) to (30, 26). Dashed legs show a change in x of 24 and a change in y of -20, so the segment has slope -5/6.',
    make: () => fig({
      label: 'The skier at t = 0, 2, 4 and 6 seconds, with the segment from (6, 46) to (30, 26) and its legs, change in x = 24 and change in y = -20',
      width: 400, height: 300, x: [0, 42], y: [18, 56], xStep: 6, yStep: 4, xLabel: 'x (m)', yLabel: 'y (m)',
      labels: [],
    }, 'The slope of the skier\'s path between t = 2 and t = 6', 'Horizontal distance x and height y in meters. The skier is at (0, 50) at t = 0, (6, 46) at t = 2, (16, 38) at t = 4 and (30, 26) at t = 6. The segment from (6, 46) to (30, 26) has a horizontal leg of 24 and a vertical leg of −20, so its slope is −20/24 = −5/6.', (F, m) => [
      m.path([[0, 50], [6, 46], [16, 38], [30, 26]], GRAY, 1.6),
      m.seg([6, 46], [30, 46], VERM, 1.8, '5 4'), m.seg([30, 46], [30, 26], VERM, 1.8, '5 4'),
      m.seg([6, 46], [30, 26], BLUE, 2.8),
      m.dot([0, 50], GRAY), m.dot([16, 38], GRAY), m.dot([6, 46], BLUE), m.dot([30, 26], BLUE),
      m.text([0, 50], 't = 0', { dx: 8, dy: -8 }), m.text([6, 46], 't = 2', { dx: -2, dy: 18, anchor: 'end' }),
      m.text([16, 38], 't = 4', { dx: -9, dy: 14, anchor: 'end' }), m.text([30, 26], 't = 6', { dx: 0, dy: 19, anchor: 'middle' }),
      m.text([18, 46], 'change in x = 24', { dy: -8, anchor: 'middle', color: VERM }),
      m.text([30, 37], 'change in y', { dx: 8, color: VERM }), m.text([30, 37], '= −20', { dx: 8, dy: 15, color: VERM }),
      m.text([2, 25], 'slope = −20/24 = −5/6', { color: BLUE }),
    ].join('')) },
  'parametric-rates-flat': { topic: 'parametric-rates',
    alt: 'The curve x(t) = t squared plus 1, y(t) = 4t minus t squared for t from 0 to 4. It starts at (1, 0), rises to (5, 4) at t = 2 and falls to (17, 0). A dashed horizontal segment joins the points at t = 1, (2, 3), and t = 3, (10, 3): its slope is 0 although the point moved 8 units right.',
    make: () => fig({
      label: 'The path (t squared + 1, 4t - t squared) for t from 0 to 4 with a horizontal dashed segment joining its points at t = 1 and t = 3',
      width: 400, height: 250, x: [0, 20], y: [-1, 5], xStep: 2, yStep: 1, xLabel: 'x', yLabel: 'y',
      labels: [],
    }, 'A segment of slope 0 on a path that moved', 'The point (t² + 1, 4t − t²) starts at (1, 0) when t = 0, climbs to its highest position (5, 4) at t = 2 and comes down to (17, 0) at t = 4. The dashed segment from (2, 3), at t = 1, to (10, 3), at t = 3, is horizontal: the change in y is 0 while the change in x is 8.', (F, m) => {
      const pts = []; for (let i = 0; i <= 160; i++) { const t = 4 * i / 160; pts.push([xt(t), yt(t)]); }
      return [m.path(pts, GREEN), m.seg([xt(1), yt(1)], [xt(3), yt(3)], BLUE, 2.2, '6 5'),
        m.dot([xt(0), yt(0)], GREEN), m.dot([xt(2), yt(2)], GREEN), m.dot([xt(4), yt(4)], GREEN), m.dot([xt(1), yt(1)], BLUE), m.dot([xt(3), yt(3)], BLUE),
        m.text([1, 0], 't = 0', { dx: 9, dy: -7 }), m.text([5, 4], 't = 2', { dy: -10, anchor: 'middle' }), m.text([17, 0], 't = 4', { dx: 8, dy: -8 }),
        m.text([2, 3], 't = 1: (2, 3)', { dx: 10, dy: 17 }), m.text([10, 3], 't = 3: (10, 3)', { dx: 9, dy: -6 }),
        m.text([6, 1.55], 'change in y = 0, change in x = 8', { anchor: 'middle', dx: 22, color: BLUE }),
      ].join('');
    }) },

  /* ---- 2.15 semi-log plots */
  'semi-log-plots-compare': { topic: 'semi-log-plots',
    alt: 'Two plots of the same data, y = 3 times 2 to the t for t = 0 to 6 hours. On ordinary axes from 0 to 200 the points make a concave up curve with the early points crowded near the axis. On a semi-log plot, with 1, 10, 100 and 1,000 equally spaced, the same points lie on a straight line from (0, 3) to (6, 192).',
    make: comparePanels },

  /* ---- 2.7 composition of functions */
  'composition-machine': { topic: 'composition',
    alt: 'Two rows of machines. Top row: x goes into machine g, g(x) comes out and goes into machine f, and f(g(x)) comes out. Bottom row with numbers: 2 goes into g, 0 comes out and goes into f, and 4 comes out.',
    make: machines },
  'composition-solve': { topic: 'composition',
    alt: 'A parabola g and a line f on the same axes. The dashed line y = 2 meets the parabola at (-1, 2) and (3, 2). The line f passes through (0, -1) and (2, 3), so its outputs are -1 and 3 at x = 0 and x = 2.',
    make: () => fig({
      label: 'Graph of a parabola g with g(-1) = g(3) = 2 and a line f with f(0) = -1 and f(2) = 3, used to solve g(f(x)) = 2',
      width: 380, height: 320, x: [-3, 5], y: [-3, 6], xStep: 1, yStep: 1, xLabel: 'x', yLabel: 'y',
      curves: [{ fn: 'x^2 - 2x - 1', domain: [-1.85, 3.85], cls: 's2' }, { fn: '2x - 1', domain: [-1, 3.5], cls: 's1' }],
      lines: [{ through: [[-3, 2], [5, 2]], cls: 's4', dashed: true }],
      points: [{ at: [-1, 2], cls: 's2' }, { at: [3, 2], cls: 's2' }, { at: [0, -1], cls: 's1' }, { at: [2, 3], cls: 's1' }],
      labels: [{ at: [-1.2, 2.3], text: '(−1, 2)', anchor: 'end' }, { at: [3.25, 1.45], text: '(3, 2)', anchor: 'start' }, { at: [0.25, -1.45], text: '(0, −1)', anchor: 'start' }, { at: [1.8, 3.25], text: '(2, 3)', anchor: 'end' },
        { at: [-1.75, 5.2], text: 'g', anchor: 'end' }, { at: [-1.15, -2.75], text: 'f', anchor: 'end' }, { at: [4.9, 2.3], text: 'y = 2', anchor: 'end' }],
    }, 'Solving g(f(x)) = 2 from two graphs', 'The parabola g(x) = x² − 2x − 1 reaches the height 2 at the inputs −1 and 3, the points (−1, 2) and (3, 2) on the dashed line y = 2. The line f(x) = 2x − 1 has output −1 at x = 0 and output 3 at x = 2, the points (0, −1) and (2, 3). So g(f(x)) = 2 when x = 0 or x = 2.') },

  /* ---- 2.8 inverse functions */
  'inverse-functions-restrict': { topic: 'inverse-functions',
    alt: 'The parabola y = (x - 2) squared + 1. Its left half, for x less than 2, is dashed gray; its right half, for x at least 2, is solid green starting at the vertex (2, 1). The inverse, y = 2 + square root of (x - 1), is blue and starts at (1, 2). The two solid curves mirror each other across the dashed line y = x; (3, 2) on f matches (2, 3) on the inverse.',
    make: () => fig({
      label: 'Graph of f(x) = (x - 2) squared + 1 kept for x at least 2, its inverse 2 + square root of (x - 1), and the mirror line y = x',
      width: 380, height: 360, x: [-1, 7], y: [-1, 7], xStep: 1, yStep: 1, xLabel: 'x', yLabel: 'y',
      curves: [{ fn: '(x - 2)^2 + 1', domain: [-0.42, 2], cls: 's4', dashed: true }, { fn: '(x - 2)^2 + 1', domain: [2, 4.42], cls: 's1' }, { fn: '2 + sqrt(x - 1)', domain: [1, 7], cls: 's2' }, { fn: 'x', domain: [-1, 7], cls: 's4', dashed: true }],
      points: [{ at: [2, 1], cls: 's1' }, { at: [1, 2], cls: 's2' }, { at: [3, 2], cls: 's1' }, { at: [2, 3], cls: 's2' }],
      labels: [{ at: [2.25, 0.45], text: '(2, 1)', anchor: 'start' }, { at: [0.88, 1.45], text: '(1, 2)', anchor: 'end' }, { at: [3.3, 1.75], text: '(3, 2)', anchor: 'start' }, { at: [1.85, 3.35], text: '(2, 3)', anchor: 'end' },
        { at: [3.9, 6.3], text: 'f, x ≥ 2', anchor: 'end' }, { at: [6.9, 3.75], text: 'f⁻¹', anchor: 'end' }, { at: [6.2, 5.35], text: 'y = x', anchor: 'start' }, { at: [0.75, 5.3], text: 'dropped', anchor: 'start' }],
    }, 'Restricting a parabola so that it has an inverse', 'f(x) = (x − 2)² + 1 has its vertex at (2, 1). The left half, x < 2, is dashed: it is dropped. The right half, x ≥ 2, is increasing, so it has an inverse, f⁻¹(x) = 2 + √(x − 1), which starts at (1, 2). The kept half and its inverse are mirror images across the dashed line y = x: (3, 2) on f matches (2, 3) on the inverse.') },

  /* ---- 2.11 logarithmic functions */
  'logarithmic-functions-shape': { topic: 'logarithmic-functions',
    alt: 'Graph of y = log base 2 of x. It exists only to the right of the y-axis, drops without bound near the vertical asymptote x = 0, crosses the x-axis at (1, 0) and rises more and more slowly through (2, 1), (4, 2) and (8, 3), bending downward the whole way.',
    make: () => fig({
      label: 'Graph of y = log base 2 of x with the points (1, 0), (2, 1), (4, 2) and (8, 3) and the vertical asymptote x = 0',
      width: 390, height: 290, x: [-1.5, 9.5], y: [-4.5, 4.5], xStep: 1, yStep: 1, xLabel: 'x', yLabel: 'y',
      curves: [{ fn: log2, domain: [0.045, 9.5], cls: 's1' }],
      asymptotes: [{ x: 0 }],
      points: [{ at: [1, 0], cls: 's1' }, { at: [2, 1], cls: 's1' }, { at: [4, 2], cls: 's1' }, { at: [8, 3], cls: 's1' }],
      labels: [{ at: [1.3, -0.95], text: '(1, 0)', anchor: 'start' }, { at: [2.25, 0.4], text: '(2, 1)', anchor: 'start' }, { at: [4.2, 1.35], text: '(4, 2)', anchor: 'start' }, { at: [7.9, 3.45], text: '(8, 3)', anchor: 'end' },
        { at: [0.5, -3.6], text: 'asymptote x = 0', anchor: 'start' }, { at: [5.6, 3.6], text: 'y = log₂ x', anchor: 'end' }],
    }, 'The basic shape of a logarithmic function', 'y = log₂ x is defined only for x > 0. Near the dashed vertical asymptote x = 0 the graph drops without bound. It crosses the x-axis at (1, 0), passes through (2, 1), (4, 2) and (8, 3), and keeps rising, more slowly each time: the graph is increasing and concave down.') },
  'logarithmic-functions-moved': { topic: 'logarithmic-functions',
    alt: 'Graphs of y = log base 2 of x, in blue with its dashed asymptote x = 0, and h(x) = log base 2 of (x + 4) minus 1, in green with its dashed asymptote x = -4. The graph of h is the blue graph moved 4 units left and 1 unit down; it crosses the x-axis at (-2, 0).',
    make: () => fig({
      label: 'Graphs of y = log base 2 of x and h(x) = log base 2 of (x + 4) - 1, whose vertical asymptote is x = -4',
      width: 390, height: 290, x: [-6, 6], y: [-5, 4], xStep: 1, yStep: 1, xLabel: 'x', yLabel: 'y',
      curves: [{ fn: log2, domain: [0.032, 6], cls: 's2' }, { fn: x => log2(x + 4) - 1, domain: [-3.937, 6], cls: 's1' }],
      asymptotes: [{ x: -4 }, { x: 0 }],
      points: [{ at: [-2, 0], cls: 's1' }, { at: [1, 0], cls: 's2' }],
      labels: [{ at: [-2.2, 0.4], text: '(−2, 0)', anchor: 'end' }, { at: [1.3, -0.95], text: '(1, 0)', anchor: 'start' }, { at: [-4.2, -4.4], text: 'x = −4', anchor: 'end' },
        { at: [-1.9, 2.2], text: 'y = h(x)', anchor: 'end' }, { at: [5.9, 1.2], text: 'y = log₂ x', anchor: 'end' }],
    }, 'A shift moves the vertical asymptote', 'The blue graph is y = log₂ x, with vertical asymptote x = 0 and zero (1, 0). The green graph is h(x) = log₂(x + 4) − 1: the same shape moved 4 units left and 1 unit down. Its vertical asymptote is the dashed line x = −4, it is defined only for x > −4, and it crosses the x-axis at (−2, 0).') },

  /* ---- 2.14 logarithmic function context and data modeling */
  'logarithmic-modeling-typing': { topic: 'logarithmic-modeling',
    alt: 'Scatter plot of typing speed against hours of practice with the curve y = 20 + 6 log base 3 of x through the five points (1, 20), (3, 26), (9, 32), (27, 38) and (81, 44). The points get farther and farther apart horizontally while each one is 6 higher than the one before.',
    make: () => fig({
      label: 'Typing speed against hours of practice: the points (1, 20), (3, 26), (9, 32), (27, 38), (81, 44) on the curve y = 20 + 6 log base 3 of x',
      width: 400, height: 290, x: [0, 90], y: [10, 50], xStep: 10, yStep: 5, xLabel: 'hours', yLabel: 'words per minute',
      curves: [{ fn: x => 20 + 6 * log3(x), domain: [0.25, 90], cls: 's2' }],
      points: [[1, 20], [3, 26], [9, 32], [27, 38], [81, 44]].map(at => ({ at, cls: 's1' })),
      labels: [{ at: [4, 18.6], text: '(1, 20)', anchor: 'start' }, { at: [6, 24.6], text: '(3, 26)', anchor: 'start' }, { at: [12, 29.6], text: '(9, 32)', anchor: 'start' }, { at: [29, 35.4], text: '(27, 38)', anchor: 'start' }, { at: [80, 40.6], text: '(81, 44)', anchor: 'middle' },
        { at: [52, 45.6], text: 'y = 20 + 6 log₃ x', anchor: 'middle' }],
    }, 'A logarithmic model through the typing data', 'The five data points (1, 20), (3, 26), (9, 32), (27, 38) and (81, 44) lie on the curve y = 20 + 6 log₃ x. Each input is 3 times the one before, so the points spread out to the right, while each output is 6 more than the one before. The curve rises quickly at first and then more and more slowly.') },

  /* ---- 2.12 logarithmic function manipulation */
  'logarithmic-manipulation-domain': { topic: 'logarithmic-manipulation',
    alt: 'Graph of y = ln of x squared in green, with two branches, one on each side of the y-axis, through (-1, 0) and (1, 0). The graph of y = 2 ln x, drawn as light blue dashes, lies exactly on the right branch and has no left branch.',
    make: () => fig({
      label: 'Graphs of y = ln(x squared), which has a branch on each side of the y-axis, and y = 2 ln x, which matches only the right branch',
      width: 390, height: 280, x: [-5, 5], y: [-4, 4], xStep: 1, yStep: 1, xLabel: 'x', yLabel: 'y',
      curves: [{ fn: x => ln(x * x), domain: [-5, -0.136], cls: 's1' }, { fn: x => ln(x * x), domain: [0.136, 5], cls: 's1' }],
      points: [{ at: [-1, 0], cls: 's1' }, { at: [1, 0], cls: 's1' }],
      labels: [{ at: [-1.55, 0.4], text: '(−1, 0)', anchor: 'end' }, { at: [1.3, -0.95], text: '(1, 0)', anchor: 'start' },
        { at: [-4.9, -2.3], text: 'only ln(x²)', anchor: 'start' }, { at: [-4.9, -3.0], text: 'is defined here', anchor: 'start' },
        { at: [4.9, -2.3], text: 'ln(x²) and 2 ln x', anchor: 'end' }, { at: [4.9, -3.0], text: 'agree here', anchor: 'end' }],
    }, 'Where ln(x²) and 2 ln x agree', 'The green graph of y = ln(x²) has two branches, mirror images across the y-axis, through (−1, 0) and (1, 0). The graph of y = 2 ln x, drawn as light blue dashes, lies exactly on the right branch and does not exist for x < 0. The two expressions are equal only for x > 0.', (F, m) => {
      const pts = []; for (let i = 0; i <= 200; i++) { const x = 0.136 + (5 - 0.136) * i / 200; pts.push([x, 2 * ln(x)]); }
      return m.path(pts, '#7CC4EE', 2.6, '2 7');
    }) },

  /* ---- 2.13 exponential and logarithmic equations and inequalities */
  'exp-log-equations-extraneous': { topic: 'exp-log-equations',
    alt: 'Graph of y = log base 3 of x plus log base 3 of (x - 8), which exists only to the right of the dashed vertical asymptote x = 8. It meets the dashed line y = 2 at the single point (9, 2). An open circle on the x-axis at x = -1 marks the extraneous root, far outside the domain.',
    make: () => fig({
      label: 'Graph of y = log base 3 of x + log base 3 of (x - 8) for x greater than 8, crossing the line y = 2 at x = 9, with x = -1 marked outside the domain',
      width: 400, height: 280, x: [-3, 14], y: [-3, 5], xStep: 1, yStep: 1, xLabel: 'x', yLabel: 'y',
      curves: [{ fn: x => log3(x) + log3(x - 8), domain: [8.0046, 14], cls: 's1' }],
      asymptotes: [{ x: 8 }],
      lines: [{ through: [[-3, 2], [14, 2]], cls: 's2', dashed: true }],
      points: [{ at: [9, 2], cls: 's3' }, { at: [-1, 0], cls: 's3', open: true }],
      labels: [{ at: [9.4, 1.35], text: '(9, 2)', anchor: 'start' }, { at: [0.4, 2.3], text: 'y = 2', anchor: 'start' }, { at: [8.45, -2.5], text: 'x = 8', anchor: 'start' },
        { at: [0.5, -1.45], text: 'x = −1: no graph here,', anchor: 'start' }, { at: [0.5, -2.2], text: 'so it is not a solution', anchor: 'start' },
        { at: [0.4, 4.2], text: 'defined only for x > 8', anchor: 'start' }],
    }, 'Why x = −1 is an extraneous solution', 'The left side of the equation, y = log₃ x + log₃(x − 8), has a graph only where x > 8, to the right of the dashed asymptote x = 8. That graph meets the dashed line y = 2 exactly once, at (9, 2). The other root of the quadratic, x = −1, marked with an open circle on the x-axis, is far outside the domain, so it solves nothing.') },
};

function register(id, { topic, alt }, svg) {
  const m = svg.match(/viewBox="0 0 (\d+) (\d+)"/), fp = join(REG, `${topic}.json`);
  const all = existsSync(fp) ? JSON.parse(readFileSync(fp, 'utf8')) : {};
  all[id] = { file: `figures/${id}.svg`, ext: 'svg', w: +m[1], h: +m[2], source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt };
  writeFileSync(fp, JSON.stringify(all, null, 1) + '\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(OUT, { recursive: true });
  const only = process.argv.slice(2);
  for (const [id, f] of Object.entries(FIGURES)) {
    if (only.length && !only.includes(id)) continue;
    const svg = f.make();
    writeFileSync(join(OUT, `${id}.svg`), svg);
    register(id, f, svg);
    console.log('wrote', id);
  }
}
