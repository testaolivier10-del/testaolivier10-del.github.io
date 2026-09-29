/* Figures for the esters-amides notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Order follows the page: the two-step pattern every derivative reacts by,
   the four derivatives ranked, why chlorine donates badly, the ladder in the
   infrared, amide resonance, where an amide takes a proton, saponification,
   lactone ring closure, and the beta-lactam. Figures whose id starts with
   `l-` are stacked copies, 340 wide, for the lesson. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (d) => (d * Math.PI) / 180;
/* A point `len` from c at math angle `deg` (0 east, counterclockwise). */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);
/* A lone pair on atom a, pointing at math angle deg. */
const lp = (a, deg, o = {}) => lonePair(a.x, a.y, -deg, o);
/* Where a curved arrow should start when it leaves a lone pair. */
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
/* Resonance arrow: one line, a head at each end. */
function resArrow(a, b) {
  const m = P((a.x + b.x) / 2, (a.y + b.y) / 2);
  return arrow(m, b, { size: 8 }) + arrow(m, a, { size: 8 });
}
/* A bond from atom a (radius ra) to atom b (radius rb). */
const bd = (a, b, ra = 15, rb = 15, o = {}) => bond(a, b, { rFrom: ra, rTo: rb, ...o });

/* ------------------------------------------- 1. the two-step pattern ---
   Nu⁻ adds to R–C(=O)–X, the tetrahedral intermediate re-forms the C=O and
   X leaves. Three stages, each drawn about a local origin so the notes can
   lay them in a row and the lesson can stack them. */
function twoStepA(o) {
  let s = '';
  const c = P(o.x + 90, o.y + 80), ox = at(c, 90, 52), r = at(c, 210, 50), x = at(c, 330, 50);
  const nu = P(o.x + 188, o.y + 74);
  s += bd(c, ox, 16, 15, { order: 2 }) + bd(c, r, 16) + bd(c, x, 16, 16);
  s += lp(ox, 30) + lp(ox, 150) + atom(ox.x, ox.y, 'O');
  s += atom(r.x, r.y, 'R') + atom(x.x, x.y, 'X', { kind: 'hi' });
  s += atom(c.x, c.y, 'C', { kind: 'warn' });
  s += lp(nu, 180) + atom(nu.x, nu.y, 'Nu', { kind: 'hi' }) + charge(P(nu.x + 12, nu.y - 24), '−', 'fg-hi');
  s += curve(lpTip(nu, 180, 28), at(c, 5, 21), { bow: 10, size: 7 });
  s += curve(onBond(c, ox, 0.5, 7), P(ox.x - 19, ox.y + 7), { bow: 12, size: 7 });
  return s;
}
function twoStepB(o) {
  let s = '';
  const c = P(o.x + 80, o.y + 84), ox = at(c, 90, 52), r = at(c, 200, 52), nu = at(c, 285, 54), x = at(c, 345, 54);
  s += bd(c, ox, 16) + bd(c, r, 16);
  s += wedge(c, nu, { rFrom: 16, rTo: 15, width: 9 }) + hash(c, x, { rFrom: 16, rTo: 16, width: 11, rungs: 4 });
  s += lp(ox, 30) + lp(ox, 90) + lp(ox, 150) + atom(ox.x, ox.y, 'O', { kind: 'hi' }) + charge(P(ox.x + 25, ox.y + 12), '−', 'fg-hi');
  s += atom(r.x, r.y, 'R') + atom(nu.x, nu.y, 'Nu') + atom(x.x, x.y, 'X', { kind: 'hi' });
  s += atom(c.x, c.y, 'C', { kind: 'warn' });
  s += curve(lpTip(ox, 150, 28), onBond(c, ox, 0.5, 7), { bow: 14, size: 7 });
  s += curve(onBond(c, x, 0.5, -7), P(x.x - 4, x.y + 19), { bow: -12, size: 7 });
  return s;
}
function twoStepC(o) {
  let s = '';
  const c = P(o.x + 70, o.y + 80), ox = at(c, 90, 52), r = at(c, 210, 50), nu = at(c, 330, 50);
  s += bd(c, ox, 16, 15, { order: 2 }) + bd(c, r, 16) + bd(c, nu, 16);
  s += lp(ox, 30) + lp(ox, 150) + atom(ox.x, ox.y, 'O');
  s += atom(r.x, r.y, 'R') + atom(nu.x, nu.y, 'Nu');
  s += atom(c.x, c.y, 'C', { kind: 'warn' });
  s += text(o.x + 152, o.y + 110, '+', { cls: 'fg-lbl', size: 13 });
  const x = P(o.x + 186, o.y + 104);
  s += atom(x.x, x.y, 'X', { kind: 'hi' }) + charge(P(x.x + 20, x.y - 18), '−', 'fg-hi');
  return s;
}

FIGURES.push({
  id: 'acyl-two-steps',
  section: 'esters-amides',
  anchor: '',
  viewBox: '0 0 760 250',
  alt: 'Three stages. First, a nucleophile Nu with a negative charge and a lone pair attacks the carbonyl carbon of R–C(=O)–X; one curved arrow runs from its lone pair to the carbon and a second from the C=O double bond onto the oxygen. Second, the tetrahedral intermediate: a carbon bonded to R, Nu, X and a negatively charged oxygen with three lone pairs; one curved arrow runs from an oxygen lone pair back into the C–O bond, and a second from the C–X bond onto X. Third, R–C(=O)–Nu and a free X with a negative charge.',
  build() {
    let s = '';
    s += twoStepA(P(8, 30));
    s += arrow(P(232, 110), P(282, 110));
    s += twoStepB(P(300, 26));
    s += arrow(P(470, 110), P(520, 110));
    s += twoStepC(P(530, 30));
    s += tg(380, 22, 'tetrahedral intermediate');
    s += sm(118, 226, '1. Nu⁻ adds to the C=O carbon');
    s += sm(380, 226, '2. the C=O re-forms and X leaves');
    s += sm(640, 226, '3. Nu has replaced X');
    return s;
  },
  caption: 'The pattern every derivative on this page reacts by. The coral carbon starts flat, becomes tetrahedral in the middle stage, and ends flat again, now carrying Nu in place of X.',
});
FIGURES.push({
  id: 'l-acyl-two-steps',
  lessons: ['esters-amides'],
  viewBox: '0 0 340 620',
  alt: 'Three stages stacked. A nucleophile Nu with a negative charge attacks the carbonyl carbon of R–C(=O)–X, with curved arrows from its lone pair to the carbon and from the C=O bond onto oxygen. Below it, the tetrahedral intermediate with R, Nu, X and a negatively charged oxygen on one carbon; curved arrows run from an oxygen lone pair back into the C–O bond and from the C–X bond onto X. At the bottom, R–C(=O)–Nu and a free X with a negative charge.',
  build() {
    let s = '';
    s += twoStepA(P(40, 14));
    s += tg(170, 186, '1. Nu⁻ adds to the C=O carbon');
    s += arrow(P(170, 196), P(170, 228));
    s += twoStepB(P(80, 228));
    s += tg(170, 390, '2. the C=O re-forms and X leaves');
    s += arrow(P(170, 400), P(170, 432));
    s += twoStepC(P(60, 430));
    s += tg(170, 600, '3. Nu has replaced X');
    return s;
  },
  caption: 'The coral carbon starts flat, becomes tetrahedral in the middle, and ends flat again with Nu in place of X.',
});

/* -------------------------------------------- 2. the four derivatives ---
   Each drawn on acetic acid's acyl group, CH3–C(=O)–, with the group X that
   would leave highlighted. `c` is the carbonyl carbon. */
function deriv(kind, c) {
  let s = '';
  const o = at(c, 90, 50), me = at(c, 210, 50), x = at(c, 330, 50);
  s += bd(c, o, 16, 15, { order: 2 }) + bd(c, me, 16, 17);
  s += lp(o, 30) + lp(o, 150) + atom(o.x, o.y, 'O');
  s += atom(me.x, me.y, 'CH₃', { r: 17 });
  let right = x.x + 16;
  if (kind === 'cl') {
    s += bd(c, x, 16, 16);
    s += lp(x, 240) + lp(x, 330) + lp(x, 60);
    s += atom(x.x, x.y, 'Cl', { kind: 'hi' });
    right = x.x + 38;
  } else if (kind === 'est') {
    const m = at(x, 30, 50);
    s += bd(c, x, 16, 16) + bd(x, m, 16, 17);
    s += lp(x, 235) + lp(x, 305);
    s += atom(x.x, x.y, 'O', { kind: 'hi' }) + atom(m.x, m.y, 'CH₃', { r: 17, kind: 'hi' });
    right = m.x + 17;
  } else if (kind === 'anh') {
    const c2 = at(x, 30, 50), o2 = at(c2, 90, 50), m2 = at(c2, 330, 50);
    s += bd(c, x, 16, 16) + bd(x, c2, 16, 16) + bd(c2, o2, 16, 15, { order: 2, cls: 'fg-bond-hi' }) + bd(c2, m2, 16, 17);
    s += lp(x, 235) + lp(x, 305);
    s += lp(o2, 30) + lp(o2, 150);
    s += atom(x.x, x.y, 'O', { kind: 'hi' }) + atom(c2.x, c2.y, 'C', { kind: 'hi' });
    s += atom(o2.x, o2.y, 'O', { kind: 'hi' }) + atom(m2.x, m2.y, 'CH₃', { r: 17, kind: 'hi' });
    right = m2.x + 17;
  } else {
    s += bd(c, x, 16, 18);
    s += lp(x, 75, { dist: 25 });
    s += atom(x.x, x.y, 'NH₂', { r: 18, kind: 'hi' });
    right = x.x + 18;
  }
  s += atom(c.x, c.y, 'C', { kind: 'warn' });
  return { s, right };
}
const DERIV = {
  cl: { name: 'acetyl chloride', leaves: 'Cl⁻ leaves; HCl has pKa −7', says: 'the weakest base of the four: leaves easily', w: 132 },
  anh: { name: 'acetic anhydride', leaves: 'CH₃CO₂⁻ leaves; CH₃CO₂H has pKa 4.8', says: 'a weak base: leaves readily', w: 104 },
  est: { name: 'methyl acetate', leaves: 'CH₃O⁻ leaves; CH₃OH has pKa 15.5', says: 'a strong base: leaves reluctantly', w: 58 },
  amide: { name: 'acetamide', leaves: 'NH₂⁻ would leave; NH₃ has pKa 38', says: 'a very strong base: almost never leaves', w: 16 },
};

FIGURES.push({
  id: 'derivative-ladder',
  section: 'esters-amides',
  anchor: '',
  viewBox: '0 0 760 470',
  alt: 'Four acetic acid derivatives in rows, each CH3–C(=O)–X with X highlighted: acetyl chloride with Cl, acetic anhydride with an oxygen bridging to a second C(=O)CH3, methyl acetate with OCH3, and acetamide with NH2. Beside each, the ion that would leave and the pKa of its conjugate acid: HCl −7, acetic acid 4.8, methanol 15.5, ammonia 38. A bar for each shows reactivity toward a nucleophile, longest for the acid chloride and shortest for the amide.',
  build() {
    let s = '';
    s += tg(24, 24, 'four derivatives of acetic acid', 'start');
    s += tg(300, 24, 'the group that leaves, and its conjugate acid', 'start');
    s += tg(740, 24, 'reactivity toward a nucleophile', 'end');
    ['cl', 'anh', 'est', 'amide'].forEach((k, i) => {
      const y0 = 40 + i * 106;
      const c = P(90, y0 + 66);
      s += deriv(k, c).s;
      const d = DERIV[k];
      s += lbl(300, y0 + 50, d.name, 'start');
      s += sm(300, y0 + 70, d.leaves, 'start');
      s += sm(300, y0 + 88, d.says, 'start');
      s += bar(600, y0 + 62, d.w, 14, { opacity: 1 - i * 0.18 });
      if (i < 3) s += rule(24, y0 + 106, 736, y0 + 106);
    });
    return s;
  },
  caption: 'The highlighted atoms are the group X that leaves. Read down the middle column: the higher the pKa of the conjugate acid, the stronger the base that would have to leave, and the shorter the bar.',
});
FIGURES.push({
  id: 'l-four-derivatives',
  lessons: ['esters-amides'],
  viewBox: '0 0 340 470',
  alt: 'Four acetic acid derivatives stacked, each CH3–C(=O)–X with X highlighted: methyl acetate with OCH3, acetamide with NH2, acetyl chloride with Cl, and acetic anhydride with an oxygen bridging to a second C(=O)CH3.',
  build() {
    let s = '';
    ['est', 'amide', 'cl', 'anh'].forEach((k, i) => {
      const y0 = i * 117;
      s += tg(20, y0 + 16, DERIV[k].name, 'start');
      s += deriv(k, P(90, y0 + 78)).s;
      if (i < 3) s += rule(10, y0 + 114, 330, y0 + 114);
    });
    return s;
  },
  caption: 'The highlighted atoms are the group that leaves.',
});

/* ---------------------------------------- 3. why chlorine donates badly ---
   A carbon 2p beside an oxygen 2p (same size, good side-on overlap), and a
   carbon 2p beside a chlorine 3p (bigger, more diffuse, farther away). */
function pPair(c, rx, ry, gap = 0) {
  return lobeE(c.x, c.y - ry - gap, rx, ry, 'fg-orb') + lobeE(c.x, c.y + ry + gap, rx, ry, 'fg-orb-alt');
}
FIGURES.push({
  id: 'p-overlap',
  section: 'esters-amides',
  anchor: '',
  viewBox: '0 0 760 280',
  alt: 'Left: a carbon and an oxygen joined by a short bond, each with an upright p orbital of the same size; the two orbitals sit side by side and overlap well. Right: a carbon and a chlorine joined by a longer bond; the chlorine 3p orbital is much larger and more spread out than the carbon 2p, and the two overlap poorly.',
  build() {
    let s = '';
    s += panel(16, 16, 352, 248);
    s += panel(392, 16, 352, 248, { kind: 'warn' });
    s += tg(192, 40, 'C 2p beside O 2p');
    s += tg(568, 40, 'C 2p beside Cl 3p');
    const c1 = P(150, 140), o1 = P(234, 140);
    s += pPair(c1, 17, 34) + pPair(o1, 16, 32);
    s += bd(c1, o1, 15, 15) + atom(c1.x, c1.y, 'C') + atom(o1.x, o1.y, 'O', { kind: 'hi' });
    s += sm(192, 234, 'same size and close: good overlap');
    s += sm(192, 252, 'O and N donate their lone pairs well');
    const c2 = P(490, 140), cl = P(612, 140);
    s += pPair(c2, 17, 34) + pPair(cl, 30, 46);
    s += bd(c2, cl, 15, 15) + atom(c2.x, c2.y, 'C') + atom(cl.x, cl.y, 'Cl', { kind: 'warn' });
    s += sm(568, 234, 'bigger, more diffuse, farther: poor overlap');
    s += sm(568, 252, 'Cl donates its lone pairs weakly');
    return s;
  },
  caption: 'The upright lobes are the p orbitals that hold the lone pair on O or Cl and the empty half of the C=O &pi; system on carbon. Compare how much of each pair of lobes sits side by side.',
});

/* --------------------------------------------- 4. the ladder in the IR --- */
FIGURES.push({
  id: 'ir-carbonyl-scale',
  section: 'esters-amides',
  anchor: '',
  viewBox: '0 0 760 250',
  alt: 'A horizontal scale of C=O stretching frequency, from 1850 cm⁻¹ on the left to 1600 on the right. Acid chloride sits at 1800, ester at 1735 and amide at 1650. Above them, a bracket joins the anhydride’s two bands at 1820 and 1760. Below the scale, an arrow runs from a carboxylic acid’s lone-molecule band at 1760 to its hydrogen-bonded dimer band at 1710.',
  build() {
    let s = '';
    const X = (v) => 60 + (1850 - v) * 2.56, Y = 150;
    s += `<line class="fg-bond" x1="${X(1850)}" y1="${Y}" x2="${X(1600)}" y2="${Y}"></line>`;
    for (const v of [1850, 1800, 1750, 1700, 1650, 1600]) {
      s += `<line class="fg-bond-soft" x1="${n2(X(v))}" y1="${Y}" x2="${n2(X(v))}" y2="${Y + 6}"></line>`;
      s += sm(X(v), Y + 20, String(v));
    }
    const tick = (v, top, cls = 'fg-bond-hi') => `<line class="${cls}" x1="${n2(X(v))}" y1="${Y}" x2="${n2(X(v))}" y2="${top}"></line>`;
    // the three rungs
    for (const [v, name] of [[1800, 'acid chloride 1800'], [1735, 'ester 1735'], [1650, 'amide 1650']]) {
      s += tick(v, 108);
      s += tg(X(v), 100, name);
    }
    // anhydride: two coupled bands
    s += tick(1820, 60) + tick(1760, 60);
    s += `<line class="fg-dash-hi" x1="${n2(X(1820))}" y1="60" x2="${n2(X(1760))}" y2="60"></line>`;
    s += tg((X(1820) + X(1760)) / 2, 50, 'anhydride: 1820 and 1760, two bands');
    // carboxylic acid: monomer and dimer, below the scale
    s += `<line class="fg-dash" x1="${n2(X(1760))}" y1="${Y}" x2="${n2(X(1760))}" y2="${Y + 44}"></line>`;
    s += `<line class="fg-bond-hi" x1="${n2(X(1710))}" y1="${Y}" x2="${n2(X(1710))}" y2="${Y + 44}"></line>`;
    s += arrow(P(X(1760) + 4, Y + 40), P(X(1710) - 4, Y + 40), { muted: true });
    s += tg(560, Y + 44, 'carboxylic acid: 1760 alone, 1710 as a dimer', 'middle', 'fg-tag-mut');
    s += sm(380, 238, 'C=O stretch, in cm⁻¹: a stiffer C=O absorbs at a higher number');
    return s;
  },
  caption: 'The three rungs read left to right in ladder order. The anhydride bracket and the acid arrow are the two entries that need a note of their own.',
});

/* --------------------------------------------- 5. amide resonance (DMF) ---
   `ionic` draws the charge-separated contributor. Methyl a is on the oxygen
   side of the C–N bond and methyl b on the hydrogen side. */
function dmf(c, ionic, big = true) {
  let s = '';
  const o = at(c, 90, 56), h = at(c, 210, 50), n = at(c, 330, 56);
  const ma = at(n, 30, 54), mb = at(n, 270, 54);
  s += bd(c, o, 16, 15, { order: ionic ? 1 : 2 });
  s += bd(c, h, 16, 11) + atom(h.x, h.y, 'H', { r: 11 });
  s += bd(c, n, 16, 16, { order: ionic ? 2 : 1 });
  s += bd(n, ma, 16, 17) + bd(n, mb, 16, 17);
  s += atom(ma.x, ma.y, 'CH₃', { r: 17 }) + atom(mb.x, mb.y, 'CH₃', { r: 17 });
  s += tg(ma.x + 30, ma.y + 4, 'a', 'start', 'fg-tag-warn');
  s += tg(mb.x + 26, mb.y + 4, 'b', 'start', 'fg-tag-warn');
  if (ionic) {
    s += lp(o, 30) + lp(o, 90) + lp(o, 150);
    s += atom(o.x, o.y, 'O', { kind: 'hi' }) + charge(P(o.x + 26, o.y + 10), '−', 'fg-hi');
    s += atom(n.x, n.y, 'N', { kind: 'warn' }) + charge(P(n.x - 4, n.y + 28), '+');
  } else {
    s += lp(o, 30) + lp(o, 150) + atom(o.x, o.y, 'O');
    s += lp(n, 90);
    s += atom(n.x, n.y, 'N', { kind: 'hi' });
    s += curve(lpTip(n, 90, 28), onBond(c, n, 0.5, 7), { bow: 14, size: 7 });
    s += curve(onBond(c, o, 0.5, 7), P(o.x - 19, o.y + 7), { bow: 12, size: 7 });
  }
  s += atom(c.x, c.y, 'C');
  return s;
}
FIGURES.push({
  id: 'amide-rotation-locked',
  section: 'esters-amides',
  anchor: '',
  viewBox: '0 0 760 330',
  alt: 'Dimethylformamide, HC(=O)N(CH3)2, with its two methyls labelled a (on the oxygen side of the C–N bond) and b (on the hydrogen side). A curved arrow runs from the nitrogen lone pair into the C–N bond and a second from the C=O double bond onto oxygen. A double-headed resonance arrow leads to the contributor with a C=N double bond, a positive charge on nitrogen, and a negative oxygen with three lone pairs.',
  build() {
    let s = '';
    s += tg(190, 26, 'dimethylformamide (DMF)');
    s += tg(560, 26, 'the charge-separated contributor');
    s += dmf(P(170, 126), false);
    s += resArrow(P(340, 140), P(420, 140));
    s += dmf(P(530, 126), true);
    s += rule(24, 270, 736, 270);
    s += lbl(24, 294, 'The C–N bond is partly double, so it does not turn freely.', 'start');
    s += sm(24, 316, 'Methyl a stays on the oxygen side and methyl b on the hydrogen side: two different methyls.', 'start');
    return s;
  },
  caption: 'Follow the two curved arrows from the left structure to the right one. Then find methyls a and b: to swap places they would have to turn about the C–N bond.',
  note: 'The barrier near 20 kcal/mol was measured with this molecule. Warm a DMF sample and its two ¹H NMR methyl signals merge into one once the bond turns fast enough; the temperature at which they merge gives the barrier.',
});
FIGURES.push({
  id: 'l-amide-resonance',
  lessons: ['esters-amides'],
  viewBox: '0 0 340 470',
  alt: 'Dimethylformamide with a curved arrow from the nitrogen lone pair into the C–N bond and a second from the C=O bond onto oxygen. A vertical double-headed resonance arrow leads down to the contributor with a C=N double bond, a positive nitrogen, and a negative oxygen with three lone pairs.',
  build() {
    let s = '';
    s += tg(170, 18, 'dimethylformamide (DMF)');
    s += dmf(P(130, 100), false);
    s += resArrow(P(170, 208), P(170, 250));
    s += dmf(P(130, 332), true);
    s += tg(170, 460, 'C=N partly double, + on N, − on O');
    return s;
  },
  caption: 'Follow the two curved arrows from the top structure to the bottom one, then compare the charges.',
});

/* ------------------------------------- 6. where an amide takes a proton ---
   Acetamide protonated on O (two contributors, charge shared by O and N)
   against acetamide protonated on N (no lone pair left to share). */
function acetamideH(c, where) {
  let s = '';
  const o = at(c, 90, 54), me = at(c, 210, 50), n = at(c, 330, 52);
  s += bd(c, me, 16, 17) + atom(me.x, me.y, 'CH₃', { r: 17 });
  if (where === 'O1' || where === 'O2') {
    const h = at(o, 30, 38);
    s += bd(o, h, 15, 11) + atom(h.x, h.y, 'H', { r: 11, kind: 'warn' });
    if (where === 'O1') {
      s += bd(c, o, 16, 15, { order: 2 }) + bd(c, n, 16, 18);
      s += lp(o, 150) + atom(o.x, o.y, 'O', { kind: 'warn' }) + charge(P(o.x - 4, o.y - 28), '+');
      s += lp(n, 75, { dist: 25 }) + atom(n.x, n.y, 'NH₂', { r: 18, kind: 'hi' });
      s += curve(lpTip(n, 75, 31), onBond(c, n, 0.5, 7), { bow: 14, size: 7 });
      s += curve(onBond(c, o, 0.5, 7), P(o.x - 19, o.y + 7), { bow: 12, size: 7 });
    } else {
      s += bd(c, o, 16, 15) + bd(c, n, 16, 18, { order: 2 });
      s += lp(o, 125) + lp(o, 195) + atom(o.x, o.y, 'O');
      s += atom(n.x, n.y, 'NH₂', { r: 18, kind: 'warn' }) + charge(P(n.x + 4, n.y + 30), '+');
    }
  } else {
    s += bd(c, o, 16, 15, { order: 2 }) + bd(c, n, 16, 18);
    s += lp(o, 30) + lp(o, 150) + atom(o.x, o.y, 'O');
    s += atom(n.x, n.y, 'NH₃', { r: 18, kind: 'warn' }) + charge(P(n.x + 4, n.y + 30), '+');
  }
  s += atom(c.x, c.y, 'C');
  return s;
}
FIGURES.push({
  id: 'amide-protonation-site',
  section: 'esters-amides',
  anchor: '',
  viewBox: '0 0 760 300',
  alt: 'Left panel, proton on oxygen: acetamide with an H on the carbonyl oxygen and a positive charge there, a curved arrow from the NH2 lone pair into the C–N bond and one from the C=O bond onto oxygen, and a double-headed resonance arrow to the second contributor, which has C–OH single, C=N double and the positive charge on NH2. Right panel, proton on nitrogen: acetamide with NH3 plus on the carbon and an ordinary C=O; nitrogen has no lone pair left.',
  build() {
    let s = '';
    s += panel(16, 16, 470, 268, { kind: 'good' });
    s += panel(500, 16, 244, 268, { kind: 'warn' });
    s += tg(251, 40, 'PROTON ON OXYGEN', 'middle', 'fg-tag-good');
    s += tg(622, 40, 'PROTON ON NITROGEN', 'middle', 'fg-tag-warn');
    s += acetamideH(P(110, 150), 'O1');
    s += resArrow(P(214, 162), P(270, 162));
    s += acetamideH(P(350, 150), 'O2');
    s += sm(251, 256, 'O and N share the + charge: two contributors');
    s += acetamideH(P(600, 150), 'N');
    s += sm(622, 256, 'N has no lone pair left to give');
    return s;
  },
  caption: 'Count the contributors in each panel. The left cation can be drawn two ways and the right one only one way.',
});

/* ----------------------------------------------------- 7. saponification ---
   Ethyl benzoate and hydroxide, in four stages. Each stage is drawn about a
   local origin inside a 330 × 170 box. */
const PH = { r: 20 }, ET = { r: 19 };
function sapA(o) {
  let s = '';
  const c = P(o.x + 110, o.y + 85), ox = at(c, 90, 50), ph = at(c, 210, 56), oe = at(c, 330, 50), et = at(oe, 30, 52);
  s += bd(c, ox, 16, 15, { order: 2 }) + bd(c, ph, 16, PH.r) + bd(c, oe, 16, 15) + bd(oe, et, 15, ET.r);
  s += lp(ox, 30) + lp(ox, 150) + atom(ox.x, ox.y, 'O');
  s += atom(ph.x, ph.y, 'C₆H₅', { r: PH.r });
  s += lp(oe, 235) + lp(oe, 305) + atom(oe.x, oe.y, 'O') + atom(et.x, et.y, 'C₂H₅', { r: ET.r });
  s += atom(c.x, c.y, 'C', { kind: 'warn' });
  const on = P(o.x + 228, o.y + 50), h = at(on, 30, 38);
  s += bd(on, h, 15, 11) + atom(h.x, h.y, 'H', { r: 11 });
  const toC = (Math.atan2(-(c.y - on.y), c.x - on.x) * 180) / Math.PI;
  s += lp(on, toC) + lp(on, 110) + lp(on, 300);
  s += atom(on.x, on.y, 'O', { kind: 'hi' }) + charge(at(on, 160, 26), '−', 'fg-hi');
  s += curve(lpTip(on, toC, 29), at(c, 20, 21), { bow: 10, size: 7 });
  s += curve(onBond(c, ox, 0.5, 7), P(ox.x - 19, ox.y + 7), { bow: 12, size: 7 });
  return s;
}
function sapB(o) {
  let s = '';
  const c = P(o.x + 120, o.y + 86), ox = at(c, 90, 50), ph = at(c, 200, 56), oh = at(c, 280, 54), oe = at(c, 345, 54), et = at(oe, 30, 50);
  s += bd(c, ox, 16) + bd(c, ph, 16, PH.r);
  s += wedge(c, oh, { rFrom: 16, rTo: 18, width: 9 }) + hash(c, oe, { rFrom: 16, rTo: 15, width: 11, rungs: 4 });
  s += bd(oe, et, 15, ET.r);
  s += lp(ox, 30) + lp(ox, 90) + lp(ox, 150) + atom(ox.x, ox.y, 'O', { kind: 'hi' }) + charge(P(ox.x + 26, ox.y + 12), '−', 'fg-hi');
  s += atom(ph.x, ph.y, 'C₆H₅', { r: PH.r }) + atom(oh.x, oh.y, 'OH', { r: 18 });
  s += lp(oe, 250) + lp(oe, 320, { dist: 23 });
  s += atom(oe.x, oe.y, 'O', { kind: 'hi' }) + atom(et.x, et.y, 'C₂H₅', { r: ET.r });
  s += atom(c.x, c.y, 'C', { kind: 'warn' });
  s += curve(lpTip(ox, 150, 28), onBond(c, ox, 0.5, 7), { bow: 14, size: 7 });
  s += curve(onBond(c, oe, 0.45, -7), at(oe, 200, 20), { bow: -14, size: 7 });
  return s;
}
function sapC(o) {
  let s = '';
  const c = P(o.x + 90, o.y + 85), ox = at(c, 90, 50), ph = at(c, 210, 56), oa = at(c, 330, 50), ha = at(oa, 30, 38);
  s += bd(c, ox, 16, 15, { order: 2 }) + bd(c, ph, 16, PH.r) + bd(c, oa, 16, 15) + bd(oa, ha, 15, 11);
  s += lp(ox, 30) + lp(ox, 150) + atom(ox.x, ox.y, 'O');
  s += atom(ph.x, ph.y, 'C₆H₅', { r: PH.r });
  s += lp(oa, 235) + lp(oa, 300) + atom(oa.x, oa.y, 'O') + atom(ha.x, ha.y, 'H', { r: 11, kind: 'warn' });
  s += atom(c.x, c.y, 'C');
  const ox2 = P(o.x + 232, o.y + 90), et = at(ox2, 30, 52);
  const toH = (Math.atan2(-(ha.y - ox2.y), ha.x - ox2.x) * 180) / Math.PI;
  s += bd(ox2, et, 15, ET.r) + atom(et.x, et.y, 'C₂H₅', { r: ET.r });
  s += lp(ox2, toH) + lp(ox2, 110) + lp(ox2, 285);
  s += atom(ox2.x, ox2.y, 'O', { kind: 'hi' }) + charge(at(ox2, 235, 25), '−', 'fg-hi');
  s += curve(lpTip(ox2, toH, 29), at(ha, toH - 180 + 360, 13), { bow: 10, size: 7 });
  s += curve(onBond(oa, ha, 0.5, 6), at(oa, 70, 20), { bow: 10, size: 7 });
  return s;
}
function sapD(o) {
  let s = '';
  const c = P(o.x + 90, o.y + 85), ox = at(c, 90, 50), ph = at(c, 210, 56), oc = at(c, 330, 50);
  s += bd(c, ox, 16, 15, { order: 2 }) + bd(c, ph, 16, PH.r) + bd(c, oc, 16, 16);
  s += lp(ox, 30) + lp(ox, 150) + atom(ox.x, ox.y, 'O');
  s += atom(ph.x, ph.y, 'C₆H₅', { r: PH.r });
  s += lp(oc, 240) + lp(oc, 320) + lp(oc, 40) + atom(oc.x, oc.y, 'O', { kind: 'hi' }) + charge(at(oc, 90, 26), '−', 'fg-hi');
  s += atom(c.x, c.y, 'C');
  s += text(o.x + 188, o.y + 95, '+', { cls: 'fg-lbl', size: 13 });
  const oe = P(o.x + 250, o.y + 100), h = at(oe, 150, 36), et = at(oe, 30, 50);
  s += bd(oe, h, 15, 11) + bd(oe, et, 15, ET.r);
  s += lp(oe, 240) + lp(oe, 300);
  s += atom(h.x, h.y, 'H', { r: 11 }) + atom(oe.x, oe.y, 'O') + atom(et.x, et.y, 'C₂H₅', { r: ET.r });
  return s;
}
FIGURES.push({
  id: 'saponification',
  section: 'esters-amides',
  anchor: '',
  viewBox: '0 0 760 430',
  alt: 'Four stages, read clockwise from top left. 1: hydroxide attacks the carbonyl carbon of ethyl benzoate, C6H5–C(=O)–O–C2H5, with curved arrows from its lone pair to the carbon and from the C=O bond onto oxygen. 2: the tetrahedral intermediate, with O minus, C6H5, OH and OC2H5 on one carbon; arrows show the C=O re-forming and the C–OC2H5 bond breaking. 3: benzoic acid and ethoxide; an arrow runs from an ethoxide lone pair to the acid’s O–H hydrogen and another from the O–H bond onto the acid oxygen. 4: benzoate anion and ethanol.',
  build() {
    let s = '';
    s += panel(8, 8, 360, 196) + panel(392, 8, 360, 196);
    s += panel(8, 226, 360, 196, { kind: 'good' }) + panel(392, 226, 360, 196);
    s += sapA(P(14, 18));
    s += arrow(P(338, 106), P(410, 106));
    s += sapB(P(400, 18));
    s += arrow(P(572, 206), P(572, 246));
    s += sapC(P(400, 234));
    s += arrow(P(410, 324), P(338, 324));
    s += sapD(P(14, 234));
    s += tg(188, 194, '1. hydroxide adds to the C=O');
    s += tg(572, 194, '2. the C=O re-forms; ethoxide leaves');
    s += tg(572, 412, '3. ethoxide takes the acid’s proton');
    s += tg(188, 412, '4. carboxylate + ethanol: no way back', 'middle', 'fg-tag-good');
    return s;
  },
  caption: 'Stages 1 and 2 are the two-step pattern from the top of the page. Stage 3 is the new one: follow its arrows from the ethoxide to the acid’s H.',
});
FIGURES.push({
  id: 'l-saponification',
  lessons: ['esters-amides'],
  viewBox: '0 0 340 820',
  alt: 'Four stages stacked. 1: hydroxide attacks the carbonyl carbon of ethyl benzoate. 2: the tetrahedral intermediate re-forms its C=O and ethoxide leaves. 3: ethoxide takes the proton from benzoic acid, with curved arrows from its lone pair to the H and from the O–H bond onto oxygen. 4: benzoate anion and ethanol.',
  build() {
    let s = '';
    s += sapA(P(0, 0));
    s += tg(170, 180, '1. hydroxide adds to the C=O');
    s += arrow(P(170, 188), P(170, 208));
    s += sapB(P(10, 206));
    s += tg(170, 386, '2. the C=O re-forms; ethoxide leaves');
    s += arrow(P(170, 394), P(170, 414));
    s += sapC(P(0, 410));
    s += tg(170, 592, '3. ethoxide takes the acid’s proton');
    s += arrow(P(170, 600), P(170, 620));
    s += sapD(P(0, 620));
    s += tg(170, 806, '4. carboxylate + ethanol: no way back', 'middle', 'fg-tag-good');
    return s;
  },
  caption: 'Stages 1 and 2 are the two-step pattern. Stage 3 is the one that makes the reaction one-way.',
});

/* ------------------------------------------------- 8. lactone ring closure ---
   A hydroxy acid closing to a lactone, with the chain carbons lettered from
   the carbonyl: alpha, beta, gamma, delta. `n` is the number of CH2 carbons
   between the carbonyl carbon and the ring-forming OH carbon's end. */
function hydroxyAcid(x0, y0, letters) {
  // chain: HO – C(last letter) – … – C(alpha) – C1(=O)–OH
  let s = '';
  const k = letters.length;           // carbons carrying a Greek letter
  const pts = zig(x0, y0, k + 2, 42, 24); // HO, k carbons, C1
  const ho = pts[0], c1 = pts[k + 1];
  for (let i = 1; i <= k; i++) s += sk(pts[i], pts[i + 1]);
  s += bd(ho, pts[1], 17, 0);
  // Greek letters, placed away from the chain
  for (let i = 1; i <= k; i++) {
    const up = (i % 2) === 1;         // odd indices are raised
    const letter = letters[k - i];    // pts[1] carries the last letter
    s += text(pts[i].x, pts[i].y + (up ? -12 : 22), letter, { cls: 'fg-tag-warn', size: 11 });
  }
  // C1 carries =O and OH
  const upC1 = ((k + 1) % 2) === 1;
  const oDbl = P(c1.x, c1.y + (upC1 ? -48 : 48));
  const oh = at(c1, upC1 ? 330 : 30, 46);
  s += bond(c1, oDbl, { order: 2, rFrom: 0, rTo: 15 }) + atom(oDbl.x, oDbl.y, 'O');
  s += bd(c1, oh, 0, 17) + atom(oh.x, oh.y, 'OH', { r: 17, kind: 'warn' });
  s += atom(ho.x, ho.y, 'HO', { r: 17, kind: 'hi' });
  return { s, right: oh.x + 17 };
}
/* A lactone ring of n atoms: ring O, carbonyl C, then the lettered carbons. */
function lactone(cx, cy, n, r) {
  let s = '';
  const pts = polyPts(cx, cy, n, r, 90);
  const ctr = P(cx, cy);
  // choose the ring O and C1 at the bottom right, going round clockwise
  const iO = n === 5 ? 2 : 3, i1 = n === 5 ? 3 : 4;
  const ringO = pts[iO], c1 = pts[i1];
  const order = [];                    // lettered carbons from C1 onward
  for (let j = 1; j <= n - 2; j++) order.push(pts[(i1 + j) % n]);
  // bonds
  s += bond(ringO, c1, { rFrom: 15, rTo: 0, cls: 'fg-bond-hi' });
  s += sk(c1, order[0]);
  for (let j = 0; j < order.length - 1; j++) s += sk(order[j], order[j + 1]);
  s += bond(order[order.length - 1], ringO, { rFrom: 0, rTo: 15 });
  // exocyclic C=O
  const dx = c1.x - cx, dy = c1.y - cy, L = Math.hypot(dx, dy);
  const oEx = P(c1.x + (dx / L) * 44, c1.y + (dy / L) * 44);
  s += bond(c1, oEx, { order: 2, rFrom: 0, rTo: 15 }) + atom(oEx.x, oEx.y, 'O');
  const letters = ['α', 'β', 'γ', 'δ'];
  order.forEach((p, j) => { s += locant(p, ctr, letters[j], { cls: 'fg-tag-warn', d: 16 }); });
  s += atom(ringO.x, ringO.y, 'O', { kind: 'hi' });
  return s;
}
FIGURES.push({
  id: 'lactone-closure',
  section: 'esters-amides',
  anchor: '',
  viewBox: '0 0 760 420',
  alt: 'Top row: 4-hydroxybutanoic acid, drawn as a zigzag chain with the carboxylic acid at the right end and an OH at the left; the three chain carbons are labelled alpha, beta and gamma counting from the carbonyl. An arrow labelled trace acid, minus water, leads to gamma-butyrolactone, a five-membered ring of four carbons and one oxygen, with the new O–C bond highlighted and the carbons labelled alpha, beta, gamma. Bottom row: 5-hydroxypentanoic acid, with carbons alpha to delta, closing in the same way to delta-valerolactone, a six-membered ring.',
  build() {
    let s = '';
    const a1 = hydroxyAcid(46, 110, ['α', 'β', 'γ']);
    s += a1.s;
    s += tg(150, 34, '4-hydroxybutanoic acid');
    s += arrow(P(300, 104), P(420, 104));
    s += sm(360, 92, 'H⁺ (trace)');
    s += sm(360, 126, '− H₂O');
    s += lactone(520, 100, 5, 38);
    s += tg(560, 34, 'γ-butyrolactone: 5 ring atoms');
    s += rule(24, 208, 736, 208);
    const a2 = hydroxyAcid(46, 320, ['α', 'β', 'γ', 'δ']);
    s += a2.s;
    s += tg(170, 244, '5-hydroxypentanoic acid');
    s += arrow(P(330, 304), P(440, 304));
    s += sm(385, 292, 'H⁺ (trace)');
    s += sm(385, 326, '− H₂O');
    s += lactone(540, 306, 6, 40);
    s += tg(580, 244, 'δ-valerolactone: 6 ring atoms');
    return s;
  },
  caption: 'The teal oxygen is the OH that closes the ring, and the coral OH is the one that leaves as water. The highlighted ring bond is the new one. Each lactone is named by the Greek letter of the carbon that carries the ring oxygen.',
});

/* ------------------------------------------------------------- 230.2 ---
   The beta-lactam paragraph makes a structural argument (ring size, amide
   planarity, a serine acylated) about three molecules it never draws. */
FIGURES.push({
  id: 'beta-lactam-acylates',
  section: 'esters-amides',
  anchor: '',
  viewBox: '0 0 760 566',
  alt: 'Top row: an ordinary amide with a curved arrow from the nitrogen lone pair into the carbonyl, drawn flat; the parent beta-lactam, a four-membered ring of three carbons and an N-H with a carbonyl in the ring, its ring angle marked near 90 degrees; and the penicillin core, the same four-membered ring fused at its nitrogen to a five-membered sulfur-containing ring carrying two methyl groups and a carboxylic acid, with an acylamino side chain on the four-membered ring. Bottom row: the oxygen of a serine side chain attacking the beta-lactam carbonyl with the carbon-nitrogen ring bond breaking, giving the ring-opened drug attached to the serine as an ester, the old ring nitrogen now an N-H in the five-membered ring.',
  build() {
    let s = '';

    /* The penicillin core, placed by its four-membered ring's top-left corner
       C6. The beta-lactam is a 44px square (C6, C5, N4, C7); the thiazolidine
       is a regular pentagon sharing the C5–N4 edge. Stereochemistry is left
       out on purpose — the note says so. */
    const penam = (x0, y0, open) => {
      let g = '';
      const C6 = P(x0, y0), C5 = P(x0 + 44, y0), N4 = P(x0 + 44, y0 + 44), C7 = P(x0, y0 + 44);
      const pc = P(x0 + 44 + 30.28, y0 + 22), R = 37.43;
      const at = (deg) => P(pc.x + R * Math.cos((deg * Math.PI) / 180), pc.y + R * Math.sin((deg * Math.PI) / 180));
      const S1 = at(288), C2 = at(0), C3 = at(72);
      const nR = open ? 17 : 15;
      // thiazolidine
      g += bond(C5, S1, { rFrom: 0, rTo: 15 });
      g += bond(S1, C2, { rFrom: 15, rTo: 0 });
      g += bond(C2, C3, { rFrom: 0, rTo: 0 });
      g += bond(C3, N4, { rFrom: 0, rTo: nR });
      g += bond(N4, C5, { rFrom: nR, rTo: 0 });
      // gem-dimethyl and the acid
      const m1 = P(C2.x + 34, C2.y - 26), m2 = P(C2.x + 34, C2.y + 26);
      g += bond(C2, m1, { rFrom: 0, rTo: 17 }) + atom(m1.x, m1.y, 'CH₃', { r: 17 });
      g += bond(C2, m2, { rFrom: 0, rTo: 17 }) + atom(m2.x, m2.y, 'CH₃', { r: 17 });
      const ac = P(C3.x + 12, C3.y + 40);
      g += bond(C3, ac, { rFrom: 0, rTo: 20 }) + atom(ac.x, ac.y, 'CO₂H', { r: 20 });
      // side chain on C6
      const sc = P(C6.x, C6.y - 42);
      g += bond(C6, sc, { rFrom: 0, rTo: 24 }) + atom(sc.x, sc.y, 'RCONH', { r: 24, size: 9 });
      if (!open) {
        g += bond(C6, C7, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
        g += bond(C7, N4, { rFrom: 0, rTo: nR, cls: 'fg-bond-hi' });
        g += bond(C5, N4, { rFrom: 0, rTo: nR, cls: 'fg-bond-hi' });
        g += bond(C6, C5, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
        const o = P(C7.x - 24, C7.y + 26);
        g += bond(C7, o, { order: 2, rFrom: 0, rTo: 15 }) + atom(o.x, o.y, 'O');
        for (const q of [C6, C5, C7, C2, C3]) g += atom(q.x, q.y, '', { kind: 'point' });
        g += atom(N4.x, N4.y, 'N', { kind: 'warn' });
      } else {
        g += bond(C6, C5, { rFrom: 0, rTo: 0 });
        for (const q of [C6, C5, C2, C3]) g += atom(q.x, q.y, '', { kind: 'point' });
        g += atom(N4.x, N4.y, 'NH', { r: 17, kind: 'hi' });
      }
      g += atom(S1.x, S1.y, 'S');
      return { html: g, C6, C5, N4, C7 };
    };

    /* ---- top row ---- */
    s += panel(16, 48, 216, 216);
    s += panel(244, 48, 216, 216, { kind: 'hi' });
    s += panel(472, 48, 264, 216, { kind: 'hi' });
    s += tag(124, 36, 'AN ORDINARY AMIDE');
    s += tag(352, 36, 'THE β-LACTAM RING');
    s += tag(604, 36, 'PENICILLIN');

    /* (a) An ordinary amide, drawn the way the resonance figure above draws
       DMF: flat, with the lone pair pushing into the carbonyl. */
    {
      const c = P(92, 128), o = P(92, 72), r = P(36, 162), nA = P(148, 162);
      const h = P(204, 128), rr = P(148, 218);
      s += bond(c, o, { order: 2 });
      s += bond(c, r); s += bond(c, nA);
      s += bond(nA, h, { rTo: 10 }); s += bond(nA, rr);
      s += atom(o.x, o.y, 'O'); s += lonePair(o.x, o.y, 200); s += lonePair(o.x, o.y, 340);
      s += atom(r.x, r.y, 'R');
      s += atom(h.x, h.y, 'H', { r: 10 });
      s += atom(rr.x, rr.y, 'R′', { r: 15 });
      s += atom(nA.x, nA.y, 'N', { kind: 'hi' });
      s += lonePair(nA.x, nA.y, 140);
      s += atom(c.x, c.y, 'C', { kind: 'hi' });
      s += curve(P(126, 182), P(118, 148), { bow: 14 });
      s += curve(P(102, 108), P(108, 86), { bow: -10 });
      s += text(124, 254, 'flat: the N lone pair is shared', { cls: 'fg-sm', size: 10 });
    }

    /* (b) Azetidin-2-one, the parent ring: C2 carbonyl bottom-left, N1–H
       bottom-right, the same corners the penicillin core uses. */
    {
      const C3 = P(330, 108), C4 = P(380, 108), N1 = P(380, 158), C2 = P(330, 158);
      s += bond(C3, C4, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
      s += bond(C4, N1, { rFrom: 0, rTo: 17, cls: 'fg-bond-hi' });
      s += bond(N1, C2, { rFrom: 17, rTo: 0, cls: 'fg-bond-hi' });
      s += bond(C2, C3, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
      const o = P(C2.x - 26, C2.y + 26);
      s += bond(C2, o, { order: 2, rFrom: 0, rTo: 15 }) + atom(o.x, o.y, 'O');
      for (const q of [C3, C4, C2]) s += atom(q.x, q.y, '', { kind: 'point' });
      s += atom(N1.x, N1.y, 'NH', { r: 17 });
      // the ring angle at the carbonyl carbon
      s += `<path class="fg-dash-hi" fill="none" d="M${C2.x} ${C2.y - 14} A14 14 0 0 1 ${C2.x + 14} ${C2.y}"></path>`;
      s += text(356, 138, '≈90°', { cls: 'fg-tag-warn', size: 10.5 });
      s += text(352, 212, 'a four-membered cyclic amide', { cls: 'fg-sm', size: 10 });
      s += text(352, 230, 'the C=O carbon wants 120°', { cls: 'fg-sm', size: 10 });
      s += text(352, 244, 'and is held near 90°', { cls: 'fg-sm', size: 10 });
    }

    /* (c) The penicillin core. */
    {
      const p = penam(542, 120, false);
      s += p.html;
      s += text(604, 254, 'N is shared by both rings: pyramidal', { cls: 'fg-tag-warn', size: 10 });
    }

    s += rule(24, 282, 736, 282);

    /* ---- bottom row: the serine opens the ring ---- */
    s += tag(380, 306, 'THE ENZYME’S SERINE OPENS THE RING');
    {
      const p = penam(176, 386, false);
      s += p.html;
      // the serine: Enz–CH2–O–H, oxygen aimed at C7
      const oS = P(112, 420), hS = P(112, 378);
      s += text(86, 425, 'Enz–CH₂', { cls: 'fg-lbl', size: 12, anchor: 'end' });
      s += bond(P(88, 420), oS, { rFrom: 0, rTo: 15 });
      s += bond(oS, hS, { rFrom: 15, rTo: 10 });
      s += atom(hS.x, hS.y, 'H', { r: 10 });
      s += atom(oS.x, oS.y, 'O', { kind: 'hi' });
      s += lonePair(oS.x, oS.y, -10, { dist: 21 });
      s += curve(P(134, 414), P(170, 426), { bow: -12 });
      s += curve(P(190, 434), P(206, 440), { bow: 12 });
      s += text(176, 530, 'attack at the C=O; the ring C–N bond breaks', { cls: 'fg-sm', size: 10 });
      s += text(176, 546, '(through the tetrahedral intermediate, not drawn)', { cls: 'fg-sm', size: 9.5 });
    }
    s += arrow(P(350, 430), P(402, 430), { muted: true });

    {
      /* The acyl-enzyme: C7 now hangs off C6 as an ester carbonyl, and the
         old ring nitrogen has taken a proton. */
      const x1 = 566, y1 = 398;
      const p = penam(x1, y1, true);
      s += p.html;
      const C7 = P(x1 - 42, y1 + 24);
      s += bond(p.C6, C7, { rFrom: 0, rTo: 0 });
      const o = P(C7.x, C7.y + 44);
      s += bond(C7, o, { order: 2, rFrom: 0, rTo: 15 }) + atom(o.x, o.y, 'O');
      const oE = P(C7.x - 42, C7.y - 22);
      s += bond(C7, oE, { rFrom: 0, rTo: 15, cls: 'fg-bond-hi' }) + atom(oE.x, oE.y, 'O', { kind: 'hi' });
      s += atom(C7.x, C7.y, '', { kind: 'point' });
      s += text(oE.x - 18, oE.y + 5, 'Enz–CH₂', { cls: 'fg-lbl', size: 12, anchor: 'end' });
      s += text(566, 530, 'an ester on the serine: the enzyme is acylated,', { cls: 'fg-sm', size: 10 });
      s += text(566, 546, 'and this ester hydrolyzes only very slowly', { cls: 'fg-sm', size: 9.5 });
    }
    return s;
  },
  caption: 'Compare the nitrogen in the three top panels. In the ordinary amide it is flat and shares its lone pair with the C=O; in penicillin two rings meet at it. The highlighted bonds are the four-membered ring. In the bottom row, find the bond that breaks.',
  note: 'The group expelled in the bottom row is the ring nitrogen, which stays attached to the drug because it is still part of the five-membered ring. Proton transfers are left out, and so is penicillin’s stereochemistry: it has three stereocenters, none of which changes here.',
});

export default FIGURES;
