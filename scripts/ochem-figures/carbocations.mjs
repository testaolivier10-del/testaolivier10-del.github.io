/* Figures for the carbocations notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Conventions, kept the same as the Foundations and Carbonyl pages:
   - a curved arrow starts on electrons (a lone pair or the middle of a
     bond) and ends on the atom, or the bond, that receives them;
   - aqueous acid is drawn as H3O+, and the water it becomes as H2O;
   - an orbital lobe is a pale ellipse (lobeE), the empty p orbital in the
     main orbital color and a filled bond orbital in the alternate color.

   This is chapter 7, so skeletal drawings are allowed. They are used for the
   rearrangements, where the chain is long; every group that moves, and every
   atom a curved arrow touches, is written out with its label.

   Lesson copies (id prefix l-) are 340 wide or less, stacked, and use only
   fg-lbl and fg-tag text. */
import { atom as atom0, bond, wedge, hash, arrow, curve, lonePair, text, tag, rule, bar, P } from '../lib/ochem-figure.mjs';
import { polyPts, polyRing } from '../lib/ochem-skeletal.mjs';
import { lobeE } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (d) => (d * Math.PI) / 180;
const r2 = (v) => Math.round(v * 100) / 100;
/* A point at math angle `deg` (0 east, 90 up) and distance `len` from c. */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);

/* An atom disc that stays opaque in both themes. */
function atom(x, y, l, o = {}) {
  const kind = o.kind || 'plain';
  const back = kind === 'hi' || kind === 'warn'
    ? `<circle class="fg-atom" cx="${r2(x)}" cy="${r2(y)}" r="${r2(o.r ?? 16)}"></circle>` : '';
  return back + atom0(x, y, l, o);
}
const rOf = (l) => (l.length >= 3 ? 18 : l === 'H' ? 12 : l === 'C' ? 16 : 15);
const chg = (p, s = '+') => text(p.x, p.y + 5, s, { cls: 'fg-warn', size: 16 });
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', size: 13, anchor });
const sm = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-sm', size: 10.5, anchor });
const tg = (x, y, s, anchor = 'middle', cls = 'fg-tag') => text(x, y, s, { cls, size: 11, anchor });
const lp = (c, deg, d = 22) => lonePair(c.x, c.y, -deg, { dist: d, spread: 4.5, r: 2.4 });
const lpTip = (c, deg) => at(c, deg, 29);

/* A group bonded to `from`. o.bond: 'wedge' | 'hash'; o.rFrom: radius of
   the atom it starts from (0 for a skeletal vertex). */
function arm(from, deg, len, l, o = {}) {
  const e = at(from, deg, len);
  const r = l ? (o.r ?? rOf(l)) : 0;
  const rFrom = o.rFrom ?? 16;
  let s = o.bond === 'wedge' ? wedge(from, e, { rFrom, rTo: r, width: 9 })
        : o.bond === 'hash' ? hash(from, e, { rFrom, rTo: r, width: 10, rungs: 5 })
        : bond(from, e, { rFrom, rTo: r, order: o.order || 1, cls: o.cls });
  if (l) s += atom(e.x, e.y, l, { r, kind: o.kind });
  return { s, e };
}
/* A curved arrow that starts on the middle of bond a–b, pushed `off` px to
   the left of the direction a→b (negative: right), and ends at e. */
function fromBond(a, b, e, bow, off = 5) {
  const m = P((a.x + b.x) / 2, (a.y + b.y) / 2);
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  return curve(P(m.x + (dy / L) * off, m.y - (dx / L) * off), e, { bow, size: 7 });
}
const fromLp = (c, deg, e, bow) => curve(lpTip(c, deg), e, { bow, size: 7 });
/* Skeletal bond between two vertices (or a vertex and a labelled atom). */
const skb = (a, b, o = {}) => bond(a, b, { rFrom: o.rFrom ?? 0, rTo: o.rTo ?? 0, cls: o.cls, order: o.order || 1 });
const dot = (p) => atom(p.x, p.y, '', { kind: 'point' });

/* ======================================================================
   1. Carbocation or carbanion: count the dots.
   ====================================================================== */
FIGURES.push({
  id: 'cation-or-anion',
  section: 'carbocations',
  lessons: ['carbocations'],
  anchor: 'Empty orbital, no dots.</div>',
  alt: 'Two carbons side by side, each with three hydrogens. The left one, CH3 plus, has no lone pair: formal charge 4 minus 3 equals plus 1, a carbocation. The right one, CH3 minus, has one lone pair: formal charge 4 minus 5 equals minus 1, a carbanion.',
  viewBox: '0 0 340 222',
  build() {
    let s = '';
    const col = (cx, anion) => {
      let g = '';
      const c = P(cx, 88);
      for (const d of [150, 30, 270]) g += arm(c, d, 46, 'H').s;
      if (anion) g += lp(c, 90, 23);
      g += atom(c.x, c.y, 'C', { kind: anion ? 'hi' : 'warn' });
      g += chg(anion ? at(c, 58, 36) : at(c, 90, 27), anion ? '−' : '+');
      g += tg(cx, 164, anion ? 'CH₃⁻ · CARBANION' : 'CH₃⁺ · CARBOCATION');
      g += lbl(cx, 186, anion ? 'one lone pair' : 'no lone pair');
      g += lbl(cx, 208, anion ? '4 − (2 + 3) = −1' : '4 − (0 + 3) = +1');
      return g;
    };
    s += col(86, false);
    s += rule(170, 24, 170, 212);
    s += col(254, true);
    return s;
  },
  caption: 'Count the dots: none on the carbocation, one pair on the carbanion.',
});

/* ======================================================================
   2. The shape: tetrahedral parent, flat cation, empty p orbital.
   ====================================================================== */
function topView(b, arms = 56) {
  let s = '';
  s += arm(b, 90, arms, 'CH₃').s + arm(b, 210, arms, 'H₃C').s + arm(b, 330, arms, 'CH₃').s;
  s += atom(b.x, b.y, 'C', { kind: 'warn' });
  s += chg(at(b, 30, 30));
  return s;
}
function edgeView(c, o = {}) {
  let s = '';
  const off = o.off ?? 46, ry = o.ry ?? 34;
  s += lobeE(c.x, c.y - off, 20, ry);
  s += lobeE(c.x, c.y + off, 20, ry);
  const L = o.len ?? 64;
  s += `<line class="fg-dash" x1="${c.x - L - 30}" y1="${c.y}" x2="${c.x + L + 30}" y2="${c.y}"></line>`;
  s += arm(c, 180, L, 'H₃C').s + arm(c, 0, L, 'CH₃').s;
  s += atom(c.x, c.y, 'C', { kind: 'warn' });
  s += chg(at(c, 35, 34));
  return s;
}

FIGURES.push({
  id: 'carbocation-anatomy',
  section: 'carbocations',
  anchor: 'one lobe above the plane and one below it.</p>',
  alt: 'Left: tert-butyl bromide, a tetrahedral sp3 carbon with a bromine and three methyl groups. Middle: after bromide leaves, the tert-butyl cation seen from above, three methyl groups 120 degrees apart around a flat carbon. Right: the same cation seen edge-on, the three bonds lying in one plane and an empty p orbital with one lobe above the plane and one below.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    /* the sp3 parent */
    const a = P(116, 150);
    s += arm(a, 90, 58, 'Br', { kind: 'hi' }).s;
    s += arm(a, 210, 56, 'H₃C').s;
    s += arm(a, 345, 56, 'CH₃', { bond: 'wedge' }).s;
    s += arm(a, 290, 56, 'CH₃', { bond: 'hash' }).s;
    s += atom(a.x, a.y, 'C');
    s += tag(116, 252, 'sp³ · FOUR GROUPS');
    s += sm(116, 272, 'tetrahedral, 109.5°');
    s += arrow(P(204, 150), P(262, 150), { muted: true });
    s += sm(233, 136, 'Br⁻ leaves');
    /* the cation from above */
    const b = P(370, 150);
    s += topView(b);
    s += text(b.x, b.y + 36, '120°', { cls: 'fg-hi', size: 11 });
    s += tag(370, 252, 'sp² · THREE GROUPS');
    s += sm(370, 272, 'flat, seen from above');
    s += rule(478, 40, 478, 280);
    /* edge-on */
    const c = P(620, 150);
    s += edgeView(c);
    s += tg(642, 62, 'empty p orbital', 'start');
    s += sm(620, 252, 'the same cation, edge-on;');
    s += sm(620, 272, 'the third CH₃ points at you');
    return s;
  },
  caption: 'Left to right: the tetrahedral starting material, the flat cation seen from above, and the same cation seen edge-on with its empty p orbital.',
});

FIGURES.push({
  id: 'l-carbocation-anatomy',
  lessons: ['carbocations'],
  anchor: '',
  alt: 'The tert-butyl cation drawn twice. Top: seen from above, three methyl groups 120 degrees apart around the positive carbon. Bottom: seen edge-on, the bonds in one plane and an empty p orbital with a lobe above and a lobe below the plane.',
  viewBox: '0 0 340 424',
  build() {
    let s = '';
    s += tg(170, 22, 'SEEN FROM ABOVE');
    const b = P(170, 108);
    s += topView(b);
    s += text(b.x, b.y + 36, '120°', { cls: 'fg-tag', size: 11 });
    s += lbl(170, 196, 'three bonds, 120° apart');
    s += rule(20, 212, 320, 212);
    s += tg(170, 236, 'SEEN EDGE-ON');
    const c = P(170, 328);
    s += edgeView(c, { off: 40, ry: 30, len: 62 });
    s += tg(196, 272, 'empty p orbital', 'start');
    s += lbl(170, 410, 'third CH₃ points at you');
    return s;
  },
  caption: 'The <i>tert</i>-butyl cation from two directions.',
});

/* ======================================================================
   3. Two ways a carbocation forms.
   ====================================================================== */
/* tert-butyl bromide with Br to the right; returns ink and Br position */
function tBuBr(c, brLen = 84) {
  let s = '';
  s += arm(c, 90, 52, 'CH₃').s + arm(c, 180, 58, 'H₃C').s + arm(c, 270, 52, 'CH₃').s;
  const br = at(c, 0, brLen);
  s += bond(c, br, { rFrom: 16, rTo: 16 });
  for (const d of [90, 0, 270]) s += lp(br, d, 24);
  s += atom(br.x, br.y, 'Br', { kind: 'hi', r: 16 });
  s += atom(c.x, c.y, 'C');
  s += fromBond(c, br, at(br, 235, 19), 22, -6);
  return s;
}
function bromide(p) {
  let s = '';
  for (const d of [90, 0, 180, 270]) s += lp(p, d, 24);
  s += atom(p.x, p.y, 'Br', { kind: 'hi', r: 16 });
  s += chg(at(p, 45, 30), '−');
  return s;
}
function tBuCation(c, hiTop) {
  let s = '';
  s += arm(c, 90, 52, 'CH₃', { kind: hiTop ? 'hi' : undefined }).s;
  s += arm(c, 210, 54, 'H₃C').s + arm(c, 330, 54, 'CH₃').s;
  s += atom(c.x, c.y, 'C', { kind: 'warn' });
  s += chg(at(c, 30, 30));
  return s;
}
/* 2-methylpropene with H3O+ above it and the two arrows */
function alkeneH3O(c1) {
  let s = '';
  const c2 = at(c1, 0, 72);
  s += bond(c1, c2, { order: 2, rFrom: 16, rTo: 16 });
  s += arm(c1, 150, 42, 'H').s + arm(c1, 210, 42, 'H').s;
  s += arm(c2, 30, 54, 'CH₃').s + arm(c2, 330, 54, 'CH₃').s;
  s += atom(c1.x, c1.y, 'C');
  s += atom(c2.x, c2.y, 'C');
  const h = P(c1.x + 22, c1.y - 84);
  const o = at(h, 0, 66);
  s += bond(h, o, { rFrom: 12, rTo: 15 });
  s += arm(o, 60, 42, 'H', { rFrom: 15 }).s + arm(o, 330, 42, 'H', { rFrom: 15 }).s;
  s += lp(o, 250);
  s += atom(h.x, h.y, 'H', { r: 12, kind: 'hi' });
  s += atom(o.x, o.y, 'O');
  s += chg(at(o, 15, 32));
  const mid = P((c1.x + c2.x) / 2, (c1.y + c2.y) / 2);
  s += curve(P(mid.x - 4, mid.y - 9), at(h, 250, 14), { bow: -14, size: 7 });
  s += fromBond(h, o, at(o, 125, 18), 22, 5);
  return { s, c2 };
}

FIGURES.push({
  id: 'two-routes',
  section: 'carbocations',
  anchor: 'belong to <a class="chapter-ref" href="/ochem/learn.html#m-alkenes-alkynes">Alkenes &amp; Alkynes</a>.</p>',
  alt: 'Two reactions that make the same tert-butyl cation. Top: in tert-butyl bromide the carbon-bromine bond breaks, a curved arrow carrying its pair onto bromine, giving the cation and bromide ion. Bottom: the pi bond of 2-methylpropene attacks a hydrogen of H3O+, and the H-O bond pair moves onto oxygen. The hydrogen adds to the CH2 end, the other alkene carbon becomes the cation, and water is released.',
  viewBox: '0 0 760 510',
  build() {
    let s = '';
    s += tag(36, 28, 'ROUTE 1 · A LEAVING GROUP DEPARTS', { anchor: 'start' });
    const c = P(124, 120);
    s += tBuBr(c);
    s += arrow(P(262, 120), P(318, 120), { muted: true });
    s += tBuCation(P(400, 124));
    s += lbl(496, 128, '+');
    s += bromide(P(548, 124));
    s += sm(740, 96, 'the C–Br pair', 'end');
    s += sm(740, 114, 'leaves with Br', 'end');
    s += sm(740, 132, 'as Br⁻', 'end');
    s += sm(124, 206, 'tert-butyl bromide');
    s += tg(400, 206, 'tert-butyl cation', 'middle', 'fg-tag-good');
    s += rule(36, 228, 724, 228);

    s += tag(36, 254, 'ROUTE 2 · A C=C TAKES A PROTON', { anchor: 'start' });
    const c1 = P(88, 400);
    const k = alkeneH3O(c1);
    s += k.s;
    s += tg(c1.x, 470, 'H adds here');
    s += tg(k.c2.x + 10, 490, 'C⁺ forms here', 'middle', 'fg-tag-warn');
    s += arrow(P(262, 396), P(318, 396), { muted: true });
    s += tBuCation(P(400, 400), true);
    s += lbl(482, 404, '+  H₂O', 'start');
    s += tg(400, 490, 'tert-butyl cation', 'middle', 'fg-tag-good');
    s += sm(740, 366, 'H on the other carbon', 'end');
    s += sm(740, 384, 'would leave a 1° cation,', 'end');
    s += sm(740, 402, 'which is far worse', 'end');
    return s;
  },
  caption: 'Both routes give the same cation. Each curved arrow starts on a pair of electrons: the C&ndash;Br bond in route 1, the &pi; bond and then the H&ndash;O bond in route 2. The highlighted CH₃ in route 2 is the old CH₂ plus the new H.',
});

FIGURES.push({
  id: 'l-two-routes',
  lessons: ['carbocations'],
  anchor: '',
  alt: 'Top: tert-butyl bromide loses bromide ion, a curved arrow carrying the C-Br pair onto bromine, giving the tert-butyl cation. Bottom: the pi bond of 2-methylpropene takes a proton from H3O+; the hydrogen goes to the CH2 end and the other carbon becomes the tert-butyl cation, with water released.',
  viewBox: '0 0 340 700',
  build() {
    let s = '';
    s += tg(170, 22, 'A LEAVING GROUP DEPARTS');
    s += tBuBr(P(100, 96), 80);
    s += arrow(P(284, 146), P(284, 184), { muted: true });
    s += tBuCation(P(110, 238));
    s += lbl(196, 242, '+');
    s += bromide(P(244, 238));
    s += rule(20, 300, 320, 300);
    s += tg(170, 324, 'A C=C TAKES A PROTON');
    const c1 = P(72, 472);
    const k = alkeneH3O(c1);
    s += k.s;
    s += tg(52, 524, 'H adds here');
    s += tg(k.c2.x + 6, 544, 'C⁺ forms here', 'middle', 'fg-tag-warn');
    s += arrow(P(284, 510), P(284, 564), { muted: true });
    s += tBuCation(P(116, 630), true);
    s += lbl(196, 634, '+  H₂O', 'start');
    return s;
  },
  caption: 'Both routes give the <i>tert</i>-butyl cation.',
});

/* ======================================================================
   4. Both faces are open: a nucleophile from above or below.
   ====================================================================== */
FIGURES.push({
  id: 'two-faces',
  section: 'carbocations',
  anchor: 'not scrambled at some later step.</p>',
  alt: 'The butan-2-yl cation seen edge-on, with an empty p orbital above and below the flat carbon. A bromide ion above and a bromide ion below each attack with a curved arrow. Attack from above gives 2-bromobutane with bromine up; attack from below gives the mirror image with bromine down. The two are enantiomers formed in equal amounts.',
  viewBox: '0 0 760 360',
  build() {
    let s = '';
    const c = P(206, 180);
    s += lobeE(c.x, c.y - 44, 20, 32);
    s += lobeE(c.x, c.y + 44, 20, 32);
    s += arm(c, 0, 70, 'C₂H₅', { r: 20 }).s;
    s += arm(c, 205, 48, 'H', { bond: 'wedge' }).s;
    s += arm(c, 160, 62, 'H₃C', { bond: 'hash' }).s;
    s += atom(c.x, c.y, 'C', { kind: 'warn' });
    s += chg(at(c, 318, 34));
    const b1 = P(206, 54), b2 = P(206, 306);
    s += bromide(b1) + bromide(b2);
    s += fromLp(b1, 270, P(c.x, c.y - 72), 10);
    s += fromLp(b2, 90, P(c.x, c.y + 72), -10);
    s += sm(236, 40, 'from above', 'start');
    s += sm(236, 326, 'from below', 'start');
    s += tag(36, 28, 'BOTH FACES', { anchor: 'start' });
    s += tag(36, 46, 'ARE OPEN', { anchor: 'start' });

    s += arrow(P(318, 150), P(392, 104), { muted: true });
    s += arrow(P(318, 210), P(392, 256), { muted: true });
    /* attacked from above: Br up, everything else bent down */
    const A = P(486, 96);
    s += arm(A, 90, 50, 'Br', { kind: 'hi' }).s;
    s += arm(A, 330, 62, 'C₂H₅', { r: 20 }).s;
    s += arm(A, 200, 46, 'H', { bond: 'wedge' }).s;
    s += arm(A, 250, 56, 'H₃C', { bond: 'hash' }).s;
    s += atom(A.x, A.y, 'C');
    /* attacked from below: the mirror image */
    const B = P(486, 264);
    s += arm(B, 270, 50, 'Br', { kind: 'hi' }).s;
    s += arm(B, 30, 62, 'C₂H₅', { r: 20 }).s;
    s += arm(B, 160, 46, 'H', { bond: 'wedge' }).s;
    s += arm(B, 110, 56, 'H₃C', { bond: 'hash' }).s;
    s += atom(B.x, B.y, 'C');
    s += `<line class="fg-dash" x1="420" y1="180" x2="600" y2="180"></line>`;
    s += sm(608, 184, 'mirror', 'start');
    s += tg(740, 280, 'mirror images,', 'end');
    s += tg(740, 298, 'formed 50 : 50', 'end');
    s += sm(740, 318, 'a racemic mixture', 'end');
    return s;
  },
  caption: 'The butan-2-yl cation, CH₃CH⁺CH₂CH₃, meeting bromide from each side. Compare the two products across the dashed mirror line.',
});

/* ======================================================================
   5. Hyperconjugation: a filled C–H bond beside the empty p orbital.
   ====================================================================== */
function overlap(cn, o = {}) {
  let s = '';
  const cp = at(cn, 0, 100);
  s += lobeE(cp.x, cp.y - 42, 19, 32);
  s += lobeE(cp.x, cp.y + 42, 19, 32);
  /* the C–H sigma bond, drawn as an elongated filled orbital */
  s += lobeE(cn.x, cn.y - 30, 14, 34, 'fg-orb-alt');
  s += bond(cn, cp, { rFrom: 16, rTo: 16 });
  s += arm(cn, 90, 58, 'H', { cls: 'fg-bond-hi' }).s;
  s += arm(cn, 240, 46, 'H', { bond: 'wedge' }).s;
  s += arm(cn, 195, 46, 'H', { bond: 'hash' }).s;
  s += arm(cp, 20, 46, 'H', { bond: 'hash' }).s;
  s += arm(cp, 340, 46, 'H', { bond: 'wedge' }).s;
  s += atom(cn.x, cn.y, 'C');
  s += atom(cp.x, cp.y, 'C', { kind: 'warn' });
  s += chg(P(cp.x + 32, cp.y - 44));
  s += curve(P(cn.x + 16, cn.y - 44), P(cp.x - 20, cp.y - 48), { bow: -16, muted: true, size: 7 });
  const T = o.tagCls || 'fg-tag';
  s += text(cn.x - 6, cn.y - 90, 'filled C–H bond', { cls: T, size: 11, anchor: 'middle' });
  s += text(cp.x + 8, cp.y - 90, 'empty p', { cls: T, size: 11, anchor: 'middle' });
  return { s, cp };
}

FIGURES.push({
  id: 'hyperconjugation-overlap',
  section: 'carbocations',
  anchor: 'so a neighbor with no hydrogens still helps.</p>',
  alt: 'Left: the ethyl cation seen side-on. A C-H bond on the neighboring carbon points straight up, parallel to the empty p orbital of the positive carbon, and a small arrow shows its electron pair spreading toward that orbital. Right: the number of C-H bonds on carbons next to the positive carbon for the methyl, ethyl, isopropyl and tert-butyl cations: zero, three, six and nine.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    s += tag(36, 28, 'ONE C–H BOND, LINED UP WITH THE EMPTY p', { anchor: 'start' });
    const k = overlap(P(170, 176));
    s += k.s;
    s += sm(220, 270, 'the C–H pair spreads a little', 'middle');
    s += sm(220, 288, 'into the empty orbital', 'middle');
    s += tg(220, 310, 'so the + charge is less concentrated', 'middle', 'fg-tag-good');
    s += rule(420, 40, 420, 312);

    s += tag(590, 28, 'C–H BONDS NEXT DOOR');
    const ROWS = [['CH₃⁺', 'methyl', 0], ['CH₃CH₂⁺', '1°', 3], ['(CH₃)₂CH⁺', '2°', 6], ['(CH₃)₃C⁺', '3°', 9]];
    ROWS.forEach(([f, deg, n], i) => {
      const y = 82 + i * 52;
      s += lbl(444, y + 4, f, 'start');
      s += sm(444, y + 22, deg, 'start');
      if (n) s += bar(580, y - 8, n * 12, 16, { kind: 'hi' });
      else s += sm(580, y + 4, 'none', 'start');
      s += text(724, y + 4, String(n), { cls: n ? 'fg-tag-good' : 'fg-tag-warn', size: 11, anchor: 'end' });
    });
    s += sm(590, 298, 'counted on the carbons bonded to C⁺');
    return s;
  },
  caption: 'Left: the ethyl cation, CH₃CH₂⁺, with the lined-up C&ndash;H bond shaded. Right: the count for each cation.',
});

FIGURES.push({
  id: 'l-hyperconjugation',
  lessons: ['carbocations'],
  anchor: '',
  alt: 'The ethyl cation seen side-on: a C-H bond on the neighboring carbon lies parallel to the empty p orbital of the positive carbon, and a small arrow shows its pair spreading toward it. Below, counts of C-H bonds next door: methyl cation 0, ethyl 3, isopropyl 6, tert-butyl 9.',
  viewBox: '0 0 340 378',
  build() {
    let s = '';
    const k = overlap(P(104, 150));
    s += k.s;
    s += rule(20, 236, 320, 236);
    s += tg(170, 258, 'C–H BONDS NEXT DOOR');
    const ROWS = [['CH₃⁺', '0'], ['CH₃CH₂⁺', '3'], ['(CH₃)₂CH⁺', '6'], ['(CH₃)₃C⁺', '9']];
    ROWS.forEach(([f, n], i) => {
      const y = 286 + i * 24;
      s += lbl(70, y, f, 'start');
      s += lbl(270, y, n, 'end');
    });
    return s;
  },
  caption: 'The ethyl cation seen side-on, and the count of C&ndash;H bonds next door for each cation.',
});

/* ======================================================================
   6. The stability ladder.
   ====================================================================== */
FIGURES.push({
  id: 'cation-stability-ladder',
  section: 'carbocations',
  anchor: 'loses N<sub>2</sub> gas on warming and leaves one behind.</p>',
  alt: 'A ladder of carbocations, least stable at the top: methyl, then primary alkyl, then secondary alkyl alongside primary allylic, then tertiary alkyl alongside primary benzylic, and at the bottom a cation with an oxygen or nitrogen on the charged carbon. A dashed bar spans methyl to tertiary, marked a million-fold or more in solvolysis rate.',
  viewBox: '0 0 760 372',
  build() {
    let s = '';
    s += tag(380, 30, 'READ THE LADDER BY WHAT IS ATTACHED TO THE CHARGED CARBON');
    s += arrow(P(56, 310), P(56, 60), { muted: true });
    s += tg(68, 66, 'less stable', 'start', 'fg-tag-warn');
    s += tg(68, 314, 'more stable', 'start', 'fg-tag-good');
    const RUNGS = [
      [96, 'methyl', 'no C–H bonds next door', 'fg-bond-soft', 'fg-tag-warn'],
      [144, '1° alkyl', '3 C–H bonds next door', 'fg-bond', 'fg-sm'],
      [192, '2° alkyl   ≈   1° allylic', '6 C–H, or shared by two carbons', 'fg-bond', 'fg-sm'],
      [240, '3° alkyl   ≈   1° benzylic', '9 C–H, or shared by four carbons', 'fg-bond-hi', 'fg-sm'],
      [288, 'O or N on the charged carbon', 'an octet on every atom', 'fg-bond-hi', 'fg-tag-good'],
    ];
    for (const [y, name, note, bcls, ncls] of RUNGS) {
      s += bond(P(170, y), P(250, y), { rFrom: 0, rTo: 0, cls: bcls });
      s += lbl(262, y + 4, name, 'start');
      s += text(724, y + 4, note, { cls: ncls, size: 10.5, anchor: 'end' });
    }
    s += `<line class="fg-dash-hi" x1="150" y1="96" x2="150" y2="240"></line>`;
    s += text(142, 164, '10⁶', { cls: 'fg-hi', size: 11, anchor: 'end' });
    s += text(142, 180, 'or more', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += rule(36, 330, 724, 330);
    s += sm(380, 354, 'The dashed bar is the solvolysis comparison, methyl to 3°.');
    return s;
  },
  caption: 'Read down from methyl: each rung is a more stable cation, and two cations on the same rung are about equally stable.',
});

/* ======================================================================
   7. Resonance: allylic, benzylic, and a lone pair next door.
   ====================================================================== */
/* a dashed line running parallel to a drawn sigma bond */
const par = (a, b, off) => {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  const px = (-dy / L) * off, py = (dx / L) * off;
  return bond(P(a.x + px, a.y + py), P(b.x + px, b.y + py), { rFrom: 10, rTo: 10, cls: 'fg-dash-hi' });
};
function allyl(m) {
  let s = '';
  const a1 = P(m.x - 54, m.y + 30), a2 = m, a3 = P(m.x + 54, m.y + 30);
  s += skb(a1, a2) + skb(a2, a3);
  s += par(a1, a2, -9) + par(a2, a3, -9);
  for (const p of [a1, a2, a3]) s += dot(p);
  s += text(a1.x - 12, a1.y + 5, '½+', { cls: 'fg-warn', size: 13, anchor: 'end' });
  s += text(a3.x + 12, a3.y + 5, '½+', { cls: 'fg-warn', size: 13, anchor: 'start' });
  return s;
}
function benzyl(ctr) {
  let s = '';
  const R = polyPts(ctr.x, ctr.y, 6, 42, 90);   // 0 top, 1 upper-left, 2 lower-left, 3 bottom, 4 lower-right, 5 upper-right
  s += polyRing(R, 'fg-bond');
  s += `<circle class="fg-dash-hi" cx="${ctr.x}" cy="${ctr.y}" r="24"></circle>`;
  const exo = P(R[5].x + 40, R[5].y - 24);
  s += skb(R[5], exo) + par(R[5], exo, -9);
  for (const p of [...R, exo]) s += dot(p);
  const d = (p, dx, dy, anchor = 'middle') => text(p.x + dx, p.y + dy, 'δ+', { cls: 'fg-warn', size: 13, anchor });
  s += d(exo, 12, 4, 'start');
  s += d(R[0], 0, -10);
  s += d(R[4], 8, 20);
  s += d(R[2], -10, 4, 'end');
  return s;
}
/* CH3–O–CH2(+) and its C=O(+) partner; returns ink */
function oxocarb(x0, y1, y2, withArrowDown = true) {
  let s = '';
  const m1 = P(x0, y1), o1 = P(x0 + 62, y1), k1 = P(x0 + 126, y1);
  s += bond(m1, o1, { rFrom: 18, rTo: 15 }) + bond(o1, k1, { rFrom: 15, rTo: 18 });
  s += atom(m1.x, m1.y, 'CH₃', { r: 18 });
  for (const ang of [90, 270]) s += lp(o1, ang);
  s += atom(o1.x, o1.y, 'O');
  s += atom(k1.x, k1.y, 'CH₂', { r: 18, kind: 'warn' });
  s += chg(P(k1.x + 24, k1.y - 18));
  s += curve(lpTip(o1, 270), P((o1.x + k1.x) / 2 + 4, y1 + 8), { bow: 14, size: 7 });
  if (withArrowDown) {
    const mid = x0 + 62;
    s += arrow(P(mid, y1 + 44), P(mid, y2 - 40), { muted: true });
    s += arrow(P(mid, y2 - 40), P(mid, y1 + 44), { muted: true });
  }
  const m2 = P(x0, y2), o2 = P(x0 + 62, y2), k2 = P(x0 + 126, y2);
  s += bond(m2, o2, { rFrom: 18, rTo: 15 }) + bond(o2, k2, { rFrom: 15, rTo: 18, order: 2 });
  s += atom(m2.x, m2.y, 'CH₃', { r: 18 });
  s += lp(o2, 90);
  s += atom(o2.x, o2.y, 'O', { kind: 'warn' });
  s += atom(k2.x, k2.y, 'CH₂', { r: 18 });
  s += chg(P(o2.x + 20, o2.y - 22));
  return s;
}

FIGURES.push({
  id: 'resonance-beats-substitution',
  section: 'carbocations',
  anchor: 'shares its lone pair more readily.</p>',
  alt: 'Three stabilized cations. An allylic cation drawn as a hybrid with half a positive charge on each end carbon. A benzylic cation drawn as a hybrid with a partial positive charge on the outside carbon and on three ring carbons. The methoxymethyl cation redrawn with a curved arrow from an oxygen lone pair to the C-O bond, giving a C=O double bond with the positive charge on oxygen.',
  viewBox: '0 0 760 348',
  build() {
    let s = '';
    s += tag(130, 34, 'ALLYLIC');
    s += allyl(P(130, 132));
    s += sm(130, 240, 'two carbons share the +');
    s += tg(130, 262, '1° allylic ≈ 2° alkyl', 'middle', 'fg-tag-good');
    s += rule(252, 50, 252, 280);
    s += tag(388, 34, 'BENZYLIC');
    s += benzyl(P(372, 150));
    s += sm(388, 240, 'four carbons share the +');
    s += tg(388, 262, '1° benzylic ≈ 3° alkyl', 'middle', 'fg-tag-good');
    s += rule(516, 50, 516, 280);
    s += tag(636, 34, 'OXYGEN NEXT DOOR');
    s += oxocarb(572, 96, 204);
    s += tg(636, 262, 'oxocarbenium ion', 'middle', 'fg-tag-good');
    s += rule(36, 290, 724, 290);
    s += lbl(380, 320, 'In each one the charge no longer sits on a single carbon.');
    return s;
  },
  caption: 'The allylic and benzylic cations are drawn as hybrids: dashed partial bonds, and the charge marked on each carbon that shares it. The oxygen case is drawn as its two resonance structures, because the second one has an octet on every atom.',
});

FIGURES.push({
  id: 'l-delocalized',
  lessons: ['carbocations'],
  anchor: '',
  alt: 'Top: the allyl cation as a hybrid, half a positive charge on each end carbon. Bottom: the benzyl cation as a hybrid, a partial positive charge on the outside carbon and on three ring carbons.',
  viewBox: '0 0 340 380',
  build() {
    let s = '';
    s += tg(170, 22, 'ALLYLIC: TWO CARBONS SHARE IT');
    s += allyl(P(170, 80));
    s += lbl(170, 150, '1° allylic ≈ 2° alkyl');
    s += rule(20, 170, 320, 170);
    s += tg(170, 194, 'BENZYLIC: FOUR CARBONS SHARE IT');
    s += benzyl(P(150, 276));
    s += lbl(170, 366, '1° benzylic ≈ 3° alkyl');
    return s;
  },
  caption: 'Dashed lines are partial bonds. Every carbon marked with a charge carries part of it.',
});

FIGURES.push({
  id: 'l-oxocarbenium',
  lessons: ['carbocations'],
  anchor: '',
  alt: 'The methoxymethyl cation, CH3-O-CH2 plus, and a curved arrow from an oxygen lone pair to the C-O bond. The second resonance structure has a C=O double bond, a positive charge on oxygen, and an octet on every atom.',
  viewBox: '0 0 340 262',
  build() {
    let s = '';
    s += oxocarb(62, 58, 170);
    s += tg(216, 62, 'C has 6 electrons', 'start', 'fg-tag-warn');
    s += tg(216, 174, 'all octets', 'start', 'fg-tag-good');
    s += lbl(170, 244, 'an oxocarbenium ion');
    return s;
  },
  caption: 'The two resonance structures of CH₃O&ndash;CH₂⁺.',
});

/* ======================================================================
   8. Vinyl and aryl: the empty orbital points the wrong way.
   ====================================================================== */
function vinyl(v1) {
  let s = '';
  const v2 = at(v1, 0, 100), vr = at(v2, 0, 92);
  s += lobeE((v1.x + v2.x) / 2, v1.y - 34, 44, 16);
  s += lobeE((v1.x + v2.x) / 2, v1.y + 34, 44, 16);
  s += bond(v1, v2, { order: 2, gap: 5 });
  s += bond(v2, vr, { rTo: 18 });
  s += atom(vr.x, vr.y, 'CH₃', { r: 18 });
  s += arm(v1, 150, 46, 'H').s + arm(v1, 210, 46, 'H').s;
  s += atom(v1.x, v1.y, 'C');
  s += `<circle class="fg-orb" cx="${v2.x}" cy="${v2.y}" r="27" fill-opacity="0.18"></circle>`;
  s += atom(v2.x, v2.y, 'C', { kind: 'warn' });
  s += chg(at(v2, 315, 38));
  return { s, v2 };
}
function aryl(x0, y) {
  let s = '';
  s += lobeE(x0 + 70, y - 34, 72, 17);
  s += lobeE(x0 + 70, y + 34, 72, 17);
  s += skb(P(x0, y), P(x0 + 140, y));
  s += dot(P(x0, y));
  const c = P(x0 + 164, y);
  s += lobeE(c.x + 48, y, 26, 14);
  s += atom(c.x, c.y, 'C', { kind: 'warn' });
  s += chg(P(c.x, y - 28));
  return { s, c };
}

FIGURES.push({
  id: 'vinyl-aryl-orthogonal',
  section: 'carbocations',
  anchor: 'Again the empty orbital and the &pi; electrons are at right angles, and they never meet.</p>',
  alt: 'Left: a vinyl cation, CH2=C plus CH3, drawn linear at the positive carbon. The pi cloud of the double bond lies above and below the C=C, while the empty p orbital on the positive carbon is drawn end-on as a circle, pointing at the reader, at right angles to that pi cloud. Right: a benzene ring seen edge-on as a line, its pi cloud above and below the ring plane; the empty sp2 orbital of the positive ring carbon points sideways, inside the plane.',
  viewBox: '0 0 760 318',
  build() {
    let s = '';
    s += tag(186, 34, 'VINYL CATION');
    const v = vinyl(P(92, 160));
    s += v.s;
    s += tg(142, 104, 'π cloud, above and below');
    s += sm(192, 236, 'the empty p orbital points at you,');
    s += sm(192, 254, 'at right angles to the π cloud');
    s += rule(386, 50, 386, 272);
    s += tag(566, 34, 'ARYL CATION, RING SEEN EDGE-ON');
    const a = aryl(430, 160);
    s += a.s;
    s += tg(500, 104, 'π cloud, above and below');
    s += tg(a.c.x + 48, 132, 'empty sp²', 'middle');
    s += sm(566, 236, 'the empty sp² orbital lies in the', 'middle');
    s += sm(566, 254, 'ring plane, at right angles to the π cloud', 'middle');
    s += rule(36, 280, 724, 280);
    s += lbl(380, 306, 'In both, the empty orbital points away from the π electrons.');
    return s;
  },
  caption: 'Left: the vinyl cation, its empty p orbital drawn end-on as a circle. Right: a benzene ring seen edge-on, with the ring plane as a line.',
});

FIGURES.push({
  id: 'l-vinyl-aryl',
  lessons: ['carbocations'],
  anchor: '',
  alt: 'Top: a vinyl cation; the pi cloud of the C=C lies above and below the double bond, while the empty p orbital on the linear positive carbon points at the reader, at right angles to it. Bottom: a benzene ring seen edge-on; its pi cloud lies above and below the ring plane, while the empty sp2 orbital of the positive ring carbon points sideways in the plane.',
  viewBox: '0 0 340 414',
  build() {
    let s = '';
    s += tg(170, 22, 'VINYL CATION');
    const v = vinyl(P(56, 118));
    s += v.s;
    s += tg(106, 46, 'π cloud');
    s += lbl(170, 190, 'empty p points at you');
    s += rule(20, 210, 320, 210);
    s += tg(170, 234, 'ARYL CATION, RING EDGE-ON');
    const a = aryl(30, 330);
    s += a.s;
    s += tg(100, 268, 'π cloud');
    s += tg(a.c.x + 48, 306, 'empty sp²');
    s += lbl(170, 400, 'empty sp² lies in the plane');
    return s;
  },
  caption: 'Top: a vinyl cation. Bottom: an aryl cation, with the ring seen edge-on.',
});

/* ======================================================================
   9. 1,2-shifts, drawn skeletally with the moving group written out.
   Each "before" is a four-carbon zigzag whose second carbon (b) is the
   cation (or, for neopentyl, the first). The migrating group sits straight
   up on the neighboring low vertex and the arrow's tail is on that bond.
   ====================================================================== */
const DX = 50, DY = 28;
/* spec: { mig: 'H' | 'CH₃', cat: index of the cation vertex (0 or 1),
           down: true if the migrating carbon has a methyl pointing down } */
function shiftBefore(x0, y0, spec) {
  const v = [P(x0, y0), P(x0 + DX, y0 - DY), P(x0 + 2 * DX, y0), P(x0 + 3 * DX, y0 - DY)];
  if (spec.neo) { v[0] = P(x0 + DX * 0, y0 - DY); v[1] = P(x0 + DX, y0); v[2] = P(x0 + 2 * DX, y0 - DY); v.length = 3; }
  let s = '';
  for (let i = 0; i < v.length - 1; i++) s += skb(v[i], v[i + 1]);
  const catV = v[spec.cat], migV = v[spec.cat + 1];
  const down = at(migV, 270, 44);
  s += skb(migV, down);
  const up = at(migV, 90, 52);
  const r = spec.mig === 'H' ? 12 : 18;
  s += bond(migV, up, { rFrom: 0, rTo: r, cls: 'fg-bond-hi' });
  s += atom(up.x, up.y, spec.mig, { kind: 'hi', r });
  for (const p of [...v, down]) s += dot(p);
  s += chg(P(catV.x - 14, catV.y - 18));
  s += fromBond(migV, up, P(catV.x + 4, catV.y - 7), 14, 5);
  return { s, v, catV, migV };
}
function shiftAfter(x0, y0, spec) {
  const v = [P(x0, y0), P(x0 + DX, y0 - DY), P(x0 + 2 * DX, y0), P(x0 + 3 * DX, y0 - DY)];
  if (spec.neo) { v[0] = P(x0 + DX * 0, y0 - DY); v[1] = P(x0 + DX, y0); v[2] = P(x0 + 2 * DX, y0 - DY); v.length = 3; }
  let s = '';
  for (let i = 0; i < v.length - 1; i++) s += skb(v[i], v[i + 1]);
  const catV = v[spec.cat], migV = v[spec.cat + 1];
  const down = at(migV, 270, 44);
  s += skb(migV, down);
  const r = spec.mig === 'H' ? 12 : 18;
  const up = at(catV, 90, 50);
  s += bond(catV, up, { rFrom: 0, rTo: r, cls: 'fg-bond-hi' });
  s += atom(up.x, up.y, spec.mig, { kind: 'hi', r });
  for (const p of [...v, down]) s += dot(p);
  s += chg(P(migV.x, migV.y - 20));
  return { s, v };
}

const HYD = { mig: 'H', cat: 1 };
const NEO = { mig: 'CH₃', cat: 0, neo: true };

FIGURES.push({
  id: 'one-two-shifts-drawn',
  section: 'carbocations',
  anchor: 'Its head goes on the positive carbon.</p>',
  alt: 'Two rearrangements. Top: in the 3-methylbutan-2-yl cation, a secondary cation, the hydrogen on the next carbon moves over with its bonding pair; a curved arrow starts on that C-H bond and ends at the positive carbon. The result is the 2-methylbutan-2-yl cation, which is tertiary. Bottom: in the neopentyl cation, a primary cation, a methyl group on the next carbon moves over the same way, again giving the tertiary 2-methylbutan-2-yl cation.',
  viewBox: '0 0 760 400',
  build() {
    let s = '';
    const row = (y0, spec, title, from, to, note) => {
      let g = '';
      g += tag(36, y0 - 96, title, { anchor: 'start' });
      const x0 = spec.neo ? 110 : 70;
      g += shiftBefore(x0, y0, spec).s;
      g += tg(145, y0 + 72, from, 'middle', 'fg-tag-warn');
      g += arrow(P(262, y0 - 14), P(318, y0 - 14), { muted: true });
      g += shiftAfter(spec.neo ? 386 : 346, y0, spec).s;
      g += tg(421, y0 + 72, to, 'middle', 'fg-tag-good');
      g += sm(740, y0 - 40, note[0], 'end');
      g += sm(740, y0 - 20, note[1], 'end');
      g += sm(740, y0, note[2], 'end');
      return g;
    };
    s += row(126, HYD, '1,2-HYDRIDE SHIFT', '3-methylbutan-2-yl, 2°', '2-methylbutan-2-yl, 3°',
      ['the tail sits on the C–H bond', 'the H lands on the C⁺', 'and the + moves back one carbon']);
    s += rule(36, 214, 724, 214);
    s += row(326, NEO, '1,2-METHYL SHIFT', 'neopentyl, 1°', '2-methylbutan-2-yl, 3°',
      ['the tail sits on the C–CH₃ bond', 'the CH₃ lands on the C⁺', 'and the + moves back one carbon']);
    return s;
  },
  caption: 'Look at where each arrow&rsquo;s tail sits, and which carbon carries the + before and after. Both shifts end at the same tertiary cation.',
  note: 'A free primary cation such as neopentyl barely exists: the methyl starts to move while the leaving group is still leaving. Drawing the two steps apart is bookkeeping, and the product is the same either way.',
  note: 'A free primary cation such as neopentyl barely exists: the methyl starts to move while the leaving group is still leaving. Drawing the two steps apart is bookkeeping, and the product is the same either way.',
});

FIGURES.push({
  id: 'l-hydride-shift',
  lessons: ['carbocations'],
  anchor: '',
  alt: 'The 3-methylbutan-2-yl cation, a secondary cation. A curved arrow starts on the C-H bond of the next carbon and ends at the positive carbon. Below, after the shift: the hydrogen sits on the old cation carbon, and the positive charge is on the carbon the hydrogen left, now tertiary.',
  viewBox: '0 0 340 392',
  build() {
    let s = '';
    s += tg(170, 22, 'BEFORE: 2°');
    s += shiftBefore(95, 124, HYD).s;
    s += arrow(P(170, 176), P(170, 208), { muted: true });
    s += tg(170, 234, 'AFTER: 3°', 'middle', 'fg-tag-good');
    s += shiftAfter(95, 340, HYD).s;
    return s;
  },
  caption: 'Before and after a 1,2-hydride shift.',
});

FIGURES.push({
  id: 'l-neopentyl-cation',
  lessons: ['carbocations'],
  anchor: '',
  alt: 'The neopentyl cation drawn skeletally: a positive CH2 carbon bonded to a quaternary carbon that carries three methyl groups, one of them written out as CH3 pointing up. The quaternary carbon has no hydrogen.',
  viewBox: '0 0 340 170',
  build() {
    let s = '';
    const v0 = P(120, 80), v1 = P(170, 108), v2 = P(220, 80);
    s += skb(v0, v1) + skb(v1, v2);
    const down = at(v1, 270, 44), up = at(v1, 90, 52);
    s += skb(v1, down);
    s += bond(v1, up, { rFrom: 0, rTo: 18 });
    s += atom(up.x, up.y, 'CH₃', { r: 18 });
    for (const p of [v0, v1, v2, down]) s += dot(p);
    s += chg(P(v0.x - 14, v0.y - 18));
    s += tg(v0.x - 22, v0.y + 20, 'the CH₂⁺', 'end', 'fg-tag-warn');
    s += tg(v1.x + 24, v1.y + 26, 'no H here', 'start');
    return s;
  },
  caption: 'The neopentyl cation, (CH₃)₃C&ndash;CH₂⁺.',
});

FIGURES.push({
  id: 'l-neopentyl-shift',
  lessons: ['carbocations'],
  anchor: '',
  alt: 'The neopentyl cation with a curved arrow from the bond to one methyl group on the quaternary carbon to the positive CH2 carbon. Below, after the shift: that methyl sits on the old CH2, and the positive charge is on the former quaternary carbon, now tertiary.',
  viewBox: '0 0 340 392',
  build() {
    let s = '';
    s += tg(170, 22, 'BEFORE: 1°', 'middle', 'fg-tag-warn');
    s += shiftBefore(120, 124, NEO).s;
    s += arrow(P(170, 176), P(170, 208), { muted: true });
    s += tg(170, 234, 'AFTER: 3°', 'middle', 'fg-tag-good');
    s += shiftAfter(120, 340, NEO).s;
    return s;
  },
  caption: 'Before and after the 1,2-methyl shift.',
});

/* ======================================================================
   10. Worked example 1: 3,3-dimethylbutan-2-ol + HBr, step by step.
   Chain C1–C4 as a zigzag; C3 carries a methyl up and a methyl down.
   ====================================================================== */
function chain(x0, y0) {
  return [P(x0, y0), P(x0 + DX, y0 - DY), P(x0 + 2 * DX, y0), P(x0 + 3 * DX, y0 - DY)];
}
function numbers(v) {
  let s = '';
  s += text(v[0].x - 4, v[0].y + 18, '1', { cls: 'fg-tag-mut', size: 11 });
  s += text(v[1].x, v[1].y + 24, '2', { cls: 'fg-tag-mut', size: 11 });
  s += text(v[2].x + 16, v[2].y + 14, '3', { cls: 'fg-tag-mut', size: 11 });
  s += text(v[3].x + 4, v[3].y + 18, '4', { cls: 'fg-tag-mut', size: 11 });
  return s;
}
/* The skeleton; opts.upOn2: a group label on C2 (up), opts.upOn3: on C3 (up). */
function skeleton(x0, y0, o = {}) {
  const v = chain(x0, y0);
  let s = '';
  for (let i = 0; i < 3; i++) s += skb(v[i], v[i + 1]);
  const down = at(v[2], 270, 42);
  s += skb(v[2], down);
  for (const p of [...v, down]) s += dot(p);
  s += numbers(v);
  return { s, v };
}
const PW = 370, PH = 214;
function wpanel(x, y, title) {
  return tag(x + 14, y + 22, title, { anchor: 'start' });
}

FIGURES.push({
  id: 'methyl-shift-example',
  section: 'carbocations',
  anchor: 'the product is <b>2-bromo-2,3-dimethylbutane</b>.</p>',
  alt: 'Six panels. 1: 3,3-dimethylbutan-2-ol, carbons numbered 1 to 4; a lone pair on the OH oxygen takes the H of H-Br, and the H-Br pair moves onto bromine. 2: the protonated OH2 plus group leaves, a curved arrow carrying the C2-O pair onto oxygen. 3: the secondary cation at C2; a curved arrow starts on the bond from C3 to its upper methyl group and ends at C2. 4: the tertiary cation at C3; bromide ion attacks it with a curved arrow. 5: the product, 2-bromo-2,3-dimethylbutane. 6: 2-bromo-3,3-dimethylbutane, the product without a shift, which does not form.',
  viewBox: '0 0 760 666',
  build() {
    let s = '';
    const X = [10, 390], Y = [8, 230, 452];
    s += rule(380, 20, 380, 646);
    s += rule(20, 222, 740, 222);
    s += rule(20, 444, 740, 444);

    /* 1. protonate the OH */
    {
      const x = X[0], y = Y[0];
      s += wpanel(x, y, '1 · THE OH TAKES H⁺ FROM HBr');
      const k = skeleton(x + 130, y + 150); s += k.s;
      const c2 = k.v[1];
      const o = at(c2, 90, 54);
      s += bond(c2, o, { rFrom: 0, rTo: 15 });
      s += arm(o, 30, 40, 'H', { rFrom: 15 }).s;
      s += lp(o, 150) + lp(o, 90);
      s += atom(o.x, o.y, 'O');
      const h = P(o.x - 66, o.y - 4), br = P(h.x - 50, h.y);
      s += bond(h, br, { rFrom: 12, rTo: 16 });
      s += atom(h.x, h.y, 'H', { r: 12, kind: 'hi' });
      for (const d of [90, 180, 270]) s += lp(br, d, 24);
      s += atom(br.x, br.y, 'Br', { r: 16 });
      s += fromLp(o, 150, at(h, 10, 14), 10);
      s += fromBond(br, h, at(br, 300, 20), -14, -5);
      /* C3's upper methyl, drawn as a line here */
      const up3 = at(k.v[2], 90, 44); s += skb(k.v[2], up3) + dot(up3);
    }
    /* 2. water leaves */
    {
      const x = X[1], y = Y[0];
      s += wpanel(x, y, '2 · WATER LEAVES');
      const k = skeleton(x + 60, y + 150); s += k.s;
      const c2 = k.v[1];
      const o = at(c2, 90, 64);
      s += bond(c2, o, { rFrom: 0, rTo: 16 });
      s += arm(o, 30, 40, 'H', { rFrom: 16 }).s + arm(o, 150, 40, 'H', { rFrom: 16 }).s;
      s += lp(o, 90);
      s += atom(o.x, o.y, 'O', { kind: 'warn' });
      s += chg(at(o, 345, 30));
      s += fromBond(c2, o, at(o, 300, 18), 18, -6);
      const up3 = at(k.v[2], 90, 44); s += skb(k.v[2], up3) + dot(up3);
      s += tg(x + 185, y + 208, 'the C–O pair leaves with the water', 'middle');
    }
    /* 3. the methyl shift */
    {
      const x = X[0], y = Y[1];
      s += wpanel(x, y, '3 · A CH₃ SHIFTS FROM C3 TO C2');
      const k = skeleton(x + 60, y + 150); s += k.s;
      const c2 = k.v[1], c3 = k.v[2];
      const up = at(c3, 90, 52);
      s += bond(c3, up, { rFrom: 0, rTo: 18, cls: 'fg-bond-hi' });
      s += atom(up.x, up.y, 'CH₃', { kind: 'hi', r: 18 });
      s += chg(P(c2.x - 14, c2.y - 18));
      s += fromBond(c3, up, P(c2.x + 4, c2.y - 7), 14, 5);
      s += tg(x + 185, y + 208, 'a secondary cation at C2', 'middle', 'fg-tag-warn');
    }
    /* 4. bromide attacks the tertiary cation */
    {
      const x = X[1], y = Y[1];
      s += wpanel(x, y, '4 · BROMIDE ATTACKS C3');
      const k = skeleton(x + 60, y + 150); s += k.s;
      const c2 = k.v[1], c3 = k.v[2];
      const up = at(c2, 90, 50);
      s += bond(c2, up, { rFrom: 0, rTo: 18, cls: 'fg-bond-hi' });
      s += atom(up.x, up.y, 'CH₃', { kind: 'hi', r: 18 });
      s += chg(P(c3.x - 16, c3.y + 20));
      const br = P(c3.x + 70, c3.y - 92);
      s += bromide(br);
      s += fromLp(br, 180, P(c3.x + 6, c3.y - 14), 18);
      s += tg(x + 185, y + 208, 'a tertiary cation at C3', 'middle', 'fg-tag-good');
    }
    /* 5. the product */
    {
      const x = X[0], y = Y[2];
      s += wpanel(x, y, '5 · THE PRODUCT');
      const k = skeleton(x + 60, y + 150); s += k.s;
      const c2 = k.v[1], c3 = k.v[2];
      const up2 = at(c2, 90, 44); s += skb(c2, up2) + dot(up2);
      const br = at(c3, 90, 54);
      s += bond(c3, br, { rFrom: 0, rTo: 16 });
      s += atom(br.x, br.y, 'Br', { kind: 'hi', r: 16 });
      s += tg(x + 185, y + 208, '2-bromo-2,3-dimethylbutane', 'middle', 'fg-tag-good');
    }
    /* 6. the product without a shift */
    {
      const x = X[1], y = Y[2];
      s += wpanel(x, y, '6 · WITHOUT A SHIFT (NOT FORMED)');
      const k = skeleton(x + 60, y + 150); s += k.s;
      const c2 = k.v[1], c3 = k.v[2];
      const up3 = at(c3, 90, 44); s += skb(c3, up3) + dot(up3);
      const br = at(c2, 90, 54);
      s += bond(c2, br, { rFrom: 0, rTo: 16 });
      s += atom(br.x, br.y, 'Br', { r: 16 });
      s += tg(x + 185, y + 208, '2-bromo-3,3-dimethylbutane', 'middle', 'fg-tag-warn');
    }
    return s;
  },
  caption: 'Every curved arrow starts on a pair of electrons: a lone pair on O (panel 1), a bond (panels 1, 2 and 3), or a lone pair on bromide (panel 4). The highlighted CH₃ is the group that moves. Panel 6 is the answer a student gives when they look only for a hydrogen to shift.',
});

/* ======================================================================
   11. Ring expansion: (chloromethyl)cyclobutane.
   ====================================================================== */
FIGURES.push({
  id: 'ring-expansion-drawn',
  section: 'carbocations',
  anchor: 'and the product is cyclopentanol.</p>',
  alt: 'Three panels. First: (chloromethyl)cyclobutane; a curved arrow carries the C-Cl pair onto chlorine. Second: the primary cation on the outside CH2 carbon; a curved arrow starts on the ring bond between ring carbon a and the ring carbon holding the CH2, and ends at the CH2 carbon. Third: carbon a is now bonded to the old CH2 carbon, so the ring has five members, and the positive charge sits on the former ring carbon: the secondary cyclopentyl cation.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    const mark = (p, t, dx, dy) => text(p.x + dx, p.y + dy, t, { cls: 'fg-tag', size: 11 });
    /* 1. ionization */
    s += tag(130, 34, 'CHLORIDE LEAVES');
    const q1 = polyPts(110, 180, 4, 38, 45);      // 0 upper-right, 1 upper-left, 2 lower-left, 3 lower-right
    s += polyRing(q1, 'fg-bond');
    for (const p of q1) s += dot(p);
    const e1 = P(q1[0].x + 36, q1[0].y - 30);
    s += skb(q1[0], e1) + dot(e1);
    const cl = P(e1.x + 50, e1.y);
    s += bond(e1, cl, { rFrom: 0, rTo: 15 });
    for (const d of [90, 0, 270]) s += lp(cl, d, 23);
    s += atom(cl.x, cl.y, 'Cl', { kind: 'hi' });
    s += fromBond(e1, cl, at(cl, 228, 19), 16, -5);
    s += mark(q1[3], 'a', 12, 12);
    s += mark(e1, 'b', -4, -12);
    s += sm(130, 262, '(chloromethyl)cyclobutane');
    s += arrow(P(236, 180), P(284, 180), { muted: true });

    /* 2. the primary cation and the ring bond that moves */
    s += tag(390, 34, 'A RING BOND MOVES');
    const q2 = polyPts(370, 180, 4, 38, 45);
    s += polyRing(q2, 'fg-bond');
    s += skb(q2[0], q2[3], { cls: 'fg-bond-hi' });
    for (const p of q2) s += dot(p);
    const e2 = P(q2[0].x + 36, q2[0].y - 30);
    s += skb(q2[0], e2) + dot(e2);
    s += chg(P(e2.x + 14, e2.y - 12));
    s += tg(e2.x + 36, e2.y + 6, '1°', 'middle', 'fg-tag-warn');
    s += fromBond(q2[3], q2[0], P(e2.x - 1, e2.y + 7), -22, -6);
    s += mark(e2, 'b', -12, -6);
    s += mark(q2[3], 'a', 12, 12);
    s += sm(390, 262, 'the highlighted bond carries a');
    s += sm(390, 280, 'over to the CH₂⁺ carbon');
    s += arrow(P(500, 180), P(548, 180), { muted: true });

    /* 3. the cyclopentyl cation */
    s += tag(644, 34, 'FIVE-MEMBERED, AND 2°');
    const pg = polyPts(644, 178, 5, 46, 90);      // 0 top, 1 upper-left, 2 lower-left, 3 lower-right, 4 upper-right
    s += polyRing(pg, 'fg-bond');
    for (const p of pg) s += dot(p);
    s += chg(P(pg[0].x, pg[0].y - 18));
    s += mark(pg[3], 'a', 12, 14);
    s += mark(pg[4], 'b', 14, 0);
    s += tg(644, 262, 'cyclopentyl cation', 'middle', 'fg-tag-good');
    s += sm(644, 280, 'secondary, and nearly strain-free');
    s += rule(36, 296, 724, 296);
    s += sm(380, 318, 'Two things improve at once: 1° becomes 2°, and a strained four-membered ring becomes a five.');
    return s;
  },
  caption: 'Follow carbons <b>a</b> and <b>b</b> from panel to panel: the new bond between them is what closes the five-membered ring.',
});

export default FIGURES;
