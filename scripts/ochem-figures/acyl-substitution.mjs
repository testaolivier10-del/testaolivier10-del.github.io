/* Figures for the acyl-substitution notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every mechanism is drawn on a real molecule, with every curved arrow
   starting at a lone pair or a bond. Each mechanism panel is a function of
   its top-left corner, so the same panel can sit in a two-column notes figure
   or in a stacked 340-wide lesson copy. Lesson figures use fg-lbl and fg-tag
   labels only. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, panel, rule, P } from '../lib/ochem-figure.mjs';
import { polyPts, ringDouble } from '../lib/ochem-skeletal.mjs';
import { armEnd } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---- small local helpers ------------------------------------------------ */

const rad = (l) => (l.length > 4 ? 23 : l.length > 3 ? 20 : l.length > 2 ? 18 : l.length > 1 ? 16 : 14);
/* An atom whose label is drawn at the CSS size (13px). */
const A = (p, l, kind = 'plain') => atom(p.x, p.y, l, { kind, size: 13, r: rad(l) });
/* A bond between two labeled atoms, trimmed to both discs. */
const B = (a, la, b, lb, opts = {}) => bond(a, b, { rFrom: rad(la), rTo: rad(lb), ...opts });
/* A formal charge. */
const chg = (x, y, s) => `<text class="fg-lbl fg-warn" x="${x}" y="${y + 5}" text-anchor="middle">${s}</text>`;
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', anchor });
const tg = (x, y, s, kind = '', anchor = 'middle') => text(x, y, s, { cls: kind ? `fg-tag-${kind}` : 'fg-tag', size: 11, anchor });
/* A labeled substituent at an angle from a center: plain, wedge, hash or hi. */
function arm(c, lc, deg, len, l, kind = 'plain', atomKind = 'plain') {
  const e = armEnd(c, deg, len);
  const o = { rFrom: rad(lc), rTo: rad(l) };
  let s = kind === 'wedge' ? wedge(c, e, { ...o, width: 9 })
        : kind === 'hash' ? hash(c, e, { ...o, width: 11, rungs: 4 })
        : bond(c, e, { ...o, cls: kind === 'hi' ? 'fg-bond-hi' : 'fg-bond' });
  s += A(e, l, atomKind);
  return { s, e };
}
/* Lone pairs on an atom, at SVG angles (0 right, 90 down, 270 up). */
const lps = (p, angles) => angles.map((a) => lonePair(p.x, p.y, a, { dist: 21 })).join('');
/* A phenyl ring whose ipso carbon is `ipso`, opening away along `deg`. */
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
/* The arrow for an X–H bond whose electrons go back to X, X to the left of H:
   it runs under the bond and ends under X. */
const pullLeft = (h, x) => curve(P((h.x + x.x) / 2 + 4, h.y + 12), P(x.x + 12, x.y + 17), { bow: -8 });
/* A panel frame with its title, at local corner (x0, y0), 332 wide. */
const box = (x0, y0, h, title) => panel(x0 + 4, y0, 332, h) + tag(x0 + 170, y0 + 22, title);
/* An oxygen carrying explicit groups: [{ deg, label, len }], SVG lone-pair
   angles, and an optional formal charge at an offset. */
function oxy(o, groups, lpAngles, charge, kind = 'plain') {
  let s = '';
  for (const g of groups) {
    const e = armEnd(o, g.deg, g.len ?? 40);
    s += B(o, 'O', e, g.label, g.cls ? { cls: g.cls } : {}) + A(e, g.label, g.kind || 'plain');
  }
  s += A(o, 'O', kind) + lps(o, lpAngles);
  if (charge) s += chg(o.x + charge[0], o.y + charge[1], charge[2]);
  return s;
}

/* ---- the acyl carbon, in its two shapes ---------------------------------- */

/* A flat C=O carbon: O up, groups at 210° and 330°. */
function flat(c, left, right, opts = {}) {
  const o = armEnd(c, 90, 58);
  let s = B(c, 'C', o, 'O', { order: 2 });
  s += arm(c, 'C', 210, opts.lenL ?? 50, left, 'plain', opts.leftKind).s;
  s += arm(c, 'C', 330, opts.lenR ?? 52, right, 'plain', opts.rightKind).s;
  s += A(o, 'O', opts.oKind) + A(c, 'C', 'warn');
  if (!opts.noLp) s += lps(o, [225, 315]);
  return { s, o, r: armEnd(c, 330, opts.lenR ?? 52) };
}
/* A tetrahedral carbon: top group up, left on a wedge at 210°, right plain
   at 330°, bottom on a hash at 270°. The top group is drawn by the caller
   when it needs more than a label. */
function tet(c, top, left, right, bottom, opts = {}) {
  const o = armEnd(c, 90, 56);
  let s = '';
  if (top) s += B(c, 'C', o, top) + A(o, top, opts.topKind);
  s += arm(c, 'C', 210, 50, left, 'wedge').s;
  const r = arm(c, 'C', 330, opts.lenR ?? 54, right, opts.rightBond || 'plain', opts.rightKind);
  s += r.s;
  let b = null;
  if (bottom) { const bb = arm(c, 'C', 270, opts.lenB ?? 54, bottom, 'hash', opts.bottomKind); s += bb.s; b = bb.e; }
  s += A(c, 'C', 'warn');
  return { s, o, r: r.e, b };
}
/* An O⁻ on top of a tetrahedral carbon: three lone pairs and the charge. */
const topAlkoxide = (o) => A(o, 'O', 'hi') + lps(o, [270, 180, 0]) + chg(o.x - 28, o.y - 26, '−');
/* The collapse arrow: from the right lone pair of the top O⁻ down into the C–O bond. */
const collapse = (o) => curve(P(o.x + 22, o.y + 2), P(o.x + 8, o.y + 32), { bow: -14 });
/* The arrow that breaks the bond to the 330° group and ends on that group. */
const breakRight = (c, r) => curve(P((c.x + r.x) / 2 - 2, (c.y + r.y) / 2 - 8), P(r.x + 2, r.y - 18), { bow: -12 });

/* ------------------------------------------------------------------ 1 ---
   The mechanism on one real reaction: acetyl chloride and methoxide. */
function addElim(x0, y0) {
  const Q = (x, y) => P(x0 + x, y0 + y);
  let s = '';
  // ---- step 1 ----
  s += box(x0, y0 + 8, 232, 'STEP 1 · METHOXIDE ADDS TO THE C=O');
  const c1 = Q(120, 124), f1 = flat(c1, 'CH₃', 'Cl');
  s += f1.s;
  s += curve(Q(126, 102), Q(136, 66), { bow: 12 });
  const om = Q(120, 196), mc = armEnd(om, 0, 54);
  s += B(om, 'O', mc, 'CH₃') + A(mc, 'CH₃');
  s += A(om, 'O', 'hi') + lps(om, [270, 180, 90]);
  s += chg(x0 + 96, y0 + 172, '−');
  s += curve(Q(126, 172), Q(126, 144), { bow: -10 });
  s += tg(x0 + 262, y0 + 92, 'acetyl chloride', 'mut');
  s += tg(x0 + 262, y0 + 226, 'methoxide ion', 'mut');
  // ---- step 2 ----
  s += box(x0, y0 + 248, 236, 'STEP 2 · THE O⁻ PUSHES BACK, Cl⁻ LEAVES');
  const c2 = Q(110, 382), t2 = tet(c2, null, 'CH₃', 'Cl', 'OCH₃', { bottomKind: 'hi', lenB: 56 });
  s += B(c2, 'C', t2.o, 'O') + t2.s + topAlkoxide(t2.o);
  s += collapse(t2.o);
  s += breakRight(c2, t2.r);
  s += tg(x0 + 262, y0 + 332, 'tetrahedral', 'mut');
  s += tg(x0 + 262, y0 + 350, 'intermediate', 'mut');
  s += tg(x0 + 262, y0 + 452, 'the C–Cl bond breaks', 'warn');
  // ---- product ----
  s += box(x0, y0 + 494, 170, 'PRODUCT · METHYL ACETATE + Cl⁻');
  const c3 = Q(100, 600), f3 = flat(c3, 'CH₃', 'OCH₃', { rightKind: 'hi' });
  s += f3.s;
  s += lbl(x0 + 252, y0 + 588, '+  Cl⁻');
  s += tg(x0 + 252, y0 + 616, 'OCH₃ is where Cl was', 'good');
  return s;
}
FIGURES.push({
  id: 'acyl-addition-elimination',
  section: 'acyl-substitution',
  lessons: ['acyl-substitution'],
  anchor: '<h3>Addition, then elimination</h3>',
  alt: 'Three stacked panels. First, acetyl chloride with methoxide ion below it: a lone pair on the methoxide oxygen attacks the carbonyl carbon, and a second arrow moves the pi bond onto the carbonyl oxygen. Second, the tetrahedral intermediate: the carbon carries O minus, CH3, Cl and the new OCH3; a lone pair on the O minus moves back down to re-form the C=O, and the C–Cl bond breaks with its electrons going to chlorine. Third, the product, methyl acetate, with chloride ion.',
  viewBox: '0 0 340 672',
  build() { return addElim(0, 0); },
  caption: 'Acetyl chloride and methoxide ion. Watch the carbon: flat in the top panel, tetrahedral in the middle one, flat again at the bottom.',
});

/* ------------------------------------------------------------------ 3 ---
   Ester to amide, with the zwitterion and its proton transfer drawn. */
function esterToAmide(x0, y0) {
  const Q = (x, y) => P(x0 + x, y0 + y);
  let s = '';
  // ---- step 1 ----
  s += box(x0, y0 + 8, 236, 'STEP 1 · THE AMINE ADDS TO THE C=O');
  const c1 = Q(120, 124), f1 = flat(c1, 'CH₃', 'OCH₃');
  s += f1.s;
  s += curve(Q(126, 102), Q(136, 66), { bow: 12 });
  const n1 = Q(120, 196);
  s += arm(n1, 'N', 0, 54, 'CH₃').s + arm(n1, 'N', 180, 38, 'H').s + arm(n1, 'N', 270, 36, 'H').s;
  s += A(n1, 'N', 'hi') + lps(n1, [270]);
  s += curve(Q(126, 172), Q(126, 144), { bow: -10 });
  s += tg(x0 + 262, y0 + 92, 'methyl acetate', 'mut');
  s += tg(x0 + 262, y0 + 180, 'methylamine', 'mut');
  // ---- step 2: the zwitterion loses its N–H proton ----
  s += box(x0, y0 + 252, 250, 'STEP 2 · A SECOND AMINE TAKES H⁺ OFF N⁺');
  const c2 = Q(92, 372);
  const t2 = tet(c2, null, 'CH₃', 'OCH₃', null, {});
  // The hash to N is drawn by hand so N can carry its own groups.
  const n2 = armEnd(c2, 270, 58);
  s += B(c2, 'C', t2.o, 'O') + topAlkoxide(t2.o) + t2.s;
  s += hash(c2, n2, { rFrom: 14, rTo: 14, width: 11, rungs: 4 });
  s += A(n2, 'N', 'hi');
  const nh = armEnd(n2, 0, 42), nm = armEnd(n2, 270, 46), nh2 = armEnd(n2, 215, 38);
  s += B(n2, 'N', nh, 'H') + A(nh, 'H') + B(n2, 'N', nm, 'CH₃') + A(nm, 'CH₃') + B(n2, 'N', nh2, 'H') + A(nh2, 'H');
  s += chg(n2.x - 18, n2.y - 16, '+');
  // the second methylamine, lone pair pointing at the N–H proton
  const n3 = Q(228, 430);
  s += arm(n3, 'N', 0, 54, 'CH₃').s + arm(n3, 'N', 90, 36, 'H').s + arm(n3, 'N', 270, 36, 'H').s;
  s += A(n3, 'N') + lps(n3, [180]);
  s += curve(Q(204, 418), Q(nh.x - x0 + 14, nh.y - y0 - 8), { bow: 12 });
  s += pullLeft(nh, n2);
  s += tg(x0 + 250, y0 + 314, 'N⁺ and O⁻ on one', 'mut');
  s += tg(x0 + 250, y0 + 332, 'molecule: a zwitterion', 'mut');
  // ---- step 3: collapse, CH3O- leaves ----
  s += box(x0, y0 + 512, 236, 'STEP 3 · THE O⁻ PUSHES BACK, CH₃O⁻ LEAVES');
  const c4 = Q(110, 640), t4 = tet(c4, null, 'CH₃', 'OCH₃', 'NHCH₃', { lenR: 56, lenB: 58 });
  s += B(c4, 'C', t4.o, 'O') + t4.s + topAlkoxide(t4.o);
  s += collapse(t4.o) + breakRight(c4, t4.r);
  s += tg(x0 + 262, y0 + 590, 'CH₃O⁻ leaves', 'good');
  s += tg(x0 + 262, y0 + 608, '(CH₃OH, pKa 16)', 'good');
  s += tg(x0 + 262, y0 + 706, 'CH₃NH⁻ does not leave', 'warn');
  s += tg(x0 + 262, y0 + 724, '(CH₃NH₂, pKa ≈ 38)', 'warn');
  // ---- product ----
  s += box(x0, y0 + 758, 176, 'PRODUCT · THE AMIDE');
  const c5 = Q(96, 864), f5 = flat(c5, 'CH₃', 'NHCH₃', { rightKind: 'hi', lenR: 56 });
  s += f5.s;
  s += lbl(x0 + 250, y0 + 840, '+  CH₃O⁻');
  s += tg(x0 + 250, y0 + 866, 'which takes a proton', 'mut');
  s += tg(x0 + 250, y0 + 884, 'from CH₃NH₃⁺', 'mut');
  return s;
}
FIGURES.push({
  id: 'ester-to-amide',
  section: 'acyl-substitution',
  lessons: ['acyl-substitution'],
  anchor: '<h3>Which group leaves?</h3>',
  alt: 'Four stacked panels. First, methyl acetate with methylamine below it: the nitrogen lone pair attacks the carbonyl carbon and the pi bond moves onto oxygen. Second, the zwitterionic tetrahedral intermediate, with N plus carrying two hydrogens and a CH3, and O minus on the same carbon; a second methylamine uses its lone pair to take one N–H proton, and the N–H bond electrons stay on nitrogen. Third, the anionic intermediate: the O minus lone pair re-forms the C=O and the C–OCH3 bond breaks, so methoxide leaves while the NHCH3 group stays. Fourth, the product, N-methylacetamide, with methoxide, which then takes a proton from the methylammonium ion.',
  viewBox: '0 0 340 942',
  build() { return esterToAmide(0, 0); },
  caption: 'Methyl acetate and methylamine. In the third panel, compare the two groups that could leave.',
});

/* ------------------------------------------------------------------ 4 ---
   The same intermediate reached from the amide side: it still sheds CH3O-. */
FIGURES.push({
  id: 'amide-ester-choice',
  section: 'acyl-substitution',
  anchor: '<h3>Which group leaves?</h3>',
  alt: 'One tetrahedral intermediate: a carbon carrying O minus on top, CH3 on a wedge, NHCH3 on the left and OCH3 on the right. The bond to OCH3 is highlighted and labeled "breaks: methoxide leaves, pKa 16". The bond to NHCH3 is labeled "stays: CH3NH minus would be pKa 38". Below, two notes: from the ester plus methylamine this leads to the amide; from the amide plus methanol it leads back to the amide.',
  viewBox: '0 0 340 300',
  build() {
    let s = '';
    s += panel(4, 8, 332, 284);
    s += tag(170, 30, 'ONE INTERMEDIATE, TWO WAYS OUT');
    const c = P(170, 138), o = armEnd(c, 90, 56);
    s += B(c, 'C', o, 'O') + topAlkoxide(o);
    const l = armEnd(c, 210, 58), r = armEnd(c, 330, 58), d = armEnd(c, 270, 50);
    s += B(c, 'C', l, 'NHCH₃') + A(l, 'NHCH₃');
    s += bond(c, r, { rFrom: 14, rTo: 18, cls: 'fg-bond-hi' }) + A(r, 'OCH₃', 'hi');
    s += hash(c, d, { rFrom: 14, rTo: 18, width: 11, rungs: 4 }) + A(d, 'CH₃');
    s += A(c, 'C', 'warn');
    s += tg(262, 142, 'this bond breaks', 'good');
    s += tg(262, 212, 'leaves as CH₃O⁻', 'good');
    s += tg(262, 230, '(CH₃OH, pKa 16)', 'good');
    s += tg(76, 212, 'would leave as CH₃NH⁻', 'warn');
    s += tg(76, 230, '(CH₃NH₂, pKa ≈ 38)', 'warn');
    s += rule(24, 246, 316, 246);
    s += tg(170, 266, 'ester + CH₃NH₂ → amide');
    s += tg(170, 284, 'amide + CH₃OH → back to the amide');
    return s;
  },
  caption: 'The intermediate from the worked example, reached this time from the amide and methanol. The highlighted bond is the one that breaks either way.',
});

/* ------------------------------------------------------------------ 5 ---
   Fischer esterification, every step with its arrows: acetic acid and
   methanol, with protonated methanol as the acid. */
const H = 224; // panel height
/* Protonated methanol with the proton to be given drawn on the LEFT. */
function mh2Left(h, o) {
  let s = B(h, 'H', o, 'O') + A(h, 'H', 'hi');
  s += oxy(o, [{ deg: 60, label: 'H', len: 38 }, { deg: 300, label: 'CH₃', len: 50 }], [0], [-20, -26, '+']);
  return s;
}
/* A neutral methanol whose lone pair points LEFT at a proton. */
function meohLeft(o, hUp = true) {
  return oxy(o, [{ deg: hUp ? 90 : 270, label: 'H', len: 38 }, { deg: 0, label: 'CH₃', len: 50 }], [180, hUp ? 120 : 240]);
}
const fisch = {
  p1(x0, y0, title = '1 · THE C=O OXYGEN TAKES A PROTON') {
    const Q = (x, y) => P(x0 + x, y0 + y);
    let s = box(x0, y0, H, title);
    const c = Q(90, 140), f = flat(c, 'CH₃', 'OH');
    s += f.s;
    s += mh2Left(Q(188, 82), Q(244, 82));
    s += curve(Q(106, 66), Q(176, 74), { bow: -16 });
    s += curve(Q(212, 88), Q(231, 96), { bow: 10 });
    s += tg(x0 + 244, y0 + 180, 'CH₃OH₂⁺, the acid', 'mut');
    s += tg(x0 + 244, y0 + 198, '(H₂SO₄ in methanol)', 'mut');
    return s;
  },
  p2(x0, y0, title = '2 · METHANOL ADDS TO THE CARBON') {
    const Q = (x, y) => P(x0 + x, y0 + y);
    let s = box(x0, y0, H, title);
    const c = Q(90, 132), o = armEnd(c, 90, 58);
    s += B(c, 'C', o, 'O', { order: 2 });
    s += arm(c, 'C', 210, 50, 'CH₃').s + arm(c, 'C', 330, 52, 'OH').s;
    s += oxy(o, [{ deg: 60, label: 'H', len: 36 }], [225], [24, -2, '+']);
    s += A(c, 'C', 'warn');
    s += curve(Q(84, 110), Q(74, 80), { bow: -10 });
    const om = Q(90, 200);
    s += oxy(om, [{ deg: 180, label: 'H', len: 38 }, { deg: 0, label: 'CH₃', len: 50 }], [270, 90], null, 'hi');
    s += curve(Q(96, 176), Q(96, 154), { bow: -10 });
    s += tg(x0 + 250, y0 + 84, 'the protonated C=O', 'mut');
    s += tg(x0 + 250, y0 + 102, 'is a stronger', 'mut');
    s += tg(x0 + 250, y0 + 120, 'electrophile', 'mut');
    return s;
  },
  p3(x0, y0, title = '3 · METHANOL TAKES A PROTON OFF O⁺') {
    const Q = (x, y) => P(x0 + x, y0 + y);
    let s = box(x0, y0, H, title);
    const c = Q(80, 104), t = tet(c, 'OH', 'CH₃', 'OH', null, {});
    s += t.s;
    const op = armEnd(c, 270, 58);
    s += hash(c, op, { rFrom: 14, rTo: 14, width: 11, rungs: 4 });
    s += oxy(op, [{ deg: 0, label: 'H', len: 40 }, { deg: 225, label: 'CH₃', len: 46 }], [205], [16, -21, '+'], 'hi');
    s += meohLeft(Q(214, 162));
    const h = armEnd(op, 0, 40);
    s += curve(Q(192, 154), P(h.x + 14, h.y - 8), { bow: 12 });
    s += pullLeft(h, op);
    return s;
  },
  p4(x0, y0, title = '4 · AN OH TAKES A PROTON', note) {
    const Q = (x, y) => P(x0 + x, y0 + y);
    let s = box(x0, y0, H, title);
    if (note) s += tg(x0 + 170, y0 + 44, note, 'mut');
    const c = Q(80, 104), o = armEnd(c, 90, 56);
    s += B(c, 'C', o, 'OH') + A(o, 'OH');
    s += arm(c, 'C', 210, 50, 'CH₃', 'wedge').s;
    s += arm(c, 'C', 270, 56, 'OCH₃', 'hash').s;
    const ox = armEnd(c, 330, 56);
    s += B(c, 'C', ox, 'O');
    s += oxy(ox, [{ deg: 290, label: 'H', len: 38 }], [330, 30], null, 'hi');
    s += A(c, 'C', 'warn');
    s += mh2Left(Q(206, 116), Q(262, 116));
    s += curve(P(ox.x + 20, ox.y - 14), Q(194, 110), { bow: -10 });
    s += curve(Q(230, 122), Q(249, 130), { bow: 10 });
    return s;
  },
  p5(x0, y0, title = '5 · WATER LEAVES, THE C=O RETURNS') {
    const Q = (x, y) => P(x0 + x, y0 + y);
    let s = box(x0, y0, H, title);
    const c = Q(92, 112), o = armEnd(c, 90, 56);
    s += B(c, 'C', o, 'O');
    s += oxy(o, [{ deg: 150, label: 'H', len: 38 }], [0, 300]);
    s += arm(c, 'C', 210, 50, 'CH₃', 'wedge').s;
    s += arm(c, 'C', 270, 56, 'OCH₃', 'hash').s;
    const ow = armEnd(c, 330, 58);
    s += B(c, 'C', ow, 'O');
    s += oxy(ow, [{ deg: 30, label: 'H', len: 38 }, { deg: 270, label: 'H', len: 38 }], [30], [-22, 18, '+'], 'hi');
    s += A(c, 'C', 'warn');
    s += curve(P(o.x + 22, o.y + 2), P(o.x + 8, o.y + 32), { bow: -14 });
    s += curve(P((c.x + ow.x) / 2 - 2, (c.y + ow.y) / 2 - 8), P(ow.x - 4, ow.y - 16), { bow: -10 });
    s += tg(x0 + 256, y0 + 64, 'OH₂⁺ leaves as', 'mut');
    s += tg(x0 + 256, y0 + 82, 'neutral water', 'mut');
    return s;
  },
  p6(x0, y0, title = '6 · METHANOL TAKES THE LAST PROTON') {
    const Q = (x, y) => P(x0 + x, y0 + y);
    let s = box(x0, y0, H, title);
    const c = Q(90, 140), o = armEnd(c, 90, 58);
    s += B(c, 'C', o, 'O', { order: 2 });
    s += arm(c, 'C', 210, 50, 'CH₃').s + arm(c, 'C', 330, 54, 'OCH₃').s;
    s += oxy(o, [{ deg: 0, label: 'H', len: 40 }], [225], [-26, 10, '+']);
    s += A(c, 'C', 'warn');
    const h = armEnd(o, 0, 40);
    s += meohLeft(Q(204, h.y - y0), false);
    s += curve(Q(182, h.y - y0 - 6), P(h.x + 14, h.y - 8), { bow: 12 });
    s += pullLeft(h, o);
    s += tg(x0 + 250, y0 + 186, 'CH₃OH₂⁺ is made', 'good');
    s += tg(x0 + 250, y0 + 204, 'again: the acid is back', 'good');
    return s;
  },
  p7(x0, y0, title = 'PRODUCT · METHYL ACETATE + WATER') {
    const Q = (x, y) => P(x0 + x, y0 + y);
    let s = box(x0, y0, 176, title);
    const c = Q(92, 120), f = flat(c, 'CH₃', 'OCH₃', { rightKind: 'hi', lenR: 54 });
    s += f.s;
    s += lbl(x0 + 252, y0 + 104, '+  H₂O');
    s += tg(x0 + 252, y0 + 132, 'every step can', 'mut');
    s += tg(x0 + 252, y0 + 150, 'run backward', 'mut');
    return s;
  },
};
FIGURES.push({
  id: 'fischer-esterification',
  section: 'acyl-substitution',
  anchor: '<h3>Fischer esterification and the role of acid</h3>',
  alt: 'Seven panels of Fischer esterification of acetic acid with methanol, with protonated methanol as the acid. 1: a lone pair on the carbonyl oxygen takes a proton from CH3OH2 plus. 2: a methanol lone pair attacks the carbonyl carbon of the protonated acid, and the pi bond moves onto the positive oxygen. 3: a second methanol takes the proton from the added oxygen, which carried the positive charge. 4: one OH of the neutral tetrahedral intermediate takes a proton from CH3OH2 plus. 5: the lone pair of the other OH moves down to re-form the C=O while the C–OH2 plus bond breaks, releasing water. 6: methanol takes the proton off the protonated ester, which makes CH3OH2 plus again. 7: methyl acetate and water.',
  viewBox: '0 0 692 890',
  build() {
    let s = '';
    s += fisch.p1(0, 8) + fisch.p2(352, 8);
    s += fisch.p3(0, 240) + fisch.p4(352, 240);
    s += fisch.p5(0, 472) + fisch.p6(352, 472);
    s += fisch.p7(0, 704);
    s += tg(524, 790, 'the acid goes in at step 1', 'mut');
    s += tg(524, 808, 'and comes back at step 6', 'mut');
    return s;
  },
  caption: 'Acetic acid and methanol with a sulfuric acid catalyst, read left to right, row by row. The two protons that activate the reaction go on in panels 1 and 4.',
});
FIGURES.push({
  id: 'l-fischer-activation',
  lessons: ['acyl-substitution'],
  alt: 'Three stacked panels from Fischer esterification of acetic acid with methanol. First, the carbonyl oxygen takes a proton from CH3OH2 plus. Second, later, one OH on the tetrahedral intermediate takes a proton. Third, the other OH pushes a lone pair down to re-form the C=O and the protonated OH leaves as neutral water.',
  viewBox: '0 0 340 696',
  build() {
    return fisch.p1(0, 8, 'FIRST · THE C=O TAKES A PROTON')
      + fisch.p4(0, 240, 'LATER · AN OH TAKES A PROTON')
      + fisch.p5(0, 472, 'THEN · WATER LEAVES');
  },
  caption: 'The two protons of Fischer esterification. Between the first and second panels, methanol adds to the carbon. The first proton makes the carbon a better target; the second turns OH into water, which can leave.',
});

/* ------------------------------------------------------------------ 6 ---
   The 18O experiment: which C–O bond of an ester forms and breaks. */
function benzoyl(c, rightLabel, rightKind, extra = {}) {
  const o = armEnd(c, 90, 56);
  let s = B(c, 'C', o, 'O', { order: 2 }) + A(o, 'O') + lps(o, [225, 315]);
  const ipso = armEnd(c, 210, 44);
  s += bond(c, ipso, { rFrom: 14, rTo: 0 }) + phenyl(ipso, 210);
  const r = armEnd(c, 330, 54);
  s += bond(c, r, { rFrom: 14, rTo: 18, cls: 'fg-bond-hi' }) + A(r, '', rightKind).replace(/r="14"/, 'r="18"');
  s += `<text class="fg-lbl" x="${r.x}" y="${r.y + 5}" text-anchor="middle"><tspan font-size="8.5" dy="-5">18</tspan><tspan dy="5">${rightLabel.replace('¹⁸', '')}</tspan></text>`;
  if (extra.me) {
    const m = armEnd(r, 30, 54);
    s += B(r, rightLabel, m, 'CH₃') + A(m, 'CH₃');
  }
  s += A(c, 'C', 'warn');
  return { s, r };
}
FIGURES.push({
  id: 'fischer-o18',
  section: 'acyl-substitution',
  anchor: '<h3>Fischer esterification and the role of acid</h3>',
  alt: 'Two stacked panels. Top: benzoic acid and methanol labeled with oxygen-18 give methyl benzoate in which the oxygen-18 sits between the carbonyl carbon and the methyl group, plus ordinary water. The acyl carbon to oxygen bond is highlighted as the one that formed; the oxygen to methyl bond was never broken. Bottom: ordinary methyl benzoate hydrolyzed in water labeled with oxygen-18 gives benzoic acid carrying the oxygen-18 on its OH, plus ordinary methanol. Again the acyl carbon to oxygen bond is the one that changed.',
  viewBox: '0 0 340 470',
  build() {
    let s = '';
    s += panel(4, 8, 332, 222);
    s += tag(170, 30, 'ESTERIFICATION: CH₃–¹⁸OH, H₂SO₄');
    const e = benzoyl(P(130, 124), '¹⁸O', 'hi', { me: true });
    s += e.s;
    s += tg(282, 72, 'the ¹⁸O kept', 'good');
    s += tg(282, 90, 'its CH₃', 'good');
    s += tg(170, 196, 'new bond: acyl C to ¹⁸O', 'good');
    s += tg(170, 214, 'the water formed has no ¹⁸O', 'mut');
    s += panel(4, 240, 332, 222);
    s += tag(170, 262, 'HYDROLYSIS: H₂¹⁸O, H₂SO₄');
    const h = benzoyl(P(130, 356), '¹⁸OH', 'hi');
    s += h.s;
    s += lbl(270, 360, '+  CH₃OH');
    s += tg(170, 428, 'broken bond: acyl C to O', 'good');
    s += tg(170, 446, 'the methanol has no ¹⁸O', 'mut');
    return s;
  },
  caption: 'Methyl benzoate made, then taken apart, with the heavy oxygen highlighted. In both panels the highlighted bond is the one between the carbonyl carbon and oxygen.',
});

/* ------------------------------------------------------------------ 7 ---
   Amide hydrolysis in acid: the nitrogen is protonated before it leaves. */
FIGURES.push({
  id: 'amide-acid-hydrolysis',
  section: 'acyl-substitution',
  anchor: '<h3>Fischer esterification and the role of acid</h3>',
  alt: 'Three stacked panels for the last steps of N-methylacetamide hydrolysis in hot aqueous acid. First, the neutral tetrahedral intermediate, carrying two OH groups, CH3 and NHCH3: the nitrogen lone pair takes a proton from H3O plus. Second, a lone pair on the top OH moves down to re-form the C=O, and the C–N bond breaks, so neutral methylamine leaves. Third, acetic acid after the protonated acid loses its extra proton, and methylammonium ion, CH3NH3 plus, formed when the acid protonates the methylamine.',
  viewBox: '0 0 340 700',
  build() {
    let s = '';
    // ---- 1. protonate N ----
    s += box(0, 8, 250, 'THE N TAKES A PROTON');
    const c = P(84, 120), o = armEnd(c, 90, 56);
    s += B(c, 'C', o, 'OH') + A(o, 'OH');
    s += arm(c, 'C', 210, 50, 'CH₃', 'wedge').s + arm(c, 'C', 270, 54, 'OH', 'hash').s;
    const n = armEnd(c, 330, 58);
    s += B(c, 'C', n, 'N');
    const nh = armEnd(n, 250, 38), nm = armEnd(n, 350, 50);
    s += B(n, 'N', nh, 'H') + A(nh, 'H') + B(n, 'N', nm, 'CH₃') + A(nm, 'CH₃');
    s += A(n, 'N', 'hi') + lps(n, [300]);
    s += A(c, 'C', 'warn');
    const hh = P(212, 88), ho = P(268, 88);
    s += B(hh, 'H', ho, 'O') + A(hh, 'H', 'hi');
    s += oxy(ho, [{ deg: 60, label: 'H', len: 38 }, { deg: 300, label: 'H', len: 38 }], [0], [-20, -26, '+']);
    s += curve(P(n.x + 10, n.y - 20), P(200, 98), { bow: -10 });
    s += curve(P(236, 94), P(255, 102), { bow: 10 });
    s += tg(250, 216, 'after water has added', 'mut');
    s += tg(250, 234, '(as in Fischer, with H₂O)', 'mut');
    // ---- 2. collapse, CH3NH2 leaves ----
    s += box(0, 266, 250, 'THE C=O RETURNS, CH₃NH₂ LEAVES');
    const c2 = P(84, 380), o2 = armEnd(c2, 90, 56);
    s += B(c2, 'C', o2, 'O');
    s += oxy(o2, [{ deg: 150, label: 'H', len: 38 }], [0, 300]);
    s += arm(c2, 'C', 210, 50, 'CH₃', 'wedge').s + arm(c2, 'C', 270, 54, 'OH', 'hash').s;
    const n2 = armEnd(c2, 330, 60);
    s += B(c2, 'C', n2, 'N');
    const a1 = armEnd(n2, 60, 38), a2 = armEnd(n2, 250, 38), a3 = armEnd(n2, 350, 50);
    s += B(n2, 'N', a1, 'H') + A(a1, 'H') + B(n2, 'N', a2, 'H') + A(a2, 'H') + B(n2, 'N', a3, 'CH₃') + A(a3, 'CH₃');
    s += A(n2, 'N', 'hi') + chg(n2.x + 13, n2.y + 20, '+');
    s += A(c2, 'C', 'warn');
    s += curve(P(o2.x + 22, o2.y + 2), P(o2.x + 8, o2.y + 32), { bow: -14 });
    s += curve(P((c2.x + n2.x) / 2 - 2, (c2.y + n2.y) / 2 - 8), P(n2.x - 4, n2.y - 16), { bow: -10 });
    s += tg(250, 336, 'N leaves as a', 'good');
    s += tg(250, 354, 'neutral amine', 'good');
    s += tg(170, 486, 'then CH₃NH₂ takes the extra H⁺', 'mut');
    s += tg(170, 504, 'from the C=OH⁺ group', 'mut');
    // ---- 3. products ----
    s += box(0, 524, 168, 'PRODUCTS');
    const c3 = P(84, 628), f3 = flat(c3, 'CH₃', 'OH', {});
    s += f3.s;
    s += lbl(248, 616, '+  CH₃NH₃⁺');
    s += tg(248, 642, 'no lone pair left:', 'mut');
    s += tg(248, 660, 'it cannot add back', 'mut');
    return s;
  },
  caption: 'The last steps of N-methylacetamide hydrolysis in hot aqueous acid. Look at what leaves in the middle panel: a neutral molecule, not CH₃NH⁻.',
});

export default FIGURES;
