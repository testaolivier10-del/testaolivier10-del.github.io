/* Figures for AP® Precalculus Unit 3, topics 3.8-3.15 (author E): the tangent as
   the height on the line x = 1, a polar grid with labeled points, and three polar
   curves (a rose, a limaçon with an inner loop, and the curve used for rates of
   change of r). Every curve is sampled from the polar function it claims to show
   (x = r cos θ, y = r sin θ) and written as a standalone SVG (white background,
   Arial, role="img" with <title> and <desc>) to precalculus/figures/<id>.svg.

     node scripts/apprecalc-figures/e.mjs            write every figure
     node scripts/apprecalc-figures/e.mjs <id> ...   write some */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'precalculus', 'figures');
const INK = '#1F2A28', GREEN = '#11592F', BLUE = '#0072B2', VERM = '#D55E00', GRID = '#E1E6E3', MUTED = '#5A6563';
const FONT = 'Arial, Helvetica, sans-serif';
const PI = Math.PI;
const r2 = v => Math.round(v * 100) / 100;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function doc(w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d" font-family="${FONT}">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body.join('\n')}
</svg>
`;
}
const text = (x, y, s, o = {}) => `<text x="${r2(x)}" y="${r2(y)}" font-size="${o.size || 15}" fill="${o.fill || INK}" text-anchor="${o.anchor || 'middle'}"${o.weight ? ` font-weight="${o.weight}"` : ''}${o.italic ? ' font-style="italic"' : ''}>${esc(s)}</text>`;

/* Angle labels as fractions of π, written with the Unicode π. */
function piFrac(k, n) {
  // k/n of π, reduced
  const g = (a, b) => (b ? g(b, a % b) : a);
  const d = g(Math.abs(k), n) || 1, a = k / d, b = n / d;
  if (a === 0) return '0';
  const num = (Math.abs(a) === 1 ? '' : Math.abs(a)) + 'π';
  return (a < 0 ? '−' : '') + (b === 1 ? num : `${num}/${b}`);
}

/* A polar grid: circles r = 1..R, rays every π/n, angle labels outside. */
function polarGrid(cx, cy, s, R, n, { ringLabels = true } = {}) {
  const out = [];
  for (let r = 1; r <= R; r++) out.push(`<circle cx="${cx}" cy="${cy}" r="${r2(r * s)}" fill="none" stroke="${GRID}" stroke-width="1.2"/>`);
  for (let k = 0; k < 2 * n; k++) {
    const a = k * PI / n, x = cx + R * s * Math.cos(a), y = cy - R * s * Math.sin(a);
    out.push(`<line x1="${cx}" y1="${cy}" x2="${r2(x)}" y2="${r2(y)}" stroke="${GRID}" stroke-width="1.2"/>`);
    const lx = cx + (R * s + 22) * Math.cos(a), ly = cy - (R * s + 22) * Math.sin(a) + 5;
    out.push(text(lx, ly, piFrac(k, n), { size: 14, fill: MUTED }));
  }
  // The polar axis (θ = 0) and its extension, darker.
  out.push(`<line x1="${cx - R * s}" y1="${cy}" x2="${cx + R * s}" y2="${cy}" stroke="${MUTED}" stroke-width="1.4"/>`);
  out.push(`<line x1="${cx}" y1="${cy - R * s}" x2="${cx}" y2="${cy + R * s}" stroke="${MUTED}" stroke-width="1.4"/>`);
  if (ringLabels) for (let r = 1; r <= R; r++) out.push(text(cx - r * s + 3, cy + 16, String(r), { size: 13, fill: MUTED, anchor: 'start' }));
  out.push(`<circle cx="${cx}" cy="${cy}" r="3" fill="${INK}"/>`);
  return out;
}

/* A polar curve r = f(θ) on [a, b], as a path. */
function polarPath(f, a, b, cx, cy, s, n = 720) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = a + (b - a) * i / n, r = f(t);
    pts.push([cx + r * Math.cos(t) * s, cy - r * Math.sin(t) * s]);
  }
  return 'M' + pts.map(p => `${r2(p[0])},${r2(p[1])}`).join(' L');
}
const dot = (x, y, c = GREEN, open = false) => `<circle cx="${r2(x)}" cy="${r2(y)}" r="5" fill="${open ? '#FFFFFF' : c}" stroke="${c}" stroke-width="2"/>`;


/* A Cartesian panel. o: { left, top, w, h, x: [a, b], y: [c, d], xTicks: [[v, label]], yTicks: [[v, label]], xLabel, yLabel } */
function panel(o) {
  const sx = v => o.left + (v - o.x[0]) / (o.x[1] - o.x[0]) * o.w;
  const sy = v => o.top + (o.y[1] - v) / (o.y[1] - o.y[0]) * o.h;
  const out = [];
  for (const [v] of o.xTicks || []) out.push(`<line x1="${r2(sx(v))}" y1="${o.top}" x2="${r2(sx(v))}" y2="${o.top + o.h}" stroke="${GRID}" stroke-width="1"/>`);
  for (const [v] of o.yTicks || []) out.push(`<line x1="${o.left}" y1="${r2(sy(v))}" x2="${o.left + o.w}" y2="${r2(sy(v))}" stroke="${GRID}" stroke-width="1"/>`);
  const ax = sy(0), ay = sx(0);
  out.push(`<line x1="${o.left}" y1="${r2(ax)}" x2="${o.left + o.w}" y2="${r2(ax)}" stroke="${MUTED}" stroke-width="1.4"/>`);
  out.push(`<line x1="${r2(ay)}" y1="${o.top}" x2="${r2(ay)}" y2="${o.top + o.h}" stroke="${MUTED}" stroke-width="1.4"/>`);
  for (const [v, l] of o.xTicks || []) if (l) out.push(text(sx(v), ax + 18, l, { size: 13, fill: MUTED }));
  for (const [v, l] of o.yTicks || []) if (l) out.push(text(ay - 6, sy(v) + 4, l, { size: 13, fill: MUTED, anchor: 'end' }));
  if (o.xLabel) out.push(text(o.left + o.w - 2, ax - 8, o.xLabel, { italic: true, anchor: 'end' }));
  if (o.yLabel) out.push(text(ay + 8, o.top + 12, o.yLabel, { italic: true, anchor: 'start' }));
  const curve = (f, a, b, color, opts = {}) => {
    const n = 600, runs = [[]];
    for (let i = 0; i <= n; i++) {
      const x = a + (b - a) * i / n, y = f(x);
      if (!isFinite(y) || y > o.y[1] + 2 || y < o.y[0] - 2) { if (runs[runs.length - 1].length) runs.push([]); continue; }
      runs[runs.length - 1].push(`${r2(sx(x))},${r2(sy(Math.max(o.y[0] - 0.5, Math.min(o.y[1] + 0.5, y))))}`);
    }
    const d = runs.filter(r => r.length > 1).map(r => 'M' + r.join(' L')).join(' ');
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${opts.width || 2.6}"${opts.dash ? ' stroke-dasharray="7 5"' : ''} clip-path="url(#clip${o.id})"/>`;
  };
  out.unshift(`<clipPath id="clip${o.id}"><rect x="${o.left}" y="${o.top}" width="${o.w}" height="${o.h}"/></clipPath>`);
  return { out, sx, sy, curve };
}
const piT = (k, n) => [k * PI / n, piFrac(k, n)];

const FIGS = {

  'inverse-trig-restrict': () => {
    const W = 520, H = 470;
    const P = panel({ id: 'a', left: 40, top: 30, w: 440, h: 400, x: [-1.6, 3.6], y: [-1.6, 3.6],
      xTicks: [[-1, '−1'], [1, '1'], piT(1, 2), piT(1, 1)], yTicks: [[-1, '−1'], [1, '1'], [2, '2'], [3, '3']], xLabel: 'x', yLabel: 'y' });
    const b = [...P.out];
    b.push(`<line x1="${r2(P.sx(-1.6))}" y1="${r2(P.sy(-1.6))}" x2="${r2(P.sx(3.6))}" y2="${r2(P.sy(3.6))}" stroke="${MUTED}" stroke-width="1.4" stroke-dasharray="4 5"/>`);
    b.push(P.curve(Math.cos, -1.6, 3.6, GRID, { width: 2 }));
    b.push(P.curve(Math.cos, 0, PI, BLUE));
    b.push(P.curve(Math.acos, -1, 1, GREEN));
    for (const [x, y, c] of [[0, 1, BLUE], [PI, -1, BLUE], [1, 0, GREEN], [-1, PI, GREEN]]) b.push(dot(P.sx(x), P.sy(y), c));
    b.push(text(P.sx(1.9), P.sy(-1.35), 'y = cos x on [0, π]', { fill: BLUE, size: 15, anchor: 'start' }));
    b.push(text(P.sx(0.2), P.sy(2.6), 'y = cos⁻¹ x', { fill: GREEN, size: 15, anchor: 'start' }));
    b.push(text(P.sx(3.4), P.sy(2.75), 'y = x', { fill: MUTED, size: 13, anchor: 'end' }));
    return doc(W, H, 'Cosine restricted to [0, pi] and its inverse',
      'Axes from about -1.6 to 3.6. A faint full cosine curve, with the piece on [0, pi] drawn in blue, falling from (0, 1) to (pi, -1). Its reflection across the dashed line y = x, drawn in green, is the graph of inverse cosine, falling from (-1, pi) to (1, 0).', b);
  },

  'trig-equations-circle': () => {
    const W = 520, H = 420, cx = 260, cy = 230, s = 160;
    const b = [];
    b.push(`<line x1="40" y1="${cy}" x2="${W - 40}" y2="${cy}" stroke="${MUTED}" stroke-width="1.4"/>`);
    b.push(`<line x1="${cx}" y1="${H - 12}" x2="${cx}" y2="30" stroke="${MUTED}" stroke-width="1.4"/>`);
    b.push(`<circle cx="${cx}" cy="${cy}" r="${s}" fill="none" stroke="${INK}" stroke-width="2"/>`);
    b.push(`<line x1="50" y1="${cy - s / 2}" x2="${W - 50}" y2="${cy - s / 2}" stroke="${BLUE}" stroke-width="2" stroke-dasharray="7 5"/>`);
    b.push(text(W - 50, cy - s / 2 + 22, 'y = 1/2', { fill: BLUE, anchor: 'end' }));
    for (const [t, lab, anc] of [[PI / 6, 'π/6', 'start'], [5 * PI / 6, '5π/6', 'end']]) {
      const x = cx + s * Math.cos(t), y = cy - s * Math.sin(t);
      b.push(`<line x1="${cx}" y1="${cy}" x2="${r2(x)}" y2="${r2(y)}" stroke="${GREEN}" stroke-width="2.6"/>`);
      b.push(dot(x, y));
      b.push(text(x + (anc === 'start' ? 10 : -10), y - 10, lab, { anchor: anc, size: 16, weight: 'bold', fill: GREEN }));
    }
    b.push(`<path d="M${cx + 40},${cy} A40,40 0 0 0 ${r2(cx + 40 * Math.cos(PI / 6))},${r2(cy - 40 * Math.sin(PI / 6))}" fill="none" stroke="${INK}" stroke-width="1.5"/>`);
    b.push(`<path d="M${cx - 40},${cy} A40,40 0 0 1 ${r2(cx - 40 * Math.cos(PI / 6))},${r2(cy - 40 * Math.sin(PI / 6))}" fill="none" stroke="${INK}" stroke-width="1.5"/>`);
    b.push(text(cx + 56, cy - 8, 'π/6', { size: 13, anchor: 'start' }), text(cx - 56, cy - 8, 'π/6', { size: 13, anchor: 'end' }));
    b.push(text(cx + s + 6, cy + 18, '1', { size: 13, fill: MUTED, anchor: 'start' }));
    return doc(W, H, 'Two angles with sine 1/2',
      'A unit circle with the dashed horizontal line y = 1/2. The line meets the circle at two points, on the terminal rays of pi/6 in Quadrant I and 5 pi/6 in Quadrant II. Each ray makes an angle of pi/6 with the x-axis, so the two rays are mirror images across the y-axis.', b);
  },

  'sec-csc-cot-graphs': () => {
    const W = 600, H = 420;
    const P = panel({ id: 'b', left: 40, top: 20, w: 540, h: 370, x: [-0.3, 2 * PI + 0.3], y: [-4, 4],
      xTicks: [piT(1, 2), piT(1, 1), piT(3, 2), piT(2, 1)], yTicks: [[-3, '−3'], [-2, '−2'], [-1, '−1'], [1, '1'], [2, '2'], [3, '3']], xLabel: 'x', yLabel: 'y' });
    const b = [...P.out];
    for (const v of [PI / 2, 3 * PI / 2]) b.push(`<line x1="${r2(P.sx(v))}" y1="20" x2="${r2(P.sx(v))}" y2="390" stroke="${VERM}" stroke-width="1.6" stroke-dasharray="6 5"/>`);
    b.push(P.curve(Math.cos, -0.3, 2 * PI + 0.3, BLUE, { dash: true, width: 2 }));
    b.push(P.curve(x => 1 / Math.cos(x), -0.3, 2 * PI + 0.3, GREEN));
    b.push(text(P.sx(0.15), P.sy(3.3), 'y = sec x', { fill: GREEN, size: 15, anchor: 'start', weight: 'bold' }));
    b.push(text(P.sx(2.2), P.sy(0.45), 'y = cos x', { fill: BLUE, size: 15, anchor: 'start' }));
    return doc(W, H, 'The secant function and the cosine it comes from',
      'For x from 0 to 2 pi: the dashed cosine curve, and the graph of y = sec x = 1/cos x. Where cosine is 1 or -1, secant equals cosine. Where cosine is 0, at pi/2 and 3 pi/2, secant has dashed vertical asymptotes. Secant opens upward where cosine is positive and downward where cosine is negative, and its outputs are never between -1 and 1.', b);
  },

  'trig-identities-double': () => {
    const W = 600, H = 360;
    const P = panel({ id: 'c', left: 40, top: 20, w: 540, h: 310, x: [-0.2, 2 * PI + 0.2], y: [-1.4, 1.4],
      xTicks: [piT(1, 2), piT(1, 1), piT(3, 2), piT(2, 1)], yTicks: [[-1, '−1'], [1, '1']], xLabel: 'x', yLabel: 'y' });
    const b = [...P.out];
    b.push(P.curve(x => Math.cos(x) ** 2, -0.2, 2 * PI + 0.2, BLUE, { dash: true, width: 2 }));
    b.push(P.curve(x => Math.sin(x) ** 2, -0.2, 2 * PI + 0.2, VERM, { dash: true, width: 2 }));
    b.push(P.curve(x => Math.cos(2 * x), -0.2, 2 * PI + 0.2, GREEN));
    b.push(text(P.sx(PI - 0.6), P.sy(1.2), 'cos²x', { fill: BLUE, size: 14, anchor: 'start' }));
    b.push(text(P.sx(PI / 2 - 0.3), P.sy(1.2), 'sin²x', { fill: VERM, size: 14, anchor: 'start' }));
    b.push(text(P.sx(PI), P.sy(-1.25), 'cos(2x) = cos²x − sin²x', { fill: GREEN, size: 15, anchor: 'middle', weight: 'bold' }));
    return doc(W, H, 'cos(2x) as the difference of cos squared and sin squared',
      'For x from 0 to 2 pi: dashed graphs of cos squared x and sin squared x, each between 0 and 1, and the solid graph of cos(2x), between -1 and 1 with period pi. At every x the solid height equals the blue dashed height minus the orange dashed height; for example at x = 0 it is 1 - 0 = 1 and at x = pi/2 it is 0 - 1 = -1.', b);
  },
  'tangent-function-slope': () => {
    const W = 560, H = 480, cx = 200, cy = 290, s = 150, t = 0.9;
    const c = Math.cos(t), sn = Math.sin(t), tn = Math.tan(t);
    const b = [];
    // axes
    b.push(`<line x1="20" y1="${cy}" x2="${W - 20}" y2="${cy}" stroke="${MUTED}" stroke-width="1.4"/>`);
    b.push(`<line x1="${cx}" y1="${H - 20}" x2="${cx}" y2="48" stroke="${MUTED}" stroke-width="1.4"/>`);
    b.push(text(W - 24, cy - 8, 'x', { italic: true, anchor: 'end' }), text(cx + 10, 60, 'y', { italic: true, anchor: 'start' }));
    // unit circle
    b.push(`<circle cx="${cx}" cy="${cy}" r="${s}" fill="none" stroke="${INK}" stroke-width="2"/>`);
    // the line x = 1
    b.push(`<line x1="${cx + s}" y1="48" x2="${cx + s}" y2="${H - 20}" stroke="${BLUE}" stroke-width="2" stroke-dasharray="7 5"/>`);
    b.push(text(cx + s + 8, H - 28, 'x = 1', { fill: BLUE, anchor: 'start', size: 15 }));
    // terminal ray extended to x = 1
    b.push(`<line x1="${cx}" y1="${cy}" x2="${r2(cx + s)}" y2="${r2(cy - tn * s)}" stroke="${GREEN}" stroke-width="2.6"/>`);
    // tangent segment on x = 1
    b.push(`<line x1="${cx + s}" y1="${cy}" x2="${cx + s}" y2="${r2(cy - tn * s)}" stroke="${VERM}" stroke-width="4"/>`);
    // angle arc
    b.push(`<path d="M${cx + 38},${cy} A38,38 0 0 0 ${r2(cx + 38 * c)},${r2(cy - 38 * sn)}" fill="none" stroke="${INK}" stroke-width="1.6"/>`);
    b.push(text(cx + 50, cy - 16, 'θ', { italic: true, size: 17 }));
    // points
    b.push(dot(cx + c * s, cy - sn * s), dot(cx + s, cy - tn * s, VERM));
    b.push(text(cx + c * s - 10, cy - sn * s - 12, '(cos θ, sin θ)', { anchor: 'end', size: 15 }));
    b.push(text(cx + s + 12, cy - tn * s + 5, '(1, tan θ)', { anchor: 'start', size: 15, fill: VERM }));
    b.push(text(cx + s + 12, r2(cy - tn * s / 2 + 5), 'height tan θ', { anchor: 'start', size: 14, fill: VERM }));
    b.push(text(cx + s - 6, cy + 18, '1', { anchor: 'end', size: 14, fill: MUTED }));
    b.push(text(cx + 6, cy + 18, '0', { anchor: 'start', size: 14, fill: MUTED }));
    b.push(text(W / 2, 22, 'The terminal ray of θ meets x = 1 at height tan θ', { size: 15, weight: 'bold' }));
    return doc(W, H, 'Tangent of an angle as a height on the line x = 1',
      'A unit circle with an angle theta of about 0.9 radians in standard position. The terminal ray passes through the point (cos theta, sin theta) on the circle and continues to the dashed vertical line x = 1, which it meets at (1, tan theta). The vertical segment from the x-axis up to that point has length tan theta, which is also the slope of the terminal ray.', b);
  },

  'polar-coordinates-points': () => {
    const W = 520, H = 520, cx = 260, cy = 260, s = 50;
    const b = polarGrid(cx, cy, s, 4, 6);
    const pts = [['P', 3, PI / 6], ['Q', 2, 5 * PI / 6], ['R', 4, 3 * PI / 2], ['S', 1, PI]];
    for (const [n, r, t] of pts) {
      const x = cx + r * Math.cos(t) * s, y = cy - r * Math.sin(t) * s;
      b.push(dot(x, y));
      const dx = n === 'R' ? 14 : n === 'S' ? -6 : 10, dy = n === 'S' ? -12 : n === 'R' ? 4 : -10;
      b.push(text(x + dx, y + dy, n, { anchor: n === 'S' ? 'end' : 'start', size: 18, weight: 'bold', fill: GREEN }));
    }
    return doc(W, H, 'Four points on a polar grid',
      'A polar grid with circles of radius 1, 2, 3 and 4 around the pole and rays every pi/6 radians, labeled from 0 to 11 pi/6. Point P is on the circle of radius 3 on the ray at pi/6. Point Q is on the circle of radius 2 on the ray at 5 pi/6. Point R is on the circle of radius 4 on the ray at 3 pi/2, straight below the pole. Point S is on the circle of radius 1 on the ray at pi, to the left of the pole.', b);
  },

  'polar-curves-rose': () => {
    const W = 520, H = 520, cx = 260, cy = 260, s = 62;
    const b = polarGrid(cx, cy, s, 3, 4);
    b.push(`<path d="${polarPath(t => 3 * Math.sin(2 * t), 0, 2 * PI, cx, cy, s)}" fill="none" stroke="${GREEN}" stroke-width="2.6"/>`);
    b.push(text(W - 14, 30, 'r = 3 sin(2θ)', { size: 16, fill: GREEN, weight: 'bold', anchor: 'end' }));
    return doc(W, H, 'The polar graph of r = 3 sin(2 theta)',
      'A polar grid with circles of radius 1, 2 and 3 and rays every pi/4 radians. The curve r = 3 sin(2 theta) is a rose with four petals, each reaching distance 3 from the pole, centered on the rays at pi/4, 3 pi/4, 5 pi/4 and 7 pi/4. Every petal starts and ends at the pole.', b);
  },

  'polar-curves-limacon': () => {
    const W = 520, H = 460, cx = 200, cy = 230, s = 56;
    const b = polarGrid(cx, cy, s, 3, 4);
    b.push(`<path d="${polarPath(t => 1 + 2 * Math.cos(t), 0, 2 * PI, cx, cy, s)}" fill="none" stroke="${GREEN}" stroke-width="2.6"/>`);
    b.push(text(W - 14, 34, 'r = 1 + 2 cos θ', { size: 16, fill: GREEN, weight: 'bold', anchor: 'end' }));
    return doc(W, H, 'The polar graph of r = 1 + 2 cos theta',
      'A polar grid with circles of radius 1, 2 and 3 and rays every pi/4 radians. The curve r = 1 + 2 cos theta is a limacon with an inner loop. The large outer loop reaches farthest to the right along the polar axis and crosses the vertical axis at distance 1 above and below the pole. The curve passes through the pole twice, and a small inner loop lies to the right of the pole, inside the outer loop.', b);
  },

  'polar-rates-curve': () => {
    const W = 520, H = 520, cx = 260, cy = 290, s = 62;
    const b = polarGrid(cx, cy, s, 3, 4);
    b.push(`<path d="${polarPath(t => 1 + 2 * Math.sin(t), 0, 2 * PI, cx, cy, s)}" fill="none" stroke="${GREEN}" stroke-width="2.6"/>`);
    b.push(text(W - 14, 30, 'r = 1 + 2 sin θ', { size: 16, fill: GREEN, weight: 'bold', anchor: 'end' }));
    return doc(W, H, 'The polar graph of r = 1 + 2 sin theta',
      'A polar grid with circles of radius 1, 2 and 3 and rays every pi/4 radians. The curve r = 1 + 2 sin theta is a limacon with an inner loop, opening upward. The large outer loop reaches highest straight above the pole and crosses the polar axis at distance 1 on each side of the pole. The curve passes through the pole twice, and a small inner loop lies above the pole, inside the outer loop.', b);
  },
};

mkdirSync(OUT, { recursive: true });
const want = process.argv.slice(2);
for (const [id, make] of Object.entries(FIGS)) {
  if (want.length && !want.includes(id)) continue;
  writeFileSync(join(OUT, `${id}.svg`), make());
  console.log(`wrote precalculus/figures/${id}.svg`);
}
