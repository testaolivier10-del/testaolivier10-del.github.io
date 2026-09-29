/* Figures for the nucleophiles notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- 104 ---
   The two nucleophilicity trends run in opposite directions on the periodic
   table, and one of them changes sign with the solvent. The notes asked the
   reader to hold all of that in their head at once with no picture. Two
   strips of the table, one horizontal and one vertical, is the picture. */
FIGURES.push({
  id: 'nucleophile-trends',
  section: 'nucleophiles',
  anchor: '<h3>Two words worth pinning down: protic, and polarizable</h3>',
  alt: 'A row of the periodic table showing nucleophilicity falling from carbanion to fluoride, and a column showing halide nucleophilicity rising down the group in protic solvent and reversing in aprotic solvent',
  viewBox: '0 0 760 330',
  build() {
    let s = '';

    // ---- Across a row ----
    s += tag(200, 40, 'ACROSS A ROW');
    const row = ['H\u2083C\u207b', 'H\u2082N\u207b', 'HO\u207b', 'F\u207b'];
    for (let i = 0; i < 4; i++) {
      const x = 84 + i * 76;
      s += panel(x, 84, 60, 60, { kind: i === 0 ? 'hi' : i === 3 ? 'warn' : null, r: 8 });
      s += label(x + 30, 120, row[i], { size: 13 });
    }
    s += arrow(P(84, 176), P(348, 176), { muted: true });
    s += text(216, 166, 'electronegativity rises', { cls: 'fg-sm', size: 10 });
    s += text(216, 200, 'nucleophilicity FALLS', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(216, 226, 'a more electronegative atom holds its', { cls: 'fg-sm', size: 10 });
    s += text(216, 242, 'pair tighter and shares it less readily', { cls: 'fg-sm', size: 10 });
    s += text(216, 268, 'this trend does not care about solvent', { cls: 'fg-tag-good', size: 10.5 });

    s += rule(392, 34, 392, 306);

    // ---- Down a column ----
    s += tag(570, 40, 'DOWN A COLUMN');
    const col = ['F\u207b', 'Cl\u207b', 'Br\u207b', 'I\u207b'];
    for (let i = 0; i < 4; i++) {
      const y = 70 + i * 56;
      s += panel(452, y, 56, 46, { kind: i === 3 ? 'hi' : i === 0 ? 'warn' : null, r: 8 });
      s += label(480, y + 29, col[i], { size: 13 });
    }
    s += arrow(P(428, 76), P(428, 288), { muted: true });
    s += text(528, 96, 'IN WATER OR METHANOL', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
    s += text(528, 114, 'the order rises downward:', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(528, 130, 'I\u207b is big and barely', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(528, 146, 'solvated; F\u207b is caged', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(528, 186, 'IN DMSO OR DMF', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
    s += text(528, 204, 'no cage to strip, so the', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(528, 220, 'order flips back:', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(528, 240, 'F\u207b > Cl\u207b > Br\u207b > I\u207b', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(528, 268, 'and every anion is', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(528, 284, 'stronger than in water', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += rule(34, 306, 726, 306);
    s += text(380, 324, 'A halide ranking with no solvent named is not an answer to anything.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Two strips of the periodic table. The horizontal trend is a property of the atoms and never changes; the vertical one is a property of the atoms <i>and their solvent</i>, and changes sign when the solvent does.',
  note: 'Exam questions on this topic are usually testing whether you noticed the solvent in the stem. Protic &mdash; water, methanol, ethanol, acetic acid &mdash; means the anions are hydrogen-bonded into a shell, the small ones worst, so iodide wins. Aprotic &mdash; DMSO, DMF, acetone, acetonitrile &mdash; means no shell, so the intrinsic order returns and fluoride wins. If no solvent is given, the question is either incomplete or is asking about the row rather than the column.',
});

export default FIGURES;
