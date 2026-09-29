/* Figures for the kinetic-thermodynamic notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

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

const FIGURES = [];

/* ----------------------------------------------------------------- B3 ---
   The prose says "put the allylic cation at the top of an energy diagram
   with two routes down from it" and then does not draw one. The whole
   distinction is a claim about two heights and two depths that do not agree,
   which is the single clearest case in the book for a picture. */
FIGURES.push({
  id: 'kinetic-thermodynamic-wells',
  section: 'kinetic-thermodynamic',
  anchor: '<h3>Where else this appears</h3>',
  alt: 'Energy profile with one intermediate and two routes: a low barrier to a shallow well on the left and a higher barrier to a deeper well on the right',
  viewBox: '0 0 760 340',
  build() {
    let s = '';
    // Energy axis.
    s += arrow(P(52, 284), P(52, 46));
    s += text(62, 40, 'free energy', { cls: 'fg-tag', size: 11, anchor: 'start' });

    // The shared starting point, and the level it sits at.
    s += rule(220, 110, 550, 110);
    s += `<path class="fg-bond" fill="none" d="M330 110 C300 110 280 88 250 88 C218 88 202 196 150 196 L100 196"></path>`;
    s += `<path class="fg-bond" fill="none" d="M430 110 C460 110 490 62 520 62 C554 62 580 244 626 244 L678 244"></path>`;
    s += tag(380, 98, 'the allylic cation');

    // Barriers.
    s += text(250, 72, 'lower barrier', { cls: 'fg-tag-good', size: 11 });
    s += text(520, 46, 'higher barrier', { cls: 'fg-tag-warn', size: 11 });

    // Wells, and the comparison between their depths.
    s += rule(150, 196, 630, 196);
    s += rule(630, 196, 630, 244);
    s += text(566, 224, 'deeper', { cls: 'fg-tag-good', size: 10.5, anchor: 'end' });
    s += text(128, 218, '1,2-product', { cls: 'fg-lbl', size: 12 });
    s += text(128, 234, 'terminal alkene', { cls: 'fg-sm', size: 10 });
    s += text(678, 266, '1,4-product', { cls: 'fg-lbl', size: 12, anchor: 'end' });
    s += text(678, 282, 'internal, more substituted', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += tag(380, 272, 'reaction coordinate');

    s += rule(34, 296, 686, 296);
    s += text(186, 318, '\u221280 \u00b0C: no way back out \u2014 the barriers decide', { cls: 'fg-sm', size: 11 });
    s += text(508, 318, '40 \u00b0C: both wells empty back out \u2014 the depths decide', { cls: 'fg-sm', size: 11 });
    return s;
  },
  caption: 'Two routes down from one intermediate, and they disagree. The left route has the lower hill because bromide attacks the carbon carrying more positive charge; the right route ends in the deeper valley because its alkene is more substituted. Neither fact has anything to say about the other.',
  note: 'Temperature does not move a single line on this diagram. It decides only whether the system is allowed to climb back out of the shallow well on the left \u2014 and that is the entire content of "kinetic versus thermodynamic control." Read it as a test you can apply anywhere: if the first step cannot reverse, compare the hills; if it can, compare the valleys and ignore the hills completely.',
});

/* ----------------------------------------------------------------- B3a ---
   The section's existing figure is the diene case with real compounds in the
   wells, which is right for that argument and wrong for carrying the idea to
   enolates and sulfonation. This is the stripped version - two hills, two
   valleys, no chemistry - and it adds the thing no diagram in the chapter
   showed: the barriers back OUT, which are what temperature is actually
   deciding about. */
FIGURES.push({
  id: 'kinetic-thermodynamic-generic',
  section: 'kinetic-thermodynamic',
  anchor: 'It is changing <b>whether the system is allowed to find out</b>.</p>',
  alt: 'A generic energy profile: one intermediate in the middle, a low barrier on the left leading to a shallow well and a higher barrier on the right leading to a deeper well. Double-headed arrows mark the barrier back out of each well, small on the left and large on the right.',
  viewBox: '0 0 760 430',
  build() {
    let s = '';
    s += arrow(P(44, 330), P(44, 60));
    s += text(54, 54, 'free energy', { cls: 'fg-tag', size: 11, anchor: 'start' });

    s += rule(300, 150, 460, 150);
    s += tag(380, 140, 'the intermediate');
    s += `<path class="fg-bond" fill="none" d="M300 150 C270 150 252 116 222 116 C190 116 172 240 120 240 L80 240"></path>`;
    s += `<path class="fg-bond" fill="none" d="M460 150 C486 150 506 86 534 86 C566 86 584 310 624 310 L662 310"></path>`;
    s += text(222, 104, 'lower ΔG‡', { cls: 'fg-tag-good', size: 11 });
    s += text(534, 74, 'higher ΔG‡', { cls: 'fg-tag-warn', size: 11 });

    // the depth comparison
    s += rule(120, 240, 624, 240);
    s += rule(624, 240, 624, 310);
    s += text(548, 262, 'deeper well', { cls: 'fg-tag-good', size: 10.5 });

    // the barriers back OUT - the measure temperature is deciding about
    s += rule(100, 116, 222, 116);
    s += arrow(P(100, 232), P(100, 122), { size: 7 });
    s += arrow(P(100, 122), P(100, 232), { size: 7 });
    s += text(118, 108, 'small barrier out', { cls: 'fg-tag-good', size: 10.5 });
    s += rule(534, 86, 644, 86);
    s += arrow(P(644, 302), P(644, 92), { size: 7 });
    s += arrow(P(644, 92), P(644, 302), { size: 7 });
    s += text(606, 332, 'large barrier out', { cls: 'fg-tag-warn', size: 10.5 });

    s += text(160, 268, 'shallow well — forms faster', { cls: 'fg-lbl', size: 11.5 });
    s += text(606, 352, 'deep well — more stable', { cls: 'fg-lbl', size: 11.5 });
    s += tag(380, 350, 'reaction coordinate');

    s += rule(30, 378, 730, 378);
    s += text(375, 400, 'Kinetics compares the two hills. Thermodynamics compares the two valleys.', { cls: 'fg-lbl', size: 12 });
    s += text(375, 418, 'Warming empties the shallow well first, because that is the one with a small barrier out.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The same picture with the chemistry taken out, so it can be carried anywhere. One branch point, two routes, and the two comparisons that disagree: the left hill is lower, the right valley is deeper. Nothing about either fact predicts the other.',
  note: 'The two vertical double arrows are the part usually left out, and they are what temperature acts on. Getting <i>into</i> a well is the forward barrier; getting back <i>out</i> of it is the forward barrier plus the well depth. The shallow well on the left has a small barrier out, so it is the first to start emptying as the flask warms — and everything that leaves it is re-sorted through the branch point until it finds the deep well on the right and stays there.',
});

export default FIGURES;
