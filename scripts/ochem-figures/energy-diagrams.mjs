/* Figures for the energy-diagrams notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* One hill: a plateau, a rise to a peak at `peakX`, a fall to a second
   plateau. Returned as a path so the caller can pick the stroke class. */
function hill(xA, yA, xP, yP, xB, yB, cls = 'fg-bond-hi') {
  const lead = (xP - xA) * 0.55, tail = (xB - xP) * 0.55;
  return `<path class="${cls}" fill="none" d="M${xA} ${yA} C${xA + lead} ${yA} ${xP - lead * 0.45} ${yP} ${xP} ${yP} ` +
         `C${xP + tail * 0.45} ${yP} ${xB - tail} ${yB} ${xB} ${yB}"></path>`;
}

/* A vertical double-headed arrow with its own short guide lines: the way a
   textbook marks a height on one of these diagrams. */
function measure(x, yTop, yBottom, opts = {}) {
  const c = opts.cls || 'fg-arrow';
  const h = opts.head || 'fg-head';
  let g = `<line class="${c}" x1="${x}" y1="${yBottom - 6}" x2="${x}" y2="${yTop + 7}"></line>`;
  g += `<path class="${h}" d="M${x} ${yTop} L${x + 3.6} ${yTop + 7} L${x - 3.6} ${yTop + 7} Z"></path>`;
  g += `<line class="${c}" x1="${x}" y1="${yTop + 6}" x2="${x}" y2="${yBottom - 7}"></line>`;
  g += `<path class="${h}" d="M${x} ${yBottom} L${x - 3.6} ${yBottom - 7} L${x + 3.6} ${yBottom - 7} Z"></path>`;
  return g;
}

/* An energy profile through a list of nodes, each a minimum or a maximum,
   with a horizontal tangent at every node — which is what makes a well look
   like a well rather than a corner. */
function profile(nodes, cls = 'fg-bond-hi') {
  let d = `M${nodes[0].x} ${nodes[0].y}`;
  for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i - 1], b = nodes[i], h = (b.x - a.x) * 0.5;
    d += ` C${a.x + h} ${a.y} ${b.x - h} ${b.y} ${b.x} ${b.y}`;
  }
  return `<path class="${cls}" d="${d}"></path>`;
}


/* (moved to lib/ochem-helpers.mjs) */

FIGURES.push({
  id: 'energy-profile-exergonic-endergonic',
  section: 'energy-diagrams',
  anchor: '<p class="step-body">Introductory courses often draw the same diagram with enthalpy on the axis instead, in which case the words become <b>exothermic</b> and <b>endothermic</b> and the label is &Delta;H. For most of what follows the distinction does not change the reasoning, and the radical numbers later in this section are quoted as &Delta;H because bond dissociation energies are enthalpies. Use whichever letter the question uses, and keep the shape of the picture.</p>',
  alt: 'Two one-step reaction-coordinate diagrams side by side: an exergonic reaction whose products lie below the reactants, and an endergonic reaction whose products lie above them, each with the activation barrier and the overall energy change marked',
  viewBox: '0 0 760 384',
  build() {
    let s = '';
    const panelSide = (xAxis, xA, xP, xB, yR, yPk, yPr, title, dgLabel, dgCls, sum1, sum2) => {
      let g = frame(xAxis, 300, 56, xB + 22);
      g += text(xAxis + 8, 48, 'free energy', { cls: 'fg-tag', size: 11, anchor: 'start' });
      /* Level guides: the reactant plateau carried across so the plateau gap
         can be measured, and the product plateau likewise. */
      g += `<line class="fg-dash" x1="${xA}" y1="${yR}" x2="${xB + 16}" y2="${yR}"></line>`;
      g += `<line class="fg-dash" x1="${xP}" y1="${yPr}" x2="${xB + 16}" y2="${yPr}"></line>`;
      g += `<line class="fg-dash" x1="${xA - 30}" y1="${yPk}" x2="${xP}" y2="${yPk}"></line>`;
      g += hill(xA, yR, xP, yPk, xB, yPr);
      g += rule(xA - 26, yR, xA, yR);
      g += rule(xB, yPr, xB + 16, yPr);
      g += text(xP, yPk - 12, 'transition state ‡', { cls: 'fg-tag', size: 11 });
      g += measure(xA - 18, yPk, yR);
      g += text(xA - 26, (yPk + yR) / 2 + 4, 'ΔG‡', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
      g += measure(xB + 16, Math.min(yR, yPr), Math.max(yR, yPr));
      g += text(xB + 22, (yR + yPr) / 2 + 4, dgLabel, { cls: dgCls, size: 11, anchor: 'start' });
      g += text(xA - 26, yR + 20, 'reactants', { cls: 'fg-sm', size: 10, anchor: 'start' });
      g += text(xB + 16, yPr + (yPr > yR ? 20 : -12), 'products', { cls: 'fg-sm', size: 10, anchor: 'end' });
      g += text((xA + xB) / 2, 320, title, { cls: 'fg-lbl', size: 12.5 });
      g += text((xA + xB) / 2, 344, sum1, { cls: 'fg-sm', size: 10.5 });
      g += text((xA + xB) / 2, 362, sum2, { cls: 'fg-sm', size: 10.5 });
      return g;
    };
    s += panelSide(60, 118, 208, 300, 150, 86, 248, 'EXERGONIC', 'ΔG° < 0', 'fg-tag-good',
      'Products more stable, so K is greater than 1.', 'The barrier still decides how long you wait.');
    s += rule(380, 60, 380, 300);
    s += panelSide(440, 498, 588, 680, 150, 78, 100, 'ENDERGONIC', 'ΔG° > 0', 'fg-tag-warn',
      'Products less stable, so K is less than 1.', 'Uphill, yet a small barrier can make it quick.');
    return s;
  },
  caption: 'The same one-step reaction drawn the two ways it can come out. <b>Only the product plateau has moved.</b> Both panels start from the same reactant level and climb barriers of much the same height &mdash; the drop or the rise at the far end is the only difference, and the two measuring arrows on each panel start from different places on purpose.',
  note: 'The arrow on the inside measures the barrier, from the reactant plateau up to the peak; the arrow on the outside measures the gap between the two plateaus. Those are the answers to two different questions — how fast and how far — and nothing about either arrow constrains the other. A panel could be drawn with a huge downhill drop and a huge hill, or a tiny uphill step and a tiny hill, and both would be perfectly ordinary reactions.',
});

FIGURES.push({
  id: 'two-step-energy-profile',
  section: 'energy-diagrams',
  anchor: '<p class="step-body">Once the rate-determining step is identified, everything after it is invisible to the rate. If the first step has a 25 kcal/mol barrier and the second has a 5 kcal/mol barrier, molecules queue at the first hill and then fall over the second one the instant they arrive; making the second step faster still changes nothing, because nothing was waiting there. A chain is as slow as its slowest link, and speeding up the fast links does not help.</p>',
  alt: 'A two-step reaction-coordinate diagram with a tall first hump labeled TS1, a well in the middle labeled intermediate, a short second hump labeled TS2, and the rate-determining barrier marked from the reactants up to TS1',
  viewBox: '0 0 760 420',
  build() {
    let s = frame(64, 344, 58, 736);
    s += text(72, 50, 'free energy', { cls: 'fg-tag', size: 11, anchor: 'start' });
    const yR = 258, yTs1 = 96, yInt = 196, yTs2 = 152, yPr = 286;
    s += rule(86, yR, 132, yR);
    s += hill(132, yR, 232, yTs1, 332, yInt);
    s += rule(332, yInt, 424, yInt);
    s += hill(424, yInt, 520, yTs2, 616, yPr);
    s += rule(616, yPr, 690, yPr);
    s += text(232, yTs1 - 12, 'TS1 ‡', { cls: 'fg-tag-warn', size: 11 });
    s += text(520, yTs2 - 12, 'TS2 ‡', { cls: 'fg-tag', size: 11 });
    s += text(378, yInt - 12, 'INTERMEDIATE', { cls: 'fg-tag-good', size: 11 });
    s += text(378, yInt + 24, 'a real species — a cation, a radical', { cls: 'fg-sm', size: 10 });
    s += text(104, yR - 14, 'reactants', { cls: 'fg-sm', size: 10 });
    s += text(654, yPr + 20, 'products', { cls: 'fg-sm', size: 10 });
    /* The two barriers, each measured from the valley in front of it. */
    s += `<line class="fg-dash" x1="164" y1="${yTs1}" x2="232" y2="${yTs1}"></line>`;
    s += measure(164, yTs1, yR);
    s += text(156, (yTs1 + yR) / 2 + 4, 'ΔG‡ step 1', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    s += `<line class="fg-dash" x1="466" y1="${yTs2}" x2="520" y2="${yTs2}"></line>`;
    s += measure(466, yTs2, yInt);
    s += text(474, (yTs2 + yInt) / 2 + 4, 'ΔG‡ step 2', { cls: 'fg-tag', size: 11, anchor: 'start' });
    /* Overall energy change, plateau to plateau. */
    s += `<line class="fg-dash" x1="132" y1="${yR}" x2="716" y2="${yR}"></line>`;
    s += `<line class="fg-dash" x1="616" y1="${yPr}" x2="716" y2="${yPr}"></line>`;
    s += measure(716, yR, yPr);
    s += text(716, yR - 12, 'ΔG°', { cls: 'fg-tag-good', size: 11 });
    s += text(400, 368, 'The rate-determining step is the biggest climb, not the highest peak.', { cls: 'fg-lbl', size: 12.5 });
    s += text(400, 392, 'Step 2 starts from the valley floor, so its barrier is short even though TS2 sits above the reactants.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Two humps, therefore two steps; one valley, therefore one intermediate. Each barrier is drawn from the level immediately in front of it, which is the only way to measure one: step one climbs from the reactants, step two climbs from the intermediate.',
  note: 'Notice what happens if you read the peaks instead of the climbs. TS1 is the highest point on the page and it is also the biggest climb, so here the two readings agree — but they need not. Draw the middle valley much deeper and a second peak that looks modest can become the longer climb and take over as rate-determining. The rate-determining step is always found by comparing climbs, and once found, everything downstream of it is invisible to the rate.',
});

FIGURES.push({
  id: 'hammond-early-late-ts',
  section: 'energy-diagrams',
  anchor: '<p class="step-body">The consequence is the reason the postulate is worth having, and it is a statement about <b>selectivity</b>. Suppose a step can give two different products and one of them is more stable than the other. For an <b>endothermic</b> step, the transition state already looks like the product, so whatever stabilizes the product stabilizes the transition state by almost as much — the barrier falls nearly the full amount, and the rates diverge sharply. The reaction is <b>selective</b>. For an <b>exothermic</b> step the transition state looks like the reactants, which are identical in the two cases; the product\'s extra stability arrives too late to show up in the barrier, so both routes have nearly the same rate and the reaction is <b>unselective</b>.</p>',
  alt: 'Two panels comparing an exothermic step with an early transition state and an endothermic step with a late transition state, each showing a second faint curve to a more stable product so that the change in barrier height can be compared',
  viewBox: '0 0 760 404',
  build() {
    let s = '';
    const side = (xAxis, xA, xP, xB, yR, yPk, yPr, yPk2, yPr2, title, tsWord, dropWord, note1, note2) => {
      let g = frame(xAxis, 300, 56, xB + 30);
      g += text(xAxis + 8, 48, 'free energy', { cls: 'fg-tag', size: 11, anchor: 'start' });
      g += rule(xA - 24, yR, xA, yR);
      /* The faint curve first, so the main one reads on top of it. */
      g += hill(xA, yR, xP, yPk2, xB, yPr2, 'fg-bond-soft');
      g += rule(xB, yPr2, xB + 26, yPr2);
      g += hill(xA, yR, xP, yPk, xB, yPr);
      g += rule(xB, yPr, xB + 26, yPr);
      g += `<line class="fg-dash" x1="${xP}" y1="${yPk}" x2="${xP}" y2="294"></line>`;
      g += text(xP, 314, tsWord, { cls: 'fg-tag-warn', size: 11 });
      g += text(xP, Math.min(yPk, yPk2) - 14, '‡', { cls: 'fg-lbl', size: 12.5 });
      g += text(xA - 24, yR + 22, 'X• + R–H', { cls: 'fg-sm', size: 10, anchor: 'start' });
      g += text(xB + 26, yPr + (yPr > yR ? 20 : -12), '1° radical', { cls: 'fg-sm', size: 10, anchor: 'end' });
      g += text(xB + 26, yPr2 + (yPr2 > yPr ? 20 : -12), '3° radical', { cls: 'fg-sm', size: 10, anchor: 'end' });
      g += measure(xA - 16, Math.min(yPk, yPk2), Math.max(yPk, yPk2));
      g += text(xA - 16, Math.min(yPk, yPk2) - 14, dropWord, { cls: 'fg-sm', size: 10 });
      g += `<line class="fg-dash" x1="${xA - 22}" y1="${yPk}" x2="${xP}" y2="${yPk}"></line>`;
      g += `<line class="fg-dash" x1="${xA - 22}" y1="${yPk2}" x2="${xP}" y2="${yPk2}"></line>`;
      g += text((xA + xB) / 2, 338, title, { cls: 'fg-lbl', size: 12.5 });
      g += text((xA + xB) / 2, 362, note1, { cls: 'fg-sm', size: 10.5 });
      g += text((xA + xB) / 2, 382, note2, { cls: 'fg-sm', size: 10.5 });
      return g;
    };
    s += side(66, 126, 178, 312, 176, 124, 250, 130, 268, 'EXOTHERMIC — EARLY TS', 'peak sits early', 'barely lower',
      'The two barriers are almost the same height,', 'so the two radicals form at almost the same rate.');
    s += rule(384, 60, 384, 300);
    s += side(446, 506, 634, 690, 250, 106, 154, 130, 180, 'ENDOTHERMIC — LATE TS', 'peak sits late', 'much lower',
      'Stabilizing the product drops the barrier too,', 'so the more stable radical wins by a wide margin.');
    return s;
  },
  caption: 'Hammond drawn rather than asserted. In each panel the bold curve goes to the 1&deg; radical and the faint curve is the same step run toward the more stable 3&deg; radical, which therefore ends <i>lower</i> in both panels. The 3&deg; peak is the lower one in both panels too &mdash; the only question is by how much.',
  note: 'On the left the peak sits close to the reactants, which are the same on both curves, so dropping the far end of the faint curve barely drops the top: the 3&deg; barrier is lower, but only just, and the reaction can hardly tell the two hydrogens apart. On the right the peak sits close to the products, so it follows them down almost step for step &mdash; the 3&deg; barrier is lower by nearly the whole gap &mdash; and a few kcal/mol of radical stability becomes a rate ratio in the thousands. This is why chlorine, whose abstraction is exothermic, is indiscriminate, and bromine, whose abstraction is endothermic, is fussy.',
});

FIGURES.push({
  id: 'catalyst-lowers-the-barrier',
  section: 'energy-diagrams',
  anchor: '<p class="step-body">A <b>catalyst</b> gives the reaction a different route with a lower peak — usually by binding, protonating or otherwise stabilizing the transition state — and it is regenerated at the end. What matters for reading diagrams is what a catalyst does <i>not</i> touch: <b>the two plateaus.</b> Reactants and products are the same compounds with the same energies whether the catalyst is present or not, so &Delta;G&deg; is unchanged, and therefore K is unchanged. A catalyst changes how quickly equilibrium is reached and never where it lies. It also lowers the barrier in both directions by the same amount, which is why a good catalyst for a reaction is automatically a good catalyst for its reverse.</p>',
  alt: 'One reaction drawn twice on the same axes: an uncatalyzed route with a tall barrier and a catalyzed route with a much lower barrier, both starting and ending at exactly the same two energy levels',
  viewBox: '0 0 760 392',
  build() {
    let s = frame(70, 306, 52, 706);
    s += text(78, 44, 'free energy', { cls: 'fg-tag', size: 11, anchor: 'start' });
    const yR = 196, yPr = 262, yHi = 76, yLo = 146;
    s += rule(96, yR, 150, yR);
    s += hill(150, yR, 330, yHi, 512, yPr, 'fg-bond-soft');
    s += hill(150, yR, 330, yLo, 512, yPr);
    s += rule(512, yPr, 596, yPr);
    s += text(330, yHi - 12, 'uncatalyzed ‡', { cls: 'fg-tag-warn', size: 11 });
    s += text(330, yLo + 22, 'catalyzed ‡', { cls: 'fg-tag-good', size: 11 });
    s += `<line class="fg-dash" x1="186" y1="${yHi}" x2="330" y2="${yHi}"></line>`;
    s += `<line class="fg-dash" x1="186" y1="${yLo}" x2="330" y2="${yLo}"></line>`;
    s += measure(186, yHi, yR);
    s += text(178, 120, 'big ΔG‡', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    s += measure(214, yLo, yR);
    s += text(222, 176, 'small ΔG‡', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += `<line class="fg-dash" x1="150" y1="${yR}" x2="646" y2="${yR}"></line>`;
    s += `<line class="fg-dash" x1="512" y1="${yPr}" x2="646" y2="${yPr}"></line>`;
    s += measure(646, yR, yPr);
    s += text(656, (yR + yPr) / 2 + 4, 'ΔG° unchanged', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(128, yR - 14, 'reactants', { cls: 'fg-sm', size: 10 });
    s += text(560, yPr + 20, 'products', { cls: 'fg-sm', size: 10 });
    s += text(378, 336, 'Only the peak moved. Both plateaus, and therefore K, are exactly where they were.', { cls: 'fg-lbl', size: 12.5 });
    s += text(378, 360, 'The reverse barrier drops by the same amount, so the catalyst speeds both directions and shifts nothing.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'One reaction, two routes, drawn on the same axes so the comparison is forced. The catalyzed curve starts and finishes at exactly the levels the uncatalyzed one does; the only difference anywhere on the page is the height of the hill.',
  note: 'That is the whole reason a catalyst cannot change a yield at equilibrium. Equilibrium is set by the two plateaus, and the catalyst has not moved either of them — it has only made the crossing cheaper, in both directions at once. Real catalysts often replace one hill with two smaller ones, because the substrate binds to the catalyst first, but the endpoints are fixed in every case.',
});

export default FIGURES;
