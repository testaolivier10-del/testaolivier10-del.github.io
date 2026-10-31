/* Author C's figures for AP® Precalculus Unit 2 (topics 2.7-2.15), drawn from
   their functions: plot figures go through ApPrecalcPlot.svg (the code that
   draws graph stimuli), then get a white background, inline colors and a
   <title> and <desc>, so each works as a standalone <img>. The log-scale
   figures (a number line and semi-log plots) are drawn here, with ticks at
   powers of the base placed by their logarithms.

     node scripts/apprecalc-figures/c.mjs     writes precalculus/figures/<id>.svg

   Each figure is registered in precalculus/data/figures/<topic>.json. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Plot } from '../lib/apprecalc-mathlib.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'precalculus', 'figures');
const INK = '#1F2A28', GREEN = '#11592F', BLUE = '#0072B2', VERM = '#D55E00', GRID = '#E2E6E4';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const STYLE = `<style>
text{font:600 11px Arial,Helvetica,sans-serif;fill:${INK};}
.pcalc-plot-axlabel,.pcalc-plot-label{font-weight:700;font-size:12px;}
.pcalc-plot-grid line{stroke:${GRID};stroke-width:1;}
.pcalc-plot-axis line{stroke:${INK};stroke-width:1.3;}
.pcalc-plot-curve{fill:none;stroke-width:2.6;stroke-linejoin:round;stroke-linecap:round;}
.is-dashed{stroke-dasharray:6 5;}
.pcalc-plot-line{stroke-width:1.8;}
.pcalc-plot-asym{stroke:#6B7470;stroke-width:1.4;stroke-dasharray:5 4;}
.pcalc-plot-pt{stroke-width:2;}
.s1{stroke:${GREEN};} .s2{stroke:${BLUE};} .s3{stroke:${VERM};} .s4{stroke:#6B7470;}
.pcalc-plot-pt.s1{fill:${GREEN};} .pcalc-plot-pt.s2{fill:${BLUE};} .pcalc-plot-pt.s3{fill:${VERM};} .pcalc-plot-pt.s4{fill:#6B7470;}
.pcalc-plot-pt.is-open{fill:#fff;}
text.s1{fill:${GREEN};stroke:none;} text.s2{fill:${BLUE};stroke:none;} text.s3{fill:${VERM};stroke:none;} text.s4{fill:#4A524F;stroke:none;}
</style>`;

function standalone(svg, title, desc) {
  const m = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  return svg.replace(/^<svg class="pcalc-plot"/, '<svg xmlns="http://www.w3.org/2000/svg" class="pcalc-plot"')
    .replace(/(<svg[^>]*>)/, `$1<title>${esc(title)}</title><desc>${esc(desc)}</desc>${STYLE}<rect width="${m[1]}" height="${m[2]}" fill="#fff"/>`);
}
function plotFigure(spec, title, desc) { return standalone(Plot.svg(spec), title, desc); }

/* A semi-log plot: x linear, y on a log scale (ticks at powers of base). */
function semiLog({ W = 420, H = 300, x, xStep, decades, base = 10, points = [], line, xLabel, yLabel, title, desc, minor = true, pointLabels = [] }) {
  const L = 58, R = 16, T = 16, B = 44, iw = W - L - R, ih = H - T - B;
  const [d0, d1] = decades;
  const sx = v => L + (v - x[0]) / (x[1] - x[0]) * iw;
  const lg = v => Math.log(v) / Math.log(base);
  const sy = v => T + (d1 - lg(v)) / (d1 - d0) * ih;
  const o = [];
  for (let d = d0; d <= d1; d++) {
    const v = Math.pow(base, d);
    o.push(`<line x1="${L}" x2="${L + iw}" y1="${sy(v).toFixed(2)}" y2="${sy(v).toFixed(2)}" stroke="#C9D0CD" stroke-width="1"/>`);
    const lab = base === 10 ? (v >= 1 ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : String(+v.toPrecision(3))) : String(v);
    o.push(`<text x="${L - 7}" y="${(sy(v) + 4).toFixed(2)}" text-anchor="end">${lab}</text>`);
    if (minor && base === 10 && d < d1) for (let k = 2; k <= 9; k++) o.push(`<line x1="${L}" x2="${L + iw}" y1="${sy(k * v).toFixed(2)}" y2="${sy(k * v).toFixed(2)}" stroke="${GRID}" stroke-width="0.8"/>`);
  }
  for (let v = x[0]; v <= x[1] + 1e-9; v += xStep) {
    o.push(`<line x1="${sx(v).toFixed(2)}" x2="${sx(v).toFixed(2)}" y1="${T}" y2="${T + ih}" stroke="${GRID}" stroke-width="0.8"/>`);
    o.push(`<text x="${sx(v).toFixed(2)}" y="${T + ih + 16}" text-anchor="middle">${+v.toPrecision(6)}</text>`);
  }
  o.push(`<line x1="${L}" x2="${L + iw}" y1="${T + ih}" y2="${T + ih}" stroke="${INK}" stroke-width="1.3"/><line x1="${L}" x2="${L}" y1="${T}" y2="${T + ih}" stroke="${INK}" stroke-width="1.3"/>`);
  if (line) { const [a, b] = line.x; o.push(`<line x1="${sx(a).toFixed(2)}" y1="${sy(line.f(a)).toFixed(2)}" x2="${sx(b).toFixed(2)}" y2="${sy(line.f(b)).toFixed(2)}" stroke="${BLUE}" stroke-width="2"/>`); }
  for (const p of points) o.push(`<circle cx="${sx(p[0]).toFixed(2)}" cy="${sy(p[1]).toFixed(2)}" r="4.5" fill="${GREEN}" stroke="${GREEN}" stroke-width="1.5"/>`);
  for (const pl of pointLabels) o.push(`<text x="${(sx(pl.at[0]) + (pl.dx ?? 8)).toFixed(2)}" y="${(sy(pl.at[1]) + (pl.dy ?? -8)).toFixed(2)}" text-anchor="${pl.anchor || 'start'}" style="font-weight:700;font-size:12px">${esc(pl.text)}</text>`);
  o.push(`<text x="${L + iw / 2}" y="${H - 8}" text-anchor="middle" style="font-weight:700;font-size:12px">${esc(xLabel)}</text>`);
  o.push(`<text transform="translate(14 ${T + ih / 2}) rotate(-90)" text-anchor="middle" style="font-weight:700;font-size:12px">${esc(yLabel)}</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><desc>${esc(desc)}</desc><style>text{font:600 11px Arial,Helvetica,sans-serif;fill:${INK};}</style><rect width="${W}" height="${H}" fill="#fff"/>${o.join('')}</svg>`;
}

/* A number line on a log scale: equal steps are equal factors of 10. */
function logLine({ W = 560, H = 120, decades = [0, 4], marks = [], title, desc, unit }) {
  const L = 30, R = 30, y = 56, iw = W - L - R;
  const [d0, d1] = decades;
  const sx = v => L + (Math.log10(v) - d0) / (d1 - d0) * iw;
  const o = [`<line x1="${L}" x2="${L + iw}" y1="${y}" y2="${y}" stroke="${INK}" stroke-width="1.6"/>`];
  for (let d = d0; d <= d1; d++) {
    const v = Math.pow(10, d);
    o.push(`<line x1="${sx(v).toFixed(2)}" x2="${sx(v).toFixed(2)}" y1="${y - 9}" y2="${y + 9}" stroke="${INK}" stroke-width="1.6"/>`);
    o.push(`<text x="${sx(v).toFixed(2)}" y="${y + 26}" text-anchor="middle" style="font-weight:700">${String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</text>`);
    if (d < d1) for (let k = 2; k <= 9; k++) o.push(`<line x1="${sx(k * v).toFixed(2)}" x2="${sx(k * v).toFixed(2)}" y1="${y - 4}" y2="${y + 4}" stroke="${INK}" stroke-width="1"/>`);
  }
  for (const m of marks) {
    o.push(`<circle cx="${sx(m.v).toFixed(2)}" cy="${y}" r="5.5" fill="${m.color || VERM}"/>`);
    o.push(`<text x="${sx(m.v).toFixed(2)}" y="${y - 16}" text-anchor="middle" style="font-weight:700;font-size:13px;fill:${m.color || VERM}">${esc(m.label)}</text>`);
  }
  if (unit) o.push(`<text x="${L + iw / 2}" y="${H - 6}" text-anchor="middle">${esc(unit)}</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><desc>${esc(desc)}</desc><style>text{font:600 11px Arial,Helvetica,sans-serif;fill:${INK};}</style><rect width="${W}" height="${H}" fill="#fff"/>${o.join('')}</svg>`;
}

export const FIGURES = {
  'composition-shift': () => plotFigure({
    label: 'Graphs of f(x) = square root of x and of the composite f(g(x)) = square root of (x minus 2), where g(x) = x minus 2',
    width: 420, height: 280, x: [-1, 10], y: [-1, 4], xStep: 1, yStep: 1, xLabel: 'x', yLabel: 'y',
    curves: [{ fn: 'sqrt(x)', domain: [0, 10], cls: 's2' }, { fn: 'sqrt(x - 2)', domain: [2, 10], cls: 's1' }],
    points: [{ at: [0, 0], cls: 's2' }, { at: [2, 0], cls: 's1' }, { at: [4, 2], cls: 's2' }, { at: [6, 2], cls: 's1' }],
    labels: [{ at: [4, 2.45], text: '(4, 2)', anchor: 'middle' }, { at: [6.7, 1.6], text: '(6, 2)', anchor: 'start' }, { at: [7.6, 3.15], text: 'y = f(x)', anchor: 'middle' }, { at: [9.8, 2.1], text: 'y = f(g(x))', anchor: 'end' }],
  }, 'Composite as a shift', 'The graph of f(x) = square root of x starts at (0, 0). The composite f(g(x)) with g(x) = x - 2 starts at (2, 0): every point of f moves 2 units right, because the inner function g subtracts 2 from each input first. The point (4, 2) on f becomes (6, 2) on f(g(x)).'),
  'inverse-functions-reflect': () => plotFigure({
    label: 'Graph of f(x) = x squared over 4 for x at least 0, its inverse, and the line y = x as a dashed mirror',
    width: 360, height: 340, x: [-0.5, 6], y: [-0.5, 6], xStep: 1, yStep: 1, xLabel: 'x', yLabel: 'y',
    curves: [{ fn: 'x^2/4', domain: [0, 4.9], cls: 's1' }, { fn: '2sqrt(x)', domain: [0, 6], cls: 's2' }, { fn: 'x', domain: [-0.5, 6], cls: 's4', dashed: true }],
    points: [{ at: [2, 1], cls: 's1' }, { at: [1, 2], cls: 's2' }, { at: [4, 4], cls: 's4' }],
    labels: [{ at: [2.25, 0.55], text: '(2, 1)', anchor: 'start' }, { at: [0.8, 2.45], text: '(1, 2)', anchor: 'end' }, { at: [5.05, 5.6], text: 'f', anchor: 'start' }, { at: [5.95, 4.3], text: 'f⁻¹', anchor: 'end' }, { at: [4.55, 3.5], text: 'y = x', anchor: 'start' }],
  }, 'A function and its inverse', 'f(x) = x²/4 for x ≥ 0 and its inverse f⁻¹(x) = 2√x are mirror images across the dashed line y = x. The point (2, 1) on f matches the point (1, 2) on the inverse: input and output trade places. The two graphs meet on the line y = x at (4, 4).'),
  'logarithmic-expressions-powers': () => plotFigure({
    label: 'Graph of y = 2 to the x with the points (1, 2), (2, 4) and (3, 8) marked',
    width: 380, height: 290, x: [-2, 4], y: [-1, 10], xStep: 1, yStep: 2, xLabel: 'x', yLabel: 'y',
    curves: [{ fn: '2^x', domain: [-2, 3.3], cls: 's1', label: 'y = 2ˣ' }],
    points: [{ at: [1, 2], cls: 's1' }, { at: [2, 4], cls: 's1' }, { at: [3, 8], cls: 's1' }],
    labels: [{ at: [1.15, 1.2], text: '(1, 2)', anchor: 'start' }, { at: [2.15, 3.2], text: '(2, 4)', anchor: 'start' }, { at: [2.85, 8.4], text: '(3, 8)', anchor: 'end' }],
  }, 'Reading a logarithm off an exponential graph', 'The graph of y = 2^x passes through (1, 2), (2, 4) and (3, 8). A logarithm asks the reverse question: which input gives the output 8? The answer, 3, is log base 2 of 8.'),
  'logarithmic-expressions-scale': () => logLine({
    decades: [0, 4], marks: [{ v: 50, label: '50' }, { v: 2000, label: '2,000', color: BLUE }],
    title: 'A number line on a logarithmic scale from 1 to 10,000',
    desc: 'Tick marks at 1, 10, 100, 1,000 and 10,000 are equally spaced: each step to the right multiplies by 10. Smaller ticks mark 2 through 9 times each power of 10. The value 50 sits between 10 and 100, closer to 100, at log 50, about 1.7 steps from 1. The value 2,000 sits between 1,000 and 10,000, at about 3.3 steps.',
    unit: 'Each labeled step multiplies the value by 10',
  }),
  'exp-log-inverses-reflect': () => plotFigure({
    label: 'Graphs of y = 2 to the x and y = log base 2 of x, mirror images across the dashed line y = x',
    width: 380, height: 360, x: [-4, 6], y: [-4, 6], xStep: 1, yStep: 1, xLabel: 'x', yLabel: 'y',
    curves: [{ fn: '2^x', domain: [-4, 2.55], cls: 's1', label: 'y = 2ˣ' }, { fn: 'log_2(x)', domain: [0.06, 6], cls: 's2', label: 'y = log₂ x' }, { fn: 'x', domain: [-4, 6], cls: 's4', dashed: true }],
    asymptotes: [{ x: 0 }, { y: 0 }],
    points: [{ at: [2, 4], cls: 's1' }, { at: [4, 2], cls: 's2' }, { at: [0, 1], cls: 's1' }, { at: [1, 0], cls: 's2' }],
    labels: [{ at: [1.85, 4.35], text: '(2, 4)', anchor: 'end' }, { at: [4.2, 1.35], text: '(4, 2)', anchor: 'start' }, { at: [5.3, 5.7], text: 'y = x', anchor: 'middle' }],
  }, 'An exponential function and its inverse', 'y = 2^x and y = log₂ x reflect across the dashed line y = x. The point (2, 4) on the exponential matches (4, 2) on the logarithm, and (0, 1) matches (1, 0). The exponential has the horizontal asymptote y = 0; the logarithm has the vertical asymptote x = 0.'),
  'logarithmic-functions-asymptote': () => plotFigure({
    label: 'Graph of g(x) = 2 log base 2 of (x minus 1), with its dashed vertical asymptote x = 1',
    width: 380, height: 300, x: [-1, 10], y: [-6, 7], xStep: 1, yStep: 2, xLabel: 'x', yLabel: 'y',
    curves: [{ fn: '2log_2(x - 1)', domain: [1.0005, 10], cls: 's1' }],
    asymptotes: [{ x: 1 }],
    points: [{ at: [2, 0], cls: 's1' }, { at: [3, 2], cls: 's1' }, { at: [5, 4], cls: 's1' }, { at: [9, 6], cls: 's1' }],
    labels: [{ at: [2.6, -1.7], text: '(2, 0)', anchor: 'start' }, { at: [3.2, 1.3], text: '(3, 2)', anchor: 'start' }, { at: [5.2, 3.0], text: '(5, 4)', anchor: 'start' }, { at: [8.8, 4.8], text: '(9, 6)', anchor: 'end' }, { at: [7.0, 6.6], text: 'y = g(x)', anchor: 'end' }, { at: [1.2, -5.3], text: 'x = 1', anchor: 'start' }],
  }, 'A logarithmic function near its asymptote', 'g(x) = 2 log₂(x − 1) is defined only for x > 1. Near the dashed asymptote x = 1 the graph drops without bound. It crosses the x-axis at (2, 0) and climbs slowly: each time x − 1 doubles, from (3, 2) to (5, 4) to (9, 6), g(x) goes up by the same 2.'),
  'logarithmic-manipulation-shift': () => plotFigure({
    label: 'Graphs of f(x) = log base 2 of x and h(x) = log base 2 of 4x, which is f moved up 2',
    width: 380, height: 300, x: [-0.5, 8], y: [-3, 6], xStep: 1, yStep: 1, xLabel: 'x', yLabel: 'y',
    curves: [{ fn: 'log_2(x)', domain: [0.13, 8], cls: 's2', label: 'y = f(x)' }, { fn: 'log_2(4x)', domain: [0.032, 8], cls: 's1', label: 'y = h(x)' }],
    asymptotes: [{ x: 0 }],
    points: [{ at: [4, 2], cls: 's2' }, { at: [4, 4], cls: 's1' }, { at: [1, 0], cls: 's2' }, { at: [1, 2], cls: 's1' }],
    labels: [{ at: [4.2, 1.45], text: '(4, 2)', anchor: 'start' }, { at: [3.8, 4.45], text: '(4, 4)', anchor: 'end' }, { at: [1.25, -1.15], text: '(1, 0)', anchor: 'start' }, { at: [1.25, 1.45], text: '(1, 2)', anchor: 'start' }],
  }, 'The product property as a shift', 'h(x) = log₂(4x) = log₂ 4 + log₂ x = 2 + log₂ x, so the graph of h is the graph of f(x) = log₂ x moved up 2 units: (1, 0) goes to (1, 2) and (4, 2) goes to (4, 4). The same graph is also f squeezed horizontally by a factor of 4.'),
  'exp-log-equations-intersect': () => plotFigure({
    label: 'Graph of y = 2 to the x and the horizontal line y = 10, meeting where x = log base 2 of 10',
    width: 380, height: 290, x: [-1, 5], y: [-1, 14], xStep: 1, yStep: 2, xLabel: 'x', yLabel: 'y',
    curves: [{ fn: '2^x', domain: [-1, 3.8], cls: 's1', label: 'y = 2ˣ' }],
    lines: [{ through: [[-1, 10], [5, 10]], cls: 's2', dashed: true }],
    points: [{ at: [Math.log2(10), 10], cls: 's3' }, { at: [3, 8], cls: 's1' }],
    labels: [{ at: [3.3, 11.1], text: 'x = log₂ 10 ≈ 3.32', anchor: 'end' }, { at: [4.9, 9.0], text: 'y = 10', anchor: 'end' }, { at: [3.15, 7.0], text: '(3, 8)', anchor: 'start' }],
  }, 'Solving an exponential equation', 'The solution of 2^x = 10 is the input where the graph of y = 2^x meets the line y = 10. It lies between 3 (where 2^x = 8) and 4 (where 2^x = 16), at x = log₂ 10, about 3.32.'),
  'logarithmic-modeling-data': () => plotFigure({
    label: 'Scatter plot of words read per minute against weeks of practice, with the logarithmic model y = 52 + 18 ln x',
    width: 400, height: 290, x: [0, 17], y: [40, 110], xStep: 2, yStep: 10, xLabel: 'weeks', yLabel: 'words per minute',
    curves: [{ fn: '52 + 18ln(x)', domain: [0.6, 17], cls: 's2' }],
    points: [[1, 52], [2, 64.5], [4, 77], [8, 89.5], [16, 102]].map(at => ({ at, cls: 's1' })),
    labels: [{ at: [1.5, 49], text: '(1, 52)', anchor: 'start' }, { at: [15.5, 95], text: '(16, 102)', anchor: 'end' }, { at: [10, 97], text: 'y = 52 + 18 ln x', anchor: 'middle' }],
  }, 'A logarithmic model through data', 'Reading speed rises by the same 12.5 words per minute every time the number of weeks doubles: (1, 52), (2, 64.5), (4, 77), (8, 89.5), (16, 102). The model y = 52 + 18 ln x passes close to every point; its rate of change keeps decreasing, so the graph is concave down.'),
  'semi-log-plots-line': () => semiLog({
    x: [0, 6], xStep: 1, decades: [0, 3], points: [0, 1, 2, 3, 4, 5, 6].map(t => [t, 3 * Math.pow(2, t)]),
    line: { x: [0, 6], f: t => 3 * Math.pow(2, t) }, xLabel: 'hours, t', yLabel: 'bacteria (thousands), log scale',
    pointLabels: [{ at: [0, 3], text: '(0, 3)', dx: 8, dy: 14 }, { at: [6, 192], text: '(6, 192)', dx: -8, dy: -8, anchor: 'end' }],
    title: 'Semi-log plot of y = 3 times 2 to the t: the exponential data lie on a straight line',
    desc: 'The vertical axis is a log scale with 1, 10, 100 and 1,000 equally spaced. The data y = 3·2^t for t = 0 to 6 hours (3, 6, 12, 24, 48, 96, 192 thousand) lie on a straight line from (0, 3) to (6, 192): an exponential function looks linear on a semi-log plot.',
  }),
  'semi-log-plots-set1': () => semiLog({
    x: [0, 8], xStep: 1, decades: [1, 4], points: [0, 2, 4, 6, 8].map(t => [t, 20 * Math.pow(10, t / 4)]),
    line: { x: [0, 8], f: t => 20 * Math.pow(10, t / 4) }, xLabel: 'years since 2016, t', yLabel: 'users, log scale',
    pointLabels: [{ at: [0, 20], text: 'A', dx: 9, dy: 14 }, { at: [4, 200], text: 'B', dx: -10, dy: -6, anchor: 'end' }, { at: [8, 2000], text: 'C', dx: -10, dy: -6, anchor: 'end' }],
    title: 'Semi-log plot of the number of users of an app, with points A, B and C on a straight line',
    desc: 'The vertical axis is a log scale with 10, 100, 1,000 and 10,000 equally spaced. Five data points for t = 0, 2, 4, 6 and 8 lie on one straight line. Point A is (0, 20), point B is (4, 200) and point C is (8, 2,000).',
  }),
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(OUT, { recursive: true });
  for (const [id, make] of Object.entries(FIGURES)) { writeFileSync(join(OUT, `${id}.svg`), make()); console.log('wrote', id); }
}
