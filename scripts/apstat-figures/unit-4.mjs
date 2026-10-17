/* Unit 4 figures (Inference for Quantitative Data: Means), drawn from data.
   Every curve comes from ApStatDist (statistics/assets/stat-dist.js, loaded
   through scripts/lib/apstat-mathlib.mjs) and every histogram from a seeded
   simulation, so each picture shows exactly the numbers its caption states.
   Writes statistics/figures/<id>.svg and registers each one in
   statistics/data/figures/<topic>.json.

     node scripts/apstat-figures/unit-4.mjs            write every figure
     node scripts/apstat-figures/unit-4.mjs --list     print the ids and the numbers they show */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Dist } from '../lib/apstat-mathlib.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const INK = '#1F2A28', PLUM = '#6E2470', BLUE = '#0072B2', GREEN = '#009E73', VERM = '#D55E00', GRID = '#D9DEDC', MUTED = '#5A6662';
const FONT = 'Arial, Helvetica, sans-serif';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const f2 = v => (Math.round(v * 100) / 100).toString();
const num = v => String(+v.toFixed(6)).replace('-', '−');

/* ------------------------------------------------------------ randomness */
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function normal(r) { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
// Gamma(shape k >= 1, scale theta), Marsaglia and Tsang.
function gamma(r, k, theta) {
  const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
  for (;;) { const x = normal(r), v = (1 + c * x) ** 3; if (v <= 0) continue; const u = r(); if (Math.log(u) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v * theta; }
}

/* ------------------------------------------------------------ drawing */
function svgDoc(w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d" font-family="${FONT}">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body}
</svg>
`;
}
const text = (x, y, s, o = {}) => `<text x="${f2(x)}" y="${f2(y)}" font-size="${o.size || 15}" fill="${o.fill || INK}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.weight ? ` font-weight="${o.weight}"` : ''}${o.italic ? ' font-style="italic"' : ''}${o.halo ? ' paint-order="stroke" stroke="#FFFFFF" stroke-width="5" stroke-linejoin="round"' : ''}>${esc(s)}</text>`;
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${f2(x1)}" y1="${f2(y1)}" x2="${f2(x2)}" y2="${f2(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.width || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const rect = (x, y, w, h, o = {}) => `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" fill="${o.fill || 'none'}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.width || 1}"` : ''}${o.opacity ? ` fill-opacity="${o.opacity}"` : ''}${o.rx ? ` rx="${o.rx}"` : ''}/>`;
const circle = (x, y, r, o = {}) => `<circle cx="${f2(x)}" cy="${f2(y)}" r="${r}" fill="${o.fill || INK}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.width || 1.5}"` : ''}/>`;
const path = (d, o = {}) => `<path d="${d}" fill="${o.fill || 'none'}"${o.opacity ? ` fill-opacity="${o.opacity}"` : ''} stroke="${o.stroke || 'none'}" stroke-width="${o.width || 2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;

/* A horizontal axis from a to b drawn at pixel y between px0 and px1. */
function xAxis(a, b, px0, px1, y, ticks, o = {}) {
  const sx = v => px0 + (v - a) / (b - a) * (px1 - px0);
  let s = line(px0, y, px1, y, { stroke: INK, width: 1.2 });
  for (const t of ticks) { s += line(sx(t), y, sx(t), y + 5, { width: 1.2 }); s += text(sx(t), y + 20, o.fmt ? o.fmt(t) : num(t), { anchor: 'middle', size: 14 }); }
  if (o.label) s += text((px0 + px1) / 2, y + 42, o.label, { anchor: 'middle', size: 15 });
  return { svg: s, sx };
}
function curvePath(f, a, b, sx, sy, n = 240) {
  let d = '';
  for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; d += `${i ? 'L' : 'M'}${f2(sx(x))},${f2(sy(f(x)))}`; }
  return d;
}
function areaPath(f, a, b, sx, sy, base, n = 160) {
  let d = `M${f2(sx(a))},${f2(base)}`;
  for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; d += `L${f2(sx(x))},${f2(sy(f(x)))}`; }
  return d + `L${f2(sx(b))},${f2(base)}Z`;
}
function histogram(values, start, width, nb) {
  const c = new Array(nb).fill(0);
  for (const v of values) { const j = Math.floor((v - start) / width); if (j >= 0 && j < nb) c[j]++; }
  return c.map(k => k / values.length / width);
}
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const sdv = a => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };

/* ------------------------------------------------------------ the figures */
const FIGS = {};

/* 4.1: the population of wait times and the sampling distribution of x-bar for n = 4 and n = 40. */
FIGS['xbar-sampling-panels'] = { topic: 'sampling-dist-mean', w: 720, h: 640, build() {
  const k = (4.2 / 2.8) ** 2, theta = 2.8 * 2.8 / 4.2, r = rng(4101);
  const pop = Array.from({ length: 20000 }, () => gamma(r, k, theta));
  const means = n => Array.from({ length: 5000 }, () => { let s = 0; for (let i = 0; i < n; i++) s += gamma(r, k, theta); return s / n; });
  const m4 = means(4), m40 = means(40);
  const panels = [
    { data: pop, title: 'Population: single wait times', note: `mean ${mean(pop).toFixed(2)}, SD ${sdv(pop).toFixed(2)} (μ = 4.2, σ = 2.8)`, color: MUTED, width: 0.5 },
    { data: m4, title: 'Sample means, n = 4 cars (5,000 samples)', note: `mean ${mean(m4).toFixed(2)}, SD ${sdv(m4).toFixed(2)} (σ/√n = ${(2.8 / 2).toFixed(2)})`, color: BLUE, width: 0.25 },
    { data: m40, title: 'Sample means, n = 40 cars (5,000 samples)', note: `mean ${mean(m40).toFixed(2)}, SD ${sdv(m40).toFixed(3)} (σ/√n = ${(2.8 / Math.sqrt(40)).toFixed(3)})`, color: PLUM, width: 0.1 },
  ];
  const a = 0, b = 14, px0 = 60, px1 = 690;
  let body = '';
  panels.forEach((P, i) => {
    const top = 18 + i * 196, base = top + 150;
    const h = histogram(P.data, 0, P.width, Math.ceil(b / P.width));
    const peak = Math.max(...h), sy = v => base - v / peak * 110;
    const ax = xAxis(a, b, px0, px1, base, [0, 2, 4, 6, 8, 10, 12, 14], i === 2 ? { label: 'wait time (minutes)' } : {});
    body += text(px0, top + 14, P.title, { weight: 'bold', size: 16 }) + text(px1, top + 14, P.note, { anchor: 'end', size: 14, fill: MUTED });
    h.forEach((v, j) => { if (v > 0) body += rect(ax.sx(j * P.width), sy(v), ax.sx(P.width) - ax.sx(0), base - sy(v), { fill: P.color, opacity: 0.85, stroke: '#FFFFFF', width: P.width < 0.2 ? 0.3 : 0.8 }); });
    body += line(ax.sx(4.2), top + 24, ax.sx(4.2), base, { stroke: VERM, width: 2, dash: '6 4' });
    if (i === 0) body += text(ax.sx(4.2) + 6, top + 40, 'μ = 4.2', { fill: VERM, size: 14, weight: 'bold' });
    body += ax.svg;
  });
  body += text(px0, 636, 'Bar heights are scaled within each panel; each panel shows relative frequency per minute.', { size: 13, fill: MUTED });
  return {
    numbers: { popMean: mean(pop), popSd: sdv(pop), m4: [mean(m4), sdv(m4)], m40: [mean(m40), sdv(m40)] },
    title: 'Sampling distribution of the sample mean',
    alt: `Three histograms on the same axis from 0 to 14 minutes. Top: 20,000 simulated drive-through wait times, strongly skewed right, mean ${mean(pop).toFixed(2)} and standard deviation ${sdv(pop).toFixed(2)}. Middle: 5,000 means of samples of 4 cars, still skewed right, standard deviation ${sdv(m4).toFixed(2)}. Bottom: 5,000 means of samples of 40 cars, bell shaped and narrow, standard deviation ${sdv(m40).toFixed(3)}, close to 2.8 divided by the square root of 40. A dashed line marks the population mean 4.2 in every panel.`,
    body,
  };
} };


/* 4.2: the standard normal and t distributions with 3 and 15 df, with the 95% critical values. */
FIGS['t-vs-normal'] = { topic: 'ci-one-mean', w: 720, h: 420, build() {
  const a = -4.5, b = 4.5, px0 = 50, px1 = 690, base = 330;
  const ax = xAxis(a, b, px0, px1, base, [-4, -3, -2, -1, 0, 1, 2, 3, 4], { label: 'standardized value' });
  const peak = Dist.normPdf(0), sy = v => base - v / peak * 250;
  const t3 = x => Dist.tPdf(x, 3), t15 = x => Dist.tPdf(x, 15), z = x => Dist.normPdf(x);
  const c3 = Dist.invT(0.975, 3), c15 = Dist.invT(0.975, 15), cz = Dist.invNorm(0.975);
  let body = '';
  // the outer 5% of the df 3 curve, shaded
  body += path(areaPath(t3, a, -c3, ax.sx, sy, base), { fill: VERM, opacity: 0.6 }) + path(areaPath(t3, c3, b, ax.sx, sy, base), { fill: VERM, opacity: 0.6 });
  body += path(curvePath(z, a, b, ax.sx, sy), { stroke: INK, width: 2.5 });
  body += path(curvePath(t15, a, b, ax.sx, sy), { stroke: BLUE, width: 2.5, dash: '8 5' });
  body += path(curvePath(t3, a, b, ax.sx, sy), { stroke: VERM, width: 2.5 });
  const mark = (c, color, label, y) => { let s = ''; for (const v of [-c, c]) s += line(ax.sx(v), base, ax.sx(v), y + 6, { stroke: color, width: 1.5, dash: '3 3' }); return s + text(ax.sx(c) + 4, y, label, { fill: color, size: 14, weight: 'bold' }); };
  body += mark(cz, INK, `z* = ${cz.toFixed(2)}`, 160) + mark(c15, BLUE, `t* = ${c15.toFixed(3)}`, 200) + mark(c3, VERM, `t* = ${c3.toFixed(3)}`, 240);
  body += ax.svg;
  // legend
  const L = [[INK, '', 'standard normal'], [BLUE, '8 5', 't distribution, df = 15'], [VERM, '', 't distribution, df = 3']];
  L.forEach(([c, dash, lab], i) => { body += line(px0, 26 + i * 24, px0 + 40, 26 + i * 24, { stroke: c, width: 3, dash }) + text(px0 + 50, 31 + i * 24, lab, { size: 15 }); });
  body += text(px1, 31, 'Shaded: the outer 5% of the df = 3 curve', { anchor: 'end', size: 14, fill: MUTED });
  body += text(px1, 55, 'Each pair of marks holds the middle 95%', { anchor: 'end', size: 14, fill: MUTED });
  return { numbers: { cz, c15, c3 }, title: 't distributions and the standard normal',
    alt: `Three bell-shaped density curves centered at 0 on an axis from -4.5 to 4.5: the standard normal (solid black), the t distribution with 15 degrees of freedom (dashed blue) and the t distribution with 3 degrees of freedom (orange), which is lowest in the middle and highest in the tails. Dashed marks show the 95% critical values: z* = ${cz.toFixed(2)}, t* = ${c15.toFixed(3)} for 15 df and t* = ${c3.toFixed(3)} for 3 df. The outer 5% of the 3 df curve is shaded.`, body };
} };


/* Intervals stacked on one number line, with reference values marked. */
function intervalsBody({ a, b, ticks, label, rows, refs, w = 720, top = 40, gap = 62, fmt }) {
  const px0 = 220, px1 = w - 40, base = top + rows.length * gap + 10;
  const ax = xAxis(a, b, px0, px1, base, ticks, { label });
  let body = '';
  for (const r of refs || []) {
    body += line(ax.sx(r.at), top - 18, ax.sx(r.at), base, { stroke: r.color || VERM, width: 2, dash: '6 4' });
    body += text(ax.sx(r.at), top - 24, r.label, { anchor: 'middle', fill: r.color || VERM, size: 14, weight: 'bold' });
  }
  rows.forEach((r, i) => {
    const y = top + 20 + i * gap, c = r.color || PLUM;
    body += text(px0 - 16, y + 5, r.name, { anchor: 'end', size: 15, weight: 'bold' });
    body += line(ax.sx(r.lo), y, ax.sx(r.hi), y, { stroke: c, width: 5 });
    body += line(ax.sx(r.lo), y - 9, ax.sx(r.lo), y + 9, { stroke: c, width: 2.5 }) + line(ax.sx(r.hi), y - 9, ax.sx(r.hi), y + 9, { stroke: c, width: 2.5 });
    if (r.est != null) body += circle(ax.sx(r.est), y, 6, { fill: '#FFFFFF', stroke: c, width: 2.5 });
    body += text(ax.sx(r.lo), y + 26, (fmt || num)(r.lo), { anchor: 'middle', size: 13, fill: MUTED, halo: true }) + text(ax.sx(r.hi), y + 26, (fmt || num)(r.hi), { anchor: 'middle', size: 13, fill: MUTED, halo: true });
  });
  return { body: body + ax.svg, h: base + 56 };
}

/* 4.3: 90%, 95% and 99% t intervals for the cereal boxes, with the label value. */
FIGS['mean-interval-claims'] = { topic: 'ci-one-mean-claims', w: 720, h: 320, build() {
  const rows = [0.90, 0.95, 0.99].map((lv, i) => { const c = Dist.ci1mean(495.9, 7.5, 30, lv); return { lo: c.lo, hi: c.hi, est: 495.9, name: `${Math.round(lv * 100)}% interval`, color: [BLUE, PLUM, GREEN][i] }; });
  const f = v => v.toFixed(2);
  const { body, h } = intervalsBody({ a: 490, b: 502, ticks: [490, 492, 494, 496, 498, 500, 502], label: 'true mean fill weight (grams)', rows, refs: [{ at: 500, label: 'label: 500 g' }], fmt: f });
  this.h = h;
  return { numbers: rows, title: 'Confidence intervals and a claimed value',
    alt: `Three horizontal confidence intervals for the true mean fill weight of cereal boxes, each centered at the sample mean 495.9 grams: 90% from ${f(rows[0].lo)} to ${f(rows[0].hi)}, 95% from ${f(rows[1].lo)} to ${f(rows[1].hi)} and 99% from ${f(rows[2].lo)} to ${f(rows[2].hi)} grams. A dashed vertical line at 500 grams, the label value, lies to the right of all three intervals.`, body };
} };


/* A dotplot drawn into a band: values stacked by `step`, axis below. */
function dotplot(values, a, b, px0, px1, base, ticks, o = {}) {
  const ax = xAxis(a, b, px0, px1, base, ticks, { label: o.label });
  const counts = {}; let s = '';
  const r = o.r || 7, gap = o.gap || 2 * r + 2;
  for (const v of values.slice().sort((x, y) => x - y)) { const k = Math.round(v / (o.step || 1)) * (o.step || 1); counts[k] = (counts[k] || 0) + 1; s += circle(ax.sx(k), base - 4 - r - (counts[k] - 1) * gap, r, { fill: o.color || PLUM, stroke: '#FFFFFF', width: 1 }); }
  return { svg: s + ax.svg, sx: ax.sx, max: Math.max(...Object.values(counts)) };
}

/* 4.4: before and after heart rates, linked, and the dotplot of the differences. */
FIGS['paired-before-after'] = { topic: 'test-one-mean-setup', w: 720, h: 430, build() {
  const before = [72, 68, 80, 75, 66, 84, 70, 77, 73, 69, 81, 74], after = [69, 67, 74, 74, 64, 79, 71, 72, 70, 66, 76, 73];
  const d = before.map((x, i) => x - after[i]);
  let body = '';
  // left: slope chart
  const y0 = 60, y1 = 90, top = 40, bot = 360, sy = v => bot - (v - y0) / (y1 - y0) * (bot - top), xb = 120, xa = 270;
  for (let v = 60; v <= 90; v += 5) { body += line(70, sy(v), 320, sy(v), { stroke: GRID, width: 1 }) + text(62, sy(v) + 5, String(v), { anchor: 'end', size: 14 }); }
  body += `<text transform="translate(22 ${f2((top + bot) / 2)}) rotate(-90)" text-anchor="middle" font-size="15" fill="${INK}">resting heart rate (beats per minute)</text>`;
  before.forEach((b, i) => { const c = after[i] < b ? BLUE : VERM; body += line(xb, sy(b), xa, sy(after[i]), { stroke: c, width: 2 }) + circle(xb, sy(b), 5, { fill: c }) + circle(xa, sy(after[i]), 5, { fill: c }); });
  body += text(xb, bot + 26, 'Before', { anchor: 'middle', weight: 'bold' }) + text(xa, bot + 26, 'After', { anchor: 'middle', weight: 'bold' });
  body += text(195, 22, 'Each line is one member', { anchor: 'middle', size: 14, fill: MUTED });
  body += line(80, 414, 104, 414, { stroke: BLUE, width: 3 }) + text(110, 419, 'lower after', { size: 14 }) + line(200, 414, 224, 414, { stroke: VERM, width: 3 }) + text(230, 419, 'higher after', { size: 14 });
  // right: differences
  const dp = dotplot(d, -2, 7, 400, 690, 300, [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7], { label: 'difference, before minus after (bpm)', color: PLUM, r: 9, gap: 20 });
  body += text(545, 60, 'The 12 differences', { anchor: 'middle', weight: 'bold', size: 16 });
  const m = mean(d), s = sdv(d);
  body += text(545, 84, `mean ${m.toFixed(2)}, SD ${s.toFixed(2)} bpm`, { anchor: 'middle', size: 14, fill: MUTED });
  body += line(dp.sx(0), 120, dp.sx(0), 300, { stroke: INK, width: 1.5, dash: '4 4' }) + text(dp.sx(0) - 6, 132, 'no change', { anchor: 'end', size: 13, fill: MUTED });
  body += dp.svg;
  return { numbers: { d, mean: m, sd: s }, title: 'Paired data: before, after and the differences',
    alt: `Left: a slope chart of resting heart rate for 12 gym members, before and after a breathing class, on a scale from 60 to 90 beats per minute; 11 lines slope down and one slopes up. Right: a dotplot of the 12 differences, before minus after: ${d.slice().sort((x, y) => x - y).join(', ')}, with mean ${m.toFixed(2)} and standard deviation ${s.toFixed(2)}. All but one difference is above 0.`, body };
} };


/* A t density with shaded tails beyond the observed statistic. */
function tTails({ df, t, sides, w = 720, h = 380, title }) {
  const a = -4.5, b = 4.5, px0 = 50, px1 = w - 30, base = h - 70;
  const ax = xAxis(a, b, px0, px1, base, [-4, -3, -2, -1, 0, 1, 2, 3, 4], { label: `t (df = ${Number.isInteger(df) ? df : df.toFixed(1)})` });
  const f = x => Dist.tPdf(x, df), peak = f(0), sy = v => base - v / peak * (base - 70);
  let body = '';
  const T = Math.abs(t), tail = 1 - Dist.tCdf(T, df), p = sides === 2 ? 2 * tail : (t >= 0 ? tail : tail);
  if (sides === 2 || t >= 0) body += path(areaPath(f, T, b, ax.sx, sy, base), { fill: PLUM, opacity: 0.55 });
  if (sides === 2 || t < 0) body += path(areaPath(f, a, -T, ax.sx, sy, base), { fill: PLUM, opacity: 0.55 });
  body += path(curvePath(f, a, b, ax.sx, sy), { stroke: INK, width: 2.5 });
  const marks = sides === 2 ? [-T, T] : [t];
  for (const m of marks) body += text(ax.sx(m + (m >= 0 ? 0.75 : -0.75)), base - 34, tail.toFixed(4), { anchor: 'middle', size: 14, fill: PLUM, weight: 'bold', halo: true });
  for (const m of marks) body += line(ax.sx(m), base, ax.sx(m), 92, { stroke: VERM, width: 2, dash: '6 4' }) + text(ax.sx(m), 84, `t = ${m < 0 ? '−' : ''}${Math.abs(m).toFixed(2)}`, { anchor: 'middle', fill: VERM, weight: 'bold', size: 15 });
  const lab = sides === 2 ? `two-sided p-value = 2 × ${tail.toFixed(4)} = ${p.toFixed(4)}` : `p-value = shaded area = ${p.toFixed(4)}`;
  body += text(px0, 30, title, { weight: 'bold', size: 16 }) + text(px0, 54, lab, { size: 15, fill: PLUM, weight: 'bold' });
  body += text(ax.sx(0), sy(peak * 0.35), 'null model', { anchor: 'middle', size: 14, fill: MUTED });
  return { body: body + ax.svg, p };
}

/* 4.5: the delivery test, t = 2.37 with 44 df, right tail. */
FIGS['t-test-pvalue'] = { topic: 'test-one-mean', w: 720, h: 380, build() {
  const r = Dist.t1(32.4, 30, 6.8, 45);
  const { body, p } = tTails({ df: r.df, t: r.t, sides: 1, title: 'If H₀ is true (μ = 30): the t distribution with 44 df' });
  return { numbers: { t: r.t, p, df: r.df }, title: 'p-value of a one-sample t test',
    alt: `The t distribution with 44 degrees of freedom, centered at 0. A dashed line marks the observed t statistic ${r.t.toFixed(2)}, and the small area under the curve to its right is shaded: the one-sided p-value, ${p.toFixed(4)}.`, body };
} };


/* 4.6: the sampling distributions of x-bar_A and x-bar_B, and of their difference. */
FIGS['diff-means-normal'] = { topic: 'sampling-dist-two-means', w: 720, h: 560, build() {
  const sA = 20 / Math.sqrt(40), sB = 25 / Math.sqrt(50), sD = Math.sqrt(400 / 40 + 625 / 50), pLess = Dist.normCdf(0, 10, sD);
  const nA = x => Dist.normPdf(x, 180, sA), nB = x => Dist.normPdf(x, 170, sB), nD = x => Dist.normPdf(x, 10, sD);
  let body = '';
  // top panel
  const ax1 = xAxis(155, 195, 60, 690, 230, [155, 160, 165, 170, 175, 180, 185, 190, 195], { label: 'sample mean weight (grams)' });
  const pk1 = Math.max(nA(180), nB(170)), sy1 = v => 230 - v / pk1 * 160;
  body += text(60, 28, 'Sampling distributions of each sample mean', { weight: 'bold', size: 16 });
  body += path(curvePath(nB, 155, 195, ax1.sx, sy1), { stroke: VERM, width: 2.5 }) + path(curvePath(nA, 155, 195, ax1.sx, sy1), { stroke: BLUE, width: 2.5 });
  body += text(ax1.sx(170) - 8, sy1(nB(170)) - 10, `x̄ B: mean 170, SD ${sB.toFixed(2)}`, { anchor: 'end', fill: VERM, size: 14, weight: 'bold' });
  body += text(ax1.sx(180) + 8, sy1(nA(180)) - 10, `x̄ A: mean 180, SD ${sA.toFixed(2)}`, { anchor: 'start', fill: BLUE, size: 14, weight: 'bold' });
  body += ax1.svg;
  // bottom panel
  const top2 = 320, base2 = 490, a = -10, b = 30;
  const ax2 = xAxis(a, b, 60, 690, base2, [-10, -5, 0, 5, 10, 15, 20, 25, 30], { label: 'difference in sample means, x̄ A − x̄ B (grams)' });
  const sy2 = v => base2 - v / nD(10) * 130;
  body += text(60, top2 - 14, 'Sampling distribution of the difference', { weight: 'bold', size: 16 });
  body += text(60, top2 + 8, `mean 180 − 170 = 10, SD √(20²/40 + 25²/50) = ${sD.toFixed(2)}`, { size: 14, fill: MUTED });
  body += path(areaPath(nD, a, 0, ax2.sx, sy2, base2), { fill: PLUM, opacity: 0.55 });
  body += path(curvePath(nD, a, b, ax2.sx, sy2), { stroke: PLUM, width: 2.5 });
  body += line(ax2.sx(0), base2, ax2.sx(0), base2 - 60, { stroke: INK, width: 1.5, dash: '4 4' });
  body += text(ax2.sx(0) - 8, base2 - 66, `P(difference < 0) = ${pLess.toFixed(4)}`, { anchor: 'end', size: 14, fill: PLUM, weight: 'bold' });
  body += ax2.svg;
  return { numbers: { sA, sB, sD, pLess }, title: 'Sampling distribution of a difference in sample means',
    alt: `Top: two normal curves for the sample mean apple weight, orchard A centered at 180 grams with standard deviation ${sA.toFixed(2)} and orchard B centered at 170 grams with standard deviation ${sB.toFixed(2)}. Bottom: a wider normal curve for the difference of the two sample means, centered at 10 grams with standard deviation ${sD.toFixed(2)}; the area below 0, shaded, is ${pLess.toFixed(4)}.`, body };
} };


/* A horizontal boxplot (AP quartiles, 1.5 IQR fences, outliers as open dots). */
function boxplot(data, sx, y, hgt, color) {
  const S = Dist.summary(data), inl = data.filter(v => v >= S.fences[0] && v <= S.fences[1]);
  const lo = Math.min(...inl), hi = Math.max(...inl);
  let s = line(sx(lo), y, sx(S.q1), y, { stroke: color, width: 2 }) + line(sx(S.q3), y, sx(hi), y, { stroke: color, width: 2 });
  s += line(sx(lo), y - hgt / 4, sx(lo), y + hgt / 4, { stroke: color, width: 2 }) + line(sx(hi), y - hgt / 4, sx(hi), y + hgt / 4, { stroke: color, width: 2 });
  s += rect(sx(S.q1), y - hgt / 2, sx(S.q3) - sx(S.q1), hgt, { fill: color, opacity: 0.18, stroke: color, width: 2 });
  s += line(sx(S.med), y - hgt / 2, sx(S.med), y + hgt / 2, { stroke: color, width: 3 });
  for (const v of S.outliers) s += circle(sx(v), y, 5, { fill: '#FFFFFF', stroke: color, width: 2 });
  return { svg: s, S };
}

/* 4.7: boxplots of the two randomized groups and the 95% interval for the difference. */
FIGS['two-sample-interval'] = { topic: 'ci-two-means', w: 720, h: 470, build() {
  const spaced = [44, 36, 31, 34, 37, 43, 25, 39, 39, 35, 26, 35, 26, 29], massed = [31, 33, 18, 39, 26, 34, 25, 16, 28, 30, 21, 37, 26, 35];
  let body = text(60, 28, 'Words recalled a week later (out of 50)', { weight: 'bold', size: 16 });
  const ax = xAxis(10, 50, 140, 690, 210, [10, 15, 20, 25, 30, 35, 40, 45, 50], { label: 'words recalled' });
  const b1 = boxplot(spaced, ax.sx, 80, 36, BLUE), b2 = boxplot(massed, ax.sx, 150, 36, VERM);
  body += text(128, 85, 'Spaced', { anchor: 'end', weight: 'bold', fill: BLUE }) + text(128, 155, 'Massed', { anchor: 'end', weight: 'bold', fill: VERM });
  body += b1.svg + b2.svg + ax.svg;
  const ci = Dist.ci2mean(34.21, 6.13, 14, 28.5, 6.97, 14, 0.95);
  body += text(60, 286, '95% two-sample t interval for μS − μM', { weight: 'bold', size: 16 });
  const ax2 = xAxis(-4, 16, 140, 690, 400, [-4, -2, 0, 2, 4, 6, 8, 10, 12, 14, 16], { label: 'difference in mean words recalled, spaced minus massed' });
  body += line(ax2.sx(0), 328, ax2.sx(0), 400, { stroke: INK, width: 1.5, dash: '4 4' }) + text(ax2.sx(0), 322, 'no difference', { anchor: 'middle', size: 13, fill: MUTED });
  const y = 350;
  body += line(ax2.sx(ci.lo), y, ax2.sx(ci.hi), y, { stroke: PLUM, width: 5 }) + line(ax2.sx(ci.lo), y - 9, ax2.sx(ci.lo), y + 9, { stroke: PLUM, width: 2.5 }) + line(ax2.sx(ci.hi), y - 9, ax2.sx(ci.hi), y + 9, { stroke: PLUM, width: 2.5 });
  body += circle(ax2.sx(ci.est), y, 6, { fill: '#FFFFFF', stroke: PLUM, width: 2.5 });
  body += text(ax2.sx(ci.lo), y + 26, ci.lo.toFixed(2), { anchor: 'middle', size: 13, fill: MUTED, halo: true }) + text(ax2.sx(ci.hi), y + 26, ci.hi.toFixed(2), { anchor: 'middle', size: 13, fill: MUTED, halo: true }) + text(ax2.sx(ci.est), y - 14, `5.71`, { anchor: 'middle', size: 13, fill: PLUM, weight: 'bold', halo: true });
  body += ax2.svg;
  const f = S => `min ${S.min}, Q1 ${S.q1}, median ${S.med}, Q3 ${S.q3}, max ${S.max}`;
  return { numbers: { spaced: b1.S, massed: b2.S, ci }, title: 'Two groups and an interval for the difference in means',
    alt: `Top: side-by-side boxplots of words recalled. Spaced practice: ${f(b1.S)}. Massed practice: ${f(b2.S)}. Neither has outliers. Bottom: the 95% confidence interval for the true difference in mean recall, spaced minus massed, from ${ci.lo.toFixed(2)} to ${ci.hi.toFixed(2)} words, centered at 5.71, entirely to the right of a dashed line at 0.`, body };
} };


/* 4.8: 90%, 95% and 99% intervals for the headphones experiment, with 0 and the 5-point threshold. */
FIGS['diff-interval-claims'] = { topic: 'ci-two-means-claims', w: 720, h: 320, build() {
  const rows = [0.90, 0.95, 0.99].map((lv, i) => { const c = Dist.ci2mean(74.6, 8.1, 30, 70.1, 6.4, 30, lv); return { lo: c.lo, hi: c.hi, est: c.est, name: `${Math.round(lv * 100)}% interval`, color: [BLUE, PLUM, GREEN][i] }; });
  const f = v => (v < 0 ? '−' : '') + Math.abs(v).toFixed(2);
  const { body, h } = intervalsBody({ a: -2, b: 12, ticks: [-2, 0, 2, 4, 6, 8, 10, 12], label: 'difference in true mean score, headphones minus none (points)', rows, refs: [{ at: 0, label: 'no difference', color: INK }, { at: 5, label: "school's threshold", color: VERM }], fmt: f });
  this.h = h;
  return { numbers: rows, title: 'Intervals for a difference in means, a zero line and a threshold',
    alt: `Three confidence intervals for the true difference in mean reading score, headphones minus no headphones, each centered at 4.5 points: 90% from ${f(rows[0].lo)} to ${f(rows[0].hi)}, 95% from ${f(rows[1].lo)} to ${f(rows[1].hi)} and 99% from ${f(rows[2].lo)} to ${f(rows[2].hi)}. A dashed line at 0 lies left of the 90% and 95% intervals but inside the 99% interval. A second dashed line at 5 points, the school's threshold, lies inside all three.`, body };
} };


const arrow = (x1, y1, x2, y2, color = INK) => { const a = Math.atan2(y2 - y1, x2 - x1), h = 9; return line(x1, y1, x2 - Math.cos(a) * 2, y2 - Math.sin(a) * 2, { stroke: color, width: 2 }) + `<path d="M${f2(x2)},${f2(y2)}L${f2(x2 - h * Math.cos(a - 0.45))},${f2(y2 - h * Math.sin(a - 0.45))}L${f2(x2 - h * Math.cos(a + 0.45))},${f2(y2 - h * Math.sin(a + 0.45))}Z" fill="${color}"/>`; };
const pill = (x, y, w, h, label, color, o = {}) => rect(x, y, w, h, { fill: color, opacity: o.opacity || 0.14, stroke: color, width: 2, rx: 8 }) + text(x + w / 2, y + h / 2 + 5, label, { anchor: 'middle', size: o.size || 14, weight: 'bold', fill: o.ink || INK });

/* 4.9: paired design versus two independent groups (the shoe study's two plans). */
FIGS['paired-vs-two-sample'] = { topic: 'test-two-means-setup', w: 720, h: 470, build() {
  let body = '';
  body += line(360, 20, 360, 450, { stroke: GRID, width: 2 });
  // left: paired
  body += text(180, 30, 'Paired: each runner wears both shoes', { anchor: 'middle', weight: 'bold', size: 16 });
  const yRows = [70, 110, 150, 190, 230];
  yRows.forEach((y, i) => {
    body += circle(40, y, 13, { fill: MUTED }) + text(40, y + 5, String(i + 1), { anchor: 'middle', size: 13, fill: '#FFFFFF', weight: 'bold' });
    body += pill(64, y - 14, 70, 28, 'shoe A', BLUE) + pill(142, y - 14, 70, 28, 'shoe B', VERM);
    body += arrow(218, y, 250, y) + pill(256, y - 14, 84, 28, `d${['₁', '₂', '₃', '₄', '₅'][i]} = A − B`, PLUM, { size: 13 });
  });
  body += text(180, 270, '⋮  one difference per runner', { anchor: 'middle', size: 14, fill: MUTED });
  body += arrow(298, 290, 298, 322, PLUM);
  body += pill(40, 330, 300, 46, 'one sample of differences', PLUM, { size: 15 });
  body += text(190, 404, 'paired t test on μd, df = pairs − 1', { anchor: 'middle', size: 15, weight: 'bold', fill: PLUM });
  body += text(190, 430, 'runner-to-runner variation cancels', { anchor: 'middle', size: 14, fill: MUTED });
  // right: two groups
  body += text(540, 30, 'Two groups: runners split at random', { anchor: 'middle', weight: 'bold', size: 16 });
  body += pill(395, 50, 135, 34, 'Group 1: shoe A', BLUE) + pill(550, 50, 135, 34, 'Group 2: shoe B', VERM);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    body += circle(415 + c * 32, 112 + r * 34, 12, { fill: BLUE, stroke: '#FFFFFF' }) + circle(570 + c * 32, 112 + r * 34, 12, { fill: VERM, stroke: '#FFFFFF' });
  }
  body += text(540, 262, 'different runners in each group', { anchor: 'middle', size: 14, fill: MUTED });
  body += arrow(462, 276, 462, 322, BLUE) + arrow(618, 276, 618, 322, VERM);
  body += pill(395, 330, 135, 46, 'x̄₁, s₁, n₁', BLUE, { size: 15 }) + pill(550, 330, 135, 46, 'x̄₂, s₂, n₂', VERM, { size: 15 });
  body += text(540, 404, 'two-sample t test on μ₁ − μ₂', { anchor: 'middle', size: 15, weight: 'bold', fill: PLUM });
  body += text(540, 430, 'df: technology, or smaller n − 1', { anchor: 'middle', size: 14, fill: MUTED });
  return { numbers: {}, title: 'Paired design versus two independent groups',
    alt: 'Left panel, paired design: five numbered runners each run in shoe A and in shoe B, and each gives one difference, A minus B; the differences form one sample, analyzed with a paired t test on the mean difference with df equal to the number of pairs minus 1. Right panel, two groups: runners are split at random into group 1 wearing shoe A and group 2 wearing shoe B, different runners in each; each group gives its own mean, standard deviation and size, analyzed with a two-sample t test on mu 1 minus mu 2, with technology df or the smaller n minus 1.', body };
} };

/* ------------------------------------------------------------ output */
export function buildAll() {
  const out = {};
  for (const [id, F] of Object.entries(FIGS)) { const r = F.build(); out[id] = { ...F, ...r }; }
  return out;
}
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const all = buildAll(), byTopic = {};
  mkdirSync(join(ROOT, 'statistics', 'figures'), { recursive: true });
  for (const [id, F] of Object.entries(all)) {
    if (process.argv.includes('--list')) { console.log(id, JSON.stringify(F.numbers || {})); continue; }
    writeFileSync(join(ROOT, 'statistics', 'figures', `${id}.svg`), svgDoc(F.w, F.h, F.title, F.alt, F.body));
    (byTopic[F.topic] ||= {})[id] = { file: `figures/${id}.svg`, ext: 'svg', w: F.w, h: F.h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt: F.alt };
  }
  for (const [topic, figs] of Object.entries(byTopic)) writeFileSync(join(ROOT, 'statistics', 'data', 'figures', `${topic}.json`), JSON.stringify(figs, null, 1) + '\n');
  if (!process.argv.includes('--list')) console.log(`Unit 4 figures: ${Object.keys(all).length} written.`);
}
