/* Figures for the bronsted notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- 107 ---
   Chapter 4 had one drawn proton transfer, HCl + NH3, and not one organic
   one. The notes insist that "the second arrow is not optional" and then
   never show both arrows on a molecule a student will actually meet. */
FIGURES.push({
  id: 'organic-proton-transfer',
  section: 'bronsted',
  anchor: 'which is why carboxylate salts are trivially easy to make and why a carboxylic acid cannot survive in a flask containing an alkoxide.</p>',
  alt: 'Methoxide removing the O-H proton of acetic acid, drawn skeletally with both curved arrows: one from a methoxide lone pair to the hydrogen, one from the O-H bond back onto oxygen',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tag(250, 36, 'TWO ARROWS, ONE PROTON');

    // ---- acetic acid ----
    const me = P(120, 190), c = P(172, 160), o1 = P(172, 100), o2 = P(224, 190), h = P(272, 166);
    s += bond(me, c, { rFrom: 0, rTo: 0 });
    s += bond(c, o1, { rFrom: 0, rTo: 15, order: 2 });
    s += bond(c, o2, { rFrom: 0, rTo: 15 });
    s += bond(o2, h, { rFrom: 15, rTo: 15 });
    s += atom(me.x, me.y, '', { kind: 'point' });
    s += atom(c.x, c.y, '', { kind: 'point' });
    s += atom(o1.x, o1.y, 'O', { size: 11 });
    s += atom(o2.x, o2.y, 'O', { size: 11 });
    s += atom(h.x, h.y, 'H', { kind: 'warn', size: 11 });
    for (const ang of [-40, -140]) s += lonePair(o1.x, o1.y, ang, { dist: 24 });
    for (const ang of [60, 120]) s += lonePair(o2.x, o2.y, ang, { dist: 24 });
    s += text(160, 262, 'acetic acid, pKa 4.76', { cls: 'fg-sm', size: 10 });

    // ---- methoxide ----
    const mo = P(360, 126), mc = P(412, 96);
    s += bond(mo, mc, { rFrom: 16, rTo: 0 });
    s += atom(mo.x, mo.y, 'O', { kind: 'hi', size: 11 });
    s += atom(mc.x, mc.y, '', { kind: 'point' });
    s += text(386, 106, '−', { cls: 'fg-hi', size: 16 });
    for (const ang of [135, 180, 225]) s += lonePair(mo.x, mo.y, ang, { dist: 24 });
    s += text(392, 214, 'methoxide, CH₃O⁻', { cls: 'fg-sm', size: 10 });

    // ---- arrow 1: base to proton ----
    s += curve(P(338, 122), P(288, 156), { bow: -20 });
    s += tag(276, 70, '1 · the base takes the proton');

    // ---- arrow 2: the bonding pair stays behind ----
    s += curve(P(250, 180), P(222, 208), { bow: -18 });
    s += tag(318, 244, '2 · the bonding pair stays behind');

    s += rule(500, 40, 500, 268);
    s += text(524, 64, 'What you get', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(524, 88, 'methanol, CH₃OH', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 106, 'acetate, CH₃CO₂⁻', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 132, 'Charge in: −1 and 0', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 150, 'Charge out: 0 and −1', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 184, 'Acid used up: 4.76', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 202, 'Acid made: 15.5', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 228, 'Gap of 10.7 units, so', { cls: 'fg-tag-good', size: 10.5, anchor: 'start' });
    s += text(524, 246, 'it goes, completely.', { cls: 'fg-tag-good', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'The same two arrows as the HCl figure, on an acid and a base you will meet in a real flask. Arrow one makes the new O–H bond out of a methoxide lone pair; arrow two leaves the old bonding pair behind on acetic acid’s oxygen, which is what makes the conjugate base negative.',
  note: 'Draw only arrow two and you have described acetic acid falling apart by itself, which it does not do. Draw only arrow one and the hydrogen ends up with two bonds. The pair of arrows is not decoration &mdash; it is the electron bookkeeping, and the charge check at the right is how you know it balances.',
});

/* ---------------------------------------------------------------- 108 ---
   "Which proton comes off, and which site gets protonated" is the most
   asked question on this topic and the chapter never ran it on a molecule
   with more than one candidate. */
FIGURES.push({
  id: 'acid-base-site-scan',
  section: 'bronsted',
  anchor: 'protonate this molecule with one equivalent of HCl and the proton goes to nitrogen every time, giving the ammonium salt and leaving the alcohol untouched.</p>',
  alt: 'A skeletal drawing of 4-aminobutan-1-ol with each kind of hydrogen labeled by pKa with the nitrogen lone pair marked as the basic site',
  viewBox: '0 0 760 290',
  build() {
    let s = '';
    s += tag(250, 36, 'ONE MOLECULE, TWO DIFFERENT ANSWERS');

    const n = P(104, 176), c1 = P(164, 142), c2 = P(224, 176), c3 = P(284, 142), c4 = P(344, 176), o = P(404, 142);
    s += bond(n, c1, { rFrom: 22, rTo: 0 });
    s += bond(c1, c2, { rFrom: 0, rTo: 0 });
    s += bond(c2, c3, { rFrom: 0, rTo: 0 });
    s += bond(c3, c4, { rFrom: 0, rTo: 0 });
    s += bond(c4, o, { rFrom: 0, rTo: 19 });
    s += atom(n.x, n.y, 'H₂N', { kind: 'hi', r: 22, size: 10 });
    s += atom(o.x, o.y, 'OH', { kind: 'warn', r: 19, size: 10.5 });
    for (const pt of [c1, c2, c3, c4]) s += atom(pt.x, pt.y, '', { kind: 'point' });
    s += lonePair(n.x, n.y, 180, { dist: 30 });

    s += text(404, 96, 'O–H, pKa 16', { cls: 'fg-tag-warn', size: 11 });
    s += text(404, 78, 'most acidic proton', { cls: 'fg-sm', size: 10 });
    s += text(104, 222, 'N–H, pKa 38', { cls: 'fg-sm', size: 10 });
    s += text(104, 240, 'lone pair: most basic site', { cls: 'fg-tag-good', size: 10.5 });
    s += text(254, 226, 'C–H, pKa about 50', { cls: 'fg-sm', size: 10 });
    s += text(254, 244, 'never in the running', { cls: 'fg-sm', size: 10 });
    s += text(250, 268, '4-aminobutan-1-ol', { cls: 'fg-sm', size: 10 });

    s += rule(500, 40, 500, 272);
    s += text(524, 64, 'Add one equivalent of', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(524, 88, 'NaH → takes the O–H.', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 106, 'It is 22 units below the', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 124, 'N–H, so nothing else', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 142, 'competes for the base.', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 178, 'HCl → goes to nitrogen.', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 196, 'Both atoms have pairs,', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 214, 'but nitrogen holds its', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 232, 'more loosely and gives', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 250, 'it up more willingly.', { cls: 'fg-sm', size: 10, anchor: 'start' });
    return s;
  },
  caption: 'The scan run on a molecule that has an O–H, an N–H and six C–H bonds. The acid question and the base question have different answers, on opposite ends of the same molecule — which is why they have to be asked separately.',
  note: 'The order the scan runs in matters more than it looks. Check O–H and N–H first and you are done in one pass on most molecules; start with the carbons and you will spend the paper arguing about a proton that is thirty orders of magnitude out of contention.',
});

/* ---------------------------------------------------------------- 109 ---
   The notes said an acid in a mechanism "might be a protonated intermediate
   generated two steps earlier" and never drew one, so the commonest acids in
   the whole book went unillustrated. */
FIGURES.push({
  id: 'cation-acids',
  section: 'bronsted',
  anchor: 'protonation invents an acidic hydrogen where there was none.</p>',
  alt: 'Three cationic acids drawn side by side: hydronium, a protonated alcohol and a protonated carbonyl, each with its pKa and its neutral parent',
  viewBox: '0 0 760 268',
  build() {
    let s = '';
    s += tag(380, 36, 'THE ACID IS USUALLY A CATION');

    const panels = [
      { x: 140, name: 'hydronium', pka: 'pKa −1.7', from: 'from water, 15.7' },
      { x: 380, name: 'protonated alcohol', pka: 'pKa about −2', from: 'from an alcohol, 16' },
      { x: 620, name: 'protonated carbonyl', pka: 'pKa about −7', from: 'from a ketone, no O–H at all' },
    ];

    // --- hydronium ---
    {
      const o = P(140, 122), h1 = P(92, 152), h2 = P(188, 152), h3 = P(140, 76);
      s += bond(o, h1, { rTo: 12 }); s += bond(o, h2, { rTo: 12 }); s += bond(o, h3, { rTo: 12 });
      s += atom(o.x, o.y, 'O', { kind: 'warn', size: 12 });
      s += atom(h1.x, h1.y, 'H', { r: 12, size: 10 });
      s += atom(h2.x, h2.y, 'H', { r: 12, size: 10 });
      s += atom(h3.x, h3.y, 'H', { r: 12, size: 10 });
      s += text(172, 96, '+', { cls: 'fg-tag-warn', size: 14 });
      s += lonePair(o.x, o.y, 180, { dist: 24 });
    }
    // --- protonated alcohol ---
    {
      const o = P(380, 122), r = P(332, 152), h1 = P(428, 152), h2 = P(380, 76);
      s += bond(o, r, { rTo: 20 }); s += bond(o, h1, { rTo: 12 }); s += bond(o, h2, { rTo: 12 });
      s += atom(o.x, o.y, 'O', { kind: 'warn', size: 12 });
      s += atom(r.x, r.y, 'R', { r: 20, size: 11 });
      s += atom(h1.x, h1.y, 'H', { r: 12, size: 10 });
      s += atom(h2.x, h2.y, 'H', { r: 12, size: 10 });
      s += text(412, 96, '+', { cls: 'fg-tag-warn', size: 14 });
      s += lonePair(o.x, o.y, 180, { dist: 24 });
    }
    // --- protonated carbonyl ---
    {
      const c = P(596, 150), o = P(596, 92), h = P(648, 62), r1 = P(544, 180), r2 = P(648, 180);
      s += bond(c, o, { rFrom: 15, rTo: 15, order: 2 });
      s += bond(o, h, { rFrom: 15, rTo: 12 });
      s += bond(c, r1, { rFrom: 15, rTo: 18 });
      s += bond(c, r2, { rFrom: 15, rTo: 18 });
      s += atom(c.x, c.y, 'C', { size: 12 });
      s += atom(o.x, o.y, 'O', { kind: 'warn', size: 12 });
      s += atom(h.x, h.y, 'H', { r: 12, size: 10 });
      s += atom(r1.x, r1.y, 'R', { r: 18, size: 11 });
      s += atom(r2.x, r2.y, 'R', { r: 18, size: 11 });
      s += text(562, 70, '+', { cls: 'fg-tag-warn', size: 14 });
      s += lonePair(o.x, o.y, 180, { dist: 24 });
    }

    for (const p of panels) {
      s += text(p.x, 214, p.name, { cls: 'fg-sm', size: 10 });
      s += text(p.x, 232, p.pka, { cls: 'fg-tag-warn', size: 11 });
      s += text(p.x, 252, p.from, { cls: 'fg-sm', size: 10 });
    }
    return s;
  },
  caption: 'Three acids that appear in mechanisms constantly and in reagent bottles never. Each is made by protonating something neutral, and each gives that proton straight back to anything mildly basic — which is exactly what makes them useful intermediates rather than reagents.',
  note: 'The reason a full positive charge is worth seventeen or eighteen pK<sub>a</sub> units is visible in the drawing: when the proton leaves, the charge does not move somewhere else, it disappears. Every other acid on the ladder has to find a home for a negative charge it has just created. These three simply stop being charged.',
});

export default FIGURES;
