/* Figures for the imines-enamines notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 39 ---
   Two products from one mechanism, split by a count. Drawing the shared
   cation once and branching from it shows that nothing differs until the
   very last proton. */
FIGURES.push({
  id: 'imine-or-enamine',
  section: 'imines-enamines',
  anchor: '<h3>Why the pH has to be about 4.5</h3>',
  viewBox: '0 0 760 340',
  alt: 'One iminium cation branching to an imine when a hydrogen remains on nitrogen and to an enamine when the proton must come from the alpha carbon',
  build() {
    let s = '';
    s += panel(250, 44, 260, 76, { kind: 'hi' });
    s += text(380, 76, 'C=N⁺  —  the shared cation', { cls: 'fg-lbl', size: 12.5 });
    s += text(380, 100, 'identical for both amines', { cls: 'fg-sm', size: 10 });

    s += arrow(P(320, 126), P(200, 172));
    s += arrow(P(440, 126), P(560, 172));

    const branch = (cx, title, from, prod, note, kind) => {
      s += panel(cx - 150, 178, 300, 94, { kind });
      s += text(cx, 202, title, { cls: 'fg-tag', size: 11 });
      s += text(cx, 226, from, { cls: 'fg-sm', size: 10.5 });
      s += text(cx, 250, prod, { cls: 'fg-lbl', size: 13 });
      s += text(cx, 292, note, { cls: 'fg-sm', size: 10 });
    };
    branch(190, 'primary amine — one H left on N', 'lose the proton from nitrogen', 'C=N–R   an imine',
           'the nitrogen still had one to give', null);
    branch(570, 'secondary amine — none left', 'lose it from the α carbon instead', 'C=C–NR₂   an enamine',
           'so the double bond lands between carbons', 'hi');

    s += rule(34, 308, 726, 308);
    s += text(380, 330, 'A tertiary amine reaches neither: with no N–H at all there is no way out of the cation.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Both amines give the same iminium cation, and everything up to that point is identical. What separates the two products is where the last proton can come from — the nitrogen, if it still has one, and otherwise the α carbon.',
  note: 'This is why the answer is a count rather than a mechanism, once the arrows above have been run once. A tertiary amine brings no N-H at all, which is why it can add and still give nothing, and why tertiary amines appear in these reactions as bases.',
});

/* ---------------------------------------------------------------- B2 ---
   The section's only picture was four boxes of prose. This one runs the
   mechanism: the shared half, the branch, and the resonance structure the
   prose asks the student to draw. */
FIGURES.push({
  id: 'imine-enamine-mechanism',
  section: 'imines-enamines',
  anchor: 'so a secondary amine takes it as far as the cation and no further.</p>',
  viewBox: '0 0 760 628',
  alt: 'Imine and enamine formation drawn step by step with curved arrows: the amine adding to the carbonyl, the carbinolamine, acid expelling water to give the iminium, and the two branches in which the last proton comes either from nitrogen or from the alpha carbon',
  build() {
    let s = '';

    /* 1 — addition. */
    s += tag(132, 36, '1 · the amine adds');
    s += panel(14, 44, 236, 216);
    {
      const O = P(96, 96), C = P(96, 152), R1 = P(52, 190), R2 = P(140, 190), N = P(196, 152);
      s += bond(C, O, { order: 2, rFrom: 14, rTo: 14 });
      s += bond(C, R1, { rFrom: 14, rTo: 13 });
      s += bond(C, R2, { rFrom: 14, rTo: 13 });
      s += atom(O.x, O.y, 'O');
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(R1.x, R1.y, 'R', { r: 13 });
      s += atom(R2.x, R2.y, 'R', { r: 13 });
      s += atom(N.x, N.y, 'R₂NH', { r: 24, size: 9.5 });
      s += lonePair(O.x, O.y, 160); s += lonePair(O.x, O.y, 20);
      s += lonePair(N.x, N.y, 180);
      s += curve(P(168, 146), P(116, 148), { bow: -12 });
      s += curve(P(118, 132), P(112, 110), { bow: 14 });
      s += text(132, 234, 'a tetrahedral zwitterion:', { cls: 'fg-sm', size: 10.5 });
      s += text(132, 254, 'O⁻ on top, N⁺H on the right', { cls: 'fg-sm', size: 10.5 });
    }

    /* 2 — the carbinolamine. */
    s += tag(380, 36, '2 · the carbinolamine');
    s += panel(262, 44, 236, 216);
    {
      const C = P(380, 144), OH = P(380, 96), N = P(444, 178), R = P(316, 178);
      s += bond(C, OH, { rFrom: 14, rTo: 16 });
      s += bond(C, N, { rFrom: 14, rTo: 18 });
      s += bond(C, R, { rFrom: 14, rTo: 13 });
      s += atom(OH.x, OH.y, 'OH', { r: 16, size: 10.5 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(N.x, N.y, 'NR₂', { r: 18, size: 10 });
      s += atom(R.x, R.y, 'R', { r: 13 });
      s += text(380, 234, 'one proton has moved,', { cls: 'fg-sm', size: 10.5 });
      s += text(380, 254, 'N⁺H to O⁻, and it is neutral', { cls: 'fg-sm', size: 10.5 });
    }

    /* 3 — acid expels water. */
    s += tag(620, 36, '3 · acid expels water');
    s += panel(510, 44, 236, 216);
    {
      const C = P(608, 152), OH = P(608, 100), N = P(672, 186), R = P(544, 186);
      s += bond(C, OH, { rFrom: 14, rTo: 22, cls: 'fg-bond-hi' });
      s += bond(C, N, { rFrom: 14, rTo: 18 });
      s += bond(C, R, { rFrom: 14, rTo: 13 });
      s += atom(OH.x, OH.y, 'OH₂⁺', { kind: 'warn', r: 22, size: 9.5 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(N.x, N.y, 'NR₂', { r: 18, size: 10 });
      s += atom(R.x, R.y, 'R', { r: 13 });
      s += curve(P(656, 178), P(626, 166), { bow: -12 });
      s += curve(P(596, 134), P(596, 116), { bow: 10 });
      s += text(616, 234, 'gives C=N⁺R₂, the iminium —', { cls: 'fg-tag-good', size: 11 });
      s += text(616, 254, 'the same for both amines', { cls: 'fg-sm', size: 10.5 });
    }

    /* 4a — primary amine. */
    s += tag(192, 292, '4a · primary amine — one H left on N');
    s += panel(14, 300, 356, 200);
    {
      const C = P(140, 372), N = P(204, 372), H = P(204, 324), R = P(252, 404), Rc = P(92, 404);
      s += bond(C, N, { order: 2, rFrom: 14, rTo: 14 });
      s += bond(N, H, { rFrom: 14, rTo: 12, cls: 'fg-bond-hi' });
      s += bond(N, R, { rFrom: 14, rTo: 13 });
      s += bond(C, Rc, { rFrom: 14, rTo: 13 });
      s += atom(C.x, C.y, 'C');
      s += atom(N.x, N.y, 'N⁺', { kind: 'hi' });
      s += atom(H.x, H.y, 'H', { kind: 'warn', r: 12 });
      s += atom(R.x, R.y, 'R', { r: 13 });
      s += atom(Rc.x, Rc.y, 'R', { r: 13 });
      s += atom(280, 312, 'H₂O', { r: 20, size: 10 });
      s += curve(P(258, 316), P(222, 318), { bow: -12 });
      s += curve(P(218, 334), P(216, 356), { bow: 12 });
      s += text(192, 442, 'C=N–R    the imine', { cls: 'fg-tag-good', size: 11 });
      s += text(192, 464, 'nitrogen still had a proton to give', { cls: 'fg-sm', size: 10.5 });
    }

    /* 4b — secondary amine. */
    s += tag(568, 292, '4b · secondary amine — none left on N');
    s += panel(390, 300, 356, 200);
    {
      const Ca = P(536, 396), C = P(600, 372), N = P(664, 372), R1 = P(712, 340), R2 = P(712, 404), H = P(492, 368);
      s += bond(C, N, { order: 2, rFrom: 14, rTo: 14 });
      s += bond(C, Ca, { rFrom: 14, rTo: 14 });
      s += bond(Ca, H, { rFrom: 14, rTo: 12, cls: 'fg-bond-hi' });
      s += bond(N, R1, { rFrom: 14, rTo: 13 });
      s += bond(N, R2, { rFrom: 14, rTo: 13 });
      s += atom(Ca.x, Ca.y, 'C', { kind: 'hi' });
      s += atom(C.x, C.y, 'C');
      s += atom(N.x, N.y, 'N⁺');
      s += atom(R1.x, R1.y, 'R', { r: 13 });
      s += atom(R2.x, R2.y, 'R', { r: 13 });
      s += atom(H.x, H.y, 'H', { kind: 'warn', r: 12 });
      s += atom(452, 322, 'H₂O', { r: 20, size: 10 });
      s += curve(P(466, 338), P(484, 354), { bow: 10 });
      s += curve(P(516, 380), P(568, 378), { bow: 16 });
      s += text(568, 442, 'C=C–NR₂    the enamine', { cls: 'fg-tag-good', size: 11 });
      s += text(568, 464, 'the α carbon gave the proton instead', { cls: 'fg-sm', size: 10.5 });
    }

    /* the resonance structure the prose asks for. */
    s += tag(380, 518, 'and the second resonance structure of that enamine');
    s += panel(14, 526, 732, 90);
    {
      s += bond(P(206, 566), P(270, 566), { order: 2, rFrom: 14, rTo: 14 });
      s += bond(P(270, 566), P(338, 566), { rFrom: 14, rTo: 20 });
      s += atom(206, 566, 'C');
      s += atom(270, 566, 'C');
      s += atom(338, 566, 'NR₂', { r: 20, size: 10 });
      s += arrow(P(382, 566), P(430, 566));
      s += arrow(P(430, 566), P(382, 566));
      s += bond(P(474, 566), P(538, 566), { rFrom: 14, rTo: 14 });
      s += bond(P(538, 566), P(606, 566), { order: 2, rFrom: 14, rTo: 20 });
      s += atom(474, 566, 'C⁻', { kind: 'hi' });
      s += atom(538, 566, 'C');
      s += atom(606, 566, 'N⁺R₂', { r: 20, size: 9.5 });
      s += text(474, 602, 'alkylate here', { cls: 'fg-tag-good', size: 11 });
    }
    return s;
  },
  caption: 'Everything is shared until the iminium. The only difference between an imine and an enamine is which proton is available to lose at the very last step &mdash; one on nitrogen if the amine brought two, and otherwise one on the &alpha; carbon.',
  note: 'The two arrows in panel 3 are the same pair you drew for an acetal: protonate the OH, then push a lone pair in as water leaves. An acetal pushes an <i>oxygen</i> lone pair in; here a <i>nitrogen</i> lone pair goes in instead, and nitrogen is much better at it, which is why imines form under far milder acid than acetals do. It is also why a tertiary amine gets nowhere: it can reach the tetrahedral intermediate of panel 1, but the cation of panel 3 would need five bonds on that nitrogen.',
});

export default FIGURES;
