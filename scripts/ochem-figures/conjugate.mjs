/* Figures for the conjugate notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- 112 ---
   Every conjugate in this section was inorganic. The conjugates students are
   actually asked for are an alcohol's and an amine's, in both directions. */
FIGURES.push({
  id: 'organic-conjugates',
  section: 'conjugate',
  anchor: '<p><b>The same operation on the groups you will meet later:</b> the conjugate acid of a ketone is the protonated carbonyl C=OH⁺; the conjugate base of a ketone is the enolate; the conjugate base of a terminal alkyne is the acetylide. In each case, count one H and one unit of charge, and change nothing else.</p>',
  alt: 'Two rows showing ethanol and ethylamine each flanked by their conjugate acid on the left and conjugate base on the right, with pKa values under each',
  viewBox: '0 0 760 320',
  build() {
    let s = '';
    s += tag(380, 34, 'ONE PROTON EITHER SIDE OF THE MOLECULE YOU STARTED WITH');

    /* A two-carbon skeleton ending in a heteroatom, drawn at a given origin.
       `extra` is what hangs off the heteroatom, `charge` the sign to write. */
    const chain = (ox, oy, el, extra, charge, kind) => {
      let g = '';
      const a = P(ox, oy + 30), b = P(ox + 46, oy), x = P(ox + 92, oy + 30);
      g += bond(a, b, { rFrom: 0, rTo: 0 });
      g += bond(b, x, { rFrom: 0, rTo: 17 });
      g += atom(a.x, a.y, '', { kind: 'point' });
      g += atom(b.x, b.y, '', { kind: 'point' });
      g += atom(x.x, x.y, el, { kind, r: 17, size: el.length > 2 ? 9.5 : 11 });
      if (extra) g += text(x.x + 31, x.y + 5, extra, { cls: 'fg-lbl', size: 12, anchor: 'start' });
      if (charge) g += text(x.x + 6, x.y - 26, charge, { cls: kind === 'hi' ? 'fg-hi' : 'fg-warn', size: 15 });
      return g;
    };

    const row = (y, title, acid, acidPka, mid, base, basePka) => {
      let g = '';
      g += chain(60, y, acid[0], acid[1], '+', 'warn');
      g += chain(300, y, mid[0], mid[1], '', 'plain');
      g += chain(540, y, base[0], base[1], '−', 'hi');
      g += arrow(P(240, y + 30), P(288, y + 30), { muted: true });
      g += arrow(P(480, y + 30), P(528, y + 30), { muted: true });
      g += text(106, y + 74, acid[2], { cls: 'fg-sm', size: 10 });
      g += text(106, y + 92, acidPka, { cls: 'fg-tag-warn', size: 11 });
      g += text(346, y + 74, mid[2], { cls: 'fg-sm', size: 10 });
      g += text(346, y + 92, title, { cls: 'fg-tag', size: 11 });
      g += text(586, y + 74, base[2], { cls: 'fg-sm', size: 10 });
      g += text(586, y + 92, basePka, { cls: 'fg-tag-good', size: 11 });
      g += text(264, y + 8, '−H⁺', { cls: 'fg-sm', size: 10 });
      g += text(504, y + 8, '−H⁺', { cls: 'fg-sm', size: 10 });
      return g;
    };

    s += row(64, 'the alcohol',
      ['O', 'H₂', 'conjugate acid'], 'pKa about −2',
      ['O', 'H', 'ethanol'],
      ['O', '', 'conjugate base'], 'parent pKa 16');

    s += rule(40, 178, 720, 178);

    s += row(210, 'the amine',
      ['N', 'H₃', 'conjugate acid'], 'pKa about 10.7',
      ['N', 'H₂', 'ethylamine'],
      ['N', 'H', 'conjugate base'], 'parent pKa 38');
    return s;
  },
  caption: 'The operation, run forwards and backwards on the two functional groups exams ask about. Left of center you have added a proton and a positive charge; right of center you have removed a proton and gone down one unit of charge. Nothing else about the molecule changes.',
  note: 'Which of the two you will actually meet is decided by the numbers underneath. An ammonium ion at pK<sub>a</sub> 10.7 forms whenever an amine meets any ordinary acid; the amide anion beside it needs butyllithium, because its parent N&ndash;H is pK<sub>a</sub> 38. Same operation, wildly different difficulty.',
});

export default FIGURES;
