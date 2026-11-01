/* AP® Calculus BC, author A's figures: the BC techniques of Units 6-8
   (integration by parts, linear partial fractions, improper integrals,
   Euler's method, logistic models, arc length).

   Every graph is drawn by sampling the function it shows, so a picture can
   never drift from its caption; every number printed on a figure is computed
   here. Standalone SVG: white background, role="img" with <title> and <desc>,
   Arial/Helvetica, ink #1F2A28, BC violet #5A1E96 for emphasis (the constant is still named EMERALD), Okabe-Ito
   blue #0072B2 / vermillion #D55E00 / orange #E69F00 for further curves.
   Helpers follow scripts/apcalc-figures/unit-6.mjs (AB).

     node scripts/apcalcbc-figures/author-a.mjs            writes calculus-bc/figures/<id>.svg
     node scripts/apcalcbc-figures/author-a.mjs --out DIR   writes to DIR instead (preview)

   The metadata (alt text, size, licence) is in calculus-bc/data/figures/<topic>.json. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const args = process.argv.slice(2);
const OUT = args.includes('--out') ? args[args.indexOf('--out') + 1] : join(ROOT, 'calculus-bc', 'figures');

const INK = '#1F2A28', EMERALD = '#5A1E96', BLUE = '#0072B2', VERM = '#D55E00', ORANGE = '#E69F00', GRID = '#E3E6E5', MUTED = '#5B6664';
const FONT = 'Arial, Helvetica, sans-serif';
const r2 = v => Math.round(v * 100) / 100;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = v => String(+v.toFixed(6)).replace('-', '−');
const dec = (v, p = 3) => v.toFixed(p).replace('-', '−');

/* Text. Rich text: segments [{ t, i (italic), sub, sup, b (bold) }] or a plain string. */
function text(x, y, s, o = {}) {
  const size = o.size || 15, fill = o.color || INK, anchor = o.anchor || 'start', weight = o.bold ? 'bold' : 'normal';
  const segs = typeof s === 'string' ? [{ t: s }] : s;
  const body = segs.map(g => {
    const st = [g.i ? 'font-style="italic"' : '', g.b ? 'font-weight="bold"' : '', g.color ? `fill="${g.color}"` : ''].filter(Boolean).join(' ');
    if (g.sub || g.sup) {
      const dy = g.sub ? size * 0.32 : -size * 0.42;
      return `<tspan dy="${r2(dy)}" font-size="${r2(size * 0.68)}" ${st}>${esc(g.t)}</tspan><tspan dy="${r2(-dy)}" font-size="${size}"> </tspan>`;
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
    for (const v of xt) if (v !== ay && (!o.xEvery || Math.abs(v / o.xEvery - Math.round(v / o.xEvery)) < 1e-9)) {
      a.push(`<line x1="${r2(sx(v))}" y1="${r2(sy(ax) - 4)}" x2="${r2(sx(v))}" y2="${r2(sy(ax) + 4)}" stroke="${INK}" stroke-width="1.2"/>`);
      a.push(text(sx(v), sy(ax) + 18, (o.xTick || fmt)(v), { size: 13, anchor: 'middle', color: MUTED, halo: true }));
    }
    for (const v of yt) if (v !== ax && (!o.yEvery || Math.abs(v / o.yEvery - Math.round(v / o.yEvery)) < 1e-9)) {
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
  let d = '', pen = false;
  for (const [x, y] of pts) {
    if (y < y0 - 1e-9 || y > y1 + 1e-9) { pen = false; continue; }
    d += `${pen ? 'L' : 'M'}${r2(P.sx(x))} ${r2(P.sy(y))}`; pen = true;
  }
  return `<path d="${d}" fill="none" stroke="${o.color || EMERALD}" stroke-width="${o.width || 2.6}" stroke-linejoin="round" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
}
function shade(P, f, a, b, o = {}) {
  const g = o.f2 || (() => 0);
  const top = samplePts(f, a, b, 300), bot = samplePts(g, a, b, 300).reverse();
  const pts = [...top, ...bot].map(([x, y]) => `${r2(P.sx(x))},${r2(P.sy(y))}`).join(' ');
  return `<polygon points="${pts}" fill="${o.color || EMERALD}" fill-opacity="${o.opacity ?? 0.18}" stroke="none"/>`;
}
function polygon(P, pts, o = {}) {
  return `<polygon points="${pts.map(([x, y]) => `${r2(P.sx(x))},${r2(P.sy(y))}`).join(' ')}" fill="${o.fill || 'none'}" fill-opacity="${o.opacity ?? 1}" stroke="${o.stroke || 'none'}" stroke-width="${o.width || 1.4}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
}
function seg(P, x1, y1, x2, y2, o = {}) {
  return `<line x1="${r2(P.sx(x1))}" y1="${r2(P.sy(y1))}" x2="${r2(P.sx(x2))}" y2="${r2(P.sy(y2))}" stroke="${o.color || INK}" stroke-width="${o.width || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} stroke-linecap="round"/>`;
}
function dot(P, x, y, o = {}) {
  return `<circle cx="${r2(P.sx(x))}" cy="${r2(P.sy(y))}" r="${o.r || 5}" fill="${o.open ? '#fff' : (o.color || EMERALD)}" stroke="${o.color || EMERALD}" stroke-width="2"/>`;
}
/* A slope field: a short segment of slope dydx(x, y) at each grid point, equal length on screen. */
function field(P, dydx, xs, ys, o = {}) {
  const len = o.len || 16, out = [];
  for (const x of xs) for (const y of ys) {
    const m = dydx(x, y);
    const dx = P.sx(x + 1) - P.sx(x), dy = P.sy(y + m) - P.sy(y);
    const k = len / 2 / Math.hypot(dx, dy);
    out.push(`<line x1="${r2(P.sx(x) - dx * k)}" y1="${r2(P.sy(y) - dy * k)}" x2="${r2(P.sx(x) + dx * k)}" y2="${r2(P.sy(y) + dy * k)}"/>`);
  }
  return `<g stroke="${o.color || MUTED}" stroke-width="1.4" stroke-linecap="round">${out.join('')}</g>`;
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
const range = (a, b, s) => { const o = []; for (let v = a; v <= b + 1e-9; v += s) o.push(+v.toFixed(9)); return o; };

const figs = {};

/* 6.11: integration by parts as areas. Along v = ln u from (1, 0) to (e, 1),
   the area under the curve (int v du) plus the area to its left (int u dv)
   fill the rectangle e by 1: int v du = uv - int u dv. */
{
  const id = 'integration-by-parts-areas';
  const E = Math.E, W = 760, H = 430;
  const P = panel({ left: 80, top: 50, width: 560, height: 300, x: [0, 3.1], y: [0, 1.3], xStep: 0.5, yStep: 0.25, xEvery: 1, yEvery: 0.5, xLabel: [{ t: 'u', i: true }], yLabel: [{ t: 'v', i: true }] });
  const vdu = 1;                       // int_1^e ln u du = [u ln u - u]_1^e = 1
  const udv = E - 1;                   // int_0^1 e^v dv = e - 1
  const b = [...P.out];
  b.push(shade(P, u => Math.log(u), 1, E, { color: EMERALD, opacity: 0.25 }));
  b.push(polygon(P, [[0, 0], ...samplePts(v => Math.exp(v), 0, 1, 200).map(([v, u]) => [u, v]), [0, 1]], { fill: BLUE, opacity: 0.2 }));
  b.push(polygon(P, [[0, 0], [E, 0], [E, 1], [0, 1]], { stroke: INK, width: 1.4, dash: '6 5' }));
  b.push(P.axes());
  b.push(curve(P, u => Math.log(u), 1, E, { color: EMERALD }));
  b.push(dot(P, 1, 0), dot(P, E, 1));
  b.push(text(P.sx(E) + 8, P.sy(1) - 8, '(e, 1)', { size: 14 }));
  b.push(text(P.sx(2.25), P.sy(0.28), '∫ v du = ' + fmt(vdu), { anchor: 'middle', bold: true, color: EMERALD, halo: true }));
  b.push(text(P.sx(2.25), P.sy(0.28) + 18, 'area under v = ln u', { anchor: 'middle', size: 13.5, color: EMERALD, halo: true }));
  b.push(text(P.sx(0.8), P.sy(0.62), [{ t: '∫ u dv = e − 1 ≈ ' + dec(udv) }], { anchor: 'middle', bold: true, color: BLUE, halo: true }));
  b.push(text(P.sx(0.8), P.sy(0.62) + 18, 'area to the left of the curve', { anchor: 'middle', size: 13.5, color: BLUE, halo: true }));
  b.push(text(W / 2, 24, 'Together they fill the e-by-1 rectangle:  ∫ v du + ∫ u dv = uv = e · 1 − 1 · 0', { anchor: 'middle', size: 15, bold: true }));
  b.push(text(W / 2, H - 22, 'So ∫ from 1 to e of ln u du = e − (e − 1) = 1: integration by parts reads the same picture.', { anchor: 'middle', size: 14, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Integration by parts as two areas in a rectangle',
    'In the u-v plane, the curve v = ln u runs from (1, 0) to (e, 1). The region under the curve, between it and the u-axis from u = 1 to u = e, is shaded violet and has area 1: this is the integral of v du. The region to the left of the curve, between it and the v-axis from v = 0 to v = 1, is shaded blue and has area e − 1, about 1.718: this is the integral of u dv. Together the two regions fill the dashed rectangle from (0, 0) to (e, 1), whose area is uv = e. So the integral of v du equals uv minus the integral of u dv.', b) };
}

/* 6.12: (x + 7)/((x - 1)(x + 3)) = 2/(x - 1) - 1/(x + 3). */
{
  const id = 'partial-fractions-split';
  const W = 760, H = 460;
  const f = x => (x + 7) / ((x - 1) * (x + 3)), g1 = x => 2 / (x - 1), g2 = x => -1 / (x + 3);
  const P = panel({ left: 70, top: 56, width: 600, height: 330, x: [-7, 5], y: [-6, 6], xStep: 1, yStep: 1, xEvery: 1, yEvery: 2, xLabel: [{ t: 'x', i: true }], yLabel: [{ t: 'y', i: true }] });
  const b = [...P.out];
  b.push(seg(P, 1, -6, 1, 6, { color: MUTED, dash: '5 5', width: 1.2 }), seg(P, -3, -6, -3, 6, { color: MUTED, dash: '5 5', width: 1.2 }));
  b.push(P.axes());
  const brk = (fn, cuts, o) => { const pts = [-7, ...cuts, 5]; return pts.slice(0, -1).map((a, i) => curve(P, fn, a + (i ? 0.002 : 0), pts[i + 1] - (i < pts.length - 2 ? 0.002 : 0), o)).join(''); };
  b.push(brk(g1, [1], { color: BLUE, width: 2, dash: '7 5' }));
  b.push(brk(g2, [-3], { color: VERM, width: 2, dash: '7 5' }));
  b.push(brk(f, [-3, 1], { color: EMERALD, width: 3 }));
  b.push(text(P.sx(1) - 6, P.sy(5.6), 'x = 1', { size: 13, color: MUTED, anchor: 'end' }), text(P.sx(-3) + 6, P.sy(5.6), 'x = −3', { size: 13, color: MUTED }));
  b.push(text(P.sx(3.1), P.sy(2.4), [{ t: '(x + 7) / ((x − 1)(x + 3))', b: true }], { anchor: 'middle', size: 14.5, color: EMERALD, halo: true }));
  b.push(text(P.sx(4.1), P.sy(1.45), '2/(x − 1)', { anchor: 'middle', size: 14, color: BLUE, halo: true }));
  b.push(text(P.sx(-5.2), P.sy(1.2), '−1/(x + 3)', { anchor: 'middle', size: 14, color: VERM, halo: true }));
  b.push(text(W / 2, 26, 'One fraction is the sum of two simple ones:  (x + 7)/((x − 1)(x + 3)) = 2/(x − 1) − 1/(x + 3)', { anchor: 'middle', size: 15, bold: true }));
  b.push(text(W / 2, H - 22, 'Each simple fraction integrates to a natural log: 2 ln|x − 1| − ln|x + 3| + C.', { anchor: 'middle', size: 14, color: MUTED }));
  // Check the identity numerically at a few points (a figure never drifts from its caption).
  for (const x of [-5, -1, 0, 2, 4]) if (Math.abs(f(x) - g1(x) - g2(x)) > 1e-12) throw new Error('partial fraction identity fails at ' + x);
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'A rational function split into two simple fractions',
    'Graph on x from −7 to 5 of y = (x + 7)/((x − 1)(x + 3)), drawn solid violet, with dashed vertical asymptotes at x = 1 and x = −3. Two dashed curves show its pieces: y = 2/(x − 1) in blue, with its asymptote at x = 1, and y = −1/(x + 3) in vermillion, with its asymptote at x = −3. At every x the violet curve is the sum of the blue and vermillion curves, so the integral of the violet function is 2 ln|x − 1| − ln|x + 3| + C.', b) };
}

/* 6.13: 1/x^2 and 1/x on [1, b]: one area levels off at 1, the other grows like ln b. */
{
  const id = 'improper-integrals-two-tails';
  const W = 500, H = 800, B = 8;
  const b = [];
  const panels = [
    { f: x => 1 / (x * x), name: '1/x²', area: bb => 1 - 1 / bb, verdict: 'area → 1: converges', color: EMERALD },
    { f: x => 1 / x, name: '1/x', area: bb => Math.log(bb), verdict: 'area → ∞: diverges', color: VERM },
  ];
  panels.forEach((p, k) => {
    const left = 60, top = 150 + k * 360;
    const P = panel({ left, top, width: 380, height: 180, x: [0, 8.6], y: [0, 1.25], xStep: 1, yStep: 0.25, xEvery: 1, yEvery: 0.5, xLabel: [{ t: 'x', i: true }], yLabel: [{ t: 'y', i: true }] });
    b.push(...P.out);
    b.push(shade(P, p.f, 1, B, { color: p.color, opacity: 0.22 }));
    b.push(P.axes());
    b.push(curve(P, p.f, 0.8, 8.5, { color: p.color }));
    b.push(seg(P, B, 0, B, p.f(B), { color: p.color, width: 1.6 }));
    b.push(text(P.sx(B), P.sy(p.f(B)) - 10, 'x = b', { anchor: 'middle', size: 15, color: MUTED, halo: true }));
    b.push(text(left, top - 52, [{ t: 'y = ' + p.name, b: true }], { size: 19, color: p.color }));
    b.push(text(left, top - 28, 'Area from 1 to b:  ' + (k ? 'ln b' : '1 − 1/b'), { size: 17 }));
    b.push(text(left, top + 222, [2, 10].map(bb => `b = ${bb}: ${dec(p.area(bb))}`).join(';  ') + ';  ' + [100, 1000].map(bb => `b = ${bb}: ${dec(p.area(bb))}`).join(';  '), { size: 14, color: MUTED }));
    b.push(text(left, top + 248, 'As b → ∞, ' + p.verdict, { size: 18, bold: true, color: p.color }));
  });
  b.push(text(W / 2, 30, 'Both curves approach 0;', { anchor: 'middle', size: 19, bold: true }));
  b.push(text(W / 2, 54, 'only one area stays finite', { anchor: 'middle', size: 19, bold: true }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'The areas under 1/x squared and 1/x from 1 to b',
    'Left panel: the graph of y = 1/x squared with the region under it from x = 1 to x = b shaded violet. That area is 1 − 1/b: 0.500 at b = 2, 0.900 at b = 10, 0.990 at b = 100, 0.999 at b = 1000. As b grows the area levels off at 1, so the improper integral from 1 to infinity converges to 1. Right panel: the graph of y = 1/x with the region under it from 1 to b shaded vermillion. That area is ln b: 0.693 at b = 2, 2.303 at b = 10, 4.605 at b = 100, 6.908 at b = 1000. It grows without bound, so the improper integral diverges, even though 1/x also approaches 0.', b) };
}

/* 7.5: Euler's method on dy/dx = y from (0, 1), two steps of 0.5, against the solution y = e^x. */
{
  const id = 'eulers-method-steps';
  const W = 760, H = 470, h = 0.5;
  const P = panel({ left: 70, top: 50, width: 560, height: 350, x: [-0.25, 1.25], y: [0, 3.25], xStep: 0.25, yStep: 0.25, xEvery: 0.5, yEvery: 1, xLabel: [{ t: 'x', i: true }], yLabel: [{ t: 'y', i: true }] });
  const pts = [[0, 1]];
  for (let k = 0; k < 2; k++) { const [x, y] = pts[k]; pts.push([x + h, y + h * y]); }
  if (Math.abs(pts[2][1] - 2.25) > 1e-12) throw new Error('Euler table drifted');
  const b = [...P.out];
  b.push(field(P, (x, y) => y, range(-0.125, 1.25, 0.25), range(0.25, 3, 0.25), { len: 15 }));
  b.push(P.axes());
  b.push(curve(P, x => Math.exp(x), -0.25, 1.2, { color: BLUE, width: 2.4 }));
  for (let k = 0; k < 2; k++) b.push(seg(P, pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], { color: EMERALD, width: 3 }));
  pts.forEach(([x, y]) => b.push(dot(P, x, y)));
  b.push(dot(P, 1, Math.E, { color: BLUE, r: 4.5 }));
  b.push(text(P.sx(0) + 10, P.sy(1) + 20, '(0, 1)  slope 1', { size: 13.5, color: EMERALD, halo: true }));
  b.push(text(P.sx(0.5) + 10, P.sy(1.5) + 20, '(0.5, 1.5)  slope 1.5', { size: 13.5, color: EMERALD, halo: true }));
  b.push(text(P.sx(1) + 10, P.sy(2.25) + 6, '(1, 2.25)  Euler estimate', { size: 13.5, color: EMERALD, bold: true, halo: true }));
  b.push(text(P.sx(1) - 10, P.sy(Math.E) - 8, `(1, e ≈ ${dec(Math.E)})  solution`, { size: 13.5, color: BLUE, anchor: 'end', bold: true, halo: true }));
  b.push(text(W / 2, 24, 'Euler’s method on dy/dx = y from (0, 1) with Δx = 0.5', { anchor: 'middle', size: 16, bold: true }));
  b.push(text(W / 2, H - 22, 'The solution y = eˣ is concave up, so each step falls below it: 2.25 underestimates e.', { anchor: 'middle', size: 14, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Two Euler steps beside the true solution curve',
    'The slope field of dy/dx = y for x from −0.25 to 1.25, with short gray segments that get steeper as y increases. The solution through (0, 1), y = e to the x, is drawn in blue. Two violet Euler steps of size 0.5 start at (0, 1): the first follows slope 1 to (0.5, 1.5); the second follows slope 1.5 to (1, 2.25). The true value at x = 1 is e, about 2.718, marked in blue above the last violet point. Because the solution is concave up, each straight step falls below the curve, so the Euler estimate 2.25 is an underestimate.', b) };
}

/* 7.9: a logistic population with K = 1000: P against t, and dP/dt against P. */
{
  const id = 'logistic-models-curve';
  const W = 520, H = 760, K = 1000, k = 0.0008, P0 = 100;
  const Pt = t => K / (1 + (K / P0 - 1) * Math.exp(-k * K * t));   // the solution of dP/dt = kP(K - P), P(0) = 100
  const rate = p => k * p * (K - p);
  // Check: the closed form satisfies the differential equation.
  for (const t of [0.5, 2, 5]) { const d = (Pt(t + 1e-6) - Pt(t - 1e-6)) / 2e-6; if (Math.abs(d - rate(Pt(t))) > 1e-3) throw new Error('logistic check'); }
  const tHalf = Math.log(K / P0 - 1) / (k * K);
  const b = [];
  const A = panel({ left: 80, top: 70, width: 380, height: 240, x: [0, 8.4], y: [0, 1150], xStep: 1, yStep: 250, xEvery: 2, yEvery: 500, xLabel: [{ t: 't', i: true }], yLabel: [{ t: 'P', i: true }] });
  b.push(...A.out, seg(A, 0, K, 8.4, K, { color: VERM, dash: '7 5', width: 1.6 }), seg(A, 0, K / 2, 8.4, K / 2, { color: MUTED, dash: '3 4', width: 1.2 }), A.axes());
  b.push(curve(A, Pt, 0, 8.3, { color: EMERALD }));
  b.push(dot(A, 0, P0), dot(A, tHalf, K / 2, { color: BLUE }));
  b.push(text(A.sx(8.3), A.sy(K) - 10, 'carrying capacity 1000', { anchor: 'end', size: 16, color: VERM, halo: true }));
  b.push(text(A.sx(tHalf) + 12, A.sy(K / 2) + 22, 'P = 500: fastest growth', { size: 16, color: BLUE, halo: true }));
  b.push(text(80, 34, 'The population P against time t', { size: 18, bold: true }));
  const Bp = panel({ left: 80, top: 430, width: 360, height: 220, x: [0, 1150], y: [0, 230], xStep: 250, yStep: 50, xEvery: 500, yEvery: 100, xLabel: [{ t: 'P', i: true }], yLabel: [{ t: 'dP/dt' }] });
  b.push(...Bp.out, Bp.axes());
  b.push(curve(Bp, rate, 0, K, { color: EMERALD }));
  b.push(seg(Bp, K / 2, 0, K / 2, rate(K / 2), { color: BLUE, dash: '4 4' }), dot(Bp, K / 2, rate(K / 2), { color: BLUE }), dot(Bp, 0, 0, { r: 4 }), dot(Bp, K, 0, { r: 4 }));
  b.push(text(Bp.sx(K / 2), Bp.sy(rate(K / 2)) - 14, `largest rate ${fmt(rate(K / 2))} at P = 500`, { anchor: 'middle', size: 16, color: BLUE, halo: true }));
  b.push(text(80, 380, 'The rate dP/dt = 0.0008P(1000 − P)', { size: 18, bold: true }));
  b.push(text(W / 2, H - 40, 'The rate is 0 at P = 0 and P = 1000, largest at P = 500.', { anchor: 'middle', size: 15, color: MUTED }));
  b.push(text(W / 2, H - 18, 'From P(0) = 100 the population rises toward 1000.', { anchor: 'middle', size: 15, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'A logistic population and its growth rate',
    'Left: the population P against time t for the logistic model dP/dt = 0.0008P(1000 − P) with P(0) = 100. The curve starts at 100, rises slowly, then steeply, then levels off below the dashed line P = 1000, the carrying capacity. It is steepest where it crosses the dotted line P = 500, at about t = 2.75, where it changes from concave up to concave down. Right: the rate dP/dt graphed against P is a downward parabola, 0 at P = 0 and at P = 1000, with its largest value 200 at P = 500.', b) };
}

/* 8.13: the length of y = (2/3)x^(3/2) on [0, 3] approximated by three chords. */
{
  const id = 'arc-length-chords';
  const W = 760, H = 450;
  const f = x => (2 / 3) * Math.pow(x, 1.5);
  const xs = [0, 1, 2, 3];
  const chords = xs.slice(1).map((x, i) => Math.hypot(x - xs[i], f(x) - f(xs[i])));
  const sum = chords.reduce((a, c) => a + c, 0), L = 14 / 3;
  // Check the exact length against a numerical integral of sqrt(1 + f'(x)^2) = sqrt(1 + x).
  let s = 0; const n = 20000; for (let i = 0; i < n; i++) { const x = 3 * (i + 0.5) / n; s += Math.sqrt(1 + x) * 3 / n; }
  if (Math.abs(s - L) > 1e-6) throw new Error('arc length check');
  const P = panel({ left: 80, top: 60, width: 520, height: 300, x: [0, 3.3], y: [0, 3.8], xStep: 0.5, yStep: 0.5, xEvery: 1, yEvery: 1, xLabel: [{ t: 'x', i: true }], yLabel: [{ t: 'y', i: true }] });
  const b = [...P.out, P.axes()];
  b.push(curve(P, f, 0, 3, { color: EMERALD, width: 3 }));
  xs.slice(1).forEach((x, i) => {
    const a = xs[i];
    b.push(seg(P, a, f(a), x, f(x), { color: BLUE, width: 2, dash: '7 4' }));
    b.push(seg(P, a, f(a), x, f(a), { color: MUTED, width: 1, dash: '2 3' }), seg(P, x, f(a), x, f(x), { color: MUTED, width: 1, dash: '2 3' }));
    b.push(text((P.sx(a) + P.sx(x)) / 2 - 14, (P.sy(f(a)) + P.sy(f(x))) / 2 - 10, dec(chords[i]), { size: 13.5, color: BLUE, anchor: 'end', halo: true }));
  });
  xs.forEach(x => b.push(dot(P, x, f(x), { r: 4.5, color: BLUE })));
  b.push(text(W / 2, 26, 'Chords along y = (2/3)x^(3/2): each one is the hypotenuse of a right triangle', { anchor: 'middle', size: 15, bold: true }));
  b.push(text(P.sx(3) + 14, P.sy(f(3)) + 4, `three chords: ${dec(sum)}`, { size: 14, color: BLUE, bold: true, halo: true }));
  b.push(text(P.sx(3) + 14, P.sy(f(3)) + 24, `curve: 14/3 ≈ ${dec(L)}`, { size: 14, color: EMERALD, bold: true, halo: true }));
  b.push(text(W / 2, H - 46, 'A chord over a run Δx with rise Δy has length √((Δx)² + (Δy)²). More, shorter chords close in on the curve,', { anchor: 'middle', size: 13.5, color: MUTED }));
  b.push(text(W / 2, H - 26, 'and their total becomes the integral of √(1 + (dy/dx)²) dx, here ∫ from 0 to 3 of √(1 + x) dx = 14/3.', { anchor: 'middle', size: 13.5, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Chords approximating the length of a curve',
    `The curve y = (2/3)x to the 3/2 from x = 0 to x = 3, drawn in violet, rising from (0, 0) to (3, 2√3), about (3, 3.464). Three blue dashed chords join the points at x = 0, 1, 2 and 3, each with a dotted right triangle showing its run and rise. The chord lengths are ${dec(chords[0])}, ${dec(chords[1])} and ${dec(chords[2])}, a total of ${dec(sum)}, a little less than the curve's length 14/3, about ${dec(L)}. Each chord is the hypotenuse √((Δx)² + (Δy)²); with more chords the total becomes the integral of √(1 + (dy/dx)²) dx, which here is the integral from 0 to 3 of √(1 + x) dx = 14/3.`, b) };
}

mkdirSync(OUT, { recursive: true });
for (const [id, f] of Object.entries(figs)) writeFileSync(join(OUT, `${id}.svg`), f.svg);
if (args.includes('--meta')) console.log(JSON.stringify(Object.fromEntries(Object.entries(figs).map(([id, f]) => [id, { w: f.w, h: f.h }]))));
console.log(`Author A figures: ${Object.keys(figs).length} written to ${OUT}`);
