/* Figures for the aldehyde-oxidation notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every figure here is drawn as "cells", the pattern hydrates-cyanohydrins
   uses: one step of a mechanism, or one structure, drawn inside a box at an
   offset. The notes page lays the cells out two or three across; the lesson
   copy (id prefix l-) stacks the same cells one above the other at 340 wide.
   So the notes and the lesson show exactly the same drawing. Text inside a
   cell is fg-lbl or fg-tag only, which is what a lesson figure may use. */
import { atom, bond, arrow, curve, lonePair, text, tag, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts } from '../lib/ochem-skeletal.mjs';
import { armEnd } from '../lib/ochem-helpers.mjs';

const FIGURES = [];
const r2 = (v) => Math.round(v * 100) / 100;

/* ------------------------------------------------------------ helpers --- */

/* A cell: a panel with a title tag at the top and a one-line result tag at
   the bottom. `draw(Q)` receives a point maker already shifted to the cell's
   corner, so every cell is written in its own 0..cw coordinates. */
const CW = 244;
function cell(ox, oy, w, h, title, foot, draw, opts = {}) {
  const dx = ox + (w - (opts.cw || CW)) / 2;
  const Q = (x, y) => P(dx + x, oy + y);
  let s = panel(ox, oy, w, h, opts.kind ? { kind: opts.kind } : {});
  s += tag(ox + w / 2, oy + 22, title);
  if (foot) s += text(ox + w / 2, oy + h - 14, foot, { cls: 'fg-tag-good', size: 11 });
  s += draw(Q);
  return s;
}

function gridFigure(cells, cols, w, h, gapX = 16, gapY = 16, x0 = 8, y0 = 8, kinds = [], cw = CW) {
  let s = '';
  cells.forEach(([title, foot, draw], i) => {
    const col = i % cols, row = Math.floor(i / cols);
    s += cell(x0 + col * (w + gapX), y0 + row * (h + gapY), w, h, title, foot, draw, { kind: kinds[i] || null, cw });
  });
  return s;
}
/* Height of a stacked (one-column) lesson copy. */
const stackH = (n, h, gap = 14) => 8 + n * h + (n - 1) * gap + 8;

/* Text placed in cell coordinates. */
const T = (Q, x, y, s, o = {}) => { const p = Q(x, y); return text(p.x, p.y, s, { cls: 'fg-lbl', size: 13, ...o }); };
const Tg = (Q, x, y, s, o = {}) => T(Q, x, y, s, { cls: 'fg-tag', size: 11, ...o });
const charge = (Q, x, y, s) => T(Q, x, y, s, { cls: 'fg-warn', size: 15 });

/* A labelled atom, and the radius a label needs. */
const A = (p, l, o = {}) => atom(p.x, p.y, l, o);
const rOf = (l) => (l.length >= 5 ? 23 : l.length >= 3 ? 19 : l.length === 2 ? 16 : 14);
const B = (a, b, la, lb, o = {}) => bond(a, b, { rFrom: la ? rOf(la) : 0, rTo: lb ? rOf(lb) : 0, ...o });

/* A carbon (labelled C) with groups at screen angles, measured
   counterclockwise from east. Each group is { deg, len, l, order, kind, key }.
   The carbon is drawn last so bonds stop at its edge. */
function centre(c, groups, ckind = 'warn') {
  let s = '';
  const ends = {};
  for (const g of groups) {
    const e = armEnd(c, g.deg, g.len || 48);
    s += bond(c, e, { rFrom: 16, rTo: rOf(g.l), order: g.order || 1, cls: g.cls });
    s += A(e, g.l, { r: rOf(g.l), kind: g.kind });
    ends[g.key || g.l] = e;
  }
  s += A(c, 'C', { kind: ckind });
  return { s, ends };
}

/* A fishhook: one barb, because it carries one electron (copied from the
   radical figures in build-ochem-figures.mjs). */
function fishhook(a, b, opts = {}) {
  const bow = opts.bow ?? 30;
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bow, cy = my + (dx / len) * bow;
  let ux = b.x - cx, uy = b.y - cy;
  const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
  const size = opts.size ?? 8;
  const px = -uy, py = ux;
  const side = opts.side ?? 1;
  const bx = b.x - ux * size, by = b.y - uy * size;
  const h = size * 0.6 * side;
  return `<path class="fg-arrow" d="M${r2(a.x)} ${r2(a.y)} Q${r2(cx)} ${r2(cy)} ${r2(bx)} ${r2(by)}"></path>` +
         `<path class="fg-head" d="M${r2(b.x)} ${r2(b.y)} L${r2(bx + px * h)} ${r2(by + py * h)} L${r2(bx)} ${r2(by)} Z"></path>`;
}
/* The single dot that makes a species a radical. */
const dot = (p) => `<circle class="fg-lp" cx="${r2(p.x)}" cy="${r2(p.y)}" r="3.4"></circle>`;
/* A small coral dot that marks an atom (the anomeric carbon). */
const mark = (p) => `<circle class="fg-atom-warn" cx="${r2(p.x)}" cy="${r2(p.y)}" r="5"></circle>`;

/* An equilibrium: a forward arrow above a reverse arrow. */
const eqm = (x1, x2, y) => arrow(P(x1, y - 4), P(x2, y - 4), { size: 7 }) + arrow(P(x2, y + 4), P(x1, y + 4), { size: 7 });

/* ======================================================================
   1. One hydrogen: butanal against butanone.
   ====================================================================== */
const hydrogenCells = [
  ['BUTANAL', 'one H on the C=O carbon: it oxidizes', (Q) => {
    const c = Q(150, 112);
    const m = centre(c, [
      { deg: 90, len: 52, l: 'O', order: 2 },
      { deg: 330, len: 50, l: 'H', kind: 'hi' },
    ]);
    const v1 = armEnd(c, 210, 50), v2 = armEnd(v1, 150, 40), v3 = armEnd(v2, 210, 40);
    let s = bond(c, v1, { rFrom: 16, rTo: 0 }) + sk(v1, v2) + sk(v2, v3);
    s += m.s;
    const o = m.ends.O;
    s += lonePair(o.x, o.y, 225, { dist: 21 }) + lonePair(o.x, o.y, 315, { dist: 21 });
    s += Tg(Q, 212, 164, 'this H', { cls: 'fg-tag-good' });
    return s;
  }],
  ['BUTANONE', 'two carbons, no H: no reaction', (Q) => {
    const c = Q(130, 112);
    const m = centre(c, [
      { deg: 90, len: 52, l: 'O', order: 2 },
      { deg: 330, len: 52, l: 'CH₃' },
    ]);
    const v1 = armEnd(c, 210, 50), v2 = armEnd(v1, 150, 40);
    let s = bond(c, v1, { rFrom: 16, rTo: 0 }) + sk(v1, v2);
    s += m.s;
    const o = m.ends.O;
    s += lonePair(o.x, o.y, 225, { dist: 21 }) + lonePair(o.x, o.y, 315, { dist: 21 });
    return s;
  }],
];

FIGURES.push({
  id: 'one-hydrogen',
  section: 'aldehyde-oxidation',
  anchor: '<h3>The difference is one hydrogen</h3>',
  alt: 'Two panels. Left: butanal, a three-carbon chain on a carbonyl carbon that also carries one hydrogen, highlighted. Right: butanone, whose carbonyl carbon carries an ethyl group and a methyl group and no hydrogen.',
  viewBox: '0 0 760 220',
  build() { return gridFigure(hydrogenCells, 2, 364, 204); },
  caption: 'Look at what else each carbonyl carbon holds. Only butanal has an H there to trade for an O.',
});
FIGURES.push({
  id: 'l-one-hydrogen',
  lessons: ['aldehyde-oxidation'],
  alt: 'Two stacked panels: butanal, whose carbonyl carbon carries one hydrogen, highlighted; and butanone, whose carbonyl carbon carries two carbons and no hydrogen.',
  viewBox: `0 0 340 ${stackH(2, 204)}`,
  build() { return gridFigure(hydrogenCells, 1, 324, 204, 0, 14); },
  caption: 'Only butanal has an H on the carbonyl carbon.',
});

/* ======================================================================
   2. Jones: Cr(VI) oxidizes the hydrate, by way of a chromate ester.
   ====================================================================== */
function rCarbon(c, groups) {
  return centre(c, [{ deg: 180, len: 46, l: 'R' }, ...groups]);
}
const jonesCells = [
  ['IN WATER: THE HYDRATE', 'H and OH on one carbon', (Q) => {
    let s = Tg(Q, 122, 50, 'R–CHO + H₂O ⇌');
    const c = Q(116, 118);
    const m = rCarbon(c, [
      { deg: 90, len: 44, l: 'OH' },
      { deg: 270, len: 44, l: 'H', kind: 'hi' },
      { deg: 0, len: 50, l: 'OH', kind: 'hi' },
    ]);
    return s + m.s;
  }],
  ['AN OH OF THE HYDRATE ATTACKS Cr', 'then H⁺ moves and H₂O leaves Cr', (Q) => {
    const c = Q(62, 116);
    const m = centre(c, [
      { deg: 180, len: 42, l: 'R' },
      { deg: 90, len: 44, l: 'OH' },
      { deg: 250, len: 42, l: 'H' },
    ]);
    let s = m.s;
    const o = Q(112, 116), h = Q(112, 158);
    s += bond(c, o, { rFrom: 16, rTo: 16 }) + B(o, h, 'O', 'H');
    s += A(o, 'O', { kind: 'hi' }) + A(h, 'H', { r: 14 });
    s += lonePair(o.x, o.y, 300, { dist: 21 }) + lonePair(o.x, o.y, 225, { dist: 21 });
    // chromic acid, H2CrO4: two Cr=O and two Cr-OH
    const cr = Q(182, 116);
    const oUp = armEnd(cr, 90, 44), oDn = armEnd(cr, 270, 44);
    const oh1 = armEnd(cr, 30, 46), oh2 = armEnd(cr, 330, 46);
    s += bond(cr, oUp, { rFrom: 16, rTo: 14, order: 2 }) + bond(cr, oDn, { rFrom: 16, rTo: 14, order: 2 });
    s += bond(cr, oh1, { rFrom: 16, rTo: 16 }) + bond(cr, oh2, { rFrom: 16, rTo: 16 });
    s += A(oUp, 'O', { r: 14 }) + A(oDn, 'O', { r: 14 }) + A(oh1, 'OH', { r: 16 }) + A(oh2, 'OH', { r: 16 });
    s += A(cr, 'Cr', { kind: 'warn' });
    // the O lone pair attacks Cr; a Cr=O pi bond moves onto its O
    s += curve(P(o.x + 14, o.y - 18), P(cr.x - 17, cr.y - 5), { bow: -14, size: 7 });
    s += curve(P(cr.x - 6, cr.y - 24), P(oUp.x - 15, oUp.y + 6), { bow: -10, size: 7 });
    return s;
  }],
  ['WATER TAKES THE H AS Cr LEAVES', 'Cr gains two electrons: Cr(VI) → Cr(IV)', (Q) => {
    const c = Q(84, 124);
    const m = centre(c, [
      { deg: 90, len: 50, l: 'H', kind: 'hi' },
      { deg: 150, len: 44, l: 'R' },
      { deg: 235, len: 44, l: 'OH' },
    ]);
    let s = m.s;
    const o = Q(132, 124), cr = Q(190, 124);
    s += bond(c, o, { rFrom: 16, rTo: 14 }) + bond(o, cr, { rFrom: 14, rTo: 24 });
    s += A(o, 'O', { r: 14 }) + A(cr, 'CrO₂OH', { r: 24, kind: 'warn' });
    const w = Q(164, 58);
    s += A(w, 'H₂O', { r: 19 });
    s += lonePair(w.x, w.y, 180, { dist: 24 });
    const h = m.ends.H;
    // water's lone pair takes the H; the C-H pair becomes the new C=O pi bond;
    // the O-Cr pair leaves with chromium
    s += curve(P(w.x - 28, w.y + 4), P(h.x + 15, h.y - 2), { bow: 10, size: 7 });
    s += curve(P(c.x + 5, c.y - 30), P(c.x + 30, c.y - 6), { bow: -10, size: 7 });
    s += curve(P(o.x + 22, o.y + 4), P(cr.x - 12, cr.y + 22), { bow: 12, size: 7 });
    return s;
  }],
  ['THE CARBOXYLIC ACID', 'Cr(IV) goes on to Cr(III): orange → green', (Q) => {
    const c = Q(96, 112);
    const m = rCarbon(c, [
      { deg: 90, len: 50, l: 'O', order: 2 },
      { deg: 0, len: 50, l: 'OH' },
    ]);
    return m.s + Tg(Q, 122, 166, '+ H₃O⁺ + a Cr(IV) species');
  }],
];

FIGURES.push({
  id: 'jones-hydrate',
  section: 'aldehyde-oxidation',
  anchor: '<h3>Chromium(VI) oxidizes the hydrate</h3>',
  alt: 'Jones oxidation of an aldehyde in four panels. First, in water the aldehyde forms its hydrate, a carbon carrying R, H and two OH groups, with one H and one OH highlighted. Second, a lone pair on one hydrate oxygen attacks the chromium of chromic acid, H2CrO4, while a Cr=O pi bond moves onto its oxygen. Third, in the chromate ester R–CH(OH)–O–CrO2OH, water takes the hydrogen on carbon, the C–H electrons become the new C=O bond, and the O–Cr electrons leave with chromium. Fourth, the product is the carboxylic acid R–COOH, plus H3O+ and a chromium(IV) species.',
  viewBox: '0 0 760 440',
  build() { return gridFigure(jonesCells, 2, 364, 204, 16, 16, 8, 8, ['hi', 0, 0, 'good']); },
  caption: 'Read the panels in order. The hydrogen that water removes in the third panel is the one the aldehyde had all along.',
});
FIGURES.push({
  id: 'l-jones-hydrate',
  lessons: ['aldehyde-oxidation'],
  alt: 'Four stacked panels: the hydrate forms in water; a hydrate OH attacks the chromium of H2CrO4; in the chromate ester, water removes the hydrogen on carbon as chromium leaves with the O–Cr electrons; the carboxylic acid results.',
  viewBox: `0 0 340 ${stackH(4, 204)}`,
  build() { return gridFigure(jonesCells, 1, 324, 204, 0, 14, 8, 8, ['hi', 0, 0, 'good']); },
  caption: 'Water removes the aldehyde&rsquo;s own hydrogen in the third panel.',
});

/* ======================================================================
   3. Pinnick: chlorite adds to the C=O, then a five-atom ring fragments.
   ====================================================================== */
const pinnickCells = [
  ['CHLORITE ADDS TO THE C=O', 'the O⁻ then takes H⁺ from the buffer', (Q) => {
    const c = Q(70, 124);
    const m = centre(c, [
      { deg: 90, len: 52, l: 'O', order: 2, key: 'O' },
      { deg: 210, len: 44, l: 'R' },
      { deg: 330, len: 42, l: 'H' },
    ]);
    let s = m.s;
    const o = m.ends.O;
    s += lonePair(o.x, o.y, 225, { dist: 21 }) + lonePair(o.x, o.y, 315, { dist: 21 });
    // chlorite drawn with octets: -O-Cl(+)-O-
    const oa = Q(146, 100), cl = Q(188, 100), ob = Q(228, 100);
    s += B(oa, cl, 'O', 'Cl') + B(cl, ob, 'Cl', 'O');
    s += A(oa, 'O', { kind: 'hi' }) + A(cl, 'Cl') + A(ob, 'O');
    s += lonePair(oa.x, oa.y, 180, { dist: 21 }) + lonePair(oa.x, oa.y, 270, { dist: 21 }) + lonePair(oa.x, oa.y, 90, { dist: 21 });
    s += lonePair(cl.x, cl.y, 270, { dist: 21 }) + lonePair(cl.x, cl.y, 90, { dist: 21 });
    s += lonePair(ob.x, ob.y, 270, { dist: 21 }) + lonePair(ob.x, ob.y, 90, { dist: 21 }) + lonePair(ob.x, ob.y, 0, { dist: 21 });
    s += charge(Q, 132, 76, '−') + charge(Q, 202, 76, '+') + charge(Q, 242, 76, '−');
    s += curve(P(oa.x - 26, oa.y + 4), P(c.x + 17, c.y - 6), { bow: 14, size: 7 });
    s += curve(P(c.x + 8, c.y - 24), P(o.x + 16, o.y + 9), { bow: 12, size: 7 });
    return s;
  }],
  ['THE C–H BREAKS AS Cl LEAVES O', 'H moves to O⁻; C=O forms; Cl keeps the pair', (Q) => {
    const c = Q(78, 124);
    const m = centre(c, [
      { deg: 90, len: 46, l: 'H', kind: 'hi', key: 'H' },
      { deg: 180, len: 44, l: 'R' },
      { deg: 240, len: 44, l: 'OH' },
    ]);
    let s = m.s;
    const h = m.ends.H;
    const oa = armEnd(c, 0, 50), cl = armEnd(oa, 50, 48), ob = armEnd(cl, 140, 48);
    s += bond(c, oa, { rFrom: 16, rTo: 14 }) + B(oa, cl, 'O', 'Cl') + B(cl, ob, 'Cl', 'O');
    s += A(oa, 'O', { r: 14 }) + A(cl, 'Cl') + A(ob, 'O', { kind: 'hi' });
    s += lonePair(oa.x, oa.y, 60, { dist: 20 }) + lonePair(oa.x, oa.y, 120, { dist: 20 });
    s += lonePair(cl.x, cl.y, 330, { dist: 21 }) + lonePair(cl.x, cl.y, 30, { dist: 21 });
    s += lonePair(ob.x, ob.y, 160, { dist: 21 }) + lonePair(ob.x, ob.y, 235, { dist: 21 }) + lonePair(ob.x, ob.y, 295, { dist: 21 });
    s += text(cl.x + 4, cl.y - 22, '+', { cls: 'fg-warn', size: 15 });
    s += text(ob.x + 25, ob.y - 6, '−', { cls: 'fg-warn', size: 15 });
    // O- lone pair takes the H; C-H pair becomes C=O pi; O-Cl pair goes to Cl
    s += curve(P(ob.x - 24, ob.y + 10), P(h.x + 15, h.y - 3), { bow: 6, size: 7 });
    s += curve(P(c.x + 5, c.y - 28), P(c.x + 28, c.y - 7), { bow: -10, size: 7 });
    const mo = P((oa.x + cl.x) / 2 + 5, (oa.y + cl.y) / 2 + 4);
    s += curve(mo, P(cl.x + 17, cl.y + 4), { bow: 10, size: 7 });
    return s;
  }],
  ['THE ACID, AND HOCl', 'chlorine goes from +3 to +1', (Q) => {
    const c = Q(80, 112);
    const m = rCarbon(c, [
      { deg: 90, len: 50, l: 'O', order: 2 },
      { deg: 0, len: 50, l: 'OH' },
    ]);
    let s = m.s + T(Q, 158, 116, '+');
    const h = Q(180, 112), o = Q(214, 112), cl = armEnd(o, 285, 44);
    s += B(h, o, 'H', 'O') + B(o, cl, 'O', 'Cl');
    s += A(h, 'H', { r: 14 }) + A(o, 'O') + A(cl, 'Cl');
    return s;
  }],
  ['A SCAVENGER USES UP THE HOCl', 'HOCl adds to 2-methylbut-2-ene instead', (Q) => {
    // 2-methylbut-2-ene
    const a1 = Q(20, 132), a2 = Q(44, 118), am = Q(44, 90), a3 = Q(68, 132), a4 = Q(92, 118);
    let s = sk(a1, a2) + sk(a2, am) + ringDouble(a2, a3, Q(44, 150), { inset: 4, gap: 4.4 }) + sk(a3, a4);
    s += arrow(Q(104, 118), Q(138, 118), { size: 7 });
    s += Tg(Q, 121, 104, 'HOCl');
    // 3-chloro-2-methylbutan-2-ol
    const b2 = Q(188, 126), b1 = armEnd(b2, 210, 28), bm = armEnd(b2, 150, 28), b3 = armEnd(b2, 330, 28);
    const b4 = armEnd(b3, 30, 28), oh = armEnd(b2, 90, 30), cl = armEnd(b3, 270, 30);
    s += sk(b2, b1) + sk(b2, bm) + sk(b2, b3) + sk(b3, b4);
    s += bond(b2, oh, { rFrom: 0, rTo: 16 }) + bond(b3, cl, { rFrom: 0, rTo: 16 });
    s += A(oh, 'OH', { r: 16, kind: 'hi' }) + A(cl, 'Cl', { r: 16, kind: 'hi' });
    return s;
  }],
];

FIGURES.push({
  id: 'pinnick-mechanism',
  section: 'aldehyde-oxidation',
  anchor: '<h3>Chlorite adds to the C=O itself</h3>',
  alt: 'The Pinnick oxidation in four panels. First, a lone pair on an oxygen of chlorite, drawn as O(−)–Cl(+)–O(−), attacks the carbonyl carbon of R–CHO while the C=O pi electrons move onto the carbonyl oxygen. Second, in the adduct R–CH(OH)–O–Cl(+)–O(−), five atoms form a ring: the O(−) lone pair takes the hydrogen on carbon, the C–H electrons become the new C=O bond, and the O–Cl electrons move onto chlorine. Third, the products are the carboxylic acid R–COOH and hypochlorous acid, H–O–Cl. Fourth, 2-methylbut-2-ene adds HOCl across its double bond, giving an OH on the more substituted carbon and a Cl on the other.',
  viewBox: '0 0 760 440',
  build() { return gridFigure(pinnickCells, 2, 364, 204, 16, 16, 8, 8, [0, 0, 'good', 0]); },
  caption: 'The second panel is the oxidation. Follow the highlighted H: it leaves carbon and ends up on the chlorite oxygen.',
});
FIGURES.push({
  id: 'l-pinnick-mechanism',
  lessons: ['aldehyde-oxidation'],
  alt: 'Four stacked panels: chlorite attacks the carbonyl carbon; in the adduct, the chlorite O(−) takes the hydrogen on carbon as the C=O forms and the O–Cl electrons move onto chlorine; the products are the carboxylic acid and HOCl; 2-methylbut-2-ene uses up the HOCl.',
  viewBox: `0 0 340 ${stackH(4, 204)}`,
  build() { return gridFigure(pinnickCells, 1, 324, 204, 0, 14, 8, 8, [0, 0, 'good', 0]); },
  caption: 'Follow the highlighted H from carbon to the chlorite oxygen.',
});

/* ======================================================================
   4. Permanganate, and what each reagent spares.
   ====================================================================== */
const permCells = [
  ['1. KMnO₄, HO⁻, WARM · 2. H₃O⁺', 'purple MnO₄⁻ → brown MnO₂ solid', (Q) => {
    const c1 = Q(58, 116);
    const m1 = centre(c1, [
      { deg: 90, len: 48, l: 'O', order: 2 },
      { deg: 210, len: 40, l: 'R' },
      { deg: 330, len: 40, l: 'H', kind: 'hi' },
    ]);
    const c2 = Q(184, 116);
    const m2 = centre(c2, [
      { deg: 90, len: 48, l: 'O', order: 2 },
      { deg: 210, len: 40, l: 'R' },
      { deg: 330, len: 42, l: 'OH', kind: 'hi' },
    ]);
    return m1.s + m2.s + arrow(Q(100, 104), Q(140, 104), { size: 7 }) + Tg(Q, 122, 168, 'Mn(VII) → Mn(IV)');
  }],
];
FIGURES.push({
  id: 'permanganate',
  section: 'aldehyde-oxidation',
  anchor: '<h3>Permanganate: strong and unselective</h3>',
  alt: 'An aldehyde R–CHO, with its hydrogen highlighted, is converted by warm basic potassium permanganate followed by acid into the carboxylic acid R–COOH, with the new OH highlighted. Purple permanganate becomes brown manganese dioxide, manganese going from +7 to +4.',
  viewBox: '0 0 380 220',
  build() { return gridFigure(permCells, 1, 364, 204); },
  caption: 'The H on the carbonyl carbon becomes an OH. The color change shows the permanganate being used up.',
});

/* Hex-4-enal, and what a mild or a harsh oxidant makes of it. The chain runs
   C6 (left) to C1 (right); C4=C5 is drawn trans. */
function hexenal(Q, acid) {
  const p = zig(20, 120, 6, 34, 22).map((v) => Q(v.x, v.y));
  let s = sk(p[0], p[1]) + ringDouble(p[1], p[2], Q(71, 140), { inset: 5, gap: 4.4 });
  s += sk(p[2], p[3]) + sk(p[3], p[4]) + sk(p[4], p[5]);
  const o = Q(222, 120);
  s += bond(p[5], o, { rFrom: 0, rTo: 14, order: 2 }) + A(o, 'O', { r: 14 });
  if (acid) {
    const oh = Q(190, 68);
    s += bond(p[5], oh, { rFrom: 0, rTo: 16 }) + A(oh, 'OH', { r: 16, kind: 'hi' });
  }
  s += Tg(Q, 71, 162, 'C=C', { cls: 'fg-tag-warn' });
  return s;
}
const choiceCells = [
  ['HEX-4-ENAL, TRANS C=C', 'an aldehyde and a C=C', (Q) => hexenal(Q, false)],
  ['PINNICK OR Ag₂O', 'the C=C survives', (Q) => hexenal(Q, true)],
  ['HOT KMnO₄', 'the C=C is cut too', (Q) => {
    // butanedioic acid
    const q = zig(56, 120, 4, 36, 24).map((v) => Q(v.x, v.y));
    let s = sk(q[0], q[1]) + sk(q[1], q[2]) + sk(q[2], q[3]);
    const o1 = Q(56, 158), oh1 = Q(22, 100), o2 = Q(164, 58), oh2 = Q(198, 120);
    s += bond(q[0], o1, { rFrom: 0, rTo: 14, order: 2 }) + bond(q[0], oh1, { rFrom: 0, rTo: 16 });
    s += bond(q[3], o2, { rFrom: 0, rTo: 14, order: 2 }) + bond(q[3], oh2, { rFrom: 0, rTo: 16 });
    s += A(o1, 'O', { r: 14 }) + A(oh1, 'OH', { r: 16 }) + A(o2, 'O', { r: 14 }) + A(oh2, 'OH', { r: 16 });
    s += Tg(Q, 150, 160, '+ CH₃COOH');
    return s;
  }],
];
FIGURES.push({
  id: 'reagent-choice',
  section: 'aldehyde-oxidation',
  anchor: '<h3>Choosing the reagent</h3>',
  alt: 'Three panels. First, (E)-hex-4-enal: a six-carbon chain with an aldehyde at C1 and a trans C=C between C4 and C5. Second, the Pinnick reagent or silver oxide gives (E)-hex-4-enoic acid, with the new OH highlighted and the C=C unchanged. Third, hot potassium permanganate also cuts the C=C, giving butanedioic acid, HOOC–CH2–CH2–COOH, plus acetic acid.',
  viewBox: '0 0 760 220',
  build() { return gridFigure(choiceCells, 3, 240, 204, 12, 16, 8, 8, [0, 'good', 'warn']); },
  caption: 'One substrate, two outcomes. The aldehyde carbon ends as a COOH in both; only the C=C decides between them.',
});
FIGURES.push({
  id: 'l-reagent-choice',
  lessons: ['aldehyde-oxidation'],
  alt: 'Three stacked panels: (E)-hex-4-enal; the Pinnick reagent or silver oxide gives hex-4-enoic acid with the C=C kept; hot permanganate cuts the C=C and gives butanedioic acid plus acetic acid.',
  viewBox: `0 0 340 ${stackH(3, 204)}`,
  build() { return gridFigure(choiceCells, 1, 324, 204, 0, 14, 8, 8, [0, 'good', 'warn']); },
  caption: 'Only the C=C decides between the two outcomes.',
});

/* ======================================================================
   5. The metal tests: what the aldehyde gives, and what the metal gets.
   ====================================================================== */
const organicCell = ['THE ALDEHYDE IS OXIDIZED', 'in base it ends as the carboxylate', (Q) => {
  const c1 = Q(58, 116);
  const m1 = centre(c1, [
    { deg: 90, len: 48, l: 'O', order: 2 },
    { deg: 210, len: 40, l: 'R' },
    { deg: 330, len: 40, l: 'H', kind: 'hi' },
  ]);
  const c2 = Q(184, 116);
  const m2 = centre(c2, [
    { deg: 90, len: 48, l: 'O', order: 2 },
    { deg: 210, len: 40, l: 'R' },
    { deg: 330, len: 42, l: 'O', kind: 'hi', key: 'Om' },
  ]);
  const om = m2.ends.Om;
  let s = m1.s + m2.s + arrow(Q(100, 104), Q(140, 104), { size: 7 });
  s += text(om.x + 18, om.y - 12, '−', { cls: 'fg-warn', size: 15 });
  s += Tg(Q, 122, 160, 'gives up two electrons');
  return s;
}];
const silverCell = ['SILVER(I) IS REDUCED', 'Ag⁺ + e⁻ → Ag, twice: the mirror', (Q) => {
  const n1 = Q(64, 70), ag = Q(122, 70), n2 = Q(180, 70);
  let s = B(n1, ag, 'H₃N', 'Ag') + B(ag, n2, 'Ag', 'NH₃');
  s += A(n1, 'H₃N', { r: 19 }) + A(ag, 'Ag', { kind: 'warn' }) + A(n2, 'NH₃', { r: 19 });
  s += charge(Q, 214, 56, '+');
  s += Tg(Q, 122, 106, 'diamminesilver(I), linear');
  s += arrow(Q(122, 112), Q(122, 132), { size: 7 });
  s += bar(Q(40, 138).x, Q(40, 138).y, 164, 10, { kind: 'mut' });
  s += Tg(Q, 122, 164, 'Ag metal plates onto the glass');
  return s;
}];
const copperCell = ['COPPER(II) IS REDUCED', 'each Cu²⁺ gains one electron: Cu(I)', (Q) => {
  let s = A(Q(122, 66), 'Cu²⁺', { r: 22, kind: 'hi' });
  s += Tg(Q, 122, 104, 'deep blue, held by tartrate or citrate');
  s += arrow(Q(122, 112), Q(122, 132), { size: 7 });
  s += bar(Q(62, 138).x, Q(62, 138).y, 120, 12, { kind: 'warn' });
  s += Tg(Q, 122, 166, 'Cu₂O, a brick-red solid');
  return s;
}];

FIGURES.push({
  id: 'tollens-test',
  section: 'aldehyde-oxidation',
  anchor: '<h3>Tollens&rsquo; reagent and the silver mirror</h3>',
  alt: 'Two panels. Left: an aldehyde R–CHO becomes the carboxylate R–COO−, giving up two electrons. Right: the linear diamminesilver(I) ion, H3N–Ag–NH3 with a positive charge, is reduced to silver metal, drawn as a grey layer that plates onto the glass.',
  viewBox: '0 0 760 220',
  build() { return gridFigure([organicCell, silverCell], 2, 364, 204, 16, 16, 8, 8, [0, 'hi']); },
  caption: 'Two electrons leave the aldehyde, and two silver ions take one each.',
});
FIGURES.push({
  id: 'copper-tests',
  section: 'aldehyde-oxidation',
  anchor: '<h3>Fehling&rsquo;s and Benedict&rsquo;s solutions</h3>',
  alt: 'A deep blue copper(II) ion, held by tartrate or citrate, is reduced to copper(I) oxide, Cu2O, drawn as a brick-red solid.',
  viewBox: '0 0 380 220',
  build() { return gridFigure([copperCell], 1, 364, 204, 16, 16, 8, 8, ['hi']); },
  caption: 'The copper half of the reaction. The aldehyde half is the same as in the Tollens&rsquo; figure.',
});
FIGURES.push({
  id: 'l-metal-tests',
  lessons: ['aldehyde-oxidation'],
  alt: 'Three stacked panels: the aldehyde R–CHO becomes the carboxylate R–COO−; the diamminesilver(I) ion is reduced to a silver mirror; blue copper(II) is reduced to brick-red Cu2O.',
  viewBox: `0 0 340 ${stackH(3, 204)}`,
  build() { return gridFigure([organicCell, silverCell, copperCell], 1, 324, 204, 0, 14, 8, 8, [0, 'hi', 'hi']); },
  caption: 'The aldehyde half is the same in every test; only the metal changes.',
});

/* ======================================================================
   6. Sugars: the ring opens, fructose isomerizes, sucrose cannot open.
   ====================================================================== */
const SW = 300, SH = 222;
/* A pyranose ring drawn point-right: v0 = C1 (anomeric), v1 = ring O,
   then C5, C4, C3, C2 going round. Returns the vertices and the bond ink. */
function pyranose(Q, cx, cy, r) {
  const v = polyPts(cx, cy, 6, r, 0).map((p) => Q(p.x, p.y));
  let s = '';
  for (let i = 0; i < 6; i++) {
    const a = v[i], b = v[(i + 1) % 6];
    s += bond(a, b, { rFrom: i === 1 ? 14 : 0, rTo: (i + 1) % 6 === 1 ? 14 : 0 });
  }
  s += A(v[1], 'O', { r: 14 });
  return { v, s };
}

const glucoseCells = [
  ['BASE OPENS THE RING', 'after HO⁻ has taken the H of the C1 OH', (Q) => {
    const g = pyranose(Q, 96, 112, 36);
    const [c1, , c5, c4, c3, c2] = g.v;
    let s = g.s;
    const o1 = armEnd(c1, 0, 46);
    s += bond(c1, o1, { rFrom: 0, rTo: 15 }) + A(o1, 'O', { r: 15, kind: 'warn' });
    s += lonePair(o1.x, o1.y, 270, { dist: 20 }) + lonePair(o1.x, o1.y, 0, { dist: 20 }) + lonePair(o1.x, o1.y, 90, { dist: 20 });
    s += text(o1.x + 18, o1.y - 14, '−', { cls: 'fg-warn', size: 15 });
    const sub = [[c2, 300, 'OH'], [c3, 240, 'OH'], [c4, 180, 'OH'], [c5, 120, 'CH₂OH']];
    for (const [at, deg, l] of sub) {
      const e = armEnd(at, deg, l.length > 2 ? 34 : 30);
      s += bond(at, e, { rFrom: 0, rTo: rOf(l) }) + A(e, l, { r: rOf(l) });
    }
    s += mark(c1);
    s += Tg(Q, c1.x - Q(0, 0).x + 8, c1.y - Q(0, 0).y + 30, 'C1', { cls: 'fg-lbl', size: 13 });
    // O- lone pair forms the C=O; the C1-ring O bond moves onto the ring O
    const ro = g.v[1];
    s += curve(P(o1.x - 8, o1.y - 22), P((c1.x + o1.x) / 2 + 2, c1.y - 6), { bow: 10, size: 7 });
    s += curve(P((c1.x + ro.x) / 2 + 6, (c1.y + ro.y) / 2 + 2), P(ro.x + 14, ro.y - 6), { bow: 12, size: 7 });
    return s;
  }],
  ['THE OPEN-CHAIN ALDEHYDE', 'well under 0.1% of the sugar at a time', (Q) => {
    const p = zig(52, 124, 6, 40, 24).map((v) => Q(v.x, v.y));
    let s = '';
    for (let i = 0; i < 5; i++) s += sk(p[i], p[i + 1]);
    const o = armEnd(p[0], 150, 32);
    s += bond(p[0], o, { rFrom: 0, rTo: 14, order: 2 }) + A(o, 'O', { r: 14, kind: 'hi' });
    const sub = [[p[1], 90, 'OH'], [p[2], 270, 'OH'], [p[3], 90, 'OH'], [p[4], 270, 'OH', 'hi'], [p[5], 330, 'OH']];
    for (const [at, deg, l, kind] of sub) {
      const e = armEnd(at, deg, 30);
      s += bond(at, e, { rFrom: 0, rTo: 16 }) + A(e, l, { r: 16, kind });
    }
    s += mark(p[0]);
    s += text(p[0].x + 6, p[0].y + 22, 'C1', { cls: 'fg-lbl', size: 13 });
    s += text(p[4].x + 24, p[4].y + 10, 'C5', { cls: 'fg-lbl', size: 13 });
    return s;
  }],
];
FIGURES.push({
  id: 'glucose-opening',
  section: 'aldehyde-oxidation',
  anchor: '<h3>Why glucose tests positive and sucrose does not</h3>',
  alt: 'Two panels. Left: glucose as a six-membered ring of five carbons and one oxygen, hydrogens and stereochemistry not shown. C1, the anomeric carbon, is marked; its oxygen carries a negative charge after base removed its hydrogen. A curved arrow from that oxygen forms a C=O, and a second arrow moves the C1–ring-oxygen bond onto the ring oxygen. Right: the open-chain form, a six-carbon zigzag with an aldehyde C=O at C1, highlighted, and OH groups on C2 to C6; the OH on C5 is the former ring oxygen, also highlighted.',
  viewBox: `0 0 760 ${SH + 16}`,
  build() { return gridFigure(glucoseCells, 2, 364, SH, 16, 16, 8, 8, [0, 'good'], SW); },
  caption: 'Hydrogens and stereochemistry are left off. The two highlighted oxygens on the right were joined to C1 in the ring.',
});
FIGURES.push({
  id: 'l-glucose-opening',
  lessons: ['aldehyde-oxidation'],
  alt: 'Two stacked panels: the glucose ring, with C1 marked and arrows showing the C1 oxygen forming a C=O as the ring oxygen takes the bond it shared with C1; and the open-chain aldehyde, with C1 and C5 labelled.',
  viewBox: `0 0 340 ${stackH(2, SH)}`,
  build() { return gridFigure(glucoseCells, 1, 324, SH, 0, 14, 8, 8, [0, 'good'], SW); },
  caption: 'Hydrogens and stereochemistry are left off.',
});

/* Fructose -> enediol -> aldose, drawn as C1 and C2 only. */
const enediolCells = [
  ['FRUCTOSE, C1 AND C2', 'a ketone at C2', (Q) => {
    const c1 = Q(80, 116), c2 = Q(138, 116);
    let s = bond(c1, c2, { rFrom: 16, rTo: 16 });
    const m1 = centre(c1, [{ deg: 90, len: 44, l: 'H', kind: 'hi' }, { deg: 270, len: 44, l: 'H' }, { deg: 180, len: 46, l: 'OH' }]);
    const m2 = centre(c2, [{ deg: 60, len: 48, l: 'O', order: 2 }, { deg: 300, len: 46, l: 'R' }]);
    return s + m1.s + m2.s;
  }],
  ['THE ENEDIOL', 'a C=C with an OH on each carbon', (Q) => {
    const c1 = Q(80, 116), c2 = Q(138, 116);
    let s = bond(c1, c2, { rFrom: 16, rTo: 16, order: 2 });
    const m1 = centre(c1, [{ deg: 120, len: 44, l: 'H' }, { deg: 240, len: 46, l: 'OH' }]);
    const m2 = centre(c2, [{ deg: 60, len: 46, l: 'OH', kind: 'hi' }, { deg: 300, len: 46, l: 'R' }]);
    return s + m1.s + m2.s;
  }],
  ['AN ALDOSE, C1 AND C2', 'an aldehyde at C1', (Q) => {
    const c1 = Q(80, 116), c2 = Q(138, 116);
    let s = bond(c1, c2, { rFrom: 16, rTo: 16 });
    const m1 = centre(c1, [{ deg: 120, len: 46, l: 'O', order: 2 }, { deg: 240, len: 42, l: 'H' }]);
    const m2 = centre(c2, [{ deg: 90, len: 44, l: 'H', kind: 'hi' }, { deg: 270, len: 44, l: 'OH' }, { deg: 0, len: 46, l: 'R' }]);
    return s + m1.s + m2.s;
  }],
];
FIGURES.push({
  id: 'fructose-enediol',
  section: 'aldehyde-oxidation',
  anchor: '<h3>Why glucose tests positive and sucrose does not</h3>',
  alt: 'Three panels showing only C1 and C2, with R for the rest of the chain. First, fructose: C1 carries two H and an OH, one H highlighted, and C2 is a ketone C=O. Second, the enediol: a C1=C2 double bond with an OH on each carbon, the OH on C2 highlighted. Third, an aldose: C1 is an aldehyde, CH=O, and C2 carries an H, highlighted, and an OH.',
  viewBox: '0 0 760 220',
  build() { return gridFigure(enediolCells, 3, 240, 204, 12, 16, 8, 8, [0, 'hi', 'good']); },
  caption: 'Read left to right; base runs each step both ways. R is C3 to C6. The highlights mark where a hydrogen leaves (first panel) and where one arrives (second and third).',
});
FIGURES.push({
  id: 'l-fructose-enediol',
  lessons: ['aldehyde-oxidation'],
  alt: 'Three stacked panels showing C1 and C2 only: fructose with a ketone at C2; the enediol, a C=C with an OH on each carbon; and an aldose with an aldehyde at C1.',
  viewBox: `0 0 340 ${stackH(3, 204)}`,
  build() { return gridFigure(enediolCells, 1, 324, 204, 0, 14, 8, 8, [0, 'hi', 'good']); },
  caption: 'Base moves one hydrogen at a time. R is C3 to C6.',
});

/* Maltose against sucrose: which anomeric carbons are free. */
const sugarPairCells = [
  ['MALTOSE: ONE ANOMERIC C IS FREE', 'the right ring can open: positive', (Q) => {
    const L = pyranose(Q, 62, 116, 28), R = pyranose(Q, 186, 116, 28);
    let s = L.s + R.s;
    const link = Q(124, 116);
    s += bond(L.v[0], link, { rFrom: 0, rTo: 15 }) + bond(link, R.v[3], { rFrom: 15, rTo: 0 });
    s += A(link, 'O', { r: 15, kind: 'hi' });
    const oh = armEnd(R.v[0], 0, 32);
    s += bond(R.v[0], oh, { rFrom: 0, rTo: 16 }) + A(oh, 'OH', { r: 16, kind: 'hi' });
    s += mark(L.v[0]) + mark(R.v[0]);
    s += Tg(Q, 62, 62, 'glucose') + Tg(Q, 186, 62, 'glucose');
    s += Tg(Q, 76, 170, 'C1: tied up', { cls: 'fg-tag-warn' }) + Tg(Q, 214, 170, 'C1: free OH', { cls: 'fg-tag-good' });
    return s;
  }],
  ['SUCROSE: BOTH ARE TIED UP', 'neither ring can open: negative', (Q) => {
    const L = pyranose(Q, 62, 116, 28);
    let s = L.s;
    // fructose ring, five-membered: v0 = C2 (anomeric), then C3, C4, C5, ring O
    const f = polyPts(182, 116, 5, 28, 180).map((p) => Q(p.x, p.y));
    for (let i = 0; i < 5; i++) {
      const a = f[i], b = f[(i + 1) % 5];
      s += bond(a, b, { rFrom: i === 4 ? 14 : 0, rTo: (i + 1) % 5 === 4 ? 14 : 0 });
    }
    s += A(f[4], 'O', { r: 14 });
    const link = Q(123, 116);
    s += bond(L.v[0], link, { rFrom: 0, rTo: 15 }) + bond(link, f[0], { rFrom: 15, rTo: 0 });
    s += A(link, 'O', { r: 15, kind: 'hi' });
    const ch = armEnd(f[0], 255, 40);
    s += bond(f[0], ch, { rFrom: 0, rTo: 23 }) + A(ch, 'CH₂OH', { r: 23 });
    s += mark(L.v[0]) + mark(f[0]);
    s += Tg(Q, 62, 62, 'glucose') + Tg(Q, 190, 62, 'fructose');
    s += Tg(Q, 52, 170, 'C1: tied up', { cls: 'fg-tag-warn' }) + Tg(Q, 228, 170, 'C2: tied up', { cls: 'fg-tag-warn' });
    return s;
  }],
];
FIGURES.push({
  id: 'sugar-pairs',
  section: 'aldehyde-oxidation',
  anchor: '<h3>Why glucose tests positive and sucrose does not</h3>',
  alt: 'Two panels, rings drawn with only the ring oxygens, the linking oxygen and the groups that matter. Left, maltose: two glucose rings joined by an oxygen from C1 of the left ring to C4 of the right ring. The left C1 is tied up; the right ring C1, marked, still carries a free OH. Right, sucrose: a glucose ring joined through an oxygen from its C1 to C2 of a five-membered fructose ring, which also carries a CH2OH. Both marked anomeric carbons are tied up and neither carries an OH.',
  viewBox: `0 0 760 ${SH + 16}`,
  build() { return gridFigure(sugarPairCells, 2, 364, SH, 16, 16, 8, 8, ['good', 'warn'], SW); },
  caption: 'The dots mark the anomeric carbons. Other OH and CH₂OH groups, hydrogens and stereochemistry are left off.',
});
FIGURES.push({
  id: 'l-sugar-pairs',
  lessons: ['aldehyde-oxidation'],
  alt: 'Two stacked panels: maltose, two glucose rings joined C1 to C4, with the right ring C1 still carrying a free OH; and sucrose, glucose C1 joined to fructose C2 so that both anomeric carbons are tied up.',
  viewBox: `0 0 340 ${stackH(2, SH)}`,
  build() { return gridFigure(sugarPairCells, 1, 324, SH, 0, 14, 8, 8, ['good', 'warn'], SW); },
  caption: 'Dots mark the anomeric carbons. Other groups are left off.',
});

/* ======================================================================
   7. Autoxidation: the radical chain, with fishhook arrows.
   ====================================================================== */
function acyl(Q, cx, cy, withH) {
  const c = Q(cx, cy);
  const groups = [
    { deg: 90, len: 44, l: 'O', order: 2 },
    { deg: 210, len: 40, l: 'R' },
  ];
  if (withH) groups.push({ deg: 330, len: 58, l: 'H', kind: 'hi' });
  return { c, ...centre(c, groups) };
}
const autoxCells = [
  ['A RADICAL TAKES THE ALDEHYDE H', 'an acyl radical is left: R–C(•)=O', (Q) => {
    const a = acyl(Q, 60, 116, true);
    const h = a.ends.H, x = Q(196, h.y - Q(0, 0).y);
    let s = a.s + A(x, 'X', { r: 14 });
    const dx = P(x.x - 20, x.y);
    s += dot(dx);
    s += Tg(Q, 196, x.y - Q(0, 0).y + 30, 'any radical');
    const mid = P((h.x + x.x) / 2, h.y);
    const cb = P((a.c.x + h.x) / 2, (a.c.y + h.y) / 2);
    s += fishhook(P(cb.x + 4, cb.y - 6), P(mid.x - 4, mid.y - 6), { bow: -16 });
    s += fishhook(P(dx.x - 4, dx.y - 2), P(mid.x + 4, mid.y - 6), { bow: 8 });
    s += fishhook(P(cb.x - 2, cb.y + 8), P(a.c.x + 10, a.c.y + 16), { bow: 10 });
    return s;
  }],
  ['O₂ ADDS TO THE ACYL RADICAL', 'an acylperoxy radical: R–C(=O)–O–O•', (Q) => {
    const a = acyl(Q, 60, 120, false);
    const e = P(a.c.x + 20, a.c.y + 6);
    let s = a.s + dot(e);
    const o1 = Q(138, 132), o2 = Q(184, 132);
    s += B(o1, o2, 'O', 'O') + A(o1, 'O') + A(o2, 'O');
    const d1 = P(o1.x - 21, o1.y), d2 = P(o2.x + 21, o2.y);
    s += dot(d1) + dot(d2);
    s += Tg(Q, 161, 168, 'O₂ is a diradical');
    const mid = P((a.c.x + o1.x) / 2, (a.c.y + o1.y) / 2 - 10);
    s += fishhook(P(e.x + 2, e.y - 6), P(mid.x - 3, mid.y), { bow: -10 });
    s += fishhook(P(d1.x - 2, d1.y - 6), P(mid.x + 4, mid.y - 2), { bow: 10 });
    return s;
  }],
  ['IT TAKES THE H OF A SECOND ALDEHYDE', 'a peroxy acid, and a new acyl radical', (Q) => {
    const c = Q(50, 96);
    const m = centre(c, [
      { deg: 90, len: 40, l: 'O', order: 2 },
      { deg: 210, len: 38, l: 'R' },
    ]);
    const o1 = armEnd(c, 330, 44), o2 = armEnd(o1, 30, 42);
    let s = m.s + bond(c, o1, { rFrom: 16, rTo: 14 }) + B(o1, o2, 'O', 'O') + A(o1, 'O', { r: 14 }) + A(o2, 'O', { r: 14 });
    const d = P(o2.x + 8, o2.y + 17);
    s += dot(d);
    // the second aldehyde, lower right, its H pointing up-left
    const c2 = Q(196, 150);
    const m2 = centre(c2, [
      { deg: 135, len: 56, l: 'H', kind: 'hi', key: 'H' },
      { deg: 45, len: 40, l: 'O', order: 2 },
      { deg: 300, len: 36, l: 'R' },
    ]);
    s += m2.s;
    const h = m2.ends.H;
    const mid = P((d.x + h.x) / 2 + 4, (d.y + h.y) / 2);
    const cb = P((c2.x + h.x) / 2, (c2.y + h.y) / 2);
    s += fishhook(P(d.x + 5, d.y + 2), P(mid.x, mid.y - 2), { bow: 8 });
    s += fishhook(P(cb.x + 6, cb.y - 2), P(mid.x + 6, mid.y + 4), { bow: 12 });
    s += fishhook(P(cb.x - 4, cb.y + 8), P(c2.x - 14, c2.y + 8), { bow: -10 });
    return s;
  }],
  ['THE PEROXY ACID OXIDIZES ONE MORE', 'two acids from each peroxy acid', (Q) => {
    let s = T(Q, 122, 74, 'R–CO₃H  +  R–CHO');
    s += arrow(Q(122, 88), Q(122, 124), { size: 7 });
    s += Tg(Q, 150, 110, 'no radicals', { anchor: 'start' });
    s += T(Q, 122, 150, '2 R–COOH');
    return s;
  }],
];
FIGURES.push({
  id: 'autoxidation',
  section: 'aldehyde-oxidation',
  anchor: '<h3>The consequence on the shelf</h3>',
  alt: 'Autoxidation in four panels, with single-barbed fishhook arrows for one-electron moves. First, a radical X takes the aldehyde hydrogen: one electron of the C–H bond pairs with X\'s electron to make H–X, and the other stays on carbon, giving an acyl radical. Second, O2, drawn as an O–O unit with an unpaired electron on each oxygen, bonds to the acyl radical: the carbon electron and one oxygen electron pair up, giving an acylperoxy radical. Third, that radical takes the aldehyde hydrogen of a second molecule, giving a peroxy acid and a new acyl radical. Fourth, the peroxy acid oxidizes one more aldehyde, with no radicals, giving two carboxylic acids.',
  viewBox: '0 0 760 440',
  build() { return gridFigure(autoxCells, 2, 364, 204, 16, 16, 8, 8, [0, 0, 'hi', 'good']); },
  caption: 'Each fishhook moves one electron. The third panel makes a new acyl radical, which goes back to the second panel: that loop is the chain. Lone pairs are left off.',
});
FIGURES.push({
  id: 'l-autoxidation',
  lessons: ['aldehyde-oxidation'],
  alt: 'Four stacked panels: a radical takes the aldehyde hydrogen, leaving an acyl radical; O2 adds to it, giving an acylperoxy radical; that radical takes the hydrogen of a second aldehyde, giving a peroxy acid and a new acyl radical; the peroxy acid oxidizes one more aldehyde, giving two carboxylic acids.',
  viewBox: `0 0 340 ${stackH(4, 204)}`,
  build() { return gridFigure(autoxCells, 1, 324, 204, 0, 14, 8, 8, [0, 0, 'hi', 'good']); },
  caption: 'Each fishhook moves one electron. Panel 3 feeds panel 2 again. Lone pairs are left off.',
});

export default FIGURES;
