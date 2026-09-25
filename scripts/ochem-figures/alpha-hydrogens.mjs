/* Figures for the alpha-hydrogens notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every molecule here is acetone or a close relative, drawn with labelled
   atoms so the hydrogens can be counted. Most figures are "cells": one step
   of a mechanism, or one structure in a comparison, drawn inside a box at an
   offset. The notes page lays cells side by side; a lesson copy (id prefix
   l-) stacks the same cells at 340 wide, so notes and lesson show the same
   drawing. Text inside a cell is fg-lbl or fg-tag only.

   Angles: armEnd() and the `deg` of a group are measured counterclockwise
   from east, as on paper. lonePair() takes the SVG angle (clockwise, since
   y points down), so LP() below converts. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, panel, P } from '../lib/ochem-figure.mjs';
import { armEnd } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */

const CW = 244;
function cell(ox, oy, w, h, title, foot, draw, opts = {}) {
  const dx = ox + (w - (opts.cw || CW)) / 2;
  const Q = (x, y) => P(dx + x, oy + y);
  let s = panel(ox, oy, w, h, opts.kind ? { kind: opts.kind } : {});
  s += tag(ox + w / 2, oy + 22, title);
  if (foot) s += text(ox + w / 2, oy + h - 14, foot, { cls: opts.footCls || 'fg-tag-good', size: 11 });
  s += draw(Q);
  return s;
}

function gridFigure(cells, cols, w, h, gapX = 16, gapY = 16, x0 = 8, y0 = 8, kinds = []) {
  let s = '';
  cells.forEach(([title, foot, draw], i) => {
    const col = i % cols, row = Math.floor(i / cols);
    s += cell(x0 + col * (w + gapX), y0 + row * (h + gapY), w, h, title, foot, draw, { kind: kinds[i] || null });
  });
  return s;
}

const T = (Q, x, y, s, o = {}) => { const p = Q(x, y); return text(p.x, p.y, s, { cls: 'fg-lbl', size: 13, ...o }); };
const Tag = (p, s, o = {}) => text(p.x, p.y, s, { cls: 'fg-tag', size: 11, ...o });
const chg = (x, y, s) => text(x, y, s, { cls: 'fg-warn', size: 15 });

const rOf = (l) => (l.length >= 3 ? 19 : l.length === 2 ? 16 : l === 'H' ? 13 : 15);
const A = (p, l, o = {}) => atom(p.x, p.y, l, { r: rOf(l), ...o });
const B = (a, b, la, lb, o = {}) => bond(a, b, { rFrom: rOf(la), rTo: rOf(lb), ...o });
/* A lone pair at a paper angle (counterclockwise from east). */
const LP = (p, deg, d = 21) => lonePair(p.x, p.y, -deg, { dist: d });
/* Midpoint of two points, nudged by (ox, oy). */
const mid = (a, b, ox = 0, oy = 0) => P((a.x + b.x) / 2 + ox, (a.y + b.y) / 2 + oy);

/* Two straight arrows, forward above reverse: an equilibrium. */
const eqmH = (x1, x2, y) => arrow(P(x1, y - 5), P(x2, y - 5), { size: 7 }) + arrow(P(x2, y + 5), P(x1, y + 5), { size: 7 });
const eqmV = (x, y1, y2) => arrow(P(x - 5, y1), P(x - 5, y2), { size: 7 }) + arrow(P(x + 5, y2), P(x + 5, y1), { size: 7 });
/* A resonance arrow: one line, a head at each end. */
const resH = (x1, x2, y) => arrow(P(x1, y), P(x2, y), { size: 7 }) + arrow(P(x2, y), P(x1, y), { size: 7 });
const resV = (x, y1, y2) => arrow(P(x, y1), P(x, y2), { size: 7 }) + arrow(P(x, y2), P(x, y1), { size: 7 });

/* The acetone frame used by most cells: the carbonyl carbon c, the oxygen
   straight up, a methyl down-left and the alpha carbon down-right.
   co: order of the C–O bond; ca: order of the C–Cα bond. */
function acetoneFrame(c, { co = 2, ca = 1, oLabel = 'O', aLabel = 'CH₃', aKind, oKind } = {}) {
  const o = armEnd(c, 90, 52), m = armEnd(c, 210, 50), a = armEnd(c, 330, 54);
  let s = '';
  s += bond(c, o, { rFrom: 15, rTo: rOf(oLabel), order: co });
  s += bond(c, m, { rFrom: 15, rTo: 19 });
  s += bond(c, a, { rFrom: 15, rTo: rOf(aLabel), order: ca });
  s += A(o, oLabel, { kind: oKind }) + A(m, 'CH₃') + A(a, aLabel, { kind: aKind }) + A(c, 'C');
  return { s, o, m, a };
}

/* The pi electrons of a vertical C=O moving up onto the oxygen: a short
   arrow bowed out to the right of the double bond. */
const piToO = (c, o) => curve(P(c.x + 9, c.y - 26), P(o.x + 16, o.y + 8), { bow: 11, size: 7 });

/* ======================================================================
   1. Acetone with its six alpha hydrogens drawn out.
   ====================================================================== */
FIGURES.push({
  id: 'alpha-acetone',
  section: 'alpha-hydrogens',
  anchor: '<h3>The alpha carbon and its unusually acidic hydrogens</h3>',
  lessons: ['alpha-hydrogens'],
  alt: 'Acetone drawn with every hydrogen shown. The carbonyl carbon sits in the middle with the oxygen above it. The two carbons bonded to it are both alpha carbons, highlighted, and each carries three highlighted alpha hydrogens, six in all, with a pKa of about 20.',
  viewBox: '0 0 340 236',
  build() {
    const c = P(170, 116);
    const o = armEnd(c, 90, 52), l = armEnd(c, 210, 58), r = armEnd(c, 330, 58);
    let s = '';
    s += tag(170, 22, 'six α hydrogens, pKa about 20');
    s += bond(c, o, { rFrom: 15, rTo: 15, order: 2 });
    s += bond(c, l, { rFrom: 15, rTo: 16 }) + bond(c, r, { rFrom: 15, rTo: 16 });
    s += A(o, 'O') + LP(o, 150) + LP(o, 30);
    for (const [ac, degs] of [[l, [150, 210, 270]], [r, [30, 330, 270]]]) {
      for (const d of degs) {
        const h = armEnd(ac, d, 40);
        s += bond(ac, h, { rFrom: 16, rTo: 13 }) + A(h, 'H', { kind: 'hi' });
      }
      s += A(ac, 'C', { kind: 'hi' });
    }
    s += A(c, 'C');
    s += tag(190, 100, 'carbonyl C', { anchor: 'start' });
    s += tag(l.x, 222, 'α carbon') + tag(r.x, 222, 'α carbon');
    return s;
  },
  caption: 'The two highlighted carbons each touch the carbonyl carbon, so both are alpha carbons. All six of their hydrogens are alpha hydrogens.',
});

/* ======================================================================
   2. The enolate's two resonance contributors.
   ====================================================================== */
const enolateCells = [
  ['CHARGE ON CARBON', 'minor contributor', (Q) => {
    const c = Q(104, 116);
    const f = acetoneFrame(c, { aLabel: 'CH₂', aKind: 'hi' });
    let s = f.s + LP(f.o, 150) + LP(f.o, 30);
    // the carbanion pair, below and to the right of the CH2
    const lp = armEnd(f.a, 60, 24);
    s += LP(f.a, 60, 24);
    s += chg(f.a.x + 26, f.a.y + 16, '−');
    // pair -> the C–Cα bond (becomes the C=C); C=O pi -> O
    const bm = mid(c, f.a);
    s += curve(P(lp.x - 6, lp.y - 5), P(bm.x + 1, bm.y - 7), { bow: 14, size: 7 });
    s += piToO(c, f.o);
    return s;
  }],
  ['CHARGE ON OXYGEN', 'major contributor', (Q) => {
    const c = Q(104, 116);
    const f = acetoneFrame(c, { co: 1, ca: 2, aLabel: 'CH₂', oKind: 'warn' });
    let s = f.s + LP(f.o, 180) + LP(f.o, 90) + LP(f.o, 0);
    s += chg(f.o.x - 20, f.o.y - 16, '−');
    return s;
  }],
];

FIGURES.push({
  id: 'enolate-resonance',
  section: 'alpha-hydrogens',
  anchor: '<h3>Why: delocalization into the carbonyl</h3>',
  alt: 'The enolate of acetone as two resonance contributors joined by a double-headed arrow. Left, the minor contributor: the negative charge and a lone pair sit on the CH2 carbon, and the C=O is intact; curved arrows move that lone pair into the C–C bond and the C=O pi electrons onto oxygen. Right, the major contributor: a C=C double bond, and the oxygen carries three lone pairs and the negative charge.',
  viewBox: '0 0 560 220',
  build() {
    let s = gridFigure(enolateCells, 2, 244, 204, 56, 0, 8, 8);
    s += resH(262, 298, 110);
    return s;
  },
  caption: 'One anion, drawn two ways. The curved arrows on the left turn the left drawing into the right one. Only electrons move; every atom stays put.',
});

FIGURES.push({
  id: 'l-enolate-resonance',
  lessons: ['alpha-hydrogens'],
  alt: 'The enolate of acetone as two stacked resonance contributors joined by a double-headed arrow: charge on the CH2 carbon (minor), with curved arrows, then charge on oxygen with a C=C (major).',
  viewBox: '0 0 340 460',
  build() {
    let s = gridFigure(enolateCells, 1, 324, 204, 0, 36, 8, 8);
    s += resV(170, 216, 244);
    return s;
  },
  caption: 'One anion, drawn two ways. Only electrons move.',
});

/* ======================================================================
   3. Worked example: find the alpha hydrogens.
   ====================================================================== */
/* A chain of labelled atoms along a zigzag: pts, labels, bond orders. */
function chain(Q, pts, labels, orders = [], kinds = []) {
  let s = '';
  for (let i = 0; i < pts.length - 1; i++) {
    s += B(Q(...pts[i]), Q(...pts[i + 1]), labels[i], labels[i + 1], { order: orders[i] || 1 });
  }
  pts.forEach((p, i) => { s += A(Q(...p), labels[i], { kind: kinds[i] }); });
  return s;
}
const carbonylO = (Q, cx, cy, oLabel = 'O', order = 2, oKind) =>
  B(Q(cx, cy), Q(cx, cy - 50), 'C', oLabel, { order }) + A(Q(cx, cy - 50), oLabel, { kind: oKind });

const findCells = [
  ['(a) BUTAN-2-ONE', '5 α hydrogens, in two sets', (Q) => {
    let s = carbonylO(Q, 92, 112) + LP(Q(92, 62), 150) + LP(Q(92, 62), 30);
    s += chain(Q, [[42, 140], [92, 112], [142, 140], [192, 112]], ['CH₃', 'C', 'CH₂', 'CH₃'], [], ['hi', null, 'hi']);
    s += T(Q, 42, 190, 'α · 3 H', { cls: 'fg-tag', size: 11 });
    s += T(Q, 142, 190, 'α · 2 H', { cls: 'fg-tag', size: 11 });
    s += T(Q, 206, 80, 'not α', { cls: 'fg-tag-mut', size: 11 });
    return s;
  }],
  ['(b) 2,2-DIMETHYLPROPANAL', 'zero α hydrogens', (Q) => {
    const c = Q(160, 100), o = Q(160, 50), h = armEnd(c, 330, 42), q = armEnd(c, 210, 52);
    let s = B(c, o, 'C', 'O', { order: 2 }) + A(o, 'O') + LP(o, 150) + LP(o, 30);
    s += B(c, h, 'C', 'H') + A(h, 'H');
    s += B(c, q, 'C', 'C');
    const ms = [armEnd(q, 150, 48), armEnd(q, 210, 48), armEnd(q, 270, 44)];
    for (const m of ms) s += B(q, m, 'C', 'CH₃') + A(m, 'CH₃');
    s += A(q, 'C', { kind: 'warn' }) + A(c, 'C');
    s += Tag(P(q.x, q.y + 84), 'α · 0 H');
    s += Tag(P(h.x, h.y + 32), 'not α', { cls: 'fg-tag-mut' });
    return s;
  }],
  ['(c) ETHYL ACETATE', '3 α hydrogens, pKa about 25', (Q) => {
    let s = carbonylO(Q, 74, 112) + LP(Q(74, 62), 150) + LP(Q(74, 62), 30);
    s += chain(Q, [[26, 140], [74, 112], [122, 140], [170, 112], [218, 140]], ['CH₃', 'C', 'O', 'CH₂', 'CH₃'], [], ['hi']);
    s += LP(Q(122, 140), 230) + LP(Q(122, 140), 310);
    s += T(Q, 30, 190, 'α · 3 H', { cls: 'fg-tag', size: 11 });
    s += T(Q, 170, 80, 'on O: not α', { cls: 'fg-tag-mut', size: 11 });
    return s;
  }],
  ['(d) PENTANE-2,4-DIONE', 'the central CH₂ goes first', (Q) => {
    let s = carbonylO(Q, 76, 112) + LP(Q(76, 62), 150) + LP(Q(76, 62), 30);
    s += carbonylO(Q, 168, 112) + LP(Q(168, 62), 150) + LP(Q(168, 62), 30);
    s += chain(Q, [[30, 140], [76, 112], [122, 140], [168, 112], [214, 140]], ['CH₃', 'C', 'CH₂', 'C', 'CH₃'], [], ['hi', null, 'warn', null, 'hi']);
    s += T(Q, 30, 190, 'pKa 20', { cls: 'fg-tag', size: 11 });
    s += T(Q, 122, 190, 'pKa 9', { cls: 'fg-tag-warn', size: 11 });
    s += T(Q, 214, 190, 'pKa 20', { cls: 'fg-tag', size: 11 });
    return s;
  }],
];

FIGURES.push({
  id: 'alpha-find',
  section: 'alpha-hydrogens',
  anchor: 'Worked example — find the alpha hydrogens',
  alt: 'Four molecules with their alpha carbons highlighted. (a) Butan-2-one: the CH3 and the CH2 on either side of the carbonyl carbon are alpha, with 3 and 2 hydrogens; the end CH3 is not alpha. (b) 2,2-Dimethylpropanal: the only alpha carbon is a quaternary carbon with no hydrogens, and the aldehyde H sits on the carbonyl carbon itself. (c) Ethyl acetate: only the CH3 on the acyl side is alpha; the OCH2 is bonded to oxygen, not to the carbonyl carbon. (d) Pentane-2,4-dione: both end methyls are alpha, pKa 20, and the central CH2 is alpha to both carbonyls, pKa 9.',
  viewBox: '0 0 760 520',
  build() { return gridFigure(findCells, 2, 364, 244, 16, 16, 8, 8); },
  caption: 'Highlighted carbons touch a carbonyl carbon; those are the only places to count hydrogens.',
});

FIGURES.push({
  id: 'l-alpha-find',
  lessons: ['alpha-hydrogens'],
  alt: 'Two molecules with alpha carbons highlighted: butan-2-one, with alpha carbons on both sides of the carbonyl carrying 3 and 2 hydrogens; and 2,2-dimethylpropanal, whose only alpha carbon is quaternary, with no hydrogens.',
  viewBox: '0 0 340 516',
  build() { return gridFigure(findCells.slice(0, 2), 1, 324, 244, 0, 12, 8, 8); },
  caption: 'Count hydrogens only on the highlighted carbons.',
});

/* ======================================================================
   4. Pentane-2,4-dione's anion: three contributors.
   ====================================================================== */
function dione(Q, form) {
  // form: 'C' (charge on the central carbon), 'L' or 'R' (on that oxygen)
  const x = [30, 76, 122, 168, 214], y = [140, 112, 140, 112, 140];
  const p = x.map((v, i) => Q(v, y[i]));
  const oL = Q(76, 62), oR = Q(168, 62);
  const hiB = { cls: 'fg-bond-hi' };
  let s = '';
  s += B(p[0], p[1], 'CH₃', 'C');
  s += B(p[1], p[2], 'C', 'CH', { ...hiB, order: form === 'L' ? 2 : 1 });
  s += B(p[2], p[3], 'CH', 'C', { ...hiB, order: form === 'R' ? 2 : 1 });
  s += B(p[3], p[4], 'C', 'CH₃');
  s += B(p[1], oL, 'C', 'O', { ...hiB, order: form === 'L' ? 1 : 2 });
  s += B(p[3], oR, 'C', 'O', { ...hiB, order: form === 'R' ? 1 : 2 });
  s += A(p[0], 'CH₃') + A(p[1], 'C') + A(p[2], 'CH', { kind: form === 'C' ? 'warn' : null });
  s += A(p[3], 'C') + A(p[4], 'CH₃');
  s += A(oL, 'O', { kind: form === 'L' ? 'warn' : null }) + A(oR, 'O', { kind: form === 'R' ? 'warn' : null });
  for (const [o, neg, side] of [[oL, form === 'L', -1], [oR, form === 'R', 1]]) {
    if (neg) {
      s += LP(o, 180) + LP(o, 90) + LP(o, 0);
      s += chg(o.x + side * 20, o.y - 16, '−');
    } else {
      s += LP(o, 150) + LP(o, 30);
    }
  }
  if (form === 'C') {
    s += LP(p[2], 270, 22);
    s += chg(p[2].x + 20, p[2].y + 22, '−');
  }
  return s;
}

FIGURES.push({
  id: 'dione-anion',
  section: 'alpha-hydrogens',
  anchor: '<h3>Two carbonyls do it again</h3>',
  alt: 'The anion of pentane-2,4-dione as three resonance contributors joined by double-headed arrows. First, the negative charge and a lone pair on the central carbon, with both C=O bonds intact. Second, the charge on the left oxygen, with a C=C between the left carbonyl carbon and the central carbon. Third, the mirror image, with the charge on the right oxygen. In every drawing the five-atom path O–C–C–C–O is highlighted.',
  viewBox: '0 0 760 250',
  build() {
    const cells = [
      ['ON THE CENTRAL CARBON', '', (Q) => dione(Q, 'C')],
      ['ON THE LEFT OXYGEN', '', (Q) => dione(Q, 'L')],
      ['ON THE RIGHT OXYGEN', '', (Q) => dione(Q, 'R')],
    ];
    let s = gridFigure(cells, 3, 228, 204, 32, 0, 8, 8);
    s += resH(240, 264, 110) + resH(500, 524, 110);
    s += tag(380, 238, 'highlighted: the flat O–C–C–C–O path the charge spreads along');
    return s;
  },
  caption: 'Three contributors instead of two, and two of the three put the charge on an oxygen.',
});

/* ======================================================================
   5. Keto and enol: the same atoms, one hydrogen moved.
   ====================================================================== */
function ketoDraw(c) {
  const f = acetoneFrame(c, { aLabel: 'CH₂' });
  const h = armEnd(f.a, 330, 40);
  let s = bond(f.a, h, { rFrom: 19, rTo: 13, cls: 'fg-bond-hi' }) + A(h, 'H', { kind: 'hi' });
  return f.s + s + LP(f.o, 150) + LP(f.o, 30);
}
function enolDraw(c) {
  const f = acetoneFrame(c, { co: 1, ca: 2, aLabel: 'CH₂' });
  const h = armEnd(f.o, 30, 38);
  let s = bond(f.o, h, { rFrom: 15, rTo: 13, cls: 'fg-bond-hi' }) + A(h, 'H', { kind: 'hi' });
  return f.s + s + LP(f.o, 110) + LP(f.o, 195);
}

FIGURES.push({
  id: 'keto-enol-pair',
  section: 'alpha-hydrogens',
  anchor: '<h3>The enol tautomer</h3>',
  alt: 'Acetone and its enol, prop-1-en-2-ol, joined by equilibrium arrows. In acetone one alpha hydrogen is highlighted on the CH2 carbon; in the enol that hydrogen is on the oxygen, the C=O has become C–O and the C–C has become C=C. Under the arrows: keto to enol is about 10 to the 8 to 1.',
  viewBox: '0 0 640 236',
  build() {
    let s = '';
    s += tag(130, 24, 'KETO: acetone') + tag(510, 24, 'ENOL: prop-1-en-2-ol');
    s += ketoDraw(P(120, 124)) + enolDraw(P(500, 124));
    s += eqmH(262, 382, 118);
    s += tag(322, 96, 'acid or base');
    s += tag(322, 146, 'about 10⁸ : 1', { cls: 'fg-tag-warn' });
    s += tag(130, 222, 'H on the α carbon, C=O') + tag(510, 222, 'H on the oxygen, C=C');
    return s;
  },
  caption: 'Follow the highlighted hydrogen: it sits on carbon in the ketone and on oxygen in the enol, and the double bond moves with it.',
});

FIGURES.push({
  id: 'l-keto-enol-pair',
  lessons: ['alpha-hydrogens'],
  alt: 'Acetone above its enol, joined by equilibrium arrows marked about 10 to the 8 to 1. The highlighted hydrogen sits on the alpha carbon in acetone and on the oxygen in the enol.',
  viewBox: '0 0 340 420',
  build() {
    let s = '';
    s += tag(170, 22, 'KETO: acetone');
    s += ketoDraw(P(160, 110));
    s += eqmV(170, 176, 236);
    s += tag(240, 202, 'about 10⁸ : 1', { cls: 'fg-tag-warn' });
    s += tag(104, 202, 'acid or base');
    s += tag(170, 262, 'ENOL: prop-1-en-2-ol');
    s += enolDraw(P(160, 350));
    return s;
  },
  caption: 'The highlighted hydrogen moves from carbon to oxygen, and the double bond moves with it.',
});

/* ======================================================================
   6. Tautomerization in base.
   ====================================================================== */
const baseCells = [
  ['HO⁻ TAKES AN α HYDROGEN', 'an enolate and water', (Q) => {
    const c = Q(78, 112);
    const f = acetoneFrame(c, { aLabel: 'CH₂' });
    const h = armEnd(f.a, 330, 40);
    let s = f.s + bond(f.a, h, { rFrom: 19, rTo: 13 }) + A(h, 'H', { kind: 'hi' });
    s += LP(f.o, 150) + LP(f.o, 30);
    const ho = Q(206, 176);
    s += A(ho, 'HO', { kind: 'hi' }) + LP(ho, 180) + LP(ho, 90) + LP(ho, 270);
    s += chg(ho.x + 20, ho.y - 16, '−');
    // HO⁻ pair -> H; C–H bond -> C–Cα bond; C=O pi -> O
    s += curve(P(ho.x - 25, ho.y - 5), P(h.x + 14, h.y + 5), { bow: -10, size: 7 });
    const bh = mid(f.a, h), bc = mid(c, f.a);
    s += curve(P(bh.x - 5, bh.y + 9), P(bc.x + 1, bc.y + 10), { bow: -14, size: 7 });
    s += piToO(c, f.o);
    return s;
  }],
  ['THE ENOLATE TAKES H⁺ ON O', 'water becomes HO⁻ again', (Q) => {
    const c = Q(70, 128);
    const f = acetoneFrame(c, { co: 1, ca: 2, aLabel: 'CH₂', oKind: 'warn' });
    let s = f.s + LP(f.o, 180) + LP(f.o, 90) + LP(f.o, 0);
    s += chg(f.o.x - 20, f.o.y - 16, '−');
    const hw = Q(144, 60), ow = Q(192, 60), hw2 = Q(192, 106);
    s += B(hw, ow, 'H', 'O') + B(ow, hw2, 'O', 'H');
    s += A(hw, 'H', { kind: 'hi' }) + A(ow, 'O') + A(hw2, 'H');
    s += LP(ow, 90) + LP(ow, 0);
    s += curve(P(f.o.x + 26, f.o.y + 4), P(hw.x - 14, hw.y + 5), { bow: 10, size: 7 });
    const bm = mid(hw, ow);
    s += curve(P(bm.x, bm.y - 5), P(ow.x - 10, ow.y - 14), { bow: -12, size: 7 });
    return s;
  }],
  ['THE ENOL, AND HO⁻ IS BACK', 'base was a catalyst', (Q) => {
    let s = enolDraw(Q(92, 128));
    s += T(Q, 196, 130, '+ HO⁻');
    return s;
  }],
];

FIGURES.push({
  id: 'tautomer-base',
  section: 'alpha-hydrogens',
  anchor: '<h3>The enol tautomer</h3>',
  alt: 'Base-catalyzed enol formation from acetone in three panels. First, a lone pair on hydroxide takes an alpha hydrogen; the C–H bond electrons move into the C–C bond, and the C=O pi electrons move onto oxygen, giving the enolate. Second, a lone pair on the enolate oxygen takes a proton from water, and the O–H bond electrons stay on the water oxygen, which becomes hydroxide. Third, the enol with hydroxide released.',
  viewBox: '0 0 760 220',
  build() { return gridFigure(baseCells, 3, 240, 204, 12, 0, 8, 8); },
  caption: 'In base the proton comes off carbon first and goes onto oxygen second. The middle panel shows the enolate as its charge-on-oxygen contributor.',
});

FIGURES.push({
  id: 'l-tautomer-base',
  lessons: ['alpha-hydrogens'],
  alt: 'Base-catalyzed enol formation from acetone in three stacked panels: hydroxide takes an alpha hydrogen to give the enolate; the enolate oxygen takes a proton from water; the enol forms and hydroxide is released.',
  viewBox: '0 0 340 656',
  build() { return gridFigure(baseCells, 1, 324, 204, 0, 14, 8, 8); },
  caption: 'Off carbon first, onto oxygen second.',
});

/* ======================================================================
   7. Tautomerization in acid.
   ====================================================================== */
const acidCells = [
  ['H₃O⁺ PUTS H⁺ ON THE O', 'a protonated ketone', (Q) => {
    const c = Q(74, 128);
    const f = acetoneFrame(c, { aLabel: 'CH₃' });
    let s = f.s + LP(f.o, 160) + LP(f.o, 45);
    const h = Q(148, 60), ow = Q(198, 60);
    s += B(h, ow, 'H', 'OH₂') + A(h, 'H', { kind: 'hi' }) + A(ow, 'OH₂');
    s += chg(ow.x + 22, ow.y - 16, '+');
    const lp = armEnd(f.o, 45, 21);
    s += curve(P(lp.x + 6, lp.y - 4), P(h.x - 13, h.y - 4), { bow: -12, size: 7 });
    const bm = mid(h, ow);
    s += curve(P(bm.x, bm.y - 5), P(ow.x - 12, ow.y - 16), { bow: -12, size: 7 });
    return s;
  }],
  ['WATER TAKES AN α HYDROGEN', 'no anion ever forms', (Q) => {
    const c = Q(72, 116);
    const f = acetoneFrame(c, { aLabel: 'CH₂', oKind: 'warn' });
    const ho = armEnd(f.o, 30, 38);
    let s = f.s + bond(f.o, ho, { rFrom: 15, rTo: 13 }) + A(ho, 'H');
    s += LP(f.o, 150);
    s += chg(f.o.x - 22, f.o.y + 14, '+');
    const h = armEnd(f.a, 330, 40);
    s += bond(f.a, h, { rFrom: 19, rTo: 13 }) + A(h, 'H', { kind: 'hi' });
    const w = Q(206, 170);
    s += A(w, 'H₂O', { kind: 'hi' }) + LP(w, 180, 24) + LP(w, 90, 24);
    s += curve(P(w.x - 27, w.y - 4), P(h.x + 14, h.y + 5), { bow: -10, size: 7 });
    const bh = mid(f.a, h), bc = mid(c, f.a);
    s += curve(P(bh.x - 5, bh.y + 9), P(bc.x + 1, bc.y + 10), { bow: -14, size: 7 });
    s += piToO(c, f.o);
    return s;
  }],
  ['THE ENOL, AND H₃O⁺ IS BACK', 'acid was a catalyst', (Q) => {
    let s = enolDraw(Q(92, 128));
    s += T(Q, 194, 130, '+ H₃O⁺');
    return s;
  }],
];

FIGURES.push({
  id: 'tautomer-acid',
  section: 'alpha-hydrogens',
  anchor: '<h3>The enol tautomer</h3>',
  alt: 'Acid-catalyzed enol formation from acetone in three panels. First, a lone pair on the carbonyl oxygen takes a proton from hydronium, and the H–O bond electrons stay on the water. Second, in the protonated ketone, a water molecule takes an alpha hydrogen; the C–H bond electrons move into the C–C bond and the C=O pi electrons move onto the positive oxygen. Third, the enol with hydronium released.',
  viewBox: '0 0 760 220',
  build() { return gridFigure(acidCells, 3, 240, 204, 12, 0, 8, 8); },
  caption: 'In acid the proton goes onto oxygen first and comes off carbon second: the reverse order of the base route.',
});

FIGURES.push({
  id: 'l-tautomer-acid',
  lessons: ['alpha-hydrogens'],
  alt: 'Acid-catalyzed enol formation from acetone in three stacked panels: the carbonyl oxygen takes a proton from hydronium; water takes an alpha hydrogen as the C=C forms and the pi electrons move onto the positive oxygen; the enol forms and hydronium is released.',
  viewBox: '0 0 340 656',
  build() { return gridFigure(acidCells, 1, 324, 204, 0, 14, 8, 8); },
  caption: 'Onto oxygen first, off carbon second.',
});

/* ======================================================================
   8. Racemization through the flat enolate.
   ====================================================================== */
/* (R)- or (S)-3-phenylbutan-2-one. The stereocenter s has the acetyl group
   to its left, C6H5 up-right, and CH3 and H toward the viewer or away.
   Priorities: C(=O)CH3 > C6H5 > CH3 > H. With H hashed (away), the order
   left -> up-right -> down-right runs clockwise: R. */
function chiralKetone(Q, hFront) {
  const st = Q(136, 118);
  const k = Q(84, 118), o = Q(84, 66), m = armEnd(k, 210, 50);
  const ph = armEnd(st, 60, 54), me = armEnd(st, 330, 50), h = armEnd(st, 250, 44);
  let s = '';
  s += B(k, st, 'C', 'C') + B(k, o, 'C', 'O', { order: 2 }) + B(k, m, 'C', 'CH₃');
  s += B(st, ph, 'C', 'C₆H₅');
  s += hFront ? wedge(st, h, { rFrom: 16, rTo: 13 }) + hash(st, me, { rFrom: 16, rTo: 19 })
              : hash(st, h, { rFrom: 16, rTo: 13 }) + wedge(st, me, { rFrom: 16, rTo: 19 });
  s += A(o, 'O') + LP(o, 150) + LP(o, 30) + A(k, 'C') + A(m, 'CH₃');
  s += A(ph, 'C₆H₅') + A(me, 'CH₃') + A(h, 'H', { kind: 'hi' }) + A(st, 'C', { kind: 'warn' });
  return s;
}

const racCells = [
  ['THE α CARBON IS THE STEREOCENTER', '(R)-3-phenylbutan-2-one', (Q) => chiralKetone(Q, false)],
  ['BASE TAKES THE α H: A FLAT ENOLATE', 'sp²: no front or back left', (Q) => {
    const st = Q(136, 118), k = Q(84, 118), o = Q(84, 66), m = armEnd(k, 210, 50);
    const ph = armEnd(st, 60, 54), me = armEnd(st, 300, 50);
    let s = '';
    s += B(k, st, 'C', 'C', { order: 2 }) + B(k, o, 'C', 'O') + B(k, m, 'C', 'CH₃');
    s += B(st, ph, 'C', 'C₆H₅') + B(st, me, 'C', 'CH₃');
    s += A(o, 'O', { kind: 'warn' }) + LP(o, 180) + LP(o, 90) + LP(o, 0);
    s += chg(o.x - 20, o.y - 16, '−');
    s += A(k, 'C') + A(m, 'CH₃') + A(ph, 'C₆H₅') + A(me, 'CH₃') + A(st, 'C', { kind: 'warn' });
    return s;
  }],
  ['H⁺ RETURNS FROM THE BACK', '(R), 50%', (Q) => chiralKetone(Q, false)],
  ['H⁺ RETURNS FROM THE FRONT', '(S), 50%', (Q) => chiralKetone(Q, true)],
];

FIGURES.push({
  id: 'racemization',
  section: 'alpha-hydrogens',
  anchor: '<h3>What enolates do</h3>',
  alt: 'Racemization of (R)-3-phenylbutan-2-one in four panels. First, the ketone, whose stereocenter is the alpha carbon, bearing an acetyl group, a phenyl group (C6H5), a methyl on a wedge and a hydrogen on a hash. Second, the enolate after base removes that hydrogen: the former stereocenter is now an sp2 carbon in a C=C, drawn flat, with the charge on oxygen. Third, a proton returns from the back, giving back the (R) ketone, 50%. Fourth, a proton returns from the front, putting the hydrogen on a wedge and the methyl on a hash, giving the (S) ketone, 50%.',
  viewBox: '0 0 760 440',
  build() { return gridFigure(racCells, 2, 364, 204, 16, 16, 8, 8, [null, null, 'good', 'good']); },
  caption: 'The top row loses the stereocenter; the bottom row shows the two ways the proton can come back. Equal amounts of each give a racemic mixture.',
});

export default FIGURES;
