/* AP® Calculus BC figures, author D: Unit 10 topics 10.6-10.15 (comparison tests
   through representing functions as power series).

   Every dot, partial sum and curve is computed from the series or function it
   shows, so a picture can never drift from its caption. Standalone SVG: white
   background, role="img" with <title> and <desc>, Arial/Helvetica, ink #1F2A28,
   emerald #0A5A34 (the BC accent) for emphasis, Okabe-Ito blue #0072B2,
   vermillion #D55E00 and orange #B26B00 for further curves.

     node scripts/apcalcbc-figures/author-d.mjs            writes calculus-bc/figures/<id>.svg
     node scripts/apcalcbc-figures/author-d.mjs --out DIR   writes to DIR instead (preview)

   The metadata (alt text, size, licence) is in calculus-bc/data/figures/<topic>.json. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const args = process.argv.slice(2);
const OUT = args.includes('--out') ? args[args.indexOf('--out') + 1] : join(ROOT, 'calculus-bc', 'figures');

const INK = '#1F2A28', EMERALD = '#5A1E96', BLUE = '#0072B2', VERM = '#D55E00', ORANGE = '#B26B00', GRID = '#E3E6E5', MUTED = '#5B6664';
const CRIMSON = EMERALD; // the helpers below default to the accent
const FONT = 'Arial, Helvetica, sans-serif';
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
      return `<tspan dy="${r2(dy)}" font-size="${r2(size * 0.68)}" ${st}>${esc(g.t)}</tspan><tspan dy="${r2(-dy)}" font-size="${size}"> </tspan>`;
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
    const skip = new Set(o.skipTicks || []);
    for (const v of xt) if (v !== ay && !skip.has('x' + v) && (!o.xEvery || Math.abs(v / o.xEvery - Math.round(v / o.xEvery)) < 1e-9)) {
      a.push(`<line x1="${r2(sx(v))}" y1="${r2(sy(ax) - 4)}" x2="${r2(sx(v))}" y2="${r2(sy(ax) + 4)}" stroke="${INK}" stroke-width="1.2"/>`);
      a.push(text(sx(v), sy(ax) + 18, (o.xTick || fmt)(v), { size: 13, anchor: 'middle', color: MUTED, halo: true }));
    }
    for (const v of yt) if (v !== ax && !skip.has('y' + v) && (!o.yEvery || Math.abs(v / o.yEvery - Math.round(v / o.yEvery)) < 1e-9)) {
      a.push(`<line x1="${r2(sx(ay) - 4)}" y1="${r2(sy(v))}" x2="${r2(sx(ay) + 4)}" y2="${r2(sy(v))}" stroke="${INK}" stroke-width="1.2"/>`);
      a.push(text(sx(ay) - 8, sy(v) + 4.5, fmt(v), { size: 13, anchor: 'end', color: MUTED, halo: true }));
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
  // Clip to the panel by breaking the path where it leaves the y-range.
  let d = '', pen = false;
  for (const [x, y] of pts) {
    if (y < y0 - 1e-9 || y > y1 + 1e-9) { pen = false; continue; }
    d += `${pen ? 'L' : 'M'}${r2(P.sx(x))} ${r2(P.sy(y))}`; pen = true;
  }
  return `<path d="${d}" fill="none" stroke="${o.color || CRIMSON}" stroke-width="${o.width || 2.6}" stroke-linejoin="round" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
}
function shade(P, f, a, b, o = {}) {
  const g = o.f2 || (() => 0);
  const top = samplePts(f, a, b, 300), bot = samplePts(g, a, b, 300).reverse();
  const pts = [...top, ...bot].map(([x, y]) => `${r2(P.sx(x))},${r2(P.sy(y))}`).join(' ');
  return `<polygon points="${pts}" fill="${o.color || CRIMSON}" fill-opacity="${o.opacity ?? 0.18}" stroke="none"/>`;
}
function polygon(P, pts, o = {}) {
  return `<polygon points="${pts.map(([x, y]) => `${r2(P.sx(x))},${r2(P.sy(y))}`).join(' ')}" fill="${o.fill || 'none'}" fill-opacity="${o.opacity ?? 1}" stroke="${o.stroke || 'none'}" stroke-width="${o.width || 1.4}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
}
function seg(P, x1, y1, x2, y2, o = {}) {
  return `<line x1="${r2(P.sx(x1))}" y1="${r2(P.sy(y1))}" x2="${r2(P.sx(x2))}" y2="${r2(P.sy(y2))}" stroke="${o.color || INK}" stroke-width="${o.width || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} stroke-linecap="round"/>`;
}
function dot(P, x, y, o = {}) {
  return `<circle cx="${r2(P.sx(x))}" cy="${r2(P.sy(y))}" r="${o.r || 5}" fill="${o.open ? '#fff' : (o.color || CRIMSON)}" stroke="${o.color || CRIMSON}" stroke-width="2"/>`;
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

/* Helpers for sequences of partial sums. */
const partial = (term, n0, N) => { const s = []; let t = 0; for (let n = n0; n < n0 + N; n++) { t += term(n); s.push(t); } return s; };
function dots(P, pts, o = {}) { return pts.map(([x, y]) => dot(P, x, y, { r: o.r || 4.5, color: o.color, open: o.open })).join(''); }
function poly(P, pts, o = {}) {
  return `<polyline points="${pts.map(([x, y]) => `${r2(P.sx(x))},${r2(P.sy(y))}`).join(' ')}" fill="none" stroke="${o.color || INK}" stroke-width="${o.width || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} stroke-linejoin="round"/>`;
}
function hline(P, y, o = {}) { const [a, b] = P.o.x; return seg(P, a, y, b, y, { color: o.color || MUTED, dash: o.dash ?? '7 5', width: o.width || 1.4 }); }
function key(x, y, rows) {
  return rows.map((r, i) => {
    const yy = y + i * 22;
    const mark = r.dot ? `<circle cx="${x + 12}" cy="${yy - 5}" r="4.5" fill="${r.open ? '#fff' : r.color}" stroke="${r.color}" stroke-width="2"/>`
      : `<line x1="${x}" y1="${yy - 5}" x2="${x + 24}" y2="${yy - 5}" stroke="${r.color}" stroke-width="${r.width || 2.6}"${r.dash ? ` stroke-dasharray="${r.dash}"` : ''}/>`;
    return mark + text(x + 32, yy, r.label, { size: 13.5, color: r.color === MUTED ? MUTED : INK });
  }).join('');
}
const I = s => ({ t: s, i: true });
const figs = {};
const fact = n => { let p = 1; for (let k = 2; k <= n; k++) p *= k; return p; };

/* 10.6: partial sums of a smaller positive series stay under a convergent one. */
{
  const id = 'comparison-partial-sums';
  const W = 720, H = 420, b = [], N = 12;
  const A = partial(n => 1 / (n * n), 1, N), B = partial(n => 1 / (n * n + 1), 1, N), L = Math.PI ** 2 / 6;
  const P = panel({ left: 70, top: 70, width: 560, height: 280, x: [0, 13], y: [0, 1.8], xStep: 1, yStep: 0.2, yEvery: 0.4, xLabel: [I('N')], yLabel: [I('S'), { t: 'N', i: true, sub: true }] });
  b.push(...P.out, P.axes(), hline(P, L));
  b.push(dots(P, A.map((y, i) => [i + 1, y]), { color: EMERALD }), dots(P, B.map((y, i) => [i + 1, y]), { color: BLUE, open: true }));
  b.push(text(P.sx(13), P.sy(L) - 8, 'π²/6 ≈ 1.645', { anchor: 'end', size: 13.5, color: MUTED, halo: true }));
  b.push(key(380, 300, [{ dot: true, color: EMERALD, label: 'partial sums of Σ 1/n²' }, { dot: true, open: true, color: BLUE, label: 'partial sums of Σ 1/(n² + 1)' }]));
  b.push(text(70, 34, 'Smaller positive terms, smaller partial sums: both stay under the same ceiling.', { size: 15, bold: true }));
  b.push(text(70, H - 18, 'Each term 1/(n² + 1) is below 1/n², so every partial sum of the lower series is below π²/6. It converges.', { size: 13.5, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Partial sums of a smaller positive series stay under a convergent one',
    `Partial sums for N = 1 to 12. Filled dots: the series of 1 over n squared, rising from 1 to ${A[N - 1].toFixed(3)} and levelling off under a dashed line at pi squared over 6, about 1.645. Open dots: the series of 1 over (n squared + 1), rising from 0.5 to ${B[N - 1].toFixed(3)}, always below the filled dots.`, b) };
}

/* 10.7: alternating partial sums zigzag in on the sum. */
{
  const id = 'alt-partial-sums';
  const W = 720, H = 420, b = [], N = 14;
  const S = partial(n => (n % 2 ? 1 : -1) / n, 1, N), L = Math.log(2);
  const P = panel({ left: 70, top: 70, width: 560, height: 280, x: [0, 15], y: [0.4, 1.05], xStep: 1, yStep: 0.05, yEvery: 0.1, xLabel: [I('N')], yLabel: [I('S'), { t: 'N', i: true, sub: true }] });
  b.push(...P.out, P.axes(), hline(P, L));
  b.push(poly(P, S.map((y, i) => [i + 1, y]), { color: EMERALD, width: 1.4 }), dots(P, S.map((y, i) => [i + 1, y]), { color: EMERALD }));
  b.push(text(P.sx(15), P.sy(1.0), 'dashed line: the sum, about 0.693', { anchor: 'end', size: 13.5, color: MUTED, halo: true }));
  b.push(text(P.sx(1) + 10, P.sy(1) + 4, 'S₁ = 1', { size: 13.5, halo: true }), text(P.sx(2) + 10, P.sy(0.5) + 4, 'S₂ = 1/2', { size: 13.5, halo: true }));
  b.push(text(70, 34, 'The partial sums of 1 − 1/2 + 1/3 − 1/4 + ⋯ overshoot, undershoot, and close in.', { size: 15, bold: true }));
  b.push(text(70, H - 18, 'Each step is the next term: up after an odd N, down after an even one, each smaller than the last.', { size: 13.5, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Partial sums of an alternating series zigzag toward its sum',
    'Partial sums S sub N of the series 1 minus 1/2 plus 1/3 minus 1/4 and so on, for N = 1 to 14, joined by a zigzag line. Odd partial sums lie above a dashed line at about 0.693 and even ones below it; the swings shrink as N grows, so the partial sums close in on the sum.', b) };
}

/* 10.8: the ratio of consecutive terms settles at a limit below 1. */
{
  const id = 'ratio-test-ratios';
  const W = 720, H = 420, b = [], N = 15;
  const r = n => ((n + 1) ** 2) / (3 * n * n);
  const P = panel({ left: 70, top: 70, width: 560, height: 280, x: [0, 16], y: [0, 1.5], xStep: 1, yStep: 0.25, yEvery: 0.5, xLabel: [I('n')], yLabel: [{ t: 'a', i: true }, { t: 'n+1', i: true, sub: true }, { t: ' / ' }, { t: 'a', i: true }, { t: 'n', i: true, sub: true }] });
  b.push(...P.out, P.axes(), hline(P, 1, { color: VERM, dash: '' , width: 1.8 }), hline(P, 1 / 3));
  b.push(dots(P, Array.from({ length: N }, (_, i) => [i + 1, r(i + 1)]), { color: EMERALD }));
  b.push(text(P.sx(16), P.sy(1) - 8, '1: a limit below it converges, above it diverges', { anchor: 'end', size: 13.5, color: VERM, halo: true }));
  b.push(text(P.sx(16), P.sy(1 / 3) + 20, 'limit 1/3', { anchor: 'end', size: 13.5, color: MUTED, halo: true }));
  b.push(text(70, 34, 'Ratios of consecutive terms of Σ n²/3ⁿ approach 1/3', { size: 15, bold: true }));
  b.push(text(70, H - 18, 'The first ratio, 4/3, is above 1; only the limit matters. The limit 1/3 is below 1, so the series converges.', { size: 13.5, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Ratios of consecutive terms approach a limit below 1',
    'Dots at height (n + 1) squared over 3 n squared for n = 1 to 15, the ratio of consecutive terms of the series of n squared over 3 to the n. The first dot is at 4/3, above a solid line at 1; the rest fall below it and approach a dashed line at 1/3.', b) };
}

/* 10.9: the same terms with and without the signs. */
{
  const id = 'abs-cond-sums';
  const W = 720, H = 420, b = [], N = 20;
  const A = partial(n => (n % 2 ? 1 : -1) / n, 1, N), H1 = partial(n => 1 / n, 1, N);
  const P = panel({ left: 70, top: 70, width: 560, height: 280, x: [0, 21], y: [0, 4], xStep: 1, yStep: 0.5, xEvery: 5, yEvery: 1, xLabel: [I('N')], yLabel: [I('S'), { t: 'N', i: true, sub: true }] });
  b.push(...P.out, P.axes(), hline(P, Math.log(2)));
  b.push(dots(P, H1.map((y, i) => [i + 1, y]), { color: BLUE, open: true, r: 4 }), dots(P, A.map((y, i) => [i + 1, y]), { color: EMERALD, r: 4 }));
  b.push(key(90, 104, [{ dot: true, open: true, color: BLUE, label: 'Σ 1/n: the sizes of the terms' }, { dot: true, color: EMERALD, label: 'Σ (−1)ⁿ⁺¹/n: the same terms with their signs' }]));
  b.push(text(70, 34, 'Same sizes, different signs: one series grows without bound, the other settles.', { size: 15, bold: true }));
  b.push(text(70, H - 18, `After 20 terms Σ 1/n has reached ${H1[N - 1].toFixed(2)} and is still growing; the alternating series stays near 0.693.`, { size: 13.5, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'A conditionally convergent series and the series of its absolute values',
    `Partial sums for N = 1 to 20. Open dots: the harmonic series, the sum of 1 over n, climbing steadily to ${H1[N - 1].toFixed(2)} with no ceiling. Filled dots: the alternating harmonic series, zigzagging around a dashed line at about 0.693. The alternating series converges but the series of absolute values diverges: conditional convergence.`, b) };
}

/* 10.10: the sum lies within the first omitted term of a partial sum. */
{
  const id = 'alt-error-band';
  const W = 720, H = 440, b = [], N = 8;
  const a = n => 1 / (n * n), S = partial(n => (n % 2 ? 1 : -1) * a(n), 1, N), L = Math.PI ** 2 / 12;
  const P = panel({ left: 70, top: 70, width: 560, height: 290, x: [0, 9], y: [0.7, 1.02], xStep: 1, yStep: 0.02, yEvery: 0.1, xLabel: [I('N')], yLabel: [I('S'), { t: 'N', i: true, sub: true }] });
  b.push(...P.out);
  b.push(polygon(P, [[0, S[3]], [9, S[3]], [9, S[3] + a(5)], [0, S[3] + a(5)]], { fill: EMERALD, opacity: 0.12 }));
  b.push(P.axes(), hline(P, L));
  b.push(poly(P, S.map((y, i) => [i + 1, y]), { color: INK, width: 1.2 }), dots(P, S.map((y, i) => [i + 1, y]), { color: EMERALD }));
  b.push(seg(P, 0.45, S[3], 0.45, S[3] + a(5), { color: EMERALD, width: 2.2 }));
  b.push(text(P.sx(0.45) + 8, P.sy(S[3] + a(5)) - 8, 'width a₅ = 1/25', { size: 13.5, bold: true, color: EMERALD, halo: true }));
  b.push(text(P.sx(9), P.sy(0.98), 'dashed line: the sum π²/12 ≈ 0.822', { anchor: 'end', size: 13.5, color: MUTED, halo: true }));
  b.push(text(P.sx(4) + 10, P.sy(S[3]) + 22, `S₄ = 115/144 ≈ ${S[3].toFixed(4)}`, { size: 13.5, halo: true }));
  b.push(text(70, 34, 'The sum lies between S₄ and S₄ + a₅: the error is at most the first term left out.', { size: 15, bold: true }));
  b.push(text(70, H - 18, `Here |S − S₄| ≈ ${(L - S[3]).toFixed(4)}, which is less than a₅ = 0.04.`, { size: 13.5, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'The alternating series error bound as a band',
    `Partial sums of 1 minus 1/4 plus 1/9 minus 1/16 and so on, for N = 1 to 8, zigzagging around a dashed line at pi squared over 12, about 0.822. A shaded band runs from S sub 4 = 115/144, about ${S[3].toFixed(4)}, up to S sub 4 plus the next term, 1/25. The sum lies inside the band: the error of S sub 4 is about ${(L - S[3]).toFixed(4)}, less than 1/25.`, b) };
}

/* 10.11: Taylor polynomials of cos x wrap the curve over a wider stretch as the degree grows. */
{
  const id = 'taylor-cos-wrap';
  const W = 720, H = 440, b = [];
  const Pn = k => x => { let s = 0; for (let j = 0; 2 * j <= k; j++) s += (j % 2 ? -1 : 1) * x ** (2 * j) / fact(2 * j); return s; };
  const P = panel({ left: 50, top: 70, width: 460, height: 300, x: [-6.5, 6.5], y: [-2, 2], xStep: 1, yStep: 0.5, yEvery: 1, xEvery: 2, xLabel: [I('x')], yLabel: [I('y')] });
  b.push(...P.out, P.axes());
  b.push(curve(P, Pn(2), -6.5, 6.5, { color: BLUE, width: 2.2 }), curve(P, Pn(4), -6.5, 6.5, { color: VERM, width: 2.2, dash: '8 5' }), curve(P, Pn(6), -6.5, 6.5, { color: ORANGE, width: 2.2, dash: '3 4' }));
  b.push(curve(P, Math.cos, -6.5, 6.5, { color: EMERALD, width: 3 }));
  b.push(key(540, 110, [{ color: EMERALD, width: 3, label: 'y = cos x' }, { color: BLUE, label: 'P₂(x) = 1 − x²/2' }, { color: VERM, dash: '8 5', label: 'P₄(x) adds x⁴/24' }, { color: ORANGE, dash: '3 4', label: 'P₆(x) adds −x⁶/720' }]));
  b.push(text(60, 34, 'Taylor polynomials for cos x about x = 0: more terms, a closer fit over a wider stretch.', { size: 15, bold: true }));
  b.push(text(60, H - 18, 'Each polynomial matches cos x and its derivatives at x = 0, then peels away farther out.', { size: 13.5, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Taylor polynomials for cos x wrap the curve',
    'The graph of y = cos x from x = -6.5 to 6.5 with three Taylor polynomials about x = 0: P sub 2 = 1 minus x squared over 2, a downward parabola that follows cos x for about |x| < 1; P sub 4, which adds x to the fourth over 24 and follows it to about |x| = 2; and P sub 6, which follows it to about |x| = 3. All three agree with cos x at x = 0 and peel away farther out.', b) };
}

/* 10.12: the actual error stays under the Lagrange bound. */
{
  const id = 'lagrange-error-cos';
  const W = 720, H = 440, b = [];
  const err = x => Math.abs(Math.cos(x) - (1 - x * x / 2)), bound = x => x ** 4 / 24;
  const P = panel({ left: 70, top: 120, width: 560, height: 250, x: [-1.6, 1.6], y: [0, 0.3], xStep: 0.2, yStep: 0.05, xEvery: 0.4, yEvery: 0.1, xLabel: [I('x')], yLabel: [{ t: 'error' }] });
  b.push(...P.out, shade(P, bound, -1.6, 1.6, { color: EMERALD, opacity: 0.1 }), P.axes());
  b.push(curve(P, bound, -1.6, 1.6, { color: EMERALD, width: 2.6, dash: '8 5' }), curve(P, err, -1.6, 1.6, { color: BLUE, width: 2.8 }));
  b.push(seg(P, 1, 0, 1, bound(1), { color: MUTED, dash: '3 4' }), dot(P, 1, bound(1), { color: EMERALD, r: 4 }), dot(P, 1, err(1), { color: BLUE, r: 4 }));
  b.push(text(P.sx(1) - 8, P.sy(bound(1)) - 10, `bound 1/24 ≈ ${bound(1).toFixed(4)}`, { anchor: 'end', size: 13.5, color: EMERALD, bold: true, halo: true }));
  b.push(text(P.sx(1) + 8, P.sy(err(1)) + 18, `actual ≈ ${err(1).toFixed(4)}`, { size: 13.5, color: BLUE, bold: true, halo: true }));
  b.push(key(80, 66, [{ color: EMERALD, dash: '8 5', label: 'Lagrange bound x⁴/4! (max |f⁽⁴⁾| = 1)' }, { color: BLUE, label: 'actual error |cos x − P₂(x)|' }]));
  b.push(text(70, 34, 'For cos x and P₂(x) = 1 − x²/2, the actual error never rises above the bound.', { size: 15, bold: true }));
  b.push(text(70, H - 18, 'The bound uses the largest size the next derivative can have, so it is safe but larger than the error.', { size: 13.5, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'The Lagrange error bound sits above the actual error',
    `On -1.6 to 1.6, a dashed curve x to the fourth over 24, the Lagrange error bound for cos x and its second-degree Taylor polynomial about 0, with the region under it lightly shaded, and a solid curve, the actual error |cos x minus (1 minus x squared over 2)|, which stays below it. At x = 1 the bound is about ${bound(1).toFixed(4)} and the actual error about ${err(1).toFixed(4)}.`, b) };
}

/* 10.13: the interval of convergence on a number line. */
{
  const id = 'interval-number-line';
  const W = 760, H = 270, b = [];
  const P = panel({ left: 50, top: 120, width: 660, height: 60, x: [-5, 7], y: [0, 1], xStep: 1, yStep: 1, grid: false });
  const y0 = 0.3;
  b.push(seg(P, -5, y0, 7, y0, { color: INK, width: 1.6 }));
  for (let v = -5; v <= 7; v++) { b.push(seg(P, v, y0 - 0.08, v, y0 + 0.08, { color: INK, width: 1.2 })); b.push(text(P.sx(v), P.sy(y0) + 26, fmt(v), { anchor: 'middle', size: 13, color: MUTED })); }
  b.push(`<line x1="${r2(P.sx(-3))}" y1="${r2(P.sy(y0))}" x2="${r2(P.sx(5))}" y2="${r2(P.sy(y0))}" stroke="${EMERALD}" stroke-width="7" stroke-linecap="butt"/>`);
  b.push(dot(P, -3, y0, { color: EMERALD, r: 7 }), dot(P, 5, y0, { color: EMERALD, r: 7, open: true }), dot(P, 1, y0, { color: INK, r: 4 }));
  const arrowY = P.sy(y0) - 34;
  b.push(`<g stroke="${MUTED}" stroke-width="1.4" fill="none"><line x1="${r2(P.sx(1))}" y1="${r2(arrowY)}" x2="${r2(P.sx(5) - 4)}" y2="${r2(arrowY)}"/><line x1="${r2(P.sx(1))}" y1="${r2(arrowY)}" x2="${r2(P.sx(-3) + 4)}" y2="${r2(arrowY)}"/></g>`);
  b.push(text(P.sx(3), arrowY - 8, 'R = 4', { anchor: 'middle', size: 13.5, color: MUTED }), text(P.sx(-1), arrowY - 8, 'R = 4', { anchor: 'middle', size: 13.5, color: MUTED }));
  b.push(text(P.sx(1), P.sy(y0) + 48, 'center 1', { anchor: 'middle', size: 13.5 }));
  b.push(text(P.sx(-3), P.sy(y0) + 70, 'x = −3: Σ (−1)ⁿ/n converges', { anchor: 'middle', size: 13.5, color: EMERALD, bold: true }));
  b.push(text(P.sx(5), P.sy(y0) + 70, 'x = 5: Σ 1/n diverges', { anchor: 'middle', size: 13.5, color: VERM, bold: true }));
  b.push(text(P.sx(-4.6), P.sy(y0) - 14, 'diverges', { anchor: 'middle', size: 13, color: MUTED }), text(P.sx(6.4), P.sy(y0) - 14, 'diverges', { anchor: 'middle', size: 13, color: MUTED }));
  b.push(text(50, 34, 'Σ (x − 1)ⁿ/(n·4ⁿ): the ratio test gives |x − 1| < 4; each endpoint is tested on its own', { size: 15, bold: true }));
  b.push(text(50, 62, 'Interval of convergence [−3, 5): filled dot = included, open dot = left out.', { size: 14, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'An interval of convergence on a number line',
    'A number line from -5 to 7. The power series sum of (x - 1) to the n over n times 4 to the n is centered at 1 with radius 4, marked by arrows to -3 and 5. A thick bar runs from -3 to 5, with a filled dot at -3, where the series becomes the alternating harmonic series and converges, and an open dot at 5, where it becomes the harmonic series and diverges. Outside the bar the series diverges. The interval of convergence is [-3, 5).', b) };
}

/* 10.14: Taylor polynomials for e^x approach the curve. */
{
  const id = 'taylor-series-exp';
  const W = 720, H = 440, b = [];
  const Pn = k => x => { let s = 0; for (let j = 0; j <= k; j++) s += x ** j / fact(j); return s; };
  const P = panel({ left: 70, top: 70, width: 560, height: 300, x: [-3, 2.5], y: [-2, 8], xStep: 0.5, yStep: 1, xEvery: 1, yEvery: 2, xLabel: [I('x')], yLabel: [I('y')] });
  b.push(...P.out, P.axes());
  b.push(curve(P, Pn(1), -3, 2.5, { color: BLUE, width: 2.2 }), curve(P, Pn(2), -3, 2.5, { color: VERM, width: 2.2, dash: '8 5' }), curve(P, Pn(3), -3, 2.5, { color: ORANGE, width: 2.2, dash: '3 4' }));
  b.push(curve(P, Math.exp, -3, 2.5, { color: EMERALD, width: 3 }));
  b.push(key(100, 92, [{ color: EMERALD, width: 3, label: 'y = eˣ' }, { color: BLUE, label: '1 + x' }, { color: VERM, dash: '8 5', label: '1 + x + x²/2!' }, { color: ORANGE, dash: '3 4', label: '1 + x + x²/2! + x³/3!' }]));
  b.push(text(70, 34, 'The partial sums of 1 + x + x²/2! + x³/3! + ⋯ close in on eˣ.', { size: 15, bold: true }));
  b.push(text(70, H - 18, `At x = 2: 3, 5, 6.333, ... approaching e² ≈ ${Math.exp(2).toFixed(3)}. The series converges to eˣ for every x.`, { size: 13.5, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Partial sums of the Maclaurin series for e to the x',
    'The graph of y = e to the x from x = -3 to 2.5 with the first three Taylor polynomials about 0: the line 1 + x, the parabola 1 + x + x squared over 2, and the cubic that adds x cubed over 6. Each new term brings the polynomial closer to e to the x over a wider stretch; at x = 2 their values are 3, 5 and about 6.333, approaching e squared, about 7.389.', b) };
}

/* 10.15: geometric partial sums match 1/(1 - x) only inside (-1, 1). */
{
  const id = 'geometric-wrap';
  const W = 720, H = 440, b = [];
  const Pn = k => x => { let s = 0; for (let j = 0; j <= k; j++) s += x ** j; return s; };
  const P = panel({ left: 60, top: 70, width: 430, height: 300, x: [-1.6, 1.6], y: [-2, 8], xStep: 0.2, yStep: 1, xEvery: 0.8, yEvery: 2, xLabel: [I('x')], yLabel: [I('y')] });
  b.push(...P.out);
  b.push(polygon(P, [[-1, -2], [1, -2], [1, 8], [-1, 8]], { fill: EMERALD, opacity: 0.07 }));
  b.push(P.axes(), seg(P, 1, -2, 1, 8, { color: MUTED, dash: '6 5', width: 1.3 }), seg(P, -1, -2, -1, 8, { color: MUTED, dash: '6 5', width: 1.3 }));
  b.push(curve(P, Pn(2), -1.6, 1.6, { color: BLUE, width: 2.2 }), curve(P, Pn(5), -1.6, 1.6, { color: VERM, width: 2.2, dash: '8 5', n: 800 }), curve(P, Pn(10), -1.6, 1.6, { color: ORANGE, width: 2.2, dash: '3 4', n: 1200 }));
  b.push(curve(P, x => 1 / (1 - x), -1.6, 0.875, { color: EMERALD, width: 3 }), curve(P, x => 1 / (1 - x), 1.13, 1.6, { color: EMERALD, width: 3 }));
  b.push(key(530, 110, [{ color: EMERALD, width: 3, label: 'y = 1/(1 − x)' }, { color: BLUE, label: '1 + x + x²' }, { color: VERM, dash: '8 5', label: 'through x⁵' }, { color: ORANGE, dash: '3 4', label: 'through x¹⁰' }]));
  b.push(text(P.sx(0), P.sy(7.2), '−1 < x < 1', { anchor: 'middle', size: 14, bold: true, color: EMERALD, halo: true }));
  b.push(text(70, 34, '1 + x + x² + ⋯ = 1/(1 − x) inside (−1, 1) and nowhere else.', { size: 15, bold: true }));
  b.push(text(70, H - 18, 'Inside the shaded strip the partial sums close in on the curve; outside it they swing or climb away.', { size: 13.5, color: MUTED }));
  figs[id] = { w: W, h: H, svg: svg(id, W, H, 'Geometric partial sums match 1/(1 - x) only on (-1, 1)',
    'The graph of y = 1/(1 - x) from x = -1.6 to 1.6, with a vertical asymptote at x = 1, and three partial sums of 1 + x + x squared + ...: through x squared, through x to the fifth and through x to the tenth. A shaded strip marks -1 < x < 1, where the partial sums close in on the curve. To the left of -1 they swing up and down with growing size; to the right of 1 they climb, while 1/(1 - x) is negative there.', b) };
}

mkdirSync(OUT, { recursive: true });
for (const [id, f] of Object.entries(figs)) writeFileSync(join(OUT, `${id}.svg`), f.svg);
if (args.includes('--meta')) console.log(JSON.stringify(Object.fromEntries(Object.entries(figs).map(([id, f]) => [id, { w: f.w, h: f.h }]))));
console.log(`Author D figures: ${Object.keys(figs).length} written to ${OUT}`);
