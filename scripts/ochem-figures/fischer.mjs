/* Figures for the fischer notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* --------------------------------------------------------------- ch6.12 ---
   The claim the Fischer section is built on: four stereocenters stacked up
   become a pattern you can match at a glance. Asserted, never shown. */
FIGURES.push({
  id: 'sugar-patterns',
  section: 'fischer',
  anchor: '<h3>Why Fischer projections are still used</h3>',
  alt: 'Fischer projections of D-glucose, D-mannose and D-galactose side by side. Each has CHO at the top and CH2OH at the bottom with four stereocenters between. D-glucose reads right, left, right, right; D-mannose differs only at C2 and D-galactose only at C4.',
  viewBox: '0 0 760 400',
  build() {
    let s = '';
    const sugar = (cx, pattern, diff) => {
      let g = '';
      const topY = 76, botY = 316;
      g += bond(P(cx, topY), P(cx, botY), { rFrom: 17, rTo: 22 });
      g += atom(cx, topY, 'CHO', { r: 19, size: 9.5 });
      g += atom(cx, botY, 'CH₂OH', { r: 23, size: 9 });
      pattern.forEach((right, i) => {
        const y = 124 + i * 48;
        const oh = P(cx + (right ? 52 : -52), y), h = P(cx + (right ? -52 : 52), y);
        const hot = diff === i + 2;
        g += bond(oh, h, { rFrom: 18, rTo: 12, cls: hot ? 'fg-bond-hi' : 'fg-bond' });
        g += atom(oh.x, oh.y, 'OH', { r: 18, size: 10.5, kind: hot ? 'warn' : 'hi' });
        g += atom(h.x, h.y, 'H', { r: 12 });
        g += atom(cx, y, '', { kind: 'point' });
        g += text(cx - 78, y + 4, 'C' + (i + 2), { cls: 'fg-sm', size: 9 });
      });
      return g;
    };
    s += tag(380, 34, 'FOUR STEREOCENTERS, READ AS A PATTERN INSTEAD OF ANALYZED ONE BY ONE');
    s += sugar(150, [true, false, true, true], 0);
    s += text(150, 356, 'D-glucose', { cls: 'fg-tag-good', size: 12 });
    s += text(150, 376, 'right, left, right, right', { cls: 'fg-sm', size: 10 });

    s += sugar(380, [false, false, true, true], 2);
    s += text(380, 356, 'D-mannose', { cls: 'fg-tag-good', size: 12 });
    s += text(380, 376, 'differs from glucose at C2 only', { cls: 'fg-sm', size: 10 });

    s += sugar(614, [true, false, false, true], 4);
    s += text(614, 356, 'D-galactose', { cls: 'fg-tag-good', size: 12 });
    s += text(614, 376, 'differs from glucose at C4 only', { cls: 'fg-sm', size: 10 });

    s += text(380, 56, 'and in all three the bottom stereocenter, C5, has its OH on the right — which is what the D stands for', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'Why the notation survived. All three are aldohexoses with four stereocenters, 2<sup>4</sup> = 16 of which exist; drawn with wedges and dashes they take real effort to tell apart, and stacked as Fischer projections they are three patterns you can compare in a second. Glucose reads <b>right, left, right, right</b>, and each of the others changes exactly one entry in that list.',
  note: 'A pair that differs at exactly one stereocenter is an <b>epimer</b> pair, so glucose and mannose are C2 epimers and glucose and galactose are C4 epimers. Note also where D comes from: it is set by the bottom stereocenter, C5, and by nothing else — all three sugars have that OH on the right, and all three are D even though their full descriptors are mixtures of R and S.',
});

export default FIGURES;
