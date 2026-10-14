/* Figures for AP® Calculus AB Units 3 and 4 (composite, implicit and inverse
   functions; contextual applications of the derivative). Every curve is
   sampled from the function it claims to show (through the course's own
   expression parser, ApCalcExpr, or a parametrization of the stated curve)
   and written as a standalone SVG (white background, Arial, role="img" with
   <title> and <desc>) to calculus/figures/<id>.svg.

     node scripts/apcalc-figures/units-3-4.mjs            write every figure
     node scripts/apcalc-figures/units-3-4.mjs <id> ...   write some */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Expr } from '../lib/apcalc-mathlib.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'calculus', 'figures');
const INK = '#1F2A28', CRIMSON = '#8C1036', BLUE = '#0072B2', GREEN = '#009E73', VERM = '#D55E00', GRID = '#E4E7E6', MUTED = '#5A6563';
const PALE = '#F6E3E9', PALEBLUE = '#E3EEF7', WATER = '#CFE3F2';
const FONT = 'Arial, Helvetica, sans-serif';
const r2 = v => Math.round(v * 100) / 100;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fnOf = f => typeof f === 'function' ? f : Expr.fn(f, ['x']);
const PI = Math.PI;
const minus = v => String(v).replace('-', '−');

/* One coordinate panel. o: { left, top, w, h, x: [a, b], y: [c, d], xTicks, yTicks,
   xTickLabel(v), yTickLabel(v), xLabel, yLabel, grid } */
function panel(o) {
  const { left, top, w, h } = o;
  const sx = v => left + (v - o.x[0]) / (o.x[1] - o.x[0]) * w;
  const sy = v => top + (o.y[1] - v) / (o.y[1] - o.y[0]) * h;
  const parts = [];
  const clip = `clip${Math.round(left)}x${Math.round(top)}`;
  parts.push(`<clipPath id="${clip}"><rect x="${left}" y="${top}" width="${w}" height="${h}"/></clipPath>`);
  const under = [];   // shading drawn under the grid lines' axes
  parts.push(under);
  if (o.grid !== false) {
    for (const v of o.xTicks || []) parts.push(`<line x1="${r2(sx(v))}" y1="${top}" x2="${r2(sx(v))}" y2="${top + h}" stroke="${GRID}" stroke-width="1"/>`);
    for (const v of o.yTicks || []) parts.push(`<line x1="${left}" y1="${r2(sy(v))}" x2="${left + w}" y2="${r2(sy(v))}" stroke="${GRID}" stroke-width="1"/>`);
  }
  const ax = o.y[0] <= 0 && o.y[1] >= 0 ? sy(0) : top + h;
  const ay = o.x[0] <= 0 && o.x[1] >= 0 ? sx(0) : left;
  parts.push(`<line x1="${left}" y1="${r2(ax)}" x2="${left + w + 8}" y2="${r2(ax)}" stroke="${INK}" stroke-width="1.4"/>`);
  parts.push(`<path d="M${left + w + 8} ${r2(ax)} l-7 -3.5 v7 z" fill="${INK}"/>`);
  parts.push(`<line x1="${r2(ay)}" y1="${top + h}" x2="${r2(ay)}" y2="${top - 8}" stroke="${INK}" stroke-width="1.4"/>`);
  parts.push(`<path d="M${r2(ay)} ${top - 8} l-3.5 7 h7 z" fill="${INK}"/>`);
  const tl = o.xTickLabel || (v => minus(+v.toFixed(4)));
  const yl = o.yTickLabel || (v => minus(+v.toFixed(4)));
  for (const v of o.xTicks || []) {
    if (Math.abs(v) < 1e-12 && ay !== left) continue;
    parts.push(`<line x1="${r2(sx(v))}" y1="${r2(ax - 4)}" x2="${r2(sx(v))}" y2="${r2(ax + 4)}" stroke="${INK}" stroke-width="1.2"/>`);
    parts.push(`<text x="${r2(sx(v))}" y="${r2(ax + 18)}" font-size="13" text-anchor="middle" fill="${INK}">${esc(tl(v))}</text>`);
  }
  for (const v of o.yTicks || []) {
    if (Math.abs(v) < 1e-12 && ax !== top + h) continue;
    parts.push(`<line x1="${r2(ay - 4)}" y1="${r2(sy(v))}" x2="${r2(ay + 4)}" y2="${r2(sy(v))}" stroke="${INK}" stroke-width="1.2"/>`);
    parts.push(`<text x="${r2(ay - 8)}" y="${r2(sy(v) + 4.5)}" font-size="13" text-anchor="end" fill="${INK}">${esc(yl(v))}</text>`);
  }
  if (o.xLabel) parts.push(`<text x="${left + w + 12}" y="${r2(ax + 5)}" font-size="15" font-style="italic" fill="${INK}">${o.xLabel}</text>`);
  if (o.yLabel) parts.push(`<text x="${r2(ay + 8)}" y="${top - 4}" font-size="15" font-style="italic" fill="${INK}">${o.yLabel}</text>`);
  const pathOf = pts => 'M' + pts.map(p => `${r2(sx(p[0]))} ${r2(sy(p[1]))}`).join('L');
  const P = {
    sx, sy, parts, clip,
    curve(f, a, b, { color = CRIMSON, width = 3, dash = null, n = 400 } = {}) {
      f = fnOf(f);
      const runs = []; let run = [];
      for (let i = 0; i <= n; i++) {
        const x = a + (b - a) * i / n, y = f(x);
        if (!Number.isFinite(y) || y < o.y[0] - (o.y[1] - o.y[0]) || y > o.y[1] + (o.y[1] - o.y[0])) { if (run.length > 1) runs.push(run); run = []; continue; }
        run.push([x, y]);
      }
      if (run.length > 1) runs.push(run);
      parts.push(`<path d="${runs.map(pathOf).join('')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''} clip-path="url(#${clip})"/>`);
      return P;
    },
    /* A parametric curve t -> [x(t), y(t)], t in [a, b]. */
    param(xy, a, b, { color = CRIMSON, width = 3, dash = null, n = 600, close = false } = {}) {
      const pts = [];
      for (let i = 0; i <= n; i++) pts.push(xy(a + (b - a) * i / n));
      parts.push(`<path d="${pathOf(pts)}${close ? 'Z' : ''}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''} clip-path="url(#${clip})"/>`);
      return P;
    },
    line(p, m, a, b, { color = BLUE, width = 2.2, dash = null } = {}) {
      const y = x => p[1] + m * (x - p[0]);
      parts.push(`<line x1="${r2(sx(a))}" y1="${r2(sy(y(a)))}" x2="${r2(sx(b))}" y2="${r2(sy(y(b)))}" stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linecap="round" clip-path="url(#${clip})"/>`);
      return P;
    },
    seg(p, q, { color = INK, width = 1.5, dash = null } = {}) {
      parts.push(`<line x1="${r2(sx(p[0]))}" y1="${r2(sy(p[1]))}" x2="${r2(sx(q[0]))}" y2="${r2(sy(q[1]))}" stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`);
      return P;
    },
    vline(x, { color = MUTED, dash = '6 5', width = 1.4 } = {}) {
      parts.push(`<line x1="${r2(sx(x))}" y1="${top}" x2="${r2(sx(x))}" y2="${top + h}" stroke="${color}" stroke-width="${width}" stroke-dasharray="${dash}"/>`);
      return P;
    },
    /* A vertical band x1 < x < x2 across the whole panel (under everything). */
    band(x1, x2, fill = PALE) {
      under.push(`<rect x="${r2(sx(x1))}" y="${top}" width="${r2(sx(x2) - sx(x1))}" height="${h}" fill="${fill}"/>`);
      return P;
    },
    dot(p, { color = CRIMSON, open = false, r = 5 } = {}) {
      parts.push(`<circle cx="${r2(sx(p[0]))}" cy="${r2(sy(p[1]))}" r="${r}" fill="${open ? '#FFFFFF' : color}" stroke="${color}" stroke-width="2"/>`);
      return P;
    },
    text(p, s, { color = INK, size = 14, anchor = 'start', dx = 0, dy = 0, italic = false, bold = false } = {}) {
      parts.push(`<text x="${r2(sx(p[0]) + dx)}" y="${r2(sy(p[1]) + dy)}" font-size="${size}" text-anchor="${anchor}" fill="${color}"${italic ? ' font-style="italic"' : ''}${bold ? ' font-weight="bold"' : ''}>${s}</text>`);
      return P;
    },
    out() { return parts.flat().join('\n'); },
  };
  return P;
}

const txt = (x, y, s, { size = 15, color = INK, anchor = 'start', bold = false, italic = false } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" fill="${color}"${bold ? ' font-weight="bold"' : ''}${italic ? ' font-style="italic"' : ''}>${s}</text>`;
const it = s => `<tspan font-style="italic">${s}</tspan>`;
const sup = s => `<tspan baseline-shift="super" font-size="70%">${s}</tspan>`;
const sub = s => `<tspan baseline-shift="sub" font-size="70%">${s}</tspan>`;
const legend = (x, y, color, label, dash = null) =>
  `<line x1="${x}" y1="${y - 5}" x2="${x + 30}" y2="${y - 5}" stroke="${color}" stroke-width="3"${dash ? ` stroke-dasharray="${dash}"` : ''}/>` + txt(x + 38, y, label, { size: 14 });
function arrow(x1, y1, x2, y2, { color = INK, width = 2, head = 9 } = {}) {
  const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L;
  const bx = x2 - ux * head, by = y2 - uy * head, px = -uy * head * 0.45, py = ux * head * 0.45;
  return `<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(bx)}" y2="${r2(by)}" stroke="${color}" stroke-width="${width}"/>` +
    `<polygon points="${r2(x2)},${r2(y2)} ${r2(bx + px)},${r2(by + py)} ${r2(bx - px)},${r2(by - py)}" fill="${color}"/>`;
}

function doc(w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d" font-family="${FONT}">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body}
</svg>
`;
}
const ticks = (a, b, s) => { const o = []; for (let v = Math.ceil(a / s - 1e-9) * s; v <= b + 1e-9; v += s) o.push(+v.toFixed(10)); return o; };
const piLab = v => { const k = Math.round(v / (PI / 4)); if (k === 0) return '0'; const map = { 1: 'π/4', 2: 'π/2', 3: '3π/4', 4: 'π', '-1': '−π/4', '-2': '−π/2', '-3': '−3π/4', '-4': '−π' }; return map[k] || ''; };

const FIGS = {};

/* 3.1: the inside function 2x doubles every slope of sin x. */
FIGS['chain-sin-squeeze'] = () => {
  const P = panel({ left: 60, top: 40, w: 480, h: 330, x: [-PI, PI], y: [-1.6, 1.6], xTicks: ticks(-PI, PI, PI / 2), yTicks: [-1, 1], xTickLabel: piLab, xLabel: 'x', yLabel: 'y' });
  P.line([0, 0], 1, -1.3, 1.3, { color: BLUE, width: 1.8, dash: '3 4' });
  P.line([0, 0], 2, -0.7, 0.7, { color: CRIMSON, width: 1.8, dash: '3 4' });
  P.curve('sin(x)', -PI, PI, { color: BLUE, width: 2.6, dash: '9 6' });
  P.curve('sin(2x)', -PI, PI, { color: CRIMSON, width: 3.2 });
  P.dot([0, 0], { color: INK, r: 4.5 });
  P.text([1.3, 1.3], 'slope 1', { color: BLUE, size: 13, dx: 6, dy: 4 });
  P.text([0.7, 1.4], 'slope 2', { color: CRIMSON, size: 13, dx: 6, dy: 4, bold: true });
  let body = legend(570, 80, BLUE, `${it('y')} = sin ${it('x')}`, '9 6') + legend(570, 108, CRIMSON, `${it('y')} = sin(2${it('x')})`);
  body += txt(570, 160, 'Inside function: 2' + it('x'), { size: 14, bold: true });
  body += txt(570, 182, 'It squeezes the graph', { size: 13, color: MUTED }) + txt(570, 200, 'sideways by a factor of 2,', { size: 13, color: MUTED }) + txt(570, 218, 'so every slope doubles.', { size: 13, color: MUTED });
  body += txt(570, 260, `d/d${it('x')} sin(2${it('x')})`, { size: 14 }) + txt(570, 282, `= cos(2${it('x')}) · 2`, { size: 14, color: CRIMSON, bold: true });
  body += txt(570, 312, 'outside derivative at the', { size: 12, color: MUTED }) + txt(570, 328, 'inside, times the inside', { size: 12, color: MUTED }) + txt(570, 344, 'derivative', { size: 12, color: MUTED });
  return doc(720, 420, 'The chain rule: the inside function 2x doubles every slope',
    'Graphs of y = sin x (blue, dashed) and y = sin(2x) (crimson) for x from minus pi to pi. Both pass through the origin. The tangent line to sin x at the origin has slope 1; the tangent line to sin(2x) there has slope 2, because the inside function 2x squeezes the graph sideways by a factor of 2. The derivative of sin(2x) is cos(2x) times 2.',
    P.out() + '\n' + body);
};

/* 3.2: the tilted ellipse x^2 + xy + y^2 = 7 is not a function of x; tangent at (1, 2) has slope -4/5. */
FIGS['implicit-tilted-ellipse'] = () => {
  const P = panel({ left: 60, top: 40, w: 400, h: 400, x: [-4, 4], y: [-4, 4], xTicks: ticks(-4, 4, 1), yTicks: ticks(-4, 4, 1), xLabel: 'x', yLabel: 'y' });
  const a = Math.sqrt(14 / 3), b = Math.sqrt(14);
  // x^2 + xy + y^2 = 7 with u = (x + y)/sqrt2, v = (y - x)/sqrt2: (3/2)u^2 + (1/2)v^2 = 7.
  const xy = t => { const u = a * Math.cos(t), v = b * Math.sin(t); return [(u - v) / Math.SQRT2, (u + v) / Math.SQRT2]; };
  P.vline(1, { color: MUTED, dash: '5 5' });
  P.param(xy, 0, 2 * PI, { color: CRIMSON, width: 3.2, close: true });
  P.line([1, 2], -0.8, -1.6, 3.8, { color: BLUE, width: 2.4 });
  P.dot([1, 2], { color: INK }); P.dot([1, -3], { color: INK, r: 4.5 });
  P.text([1, 2], '(1, 2)', { dx: 8, dy: -10, bold: true });
  P.text([1, -3], '(1, −3)', { dx: 9, dy: 16 });
  let body = txt(490, 70, `${it('x')}${sup('2')} + ${it('xy')} + ${it('y')}${sup('2')} = 7`, { size: 17, bold: true, color: CRIMSON });
  body += txt(490, 100, 'The line ' + it('x') + ' = 1 meets the curve', { size: 13, color: MUTED }) + txt(490, 118, 'twice, so ' + it('y') + ' is not a function of ' + it('x') + '.', { size: 13, color: MUTED });
  body += txt(490, 160, 'Differentiate both sides:', { size: 14, bold: true });
  body += txt(490, 184, `2${it('x')} + ${it('y')} + ${it('x')}${it('y')}′ + 2${it('y')}${it('y')}′ = 0`, { size: 14 });
  body += txt(490, 214, `${it('y')}′ = −(2${it('x')} + ${it('y')}) / (${it('x')} + 2${it('y')})`, { size: 14, color: CRIMSON, bold: true });
  body += txt(490, 256, 'At (1, 2):', { size: 14, bold: true }) + txt(490, 280, `${it('y')}′ = −4/5, the slope of the`, { size: 14, color: BLUE }) + txt(490, 298, 'blue tangent line', { size: 14, color: BLUE });
  return doc(740, 480, 'An implicitly defined curve and its tangent line at (1, 2)',
    'The tilted ellipse x squared plus x y plus y squared equals 7, drawn in crimson on axes from minus 4 to 4. A dashed vertical line x = 1 meets the curve at (1, 2) and at (1, minus 3), so y is not a function of x. The blue tangent line at (1, 2) has slope minus 4/5, found by implicit differentiation: dy/dx = minus (2x + y) divided by (x + 2y).',
    P.out() + '\n' + body);
};

/* 3.3: f(x) = x^3 + x and its inverse; reflected tangent lines have reciprocal slopes. */
FIGS['inverse-reciprocal-slopes'] = () => {
  const P = panel({ left: 60, top: 40, w: 420, h: 420, x: [-3, 3.5], y: [-3, 3.5], xTicks: ticks(-3, 3, 1), yTicks: ticks(-3, 3, 1), xLabel: 'x', yLabel: 'y' });
  P.line([0, 0], 1, -3, 3.5, { color: MUTED, width: 1.6, dash: '6 5' });
  P.curve('x^3 + x', -1.45, 1.45, { color: CRIMSON, width: 3.2 });
  P.param(t => [t ** 3 + t, t], -1.45, 1.45, { color: BLUE, width: 3.2 });
  P.line([1, 2], 4, 0.45, 1.4, { color: CRIMSON, width: 2, dash: '4 4' });
  P.line([2, 1], 0.25, -0.2, 3.5, { color: BLUE, width: 2, dash: '4 4' });
  P.dot([1, 2], { color: CRIMSON }); P.dot([2, 1], { color: BLUE });
  P.text([1, 2], '(1, 2)', { dx: -50, dy: -2, bold: true, color: CRIMSON });
  P.text([2, 1], '(2, 1)', { dx: 6, dy: 22, bold: true, color: BLUE });
  P.text([3.1, 3.1], `${it('y')} = ${it('x')}`, { color: MUTED, size: 13, dx: -40, dy: 18 });
  let body = legend(510, 80, CRIMSON, `${it('f')}(${it('x')}) = ${it('x')}${sup('3')} + ${it('x')}`) + legend(510, 108, BLUE, `${it('g')} = ${it('f')}${sup('−1')}`);
  body += txt(510, 160, 'Reflect in ' + it('y') + ' = ' + it('x') + ':', { size: 14, bold: true }) + txt(510, 182, 'rise and run swap places,', { size: 13, color: MUTED }) + txt(510, 200, 'so the slope flips over.', { size: 13, color: MUTED });
  body += txt(510, 240, `${it('f')}′(1) = 4`, { size: 15, color: CRIMSON, bold: true }) + txt(510, 266, `${it('g')}′(2) = 1/${it('f')}′(1) = 1/4`, { size: 15, color: BLUE, bold: true });
  body += txt(510, 306, `In general: ${it('g')}′(${it('a')}) = 1/${it('f')}′(${it('g')}(${it('a')}))`, { size: 13 });
  return doc(760, 500, 'An inverse function has the reciprocal slope at the reflected point',
    'The graph of f(x) = x cubed + x (crimson) and of its inverse g (blue), mirror images in the dashed line y = x. The point (1, 2) on f, where the tangent line has slope 4, reflects to the point (2, 1) on g, where the tangent line has slope 1/4. So g prime of 2 equals 1 over f prime of 1.',
    P.out() + '\n' + body);
};

/* 3.4: arcsin x steepens toward x = ±1; slope 1/sqrt(1 - x^2). */
FIGS['arcsin-steepening'] = () => {
  const P = panel({ left: 70, top: 40, w: 400, h: 360, x: [-1.25, 1.25], y: [-2, 2], xTicks: ticks(-1, 1, 0.5), yTicks: [-PI / 2, -PI / 4, PI / 4, PI / 2], yTickLabel: piLab, xLabel: 'x', yLabel: 'y' });
  const x0 = 0.8, y0 = Math.asin(x0), m0 = 1 / Math.sqrt(1 - x0 * x0);
  P.line([0, 0], 1, -0.9, 0.9, { color: BLUE, width: 2, dash: '5 4' });
  P.line([x0, y0], m0, 0.45, 1.15, { color: VERM, width: 2, dash: '5 4' });
  P.curve('arcsin(x)', -1, 1, { color: CRIMSON, width: 3.2, n: 800 });
  P.dot([-1, -PI / 2]); P.dot([1, PI / 2]);
  P.dot([0, 0], { color: BLUE, r: 4.5 }); P.dot([x0, y0], { color: VERM, r: 4.5 });
  P.text([-0.9, -0.9], 'slope 1', { color: BLUE, size: 13, dx: 10, dy: 22 });
  P.text([x0, y0], 'slope 5/3', { color: VERM, size: 13, dx: 14, dy: 30, bold: true });
  let body = txt(500, 70, `${it('y')} = arcsin ${it('x')}`, { size: 17, bold: true, color: CRIMSON });
  body += txt(500, 110, `${it('dy')}/${it('dx')} = 1/√(1 − ${it('x')}${sup('2')})`, { size: 15, bold: true });
  body += txt(500, 150, `At ${it('x')} = 0: slope 1`, { size: 14, color: BLUE }) + txt(500, 174, `At ${it('x')} = 0.8: slope 1/0.6 = 5/3`, { size: 14, color: VERM });
  body += txt(500, 214, 'Near ' + it('x') + ' = ±1 the slope grows', { size: 13, color: MUTED }) + txt(500, 232, 'without bound: the derivative', { size: 13, color: MUTED }) + txt(500, 250, 'exists only for −1 &lt; ' + it('x') + ' &lt; 1.', { size: 13, color: MUTED });
  return doc(760, 440, 'The slope of arcsin x grows near the ends of its domain',
    'The graph of y = arcsin x for x from minus 1 to 1, rising from (minus 1, minus pi/2) to (1, pi/2), with closed endpoints. The tangent line at the origin has slope 1; the tangent line at x = 0.8 has slope 1 over 0.6, which is 5/3. The derivative 1 over the square root of 1 minus x squared grows without bound as x approaches 1 or minus 1.',
    P.out() + '\n' + body);
};

/* 3.5: which rule first? Read the last operation. */
FIGS['derivative-rule-chooser'] = () => {
  const box = (x, y, w, h, title, lines, color) => {
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#FFFFFF" stroke="${color}" stroke-width="2.4"/>`;
    s += txt(x + w / 2, y + 26, title, { size: 15, bold: true, anchor: 'middle', color });
    lines.forEach((l, i) => { s += txt(x + w / 2, y + 50 + i * 20, l, { size: 13, anchor: 'middle' }); });
    return s;
  };
  let body = `<rect x="250" y="24" width="300" height="70" rx="12" fill="${PALE}" stroke="${CRIMSON}" stroke-width="2.4"/>`;
  body += txt(400, 52, 'What is the last operation?', { size: 17, bold: true, anchor: 'middle', color: CRIMSON });
  body += txt(400, 76, '(the one you would do last to evaluate it)', { size: 13, anchor: 'middle', color: MUTED });
  const cols = [
    [20, 'Sum or difference', ['Differentiate each', 'term separately', `${it('x')}${sup('3')} − 4 cos ${it('x')}`], INK],
    [212, 'Product', ['Product rule:', `${it('u')}′${it('v')} + ${it('u')}${it('v')}′`, `${it('x')}${sup('2')} sin(3${it('x')})`], BLUE],
    [404, 'Quotient', ['Quotient rule, or', 'rewrite with a power', `${it('e')}${sup('2' + it('x'))} / (${it('x')} + 1)`], GREEN],
    [596, 'Function of a function', ['Chain rule:', `${it('f')}′(${it('g')}(${it('x')})) · ${it('g')}′(${it('x')})`, `(${it('x')}${it('e')}${sup(it('x'))})${sup('3')}`], CRIMSON],
  ];
  for (const [x, t, l, c] of cols) {
    body += arrow(400, 96, x + 92, 148, { color: MUTED, width: 1.8 });
    body += box(x, 152, 184, 118, t, l, c);
  }
  body += `<rect x="20" y="300" width="760" height="112" rx="12" fill="#F7F7F5" stroke="${GRID}" stroke-width="1.5"/>`;
  body += txt(40, 328, 'Then repeat inside each piece.', { size: 15, bold: true });
  body += txt(40, 352, `Example: ${it('x')}${sup('2')} sin(3${it('x')}) is a product, so start with the product rule; the factor sin(3${it('x')}) then needs the chain rule.`, { size: 13 });
  body += txt(40, 376, `Equations in ${it('x')} and ${it('y')} together: implicit differentiation. An inverse of a known function: 1/${it('f')}′(${it('g')}(${it('a')})).`, { size: 13 });
  body += txt(40, 400, `Rewrite first when it helps: 5/${it('x')}${sup('3')} = 5${it('x')}${sup('−3')} needs only the power rule.`, { size: 13, color: MUTED });
  return doc(800, 430, 'Choosing a differentiation rule from the last operation',
    'A decision diagram. At the top: what is the last operation? Four branches: a sum or difference (differentiate each term, as in x cubed minus 4 cos x), a product (product rule u prime v plus u v prime, as in x squared sin 3x), a quotient (quotient rule or rewrite with a power, as in e to the 2x over x + 1), and a function of a function (chain rule f prime of g of x times g prime of x, as in (x e to the x) cubed). Below: repeat inside each piece; use implicit differentiation for equations in x and y, and the inverse rule for inverses; rewrite first when it helps.',
    body);
};

/* 3.6: f(x) = x^3 - 3x, f'(x) = 3x^2 - 3, f''(x) = 6x in stacked panels. */
FIGS['f-first-second-derivatives'] = () => {
  const common = { left: 70, w: 440, x: [-2.2, 2.2], xTicks: ticks(-2, 2, 1), xLabel: 'x' };
  const A = panel({ ...common, top: 36, h: 150, y: [-3, 3], yTicks: [-2, 2], yLabel: 'y' });
  const B = panel({ ...common, top: 236, h: 150, y: [-5, 12], yTicks: [3, 6, 9], yLabel: 'y' });
  const Cc = panel({ ...common, top: 436, h: 150, y: [-13.5, 13.5], yTicks: [-12, -6, 6, 12], yLabel: 'y' });
  for (const P of [A, B, Cc]) { P.vline(-1, { color: GRID, dash: '3 4' }); P.vline(1, { color: GRID, dash: '3 4' }); }
  A.curve('x^3 - 3x', -2.2, 2.2, { color: CRIMSON, width: 3 });
  B.curve('3x^2 - 3', -2.2, 2.2, { color: BLUE, width: 3 });
  Cc.curve('6x', -2.2, 2.2, { color: GREEN, width: 3 });
  A.dot([-1, 2], { color: CRIMSON, r: 4 }); A.dot([1, -2], { color: CRIMSON, r: 4 });
  B.dot([-1, 0], { color: BLUE, r: 4 }); B.dot([1, 0], { color: BLUE, r: 4 });
  Cc.dot([0, 0], { color: GREEN, r: 4 });
  let body = txt(550, 70, `${it('f')}(${it('x')}) = ${it('x')}${sup('3')} − 3${it('x')}`, { size: 16, bold: true, color: CRIMSON });
  body += txt(550, 94, 'the function', { size: 13, color: MUTED });
  body += txt(550, 270, `${it('f')}′(${it('x')}) = 3${it('x')}${sup('2')} − 3`, { size: 16, bold: true, color: BLUE });
  body += txt(550, 294, `slope of ${it('f')}; zero at ${it('x')} = ±1,`, { size: 13, color: MUTED }) + txt(550, 312, `where ${it('f')} levels off`, { size: 13, color: MUTED });
  body += txt(550, 470, `${it('f')}″(${it('x')}) = 6${it('x')}`, { size: 16, bold: true, color: GREEN });
  body += txt(550, 494, `slope of ${it('f')}′; negative where`, { size: 13, color: MUTED }) + txt(550, 512, `${it('f')}′ falls, positive where it rises`, { size: 13, color: MUTED });
  body += txt(550, 552, `${it('f')}‴(${it('x')}) = 6, ${it('f')}${sup('(4)')}(${it('x')}) = 0`, { size: 14 });
  return doc(780, 620, 'A function, its first derivative and its second derivative',
    'Three stacked graphs on the same x-axis from minus 2.2 to 2.2. Top: f(x) = x cubed minus 3x (crimson), with level points at (minus 1, 2) and (1, minus 2). Middle: f prime of x = 3x squared minus 3 (blue), which is zero at x = minus 1 and x = 1. Bottom: f double prime of x = 6x (green), the slope of f prime, negative for x below 0 where f prime falls and positive for x above 0 where f prime rises. The third derivative is 6 and the fourth is 0.',
    A.out() + '\n' + B.out() + '\n' + Cc.out() + '\n' + body);
};

/* 4.1: a cooling drink; the slope of the tangent line carries units. */
FIGS['cooling-tangent-units'] = () => {
  const T = t => 20 + 60 * Math.exp(-t / 20), m = -3 * Math.exp(-0.5);
  const P = panel({ left: 70, top: 40, w: 460, h: 330, x: [0, 62], y: [0, 90], xTicks: ticks(0, 60, 10), yTicks: ticks(0, 90, 10), xLabel: 't', yLabel: 'T' });
  P.curve(T, 0, 62, { color: CRIMSON, width: 3.2 });
  P.line([10, T(10)], m, 0, 34, { color: BLUE, width: 2.2 });
  // slope triangle: run 10 minutes, drop 10*m degrees
  const p1 = [10, T(10)], p2 = [20, T(10)], p3 = [20, T(10) + 10 * m];
  P.seg(p1, p2, { color: INK, width: 1.6, dash: '5 4' }); P.seg(p2, p3, { color: INK, width: 1.6, dash: '5 4' });
  P.dot(p1, { color: INK });
  P.text([15, T(10)], 'run: 10 minutes', { size: 13, anchor: 'middle', dy: -8 });
  P.text([20, T(10) + 5 * m], 'drop: 18.2 °C', { size: 13, dx: 8, dy: 4 });
  P.text([10, T(10)], `(10, ${T(10).toFixed(1)})`, { dx: -10, dy: 26, anchor: 'end', bold: true, size: 13 });
  let body = txt(560, 70, 'A drink cooling in a room', { size: 16, bold: true });
  body += txt(560, 96, `${it('T')}(${it('t')}) in °C, ${it('t')} in minutes`, { size: 13, color: MUTED });
  body += txt(560, 140, 'Slope of the tangent line:', { size: 14, bold: true, color: BLUE });
  body += txt(560, 164, '−18.2 °C / 10 minutes', { size: 14, color: BLUE }) + txt(560, 186, `${it('T')}′(10) ≈ −1.82 °C per minute`, { size: 14, color: BLUE, bold: true });
  body += txt(560, 228, 'Units of a derivative:', { size: 14, bold: true });
  body += txt(560, 250, 'units of the output per', { size: 13, color: MUTED }) + txt(560, 268, 'one unit of the input', { size: 13, color: MUTED });
  body += txt(560, 310, 'At 10 minutes the drink is', { size: 13 }) + txt(560, 328, 'cooling at about 1.82 °C', { size: 13 }) + txt(560, 346, 'per minute.', { size: 13 });
  body += txt(70 + 230, 410, 'time (minutes)', { size: 13, anchor: 'middle', color: MUTED });
  body += `<text transform="translate(24 205) rotate(-90)" font-size="13" text-anchor="middle" fill="${MUTED}">temperature (°C)</text>`;
  return doc(800, 430, 'The derivative of temperature has units of degrees per minute',
    'The temperature T(t) = 20 + 60 e to the minus t/20 of a cooling drink, in degrees Celsius, for t from 0 to 60 minutes (crimson curve). A blue tangent line touches the curve at (10, 56.4). A slope triangle on the line runs 10 minutes and drops 18.2 degrees, so the slope T prime of 10 is about minus 1.82 degrees Celsius per minute: units of the output per unit of the input.',
    P.out() + '\n' + body);
};

/* 4.2: v and a for x(t) = t^3 - 6t^2 + 9t; speeding up where they share a sign; the path. */
FIGS['motion-speeding-up'] = () => {
  const P = panel({ left: 70, top: 40, w: 520, h: 300, x: [0, 4.3], y: [-14, 14], xTicks: ticks(0, 4, 1), yTicks: ticks(-12, 12, 4), xLabel: 't', yLabel: '' });
  P.band(1, 2, PALE); P.band(3, 4.3, PALE);
  P.band(0, 1, '#F2F2F0'); P.band(2, 3, '#F2F2F0');
  P.curve('3x^2 - 12x + 9', 0, 4.3, { color: CRIMSON, width: 3.2 });
  P.curve('6x - 12', 0, 4.3, { color: BLUE, width: 2.6, dash: '9 6' });
  for (const t of [1, 3]) P.dot([t, 0], { color: CRIMSON, r: 4.5 });
  P.dot([2, 0], { color: BLUE, r: 4.5 });
  P.text([1.5, 13], 'speeding up', { size: 12, anchor: 'middle', bold: true, color: CRIMSON });
  P.text([3.65, 13], 'speeding up', { size: 12, anchor: 'middle', bold: true, color: CRIMSON });
  P.text([0.5, 13], 'slowing', { size: 12, anchor: 'middle', color: MUTED });
  P.text([2.5, 13], 'slowing', { size: 12, anchor: 'middle', color: MUTED });
  const sg = [['+', '−'], ['−', '−'], ['−', '+'], ['+', '+']];
  sg.forEach(([v, a], i) => { const c = i + 0.5 + (i === 3 ? 0.15 : 0); P.text([c, -10.2], `${it('v')} ${v}`, { size: 13, anchor: 'middle', color: CRIMSON }); P.text([c, -12.4], `${it('a')} ${a}`, { size: 13, anchor: 'middle', color: BLUE }); });
  let body = legend(620, 80, CRIMSON, `${it('v')}(${it('t')}) = 3${it('t')}${sup('2')} − 12${it('t')} + 9`) + legend(620, 106, BLUE, `${it('a')}(${it('t')}) = 6${it('t')} − 12`, '9 6');
  body += txt(620, 150, 'Speeding up: ' + it('v') + ' and ' + it('a'), { size: 14, bold: true, color: CRIMSON }) + txt(620, 170, 'have the same sign', { size: 14, bold: true, color: CRIMSON });
  body += txt(620, 204, 'Slowing down: opposite signs', { size: 14, color: MUTED });
  body += txt(620, 240, `Position ${it('x')}(${it('t')}) = ${it('t')}${sup('3')} − 6${it('t')}${sup('2')} + 9${it('t')}`, { size: 13 });
  body += txt(620, 260, `Direction changes at ${it('t')} = 1 and 3,`, { size: 13 }) + txt(620, 278, `where ${it('v')} changes sign`, { size: 13 });
  // the path on a number line
  const L = 120, R = 560, X = v => L + (v / 5) * (R - L), y0 = 430;
  body += txt(70, 388, `The particle's path (position ${it('x')})`, { size: 14, bold: true });
  body += `<line x1="${L - 10}" y1="${y0 + 46}" x2="${R + 20}" y2="${y0 + 46}" stroke="${INK}" stroke-width="1.4"/>`;
  for (let v = 0; v <= 5; v++) body += `<line x1="${X(v)}" y1="${y0 + 42}" x2="${X(v)}" y2="${y0 + 50}" stroke="${INK}"/>` + txt(X(v), y0 + 66, String(v), { size: 13, anchor: 'middle' });
  body += arrow(X(0), y0 - 20, X(4), y0 - 20, { color: CRIMSON, width: 2.4 }) + txt(X(4) + 10, y0 - 16, `0 ≤ ${it('t')} ≤ 1: right`, { size: 13, color: CRIMSON });
  body += arrow(X(4), y0 + 4, X(0), y0 + 4, { color: BLUE, width: 2.4 }) + txt(X(4) + 10, y0 + 8, `1 ≤ ${it('t')} ≤ 3: left`, { size: 13, color: BLUE });
  body += arrow(X(0), y0 + 28, X(4), y0 + 28, { color: CRIMSON, width: 2.4 }) + txt(X(4) + 10, y0 + 32, `3 ≤ ${it('t')} ≤ 4: right`, { size: 13, color: CRIMSON });
  return doc(880, 520, 'Velocity, acceleration and when a particle speeds up',
    'Top: velocity v(t) = 3t squared minus 12t + 9 (crimson) and acceleration a(t) = 6t minus 12 (blue, dashed) for t from 0 to 4.3. Shaded bands mark where v and a have the same sign, so the particle speeds up: 1 < t < 2 (both negative) and t > 3 (both positive). It slows down on 0 < t < 1 and 2 < t < 3, where the signs differ. Bottom: the path of the particle with position x(t) = t cubed minus 6t squared + 9t on a number line: right from 0 to 4 for t from 0 to 1, left back to 0 for t from 1 to 3, right again to 4 for t from 3 to 4. It changes direction at t = 1 and t = 3, where v changes sign.',
    P.out() + '\n' + body);
};

/* 4.3: H(t) = 70 - 50 e^{-0.1t} and its rate H'(t) = 5 e^{-0.1t}, with units on both. */
FIGS['warming-rate-panels'] = () => {
  const A = panel({ left: 80, top: 40, w: 420, h: 170, x: [0, 42], y: [0, 80], xTicks: ticks(0, 40, 10), yTicks: ticks(20, 80, 20), xLabel: 't', yLabel: 'H' });
  const B = panel({ left: 80, top: 280, w: 420, h: 170, x: [0, 42], y: [0, 6], xTicks: ticks(0, 40, 10), yTicks: ticks(1, 5, 1), xLabel: 't', yLabel: 'H′' });
  A.vline(10); B.vline(10);
  A.curve('70 - 50e^(-0.1x)', 0, 42, { color: CRIMSON, width: 3.2 });
  B.curve('5e^(-0.1x)', 0, 42, { color: BLUE, width: 3.2 });
  const H10 = 70 - 50 * Math.exp(-1), R10 = 5 * Math.exp(-1);
  A.line([10, H10], R10, 2, 20, { color: BLUE, width: 2, dash: '5 4' });
  A.dot([10, H10]); B.dot([10, R10], { color: BLUE });
  A.text([10, H10], `(10, ${H10.toFixed(1)})`, { dx: 10, dy: 20, size: 13, bold: true });
  B.text([10, R10], `(10, ${R10.toFixed(2)})`, { dx: 10, dy: -10, size: 13, bold: true });
  let body = txt(540, 70, 'A cold drink warming up', { size: 16, bold: true });
  body += txt(540, 100, `${it('H')}(${it('t')}): temperature, °F`, { size: 14, color: CRIMSON }) + txt(540, 120, `${it('t')}: minutes`, { size: 14, color: MUTED });
  body += txt(540, 160, 'At 10 minutes it is 51.6 °F', { size: 13 });
  body += txt(540, 310, `${it('H')}′(${it('t')}): rate of change,`, { size: 14, color: BLUE }) + txt(540, 330, '°F per minute', { size: 14, color: BLUE, bold: true });
  body += txt(540, 370, 'At 10 minutes it is warming', { size: 13 }) + txt(540, 388, 'at 1.84 °F per minute; the', { size: 13 }) + txt(540, 406, 'rate itself is shrinking.', { size: 13 });
  return doc(820, 490, 'A quantity and its rate of change, each with its units',
    'Top: the temperature H(t) = 70 minus 50 e to the minus 0.1 t of a drink, in degrees Fahrenheit, for t from 0 to 40 minutes; at t = 10 it is about 51.6 degrees, with a dashed tangent line. Bottom: its rate of change H prime of t = 5 e to the minus 0.1 t, in degrees Fahrenheit per minute; at t = 10 it is about 1.84 degrees per minute, equal to the slope of the tangent line above. The rate is positive but shrinking.',
    A.out() + '\n' + B.out() + '\n' + body);
};

/* 4.4: an expanding ripple; r and A both depend on t. */
FIGS['ripple-related-rates'] = () => {
  const cx = 230, cy = 230;
  let body = `<rect x="20" y="20" width="420" height="420" rx="14" fill="${PALEBLUE}"/>`;
  [[40, 0.35], [80, 0.6], [130, 1]].forEach(([r, o], i) => {
    body += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${i === 2 ? CRIMSON : BLUE}" stroke-width="${i === 2 ? 3.2 : 2}" stroke-opacity="${o}"${i < 2 ? ' stroke-dasharray="6 5"' : ''}/>`;
  });
  body += `<circle cx="${cx}" cy="${cy}" r="4" fill="${INK}"/>`;
  body += `<line x1="${cx}" y1="${cy}" x2="${cx + 130 * Math.cos(-0.5)}" y2="${cy + 130 * Math.sin(-0.5)}" stroke="${INK}" stroke-width="2"/>`;
  body += txt(cx + 52, cy - 38, it('r'), { size: 18, bold: true });
  const ex = cx + 130 * Math.cos(-0.5), ey = cy + 130 * Math.sin(-0.5);
  body += arrow(ex, ey, ex + 46 * Math.cos(-0.5), ey + 46 * Math.sin(-0.5), { color: CRIMSON, width: 2.6 });
  body += txt(ex + 52, ey - 26, `${it('dr')}/${it('dt')}`, { size: 16, bold: true, color: CRIMSON });
  body += txt(230, 410, 'earlier ripples (dashed) and now (solid)', { size: 13, anchor: 'middle', color: MUTED });
  let x = 470;
  body += txt(x, 70, 'Both ' + it('r') + ' and ' + it('A') + ' depend on time ' + it('t') + '.', { size: 15, bold: true });
  body += txt(x, 110, 'The relation:', { size: 14, color: MUTED }) + txt(x, 134, `${it('A')} = π${it('r')}${sup('2')}`, { size: 17, bold: true });
  body += txt(x, 180, `Differentiate with respect to ${it('t')}:`, { size: 14, color: MUTED });
  body += txt(x, 206, `${it('dA')}/${it('dt')} = 2π${it('r')} · ${it('dr')}/${it('dt')}`, { size: 17, bold: true, color: CRIMSON });
  body += txt(x, 248, 'The chain rule puts in ' + it('dr') + '/' + it('dt') + ',', { size: 13 }) + txt(x, 266, 'because ' + it('r') + ' is a function of ' + it('t') + '.', { size: 13 });
  body += txt(x, 310, `Example: ${it('r')} = 5 cm, ${it('dr')}/${it('dt')} = 3 cm/s`, { size: 13 });
  body += txt(x, 332, `${it('dA')}/${it('dt')} = 2π(5)(3) = 30π cm${sup('2')}/s`, { size: 14, bold: true, color: CRIMSON });
  body += txt(x, 374, 'The area grows faster as the', { size: 13, color: MUTED }) + txt(x, 392, 'ripple gets bigger, even at a', { size: 13, color: MUTED }) + txt(x, 410, 'steady ' + it('dr') + '/' + it('dt') + '.', { size: 13, color: MUTED });
  return doc(800, 460, 'An expanding ripple: the rates of r and A are related',
    'A circular ripple on water seen from above: two earlier, smaller ripples dashed and the current ripple solid, with its radius r drawn and an arrow showing dr/dt, the rate at which the radius grows. Beside it: the relation A = pi r squared, differentiated with respect to time t to give dA/dt = 2 pi r times dr/dt. Example: with r = 5 cm and dr/dt = 3 cm per second, dA/dt = 30 pi square centimeters per second.',
    body);
};

/* 4.5: a 10 ft ladder sliding down a wall. */
function ladderScene() {
  const s = 32, ox = 110, oy = 380; // 1 ft = 32 px; wall at x = ox, floor at y = oy
  const X = ft => ox + ft * s, Y = ft => oy - ft * s;
  let body = `<rect x="${ox - 30}" y="40" width="30" height="${oy - 40}" fill="#D9D4CA" stroke="${INK}" stroke-width="1.5"/>`;
  body += `<line x1="${ox - 30}" y1="${oy}" x2="${X(10.5)}" y2="${oy}" stroke="${INK}" stroke-width="2.4"/>`;
  for (let x = ox - 24; x < X(10.5); x += 16) body += `<line x1="${x}" y1="${oy + 1}" x2="${x - 9}" y2="${oy + 11}" stroke="#8A8F8C" stroke-width="1.3"/>`;
  // later position (ghost)
  const gx = 7, gy = Math.sqrt(100 - gx * gx);
  body += `<line x1="${X(0)}" y1="${Y(gy)}" x2="${X(gx)}" y2="${Y(0)}" stroke="${MUTED}" stroke-width="6" stroke-opacity="0.35" stroke-linecap="round"/>`;
  // ladder now
  body += `<line x1="${X(0)}" y1="${Y(8)}" x2="${X(6)}" y2="${Y(0)}" stroke="${CRIMSON}" stroke-width="7" stroke-linecap="round"/>`;
  body += txt(X(3) + 16, Y(4) - 6, '10 ft', { size: 16, bold: true, color: CRIMSON });
  // x and y dimensions
  body += `<line x1="${X(0)}" y1="${oy + 34}" x2="${X(6)}" y2="${oy + 34}" stroke="${INK}" stroke-width="1.4"/>` + `<line x1="${X(0)}" y1="${oy + 28}" x2="${X(0)}" y2="${oy + 40}" stroke="${INK}"/><line x1="${X(6)}" y1="${oy + 28}" x2="${X(6)}" y2="${oy + 40}" stroke="${INK}"/>`;
  body += txt(X(3), oy + 58, `${it('x')} = 6 ft`, { size: 15, anchor: 'middle', bold: true });
  body += `<line x1="${ox - 50}" y1="${Y(0)}" x2="${ox - 50}" y2="${Y(8)}" stroke="${INK}" stroke-width="1.4"/>` + `<line x1="${ox - 56}" y1="${Y(0)}" x2="${ox - 44}" y2="${Y(0)}" stroke="${INK}"/><line x1="${ox - 56}" y1="${Y(8)}" x2="${ox - 44}" y2="${Y(8)}" stroke="${INK}"/>`;
  body += txt(ox - 58, Y(4) + 5, `${it('y')} = 8 ft`, { size: 15, anchor: 'end', bold: true });
  // rates
  body += arrow(X(6) + 6, oy - 18, X(6) + 66, oy - 18, { color: BLUE, width: 2.6 });
  body += txt(X(6) + 72, oy - 13, `${it('dx')}/${it('dt')} = 2 ft/s`, { size: 15, bold: true, color: BLUE });
  body += arrow(X(0) + 18, Y(8) - 4, X(0) + 18, Y(8) + 56, { color: VERM, width: 2.6 });
  body += txt(X(0) + 46, Y(8) + 34, `${it('dy')}/${it('dt')} = ?`, { size: 15, bold: true, color: VERM });
  // angle at the floor
  const ang = Math.atan2(8, 6);
  body += `<path d="M ${X(6) - 34} ${oy} A 34 34 0 0 1 ${r2(X(6) - 34 * Math.cos(ang))} ${r2(oy - 34 * Math.sin(ang))}" fill="none" stroke="${INK}" stroke-width="1.5"/>`;
  body += txt(X(6) - 46, oy - 10, 'θ', { size: 16, italic: true });
  return body;
}
FIGS['ladder-sliding-wall'] = () => {
  let body = ladderScene();
  const x = 520;
  body += txt(x, 70, 'The relation (Pythagoras):', { size: 14, color: MUTED });
  body += txt(x, 96, `${it('x')}${sup('2')} + ${it('y')}${sup('2')} = 100`, { size: 17, bold: true });
  body += txt(x, 136, `Differentiate with respect to ${it('t')}:`, { size: 14, color: MUTED });
  body += txt(x, 162, `2${it('x')} ${it('dx')}/${it('dt')} + 2${it('y')} ${it('dy')}/${it('dt')} = 0`, { size: 16, bold: true });
  body += txt(x, 202, 'Only now substitute the moment:', { size: 14, color: MUTED });
  body += txt(x, 228, `2(6)(2) + 2(8) ${it('dy')}/${it('dt')} = 0`, { size: 15 });
  body += txt(x, 256, `${it('dy')}/${it('dt')} = −3/2 ft/s`, { size: 17, bold: true, color: VERM });
  body += txt(x, 296, 'The top slides down at 1.5 ft/s.', { size: 13 });
  body += txt(x, 330, 'Grey: the ladder a moment later.', { size: 13, color: MUTED });
  return doc(820, 460, 'A ladder sliding down a wall: a related rates problem',
    'A 10-foot ladder (crimson) leans against a vertical wall. Its foot is x = 6 feet from the wall and its top is y = 8 feet up. The foot slides away at dx/dt = 2 feet per second (blue arrow) and the top slides down at an unknown rate dy/dt (vermillion arrow). The angle theta between the ladder and the floor is marked. A faint grey ladder shows a later position, farther out and lower. Beside it: x squared + y squared = 100, differentiated to 2x dx/dt + 2y dy/dt = 0; substituting x = 6, y = 8 and dx/dt = 2 gives dy/dt = minus 3/2 feet per second.',
    body);
};

/* 4.5 question version: the scene and the givens, no solution. */
FIGS['ladder-sliding-question'] = () => {
  let body = ladderScene();
  const x = 520;
  body += txt(x, 80, 'A 10-foot ladder leans against', { size: 15 }) + txt(x, 102, 'a vertical wall.', { size: 15 });
  body += txt(x, 142, `The foot slides away from the`, { size: 15 }) + txt(x, 164, `wall at ${it('dx')}/${it('dt')} = 2 ft/s.`, { size: 15, color: BLUE, bold: true });
  body += txt(x, 204, `${it('x')}: distance from the wall to the foot`, { size: 13, color: MUTED });
  body += txt(x, 224, `${it('y')}: height of the top`, { size: 13, color: MUTED });
  body += txt(x, 244, `θ: angle between the ladder and the floor`, { size: 13, color: MUTED });
  body += txt(x, 280, 'Shown at the instant ' + it('x') + ' = 6 ft.', { size: 13 });
  body += txt(x, 300, 'Grey: the ladder a moment later.', { size: 13, color: MUTED });
  return doc(820, 460, 'A ladder sliding down a wall',
    'A 10-foot ladder (crimson) leans against a vertical wall. Its foot is x = 6 feet from the wall and its top is y = 8 feet up. The foot slides away from the wall at dx/dt = 2 feet per second (blue arrow); the top slides down at an unknown rate dy/dt (vermillion arrow). The angle theta between the ladder and the floor is marked. A faint grey ladder shows a later position, farther out and lower.',
    body);
};

/* 4.5: an inverted cone tank; similar triangles give r = h/2. */
function coneScene() {
  const ax = 220, top = 60, apexY = 380, R = 120; // cone radius 3 ft -> 120 px; height 6 ft -> 320 px
  const hpx = 6 / 320, wl = 2; // water level h = 2 ft
  const wy = apexY - wl / hpx, wr = R * (wl / 6);
  let body = `<ellipse cx="${ax}" cy="${top}" rx="${R}" ry="18" fill="none" stroke="${INK}" stroke-width="2"/>`;
  body += `<path d="M ${ax - wr} ${wy} L ${ax} ${apexY} L ${ax + wr} ${wy} Z" fill="${WATER}"/>`;
  body += `<ellipse cx="${ax}" cy="${wy}" rx="${wr}" ry="${18 * wr / R}" fill="#B5D3EA" stroke="${BLUE}" stroke-width="2"/>`;
  body += `<line x1="${ax - R}" y1="${top}" x2="${ax}" y2="${apexY}" stroke="${INK}" stroke-width="2.4"/><line x1="${ax + R}" y1="${top}" x2="${ax}" y2="${apexY}" stroke="${INK}" stroke-width="2.4"/>`;
  // dimension lines
  body += `<line x1="${ax}" y1="${top}" x2="${ax + R}" y2="${top}" stroke="${MUTED}" stroke-width="1.4" stroke-dasharray="4 3"/>` + txt(ax + R / 2, top - 24, '3 ft', { size: 14, anchor: 'middle', bold: true });
  body += `<line x1="${ax}" y1="${top}" x2="${ax}" y2="${apexY}" stroke="${MUTED}" stroke-width="1.4" stroke-dasharray="4 3"/>`;
  body += `<line x1="${ax - R - 30}" y1="${top}" x2="${ax - R - 30}" y2="${apexY}" stroke="${INK}" stroke-width="1.3"/>` + txt(ax - R - 38, (top + apexY) / 2, '6 ft', { size: 14, anchor: 'end', bold: true });
  body += `<line x1="${ax}" y1="${wy}" x2="${ax + wr}" y2="${wy}" stroke="${CRIMSON}" stroke-width="2"/>` + txt(ax + wr / 2, wy - 8, it('r'), { size: 16, anchor: 'middle', bold: true, color: CRIMSON });
  body += `<line x1="${ax + 14}" y1="${wy}" x2="${ax + 14}" y2="${apexY}" stroke="${CRIMSON}" stroke-width="2"/>` + txt(ax + 20, (wy + apexY) / 2 + 10, it('h'), { size: 16, bold: true, color: CRIMSON });
  body += arrow(ax - 40, 10, ax - 8, top - 4, { color: BLUE, width: 2.4 }) + txt(ax - 44, 18, 'water poured in', { size: 13, anchor: 'end', color: BLUE });
  return body;
}
FIGS['cone-tank-question'] = () => {
  let body = coneScene();
  const x = 420;
  body += txt(x, 80, 'An inverted cone tank:', { size: 15, bold: true });
  body += txt(x, 106, 'top radius 3 ft, depth 6 ft.', { size: 15 });
  body += txt(x, 146, 'Water is poured in at', { size: 15 }) + txt(x, 168, `${it('dV')}/${it('dt')} = 4 ft${sup('3')}/min.`, { size: 15, bold: true, color: BLUE });
  body += txt(x, 208, `${it('h')}: depth of the water`, { size: 13, color: MUTED }) + txt(x, 228, `${it('r')}: radius of the water's surface`, { size: 13, color: MUTED });
  body += txt(x, 248, `${it('V')}: volume of water, (1/3)π${it('r')}${sup('2')}${it('h')}`, { size: 13, color: MUTED });
  return doc(760, 420, 'Water filling an inverted cone tank',
    'An inverted cone tank 6 feet deep with a top radius of 3 feet, point down. Water is poured in from above at 4 cubic feet per minute. The water forms a smaller cone of depth h and surface radius r, shaded blue. The volume of a cone is one third pi r squared h.',
    body);
};
FIGS['cone-tank-similar'] = () => {
  let body = coneScene();
  const x = 420;
  body += txt(x, 80, 'Similar triangles:', { size: 14, color: MUTED });
  body += txt(x, 106, `${it('r')}/${it('h')} = 3/6, so ${it('r')} = ${it('h')}/2`, { size: 16, bold: true });
  body += txt(x, 146, 'Volume of water:', { size: 14, color: MUTED });
  body += txt(x, 172, `${it('V')} = (1/3)π${it('r')}${sup('2')}${it('h')} = π${it('h')}${sup('3')}/12`, { size: 16, bold: true });
  body += txt(x, 212, `Then ${it('dV')}/${it('dt')} = (π${it('h')}${sup('2')}/4) · ${it('dh')}/${it('dt')}`, { size: 15, color: CRIMSON, bold: true });
  body += txt(x, 252, `Replace ${it('r')} before differentiating, so`, { size: 13 }) + txt(x, 270, `only one changing length is left.`, { size: 13 });
  return doc(760, 420, 'An inverted cone tank: similar triangles relate r and h',
    'An inverted cone tank 6 feet deep with a top radius of 3 feet, point down, with water poured in from above. The water is a smaller cone of depth h and surface radius r, shaded blue. Similar triangles give r/h = 3/6, so r = h/2, and the volume of water is V = one third pi r squared h = pi h cubed over 12. Differentiating with respect to time gives dV/dt = (pi h squared over 4) times dh/dt.',
    body);
};

/* FRQ stimulus: the curve y^3 - xy = 6, drawn from x = y^2 - 6/y on each branch. */
FIGS['implicit-cubic-curve'] = () => {
  const P = panel({ left: 60, top: 30, w: 460, h: 380, x: [-2, 14], y: [-4, 4], xTicks: ticks(-2, 14, 2), yTicks: ticks(-4, 4, 1), xLabel: 'x', yLabel: 'y' });
  P.param(y => [y * y - 6 / y, y], 0.75, 3.95, { color: CRIMSON, width: 3.2 });
  P.param(y => [y * y - 6 / y, y], -3.95, -0.46, { color: CRIMSON, width: 3.2 });
  P.dot([1, 2], { color: INK }); P.dot([7, 3], { color: INK });
  P.text([1, 2], '(1, 2)', { dx: 8, dy: 22, bold: true });
  P.text([7, 3], '(7, 3)', { dx: 10, dy: 16, bold: true });
  const body = txt(560, 70, `${it('y')}${sup('3')} − ${it('xy')} = 6`, { size: 18, bold: true, color: CRIMSON }) +
    txt(560, 100, 'The curve has two pieces,', { size: 13, color: MUTED }) + txt(560, 118, 'one above and one below', { size: 13, color: MUTED }) + txt(560, 136, `the ${it('x')}-axis; it never meets it.`, { size: 13, color: MUTED });
  return doc(780, 450, 'The curve y cubed minus x y equals 6',
    'The graph of the curve y cubed minus x y = 6 on axes with x from minus 2 to 14 and y from minus 4 to 4. It has two pieces: an upper piece rising through (1, 2) and (7, 3), and a lower piece below the x-axis. The curve never meets the x-axis. The points (1, 2) and (7, 3) are marked.',
    P.out() + '\n' + body);
};

/* 4.6: sqrt x and its tangent line at x = 4; the line lies above (concave down): overestimate. */
FIGS['sqrt-tangent-overestimate'] = () => {
  const P = panel({ left: 60, top: 40, w: 420, h: 330, x: [0, 9.5], y: [0, 3.6], xTicks: ticks(0, 9, 1), yTicks: ticks(0, 3.5, 0.5), xLabel: 'x', yLabel: 'y' });
  P.line([4, 2], 0.25, 0, 9.5, { color: BLUE, width: 2.4 });
  P.curve('sqrt(x)', 0, 9.5, { color: CRIMSON, width: 3.2, n: 800 });
  P.dot([4, 2], { color: INK });
  P.vline(7, { color: MUTED, dash: '4 4' });
  P.dot([7, 2.75], { color: BLUE, r: 4.5 }); P.dot([7, Math.sqrt(7)], { color: CRIMSON, r: 4.5 });
  P.text([4, 2], '(4, 2)', { dx: 10, dy: 24, bold: true });
  P.text([7, 2.75], `${it('L')}(7) = 2.75`, { dx: -8, dy: -10, anchor: 'end', color: BLUE, bold: true, size: 13 });
  P.text([7, Math.sqrt(7)], '√7 ≈ 2.646', { dx: 8, dy: 18, color: CRIMSON, bold: true, size: 13 });
  // zoom panel
  const Z = panel({ left: 572, top: 70, w: 180, h: 210, x: [6.6, 7.4], y: [2.55, 2.9], xTicks: [6.8, 7, 7.2], yTicks: [2.6, 2.7, 2.8], xLabel: '', yLabel: '' });
  Z.line([4, 2], 0.25, 6.6, 7.4, { color: BLUE, width: 2.4 });
  Z.curve('sqrt(x)', 6.6, 7.4, { color: CRIMSON, width: 3 });
  Z.seg([7, Math.sqrt(7)], [7, 2.75], { color: INK, width: 1.6, dash: '3 3' });
  Z.dot([7, 2.75], { color: BLUE, r: 4 }); Z.dot([7, Math.sqrt(7)], { color: CRIMSON, r: 4 });
  let body = `<rect x="530" y="56" width="236" height="250" fill="none" stroke="${GRID}" stroke-width="1.5"/>` + txt(540, 50, 'Zoom near x = 7', { size: 13, color: MUTED });
  body += legend(540, 334, CRIMSON, `${it('y')} = √${it('x')} (concave down)`) + legend(540, 358, BLUE, `${it('L')}(${it('x')}) = 2 + (${it('x')} − 4)/4`);
  body += txt(540, 392, 'The tangent line lies above the', { size: 13 }) + txt(540, 410, 'curve, so ' + it('L') + ' overestimates.', { size: 13, bold: true, color: BLUE });
  return doc(800, 430, 'A tangent line approximation and why it overestimates',
    'The graph of y = square root of x (crimson) for x from 0 to 9.5 and its tangent line at (4, 2), L(x) = 2 + (x minus 4)/4 (blue). At x = 7 the line gives L(7) = 2.75 while the square root of 7 is about 2.646. A zoomed panel near x = 7 shows the line above the curve. Because the graph is concave down, the tangent line lies above it and the approximation is an overestimate.',
    P.out() + '\n' + Z.out() + '\n' + body);
};

/* 4.7: near 0, e^x - 1 and sin(2x) look like their tangent lines y = x and y = 2x. */
FIGS['lhospital-tangent-ratio'] = () => {
  const P = panel({ left: 60, top: 40, w: 420, h: 360, x: [-0.9, 0.9], y: [-1.8, 1.8], xTicks: ticks(-0.8, 0.8, 0.4), yTicks: ticks(-1.5, 1.5, 0.5), xLabel: 'x', yLabel: 'y' });
  P.line([0, 0], 1, -0.9, 0.9, { color: CRIMSON, width: 1.8, dash: '4 4' });
  P.line([0, 0], 2, -0.9, 0.9, { color: BLUE, width: 1.8, dash: '4 4' });
  P.curve('e^x - 1', -0.9, 0.9, { color: CRIMSON, width: 3.2 });
  P.curve('sin(2x)', -0.9, 0.9, { color: BLUE, width: 3.2 });
  P.dot([0, 0], { color: INK, r: 4.5 });
  P.text([0.75, 0.75], 'slope 1', { color: CRIMSON, size: 13, dx: 6, dy: 16 });
  P.text([0.6, 1.2], 'slope 2', { color: BLUE, size: 13, dx: -60, dy: -4 });
  let body = legend(510, 80, CRIMSON, `${it('f')}(${it('x')}) = ${it('e')}${sup(it('x'))} − 1`) + legend(510, 108, BLUE, `${it('g')}(${it('x')}) = sin(2${it('x')})`);
  body += txt(510, 156, 'Both are 0 at ' + it('x') + ' = 0: the form 0/0.', { size: 14, bold: true });
  body += txt(510, 190, 'Near 0 each looks like its', { size: 13, color: MUTED }) + txt(510, 208, `tangent line: ${it('f')} ≈ 1·${it('x')} and ${it('g')} ≈ 2${it('x')}.`, { size: 13, color: MUTED });
  body += txt(510, 248, `So ${it('f')}(${it('x')})/${it('g')}(${it('x')}) ≈ ${it('x')}/(2${it('x')}) = 1/2.`, { size: 14 });
  body += txt(510, 290, "L'Hospital's rule:", { size: 14, bold: true, color: CRIMSON });
  body += txt(510, 314, `lim ${it('f')}/${it('g')} = lim ${it('f')}′/${it('g')}′ = ${it('f')}′(0)/${it('g')}′(0) = 1/2`, { size: 14, color: CRIMSON });
  return doc(820, 440, "Why L'Hospital's rule works: near the point, each function is its tangent line",
    "Graphs of f(x) = e to the x minus 1 (crimson) and g(x) = sin(2x) (blue) for x from minus 0.9 to 0.9, both through the origin, with their dashed tangent lines y = x (slope 1) and y = 2x (slope 2). Since f(0) = g(0) = 0 the quotient f/g has the form 0/0 at 0. Near 0 each function is close to its tangent line, so f(x)/g(x) is close to x/(2x) = 1/2, which is f prime of 0 over g prime of 0.",
    P.out() + '\n' + body);
};

const want = process.argv.slice(2);
for (const [id, make] of Object.entries(FIGS)) {
  if (want.length && !want.includes(id)) continue;
  writeFileSync(join(OUT, `${id}.svg`), make());
  console.log(`calculus/figures/${id}.svg`);
}
export { FIGS };
