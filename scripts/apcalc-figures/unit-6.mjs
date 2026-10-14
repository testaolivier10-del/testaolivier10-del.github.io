/* AP® Calculus AB, Unit 6 figures (Integration and Accumulation of Change).

   Every graph is drawn by sampling the function it shows, so a picture can
   never drift from its caption. Standalone SVG: white background, role="img"
   with <title> and <desc>, Arial/Helvetica, ink #1F2A28, crimson #8C1036 for
   emphasis, Okabe-Ito blue #0072B2 / green #009E73 / vermillion #D55E00.

     node scripts/apcalc-figures/unit-6.mjs            writes calculus/figures/<id>.svg
     node scripts/apcalc-figures/unit-6.mjs --out DIR   writes to DIR instead (preview)

   The metadata (alt text, size, licence) is in calculus/data/figures/<topic>.json. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const args = process.argv.slice(2);
const OUT = args.includes('--out') ? args[args.indexOf('--out') + 1] : join(ROOT, 'calculus', 'figures');

const INK = '#1F2A28', CRIMSON = '#8C1036', BLUE = '#0072B2', GREEN = '#009E73', VERM = '#D55E00', GRID = '#E3E6E5', MUTED = '#5B6664';
const FONT = 'Arial, Helvetica, sans-serif';
const r2 = v => Math.round(v * 100) / 100;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = v => String(+v.toFixed(6)).replace('-', '−');

/* Text. Rich text: segments [{ t, i (italic), sub, sup, b (bold) }] or a plain string. */
function text(x, y, s, o = {}) {
  const size = o.size || 15, fill = o.color || INK, anchor = o.anchor || 'start', weight = o.bold ? 'bold' : 'normal';
  const segs = typeof s === 'string' ? [{ t: s }] : s;
  const body = segs.map(g => {
    const st = [g.i ? 'font-style="italic"' : '', g.b ? 'font-weight="bold"' : '', g.color ? `fill="${g.color}"` : ''].filter(Boolean).join(' ');
    if (g.sub || g.sup) {
      const dy = g.sub ? size * 0.32 : -size * 0.42;
      return `<tspan dy="${r2(dy)}" font-size="${r2(size * 0.68)}" ${st}>${esc(g.t)}</tspan><tspan dy="${r2(-dy)}" font-size="${size}"> </tspan>`;
    }
    return `<tspan ${st}>${esc(g.t)}</tspan>`;
  }).join('');
  return `<text x="${r2(x)}" y="${r2(y)}" font-family="${FONT}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}"${o.halo ? ' paint-order="stroke" stroke="#fff" stroke-width="4" stroke-linejoin="round"' : ''}>${body}</text>`;
}

/* A panel: an x-y frame inside the figure. */
function panel(o) {
  const { left, top, width, height, x, y } = o;
  const sx = v => left + (v - x[0]) / (x[1] - x[0]) * width;
  const sy = v => top + (y[1] - v) / (y[1] - y[0]) * height;
  const out = [];
  const xt = [], yt = [];
  for (let v = Math.ceil(x[0] / o.xStep - 1e-9) * o.xStep; v <= x[1] + 1e-9; v += o.xStep) xt.push(+v.toFixed(9));
  for (let v = Math.ceil(y[0] / o.yStep - 1e-9) * o.yStep; v <= y[1] + 1e-9; v += o.yStep) yt.push(+v.toFixed(9));
  if (o.grid !== false) {
    out.push(`<g stroke="${GRID}" stroke-width="1">` +
      xt.map(v => `<line x1="${r2(sx(v))}" y1="${top}" x2="${r2(sx(v))}" y2="${top + height}"/>`).join('') +
      yt.map(v => `<line x1="${left}" y1="${r2(sy(v))}" x2="${left + width}" y2="${r2(sy(v))}"/>`).join('') + '</g>');
  }
  const ax = Math.min(Math.max(0, y[0]), y[1]), ay = Math.min(Math.max(0, x[0]), x[1]);
  const axes = () => {
    const a = [];
    a.push(`<g stroke="${INK}" stroke-width="1.6"><line x1="${left}" y1="${r2(sy(ax))}" x2="${left + width + 8}" y2="${r2(sy(ax))}"/><line x1="${r2(sx(ay))}" y1="${top + height}" x2="${r2(sx(ay))}" y2="${top - 8}"/></g>`);
    a.push(`<polygon fill="${INK}" points="${left + width + 14},${r2(sy(ax))} ${left + width + 5},${r2(sy(ax) - 4)} ${left + width + 5},${r2(sy(ax) + 4)}"/>`);
    a.push(`<polygon fill="${INK}" points="${r2(sx(ay))},${top - 14} ${r2(sx(ay) - 4)},${top - 5} ${r2(sx(ay) + 4)},${top - 5}"/>`);
    const skip = new Set(o.skipTicks || []);
    for (const v of xt) if (v !== ay && !skip.has('x' + v) && (!o.xEvery || Math.abs(v / o.xEvery - Math.round(v / o.xEvery)) < 1e-9)) {
      a.push(`<line x1="${r2(sx(v))}" y1="${r2(sy(ax) - 4)}" x2="${r2(sx(v))}" y2="${r2(sy(ax) + 4)}" stroke="${INK}" stroke-width="1.2"/>`);
      a.push(text(sx(v), sy(ax) + 18, (o.xTick || fmt)(v), { size: 13, anchor: 'middle', color: MUTED, halo: true }));
    }
    for (const v of yt) if (v !== ax && !skip.has('y' + v) && (!o.yEvery || Math.abs(v / o.yEvery - Math.round(v / o.yEvery)) < 1e-9)) {
      a.push(`<line x1="${r2(sx(ay) - 4)}" y1="${r2(sy(v))}" x2="${r2(sx(ay) + 4)}" y2="${r2(sy(v))}" stroke="${INK}" stroke-width="1.2"/>`);
      a.push(text(sx(ay) - 8, sy(v) + 4.5, fmt(v), { size: 13, anchor: 'end', color: MUTED, halo: true }));
    }
    if (o.xLabel) a.push(text(left + width + 16, sy(ax) + 5, o.xLabel, { size: 15 }));
    if (o.yLabel) a.push(text(sx(ay) + (o.yLabelDx ?? 8), top - 12, o.yLabel, { size: 15 }));
    return a.join('');
  };
  return { sx, sy, out, axes, o };
}

function samplePts(f, a, b, n = 400) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; pts.push([x, f(x)]); }
  return pts;
}
function curve(P, f, a, b, o = {}) {
  const pts = samplePts(f, a, b, o.n || 400).filter(p => Number.isFinite(p[1]));
  const [y0, y1] = P.o.y;
  // Clip to the panel by breaking the path where it leaves the y-range.
  let d = '', pen = false;
  for (const [x, y] of pts) {
    if (y < y0 - 1e-9 || y > y1 + 1e-9) { pen = false; continue; }
    d += `${pen ? 'L' : 'M'}${r2(P.sx(x))} ${r2(P.sy(y))}`; pen = true;
  }
  return `<path d="${d}" fill="none" stroke="${o.color || CRIMSON}" stroke-width="${o.width || 2.6}" stroke-linejoin="round" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
}
function shade(P, f, a, b, o = {}) {
  const g = o.f2 || (() => 0);
  const top = samplePts(f, a, b, 300), bot = samplePts(g, a, b, 300).reverse();
  const pts = [...top, ...bot].map(([x, y]) => `${r2(P.sx(x))},${r2(P.sy(y))}`).join(' ');
  return `<polygon points="${pts}" fill="${o.color || CRIMSON}" fill-opacity="${o.opacity ?? 0.18}" stroke="none"/>`;
}
function polygon(P, pts, o = {}) {
  return `<polygon points="${pts.map(([x, y]) => `${r2(P.sx(x))},${r2(P.sy(y))}`).join(' ')}" fill="${o.fill || 'none'}" fill-opacity="${o.opacity ?? 1}" stroke="${o.stroke || 'none'}" stroke-width="${o.width || 1.4}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
}
function seg(P, x1, y1, x2, y2, o = {}) {
  return `<line x1="${r2(P.sx(x1))}" y1="${r2(P.sy(y1))}" x2="${r2(P.sx(x2))}" y2="${r2(P.sy(y2))}" stroke="${o.color || INK}" stroke-width="${o.width || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} stroke-linecap="round"/>`;
}
function dot(P, x, y, o = {}) {
  return `<circle cx="${r2(P.sx(x))}" cy="${r2(P.sy(y))}" r="${o.r || 5}" fill="${o.open ? '#fff' : (o.color || CRIMSON)}" stroke="${o.color || CRIMSON}" stroke-width="2"/>`;
}
function svg(id, w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d">
<title id="${id}-t">${esc(title)}</title>
<desc id="${id}-d">${esc(desc)}</desc>
<rect width="${w}" height="${h}" fill="#fff"/>
${body.join('\n')}
</svg>
`;
}
/* An integral sign with limits and a body: x, y is the baseline of the body. */
function integral(x, y, lo, hi, body, o = {}) {
  const size = o.size || 16, c = o.color || INK, k = size / 16;
  const top = y - 17 * k, bot = y + 9 * k, cx = x + 7 * k;
  const parts = [];
  // The integral sign as a drawn stroke (a font's glyph is too small beside limits).
  parts.push(`<path d="M${r2(cx + 5 * k)} ${r2(top + 3 * k)} C${r2(cx + 3.6 * k)} ${r2(top - 0.6 * k)} ${r2(cx + 0.8 * k)} ${r2(top)} ${r2(cx + 0.6 * k)} ${r2(top + 5 * k)} L${r2(cx - 0.6 * k)} ${r2(bot - 5 * k)} C${r2(cx - 0.8 * k)} ${r2(bot)} ${r2(cx - 3.6 * k)} ${r2(bot + 0.6 * k)} ${r2(cx - 5 * k)} ${r2(bot - 3 * k)}" fill="none" stroke="${c}" stroke-width="${r2(1.7 * k)}" stroke-linecap="round"/>`);
  parts.push(text(cx + 1.5 * k, bot + 6 * k, lo, { size: size * 0.7, color: c }));
  parts.push(text(cx + 7 * k, top + 4 * k, hi, { size: size * 0.7, color: c }));
  parts.push(text(cx + 16 * k, y, body, { size, color: c }));
  return parts.join('');
}
const linear = pts => x => {
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, fa] = pts[i], [b, fb] = pts[i + 1];
    if (x >= a - 1e-12 && x <= b + 1e-12) return fa + (fb - fa) * (x - a) / (b - a);
  }
  return NaN;
};
function simpson(f, a, b, n = 2000) {
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return s * h / 3;
}

const figs = {};

/* 6.1: the area under a rate graph is the change accumulated. */
{
  const id = 'acc-rate-area';
  const r = linear([[0, 2], [4, 6], [6, 6], [8, 0], [10, -3], [12, -3]]);
  const W = 720, H = 430;
  const P = panel({ left: 70, top: 46, width: 590, height: 320, x: [0, 12.6], y: [-4, 7.5], xStep: 1, yStep: 1, xEvery: 2, yEvery: 2, xLabel: [{ t: 't', i: true }], yLabel: [{ t: 'r', i: true }, { t: '(' }, { t: 't', i: true }, { t: ')  liters per minute' }] });
  const b = [...P.out];
  b.push(shade(P, x => Math.max(0, r(x)), 0, 8, { color: CRIMSON, opacity: 0.2 }));
  b.push(shade(P, x => Math.min(0, r(x)), 8, 12, { color: BLUE, opacity: 0.22 }));
  b.push(P.axes());
  b.push(curve(P, r, 0, 12, { color: CRIMSON }));
  b.push(dot(P, 0, 2), dot(P, 12, -3));
  b.push(text(P.sx(4), P.sy(2.6), 'Area above: 34', { anchor: 'middle', bold: true, color: CRIMSON, halo: true }));
  b.push(text(P.sx(4), P.sy(2.6) + 19, '34 liters flow into the tank', { anchor: 'middle', size: 14, color: CRIMSON, halo: true }));
  b.push(text(P.sx(10.2), P.sy(-1.25), 'Area below: 9', { anchor: 'middle', bold: true, color: BLUE, halo: true }));
  b.push(text(P.sx(10.2), P.sy(-1.25) + 18, '9 liters drain out', { anchor: 'middle', size: 14, color: BLUE, halo: true }));
  b.push(text(P.sx(12.4), P.sy(7.0), 'Net change from t = 0 to 12: 34 − 9 = 25 liters', { anchor: 'end', size: 14.5, bold: true, halo: true }));
  b.push(text(W - 12, H - 14, 't in minutes', { anchor: 'end', size: 13, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'The area under a rate graph is the change in the amount',
    'Graph of the rate r(t) at which water flows into a tank, in liters per minute, for t from 0 to 12 minutes. The graph is made of line segments through (0, 2), (4, 6), (6, 6), (8, 0), (10, -3) and (12, -3). The region above the t-axis from 0 to 8 is shaded crimson and has area 34, meaning 34 liters flow in. The region below the axis from 8 to 12 is shaded blue and has area 9, meaning 9 liters drain out. The net change in the water is 34 minus 9, or 25 liters.', b) };
}

/* 6.2: left, right, midpoint and trapezoidal sums on the same function. */
{
  const id = 'riemann-four-sums';
  const f = x => 0.25 * x * x + 1;
  const W = 760, H = 650, kinds = [['Left sum', 'left'], ['Right sum', 'right'], ['Midpoint sum', 'mid'], ['Trapezoidal sum', 'trap']];
  const b = [];
  const val = { left: 0, right: 0, mid: 0, trap: 0 };
  for (let i = 0; i < 4; i++) { val.left += f(i); val.right += f(i + 1); val.mid += f(i + 0.5); val.trap += (f(i) + f(i + 1)) / 2; }
  const verdict = { left: 'underestimate', right: 'overestimate', mid: 'underestimate', trap: 'overestimate' };
  kinds.forEach(([name, k], j) => {
    const left = 60 + (j % 2) * 370, top = 122 + Math.floor(j / 2) * 290;
    const P = panel({ left, top, width: 290, height: 190, x: [0, 4.4], y: [0, 5.8], xStep: 1, yStep: 1, xLabel: [{ t: 'x', i: true }], yLabel: [{ t: 'y', i: true }] });
    b.push(...P.out);
    for (let i = 0; i < 4; i++) {
      let pts;
      if (k === 'trap') pts = [[i, 0], [i, f(i)], [i + 1, f(i + 1)], [i + 1, 0]];
      else { const hgt = f(k === 'left' ? i : k === 'right' ? i + 1 : i + 0.5); pts = [[i, 0], [i, hgt], [i + 1, hgt], [i + 1, 0]]; }
      b.push(polygon(P, pts, { fill: BLUE, opacity: 0.2, stroke: BLUE, width: 1.4 }));
      if (k === 'mid') b.push(dot(P, i + 0.5, f(i + 0.5), { r: 3.5, color: BLUE }));
    }
    b.push(P.axes());
    b.push(curve(P, f, 0, 4.3, { color: CRIMSON }));
    b.push(text(left, top - 50, name, { bold: true, size: 16 }));
    b.push(text(left, top - 31, `${fmt(val[k])}, an ${verdict[k]}`, { size: 14, color: MUTED }));
  });
  b.push(text(W / 2, 30, [{ t: 'f', i: true }, { t: '(' }, { t: 'x', i: true }, { t: ') = 0.25' }, { t: 'x', i: true }, { t: '2', sup: true }, { t: ' + 1 on [0, 4], four subintervals of width 1. True area: 28/3 ≈ 9.33' }], { anchor: 'middle', size: 15 }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Left, right, midpoint and trapezoidal sums compared',
    'Four panels show the graph of f(x) = 0.25x squared + 1 on [0, 4], increasing and concave up, with four subintervals of width 1. Left sum: rectangles with heights f(0), f(1), f(2), f(3), total 7.5, an underestimate. Right sum: heights f(1) to f(4), total 11.5, an overestimate. Midpoint sum: heights at 0.5, 1.5, 2.5, 3.5, total 9.25, a slight underestimate. Trapezoidal sum: trapezoids under the chords, total 9.5, an overestimate. The true area is 28/3, about 9.33.', b) };
}

/* 6.3: right sums with more and more rectangles close in on the definite integral. */
{
  const id = 'riemann-limit';
  const f = x => 0.25 * x * x + 1;
  const W = 780, H = 330, ns = [4, 8, 32];
  const b = [];
  ns.forEach((n, j) => {
    const left = 46 + j * 252, top = 66;
    const P = panel({ left, top, width: 200, height: 200, x: [0, 4.4], y: [0, 5.8], xStep: 1, yStep: 1, xEvery: 2, yEvery: 2, xLabel: [{ t: 'x', i: true }] });
    b.push(...P.out);
    let s = 0; const dx = 4 / n;
    for (let i = 1; i <= n; i++) { const hgt = f(i * dx); s += hgt * dx; b.push(polygon(P, [[(i - 1) * dx, 0], [(i - 1) * dx, hgt], [i * dx, hgt], [i * dx, 0]], { fill: BLUE, opacity: 0.2, stroke: BLUE, width: n > 16 ? 0.7 : 1.3 })); }
    b.push(P.axes());
    b.push(curve(P, f, 0, 4.3, { color: CRIMSON }));
    b.push(text(left, top - 34, [{ t: 'n', i: true }, { t: ` = ${n},  Δ` }, { t: 'x', i: true }, { t: ` = ${fmt(dx)}` }], { bold: true, size: 15 }));
    b.push(text(left, top - 15, `right sum = ${fmt(+s.toFixed(4))}`, { size: 14, color: MUTED }));
  });
  b.push(text(W / 2, H - 22, 'As n grows, the right sums 11.5, 10.375, 9.586 close in on the definite integral, 28/3 ≈ 9.333.', { anchor: 'middle', size: 15 }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Right Riemann sums approaching the definite integral',
    'Three panels show right Riemann sums for f(x) = 0.25x squared + 1 on [0, 4]: with n = 4 rectangles of width 1 the sum is 11.5, with n = 8 rectangles of width 0.5 it is 10.375, and with n = 32 rectangles of width 0.125 it is about 9.586. The rectangles hug the curve more closely each time, and the sums approach the definite integral, 28/3, about 9.333.', b) };
}

/* 6.4: g(x) is the area so far; its slope is f(x). */
{
  const id = 'accumulation-sweep';
  const f = t => 0.5 * t + 1, g = x => x * x / 4 + x, X = 3;
  const W = 720, H = 600, b = [];
  const P = panel({ left: 70, top: 80, width: 560, height: 190, x: [0, 6.3], y: [0, 4.6], xStep: 1, yStep: 1, xLabel: [{ t: 't', i: true }], yLabel: [{ t: 'y', i: true }, { t: ' = ' }, { t: 'f', i: true }, { t: '(' }, { t: 't', i: true }, { t: ')' }] });
  b.push(...P.out, shade(P, f, 0, X, { color: CRIMSON, opacity: 0.22 }), P.axes(), curve(P, f, 0, 6, { color: CRIMSON }));
  b.push(seg(P, X, 0, X, f(X), { color: CRIMSON, width: 2 }));
  b.push(text(P.sx(X) + 6, P.sy(0) - 10, [{ t: 'x', i: true }, { t: ' = 3' }], { size: 14, color: CRIMSON, bold: true }));
  b.push(text(P.sx(1.5), P.sy(0.9), 'area = g(3) = 5.25', { anchor: 'middle', bold: true, halo: true }));
  b.push(text(P.sx(X) - 8, P.sy(f(X)) - 12, [{ t: 'height ' }, { t: 'f', i: true }, { t: '(3) = 2.5' }], { anchor: 'end', size: 14, color: CRIMSON, halo: true }));
  const Q = panel({ left: 70, top: 350, width: 560, height: 200, x: [0, 6.3], y: [0, 16], xStep: 1, yStep: 2, yEvery: 4, xLabel: [{ t: 'x', i: true }], yLabel: [{ t: 'y', i: true }, { t: ' = ' }, { t: 'g', i: true }, { t: '(' }, { t: 'x', i: true }, { t: ')' }] });
  b.push(...Q.out, Q.axes(), curve(Q, g, 0, 6, { color: BLUE }));
  const m = f(X), tl = x => g(X) + m * (x - X);
  b.push(curve(Q, tl, 1.4, 4.9, { color: INK, width: 1.6, dash: '6 5' }));
  b.push(dot(Q, X, g(X), { color: BLUE }));
  b.push(text(Q.sx(X) - 10, Q.sy(g(X)) - 10, '(3, 5.25)', { size: 14, color: BLUE, anchor: 'end', halo: true }));
  b.push(text(Q.sx(4.3), Q.sy(tl(4.3)) + 34, [{ t: 'slope ' }, { t: "g'", i: true }, { t: '(3) = ' }, { t: 'f', i: true }, { t: '(3) = 2.5' }], { anchor: 'start', size: 14, halo: true }));
  b.push(text(70, 28, [{ t: 'g', i: true }, { t: '(' }, { t: 'x', i: true }, { t: ') = area under ' }, { t: 'f', i: true }, { t: ' from 0 to ' }, { t: 'x', i: true }, { t: '.  ' }, { t: 'f', i: true }, { t: '(' }, { t: 't', i: true }, { t: ') = 0.5' }, { t: 't', i: true }, { t: ' + 1,  ' }, { t: 'g', i: true }, { t: '(' }, { t: 'x', i: true }, { t: ') = ' }, { t: 'x', i: true }, { t: '2', sup: true }, { t: '/4 + ' }, { t: 'x', i: true }], { size: 15 }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'An accumulation function and its slope',
    'Top: the graph of f(t) = 0.5t + 1 for t from 0 to 6, with the area under it from 0 to x = 3 shaded; that area is g(3) = 5.25, and the height of f at t = 3 is 2.5. Bottom: the graph of the accumulation function g(x) = x squared over 4 + x, rising and concave up, with the point (3, 5.25) marked and a dashed tangent line there whose slope is g prime of 3 = f(3) = 2.5.', b) };
}

/* 6.5: reading g = integral of f from the graph of f. */
{
  const id = 'g-from-f';
  const f = x => x <= 2 ? 2 - x : x <= 6 ? -Math.sqrt(Math.max(0, 4 - (x - 4) ** 2)) : x - 6;
  const g = x => simpson(f, 0, x, 400);
  const W = 720, H = 640, b = [];
  const P = panel({ left: 70, top: 84, width: 560, height: 220, x: [0, 8.4], y: [-2.6, 2.6], xStep: 1, yStep: 1, xLabel: [{ t: 'x', i: true }], yLabel: [{ t: 'y', i: true }, { t: ' = ' }, { t: 'f', i: true }, { t: '(' }, { t: 'x', i: true }, { t: ')' }] });
  b.push(...P.out, shade(P, x => Math.max(0, f(x)), 0, 2, { color: CRIMSON, opacity: 0.22 }), shade(P, x => Math.min(0, f(x)), 2, 6, { color: BLUE, opacity: 0.22 }), shade(P, x => Math.max(0, f(x)), 6, 8, { color: CRIMSON, opacity: 0.22 }));
  b.push(curve(P, f, 0, 8, { color: CRIMSON }), P.axes(), dot(P, 0, 2), dot(P, 8, 2));
  b.push(text(P.sx(0.65), P.sy(0.45), '+2', { anchor: 'middle', bold: true, color: CRIMSON, halo: true }));
  b.push(text(P.sx(4), P.sy(-1.25), '−2π', { anchor: 'middle', bold: true, color: BLUE, halo: true }));
  b.push(text(P.sx(7.35), P.sy(0.45), '+2', { anchor: 'middle', bold: true, color: CRIMSON, halo: true }));
  const Q = panel({ left: 70, top: 380, width: 560, height: 220, x: [0, 8.4], y: [-5, 3], xStep: 1, yStep: 1, xLabel: [{ t: 'x', i: true }], yLabel: [{ t: 'y', i: true }, { t: ' = ' }, { t: 'g', i: true }, { t: '(' }, { t: 'x', i: true }, { t: ')' }] });
  b.push(...Q.out, Q.axes(), curve(Q, g, 0, 8, { color: BLUE, n: 200 }));
  b.push(dot(Q, 2, g(2), { color: BLUE }), dot(Q, 6, g(6), { color: BLUE }), dot(Q, 4, g(4), { color: GREEN }));
  b.push(text(Q.sx(2), Q.sy(g(2)) - 12, 'relative max at x = 2: f changes + to −', { size: 13.5, anchor: 'start', halo: true }));
  b.push(text(Q.sx(6) + 12, Q.sy(g(6)) + 18, 'relative min at x = 6: f changes − to +', { size: 13.5, anchor: 'middle', halo: true }));
  b.push(text(Q.sx(4) - 12, Q.sy(g(4)) + 22, 'inflection at x = 4:', { size: 13.5, color: GREEN, anchor: 'end', halo: true }), text(Q.sx(4) - 12, Q.sy(g(4)) + 40, 'f turns from decreasing to increasing', { size: 13.5, color: GREEN, anchor: 'end', halo: true }));
  b.push(text(70, 34, [{ t: 'g', i: true }, { t: '(' }, { t: 'x', i: true }, { t: ') = ' }], { size: 15 }), integral(116, 34, [{ t: '0' }], [{ t: 'x', i: true }], [{ t: 'f', i: true }, { t: '(' }, { t: 't', i: true }, { t: ') ' }, { t: 'dt', i: true }, { t: ' : area above the axis adds, area below subtracts' }], { size: 15 }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Reading g from the graph of f',
    'Top: the graph of f on [0, 8]: a line from (0, 2) down to (2, 0), a semicircle of radius 2 below the x-axis from x = 2 to x = 6, and a line from (6, 0) up to (8, 2). The triangles above the axis have area 2 each; the half-disc below has area 2 pi. Bottom: the graph of g(x), the integral of f from 0 to x. It rises to a relative maximum of 2 at x = 2, falls to a relative minimum of 2 - 2 pi, about -4.28, at x = 6, and rises to 4 - 2 pi at x = 8. Its inflection point is at x = 4, where f changes from decreasing to increasing.', b) };
}

/* 6.6: additivity over adjacent intervals. */
{
  const id = 'integral-additivity';
  const f = x => 1.4 + 0.45 * x - 0.05 * x * x + 0.35 * Math.sin(1.3 * x);
  const A = 0.6, B = 3.2, Cc = 6.2;
  const W = 720, H = 410, b = [];
  const P = panel({ left: 60, top: 92, width: 580, height: 240, x: [0, 7], y: [0, 3.6], xStep: 1, yStep: 1, grid: false, xLabel: [{ t: 'x', i: true }], yLabel: [{ t: 'y', i: true }], skipTicks: [1, 2, 3, 4, 5, 6, 7].map(v => 'x' + v).concat([1, 2, 3].map(v => 'y' + v)) });
  b.push(shade(P, f, A, B, { color: CRIMSON, opacity: 0.22 }), shade(P, f, B, Cc, { color: BLUE, opacity: 0.22 }));
  b.push(P.axes(), curve(P, f, 0.2, 6.8, { color: INK, width: 2.4 }));
  for (const [x, l] of [[A, 'a'], [B, 'b'], [Cc, 'c']]) { b.push(seg(P, x, 0, x, f(x), { color: INK, width: 1.3, dash: '4 4' })); b.push(text(P.sx(x), P.sy(0) + 20, [{ t: l, i: true }], { anchor: 'middle', size: 16 })); }
  b.push(integral(P.sx(1.25), P.sy(0.75), [{ t: 'a', i: true }], [{ t: 'b', i: true }], [{ t: 'f', i: true }, { t: '(' }, { t: 'x', i: true }, { t: ') ' }, { t: 'dx', i: true }], { color: CRIMSON }));
  b.push(integral(P.sx(4.1), P.sy(0.75), [{ t: 'b', i: true }], [{ t: 'c', i: true }], [{ t: 'f', i: true }, { t: '(' }, { t: 'x', i: true }, { t: ') ' }, { t: 'dx', i: true }], { color: BLUE }));
  b.push(integral(60, 42, [{ t: 'a', i: true }], [{ t: 'c', i: true }], [{ t: 'f', i: true }, { t: '(' }, { t: 'x', i: true }, { t: ') ' }, { t: 'dx', i: true }], { size: 17 }));
  b.push(text(160, 42, '=', { size: 18 }));
  b.push(integral(180, 42, [{ t: 'a', i: true }], [{ t: 'b', i: true }], [{ t: 'f', i: true }, { t: '(' }, { t: 'x', i: true }, { t: ') ' }, { t: 'dx', i: true }], { size: 17, color: CRIMSON }));
  b.push(text(290, 42, '+', { size: 18 }));
  b.push(integral(310, 42, [{ t: 'b', i: true }], [{ t: 'c', i: true }], [{ t: 'f', i: true }, { t: '(' }, { t: 'x', i: true }, { t: ') ' }, { t: 'dx', i: true }], { size: 17, color: BLUE }));
  b.push(text(W - 14, H - 14, 'Adjacent intervals: the two areas add to the whole.', { anchor: 'end', size: 13.5, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Integrals over adjacent intervals add',
    'A positive curve y = f(x) over three marked points a, b and c on the x-axis. The region under the curve from a to b is shaded crimson and the region from b to c is shaded blue. The equation above reads: the integral of f from a to c equals the integral from a to b plus the integral from b to c.', b) };
}

/* 6.7: the net change in f is the area under f'. */
{
  const id = 'net-change';
  const fp = x => 1 - x / 4, f = x => 1 + x - x * x / 8;
  const W = 720, H = 610, b = [];
  const P = panel({ left: 70, top: 72, width: 560, height: 200, x: [0, 6.4], y: [-1, 1.5], xStep: 1, yStep: 0.5, yEvery: 0.5, xLabel: [{ t: 'x', i: true }], yLabel: [{ t: 'y', i: true }, { t: ' = ' }, { t: "f'", i: true }, { t: '(' }, { t: 'x', i: true }, { t: ') = 1 − ' }, { t: 'x', i: true }, { t: '/4' }] });
  b.push(...P.out, shade(P, fp, 0, 4, { color: CRIMSON, opacity: 0.22 }), shade(P, fp, 4, 6, { color: BLUE, opacity: 0.22 }), P.axes(), curve(P, fp, 0, 6, { color: CRIMSON }));
  b.push(text(P.sx(1.5), P.sy(0.28), 'area +2', { anchor: 'middle', bold: true, color: CRIMSON, halo: true }));
  b.push(text(P.sx(5.2), P.sy(-0.8), 'area −0.5', { anchor: 'middle', bold: true, color: BLUE, halo: true }));
  const Q = panel({ left: 70, top: 360, width: 560, height: 200, x: [0, 6.4], y: [0, 3.5], xStep: 1, yStep: 0.5, yEvery: 1, xLabel: [{ t: 'x', i: true }], yLabel: [{ t: 'y', i: true }, { t: ' = ' }, { t: 'f', i: true }, { t: '(' }, { t: 'x', i: true }, { t: ') = 1 + ' }, { t: 'x', i: true }, { t: ' − ' }, { t: 'x', i: true }, { t: '2', sup: true }, { t: '/8' }] });
  b.push(...Q.out, Q.axes(), curve(Q, f, 0, 6, { color: BLUE }));
  b.push(dot(Q, 0, f(0), { color: BLUE }), dot(Q, 6, f(6), { color: BLUE }), dot(Q, 4, f(4), { color: BLUE, r: 3.5 }));
  b.push(seg(Q, 0, f(0), 6.2, f(0), { color: MUTED, dash: '4 4', width: 1.2 }));
  b.push(seg(Q, 6.2, f(0), 6.2, f(6), { color: INK, width: 2 }), seg(Q, 6.12, f(0), 6.28, f(0), { width: 2 }), seg(Q, 6.12, f(6), 6.28, f(6), { width: 2 }));
  b.push(text(Q.sx(6.2) - 8, Q.sy((f(0) + f(6)) / 2) + 5, 'f(6) − f(0) = 2 − 0.5 = 1.5', { anchor: 'end', size: 14, bold: true, halo: true }));
  b.push(text(Q.sx(0) + 10, Q.sy(f(0)) + 20, '(0, 1)', { size: 13.5, color: BLUE, halo: true }), text(Q.sx(6) - 4, Q.sy(f(6)) - 20, '(6, 2.5)', { size: 13.5, color: BLUE, anchor: 'end', halo: true }));
  b.push(text(Q.sx(4), Q.sy(f(4)) - 12, 'f rises while f′ > 0, then falls', { size: 13.5, anchor: 'middle', halo: true }));
  b.push(text(70, 28, 'The area under the rate f′ from 0 to 6 is the net change in f over [0, 6].', { size: 15 }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'The area under f prime is the net change in f',
    'Top: the graph of f prime of x = 1 - x/4 on [0, 6]. The triangle above the x-axis from 0 to 4 has area 2; the triangle below from 4 to 6 has area 0.5. Bottom: the graph of f(x) = 1 + x - x squared over 8, from (0, 1), rising to a maximum at x = 4 and falling to (6, 2.5). A bracket shows f(6) - f(0) = 2 - 0.5 = 1.5, the net area under f prime.', b) };
}

/* 6.8: a family of antiderivatives differ by a constant. */
{
  const id = 'antiderivative-family';
  const F = x => x ** 3 / 3 - x, X = 1.5, m = X * X - 1;
  const W = 720, H = 470, b = [];
  const P = panel({ left: 70, top: 50, width: 560, height: 360, x: [-2.4, 2.4], y: [-3.6, 3.6], xStep: 0.5, yStep: 0.5, xEvery: 1, yEvery: 1, skipTicks: ['x-1'], xLabel: [{ t: 'x', i: true }], yLabel: [{ t: 'y', i: true }] });
  b.push(...P.out, P.axes());
  const Cs = [-2, -1, 0, 1, 2], cols = [BLUE, GREEN, CRIMSON, VERM, MUTED];
  Cs.forEach((C, i) => {
    b.push(curve(P, x => F(x) + C, -2.4, 2.4, { color: cols[i], width: C === 0 ? 2.8 : 2.1 }));
    b.push(curve(P, x => F(X) + C + m * (x - X), X - 0.42, X + 0.42, { color: INK, width: 1.6 }));
    b.push(dot(P, X, F(X) + C, { r: 3.6, color: cols[i] }));
    b.push(text(P.sx(-1), P.sy(F(-1) + C) - 9, `C = ${fmt(C)}`, { size: 13.5, anchor: 'middle', color: cols[i], bold: true, halo: true }));
  });
  b.push(seg(P, X, -3.6, X, 3.6, { color: MUTED, dash: '4 5', width: 1.2 }));
  b.push(text(P.sx(0) , 446, 'At x = 1.5 (dashed line) every curve has the same slope, 1.25.', { size: 14, anchor: 'middle' }));
  b.push(text(70, 26, [{ t: 'y', i: true }, { t: ' = ' }, { t: 'x', i: true }, { t: '3', sup: true }, { t: '/3 − ' }, { t: 'x', i: true }, { t: ' + ' }, { t: 'C', i: true }, { t: ': every curve has derivative ' }, { t: 'x', i: true }, { t: '2', sup: true }, { t: ' − 1' }], { size: 15 }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'A family of antiderivatives',
    'Five curves y = x cubed over 3 - x + C for C = -2, -1, 0, 1 and 2, each a vertical shift of the others. A dashed vertical line at x = 1.5 crosses all five, and a short tangent segment at each crossing shows the same slope, 1.25, because every curve has derivative x squared - 1.', b) };
}

/* 6.9: substitution changes the variable and the limits, not the area. */
{
  const id = 'u-sub-areas';
  const f = x => 2 * x * Math.cos(x * x), g = u => Math.cos(u), X1 = Math.sqrt(Math.PI / 2);
  const W = 760, H = 380, b = [];
  const P = panel({ left: 50, top: 80, width: 290, height: 220, x: [0, 1.5], y: [0, 1.5], xStep: 0.25, yStep: 0.25, xEvery: 0.5, yEvery: 0.5, xLabel: [{ t: 'x', i: true }], yLabel: [{ t: 'y', i: true }] });
  b.push(...P.out, shade(P, f, 0, X1, { color: CRIMSON, opacity: 0.22 }), P.axes(), curve(P, f, 0, 1.45, { color: CRIMSON }));
  b.push(seg(P, X1, 0, X1, 0, {}), text(P.sx(X1), P.sy(0) + 34, '√(π/2) ≈ 1.25', { anchor: 'middle', size: 13, color: CRIMSON }));
  b.push(text(P.sx(0.62), P.sy(0.45), 'area 1', { anchor: 'middle', bold: true, halo: true }));
  b.push(text(50, 34, [{ t: 'y', i: true }, { t: ' = 2' }, { t: 'x', i: true }, { t: ' cos(' }, { t: 'x', i: true }, { t: '2', sup: true }, { t: '),  ' }, { t: 'x', i: true }, { t: ' from 0 to √(π/2)' }], { size: 15, bold: true }));
  const Q = panel({ left: 440, top: 80, width: 290, height: 220, x: [0, 1.75], y: [0, 1.5], xStep: 0.25, yStep: 0.25, xEvery: 0.5, yEvery: 0.5, xLabel: [{ t: 'u', i: true }], yLabel: [{ t: 'y', i: true }] });
  b.push(...Q.out, shade(Q, g, 0, Math.PI / 2, { color: BLUE, opacity: 0.22 }), Q.axes(), curve(Q, g, 0, 1.72, { color: BLUE }));
  b.push(text(Q.sx(Math.PI / 2), Q.sy(0) + 34, 'π/2 ≈ 1.57', { anchor: 'middle', size: 13, color: BLUE }));
  b.push(text(Q.sx(0.62), Q.sy(0.45), 'area 1', { anchor: 'middle', bold: true, halo: true }));
  b.push(text(440, 34, [{ t: 'y', i: true }, { t: ' = cos ' }, { t: 'u', i: true }, { t: ',  ' }, { t: 'u', i: true }, { t: ' from 0 to π/2' }], { size: 15, bold: true }));
  b.push(text(W / 2, H - 16, [{ t: 'u', i: true }, { t: ' = ' }, { t: 'x', i: true }, { t: '2', sup: true }, { t: ':  ' }, { t: 'x', i: true }, { t: ' = 0 gives ' }, { t: 'u', i: true }, { t: ' = 0, and ' }, { t: 'x', i: true }, { t: ' = √(π/2) gives ' }, { t: 'u', i: true }, { t: ' = π/2. Same area, new variable, new limits.' }], { anchor: 'middle', size: 14.5 }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Substitution keeps the area and changes the limits',
    'Left: the graph of y = 2x cos(x squared) from x = 0 to the square root of pi/2, about 1.25, with the region under it shaded; its area is 1. Right: the graph of y = cos u from u = 0 to pi/2, about 1.57, with the region under it shaded; its area is also 1. With u = x squared, the x-limits 0 and the square root of pi/2 become the u-limits 0 and pi/2.', b) };
}

/* 6.10: long division splits a rational function into a line plus a small part. */
{
  const id = 'long-division-asymptote';
  const f = x => (x * x + 3 * x + 5) / (x + 1), line = x => x + 2;
  const W = 720, H = 480, b = [];
  const P = panel({ left: 70, top: 64, width: 560, height: 370, x: [-5, 6], y: [-10, 12], xStep: 1, yStep: 2, yEvery: 4, xLabel: [{ t: 'x', i: true }], yLabel: [{ t: 'y', i: true }] });
  b.push(...P.out, P.axes());
  b.push(seg(P, -1, -10, -1, 12, { color: MUTED, dash: '6 5', width: 1.3 }));
  b.push(curve(P, line, -5, 6, { color: BLUE, width: 2, dash: '8 6' }));
  b.push(curve(P, f, -5, -1.0001, { color: CRIMSON, n: 1200 }), curve(P, f, -0.9999, 6, { color: CRIMSON, n: 1200 }));
  const X = 3;
  b.push(seg(P, X, line(X), X, f(X), { color: INK, width: 2.2 }));
  b.push(text(P.sx(X) + 8, P.sy((line(X) + f(X)) / 2) + 18, 'gap = 3/(x + 1)', { size: 14, bold: true, halo: true }));
  b.push(seg(P, -4.7, 10, -3.9, 10, { color: BLUE, width: 2, dash: '8 6' }), text(P.sx(-3.75), P.sy(10) + 5, 'y = x + 2 (the quotient)', { size: 14, color: BLUE, bold: true, halo: true }));
  b.push(text(P.sx(1.5), P.sy(10.6), 'y = (x² + 3x + 5)/(x + 1)', { size: 14, color: CRIMSON, bold: true, halo: true }));
  b.push(text(P.sx(-1) - 6, P.sy(-9), 'x = −1', { size: 13.5, anchor: 'end', color: MUTED, halo: true }));
  b.push(text(70, 26, '(x² + 3x + 5)/(x + 1) = x + 2 + 3/(x + 1): a line you can integrate plus a piece of the form k/(x + 1).', { size: 14.5 }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Long division splits the integrand into simple pieces',
    'The graph of y = (x squared + 3x + 5)/(x + 1) in two branches on either side of the vertical asymptote x = -1, and the dashed line y = x + 2. The curve hugs the line far from x = -1; at x = 3 a vertical segment marks the gap between them, 3/(x + 1). Long division gives (x squared + 3x + 5)/(x + 1) = x + 2 + 3/(x + 1).', b) };
}

/* 6.14: a decision path for choosing a technique. */
{
  const id = 'integration-flowchart';
  const W = 760, H = 560, b = [];
  const box = (x, y, w, h, lines, o = {}) => {
    const out = [`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.round ? 12 : 6}" fill="${o.fill || '#fff'}" stroke="${o.stroke || INK}" stroke-width="${o.sw || 1.6}"/>`];
    const lh = 19, y0 = y + h / 2 - (lines.length - 1) * lh / 2 + 5;
    lines.forEach((l, i) => out.push(text(x + w / 2, y0 + i * lh, l, { anchor: 'middle', size: 14.5, bold: i === 0 && o.boldFirst, color: o.color || INK })));
    return out.join('');
  };
  const arrow = (x1, y1, x2, y2, label, side = 1) => {
    const a = Math.atan2(y2 - y1, x2 - x1), hx = x2 - 9 * Math.cos(a), hy = y2 - 9 * Math.sin(a);
    const p = `${r2(x2)},${r2(y2)} ${r2(hx - 4.5 * Math.sin(a))},${r2(hy + 4.5 * Math.cos(a))} ${r2(hx + 4.5 * Math.sin(a))},${r2(hy - 4.5 * Math.cos(a))}`;
    const lab = label ? text((x1 + x2) / 2 + (Math.abs(y2 - y1) > Math.abs(x2 - x1) ? 8 * side : 0), (y1 + y2) / 2 + (Math.abs(y2 - y1) > Math.abs(x2 - x1) ? 5 : -7), label, { size: 13.5, bold: true, anchor: Math.abs(y2 - y1) > Math.abs(x2 - x1) ? (side > 0 ? 'start' : 'end') : 'middle', color: label === 'yes' ? GREEN : VERM }) : '';
    return `<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(hx)}" y2="${r2(hy)}" stroke="${INK}" stroke-width="1.6"/><polygon points="${p}" fill="${INK}"/>${lab}`;
  };
  const qx = 40, qw = 330, rx = 450, rw = 280;
  b.push(text(W / 2, 30, 'Choosing a technique: ask the questions in order', { anchor: 'middle', size: 17, bold: true }));
  const rows = [
    { y: 60, q: ['1. Is it a basic form, or a sum of', 'basic forms after rewriting powers?'], a: ['Basic rules: power, ln|x|, eˣ,', 'sin, cos, sec², 1/(1 + x²)'] },
    { y: 180, q: ['2. Is there an inside function u', 'whose derivative is also a factor?'], a: ['Substitution: let u = inside,', 'du = u′ dx; change the limits'] },
    { y: 300, q: ['3. Rational, and the top has degree', '≥ the bottom’s degree?'], a: ['Long division first, then', 'basic rules or substitution'] },
    { y: 420, q: ['4. A quadratic on the bottom', 'with no real zeros?'], a: ['Complete the square, then', 'arctan (with substitution)'] },
  ];
  rows.forEach((r, i) => {
    b.push(box(qx, r.y, qw, 72, r.q, { fill: '#FCE8EE', stroke: CRIMSON }));
    b.push(box(rx, r.y, rw, 72, r.a, { round: true, stroke: GREEN, sw: 1.8 }));
    b.push(arrow(qx + qw, r.y + 36, rx, r.y + 36, 'yes'));
    if (i < rows.length - 1) b.push(arrow(qx + qw / 2, r.y + 72, qx + qw / 2, rows[i + 1].y, 'no', 1));
  });
  b.push(text(qx + qw / 2, 524, 'If none fits, rewrite the integrand (expand, split a fraction, use an identity) and start again.', { anchor: 'start', size: 13.5, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'A decision path for choosing an antidifferentiation technique',
    'A flowchart of four questions asked in order, each with a yes arrow to a technique. 1: Is it a basic form, or a sum of basic forms after rewriting powers? Yes: basic rules (power, ln absolute x, e to the x, sine, cosine, secant squared, 1 over 1 + x squared). No: 2: Is there an inside function u whose derivative is also a factor? Yes: substitution, with du and new limits. No: 3: Is it rational with the top degree at least the bottom degree? Yes: long division first. No: 4: Is there a quadratic on the bottom with no real zeros? Yes: complete the square, then arctan. If none fits, rewrite the integrand and start again.', b) };
}

mkdirSync(OUT, { recursive: true });
for (const [id, f] of Object.entries(figs)) writeFileSync(join(OUT, `${id}.svg`), f.svg);
if (args.includes('--meta')) console.log(JSON.stringify(Object.fromEntries(Object.entries(figs).map(([id, f]) => [id, { w: f.w, h: f.h }]))));
console.log(`Unit 6 figures: ${Object.keys(figs).length} written to ${OUT}`);
