/* Figures for the ir notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Order follows the page: a bond as a spring, why a polar stretch absorbs
   and a symmetric one does not, bond order and mass, the map of regions,
   the X–H band shapes, a real spectrum (butanoic acid), donation and
   conjugation weakening a C=O, ring size, and the two worked examples.
   Figures shown in the lesson are 340 wide; `l-` marks a stacked lesson
   copy of a wide notes figure. */
import { atom, bond, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, polyPts, polyRing, benzene } from '../lib/ochem-skeletal.mjs';
import { skDouble, n2 } from '../lib/ochem-helpers.mjs';

/* ------------------------------------------------------------ helpers --- */
const rad = (d) => (d * Math.PI) / 180;
/* A point `len` from c at math angle `deg` (0 east, counterclockwise). */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);
/* A lone pair on atom a, pointing at math angle deg. */
const lp = (a, deg, o = {}) => lonePair(a.x, a.y, -deg, o);
const lpTip = (a, deg, d = 29) => at(a, deg, d);
/* A point on bond a–b at fraction f, pushed `off` px to the left of a→b. */
function onBond(a, b, f = 0.5, off = 0) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  return P(a.x + dx * f + (dy / L) * off, a.y + dy * f - (dx / L) * off);
}
const charge = (p, s, cls = 'fg-warn') => text(p.x, p.y + 5, s, { cls, size: 15 });
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', size: 13, anchor });
const tg = (x, y, s, anchor = 'middle', cls = 'fg-tag') => text(x, y, s, { cls, size: 11, anchor });
const sm = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-sm', size: 10.5, anchor });
function resArrow(a, b) {
  const m = P((a.x + b.x) / 2, (a.y + b.y) / 2);
  return arrow(m, b, { size: 8 }) + arrow(m, a, { size: 8 });
}
const bd = (a, b, ra = 15, rb = 15, o = {}) => bond(a, b, { rFrom: ra, rTo: rb, ...o });
const dash = (x1, y1, x2, y2, cls = 'fg-dash') =>
  `<line class="${cls}" x1="${n2(x1)}" y1="${n2(y1)}" x2="${n2(x2)}" y2="${n2(y2)}"></line>`;

/* A % transmittance trace between wavenumbers hi and lo. Absorptions are
   Gaussian dips from a 100 %T baseline, which is what an IR trace actually
   is, and the sampling step tightens near a sharp band so a narrow spike
   does not come out triangular. */
function irTrace(peaks, X, Y, hi = 4000, lo = 500) {
  const T = (w) => {
    let t = 100;
    for (const p of peaks) t -= p.d * Math.exp(-Math.pow((w - p.c) / p.s, 2) / 2);
    return Math.max(t, 3);
  };
  const near = (w) => peaks.some((p) => p.s < 40 && Math.abs(w - p.c) < 90);
  const pts = [];
  let w = hi;
  while (w >= lo) {
    pts.push(`${n2(X(w))} ${n2(Y(T(w)))}`);
    w -= near(w) ? 3 : 14;
  }
  pts.push(`${n2(X(lo))} ${n2(Y(T(lo)))}`);
  return `<path class="fg-bond" fill="none" d="M${pts.join(' L')}"></path>`;
}

/* A coiled spring drawn as a zigzag between x1 and x2 at height y. */
function spring(x1, x2, y, teeth = 9, amp = 7) {
  const lead = 6, L = x2 - x1 - 2 * lead;
  const pts = [`${n2(x1)} ${n2(y)}`, `${n2(x1 + lead)} ${n2(y)}`];
  for (let i = 0; i < teeth; i++) {
    const x = x1 + lead + (L * (i + 0.5)) / teeth;
    pts.push(`${n2(x)} ${n2(y + (i % 2 ? amp : -amp))}`);
  }
  pts.push(`${n2(x2 - lead)} ${n2(y)}`, `${n2(x2)} ${n2(y)}`);
  return `<path class="fg-bond" fill="none" d="M${pts.join(' L')}"></path>`;
}

const FIGURES = [];

/* ----------------------------------------------------- 1. the spring ---
   One C=O bond, drawn three times: squeezed, at rest and stretched. The
   dashed line is where the oxygen sits at rest. */
FIGURES.push({
  id: 'ir-spring',
  section: 'ir',
  lessons: ['ir'],
  anchor: 'is a <b>stretching vibration</b>, or a stretch for short.</p>',
  alt: 'A carbon atom and an oxygen atom joined by a coiled spring, drawn three times. In the top row the spring is squeezed and the oxygen sits left of its rest position. In the middle row the oxygen is at rest, on a dashed line. In the bottom row the spring is stretched and the oxygen sits right of the line.',
  viewBox: '0 0 340 250',
  build() {
    let s = '';
    const rest = 214;
    s += dash(rest, 40, rest, 238);
    s += tg(rest, 30, 'rest position of O', 'middle', 'fg-tag-mut');
    [['squeezed', 176], ['at rest', rest], ['stretched', 256]].forEach(([name, ox], i) => {
      const y = 82 + i * 70;
      s += tg(20, y - 30, name, 'start');
      s += spring(64 + 15, ox - 15, y);
      s += atom(64, y, 'C');
      s += atom(ox, y, 'O', { kind: 'hi' });
    });
    return s;
  },
  caption: 'Follow the oxygen down the three rows. One vibration is a full squeeze and stretch, and the bond repeats it at its own natural frequency.',
});

/* ------------------------------------------------ 2. dipole or none ---
   Acetone's C=O: δ+ and δ− move apart as it stretches, so the dipole
   changes. trans-But-2-ene's C=C: both halves move out together and the
   dipole stays at zero. */
FIGURES.push({
  id: 'ir-dipole',
  section: 'ir',
  anchor: 'Chemists call a vibration like this <b>IR-inactive</b>.</p>',
  alt: 'Two panels. Left: the C=O of acetone, with delta plus on carbon and delta minus on oxygen and a double-headed arrow along the bond marked stretch; the labels say the charges move apart and back, the dipole moment changes, and there is a strong band near 1715. Right: trans-but-2-ene with its C=C highlighted and an arrow pointing outward from each alkene carbon; the labels say both halves move out and back together, there is no dipole at rest and none while stretching, and there is no band.',
  viewBox: '0 0 760 252',
  build() {
    let s = '';
    /* left: acetone */
    s += panel(12, 12, 362, 228, { kind: 'good' });
    s += tg(193, 36, 'the C=O of acetone: polar', 'middle', 'fg-tag-good');
    const c = P(150, 160), o = P(150, 100);
    s += bond(c, o, { order: 2, rFrom: 0, rTo: 15, cls: 'fg-bond-hi' });
    s += sk(c, at(c, 210, 44)) + sk(c, at(c, 330, 44));
    s += lp(o, 30) + lp(o, 150) + atom(o.x, o.y, 'O', { kind: 'hi' });
    s += text(174, 156, 'δ+', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += text(172, 112, 'δ−', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    const mid = P(112, 130);
    s += arrow(mid, P(112, 94), { size: 7 }) + arrow(mid, P(112, 166), { size: 7 });
    s += tg(100, 134, 'stretch', 'end');
    s += sm(206, 108, 'δ+ and δ− move apart,', 'start');
    s += sm(206, 124, 'then back together', 'start');
    s += sm(206, 150, 'the dipole moment changes', 'start');
    s += tg(206, 180, 'strong band near 1715', 'start', 'fg-tag-good');

    /* right: trans-but-2-ene */
    s += panel(386, 12, 362, 228, { kind: 'warn' });
    s += `<text class="fg-tag-warn" x="567" y="36" text-anchor="middle" font-size="11">the C=C of <tspan font-style="italic">trans</tspan>-but-2-ene: symmetric</text>`;
    const [p0, p1, p2, p3] = zig(418, 150, 4, 46, 26);
    s += sk(p0, p1) + sk(p2, p3);
    s += skDouble(p1, p2, P(499, 120));
    const u = (a, b) => { const L = Math.hypot(a.x - b.x, a.y - b.y); return P((a.x - b.x) / L, (a.y - b.y) / L); };
    const u1 = u(p1, p2), u2 = u(p2, p1);
    s += arrow(P(p1.x + u1.x * 10, p1.y + u1.y * 10), P(p1.x + u1.x * 36, p1.y + u1.y * 36), { size: 7 });
    s += arrow(P(p2.x + u2.x * 10, p2.y + u2.y * 10), P(p2.x + u2.x * 36, p2.y + u2.y * 36), { size: 7 });
    s += sm(567, 212, 'both halves move out and back together', 'middle');
    s += sm(600, 108, 'no dipole at rest,', 'start');
    s += sm(600, 124, 'none while stretching', 'start');
    s += tg(600, 154, 'no band', 'start', 'fg-tag-warn');
    return s;
  },
  caption: 'Compare what the stretch does to the charges in each panel. Only a stretch that changes the dipole moment absorbs.',
});

/* ---------------------------------------------- 3. bond order and mass ---
   Three carbon–carbon bonds, then C–H, with a bar for where each stretch
   absorbs. */
FIGURES.push({
  id: 'ir-bond-order',
  section: 'ir',
  lessons: ['ir'],
  anchor: 'although the two bonds are almost equally strong.</p>',
  alt: 'Four bonds, each with a bar for the wavenumber of its stretch. C–C single bond about 1000, C=C double bond about 1650, C≡C triple bond about 2150, drawn with one, two and three lines. Below a divider, a C–H bond at 2850 to 2960, the longest bar.',
  viewBox: '0 0 340 290',
  build() {
    let s = '';
    s += tg(20, 26, 'bond', 'start');
    s += tg(140, 26, 'absorbs near (cm⁻¹)', 'start');
    const k = 150 / 3000;
    const rows = [
      { a: 'C', b: 'C', order: 1, w: 1000, v: 'about 1000' },
      { a: 'C', b: 'C', order: 2, w: 1650, v: 'about 1650' },
      { a: 'C', b: 'C', order: 3, w: 2150, v: 'about 2150' },
      { a: 'C', b: 'H', order: 1, w: 2905, v: '2850–2960', h: true },
    ];
    rows.forEach((r, i) => {
      const y = i < 3 ? 66 + i * 56 : 246;
      const A = P(40, y), B = P(104, y);
      s += bond(A, B, { order: r.order, rFrom: 15, rTo: r.h ? 12 : 15, gap: 4 });
      s += atom(A.x, A.y, r.a);
      s += atom(B.x, B.y, r.b, r.h ? { kind: 'hi', r: 12 } : {});
      s += tg(140, y - 10, r.v, 'start', r.h ? 'fg-tag-warn' : 'fg-tag');
      s += bar(140, y - 2, r.w * k, 12, { kind: r.h ? 'warn' : 'hi', r: 4 });
    });
    s += rule(20, 212, 320, 212);
    s += tg(170, 280, 'H: the lightest atom', 'middle', 'fg-tag-mut');
    return s;
  },
  caption: 'Read the top three bars as one, two and three bonds between the same two carbons. The C–H bar compares a single bond with a much lighter atom on one end.',
});

/* ------------------------------------------------- 4. the region map --- */
FIGURES.push({
  id: 'ir-regions',
  section: 'ir',
  anchor: 'which a later section covers.</p>',
  alt: 'A wavenumber axis from 4000 on the left to 500 on the right, divided into four shaded regions: bonds to hydrogen from 4000 to 2500, triple bonds from 2500 to 2000, double bonds from 2000 to 1500, and the fingerprint region below 1500. Bars mark where each common bond absorbs: alcohol O–H 3550 to 3200, acid O–H 3300 to 2500, N–H 3500 to 3300, the alkyne C–H at 3300, sp2 C–H 3100 to 3000, sp3 C–H 2960 to 2850, the two aldehyde C–H bands at 2820 and 2720, C≡C 2260 to 2100, C≡N near 2250, C=O 1850 to 1650, C=C 1680 to 1620 and aromatic C=C 1600 to 1450. A dashed line marks 3000.',
  viewBox: '0 0 760 412',
  build() {
    let s = '';
    const X = (w) => 70 + ((4000 - w) / 3500) * 650;
    const regions = [
      [4000, 2500, 'hi', 'bonds to hydrogen'],
      [2500, 2000, 'good', 'triple bonds'],
      [2000, 1500, 'warn', 'double bonds'],
      [1500, 500, 'mut', 'fingerprint region'],
    ];
    for (const [a, b, kind, name] of regions) {
      s += bar(X(a), 66, X(b) - X(a), 282, { kind, opacity: 0.07, r: 0 });
      s += bar(X(a) + 1, 30, X(b) - X(a) - 2, 28, { kind, opacity: 0.3, r: 5 });
      s += tg((X(a) + X(b)) / 2, 48, name);
    }
    s += tg(X(1000), 200, 'compare it,', 'middle', 'fg-tag-mut');
    s += tg(X(1000), 216, 'do not assign it', 'middle', 'fg-tag-mut');
    s += dash(X(3000), 62, X(3000), 350, 'fg-dash-hi');

    const rows = [
      { a: 3550, b: 3200, t: 'O–H, alcohol: broad', side: 'L' },
      { a: 3300, b: 2500, t: 'O–H, acid: very broad', side: 'L' },
      { a: 3500, b: 3300, t: 'N–H: sharper', side: 'L' },
      { a: 3330, b: 3270, t: '≡C–H: sharp', side: 'L' },
      { a: 3100, b: 3000, t: 'C–H on sp² carbon', side: 'L' },
      { a: 2960, b: 2850, t: 'C–H on sp³ carbon', side: 'R' },
      { ticks: [2820, 2720], t: 'H–C=O of an aldehyde: two weak', side: 'R' },
      { a: 2260, b: 2100, t: 'C≡C: weak', side: 'R' },
      { a: 2260, b: 2240, t: 'C≡N: sharp', side: 'R' },
      { a: 1850, b: 1650, t: 'C=O: strong', side: 'L', warn: true },
      { a: 1680, b: 1620, t: 'C=C', side: 'L' },
      { a: 1600, b: 1450, t: 'aromatic C=C: several', side: 'L' },
    ];
    rows.forEach((r, i) => {
      const y = 86 + i * 22;
      let x1, x2;
      if (r.ticks) {
        for (const w of r.ticks) s += bar(X(w) - 2, y - 8, 4, 12, { kind: 'hi', r: 1 });
        x1 = X(r.ticks[0]) - 2; x2 = X(r.ticks[1]) + 2;
      } else {
        x1 = X(r.a); x2 = X(r.b);
        s += bar(x1, y - 8, Math.max(x2 - x1, 4), 12, { kind: r.warn ? 'warn' : 'hi', r: 3 });
        x2 = Math.max(x2, x1 + 4);
      }
      s += r.side === 'L' ? tg(x1 - 6, y + 2, r.t, 'end', r.warn ? 'fg-tag-warn' : 'fg-tag')
                          : tg(x2 + 6, y + 2, r.t, 'start');
    });

    s += rule(70, 352, 720, 352);
    for (const w of [4000, 3500, 3000, 2500, 2000, 1500, 1000, 500]) {
      s += rule(X(w), 352, X(w), 358);
      s += sm(X(w), 372, String(w));
    }
    s += sm(395, 396, 'wavenumber (cm⁻¹), high on the left, as spectra are printed');
    return s;
  },
  caption: 'Find the dashed line at 3000 first. Then read each bar against the four shaded regions above it.',
});

/* --------------------------------------------- 5. the X–H band shapes ---
   Five compounds over 3700–2400, each with the small sp3 C–H dips below
   3000 that any alkyl group gives. */
const CH = [
  { c: 2960, s: 14, d: 40 },
  { c: 2930, s: 12, d: 34 },
  { c: 2872, s: 12, d: 26 },
];
const SHAPES = [
  { name: 'alcohol', what: 'broad O–H near 3350', peaks: [{ c: 3345, s: 105, d: 68 }, ...CH] },
  { name: 'carboxylic acid', what: 'O–H from 3300 to 2500', peaks: [{ c: 2950, s: 200, d: 62 }, { c: 2960, s: 13, d: 16 }, { c: 2875, s: 13, d: 12 }] },
  { name: 'primary amine, R–NH₂', what: 'two N–H bands', peaks: [{ c: 3375, s: 24, d: 30 }, { c: 3295, s: 24, d: 26 }, ...CH] },
  { name: 'secondary amine, R₂NH', what: 'one N–H band', peaks: [{ c: 3300, s: 24, d: 22 }, ...CH] },
  { name: 'terminal alkyne, R–C≡C–H', what: 'sharp ≡C–H at 3300', peaks: [{ c: 3310, s: 11, d: 78 }, ...CH] },
];
FIGURES.push({
  id: 'ir-xh-shapes',
  section: 'ir',
  anchor: 'but only the alkyne has the band at 3300.</p>',
  alt: 'Five spectrum traces from 3700 to 2400 wavenumbers, one per row, with a dashed line at 3000. Alcohol: one broad rounded band centered near 3350. Carboxylic acid: a very wide shallow band from about 3300 to 2500. Primary amine: two small sharp-ish bands near 3375 and 3295. Secondary amine: one small band near 3300. Terminal alkyne: one deep narrow spike at 3310. Every trace also shows small sharp dips just below 3000 from sp3 C–H bonds.',
  viewBox: '0 0 760 470',
  build() {
    let s = '';
    const X = (w) => 236 + ((3700 - w) / 1300) * 494;
    SHAPES.forEach((row, i) => {
      const y0 = 20 + i * 80;
      const Y = (t) => y0 + 10 + ((100 - t) / 100) * 54;
      s += lbl(20, y0 + 32, row.name, 'start');
      s += sm(20, y0 + 50, row.what, 'start');
      s += irTrace(row.peaks, X, Y, 3700, 2400);
      if (i < 4) s += rule(20, y0 + 76, 740, y0 + 76);
    });
    s += dash(X(3000), 20, X(3000), 418, 'fg-dash-hi');
    s += rule(X(3700), 418, X(2400), 418);
    for (const w of [3700, 3600, 3400, 3200, 3000, 2800, 2600, 2400]) {
      s += rule(X(w), 418, X(w), 424);
      s += sm(X(w), 438, String(w));
    }
    s += sm(X(3050), 460, 'wavenumber (cm⁻¹)');
    return s;
  },
  caption: 'Every trace has the same small sp³ C–H dips just right of the dashed line. Compare what sits to their left: the width of each band and how many there are.',
});
FIGURES.push({
  id: 'l-ir-xh-shapes',
  lessons: ['ir'],
  alt: 'Five spectrum traces from 3700 to 2400 wavenumbers stacked in rows, with a dashed line at 3000. Alcohol: one broad band near 3350. Carboxylic acid: a very wide band from 3300 to 2500. Primary amine: two N–H bands. Secondary amine: one N–H band. Terminal alkyne: one sharp deep spike at 3300. Every trace also has small sp3 C–H dips just below 3000.',
  viewBox: '0 0 340 548',
  build() {
    let s = '';
    const X = (w) => 20 + ((3700 - w) / 1300) * 300;
    const short = ['alcohol: broad O–H', 'acid: O–H from 3300 to 2500', 'primary amine: two N–H bands', 'secondary amine: one N–H band', 'terminal alkyne: sharp ≡C–H'];
    SHAPES.forEach((row, i) => {
      const y0 = 4 + i * 96;
      const Y = (t) => y0 + 26 + ((100 - t) / 100) * 56;
      s += lbl(20, y0 + 16, short[i], 'start');
      s += dash(X(3000), y0 + 22, X(3000), y0 + 88, 'fg-dash-hi');
      s += irTrace(row.peaks, X, Y, 3700, 2400);
    });
    s += rule(20, 490, 320, 490);
    for (const w of [3600, 3300, 3000, 2700]) {
      s += rule(X(w), 490, X(w), 496);
      s += tg(X(w), 512, String(w));
    }
    s += tg(170, 536, 'wavenumber (cm⁻¹)');
    return s;
  },
  caption: 'The small dips just right of the dashed line are sp³ C–H in every row. Compare what sits to their left.',
});

/* ------------------------------------------------- 6. butanoic acid ---
   A whole spectrum: the acid O–H wall and the carbonyl spike at once, and
   both printing conventions visible. */
FIGURES.push({
  id: 'ir-spectrum-butanoic-acid',
  section: 'ir',
  anchor: 'which weakens each O–H further and spreads its band even wider.</p>',
  alt: 'The infrared spectrum of butanoic acid drawn as a percent-transmittance trace. Wavenumber runs from 4000 on the left to 500 on the right and the peaks point downward. A very broad trough runs from about 3300 to 2500, with two small sharp dips at 2960 and 2875 sitting inside it. A deep narrow spike reaches almost to zero transmittance at 1710. Below 1500 the trace is a shaded tangle of peaks labeled the fingerprint region, and a dotted vertical line marks 3000.',
  viewBox: '0 0 760 392',
  build() {
    const X = (w) => 64 + ((4000 - w) / 3500) * 660;
    const Y = (t) => 70 + ((100 - t) / 100) * 240;
    let s = '';
    s += `<rect class="fg-fill-mut" x="${n2(X(1500))}" y="70" width="${n2(X(500) - X(1500))}" height="240" rx="6" opacity="0.10"></rect>`;
    s += rule(64, 310, 724, 310) + rule(64, 310, 64, 70);
    for (const w of [4000, 3500, 3000, 2500, 2000, 1500, 1000, 500]) {
      s += rule(X(w), 310, X(w), 316);
      s += text(X(w), 330, String(w), { cls: 'fg-sm', size: 9.5 });
    }
    for (const t of [100, 50, 0]) {
      s += rule(58, Y(t), 64, Y(t));
      s += text(54, Y(t) + 4, String(t), { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    }
    s += `<text class="fg-sm" x="24" y="190" text-anchor="middle" transform="rotate(-90 24 190)">% transmittance</text>`;
    s += text(394, 350, 'wavenumber (cm⁻¹), high on the left', { cls: 'fg-sm', size: 10.5 });

    s += dash(X(3000), 70, X(3000), 310);
    s += text(X(3000) + 5, 84, '3000', { cls: 'fg-tag-mut', size: 10, anchor: 'start' });

    s += irTrace([
      { c: 3000, s: 255, d: 58 },   // the acid O–H, 3300 down to 2500
      { c: 2960, s: 13, d: 20 },    // sp3 C–H, riding inside it
      { c: 2875, s: 13, d: 16 },
      { c: 1710, s: 11, d: 90 },    // the acid C=O
      { c: 1415, s: 16, d: 26 },
      { c: 1285, s: 13, d: 52 },    // C–O
      { c: 1230, s: 12, d: 36 },
      { c: 1100, s: 14, d: 20 },
      { c: 935, s: 18, d: 34 },     // the dimer's O–H bend
      { c: 800, s: 16, d: 16 },
      { c: 640, s: 20, d: 14 },
    ], X, Y);

    s += text(88, 38, 'O–H of the acid: very broad,', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(88, 54, 'from 3300 down to 2500', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += `<line class="fg-dash-hi" x1="196" y1="60" x2="${n2(X(3150))}" y2="178"></line>`;
    s += text(340, 176, 'sp³ C–H at 2960', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(340, 192, 'and 2875, half', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(340, 208, 'hidden in the O–H', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += `<line class="fg-dash-hi" x1="335" y1="194" x2="${n2(X(2920) + 4)}" y2="230"></line>`;
    s += text(474, 244, 'C=O, 1710', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    s += text(474, 260, 'the carboxylic acid carbonyl', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += `<line class="fg-dash-hi" x1="478" y1="252" x2="${n2(X(1710) - 5)}" y2="276"></line>`;
    s += text(716, 248, 'fingerprint region', { cls: 'fg-tag-mut', size: 11, anchor: 'end' });
    s += text(716, 264, 'below 1500', { cls: 'fg-sm', size: 9.5, anchor: 'end' });

    s += text(394, 380, 'butanoic acid, CH₃CH₂CH₂COOH', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'Find the three features the text describes: the O&ndash;H band spreading from 3300 to 2500, the sp³ C&ndash;H dips half hidden inside it, and the C=O band at 1710, which reaches nearly to zero transmittance.',
});

/* ------------------------------------ 7. what weakens a C=O: donation ---
   Acetamide's resonance pair, then but-3-en-2-one's. In both, the second
   contributor has a C–O single bond. */
function acetamide(c, form) {
  let s = '';
  const o = at(c, 90, 50), me = at(c, 210, 44), n = at(c, 330, 46);
  s += bd(c, me, 0, 17) + atom(me.x, me.y, 'CH₃', { r: 17 });
  if (form === 1) {
    s += bd(c, o, 0, 15, { order: 2, cls: 'fg-bond-hi' }) + bd(c, n, 0, 18);
    s += lp(o, 30) + lp(o, 150) + atom(o.x, o.y, 'O', { kind: 'hi' });
    s += lp(n, 75, { dist: 25 }) + atom(n.x, n.y, 'NH₂', { r: 18 });
    s += curve(lpTip(n, 75, 31), onBond(c, n, 0.5, 7), { bow: 14, size: 7 });
    s += curve(onBond(c, o, 0.55, 6), P(o.x - 20, o.y + 8), { bow: -18, size: 7 });
  } else {
    s += bd(c, o, 0, 15, { cls: 'fg-bond-hi' }) + bd(c, n, 0, 18, { order: 2 });
    s += lp(o, 30) + lp(o, 90) + lp(o, 150) + atom(o.x, o.y, 'O', { kind: 'hi' });
    s += charge(P(o.x + 24, o.y + 12), '−');
    s += atom(n.x, n.y, 'NH₂', { r: 18 }) + charge(P(n.x + 24, n.y - 16), '+');
  }
  return s;
}
function enone(o0, form) {
  let s = '';
  const [c1, c2, c3, c4] = zig(o0.x, o0.y, 4, 32, 18);
  const ox = P(c2.x, c2.y - 44);
  s += sk(c1, c2);
  if (form === 1) {
    s += bond(c2, ox, { order: 2, rFrom: 0, rTo: 15, cls: 'fg-bond-hi' });
    s += sk(c2, c3) + skDouble(c3, c4, P(c3.x + 16, c3.y + 20));
    s += lp(ox, 30) + lp(ox, 150) + atom(ox.x, ox.y, 'O', { kind: 'hi' });
    s += curve(onBond(c2, ox, 0.55, 6), P(ox.x - 20, ox.y + 8), { bow: -18, size: 7 });
    s += curve(onBond(c3, c4, 0.5, -8), onBond(c2, c3, 0.5, -8), { bow: 14, size: 7 });
  } else {
    s += bond(c2, ox, { rFrom: 0, rTo: 15, cls: 'fg-bond-hi' });
    s += skDouble(c2, c3, P(c2.x + 16, c2.y + 30)) + sk(c3, c4);
    s += lp(ox, 30) + lp(ox, 90) + lp(ox, 150) + atom(ox.x, ox.y, 'O', { kind: 'hi' });
    s += charge(P(ox.x + 24, ox.y + 12), '−');
    s += charge(P(c4.x + 10, c4.y - 12), '+');
  }
  return s;
}
FIGURES.push({
  id: 'ir-carbonyl-donation',
  section: 'ir',
  lessons: ['ir'],
  anchor: 'Nitrogen donates most, so the amide absorbs lowest.</p>',
  alt: 'Two resonance pairs, with the carbon–oxygen bond highlighted. Top: acetamide, with a curved arrow from the nitrogen lone pair into the C–N bond and one from the C=O bond onto oxygen, leading to a contributor with C=N, a positive nitrogen and a negative oxygen joined to carbon by a single bond; labeled C=O partly single, 1650 to 1690. Bottom: but-3-en-2-one, with a curved arrow from the C=C bond into the C–C bond next to the carbonyl and one from the C=O onto oxygen, leading to a contributor with a C–O single bond, a negative oxygen and a positive end carbon; labeled C=O partly single, about 30 lower.',
  viewBox: '0 0 340 340',
  build() {
    let s = '';
    s += tg(170, 20, 'acetamide: nitrogen donates');
    s += acetamide(P(72, 104), 1);
    s += resArrow(P(138, 100), P(180, 100));
    s += acetamide(P(242, 104), 2);
    s += tg(170, 162, 'C=O partly single: 1650–1690 cm⁻¹', 'middle', 'fg-tag-warn');
    s += rule(14, 180, 326, 180);
    s += tg(170, 202, 'but-3-en-2-one: conjugation');
    s += enone(P(22, 290), 1);
    s += resArrow(P(138, 276), P(180, 276));
    s += enone(P(200, 290), 2);
    s += tg(170, 330, 'C=O partly single: about 30 lower', 'middle', 'fg-tag-warn');
    return s;
  },
  caption: 'In each pair, follow the curved arrows from left to right, then compare the highlighted C&ndash;O bond in the two contributors.',
});

/* --------------------------------------------------- 8. ring size --- */
function arcAt(p, a, b, r) {
  /* the smaller arc at vertex p between the directions to a and b */
  const angA = Math.atan2(a.y - p.y, a.x - p.x), angB = Math.atan2(b.y - p.y, b.x - p.x);
  const A = P(p.x + Math.cos(angA) * r, p.y + Math.sin(angA) * r);
  const B = P(p.x + Math.cos(angB) * r, p.y + Math.sin(angB) * r);
  let d = angB - angA;
  while (d <= -Math.PI) d += 2 * Math.PI;
  while (d > Math.PI) d -= 2 * Math.PI;
  const sweep = d > 0 ? 1 : 0;
  return `<path class="fg-dash-hi" fill="none" d="M${n2(A.x)} ${n2(A.y)} A${r} ${r} 0 0 ${sweep} ${n2(B.x)} ${n2(B.y)}"></path>`;
}
FIGURES.push({
  id: 'ir-ring-strain',
  section: 'ir',
  anchor: 'a shorter, stiffer bond with a higher wavenumber.</p>',
  alt: 'Three cyclic ketones side by side, each with its C=O highlighted and the ring angle at the carbonyl carbon marked by an arc. Cyclohexanone: ring angle near 120 degrees, 1715. Cyclopentanone: near 108 degrees, 1745. Cyclobutanone: near 90 degrees, 1785, with labels saying the ring bonds get more p-character and the C=O more s-character.',
  viewBox: '0 0 760 272',
  build() {
    let s = '';
    const rings = [
      { cx: 130, n: 6, r: 40, ang: 'near 120°', name: 'cyclohexanone', wn: '1715 cm⁻¹' },
      { cx: 380, n: 5, r: 40, ang: 'near 108°', name: 'cyclopentanone', wn: '1745 cm⁻¹' },
      { cx: 630, n: 4, r: 40, ang: 'near 90°', name: 'cyclobutanone', wn: '1785 cm⁻¹' },
    ];
    for (const g of rings) {
      const cy = 142;
      const pts = polyPts(g.cx, cy, g.n, g.r, 90);
      s += polyRing(pts);
      const c = pts[0], o = P(c.x, c.y - 46);
      s += bond(c, o, { order: 2, rFrom: 0, rTo: 15, cls: 'fg-bond-hi' });
      s += lp(o, 30) + lp(o, 150) + atom(o.x, o.y, 'O', { kind: 'hi' });
      s += arcAt(c, pts[1], pts[g.n - 1], 15);
      const yb = cy + g.r + 26;
      s += tg(g.cx, yb, 'ring angle ' + g.ang);
      s += lbl(g.cx, yb + 22, g.name);
      s += tg(g.cx, yb + 42, g.wn, 'middle', 'fg-tag-warn');
    }
    /* the argument, on the most strained ring */
    s += tg(600, 112, 'ring bonds: more p', 'end');
    s += tg(646, 80, 'C=O: more s', 'start', 'fg-tag-warn');
    return s;
  },
  caption: 'Read left to right: the arc at the carbonyl carbon narrows and the wavenumber climbs.',
});

/* --------------------------------------- 9. worked example: C3H6O --- */
FIGURES.push({
  id: 'ir-c3h6o',
  section: 'ir',
  anchor: '<p>Three isomers to tell apart: acetone, propanal and prop-2-en-1-ol (allyl alcohol).</p>',
  alt: 'Three C3H6O isomers in panels. Acetone, with its C=O highlighted: C=O at 1715, no O–H, nothing at 2720. Propanal, with its C=O and the aldehyde hydrogen highlighted: C=O at 1725, H–C=O bands at 2720 and 2820. Prop-2-en-1-ol, with its C=C and OH highlighted: broad O–H at 3350, C=C at 1650, C–H above 3000.',
  viewBox: '0 0 760 226',
  build() {
    let s = '';
    const cols = [127, 380, 633];
    cols.forEach((cx) => { s += panel(cx - 118, 10, 236, 206); });
    /* acetone */
    {
      const c = P(cols[0], 104), o = P(cols[0], 56);
      s += bond(c, o, { order: 2, rFrom: 0, rTo: 15, cls: 'fg-bond-hi' });
      s += sk(c, at(c, 210, 40)) + sk(c, at(c, 330, 40));
      s += lp(o, 30) + lp(o, 150) + atom(o.x, o.y, 'O', { kind: 'hi' });
    }
    /* propanal */
    {
      const [a, b, c] = zig(cols[1] - 58, 96, 3, 34, 20);
      const o = at(c, 30, 44), h = at(c, 270, 36);
      s += sk(a, b) + sk(b, c);
      s += bond(c, o, { order: 2, rFrom: 0, rTo: 15, cls: 'fg-bond-hi' });
      s += bond(c, h, { rFrom: 0, rTo: 11 });
      s += lp(o, 90) + lp(o, 330) + atom(o.x, o.y, 'O', { kind: 'hi' });
      s += atom(h.x, h.y, 'H', { r: 11, kind: 'hi' });
    }
    /* prop-2-en-1-ol */
    {
      const [a, b, c, d] = zig(cols[2] - 62, 104, 4, 36, 22);
      s += skDouble(a, b, P(a.x + 26, a.y + 6)).replace(/fg-bond"/g, 'fg-bond-hi"');
      s += sk(b, c) + bond(c, d, { rFrom: 0, rTo: 17 });
      s += lp(d, 60) + lp(d, 120, { dist: 24 });
      s += atom(d.x, d.y, 'OH', { r: 17, kind: 'hi' });
    }
    const notes = [
      ['acetone', 'C=O at 1715', 'no O–H, nothing at 2720'],
      ['propanal', 'C=O at 1725', 'H–C=O: 2720 and 2820'],
      ['prop-2-en-1-ol', 'broad O–H at 3350, no C=O', 'C=C at 1650, C–H above 3000'],
    ];
    notes.forEach(([name, a, b], i) => {
      s += lbl(cols[i], 160, name);
      s += tg(cols[i], 182, a);
      s += tg(cols[i], 200, b);
    });
    return s;
  },
  caption: 'Match each highlighted part of a structure to the band written under it.',
});

/* ------------------------------------- 10. worked example: C8H8O --- */
FIGURES.push({
  id: 'ir-acetophenone',
  section: 'ir',
  anchor: 'Two independent readings of one spectrum point to the same conjugation.</p>',
  alt: 'Acetophenone, a benzene ring bonded to a C=O that carries a methyl group, with the C=O highlighted. Beside it, each band from the peak list with what it shows: 1685, very strong, the C=O conjugated with the ring; 3060, sp2 C–H of the ring; 2980, sp3 C–H of the methyl; 1600, 1580 and 1450, the ring C=C bonds; 760 and 690, a monosubstituted ring.',
  viewBox: '0 0 760 236',
  build() {
    let s = '';
    const ring = benzene(130, 124, 40, { rot: 0 });
    s += ring.svg;
    const v0 = ring.pts[0];
    const c = P(v0.x + 40, v0.y);
    const o = at(c, 60, 46), me = at(c, 300, 40);
    s += sk(v0, c) + sk(c, me);
    s += bond(c, o, { order: 2, rFrom: 0, rTo: 15, cls: 'fg-bond-hi' });
    s += lp(o, 0) + lp(o, 120) + atom(o.x, o.y, 'O', { kind: 'hi' });
    s += tg(150, 214, 'acetophenone, C₆H₅–CO–CH₃');
    const rows = [
      ['1685, very strong', 'C=O, conjugated with the ring', true],
      ['3060', 'sp² C–H of the ring'],
      ['2980', 'sp³ C–H of the CH₃'],
      ['1600, 1580, 1450', 'C=C of the ring'],
      ['760 and 690', 'a monosubstituted ring'],
    ];
    rows.forEach(([wn, what, hi], i) => {
      const y = 50 + i * 36;
      s += tg(330, y, wn, 'start', hi ? 'fg-tag-warn' : 'fg-tag');
      s += sm(480, y, what, 'start');
    });
    s += rule(318, 30, 318, 206);
    return s;
  },
  caption: 'Each band in the list is matched to the part of the structure it comes from.',
});

export default FIGURES;
