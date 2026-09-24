/* Figures for the hybridization notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- F9 ---
   Lone pairs are electron groups, and the group-count worked examples for
   ammonia and water are the two where a reader forgets that. Drawing the
   pair in the fourth corner is the whole argument. */
FIGURES.push({
  id: 'lone-pairs-are-groups',
  section: 'hybridization',
  anchor: '<h3>The shortcut you will actually use</h3>',
  viewBox: '0 0 760 250',
  alt: 'Methane, ammonia and water drawn side by side, each with four electron groups around the central atom. Methane has four bonds, ammonia three bonds and one lone pair drawn in the fourth corner, water two bonds and two lone pairs, and all three are labeled sp3.',
  build() {
    let s = '';
    const cases = [
      { x: 14,  name: 'methane, CH₄',  el: 'C', bonds: 4, count: '4 bonds + 0 pairs' },
      { x: 268, name: 'ammonia, NH₃',  el: 'N', bonds: 3, count: '3 bonds + 1 pair' },
      { x: 522, name: 'water, H₂O',    el: 'O', bonds: 2, count: '2 bonds + 2 pairs' },
    ];
    /* Four tetrahedral directions, drawn flat: two up, two down. Whichever
       corners are not bonds are drawn as a lone pair in the same place, so
       the reader sees that a pair occupies a corner exactly as a bond does. */
    const dirs = [[-52, -40], [52, -40], [-52, 44], [52, 44]];
    for (const c of cases) {
      s += panel(c.x, 16, 226, 176);
      const cx = c.x + 113, cy = 108;
      s += text(cx, 40, c.name, { cls: 'fg-lbl', size: 12.5 });
      dirs.forEach(([dx, dy], i) => {
        const at = P(cx + dx, cy + dy);
        if (i < c.bonds) {
          s += bond(P(cx, cy), at, { rFrom: 16, rTo: 13 });
          s += atom(at.x, at.y, 'H', { r: 13 });
        } else {
          s += `<circle class="fg-orb" cx="${at.x}" cy="${at.y}" r="15" fill-opacity="0.16"></circle>`;
          s += text(at.x, at.y + 4, 'lp', { cls: 'fg-sm', size: 9.5 });
          s += bond(P(cx, cy), at, { rFrom: 16, rTo: 16, cls: 'fg-dash' });
        }
      });
      s += atom(cx, cy, c.el, { kind: 'hi' });
      s += text(cx, 182, c.count + ' = 4 groups', { cls: 'fg-tag-good', size: 11 });
    }
    s += rule(14, 208, 746, 208);
    s += text(380, 228, 'Four groups every time, so all three are sp³ and all three are built on a tetrahedron.', { cls: 'fg-lbl', size: 11.5 });
    s += text(380, 246, 'What changes is how many corners hold an atom — which is the shape, not the hybridization.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The three worked examples with the lone pairs drawn. Counting groups means counting corners, and a lone pair occupies a corner exactly as a bonded atom does — so ammonia and water have the same four groups methane has, and all three are sp³. Forgetting the pairs always answers one step too unsaturated: sp² for ammonia, sp for water.',
  note: 'Keep hybridization and shape apart. All three are sp³, because all three have four groups; their <i>shapes</i> differ — tetrahedral, trigonal pyramidal, bent — because shape describes where the atoms are and ignores the pairs. Molecular Geometry is about that second question.',
});

export default FIGURES;
