/* AP® Precalculus, Unit 4 figures (author F; beyond the exam).

   Every curve is drawn by sampling the function it shows and every vector,
   matrix image and parallelogram is computed from its numbers, so a picture
   can never drift from its caption. Standalone SVG: white background,
   role="img" with <title> and <desc>, Arial/Helvetica, ink #1F2A28, course
   green #11592F for emphasis, Okabe-Ito blue #0072B2 and vermillion #D55E00.

     node scripts/apprecalc-figures/f.mjs             writes precalculus/figures/<id>.svg
                                                       and precalculus/data/figures/<topic>.json
     node scripts/apprecalc-figures/f.mjs --out DIR    writes the SVGs to DIR instead (preview) */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const args = process.argv.slice(2);
const PREVIEW = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
const OUT = PREVIEW || join(ROOT, 'precalculus', 'figures');

const INK = '#1F2A28', GREEN = '#11592F', BLUE = '#0072B2', VERM = '#D55E00', GRID = '#E3E8E6', MUTED = '#5B6664', AXIS = '#7A8583';
const FONT = 'Arial, Helvetica, sans-serif';
const r2 = v => Math.round(v * 100) / 100;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const num = v => String(+v.toFixed(6)).replace('-', '−');
const PI = Math.PI;

/* Text: a plain string, or segments [{ t, i (italic), sub, sup, b }]. */
function text(x, y, s, o = {}) {
  const size = o.size || 14, fill = o.color || INK, anchor = o.anchor || 'start';
  const segs = typeof s === 'string' ? [{ t: s }] : s;
  const body = segs.map(g => {
    const st = [g.i ? 'font-style="italic"' : '', g.b ? 'font-weight="bold"' : '', g.color ? `fill="${g.color}"` : ''].filter(Boolean).join(' ');
    if (g.sub || g.sup) {
      const dy = g.sub ? size * 0.32 : -size * 0.42;
      return `<tspan dy="${r2(dy)}" font-size="${r2(size * 0.7)}" ${st}>${esc(g.t)}</tspan><tspan dy="${r2(-dy)}" font-size="${size}">​</tspan>`;
    }
    return `<tspan ${st}>${esc(g.t)}</tspan>`;
  }).join('');
  return `<text x="${r2(x)}" y="${r2(y)}" font-family="${FONT}" font-size="${size}" fill="${fill}" text-anchor="${anchor}"${o.bold ? ' font-weight="bold"' : ''} paint-order="stroke" stroke="#fff" stroke-width="${o.halo === false ? 0 : 3.5}" stroke-linejoin="round">${body}</text>`;
}
const I = t => ({ t, i: true });

/* A coordinate panel: pixel box [px, py, pw, ph] showing x in [x0, x1], y in [y0, y1], equal scale optional. */
function panel(box, xr, yr, o = {}) {
  const [px, py, pw, ph] = box;
  const sx = v => px + (v - xr[0]) / (xr[1] - xr[0]) * pw;
  const sy = v => py + (yr[1] - v) / (yr[1] - yr[0]) * ph;
  const out = [];
  const xs = o.xStep || 1, ys = o.yStep || 1;
  if (o.grid !== false) {
    for (let v = Math.ceil(xr[0] / xs) * xs; v <= xr[1] + 1e-9; v += xs) out.push(`<line x1="${r2(sx(v))}" y1="${py}" x2="${r2(sx(v))}" y2="${py + ph}" stroke="${GRID}" stroke-width="1"/>`);
    for (let v = Math.ceil(yr[0] / ys) * ys; v <= yr[1] + 1e-9; v += ys) out.push(`<line x1="${px}" y1="${r2(sy(v))}" x2="${px + pw}" y2="${r2(sy(v))}" stroke="${GRID}" stroke-width="1"/>`);
  }
  const ax = Math.min(Math.max(0, yr[0]), yr[1]), ay = Math.min(Math.max(0, xr[0]), xr[1]);
  out.push(`<line x1="${px}" y1="${r2(sy(ax))}" x2="${px + pw}" y2="${r2(sy(ax))}" stroke="${AXIS}" stroke-width="1.4"/>`);
  out.push(`<line x1="${r2(sx(ay))}" y1="${py}" x2="${r2(sx(ay))}" y2="${py + ph}" stroke="${AXIS}" stroke-width="1.4"/>`);
  const lx = o.xLabelEvery || xs, ly = o.yLabelEvery || ys;
  for (let v = Math.ceil(xr[0] / lx) * lx; v <= xr[1] + 1e-9; v += lx) {
    if (Math.abs(v) < 1e-9 || (o.skipX || []).includes(v)) continue;
    out.push(text(sx(v), sy(ax) + 15, num(v), { size: 11, anchor: 'middle', color: MUTED }));
  }
  for (let v = Math.ceil(yr[0] / ly) * ly; v <= yr[1] + 1e-9; v += ly) {
    if (Math.abs(v) < 1e-9 || (o.skipY || []).includes(v)) continue;
    out.push(text(sx(ay) - 5, sy(v) + 4, num(v), { size: 11, anchor: 'end', color: MUTED }));
  }
  if (o.origin !== false && xr[0] < 0 && yr[0] < 0) out.push(text(sx(0) - 5, sy(0) + 15, '0', { size: 11, anchor: 'end', color: MUTED }));
  out.push(text(px + pw - 2, sy(ax) - 6, [I(o.xLabel || 'x')], { size: 13, anchor: 'end', color: MUTED }));
  out.push(text(sx(ay) + 6, py + 12, [I(o.yLabel || 'y')], { size: 13, color: MUTED }));
  return { sx, sy, svg: out, box };
}

function polyline(P, pts, o = {}) {
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${r2(P.sx(x))},${r2(P.sy(y))}`).join(' ');
  return `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.color || GREEN}" stroke-width="${o.width || 2.6}"${o.dashed ? ' stroke-dasharray="6 5"' : ''} stroke-linejoin="round" stroke-linecap="round"${o.opacity ? ` fill-opacity="${o.opacity}"` : ''}/>`;
}
const sampleParam = (f, a, b, n = 400) => Array.from({ length: n + 1 }, (_, i) => f(a + (b - a) * i / n));
const sampleFn = (g, a, b, n = 300) => Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return [x, g(x)]; }).filter(p => Number.isFinite(p[1]));

/* An arrowhead in pixel space at (x, y) pointing along (dx, dy). */
function head(x, y, dx, dy, color, size = 10) {
  const L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  const bx = x - ux * size, by = y - uy * size, w = size * 0.5;
  return `<path d="M${r2(x)},${r2(y)} L${r2(bx - uy * w)},${r2(by + ux * w)} L${r2(bx + uy * w)},${r2(by - ux * w)} Z" fill="${color}"/>`;
}
/* Direction arrows on a parametric curve at parameter values ts. */
function travelArrows(P, f, ts, color = GREEN) {
  return ts.map(t => {
    const a = f(t - 0.01), b = f(t + 0.01), m = f(t);
    return head(P.sx(m[0]) + (P.sx(b[0]) - P.sx(a[0])) * 0 , P.sy(m[1]), P.sx(b[0]) - P.sx(a[0]), P.sy(b[1]) - P.sy(a[1]), color, 11);
  });
}
function dot(P, [x, y], o = {}) {
  return `<circle cx="${r2(P.sx(x))}" cy="${r2(P.sy(y))}" r="${o.r || 4.2}" fill="${o.open ? '#fff' : (o.color || INK)}" stroke="${o.color || INK}" stroke-width="1.8"/>`;
}
function label(P, [x, y], s, dx = 6, dy = -6, o = {}) { return text(P.sx(x) + dx, P.sy(y) + dy, s, o); }
/* A vector arrow from point a to point b (math coordinates). */
function vec(P, a, b, o = {}) {
  const x1 = P.sx(a[0]), y1 = P.sy(a[1]), x2 = P.sx(b[0]), y2 = P.sy(b[1]);
  const L = Math.hypot(x2 - x1, y2 - y1), s = (L - 9) / L;
  const color = o.color || BLUE;
  return `<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x1 + (x2 - x1) * s)}" y2="${r2(y1 + (y2 - y1) * s)}" stroke="${color}" stroke-width="${o.width || 2.6}"${o.dashed ? ' stroke-dasharray="6 4"' : ''}/>` + head(x2, y2, x2 - x1, y2 - y1, color, 12);
}
function poly(P, pts, o = {}) {
  return `<polygon points="${pts.map(([x, y]) => `${r2(P.sx(x))},${r2(P.sy(y))}`).join(' ')}" fill="${o.fill || 'none'}" fill-opacity="${o.opacity ?? 0.18}" stroke="${o.color || GREEN}" stroke-width="${o.width || 2}"${o.dashed ? ' stroke-dasharray="5 4"' : ''}/>`;
}
function svgDoc(w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<rect width="${w}" height="${h}" fill="#fff"/>
${body.flat().join('\n')}
</svg>
`;
}

const FIGS = [];
function fig(topic, id, w, h, title, alt, body) { FIGS.push({ topic, id, w, h, title, alt, svg: svgDoc(w, h, title, alt, body) }); }
const tlabel = t => [I('t'), { t: ' = ' + num(t) }];

/* ---------------------------------------------------------- 4.1 */
{
  const f = t => [t * t - 2 * t, 2 * t - 1];
  const P = panel([40, 16, 380, 300], [-2, 5], [-4, 6], { xStep: 1, yStep: 1 });
  const ts = [-1, 0, 1, 2, 3];
  fig('parametric-functions', 'parametric-functions-trace', 460, 350, 'A parametric curve traced as t increases',
    'The curve x(t) = t squared minus 2t, y(t) = 2t minus 1 for t from -1 to 3, a parabola opening to the right. Points are marked at t = -1 (3, -3), t = 0 (0, -1), t = 1 (-1, 1), t = 2 (0, 3) and t = 3 (3, 5). Arrows show the point moves left and up until t = 1, then right and up.',
    [P.svg, polyline(P, sampleParam(f, -1, 3)), travelArrows(P, f, [-0.5, 0.5, 1.5, 2.5]),
      ts.map(t => dot(P, f(t))), ts.map(t => label(P, f(t), [...tlabel(t), { t: '  (' + f(t).map(num).join(', ') + ')' }], t === 1 ? -8 : 10, t === 1 ? -8 : t === 0 ? 16 : 4, { size: 12, anchor: t === 1 ? 'end' : 'start' }))]);
}
{
  const f = t => [t * t - 4, t * t * t - 4 * t];
  const P = panel([40, 16, 380, 320], [-5, 3], [-6, 6], { xStep: 1, yStep: 1, yLabelEvery: 2 });
  const ts = [-2, -1, 0, 1, 2];
  const off = { '-1': [8, -8], '0': [-8, -8], '1': [8, 14] };
  fig('parametric-functions', 'parametric-functions-loop', 460, 370, 'A parametric path that crosses itself',
    'The path x(t) = t squared minus 4, y(t) = t cubed minus 4t for t from -2.5 to 2.5. Points are marked at t = -2 (0, 0), t = -1 (-3, 3), t = 0 (-4, 0), t = 1 (-3, -3) and t = 2 (0, 0). Arrows show the direction of travel: in from the lower right, up through the origin, around a loop on the left going counterclockwise in the order t = -1, 0, 1, back through the origin, and out to the upper right.',
    [P.svg, polyline(P, sampleParam(f, -2.5, 2.5)), travelArrows(P, f, [-2.3, -1.5, -0.5, 0.5, 1.5, 2.3]),
      ts.map(t => dot(P, f(t))), [-1, 0, 1].map(t => label(P, f(t), tlabel(t), off[t][0], off[t][1], { size: 12, anchor: t === 0 ? 'end' : 'start' })),
      label(P, [0, 0], [I('t'), { t: ' = −2 and ' }, I('t'), { t: ' = 2' }], 14, -5, { size: 12 })]);
}

/* ---------------------------------------------------------- 4.2 */
{
  const f = t => [t ** 3 - 6 * t * t + 9 * t, 4 * t - t * t];
  const P = panel([40, 16, 380, 250], [-1, 5], [-1, 5], { xStep: 1, yStep: 1 });
  const ts = [0, 1, 2, 3, 4];
  const off = { 0: [10, 16], 1: [8, -8], 2: [-8, -10], 3: [-10, -8], 4: [8, -8] };
  fig('parametric-motion', 'parametric-motion-path', 460, 300, 'The path of a particle from t = 0 to t = 4',
    'The path of a particle with x(t) = t cubed minus 6t squared plus 9t and y(t) = 4t minus t squared for t from 0 to 4. It starts at (0, 0) at t = 0, moves right and up to (4, 3) at t = 1, turns and moves left through (2, 4) at t = 2, the highest point, to (0, 3) at t = 3, then turns again and moves right and down to (4, 0) at t = 4, crossing its earlier path near (2, 1).',
    [P.svg, polyline(P, sampleParam(f, 0, 4)), travelArrows(P, f, [0.5, 1.6, 2.5, 3.6]),
      ts.map(t => dot(P, f(t))), ts.map(t => label(P, f(t), [...tlabel(t), { t: ' (' + f(t).map(num).join(', ') + ')' }], off[t][0], off[t][1], { size: 12, anchor: off[t][0] < 0 ? 'end' : 'start' }))]);
}

/* ---------------------------------------------------------- 4.3 */
{
  const f = t => [t * t + 1, 4 * t - t * t];
  const mk = (id, secant, title, alt) => {
    const P = panel([40, 16, 400, 250], [-1, 18], [-2, 6], { xStep: 1, yStep: 1, xLabelEvery: 2 });
    const ts = [0, 1, 2, 3, 4];
    const body = [P.svg, polyline(P, sampleParam(f, 0, 4)), travelArrows(P, f, [0.5, 1.5, 2.5, 3.5])];
    if (secant) {
      const a = f(0), b = f(2);
      body.push(`<line x1="${r2(P.sx(a[0]))}" y1="${r2(P.sy(a[1]))}" x2="${r2(P.sx(b[0]))}" y2="${r2(P.sy(b[1]))}" stroke="${VERM}" stroke-width="2.2"/>`);
      body.push(`<line x1="${r2(P.sx(a[0]))}" y1="${r2(P.sy(a[1]))}" x2="${r2(P.sx(b[0]))}" y2="${r2(P.sy(a[1]))}" stroke="${BLUE}" stroke-width="1.8" stroke-dasharray="5 4"/>`);
      body.push(`<line x1="${r2(P.sx(b[0]))}" y1="${r2(P.sy(a[1]))}" x2="${r2(P.sx(b[0]))}" y2="${r2(P.sy(b[1]))}" stroke="${BLUE}" stroke-width="1.8" stroke-dasharray="5 4"/>`);
      body.push(text((P.sx(a[0]) + P.sx(b[0])) / 2, P.sy(0) + 30, [{ t: 'change in ' }, I('x'), { t: ' = 4' }], { size: 12, anchor: 'middle', color: BLUE }));
      body.push(text(P.sx(b[0]) + 6, (P.sy(0) + P.sy(4)) / 2 + 22, [{ t: 'change in ' }, I('y'), { t: ' = 4' }], { size: 12, color: BLUE }));
      body.push(text(P.sx(2.4), P.sy(2.3), [{ t: 'slope 1' }], { size: 12, color: VERM, anchor: 'end' }));
    }
    body.push(ts.map(t => dot(P, f(t))));
    body.push(ts.map(t => label(P, f(t), tlabel(t), t === 0 ? -6 : t === 4 ? -6 : 0, t === 0 ? -8 : t === 4 ? -12 : -10, { size: 12, anchor: t === 0 || t === 4 ? 'end' : 'middle' })));
    fig('parametric-rates', id, 480, 300, title, alt, body);
  };
  mk('parametric-rates-secant', true, 'The segment between two points of a parametric curve',
    'The curve x(t) = t squared plus 1, y(t) = 4t minus t squared for t from 0 to 4, with points at t = 0 (1, 0), t = 1 (2, 3), t = 2 (5, 4), t = 3 (10, 3) and t = 4 (17, 0). A segment joins the points for t = 0 and t = 2; dashed legs show a change in x of 4 and a change in y of 4, so the segment has slope 1.');
  mk('parametric-rates-curve', false, 'A parametric curve with five marked points',
    'The curve x(t) = t squared plus 1, y(t) = 4t minus t squared for t from 0 to 4, moving right the whole time, rising to a top point and falling again. Points are marked at t = 0 (1, 0), t = 1 (2, 3), t = 2 (5, 4), t = 3 (10, 3) and t = 4 (17, 0).');
}

/* ---------------------------------------------------------- 4.4 */
{
  // Lesson: a circle of radius 2 about the origin with the angle t, and a segment from A to B.
  const P = panel([30, 16, 260, 260], [-3, 3], [-3, 3], { xStep: 1, yStep: 1 });
  const c = t => [2 * Math.cos(t), 2 * Math.sin(t)];
  const t0 = PI / 3, pt = c(t0);
  const arc = sampleParam(t => [0.7 * Math.cos(t), 0.7 * Math.sin(t)], 0, t0, 40);
  const Q = panel([330, 16, 260, 260], [-1, 6], [-1, 6], { xStep: 1, yStep: 1 });
  const A = [1, 4], B = [5, 1], seg = t => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
  fig('parametric-circles-lines', 'parametric-circles-lines-both', 620, 300, 'A parametric circle and a parametric line segment',
    'Left: the circle x(t) = 2 cos t, y(t) = 2 sin t. The radius to the point at t = pi/3 makes angle t with the positive x-axis; the trip starts at (2, 0) when t = 0 and arrows show counterclockwise travel. Right: the segment x(t) = 1 + 4t, y(t) = 4 minus 3t from (1, 4) at t = 0 to (5, 1) at t = 1, with the midpoint (3, 2.5) at t = 0.5.',
    [P.svg, polyline(P, sampleParam(c, 0, 2 * PI)), travelArrows(P, c, [PI / 2 + 0.3, PI + 0.4, 3 * PI / 2 + 0.3]),
      `<line x1="${r2(P.sx(0))}" y1="${r2(P.sy(0))}" x2="${r2(P.sx(pt[0]))}" y2="${r2(P.sy(pt[1]))}" stroke="${BLUE}" stroke-width="2"/>`,
      polyline(P, arc, { color: VERM, width: 1.8 }), text(P.sx(0.75), P.sy(0.42), [I('t')], { size: 13, color: VERM }),
      dot(P, pt, { color: GREEN }), label(P, pt, [{ t: '(2 cos ' }, I('t'), { t: ', 2 sin ' }, I('t'), { t: ')' }], 6, -6, { size: 12 }),
      dot(P, [2, 0]), label(P, [2, 0], [I('t'), { t: ' = 0' }], 6, 16, { size: 12 }),
      Q.svg, polyline(Q, [A, B], { color: GREEN }), head(Q.sx(4), Q.sy(seg(0.75)[1]), Q.sx(B[0]) - Q.sx(A[0]), Q.sy(B[1]) - Q.sy(A[1]), GREEN, 11),
      [0, 0.5, 1].map(t => dot(Q, seg(t))), label(Q, A, [I('t'), { t: ' = 0  (1, 4)' }], 8, -8, { size: 12 }),
      label(Q, seg(0.5), [I('t'), { t: ' = 0.5' }], 8, -8, { size: 12 }), label(Q, B, [I('t'), { t: ' = 1  (5, 1)' }], -4, 18, { size: 12, anchor: 'middle' })]);
}
{
  const P = panel([40, 16, 330, 330], [-2, 6], [-3, 5], { xStep: 1, yStep: 1 });
  const c = t => [2 + 3 * Math.cos(t), 1 + 3 * Math.sin(t)];
  fig('parametric-circles-lines', 'parametric-circles-lines-circle', 400, 380, 'A circle traced counterclockwise from t = 0',
    'A circle with center (2, 1) and radius 3. The trip starts at (5, 1), marked t = 0, and arrows show counterclockwise travel. The center is marked.',
    [P.svg, polyline(P, sampleParam(c, 0, 2 * PI)), travelArrows(P, c, [PI / 4, 3 * PI / 4, 5 * PI / 4, 7 * PI / 4]),
      dot(P, [2, 1], { r: 3.5 }), label(P, [2, 1], '(2, 1)', 6, 16, { size: 12 }), dot(P, [5, 1], { color: GREEN }), label(P, [5, 1], [I('t'), { t: ' = 0' }], 8, 16, { size: 12 })]);
}
{
  const P = panel([40, 16, 330, 230], [-3, 7], [-1, 6], { xStep: 1, yStep: 1 });
  const A = [-2, 5], B = [6, 1];
  fig('parametric-circles-lines', 'parametric-circles-lines-segment', 400, 280, 'A drone flying a straight segment',
    'A straight segment from (-2, 5), marked t = 0, to (6, 1), marked t = 4, with an arrow pointing from the first point toward the second.',
    [P.svg, polyline(P, [A, B]), head(P.sx(3), P.sy(2.5), P.sx(B[0]) - P.sx(A[0]), P.sy(B[1]) - P.sy(A[1]), GREEN, 12),
      dot(P, A), dot(P, B), label(P, A, [I('t'), { t: ' = 0  (−2, 5)' }], 8, -8, { size: 12 }), label(P, B, [I('t'), { t: ' = 4  (6, 1)' }], -10, 20, { size: 12, anchor: 'end' })]);
}

/* ---------------------------------------------------------- 4.5 */
{
  const P = panel([40, 16, 300, 300], [-6, 6], [-6, 6], { xStep: 1, yStep: 1, xLabelEvery: 2, yLabelEvery: 2 });
  const up = x => Math.sqrt(25 - x * x), lo = x => -Math.sqrt(25 - x * x);
  fig('implicit-functions', 'implicit-functions-halves', 380, 350, 'A circle split into two functions',
    'The circle x squared plus y squared = 25. Its upper half, y = the square root of 25 minus x squared, is drawn in green and its lower half, y = minus the square root of 25 minus x squared, in blue. A dashed vertical line at x = 3 meets the circle twice, at (3, 4) and (3, -4).',
    [P.svg, polyline(P, sampleFn(up, -5, 5, 600).concat([[5, 0]]), { color: GREEN }), polyline(P, [[-5, 0], ...sampleFn(lo, -5, 5, 600), [5, 0]], { color: BLUE }),
      `<line x1="${r2(P.sx(3))}" y1="${P.box[1]}" x2="${r2(P.sx(3))}" y2="${P.box[1] + P.box[3]}" stroke="${VERM}" stroke-width="1.8" stroke-dasharray="6 5"/>`,
      dot(P, [3, 4]), dot(P, [3, -4]), label(P, [3, 4], '(3, 4)', 8, -6, { size: 12 }), label(P, [3, -4], '(3, −4)', 8, 16, { size: 12 }),
      text(P.sx(-3.2), P.sy(4.6), 'upper half', { size: 12, color: GREEN, anchor: 'end' }), text(P.sx(-3.2), P.sy(-4.6) + 10, 'lower half', { size: 12, color: BLUE, anchor: 'end' })]);
}

/* ---------------------------------------------------------- 4.6 */
{
  const W = 200, body = [];
  const P1 = panel([30, 30, 170, 170], [-4, 4], [-2, 6], { xStep: 1, yStep: 1, xLabelEvery: 2, yLabelEvery: 2 });
  body.push(P1.svg, polyline(P1, sampleFn(x => 0.5 * x * x, -3.4, 3.4)), dot(P1, [0, 0]), text(115, 20, 'Parabola', { size: 14, anchor: 'middle', bold: true }));
  body.push(text(115, 228, [I('y'), { t: ' = 0.5' }, I('x'), { t: '2', sup: true }], { size: 13, anchor: 'middle' }));
  const P2 = panel([30 + W + 20, 30, 170, 170], [-4, 4], [-4, 4], { xStep: 1, yStep: 1, xLabelEvery: 2, yLabelEvery: 2 });
  const e = t => [3 * Math.cos(t), 2 * Math.sin(t)];
  body.push(P2.svg, polyline(P2, sampleParam(e, 0, 2 * PI)), [[3, 0], [-3, 0], [0, 2], [0, -2]].map(p => dot(P2, p, { r: 3.4 })), text(30 + W + 20 + 85, 20, 'Ellipse', { size: 14, anchor: 'middle', bold: true }));
  body.push(text(30 + W + 20 + 85, 228, [I('x'), { t: '2', sup: true }, { t: '/9 + ' }, I('y'), { t: '2', sup: true }, { t: '/4 = 1' }], { size: 13, anchor: 'middle' }));
  const P3 = panel([30 + 2 * (W + 20), 30, 170, 170], [-4, 4], [-4, 4], { xStep: 1, yStep: 1, xLabelEvery: 2, yLabelEvery: 2 });
  const hb = x => 1.5 * Math.sqrt(x * x - 1);
  for (const s of [1, -1]) for (const g of [1, -1]) body.push(polyline(P3, sampleFn(x => g * hb(x), s > 0 ? 1 : -2.85, s > 0 ? 2.85 : -1, 300).sort((a, b) => a[0] - b[0])));
  body.push(polyline(P3, [[-2.7, -4], [2.7, 4]], { color: VERM, width: 1.6, dashed: true }), polyline(P3, [[-2.7, 4], [2.7, -4]], { color: VERM, width: 1.6, dashed: true }));
  body.unshift(P3.svg);
  body.push([[1, 0], [-1, 0]].map(p => dot(P3, p, { r: 3.4 })), text(30 + 2 * (W + 20) + 85, 20, 'Hyperbola', { size: 14, anchor: 'middle', bold: true }));
  body.push(text(30 + 2 * (W + 20) + 85, 228, [I('x'), { t: '2', sup: true }, { t: ' − ' }, I('y'), { t: '2', sup: true }, { t: '/2.25 = 1' }], { size: 13, anchor: 'middle' }));
  fig('conic-sections', 'conic-sections-three', 660, 245, 'The three conic sections',
    'Three graphs. Left: the parabola y = 0.5 x squared with its vertex at the origin. Middle: the ellipse x squared over 9 plus y squared over 4 = 1, centered at the origin, with vertices (3, 0) and (-3, 0) and the ends of the short axis at (0, 2) and (0, -2). Right: the hyperbola x squared minus y squared over 2.25 = 1, with vertices (1, 0) and (-1, 0), two branches opening left and right, and dashed asymptotes y = 1.5x and y = -1.5x.',
    body);
}

/* ---------------------------------------------------------- 4.7 */
{
  const P = panel([40, 16, 340, 260], [-4, 4], [-3, 3], { xStep: 1, yStep: 1 });
  const e = t => [3 * Math.cos(t), 2 * Math.sin(t)];
  const t0 = PI / 4, pt = e(t0);
  fig('parametrizing-implicit', 'parametrizing-implicit-ellipse', 400, 310, 'An ellipse traced by (3 cos t, 2 sin t)',
    'The ellipse x squared over 9 plus y squared over 4 = 1 traced by x(t) = 3 cos t, y(t) = 2 sin t. The trip starts at (3, 0) when t = 0 and arrows show counterclockwise travel. The point for t = pi/4 is marked at (3 cos(pi/4), 2 sin(pi/4)), about (2.12, 1.41); a dashed circle of radius 3 and the ellipse share the x-coordinate 3 cos t.',
    [P.svg, polyline(P, sampleParam(t => [3 * Math.cos(t), 3 * Math.sin(t)], 0, 2 * PI), { color: MUTED, width: 1.2, dashed: true }),
      polyline(P, sampleParam(e, 0, 2 * PI)), travelArrows(P, e, [PI / 2 + 0.2, PI + 0.3, 3 * PI / 2 + 0.2]),
      `<line x1="${r2(P.sx(pt[0]))}" y1="${r2(P.sy(3 * Math.sin(t0)))}" x2="${r2(P.sx(pt[0]))}" y2="${r2(P.sy(0))}" stroke="${BLUE}" stroke-width="1.6" stroke-dasharray="4 4"/>`,
      dot(P, pt, { color: GREEN }), label(P, pt, [{ t: '(3 cos ' }, I('t'), { t: ', 2 sin ' }, I('t'), { t: ')' }], 8, 14, { size: 12 }),
      dot(P, [3, 0]), label(P, [3, 0], [I('t'), { t: ' = 0' }], 6, 16, { size: 12 })]);
}
{
  const P = panel([40, 16, 340, 260], [-3, 5], [-1, 5], { xStep: 1, yStep: 1 });
  const e = t => [1 + 3 * Math.cos(t), 2 + 2 * Math.sin(t)];
  fig('parametrizing-implicit', 'parametrizing-implicit-s1', 400, 310, 'An ellipse with a marked starting point',
    'An ellipse with center (1, 2), reaching 3 units left and right of the center and 2 units above and below it. The trip starts at (4, 2), marked t = 0, and arrows show counterclockwise travel.',
    [P.svg, polyline(P, sampleParam(e, 0, 2 * PI)), travelArrows(P, e, [PI / 4, 3 * PI / 4, 5 * PI / 4, 7 * PI / 4]),
      dot(P, [1, 2], { r: 3.4 }), label(P, [1, 2], '(1, 2)', 6, 16, { size: 12 }), dot(P, [4, 2], { color: GREEN }), label(P, [4, 2], [I('t'), { t: ' = 0' }], 8, 16, { size: 12 })]);
}

/* ---------------------------------------------------------- 4.8 */
{
  const P = panel([40, 16, 300, 240], [-1, 5], [-1, 4], { xStep: 1, yStep: 1 });
  const u = [3, 1], v = [1, 2];
  fig('vectors', 'vectors-sum', 380, 290, 'Adding two vectors tip to tail',
    'Vector u = <3, 1> drawn from the origin to (3, 1) in green, vector v = <1, 2> drawn from the tip of u at (3, 1) to (4, 3) in blue, and their sum u + v = <4, 3> drawn from the origin to (4, 3) in vermillion. The sum has length 5.',
    [P.svg, vec(P, [0, 0], u, { color: GREEN }), vec(P, u, [4, 3], { color: BLUE }), vec(P, [0, 0], [4, 3], { color: VERM }),
      label(P, [1.6, 0.5], [{ t: 'u', b: true }, { t: ' = ⟨3, 1⟩' }], 0, 18, { size: 13, color: GREEN }),
      label(P, [3.5, 2], [{ t: 'v', b: true }, { t: ' = ⟨1, 2⟩' }], 8, 4, { size: 13, color: BLUE }),
      label(P, [2, 1.5], [{ t: 'u', b: true }, { t: ' + ' }, { t: 'v', b: true }, { t: ' = ⟨4, 3⟩' }], -6, -8, { size: 13, color: VERM, anchor: 'end' })]);
}
{
  const P = panel([40, 16, 320, 260], [-1, 6], [-1, 5], { xStep: 1, yStep: 1 });
  fig('vectors', 'vectors-grid', 400, 310, 'Two vectors on a grid',
    'Vector u drawn from (0, 0) to (4, 1) in green. Vector v drawn from (2, 1) to (1, 4) in blue. Both start and end at grid points.',
    [P.svg, vec(P, [0, 0], [4, 1], { color: GREEN }), vec(P, [2, 1], [1, 4], { color: BLUE }), dot(P, [2, 1], { r: 3, color: BLUE }),
      label(P, [2.6, 0.6], [{ t: 'u', b: true }], 0, 18, { size: 14, color: GREEN }), label(P, [1.5, 2.6], [{ t: 'v', b: true }], -10, 0, { size: 14, color: BLUE, anchor: 'end' }),
      label(P, [2, 1], '(2, 1)', 8, -6, { size: 11, color: MUTED }), label(P, [4, 1], '(4, 1)', 6, 14, { size: 11, color: MUTED }), label(P, [1, 4], '(1, 4)', 6, -4, { size: 11, color: MUTED })]);
}

/* ---------------------------------------------------------- 4.9 */
{
  const f = t => [2 * t, 6 * t - t * t];
  const mk = (id, a, b, disp, title, alt) => {
    const P = panel([40, 16, 400, 250], [-1, 13], [-1, 10], { xStep: 1, yStep: 1, xLabelEvery: 2, yLabelEvery: 2 });
    const body = [P.svg, polyline(P, sampleParam(f, 0, 6)), travelArrows(P, f, [0.5, 2.2, 3.8, 5.5]),
      vec(P, [0, 0], f(a), { color: BLUE, width: 2 }), vec(P, [0, 0], f(b), { color: BLUE, width: 2 })];
    if (disp) body.push(vec(P, f(a), f(b), { color: VERM, width: 2.2 }));
    body.push([0, 1, 2, 3, 4, 5, 6].map(t => dot(P, f(t), { r: 3.4 })));
    body.push([0, 1, 2, 3, 4, 5, 6].map(t => label(P, f(t), tlabel(t), t >= 3 ? 6 : -6, t === 3 ? -10 : -6, { size: 11, anchor: t >= 3 ? 'start' : 'end' })));
    body.push(label(P, [f(a)[0] / 2, f(a)[1] / 2], [{ t: 'p', b: true }, { t: '(' + a + ')' }], 8, 4, { size: 13, color: BLUE }));
    body.push(label(P, [f(b)[0] * 0.6, f(b)[1] * 0.6], [{ t: 'p', b: true }, { t: '(' + b + ')' }], 8, 12, { size: 13, color: BLUE }));
    if (disp) body.push(label(P, [(f(a)[0] + f(b)[0]) / 2, (f(a)[1] + f(b)[1]) / 2], 'displacement', 0, -10, { size: 12, color: VERM, anchor: 'middle' }));
    fig('vector-valued-functions', id, 480, 300, title, alt, body);
  };
  mk('vector-valued-functions-displacement', 1, 3, true, 'Position vectors and a displacement vector',
    'The path of p(t) = <2t, 6t minus t squared> for t from 0 to 6, an arch from (0, 0) up to (6, 9) at t = 3 and down to (12, 0) at t = 6, with points at each whole t. Position vectors p(1) = <2, 5> and p(3) = <6, 9> are drawn from the origin in blue, and the displacement vector p(3) minus p(1) = <4, 4> is drawn from the tip of p(1) to the tip of p(3) in vermillion.');
  mk('vector-valued-functions-path', 1, 4, false, 'A path traced by a vector-valued function',
    'The path of a vector-valued function for t from 0 to 6, an arch through (0, 0), (2, 5), (4, 8), (6, 9), (8, 8), (10, 5) and (12, 0) at t = 0, 1, 2, 3, 4, 5 and 6. Position vectors p(1) and p(4) are drawn from the origin to (2, 5) and (8, 8).');
}

/* ---------------------------------------------------------- 4.10 */
{
  const body = [];
  const cell = (x, y, s, hi) => [hi ? `<rect x="${x - 22}" y="${y - 20}" width="44" height="30" rx="5" fill="${hi}" fill-opacity="0.16"/>` : '', text(x, y, s, { size: 17, anchor: 'middle' })];
  const bracket = (x, y, h, right) => `<path d="M${x + (right ? -8 : 8)},${y} H${x} V${y + h} H${x + (right ? -8 : 8)}" fill="none" stroke="${INK}" stroke-width="2"/>`;
  // A (2x2) times B (2x2) = AB, row 1 of A and column 2 of B highlighted.
  const A = [[2, -1], [0, 3]], B = [[1, 4], [-2, 1]], AB = [[4, 7], [-6, 3]];
  const draw = (M, x0, y0, hiRow, hiCol, color) => {
    M.forEach((r, i) => r.forEach((v, j) => body.push(cell(x0 + 50 * j, y0 + 44 * i, num(v), (i === hiRow || j === hiCol) ? color : null))));
    body.push(bracket(x0 - 30, y0 - 28, 92, false), bracket(x0 + 80, y0 - 28, 92, true));
  };
  draw(A, 60, 70, 0, -1, GREEN); body.push(text(12, 105, 'A', { size: 18, bold: true }));
  draw(B, 230, 70, -1, 1, BLUE); body.push(text(180, 105, 'B', { size: 18, bold: true }));
  body.push(text(345, 105, '=', { size: 22, anchor: 'middle' }));
  draw(AB, 410, 70, -1, -1, null);
  body.push(`<rect x="438" y="50" width="44" height="30" rx="5" fill="${VERM}" fill-opacity="0.2" stroke="${VERM}" stroke-width="1.6"/>`);
  body.push(text(290, 190, [{ t: 'Row 1 of ', color: GREEN }, { t: 'A', b: true, color: GREEN }, { t: ' times column 2 of ', color: BLUE }, { t: 'B', b: true, color: BLUE }, { t: ':  2(4) + (−1)(1) = 7' }], { size: 15, anchor: 'middle' }));
  body.push(text(290, 214, 'Multiply matching entries and add; 7 goes in row 1, column 2 of the product.', { size: 13, anchor: 'middle', color: MUTED }));
  fig('matrices', 'matrices-row-column', 580, 235, 'One entry of a matrix product, row times column',
    'Matrix A with rows (2, -1) and (0, 3) times matrix B with rows (1, 4) and (-2, 1) equals the product with rows (4, 7) and (-6, 3). Row 1 of A and column 2 of B are highlighted, and the entry 7 in row 1, column 2 of the product is boxed: 2 times 4 plus (-1) times 1 = 7.',
    body);
}

/* ---------------------------------------------------------- 4.11 */
{
  const mk = (id, u, v, o, title, alt) => {
    const P = panel([40, 16, o.pw, o.ph], o.xr, o.yr, { xStep: 1, yStep: 1 });
    const s = [u[0] + v[0], u[1] + v[1]];
    const body = [P.svg, poly(P, [[0, 0], u, s, v], { fill: GREEN, color: GREEN, width: 1.6 })];
    if (o.vectors) body.push(vec(P, [0, 0], u, { color: BLUE }), vec(P, [0, 0], v, { color: VERM }),
      label(P, u, `⟨${u.join(', ')}⟩`, 6, 14, { size: 13, color: BLUE }), label(P, v, `⟨${v.join(', ')}⟩`, -6, -6, { size: 13, color: VERM, anchor: 'end' }),
      text(P.sx(s[0] / 2), P.sy(s[1] / 2) + 5, o.areaText, { size: 13, anchor: 'middle', color: GREEN, bold: true }));
    else body.push([[0, 0], u, s, v].map(p => dot(P, p, { r: 3.4 })), [[0, 0], u, s, v].map(p => label(P, p, `(${p.join(', ')})`, p[0] === 0 ? -6 : 6, p[0] === 0 ? -6 : p[1] === 1 ? 16 : -6, { size: 12, anchor: p[0] === 0 ? 'end' : 'start' })));
    fig('inverse-determinant', id, o.pw + 70, o.ph + 50, title, alt, body);
  };
  mk('inverse-determinant-area', [3, 1], [1, 2], { pw: 300, ph: 240, xr: [-1, 5], yr: [-1, 4], vectors: true, areaText: 'area 5' }, 'The parallelogram made by the columns of a matrix',
    'The column vectors <3, 1> and <1, 2> drawn from the origin, and the shaded parallelogram they make, with corners (0, 0), (3, 1), (4, 3) and (1, 2). Its area is 5, the determinant 3 times 2 minus 1 times 1.');
  mk('inverse-determinant-s2', [4, 1], [1, 3], { pw: 300, ph: 260, xr: [-1, 6], yr: [-1, 5] }, 'A parallelogram with one corner at the origin',
    'A shaded parallelogram with corners (0, 0), (4, 1), (5, 4) and (1, 3) on a grid.');
}

/* ---------------------------------------------------------- 4.12 */
{
  const mk = (id, M, o, title, alt) => {
    const P = panel([40, 16, o.pw, o.ph], o.xr, o.yr, { xStep: 1, yStep: 1 });
    const T = ([x, y]) => [M[0][0] * x + M[0][1] * y, M[1][0] * x + M[1][1] * y];
    const sq = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const body = [P.svg, poly(P, sq, { fill: MUTED, color: MUTED, opacity: 0.18, width: 1.6, dashed: true }), poly(P, sq.map(T), { fill: GREEN, color: GREEN, opacity: 0.16 }),
      vec(P, [0, 0], T([1, 0]), { color: BLUE }), vec(P, [0, 0], T([0, 1]), { color: VERM }),
      label(P, T([1, 0]), `⟨${T([1, 0]).join(', ')}⟩`, 6, 14, { size: 13, color: BLUE }), label(P, T([0, 1]), `⟨${T([0, 1]).join(', ')}⟩`.replace('-', '−'), -6, -6, { size: 13, color: VERM, anchor: 'end' })];
    if (o.note) body.push(text(P.sx(o.note[0]), P.sy(o.note[1]), o.note[2], { size: 12, color: MUTED }));
    fig('linear-transformations', id, o.pw + 70, o.ph + 50, title, alt, body);
  };
  mk('linear-transformations-square', [[1, 1], [0, 2]], { pw: 300, ph: 260, xr: [-1, 4], yr: [-1, 3], note: [-0.95, 1.12, 'unit square'] }, 'The unit square and its image',
    'The unit square with corners (0, 0), (1, 0), (1, 1) and (0, 1), dashed in gray, and its image under the matrix with rows (1, 1) and (0, 2), shaded green: a parallelogram with corners (0, 0), (1, 0), (2, 2) and (1, 2). The image of <1, 0> is <1, 0> (blue arrow) and the image of <0, 1> is <1, 2> (vermillion arrow), the two columns of the matrix.');
  mk('linear-transformations-s1', [[2, -1], [1, 1]], { pw: 300, ph: 260, xr: [-2, 3], yr: [-1, 3] }, 'A square and its image under a transformation',
    'The unit square, dashed in gray, and its image under a linear transformation, shaded green: a parallelogram with corners (0, 0), (2, 1), (1, 2) and (-1, 1). The image of <1, 0> is drawn as a blue arrow to (2, 1) and the image of <0, 1> as a vermillion arrow to (-1, 1).');
}

/* ---------------------------------------------------------- 4.13 */
{
  const P = panel([40, 16, 300, 300], [-4, 4], [-4, 4], { xStep: 1, yStep: 1 });
  const v = [3, 1], Rv = [-1, 3], FRv = [-1, -3];
  fig('matrices-as-functions', 'matrices-as-functions-compose', 380, 350, 'Two transformations applied one after the other',
    'The vector v = <3, 1> in green is rotated a quarter turn counterclockwise to Rv = <-1, 3> in blue, then reflected across the x-axis to FRv = <-1, -3> in vermillion. A curved arrow marks the rotation and a dashed line the reflection.',
    [P.svg, vec(P, [0, 0], v, { color: GREEN }), vec(P, [0, 0], Rv, { color: BLUE }), vec(P, [0, 0], FRv, { color: VERM }),
      polyline(P, sampleParam(t => [1.6 * Math.cos(t), 1.6 * Math.sin(t)], Math.atan2(1, 3) + 0.08, Math.atan2(3, -1) - 0.12, 40), { color: MUTED, width: 1.4 }),
      head(P.sx(1.6 * Math.cos(Math.atan2(3, -1) - 0.1)), P.sy(1.6 * Math.sin(Math.atan2(3, -1) - 0.1)), -Math.sin(Math.atan2(3, -1)) * 10, -Math.cos(Math.atan2(3, -1)) * 10, MUTED, 8),
      `<line x1="${r2(P.sx(-1))}" y1="${r2(P.sy(3))}" x2="${r2(P.sx(-1))}" y2="${r2(P.sy(-3))}" stroke="${MUTED}" stroke-width="1.2" stroke-dasharray="4 4"/>`,
      label(P, v, [{ t: 'v', b: true }, { t: ' = ⟨3, 1⟩' }], 4, -8, { size: 13, color: GREEN, anchor: 'end' }),
      label(P, Rv, [{ t: 'R' }, { t: 'v', b: true }, { t: ' = ⟨−1, 3⟩' }], -10, 4, { size: 13, color: BLUE, anchor: 'end' }),
      label(P, FRv, [{ t: 'FR' }, { t: 'v', b: true }, { t: ' = ⟨−1, −3⟩' }], -10, 4, { size: 13, color: VERM, anchor: 'end' })]);
}

/* ---------------------------------------------------------- 4.14 */
{
  const body = [];
  const cx = [140, 400], cy = 120, R = 46;
  cx.forEach((x, i) => body.push(`<circle cx="${x}" cy="${cy}" r="${R}" fill="${i ? BLUE : GREEN}" fill-opacity="0.12" stroke="${i ? BLUE : GREEN}" stroke-width="2.2"/>`, text(x, cy + 6, i ? 'Station B' : 'Station A', { size: 15, anchor: 'middle', bold: true })));
  const arc = (x1, y1, x2, y2, bend, color, lab, lx, ly) => {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + bend;
    const t = 0.98, ex = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * mx + t * t * x2, ey = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * my + t * t * y2;
    return [`<path d="M${x1},${y1} Q${mx},${my} ${ex},${ey}" fill="none" stroke="${color}" stroke-width="2"/>`, head(x2, y2, x2 - mx, y2 - my, color, 11), text(lx, ly, lab, { size: 15, anchor: 'middle', color })];
  };
  body.push(arc(180, 98, 360, 98, -60, INK, '0.2', 270, 52));
  body.push(arc(360, 142, 180, 142, 60, INK, '0.3', 270, 196));
  const loop = (x, up, lab, color) => [`<path d="M${x - 22},${cy - (R - 6)} C${x - 50},${cy - 110} ${x + 50},${cy - 110} ${x + 20},${cy - (R - 4)}" fill="none" stroke="${color}" stroke-width="2"/>`, head(x + 20, cy - (R - 4), -12, 16, color, 11), text(x, cy - 92, lab, { size: 15, anchor: 'middle', color })];
  body.push(loop(140, true, '0.8', GREEN), loop(400, true, '0.7', BLUE));
  body.push(text(270, 238, 'Each day, a bike at A stays with chance 0.8 and moves to B with chance 0.2;', { size: 12, anchor: 'middle', color: MUTED }));
  body.push(text(270, 256, 'a bike at B moves to A with chance 0.3 and stays with chance 0.7.', { size: 12, anchor: 'middle', color: MUTED }));
  fig('matrix-modeling', 'matrix-modeling-bikes', 540, 270, 'A two-station bike-share model',
    'Two circles, Station A and Station B. A loop on A is labeled 0.8 and an arrow from A to B is labeled 0.2; an arrow from B to A is labeled 0.3 and a loop on B is labeled 0.7. Each day a bike at A stays with chance 0.8 or moves to B with chance 0.2, and a bike at B moves to A with chance 0.3 or stays with chance 0.7.',
    body);
}

/* ---------------------------------------------------------- write */
mkdirSync(OUT, { recursive: true });
const reg = {};
for (const f of FIGS) {
  writeFileSync(join(OUT, `${f.id}.svg`), f.svg);
  (reg[f.topic] ||= {})[f.id] = { file: `figures/${f.id}.svg`, ext: 'svg', w: f.w, h: f.h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt: f.alt };
}
if (!PREVIEW) {
  const dir = join(ROOT, 'precalculus', 'data', 'figures');
  mkdirSync(dir, { recursive: true });
  for (const [topic, figs] of Object.entries(reg)) writeFileSync(join(dir, `${topic}.json`), JSON.stringify(figs, null, 1) + '\n');
}
console.log(`${FIGS.length} figures written to ${OUT}`);
