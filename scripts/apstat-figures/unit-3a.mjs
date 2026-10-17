/* Figures for AP® Statistics Unit 3, topics 3.1-3.8 (one proportion: estimators,
   the sampling distribution of the sample proportion, confidence intervals,
   tests, p-values, errors and power). Every bar, curve and interval is
   computed from the distribution or the seeded simulation it claims to show,
   through the course's own ApStatDist (statistics/assets/stat-dist.js), and
   written as a standalone SVG (white background, Arial, role="img" with
   <title> and <desc>) to statistics/figures/<id>.svg. Each figure is also
   registered in statistics/data/figures/<topic>.json with the same alt text.

     node scripts/apstat-figures/unit-3a.mjs            write every figure
     node scripts/apstat-figures/unit-3a.mjs <id> ...   write some */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Dist } from '../lib/apstat-mathlib.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'statistics', 'figures');
const REG = join(ROOT, 'statistics', 'data', 'figures');
const INK = '#1F2A28', PLUM = '#6E2470', BLUE = '#0072B2', GREEN = '#009E73', VERM = '#D55E00', GRID = '#E4E7E6', MUTED = '#5A6563';
const PLUM_T = '#E9D3E8', BLUE_T = '#CCE3F0', VERM_T = '#F6D9C7', GREEN_T = '#CDEDE3';
const FONT = 'Arial, Helvetica, sans-serif';
const r2 = v => Math.round(v * 100) / 100;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const num = v => String(+v.toFixed(4)).replace('-', '−');

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function binomDraw(r, n, p) { let k = 0; for (let i = 0; i < n; i++) if (r() < p) k++; return k; }

function doc(w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d" font-family="${FONT}">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body.join('\n')}
</svg>
`;
}
const T = (x, y, s, o = {}) => `<text x="${r2(x)}" y="${r2(y)}" font-size="${o.size || 16}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.bold ? ' font-weight="bold"' : ''}${o.italic ? ' font-style="italic"' : ''} fill="${o.color || INK}"${o.halo ? ' stroke="#FFFFFF" stroke-width="4" paint-order="stroke"' : ''}>${esc(s)}</text>`;

/* A horizontal axis panel: x from a to b mapped to [left, left + w]; y from 0 to ymax mapped to [top + h, top]. */
function panel({ left, top, w, h, x, ymax, ticks, tickLabel = num, xLabel, axisY = true }) {
  const sx = v => left + (v - x[0]) / (x[1] - x[0]) * w;
  const sy = v => top + h - v / ymax * h;
  const parts = [];
  const base = top + h;
  const P = {
    sx, sy, parts, base,
    axis() {
      parts.push(`<line x1="${left}" y1="${base}" x2="${left + w}" y2="${base}" stroke="${INK}" stroke-width="1.4"/>`);
      for (const v of ticks || []) {
        parts.push(`<line x1="${r2(sx(v))}" y1="${base}" x2="${r2(sx(v))}" y2="${base + 6}" stroke="${INK}" stroke-width="1.2"/>`);
        parts.push(T(sx(v), base + 23, tickLabel(v), { size: 15, anchor: 'middle' }));
      }
      if (xLabel) parts.push(T(left + w / 2, base + 48, xLabel, { size: 16, anchor: 'middle' }));
      if (axisY) parts.push(`<line x1="${left}" y1="${top}" x2="${left}" y2="${base}" stroke="${INK}" stroke-width="1.4"/>`);
      return P;
    },
    bars(pts, width, { fill = PLUM_T, stroke = PLUM, hi = null, hiFill = PLUM, hiStroke = PLUM } = {}) {
      for (const [xv, yv] of pts) {
        if (yv <= 0) continue;
        const on = hi && hi(xv);
        parts.push(`<rect x="${r2(sx(xv - width / 2))}" y="${r2(sy(yv))}" width="${r2(sx(xv + width / 2) - sx(xv - width / 2))}" height="${r2(base - sy(yv))}" fill="${on ? hiFill : fill}" stroke="${on ? hiStroke : stroke}" stroke-width="1"/>`);
      }
      return P;
    },
    curve(f, a, b, { color = INK, width = 2.6, dash = null, n = 300 } = {}) {
      const pts = [];
      for (let i = 0; i <= n; i++) { const xv = a + (b - a) * i / n; pts.push(`${r2(sx(xv))} ${r2(sy(f(xv)))}`); }
      parts.push(`<path d="M${pts.join('L')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`);
      return P;
    },
    area(f, a, b, { fill = PLUM_T, opacity = 1, n = 200 } = {}) {
      const pts = [`${r2(sx(a))} ${r2(base)}`];
      for (let i = 0; i <= n; i++) { const xv = a + (b - a) * i / n; pts.push(`${r2(sx(xv))} ${r2(sy(f(xv)))}`); }
      pts.push(`${r2(sx(b))} ${r2(base)}`);
      parts.push(`<path d="M${pts.join('L')}Z" fill="${fill}" fill-opacity="${opacity}" stroke="none"/>`);
      return P;
    },
    vline(xv, y0, y1, { color = INK, width = 2, dash = null } = {}) {
      parts.push(`<line x1="${r2(sx(xv))}" y1="${r2(y0)}" x2="${r2(sx(xv))}" y2="${r2(y1)}" stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`);
      return P;
    },
  };
  return P;
}

const FIGS = {};
const fig = (id, topic, o) => { FIGS[id] = { topic, ...o }; };

/* 3.1: three estimators of p = 0.40, each sampling distribution exact (binomial). */
fig('estimator-bias-variability', 'estimators', {
  title: 'Bias and variability of three estimators',
  alt: 'Three probability histograms on the same scale from 0.1 to 0.8, each with a dashed line at the true proportion p = 0.40. Top: the sample proportion from random samples of 25 is centered at 0.40 and spread widely, from about 0.2 to 0.6: unbiased, high variability. Middle: the sample proportion from random samples of 100 is centered at 0.40 and about half as spread out: unbiased, low variability. Bottom: a biased method whose sample proportions center at 0.55 with low variability: biased, low variability.',
  draw() {
    const W = 640, rows = [
      { n: 25, p: 0.40, name: 'Random samples of 25', tag: 'Unbiased, high variability', color: PLUM, fill: PLUM_T },
      { n: 100, p: 0.40, name: 'Random samples of 100', tag: 'Unbiased, low variability', color: BLUE, fill: BLUE_T },
      { n: 100, p: 0.55, name: 'A method that favors one group (100)', tag: 'Biased, low variability', color: VERM, fill: VERM_T },
    ];
    const body = [], ph = 118, gap = 44, top0 = 30, left = 40, w = 560;
    let ymax = 0;
    for (const r of rows) for (let k = 0; k <= r.n; k++) ymax = Math.max(ymax, Dist.binomPmf(k, r.n, r.p) * r.n);
    rows.forEach((r, i) => {
      const top = top0 + i * (ph + gap);
      const P = panel({ left, top, w, h: ph, x: [0.1, 0.8], ymax: ymax * 1.08, ticks: i === 2 ? [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8] : [], xLabel: i === 2 ? 'value of the estimate' : null, axisY: false });
      const pts = []; for (let k = 0; k <= r.n; k++) { const x = k / r.n; if (x >= 0.1 && x <= 0.78) pts.push([x, Dist.binomPmf(k, r.n, r.p) * r.n]); }
      P.bars(pts, 1 / r.n * 0.92, { fill: r.fill, stroke: r.color });
      P.axis();
      P.vline(0.40, top + 8, P.base, { color: INK, width: 2, dash: '6 4' });
      body.push(...P.parts);
      body.push(T(left, top + 2, r.name, { size: 16, bold: true, color: r.color }));
      body.push(T(left + w, top + 2, r.tag, { size: 15, anchor: 'end', color: INK }));
    });
    body.push(T(left + (0.40 - 0.1) / 0.7 * w - 8, top0 + 22, 'true p = 0.40', { size: 15, anchor: 'end', halo: true }));
    return { w: W, h: top0 + 3 * ph + 2 * gap + 60, body };
  },
});

/* 3.2: the sampling distribution of p-hat, exact, with the normal model over it. */
fig('phat-sampling-distribution', 'sampling-dist-proportion', {
  title: 'Sampling distribution of a sample proportion',
  alt: 'Two probability histograms of the sample proportion of seeds that sprout when the true proportion is p = 0.85. Top, samples of 200: the bars form a symmetric mound centered at 0.85 that matches the normal curve with mean 0.85 and standard deviation 0.025 drawn over it; large counts hold because 200(0.85) = 170 and 200(0.15) = 30 are both at least 10. Bottom, samples of 20: the bars are skewed left, piled up near 0.85 to 1 with a long tail toward lower values, and the normal curve does not fit; 20(0.15) = 3 is less than 10.',
  draw() {
    const W = 640, left = 40, w = 560, body = [];
    const panels = [
      { n: 200, top: 34, h: 150, x: [0.75, 0.95], ticks: [0.75, 0.8, 0.85, 0.9, 0.95], name: 'Samples of 200 seeds: 200(0.85) = 170 and 200(0.15) = 30', note: 'approximately normal', color: PLUM, fill: PLUM_T },
      { n: 20, top: 290, h: 150, x: [0.4, 1.04], ticks: [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0], name: 'Samples of 20 seeds: 20(0.15) = 3, less than 10', note: 'skewed left: normal curve does not fit', color: VERM, fill: VERM_T },
    ];
    for (const q of panels) {
      const p = 0.85, sd = Math.sqrt(p * (1 - p) / q.n), dens = x => Dist.normPdf((x - p) / sd) / sd;
      let ymax = 0; const pts = [];
      for (let k = 0; k <= q.n; k++) { const x = k / q.n; const d = Dist.binomPmf(k, q.n, p) * q.n; if (x >= q.x[0] - 1e-9 && x <= q.x[1] + 1e-9) { pts.push([x, d]); ymax = Math.max(ymax, d); } }
      ymax = Math.max(ymax, dens(p)) * 1.1;
      const P = panel({ left, top: q.top, w, h: q.h, x: q.x, ymax, ticks: q.ticks, xLabel: 'sample proportion that sprout', axisY: false });
      P.bars(pts, 1 / q.n * 0.9, { fill: q.fill, stroke: q.color });
      P.axis();
      P.curve(dens, q.x[0], q.x[1], { color: INK, width: 2.4 });
      body.push(...P.parts);
      body.push(T(left, q.top - 10, q.name, { size: 16, bold: true, color: q.color }));
      body.push(q.n === 20 ? T(left, q.top + 24, q.note, { size: 15, halo: true }) : T(left + w, q.top + 18, q.note, { size: 15, anchor: 'end', halo: true }));
    }
    body.push(T(left + w, 72, 'mean 0.85, SD 0.025', { size: 15, anchor: 'end', halo: true }));
    return { w: W, h: 510, body };
  },
});

/* 3.3: why a 95% interval works. */
fig('ci-construction', 'ci-one-proportion', {
  title: 'How a 95% confidence interval is built',
  alt: 'Top: the normal sampling distribution of the sample proportion, centered at the unknown true proportion p, with the middle 95% shaded between p minus 1.96 standard deviations and p plus 1.96 standard deviations. Below it, three sample proportions are drawn with their intervals, each the sample proportion plus or minus 1.96 standard deviations. The two sample proportions that land inside the shaded middle 95% give intervals that reach across p; the one that lands in the tail gives an interval that misses p.',
  draw() {
    const W = 640, left = 40, w = 560, body = [];
    const P = panel({ left, top: 40, w, h: 170, x: [-4.5, 4.5], ymax: 0.45, ticks: [-1.96, 0, 1.96], tickLabel: v => v === 0 ? 'p' : v < 0 ? 'p − 1.96 SD' : 'p + 1.96 SD', axisY: false });
    P.area(Dist.normPdf, -1.96, 1.96, { fill: PLUM_T });
    P.axis();
    P.curve(Dist.normPdf, -4.5, 4.5, { color: PLUM, width: 2.6 });
    P.vline(0, 52, 210, { color: INK, width: 1.6, dash: '5 4' });
    body.push(...P.parts);
    body.push(T(P.sx(0), 140, 'middle 95%', { size: 16, anchor: 'middle', bold: true, color: PLUM, halo: true }));
    body.push(T(left, 24, 'Where sample proportions land, around the true p', { size: 16, bold: true }));
    const ex = [{ c: -0.9, ok: true }, { c: 1.3, ok: true }, { c: 2.35, ok: false }];
    const y0 = 300;
    body.push(T(left, 280, 'Three samples: each interval is the sample proportion ± 1.96 SD', { size: 16, bold: true }));
    ex.forEach((e, i) => {
      const y = y0 + 30 + i * 40, col = e.ok ? BLUE : VERM;
      body.push(`<line x1="${r2(P.sx(e.c - 1.96))}" y1="${y}" x2="${r2(P.sx(e.c + 1.96))}" y2="${y}" stroke="${col}" stroke-width="4" stroke-linecap="round"/>`);
      body.push(`<circle cx="${r2(P.sx(e.c))}" cy="${y}" r="6" fill="#FFFFFF" stroke="${col}" stroke-width="3"/>`);
      body.push(T(P.sx(e.c - 1.96) - 10, y + 5, e.ok ? 'captures p' : 'misses p', { size: 15, anchor: 'end', color: col, halo: true }));
    });
    body.push(`<line x1="${r2(P.sx(0))}" y1="${y0}" x2="${r2(P.sx(0))}" y2="${y0 + 125}" stroke="${INK}" stroke-width="1.6" stroke-dasharray="5 4"/>`);
    body.push(T(P.sx(0), y0 + 145, 'true p', { size: 15, anchor: 'middle' }));
    return { w: W, h: 470, body };
  },
});

/* 3.4: 25 simulated 95% intervals (seeded). */
const CAP = (() => {
  const r = rng(2027), n = 400, p = 0.6, out = [];
  for (let i = 0; i < 25; i++) { const k = binomDraw(r, n, p); const c = Dist.ci1prop(k / n, n, 0.95); out.push({ phat: k / n, lo: c.lo, hi: c.hi, hit: c.lo <= p && p <= c.hi }); }
  return out;
})();
fig('ci-capture-25', 'ci-one-proportion-claims', {
  title: 'Twenty-five 95% confidence intervals',
  alt: `Twenty-five 95% confidence intervals, one per row, each from a simulated random sample of 400 from a population where the true proportion is p = 0.60, shown as a dashed vertical line. Each interval is drawn as a bar with a dot at its sample proportion. ${CAP.filter(c => c.hit).length} of the 25 intervals cross the line and capture p; ${CAP.filter(c => !c.hit).length} miss it and are drawn in orange. The intervals have nearly the same length but are centered at different sample proportions.`,
  draw() {
    const W = 640, left = 40, w = 560, top = 62, rowH = 17, body = [];
    const P = panel({ left, top, w, h: 25 * rowH + 10, x: [0.48, 0.72], ymax: 1, ticks: [0.5, 0.55, 0.6, 0.65, 0.7], xLabel: 'proportion', axisY: false });
    P.axis();
    body.push(...P.parts);
    body.push(`<line x1="${r2(P.sx(0.6))}" y1="${top - 8}" x2="${r2(P.sx(0.6))}" y2="${P.base}" stroke="${INK}" stroke-width="2" stroke-dasharray="6 4"/>`);
    CAP.forEach((c, i) => {
      const y = top + 8 + i * rowH, col = c.hit ? BLUE : VERM;
      body.push(`<line x1="${r2(P.sx(c.lo))}" y1="${y}" x2="${r2(P.sx(c.hi))}" y2="${y}" stroke="${col}" stroke-width="${c.hit ? 3.5 : 4.5}" stroke-linecap="round"/>`);
      body.push(`<circle cx="${r2(P.sx(c.phat))}" cy="${y}" r="3.6" fill="${col}"/>`);
    });
    body.push(T(P.sx(0.6) + 6, top - 12, 'true p = 0.60', { size: 15, halo: true }));
    const hits = CAP.filter(c => c.hit).length;
    body.push(T(left, 22, `${hits} of 25 capture p (blue); ${25 - hits} miss (orange)`, { size: 16, bold: true }));
    return { w: W, h: top + 25 * rowH + 10 + 64, body };
  },
});

/* 3.5: the three alternative hypotheses on a number line. */
fig('alternative-directions', 'test-one-proportion-setup', {
  title: 'The three directions of an alternative hypothesis',
  alt: 'Three number lines for a proportion from 0.55 to 0.85, each with the null value 0.70 marked by a dot. First, alternative "p < 0.70": the values below 0.70 are highlighted. Second, alternative "p > 0.70": the values above 0.70 are highlighted. Third, alternative "p is not 0.70": the values on both sides of 0.70 are highlighted. The direction comes from the research question, before any data are seen.',
  draw() {
    const W = 640, left = 60, w = 520, body = [];
    const rows = [{ t: 'Hₐ: p < 0.70   (the claim is "less than")', sides: [-1] }, { t: 'Hₐ: p > 0.70   (the claim is "greater than")', sides: [1] }, { t: 'Hₐ: p ≠ 0.70   (the claim is "different from")', sides: [-1, 1] }];
    const sx = v => left + (v - 0.55) / 0.3 * w;
    rows.forEach((r, i) => {
      const y = 70 + i * 105;
      body.push(T(left - 20, y - 30, r.t, { size: 16, bold: true }));
      body.push(`<line x1="${sx(0.55)}" y1="${y}" x2="${sx(0.85)}" y2="${y}" stroke="${INK}" stroke-width="1.6"/>`);
      for (const s of r.sides) body.push(`<line x1="${r2(sx(0.70) + s * 9)}" y1="${y}" x2="${r2(s < 0 ? sx(0.555) : sx(0.845))}" y2="${y}" stroke="${PLUM}" stroke-width="9" stroke-linecap="round" stroke-opacity="0.85"/>`);
      for (const s of r.sides) body.push(`<path d="M${r2(s < 0 ? sx(0.55) - 2 : sx(0.85) + 2)} ${y} l${s < 0 ? 12 : -12} -9 v18 z" fill="${PLUM}"/>`);
      for (const v of [0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85]) { body.push(`<line x1="${r2(sx(v))}" y1="${y + 6}" x2="${r2(sx(v))}" y2="${y + 12}" stroke="${INK}" stroke-width="1.2"/>`); body.push(T(sx(v), y + 30, num(v), { size: 15, anchor: 'middle' })); }
      body.push(`<circle cx="${r2(sx(0.70))}" cy="${y}" r="7" fill="#FFFFFF" stroke="${INK}" stroke-width="2.4"/>`);
    });
    body.push(T(left - 20, 372, 'The open dot is the null value p₀ = 0.70; the plum part is what Hₐ claims.', { size: 15, color: MUTED }));
    return { w: W, h: 392, body };
  },
});

/* 3.6: a p-value is a tail area of the null distribution. */
fig('p-value-tails', 'p-values', {
  title: 'A p-value as a tail area',
  alt: 'Two standard normal curves. Left, labeled one-sided, alternative p < 0.40: the area to the left of the test statistic z = −1.77 is shaded; it is the p-value, about 0.039. Right, labeled two-sided, alternative p is not 0.40: the areas to the left of z = −1.77 and to the right of z = 1.77 are both shaded; together they are the p-value, about 0.077, twice the one-sided value.',
  draw() {
    const W = 640, body = [];
    const z = (0.35 - 0.40) / Math.sqrt(0.4 * 0.6 / 300), p1 = Dist.normCdf(z);
    const mk = (left, two, title, val) => {
      const P = panel({ left, top: 100, w: 270, h: 150, x: [-3.4, 3.4], ymax: 0.44, ticks: two ? [z, 0, -z] : [z, 0], tickLabel: v => v === 0 ? '0' : v.toFixed(2).replace('-', '−'), xLabel: 'z if the null is true', axisY: false });
      P.area(Dist.normPdf, -3.4, z, { fill: PLUM }); if (two) P.area(Dist.normPdf, -z, 3.4, { fill: PLUM });
      P.axis(); P.curve(Dist.normPdf, -3.4, 3.4, { color: INK, width: 2.4 });
      body.push(...P.parts);
      body.push(T(left, 30, title, { size: 16, bold: true }));
      body.push(T(left + 135, 84, val, { size: 16, anchor: 'middle', color: PLUM, bold: true, halo: true }));
      return P;
    };
    mk(30, false, 'One-sided: Hₐ: p < 0.40', `p-value = ${p1.toFixed(3)}`);
    mk(340, true, 'Two-sided: Hₐ: p ≠ 0.40', `p-value = 2(${p1.toFixed(4)}) = ${(2 * p1).toFixed(3)}`);
    body.push(T(30, 52, 'shade the tail Hₐ points to', { size: 15, color: MUTED }));
    body.push(T(340, 52, 'shade both tails', { size: 15, color: MUTED }));
    return { w: W, h: 320, body };
  },
});

/* 3.7: state, plan, do, conclude. */
fig('test-four-steps', 'test-one-proportion', {
  title: 'Four steps of a significance test',
  alt: 'Four boxes in a column joined by arrows, for a test about chronic absence in a school district. State: the hypotheses H0: p = 0.18 and Ha: p < 0.18, where p is the true proportion of all district students who are chronically absent, with alpha = 0.05. Plan: a one-sample z test for a proportion; random sample; 450 is less than 10% of the students; 450(0.18) = 81 and 450(0.82) = 369 are at least 10. Do: z = (0.14 − 0.18) / sqrt(0.18(0.82)/450) = −2.21 and p-value = 0.014. Conclude: because 0.014 < 0.05, reject H0; there is convincing evidence that the true proportion is less than 0.18.',
  draw() {
    const W = 640, left = 30, w = 580, body = [];
    const z = Dist.z1prop(63 / 450, 0.18, 450);
    const boxes = [
      { h: 'State', c: PLUM, lines: ['H₀: p = 0.18,  Hₐ: p < 0.18,  α = 0.05', 'p = the true proportion of all district students', 'who are chronically absent'] },
      { h: 'Plan', c: BLUE, lines: ['One-sample z test for a proportion', 'Random sample of 450 students; 450 < 10% of all students', 'Large counts: 450(0.18) = 81 ≥ 10 and 450(0.82) = 369 ≥ 10'] },
      { h: 'Do', c: GREEN, lines: ['p̂ = 63/450 = 0.14', `z = (0.14 − 0.18) / √(0.18 × 0.82 / 450) = ${z.z.toFixed(2).replace('-', '−')}`, `p-value = P(Z ≤ ${z.z.toFixed(2).replace('-', '−')}) = ${z.p.less.toFixed(3)}`] },
      { h: 'Conclude', c: VERM, lines: [`Because ${z.p.less.toFixed(3)} < 0.05, reject H₀. There is convincing evidence`, 'that the true proportion of all district students who are', 'chronically absent is less than 0.18.'] },
    ];
    const bh = 104, gap = 22;
    boxes.forEach((b, i) => {
      const y = 12 + i * (bh + gap);
      body.push(`<rect x="${left}" y="${y}" width="${w}" height="${bh}" rx="10" fill="#FFFFFF" stroke="${b.c}" stroke-width="2.4"/>`);
      body.push(`<rect x="${left}" y="${y}" width="112" height="${bh}" rx="10" fill="${b.c}"/>`);
      body.push(`<rect x="${left + 100}" y="${y}" width="12" height="${bh}" fill="${b.c}"/>`);
      body.push(T(left + 56, y + bh / 2 + 6, b.h, { size: 18, bold: true, anchor: 'middle', color: '#FFFFFF' }));
      b.lines.forEach((L, j) => body.push(T(left + 126, y + 30 + j * 26, L, { size: 15 })));
      if (i < 3) body.push(`<path d="M${left + 56} ${y + bh + 3} v${gap - 9} m-6 -7 l6 8 l6 -8" fill="none" stroke="${INK}" stroke-width="2"/>`);
    });
    return { w: W, h: 12 + 4 * bh + 3 * gap + 12, body };
  },
});

/* 3.8: alpha, beta and power from the null and an alternative distribution. */
fig('power-alpha-beta', 'errors-and-power', {
  title: 'Type I error, Type II error and power',
  alt: 'Two normal curves for the sample proportion from samples of 200. The left curve, centered at the null value 0.50, is the distribution if the null is true; the right curve, centered at 0.60, is the distribution if the true proportion is 0.60. A vertical line at the cutoff 0.558 marks where the test rejects H0 at alpha = 0.05 (sample proportions above it). Under the null curve, the small area beyond the cutoff is alpha, the probability of a Type I error. Under the alternative curve, the area to the left of the cutoff is beta, the probability of a Type II error, about 0.11; the area to the right is the power, about 0.89.',
  draw() {
    const W = 640, left = 30, w = 580, body = [];
    const n = 200, p0 = 0.5, pa = 0.6, s0 = Math.sqrt(p0 * (1 - p0) / n), sa = Math.sqrt(pa * (1 - pa) / n);
    const cut = p0 + Dist.invNorm(0.95) * s0, beta = Dist.normCdf((cut - pa) / sa);
    const f0 = x => Dist.normPdf((x - p0) / s0) / s0, fa = x => Dist.normPdf((x - pa) / sa) / sa;
    const P = panel({ left, top: 70, w, h: 230, x: [0.38, 0.72], ymax: f0(p0) * 1.12, ticks: [0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7], xLabel: 'sample proportion (samples of 200)', axisY: false });
    P.area(fa, cut, 0.72, { fill: GREEN_T });
    P.area(fa, 0.38, cut, { fill: VERM_T });
    P.area(f0, cut, 0.72, { fill: PLUM, opacity: 0.85 });
    P.axis();
    P.curve(f0, 0.38, 0.72, { color: PLUM, width: 2.6 });
    P.curve(fa, 0.38, 0.72, { color: BLUE, width: 2.6 });
    P.vline(cut, 60, P.base, { color: INK, width: 2, dash: '6 4' });
    body.push(...P.parts);
    body.push(T(P.sx(cut) + 6, 58, `cutoff ${cut.toFixed(3)}: reject H₀ to the right`, { size: 15, halo: true }));
    body.push(T(P.sx(p0), 64, 'if H₀ is true (p = 0.50)', { size: 15, anchor: 'end', color: PLUM, bold: true, halo: true }));
    body.push(T(P.sx(0.69), 110, 'if p = 0.60', { size: 15, anchor: 'start', color: BLUE, bold: true, halo: true }));
    body.push(T(P.sx(0.605), 230, `power ≈ ${(1 - beta).toFixed(2)}`, { size: 16, anchor: 'middle', color: '#00684A', bold: true, halo: true }));
    body.push(`<line x1="${r2(P.sx(0.512))}" y1="${r2(P.base - 46)}" x2="${r2(P.sx(0.548))}" y2="${r2(P.base - 14)}" stroke="#A34100" stroke-width="1.5"/>`);
    body.push(T(P.sx(0.505), P.base - 52, `β ≈ ${beta.toFixed(2)}`, { size: 16, anchor: 'end', color: '#A34100', bold: true, halo: true }));
    body.push(`<line x1="${r2(P.sx(0.568))}" y1="${r2(P.base - 3)}" x2="${r2(P.sx(0.676))}" y2="${r2(P.base - 40)}" stroke="${PLUM}" stroke-width="1.5"/>`);
    body.push(T(P.sx(0.679), P.base - 42, 'α = 0.05', { size: 16, anchor: 'start', color: PLUM, bold: true, halo: true }));
    body.push(T(left, 24, 'One test, two possible truths', { size: 16, bold: true }));
    return { w: W, h: 370, body };
  },
});

const only = process.argv.slice(2);
mkdirSync(OUT, { recursive: true }); mkdirSync(REG, { recursive: true });
const regs = {};
for (const [id, f] of Object.entries(FIGS)) {
  const regPath = join(REG, `${f.topic}.json`);
  if (!regs[f.topic]) regs[f.topic] = existsSync(regPath) ? JSON.parse(readFileSync(regPath, 'utf8')) : {};
  if (only.length && !only.includes(id)) continue;
  const d = f.draw();
  writeFileSync(join(OUT, `${id}.svg`), doc(d.w, d.h, f.title, f.alt, d.body));
  regs[f.topic][id] = { file: `figures/${id}.svg`, ext: 'svg', w: d.w, h: d.h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt: f.alt };
  console.log(`wrote statistics/figures/${id}.svg (${d.w} x ${d.h})`);
}
for (const [topic, r] of Object.entries(regs)) writeFileSync(join(REG, `${topic}.json`), JSON.stringify(r, null, 1) + '\n');
export { CAP };
