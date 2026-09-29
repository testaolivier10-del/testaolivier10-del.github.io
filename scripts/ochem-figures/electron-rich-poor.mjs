/* Figures for the electron-rich-poor notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- 107 ---
   The chapter's closing habit, run on a molecule that contains both halves
   of a reaction. Drawn skeletally and with every lone pair on the page,
   which is what the first section of this chapter promised the rest of it
   would look like. */
FIGURES.push({
  id: 'rich-poor-scan',
  section: 'electron-rich-poor',
  anchor: '<p><b>The verdict</b>: the nitrogen is the nucleophile, the carbonyl carbon is the electrophile, and the molecule has no leaving group anywhere. Since the two reactive sites are in the same molecule and four atoms apart, the prediction almost makes itself — the nitrogen will attack that carbonyl and close a ring. (Count it: N, C4, C3, C2 make a strained four-membered ring, so in practice chemists use the chain one CH₂ longer, which closes a comfortable five-membered ring; the logic of who attacks whom is identical.) You are not expected to know the product; you are expected to be able to say which two atoms bond.</p>',
  alt: 'A skeletal drawing of 4-aminobutan-2-one with lone pairs drawn on nitrogen and oxygen, the nitrogen marked electron-rich, the carbonyl carbon marked electron-poor, and a dashed arrow showing which bond forms',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tag(212, 38, 'ONE MOLECULE, BOTH HALVES OF A REACTION');

    const n = P(96, 186), c1 = P(154, 152), c2 = P(212, 186), c3 = P(270, 152), o = P(270, 92), c4 = P(328, 186);
    s += bond(n, c1, { rFrom: 20, rTo: 0 });
    s += bond(c1, c2, { rFrom: 0, rTo: 0 });
    s += bond(c2, c3, { rFrom: 0, rTo: 0 });
    s += bond(c3, o, { rFrom: 0, rTo: 15, order: 2 });
    s += bond(c3, c4, { rFrom: 0, rTo: 0 });
    s += atom(n.x, n.y, 'H\u2082N', { kind: 'hi', r: 20, size: 10 });
    s += atom(o.x, o.y, 'O', { size: 11 });
    s += lonePair(n.x, n.y, 150, { dist: 28 });
    for (const ang of [-40, -140]) s += lonePair(o.x, o.y, ang, { dist: 24 });
    for (const pt of [c1, c2, c3, c4]) s += atom(pt.x, pt.y, '', { kind: 'point' });
    s += atom(c3.x, c3.y, '', { kind: 'warn', r: 15 });

    s += text(96, 226, 'RICH \u2014 lone pair', { cls: 'fg-tag-good', size: 10.5 });
    s += text(96, 242, 'the nucleophile', { cls: 'fg-sm', size: 10 });
    s += text(288, 68, '\u03b4\u2212', { cls: 'fg-sm', size: 11 });
    s += text(300, 226, 'POOR \u2014 \u03b4+', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(300, 242, 'the electrophile', { cls: 'fg-sm', size: 10 });
    s += curve(P(112, 162), P(256, 140), { bow: 46, muted: true });
    s += text(196, 108, 'the bond that forms', { cls: 'fg-sm', size: 10 });
    s += text(212, 268, 'H\u2082N\u2013CH\u2082\u2013CH\u2082\u2013CO\u2013CH\u2083', { cls: 'fg-lbl', size: 12 });

    s += rule(404, 34, 404, 278);
    s += text(430, 78, 'The other three carbons fail', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(430, 94, 'for two different reasons:', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(430, 124, 'the one next to N is \u03b4+, but', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(430, 140, '\u207bNH\u2082 never leaves \u2014 \u03b4+ with', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(430, 156, 'no exit is not a reaction site', { cls: 'fg-tag-warn', size: 10.5, anchor: 'start' });
    s += text(430, 186, 'the middle CH\u2082 and the methyl', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(430, 202, 'are two bonds from anything', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(430, 218, 'polarizing, so induction has', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(430, 234, 'already faded to nothing', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(430, 264, 'No leaving group anywhere.', { cls: 'fg-tag-good', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'The three-step scan on a molecule that answers it twice. Lone pairs are drawn here because the scan is a hunt for them, and a hunt is easier when the quarry is on the page.',
  note: 'The oxygen is electron-rich too, and it is worth saying why it is not the nucleophile of interest. Its lone pairs sit on a small, very electronegative atom and are held tightly, so as a nucleophile it is feeble next to the nitrogen; what it does readily instead is pick up a proton, which is why acid catalysis works on carbonyls at all. Rich and poor are the first cut, not the last word &mdash; among rich atoms, the loosely held pairs are the reactive ones.',
});

export default FIGURES;
