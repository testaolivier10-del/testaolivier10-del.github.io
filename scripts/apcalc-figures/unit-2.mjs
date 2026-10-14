/* Figures for AP® Calculus AB Unit 2 (Differentiation: Definition and
   Fundamental Properties). Every curve is sampled from the function it
   claims to show, through the course's own expression parser (ApCalcExpr),
   and written as a standalone SVG (white background, Arial, role="img" with
   <title> and <desc>) to calculus/figures/<id>.svg.

     node scripts/apcalc-figures/unit-2.mjs            write every figure
     node scripts/apcalc-figures/unit-2.mjs <id> ...   write some */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Expr } from '../lib/apcalc-mathlib.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'calculus', 'figures');
const INK = '#1F2A28', CRIMSON = '#8C1036', BLUE = '#0072B2', GREEN = '#009E73', VERM = '#D55E00', GRID = '#E4E7E6', MUTED = '#5A6563';
const FONT = 'Arial, Helvetica, sans-serif';
const r2 = v => Math.round(v * 100) / 100;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fnOf = f => typeof f === 'function' ? f : Expr.fn(f, ['x']);
const PI = Math.PI;

/* One coordinate panel. o: { left, top, w, h, x: [a, b], y: [c, d], xTicks, yTicks,
   xTickLabel(v), xLabel, yLabel, grid } -> { sx, sy, parts: [] , add(...) } */
function panel(o) {
  const { left, top, w, h } = o;
  const sx = v => left + (v - o.x[0]) / (o.x[1] - o.x[0]) * w;
  const sy = v => top + (o.y[1] - v) / (o.y[1] - o.y[0]) * h;
  const parts = [];
  const clip = `clip${Math.round(left)}x${Math.round(top)}`;
  parts.push(`<clipPath id="${clip}"><rect x="${left}" y="${top}" width="${w}" height="${h}"/></clipPath>`);
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
  const tl = o.xTickLabel || (v => String(+v.toFixed(4)).replace('-', '−'));
  for (const v of o.xTicks || []) {
    if (Math.abs(v) < 1e-12 && ay !== left) continue;
    parts.push(`<line x1="${r2(sx(v))}" y1="${r2(ax - 4)}" x2="${r2(sx(v))}" y2="${r2(ax + 4)}" stroke="${INK}" stroke-width="1.2"/>`);
    parts.push(`<text x="${r2(sx(v))}" y="${r2(ax + (o.xTickDy || 18))}" font-size="13" text-anchor="middle" fill="${INK}" stroke="#FFFFFF" stroke-width="4" paint-order="stroke">${esc(tl(v))}</text>`);
  }
  for (const v of o.yTicks || []) {
    if (Math.abs(v) < 1e-12 && ax !== top + h) continue;
    parts.push(`<line x1="${r2(ay - 4)}" y1="${r2(sy(v))}" x2="${r2(ay + 4)}" y2="${r2(sy(v))}" stroke="${INK}" stroke-width="1.2"/>`);
    parts.push(`<text x="${r2(ay - 8)}" y="${r2(sy(v) + 4.5)}" font-size="13" text-anchor="end" fill="${INK}" stroke="#FFFFFF" stroke-width="4" paint-order="stroke">${esc(String(+v.toFixed(4)).replace('-', '−'))}</text>`);
  }
  if (o.xLabel) parts.push(`<text x="${left + w + 12}" y="${r2(ax + 5)}" font-size="15" font-style="italic" fill="${INK}">${esc(o.xLabel)}</text>`);
  if (o.yLabel) parts.push(`<text x="${r2(ay + 8)}" y="${top - 4}" font-size="15" font-style="italic" fill="${INK}">${esc(o.yLabel)}</text>`);
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
      const d = runs.map(r => 'M' + r.map(p => `${r2(sx(p[0]))} ${r2(sy(p[1]))}`).join('L')).join('');
      parts.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''} clip-path="url(#${clip})"/>`);
      return P;
    },
    line(p, m, a, b, { color = BLUE, width = 2.2, dash = null } = {}) {
      const y = x => p[1] + m * (x - p[0]);
      parts.push(`<line x1="${r2(sx(a))}" y1="${r2(sy(y(a)))}" x2="${r2(sx(b))}" y2="${r2(sy(y(b)))}" stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linecap="round" clip-path="url(#${clip})"/>`);
      return P;
    },
    tan(p, m, half = 34, { color = BLUE, width = 2.4 } = {}) {
      // A tangent segment of fixed length on screen, whatever its slope.
      const kx = sx(1) - sx(0), ky = sy(0) - sy(1);
      let vx = 1, vy = m * ky / kx; const n = Math.hypot(vx, vy); vx = vx / n * half; vy = vy / n * half;
      const cx = sx(p[0]), cy = sy(p[1]);
      parts.push(`<line x1="${r2(cx - vx)}" y1="${r2(cy + vy)}" x2="${r2(cx + vx)}" y2="${r2(cy - vy)}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" clip-path="url(#${clip})"/>`);
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
    dot(p, { color = CRIMSON, open = false, r = 5 } = {}) {
      parts.push(`<circle cx="${r2(sx(p[0]))}" cy="${r2(sy(p[1]))}" r="${r}" fill="${open ? '#FFFFFF' : color}" stroke="${color}" stroke-width="2"/>`);
      return P;
    },
    text(p, s, { color = INK, size = 14, anchor = 'start', dx = 0, dy = 0, italic = false, bold = false } = {}) {
      parts.push(`<text x="${r2(sx(p[0]) + dx)}" y="${r2(sy(p[1]) + dy)}" font-size="${size}" text-anchor="${anchor}" fill="${color}"${italic ? ' font-style="italic"' : ''}${bold ? ' font-weight="bold"' : ''}>${s}</text>`);
      return P;
    }
  };
  return P;
}

/* Raw text at pixel coordinates (titles, notes). s may hold <tspan>s. */
const txt = (x, y, s, { size = 15, color = INK, anchor = 'start', bold = false, italic = false } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" fill="${color}"${bold ? ' font-weight="bold"' : ''}${italic ? ' font-style="italic"' : ''}>${s}</text>`;
const it = s => `<tspan font-style="italic">${s}</tspan>`;
const sup = s => `<tspan baseline-shift="super" font-size="70%">${s}</tspan>`;

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
const piLab = v => { const k = Math.round(v / (PI / 4)); if (k === 0) return '0'; const map = { 1: 'π/4', 2: 'π/2', 3: '3π/4', 4: 'π', 6: '3π/2', 8: '2π', '-1': '−π/4', '-2': '−π/2' }; return map[k] || ''; };

const FIGS = {};

/* 2.1: secant slopes from P as Q slides toward P. f(x) = x^2/4 + 1, P at x = 1. */
FIGS['secants-closing-in'] = () => {
  const f = x => x * x / 4 + 1, a = 1;
  const P = panel({ left: 60, top: 40, w: 420, h: 330, x: [-0.5, 5], y: [-0.4, 7.5], xTicks: ticks(0, 5, 1), yTicks: ticks(1, 7, 1), xLabel: 'x', yLabel: 'y' });
  const hs = [3, 2, 1, 0.4], cols = [MUTED, BLUE, GREEN, VERM];
  hs.forEach((h, i) => {
    const m = (f(a + h) - f(a)) / h;
    P.line([a, f(a)], m, -0.5, 5, { color: cols[i], width: 2, dash: i === 0 ? '7 5' : null });
    P.dot([a + h, f(a + h)], { color: cols[i], r: 4.5 });
  });
  P.curve(f, -0.5, 5, { color: CRIMSON, width: 3.2 });
  P.dot([a, f(a)], { color: INK, r: 5.5 });
  P.text([a, f(a)], 'P', { dx: 2, dy: 24, bold: true, size: 15 });
  P.text([4, f(4)], 'Q', { dx: -22, dy: -4, size: 14, bold: true, color: MUTED });
  P.text([2.3, 6.6], `${it('f')}(${it('x')}) = ${it('x')}${sup('2')}/4 + 1`, { color: CRIMSON, anchor: 'end', size: 15 });
  // Table of slopes
  const tx = 520, ty = 70;
  const rows = hs.map((h, i) => [String(h), String(+((f(a + h) - f(a)) / h).toFixed(3)), cols[i]]);
  rows.push(['0.01', String(+((f(a + 0.01) - f(a)) / 0.01).toFixed(4)), INK]);
  let body = txt(tx, ty - 22, 'Secant slopes from P', { bold: true, size: 15 });
  body += txt(tx, ty, `Q at ${it('x')} = 1 + ${it('h')}`, { size: 14, color: MUTED });
  body += `<line x1="${tx}" y1="${ty + 14}" x2="${tx + 200}" y2="${ty + 14}" stroke="${INK}" stroke-width="1"/>`;
  body += txt(tx + 40, ty + 34, it('h'), { size: 15, anchor: 'middle' }) + txt(tx + 140, ty + 34, 'slope', { size: 15, anchor: 'middle' });
  rows.forEach((r, i) => {
    const y = ty + 62 + i * 30;
    body += `<rect x="${tx + 2}" y="${y - 12}" width="10" height="10" fill="${r[2]}"/>`;
    body += txt(tx + 40, y, r[0], { anchor: 'middle' }) + txt(tx + 140, y, r[1], { anchor: 'middle' });
  });
  body += txt(tx, ty + 62 + 5 * 30 + 6, 'As h → 0, the slopes', { size: 14, color: INK });
  body += txt(tx, ty + 62 + 5 * 30 + 26, 'close in on 0.5: the rate', { size: 14, color: INK });
  body += txt(tx, ty + 62 + 5 * 30 + 46, 'of change of f at P.', { size: 14, color: INK });
  return doc(760, 410, 'Secant slopes closing in on the instantaneous rate',
    'The parabola f(x) = x squared over 4, plus 1, with the point P at x = 1. Four secant lines join P to points Q at x = 4, 3, 2 and 1.4; their slopes are 1.25, 1, 0.75 and 0.6. A table adds h = 0.01, slope 0.5025. As Q moves toward P the secant slopes approach 0.5, the instantaneous rate of change of f at x = 1.',
    P.parts.join('\n') + '\n' + body);
};

/* 2.2: secant and tangent with the rise and run marked. f(x) = 0.2x^2 + 0.5, a = 2, h = 2.5. */
FIGS['secant-to-tangent'] = () => {
  const f = x => 0.2 * x * x + 0.5, a = 2, h = 2.5, b = a + h;
  const P = panel({ left: 60, top: 40, w: 560, h: 340, x: [-0.5, 6], y: [0, 7.5], xTicks: [], yTicks: [], xLabel: 'x', yLabel: 'y', grid: false });
  const ms = (f(b) - f(a)) / h, mt = 0.4 * a;
  P.line([a, f(a)], ms, -0.3, 6, { color: BLUE, width: 2.2, dash: '8 6' });
  P.line([a, f(a)], mt, -0.5, 6, { color: INK, width: 2.4 });
  P.curve(f, -0.5, 6, { color: CRIMSON, width: 3.4 });
  // Run and rise
  P.seg([a, f(a)], [b, f(a)], { color: MUTED, width: 1.6, dash: '4 4' });
  P.seg([b, f(a)], [b, f(b)], { color: MUTED, width: 1.6, dash: '4 4' });
  P.dot([a, f(a)], { color: CRIMSON }); P.dot([b, f(b)], { color: BLUE });
  P.text([(a + b) / 2, f(a)], it('h'), { anchor: 'middle', dy: 20, size: 16 });
  P.text([b, f(a) + 0.95], `${it('f')}(${it('a')} + ${it('h')}) − ${it('f')}(${it('a')})`, { dx: 10, dy: 5, size: 15 });
  P.text([a, f(a)], `(${it('a')}, ${it('f')}(${it('a')}))`, { dx: 4, dy: -12, size: 14, anchor: 'end' });
  P.text([b, f(b)], `(${it('a')} + ${it('h')}, ${it('f')}(${it('a')} + ${it('h')}))`, { dx: -10, dy: -10, size: 14, anchor: 'end' });
  P.text([a, 0], it('a'), { anchor: 'middle', dy: 18, size: 15 }); P.text([b, 0], `${it('a')} + ${it('h')}`, { anchor: 'middle', dy: 18, size: 15 });
  P.seg([a, 0], [a, f(a)], { color: GRID, width: 1.2 }); P.seg([b, 0], [b, f(a)], { color: GRID, width: 1.2 });
  P.text([5.9, f(5.9)], `${it('y')} = ${it('f')}(${it('x')})`, { color: CRIMSON, anchor: 'end', dx: -12, dy: 4, size: 15 });
  let body = txt(640, 90, 'secant line', { color: BLUE, bold: true, size: 14 }) + txt(640, 110, 'slope = average rate', { size: 13, color: BLUE })
    + txt(640, 128, `on [${it('a')}, ${it('a')} + ${it('h')}]`, { size: 13, color: BLUE });
  body += txt(640, 230, 'tangent line', { bold: true, size: 14 }) + txt(640, 250, `slope = ${it('f')} ′(${it('a')}), the`, { size: 13 }) + txt(640, 268, `limit as ${it('h')} → 0`, { size: 13 });
  return doc(800, 420, 'From secant line to tangent line',
    'The curve y = f(x) with a point at x = a and a second point at x = a + h. A dashed blue secant line joins them; a dashed run of length h and a rise of f(a + h) minus f(a) are marked. A solid dark tangent line touches the curve at x = a. The secant slope is the average rate of change on [a, a + h]; as h shrinks to 0 it approaches the tangent slope f prime of a.',
    P.parts.join('\n') + '\n' + body);
};

/* 2.3: a difference quotient from table data. Data from the notes' worked example. */
FIGS['table-difference-quotient'] = () => {
  const T = [[0, 180], [4, 152], [10, 121], [14, 105], [20, 88]];
  const P = panel({ left: 70, top: 40, w: 520, h: 320, x: [0, 22], y: [60, 190], xTicks: ticks(0, 22, 2), yTicks: ticks(60, 190, 20), xLabel: 't (min)', yLabel: 'B(t) (°F)' });
  const m = (T[3][1] - T[2][1]) / (T[3][0] - T[2][0]);
  P.line(T[2], m, 6, 18, { color: BLUE, width: 2.4, dash: '8 6' });
  for (let i = 0; i < T.length - 1; i++) P.seg(T[i], T[i + 1], { color: '#C9CFCD', width: 1.4 });
  T.forEach(p => P.dot(p, { color: CRIMSON, r: 5.5 }));
  P.seg([12, 60], [12, 190], { color: MUTED, width: 1.2, dash: '3 4' });
  P.text([12, 190], `${it('t')} = 12`, { dx: 6, dy: 14, size: 13, color: MUTED });
  P.seg(T[2], [T[3][0], T[2][1]], { color: INK, width: 1.4, dash: '4 3' });
  P.seg([T[3][0], T[2][1]], T[3], { color: INK, width: 1.4, dash: '4 3' });
  P.text([12, 121], '4 min', { anchor: 'middle', dy: -6, size: 13 });
  P.text([14, 113], '−16 °F', { dx: 6, size: 13 });
  let body = txt(610, 90, 'Estimate of', { size: 14, bold: true }) + txt(610, 110, `${it('B')} ′(12):`, { size: 14, bold: true });
  body += txt(610, 140, `${it('B')}(14) − ${it('B')}(10)`, { size: 14 }) + `<line x1="610" y1="148" x2="740" y2="148" stroke="${INK}"/>` + txt(675, 166, '14 − 10', { size: 14, anchor: 'middle' });
  body += txt(610, 196, '= (105 − 121)/4', { size: 14 }) + txt(610, 218, '= −4 °F per minute', { size: 14, color: BLUE, bold: true });
  body += txt(610, 262, 'The interval [10, 14]', { size: 13, color: MUTED }) + txt(610, 280, 'has t = 12 inside it.', { size: 13, color: MUTED });
  return doc(780, 400, 'Estimating a derivative from a table',
    'Five measured temperatures B(t) of a cooling loaf of bread, in degrees Fahrenheit, at t = 0, 4, 10, 14 and 20 minutes: 180, 152, 121, 105 and 88. A dashed secant line joins the points at t = 10 and t = 14, which sit on either side of t = 12. Its slope, (105 minus 121) over (14 minus 10), equals minus 4 degrees Fahrenheit per minute, the estimate of B prime of 12.',
    P.parts.join('\n') + '\n' + body);
};

/* 2.4: continuous but not differentiable (three ways) and a jump. */
FIGS['where-derivatives-fail'] = () => {
  const W = 250, H = 170, gap = 40, L = 50, T1 = 95, T2 = 390;
  const mk = (left, top) => panel({ left, top, w: W, h: H, x: [-2, 2], y: [-1.5, 2.5], xTicks: ticks(-2, 2, 1), yTicks: ticks(-1, 2, 1), xLabel: 'x', yLabel: 'y' });
  const A = mk(L, T1), B = mk(L + W + gap + 40, T1), C = mk(L, T2), D = mk(L + W + gap + 40, T2);
  A.curve('abs(x) + 0.5', -2, 2, { color: CRIMSON }); A.dot([0, 0.5], { color: CRIMSON, r: 4.5 });
  B.curve('x^(2/3)', -2, 2, { color: CRIMSON }); B.dot([0, 0], { color: CRIMSON, r: 4.5 });
  C.vline(1, { color: BLUE, dash: '7 5', width: 2 }); C.curve('(x - 1)^(1/3)', -2, 2, { color: CRIMSON, n: 2000 }); C.dot([1, 0], { color: CRIMSON, r: 4.5 });
  D.curve('x/2 + 1', -2, 1, { color: CRIMSON }); D.curve('x - 1', 1, 2, { color: CRIMSON }); D.dot([1, 1.5], { color: CRIMSON }); D.dot([1, 0], { color: CRIMSON, open: true });
  let body = '';
  const head = (x, y, a, b, c) => txt(x, y, a, { bold: true, size: 15 }) + txt(x, y + 19, b, { size: 13, color: MUTED }) + (c ? txt(x, y + 36, c, { size: 13, color: MUTED }) : '');
  body += head(L, 22, `Corner: ${it('y')} = |${it('x')}| + 0.5`, 'continuous, not differentiable at 0', 'slopes −1 on the left, 1 on the right');
  body += head(L + W + gap + 40, 22, `Cusp: ${it('y')} = ${it('x')}${sup('2/3')}`, 'continuous, not differentiable at 0', 'slopes → −∞ on the left, +∞ on the right');
  body += head(L, T2 - 70, `Vertical tangent: ${it('y')} = (${it('x')} − 1)${sup('1/3')}`, 'continuous, not differentiable at 1', 'slopes grow without bound');
  body += head(L + W + gap + 40, T2 - 70, 'Jump: not continuous at 1', 'so not differentiable at 1', '');
  return doc(700, 590, 'Four places where a derivative does not exist',
    'Four small graphs. A corner: y = |x| + 0.5, a V shape with slope minus 1 on the left of 0 and 1 on the right. A cusp: y = x to the two-thirds, a sharp point at the origin where the slopes become infinitely steep in opposite directions. A vertical tangent: y = cube root of (x minus 1), which passes through (1, 0) with a vertical tangent line x = 1, drawn dashed. A jump: a line that ends with a closed dot at (1, 1.5) and restarts with an open dot at (1, 0). The first three are continuous but not differentiable at the marked point; the jump is not continuous, so it is not differentiable either.',
    [A, B, C, D].map(p => p.parts.join('\n')).join('\n') + '\n' + body);
};

/* 2.5: f(x) = x^3 and its slopes; f'(x) = 3x^2 underneath. */
FIGS['power-rule-slopes'] = () => {
  const top = panel({ left: 60, top: 40, w: 420, h: 220, x: [-2, 2], y: [-4.5, 4.5], xTicks: ticks(-2, 2, 1), yTicks: ticks(-4, 4, 2), xLabel: 'x', yLabel: 'y' });
  const bot = panel({ left: 60, top: 320, w: 420, h: 200, x: [-2, 2], y: [-0.5, 12.5], xTicks: ticks(-2, 2, 1), yTicks: ticks(0, 12, 3), xLabel: 'x', yLabel: 'y' });
  const pts = [-1.4, -0.7, 0, 0.7, 1.4];
  top.curve('x^3', -2, 2, { color: CRIMSON });
  pts.forEach(a => top.tan([a, a ** 3], 3 * a * a, 28, { width: 3 }));
  pts.forEach(a => top.dot([a, a ** 3], { color: CRIMSON, r: 4 }));
  bot.curve('3x^2', -2, 2, { color: BLUE });
  pts.forEach(a => { bot.dot([a, 3 * a * a], { color: BLUE, r: 4.5 }); bot.seg([a, 3 * a * a], [a, 0], { color: MUTED, width: 1, dash: '3 3' }); });
  let body = txt(500, 80, `${it('f')}(${it('x')}) = ${it('x')}${sup('3')}`, { size: 17, color: CRIMSON, bold: true });
  body += txt(500, 106, 'Short blue segments:', { size: 13, color: MUTED }) + txt(500, 124, 'its tangent lines at', { size: 13, color: MUTED }) + txt(500, 142, `${it('x')} = −1.4, −0.7, 0, 0.7, 1.4`, { size: 13, color: MUTED });
  body += txt(500, 360, `${it('f')} ′(${it('x')}) = 3${it('x')}${sup('2')}`, { size: 17, color: BLUE, bold: true });
  body += txt(500, 386, 'Each dot is the slope', { size: 13, color: MUTED }) + txt(500, 404, 'of the tangent line above it:', { size: 13, color: MUTED }) + txt(500, 422, '5.88, 1.47, 0, 1.47, 5.88', { size: 13, color: MUTED });
  for (const a of pts) body += `<line x1="${r2(top.sx(a))}" y1="${r2(top.sy(-4.5))}" x2="${r2(bot.sx(a))}" y2="${r2(bot.sy(12.5))}" stroke="${GRID}" stroke-width="1.2" stroke-dasharray="2 4"/>`;
  return doc(720, 560, 'The power rule seen as slopes',
    'Top: the graph of f(x) = x cubed with short tangent segments at x = minus 1.4, minus 0.7, 0, 0.7 and 1.4. Bottom, on the same x scale: the graph of f prime of x = 3x squared, with dots at heights 5.88, 1.47, 0, 1.47 and 5.88, the slopes of those tangent lines. The slope is 0 at x = 0 and the same at x and minus x.',
    top.parts.join('\n') + '\n' + bot.parts.join('\n') + '\n' + body);
};

/* 2.6: adding a constant shifts the graph and keeps every slope. */
FIGS['shift-same-slope'] = () => {
  const f = x => 0.5 * x * x - x, P = panel({ left: 60, top: 40, w: 460, h: 320, x: [-2, 4], y: [-1.5, 6.5], xTicks: ticks(-2, 4, 1), yTicks: ticks(-1, 6, 1), xLabel: 'x', yLabel: 'y' });
  const a = 2.5, m = a - 1;
  P.line([a, f(a)], m, a - 1.3, a + 1.1, { color: CRIMSON, width: 2, dash: '7 5' });
  P.line([a, f(a) + 3], m, a - 1.3, a + 1.1, { color: BLUE, width: 2, dash: '7 5' });
  P.curve(f, -2, 4, { color: CRIMSON }); P.curve(x => f(x) + 3, -2, 4, { color: BLUE });
  P.dot([a, f(a)], { color: CRIMSON }); P.dot([a, f(a) + 3], { color: BLUE });
  P.seg([a, f(a) + 0.15], [a, f(a) + 2.85], { color: MUTED, width: 1.4 });
  P.text([a, f(a) + 1.5], '+3', { dx: 6, size: 14, color: MUTED });
  P.text([-1.7, f(-1.7)], `${it('y')} = ${it('f')}(${it('x')})`, { color: CRIMSON, dx: 8, dy: 4, size: 15 });
  P.text([2.0, 5.3], `${it('y')} = ${it('f')}(${it('x')}) + 3`, { color: BLUE, anchor: 'end', size: 15 });
  let body = txt(540, 100, `${it('f')}(${it('x')}) = 0.5${it('x')}${sup('2')} − ${it('x')}`, { size: 15, bold: true, color: CRIMSON });
  body += txt(540, 140, 'At x = 2.5 both tangent', { size: 14 }) + txt(540, 160, 'lines have slope 1.5.', { size: 14 });
  body += txt(540, 200, 'A constant moves the', { size: 14 }) + txt(540, 220, 'graph up; it does not', { size: 14 }) + txt(540, 240, 'tilt it. So', { size: 14 });
  body += txt(540, 268, `(${it('f')} + 3)′ = ${it('f')} ′`, { size: 15, bold: true });
  return doc(740, 400, 'A constant shifts a graph without changing its slopes',
    'The parabola y = f(x) = 0.5x squared minus x, and the same curve shifted up 3 units, y = f(x) + 3. At x = 2.5 each curve has a dashed tangent line; the two tangent lines are parallel, both with slope 1.5. Adding a constant changes heights but no slopes, so the derivative of f + 3 is f prime.',
    P.parts.join('\n') + '\n' + body);
};

/* 2.7: slopes of sin x are the values of cos x. */
FIGS['sine-slopes-cosine'] = () => {
  const xt = ticks(0, 2 * PI, PI / 2);
  const top = panel({ left: 60, top: 40, w: 490, h: 180, x: [-0.3, 2 * PI + 0.3], y: [-1.5, 1.5], xTicks: xt, yTicks: [-1, 1], xTickLabel: piLab, xLabel: 'x', yLabel: 'y' });
  const bot = panel({ left: 60, top: 290, w: 490, h: 180, x: [-0.3, 2 * PI + 0.3], y: [-1.5, 1.5], xTicks: xt, yTicks: [-1, 1], xTickLabel: piLab, xLabel: 'x', yLabel: 'y' });
  top.curve('sin(x)', -0.3, 2 * PI + 0.3, { color: CRIMSON });
  xt.forEach(a => top.tan([a, Math.sin(a)], Math.cos(a), 40, { width: 3 }));
  xt.forEach(a => top.dot([a, Math.sin(a)], { color: CRIMSON, r: 4 }));
  bot.curve('cos(x)', -0.3, 2 * PI + 0.3, { color: BLUE });
  xt.forEach(a => bot.dot([a, Math.cos(a)], { color: BLUE, r: 4.5 }));
  let body = txt(605, 90, `${it('y')} = sin ${it('x')}`, { size: 17, bold: true, color: CRIMSON }) + txt(605, 114, 'tangent slopes at the', { size: 13, color: MUTED }) + txt(605, 132, 'dots: 1, 0, −1, 0, 1', { size: 13, color: MUTED });
  body += txt(605, 340, `${it('y')} = cos ${it('x')}`, { size: 17, bold: true, color: BLUE }) + txt(605, 364, 'its heights at the same', { size: 13, color: MUTED }) + txt(605, 382, 'x: 1, 0, −1, 0, 1', { size: 13, color: MUTED });
  for (const a of xt) body += `<line x1="${r2(top.sx(a))}" y1="${r2(top.sy(-1.5))}" x2="${r2(bot.sx(a))}" y2="${r2(bot.sy(1.5))}" stroke="${GRID}" stroke-width="1.2" stroke-dasharray="2 4"/>`;
  return doc(760, 510, 'The slopes of sine are the values of cosine',
    'Top: y = sin x from 0 to 2 pi with short tangent segments at 0, pi/2, pi, 3pi/2 and 2pi, whose slopes are 1, 0, minus 1, 0 and 1. Bottom, on the same scale: y = cos x, whose heights at those x values are 1, 0, minus 1, 0 and 1. The derivative of sin x is cos x.',
    top.parts.join('\n') + '\n' + bot.parts.join('\n') + '\n' + body);
};

/* 2.8: the product rule as the growth of a rectangle's area. */
FIGS['product-rule-area'] = () => {
  const x0 = 70, y0 = 60, F = 300, G = 200, dF = 70, dG = 50;
  let b = '';
  b += `<rect x="${x0}" y="${y0}" width="${F}" height="${G}" fill="#F3F5F4" stroke="${INK}" stroke-width="2"/>`;
  b += `<rect x="${x0 + F}" y="${y0}" width="${dF}" height="${G}" fill="#FBE3EA" stroke="${CRIMSON}" stroke-width="2"/>`;
  b += `<rect x="${x0}" y="${y0 + G}" width="${F}" height="${dG}" fill="#DCEBF6" stroke="${BLUE}" stroke-width="2"/>`;
  b += `<rect x="${x0 + F}" y="${y0 + G}" width="${dF}" height="${dG}" fill="#E9ECEB" stroke="${MUTED}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  b += txt(x0 + F / 2, y0 + G / 2 + 6, `${it('f')} · ${it('g')}`, { size: 22, anchor: 'middle' });
  b += txt(x0 + F / 2, y0 + G / 2 + 30, 'old area', { size: 14, anchor: 'middle', color: MUTED });
  b += txt(x0 + F + dF / 2, y0 + G / 2 + 6, `${it('g')}Δ${it('f')}`, { size: 16, anchor: 'middle', color: CRIMSON, bold: true });
  b += txt(x0 + F / 2, y0 + G + dG / 2 + 6, `${it('f')}Δ${it('g')}`, { size: 16, anchor: 'middle', color: BLUE, bold: true });
  b += txt(x0 + F + dF / 2, y0 + G + dG / 2 + 5, `Δ${it('f')}Δ${it('g')}`, { size: 12, anchor: 'middle', color: MUTED });
  // Dimension labels
  const dim = (x1, y1, x2, y2, label, lx, ly, col) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="1.3"/>` + txt(lx, ly, label, { size: 15, anchor: 'middle', color: col });
  b += dim(x0, y0 - 18, x0 + F, y0 - 18, it('f'), x0 + F / 2, y0 - 25, INK) + dim(x0 + F, y0 - 18, x0 + F + dF, y0 - 18, `Δ${it('f')}`, x0 + F + dF / 2, y0 - 25, CRIMSON);
  b += dim(x0 - 18, y0, x0 - 18, y0 + G, '', 0, 0, INK) + txt(x0 - 26, y0 + G / 2 + 5, it('g'), { size: 15, anchor: 'end' });
  b += dim(x0 - 18, y0 + G, x0 - 18, y0 + G + dG, '', 0, 0, BLUE) + txt(x0 - 26, y0 + G + dG / 2 + 5, `Δ${it('g')}`, { size: 15, anchor: 'end', color: BLUE });
  const tx = 500;
  b += txt(tx, 90, 'Change in area:', { size: 15, bold: true });
  b += txt(tx, 118, `Δ(${it('fg')}) = ${it('g')}Δ${it('f')} + ${it('f')}Δ${it('g')} + Δ${it('f')}Δ${it('g')}`, { size: 14 });
  b += txt(tx, 156, `Divide by Δ${it('x')} and let Δ${it('x')} → 0.`, { size: 14 });
  b += txt(tx, 178, 'The tiny corner piece vanishes:', { size: 14 });
  b += txt(tx, 216, `(${it('fg')})′ = ${it('f')} ′${it('g')} + ${it('f')}${it('g')} ′`, { size: 18, bold: true, color: INK });
  b += txt(tx, 256, `Two strips, not one corner: the`, { size: 13, color: MUTED });
  b += txt(tx, 274, `rule is not ${it('f')} ′ · ${it('g')} ′.`, { size: 13, color: MUTED });
  return doc(800, 340, 'The product rule as a growing rectangle',
    'A rectangle with width f and height g has area f times g. When x changes a little, the width grows by delta f and the height by delta g. The new area adds a strip g delta f on the right, a strip f delta g along the bottom, and a tiny corner delta f delta g. Dividing by delta x and letting delta x go to 0 makes the corner vanish, which gives (fg) prime = f prime g + f g prime.',
    b);
};

/* 2.9: f(x) = x/(x^2 + 1) and its derivative (1 - x^2)/(x^2 + 1)^2. */
FIGS['quotient-graph'] = () => {
  const top = panel({ left: 60, top: 40, w: 460, h: 190, x: [-4, 4], y: [-0.75, 0.75], xTicks: ticks(-4, 4, 1), yTicks: [-0.5, 0.5], xLabel: 'x', yLabel: 'y' });
  const bot = panel({ left: 60, top: 300, w: 460, h: 190, x: [-4, 4], y: [-0.4, 1.2], xTicks: ticks(-4, 4, 1), yTicks: [0.5, 1], xLabel: 'x', yLabel: 'y', xTickDy: -8 });
  top.curve('x/(x^2+1)', -4, 4, { color: CRIMSON });
  top.tan([1, 0.5], 0, 24, { width: 3 }); top.tan([-1, -0.5], 0, 24, { width: 3 }); top.tan([0, 0], 1, 40, { width: 3 });
  top.dot([1, 0.5], { color: CRIMSON, r: 4.5 }); top.dot([-1, -0.5], { color: CRIMSON, r: 4.5 }); top.dot([0, 0], { color: CRIMSON, r: 4.5 });
  bot.curve('(1-x^2)/(x^2+1)^2', -4, 4, { color: BLUE });
  bot.dot([1, 0], { color: BLUE, r: 4.5 }); bot.dot([-1, 0], { color: BLUE, r: 4.5 }); bot.dot([0, 1], { color: BLUE, r: 4.5 });
  let body = txt(540, 80, `${it('f')}(${it('x')}) = ${it('x')}/(${it('x')}${sup('2')} + 1)`, { size: 16, bold: true, color: CRIMSON });
  body += txt(540, 106, 'tangent lines at x = −1, 0, 1', { size: 13, color: MUTED }) + txt(540, 124, 'slopes 0, 1, 0', { size: 13, color: MUTED });
  body += txt(540, 340, `${it('f')} ′(${it('x')}) = (1 − ${it('x')}${sup('2')})/(${it('x')}${sup('2')} + 1)${sup('2')}`, { size: 15, bold: true, color: BLUE });
  body += txt(540, 366, 'zero at x = ±1, where the', { size: 13, color: MUTED }) + txt(540, 384, 'tangent lines are flat;', { size: 13, color: MUTED }) + txt(540, 402, 'equal to 1 at x = 0', { size: 13, color: MUTED });
  return doc(800, 530, 'A quotient and its derivative',
    'Top: the graph of f(x) = x over (x squared plus 1), which rises from near 0 on the left to a high point at (1, 0.5) after a low point at (minus 1, minus 0.5). Tangent lines are drawn at x = minus 1 and 1, both flat, and at x = 0, with slope 1. Bottom: the graph of f prime of x = (1 minus x squared) over (x squared plus 1) squared, from the quotient rule. It crosses 0 at x = minus 1 and 1 and has height 1 at x = 0.',
    top.parts.join('\n') + '\n' + bot.parts.join('\n') + '\n' + body);
};

/* 2.10: tan x and sec^2 x. */
FIGS['tangent-sec-squared'] = () => {
  const xt = [-PI / 2, -PI / 4, 0, PI / 4, PI / 2];
  const top = panel({ left: 60, top: 40, w: 440, h: 230, x: [-PI / 2 - 0.15, PI / 2 + 0.15], y: [-4, 4], xTicks: xt, yTicks: ticks(-4, 4, 2), xTickLabel: piLab, xLabel: 'x', yLabel: 'y' });
  const bot = panel({ left: 60, top: 330, w: 440, h: 190, x: [-PI / 2 - 0.15, PI / 2 + 0.15], y: [-0.5, 5], xTicks: xt, yTicks: ticks(1, 5, 1), xTickLabel: piLab, xLabel: 'x', yLabel: 'y' });
  top.vline(-PI / 2); top.vline(PI / 2); bot.vline(-PI / 2); bot.vline(PI / 2);
  top.curve('tan(x)', -PI / 2 + 0.001, PI / 2 - 0.001, { color: CRIMSON, n: 1200 });
  top.tan([0, 0], 1, 50, { width: 3 }); top.tan([PI / 4, 1], 2, 50, { width: 3 });
  top.dot([0, 0], { color: CRIMSON, r: 4.5 }); top.dot([PI / 4, 1], { color: CRIMSON, r: 4.5 });
  bot.curve('1/cos(x)^2', -PI / 2 + 0.001, PI / 2 - 0.001, { color: BLUE, n: 1200 });
  bot.seg([-PI / 2, 1], [PI / 2, 1], { color: MUTED, width: 1, dash: '3 4' });
  bot.dot([0, 1], { color: BLUE, r: 4.5 }); bot.dot([PI / 4, 2], { color: BLUE, r: 4.5 });
  let body = txt(525, 80, `${it('y')} = tan ${it('x')}`, { size: 17, bold: true, color: CRIMSON }) + txt(525, 104, 'tangent slope 1 at x = 0,', { size: 13, color: MUTED }) + txt(525, 122, '2 at x = π/4; always rising', { size: 13, color: MUTED });
  body += txt(525, 370, `${it('y')} = sec${sup('2')} ${it('x')}`, { size: 17, bold: true, color: BLUE }) + txt(525, 394, 'never below 1: every', { size: 13, color: MUTED }) + txt(525, 412, 'slope of tan x is at least 1', { size: 13, color: MUTED });
  return doc(760, 560, 'The slopes of tan x are sec squared x',
    'Top: y = tan x between its vertical asymptotes at x = minus pi/2 and pi/2 (dashed), with tangent lines at x = 0 (slope 1) and x = pi/4 (slope 2). Bottom, on the same scale: y = sec squared x, which is 1 at x = 0, 2 at x = pi/4, never less than 1, and grows without bound near the asymptotes. The derivative of tan x is sec squared x.',
    top.parts.join('\n') + '\n' + bot.parts.join('\n') + '\n' + body);
};

const want = process.argv.slice(2);
for (const [id, make] of Object.entries(FIGS)) {
  if (want.length && !want.includes(id)) continue;
  writeFileSync(join(OUT, `${id}.svg`), make());
  console.log(`calculus/figures/${id}.svg`);
}
export { FIGS };
