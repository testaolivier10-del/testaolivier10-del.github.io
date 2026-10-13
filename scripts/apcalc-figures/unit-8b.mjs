/* Figures for AP® Calculus AB Unit 8, topics 8.4-8.12 (area between curves,
   volumes with cross sections, discs and washers). Run:
     node scripts/apcalc-figures/unit-8b.mjs
   Writes calculus/figures/<id>.svg. Every figure is a standalone SVG with a
   white background, role="img", <title> and <desc>, Arial/Helvetica, ink
   #1F2A28, course crimson #8C1036 for emphasis and Okabe-Ito blue #0072B2,
   green #009E73 and vermillion #D55E00 for a second curve or slice.

   2D panels sample the functions the captions name. The solids are real 3D
   meshes (the surface of revolution, or the cross sections standing on the
   base) projected with a perspective camera and drawn back to front: the far
   wall of a solid opaque, the highlighted slice opaque, the near wall
   translucent, so the slice reads as inside the solid. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'calculus', 'figures');
const C = {
  ink: '#1F2A28', crimson: '#8C1036', blue: '#0072B2', green: '#009E73', verm: '#D55E00', grey: '#5A6268',
  grid: '#E4E8E6', pale: '#F7D9E2', paleBlue: '#D6E9F5', paleGreen: '#D4EEE6', paleVerm: '#F9E0CF', base: '#F3E6EA'
};
const r1 = v => Math.round(v * 10) / 10;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const FONT = 'Arial, Helvetica, sans-serif';

/* ---------------------------------------------------------------- 2D kit */
function text(x, y, s, o = {}) {
  const a = [`x="${r1(x)}"`, `y="${r1(y)}"`, `font-size="${o.size || 14}"`, `fill="${o.color || C.ink}"`];
  if (o.anchor) a.push(`text-anchor="${o.anchor}"`);
  if (o.weight) a.push(`font-weight="${o.weight}"`);
  if (o.halo !== false) a.push('stroke="#FFFFFF" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"');
  if (o.italic) a.push('font-style="italic"');
  return `<text ${a.join(' ')}>${s}</text>`;
}
const it = s => `<tspan font-style="italic">${s}</tspan>`;
const sup = s => `<tspan baseline-shift="super" font-size="70%">${s}</tspan>`;
function line(x1, y1, x2, y2, color = C.ink, w = 2, dash) {
  return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${color}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linecap="round"/>`;
}
function head(x, y, ang, color, size = 9) {
  const a1 = ang + Math.PI * 0.84, a2 = ang - Math.PI * 0.84;
  return `<polygon points="${r1(x)},${r1(y)} ${r1(x + size * Math.cos(a1))},${r1(y + size * Math.sin(a1))} ${r1(x + size * Math.cos(a2))},${r1(y + size * Math.sin(a2))}" fill="${color}"/>`;
}
function arrow(x1, y1, x2, y2, color = C.ink, w = 2, size = 9) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  return line(x1, y1, x2 - size * 0.6 * Math.cos(a), y2 - size * 0.6 * Math.sin(a), color, w) + head(x2, y2, a, color, size);
}
function darrow(x1, y1, x2, y2, color = C.ink, w = 1.8, size = 8) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  return line(x1 + size * 0.6 * Math.cos(a), y1 + size * 0.6 * Math.sin(a), x2 - size * 0.6 * Math.cos(a), y2 - size * 0.6 * Math.sin(a), color, w) + head(x2, y2, a, color, size) + head(x1, y1, a + Math.PI, color, size);
}
const poly = (pts, o = {}) => `<polygon points="${pts.map(p => `${r1(p[0])},${r1(p[1])}`).join(' ')}" fill="${o.fill || 'none'}"${o.opacity != null ? ` fill-opacity="${o.opacity}"` : ''} stroke="${o.stroke || 'none'}" stroke-width="${o.w ?? 1}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} stroke-linejoin="round"/>`;
const pathOf = pts => pts.map((p, i) => `${i ? 'L' : 'M'}${r1(p[0])} ${r1(p[1])}`).join('');
function box(x, y, w, h, o = {}) { return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${o.rx ?? 8}" fill="${o.fill || '#FFFFFF'}" stroke="${o.stroke || C.grid}" stroke-width="${o.width ?? 1.4}"/>`; }
const fmt = v => String(+v.toPrecision(6)).replace('-', '−');

/* A graph panel: plotting box (px, py, pw, ph), data ranges xr, yr. */
function panel(o) {
  const { px, py, pw, ph, xr, yr } = o;
  const sx = x => px + (x - xr[0]) / (xr[1] - xr[0]) * pw;
  const sy = y => py + (yr[1] - y) / (yr[1] - yr[0]) * ph;
  const under = [], out = [], top = [];
  const ticks = (r, st) => { const v = []; for (let t = Math.ceil(r[0] / st - 1e-9) * st; t <= r[1] + 1e-9; t += st) v.push(+t.toPrecision(10)); return v; };
  const xs = ticks(xr, o.xStep || 1), ys = ticks(yr, o.yStep || 1);
  for (const v of xs) under.push(line(sx(v), py, sx(v), py + ph, C.grid, 1));
  for (const v of ys) under.push(line(px, sy(v), px + pw, sy(v), C.grid, 1));
  const ax = yr[0] <= 0 && yr[1] >= 0 ? sy(0) : py + ph, ay = xr[0] <= 0 && xr[1] >= 0 ? sx(0) : px;
  const axes = [line(px, ax, px + pw + 6, ax, C.ink, 1.5) + head(px + pw + 12, ax, 0, C.ink, 8),
    line(ay, py + ph, ay, py - 6, C.ink, 1.5) + head(ay, py - 12, -Math.PI / 2, C.ink, 8)];
  const skipX = new Set(o.skipX || []), skipY = new Set(o.skipY || []);
  for (const v of xs) { if (Math.abs(v) < 1e-9 && ay !== px) continue; axes.push(line(sx(v), ax - 3, sx(v), ax + 3, C.ink, 1.2)); if (!skipX.has(v)) top.push(text(sx(v), ax + 16, fmt(v), { size: 11.5, anchor: 'middle', color: C.grey })); }
  for (const v of ys) { if (Math.abs(v) < 1e-9 && ax !== py + ph) continue; axes.push(line(ay - 3, sy(v), ay + 3, sy(v), C.ink, 1.2)); if (!skipY.has(v)) top.push(text(ay - 6, sy(v) + 4, fmt(v), { size: 11.5, anchor: 'end', color: C.grey })); }
  top.push(text(px + pw + 16, ax + 5, it(o.xLabel || 'x'), { size: 15, anchor: 'start' }));
  top.push(text(ay + 7, py - 8, it(o.yLabel || 'y'), { size: 15, anchor: 'start' }));
  const P = {
    sx, sy, under, out, top,
    samples(f, a, b, n = 240) { const pts = []; for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; pts.push([x, f(x)]); } return pts; },
    /* y = f(x) for x in [a, b] */
    curve(f, a, b, color = C.crimson, w = 2.8, dash) {
      out.push(`<path d="${pathOf(P.samples(f, a, b).map(([x, y]) => [sx(x), sy(y)]))}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`);
      return P;
    },
    /* x = g(y) for y in [c, d] */
    curveY(g, c, d, color = C.crimson, w = 2.8) {
      out.push(`<path d="${pathOf(P.samples(g, c, d).map(([y, x]) => [sx(x), sy(y)]))}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`);
      return P;
    },
    /* region between y = f(x) (top) and y = g(x) (bottom) */
    shade(f, g, a, b, fill = C.pale, opacity = 1) {
      const top_ = P.samples(f, a, b).map(([x, y]) => [sx(x), sy(y)]), bot = P.samples(g, a, b).map(([x, y]) => [sx(x), sy(y)]).reverse();
      under.push(poly(top_.concat(bot), { fill, opacity }));
      return P;
    },
    /* region between x = r(y) (right) and x = l(y) (left) */
    shadeY(r, l, c, d, fill = C.pale) {
      const R = P.samples(r, c, d).map(([y, x]) => [sx(x), sy(y)]), Lf = P.samples(l, c, d).map(([y, x]) => [sx(x), sy(y)]).reverse();
      under.push(poly(R.concat(Lf), { fill }));
      return P;
    },
    rect(x0, x1, y0, y1, color = C.blue, fill = C.paleBlue) {
      out.push(`<rect x="${r1(sx(x0))}" y="${r1(sy(y1))}" width="${r1(sx(x1) - sx(x0))}" height="${r1(sy(y0) - sy(y1))}" fill="${fill}" fill-opacity="0.92" stroke="${color}" stroke-width="2"/>`);
      return P;
    },
    dot(x, y, color = C.ink, open = false) { out.push(`<circle cx="${r1(sx(x))}" cy="${r1(sy(y))}" r="4.5" fill="${open ? '#FFFFFF' : color}" stroke="${color}" stroke-width="2"/>`); return P; },
    hline(y, color = C.grey, dash = '7 5', a = xr[0], b = xr[1], w = 1.8) { out.push(line(sx(a), sy(y), sx(b), sy(y), color, w, dash)); return P; },
    vline(x, color = C.grey, dash = '7 5', c = yr[0], d = yr[1], w = 1.8) { out.push(line(sx(x), sy(c), sx(x), sy(d), color, w, dash)); return P; },
    label(x, y, s, o = {}) { top.push(text(sx(x), sy(y), s, o)); return P; },
    svg() { return under.join('') + axes.join('') + out.join('') + top.join(''); }
  };
  return P;
}

/* ---------------------------------------------------------------- 3D kit */
/* A perspective camera: az turns the scene about the vertical (z) axis, el
   tilts the view down, F is the camera distance (in world units), scale and
   (cx, cy) place the picture. World: x right, y away from the viewer, z up. */
function camera({ az, el, F = 30, scale, cx, cy }) {
  const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
  const rot = ([x, y, z]) => { const x1 = x * ca - y * sa, y1 = x * sa + y * ca; return [x1, y1 * ce - z * se, y1 * se + z * ce]; };
  const P = p => { const [x, d, u] = rot(p), s = F / (F + d); return [cx + scale * s * x, cy - scale * s * u, d]; };
  return { rot, P, F };
}
/* A camera scaled and centered so the world points pts fill the box [x0, y0, x1, y1]. */
function fitCamera(o, pts, fit) {
  const c1 = camera({ ...o, scale: 1, cx: 0, cy: 0 });
  let bx = [Infinity, Infinity, -Infinity, -Infinity];
  for (const p of pts) { const q = c1.P(p); bx = [Math.min(bx[0], q[0]), Math.min(bx[1], q[1]), Math.max(bx[2], q[0]), Math.max(bx[3], q[1])]; }
  const sc = Math.min((fit[2] - fit[0]) / (bx[2] - bx[0]), (fit[3] - fit[1]) / (bx[3] - bx[1]));
  return camera({ ...o, scale: sc, cx: (fit[0] + fit[2]) / 2 - sc * (bx[0] + bx[2]) / 2, cy: (fit[1] + fit[3]) / 2 - sc * (bx[1] + bx[3]) / 2 });
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = a => { const n = Math.hypot(...a) || 1; return [a[0] / n, a[1] / n, a[2] / n]; };
const LIGHT = norm([-0.45, -0.7, 0.75]);
function mix(c1, c2, t) {
  const h = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const a = h(c1), b = h(c2);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
/* A face: world points (in order), a fill palette [dark, light]; returns
   { pts2, depth, facing, fill }. Shading is Lambert with a soft floor. */
function face(cam, pts, pal, o = {}) {
  const p2 = pts.map(cam.P), depth = p2.reduce((s, p) => s + p[2], 0) / p2.length;
  let n = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
  if (o.flip) n = n.map(v => -v);
  const cen = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length, s[2] + p[2] / pts.length], [0, 0, 0]);
  const cc = cam.rot(cen), nc = cam.rot(n);
  const facing = dot3(nc, [cc[0], cc[1] + cam.F, cc[2]]) < 0;
  const lam = Math.abs(dot3(n, LIGHT));
  return { pts2: p2, depth, facing, fill: mix(pal[0], pal[1], 0.25 + 0.75 * lam) };
}
const drawFaces = (faces, o = {}) => faces.sort((a, b) => b.depth - a.depth)
  .map(f => poly(f.pts2, { fill: f.fill, stroke: o.edge ? o.edge : f.fill, w: o.edge ? o.ew || 0.6 : 0.7 })).join('');

/* A solid of revolution about a horizontal line z = k (along x): outer
   radius R(x), inner radius r(x) (or none), x in [a, b]. Returns faces. */
function revolve(cam, { R, r, a, b, k = 0, n = 64, m = 48, pal }) {
  const P = (x, rad, t) => [x, rad * Math.sin(t), k + rad * Math.cos(t)];
  const faces = [];
  for (let i = 0; i < n; i++) {
    const x0 = a + (b - a) * i / n, x1 = a + (b - a) * (i + 1) / n;
    for (let j = 0; j < m; j++) {
      const t0 = 2 * Math.PI * j / m, t1 = 2 * Math.PI * (j + 1) / m;
      faces.push(face(cam, [P(x0, R(x0), t0), P(x1, R(x1), t0), P(x1, R(x1), t1), P(x0, R(x0), t1)], pal, { flip: true }));
      if (r) faces.push(face(cam, [P(x0, r(x0), t0), P(x1, r(x1), t0), P(x1, r(x1), t1), P(x0, r(x0), t1)], pal));
    }
  }
  for (const [x, s] of [[a, 1], [b, -1]]) {
    if (R(x) < 1e-6) continue;
    for (let j = 0; j < m; j++) {
      const t0 = 2 * Math.PI * j / m, t1 = 2 * Math.PI * (j + 1) / m, ri = r ? r(x) : 0;
      faces.push(face(cam, [P(x, ri, t0), P(x, R(x), t0), P(x, R(x), t1), P(x, ri, t1)], pal, { flip: s < 0 }));
    }
  }
  return faces;
}
/* One disc or washer slab at x0 of thickness dx: its faces. */
function slab(cam, { x0, dx, R, r = 0, k = 0, m = 72, pal }) {
  return revolve(cam, { R: () => R, r: r ? () => r : null, a: x0, b: x0 + dx, k, n: 1, m, pal });
}
function ring(cam, x, rad, k, n = 96) {
  const pts = []; for (let i = 0; i <= n; i++) { const t = 2 * Math.PI * i / n; pts.push(cam.P([x, rad * Math.sin(t), k + rad * Math.cos(t)])); }
  return pts;
}
const pline = (pts, color, w = 1.6, dash) => `<path d="${pathOf(pts)}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
/* The outline of a convex solid of revolution: the convex hull of its rings
   on screen. */
function hullOutline(cam, f, a, b, k) {
  const pts = [];
  for (let i = 0; i <= 120; i++) { const x = a + (b - a) * i / 120; for (const q of ring(cam, x, f(x), k, 120)) pts.push([q[0], q[1]]); }
  pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const cr = (o, a2, b2) => (a2[0] - o[0]) * (b2[1] - o[1]) - (a2[1] - o[1]) * (b2[0] - o[0]);
  const lower = [], upper = [];
  for (const p of pts) { while (lower.length >= 2 && cr(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (upper.length >= 2 && cr(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  return `<path d="${pathOf(hull)}Z" fill="none" stroke="${C.crimson}" stroke-width="1.9" stroke-linejoin="round"/>`;
}
/* An axis line in 3D (dashed through the solid). */
function axis3(cam, p, q, color = C.ink, w = 1.6, dash = '8 5') { const a = cam.P(p), b = cam.P(q); return line(a[0], a[1], b[0], b[1], color, w, dash); }

/* ---------------------------------------------------------------- output */
function svgDoc(W, H, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d" font-family="${FONT}"><title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc><rect width="${W}" height="${H}" fill="#FFFFFF"/>${body}</svg>\n`;
}
export const FIGS = {};

/* ------------------------------------------------ 8.4 area, functions of x */
FIGS['area-between-x-strip'] = () => {
  const W = 760, H = 440;
  const f = x => 6 - x * x, g = x => x;
  const P = panel({ px: 60, py: 50, pw: 380, ph: 340, xr: [-3.6, 2.8], yr: [-4, 7], xStep: 1, yStep: 1 });
  P.shade(f, g, -3, 2, C.pale);
  const x0 = 0.35, dx = 0.3;
  P.rect(x0, x0 + dx, g(x0 + dx / 2), f(x0 + dx / 2));
  P.curve(f, -Math.sqrt(10), 2.75, C.crimson).curve(g, -3.6, 2.8, C.blue);
  P.dot(-3, -3).dot(2, 2);
  P.label(-2.85, -3.65, '(−3, −3)', { anchor: 'start', size: 13 }).label(2.12, 1.45, '(2, 2)', { anchor: 'start', size: 13 });
  P.label(-1.55, 4.9, `top: ${it('y')} = 6 − ${it('x')}${sup('2')}`, { anchor: 'end', size: 14, color: C.crimson, weight: 'bold' });
  P.label(-1.3, -2.5, `bottom: ${it('y')} = ${it('x')}`, { anchor: 'start', size: 14, color: C.blue, weight: 'bold' });
  // height and width call-outs
  const xr = P.sx(x0 + dx) + 8;
  let s = P.svg();
  s += darrow(xr + 6, P.sy(f(x0 + dx / 2)), xr + 6, P.sy(g(x0 + dx / 2)), C.ink, 1.6);
  s += line(P.sx(x0), P.sy(-0.9), P.sx(x0 + dx), P.sy(-0.9), C.ink, 1.4) + line(P.sx(x0), P.sy(-0.75), P.sx(x0), P.sy(-1.05), C.ink, 1.2) + line(P.sx(x0 + dx), P.sy(-0.75), P.sx(x0 + dx), P.sy(-1.05), C.ink, 1.2);
  s += text(P.sx(x0 + dx / 2), P.sy(-1.55), `width Δ${it('x')}`, { anchor: 'middle', size: 13 });
  // side panel
  const bx = 470;
  s += box(bx, 60, 270, 320, { fill: '#FFFFFF', stroke: C.grid });
  s += text(bx + 16, 90, 'One thin rectangle', { size: 16, weight: 'bold' });
  s += text(bx + 16, 118, `height = top − bottom`, { size: 14 });
  s += text(bx + 16, 140, `= (6 − ${it('x')}${sup('2')}) − ${it('x')}`, { size: 14, color: C.crimson });
  s += text(bx + 16, 168, `area ≈ [(6 − ${it('x')}${sup('2')}) − ${it('x')}] Δ${it('x')}`, { size: 14 });
  s += text(bx + 16, 204, 'Add them up from the left', { size: 14, weight: 'bold' });
  s += text(bx + 16, 224, 'crossing to the right one:', { size: 14, weight: 'bold' });
  s += text(bx + 16, 254, `6 − ${it('x')}${sup('2')} = ${it('x')}  gives  ${it('x')} = −3, 2`, { size: 14 });
  s += text(bx + 16, 290, `A = ∫ from −3 to 2 of`, { size: 14 });
  s += text(bx + 16, 312, `[(6 − ${it('x')}${sup('2')}) − ${it('x')}] d${it('x')}`, { size: 14, color: C.crimson });
  s += text(bx + 16, 346, `= 125/6 ≈ 20.83`, { size: 16, weight: 'bold' });
  return svgDoc(W, H, 'Area between y = 6 − x² and y = x with one vertical rectangle',
    'The region between the parabola y = 6 − x² (crimson, on top) and the line y = x (blue, on the bottom) is shaded from x = −3 to x = 2, where the curves cross at (−3, −3) and (2, 2). One thin vertical rectangle of width Δx stands in the region; its height is top minus bottom, (6 − x²) − x. A side panel builds the area: solve 6 − x² = x for the limits −3 and 2, then A = the integral from −3 to 2 of [(6 − x²) − x] dx = 125/6, about 20.83.', s);
};

/* ------------------------------------------------ 8.5 area, functions of y */
FIGS['area-between-y-strip'] = () => {
  const W = 760, H = 440;
  const right = y => y + 2, left = y => y * y;
  const P = panel({ px: 60, py: 50, pw: 380, ph: 340, xr: [-1, 5], yr: [-2.2, 3], xStep: 1, yStep: 1 });
  P.shadeY(right, left, -1, 2, C.pale);
  const y0 = 0.45, dy = 0.22;
  P.rect(left(y0 + dy / 2), right(y0 + dy / 2), y0, y0 + dy);
  P.curveY(left, -2.0, 2.2, C.crimson).curveY(right, -2.2, 2.75, C.blue);
  P.dot(1, -1).dot(4, 2);
  P.label(1.12, -1.55, '(1, −1)', { anchor: 'start', size: 13 }).label(4.05, 2.32, '(4, 2)', { anchor: 'start', size: 13 });
  P.label(0.2, 2.6, `left: ${it('x')} = ${it('y')}${sup('2')}`, { anchor: 'start', size: 14, color: C.crimson, weight: 'bold' });
  P.label(2.15, -0.7, `right: ${it('x')} = ${it('y')} + 2`, { anchor: 'start', size: 14, color: C.blue, weight: 'bold' });
  let s = P.svg();
  const yy = P.sy(y0) + 12;
  s += darrow(P.sx(left(y0 + dy / 2)), yy, P.sx(right(y0 + dy / 2)), yy, C.ink, 1.6);
  s += text((P.sx(left(y0 + dy / 2)) + P.sx(right(y0 + dy / 2))) / 2, yy + 18, 'right − left', { anchor: 'middle', size: 13 });
  s += text(P.sx(right(y0 + dy / 2)) + 10, P.sy(y0 + dy / 2) + 5, `thickness Δ${it('y')}`, { anchor: 'start', size: 13 });
  const bx = 470;
  s += box(bx, 60, 270, 320, { fill: '#FFFFFF', stroke: C.grid });
  s += text(bx + 16, 90, 'Slice sideways', { size: 16, weight: 'bold' });
  s += text(bx + 16, 118, `length = right − left`, { size: 14 });
  s += text(bx + 16, 140, `= (${it('y')} + 2) − ${it('y')}${sup('2')}`, { size: 14, color: C.crimson });
  s += text(bx + 16, 168, `area ≈ [(${it('y')} + 2) − ${it('y')}${sup('2')}] Δ${it('y')}`, { size: 14 });
  s += text(bx + 16, 204, `Limits are ${it('y')}-values:`, { size: 14, weight: 'bold' });
  s += text(bx + 16, 228, `${it('y')}${sup('2')} = ${it('y')} + 2  gives  ${it('y')} = −1, 2`, { size: 14 });
  s += text(bx + 16, 264, `A = ∫ from −1 to 2 of`, { size: 14 });
  s += text(bx + 16, 286, `[(${it('y')} + 2) − ${it('y')}${sup('2')}] d${it('y')}`, { size: 14, color: C.crimson });
  s += text(bx + 16, 320, `= 9/2`, { size: 16, weight: 'bold' });
  s += text(bx + 16, 352, `In ${it('x')}, the bottom boundary changes`, { size: 12.5, color: C.grey });
  s += text(bx + 16, 370, `at ${it('x')} = 1, so ${it('x')} needs two integrals.`, { size: 12.5, color: C.grey });
  return svgDoc(W, H, 'Area between x = y² and x = y + 2 with one horizontal rectangle',
    'The region between the parabola x = y² (crimson, on the left) and the line x = y + 2 (blue, on the right) is shaded from y = −1 to y = 2, where the curves meet at (1, −1) and (4, 2). One thin horizontal rectangle of thickness Δy runs across the region; its length is right minus left, (y + 2) − y². A side panel gives the limits from y² = y + 2, y = −1 and 2, and the area, the integral from −1 to 2 of [(y + 2) − y²] dy = 9/2. In x the bottom boundary changes at x = 1, so slicing vertically would need two integrals.', s);
};


/* 8.5 calculator set: the region between x = y^2 and x = 2 + sin(2y) */
FIGS['area-y-sine-region'] = () => {
  const W = 520, H = 400;
  const right = y => 2 + Math.sin(2 * y), left = y => y * y;
  const y1 = -1.0821166296452565, y2 = 1.4780091517548968;
  const P = panel({ px: 60, py: 40, pw: 400, ph: 320, xr: [-0.5, 3.5], yr: [-1.6, 2], xStep: 0.5, yStep: 0.5 });
  P.shadeY(right, left, y1, y2, C.pale);
  P.curveY(left, -1.35, Math.sqrt(3.5), C.crimson).curveY(right, -1.6, 2, C.blue);
  P.label(1.1, 1.75, `${it('x')} = ${it('y')}${sup('2')}`, { anchor: 'end', size: 14, color: C.crimson, weight: 'bold' });
  P.label(3.45, -0.35, `${it('x')} = 2 + sin 2${it('y')}`, { anchor: 'end', size: 14, color: C.blue, weight: 'bold' });
  P.label(1.2, 0.35, it('Q'), { anchor: 'middle', size: 18, weight: 'bold' });
  return svgDoc(W, H, 'The region Q between x = y² and x = 2 + sin 2y',
    'Graphs in the xy-plane of the parabola x = y² (crimson, opening to the right) and the curve x = 2 + sin 2y (blue, a wave that moves left and right between x = 1 and x = 3 as y changes). The region Q between them is shaded: the wave is on the right and the parabola on the left, from where they cross near y = −1.08 up to where they cross near y = 1.48.', P.svg());
};

/* ------------------------------------------------ 8.6 curves that cross three times */
FIGS['area-three-crossings'] = () => {
  const W = 760, H = 440;
  const f = x => x ** 3 - 3 * x, g = x => x;
  const P = panel({ px: 60, py: 40, pw: 400, ph: 360, xr: [-2.6, 2.6], yr: [-4.4, 4.4], xStep: 1, yStep: 1 });
  P.shade(f, g, -2, 0, C.pale).shade(g, f, 0, 2, C.paleBlue);
  P.rect(-1.45, -1.25, g(-1.35), f(-1.35), C.crimson, '#EBB3C4').rect(1.25, 1.45, f(1.35), g(1.35), C.blue, '#A9CFE8');
  P.curve(f, -2.27, 2.27, C.crimson).curve(g, -2.6, 2.6, C.blue);
  P.dot(-2, -2).dot(0, 0).dot(2, 2);
  P.label(-1.88, -2.75, '(−2, −2)', { anchor: 'start', size: 13 }).label(0.12, -0.5, '(0, 0)', { anchor: 'start', size: 13 }).label(2.1, 1.45, '(2, 2)', { anchor: 'start', size: 13 });
  P.label(-2.25, 3.6, `${it('f')}(${it('x')}) = ${it('x')}${sup('3')} − 3${it('x')}`, { anchor: 'start', size: 14, color: C.crimson, weight: 'bold' });
  P.label(1.0, 3.4, `${it('g')}(${it('x')}) = ${it('x')}`, { anchor: 'start', size: 14, color: C.blue, weight: 'bold' });
  P.label(-1.0, 3.25, `${it('f')} on top`, { anchor: 'middle', size: 13, color: C.crimson });
  P.label(1.0, -2.9, `${it('g')} on top`, { anchor: 'middle', size: 13, color: C.blue });
  let s = P.svg();
  const bx = 490;
  s += box(bx, 50, 252, 340, { fill: '#FFFFFF', stroke: C.grid });
  s += text(bx + 14, 80, 'Top and bottom swap', { size: 16, weight: 'bold' });
  s += text(bx + 14, 104, `at every crossing.`, { size: 16, weight: 'bold' });
  s += text(bx + 14, 136, `On [−2, 0]:  ${it('f')} − ${it('g')} = ${it('x')}${sup('3')} − 4${it('x')}`, { size: 13.5, color: C.crimson });
  s += text(bx + 14, 158, `On [0, 2]:  ${it('g')} − ${it('f')} = 4${it('x')} − ${it('x')}${sup('3')}`, { size: 13.5, color: C.blue });
  s += text(bx + 14, 192, `Area = ∫ from −2 to 0 of (${it('f')} − ${it('g')}) d${it('x')}`, { size: 13.5 });
  s += text(bx + 14, 214, `     + ∫ from 0 to 2 of (${it('g')} − ${it('f')}) d${it('x')}`, { size: 13.5 });
  s += text(bx + 14, 240, `= 4 + 4 = 8`, { size: 16, weight: 'bold' });
  s += text(bx + 14, 280, `But ∫ from −2 to 2 of (${it('f')} − ${it('g')}) d${it('x')} = 0:`, { size: 13.5, color: C.verm });
  s += text(bx + 14, 302, 'the two pieces cancel. One', { size: 13.5, color: C.verm });
  s += text(bx + 14, 322, 'integral gives a net amount,', { size: 13.5, color: C.verm });
  s += text(bx + 14, 342, 'not the area.', { size: 13.5, color: C.verm });
  return svgDoc(W, H, 'Two curves that cross three times: f(x) = x³ − 3x and g(x) = x',
    'The cubic f(x) = x³ − 3x (crimson) and the line g(x) = x (blue) cross at (−2, −2), (0, 0) and (2, 2). Between x = −2 and 0 the cubic is on top (region shaded pink, with a vertical rectangle of height f − g); between 0 and 2 the line is on top (region shaded blue, rectangle of height g − f). A side panel adds the two pieces: the integral of x³ − 4x from −2 to 0 is 4 and the integral of 4x − x³ from 0 to 2 is 4, so the area is 8. A single integral of f − g from −2 to 2 is 0 because the pieces cancel: it gives a net amount, not the area.', s);
};

/* ------------------------------------------------ cross sections on a base */
/* Base region between y = lo(x) and y = hi(x) on the floor (z = 0), slices
   perpendicular to the x-axis. shape(c, s) gives the cross section's outline
   in the (y, z) plane: [[y, z], ...] for a slice from y = lo to y = hi. */
function sectionsScene(cam, o) {
  const { lo, hi, a, b, shape, xs, hx, dx, pal, palHi } = o;
  const out = [];
  // base region
  const N = 120, rim = [];
  for (let i = 0; i <= N; i++) { const x = a + (b - a) * i / N; rim.push(cam.P([x, hi(x), 0])); }
  for (let i = N; i >= 0; i--) { const x = a + (b - a) * i / N; rim.push(cam.P([x, lo(x), 0])); }
  out.push({ depth: 1e9, svg: poly(rim, { fill: C.base, stroke: C.crimson, w: 2.2 }) + (o.under || '') });
  // slabs: each a prism (shape extruded by thickness), faces sorted inside
  const prism = (x0, w, p, edge) => {
    const s = hi(x0 + w / 2) - lo(x0 + w / 2), o = shape(lo(x0 + w / 2), s);
    const F0 = o.map(([y, z]) => [x0, y, z]), F1 = o.map(([y, z]) => [x0 + w, y, z]);
    const faces = [face(cam, F0, p), face(cam, F1, p)];
    for (let i = 0; i < o.length; i++) { const j = (i + 1) % o.length; faces.push(face(cam, [F0[i], F1[i], F1[j], F0[j]], p)); }
    const depth = cam.P([x0 + w / 2, (hi(x0) + lo(x0)) / 2, 0])[2];
    return { depth, svg: drawFaces(faces, { edge }) };
  };
  for (const x of xs) out.push({ ...prism(x - 0.012, 0.024, pal, mix(pal[0], '#FFFFFF', 0.2)), translucent: true });
  out.push(prism(hx, dx, palHi, mix(palHi[0], '#000000', 0.15)));
  return out.sort((p, q) => q.depth - p.depth).map(p => p.translucent ? `<g opacity="0.55">${p.svg}</g>` : p.svg).join('');
}
function floorAxes(cam, xr, yr, zr) {
  let s = '';
  const ax = (p, q, lab, o = {}) => { const A = cam.P(p), B = cam.P(q); s += arrow(A[0], A[1], B[0], B[1], C.ink, 1.5, 8) + text(B[0] + (o.dx || 6), B[1] + (o.dy || 4), it(lab), { size: 15, anchor: o.anchor || 'start' }); };
  ax([xr[0], 0, 0], [xr[1], 0, 0], 'x');
  ax([0, yr[0], 0], [0, yr[1], 0], 'y', { dy: -2 });
  if (zr) ax([0, 0, zr[0]], [0, 0, zr[1]], 'z', { dx: -4, dy: -6, anchor: 'end' });
  return s;
}

/* 8.7: square cross sections on the region under y = 4 - x^2 */
FIGS['square-sections-solid'] = () => {
  const W = 760, H = 460;
  const hi = x => 4 - x * x, lo = () => 0;
  const pts = []; for (let i = 0; i <= 40; i++) { const x = -2 + i / 10; pts.push([x, 0, 0], [x, hi(x), 0], [x, hi(x), hi(x)], [x, 0, hi(x)]); }
  pts.push([3.2, 0, 0], [0, 5.4, 0], [-3.2, 0, 0]);
  const cam = fitCamera({ az: -2.25, el: 0.62, F: 40 }, pts, [30, 40, 490, 425]);
  const sq = (y0, s) => [[y0, 0], [y0 + s, 0], [y0 + s, s], [y0, s]];
  let s = floorAxes(cam, [-3.0, 3.4], [-0.6, 5.2], null);
  const hx = 0.8, dx = 0.1, xm = hx + dx / 2, sm = hi(xm);
  // the solid's top edges, traced by the squares' corners
  const edge = f => { const q = []; for (let i = 0; i <= 80; i++) { const x = -2 + i / 20; q.push(cam.P(f(x))); } return pline(q, '#B85A78', 1.3, '5 4'); };
  const solidEdges = edge(x => [x, 0, hi(x)]) + edge(x => [x, hi(x), hi(x)]);
  s += sectionsScene(cam, { lo, hi, a: -2, b: 2, shape: sq, under: solidEdges, xs: [-1.6, -1.2, -0.8, -0.4, 0, 0.4, 1.3, 1.7], hx, dx,
    pal: ['#B85A78', '#F2C4D2'], palHi: ['#005A8C', '#7FBFE6'] });
  // labels on the highlighted square: its side along the base, and its height
  const A = cam.P([hx + dx, 0, 0]), B = cam.P([hx + dx, sm, 0]), T = cam.P([hx + dx, sm, sm]);
  s += text((A[0] + B[0]) / 2 + 4, (A[1] + B[1]) / 2 + 24, `${it('s')} = 4 − ${it('x')}${sup('2')}`, { anchor: 'middle', size: 14, weight: 'bold', color: C.blue });
  s += text((B[0] + T[0]) / 2 + 10, (B[1] + T[1]) / 2, it('s'), { anchor: 'start', size: 15, weight: 'bold', color: C.blue });
  const E = cam.P([2, 0, 0]);
  s += text(E[0] - 4, E[1] + 20, '2', { anchor: 'middle', size: 12.5, color: C.grey });
  const Bl = cam.P([2, 0, 0]);
  s += text(150, 438, `base: the region under ${it('y')} = 4 − ${it('x')}${sup('2')}`, { anchor: 'start', size: 13.5, color: C.crimson, weight: 'bold' });
  const bx = 520;
  s += box(bx, 50, 222, 360, { fill: '#FFFFFF', stroke: C.grid });
  s += text(bx + 14, 80, 'Squares standing', { size: 16, weight: 'bold' });
  s += text(bx + 14, 102, 'on the base', { size: 16, weight: 'bold' });
  // a flat square diagram
  const qx = bx + 66, qy = 124, qs = 90;
  s += `<rect x="${qx}" y="${qy}" width="${qs}" height="${qs}" fill="#7FBFE6" stroke="${C.blue}" stroke-width="2"/>`;
  s += text(qx + qs / 2, qy + qs + 18, it('s'), { anchor: 'middle', size: 15 }) + text(qx - 10, qy + qs / 2 + 5, it('s'), { anchor: 'end', size: 15 });
  s += text(bx + 14, 262, `side = height of the base`, { size: 13.5 });
  s += text(bx + 14, 284, `${it('s')}(${it('x')}) = 4 − ${it('x')}${sup('2')}`, { size: 14, color: C.blue });
  s += text(bx + 14, 310, `${it('A')}(${it('x')}) = ${it('s')}${sup('2')} = (4 − ${it('x')}${sup('2')})${sup('2')}`, { size: 14 });
  s += text(bx + 14, 340, `${it('V')} = ∫ from −2 to 2 of ${it('A')}(${it('x')}) d${it('x')}`, { size: 13.5 });
  s += text(bx + 14, 366, `= 512/15 ≈ 34.13`, { size: 16, weight: 'bold' });
  s += text(bx + 14, 394, 'Square the side, then integrate.', { size: 12.5, color: C.grey });
  return svgDoc(W, H, 'A solid with square cross sections on the region under y = 4 − x²',
    'In 3D, the base region under the parabola y = 4 − x² from x = −2 to 2 lies flat on the floor. Square slices stand on it, each perpendicular to the x-axis with one side across the base, so a slice at x has side s = 4 − x²; the squares are tallest at x = 0 and shrink to nothing at x = ±2. One slice of small thickness is highlighted in blue with its side s labeled. A side panel shows the flat square of side s, its area A(x) = s² = (4 − x²)², and the volume, the integral from −2 to 2 of A(x) dx = 512/15, about 34.13.', s);
};

/* 8.8: equilateral triangles and semicircles on the region under y = sqrt(x) */
function triOrSemi(kind) {
  const W = 760, H = 460;
  const hi = x => Math.sqrt(x), lo = () => 0;
  const pts = []; for (let i = 0; i <= 40; i++) { const x = i / 10; pts.push([x, 0, 0], [x, hi(x), 0], [x, hi(x), hi(x) * (kind === 'tri' ? 0.87 : 0.5)]); }
  pts.push([5.2, 0, 0], [0, 3.4, 0], [-0.6, 0, 0]);
  const cam = fitCamera({ az: -2.3, el: 0.6, F: 40 }, pts, [40, 60, 470, 425]);
  const tri = (y0, s) => [[y0, 0], [y0 + s, 0], [y0 + s / 2, Math.sqrt(3) / 2 * s]];
  const semi = (y0, s) => { const pts = []; for (let i = 0; i <= 24; i++) { const t = Math.PI * i / 24; pts.push([y0 + s / 2 + s / 2 * Math.cos(t), s / 2 * Math.sin(t)]); } return pts; };
  let s = floorAxes(cam, [-0.6, 5.2], [-0.6, 3.4], null);
  const xs = [0.4, 0.9, 1.4, 1.9, 3.0, 3.5, 3.95];
  s += sectionsScene(cam, { lo, hi, a: 0, b: 4, shape: kind === 'tri' ? tri : semi, xs, hx: 2.4, dx: 0.14,
    pal: ['#B85A78', '#F2C4D2'], palHi: kind === 'tri' ? ['#005A8C', '#7FBFE6'] : ['#006B4F', '#86D3BB'] });
  const col = kind === 'tri' ? C.blue : C.green;
  const A = cam.P([2.47, 0, 0]), B = cam.P([2.47, Math.sqrt(2.47), 0]);
  s += text((A[0] + B[0]) / 2 - 10, (A[1] + B[1]) / 2 + 24, `${it('s')} = √${it('x')}`, { anchor: 'middle', size: 14, weight: 'bold', color: col });
  const E = cam.P([4, 0, 0]);
  s += text(E[0], E[1] + 20, '4', { anchor: 'middle', size: 12.5, color: C.grey });
  const Bl = cam.P([4, 2, 0]);
  s += text(Bl[0] + 12, Bl[1] + 10, `base: under ${it('y')} = √${it('x')}`, { anchor: 'start', size: 13.5, color: C.crimson, weight: 'bold' });
  const bx = 500;
  s += box(bx, 50, 242, 360, { fill: '#FFFFFF', stroke: C.grid });
  if (kind === 'tri') {
    s += text(bx + 14, 80, 'Equilateral triangles', { size: 16, weight: 'bold' });
    const tx = bx + 66, ty = 210, ts = 110, th = Math.sqrt(3) / 2 * ts;
    s += poly([[tx, ty], [tx + ts, ty], [tx + ts / 2, ty - th]], { fill: '#7FBFE6', stroke: C.blue, w: 2 });
    s += line(tx + ts / 2, ty, tx + ts / 2, ty - th, C.ink, 1.3, '5 4');
    s += text(tx + ts / 2, ty + 18, it('s'), { anchor: 'middle', size: 15 }) + text(tx + ts / 2 + 6, ty - th / 2 + 18, `(√3/2)${it('s')}`, { anchor: 'start', size: 12.5 });
    s += text(bx + 14, 256, `area = ½ · base · height`, { size: 13.5 });
    s += text(bx + 14, 278, `= ½ · ${it('s')} · (√3/2)${it('s')} = (√3/4)${it('s')}${sup('2')}`, { size: 13.5, color: C.blue });
    s += text(bx + 14, 310, `${it('V')} = ∫ from 0 to 4 of (√3/4)(√${it('x')})${sup('2')} d${it('x')}`, { size: 13.5 });
    s += text(bx + 14, 336, `= (√3/4) · 8 = 2√3 ≈ 3.46`, { size: 16, weight: 'bold' });
    s += text(bx + 14, 370, 'Squares on the same base: 8.', { size: 12.5, color: C.grey });
    s += text(bx + 14, 388, `Triangles keep √3/4 ≈ 0.433 of that.`, { size: 12.5, color: C.grey });
  } else {
    s += text(bx + 14, 80, 'Semicircles', { size: 16, weight: 'bold' });
    const cx = bx + 121, cy = 196, rr = 62, pts = [];
    for (let i = 0; i <= 40; i++) { const t = Math.PI * i / 40; pts.push([cx + rr * Math.cos(t), cy - rr * Math.sin(t)]); }
    s += poly(pts, { fill: '#86D3BB', stroke: C.green, w: 2 });
    s += line(cx, cy, cx + rr * 0.7, cy - rr * 0.7, C.ink, 1.3, '5 4');
    s += text(cx, cy + 18, `diameter ${it('s')}`, { anchor: 'middle', size: 13.5 }) + text(cx + rr * 0.42, cy - rr * 0.32, `${it('s')}/2`, { anchor: 'start', size: 12.5 });
    s += text(bx + 14, 240, `area = ½ · π · (radius)${sup('2')}`, { size: 13.5 });
    s += text(bx + 14, 262, `= ½ · π · (${it('s')}/2)${sup('2')} = (π/8)${it('s')}${sup('2')}`, { size: 13.5, color: C.green });
    s += text(bx + 14, 296, `${it('V')} = ∫ from 0 to 4 of (π/8)(√${it('x')})${sup('2')} d${it('x')}`, { size: 13.5 });
    s += text(bx + 14, 322, `= (π/8) · 8 = π ≈ 3.14`, { size: 16, weight: 'bold' });
    s += text(bx + 14, 356, 'The radius is half the side:', { size: 12.5, color: C.grey });
    s += text(bx + 14, 374, `using ${it('s')} as the radius makes the`, { size: 12.5, color: C.grey });
    s += text(bx + 14, 392, 'answer 4 times too big.', { size: 12.5, color: C.grey });
  }
  return s;
}
FIGS['triangle-sections-solid'] = () => svgDoc(760, 460, 'A solid with equilateral triangle cross sections on the region under y = √x',
  'In 3D, the base region under y = √x from x = 0 to 4 lies flat on the floor. Equilateral triangles stand on it, each perpendicular to the x-axis with one side across the base, so a slice at x has side s = √x; they grow from a point at x = 0 to side 2 at x = 4. One slice is highlighted in blue. A side panel shows the triangle with side s and height (√3/2)s, its area ½ · s · (√3/2)s = (√3/4)s², and the volume, the integral from 0 to 4 of (√3/4)(√x)² dx = 2√3, about 3.46. Squares on the same base would give 8.', triOrSemi('tri'));
FIGS['semicircle-sections-solid'] = () => svgDoc(760, 460, 'A solid with semicircle cross sections on the region under y = √x',
  'In 3D, the base region under y = √x from x = 0 to 4 lies flat on the floor. Semicircles stand on it, each perpendicular to the x-axis with its diameter across the base, so a slice at x has diameter s = √x. One slice is highlighted in green. A side panel shows the semicircle with diameter s and radius s/2, its area ½ · π · (s/2)² = (π/8)s², and the volume, the integral from 0 to 4 of (π/8)(√x)² dx = π, about 3.14. Using s as the radius instead of s/2 makes the answer 4 times too big.', triOrSemi('semi'));

/* ------------------------------------------------ solids of revolution */
/* Left: the region and its rectangle in 2D. Right: the solid in 3D. */
function revolutionFigure(o) {
  const W = 760, H = 440;
  const P = panel(o.panel);
  o.draw2d(P);
  let s = P.svg();
  const k = o.k || 0;
  // fit the solid into the right-hand box
  const fit = o.fit || [350, 40, 740, 400];
  const c1 = camera({ ...o.cam, scale: 1, cx: 0, cy: 0 });
  let bx = [Infinity, Infinity, -Infinity, -Infinity];
  for (let i = 0; i <= 40; i++) { const x = o.a + (o.b - o.a) * i / 40; for (const q of ring(c1, x, o.R(x), k, 72)) { bx = [Math.min(bx[0], q[0]), Math.min(bx[1], q[1]), Math.max(bx[2], q[0]), Math.max(bx[3], q[1])]; } }
  const sc = Math.min((fit[2] - fit[0]) / (bx[2] - bx[0]), (fit[3] - fit[1]) / (bx[3] - bx[1]));
  const cam = camera({ ...o.cam, scale: sc, cx: (fit[0] + fit[2]) / 2 - sc * (bx[0] + bx[2]) / 2, cy: (fit[1] + fit[3]) / 2 - sc * (bx[1] + bx[3]) / 2 });
  const all = revolve(cam, { R: o.R, r: o.r, a: o.a, b: o.b, k, n: o.n || 56, m: o.m || 48, pal: ['#A23A5C', '#F5CFDB'] });
  const back = all.filter(f => !f.facing), front = all.filter(f => f.facing);
  const xm = o.x0 + o.dx / 2;
  const sl = slab(cam, { x0: o.x0, dx: o.dx, R: Math.min(o.R(o.x0), o.R(o.x0 + o.dx)), r: o.r ? Math.max(o.r(o.x0), o.r(o.x0 + o.dx)) : 0, k, pal: o.slabPal || ['#005C91', '#9BD0F0'] });
  let g = '';
  g += axis3(cam, [o.a - (o.b - o.a) * 0.25, 0, k], [o.a, 0, k], C.ink, 1.4, '7 5');
  g += `<g>${drawFaces(back)}</g>`;
  g += drawFaces(sl);
  const Rs = Math.min(o.R(o.x0), o.R(o.x0 + o.dx)), rs = o.r ? Math.max(o.r(o.x0), o.r(o.x0 + o.dx)) : 0;
  g += pline(ring(cam, o.x0 + o.dx, Rs, k), '#003D61', 1.2) + pline(ring(cam, o.x0, Rs, k), '#003D61', 0.8);
  if (o.r) g += pline(ring(cam, o.x0 + o.dx, rs, k), '#003D61', 1.2);
  g += `<g opacity="0.42">${drawFaces(front)}</g>`;
  g += hullOutline(cam, o.R, o.a, o.b, k);
  if (o.R(o.b) > 1e-6) g += pline(ring(cam, o.b, o.R(o.b), k), C.crimson, 1.6);
  if (o.R(o.a) > 1e-6) g += pline(ring(cam, o.a, o.R(o.a), k), C.crimson, 1.6);
  if (o.r && o.r(o.b) > 1e-6 && o.r(o.b) < o.R(o.b) - 1e-6) g += pline(ring(cam, o.b, o.r(o.b), k), C.crimson, 1.4);
  const ext = (o.b - o.a) * 0.25, e1 = cam.P([o.b + ext * 0.85, 0, k]), e2 = cam.P([o.b + ext, 0, k]);
  g += axis3(cam, [xm, 0, k], [o.b + ext * 0.85, 0, k], C.ink, 1.4, '7 5') + head(e2[0], e2[1], Math.atan2(e2[1] - e1[1], e2[0] - e1[0]), C.ink, 8);
  s += g;
  s += o.draw3d(cam);
  return svgDoc(W, H, o.title, o.desc, s);
}
/* a radius arrow on the near face of the slab, from the axis up to radius rad */
function radiusArrow(cam, x, k, rad, color, label, o = {}) {
  const A = cam.P([x, 0, k]), B = cam.P([x, 0, k + rad]);
  return arrow(A[0], A[1], B[0], B[1], color, 2.2, 9) + text(B[0] + (o.dx ?? 8), (A[1] + B[1]) / 2 + (o.dy ?? 4), label, { anchor: o.anchor || 'start', size: 14, weight: 'bold', color });
}

FIGS['disc-solid-x-axis'] = () => revolutionFigure({
  title: 'The disc method: the region under y = √x revolved about the x-axis',
  desc: 'Left: the region under y = √x from x = 0 to 4, shaded, with one thin vertical rectangle of width Δx whose height is √x. Right: the solid made by revolving that region about the x-axis, a rounded horn shape, drawn in 3D with the x-axis through its center. The rectangle sweeps out one thin disc, highlighted in blue, whose radius is the rectangle\'s height, r = √x. Each disc has volume π r² Δx, so V = the integral from 0 to 4 of π(√x)² dx = 8π.',
  panel: { px: 46, py: 60, pw: 250, ph: 220, xr: [-0.4, 4.6], yr: [-2.4, 2.6], xStep: 1, yStep: 1 },
  draw2d: P => {
    P.shade(Math.sqrt, () => 0, 0, 4, C.pale).rect(2.3, 2.6, 0, Math.sqrt(2.45)).curve(Math.sqrt, 0, 4.5, C.crimson).curve(x => -Math.sqrt(x), 0, 4, '#D9A3B4', 1.6, '6 5');
    P.label(3.2, 2.15, `${it('y')} = √${it('x')}`, { anchor: 'middle', size: 14, color: C.crimson, weight: 'bold' });
    P.label(2.75, 0.75, it('r'), { anchor: 'start', size: 14, color: C.blue, weight: 'bold' });
    P.top.push(text(46, 330, 'Spin the rectangle about the', { size: 13.5 }) + text(46, 350, `${it('x')}-axis: it sweeps out a disc.`, { size: 13.5 }));
    P.top.push(text(46, 386, `${it('V')} = ∫ from 0 to 4 of π(√${it('x')})${sup('2')} d${it('x')} = 8π`, { size: 15, weight: 'bold' }));
  },
  cam: { az: -0.42, el: 0.28, F: 30 }, fit: [380, 60, 730, 380],
  R: Math.sqrt, a: 0, b: 4, x0: 2.3, dx: 0.3,
  draw3d: cam => radiusArrow(cam, 2.3, 0, Math.sqrt(2.45), '#0072B2', `${it('r')} = √${it('x')}`, { dx: -10, anchor: 'end', dy: -6 }) + (() => { const T = cam.P([5.4, 0, 0]); return text(T[0] - 4, T[1] + 22, `axis: the ${it('x')}-axis`, { anchor: 'end', size: 13 }); })()
});

FIGS['disc-solid-line'] = () => revolutionFigure({
  title: 'The disc method about the line y = 1: the region between y = x² and y = 1',
  desc: 'Left: the region between the parabola y = x² and the line y = 1, from x = −1 to 1, shaded, with the line y = 1 dashed as the axis of rotation. One thin vertical rectangle reaches from the parabola up to the axis; its length is 1 − x². Right: the solid made by revolving the region about y = 1, shaped like a lemon: thickest in the middle and coming to points at x = ±1, with the axis through its center. The highlighted blue disc has radius r = 1 − x², the distance from the axis down to the curve, not x². V = the integral from −1 to 1 of π(1 − x²)² dx = 16π/15.',
  panel: { px: 46, py: 52, pw: 250, ph: 230, xr: [-1.5, 1.5], yr: [-0.3, 1.6], xStep: 0.5, yStep: 0.5 },
  draw2d: P => {
    P.shade(() => 1, x => x * x, -1, 1, C.pale).rect(0.3, 0.42, 0.36 * 0.36, 1).curve(x => x * x, -1.26, 1.26, C.crimson).hline(1, C.ink, '8 5', -1.5, 1.5, 1.8);
    P.label(0.08, 1.08, `axis ${it('y')} = 1`, { anchor: 'start', size: 13.5, weight: 'bold' });
    P.label(1.0, 0.55, `${it('y')} = ${it('x')}${sup('2')}`, { anchor: 'start', size: 14, color: C.crimson, weight: 'bold' });
    P.label(0.47, 0.72, `1 − ${it('x')}${sup('2')}`, { anchor: 'start', size: 13.5, color: C.blue, weight: 'bold' });
    P.top.push(text(46, 330, 'The radius runs from the axis', { size: 13.5 }) + text(46, 350, `to the curve: ${it('r')} = 1 − ${it('x')}${sup('2')}, not ${it('x')}${sup('2')}.`, { size: 13.5 }));
    P.top.push(text(46, 386, `${it('V')} = ∫ from −1 to 1 of π(1 − ${it('x')}${sup('2')})${sup('2')} d${it('x')}`, { size: 14.5, weight: 'bold' }));
    P.top.push(text(46, 410, `= 16π/15 ≈ 3.35`, { size: 15, weight: 'bold' }));
  },
  cam: { az: -0.42, el: 0.26, F: 30 }, fit: [410, 70, 690, 360],
  R: x => 1 - x * x, a: -1, b: 1, x0: 0.3, dx: 0.12, k: 0,
  draw3d: cam => radiusArrow(cam, 0.36, 0, 1 - 0.36 * 0.36, '#0072B2', `${it('r')} = 1 − ${it('x')}${sup('2')}`, { dx: -10, anchor: 'end', dy: -34 }) + (() => { const T = cam.P([-1.5, 0, 0]); return text(T[0] - 2, T[1] - 10, `axis: ${it('y')} = 1`, { anchor: 'start', size: 13 }); })()
});

/* 8.11 and 8.12: the region between y = sqrt(x) and y = 1 for 1 <= x <= 4 */
const washerPanel = (P, axisY) => {
  P.shade(Math.sqrt, () => 1, 1, 4, C.pale).rect(2.4, 2.65, 1, Math.sqrt(2.525)).curve(Math.sqrt, 0, 4.5, C.blue).hline(1, C.crimson, null, -0.4, 4.6, 2.6).vline(4, C.grey, '5 4', 0, 2.3, 1.4);
  P.label(4.45, 2.25, `${it('y')} = √${it('x')}`, { anchor: 'end', size: 14, color: C.blue, weight: 'bold' });
  P.label(0.2, 1.18, `${it('y')} = 1`, { anchor: 'start', size: 14, color: C.crimson, weight: 'bold' });
  P.label(4.08, 0.3, `${it('x')} = 4`, { anchor: 'start', size: 12.5, color: C.grey });
  const xa = 2.95, xb = 2.1, lo = axisY;
  P.out.push(darrow(P.sx(xa), P.sy(lo), P.sx(xa), P.sy(Math.sqrt(2.525)), C.blue, 1.5, 7) + line(P.sx(2.65), P.sy(Math.sqrt(2.525)), P.sx(xa), P.sy(Math.sqrt(2.525)), C.blue, 1, '3 2'));
  P.out.push(darrow(P.sx(xb), P.sy(lo), P.sx(xb), P.sy(1), C.verm, 1.5, 7) + line(P.sx(xb), P.sy(1), P.sx(2.4), P.sy(1), C.verm, 1, '3 2'));
  P.label(xa + 0.08, (lo + Math.sqrt(2.525)) / 2, it('R'), { anchor: 'start', size: 14, color: C.blue, weight: 'bold' });
  P.label(xb - 0.08, (lo + 1) / 2 + 0.05, it('r'), { anchor: 'end', size: 14, color: C.verm, weight: 'bold' });
};
FIGS['washer-solid-x-axis'] = () => revolutionFigure({
  title: 'The washer method: the region between y = √x and y = 1 revolved about the x-axis',
  desc: 'Left: the region between y = √x (on top) and the line y = 1 (below), from x = 1 to x = 4, shaded, with one thin vertical rectangle from the line up to the curve. Arrows from the x-axis show the outer radius R up to the curve and the inner radius r up to the line. Right: the solid made by revolving the region about the x-axis, a flared horn with a round hole of radius 1 along the axis. The rectangle sweeps out a washer, highlighted in blue, with outer radius R = √x and inner radius r = 1, both measured from the x-axis. Each washer has volume π(R² − r²)Δx, so V = the integral from 1 to 4 of π[(√x)² − 1²] dx = 9π/2.',
  panel: { px: 46, py: 52, pw: 250, ph: 230, xr: [-0.4, 4.6], yr: [-0.4, 2.6], xStep: 1, yStep: 1 },
  draw2d: P => {
    washerPanel(P, 0);
    P.top.push(text(46, 330, 'Both radii start at the axis:', { size: 13.5 }) + text(46, 350, `${it('R')} = √${it('x')} (far edge), ${it('r')} = 1 (near edge).`, { size: 13.5 }));
    P.top.push(text(46, 386, `${it('V')} = ∫ from 1 to 4 of π[(√${it('x')})${sup('2')} − 1${sup('2')}] d${it('x')}`, { size: 14.5, weight: 'bold' }));
    P.top.push(text(46, 410, `= 9π/2 ≈ 14.14`, { size: 15, weight: 'bold' }));
  },
  cam: { az: -0.5, el: 0.3, F: 30 }, fit: [390, 50, 730, 390],
  R: Math.sqrt, r: () => 1, a: 1, b: 4, x0: 2.4, dx: 0.25,
  draw3d: cam => radiusArrow(cam, 2.525, 0, Math.sqrt(2.525), '#0072B2', `${it('R')} = √${it('x')}`, { dx: -10, anchor: 'end', dy: -20 }) + (() => {
    const A = cam.P([2.525, 0, 0]), B = cam.P([2.525, 0, -1]);
    return arrow(A[0], A[1], B[0], B[1], C.verm, 2.2, 9) + text(B[0] - 8, B[1] + 6, `${it('r')} = 1`, { anchor: 'end', size: 14, weight: 'bold', color: C.verm });
  })() + (() => { const T = cam.P([4.75, 0, 0]); return text(T[0] + 4, T[1] + 24, `axis: the ${it('x')}-axis`, { anchor: 'end', size: 13 }); })()
});

FIGS['washer-solid-line'] = () => revolutionFigure({
  title: 'The washer method about the line y = −1: the region between y = √x and y = 1',
  desc: 'Left: the same region between y = √x and y = 1 from x = 1 to 4, with the line y = −1 dashed below it as the axis of rotation. Arrows from the axis to the thin vertical rectangle show the outer radius R up to the curve and the inner radius r up to the line y = 1. Right: the solid made by revolving the region about y = −1, a flared horn with a wider hole, of radius 2, around the axis. The highlighted blue washer has outer radius R = √x − (−1) = √x + 1 and inner radius r = 1 − (−1) = 2. V = the integral from 1 to 4 of π[(√x + 1)² − 2²] dx = 47π/6.',
  panel: { px: 46, py: 52, pw: 250, ph: 230, xr: [-0.4, 4.6], yr: [-1.6, 2.6], xStep: 1, yStep: 1 },
  draw2d: P => {
    washerPanel(P, -1);
    P.hline(-1, C.ink, '8 5', -0.4, 4.6, 1.8);
    P.label(4.55, -1.45, `axis ${it('y')} = −1`, { anchor: 'end', size: 13.5, weight: 'bold' });
    P.top.push(text(46, 330, 'Measure from the axis y = −1:', { size: 13.5 }) + text(46, 350, `${it('R')} = √${it('x')} + 1,  ${it('r')} = 1 + 1 = 2.`, { size: 13.5 }));
    P.top.push(text(46, 386, `${it('V')} = ∫ from 1 to 4 of π[(√${it('x')} + 1)${sup('2')} − 2${sup('2')}] d${it('x')}`, { size: 14.5, weight: 'bold' }));
    P.top.push(text(46, 410, `= 47π/6 ≈ 24.61`, { size: 15, weight: 'bold' }));
  },
  cam: { az: -0.5, el: 0.3, F: 30 }, fit: [390, 50, 730, 390],
  R: x => Math.sqrt(x) + 1, r: () => 2, a: 1, b: 4, x0: 2.4, dx: 0.25,
  draw3d: cam => radiusArrow(cam, 2.525, 0, Math.sqrt(2.525) + 1, '#0072B2', `${it('R')} = √${it('x')} + 1`, { dx: -10, anchor: 'end', dy: -26 }) + (() => {
    const A = cam.P([2.525, 0, 0]), B = cam.P([2.525, 0, -2]);
    return arrow(A[0], A[1], B[0], B[1], C.verm, 2.2, 9) + text(B[0] - 8, B[1] + 6, `${it('r')} = 2`, { anchor: 'end', size: 14, weight: 'bold', color: C.verm });
  })() + (() => { const T = cam.P([4.75, 0, 0]); return text(T[0] + 4, T[1] + 24, `axis: ${it('y')} = −1`, { anchor: 'end', size: 13 }); })()
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(OUT, { recursive: true });
  const only = process.argv.slice(2);
  for (const [id, fn] of Object.entries(FIGS)) {
    if (only.length && !only.includes(id)) continue;
    writeFileSync(join(OUT, `${id}.svg`), fn());
    console.log('wrote', `calculus/figures/${id}.svg`);
  }
}
