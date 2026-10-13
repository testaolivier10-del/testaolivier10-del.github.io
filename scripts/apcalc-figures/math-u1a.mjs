/* Figures for AP® Calculus AB: the "Math you need" chapter (skills-math) and
   Unit 1 topics 1.1-1.6. Run:
     node scripts/apcalc-figures/math-u1a.mjs
   Writes calculus/figures/<id>.svg. Every graph is drawn by sampling the
   function it claims to show (the functions are written out below, next to
   each figure). Standalone SVG: white background, role="img", <title> and
   <desc>, Arial/Helvetica, ink #1F2A28, course crimson #8C1036 for emphasis,
   Okabe-Ito blue / green / vermillion for second curves. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'calculus', 'figures');
export const C = { ink: '#1F2A28', crim: '#8C1036', blue: '#0072B2', green: '#009E73', verm: '#D55E00',
  grid: '#E4E8E6', soft: '#5B6663', faint: '#9AA4A1', pale: '#F5F7F6', tint: '#FCE8EE', blueTint: '#E3F0F8' };
const r1 = v => Math.round(v * 10) / 10;
const esc = s => String(s).replace(/&(?![a-z#0-9]+;)/g, '&amp;');

/* Rich text: <i>..</i> italic, <b>..</b> bold, <sup>..</sup>, <sub>..</sub>.
   Output is tspans with explicit baseline shifts so it renders the same in
   every browser. */
function rich(s, size) {
  const out = [];
  let shift = 0;
  const parts = String(s).split(/(<\/?(?:i|b|sup|sub)>)/);
  let it = false, bold = false;
  for (const p of parts) {
    if (p === '<i>') { it = true; continue; } if (p === '</i>') { it = false; continue; }
    if (p === '<b>') { bold = true; continue; } if (p === '</b>') { bold = false; continue; }
    if (p === '<sup>') { const d = -0.42 * size; out.push({ dy: d - shift, sz: 0.72 }); shift = d; continue; }
    if (p === '<sub>') { const d = 0.25 * size; out.push({ dy: d - shift, sz: 0.72 }); shift = d; continue; }
    if (p === '</sup>' || p === '</sub>') { out.push({ dy: -shift, sz: 1 }); shift = 0; continue; }
    if (!p) continue;
    const last = out[out.length - 1];
    const seg = { text: p, it, bold };
    if (last && last.text === undefined) { Object.assign(last, seg); } else out.push({ ...seg, sz: last && last.sz !== undefined && last.text === undefined ? last.sz : (out.length && out[out.length - 1].sz) || 1 });
  }
  return out.map(o => {
    const a = [];
    if (o.dy) a.push(`dy="${r1(o.dy)}"`);
    if (o.sz && o.sz !== 1) a.push(`font-size="${r1(size * o.sz)}"`);
    if (o.it) a.push('font-style="italic"');
    if (o.bold) a.push('font-weight="bold"');
    return `<tspan ${a.join(' ')}>${esc(o.text ?? '​')}</tspan>`;
  }).join('');
}
export function text(x, y, s, o = {}) {
  const size = o.size || 15;
  const a = [`x="${r1(x)}"`, `y="${r1(y)}"`, `font-size="${size}"`, `fill="${o.color || C.ink}"`];
  if (o.anchor) a.push(`text-anchor="${o.anchor}"`);
  if (o.weight) a.push(`font-weight="${o.weight}"`);
  if (o.halo) a.push('paint-order="stroke" stroke="#FFFFFF" stroke-width="4" stroke-linejoin="round"');
  return `<text ${a.join(' ')}>${rich(s, size)}</text>`;
}
export const line = (x1, y1, x2, y2, color = C.ink, w = 2, dash) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${color}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linecap="round"/>`;
export function arrow(x1, y1, x2, y2, color = C.ink, o = {}) {
  const w = o.width || 2, head = o.head || 10, hw = o.headWidth || 5;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  const bx = x2 - ux * head, by = y2 - uy * head;
  return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(bx)}" y2="${r1(by)}" stroke="${color}" stroke-width="${w}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>` +
    `<polygon points="${r1(x2)},${r1(y2)} ${r1(bx - uy * hw)},${r1(by + ux * hw)} ${r1(bx + uy * hw)},${r1(by - ux * hw)}" fill="${color}"/>`;
}
const rect = (x, y, w, h, o = {}) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${o.rx ?? 6}" fill="${o.fill || '#FFFFFF'}" stroke="${o.stroke || C.faint}" stroke-width="${o.width ?? 1.2}"/>`;

/* A coordinate panel inside the pixel box { l, t, w, h }, showing x in X and
   y in Y. Curves are clipped to the box. */
let clipN = 0;
export function axes(box, X, Y, o = {}) {
  const sx = v => box.l + (v - X[0]) / (X[1] - X[0]) * box.w;
  const sy = v => box.t + (Y[1] - v) / (Y[1] - Y[0]) * box.h;
  const id = `clip${++clipN}`;
  const P = { box, X, Y, sx, sy, id, parts: [], late: [] };
  const add = s => { P.parts.push(s); return P; };
  const late = s => { P.late.push(s); return P; };
  const xt = o.xTicks || [], yt = o.yTicks || [];
  // grid
  if (o.grid !== false) {
    for (const v of (o.xGrid || xt)) add(line(sx(v), box.t, sx(v), box.t + box.h, C.grid, 1));
    for (const v of (o.yGrid || yt)) add(line(box.l, sy(v), box.l + box.w, sy(v), C.grid, 1));
  }
  const ax = Y[0] <= 0 && Y[1] >= 0 ? sy(0) : box.t + box.h;
  const ay = X[0] <= 0 && X[1] >= 0 ? sx(0) : box.l;
  P.ax = ax; P.ay = ay;
  // axes with arrowheads
  add(arrow(box.l - 4, ax, box.l + box.w + 12, ax, C.ink, { width: 1.5, head: 9, headWidth: 4.5 }));
  add(arrow(ay, box.t + box.h + 4, ay, box.t - 12, C.ink, { width: 1.5, head: 9, headWidth: 4.5 }));
  const fs = o.tickSize || 13;
  for (const v of xt) {
    if (Math.abs(v) < 1e-12 && ay !== box.l) continue;
    add(line(sx(v), ax - 4, sx(v), ax + 4, C.ink, 1.3));
    const lab = (o.xLabelFn || fmt)(v);
    if (lab !== null) late(text(sx(v), ax + 19, lab, { size: fs, anchor: 'middle', color: C.soft, halo: true }));
  }
  for (const v of yt) {
    if (Math.abs(v) < 1e-12 && ax !== box.t + box.h) continue;
    add(line(ay - 4, sy(v), ay + 4, sy(v), C.ink, 1.3));
    const lab = (o.yLabelFn || fmt)(v);
    if (lab !== null) late(text(ay - 8, sy(v) + 4.5, lab, { size: fs, anchor: 'end', color: C.soft, halo: true }));
  }
  if (o.xName) add(text(box.l + box.w + 14, ax + (o.xNameDy ?? -8), o.xName, { size: 16, anchor: 'end', weight: 'bold' }));
  if (o.yName) add(text(ay + 9, box.t - 2, o.yName, { size: 16, weight: 'bold' }));
  P.clipDef = `<clipPath id="${id}"><rect x="${box.l}" y="${box.t - 2}" width="${box.w}" height="${box.h + 4}"/></clipPath>`;
  P.add = add;
  /* Sample f on [a, b] and draw it; runs break where f is not finite or jumps. */
  P.curve = (f, a, b, c = {}) => {
    const n = c.n || 800, runs = []; let run = [], prev = null;
    const span = Y[1] - Y[0];
    for (let i = 0; i <= n; i++) {
      const x = a + (b - a) * i / n, y = f(x);
      if (!Number.isFinite(y) || Math.abs(y) > 1e4 * span) { if (run.length > 1) runs.push(run); run = []; prev = null; continue; }
      if (prev && Math.abs(y - prev) > span * (c.jump || 0.8)) { if (run.length > 1) runs.push(run); run = []; }
      run.push([x, y]); prev = y;
    }
    if (run.length > 1) runs.push(run);
    const d = runs.map(r => 'M' + r.map(p => `${r1(sx(p[0]))} ${r1(sy(Math.max(Y[0] - span, Math.min(Y[1] + span, p[1]))))}`).join('L')).join('');
    return add(`<path d="${d}" fill="none" stroke="${c.color || C.crim}" stroke-width="${c.width || 3}" stroke-linejoin="round" stroke-linecap="round"${c.dash ? ` stroke-dasharray="${c.dash}"` : ''} clip-path="url(#${id})"/>`);
  };
  P.seg = (x1, y1, x2, y2, color = C.ink, w = 2, dash) => add(line(sx(x1), sy(y1), sx(x2), sy(y2), color, w, dash));
  P.dot = (x, y, c = {}) => add(`<circle cx="${r1(sx(x))}" cy="${r1(sy(y))}" r="${c.r || 5.5}" fill="${c.open ? '#FFFFFF' : (c.color || C.crim)}" stroke="${c.color || C.crim}" stroke-width="${c.open ? 2.4 : 1.5}"/>`);
  P.label = (x, y, s, c = {}) => add(text(sx(x) + (c.dx || 0), sy(y) + (c.dy || 0), s, { size: c.size || 15, anchor: c.anchor, color: c.color || C.ink, weight: c.weight, halo: c.halo !== false }));
  P.arrow = (x1, y1, x2, y2, color = C.ink, c = {}) => add(arrow(sx(x1), sy(y1), sx(x2), sy(y2), color, c));
  P.shade = (f, g, a, b, color = C.tint) => {
    const n = 200, top = [], bot = [];
    for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; top.push([sx(x), sy(f(x))]); bot.push([sx(x), sy(g(x))]); }
    return add(`<polygon points="${top.concat(bot.reverse()).map(p => `${r1(p[0])},${r1(p[1])}`).join(' ')}" fill="${color}" clip-path="url(#${id})"/>`);
  };
  P.svg = () => P.parts.join('') + P.late.join('');
  return P;
}
function fmt(v) { return String(+v.toPrecision(6)).replace('-', '−'); }

export function doc(id, w, h, title, desc, body, defs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="Arial, Helvetica, sans-serif">
<title id="${id}-t">${esc(title)}</title>
<desc id="${id}-d">${esc(desc)}</desc>
<defs>${defs}</defs>
<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body}
</svg>
`;
}
const range = (a, b, s = 1) => { const o = []; for (let v = a; v <= b + 1e-9; v += s) o.push(+v.toFixed(10)); return o; };
const PI = Math.PI;

/* ======================================================= figures */
export const FIGS = {};

/* math-functions: reading a piecewise graph.
   f(x) = (x + 2)^2 / 2 - 1 on [-4, 1);  f(x) = 6 - x on [1, 5]. */
FIGS['fn-reading-graph'] = () => {
  const W = 820, H = 470;
  const P = axes({ l: 70, t: 40, w: 400, h: 340 }, [-4.6, 5.6], [-2.2, 6.4], { xTicks: range(-4, 5), yTicks: range(-2, 6), xName: '<i>x</i>', yName: '<i>y</i>' });
  const f1 = x => (x + 2) ** 2 / 2 - 1, f2 = x => 6 - x;
  P.curve(f1, -4, 1); P.curve(f2, 1, 5);
  P.dot(-4, f1(-4)); P.dot(1, f1(1), { open: true }); P.dot(1, 5); P.dot(5, 1);
  P.label(1, 5, '(1, 5)', { dx: 10, dy: -8, weight: 'bold', color: C.crim });
  P.label(1, 3.5, 'open dot', { dx: 12, dy: 5, size: 14, color: C.soft, weight: 'bold' });
  P.seg(1, 0, 1, 5, C.blue, 1.6, '5 5');
  P.label(-3.9, 3.2, '<i>y</i> = <i>f</i>(<i>x</i>)', { color: C.crim, weight: 'bold', size: 17 });
  // domain bracket under the axis
  const yb = P.box.t + P.box.h + 30;
  P.add(line(P.sx(-4), yb, P.sx(5), yb, C.blue, 2.5) + line(P.sx(-4), yb - 6, P.sx(-4), yb + 6, C.blue, 2.5) + line(P.sx(5), yb - 6, P.sx(5), yb + 6, C.blue, 2.5));
  P.add(text(P.sx(0.5), yb + 22, 'domain: −4 ≤ <i>x</i> ≤ 5', { size: 14, anchor: 'middle', color: C.blue, weight: 'bold' }));
  const notes = [
    ['<b>Read <i>f</i>(1):</b> go to <i>x</i> = 1 and find', 'the <b>filled</b> dot. <i>f</i>(1) = 5.'],
    ['<b>Open dot:</b> the curve comes close to', '(1, 3.5), but that point is not on the graph.'],
    ['<b>Range:</b> the lowest output is −1 (at', '<i>x</i> = −2), the highest is 5. Range: [−1, 5].'],
    ['<b>Solve <i>f</i>(<i>x</i>) = 1:</b> draw <i>y</i> = 1 across;', 'it meets the graph at <i>x</i> = −4, 0 and 5.'],
  ];
  let y = 70;
  let side = '';
  for (const [a, b] of notes) { side += rect(500, y - 22, 306, 64, { fill: C.pale, stroke: C.grid }) + text(512, y, a, { size: 14 }) + text(512, y + 22, b, { size: 14 }); y += 82; }
  P.seg(-4.6, 1, 5.6, 1, C.green, 1.6, '3 5'); for (const x of [-4, 0, 5]) P.dot(x, 1, { color: C.green, r: 4.5 });
  return doc('fn-reading-graph', W, H, 'Reading a piecewise graph', 'Graph of a piecewise function f on the domain from x = -4 to x = 5. On the left, a parabola piece starts at the filled point (-4, 1), dips to its lowest point (-2, -1) and rises toward an open circle at (1, 3.5). On the right, a straight line starts at the filled point (1, 5) and falls to the filled point (5, 1). So f(1) = 5, the range is from -1 to 5, and the horizontal line y = 1 meets the graph at x = -4, x = 0 and x = 5.',
    P.svg() + side, P.clipDef);
};

/* math-functions: shifting y = x^2 to y = (x - 2)^2 + 1. */
FIGS['fn-shifts'] = () => {
  const W = 640, H = 420;
  const P = axes({ l: 60, t: 34, w: 520, h: 330 }, [-3.4, 5.4], [-1.4, 7.4], { xTicks: range(-3, 5), yTicks: range(-1, 7), xName: '<i>x</i>', yName: '<i>y</i>' });
  P.curve(x => x * x, -3.4, 3.4, { color: C.blue, dash: '8 6', width: 2.6 });
  P.curve(x => (x - 2) ** 2 + 1, -1.4, 5.4);
  P.dot(0, 0, { color: C.blue }); P.dot(2, 1);
  P.arrow(0.15, 0, 1.85, 0, C.ink, { width: 2.2 }); P.arrow(2, 0.1, 2, 0.85, C.ink, { width: 2.2 });
  P.label(0.8, 0, 'right 2', { dy: -10, anchor: 'middle', size: 14, weight: 'bold' });
  P.label(2, 0.62, 'up 1', { dx: -8, dy: 5, anchor: 'end', size: 14, weight: 'bold' });
  P.label(-2.55, 6.5, '<i>y</i> = <i>x</i><sup>2</sup>', { anchor: 'end', color: C.blue, weight: 'bold', size: 16 });
  P.label(3.9, 2.4, '<i>y</i> = (<i>x</i> − 2)<sup>2</sup> + 1', { anchor: 'start', color: C.crim, weight: 'bold', size: 16 });
  P.label(0, 0, '(0, 0)', { dx: -8, dy: 20, anchor: 'end', size: 14, color: C.blue, weight: 'bold' });
  P.label(2, 1, '(2, 1)', { dx: 12, dy: 24, size: 14, color: C.crim, weight: 'bold' });
  return doc('fn-shifts', W, H, 'Shifting a graph', 'The dashed blue parabola y = x squared has its lowest point at (0, 0). The solid crimson parabola y = (x - 2) squared + 1 is the same shape moved 2 units right and 1 unit up, so its lowest point is (2, 1). Arrows show the shift right 2 and up 1.', P.svg(), P.clipDef);
};

/* math-exponent-rules: y = x^2, x^(1/2), x^(-1) for x > 0, all through (1, 1). */
FIGS['powers-of-x'] = () => {
  const W = 640, H = 420;
  const P = axes({ l: 60, t: 34, w: 520, h: 330 }, [0, 4.4], [0, 4.4], { xTicks: range(0, 4), yTicks: range(0, 4), xName: '<i>x</i>', yName: '<i>y</i>' });
  P.curve(x => x * x, 0, 2.2, { color: C.green });
  P.curve(x => Math.sqrt(x), 0, 4.4, { color: C.blue });
  P.curve(x => 1 / x, 0.2, 4.4, { color: C.crim });
  P.dot(1, 1, { color: C.ink });
  P.label(1, 1, '(1, 1)', { dx: 16, dy: 34, size: 14, weight: 'bold' });
  P.label(2.08, 4.25, '<i>y</i> = <i>x</i><sup>2</sup>', { dx: 8, color: C.green, weight: 'bold', size: 16 });
  P.label(4.35, 2.05, '<i>y</i> = <i>x</i><sup>1/2</sup> = √<i>x</i>', { anchor: 'end', dy: -12, color: C.blue, weight: 'bold', size: 16 });
  P.label(4.35, 0.25, '<i>y</i> = <i>x</i><sup>−1</sup> = 1/<i>x</i>', { anchor: 'end', dy: -10, color: C.crim, weight: 'bold', size: 16 });
  P.label(0.45, 2.3, 'roots and reciprocals', { size: 13, color: C.soft });
  P.label(0.45, 2.3, 'are powers too', { dy: 17, size: 13, color: C.soft });
  return doc('powers-of-x', W, H, 'Three powers of x', 'For x greater than 0: the green curve y = x squared rises steeply, the blue curve y = x to the one-half power (the square root of x) rises slowly, and the crimson curve y = x to the negative one power (1 over x) falls toward the x-axis. All three pass through the point (1, 1), because 1 to any power is 1.', P.svg(), P.clipDef);
};

/* change-at-an-instant: s(t) = 16t^2 feet; lines through P(1, 16) and Q at
   t = 2, 1.5, 1.2, then the line of slope 32. */
FIGS['instant-chords'] = () => {
  const W = 800, H = 450;
  const s = t => 16 * t * t;
  const P = axes({ l: 70, t: 40, w: 420, h: 340 }, [0, 2.25], [0, 76], { xTicks: [0, 0.5, 1, 1.5, 2], yTicks: range(0, 70, 10), xName: '<i>t</i> (s)', yName: 'distance fallen (ft)', xNameDy: 34 });
  const cols = [C.blue, C.green, C.verm];
  [2, 1.5, 1.2].forEach((b, i) => { const m = (s(b) - s(1)) / (b - 1); P.curve(t => 16 + m * (t - 1), 0.55, Math.min(2.25, b + 0.12), { color: cols[i], width: 2, n: 4 }); P.dot(b, s(b), { color: cols[i], r: 4.5 }); });
  P.curve(t => 16 + 32 * (t - 1), 0.5, 2.25, { color: C.ink, width: 2, dash: '7 5', n: 4 });
  P.curve(s, 0, 2.25, { width: 3.4 });
  P.dot(1, 16, { r: 6 });
  P.label(1, 16, '<i>P</i> (1, 16)', { dx: 10, dy: 20, weight: 'bold', color: C.crim });
  P.label(2, 64, 'slope 48', { dx: -10, dy: -4, anchor: 'end', color: C.blue, size: 14, weight: 'bold' });
  P.label(1.5, 36, 'slope 40', { dx: -10, dy: -6, anchor: 'end', color: C.green, size: 14, weight: 'bold' });
  P.label(1.2, s(1.2), 'slope 35.2', { dx: 10, dy: 22, color: C.verm, size: 14, weight: 'bold' });
  P.label(2.2, 37, 'slope 32', { anchor: 'end', size: 14, weight: 'bold' });
  P.label(0.15, 64, '<i>s</i>(<i>t</i>) = 16<i>t</i><sup>2</sup>', { color: C.crim, weight: 'bold', size: 17 });
  // table of average rates
  let tb = rect(530, 40, 250, 300, { fill: C.pale, stroke: C.grid });
  tb += text(655, 68, 'Average speed from <i>t</i> = 1', { size: 15, anchor: 'middle', weight: 'bold' });
  tb += text(560, 98, 'interval', { size: 14, weight: 'bold', color: C.soft }) + text(750, 98, 'ft/s', { size: 14, anchor: 'end', weight: 'bold', color: C.soft });
  tb += line(548, 106, 762, 106, C.faint, 1);
  const rows = [['[1, 2]', '48', C.blue], ['[1, 1.5]', '40', C.green], ['[1, 1.2]', '35.2', C.verm], ['[1, 1.1]', '33.6', C.ink], ['[1, 1.01]', '32.16', C.ink], ['[1, 1.001]', '32.016', C.ink]];
  rows.forEach(([a, b, c], i) => { tb += text(560, 132 + i * 28, a, { size: 15, color: c }) + text(750, 132 + i * 28, b, { size: 15, anchor: 'end', color: c, weight: 'bold' }); });
  tb += line(548, 308, 762, 308, C.faint, 1) + text(655, 330, 'closing in on 32 ft/s', { size: 15, anchor: 'middle', weight: 'bold', color: C.crim });
  tb += text(655, 400, 'Shrink the interval: the average', { size: 14, anchor: 'middle', color: C.soft }) + text(655, 420, 'speeds settle on one number.', { size: 14, anchor: 'middle', color: C.soft });
  return doc('instant-chords', W, H, 'Average speeds closing in on an instant', 'A stone falls s(t) = 16t squared feet in t seconds. The crimson curve is s. Lines join the point P (1, 16) to points on the curve at t = 2, 1.5 and 1.2; their slopes, the average speeds, are 48, 40 and 35.2 feet per second. A dashed line through P has slope 32. A table lists average speeds over [1, 2], [1, 1.5], [1, 1.2], [1, 1.1], [1, 1.01] and [1, 1.001]: 48, 40, 35.2, 33.6, 32.16 and 32.016, closing in on 32 feet per second.',
    P.svg() + tb, P.clipDef);
};

/* limit-notation: g(x) = 6 - (x - 4)^2 / 2 for x != 2, g(2) = 1. */
FIGS['limit-vs-value'] = () => {
  const W = 760, H = 430;
  const g = x => 6 - (x - 4) ** 2 / 2;
  const P = axes({ l: 70, t: 36, w: 420, h: 340 }, [-0.4, 6.4], [-2.4, 7], { xTicks: range(0, 6), yTicks: range(-2, 6), xName: '<i>x</i>', yName: '<i>y</i>' });
  P.seg(-0.4, 4, 2, 4, C.blue, 1.6, '6 5'); P.seg(2, 0, 2, 4, C.faint, 1.4, '4 4');
  P.curve(g, -0.4, 6.4);
  P.dot(2, 4, { open: true }); P.dot(2, 1);
  P.arrow(0.75, g(0.75) - 0.5, 1.6, g(1.6) - 0.55, C.ink, { width: 2.4 });
  P.arrow(3.15, g(3.15) + 0.4, 2.4, g(2.4) + 0.5, C.ink, { width: 2.4 });
  P.label(2, 4, 'hole at (2, 4)', { dx: -10, dy: -18, anchor: 'end', size: 14, weight: 'bold' });
  P.label(2, 1, '<i>g</i>(2) = 1', { dx: 10, dy: 5, weight: 'bold', color: C.crim });
  P.label(5.3, g(5.3), '<i>y</i> = <i>g</i>(<i>x</i>)', { dx: 6, dy: -12, weight: 'bold', color: C.crim });
  let side = rect(520, 60, 226, 120, { fill: C.blueTint, stroke: C.grid });
  side += text(534, 88, '<b>The limit</b> (where the', { size: 15 }) + text(534, 110, 'outputs head):', { size: 15 });
  side += text(633, 150, 'lim <i>g</i>(<i>x</i>) = 4', { size: 20, anchor: 'middle', weight: 'bold', color: C.blue });
  side += text(633, 168, '<i>x</i> → 2', { size: 12, anchor: 'middle', color: C.blue });
  side += rect(520, 210, 226, 110, { fill: C.tint, stroke: C.grid });
  side += text(534, 238, '<b>The value</b> (the filled', { size: 15 }) + text(534, 260, 'dot at <i>x</i> = 2):', { size: 15 });
  side += text(633, 298, '<i>g</i>(2) = 1', { size: 20, anchor: 'middle', weight: 'bold', color: C.crim });
  side += text(633, 356, 'Different numbers. The limit', { size: 14, anchor: 'middle', color: C.soft }) + text(633, 376, 'ignores what happens at <i>x</i> = 2.', { size: 14, anchor: 'middle', color: C.soft });
  return doc('limit-vs-value', W, H, 'A limit is not the same as a value', 'A crimson curve y = g(x) rises toward an open circle at (2, 4) from both sides, with arrows showing the outputs heading to 4. The function value at x = 2 is a separate filled dot at (2, 1). So the limit of g(x) as x approaches 2 is 4, while g(2) = 1.', P.svg() + side, P.clipDef);
};

/* limits-from-plots: four small graphs near x = 1. */
FIGS['limit-four-cases'] = () => {
  const W = 800, H = 590;
  let body = '', defs = '';
  const panels = [
    { l: 30, t: 54, title: 'A hole: the limit is 2', sub: 'the value f(1) = 3 does not change it' },
    { l: 410, t: 54, title: 'A jump: no limit', sub: 'from the left 1, from the right 3' },
    { l: 30, t: 320, title: 'Unbounded: no limit', sub: 'the outputs grow without bound' },
    { l: 410, t: 320, title: 'Oscillating: no limit', sub: 'the outputs never settle on one number' },
  ];
  const mk = (i, Y) => axes({ l: panels[i].l + 34, t: panels[i].t + 70, w: 290, h: 160 }, [-0.6, 3.1], Y, { xTicks: [1, 2, 3], yTicks: Y[1] > 5 ? [2, 4, 6] : [1, 2, 3, 4], xName: '<i>x</i>', tickSize: 12 });
  // (a) f(x) = 1 + x^2/... with a hole at (1, 2), f(1) = 3: f(x) = 2 + (x - 1) - 0.4(x - 1)^2
  let P = mk(0, [-0.4, 4.4]);
  P.curve(x => 2 + (x - 1) - 0.4 * (x - 1) ** 2, -0.6, 3.1); P.dot(1, 2, { open: true }); P.dot(1, 3);
  body += P.svg(); defs += P.clipDef;
  // (b) jump: 1 + 0.3(x-1) on x<1, 3 + 0.3(x-1) on x >= 1
  P = mk(1, [-0.4, 4.4]);
  P.curve(x => 1 + 0.4 * (x - 1), -0.6, 1); P.curve(x => 3 + 0.4 * (x - 1), 1, 3.1);
  P.dot(1, 1, { open: true }); P.dot(1, 3);
  body += P.svg(); defs += P.clipDef;
  // (c) unbounded: 0.5 / (x - 1)^2
  P = mk(2, [-0.6, 7]);
  P.add(line(P.sx(1), P.box.t, P.sx(1), P.box.t + P.box.h, C.faint, 1.4, '5 5'));
  P.curve(x => 0.5 / (x - 1) ** 2, -0.6, 0.995, { n: 1200 }); P.curve(x => 0.5 / (x - 1) ** 2, 1.005, 3.1, { n: 1200 });
  body += P.svg(); defs += P.clipDef;
  // (d) oscillating: 2 + sin(1 / (x - 1))
  P = mk(3, [-0.4, 4.4]);
  const osc = x => 2 + Math.sin(1 / (x - 1));
  P.curve(osc, -0.6, 0.9985, { n: 16000, width: 1.6, jump: 3 }); P.curve(osc, 1.0015, 3.1, { n: 16000, width: 1.6, jump: 3 });
  body += P.svg(); defs += P.clipDef;
  panels.forEach(p => { body = rect(p.l, p.t, 360, 252, { fill: 'none', stroke: C.grid, rx: 10 }) + body; body += text(p.l + 16, p.t + 24, p.title, { size: 16, weight: 'bold', color: C.crim }) + text(p.l + 16, p.t + 44, p.sub, { size: 14, color: C.soft }); });
  body += text(400, 32, 'Four ways a graph can behave as x approaches 1', { size: 18, anchor: 'middle', weight: 'bold' });
  return doc('limit-four-cases', W, H, 'Four behaviors near x = 1', 'Four small graphs near x = 1. First: a curve with an open circle at (1, 2) and a separate filled dot at (1, 3); the limit is 2 and the value 3 does not change it. Second: the graph jumps, approaching 1 from the left (open circle) and 3 from the right (filled dot); the one-sided limits differ, so there is no limit. Third: both sides shoot upward without bound beside a dashed vertical line at x = 1; no limit. Fourth: the graph wiggles faster and faster between 1 and 3 near x = 1 and never settles; no limit.', body, defs);
};

/* limits-from-tables: f(x) = (sqrt(x + 2) - 2) / (x - 2), hole at (2, 1/4). */
FIGS['table-zoom'] = () => {
  const W = 800, H = 450;
  const f = x => (Math.sqrt(x + 2) - 2) / (x - 2);
  const A = axes({ l: 60, t: 50, w: 300, h: 260 }, [-2.2, 8.4], [-0.02, 0.62], { xTicks: [-2, 2, 4, 6, 8], yTicks: [0.1, 0.2, 0.3, 0.4, 0.5], xName: '<i>x</i>', yName: '<i>y</i>', tickSize: 12 });
  A.curve(f, -2, 8.4); A.dot(2, 0.25, { open: true }); A.dot(-2, f(-2));
  A.add(rect(A.sx(1.6), A.sy(0.29), A.sx(2.4) - A.sx(1.6), A.sy(0.21) - A.sy(0.29), { fill: 'none', stroke: C.blue, width: 2, rx: 2 }));
  A.label(6.2, f(6.2), '<i>y</i> = <i>f</i>(<i>x</i>)', { dy: -14, weight: 'bold', color: C.crim });
  const B = axes({ l: 450, t: 50, w: 320, h: 260 }, [1.85, 2.15], [0.244, 0.256], { xTicks: [1.9, 1.95, 2, 2.05, 2.1], yTicks: [0.246, 0.248, 0.25, 0.252, 0.254], tickSize: 12, xName: '<i>x</i>' });
  B.curve(f, 1.85, 2.15); B.dot(2, 0.25, { open: true });
  for (const x of [1.9, 1.99, 2.01, 2.1]) B.dot(x, f(x), { color: C.blue, r: 4.5 });
  B.seg(1.85, 0.25, 1.99, 0.25, C.blue, 1.4, '5 5');
  B.label(2, 0.25, '(2, 0.25)?', { dx: 10, dy: -12, size: 14, weight: 'bold' });
  let body = A.svg() + B.svg();
  body += rect(450, 50, 320, 260, { fill: 'none', stroke: C.blue, width: 2, rx: 2 });
  body += line(A.sx(2.4), A.sy(0.29), 450, 50, C.blue, 1.2, '4 4') + line(A.sx(2.4), A.sy(0.21), 450, 310, C.blue, 1.2, '4 4');
  body += text(210, 32, 'The whole graph', { size: 15, anchor: 'middle', weight: 'bold' }) + text(610, 32, 'Zoomed in near x = 2', { size: 15, anchor: 'middle', weight: 'bold', color: C.blue });
  // table strip
  const xs = ['1.9', '1.99', '1.999', '2', '2.001', '2.01', '2.1'];
  const ys = xs.map(s => s === '2' ? 'undefined' : f(+s).toFixed(6));
  const tx = 60, ty = 350, cw = 90;
  let tb = rect(tx, ty, 710, 74, { fill: C.pale, stroke: C.grid });
  tb += text(tx + 14, ty + 28, '<i>x</i>', { size: 15, weight: 'bold' }) + text(tx + 14, ty + 58, '<i>f</i>(<i>x</i>)', { size: 15, weight: 'bold' });
  xs.forEach((x, i) => { const cx = tx + 70 + i * cw + cw / 2 - 12; tb += text(cx, ty + 28, x, { size: 14, anchor: 'middle', color: x === '2' ? C.crim : C.ink }) + text(cx, ty + 58, ys[i], { size: 14, anchor: 'middle', color: x === '2' ? C.crim : C.blue, weight: 'bold' }); });
  tb += line(tx + 60, ty + 38, tx + 700, ty + 38, C.faint, 1);
  return doc('table-zoom', W, H, 'A table of values closing in on x = 2', 'Left: the graph of f(x) = (square root of (x + 2) minus 2) divided by (x - 2), a slowly falling curve with an open circle at (2, 0.25). A blue box marks the region near x = 2. Right: that region zoomed in, with blue dots at x = 1.9, 1.99, 2.01 and 2.1 sitting on the curve on both sides of the open circle at height 0.25. Below, a table: x = 1.9, 1.99, 1.999 give f(x) = 0.251582, 0.250156, 0.250016; x = 2 is undefined; x = 2.001, 2.01, 2.1 give 0.249984, 0.249844, 0.248457. Both sides close in on 0.25.', body + tb, A.clipDef + B.clipDef);
};

/* limit-laws: f and g near x = 2 and their sum.
   f(x) = 3 + (x - 2) - 0.3(x - 2)^2, g(x) = -1 + 0.5(x - 2)^2 - 0.5(x - 2). */
FIGS['limit-laws-sum'] = () => {
  const W = 760, H = 430;
  const f = x => 3 + (x - 2) - 0.3 * (x - 2) ** 2, g = x => -1 + 0.5 * (x - 2) ** 2 - 0.5 * (x - 2), h = x => f(x) + g(x);
  const P = axes({ l: 60, t: 36, w: 440, h: 340 }, [-0.3, 4.2], [-2.4, 5.2], { xTicks: range(0, 4), yTicks: range(-2, 5), xName: '<i>x</i>', yName: '<i>y</i>' });
  P.seg(2, -2.4, 2, 5.2, C.faint, 1.3, '4 5');
  P.curve(f, -0.3, 4.2); P.curve(g, -0.3, 4.2, { color: C.blue }); P.curve(h, -0.3, 4.2, { color: C.green, dash: '9 6' });
  P.dot(2, 3); P.dot(2, -1, { color: C.blue }); P.dot(2, 2, { color: C.green });
  P.label(3.3, f(3.3), '<i>f</i>', { dy: -12, anchor: 'middle', color: C.crim, weight: 'bold', size: 19 });
  P.label(3.6, g(3.6), '<i>g</i>', { dy: 26, anchor: 'middle', color: C.blue, weight: 'bold', size: 19 });
  P.label(4.1, h(4.1), '<i>f</i> + <i>g</i>', { dx: -10, dy: -2, anchor: 'end', color: C.green, weight: 'bold', size: 19 });
  P.label(2, 3, '3', { dx: -10, dy: -8, anchor: 'end', color: C.crim, weight: 'bold' });
  P.label(2, -1, '−1', { dx: 10, dy: 20, color: C.blue, weight: 'bold' });
  P.label(2, 2, '2', { dx: -10, dy: 18, anchor: 'end', color: C.green, weight: 'bold' });
  let side = rect(525, 60, 220, 250, { fill: C.pale, stroke: C.grid });
  const L = [['As <i>x</i> → 2:', C.ink, true], ['<i>f</i>(<i>x</i>) → 3', C.crim], ['<i>g</i>(<i>x</i>) → −1', C.blue], ['<i>f</i>(<i>x</i>) + <i>g</i>(<i>x</i>) → 3 + (−1) = 2', C.green], ['<i>f</i>(<i>x</i>) · <i>g</i>(<i>x</i>) → 3 · (−1) = −3', C.ink], ['5<i>f</i>(<i>x</i>) → 5 · 3 = 15', C.ink]];
  L.forEach(([s, c, b], i) => { side += text(540, 92 + i * 38, s, { size: 15, color: c, weight: b || i ? 'bold' : undefined }); });
  side += text(635, 350, 'Each law turns one hard limit', { size: 14, anchor: 'middle', color: C.soft }) + text(635, 370, 'into limits you already know.', { size: 14, anchor: 'middle', color: C.soft });
  return doc('limit-laws-sum', W, H, 'The sum law on a graph', 'Three curves near x = 2. The crimson curve f approaches 3, the blue curve g approaches -1, and the dashed green curve f + g approaches 2, which is 3 + (-1). A panel lists the laws: as x approaches 2, f(x) approaches 3, g(x) approaches -1, f(x) + g(x) approaches 2, f(x) times g(x) approaches -3, and 5f(x) approaches 15.', P.svg() + side, P.clipDef);
};

/* limit-algebra: (x^2 - 9)/(x - 3) is the line y = x + 3 with a hole at (3, 6). */
FIGS['factor-hole'] = () => {
  const W = 760, H = 430;
  const P = axes({ l: 60, t: 36, w: 400, h: 340 }, [-1.4, 5.6], [-0.6, 9.4], { xTicks: range(-1, 5), yTicks: range(0, 9), xName: '<i>x</i>', yName: '<i>y</i>' });
  P.seg(3, 0, 3, 6, C.faint, 1.4, '4 4'); P.seg(-1.4, 6, 3, 6, C.blue, 1.4, '6 5');
  P.curve(x => (x * x - 9) / (x - 3), -1.4, 5.6, { n: 401 });
  P.dot(3, 6, { open: true });
  P.label(3, 6, 'hole at (3, 6)', { dx: 12, dy: 18, weight: 'bold', size: 14 });
  P.label(1.3, 1.3, '<i>y</i> = (<i>x</i><sup>2</sup> − 9)/(<i>x</i> − 3)', { weight: 'bold', color: C.crim, size: 16 });
  let side = rect(490, 50, 256, 270, { fill: C.pale, stroke: C.grid });
  const st = ['(<i>x</i><sup>2</sup> − 9) / (<i>x</i> − 3)', '= (<i>x</i> − 3)(<i>x</i> + 3) / (<i>x</i> − 3)', '= <i>x</i> + 3,  for <i>x</i> ≠ 3'];
  side += text(505, 80, '<b>Factor, then cancel</b>', { size: 15, color: C.crim });
  st.forEach((s, i) => { side += text(505, 116 + i * 34, s, { size: 15 }); });
  side += line(505, 214, 732, 214, C.faint, 1);
  side += text(505, 242, 'Same graph as <i>y</i> = <i>x</i> + 3,', { size: 14 }) + text(505, 262, 'except one missing point.', { size: 14 });
  side += text(505, 296, 'Limit at <i>x</i> = 3:  3 + 3 = 6', { size: 15, weight: 'bold', color: C.blue });
  return doc('factor-hole', W, H, 'A rational function that is a line with a hole', 'The graph of y = (x squared minus 9) divided by (x minus 3) is the straight line y = x + 3 with an open circle at (3, 6), because the function is undefined at x = 3. A panel shows the algebra: factor x squared minus 9 as (x - 3)(x + 3), cancel x - 3 for x not equal to 3, and get x + 3, so the limit at x = 3 is 6.', P.svg() + side, P.clipDef);
};

/* math-limit-algebra: (sqrt(x) - 2)/(x - 4) = 1/(sqrt(x) + 2) for x != 4. */
FIGS['rationalize-hole'] = () => {
  const W = 760, H = 430;
  const f = x => (Math.sqrt(x) - 2) / (x - 4);
  const P = axes({ l: 70, t: 36, w: 400, h: 330 }, [-0.6, 12.6], [-0.03, 0.62], { xTicks: range(0, 12, 2), yTicks: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6], xName: '<i>x</i>', yName: '<i>y</i>' });
  P.seg(4, 0, 4, 0.25, C.faint, 1.4, '4 4'); P.seg(0, 0.25, 4, 0.25, C.blue, 1.4, '6 5');
  P.curve(f, 0, 12.6); P.dot(0, 0.5); P.dot(4, 0.25, { open: true });
  P.label(4, 0.25, 'hole at (4, 1/4)', { dx: 12, dy: -12, weight: 'bold', size: 14 });
  P.label(12.4, 0.31, '<i>y</i> = (√<i>x</i> − 2)/(<i>x</i> − 4)', { anchor: 'end', weight: 'bold', color: C.crim, size: 15 });
  let side = rect(500, 44, 248, 300, { fill: C.pale, stroke: C.grid });
  side += text(514, 74, '<b>Multiply by the conjugate</b>', { size: 15, color: C.crim });
  const st = ['(√<i>x</i> − 2)/(<i>x</i> − 4) · (√<i>x</i> + 2)/(√<i>x</i> + 2)', '= (<i>x</i> − 4) / ((<i>x</i> − 4)(√<i>x</i> + 2))', '= 1/(√<i>x</i> + 2),  <i>x</i> ≠ 4'];
  side += text(514, 108, st[0], { size: 13.5 }) + text(514, 144, st[1], { size: 14.5 }) + text(514, 180, st[2], { size: 14.5 });
  side += line(514, 204, 734, 204, C.faint, 1);
  side += text(514, 232, 'Top: (√<i>x</i>)<sup>2</sup> − 2<sup>2</sup> = <i>x</i> − 4.', { size: 14 });
  side += text(514, 262, 'Near <i>x</i> = 4 the outputs head to', { size: 14 }) + text(514, 284, '1/(√4 + 2) = 1/4.', { size: 15, weight: 'bold', color: C.blue });
  return doc('rationalize-hole', W, H, 'Rationalizing reveals the hidden value', 'The graph of y = (square root of x minus 2) divided by (x minus 4), for x from 0 to 12, starts at the filled point (0, 0.5) and falls slowly, with an open circle at (4, 1/4) where the function is undefined. A panel shows the algebra: multiply top and bottom by the conjugate, square root of x plus 2; the top becomes x minus 4, which cancels, leaving 1 over (square root of x plus 2), whose value at x = 4 is 1/4.', P.svg() + side, P.clipDef);
};

/* math-trig: the unit circle, first-quadrant special angles and signs. */
FIGS['unit-circle'] = () => {
  const W = 840, H = 560;
  const cx = 300, cy = 285, R = 210;
  const X = v => cx + v * R, Y = v => cy - v * R;
  let b = '';
  b += line(X(-1.22), cy, X(1.25), cy, C.ink, 1.5) + line(cx, Y(-1.22), cx, Y(1.22), C.ink, 1.5);
  b += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.ink}" stroke-width="2.4"/>`;
  b += text(X(1.25), cy - 10, '<i>x</i>', { size: 16, anchor: 'end', weight: 'bold' }) + text(cx + 8, Y(1.2), '<i>y</i>', { size: 16, weight: 'bold' });
  const ang = [[0, '0', '(1, 0)'], [PI / 6, 'π/6', '(√3/2, 1/2)'], [PI / 4, 'π/4', '(√2/2, √2/2)'], [PI / 3, 'π/3', '(1/2, √3/2)'], [PI / 2, 'π/2', '(0, 1)']];
  for (const [t, lab, co] of ang) {
    const x = Math.cos(t), y = Math.sin(t);
    if (t > 0 && t < PI / 2) b += line(cx, cy, X(x), Y(y), C.faint, 1.3, '5 4');
    b += `<circle cx="${r1(X(x))}" cy="${r1(Y(y))}" r="5.5" fill="${C.crim}"/>`;
    const ox = t === PI / 2 ? 10 : 12, oy = t === 0 ? 24 : t === PI / 2 ? -10 : -4;
    b += text(X(x) + ox, Y(y) + oy, co, { size: 14.5, weight: 'bold', color: C.crim, halo: true });
    const lr = 0.8;
    if (t > 0 && t < PI / 2) b += text(X(lr * Math.cos(t)) + 6, Y(lr * Math.sin(t)) + 4, lab, { size: 14, color: C.blue, weight: 'bold', halo: true });
  }
  // other axis points
  b += `<circle cx="${X(-1)}" cy="${cy}" r="5.5" fill="${C.crim}"/>` + text(X(-1) - 8, cy - 10, '(−1, 0)  π', { size: 14.5, anchor: 'end', weight: 'bold', color: C.crim, halo: true });
  b += `<circle cx="${cx}" cy="${Y(-1)}" r="5.5" fill="${C.crim}"/>` + text(cx + 10, Y(-1) + 22, '(0, −1)  3π/2', { size: 14.5, weight: 'bold', color: C.crim, halo: true });
  b += text(cx - 10, Y(1) - 10, 'π/2', { size: 14, anchor: 'end', color: C.blue, weight: 'bold' });
  b += text(X(1) + 12, cy + 44, '0 or 2π', { size: 14, color: C.blue, weight: 'bold' });
  b += text(X(0.38), Y(0.05), 'sin +, cos +', { size: 14, color: C.soft });
  // quadrant signs
  b += text(X(-0.55), Y(0.5), 'sin +, cos −', { size: 14, anchor: 'middle', color: C.soft });
  b += text(X(-0.55), Y(-0.5), 'sin −, cos −', { size: 14, anchor: 'middle', color: C.soft });
  b += text(X(0.55), Y(-0.5), 'sin −, cos +', { size: 14, anchor: 'middle', color: C.soft });
  // general angle theta = 2.3 rad drawn in Q2? keep: a general point label
  let side = rect(620, 40, 206, 230, { fill: C.pale, stroke: C.grid });
  side += text(634, 70, '<b>On the unit circle</b>', { size: 15, color: C.crim });
  side += text(634, 100, 'The point at angle θ is', { size: 14 }) + text(634, 124, '(cos θ, sin θ).', { size: 15, weight: 'bold' });
  side += text(634, 158, 'cos θ = the <i>x</i>-coordinate', { size: 14 }) + text(634, 182, 'sin θ = the <i>y</i>-coordinate', { size: 14 });
  side += text(634, 214, 'tan θ = sin θ / cos θ', { size: 14 });
  side += text(634, 246, 'radius 1, angles in radians', { size: 13, color: C.soft });
  side += rect(620, 300, 206, 120, { fill: C.blueTint, stroke: C.grid });
  side += text(634, 328, '<b>Half the circle</b> is π radians', { size: 14 }) + text(634, 352, '(180°). A full turn is 2π.', { size: 14 });
  side += text(634, 384, 'Degrees to radians:', { size: 14 }) + text(634, 406, 'multiply by π/180.', { size: 14, weight: 'bold' });
  return doc('unit-circle', W, H, 'The unit circle', 'A circle of radius 1 centered at the origin. Points on it are marked at the angles 0, pi/6, pi/4, pi/3 and pi/2 radians with coordinates (1, 0), (square root 3 over 2, 1/2), (square root 2 over 2, square root 2 over 2), (1/2, square root 3 over 2) and (0, 1), and at pi and 3 pi/2 with coordinates (-1, 0) and (0, -1). The other quadrants are labelled with the signs of sine and cosine: second quadrant sine positive, cosine negative; third both negative; fourth sine negative, cosine positive. A panel says the point at angle theta is (cos theta, sin theta), and that pi radians is 180 degrees.', b + side);
};

/* math-trig: y = sin x and y = cos x on [-pi/2, 2pi]. */
FIGS['sin-cos-graphs'] = () => {
  const W = 760, H = 380;
  const piLab = v => { const k = Math.round(v / (PI / 2)); if (k === 0) return null; const m = { 1: 'π/2', 2: 'π', 3: '3π/2', 4: '2π', '-1': '−π/2' }; return m[k]; };
  const P = axes({ l: 50, t: 40, w: 670, h: 290 }, [-PI / 2 - 0.3, 2 * PI + 0.35], [-1.45, 1.45], { xTicks: [-PI / 2, PI / 2, PI, 3 * PI / 2, 2 * PI], yTicks: [-1, 1], xLabelFn: piLab, xName: '<i>x</i>', yName: '<i>y</i>', xGrid: [-PI / 2, 0, PI / 2, PI, 3 * PI / 2, 2 * PI], yGrid: [-1, 0, 1] });
  P.curve(Math.sin, -PI / 2 - 0.3, 2 * PI + 0.35); P.curve(Math.cos, -PI / 2 - 0.3, 2 * PI + 0.35, { color: C.blue, dash: '10 6' });
  P.dot(0, 0); P.dot(PI / 2, 1); P.dot(0, 1, { color: C.blue });
  P.label(PI / 2, 1, '<i>y</i> = sin <i>x</i>', { dy: -12, anchor: 'middle', color: C.crim, weight: 'bold', size: 16 });
  P.label(PI, -1, '<i>y</i> = cos <i>x</i>', { dy: 24, anchor: 'middle', color: C.blue, weight: 'bold', size: 16 });
  P.label(0, 1, '(0, 1)', { dx: 10, dy: -8, size: 14, color: C.blue });
  P.label(0, 0, '(0, 0)', { dx: 8, dy: 18, size: 14, color: C.crim });
  return doc('sin-cos-graphs', W, H, 'Graphs of sine and cosine', 'The crimson solid curve y = sin x and the blue dashed curve y = cos x for x from -pi/2 to 2 pi, both waves between -1 and 1 with period 2 pi. Sine passes through (0, 0) and peaks at (pi/2, 1); cosine starts at (0, 1). Cosine is sine shifted pi/2 to the left.', P.svg(), P.clipDef);
};

/* math-exp-log: y = e^x and y = ln x, mirror images across y = x. */
FIGS['exp-log-mirror'] = () => {
  const W = 640, H = 500;
  const P = axes({ l: 70, t: 30, w: 420, h: 420 }, [-3.2, 4.4], [-3.2, 4.4], { xTicks: range(-3, 4), yTicks: range(-3, 4), xName: '<i>x</i>', yName: '<i>y</i>' });
  P.curve(x => x, -3.2, 4.4, { color: C.faint, width: 1.6, dash: '6 6', n: 4 });
  P.curve(Math.exp, -3.2, 1.6); P.curve(Math.log, 0.02, 4.4, { color: C.blue, n: 2000 });
  P.dot(0, 1); P.dot(1, Math.E); P.dot(1, 0, { color: C.blue }); P.dot(Math.E, 1, { color: C.blue });
  P.label(0, 1, '(0, 1)', { dx: 10, dy: 22, size: 14, color: C.crim, weight: 'bold' });
  P.label(1, Math.E, '(1, <i>e</i>)', { dx: -10, dy: -2, anchor: 'end', size: 14, color: C.crim, weight: 'bold' });
  P.label(1, 0, '(1, 0)', { dx: 10, dy: 40, size: 14, color: C.blue, weight: 'bold' });
  P.label(Math.E, 1, '(<i>e</i>, 1)', { dx: 6, dy: 22, size: 14, color: C.blue, weight: 'bold' });
  P.label(1.3, 4.0, '<i>y</i> = <i>e</i><sup><i>x</i></sup>', { dx: -10, anchor: 'end', color: C.crim, weight: 'bold', size: 17 });
  P.label(4.3, Math.log(4.3), '<i>y</i> = ln <i>x</i>', { dy: -12, anchor: 'end', color: C.blue, weight: 'bold', size: 17 });
  P.label(-2.6, -2.6, '<i>y</i> = <i>x</i>', { dx: 8, dy: 4, color: C.soft, size: 14 });
  let side = rect(510, 60, 120, 200, { fill: C.pale, stroke: C.grid });
  side += text(522, 86, '<i>e</i> ≈ 2.718', { size: 15, weight: 'bold' });
  side += text(522, 118, 'ln undoes', { size: 14 }) + text(522, 138, '<i>e</i><sup><i>x</i></sup>: swap', { size: 14 }) + text(522, 160, 'each point’s', { size: 14 }) + text(522, 180, 'coordinates.', { size: 14 });
  side += text(522, 214, '<i>e</i><sup><i>x</i></sup> > 0', { size: 14, color: C.crim, weight: 'bold' }) + text(522, 240, 'ln <i>x</i>: <i>x</i> > 0', { size: 14, color: C.blue, weight: 'bold' });
  return doc('exp-log-mirror', W, H, 'y = e^x and y = ln x', 'The crimson curve y = e to the x passes through (0, 1) and (1, e), stays above the x-axis and rises steeply to the right. The blue curve y = ln x passes through (1, 0) and (e, 1), exists only for x greater than 0, and drops steeply near the y-axis. The two curves are mirror images across the dashed line y = x: each point (a, b) on one matches (b, a) on the other.', P.svg() + side, P.clipDef);
};

/* math-inverse-functions: f(x) = 0.5x^3 + 0.5x + 2 and its inverse, mirror
   images across y = x; (1, 3) and (3, 1); slopes 2 and 1/2 there. */
FIGS['inverse-reflect'] = () => {
  const W = 700, H = 520;
  const f = x => 0.5 * x ** 3 + 0.5 * x + 2;
  const P = axes({ l: 60, t: 30, w: 440, h: 440 }, [-3.6, 6.4], [-3.6, 6.4], { xTicks: range(-3, 6), yTicks: range(-3, 6), xName: '<i>x</i>', yName: '<i>y</i>' });
  P.curve(x => x, -3.6, 6.4, { color: C.faint, width: 1.6, dash: '6 6', n: 4 });
  P.curve(f, -2.4, 1.85);
  // inverse: draw the reflected points (f(t), t)
  const pts = []; for (let i = 0; i <= 600; i++) { const t = -2.4 + 4.25 * i / 600; pts.push([f(t), t]); }
  P.add(`<path d="M${pts.map(p => `${r1(P.sx(p[0]))} ${r1(P.sy(p[1]))}`).join('L')}" fill="none" stroke="${C.blue}" stroke-width="3" stroke-linejoin="round" clip-path="url(#${P.id})"/>`);
  P.seg(1, 3, 3, 1, C.faint, 1.3, '3 4');
  P.seg(0.45, 3 - 2 * 0.55, 1.55, 3 + 2 * 0.55, C.ink, 2.2); P.seg(3 - 1.1, 1 - 0.55, 3 + 1.1, 1 + 0.55, C.ink, 2.2);
  P.dot(1, 3); P.dot(3, 1, { color: C.blue });
  P.label(1, 3, '(1, 3)', { dx: -12, dy: -2, anchor: 'end', weight: 'bold', color: C.crim });
  P.label(3, 1, '(3, 1)', { dx: 8, dy: 22, weight: 'bold', color: C.blue });
  P.label(1.55, 4.1, 'slope 2', { dx: 8, size: 14, weight: 'bold' });
  P.label(4.3, 0.75, 'slope 1/2', { size: 14, weight: 'bold' });
  P.label(1.85, f(1.85), '<i>y</i> = <i>f</i>(<i>x</i>)', { dx: 8, dy: 6, color: C.crim, weight: 'bold', size: 17 });
  P.label(6.3, 2.35, '<i>y</i> = <i>f</i><sup>−1</sup>(<i>x</i>)', { anchor: 'end', color: C.blue, weight: 'bold', size: 17 });
  P.label(5.5, 6.0, '<i>y</i> = <i>x</i>', { dx: -14, anchor: 'end', color: C.soft, size: 14 });
  let side = rect(520, 60, 170, 230, { fill: C.pale, stroke: C.grid });
  side += text(532, 86, '<b><i>f</i>(1) = 3</b>, so', { size: 14 }) + text(532, 108, '<b><i>f</i><sup>−1</sup>(3) = 1</b>.', { size: 14 });
  side += text(532, 144, 'Swap <i>x</i> and <i>y</i>:', { size: 14 }) + text(532, 166, 'reflect across', { size: 14 }) + text(532, 188, 'the line <i>y</i> = <i>x</i>.', { size: 14 });
  side += text(532, 224, 'Slopes at matching', { size: 14 }) + text(532, 246, 'points flip: 2 and 1/2.', { size: 14, weight: 'bold' });
  return doc('inverse-reflect', W, H, 'A function and its inverse', 'The crimson curve y = f(x), where f(x) = 0.5x cubed + 0.5x + 2, rises from lower left to upper right and passes through (1, 3). The blue curve y = f inverse of x is its mirror image across the dashed line y = x and passes through (3, 1). Short black lines touch the curves at those points: slope 2 on f at (1, 3) and slope 1/2 on the inverse at (3, 1). Swapping x and y flips slopes to their reciprocals.', P.svg() + side, P.clipDef);
};

/* math-geometry: a 10 ft ladder against a wall, and a cone-shaped tank. */
FIGS['ladder-and-cone'] = () => {
  const W = 830, H = 440;
  let b = '';
  b += text(200, 34, 'Right triangle: a ladder', { size: 16, anchor: 'middle', weight: 'bold', color: C.crim });
  b += text(600, 34, 'Similar triangles: a cone tank', { size: 16, anchor: 'middle', weight: 'bold', color: C.crim });
  // ladder: wall at x = 300, ground y = 370; foot 6 ft out, top 8 ft up (10 ft ladder). scale 30 px/ft
  const s = 30, wx = 300, gy = 370, fx = wx - 6 * s, ty = gy - 8 * s;
  b += `<rect x="${wx}" y="${gy - 300}" width="16" height="300" fill="${C.pale}" stroke="${C.soft}" stroke-width="1.5"/>`;
  b += line(40, gy, wx + 16, gy, C.ink, 2.5);
  for (let x = 46; x < wx + 10; x += 14) b += line(x, gy + 1, x - 8, gy + 10, C.faint, 1);
  b += line(fx, gy, wx, ty, C.verm, 7) + line(fx, gy, wx, ty, '#F2B48A', 2);
  b += `<rect x="${wx - 14}" y="${gy - 14}" width="14" height="14" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`;
  b += arrow(fx, gy + 26, wx, gy + 26, C.blue, { width: 2 }) + arrow(wx, gy + 26, fx, gy + 26, C.blue, { width: 2 });
  b += text((fx + wx) / 2, gy + 50, '<i>x</i> = 6 ft', { size: 15, anchor: 'middle', weight: 'bold', color: C.blue });
  b += arrow(wx + 34, gy, wx + 34, ty, C.blue, { width: 2 }) + arrow(wx + 34, ty, wx + 34, gy, C.blue, { width: 2 });
  b += text(wx + 42, (gy + ty) / 2, '<i>y</i> = 8 ft', { size: 15, weight: 'bold', color: C.blue });
  b += text((fx + wx) / 2 - 22, (gy + ty) / 2 - 8, '10 ft', { size: 16, anchor: 'end', weight: 'bold', color: C.verm });
  b += text(60, 110, '<i>x</i><sup>2</sup> + <i>y</i><sup>2</sup> = 10<sup>2</sup>', { size: 17, weight: 'bold' });
  b += text(60, 136, '6<sup>2</sup> + 8<sup>2</sup> = 36 + 64 = 100', { size: 14, color: C.soft });
  // cone: apex down at (600, 380); top radius 4 ft, height 10 ft; scale 28 px/ft
  const k = 28, ax = 600, ay = 380, Rt = 4 * k, Ht = 10 * k, wh = 6, wr = 2.4;
  const top = ay - Ht;
  // water
  b += `<polygon points="${ax - wr * k},${ay - wh * k} ${ax + wr * k},${ay - wh * k} ${ax},${ay}" fill="${C.blueTint}" stroke="none"/>`;
  b += `<polygon points="${ax - Rt},${top} ${ax + Rt},${top} ${ax},${ay}" fill="none" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>`;
  b += `<ellipse cx="${ax}" cy="${top}" rx="${Rt}" ry="14" fill="none" stroke="${C.ink}" stroke-width="2"/>`;
  b += `<ellipse cx="${ax}" cy="${ay - wh * k}" rx="${wr * k}" ry="8" fill="${C.blueTint}" stroke="${C.blue}" stroke-width="2"/>`;
  b += line(ax, top, ax, ay, C.faint, 1.3, '5 4');
  b += line(ax, top, ax + Rt, top, C.crim, 2.5) + text(ax + Rt / 2, top - 20, '4 ft', { size: 15, anchor: 'middle', weight: 'bold', color: C.crim });
  b += line(ax, ay - wh * k, ax + wr * k, ay - wh * k, C.blue, 2.5) + text(ax + wr * k / 2 + 4, ay - wh * k - 12, '<i>r</i>', { size: 16, anchor: 'middle', weight: 'bold', color: C.blue });
  b += arrow(ax - Rt - 26, ay, ax - Rt - 26, top, C.crim, { width: 2 }) + arrow(ax - Rt - 26, top, ax - Rt - 26, ay, C.crim, { width: 2 });
  b += text(ax - Rt - 34, (ay + top) / 2, '10 ft', { size: 15, anchor: 'end', weight: 'bold', color: C.crim });
  b += arrow(ax - wr * k - 14, ay, ax - wr * k - 14, ay - wh * k, C.blue, { width: 2 }) + arrow(ax - wr * k - 14, ay - wh * k, ax - wr * k - 14, ay, C.blue, { width: 2 });
  b += text(ax - wr * k - 20, ay - wh * k / 2 + 5, '<i>h</i>', { size: 16, anchor: 'end', weight: 'bold', color: C.blue });
  b += text(700, 300, '<i>r</i> / <i>h</i> = 4 / 10', { size: 17, weight: 'bold' }) + text(700, 326, 'so <i>r</i> = 0.4<i>h</i>', { size: 15, color: C.soft });
  return doc('ladder-and-cone', W, H, 'A ladder and a cone tank', 'Left: a 10-foot ladder leans against a wall, its foot x = 6 feet from the wall and its top y = 8 feet up, a right triangle with x squared + y squared = 10 squared. Right: a cone-shaped tank, point down, 10 feet tall with top radius 4 feet, holds water to depth h with surface radius r. The small triangle of water and the whole cone are similar, so r over h = 4 over 10 and r = 0.4h.', b);
};

/* ======================================================= write */
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync(OUT, { recursive: true });
  const only = process.argv.slice(2);
  for (const [id, make] of Object.entries(FIGS)) {
    if (only.length && !only.includes(id)) continue;
    writeFileSync(join(OUT, `${id}.svg`), make());
    console.log(`wrote calculus/figures/${id}.svg`);
  }
}
