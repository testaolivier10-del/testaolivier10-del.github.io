/* Figures for the pka notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- 111 ---
   The bicarbonate separation is the classic exam and lab question and the
   notes taught it in three sentences with nothing to look at. */
FIGURES.push({
  id: 'bicarbonate-extraction',
  section: 'pka',
  anchor: '<p>This is a real laboratory separation, and it rests on nothing but two pKa comparisons.</p>',
  alt: 'A separatory funnel with an upper ether layer holding the neutral phenol and a lower aqueous layer holding the carboxylate salt, with the two pKa comparisons written beside it',
  viewBox: '0 0 760 320',
  build() {
    let s = '';
    s += tag(192, 36, 'ONE REAGENT, TWO LAYERS');

    // ---- the funnel: a body with two layers and a stem ----
    s += panel(56, 64, 272, 176, { r: 14 });
    s += bar(60, 68, 264, 82, { kind: 'mut', r: 10, opacity: 0.12 });
    s += bar(60, 152, 264, 84, { kind: 'hi', r: 10, opacity: 0.3 });
    s += rule(60, 150, 328, 150);
    s += rule(178, 240, 178, 278);
    s += rule(206, 240, 206, 278);

    s += text(192, 98, 'ORGANIC LAYER \u2014 ether, on top', { cls: 'fg-tag-mut', size: 11 });
    s += text(192, 122, 'PhOH', { cls: 'fg-lbl', size: 13 });
    s += text(192, 140, 'still neutral \u2014 stays put', { cls: 'fg-sm', size: 10 });

    s += text(192, 180, 'AQUEOUS LAYER \u2014 denser, below', { cls: 'fg-tag', size: 11 });
    s += text(192, 204, 'RCO\u2082\u207b Na\u207a', { cls: 'fg-lbl', size: 13 });
    s += text(192, 222, 'charged \u2014 dissolves in water', { cls: 'fg-sm', size: 10 });

    s += text(192, 300, 'run the bottom (aqueous) layer off', { cls: 'fg-sm', size: 10 });

    s += rule(376, 48, 376, 300);

    s += text(404, 74, 'The base is NaHCO\u2083.', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(404, 94, 'Its conjugate acid is carbonic acid, pKa 6.4,', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(404, 112, 'so it deprotonates anything below 6.4 and', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(404, 130, 'nothing above it.', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += text(404, 168, 'RCO\u2082H, pKa 4.76', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(404, 186, '1.6 units below \u2014 deprotonated, goes ionic,', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(404, 204, 'and moves into the water.', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += text(404, 240, 'PhOH, pKa 10', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    s += text(404, 258, '3.6 units above \u2014 not touched, stays neutral,', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(404, 276, 'and stays up in the ether.', { cls: 'fg-sm', size: 10, anchor: 'start' });
    return s;
  },
  caption: 'Why the reagent is bicarbonate and not hydroxide. Hydroxide (conjugate acid water, pKa 15.7) is strong enough to deprotonate both compounds, so both would end up in the aqueous layer and nothing would be separated. Bicarbonate sits deliberately between the two pKa values.',
  note: 'This is the general shape of every extraction you will run: pick a base whose conjugate-acid pK<sub>a</sub> falls <i>between</i> the two compounds you want apart. Charged species go into water, neutral ones stay in the organic layer, and the funnel does the rest. Acidifying the aqueous layer afterwards puts the proton back and gives the carboxylic acid out clean.',
});

export default FIGURES;
