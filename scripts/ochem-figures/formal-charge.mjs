/* Figures for the formal-charge notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- F3 ---
   A neutral molecule that must be drawn with charges inside it. The section
   works nitromethane in prose; a reader who has only ever seen charges on
   ions needs to see the + and the - sitting on a molecule with none. */
FIGURES.push({
  id: 'nitro-group-charges',
  section: 'formal-charge',
  anchor: '<h3>The built-in check</h3>',
  viewBox: '0 0 760 250',
  alt: 'Nitromethane drawn twice. On the left, the tempting structure with nitrogen double-bonded to both oxygens, marked impossible because nitrogen would have five bonds. On the right, the correct structure with one double bond and one single bond, a plus one on nitrogen and a minus one on the singly bonded oxygen, summing to zero.',
  build() {
    let s = '';
    // Left: the tempting, impossible structure.
    {
      const C = P(110, 130), N = P(186, 130), O1 = P(252, 86), O2 = P(252, 174);
      s += text(186, 40, 'what most people draw first', { cls: 'fg-tag-warn', size: 11.5 });
      s += bond(C, N); s += bond(N, O1, { order: 2 }); s += bond(N, O2, { order: 2 });
      s += atom(C.x, C.y, 'CH₃');
      s += atom(N.x, N.y, 'N', { kind: 'warn' });
      s += atom(O1.x, O1.y, 'O'); s += atom(O2.x, O2.y, 'O');
      s += lonePair(O1.x, O1.y, 20); s += lonePair(O1.x, O1.y, 330);
      s += lonePair(O2.x, O2.y, 30); s += lonePair(O2.x, O2.y, 340);
      s += text(186, 214, 'no charges anywhere — and 5 bonds on N', { cls: 'fg-tag-warn', size: 11 });
      s += text(186, 232, 'ten electrons on a period-2 atom: impossible', { cls: 'fg-sm', size: 10.5 });
    }
    s += rule(380, 40, 380, 236);
    // Right: the real structure.
    {
      const C = P(470, 130), N = P(546, 130), O1 = P(612, 86), O2 = P(612, 174);
      s += text(546, 40, 'the structure that works', { cls: 'fg-tag-good', size: 11.5 });
      s += bond(C, N); s += bond(N, O1, { order: 2 }); s += bond(N, O2);
      s += atom(C.x, C.y, 'CH₃');
      s += atom(N.x, N.y, 'N', { kind: 'hi' });
      s += atom(O1.x, O1.y, 'O'); s += atom(O2.x, O2.y, 'O', { kind: 'warn' });
      s += lonePair(O1.x, O1.y, 20); s += lonePair(O1.x, O1.y, 330);
      s += lonePair(O2.x, O2.y, 30); s += lonePair(O2.x, O2.y, 90); s += lonePair(O2.x, O2.y, 340);
      s += text(546, 104, '+', { cls: 'fg-tag-warn', size: 14 });
      s += text(640, 160, '−', { cls: 'fg-tag-warn', size: 14 });
      s += text(546, 214, 'N: 5 − 0 − 4 = +1   ·   lower O: 6 − 6 − 1 = −1', { cls: 'fg-tag-good', size: 11 });
      s += text(546, 232, 'sum = 0, and the molecule is neutral', { cls: 'fg-sm', size: 10.5 });
    }
    return s;
  },
  caption: 'Nitromethane is a neutral molecule that cannot be drawn without charges in it. The tidy-looking structure on the left gives nitrogen five bonds, which period 2 cannot do; forcing it down to four leaves the arithmetic no choice, and a +1 on nitrogen appears beside a −1 on the singly bonded oxygen. They cancel, which is why the molecule is neutral overall.',
  note: 'This is the trap the worked examples in this section are built around: “neutral molecule” is a statement about the <i>sum</i> of the formal charges, not about each atom. Any nitro group you meet from here on — in a nitrated aromatic ring, in TNT, in a nitroalkane — is drawn exactly this way, and one without the charges is wrong.',
});

export default FIGURES;
