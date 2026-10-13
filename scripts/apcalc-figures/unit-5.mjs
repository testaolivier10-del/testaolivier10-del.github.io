/* Figures for AP® Calculus AB Unit 5 (Analytical Applications of
   Differentiation). Run:
     node scripts/apcalc-figures/unit-5.mjs
   Writes calculus/figures/<id>.svg. Every graph is drawn by sampling the
   function it claims to show (the functions are written out below, next to
   each figure), so a curve, a tangent line or a marked point is never a hand
   approximation. Standalone SVG: white background, role="img", <title> and
   <desc>, Arial/Helvetica, ink #1F2A28, course crimson #8C1036 for emphasis,
   Okabe-Ito blue/green/vermillion for second curves and signs. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'calculus', 'figures');
const C = { ink: '#1F2A28', crimson: '#8C1036', blue: '#0072B2', green: '#009E73', verm: '#D55E00', grey: '#5A6268', grid: '#E4E8E6', light: '#C9CFCC', pale: '#F4F6F5', paleGreen: '#E3F4EE', paleVerm: '#FBE9DF', sky: '#E6F1F8' };
const r1 = v => Math.round(v * 10) / 10;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MINUS = '−', PRIME = '′', DPRIME = '″';
const num = v => String(+v.toFixed(3)).replace('-', MINUS);

function text(x, y, s, o = {}) {
  const a = [`x="${r1(x)}"`, `y="${r1(y)}"`, `font-size="${o.size || 14}"`, `fill="${o.color || C.ink}"`];
  if (o.anchor) a.push(`text-anchor="${o.anchor}"`);
  if (o.weight) a.push(`font-weight="${o.weight}"`);
  if (o.italic) a.push('font-style="italic"');
  const t = `<text ${a.join(' ')}>${s}</text>`;
  // A halo is a white copy drawn first: a stroke on the text itself would
  // cover tspans (italic letters) in some renderers.
  return o.halo ? `<text ${a.join(' ').replace(/fill="[^"]*"/, 'fill="#FFFFFF"')} stroke="#FFFFFF" stroke-width="4" stroke-linejoin="round">${s}</text>` + t : t;
}
const it = s => `<tspan font-style="italic">${s}</tspan>`;
const fName = (p = '') => `${it('f')}${p}`;
function line(x1, y1, x2, y2, color = C.ink, w = 2, dash) {
  return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${color}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linecap="round"/>`;
}
function dot(x, y, o = {}) {
  const r = o.r || 5;
  return o.open ? `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="#FFFFFF" stroke="${o.color || C.ink}" stroke-width="2.2"/>`
    : `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="${o.color || C.ink}"/>`;
}
function rect(x, y, w, h, o = {}) {
  return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${o.rx ?? 0}" fill="${o.fill || 'none'}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.width ?? 1.5}"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
}
function arrowHead(x, y, ang, color, s = 9) {
  const a1 = ang + Math.PI * 0.85, a2 = ang - Math.PI * 0.85;
  return `<polygon points="${r1(x)},${r1(y)} ${r1(x + s * Math.cos(a1))},${r1(y + s * Math.sin(a1))} ${r1(x + s * Math.cos(a2))},${r1(y + s * Math.sin(a2))}" fill="${color}"/>`;
}
function arrow(x1, y1, x2, y2, color = C.ink, w = 2) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  return line(x1, y1, x2 - 6 * Math.cos(ang), y2 - 6 * Math.sin(ang), color, w) + arrowHead(x2, y2, ang, color);
}

/* A coordinate panel: box {x, y, w, h} in pixels, ranges xr, yr. */
function panel(box, xr, yr, o = {}) {
  const sx = v => box.x + (v - xr[0]) / (xr[1] - xr[0]) * box.w;
  const sy = v => box.y + (yr[1] - v) / (yr[1] - yr[0]) * box.h;
  const P = { box, xr, yr, sx, sy, parts: [] };
  const xt = o.xTicks || [], yt = o.yTicks || [];
  const ax = yr[0] <= 0 && yr[1] >= 0 ? sy(0) : box.y + box.h, ay = xr[0] <= 0 && xr[1] >= 0 ? sx(0) : box.x;
  if (o.grid !== false) {
    for (const v of o.xGrid || xt) P.parts.push(line(sx(v), box.y, sx(v), box.y + box.h, C.grid, 1));
    for (const v of o.yGrid || yt) P.parts.push(line(box.x, sy(v), box.x + box.w, sy(v), C.grid, 1));
  }
  P.axes = () => {
    const s = [];
    s.push(arrow(box.x - 4, ax, box.x + box.w + 10, ax, C.ink, 1.6));
    if (o.yAxis !== false) s.push(arrow(ay, box.y + box.h + 4, ay, box.y - 10, C.ink, 1.6));
    for (const v of xt) { if (Math.abs(v) < 1e-9 && o.yAxis !== false) continue; s.push(line(sx(v), ax - 4, sx(v), ax + 4, C.ink, 1.4)); s.push(text(sx(v), ax + 18, o.xFmt ? o.xFmt(v) : num(v), { size: 12.5, anchor: 'middle', halo: true })); }
    for (const v of yt) { if (Math.abs(v) < 1e-9) continue; s.push(line(ay - 4, sy(v), ay + 4, sy(v), C.ink, 1.4)); s.push(text(ay - 8, sy(v) + 4.5, num(v), { size: 12.5, anchor: 'end', halo: true })); }
    if (o.xLabel) s.push(text(box.x + box.w + 14, ax + 5, o.xLabel, { size: 15, italic: true }));
    if (o.yLabel && o.yAxis !== false) s.push(text(ay + 8, box.y - 4, o.yLabel, { size: 15 }));
    return s.join('');
  };
  return P;
}
/* Samples f on [a, b] into a path, broken where f is not finite, clipped to the panel's y range. */
function curvePath(P, f, a, b, o = {}) {
  const n = o.n || 400, runs = [];
  let run = [];
  for (let i = 0; i <= n; i++) {
    const x = a + (b - a) * i / n, y = f(x);
    if (!Number.isFinite(y) || y < P.yr[0] - 1e-9 || y > P.yr[1] + 1e-9) { if (run.length > 1) runs.push(run); run = []; continue; }
    run.push([P.sx(x), P.sy(y)]);
  }
  if (run.length > 1) runs.push(run);
  const d = runs.map(r => 'M' + r.map(p => `${r1(p[0])} ${r1(p[1])}`).join('L')).join('');
  return `<path d="${d}" fill="none" stroke="${o.color || C.crimson}" stroke-width="${o.width || 3}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} stroke-linejoin="round" stroke-linecap="round"/>`;
}
/* Shades between f and the x-axis (or g) on [a, b]. */
function shadePath(P, f, a, b, color, g = () => 0) {
  const n = 120, top = [], bot = [];
  const cl = v => Math.max(P.yr[0], Math.min(P.yr[1], v));
  for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; top.push([P.sx(x), P.sy(cl(f(x)))]); bot.push([P.sx(x), P.sy(cl(g(x)))]); }
  return `<polygon points="${top.concat(bot.reverse()).map(p => `${r1(p[0])},${r1(p[1])}`).join(' ')}" fill="${color}"/>`;
}
/* A tangent line segment to f at a, half-length L in x units. */
function tangentSeg(P, f, df, a, L, o = {}) {
  const y0 = f(a), m = df(a);
  return line(P.sx(a - L), P.sy(y0 - m * L), P.sx(a + L), P.sy(y0 + m * L), o.color || C.blue, o.width || 2.2, o.dash);
}
function svgDoc(id, w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="Arial, Helvetica, sans-serif">
<title id="${id}-t">${esc(title)}</title>
<desc id="${id}-d">${esc(desc)}</desc>
<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body}
</svg>
`;
}
const figures = [];
function fig(id, w, h, title, desc, body) { figures.push({ id, svg: svgDoc(id, w, h, title, desc, body) }); }
const range = (a, b, s = 1) => { const o = []; for (let v = a; v <= b + 1e-9; v += s) o.push(+v.toFixed(6)); return o; };

/* ---------------------------------------------------------------- 5.1
   f(x) = x^3 - 6x^2 + 9x + 1 on [0, 4]: f(0) = 1, f(4) = 5, average rate 1.
   f'(c) = 3c^2 - 12c + 9 = 1 at c = 2 - 2/sqrt(3) and c = 2 + 2/sqrt(3). */
{
  const f = x => x ** 3 - 6 * x ** 2 + 9 * x + 1, df = x => 3 * x * x - 12 * x + 9;
  const c1 = 2 - 2 / Math.sqrt(3), c2 = 2 + 2 / Math.sqrt(3);
  const P = panel({ x: 70, y: 40, w: 560, h: 330 }, [-0.5, 4.5], [-1, 7], { xTicks: range(0, 4), yTicks: range(0, 6), xLabel: 'x', yLabel: 'y' });
  const b = [...P.parts];
  b.push(P.axes());
  // secant through the endpoints, slope 1
  b.push(line(P.sx(-0.3), P.sy(0.7), P.sx(4.4), P.sy(5.4), C.ink, 2.2, '8 6'));
  b.push(tangentSeg(P, f, df, c1, 0.85, { color: C.blue, width: 2.6 }));
  b.push(tangentSeg(P, f, df, c2, 0.85, { color: C.blue, width: 2.6 }));
  b.push(curvePath(P, f, 0, 4));
  b.push(dot(P.sx(0), P.sy(1), { color: C.crimson }), dot(P.sx(4), P.sy(5), { color: C.crimson }));
  b.push(dot(P.sx(c1), P.sy(f(c1)), { color: C.blue }), dot(P.sx(c2), P.sy(f(c2)), { color: C.blue }));
  b.push(text(P.sx(0) + 10, P.sy(1) + 20, '(0, 1)', { size: 13.5, halo: true }));
  b.push(text(P.sx(4) - 10, P.sy(5) - 12, '(4, 5)', { size: 13.5, anchor: 'end', halo: true }));
  b.push(text(P.sx(c1), P.sy(f(c1)) - 14, `${it('c')}₁ ≈ 0.85`, { size: 13.5, anchor: 'middle', color: C.blue, halo: true }));
  b.push(text(P.sx(c2), P.sy(f(c2)) + 26, `${it('c')}₂ ≈ 3.15`, { size: 13.5, anchor: 'middle', color: C.blue, halo: true }));
  b.push(text(P.sx(1.25), P.sy(6.4), `${fName()}(${it('x')}) = ${it('x')}³ ${MINUS} 6${it('x')}² + 9${it('x')} + 1`, { size: 14, color: C.crimson, halo: true }));
  // legend
  const L = 650;
  b.push(line(L, 70, L + 34, 70, C.ink, 2.2, '8 6'), text(L + 42, 75, 'secant line through the', { size: 13.5 }), text(L + 42, 93, 'endpoints: slope = 1', { size: 13.5 }));
  b.push(line(L, 125, L + 34, 125, C.blue, 2.6), text(L + 42, 130, 'tangent lines at', { size: 13.5 }), text(L + 42, 148, `${it('c')}₁ and ${it('c')}₂: slope = 1`, { size: 13.5 }));
  b.push(text(L, 195, 'Same slope, so', { size: 13.5, weight: 'bold' }), text(L, 213, 'the lines are parallel:', { size: 13.5, weight: 'bold' }), text(L, 233, `${fName(PRIME)}(${it('c')}) = [${fName()}(4) ${MINUS} ${fName()}(0)] / (4 ${MINUS} 0)`, { size: 13.5 }), text(L, 253, `= (5 ${MINUS} 1) / 4 = 1`, { size: 13.5 }));
  fig('mvt-parallel-tangents', 900, 410, 'The Mean Value Theorem: tangent lines parallel to the secant line',
    'The graph of f(x) = x cubed minus 6x squared plus 9x plus 1 on the closed interval from 0 to 4, from (0, 1) to (4, 5). A dashed secant line joins the endpoints with slope 1. Two blue tangent lines, at x = c1 ≈ 0.85 and x = c2 ≈ 3.15, are parallel to the secant: at both points the derivative equals the average rate of change, 1.',
    b.join('\n'));
}

/* ---------------------------------------------------------------- 5.2
   Left: f(x) = x^3 - 3x on [-1.8, 2.3]: f(-1.8) = -0.432, relative max (-1, 2),
   relative and absolute min (1, -2), absolute max at the endpoint (2.3, 5.267).
   Right: g(x) = x on [0, 2) with g(2) = 0: no maximum value. */
{
  const f = x => x ** 3 - 3 * x;
  const P = panel({ x: 60, y: 50, w: 400, h: 300 }, [-2.2, 2.7], [-3, 6], { xTicks: range(-2, 2), yTicks: range(-2, 5), xLabel: 'x', yLabel: 'y' });
  const b = [...P.parts];
  b.push(P.axes());
  b.push(curvePath(P, f, -1.8, 2.3));
  b.push(dot(P.sx(-1.8), P.sy(f(-1.8)), { color: C.crimson }), dot(P.sx(2.3), P.sy(f(2.3)), { color: C.crimson }));
  b.push(dot(P.sx(-1), P.sy(2), { color: C.blue }), dot(P.sx(1), P.sy(-2), { color: C.blue }));
  b.push(line(P.sx(-1.45), P.sy(2), P.sx(-0.55), P.sy(2), C.blue, 2), line(P.sx(0.55), P.sy(-2), P.sx(1.45), P.sy(-2), C.blue, 2));
  b.push(text(P.sx(-1), P.sy(2) - 14, 'relative maximum', { size: 13, anchor: 'middle', color: C.blue, halo: true }));
  b.push(text(P.sx(1) + 6, P.sy(-2) + 26, 'relative and absolute minimum', { size: 13, anchor: 'middle', color: C.blue, halo: true }));
  b.push(text(P.sx(2.3) - 10, P.sy(f(2.3)) - 4, 'absolute maximum', { size: 13, anchor: 'end', color: C.crimson, halo: true }));
  b.push(text(P.sx(2.3) - 10, P.sy(f(2.3)) + 13, '(at an endpoint)', { size: 13, anchor: 'end', color: C.crimson, halo: true }));
  b.push(text(60, 30, `Continuous on a closed interval: both extremes are reached`, { size: 15, weight: 'bold' }));
  const Q = panel({ x: 560, y: 50, w: 280, h: 300 }, [-0.5, 2.8], [-1, 3], { xTicks: range(0, 2), yTicks: range(1, 2), xLabel: 'x', yLabel: 'y' });
  b.push(...Q.parts, Q.axes());
  b.push(curvePath(Q, x => x, 0, 2, { color: C.verm }));
  b.push(dot(Q.sx(0), Q.sy(0), { color: C.verm }), dot(Q.sx(2), Q.sy(2), { open: true, color: C.verm }), dot(Q.sx(2), Q.sy(0), { color: C.verm }));
  b.push(text(Q.sx(2) - 8, Q.sy(2) - 12, 'never reaches 2', { size: 13, anchor: 'end', color: C.verm, halo: true }));
  b.push(text(Q.sx(2) + 8, Q.sy(0) - 10, `${it('g')}(2) = 0`, { size: 13, color: C.verm, halo: true }));
  b.push(text(560, 30, 'A jump at x = 2: no maximum value', { size: 15, weight: 'bold' }));
  fig('evt-extrema', 900, 400, 'Absolute and relative extrema, and what the Extreme Value Theorem needs',
    'Left: f(x) = x cubed minus 3x on the closed interval from -1.8 to 2.3. Flat tangent lines mark a relative maximum at (-1, 2) and a relative minimum at (1, -2), which is also the absolute minimum. The absolute maximum, about 5.27, is at the right endpoint x = 2.3. Right: g(x) = x for 0 ≤ x < 2 with g(2) = 0. The graph climbs toward an open circle at (2, 2) but the value 2 is never reached, so g has no maximum value; g is not continuous at 2.',
    b.join('\n'));
}

/* ---------------------------------------------------------------- 5.3
   f(x) = x^3 - 3x (top) and f'(x) = 3x^2 - 3 (bottom) on [-2.2, 2.2].
   f' > 0 on (-inf, -1) and (1, inf): f increasing; f' < 0 on (-1, 1). */
{
  const f = x => x ** 3 - 3 * x, fp = x => 3 * x * x - 3;
  const xr = [-2.4, 2.4];
  const P = panel({ x: 80, y: 40, w: 560, h: 200 }, xr, [-3, 3], { xTicks: range(-2, 2), yTicks: [-2, 2], xLabel: 'x', yLabel: 'y' });
  const Q = panel({ x: 80, y: 300, w: 560, h: 200 }, xr, [-4, 10], { xTicks: range(-2, 2), yTicks: [-3, 3, 6, 9], xLabel: 'x', yLabel: 'y' });
  const b = [];
  b.push(rect(P.sx(-2.4), 40, P.sx(-1) - P.sx(-2.4), 200, { fill: C.paleGreen }), rect(P.sx(-1), 40, P.sx(1) - P.sx(-1), 200, { fill: C.paleVerm }), rect(P.sx(1), 40, P.sx(2.4) - P.sx(1), 200, { fill: C.paleGreen }));
  b.push(rect(Q.sx(-2.4), 300, Q.sx(-1) - Q.sx(-2.4), 200, { fill: C.paleGreen }), rect(Q.sx(-1), 300, Q.sx(1) - Q.sx(-1), 200, { fill: C.paleVerm }), rect(Q.sx(1), 300, Q.sx(2.4) - Q.sx(1), 200, { fill: C.paleGreen }));
  b.push(...P.parts, P.axes(), ...Q.parts, Q.axes());
  b.push(line(P.sx(-1), 40, Q.sx(-1), 500, C.grey, 1.4, '5 5'), line(P.sx(1), 40, Q.sx(1), 500, C.grey, 1.4, '5 5'));
  b.push(curvePath(P, f, -2.3, 2.3));
  b.push(shadePath(Q, x => Math.max(0, fp(x)), -Math.sqrt(13 / 3), -1, 'rgba(0,158,115,0.35)'), shadePath(Q, x => Math.max(0, fp(x)), 1, Math.sqrt(13 / 3), 'rgba(0,158,115,0.35)'), shadePath(Q, x => Math.min(0, fp(x)), -1, 1, 'rgba(213,94,0,0.35)'));
  b.push(curvePath(Q, fp, -2.3, 2.3, { color: C.blue }));
  b.push(text(P.sx(2.25), P.sy(2.2), fName(), { size: 18, color: C.crimson, weight: 'bold', anchor: 'end' }));
  b.push(text(Q.sx(-2.2), Q.sy(8.6), fName(PRIME), { size: 18, color: C.blue, weight: 'bold' }));
  b.push(text(P.sx(-1.7), 60, 'increasing', { size: 14, anchor: 'middle', color: '#00664A', weight: 'bold' }), text(P.sx(0), 60, 'decreasing', { size: 14, anchor: 'middle', color: '#A34400', weight: 'bold' }), text(P.sx(1.7), 60, 'increasing', { size: 14, anchor: 'middle', color: '#00664A', weight: 'bold' }));
  b.push(text(Q.sx(-1.45), Q.sy(6.5), `${fName(PRIME)} > 0`, { size: 15, anchor: 'middle', color: '#00664A', weight: 'bold', halo: true }), text(Q.sx(0.5), Q.sy(4.5), `${fName(PRIME)} < 0`, { size: 15, anchor: 'middle', color: '#A34400', weight: 'bold', halo: true }), text(Q.sx(1.45), Q.sy(6.5), `${fName(PRIME)} > 0`, { size: 15, anchor: 'middle', color: '#00664A', weight: 'bold', halo: true }));
  b.push(text(660, 120, `${fName()}(${it('x')}) = ${it('x')}³ ${MINUS} 3${it('x')}`, { size: 14, color: C.crimson }));
  b.push(text(660, 390, `${fName(PRIME)}(${it('x')}) = 3${it('x')}² ${MINUS} 3`, { size: 14, color: C.blue }));
  b.push(text(660, 270, 'Same x-scale:', { size: 13.5, color: C.grey }), text(660, 288, `read the sign of ${fName(PRIME)}`, { size: 13.5, color: C.grey }), text(660, 306, `straight up to ${fName()}`, { size: 13.5, color: C.grey }));
  fig('incdec-sign-of-fprime', 860, 530, 'The sign of the derivative tells where a function increases or decreases',
    "Top: f(x) = x cubed minus 3x. Bottom, on the same x-scale: f'(x) = 3x squared minus 3. Where f' is above the x-axis (x < -1 and x > 1, shaded green), f is increasing; where f' is below the axis (-1 < x < 1, shaded orange), f is decreasing. Dashed lines at x = -1 and x = 1 join the zeros of f' to the turning points of f.",
    b.join('\n'));
}

/* ---------------------------------------------------------------- 5.4
   Three cases at x = 0: f = -x^2 (f' from + to -), f = x^2 (f' from - to +),
   f = x^3 (f' positive on both sides). */
{
  const cases = [
    { f: x => -x * x + 1, sign: ['+', MINUS], title: `${fName(PRIME)} changes + to ${MINUS}`, verdict: 'relative maximum', col: C.crimson },
    { f: x => x * x - 1, sign: [MINUS, '+'], title: `${fName(PRIME)} changes ${MINUS} to +`, verdict: 'relative minimum', col: C.crimson },
    { f: x => x ** 3, sign: ['+', '+'], title: `${fName(PRIME)} does not change sign`, verdict: 'no relative extremum', col: C.verm },
  ];
  const b = [];
  cases.forEach((cs, i) => {
    const x0 = 30 + i * 290;
    b.push(rect(x0, 20, 260, 330, { fill: '#FFFFFF', stroke: C.light, width: 1.5, rx: 10 }));
    b.push(text(x0 + 130, 48, cs.title, { size: 15, anchor: 'middle', weight: 'bold' }));
    const P = panel({ x: x0 + 30, y: 70, w: 200, h: 170 }, [-1.3, 1.3], [-1.4, 1.4], { xTicks: [], yTicks: [], grid: false, yAxis: false });
    b.push(P.axes(), curvePath(P, cs.f, -1.2, 1.2, { color: C.crimson }));
    b.push(dot(P.sx(0), P.sy(cs.f(0)), { color: cs.col }));
    // sign line
    const y = 280;
    b.push(line(x0 + 30, y, x0 + 230, y, C.ink, 1.6), line(x0 + 130, y - 7, x0 + 130, y + 7, C.ink, 2));
    b.push(text(x0 + 130, y + 24, `${it('c')}`, { size: 15, anchor: 'middle' }));
    b.push(text(x0 + 80, y - 10, cs.sign[0], { size: 22, anchor: 'middle', weight: 'bold', color: cs.sign[0] === '+' ? '#00664A' : '#A34400' }));
    b.push(text(x0 + 180, y - 10, cs.sign[1], { size: 22, anchor: 'middle', weight: 'bold', color: cs.sign[1] === '+' ? '#00664A' : '#A34400' }));
    b.push(text(x0 + 30, y + 24, `sign of ${fName(PRIME)}`, { size: 12.5, color: C.grey }));
    b.push(text(x0 + 130, 335, cs.verdict, { size: 15, anchor: 'middle', weight: 'bold', color: cs.col }));
  });
  fig('fdt-three-cases', 900, 370, 'The First Derivative Test: what the sign of f′ does at a critical point decides',
    "Three graphs, each with a critical point at x = c where f'(c) = 0. Left: f' changes from positive to negative, the graph rises then falls, a relative maximum. Middle: f' changes from negative to positive, the graph falls then rises, a relative minimum. Right: f' is positive on both sides, the graph rises through a flat point, no relative extremum.",
    b.join('\n'));
}

/* ---------------------------------------------------------------- 5.5
   f(x) = 2x^3 - 9x^2 + 12x on [0, 3]. f'(x) = 6(x - 1)(x - 2).
   Candidates: f(0) = 0, f(1) = 5, f(2) = 4, f(3) = 9. */
{
  const f = x => 2 * x ** 3 - 9 * x * x + 12 * x;
  const P = panel({ x: 60, y: 40, w: 440, h: 320 }, [-0.4, 3.4], [-1, 10], { xTicks: range(0, 3), yTicks: range(0, 9, 1).filter(v => v % 2 === 1 || v === 0), xLabel: 'x', yLabel: 'y' });
  const b = [...P.parts, P.axes()];
  b.push(curvePath(P, f, 0, 3));
  const cand = [[0, 0, 'endpoint'], [1, 5, 'critical point'], [2, 4, 'critical point'], [3, 9, 'endpoint']];
  for (const [x, y] of cand) b.push(line(P.sx(x), P.sy(0), P.sx(x), P.sy(y), C.grey, 1.3, '4 4'));
  b.push(dot(P.sx(0), P.sy(0), { color: C.blue, r: 6 }), dot(P.sx(1), P.sy(5), { color: C.ink }), dot(P.sx(2), P.sy(4), { color: C.ink }), dot(P.sx(3), P.sy(9), { color: C.crimson, r: 6 }));
  b.push(text(P.sx(1), P.sy(5) - 12, '(1, 5)', { size: 13.5, anchor: 'middle', halo: true }), text(P.sx(2), P.sy(4) + 24, '(2, 4)', { size: 13.5, anchor: 'middle', halo: true }));
  b.push(text(P.sx(3) - 10, P.sy(9) + 4, '(3, 9)', { size: 13.5, anchor: 'end', halo: true }), text(P.sx(0) + 10, P.sy(0) - 10, '(0, 0)', { size: 13.5, halo: true }));
  // table
  const T = { x: 560, y: 70 };
  b.push(text(T.x - 8, T.y - 36, 'The candidates', { size: 16, weight: 'bold' }));
  const rows = [['x', `${fName()}(${it('x')})`, ''], ['0', '0', 'endpoint: smallest'], ['1', '5', 'critical point'], ['2', '4', 'critical point'], ['3', '9', 'endpoint: largest']];
  rows.forEach((r, i) => {
    const y = T.y + i * 34;
    if (i === 0) b.push(rect(T.x - 8, y - 22, 310, 32, { fill: C.pale }));
    if (i === 1) b.push(rect(T.x - 8, y - 22, 310, 32, { fill: C.sky }));
    if (i === 4) b.push(rect(T.x - 8, y - 22, 310, 32, { fill: '#F6E3E9' }));
    b.push(text(T.x + 14, y, i === 0 ? it(r[0]) : r[0], { size: 15, anchor: 'middle', weight: i === 0 ? 'bold' : null }));
    b.push(text(T.x + 74, y, r[1], { size: 15, anchor: 'middle', weight: i === 0 ? 'bold' : null }));
    b.push(text(T.x + 124, y, r[2], { size: 14, color: i === 1 ? C.blue : i === 4 ? C.crimson : C.ink }));
  });
  b.push(line(T.x - 8, T.y + 12, T.x + 302, T.y + 12, C.ink, 1.2));
  b.push(text(T.x - 8, T.y + 190, 'Absolute maximum: 9, at x = 3', { size: 14.5, weight: 'bold', color: C.crimson }));
  b.push(text(T.x - 8, T.y + 212, 'Absolute minimum: 0, at x = 0', { size: 14.5, weight: 'bold', color: C.blue }));
  b.push(text(T.x - 8, T.y + 240, 'The relative maximum (1, 5) and relative', { size: 13.5, color: C.grey }));
  b.push(text(T.x - 8, T.y + 258, 'minimum (2, 4) are not the absolute ones.', { size: 13.5, color: C.grey }));
  fig('candidates-check', 900, 400, 'The Candidates Test on a closed interval',
    'The graph of f(x) = 2x cubed minus 9x squared plus 12x on the closed interval from 0 to 3, with four candidates marked: the endpoints (0, 0) and (3, 9) and the critical points (1, 5) and (2, 4). A table lists the four values. The largest, 9 at x = 3, is the absolute maximum; the smallest, 0 at x = 0, is the absolute minimum. The relative maximum at (1, 5) and relative minimum at (2, 4) are not absolute.',
    b.join('\n'));
}

/* ---------------------------------------------------------------- 5.6
   f(x) = x^3 - 3x^2 + 2, f'(x) = 3x^2 - 6x, f''(x) = 6x - 6: concave down
   for x < 1, up for x > 1, inflection point (1, 0); f' has its minimum at 1. */
{
  const f = x => x ** 3 - 3 * x * x + 2, fp = x => 3 * x * x - 6 * x;
  const xr = [-1.2, 3.2];
  const P = panel({ x: 80, y: 40, w: 540, h: 230 }, xr, [-3, 5], { xTicks: range(-1, 3), yTicks: [-2, 2], xLabel: 'x', yLabel: 'y' });
  const Q = panel({ x: 80, y: 330, w: 540, h: 190 }, xr, [-4, 9.5], { xTicks: range(-1, 3), yTicks: [-3, 3, 6, 9], xLabel: 'x', yLabel: 'y' });
  const b = [];
  b.push(rect(P.sx(-1.2), 40, P.sx(1) - P.sx(-1.2), 230, { fill: C.paleVerm }), rect(P.sx(1), 40, P.sx(3.2) - P.sx(1), 230, { fill: C.paleGreen }));
  b.push(rect(Q.sx(-1.2), 330, Q.sx(1) - Q.sx(-1.2), 190, { fill: C.paleVerm }), rect(Q.sx(1), 330, Q.sx(3.2) - Q.sx(1), 190, { fill: C.paleGreen }));
  b.push(...P.parts, P.axes(), ...Q.parts, Q.axes());
  b.push(line(P.sx(1), 40, Q.sx(1), 520, C.grey, 1.4, '5 5'));
  for (const a of [-0.6, 0.45, 1.6, 2.5]) b.push(tangentSeg(P, f, fp, a, 0.38, { color: C.blue, width: 2 }));
  b.push(curvePath(P, f, -1.1, 3.1));
  b.push(dot(P.sx(1), P.sy(0), { color: C.ink, r: 6 }));
  b.push(text(P.sx(1) + 12, P.sy(0) - 12, 'point of inflection (1, 0)', { size: 13.5, halo: true }));
  b.push(text(P.sx(-0.1), 62, 'concave down', { size: 14, anchor: 'middle', color: '#A34400', weight: 'bold' }), text(P.sx(2.1), 62, 'concave up', { size: 14, anchor: 'middle', color: '#00664A', weight: 'bold' }));
  b.push(text(P.sx(-0.1), 80, 'tangent lines above the curve', { size: 12.5, anchor: 'middle', color: C.grey }), text(P.sx(2.1), 80, 'tangent lines below the curve', { size: 12.5, anchor: 'middle', color: C.grey }));
  b.push(curvePath(Q, fp, -1.1, 3.1, { color: C.blue }));
  b.push(dot(Q.sx(1), Q.sy(-3), { color: C.blue }));
  b.push(text(Q.sx(-0.1), 350, `${fName(PRIME)} decreasing`, { size: 14, anchor: 'middle', color: '#A34400', weight: 'bold' }), text(Q.sx(2.1), 350, `${fName(PRIME)} increasing`, { size: 14, anchor: 'middle', color: '#00664A', weight: 'bold' }));
  b.push(text(Q.sx(1) + 10, Q.sy(-3) + 16, `lowest point of ${fName(PRIME)}`, { size: 13, halo: true }));
  b.push(text(665, 120, `${fName()}(${it('x')}) = ${it('x')}³ ${MINUS} 3${it('x')}² + 2`, { size: 14, color: C.crimson }));
  b.push(text(665, 390, `${fName(PRIME)}(${it('x')}) = 3${it('x')}² ${MINUS} 6${it('x')}`, { size: 14, color: C.blue }));
  b.push(text(665, 420, `${fName(DPRIME)}(${it('x')}) = 6${it('x')} ${MINUS} 6`, { size: 14 }));
  b.push(text(665, 440, `changes sign at x = 1`, { size: 13.5, color: C.grey }));
  fig('concavity-tangents', 900, 550, 'Concavity, tangent lines and a point of inflection',
    "Top: f(x) = x cubed minus 3x squared plus 2 with short blue tangent lines. For x < 1 the graph is concave down and its tangent lines lie above it; for x > 1 it is concave up and its tangent lines lie below it. The point of inflection is (1, 0). Bottom, on the same x-scale: f'(x) = 3x squared minus 6x, decreasing for x < 1 and increasing for x > 1, with its lowest point at x = 1, where f''(x) = 6x - 6 changes sign.",
    b.join('\n'));
}

/* ---------------------------------------------------------------- 5.7
   At a critical point c: f''(c) > 0 (y = x^2 + 0.5), f''(c) < 0 (y = -x^2 + 1),
   f''(c) = 0 (y = x^3, x^4 and -x^4 all have f'(0) = f''(0) = 0). */
{
  const b = [];
  const cases = [
    { title: `${fName(PRIME)}(${it('c')}) = 0, ${fName(DPRIME)}(${it('c')}) > 0`, verdict: 'relative minimum', sub: 'concave up at a flat point', curves: [{ f: x => x * x - 0.9, col: C.crimson }] },
    { title: `${fName(PRIME)}(${it('c')}) = 0, ${fName(DPRIME)}(${it('c')}) < 0`, verdict: 'relative maximum', sub: 'concave down at a flat point', curves: [{ f: x => -x * x + 0.9, col: C.crimson }] },
    { title: `${fName(PRIME)}(${it('c')}) = 0, ${fName(DPRIME)}(${it('c')}) = 0`, verdict: 'the test says nothing', sub: 'any of the three can happen', curves: [{ f: x => x ** 4, col: C.blue, lab: `${it('x')}⁴: min` }, { f: x => -(x ** 4), col: C.green, lab: `${MINUS}${it('x')}⁴: max` }, { f: x => x ** 3, col: C.verm, lab: `${it('x')}³: neither` }] },
  ];
  cases.forEach((cs, i) => {
    const x0 = 30 + i * 290;
    b.push(rect(x0, 20, 260, 340, { fill: '#FFFFFF', stroke: C.light, width: 1.5, rx: 10 }));
    b.push(text(x0 + 130, 48, cs.title, { size: 15, anchor: 'middle', weight: 'bold' }));
    const P = panel({ x: x0 + 30, y: 70, w: 200, h: 200 }, [-1.25, 1.25], [-1.3, 1.3], { xTicks: [], yTicks: [], grid: false, yAxis: false });
    b.push(P.axes());
    cs.curves.forEach(c => b.push(curvePath(P, c.f, -1.2, 1.2, { color: c.col, width: 2.8 })));
    b.push(line(P.sx(-0.5), P.sy(cs.curves[0].f(0)), P.sx(0.5), P.sy(cs.curves[0].f(0)), C.ink, 1.8, '5 4'));
    b.push(dot(P.sx(0), P.sy(cs.curves[0].f(0)), { color: C.ink }));
    b.push(text(P.sx(0), P.sy(-1.3) + 18, it('c'), { size: 14, anchor: 'middle' }));
    if (cs.curves.length > 1) cs.curves.forEach((c, j) => b.push(text(x0 + 30 + j * 72, 300, c.lab, { size: 13, color: c.col, weight: 'bold' })));
    b.push(text(x0 + 130, cs.curves.length > 1 ? 326 : 312, cs.verdict, { size: 15, anchor: 'middle', weight: 'bold', color: cs.curves.length > 1 ? C.verm : C.crimson }));
    b.push(text(x0 + 130, cs.curves.length > 1 ? 346 : 334, cs.sub, { size: 13, anchor: 'middle', color: C.grey }));
  });
  fig('sdt-cases', 900, 380, 'The Second Derivative Test at a critical point',
    "Three panels, each with a flat (dashed) tangent line at x = c where f'(c) = 0. Left: the graph is concave up there, f''(c) > 0, so f has a relative minimum. Middle: concave down, f''(c) < 0, a relative maximum. Right: f''(c) = 0, and three functions show that anything can happen: x to the fourth has a minimum, negative x to the fourth has a maximum, and x cubed has neither.",
    b.join('\n'));
}

/* ---------------------------------------------------------------- 5.8
   f(x) = x^3/3 - x^2 - 3x + 2, f'(x) = x^2 - 2x - 3 = (x - 3)(x + 1).
   Zeros of f' at -1, 3 (turning points of f); f' lowest at 1 (inflection of f). */
{
  const f = x => x ** 3 / 3 - x * x - 3 * x + 2, fp = x => x * x - 2 * x - 3;
  const xr = [-2.6, 4.8];
  const P = panel({ x: 80, y: 40, w: 560, h: 220 }, xr, [-9, 6], { xTicks: range(-2, 4), yTicks: [-8, -4, 4], xLabel: 'x', yLabel: 'y' });
  const Q = panel({ x: 80, y: 320, w: 560, h: 200 }, xr, [-5, 7], { xTicks: range(-2, 4), yTicks: [-4, -2, 2, 4, 6], xLabel: 'x', yLabel: 'y' });
  const b = [...P.parts, P.axes(), ...Q.parts, Q.axes()];
  for (const [x, col] of [[-1, C.grey], [3, C.grey], [1, C.verm]]) b.push(line(P.sx(x), 40, Q.sx(x), 520, col, 1.4, '5 5'));
  b.push(curvePath(P, f, -2.5, 4.7));
  b.push(curvePath(Q, fp, -2.5, 4.7, { color: C.blue }));
  b.push(dot(P.sx(-1), P.sy(f(-1)), { color: C.crimson }), dot(P.sx(3), P.sy(f(3)), { color: C.crimson }), dot(P.sx(1), P.sy(f(1)), { color: C.verm }));
  b.push(dot(Q.sx(-1), Q.sy(0), { color: C.blue }), dot(Q.sx(3), Q.sy(0), { color: C.blue }), dot(Q.sx(1), Q.sy(-4), { color: C.verm }));
  b.push(text(P.sx(-1), P.sy(f(-1)) - 12, 'peak', { size: 13.5, anchor: 'middle', halo: true }), text(P.sx(3), P.sy(f(3)) + 24, 'valley', { size: 13.5, anchor: 'middle', halo: true }));
  b.push(text(P.sx(1) + 10, P.sy(f(1)) - 8, 'inflection', { size: 13.5, color: C.verm, halo: true }));
  b.push(text(Q.sx(-1) - 10, Q.sy(0) - 26, `${fName(PRIME)} = 0`, { size: 13.5, anchor: 'end', halo: true }), text(Q.sx(3) + 10, Q.sy(0) - 26, `${fName(PRIME)} = 0`, { size: 13.5, halo: true }));
  b.push(text(Q.sx(1) + 10, Q.sy(-4) + 4, `lowest point of ${fName(PRIME)}`, { size: 13.5, color: C.verm, halo: true }));
  b.push(text(P.sx(4.6), P.sy(4.6), fName(), { size: 18, color: C.crimson, weight: 'bold', anchor: 'end' }));
  b.push(text(Q.sx(4.5), Q.sy(5.4), fName(PRIME), { size: 18, color: C.blue, weight: 'bold', anchor: 'end' }));
  b.push(text(660, 120, `${fName()}(${it('x')}) = ${it('x')}³/3 ${MINUS} ${it('x')}²`, { size: 14, color: C.crimson }), text(700, 140, `${MINUS} 3${it('x')} + 2`, { size: 14, color: C.crimson }));
  b.push(text(660, 400, `${fName(PRIME)}(${it('x')}) = ${it('x')}² ${MINUS} 2${it('x')} ${MINUS} 3`, { size: 14, color: C.blue }));
  b.push(text(660, 270, 'Turning points of f', { size: 13.5, color: C.grey }), text(660, 288, `are zeros of ${fName(PRIME)};`, { size: 13.5, color: C.grey }), text(660, 306, 'the inflection point is', { size: 13.5, color: C.grey }), text(660, 324, `where ${fName(PRIME)} turns.`, { size: 13.5, color: C.grey }));
  fig('sketch-f-fprime', 880, 550, 'Sketching the derivative from the graph of f',
    "Top: f(x) = x cubed over 3 minus x squared minus 3x plus 2, with a peak at x = -1, a valley at x = 3 and an inflection point at x = 1. Bottom, on the same x-scale: f'(x) = x squared minus 2x minus 3. Dashed lines show that f' is zero at x = -1 and x = 3, where f turns, and that f' has its lowest point at x = 1, where f changes concavity. f' is positive where f rises and negative where f falls.",
    b.join('\n'));
}

/* ---------------------------------------------------------------- 5.9
   f(x) = sin x, f'(x) = cos x, f''(x) = -sin x on [0, 2pi]. */
{
  const xr = [-0.3, 2 * Math.PI + 0.5];
  const piT = [Math.PI / 2, Math.PI, 3 * Math.PI / 2, 2 * Math.PI];
  const piF = v => ({ 1: 'π/2', 2: 'π', 3: '3π/2', 4: '2π' })[Math.round(v / (Math.PI / 2))];
  const mk = (y) => panel({ x: 80, y, w: 560, h: 130 }, xr, [-1.5, 1.5], { xTicks: piT, xFmt: piF, yTicks: [-1, 1], xLabel: 'x' });
  const P = [mk(30), mk(210), mk(390)];
  const fs = [x => Math.sin(x), x => Math.cos(x), x => -Math.sin(x)];
  const cols = [C.crimson, C.blue, C.green];
  const names = [fName(), fName(PRIME), fName(DPRIME)];
  const forms = ['sin x', 'cos x', MINUS + 'sin x'];
  const b = [];
  P.forEach((p, i) => { b.push(...p.parts, p.axes(), curvePath(p, fs[i], 0, 2 * Math.PI, { color: cols[i] })); });
  for (const x of piT) b.push(line(P[0].sx(x), 30, P[0].sx(x), 520, C.grey, 1.2, '4 5'));
  P.forEach((p, i) => { b.push(text(680, p.box.y + 40, `${names[i]}(${it('x')}) = ${forms[i]}`, { size: 15, color: cols[i], weight: 'bold' })); });
  b.push(text(680, 95, 'peak at π/2', { size: 13, color: C.grey }), text(680, 275, `zero at π/2: ${fName()} turns`, { size: 13, color: C.grey }), text(680, 293, `lowest at π: ${fName()} inflects`, { size: 13, color: C.grey }));
  b.push(text(680, 455, `negative on (0, π):`, { size: 13, color: C.grey }), text(680, 473, `${fName()} concave down`, { size: 13, color: C.grey }));
  fig('f-fp-fpp-sine', 900, 545, 'Reading f, its first derivative and its second derivative together',
    "Three stacked graphs on the same x-axis from 0 to 2 pi: f(x) = sin x, f'(x) = cos x and f''(x) = -sin x. Dashed lines at pi/2, pi, 3pi/2 and 2pi line up the features: f peaks at pi/2 where f' is zero and changes from positive to negative; f has an inflection point at pi where f' is lowest and f'' changes sign; f'' is negative on (0, pi), where f is concave down.",
    b.join('\n'));
}

/* ---------------------------------------------------------------- 5.10
   Pen against a river: 600 ft of fence, two sides of length x, a divider of
   length x, one side of length y: 3x + y = 600, A(x) = x(600 - 3x), max at
   x = 100 (A = 30000). */
function penDiagram(x0, y0, w, h, lab = true) {
  const s = [];
  // river along the top
  s.push(rect(x0 - 20, y0 - 46, w + 40, 40, { fill: '#D6EAF5' }));
  for (let k = 0; k < 5; k++) s.push(`<path d="M${x0 - 10 + k * (w + 20) / 5} ${y0 - 26} q 12 -8 24 0 t 24 0" fill="none" stroke="${C.blue}" stroke-width="1.6"/>`);
  s.push(text(x0 + w / 2, y0 - 52, 'river (no fence)', { size: 14, anchor: 'middle', color: C.blue }));
  s.push(rect(x0, y0, w, h, { fill: '#F3EEDF' }));
  s.push(line(x0, y0, x0, y0 + h, C.crimson, 4), line(x0 + w, y0, x0 + w, y0 + h, C.crimson, 4), line(x0, y0 + h, x0 + w, y0 + h, C.crimson, 4), line(x0 + w / 2, y0, x0 + w / 2, y0 + h, C.crimson, 4));
  s.push(line(x0, y0, x0 + w, y0, C.grey, 1.5, '6 5'));
  if (lab) {
    s.push(text(x0 - 10, y0 + h / 2 + 5, it('x'), { size: 17, anchor: 'end', weight: 'bold' }), text(x0 + w / 2 + 10, y0 + h / 2 + 5, it('x'), { size: 17, weight: 'bold' }), text(x0 + w + 10, y0 + h / 2 + 5, it('x'), { size: 17, weight: 'bold' }));
    s.push(text(x0 + w / 2, y0 + h + 24, it('y'), { size: 17, anchor: 'middle', weight: 'bold' }));
  }
  return s.join('');
}
{
  const b = [penDiagram(70, 90, 260, 150)];
  b.push(text(200, 300, 'Fence: 3' + it('x') + ' + ' + it('y') + ' = 600 feet', { size: 14.5, anchor: 'middle' }));
  b.push(text(200, 322, 'Area: ' + it('A') + ' = ' + it('xy'), { size: 14.5, anchor: 'middle' }));
  const A = x => x * (600 - 3 * x);
  const P = panel({ x: 470, y: 50, w: 360, h: 270 }, [-15, 220], [-3000, 34000], { xTicks: [50, 100, 150, 200], yTicks: [10000, 20000, 30000], xLabel: 'x', yLabel: 'A' });
  b.push(...P.parts, P.axes(), curvePath(P, A, 0, 200));
  b.push(dot(P.sx(0), P.sy(0), { color: C.crimson }), dot(P.sx(200), P.sy(0), { color: C.crimson }), dot(P.sx(100), P.sy(30000), { color: C.blue, r: 6 }));
  b.push(text(P.sx(100), P.sy(30000) - 12, 'maximum: (100, 30 000)', { size: 13.5, anchor: 'middle', color: C.blue, halo: true }));
  b.push(text(P.sx(100), P.sy(14000), `${it('A')}(${it('x')}) = ${it('x')}(600 ${MINUS} 3${it('x')})`, { size: 14, anchor: 'middle', color: C.crimson, halo: true }));
  b.push(text(P.sx(100), P.sy(9500), `0 ≤ ${it('x')} ≤ 200`, { size: 14, anchor: 'middle', color: C.crimson, halo: true }));
  fig('pen-river-area', 900, 360, 'Turning a fencing problem into a function to maximize',
    'Left: a rectangular pen against a straight river, split in two by a middle fence. The three fences perpendicular to the river each have length x; the side parallel to the river has length y; the river side needs no fence, so 3x + y = 600 feet and the area is A = xy. Right: the graph of A(x) = x(600 - 3x) for 0 ≤ x ≤ 200, zero at both ends, with its highest point at (100, 30000): the largest area is 30,000 square feet.',
    b.join('\n'));
  fig('pen-river-diagram', 420, 330, 'A two-part pen against a river',
    'A rectangular pen against a straight river, divided into two parts by a middle fence parallel to the ends. The two ends and the divider each have length x; the side opposite the river has length y. No fence is needed along the river.',
    penDiagram(80, 80, 260, 150) + text(210, 300, 'Total fence: 600 feet', { size: 15, anchor: 'middle', weight: 'bold' }));
}

/* ---------------------------------------------------------------- 5.11
   Open box from a sheet: cut squares of side x from each corner and fold up.
   Lesson figure: 12 by 12 sheet, V(x) = x(12 - 2x)^2, max at x = 2, V = 128.
   Stimulus: 16 by 10 sheet, V(x) = x(16 - 2x)(10 - 2x). */
function sheet(x0, y0, W, H, cut, scale, labels) {
  const s = [], w = W * scale, h = H * scale, c = cut * scale;
  s.push(`<polygon points="${[[c, 0], [w - c, 0], [w - c, c], [w, c], [w, h - c], [w - c, h - c], [w - c, h], [c, h], [c, h - c], [0, h - c], [0, c], [c, c]].map(p => `${r1(x0 + p[0])},${r1(y0 + p[1])}`).join(' ')}" fill="#F3EEDF" stroke="${C.ink}" stroke-width="2"/>`);
  for (const [px, py] of [[0, 0], [w - c, 0], [0, h - c], [w - c, h - c]]) s.push(rect(x0 + px, y0 + py, c, c, { fill: C.paleVerm, stroke: C.verm, width: 1.6, dash: '5 4' }));
  s.push(rect(x0 + c, y0 + c, w - 2 * c, h - 2 * c, { stroke: C.grey, width: 1.4, dash: '7 5' }));
  s.push(text(x0 + c / 2, y0 + c / 2 + 6, it('x'), { size: 16, anchor: 'middle', color: C.verm, weight: 'bold' }));
  s.push(text(x0 + w / 2, y0 - 10, labels[0], { size: 14.5, anchor: 'middle' }), text(x0 - 10, y0 + h / 2 + 5, labels[1], { size: 14.5, anchor: 'end' }));
  s.push(text(x0 + w / 2, y0 + h / 2 - 4, labels[2], { size: 14, anchor: 'middle', color: C.grey }), text(x0 + w / 2, y0 + h / 2 + 16, labels[3], { size: 14, anchor: 'middle', color: C.grey }));
  return s.join('');
}
{
  const b = [sheet(70, 70, 12, 12, 2, 20, ['12 in', '12 in', `base: (12 ${MINUS} 2${it('x')})`, `by (12 ${MINUS} 2${it('x')})`])];
  b.push(text(190, 340, 'Cut a square of side ' + it('x') + ' from each corner,', { size: 14, anchor: 'middle' }), text(190, 360, 'fold up the sides: height ' + it('x'), { size: 14, anchor: 'middle' }));
  const V = x => x * (12 - 2 * x) ** 2;
  const P = panel({ x: 470, y: 50, w: 360, h: 270 }, [-0.4, 6.6], [-10, 145], { xTicks: range(1, 6), yTicks: [40, 80, 120], xLabel: 'x', yLabel: 'V' });
  b.push(...P.parts, P.axes(), curvePath(P, V, 0, 6));
  b.push(dot(P.sx(0), P.sy(0), { color: C.crimson }), dot(P.sx(6), P.sy(0), { color: C.crimson }), dot(P.sx(2), P.sy(128), { color: C.blue, r: 6 }));
  b.push(text(P.sx(2) + 10, P.sy(128) - 8, 'maximum: (2, 128)', { size: 13.5, color: C.blue, halo: true }));
  b.push(text(P.sx(4.9), P.sy(118), `${it('V')}(${it('x')}) = ${it('x')}(12 ${MINUS} 2${it('x')})²`, { size: 14, anchor: 'middle', color: C.crimson, halo: true }));
  b.push(text(P.sx(4.9), P.sy(100), `0 ≤ ${it('x')} ≤ 6`, { size: 14, anchor: 'middle', color: C.crimson, halo: true }));
  fig('box-from-sheet', 900, 390, 'An open box folded from a square sheet, and its volume function',
    'Left: a 12-inch by 12-inch sheet with a square of side x shaded at each corner and dashed fold lines; folding up the sides gives an open box of height x and base 12 - 2x by 12 - 2x. Right: the graph of V(x) = x(12 - 2x) squared for 0 ≤ x ≤ 6, zero at both ends, highest at (2, 128): the largest box holds 128 cubic inches.',
    b.join('\n'));
  fig('box-sheet-16x10', 420, 330, 'A 16-inch by 10-inch sheet with corner squares cut out',
    'A rectangular sheet 16 inches wide and 10 inches tall. A square of side x is cut from each corner and the sides are folded up along the dashed lines to make an open box of height x with a base 16 - 2x by 10 - 2x inches.',
    sheet(90, 60, 16, 10, 2, 15, ['16 in', '10 in', `base: (16 ${MINUS} 2${it('x')})`, `by (10 ${MINUS} 2${it('x')})`]) + text(210, 250, 'Fold up the sides to a height of ' + it('x') + '.', { size: 14, anchor: 'middle' }));
}

/* ---------------------------------------------------------------- 5.12
   x^2 + xy + y^2 = 3: y = (-x ± sqrt(12 - 3x^2))/2 for |x| ≤ 2.
   dy/dx = -(2x + y)/(x + 2y). Horizontal tangents where y = -2x: (1, -2), (-1, 2).
   Vertical tangents where x = -2y: (2, -1), (-2, 1). */
{
  const up = x => (-x + Math.sqrt(Math.max(0, 12 - 3 * x * x))) / 2, dn = x => (-x - Math.sqrt(Math.max(0, 12 - 3 * x * x))) / 2;
  const P = panel({ x: 70, y: 40, w: 420, h: 420 }, [-3, 3], [-3, 3], { xTicks: range(-2, 2), yTicks: range(-2, 2), xLabel: 'x', yLabel: 'y' });
  const b = [...P.parts, P.axes()];
  // the curve as two branches, sampled densely near |x| = 2 by sampling in an angle
  const pts = [];
  for (let i = 0; i <= 720; i++) { const t = (i / 720) * 2 * Math.PI; const x = 2 * Math.cos(t); const y = (-x + Math.sqrt(Math.max(0, 12 - 3 * x * x)) * (Math.sin(t) >= 0 ? 1 : -1)) / 2; pts.push([P.sx(x), P.sy(y)]); }
  b.push(`<path d="M${pts.map(p => `${r1(p[0])} ${r1(p[1])}`).join('L')}Z" fill="none" stroke="${C.crimson}" stroke-width="3" stroke-linejoin="round"/>`);
  for (const [x, y] of [[1, -2], [-1, 2]]) b.push(line(P.sx(x - 0.8), P.sy(y), P.sx(x + 0.8), P.sy(y), C.blue, 2.4), dot(P.sx(x), P.sy(y), { color: C.blue }));
  for (const [x, y] of [[2, -1], [-2, 1]]) b.push(line(P.sx(x), P.sy(y - 0.8), P.sx(x), P.sy(y + 0.8), C.green, 2.4), dot(P.sx(x), P.sy(y), { color: C.green }));
  b.push(text(P.sx(-1), P.sy(2) - 12, '(' + MINUS + '1, 2)', { size: 13.5, anchor: 'middle', halo: true }), text(P.sx(1), P.sy(-2) + 24, '(1, ' + MINUS + '2)', { size: 13.5, anchor: 'middle', halo: true }));
  b.push(text(P.sx(2) + 8, P.sy(-1) + 4, '(2, ' + MINUS + '1)', { size: 13.5, halo: true }), text(P.sx(-2) - 8, P.sy(1) + 4, '(' + MINUS + '2, 1)', { size: 13.5, anchor: 'end', halo: true }));
  void up; void dn;
  const L = 530;
  b.push(text(L, 70, `${it('x')}² + ${it('xy')} + ${it('y')}² = 3`, { size: 16, weight: 'bold', color: C.crimson }));
  b.push(text(L, 110, 'Differentiate both sides with respect to x:', { size: 13.5 }));
  b.push(text(L, 132, `2${it('x')} + ${it('y')} + ${it('x')}${it('y')}${PRIME} + 2${it('y')}${it('y')}${PRIME} = 0`, { size: 14 }));
  b.push(text(L, 160, `${it('dy')}/${it('dx')} = ${MINUS}(2${it('x')} + ${it('y')}) / (${it('x')} + 2${it('y')})`, { size: 14 }));
  b.push(line(L, 190, L + 30, 190, C.blue, 2.4), text(L + 38, 195, 'numerator 2x + y = 0 (and on the curve):', { size: 13.5, color: C.blue, weight: 'bold' }));
  b.push(text(L + 38, 214, 'the tangent line is horizontal', { size: 13.5, color: C.blue }));
  b.push(line(L + 15, 240, L + 15, 270, C.green, 2.4), text(L + 38, 252, 'denominator x + 2y = 0, numerator not 0', { size: 13.5, color: C.green, weight: 'bold' }));
  b.push(text(L + 38, 271, '(and on the curve): the tangent line is vertical', { size: 13.5, color: C.green }));
  b.push(text(L, 310, 'Each condition gives a line through the origin;', { size: 13.5, color: C.grey }), text(L, 328, 'substitute it into the curve to find the points.', { size: 13.5, color: C.grey }));
  fig('implicit-tangents', 900, 500, 'Horizontal and vertical tangent lines on an implicitly defined curve',
    'The tilted oval x squared plus xy plus y squared = 3. Implicit differentiation gives dy/dx = -(2x + y)/(x + 2y). Blue horizontal tangent lines touch the curve at (-1, 2) and (1, -2), where the numerator 2x + y is zero. Green vertical tangent lines touch it at (-2, 1) and (2, -1), where the denominator x + 2y is zero and the numerator is not.',
    b.join('\n'));
}

mkdirSync(OUT, { recursive: true });
for (const f of figures) writeFileSync(join(OUT, `${f.id}.svg`), f.svg);
console.log(`Unit 5 figures: wrote ${figures.length} to calculus/figures/`);
