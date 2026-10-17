/* Figures for AP® Statistics Unit 5 (5.1-5.5, regression), and the small
   drawing library the Unit 3 two-sample and chi-square figures share
   (scripts/apstat-figures/unit-3b.mjs imports it). Run:
     node scripts/apstat-figures/unit-5.mjs
   Writes statistics/figures/<id>.svg. Every plot is drawn from the data or
   the distribution written out below it: points from the data lists, lines
   from ApStatDist.lsrl, residuals from the same fit, so a picture always
   shows the numbers the lesson states. Standalone SVG: white background,
   role="img" with <title> and <desc>, Arial/Helvetica, ink #1F2A28, course
   plum #6E2470 for emphasis, Okabe-Ito blue, green and vermillion. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Dist } from '../lib/apstat-mathlib.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export const OUT = join(ROOT, 'statistics', 'figures');
export const C = { ink: '#1F2A28', plum: '#6E2470', blue: '#0072B2', green: '#009E73', verm: '#D55E00',
  grid: '#E6E9E8', soft: '#5B6663', faint: '#9AA4A1', tint: '#F5E6F4', blueTint: '#E3F0F8' };
export const r2 = v => Math.round(v * 100) / 100;
export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const fmt = v => String(+(+v).toPrecision(6)).replace('-', '−');

export function niceStep(raw) {
  const p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}
export function ticks(a, b, step) {
  const out = [];
  for (let k = Math.ceil(a / step - 1e-9); k * step <= b + 1e-9; k++) out.push(Math.abs(k) < 1e-9 ? 0 : +(k * step).toPrecision(10));
  return out;
}

/* A plotting frame in data coordinates. o: { x0, y0, w, h, x: [a, b], y: [c, d],
   xStep, yStep, xLabel, yLabel, xFmt, yFmt, grid, yTicks } (x0, y0 the top
   left corner of the plot area inside the document). */
export function frame(o) {
  const [a, b] = o.x, [c, d] = o.y;
  const sx = v => o.x0 + (v - a) / (b - a) * o.w, sy = v => o.y0 + o.h - (v - c) / (d - c) * o.h;
  const parts = [];
  const F = { o, sx, sy, parts,
    axes() {
      const xs = ticks(a, b, o.xStep || niceStep((b - a) / 6)), ys = o.yTicks === false ? [] : ticks(c, d, o.yStep || niceStep((d - c) / 5));
      const g = [];
      if (o.grid !== false) {
        for (const v of ys) g.push(`<line x1="${o.x0}" y1="${r2(sy(v))}" x2="${o.x0 + o.w}" y2="${r2(sy(v))}" stroke="${C.grid}" stroke-width="1"/>`);
        if (o.grid === 'xy') for (const v of xs) g.push(`<line x1="${r2(sx(v))}" y1="${o.y0}" x2="${r2(sx(v))}" y2="${o.y0 + o.h}" stroke="${C.grid}" stroke-width="1"/>`);
      }
      const yb = o.y0 + o.h;
      g.push(`<line x1="${o.x0}" y1="${yb}" x2="${o.x0 + o.w}" y2="${yb}" stroke="${C.ink}" stroke-width="1.4"/>`);
      if (o.yAxis !== false) g.push(`<line x1="${o.x0}" y1="${o.y0}" x2="${o.x0}" y2="${yb}" stroke="${C.ink}" stroke-width="1.4"/>`);
      for (const v of xs) g.push(`<line x1="${r2(sx(v))}" y1="${yb}" x2="${r2(sx(v))}" y2="${yb + 5}" stroke="${C.ink}" stroke-width="1.2"/><text x="${r2(sx(v))}" y="${yb + 20}" text-anchor="middle" font-size="13" fill="${C.ink}">${esc((o.xFmt || fmt)(v))}</text>`);
      for (const v of ys) g.push(`<line x1="${o.x0 - 5}" y1="${r2(sy(v))}" x2="${o.x0}" y2="${r2(sy(v))}" stroke="${C.ink}" stroke-width="1.2"/><text x="${o.x0 - 9}" y="${r2(sy(v) + 4.5)}" text-anchor="end" font-size="13" fill="${C.ink}">${esc((o.yFmt || fmt)(v))}</text>`);
      if (o.xLabel) g.push(`<text x="${r2(o.x0 + o.w / 2)}" y="${yb + 44}" text-anchor="middle" font-size="14" font-weight="bold" fill="${C.ink}">${esc(o.xLabel)}</text>`);
      if (o.yLabel) g.push(`<text transform="translate(${o.x0 - (o.yLabelGap || 46)} ${r2(o.y0 + o.h / 2)}) rotate(-90)" text-anchor="middle" font-size="14" font-weight="bold" fill="${C.ink}">${esc(o.yLabel)}</text>`);
      parts.unshift(g.join(''));
      return F;
    },
    rect(x1, x2, y1, y2, fill, stroke = C.plum, extra = '') { parts.push(`<rect x="${r2(sx(x1))}" y="${r2(sy(y2))}" width="${r2(sx(x2) - sx(x1))}" height="${r2(sy(y1) - sy(y2))}" fill="${fill}" stroke="${stroke}" stroke-width="1.2" ${extra}/>`); return F; },
    dot(x, y, col = C.plum, rad = 4.5, open = false) { parts.push(`<circle cx="${r2(sx(x))}" cy="${r2(sy(y))}" r="${rad}" fill="${open ? '#fff' : col}" stroke="${col}" stroke-width="1.6"/>`); return F; },
    line(x1, y1, x2, y2, col = C.blue, wid = 2.4, dash = '') {
      // Clip the segment to the frame (Liang-Barsky), so a fitted line never leaves the plot.
      let t0 = 0, t1 = 1; const dx = x2 - x1, dy = y2 - y1;
      for (const [p, q] of [[-dx, x1 - a], [dx, b - x1], [-dy, y1 - c], [dy, d - y1]]) {
        if (Math.abs(p) < 1e-15) { if (q < 0) return F; continue; }
        const t = q / p; if (p < 0) { if (t > t1) return F; if (t > t0) t0 = t; } else { if (t < t0) return F; if (t < t1) t1 = t; }
      }
      [x1, y1, x2, y2] = [x1 + t0 * dx, y1 + t0 * dy, x1 + t1 * dx, y1 + t1 * dy];
      parts.push(`<line x1="${r2(sx(x1))}" y1="${r2(sy(y1))}" x2="${r2(sx(x2))}" y2="${r2(sy(y2))}" stroke="${col}" stroke-width="${wid}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linecap="round"/>`); return F; },
    curve(fn, x1, x2, col = C.blue, wid = 2.6, dash = '') {
      const pts = [];
      for (let i = 0; i <= 240; i++) { const x = x1 + (x2 - x1) * i / 240, y = fn(x); if (isFinite(y)) pts.push(`${r2(sx(x))},${r2(sy(Math.min(y, d)))}`); }
      parts.push(`<polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="${wid}" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`); return F;
    },
    area(fn, x1, x2, fill = C.plum, op = 0.35) {
      const pts = [`${r2(sx(x1))},${r2(sy(0))}`];
      for (let i = 0; i <= 160; i++) { const x = x1 + (x2 - x1) * i / 160, y = fn(x); pts.push(`${r2(sx(x))},${r2(sy(Math.min(isFinite(y) ? y : d, d)))}`); }
      pts.push(`${r2(sx(x2))},${r2(sy(0))}`);
      parts.push(`<polygon points="${pts.join(' ')}" fill="${fill}" fill-opacity="${op}" stroke="none"/>`); return F;
    },
    text(x, y, s, o2 = {}) { parts.push(textAt(sx(x) + (o2.dx || 0), sy(y) + (o2.dy || 0), s, o2)); return F; },
    raw(s) { parts.push(s); return F; },
    svg() { return parts.join(''); },
  };
  return F;
}
/* Text at pixel coordinates: o { size, color, anchor, bold, italic }. "_x" in s
   becomes a subscript x (one token), "^2" a superscript. */
export function textAt(x, y, s, o = {}) {
  const size = o.size || 13;
  const body = esc(s).replace(/_\{([^}]*)\}|_([A-Za-z0-9]+)/g, (m, a, b) => `<tspan baseline-shift="sub" font-size="${r2(size * 0.75)}">${a || b}</tspan>`)
    .replace(/\^\{([^}]*)\}|\^([A-Za-z0-9]+)/g, (m, a, b) => `<tspan baseline-shift="super" font-size="${r2(size * 0.75)}">${a || b}</tspan>`);
  return `<text x="${r2(x)}" y="${r2(y)}" font-size="${size}" fill="${o.color || C.ink}" text-anchor="${o.anchor || 'start'}"${o.bold ? ' font-weight="bold"' : ''}${o.italic ? ' font-style="italic"' : ''}>${body}</text>`;
}
export function doc(w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d" font-family="Arial, Helvetica, sans-serif">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<rect width="${w}" height="${h}" fill="#ffffff"/>
${body}
</svg>
`;
}
export function save(id, svg) {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${id}.svg`), svg);
  console.log('wrote', id);
}

/* ----------------------------------------------------------- Unit 5 data
   The same data sets the lessons, notes and items use. */
// 5.1 and 5.3: hours of sleep the night before and reaction time (ms), 14 students (invented).
export const SLEEP = { xs: [4.5, 5, 5.5, 6, 6, 6.5, 7, 7, 7.5, 8, 8, 8.5, 9, 9.5],
  ys: [338, 341, 322, 330, 312, 326, 301, 318, 309, 294, 306, 287, 296, 281] };
// 5.2: four invented data sets with different correlations (n = 20 each).
// 5.4: car age (years) and price (thousands of dollars), with a curved pattern.
export const CARS = { xs: [1, 1, 2, 2, 3, 3, 4, 4, 5, 6, 6, 7, 8, 9, 10, 11],
  ys: [31.5, 30.2, 26.4, 27.5, 23.1, 22.4, 20.4, 19.6, 17.6, 15.6, 16.4, 14.8, 13.7, 12.9, 12.5, 12.2] };
// 5.5: practice hours per week and free throw percentage, with one influential point.
export const FT = { xs: [2, 3, 3, 4, 5, 5, 6, 7, 7, 8], ys: [52, 55, 58, 57, 62, 60, 66, 65, 69, 70], extra: [16, 58] };

function scatterFig(id, data, o) {
  const W = o.W || 620, H = o.H || 400;
  const F = frame({ x0: 78, y0: 24, w: W - 110, h: H - 100, x: o.x, y: o.y, xStep: o.xStep, yStep: o.yStep, xLabel: o.xLabel, yLabel: o.yLabel, grid: 'xy' }).axes();
  const L = Dist.lsrl(data.xs, data.ys);
  if (o.line) F.line(o.x[0], L.a + L.b * o.x[0], o.x[1], L.a + L.b * o.x[1], C.blue, 2.4);
  data.xs.forEach((x, i) => F.dot(x, data.ys[i], C.plum));
  if (o.extra) o.extra(F, L);
  return { F, L, W, H };
}

export function unit5() {
  // 5.1 scatterplot of sleep and reaction time
  {
    const { F, W, H } = scatterFig('sleep-reaction', SLEEP, { x: [4, 10], y: [270, 360], xStep: 1, yStep: 10, xLabel: 'Hours of sleep the night before', yLabel: 'Reaction time (ms)' });
    F.text(9.9, 350, 'Direction: negative', { anchor: 'end', color: C.plum, bold: true });
    F.text(9.9, 342, 'Form: linear', { anchor: 'end', color: C.plum, bold: true });
    F.text(9.9, 334, 'Strength: strong', { anchor: 'end', color: C.plum, bold: true });
    save('sleep-reaction', doc(W, H, 'Scatterplot of hours of sleep and reaction time',
      'Scatterplot of 14 students: hours of sleep the night before (4.5 to 9.5) on the horizontal axis and reaction time in milliseconds (281 to 341) on the vertical axis. The points fall from upper left to lower right along a fairly narrow straight band: a strong, negative, linear association with no outliers.', F.svg()));
  }
  // 5.2 four scatterplots with their correlations, computed from the data
  {
    const sets = corrSets();
    const W = 760, H = 250, cells = [];
    sets.forEach((s, k) => {
      const r = Dist.lsrl(s.xs, s.ys).r;
      const F = frame({ x0: 22 + k * 186, y0: 34, w: 160, h: 160, x: [0, 10], y: [0, 10], xStep: 5, yStep: 5, grid: false, yTicks: false, xFmt: () => '' });
      F.axes();
      s.xs.forEach((x, i) => F.dot(x, s.ys[i], C.plum, 3.6));
      cells.push(F.svg() + textAt(22 + k * 186 + 80, 22, `r = ${r.toFixed(2).replace('-', '−')}`, { anchor: 'middle', bold: true, size: 15, color: C.plum }) + textAt(22 + k * 186 + 80, 222, s.name, { anchor: 'middle', size: 13 }));
    });
    save('correlation-gallery', doc(W, H, 'Four scatterplots and their correlations',
      `Four scatterplots of invented data. From left to right: ${sets.map(s => `${s.name}, r = ${Dist.lsrl(s.xs, s.ys).r.toFixed(2)}`).join('; ')}. The closer r is to 1 or -1, the more tightly the points hug a line; the curved set has r near 0 even though x and y are strongly related.`, cells.join('')));
  }
  // 5.3 the regression line with one prediction
  {
    const L0 = Dist.lsrl(SLEEP.xs, SLEEP.ys);
    const { F, W, H } = scatterFig('regression-line-predict', SLEEP, { x: [4, 10], y: [270, 360], xStep: 1, yStep: 10, xLabel: 'Hours of sleep the night before', yLabel: 'Reaction time (ms)', line: true,
      extra: (F, L) => {
        const yh = L.a + L.b * 6.8;
        F.line(6.8, 270, 6.8, yh, C.verm, 1.8, '6 5').line(4, yh, 6.8, yh, C.verm, 1.8, '6 5').dot(6.8, yh, C.verm, 5.5);
        F.text(6.9, 273.5, `6.8 hours: predicted ${yh.toFixed(0)} ms`, { color: C.verm, bold: true });
        F.text(9.9, 352, `predicted time = ${L.a.toFixed(1)} − ${Math.abs(L.b).toFixed(2)}(hours)`, { anchor: 'end', color: C.blue, bold: true });
      } });
    void L0;
    save('regression-line-predict', doc(W, H, 'The regression line for sleep and reaction time, with one prediction',
      `The 14 points of the sleep scatterplot with the line predicted reaction time = ${L0.a.toFixed(1)} minus ${Math.abs(L0.b).toFixed(2)} times hours of sleep. A dashed path marks 6.8 hours on the horizontal axis, up to the line, and across to a predicted reaction time of ${(L0.a + L0.b * 6.8).toFixed(0)} milliseconds.`, F.svg()));
  }
  // 5.4 scatterplot with a line and the residual plot below: a curved pattern
  {
    const L = Dist.lsrl(CARS.xs, CARS.ys);
    const W = 620, H = 640;
    const F1 = frame({ x0: 78, y0: 24, w: 510, h: 250, x: [0, 12], y: [10, 34], xStep: 2, yStep: 4, yLabel: 'Price ($1,000)', grid: 'xy' }).axes();
    F1.line(0, L.a, 12, L.a + L.b * 12, C.blue, 2.4);
    CARS.xs.forEach((x, i) => F1.dot(x, CARS.ys[i]));
    F1.text(11.9, 31.5, 'regression line', { anchor: 'end', color: C.blue, bold: true });
    const m = Math.max(...L.residuals.map(Math.abs));
    const F2 = frame({ x0: 78, y0: 350, w: 510, h: 210, x: [0, 12], y: [-4, 4], xStep: 2, yStep: 2, xLabel: 'Age of car (years)', yLabel: 'Residual ($1,000)', grid: 'xy' }).axes();
    F2.line(0, 0, 12, 0, C.ink, 1.4, '6 5');
    CARS.xs.forEach((x, i) => F2.dot(x, L.residuals[i], C.verm));
    F2.text(6, 3.4, 'positive, then negative, then positive: a curve', { anchor: 'middle', color: C.verm, bold: true });
    void m;
    save('residual-plot-pair', doc(W, H, 'Car age and price: scatterplot with the line, and its residual plot',
      'Top: 16 used cars, age in years against price in thousands of dollars, with the regression line. The points bend: they lie above the line for the newest and oldest cars and below it in the middle. Bottom: the residual plot shows the same bend as a U shape around the zero line, so a line is not the right model.', F1.svg() + F2.svg()));
  }
  // 5.5 an influential point: the line with and without it
  {
    const all = { xs: [...FT.xs, FT.extra[0]], ys: [...FT.ys, FT.extra[1]] };
    const L1 = Dist.lsrl(FT.xs, FT.ys), L2 = Dist.lsrl(all.xs, all.ys);
    const W = 620, H = 400;
    const F = frame({ x0: 78, y0: 24, w: 510, h: 300, x: [0, 18], y: [45, 80], xStep: 2, yStep: 5, xLabel: 'Practice hours per week', yLabel: 'Free throws made (%)', grid: 'xy' }).axes();
    F.line(0, L1.a, 18, L1.a + L1.b * 18, C.blue, 2.4);
    F.line(0, L2.a, 18, L2.a + L2.b * 18, C.verm, 2.4, '8 6');
    FT.xs.forEach((x, i) => F.dot(x, FT.ys[i]));
    F.dot(FT.extra[0], FT.extra[1], C.verm, 6);
    F.text(FT.extra[0], FT.extra[1] - 2.8, 'high-leverage point', { anchor: 'middle', color: C.verm, bold: true });
    F.text(7.6, 75.5, `without it: slope ${L1.b.toFixed(2)}`, { color: C.blue, bold: true, anchor: 'end' });
    F.text(10.2, L2.a + L2.b * 10.2 - 2.0, `with it: slope ${L2.b.toFixed(2)}`, { color: C.verm, bold: true });
    save('influential-point', doc(W, H, 'An influential point changes the least-squares line',
      `Ten players' practice hours (2 to 8) and free throw percentages (52 to 70) rise together. An eleventh player practices 16 hours and makes 58%. Without that player the least-squares slope is ${L1.b.toFixed(2)} percentage points per hour (solid line); with the player it drops to ${L2.b.toFixed(2)} (dashed line), so the point is influential.`, F.svg()));
  }
}

export function corrSets() {
  // Seeded and fixed: four 20-point sets built from a line plus a fixed list of
  // deviations, so r is computed, never typed.
  const xs = [0.6, 1.1, 1.5, 2.0, 2.6, 3.0, 3.4, 3.9, 4.3, 4.8, 5.2, 5.7, 6.1, 6.6, 7.0, 7.4, 7.9, 8.4, 8.8, 9.3];
  const e = [0.9, -1.2, 0.4, -0.3, 1.5, -0.8, 0.2, -1.6, 1.1, 0.6, -0.5, 1.3, -1.0, 0.3, -0.2, 1.7, -1.4, 0.8, -0.6, 0.1];
  return [
    { name: 'strong positive', xs, ys: xs.map((x, i) => 1 + 0.85 * x + 0.35 * e[i]) },
    { name: 'moderate negative', xs, ys: xs.map((x, i) => 8.6 - 0.6 * x + 1.3 * e[i]) },
    { name: 'weak positive', xs, ys: xs.map((x, i) => 3.4 + 0.22 * x + 1.9 * e[i]) },
    { name: 'curved, r near 0', xs, ys: xs.map((x, i) => 9 - 0.38 * (x - 5) * (x - 5) + 0.25 * e[i]) },
  ];
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) unit5();
