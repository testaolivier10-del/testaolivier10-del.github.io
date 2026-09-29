/* Figures for the carbonyl-reduction notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------------ C3 ---
   Why the same hydride stops once with a ketone and runs twice with an ester.
   The prose states it correctly and in order, but the fork is a fact about
   what is attached to the tetrahedral carbon, and that is a picture, not a
   sentence. */
FIGURES.push({
  id: 'hydride-once-twice',
  section: 'carbonyl-reduction',
  anchor: '<h3>Reduction to a methylene</h3>',
  alt: 'A ketone stopping after one hydride because its tetrahedral intermediate has no leaving group, against an ester expelling alkoxide and taking a second hydride',
  viewBox: '0 0 760 378',
  build() {
    let s = '';
    /* A tetrahedral center drawn as a cross. The substituent positions are
       what the figure is about, so they get equal weight rather than being
       squeezed into a condensed formula. */
    const tet = (cx, cy, right, rightKind) => {
      const c = P(cx, cy), o = P(cx, cy - 42), l = P(cx - 46, cy), rr = P(cx + 46, cy), h = P(cx, cy + 42);
      let g = '';
      g += bond(c, o, { rTo: 16 });
      g += bond(c, l, { rTo: 14 });
      g += bond(c, rr, { rTo: 16 });
      g += bond(c, h, { rTo: 13, cls: 'fg-bond-hi' });
      g += atom(o.x, o.y, 'O\u207B', { kind: 'warn', r: 16, size: 11 });
      g += atom(l.x, l.y, 'R', { r: 14 });
      g += atom(rr.x, rr.y, right, { kind: rightKind, r: 16, size: right.length > 1 ? 10.5 : 12 });
      g += atom(h.x, h.y, 'H', { kind: 'hi', r: 13, size: 11 });
      g += atom(c.x, c.y, 'C');
      return g;
    };

    // ---- Ketone: one hydride ----
    s += tag(128, 48, 'KETONE \u2014 one hydride');
    s += label(66, 130, 'R\u2082C=O', { size: 13 });
    s += arrow(P(104, 126), P(228, 126));
    s += text(166, 112, 'H\u207B', { cls: 'fg-lbl', size: 12 });
    s += tet(300, 126, 'R', 'plain');
    s += text(300, 186, 'R\u207B is not a leaving group \u2014 nothing can be expelled', { cls: 'fg-sm', size: 10 });
    s += arrow(P(382, 126), P(444, 126));
    s += text(413, 112, 'H\u2083O\u207A', { cls: 'fg-sm', size: 10 });
    s += label(492, 130, 'R\u2082CH\u2013OH', { size: 13 });
    s += text(628, 130, '2\u00B0 alcohol \u2014 it stops', { cls: 'fg-tag-good', size: 11 });

    s += rule(30, 212, 730, 212);

    // ---- Ester: two hydrides ----
    s += tag(136, 244, 'ESTER \u2014 two hydrides');
    s += label(66, 292, 'RCO\u2082R\u2032', { size: 13 });
    s += arrow(P(110, 288), P(228, 288));
    s += text(169, 274, 'first H\u207B', { cls: 'fg-lbl', size: 11 });
    s += tet(300, 288, 'OR\u2032', 'warn');
    s += text(300, 348, 'R\u2032O\u207B is a leaving group \u2014 the C=O comes back', { cls: 'fg-sm', size: 10 });
    s += arrow(P(382, 288), P(444, 288));
    s += text(413, 274, 'R\u2032O\u207B leaves', { cls: 'fg-sm', size: 10 });
    s += label(482, 292, 'R\u2013CHO', { size: 13 });
    s += text(482, 314, 'more electrophilic than the ester was', { cls: 'fg-tag-warn', size: 10 });
    s += arrow(P(524, 288), P(586, 288));
    s += text(555, 274, 'second H\u207B', { cls: 'fg-sm', size: 10 });
    s += label(646, 292, 'R\u2013CH\u2082OH', { size: 13 });
    return s;
  },
  caption: 'One hydride or two, settled by the question that settles every carbonyl reaction: does the tetrahedral intermediate have anything it can throw out? A ketone&rsquo;s does not, so it stops. An ester&rsquo;s has an alkoxide &mdash; and what it collapses to is an aldehyde.',
  note: 'The reason you cannot stop an ester at that aldehyde is in the bottom row: the aldehyde is a better electrophile than the ester it came from, so it is consumed faster than it accumulates. Stopping there means crippling the reagent rather than rationing it, which is what DIBAL-H at low temperature is for. The same reading runs down the table above &mdash; an acid chloride and an ester both give tetrahedral intermediates with an alkoxide or chloride to expel, which is why LiAlH<sub>4</sub> takes them past the aldehyde every time. An amide is the one that does not fit, and it is worth keeping separate: R<sub>2</sub>N&minus; is far too strong a base to leave, so the intermediate expels its <i>oxygen</i> instead and the product is an amine.',
});

/* ------------------------------------------------------------------ R4 ---
   The chapter's central mechanism, with the arrows it was missing. The
   species were already drawn in fig:hydride-once-twice; what was absent is
   which electrons move, which is the part a student has to reproduce. */
FIGURES.push({
  id: 'hydride-arrows',
  section: 'carbonyl-reduction',
  anchor: 'The whole subject is which reagent delivers that hydride, and to what.</p>',
  alt: 'Hydride addition to a ketone drawn with curved arrows: hydride attacking the carbonyl carbon while the pi electrons move onto oxygen, the tetrahedral alkoxide, and protonation on workup to the alcohol',
  viewBox: '0 0 760 340',
  build() {
    let s = '';
    // ---- Panel 1 ----
    s += tag(132, 34, 'STEP 1 — hydride attacks the carbon');
    s += panel(14, 44, 236, 212);
    {
      const C = P(132, 146), O = P(132, 98), R1 = P(88, 184), R2 = P(176, 184), H = P(66, 122);
      s += bond(C, O, { order: 2, gap: 5, rFrom: 15, rTo: 14 });
      s += bond(C, R1, { rFrom: 15, rTo: 13 });
      s += bond(C, R2, { rFrom: 15, rTo: 13 });
      s += atom(O.x, O.y, 'O', { r: 14 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(R1.x, R1.y, 'R', { r: 13 });
      s += atom(R2.x, R2.y, 'R', { r: 13 });
      s += lonePair(O.x, O.y, 200);
      s += lonePair(O.x, O.y, 340);
      s += atom(H.x, H.y, 'H⁻', { kind: 'hi', r: 15, size: 11 });
      s += lonePair(H.x, H.y, 180, { dist: 20 });
      s += curve(P(82, 130), P(114, 142), { bow: 10 });
      s += curve(P(140, 122), P(146, 82), { bow: 14 });
      s += text(132, 200, 'the π electrons go up onto oxygen,', { cls: 'fg-sm', size: 10 });
      s += text(132, 214, 'carbon cannot hold five bonds', { cls: 'fg-sm', size: 10 });
      s += text(132, 232, 'H⁻ source: Na⁺[BH₄]⁻ or Li⁺[AlH₄]⁻', { cls: 'fg-sm', size: 9.5 });
      s += text(132, 246, 'really the B–H bond attacks, not H⁻', { cls: 'fg-sm' });
    }
    // ---- Panel 2 ----
    s += tag(380, 34, 'the tetrahedral alkoxide');
    s += panel(258, 44, 244, 212);
    {
      const C = P(374, 150), O = P(374, 100), R1 = P(322, 182), R2 = P(426, 182), H = P(374, 200);
      s += bond(C, O, { rFrom: 15, rTo: 16 });
      s += bond(C, R1, { rFrom: 15, rTo: 13 });
      s += bond(C, R2, { rFrom: 15, rTo: 13 });
      s += bond(C, H, { rFrom: 15, rTo: 13, cls: 'fg-bond-hi' });
      s += atom(O.x, O.y, 'O⁻', { kind: 'hi', r: 16, size: 11 });
      s += atom(C.x, C.y, 'C', { r: 15 });
      s += atom(R1.x, R1.y, 'R', { r: 13 });
      s += atom(R2.x, R2.y, 'R', { r: 13 });
      s += atom(H.x, H.y, 'H', { kind: 'warn', r: 13 });
      s += lonePair(O.x, O.y, 180);
      s += lonePair(O.x, O.y, 0);
      s += lonePair(O.x, O.y, 270);
      s += text(380, 226, 'flat → tetrahedral. Nothing here is', { cls: 'fg-sm', size: 10 });
      s += text(380, 242, 'a leaving group, so it stops.', { cls: 'fg-sm', size: 10 });
    }
    // ---- Panel 3 ----
    s += tag(624, 34, 'STEP 2 — workup protonates it');
    s += panel(510, 44, 236, 212);
    {
      const O = P(578, 118), C = P(530, 146), Hp = P(650, 138);
      s += bond(C, O, { rFrom: 20, rTo: 16 });
      s += atom(C.x, C.y, 'R₂CH', { r: 20, size: 9.5 });
      s += atom(O.x, O.y, 'O⁻', { kind: 'hi', r: 16, size: 11 });
      s += lonePair(O.x, O.y, 40);
      s += atom(Hp.x, Hp.y, 'H–OH₂⁺', { kind: 'warn', r: 26, size: 9 });
      s += curve(P(594, 128), P(626, 134), { bow: -10 });
      s += text(624, 190, 'R₂CH–OH', { cls: 'fg-lbl', size: 13 });
      s += text(624, 210, 'a 2° alcohol, after acid is added', { cls: 'fg-tag-good', size: 10.5 });
      s += text(624, 234, 'no proton source, no alcohol', { cls: 'fg-sm', size: 10 });
    }
    s += rule(30, 274, 730, 274);
    s += text(380, 298, 'Identical to the Grignard mechanism you have already drawn — H⁻ in place of R⁻.', { cls: 'fg-lbl', size: 12 });
    s += text(380, 322, 'Two moves in step 1: the hydride comes in, the π pair goes up.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The mechanism, with the arrows. The hydride is a nucleophile and the carbonyl carbon is the electrophile, so the attack happens there and the &pi; pair has nowhere to go but onto oxygen.',
  note: 'Three things to carry from the drawing. <b>The hydride attacks carbon, not oxygen</b> — it is a nucleophile, and the electrophile is the δ+ carbon. <b>The alkoxide is the product until workup</b>, which is why &ldquo;NaBH₄&rdquo; in an exam answer is incomplete without &ldquo;then H₃O⁺&rdquo;. And <b>the free H⁻ in panel 1 is a simplification</b>, drawn that way so the two arrows stay legible: there is no naked hydride in the flask. In a full mechanism the arrow starts at a <b>B–H (or Al–H) σ bond</b> of the [BH₄]⁻ or [AlH₄]⁻ ion and ends at the carbonyl carbon — that is the arrow Klein, Wade and Clayden all draw, and it is the one to reproduce on an exam. The mistake to avoid is starting the arrow at the <b>boron or aluminum itself</b>, which has no lone pair to give; the electrons come from the bond.',
});

/* ------------------------------------------------------------------ R8 ---
   Both figures in carbonyl-reduction show hydride addition, so "C=O to CH₂"
   - a different depth of reduction, reached by two reactions that exist only
   because they tolerate opposite conditions - was prose only. */
FIGURES.push({
  id: 'carbonyl-to-methylene',
  section: 'carbonyl-reduction',
  anchor: 'N₂ leaving is irreversible and enormously favorable, and it is what drags the whole sequence forward.</p>',
  alt: 'A ketone reduced all the way to a methylene group, with the two routes side by side: the Clemmensen in zinc amalgam and strong acid, and the Wolff-Kishner through a hydrazone that loses nitrogen gas under hot hydroxide',
  viewBox: '0 0 760 466',
  build() {
    let s = '';
    s += text(380, 24, 'ONE TRANSFORMATION, TWO SETS OF CONDITIONS', { cls: 'fg-tag', size: 11 });

    // ---- The shared start and finish ----
    {
      const C = P(310, 92), O = P(310, 56);
      s += bond(C, O, { order: 2, gap: 5, rFrom: 15, rTo: 14 });
      s += bond(C, P(274, 120), { rFrom: 15, rTo: 13 });
      s += bond(C, P(346, 120), { rFrom: 15, rTo: 13 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(O.x, O.y, 'O', { r: 14 });
      s += atom(274, 120, 'R', { r: 13 });
      s += atom(346, 120, 'R', { r: 13 });
      s += arrow(P(376, 92), P(440, 92));
      s += text(408, 80, '4 e⁻, 4 H⁺', { cls: 'fg-sm' });
    }
    {
      const C = P(480, 92);
      s += bond(C, P(452, 60), { rFrom: 15, rTo: 12, cls: 'fg-bond-hi' });
      s += bond(C, P(508, 60), { rFrom: 15, rTo: 12, cls: 'fg-bond-hi' });
      s += bond(C, P(444, 120), { rFrom: 15, rTo: 13 });
      s += bond(C, P(516, 120), { rFrom: 15, rTo: 13 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(452, 60, 'H', { kind: 'warn', r: 12 });
      s += atom(508, 60, 'H', { kind: 'warn', r: 12 });
      s += atom(444, 120, 'R', { r: 13 });
      s += atom(516, 120, 'R', { r: 13 });
      s += text(470, 150, 'the oxygen is gone entirely — two rungs, not one', { cls: 'fg-tag-good' });
    }
    s += rule(30, 160, 730, 160);

    // ---- The acidic route ----
    s += panel(14, 176, 360, 240);
    s += tag(194, 198, 'CLEMMENSEN — Zn(Hg), conc. HCl');
    s += text(194, 218, 'strongly ACIDIC', { cls: 'fg-tag-warn', size: 10.5 });
    {
      s += label(104, 258, 'R₂C=O', { size: 13 });
      s += arrow(P(150, 254), P(240, 254));
      s += text(195, 242, 'Zn(Hg), HCl, Δ', { cls: 'fg-sm', size: 9.5 });
      s += label(286, 258, 'R₂CH₂', { size: 13 });
    }
    s += text(194, 292, 'the electrons come off the zinc surface,', { cls: 'fg-sm', size: 9.5 });
    s += text(194, 308, 'in acid, and no free carbanion is ever made', { cls: 'fg-sm', size: 9.5 });
    s += text(194, 336, 'USE IT WHEN', { cls: 'fg-tag', size: 10 });
    s += text(194, 356, 'the rest of the molecule survives strong acid', { cls: 'fg-sm', size: 9.5 });
    s += text(194, 388, 'Neither route touches an ester or an amide:', { cls: 'fg-sm' });
    s += text(194, 404, 'those carbonyls expel a leaving group instead', { cls: 'fg-sm' });

    // ---- The basic route ----
    s += panel(386, 176, 360, 240);
    s += tag(566, 198, 'WOLFF–KISHNER — H₂NNH₂, then hot KOH');
    s += text(566, 218, 'strongly BASIC', { cls: 'fg-tag-warn', size: 10.5 });
    {
      const C = P(470, 262), N1 = P(516, 262), N2 = P(556, 262);
      s += bond(C, N1, { order: 2, gap: 5, rFrom: 15, rTo: 14 });
      s += bond(N1, N2, { rFrom: 14, rTo: 16 });
      s += bond(C, P(436, 234), { rFrom: 15, rTo: 13 });
      s += bond(C, P(436, 290), { rFrom: 15, rTo: 13 });
      s += atom(C.x, C.y, 'C', { r: 15 });
      s += atom(N1.x, N1.y, 'N', { kind: 'hi', r: 14 });
      s += atom(N2.x, N2.y, 'NH₂', { kind: 'hi', r: 16, size: 9.5 });
      s += atom(436, 234, 'R', { r: 13 });
      s += atom(436, 290, 'R', { r: 13 });
      s += lonePair(N1.x, N1.y, 270);
      s += arrow(P(590, 262), P(660, 262));
      s += text(625, 250, 'KOH, Δ', { cls: 'fg-sm', size: 9.5 });
      s += label(700, 266, 'R₂CH₂', { size: 13 });
      s += text(700, 288, '+ N₂ ↑', { cls: 'fg-tag-good', size: 10.5 });
      s += text(536, 298, 'the hydrazone', { cls: 'fg-tag' });
    }
    s += text(566, 322, 'hydrazine condenses on first, exactly as an imine does;', { cls: 'fg-sm' });
    s += text(566, 338, 'hot hydroxide then takes the N–H protons off, and N₂ leaves', { cls: 'fg-sm' });
    s += text(566, 354, 'as a gas, giving the carbanion — it never comes back', { cls: 'fg-sm' });
    s += text(566, 380, 'USE IT WHEN', { cls: 'fg-tag', size: 10 });
    s += text(566, 400, 'the rest of the molecule survives strong base', { cls: 'fg-sm', size: 9.5 });

    s += rule(30, 432, 730, 432);
    s += text(380, 452, 'Whichever conditions your substrate tolerates, one of the two routes is open.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The reduction that goes two rungs instead of one. A hydride reagent takes a ketone to an alcohol and stops; these two take the oxygen off altogether and leave a CH<sub>2</sub> &mdash; and they are learned as a pair because one needs strong acid and the other needs strong base.',
  note: 'The only thing you have to decide in an exam question is which half of the molecule you are protecting: acid-sensitive substrate &rarr; Wolff&ndash;Kishner, base-sensitive substrate &rarr; Clemmensen. The mechanisms are not symmetric even though the outcomes are &mdash; the Clemmensen happens on the zinc surface and is not well described by arrows on paper, while the Wolff&ndash;Kishner is drawable all the way through and is therefore the one asked about: hydrazone, deprotonation, loss of N<sub>2</sub>, carbanion. The N<sub>2</sub> loss is the engine. A gas escaping the flask cannot react backwards, so the equilibrium in front of it is dragged forward however unfavorable it looked.',
});

export default FIGURES;
