/* Figures for AP® Precalculus Unit 3, topics 3.1-3.7, and the two algebra
   topics before 3.2 (author D). Every curve is sampled from the function it
   claims to show (through the course's own parser, ApPrecalcExpr) and written
   as a standalone SVG (white background, Arial, role="img" with <title> and
   <desc>) to precalculus/figures/<id>.svg. The registry entries go to
   precalculus/data/figures/<topic>.json, with the same alt text.

     node scripts/apprecalc-figures/d.mjs            write every figure
     node scripts/apprecalc-figures/d.mjs <id> ...   write some (registries are always rewritten) */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Expr } from '../lib/apprecalc-mathlib.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'precalculus', 'figures');
const REG = join(ROOT, 'precalculus', 'data', 'figures');
const INK = '#1F2A28', GREEN = '#11592F', BLUE = '#0072B2', VERM = '#D55E00', GRID = '#E4E7E6', MUTED = '#5A6563';
const PALEGREEN = '#E3F3E8', WATER = '#D6E8F5';
const FONT = 'Arial, Helvetica, sans-serif';
const PI = Math.PI;
const r2 = v => Math.round(v * 100) / 100;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fnOf = f => typeof f === 'function' ? f : Expr.fn(f, ['x']);
const minus = v => String(v).replace('-', '−');

/* Tick label for a multiple of pi/den: "π/6", "−3π/4", "2π". */
function piLabel(v, den) {
  const k = Math.round(v / (PI / den));
  if (k === 0) return '0';
  const g = gcd(Math.abs(k), den), n = k / g, d = den / g;
  const s = (n < 0 ? '−' : '') + (Math.abs(n) === 1 ? '' : Math.abs(n)) + 'π';
  return d === 1 ? s : `${s}/${d}`;
}
function gcd(a, b) { return b ? gcd(b, a % b) : a; }

/* One coordinate panel. o: { left, top, w, h, x: [a, b], y: [c, d], xTicks, yTicks,
   xTickLabel(v), yTickLabel(v), xLabel, yLabel, grid, origin } */
function panel(o) {
  const { left, top, w, h } = o;
  const sx = v => left + (v - o.x[0]) / (o.x[1] - o.x[0]) * w;
  const sy = v => top + (o.y[1] - v) / (o.y[1] - o.y[0]) * h;
  const parts = [];
  const clip = `clip${Math.round(left)}x${Math.round(top)}`;
  parts.push(`<clipPath id="${clip}"><rect x="${left - 6}" y="${top - 6}" width="${w + 12}" height="${h + 12}"/></clipPath>`);
  const under = [];
  parts.push(under);
  if (o.grid !== false) {
    for (const v of o.xTicks || []) parts.push(`<line x1="${r2(sx(v))}" y1="${top}" x2="${r2(sx(v))}" y2="${top + h}" stroke="${GRID}" stroke-width="1"/>`);
    for (const v of o.yTicks || []) parts.push(`<line x1="${left}" y1="${r2(sy(v))}" x2="${left + w}" y2="${r2(sy(v))}" stroke="${GRID}" stroke-width="1"/>`);
  }
  const ax = o.y[0] <= 0 && o.y[1] >= 0 ? sy(0) : top + h;
  const ay = o.x[0] <= 0 && o.x[1] >= 0 ? sx(0) : left;
  parts.push(`<line x1="${left}" y1="${r2(ax)}" x2="${left + w + 10}" y2="${r2(ax)}" stroke="${INK}" stroke-width="1.4"/>`);
  parts.push(`<path d="M${left + w + 10} ${r2(ax)} l-8 -4 v8 z" fill="${INK}"/>`);
  parts.push(`<line x1="${r2(ay)}" y1="${top + h}" x2="${r2(ay)}" y2="${top - 10}" stroke="${INK}" stroke-width="1.4"/>`);
  parts.push(`<path d="M${r2(ay)} ${top - 10} l-4 8 h8 z" fill="${INK}"/>`);
  const tl = o.xTickLabel || (v => minus(+v.toFixed(4)));
  const yl = o.yTickLabel || (v => minus(+v.toFixed(4)));
  for (const v of o.xTicks || []) {
    if (Math.abs(v) < 1e-12 && ay !== left) continue;
    parts.push(`<line x1="${r2(sx(v))}" y1="${r2(ax - 4)}" x2="${r2(sx(v))}" y2="${r2(ax + 4)}" stroke="${INK}" stroke-width="1.2"/>`);
    parts.push(`<text x="${r2(sx(v))}" y="${r2(ax + 19)}" font-size="13" text-anchor="middle" fill="${INK}">${esc(tl(v))}</text>`);
  }
  for (const v of o.yTicks || []) {
    if (Math.abs(v) < 1e-12 && ax !== top + h) continue;
    parts.push(`<line x1="${r2(ay - 4)}" y1="${r2(sy(v))}" x2="${r2(ay + 4)}" y2="${r2(sy(v))}" stroke="${INK}" stroke-width="1.2"/>`);
    parts.push(`<text x="${r2(ay - 8)}" y="${r2(sy(v) + 4.5)}" font-size="13" text-anchor="end" fill="${INK}">${esc(yl(v))}</text>`);
  }
  if (o.origin) parts.push(`<text x="${r2(ay - 8)}" y="${r2(ax + 17)}" font-size="14" text-anchor="end" fill="${INK}" font-style="italic">O</text>`);
  if (o.xLabel) parts.push(`<text x="${left + w + 14}" y="${r2(ax + 5)}" font-size="15" font-style="italic" fill="${INK}">${o.xLabel}</text>`);
  if (o.yLabel) parts.push(`<text x="${r2(ay + 9)}" y="${top - 2}" font-size="15" font-style="italic" fill="${INK}">${o.yLabel}</text>`);
  const pathOf = pts => 'M' + pts.map(p => `${r2(sx(p[0]))} ${r2(sy(p[1]))}`).join('L');
  const P = {
    sx, sy, parts,
    curve(f, a, b, { color = GREEN, width = 3, dash = null, n = 480 } = {}) {
      f = fnOf(f);
      const pts = [];
      for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; pts.push([x, f(x)]); }
      parts.push(`<path d="${pathOf(pts)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''} clip-path="url(#${clip})"/>`);
      return P;
    },
    poly(pts, { color = GREEN, width = 3, dash = null } = {}) {
      parts.push(`<path d="${pathOf(pts)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`);
      return P;
    },
    seg(p, q, { color = INK, width = 1.5, dash = null } = {}) {
      parts.push(`<line x1="${r2(sx(p[0]))}" y1="${r2(sy(p[1]))}" x2="${r2(sx(q[0]))}" y2="${r2(sy(q[1]))}" stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`);
      return P;
    },
    hline(y, { color = MUTED, dash = '7 5', width = 1.5 } = {}) {
      parts.push(`<line x1="${left}" y1="${r2(sy(y))}" x2="${left + w}" y2="${r2(sy(y))}" stroke="${color}" stroke-width="${width}" stroke-dasharray="${dash}"/>`);
      return P;
    },
    band(x1, x2, fill = PALEGREEN) {
      under.push(`<rect x="${r2(sx(x1))}" y="${top}" width="${r2(sx(x2) - sx(x1))}" height="${h}" fill="${fill}"/>`);
      return P;
    },
    dot(p, { color = GREEN, open = false, r = 5 } = {}) {
      parts.push(`<circle cx="${r2(sx(p[0]))}" cy="${r2(sy(p[1]))}" r="${r}" fill="${open ? '#FFFFFF' : color}" stroke="${color}" stroke-width="2"/>`);
      return P;
    },
    text(p, s, { color = INK, size = 14, anchor = 'start', dx = 0, dy = 0, italic = false, bold = false } = {}) {
      parts.push(`<text x="${r2(sx(p[0]) + dx)}" y="${r2(sy(p[1]) + dy)}" font-size="${size}" text-anchor="${anchor}" fill="${color}"${italic ? ' font-style="italic"' : ''}${bold ? ' font-weight="bold"' : ''}>${s}</text>`);
      return P;
    },
    /* A vertical double arrow from (x, y1) to (x, y2). */
    varrow(x, y1, y2, { color = VERM, width = 2 } = {}) {
      const X = r2(sx(x)), A = sy(y1), B = sy(y2), s = B < A ? 1 : -1;
      parts.push(`<line x1="${X}" y1="${r2(A - s * 2)}" x2="${X}" y2="${r2(B + s * 2)}" stroke="${color}" stroke-width="${width}"/>`);
      parts.push(`<path d="M${X} ${r2(B)} l-5 ${s * 9} h10 z" fill="${color}"/><path d="M${X} ${r2(A)} l-5 ${-s * 9} h10 z" fill="${color}"/>`);
      return P;
    },
    harrow(y, x1, x2, { color = BLUE, width = 2, both = true } = {}) {
      const Y = r2(sy(y)), A = sx(x1), B = sx(x2);
      parts.push(`<line x1="${r2(A + (both ? 2 : 0))}" y1="${Y}" x2="${r2(B - 2)}" y2="${Y}" stroke="${color}" stroke-width="${width}"/>`);
      parts.push(`<path d="M${r2(B)} ${Y} l-9 -5 v10 z" fill="${color}"/>`);
      if (both) parts.push(`<path d="M${r2(A)} ${Y} l9 -5 v10 z" fill="${color}"/>`);
      return P;
    },
    out() { return parts.flat().join('\n'); },
  };
  return P;
}

const txt = (x, y, s, { size = 15, color = INK, anchor = 'start', bold = false, italic = false } = {}) =>
  `<text x="${r2(x)}" y="${r2(y)}" font-size="${size}" text-anchor="${anchor}" fill="${color}"${bold ? ' font-weight="bold"' : ''}${italic ? ' font-style="italic"' : ''}>${s}</text>`;
const it = s => `<tspan font-style="italic">${s}</tspan>`;
const sup = s => `<tspan baseline-shift="super" font-size="70%">${s}</tspan>`;
const line = (x1, y1, x2, y2, { color = INK, width = 2, dash = null } = {}) =>
  `<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}" stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linecap="round"/>`;
const circle = (cx, cy, r, { stroke = INK, width = 2, fill = 'none', dash = null } = {}) =>
  `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
const dotAt = (x, y, { color = GREEN, r = 5.5 } = {}) => `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r}" fill="${color}"/>`;
/* An arc of a circle centered (cx, cy) on screen, from angle a to b (math angles, radians, counterclockwise). */
const arcPath = (cx, cy, r, a, b, { color = GREEN, width = 4, arrow = false } = {}) => {
  const x1 = cx + r * Math.cos(a), y1 = cy - r * Math.sin(a), x2 = cx + r * Math.cos(b), y2 = cy - r * Math.sin(b);
  const large = Math.abs(b - a) > PI ? 1 : 0, sweep = b > a ? 0 : 1;
  let s = `<path d="M${r2(x1)} ${r2(y1)} A${r2(r)} ${r2(r)} 0 ${large} ${sweep} ${r2(x2)} ${r2(y2)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
  if (arrow) {
    // An arrowhead at the end, pointing along the arc (counterclockwise tangent).
    const tx = -Math.sin(b), ty = -Math.cos(b), nx = Math.cos(b), ny = -Math.sin(b), L = 10, W = 5;
    s += `<path d="M${r2(x2 + tx * 2)} ${r2(y2 + ty * 2)} L${r2(x2 - tx * L + nx * W)} ${r2(y2 - ty * L + ny * W)} L${r2(x2 - tx * L - nx * W)} ${r2(y2 - ty * L - ny * W)} Z" fill="${color}"/>`;
  }
  return s;
};

function svgDoc(id, w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="${FONT}">
<title id="${id}-t">${esc(title)}</title>
<desc id="${id}-d">${esc(desc)}</desc>
<rect width="${w}" height="${h}" fill="#fff"/>
${body}
</svg>
`;
}

/* ------------------------------------------------------------------ figures */
const FIGS = [];
const fig = (id, topic, w, h, title, desc, body) => FIGS.push({ id, topic, w, h, title, desc, body });

/* alg-right-triangle: the three sides named from the angle. */
fig('alg-right-triangle-sides', 'alg-right-triangle', 720, 360,
  'The sides of a right triangle, named from the angle theta',
  'A right triangle with the right angle at the lower right corner and the angle theta at the lower left corner. The longest side, across from the right angle, is the hypotenuse. The vertical side across from theta is the side opposite theta. The horizontal side that touches theta and is not the hypotenuse is the side adjacent to theta. To the right: sine of theta is opposite over hypotenuse, cosine of theta is adjacent over hypotenuse, tangent of theta is opposite over adjacent (SOH CAH TOA).',
  (() => {
    const A = [70, 300], C = [420, 300], B = [420, 90];
    const s = [];
    s.push(`<path d="M${A} L${C} L${B} Z" fill="${PALEGREEN}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`);
    s.push(`<path d="M${C[0] - 22} ${C[1]} v-22 h22" fill="none" stroke="${INK}" stroke-width="1.8"/>`);
    s.push(arcPath(A[0], A[1], 58, 0, Math.atan2(210, 350), { color: VERM, width: 3 }));
    s.push(txt(A[0] + 70, A[1] - 12, it('θ'), { size: 20, color: VERM }));
    s.push(txt(230, 178, 'hypotenuse', { size: 17, bold: true, anchor: 'end' }));
    s.push(txt(434, 200, 'opposite', { size: 17, bold: true }), txt(434, 220, `${it('θ')}`, { size: 16 }));
    s.push(txt(245, 328, `adjacent to ${it('θ')}`, { size: 17, bold: true, anchor: 'middle' }));
    const fr = (x, y, name, top, bot, color) => txt(x, y, `${name} ${it('θ')} =`, { size: 18, color, anchor: 'end' })
      + txt(x + 62, y - 9, top, { size: 16, anchor: 'middle' }) + line(x + 10, y - 3, x + 114, y - 3, { width: 1.5 }) + txt(x + 62, y + 15, bot, { size: 16, anchor: 'middle' });
    s.push(fr(590, 110, 'sin', 'opposite', 'hypotenuse', GREEN));
    s.push(fr(590, 190, 'cos', 'adjacent', 'hypotenuse', BLUE));
    s.push(fr(590, 270, 'tan', 'opposite', 'adjacent', VERM));
    s.push(txt(600, 336, 'SOH CAH TOA', { size: 15, color: MUTED, anchor: 'middle', bold: true }));
    return s.join('\n');
  })());

/* alg-circles: the two special right triangles. */
fig('alg-circles-special', 'alg-circles', 720, 340,
  'The 45-45-90 and 30-60-90 right triangles',
  'Left: a 45-45-90 triangle with two legs of length 1 and a hypotenuse of length square root of 2; both acute angles are 45 degrees. Right: a 30-60-90 triangle with the short leg 1 across from the 30 degree angle, the long leg square root of 3 across from the 60 degree angle, and the hypotenuse 2, twice the short leg.',
  (() => {
    const s = [], u = 150;
    // 45-45-90: right angle lower left.
    const A = [60, 290], B = [60 + u, 290], C = [60, 290 - u];
    s.push(`<path d="M${A} L${B} L${C} Z" fill="${PALEGREEN}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`);
    s.push(`<path d="M${A[0]} ${A[1] - 18} h18 v18" fill="none" stroke="${INK}" stroke-width="1.6"/>`);
    s.push(txt(A[0] + u / 2, A[1] + 26, '1', { size: 19, anchor: 'middle', bold: true }));
    s.push(txt(A[0] - 14, A[1] - u / 2 + 6, '1', { size: 19, anchor: 'end', bold: true }));
    s.push(txt(A[0] + u / 2 + 12, A[1] - u / 2 - 6, '√2', { size: 19, bold: true, color: GREEN }));
    s.push(txt(B[0] - 44, B[1] - 10, '45°', { size: 15, color: VERM }), txt(C[0] + 8, C[1] + 42, '45°', { size: 15, color: VERM }));
    s.push(txt(135, 36, '45-45-90', { size: 18, bold: true, anchor: 'middle' }));
    // 30-60-90: right angle lower left; short leg vertical 1, long leg horizontal sqrt3.
    const k = 120, D = [330, 290], E = [330 + k * Math.sqrt(3), 290], F = [330, 290 - k];
    s.push(`<path d="M${D} L${E} L${F} Z" fill="${PALEGREEN}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`);
    s.push(`<path d="M${D[0]} ${D[1] - 18} h18 v18" fill="none" stroke="${INK}" stroke-width="1.6"/>`);
    s.push(txt((D[0] + E[0]) / 2, D[1] + 26, '√3', { size: 19, anchor: 'middle', bold: true }));
    s.push(txt(D[0] - 14, D[1] - k / 2 + 6, '1', { size: 19, anchor: 'end', bold: true }));
    s.push(txt((E[0] + F[0]) / 2 + 12, (E[1] + F[1]) / 2 - 8, '2', { size: 19, bold: true, color: GREEN }));
    s.push(txt(E[0] - 62, E[1] - 10, '30°', { size: 15, color: VERM }), txt(F[0] + 8, F[1] + 34, '60°', { size: 15, color: VERM }));
    s.push(txt(470, 36, '30-60-90', { size: 18, bold: true, anchor: 'middle' }));
    s.push(txt(470, 60, 'hypotenuse = 2 × short leg', { size: 14, color: MUTED, anchor: 'middle' }));
    s.push(txt(135, 60, 'hypotenuse = √2 × leg', { size: 14, color: MUTED, anchor: 'middle' }));
    return s.join('\n');
  })());

/* alg-circles: arc length as a fraction of the circumference, and a circle on a grid. */
fig('alg-circles-arc', 'alg-circles', 760, 360,
  'Arc length as a fraction of the circle, and the equation of a circle',
  'Left: a circle with center O and radius r. A central angle of 60 degrees cuts off an arc, drawn in green, of length s. Because 60 degrees is one sixth of 360 degrees, the arc is one sixth of the circumference 2 pi r. Right: on a coordinate grid, the circle with center (2, −1) and radius 3, whose equation is (x − 2) squared plus (y + 1) squared equals 9. The points (5, −1) and (2, 2) are marked on it, each 3 units from the center.',
  (() => {
    const s = [], cx = 175, cy = 190, R = 120, a = PI / 3;
    s.push(circle(cx, cy, R, { width: 2 }));
    s.push(line(cx, cy, cx + R, cy, { width: 2 }), line(cx, cy, cx + R * Math.cos(a), cy - R * Math.sin(a), { width: 2 }));
    s.push(arcPath(cx, cy, R, 0, a, { color: GREEN, width: 6 }));
    s.push(arcPath(cx, cy, 34, 0, a, { color: VERM, width: 2.5 }));
    s.push(txt(cx + 40, cy - 14, '60°', { size: 15, color: VERM }));
    s.push(dotAt(cx, cy, { color: INK, r: 4 }), txt(cx - 10, cy + 20, it('O'), { size: 16 }));
    s.push(txt(cx + R / 2, cy + 22, it('r'), { size: 18, anchor: 'middle' }));
    s.push(txt(cx + R * Math.cos(a / 2) + 14, cy - R * Math.sin(a / 2), it('s'), { size: 20, color: GREEN, bold: true }));
    s.push(txt(cx, 340, `${it('s')} = (60/360) · 2π${it('r')} = π${it('r')}/3`, { size: 16, anchor: 'middle' }));
    const P = panel({ left: 420, top: 40, w: 290, h: 270, x: [-2, 6.5], y: [-5, 3.5], xTicks: [1, 2, 3, 4, 5, 6], yTicks: [-4, -2, -1, 1, 2, 3], xLabel: 'x', yLabel: 'y' });
    const pts = []; for (let i = 0; i <= 240; i++) { const t = 2 * PI * i / 240; pts.push([2 + 3 * Math.cos(t), -1 + 3 * Math.sin(t)]); }
    P.poly(pts, { color: GREEN, width: 3 });
    P.seg([2, -1], [5, -1], { color: BLUE, width: 2, dash: '5 4' });
    P.dot([2, -1], { color: INK, r: 4 }).dot([5, -1], { color: VERM }).dot([2, 2], { color: VERM });
    P.text([2, -1], '(2, −1)', { dx: -8, dy: 20, anchor: 'end', size: 13 });
    P.text([5, -1], '(5, −1)', { dx: 6, dy: 20, size: 13 });
    P.text([2, 2], '(2, 2)', { dx: 8, dy: -8, size: 13 });
    s.push(P.out());
    s.push(txt(565, 346, `(${it('x')} − 2)${sup('2')} + (${it('y')} + 1)${sup('2')} = 9`, { size: 16, anchor: 'middle' }));
    return s.join('\n');
  })());

/* periodic-phenomena: a repeating cycle and its period. */
const tank = t => { const u = ((t % 6) + 6) % 6; return u <= 2 ? 1 + 2 * u : u <= 3 ? 5 : 5 - 4 * (u - 3) / 3; };
fig('periodic-phenomena-cycle', 'periodic-phenomena', 720, 340,
  'One cycle of a periodic function, repeated',
  'The depth of water in a tank, in feet, over 18 minutes. In each 6-minute cycle the depth rises in a straight line from 1 foot to 5 feet in 2 minutes, stays at 5 feet for 1 minute, then falls in a straight line back to 1 foot over 3 minutes. The first cycle, from t = 0 to t = 6, is shaded and drawn in green; the next two cycles are exact copies. A bracket marks the period, 6 minutes.',
  (() => {
    const P = panel({ left: 60, top: 50, w: 600, h: 230, x: [0, 18.5], y: [0, 7], xTicks: [0, 2, 3, 6, 8, 9, 12, 14, 15, 18], yTicks: [1, 2, 3, 4, 5], xLabel: 't', yLabel: 'depth (ft)' });
    P.band(0, 6);
    P.curve(tank, 6, 18, { color: BLUE, width: 2.5 });
    P.curve(tank, 0, 6, { color: GREEN, width: 3.5 });
    P.harrow(6.2, 0, 6, { color: VERM });
    P.text([3, 6.2], 'one period: 6 minutes', { anchor: 'middle', dy: -8, color: VERM, bold: true });
    P.text([18.3, 0], 'minutes', { dx: -4, dy: 34, anchor: 'end', size: 13, color: MUTED });
    return P.out();
  })());

/* sine-cosine-tangent: the unit circle definitions. */
fig('sine-cosine-tangent-unit-circle', 'sine-cosine-tangent', 740, 420,
  'Sine, cosine and tangent on the unit circle',
  'A circle of radius 1 centered at the origin. An angle theta in standard position starts on the positive x-axis (the initial ray) and turns counterclockwise to the terminal ray, which meets the circle at P. The arc from (1, 0) to P, drawn in green, has length theta, because the radius is 1. A dashed vertical segment from P down to the x-axis has length sine of theta; the horizontal distance from the origin is cosine of theta. So P is (cos theta, sin theta). The slope of the terminal ray is sin theta over cos theta, which is tangent of theta.',
  (() => {
    const s = [], cx = 220, cy = 210, R = 160, a = 0.95;
    const X = cx + R * Math.cos(a), Y = cy - R * Math.sin(a);
    s.push(line(cx - R - 30, cy, cx + R + 30, cy, { width: 1.4 }), line(cx, cy + R + 30, cx, cy - R - 30, { width: 1.4 }));
    s.push(`<path d="M${cx + R + 30} ${cy} l-8 -4 v8 z" fill="${INK}"/><path d="M${cx} ${cy - R - 30} l-4 8 h8 z" fill="${INK}"/>`);
    s.push(txt(cx + R + 34, cy + 5, it('x'), { size: 16 }), txt(cx + 8, cy - R - 26, it('y'), { size: 16 }));
    s.push(circle(cx, cy, R, { width: 2 }));
    s.push(line(cx, cy, cx + R, cy, { color: INK, width: 3 }));
    s.push(line(cx, cy, X, Y, { color: INK, width: 3 }));
    s.push(arcPath(cx, cy, R, 0, a, { color: GREEN, width: 6 }));
    s.push(arcPath(cx, cy, 40, 0, a, { color: VERM, width: 2.5, arrow: true }));
    s.push(txt(cx + 48, cy - 16, it('θ'), { size: 18, color: VERM }));
    s.push(line(X, Y, X, cy, { color: BLUE, width: 2.5, dash: '6 5' }));
    s.push(line(cx, cy + 3, X, cy + 3, { color: VERM, width: 4 }));
    s.push(txt(X + 8, (Y + cy) / 2 + 5, `sin ${it('θ')}`, { size: 16, color: BLUE, bold: true }));
    s.push(txt((cx + X) / 2, cy + 24, `cos ${it('θ')}`, { size: 16, color: VERM, bold: true, anchor: 'middle' }));
    s.push(dotAt(X, Y, { color: GREEN, r: 6.5 }));
    s.push(txt(X + 10, Y - 10, `${it('P')} = (cos ${it('θ')}, sin ${it('θ')})`, { size: 16, bold: true }));
    s.push(txt(cx + (R + 12) * Math.cos(a / 2), cy - (R + 12) * Math.sin(a / 2) + 6, `arc length ${it('θ')}`, { size: 14, color: GREEN }));
    s.push(txt(cx + R + 8, cy - 8, '1', { size: 14 }), txt(cx - R - 8, cy - 8, '−1', { size: 14, anchor: 'end' }));
    s.push(txt(cx + 6, cy - R - 6, '1', { size: 14 }), txt(cx + 6, cy + R + 18, '−1', { size: 14 }));
    s.push(txt(cx + 70, cy + 44, 'initial ray', { size: 13, color: MUTED }));
    s.push(txt((cx + X) / 2 - 16, (cy + Y) / 2 - 10, 'terminal ray', { size: 13, color: MUTED, anchor: 'end' }));
    const tx = 470;
    s.push(txt(tx, 90, 'Radius 1, so:', { size: 16, bold: true }));
    s.push(txt(tx, 124, `cos ${it('θ')} = ${it('x')}-coordinate of ${it('P')}`, { size: 16, color: VERM }));
    s.push(txt(tx, 156, `sin ${it('θ')} = ${it('y')}-coordinate of ${it('P')}`, { size: 16, color: BLUE }));
    s.push(txt(tx, 188, `tan ${it('θ')} = sin ${it('θ')} / cos ${it('θ')}`, { size: 16 }));
    s.push(txt(tx, 212, '= slope of the terminal ray', { size: 16 }));
    s.push(txt(tx, 256, `${it('θ')} in radians = arc length`, { size: 16, color: GREEN }));
    s.push(txt(tx, 280, 'cut off on a radius-1 circle', { size: 16, color: GREEN }));
    return s.join('\n');
  })());

/* sine-cosine-tangent: a point P on the circle (stimulus). */
fig('sine-cosine-tangent-point-p', 'sine-cosine-tangent', 520, 420,
  'An angle theta in standard position with P = (−3/5, 4/5)',
  'A circle of radius 1 centered at the origin, with the x- and y-axes. An angle theta in standard position turns counterclockwise from the positive x-axis to a terminal ray in the second quadrant, which meets the circle at the point P with coordinates (−3/5, 4/5). A dashed segment drops from P to the x-axis.',
  (() => {
    const s = [], cx = 260, cy = 220, R = 160, Px = -0.6, Py = 0.8, a = Math.atan2(Py, Px);
    const X = cx + R * Px, Y = cy - R * Py;
    s.push(line(cx - R - 40, cy, cx + R + 40, cy, { width: 1.4 }), line(cx, cy + R + 30, cx, cy - R - 34, { width: 1.4 }));
    s.push(`<path d="M${cx + R + 40} ${cy} l-8 -4 v8 z" fill="${INK}"/><path d="M${cx} ${cy - R - 34} l-4 8 h8 z" fill="${INK}"/>`);
    s.push(txt(cx + R + 44, cy + 5, it('x'), { size: 16 }), txt(cx + 8, cy - R - 28, it('y'), { size: 16 }));
    s.push(circle(cx, cy, R, { width: 2 }));
    s.push(line(cx, cy, X, Y, { width: 3 }), line(cx, cy, cx + R, cy, { width: 3 }));
    s.push(arcPath(cx, cy, 36, 0, a, { color: VERM, width: 2.5, arrow: true }));
    s.push(txt(cx + 30, cy - 40, it('θ'), { size: 19, color: VERM }));
    s.push(line(X, Y, X, cy, { color: BLUE, width: 2, dash: '6 5' }));
    s.push(dotAt(X, Y, { color: GREEN, r: 6.5 }));
    s.push(txt(X - 10, Y - 12, `${it('P')}(−3/5, 4/5)`, { size: 17, bold: true, anchor: 'end' }));
    s.push(txt(cx + R + 6, cy + 20, '1', { size: 14 }), txt(cx - R - 6, cy + 20, '−1', { size: 14, anchor: 'end' }));
    s.push(txt(cx + 8, cy - R - 6, '1', { size: 14 }), txt(cx + 8, cy + R + 20, '−1', { size: 14 }));
    s.push(txt(cx + 118, cy + R + 14, `${it('x')}${sup('2')} + ${it('y')}${sup('2')} = 1`, { size: 15, color: MUTED }));
    return s.join('\n');
  })());

/* sine-cosine-values: the angles you know exactly. */
fig('sine-cosine-values-special', 'sine-cosine-values', 780, 520,
  'Exact sine and cosine values at multiples of pi/6 and pi/4',
  'A circle of radius 1 centered at the origin with a dot at every multiple of pi/6 and pi/4 from 0 to 2 pi, each labeled with its angle in radians. The first-quadrant points are labeled with their coordinates: at pi/6, (square root of 3 over 2, 1/2); at pi/4, (square root of 2 over 2, square root of 2 over 2); at pi/3, (1/2, square root of 3 over 2). A table to the right lists cosine and sine at 0, pi/6, pi/4, pi/3 and pi/2: cosine 1, root 3 over 2, root 2 over 2, 1/2, 0 and sine 0, 1/2, root 2 over 2, root 3 over 2, 1. The other quadrants repeat these values with signs set by the quadrant.',
  (() => {
    const s = [], cx = 260, cy = 260, R = 175;
    s.push(line(cx - R - 40, cy, cx + R + 40, cy, { width: 1.4 }), line(cx, cy + R + 40, cx, cy - R - 40, { width: 1.4 }));
    s.push(circle(cx, cy, R, { width: 2 }));
    const angs = [];
    for (let k = 0; k < 12; k++) angs.push([k * PI / 6, 6]);
    for (const k of [1, 3, 5, 7]) angs.push([k * PI / 4, 4]);
    for (const [a, den] of angs) {
      const X = cx + R * Math.cos(a), Y = cy - R * Math.sin(a);
      s.push(line(cx, cy, X, Y, { color: GRID, width: 1.2 }));
      s.push(dotAt(X, Y, { color: den === 4 ? BLUE : GREEN, r: 5 }));
      const lx = cx + (R + 28) * Math.cos(a), ly = cy - (R + 28) * Math.sin(a) + 5;
      s.push(txt(lx, ly, piLabel(a, den), { size: 14, anchor: Math.abs(Math.cos(a)) < 0.2 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end', color: den === 4 ? BLUE : GREEN, bold: true }));
    }
    const q1 = [[PI / 6, '(√3/2, 1/2)'], [PI / 4, '(√2/2, √2/2)'], [PI / 3, '(1/2, √3/2)']];
    for (const [a, lab] of q1) {
      const X = cx + (R - 12) * Math.cos(a), Y = cy - (R - 12) * Math.sin(a);
      s.push(txt(X - 6, Y + 4, lab, { size: 13, anchor: 'end' }));
    }
    s.push(txt(cx + R + 8, cy + 20, '', { size: 1 }));
    // Table
    const tx = 560, ty = 120, cw = [70, 70, 70], rh = 40;
    const rows = [['θ', 'cos θ', 'sin θ'], ['0', '1', '0'], ['π/6', '√3/2', '1/2'], ['π/4', '√2/2', '√2/2'], ['π/3', '1/2', '√3/2'], ['π/2', '0', '1']];
    rows.forEach((r, i) => {
      const y = ty + i * rh;
      if (i === 0) s.push(`<rect x="${tx - 10}" y="${y - 26}" width="${cw.reduce((a, b) => a + b) + 20}" height="${rh}" fill="${PALEGREEN}"/>`);
      r.forEach((c, j) => s.push(txt(tx + 25 + j * 70, y, c, { size: 16, anchor: 'middle', bold: i === 0 || j === 0, italic: i === 0 && j === 0 })));
      s.push(line(tx - 10, y + 14, tx + 220, y + 14, { color: GRID, width: 1.2 }));
    });
    s.push(txt(tx + 105, ty + 6 * rh + 10, 'Other quadrants: same sizes,', { size: 14, anchor: 'middle', color: MUTED }));
    s.push(txt(tx + 105, ty + 6 * rh + 30, 'signs from the quadrant.', { size: 14, anchor: 'middle', color: MUTED }));
    return s.join('\n');
  })());

/* sine-cosine-curves: unrolling the circle into the graph of sine. */
fig('sine-cosine-curves-unroll', 'sine-cosine-curves', 780, 340,
  'The graph of sine traced from the unit circle',
  'Left: a circle of radius 1 with the point P at angle 2 pi over 3, whose height above the x-axis is sine of 2 pi over 3, about 0.87. Right: the graph of y = sin theta for theta from 0 to 2 pi in green, with the graph of y = cos theta dashed in blue for comparison. A dashed horizontal line carries the height of P across to the point (2 pi over 3, sin 2 pi over 3) on the sine graph. The sine graph starts at 0, rises to 1 at pi/2, returns to 0 at pi, falls to −1 at 3 pi over 2 and returns to 0 at 2 pi.',
  (() => {
    const s = [], cx = 120, cy = 170, R = 90, a = 2 * PI / 3;
    const X = cx + R * Math.cos(a), Y = cy - R * Math.sin(a);
    s.push(line(cx - R - 20, cy, cx + R + 20, cy, { width: 1.4 }), line(cx, cy + R + 20, cx, cy - R - 20, { width: 1.4 }));
    s.push(circle(cx, cy, R, { width: 2 }));
    s.push(line(cx, cy, X, Y, { width: 2.5 }), arcPath(cx, cy, R, 0, a, { color: GREEN, width: 5 }));
    s.push(line(X, Y, X, cy, { color: GREEN, width: 3 }));
    s.push(dotAt(X, Y, { color: GREEN, r: 6 }), txt(X - 8, Y - 10, it('P'), { size: 16, anchor: 'end', bold: true }));
    s.push(txt(cx + 14, cy - 18, '2π/3', { size: 13, color: VERM }));
    const P = panel({ left: 290, top: 80, w: 440, h: 180, x: [0, 2 * PI + 0.25], y: [-1.25, 1.25], xTicks: [PI / 2, PI, 3 * PI / 2, 2 * PI], yTicks: [-1, 1], xTickLabel: v => piLabel(v, 2), xLabel: 'θ', yLabel: 'y' });
    P.curve(x => Math.cos(x), 0, 2 * PI, { color: BLUE, width: 2.2, dash: '7 6' });
    P.curve(x => Math.sin(x), 0, 2 * PI, { color: GREEN, width: 3.5 });
    P.seg([a, 0], [a, Math.sin(a)], { color: GREEN, width: 3 });
    P.dot([a, Math.sin(a)]);
    P.text([PI / 2, 1], `${it('y')} = sin ${it('θ')}`, { dy: -10, anchor: 'middle', color: GREEN, bold: true });
    P.text([5.1, 1.1], `${it('y')} = cos ${it('θ')}`, { color: BLUE, anchor: 'end' });
    s.push(P.out());
    s.push(line(X, Y, P.sx(a), P.sy(Math.sin(a)), { color: MUTED, width: 1.5, dash: '5 5' }));
    s.push(txt(390, 318, 'The height of P becomes the height of the graph.', { size: 14, anchor: 'middle', color: MUTED }));
    return s.join('\n');
  })());

/* sinusoidal-functions: amplitude, midline, period. */
fig('sinusoidal-functions-parts', 'sinusoidal-functions', 720, 360,
  'Amplitude, midline and period of a sinusoidal function',
  'The graph of y = 3 sin(pi t / 4) + 5 for t from 0 to 10. The dashed midline y = 5 runs halfway between the maximum 8 and the minimum 2. A vertical arrow from the midline up to the maximum shows the amplitude, 3. A horizontal arrow from t = 0 to t = 8 shows one period, 8; the frequency is 1/8 of a cycle per unit of t.',
  (() => {
    const f = t => 3 * Math.sin(PI * t / 4) + 5;
    const P = panel({ left: 60, top: 50, w: 600, h: 250, x: [0, 10.5], y: [0, 9.6], xTicks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], yTicks: [1, 2, 3, 4, 5, 6, 7, 8, 9], xLabel: 't', yLabel: 'y' });
    P.hline(5, { color: VERM, dash: '8 6', width: 2 });
    P.hline(8, { color: GRID, dash: '3 4', width: 1 }).hline(2, { color: GRID, dash: '3 4', width: 1 });
    P.curve(f, 0, 10, { color: GREEN, width: 3.5 });
    P.varrow(2, 5, 8, { color: VERM });
    P.text([2.12, 5.5], 'amplitude 3', { color: VERM, bold: true, size: 13 });
    P.harrow(9.05, 0, 8, { color: BLUE });
    P.text([4, 9.05], 'period 8', { anchor: 'middle', dy: -8, color: BLUE, bold: true });
    P.text([10, 5], 'midline y = 5', { dy: -8, anchor: 'end', color: VERM });
    P.dot([2, 8]).dot([6, 2]);
    P.text([6, 2], 'minimum 2', { dy: 22, size: 13, anchor: 'middle' });
    P.text([2, 8], 'maximum 8', { dx: -10, dy: -8, size: 13, anchor: 'end' });
    return P.out();
  })());

/* sinusoidal-transformations: a shift, a stretch, a lift. */
fig('sinusoidal-transformations-shift', 'sinusoidal-transformations', 740, 360,
  'From y = sin theta to g(theta) = 2 sin(theta − pi/4) + 1',
  'Dashed gray: the graph of y = sin theta. Green: the graph of g(theta) = 2 sin(theta − pi/4) + 1 for theta from −pi/4 to 9 pi over 4. Compared with sine, g is moved right by pi/4 (the phase shift, shown by an arrow from the origin to (pi/4, 1)), stretched vertically so its amplitude is 2, and moved up so its midline is y = 1 (dashed). Its maximum 3 is at 3 pi over 4 and its minimum −1 at 7 pi over 4; its period is still 2 pi.',
  (() => {
    const g = t => 2 * Math.sin(t - PI / 4) + 1;
    const xt = []; for (let k = -1; k <= 9; k++) if (k !== 0) xt.push(k * PI / 4);
    const P = panel({ left: 50, top: 40, w: 640, h: 260, x: [-PI / 4 - 0.1, 9 * PI / 4 + 0.15], y: [-1.6, 3.5], xTicks: xt, yTicks: [-1, 1, 2, 3], xTickLabel: v => piLabel(v, 4), xLabel: 'θ', yLabel: 'y' });
    P.hline(1, { color: VERM, dash: '8 6', width: 1.8 });
    P.curve(x => Math.sin(x), -PI / 4, 9 * PI / 4, { color: MUTED, width: 2, dash: '6 5' });
    P.curve(g, -PI / 4, 9 * PI / 4, { color: GREEN, width: 3.5 });
    P.harrow(1, 0, PI / 4, { color: BLUE, both: false });
    P.text([PI / 8, 1], 'shift π/4', { dy: -10, anchor: 'middle', color: BLUE, bold: true, size: 13 });
    P.dot([PI / 4, 1]).dot([3 * PI / 4, 3]).dot([7 * PI / 4, -1]);
    P.text([3 * PI / 4, 3], 'max 3', { dx: 10, dy: 4, size: 13 });
    P.text([7 * PI / 4, -1], 'min −1', { dx: 10, dy: 4, size: 13 });
    P.text([9 * PI / 4, 1], 'midline y = 1', { dy: -8, anchor: 'end', color: VERM, size: 13 });
    P.text([PI / 2, 1], `${it('y')} = sin ${it('θ')}`, { dy: 18, dx: 6, color: MUTED, size: 13 });
    return P.out() + txt(370, 345, `${it('g')}(${it('θ')}) = 2 sin(${it('θ')} − π/4) + 1`, { size: 16, anchor: 'middle', color: GREEN, bold: true });
  })());

/* Unscaled graphs for the Q3-style stimuli: axes with no numbers, five lettered points. */
function unscaled({ f, a, b, ymin, ymax, pts, x0 = a, xLabel = 't', yLabel = 'h(t)', left = 380, w = 340, top = 60, h = 240, guides = true }) {
  const P = panel({ left, top, w, h, x: [x0 - (b - x0) * 0.04, b + (b - x0) * 0.06], y: [ymin, ymax], xTicks: [], yTicks: [], grid: false, xLabel, yLabel, origin: true });
  P.curve(f, a, b, { color: GREEN, width: 3.2 });
  for (const [L, x, dx = 8, dy = -10, anchor = 'start'] of pts) {
    const y = f(x);
    if (guides) P.seg([x, y], [x, 0], { color: GRID, width: 1.2, dash: '4 4' });
    P.dot([x, y], { color: INK, r: 5 });
    P.text([x, y], it(L), { dx, dy, size: 17, bold: true, anchor });
  }
  return P;
}

/* sinusoidal-transformations: the waterwheel (FRQ). */
const wheelH = t => 3 * Math.sin(PI / 6 * (t + 3)) + 1;
fig('sinusoidal-transformations-waterwheel', 'sinusoidal-transformations', 760, 360,
  'A waterwheel and the height of a point on its rim',
  'Left: a waterwheel whose center is above the water line, with the lower part of the wheel under water. A point P on the rim is at the top of the wheel. Right: an unscaled graph of h(t), the height of P above the water, for one turn of the wheel. The graph starts at its highest point F, falls through G to its lowest point J, which is below the t-axis, rises through K, and ends at the highest point M. G and K are halfway between the highest and lowest heights. The axes have no scale.',
  (() => {
    const s = [], cx = 170, cy = 165, R = 105, wl = cy + R / 3;
    s.push(`<rect x="20" y="${wl}" width="320" height="${360 - wl - 20}" fill="${WATER}"/>`);
    s.push(line(20, wl, 340, wl, { color: BLUE, width: 2.5 }));
    s.push(circle(cx, cy, R, { width: 3 }));
    for (let k = 0; k < 8; k++) { const t = k * PI / 4; s.push(line(cx, cy, cx + R * Math.cos(t), cy - R * Math.sin(t), { color: MUTED, width: 1.4 })); }
    s.push(dotAt(cx, cy, { color: INK, r: 5 }));
    s.push(dotAt(cx, cy - R, { color: VERM, r: 7 }), txt(cx + 12, cy - R - 8, it('P'), { size: 18, bold: true, color: VERM }));
    s.push(arcPath(cx, cy, R + 18, PI / 2 + 0.25, PI / 2 + 0.9, { color: VERM, width: 2.5, arrow: true }));
    s.push(txt(300, wl + 22, 'water', { size: 14, color: BLUE, anchor: 'end' }));
    const P = unscaled({ f: wheelH, a: 0, b: 12, ymin: -2.8, ymax: 4.8, pts: [['F', 0, 10, -6], ['G', 3, 8, -10], ['J', 6, 0, 26, 'middle'], ['K', 9, -10, -10, 'end'], ['M', 12, -6, -10, 'end']], guides: false });
    s.push(P.out());
    return s.join('\n');
  })());

/* sinusoidal-modeling: the Ferris wheel (FRQ). */
const ferrisH = t => 20 * Math.sin(PI / 4 * (t - 2)) + 25;
fig('sinusoidal-modeling-ferris', 'sinusoidal-modeling', 760, 360,
  'A Ferris wheel and the height of a seat',
  'Left: a Ferris wheel on a support above the ground, turning counterclockwise, with a seat S at the lowest point of the wheel, which is above the ground. Right: an unscaled graph of h(t), the height of the seat above the ground, for one turn. The graph starts at its lowest point F, rises through G to its highest point J, falls through K and ends at the lowest point M. G and K are at the height of the center of the wheel. The axes have no scale.',
  (() => {
    const s = [], cx = 170, cy = 150, R = 110, ground = 320;
    s.push(line(20, ground, 340, ground, { width: 2.5 }));
    s.push(line(cx, cy, cx - 70, ground, { color: MUTED, width: 4 }), line(cx, cy, cx + 70, ground, { color: MUTED, width: 4 }));
    s.push(circle(cx, cy, R, { width: 3 }));
    for (let k = 0; k < 8; k++) { const t = k * PI / 4; s.push(line(cx, cy, cx + R * Math.cos(t), cy - R * Math.sin(t), { color: GRID, width: 1.4 })); s.push(circle(cx + R * Math.cos(t), cy - R * Math.sin(t), 6, { width: 1.5, fill: '#fff' })); }
    s.push(dotAt(cx, cy, { color: INK, r: 5 }));
    s.push(dotAt(cx, cy + R, { color: VERM, r: 8 }), txt(cx + 14, cy + R + 6, it('S'), { size: 18, bold: true, color: VERM }));
    s.push(arcPath(cx, cy, R + 18, -PI / 2 + 0.25, -PI / 2 + 0.9, { color: VERM, width: 2.5, arrow: true }));
    s.push(txt(330, ground + 20, 'ground', { size: 14, color: MUTED, anchor: 'end' }));
    const P = unscaled({ f: ferrisH, a: 0, b: 8, ymin: 0, ymax: 50, pts: [['F', 0, 12, 20], ['G', 2, -10, -6, 'end'], ['J', 4, 0, -12, 'middle'], ['K', 6, 10, -6], ['M', 8, -4, 18, 'end']], guides: false });
    s.push(P.out());
    return s.join('\n');
  })());

/* sinusoidal-modeling: the tide (FRQ). */
const tideW = t => 1.2 * Math.cos(PI / 6 * (t - 2)) + 1.9;
fig('sinusoidal-modeling-tide', 'sinusoidal-modeling', 600, 340,
  'The depth of water at a dock over one tide cycle',
  'An unscaled graph of W(t), the depth of water at a dock, for t from 2 to 14 hours after midnight. The graph starts at a high point P, falls through Q to a low point R, rises through S and ends at the next high point T. Q and S are halfway between the high and low depths. The axes have no scale.',
  unscaled({ f: tideW, a: 2, b: 14, x0: 0, ymin: 0, ymax: 3.8, xLabel: 't', yLabel: 'W(t)', left: 70, w: 460, top: 50, h: 240,
    pts: [['P', 2, 10, -4], ['Q', 5, 8, -10], ['R', 8, 0, 24, 'middle'], ['S', 11, -10, -10, 'end'], ['T', 14, -10, -4, 'end']] }).out()
    .replace(/<line x1="[\d.]+" y1="[\d.]+" x2="[\d.]+" y2="[\d.]+" stroke="#E4E7E6" stroke-width="1.2" stroke-dasharray="4 4"\/>/g, ''));

/* sinusoidal-modeling: the spring (FRQ). */
const springH = t => 10 * Math.sin(PI * (t + 0.5)) + 50;
fig('sinusoidal-modeling-spring', 'sinusoidal-modeling', 720, 340,
  'A weight on a spring and its height above the floor',
  'Left: a weight hanging from a spring attached to a beam, above a floor, bobbing up and down. Right: an unscaled graph of h(t), the height of the bottom of the weight above the floor, for one cycle. The graph starts at its highest point F, falls through G to its lowest point J, rises through K and ends at the highest point M. G and K are halfway between the highest and lowest heights. The axes have no scale.',
  (() => {
    const s = [], x0 = 150;
    s.push(`<rect x="60" y="30" width="180" height="14" fill="${MUTED}"/>`);
    let d = `M${x0} 44 L${x0} 60`;
    for (let k = 0; k < 10; k++) d += ` L${x0 + (k % 2 ? -18 : 18)} ${66 + k * 10}`;
    d += ` L${x0} 166 L${x0} 176`;
    s.push(`<path d="${d}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`);
    s.push(`<rect x="${x0 - 32}" y="176" width="64" height="44" rx="5" fill="${GREEN}"/>`);
    s.push(line(40, 310, 260, 310, { width: 2.5 }), txt(250, 330, 'floor', { size: 14, color: MUTED, anchor: 'end' }));
    s.push(line(205, 220, 205, 308, { color: BLUE, width: 2, dash: '5 4' }), txt(212, 268, it('h'), { size: 17, color: BLUE, bold: true }));
    s.push(`<path d="M${x0 + 50} 150 v-26 l-5 9 h10 l-5 -9 M${x0 + 50} 150 v26 l-5 -9 h10 l-5 9" fill="none" stroke="${VERM}" stroke-width="2"/>`);
    const P = unscaled({ f: springH, a: 0, b: 2, ymin: 0, ymax: 66, left: 340, w: 330, top: 50, h: 240,
      pts: [['F', 0, 10, -4], ['G', 0.5, 8, -10], ['J', 1, 0, 24, 'middle'], ['K', 1.5, -10, -10, 'end'], ['M', 2, -10, -4, 'end']], guides: false });
    s.push(P.out());
    return s.join('\n');
  })());

/* sinusoidal-modeling: greenhouse temperature (stimulus set). */
const greenT = t => -8 * Math.cos(PI / 12 * (t - 4)) + 20;
fig('sinusoidal-modeling-greenhouse', 'sinusoidal-modeling', 620, 340,
  'The temperature in a greenhouse over a day',
  'An unscaled graph of T(t), the temperature in a greenhouse, in degrees Celsius, t hours after midnight, for t from 4 to 28. The graph starts at a lowest point P, rises through Q to a highest point R, falls through S and ends at the next lowest point U. Q and S are halfway between the lowest and highest temperatures. The axes have no scale.',
  unscaled({ f: greenT, a: 4, b: 28, x0: 0, ymin: 0, ymax: 32, xLabel: 't', yLabel: 'T(t)', left: 70, w: 480, top: 50, h: 240,
    pts: [['P', 4, 0, 24, 'middle'], ['Q', 10, -10, -10, 'end'], ['R', 16, 0, -12, 'middle'], ['S', 22, 10, -10], ['U', 28, -6, 24, 'end']], guides: false }).out());

/* ------------------------------------------------------------------ write */
const only = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
mkdirSync(REG, { recursive: true });
const reg = {};
for (const F of FIGS) {
  (reg[F.topic] ||= {})[F.id] = { file: `figures/${F.id}.svg`, ext: 'svg', w: F.w, h: F.h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt: F.desc };
  if (only.length && !only.includes(F.id)) continue;
  writeFileSync(join(OUT, `${F.id}.svg`), svgDoc(F.id, F.w, F.h, F.title, F.desc, F.body));
  console.log(`wrote precalculus/figures/${F.id}.svg`);
}
for (const [topic, o] of Object.entries(reg)) writeFileSync(join(REG, `${topic}.json`), JSON.stringify(o, null, 1) + '\n');
console.log(`registries: ${Object.keys(reg).map(t => `data/figures/${t}.json`).join(', ')}`);
export { tank, wheelH, ferrisH, tideW, springH, greenT };
