/* Figures for AP® Statistics Unit 2 (Probability, Random Variables, and
   Probability Distributions). Every bar, dot, area and curve is computed
   from the numbers it claims to show: counts from the two-way tables the
   items use, simulated results from a seeded generator, probabilities and
   curves from ApStatDist. Each figure is a standalone SVG (white background,
   Arial, role="img" with <title> and <desc>) written to
   statistics/figures/<id>.svg, and registered in
   statistics/data/figures/<topic>.json.

     node scripts/apstat-figures/unit-2.mjs            write every figure
     node scripts/apstat-figures/unit-2.mjs <id> ...   write some */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Dist } from '../lib/apstat-mathlib.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'statistics', 'figures');
const REG = join(ROOT, 'statistics', 'data', 'figures');
const INK = '#1F2A28', PLUM = '#6E2470', PLUM_T = '#E9D3E8', BLUE = '#0072B2', BLUE_T = '#CFE3F1', GREEN = '#009E73', VERM = '#D55E00', GRID = '#E4E7E6', MUTED = '#5A6563';
const FONT = 'Arial, Helvetica, sans-serif';
const r2 = v => Math.round(v * 100) / 100;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = v => String(+(+v).toFixed(4)).replace('-', '−');

function T(x, y, s, { size = 14, anchor = 'middle', weight = 'normal', color = INK, italic = false, halo = false } = {}) {
  return `<text x="${r2(x)}" y="${r2(y)}" font-size="${size}" text-anchor="${anchor}" font-weight="${weight}"${italic ? ' font-style="italic"' : ''} fill="${color}"${halo ? ' stroke="#FFFFFF" stroke-width="4" paint-order="stroke"' : ''}>${esc(s)}</text>`;
}
const R = (x, y, w, h, fill, { stroke = 'none', sw = 1, rx = 0 } = {}) => `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${rx ? ` rx="${rx}"` : ''}/>`;
const L = (x1, y1, x2, y2, color = INK, w = 1.4, dash) => `<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}" stroke="${color}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
function svg(w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d" font-family="${FONT}">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body.join('\n')}
</svg>
`;
}

/* A plot panel: left, top, w, h, x: [a, b], y: [c, d]. Returns scalers and
   axis drawing. */
function panel(o) {
  const sx = v => o.left + (v - o.x[0]) / (o.x[1] - o.x[0]) * o.w;
  const sy = v => o.top + (o.y[1] - v) / (o.y[1] - o.y[0]) * o.h;
  const parts = [];
  const axes = ({ xTicks = [], yTicks = [], xLabel, yLabel, xTickLabel = fmt, yTickLabel = fmt, grid = true } = {}) => {
    if (grid) for (const v of yTicks) parts.push(L(o.left, sy(v), o.left + o.w, sy(v), GRID, 1));
    parts.push(L(o.left, o.top + o.h, o.left + o.w, o.top + o.h, INK, 1.4));
    if (yTicks.length) parts.push(L(o.left, o.top, o.left, o.top + o.h, INK, 1.4));
    for (const v of xTicks) { parts.push(L(sx(v), o.top + o.h, sx(v), o.top + o.h + 5, INK, 1.2)); parts.push(T(sx(v), o.top + o.h + 20, xTickLabel(v), { size: 13 })); }
    for (const v of yTicks) { parts.push(L(o.left - 5, sy(v), o.left, sy(v), INK, 1.2)); parts.push(T(o.left - 9, sy(v) + 4.5, yTickLabel(v), { size: 13, anchor: 'end' })); }
    if (xLabel) parts.push(T(o.left + o.w / 2, o.top + o.h + 42, xLabel, { size: 14 }));
    if (yLabel) parts.push(`<text x="${r2(o.left - 46)}" y="${r2(o.top + o.h / 2)}" font-size="14" text-anchor="middle" fill="${INK}" transform="rotate(-90 ${r2(o.left - 46)} ${r2(o.top + o.h / 2)})">${esc(yLabel)}</text>`);
  };
  return { sx, sy, parts, axes };
}
function curvePath(P, f, a, b, n = 300) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; pts.push(`${r2(P.sx(x))} ${r2(P.sy(f(x)))}`); }
  return 'M' + pts.join('L');
}
function areaPath(P, f, a, b, n = 200) {
  const pts = [`${r2(P.sx(a))} ${r2(P.sy(0))}`];
  for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; pts.push(`${r2(P.sx(x))} ${r2(P.sy(f(x)))}`); }
  pts.push(`${r2(P.sx(b))} ${r2(P.sy(0))}`);
  return 'M' + pts.join('L') + 'Z';
}
function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

/* ------------------------------------------------------------ data shared with the items */
// 2.1: class year by main way to school (questions/two-categorical-displays.json, s1).
export const COMMUTE = { cols: ['Bus', 'Car', 'Walk or bike'], rows: [['Sophomores', 72, 48, 40], ['Seniors', 28, 84, 28]] };
// 2.1: library card by age group (s2).
export const LIBRARY = { cols: ['Has a card', 'No card'], rows: [['18 to 34', 90, 90], ['35 to 54', 120, 80], ['55 and over', 84, 36]] };
// 2.2: first visit by activity.
export const PARK = { cols: ['Hiking', 'Fishing', 'Picnic'], rows: [['First visit', 45, 15, 40], ['Returning', 60, 54, 36]] };
// 2.3: number of seniors among 4 members picked at random from 8 seniors and 12 juniors, 100 trials.
export function seniorTrials(seed = 241, trials = 100) {
  const g = rng(seed), out = [];
  for (let t = 0; t < trials; t++) {
    const pool = Array.from({ length: 20 }, (_, i) => i < 8 ? 1 : 0);
    let s = 0;
    for (let k = 0; k < 4; k++) { const j = Math.floor(g() * pool.length); s += pool[j]; pool.splice(j, 1); }
    out.push(s);
  }
  return out;
}
// 2.6: screening tree.
export const SCREEN = { prev: 0.04, sens: 0.90, falsePos: 0.06 };
// 2.7: clubs Venn (counts of 120 students).
export const CLUBS = { total: 120, spanish: 50, art: 40, both: 15 };
// 2.8: people in a car at a toll booth.
export const CARS = { xs: [1, 2, 3, 4, 5], ps: [0.45, 0.30, 0.12, 0.09, 0.04] };
// 2.9: tacos per order.
export const TACOS = { xs: [1, 2, 3, 4, 5], ps: [0.20, 0.35, 0.25, 0.15, 0.05] };
// 2.10: mobile-app customers, n = 10, p = 0.3.
export const APPUSERS = { n: 10, p: 0.3 };
// 2.11: egg weights, grams.
export const EGGS = { mu: 58, sd: 4 };
// 2.12: wait times, exponential with mean 5 minutes; means of samples of 2, 10 and 30.
export function waitMeans(n, reps = 2000, seed = 517) {
  const g = rng(seed + n), out = [];
  for (let r = 0; r < reps; r++) { let s = 0; for (let i = 0; i < n; i++) s += -5 * Math.log(1 - g()); out.push(s / n); }
  return out;
}

/* ------------------------------------------------------------ figures */
const FIGS = {};
const fig = (id, topic, alt, make) => { FIGS[id] = { topic, alt, make }; };

// Segmented bar chart from a two-way table (each bar a group's percents).
function segbar({ title, data, groupLabel, colors, w = 640, h = 380, note }) {
  const parts = [];
  const left = 82, top = 30, pw = 360, ph = h - 120;
  const P = panel({ left, top, w: pw, h: ph, x: [0, data.rows.length], y: [0, 100] });
  P.axes({ yTicks: [0, 20, 40, 60, 80, 100], yLabel: 'Percent of group', yTickLabel: v => v + '%' });
  parts.push(...P.parts);
  data.rows.forEach(([lab, ...v], i) => {
    const tot = v.reduce((a, b) => a + b, 0); let cum = 0;
    const x0 = P.sx(i + 0.18), bw = P.sx(i + 0.82) - x0;
    v.forEach((c, j) => {
      const pct = 100 * c / tot, y1 = P.sy(cum + pct), y0 = P.sy(cum);
      parts.push(R(x0, y1, bw, y0 - y1, colors[j], { stroke: '#FFFFFF', sw: 1.5 }));
      if (pct >= 8) parts.push(T(x0 + bw / 2, (y0 + y1) / 2 + 5, `${Math.round(pct)}%`, { size: 14, weight: 'bold', color: j === 1 && colors[j] === PLUM_T ? INK : '#FFFFFF' }));
      cum += pct;
    });
    parts.push(T(x0 + bw / 2, top + ph + 20, lab, { size: 13 }));
    parts.push(T(x0 + bw / 2, top + ph + 37, `(n = ${tot})`, { size: 12, color: MUTED }));
  });
  if (groupLabel) parts.push(T(left + pw / 2, top + ph + 62, groupLabel, { size: 14 }));
  // Legend, top segment first so it reads in the same order as the bars.
  const lx = left + pw + 36;
  parts.push(T(lx, top + 8, title, { size: 14, anchor: 'start', weight: 'bold' }));
  [...data.cols].reverse().forEach((c, k) => {
    const j = data.cols.length - 1 - k;
    parts.push(R(lx, top + 26 + k * 28, 18, 18, colors[j], { stroke: INK, sw: 0.6 }));
    parts.push(T(lx + 26, top + 40 + k * 28, c, { size: 14, anchor: 'start' }));
  });
  if (note) note.forEach((s, k) => parts.push(T(lx, top + 140 + k * 20, s, { size: 13, anchor: 'start', color: MUTED })));
  return { w, h, parts };
}

fig('u2-commute-segbar', 'two-categorical-displays',
  'Segmented bar chart of how 160 sophomores and 140 seniors get to school. Sophomores: 45% bus, 30% car, 25% walk or bike. Seniors: 20% bus, 60% car, 20% walk or bike. The bars differ, so class year and way to school are associated.',
  () => {
    const s = segbar({ title: 'Main way to school', data: COMMUTE, groupLabel: 'Class year', colors: [BLUE, PLUM, GREEN],
      note: ['Each bar is one group', 'and adds to 100%.', 'Different bars, so the', 'variables are associated.'] });
    return svg(s.w, s.h, 'How sophomores and seniors get to school', FIGS['u2-commute-segbar'].alt, s.parts);
  });

fig('u2-library-segbar', 'two-categorical-displays',
  'Segmented bar chart of library card ownership by age group for 500 adults: 50% of the 180 adults aged 18 to 34 have a card, 60% of the 200 aged 35 to 54, and 70% of the 120 aged 55 and over.',
  () => {
    const s = segbar({ title: 'Library card', data: LIBRARY, groupLabel: 'Age group (years)', colors: [PLUM, PLUM_T] });
    return svg(s.w, s.h, 'Library cards by age group', FIGS['u2-library-segbar'].alt, s.parts);
  });

fig('u2-park-table', 'two-categorical-summaries',
  'The two-way table of 250 park visitors by visit type and activity, with three cells marked. The joint cell, first visit and hiking, holds 45 of all 250 visitors (0.18). The marginal total for hiking is 105 of 250 (0.42). The conditional share of hikers among first visits is 45 of the 100 first visits (0.45).',
  () => {
    const parts = [], w = 680, h = 330, x0 = 24, y0 = 22, cw = [150, 92, 92, 92, 92], rh = 46;
    const cols = ['', ...PARK.cols, 'Total'];
    const rows = PARK.rows.map(([l, ...v]) => [l, ...v, v.reduce((a, b) => a + b, 0)]);
    const colT = PARK.cols.map((_, j) => PARK.rows.reduce((s, r) => s + r[j + 1], 0));
    rows.push(['Total', ...colT, colT.reduce((a, b) => a + b, 0)]);
    const X = j => x0 + cw.slice(0, j).reduce((a, b) => a + b, 0);
    // highlights: joint (first visit, hiking), marginal (hiking column total), conditional row (first visit)
    parts.push(R(X(1), y0 + rh, X(5) - X(1), rh, BLUE_T));
    parts.push(R(X(1), y0 + 3 * rh, cw[1], rh, PLUM_T));
    cols.forEach((c, j) => parts.push(T(X(j) + cw[j] / 2, y0 + 29, c, { size: 15, weight: 'bold' })));
    rows.forEach((r, i) => r.forEach((v, j) => parts.push(T(j ? X(j) + cw[j] / 2 : X(0) + 10, y0 + (i + 1) * rh + 29, v, { size: 15, anchor: j ? 'middle' : 'start', weight: j === 0 || i === 2 || j === 4 ? 'bold' : 'normal' }))));
    for (let i = 0; i <= 4; i++) parts.push(L(x0, y0 + i * rh, X(5), y0 + i * rh, i === 1 || i === 3 ? INK : GRID, i === 1 || i === 3 ? 1.4 : 1));
    parts.push(L(X(4), y0, X(4), y0 + 4 * rh, INK, 1.4));
    parts.push(`<circle cx="${X(1) + cw[1] / 2}" cy="${y0 + rh + 24}" r="19" fill="none" stroke="${VERM}" stroke-width="2.6"/>`);
    // key
    const ky = y0 + 4 * rh + 30;
    parts.push(`<circle cx="${x0 + 10}" cy="${ky}" r="8" fill="none" stroke="${VERM}" stroke-width="2.4"/>`);
    parts.push(T(x0 + 26, ky + 5, 'Joint: first visit and hiking, 45 / 250 = 0.18 of all visitors', { size: 14, anchor: 'start' }));
    parts.push(R(x0 + 2, ky + 18, 16, 16, PLUM_T));
    parts.push(T(x0 + 26, ky + 31, 'Marginal: hiking, 105 / 250 = 0.42 of all visitors', { size: 14, anchor: 'start' }));
    parts.push(R(x0 + 2, ky + 44, 16, 16, BLUE_T));
    parts.push(T(x0 + 26, ky + 57, 'Conditional: hiking among first visits, 45 / 100 = 0.45', { size: 14, anchor: 'start' }));
    return svg(w, h, 'Joint, marginal and conditional relative frequencies in one table', FIGS['u2-park-table'].alt, parts);
  });

fig('u2-sim-dotplot', 'simulation',
  'Dotplot of 100 simulated random selections of 4 members from a council of 8 seniors and 12 juniors, showing the number of seniors chosen each time. Only 2 of the 100 trials picked 4 seniors, so the estimated chance of 4 seniors is 2 out of 100, or 0.02.',
  () => {
    const d = seniorTrials(), counts = [0, 1, 2, 3, 4].map(k => d.filter(v => v === k).length);
    const parts = [], w = 640, h = 420, rDot = 3.4, step = 7.2;
    const P = panel({ left: 60, top: 20, w: 520, h: 320, x: [-0.6, 4.6], y: [0, 45] });
    P.axes({ xTicks: [0, 1, 2, 3, 4], xLabel: 'Number of seniors among the 4 chosen (one dot = one trial)', grid: false });
    parts.push(...P.parts);
    counts.forEach((c, k) => {
      for (let i = 0; i < c; i++) {
        const col = Math.floor(i / 40), row = i % 40;
        const cx = P.sx(k) + (col - 0) * 0 , cy = P.sy(0) - 6 - row * step;
        parts.push(`<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${rDot}" fill="${k === 4 ? VERM : PLUM}"/>`);
      }
      parts.push(T(P.sx(k) + 34, P.sy(0) - 8 - (c - 1) * step, `${c}`, { size: 13, color: MUTED }));
    });
    parts.push(T(P.sx(4) - 6, P.sy(0) - 70, 'Observed:', { size: 13, color: VERM, weight: 'bold' }));
    parts.push(T(P.sx(4) - 6, P.sy(0) - 54, '4 seniors', { size: 13, color: VERM, weight: 'bold' }));
    parts.push(T(P.sx(4) - 6, P.sy(0) - 38, `${counts[4]} of 100 trials`, { size: 13, color: VERM }));
    return svg(w, h, 'Simulated selections of 4 council members', FIGS['u2-sim-dotplot'].alt, parts);
  });

fig('u2-dice-grid', 'probability-intro',
  'A 6 by 6 grid of the 36 equally likely outcomes when a red die and a blue die are rolled. The 5 outcomes with a sum of 8 are shaded: (2, 6), (3, 5), (4, 4), (5, 3) and (6, 2). So P(sum is 8) = 5/36.',
  () => {
    const parts = [], w = 560, h = 430, x0 = 110, y0 = 60, c = 52;
    parts.push(T(x0 + 3 * c, y0 - 30, 'Blue die', { size: 15, weight: 'bold', color: BLUE }));
    parts.push(`<text x="${x0 - 62}" y="${y0 + 3 * c}" font-size="15" font-weight="bold" fill="${PLUM}" text-anchor="middle" transform="rotate(-90 ${x0 - 62} ${y0 + 3 * c})">Red die</text>`);
    for (let i = 1; i <= 6; i++) {
      parts.push(T(x0 + (i - 0.5) * c, y0 - 8, String(i), { size: 14, weight: 'bold', color: BLUE }));
      parts.push(T(x0 - 16, y0 + (i - 0.5) * c + 5, String(i), { size: 14, weight: 'bold', color: PLUM }));
      for (let j = 1; j <= 6; j++) {
        const hit = i + j === 8;
        parts.push(R(x0 + (j - 1) * c, y0 + (i - 1) * c, c, c, hit ? PLUM_T : '#FFFFFF', { stroke: MUTED, sw: 1 }));
        parts.push(T(x0 + (j - 0.5) * c, y0 + (i - 0.5) * c + 5, `${i}, ${j}`, { size: 13, weight: hit ? 'bold' : 'normal', color: hit ? PLUM : INK }));
      }
    }
    parts.push(T(x0 + 3 * c, y0 + 6 * c + 34, 'Sum is 8: 5 of the 36 outcomes, so P(sum is 8) = 5/36', { size: 14 }));
    return svg(w, h, 'The 36 outcomes of rolling two dice', FIGS['u2-dice-grid'].alt, parts);
  });

fig('u2-event-diagrams', 'mutually-exclusive',
  'Two diagrams of events inside a rectangle of all outcomes. Left: events A and B as separate circles that do not touch, so A and B cannot happen together and P(A and B) = 0. Right: circles that overlap; the shaded overlap is the joint event A and B.',
  () => {
    const parts = [], w = 680, h = 300;
    const box = (x, label) => { parts.push(R(x, 40, 300, 200, '#FFFFFF', { stroke: INK, sw: 1.4 })); parts.push(T(x + 150, 28, label, { size: 15, weight: 'bold' })); };
    box(20, 'Mutually exclusive'); box(360, 'Not mutually exclusive');
    parts.push(`<circle cx="105" cy="140" r="62" fill="${PLUM}" fill-opacity="0.18" stroke="${PLUM}" stroke-width="2.4"/>`);
    parts.push(`<circle cx="235" cy="140" r="56" fill="${BLUE}" fill-opacity="0.18" stroke="${BLUE}" stroke-width="2.4"/>`);
    parts.push(T(105, 146, 'A', { size: 20, weight: 'bold', color: PLUM })); parts.push(T(235, 146, 'B', { size: 20, weight: 'bold', color: BLUE }));
    parts.push(T(170, 262, 'P(A and B) = 0', { size: 14 }));
    parts.push(`<clipPath id="cA"><circle cx="480" cy="140" r="70"/></clipPath>`);
    parts.push(`<circle cx="560" cy="140" r="66" fill="${VERM}" fill-opacity="0.45" clip-path="url(#cA)"/>`);
    parts.push(`<circle cx="480" cy="140" r="70" fill="none" stroke="${PLUM}" stroke-width="2.4"/>`);
    parts.push(`<circle cx="560" cy="140" r="66" fill="none" stroke="${BLUE}" stroke-width="2.4"/>`);
    parts.push(T(450, 146, 'A', { size: 20, weight: 'bold', color: PLUM })); parts.push(T(595, 146, 'B', { size: 20, weight: 'bold', color: BLUE }));
    parts.push(T(521, 145, 'A and B', { size: 12, weight: 'bold', halo: true }));
    parts.push(T(510, 262, 'P(A and B) > 0', { size: 14 }));
    return svg(w, h, 'Events that cannot happen together, and events that can', FIGS['u2-event-diagrams'].alt, parts);
  });

fig('u2-screening-tree', 'conditional-probability',
  'Tree diagram for a screening test. First branches: 0.04 of people have the condition and 0.96 do not. Given the condition, the test is positive with probability 0.90 and negative 0.10. Given no condition, positive 0.06 and negative 0.94. The four paths multiply to 0.036, 0.004, 0.0576 and 0.9024. The positive paths add to 0.0936.',
  () => {
    const { prev, sens, falsePos } = SCREEN, parts = [], w = 680, h = 360;
    const nodes = { root: [40, 180], c: [230, 90], n: [230, 270] };
    const leaf = [[430, 45], [430, 135], [430, 225], [430, 315]];
    const br = (a, b, lab, color = INK, above = true) => {
      parts.push(L(a[0], a[1], b[0] - 8, b[1], color, 2));
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      parts.push(T(mx, my + (above ? -8 : 18), lab, { size: 14, weight: 'bold', color, halo: true }));
    };
    br(nodes.root, nodes.c, String(prev), PLUM); br(nodes.root, nodes.n, String(r2(1 - prev)), BLUE, false);
    parts.push(T(nodes.c[0] + 2, nodes.c[1] + 5, 'Condition', { size: 14, anchor: 'start', weight: 'bold', halo: true }));
    parts.push(T(nodes.n[0] + 2, nodes.n[1] + 5, 'No condition', { size: 14, anchor: 'start', weight: 'bold', halo: true }));
    const st = [nodes.c[0] + 82, nodes.c[1]], st2 = [nodes.n[0] + 100, nodes.n[1]];
    br(st, leaf[0], String(sens), PLUM); br(st, leaf[1], String(r2(1 - sens)), PLUM, false);
    br(st2, leaf[2], String(falsePos), BLUE); br(st2, leaf[3], String(r2(1 - falsePos)), BLUE, false);
    const ps = [prev * sens, prev * (1 - sens), (1 - prev) * falsePos, (1 - prev) * (1 - falsePos)];
    const labs = ['Positive', 'Negative', 'Positive', 'Negative'];
    leaf.forEach((p, i) => {
      parts.push(T(p[0], p[1] + 5, labs[i], { size: 14, anchor: 'start', weight: i % 2 ? 'normal' : 'bold', color: i % 2 ? INK : VERM }));
      parts.push(T(p[0] + 80, p[1] + 5, `${i < 2 ? prev : r2(1 - prev)} × ${[sens, r2(1 - sens), falsePos, r2(1 - falsePos)][i]} = ${+ps[i].toFixed(4)}`, { size: 14, anchor: 'start', color: i % 2 ? INK : VERM }));
    });
    parts.push(T(40, 350, `P(positive) = ${+ps[0].toFixed(4)} + ${+ps[2].toFixed(4)} = ${+(ps[0] + ps[2]).toFixed(4)}`, { size: 14, anchor: 'start', weight: 'bold', color: VERM }));
    return svg(w, h, 'Tree diagram for a screening test', FIGS['u2-screening-tree'].alt, parts);
  });

fig('u2-clubs-venn', 'independence-unions',
  'Venn diagram of 120 students: 50 take Spanish, 40 take art, and 15 take both, so 35 take only Spanish, 25 only art and 45 neither. The union, Spanish or art, is shaded: 35 + 15 + 25 = 75 students, which equals 50 + 40 − 15.',
  () => {
    const { total, spanish, art, both } = CLUBS, parts = [], w = 620, h = 330;
    parts.push(R(30, 30, 560, 250, '#FFFFFF', { stroke: INK, sw: 1.4 }));
    parts.push(T(44, 52, `All ${total} students`, { size: 14, anchor: 'start', color: MUTED }));
    parts.push(`<circle cx="250" cy="160" r="98" fill="${PLUM}" fill-opacity="0.22"/>`);
    parts.push(`<circle cx="370" cy="160" r="90" fill="${BLUE}" fill-opacity="0.22"/>`);
    parts.push(`<circle cx="250" cy="160" r="98" fill="none" stroke="${PLUM}" stroke-width="2.4"/>`);
    parts.push(`<circle cx="370" cy="160" r="90" fill="none" stroke="${BLUE}" stroke-width="2.4"/>`);
    parts.push(T(200, 92, `Spanish (${spanish})`, { size: 14, weight: 'bold', color: PLUM, halo: true }));
    parts.push(T(420, 92, `Art (${art})`, { size: 14, weight: 'bold', color: BLUE, halo: true }));
    parts.push(T(205, 166, String(spanish - both), { size: 20, weight: 'bold' }));
    parts.push(T(312, 166, String(both), { size: 20, weight: 'bold' }));
    parts.push(T(415, 166, String(art - both), { size: 20, weight: 'bold' }));
    parts.push(T(520, 250, `Neither: ${total - spanish - art + both}`, { size: 14 }));
    parts.push(T(310, 306, `Spanish or art: ${spanish - both} + ${both} + ${art - both} = ${spanish + art - both} = ${spanish} + ${art} − ${both}`, { size: 14 }));
    return svg(w, h, 'Students taking Spanish, art or both', FIGS['u2-clubs-venn'].alt, parts);
  });

// Probability histogram for a discrete distribution.
function probHist({ xs, ps, xLabel, ymax, mark, w = 600, h = 360, shade }) {
  const parts = [];
  const P = panel({ left: 70, top: 22, w: w - 110, h: h - 92, x: [xs[0] - 0.7, xs[xs.length - 1] + 0.7], y: [0, ymax] });
  const yt = []; for (let v = 0; v <= ymax + 1e-9; v += ymax > 0.3 ? 0.1 : 0.05) yt.push(+v.toFixed(2));
  P.axes({ xTicks: xs, yTicks: yt, xLabel, yLabel: 'Probability' });
  parts.push(...P.parts);
  xs.forEach((x, i) => {
    const on = shade ? shade(x) : false;
    parts.push(R(P.sx(x - 0.4), P.sy(ps[i]), P.sx(x + 0.4) - P.sx(x - 0.4), P.sy(0) - P.sy(ps[i]), on ? PLUM : PLUM_T, { stroke: PLUM, sw: 1.2 }));
    if (ps[i] >= 0.005) parts.push(T(P.sx(x), P.sy(ps[i]) - 6, String(+ps[i].toFixed(3)), { size: 12, color: MUTED }));
  });
  return { parts, P };
}

fig('u2-cars-histogram', 'random-variables',
  'Probability histogram of X, the number of people in a car at a toll booth: P(X = 1) = 0.45, P(X = 2) = 0.30, P(X = 3) = 0.12, P(X = 4) = 0.09, P(X = 5) = 0.04. The bars add to 1.',
  () => {
    const { parts } = probHist({ ...CARS, xLabel: 'X = number of people in the car', ymax: 0.5 });
    return svg(600, 360, 'Probability distribution of the number of people in a car', FIGS['u2-cars-histogram'].alt, parts);
  });

fig('u2-tacos-balance', 'random-variable-parameters',
  'Probability histogram of X, the number of tacos in an order: 0.20, 0.35, 0.25, 0.15 and 0.05 for 1 to 5 tacos. A triangle under the axis marks the mean, 2.5 tacos, where the histogram would balance; arrows show one standard deviation, about 1.12 tacos, on each side.',
  () => {
    const { mu, sd } = (() => { const m = TACOS.xs.reduce((s, x, i) => s + x * TACOS.ps[i], 0); return { mu: m, sd: Math.sqrt(TACOS.xs.reduce((s, x, i) => s + (x - m) ** 2 * TACOS.ps[i], 0)) }; })();
    const { parts, P } = probHist({ ...TACOS, xLabel: 'X = number of tacos in an order', ymax: 0.5, h: 420 });
    const y0 = P.sy(0);
    parts.push(`<path d="M${r2(P.sx(mu))} ${r2(y0 + 1)} l-9 15 h18 z" fill="${VERM}"/>`);
    parts.push(T(P.sx(mu), P.sy(0.475), `mean of X = ${mu} tacos (the balance point)`, { size: 14, weight: 'bold', color: VERM, halo: true }));
    parts.push(L(P.sx(mu), P.sy(0.465), P.sx(mu), y0, VERM, 1.6, '5 4'));
    const ya = P.sy(0.41);
    parts.push(L(P.sx(mu - sd), ya, P.sx(mu + sd), ya, BLUE, 2));
    parts.push(`<path d="M${r2(P.sx(mu - sd))} ${ya} l8 -5 v10 z M${r2(P.sx(mu + sd))} ${ya} l-8 -5 v10 z" fill="${BLUE}"/>`);
    parts.push(T(P.sx(mu + sd) + 6, ya + 5, `SD of X ≈ ${sd.toFixed(2)} tacos each side`, { size: 13, anchor: 'start', color: BLUE, halo: true }));
    return svg(600, 420, 'The mean of a random variable as a balance point', FIGS['u2-tacos-balance'].alt, parts);
  });

fig('u2-binomial-shaded', 'binomial-distribution',
  'Probability histogram of the binomial distribution with n = 10 and p = 0.3. The bars for 4 through 10 are shaded; together they are P(X ≥ 4) = 1 − P(X ≤ 3) = 0.350.',
  () => {
    const { n, p } = APPUSERS, xs = Array.from({ length: n + 1 }, (_, k) => k), ps = xs.map(k => Dist.binomPmf(k, n, p));
    const { parts, P } = probHist({ xs, ps, xLabel: 'X = number of the 10 customers who use the app', ymax: 0.3, shade: x => x >= 4, w: 640 });
    const tail = 1 - Dist.binomCdf(3, n, p);
    parts.push(T(P.sx(7), P.sy(0.24), `P(X ≥ 4) = ${tail.toFixed(3)}`, { size: 15, weight: 'bold', color: PLUM }));
    parts.push(T(P.sx(7), P.sy(0.24) + 20, 'binomial, n = 10, p = 0.3', { size: 13, color: MUTED }));
    return svg(640, 360, 'Binomial distribution with the region 4 or more shaded', FIGS['u2-binomial-shaded'].alt, parts);
  });

fig('u2-empirical-rule', 'normal-distribution',
  'Normal density curve for egg weights with mean 58 grams and standard deviation 4 grams, axis marked from 46 to 70 grams. Brackets show that about 68% of weights fall within 1 standard deviation (54 to 62 g), about 95% within 2 (50 to 66 g) and about 99.7% within 3 (46 to 70 g).',
  () => {
    const { mu, sd } = EGGS, parts = [], w = 680, h = 400;
    const f = x => Dist.normPdf(x, mu, sd);
    const P = panel({ left: 40, top: 100, w: 600, h: 230, x: [mu - 3.6 * sd, mu + 3.6 * sd], y: [0, f(mu) * 1.08] });
    P.axes({ xTicks: [-3, -2, -1, 0, 1, 2, 3].map(k => mu + k * sd), xLabel: 'Egg weight (grams)', grid: false });
    parts.push(`<path d="${areaPath(P, f, mu - 3 * sd, mu + 3 * sd)}" fill="${PLUM_T}" fill-opacity="0.5"/>`);
    parts.push(`<path d="${areaPath(P, f, mu - 2 * sd, mu + 2 * sd)}" fill="${PLUM_T}"/>`);
    parts.push(`<path d="${areaPath(P, f, mu - sd, mu + sd)}" fill="${PLUM}" fill-opacity="0.35"/>`);
    parts.push(...P.parts);
    parts.push(`<path d="${curvePath(P, f, P.sx ? mu - 3.6 * sd : 0, mu + 3.6 * sd)}" fill="none" stroke="${PLUM}" stroke-width="3"/>`);
    [[1, '68%', 84], [2, '95%', 54], [3, '99.7%', 24]].forEach(([k, lab, y]) => {
      const a = P.sx(mu - k * sd), b = P.sx(mu + k * sd);
      parts.push(L(a, y, b, y, INK, 1.4)); parts.push(L(a, y - 6, a, y + 6, INK, 1.4)); parts.push(L(b, y - 6, b, y + 6, INK, 1.4));
      parts.push(T((a + b) / 2, y - 6, `about ${lab} within ${k} SD`, { size: 13, halo: true }));
      parts.push(L(a, y + 6, a, P.sy(0), MUTED, 1, '3 4')); parts.push(L(b, y + 6, b, P.sy(0), MUTED, 1, '3 4'));
    });
    return svg(w, h, 'The empirical rule on a normal curve', FIGS['u2-empirical-rule'].alt, parts);
  });

fig('u2-clt-panels', 'sampling-distributions',
  'Three panels. Top: the population of wait times, a strongly right-skewed curve with mean 5 minutes and standard deviation 5 minutes. Middle: histogram of 2000 simulated sample means for samples of 2, still skewed right. Bottom: histogram of 2000 sample means for samples of 30, close to a symmetric bell shape centered at 5 with a much smaller spread, about 0.91 minutes.',
  () => {
    const parts = [], w = 640, h = 640, left = 70, pw = 530, ph = 120;
    const xr = [0, 20];
    const top1 = 40;
    // population density
    const f = x => x < 0 ? 0 : Math.exp(-x / 5) / 5;
    const P1 = panel({ left, top: top1, w: pw, h: ph, x: xr, y: [0, 0.22] });
    P1.axes({ xTicks: [0, 5, 10, 15, 20], grid: false });
    parts.push(`<path d="${areaPath(P1, f, 0, 20)}" fill="${PLUM_T}"/>`, ...P1.parts, `<path d="${curvePath(P1, f, 0, 20)}" fill="none" stroke="${PLUM}" stroke-width="2.6"/>`);
    parts.push(`<text x="${left - 14}" y="${top1 + ph / 2}" font-size="13" text-anchor="middle" fill="${MUTED}" transform="rotate(-90 ${left - 14} ${top1 + ph / 2})">Density</text>`);
    parts.push(T(left, top1 - 12, 'Population of wait times: skewed right, μ = 5, σ = 5', { size: 14, anchor: 'start', weight: 'bold' }));
    const hist = (n, top) => {
      const d = waitMeans(n), bw = 0.5, nb = 40, c = new Array(nb).fill(0);
      d.forEach(v => { const j = Math.floor(v / bw); if (j >= 0 && j < nb) c[j]++; });
      const dens = c.map(k => k / (d.length * bw));
      const ymax = Math.max(...dens) * 1.1;
      const P = panel({ left, top, w: pw, h: ph, x: xr, y: [0, ymax] });
      P.axes({ xTicks: [0, 5, 10, 15, 20], grid: false, xLabel: top > 400 ? 'Wait time or mean wait time (minutes)' : undefined });
      dens.forEach((v, j) => { if (v > 0) parts.push(R(P.sx(j * bw), P.sy(v), P.sx(bw) - P.sx(0), P.sy(0) - P.sy(v), n >= 30 ? BLUE : PLUM, { stroke: '#FFFFFF', sw: 0.8 })); });
      parts.push(...P.parts);
      parts.push(`<text x="${left - 14}" y="${top + ph / 2}" font-size="13" text-anchor="middle" fill="${MUTED}" transform="rotate(-90 ${left - 14} ${top + ph / 2})">Relative frequency</text>`);
      const mean = d.reduce((a, b) => a + b, 0) / d.length, sdv = Math.sqrt(d.reduce((a, b) => a + (b - mean) ** 2, 0) / (d.length - 1));
      parts.push(T(left, top - 12, `Means of samples of n = ${n}: center about ${mean.toFixed(1)}, SD about ${sdv.toFixed(2)} (formula 5/√${n} = ${(5 / Math.sqrt(n)).toFixed(2)})`, { size: 14, anchor: 'start', weight: 'bold' }));
    };
    hist(2, 250); hist(30, 460);
    return svg(w, h, 'Sample means from a skewed population', FIGS['u2-clt-panels'].alt, parts);
  });

/* ------------------------------------------------------------ write */
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  mkdirSync(OUT, { recursive: true }); mkdirSync(REG, { recursive: true });
  const want = process.argv.slice(2);
  const byTopic = {};
  for (const [id, F] of Object.entries(FIGS)) {
    const s = F.make();
    const m = s.match(/viewBox="0 0 (\d+) (\d+)"/);
    if (!want.length || want.includes(id)) writeFileSync(join(OUT, `${id}.svg`), s);
    (byTopic[F.topic] ||= {})[id] = { file: `figures/${id}.svg`, ext: 'svg', w: +m[1], h: +m[2], source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt: F.alt };
  }
  for (const [t, o] of Object.entries(byTopic)) writeFileSync(join(REG, `${t}.json`), JSON.stringify(o, null, 1) + '\n');
  console.log(`unit 2 figures: ${Object.keys(FIGS).length} written`);
}
