/* Figures for the energy-diagrams notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every energy diagram here names both axes: free energy (or energy) up the
   side, reaction coordinate along the bottom. Notes figures may be up to 760
   wide; the lesson copies (ids starting l-) are 340 wide or less, stacked
   vertically, and use only fg-lbl and fg-tag text. */
import { atom, bond, wedge, hash, text, tag, label, rule } from '../lib/ochem-figure.mjs';
import { plus, frame } from '../lib/ochem-helpers.mjs';

const FIGURES = [];
const LESSON = ['energy-diagrams'];

/* An energy profile through a list of nodes, each a plateau end, a minimum
   or a maximum, with a horizontal tangent at every node, so a well looks like
   a well and a peak like a peak rather than a corner. */
function profile(nodes, cls = 'fg-bond-hi') {
  let d = `M${nodes[0].x} ${nodes[0].y}`;
  for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i - 1], b = nodes[i], h = (b.x - a.x) * 0.5;
    d += ` C${a.x + h} ${a.y} ${b.x - h} ${b.y} ${b.x} ${b.y}`;
  }
  return `<path class="${cls}" fill="none" d="${d}"></path>`;
}
const N = (x, y) => ({ x, y });

/* A vertical double-headed arrow: the usual way to mark a height. */
function measure(x, yTop, yBottom) {
  let g = `<line class="fg-arrow" x1="${x}" y1="${yTop + 7}" x2="${x}" y2="${yBottom - 7}"></line>`;
  g += `<path class="fg-head" d="M${x} ${yTop} L${x + 3.6} ${yTop + 7} L${x - 3.6} ${yTop + 7} Z"></path>`;
  g += `<path class="fg-head" d="M${x} ${yBottom} L${x - 3.6} ${yBottom - 7} L${x + 3.6} ${yBottom - 7} Z"></path>`;
  return g;
}
const dash = (x1, y1, x2, y2) => `<line class="fg-dash" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>`;

/* Both axes, named: the energy axis with its arrow, the reaction coordinate
   along the bottom. */
function axes(x0, yBase, yTop, xEnd, yWord = 'free energy', xWord = 'reaction coordinate →') {
  let g = frame(x0, yBase, yTop, xEnd);
  g += text(x0 + 9, yTop + 5, yWord, { cls: 'fg-tag', anchor: 'start' });
  g += text(xEnd, yBase + 17, xWord, { cls: 'fg-tag', anchor: 'end' });
  return g;
}

/* Square brackets and a double dagger around a transition-state drawing. */
function brackets(xl, xr, yt, yb) {
  let g = `<path class="fg-bond" fill="none" d="M${xl + 9} ${yt} L${xl} ${yt} L${xl} ${yb} L${xl + 9} ${yb}"></path>`;
  g += `<path class="fg-bond" fill="none" d="M${xr - 9} ${yt} L${xr} ${yt} L${xr} ${yb} L${xr - 9} ${yb}"></path>`;
  g += text(xr + 5, yt + 8, '‡', { cls: 'fg-lbl', anchor: 'start' });
  return g;
}
/* A partial bond: a dotted line trimmed back from both atom circles. */
function partial(a, b, rA = 16, rB = 16) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L;
  return dash(+(a.x + ux * rA).toFixed(1), +(a.y + uy * rA).toFixed(1), +(b.x - ux * rB).toFixed(1), +(b.y - uy * rB).toFixed(1));
}

/* ------------------------------------------------------------------ */
/* 1. One step, one hill: HO⁻ + CH₃Br. */
function oneStepNotes() {
  let s = axes(40, 270, 34, 720, 'free energy (higher = less stable)');
  const yR = 170, yT = 80, yP = 230;
  s += dash(140, yT, 390, yT);
  s += dash(140, yR, 170, yR);
  s += dash(250, yR, 650, yR);
  s += dash(620, yP, 650, yP);
  s += profile([N(170, yR), N(250, yR), N(390, yT), N(540, yP), N(620, yP)]);
  s += measure(150, yT, yR);
  s += text(142, 122, 'ΔG‡', { cls: 'fg-tag-warn', anchor: 'end' });
  s += text(142, 138, 'sets the rate', { cls: 'fg-sm', anchor: 'end' });
  s += measure(650, yR, yP);
  s += text(658, 196, 'ΔG°', { cls: 'fg-tag-good', anchor: 'start' });
  s += text(658, 212, 'sets K', { cls: 'fg-sm', anchor: 'start' });
  s += tag(210, 158, 'reactants');
  s += label(210, 194, 'HO⁻ + CH₃Br');
  s += tag(390, 66, 'transition state ‡');
  s += tag(580, 218, 'products');
  s += label(580, 254, 'CH₃OH + Br⁻');
  return s;
}
function oneStepLesson() {
  let s = axes(24, 226, 26, 330);
  const yR = 140, yT = 70, yP = 180;
  s += dash(60, yT, 192, yT);
  s += dash(60, yR, 92, yR);
  s += dash(132, yR, 312, yR);
  s += dash(290, yP, 312, yP);
  s += profile([N(92, yR), N(132, yR), N(192, yT), N(252, yP), N(290, yP)]);
  s += measure(68, yT, yR);
  s += text(61, 110, 'ΔG‡', { cls: 'fg-tag-warn', anchor: 'end' });
  s += measure(312, yR, yP);
  s += text(317, 165, 'ΔG°', { cls: 'fg-tag-good', anchor: 'start' });
  s += tag(114, 128, 'reactants');
  s += label(110, 162, 'HO⁻ + CH₃Br');
  s += tag(192, 58, 'transition state ‡');
  s += tag(268, 170, 'products');
  s += label(268, 204, 'CH₃OH + Br⁻');
  return s;
}
FIGURES.push({
  id: 'one-step-profile',
  section: 'energy-diagrams',
  anchor: '<h3>What the picture plots</h3>',
  alt: 'Reaction-coordinate diagram for hydroxide ion reacting with bromomethane in one step. Free energy runs up the vertical axis and the reaction coordinate runs along the horizontal axis. The reactants sit on a plateau at the left, the curve rises to a single peak labeled transition state, then falls to the products methanol and bromide ion on a lower plateau at the right. An arrow from the reactant plateau up to the peak is labeled delta G double dagger, sets the rate; an arrow between the two plateaus is labeled delta G degree, sets K.',
  viewBox: '0 0 760 300',
  build: oneStepNotes,
  caption: 'One step, one hill. The two arrows start from the same reactant plateau but end in different places: one at the peak, one at the product plateau.',
});
FIGURES.push({
  id: 'l-one-step-profile',
  lessons: LESSON,
  alt: 'Reaction-coordinate diagram for hydroxide plus bromomethane: reactant plateau, one peak labeled transition state, lower product plateau of methanol plus bromide. Delta G double dagger is marked from the reactants up to the peak; delta G degree between the two plateaus. Axes: free energy up, reaction coordinate across.',
  viewBox: '0 0 340 250',
  build: oneStepLesson,
  caption: 'ΔG‡ runs from the reactants up to the peak. ΔG° runs from the reactants to the products.',
});

/* ------------------------------------------------------------------ */
/* 2. Exergonic against endergonic. */
FIGURES.push({
  id: 'energy-profile-exergonic-endergonic',
  section: 'energy-diagrams',
  anchor: '<h3>What the picture plots</h3>',
  alt: 'Two one-step reaction-coordinate diagrams side by side, each with free energy on the vertical axis and reaction coordinate on the horizontal axis: an exergonic reaction whose products lie below the reactants, and an endergonic reaction whose products lie above them. Each marks the barrier from the reactants to the peak and the overall change between the two plateaus.',
  viewBox: '0 0 760 392',
  build() {
    let s = '';
    const side = (xAxis, xA, xP, xB, yR, yPk, yPr, title, dgLabel, dgCls, sum1, sum2) => {
      let g = axes(xAxis, 300, 56, xB + 30);
      g += dash(xA, yR, xB + 16, yR);
      g += dash(xP, yPr, xB + 16, yPr);
      g += dash(xA - 30, yPk, xP, yPk);
      g += profile([N(xA - 26, yR), N(xA, yR), N(xP, yPk), N(xB, yPr), N(xB + 16, yPr)]);
      g += tag(xP, yPk - 12, 'transition state ‡');
      g += measure(xA - 18, yPk, yR);
      g += text(xA - 26, (yPk + yR) / 2 + 4, 'ΔG‡', { cls: 'fg-tag-warn', anchor: 'end' });
      g += measure(xB + 16, Math.min(yR, yPr), Math.max(yR, yPr));
      g += text(xB + 22, (yR + yPr) / 2 + 4, dgLabel, { cls: dgCls, anchor: 'start' });
      g += text(xA - 26, yR + 20, 'reactants', { cls: 'fg-sm', anchor: 'start' });
      g += text(xB + 8, yPr + 20, 'products', { cls: 'fg-sm', anchor: 'end' });
      g += label((xA + xB) / 2, 340, title);
      g += text((xA + xB) / 2, 362, sum1, { cls: 'fg-sm' });
      g += text((xA + xB) / 2, 380, sum2, { cls: 'fg-sm' });
      return g;
    };
    s += side(52, 110, 200, 292, 150, 86, 248, 'EXERGONIC', 'ΔG° < 0', 'fg-tag-good',
      'Products more stable, so K is greater than 1.', 'The barrier still decides how long you wait.');
    s += rule(380, 60, 380, 300);
    s += side(432, 490, 580, 672, 150, 78, 100, 'ENDERGONIC', 'ΔG° > 0', 'fg-tag-warn',
      'Products less stable, so K is less than 1.', 'Uphill, yet a small barrier can make it quick.');
    return s;
  },
  caption: 'The same kind of one-step reaction, drawn with its products below the reactants (left) and above them (right). The barriers are about the same height in both panels; only the product plateau has moved.',
});

/* ------------------------------------------------------------------ */
/* 3. A transition state drawn next to an intermediate. */
function tsDrawing(cx, cy) {
  const O = N(cx - 90, cy), C = N(cx, cy), Br = N(cx + 90, cy);
  const Hu = N(cx, cy - 54), Hl = N(cx - 30, cy + 44), Hr = N(cx + 30, cy + 44);
  let g = partial(O, C) + partial(C, Br);
  g += bond(C, Hu) + wedge(C, Hl, { rTo: 12 }) + hash(C, Hr, { rTo: 12 });
  g += atom(O.x, O.y, 'HO') + atom(C.x, C.y, 'C') + atom(Br.x, Br.y, 'Br');
  g += atom(Hu.x, Hu.y, 'H', { r: 12 }) + atom(Hl.x, Hl.y, 'H', { r: 12 }) + atom(Hr.x, Hr.y, 'H', { r: 12 });
  g += text(O.x, cy - 24, 'δ−', { cls: 'fg-tag-warn' });
  g += text(Br.x, cy - 24, 'δ−', { cls: 'fg-tag-warn' });
  g += brackets(cx - 124, cx + 124, cy - 76, cy + 66);
  return g;
}
function cationDrawing(cx, cy) {
  const C = N(cx, cy), a = N(cx, cy - 56), b = N(cx - 48, cy + 28), c = N(cx + 48, cy + 28);
  let g = bond(C, a, { rTo: 17 }) + bond(C, b, { rTo: 17 }) + bond(C, c, { rTo: 17 });
  g += atom(C.x, C.y, 'C') + atom(a.x, a.y, 'CH₃', { r: 17 }) + atom(b.x, b.y, 'CH₃', { r: 17 }) + atom(c.x, c.y, 'CH₃', { r: 17 });
  g += plus(cx + 22, cy - 10);
  return g;
}
FIGURES.push({
  id: 'ts-vs-intermediate',
  section: 'energy-diagrams',
  anchor: '<h3>Transition state or intermediate?</h3>',
  alt: 'Left: the transition state for hydroxide attacking bromomethane, drawn inside square brackets with a double dagger. The HO group, the carbon and the bromine lie in a line, joined by dotted partial bonds, with delta minus on both the HO and the Br; the carbon keeps three hydrogens, one up, one on a wedge and one on a hash. Right: the tert-butyl cation, a carbon with three full bonds to CH3 groups and a full positive charge, drawn as an ordinary structure with no brackets.',
  viewBox: '0 0 760 290',
  build() {
    let s = label(190, 26, 'TRANSITION STATE: A PEAK');
    s += tsDrawing(190, 128);
    s += text(190, 232, 'dotted: bonds half made and half broken', { cls: 'fg-tag' });
    s += text(190, 250, 'the − charge is shared: δ− at each end', { cls: 'fg-tag' });
    s += text(190, 268, 'from HO⁻ + CH₃Br, one step', { cls: 'fg-sm' });
    s += rule(380, 20, 380, 270);
    s += label(570, 26, 'INTERMEDIATE: A VALLEY');
    s += cationDrawing(570, 132);
    s += text(570, 232, 'every bond complete', { cls: 'fg-tag-good' });
    s += text(570, 250, 'a full + charge, no brackets', { cls: 'fg-tag-good' });
    s += text(570, 268, 'from (CH₃)₃C–Br after Br⁻ leaves', { cls: 'fg-sm' });
    return s;
  },
  caption: 'A transition state (left) and an intermediate (right), each from a reaction you met in Leaving groups. Look at the bonds to carbon: dotted on the left, solid on the right.',
});
FIGURES.push({
  id: 'l-ts-vs-intermediate',
  lessons: LESSON,
  alt: 'Top: the transition state for hydroxide attacking bromomethane, in square brackets with a double dagger, with dotted partial bonds from carbon to HO and to Br and delta minus on each end. Bottom: the tert-butyl cation, a carbon with three full bonds to CH3 groups and a full positive charge, no brackets.',
  viewBox: '0 0 340 470',
  build() {
    let s = label(170, 22, 'TRANSITION STATE: A PEAK');
    s += tsDrawing(162, 120);
    s += tag(170, 218, 'dotted bonds, half made, half broken');
    s += tag(170, 236, 'δ− shared between the two ends');
    s += rule(20, 254, 320, 254);
    s += label(170, 280, 'INTERMEDIATE: A VALLEY');
    s += cationDrawing(170, 372);
    s += text(170, 436, 'every bond complete', { cls: 'fg-tag-good' });
    s += text(170, 454, 'a full + charge, no brackets', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Top, a transition state: dotted bonds, brackets and ‡. Bottom, an intermediate (a carbocation): an ordinary structure.',
});

/* ------------------------------------------------------------------ */
/* 4. Two steps: two humps, one valley. */
FIGURES.push({
  id: 'two-step-energy-profile',
  section: 'energy-diagrams',
  anchor: '<h3>Multi-step reactions: one hump per step</h3>',
  alt: 'A two-step reaction-coordinate diagram with free energy on the vertical axis and reaction coordinate on the horizontal axis. The curve climbs from the reactants to a first peak, TS1, drops into a valley labeled intermediate, climbs to a second peak, TS2, and falls to the products. Brackets under the axis mark the first hump as step 1 and the second as step 2.',
  viewBox: '0 0 760 330',
  build() {
    let s = axes(40, 270, 34, 720);
    const yR = 200, y1 = 90, yI = 160, y2 = 110, yP = 240;
    s += profile([N(100, yR), N(160, yR), N(260, y1), N(360, yI), N(460, y2), N(570, yP), N(640, yP)]);
    s += tag(260, y1 - 12, 'TS1 ‡');
    s += tag(460, y2 - 12, 'TS2 ‡');
    s += text(360, yI + 24, 'intermediate', { cls: 'fg-tag-good' });
    s += text(360, yI + 40, 'a real species, such as a carbocation', { cls: 'fg-sm' });
    s += tag(130, yR - 12, 'reactants');
    s += tag(605, yP - 12, 'products');
    s += rule(100, 300, 356, 300) + rule(100, 295, 100, 305) + rule(356, 295, 356, 305);
    s += rule(364, 300, 640, 300) + rule(364, 295, 364, 305) + rule(640, 295, 640, 305);
    s += tag(228, 318, 'step 1: first hump');
    s += tag(502, 318, 'step 2: second hump');
    return s;
  },
  caption: 'Two humps, so two steps. One valley between them, so one intermediate. Each peak is a transition state of its own.',
});

/* ------------------------------------------------------------------ */
/* 5. Which step sets the rate: two cases, with numbers. */
function rdsPanel(ox, oy, L, c) {
  const sm = L ? 'fg-tag' : 'fg-sm';
  const k = 5, y = (v) => oy + c.zero - k * v;
  let g = axes(ox + 30, oy + 250, oy + 8, ox + 345, 'free energy');
  const xs = { r0: ox + 62, r1: ox + 97, t1: ox + 147, i: ox + 197, t2: ox + 247, p0: ox + 292, p1: ox + 322 };
  const v = c.v;
  g += profile([N(xs.r0, y(0)), N(xs.r1, y(0)), N(xs.t1, y(v.t1)), N(xs.i, y(v.i)), N(xs.t2, y(v.t2)), N(xs.p0, y(v.p)), N(xs.p1, y(v.p))]);
  g += tag((xs.r0 + xs.r1) / 2, y(0) - 10, '0');
  g += tag(xs.t1, y(v.t1) - 10, `TS1 ${v.t1}`);
  g += text(xs.i, y(v.i) + 20, `${v.i}`.replace('-', '−'), { cls: 'fg-tag-good' });
  g += tag(xs.t2, y(v.t2) - 10, `TS2 ${v.t2}`);
  g += tag((xs.p0 + xs.p1) / 2, y(v.p) + 18, `${v.p}`.replace('-', '−'));
  /* The climb that sets the rate, with its guide lines. */
  const ax = ox + 338, from = c.from === 'r' ? y(0) : y(v.i), fromX = c.from === 'r' ? xs.r1 : xs.i;
  g += dash(fromX, from, ax, from) + dash(xs.t2, y(v.t2), ax, y(v.t2));
  g += measure(ax, y(v.t2), from);
  g += text(ax - 6, (from + y(v.t2)) / 2 + 4, `${c.span}`, { cls: 'fg-tag-warn', anchor: 'end' });
  g += label(ox + 185, oy + 292, c.title);
  g += text(ox + 185, oy + 312, c.l1, { cls: sm });
  g += text(ox + 185, oy + 330, c.l2, { cls: sm });
  return g;
}
const RDS_A = { zero: 150, v: { t1: 18, i: 14, t2: 22, p: -10 }, from: 'r', span: 22,
  title: 'INTERMEDIATE ABOVE THE START', l1: 'Back over TS1: 4. On over TS2: 8.', l2: 'Start to TS2, a climb of 22, sets the rate.' };
const RDS_B = { zero: 110, v: { t1: 15, i: -10, t2: 8, p: -20 }, from: 'i', span: 18,
  title: 'INTERMEDIATE IN A DEEP WELL', l1: 'Molecules pile up in the well at −10.', l2: 'Climb out of the well, 18, sets the rate.' };
FIGURES.push({
  id: 'rds-two-cases',
  section: 'energy-diagrams',
  anchor: '<h3>Multi-step reactions: one hump per step</h3>',
  alt: 'Two two-step diagrams, energies in kcal/mol relative to the reactants at 0, each with free energy up and reaction coordinate across. Left: TS1 at 18, intermediate at 14, TS2 at 22, products at minus 10; an arrow from the reactant level up to TS2 is labeled 22. Right: TS1 at 15, intermediate in a deep well at minus 10, TS2 at 8, products at minus 20; an arrow from the intermediate up to TS2 is labeled 18.',
  viewBox: '0 0 760 345',
  build() {
    return rdsPanel(0, 0, false, RDS_A) + rule(380, 10, 380, 330) + rdsPanel(385, 0, false, RDS_B);
  },
  caption: 'Energies in kcal/mol, measured from the reactants at 0. In each panel the arrow marks the biggest climb from a valley up to a peak that comes after it; that climb sets the rate.',
});
FIGURES.push({
  id: 'l-rds-two-cases',
  lessons: LESSON,
  alt: 'Two stacked two-step diagrams in kcal/mol. Top: TS1 18, intermediate 14, TS2 22, products minus 10; the arrow from the reactants to TS2 is labeled 22. Bottom: TS1 15, intermediate minus 10, TS2 8, products minus 20; the arrow from the intermediate to TS2 is labeled 18.',
  viewBox: '0 0 340 700',
  build() {
    return rdsPanel(-10, 0, true, RDS_A) + rule(20, 346, 320, 346) + rdsPanel(-10, 358, true, RDS_B);
  },
  caption: 'Find the biggest climb from a valley up to a later peak. Top: 0 to 22. Bottom: −10 to 8.',
});

/* ------------------------------------------------------------------ */
/* 6. A catalyst lowers the peak and leaves the plateaus alone. */
FIGURES.push({
  id: 'catalyst-lowers-the-barrier',
  section: 'energy-diagrams',
  anchor: '<h3>Catalysts and temperature: two ways to go faster</h3>',
  alt: 'One reaction drawn twice on the same axes, free energy up and reaction coordinate across: an uncatalyzed route with a tall barrier and a catalyzed route with a much lower barrier, both starting and ending at exactly the same two energy levels. Arrows mark the big and the small activation energies and the unchanged overall free-energy change.',
  viewBox: '0 0 760 382',
  build() {
    let s = axes(70, 306, 52, 706);
    const yR = 196, yPr = 262, yHi = 76, yLo = 146;
    s += profile([N(96, yR), N(150, yR), N(330, yHi), N(512, yPr), N(596, yPr)], 'fg-bond-soft');
    s += profile([N(96, yR), N(150, yR), N(330, yLo), N(512, yPr), N(596, yPr)]);
    s += text(330, yHi - 12, 'uncatalyzed ‡', { cls: 'fg-tag-warn' });
    s += text(330, yLo + 22, 'catalyzed ‡', { cls: 'fg-tag-good' });
    s += dash(186, yHi, 330, yHi) + dash(186, yLo, 330, yLo);
    s += measure(186, yHi, yR);
    s += text(178, 120, 'big ΔG‡', { cls: 'fg-tag-warn', anchor: 'end' });
    s += measure(214, yLo, yR);
    s += text(214, 216, 'small ΔG‡', { cls: 'fg-tag-good' });
    s += dash(150, yR, 646, yR) + dash(596, yPr, 646, yPr);
    s += measure(646, yR, yPr);
    s += text(656, (yR + yPr) / 2 + 4, 'ΔG° unchanged', { cls: 'fg-tag-good', anchor: 'start' });
    s += text(123, yR - 14, 'reactants', { cls: 'fg-sm' });
    s += text(554, yPr + 20, 'products', { cls: 'fg-sm' });
    s += label(378, 346, 'Only the peak moved. Both plateaus, and so K, stay where they were.');
    s += text(378, 368, 'The reverse barrier drops by the same amount, so both directions speed up.', { cls: 'fg-sm' });
    return s;
  },
  caption: 'One reaction by two routes, on the same axes. The catalyzed curve (bold) starts and ends at the same levels as the uncatalyzed one (faint); only the height of the hill differs.',
});
FIGURES.push({
  id: 'l-catalyst-lowers-the-barrier',
  lessons: LESSON,
  alt: 'One reaction on the same axes, free energy up and reaction coordinate across: a faint uncatalyzed curve with a tall peak and a bold catalyzed curve with a lower peak, both starting at the same reactant level and ending at the same product level. An arrow between the plateaus is labeled delta G degree, same.',
  viewBox: '0 0 340 296',
  build() {
    let s = axes(24, 220, 26, 330);
    const yR = 130, yPr = 176, yHi = 52, yLo = 100;
    s += profile([N(60, yR), N(96, yR), N(180, yHi), N(262, yPr), N(292, yPr)], 'fg-bond-soft');
    s += profile([N(60, yR), N(96, yR), N(180, yLo), N(262, yPr), N(292, yPr)]);
    s += text(180, yHi - 10, '‡', { cls: 'fg-lbl' });
    s += text(180, yLo - 8, '‡', { cls: 'fg-lbl' });
    s += dash(96, yR, 314, yR) + dash(292, yPr, 314, yPr);
    s += measure(314, yR, yPr);
    s += text(320, yPr + 22, 'ΔG° same', { cls: 'fg-tag-good', anchor: 'end' });
    s += tag(78, yR + 20, 'reactants');
    s += tag(238, yPr + 22, 'products', { anchor: 'end' });
    s += text(24, 256, 'faint curve: uncatalyzed, tall peak', { cls: 'fg-tag-mut', anchor: 'start' });
    s += text(24, 276, 'bold curve: catalyzed, lower peak', { cls: 'fg-tag', anchor: 'start' });
    return s;
  },
  caption: 'The catalyst lowers the peak. Both plateaus stay put, so ΔG° and K do not change.',
});

/* ------------------------------------------------------------------ */
/* 7. Temperature: the high-energy tail. */
function tailCurves(x0, yBase, W, H, Ea, L) {
  /* f(E) = 2·sqrt(E/π)·T^(-3/2)·exp(-E/T), a Maxwell–Boltzmann energy
     distribution; the two curves enclose the same area. */
  const Emax = 7, f = (E, T) => 2 * Math.sqrt(E / Math.PI) * Math.pow(T, -1.5) * Math.exp(-E / T);
  const peak = f(0.5, 1), X = (E) => x0 + (E / Emax) * W, Y = (v) => yBase - (v / peak) * H;
  const pts = (T, a = 0) => { const p = []; for (let i = 0; i <= 140; i++) { const E = a + (Emax - a) * i / 140; p.push(`${X(E).toFixed(1)} ${Y(f(E, T)).toFixed(1)}`); } return p; };
  let g = '';
  const tail = (T, cls, op) => `<path class="${cls}" opacity="${op}" d="M${X(Ea).toFixed(1)} ${yBase} L${pts(T, Ea).join(' L')} L${X(Emax).toFixed(1)} ${yBase} Z"></path>`;
  g += tail(1.8, 'fg-fill-warn', 0.35) + tail(1, 'fg-fill-hi', 0.55);
  g += `<path class="fg-bond-soft" fill="none" d="M${pts(1).join(' L')}"></path>`;
  g += `<path class="fg-bond-hi" fill="none" d="M${pts(1.8).join(' L')}"></path>`;
  g += dash(X(Ea), yBase, X(Ea), yBase - H - 8);
  return { g, X, Y, f };
}
FIGURES.push({
  id: 'temperature-energy-tail',
  section: 'energy-diagrams',
  anchor: '<h3>Catalysts and temperature: two ways to go faster</h3>',
  alt: 'Graph of number of molecules against the energy one molecule carries, for a cool and a warm sample. The cool curve is tall and narrow near low energy; the warm curve is lower and spread further to the right. A dashed vertical line marks the energy needed to reach the transition state. The area under each curve beyond that line is shaded, and the shaded tail of the warm curve is much larger.',
  viewBox: '0 0 760 300',
  build() {
    const x0 = 70, yB = 240, W = 620, H = 180, Ea = 3.4;
    let s = frame(x0, yB, 40, x0 + W + 10);
    s += text(x0 + 9, 45, 'number of molecules', { cls: 'fg-tag', anchor: 'start' });
    s += text(x0 + W + 10, yB + 17, 'energy of one molecule →', { cls: 'fg-tag', anchor: 'end' });
    const c = tailCurves(x0, yB, W, H, Ea, false);
    s += c.g;
    s += text(c.X(1.05) + 6, c.Y(c.f(1.05, 1)), 'cool', { cls: 'fg-tag-mut', anchor: 'start' });
    s += text(c.X(1.4), c.Y(c.f(1.4, 1.8)) - 10, 'warm', { cls: 'fg-tag', anchor: 'start' });
    s += text(c.X(Ea) + 8, 58, 'energy needed to reach the transition state', { cls: 'fg-tag-warn', anchor: 'start' });
    s += text(c.X(Ea) + 8, 74, '(set by ΔG‡)', { cls: 'fg-sm', anchor: 'start' });
    s += text(c.X(5.2), 204, 'shaded: molecules that can cross', { cls: 'fg-sm', anchor: 'start' });
    s += text(380, 290, 'Warming leaves the barrier where it is and puts far more molecules past it.', { cls: 'fg-lbl' });
    return s;
  },
  caption: 'Energy spread over a population of molecules, at two temperatures. Compare the two shaded areas to the right of the dashed line.',
});
FIGURES.push({
  id: 'l-temperature-energy-tail',
  lessons: LESSON,
  alt: 'Number of molecules against the energy of one molecule, for a cool and a warm sample. The warm curve is flatter and spreads further right. A dashed line marks the energy needed to reach the transition state; the shaded area beyond it is much larger for the warm sample.',
  viewBox: '0 0 340 270',
  build() {
    const x0 = 24, yB = 196, W = 296, H = 150, Ea = 3.4;
    let s = frame(x0, yB, 18, x0 + W + 8);
    s += text(x0 + 9, 23, 'number of molecules', { cls: 'fg-tag', anchor: 'start' });
    s += text(x0 + W + 8, yB + 17, 'energy of one molecule →', { cls: 'fg-tag', anchor: 'end' });
    const c = tailCurves(x0, yB, W, H, Ea, true);
    s += c.g;
    s += text(c.X(1.05) + 5, c.Y(c.f(1.05, 1)), 'cool', { cls: 'fg-tag-mut', anchor: 'start' });
    s += text(c.X(1.5), c.Y(c.f(1.5, 1.8)) - 8, 'warm', { cls: 'fg-tag', anchor: 'start' });
    s += text(c.X(Ea) + 6, 64, 'needed to', { cls: 'fg-tag-warn', anchor: 'start' });
    s += text(c.X(Ea) + 6, 78, 'cross ΔG‡', { cls: 'fg-tag-warn', anchor: 'start' });
    s += text(24, 240, 'shaded: molecules with enough energy', { cls: 'fg-tag', anchor: 'start' });
    s += text(24, 258, 'to cross; far more when warm', { cls: 'fg-tag', anchor: 'start' });
    return s;
  },
  caption: 'Warming does not lower the barrier. It puts more molecules in the high-energy tail beyond it.',
});

/* ------------------------------------------------------------------ */
/* 8. Hammond: where the peak sits, and what the structure there looks like. */
function hammondPanel(ox, oy, L, c) {
  const sm = L ? 'fg-tag' : 'fg-sm';
  let g = axes(ox + 30, oy + 230, oy + 22, ox + 345, 'energy');
  const yR = oy + c.yR, yT = oy + c.yT, yP = oy + c.yP, xT = ox + c.xT;
  g += profile([N(ox + 52, yR), N(ox + 100, yR), N(xT, yT), N(ox + 280, yP), N(ox + 330, yP)]);
  g += dash(xT, yT + 6, xT, oy + 230);
  g += tag(xT, yT - 12, c.peakWord);
  g += text(ox + 76, yR + 20, c.left, { cls: 'fg-tag', anchor: 'middle' });
  g += text(ox + 305, yP + (yP > yR ? 20 : -12), c.right, { cls: 'fg-tag', anchor: 'middle' });
  g += label(ox + 185, oy + 268, c.title);
  /* The transition-state structure: X···H···CR₃ with the two partial bonds
     at the lengths Hammond predicts. */
  const cy = oy + 318;
  const X = N(ox + 95, cy), H = N(ox + c.xH, cy), C = N(ox + 275, cy);
  g += partial(X, H, 16, 12) + partial(H, C, 12, 17);
  g += atom(X.x, X.y, c.x) + atom(H.x, H.y, 'H', { r: 12 }) + atom(C.x, C.y, 'CR₃', { r: 17 });
  g += brackets(ox + 66, ox + 304, cy - 26, cy + 26);
  g += text(ox + 185, oy + 368, c.n1, { cls: sm });
  g += text(ox + 185, oy + 386, c.n2, { cls: sm });
  return g;
}
const HAM_EARLY = { yR: 140, yT: 116, yP: 172, xT: 142, peakWord: 'TS ‡ sits early', left: 'Cl• + H–CR₃', right: 'HCl + •CR₃',
  title: 'DOWNHILL (ΔH ≈ −5): EARLY TS', x: 'Cl', xH: 222,
  n1: 'Cl···H long: the new bond has barely begun.', n2: 'H···C short: the old bond is barely stretched.' };
const HAM_LATE = { yR: 186, yT: 94, yP: 116, xT: 250, peakWord: 'TS ‡ sits late', left: 'Br• + H–CR₃', right: 'HBr + •CR₃',
  title: 'UPHILL (ΔH ≈ +10.5): LATE TS', x: 'Br', xH: 148,
  n1: 'Br···H short: the new bond is nearly made.', n2: 'H···C long: the old bond is nearly broken.' };
FIGURES.push({
  id: 'hammond-ts-position',
  section: 'energy-diagrams',
  anchor: '<h3>The Hammond postulate</h3>',
  alt: 'Two energy diagrams with energy up and reaction coordinate across, each with the transition-state structure drawn underneath. Left: a chlorine atom taking a hydrogen from an alkane, a downhill step whose peak sits early, close to the reactants and only a little above them; in its transition state, Cl to H is a long dotted bond and H to C a short one. Right: a bromine atom taking the same hydrogen, an uphill step whose peak sits late, close to the products; in its transition state Br to H is short and H to C is long.',
  viewBox: '0 0 760 400',
  build() {
    return hammondPanel(0, 0, false, HAM_EARLY) + rule(380, 20, 380, 390) + hammondPanel(385, 0, false, HAM_LATE);
  },
  caption: 'The dashed line under each peak shows where along the reaction the transition state sits. Under each diagram is that transition state, with each dotted bond drawn at the length Hammond predicts.',
});
FIGURES.push({
  id: 'l-hammond-ts-position',
  lessons: LESSON,
  alt: 'Two stacked energy diagrams. Top: chlorine taking a hydrogen from an alkane, a downhill step with the peak early and low; its transition state has a long Cl to H dotted bond and a short H to C dotted bond. Bottom: bromine taking the same hydrogen, an uphill step with the peak late, near the products; its transition state has a short Br to H bond and a long H to C bond.',
  viewBox: '0 0 340 800',
  build() {
    return hammondPanel(-10, 0, true, HAM_EARLY) + rule(20, 398, 320, 398) + hammondPanel(-10, 408, true, HAM_LATE);
  },
  caption: 'Downhill: the peak sits early and looks like the reactants. Uphill: it sits late and looks like the products.',
});

/* ------------------------------------------------------------------ */
/* 9. Hammond and selectivity: the 1° and 3° routes on the same axes. */
function selPanel(ox, oy, L, c) {
  const sm = L ? 'fg-tag' : 'fg-sm';
  const xA = ox + 72, xB = ox + 296;
  let g = axes(ox + 30, oy + 250, oy + 22, ox + 345, 'energy');
  const yR = oy + c.yR, y1 = oy + c.yPk1, y3 = oy + c.yPk3, p1 = oy + c.yP1, p3 = oy + c.yP3, xP = ox + c.xP;
  g += profile([N(xA - 22, yR), N(xA, yR), N(xP, y3), N(xB, p3), N(xB + 24, p3)], 'fg-bond-soft');
  g += profile([N(xA - 22, yR), N(xA, yR), N(xP, y1), N(xB, p1), N(xB + 24, p1)]);
  g += dash(xA - 22, y1, xP, y1) + dash(xA - 22, y3, xP, y3);
  g += measure(xA - 16, y1, y3);
  g += text(xA - 8, y1 - 10, c.drop, { cls: 'fg-tag-warn', anchor: 'start' });
  g += text(ox + 36, yR + 20, c.left, { cls: 'fg-tag', anchor: 'start' });
  g += text(xB + 28, p1 + 4, '1°', { cls: 'fg-tag', anchor: 'start' });
  g += text(xB + 28, p3 + 4, '3°', { cls: 'fg-tag-mut', anchor: 'start' });
  g += label(ox + 185, oy + 288, c.title);
  g += text(ox + 185, oy + 308, c.n1, { cls: sm });
  g += text(ox + 185, oy + 326, c.n2, { cls: sm });
  return g;
}
const SEL_CL = { yR: 150, yPk1: 118, yPk3: 124, yP1: 184, yP3: 210, xP: 124, drop: 'barely lower', left: 'Cl• + R–H',
  title: 'CHLORINE: EARLY TS', n1: 'The two barriers are almost the same height,', n2: 'so both radicals form at similar rates.' };
const SEL_BR = { yR: 214, yPk1: 70, yPk3: 94, yP1: 104, yP3: 130, xP: 248, drop: 'much lower', left: 'Br• + R–H',
  title: 'BROMINE: LATE TS', n1: 'The 3° barrier drops almost as far as the product,', n2: 'so the 3° radical forms far faster.' };
FIGURES.push({
  id: 'hammond-selectivity',
  section: 'energy-diagrams',
  anchor: '<h3>The Hammond postulate</h3>',
  alt: 'Two panels, energy up and reaction coordinate across. Each shows a bold curve from the halogen atom plus alkane to a primary radical and a faint curve to the more stable tertiary radical, which ends lower. Left, chlorine: the peak is early and the faint curve peaks only slightly lower than the bold one. Right, bromine: the peak is late and the faint curve peaks much lower, by nearly the full gap between the two radicals.',
  viewBox: '0 0 760 340',
  build() {
    return selPanel(0, 0, false, SEL_CL) + rule(380, 20, 380, 330) + selPanel(385, 0, false, SEL_BR);
  },
  caption: 'The bold curve, labeled 1&deg;, leads to the 1&deg; radical; the faint curve, labeled 3&deg;, leads to the more stable 3&deg; radical. Compare how far the faint peak sits below the bold one in each panel.',
});
FIGURES.push({
  id: 'l-hammond-selectivity',
  lessons: LESSON,
  alt: 'Two stacked panels. Top, chlorine: the routes to the primary and tertiary radicals have almost the same peak height. Bottom, bromine: the route to the tertiary radical peaks much lower, by nearly the full gap between the two radicals.',
  viewBox: '0 0 340 690',
  build() {
    return selPanel(-10, 0, true, SEL_CL) + rule(20, 340, 320, 340) + selPanel(-10, 352, true, SEL_BR);
  },
  caption: 'The late peak (bottom) follows the products down. The early peak (top) barely moves.',
});

/* ------------------------------------------------------------------ */
/* 10. Preview: one reactant, two products. */
FIGURES.push({
  id: 'kinetic-thermodynamic-preview',
  section: 'energy-diagrams',
  anchor: '<h3>A preview: kinetic and thermodynamic products</h3>',
  alt: 'One reactant plateau with two curves leaving it, free energy up and reaction coordinate across. The bold curve climbs a lower peak and ends at product A, which is only a little below the reactants. The faint curve climbs a higher peak and ends at product B, which lies much lower. A is labeled kinetic product, B thermodynamic product.',
  viewBox: '0 0 760 320',
  build() {
    let s = axes(40, 270, 34, 720);
    const yR = 150;
    s += profile([N(110, yR), N(180, yR), N(380, 60), N(520, 236), N(580, 236)], 'fg-bond-soft');
    s += profile([N(110, yR), N(180, yR), N(330, 104), N(520, 184), N(580, 184)]);
    s += tag(145, yR + 20, 'reactant');
    s += text(380, 48, '‡ higher peak', { cls: 'fg-tag-mut' });
    s += text(588, 188, 'A: kinetic product', { cls: 'fg-tag', anchor: 'start' });
    s += text(588, 204, '(lower peak)', { cls: 'fg-sm', anchor: 'start' });
    s += text(588, 240, 'B: thermodynamic product', { cls: 'fg-tag-mut', anchor: 'start' });
    s += text(588, 256, '(deeper well)', { cls: 'fg-sm', anchor: 'start' });
    s += text(380, 304, 'Bold curve: the route to A. Faint curve: the route to B.', { cls: 'fg-sm' });
    return s;
  },
  caption: 'A forms faster because its peak is lower. B is more stable because its well is deeper. Nothing requires one product to win on both counts.',
});

export default FIGURES;
