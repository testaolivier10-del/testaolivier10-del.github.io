/* Figures for the nucleophilic-addition notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every figure here is 340 wide with its panels stacked, and every label is
   fg-lbl or fg-tag, so the same drawing can sit in the lesson on a phone.
   Each mechanism is drawn on a real molecule, with every curved arrow
   starting at a lone pair or a bond. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, panel, rule, P } from '../lib/ochem-figure.mjs';
import { polyPts, polyRing, ringDouble } from '../lib/ochem-skeletal.mjs';
import { armEnd } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---- small local helpers ------------------------------------------------ */

/* An atom whose label is drawn at the CSS size (13px), so the text sits in
   the middle of its disc whatever its length. */
const A = (p, l, kind = 'plain', r) =>
  atom(p.x, p.y, l, { kind, size: 13, r: r ?? (l.length > 2 ? 18 : l.length > 1 ? 16 : 14) });
const rad = (l) => (l.length > 2 ? 18 : l.length > 1 ? 16 : 14);
/* A bond between two labeled atoms, trimmed to both discs. */
const B = (a, la, b, lb, opts = {}) => bond(a, b, { rFrom: la === '' ? 0 : rad(la), rTo: lb === '' ? 0 : rad(lb), ...opts });
/* A formal charge: the label class sets the size, the warn class the color. */
const chg = (x, y, s) => `<text class="fg-lbl fg-warn" x="${x}" y="${y + 5}" text-anchor="middle">${s}</text>`;
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', anchor });
const tg = (x, y, s, kind = '', anchor = 'middle') => text(x, y, s, { cls: kind ? `fg-tag-${kind}` : 'fg-tag', size: 11, anchor });
const box = (y, h, title) => panel(4, y, 332, h) + tag(170, y + 22, title);
/* A double-headed resonance arrow. */
const reso = (x, y) => arrow(P(x, y), P(x + 20, y)) + arrow(P(x, y), P(x - 20, y));
/* A labeled substituent at an angle from a center, drawn plain, wedge or hash. */
function arm(c, lc, deg, len, l, kind = 'plain', atomKind = 'plain') {
  const e = armEnd(c, deg, len);
  const o = { rFrom: rad(lc), rTo: rad(l) };
  let s = kind === 'wedge' ? wedge(c, e, { ...o, width: 9 })
        : kind === 'hash' ? hash(c, e, { ...o, width: 11, rungs: 4 })
        : bond(c, e, { ...o, cls: kind === 'hi' ? 'fg-bond-hi' : 'fg-bond' });
  s += A(e, l, atomKind);
  return { s, e };
}
/* An ethyl group hanging off `c` at angle `deg`: an unlabeled CH2 vertex, then
   a CH3 bent back the zigzag way. */
function ethyl(c, lc, deg, bend) {
  const v = armEnd(c, deg, 50);
  const m = armEnd(v, deg + bend, 48);
  let s = bond(c, v, { rFrom: rad(lc), rTo: 0 }) + bond(v, m, { rFrom: 0, rTo: 18 });
  s += A(m, 'CH₃');
  return { s, v, m };
}
/* A phenyl ring whose ipso carbon is `ipso`, with the ring opening away from
   the atom it is bonded to along direction `deg`. */
function phenyl(ipso, deg, r = 24) {
  const cen = armEnd(ipso, deg, r);
  const pts = polyPts(cen.x, cen.y, 6, r, deg + 180);
  let s = '';
  for (let i = 0; i < 6; i++) {
    const a = pts[i], b = pts[(i + 1) % 6];
    s += i % 2 === 1 ? ringDouble(a, b, cen, { inset: 6, gap: 4.2 }) : bond(a, b, { rFrom: 0, rTo: 0 });
  }
  return s;
}

/* ------------------------------------------------------------------ 1 ---
   The two steps, on one real reaction: cyanide and acetone. Step 1 changes
   the carbon from flat to tetrahedral, so the figure says so on the drawing;
   step 2 is a proton transfer, drawn with its own two arrows. */
FIGURES.push({
  id: 'cyanide-addition',
  section: 'nucleophilic-addition',
  lessons: ['nucleophilic-addition'],
  anchor: '<h3>Two steps, one example</h3>',
  alt: 'Three stacked panels. First, acetone with a flat carbonyl carbon at 120 degrees; a cyanide ion below uses the lone pair on its carbon to attack the carbonyl carbon, and a second arrow moves the pi bond onto the oxygen. Second, the tetrahedral alkoxide: the carbon now carries O minus, two CH3 groups and CN, drawn with a wedge and a hash; a lone pair on the O minus takes the proton of H–CN, and the H–C bond electrons stay on carbon as cyanide. Third, the product, acetone cyanohydrin, with cyanide ion given back.',
  viewBox: '0 0 340 700',
  build() {
    let s = '';
    // ---- panel 1: attack ----
    s += box(8, 222, 'STEP 1 · CYANIDE ATTACKS THE CARBON');
    const c = P(120, 122), o = P(120, 60);
    s += B(c, 'C', o, 'O', { order: 2 });
    s += arm(c, 'C', 210, 52, 'CH₃').s + arm(c, 'C', 330, 52, 'CH₃').s;
    s += A(o, 'O') + A(c, 'C', 'warn');
    s += lonePair(o.x, o.y, 45, { dist: 21 }) + lonePair(o.x, o.y, 135, { dist: 21 });
    s += curve(P(126, 100), P(134, 66), { bow: 12 });
    const cn = P(120, 196), nn = P(178, 196);
    s += B(cn, 'C', nn, 'N', { order: 3 });
    s += A(cn, 'C', 'hi') + A(nn, 'N');
    s += lonePair(cn.x, cn.y, 90, { dist: 21 }) + lonePair(nn.x, nn.y, 0, { dist: 21 });
    s += chg(98, 182, '−');
    s += curve(P(114, 172), P(114, 140), { bow: 10 });
    s += tg(262, 92, 'flat (trigonal planar)', 'mut');
    s += tg(262, 110, 'sp² carbon', 'mut');
    s += tg(262, 128, 'bond angles 120°', 'mut');
    s += tg(250, 214, 'cyanide ion', 'mut');

    // ---- panel 2: the tetrahedral alkoxide takes a proton ----
    s += box(238, 262, 'STEP 2 · THE ALKOXIDE TAKES A PROTON');
    const c2 = P(100, 362), o2 = P(100, 300);
    s += B(c2, 'C', o2, 'O');
    s += arm(c2, 'C', 210, 52, 'CH₃').s + arm(c2, 'C', 330, 52, 'CH₃', 'wedge').s;
    const cc = armEnd(c2, 270, 54), nc = armEnd(c2, 270, 108);
    s += hash(c2, cc, { rFrom: 14, rTo: 14, width: 11, rungs: 4 });
    s += B(cc, 'C', nc, 'N', { order: 3 }) + A(cc, 'C', 'hi') + A(nc, 'N');
    s += lonePair(nc.x, nc.y, 180, { dist: 21 });
    s += A(o2, 'O', 'hi') + A(c2, 'C', 'warn');
    s += lonePair(o2.x, o2.y, 90, { dist: 21 }) + lonePair(o2.x, o2.y, 180, { dist: 21 }) + lonePair(o2.x, o2.y, 0, { dist: 21 });
    s += chg(80, 280, '−');
    const h = P(186, 300), hc = P(246, 300), hn = P(302, 300);
    s += B(h, 'H', hc, 'C') + B(hc, 'C', hn, 'N', { order: 3 });
    s += A(h, 'H') + A(hc, 'C') + A(hn, 'N');
    s += curve(P(126, 296), P(172, 294), { bow: -16 });
    s += curve(P(214, 306), P(242, 318), { bow: 10 });
    s += tg(252, 398, 'tetrahedral', 'mut');
    s += tg(252, 416, 'sp³ carbon', 'mut');
    s += tg(252, 434, 'bond angles 109.5°', 'mut');

    // ---- panel 3: the product ----
    s += box(508, 186, 'PRODUCT · ACETONE CYANOHYDRIN');
    const c3 = P(100, 600), o3 = P(100, 544);
    s += B(c3, 'C', o3, 'OH');
    s += arm(c3, 'C', 210, 52, 'CH₃').s + arm(c3, 'C', 330, 52, 'CH₃', 'wedge').s;
    const cc3 = armEnd(c3, 270, 50), nc3 = P(cc3.x + 56, cc3.y);
    s += hash(c3, cc3, { rFrom: 14, rTo: 14, width: 11, rungs: 4 });
    s += B(cc3, 'C', nc3, 'N', { order: 3 }) + A(cc3, 'C', 'hi') + A(nc3, 'N');
    s += A(o3, 'OH') + A(c3, 'C', 'warn');
    s += lbl(250, 604, '+  ⁻C≡N');
    s += tg(250, 628, 'cyanide is given back', 'mut');
    return s;
  },
  caption: 'Acetone and cyanide. Step 1 has two arrows: the new bond to carbon, and the pi bond moving onto oxygen. Step 2 has two more: the proton moving to oxygen, and the H–C bond staying behind on carbon. Compare the flat carbon in panel 1 with the tetrahedral one in panel 2.',
});

/* ------------------------------------------------------------------ 2 ---
   The protonate-or-collapse fork, drawn with arrows on both branches. */
FIGURES.push({
  id: 'tetrahedral-fork',
  section: 'nucleophilic-addition',
  anchor: '<h3>Protonate or collapse</h3>',
  alt: 'A generic tetrahedral intermediate: a carbon bearing O minus, the nucleophile Nu, a group R and a group Y. Below, two branches. When Y is H or a carbon group, the O minus lone pair takes a proton from H–A and the product is an alcohol. When Y is a leaving group such as Cl or OR, the O minus lone pair moves back down to re-form the C=O and the C–Y bond breaks, releasing Y minus; the product is a new carbonyl compound carrying Nu.',
  viewBox: '0 0 340 560',
  build() {
    let s = '';
    const inter = (c, withLp) => {
      const o = armEnd(c, 90, 58);
      let g = B(c, 'C', o, 'O');
      g += arm(c, 'C', 210, 50, 'Nu', 'plain', 'hi').s + arm(c, 'C', 330, 50, 'R', 'wedge').s;
      g += A(o, 'O', 'hi') + A(c, 'C', 'warn');
      g += chg(o.x - 20, o.y - 20, '−');
      if (withLp) g += lonePair(o.x, o.y, 90, { dist: 21 }) + lonePair(o.x, o.y, 180, { dist: 21 }) + lonePair(o.x, o.y, 0, { dist: 21 });
      return { g, o };
    };
    // ---- top: the intermediate ----
    s += box(8, 180, 'THE TETRAHEDRAL INTERMEDIATE');
    const t = P(130, 110), T = inter(t, true);
    s += T.g;
    const ty = armEnd(t, 270, 50);
    s += hash(t, ty, { rFrom: 14, rTo: 14, width: 11, rungs: 4 }) + A(ty, 'Y');
    s += tg(262, 100, 'Y was already', 'mut');
    s += tg(262, 118, 'on the C=O carbon', 'mut');

    // ---- branch 1: protonate ----
    s += box(196, 172, 'Y = H OR C: IT CANNOT LEAVE');
    const b1 = P(66, 300), I1 = inter(b1, false);
    s += I1.g + lonePair(I1.o.x, I1.o.y, 0, { dist: 21 }) + lonePair(I1.o.x, I1.o.y, 180, { dist: 21 });
    const y1 = armEnd(b1, 270, 44);
    s += hash(b1, y1, { rFrom: 14, rTo: 14, width: 11, rungs: 4 }) + A(y1, 'Y');
    const hA = P(146, 242), aA = P(198, 242);
    s += B(hA, 'H', aA, 'A') + A(hA, 'H') + A(aA, 'A');
    s += curve(P(88, 240), P(132, 236), { bow: -14 });
    s += curve(P(166, 248), P(192, 260), { bow: 10 });
    s += arrow(P(168, 312), P(212, 312), { muted: true });
    s += tg(276, 294, 'alcohol:', 'good');
    s += tg(276, 312, 'the C=O is gone', 'good');
    s += tg(276, 336, 'ADDITION', 'good');
    s += tg(276, 354, '(this chapter)', 'mut');

    // ---- branch 2: collapse ----
    s += box(376, 176, 'Y = Cl, OR…: IT CAN LEAVE');
    const b2 = P(80, 480), I2 = inter(b2, false);
    s += I2.g + lonePair(I2.o.x, I2.o.y, 180, { dist: 21 }) + lonePair(I2.o.x, I2.o.y, 90, { dist: 21 }) + lonePair(I2.o.x, I2.o.y, 0, { dist: 21 });
    const y2 = armEnd(b2, 270, 52);
    s += bond(b2, y2, { rFrom: 14, rTo: 14 }) + A(y2, 'Y');
    s += curve(P(102, 420), P(88, 452), { bow: -14 });
    s += curve(P(86, 506), P(98, 528), { bow: -10 });
    s += arrow(P(168, 486), P(212, 486), { muted: true });
    s += tg(276, 470, 'C=O is back,', 'good');
    s += tg(276, 488, 'Y⁻ has left', 'good');
    s += tg(276, 512, 'SUBSTITUTION', 'good');
    s += tg(276, 530, '(acid derivatives)', 'mut');
    return s;
  },
  caption: 'Top: the intermediate every addition reaches. Middle: nothing can leave, so the O⁻ takes a proton. Bottom: Y can leave, so the O⁻ pushes back down and Y⁻ goes.',
});

/* ------------------------------------------------------------------ 3 ---
   Acid catalysis, on a real case: water adding to acetone in H3O+. */
FIGURES.push({
  id: 'acid-catalyzed-addition',
  section: 'nucleophilic-addition',
  lessons: ['nucleophilic-addition'],
  anchor: '<h3>Under acid: the proton goes on first</h3>',
  alt: 'Four stacked panels for water adding to acetone with an acid catalyst. Step 1: a lone pair on the carbonyl oxygen takes a proton from H3O+, and the H–O bond electrons stay on the water. Step 2: the resulting cation drawn as two resonance contributors, one with C=O+ and every octet full, the other with the positive charge on carbon, which has only six electrons. Step 3: a water lone pair attacks that carbon. Step 4: a second water takes a proton from the added OH2+ group, giving the neutral hydrate, propane-2,2-diol, and giving H3O+ back.',
  viewBox: '0 0 340 836',
  build() {
    let s = '';
    const acet = (c, opts = {}) => {
      const o = armEnd(c, 90, 60);
      let g = B(c, 'C', o, 'O', { order: opts.single ? 1 : 2 });
      g += arm(c, 'C', 210, 50, 'CH₃').s + arm(c, 'C', 330, 50, 'CH₃').s;
      g += A(o, 'O', opts.oKind || 'plain') + A(c, 'C', 'warn');
      return { g, o };
    };
    /* H3O+ or any water whose H is about to be taken: O with two H drawn. */
    const water = (o, hAngles, lpAngles, plus) => {
      let g = '';
      for (const a of hAngles) { const hh = armEnd(o, a, 38); g += B(o, 'O', hh, 'H') + A(hh, 'H'); }
      g += A(o, 'O');
      for (const a of lpAngles) g += lonePair(o.x, o.y, a, { dist: 21 });
      if (plus) g += chg(o.x + 22, o.y - 22, '+');
      return g;
    };

    // ---- 1. protonate the carbonyl oxygen ----
    s += box(8, 196, 'STEP 1 · THE OXYGEN TAKES A PROTON');
    const u1 = acet(P(90, 140));
    s += u1.g + lonePair(u1.o.x, u1.o.y, 30, { dist: 21 }) + lonePair(u1.o.x, u1.o.y, 150, { dist: 21 });
    const h1 = P(180, 68), w1 = P(240, 68);
    s += B(h1, 'H', w1, 'O') + A(h1, 'H', 'hi');
    s += water(w1, [30, 330], [270], true);
    s += curve(P(110, 64), P(166, 62), { bow: -16 });
    s += curve(P(206, 74), P(232, 88), { bow: 10 });
    s += tg(240, 150, 'H₃O⁺, the acid catalyst', 'mut');

    // ---- 2. two contributors ----
    s += box(212, 200, 'STEP 2 · ONE CATION, TWO DRAWINGS');
    const u2 = acet(P(78, 344));
    s += u2.g;
    const h2 = armEnd(u2.o, 30, 38);
    s += B(u2.o, 'O', h2, 'H') + A(h2, 'H');
    s += lonePair(u2.o.x, u2.o.y, 150, { dist: 21 });
    s += chg(u2.o.x - 4, u2.o.y - 26, '+');
    s += curve(P(70, 318), P(60, 290), { bow: 12 });
    s += reso(170, 320);
    const u3 = acet(P(262, 344), { single: true });
    s += u3.g;
    const h3 = armEnd(u3.o, 30, 38);
    s += B(u3.o, 'O', h3, 'H') + A(h3, 'H');
    s += lonePair(u3.o.x, u3.o.y, 150, { dist: 21 }) + lonePair(u3.o.x, u3.o.y, 90, { dist: 21 });
    s += chg(u3.o.x - 26, u3.o.y + 34, '+');
    s += tg(78, 396, 'every octet full', 'mut');
    s += tg(262, 396, 'C⁺: six electrons', 'warn');

    // ---- 3. water attacks the carbon ----
    s += box(420, 184, 'STEP 3 · WATER ADDS TO THE CARBON');
    const u4 = acet(P(100, 540), { single: true });
    s += u4.g;
    const h4 = armEnd(u4.o, 30, 38);
    s += B(u4.o, 'O', h4, 'H') + A(h4, 'H');
    s += lonePair(u4.o.x, u4.o.y, 150, { dist: 21 }) + lonePair(u4.o.x, u4.o.y, 90, { dist: 21 });
    s += chg(u4.o.x - 26, u4.o.y + 34, '+');
    const w4 = P(240, 540);
    s += water(w4, [0, 270], [150, 90], false);
    s += curve(P(220, 530), P(118, 536), { bow: 22 });
    s += tg(240, 460, 'a neutral water', 'mut');
    s += tg(240, 476, 'molecule', 'mut');

    // ---- 4. a second water takes the extra proton ----
    s += box(612, 216, 'STEP 4 · A SECOND WATER TAKES A PROTON');
    const c5 = P(84, 734), o5 = armEnd(c5, 90, 58);
    s += B(c5, 'C', o5, 'OH') + A(o5, 'OH');
    s += arm(c5, 'C', 210, 50, 'CH₃').s;
    s += arm(c5, 'C', 270, 50, 'CH₃', 'hash').s;
    const op = armEnd(c5, 330, 56);
    s += wedge(c5, op, { rFrom: 14, rTo: 14, width: 9 });
    const hb = armEnd(op, 20, 50), hc = armEnd(op, 280, 42);
    s += B(op, 'O', hb, 'H') + A(hb, 'H', 'hi') + B(op, 'O', hc, 'H') + A(hc, 'H');
    s += A(op, 'O', 'hi') + A(c5, 'C', 'warn');
    s += chg(op.x - 6, op.y - 26, '+');
    s += lonePair(op.x, op.y, 200, { dist: 21 });
    const w5 = P(276, 700);
    s += water(w5, [30, 330], [210, 150], false);
    s += curve(P(254, 712), P(190, 734), { bow: -12 });
    s += curve(P(160, 760), P(142, 778), { bow: 10 });
    s += tg(236, 808, 'product: the hydrate,', 'good');
    s += tg(236, 826, 'and H₃O⁺ is back', 'good');
    return s;
  },
  caption: 'Water adding to acetone in dilute acid. The proton goes on first (step 1), the nucleophile adds (step 3), and a proton comes off last (step 4). Count the H₃O⁺: one is used in step 1 and one is made in step 4.',
});

/* ------------------------------------------------------------------ 4 ---
   Hydride from borohydride, on propanal, with the methanol proton drawn. */
FIGURES.push({
  id: 'hydride-reduction',
  section: 'nucleophilic-addition',
  lessons: ['nucleophilic-addition'],
  anchor: '<h3>Hydride reduction: NaBH₄ and LiAlH₄</h3>',
  alt: 'Three stacked panels. First, propanal with borohydride below it: the arrow starts on the B–H bond and ends on the carbonyl carbon, and a second arrow moves the pi bond onto oxygen. Second, the tetrahedral alkoxide with the new hydrogen on a wedge; a lone pair on the O minus takes the proton of methanol, and the H–O bond electrons stay on the methanol oxygen. Third, propan-1-ol, a primary alcohol, with methoxide ion.',
  viewBox: '0 0 340 640',
  build() {
    let s = '';
    const propanal = (c, single) => {
      const o = armEnd(c, 90, 60);
      let g = B(c, 'C', o, 'O', { order: single ? 1 : 2 });
      g += ethyl(c, 'C', 210, -60).s;
      g += arm(c, 'C', 330, 46, 'H').s;
      return { g, o };
    };
    // ---- 1. attack ----
    s += box(8, 214, 'STEP 1 · HYDRIDE MOVES FROM B TO C');
    const c1 = P(136, 116), p1 = propanal(c1);
    s += p1.g + A(p1.o, 'O') + A(c1, 'C', 'warn');
    s += lonePair(p1.o.x, p1.o.y, 45, { dist: 21 }) + lonePair(p1.o.x, p1.o.y, 135, { dist: 21 });
    s += curve(P(142, 94), P(150, 60), { bow: 12 });
    const hh = P(136, 194), bb = P(204, 194);
    s += B(hh, 'H', bb, 'BH₃') + A(hh, 'H', 'hi') + A(bb, 'BH₃');
    s += chg(228, 176, '−');
    s += lbl(276, 198, 'Na⁺');
    s += curve(P(170, 188), P(144, 134), { bow: 14 });
    s += tg(270, 64, 'NaBH₄', 'mut');
    s += tg(270, 82, 'in CH₃OH', 'mut');

    // ---- 2. protonation by the solvent ----
    s += box(230, 226, 'STEP 2 · METHANOL GIVES A PROTON');
    const c2 = P(110, 354), p2 = propanal(c2, true);
    s += p2.g;
    s += arm(c2, 'C', 270, 50, 'H', 'wedge', 'hi').s;
    s += A(p2.o, 'O', 'hi') + A(c2, 'C', 'warn');
    s += lonePair(p2.o.x, p2.o.y, 90, { dist: 21 }) + lonePair(p2.o.x, p2.o.y, 180, { dist: 21 }) + lonePair(p2.o.x, p2.o.y, 0, { dist: 21 });
    s += chg(90, 274, '−');
    const mh = P(190, 294), mo = P(244, 294), mc = P(298, 294);
    s += B(mh, 'H', mo, 'O') + B(mo, 'O', mc, 'CH₃') + A(mh, 'H') + A(mo, 'O') + A(mc, 'CH₃');
    s += lonePair(mo.x, mo.y, 270, { dist: 21 }) + lonePair(mo.x, mo.y, 90, { dist: 21 });
    s += curve(P(136, 290), P(176, 288), { bow: -16 });
    s += curve(P(212, 300), P(236, 314), { bow: 10 });
    s += tg(252, 380, 'tetrahedral', 'mut');
    s += tg(252, 398, 'alkoxide', 'mut');

    // ---- 3. product ----
    s += box(464, 168, 'PRODUCT · PROPAN-1-OL');
    const c3 = P(110, 560), p3 = propanal(c3, true);
    s += p3.g.replace('', '');
    s += arm(c3, 'C', 270, 46, 'H', 'wedge', 'hi').s;
    s += A(p3.o, 'OH') + A(c3, 'C', 'warn');
    s += lbl(254, 540, '+  CH₃O⁻');
    s += tg(254, 574, 'primary (1°) alcohol', 'good');
    return s;
  },
  caption: 'Sodium borohydride reducing propanal. The first arrow starts on a B–H bond, because that bond holds the electron pair the hydrogen carries to carbon. LiAlH₄ does the same thing with an Al–H bond.',
});

/* ------------------------------------------------------------------ 5 ---
   Grignard addition on the same aldehyde, with the separate workup. */
FIGURES.push({
  id: 'grignard-addition',
  section: 'nucleophilic-addition',
  lessons: ['nucleophilic-addition'],
  anchor: '<h3>Grignard reagents: a carbon nucleophile</h3>',
  alt: 'Three stacked panels. First, propanal with methylmagnesium bromide below it: the arrow starts on the C–Mg bond and ends on the carbonyl carbon, making a new carbon–carbon bond, and a second arrow moves the pi bond onto oxygen. Second, the magnesium alkoxide, with the new CH3 on a wedge; after the reaction, H3O+ is added, and a lone pair on the O minus takes its proton. Third, butan-2-ol, a secondary alcohol.',
  viewBox: '0 0 340 640',
  build() {
    let s = '';
    const propanal = (c, single) => {
      const o = armEnd(c, 90, 60);
      let g = B(c, 'C', o, 'O', { order: single ? 1 : 2 });
      g += ethyl(c, 'C', 210, -60).s;
      g += arm(c, 'C', 330, 46, 'H').s;
      return { g, o };
    };
    // ---- 1. attack ----
    s += box(8, 214, 'STEP 1 · CH₃ MOVES FROM Mg TO C');
    const c1 = P(136, 116), p1 = propanal(c1);
    s += p1.g + A(p1.o, 'O') + A(c1, 'C', 'warn');
    s += lonePair(p1.o.x, p1.o.y, 45, { dist: 21 }) + lonePair(p1.o.x, p1.o.y, 135, { dist: 21 });
    s += curve(P(142, 94), P(150, 60), { bow: 12 });
    const me = P(136, 194), mg = P(204, 194), br = P(262, 194);
    s += B(me, 'CH₃', mg, 'Mg') + B(mg, 'Mg', br, 'Br');
    s += A(me, 'CH₃', 'hi') + A(mg, 'Mg') + A(br, 'Br');
    s += lbl(112, 170, 'δ−') ;
    s += lbl(204, 170, 'δ+');
    s += curve(P(172, 188), P(146, 134), { bow: 14 });
    s += tg(270, 64, 'CH₃MgBr', 'mut');
    s += tg(270, 82, 'in dry ether', 'mut');

    // ---- 2. workup ----
    s += box(230, 226, 'STEP 2 · LATER, H₃O⁺ IS ADDED');
    const c2 = P(110, 354), p2 = propanal(c2, true);
    s += p2.g;
    s += arm(c2, 'C', 270, 52, 'CH₃', 'wedge', 'hi').s;
    s += A(p2.o, 'O', 'hi') + A(c2, 'C', 'warn');
    s += lonePair(p2.o.x, p2.o.y, 90, { dist: 21 }) + lonePair(p2.o.x, p2.o.y, 180, { dist: 21 }) + lonePair(p2.o.x, p2.o.y, 0, { dist: 21 });
    s += chg(90, 274, '−');
    s += lbl(46, 256, '⁺MgBr');
    const wh = P(190, 294), wo = P(246, 294);
    s += B(wh, 'H', wo, 'O') + A(wh, 'H');
    for (const a of [30, 330]) { const x = armEnd(wo, a, 38); s += B(wo, 'O', x, 'H') + A(x, 'H'); }
    s += A(wo, 'O') + lonePair(wo.x, wo.y, 270, { dist: 21 });
    s += chg(wo.x - 2, wo.y - 30, '+');
    s += curve(P(136, 290), P(176, 288), { bow: -16 });
    s += curve(P(214, 300), P(238, 314), { bow: 10 });
    s += tg(252, 386, 'magnesium', 'mut');
    s += tg(252, 404, 'alkoxide', 'mut');

    // ---- 3. product ----
    s += box(464, 168, 'PRODUCT · BUTAN-2-OL');
    const c3 = P(110, 560), p3 = propanal(c3, true);
    s += p3.g;
    s += arm(c3, 'C', 270, 50, 'CH₃', 'wedge', 'hi').s;
    s += A(p3.o, 'OH') + A(c3, 'C', 'warn');
    s += tg(254, 552, 'secondary (2°)', 'good');
    s += tg(254, 570, 'alcohol', 'good');
    s += tg(254, 594, 'new C–C bond', 'mut');
    return s;
  },
  caption: 'Methylmagnesium bromide adding to propanal. The first arrow starts on the C–Mg bond, and the bond it makes is a new C–C bond. The H₃O⁺ in step 2 is added only after the Grignard reagent has been used up.',
});

/* ------------------------------------------------------------------ 6 ---
   Why an ester takes two Grignards: collapse, then a second addition. */
FIGURES.push({
  id: 'ester-grignard',
  section: 'nucleophilic-addition',
  anchor: 'is where that branch is taught in full.</p>',
  alt: 'Three stacked panels for methyl propanoate with two equivalents of methylmagnesium bromide. First, the tetrahedral intermediate from the first addition: the O minus lone pair moves back down to re-form the C=O, and the C–OCH3 bond breaks so methoxide leaves. Second, the ketone that forms, butan-2-one, is attacked by a second CH3MgBr, with the arrow starting on the C–Mg bond. Third, after H3O+ workup, 2-methylbutan-2-ol, a tertiary alcohol whose two highlighted methyl groups both came from the Grignard reagent.',
  viewBox: '0 0 340 596',
  build() {
    let s = '';
    // ---- 1. collapse ----
    s += box(8, 198, 'FIRST CH₃ IN · THE INTERMEDIATE COLLAPSES');
    const c1 = P(130, 104), o1 = armEnd(c1, 90, 58);
    s += B(c1, 'C', o1, 'O');
    s += ethyl(c1, 'C', 210, -60).s;
    s += arm(c1, 'C', 330, 50, 'CH₃', 'wedge', 'hi').s;
    const om = armEnd(c1, 270, 54), mm = armEnd(om, 330, 46);
    s += bond(c1, om, { rFrom: 14, rTo: 14 }) + B(om, 'O', mm, 'CH₃') + A(om, 'O') + A(mm, 'CH₃');
    s += A(o1, 'O', 'hi') + A(c1, 'C', 'warn');
    s += lonePair(o1.x, o1.y, 180, { dist: 21 }) + lonePair(o1.x, o1.y, 90, { dist: 21 }) + lonePair(o1.x, o1.y, 0, { dist: 21 });
    s += chg(110, 26, '−');
    s += curve(P(152, 44), P(138, 76), { bow: -14 });
    s += curve(P(136, 130), P(146, 150), { bow: -10 });
    s += tg(268, 104, 'CH₃O⁻ leaves', 'mut');

    // ---- 2. second addition to the ketone ----
    s += box(214, 196, 'THE KETONE MEETS A SECOND CH₃MgBr');
    const c2 = P(130, 306), o2 = armEnd(c2, 90, 58);
    s += B(c2, 'C', o2, 'O', { order: 2 });
    s += ethyl(c2, 'C', 210, -60).s;
    s += arm(c2, 'C', 330, 50, 'CH₃', 'plain', 'hi').s;
    s += A(o2, 'O') + A(c2, 'C', 'warn');
    s += lonePair(o2.x, o2.y, 45, { dist: 21 }) + lonePair(o2.x, o2.y, 135, { dist: 21 });
    s += curve(P(136, 284), P(144, 252), { bow: 12 });
    const me = P(130, 380), mg = P(196, 380), br = P(254, 380);
    s += B(me, 'CH₃', mg, 'Mg') + B(mg, 'Mg', br, 'Br') + A(me, 'CH₃', 'hi') + A(mg, 'Mg') + A(br, 'Br');
    s += curve(P(164, 374), P(140, 324), { bow: 14 });
    s += tg(270, 250, 'butan-2-one', 'mut');

    // ---- 3. product ----
    s += box(418, 170, 'AFTER H₃O⁺ WORKUP');
    const c3 = P(130, 516), o3 = armEnd(c3, 90, 56);
    s += B(c3, 'C', o3, 'OH');
    s += ethyl(c3, 'C', 210, -60).s;
    s += arm(c3, 'C', 330, 50, 'CH₃', 'plain', 'hi').s;
    s += arm(c3, 'C', 270, 48, 'CH₃', 'wedge', 'hi').s;
    s += A(o3, 'OH') + A(c3, 'C', 'warn');
    s += tg(262, 540, '3° alcohol', 'good');
    s += tg(262, 558, 'two new CH₃', 'good');
    return s;
  },
  caption: 'Methyl propanoate with two CH₃MgBr. Panel 1 is the substitution branch: the C=O comes back and CH₃O⁻ leaves. The ketone it leaves behind is then attacked like any ketone.',
});

/* ------------------------------------------------------------------ 7 ---
   The worked example drawn: 2-phenylbutan-2-ol and its three cuts. */
FIGURES.push({
  id: 'grignard-disconnections',
  section: 'nucleophilic-addition',
  anchor: '<p><b>Step 1: find the carbinol carbon.</b>',
  alt: '2-Phenylbutan-2-ol drawn at the top: a carbon bearing OH, a phenyl ring, an ethyl group and a methyl group, with the three carbon–carbon bonds at that carbon labeled a (to the ring), b (to the ethyl) and c (to the methyl). Below, three rows. Cut a gives phenylmagnesium bromide and butan-2-one. Cut b gives ethylmagnesium bromide and acetophenone. Cut c gives methylmagnesium bromide and propiophenone.',
  viewBox: '0 0 340 610',
  build() {
    let s = '';
    // ---- the target ----
    s += box(8, 196, 'TARGET · 2-PHENYLBUTAN-2-OL');
    const c = P(170, 112), o = armEnd(c, 90, 56);
    s += B(c, 'C', o, 'OH') + A(o, 'OH');
    const ip = armEnd(c, 210, 50);
    s += bond(c, ip, { rFrom: 14, rTo: 0, cls: 'fg-bond-hi' }) + phenyl(ip, 210);
    const v = armEnd(c, 330, 50), m = armEnd(v, 30, 46);
    s += bond(c, v, { rFrom: 14, rTo: 0, cls: 'fg-bond-hi' }) + bond(v, m, { rFrom: 0, rTo: 18 }) + A(m, 'CH₃');
    const me = armEnd(c, 270, 52);
    s += bond(c, me, { rFrom: 14, rTo: 18, cls: 'fg-bond-hi' }) + A(me, 'CH₃');
    s += A(c, 'C', 'warn');
    s += tg(138, 110, 'a', 'warn') + tg(202, 110, 'b', 'warn') + tg(182, 146, 'c', 'warn');
    s += tg(262, 64, 'carbinol carbon:', 'mut');
    s += tg(262, 80, 'the C that holds OH', 'mut');

    // ---- the three cuts ----
    const ketone = (cx, y, left, right) => {
      const k = P(cx, y), ko = armEnd(k, 90, 50);
      let g = B(k, 'C', ko, 'O', { order: 2 }) + A(ko, 'O');
      if (left === 'Ph') { const i = armEnd(k, 210, 46); g += bond(k, i, { rFrom: 14, rTo: 0 }) + phenyl(i, 210, 22); }
      else g += arm(k, 'C', 210, 46, 'CH₃').s;
      if (right === 'Et') { const vv = armEnd(k, 330, 46), mm = armEnd(vv, 30, 44); g += bond(k, vv, { rFrom: 14, rTo: 0 }) + bond(vv, mm, { rFrom: 0, rTo: 18 }) + A(mm, 'CH₃'); }
      else g += arm(k, 'C', 330, 46, 'CH₃').s;
      return g + A(k, 'C', 'warn');
    };
    const rows = [
      { y: 212, t: 'CUT a · PhMgBr + BUTAN-2-ONE', g: 'PhMgBr', l: 'CH₃', r: 'Et' },
      { y: 344, t: 'CUT b · EtMgBr + ACETOPHENONE', g: 'CH₃CH₂MgBr', l: 'Ph', r: 'CH₃' },
      { y: 476, t: 'CUT c · CH₃MgBr + PROPIOPHENONE', g: 'CH₃MgBr', l: 'Ph', r: 'Et' },
    ];
    for (const r of rows) {
      s += box(r.y, 124, r.t);
      s += lbl(60, r.y + 84, r.g);
      s += lbl(124, r.y + 84, '+');
      s += ketone(228, r.y + 90, r.l, r.r);
    }
    return s;
  },
  caption: 'Each cut breaks one highlighted bond. The piece that leaves becomes the Grignard reagent; the rest, with C–OH turned back into C=O, becomes the ketone. Ph is short for phenyl, a benzene ring used as a group.',
});

/* ------------------------------------------------------------------ 8 ---
   Where the new double bond lands: imine against enamine. */
FIGURES.push({
  id: 'imine-vs-enamine',
  section: 'nucleophilic-addition',
  lessons: ['nucleophilic-addition'],
  anchor: '<h3>Nitrogen nucleophiles: where they go next</h3>',
  alt: 'Two stacked panels. Top: acetone and methylamine lose water to give an imine, (CH3)2C=N–CH3, with the C=N double bond highlighted. Bottom: acetone and dimethylamine lose water to give an enamine, CH2=C(CH3)–N(CH3)2, with the C=C double bond highlighted between the former carbonyl carbon and the carbon next to it.',
  viewBox: '0 0 340 380',
  build() {
    let s = '';
    // ---- imine ----
    s += box(8, 176, 'ACETONE + CH₃NH₂, − H₂O');
    const c = P(110, 100), n = P(180, 100);
    s += B(c, 'C', n, 'N', { order: 2, cls: 'fg-bond-hi' });
    s += arm(c, 'C', 150, 50, 'CH₃').s + arm(c, 'C', 210, 50, 'CH₃').s;
    s += arm(n, 'N', 300, 50, 'CH₃').s;
    s += lonePair(n.x, n.y, 60, { dist: 21 });
    s += A(c, 'C', 'warn') + A(n, 'N', 'hi');
    s += tg(170, 168, 'IMINE: the double bond goes to N', 'good');

    // ---- enamine ----
    s += box(192, 180, 'ACETONE + (CH₃)₂NH, − H₂O');
    const c2 = P(150, 276), ch2 = armEnd(c2, 210, 56), n2 = armEnd(c2, 330, 54);
    s += B(c2, 'C', ch2, 'CH₂', { order: 2, cls: 'fg-bond-hi' }) + A(ch2, 'CH₂', 'hi');
    s += arm(c2, 'C', 90, 50, 'CH₃').s;
    s += B(c2, 'C', n2, 'N');
    s += arm(n2, 'N', 30, 50, 'CH₃').s + arm(n2, 'N', 270, 46, 'CH₃').s;
    s += lonePair(n2.x, n2.y, 150, { dist: 21 });
    s += A(c2, 'C', 'warn') + A(n2, 'N');
    s += tg(62, 238, 'the carbon', 'mut') + tg(62, 254, 'next door', 'mut');
    s += tg(170, 362, 'ENAMINE: the double bond goes to C', 'good');
    return s;
  },
  caption: 'The same ketone with two amines. The coral carbon was the C=O carbon. With CH₃NH₂ its new double bond goes to nitrogen; with (CH₃)₂NH it goes to the carbon next door.',
});

export default FIGURES;
