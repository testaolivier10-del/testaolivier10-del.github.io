/* AP® Calculus BC figures, author B: parametric equations and vectors (math chapter) and Unit 9, topics 9.1-9.6.

   Every curve is drawn by sampling the parametric functions it shows, so a picture can never drift from its
   caption. Standalone SVG: white background, role="img" with <title> and <desc>, Arial/Helvetica, ink #1F2A28,
   emerald #0A5A34 for emphasis (the BC accent), Okabe-Ito blue #0072B2, vermillion #D55E00, orange #E69F00 and
   sky #56B4E9 for further curves and vectors.

     node scripts/apcalcbc-figures/author-b.mjs            writes calculus-bc/figures/<id>.svg
     node scripts/apcalcbc-figures/author-b.mjs --out DIR   writes to DIR instead (preview)

   The metadata (alt text, size, licence) is in calculus-bc/data/figures/<topic>.json. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clearTicks } from '../lib/apcalc-fig-ticks.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const args = process.argv.slice(2);
const OUT = args.includes('--out') ? args[args.indexOf('--out') + 1] : join(ROOT, 'calculus-bc', 'figures');

const INK = '#1F2A28', EMERALD = '#5A1E96', BLUE = '#0072B2', VERM = '#D55E00', ORANGE = '#B26B00', SKY = '#56B4E9', GRID = '#E3E6E5', MUTED = '#5B6664';
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
      return `<tspan dy="${r2(dy)}" font-size="${r2(size * 0.68)}" ${st}>${esc(g.t)}</tspan><tspan dy="${r2(-dy)}" font-size="${size}"> </tspan>`;
    }
    return `<tspan ${st}>${esc(g.t)}</tspan>`;
  }).join('');
  return `<text xml:space="preserve" x="${r2(x)}" y="${r2(y)}" font-family="${FONT}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}"${o.halo ? ' paint-order="stroke" stroke="#fff" stroke-width="4" stroke-linejoin="round"' : ''}>${body}</text>`;
}

/* A panel: an x-y frame inside the figure. Pass equal units per pixel on both axes for paths (circles stay round). */
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
    a.push(text(left + width + 16, sy(ax) + 5, [{ t: o.xName || 'x', i: true }], { size: 15 }));
    a.push(text(sx(ay) + 8, top - 12, [{ t: o.yName || 'y', i: true }], { size: 15 }));
    return a.join('');
  };
  return { sx, sy, out, axes, o };
}

/* A parametric path (x(t), y(t)) for a <= t <= b. */
function path(P, X, Y, a, b, o = {}) {
  const n = o.n || 600;
  let d = '';
  for (let i = 0; i <= n; i++) { const t = a + (b - a) * i / n; d += `${i ? 'L' : 'M'}${r2(P.sx(X(t)))} ${r2(P.sy(Y(t)))}`; }
  return `<path d="${d}" fill="none" stroke="${o.color || EMERALD}" stroke-width="${o.width || 2.8}" stroke-linejoin="round" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
}
/* A direction arrowhead on the path at time t, pointing the way the point moves (screen direction of (x'(t), y'(t))). */
function headAt(P, X, Y, t, o = {}) {
  const h = 1e-4, px = P.sx(X(t)), py = P.sy(Y(t));
  let dx = P.sx(X(t + h)) - P.sx(X(t - h)), dy = P.sy(Y(t + h)) - P.sy(Y(t - h));
  const L = Math.hypot(dx, dy); dx /= L; dy /= L;
  const s = o.size || 11, w = s * 0.55;
  const tip = [px + dx * s * 0.6, py + dy * s * 0.6], b1 = [px - dx * s * 0.4 - dy * w, py - dy * s * 0.4 + dx * w], b2 = [px - dx * s * 0.4 + dy * w, py - dy * s * 0.4 - dx * w];
  return `<polygon points="${r2(tip[0])},${r2(tip[1])} ${r2(b1[0])},${r2(b1[1])} ${r2(b2[0])},${r2(b2[1])}" fill="${o.color || EMERALD}"/>`;
}
/* An arrow (a vector) from (x1, y1) to (x2, y2) in panel units. */
function vec(P, x1, y1, x2, y2, o = {}) {
  const X1 = P.sx(x1), Y1 = P.sy(y1), X2 = P.sx(x2), Y2 = P.sy(y2);
  let dx = X2 - X1, dy = Y2 - Y1; const L = Math.hypot(dx, dy); dx /= L; dy /= L;
  const s = o.head || 12, w = s * 0.45, c = o.color || BLUE;
  const bx = X2 - dx * s, by = Y2 - dy * s;
  return `<line x1="${r2(X1)}" y1="${r2(Y1)}" x2="${r2(bx)}" y2="${r2(by)}" stroke="${c}" stroke-width="${o.width || 2.6}" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>` +
    `<polygon points="${r2(X2)},${r2(Y2)} ${r2(bx - dy * w)},${r2(by + dx * w)} ${r2(bx + dy * w)},${r2(by - dx * w)}" fill="${c}"/>`;
}
function seg(P, x1, y1, x2, y2, o = {}) {
  return `<line x1="${r2(P.sx(x1))}" y1="${r2(P.sy(y1))}" x2="${r2(P.sx(x2))}" y2="${r2(P.sy(y2))}" stroke="${o.color || INK}" stroke-width="${o.width || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} stroke-linecap="round"/>`;
}
function dot(P, x, y, o = {}) {
  return `<circle cx="${r2(P.sx(x))}" cy="${r2(P.sy(y))}" r="${o.r || 5}" fill="${o.open ? '#fff' : (o.color || EMERALD)}" stroke="${o.color || EMERALD}" stroke-width="2"/>`;
}
function label(P, x, y, s, o = {}) { return text(P.sx(x) + (o.dx || 0), P.sy(y) + (o.dy || 0), s, { size: o.size || 13.5, anchor: o.anchor || 'start', color: o.color || INK, bold: o.bold, halo: true }); }
function svg(id, w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d">
<title id="${id}-t">${esc(title)}</title>
<desc id="${id}-d">${esc(desc)}</desc>
<rect width="${w}" height="${h}" fill="#fff"/>
${body.join('\n')}
</svg>
`;
}
const T = (s) => [{ t: s, i: true }];
const figs = {};

/* Math chapter: a path traced point by point, and a vector with its components. */
{
  const id = 'math-parametric-vectors-path';
  const X = t => t * t - 2 * t, Y = t => 3 - t;
  const W = 820, H = 440, b = [];
  // Left: x from -2 to 4, y from -1 to 5, 50 px per unit.
  const P = panel({ left: 60, top: 70, width: 300, height: 300, x: [-2, 4], y: [-1, 5], xStep: 1, yStep: 1 });
  b.push(...P.out, P.axes(), path(P, X, Y, -1, 3));
  for (const t of [-0.5, 0.5, 1.5, 2.5]) b.push(headAt(P, X, Y, t));
  for (const t of [-1, 0, 1, 2, 3]) {
    b.push(dot(P, X(t), Y(t), { r: 4.5 }));
    const dx = t === 1 ? -12 : 10, an = t === 1 ? 'end' : 'start', dy = t === 0 ? 18 : -8;
    b.push(label(P, X(t), Y(t), `t = ${fmt(t)}  (${fmt(X(t))}, ${fmt(Y(t))})`, { dx, dy, anchor: an, size: 13 }));
  }
  b.push(text(60, 32, [{ t: 'x', i: true }, { t: ' = ' }, { t: 't', i: true }, { t: '2', sup: true }, { t: ' − 2' }, { t: 't', i: true }, { t: ',  ' }, { t: 'y', i: true }, { t: ' = 3 − ' }, { t: 't', i: true }, { t: ',  −1 ≤ ' }, { t: 't', i: true }, { t: ' ≤ 3' }], { size: 15, bold: true }));
  // Right: the vector from P(1, 1) to Q(4, 5).
  const Q = panel({ left: 470, top: 70, width: 300, height: 300, x: [-1, 5], y: [-0.5, 5.5], xStep: 1, yStep: 1 });
  b.push(...Q.out, Q.axes());
  b.push(seg(Q, 1, 1, 4, 1, { color: VERM, dash: '6 5', width: 2 }), seg(Q, 4, 1, 4, 5, { color: VERM, dash: '6 5', width: 2 }));
  b.push(vec(Q, 1, 1, 4, 5, { color: BLUE, width: 3 }));
  b.push(dot(Q, 1, 1, { color: INK, r: 4 }), label(Q, 1, 1, 'P(1, 1)', { dx: -8, dy: 18, anchor: 'end' }));
  b.push(label(Q, 4, 5, 'Q(4, 5)', { dx: 8, dy: 4 }));
  b.push(label(Q, 2.5, 1, '3 across', { dy: 20, anchor: 'middle', color: VERM }), label(Q, 4, 3, '4 up', { dx: 8, color: VERM }));
  b.push(label(Q, 2.2, 3.4, '⟨3, 4⟩, length 5', { anchor: 'end', color: BLUE, bold: true }));
  b.push(text(470, 32, 'The vector from P to Q: ⟨4 − 1, 5 − 1⟩ = ⟨3, 4⟩', { size: 15, bold: true }));
  b.push(text(W / 2, H - 18, 'Left: each t gives one point; the arrows show the direction of increasing t. Right: a vector is a horizontal and a vertical change.', { anchor: 'middle', size: 13.5, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'A parametric path traced as t increases, and a vector with its components',
    'Left: the path x = t squared minus 2t, y = 3 minus t for t from -1 to 3, with dots at t = -1 (3, 4), t = 0 (0, 3), t = 1 (-1, 2), t = 2 (0, 1) and t = 3 (3, 0), and arrows showing the point moves down the page, first left and then right. Right: the vector from P(1, 1) to Q(4, 5), with dashed components 3 across and 4 up; it is the vector 3, 4 and its length is 5.', b) };
}

/* 9.1 lesson: one point, two tangent lines, so slopes need t. */
{
  const id = 'parametric-derivatives-tangents';
  const X = t => t * t, Y = t => t * t * t - 3 * t;
  const W = 760, H = 570, b = [];
  // x from -1 to 5, y from -2.5 to 2.5: 90 px per unit on both axes.
  const Q = panel({ left: 70, top: 60, width: 540, height: 450, x: [-1, 5], y: [-2.5, 2.5], xStep: 1, yStep: 1 });
  b.push(...Q.out, Q.axes(), path(Q, X, Y, -2.05, 2.05));
  for (const t of [-1.6, -0.5, 0.6, 1.6]) b.push(headAt(Q, X, Y, t));
  const s3 = Math.sqrt(3);
  // Two tangent lines at the crossing point (3, 0): slopes sqrt(3) (t = sqrt 3) and -sqrt(3) (t = -sqrt 3).
  b.push(seg(Q, 3 - 0.9, -0.9 * s3, 3 + 0.9, 0.9 * s3, { color: BLUE, width: 2.2, dash: '8 5' }));
  b.push(seg(Q, 3 - 0.9, 0.9 * s3, 3 + 0.9, -0.9 * s3, { color: VERM, width: 2.2, dash: '8 5' }));
  b.push(dot(Q, 3, 0, { color: INK, r: 5 }));
  b.push(label(Q, 3.9, 0.9 * s3, 't = √3: slope √3', { dx: 6, dy: 4, color: BLUE, bold: true }));
  b.push(label(Q, 3.9, -0.9 * s3, 't = −√3: slope −√3', { dx: 6, dy: 10, color: VERM, bold: true }));
  // Horizontal tangents at t = -1 (1, 2) and t = 1 (1, -2); vertical tangent at t = 0 (0, 0).
  b.push(seg(Q, 0.4, 2, 1.6, 2, { color: EMERALD, width: 2 }), seg(Q, 0.4, -2, 1.6, -2, { color: EMERALD, width: 2 }));
  b.push(dot(Q, 1, 2, { r: 4.5 }), dot(Q, 1, -2, { r: 4.5 }));
  b.push(label(Q, 1.6, 2, 't = −1: horizontal', { dx: 6, dy: 5 }), label(Q, 1.6, -2, 't = 1: horizontal', { dx: 6, dy: 5 }));
  b.push(seg(Q, 0, -0.6, 0, 0.6, { color: EMERALD, width: 2 }), dot(Q, 0, 0, { r: 4.5 }));
  b.push(label(Q, 0, 0.6, 't = 0: vertical', { dx: 6, dy: -4 }));
  b.push(text(70, 30, [{ t: 'x', i: true }, { t: ' = ' }, { t: 't', i: true }, { t: '2', sup: true }, { t: ',  ' }, { t: 'y', i: true }, { t: ' = ' }, { t: 't', i: true }, { t: '3', sup: true }, { t: ' − 3' }, { t: 't', i: true }, { t: ':  dy/dx = (3' }, { t: 't', i: true }, { t: '2', sup: true }, { t: ' − 3)/(2' }, { t: 't', i: true }, { t: ')' }], { size: 15, bold: true }));
  b.push(text(W / 2, H - 14, 'The curve passes through (3, 0) twice, at t = −√3 and t = √3, with a different slope each time.', { anchor: 'middle', size: 13.5, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Slopes on a parametric curve depend on t, not only on the point',
    'The curve x = t squared, y = t cubed minus 3t for t from about -2 to 2, a loop that crosses itself at (3, 0), with arrows showing the direction of increasing t. At (3, 0) two dashed tangent lines are drawn: slope square root of 3 when t = square root of 3, and slope minus square root of 3 when t = minus square root of 3. Short horizontal tangent segments mark (1, 2) at t = -1 and (1, -2) at t = 1, and a vertical tangent marks the origin at t = 0.', b) };
}

/* 9.1 stimulus: a path with direction arrows and two marked times. */
{
  const id = 'parametric-derivatives-path';
  const X = t => t * t * t - 3 * t, Y = t => 4 - t * t;
  const W = 640, H = 500, b = [];
  const P = panel({ left: 70, top: 70, width: 450, height: 375, x: [-3, 3], y: [-0.5, 4.5], xStep: 1, yStep: 1 });
  b.push(...P.out, P.axes(), path(P, X, Y, -2, 2));
  for (const t of [-1.6, -0.45, 0.45, 1.6]) b.push(headAt(P, X, Y, t));
  b.push(dot(P, X(-2), Y(-2), { r: 4, color: INK }), label(P, X(-2), Y(-2), 'start, t = −2', { dx: -6, dy: -10, anchor: 'end' }));
  b.push(dot(P, X(2), Y(2), { r: 5, color: VERM }), label(P, X(2), Y(2), 't = 2', { dx: 8, dy: -8, color: VERM, bold: true }));
  b.push(dot(P, X(-1), Y(-1), { r: 5, color: BLUE }), label(P, X(-1), Y(-1), 't = −1', { dx: 8, dy: -6, color: BLUE, bold: true }));
  b.push(text(70, 26, [{ t: 'x', i: true }, { t: '(' }, { t: 't', i: true }, { t: ') = ' }, { t: 't', i: true }, { t: '3', sup: true }, { t: ' − 3' }, { t: 't', i: true }, { t: ',  ' }, { t: 'y', i: true }, { t: '(' }, { t: 't', i: true }, { t: ') = 4 − ' }, { t: 't', i: true }, { t: '2', sup: true }, { t: ',  −2 ≤ ' }, { t: 't', i: true }, { t: ' ≤ 2' }], { size: 15, bold: true }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'The path x(t) = t cubed minus 3t, y(t) = 4 minus t squared',
    'The path of x(t) = t cubed minus 3t, y(t) = 4 minus t squared for t from -2 to 2. It starts at (-2, 0) when t = -2, rises to the right, turns back to the left near (2, 3), passes over the top at (0, 4), turns again near (-2, 3) and comes down to (2, 0) when t = 2, crossing its own earlier path on the way. Arrows show the direction of increasing t. The point where t = -1, (2, 3), is marked in blue and the point where t = 2, (2, 0), in vermillion.', b) };
}

/* 9.2 lesson: on a circle, d/dt(dy/dx) has one sign, but d2y/dx2 changes sign with dx/dt. */
{
  const id = 'parametric-second-derivatives-circle';
  const X = t => Math.cos(t), Y = t => Math.sin(t);
  const W = 760, H = 460, b = [];
  const P = panel({ left: 60, top: 60, width: 330, height: 330, x: [-1.5, 1.5], y: [-1.5, 1.5], xStep: 0.5, yStep: 0.5, xEvery: 1, yEvery: 1 });
  b.push(...P.out, P.axes(), path(P, X, Y, 0.02, Math.PI - 0.02, { color: BLUE }), path(P, X, Y, Math.PI + 0.02, 2 * Math.PI - 0.02, { color: VERM }));
  for (const t of [Math.PI / 2, 3 * Math.PI / 2]) b.push(headAt(P, X, Y, t, { color: INK }));
  b.push(label(P, 0, 1, 'upper half: concave down', { dy: -12, anchor: 'middle', color: BLUE, bold: true }));
  b.push(label(P, 0, -1, 'lower half: concave up', { dy: 24, anchor: 'middle', color: VERM, bold: true }));
  const tx = 450;
  b.push(text(tx, 100, [{ t: 'x', i: true }, { t: ' = cos ' }, { t: 't', i: true }, { t: ',  ' }, { t: 'y', i: true }, { t: ' = sin ' }, { t: 't', i: true }, { t: ' (counterclockwise)' }], { size: 15, bold: true }));
  b.push(text(tx, 140, 'dy/dx = cos t / (−sin t) = −cot t', { size: 15 }));
  b.push(text(tx, 175, 'd/dt (dy/dx) = csc² t   (positive for every t)', { size: 15 }));
  b.push(text(tx, 215, 'Divide by dx/dt = −sin t:', { size: 15, bold: true, color: EMERALD }));
  b.push(text(tx, 250, 'd²y/dx² = csc² t / (−sin t) = −1/sin³ t', { size: 15 }));
  b.push(text(tx, 290, [{ t: 'sin t > 0 (upper half): negative', color: BLUE }], { size: 15 }));
  b.push(text(tx, 320, [{ t: 'sin t < 0 (lower half): positive', color: VERM }], { size: 15 }));
  b.push(text(W / 2, H - 18, 'Skipping the division by dx/dt would call the whole circle concave up.', { anchor: 'middle', size: 14, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'The second derivative of a parametric curve divides by dx/dt again',
    'The unit circle x = cos t, y = sin t traced counterclockwise, its upper half in blue labelled concave down and its lower half in vermillion labelled concave up. Beside it: dy/dx = -cot t; d/dt of dy/dx = csc squared t, positive for every t; dividing by dx/dt = -sin t gives d2y/dx2 = -1 over sin cubed t, negative on the upper half and positive on the lower half. Skipping the division by dx/dt would call the whole circle concave up.', b) };
}

/* 9.3 lesson: a small piece of a curve is the hypotenuse of a triangle with legs x'(t) dt and y'(t) dt. */
{
  const id = 'parametric-arc-length-pieces';
  const X = t => 2 * t, Y = t => 3 + 2 * t - t * t / 1.2;
  const W = 760, H = 440, b = [];
  const P = panel({ left: 60, top: 60, width: 420, height: 300, x: [0, 7], y: [0, 5], xStep: 1, yStep: 1 });
  b.push(...P.out, P.axes(), path(P, X, Y, 0, 3.4, { color: EMERALD }));
  const ts = [0, 0.68, 1.36, 2.04, 2.72, 3.4];
  for (let i = 0; i < ts.length - 1; i++) b.push(seg(P, X(ts[i]), Y(ts[i]), X(ts[i + 1]), Y(ts[i + 1]), { color: BLUE, width: 2, dash: '5 4' }));
  for (const t of ts) b.push(dot(P, X(t), Y(t), { r: 3.5, color: BLUE }));
  // A zoomed triangle on one piece.
  const a = ts[3], c = ts[4];
  b.push(seg(P, X(a), Y(a), X(c), Y(a), { color: VERM, width: 2.2 }), seg(P, X(c), Y(a), X(c), Y(c), { color: VERM, width: 2.2 }));
  b.push(label(P, (X(a) + X(c)) / 2, Y(a), 'Δx', { dy: -8, anchor: 'middle', color: VERM, bold: true }));
  b.push(label(P, X(c), (Y(a) + Y(c)) / 2, 'Δy', { dx: 8, dy: 4, color: VERM, bold: true }));
  b.push(label(P, (X(a) + X(c)) / 2, (Y(a) + Y(c)) / 2, 'Δs', { dx: -8, dy: 18, anchor: 'end', color: BLUE, bold: true }));
  const tx = 520;
  b.push(text(tx, 110, 'One piece:', { size: 15, bold: true }));
  b.push(text(tx, 140, 'Δs ≈ √((Δx)² + (Δy)²)', { size: 15 }));
  b.push(text(tx, 175, 'Δx ≈ x′(t) Δt,  Δy ≈ y′(t) Δt', { size: 15 }));
  b.push(text(tx, 210, 'Δs ≈ √((x′(t))² + (y′(t))²) Δt', { size: 15 }));
  b.push(text(tx, 255, 'Add the pieces, shrink Δt:', { size: 15, bold: true, color: EMERALD }));
  b.push(text(tx, 290, 'L = ∫ √((x′(t))² + (y′(t))²) dt', { size: 15, color: EMERALD, bold: true }));
  b.push(text(W / 2, H - 18, 'The dashed segments hug the curve; their total length approaches the length of the curve.', { anchor: 'middle', size: 13.5, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Arc length from many short straight pieces',
    'A curved path is replaced by five dashed straight segments joining points on it. On one segment a right triangle is drawn with a horizontal leg delta x, a vertical leg delta y and the segment delta s as hypotenuse. Beside it: delta s is about the square root of delta x squared plus delta y squared; delta x is about x prime of t times delta t and delta y about y prime of t times delta t, so delta s is about the square root of x prime squared plus y prime squared, times delta t. Adding the pieces and shrinking delta t gives L as the integral of the square root of x prime of t squared plus y prime of t squared, dt.', b) };
}

/* 9.3 stimulus: one arch of a cycloid (the rim point of a rolling wheel of radius 1). */
{
  const id = 'parametric-arc-length-cycloid';
  const X = t => t - Math.sin(t), Y = t => 1 - Math.cos(t);
  const W = 760, H = 400, b = [];
  // x from -0.3 to 6.9, y from -0.3 to 2.6: 95 px per unit.
  const P = panel({ left: 50, top: 70, width: 684, height: 276, x: [-0.3, 6.9], y: [-0.3, 2.6], xStep: 1, yStep: 1, xTick: v => fmt(v) });
  b.push(...P.out, P.axes(), path(P, X, Y, 0, 2 * Math.PI));
  for (const t of [1.2, Math.PI, 5.1]) b.push(headAt(P, X, Y, t));
  // The wheel at t = 2 with its rim point.
  const t0 = 2; const cx = t0, cy = 1;
  b.push(`<circle cx="${r2(P.sx(cx))}" cy="${r2(P.sy(cy))}" r="${r2(P.sx(1) - P.sx(0))}" fill="none" stroke="${MUTED}" stroke-width="1.5" stroke-dasharray="5 4"/>`);
  b.push(seg(P, cx, cy, X(t0), Y(t0), { color: MUTED, width: 1.5 }), dot(P, cx, cy, { r: 3, color: MUTED }), dot(P, X(t0), Y(t0), { r: 5, color: VERM }));
  b.push(label(P, X(t0), Y(t0), 'rim point', { dx: -8, dy: -6, anchor: 'end', color: VERM }));
  b.push(dot(P, 0, 0, { r: 4, color: INK }), dot(P, 2 * Math.PI, 0, { r: 4, color: INK }));
  b.push(label(P, 2 * Math.PI, 0, '(2π, 0)', { dx: 6, dy: -8 }));
  b.push(text(50, 26, [{ t: 'x', i: true }, { t: ' = ' }, { t: 't', i: true }, { t: ' − sin ' }, { t: 't', i: true }, { t: ',  ' }, { t: 'y', i: true }, { t: ' = 1 − cos ' }, { t: 't', i: true }, { t: ',  0 ≤ ' }, { t: 't', i: true }, { t: ' ≤ 2π' }], { size: 15, bold: true }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'One arch of the path x = t minus sin t, y = 1 minus cos t',
    'One arch of the path x = t minus sin t, y = 1 minus cos t for t from 0 to 2 pi: it starts at the origin, rises to a highest point of height 2 above x = pi, and comes back down to (2 pi, 0), with arrows showing it is traced left to right. A dashed wheel of radius 1 is drawn at t = 2 with the traced point on its rim marked.', b) };
}

/* 9.4 lesson: velocity vectors are tangent to the path; the acceleration vector points into the bend. */
{
  const id = 'vector-derivatives-ellipse';
  const X = t => 3 * Math.cos(t), Y = t => 2 * Math.sin(t);
  const W = 880, H = 470, b = [];
  // x from -4.5 to 4.5, y from -3 to 3: 60 px per unit.
  const P = panel({ left: 50, top: 50, width: 540, height: 360, x: [-4.5, 4.5], y: [-3, 3], xStep: 1, yStep: 1 });
  b.push(...P.out, P.axes(), path(P, X, Y, 0, 2 * Math.PI, { color: EMERALD }));
  const vx = t => -3 * Math.sin(t), vy = t => 2 * Math.cos(t);
  for (const t of [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) {
    b.push(vec(P, X(t), Y(t), X(t) + 0.5 * vx(t), Y(t) + 0.5 * vy(t), { color: BLUE }));
    b.push(dot(P, X(t), Y(t), { r: 4 }));
  }
  const ta = Math.PI / 4;
  b.push(vec(P, X(ta), Y(ta), X(ta) + 0.5 * vx(ta), Y(ta) + 0.5 * vy(ta), { color: BLUE }));
  b.push(vec(P, X(ta), Y(ta), X(ta) - 0.5 * X(ta), Y(ta) - 0.5 * Y(ta), { color: VERM }));
  b.push(dot(P, X(ta), Y(ta), { r: 4 }));
  b.push(label(P, X(0), Y(0), 't = 0', { dx: 8, dy: 16 }), label(P, X(Math.PI / 2), Y(Math.PI / 2), 't = π/2', { dx: 4, dy: -10 }));
  b.push(label(P, X(ta), Y(ta), 't = π/4', { dx: 8, dy: -6 }));
  b.push(label(P, X(ta) * 0.5, Y(ta) * 0.5, 'acceleration (half size)', { dx: -10, dy: 18, anchor: 'end', color: VERM, bold: true }));
  b.push(text(620, 120, 'velocity', { size: 15, bold: true, color: BLUE }), text(620, 142, '(half size)', { size: 13, color: BLUE }));
  b.push(text(620, 190, 'r(t) = ⟨3 cos t, 2 sin t⟩', { size: 13.5 }));
  b.push(text(620, 215, 'v(t) = ⟨−3 sin t, 2 cos t⟩', { size: 13.5, color: BLUE }));
  b.push(text(620, 240, 'a(t) = ⟨−3 cos t, −2 sin t⟩', { size: 13.5, color: VERM }));
  b.push(text(W / 2, H - 16, 'Each velocity vector is tangent to the path and points the way the point moves (counterclockwise).', { anchor: 'middle', size: 13.5, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Velocity vectors along the path r(t) = ⟨3 cos t, 2 sin t⟩',
    'The ellipse r(t) = 3 cos t, 2 sin t, traced counterclockwise. Blue velocity vectors, drawn at half size, start at the points where t = 0, pi/4, pi/2, pi and 3 pi/2; each is tangent to the ellipse and points counterclockwise: straight up at t = 0, straight left at t = pi/2. At t = pi/4 a vermillion acceleration vector, also half size, points from the point toward the center. The formulas are r(t) = 3 cos t, 2 sin t; v(t) = -3 sin t, 2 cos t; a(t) = -3 cos t, -2 sin t.', b) };
}

/* 9.5 lesson: the same velocity from two starting points gives two shifted paths. */
{
  const id = 'vector-integrals-shift';
  const W = 800, H = 520, b = [];
  const P = panel({ left: 60, top: 60, width: 450, height: 375, x: [-0.5, 5.5], y: [-1.5, 3.5], xStep: 1, yStep: 1 });
  const A = [0, 0], B = [2, 1];
  const X = s => t => s[0] + t, Y = s => t => s[1] + t * t - 2 * t;
  b.push(...P.out, P.axes());
  for (const [s, c] of [[A, EMERALD], [B, BLUE]]) {
    b.push(path(P, X(s), Y(s), 0, 2.8, { color: c }));
    for (const t of [0.6, 1.5, 2.4]) b.push(headAt(P, X(s), Y(s), t, { color: c }));
    b.push(dot(P, s[0], s[1], { r: 5, color: c }));
    b.push(vec(P, X(s)(2), Y(s)(2), X(s)(2) + 0.5, Y(s)(2) + 1, { color: VERM, width: 2.4 }));
    b.push(dot(P, X(s)(2), Y(s)(2), { r: 3.5, color: c }));
  }
  b.push(label(P, 0, 0, 'start (0, 0)', { dx: -8, dy: -10, anchor: 'end', color: EMERALD, bold: true }));
  b.push(label(P, 2, 1, 'start (2, 1)', { dx: -8, dy: -10, anchor: 'end', color: BLUE, bold: true }));
  b.push(label(P, 2.2, -0.45, 'same velocity at t = 2', { dx: 0, dy: 5, color: VERM }));
  const tx = 590;
  b.push(text(tx, 110, 'v(t) = ⟨1, 2t − 2⟩', { size: 15, bold: true }));
  b.push(text(tx, 145, 'Antiderivative:', { size: 14 }));
  b.push(text(tx, 170, '⟨t, t² − 2t⟩ + C', { size: 15 }));
  b.push(text(tx, 210, [{ t: 'C = ⟨0, 0⟩', color: EMERALD }], { size: 15, bold: true }));
  b.push(text(tx, 240, [{ t: 'C = ⟨2, 1⟩', color: BLUE }], { size: 15, bold: true }));
  b.push(text(tx, 285, 'The start picks C:', { size: 14 }));
  b.push(text(tx, 308, 'r(t) = r(0) + ∫ v', { size: 14 }));
  b.push(text(W / 2, H - 18, 'One velocity, many paths: each is a shifted copy. The initial position decides which one the particle follows.', { anchor: 'middle', size: 13.5, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'The same velocity from two starting points gives two shifted paths',
    'Two paths with the same velocity v(t) = 1, 2t - 2 for t from 0 to 2.8. The emerald path starts at (0, 0) and the blue path starts at (2, 1); the blue path is the emerald one shifted 2 right and 1 up. At t = 2 both carry the same vermillion velocity vector. The antiderivative of v is t, t squared minus 2t, plus a constant vector C: C = 0, 0 for the emerald path and C = 2, 1 for the blue one. The initial position picks C: r(t) = r(0) plus the integral of v.', b) };
}

/* 9.6 lesson: position, velocity, displacement and distance on one path. */
{
  const id = 'planar-motion-parabola';
  const X = t => 2 * t, Y = t => 4 * t - t * t;
  const W = 760, H = 440, b = [];
  const P = panel({ left: 60, top: 60, width: 495, height: 300, x: [-0.5, 9.4], y: [-1, 5], xStep: 1, yStep: 1 });
  b.push(...P.out, P.axes(), path(P, X, Y, 0, 4));
  for (const t of [0.5, 2, 3.5]) b.push(headAt(P, X, Y, t));
  b.push(vec(P, 0, 0, X(1), Y(1), { color: MUTED, width: 2, dash: '6 4' }));
  b.push(label(P, 1.5, 0.9, 'position ⟨2, 3⟩', { dx: 4, color: MUTED }));
  b.push(vec(P, X(1), Y(1), X(1) + 2, Y(1) + 2, { color: BLUE }));
  b.push(label(P, X(1) + 2, Y(1) + 2, 'velocity ⟨2, 2⟩, speed 2√2', { dx: 6, dy: 4, color: BLUE, bold: true }));
  b.push(dot(P, X(1), Y(1), { r: 4.5 }));
  b.push(vec(P, 0, 0, 8, 0, { color: VERM, width: 3 }));
  b.push(label(P, 4, 0, 'displacement ⟨8, 0⟩, length 8', { dy: 30, anchor: 'middle', color: VERM, bold: true }));
  b.push(label(P, 4, 2.2, 'distance along the path ≈ 11.83', { dy: 0, anchor: 'middle', color: EMERALD, bold: true }));   // inside the arch, clear of the velocity arrow
  const tx = 585;
  b.push(text(tx, 110, 'r(t) = ⟨2t, 4t − t²⟩', { size: 14, bold: true }));
  b.push(text(tx, 135, '0 ≤ t ≤ 4', { size: 14 }));
  b.push(text(tx, 175, 'v(1) = ⟨2, 2⟩', { size: 14, color: BLUE }));
  b.push(text(tx, 215, 'displacement:', { size: 14, color: VERM }), text(tx, 236, '∫ v dt = ⟨8, 0⟩', { size: 14, color: VERM }));
  b.push(text(tx, 276, 'distance:', { size: 14, color: EMERALD }), text(tx, 297, '∫ speed dt ≈ 11.83', { size: 14, color: EMERALD }));
  b.push(text(W / 2, H - 16, 'The integral of velocity gives the change in position; the integral of speed gives how far the particle went.', { anchor: 'middle', size: 13.5, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Position, velocity, displacement and distance for r(t) = ⟨2t, 4t − t²⟩',
    'The path r(t) = 2t, 4t minus t squared for t from 0 to 4, an arch from (0, 0) up to (4, 4) and down to (8, 0), traced left to right. A dashed gray position vector goes from the origin to (2, 3), the point at t = 1. From that point a blue velocity vector 2, 2 is drawn; its length, the speed, is 2 root 2. A vermillion displacement vector 8, 0 runs from the start to the end, length 8, while the distance along the path, the integral of speed, is about 11.83.', b) };
}

/* 9.6 stimulus: a closed loop with the velocity vector drawn at t = 1. */
{
  const id = 'planar-motion-loop';
  const X = t => 4 - t * t, Y = t => t * t * t - 4 * t;
  const W = 600, H = 680, b = [];
  // x from -1 to 5.5, y from -4 to 4: 66 px per unit on both axes.
  const P = panel({ left: 70, top: 70, width: 429, height: 551, x: [-1, 5.5], y: [-4.6, 3.75], xStep: 1, yStep: 1 });
  b.push(...P.out, P.axes(), path(P, X, Y, -2, 2));
  for (const t of [-1.5, -0.4, 0.5, 1.6]) b.push(headAt(P, X, Y, t));
  b.push(dot(P, 0, 0, { r: 4.5, color: INK }), label(P, 0, 0, 'start (t = −2) and end (t = 2)', { dx: 10, dy: -10 }));
  b.push(dot(P, X(1), Y(1), { r: 5 }), label(P, X(1), Y(1), 't = 1', { dx: 10, dy: 6, bold: true }));
  b.push(vec(P, X(1), Y(1), X(1) - 2, Y(1) - 1, { color: BLUE, width: 3 }));
  b.push(label(P, X(1) - 2, Y(1) - 1, 'velocity at t = 1', { dx: -4, dy: 22, anchor: 'middle', color: BLUE, bold: true }));
  b.push(text(70, 26, [{ t: 'x', i: true }, { t: '(' }, { t: 't', i: true }, { t: ') = 4 − ' }, { t: 't', i: true }, { t: '2', sup: true }, { t: ',  ' }, { t: 'y', i: true }, { t: '(' }, { t: 't', i: true }, { t: ') = ' }, { t: 't', i: true }, { t: '3', sup: true }, { t: ' − 4' }, { t: 't', i: true }, { t: ',  −2 ≤ ' }, { t: 't', i: true }, { t: ' ≤ 2' }], { size: 15, bold: true }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'A closed path with the velocity vector drawn at t = 1',
    'The path x(t) = 4 minus t squared, y(t) = t cubed minus 4t for t from -2 to 2. It starts at the origin at t = -2, swings up and right through (3, 3), reaches (4, 0) at t = 0, swings down through (3, -3) at t = 1 and returns to the origin at t = 2, a closed loop traced clockwise. Arrows show the direction of increasing t. At the point where t = 1, (3, -3), a blue velocity vector is drawn pointing 2 units left and 1 unit down.', b) };
}

mkdirSync(OUT, { recursive: true });
for (const [id, f] of Object.entries(figs)) writeFileSync(join(OUT, `${id}.svg`), clearTicks(f.svg));
if (args.includes('--meta')) console.log(JSON.stringify(Object.fromEntries(Object.entries(figs).map(([id, f]) => [id, { w: f.w, h: f.h }]))));
console.log(`Author B figures: ${Object.keys(figs).length} written to ${OUT}`);
