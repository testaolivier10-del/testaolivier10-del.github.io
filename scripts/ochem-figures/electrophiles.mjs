/* Figures for the electrophiles notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- 105 ---
   The electrophiles section worked one example, a ketone, with exactly one
   candidate atom in it. Real questions hand you a molecule with four
   carbons and ask which one, so here is that molecule, drawn skeletally
   (this chapter teaches skeletal notation and then stops using it), with
   every carbon argued rather than the answer asserted. */
FIGURES.push({
  id: 'electrophile-scan',
  section: 'electrophiles',
  anchor: '<h3>Ranking electrophiles</h3>',
  alt: 'A skeletal drawing of 4-chlorobutan-2-one with its four carbons numbered, beside a list saying why each one is or is not the electrophilic site',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tag(210, 40, 'FOUR CARBONS, ONE ANSWER');

    const cl = P(96, 176), c1 = P(154, 142), c2 = P(212, 176), c3 = P(270, 142), o = P(270, 82), c4 = P(328, 176);
    s += bond(cl, c1, { rFrom: 15, rTo: 0 });
    s += bond(c1, c2, { rFrom: 0, rTo: 0 });
    s += bond(c2, c3, { rFrom: 0, rTo: 0 });
    s += bond(c3, o, { rFrom: 0, rTo: 15, order: 2 });
    s += bond(c3, c4, { rFrom: 0, rTo: 0 });
    s += atom(cl.x, cl.y, 'Cl', { size: 11 });
    s += atom(o.x, o.y, 'O', { size: 11 });
    for (const ang of [-40, -140, 180]) s += lonePair(cl.x, cl.y, ang, { dist: 24 });
    for (const ang of [-40, -140]) s += lonePair(o.x, o.y, ang, { dist: 24 });
    for (const pt of [c1, c2, c3, c4]) s += atom(pt.x, pt.y, '', { kind: 'point' });

    s += text(154, 120, '1', { cls: 'fg-tag', size: 12 });
    s += text(212, 202, '2', { cls: 'fg-tag', size: 12 });
    s += text(292, 120, '3', { cls: 'fg-tag', size: 12 });
    s += text(328, 202, '4', { cls: 'fg-tag', size: 12 });
    s += text(210, 240, 'ClCH\u2082\u2013CH\u2082\u2013CO\u2013CH\u2083', { cls: 'fg-lbl', size: 12 });
    s += text(210, 262, '4-chlorobutan-2-one', { cls: 'fg-sm', size: 10 });

    s += rule(376, 34, 376, 288);

    const lines = [
      ['1', 'CH\u2082Cl carbon: \u03b4+ from Cl, and Cl will leave.', 'a real target', true],
      ['2', 'middle CH\u2082: two bonds from either puller,', 'and nothing on it to leave', false],
      ['3', 'carbonyl carbon: two bonds to oxygen, and the', '\u03c0 can break instead of a group leaving', true],
      ['4', 'methyl: nothing withdrawing, nothing to leave', '', false],
    ];
    let y = 72;
    for (const [num, a, b, good] of lines) {
      s += text(404, y, num, { cls: good ? 'fg-tag-good' : 'fg-tag-mut', size: 12, anchor: 'start' });
      s += text(424, y, a, { cls: 'fg-sm', size: 10, anchor: 'start' });
      if (b) s += text(424, y + 16, b, { cls: 'fg-sm', size: 10, anchor: 'start' });
      y += b ? 54 : 44;
    }
    s += text(404, 264, 'Most electrophilic: 3. Also attackable: 1.', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(404, 282, 'Two sites is normal; the question is which wins.', { cls: 'fg-sm', size: 10, anchor: 'start' });
    return s;
  },
  caption: 'The scan the prose describes, run on a molecule with more than one candidate. Each carbon gets an argument, and two of them survive it.',
  note: 'Notice what separates the two survivors. Carbon 1 needs its chloride to leave before anything can happen, so its reactivity is limited by how good that leaving group is. Carbon 3 needs nothing to leave at all &mdash; the C=O pi bond simply breaks onto the oxygen, which is delighted to hold the charge &mdash; so a nucleophile can attack it with no leaving group anywhere in sight. That is why carbonyl chemistry and substitution chemistry feel so different even though both are a nucleophile hitting a &delta;+ carbon.',
});

export default FIGURES;
