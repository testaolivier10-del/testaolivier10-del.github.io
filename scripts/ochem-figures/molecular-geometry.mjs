/* Figures for the molecular-geometry notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* --------------------------------------------------------------- F10 ---
   The section's own worked examples say "the molecule has a shape at every
   atom" and then list the shapes in prose. This is that sentence drawn: two
   molecules with the geometry written at each heavy atom. */
FIGURES.push({
  id: 'shape-at-every-atom',
  section: 'molecular-geometry',
  anchor: '<h3>Drawing three dimensions on paper</h3>',
  viewBox: '0 0 760 260',
  alt: 'Ethanol and acetic acid drawn as condensed structures with the geometry written under each heavy atom: tetrahedral at both carbons of ethanol and bent at its oxygen, and tetrahedral at the methyl carbon of acetic acid, trigonal planar at its carbonyl carbon, trigonal planar at the carbonyl oxygen and bent at the OH oxygen.',
  build() {
    let s = '';
    const note = (x, y, a, b) => text(x, y, a, { cls: 'fg-tag-good', size: 10.5 }) +
                                 text(x, y + 16, b, { cls: 'fg-sm', size: 10 });
    // Ethanol
    {
      s += panel(14, 16, 352, 150);
      s += text(190, 40, 'ethanol, CH₃CH₂OH', { cls: 'fg-lbl', size: 12.5 });
      const C1 = P(84, 96), C2 = P(172, 96), O = P(260, 96), H = P(312, 130);
      s += bond(C1, C2, { rFrom: 20, rTo: 20 }); s += bond(C2, O, { rFrom: 20, rTo: 15 }); s += bond(O, H, { rFrom: 15, rTo: 12 });
      s += atom(C1.x, C1.y, 'CH₃', { r: 20 }); s += atom(C2.x, C2.y, 'CH₂', { r: 20 });
      s += atom(O.x, O.y, 'O', { kind: 'hi' }); s += atom(H.x, H.y, 'H', { r: 12 });
      s += lonePair(O.x, O.y, 250); s += lonePair(O.x, O.y, 300);
      s += note(84, 138, '4 groups', 'tetrahedral');
      s += note(172, 138, '4 groups', 'tetrahedral');
      s += note(262, 138, '4 groups', 'bent, ~108°');
    }
    // Acetic acid
    {
      s += panel(394, 16, 352, 150);
      s += text(570, 40, 'acetic acid, CH₃COOH', { cls: 'fg-lbl', size: 12.5 });
      const CM = P(452, 104), C = P(540, 104), Od = P(540, 56), Os = P(628, 104), H = P(676, 132);
      s += bond(CM, C, { rFrom: 20, rTo: 15 }); s += bond(C, Od, { order: 2, gap: 5, rFrom: 15, rTo: 14 });
      s += bond(C, Os, { rFrom: 15, rTo: 14 }); s += bond(Os, H, { rFrom: 14, rTo: 12 });
      s += atom(CM.x, CM.y, 'CH₃', { r: 20 });
      s += atom(Od.x, Od.y, 'O', { r: 14 }); s += atom(Os.x, Os.y, 'O', { kind: 'hi', r: 14 });
      s += atom(H.x, H.y, 'H', { r: 12 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += lonePair(Od.x, Od.y, 200); s += lonePair(Od.x, Od.y, 340);
      s += lonePair(Os.x, Os.y, 250); s += lonePair(Os.x, Os.y, 20);
      s += note(452, 138, '4 groups', 'tetrahedral');
      s += note(540, 138, '3 groups', 'trigonal planar');
      s += note(632, 138, '4 groups', 'bent');
      s += text(660, 52, '3 groups \u2014 in the plane', { cls: 'fg-tag-good', size: 10.5 });
    }
    s += rule(14, 186, 746, 186);
    s += text(380, 206, 'A molecule has a shape at every atom, read one atom at a time.', { cls: 'fg-lbl', size: 11.5 });
    s += text(380, 226, 'The carbonyl carbon and its three neighbors are flat; the methyl beside it is not, and spins freely.', { cls: 'fg-sm', size: 10.5 });
    s += text(380, 246, 'Note the double bond counts once: the carbonyl carbon has three groups, not four.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The exam question this section is really preparing you for: given a molecule, give the geometry at every heavy atom. Run the group count once per atom and read the answer off the table. The oxygens are the ones people skip — they have shapes too, and both of acetic acid’s are different from each other.',
  note: 'Watch the two oxygens of acetic acid. The one carrying the hydrogen has two bonds and two lone pairs — four groups, so bent, like water. The doubly bonded one has one group from the double bond plus two lone pairs — three groups, so it sits in the plane of the carbonyl. Same element, same molecule, different count.',
});

export default FIGURES;
