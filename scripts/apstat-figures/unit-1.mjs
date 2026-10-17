/* AP® Statistics figures for Unit 1 and the "Math you need" chapter (author A).
   Every data figure is drawn from the numbers listed here, with quartiles and
   fences from ApStatDist (the AP® quartile rule), so a picture always shows
   the data it claims to show. Diagrams are drawn from coordinates.

     node scripts/apstat-figures/unit-1.mjs          writes statistics/figures/<id>.svg
     node scripts/apstat-figures/unit-1.mjs --list   prints ids and sizes

   Style: white background, Arial/Helvetica, ink #1F2A28, course plum #6E2470
   for emphasis, Okabe-Ito blue #0072B2, green #009E73 and vermillion #D55E00
   as second colours; role="img" with <title> and <desc>. */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Dist } from '../lib/apstat-mathlib.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'statistics', 'figures');
const INK = '#1F2A28', PLUM = '#6E2470', TINT = '#F5E6F4', BLUE = '#0072B2', GREEN = '#009E73', VERM = '#D55E00', GREY = '#8A9290', LIGHT = '#E9ECEB';
const FONT = 'Arial, Helvetica, sans-serif';

/* ------------------------------------------------------------ toolkit */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const f = v => +v.toFixed(2);
function T(x, y, s, o = {}) {
  const a = o.anchor || 'start', sz = o.size || 13, w = o.weight || 'normal', fill = o.fill || INK;
  const extra = o.italic ? ' font-style="italic"' : '';
  return `<text x="${f(x)}" y="${f(y)}" font-size="${sz}" font-weight="${w}" fill="${fill}" text-anchor="${a}"${extra}>${esc(s)}</text>`;
}
// multi-line text, lines separated by \n
function TL(x, y, s, o = {}) { const lh = o.lh || (o.size || 13) * 1.3; return String(s).split('\n').map((l, i) => T(x, y + i * lh, l, o)).join(''); }
const L = (x1, y1, x2, y2, o = {}) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.w || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''}/>`;
const R = (x, y, w, h, o = {}) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${o.rx || 0}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const C = (x, y, r, o = {}) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${o.fill || INK}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.5}"/>`;
const P = (d, o = {}) => `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.5}"/>`;
function svg(id, w, h, title, desc, body) {
  const marks = [['ink', INK], ['plum', PLUM], ['grey', GREY]].map(([n, c]) =>
    `<marker id="ar-${n}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join('');
  return { id, w, h, alt: desc, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="${FONT}">
<title id="${id}-t">${esc(title)}</title>
<desc id="${id}-d">${esc(desc)}</desc>
<defs>${marks}</defs>
<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body}
</svg>
` };
}
// a horizontal number axis; returns the scale
function axis(x0, x1, y, lo, hi, step, label, o = {}) {
  const sx = v => x0 + (v - lo) / (hi - lo) * (x1 - x0);
  let s = L(x0, y, x1, y);
  for (let v = lo; v <= hi + 1e-9; v += step) {
    const vv = +v.toFixed(6);
    s += L(sx(vv), y, sx(vv), y + 5) + T(sx(vv), y + 19, (o.fmt || (z => String(z)))(vv), { anchor: 'middle', size: o.size || 12 });
  }
  if (label) s += T((x0 + x1) / 2, y + 40, label, { anchor: 'middle', size: 13, weight: 'bold' });
  return { s, sx };
}
// a vertical count axis on the left; returns the scale
function vaxis(x, y0, y1, lo, hi, step, label) {
  const sy = v => y0 - (v - lo) / (hi - lo) * (y0 - y1);
  let s = L(x, y0, x, y1);
  for (let v = lo; v <= hi + 1e-9; v += step) {
    const vv = +v.toFixed(6);
    s += L(x - 5, sy(vv), x, sy(vv)) + T(x - 8, sy(vv) + 4, String(vv), { anchor: 'end', size: 12 });
  }
  if (label) s += `<text x="${f(x - 38)}" y="${f((y0 + y1) / 2)}" font-size="13" font-weight="bold" fill="${INK}" text-anchor="middle" transform="rotate(-90 ${f(x - 38)} ${f((y0 + y1) / 2)})">${esc(label)}</text>`;
  return { s, sy };
}
// stacked dots above y for each value (rounded to `step`)
function dots(sx, y, data, o = {}) {
  const r = o.r || 5, gap = o.gap || 2 * r + 1, counts = {};
  let s = '';
  for (const v of [...data].sort((a, b) => a - b)) {
    const k = o.step ? Math.round(v / o.step) * o.step : v;
    counts[k] = (counts[k] || 0) + 1;
    const fill = o.color ? (typeof o.color === 'function' ? o.color(v) : o.color) : BLUE;
    s += C(sx(k), y - r - 2 - (counts[k] - 1) * gap, r, { fill });
  }
  return s;
}
function hist(sx, sy, data, start, width, o = {}) {
  const counts = [];
  for (const v of data) { const j = Math.floor((v - start) / width + 1e-9); counts[j] = (counts[j] || 0) + 1; }
  let s = '';
  counts.forEach((c, j) => { if (c) s += R(sx(start + j * width), sy(c), sx(start + (j + 1) * width) - sx(start + j * width), sy(0) - sy(c), { fill: o.fill || BLUE, stroke: '#FFFFFF', w: 1.2 }); });
  return { s, counts };
}
// a boxplot at height y (box half-height hh); AP quartiles and 1.5 IQR fences
function box(sx, y, data, o = {}) {
  const S = Dist.summary(data), hh = o.hh || 16, col = o.color || PLUM;
  const inl = data.filter(v => v >= S.fences[0] && v <= S.fences[1]);
  const wl = Math.min(...inl), wh = Math.max(...inl);
  let s = R(sx(S.q1), y - hh, sx(S.q3) - sx(S.q1), 2 * hh, { fill: o.fill || TINT, stroke: col, w: 2 });
  s += L(sx(S.med), y - hh, sx(S.med), y + hh, { stroke: col, w: 3 });
  s += L(sx(wl), y, sx(S.q1), y, { stroke: col, w: 2 }) + L(sx(S.q3), y, sx(wh), y, { stroke: col, w: 2 });
  s += L(sx(wl), y - hh / 2, sx(wl), y + hh / 2, { stroke: col, w: 2 }) + L(sx(wh), y - hh / 2, sx(wh), y + hh / 2, { stroke: col, w: 2 });
  for (const v of S.outliers) s += C(sx(v), y, 5, { fill: '#FFFFFF', stroke: col, w: 2 });
  return { s, S, wl, wh };
}
function wrapBox(x, y, w, h, title, lines, o = {}) {
  let s = R(x, y, w, h, { rx: 10, fill: o.fill || '#FFFFFF', stroke: o.stroke || INK, w: o.w || 1.5 });
  s += T(x + w / 2, y + 22, title, { anchor: 'middle', weight: 'bold', size: o.tsize || 14, fill: o.tfill || INK });
  if (lines) s += TL(x + w / 2, y + 42, lines, { anchor: 'middle', size: 12.5, lh: 16 });
  return s;
}

/* ------------------------------------------------------------ data shared with the content */
export const DATA = {
  // 1.5: minutes 30 students spent on homework one night
  homework: [12, 15, 18, 20, 22, 24, 25, 25, 27, 28, 30, 30, 31, 33, 34, 35, 35, 36, 38, 40, 41, 42, 45, 45, 48, 50, 55, 58, 62, 75],
  // 1.7: battery life (hours) of 12 phones
  battery: [7.2, 8.1, 8.4, 8.9, 9.0, 9.3, 9.5, 9.8, 10.1, 10.4, 10.6, 14.9],
  // 1.8: commute times (minutes) of 20 workers
  commute: [8, 10, 12, 12, 14, 15, 16, 18, 18, 20, 21, 22, 24, 25, 27, 30, 32, 35, 38, 62],
  // 1.9: delivery times (minutes) for two restaurants, 15 orders each
  deliveryA: [22, 25, 26, 28, 29, 30, 31, 32, 33, 34, 35, 36, 38, 40, 44],
  deliveryB: [18, 20, 21, 23, 24, 25, 26, 27, 28, 30, 33, 37, 42, 48, 60],
};

/* ------------------------------------------------------------ figures */
const FIG = [];

// 1.1 the path of a study
FIG.push((() => {
  const id = 'study-path', W = 720, H = 300;
  let b = '';
  // population cloud
  b += R(20, 40, 250, 200, { rx: 18, fill: '#F7F8F8', stroke: INK });
  b += T(145, 66, 'Population', { anchor: 'middle', weight: 'bold', size: 16 });
  b += T(145, 84, 'all 2,400 students at the school', { anchor: 'middle', size: 12 });
  let k = 0;
  for (let r = 0; r < 7; r++) for (let c = 0; c < 11; c++) {
    const x = 42 + c * 20.5, y = 104 + r * 19, pick = [3, 17, 26, 38, 44, 52, 61, 70].includes(k);
    b += C(x, y, pick ? 6 : 5, { fill: pick ? PLUM : '#C9CFCD' });
    k++;
  }
  b += L(270, 110, 340, 110, { arrow: 'ink' }) + T(305, 100, 'choose', { anchor: 'middle', size: 12 });
  b += R(345, 60, 150, 100, { rx: 50, fill: TINT, stroke: PLUM, w: 2 });
  b += T(420, 88, 'Sample', { anchor: 'middle', weight: 'bold', size: 16, fill: PLUM });
  b += T(420, 106, '120 students', { anchor: 'middle', size: 12 });
  for (let i = 0; i < 8; i++) b += C(375 + i * 13, 128 + (i % 2) * 10, 5, { fill: PLUM });
  b += L(495, 110, 545, 110, { arrow: 'ink' }) + T(520, 100, 'ask', { anchor: 'middle', size: 12 });
  b += wrapBox(550, 60, 150, 100, 'Data', 'each answer:\n"yes" or "no"\n78 of 120 say yes');
  b += P('M 625 160 C 625 270, 145 290, 145 242', { stroke: PLUM, w: 2 }) ;
  b += `<path d="M 139 252 L 145 240 L 151 252 z" fill="${PLUM}"/>`;
  b += R(250, 232, 300, 50, { rx: 10, fill: '#FFFFFF', stroke: PLUM, w: 2 });
  b += TL(400, 252, 'Conclusion about the population, in context:\nabout 65% of the school\'s students say yes', { anchor: 'middle', size: 12.5, lh: 16 });
  return svg(id, W, H, 'From a population to a conclusion',
    'A study of a school. On the left, a population of 2,400 students drawn as grey dots, a few in plum. An arrow labelled choose leads to a sample of 120 students. An arrow labelled ask leads to the data: each answer is yes or no, and 78 of 120 say yes. A curved arrow returns to the population with the conclusion, in context: about 65% of the school\'s students say yes.', b);
})());

// 1.2 anatomy of a data table
FIG.push((() => {
  const id = 'data-table-anatomy', W = 740, H = 330;
  const cols = ['Dog', 'Size group', 'Vaccinated?', 'Times adopted', 'Weight (kg)'];
  const rows = [['Biscuit', 'small', 'yes', '0', '7.4'], ['Juno', 'large', 'yes', '2', '31.8'], ['Pepper', 'medium', 'no', '1', '16.2'], ['Rex', 'large', 'yes', '0', '28.5']];
  const x0 = 20, cw = [90, 105, 112, 120, 105], y0 = 90, rh = 34;
  const cx = i => x0 + cw.slice(0, i).reduce((a, c) => a + c, 0);
  let b = '';
  const tags = [['', ''], ['categorical', BLUE], ['categorical', BLUE], ['quantitative,\ndiscrete', GREEN], ['quantitative,\ncontinuous', GREEN]];
  tags.forEach(([t, col], i) => { if (t) { b += R(cx(i) + 4, 22, cw[i] - 8, 40, { rx: 8, fill: col === BLUE ? '#E5F1F8' : '#E3F4EE', stroke: col, w: 1.5 }); b += TL(cx(i) + cw[i] / 2, 38, t, { anchor: 'middle', size: 12, weight: 'bold', fill: col === BLUE ? '#005A8C' : '#00704F', lh: 14 }); } });
  b += R(x0, y0, cw.reduce((a, c) => a + c, 0), rh, { fill: LIGHT });
  cols.forEach((c, i) => { b += T(cx(i) + 8, y0 + 22, c, { weight: 'bold', size: 13 }); });
  rows.forEach((r, j) => r.forEach((v, i) => { b += T(cx(i) + 8, y0 + rh * (j + 1) + 22, v, { size: 13 }); }));
  for (let j = 0; j <= rows.length + 1; j++) b += L(x0, y0 + j * rh, x0 + cw.reduce((a, c) => a + c, 0), y0 + j * rh, { stroke: '#B8BFBD', w: 1 });
  // highlight one row and one column
  b += R(x0 + 1, y0 + rh * 2 + 1, cw.reduce((a, c) => a + c, 0) - 2, rh - 2, { stroke: PLUM, w: 2.5, rx: 4 });
  b += R(cx(4) + 1, y0 + 1, cw[4] - 2, rh * 5 - 2, { stroke: VERM, w: 2.5, rx: 4 });
  const right = x0 + cw.reduce((a, c) => a + c, 0);
  b += L(right + 8, y0 + rh * 2.5, right + 40, y0 + rh * 2.5, { stroke: PLUM, arrow: 'plum' });
  b += TL(right + 46, y0 + rh * 2.5 - 4, 'A row is one\nobservational unit\n(one dog)', { size: 12.5, weight: 'bold', fill: PLUM, lh: 15 });
  b += L(cx(4) + cw[4] / 2, y0 + rh * 5 + 4, cx(4) + cw[4] / 2, y0 + rh * 5 + 34, { stroke: VERM });
  b += TL(cx(4) + cw[4] / 2 - 160, y0 + rh * 5 + 50, 'A column is one variable: a characteristic\nrecorded for every dog', { size: 12.5, weight: 'bold', fill: '#A84300', lh: 15 });
  return svg(id, W, H, 'Rows, columns and types of variables',
    'A data table about shelter dogs with columns Dog, Size group, Vaccinated?, Times adopted and Weight in kilograms, and four dogs as rows. Size group and Vaccinated? are tagged categorical. Times adopted is tagged quantitative, discrete. Weight is tagged quantitative, continuous. One row is outlined and labelled: a row is one observational unit, one dog. The weight column is outlined and labelled: a column is one variable, a characteristic recorded for every dog.', b);
})());

// 1.3 counts to relative frequencies
FIG.push((() => {
  const id = 'counts-to-relative', W = 720, H = 300;
  const cats = [['Bus', 95, BLUE], ['Car', 80, GREEN], ['Walk', 45, PLUM], ['Bike', 20, VERM], ['Other', 10, GREY]];
  let b = T(20, 28, '250 students, one dot for every 5 students', { size: 13, weight: 'bold' });
  cats.forEach(([n, c, col], j) => {
    const y = 60 + j * 44;
    b += T(20, y + 5, n, { size: 13, weight: 'bold' });
    for (let i = 0; i < c / 5; i++) b += C(80 + i * 15, y, 5.5, { fill: col });
  });
  const tx = 400;
  b += R(tx, 40, 300, 34, { fill: LIGHT });
  b += T(tx + 10, 62, 'Way to school', { weight: 'bold' }) + T(tx + 140, 62, 'Frequency', { weight: 'bold', anchor: 'middle' }) + T(tx + 240, 62, 'Relative frequency', { weight: 'bold', anchor: 'middle' });
  cats.forEach(([n, c], j) => {
    const y = 74 + j * 32;
    b += T(tx + 10, y + 21, n) + T(tx + 140, y + 21, String(c), { anchor: 'middle' }) + T(tx + 240, y + 21, `${c}/250 = ${(c / 250).toFixed(2)}`, { anchor: 'middle' });
    b += L(tx, y + 32, tx + 300, y + 32, { stroke: '#B8BFBD', w: 1 });
  });
  b += T(tx + 10, 74 + 5 * 32 + 22, 'Total', { weight: 'bold' }) + T(tx + 140, 74 + 5 * 32 + 22, '250', { anchor: 'middle', weight: 'bold' }) + T(tx + 240, 74 + 5 * 32 + 22, '1.00', { anchor: 'middle', weight: 'bold' });
  return svg(id, W, H, 'Counts become relative frequencies',
    'Left: 250 students drawn as dots, one dot for every 5 students, in five rows: Bus 95, Car 80, Walk 45, Bike 20, Other 10. Right: the frequency table with each count over 250: Bus 0.38, Car 0.32, Walk 0.18, Bike 0.08, Other 0.04, total 1.00.', b);
})());

// 1.4 bar chart and pie chart of the same data
FIG.push((() => {
  const id = 'bar-and-pie', W = 720, H = 320;
  const cats = [['Bus', 0.38, BLUE], ['Car', 0.32, GREEN], ['Walk', 0.18, PLUM], ['Bike', 0.08, VERM], ['Other', 0.04, GREY]];
  const { s: va, sy } = vaxis(80, 260, 30, 0, 0.4, 0.1, 'Relative frequency');
  let b = va + L(80, 260, 360, 260);
  cats.forEach(([n, v, col], j) => {
    const x = 92 + j * 54;
    b += R(x, sy(v), 40, sy(0) - sy(v), { fill: col });
    b += T(x + 20, 278, n, { anchor: 'middle', size: 12 });
    b += T(x + 20, sy(v) - 5, v.toFixed(2), { anchor: 'middle', size: 11 });
  });
  b += T(220, 305, 'Way to school', { anchor: 'middle', weight: 'bold' });
  // pie
  const cx = 540, cy = 160, r = 110;
  let a0 = -Math.PI / 2;
  cats.forEach(([n, v, col]) => {
    const a1 = a0 + v * 2 * Math.PI, large = v > 0.5 ? 1 : 0;
    const p = `M ${cx} ${cy} L ${f(cx + r * Math.cos(a0))} ${f(cy + r * Math.sin(a0))} A ${r} ${r} 0 ${large} 1 ${f(cx + r * Math.cos(a1))} ${f(cy + r * Math.sin(a1))} z`;
    b += P(p, { fill: col, stroke: '#FFFFFF', w: 2 });
    const am = (a0 + a1) / 2, lr = v < 0.1 ? r + 22 : r * 0.62;
    b += T(cx + lr * Math.cos(am), cy + lr * Math.sin(am) + 4, `${n} ${Math.round(v * 100)}%`, { anchor: 'middle', size: 12, weight: 'bold', fill: v < 0.1 ? INK : '#FFFFFF' });
    a0 = a1;
  });
  return svg(id, W, H, 'The same data as a bar chart and a pie chart',
    'Left: a bar chart of how 250 students get to school, with relative frequency on the vertical axis from 0 to 0.4: Bus 0.38, Car 0.32, Walk 0.18, Bike 0.08, Other 0.04. Right: a pie chart of the same data, with slices Bus 38%, Car 32%, Walk 18%, Bike 8%, Other 4%.', b);
})());

// 1.5 one data set, three displays
FIG.push((() => {
  const id = 'bin-width', W = 720, H = 520, d = DATA.homework;
  let b = T(20, 24, 'Dotplot', { weight: 'bold', size: 14 });
  const A1 = axis(70, 680, 110, 10, 80, 5, '');
  b += A1.s + dots(A1.sx, 110, d, { r: 4.5, gap: 10, color: BLUE });
  const panel = (y0, width, title, col) => {
    let s = T(20, y0 - 122, title, { weight: 'bold', size: 14 });
    const V = vaxis(70, y0, y0 - 96, 0, width === 5 ? 6 : 10, 2, '');
    const A = axis(70, 680, y0, 10, 80, width === 5 ? 5 : 10, '');
    s += V.s + A.s + hist(A.sx, V.sy, d, 10, width, { fill: col }).s;
    s += `<text x="30" y="${y0 - 48}" font-size="12" font-weight="bold" fill="${INK}" text-anchor="middle" transform="rotate(-90 30 ${y0 - 48})">Count</text>`;
    return s;
  };
  b += panel(292, 5, 'Histogram, bins 5 minutes wide', GREEN);
  b += panel(470, 10, 'Histogram, bins 10 minutes wide', PLUM);
  b += T(375, 512, 'Minutes spent on homework (30 students)', { anchor: 'middle', weight: 'bold' });
  return svg(id, W, H, 'One data set, three displays',
    'Minutes 30 students spent on homework, from 12 to 75, shown three ways on the same scale from 10 to 80 minutes. Top: a dotplot with one dot per student. Middle: a histogram with bins 5 minutes wide, which shows more detail. Bottom: a histogram with bins 10 minutes wide, which is smoother; the tallest bin, 30 to 40 minutes, holds 9 students.', b);
})());

// 1.6 four shapes
FIG.push((() => {
  const id = 'four-shapes', W = 720, H = 400;
  const shapes = [
    ['Roughly symmetric', [3, 6, 10, 14, 10, 6, 3], BLUE],
    ['Skewed right (tail to the right)', [12, 15, 11, 7, 4, 2, 1], GREEN],
    ['Skewed left (tail to the left)', [1, 2, 4, 7, 11, 15, 12], VERM],
    ['Bimodal (two peaks)', [3, 10, 13, 5, 6, 12, 9], PLUM],
  ];
  let b = '';
  shapes.forEach(([t, counts, col], k) => {
    const ox = k % 2 ? 380 : 30, oy = k < 2 ? 30 : 220;
    b += T(ox + 150, oy + 6, t, { anchor: 'middle', weight: 'bold', size: 14 });
    const base = oy + 150, top = 16, bw = 40;
    counts.forEach((c, j) => { b += R(ox + 10 + j * bw, base - c * 7.5, bw, c * 7.5, { fill: col, stroke: '#FFFFFF', w: 1.5 }); });
    b += L(ox + 5, base, ox + 300, base);
  });
  return svg(id, W, H, 'Four common shapes of a distribution',
    'Four histograms. Top left, roughly symmetric: one peak in the middle with matching sides. Top right, skewed right: most values on the left and a long tail to the right. Bottom left, skewed left: most values on the right and a long tail to the left. Bottom right, bimodal: two separate peaks.', b);
})());

// 1.7 the mean is pulled, the median is not
FIG.push((() => {
  const id = 'mean-median-pull', W = 720, H = 330, d = DATA.battery, d2 = d.slice(0, 11);
  let b = '';
  const panel = (y, data, title) => {
    const A = axis(60, 680, y, 7, 15, 1, '');
    const m = Dist.mean(data), md = Dist.summary(data).med;
    let s = T(20, y - 88, title, { weight: 'bold', size: 14 }) + A.s + dots(A.sx, y, data, { r: 6, step: 0.1, color: BLUE });
    const mdLeft = md < m;
    s += L(A.sx(md), y - 70, A.sx(md), y, { stroke: GREEN, w: 2.5, dash: '6 4' }) + T(A.sx(md) + (mdLeft ? -6 : 6), y - 74, `median ${md.toFixed(2)}`, { anchor: mdLeft ? 'end' : 'start', size: 12.5, weight: 'bold', fill: '#00704F' });
    s += `<path d="M ${f(A.sx(m))} ${y + 2} l -7 12 l 14 0 z" fill="${PLUM}"/>`;
    s += L(A.sx(m), y - 70, A.sx(m), y, { stroke: PLUM, w: 2.5 }) + T(A.sx(m) + (mdLeft ? 6 : -6), y - 74, `mean ${m.toFixed(2)}`, { anchor: mdLeft ? 'start' : 'end', size: 12.5, weight: 'bold', fill: PLUM });
    return s;
  };
  b += panel(120, d2, 'Eleven phones');
  b += panel(270, d, 'Add one phone that lasts 14.9 hours');
  b += T(370, 322, 'Battery life (hours)', { anchor: 'middle', weight: 'bold' });
  return svg(id, W, H, 'One large value pulls the mean but not the median',
    'Two dotplots of battery life in hours on a scale from 7 to 15. Top: eleven phones from 7.2 to 10.6 hours, with median 9.30 and mean 9.21 close together. Bottom: the same phones plus one that lasts 14.9 hours; the median moves only to 9.40 while the mean moves to 9.68, pulled toward the large value.', b);
})());

// 1.8 dotplot over boxplot
FIG.push((() => {
  const id = 'box-from-dots', W = 720, H = 320, d = DATA.commute;
  const A = axis(60, 680, 262, 0, 70, 10, 'Commute time (minutes)');
  let b = A.s + dots(A.sx, 70, d, { r: 5.5, gap: 12, color: BLUE }) + L(60, 70, 680, 70, { stroke: '#B8BFBD', w: 1 });
  const { s, S, wl, wh } = box(A.sx, 170, d, { hh: 22 });
  b += s;
  const lab = (v, t, up) => T(A.sx(v), up ? 134 : 212, t, { anchor: 'middle', size: 12, weight: 'bold', fill: PLUM });
  b += lab(wl, `min ${wl}`, true) + lab(S.q1, `Q1 = ${S.q1}`, false) + lab(S.med, `median ${S.med}`, true) + lab(S.q3, `Q3 = ${S.q3}`, false) + lab(wh, `${wh}`, true);
  b += L(A.sx(S.fences[1]), 146, A.sx(S.fences[1]), 194, { stroke: VERM, w: 2, dash: '5 4' }) + T(A.sx(S.fences[1]), 212, `fence ${S.fences[1]}`, { anchor: 'middle', size: 12, fill: '#A84300', weight: 'bold' });
  b += T(A.sx(62), 142, 'outlier 62', { anchor: 'middle', size: 12, weight: 'bold', fill: PLUM });
  return svg(id, W, H, 'A dotplot and the boxplot of the same data',
    'Commute times of 20 workers in minutes. Top: a dotplot from 8 to 62. Bottom: the boxplot of the same data on the same scale. The box runs from Q1 = 14.5 to Q3 = 28.5 with the median at 20.5. The upper fence is at 49.5, so 62 is an outlier, drawn as an open circle, and the right whisker stops at 38, the largest value inside the fence. The left whisker reaches the minimum, 8.', b);
})());

// 1.9 parallel boxplots and a z-score
FIG.push((() => {
  const id = 'compare-and-z', W = 720, H = 412;
  const A = axis(140, 690, 180, 15, 65, 5, 'Delivery time (minutes)');
  let b = T(20, 26, 'Two restaurants, 15 orders each', { weight: 'bold', size: 14 }) + A.s;
  b += T(120, 80, 'Restaurant A', { anchor: 'end', weight: 'bold', size: 13, fill: BLUE }) + box(A.sx, 76, DATA.deliveryA, { color: BLUE, fill: '#E5F1F8' }).s;
  b += T(120, 140, 'Restaurant B', { anchor: 'end', weight: 'bold', size: 13, fill: GREEN }) + box(A.sx, 136, DATA.deliveryB, { color: GREEN, fill: '#E3F4EE' }).s;
  // z-score line
  b += T(20, 278, 'A z-score counts standard deviations from the mean', { weight: 'bold', size: 14 });
  const B = axis(60, 680, 360, -3, 3, 1, 'z-score', { fmt: z => (z > 0 ? '+' : '') + z });
  b += B.s + L(B.sx(0), 300, B.sx(0), 360, { stroke: GREY, dash: '4 4' }) + T(B.sx(0), 296, 'the mean', { anchor: 'middle', size: 12 });
  b += C(B.sx(1.5), 352, 7, { fill: PLUM });
  b += L(B.sx(0), 330, B.sx(1.5) - 2, 330, { stroke: PLUM, w: 2, arrow: 'plum' }) + T(B.sx(0.75), 322, '1.5 SDs above', { anchor: 'middle', size: 12, weight: 'bold', fill: PLUM });
  b += T(B.sx(1.5) + 12, 314, 'value with z = 1.5', { size: 12, fill: PLUM, weight: 'bold' });
  return svg(id, W, H, 'Comparing two groups, and a z-score',
    'Top: parallel boxplots of delivery times in minutes for two restaurants, 15 orders each. Restaurant A has median 32 and a narrow box from 28 to 36. Restaurant B has a lower median, 27, a wider box from 23 to 37, a long right whisker and one high outlier at 60. Bottom: a z-score number line from minus 3 to plus 3 with the mean at 0; a value with z = 1.5 sits 1.5 standard deviations above the mean.', b);
})());

// 1.10 from a question to a data collection plan
FIG.push((() => {
  const id = 'question-to-plan', W = 720, H = 360;
  let b = wrapBox(230, 14, 260, 62, 'Investigative question', 'variable, population, the kind\nof answer you want', { stroke: PLUM, w: 2, tfill: PLUM });
  b += L(360, 76, 360, 104, { arrow: 'ink' });
  b += wrapBox(200, 106, 320, 52, 'Data on every member of the population?', '', { fill: '#F7F8F8' });
  b += L(200, 132, 110, 132) + L(110, 132, 110, 206, { arrow: 'ink' }) + T(150, 124, 'yes', { anchor: 'middle', size: 12, weight: 'bold' });
  b += wrapBox(20, 208, 180, 62, 'Census', 'the population itself,\nno sample needed', { stroke: GREY });
  b += L(360, 158, 360, 186, { arrow: 'ink' }) + T(372, 177, 'no, a sample', { size: 12, weight: 'bold' });
  b += wrapBox(200, 188, 320, 52, 'Does the researcher impose a condition?', '', { fill: '#F7F8F8' });
  b += L(520, 214, 600, 214) + L(600, 214, 600, 262, { arrow: 'ink' }) + T(560, 206, 'yes', { anchor: 'middle', size: 12, weight: 'bold' });
  b += wrapBox(500, 264, 200, 82, 'Experiment', 'conditions decided by chance\nallow a cause-and-effect\nconclusion', { stroke: GREEN, w: 2, tfill: '#00704F' });
  b += L(360, 240, 360, 262, { arrow: 'ink' }) + T(372, 256, 'no', { size: 12, weight: 'bold' });
  b += wrapBox(220, 264, 270, 82, 'Observational study or sample survey', 'shows how variables relate;\nconfounding blocks a\ncause-and-effect conclusion', { stroke: BLUE, w: 2, tfill: '#005A8C', tsize: 13 });
  return svg(id, W, H, 'From an investigative question to a data collection plan',
    'A flowchart. It starts at the investigative question, which names the variable, the population and the kind of answer wanted. First decision: data on every member of the population? If yes, a census. If no, a sample, and a second decision: does the researcher impose a condition? If yes, an experiment, where conditions decided by chance allow a cause-and-effect conclusion. If no, an observational study or sample survey, which shows how variables relate, but confounding blocks a cause-and-effect conclusion.', b);
})());

// 1.11 four random sampling methods on one population
FIG.push((() => {
  const id = 'four-samples', W = 720, H = 470;
  // population: 6 homerooms (rows) of 8 students; selection lists by (row, col)
  const panels = [
    ['Simple random sample', 'any 8 of the 48 students', [[0, 2], [0, 7], [1, 4], [2, 0], [2, 5], [3, 3], [4, 6], [5, 1]]],
    ['Stratified random sample', '', null],
    ['Cluster sample', '2 whole homerooms chosen at random', [...[1, 4].flatMap(r => [0, 1, 2, 3, 4, 5, 6, 7].map(c => [r, c]))]],
    ['Systematic random sample', 'random start (3rd), then every 6th', null],
  ];
  // stratified by grade: rows 0-1 grade 9, 2-3 grade 10, 4-5 grade 11; pick 3 per grade
  panels[1] = ['Stratified random sample', 'strata = grades; 3 at random from each grade', [[0, 1], [0, 6], [1, 3], [2, 4], [3, 0], [3, 7], [4, 2], [5, 5], [5, 6]]];
  const sys = []; for (let k = 2; k < 48; k += 6) sys.push([Math.floor(k / 8), k % 8]);
  panels[3][2] = sys;
  let b = '';
  panels.forEach(([t, sub, sel], p) => {
    const ox = p % 2 ? 375 : 25, oy = p < 2 ? 18 : 245;
    b += T(ox + 160, oy + 16, t, { anchor: 'middle', weight: 'bold', size: 14 });
    b += T(ox + 160, oy + 34, sub, { anchor: 'middle', size: 12 });
    for (let r = 0; r < 6; r++) {
      if (p === 1 && r % 2 === 0) b += R(ox + 8, oy + 48 + r * 27, 304, 52, { rx: 6, fill: r === 2 ? '#F3F5F5' : '#FAFAFA', stroke: '#C9CFCD', w: 1 });
      if (p === 2 && (r === 1 || r === 4)) b += R(ox + 20, oy + 50 + r * 27, 242, 22, { rx: 11, fill: 'none', stroke: PLUM, w: 2 });
      for (let c = 0; c < 8; c++) {
        const on = sel.some(([a, bb]) => a === r && bb === c);
        b += C(ox + 32 + c * 31, oy + 61 + r * 27, on ? 8 : 6.5, { fill: on ? PLUM : '#C9CFCD' });
      }
    }
    if (p === 1) ['grade 9', 'grade 10', 'grade 11'].forEach((g, i) => { b += T(ox + 306, oy + 78 + i * 54, g, { size: 11.5, anchor: 'end', fill: '#5E6664', weight: 'bold' }); });
  });
  return svg(id, W, H, 'Four random sampling methods on one population',
    'Four copies of the same population of 48 students in 6 homerooms of 8, with selected students in plum. Simple random sample: any 8 of the 48, scattered. Stratified random sample: the grades are strata, two homerooms each, and 3 students are chosen at random from each grade. Cluster sample: 2 whole homerooms chosen at random. Systematic random sample: a random start at the 3rd student, then every 6th student in order.', b);
})());

// 1.12 where a sample can go wrong
FIG.push((() => {
  const id = 'frame-and-response', W = 720, H = 330;
  let b = '';
  b += `<ellipse cx="250" cy="165" rx="240" ry="140" fill="#F7F8F8" stroke="${INK}" stroke-width="1.5"/>`;
  b += T(70, 62, 'Population', { weight: 'bold', size: 15 }) + T(70, 80, 'all adults in the town', { size: 12 });
  b += `<ellipse cx="320" cy="175" rx="165" ry="105" fill="#E5F1F8" stroke="${BLUE}" stroke-width="2"/>`;
  b += T(320, 98, 'Sampling frame', { anchor: 'middle', weight: 'bold', size: 14, fill: '#005A8C' }) + T(320, 115, 'the list: landline numbers', { anchor: 'middle', size: 12 });
  b += `<ellipse cx="340" cy="200" rx="80" ry="55" fill="${TINT}" stroke="${PLUM}" stroke-width="2"/>`;
  b += T(340, 185, 'Sample', { anchor: 'middle', weight: 'bold', size: 14, fill: PLUM }) + T(340, 202, 'chosen at random', { anchor: 'middle', size: 12 });
  b += `<path d="M 290 222 A 52 30 0 0 0 390 222 z" fill="${PLUM}" opacity="0.85"/>`;
  b += T(340, 238, 'responded', { anchor: 'middle', size: 12, weight: 'bold', fill: '#FFFFFF' });
  // callouts
  b += TL(28, 140, 'Undercoverage:\npeople not on\nthe list can\nnever be chosen', { size: 12.5, weight: 'bold', lh: 15 });
  b += L(420, 190, 535, 140, { stroke: GREY }) + TL(540, 112, 'Nonresponse:\nchosen people who\ndo not answer', { size: 12.5, weight: 'bold', lh: 15 });
  b += L(390, 232, 535, 262, { stroke: GREY }) + TL(540, 258, 'Response bias:\nanswers that are not\ntrue (wording, pressure)', { size: 12.5, weight: 'bold', lh: 15 });
  return svg(id, W, H, 'Where a random sample can still go wrong',
    'Nested ovals. The largest is the population, all adults in the town. Inside it, the sampling frame, a list of landline numbers, which leaves part of the population out: undercoverage, people not on the list can never be chosen. Inside the frame, the sample chosen at random, and inside that the people who responded. Chosen people who do not answer are nonresponse. Answers that are not true, from wording or pressure, are response bias.', b);
})());

// 1.13 a randomized block design
FIG.push((() => {
  const id = 'block-design', W = 720, H = 360;
  let b = wrapBox(10, 140, 130, 70, '40 plants', 'experimental\nunits', { stroke: INK });
  const blocks = [['Block 1: sunny bench', '24 plants', 30], ['Block 2: shady bench', '16 plants', 200]];
  blocks.forEach(([t, n, y], i) => {
    b += L(140, 175, 172, y + 50, { arrow: 'ink' });
    b += wrapBox(175, y, 150, 100, t.split(': ')[0], t.split(': ')[1] + '\n' + n, { stroke: i ? BLUE : VERM, w: 2, tfill: i ? '#005A8C' : '#A84300' });
    b += L(325, y + 50, 333, y + 50, { stroke: PLUM }) + T(364, y + 46, 'random', { anchor: 'middle', size: 11.5, weight: 'bold', fill: PLUM }) + T(364, y + 60, 'assignment', { anchor: 'middle', size: 11.5, weight: 'bold', fill: PLUM });
    const half = i ? '8' : '12';
    b += L(398, y + 50, 438, y + 22, { arrow: 'plum', stroke: PLUM }) + L(398, y + 50, 438, y + 80, { arrow: 'plum', stroke: PLUM });
    b += wrapBox(440, y + 2, 134, 38, `Fertilizer A (${half})`, '', { stroke: GREEN });
    b += wrapBox(440, y + 60, 134, 38, `Fertilizer B (${half})`, '', { stroke: GREEN });
    b += L(574, y + 21, 598, y + 44, { arrow: 'ink' }) + L(574, y + 79, 598, y + 56, { arrow: 'ink' });
    b += wrapBox(600, y + 18, 112, 64, 'Compare', 'tomato weight\nwithin the block', {});
  });
  b += T(360, 352, 'Each block is a small completely randomized experiment; results are compared within blocks.', { anchor: 'middle', size: 12.5 });
  return svg(id, W, H, 'A randomized block design',
    'Forty tomato plants, the experimental units, are split into two blocks by location: 24 plants on a sunny bench and 16 on a shady bench. Within each block, random assignment puts half the plants on fertilizer A and half on fertilizer B (12 and 12 on the sunny bench, 8 and 8 on the shady bench). The response, tomato weight, is compared within each block. Each block is a small completely randomized experiment.', b);
})());

// math: part of a whole
FIG.push((() => {
  const id = 'part-of-whole', W = 720, H = 220;
  let b = T(20, 28, '18 of 24 students finished the reading', { weight: 'bold', size: 14 });
  for (let i = 0; i < 24; i++) b += R(30 + i * 27.5, 48, 25, 46, { rx: 4, fill: i < 18 ? PLUM : '#E3E7E6' });
  const A = axis(30, 688, 112, 0, 1, 0.25, '', { fmt: v => v.toFixed(2) });
  b += A.s;
  b += L(A.sx(0.75), 40, A.sx(0.75), 112, { stroke: VERM, w: 2.5, dash: '5 4' });
  b += T(360, 172, 'part / whole = 18 / 24 = 0.75 = 75%', { anchor: 'middle', size: 18, weight: 'bold', fill: PLUM });
  b += T(360, 200, 'The part is always counted inside the whole it belongs to.', { anchor: 'middle', size: 13 });
  return svg(id, W, H, 'A part over its whole',
    'Twenty-four boxes in a row, 18 shaded in plum, above a scale from 0 to 1 marked every 0.25. A dashed line at 0.75 marks where the shaded part ends. The caption reads: part over whole, 18 over 24, equals 0.75, equals 75%.', b);
})());

// math: distances from the average (the pieces of a formula)
FIG.push((() => {
  const id = 'distances-from-average', W = 720, H = 240, d = [2, 4, 9];
  const A = axis(60, 680, 170, 0, 10, 1, 'Value');
  const m = (2 + 4 + 9) / 3;
  let b = A.s;
  b += L(A.sx(m), 50, A.sx(m), 170, { stroke: PLUM, w: 2.5 }) + T(A.sx(m), 42, `average = (2 + 4 + 9) / 3 = 5`, { anchor: 'middle', size: 13, weight: 'bold', fill: PLUM });
  d.forEach((v, i) => {
    const y = 84 + i * 30;
    b += L(A.sx(m), y, A.sx(v), y, { stroke: v < m ? BLUE : GREEN, w: 2.5, arrow: 'ink' });
    b += T(v < m ? A.sx(m) - 8 : A.sx(m) + 8, y - 7, `${v} − 5 = ${String(v - m).replace('-', '−')}`, { anchor: v < m ? 'end' : 'start', size: 12, weight: 'bold' });
    b += C(A.sx(v), 162, 7, { fill: BLUE });
  });
  return svg(id, W, H, 'Distances from the average',
    'Three values, 2, 4 and 9, as dots on a number line from 0 to 10. A plum line marks their average, (2 + 4 + 9) / 3 = 5. Arrows from the average to each value show the distances 2 − 5 = −3, 4 − 5 = −1 and 9 − 5 = 4.', b);
})());

// math: inequalities on a number line
FIG.push((() => {
  const id = 'inequality-lines', W = 720, H = 330;
  const rows = [['at least 3', 'X ≥ 3', v => v >= 3], ['more than 3', 'X > 3', v => v > 3], ['at most 3', 'X ≤ 3', v => v <= 3], ['fewer than 3', 'X < 3, so X ≤ 2', v => v < 3]];
  let b = T(20, 24, 'A count X can be 0, 1, 2, ... , 8. Which counts does each phrase include?', { weight: 'bold', size: 13.5 });
  rows.forEach(([w, ineq, ok], i) => {
    const y = 66 + i * 66;
    b += T(20, y + 5, w, { weight: 'bold', size: 14, fill: PLUM }) + T(20, y + 23, ineq, { size: 13 });
    b += L(200, y, 690, y, { stroke: '#B8BFBD' });
    for (let v = 0; v <= 8; v++) {
      const x = 215 + v * 58;
      b += C(x, y, 11, ok(v) ? { fill: PLUM } : { fill: '#FFFFFF', stroke: GREY, w: 1.5 });
      b += T(x, y + 4.5, String(v), { anchor: 'middle', size: 12, weight: 'bold', fill: ok(v) ? '#FFFFFF' : GREY });
    }
  });
  return svg(id, W, H, 'Inequality words on a number line',
    'Four number lines for a count from 0 to 8, with the included counts filled in plum. At least 3, X ≥ 3: 3 through 8. More than 3, X > 3: 4 through 8. At most 3, X ≤ 3: 0 through 3. Fewer than 3, X < 3, so X ≤ 2: 0, 1 and 2.', b);
})());

// math: choosing 2 of 4
FIG.push((() => {
  const id = 'choose-two-of-four', W = 720, H = 250;
  const names = ['Ana', 'Ben', 'Cal', 'Dee'], cols = [BLUE, GREEN, PLUM, VERM];
  let b = T(20, 26, 'Choose 2 of 4 people for a team: order does not matter', { weight: 'bold', size: 14 });
  const pairs = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
  pairs.forEach(([a, c], i) => {
    const x = 28 + (i % 3) * 230, y = 52 + Math.floor(i / 3) * 78;
    b += R(x, y, 210, 60, { rx: 10, fill: '#F7F8F8', stroke: '#C9CFCD', w: 1 });
    [a, c].forEach((p, j) => { b += C(x + 50 + j * 110, y + 30, 20, { fill: cols[p] }) + T(x + 50 + j * 110, y + 35, names[p], { anchor: 'middle', size: 12.5, weight: 'bold', fill: '#FFFFFF' }); });
  });
  b += T(360, 232, '4C2 = 4! / (2! × 2!) = 24 / 4 = 6 teams', { anchor: 'middle', size: 16, weight: 'bold', fill: PLUM });
  return svg(id, W, H, 'Six ways to choose 2 of 4',
    'All six teams of 2 that can be chosen from Ana, Ben, Cal and Dee: Ana and Ben, Ana and Cal, Ana and Dee, Ben and Cal, Ben and Dee, Cal and Dee. Below: 4C2 = 4! / (2! × 2!) = 24 / 4 = 6 teams.', b);
})());

// math: slope and intercept
FIG.push((() => {
  const id = 'slope-intercept', W = 720, H = 360;
  const V = vaxis(90, 300, 30, 0, 40, 5, 'Cost (dollars)');
  const A = axis(90, 680, 300, 0, 8, 1, 'Hours of bike rental');
  const yv = x => 12 + 3 * x;
  let b = '';
  for (let v = 5; v <= 40; v += 5) b += L(90, V.sy(v), 680, V.sy(v), { stroke: '#EEF0EF', w: 1 });
  b += V.s + A.s;
  b += L(A.sx(0), V.sy(yv(0)), A.sx(8), V.sy(yv(8)), { stroke: PLUM, w: 3 });
  b += C(A.sx(0), V.sy(12), 6, { fill: VERM }) + T(A.sx(0) + 12, V.sy(12) + 22, 'intercept 12: the cost at 0 hours', { size: 12.5, weight: 'bold', fill: '#A84300' });
  b += L(A.sx(3), V.sy(yv(3)), A.sx(4), V.sy(yv(3)), { stroke: BLUE, w: 2.5 }) + L(A.sx(4), V.sy(yv(3)), A.sx(4), V.sy(yv(4)), { stroke: BLUE, w: 2.5 });
  b += T(A.sx(3.5), V.sy(yv(3)) + 18, 'run 1 hour', { anchor: 'middle', size: 12, weight: 'bold', fill: '#005A8C' });
  b += T(A.sx(4) + 8, V.sy(yv(3.5)) + 4, 'rise 3 dollars', { size: 12, weight: 'bold', fill: '#005A8C' });
  b += T(A.sx(5.6), V.sy(yv(5.6)) - 16, 'y = 12 + 3x', { size: 16, weight: 'bold', fill: PLUM, anchor: 'end' });
  b += T(A.sx(6.1), V.sy(yv(6.1)) + 26, 'slope: 3 dollars per hour', { size: 12.5, weight: 'bold', fill: PLUM });
  return svg(id, W, H, 'Slope and intercept of a line',
    'The line y = 12 + 3x for the cost in dollars of renting a bike for x hours, on axes from 0 to 8 hours and 0 to 40 dollars. The line starts at the intercept, 12 dollars at 0 hours. A step of 1 hour to the right (the run) goes with a rise of 3 dollars: the slope is 3 dollars per hour.', b);
})());

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  for (const F of FIG) {
    if (process.argv.includes('--list')) { console.log(F.id, F.w, F.h); continue; }
    writeFileSync(join(OUT, `${F.id}.svg`), F.svg);
  }
  if (!process.argv.includes('--list')) console.log(`wrote ${FIG.length} figures to statistics/figures/`);
}
export const FIGURES = FIG.map(({ id, w, h, alt }) => ({ id, w, h, alt }));
