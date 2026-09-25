/* Figures for the alpha-halogenation notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every mechanism here runs on acetophenone, C6H5COCH3, drawn with labelled
   atoms the way the alpha-hydrogens page draws acetone: the carbonyl carbon
   c, the oxygen straight up, the C6H5 group down-left and the alpha carbon
   down-right. Enol formation in acid uses the same two arrows that page
   uses (H3O+ puts H+ on O; water takes the alpha H). Most figures are
   "cells": one step, drawn in a box. The notes lay cells side by side; a
   lesson copy (id prefix l-) stacks the same cells at 340 wide.

   Angles: armEnd() and a group's `deg` are counterclockwise from east, as on
   paper. lonePair() takes the SVG angle (clockwise), so LP() converts. */
import { atom, bond, arrow, curve, lonePair, text, tag, panel, rule, P } from '../lib/ochem-figure.mjs';
import { ringDouble } from '../lib/ochem-skeletal.mjs';
import { armEnd } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */

function cell(ox, oy, w, h, title, foot, draw, opts = {}) {
  const dx = ox + (w - (opts.cw || 240)) / 2;
  const Q = (x, y) => P(dx + x, oy + y);
  let s = panel(ox, oy, w, h, opts.kind ? { kind: opts.kind } : {});
  s += tag(ox + w / 2, oy + 22, title);
  if (foot) s += text(ox + w / 2, oy + h - 14, foot, { cls: opts.footCls || 'fg-tag-good', size: 11 });
  s += draw(Q);
  return s;
}

function gridFigure(cells, cols, w, h, gapX = 12, gapY = 14, x0 = 8, y0 = 8, kinds = []) {
  let s = '';
  cells.forEach(([title, foot, draw, footCls], i) => {
    const col = i % cols, row = Math.floor(i / cols);
    s += cell(x0 + col * (w + gapX), y0 + row * (h + gapY), w, h, title, foot, draw, { kind: kinds[i] || null, footCls });
  });
  return s;
}

const T = (p, s, o = {}) => text(p.x, p.y, s, { cls: 'fg-lbl', size: 13, ...o });
const chg = (x, y, s) => text(x, y, s, { cls: 'fg-warn', size: 15 });

const rOf = (l) => (l.length >= 5 ? 23 : l.length >= 3 ? 19 : l.length === 2 ? 16 : l === 'H' ? 13 : 15);
const A = (p, l, o = {}) => atom(p.x, p.y, l, { r: rOf(l), ...o });
const B = (a, b, la, lb, o = {}) => bond(a, b, { rFrom: rOf(la), rTo: rOf(lb), ...o });
const LP = (p, deg, d = 21) => lonePair(p.x, p.y, -deg, { dist: d });
const mid = (a, b, ox = 0, oy = 0) => P((a.x + b.x) / 2 + ox, (a.y + b.y) / 2 + oy);

/* The acetophenone frame. co: order of C–O; ca: order of C–Cα. */
function ketFrame(c, { co = 2, ca = 1, oLabel = 'O', mLabel = 'C₆H₅', aLabel = 'CH₃', aKind, oKind } = {}) {
  const o = armEnd(c, 90, 52), m = armEnd(c, 210, 54), a = armEnd(c, 330, 56);
  let s = '';
  s += bond(c, o, { rFrom: 15, rTo: rOf(oLabel), order: co });
  s += bond(c, m, { rFrom: 15, rTo: rOf(mLabel) });
  s += bond(c, a, { rFrom: 15, rTo: rOf(aLabel), order: ca });
  s += A(o, oLabel, { kind: oKind }) + A(m, mLabel) + A(a, aLabel, { kind: aKind }) + A(c, 'C');
  return { s, o, m, a };
}

/* The pi electrons of the vertical C=O moving up onto the oxygen. */
const piToO = (c, o) => curve(P(c.x + 9, c.y - 26), P(o.x + 16, o.y + 8), { bow: 11, size: 7 });
/* A lone pair on the oxygen (the one at 200°) coming down into the C–O bond. */
const lpToCO = (c, o) => curve(P(o.x - 24, o.y + 12), P(c.x - 7, c.y - 24), { bow: 9, size: 7 });

/* Br–Br up and to the right of the alpha carbon a, with the three arrows of
   an enol or enolate attacking it: the O pair into C–O, the C=C pi bond to
   the near Br, and the Br–Br bond onto the far Br. */
function attackBr2(c, f, oPairFrom) {
  const br1 = P(f.a.x + 38, f.a.y - 50), br2 = P(f.a.x + 84, f.a.y - 76);
  let s = B(br1, br2, 'Br', 'Br') + A(br1, 'Br', { kind: 'hi' }) + A(br2, 'Br');
  s += curve(oPairFrom, P(c.x - 7, c.y - 24), { bow: 9, size: 7 });
  const bm = mid(c, f.a);
  s += curve(P(bm.x + 4, bm.y - 9), P(br1.x - 12, br1.y + 10), { bow: -12, size: 7 });
  const bb = mid(br1, br2);
  s += curve(P(bb.x + 5, bb.y + 7), P(br2.x + 4, br2.y + 16), { bow: 10, size: 7 });
  return s;
}

/* ======================================================================
   1. Acid route: enol formation (as on the alpha-hydrogens page), then the
      enol attacks Br2 and water takes the proton off oxygen.
   ====================================================================== */
const acidEnolCells = [
  ['H₃O⁺ PUTS H⁺ ON THE O', 'a protonated ketone', (Q) => {
    const c = Q(72, 124);
    const f = ketFrame(c);
    let s = f.s + LP(f.o, 160) + LP(f.o, 45);
    const h = Q(146, 58), ow = Q(198, 58);
    s += B(h, ow, 'H', 'OH₂') + A(h, 'H', { kind: 'hi' }) + A(ow, 'OH₂');
    s += chg(ow.x + 22, ow.y - 16, '+');
    const lp = armEnd(f.o, 45, 21);
    s += curve(P(lp.x + 6, lp.y - 4), P(h.x - 13, h.y - 4), { bow: -12, size: 7 });
    const bm = mid(h, ow);
    s += curve(P(bm.x, bm.y - 5), P(ow.x - 12, ow.y - 16), { bow: -12, size: 7 });
    return s;
  }],
  ['WATER TAKES AN α H: SLOW STEP', 'the rate-limiting step', (Q) => {
    const c = Q(66, 114);
    const f = ketFrame(c, { aLabel: 'CH₂', oKind: 'warn' });
    const ho = armEnd(f.o, 30, 38);
    let s = f.s + bond(f.o, ho, { rFrom: 15, rTo: 13 }) + A(ho, 'H');
    s += LP(f.o, 150);
    s += chg(f.o.x - 22, f.o.y + 14, '+');
    const h = armEnd(f.a, 0, 40);
    s += bond(f.a, h, { rFrom: 16, rTo: 13 }) + A(h, 'H', { kind: 'hi' });
    const w = Q(214, 120);
    s += A(w, 'H₂O', { kind: 'hi' }) + LP(w, 200, 24) + LP(w, 90, 24);
    const lp = armEnd(w, 200, 24);
    s += curve(P(lp.x - 6, lp.y + 3), P(h.x + 13, h.y - 3), { bow: -10, size: 7 });
    const bh = mid(f.a, h), bc = mid(c, f.a);
    s += curve(P(bh.x - 5, bh.y + 9), P(bc.x, bc.y + 6), { bow: -14, size: 7 });
    s += piToO(c, f.o);
    return s;
  }, 'fg-tag-warn'],
  ['THE ENOL, AND H₃O⁺ IS BACK', 'a neutral nucleophile', (Q) => {
    const c = Q(80, 124);
    const f = ketFrame(c, { co: 1, ca: 2, aLabel: 'CH₂' });
    const h = armEnd(f.o, 30, 38);
    let s = f.s + bond(f.o, h, { rFrom: 15, rTo: 13 }) + A(h, 'H') + LP(f.o, 110) + LP(f.o, 195);
    s += T(Q(196, 128), '+ H₃O⁺');
    return s;
  }],
];

const acidBromCells = [
  ['THE ENOL C=C ATTACKS Br₂', 'Br⁻ leaves', (Q) => {
    const c = Q(64, 126);
    const f = ketFrame(c, { co: 1, ca: 2, aLabel: 'CH₂' });
    const h = armEnd(f.o, 30, 38);
    let s = f.s + bond(f.o, h, { rFrom: 15, rTo: 13 }) + A(h, 'H') + LP(f.o, 110) + LP(f.o, 200);
    const lp = armEnd(f.o, 200, 21);
    s += attackBr2(c, f, P(lp.x - 3, lp.y + 7));
    return s;
  }],
  ['WATER TAKES THE H OFF O', 'no second enol yet', (Q) => {
    const c = Q(64, 128);
    const f = ketFrame(c, { aLabel: 'CH₂Br', aKind: 'hi', oKind: 'warn' });
    const h = armEnd(f.o, 30, 38);
    let s = f.s + bond(f.o, h, { rFrom: 15, rTo: 13 }) + A(h, 'H', { kind: 'hi' }) + LP(f.o, 150);
    s += chg(f.o.x - 22, f.o.y + 14, '+');
    const w = Q(190, 58);
    s += A(w, 'H₂O') + LP(w, 90, 24) + LP(w, 200, 24);
    const lp = armEnd(w, 200, 24);
    s += curve(P(lp.x - 7, lp.y + 2), P(h.x + 13, h.y + 1), { bow: 8, size: 7 });
    const bm = mid(f.o, h);
    s += curve(P(bm.x - 2, bm.y + 8), P(f.o.x + 10, f.o.y + 16), { bow: -8, size: 7 });
    return s;
  }],
  ['ONE Br ON, AND IT STOPS', 'H₃O⁺ + Br⁻ (HBr) as well', (Q) => {
    const c = Q(88, 124);
    const f = ketFrame(c, { aLabel: 'CH₂Br', aKind: 'hi' });
    let s = f.s + LP(f.o, 150) + LP(f.o, 30);
    return s;
  }],
];

FIGURES.push({
  id: 'acid-bromination',
  section: 'alpha-halogenation',
  anchor: '<h3>Acid: through the enol, and it stops</h3>',
  alt: 'Acid-catalyzed bromination of acetophenone in six panels. Top row, enol formation: a lone pair on the carbonyl oxygen takes a proton from hydronium; then water takes an alpha hydrogen, the C–H bond electrons form the C=C and the C=O pi electrons move onto the positive oxygen, the slow step; then the enol, with hydronium back. Bottom row: a lone pair on the enol oxygen moves into the C–O bond, the C=C pi electrons attack the near bromine of Br2, and the Br–Br bond electrons leave on the far bromine as bromide; then water takes the proton off the positive oxygen; the product is alpha-bromoacetophenone, C6H5COCH2Br, with hydronium and bromide.',
  viewBox: '0 0 776 436',
  build() { return gridFigure([...acidEnolCells, ...acidBromCells], 3, 244, 204, 12, 12, 8, 8, [null, 'warn', null, null, null, 'good']); },
  caption: 'Top row: making the enol. Bottom row: the enol meets Br₂. The highlighted Br is the one that stays on the α carbon.',
});

FIGURES.push({
  id: 'l-acid-bromination',
  lessons: ['alpha-halogenation'],
  alt: 'Acid-catalyzed bromination in three stacked panels: the enol C=C attacks Br2 as the oxygen lone pair moves into the C–O bond and bromide leaves; water takes the proton off the positive oxygen; alpha-bromoacetophenone forms.',
  viewBox: '0 0 340 656',
  build() { return gridFigure(acidBromCells, 1, 324, 204, 0, 14, 8, 8, [null, null, 'good']); },
  caption: 'The enol attacks Br₂ with its C=C. The oxygen pair makes up for the lost C=C.',
});

/* ======================================================================
   2. Base route: HO- makes the enolate, the enolate attacks Br2.
   ====================================================================== */
const baseCells = [
  ['HO⁻ TAKES AN α HYDROGEN', 'the enolate forms', (Q) => {
    const c = Q(66, 114);
    const f = ketFrame(c, { aLabel: 'CH₂' });
    const h = armEnd(f.a, 0, 40);
    let s = f.s + bond(f.a, h, { rFrom: 16, rTo: 13 }) + A(h, 'H', { kind: 'hi' });
    s += LP(f.o, 150) + LP(f.o, 30);
    const ho = Q(214, 118);
    s += A(ho, 'HO', { kind: 'hi' }) + LP(ho, 200) + LP(ho, 90) + LP(ho, 320);
    s += chg(ho.x + 22, ho.y - 14, '−');
    const lp = armEnd(ho, 200, 21);
    s += curve(P(lp.x - 6, lp.y + 3), P(h.x + 13, h.y - 3), { bow: -10, size: 7 });
    const bh = mid(f.a, h), bc = mid(c, f.a);
    s += curve(P(bh.x - 5, bh.y + 9), P(bc.x, bc.y + 6), { bow: -14, size: 7 });
    s += piToO(c, f.o);
    return s;
  }],
  ['THE ENOLATE ATTACKS Br₂', 'Br⁻ leaves', (Q) => {
    const c = Q(64, 126);
    const f = ketFrame(c, { co: 1, ca: 2, aLabel: 'CH₂', oKind: 'warn' });
    let s = f.s + LP(f.o, 90) + LP(f.o, 0) + LP(f.o, 200);
    s += chg(f.o.x + 18, f.o.y - 20, '−');
    const lp = armEnd(f.o, 200, 21);
    s += attackBr2(c, f, P(lp.x - 3, lp.y + 7));
    return s;
  }],
  ['ONE Br ON, AND IT GOES ON', 'the next α H comes off faster', (Q) => {
    const c = Q(88, 124);
    const f = ketFrame(c, { aLabel: 'CH₂Br', aKind: 'hi' });
    return f.s + LP(f.o, 150) + LP(f.o, 30) + T(Q(208, 70), '+ Br⁻');
  }, 'fg-tag-warn'],
];

FIGURES.push({
  id: 'base-bromination',
  section: 'alpha-halogenation',
  anchor: '<h3>Base: through the enolate, and it runs away</h3>',
  alt: 'Base-promoted bromination of acetophenone in three panels. First, a lone pair on hydroxide takes an alpha hydrogen; the C–H bond electrons form the C=C and the C=O pi electrons move onto oxygen, giving the enolate. Second, a lone pair on the negative enolate oxygen moves into the C–O bond, the C=C pi electrons attack the near bromine of Br2, and the Br–Br bond electrons leave on the far bromine as bromide. Third, alpha-bromoacetophenone and bromide; its next alpha hydrogen comes off faster.',
  viewBox: '0 0 776 220',
  build() { return gridFigure(baseCells, 3, 244, 204, 12, 0, 8, 8, [null, null, 'warn']); },
  caption: 'Compare the middle panel with the acid route’s: the same three arrows, but the oxygen starts with a negative charge instead of an H.',
});

FIGURES.push({
  id: 'l-base-bromination',
  lessons: ['alpha-halogenation'],
  alt: 'Base-promoted bromination in three stacked panels: hydroxide takes an alpha hydrogen to give the enolate; the enolate attacks Br2 and bromide leaves; alpha-bromoacetophenone forms, and its next alpha hydrogen comes off faster.',
  viewBox: '0 0 340 656',
  build() { return gridFigure(baseCells, 1, 324, 204, 0, 14, 8, 8, [null, null, 'warn']); },
  caption: 'Hydroxide is used up here: it leaves as water, and nothing hands it back.',
});

/* ======================================================================
   3. One substituent effect read two ways, drawn on the product itself.
   ====================================================================== */
function bromoKetone(c) {
  const f = ketFrame(c, { aLabel: 'C' });
  const br = armEnd(f.a, 270, 46), h1 = armEnd(f.a, 20, 40), h2 = armEnd(f.a, 330, 40);
  let s = f.s + LP(f.o, 150) + LP(f.o, 30);
  s += B(f.a, br, 'C', 'Br') + A(br, 'Br', { kind: 'hi' });
  s += B(f.a, h1, 'C', 'H') + A(h1, 'H', { kind: 'warn' });
  s += B(f.a, h2, 'C', 'H') + A(h2, 'H', { kind: 'warn' });
  return { s, o: f.o, a: f.a, br, h1, h2 };
}

function effectBox(x, y, w, kind, lines) {
  let s = panel(x, y, w, 26 + lines.length * 22, { kind });
  lines.forEach(([t, cls], i) => { s += text(x + w / 2, y + 22 + i * 22, t, { cls, size: cls === 'fg-lbl' ? 13 : 11 }); });
  return s;
}
const ACID_LINES = [
  ['ACID needs the O to take H⁺', 'fg-lbl'],
  ['Br pulls electrons away from O', 'fg-tag'],
  ['O is a weaker base', 'fg-tag'],
  ['2nd enol forms more slowly: STOPS', 'fg-tag-good'],
];
const BASE_LINES = [
  ['BASE needs to take an α H', 'fg-lbl'],
  ['Br helps hold the − charge', 'fg-tag'],
  ['α H is more acidic', 'fg-tag'],
  ['2nd enolate forms faster: GOES ON', 'fg-tag-warn'],
];

FIGURES.push({
  id: 'one-effect-two-ways',
  section: 'alpha-halogenation',
  anchor: '<h3>Base: through the enolate, and it runs away</h3>',
  alt: 'Alpha-bromoacetophenone drawn with its alpha carbon carrying a bromine and two hydrogens. A box on the left points to the carbonyl oxygen: acid needs the oxygen to take a proton, the bromine pulls electrons away from it, so it is a weaker base and the second enol forms more slowly, so acid stops. A box on the right points to the two remaining alpha hydrogens: base needs to take one, the bromine helps hold the negative charge, so they are more acidic and the second enolate forms faster, so base goes on.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    const k = bromoKetone(P(384, 118));
    s += k.s;
    s += effectBox(10, 20, 250, null, ACID_LINES);
    s += effectBox(500, 120, 250, 'warn', BASE_LINES);
    s += arrow(P(262, 50), P(k.o.x - 22, k.o.y - 4), { muted: true, size: 7 });
    s += arrow(P(498, 150), P(k.h1.x + 16, k.h1.y + 2), { muted: true, size: 7 });
    s += tag(250, 236, 'the same Br, the same pull on electrons');
    return s;
  },
  caption: 'Left box: what the acid route needs, at the oxygen. Right box: what the base route needs, at the two remaining α hydrogens.',
});

FIGURES.push({
  id: 'l-one-effect-two-ways',
  lessons: ['alpha-halogenation'],
  alt: 'Alpha-bromoacetophenone with its bromine and two remaining alpha hydrogens, above two boxes. Acid box: acid needs the oxygen to take a proton; bromine pulls electrons from it; it is a weaker base; the second enol forms more slowly; stops. Base box: base needs to take an alpha hydrogen; bromine helps hold the negative charge; the hydrogen is more acidic; the second enolate forms faster; goes on.',
  viewBox: '0 0 340 470',
  build() {
    let s = '';
    const k = bromoKetone(P(150, 96));
    s += k.s;
    s += effectBox(20, 200, 300, null, ACID_LINES);
    s += effectBox(20, 332, 300, 'warn', BASE_LINES);
    return s;
  },
  caption: 'Same bromine in both boxes. The acid box is about the O; the base box is about the two α H.',
});

/* ======================================================================
   4. Which alpha carbon: 2-methylcyclohexanone, skeletal.
   ====================================================================== */
/* Ring: C1 at the top, C2 upper right, then clockwise; C6 upper left.
   mode: 'ketone' | 'enol' (C1=C2, OH) | 'enolate' (C1=C6, O-)
   br: where a Br sits ('C2' | 'C6' | null). */
function methylCyclo(cx, cy, mode, br) {
  const R = 30;
  const pts = [90, 30, -30, -90, -150, 150].map((d) => armEnd(P(cx, cy), d, R));
  const [c1, c2, c3, c4, c5, c6] = pts;
  const ctr = P(cx, cy);
  let s = '';
  const ringBond = (a, b, dbl) => (dbl ? ringDouble(a, b, ctr, { inset: 6, gap: 4.6 }) : bond(a, b, { rFrom: 0, rTo: 0 }));
  s += ringBond(c1, c2, mode === 'enol');
  s += ringBond(c2, c3) + ringBond(c3, c4) + ringBond(c4, c5) + ringBond(c5, c6);
  s += ringBond(c6, c1, mode === 'enolate');
  const o = armEnd(c1, 90, 32);
  const oLab = mode === 'enol' ? 'OH' : 'O';
  s += bond(c1, o, { rFrom: 0, rTo: rOf(oLab), order: mode === 'ketone' ? 2 : 1 });
  s += A(o, oLab, { kind: mode === 'enolate' ? 'warn' : undefined });
  if (mode === 'enolate') s += chg(o.x + 20, o.y - 12, '−');
  const me = armEnd(c2, 30, 32);
  s += bond(c2, me, { rFrom: 0, rTo: 19 }) + A(me, 'CH₃');
  if (br === 'C2') { const b = armEnd(c2, -40, 34); s += bond(c2, b, { rFrom: 0, rTo: 16 }) + A(b, 'Br', { kind: 'hi' }); }
  if (br === 'C6') { const b = armEnd(c6, 150, 34); s += bond(c6, b, { rFrom: 0, rTo: 16 }) + A(b, 'Br', { kind: 'hi' }); }
  return { s, c1, c2, c6 };
}

FIGURES.push({
  id: 'regio-methylcyclohexanone',
  section: 'alpha-halogenation',
  anchor: '<h3>Which &alpha; carbon takes the halogen?</h3>',
  alt: 'Two rows starting from 2-methylcyclohexanone. Acid row: the more substituted enol, with the C=C between C1 and C2, the carbon that carries the methyl; with Br2 it gives 2-bromo-2-methylcyclohexanone, bromine on the methyl-bearing carbon. Base row: the enolate with its C=C between C1 and C6, the less substituted alpha carbon; with one equivalent of Br2 it gives 2-bromo-6-methylcyclohexanone, bromine on the far side from the methyl.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    const row = (y, kind, title, mode, reagent1, mid, br, prod, midTag) => {
      s += panel(8, y, 744, 150, { kind });
      s += tag(24, y + 80, title, { anchor: 'start' });
      const k = methylCyclo(130, y + 92, 'ketone', null); s += k.s;
      s += arrow(P(186, y + 92), P(266, y + 92)); s += tag(226, y + 80, reagent1);
      const m = methylCyclo(350, y + 92, mode, null); s += m.s;
      s += tag(350, y + 142, midTag);
      s += arrow(P(420, y + 92), P(510, y + 92)); s += tag(465, y + 80, 'Br₂');
      const p = methylCyclo(600, y + 92, 'ketone', br); s += p.s;
      s += tag(600, y + 142, prod, { cls: 'fg-tag-good' });
    };
    row(8, null, 'ACID', 'enol', 'H₃O⁺', null, 'C2', '2-bromo-2-methylcyclohexanone', 'more substituted enol');
    row(170, 'warn', 'BASE', 'enolate', 'HO⁻', null, 'C6', '2-bromo-6-methylcyclohexanone', 'less substituted enolate');
    return s;
  },
  caption: 'Follow the C=C in the middle column: it points to the carbon that ends up with the Br.',
});

/* ======================================================================
   5. The haloform reaction: three brominations, then cleavage.
   ====================================================================== */
const BUILD = [['CH₃', 'slowest'], ['CH₂Br', 'faster'], ['CHBr₂', 'faster still'], ['CBr₃', '']];

FIGURES.push({
  id: 'haloform-buildup',
  section: 'alpha-halogenation',
  anchor: '<h3>The haloform reaction</h3>',
  alt: 'Acetophenone brominated three times on its methyl carbon under base: CH3, then CH2Br, then CHBr2, then CBr3. Each arrow is one round of hydroxide taking an alpha hydrogen and the enolate attacking Br2, and each round is faster than the one before.',
  viewBox: '0 0 760 200',
  build() {
    let s = tag(380, 22, 'each arrow: HO⁻ takes an α H, then the enolate attacks Br₂');
    BUILD.forEach(([lab, speed], i) => {
      const c = P(72 + i * 196, 108);
      const f = ketFrame(c, { aLabel: lab, aKind: i ? 'hi' : undefined });
      s += f.s + LP(f.o, 150) + LP(f.o, 30);
      if (i < 3) {
        s += arrow(P(c.x + 90, 108), P(c.x + 138, 108));
        s += tag(c.x + 114, 132, speed, { cls: i ? 'fg-tag-warn' : 'fg-tag' });
      }
    });
    return s;
  },
  caption: 'Only the methyl carbon changes. The Br already there makes each next α H easier to remove.',
});

FIGURES.push({
  id: 'l-haloform-buildup',
  lessons: ['alpha-halogenation'],
  alt: 'Acetophenone brominated three times on its methyl carbon, stacked: CH3, then CH2Br, then CHBr2, then CBr3, each round faster than the last.',
  viewBox: '0 0 340 560',
  build() {
    let s = tag(170, 20, 'each arrow: HO⁻, then Br₂');
    BUILD.forEach(([lab, speed], i) => {
      const c = P(120, 110 + i * 130);
      const f = ketFrame(c, { aLabel: lab, aKind: i ? 'hi' : undefined });
      s += f.s + LP(f.o, 150) + LP(f.o, 30);
      if (i < 3) {
        s += arrow(P(232, c.y + 30), P(232, c.y + 90));
        s += tag(244, c.y + 64, speed, { anchor: 'start', cls: i ? 'fg-tag-warn' : 'fg-tag' });
      }
    });
    return s;
  },
  caption: 'Only the methyl carbon changes, and each round is faster than the last.',
});

const cleaveCells = [
  ['HO⁻ ADDS TO THE C=O', 'a tetrahedral intermediate forms', (Q) => {
    const c = Q(80, 126);
    const f = ketFrame(c, { aLabel: 'CBr₃', aKind: 'hi' });
    let s = f.s + LP(f.o, 150) + LP(f.o, 30);
    const ho = Q(176, 66);
    s += A(ho, 'HO', { kind: 'hi' }) + LP(ho, 90) + LP(ho, 0) + LP(ho, 250);
    s += chg(ho.x + 22, ho.y - 16, '−');
    const lp = armEnd(ho, 250, 21);
    s += curve(P(lp.x - 4, lp.y + 6), P(c.x + 16, c.y - 8), { bow: -14, size: 7 });
    s += curve(P(c.x - 9, c.y - 26), P(f.o.x - 16, f.o.y + 8), { bow: -11, size: 7 });
    return s;
  }],
  ['THE C=O COMES BACK; ⁻CBr₃ LEAVES', 'the C–CBr₃ bond breaks', (Q) => {
    const c = Q(96, 118);
    const o = armEnd(c, 90, 50), m = armEnd(c, 200, 56), oh = armEnd(c, 250, 50), a = armEnd(c, 330, 58);
    let s = '';
    s += B(c, o, 'C', 'O') + B(c, m, 'C', 'C₆H₅') + B(c, oh, 'C', 'OH') + bond(c, a, { rFrom: 15, rTo: 19, cls: 'fg-bond-hi' });
    s += A(o, 'O', { kind: 'warn' }) + LP(o, 180) + LP(o, 90) + LP(o, 0);
    s += chg(o.x - 20, o.y - 16, '−');
    s += A(m, 'C₆H₅') + A(oh, 'OH') + A(a, 'CBr₃', { kind: 'hi' }) + A(c, 'C');
    s += curve(P(o.x + 23, o.y + 7), P(c.x + 7, c.y - 22), { bow: -12, size: 7 });
    const bm = mid(c, a);
    s += curve(P(bm.x + 3, bm.y - 9), P(a.x - 4, a.y - 20), { bow: -14, size: 7 });
    return s;
  }],
  ['⁻CBr₃ TAKES THE ACID’S H', 'a fast proton transfer', (Q) => {
    const c = Q(64, 118);
    const f = ketFrame(c, { aLabel: 'O' });
    const h = armEnd(f.a, 30, 48);
    let s = f.s + LP(f.o, 150) + LP(f.o, 30) + LP(f.a, 270, 20) + LP(f.a, 190, 20);
    s += bond(f.a, h, { rFrom: 15, rTo: 13 }) + A(h, 'H', { kind: 'hi' });
    const cb = Q(196, 148);
    s += A(cb, 'CBr₃', { kind: 'warn' }) + LP(cb, 110, 23);
    s += chg(cb.x + 22, cb.y + 22, '−');
    const lp = armEnd(cb, 110, 23);
    s += curve(P(lp.x - 5, lp.y - 5), P(h.x + 12, h.y + 6), { bow: 10, size: 7 });
    const bm = mid(f.a, h);
    s += curve(P(bm.x - 3, bm.y - 8), P(f.a.x + 4, f.a.y - 17), { bow: -8, size: 7 });
    return s;
  }],
  ['BENZOATE AND BROMOFORM', 'acidify to get benzoic acid', (Q) => {
    const c = Q(70, 124);
    const f = ketFrame(c, { aLabel: 'O', aKind: 'warn' });
    let s = f.s + LP(f.o, 150) + LP(f.o, 30) + LP(f.a, 270, 20) + LP(f.a, 0, 20) + LP(f.a, 200, 20);
    s += chg(f.a.x + 18, f.a.y - 18, '−');
    s += T(Q(188, 124), '+ CHBr₃');
    return s;
  }],
];

FIGURES.push({
  id: 'haloform-cleavage',
  section: 'alpha-halogenation',
  anchor: '<h3>The haloform reaction</h3>',
  alt: 'Haloform cleavage of C6H5COCBr3 in four panels. First, a lone pair on hydroxide attacks the carbonyl carbon and the C=O pi electrons move onto oxygen. Second, in the tetrahedral intermediate, a lone pair on the negative oxygen reforms the C=O and the C–CBr3 bond electrons leave with the CBr3 group as the tribromomethyl anion. Third, a lone pair on that anion takes the proton from benzoic acid, and the O–H bond electrons stay on oxygen. Fourth, benzoate and bromoform, CHBr3.',
  viewBox: '0 0 760 436',
  build() { return gridFigure(cleaveCells, 2, 366, 204, 12, 12, 8, 8, [null, 'warn', null, 'good']); },
  caption: 'Top right: the highlighted C–CBr₃ bond is the one that breaks. Its two electrons leave with the CBr₃.',
});

FIGURES.push({
  id: 'l-haloform-cleavage',
  lessons: ['alpha-halogenation'],
  alt: 'Haloform cleavage in three stacked panels: hydroxide adds to the carbonyl carbon of C6H5COCBr3; the tetrahedral intermediate reforms the C=O and expels the tribromomethyl anion; that anion takes the acid proton, giving benzoate and CHBr3.',
  viewBox: '0 0 340 656',
  build() { return gridFigure(cleaveCells.slice(0, 3), 1, 324, 204, 0, 14, 8, 8, [null, 'warn', null]); },
  caption: 'Middle panel: the highlighted C–CBr₃ bond breaks. Last panel: the leaving group takes a proton and becomes CHBr₃.',
});

/* ======================================================================
   6. Which compounds pass the iodoform test.
   ====================================================================== */
/* Butan-2-one with labelled atoms: C1 methyl, C2 carbonyl, C3, C4. */
function butanone(c, verdict) {
  const o = armEnd(c, 90, 50), c1 = armEnd(c, 210, 54), c3 = armEnd(c, 330, 54), c4 = armEnd(c3, 30, 52);
  let s = B(c, o, 'C', 'O', { order: 2 }) + B(c, c1, 'C', 'CH₃') + B(c, c3, 'C', 'CH₂') + B(c3, c4, 'CH₂', 'CH₃');
  s += A(o, 'O') + LP(o, 150) + LP(o, 30);
  s += A(c1, 'CH₃', { kind: 'hi' }) + A(c3, 'CH₂', { kind: 'hi' }) + A(c4, 'CH₃') + A(c, 'C');
  s += tag(c1.x, c1.y + 34, 'α: a CH₃', { cls: 'fg-tag-good' });
  s += tag(c3.x + 6, c3.y + 34, 'α: a CH₂');
  s += tag(c4.x + 4, c4.y - 26, 'β');
  if (verdict) s += tag(c.x + 20, c.y - 84, verdict, { cls: 'fg-tag-good' });
  return s;
}
/* 2-Methylcyclohexanone with every ring carbon labelled. */
function methylCycloLabelled(cx, cy, verdict) {
  const ctr = P(cx, cy), R = 58;
  const pts = [90, 30, -30, -90, -150, 150].map((d) => armEnd(ctr, d, R));
  const labs = ['C', 'CH', 'CH₂', 'CH₂', 'CH₂', 'CH₂'];
  let s = '';
  for (let i = 0; i < 6; i++) s += B(pts[i], pts[(i + 1) % 6], labs[i], labs[(i + 1) % 6]);
  const o = armEnd(pts[0], 90, 44);
  s += B(pts[0], o, 'C', 'O', { order: 2 }) + A(o, 'O') + LP(o, 150) + LP(o, 30);
  const me = armEnd(pts[1], 30, 50);
  s += B(pts[1], me, 'CH', 'CH₃') + A(me, 'CH₃', { kind: 'warn' });
  labs.forEach((l, i) => { s += A(pts[i], l, { kind: i === 1 || i === 5 ? 'hi' : undefined }); });
  s += tag(pts[1].x + 24, pts[1].y + 30, 'α: C2', { anchor: 'start' });
  s += tag(pts[5].x - 24, pts[5].y + 30, 'α: C6', { anchor: 'end' });
  s += tag(me.x + 30, me.y - 26, 'CH₃ on C2: β', { cls: 'fg-tag-warn', anchor: 'end' });
  if (verdict) s += tag(cx, cy - 116, verdict, { cls: 'fg-tag-warn' });
  return s;
}

FIGURES.push({
  id: 'iodoform-which',
  section: 'alpha-halogenation',
  anchor: '<h3>The haloform reaction</h3>',
  alt: 'Three cases for the iodoform test. Butan-2-one: its C1 is an alpha carbon and a methyl, so it can become CI3; positive. Ethanol: the reagent first oxidizes it to acetaldehyde, whose methyl is alpha to the C=O; positive. 2-Methylcyclohexanone: its alpha carbons are C2, a CH, and C6, a CH2; its methyl hangs on C2, so it is a beta carbon, not on the carbonyl; negative.',
  viewBox: '0 0 760 280',
  build() {
    let s = '';
    s += panel(8, 8, 232, 264, { kind: 'good' }) + panel(252, 8, 232, 264, { kind: 'good' }) + panel(496, 8, 256, 264, { kind: 'warn' });
    s += tag(124, 30, 'BUTAN-2-ONE: POSITIVE', { cls: 'fg-tag-good' });
    s += butanone(P(102, 130), null);
    s += tag(368, 30, 'ETHANOL: POSITIVE', { cls: 'fg-tag-good' });
    // ethanol, then acetaldehyde below it
    const e1 = P(310, 72), e2 = armEnd(e1, 330, 50), eo = armEnd(e2, 30, 48);
    s += B(e1, e2, 'CH₃', 'CH₂') + B(e2, eo, 'CH₂', 'OH') + A(e1, 'CH₃', { kind: 'hi' }) + A(e2, 'CH₂') + A(eo, 'OH');
    s += arrow(P(368, 122), P(368, 148)); s += tag(380, 140, 'I₂, HO⁻ oxidize', { anchor: 'start' });
    const a2 = P(368, 200), a1 = armEnd(a2, 210, 50), ao = armEnd(a2, 90, 38), ah = armEnd(a2, 330, 40);
    s += B(a2, a1, 'C', 'CH₃') + B(a2, ao, 'C', 'O', { order: 2 }) + B(a2, ah, 'C', 'H');
    s += A(a1, 'CH₃', { kind: 'hi' }) + A(ao, 'O') + A(ah, 'H') + A(a2, 'C');
    s += tag(368, 262, 'acetaldehyde');
    s += tag(624, 30, '2-METHYLCYCLOHEXANONE: NEGATIVE', { cls: 'fg-tag-warn' });
    s += methylCycloLabelled(620, 160, null);
    return s;
  },
  caption: 'Highlighted: the carbons the test cares about. Only a CH₃ bonded straight to the carbonyl carbon can become CI₃.',
});

FIGURES.push({
  id: 'l-methyl-where',
  lessons: ['alpha-halogenation'],
  alt: 'Butan-2-one above 2-methylcyclohexanone, alpha carbons highlighted. In butan-2-one, C1 is an alpha carbon and a CH3; C3 is an alpha CH2. In 2-methylcyclohexanone, the alpha carbons are C2, a CH, and C6, a CH2; the methyl sits on C2, one bond further from the carbonyl.',
  viewBox: '0 0 340 492',
  build() {
    let s = panel(8, 8, 324, 200) + panel(8, 220, 324, 264);
    s += tag(170, 30, 'BUTAN-2-ONE');
    s += butanone(P(150, 116), null);
    s += tag(170, 242, '2-METHYLCYCLOHEXANONE');
    s += methylCycloLabelled(160, 384, null);
    return s;
  },
  caption: 'Highlighted: the α carbons in each ketone.',
});

/* ======================================================================
   7. Hell–Volhard–Zelinsky, on butanoic acid.
   ====================================================================== */
/* CH3CH2–C(alpha)–C(=O)–X, laid out left to right. alpha: label of the alpha
   carbon; x: label of the group on the carbonyl carbon; enol: C=C form. */
function acyl(c, { alpha = 'CH₂', x = 'OH', enol = false, hiAlpha = false, hiX = false } = {}) {
  const a = armEnd(c, 210, 54), e = armEnd(a, 150, 52), m = armEnd(e, 210, 52);
  const o = armEnd(c, 90, 44), xx = armEnd(c, 330, 50);
  let s = B(m, e, 'CH₃', 'CH₂') + B(e, a, 'CH₂', alpha) + B(a, c, alpha, 'C', { order: enol ? 2 : 1 });
  s += B(c, o, 'C', enol ? 'OH' : 'O', { order: enol ? 1 : 2 }) + B(c, xx, 'C', x);
  s += A(m, 'CH₃') + A(e, 'CH₂') + A(a, alpha, { kind: hiAlpha ? 'hi' : undefined }) + A(c, 'C');
  s += A(o, enol ? 'OH' : 'O') + A(xx, x);
  return s;
}

FIGURES.push({
  id: 'hvz-cycle',
  section: 'alpha-halogenation',
  anchor: '<h3>Hell&ndash;Volhard&ndash;Zelinsky: halogenating an acid</h3>',
  alt: 'The Hell-Volhard-Zelinsky cycle on butanoic acid. Top left, butanoic acid, which has almost no enol. PBr3 turns it into butanoyl bromide, top right, which forms its enol, drawn on the right with a C=C to the alpha carbon and an OH. The enol attacks Br2, giving 2-bromobutanoyl bromide, bottom right. That exchanges with a fresh butanoic acid, giving 2-bromobutanoic acid, bottom left, the product, and handing a new butanoyl bromide back to the top of the cycle.',
  viewBox: '0 0 760 520',
  build() {
    let s = '';
    s += tag(150, 22, 'BUTANOIC ACID') + tag(150, 38, 'almost no enol', { cls: 'fg-tag-mut' });
    s += acyl(P(200, 120), {});
    s += arrow(P(262, 120), P(462, 120)); s += tag(362, 108, 'PBr₃ (catalytic)');
    s += tag(590, 22, 'BUTANOYL BROMIDE') + tag(590, 38, 'this one forms an enol', { cls: 'fg-tag-good' });
    s += acyl(P(640, 120), { x: 'Br' });
    s += arrow(P(726, 160), P(726, 230)) + arrow(P(738, 230), P(738, 160));
    s += acyl(P(640, 280), { x: 'Br', enol: true, alpha: 'CH', hiAlpha: true });
    s += tag(466, 284, 'the enol', { anchor: 'end' });
    s += arrow(P(732, 322), P(732, 382)); s += tag(722, 358, 'Br₂', { anchor: 'end' });
    s += acyl(P(640, 440), { x: 'Br', alpha: 'CHBr', hiAlpha: true });
    s += tag(590, 506, '2-BROMOBUTANOYL BROMIDE');
    s += arrow(P(462, 440), P(262, 440)); s += tag(362, 428, '+ butanoic acid');
    s += tag(362, 460, 'swaps Br for OH, and', { cls: 'fg-tag-mut' });
    s += tag(362, 476, 'a new acyl bromide forms', { cls: 'fg-tag-mut' });
    s += acyl(P(200, 440), { alpha: 'CHBr', hiAlpha: true });
    s += tag(150, 506, '2-BROMOBUTANOIC ACID', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Go clockwise from top left. The bottom arrow makes the product and a fresh butanoyl bromide at the same time.',
});

FIGURES.push({
  id: 'l-hvz-cycle',
  lessons: ['alpha-halogenation'],
  alt: 'Hell-Volhard-Zelinsky on butanoic acid, stacked: butanoic acid; PBr3 makes butanoyl bromide; its enol; Br2 gives 2-bromobutanoyl bromide; exchange with more butanoic acid gives 2-bromobutanoic acid and a new butanoyl bromide.',
  viewBox: '0 0 340 700',
  build() {
    let s = '';
    const rows = [
      ['BUTANOIC ACID', {}],
      ['BUTANOYL BROMIDE', { x: 'Br' }],
      ['ITS ENOL', { x: 'Br', enol: true, alpha: 'CH', hiAlpha: true }],
      ['2-BROMOBUTANOYL BROMIDE', { x: 'Br', alpha: 'CHBr', hiAlpha: true }],
      ['2-BROMOBUTANOIC ACID', { alpha: 'CHBr', hiAlpha: true }],
    ];
    const steps = ['PBr₃', 'forms an enol', 'Br₂', '+ butanoic acid'];
    rows.forEach(([t, o], i) => {
      const y = 20 + i * 140;
      s += tag(170, y, t, { cls: i === 4 ? 'fg-tag-good' : 'fg-tag' });
      s += acyl(P(222, y + 70), o);
      if (i < 4) { s += arrow(P(310, y + 94), P(310, y + 128)); s += tag(300, y + 118, steps[i], { anchor: 'end' }); }
    });
    return s;
  },
  caption: 'The last step also makes a new butanoyl bromide, so a little PBr₃ is enough.',
});

/* ======================================================================
   8. The alpha-halo ketone as an electrophile: elimination to an enone.
   ====================================================================== */
FIGURES.push({
  id: 'enone-elimination',
  section: 'alpha-halogenation',
  anchor: '<h3>The &alpha;-halo ketone itself</h3>',
  alt: '2-Bromocyclohexanone, with the bromine on C2 and a hydrogen on C3 highlighted, loses HBr when treated with base. The product is cyclohex-2-en-1-one, with a new C=C between C2 and C3, conjugated with the C=O.',
  viewBox: '0 0 760 200',
  build() {
    let s = '';
    const ring = (cx, cy, enone) => {
      const ctr = P(cx, cy), R = 34;
      const p = [90, 30, -30, -90, -150, 150].map((d) => armEnd(ctr, d, R));
      let g = '';
      for (let i = 0; i < 6; i++) {
        g += (enone && i === 1) ? ringDouble(p[1], p[2], ctr, { inset: 6, gap: 4.6, cls: 'fg-bond-hi' }) : bond(p[i], p[(i + 1) % 6], { rFrom: 0, rTo: 0 });
      }
      const o = armEnd(p[0], 90, 34);
      g += bond(p[0], o, { rFrom: 0, rTo: 15, order: 2 }) + A(o, 'O');
      const sx = enone ? 14 : -11;
      g += text(p[1].x + sx, p[1].y + (enone ? -2 : 9), '2', { cls: 'fg-tag-mut', size: 11 });
      g += text(p[2].x + sx, p[2].y + (enone ? 12 : 1), '3', { cls: 'fg-tag-mut', size: 11 });
      return { g, p };
    };
    const a = ring(150, 104, false);
    s += a.g;
    const br = armEnd(a.p[1], 30, 36), h = armEnd(a.p[2], -30, 32);
    s += bond(a.p[1], br, { rFrom: 0, rTo: 16 }) + A(br, 'Br', { kind: 'hi' });
    s += bond(a.p[2], h, { rFrom: 0, rTo: 13 }) + A(h, 'H', { kind: 'hi' });
    s += tag(150, 190, '2-bromocyclohexanone');
    s += arrow(P(270, 104), P(420, 104));
    s += tag(345, 92, 'base (E2)') + tag(345, 124, 'loses H and Br', { cls: 'fg-tag-mut' });
    const b = ring(540, 104, true);
    s += b.g + T(P(660, 108), '+ HBr');
    s += tag(540, 190, 'cyclohex-2-en-1-one', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'The highlighted H and Br leave; the new C=C forms between the two carbons that held them.',
});

export default FIGURES;
