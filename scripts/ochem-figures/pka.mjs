/* Figures for the pka notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   This page owns the pKa number itself: what Ka and pKa are, the scale, and
   reading a proton transfer's direction from two numbers. It does NOT own the
   structural reasons one acid is stronger than another (that is
   acidity-factors), so no figure here argues from resonance, induction or
   hybridization. The figures only show where a proton sits, where it goes,
   and what number goes with it.

   Angles: armEnd() and the `deg` of a group are measured counterclockwise
   from east, as on paper. lonePair() takes the SVG angle (clockwise, since
   y points down), so LP() below converts. Any figure a lesson shows is 340
   wide or less and uses only fg-lbl and fg-tag text. */
import { atom, bond, arrow, curve, lonePair, text, tag, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, benzene } from '../lib/ochem-skeletal.mjs';
import { armEnd } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */

const rOf = (l) => (l.length >= 3 ? 19 : l.length === 2 ? 16 : l === 'H' ? 12 : 14);
const A = (p, l, o = {}) => atom(p.x, p.y, l, { r: rOf(l), ...o });
/* A bond between two labelled atoms; pass '' for an unlabelled skeletal vertex. */
const B = (a, b, la, lb, o = {}) => bond(a, b, { rFrom: la ? rOf(la) : 0, rTo: lb ? rOf(lb) : 0, ...o });
const HI = { cls: 'fg-bond-hi' };
/* A lone pair at a paper angle (counterclockwise from east). */
const LP = (p, deg, d = 20) => lonePair(p.x, p.y, -deg, { dist: d });
const chg = (x, y, s) => text(x, y, s, { cls: 'fg-warn', size: 15 });
const lbl = (x, y, s, o = {}) => text(x, y, s, { cls: 'fg-lbl', size: 13, ...o });
const plusSign = (x, y) => text(x, y, '+', { cls: 'fg-lbl', size: 13 });
/* Equilibrium arrows. `lean` says which side the equilibrium favors:
   the arrow pointing toward that side is drawn long, the other short. */
function eqH(x1, x2, y, lean) {
  const s = 7, cut = 16;
  const fwd = lean === 'right' ? [x1, x2] : [x1 + cut, x2 - cut];
  const rev = lean === 'left' ? [x2, x1] : [x2 - cut, x1 + cut];
  return arrow(P(fwd[0], y - 5), P(fwd[1], y - 5), { size: s }) +
         arrow(P(rev[0], y + 5), P(rev[1], y + 5), { size: s });
}
function eqV(x, y1, y2, lean) {
  const s = 7, cut = 12;
  const fwd = lean === 'down' ? [y1, y2] : [y1 + cut, y2 - cut];
  const rev = lean === 'up' ? [y2, y1] : [y2 - cut, y1 + cut];
  return arrow(P(x - 6, fwd[0]), P(x - 6, fwd[1]), { size: s }) +
         arrow(P(x + 6, rev[0]), P(x + 6, rev[1]), { size: s });
}

/* ======================================================================
   1. Ka: acetic acid giving up its O–H proton, with the two numbers.
   ====================================================================== */
function aceticAcid(c, { anion = false } = {}) {
  // c is the carbonyl carbon. O up, CH3 down-left, the O–H oxygen down-right.
  const o1 = armEnd(c, 90, 44), m = armEnd(c, 210, 46), o2 = armEnd(c, 330, 44);
  let s = '';
  s += B(c, o1, 'C', 'O', { order: 2 }) + B(c, m, 'C', 'CH₃') + B(c, o2, 'C', 'O');
  s += A(o1, 'O') + LP(o1, 150) + LP(o1, 30);
  s += A(m, 'CH₃') + A(c, 'C');
  let h = null;
  if (anion) {
    s += A(o2, 'O', { kind: 'warn' }) + LP(o2, 60) + LP(o2, 330) + LP(o2, 240);
    s += chg(o2.x + 25, o2.y - 6, '−');
  } else {
    h = armEnd(o2, 30, 38);
    s += B(o2, h, 'O', 'H', HI) + A(h, 'H', { kind: 'hi' });
    s += A(o2, 'O') + LP(o2, 240) + LP(o2, 300);
  }
  return { s, o1, m, o2, h };
}

FIGURES.push({
  id: 'ka-acetic',
  section: 'pka',
  anchor: '<h3>Ka and pKa</h3>',
  lessons: ['pka'],
  alt: 'Acetic acid at the top with its O–H hydrogen highlighted. Equilibrium arrows lead down to acetate, with a negative charge on the oxygen that lost the hydrogen, plus H+. The arrow pointing back up is the long one, because most acetic acid stays whole. Beside the arrows: Ka = 1.7 × 10⁻⁵ and pKa = 4.76.',
  viewBox: '0 0 340 350',
  build() {
    let s = '';
    s += tag(170, 20, 'ACETIC ACID IN WATER');
    const top = aceticAcid(P(126, 96));
    s += top.s;
    s += text(top.h.x + 18, top.h.y - 16, 'acidic H', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += eqV(126, 170, 222, 'up');
    s += tag(156, 196, 'Ka = 1.7 × 10⁻⁵', { anchor: 'start' });
    s += tag(156, 216, 'pKa = 4.76', { anchor: 'start', cls: 'fg-tag-good' });
    const bot = aceticAcid(P(110, 296), { anion: true });
    s += bot.s;
    s += plusSign(222, 324) + lbl(254, 324, 'H⁺');
    return s;
  },
  caption: 'Highlighted: the O–H hydrogen that leaves. The longer equilibrium arrow marks the favored side.',
});

/* ======================================================================
   2. The pKa ladder, drawn to scale. One figure for notes and lesson.
   ====================================================================== */
const RUNGS = [
  // [pKa shown, pKa for position, name, label y override]
  ['−7', -7, 'HCl'],
  ['−1.7', -1.7, 'H₃O⁺'],
  ['4.76', 4.76, 'carboxylic acid O–H'],
  ['9.2', 9.2, 'ammonium, NH₄⁺'],
  ['10', 10, 'phenol O–H'],
  ['15.7', 15.7, 'water'],
  ['16', 16, 'alcohol O–H'],
  ['20', 20, 'ketone α C–H'],
  ['25', 25, 'terminal alkyne C–H'],
  ['38', 38, 'amine N–H'],
  ['50', 50, 'alkane C–H'],
];

FIGURES.push({
  id: 'pka-ladder',
  section: 'pka',
  anchor: '<h3>Ka and pKa</h3>',
  lessons: ['pka'],
  alt: 'A vertical pKa scale drawn to scale, from HCl at −7 at the top to alkane C–H at 50 at the bottom. Rungs in between: H3O+ −1.7, carboxylic acid O–H 4.8, ammonium 9.2, phenol O–H 10, water 15.7, alcohol O–H 16, ketone alpha C–H 20, terminal alkyne C–H 25, amine N–H 38. The top is labeled stronger acid and the bottom weaker acid. A bracket from the carboxylic acid to the alcohol is labeled 10 to the 11th.',
  viewBox: '0 0 340 520',
  build() {
    const X = 58, y0 = 64, k = 7.2;
    const yOf = (p) => y0 + (p + 7) * k;
    let s = '';
    s += tag(170, 22, 'LOWER pKa = STRONGER ACID', { cls: 'fg-tag-warn' });
    s += tag(170, 508, 'HIGHER pKa = WEAKER ACID');
    s += rule(X, yOf(-9), X, yOf(52));
    // Labels need 20 px of room; spread them where rungs crowd together.
    let last = -1e9;
    const ys = RUNGS.map(([, p]) => { const y = Math.max(yOf(p), last + 21); last = y; return y; });
    RUNGS.forEach(([shown, p, name], i) => {
      const ty = yOf(p), ly = ys[i];
      s += bond(P(X - 7, ty), P(X + 7, ty), { rFrom: 0, rTo: 0 });
      s += bond(P(X + 7, ty), P(X + 20, ly - 4), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
      s += text(X + 24, ly, shown, { cls: 'fg-tag', size: 11, anchor: 'start' });
      s += lbl(X + 62, ly, name, { anchor: 'start' });
    });
    // The bracket: carboxylic acid to alcohol, eleven units.
    const bx = 304, ya = ys[2] - 5, yb = ys[6] - 5;
    s += bond(P(bx, ya), P(bx, yb), { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += bond(P(bx - 6, ya), P(bx, ya), { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += bond(P(bx - 6, yb), P(bx, yb), { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += `<text class="fg-tag" x="${bx + 16}" y="${(ya + yb) / 2}" text-anchor="middle" font-size="11" transform="rotate(-90 ${bx + 16} ${(ya + yb) / 2})">× 10¹¹</text>`;
    return s;
  },
  caption: 'The rungs are spaced by pKa, so the drawing keeps the real distances a table hides, such as the long empty stretch between 25 and 38.',
});

/* ======================================================================
   3. Where the acidic hydrogen is, for each kind of acid in the table.
   ====================================================================== */
const CELL_W = 238, CELL_H = 160;
function cell(ox, oy, title, foot, draw) {
  let s = panel(ox, oy, CELL_W, CELL_H);
  s += tag(ox + CELL_W / 2, oy + 22, title);
  s += text(ox + CELL_W / 2, oy + CELL_H - 14, foot, { cls: 'fg-tag-good', size: 11 });
  s += draw(ox, oy);
  return s;
}
/* A highlighted H at the end of a highlighted bond from atom p. */
const Hon = (p, deg, len, la = '') => {
  const h = armEnd(p, deg, len);
  return B(p, h, la, 'H', HI) + A(h, 'H', { kind: 'hi' });
};

const galleryCells = [
  ['CARBOXYLIC ACID O–H', 'acetic acid · pKa 4.76', (ox, oy) => {
    const c = P(ox + 104, oy + 84);
    const o1 = armEnd(c, 90, 40), m = armEnd(c, 210, 38), o2 = armEnd(c, 330, 40);
    let s = B(c, o1, '', 'O', { order: 2 });
    s += sk(m, c) + B(c, o2, '', 'O');
    s += A(o1, 'O') + A(o2, 'O') + Hon(o2, 30, 36, 'O');
    return s;
  }],
  ['1,3-DIKETONE C–H', 'pentane-2,4-dione · pKa 9', (ox, oy) => {
    const pts = zig(ox + 51, oy + 94, 5, 34, 20);
    let s = '';
    for (let i = 0; i < 4; i++) s += sk(pts[i], pts[i + 1]);
    for (const i of [1, 3]) { const o = armEnd(pts[i], 90, 30); s += B(pts[i], o, '', 'O', { order: 2 }) + A(o, 'O'); }
    s += Hon(pts[2], 235, 28) + Hon(pts[2], 305, 28);
    return s;
  }],
  ['PHENOL O–H', 'phenol · pKa 10', (ox, oy) => {
    const ring = benzene(ox + 96, oy + 84, 30, { rot: 90 });
    const c1 = ring.pts[5];               // upper-right vertex at 30°
    const o = armEnd(c1, 30, 36);
    let s = ring.svg + B(c1, o, '', 'O') + A(o, 'O') + Hon(o, 330, 34, 'O');
    return s;
  }],
  ['ALCOHOL O–H', 'ethanol · pKa 16', (ox, oy) => {
    const pts = zig(ox + 70, oy + 92, 3, 38, 24);
    let s = sk(pts[0], pts[1]) + B(pts[1], pts[2], '', 'O');
    s += A(pts[2], 'O') + Hon(pts[2], 30, 36, 'O');
    return s;
  }],
  ['KETONE α C–H', 'acetone · pKa 19–20', (ox, oy) => {
    const pts = zig(ox + 85, oy + 96, 3, 36, 24);
    let s = sk(pts[0], pts[1]) + sk(pts[1], pts[2]);
    const o = armEnd(pts[1], 90, 30);
    s += B(pts[1], o, '', 'O', { order: 2 }) + A(o, 'O');
    s += Hon(pts[2], 30, 32);
    s += text(pts[2].x + 4, pts[2].y + 20, 'α carbon', { cls: 'fg-tag', size: 11 });
    return s;
  }],
  ['TERMINAL ALKYNE C–H', 'propyne · pKa 25', (ox, oy) => {
    const y = oy + 82;
    const a = P(ox + 58, y), b = P(ox + 96, y), c = P(ox + 134, y);
    let s = sk(a, b) + bond(b, c, { rFrom: 0, rTo: 0, order: 3 }) + Hon(c, 0, 36);
    return s;
  }],
  ['AMMONIA N–H', 'ammonia · pKa 38', (ox, oy) => {
    const n = P(ox + 118, oy + 76);
    let s = A(n, 'N') + LP(n, 90, 21);
    for (const d of [0, 270]) { const h = armEnd(n, d, 36); s += B(n, h, 'N', 'H') + A(h, 'H'); }
    const h = armEnd(n, 180, 38);
    s += B(n, h, 'N', 'H', HI) + A(h, 'H', { kind: 'hi' });
    return s;
  }],
  ['ALKENE C–H', 'ethene · pKa 44', (ox, oy) => {
    const c1 = P(ox + 98, oy + 84), c2 = P(ox + 138, oy + 84);
    let s = B(c1, c2, 'C', 'C', { order: 2 }) + A(c1, 'C') + A(c2, 'C');
    for (const d of [120, 240]) { const h = armEnd(c1, d, 34); s += B(c1, h, 'C', 'H') + A(h, 'H'); }
    { const h = armEnd(c2, 300, 34); s += B(c2, h, 'C', 'H') + A(h, 'H'); }
    s += Hon(c2, 60, 34, 'C');
    return s;
  }],
  ['ALKANE C–H', 'ethane · pKa 50', (ox, oy) => {
    const c1 = P(ox + 98, oy + 84), c2 = P(ox + 140, oy + 84);
    let s = B(c1, c2, 'C', 'C') + A(c1, 'C') + A(c2, 'C');
    for (const d of [90, 180, 270]) { const h = armEnd(c1, d, 32); s += B(c1, h, 'C', 'H') + A(h, 'H'); }
    for (const d of [270, 0]) { const h = armEnd(c2, d, 32); s += B(c2, h, 'C', 'H') + A(h, 'H'); }
    s += Hon(c2, 90, 32, 'C');
    return s;
  }],
];

FIGURES.push({
  id: 'acidic-h-gallery',
  section: 'pka',
  anchor: '<h3>The table worth memorizing the shape of</h3>',
  alt: 'Nine small structures, each with the hydrogen the table refers to highlighted, in order of pKa: acetic acid O–H 4.76; pentane-2,4-dione, a C–H on the carbon between the two C=O groups, 9; phenol O–H 10; ethanol O–H 16; acetone, a C–H on the carbon next to the C=O, 19 to 20; propyne, the C–H on the end of the triple bond, 25; ammonia N–H 38; ethene C–H 44; ethane C–H 50.',
  viewBox: '0 0 760 520',
  build() {
    let s = '';
    galleryCells.forEach(([title, foot, draw], i) => {
      const col = i % 3, row = Math.floor(i / 3);
      s += cell(8 + col * (CELL_W + 11), 8 + row * (CELL_H + 12), title, foot, draw);
    });
    return s;
  },
  caption: 'One example for nine of the table&rsquo;s rows, with the hydrogen that the pKa belongs to highlighted. Read left to right and down: the acids get weaker.'
});

/* ======================================================================
   4. Can this base take that proton? Propyne with hydroxide, then amide.
   ====================================================================== */
/* Pieces, each drawn around an anchor point. */
function propyne(x, y) {
  const m = P(x, y), c1 = P(x + 44, y), c2 = P(x + 82, y), h = P(x + 124, y);
  let s = B(m, c1, 'H₃C', '') + bond(c1, c2, { rFrom: 0, rTo: 0, order: 3 });
  s += B(c2, h, '', 'H', HI) + A(m, 'H₃C') + A(h, 'H', { kind: 'hi' });
  return { s, c2, h, bondMid: P((c2.x + h.x - 12) / 2, y) };
}
function acetylide(x, y) {
  const m = P(x, y), c1 = P(x + 44, y), c2 = P(x + 82, y);
  let s = B(m, c1, 'H₃C', '') + bond(c1, c2, { rFrom: 0, rTo: 0, order: 3 }) + A(m, 'H₃C');
  s += lonePair(c2.x, c2.y, 0, { dist: 9 });
  s += chg(c2.x + 14, c2.y - 12, '−');
  return s;
}
function hydroxide(x, y) {
  const o = P(x, y), h = P(x + 36, y);
  let s = B(o, h, 'O', 'H') + A(o, 'O', { kind: 'warn' }) + A(h, 'H');
  s += LP(o, 180) + LP(o, 90) + LP(o, 270);
  s += chg(o.x + 15, o.y - 20, '−');
  return { s, lp: armEnd(o, 180, 20) };
}
function amide(x, y) {
  const n = P(x, y);
  let s = A(n, 'N', { kind: 'warn' });
  for (const d of [30, 330]) { const h = armEnd(n, d, 34); s += B(n, h, 'N', 'H') + A(h, 'H'); }
  s += LP(n, 150) + LP(n, 210);
  s += chg(n.x, n.y - 24, '−');
  return { s, lp: armEnd(n, 150, 20) };
}
function water(x, y) {
  // The new O–H (highlighted) points left, toward where the proton came from.
  const o = P(x + 36, y), hn = P(x, y), h = armEnd(o, 300, 34);
  let s = B(o, hn, 'O', 'H', HI) + B(o, h, 'O', 'H') + A(o, 'O') + A(hn, 'H', { kind: 'hi' }) + A(h, 'H');
  s += LP(o, 30) + LP(o, 115);
  return s;
}
function ammonia(x, y) {
  const n = P(x + 36, y), hn = P(x, y);
  let s = B(n, hn, 'N', 'H', HI) + A(n, 'N') + A(hn, 'H', { kind: 'hi' });
  for (const d of [30, 330]) { const h = armEnd(n, d, 34); s += B(n, h, 'N', 'H') + A(h, 'H'); }
  s += LP(n, 180 - 90);
  return s;
}
/* The two proton-transfer arrows: base lone pair to H, C–H bond onto C. */
function transferArrows(p, lp) {
  let s = curve(P(lp.x - 2, lp.y - 6), P(p.h.x + 6, p.h.y - 14), { bow: 22, size: 7 });
  s += curve(P(p.bondMid.x + 2, p.bondMid.y + 4), P(p.c2.x - 2, p.c2.y + 10), { bow: -12, size: 7 });
  return s;
}

const RXN = {
  hydroxide: { base: hydroxide, acid: water, acidTag: 'water · pKa 15.7', lean: 'left',
    verdict: ['FAVORS THE LEFT', 'K ≈ 10⁻⁹'], stacked: 'FAVORS THE REACTANTS', vcls: 'fg-tag-warn' },
  amide: { base: amide, acid: ammonia, acidTag: 'ammonia · pKa 38', lean: 'right',
    verdict: ['FAVORS THE RIGHT', 'K ≈ 10¹³'], stacked: 'FAVORS THE PRODUCTS', vcls: 'fg-tag-good' },
};

function rowWide(y, key) {
  const r = RXN[key];
  let s = '';
  const p = propyne(42, y);
  const b = r.base(236, y);
  s += p.s + plusSign(196, y + 5) + b.s + transferArrows(p, b.lp);
  s += tag(98, y + 40, 'propyne · pKa 25');
  s += eqH(290, 346, y, r.lean);
  s += acetylide(376, y);
  s += plusSign(490, y + 5);
  s += r.acid(514, y);
  s += tag(550, y + 50, r.acidTag);
  s += text(692, y - 4, r.verdict[0], { cls: r.vcls, size: 11 });
  s += text(692, y + 14, r.verdict[1], { cls: 'fg-tag', size: 11 });
  return s;
}

FIGURES.push({
  id: 'keq-alkyne',
  section: 'pka',
  anchor: '<h3>Predicting which side an equilibrium favors</h3>',
  alt: 'Two proton transfers from propyne. Top: propyne plus hydroxide, with curved arrows from an oxygen lone pair to the terminal H and from the C–H bond onto carbon, in equilibrium with the propynide anion plus water. The reverse arrow is long: the equilibrium favors the left, K about 10 to the minus 9, because water (pKa 15.7) is a stronger acid than propyne (pKa 25). Bottom: the same with amide ion, giving ammonia (pKa 38); the forward arrow is long and K is about 10 to the 13th.',
  viewBox: '0 0 760 262',
  build() {
    let s = '';
    s += tag(380, 22, 'THE SAME PROTON, TWO DIFFERENT BASES');
    s += rowWide(80, 'hydroxide');
    s += rule(24, 144, 736, 144);
    s += rowWide(196, 'amide');
    return s;
  },
  caption: 'Only the base changes between the two rows. In each row, the longer equilibrium arrow marks the favored side.',
});

/* The lesson copy: each reaction stacked, reactants over products. */
function stack(oy, key) {
  const r = RXN[key];
  let s = '';
  const y1 = oy + 40, y2 = oy + 146;
  const p = propyne(34, y1);
  const b = r.base(246, y1);
  s += p.s + plusSign(208, y1 + 5) + b.s + transferArrows(p, b.lp);
  s += tag(96, y1 + 34, 'pKa 25');
  s += eqV(206, y1 + 28, y2 - 26, r.lean === 'left' ? 'up' : 'down');
  s += text(190, oy + 100, r.stacked, { cls: r.vcls, size: 11, anchor: 'end' });
  s += acetylide(34, y2);
  s += plusSign(170, y2 + 5);
  s += r.acid(200, y2);
  s += tag(236, y2 + 50, r.acidTag.replace(/^.* · /, ''));
  return s;
}

FIGURES.push({
  id: 'l-keq-alkyne',
  lessons: ['pka'],
  alt: 'Top: propyne plus hydroxide in equilibrium with the propynide anion plus water; the arrow back up to the reactants is the long one, so the equilibrium favors the reactants. Bottom: propyne plus amide ion in equilibrium with propynide plus ammonia; the arrow down to the products is the long one, so it favors the products.',
  viewBox: '0 0 340 450',
  build() {
    let s = '';
    s += tag(170, 18, 'BASE: HYDROXIDE');
    s += stack(18, 'hydroxide');
    s += rule(16, 222, 324, 222);
    s += tag(170, 246, 'BASE: AMIDE ION');
    s += stack(246, 'amide');
    return s;
  },
  caption: 'Only the base changes. In each reaction, the longer equilibrium arrow marks the favored side.',
});

/* ======================================================================
   5. The bicarbonate separation.
   ====================================================================== */
FIGURES.push({
  id: 'bicarbonate-extraction',
  section: 'pka',
  anchor: '<h3>Predicting which side an equilibrium favors</h3>',
  alt: 'A separatory funnel with an upper ether layer holding the neutral phenol and a lower aqueous layer holding the carboxylate salt, with the two pKa comparisons written beside it',
  viewBox: '0 0 760 320',
  build() {
    let s = '';
    s += tag(192, 36, 'ONE REAGENT, TWO LAYERS');

    // ---- the funnel: a body with two layers and a stem ----
    s += panel(56, 64, 272, 176, { r: 14 });
    s += bar(60, 68, 264, 82, { kind: 'mut', r: 10, opacity: 0.12 });
    s += bar(60, 152, 264, 84, { kind: 'hi', r: 10, opacity: 0.3 });
    s += rule(60, 150, 328, 150);
    s += rule(178, 240, 178, 278);
    s += rule(206, 240, 206, 278);

    s += text(192, 98, 'ORGANIC LAYER — ether, on top', { cls: 'fg-tag-mut', size: 11 });
    s += text(192, 122, 'phenol, PhOH', { cls: 'fg-lbl', size: 13 });
    s += text(192, 140, 'neutral, so it stays here', { cls: 'fg-sm', size: 10 });

    s += text(192, 180, 'AQUEOUS LAYER — denser, below', { cls: 'fg-tag', size: 11 });
    s += text(192, 204, 'carboxylate, RCO₂⁻ Na⁺', { cls: 'fg-lbl', size: 13 });
    s += text(192, 222, 'charged, so it dissolves in water', { cls: 'fg-sm', size: 10 });

    s += text(192, 300, 'drain the lower (aqueous) layer', { cls: 'fg-sm', size: 10 });

    s += rule(376, 48, 376, 300);

    s += text(404, 74, 'The base is NaHCO₃.', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(404, 94, 'Its conjugate acid is carbonic acid, pKa 6.4,', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(404, 112, 'so it deprotonates acids below 6.4', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(404, 130, 'and leaves acids well above it alone.', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += text(404, 168, 'carboxylic acid, pKa 4.76', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(404, 186, '1.6 units below. With excess bicarbonate, and CO\u2082', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(404, 204, 'bubbling off, it loses its proton, becomes an', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(404, 222, 'ion and moves into the water.', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += text(404, 240, 'phenol, pKa 10', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    s += text(404, 258, '3.6 units above: it keeps its proton, stays', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(404, 276, 'neutral and stays in the ether.', { cls: 'fg-sm', size: 10, anchor: 'start' });
    return s;
  },
  caption: 'Left: the funnel after shaking, with each compound in its layer. Right: the two pKa comparisons that decide where each one goes.',
});

/* ======================================================================
   6. pH against pKa: which form you hold.
   ====================================================================== */
FIGURES.push({
  id: 'ph-forms',
  section: 'pka',
  anchor: '<h3>pH decides which form you are holding</h3>',
  alt: 'A pH axis from 0 to 14. Upper bar: acetic acid is mostly CH3COOH below pH 4.76 and mostly acetate above it. Lower bar: an ammonium ion with pKa 10 is mostly RNH3+ below pH 10 and mostly the neutral amine above. Dashed lines mark stomach acid at about pH 2 and blood at pH 7.4.',
  viewBox: '0 0 760 250',
  build() {
    const x0 = 70, k = 46, xOf = (ph) => x0 + ph * k;
    let s = '';
    const rowY = [70, 142], H = 40;
    const rows = [
      [4.76, 'CH₃COOH', 'CH₃COO⁻', 'acetic acid, pKa 4.76'],
      [10, 'R–NH₃⁺', 'R–NH₂', 'an ammonium ion, pKa 10'],
    ];
    rows.forEach(([pka, lo, hi, name], i) => {
      const y = rowY[i];
      s += bar(xOf(0), y, xOf(pka) - xOf(0) - 1, H, { kind: 'mut', opacity: 0.25, r: 6 });
      s += bar(xOf(pka) + 1, y, xOf(14) - xOf(pka) - 1, H, { kind: 'hi', opacity: 0.25, r: 6 });
      s += lbl((xOf(0) + xOf(pka)) / 2, y + 25, lo);
      s += lbl((xOf(pka) + xOf(14)) / 2, y + 25, hi);
      s += text(xOf(pka), y - 6, name, { cls: 'fg-tag', size: 11 });
    });
    // pH axis
    const ay = 206;
    s += rule(xOf(0), ay, xOf(14), ay);
    for (let ph = 0; ph <= 14; ph += 2) {
      s += bond(P(xOf(ph), ay), P(xOf(ph), ay + 6), { rFrom: 0, rTo: 0 });
      s += text(xOf(ph), ay + 20, String(ph), { cls: 'fg-sm', size: 10 });
    }
    s += text(xOf(0) - 14, ay + 4, 'pH', { cls: 'fg-tag', size: 11, anchor: 'end' });
    // stomach and blood
    for (const [ph, name] of [[2, 'stomach, pH ≈ 2'], [7.4, 'blood, pH 7.4']]) {
      s += `<line class="fg-dash" x1="${xOf(ph)}" y1="40" x2="${xOf(ph)}" y2="${ay}"></line>`;
      s += text(xOf(ph), 30, name, { cls: 'fg-tag-mut', size: 11 });
    }
    return s;
  },
  caption: 'Each bar changes form at its own pKa, where the two forms are equal. Follow a dashed line down to read which form each compound takes at that pH.',
});

export default FIGURES;
