/* Figures for the oxidation-states notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------------ C1 ---
   The ladder the section describes in a table of one-carbon compounds. The
   table gives the rungs; what it cannot show is the width of a rung - that
   five named families sit on the acid rung together, which is the whole
   reason acyl substitution is not redox chemistry. The figure adds that
   second axis. */
FIGURES.push({
  id: 'oxidation-ladder',
  section: 'oxidation-states',
  anchor: 'the number depends on what else is attached.</p>',
  alt: 'The carbon oxidation ladder, with the one-carbon example, the count of bonds to heteroatoms, and the functional group families sharing each rung',
  viewBox: '0 0 760 404',
  build() {
    let s = '';
    const rows = [
      { y: 84,  n: '4', ex: 'CO\u2082',   ox: '+4',      fam: 'CO\u2082   \u00B7   CCl\u2084' },
      { y: 140, n: '3', ex: 'HCO\u2082H', ox: '+2',      fam: 'carboxylic acid \u00B7 ester \u00B7 amide \u00B7 acid chloride \u00B7 nitrile', sub: '(RCO\u2082H is +3)' },
      { y: 196, n: '2', ex: 'CH\u2082O',  ox: '0',       fam: 'aldehyde \u00B7 ketone \u00B7 acetal \u00B7 imine' },
      { y: 252, n: '1', ex: 'CH\u2083OH', ox: '\u22122', fam: 'alcohol \u00B7 ether \u00B7 alkyl halide \u00B7 amine', hi: true },
      { y: 308, n: '0', ex: 'CH\u2084',   ox: '\u22124', fam: 'alkane' },
    ];
    /* The families column is the widest thing here and the acid rung's list
       is the widest row in it, so it is set from a left edge rather than
       centered: centered, it started underneath the oxidation-state column and
       ended past the right of what the reading column shows. The direction
       arrow moves to the left margin for the same reason — its label was
       the other casualty. */
    s += tag(110, 50, 'one-carbon case');
    s += tag(200, 50, 'bonds to O/N/X');
    s += tag(276, 50, 'that C\u2019s state');
    s += text(318, 50, 'everything that shares the rung', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += rule(30, 62, 700, 62);
    // The highlight goes down first, so the row's own labels sit on top of it.
    for (const r of rows) if (r.hi) s += panel(72, r.y - 20, 628, 40, { kind: 'hi' });
    for (const r of rows) {
      s += label(110, r.y + 4, r.ex, { size: 13 });
      s += text(200, r.y + 4, r.n, { cls: 'fg-lbl', size: 12.5 });
      s += text(282, r.y + 4, r.ox, { cls: 'fg-lbl', size: 12.5 });
      s += text(318, r.y + 4, r.fam, { cls: 'fg-sm', size: 10, anchor: 'start' });
      if (r.sub) s += text(282, r.y + 20, r.sub, { cls: 'fg-sm', size: 8 });
      if (r.y !== 308) s += rule(30, r.y + 28, 700, r.y + 28);
    }
    // Direction of travel, in the left margin where nothing else is drawn.
    s += arrow(P(46, 300), P(46, 92));
    s += text(46, 78, 'oxidation', { cls: 'fg-tag', size: 10.5 });
    s += rule(30, 330, 700, 330);
    s += text(350, 354, 'Along a rung is substitution.', { cls: 'fg-lbl', size: 12 });
    s += text(350, 376, 'Up a rung is a two-electron oxidation, and needs an oxidant.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The ladder with its second dimension drawn in. A rung is not one compound but a whole set of them &mdash; everything whose carbon carries the same number of bonds to oxygen, nitrogen or halogen &mdash; and moving <b>sideways</b> along a rung costs no oxidant at all.',
  note: 'This is why an alcohol and an alkyl halide interconvert with nothing more than a nucleophile, and why an ester, an amide and a nitrile interconvert with each other but never with an aldehyde. The oxidation-state column is the one-carbon case, so formic acid reads +2 here because that carbon still carries an H; put an alkyl group there instead and a carboxylic acid is +3. The rung is the durable fact, not the number.',
});

/* ------------------------------------------------------------------ R1 ---
   The redox-neutral case, which the section asserts in a sentence and which
   is the single thing students get wrong. It is pure arithmetic on a drawing:
   run two tallies, and only when they disagree has anything been oxidized. */
FIGURES.push({
  id: 'redox-neutral',
  section: 'oxidation-states',
  anchor: 'a fast way to check you have not mislabeled something.</p>',
  alt: 'Three columns comparing an oxidation, a reduction and a redox-neutral addition by counting bonds to hydrogen against bonds to oxygen or halogen',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const cols = [
      {
        cx: 145, head: 'OXIDATION', sm: 'CH₃CH₂OH', rg: '[O]', pr: 'CH₃CHO',
        counts: ['start — on that C: 2 H, 1 O', 'product — on that C: 1 H, 2 O'],
        lines: ['H count down 1, O count up 1:', 'the two tallies disagree.', 'OXIDATION (+2 states)'],
        kind: 'fg-tag-good',
      },
      {
        cx: 385, head: 'REDUCTION', sm: 'CH₃CHO', rg: '[H]', pr: 'CH₃CH₂OH',
        counts: ['start — on that C: 1 H, 2 O', 'product — on that C: 2 H, 1 O'],
        lines: ['H count up 1, O count down 1:', 'they disagree the other way.', 'REDUCTION (−2 states)'],
        kind: 'fg-tag-good',
      },
      {
        cx: 620, head: 'NEITHER', sm: 'CH₂=CH₂', rg: 'HBr', pr: 'CH₃CH₂Br',
        counts: ['that C: 2 H, no O or X', 'that C: 2 H, 1 Br', 'the other C: gained 1 H'],
        lines: ['One carbon gained Br (up 1).', 'The other gained H (down 1).', 'They cancel — REDOX-NEUTRAL.'],
        kind: 'fg-tag-warn',
      },
    ];
    for (const c of cols) {
      s += tag(c.cx, 40, c.head);
      s += label(c.cx - 74, 80, c.sm, { size: 12.5 });
      s += arrow(P(c.cx - 34, 76), P(c.cx + 34, 76));
      s += text(c.cx, 64, c.rg, { cls: 'fg-sm', size: 10 });
      s += label(c.cx + 74, 80, c.pr, { size: 12.5 });
      c.counts.forEach((t, i) => { s += text(c.cx, 108 + i * 16, t, { cls: 'fg-sm', size: 10 }); });
      c.lines.forEach((t, i) => { s += text(c.cx, 170 + i * 20, t, { cls: i === 2 ? c.kind : 'fg-lbl', size: i === 2 ? 11 : 11 }); });
    }
    s += rule(260, 58, 260, 240);
    s += rule(505, 58, 505, 240);
    s += rule(30, 250, 730, 250);
    s += text(380, 272, 'Do the two counts separately, then compare.', { cls: 'fg-lbl', size: 12 });
    s += text(380, 292, 'An addition that brings one H and one heteroatom lands in the third column.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The three answers, with the arithmetic shown rather than asserted. Count bonds to hydrogen and bonds to O/N/halogen as two separate tallies; only when they disagree is there a redox change at all.',
  note: 'The third column is the one that catches people, because HBr addition <i>looks</i> like something happened — and it did, just not a redox something. But do not turn that into “additions are neutral”: run the two counts and the alkene reactions you already know sort into three groups. <b>Redox-neutral</b> — hydration, hydrohalogenation, oxymercuration and hydroboration–oxidation, because each carbon gains one of the pair and the two tallies move together. <b>Oxidations</b> — halogenation, halohydrin formation, epoxidation and dihydroxylation, because <i>both</i> carbons gain a bond to an electronegative atom and neither gains a hydrogen. <b>A reduction</b> — hydrogenation, where both carbons gain an H. Halohydrin formation is the one students put in the wrong column: the OH lands on one carbon and the Br on the other, so both carbons gain a heteroatom and neither gains a hydrogen — the tallies move apart, and that is an oxidation.',
});

export default FIGURES;
