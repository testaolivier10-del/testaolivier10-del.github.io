/* Figures for the hydrates-cyanohydrins notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Most figures here are drawn as "cells": one step of a mechanism, or one side
   of a comparison, drawn inside a 244 x 196 box at an offset. The notes page
   lays the cells out two across; the lesson copy (id prefix l-) stacks the
   same cells one above the other at 340 wide. So the notes and the lesson
   show exactly the same drawing, and neither can drift from the other.
   Text inside a cell is fg-lbl or fg-tag only, which is what a lesson
   figure is allowed to use. */
import { atom, bond, arrow, curve, lonePair, text, tag, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { polyPts, ringDouble } from '../lib/ochem-skeletal.mjs';
import { armEnd } from '../lib/ochem-helpers.mjs';

const FIGURES = [];
const r2 = (v) => Math.round(v * 100) / 100;

/* ------------------------------------------------------------ helpers --- */

/* A cell: a panel with a title tag at the top and a one-line result tag at
   the bottom. `draw(Q, T)` receives a point maker and a text maker that are
   already shifted to the cell's corner, so every cell is written in its own
   0..244 coordinates. */
const CW = 244, CH = 196;
function cell(ox, oy, w, h, title, foot, draw, opts = {}) {
  const dx = ox + (w - (opts.cw || CW)) / 2;
  const Q = (x, y) => P(dx + x, oy + y);
  let s = panel(ox, oy, w, h, opts.kind ? { kind: opts.kind } : {});
  s += tag(ox + w / 2, oy + 22, title);
  if (foot) s += text(ox + w / 2, oy + h - 14, foot, { cls: opts.footCls || 'fg-tag-good', size: 11 });
  s += draw(Q);
  return s;
}

/* Text placed in cell coordinates. */
const T = (Q, x, y, s, o = {}) => { const p = Q(x, y); return text(p.x, p.y, s, { cls: 'fg-lbl', size: 13, ...o }); };
const charge = (Q, x, y, s) => T(Q, x, y, s, { cls: 'fg-warn', size: 15 });

/* A labelled atom and a bond between two labelled atoms. */
const A = (p, l, o = {}) => atom(p.x, p.y, l, o);
const rOf = (l) => (l.length >= 3 ? 19 : l.length === 2 ? 16 : 14);
const B = (a, b, la, lb, o = {}) => bond(a, b, { rFrom: rOf(la), rTo: rOf(lb), ...o });

/* The C=O pi electrons moving up onto the oxygen: a short arrow bowed out
   to the right of the double bond, from the middle of the bond to the O. */
const piArrow = (c, o) => curve(P(c.x + 8, c.y - 24), P(o.x + 16, o.y + 9), { bow: 12, size: 7 });

/* An equilibrium: a forward arrow above a reverse arrow. */
const eqm = (x1, x2, y) => arrow(P(x1, y - 4), P(x2, y - 4), { size: 7 }) + arrow(P(x2, y + 4), P(x1, y + 4), { size: 7 });

/* An angle arc of radius r at point c, from screen angle a1 to a2 (degrees,
   measured counterclockwise from east, as armEnd measures them). */
function arc(c, r, a1, a2) {
  const p1 = armEnd(c, a1, r), p2 = armEnd(c, a2, r);
  const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
  const sweep = a2 > a1 ? 0 : 1;
  return `<path class="fg-dash-hi" d="M${r2(p1.x)} ${r2(p1.y)} A${r} ${r} 0 ${large} ${sweep} ${r2(p2.x)} ${r2(p2.y)}"></path>`;
}

/* The carbonyl carbon (or what it becomes) with three or four groups. Each
   group is { deg, len, l, order, kind }. The carbon is drawn last so bonds
   stop at its edge. */
function centre(c, groups, ckind = 'warn') {
  let s = '';
  const ends = {};
  for (const g of groups) {
    const e = armEnd(c, g.deg, g.len || 50);
    s += bond(c, e, { rFrom: 16, rTo: rOf(g.l), order: g.order || 1, cls: g.cls });
    s += A(e, g.l, { r: rOf(g.l), kind: g.kind });
    ends[g.key || g.l] = e;
  }
  s += A(c, 'C', { kind: ckind });
  return { s, ends };
}

/* ======================================================================
   1. Hydration in base: three steps, then the net change.
   ====================================================================== */
const baseCells = [
  ['HYDROXIDE ADDS TO THE CARBON', 'the π electrons move onto O', (Q) => {
    const c = Q(78, 120);
    const m = centre(c, [
      { deg: 90, len: 54, l: 'O', order: 2, key: 'O' },
      { deg: 210, l: 'CH₃' },
      { deg: 330, len: 44, l: 'H' },
    ]);
    let s = m.s;
    const o = m.ends.O;
    s += lonePair(o.x, o.y, 225, { dist: 21 }) + lonePair(o.x, o.y, 315, { dist: 21 });
    // hydroxide, to the right
    const oh = Q(182, 112), h = Q(222, 112);
    s += B(oh, h, 'O', 'H') + A(oh, 'O', { kind: 'hi' }) + A(h, 'H', { r: 14 });
    s += lonePair(oh.x, oh.y, 180, { dist: 21 }) + lonePair(oh.x, oh.y, 90, { dist: 21 }) + lonePair(oh.x, oh.y, 270, { dist: 21 });
    s += charge(Q, 204, 94, '−');
    s += curve(P(oh.x - 23, oh.y + 2), P(c.x + 18, c.y - 3), { bow: 18 });
    s += piArrow(c, o);
    return s;
  }],
  ['THE ALKOXIDE TAKES H⁺ FROM WATER', 'water becomes HO⁻ again', (Q) => {
    const c = Q(74, 128);
    const m = centre(c, [
      { deg: 90, len: 54, l: 'O', key: 'O', kind: 'warn' },
      { deg: 150, len: 46, l: 'H' },
      { deg: 210, l: 'CH₃' },
      { deg: 340, l: 'OH' },
    ]);
    let s = m.s;
    const o = m.ends.O;
    s += lonePair(o.x, o.y, 180, { dist: 21 }) + lonePair(o.x, o.y, 270, { dist: 21 }) + lonePair(o.x, o.y, 0, { dist: 21 });
    s += charge(Q, 56, 58, '−');
    // water, up and to the right
    const hw = Q(140, 70), ow = Q(186, 70), hw2 = Q(186, 116);
    s += B(hw, ow, 'H', 'O') + B(ow, hw2, 'O', 'H');
    s += A(hw, 'H', { r: 14, kind: 'hi' }) + A(ow, 'O') + A(hw2, 'H', { r: 14 });
    s += lonePair(ow.x, ow.y, 300, { dist: 21 }) + lonePair(ow.x, ow.y, 20, { dist: 21 });
    s += curve(P(o.x + 25, o.y), P(hw.x - 14, hw.y - 4), { bow: -12, size: 7 });
    s += curve(P(hw.x + 18, hw.y - 4), P(ow.x - 8, ow.y - 16), { bow: -12, size: 7 });
    return s;
  }],
  ['THE HYDRATE, AND HO⁻ IS BACK', 'a gem-diol: two OH on one carbon', (Q) => {
    const c = Q(80, 124);
    const m = centre(c, [
      { deg: 90, len: 52, l: 'OH', kind: 'hi' },
      { deg: 150, len: 46, l: 'H' },
      { deg: 210, l: 'CH₃' },
      { deg: 340, l: 'OH', kind: 'hi' },
    ]);
    return m.s + T(Q, 196, 128, '+  HO⁻');
  }],
  ['THE NET CHANGE', 'HO⁻ is used, then handed back', (Q) => {
    let s = T(Q, 122, 76, 'CH₃CHO  +  H₂O');
    const a = Q(92, 108), b = Q(152, 108);
    s += eqm(a.x, b.x, a.y);
    s += T(Q, 122, 96, 'HO⁻ (catalyst)', { cls: 'fg-tag', size: 11 });
    s += T(Q, 122, 142, 'CH₃CH(OH)₂');
    return s;
  }],
];

function gridFigure(cells, cols, w, h, gapX = 16, gapY = 16, x0 = 8, y0 = 8, kinds = [], cw = CW) {
  let s = '';
  cells.forEach(([title, foot, draw], i) => {
    const col = i % cols, row = Math.floor(i / cols);
    s += cell(x0 + col * (w + gapX), y0 + row * (h + gapY), w, h, title, foot, draw, { kind: kinds[i] || null, cw });
  });
  return s;
}

FIGURES.push({
  id: 'hydration-base',
  section: 'hydrates-cyanohydrins',
  anchor: '<h3>Hydrates: addition of water</h3>',
  alt: 'Hydration of acetaldehyde in base, in four panels. First, a lone pair on hydroxide attacks the carbonyl carbon while the pi electrons of the C=O move onto the oxygen. Second, the resulting alkoxide oxygen, carrying a negative charge, takes a proton from a water molecule, and the O–H bond electrons stay on the water oxygen, which becomes hydroxide. Third, the product is the hydrate, a carbon carrying two OH groups, with hydroxide released. Fourth, the net change: acetaldehyde plus water in equilibrium with CH3CH(OH)2, with hydroxide as the catalyst.',
  viewBox: '0 0 760 440',
  build() { return gridFigure(baseCells, 2, 364, 204, 16, 16, 8, 8, [0, 0, 0, 'hi']); },
  caption: 'Hydration in base, drawn on acetaldehyde. Follow the hydroxide: it enters in the first panel and leaves in the third.',
});

FIGURES.push({
  id: 'l-hydration-base',
  lessons: ['hydrates-cyanohydrins'],
  alt: 'Hydration of acetaldehyde in base, in three stacked panels: hydroxide attacks the carbonyl carbon as the pi electrons move onto oxygen; the alkoxide takes a proton from water, which becomes hydroxide; the product is the gem-diol with hydroxide released.',
  viewBox: '0 0 340 632',
  build() { return gridFigure(baseCells.slice(0, 3), 1, 324, 196, 0, 14, 8, 8); },
  caption: 'Hydroxide enters in the first panel and leaves in the third.',
});

/* ======================================================================
   2. Hydration in acid: four steps.
   ====================================================================== */
const acidCells = [
  ['ACID PUTS H⁺ ON THE OXYGEN', 'an O lone pair takes H⁺ from H₃O⁺', (Q) => {
    const c = Q(74, 128);
    const m = centre(c, [
      { deg: 90, len: 54, l: 'O', order: 2, key: 'O' },
      { deg: 210, l: 'CH₃' },
      { deg: 330, len: 44, l: 'H' },
    ]);
    let s = m.s;
    const o = m.ends.O;
    s += lonePair(o.x, o.y, 200, { dist: 21 }) + lonePair(o.x, o.y, 315, { dist: 21 });
    const h = Q(148, 60), oh = Q(196, 60);
    s += B(h, oh, 'H', 'OH₂') + A(h, 'H', { r: 14, kind: 'hi' }) + A(oh, 'OH₂', { r: 19 });
    s += charge(Q, 216, 42, '+');
    s += curve(P(o.x + 17, o.y - 17), P(h.x - 14, h.y - 4), { bow: -14, size: 7 });
    s += curve(P(h.x + 16, h.y - 6), P(oh.x - 12, oh.y - 17), { bow: -10, size: 7 });
    return s;
  }],
  ['WATER ADDS TO THE ACTIVATED CARBON', 'the π electrons move onto O⁺', (Q) => {
    const c = Q(74, 128);
    const m = centre(c, [
      { deg: 90, len: 54, l: 'O', order: 2, key: 'O' },
      { deg: 210, l: 'CH₃' },
      { deg: 150, len: 44, l: 'H' },
    ]);
    let s = m.s;
    const o = m.ends.O;
    const ho = armEnd(o, 30, 38);
    s += bond(o, ho, { rFrom: 14, rTo: 14 }) + A(ho, 'H', { r: 14 });
    s += lonePair(o.x, o.y, 225, { dist: 21 });
    s += charge(Q, 54, 88, '+');
    const w = Q(172, 132), w1 = Q(204, 110), w2 = Q(204, 158);
    s += B(w, w1, 'O', 'H') + B(w, w2, 'O', 'H');
    s += A(w, 'O', { kind: 'hi' }) + A(w1, 'H', { r: 14 }) + A(w2, 'H', { r: 14 });
    s += lonePair(w.x, w.y, 150, { dist: 21 }) + lonePair(w.x, w.y, 210, { dist: 21 });
    s += curve(P(w.x - 21, w.y - 9), P(c.x + 18, c.y - 2), { bow: 14 });
    s += piArrow(c, o);
    return s;
  }],
  ['A SECOND WATER TAKES OFF H⁺', 'the O–H electrons stay on that O', (Q) => {
    const c = Q(60, 110);
    const m = centre(c, [
      { deg: 90, len: 52, l: 'OH' },
      { deg: 150, len: 44, l: 'H' },
      { deg: 210, l: 'CH₃' },
      { deg: 345, len: 54, l: 'O', key: 'Op', kind: 'hi' },
    ]);
    let s = m.s;
    const op = m.ends.Op;
    const ha = armEnd(op, 65, 46), hb = armEnd(op, 320, 40);
    s += bond(op, ha, { rFrom: 14, rTo: 14 }) + A(ha, 'H', { r: 14, kind: 'hi' });
    s += bond(op, hb, { rFrom: 14, rTo: 14 }) + A(hb, 'H', { r: 14 });
    s += lonePair(op.x, op.y, 110, { dist: 21 });
    s += text(op.x - 12, op.y - 20, '+', { cls: 'fg-warn', size: 15 });
    const w = Q(206, 70);
    s += A(w, 'OH₂', { r: 19 });
    s += lonePair(w.x, w.y, 160, { dist: 24 }) + lonePair(w.x, w.y, 225, { dist: 24 });
    s += curve(P(w.x - 22, w.y + 17), P(ha.x + 15, ha.y + 2), { bow: 12, size: 7 });
    const mid = P((op.x + ha.x) / 2, (op.y + ha.y) / 2);
    s += curve(P(mid.x + 7, mid.y - 2), P(op.x + 16, op.y - 5), { bow: -14, size: 7 });
    return s;
  }],
  ['THE HYDRATE, AND H₃O⁺ IS BACK', 'the acid was a catalyst', (Q) => {
    const c = Q(80, 124);
    const m = centre(c, [
      { deg: 90, len: 52, l: 'OH', kind: 'hi' },
      { deg: 150, len: 46, l: 'H' },
      { deg: 210, l: 'CH₃' },
      { deg: 340, l: 'OH', kind: 'hi' },
    ]);
    return m.s + T(Q, 196, 128, '+  H₃O⁺');
  }],
];

FIGURES.push({
  id: 'hydration-acid',
  section: 'hydrates-cyanohydrins',
  anchor: '<h3>Hydrates: addition of water</h3>',
  alt: 'Hydration of acetaldehyde in acid, in four panels. First, a lone pair on the carbonyl oxygen takes a proton from hydronium, and the H–O bond electrons stay on the water. Second, a water molecule attacks the carbonyl carbon of the protonated carbonyl with a lone pair while the pi electrons move onto the positive oxygen. Third, the added oxygen carries two hydrogens and a positive charge, and a second water takes one of those protons. Fourth, the gem-diol product with hydronium released.',
  viewBox: '0 0 760 440',
  build() { return gridFigure(acidCells, 2, 364, 204, 16, 16, 8, 8); },
  caption: 'Hydration in acid, on the same aldehyde. The proton goes on first and comes off last, so the acid is handed back.',
});

FIGURES.push({
  id: 'l-hydration-acid',
  lessons: ['hydrates-cyanohydrins'],
  alt: 'Hydration of acetaldehyde in acid, in four stacked panels: the carbonyl oxygen takes a proton from hydronium; water attacks the carbon as the pi electrons move onto the positive oxygen; a second water removes a proton from the added oxygen; the gem-diol forms and hydronium is released.',
  viewBox: '0 0 340 842',
  build() { return gridFigure(acidCells, 1, 324, 196, 0, 14, 8, 8); },
  caption: 'The proton goes on first and comes off last.',
});

/* ======================================================================
   3. The percent-hydrate bars, on a true linear scale.
   ====================================================================== */
FIGURES.push({
  id: 'hydration-spread',
  section: 'hydrates-cyanohydrins',
  anchor: '<h3>Hydrates: addition of water</h3>',
  viewBox: '0 0 760 300',
  alt: 'Bar chart of percent hydrate at equilibrium in water, on a scale from 0 to 100 percent: acetone 0.1 percent, a bar too thin to see; acetaldehyde about 50 percent; formaldehyde about 99.9 percent; chloral about 100 percent.',
  build() {
    let s = '';
    const x0 = 250, W = 420;                    // 0% at x0, 100% at x0 + W
    const rows = [
      { lab: 'acetone, (CH₃)₂C=O', pct: 0.1, txt: '0.1%', why: 'two methyls' },
      { lab: 'acetaldehyde, CH₃CHO', pct: 50, txt: '~50%', why: 'one methyl' },
      { lab: 'formaldehyde, H₂C=O', pct: 99.9, txt: '~99.9%', why: 'no alkyl group' },
      { lab: 'chloral, CCl₃CHO', pct: 100, txt: '~100%', why: 'three Cl pulling' },
    ];
    let y = 40;
    for (const r of rows) {
      s += text(24, y + 4, r.lab, { cls: 'fg-lbl', size: 13, anchor: 'start' });
      s += text(24, y + 22, r.why, { cls: 'fg-sm', size: 10.5, anchor: 'start' });
      const w = Math.max(3, (W * r.pct) / 100);
      s += bar(x0, y - 9, w, 18, { kind: r.pct < 1 ? 'warn' : 'hi', opacity: 0.75, r: 3 });
      s += text(x0 + w + 8, y + 5, r.txt, { cls: 'fg-tag-good', size: 11, anchor: 'start' });
      y += 52;
    }
    // axis
    const ya = 238;
    s += rule(x0, ya, x0 + W, ya);
    for (const p of [0, 25, 50, 75, 100]) {
      const x = x0 + (W * p) / 100;
      s += rule(x, ya, x, ya + 6);
      s += text(x, ya + 22, p + '%', { cls: 'fg-sm', size: 10.5 });
    }
    s += text(x0 + W / 2, ya + 48, 'percent of the carbonyl present as its hydrate, in water at equilibrium', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'The table as bars, on a straight 0–100% scale. Acetone’s bar is there; at 0.1% it is too thin to see.',
});

/* ======================================================================
   4. Angles: why crowding opposes addition, and why a three-membered
      ring reverses it.
   ====================================================================== */
const WIDE = 320;   // content width of the comparison cells
const angleCells = [
  ['ACETONE: ADDITION CROWDS THE CARBON', 'equilibrium lies far to the left (0.1%)', (Q) => {
    let s = '';
    const c = Q(70, 104);
    const m = centre(c, [
      { deg: 90, len: 48, l: 'O', order: 2 },
      { deg: 210, len: 50, l: 'CH₃' },
      { deg: 330, len: 50, l: 'CH₃' },
    ]);
    s += m.s + arc(c, 26, 210, 330);
    s += T(Q, 70, 176, '120°', { cls: 'fg-tag-warn', size: 11 });
    s += T(Q, 70, 194, 'sp², flat', { cls: 'fg-tag', size: 11 });
    const a = Q(142, 104), b = Q(176, 104);
    s += eqm(a.x, b.x, a.y);
    const d = Q(246, 104);
    const n = centre(d, [
      { deg: 55, len: 46, l: 'OH' },
      { deg: 125, len: 46, l: 'OH' },
      { deg: 215, len: 50, l: 'CH₃' },
      { deg: 325, len: 50, l: 'CH₃' },
    ]);
    s += n.s + arc(d, 24, 215, 325);
    s += T(Q, 246, 176, '109.5°', { cls: 'fg-tag-warn', size: 11 });
    s += T(Q, 246, 194, 'sp³, methyls closer', { cls: 'fg-tag', size: 11 });
    return s;
  }],
  ['CYCLOPROPANONE: ADDITION EASES THE RING', 'equilibrium lies far to the right', (Q) => {
    let s = '';
    const ring = (k, top) => {
      const k1 = P(k.x + 42, k.y - 24), k2 = P(k.x + 42, k.y + 24);
      return bond(k, k1, { rFrom: 16, rTo: 0 }) + bond(k, k2, { rFrom: 16, rTo: 0 }) + bond(k1, k2, { rFrom: 0, rTo: 0 }) + arc(k, 26, -30, 30);
    };
    const k = Q(56, 104);
    s += ring(k);
    const ko = Q(56, 54);
    s += bond(k, ko, { rFrom: 16, rTo: 15, order: 2 }) + A(ko, 'O') + A(k, 'C', { kind: 'warn' });
    s += T(Q, 122, 108, '60°', { cls: 'fg-tag-warn', size: 11 });
    s += T(Q, 70, 176, 'sp² wants 120°', { cls: 'fg-tag', size: 11 });
    s += T(Q, 70, 194, '60° off', { cls: 'fg-tag-warn', size: 11 });
    const a = Q(142, 104), b = Q(176, 104);
    s += eqm(a.x, b.x, a.y);
    const h = Q(222, 104);
    s += ring(h);
    const o1 = armEnd(h, 120, 46), o2 = armEnd(h, 240, 46);
    s += bond(h, o1, { rFrom: 16, rTo: 16 }) + A(o1, 'OH');
    s += bond(h, o2, { rFrom: 16, rTo: 16 }) + A(o2, 'OH');
    s += A(h, 'C', { kind: 'warn' });
    s += T(Q, 288, 108, '60°', { cls: 'fg-tag-warn', size: 11 });
    s += T(Q, 252, 176, 'sp³ wants 109.5°', { cls: 'fg-tag', size: 11 });
    s += T(Q, 252, 194, 'about 50° off', { cls: 'fg-tag-warn', size: 11 });
    return s;
  }],
];

FIGURES.push({
  id: 'hydration-angles',
  section: 'hydrates-cyanohydrins',
  anchor: '<h3>Hydrates: addition of water</h3>',
  alt: 'Two panels. Left: acetone, with its two methyl groups 120 degrees apart on a flat sp2 carbon, in equilibrium with its hydrate, where the carbon is sp3 and the methyls are about 109.5 degrees apart, pushed closer; the equilibrium lies far to the left. Right: cyclopropanone, whose carbonyl carbon sits in a three-membered ring with a 60 degree angle, 60 degrees short of the 120 an sp2 carbon wants; its hydrate keeps the 60 degree angle, which is only about 50 degrees short of the 109.5 an sp3 carbon wants; the equilibrium lies far to the right.',
  viewBox: '0 0 760 248',
  build() { return gridFigure(angleCells, 2, 364, 232, 16, 16, 8, 8, [], WIDE); },
  caption: 'The same angle change, read two ways. Open-chain, it squeezes the groups together. In the three-membered ring, it brings the carbon closer to the angle it wants.',
});

FIGURES.push({
  id: 'l-hydration-crowding',
  lessons: ['hydrates-cyanohydrins'],
  alt: 'Acetone, with its two methyls 120 degrees apart on a flat sp2 carbon, in equilibrium with its hydrate, where the sp3 carbon holds the methyls about 109.5 degrees apart. The equilibrium lies far to the left.',
  viewBox: '0 0 340 248',
  build() { return gridFigure(angleCells.slice(0, 1), 1, 324, 232, 0, 0, 8, 8, [], WIDE); },
  caption: 'Addition closes the angle between the methyls from 120° to about 109.5°.',
});

/* ======================================================================
   5. When something else decides: conjugation (benzaldehyde) and a strong
      electronic pull (hexafluoroacetone).
   ====================================================================== */
function phenyl(Q, cx, cy, r, attachDeg, hi) {
  // A Kekule benzene whose vertex at attachDeg carries the substituent.
  const pts = polyPts(Q(cx, cy).x, Q(cx, cy).y, 6, r, attachDeg);
  const ctr = Q(cx, cy);
  let s = '';
  for (let i = 0; i < 6; i++) {
    const a = pts[i], b = pts[(i + 1) % 6];
    s += (i % 2 === 1) ? ringDouble(a, b, ctr, { inset: 6, cls: hi ? 'fg-bond-hi' : undefined })
                       : bond(a, b, { rFrom: 0, rTo: 0 });
  }
  return { s, at: pts[0] };
}

const disagreeCells = [
  ['BENZALDEHYDE: THE RING HOLDS THE C=O', 'far less hydrate than acetaldehyde', (Q) => {
    let s = '';
    const ph = phenyl(Q, 40, 104, 24, 0, true);
    s += ph.s;
    const c = Q(100, 104);
    s += bond(ph.at, c, { rFrom: 0, rTo: 16, cls: 'fg-bond-hi' });
    const o = armEnd(c, 60, 44), h = armEnd(c, 300, 40);
    s += bond(c, o, { rFrom: 16, rTo: 15, order: 2, cls: 'fg-bond-hi' }) + A(o, 'O');
    s += bond(c, h, { rFrom: 16, rTo: 14 }) + A(h, 'H', { r: 14 });
    s += A(c, 'C', { kind: 'warn' });
    s += T(Q, 74, 176, 'C=O conjugated', { cls: 'fg-tag-warn', size: 11 });
    s += T(Q, 74, 194, 'with the ring', { cls: 'fg-tag-warn', size: 11 });
    const a = Q(146, 104), b = Q(176, 104);
    s += eqm(a.x, b.x, a.y);
    const ph2 = phenyl(Q, 212, 104, 24, 0, false);
    s += ph2.s;
    const d = Q(272, 104);
    s += bond(ph2.at, d, { rFrom: 0, rTo: 16 });
    const o1 = armEnd(d, 60, 44), o2 = armEnd(d, 300, 44);
    s += bond(d, o1, { rFrom: 16, rTo: 16 }) + A(o1, 'OH');
    s += bond(d, o2, { rFrom: 16, rTo: 16 }) + A(o2, 'OH');
    s += A(d, 'C', { kind: 'warn' });
    s += T(Q, 246, 176, 'sp³ carbon:', { cls: 'fg-tag', size: 11 });
    s += T(Q, 246, 194, 'conjugation broken', { cls: 'fg-tag', size: 11 });
    return s;
  }],
  ['HEXAFLUOROACETONE: ELECTRONICS WIN', 'essentially all hydrate', (Q) => {
    let s = '';
    const c = Q(72, 100);
    const m = centre(c, [
      { deg: 90, len: 48, l: 'O', order: 2 },
      { deg: 210, len: 52, l: 'CF₃', kind: 'hi' },
      { deg: 330, len: 52, l: 'CF₃', kind: 'hi' },
    ]);
    s += m.s;
    s += T(Q, 72, 176, 'CF₃ bulkier than CH₃', { cls: 'fg-tag-warn', size: 11 });
    s += T(Q, 72, 194, 'six F pull from C', { cls: 'fg-tag-good', size: 11 });
    const a = Q(146, 100), b = Q(176, 100);
    s += eqm(a.x, b.x, a.y);
    const d = Q(246, 100);
    const n = centre(d, [
      { deg: 55, len: 46, l: 'OH' },
      { deg: 125, len: 46, l: 'OH' },
      { deg: 215, len: 50, l: 'CF₃', kind: 'hi' },
      { deg: 325, len: 50, l: 'CF₃', kind: 'hi' },
    ]);
    s += n.s;
    s += T(Q, 246, 176, 'the pull outweighs', { cls: 'fg-tag', size: 11 });
    s += T(Q, 246, 194, 'the crowding', { cls: 'fg-tag', size: 11 });
    return s;
  }],
];

FIGURES.push({
  id: 'hydration-disagree',
  section: 'hydrates-cyanohydrins',
  anchor: '<h3>Hydrates: addition of water</h3>',
  alt: 'Two panels. Left: benzaldehyde, whose C=O is conjugated with the benzene ring, highlighted, in equilibrium with its hydrate, where the sp3 carbon breaks that link; much less hydrate forms than with acetaldehyde. Right: hexafluoroacetone, with two CF3 groups that are bulkier than methyls but pull electron density from the carbonyl carbon through six fluorines, in equilibrium with its hydrate; essentially all of it is hydrate.',
  viewBox: '0 0 760 248',
  build() { return gridFigure(disagreeCells, 2, 364, 232, 16, 16, 8, 8, [], WIDE); },
  caption: 'Two more comparisons with the plain alkyl count. Conjugation holds benzaldehyde back; six fluorines push hexafluoroacetone all the way.',
});

FIGURES.push({
  id: 'l-hydration-exceptions',
  lessons: ['hydrates-cyanohydrins'],
  alt: 'Two stacked panels. Top: benzaldehyde, whose C=O is conjugated with the ring, in equilibrium with its hydrate, where the sp3 carbon breaks that link; far less hydrate than acetaldehyde. Bottom: cyclopropanone, whose ring angle of 60 degrees is 60 degrees off the 120 an sp2 carbon wants and only about 50 degrees off the 109.5 an sp3 carbon wants; the hydrate is favored.',
  viewBox: '0 0 340 494',
  build() { return gridFigure([disagreeCells[0], angleCells[1]], 1, 324, 232, 0, 14, 8, 8, [], WIDE); },
  caption: 'Conjugation holds the top equilibrium back. Ring strain pushes the bottom one forward.',
});

/* ======================================================================
   6. Why the hydrate decides where a chromium oxidation stops.
   ====================================================================== */
/* A carbon with R on the left and three more groups. */
function rCarbon(c, groups) {
  return centre(c, [{ deg: 180, len: 46, l: 'R' }, ...groups]);
}
const oxCells = [
  ['1 · THE PRIMARY ALCOHOL', 'Cr(VI) removes this H and the O–H H', (Q) => {
    const c = Q(110, 110);
    const m = rCarbon(c, [
      { deg: 90, len: 46, l: 'H', kind: 'hi' },
      { deg: 270, len: 46, l: 'H' },
      { deg: 0, len: 50, l: 'OH', kind: 'hi' },
    ]);
    return m.s;
  }],
  ['2 · THE ALDEHYDE', 'dry (PCC in CH₂Cl₂): it stops here', (Q) => {
    const c = Q(110, 110);
    const m = rCarbon(c, [
      { deg: 90, len: 50, l: 'O', order: 2 },
      { deg: 0, len: 46, l: 'H' },
    ]);
    return m.s + T(Q, 110, 164, 'no O–H on this carbon', { cls: 'fg-tag-warn', size: 11 });
  }],
  ['3 · IN WATER: THE HYDRATE', 'an alcohol again: H and OH on one C', (Q) => {
    const c = Q(110, 110);
    const m = rCarbon(c, [
      { deg: 90, len: 48, l: 'OH' },
      { deg: 270, len: 46, l: 'H', kind: 'hi' },
      { deg: 0, len: 50, l: 'OH', kind: 'hi' },
    ]);
    return m.s;
  }],
  ['4 · WATER (JONES): OXIDIZED AGAIN', 'the carboxylic acid', (Q) => {
    const c = Q(110, 110);
    const m = rCarbon(c, [
      { deg: 90, len: 50, l: 'O', order: 2 },
      { deg: 0, len: 50, l: 'OH' },
    ]);
    return m.s;
  }],
];

FIGURES.push({
  id: 'hydrate-oxidation',
  section: 'hydrates-cyanohydrins',
  anchor: '<h3>Why the hydrate matters even when it is the minor species</h3>',
  alt: 'Four panels. First, a primary alcohol R–CH2–OH, with one C–H and the O–H highlighted: Cr(VI) removes those two hydrogens. Second, the aldehyde R–CHO, which has no O–H on the carbonyl carbon; with PCC in dry dichloromethane the oxidation stops here. Third, in water the aldehyde forms its hydrate R–CH(OH)2, which again has an H and an OH on one carbon, highlighted. Fourth, Cr(VI) in water, Jones reagent, oxidizes that hydrate to the carboxylic acid R–COOH.',
  viewBox: '0 0 760 440',
  build() { return gridFigure(oxCells, 2, 364, 204, 16, 16, 8, 8, [0, 'warn', 'hi', 0]); },
  caption: 'Read the panels in order. The second oxidation needs the third panel, and only water can make it.',
});

FIGURES.push({
  id: 'l-hydrate-oxidation',
  lessons: ['hydrates-cyanohydrins'],
  alt: 'Four stacked panels: a primary alcohol with one C–H and the O–H highlighted; the aldehyde, where PCC in dry dichloromethane stops; the hydrate that forms in water, with an H and an OH on one carbon; and the carboxylic acid that Jones reagent gives from it.',
  viewBox: '0 0 340 842',
  build() { return gridFigure(oxCells, 1, 324, 196, 0, 14, 8, 8, [0, 'warn', 'hi', 0]); },
  caption: 'The second oxidation needs the hydrate in the third panel.',
});

/* ======================================================================
   7. Cyanohydrin formation with catalytic cyanide, and its reverse.
   ====================================================================== */
/* Cyanide or a nitrile: carbon, triple bond, nitrogen, drawn in a straight
   line (sp carbon, 180 degrees) along screen angle `deg` from `from`. */
function nitrile(from, deg, rFrom, cKind) {
  const cn = armEnd(from, deg, 50), n = armEnd(cn, deg, 40);
  let s = bond(from, cn, { rFrom, rTo: 14 });
  s += bond(cn, n, { rFrom: 14, rTo: 14, order: 3, gap: 3.4 });
  s += A(cn, 'C', { r: 14, kind: cKind }) + A(n, 'N', { r: 14 });
  return { s, cn, n };
}

const cyanoCells = [
  ['CYANIDE ADDS TO THE CARBON', 'the π electrons move onto O', (Q) => {
    const c = Q(74, 124);
    const m = centre(c, [
      { deg: 90, len: 54, l: 'O', order: 2, key: 'O' },
      { deg: 210, l: 'CH₃' },
      { deg: 330, l: 'CH₃' },
    ]);
    let s = m.s;
    const o = m.ends.O;
    s += lonePair(o.x, o.y, 225, { dist: 21 }) + lonePair(o.x, o.y, 315, { dist: 21 });
    const cc = Q(162, 78), nn = Q(206, 78);
    s += bond(cc, nn, { rFrom: 14, rTo: 14, order: 3, gap: 3.4 });
    s += A(cc, 'C', { r: 14, kind: 'hi' }) + A(nn, 'N', { r: 14 });
    s += lonePair(cc.x, cc.y, 180, { dist: 20 }) + lonePair(nn.x, nn.y, 0, { dist: 20 });
    s += charge(Q, 156, 58, '−');
    s += curve(P(cc.x - 22, cc.y + 3), P(c.x + 16, c.y - 10), { bow: 18 });
    s += piArrow(c, o);
    return s;
  }],
  ['THE ALKOXIDE TAKES H⁺ FROM HCN', 'HCN gives up H⁺ and becomes CN⁻', (Q) => {
    const c = Q(64, 132);
    const m = centre(c, [
      { deg: 90, len: 54, l: 'O', key: 'O', kind: 'warn' },
      { deg: 150, len: 48, l: 'CH₃' },
      { deg: 210, len: 48, l: 'CH₃' },
    ]);
    let s = m.s;
    const nt = nitrile(c, 345, 16);
    s += nt.s;
    const o = m.ends.O;
    s += lonePair(o.x, o.y, 180, { dist: 21 }) + lonePair(o.x, o.y, 270, { dist: 21 }) + lonePair(o.x, o.y, 0, { dist: 21 });
    s += charge(Q, 46, 62, '−');
    const h = Q(122, 70), hc = Q(162, 70), hn = Q(204, 70);
    s += bond(h, hc, { rFrom: 14, rTo: 14 }) + bond(hc, hn, { rFrom: 14, rTo: 14, order: 3, gap: 3.4 });
    s += A(h, 'H', { r: 14, kind: 'hi' }) + A(hc, 'C', { r: 14 }) + A(hn, 'N', { r: 14 });
    s += curve(P(o.x + 25, o.y), P(h.x - 14, h.y - 4), { bow: -10, size: 7 });
    s += curve(P(h.x + 18, h.y - 4), P(hc.x - 6, hc.y - 15), { bow: -10, size: 7 });
    return s;
  }],
  ['THE CYANOHYDRIN, AND CN⁻ IS BACK', 'OH and C≡N on one carbon', (Q) => {
    const c = Q(64, 120);
    const m = centre(c, [
      { deg: 90, len: 52, l: 'OH', kind: 'hi' },
      { deg: 150, len: 48, l: 'CH₃' },
      { deg: 210, len: 48, l: 'CH₃' },
    ]);
    const nt = nitrile(c, 345, 16, 'hi');
    return m.s + nt.s + T(Q, 196, 76, '+  CN⁻');
  }],
  ['IN STRONG BASE IT RUNS BACKWARDS', 'O⁻ re-forms C=O and pushes out CN⁻', (Q) => {
    const c = Q(74, 128);
    const m = centre(c, [
      { deg: 90, len: 54, l: 'O', key: 'O', kind: 'warn' },
      { deg: 150, len: 48, l: 'CH₃' },
      { deg: 210, len: 48, l: 'CH₃' },
    ]);
    let s = m.s;
    const nt = nitrile(c, 345, 16, 'hi');
    s += nt.s;
    const o = m.ends.O;
    s += lonePair(o.x, o.y, 180, { dist: 21 }) + lonePair(o.x, o.y, 270, { dist: 21 }) + lonePair(o.x, o.y, 0, { dist: 21 });
    s += charge(Q, 56, 58, '−');
    s += curve(P(o.x + 25, o.y + 5), P(c.x + 7, c.y - 30), { bow: -12, size: 7 });
    const mid = P((c.x + nt.cn.x) / 2, (c.y + nt.cn.y) / 2);
    s += curve(P(mid.x, mid.y - 6), P(nt.cn.x - 4, nt.cn.y - 16), { bow: -12, size: 7 });
    s += T(Q, 170, 72, 'after base has', { cls: 'fg-tag', size: 11 });
    s += T(Q, 170, 88, 'removed the O–H H⁺', { cls: 'fg-tag', size: 11 });
    return s;
  }],
];

FIGURES.push({
  id: 'cyanohydrin-mechanism',
  section: 'hydrates-cyanohydrins',
  anchor: '<h3>Cyanohydrins: addition of cyanide</h3>',
  alt: 'Cyanohydrin formation from acetone, in four panels. First, the lone pair on the carbon of cyanide attacks the carbonyl carbon while the pi electrons move onto oxygen. Second, the alkoxide takes the proton from H–C≡N, and the H–C bond electrons stay on that carbon, making a new cyanide ion. Third, the product: acetone cyanohydrin, with an OH and a C≡N on one carbon, and cyanide released. Fourth, the reverse in strong base: once base has removed the O–H proton, the alkoxide lone pair re-forms the C=O and the carbon–cyanide bond breaks, pushing cyanide out.',
  viewBox: '0 0 760 440',
  build() { return gridFigure(cyanoCells, 2, 364, 204, 16, 16, 8, 8, [0, 0, 0, 'warn']); },
  caption: 'Acetone and HCN with a little cyanide. The cyanide that attacks in the first panel is replaced in the second, which is why a small amount is enough.',
});

FIGURES.push({
  id: 'l-cyanohydrin-mechanism',
  lessons: ['hydrates-cyanohydrins'],
  alt: 'Cyanohydrin formation from acetone, in three stacked panels: cyanide attacks the carbonyl carbon as the pi electrons move onto oxygen; the alkoxide takes the proton from HCN, which becomes cyanide; the cyanohydrin forms and cyanide is released.',
  viewBox: '0 0 340 632',
  build() { return gridFigure(cyanoCells.slice(0, 3), 1, 324, 196, 0, 14, 8, 8); },
  caption: 'Cyanide enters in the first panel and is made again in the second.',
});

FIGURES.push({
  id: 'l-cyanohydrin-reverse',
  lessons: ['hydrates-cyanohydrins'],
  alt: 'The cyanohydrin alkoxide in strong base: the oxygen lone pair re-forms the C=O double bond and the carbon–cyanide bond breaks, pushing cyanide out.',
  viewBox: '0 0 340 212',
  build() { return gridFigure(cyanoCells.slice(3), 1, 324, 196, 0, 0, 8, 8, ['warn']); },
  caption: 'The first panel of the mechanism, run backwards.',
});

/* ======================================================================
   8. What the nitrile becomes, and where the Greek letters start.
   ====================================================================== */
/* Acetone cyanohydrin's carbon skeleton, drawn with the old carbonyl carbon
   at c: OH up, a methyl left and down, and the new group to the right. */
function skeleton(c, right) {
  return centre(c, [
    { deg: 90, len: 46, l: 'OH' },
    { deg: 180, len: 48, l: 'CH₃' },
    { deg: 270, len: 46, l: 'CH₃' },
  ]).s + right;
}
const productCells = [
  ['THE CYANOHYDRIN', 'the nitrile carbon is bonded to the C–OH', (Q) => {
    const c = Q(110, 100);
    return skeleton(c, nitrile(c, 0, 16, 'hi').s);
  }],
  ['H₃O⁺, HEAT: C≡N BECOMES COOH', 'an α-hydroxy acid', (Q) => {
    const c = Q(80, 100);
    const k = armEnd(c, 0, 50);
    let r = bond(c, k, { rFrom: 16, rTo: 14 });
    const o1 = armEnd(k, 60, 40), o2 = armEnd(k, 300, 42);
    r += bond(k, o1, { rFrom: 14, rTo: 14, order: 2 }) + A(o1, 'O', { r: 14 });
    r += bond(k, o2, { rFrom: 14, rTo: 16 }) + A(o2, 'OH');
    r += A(k, 'C', { r: 14, kind: 'hi' });
    let s = skeleton(c, r);
    s += text(k.x, k.y + 32, 'C1', { cls: 'fg-tag-warn', size: 11 });
    s += text(c.x + 21, c.y - 20, 'α', { cls: 'fg-tag-warn', size: 11 });
    s += T(Q, 252, 70, 'an acid counts', { cls: 'fg-tag', size: 11 });
    s += T(Q, 252, 86, 'from its COOH', { cls: 'fg-tag', size: 11 });
    s += T(Q, 252, 102, 'carbon: C1', { cls: 'fg-tag', size: 11 });
    return s;
  }],
  ['LiAlH₄: C≡N BECOMES CH₂NH₂', 'a β-amino alcohol', (Q) => {
    const c = Q(72, 100);
    const k = armEnd(c, 0, 54), nn = armEnd(k, 0, 54);
    let r = bond(c, k, { rFrom: 16, rTo: 19 }) + bond(k, nn, { rFrom: 19, rTo: 19 });
    r += A(k, 'CH₂', { r: 19, kind: 'hi' }) + A(nn, 'NH₂', { r: 19 });
    let s = skeleton(c, r);
    s += text(c.x + 21, c.y - 20, 'α', { cls: 'fg-tag-warn', size: 11 });
    s += text(k.x, k.y + 34, 'β', { cls: 'fg-tag-warn', size: 11 });
    s += T(Q, 256, 136, 'an alcohol counts', { cls: 'fg-tag', size: 11 });
    s += T(Q, 256, 152, 'from its C–OH', { cls: 'fg-tag', size: 11 });
    s += T(Q, 256, 168, 'carbon: α', { cls: 'fg-tag', size: 11 });
    return s;
  }],
  ['LOSE H₂O: A C=C FORMS', 'an α,β-unsaturated nitrile', (Q) => {
    const c = Q(90, 108);
    let s = '';
    const up = armEnd(c, 90, 48), left = armEnd(c, 210, 50);
    s += bond(c, up, { rFrom: 16, rTo: 19, order: 2, cls: 'fg-bond-hi' }) + A(up, 'CH₂', { r: 19, kind: 'hi' });
    s += bond(c, left, { rFrom: 16, rTo: 19 }) + A(left, 'CH₃', { r: 19 });
    const nt = nitrile(c, 330, 16, 'hi');
    s += nt.s + A(c, 'C', { kind: 'warn' });
    s += text(c.x - 26, c.y - 10, 'α', { cls: 'fg-tag-warn', size: 11 });
    s += text(up.x + 30, up.y + 4, 'β', { cls: 'fg-tag-warn', size: 11 });
    s += text(nt.cn.x + 4, nt.cn.y - 22, 'C1', { cls: 'fg-tag-warn', size: 11 });
    s += T(Q, 250, 70, 'an H from a CH₃', { cls: 'fg-tag', size: 11 });
    s += T(Q, 250, 86, 'and the OH leave', { cls: 'fg-tag', size: 11 });
    return s;
  }],
];

FIGURES.push({
  id: 'cyanohydrin-products',
  section: 'hydrates-cyanohydrins',
  anchor: '<h3>Cyanohydrins: addition of cyanide</h3>',
  alt: 'Four panels built on acetone cyanohydrin: a carbon carrying an OH, two methyls and a C≡N. Hydrolysis with aqueous acid and heat turns the C≡N into COOH; the COOH carbon is C1 and the carbon holding the OH is alpha, giving an alpha-hydroxy acid. LiAlH4 turns the C≡N into CH2NH2; an alcohol counts from its own C–OH carbon, which is alpha, so the CH2 carrying the NH2 is beta, giving a beta-amino alcohol. Losing water, an H from one methyl and the OH, puts a C=C between the old carbonyl carbon and that CH2, giving an alpha,beta-unsaturated nitrile in which the nitrile carbon is C1, the old carbonyl carbon alpha and the CH2 beta.',
  viewBox: '0 0 760 472',
  build() { return gridFigure(productCells, 2, 364, 220, 16, 16, 8, 8, ['hi', 0, 0, 0], WIDE); },
  caption: 'One skeleton, three products. The Greek letters are read from the group that names each product.',
});

FIGURES.push({
  id: 'l-cyanohydrin-products',
  lessons: ['hydrates-cyanohydrins'],
  alt: 'Four stacked panels built on acetone cyanohydrin: the cyanohydrin; hydrolysis to an alpha-hydroxy acid, with the COOH carbon as C1 and the OH carbon alpha; LiAlH4 reduction to a beta-amino alcohol, with the OH carbon alpha and the CH2NH2 carbon beta; and loss of water to an alpha,beta-unsaturated nitrile.',
  viewBox: '0 0 340 938',
  build() { return gridFigure(productCells, 1, 324, 220, 0, 14, 8, 8, ['hi', 0, 0, 0], WIDE); },
  caption: 'The Greek letters are read from the group that names each product.',
});

/* ======================================================================
   9. The bisulfite adduct, and how it pulls a carbonyl into water.
   ====================================================================== */
const bisulfiteCells = [
  ['BISULFITE ADDS THROUGH SULFUR', 'a salt: the new bond is C–S', (Q) => {
    let s = T(Q, 50, 80, 'CH₃CHO');
    s += T(Q, 50, 102, '+ Na⁺ HSO₃⁻', { cls: 'fg-tag', size: 11 });
    const a = Q(104, 110), b = Q(136, 110);
    s += eqm(a.x, b.x, a.y);
    const c = Q(214, 106);
    const m = centre(c, [
      { deg: 90, len: 46, l: 'OH' },
      { deg: 180, len: 40, l: 'H' },
      { deg: 270, len: 46, l: 'CH₃' },
      { deg: 0, len: 56, l: 'SO₃⁻', kind: 'hi' },
    ]);
    s += m.s + T(Q, 292, 146, 'Na⁺', { cls: 'fg-tag', size: 11 });
    return s;
  }],
  ['SHAKE WITH AQUEOUS NaHSO₃', 'acid or base later releases the aldehyde', (Q) => {
    let s = '';
    const top = Q(70, 48), bot = Q(70, 110);
    s += panel(top.x, top.y, 180, 56, { r: 6 });
    s += panel(bot.x, bot.y, 180, 56, { r: 6, kind: 'hi' });
    s += T(Q, 160, 72, 'organic layer', { cls: 'fg-tag', size: 11 });
    s += T(Q, 160, 92, 'everything else', { cls: 'fg-tag-mut', size: 11 });
    s += T(Q, 160, 134, 'water layer', { cls: 'fg-tag', size: 11 });
    s += T(Q, 160, 154, 'the adduct salt', { cls: 'fg-tag-good', size: 11 });
    return s;
  }],
];

FIGURES.push({
  id: 'bisulfite-adduct',
  section: 'hydrates-cyanohydrins',
  anchor: '<h3>Bisulfite adducts, and a use for a bad reaction</h3>',
  alt: 'Two panels. Left: acetaldehyde plus sodium bisulfite in equilibrium with the adduct, a carbon carrying an OH, a hydrogen, a methyl and an SO3 minus group bonded through sulfur, with a sodium counterion. Right: a two-layer mixture; the organic layer keeps everything else, and the water layer holds the adduct salt. Adding acid or base later releases the aldehyde.',
  viewBox: '0 0 760 226',
  build() { return gridFigure(bisulfiteCells, 2, 364, 210, 16, 16, 8, 8, [], WIDE); },
  caption: 'The adduct is a salt, so it goes where salts go: into the water.',
});

FIGURES.push({
  id: 'l-bisulfite-adduct',
  lessons: ['hydrates-cyanohydrins'],
  alt: 'Two stacked panels: acetaldehyde plus sodium bisulfite in equilibrium with the adduct, bonded through sulfur; and a two-layer mixture with the adduct salt in the water layer and everything else in the organic layer.',
  viewBox: '0 0 340 450',
  build() { return gridFigure(bisulfiteCells, 1, 324, 210, 0, 14, 8, 8, [], WIDE); },
  caption: 'A salt goes into the water layer.',
});

/* ======================================================================
   10. Three nucleophiles, one addition: the summary.
   ====================================================================== */
FIGURES.push({
  id: 'three-nucleophiles-one-addition',
  section: 'hydrates-cyanohydrins',
  anchor: '<h3>What carries forward</h3>',
  alt: 'The same ketone drawn three times after addition: a gem-diol from water, a cyanohydrin from cyanide and a bisulfite adduct from sodium bisulfite. Each has an OH and the new group on the old carbonyl carbon.',
  viewBox: '0 0 760 236',
  build() {
    let s = '';
    const adduct = (c, right) => {
      const r1 = armEnd(c, 250, 44), r2 = armEnd(c, 290, 44);
      let g = bond(c, r1, { rFrom: 16, rTo: 13 }) + atom(r1.x, r1.y, 'R', { r: 13 });
      g += bond(c, r2, { rFrom: 16, rTo: 13 }) + atom(r2.x, r2.y, 'R', { r: 13 });
      const oh = armEnd(c, 140, 56), nu = armEnd(c, 40, 56);
      g += bond(c, oh, { rFrom: 16, rTo: 17 }) + atom(oh.x, oh.y, 'OH', { r: 17 });
      g += bond(c, nu, { rFrom: 16, rTo: 20 }) + atom(nu.x, nu.y, right, { r: 20, kind: 'hi' });
      g += atom(c.x, c.y, 'C', { kind: 'warn' });
      return g;
    };
    const col = (x, t, lab, right, sub) =>
      panel(x, 8, 236, 220) + tag(x + 118, 32, t) + adduct(P(x + 118, 114), right) +
      text(x + 118, 190, lab, { cls: 'fg-tag-good', size: 11 }) + text(x + 118, 212, sub, { cls: 'fg-sm', size: 10.5 });
    s += col(8, 'WATER', 'a gem-diol (hydrate)', 'OH', 'usually far to the left');
    s += col(262, 'HCN + a little CN⁻', 'a cyanohydrin', 'C≡N', 'makes a C–C bond');
    s += col(516, 'NaHSO₃', 'a bisulfite adduct', 'SO₃⁻', 'a salt, used to purify');
    return s;
  },
  caption: 'Three nucleophiles, one addition. Only the group beside the OH changes.',
});

export default FIGURES;
