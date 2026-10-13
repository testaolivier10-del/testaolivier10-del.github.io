/* Figures for AP® Calculus AB Unit 7 (differential equations) and the first
   three Unit 8 topics (average value, motion with integrals, accumulation in
   context). Every curve is sampled from the function the caption names, so a
   figure can never drift from its mathematics.

     node scripts/apcalc-figures/unit-7-8a.mjs      writes calculus/figures/<id>.svg

   Standalone SVG: white background, Arial/Helvetica, ink #1F2A28, course
   crimson #8C1036 for emphasis, Okabe-Ito blue #0072B2, green #009E73 and
   vermillion #D55E00 for second curves; role="img" with <title> and <desc>. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'calculus', 'figures');
const INK = '#1F2A28', CRIMSON = '#8C1036', BLUE = '#0072B2', GREEN = '#009E73', VERM = '#D55E00', GRID = '#E4E7E6', SOFT = '#6B7572';
const FONT = 'Arial, Helvetica, sans-serif';
const f2 = v => (Math.round(v * 10) / 10).toString();
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const minus = s => String(s).replace(/-/g, '−');

/* A plotting frame: data box [x0, x1] × [y0, y1] drawn in the pixel box
   (left, top, width, height). */
function frame({ x, y, left, top, width, height }) {
  const sx = v => left + (v - x[0]) / (x[1] - x[0]) * width;
  const sy = v => top + (y[1] - v) / (y[1] - y[0]) * height;
  return { x, y, left, top, width, height, sx, sy, right: left + width, bottom: top + height };
}

function text(px, py, s, { size = 14, anchor = 'start', fill = INK, weight = 'normal', italic = false } = {}) {
  return `<text x="${f2(px)}" y="${f2(py)}" font-size="${size}" text-anchor="${anchor}" fill="${fill}"${weight !== 'normal' ? ` font-weight="${weight}"` : ''}${italic ? ' font-style="italic"' : ''}>${esc(s)}</text>`;
}

/* Grid, axes through 0 (or along the frame edge), tick labels. */
function axes(F, { xStep = 1, yStep = 1, xLabel = 'x', yLabel = 'y', xTicks, yTicks, grid = true, xFmt = minus, yFmt = minus, axisAtEdge = false, edgeTicks = false } = {}) {
  const out = [];
  const xs = xTicks || range(Math.ceil(F.x[0] / xStep) * xStep, F.x[1], xStep);
  const ys = yTicks || range(Math.ceil(F.y[0] / yStep) * yStep, F.y[1], yStep);
  if (grid) {
    out.push(`<g stroke="${GRID}" stroke-width="1">`);
    for (const v of xs) out.push(`<line x1="${f2(F.sx(v))}" y1="${F.top}" x2="${f2(F.sx(v))}" y2="${F.bottom}"/>`);
    for (const v of ys) out.push(`<line x1="${F.left}" y1="${f2(F.sy(v))}" x2="${F.right}" y2="${f2(F.sy(v))}"/>`);
    out.push('</g>');
  }
  const ax = axisAtEdge || F.y[0] > 0 || F.y[1] < 0 ? F.y[0] : 0; // the horizontal axis sits at y = ax
  const ay = axisAtEdge || F.x[0] > 0 || F.x[1] < 0 ? F.x[0] : 0; // the vertical axis sits at x = ay
  const X0 = F.sy(ax), Y0 = F.sx(ay);
  out.push(`<g stroke="${INK}" stroke-width="1.5" fill="none">`);
  out.push(`<line x1="${F.left}" y1="${f2(X0)}" x2="${F.right + 8}" y2="${f2(X0)}"/>`);
  out.push(`<line x1="${f2(Y0)}" y1="${F.bottom}" x2="${f2(Y0)}" y2="${F.top - 8}"/>`);
  out.push('</g>');
  out.push(`<path d="M${f2(F.right + 14)} ${f2(X0)} l-8 -4 v8 z M${f2(Y0)} ${f2(F.top - 14)} l-4 8 h8 z" fill="${INK}"/>`);
  out.push(`<g font-family="${FONT}" font-size="12" fill="${INK}">`);
  if (edgeTicks) {
    // Tick labels along the frame's bottom and left edges, clear of a field's segments.
    for (const v of xs) out.push(text(F.sx(v), F.bottom + 18, xFmt(v), { size: 12, anchor: 'middle' }));
    for (const v of ys) out.push(text(F.left - 8, F.sy(v) + 4, yFmt(v), { size: 12, anchor: 'end' }));
  } else {
  for (const v of xs) if (Math.abs(v - ay) > 1e-9) { out.push(`<line x1="${f2(F.sx(v))}" y1="${f2(X0 - 4)}" x2="${f2(F.sx(v))}" y2="${f2(X0 + 4)}" stroke="${INK}"/>`); out.push(text(F.sx(v), X0 + 18, xFmt(v), { size: 12, anchor: 'middle' })); }
  for (const v of ys) if (Math.abs(v - ax) > 1e-9) { out.push(`<line x1="${f2(Y0 - 4)}" y1="${f2(F.sy(v))}" x2="${f2(Y0 + 4)}" y2="${f2(F.sy(v))}" stroke="${INK}"/>`); out.push(text(Y0 - 8, F.sy(v) + 4, yFmt(v), { size: 12, anchor: 'end' })); }
  if (ax === 0 && ay === 0) out.push(text(Y0 - 7, X0 + 16, '0', { size: 12, anchor: 'end' }));
  }
  out.push('</g>');
  out.push(`<g font-family="${FONT}">${text(F.right + 12, X0 - 10, xLabel, { size: 14, anchor: 'end', italic: true })}${text(Y0 + 10, F.top - 6, yLabel, { size: 14, italic: true })}</g>`);
  return out.join('\n');
}
function range(a, b, s) { const r = []; for (let v = a; v <= b + 1e-9; v += s) r.push(Math.round(v * 1e6) / 1e6); return r; }

/* A curve sampled from f on [a, b], clipped to the frame, broken where f
   is not finite or leaves the box far away. */
function curve(F, f, a, b, { color = CRIMSON, width = 2.5, dash = '', n = 400 } = {}) {
  let d = '', pen = false;
  const lo = F.y[0] - (F.y[1] - F.y[0]), hi = F.y[1] + (F.y[1] - F.y[0]);
  for (let i = 0; i <= n; i++) {
    const x = a + (b - a) * i / n, y = f(x);
    if (!Number.isFinite(y) || y < lo || y > hi) { pen = false; continue; }
    d += `${pen ? 'L' : 'M'}${f2(F.sx(x))} ${f2(F.sy(y))} `;
    pen = true;
  }
  return `<path d="${d.trim()}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''} clip-path="url(#plot)"/>`;
}
const clip = F => `<defs><clipPath id="plot"><rect x="${F.left}" y="${F.top}" width="${F.width}" height="${F.height}"/></clipPath></defs>`;

/* The region between f and g (g defaults to 0) on [a, b]. */
function shade(F, f, a, b, { g = () => 0, color = CRIMSON, opacity = 0.18, n = 200 } = {}) {
  const top = [], bot = [];
  for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; top.push(`${f2(F.sx(x))} ${f2(F.sy(f(x)))}`); bot.push(`${f2(F.sx(x))} ${f2(F.sy(g(x)))}`); }
  return `<path d="M${top.join(' L')} L${bot.reverse().join(' L')} Z" fill="${color}" fill-opacity="${opacity}" stroke="none"/>`;
}

/* A segment of fixed screen length through (x, y) with slope m in data units. */
function seg(F, x, y, m, { len = 18, color = INK, width = 1.6 } = {}) {
  const kx = F.width / (F.x[1] - F.x[0]), ky = F.height / (F.y[1] - F.y[0]);
  const dx = 1 * kx, dy = -m * ky, L = Math.hypot(dx, dy);
  const ux = dx / L * len / 2, uy = dy / L * len / 2, X = F.sx(x), Y = F.sy(y);
  return `<line x1="${f2(X - ux)}" y1="${f2(Y - uy)}" x2="${f2(X + ux)}" y2="${f2(Y + uy)}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
}
function field(F, dydx, xs, ys, opt = {}) { const out = []; for (const x of xs) for (const y of ys) { const m = dydx(x, y); if (Number.isFinite(m)) out.push(seg(F, x, y, m, opt)); } return `<g clip-path="url(#${opt.clipId || 'plot'})">${out.join('')}</g>`; }
const dot = (F, x, y, { color = CRIMSON, open = false, r = 5 } = {}) => `<circle cx="${f2(F.sx(x))}" cy="${f2(F.sy(y))}" r="${r}" fill="${open ? '#fff' : color}" stroke="${color}" stroke-width="2"/>`;
function hline(F, y, { color = SOFT, dash = '6 5', width = 1.5 } = {}) { return `<line x1="${F.left}" y1="${f2(F.sy(y))}" x2="${F.right}" y2="${f2(F.sy(y))}" stroke="${color}" stroke-width="${width}" stroke-dasharray="${dash}"/>`; }
function vline(F, x, { color = SOFT, dash = '6 5', width = 1.5 } = {}) { return `<line x1="${f2(F.sx(x))}" y1="${F.top}" x2="${f2(F.sx(x))}" y2="${F.bottom}" stroke="${color}" stroke-width="${width}" stroke-dasharray="${dash}"/>`; }
/* A label in a white box so it reads over grid lines. */
function tag(px, py, s, { size = 13, anchor = 'start', fill = INK, weight = 'normal' } = {}) {
  const w = s.length * size * (weight === 'bold' ? 0.6 : 0.55) + 8, h = size + 7;
  const x0 = anchor === 'middle' ? px - w / 2 : anchor === 'end' ? px - w : px;
  return `<rect x="${f2(x0 - 1)}" y="${f2(py - size - 1)}" width="${f2(w)}" height="${f2(h)}" fill="#fff" fill-opacity="0.92" rx="3"/>${text(anchor === 'start' ? px + 3 : anchor === 'end' ? px - 3 : px, py, s, { size, anchor, fill, weight })}`;
}

function svg(id, W, H, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="${FONT}">
<title id="${id}-t">${esc(title)}</title>
<desc id="${id}-d">${esc(desc)}</desc>
<rect width="${W}" height="${H}" fill="#fff"/>
${body}
</svg>
`;
}

export const FIGURES = {};

/* 7.1 Newton's law of cooling: dT/dt = -0.05(T - 20), T(0) = 90. */
{
  const id = 'cooling-rate-slopes';
  const T = t => 20 + 70 * Math.exp(-0.05 * t);
  const F = frame({ x: [0, 60], y: [0, 100], left: 70, top: 40, width: 560, height: 330 });
  const marks = [[0, 90], [Math.log(2) / 0.05, 55], [Math.log(7) / 0.05, 30]];
  const body = [clip(F), axes(F, { xStep: 10, yStep: 20, xLabel: 't (minutes)', yLabel: 'T (°C)' }),
    hline(F, 20), tag(F.sx(41), F.sy(20) + 22, 'room temperature, 20 °C', { fill: SOFT }),
    curve(F, T, 0, 60),
    `<g clip-path="url(#plot)">${marks.map(([t, v]) => seg(F, t, v, -0.05 * (v - 20), { len: 150, color: BLUE, width: 2 })).join('')}</g>`,
    ...marks.map(([t, v]) => dot(F, t, v, { r: 4.5 })),
    tag(F.sx(5), F.sy(90) + 4, 'T = 90: dT/dt = −3.5 °C per minute', { fill: BLUE, weight: 'bold' }),
    tag(F.sx(16), F.sy(55) - 14, 'T = 55: dT/dt = −1.75', { fill: BLUE, weight: 'bold' }),
    tag(F.sx(41), F.sy(30) - 16, 'T = 30: dT/dt = −0.5', { fill: BLUE, weight: 'bold' }),
    tag(F.sx(38), F.sy(84), 'dT/dt = −0.05(T − 20)', { size: 16, fill: CRIMSON, weight: 'bold' }),
    tag(F.sx(38), F.sy(84) + 22, 'the farther T is from 20, the steeper', { size: 13 }),
  ].join('\n');
  FIGURES[id] = { W: 680, H: 420, title: 'Cooling coffee: the slope depends on the temperature',
    desc: 'The graph of T = 20 + 70e^(−0.05t) for t from 0 to 60 minutes falls from 90 °C toward the dashed room-temperature line at 20 °C. Tangent segments at T = 90, 55 and 30 have slopes −3.5, −1.75 and −0.5 °C per minute, each equal to −0.05 times (T − 20).', body };
}

/* 7.2 A family of functions that all satisfy dy/dx = y - x: y = x + 1 + Ce^x. */
{
  const id = 'solution-family-check';
  const F = frame({ x: [-3, 2], y: [-3, 5], left: 60, top: 36, width: 500, height: 400 });
  const Cs = [-1, -0.5, 0, 0.5, 1];
  const body = [clip(F), axes(F, { xLabel: 'x', yLabel: 'y', edgeTicks: true }),
    ...Cs.filter(C => C !== 0).map(C => curve(F, x => x + 1 + C * Math.exp(x), -3, 2, { color: BLUE, width: 2 })),
    curve(F, x => x + 1, -3, 2, { color: CRIMSON, width: 3 }),
    ...Cs.map(C => { const y = 0.5 + 1 + C * Math.exp(0.5); return seg(F, 0.5, y, y - 0.5, { len: 64, color: INK, width: 3 }) + dot(F, 0.5, y, { color: INK, r: 3.5 }); }),
    tag(F.sx(-2.95), F.sy(4.5), 'dy/dx = y − x', { size: 16, fill: CRIMSON, weight: 'bold' }),
    tag(F.sx(-2.95), F.sy(4.5) + 22, 'y = x + 1 + Ce^x for C = −1, −0.5, 0, 0.5, 1', { size: 13 }),
    tag(F.sx(1.0), F.sy(1.3), 'C = 0: y = x + 1', { fill: CRIMSON, weight: 'bold' }),
    tag(F.sx(-2.95), F.sy(-2.45), 'black segments at x = 0.5: slope y − x = y − 0.5', { size: 12 }),
  ].join('\n');
  FIGURES[id] = { W: 620, H: 480, title: 'Many functions satisfy one differential equation',
    desc: 'Five curves y = x + 1 + Ce^x for C = −1, −0.5, 0, 0.5 and 1 on −3 ≤ x ≤ 2. The C = 0 curve is the line y = x + 1, drawn in crimson. At x = 0.5 each curve carries a short black segment whose slope is y − 0.5, the value of y − x there, showing that every curve satisfies dy/dx = y − x.', body };
}

/* 7.3 A slope field for dy/dx = x + y with the slopes written at nine points. */
{
  const id = 'slope-field-grid';
  const F = frame({ x: [-2.5, 2.5], y: [-2.5, 2.5], left: 60, top: 40, width: 440, height: 440 });
  const g = [-2, -1, 0, 1, 2];
  const labels = [];
  // Each slope label sits at the corner farthest from its own segment.
  for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) {
    const m = x + y, L = Math.hypot(1, m), ux = 1 / L, uy = -m / L;
    const best = [[15, -10], [-15, -10], [15, 18], [-15, 18]].map(([dx, dy]) => ({ dx, dy, d: Math.abs(dx * uy - dy * ux) - (dy > 0 && y === 0 ? 20 : 0) })).sort((a, b) => b.d - a.d)[0];
    labels.push(tag(F.sx(x) + best.dx, F.sy(y) + best.dy + 5, minus(String(m)), { size: 14, fill: CRIMSON, weight: 'bold', anchor: 'middle' }));
  }
  const body = [clip(F), axes(F, { xLabel: 'x', yLabel: 'y', edgeTicks: true }),
    `<rect x="${f2(F.sx(-1.45))}" y="${f2(F.sy(1.45))}" width="${f2(F.sx(1.45) - F.sx(-1.45))}" height="${f2(F.sy(-1.45) - F.sy(1.45))}" fill="${CRIMSON}" fill-opacity="0.06" stroke="${CRIMSON}" stroke-opacity="0.5" stroke-dasharray="4 4"/>`,
    field(F, (x, y) => x + y, g, g, { len: 40, width: 2.4 }),
    ...g.flatMap(x => g.map(y => dot(F, x, y, { color: INK, r: 2.2 }))),
    `<g font-family="${FONT}">${labels.join('')}</g>`,
  ].join('\n');
  const W = 730, H = 520, kx = 536;
  const legend = [
    text(kx, 70, 'dy/dx = x + y', { size: 18, fill: CRIMSON, weight: 'bold' }),
    text(kx, 100, 'At each point, compute x + y', { size: 13 }),
    text(kx, 118, 'and draw a short segment', { size: 13 }),
    text(kx, 136, 'with that slope.', { size: 13 }),
    text(kx, 170, 'Crimson numbers: the slope', { size: 13, fill: CRIMSON }),
    text(kx, 188, 'at the nine boxed points.', { size: 13, fill: CRIMSON }),
    text(kx, 222, 'Slope 0 on the line y = −x', { size: 13 }),
    text(kx, 240, '(horizontal segments).', { size: 13 }),
    text(kx, 274, 'Same x + y, same slope:', { size: 13 }),
    text(kx, 292, 'segments are parallel along', { size: 13 }),
    text(kx, 310, 'each line x + y = constant.', { size: 13 }),
  ].join('');
  FIGURES[id] = { W, H, title: 'A slope field for dy/dx = x + y',
    desc: 'Short segments at the 25 integer points with x and y from −2 to 2. Each segment has slope x + y: slope 0 along the line y = −x, steep positive slopes up to 4 at (2, 2), and steep negative slopes down to −4 at (−2, −2). The nine points with x and y from −1 to 1 are labelled with their slopes.', body: body + legend };
}

/* 7.4 dy/dx = (3 - y)/2: the line y = 3 and two solution curves. */
{
  const id = 'slope-field-solutions';
  const F = frame({ x: [-1, 6], y: [-0.5, 6.5], left: 60, top: 36, width: 520, height: 420 });
  const xs = range(-0.5, 5.5, 0.5), ys = range(0, 6, 0.5);
  const sol = y0 => x => 3 + (y0 - 3) * Math.exp(-x / 2);
  const body = [clip(F), axes(F, { xLabel: 'x', yLabel: 'y', edgeTicks: true }),
    field(F, (x, y) => (3 - y) / 2, xs, ys, { len: 18, color: '#7C8784', width: 1.4 }),
    curve(F, () => 3, -1, 6, { color: GREEN, width: 3, dash: '9 6' }),
    curve(F, sol(1), -1, 6, { color: CRIMSON, width: 3 }),
    curve(F, sol(5.5), -1, 6, { color: BLUE, width: 3 }),
    dot(F, 0, 1), dot(F, 0, 5.5, { color: BLUE }),
    tag(F.sx(0.15), F.sy(0.6) + 18, 'through (0, 1): rises toward y = 3', { fill: CRIMSON, weight: 'bold' }),
    tag(F.sx(0.15), F.sy(5.5) - 10, 'through (0, 5.5): falls toward y = 3', { fill: BLUE, weight: 'bold' }),
    tag(F.sx(0.2), F.sy(3) - 10, 'y = 3: slope 0 at every point', { fill: GREEN, weight: 'bold' }),
    tag(F.sx(3.1), F.sy(5.9), 'dy/dx = (3 − y)/2', { size: 16, fill: INK, weight: 'bold' }),
  ].join('\n');
  FIGURES[id] = { W: 640, H: 500, title: 'Solution curves follow the slope field',
    desc: 'The slope field of dy/dx = (3 − y)/2 drawn every half unit. The dashed green line y = 3 has slope 0 everywhere. A crimson curve through (0, 1) rises and flattens toward y = 3; a blue curve through (0, 5.5) falls and flattens toward y = 3. Neither crosses the line.', body };
}

/* 7.6 dy/dx = xy: the separated family y = Ce^(x^2/2). */
{
  const id = 'separation-family';
  const F = frame({ x: [-2.5, 2.5], y: [-4, 4], left: 60, top: 36, width: 480, height: 420 });
  const xs = range(-2.5, 2.5, 0.5), ys = range(-4, 4, 0.5);
  const Cs = [0.25, 0.5, 1, 2];
  const body = [clip(F), axes(F, { xLabel: 'x', yLabel: 'y', edgeTicks: true }),
    field(F, (x, y) => x * y, xs, ys, { len: 16, color: '#7C8784', width: 1.3 }),
    ...Cs.map(C => curve(F, x => C * Math.exp(x * x / 2), -2.5, 2.5, { color: CRIMSON, width: 2.4 })),
    ...Cs.map(C => curve(F, x => -C * Math.exp(x * x / 2), -2.5, 2.5, { color: BLUE, width: 2.4 })),
    curve(F, () => 0, -2.5, 2.5, { color: GREEN, width: 3 }),
    tag(F.sx(-2.4), F.sy(3.6), 'dy/dx = xy  gives  y = Ce^(x²/2)', { size: 15, weight: 'bold' }),
    tag(F.sx(0.9), F.sy(0.25) - 2, 'C = 0: y = 0', { fill: GREEN, weight: 'bold' }),
    tag(F.sx(-2.4), F.sy(-3.6) + 4, 'C > 0 above (crimson), C < 0 below (blue)', { size: 13 }),
  ].join('\n');
  FIGURES[id] = { W: 600, H: 500, title: 'The curves y = Ce^(x²/2) on the slope field of dy/dx = xy',
    desc: 'The slope field of dy/dx = xy on −2.5 ≤ x ≤ 2.5 and −4 ≤ y ≤ 4, with the curves y = Ce^(x²/2) for C = 0.25, 0.5, 1, 2 in crimson above the x-axis, for C = −0.25, −0.5, −1, −2 in blue below it, and C = 0, the x-axis itself, in green. Each curve is flattest at x = 0 and follows the segments.', body };
}

/* 7.7 dy/dx = y^2, y(0) = 1: y = 1/(1 - x), only for x < 1. */
{
  const id = 'particular-domain';
  const F = frame({ x: [-3, 3], y: [-4, 6], left: 60, top: 36, width: 480, height: 420 });
  const y = x => 1 / (1 - x);
  const body = [clip(F), axes(F, { xLabel: 'x', yLabel: 'y', edgeTicks: true }),
    field(F, (x, yy) => yy * yy, range(-2.5, 2.5, 0.5), range(-3.5, 5.5, 1), { len: 14, color: '#9AA3A0', width: 1.2 }),
    vline(F, 1, { color: INK, dash: '6 5' }),
    curve(F, y, 1.0001, 3, { color: SOFT, width: 2.2, dash: '7 6' }),
    curve(F, y, -3, 0.9999, { color: CRIMSON, width: 3.2, n: 1200 }),
    dot(F, 0, 1),
    tag(F.sx(-2.9), F.sy(5.3), 'dy/dx = y², y(0) = 1', { size: 16, weight: 'bold' }),
    tag(F.sx(-2.9), F.sy(5.3) + 22, 'y = 1/(1 − x), domain x < 1', { size: 14, fill: CRIMSON, weight: 'bold' }),
    tag(F.sx(1.1), F.sy(5.3), 'x = 1: vertical asymptote', { size: 13 }),
    tag(F.sx(1.25), F.sy(-2.4), 'this branch is not part of', { size: 13, fill: SOFT }),
    tag(F.sx(1.25), F.sy(-2.4) + 18, 'the solution through (0, 1)', { size: 13, fill: SOFT }),
    tag(F.sx(0.12), F.sy(1) + 20, '(0, 1)', { size: 13, fill: CRIMSON, weight: 'bold' }),
  ].join('\n');
  FIGURES[id] = { W: 600, H: 500, title: 'A particular solution lives on one interval',
    desc: 'The slope field of dy/dx = y² with the curve y = 1/(1 − x). The crimson branch through the closed point (0, 1) rises without bound as x approaches the dashed vertical asymptote x = 1; it is the solution, with domain x < 1. The grey dashed branch for x > 1, below the x-axis, also fits the equation but is not connected to (0, 1), so it is not part of this solution.', body };
}

/* 7.8 Exponential growth and decay: P = 50e^(0.2t), A = 80e^(-0.3t). */
{
  const id = 'exponential-growth-decay';
  const A = frame({ x: [0, 10], y: [0, 400], left: 60, top: 50, width: 300, height: 300 });
  const B = frame({ x: [0, 10], y: [0, 90], left: 450, top: 50, width: 300, height: 300 });
  const P = t => 50 * Math.exp(0.2 * t), D = t => 80 * Math.exp(-0.3 * t);
  const td = Math.log(2) / 0.2, th = Math.log(2) / 0.3;
  const clip2 = (F, n) => `<clipPath id="${n}"><rect x="${F.left}" y="${F.top}" width="${F.width}" height="${F.height}"/></clipPath>`;
  const body = [`<defs>${clip2(A, 'plot')}${clip2(B, 'plotB')}</defs>`,
    axes(A, { xStep: 2, yStep: 100, xLabel: 't', yLabel: 'P' }),
    axes(B, { xStep: 2, yStep: 20, xLabel: 't', yLabel: 'A' }),
    curve(A, P, 0, 10, { color: CRIMSON, width: 3 }),
    curve(B, D, 0, 10, { color: BLUE, width: 3 }).replace('url(#plot)', 'url(#plotB)'),
    dot(A, 0, 50), dot(A, td, 100, { r: 4 }), dot(A, 2 * td, 200, { r: 4 }),
    `<line x1="${f2(A.sx(td))}" y1="${f2(A.sy(0))}" x2="${f2(A.sx(td))}" y2="${f2(A.sy(100))}" stroke="${SOFT}" stroke-dasharray="4 4"/>`,
    `<line x1="${f2(A.sx(2 * td))}" y1="${f2(A.sy(0))}" x2="${f2(A.sx(2 * td))}" y2="${f2(A.sy(200))}" stroke="${SOFT}" stroke-dasharray="4 4"/>`,
    dot(B, 0, 80, { color: BLUE }), dot(B, th, 40, { color: BLUE, r: 4 }), dot(B, 2 * th, 20, { color: BLUE, r: 4 }),
    `<line x1="${f2(B.sx(th))}" y1="${f2(B.sy(0))}" x2="${f2(B.sx(th))}" y2="${f2(B.sy(40))}" stroke="${SOFT}" stroke-dasharray="4 4"/>`,
    tag(A.sx(0.3), A.sy(380), 'dP/dt = 0.2P, P(0) = 50', { size: 14, fill: CRIMSON, weight: 'bold' }),
    tag(A.sx(0.3), A.sy(380) + 20, 'P = 50e^(0.2t): k > 0, growth', { size: 13 }),
    tag(A.sx(0.3), A.sy(380) + 40, 'doubles every ln 2 / 0.2 ≈ 3.47', { size: 13 }),
    tag(A.sx(td) + 6, A.sy(100) + 4, '100', { size: 12, fill: CRIMSON }),
    tag(A.sx(2 * td) + 6, A.sy(200) + 4, '200', { size: 12, fill: CRIMSON }),
    tag(B.sx(2.2), B.sy(84), 'dA/dt = −0.3A, A(0) = 80', { size: 14, fill: BLUE, weight: 'bold' }),
    tag(B.sx(2.2), B.sy(84) + 20, 'A = 80e^(−0.3t): k < 0, decay', { size: 13 }),
    tag(B.sx(2.2), B.sy(84) + 40, 'halves every ln 2 / 0.3 ≈ 2.31', { size: 13 }),
    tag(B.sx(th) + 6, B.sy(40) - 4, '40', { size: 12, fill: BLUE }),
    tag(B.sx(2 * th) + 6, B.sy(20) - 4, '20', { size: 12, fill: BLUE }),
  ].join('\n');
  FIGURES[id] = { W: 800, H: 400, title: 'Exponential growth and decay from dy/dt = ky',
    desc: 'Left: P = 50e^(0.2t) for t from 0 to 10, starting at 50 and doubling to 100 at t ≈ 3.47 and to 200 at t ≈ 6.93. Right: A = 80e^(−0.3t), starting at 80 and halving to 40 at t ≈ 2.31 and to 20 at t ≈ 4.62.', body };
}

/* 8.1 Average value of f(x) = 6x - x^2 on [0, 6]: 6. */
{
  const id = 'average-value-rectangle';
  const f = x => 6 * x - x * x;
  const F = frame({ x: [-0.5, 6.8], y: [-0.8, 10.5], left: 60, top: 36, width: 520, height: 380 });
  const c1 = 3 - Math.sqrt(3), c2 = 3 + Math.sqrt(3);
  const body = [clip(F), axes(F, { xLabel: 'x', yLabel: 'y', yStep: 2 }),
    shade(F, f, 0, 6, { color: CRIMSON, opacity: 0.16 }),
    `<rect x="${f2(F.sx(0))}" y="${f2(F.sy(6))}" width="${f2(F.sx(6) - F.sx(0))}" height="${f2(F.sy(0) - F.sy(6))}" fill="${BLUE}" fill-opacity="0.12" stroke="${BLUE}" stroke-width="2" stroke-dasharray="7 5"/>`,
    curve(F, f, 0, 6, { color: CRIMSON, width: 3 }),
    dot(F, c1, 6, { color: BLUE, r: 4.5 }), dot(F, c2, 6, { color: BLUE, r: 4.5 }),
    tag(F.sx(6.05), F.sy(6) + 5, 'y = 6', { fill: BLUE, weight: 'bold' }),
    tag(F.sx(3), F.sy(9.6), 'f(x) = 6x − x²', { fill: CRIMSON, weight: 'bold', anchor: 'middle', size: 15 }),
    tag(F.sx(3), F.sy(3.2), 'area under f = 36', { anchor: 'middle', fill: CRIMSON }),
    tag(F.sx(3), F.sy(3.2) + 20, 'rectangle 6 × 6 = 36', { anchor: 'middle', fill: BLUE }),
    tag(F.sx(c1), F.sy(6) - 12, 'x = 3 − √3', { anchor: 'end', size: 12, fill: BLUE }),
    tag(F.sx(c2), F.sy(6) - 12, 'x = 3 + √3', { anchor: 'start', size: 12, fill: BLUE }),
  ].join('\n');
  FIGURES[id] = { W: 640, H: 460, title: 'The average value is the height of the equal-area rectangle',
    desc: 'The parabola f(x) = 6x − x² on 0 ≤ x ≤ 6 with the area under it shaded in crimson, 36 square units. A dashed blue rectangle of width 6 and height 6 has the same area, so the average value of f on [0, 6] is 6. The curve meets the line y = 6 at x = 3 − √3 and x = 3 + √3, marked with blue points.', body };
}

/* 8.2 v(t) = t^2 - 4t + 3 on [0, 4]: displacement 4/3, total distance 4. */
{
  const id = 'velocity-areas';
  const v = t => t * t - 4 * t + 3;
  const F = frame({ x: [-0.3, 4.6], y: [-1.6, 3.6], left: 60, top: 40, width: 540, height: 360 });
  const body = [clip(F), axes(F, { xLabel: 't (seconds)', yLabel: 'v(t) (m/s)', xStep: 1, yStep: 1 }),
    shade(F, v, 0, 1, { color: CRIMSON, opacity: 0.25 }), shade(F, v, 1, 3, { color: BLUE, opacity: 0.25 }), shade(F, v, 3, 4, { color: CRIMSON, opacity: 0.25 }),
    curve(F, v, 0, 4, { color: INK, width: 3 }),
    dot(F, 0, 3, { color: INK, r: 4 }), dot(F, 4, 3, { color: INK, r: 4 }),
    tag(F.sx(0.08), F.sy(0.55), '4/3', { fill: CRIMSON, weight: 'bold', size: 14 }),
    tag(F.sx(2), F.sy(-0.45), 'area 4/3, below the axis', { anchor: 'middle', fill: BLUE, weight: 'bold' }),
    tag(F.sx(3.55), F.sy(0.55), '4/3', { fill: CRIMSON, weight: 'bold', size: 14 }),
    tag(F.sx(2), F.sy(3.2), 'v(t) = t² − 4t + 3', { size: 15, weight: 'bold', anchor: 'middle' }),
    tag(F.sx(2), F.sy(2.45), 'displacement = 4/3 − 4/3 + 4/3 = 4/3 m', { size: 14, anchor: 'middle' }),
    tag(F.sx(2), F.sy(2.45) + 22, 'total distance = 4/3 + 4/3 + 4/3 = 4 m', { size: 14, anchor: 'middle' }),
    tag(F.sx(0.5), F.sy(-1.3), 'moving right (v > 0)', { size: 12, fill: CRIMSON, anchor: 'middle' }),
    tag(F.sx(2), F.sy(-1.3), 'moving left (v < 0)', { size: 12, fill: BLUE, anchor: 'middle' }),
    tag(F.sx(3.5), F.sy(-1.3), 'moving right', { size: 12, fill: CRIMSON, anchor: 'middle' }),
  ].join('\n');
  FIGURES[id] = { W: 660, H: 450, title: 'Displacement and total distance from a velocity graph',
    desc: 'The velocity v(t) = t² − 4t + 3 m/s for 0 ≤ t ≤ 4 s. It is positive on (0, 1) and (3, 4), where the region between the graph and the t-axis is shaded crimson with area 4/3 each, and negative on (1, 3), where the region below the axis is shaded blue with area 4/3. Displacement adds signed areas: 4/3 m. Total distance adds the areas: 4 m.', body };
}

/* 8.3 Rate in R(t) = 10 + 3 sin(pi t/6), rate out D(t) = 4 + t, 0 <= t <= 12. */
{
  const id = 'rate-in-out';
  const R = t => 10 + 3 * Math.sin(Math.PI * t / 6), D = t => 4 + t;
  const F = frame({ x: [-0.5, 12.8], y: [0, 18], left: 64, top: 40, width: 560, height: 360 });
  const body = [clip(F), axes(F, { xLabel: 't (minutes)', yLabel: 'liters per minute', xStep: 2, yStep: 4 }),
    shade(F, R, 0, 6, { g: D, color: GREEN, opacity: 0.22 }), shade(F, D, 6, 12, { g: R, color: VERM, opacity: 0.22 }),
    curve(F, R, 0, 12, { color: BLUE, width: 3 }), curve(F, D, 0, 12, { color: CRIMSON, width: 3 }),
    dot(F, 6, 10, { color: INK, r: 4.5 }),
    tag(F.sx(0.3), F.sy(16.6), 'rate in R(t) = 10 + 3 sin(πt/6)', { fill: BLUE, weight: 'bold' }),
    tag(F.sx(0.3), F.sy(16.6) + 20, 'rate out D(t) = 4 + t', { fill: CRIMSON, weight: 'bold' }),
    tag(F.sx(2.6), F.sy(8.9), 'R > D: amount rising', { fill: '#00704F', weight: 'bold', anchor: 'middle' }),
    tag(F.sx(9.4), F.sy(10.4), 'D > R: amount falling', { fill: '#A34500', weight: 'bold', anchor: 'middle' }),
    `<line x1="${f2(F.sx(6))}" y1="${f2(F.sy(10) + 6)}" x2="${f2(F.sx(6))}" y2="${f2(F.sy(5.9))}" stroke="${INK}" stroke-width="1.2"/>`,
    tag(F.sx(6), F.sy(5.6) + 14, 't = 6: R = D, the amount is greatest', { size: 13, anchor: 'middle' }),
  ].join('\n');
  FIGURES[id] = { W: 680, H: 450, title: 'Rate in, rate out: when the amount rises and falls',
    desc: 'Two rates on 0 ≤ t ≤ 12 minutes: water flows in at R(t) = 10 + 3 sin(πt/6) liters per minute (blue) and out at D(t) = 4 + t liters per minute (crimson). From t = 0 to 6 the rate in is larger and the gap is shaded green: the amount rises. The curves cross at t = 6, where both rates are 10. After that the rate out is larger and the gap is shaded vermillion: the amount falls. The amount is greatest at t = 6.', body };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  mkdirSync(OUT, { recursive: true });
  for (const [id, f] of Object.entries(FIGURES)) writeFileSync(join(OUT, `${id}.svg`), svg(id, f.W, f.H, f.title, f.desc, f.body));
  console.log(`wrote ${Object.keys(FIGURES).length} figures to calculus/figures/`);
}
