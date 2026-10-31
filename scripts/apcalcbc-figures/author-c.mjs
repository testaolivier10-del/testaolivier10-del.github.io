/* AP® Calculus BC figures, author C: polar (math-polar, 9.7-9.9) and the first
   series topics (math-sequences, 10.1-10.5).

   Every curve, sector, dot and bar is computed from the function it shows, so a
   picture can never drift from its caption. Standalone SVG: white background,
   role="img" with <title> and <desc>, Arial/Helvetica, ink #1F2A28, emerald
   #0A5A34 (the BC accent) for emphasis, Okabe-Ito blue #0072B2, vermillion
   #D55E00 and orange #E69F00 for further curves.

     node scripts/apcalcbc-figures/author-c.mjs            writes calculus-bc/figures/<id>.svg
     node scripts/apcalcbc-figures/author-c.mjs --out DIR   writes to DIR instead (preview)

   The metadata (alt text, size, licence) is in calculus-bc/data/figures/<topic>.json. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const args = process.argv.slice(2);
const OUT = args.includes('--out') ? args[args.indexOf('--out') + 1] : join(ROOT, 'calculus-bc', 'figures');

const INK = '#1F2A28', EMERALD = '#0A5A34', BLUE = '#0072B2', VERM = '#D55E00', ORANGE = '#B86E00', GRID = '#E3E6E5', MUTED = '#5B6664';
const FONT = 'Arial, Helvetica, sans-serif';
const PI = Math.PI;
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
      a.push(text(sx(ay) - 8, sy(v) + 4.5, (o.yTick || fmt)(v), { size: 13, anchor: 'end', color: MUTED, halo: true }));
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
function polygon(P, pts, o = {}) {
  return `<polygon points="${pts.map(([x, y]) => `${r2(P.sx(x))},${r2(P.sy(y))}`).join(' ')}" fill="${o.fill || 'none'}" fill-opacity="${o.opacity ?? 1}" stroke="${o.stroke || 'none'}" stroke-width="${o.width || 1.4}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
}
function seg(P, x1, y1, x2, y2, o = {}) {
  return `<line x1="${r2(P.sx(x1))}" y1="${r2(P.sy(y1))}" x2="${r2(P.sx(x2))}" y2="${r2(P.sy(y2))}" stroke="${o.color || INK}" stroke-width="${o.width || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} stroke-linecap="round"/>`;
}
function dot(P, x, y, o = {}) {
  return `<circle cx="${r2(P.sx(x))}" cy="${r2(P.sy(y))}" r="${o.r || 5}" fill="${o.open ? '#fff' : (o.color || EMERALD)}" stroke="${o.color || EMERALD}" stroke-width="2"/>`;
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

/* A polar frame: centre (cx, cy) in pixels, s pixels per unit, circles 1..R. */
function polar(o) {
  const { cx, cy, s, R } = o;
  const sx = x => cx + x * s, sy = y => cy - y * s;
  const out = [];
  const g = [];
  for (let k = 1; k <= R; k++) g.push(`<circle cx="${cx}" cy="${cy}" r="${r2(k * s)}" fill="none"/>`);
  for (let k = 0; k < 12; k++) {
    const t = k * PI / 6;
    g.push(`<line x1="${cx}" y1="${cy}" x2="${r2(cx + (R + 0.25) * s * Math.cos(t))}" y2="${r2(cy - (R + 0.25) * s * Math.sin(t))}"/>`);
  }
  out.push(`<g stroke="${GRID}" stroke-width="1">${g.join('')}</g>`);
  const axes = () => {
    const a = [];
    a.push(`<g stroke="${INK}" stroke-width="1.4"><line x1="${r2(cx - (R + 0.4) * s)}" y1="${cy}" x2="${r2(cx + (R + 0.4) * s)}" y2="${cy}"/><line x1="${cx}" y1="${r2(cy + (R + 0.4) * s)}" x2="${cx}" y2="${r2(cy - (R + 0.4) * s)}"/></g>`);
    if (o.ticks !== false) for (let k = 1; k <= R; k++) {
      if (o.tickEvery && k % o.tickEvery) continue;
      a.push(text(cx + k * s, cy + 16, String(k), { size: 12, anchor: 'middle', color: MUTED, halo: true }));
    }
    if (o.angles) {
      const lab = { 1: 'π/6', 2: 'π/3', 3: 'π/2', 4: '2π/3', 5: '5π/6', 6: 'π', 7: '7π/6', 8: '4π/3', 9: '3π/2', 10: '5π/3', 11: '11π/6' };
      for (const k of o.angles) {
        const t = k * PI / 6, rr = R + 0.62;
        a.push(text(cx + rr * s * Math.cos(t), cy - rr * s * Math.sin(t) + 5, lab[k], { size: 12.5, anchor: 'middle', color: MUTED, halo: true }));
      }
    }
    return a.join('');
  };
  const path = (rf, a, b, po = {}) => {
    const n = po.n || 600; let d = '';
    for (let i = 0; i <= n; i++) { const t = a + (b - a) * i / n, r = rf(t); d += `${i ? 'L' : 'M'}${r2(sx(r * Math.cos(t)))} ${r2(sy(r * Math.sin(t)))}`; }
    return `<path d="${d}${po.close ? 'Z' : ''}" fill="${po.fill || 'none'}" fill-opacity="${po.opacity ?? 1}" stroke="${po.color || EMERALD}" stroke-width="${po.width ?? 2.6}" stroke-linejoin="round"${po.dash ? ` stroke-dasharray="${po.dash}"` : ''}/>`;
  };
  /* The region swept by the radius from θ = a to b (between r = inner and r = outer). */
  const sector = (rf, a, b, po = {}) => {
    const n = po.n || 400, pts = [];
    const inner = po.inner || (() => 0);
    for (let i = 0; i <= n; i++) { const t = a + (b - a) * i / n, r = rf(t); pts.push([r * Math.cos(t), r * Math.sin(t)]); }
    for (let i = n; i >= 0; i--) { const t = a + (b - a) * i / n, r = inner(t); pts.push([r * Math.cos(t), r * Math.sin(t)]); }
    return `<polygon points="${pts.map(([x, y]) => `${r2(sx(x))},${r2(sy(y))}`).join(' ')}" fill="${po.fill || EMERALD}" fill-opacity="${po.opacity ?? 0.2}" stroke="${po.stroke || 'none'}" stroke-width="${po.width || 1.2}"/>`;
  };
  const pt = (x, y, po = {}) => `<circle cx="${r2(sx(x))}" cy="${r2(sy(y))}" r="${po.r || 5}" fill="${po.open ? '#fff' : (po.color || EMERALD)}" stroke="${po.color || EMERALD}" stroke-width="2"/>`;
  const line = (x1, y1, x2, y2, po = {}) => `<line x1="${r2(sx(x1))}" y1="${r2(sy(y1))}" x2="${r2(sx(x2))}" y2="${r2(sy(y2))}" stroke="${po.color || INK}" stroke-width="${po.width || 1.6}"${po.dash ? ` stroke-dasharray="${po.dash}"` : ''} stroke-linecap="round"/>`;
  return { sx, sy, out, axes, path, sector, pt, line };
}
/* An arc of radius rho pixels from angle a to b around (cx, cy). */
function arc(cx, cy, rho, a, b, o = {}) {
  const x1 = cx + rho * Math.cos(a), y1 = cy - rho * Math.sin(a), x2 = cx + rho * Math.cos(b), y2 = cy - rho * Math.sin(b);
  const large = Math.abs(b - a) > PI ? 1 : 0, sweep = b > a ? 0 : 1;
  return `<path d="M${r2(x1)} ${r2(y1)} A${rho} ${rho} 0 ${large} ${sweep} ${r2(x2)} ${r2(y2)}" fill="none" stroke="${o.color || INK}" stroke-width="${o.width || 1.6}"/>`;
}
function simpson(f, a, b, n = 2000) {
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return s * h / 3;
}
/* Check a number the caption or alt text states, so a figure cannot drift. */
function expect(name, got, want, tol = 1e-6) {
  if (Math.abs(got - want) > tol) throw new Error(`${name}: computed ${got}, stated ${want}`);
}

const figs = {};

/* ------------------------------------------------------------ math-polar */
{
  const id = 'math-polar-coords';
  const W = 760, H = 470;
  const Q = polar({ cx: 250, cy: 245, s: 48, R: 4, angles: [1, 2, 3, 4, 5, 7, 9, 11] });
  const b = [...Q.out, Q.axes()];
  const t = PI / 3, r = 3, x = r * Math.cos(t), y = r * Math.sin(t);
  b.push(Q.line(0, 0, x, y, { color: EMERALD, width: 3 }));
  b.push(Q.line(x, 0, x, y, { color: BLUE, dash: '6 5', width: 2 }));
  b.push(Q.line(0, 0, x, 0, { color: BLUE, width: 3.2 }));
  b.push(arc(250, 245, 34, 0, t, { color: EMERALD }));
  b.push(text(250 + 46, 245 - 20, 'θ = π/3', { size: 14, color: EMERALD, bold: true, halo: true }));
  b.push(Q.pt(x, y));
  b.push(text(Q.sx(x) + 10, Q.sy(y) - 8, 'P (r = 3, θ = π/3)', { size: 14.5, bold: true, color: EMERALD, halo: true }));
  b.push(text(Q.sx(x / 2) - 16, Q.sy(y / 2) - 6, 'r = 3', { size: 14, color: EMERALD, anchor: 'end', halo: true }));
  b.push(text(Q.sx(x / 2), 245 + 34, 'x = r cos θ = 1.5', { size: 13.5, color: BLUE, anchor: 'middle', halo: true }));
  b.push(text(Q.sx(x) + 8, Q.sy(y / 2) + 22, 'y = r sin θ ≈ 2.598', { size: 13.5, color: BLUE, halo: true }));
  // A negative r: (−2, π/4) is drawn on the opposite ray.
  const t2 = PI / 4, r2v = -2, x2 = r2v * Math.cos(t2), y2 = r2v * Math.sin(t2);
  b.push(Q.line(0, 0, 4.2 * Math.cos(t2), 4.2 * Math.sin(t2), { color: VERM, dash: '3 5', width: 1.6 }));
  b.push(Q.line(0, 0, x2, y2, { color: VERM, width: 2.6 }));
  b.push(Q.pt(x2, y2, { color: VERM }));
  b.push(text(Q.sx(x2) - 8, Q.sy(y2) + 22, 'Q (r = −2, θ = π/4)', { size: 14, color: VERM, anchor: 'middle', bold: true, halo: true }));
  // Side panel.
  const px = 520;
  const lines = [
    ['From polar to rectangular', true, INK],
    ['x = r cos θ,  y = r sin θ', false, BLUE],
    ['r² = x² + y²', false, BLUE],
    ['', false, INK],
    ['Point P', true, EMERALD],
    ['go 3 units along the ray θ = π/3', false, INK],
    ['x = 3 cos(π/3) = 1.5', false, INK],
    ['y = 3 sin(π/3) = 3√3/2', false, INK],
    ['', false, INK],
    ['Point Q: r is negative', true, VERM],
    ['face the ray θ = π/4, then walk', false, INK],
    ['2 units backward, through the pole', false, INK],
    ['x = −2 cos(π/4) = −√2', false, INK],
    ['y = −2 sin(π/4) = −√2', false, INK],
  ];
  lines.forEach(([s, bold, c], i) => b.push(text(px, 70 + i * 24, s, { size: bold ? 15.5 : 14.5, bold, color: c })));
  expect('P.y', y, 3 * Math.sqrt(3) / 2); expect('Q.x', x2, -Math.SQRT2);
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'A point in polar coordinates and its x and y',
    'A polar grid with circles of radius 1 to 4 and rays every π/6. Point P has r = 3 and θ = π/3: a segment of length 3 leaves the pole at angle π/3. Its horizontal leg is x = r cos θ = 1.5 and its vertical leg is y = r sin θ = 3√3/2, about 2.598. Point Q has r = −2 and θ = π/4: it lies 2 units from the pole on the ray opposite to θ = π/4, at x = −√2, y = −√2. A side panel lists x = r cos θ, y = r sin θ and r² = x² + y².', b) };
}
{
  const id = 'math-polar-families';
  const W = 780, H = 400;
  const b = [];
  const curves = [
    { f: t => 2 + 2 * Math.cos(t), name: 'Cardioid', eq: 'r = 2 + 2 cos θ', note: 'touches the pole once, at θ = π', cx: 130, R: 4, s: 26, shift: 0 },
    { f: t => 1 + 2 * Math.cos(t), name: 'Limaçon with an inner loop', eq: 'r = 1 + 2 cos θ', note: 'r < 0 for 2π/3 < θ < 4π/3: the loop', cx: 390, R: 3, s: 34, shift: 0 },
    { f: t => 3 * Math.sin(2 * t), name: 'Four-petal rose', eq: 'r = 3 sin(2θ)', note: 'one petal for every π/2 of θ', cx: 650, R: 3, s: 34, shift: 0 },
  ];
  for (const c of curves) {
    const Q = polar({ cx: c.cx + c.shift * c.s, cy: 222, s: c.s, R: c.R, ticks: true, tickEvery: c.R > 3 ? 2 : 1 });
    b.push(...Q.out, Q.axes());
    b.push(Q.path(c.f, 0, 2 * PI, { color: EMERALD }));
    b.push(text(c.cx + c.shift * c.s, 44, c.name, { anchor: 'middle', bold: true, size: 15 }));
    b.push(text(c.cx + c.shift * c.s, 66, c.eq, { anchor: 'middle', size: 15, color: EMERALD, bold: true }));
    b.push(text(c.cx + c.shift * c.s, 372, c.note, { anchor: 'middle', size: 13, color: MUTED }));
  }
  // The inner loop drawn in vermillion where r < 0.
  {
    const c = curves[1], Q = polar({ cx: c.cx + c.shift * c.s, cy: 222, s: c.s, R: c.R });
    b.push(Q.path(c.f, 2 * PI / 3, 4 * PI / 3, { color: VERM, width: 3 }));
  }
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Three polar curves: a cardioid, a limaçon with an inner loop and a rose',
    'Three polar graphs, each drawn from its equation. Left: the cardioid r = 2 + 2 cos θ, a heart shape that reaches 4 units right of the pole at θ = 0 and touches the pole once, at θ = π. Middle: the limaçon r = 1 + 2 cos θ, a large loop with a small inner loop, drawn in vermillion, traced while r is negative for 2π/3 < θ < 4π/3. Right: the rose r = 3 sin(2θ), four petals of length 3, one petal traced for each stretch of θ of length π/2.', b) };
}

/* ------------------------------------------------------- polar-derivatives */
{
  const id = 'polar-derivatives-tangents';
  const W = 760, H = 460;
  const f = t => 2 + 2 * Math.cos(t), fp = t => -2 * Math.sin(t);
  const Q = polar({ cx: 200, cy: 235, s: 46, R: 4, ticks: true, tickEvery: 1, angles: [2, 3] });
  const b = [...Q.out, Q.axes()];
  b.push(Q.path(f, 0, 2 * PI, { color: EMERALD }));
  // θ = π/2: point (0, 2), slope 1.
  const t1 = PI / 2, x1 = f(t1) * Math.cos(t1), y1 = f(t1) * Math.sin(t1);
  const dx1 = fp(t1) * Math.cos(t1) - f(t1) * Math.sin(t1), dy1 = fp(t1) * Math.sin(t1) + f(t1) * Math.cos(t1);
  expect('slope at π/2', dy1 / dx1, 1); expect('y at π/2', y1, 2);
  b.push(Q.line(x1 - 2.2, y1 - 2.2, x1 + 1.4, y1 + 1.4, { color: BLUE, width: 2.2 }));
  b.push(Q.pt(x1, y1, { color: BLUE }));
  b.push(text(Q.sx(x1) - 12, Q.sy(y1) - 10, 'θ = π/2: slope 1', { size: 14, color: BLUE, bold: true, anchor: 'end', halo: true }));
  // θ = π/3: horizontal tangent at (3/2, 3√3/2).
  const t2 = PI / 3, x2 = f(t2) * Math.cos(t2), y2 = f(t2) * Math.sin(t2);
  const dy2 = fp(t2) * Math.sin(t2) + f(t2) * Math.cos(t2);
  expect('dy/dθ at π/3', dy2, 0); expect('y at π/3', y2, 3 * Math.sqrt(3) / 2);
  b.push(Q.line(x2 - 1.6, y2, x2 + 1.6, y2, { color: VERM, width: 2.2 }));
  b.push(Q.pt(x2, y2, { color: VERM }));
  b.push(text(Q.sx(x2) + 8, Q.sy(y2) - 12, 'θ = π/3: horizontal tangent', { size: 14, color: VERM, bold: true, halo: true }));
  b.push(Q.line(0, 0, x2, y2, { color: VERM, dash: '4 4', width: 1.4 }));
  b.push(Q.line(0, 0, x1, y1, { color: BLUE, dash: '4 4', width: 1.4 }));
  b.push(text(Q.sx(4) - 4, Q.sy(0) - 10, 'r = 2 + 2 cos θ', { size: 15, color: EMERALD, bold: true, anchor: 'end', halo: true }));
  const px = 470;
  const L = [
    ['Treat θ as the parameter', true, INK],
    ['x = r cos θ,  y = r sin θ', false, INK],
    ['dy/dx = (dy/dθ) ÷ (dx/dθ)', false, EMERALD],
    ['', false, INK],
    ['At θ = π/2:  r = 2,  dr/dθ = −2', true, BLUE],
    ['dx/dθ = −2,  dy/dθ = −2', false, INK],
    ['dy/dx = 1, at the point (0, 2)', false, INK],
    ['dr/dθ < 0 with r > 0: the point', false, INK],
    ['is moving toward the pole', false, INK],
    ['', false, INK],
    ['At θ = π/3:  r = 3,  dr/dθ = −√3', true, VERM],
    ['dy/dθ = 0 and dx/dθ ≠ 0', false, INK],
    ['a horizontal tangent, the top', false, INK],
  ];
  L.forEach(([s, bold, c], i) => b.push(text(px, 64 + i * 25, s, { size: bold ? 15 : 14.5, bold, color: c })));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Tangent lines to the cardioid r = 2 + 2 cos θ',
    'The cardioid r = 2 + 2 cos θ on a polar grid. At θ = π/2 the point is (0, 2) and the tangent line, drawn in blue, has slope 1: there r = 2, dr/dθ = −2, dx/dθ = −2 and dy/dθ = −2, so dy/dx = 1; since dr/dθ is negative while r is positive, the point is moving toward the pole. At θ = π/3 the point is (3/2, 3√3/2), the top of the upper half, where the tangent, drawn in vermillion, is horizontal: dy/dθ = 0 and dx/dθ is not 0.', b) };
}

/* -------------------------------------------------------------- polar-area */
{
  const id = 'polar-area-sectors';
  const W = 780, H = 400;
  const f = t => 2 + 2 * Math.cos(t);
  const b = [];
  const S = 27, CY = 222, CX = [118, 378, 638];
  const head = (cx, a, c, d) => { b.push(text(cx + 0.9 * S, 36, a, { anchor: 'middle', bold: true, size: 15 })); b.push(text(cx + 0.9 * S, 58, c, { anchor: 'middle', size: 14.5, color: EMERALD, bold: true })); if (d) b.push(text(cx + 0.9 * S, 78, d, { anchor: 'middle', size: 14.5, color: EMERALD, bold: true })); };
  // Left: one thin sector at θ = π/4.
  const Q1 = polar({ cx: CX[0], cy: CY, s: S, R: 4, ticks: true, tickEvery: 2 });
  b.push(...Q1.out, Q1.axes());
  const a = PI / 4, d = PI / 14;
  b.push(Q1.sector(() => f(a + d / 2), a, a + d, { opacity: 0.4, stroke: EMERALD }));
  b.push(Q1.path(f, 0, 2 * PI, { color: EMERALD }));
  head(CX[0], 'One thin sector', 'area ≈ ½ r² Δθ');
  b.push(text(CX[0] + 0.9 * S, 375, 'nearly a slice of a circle of radius r', { anchor: 'middle', size: 13, color: MUTED }));
  // Middle: many sectors from 0 to π/2.
  const Q2 = polar({ cx: CX[1], cy: CY, s: S, R: 4, ticks: true, tickEvery: 2 });
  b.push(...Q2.out, Q2.axes());
  const n = 8;
  for (let i = 0; i < n; i++) { const lo = i * PI / 2 / n, hi = (i + 1) * PI / 2 / n; b.push(Q2.sector(() => f((lo + hi) / 2), lo, hi, { opacity: 0.25, stroke: EMERALD, width: 1 })); }
  b.push(Q2.path(f, 0, 2 * PI, { color: EMERALD }));
  head(CX[1], 'Add the sectors', 'Σ ½ r² Δθ, a Riemann sum');
  b.push(text(CX[1] + 0.9 * S, 375, '8 sectors from θ = 0 to θ = π/2', { anchor: 'middle', size: 13, color: MUTED }));
  // Right: the exact region.
  const Q3 = polar({ cx: CX[2], cy: CY, s: S, R: 4, ticks: true, tickEvery: 2 });
  b.push(...Q3.out, Q3.axes());
  b.push(Q3.sector(f, 0, PI / 2, { opacity: 0.3 }));
  b.push(Q3.path(f, 0, 2 * PI, { color: EMERALD }));
  const A = 0.5 * simpson(t => f(t) ** 2, 0, PI / 2);
  expect('swept area', A, (3 * PI + 8) / 2);
  head(CX[2], 'The limit: an integral', 'A = ½ ∫ r² dθ', 'with θ from 0 to π/2');
  b.push(text(CX[2] + 0.9 * S, 375, `A = (3π + 8)/2 ≈ ${A.toFixed(3)}`, { anchor: 'middle', size: 13.5, color: INK, bold: true }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Polar area from thin sectors: one half r squared d theta',
    'Three copies of the cardioid r = 2 + 2 cos θ. Left: one thin sector of angle Δθ at about θ = π/4, shaded; it is nearly a slice of a circle of radius r, with area about one half r squared times Δθ. Middle: eight such sectors fill the region swept from θ = 0 to θ = π/2; adding them is a Riemann sum. Right: the exact region swept from θ = 0 to θ = π/2 is shaded; its area is one half the integral of r squared from 0 to π/2, which is (3π + 8)/2, about 8.712.', b) };
}
{
  const id = 'polar-area-petal';
  const W = 520, H = 440;
  const f = t => 3 * Math.sin(2 * t);
  const Q = polar({ cx: 260, cy: 225, s: 54, R: 3, ticks: true, tickEvery: 1, angles: [1, 2, 3, 4, 5, 9] });
  const b = [...Q.out, Q.axes()];
  b.push(Q.sector(f, 0, PI / 2, { opacity: 0.3 }));
  b.push(Q.path(f, 0, 2 * PI, { color: EMERALD }));
  b.push(Q.pt(3 * Math.cos(PI / 4), 3 * Math.sin(PI / 4)));
  b.push(text(Q.sx(3 * Math.cos(PI / 4)) + 8, Q.sy(3 * Math.sin(PI / 4)) - 8, 'θ = π/4, r = 3', { size: 14, bold: true, color: EMERALD, halo: true }));
  b.push(text(Q.sx(-2.95), Q.sy(-2.95), 'r = 3 sin(2θ)', { size: 15, bold: true, color: EMERALD, halo: true }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'The rose r = 3 sin(2θ) with one petal shaded',
    'A polar grid with circles of radius 1, 2 and 3. The four-petal rose r = 3 sin(2θ) is drawn in emerald. The petal in the first quadrant, swept as θ runs from 0 to π/2, is shaded; it starts and ends at the pole, where r = 0, and reaches its tip, r = 3, at θ = π/4.', b) };
}

/* ------------------------------------------------------ polar-area-between */
{
  const id = 'polar-area-between-region';
  const W = 780, H = 440;
  const f = t => 2 + 2 * Math.cos(t), g = () => 3;
  const Q = polar({ cx: 230, cy: 225, s: 46, R: 4, ticks: true, tickEvery: 1, angles: [2, 10] });
  const b = [...Q.out, Q.axes()];
  b.push(Q.sector(f, -PI / 3, PI / 3, { inner: g, opacity: 0.3 }));
  b.push(Q.path(g, 0, 2 * PI, { color: BLUE }));
  b.push(Q.path(f, 0, 2 * PI, { color: EMERALD }));
  for (const t of [PI / 3, -PI / 3]) { b.push(Q.line(0, 0, 3 * Math.cos(t), 3 * Math.sin(t), { dash: '4 4', color: INK, width: 1.3 })); b.push(Q.pt(3 * Math.cos(t), 3 * Math.sin(t), { color: INK, r: 4.5 })); }
  b.push(text(Q.sx(1.5) + 8, Q.sy(2.6) - 8, '(3, π/3)', { size: 14, bold: true, halo: true }));
  b.push(text(Q.sx(1.5) - 10, Q.sy(-2.6) + 20, '(3, −π/3)', { size: 14, bold: true, anchor: 'end', halo: true }));
  b.push(text(Q.sx(-2.2), Q.sy(-3.3), 'r = 3', { size: 15, bold: true, color: BLUE, halo: true }));
  b.push(text(Q.sx(2.9), Q.sy(-2.75), 'r = 2 + 2 cos θ', { size: 15, bold: true, color: EMERALD, halo: true }));
  const A = 0.5 * simpson(t => f(t) ** 2 - 9, -PI / 3, PI / 3);
  expect('area between', A, (9 * Math.sqrt(3) - 2 * PI) / 2);
  const px = 480;
  const L = [
    ['Inside the cardioid, outside the circle', true, INK],
    ['', false, INK],
    ['1. Where do they meet?', true, INK],
    ['2 + 2 cos θ = 3, so cos θ = ½', false, INK],
    ['θ = −π/3 and θ = π/3', false, INK],
    ['', false, INK],
    ['2. Which is farther from the pole?', true, INK],
    ['on −π/3 < θ < π/3: the cardioid', false, EMERALD],
    ['', false, INK],
    ['3. Outer squared minus inner squared', true, INK],
    ['A = ½ ∫ [(2 + 2 cos θ)² − 3²] dθ', false, EMERALD],
    ['θ from −π/3 to π/3', false, EMERALD],
    [`A = (9√3 − 2π)/2 ≈ ${A.toFixed(3)}`, true, INK],
  ];
  L.forEach(([s, bold, c], i) => b.push(text(px, 60 + i * 25, s, { size: bold ? 15 : 14.5, bold, color: c })));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'The region inside r = 2 + 2 cos θ and outside r = 3',
    'The cardioid r = 2 + 2 cos θ in emerald and the circle r = 3 in blue on a polar grid. They meet at (3, π/3) and (3, −π/3), marked with dashed rays from the pole. The region inside the cardioid and outside the circle, a crescent on the right, is shaded. A side panel gives the steps: set 2 + 2 cos θ = 3 to get θ = ±π/3; on that interval the cardioid is the outer curve; the area is one half the integral from −π/3 to π/3 of (2 + 2 cos θ) squared minus 3 squared, which is (9√3 − 2π)/2, about 4.653.', b) };
}

{
  const id = 'polar-area-between-circles';
  const W = 560, H = 520;
  const f = t => 4 * Math.sin(t), g = () => 2;
  const Q = polar({ cx: 280, cy: 280, s: 54, R: 4, ticks: true, tickEvery: 1, angles: [1, 3, 5] });
  const b = [...Q.out, Q.axes()];
  b.push(Q.sector(f, PI / 6, 5 * PI / 6, { inner: g, opacity: 0.3 }));
  b.push(Q.path(g, 0, 2 * PI, { color: BLUE }));
  b.push(Q.path(f, 0, PI, { color: EMERALD }));
  for (const t of [PI / 6, 5 * PI / 6]) b.push(Q.pt(2 * Math.cos(t), 2 * Math.sin(t), { color: INK, r: 4.5 }));
  b.push(text(Q.sx(2.1), Q.sy(3.3), 'r = 4 sin θ', { size: 15, bold: true, color: EMERALD, halo: true }));
  b.push(text(Q.sx(1.45), Q.sy(-1.75), 'r = 2', { size: 15, bold: true, color: BLUE, halo: true }));
  const A = 0.5 * simpson(t => f(t) ** 2 - 4, PI / 6, 5 * PI / 6);
  expect('crescent', A, 4 * PI / 3 + 2 * Math.sqrt(3));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'The region inside r = 4 sin θ and outside r = 2',
    'On a polar grid with circles of radius 1 to 4: the circle r = 4 sin θ in emerald, of diameter 4, sitting on the pole and reaching up to (0, 4), and the circle r = 2 in blue, centered at the pole. They cross at two marked points, at θ = π/6 and θ = 5π/6. The region inside r = 4 sin θ and outside r = 2, a crescent above the blue circle, is shaded.', b) };
}

/* The polar FRQ (frq-u9-polar-area): r = 3 sin θ + cos(2θ), 0 ≤ θ ≤ π. */
{
  const id = 'polar-area-frq-region';
  const W = 560, H = 360;
  const f = t => 3 * Math.sin(t) + Math.cos(2 * t);
  const Q = polar({ cx: 280, cy: 290, s: 100, R: 2, ticks: true, tickEvery: 1, angles: [1, 2, 3, 4, 5] });
  const b = [...Q.out, Q.axes()];
  b.push(Q.sector(f, 0, PI, { opacity: 0.22 }));
  b.push(Q.path(f, 0, PI, { color: EMERALD }));
  b.push(Q.pt(1, 0, { r: 4.5 })); b.push(Q.pt(-1, 0, { r: 4.5 }));
  b.push(text(Q.sx(0), Q.sy(0.9), 'R', { size: 18, bold: true, anchor: 'middle', color: EMERALD }));
  b.push(text(Q.sx(0.25), Q.sy(-0.42), 'r = 3 sin θ + cos(2θ), 0 ≤ θ ≤ π', { size: 15, bold: true, color: EMERALD, halo: true }));
  expect('frq area', 0.5 * simpson(t => f(t) ** 2, 0, PI), (5 * PI - 4) / 2);
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'The polar curve r = 3 sin θ + cos(2θ) for θ from 0 to π, with region R shaded',
    'On a polar grid with circles of radius 1 and 2 and rays every π/6, the curve r = 3 sin θ + cos(2θ) is drawn for θ from 0 to π. It starts at (1, 0) on the positive x-axis, rises in a broad arch to a top a little above y = 2, and comes back down to (−1, 0) on the negative x-axis. The region R between the arch and the x-axis is shaded.', b) };
}

/* ---------------------------------------------------------- math-sequences */
{
  const id = 'math-sequences-limits';
  const W = 780, H = 400;
  const b = [];
  const P1 = panel({ left: 60, top: 96, width: 290, height: 230, x: [0, 12.5], y: [0, 1.6], xStep: 1, yStep: 0.25, xEvery: 2, yEvery: 0.5, xLabel: [{ t: 'n', i: true }], yLabel: [{ t: 'a', i: true }, { t: 'n', i: true, sub: true }] });
  b.push(...P1.out, P1.axes());
  b.push(seg(P1, 0, 1, 12.5, 1, { color: EMERALD, dash: '7 5', width: 1.8 }));
  for (let n = 1; n <= 12; n++) b.push(dot(P1, n, 1 + (-1) ** n / n, { r: 4.5 }));
  b.push(text(60, 34, 'aₙ = 1 + (−1)ⁿ/n', { bold: true, size: 15.5, color: EMERALD }));
  b.push(text(60, 54, 'converges: the limit is 1', { size: 14, color: MUTED }));
  const P2 = panel({ left: 450, top: 96, width: 290, height: 230, x: [0, 12.5], y: [-1.5, 1.5], xStep: 1, yStep: 0.5, xEvery: 2, yEvery: 1, xLabel: [{ t: 'n', i: true }], yLabel: [{ t: 'b', i: true }, { t: 'n', i: true, sub: true }] });
  b.push(...P2.out, P2.axes());
  for (let n = 1; n <= 12; n++) b.push(dot(P2, n, (-1) ** n * n / (n + 1), { r: 4.5, color: VERM }));
  b.push(text(450, 34, 'bₙ = (−1)ⁿ n/(n + 1)', { bold: true, size: 15.5, color: VERM }));
  b.push(text(450, 54, 'diverges: it jumps between near 1 and near −1', { size: 14, color: MUTED }));
  b.push(text(W / 2, 385, 'Each dot is one term: the sequence is a function of n = 1, 2, 3, ...', { anchor: 'middle', size: 13.5, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'A sequence that converges and one that diverges',
    'Two plots of terms against n for n = 1 to 12, one dot per term. Left: a sub n = 1 + (−1) to the n over n; the dots alternate above and below the dashed line at height 1 and close in on it, so the sequence converges to 1. Right: b sub n = (−1) to the n times n over (n + 1); the dots jump between values near 1 and near −1 and never settle, so the sequence diverges.', b) };
}

/* ------------------------------------------------------ series-convergence */
{
  const id = 'series-convergence-telescoping';
  const W = 760, H = 420;
  const b = [];
  const P = panel({ left: 70, top: 70, width: 620, height: 270, x: [0, 12.6], y: [0, 1.2], xStep: 1, yStep: 0.1, xEvery: 1, yEvery: 0.2, xLabel: [{ t: 'n', i: true }] });
  b.push(...P.out);
  let S = 0;
  for (let n = 1; n <= 12; n++) {
    const a = 1 / (n * (n + 1)); S += a;
    expect(`S_${n}`, S, n / (n + 1), 1e-12);
    b.push(polygon(P, [[n - 0.32, 0], [n - 0.32, a], [n + 0.0, a], [n + 0.0, 0]], { fill: BLUE, opacity: 0.55 }));
    b.push(dot(P, n + 0.16, S, { r: 4.8 }));
  }
  b.push(seg(P, 0, 1, 12.6, 1, { color: EMERALD, dash: '7 5', width: 1.8 }));
  b.push(P.axes());
  b.push(text(P.sx(12.5), P.sy(1) - 8, 'S = 1', { anchor: 'end', size: 15, bold: true, color: EMERALD, halo: true }));
  b.push(text(70, 30, 'Terms and partial sums of the sum of 1/(n(n + 1)) from n = 1', { bold: true, size: 15.5 }));
  b.push(`<rect x="72" y="44" width="14" height="12" fill="${BLUE}" fill-opacity="0.55"/>`);
  b.push(text(92, 55, 'term aₙ = 1/(n(n + 1))', { size: 14, color: BLUE }));
  b.push(`<circle cx="292" cy="50" r="5" fill="${EMERALD}"/>`);
  b.push(text(302, 55, 'partial sum Sₙ = n/(n + 1), the sum of the first n terms', { size: 14, color: EMERALD }));
  b.push(text(70, 385, 'The bars shrink toward 0 and the dots close in on 1: the series converges, and its sum is 1.', { size: 14, color: INK }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Terms and partial sums of a convergent series',
    'For the series with terms a sub n = 1 over n(n + 1), n = 1 to 12: blue bars show each term, starting at 1/2, then 1/6, 1/12 and shrinking toward 0; emerald dots show each partial sum S sub n = n/(n + 1): 1/2, 2/3, 3/4 and so on, rising toward the dashed line at height 1. The sequence of partial sums has limit 1, so the series converges and its sum is 1.', b) };
}

/* -------------------------------------------------------- geometric-series */
{
  const id = 'geometric-series-ratios';
  const W = 780, H = 400;
  const b = [];
  const cases = [
    { r: 0.5, name: 'r = 1/2', lim: 2, note: 'converges to 1/(1 − 1/2) = 2', y: [0, 3], yStep: 0.5, yEvery: 1, color: EMERALD },
    { r: -0.5, name: 'r = −1/2', lim: 2 / 3, note: 'converges to 1/(1 + 1/2) = 2/3', y: [0, 1.2], yStep: 0.2, yEvery: 0.4, color: BLUE },
    { r: 1.25, name: 'r = 5/4', lim: null, note: 'diverges: |r| ≥ 1', y: [0, 30], yStep: 5, yEvery: 10, color: VERM },
  ];
  cases.forEach((c, j) => {
    const left = 46 + j * 252;
    const P = panel({ left, top: 90, width: 200, height: 210, x: [-0.5, 10.5], y: c.y, xStep: 1, yStep: c.yStep, xEvery: 2, yEvery: c.yEvery, xLabel: [{ t: 'n', i: true }], yTick: v => String(+v.toFixed(2)) });
    b.push(...P.out, P.axes());
    if (c.lim !== null) b.push(seg(P, -0.5, c.lim, 10.5, c.lim, { color: c.color, dash: '6 5', width: 1.6 }));
    let S = 0;
    for (let n = 0; n <= 10; n++) { S += c.r ** n; if (S <= c.y[1]) b.push(dot(P, n, S, { r: 4, color: c.color })); }
    b.push(text(left, 38, `1 + r + r² + ⋯ with ${c.name}`, { bold: true, size: 14.5, color: c.color }));
    b.push(text(left, 60, c.note, { size: 13.5, color: MUTED }));
  });
  b.push(text(W / 2, 360, 'Each dot is a partial sum Sₙ = 1 + r + ⋯ + rⁿ. The dashed line is the sum a/(1 − r) when |r| < 1.', { anchor: 'middle', size: 13.5, color: INK }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Partial sums of three geometric series',
    'Partial sums S sub n = 1 + r + ... + r to the n for n = 0 to 10, one dot each, for three ratios. Left, r = 1/2: the partial sums 1, 1.5, 1.75, ... rise toward the dashed line at 2, the sum 1/(1 − 1/2). Middle, r = −1/2: the partial sums 1, 0.5, 0.75, 0.625, ... zigzag in toward 2/3, the sum 1/(1 + 1/2). Right, r = 5/4: the partial sums grow without bound, so the series diverges.', b) };
}

/* ----------------------------------------------------------- nth-term-test */
{
  const id = 'nth-term-test-two-cases';
  const W = 780, H = 420;
  const b = [];
  const panels = [
    { a: n => n / (2 * n + 1), name: 'aₙ = n/(2n + 1)', head: 'Terms approach 1/2, not 0', note: 'The series diverges by the nth term test.', y: [0, 8], yStep: 1, yEvery: 2, lim: 0.5 },
    { a: n => 1 / n, name: 'aₙ = 1/n', head: 'Terms approach 0', note: 'The nth term test is silent; the sums keep growing.', y: [0, 4], yStep: 0.5, yEvery: 1, lim: 0 },
  ];
  panels.forEach((c, j) => {
    const left = 64 + j * 380;
    const P = panel({ left, top: 96, width: 300, height: 230, x: [0, 15.6], y: c.y, xStep: 1, yStep: c.yStep, xEvery: 5, yEvery: c.yEvery, xLabel: [{ t: 'n', i: true }] });
    b.push(...P.out, P.axes());
    let S = 0;
    for (let n = 1; n <= 15; n++) {
      const a = c.a(n); S += a;
      b.push(polygon(P, [[n - 0.3, 0], [n - 0.3, a], [n + 0.3, a], [n + 0.3, 0]], { fill: BLUE, opacity: 0.55 }));
      b.push(dot(P, n, S, { r: 3.8, color: j ? VERM : VERM }));
    }
    b.push(text(left, 34, c.name, { bold: true, size: 15.5 }));
    b.push(text(left, 56, c.head, { size: 14.5, color: BLUE, bold: true }));
    b.push(text(left, 372, c.note, { size: 13.5, color: INK }));
  });
  b.push(`<rect x="64" y="394" width="14" height="12" fill="${BLUE}" fill-opacity="0.55"/>`);
  b.push(text(84, 405, 'term aₙ', { size: 13.5, color: BLUE }));
  b.push(`<circle cx="170" cy="400" r="4.5" fill="${VERM}"/>`);
  b.push(text(180, 405, 'partial sum Sₙ, the sum of the first n terms', { size: 13.5, color: VERM }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'What the nth term test can and cannot tell you',
    'Two plots for n = 1 to 15, with blue bars for the terms and vermillion dots for the partial sums. Left: a sub n = n/(2n + 1); the bars level off near 1/2, not 0, and the partial sums climb by about 1/2 each step, past 7 by n = 15: the series diverges by the nth term test. Right: a sub n = 1/n; the bars shrink toward 0, yet the partial sums keep growing, past 3.3 by n = 15; terms approaching 0 do not settle the question, so the nth term test says nothing.', b) };
}

/* ------------------------------------------------------------ integral-test */
{
  const id = 'integral-test-rectangles';
  const W = 780, H = 410;
  const b = [];
  // Left: right-endpoint boxes under 1/x² (the sum from n = 2 is less than the integral from 1).
  const P1 = panel({ left: 56, top: 90, width: 300, height: 230, x: [0, 7.5], y: [0, 1.15], xStep: 1, yStep: 0.25, xEvery: 1, yEvery: 0.5, xLabel: [{ t: 'x', i: true }] });
  b.push(...P1.out);
  for (let n = 2; n <= 7; n++) b.push(polygon(P1, [[n - 1, 0], [n - 1, 1 / n ** 2], [n, 1 / n ** 2], [n, 0]], { fill: BLUE, opacity: 0.35, stroke: BLUE, width: 1.2 }));
  b.push(P1.axes());
  b.push(curve(P1, x => 1 / x ** 2, 0.93, 7.5, { color: EMERALD }));
  b.push(text(P1.sx(1.25), P1.sy(1.02), 'f(x) = 1/x²', { size: 14.5, bold: true, color: EMERALD, halo: true }));
  b.push(text(56, 34, 'Boxes under the curve', { bold: true, size: 15.5 }));
  b.push(text(56, 56, 'box n has height aₙ = 1/n², from x = n − 1 to n', { size: 13.5, color: MUTED }));
  b.push(text(56, 374, '1/2² + 1/3² + ⋯ < ∫ from 1 to ∞ of dx/x² = 1', { size: 14, bold: true, color: INK }));
  b.push(text(56, 396, 'a finite integral holds the sum down: converges', { size: 13.5, color: EMERALD }));
  // Right: left-endpoint boxes over 1/x (the sum is more than the integral).
  const P2 = panel({ left: 440, top: 90, width: 300, height: 230, x: [0, 7.5], y: [0, 1.15], xStep: 1, yStep: 0.25, xEvery: 1, yEvery: 0.5, xLabel: [{ t: 'x', i: true }] });
  b.push(...P2.out);
  for (let n = 1; n <= 6; n++) b.push(polygon(P2, [[n, 0], [n, 1 / n], [n + 1, 1 / n], [n + 1, 0]], { fill: VERM, opacity: 0.25, stroke: VERM, width: 1.2 }));
  b.push(P2.axes());
  b.push(curve(P2, x => 1 / x, 0.88, 7.5, { color: EMERALD }));
  b.push(text(P2.sx(1.25), P2.sy(1.08), 'f(x) = 1/x', { size: 14.5, bold: true, color: EMERALD, halo: true }));
  b.push(text(440, 34, 'Boxes over the curve', { bold: true, size: 15.5 }));
  b.push(text(440, 56, 'box n has height aₙ = 1/n, from x = n to n + 1', { size: 13.5, color: MUTED }));
  b.push(text(440, 374, '1 + 1/2 + ⋯ + 1/N > ∫ from 1 to N + 1 of dx/x', { size: 14, bold: true, color: INK }));
  b.push(text(440, 396, 'the integral grows without bound: diverges', { size: 13.5, color: VERM }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'The integral test: boxes under and over the curve',
    'Left: the curve f(x) = 1/x² with boxes of width 1 drawn under it; box n spans x = n − 1 to n and has height 1/n², for n = 2 to 7. The boxes fit under the curve from x = 1 on, so 1/2² + 1/3² + ... is less than the integral from 1 to infinity of 1/x², which is 1: the sum stays finite and the series converges. Right: the curve f(x) = 1/x with boxes of height 1/n from x = n to n + 1, for n = 1 to 6, sticking out above the curve, so 1 + 1/2 + ... + 1/N is more than the integral from 1 to N + 1 of 1/x, which is ln(N + 1) and grows without bound: the series diverges.', b) };
}

/* ---------------------------------------------------------------- p-series */
{
  const id = 'p-series-partial-sums';
  const W = 760, H = 430;
  const b = [];
  const P = panel({ left: 70, top: 84, width: 470, height: 270, x: [0, 41], y: [0, 10], xStep: 5, yStep: 1, xEvery: 10, yEvery: 2, xLabel: [{ t: 'n', i: true }], yLabel: [{ t: 'S', i: true }, { t: 'n', i: true, sub: true }] });
  b.push(...P.out, P.axes());
  const ps = [{ p: 0.5, c: VERM, lab: 'p = 1/2: diverges' }, { p: 1, c: BLUE, lab: 'p = 1: diverges (slowly)' }, { p: 2, c: EMERALD, lab: 'p = 2: converges' }];
  const ends = {};
  for (const s of ps) {
    let S = 0; const pts = [];
    for (let n = 1; n <= 40; n++) { S += 1 / n ** s.p; pts.push([n, S]); }
    ends[s.p] = S;
    for (const [n, v] of pts) if (v <= 10) b.push(`<circle cx="${r2(P.sx(n))}" cy="${r2(P.sy(v))}" r="3.2" fill="${s.c}"/>`);
  }
  b.push(seg(P, 0, PI * PI / 6, 41, PI * PI / 6, { color: EMERALD, dash: '6 5', width: 1.4 }));
  b.push(text(P.sx(41), P.sy(PI * PI / 6) - 7, 'π²/6 ≈ 1.645', { size: 13, anchor: 'end', color: EMERALD, halo: true }));
  ps.forEach((s, i) => { b.push(`<circle cx="572" cy="${120 + i * 30}" r="5" fill="${s.c}"/>`); b.push(text(584, 125 + i * 30, s.lab, { size: 13.5, color: s.c, bold: true })); });
  b.push(text(70, 30, 'Partial sums of 1/1ᵖ + 1/2ᵖ + ⋯ + 1/nᵖ', { bold: true, size: 15.5 }));
  b.push(text(70, 52, 'The series converges exactly when p > 1.', { size: 14, color: MUTED }));
  b.push(text(70, 404, `By n = 40: p = 1/2 has reached ${ends[0.5].toFixed(2)}, p = 1 has reached ${ends[1].toFixed(2)}, p = 2 sits at ${ends[2].toFixed(3)}.`, { size: 13.5 }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Partial sums of three p-series',
    `Partial sums of the sum of 1 over n to the p, for n = 1 to 40 and three values of p, one dot per partial sum. p = 1/2, vermillion: the sums climb steeply, ${ends[0.5].toFixed(2)} by n = 40, and grow without bound. p = 1, the harmonic series, blue: the sums climb slowly, ${ends[1].toFixed(2)} by n = 40, but still grow without bound. p = 2, emerald: the sums level off under the dashed line at π²/6, about 1.645. The series converges exactly when p is greater than 1.`, b) };
}

mkdirSync(OUT, { recursive: true });
for (const [id, f] of Object.entries(figs)) writeFileSync(join(OUT, `${id}.svg`), f.svg);
if (args.includes('--meta')) console.log(JSON.stringify(Object.fromEntries(Object.entries(figs).map(([id, f]) => [id, { w: f.w, h: f.h }]))));
console.log(`Author C figures: ${Object.keys(figs).length} written to ${OUT}`);
