/* Figures for AP® Calculus AB Unit 1, topics 1.7-1.16 (choosing a limit
   method through the Intermediate Value Theorem). Run:
     node scripts/apcalc-figures/unit-1b.mjs
   Writes calculus/figures/<id>.svg. Every figure is a standalone SVG with a
   white background, role="img", <title> and <desc>, Arial/Helvetica, ink
   #1F2A28, course crimson #8C1036 for emphasis and Okabe-Ito blue #0072B2,
   green #009E73 and vermillion #D55E00 for a second curve. Every curve is
   sampled from the function the caption names; open circles mark a missing
   point, closed circles the point that is there. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'calculus', 'figures');
const C = { ink: '#1F2A28', crimson: '#8C1036', blue: '#0072B2', green: '#009E73', verm: '#D55E00', grey: '#5A6268', grid: '#E4E8E6', axis: '#1F2A28', pale: '#FCE8EE', paleBlue: '#E3F0F8', paleGrey: '#F4F6F5' };
const r1 = v => Math.round(v * 10) / 10;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = v => String(+v.toPrecision(6)).replace('-', '−');

function text(x, y, s, o = {}) {
  const a = [`x="${r1(x)}"`, `y="${r1(y)}"`, `font-size="${o.size || 14}"`, `fill="${o.color || C.ink}"`];
  if (o.anchor) a.push(`text-anchor="${o.anchor}"`);
  if (o.weight) a.push(`font-weight="${o.weight}"`);
  if (o.halo) a.push('stroke="#FFFFFF" stroke-width="3" paint-order="stroke"');
  if (o.italic) a.push('font-style="italic"');
  return `<text ${a.join(' ')}>${s}</text>`;
}
const it = s => `<tspan font-style="italic">${s}</tspan>`;
const sup = (s, size = 10) => `<tspan baseline-shift="super" font-size="${size}">${s}</tspan>`;
function line(x1, y1, x2, y2, color = C.ink, w = 2, dash) { return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${color}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`; }
function arrowHead(x, y, ang, color, size = 9) {
  const a1 = ang + Math.PI * 0.85, a2 = ang - Math.PI * 0.85;
  return `<polygon points="${r1(x)},${r1(y)} ${r1(x + size * Math.cos(a1))},${r1(y + size * Math.sin(a1))} ${r1(x + size * Math.cos(a2))},${r1(y + size * Math.sin(a2))}" fill="${color}"/>`;
}
function arrow(x1, y1, x2, y2, color = C.ink, w = 2) { return line(x1, y1, x2 - 6 * Math.cos(Math.atan2(y2 - y1, x2 - x1)), y2 - 6 * Math.sin(Math.atan2(y2 - y1, x2 - x1)), color, w) + arrowHead(x2, y2, Math.atan2(y2 - y1, x2 - x1), color); }
function box(x, y, w, h, o = {}) { return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${o.rx ?? 8}" fill="${o.fill || '#FFFFFF'}" stroke="${o.stroke || C.ink}" stroke-width="${o.width ?? 1.8}"/>`; }

let clipN = 0;
/* A graph panel: pixel box (px, py, pw, ph) for the plotting area, data ranges xr, yr. */
function panel(o) {
  const { px, py, pw, ph, xr, yr } = o;
  const sx = x => px + (x - xr[0]) / (xr[1] - xr[0]) * pw;
  const sy = y => py + (yr[1] - y) / (yr[1] - yr[0]) * ph;
  const id = `${o.fid}-clip${++clipN}`;
  const out = [], top = [];
  const xs = [], ys = [];
  for (let v = Math.ceil(xr[0] / o.xStep - 1e-9) * o.xStep; v <= xr[1] + 1e-9; v += o.xStep) xs.push(+v.toPrecision(10));
  for (let v = Math.ceil(yr[0] / o.yStep - 1e-9) * o.yStep; v <= yr[1] + 1e-9; v += o.yStep) ys.push(+v.toPrecision(10));
  if (o.grid !== false) {
    for (const v of xs) out.push(line(sx(v), py, sx(v), py + ph, C.grid, 1));
    for (const v of ys) out.push(line(px, sy(v), px + pw, sy(v), C.grid, 1));
  }
  const ax = yr[0] <= 0 && yr[1] >= 0 ? sy(0) : py + ph, ay = xr[0] <= 0 && xr[1] >= 0 ? sx(0) : px;
  out.push(line(px, ax, px + pw + 8, ax, C.axis, 1.5) + arrowHead(px + pw + 12, ax, 0, C.axis, 8));
  out.push(line(ay, py + ph, ay, py - 8, C.axis, 1.5) + arrowHead(ay, py - 12, -Math.PI / 2, C.axis, 8));
  const skipX = new Set(o.skipX || []), skipY = new Set(o.skipY || []);
  if (o.ticks !== false) {
    for (const v of xs) { if (Math.abs(v) < 1e-9 && ay !== px) continue; out.push(line(sx(v), ax - 3, sx(v), ax + 3, C.axis, 1.2)); if (!skipX.has(v)) top.push(text(sx(v), ax + 16, fmt(v), { size: 11.5, anchor: 'middle', color: C.grey, halo: true })); }
    for (const v of ys) { if (Math.abs(v) < 1e-9 && ax !== py + ph) continue; out.push(line(ay - 3, sy(v), ay + 3, sy(v), C.axis, 1.2)); if (!skipY.has(v)) top.push(text(ay - 6, sy(v) + 4, fmt(v), { size: 11.5, anchor: 'end', color: C.grey, halo: true })); }
  }
  out.push(text(px + pw + 14, ax + 4, it(o.xLabel || 'x'), { size: 14, anchor: 'start' }));
  out.push(text(ay + 6, py - 6, it(o.yLabel || 'y'), { size: 14, anchor: 'start' }));
  const defs = `<clipPath id="${id}"><rect x="${px}" y="${py - 4}" width="${pw}" height="${ph + 8}"/></clipPath>`;
  const P = {
    sx, sy, out, top, defs,
    curve(f, a, b, color = C.crimson, opt = {}) {
      const n = opt.n || 600, pts = [];
      let d = '', pen = false;
      for (let i = 0; i <= n; i++) {
        const x = a + (b - a) * i / n, y = f(x);
        if (!Number.isFinite(y)) { pen = false; continue; }
        const Y = Math.max(yr[0] - (yr[1] - yr[0]), Math.min(yr[1] + (yr[1] - yr[0]), y));
        d += `${pen ? 'L' : 'M'}${r1(sx(x))} ${r1(sy(Y))}`; pen = true; pts.push([x, y]);
      }
      out.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${opt.width || 2.6}" stroke-linejoin="round" stroke-linecap="round"${opt.dash ? ` stroke-dasharray="${opt.dash}"` : ''} clip-path="url(#${id})"/>`);
      return P;
    },
    vline(x, color = C.grey, dash = '6 5') { out.push(line(sx(x), py - 4, sx(x), py + ph + 4, color, 1.6, dash)); return P; },
    hline(y, color = C.grey, dash = '6 5', a = xr[0], b = xr[1]) { out.push(line(sx(a), sy(y), sx(b), sy(y), color, 1.6, dash)); return P; },
    dot(x, y, open, color = C.crimson) { out.push(`<circle cx="${r1(sx(x))}" cy="${r1(sy(y))}" r="5" fill="${open ? '#FFFFFF' : color}" stroke="${color}" stroke-width="2.2"/>`); return P; },
    label(x, y, s, o2 = {}) { out.push(text(sx(x) + (o2.dx || 0), sy(y) + (o2.dy || 0), s, { size: o2.size || 13, anchor: o2.anchor || 'start', color: o2.color || C.ink, weight: o2.weight })); return P; },
    raw(s) { out.push(s); return P; },
  };
  return P;
}

function svgDoc(fid, w, h, title, desc, defs, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${fid}-t ${fid}-d" font-family="Arial, Helvetica, sans-serif">
<title id="${fid}-t">${esc(title)}</title>
<desc id="${fid}-d">${esc(desc)}</desc>
<defs>${defs.join('')}</defs>
<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body.join('\n')}
</svg>
`;
}
const figs = {};
function make(fid, w, h, title, desc, build) {
  const defs = [], body = [];
  build({ defs, body, panel: o => { const P = panel({ fid, ...o }); defs.push(P.defs); return P; } });
  figs[fid] = svgDoc(fid, w, h, title, desc, defs, body);
}
const flush = P => P.out.join('') + P.top.join('');
const caption = (x, y, s, color = C.ink, size = 14) => text(x, y, s, { size, anchor: 'middle', weight: 'bold', color });

/* 1.7 A decision map for limits. */
make('limit-method-map', 760, 470, 'Choosing a way to find a limit',
  'A decision map. Start by substituting x = c. If you get a number, that is the limit. If you get a nonzero number over 0, the function is unbounded near c: check the sign on each side. If you get 0 over 0, rewrite by factoring, rationalizing or combining fractions, then substitute again. For a piecewise or absolute value function at a break point, find both one-sided limits and compare them.',
  ({ body }) => {
    const B = (x, y, w, h, lines, o = {}) => { body.push(box(x, y, w, h, o)); lines.forEach((s, i) => body.push(text(x + w / 2, y + h / 2 + (i - (lines.length - 1) / 2) * 18 + 5, s, { size: 14, anchor: 'middle', weight: i === 0 && o.boldFirst ? 'bold' : undefined, color: o.color }))); };
    B(250, 18, 260, 54, ['Start: substitute ' + it('x') + ' = ' + it('c'), 'into the expression'], { stroke: C.crimson, width: 2.4, fill: C.pale, boldFirst: true, color: C.crimson });
    // three outcomes
    body.push(arrow(330, 72, 120, 128), arrow(380, 72, 380, 128), arrow(430, 72, 640, 128));
    B(30, 130, 180, 56, ['A number ' + it('L'), '(like 7 or −2)'], { boldFirst: true });
    B(290, 130, 180, 56, [`<tspan font-weight="bold">0</tspan> over <tspan font-weight="bold">0</tspan>`, 'an indeterminate form']);
    B(550, 130, 180, 56, ['Nonzero over 0', '(like 5 over 0)'], { boldFirst: true });
    body.push(arrow(120, 186, 120, 236), arrow(380, 186, 380, 236), arrow(640, 186, 640, 236));
    B(20, 238, 200, 76, ['The limit is ' + it('L'), 'when the expression is', 'defined near ' + it('c')], { boldFirst: true, stroke: C.green, fill: '#E6F5EF', color: '#00603F' });
    B(270, 238, 220, 104, ['Rewrite, then substitute again', '• factor and cancel', '• multiply by the conjugate', '• combine the fractions'], { boldFirst: true, stroke: C.blue, fill: C.paleBlue, color: '#00507E' });
    B(540, 238, 200, 104, ['Unbounded near ' + it('c'), 'check the sign of the', 'expression on each side', '(a vertical asymptote)'], { boldFirst: true, stroke: C.verm, fill: '#FBEDE4', color: '#9A3D00' });
    // loop back
    body.push(`<path d="M270 300 C 236 300, 236 104, 250 64" fill="none" stroke="${C.blue}" stroke-width="2" stroke-dasharray="6 4"/>` + arrowHead(251, 58, -1.2, C.blue));
    body.push(text(232, 205, 'try again', { size: 12, anchor: 'end', color: C.blue, italic: true }));
    // piecewise side rule
    B(120, 372, 520, 78, ['A piecewise or absolute value function, at a break point?', 'Find the left-hand and right-hand limits separately.', 'Equal one-sided limits: the limit is that value. Unequal: it does not exist.'], { boldFirst: true, stroke: C.crimson, fill: '#FFFFFF' });
  });

/* 1.8 The squeeze: x sin(1/x) between -|x| and |x|. */
make('squeeze-x-sin', 760, 440, 'The squeeze theorem: x times sine of 1 over x',
  'The graph of f(x) = x sin(1/x) for x between −0.4 and 0.4, x not 0, drawn in crimson. It wiggles faster and faster near 0 but stays between the blue lines y = |x| and y = −|x|. Both blue graphs reach 0 at x = 0, so f is squeezed to 0: the limit of f(x) as x approaches 0 is 0. An open circle at the origin marks that f(0) is not defined.',
  ({ body, panel }) => {
    body.push(text(350, 26, 'Squeezed between −|' + it('x') + '| and |' + it('x') + '|, the limit at 0 is 0', { size: 15, anchor: 'middle', weight: 'bold' }));
    const P = panel({ px: 70, py: 60, pw: 560, ph: 340, xr: [-0.4, 0.4], yr: [-0.42, 0.42], xStep: 0.1, yStep: 0.1 });
    P.curve(x => Math.abs(x), -0.4, 0.4, C.blue, { width: 2.4 }).curve(x => -Math.abs(x), -0.4, 0.4, C.blue, { width: 2.4, dash: '8 5' });
    P.curve(x => x === 0 ? NaN : x * Math.sin(1 / x), -0.4, 0.4, C.crimson, { n: 40000, width: 1.8 });
    P.dot(0, 0, true);
    body.push(flush(P));
    body.push(text(648, 84, it('y') + ' = |' + it('x') + '|', { size: 15, color: C.blue, weight: 'bold' }));
    body.push(text(648, 392, it('y') + ' = −|' + it('x') + '|', { size: 15, color: C.blue, weight: 'bold' }));
    body.push(text(648, 170, it('f') + '(' + it('x') + ') =', { size: 15, color: C.crimson, weight: 'bold' }));
    body.push(text(648, 190, it('x') + ' sin(1/' + it('x') + ')', { size: 15, color: C.crimson, weight: 'bold' }));
  });

/* 1.9 One limit, three representations. */
make('limit-three-views', 780, 360, 'One limit read from a graph, a table and a formula',
  'Three panels for f(x) = (x² − x − 2)/(x − 2). The graph is the line y = x + 1 with an open circle at (2, 3) because f(2) is undefined. The table shows x = 1.9, 1.99, 1.999 giving 2.9, 2.99, 2.999 and x = 2.001, 2.01, 2.1 giving 3.001, 3.01, 3.1. The formula factors as (x − 2)(x + 1)/(x − 2) = x + 1 for x not 2. All three give a limit of 3 as x approaches 2.',
  ({ body, panel }) => {
    body.push(caption(130, 26, 'Graph', C.crimson), caption(395, 26, 'Table', C.crimson), caption(650, 26, 'Formula', C.crimson));
    const P = panel({ px: 40, py: 52, pw: 190, ph: 250, xr: [-1, 4], yr: [-1, 5], xStep: 1, yStep: 1 });
    P.hline(3, C.grey, '4 4', -1, 2).vline(2, C.grey, '4 4');
    P.curve(x => x + 1, -1, 4).dot(2, 3, true).label(2, 3, '(2, 3)', { dx: 8, dy: 18, size: 12 });
    body.push(flush(P));
    // table
    const tx = 300, ty = 50, cw = 95, rh = 26;
    const rows = [['x', 'f(x)'], ['1.9', '2.9'], ['1.99', '2.99'], ['1.999', '2.999'], ['2', '—'], ['2.001', '3.001'], ['2.01', '3.01'], ['2.1', '3.1']];
    rows.forEach((row, i) => {
      const y = ty + i * rh;
      body.push(`<rect x="${tx}" y="${y}" width="${cw * 2}" height="${rh}" fill="${i === 0 ? C.pale : i === 4 ? C.paleGrey : '#FFFFFF'}" stroke="#C9CFCC" stroke-width="1"/>`);
      body.push(line(tx + cw, y, tx + cw, y + rh, '#C9CFCC', 1));
      const t0 = i === 0 ? it('x') : row[0], t1 = i === 0 ? it('f') + '(' + it('x') + ')' : row[1];
      body.push(text(tx + cw / 2, y + 18, t0, { size: 13.5, anchor: 'middle', weight: i === 0 ? 'bold' : undefined }));
      body.push(text(tx + cw * 1.5, y + 18, t1, { size: 13.5, anchor: 'middle', weight: i === 0 ? 'bold' : undefined, color: i > 0 && i !== 4 ? C.crimson : C.ink }));
    });
    body.push(text(395, 284, 'undefined at 2', { size: 12, anchor: 'middle', color: C.grey, italic: true }));
    body.push(text(395, 304, 'both sides close in on 3', { size: 12.5, anchor: 'middle' }));
    // formula
    const fx = 650;
    body.push(text(fx, 90, it('f') + '(' + it('x') + ') = (' + it('x') + sup('2') + ' − ' + it('x') + ' − 2) / (' + it('x') + ' − 2)', { size: 13.5, anchor: 'middle' }));
    body.push(text(fx, 132, '= (' + it('x') + ' − 2)(' + it('x') + ' + 1) / (' + it('x') + ' − 2)', { size: 13.5, anchor: 'middle' }));
    body.push(text(fx, 174, '= ' + it('x') + ' + 1, for ' + it('x') + ' ≠ 2', { size: 13.5, anchor: 'middle' }));
    body.push(text(fx, 216, 'Substitute 2 into ' + it('x') + ' + 1:', { size: 13.5, anchor: 'middle' }));
    body.push(text(fx, 246, 'lim = 2 + 1 = 3', { size: 15, anchor: 'middle', weight: 'bold', color: C.crimson }));
    body.push(line(520, 44, 520, 320, '#C9CFCC', 1), line(268, 44, 268, 320, '#C9CFCC', 1));
    body.push(text(390, 346, 'Every representation gives the same answer: the limit of ' + it('f') + '(' + it('x') + ') as ' + it('x') + ' approaches 2 is 3.', { size: 13.5, anchor: 'middle', weight: 'bold' }));
  });

/* 1.10 Three kinds of discontinuity. */
make('discontinuity-types', 780, 330, 'Three kinds of discontinuity',
  'Three graphs, each with a break at x = 2. Removable: the curve has a hole at (2, 3), an open circle, while f(2) = 1 is a closed dot below it; the limit exists. Jump: the left piece ends at a closed dot at (2, 1) and the right piece starts at an open circle at (2, 3); the one-sided limits differ. Infinite: the curve rises without bound on both sides of the dashed vertical asymptote x = 2.',
  ({ body, panel }) => {
    const titles = [['Removable', 'the limit exists, but the point', 'is missing or in the wrong place'], ['Jump', 'both one-sided limits exist,', 'but they differ'], ['Infinite', 'the function is unbounded', 'near the vertical asymptote']];
    const xs = [30, 290, 550];
    titles.forEach(([t, a, b], i) => { body.push(caption(xs[i] + 100, 24, t, C.crimson, 15)); body.push(text(xs[i] + 110, 298, a, { size: 12.5, anchor: 'middle', color: C.grey })); body.push(text(xs[i] + 110, 315, b, { size: 12.5, anchor: 'middle', color: C.grey })); });
    const opt = i => ({ px: xs[i] + 20, py: 44, pw: 180, ph: 220, xr: [0, 4], yr: [-1, 5], xStep: 1, yStep: 1 });
    const A = panel(opt(0));
    A.curve(x => 0.5 * (x - 2) ** 2 + 3 - 0.75 * (x - 2), 0, 4).dot(2, 3, true).dot(2, 1, false);
    body.push(flush(A));
    const Bp = panel(opt(1));
    Bp.curve(x => 0.25 * x * x, 0, 2).curve(x => 3 + 0.5 * (x - 2), 2, 4).dot(2, 1, false).dot(2, 3, true);
    body.push(flush(Bp));
    const Cp = panel(opt(2));
    Cp.vline(2, C.grey).curve(x => 1 / (x - 2) ** 2, 0, 1.999).curve(x => 1 / (x - 2) ** 2, 2.001, 4).label(2.95, 4.6, it('x') + ' = 2', { size: 12.5, color: C.grey, weight: 'bold' });
    body.push(flush(Cp));
  });

/* 1.11 The three conditions. */
make('continuity-three-conditions', 800, 340, 'The three conditions for continuity at a point',
  'Four graphs near x = c. First: an open circle and no closed dot, so f(c) is not defined and condition 1 fails. Second: a jump, so the limit at c does not exist and condition 2 fails. Third: a hole with the closed dot f(c) placed above it, so the limit exists but does not equal f(c) and condition 3 fails. Fourth: an unbroken curve through a closed dot, where all three conditions hold and f is continuous at c.',
  ({ body, panel }) => {
    const xs = [16, 212, 408, 604];
    const heads = [['1 fails', 'f(c) is not defined'], ['2 fails', 'the limit does not exist'], ['3 fails', 'the limit ≠ f(c)'], ['Continuous', 'all three hold']];
    heads.forEach(([a, b], i) => {
      body.push(caption(xs[i] + 90, 24, a, i === 3 ? C.green : C.crimson, 15));
      body.push(text(xs[i] + 90, 282, b.replace('f(c)', it('f') + '(' + it('c') + ')'), { size: 12.5, anchor: 'middle' }));
    });
    const opt = i => ({ px: xs[i] + 14, py: 44, pw: 160, ph: 200, xr: [0, 4], yr: [0, 5], xStep: 1, yStep: 1, ticks: false, skipX: [1, 2, 3, 4] });
    const lab = (P, i) => { body.push(text(P.sx(2), P.sy(0) + 16, it('c'), { size: 13, anchor: 'middle' })); P.raw(line(P.sx(2), P.sy(0) - 3, P.sx(2), P.sy(0) + 3, C.ink, 1.2)); };
    const g = x => 2 + 0.6 * Math.sin(1.2 * (x - 0.6)) + 0.15 * x;
    const P1 = panel(opt(0)); P1.curve(g, 0, 4).dot(2, g(2), true); lab(P1); body.push(flush(P1));
    const P2 = panel(opt(1)); P2.curve(x => 1 + 0.3 * x, 0, 2).curve(x => 3.6 + 0.2 * (x - 2), 2, 4).dot(2, 1.6, false).dot(2, 3.6, true); lab(P2); body.push(flush(P2));
    const P3 = panel(opt(2)); P3.curve(g, 0, 4).dot(2, g(2), true).dot(2, 4.2, false); lab(P3); body.push(flush(P3));
    const P4 = panel(opt(3)); P4.curve(g, 0, 4, C.green).dot(2, g(2), false, C.green); lab(P4); body.push(flush(P4));
    const checks = ['✗ 1   ✓ 2   ✗ 3', '✓ 1   ✗ 2   ✗ 3', '✓ 1   ✓ 2   ✗ 3', '✓ 1   ✓ 2   ✓ 3'];
    checks.forEach((s, i) => body.push(text(xs[i] + 90, 304, s, { size: 13, anchor: 'middle', color: C.grey })));
    body.push(text(400, 330, '1: ' + it('f') + '(' + it('c') + ') is defined.   2: the limit as ' + it('x') + ' → ' + it('c') + ' exists.   3: the limit equals ' + it('f') + '(' + it('c') + ').', { size: 13, anchor: 'middle', weight: 'bold' }));
  });

/* 1.12 Intervals of continuity. f(x) = x/2 + 1 for x < 1, 1/(3 - x) for x >= 1, x != 3. */
make('continuity-intervals', 760, 420, 'Where a piecewise function is continuous',
  'The graph of f(x) = x/2 + 1 for x < 1 and f(x) = 1/(3 − x) for x ≥ 1, x not 3. The left piece is a line ending at an open circle at (1, 1.5). The right piece starts at a closed dot at (1, 0.5), rises without bound as x approaches 3 from the left, and comes up from below on the other side of the dashed vertical asymptote x = 3. Brackets under the axis mark the intervals where f is continuous: (−∞, 1), [1, 3) and (3, ∞).',
  ({ body, panel }) => {
    const P = panel({ px: 60, py: 40, pw: 620, ph: 270, xr: [-2, 6], yr: [-3, 4], xStep: 1, yStep: 1 });
    P.vline(3).curve(x => x / 2 + 1, -2, 1).curve(x => 1 / (3 - x), 1, 2.999).curve(x => 1 / (3 - x), 3.001, 6).dot(1, 1.5, true).dot(1, 0.5, false);
    P.label(3, 3.6, it('x') + ' = 3', { dx: 6, size: 12.5, color: C.grey });
    P.label(-1.6, 1.6, it('y') + ' = ' + it('x') + '/2 + 1', { size: 13, color: C.crimson, weight: 'bold' });
    P.label(4.1, -1.7, it('y') + ' = 1/(3 − ' + it('x') + ')', { size: 13, color: C.crimson, weight: 'bold' });
    body.push(flush(P));
    const yb = 352, sx = P.sx;
    const seg = (a, b, la, lb, color, txt) => {
      body.push(line(sx(a), yb, sx(b), yb, color, 4));
      body.push(text(sx(a) + (la === '[' ? -2 : la === '(' ? -2 : 0), yb + 6, la, { size: 20, anchor: 'middle', color, weight: 'bold' }));
      body.push(text(sx(b) + 2, yb + 6, lb, { size: 20, anchor: 'middle', color, weight: 'bold' }));
      body.push(text((sx(a) + sx(b)) / 2, yb + 30, txt, { size: 13.5, anchor: 'middle', color, weight: 'bold' }));
    };
    seg(-2, 0.94, '', ')', C.blue, '(−∞, 1)');
    seg(1.06, 2.92, '[', ')', C.green, '[1, 3)');
    seg(3.08, 6, '(', '', C.verm, '(3, ∞)');
    body.push(text(60, 334, 'Intervals where ' + it('f') + ' is continuous:', { size: 13, color: C.ink, weight: 'bold' }));
  });

/* 1.13 Choosing k: f(x) = kx + 1 for x < 2, x^2 - 1 for x >= 2. */
make('removing-discontinuity-k', 780, 360, 'Choosing k so the pieces meet',
  'Two graphs of f(x) = kx + 1 for x < 2 and f(x) = x² − 1 for x ≥ 2. Left, with k = 2, the line reaches an open circle at (2, 5) while the parabola starts at a closed dot at (2, 3): a jump. Right, with k = 1, the line reaches (2, 3) exactly where the parabola starts, so the pieces meet and f is continuous at 2. The condition is 2k + 1 = 3, so k = 1.',
  ({ body, panel }) => {
    body.push(caption(200, 26, it('k') + ' = 2: the pieces miss (a jump)', C.verm, 14.5));
    body.push(caption(590, 26, it('k') + ' = 1: the pieces meet', C.green, 14.5));
    const opt = x0 => ({ px: x0, py: 50, pw: 300, ph: 240, xr: [-1, 3.5], yr: [-1, 7], xStep: 1, yStep: 1 });
    const A = panel(opt(50));
    A.hline(5, C.grey, '4 4', -1, 2).hline(3, C.grey, '4 4', -1, 2).curve(x => 2 * x + 1, -1, 2, C.verm).curve(x => x * x - 1, 2, 3.5, C.crimson).dot(2, 5, true, C.verm).dot(2, 3, false);
    A.label(0.5, 0.6, it('y') + ' = 2' + it('x') + ' + 1', { color: C.verm, weight: 'bold' }).label(2.6, 4.0, it('y') + ' = ' + it('x') + sup('2') + ' − 1', { weight: 'bold', color: C.crimson });
    body.push(flush(A));
    const B2 = panel(opt(440));
    B2.hline(3, C.grey, '4 4', -1, 2).curve(x => x + 1, -1, 2, C.green).curve(x => x * x - 1, 2, 3.5, C.crimson).dot(2, 3, false);
    B2.label(0.6, 0.9, it('y') + ' = ' + it('x') + ' + 1', { color: C.green, weight: 'bold' }).label(2.6, 4.0, it('y') + ' = ' + it('x') + sup('2') + ' − 1', { weight: 'bold', color: C.crimson });
    body.push(flush(B2));
    body.push(text(390, 340, 'Make the left limit equal the value at 2:  2' + it('k') + ' + 1 = 2' + sup('2') + ' − 1 = 3,  so  ' + it('k') + ' = 1.', { size: 14, anchor: 'middle', weight: 'bold' }));
  });

/* 1.14 Infinite limits. */
make('infinite-limits-two-cases', 780, 350, 'Infinite limits at a vertical asymptote',
  'Two graphs with a dashed vertical asymptote at x = 2. Left: y = 1/(x − 2)², which rises without bound on both sides, so the limit as x approaches 2 is +∞ from each side. Right: y = 1/(x − 2), which falls without bound from the left (−∞) and rises without bound from the right (+∞), so the one-sided infinite limits have opposite signs.',
  ({ body, panel }) => {
    body.push(caption(200, 26, it('y') + ' = 1/(' + it('x') + ' − 2)' + sup('2'), C.crimson, 15));
    body.push(caption(590, 26, it('y') + ' = 1/(' + it('x') + ' − 2)', C.blue, 15));
    const opt = x0 => ({ px: x0, py: 46, pw: 300, ph: 240, xr: [-1, 5], yr: [-6, 6], xStep: 1, yStep: 2 });
    const A = panel(opt(50));
    A.vline(2).curve(x => 1 / (x - 2) ** 2, -1, 1.995).curve(x => 1 / (x - 2) ** 2, 2.005, 5);
    A.label(2.3, -3, 'As ' + it('x') + ' → 2' + sup('−') + ', ' + it('y') + ' → +∞', { size: 12.5, weight: 'bold' }).label(2.3, -4.3, 'As ' + it('x') + ' → 2' + sup('+') + ', ' + it('y') + ' → +∞', { size: 12.5, weight: 'bold' });
    body.push(flush(A));
    const B2 = panel(opt(440));
    B2.vline(2).curve(x => 1 / (x - 2), -1, 1.995, C.blue).curve(x => 1 / (x - 2), 2.005, 5, C.blue);
    B2.label(2.3, -3, 'As ' + it('x') + ' → 2' + sup('−') + ', ' + it('y') + ' → −∞', { size: 12.5, weight: 'bold', color: C.blue }).label(2.3, -4.3, 'As ' + it('x') + ' → 2' + sup('+') + ', ' + it('y') + ' → +∞', { size: 12.5, weight: 'bold', color: C.blue });
    body.push(flush(B2));
    body.push(text(390, 322, 'The dashed line ' + it('x') + ' = 2 is a vertical asymptote in both graphs. Check each side: the signs can match or differ.', { size: 13.5, anchor: 'middle', weight: 'bold' }));
  });

/* 1.15 End behavior and growth. */
make('end-behavior-growth', 800, 380, 'Horizontal asymptotes and how fast functions grow',
  'Left: the graph of f(x) = (2x² + x)/(x² + 1) for x from −10 to 10 with the dashed horizontal asymptote y = 2. The graph crosses the asymptote at x = 2 and then approaches it from above, so a graph may cross a horizontal asymptote. Right: ln x in green, x³ in blue and eˣ in crimson for x from 0 to 6. At first x³ is above eˣ, but eˣ passes it near x = 4.54 and stays ahead; ln x grows slowest.',
  ({ body, panel }) => {
    body.push(caption(200, 26, it('f') + '(' + it('x') + ') = (2' + it('x') + sup('2') + ' + ' + it('x') + ')/(' + it('x') + sup('2') + ' + 1)', C.crimson, 14.5));
    body.push(caption(610, 26, 'Which grows faster?', C.ink, 14.5));
    const A = panel({ px: 50, py: 48, pw: 310, ph: 260, xr: [-10, 10], yr: [-1, 3], xStep: 2, yStep: 0.5, skipX: [-8, -4, 4, 8] });
    A.hline(2, C.grey).curve(x => (2 * x * x + x) / (x * x + 1), -10, 10).dot(2, 2, false, C.ink);
    A.label(-9.5, 2.25, it('y') + ' = 2', { size: 12.5, color: C.grey, weight: 'bold' }).label(2, 2, 'crosses at (2, 2)', { dx: 6, dy: 26, size: 12 });
    body.push(flush(A));
    const B2 = panel({ px: 460, py: 48, pw: 300, ph: 260, xr: [0, 6], yr: [0, 250], xStep: 1, yStep: 50 });
    B2.curve(x => Math.log(x), 0.001, 6, C.green).curve(x => x ** 3, 0, 6, C.blue).curve(x => Math.exp(x), 0, 6, C.crimson);
    B2.dot(4.5364, Math.exp(4.5364), false, C.ink);
    B2.label(5.55, 245, it('e') + sup(it('x')), { size: 14, color: C.crimson, weight: 'bold', dy: 14 }).label(5.72, 150, it('x') + sup('3'), { size: 14, color: C.blue, weight: 'bold' }).label(5.3, 18, 'ln ' + it('x'), { size: 14, color: C.green, weight: 'bold' });
    B2.label(4.5364, 93, 'passes near ' + it('x') + ' ≈ 4.54', { size: 12, anchor: 'end', dx: -8, dy: 8 });
    body.push(flush(B2));
    body.push(text(400, 362, 'Left: a finite limit at infinity gives a horizontal asymptote.   Right: ' + it('e') + sup(it('x')) + ' eventually beats any power of ' + it('x') + '; ln ' + it('x') + ' loses to every power.', { size: 13, anchor: 'middle', weight: 'bold' }));
  });

/* 1.16 The Intermediate Value Theorem. */
const ivtF = x => x + 2.2 * Math.sin(2.2 * (x - 1)) * (x - 1) * (5 - x) / 4;
make('ivt-continuous-vs-jump', 800, 380, 'The Intermediate Value Theorem: why continuity matters',
  'Left: a continuous function on the closed interval [1, 5] with f(1) = 1 and f(5) = 5. The dashed line y = 3 lies between 1 and 5, and the curve crosses it three times, at c₁, c₂ and c₃, all inside (1, 5): the theorem promises at least one. Right: a function with a jump at x = 3 that also has f(1) = 1 and f(5) = 5 but skips over y = 3, so no c gives f(c) = 3. Without continuity the conclusion can fail.',
  ({ body, panel }) => {
    body.push(caption(200, 26, 'Continuous on [1, 5]: at least one ' + it('c'), C.green, 14.5));
    body.push(caption(600, 26, 'A jump: the value 3 is skipped', C.verm, 14.5));
    const opt = x0 => ({ px: x0, py: 50, pw: 300, ph: 250, xr: [0, 6], yr: [0, 6], xStep: 1, yStep: 1 });
    const A = panel(opt(50));
    A.hline(3, C.blue, '7 5').vline(1, '#C9CFCC', '3 4').vline(5, '#C9CFCC', '3 4').curve(ivtF, 1, 5).dot(1, ivtF(1), false).dot(5, ivtF(5), false);
    // crossings of y = 3
    const cs = [];
    for (let i = 0; i < 4000; i++) { const a = 1 + 4 * i / 4000, b = 1 + 4 * (i + 1) / 4000; if ((ivtF(a) - 3) * (ivtF(b) - 3) < 0) cs.push((a + b) / 2); }
    cs.forEach((c, k) => { A.raw(line(A.sx(c), A.sy(3), A.sx(c), A.sy(0), C.green, 1.6, '3 3')); A.dot(c, 3, false, C.green); A.raw(text(A.sx(c), A.sy(0) - 8, it('c') + `<tspan baseline-shift="sub" font-size="10">${k + 1}</tspan>`, { size: 13, anchor: 'middle', color: C.green, weight: 'bold' })); });
    A.label(0.1, 3, it('y') + ' = 3', { dy: -6, size: 12.5, color: C.blue, weight: 'bold' });
    body.push(flush(A));
    const B2 = panel(opt(450));
    B2.hline(3, C.blue, '7 5').curve(x => 1 + 0.35 * (x - 1) ** 2, 1, 3).curve(x => 4 + 0.5 * (x - 3), 3, 5).dot(1, 1, false).dot(3, 2.4, true).dot(3, 4, false).dot(5, 5, false);
    B2.label(0.1, 3, it('y') + ' = 3', { dy: -6, size: 12.5, color: C.blue, weight: 'bold' });
    body.push(flush(B2));
    body.push(text(400, 360, 'Continuous on [' + it('a') + ', ' + it('b') + '] and ' + it('d') + ' between ' + it('f') + '(' + it('a') + ') and ' + it('f') + '(' + it('b') + ')  ⇒  ' + it('f') + '(' + it('c') + ') = ' + it('d') + ' for some ' + it('c') + ' in (' + it('a') + ', ' + it('b') + ').', { size: 14, anchor: 'middle', weight: 'bold' }));
  });

mkdirSync(OUT, { recursive: true });
for (const [id, s] of Object.entries(figs)) writeFileSync(join(OUT, `${id}.svg`), s);
console.log(`Wrote ${Object.keys(figs).length} figures to calculus/figures/.`);
