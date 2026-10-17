/* Figures for AP® Statistics Unit 3, topics 3.9-3.15 (two proportions and
   chi-square). Run:
     node scripts/apstat-figures/unit-3b.mjs
   Writes statistics/figures/<id>.svg with the drawing helpers of
   scripts/apstat-figures/unit-5.mjs. Every picture is drawn from numbers
   computed here: simulated samples from a seeded generator, normal and
   chi-square curves from ApStatDist, intervals from ApStatDist.ci2prop,
   expected counts from ApStatDist.chi2table. */
import { fileURLToPath } from 'node:url';
import { Dist } from '../lib/apstat-mathlib.mjs';
import { C, frame, textAt, doc, save, r2, esc } from './unit-5.mjs';

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const binom = (R, n, p) => { let k = 0; for (let i = 0; i < n; i++) if (R() < p) k++; return k; };

export function unit3b() {
  // 3.9: 1,000 simulated differences, Northfield (p = 0.62, n = 150) minus Riverton (p = 0.48, n = 120).
  {
    const R = rng(3909), N = 1000, w = 0.02, start = -0.06;
    const d = []; for (let i = 0; i < N; i++) d.push(binom(R, 150, 0.62) / 150 - binom(R, 120, 0.48) / 120);
    const mu = 0.14, sd = Math.sqrt(0.62 * 0.38 / 150 + 0.48 * 0.52 / 120);
    const nb = 19, counts = Array(nb).fill(0);
    for (const v of d) { const j = Math.floor((v - start) / w + 1e-9); if (j >= 0 && j < nb) counts[j]++; }
    const top = Math.max(...counts);
    const W = 640, H = 400;
    const F = frame({ x0: 78, y0: 24, w: 530, h: 290, x: [start, start + nb * w], y: [0, Math.ceil(top * 1.15 / 20) * 20], xStep: 0.04, yStep: 20,
      xLabel: 'Simulated difference in sample proportions (Northfield minus Riverton)', yLabel: 'Number of simulations' }).axes();
    counts.forEach((c, j) => { if (c) F.rect(start + j * w, start + (j + 1) * w, 0, c, C.tint, C.plum); });
    F.curve(x => N * w * Dist.normPdf(x, mu, sd), start, start + nb * w, C.blue, 2.6);
    F.line(mu, 0, mu, top * 1.08, C.ink, 1.4, '5 4');
    F.text(mu, top * 1.1, 'center 0.14', { anchor: 'middle', bold: true, dy: -2 });
    F.text(-0.05, top * 1.0, 'normal curve from the formulas:', { color: C.blue, bold: true }).text(-0.05, top * 0.92, `mean 0.14, SD ${sd.toFixed(3)}`, { color: C.blue, bold: true });
    save('diff-props-sim', doc(W, H, 'Simulated differences in two sample proportions',
      `Histogram of 1,000 simulated values of the Northfield sample proportion minus the Riverton sample proportion, for random samples of 150 and 120 households when the true proportions are 0.62 and 0.48. The bars are centered at 0.14 and run from about 0 to 0.30; a normal curve with mean 0.14 and standard deviation ${sd.toFixed(3)} fits them closely.`, F.svg()));
  }
  // 3.10: the 95% interval for p_city - p_sub, city 0.62 of 400, suburbs 0.54 of 300.
  {
    const I = Dist.ci2prop(0.62, 400, 0.54, 300, 0.95), W = 640, H = 230;
    const F = frame({ x0: 40, y0: 30, w: 560, h: 120, x: [-0.04, 0.2], y: [0, 4], xStep: 0.02, yTicks: false, grid: false, yAxis: false,
      xLabel: 'Difference in proportions, city minus suburbs' }).axes();
    const y = 2;
    F.line(I.lo, y, I.hi, y, C.plum, 5).line(I.lo, y - 0.5, I.lo, y + 0.5, C.plum, 3).line(I.hi, y - 0.5, I.hi, y + 0.5, C.plum, 3).dot(0.08, y, C.ink, 6);
    F.line(0, 0, 0, 3.6, C.soft, 1.4, '5 4').text(0, 3.75, '0 (no difference)', { anchor: 'middle', color: C.soft });
    F.text(0.08, y + 0.85, 'estimate 0.08', { anchor: 'middle', bold: true });
    F.text(I.lo + 0.003, y - 1.3, I.lo.toFixed(3), { anchor: 'start', color: C.plum, bold: true }).text(I.hi, y - 1.3, I.hi.toFixed(3), { anchor: 'middle', color: C.plum, bold: true });
    F.text(0.117, y + 0.85, `± ${I.me.toFixed(3)}`, { anchor: 'start', color: C.plum, bold: true });
    save('two-prop-interval', doc(W, H, 'A 95% confidence interval for a difference in proportions',
      `Number line from -0.04 to 0.20. A dot marks the sample difference 0.08 (0.62 minus 0.54). A bar runs from ${I.lo.toFixed(3)} to ${I.hi.toFixed(3)}, the estimate plus or minus a margin of error of ${I.me.toFixed(3)}. A dashed line marks 0, just to the left of the interval.`, F.svg()));
  }
  // 3.11: three 95% intervals against 0 (the studies of the lesson).
  {
    const studies = [
      { name: 'Nudge emails (A)', lo: 0.03, hi: 0.11, col: C.plum, note: 'all above 0' },
      { name: 'Checkout snack (B)', lo: -0.04, hi: 0.06, col: C.soft, note: 'contains 0' },
      { name: 'New soil (C)', lo: -0.15, hi: -0.02, col: C.verm, note: 'all below 0' },
    ];
    const W = 660, H = 290;
    const F = frame({ x0: 170, y0: 24, w: 460, h: 190, x: [-0.2, 0.15], y: [0, 6], xStep: 0.05, yTicks: false, grid: false, yAxis: false,
      xLabel: 'Interval for the difference in proportions, group 1 minus group 2' }).axes();
    F.line(0, 0, 0, 6, C.ink, 1.6, '5 4').text(0, 5.75, '0', { anchor: 'middle', bold: true, dx: 9 });
    studies.forEach((st, i) => {
      const y = 4.8 - i * 1.8;
      F.line(st.lo, y, st.hi, y, st.col, 5).line(st.lo, y - 0.35, st.lo, y + 0.35, st.col, 3).line(st.hi, y - 0.35, st.hi, y + 0.35, st.col, 3).dot((st.lo + st.hi) / 2, y, C.ink, 4.5);
      F.raw(textAt(160, F.sy(y) + 5, st.name, { anchor: 'end', bold: true }));
      F.text(st.hi, y + 0.55, st.note, { anchor: 'middle', color: st.col, bold: true, dx: st.hi < 0 ? -10 : 0 });
    });
    save('intervals-vs-zero', doc(W, H, 'Three confidence intervals compared with 0',
      'Three 95% intervals for a difference in proportions on one axis with a dashed line at 0. Study A runs from 0.03 to 0.11, entirely above 0. Study B runs from -0.04 to 0.06 and contains 0. Study C runs from -0.15 to -0.02, entirely below 0.', F.svg()));
  }
  // 3.12: two sample proportions and the pooled proportion (bins: 125 of 160, 91 of 140).
  {
    const T = Dist.z2prop(125, 160, 91, 140), W = 600, H = 360;
    const F = frame({ x0: 80, y0: 24, w: 490, h: 250, x: [0, 3], y: [0, 1], yStep: 0.2, xFmt: () => '', xStep: 5, yLabel: 'Proportion who sorted correctly' }).axes();
    const bars = [{ x: 0.5, v: T.p1, name: 'New bin', sub: '125 of 160', col: C.plum, fill: C.tint }, { x: 1.5, v: T.p2, name: 'Old bin', sub: '91 of 140', col: C.blue, fill: C.blueTint }];
    bars.forEach(b => { F.rect(b.x - 0.3, b.x + 0.3, 0, b.v, b.fill, b.col); F.text(b.x, b.v, b.v.toFixed(3), { anchor: 'middle', dy: -7, bold: true, color: b.col });
      F.raw(textAt(F.sx(b.x), F.sy(0) + 20, b.name, { anchor: 'middle', bold: true })).raw(textAt(F.sx(b.x), F.sy(0) + 37, b.sub, { anchor: 'middle', color: C.soft })); });
    F.rect(2.2, 2.8, 0, T.pc, '#EEF0EF', C.ink); F.text(2.5, T.pc, `p_c = ${T.pc.toFixed(2)}`, { anchor: 'middle', dy: -12, bold: true });
    F.raw(textAt(F.sx(2.5), F.sy(0) + 20, 'Pooled', { anchor: 'middle', bold: true })).raw(textAt(F.sx(2.5), F.sy(0) + 37, '216 of 300', { anchor: 'middle', color: C.soft }));
    F.line(0.1, T.pc, 2.9, T.pc, C.ink, 1.4, '6 5');
    save('pooled-proportion', doc(W, H, 'Two sample proportions and the pooled proportion',
      `Bar chart. New bin: 125 of 160 households sorted correctly, ${T.p1.toFixed(3)}. Old bin: 91 of 140, ${T.p2.toFixed(3)}. Pooled: 216 of 300, ${T.pc.toFixed(2)}, shown with a dashed line across both bars; it lies between the two sample proportions, closer to the larger group.`, F.svg()));
  }
  // 3.13: the null distribution of p-hat_N - p-hat_O, the observed difference and the shaded p-value.
  {
    const T = Dist.z2prop(125, 160, 91, 140), d = T.p1 - T.p2, W = 640, H = 360;
    const F = frame({ x0: 60, y0: 30, w: 550, h: 240, x: [-0.2, 0.2], y: [0, 9], xStep: 0.05, yTicks: false, grid: false,
      xLabel: 'Difference in sample proportions if H₀ is true (new minus old)' }).axes();
    const f = x => Dist.normPdf(x, 0, T.se);
    F.area(f, d, 0.2, C.plum, 0.45).curve(f, -0.2, 0.2, C.ink, 2.4);
    F.line(d, 0, d, 7.4, C.plum, 2, '6 4').text(d, 7.6, `observed ${d.toFixed(3)}`, { anchor: 'middle', bold: true, color: C.plum, dy: -2 });
    F.text(d + 0.012, 0.9, `p-value = ${T.p.greater.toFixed(4)}`, { color: C.plum, bold: true });
    F.text(-0.19, 7.9, `centered at 0, SE = ${T.se.toFixed(4)} (from p_c = 0.72)`, { bold: true });
    save('two-prop-pvalue', doc(W, H, 'The p-value of a two-sample z test',
      `Normal curve centered at 0 with standard deviation ${T.se.toFixed(4)}: the distribution of the difference in sample proportions if the null hypothesis is true. A dashed line marks the observed difference ${d.toFixed(3)}, and the small area to its right is shaded: the p-value, ${T.p.greater.toFixed(4)}, for z = ${T.z.toFixed(2)}.`, F.svg()));
  }
  // 3.14: observed counts with expected counts (age group by news source), from chi2table.
  {
    const obs = [[62, 18, 40], [45, 40, 55], [23, 72, 45]], T = Dist.chi2table(obs);
    const rows = ['18 to 34', '35 to 54', '55 and older'], cols = ['Social media', 'TV', 'News websites'];
    const W = 700, H = 330, x0 = 20, y0 = 50, cw = 150, rh = 52, lw = 130;
    const out = [];
    out.push(textAt(x0 + lw + 1.5 * cw, 26, 'Main news source', { anchor: 'middle', bold: true, size: 14 }));
    cols.forEach((c, j) => out.push(textAt(x0 + lw + j * cw + cw / 2, y0 + 30, c, { anchor: 'middle', bold: true })));
    out.push(textAt(x0 + lw + 3 * cw + 40, y0 + 30, 'Total', { anchor: 'middle', bold: true }));
    out.push(textAt(x0 + 4, y0 + 30, 'Age group', { bold: true }));
    const top = y0 + 42;
    rows.forEach((r, i) => {
      const y = top + i * rh;
      out.push(`<rect x="${x0}" y="${y}" width="${lw + 3 * cw + 80}" height="${rh}" fill="${i % 2 ? '#FAFBFA' : '#ffffff'}" stroke="${C.grid}"/>`);
      out.push(textAt(x0 + 6, y + 31, r, { bold: true }));
      obs[i].forEach((o, j) => {
        const cx = x0 + lw + j * cw + cw / 2, hl = i === 2 && j === 1;
        if (hl) out.push(`<rect x="${x0 + lw + j * cw + 6}" y="${y + 5}" width="${cw - 12}" height="${rh - 10}" rx="6" fill="${C.tint}" stroke="${C.plum}" stroke-width="1.6"/>`);
        out.push(textAt(cx - 8, y + 32, String(o), { anchor: 'end', bold: true, size: 16 }));
        out.push(textAt(cx - 2, y + 32, `(${+T.expected[i][j].toFixed(1)})`, { anchor: 'start', color: C.blue, size: 14 }));
      });
      out.push(textAt(x0 + lw + 3 * cw + 40, y + 32, String(T.rowTotals[i]), { anchor: 'middle' }));
    });
    const yt = top + 3 * rh;
    out.push(`<line x1="${x0}" y1="${yt}" x2="${x0 + lw + 3 * cw + 80}" y2="${yt}" stroke="${C.ink}" stroke-width="1.4"/>`);
    out.push(textAt(x0 + 6, yt + 24, 'Total', { bold: true }));
    T.colTotals.forEach((c, j) => out.push(textAt(x0 + lw + j * cw + cw / 2, yt + 24, String(c), { anchor: 'middle' })));
    out.push(textAt(x0 + lw + 3 * cw + 40, yt + 24, String(T.total), { anchor: 'middle', bold: true }));
    out.push(textAt(x0 + 6, yt + 58, `Observed count in black, (expected count) in blue. Highlighted: expected = 140 × 130 / 400 = ${T.expected[2][1]}`, { color: C.plum, bold: true }));
    save('expected-counts-table', doc(W, H, 'Observed and expected counts in a two-way table',
      `Two-way table of 400 adults by age group (18 to 34, 35 to 54, 55 and older) and main news source (social media, TV, news websites). Each cell shows the observed count and, in parentheses, the expected count if there were no association: ${rows.map((r, i) => `${r}: ${obs[i].map((o, j) => `${o} (${+T.expected[i][j].toFixed(1)})`).join(', ')}`).join('; ')}. The 55 and older, TV cell is highlighted: expected = 140 times 130 divided by 400 = 45.5.`, out.join('')));
  }
  // 3.15: the chi-square distribution with df = 2 and the p-value for the phone and sleep table.
  {
    const T = Dist.chi2table([[70, 90, 40], [20, 50, 30]]), W = 640, H = 360;
    const F = frame({ x0: 70, y0: 30, w: 540, h: 240, x: [0, 14], y: [0, 0.52], xStep: 2, yStep: 0.1, xLabel: 'Value of the chi-square statistic (df = 2)', yLabel: 'Density', yLabelGap: 50 }).axes();
    const f = x => Dist.chi2Pdf(x, T.df);
    F.area(f, T.chi2, 14, C.plum, 0.5).curve(f, 0.001, 14, C.ink, 2.4);
    F.line(T.chi2, 0, T.chi2, 0.2, C.plum, 2, '6 4').text(T.chi2, 0.215, `observed χ² = ${T.chi2.toFixed(2)}`, { anchor: 'middle', bold: true, color: C.plum });
    F.text(T.chi2 + 0.4, 0.05, `p-value = ${T.p.toFixed(4)}`, { color: C.plum, bold: true });
    F.text(3.2, 0.36, 'If H₀ is true, most values are small:', { bold: true }).text(3.2, 0.33, 'the mean of this curve is df = 2', { bold: true });
    save('chi-square-tail', doc(W, H, 'The chi-square distribution and a p-value',
      `Right-skewed chi-square density curve with 2 degrees of freedom, starting high at 0 and falling toward 14. A dashed line marks the observed chi-square statistic, ${T.chi2.toFixed(2)}, and the thin tail to its right is shaded: the p-value, ${T.p.toFixed(4)}.`, F.svg()));
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) unit3b();
