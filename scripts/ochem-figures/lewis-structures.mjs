/* Figures for the lewis-structures notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- F1 ---
   Four organic molecules as Lewis structures, with every lone pair drawn and
   each atom's quota written under it. The valence-rule method the section
   now teaches is a table; this is the table applied four times. */
FIGURES.push({
  id: 'organic-lewis-structures',
  section: 'lewis-structures',
  anchor: '<h3>The general-chemistry recipe, for molecules with a real center</h3>',
  viewBox: '0 0 760 300',
  alt: 'Four Lewis structures drawn side by side: ethanol, methylamine, acetic acid and the methoxide ion, each with every lone pair shown as a pair of dots and each heavy atom labeled with how many bonds and lone pairs it carries.',
  build() {
    let s = '';
    const quota = (x, y, t) => text(x, y, t, { cls: 'fg-tag-good', size: 10.5 });

    // Ethanol, CH3-CH2-O-H
    {
      const x = 14; s += panel(x, 16, 176, 200);
      s += text(x + 88, 40, 'ethanol', { cls: 'fg-lbl', size: 12.5 });
      const C1 = P(x + 34, 104), C2 = P(x + 88, 104), O = P(x + 142, 104), H = P(x + 142, 156);
      s += bond(C1, C2); s += bond(C2, O); s += bond(O, H);
      s += atom(C1.x, C1.y, 'CH₃'); s += atom(C2.x, C2.y, 'CH₂');
      s += atom(O.x, O.y, 'O', { kind: 'hi' }); s += atom(H.x, H.y, 'H');
      s += lonePair(O.x, O.y, 270); s += lonePair(O.x, O.y, 40);
      s += quota(x + 88, 186, 'O: 2 bonds + 2 pairs = 4');
      s += quota(x + 88, 202, 'both C: 4 bonds, no pair');
    }
    // Methylamine, CH3-NH2
    {
      const x = 204; s += panel(x, 16, 176, 200);
      s += text(x + 88, 40, 'methylamine', { cls: 'fg-lbl', size: 12.5 });
      const C = P(x + 44, 104), N = P(x + 104, 104), H1 = P(x + 148, 74), H2 = P(x + 148, 138);
      s += bond(C, N); s += bond(N, H1); s += bond(N, H2);
      s += atom(C.x, C.y, 'CH₃');
      s += atom(N.x, N.y, 'N', { kind: 'hi' });
      s += atom(H1.x, H1.y, 'H'); s += atom(H2.x, H2.y, 'H');
      s += lonePair(N.x, N.y, 270);
      s += quota(x + 88, 186, 'N: 3 bonds + 1 pair = 4');
      s += quota(x + 88, 202, 'that pair is all of amine chemistry');
    }
    // Acetic acid, CH3-C(=O)-O-H
    {
      const x = 394; s += panel(x, 16, 186, 200);
      s += text(x + 93, 40, 'acetic acid', { cls: 'fg-lbl', size: 12.5 });
      const CM = P(x + 34, 122), C = P(x + 94, 122), Od = P(x + 94, 70), Os = P(x + 150, 122), H = P(x + 150, 172);
      s += bond(CM, C); s += bond(C, Od, { order: 2 }); s += bond(C, Os); s += bond(Os, H);
      s += atom(CM.x, CM.y, 'CH₃'); s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(Od.x, Od.y, 'O'); s += atom(Os.x, Os.y, 'O'); s += atom(H.x, H.y, 'H');
      s += lonePair(Od.x, Od.y, 200); s += lonePair(Od.x, Od.y, 340);
      s += lonePair(Os.x, Os.y, 20); s += lonePair(Os.x, Os.y, 300);
      s += quota(x + 93, 186, 'middle C: 4 bonds — the C=O counts twice');
      s += quota(x + 93, 202, 'each O: 2 bonds + 2 pairs');
    }
    // Methoxide, CH3-O(-)
    {
      const x = 594; s += panel(x, 16, 152, 200);
      s += text(x + 76, 40, 'methoxide ion', { cls: 'fg-lbl', size: 12.5 });
      const C = P(x + 44, 110), O = P(x + 108, 110);
      s += bond(C, O);
      s += atom(C.x, C.y, 'CH₃');
      s += atom(O.x, O.y, 'O', { kind: 'warn' });
      s += lonePair(O.x, O.y, 45); s += lonePair(O.x, O.y, 315); s += lonePair(O.x, O.y, 0, { dist: 28 });
      s += text(x + 108, 78, '−', { cls: 'fg-tag-warn', size: 14 });
      s += quota(x + 76, 186, 'O: 1 bond + 3 pairs');
      s += quota(x + 76, 202, 'one short of quota → −1');
    }
    s += rule(14, 240, 746, 240);
    s += text(380, 262, 'bonds + lone pairs = 4 for C, N, O and the halogens', { cls: 'fg-lbl', size: 12 });
    s += text(380, 284, 'Every departure from the quota is a formal charge — and none of this needed a central atom.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The valence rule applied four times. Each heavy atom takes its quota of bonds, lone pairs fill the rest of the octet, and the only atom that departs from its quota — methoxide’s oxygen, one bond short — is the only atom carrying a charge. Read the lone pairs on the oxygens and nitrogen especially: they are drawn in every structure in this course, and leaving them off is how charges get lost later.',
  note: 'Acetic acid is the one to study. The two oxygens in <b>CH₃COOH</b> are not a chain of two oxygens: the first is doubly bonded to the carbon and the second carries the hydrogen, which is why the middle carbon reaches four bonds and the formula is not read left to right like the rest.',
});

/* ---------------------------------------------------------------- F2 ---
   Four impossible structures beside their corrections. A wrong/right pair
   teaches a trap better than a sentence about it, because the reader has to
   look at the wrong one to see what is wrong with it. */
FIGURES.push({
  id: 'four-wrong-structures',
  section: 'lewis-structures',
  anchor: '<h3>Three real exceptions to the octet rule</h3>',
  viewBox: '0 0 760 250',
  alt: 'Four pairs of drawings. In each pair an impossible structure is shown on the left and its correction on the right: a five-bonded carbon corrected to four bonds, a nitrogen with four bonds and no charge corrected to carry a plus one, an oxygen with three bonds and no charge corrected to carry a plus one, and a hydrogen drawn bridging two carbons corrected to a single bond.',
  build() {
    let s = '';
    const cell = (x, title) => { s += panel(x, 16, 176, 172); s += text(x + 88, 40, title, { cls: 'fg-lbl', size: 12 }); };

    // 1. five-bonded carbon
    {
      const x = 14; cell(x, 'C: 5 bonds');
      const C = P(x + 60, 104);
      [[0, -42], [0, 42], [-42, 0], [30, -30], [30, 30]].forEach(([dx, dy]) =>
        s += bond(C, P(C.x + dx, C.y + dy), { rTo: 9 }));
      s += atom(C.x, C.y, 'C', { kind: 'warn' });
      s += text(x + 88, 160, '10 electrons, period 2', { cls: 'fg-tag-warn', size: 10 });
      s += text(x + 88, 176, 'no orbital holds them', { cls: 'fg-sm', size: 10 });
    }
    // 2. neutral four-bond nitrogen
    {
      const x = 204; cell(x, 'N: 4 bonds, no charge');
      const N = P(x + 70, 104);
      [[0, -42], [0, 42], [-42, 0], [42, 0]].forEach(([dx, dy]) =>
        s += bond(N, P(N.x + dx, N.y + dy), { rTo: 9 }));
      s += atom(N.x, N.y, 'N', { kind: 'warn' });
      s += text(x + 88, 160, '5 − 0 − 4 = +1', { cls: 'fg-tag-warn', size: 10 });
      s += text(x + 88, 176, 'legal — but write the +', { cls: 'fg-sm', size: 10 });
    }
    // 3. neutral three-bond oxygen
    {
      const x = 394; cell(x, 'O: 3 bonds, no charge');
      const O = P(x + 70, 104);
      [[0, -42], [-40, 24], [40, 24]].forEach(([dx, dy]) =>
        s += bond(O, P(O.x + dx, O.y + dy), { rTo: 9 }));
      s += atom(O.x, O.y, 'O', { kind: 'warn' });
      s += lonePair(O.x, O.y, 160);
      s += text(x + 88, 160, '6 − 2 − 3 = +1', { cls: 'fg-tag-warn', size: 10 });
      s += text(x + 88, 176, 'the arrow-pushing slip', { cls: 'fg-sm', size: 10 });
    }
    // 4. bridging hydrogen
    {
      const x = 584; cell(x, 'H: 2 bonds');
      const A = P(x + 40, 104), H = P(x + 88, 104), B = P(x + 136, 104);
      s += bond(A, H); s += bond(H, B);
      s += atom(A.x, A.y, 'C'); s += atom(B.x, B.y, 'C');
      s += atom(H.x, H.y, 'H', { kind: 'warn' });
      s += text(x + 88, 160, 'one shell, one pair', { cls: 'fg-tag-warn', size: 10 });
      s += text(x + 88, 176, 'H bonds to one thing', { cls: 'fg-sm', size: 10 });
    }
    s += rule(14, 208, 746, 208);
    s += text(380, 230, 'Two can never be drawn at all; two are correct structures missing their charge.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'The four structures a first course draws most often and cannot draw. The first and the last are impossible outright: a period-2 atom has four orbitals and hydrogen has one, so ten electrons on carbon and four on hydrogen have nowhere to sit. The middle two are perfectly good structures that are simply missing their charge — four-bonded nitrogen and three-bonded oxygen exist everywhere in this course, and neither is ever neutral.',
  note: 'The valence rule catches all four in about two seconds each: work out what the atom’s quota is (C 4 bonds, N 3 + 1 pair, O 2 + 2 pairs, H 1), compare it to what is drawn, and if there is a difference either write the charge the arithmetic gives or redraw the bond.',
});

export default FIGURES;
