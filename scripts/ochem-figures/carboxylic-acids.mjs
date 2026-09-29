/* Figures for the carboxylic-acids notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Most figures are drawn as "cells": one structure inside a panel, written
   in the cell's own coordinates. The notes page lays cells side by side; a
   lesson copy (id prefix l-) stacks the same cells at 340 wide, so the notes
   and the lesson show the same drawing. Text inside a cell is fg-lbl or
   fg-tag only, which is what a lesson figure may use. */
import { atom, bond, arrow, curve, lonePair, text, tag, panel, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, benzene } from '../lib/ochem-skeletal.mjs';
import { armEnd } from '../lib/ochem-helpers.mjs';

const FIGURES = [];
const r2 = (v) => Math.round(v * 100) / 100;

/* ------------------------------------------------------------ helpers --- */

/* A panel with a title tag at the top and up to two foot tags at the bottom.
   `draw(Q)` gets a point maker shifted to the cell's corner. */
function cell(ox, oy, w, h, title, foot, draw, opts = {}) {
  const Q = (x, y) => P(ox + x, oy + y);
  let s = panel(ox, oy, w, h, opts.kind ? { kind: opts.kind } : {});
  if (title) s += tag(ox + w / 2, oy + 22, title);
  const feet = foot ? (Array.isArray(foot) ? foot : [foot]) : [];
  feet.forEach((f, i) => {
    s += text(ox + w / 2, oy + h - 14 - (feet.length - 1 - i) * 18, f, { cls: opts.footCls || 'fg-tag-good', size: 11 });
  });
  s += draw(Q, w, h);
  return s;
}

const A = (p, l, o = {}) => atom(p.x, p.y, l, o);
const rOf = (l) => (l.length >= 4 ? 22 : l.length === 3 ? 19 : l.length === 2 ? 16 : l === 'H' ? 11 : 15);
const charge = (p, s) => text(p.x, p.y, s, { cls: 'fg-warn', size: 15 });
/* A point at `dist` from p, at a screen angle (clockwise from east, as
   lonePair measures it). */
const at = (p, deg, dist) => P(p.x + Math.cos((deg * Math.PI) / 180) * dist, p.y + Math.sin((deg * Math.PI) / 180) * dist);
const mid = (a, b) => P((a.x + b.x) / 2, (a.y + b.y) / 2);
/* A double-headed resonance arrow. */
const resArrow = (a, b) => arrow(a, b, { size: 7 }) + arrow(b, a, { size: 7 });
/* A small ring that marks a skeletal carbon. */
const mark = (p) => `<circle class="fg-atom-hi" cx="${r2(p.x)}" cy="${r2(p.y)}" r="5.5"></circle>`;

/* The carboxyl unit CH3–C(O)(O): carbon at (x, y), one oxygen straight up,
   one down-right, CH3 down-left. `o` says which C–O is double, whether the
   lower oxygen carries the H, and whether to draw the curved arrows that
   push the lower oxygen's lone pair into the C–O bond and the C=O pi bond
   onto the upper oxygen. Returns the ink and the key points. */
function carboxyl(Q, x, y, o = {}) {
  const c = Q(x, y);
  const oT = armEnd(c, 90, 54), oR = armEnd(c, 330, 54), me = armEnd(c, 210, 54);
  const topDouble = o.topDouble !== false;
  let s = '';
  s += bond(c, oT, { rFrom: 16, rTo: 15, order: topDouble ? 2 : 1 });
  s += bond(c, oR, { rFrom: 16, rTo: 15, order: topDouble ? 1 : 2 });
  s += bond(c, me, { rFrom: 16, rTo: 19 });
  let h = null;
  if (o.H) { h = armEnd(oR, 30, 40); s += bond(oR, h, { rFrom: 15, rTo: 11 }); }
  s += A(me, 'CH₃', { r: 19 });
  s += A(oT, 'O', o.topKind ? { kind: o.topKind } : {});
  s += A(oR, 'O', o.rightKind ? { kind: o.rightKind } : {});
  if (h) s += A(h, 'H', { r: 11 });
  s += A(c, 'C', { kind: o.cKind || 'hi' });

  // Upper oxygen: two pairs when double-bonded, three and a minus when single.
  if (topDouble) {
    s += lonePair(oT.x, oT.y, 225, { dist: 22 }) + lonePair(oT.x, oT.y, 315, { dist: 22 });
  } else {
    s += lonePair(oT.x, oT.y, 180, { dist: 22 }) + lonePair(oT.x, oT.y, 270, { dist: 22 }) + lonePair(oT.x, oT.y, 0, { dist: 22 });
    s += charge(at(oT, 315, 30), '−');
  }
  // Lower oxygen. Its bond to carbon points up-left (screen 210).
  if (o.H && topDouble) {            // neutral O–H: two pairs, below
    s += lonePair(oR.x, oR.y, 50, { dist: 22 }) + lonePair(oR.x, oR.y, 130, { dist: 22 });
  } else if (o.H) {                  // O+ with H, double to C: one pair
    s += lonePair(oR.x, oR.y, 90, { dist: 22 });
    s += charge(at(oR, 270, 28), '+');
  } else if (topDouble) {            // O− single to C: three pairs
    s += lonePair(oR.x, oR.y, 300, { dist: 22 }) + lonePair(oR.x, oR.y, 30, { dist: 22 }) + lonePair(oR.x, oR.y, 120, { dist: 22 });
    s += charge(at(oR, 345, 31), '−');
  } else {                           // O double to C, no H: two pairs
    s += lonePair(oR.x, oR.y, 330, { dist: 22 }) + lonePair(oR.x, oR.y, 90, { dist: 22 });
  }

  if (o.arrows) {
    // lower O lone pair -> C–O bond; C=O pi -> upper O.
    const lp = at(oR, o.H ? 130 : 120, 26);
    s += curve(lp, mid(c, oR), { bow: 20 });
    const piStart = at(mid(c, oT), 180, 7);
    s += curve(piStart, at(oT, 200, 21), { bow: 14 });
  }
  return { s, c, oT, oR, me, h };
}

/* ======================================================================
   1. The carboxyl group is flat, and its OH already donates.
   ====================================================================== */
const structureCells = [
  ['ACETIC ACID', ['sp² carbon: three groups, flat, 120° apart'], (Q, w) => {
    const m = carboxyl(Q, w / 2 - 20, 108, { H: true, arrows: true });
    let s = m.s;
    const a1 = at(m.c, 150, 27), a2 = at(m.c, 30, 27);
    s += `<path class="fg-bond-soft" d="M${r2(a1.x)} ${r2(a1.y)} A27 27 0 0 0 ${r2(a2.x)} ${r2(a2.y)}"></path>`;
    s += text(m.c.x, m.c.y + 44, '120°', { cls: 'fg-tag', size: 11 });
    return s;
  }],
  ['MINOR CONTRIBUTOR', ['charges separated, so it counts for less', 'but the C–OH bond gains double-bond character'], (Q, w) => {
    const m = carboxyl(Q, w / 2 - 20, 108, { H: true, topDouble: false, topKind: 'warn', rightKind: 'warn' });
    return m.s;
  }],
];

FIGURES.push({
  id: 'carboxyl-structure',
  section: 'carboxylic-acids',
  anchor: '<h3>Structure</h3>',
  alt: 'Two resonance contributors of acetic acid. Left: the usual structure, a flat carbon with a C=O, an O–H and a CH3 at 120 degrees, with one curved arrow from a lone pair on the OH oxygen into the C–O bond and one from the C=O pi bond onto the top oxygen. Right: the minor contributor, with a single bond to a negative top oxygen and a double bond to a positive OH oxygen.',
  viewBox: '0 0 760 252',
  build() {
    let s = '';
    s += cell(8, 8, 344, 236, ...structureCells[0].slice(0, 3));
    s += cell(408, 8, 344, 236, ...structureCells[1].slice(0, 3));
    s += resArrow(P(360, 126), P(400, 126));
    return s;
  },
  caption: 'Follow the two arrows on the left: a lone pair on the OH oxygen moves into the C–O bond, and the C=O pi electrons move onto the top oxygen. That gives the structure on the right.',
});

FIGURES.push({
  id: 'l-carboxyl-structure',
  lessons: ['carboxylic-acids'],
  alt: 'Two stacked resonance contributors of acetic acid. Top: the flat carboxyl carbon with a C=O, an O–H and a CH3, with curved arrows pushing the OH lone pair into the C–O bond and the C=O pi bond onto the top oxygen. Bottom: the minor contributor with a negative top oxygen and a positive, double-bonded OH oxygen.',
  viewBox: '0 0 340 520',
  build() {
    let s = '';
    s += cell(8, 8, 324, 236, ...structureCells[0].slice(0, 3));
    s += resArrow(P(170, 250), P(170, 270));
    s += cell(8, 276, 324, 236, ...structureCells[1].slice(0, 3));
    return s;
  },
  caption: 'The arrows on the top drawing turn it into the bottom one.',
});

/* ======================================================================
   2. The acid dimer.
   ====================================================================== */
FIGURES.push({
  id: 'acid-dimer',
  section: 'carboxylic-acids',
  anchor: 'which is why the measured molecular weight of acetic acid vapor comes out close to double.</p>',
  viewBox: '0 0 760 280',
  alt: 'Two acetic acid molecules facing each other. Each O–H hydrogen reaches across to the other molecule’s carbonyl oxygen, closing an eight-membered ring held by two hydrogen bonds. Below: acetic acid, 60 g/mol, boils at 118 °C; acetone, 58 g/mol, boils at 56 °C.',
  build() {
    let s = '';
    const Y = -50;
    const meL = P(180, 180 + Y), cL = P(256, 180 + Y), o1L = P(330, 130 + Y), o2L = P(330, 230 + Y);
    const meR = P(580, 180 + Y), cR = P(504, 180 + Y), o1R = P(430, 230 + Y), o2R = P(430, 130 + Y);
    const hL = P(380, 244 + Y), hR = P(380, 116 + Y);

    s += bond(cL, o1L, { order: 2 });
    s += bond(cL, o2L);
    s += bond(cL, meL, { rTo: 19 });
    s += bond(cR, o1R, { order: 2 });
    s += bond(cR, o2R);
    s += bond(cR, meR, { rTo: 19 });
    s += bond(o2L, hL, { rTo: 11 });
    s += bond(o2R, hR, { rTo: 11 });
    // the two hydrogen bonds, dashed
    s += bond(hL, o1R, { rFrom: 11, cls: 'fg-dash-hi' });
    s += bond(hR, o1L, { rFrom: 11, cls: 'fg-dash-hi' });

    s += atom(meL.x, meL.y, 'CH₃', { r: 19 });
    s += atom(meR.x, meR.y, 'CH₃', { r: 19 });
    s += atom(cL.x, cL.y, 'C', { kind: 'hi' });
    s += atom(cR.x, cR.y, 'C', { kind: 'hi' });
    s += atom(o1L.x, o1L.y, 'O'); s += lonePair(o1L.x, o1L.y, 250); s += lonePair(o1L.x, o1L.y, 190);
    s += atom(o1R.x, o1R.y, 'O'); s += lonePair(o1R.x, o1R.y, 10); s += lonePair(o1R.x, o1R.y, 70);
    s += atom(o2L.x, o2L.y, 'O'); s += lonePair(o2L.x, o2L.y, 110); s += lonePair(o2L.x, o2L.y, 170);
    s += atom(o2R.x, o2R.y, 'O'); s += lonePair(o2R.x, o2R.y, 290); s += lonePair(o2R.x, o2R.y, 350);
    s += atom(hL.x, hL.y, 'H', { r: 11 });
    s += atom(hR.x, hR.y, 'H', { r: 11 });

    s += tag(380, 36, 'hydrogen bond');
    s += tag(380, 232, 'hydrogen bond');

    s += text(380, 266, 'acetic acid: 60 g/mol, bp 118 °C  ·  compare acetone (no O–H): 58 g/mol, bp 56 °C', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'Each dashed line runs from one molecule’s O–H hydrogen to the other molecule’s C=O oxygen. Count the ring they close: eight atoms.',
});

/* ======================================================================
   3. Ethoxide against acetate.
   ====================================================================== */
FIGURES.push({
  id: 'alkoxide-vs-carboxylate',
  section: 'carboxylic-acids',
  anchor: '<h3>Why the O–H is so acidic</h3>',
  alt: 'Left: ethoxide, CH3–CH2–O minus, with the whole negative charge on one oxygen; its acid, ethanol, has pKa 16. Right: the two resonance contributors of acetate, with the negative charge on the lower oxygen in one and on the upper oxygen in the other; its acid, acetic acid, has pKa 4.76.',
  viewBox: '0 0 760 262',
  build() {
    let s = '';
    // Ethoxide.
    s += cell(8, 8, 232, 246, 'ETHOXIDE', ['whole charge on one O', 'ethanol: pKa 16'], (Q) => {
      const me = Q(52, 132), ch2 = Q(110, 100), o = Q(168, 132);
      let t = bond(me, ch2, { rFrom: 19, rTo: 19 }) + bond(ch2, o, { rFrom: 19, rTo: 16 });
      t += A(me, 'CH₃', { r: 19 }) + A(ch2, 'CH₂', { r: 19 }) + A(o, 'O', { kind: 'warn' });
      t += lonePair(o.x, o.y, 300, { dist: 23 }) + lonePair(o.x, o.y, 30, { dist: 23 }) + lonePair(o.x, o.y, 120, { dist: 23 });
      t += charge(at(o, 345, 32), '−');
      return t;
    });
    // Acetate: two contributors in one panel.
    s += panel(256, 8, 496, 246);
    s += tag(504, 30, 'ACETATE');
    s += text(504, 222, 'charge shared by two equal O atoms', { cls: 'fg-tag-good', size: 11 });
    s += text(504, 240, 'acetic acid: pKa 4.76', { cls: 'fg-tag-good', size: 11 });
    const Q1 = (x, y) => P(256 + x, 8 + y);
    s += carboxyl(Q1, 110, 112, { arrows: true, rightKind: 'warn' }).s;
    s += resArrow(P(462, 128), P(508, 128));
    const Q2 = (x, y) => P(510 + x, 8 + y);
    s += carboxyl(Q2, 110, 112, { topDouble: false, topKind: 'warn' }).s;
    return s;
  },
  caption: 'On the left the charge has one place to be. On the right, the arrows move it from the lower oxygen to the upper one, and the two drawings differ only in which oxygen is which.',
});

/* ======================================================================
   4. The three diacids.
   ====================================================================== */
/* A COOH on skeletal carbon p, whose chain neighbour is nb. The =O goes on
   the side given by `oSide` (+1 or −1, turning from the neighbour bond). */
function cooh(p, nb, oSide, labeled = false) {
  const base = (Math.atan2(-(nb.y - p.y), nb.x - p.x) * 180) / Math.PI;
  const L = labeled ? 46 : 40, rc = labeled ? 15 : 0;
  const oD = armEnd(p, base + 120 * oSide, L), oH = armEnd(p, base - 120 * oSide, L);
  let s = bond(p, oD, { rFrom: rc, rTo: 15, order: 2 }) + bond(p, oH, { rFrom: rc, rTo: 16 });
  s += A(oD, 'O') + A(oH, 'OH', { r: 16 });
  if (labeled) s += A(p, 'C', { kind: 'hi' });
  return s;
}
const diacidCells = [
  ['OXALIC ACID', 2, 'no carbon between', 'pKa 1.27, then 4.27', 'gap 3.0'],
  ['MALONIC ACID', 3, 'one carbon between', 'pKa 2.83, then 5.69', 'gap 2.9'],
  ['SUCCINIC ACID', 4, 'two carbons between', 'pKa 4.21, then 5.64', 'gap 1.4'],
];
FIGURES.push({
  id: 'diacids',
  section: 'carboxylic-acids',
  anchor: '<h3>Substituent effects on top of resonance</h3>',
  alt: 'Three diacids drawn as skeletal structures. Oxalic acid, two COOH groups bonded directly: pKa 1.27 then 4.27, a gap of 3.0. Malonic acid, one CH2 between them: pKa 2.83 then 5.69, a gap of 2.9. Succinic acid, two CH2 groups between them: pKa 4.21 then 5.64, a gap of 1.4.',
  viewBox: '0 0 760 258',
  build() {
    let s = '';
    diacidCells.forEach(([title, n, between, pk, gap], i) => {
      s += cell(8 + i * 252, 8, 240, 242, title, [between, pk, gap], (Q, w) => {
        const dx = n === 2 ? 52 : 42;
        const span = (n - 1) * dx;
        const pts = zig(0, 0, n, dx, 22).map((p) => Q(w / 2 - span / 2 + p.x, 110 + p.y));
        let t = '';
        for (let k = 0; k < n - 1; k++) t += bond(pts[k], pts[k + 1], { rFrom: k === 0 ? 15 : 0, rTo: k + 1 === n - 1 ? 15 : 0 });
        t += cooh(pts[0], pts[1], 1, true);
        t += cooh(pts[n - 1], pts[n - 2], n % 2 === 0 ? 1 : -1, true);
        for (let k = 1; k < n - 1; k++) t += mark(pts[k]);
        return t;
      }, { footCls: 'fg-tag' });
    });
    return s;
  },
  caption: 'Read the bottom line of each panel. The gap between the two pKa values closes as the marked carbons push the two carboxyl groups apart.',
});

/* ======================================================================
   5. Benzoic acids with a group across the ring.
   ====================================================================== */
const benzoicCells = [
  ['BENZOIC ACID', null, 'H at the para position', 'pKa 4.20', 'fg-tag'],
  ['p-NITROBENZOIC ACID', 'NO₂', 'pulls electrons out of the ring', 'pKa 3.44: stronger', 'fg-tag-good'],
  ['p-METHOXYBENZOIC ACID', 'OCH₃', 'pushes electrons into the ring', 'pKa 4.47: weaker', 'fg-tag-warn'],
];
FIGURES.push({
  id: 'benzoic-acids',
  section: 'carboxylic-acids',
  anchor: 'here they show up as a change in pKa.</p>',
  viewBox: '0 0 760 300',
  alt: 'Three benzoic acids drawn as skeletal structures with the COOH at the top of the ring. Benzoic acid itself, pKa 4.20. p-Nitrobenzoic acid, with NO2 at the bottom of the ring, directly across from the COOH: pKa 3.44. p-Methoxybenzoic acid, with OCH3 in the same place: pKa 4.47.',
  build() {
    let s = '';
    benzoicCells.forEach(([title, group, note, pk, cls], i) => {
      s += cell(8 + i * 252, 8, 240, 284, title, [note, pk], (Q, w) => {
        const cx = Q(w / 2, 0).x, cy = Q(0, 150).y;
        const ring = benzene(cx, cy, 32, { rot: 90 });
        let t = ring.svg;
        const top = ring.pts[0], bot = ring.pts[3];
        const cc = P(top.x, top.y - 34);
        t += sk(top, cc);
        t += cooh(cc, top, 1);
        if (group) {
          const g = P(bot.x, bot.y + 36);
          t += bond(bot, g, { rFrom: 0, rTo: rOf(group) });
          t += A(g, group, { r: rOf(group), kind: 'hi' });
        } else {
          t += mark(bot);
        }
        t += group ? text(bot.x + 8, bot.y + 20, 'para', { cls: 'fg-tag', size: 11, anchor: 'start' }) : text(bot.x + 10, bot.y + 16, 'para', { cls: 'fg-tag', size: 11, anchor: 'start' });
        return t;
      }, { footCls: cls });
    });
    return s;
  },
  caption: 'The group sits across the ring from the COOH, the para position. Compare each pKa with benzoic acid’s 4.20.',
});

/* ======================================================================
   6. Five routes that all end at butanoic acid.
   ====================================================================== */
const ZX = 28, ZY = 17;
const routeCells = [
  ['BUTAN-1-OL', ['KMnO₄, or Jones reagent'], (Q) => {
    const v = zig(0, 0, 4, ZX, ZY).map((p) => Q(58 + p.x, 92 + p.y));
    let t = sk(v[0], v[1]) + sk(v[1], v[2]) + sk(v[2], v[3]);
    const oh = armEnd(v[3], 330, 34);
    t += bond(v[3], oh, { rFrom: 0, rTo: 16 }) + A(oh, 'OH', { r: 16 });
    return t + mark(v[3]);
  }],
  ['BUTANAL', ['KMnO₄, Ag₂O, or Jones reagent'], (Q) => {
    const v = zig(0, 0, 4, ZX, ZY).map((p) => Q(62 + p.x, 100 + p.y));
    let t = sk(v[0], v[1]) + sk(v[1], v[2]) + sk(v[2], v[3]);
    const o = armEnd(v[3], 90, 34), h = armEnd(v[3], 330, 30);
    t += bond(v[3], o, { rFrom: 0, rTo: 15, order: 2 }) + A(o, 'O');
    t += bond(v[3], h, { rFrom: 0, rTo: 11 }) + A(h, 'H', { r: 11 });
    return t + mark(v[3]);
  }],
  ['1-BROMOPROPANE', ['1. Mg  2. CO₂  3. H₃O⁺', 'the new carbon comes from CO₂'], (Q) => {
    const v = zig(0, 0, 3, ZX, ZY).map((p) => Q(76 + p.x, 78 + p.y));
    let t = sk(v[0], v[1]) + sk(v[1], v[2]);
    const br = armEnd(v[2], 30, 34);
    t += bond(v[2], br, { rFrom: 0, rTo: 16 }) + A(br, 'Br', { r: 16 });
    t += text(Q(48, 0).x, Q(0, 125).y, '+', { cls: 'fg-lbl', size: 13 });
    const o1 = Q(76, 120), c = Q(124, 120), o2 = Q(172, 120);
    t += bond(o1, c, { rFrom: 13, rTo: 14, order: 2 }) + bond(c, o2, { rFrom: 14, rTo: 13, order: 2 });
    t += atom(o1.x, o1.y, 'O', { r: 13 }) + atom(o2.x, o2.y, 'O', { r: 13 }) + atom(c.x, c.y, 'C', { kind: 'hi', r: 14 });
    return t;
  }],
  ['OCT-4-ENE', ['hot KMnO₄, or O₃ then H₂O₂', 'each half becomes butanoic acid'], (Q) => {
    const v = zig(0, 0, 8, 25, ZY).map((p) => Q(30 + p.x, 92 + p.y));
    let t = '';
    for (let k = 0; k < 7; k++) t += k === 3 ? ringDouble(v[3], v[4], P(v[3].x, v[3].y + 40), { inset: 5, gap: 4.4 }) : sk(v[k], v[k + 1]);
    return t + mark(v[3]) + mark(v[4]);
  }],
  ['ALL FOUR GIVE BUTANOIC ACID', ['marked: the COOH carbon'], (Q) => {
    const v = zig(0, 0, 4, ZX, ZY).map((p) => Q(62 + p.x, 100 + p.y));
    let t = sk(v[0], v[1]) + sk(v[1], v[2]) + sk(v[2], v[3]);
    const o = armEnd(v[3], 90, 34), oh = armEnd(v[3], 330, 34);
    t += bond(v[3], o, { rFrom: 0, rTo: 15, order: 2 }) + A(o, 'O');
    t += bond(v[3], oh, { rFrom: 0, rTo: 16 }) + A(oh, 'OH', { r: 16 });
    return t + mark(v[3]);
  }],
];
FIGURES.push({
  id: 'routes-to-acid',
  section: 'carboxylic-acids',
  anchor: '<h3>Getting to and from carboxylic acids</h3>',
  alt: 'Five skeletal structures. Butan-1-ol, butanal, 1-bromopropane plus carbon dioxide, and oct-4-ene, each with the reagent that turns it into a carboxylic acid and the carbon that becomes the COOH carbon marked. The fifth panel is butanoic acid, the product of all four.',
  viewBox: '0 0 760 404',
  build() {
    let s = '';
    routeCells.forEach(([title, foot, draw], i) => {
      const row = i < 3 ? 0 : 1, x = row === 0 ? 8 + i * 252 : 134 + (i - 3) * 252;
      s += cell(x, 8 + row * 200, 240, 188, title, foot, draw, { kind: i === 4 ? 'good' : null, footCls: i === 4 ? 'fg-tag-good' : 'fg-tag' });
    });
    return s;
  },
  caption: 'The marked carbon in each starting material ends up as the COOH carbon. From 1-bromopropane that carbon comes from CO₂; from oct-4-ene each alkene carbon becomes one.',
});

/* ======================================================================
   7. The acid's carbonyl carbon against acetone's.
   ====================================================================== */
const donationCells = [
  ['ACETIC ACID', ['the OH lone pair feeds the carbon', 'smaller δ+: the weaker electrophile'], (Q, w) => {
    const m = carboxyl(Q, w / 2 - 20, 104, { H: true, cKind: 'hi', arrows: true });
    let t = m.s;
    t += text(m.c.x - 26, m.c.y - 14, 'δ+', { cls: 'fg-tag', size: 11, anchor: 'end' });
    return t;
  }],
  ['ACETONE', ['only CH₃ groups: no lone pair to give', 'larger δ+: the better electrophile'], (Q, w) => {
    const c = Q(w / 2, 104);
    const o = armEnd(c, 90, 54), m1 = armEnd(c, 210, 54), m2 = armEnd(c, 330, 54);
    let t = bond(c, o, { rFrom: 16, rTo: 15, order: 2 }) + bond(c, m1, { rFrom: 16, rTo: 19 }) + bond(c, m2, { rFrom: 16, rTo: 19 });
    t += A(o, 'O') + A(m1, 'CH₃', { r: 19 }) + A(m2, 'CH₃', { r: 19 }) + A(c, 'C', { kind: 'warn' });
    t += lonePair(o.x, o.y, 225, { dist: 22 }) + lonePair(o.x, o.y, 315, { dist: 22 });
    t += text(c.x - 26, c.y - 14, 'δ+', { cls: 'fg-warn', size: 15, anchor: 'end' });
    return t;
  }],
];
FIGURES.push({
  id: 'acid-donation-vs-ketone',
  section: 'carboxylic-acids',
  anchor: 'A carboxylic acid is therefore noticeably <i>less</i> reactive toward nucleophilic attack than a ketone.</p>',
  viewBox: '0 0 760 252',
  alt: 'Left: acetic acid, with curved arrows from a lone pair on the OH oxygen into the bond to the carbonyl carbon and from the C=O pi bond onto the top oxygen, and a small delta-plus on the carbonyl carbon. Right: acetone, whose carbonyl carbon carries only two CH3 groups and a larger delta-plus.',
  build() {
    let s = '';
    s += cell(8, 8, 364, 236, ...donationCells[0]);
    s += cell(388, 8, 364, 236, ...donationCells[1]);
    return s;
  },
  caption: 'Compare the two δ+ labels. Only the acid has a lone pair next door to feed its carbonyl carbon.',
});
FIGURES.push({
  id: 'l-acid-donation-vs-ketone',
  lessons: ['carboxylic-acids'],
  alt: 'Two stacked panels. Top: acetic acid, with curved arrows from a lone pair on the OH oxygen into the bond to the carbonyl carbon and from the C=O pi bond onto the top oxygen, and a small delta-plus on the carbonyl carbon. Bottom: acetone, whose carbonyl carbon carries only two CH3 groups and a larger delta-plus.',
  viewBox: '0 0 340 504',
  build() {
    let s = '';
    s += cell(8, 8, 324, 236, ...donationCells[0]);
    s += cell(8, 260, 324, 236, ...donationCells[1]);
    return s;
  },
  caption: 'Only the acid has a lone pair next door to feed its carbonyl carbon.',
});

/* ======================================================================
   8. Beta-keto acid decarboxylation.
   ====================================================================== */
FIGURES.push({
  id: 'beta-keto-decarboxylation',
  section: 'carboxylic-acids',
  anchor: 'and no C=C appears.</p>',
  viewBox: '0 0 760 300',
  alt: '3-Oxobutanoic acid drawn as a six-membered ring: ketone oxygen, the transferring hydrogen, the carboxyl OH oxygen, the carboxyl carbon, the alpha CH2 and the ketone carbon. Three curved arrows: the ketone C=O pi bond takes the hydrogen, the O–H bond becomes a C=O of carbon dioxide, and the bond from the alpha carbon to the carboxyl carbon becomes the C=C of an enol. Next panel: the enol and CO2. Last panel: the enol has tautomerized to acetone.',
  build() {
    let s = '';
    // Panel 1: the ring.
    s += cell(8, 8, 296, 284, '3-OXOBUTANOIC ACID', ['six atoms in the ring,', 'three arrows at once'], (Q) => {
      const cen = Q(150, 142);
      const R = 56;
      const v = (deg) => P(cen.x + R * Math.cos((deg * Math.PI) / 180), cen.y - R * Math.sin((deg * Math.PI) / 180));
      const h = v(90), oH = v(30), cC = v(330), cA = v(270), cK = v(210), oK = v(150);
      const me = armEnd(cK, 210, 48), oX = armEnd(cC, 330, 46);
      let t = '';
      t += bond(oK, cK, { rFrom: 15, rTo: 15, order: 2 });
      t += bond(cK, cA, { rFrom: 15, rTo: 19 });
      t += bond(cA, cC, { rFrom: 19, rTo: 15 });
      t += bond(cC, oH, { rFrom: 15, rTo: 15 });
      t += bond(oH, h, { rFrom: 15, rTo: 11 });
      t += bond(h, oK, { rFrom: 11, rTo: 15, cls: 'fg-dash-hi' });
      t += bond(cC, oX, { rFrom: 15, rTo: 15, order: 2 });
      t += bond(cK, me, { rFrom: 15, rTo: 19 });
      t += A(me, 'CH₃', { r: 19 }) + A(oX, 'O') + A(oK, 'O') + A(oH, 'O') + A(h, 'H', { r: 11 });
      t += A(cK, 'C', { kind: 'hi' }) + A(cA, 'CH₂', { r: 19, kind: 'warn' }) + A(cC, 'C', { kind: 'hi' });
      t += lonePair(oK.x, oK.y, 170, { dist: 22 }) + lonePair(oK.x, oK.y, 250, { dist: 22 });
      t += lonePair(oH.x, oH.y, 290, { dist: 22 }) + lonePair(oH.x, oH.y, 10, { dist: 22 });
      t += lonePair(oX.x, oX.y, 350, { dist: 22 }) + lonePair(oX.x, oX.y, 80, { dist: 22 });
      // a: ketone C=O pi bond -> the forming O–H bond.
      t += curve(at(mid(oK, cK), 180, 7), mid(oK, h), { bow: 20 });
      // b: the O–H bond -> the C–O bond (becomes CO2's second C=O).
      t += curve(at(mid(oH, h), 30, 6), at(mid(cC, oH), 0, 6), { bow: 18 });
      // c: the alpha C–carboxyl C bond -> the C–C bond to the ketone carbon.
      t += curve(at(mid(cA, cC), 270, 4), at(mid(cK, cA), 270, 4), { bow: 20 });
      t += text(cK.x - 2, cK.y + 34, 'β', { cls: 'fg-tag', size: 11 });
      t += text(cA.x + 30, cA.y + 22, 'α', { cls: 'fg-tag', size: 11 });
      return t;
    });
    s += arrow(P(312, 150), P(352, 150));
    s += text(332, 138, 'warm', { cls: 'fg-tag', size: 11 });

    // Panel 2: the enol and CO2.
    s += cell(360, 8, 214, 284, 'ENOL + CO₂', ['the first product is an enol'], (Q) => {
      const c = Q(100, 116);
      const oe = armEnd(c, 90, 50), he = armEnd(oe, 30, 36), me = armEnd(c, 210, 50), ch2 = armEnd(c, 330, 52);
      let t = bond(c, oe, { rFrom: 15, rTo: 15 }) + bond(oe, he, { rFrom: 15, rTo: 11 }) + bond(c, me, { rFrom: 15, rTo: 19 }) + bond(c, ch2, { rFrom: 15, rTo: 19, order: 2 });
      t += A(oe, 'O') + A(he, 'H', { r: 11 }) + A(me, 'CH₃', { r: 19 }) + A(ch2, 'CH₂', { r: 19, kind: 'warn' }) + A(c, 'C', { kind: 'hi' });
      t += lonePair(oe.x, oe.y, 180, { dist: 22 }) + lonePair(oe.x, oe.y, 250, { dist: 22 });
      const o1 = Q(62, 212), cc = Q(107, 212), o2 = Q(152, 212);
      t += bond(o1, cc, { order: 2 }) + bond(cc, o2, { order: 2 });
      t += A(o1, 'O') + A(o2, 'O') + A(cc, 'C', { kind: 'hi' });
      t += lonePair(o1.x, o1.y, 135, { dist: 22 }) + lonePair(o1.x, o1.y, 225, { dist: 22 });
      t += lonePair(o2.x, o2.y, 315, { dist: 22 }) + lonePair(o2.x, o2.y, 45, { dist: 22 });
      return t;
    });
    s += arrow(P(582, 150), P(608, 150));

    // Panel 3: acetone.
    s += cell(616, 8, 136, 284, 'KETONE', ['what you isolate'], (Q) => {
      const c = Q(68, 128);
      const o = armEnd(c, 90, 50), m1 = armEnd(c, 210, 46), m2 = armEnd(c, 330, 46);
      let t = bond(c, o, { rFrom: 15, rTo: 15, order: 2 }) + bond(c, m1, { rFrom: 15, rTo: 19 }) + bond(c, m2, { rFrom: 15, rTo: 19 });
      t += A(o, 'O') + A(m1, 'CH₃', { r: 19 }) + A(m2, 'CH₃', { r: 19, kind: 'warn' }) + A(c, 'C', { kind: 'hi' });
      t += lonePair(o.x, o.y, 225, { dist: 22 }) + lonePair(o.x, o.y, 315, { dist: 22 });
      t += text(c.x, c.y + 70, 'acetone', { cls: 'fg-tag', size: 11 });
      return t;
    });
    return s;
  },
  caption: 'Follow the three arrows round the ring on the left. Then follow the highlighted CH₂ carbon: it ends up in the enol’s C=C, and then as a CH₃ of acetone.',
});

export default FIGURES;
