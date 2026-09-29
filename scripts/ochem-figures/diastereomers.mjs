/* Figures for the diastereomers notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- ch6.7 ---
   cis and trans 2-butene with their dipoles, which is the part of the
   diastereomers section that joins two previously separate ideas. */
FIGURES.push({
  id: 'cis-trans-are-diastereomers',
  section: 'diastereomers',
  anchor: '<h3>Cis/trans isomers are diastereomers</h3>',
  alt: 'cis-2-butene drawn with both methyls below the double bond, its two bond dipoles sharing an upward component and adding to a net dipole of 0.33 debye, and trans-2-butene with one methyl above and one below, its two dipoles pointing exactly opposite ways and cancelling to zero.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    const butene = (cx, trans) => {
      const c2 = P(cx - 26, 150), c3 = P(cx + 26, 150);
      const m1 = P(cx - 66, 172), m2 = P(cx + 66, trans ? 128 : 172);
      const h1 = P(cx - 66, 128), h2 = P(cx + 66, trans ? 172 : 128);
      let g = bond(c2, c3, { order: 2, rFrom: 0, rTo: 0, cls: 'fg-bond-hi', gap: 4 });
      g += bond(c2, m1, { rFrom: 0, rTo: 17 });
      g += bond(c3, m2, { rFrom: 0, rTo: 17 });
      g += bond(c2, h1, { rFrom: 0, rTo: 12 });
      g += bond(c3, h2, { rFrom: 0, rTo: 12 });
      g += atom(m1.x, m1.y, 'CH₃', { r: 17, size: 10 });
      g += atom(m2.x, m2.y, 'CH₃', { r: 17, size: 10 });
      g += atom(h1.x, h1.y, 'H', { r: 12 });
      g += atom(h2.x, h2.y, 'H', { r: 12 });
      g += atom(c2.x, c2.y, '', { kind: 'point' });
      g += atom(c3.x, c3.y, '', { kind: 'point' });
      return g;
    };
    /* The two C-CH3 bond dipoles redrawn from one origin, so their sum can be
       read off. Each points from the methyl toward the sp2 carbon it is on. */
    const dipoles = (cx, trans) => {
      const o = P(cx, 250);
      let g = arrow(o, P(o.x + 30, o.y - 20), { size: 7 });
      g += arrow(o, P(o.x - 30, trans ? o.y + 20 : o.y - 20), { size: 7 });
      if (!trans) g += arrow(o, P(o.x, o.y - 28), { muted: true, size: 7 });
      g += atom(o.x, o.y, '', { kind: 'point' });
      return g;
    };
    s += panel(24, 44, 340, 232, { kind: 'hi' });
    s += butene(194, false);
    s += text(194, 34, 'cis-2-butene', { cls: 'fg-tag', size: 11.5 });
    s += text(194, 96, 'both methyls on the same side', { cls: 'fg-sm', size: 9.5 });
    s += text(194, 216, 'the two C–CH₃ bond dipoles', { cls: 'fg-sm', size: 9 });
    s += dipoles(194, false);
    s += text(194, 296, 'they share an upward component and ADD: μ = 0.33 D', { cls: 'fg-tag-good', size: 10 });
    s += text(194, 316, 'bp 3.7 °C', { cls: 'fg-sm', size: 10 });

    s += panel(396, 44, 340, 232, { kind: 'hi' });
    s += butene(566, true);
    s += text(566, 34, 'trans-2-butene', { cls: 'fg-tag', size: 11.5 });
    s += text(566, 96, 'one methyl up, one down', { cls: 'fg-sm', size: 9.5 });
    s += text(566, 216, 'the two C–CH₃ bond dipoles', { cls: 'fg-sm', size: 9 });
    s += dipoles(566, true);
    s += text(566, 296, 'they are exactly opposed and CANCEL: μ = 0', { cls: 'fg-tag-good', size: 10 });
    s += text(566, 316, 'bp 0.9 °C, and ≈ 1 kcal/mol more stable', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Two compounds, not two drawings of one — the C=C cannot rotate, so the methyls are stuck where they are. They are stereoisomers and neither is the mirror image of the other, which makes them <b>diastereomers</b> by the definition at the top of this section, and everything the definition predicts is measurable here: different dipole moment, different boiling point, different stability.',
  note: 'Count the stereocenters in either structure and you get zero. That is the point worth taking away: the diastereomer relationship is defined by “not mirror images”, not by a stereocenter count, and a double bond is a perfectly good source of stereoisomerism on its own. The arrows below each structure are the two C–CH₃ bond dipoles redrawn from one origin: in the cis isomer they share an upward component and add to a small net dipole, and in the trans isomer they are exactly opposed and the molecule has none.',
});

export default FIGURES;
