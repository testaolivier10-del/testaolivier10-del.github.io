/* Figures for the aldehyde-oxidation notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 54 ---
   The point students miss is that the oxidant never sees the carbonyl. Drawing
   the hydrate on the path, with the fork for wet against dry conditions,
   turns the Jones/PCC rule from something memorized into something read. */
FIGURES.push({
  id: 'oxidant-sees-the-hydrate',
  section: 'aldehyde-oxidation',
  anchor: '<h3>Tollens\' reagent and the silver mirror</h3>',
  viewBox: '0 0 760 300',
  alt: 'Three boxes in a row: an aldehyde, then its hydrate, then the carboxylic acid, with the wet and dry conditions listed beneath',
  build() {
    let s = '';
    const box = (x, w, kind, title, sub) => {
      s += panel(x, 58, w, 74, { kind });
      s += text(x + w / 2, 88, title, { cls: 'fg-lbl', size: 13 });
      s += text(x + w / 2, 110, sub, { cls: 'fg-sm', size: 10.5 });
    };
    box(24,  190, null,   'R\u2013CHO',        'no O\u2013H to grip');
    box(286, 190, 'warn', 'R\u2013CH(OH)\u2082', 'an alcohol, in effect');
    box(548, 188, null,   'R\u2013COOH',       'oxidized a second time');

    s += arrow(P(214, 95), P(286, 95));
    s += text(250, 78, '+ H\u2082O', { cls: 'fg-tag', size: 11 });
    s += arrow(P(476, 95), P(548, 95));
    s += text(512, 78, '[O]', { cls: 'fg-tag', size: 11 });

    s += rule(24, 168, 700, 168);
    s += text(24, 196, 'Jones, Cr(VI) in aqueous acid', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(24, 216, 'water present \u2192 the hydrate keeps re-forming \u2192 runs to the acid', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(24, 244, 'PCC in anhydrous CH\u2082Cl\u2082', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(24, 264, 'no water \u2192 no hydrate \u2192 nothing left to attack, so it stops', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(24, 292, 'A ketone stops at the first box: its carbonyl carbon has no hydrogen to remove.', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    return s;
  },
  caption: 'The step everyone skips. An oxidant needs an O\u2013H and a C\u2013H on the same carbon, and a C=O offers neither \u2014 so what is actually attacked is the hydrate. That single box is the whole difference between a reagent that stops at the aldehyde and one that does not.',
  note: 'The same argument explains a sugar. A cyclic hemiacetal holds only a trace of the open-chain aldehyde, and yet glucose gives a full silver mirror, because the equilibrium delivers that trace continuously and the oxidant consumes it as fast as it appears. A species can be present in traces and still control the product, provided it is the only form that can react.',
});

export default FIGURES;
